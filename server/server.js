require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const axios = require("axios");

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
  service_account: {
    email: serviceAccount.client_email,
  },
});

// FCM Token Storage
let savedTokens = [];

app.post("/save-token", (req, res) => {
  const { token } = req.body.data;
  if (token && !savedTokens.includes(token)) {
    savedTokens.push(token);
    console.log("Token saved:", token);
  }
  res.sendStatus(200);
});

app.get("/send", async (req, res) => {
  if (!savedTokens.length) {
    res.status(400).send({ success: false, message: "No device tokens saved." });
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
      plant_name: `Plant ${topic.plant_id}`,
      SENSOR_TOPIC: topic.sensor_topic,
      MOTOR_TOPIC: topic.motor_topic,
    }));
  } catch (error) {
    console.error("Error fetching plant topics from API:", error.message);
    return [];
  }
};

// Fetch motor data for a specific plant
const fetchMotorData = async (plantId) => {
  try {
    const response = await axios.get(`https://water-pump.onrender.com/api/plantmotors/plant/${plantId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error fetching motor data for plant ${plantId}:`, error.message);
    return [];
  }
};

// Build API payload
const buildApiPayload = (plantId, sensorData, motorsFromApi) => {
  const secondsToTimeString = (seconds) => {
    const date = new Date(seconds * 1000);
    return date.toISOString().substr(11, 8);
  };

  const motors = [
    { key: "motor1_status", name: "motor1" },
    { key: "motor2_status", name: "motor2" },
  ]
    .map(({ key, name }) => {
      const matchingMotor = motorsFromApi.find((motor) => motor.motor_name === name);
      const motorId = matchingMotor ? matchingMotor.motor_id : `unknown-${plantId}-${name}`;
      return {
        motor_id: motorId,
        is_running: sensorData[key] === "ON",
        motor_run_time_at_snapshot: secondsToTimeString(sensorData.motor_runtime_sec || 0),
        motor_status: sensorData[key] || "OFF",
        last_motor_fault: "None",
      };
    })
    .filter(motor => motor.is_running); // Only include motors that are ON

  const generateCurrentTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const payload = {
    plant_id: plantId,
    recorded_at: generateCurrentTimestamp(),
    plant_total_time: secondsToTimeString(sensorData.total_runtime_sec || 0),
    plant_status: sensorData.plant_status || "IDLE",
    operational_mode: sensorData.manual_mode_active === 1 ? "Manual" : "Automatic",
    last_fault_message: sensorData.last_fault_message || "None",
    water_inflow_status: sensorData.water_inlet_valve_status === "ON",
    HOCL_valve_status: sensorData.hocl_valve_status === "ON",
    chlorine_gas_valve_status: sensorData.chlorine_gas_valve_status === "ON",
    water_level_glr: sensorData.water_level_meter || 0,
    water_level_oht: 0,
    vacuum_switch_status: sensorData.vacuum_switch_ok === 1 ? "OK" : "NOT OK",
    residual_chlorine_plant: sensorData.residual_chlorine_plant || 0,
    residual_chlorine_farthest: 0,
    chlorine_cylinder_weight: 0,
    chlorine_leakage_detected: false,
    physical_on_button_pressed: false,
    manual_mode_pressed: sensorData.manual_mode_active === 1,
    plant_voltage_l1: 0,
    plant_voltage_l2: 0,
    plant_voltage_l3: 0,
    plant_current_l1: 0,
    plant_current_l2: 0,
    plant_current_l3: 0,
    motors,
  };

  return payload;
};

// MQTT Setup
const mqttClient = mqtt.connect("mosquitto-fsogoowk8okc0c0ccwk0k8ow.195.200.14.84.sslip.io");
let latestSensorData = {};

// Cache for plant topics
let cachedPlantTopics = [];

// Subscribe to sensor topics from cached plant topics
const subscribeToSensorTopics = async () => {
  if (!cachedPlantTopics.length) {
    cachedPlantTopics = await loadPlantTopics();
  }

  if (!cachedPlantTopics.length) {
    console.error("No plant topics found, subscribing to default topic.");
    return;
  }

  cachedPlantTopics.forEach((plant) => {
    mqttClient.subscribe(plant.SENSOR_TOPIC, (err) => {
      if (err) {
        console.error(`Error subscribing to topic ${plant.SENSOR_TOPIC}:`, err.message);
      } else {
        console.log(`Subscribed to topic: ${plant.SENSOR_TOPIC}`);
      }
    });
  });
};

// Post sensor data to API every 30 seconds
const logRuntimeAndSensorData = async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Posting sensor data to API for all plants`);

  for (const plant of cachedPlantTopics) {
    const plantId = plant.plant_id;
    const sensorData = latestSensorData[plantId];

    if (!sensorData) {
      console.log(`[${timestamp}] No sensor data for plant ${plantId}`);
      continue;
    }

    console.log(`[${timestamp}] Processing data for plant ${plantId}`, sensorData);

    try {
      const motorsFromApi = await fetchMotorData(plantId);
      const payload = buildApiPayload(plantId, sensorData, motorsFromApi);
      console.log(`[${timestamp}] Posting payload for plant ${plantId}:`, payload);

      const response = await axios.post(
        "https://water-pump.onrender.com/api/plantops",
        payload,
        process.env.API_TOKEN ? { headers: { Authorization: `Bearer ${process.env.API_TOKEN}` } } : {}
      );
      console.log(`[${timestamp}] Successfully posted data for plant ${plantId}:`, response.data);
    } catch (error) {
      console.error(`[${timestamp}] Error posting data for plant ${plantId} to /api/plantops:`, error.message);
      if (savedTokens.length > 0) {
        const alert = {
          notification: {
            title: `⚠️ API Failure for Plant ${plantId}`,
            body: `Failed to post data to /api/plantops: ${error.message}`,
          },
          tokens: savedTokens,
        };
        await admin.messaging().sendEachForMulticast(alert);
        console.log(`[${timestamp}] Alert sent for API failure on plant ${plantId}`);
      }
    }
  }
};

// Initialize plant topics and MQTT subscriptions on startup
const initializeServer = async () => {
  cachedPlantTopics = await loadPlantTopics();
  await subscribeToSensorTopics();
};

mqttClient.on("connect", async () => {
  console.log("Connected to MQTT broker");
  await initializeServer();
  setInterval(logRuntimeAndSensorData, 30 * 1000); // Run every 30 seconds
});

mqttClient.on("message", async (topic, message) => {
  try {
    const plant = cachedPlantTopics.find((p) => p.SENSOR_TOPIC === topic);
    if (!plant) {
      console.warn(`[${new Date().toISOString()}] No plant found for topic: ${topic}`);
      return;
    }

    const plantId = plant.plant_id;
    const data = JSON.parse(message.toString());
    console.log(`[${new Date().toISOString()}] Received data for plant ${plantId}:`, data);

    latestSensorData[plantId] = data;
    const motoBoundData = { id: plantId, sensordata: data };

    io.emit("sensor_data", { data: motoBoundData });

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
      console.log(`[${new Date().toISOString()}] Chlorine alert notification sent for plant ${plantId}`);
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error parsing MQTT message:`, e.message);
  }
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] Frontend connected:`, socket.id);

  socket.emit("sensor_data", { data: latestSensorData });

  socket.on("motor_control", async (data) => {
    console.log(`[${new Date().toISOString()}] Received motor_control:`, data);
    const { command, plantId } = data;

    if (!plantId) {
      console.warn(`[${new Date().toISOString()}] No plantId provided in motor_control message`);
      return socket.emit("error", { message: "plantId is required" });
    }

    if (!["ON", "OFF"].includes(command)) {
      console.warn(`[${new Date().toISOString()}] Invalid command received: ${command}`);
      return socket.emit("error", { message: "Invalid command. Use 'ON' or 'OFF'" });
    }

    if (!mqttClient.connected) {
      console.warn(`[${new Date().toISOString()}] MQTT client not connected, cannot publish`);
      return socket.emit("error", { message: "MQTT client not connected" });
    }

    const plant = cachedPlantTopics.find((p) => p.plant_id.toString() === plantId.toString());
    if (!plant) {
      console.warn(`[${new Date().toISOString()}] No MOTOR_TOPIC found for plantId: ${plantId}`);
      return socket.emit("error", { message: `No plant found for plantId: ${plantId}` });
    }

    const motorTopic = plant.MOTOR_TOPIC;
    const payload = String(command);

    mqttClient.publish(motorTopic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Error publishing motor command to ${motorTopic}:`, err.message);
        socket.emit("error", { message: `Failed to publish command to ${motorTopic}` });
      } else {
        console.log(`[${new Date().toISOString()}] Published motor command to ${motorTopic}:`, payload);
        io.emit("motor_status_update", {
          plantId,
          command: payload,
          timestamp: Date.now(),
        });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`[${new Date().toISOString()}] Frontend disconnected:`, socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// perfectgggggg