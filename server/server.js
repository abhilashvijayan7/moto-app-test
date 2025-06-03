require('dotenv').config(); 

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

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

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");

const SENSOR_TOPIC = "watertreatment/plant1/data";
const MOTOR_TOPIC = "watertreatment/plant1/command";

let latestSensorData = {};

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe(SENSOR_TOPIC);
});

mqttClient.on("message", async (topic, message) => {
  if (topic === SENSOR_TOPIC) {
    try {
      const data = JSON.parse(message.toString());
      latestSensorData = data;

      io.emit("sensor_data", latestSensorData);

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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
