// import React, { useState, useEffect } from "react";
// import { io } from "socket.io-client";

// const socket = io("https://moto-app-test.onrender.com", {
//   transports: ["websocket"],
// });

// const Dashboard = () => {
//   const [sensor, setSensor] = useState({});
//   const [motorStatus, setMotorStatus] = useState("OFF");
//   const [motorNumber, setMotorNumber] = useState(1);
//   const [isButtonDisabled, setIsButtonDisabled] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState("CONNECTED");

//   // Timeout for detecting WebSocket disconnection after 5 seconds
//   useEffect(() => {
//     let timeout;

//     const resetTimeout = () => {
//       if (timeout) clearTimeout(timeout);
//       setConnectionStatus("CONNECTED");
//       timeout = setTimeout(() => {
//         setConnectionStatus("DISCONNECTED");
//         setIsButtonDisabled(true);
//       }, 5000); // 5 seconds timeout
//     };

//     socket.on("sensor_data", (data) => {
//       console.log(data);
//       setSensor(data);

//       // Reset timeout when data is received
//       resetTimeout();

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
//       setMotorStatus(status);
//       resetTimeout();
//     });

//     socket.on("connect", () => {
//       resetTimeout();
//     });

//     socket.on("disconnect", () => {
//       setConnectionStatus("DISCONNECTED");
//       setIsButtonDisabled(true);
//     });

//     // Initial timeout setup
//     resetTimeout();

//     return () => {
//       socket.off("sensor_data");
//       socket.off("motor_status_update");
//       socket.off("connect");
//       socket.off("disconnect");
//       if (timeout) clearTimeout(timeout);
//     };
//   }, [motorNumber]);

//   const togglePump = () => {
//     if (isButtonDisabled || connectionStatus === "DISCONNECTED") return;
//     const newStatus = motorStatus === "ON" ? "OFF" : "ON";
//     socket.emit("motor_control", { command: newStatus });
//     setIsButtonDisabled(true);
//     setTimeout(() => {
//       setIsButtonDisabled(false);
//     }, 10000); // 10 seconds delay
//   };

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

//   // Determine the displayed plant status
//   const displayedPlantStatus = connectionStatus === "DISCONNECTED" 
//     ? "DISCONNECTED" 
//     : sensor.plant_status;

//   return (
//     <div className="min-h-screen flex items-center justify-center p-2 sm:p-6">
//       <div className="w-full max-w-[500px] sm:max-w-4xl bg-white rounded-lg shadow-md p-4 sm:p-8 flex flex-col">
//         <h2 className="text-lg sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-6 flex items-center">
//           <svg
//             className="w-5 h-5 sm:w-8 sm:h-8 mr-1 sm:mr-2 text-blue-600"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
//             ></path>
//           </svg>
//           Control Dashboard
//         </h2>

//         <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
//           <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
//             Plant Status
//           </h3>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-gray-800 text-sm sm:text-base">
//             <div className="flex justify-between p-2 bg-white rounded shadow-sm">
//               <span className="font-semibold">Plant Status:</span>
//               <span
//                 className={
//                   displayedPlantStatus === "DISCONNECTED" || displayedPlantStatus === "POWER-OFF"
//                     ? "text-red-500"
//                     : displayedPlantStatus === "RUNNING"
//                     ? "text-green-600"
//                     : "text-yellow-500" // Use yellow for IDLE to distinguish it
//                 }
//               >
//                 {displayedPlantStatus}
//               </span>
//             </div>
//             <div className="flex justify-between p-2 bg-white rounded shadow-sm">
//               <span className="font-semibold">Operational Mode:</span>
//               <span>{connectionStatus === "DISCONNECTED" ? "N/A" : manualMode}</span>
//             </div>
//             <div className="flex justify-between p-2 bg-white rounded shadow-sm">
//               <span className="font-semibold">Last Fault Message:</span>
//               <span>
//                 {connectionStatus === "DISCONNECTED"
//                   ? "N/A"
//                   : sensor.last_fault_message != null
//                   ? sensor.last_fault_message
//                   : "None"}
//               </span>
//             </div>
//             <div className="flex justify-between p-2 bg-white rounded shadow-sm">
//               <span className="font-semibold">Active Motor:</span>
//               <span>
//                 {connectionStatus === "DISCONNECTED"
//                   ? "N/A"
//                   : sensor.active_motor === 1
//                   ? "Motor 1"
//                   : sensor.active_motor === 2
//                   ? "Motor 2"
//                   : "N/A"}
//               </span>
//             </div>
//             <div className="flex justify-between p-2 bg-white rounded shadow-sm">
//               <span className="font-semibold">Preferred Next Motor:</span>
//               <span>
//                 {connectionStatus === "DISCONNECTED"
//                   ? "N/A"
//                   : sensor.preferred_next_motor === 1
//                   ? "Motor 1"
//                   : sensor.preferred_next_motor === 2
//                   ? "Motor 2"
//                   : "N/A"}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-5 text-gray-800 text-sm sm:text-base">
//           <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
//             <span className="font-semibold">Voltage L1-L3</span>
//             <span className="sm:hidden">
//               {connectionStatus === "DISCONNECTED"
//                 ? "N/A"
//                 : `${sensor[motorVoltageL1Key] != null ? sensor[motorVoltageL1Key] : "N/A"} | ${
//                     sensor[motorVoltageL2Key] != null ? sensor[motorVoltageL2Key] : "N/A"
//                   } | ${sensor[motorVoltageL3Key] != null ? sensor[motorVoltageL3Key] : "N/A"}`}
//             </span>
//             <div className="hidden sm:block">
//               <div>L1: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorVoltageL1Key] != null ? sensor[motorVoltageL1Key] : "N/A"}</div>
//               <div>L2: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorVoltageL2Key] != null ? sensor[motorVoltageL2Key] : "N/A"}</div>
//               <div>L3: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorVoltageL3Key] != null ? sensor[motorVoltageL3Key] : "N/A"}</div>
//             </div>
//           </div>

//           <div className="flex justify-between sm:flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
//             <span className="font-semibold">Current L1-L3</span>
//             <span className="sm:hidden">
//               {connectionStatus === "DISCONNECTED"
//                 ? "N/A"
//                 : `${sensor[motorCurrentL1Key] != null ? sensor[motorCurrentL1Key] : "N/A"} | ${
//                     sensor[motorCurrentL2Key] != null ? sensor[motorCurrentL2Key] : "N/A"
//                   } | ${sensor[motorCurrentL3Key] != null ? sensor[motorCurrentL3Key] : "N/A"}`}
//             </span>
//             <div className="hidden sm:block">
//               <div>L1: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorCurrentL1Key] != null ? sensor[motorCurrentL1Key] : "N/A"}</div>
//               <div>L2: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorCurrentL2Key] != null ? sensor[motorCurrentL2Key] : "N/A"}</div>
//               <div>L3: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor[motorCurrentL3Key] != null ? sensor[motorCurrentL3Key] : "N/A"}</div>
//             </div>
//           </div>

//           <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
//             <span className="font-semibold mb-2">Valve Statuses</span>
//             <div>Water Inflow Valve: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.water_inlet_valve_status != null ? sensor.water_inlet_valve_status : "N/A"}</div>
//             <div>HOCL/Drainage Valve: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.hocl_valve_status != null ? sensor.hocl_valve_status : "N/A"}</div>
//             <div>
//               Chlorine Gas Valve: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.chlorine_gas_valve_status != null ? sensor.chlorine_gas_valve_status : "N/A"}
//             </div>
//           </div>

//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 bg-gray-50 rounded shadow-sm sm:col-span-3">
//             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
//               <div className="flex items-center">
//                 <span className="font-semibold">Motor:</span>
//                 <span
//                   className={`ml-1 ${
//                     sensor[motorStatusKey] === "ON" ? "text-green-600" : "text-red-500"
//                   }`}
//                 >
//                   {sensor[motorStatusKey] != null ? sensor[motorStatusKey] : "N/A"}
//                 </span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-semibold">Current Session:</span>
//                 <span className="ml-1">
//                   {connectionStatus === "DISCONNECTED"
//                     ? "N/A"
//                     : sensor[motorSessionRunTimeKey] != null
//                     ? new Date(sensor[motorSessionRunTimeKey] * 1000)
//                         .toISOString()
//                         .substr(11, 8)
//                     : "N/A"}
//                 </span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-semibold">Runtime:</span>
//                 <span className="ml-1">
//                   {connectionStatus === "DISCONNECTED"
//                     ? "N/A"
//                     : sensor[motorRunTimeKey] != null
//                     ? new Date(sensor[motorRunTimeKey] * 1000)
//                         .toISOString()
//                         .substr(11, 8)
//                     : "N/A"}
//                 </span>
//               </div>
//             </div>
//             <button
//               onClick={togglePump}
//               disabled={isButtonDisabled || connectionStatus === "DISCONNECTED"}
//               className={`mt-2 sm:mt-0 cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base font-medium text-white transition-opacity ${
//                 isButtonDisabled || connectionStatus === "DISCONNECTED"
//                   ? "bg-gray-400 cursor-not-allowed"
//                   : motorStatus === "ON"
//                   ? "bg-green-600 hover:opacity-90"
//                   : "bg-red-500 hover:opacity-90"
//               }`}
//             >
//               {motorStatus === "ON" ? "Turn OFF" : "Turn ON"}
//             </button>
//           </div>

//           <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
//             <span className="font-semibold mb-2">Water Levels</span>
//             <div>GLR (%): {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.water_level != null ? sensor.water_level : "N/A"}</div>
//             <div>OHT (%): {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.water_level_oht != null ? sensor.water_level_oht : "N/A"}</div>
//             <div>
//               Vacuum Switch: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.vacuum_switch_ok === 1 ? "OK" : "NOT OK"}
//             </div>
//           </div>

//           <div className="flex flex-col p-2 sm:p-4 bg-gray-50 rounded shadow-sm">
//             <span className="font-semibold mb-2">Chlorine Details</span>
//             <div>
//               Chlorine Leakage Detected:{" "}
//               <span
//                 className={
//                   connectionStatus === "DISCONNECTED"
//                     ? "text-red-500"
//                     : sensor.chlorine_leakage_detected === 1
//                     ? "text-green-600"
//                     : "text-red-500"
//                 }
//               >
//                 {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.chlorine_leakage_detected === 1 ? "YES" : "NO"}
//               </span>
//             </div>
//             <div>
//               Residual Cl (Plant): {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.residual_chlorine_plant != null ? sensor.residual_chlorine_plant : "N/A"} ppm
//             </div>
//             <div>
//               Residual Cl (Farthest): {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.residual_chlorine_farthest != null ? sensor.residual_chlorine_farthest : "N/A"} ppm
//             </div>
//             <div>
//               Cylinder Weight: {connectionStatus === "DISCONNECTED" ? "N/A" : sensor.chlorine_cylinder_weight != null ? sensor.chlorine_cylinder_weight : "N/A"} kg
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import headImage from "../images/image 3 (1).png";
import dehaze from "../images/dehaze.png";
import icon from "../images/Icon.png";

const socket = io("https://moto-app-test.onrender.com", {
  transports: ["websocket"],
});

const Dashboard = () => {
  const [sensor, setSensor] = useState({});
  const [apiSensorData, setApiSensorData] = useState([]);
  const [motorStatus, setMotorStatus] = useState("OFF");
  const [motorNumber, setMotorNumber] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");

  useEffect(() => {
    // Fetch initial sensor data using axios
    axios
      .get("https://water-pump.onrender.com/api/plantsensors/details/12")
      .then((response) => {
        console.log("API Response:", response.data);
        setApiSensorData(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          console.error("API endpoint not found. Please check the server configuration.");
        } else {
          console.error("Error fetching sensor data:", error.message);
        }
        setApiSensorData([]);
      });

    let timeout;

    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      setConnectionStatus("connected");

      if (sensor.plant_status === "IDLE" && isButtonDisabled)
        setIsButtonDisabled(false);

      timeout = setTimeout(() => {
        setConnectionStatus("Disconnected");
        setIsButtonDisabled(true);
      }, 10000);
    };

    socket.on("sensor_data", (data) => {
      console.log("Received sensor_data:", JSON.stringify(data, null, 2));
      setSensor(data);
      resetTimeout();

      // Update motorNumber if provided
      if (data.active_motor === 1 || data.active_motor === 2) {
        setMotorNumber(data.active_motor);
      }
    });

    socket.on("connect", () => {
      resetTimeout();
    });

    socket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
      setIsButtonDisabled(true);
    });

    resetTimeout();

    return () => {
      socket.off("sensor_data");
      socket.off("connect");
      socket.off("disconnect");
      if (timeout) clearTimeout(timeout);
    };
  }, [sensor, isButtonDisabled]);

  const togglePump = () => {
    if (isButtonDisabled || connectionStatus === "Disconnected") return;
    const newStatus = motorStatus === "ON" ? "OFF" : "ON";
    socket.emit("motor_control", { command: newStatus });
    console.log("Motor command sent:", newStatus);
    setMotorStatus(newStatus);
    setIsButtonDisabled(true);
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 10000);
  };

  const motorStatusKey = `motor${motorNumber}_status`;
  const motorSessionRunTimeKey = `motor${motorNumber}_session_run_time_sec`;
  const motorRunTimeKey = `motor${motorNumber}_run_time_sec`;
  const motorVoltageL1Key = `motor${motorNumber}_voltage_l1`;
  const motorVoltageL2Key = `motor${motorNumber}_voltage_l2`;
  const motorVoltageL3Key = `motor${motorNumber}_voltage_l3`;
  const motorCurrentL1Key = `motor${motorNumber}_current_l1`;
  const motorCurrentL2Key = `motor${motorNumber}_current_l2`;
  const motorCurrentL3Key = `motor${motorNumber}_current_l3`;

  const manualMode = sensor.manual_mode_active === 1 ? "Manual" : "Auto";
  const displayedPlantStatus =
    connectionStatus === "Disconnected" ? "Disconnected" : sensor.plant_status;

  return (
    <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mt-[40px] mb-[9px] lg:hidden">
          <img src={headImage} alt="Header" />
          <img src={dehaze} alt="Menu" className="w-[24px] h-[24px]" />
        </div>
        <div className="flex flex-col gap-6 items-start lg:flex-row lg:flex-wrap lg:gap-[12px] lg:px-[22px] lg:py-[110px]">
          <div className="w-[380px] px-[10px] py-[13px] border border-[#DADADA] nuclear-[12px] bg-[#FFFFFF] lg:w-[417px]">
            <div className="flex justify-between mb-[20px] items-center">
              <p className="text-[#4E4D4D] text-[19px] font-[700] max-w-[60%] overflow-wrap-break-word">
                Government Medical College Thrissur
              </p>
              <button
                onClick={togglePump}
                disabled={isButtonDisabled || connectionStatus === "Disconnected"}
                className={`flex items-center py-[10px] px-[18px] ml-[10px] nuclear-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF] ${
                  isButtonDisabled || connectionStatus === "Disconnected"
                    ? "bg-[#DADADA] cursor-not-allowed"
                    : motorStatus === "ON"
                    ? "bg-[#EF5350]"
                    : "bg-[#66BB6A]"
                }`}
              >
                <img src={icon} alt="Icon" className="w-[20px] h-[20px]" />
                {motorStatus === "ON" ? "STOP" : "START"}
              </button>
            </div>
            <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
              <div className="pr-[10px] max-w-[33%] lg:max-w-[30%]">
                <p>Connection</p>
                <p
                  className={`text-[18px] font-[600] ${
                    connectionStatus === "Disconnected"
                      ? "text-[#EF5350]"
                      : "text-[#4CAF50]"
                  } overflow-hidden text-ellipsis whitespace-nowrap`}
                >
                  {connectionStatus.charAt(0).toUpperCase() +
                    connectionStatus.slice(1).toLowerCase()}
                </p>
              </div>
              <div className="pr-[10px] max-w-[33%] lg:max-w-[30%]">
                <p>Status</p>
                <p
                  className={`text-[18px] font-[600] ${
                    displayedPlantStatus === "Disconnected" ||
                    displayedPlantStatus === "POWER-OK"
                      ? "text-[#EF5350]"
                      : displayedPlantStatus === "RUNNING"
                      ? "text-[#4CAF50]"
                      : "text-[#208CD4]"
                  } overflow-hidden text-ellipsis whitespace-nowrap`}
                >
                  {displayedPlantStatus
                    ? displayedPlantStatus.charAt(0).toUpperCase() +
                      displayedPlantStatus.slice(1).toLowerCase()
                    : "N/A"}
                </p>
              </div>
              <div className="max-w-[33%] lg:max-w-[30%]">
                <p>Mode</p>
                <p className="text-[18px] text-[#4CAF50] font-[600] overflow-hidden text-ellipsis whitespace-nowrap">
                  {connectionStatus === "Disconnected" ? "N/A" : manualMode}
                </p>
              </div>
            </div>
            <div className="mb-[6px]">
              <p className="text-[18px] text-[#4E4D4D] pb-[6px] border-b border-b-[#208CD4] mb-[12px] font-[700]">
                Motor & Power
              </p>
              <div className="lg:flex gap-3">
                <div className="border border-[#DADADA] nuclear-[8px] py-[12px] px-[8px] mb-[10px] text-[14px] font-[400] text-[#6B6B6B] lg:w-[485px]">
                  <div className="flex items-center justify-between border-b border-b-[#DADADA] pb-[12px] font-[700] text-[#4E4D4D]">
                    <p className="text-[18px]">Motor {motorNumber}</p>
                    <p
                      className={`text-[16px] ${
                        sensor[motorStatusKey] === "ON"
                          ? "text-[#4CAF50]"
                          : "text-[#EF5350]"
                      }`}
                    >
                      {connectionStatus === "Disconnected"
                        ? "N/A"
                        : sensor[motorStatusKey] ?? "N/A"}
                    </p>
                  </div>
                  <div className="flex py-[12px] justify-between text-[14px]">
                    <p>V (L1/L2/L3)</p>
                    <p className="text-[#208CD4] font-[600] overflow-hidden text-ellipsis whitespace-nowrap">
                      {connectionStatus === "Disconnected"
                        ? "N/A"
                        : `${sensor[motorVoltageL1Key] ?? "N/A"}/${
                            sensor[motorVoltageL2Key] ?? "N/A"
                          }/${sensor[motorVoltageL3Key] ?? "N/A"} V`}
                    </p>
                  </div>
                  <div className="flex pt-[2px] pb-[14px] justify-between">
                    <p>I (L1/L2/L3)</p>
                    <p className="text-[#208CD4] font-[600] overflow-hidden text-ellipsis whitespace-nowrap">
                      {connectionStatus === "Disconnected"
                        ? "N/A"
                        : `${sensor[motorCurrentL1Key] ?? "N/A"}/${
                            sensor[motorCurrentL2Key] ?? "N/A"
                          }/${sensor[motorCurrentL3Key] ?? "N/A"} A`}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p>Timers (Sess/Cum)</p>
                    <p className="text-[#208CD4] font-[600] overflow-hidden text-ellipsis whitespace-nowrap">
                      {connectionStatus === "Disconnected"
                        ? "N/A"
                        : `${
                            sensor[motorSessionRunTimeKey]
                              ? new Date(sensor[motorSessionRunTimeKey] * 1000)
                                  .toISOString()
                                  .substr(11, 8)
                              : "N/A"
                          }/${
                            sensor[motorRunTimeKey]
                              ? new Date(sensor[motorRunTimeKey] * 1000)
                                  .toISOString()
                                  .substr(11, 8)
                              : "N/A"
                          }`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center justify-between border border-[#DADADA] nuclear-md px-2 py-1.5 font-[700] text-[#4E4D4D]">
                  <p className="text-[18px] mr-2">
                    Motor {motorNumber === 1 ? 2 : 1}
                  </p>
                  <p className="text-[16px] text-[#66BB6A]">
                    {connectionStatus === "Disconnected"
                      ? "N/A"
                      : sensor[`motor${motorNumber === 1 ? 2 : 1}_status`] ||
                        "STAND BY"}
                  </p>
                </div>
                <div className="flex items-center justify-between border border-[#DADADA] nuclear-md px-2 py-1.5 font-[700] text-[#4E4D4D]">
                  <p className="text-[18px] mr-2">Preferred Next</p>
                  <p className="text-[16px] text-[#66BB6A]">
                    {connectionStatus === "Disconnected"
                      ? "N/A"
                      : sensor.preferred_next_motor
                      ? `Motor ${sensor.preferred_next_motor}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div >
              <p className="border-b border-b-[#208CD4] pb-[6px] text-[#4E4D4D] font-[700] text-[18px]">
                Sensors & Actuators
              </p>
              <div className="mt-[6px] text-[#6B6B6B] text-[14px] font-[400]">
                <div className="flex border-b border-b-[#DADADA] pb-[6px] gap-9 lg:gap-15">
                  {Array.isArray(apiSensorData) && apiSensorData.length > 0 ? (
                    apiSensorData.map((apidata) => (
                      <div className="w-[33%]" key={apidata.sensor_key}>
                        <p>{apidata.sensor_name || "Sensor"}</p>
                        <p
                          className={`text-[16px] font-[700] ${
                            apidata.value === "ON"
                              ? "text-[#4CAF50]"
                              : "text-[#EF5350]"
                          }`}
                        >
                          {connectionStatus === "Disconnected"
                            ? "N/A"
                            : sensor[apidata.sensor_key] ?? "N/A"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div>No sensor data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;