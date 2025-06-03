import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const socket = io("https://moto-app-test-2.onrender.com", {
  transports: ["websocket"],
});
const Dashboard = () => {
  const [sensor, setSensor] = useState({});

  const [motorStatus, setMotorStatus] = useState("OFF");

  const togglePump = () => {
    const newStatus = motorStatus === "ON" ? "OFF" : "ON";
    socket.emit("motor_control", { command: newStatus });
  };

  useEffect(() => {
    socket.on("sensor_data", (data) => {
      console.log(data)
      setSensor(data);
    });

    socket.on("motor_status_update", (status) => {
      setMotorStatus(status);
    });

    return () => {
      socket.off("sensor_data");
      socket.off("motor_status_update");
    };
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-[500px] sm:max-w-4xl bg-white rounded-lg shadow-md p-4 sm:p-8 flex flex-col">
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
            <span className="sm:hidden">
              {sensor.voltage_l1} | {sensor.voltage_l2} | {sensor.voltage_l3}
            </span>
            <div className="hidden sm:block">
              <div>L1: {sensor.voltage_l1}</div>
              <div>L2: {sensor.voltage_l2}</div>
              <div>L3: {sensor.voltage_l3}</div>
            </div>
          </div>
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Current L1-L3 </span>
            <span className="sm:hidden">
              {sensor.current_l1} | {sensor.current_l2} | {sensor.current_l3}
            </span>
            <div className="hidden sm:block">
              <div>L1: {sensor.current_l1}</div>
              <div>L2: {sensor.current_l2}</div>
              <div>L3: {sensor.current_l3}</div>
            </div>
          </div>
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Valves 1-3 </span>
            <span className="sm:hidden">
              {sensor.valve1} | {sensor.valve2} | {sensor.valve3}
            </span>
            <div className="hidden sm:block">
              <div>Valve 1: {sensor.valve1}</div>
              <div>Valve 2: {sensor.valve2}</div>
              <div>Valve 3: {sensor.valve3}</div>
            </div>
          </div>
          <div className="flex justify-between items-center p-2 sm:p-4 bg-gray-50 rounded sm:col-span-3">
            <div className="flex items-center">
              <span className="font-semibold">Motor 1:</span>
              <span
                className={`ml-1 sm:ml-2 ${
                  motorStatus === "ON" ? "text-green-600" : "text-red-500"
                }`}
              >
                {motorStatus}
              </span>
            </div>
            <button
              onClick={togglePump}
              className={`cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base font-medium text-white ${
                motorStatus === "ON" ? "bg-green-600" : "bg-red-500"
              }`}
            >
              {motorStatus === "ON" ? "ON" : "OFF"}
            </button>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Motor 2:</span>
            <span>{sensor.motor2_status}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Water Level:</span>
            <span>{sensor.water_level}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Chlorine Leak:</span>
            <span>{sensor.chlorine_leakage}</span>
          </div>
          <div className="flex justify-between p-2 sm:p-4 bg-gray-50 rounded">
            <span className="font-semibold">Residual Cl:</span>
            <span>{sensor.rcs_value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
