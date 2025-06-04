import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://moto-app-test.onrender.com", {
  transports: ["websocket"],
});

const Dashboard = () => {
  const [sensor, setSensor] = useState({});
  const [motorStatus, setMotorStatus] = useState("STOP_PLANT");
  const [motorNumber, setMotorNumber] = useState(1);

  const togglePump = () => {
    const newStatus = motorStatus === "START_PLANT" ? "STOP_PLANT" : "START_PLANT";
    socket.emit("motor_control", { command: newStatus });
  };

  useEffect(() => {
    socket.on("sensor_data", (data) => {
      console.log(data);
      setSensor(data);

      // Set motorNumber based on active_motor
      if (data.active_motor === 1 || data.active_motor === 2) {
        setMotorNumber(data.active_motor);
      }

      const motorStatusKey = `motor${motorNumber}_status`;
      if (data[motorStatusKey]) {
        setMotorStatus(data[motorStatusKey]);
      }
    });

    socket.on("motor_status_update", (status) => {
      setMotorStatus(status);
    });

    return () => {
      socket.off("sensor_data");
      socket.off("motor_status_update");
    };
  }, [motorNumber]);

  const motorStatusKey = `motor${motorNumber}_status`;
  const motorSessionRunTimeKey = `motor${motorNumber}_session_run_time_sec`;
  const motorRunTimeKey = `motor${motorNumber}_run_time_sec`;
  const motorVoltageL1Key = `motor${motorNumber}_voltage_l1`;
  const motorVoltageL2Key = `motor${motorNumber}_voltage_l2`;
  const motorVoltageL3Key = `motor${motorNumber}_voltage_l3`;
  const motorCurrentL1Key = `motor${motorNumber}_current_l1`;
  const motorCurrentL2Key = `motor${motorNumber}_current_l2`;
  const motorCurrentL3Key = `motor${motorNumber}_current_l3`;

  const manualMode = sensor.manual_mode_active === 1 ? "MANUAL" : "AUTO";

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

        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Plant Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-gray-800 text-sm sm:text-base">
            <div className="flex justify-between p-2 bg-white rounded shadow-sm">
              <span className="font-semibold">Plant Status:</span>
              <span
                className={
                  sensor.plant_status === "RUNNING"
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {sensor.plant_status != null ? sensor.plant_status : "N/A"}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded shadow-sm">
              <span className="font-semibold">Operational Mode:</span>
              <span>{manualMode}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded shadow-sm">
              <span className="font-semibold">Last Fault Message:</span>
              <span>{sensor.last_fault_message != null ? sensor.last_fault_message : "None"}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded shadow-sm">
              <span className="font-semibold">Active Motor:</span>
              <span>
                {sensor.active_motor === 1
                  ? "Motor 1"
                  : sensor.active_motor === 2
                  ? "Motor 2"
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded shadow-sm">
              <span className="font-semibold">Preferred Next Motor:</span>
              <span>
                {sensor.preferred_next_motor === 1
                  ? "Motor 1"
                  : sensor.preferred_next_motor === 2
                  ? "Motor 2"
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-6 text-gray-800 text-sm sm:text-base">
          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
            <span className="font-semibold">Voltage L1-L3</span>
            <span className="sm:hidden">
              {sensor[motorVoltageL1Key] != null ? sensor[motorVoltageL1Key] : "N/A"} |{" "}
              {sensor[motorVoltageL2Key] != null ? sensor[motorVoltageL2Key] : "N/A"} |{" "}
              {sensor[motorVoltageL3Key] != null ? sensor[motorVoltageL3Key] : "N/A"}
            </span>
            <div className="hidden sm:block">
              <div>L1: {sensor[motorVoltageL1Key] != null ? sensor[motorVoltageL1Key] : "N/A"}</div>
              <div>L2: {sensor[motorVoltageL2Key] != null ? sensor[motorVoltageL2Key] : "N/A"}</div>
              <div>L3: {sensor[motorVoltageL3Key] != null ? sensor[motorVoltageL3Key] : "N/A"}</div>
            </div>
          </div>

          <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
            <span className="font-semibold">Current L1-L3</span>
            <span className="sm:hidden">
              {sensor[motorCurrentL1Key] != null ? sensor[motorCurrentL1Key] : "N/A"} |{" "}
              {sensor[motorCurrentL2Key] != null ? sensor[motorCurrentL2Key] : "N/A"} |{" "}
              {sensor[motorCurrentL3Key] != null ? sensor[motorCurrentL3Key] : "N/A"}
            </span>
            <div className="hidden sm:block">
              <div>L1: {sensor[motorCurrentL1Key] != null ? sensor[motorCurrentL1Key] : "N/A"}</div>
              <div>L2: {sensor[motorCurrentL2Key] != null ? sensor[motorCurrentL2Key] : "N/A"}</div>
              <div>L3: {sensor[motorCurrentL3Key] != null ? sensor[motorCurrentL3Key] : "N/A"}</div>
            </div>
          </div>

          <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
            <span className="font-semibold mb-2">Valve Statuses</span>
            <div>Water Inflow Valve: {sensor.inflow_valve_status != null ? sensor.inflow_valve_status : "N/A"}</div>
            <div>HOCL/Drainage Valve: {sensor.drain_valve_status != null ? sensor.drain_valve_status : "N/A"}</div>
            <div>
              Chlorine Gas Valve: {sensor.chlorine_gas_valve_status != null ? sensor.chlorine_gas_valve_status : "N/A"}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 bg-gray-50 rounded shadow-sm sm:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="flex items-center">
                <span className="font-semibold">Motor:</span>
                <span
                  className={`ml-1 ${
                    motorStatus === "START_PLANT" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {motorStatus}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">Current Session:</span>
                <span className="ml-1">
                  {sensor[motorSessionRunTimeKey] != null
                    ? new Date(sensor[motorSessionRunTimeKey] * 1000)
                        .toISOString()
                        .substr(11, 8)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">Runtime:</span>
                <span className="ml-1">
                  {sensor[motorRunTimeKey] != null
                    ? new Date(sensor[motorRunTimeKey] * 1000)
                        .toISOString()
                        .substr(11, 8)
                    : "N/A"}
                </span>
              </div>
            </div>
            <button
              onClick={togglePump}
              className={`mt-2 sm:mt-0 cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base font-medium text-white hover:opacity-90 transition-opacity ${
                motorStatus === "START_PLANT" ? "bg-green-600" : "bg-red-500"
              }`}
            >
              {motorStatus === "START_PLANT" ? "Turn OFF" : "Turn ON"}
            </button>
          </div>

          <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
            <span className="font-semibold mb-2">Water Levels</span>
            <div>GLR (%): {sensor.water_level != null ? sensor.water_level : "N/A"}</div>
            <div>OHT (%): {sensor.water_level_oht != null ? sensor.water_level_oht : "N/A"}</div>
            <div>
              Vacuum Switch: {sensor.vacuum_switch_ok === 1 ? "OK" : "NOT OK"}
            </div>
          </div>

          <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
            <span className="font-semibold mb-2">Chlorine Details</span>
            <div>
              Chlorine Leakage Detected:{" "}
              <span
                className={
                  sensor.chlorine_leakage_detected === 1
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {sensor.chlorine_leakage_detected === 1 ? "YES" : "NO"}
              </span>
            </div>
            <div>
              Residual Cl (Plant): {sensor.residual_chlorine_plant != null ? sensor.residual_chlorine_plant : "N/A"} ppm
            </div>
            <div>
              Residual Cl (Farthest): {sensor.residual_chlorine_farthest != null ? sensor.residual_chlorine_farthest : "N/A"} ppm
            </div>
            <div>
              Cylinder Weight: {sensor.chlorine_cylinder_weight != null ? sensor.chlorine_cylinder_weight : "N/A"} kg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;