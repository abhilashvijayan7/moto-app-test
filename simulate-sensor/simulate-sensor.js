const mqtt = require("mqtt");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("MQTT Sensor Service is running.");
});

app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

const client = mqtt.connect("mqtt://broker.hivemq.com");
const SENSOR_TOPIC = "sensors/data";

client.on("connect", () => {
  console.log("Sensor connected to MQTT broker");

  setInterval(() => {
    const data = {
      voltage_l1: `${Math.floor(Math.random() * 5 + 228)}V`,
      voltage_l2: `${Math.floor(Math.random() * 5 + 228)}V`,
      voltage_l3: `${Math.floor(Math.random() * 5 + 228)}V`,
      current_l1: `${(Math.random() * 0.1 + 0.03).toFixed(2)}A`,
      current_l2: `${(Math.random() * 0.1 + 0.03).toFixed(2)}A`,
      current_l3: `${(Math.random() * 0.1 + 0.03).toFixed(2)}A`,
      motor2_status: Math.random() > 0.5 ? "Running" : "Stopped",
      rcs_value: `${(Math.random() * 0.5 + 0.8).toFixed(2)} PPM`,
      valve1: Math.random() > 0.5 ? "Open" : "Closed",
      valve2: Math.random() > 0.5 ? "Open" : "Closed",
      valve3: Math.random() > 0.5 ? "Open" : "Closed",
      water_level: `WL${Math.floor(Math.random() * 5) + 1}`,
      chlorine_leakage: Math.random() < 0.1 ? "Leak Detected" : "No Leak",
    };

    client.publish(SENSOR_TOPIC, JSON.stringify(data), () => {
      console.log("Published data:", data);
    });
  }, 3000);
});

client.on("error", (err) => {
  console.error("Error connecting to MQTT broker:", err);
  process.exit(1);
});
