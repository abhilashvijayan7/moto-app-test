import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const socket = io("https://water-app-pumping.onrender.com", {
  transports: ['websocket'],
});


function Motor() {
  const [motor1Status, setMotor1Status] = useState("Stopped");

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMotor1Status(data.message);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-screen flex-col">
<h1
        style={{
          color: motor1Status === "Running" ? "green" : "red",
          fontSize: "2.5rem", 
          fontWeight: "bold", 
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)", 
          transition: "color 0.3s ease-in-out", 
          letterSpacing: "2px", 
          fontFamily: "'Arial', sans-serif", 
        }}
      >
        {motor1Status}
      </h1>     
   
    </div>
  );
}

export default Motor;