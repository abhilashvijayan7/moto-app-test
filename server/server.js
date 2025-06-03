const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require('dotenv').config(); // Load environment variables

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

// ✅ Firebase Admin SDK initialization
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ FCM Token Storage
let savedTokens = [];

// ✅ Save token from client
app.post("/save-token", (req, res) => {
  const { token } = req.body;
  if (token && !savedTokens.includes(token)) {
    savedTokens.push(token);
    console.log("Token saved:", token);
  }
  res.sendStatus(200);
});

// ✅ Send notification manually via GET
app.get("/send-notification", async (req, res) => {
  if (!savedTokens || savedTokens.length === 0) {
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

// 🔌 MQTT & Socket.IO setup
const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");

const SENSOR_TOPIC = "sensors/data";
const MOTOR_TOPIC = "motor/control";

let latestSensorData = {};

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe(SENSOR_TOPIC);
});

mqttClient.on("message", async (topic, message) => {
  console.log(`MQTT message received on ${topic}: ${message.toString()}`);

  if (topic === SENSOR_TOPIC) {
    try {
      const data = JSON.parse(message.toString());
      latestSensorData = data;

      // Send to all connected clients
      io.emit("sensor_data", latestSensorData);

      // Optionally trigger FCM notification for sensor alerts
      const message = {
        notification: {
          title: "Sensor Alert",
          body: `Temperature: ${data.temperature}, Humidity: ${data.humidity}`,
        },
        tokens: savedTokens,
      };

      if (savedTokens.length > 0) {
        await admin.messaging().sendEachForMulticast(message);
        console.log("Sensor alert notification sent.");
      }
    } catch (e) {
      console.error("Error parsing MQTT message", e);
    }
  }
});

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  socket.emit("sensor_data", latestSensorData);

  socket.on("motor_control", (data) => {
    const command = data.command;

    mqttClient.publish(MOTOR_TOPIC, command, () => {
      console.log("Published motor command:", command);

      io.emit("motor_status_update", command);
    });
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000; // Use Render's PORT or fallback to 4000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});