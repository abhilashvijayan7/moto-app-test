import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const socket = io("https://water-pump-app-1.onrender.com");

const Dashboard = () => {
  const [motor1Status, setMotor1Status] = useState("Stopped");

  const data = {
    voltage_l1: "230V",
    voltage_l2: "231V",
    voltage_l3: "229V",
    current_l1: "0.06A",
    current_l2: "0.07A",
    current_l3: "0.05A",
    motor2_status: "Stopped",
    rcs_value: "1.19 PPM",
    valve1: "Open",
    valve2: "Closed",
    valve3: "Closed",
    water_level: "WL3",
    chlorine_leakage: "No Leak",
  };

  const togglePump = () => {
    let message = motor1Status === "Running" ? "Stopped" : "Running";
    socket.emit("send_message", { message });
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMotor1Status(data.message);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-[400px] sm:max-w-4xl bg-white rounded-lg shadow-md p-4 sm:p-8 flex flex-col">
        <h2 className="text-lg sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-6 flex items-center">
          <svg
            className="w-5 h-5 sm:w-8 sm:h-8 mr-1 sm:mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
          </svg>
          Control Dashboard
        </h2>

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-6 text-gray-800 text-sm sm:text-base">
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Voltage L1-L3 </span>
            <span className="sm:hidden">{data.voltage_l1} | {data.voltage_l2} | {data.voltage_l3}</span>
            <div className="hidden sm:block">
              <div>L1: {data.voltage_l1}</div>
              <div>L2: {data.voltage_l2}</div>
              <div>L3: {data.voltage_l3}</div>
            </div>
          </div>
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Current L1-L3 </span>
            <span className="sm:hidden">{data.current_l1} | {data.current_l2} | {data.current_l3}</span>
            <div className="hidden sm:block">
              <div>L1: {data.current_l1}</div>
              <div>L2: {data.current_l2}</div>
              <div>L3: {data.current_l3}</div>
            </div>
          </div>
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Valves 1-3 </span>
            <span className="sm:hidden">{data.valve1} | {data.valve2} | {data.valve3}</span>
            <div className="hidden sm:block">
              <div>Valve 1: {data.valve1}</div>
              <div>Valve 2: {data.valve2}</div>
              <div>Valve 3: {data.valve3}</div>
            </div>
          </div>
          <div className="flex justify-between items-center p-2 sm:p-4 bg-gray-50 rounded sm:col-span-3">
            <div className="flex items-center">
              <span className="font-semibold">Motor 1:</span>
              <span className={`ml-1 sm:ml-2 ${motor1Status === "Running" ? "text-green-600" : "text-red-500"}`}>
                {motor1Status}
              </span>
            </div>
            <button
              onClick={togglePump}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base font-medium text-white ${
                motor1Status === "Running" ? "bg-green-600" : "bg-red-500"
              }`}
            >
              {motor1Status === "Running" ? "Off" : "On"}
            </button>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Motor 2:</span>
            <span>{data.motor2_status}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Water Level:</span>
            <span>{data.water_level}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Chlorine Leak:</span>
            <span>{data.chlorine_leakage}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Residual Cl:</span>
            <span>{data.rcs_value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;