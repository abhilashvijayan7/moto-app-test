import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

let runningImage = "https://static.vecteezy.com/system/resources/previews/042/337/962/non_2x/ai-generated-water-flows-from-the-old-metal-tap-photo.jpg" 

let stoppedImage = "https://media.istockphoto.com/id/1282344530/photo/weve-never-needed-water-more-than-we-need-it-now.jpg?s=612x612&w=0&k=20&c=QjJzv-G_lg8HZty0pkdzoNwr_3oGf2wEPjxwAOoPkVk="

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
      <img
        src={motor1Status === "Running" ? runningImage : stoppedImage}
        alt={motor1Status}
        style={{ width: "500px", height: "auto" }} 
      />
    </div>
  );
}

export default Motor;