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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-blue-200 pb-3 flex items-center">
          <svg
            className="w-8 h-8 mr-2 text-blue-600"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-800">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Voltage L1:</span>{" "}
              {data.voltage_l1}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Voltage L2:</span>{" "}
              {data.voltage_l2}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Voltage L3:</span>{" "}
              {data.voltage_l3}
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Current L1:</span>{" "}
              {data.current_l1}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Current L2:</span>{" "}
              {data.current_l2}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Current L3:</span>{" "}
              {data.current_l3}
            </div>
          </div>

          <div className="flex items-center  p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors sm:col-span-3 ">
            <div className="flex items-center mr-5 sm:mr-5 ">
              <svg
                className="w-6 h-6 mr-3 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <span className="font-semibold">Motor 1 Status :&nbsp;</span>
              <div
                className={`${
                  motor1Status === "Running" ? "text-green-600" : "text-red-500"
                }`}
              >
                {motor1Status}
              </div>
            </div>
            <button
              onClick={togglePump}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-105 ${
                motor1Status === "Running"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {motor1Status === "Running" ? "Turn Off" : "Turn On"}
            </button>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors sm:col-span-3">
            <svg
              className="w-6 h-6 mr-3 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Motor 2 Status :&nbsp;</span>
              {data.motor2_status}
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Valve 1:</span> {data.valve1}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Valve 2:</span> {data.valve2}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Valve 3:</span> {data.valve3}
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-teal-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Water Level:</span>{" "}
              {data.water_level}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Chlorine Leakage:</span>{" "}
              {data.chlorine_leakage}
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
            <svg
              className="w-6 h-6 mr-3 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 17v-2m0-2v-2m0-2V7m-4 5h8m-8 0a2 2 0 11-4 0 2 2 0 014 0zm12 0h-4m4 0a2 2 0 104 0 2 2 0 00-4 0z"
              ></path>
            </svg>
            <div>
              <span className="font-semibold">Residual Chlorine:</span>{" "}
              {data.rcs_value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
