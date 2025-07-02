import React, { useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import icon from "../images/Icon.png";

const socket = io("https://water-pump.onrender.com", {
  transports: ["websocket"],
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
});

const Home = () => {
  const [sensorData, setSensorData] = useState({});
  const [motorStatus, setMotorStatus] = useState({});
  const [motorNumber, setMotorNumber] = useState({});
  const [isButtonDisabled, setIsButtonDisabled] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});
  const [plantData, setPlantData] = useState([]);
  const [plantSensorData, setPlantSensorData] = useState([]);
  const [plantMotorData, setPlantMotorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Send plant topics to backend
  const sendPlantTopics = useCallback(async (plant_id, sensor_topic, motor_topic) => {
    try {
      await axios.post("https://water-pump.onrender.com/set-plant-topics", {
        plant_id,
        sensor_topic,
        motor_topic,
      });
      console.log(`Plant topics sent for plant ${plant_id}`);
    } catch (error) {
      console.error(`Error sending plant topics for plant ${plant_id}:`, error.message);
    }
  }, []);

  // Initialize plant topics
  useEffect(() => {
    const initialTopics = {
      1: {
        sensor_topic: "watertreatment1/plant1/data",
        motor_topic: "watertreatment1/plant1/command",
      },
      2: {
        sensor_topic: "watertreatment1/plant2/data",
        motor_topic: "watertreatment1/plant2/command",
      },
    };

    Object.entries(initialTopics).forEach(([plant_id, topics]) => {
      sendPlantTopics(plant_id, topics.sensor_topic, topics.motor_topic);
    });
  }, [sendPlantTopics]);

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

  // Fetch initial data
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

  // Socket connection management
  useEffect(() => {
    const timeouts = {};

    const resetTimeout = (plant_id) => {
      if (timeouts[plant_id]) clearTimeout(timeouts[plant_id]);
      setConnectionStatus((prev) => ({ ...prev, [plant_id]: "connected" }));
      if (sensorData[plant_id]?.plant_status === "IDLE" && isButtonDisabled[plant_id]) {
        setIsButtonDisabled((prev) => ({ ...prev, [plant_id]: false }));
      }
      timeouts[plant_id] = setTimeout(() => {
        setConnectionStatus((prev) => ({ ...prev, [plant_id]: "Disconnected" }));
        setIsButtonDisabled((prev) => ({ ...prev, [plant_id]: true }));
      }, 10000);
    };

    const handleSensorData = (plant_id) => (data) => {
      console.log(`Received sensor_data_${plant_id}:`, JSON.stringify(data, null, 2));
      setSensorData((prev) => ({ ...prev, [plant_id]: data }));
      resetTimeout(plant_id);
      if (data.active_motor === 1 || data.active_motor === 2) {
        setMotorNumber((prev) => ({ ...prev, [plant_id]: data.active_motor }));
      }
    };

    const handleConnect = () => {
      console.log("Connected to server");
      plantData.forEach((plant) => resetTimeout(plant.plant_id));
    };

    const handleDisconnect = () => {
      console.log("Disconnected from server");
      plantData.forEach((plant) => {
        setConnectionStatus((prev) => ({ ...prev, [plant.plant_id]: "Disconnected" }));
        setIsButtonDisabled((prev) => ({ ...prev, [plant.plant_id]: true }));
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    plantData.forEach((plant) => {
      socket.on(`sensor_data_${plant.plant_id}`, handleSensorData(plant.plant_id));
    });

    socket.emit("test_connection", { message: "Checking connection" });

    socket.on("test_connection_response", (data) => {
      console.log("Received test_connection_response:", data);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      plantData.forEach((plant) => {
        socket.off(`sensor_data_${plant.plant_id}`, handleSensorData(plant.plant_id));
      });
      socket.off("test_connection_response");
      Object.values(timeouts).forEach((timeout) => clearTimeout(timeout));
    };
  }, [plantData]);

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

  const togglePump = useCallback(
    (plant_id) => {
      if (isButtonDisabled[plant_id] || connectionStatus[plant_id] === "Disconnected") {
        return;
      }

      const newStatus = motorStatus[plant_id] === "ON" ? "OFF" : "ON";
      socket.emit("motor_control", { plant_id, command: newStatus });
      console.log(`Motor command sent for plant ${plant_id}:`, newStatus);
      setMotorStatus((prev) => ({ ...prev, [plant_id]: newStatus }));
      setIsButtonDisabled((prev) => ({ ...prev, [plant_id]: true }));

      setTimeout(() => {
        setIsButtonDisabled((prev) => ({ ...prev, [plant_id]: false }));
      }, 10000);
    },
    [isButtonDisabled, connectionStatus, motorStatus]
  );

  // Memoize motor status keys
  const getMotorStatusKeys = useCallback(
    (plant_id) => ({
      motorStatusKey: `motor${motorNumber[plant_id] || 1}_status`,
      motorSessionRunTimeKey: `motor${motorNumber[plant_id] || 1}_session_run_time_sec`,
      motorRunTimeKey: `motor${motorNumber[plant_id] || 1}_run_time_sec`,
      motorVoltageL1Key: `motor${motorNumber[plant_id] || 1}_voltage_l1`,
      motorVoltageL2Key: `motor${motorNumber[plant_id] || 1}_voltage_l2`,
      motorVoltageL3Key: `motor${motorNumber[plant_id] || 1}_voltage_l3`,
      motorCurrentL1Key: `motor${motorNumber[plant_id] || 1}_current_l1`,
      motorCurrentL2Key: `motor${motorNumber[plant_id] || 1}_current_l2`,
      motorCurrentL3Key: `motor${motorNumber[plant_id] || 1}_current_l3`,
    }),
    [motorNumber]
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
      let totalSessionRunTime = 0;
      let totalRunTime = 0;

      motors.forEach((motor) => {
        const motorNum = motor.motor_working_order;
        const sessionKey = `motor${motorNum}_session_run_time_sec`;
        const runTimeKey = `motor${motorNum}_run_time_sec`;
        totalSessionRunTime += sensorData[plantId]?.[sessionKey] || 0;
        totalRunTime += sensorData[plantId]?.[runTimeKey] || 0;
      });

      return {
        totalSessionRunTime,
        totalRunTime,
      };
    },
    [sensorData, plantMotorData]
  );

  if (loading) {
    return (
      <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading plant data...</div>
        </div>
      </div>
    );
  }

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
            const motorStatusKeys = getMotorStatusKeys(plant.plant_id);
            const manualMode = sensorData[plant.plant_id]?.manual_mode_active === 1 ? "Manual" : "Auto";
            const displayedPlantStatus =
              connectionStatus[plant.plant_id] === "Disconnected"
                ? "Disconnect"
                : sensorData[plant.plant_id]?.plant_status;

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
                    onClick={() => togglePump(plant.plant_id)}
                    disabled={isButtonDisabled[plant.plant_id] || connectionStatus[plant.plant_id] === "Disconnected"}
                    className={`flex items-center py-[10px] px-[18px] ml-[10px] rounded-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF] ${
                      isButtonDisabled[plant.plant_id] || connectionStatus[plant.plant_id] === "Disconnected"
                        ? "bg-[#DADADA] cursor-not-allowed"
                        : motorStatus[plant.plant_id] === "ON"
                        ? "bg-[#EF5350]"
                        : "bg-[#66BB6A]"
                    }`}
                  >
                    <img src={icon} alt="Icon" className="w-[20px] h-[20px]" />
                    {motorStatus[plant.plant_id] === "ON" ? "STOP" : "START"}
                  </button>
                </div>

                <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
                  <div className="pr-[10px] max-w-[33%] lg:max-w-[30%] text-center">
                    <p>Connection</p>
                    <p
                      className={`text-[18px] font-[600] ${
                        connectionStatus[plant.plant_id] === "Disconnected"
                          ? "text-[#EF5350]"
                          : "text-[#4CAF50]"
                      }`}
                    >
                      {(connectionStatus[plant.plant_id] || "Disconnected").charAt(0).toUpperCase() +
                        (connectionStatus[plant.plant_id] || "Disconnected").slice(1).toLowerCase()}
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
                      {connectionStatus[plant.plant_id] === "Disconnected" ? "NA" : manualMode}
                    </p>
                  </div>
                </div>

                <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
                  <div className="pr-[10px] max-w-[50%] text-center">
                    <p>V (V1/ V2/ V3)</p>
                    <p className="text-[18px] text-[#208CD4] font-[600]">
                      {connectionStatus[plant.plant_id] === "Disconnected"
                        ? "NA"
                        : `${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorVoltageL1Key] ?? "NA"
                          }/ ${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorVoltageL2Key] ?? "NA"
                          }/ ${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorVoltageL3Key] ?? "NA"
                          } V`}
                    </p>
                  </div>
                  <div className="max-w-[50%] text-center">
                    <p>I (I1/ I2/ I3)</p>
                    <p className="text-[18px] text-[#208CD4] font-[600]">
                      {connectionStatus[plant.plant_id] === "Disconnected"
                        ? "NA"
                        : `${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorCurrentL1Key] ?? "NA"
                          }/ ${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorCurrentL2Key] ?? "NA"
                          }/ ${
                            sensorData[plant.plant_id]?.[motorStatusKeys.motorCurrentL3Key] ?? "NA"
                          } A`}
                    </p>
                  </div>
                </div>

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
                        connectionStatus[plant.plant_id] === "Disconnected"
                          ? "NA"
                          : sensorData[plant.plant_id]?.[motorKey] ?? "NA";
                      const sessionTime = sensorData[plant.plant_id]?.[sessionRunTimeKey]
                        ? new Date(sensorData[plant.plant_id][sessionRunTimeKey] * 1000)
                            .toISOString()
                            .substr(11, 8)
                        : "NA";
                      const cumulativeTime = sensorData[plant.plant_id]?.[runTimeKey]
                        ? new Date(sensorData[plant.plant_id][runTimeKey] * 1000)
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

                  <div className="mt-2 text-[14px] text-[#6B6B6B] font-[400] flex justify-between">
                    <p className="font-[700] text-[#4E4D4D]">
                      Total Time (Sess/Cum)
                    </p>
                    <p className="text-[#208CD4] font-[600]">
                      {connectionStatus[plant.plant_id] === "Disconnected"
                        ? "NA"
                        : `${new Date(totalSessionRunTime * 1000)
                            .toISOString()
                            .substr(11, 8)}/${new Date(totalRunTime * 1000)
                            .toISOString()
                            .substr(11, 8)} S`}
                    </p>
                  </div>
                </div>

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
                              ? connectionStatus[plant.plant_id] === "Disconnected" || sensorData[plant.plant_id]?.[apidata.sensor_key] == null
                                ? "NA"
                                : sensorData[plant.plant_id][apidata.sensor_key] === 1
                                ? "OK"
                                : "NOT OK"
                              : connectionStatus[plant.plant_id] === "Disconnected" || sensorData[plant.plant_id]?.[apidata.sensor_key] == null
                              ? "NA"
                              : sensorData[plant.plant_id][apidata.sensor_key];

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