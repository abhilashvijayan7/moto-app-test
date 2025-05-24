const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const mqttClient = mqtt.connect("mqtt://test.mosquitto.org:1883");

const SENSOR_TOPIC = "sensors/data";
const MOTOR_TOPIC = "motor/control";

let latestSensorData = {};
console.log(latestSensorData)

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe(SENSOR_TOPIC);
});

mqttClient.on("message", (topic, message) => {
    console.log(`MQTT message received on ${topic}: ${message.toString()}`);

  if (topic === SENSOR_TOPIC) {
    try {
      const data = JSON.parse(message.toString());
      console.log(data)
      latestSensorData = data;

      io.emit("sensor_data", latestSensorData);
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

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
