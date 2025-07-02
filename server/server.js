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

// Load plant topics from JSON file
let plantTopics = {};

async function loadPlantTopics() {
  try {
    const data = await fs.readFile("plant_topics.json", "utf8");
    plantTopics = JSON.parse(data);
    console.log("Loaded plant topics:", plantTopics);
  } catch (error) {
    console.error("Error loading plant topics:", error.message);
    plantTopics = {};
  }
}

// Save plant topics to JSON file
async function savePlantTopics() {
  try {
    await fs.writeFile("plant_topics.json", JSON.stringify(plantTopics, null, 2));
    console.log("Plant topics saved successfully");
  } catch (error) {
    console.error("Error saving plant topics:", error.message);
  }
}

// Initialize plant topics
loadPlantTopics();

// Endpoint to receive plant topics from frontend
app.post("/set-plant-topics", async (req, res) => {
  const { plant_id, sensor_topic, motor_topic } = req.body;
  if (!plant_id || !sensor_topic || !motor_topic) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  plantTopics[plant_id] = {
    sensor_topic,
    motor_topic,
  };

  await savePlantTopics();
  res.json({ success: true, message: "Plant topics updated" });

  // Re-subscribe to new topics
  subscribeToPlantTopics(plant_id);
});

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

// MQTT Setup
const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");

let latestSensorData = {};

function subscribeToPlantTopics(plant_id) {
  if (plantTopics[plant_id]) {
    const { sensor_topic } = plantTopics[plant_id];
    mqttClient.subscribe(sensor_topic, (err) => {
      if (err) {
        console.error(`Error subscribing to topic ${sensor_topic}:`, err.message);
      } else {
        console.log(`Subscribed to: ${sensor_topic}`);
      }
    });
  }
}

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  // Subscribe to all configured plant topics
  Object.keys(plantTopics).forEach((plant_id) => {
    subscribeToPlantTopics(plant_id);
  });
});

mqttClient.on("message", async (topic, message) => {
  // Find plant_id for this topic
  const plant_id = Object.keys(plantTopics).find(
    (id) => plantTopics[id].sensor_topic === topic
  );

  if (plant_id) {
    try {
      const data = JSON.parse(message.toString());
      latestSensorData[plant_id] = { ...data, plant_id };

      io.emit(`sensor_data_${plant_id}`, latestSensorData[plant_id]);
      console.log(`Sensor data for plant ${plant_id}:`, latestSensorData[plant_id]);

      // Check Residual Chlorine Level
      const residualCl = parseFloat(data.residual_chlorine_plant);
      if (!isNaN(residualCl) && residualCl > 5 && savedTokens.length > 0) {
        const chlorineAlert = {
          notification: {
            title: "⚠️ High Chlorine Level Detected",
            body: `Residual Cl (Plant ${plant_id}): ${residualCl} ppm`,
          },
          tokens: savedTokens,
        };

        await admin.messaging().sendEachForMulticast(chlorineAlert);
        console.log(`Chlorine alert notification sent for plant ${plant_id}`);
      }
    } catch (e) {
      console.error(`Error parsing MQTT message for topic ${topic}:`, e);
    }
  }
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  // Send initial sensor data for all plants
  Object.keys(latestSensorData).forEach((plant_id) => {
    socket.emit(`sensor_data_${plant_id}`, latestSensorData[plant_id]);
  });

  socket.on("motor_control", (data) => {
    const { plant_id, command } = data;

    if (!plantTopics[plant_id]) {
      console.warn(`No topics configured for plant ${plant_id}`);
      return;
    }

    if (!mqttClient.connected) {
      console.warn("MQTT client not connected, cannot publish.");
      return;
    }

    const motor_topic = plantTopics[plant_id].motor_topic;
    const payload = typeof command === "object" ? JSON.stringify(command) : String(command);

    mqttClient.publish(motor_topic, payload, (err) => {
      if (err) {
        console.error(`Error publishing motor command to ${motor_topic}:`, err.message);
      } else {
        console.log(`Published motor command to ${motor_topic}:`, payload);
        io.emit(`motor_status_update_${plant_id}`, payload);
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