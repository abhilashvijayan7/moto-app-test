import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import icon from "../images/Icon.png";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
  const [motorStatuses, setMotorStatuses] = useState({});
  const [motorNumbers, setMotorNumbers] = useState({});
  const [isButtonDisabled, setIsButtonDisabled] = useState({});
  const [connectionStatusMoto, setConnectionStatusMoto] = useState({});
  const [connectionStatusWaterPump, setConnectionStatusWaterPump] = useState("connected");
  const [plantData, setPlantData] = useState([]);
  const [plantSensorData, setPlantSensorData] = useState([]);
  const [plantMotors, setPlantMotors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const lastUpdateTimes = useRef({});

  // Memoize simplified plant data
  const simplifiedPlantData = useMemo(
    () =>
      plantData.map((plant) => ({
        plant_id: plant.plant_id,
        plant_name: plant.plant_name,
      })),
    [plantData]
  );

  // Filter plants based on search query
  const filteredPlants = useMemo(() => {
    if (!searchQuery.trim()) return plantData;
    return plantData.filter((plant) =>
      plant.plant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plantData, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Fetch motor data for specific plants
  const fetchMotorData = useCallback(async (plants) => {
    if (!plants.length) return;

    try {
      const apiPromises = plants.map((plant) =>
        axios
          .get(`https://water-pump.onrender.com/api/plantmotors/plant/${plant.plant_id}`)
          .catch((error) => {
            console.error(`Error fetching motor data for plant ${plant.plant_id}:`, error.message);
            setError((prev) => ({ ...prev, [plant.plant_id]: `Failed to fetch motor data: ${error.message}` }));
            return null;
          })
      );

      const responses = await Promise.all(apiPromises);
      const motorData = responses
        .filter((response) => response !== null)
        .reduce((acc, response, index) => {
          const plantId = plants[index].plant_id;
          acc[plantId] = Array.isArray(response.data) ? response.data : [];
          return acc;
        }, {});

      setPlantMotors((prev) => ({ ...prev, ...motorData }));
    } catch (error) {
      console.error("Unexpected error during motor API calls:", error.message);
    }
  }, []);

  // Fetch sensor data for specific plants
  const fetchSensorData = useCallback(async (plants) => {
    if (!plants.length) return;

    try {
      const apiPromises = plants.map((plant) =>
        axios
          .get(`https://water-pump.onrender.com/api/plantsensors/details/${plant.plant_id}`)
          .catch((error) => {
            console.error(`Error fetching sensor data for plant ${plant.plant_id}:`, error.message);
            setError((prev) => ({ ...prev, [plant.plant_id]: `Failed to fetch sensor data: ${error.message}` }));
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
          setError({});
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

        await Promise.all([fetchSensorData(simplifiedPlants), fetchMotorData(simplifiedPlants)]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError((prev) => ({ ...prev, global: `Failed to fetch plant data: ${error.message}` }));
        if (!plantId) setPlantData([]);
      } finally {
        if (!plantId) setLoading(false);
      }
    },
    [fetchSensorData, fetchMotorData]
  );

  // Combine sensor data per plant
  const getSensorForPlant = useCallback(
    (plantId) => {
      const sensor = connectionStatusWaterPump === "connected" && sensorWaterPump.plant_id === plantId
        ? sensorWaterPump
        : sensorMoto[plantId] || {};
      return sensor;
    },
    [sensorMoto, sensorWaterPump, connectionStatusWaterPump]
  );

  // Determine connection status per plant
  const getConnectionStatusForPlant = useCallback(
    (plantId) => {
      const status = connectionStatusWaterPump === "connected" && sensorWaterPump.plant_id === plantId
        ? "connected"
        : connectionStatusMoto[plantId] || "Disconnected";
      return status;
    },
    [connectionStatusMoto, connectionStatusWaterPump, sensorWaterPump]
  );

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

  // Toggle pump for a specific plant
  const togglePump = useCallback((plantId) => {
    setIsButtonDisabled((prev) => ({ ...prev, [plantId]: true }));

    const sensor = getSensorForPlant(plantId);
    const plantStatus = sensor.plant_status;
    const connectionStatus = getConnectionStatusForPlant(plantId);

    if (connectionStatus === "Disconnected") {
      setError((prev) => ({ ...prev, [plantId]: "Cannot toggle: Disconnected" }));
      return;
    }

    if (plantStatus !== "IDLE" && plantStatus !== "RUNNING") {
      setError((prev) => ({ ...prev, [plantId]: `Cannot toggle: Invalid plant status (${plantStatus})` }));
      return;
    }

    const newStatus = motorStatuses[plantId] === "ON" ? "OFF" : "ON";

    socketMoto.emit("motor_control", { command: newStatus, plantId });
    socketWaterPump.emit("motor_control", { command: newStatus, plantId });

    lastUpdateTimes.current[plantId] = Date.now();
  }, [motorStatuses, getSensorForPlant, getConnectionStatusForPlant]);

  // Memoize motor status keys
  const motorStatusKeys = useCallback(
    (motorNumber) => ({
      motorStatusKey: `motor${motorNumber}_status`,
      motorVoltageL1Key: `motor${motorNumber}_voltage_l1`,
      motorVoltageL2Key: `motor${motorNumber}_voltage_l2`,
      motorVoltageL3Key: `motor${motorNumber}_voltage_l3`,
      motorCurrentL1Key: `motor${motorNumber}_current_l1`,
      motorCurrentL2Key: `motor${motorNumber}_current_l2`,
      motorCurrentL3Key: `motor${motorNumber}_motor_current_l3`,
    }),
    []
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

  const getMotorLabel = useCallback((workingOrder) => {
    if (workingOrder === 1) return "main";
    if (workingOrder === 2) return "standby";
    if (workingOrder === 3) return "next";
    return `motor ${workingOrder}`;
  }, []);

  // Map motors from sensor data using fetched motor data
  const getMappedMotorsForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const motorsFromApi = plantMotors[plantId] || [];

      const motors = [];
      const motorRuntimeSec = sensor.motor_runtime_sec || 0;

      const motorKeys = [
        { key: "motor1_status", name: "motor1" },
        { key: "motor2_status", name: "motor2" },
      ];

      motorKeys.forEach(({ key, name }, index) => {
        if (sensor[key] !== undefined) {
          const matchingMotor = motorsFromApi.find((motor) => motor.motor_name === name);
          const motorId = matchingMotor ? matchingMotor.motor_id : `unknown-${plantId}-${name}`;
          motors.push({
            motor_id: motorId,
            motor_name: matchingMotor ? matchingMotor.motor_name : `Motor ${index + 1}`,
            motor_working_order: matchingMotor ? matchingMotor.motor_working_order : index + 1,
            status: sensor[key] || "NA",
            run_time_sec: sensor[key] === "ON" ? motorRuntimeSec : 0,
          });
        }
      });

      if (!motors.length) {
        return [];
      }
      console.log("motors available",motors)

      if (connectionStatus === "Disconnected") {
        return motors.map((motor) => ({
          ...motor,
          status: "NA",
          run_time_sec: 0,
        }));
      }

      return motors;
    },
    [getSensorForPlant, getConnectionStatusForPlant, plantMotors]
  );

  // Calculate total runtime from sensor data
  const calculateTotalRunTime = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      return sensor.total_runtime_sec || 0;
    },
    [getSensorForPlant]
  );

  // Map sensors for a plant
  const getMappedSensorsForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const plantSensors = groupedSensors[plantId] || [];
      console.log("plant sensors",plantSensors)

      if (!plantSensors.length) {
        return [];
      }

      const activeSensors = plantSensors.filter((s) => s.is_sensor_enabled === true);

      if (connectionStatus === "Disconnected") {
        return activeSensors.map((s) => ({
          plant_id: plantId,
          sensor_key: s.sensor_key,
          sensor_name: s.sensor_name,
          is_sensor_enabled: s.is_sensor_enabled,
          value: "NA",
        }));
      }

      return activeSensors.map((s) => ({
        plant_id: plantId,
        sensor_key: s.sensor_key,
        sensor_name: s.sensor_name,
        is_sensor_enabled: s.is_sensor_enabled,
        value: sensor[s.sensor_key] !== undefined ? sensor[s.sensor_key] : s.value !== undefined ? s.value : "NA",
      }));
    },
    [getSensorForPlant, getConnectionStatusForPlant, groupedSensors]
  );

  // Socket connection management
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
      const plantStatus = (socketType === "moto" ? sensorMoto[plantId] : sensorWaterPump)?.plant_status;
      setIsButtonDisabled((prev) => ({
        ...prev,
        [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
      }));
      const newTimeout = setTimeout(() => {
        if (socketType === "moto" && plantId) {
          setConnectionStatusMoto((prev) => ({ ...prev, [plantId]: "Disconnected" }));
          setIsButtonDisabled((prev) => ({ ...prev, [plantId]: true }));
        } else {
          setConnectionStatusWaterPump("Disconnected");
          setIsButtonDisabled((prev) =>
            Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
          );
        }
      }, 10000);
      if (socketType === "moto") timeoutMoto = newTimeout;
      else timeoutWaterPump = newTimeout;
    };

    const handleSensorDataMoto = async (data) => {
      const plantId = data.data.id;
      const sensorData = data.data.sensordata;

      setSensorMoto((prev) => ({
        ...prev,
        [plantId]: sensorData,
      }));
      const plantStatus = sensorData.plant_status;
      setIsButtonDisabled((prev) => ({
        ...prev,
        [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
      }));
      if (!lastUpdateTimes.current[plantId] || Date.now() >= lastUpdateTimes.current[plantId]) {
        if (plantStatus === "IDLE") {
          setMotorStatuses((prev) => ({ ...prev, [plantId]: "OFF" }));
          lastUpdateTimes.current[plantId] = Date.now();
        } else if (plantStatus === "RUNNING") {
          setMotorStatuses((prev) => ({ ...prev, [plantId]: "ON" }));
          lastUpdateTimes.current[plantId] = Date.now();
        }
      }
      if (sensorData.motor1_status === "ON") {
        setMotorNumbers((prev) => ({ ...prev, [plantId]: 1 }));
      } else if (sensorData.motor2_status === "ON") {
        setMotorNumbers((prev) => ({ ...prev, [plantId]: 2 }));
      }
      resetTimeout("moto", setConnectionStatusMoto, plantId);

      if (!plantMotors[plantId]) {
        await fetchMotorData([{ plant_id: plantId }]);
      }
    };

    const handleSensor = async (data) => {
      const plantId = data.plant_id;
      setSensorWaterPump(data);
      const plantStatus = data.plant_status;
      setIsButtonDisabled((prev) => ({
        ...prev,
        [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
      }));
      if (!lastUpdateTimes.current[plantId] || Date.now() >= lastUpdateTimes.current[plantId]) {
        if (plantStatus === "IDLE") {
          setMotorStatuses((prev) => ({ ...prev, [plantId]: "OFF" }));
          lastUpdateTimes.current[plantId] = Date.now();
        } else if (plantStatus === "RUNNING") {
          setMotorStatuses((prev) => ({ ...prev, [plantId]: "ON" }));
          lastUpdateTimes.current[plantId] = Date.now();
        }
      }
      if (data.motor1_status === "ON") {
        setMotorNumbers((prev) => ({ ...prev, [plantId]: 1 }));
      } else if (data.motor2_status === "ON") {
        setMotorNumbers((prev) => ({ ...prev, [plantId]: 2 }));
      }
      resetTimeout("water-pump", setConnectionStatusWaterPump);

      if (!plantMotors[plantId]) {
        await fetchMotorData([{ plant_id: plantId }]);
      }
    };

    const handleConnectMoto = () => {
      setConnectionStatusMoto(
        plantData.reduce((acc, plant) => ({ ...acc, [plant.plant_id]: "Disconnected" }), {})
      );
    };

    const handleConnectWaterPump = () => {
      setConnectionStatusWaterPump("connected");
    };

    const handleDisconnectMoto = () => {
      setConnectionStatusMoto(
        plantData.reduce((acc, plant) => ({ ...acc, [plant.plant_id]: "Disconnected" }), {})
      );
      setIsButtonDisabled((prev) =>
        Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
      );
    };

    const handleDisconnectWaterPump = () => {
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled((prev) =>
        Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
      );
    };

    const handleConnectErrorWaterPump = (error) => {
      console.error("Connection error for water-pump server:", error.message);
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled((prev) =>
        Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
      );
    };

    const handleError = (data) => {
      console.error("Server error:", data.message);
      const plantIdMatch = data.message.match(/plantId: (\w+)/);
      const plantId = plantIdMatch ? plantIdMatch[1] : "global";
      setError((prev) => ({ ...prev, [plantId]: data.message }));
      setIsButtonDisabled((prev) => ({ ...prev, [plantId]: true }));
    };

    const handleMotorStatusUpdate = (data) => {
      const { plantId, command, timestamp } = data;
      const sensor = getSensorForPlant(plantId);
      const plantStatus = sensor.plant_status;
      if (!lastUpdateTimes.current[plantId] || timestamp >= lastUpdateTimes.current[plantId]) {
        if (
          (command === "ON" && plantStatus === "RUNNING") ||
          (command === "OFF" && plantStatus === "IDLE")
        ) {
          setMotorStatuses((prev) => ({ ...prev, [plantId]: command }));
          lastUpdateTimes.current[plantId] = timestamp;
        }
        setIsButtonDisabled((prev) => ({
          ...prev,
          [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
        }));
      }
    };

    socketMoto.on("motor_status_update", handleMotorStatusUpdate);
    socketWaterPump.on("motor_status_update", handleMotorStatusUpdate);
    socketMoto.on("error", handleError);
    socketWaterPump.on("error", handleError);
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
      socketMoto.off("motor_status_update", handleMotorStatusUpdate);
      socketMoto.off("error", handleError);

      socketWaterPump.off("plant_sensor_updated", handleSensor);
      socketWaterPump.off("connect", handleConnectWaterPump);
      socketWaterPump.off("disconnect", handleDisconnectWaterPump);
      socketWaterPump.off("connect_error", handleConnectErrorWaterPump);
      socketWaterPump.off("test_connection_response");
      socketWaterPump.off("motor_status_update", handleMotorStatusUpdate);
      socketWaterPump.off("error", handleError);

      if (timeoutMoto) clearTimeout(timeoutMoto);
      if (timeoutWaterPump) clearTimeout(timeoutWaterPump);
    };
  }, [sensorMoto, sensorWaterPump, plantData, getSensorForPlant, plantMotors]);

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

  // Initialize motorStatuses and motorNumbers for each plant
  useEffect(() => {
    plantData.forEach((plant) => {
      const sensor = getSensorForPlant(plant.plant_id);
      setMotorStatuses((prev) => ({
        ...prev,
        [plant.plant_id]: sensor.plant_status === "RUNNING" ? "ON" : "OFF",
      }));
      setMotorNumbers((prev) => ({
        ...prev,
        [plant.plant_id]: sensor.motor1_status === "ON" ? 1 : sensor.motor2_status === "ON" ? 2 : 1,
      }));
      setIsButtonDisabled((prev) => ({
        ...prev,
        [plant.plant_id]: !(sensor.plant_status === "IDLE" || sensor.plant_status === "RUNNING"),
      }));
    });
  }, [plantData, getSensorForPlant]);

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

  // Global error state
  if (error.global) {
    return (
      <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">Error: {error.global}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
      <div className="flex-1 w-full">
        {/* Search Input with Sticky Behavior */}
        <div className="sticky top-[80px] z-20 bg-[#FFFFFF] lg:top-[20px] lg:bg-transparent">
          <div className="mb-6 lg:px-[22px] lg:flex lg:justify-end">
            <div className="relative mt-9">
              <MagnifyingGlassIcon className="absolute left-3 top-6.5 transform -translate-y-1/2 h-5 w-5 text-[#6B6B6B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search plants by name..."
                className="w-full pl-10 pr-4 py-3 border border-[#DADADA] rounded-[12px] text-[16px] text-[#4E4D4D] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#208CD4] lg:w-[417px] lg:shadow-sm lg:mb-5"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 items-start lg:flex-row lg:flex-wrap lg:gap-[12px] lg:px-[22px] lg:pb-[110px]">
          {filteredPlants.length > 0 ? (
            filteredPlants.map((plant, index) => {
              const plantSensors = getMappedSensorsForPlant(plant.plant_id);
              const motors = getMappedMotorsForPlant(plant.plant_id);
              const sensor = getSensorForPlant(plant.plant_id);
              const connectionStatus = getConnectionStatusForPlant(plant.plant_id);
              const manualMode = getManualModeForPlant(plant.plant_id);
              const displayedPlantStatus = getDisplayedPlantStatus(plant.plant_id);
              const totalRunTime = calculateTotalRunTime(plant.plant_id);
              const currentMotorStatus = motorStatuses[plant.plant_id] || "OFF";
              const currentMotorNumber = motorNumbers[plant.plant_id] || 1;

              return (
                <div
                  key={plant.plant_id || `plant-${index}`}
                  className="w-[380px] px-[10px] py-[13px] border border-[#DADADA] rounded-[12px] bg-[#FFFFFF] lg:w-[417px]"
                >
                  <div className="flex justify-between mb-[10px] items-center">
                    <p className="text-[#4E4D4D] text-[17px] font-[700] max-w-[70%] overflow-wrap-break-word">
                      {plant.plant_name || "Unknown Plant"}
                    </p>
                    <div className="flex flex-col items-center">
                      <button
                        id={plant.plant_id}
                        onClick={() => togglePump(plant.plant_id)}
                        disabled={isButtonDisabled[plant.plant_id] || connectionStatus === "Disconnected"}
                        className={`flex items-center py-[10px] px-[18px] ml-[10px] rounded-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF] ${isButtonDisabled[plant.plant_id] || connectionStatus === "Disconnected" ? "bg-[#DADADA] cursor-not-allowed" : currentMotorStatus === "ON" ? "bg-[#EF5350]" : "bg-[#66BB6A]"}`}
                      >
                        <img src={icon} alt="Icon" className="w-[20px] h-[20px]" />
                        {currentMotorStatus === "ON" ? "STOP" : "START"}
                      </button>
                      {error[plant.plant_id] && (
                        <p className="text-red-500 text-sm mt-2">{error[plant.plant_id]}</p>
                      )}
                    </div>
                  </div>

                  {/* Connection, Status, and Mode */}
                  <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
                    <div className="pr-[10px] max-w-[33%] lg:max-w-[30%] text-center">
                      <p>Connection</p>
                      <p
                        className={`text-[18px] font-[600] ${connectionStatus === "Disconnected" ? "text-[#EF5350]" : "text-[#4CAF50]"}`}
                      >
                        {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1).toLowerCase()}
                      </p>
                    </div>
                    <div className="pr-[10px] max-w-[33%] lg:max-w-[30%] text-center">
                      <p>Status</p>
                      <p
                        className={`text-[18px] font-[600] ${displayedPlantStatus === "Disconnected" || displayedPlantStatus === "POWER-OK" ? "text-[#EF5350]" : displayedPlantStatus === "RUNNING" ? "text-[#4CAF50]" : "text-[#208CD4]"}`}
                      >
                        {displayedPlantStatus
                          ? displayedPlantStatus.charAt(0).toUpperCase() + displayedPlantStatus.slice(1).toLowerCase()
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
                          : `${sensor[motorStatusKeys(currentMotorNumber).motorVoltageL1Key] ?? "NA"}/ ${sensor[motorStatusKeys(currentMotorNumber).motorVoltageL2Key] ?? "NA"}/ ${sensor[motorStatusKeys(currentMotorNumber).motorVoltageL3Key] ?? "NA"} V`}
                      </p>
                    </div>
                    <div className="max-w-[50%] text-center">
                      <p>I (I1/ I2/ I3)</p>
                      <p className="text-[18px] text-[#208CD4] font-[600]">
                        {connectionStatus === "Disconnected"
                          ? "NA"
                          : `${sensor[motorStatusKeys(currentMotorNumber).motorCurrentL1Key] ?? "NA"}/ ${sensor[motorStatusKeys(currentMotorNumber).motorCurrentL2Key] ?? "NA"}/ ${sensor[motorStatusKeys(currentMotorNumber).motorCurrentL3Key] ?? "NA"} A`}
                      </p>
                    </div>
                  </div>

                  {/* Motor Section with Individual Timers */}
                  <div className="mb-[6px]">
                    <p className="text-[17px] text-[#4E4D4D] mb-[6px] font-[700]">
                      Motor & Power
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {motors.length > 0 ? (
                        motors.map((motor) => {
                          const status = motor.status;
                          const cumulativeTime = motor.run_time_sec
                            ? new Date(motor.run_time_sec * 1000).toISOString().substr(11, 8)
                            : "00:00:00";

                          return (
                            <div
                              key={motor.motor_id}
                              className="border border-[#DADADA] rounded-[8px] p-1 text-[14px] font-[400] text-[#6B6B6B]"
                            >
                              <div className="flex items-center justify-between font-[700] text-[#4E4D4D]">
                                <div className="text-start">
                                  <div className="flex items-center gap-1">
                                    <p className="text-[16px]">{motor.motor_name}</p>
                                    <span className="text-[13px]">
                                      ({getMotorLabel(motor.motor_working_order)})
                                    </span>
                                  </div>
                                </div>
                                <p
                                  className={`text-[16px] ${status === "ON" ? "text-[#4CAF50]" : status === "OFF" ? "text-[#EF5350]" : "text-[#208CD4]"}`}
                                >
                                  {status}
                                </p>
                              </div>
                              <div className="flex justify-between mt-1">
                                <p className="text-transparent">Placeholder</p>
                                <p className="text-[#208CD4] font-[600]">
                                  {`${cumulativeTime} S`}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center text-[#6B6B6B]">
                          No motors available
                        </div>
                      )}
                    </div>

                    {/* Total Time */}
                    {motors.length > 0 && (
                      <div className="mt-2 text-[14px] text-[#6B6B6B] font-[400] flex justify-between">
                        <p className="font-[700] text-[#4E4D4D]">
                          Total Time
                        </p>
                        <p className="text-[#208CD4] font-[600]">
                          {connectionStatus === "Disconnected"
                            ? "NA"
                            : `${new Date(totalRunTime * 1000).toISOString().substr(11, 8)} S`}
                        </p>
                      </div>
                    )}
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
                                ? apidata.value == null || connectionStatus === "Disconnected"
                                  ? "NA"
                                  : apidata.value === 1
                                  ? "OK"
                                  : "NOT OK"
                                : apidata.value == null || connectionStatus === "Disconnected"
                                ? "NA"
                                : apidata.value;

                              return (
                                <div key={apidata.sensor_key || `sensor-${index}`}>
                                  <p className="font-[600]">{apidata.sensor_name || "Sensor"}</p>
                                  <p
                                    className={`text-[15px] font-[600] ${isVacuumSwitch ? sensorValue === "OK" ? "text-[#4CAF50]" : "text-[#EF5350]" : sensorValue === "ON" ? "text-[#4CAF50]" : sensorValue === "OFF" || sensorValue === "NA" ? "text-[#EF5350]" : "text-[#208CD4]"}`}
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
            })
          ) : (
            <div className="w-full text-center text-[#6B6B6B]">
              No plants found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

// before editeeee ljshbfljhasbfljahksdfbalsjhdfbaljshdfbasjlhdfbasjdhfb