import React, { useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import icon from "../images/Icon.png";

// Initialize two separate socket connections
const socketMoto = io("https://moto-app-test.onrender.com", {
  transports: ["websocket"],
});

const socketWaterPump = io("https://water-pump.onrender.com", {
  transports: ["websocket"],
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
});

const Home = () => {
  const [sensorMoto, setSensorMoto] = useState({});
  const [sensorWaterPump, setSensorWaterPump] = useState({});
  const [motorStatus, setMotorStatus] = useState("OFF");
  const [motorNumber, setMotorNumber] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [connectionStatusMoto, setConnectionStatusMoto] = useState({});
  const [connectionStatusWaterPump, setConnectionStatusWaterPump] = useState("connected");
  const [plantData, setPlantData] = useState([]);
  const [plantSensorData, setPlantSensorData] = useState([]);
  const [plantMotorData, setPlantMotorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize simplified plant data
  const simplifiedPlantData = useMemo(
    () =>
      plantData.map((plant) => ({
        plant_id: plant.plant_id,
        plant_name: plant.plant_name,
      })),
    [plantData]
  );

  // Fetch sensor data for specific plants
  const fetchSensorData = useCallback(async (plants) => {
    if (!plants.length) return;

    try {
      const apiPromises = plants.map((plant) =>
        axios
          .get(`https://water-pump.onrender.com/api/plantsensors/details/${plant.plant_id}`)
          .catch((error) => {
            console.error(`Error fetching sensor data for plant ${plant.plant_id}:`, error.message);
            return null;
          })
      );

      const responses = await Promise.all(apiPromises);
      const sensorData = responses
        .filter((response) => response !== null)
        .map((response) => (Array.isArray(response.data) ? response.data : []))
        .flat();

      setPlantSensorData((prev) => {
        const updatedPlantIds = new Set(plants.map((plant) => plant.plant_id));
        const filteredPrev = prev.filter((sensor) => !updatedPlantIds.has(sensor.plant_id));
        return [...filteredPrev, ...sensorData];
      });
    } catch (error) {
      console.error("Unexpected error during sensor API calls:", error.message);
      setPlantSensorData((prev) => prev);
    }
  }, []);

  // Fetch motor data for specific plants
  const fetchPlantMotorData = useCallback(async (plants) => {
    if (!plants.length) return;

    try {
      const motorApiPromises = plants.map((plant) =>
        axios
          .get(`https://water-pump.onrender.com/api/plantmotors/plant/${plant.plant_id}`)
          .catch((error) => {
            console.error(`Error fetching motor data for plant ${plant.plant_id}:`, error.message);
            return null;
          })
      );

      const motorResponses = await Promise.all(motorApiPromises);
      const motorData = motorResponses
        .filter((response) => response !== null)
        .map((response) => (Array.isArray(response.data) ? response.data : []))
        .flat();

      const groupedMotors = motorData.reduce((acc, motor) => {
        const plantId = motor.plant_id;
        if (!acc[plantId]) {
          acc[plantId] = [];
        }
        acc[plantId].push({
          plant_id: motor.plant_id,
          motor_id: motor.motor_id,
          motor_name: motor.motor_name,
          motor_working_order: motor.motor_working_order,
        });
        return acc;
      }, {});

      Object.keys(groupedMotors).forEach((plantId) => {
        groupedMotors[plantId].sort((a, b) => a.motor_working_order - b.motor_working_order);
      });

      setPlantMotorData((prev) => ({
        ...prev,
        ...groupedMotors,
      }));
    } catch (error) {
      console.error("Unexpected error during motor API calls:", error.message);
      setPlantMotorData((prev) => prev);
    }
  }, []);

  // Fetch initial data (supports single plant or all plants)
  const fetchInitialData = useCallback(
    async (plantId = null) => {
      try {
        let plants = [];
        if (plantId) {
          const response = await axios.get(`https://water-pump.onrender.com/api/plants/${plantId}`);
          plants = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
        } else {
          setLoading(true);
          setError(null);
          const response = await axios.get("https://water-pump.onrender.com/api/plants");
          plants = Array.isArray(response.data) ? response.data : [];
        }

        if (plantId) {
          setPlantData((prev) => {
            const existingPlant = prev.find((p) => p.plant_id === plantId);
            if (existingPlant) {
              return prev.map((p) =>
                p.plant_id === plantId ? { ...p, ...plants[0] } : p
              );
            }
            return [...prev, ...plants];
          });
        } else {
          setPlantData(plants);
        }

        const simplifiedPlants = plants.map((plant) => ({
          plant_id: plant.plant_id,
          plant_name: plant.plant_name,
        }));

        await Promise.all([fetchSensorData(simplifiedPlants), fetchPlantMotorData(simplifiedPlants)]);
      } catch (error) {
        console.error("Error fetching initial data:", error.message);
        setError(error.message);
        if (!plantId) setPlantData([]);
      } finally {
        if (!plantId) setLoading(false);
      }
    },
    [fetchSensorData, fetchPlantMotorData]
  );

  // Initial data fetch on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Refresh data for specific plant when sensorWaterPump changes
  useEffect(() => {
    if (sensorWaterPump?.plant_id) {
      fetchInitialData(sensorWaterPump.plant_id);
    }
  }, [sensorWaterPump, fetchInitialData]);

  // Socket connection management for both servers
  useEffect(() => {
    let timeoutMoto, timeoutWaterPump;

    const resetTimeout = (socketType, setConnectionStatus, plantId) => {
      const timeout = socketType === "moto" ? timeoutMoto : timeoutWaterPump;
      if (timeout) clearTimeout(timeout);
      if (socketType === "moto" && plantId) {
        setConnectionStatusMoto((prev) => ({ ...prev, [plantId]: "connected" }));
      } else {
        setConnectionStatusWaterPump("connected");
      }
      if (
        (socketType === "moto" ? sensorMoto[plantId] : sensorWaterPump).plant_status === "IDLE" &&
        isButtonDisabled
      ) {
        setIsButtonDisabled(false);
      }
      const newTimeout = setTimeout(() => {
        if (socketType === "moto" && plantId) {
          setConnectionStatusMoto((prev) => ({ ...prev, [plantId]: "Disconnected" }));
        } else {
          setConnectionStatusWaterPump("Disconnected");
        }
        setIsButtonDisabled(true);
      }, 10000);
      if (socketType === "moto") timeoutMoto = newTimeout;
      else timeoutWaterPump = newTimeout;
    };

    const handleSensorDataMoto = (data) => {
      console.log("Received sensor_data from moto-app-test:", JSON.stringify(data));
      const plantId = data.data.id; // Assuming 'id' is the plant_id
      setSensorMoto((prev) => ({
        ...prev,
        [plantId]: data.data.sensordata,
      }));
      // Update motor status based on received data
      if (data.data.sensordata.motor1_status === "ON") {
        setMotorNumber(1);
        setMotorStatus("ON");
      } else if (data.data.sensordata.motor2_status === "ON") {
        setMotorNumber(2);
        setMotorStatus("ON");
      } else {
        setMotorStatus("OFF");
      }
      resetTimeout("moto", setConnectionStatusMoto, plantId);
    };

    const handleSensor = (data) => {
      console.log("Received plant_sensor_updated from water-pump:", JSON.stringify(data));
      setSensorWaterPump(data);
      resetTimeout("water-pump", setConnectionStatusWaterPump);
    };

    const handleConnectMoto = () => {
      console.log("Connected to moto-app-test server");
      setConnectionStatusMoto(
        plantData.reduce((acc, plant) => ({ ...acc, [plant.plant_id]: "Disconnected" }), {})
      );
    };

    const handleConnectWaterPump = () => {
      console.log("Connected to water-pump server");
      setConnectionStatusWaterPump("connected");
    };

    const handleDisconnectMoto = () => {
      console.log("Disconnected from moto-app-test server");
      setConnectionStatusMoto(
        plantData.reduce((acc, plant) => ({ ...acc, [plant.plant_id]: "Disconnected" }), {})
      );
      setIsButtonDisabled(true);
    };

    const handleDisconnectWaterPump = () => {
      console.log("Disconnected from water-pump server");
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled(true);
    };

    const handleConnectErrorWaterPump = (error) => {
      console.error("Connection error for water-pump server:", error.message);
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled(true);
    };

    socketMoto.on("sensor_data", handleSensorDataMoto);
    socketMoto.on("connect", handleConnectMoto);
    socketMoto.on("disconnect", handleDisconnectMoto);

    socketWaterPump.on("plant_sensor_updated", handleSensor);
    socketWaterPump.on("connect", handleConnectWaterPump);
    socketWaterPump.on("disconnect", handleDisconnectWaterPump);
    socketWaterPump.on("connect_error", handleConnectErrorWaterPump);

    socketWaterPump.emit("test_connection", { message: "Checking water-pump connection" });

    socketWaterPump.on("test_connection_response", (data) => {
      console.log("Received test_connection_response from water-pump:", data);
    });

    return () => {
      socketMoto.off("sensor_data", handleSensorDataMoto);
      socketMoto.off("connect", handleConnectMoto);
      socketMoto.off("disconnect", handleDisconnectMoto);

      socketWaterPump.off("plant_sensor_updated", handleSensor);
      socketWaterPump.off("connect", handleConnectWaterPump);
      socketWaterPump.off("disconnect", handleDisconnectWaterPump);
      socketWaterPump.off("connect_error", handleConnectErrorWaterPump);
      socketWaterPump.off("test_connection_response");

      if (timeoutMoto) clearTimeout(timeoutMoto);
      if (timeoutWaterPump) clearTimeout(timeoutWaterPump);
    };
  }, [sensorMoto, sensorWaterPump, isButtonDisabled, plantData]);

  // Memoize grouped sensors
  const groupedSensors = useMemo(() => {
    return plantSensorData.reduce((acc, sensor) => {
      const plantId = sensor.plant_id;
      if (!acc[plantId]) {
        acc[plantId] = [];
      }
      acc[plantId].push(sensor);
      return acc;
    }, {});
  }, [plantSensorData]);

  const togglePump = useCallback(() => {
    if (
      isButtonDisabled ||
      (Object.values(connectionStatusMoto).every((status) => status === "Disconnected") &&
        connectionStatusWaterPump === "Disconnected")
    ) {
      return;
    }

    const newStatus = motorStatus === "ON" ? "OFF" : "ON";
    socketMoto.emit("motor_control", { command: newStatus });
    socketWaterPump.emit("motor_control", { command: newStatus });
    console.log("Motor command sent to both servers:", newStatus);
    setMotorStatus(newStatus);
    setIsButtonDisabled(true);

    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 10000);
  }, [isButtonDisabled, connectionStatusMoto, connectionStatusWaterPump, motorStatus]);

  // Memoize motor status keys
  const motorStatusKeys = useMemo(
    () => ({
      motorStatusKey: `motor${motorNumber}_status`,
      motorSessionRunTimeKey: `motor${motorNumber}_session_run_time_sec`,
      motorRunTimeKey: `motor${motorNumber}_run_time_sec`,
      motorVoltageL1Key: `motor${motorNumber}_voltage_l1`,
      motorVoltageL2Key: `motor${motorNumber}_voltage_l2`,
      motorVoltageL3Key: `motor${motorNumber}_voltage_l3`,
      motorCurrentL1Key: `motor${motorNumber}_current_l1`,
      motorCurrentL2Key: `motor${motorNumber}_current_l2`,
      motorCurrentL3Key: `motor${motorNumber}_current_l3`,
    }),
    [motorNumber]
  );

  // Combine sensor data per plant
  const getSensorForPlant = useCallback(
    (plantId) => {
      return connectionStatusWaterPump === "connected" && sensorWaterPump.plant_id === plantId
        ? sensorWaterPump
        : sensorMoto[plantId] || {};
    },
    [sensorMoto, sensorWaterPump, connectionStatusWaterPump]
  );

  // Determine connection status per plant
  const getConnectionStatusForPlant = useCallback(
    (plantId) => {
      return connectionStatusWaterPump === "connected" && sensorWaterPump.plant_id === plantId
        ? "connected"
        : connectionStatusMoto[plantId] || "Disconnected";
    },
    [connectionStatusMoto, connectionStatusWaterPump, sensorWaterPump]
  );

  const getManualModeForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      return sensor.manual_mode_active === 1 ? "Manual" : "Auto";
    },
    [getSensorForPlant]
  );

  const getDisplayedPlantStatus = useCallback(
    (plantId) => {
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const sensor = getSensorForPlant(plantId);
      return connectionStatus === "Disconnected" ? "Disconnected" : sensor.plant_status || "NA";
    },
    [getSensorForPlant, getConnectionStatusForPlant]
  );

  const getMotorByWorkingOrder = useCallback(
    (plantId, workingOrder) => {
      const motors = plantMotorData[plantId] || [];
      return motors.find((motor) => motor.motor_working_order === workingOrder) || null;
    },
    [plantMotorData]
  );

  const getMotorLabel = useCallback((workingOrder) => {
    if (workingOrder === 1) return "main";
    if (workingOrder === 2) return "standby";
    if (workingOrder === 3) return "next";
    return `motor ${workingOrder}`;
  }, []);

  const calculateTotalRunTime = useCallback(
    (plantId) => {
      const motors = plantMotorData[plantId] || [];
      const sensor = getSensorForPlant(plantId);
      let totalSessionRunTime = 0;
      let totalRunTime = 0;

      motors.forEach((motor) => {
        const motorNum = motor.motor_working_order;
        const sessionKey = `motor${motorNum}_session_run_time_sec`;
        const runTimeKey = `motor${motorNum}_run_time_sec`;
        totalSessionRunTime += sensor[sessionKey] || 0;
        totalRunTime += sensor[runTimeKey] || 0;
      });

      return {
        totalSessionRunTime,
        totalRunTime,
      };
    },
    [getSensorForPlant, plantMotorData]
  );

  // Map moto sensor data to plantSensorData format for UI consistency
  const getMappedSensorsForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const connectionStatus = getConnectionStatusForPlant(plantId);
      if (connectionStatus === "Disconnected") {
        return [];
      }

      // Map moto-app-test sensor data to match plantSensorData structure
      const sensorKeys = [
        { sensor_key: "chlorine_gas_valve_status", sensor_name: "Chlorine Gas Valve" },
        { sensor_key: "hocl_valve_status", sensor_name: "HOCl Valve" },
        { sensor_key: "water_inlet_valve_status", sensor_name: "Water Inlet Valve" },
        { sensor_key: "residual_chlorine_plant", sensor_name: "Residual Chlorine" },
        { sensor_key: "water_level_meter", sensor_name: "Water Level" },
        { sensor_key: "vacuum_switch_ok", sensor_name: "Vacuum Switch" },
      ];

      return sensorKeys
        .filter((s) => sensor[s.sensor_key] !== undefined)
        .map((s) => ({
          plant_id: plantId,
          sensor_key: s.sensor_key,
          sensor_name: s.sensor_name,
          is_sensor_enabled: true,
          value: sensor[s.sensor_key],
        }));
    },
    [getSensorForPlant, getConnectionStatusForPlant]
  );

  // Map motor data for UI consistency
  const getMappedMotorsForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const motors = plantMotorData[plantId] || [];
      if (connectionStatus === "Disconnected") {
        return motors.map((motor) => ({
          ...motor,
          status: "NA",
          session_run_time_sec: 0,
          run_time_sec: 0,
        }));
      }

      return motors.map((motor) => {
        const motorNum = motor.motor_working_order;
        return {
          ...motor,
          status: sensor[`motor${motorNum}_status`] || "NA",
          session_run_time_sec: sensor[`motor${motorNum}_session_run_time_sec`] || 0,
          run_time_sec: sensor[`motor${motorNum}_run_time_sec`] || 0,
        };
      });
    },
    [getSensorForPlant, getConnectionStatusForPlant, plantMotorData]
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading plant data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
      <div className="flex-1 w-full">
        <div className="flex flex-col gap-6 items-start lg:flex-row lg:flex-wrap lg:gap-[12px] lg:px-[22px] lg:py-[110px]">
          {plantData.map((plant, index) => {
            const plantSensors = getMappedSensorsForPlant(plant.plant_id);
            const motors = getMappedMotorsForPlant(plant.plant_id);
            const sensor = getSensorForPlant(plant.plant_id);
            const connectionStatus = getConnectionStatusForPlant(plant.plant_id);
            const manualMode = getManualModeForPlant(plant.plant_id);
            const displayedPlantStatus = getDisplayedPlantStatus(plant.plant_id);
            const { totalSessionRunTime, totalRunTime } = calculateTotalRunTime(plant.plant_id);

            return (
              <div
                key={plant.plant_id || `plant-${index}`}
                className="w-[380px] px-[10px] py-[13px] border border-[#DADADA] rounded-[12px] bg-[#FFFFFF] lg:w-[417px]"
              >
                <div className="flex justify-between mb-[10px] items-center">
                  <p className="text-[#4E4D4D] text-[17px] font-[700] max-w-[70%] overflow-wrap-break-word">
                    {plant.plant_name || "Unknown Plant"}
                  </p>
                  <button
                    onClick={togglePump}
                    disabled={isButtonDisabled || connectionStatus === "Disconnected"}
                    className={`flex items-center py-[10px] px-[18px] ml-[10px] rounded-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF] ${
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

                {/* Connection, Status, and Mode */}
                <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
                  <div className="pr-[10px] max-w-[33%] lg:max-w-[30%] text-center">
                    <p>Connection</p>
                    <p
                      className={`text-[18px] font-[600] ${
                        connectionStatus === "Disconnected"
                          ? "text-[#EF5350]"
                          : "text-[#4CAF50]"
                      }`}
                    >
                      {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1).toLowerCase()}
                    </p>
                  </div>
                  <div className="pr-[10px] max-w-[33%] lg:max-w-[30%] text-center">
                    <p>Status</p>
                    <p
                      className={`text-[18px] font-[600] ${
                        displayedPlantStatus === "Disconnected" ||
                        displayedPlantStatus === "POWER-OK"
                          ? "text-[#EF5350]"
                          : displayedPlantStatus === "RUNNING"
                          ? "text-[#4CAF50]"
                          : "text-[#208CD4]"
                      }`}
                    >
                      {displayedPlantStatus
                        ? displayedPlantStatus.charAt(0).toUpperCase() +
                          displayedPlantStatus.slice(1).toLowerCase()
                        : "NA"}
                    </p>
                  </div>
                  <div className="max-w-[33%] lg:max-w-[30%] text-center">
                    <p>Mode</p>
                    <p className="text-[18px] text-[#4CAF50] font-[600]">
                      {connectionStatus === "Disconnected" ? "NA" : manualMode}
                    </p>
                  </div>
                </div>

                {/* Voltage and Current */}
                <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
                  <div className="pr-[10px] max-w-[50%] text-center">
                    <p>V (V1/ V2/ V3)</p>
                    <p className="text-[18px] text-[#208CD4] font-[600]">
                      {connectionStatus === "Disconnected"
                        ? "NA"
                        : `${
                            sensor[motorStatusKeys.motorVoltageL1Key] ?? "NA"
                          }/ ${
                            sensor[motorStatusKeys.motorVoltageL2Key] ?? "NA"
                          }/ ${
                            sensor[motorStatusKeys.motorVoltageL3Key] ?? "NA"
                          } V`}
                    </p>
                  </div>
                  <div className="max-w-[50%] text-center">
                    <p>I (I1/ I2/ I3)</p>
                    <p className="text-[18px] text-[#208CD4] font-[600]">
                      {connectionStatus === "Disconnected"
                        ? "NA"
                        : `${
                            sensor[motorStatusKeys.motorCurrentL1Key] ?? "NA"
                          }/ ${
                            sensor[motorStatusKeys.motorCurrentL2Key] ?? "NA"
                          }/ ${
                            sensor[motorStatusKeys.motorCurrentL3Key] ?? "NA"
                          } A`}
                    </p>
                  </div>
                </div>

                {/* Motor Section with Individual Timers */}
                <div className="mb-[6px]">
                  <p className="text-[17px] text-[#4E4D4D] mb-[6px] font-[700]">
                    Motor & Power
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {motors.map((motor) => {
                      const status = motor.status;
                      const sessionTime = motor.session_run_time_sec
                        ? new Date(motor.session_run_time_sec * 1000)
                            .toISOString()
                            .substr(11, 8)
                        : "NA";
                      const cumulativeTime = motor.run_time_sec
                        ? new Date(motor.run_time_sec * 1000)
                            .toISOString()
                            .substr(11, 8)
                        : "NA";

                      return (
                        <div
                          key={motor.motor_id}
                          className="border border-[#DADADA] rounded-[8px] p-1 text-[14px] font-[400] text-[#6B6B6B]"
                        >
                          <div className="flex items-center justify-between font-[700] text-[#4E4D4D]">
                            <div className="text-center">
                              <p className="text-[16px]">
                                {motor.motor_name ||
                                  `Motor ${motor.motor_working_order}`}{" "}
                                ({getMotorLabel(motor.motor_working_order)})
                              </p>
                            </div>
                            <p
                              className={`text-[16px] ${
                                status === "ON"
                                  ? "text-[#4CAF50]"
                                  : status === "OFF"
                                  ? "text-[#EF5350]"
                                  : "text-[#208CD4]"
                              }`}
                            >
                              {status}
                            </p>
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-transparent">Placeholder</p>
                            <p className="text-[#208CD4] font-[600]">
                              {`${sessionTime}/ ${cumulativeTime} S`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Time */}
                  <div className="mt-2 text-[14px] text-[#6B6B6B] font-[400] flex justify-between">
                    <p className="font-[700] text-[#4E4D4D]">
                      Total Time (Sess/Cum)
                    </p>
                    <p className="text-[#208CD4] font-[600]">
                      {connectionStatus === "Disconnected"
                        ? "NA"
                        : `${new Date(totalSessionRunTime * 1000)
                            .toISOString()
                            .substr(11, 8)}/${new Date(totalRunTime * 1000)
                            .toISOString()
                            .substr(11, 8)} S`}
                    </p>
                  </div>
                </div>

                {/* Sensors & Actuators */}
                <div>
                  <p className="border-b border-b-[#208CD4] mb-[6px] text-[#4E4D4D] font-[700] text-[18px]">
                    Sensors & Actuators
                  </p>
                  <div className="mt-[6px] text-[#6B6B6B] text-[14px] font-[400]">
                    <div className="grid grid-cols-4 gap-2 border-b border-b-[#DADADA] pb-[6px]">
                      {plantSensors.length > 0 ? (
                        plantSensors
                          .filter((apidata) => apidata.is_sensor_enabled === true)
                          .map((apidata, index) => {
                            const isVacuumSwitch = apidata.sensor_key === "vacuum_switch_ok";
                            const sensorValue = isVacuumSwitch
                              ? connectionStatus === "Disconnected" || apidata.value == null
                                ? "NA"
                                : apidata.value === 1
                                ? "OK"
                                : "NOT OK"
                              : connectionStatus === "Disconnected" || apidata.value == null
                              ? "NA"
                              : apidata.value;

                            return (
                              <div key={apidata.sensor_key || `sensor-${index}`}>
                                <p className="font-[600]">{apidata.sensor_name || "Sensor"}</p>
                                <p
                                  className={`text-[15px] font-[600] ${
                                    isVacuumSwitch
                                      ? sensorValue === "OK"
                                        ? "text-[#4CAF50]"
                                        : "text-[#EF5350]"
                                      : sensorValue === "ON"
                                      ? "text-[#4CAF50]"
                                      : sensorValue === "OFF" || sensorValue === "NA"
                                      ? "text-[#EF5350]"
                                      : "text-[#208CD4]"
                                  }`}
                                >
                                  {sensorValue}
                                </p>
                              </div>
                            );
                          })
                      ) : (
                        <div className="col-span-3">No enabled sensor data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;