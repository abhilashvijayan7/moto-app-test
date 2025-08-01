import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_SOCKET_IO_MOTO_URL, {
  transports: ["websocket"],
});

function Motor() {
  const [motorStatus, setMotorStatus] = useState("STOP_PLANT");

  useEffect(() => {
    socket.on("motor_status_update", (status) => {
      setMotorStatus(status);
      console.log(status);
    });

    return () => {
      socket.off("motor_status_update");
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <h1
        style={{
          color: motorStatus === "START_PLANT" ? "green" : "red",
          fontSize: "2.5rem",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
          transition: "color 0.3s ease-in-out",
          letterSpacing: "2px",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        {motorStatus}
      </h1>
    </div>
  );
}

export default Motor;