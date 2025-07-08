require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());

// Firebase Admin Setup
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// FCM Token Storage
let savedTokens = [];

app.post("/save-token", (req, res) => {
  const { token } = req.body;
  if (token && !savedTokens.includes(token)) {
    savedTokens.push(token);
    console.log("Token saved:", token);
  }
  res.sendStatus(200);
});

app.get("/send-notification", async (req, res) => {
  if (!savedTokens.length) {
    return res.status(400).json({ success: false, message: "No device tokens saved." });
  }

  const message = {
    notification: {
      title: "Test Notification",
      body: "🚀 This is a test notification from backend!",
    },
    tokens: savedTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Successfully sent message:", response);
    res.json({ success: true, response });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error });
  }
});

// Fetch plant topics from API
const loadPlantTopics = async () => {
  try {
    const response = await axios.get("https://water-pump.onrender.com/api/planttopics");
    const topics = response.data;
    console.log("Loaded plant topics from API:", topics);
    return topics.map(topic => ({
      plant_id: topic.plant_id,
      plant_name: `Plant ${topic.plant_id}`, // Adjust if plant_name is available in API
      SENSOR_TOPIC: topic.sensor_topic,
      MOTOR_TOPIC: topic.motor_topic,
    }));
  } catch (error) {
    console.error("Error fetching plant topics from API:", error.message);
    return [];
  }
};

// MQTT Setup
const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");
let latestSensorData = {};

// Subscribe to sensor topics from API
const subscribeToSensorTopics = async () => {
  const plants = await loadPlantTopics();
  if (!plants.length) {
    console.error("No plant topics found, subscribing to default topic.");
  }

  plants.forEach((plant) => {
    mqttClient.subscribe(plant.SENSOR_TOPIC, (err) => {
      if (err) {
        console.error(`Error subscribing to topic ${plant.SENSOR_TOPIC}:`, err.message);
      } else {
        console.log(`Subscribed to topic: ${plant.SENSOR_TOPIC}`);
      }
    });
  });
};

// Log runtime and sensor data to file every 30 seconds
const logRuntimeAndSensorData = async () => {
  const timestamp = new Date().toISOString();
  let logContent = `=== Runtime and Sensor Log (${timestamp}) ===\n`;

  const plants = await loadPlantTopics();
  let hasData = false;

  for (const plant of plants) {
    const plantId = plant.plant_id;
    const plantName = plant.plant_name || "Unknown Plant";
    const data = latestSensorData[plantId];

    if (data) {
      hasData = true;
      const motorRuntimeSec = data.motor_runtime_sec || 0;
      const totalRuntimeSec = data.total_runtime_sec || 0;
      const formattedTotalRunTime = new Date(totalRuntimeSec * 1000).toISOString().substr(11, 8);

      logContent += `Plant ID: ${plantId}, Plant Name: ${plantName}\n`;
      logContent += `  Status: ${data.plant_status || "NA"}\n`;
      logContent += `  Motors:\n`;
      logContent += `    Motor 1 Status: ${data.motor1_status || "NA"}, Runtime: ${
        data.motor1_status === "ON" ? new Date(motorRuntimeSec * 1000).toISOString().substr(11, 8) : "00:00:00"
      }\n`;
      logContent += `    Motor 2 Status: ${data.motor2_status || "NA"}, Runtime: ${
        data.motor2_status === "ON" ? new Date(motorRuntimeSec * 1000).toISOString().substr(11, 8) : "00:00:00"
      }\n`;
      logContent += `  Total Plant Runtime: ${formattedTotalRunTime}\n`;

      // Log sensor data
      logContent += `  Sensors:\n`;
      const sensorKeys = Object.keys(data).filter(key => 
        ![
          'plant_id', 'plant_status', 'motor1_status', 'motor2_status', 
          'motor_runtime_sec', 'total_runtime_sec'
        ].includes(key)
      );
      if (sensorKeys.length > 0) {
        sensorKeys.forEach(key => {
          const value = data[key] !== undefined && data[key] !== null ? data[key] : "NA";
          const sensorName = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          logContent += `    ${sensorName}: ${value}\n`;
        });
      } else {
        logContent += `    No sensor data available\n`;
      }
      logContent += `----------------------------\n`;
    }
  }

  if (hasData) {
    const logDir = path.join(__dirname, 'logs');
    const logFile = path.join(logDir, 'runtime_sensor_log.txt');
    
    try {
      // Ensure logs directory exists
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(logFile, logContent);
      console.log(`Runtime and sensor data appended to ${logFile} at ${timestamp}`);
    } catch (error) {
      console.error("Error appending to runtime_sensor_log.txt:", error.message);
    }
  }
};

mqttClient.on("connect", async () => {
  console.log("Connected to MQTT broker");
  await subscribeToSensorTopics();
  setInterval(logRuntimeAndSensorData, 30 * 1000);
});

mqttClient.on("message", async (topic, message) => {
  try {
    const plants = await loadPlantTopics();
    const plant = plants.find((p) => p.SENSOR_TOPIC === topic);
    if (!plant) {
      console.warn(`No plant found for topic: ${topic}`);
      return;
    }

    const plantId = plant.plant_id;
    const data = JSON.parse(message.toString());

    latestSensorData[plantId] = data;
    const motoBoundData = { id: plantId, sensordata: data };

    io.emit("sensor_data", { data: motoBoundData });

    console.log(`Received data for plant ${plantId}:`, data);

    let motorStatus = "OFF";
    let motorNumber = 1;
    if (data.motor1_status === "ON") {
      motorStatus = "ON";
      motorNumber = 1;
    } else if (data.motor2_status === "ON") {
      motorStatus = "ON";
      motorNumber = 2;
    }

    io.emit("motor_status_update", {
      plantId,
      command: motorStatus,
      motorNumber,
      timestamp: Date.now(),
    });

    const residualCl = parseFloat(data.residual_chlorine_plant);
    if (!isNaN(residualCl) && residualCl > 5 && savedTokens.length > 0) {
      const chlorineAlert = {
        notification: {
          title: `⚠️ High Chlorine Level Detected - Plant ${plantId}`,
          body: `Residual Cl (Plant ${plantId}): ${residualCl} ppm`,
        },
        tokens: savedTokens,
      };

      await admin.messaging().sendEachForMulticast(chlorineAlert);
      console.log(`🚨 Chlorine alert notification sent for plant ${plantId}.`);
    }
  } catch (e) {
    console.error("Error parsing MQTT message:", e.message);
  }
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  socket.emit("sensor_data", { data: latestSensorData });

  socket.on("motor_control", async (data) => {
    console.log("Received motor_control:", data);
    const { command, plantId } = data;

    if (!plantId) {
      console.warn("No plantId provided in motor_control message.");
      return socket.emit("error", { message: "plantId is required" });
    }

    if (!["ON", "OFF"].includes(command)) {
      console.warn(`Invalid command received: ${command}`);
      return socket.emit("error", { message: "Invalid command. Use 'ON' or 'OFF'" });
    }

    if (!mqttClient.connected) {
      console.warn("MQTT client not connected, cannot publish.");
      return socket.emit("error", { message: "MQTT client not connected" });
    }

    const plants = await loadPlantTopics();
    const plant = plants.find((p) => p.plant_id.toString() === plantId.toString());
    if (!plant) {
      console.warn(`No MOTOR_TOPIC found for plantId: ${plantId}`);
      return socket.emit("error", { message: `No plant found for plantId: ${plantId}` });
    }

    const motorTopic = plant.MOTOR_TOPIC;
    const payload = String(command);

    mqttClient.publish(motorTopic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Error publishing motor command to ${motorTopic}:`, err.message);
        socket.emit("error", { message: `Failed to publish command to ${motorTopic}` });
      } else {
        console.log(`Published motor command to ${motorTopic}:`, payload);
        io.emit("motor_status_update", {
          plantId,
          command: payload,
          timestamp: Date.now(),
        });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

// Prevent serving static files or log file
app.use((req, res, next) => {
  if (req.path.includes('runtime_sensor_log.txt')) {
    return res.status(403).send('Access denied');
  }
  next();
});

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// download file removed