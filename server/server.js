require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const fs = require("fs").promises;

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

// Read plant topics from JSON file
const loadPlantTopics = async () => {
  try {
    const data = await fs.readFile("./topics.json", "utf8");
    const topics = JSON.parse(data);
    console.log("Loaded plant topics:", topics.plants);
    return topics.plants;
  } catch (error) {
    console.error("Error reading topics.json:", error.message);
    return [];
  }
};

// MQTT Setup
const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");
let latestSensorData = {};

// Subscribe to sensor topics from JSON
const subscribeToSensorTopics = async () => {
  const plants = await loadPlantTopics();
  if (!plants.length) {
    console.error("No plant topics found, subscribing to default topic.");
    mqttClient.subscribe("watertreatment1/plant1/data", (err) => {
      if (err) {
        console.error("Error subscribing to default topic:", err.message);
      } else {
        console.log("Subscribed to default topic: watertreatment1/plant1/data");
      }
    });
    return;
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

mqttClient.on("connect", async () => {
  console.log("Connected to MQTT broker");
  await subscribeToSensorTopics();
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

    // Broadcast motor status update based on sensor data
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

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// after change