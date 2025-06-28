// import React, { useState, useEffect } from "react";
// import { io } from "socket.io-client";
// import icon from "../images/Icon.png";
// import headImage from "../images/image 3 (1).png";
// import dehaze from "../images/dehaze.png";

// // Initialize Socket.IO client with connection logging
// const socket = io("https://moto-app-test.onrender.com", {
//   transports: ["websocket"],
// });

// // Log WebSocket connection status
// socket.on("connect", () => {
//   console.log("Connected to WebSocket server");
// });

// socket.on("connect_error", (error) => {
//   console.error("WebSocket connection error:", error);
// });

// socket.on("disconnect", (reason) => {
//   console.log("Disconnected from WebSocket server:", reason);
// });

// // Debug component to display raw sensor data
// const DebugSensorData = ({ sensor }) => {
//   return (
//     <div className="border border-[#DADADA] rounded-[8px] p-4 mt-4 bg-[#FFFFFF]">
//       <h3 className="text-[#4E4D4D] text-[18px] font-[700]">Raw Sensor Data</h3>
//       <pre className="text-[14px] text-[#6B6B6B] font-[400]">
//         {JSON.stringify(sensor, null, 2)}
//       </pre>
//     </div>
//   );
// };

// const Dashboard = () => {
//   const [sensor, setSensor] = useState({});
//   const [motorStatus, setMotorStatus] = useState("OFF");
//   const [motorNumber, setMotorNumber] = useState(1);
//   const [isButtonDisabled, setIsButtonDisabled] = useState(false);

//   const togglePump = () => {
//     if (isButtonDisabled) return;
//     const newStatus = motorStatus === "ON" ? "OFF" : "ON";
//     socket.emit("motor_control", { command: newStatus });
//     setIsButtonDisabled(true);
//     setTimeout(() => {
//       setIsButtonDisabled(false);
//     }, 10000); // 10 seconds delay
//   };

//   useEffect(() => {
//     socket.on("sensor_data", (data) => {
//       console.log("Received sensor_data:", data);
//       setSensor(data);

//       // Set motorNumber based on active_motor
//       if (data.active_motor === 1 || data.active_motor === 2) {
//         setMotorNumber(data.active_motor);
//       }

//       const motorStatusKey = `motor${motorNumber}_status`;
//       if (data[motorStatusKey]) {
//         setMotorStatus(data[motorStatusKey]);
//       }
//     });

//     socket.on("motor_status_update", (status) => {
//       console.log("Motor status update:", status);
//       setMotorStatus(status);
//     });

//     return () => {
//       socket.off("sensor_data");
//       socket.off("motor_status_update");
//     };
//   }, [motorNumber]);

//   // Log sensor state changes for debugging
//   useEffect(() => {
//     console.log("Sensor state updated:", sensor);
//   }, [sensor]);

//   const motorStatusKey = `motor${motorNumber}_status`;
//   const motorSessionRunTimeKey = `motor${motorNumber}_session_run_time_sec`;
//   const motorRunTimeKey = `motor${motorNumber}_run_time_sec`;
//   const motorVoltageL1Key = `motor${motorNumber}_voltage_l1`;
//   const motorVoltageL2Key = `motor${motorNumber}_voltage_l2`;
//   const motorVoltageL3Key = `motor${motorNumber}_voltage_l3`;
//   const motorCurrentL1Key = `motor${motorNumber}_current_l1`;
//   const motorCurrentL2Key = `motor${motorNumber}_current_l2`;
//   const motorCurrentL3Key = `motor${motorNumber}_current_l3`;

//   const manualMode = sensor.manual_mode_active === 1 ? "MANUAL" : "AUTO";

//   return (
//     <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
//       <div className="flex-1 w-full">
//         <div className="flex items-center justify-between mt-[40px] mb-[9px] lg:hidden">
//           <img src={headImage} alt="" />
//           <img src={dehaze} alt="" className="w-[24px] h-[24px]" />
//         </div>
//         <div className="right-side flex flex-col gap-6 items-start lg:flex-row lg:flex-wrap lg:gap-[12px] lg:px-[22px] lg:py-[110px]">
//           <div className="w-[380px] px-[10px] py-[13px] border border-[#DADADA] rounded-[12px] bg-[#FFFFFF] lg:w-[417px]">
//             <div className="flex justify-between mb-[20px] items-center">
//               <p className="text-[#4E4D4D] text-[19px] font-[700]">
//                 Control Dashboard
//               </p>
//               <button
//                 onClick={togglePump}
//                 disabled={isButtonDisabled}
//                 className={`flex items-center py-[10px] px-[18px] ml-[10px] rounded-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF] ${
//                   isButtonDisabled
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : motorStatus === "ON"
//                     ? "bg-[#EF5350]"
//                     : "bg-[#66BB6A]"
//                 }`}
//               >
//                 <img src={icon} alt="" className="w-[20px] h-[20px]" />
//                 {motorStatus === "ON" ? "STOP" : "START"}
//               </button>
//             </div>

//             <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
//               <div className="pr-[14px] lg:pr-[55.67px]">
//                 <p>Status</p>
//                 <p
//                   className={`text-[18px] font-[600] ${
//                     sensor.plant_status === "RUNNING"
//                       ? "text-[#4CAF50]"
//                       : "text-[#EF5350]"
//                   }`}
//                 >
//                   {sensor.plant_status != null ? sensor.plant_status : "POWER-OFF"}
//                 </p>
//               </div>
//               <div className="pr-[82px] lg:pr-[123.67px]">
//                 <p>Mode</p>
//                 <p className="text-[18px] text-[#4CAF50] font-[600]">
//                   {manualMode}
//                 </p>
//               </div>
//               <div>
//                 <p>Active Motor</p>
//                 <p className="text-[18px] text-[#208CD4] font-[600]">
//                   {sensor.active_motor === 1
//                     ? "Motor 1"
//                     : sensor.active_motor === 2
//                     ? "Motor 2"
//                     : "N/A"}
//                 </p>
//               </div>
//             </div>

//             <div className="mb-[6px]">
//               <p className="text-[18px] text-[#4E4D4D] pb-[6px] border-b border-b-[#208CD4] mb-[12px] font-[700]">
//                 Motor & Power
//               </p>
//               <div className="lg:flex gap-3">
//                 <div className="border border-[#DADADA] rounded-[8px] py-[12px] px-[8px] mb-[10px] text-[14px] font-[400] text-[#6B6B6B] lg:w-[485px]">
//                   <div className="flex items-center justify-between border-b border-b-[#DADADA] pb-[12px] font-[700] text-[#4E4D4D]">
//                     <p className="text-[18px]">Motor {motorNumber}</p>
//                     <p
//                       className={`text-[16px] ${
//                         sensor[motorStatusKey] === "ON"
//                           ? "text-[#66BB6A]"
//                           : "text-[#EF5350]"
//                       }`}
//                     >
//                       {sensor[motorStatusKey] != null
//                         ? sensor[motorStatusKey]
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div className="flex py-[12px] justify-between text-[14px]">
//                     <p>V (L1/L2/L3)</p>
//                     <p className="text-[#208CD4] font-[600]">
//                       {sensor[motorVoltageL1Key] != null
//                         ? sensor[motorVoltageL1Key]
//                         : "N/A"}
//                       /
//                       {sensor[motorVoltageL2Key] != null
//                         ? sensor[motorVoltageL2Key]
//                         : "N/A"}
//                       /
//                       {sensor[motorVoltageL3Key] != null
//                         ? sensor[motorVoltageL3Key]
//                         : "N/A"}{" "}
//                       V
//                     </p>
//                   </div>
//                   <div className="flex pt-[2px] pb-[14px] justify-between">
//                     <p>I (L1/L2/L3)</p>
//                     <p className="text-[#208CD4] font-[600]">
//                       {sensor[motorCurrentL1Key] != null
//                         ? sensor[motorCurrentL1Key]
//                         : "N/A"}
//                       /
//                       {sensor[motorCurrentL2Key] != null
//                         ? sensor[motorCurrentL2Key]
//                         : "N/A"}
//                       /
//                       {sensor[motorCurrentL3Key] != null
//                         ? sensor[motorCurrentL3Key]
//                         : "N/A"}{" "}
//                       A
//                     </p>
//                   </div>
//                   <div className="flex justify-between">
//                     <p>Timers (Sess/Cum)</p>
//                     <p className="text-[#208CD4] font-[600]">
//                       {sensor[motorSessionRunTimeKey] != null
//                         ? new Date(
//                             sensor[motorSessionRunTimeKey] * 1000
//                           ).toISOString().substr(11, 8)
//                         : "N/A"}{" "}
//                       /{" "}
//                       {sensor[motorRunTimeKey] != null
//                         ? new Date(
//                             sensor[motorRunTimeKey] * 1000
//                           ).toISOString().substr(11, 8)
//                         : "N/A"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-between">
//                 <div className="flex items-center justify-between border border-[#DADADA] rounded-md px-2 py-1.5 font-[700] text-[#4E4D4D]">
//                   <p className="text-[18px] mr-2">Next Motor</p>
//                   <p className="text-[16px] text-[#66BB6A]">
//                     {sensor.preferred_next_motor === 1
//                       ? "Motor 1"
//                       : sensor.preferred_next_motor === 2
//                       ? "Motor 2"
//                       : "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <p className="border-b border-b-[#208CD4] pb-[6px] text-[#4E4D4D] font-[700] text-[18px]">
//                 Sensors & Actuators
//               </p>
//               <div className="mt-[6px] text-[#6B6B6B] text-[14px] font-[400]">
//                 <div className="flex border-b border-b-[#DADADA] pb-[6px] gap-9 lg:gap-15">
//                   <div className="w-[33%]">
//                     <p>Water Inflow</p>
//                     <p
//                       className={`text-[16px] font-[700] ${
//                         sensor.inflow_valve_status === "ON"
//                           ? "text-[#66BB6A]"
//                           : "text-[#EF5350]"
//                       }`}
//                     >
//                       {sensor.inflow_valve_status != null
//                         ? sensor.inflow_valve_status


//                         : "OFF"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>HOCL/Drainage</p>
//                     <p
//                       className={`text-[16px] font-[700] ${
//                         sensor.drain_valve_status === "ON"
//                           ? "text-[#66BB6A]"
//                           : "text-[#EF5350]"
//                       }`}
//                     >
//                       {sensor.drain_valve_status != null
//                         ? sensor.drain_valve_status
//                         : "OFF"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>Chlorine Gas</p>
//                     <p
//                       className={`text-[16px] font-[700] ${
//                         sensor.chlorine_gas_valve_status === "ON"
//                           ? "text-[#66BB6A]"
//                           : "text-[#EF5350]"
//                       }`}
//                     >
//                       {sensor.chlorine_gas_valve_status != null
//                         ? sensor.chlorine_gas_valve_status
//                         : "OFF"}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
//                   <div className="w-[33%]">
//                     <p>Water Level</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.water_level != null
//                         ? `${sensor.water_level}%`
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>OHT Level</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.water_level_oht != null
//                         ? `${sensor.water_level_oht}%`
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>Vacuum Switch</p>
//                     <p
//                       className={`text-[16px] font-[600] ${
//                         sensor.vacuum_switch_ok === 1
//                           ? "text-[#66BB6A]"
//                           : "text-[#EF5350]"
//                       }`}
//                     >
//                       {sensor.vacuum_switch_ok === 1 ? "OK" : "NOT OK"}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
//                   <div className="w-[33%]">
//                     <p>Cylinder wt</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.chlorine_cylinder_weight != null
//                         ? `${sensor.chlorine_cylinder_weight}kg`
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>Res.cl (plant)</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.residual_chlorine_plant != null
//                         ? `${sensor.residual_chlorine_plant}ppm`
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>Res.cl (farthest)</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.residual_chlorine_farthest != null
//                         ? `${sensor.residual_chlorine_farthest}ppm`
//                         : "N/A"}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
//                   <div className="w-[33%]">
//                     <p>Leakage</p>
//                     <p
//                       className={`text-[16px] font-[600] ${
//                         sensor.chlorine_leakage_detected === 1
//                           ? "text-[#EF5350]"
//                           : "text-[#66BB6A]"
//                       }`}
//                     >
//                       {sensor.chlorine_leakage_detected === 1 ? "YES" : "NO"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]">
//                     <p>Last Fault</p>
//                     <p className="text-[16px] font-[600] text-[#208CD4]">
//                       {sensor.last_fault_message != null
//                         ? sensor.last_fault_message
//                         : "None"}
//                     </p>
//                   </div>
//                   <div className="w-[33%]"></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           {/* Add DebugSensorData component to display raw sensor data */}
//           <DebugSensorData sensor={sensor} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://moto-app-test.onrender.com", {
  transports: ["websocket"],
});

const Dashboard = () => {
  const [sensor, setSensor] = useState({});
  const [motorStatus, setMotorStatus] = useState("OFF");
  const [motorNumber, setMotorNumber] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const togglePump = () => {
    if (isButtonDisabled) return;
    const newStatus = motorStatus === "ON" ? "OFF" : "ON";
    socket.emit("motor_control", { command: newStatus });
    setIsButtonDisabled(true);
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 10000); // 10 seconds delay
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
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-6">
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
                {sensor.plant_status != null ? sensor.plant_status : "POWER-OFF"}
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
            <div>Water Inflow Valve: {sensor.water_inlet_valve_status != null ? sensor.water_inlet_valve_status : "N/A"}</div>
            <div>HOCL/Drainage Valve: {sensor.hocl_valve_status != null ? sensor.hocl_valve_status : "N/A"}</div>
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
                    sensor[motorStatusKey] === "ON" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {sensor[motorStatusKey] != null ? sensor[motorStatusKey] : "N/A"}
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
              disabled={isButtonDisabled}
              className={`mt-2 sm:mt-0 cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base font-medium text-white transition-opacity ${
                isButtonDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : motorStatus === "ON"
                  ? "bg-green-600 hover:opacity-90"
                  : "bg-red-500 hover:opacity-90"
              }`}
            >
              {motorStatus === "ON" ? "Turn OFF" : "Turn ON"}
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