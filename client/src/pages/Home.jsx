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
  const [connectionStatusMoto, setConnectionStatusMoto] = useState("connected");
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
          // Fetch single plant
          const response = await axios.get(`https://water-pump.onrender.com/api/plants/${plantId}`);
          plants = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
        } else {
          // Fetch all plants
          setLoading(true);
          setError(null);
          const response = await axios.get("https://water-pump.onrender.com/api/plants");
          plants = Array.isArray(response.data) ? response.data : [];
        }

        if (plantId) {
          // Update only the specific plant in plantData
          setPlantData((prev) => {
            const existingPlant = prev.find((p) => p.plant_id === plantId);
            if (existingPlant) {
              // Update existing plant
              return prev.map((p) =>
                p.plant_id === plantId ? { ...p, ...plants[0] } : p
              );
            }
            // Add new plant if not found
            return [...prev, ...plants];
          });
        } else {
          // Replace plantData for initial fetch
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

    const resetTimeout = (socketType, setConnectionStatus) => {
      const timeout = socketType === "moto" ? timeoutMoto : timeoutWaterPump;
      if (timeout) clearTimeout(timeout);
      setConnectionStatus("connected");
      if (
        (socketType === "moto" ? sensorMoto : sensorWaterPump).plant_status === "IDLE" &&
        isButtonDisabled
      ) {
        setIsButtonDisabled(false);
      }
      const newTimeout = setTimeout(() => {
        setConnectionStatus("Disconnected");
        setIsButtonDisabled(true);
      }, 10000);
      if (socketType === "moto") timeoutMoto = newTimeout;
      else timeoutWaterPump = newTimeout;
    };

    const handleSensorDataMoto = (data) => {
      console.log("Received sensor_data from moto-app-test:", JSON.stringify(data, null, 2));
      setSensorMoto(data);
      resetTimeout("moto", setConnectionStatusMoto);
      if (data.active_motor === 1 || data.active_motor === 2) {
        setMotorNumber(data.active_motor);
      }
    };

    const handleSensor = (data) => {
      console.log("Received plant_sensor_updated from water-pump:", JSON.stringify(data));
      setSensorWaterPump(data);
      resetTimeout("water-pump", setConnectionStatusWaterPump);
    };

    const handleConnectMoto = () => {
      console.log("Connected to moto-app-test server");
      resetTimeout("moto", setConnectionStatusMoto);
    };

    const handleConnectWaterPump = () => {
      console.log("Connected to water-pump server");
      resetTimeout("water-pump", setConnectionStatusWaterPump);
    };

    const handleDisconnectMoto = () => {
      console.log("Disconnected from moto-app-test server");
      setConnectionStatusMoto("Disconnected");
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

    resetTimeout("moto", setConnectionStatusMoto);
    resetTimeout("water-pump", setConnectionStatusWaterPump);

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
  }, [sensorMoto, sensorWaterPump, isButtonDisabled]);

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
      (connectionStatusMoto === "Disconnected" && connectionStatusWaterPump === "Disconnected")
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

  // Combine sensor data (prioritize water-pump data if available)
  const sensor = useMemo(() => {
    return connectionStatusWaterPump === "connected" ? sensorWaterPump : sensorMoto;
  }, [sensorMoto, sensorWaterPump, connectionStatusWaterPump]);

  const connectionStatus = useMemo(() => {
    return connectionStatusWaterPump === "connected" || connectionStatusMoto === "connected"
      ? "connected"
      : "Disconnected";
  }, [connectionStatusMoto, connectionStatusWaterPump]);

  const manualMode = sensor.manual_mode_active === 1 ? "Manual" : "Auto";
  const displayedPlantStatus =
    connectionStatus === "Disconnected" ? "Disconnected" : sensor.plant_status;

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
    [sensor, plantMotorData]
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
            const motors = plantMotorData[plant.plant_id] || [];
            const plantSensors = groupedSensors[plant.plant_id] || [];
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
                      const motorKey = `motor${motor.motor_working_order}_status`;
                      const sessionRunTimeKey = `motor${motor.motor_working_order}_session_run_time_sec`;
                      const runTimeKey = `motor${motor.motor_working_order}_run_time_sec`;
                      const status =
                        connectionStatus === "Disconnected"
                          ? "NA"
                          : sensor[motorKey] ?? "NA";
                      const sessionTime = sensor[sessionRunTimeKey]
                        ? new Date(sensor[sessionRunTimeKey] * 1000)
                            .toISOString()
                            .substr(11, 8)
                        : "NA";
                      const cumulativeTime = sensor[runTimeKey]
                        ? new Date(sensor[runTimeKey] * 1000)
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
                              ? connectionStatus === "Disconnected" || sensor[apidata.sensor_key] == null
                                ? "NA"
                                : sensor[apidata.sensor_key] === 1
                                ? "OK"
                                : "NOT OK"
                              : connectionStatus === "Disconnected" || sensor[apidata.sensor_key] == null
                              ? "NA"
                              : sensor[apidata.sensor_key];

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