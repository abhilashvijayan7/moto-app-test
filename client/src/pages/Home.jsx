import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import icon from "../images/Icon.png";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { UserContext } from "../context/UserContext"; 

// Initialize socket connections
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
  const { user } = useContext(UserContext); 
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
  const location = useLocation();
  const navigate = useNavigate();

  // This ensures none of the code below runs until the user object is available.
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
          if (!user) navigate("/login");
      }, 1000);
      return () => clearTimeout(timer);
    }
    console.log("UserContext user:", user); // Log user data
  }, [user, navigate]);

  // Derive user role and permissions
  const userRole = user?.role?.toLowerCase() || "normal";
  const isRestrictedUser = userRole === "normal" || userRole === "regular";
  const canControlPlant = userRole === "super admin" || userRole === "admin" || userRole === "normal";

  // Get plant IDs from user prop
  const loginPlantIds = useMemo(() => {
    const plantIds = user?.userPlants?.map((plant) => plant.plant_id) || [];
    console.log("Allowed plant IDs:", plantIds); // Already present
    return plantIds;
  }, [user]);

  // Redirect to login if no user data
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    console.log("Checking user for redirect:", user); // Log user check
  }, [user, navigate]);

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
    console.log("Filtering plants with search query:", searchQuery); // Log search query
    return plantData.filter((plant) =>
      plant.plant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plantData, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    console.log("Search query updated:", e.target.value); // Log search input
  };

  // Fetch motor data for specific plants
  const fetchMotorData = useCallback(async (plants) => {
    if (!plants.length) return;
    console.log("Fetching motor data for plants:", plants); // Log plants being fetched

    try {
      const apiPromises = plants.map((plant) =>
        axios
          .get(
            `https://water-pump.onrender.com/api/plantmotors/plant/${plant.plant_id}`,
            { withCredentials: true }
          )
          .catch((error) => {
            console.error(
              `Error fetching motor data for plant ${plant.plant_id}:`,
              error.message
            );
            setError((prev) => ({
              ...prev,
              [plant.plant_id]: `Failed to fetch motor data: ${error.message}`,
            }));
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

      console.log("Received motor data:", motorData); // Already present
      setPlantMotors((prev) => {
        console.log("Updating plantMotors state:", { ...prev, ...motorData }); // Log state update
        return { ...prev, ...motorData };
      });
    } catch (error) {
      console.error("Unexpected error during motor API calls:", error.message);
    }
  }, []);

  // Fetch sensor data for specific plants
  const fetchSensorData = useCallback(async (plants) => {
    if (!plants.length) return;
    console.log("Fetching sensor data for plants:", plants); // Log plants being fetched

    try {
      const apiPromises = plants.map((plant) =>
        axios
          .get(
            `https://water-pump.onrender.com/api/plantsensors/details/${plant.plant_id}`,
            { withCredentials: true }
          )
          .catch((error) => {
            console.error(
              `Error fetching sensor data for plant ${plant.plant_id}:`,
              error.message
            );
            setError((prev) => ({
              ...prev,
              [plant.plant_id]: `Failed to fetch sensor data: ${error.message}`,
            }));
            return null;
          })
      );

      const responses = await Promise.all(apiPromises);
      const sensorData = responses
        .filter((response) => response !== null)
        .map((response) => (Array.isArray(response.data) ? response.data : []))
        .flat();

      console.log("Received sensor data:", sensorData); // Already present
      setPlantSensorData((prev) => {
        const updatedPlantIds = new Set(plants.map((plant) => plant.plant_id));
        const filteredPrev = prev.filter(
          (sensor) => !updatedPlantIds.has(sensor.plant_id)
        );
        const newSensorData = [...filteredPrev, ...sensorData];
        console.log("Updating plantSensorData state:", newSensorData); // Log state update
        return newSensorData;
      });
    } catch (error) {
      console.error("Unexpected error during sensor API calls:", error.message);
      setPlantSensorData((prev) => prev);
    }
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!loginPlantIds.length) {
      setError({ global: "No plants assigned to this user." });
      setLoading(false);
      console.log("No plant IDs, setting error:", { global: "No plants assigned to this user." }); // Log error
      return;
    }

    try {
      setLoading(true);
      setError({});
      console.log("Fetching initial plant data for plant IDs:", loginPlantIds); // Log fetch start

      const apiPromises = loginPlantIds.map((plantId) =>
        axios.get(`https://water-pump.onrender.com/api/plants/${plantId}`, {
          withCredentials: true,
        })
      );
      const responses = await Promise.all(apiPromises);
      const plants = responses
        .map((response) => (Array.isArray(response.data) ? response.data : [response.data]))
        .flat()
        .filter(Boolean);

      console.log("Received initial plant data:", plants); // Already present
      setPlantData(plants);
      console.log("Updating plantData state:", plants); // Log state update

      const simplifiedPlants = plants.map((plant) => ({
        plant_id: plant.plant_id,
        plant_name: plant.plant_name,
      }));

      await Promise.all([
        fetchSensorData(simplifiedPlants),
        fetchMotorData(simplifiedPlants),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError((prev) => ({
        ...prev,
        global: `Failed to fetch plant data: ${error.message}`,
      }));
      setPlantData([]);
      console.log("Error updating plantData, setting error:", { global: `Failed to fetch plant data: ${error.message}` }); // Log error
    } finally {
      setLoading(false);
      console.log("Finished fetching initial data, loading set to false"); // Log fetch completion
    }
  }, [fetchSensorData, fetchMotorData, loginPlantIds]);

  // Combine sensor data per plant
  const getSensorForPlant = useCallback(
    (plantId) => {
      const sensor =
        connectionStatusWaterPump === "connected" &&
        sensorWaterPump.plant_id === plantId
          ? sensorWaterPump
          : sensorMoto[plantId] || {};
      console.log(`Getting sensor for plant ${plantId}:`, sensor); // Log sensor data
      return sensor;
    },
    [sensorMoto, sensorWaterPump, connectionStatusWaterPump]
  );

  // Determine connection status per plant
  const getConnectionStatusForPlant = useCallback(
    (plantId) => {
      const status =
        connectionStatusWaterPump === "connected" &&
        sensorWaterPump.plant_id === plantId
          ? "connected"
          : connectionStatusMoto[plantId] || "Disconnected";
      console.log(`Connection status for plant ${plantId}:`, status); // Log connection status
      return status;
    },
    [connectionStatusMoto, connectionStatusWaterPump, sensorWaterPump]
  );

  // Memoize grouped sensors
  const groupedSensors = useMemo(() => {
    const result = plantSensorData.reduce((acc, sensor) => {
      const plantId = sensor.plant_id;
      if (!acc[plantId]) {
        acc[plantId] = [];
      }
      acc[plantId].push(sensor);
      return acc;
    }, {});
    console.log("Grouped sensors by plant:", result); // Log grouped sensors
    return result;
  }, [plantSensorData]);

  // Toggle pump (regular and admin only)
  const togglePump = useCallback(
    (plantId) => {
      if (!canControlPlant) return;
      setIsButtonDisabled((prev) => ({ ...prev, [plantId]: true }));
      console.log(`Toggling pump for plant ${plantId}, button disabled`); // Log toggle start

      const sensor = getSensorForPlant(plantId);
      const plantStatus = sensor.plant_status;
      const connectionStatus = getConnectionStatusForPlant(plantId);

      if (connectionStatus === "Disconnected") {
        setError((prev) => ({
          ...prev,
          [plantId]: "Cannot toggle: Disconnected",
        }));
        console.log(`Cannot toggle plant ${plantId}: Disconnected`); // Log error
        return;
      }

      if (plantStatus !== "IDLE" && plantStatus !== "RUNNING") {
        setError((prev) => ({
          ...prev,
          [plantId]: `Cannot toggle: Invalid plant status (${plantStatus})`,
        }));
        console.log(`Cannot toggle plant ${plantId}: Invalid status (${plantStatus})`); // Log error
        return;
      }

      const newStatus = motorStatuses[plantId] === "ON" ? "OFF" : "ON";

      socketMoto.emit("motor_control", { command: newStatus, plantId });
      socketWaterPump.emit("motor_control", { command: newStatus, plantId });

      console.log("Toggling pump for plant:", plantId, "New status:", newStatus); // Already present
      lastUpdateTimes.current[plantId] = Date.now();
    },
    [motorStatuses, getSensorForPlant, getConnectionStatusForPlant, canControlPlant]
  );

  // Memoize motor status keys
  const motorStatusKeys = useCallback(
    (motorNumber) => {
      const keys = {
        motorStatusKey: `motor${motorNumber}_status`,
        motorVoltageL1Key: `motor${motorNumber}_voltage_l1`,
        motorVoltageL2Key: `motor${motorNumber}_voltage_l2`,
        motorVoltageL3Key: `motor${motorNumber}_voltage_l3`,
        motorCurrentL1Key: `motor${motorNumber}_current_l1`,
        motorCurrentL2Key: `motor${motorNumber}_current_l2`,
        motorCurrentL3Key: `motor${motorNumber}_motor_current_l3`,
      };
      console.log(`Motor status keys for motor ${motorNumber}:`, keys); // Log motor keys
      return keys;
    },
    []
  );

  const getManualModeForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const mode = sensor.manual_mode_active === 1 ? "Manual" : "Auto";
      console.log(`Manual mode for plant ${plantId}:`, mode); // Log manual mode
      return mode;
    },
    [getSensorForPlant]
  );

  const getDisplayedPlantStatus = useCallback(
    (plantId) => {
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const sensor = getSensorForPlant(plantId);
      const status = connectionStatus === "Disconnected"
        ? "Disconnected"
        : sensor.plant_status || "NA";
      console.log(`Displayed plant status for plant ${plantId}:`, status); // Log plant status
      return status;
    },
    [getSensorForPlant, getConnectionStatusForPlant]
  );

  const getMotorLabel = useCallback((workingOrder) => {
    if (workingOrder === 1) return "main";
    if (workingOrder === 2) return "standby";
    if (workingOrder === 3) return "next";
    return `motor ${workingOrder}`;
  }, []);

  // Map motors from sensor data
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
          const matchingMotor = motorsFromApi.find(
            (motor) => motor.motor_name === name
          );
          const motorId = matchingMotor
            ? matchingMotor.motor_id
            : `unknown-${plantId}-${name}`;
          motors.push({
            motor_id: motorId,
            motor_name: matchingMotor
              ? matchingMotor.motor_name
              : `Motor ${index + 1}`,
            motor_working_order: matchingMotor
              ? matchingMotor.motor_working_order
              : index + 1,
            status: sensor[key] || "NA",
            run_time_sec: sensor[key] === "ON" ? motorRuntimeSec : 0,
          });
        }
      });

      if (!motors.length) {
        console.log(`No motors for plant ${plantId}`); // Log no motors
        return [];
      }

      if (connectionStatus === "Disconnected") {
        const disconnectedMotors = motors.map((motor) => ({
          ...motor,
          status: "NA",
          run_time_sec: 0,
        }));
        console.log(`Motors for plant ${plantId} (disconnected):`, disconnectedMotors); // Log disconnected motors
        return disconnectedMotors;
      }

      console.log(`Mapped motors for plant ${plantId}:`, motors); // Log mapped motors
      return motors;
    },
    [getSensorForPlant, getConnectionStatusForPlant, plantMotors]
  );

  // Calculate total runtime
  const calculateTotalRunTime = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const totalRunTime = sensor.total_runtime_sec || 0;
      console.log(`Total runtime for plant ${plantId}:`, totalRunTime); // Log total runtime
      return totalRunTime;
    },
    [getSensorForPlant]
  );

  // Map sensors for a plant
  const getMappedSensorsForPlant = useCallback(
    (plantId) => {
      const sensor = getSensorForPlant(plantId);
      const connectionStatus = getConnectionStatusForPlant(plantId);
      const plantSensors = groupedSensors[plantId] || [];

      if (!plantSensors.length) {
        console.log(`No sensors for plant ${plantId}`); // Log no sensors
        return [];
      }

      const activeSensors = plantSensors.filter(
        (s) => s.is_sensor_enabled === true
      );

      if (connectionStatus === "Disconnected") {
        const disconnectedSensors = activeSensors.map((s) => ({
          plant_id: plantId,
          sensor_key: s.sensor_key,
          sensor_name: s.sensor_name,
          is_sensor_enabled: s.is_sensor_enabled,
          value: "NA",
        }));
        console.log(`Sensors for plant ${plantId} (disconnected):`, disconnectedSensors); // Log disconnected sensors
        return disconnectedSensors;
      }

      const mappedSensors = activeSensors.map((s) => ({
        plant_id: plantId,
        sensor_key: s.sensor_key,
        sensor_name: s.sensor_name,
        is_sensor_enabled: s.is_sensor_enabled,
        value:
          sensor[s.sensor_key] !== undefined
            ? sensor[s.sensor_key]
            : s.value !== undefined
            ? s.value
            : "NA",
      }));
      console.log(`Mapped sensors for plant ${plantId}:`, mappedSensors); // Log mapped sensors
      return mappedSensors;
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
        setConnectionStatusMoto((prev) => {
          console.log(`Updating connectionStatusMoto for plant ${plantId}: connected`); // Log connection status
          return { ...prev, [plantId]: "connected" };
        });
      } else {
        setConnectionStatusWaterPump("connected");
        console.log("Updating connectionStatusWaterPump: connected"); // Log connection status
      }
      const plantStatus = (
        socketType === "moto" ? sensorMoto[plantId] : sensorWaterPump
      )?.plant_status;
      setIsButtonDisabled((prev) => {
        console.log(`Updating isButtonDisabled for plant ${plantId}:`, !(plantStatus === "IDLE" || plantStatus === "RUNNING")); // Log button state
        return {
          ...prev,
          [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
        };
      });
      const newTimeout = setTimeout(() => {
        if (socketType === "moto" && plantId) {
          setConnectionStatusMoto((prev) => {
            console.log(`Updating connectionStatusMoto for plant ${plantId}: Disconnected`); // Log timeout
            return { ...prev, [plantId]: "Disconnected" };
          });
          setIsButtonDisabled((prev) => {
            console.log(`Disabling button for plant ${plantId} due to timeout`); // Log button disable
            return { ...prev, [plantId]: true };
          });
        } else {
          setConnectionStatusWaterPump("Disconnected");
          setIsButtonDisabled((prev) => {
            console.log("Disabling buttons for all plants due to water-pump timeout"); // Log timeout
            return Object.fromEntries(loginPlantIds.map((id) => [id, true]));
          });
        }
      }, 10000);
      if (socketType === "moto") timeoutMoto = newTimeout;
      else timeoutWaterPump = newTimeout;
    };

    const handleSensorDataMoto = async (data) => {
      const plantId = data.data.id;
      if (!loginPlantIds.includes(plantId)) return;
      const sensorData = data.data.sensordata;

      console.log("Received moto sensor data for plant:", plantId, sensorData); // Already present
      setSensorMoto((prev) => {
        console.log("Updating sensorMoto state:", { ...prev, [plantId]: sensorData }); // Log state update
        return { ...prev, [plantId]: sensorData };
      });
      const plantStatus = sensorData.plant_status;
      setIsButtonDisabled((prev) => {
        console.log(`Updating isButtonDisabled for plant ${plantId}:`, !(plantStatus === "IDLE" || plantStatus === "RUNNING")); // Log button state
        return {
          ...prev,
          [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
        };
      });
      if (
        !lastUpdateTimes.current[plantId] ||
        Date.now() >= lastUpdateTimes.current[plantId]
      ) {
        if (plantStatus === "IDLE") {
          setMotorStatuses((prev) => {
            console.log(`Updating motorStatuses for plant ${plantId}: OFF`); // Log status update
            return { ...prev, [plantId]: "OFF" };
          });
          lastUpdateTimes.current[plantId] = Date.now();
        } else if (plantStatus === "RUNNING") {
          setMotorStatuses((prev) => {
            console.log(`Updating motorStatuses for plant ${plantId}: ON`); // Log status update
            return { ...prev, [plantId]: "ON" };
          });
          lastUpdateTimes.current[plantId] = Date.now();
        }
      }
      if (sensorData.motor1_status === "ON") {
        setMotorNumbers((prev) => {
          console.log(`Updating motorNumbers for plant ${plantId}: 1`); // Log motor number
          return { ...prev, [plantId]: 1 };
        });
      } else if (sensorData.motor2_status === "ON") {
        setMotorNumbers((prev) => {
          console.log(`Updating motorNumbers for plant ${plantId}: 2`); // Log motor number
          return { ...prev, [plantId]: 2 };
        });
      }
      resetTimeout("moto", setConnectionStatusMoto, plantId);

      if (!plantMotors[plantId]) {
        await fetchMotorData([{ plant_id: plantId }]);
      }
    };

    const handleSensor = async (data) => {
      const plantId = data.plant_id;
      if (!loginPlantIds.includes(plantId)) return;
      console.log("Received water pump sensor data for plant:", plantId, data); // Already present
      setSensorWaterPump(data);
      console.log("Updating sensorWaterPump state:", data); // Log state update
      const plantStatus = data.plant_status;
      setIsButtonDisabled((prev) => {
        console.log(`Updating isButtonDisabled for plant ${plantId}:`, !(plantStatus === "IDLE" || plantStatus === "RUNNING")); // Log button state
        return {
          ...prev,
          [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
        };
      });
      if (
        !lastUpdateTimes.current[plantId] ||
        Date.now() >= lastUpdateTimes.current[plantId]
      ) {
        if (plantStatus === "IDLE") {
          setMotorStatuses((prev) => {
            console.log(`Updating motorStatuses for plant ${plantId}: OFF`); // Log status update
            return { ...prev, [plantId]: "OFF" };
          });
          lastUpdateTimes.current[plantId] = Date.now();
        } else if (plantStatus === "RUNNING") {
          setMotorStatuses((prev) => {
            console.log(`Updating motorStatuses for plant ${plantId}: ON`); // Log status update
            return { ...prev, [plantId]: "ON" };
          });
          lastUpdateTimes.current[plantId] = Date.now();
        }
      }
      if (data.motor1_status === "ON") {
        setMotorNumbers((prev) => {
          console.log(`Updating motorNumbers for plant ${plantId}: 1`); // Log motor number
          return { ...prev, [plantId]: 1 };
        });
      } else if (data.motor2_status === "ON") {
        setMotorNumbers((prev) => {
          console.log(`Updating motorNumbers for plant ${plantId}: 2`); // Log motor number
          return { ...prev, [plantId]: 2 };
        });
      }
      resetTimeout("water-pump", setConnectionStatusWaterPump);

      if (!plantMotors[plantId]) {
        await fetchMotorData([{ plant_id: plantId }]);
      }
    };

    const handleConnectMoto = () => {
      setConnectionStatusMoto(
        loginPlantIds.reduce(
          (acc, plantId) => ({ ...acc, [plantId]: "Disconnected" }),
          {}
        )
      );
      setIsButtonDisabled((prev) =>
        Object.fromEntries(loginPlantIds.map((id) => [id, true]))
      );
      console.log("Moto socket connected, initial connectionStatusMoto:", loginPlantIds.reduce(
        (acc, plantId) => ({ ...acc, [plantId]: "Disconnected" }),
        {}
      )); // Log connection
    };

    const handleConnectWaterPump = () => {
      setConnectionStatusWaterPump("connected");
      console.log("Water pump socket connected, connectionStatusWaterPump: connected"); // Log connection
    };

    const handleDisconnectMoto = () => {
      setConnectionStatusMoto(
        loginPlantIds.reduce(
          (acc, plantId) => ({ ...acc, [plantId]: "Disconnected" }),
          {}
        )
      );
      setIsButtonDisabled((prev) =>
        Object.fromEntries(loginPlantIds.map((id) => [id, true]))
      );
      console.log("Moto socket disconnected, connectionStatusMoto:", loginPlantIds.reduce(
        (acc, plantId) => ({ ...acc, [plantId]: "Disconnected" }),
        {}
      )); // Log disconnection
    };

    const handleDisconnectWaterPump = () => {
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled((prev) =>
        Object.fromEntries(loginPlantIds.map((id) => [id, true]))
      );
      console.log("Water pump socket disconnected, connectionStatusWaterPump: Disconnected"); // Log disconnection
    };

    const handleConnectErrorWaterPump = (error) => {
      console.error("Connection error for water-pump server:", error.message); // Already present
      setConnectionStatusWaterPump("Disconnected");
      setIsButtonDisabled((prev) =>
        Object.fromEntries(loginPlantIds.map((id) => [id, true]))
      );
      console.log("Water pump socket connect error, setting connectionStatusWaterPump: Disconnected"); // Log error
    };

    const handleError = (data) => {
      console.error("Server error:", data.message); // Already present
      const plantIdMatch = data.message.match(/plantId: (\w+)/);
      const plantId = plantIdMatch ? plantIdMatch[1] : "global";
      if (plantId !== "global" && !loginPlantIds.includes(plantId)) return;
      setError((prev) => {
        console.log(`Updating error state for plant ${plantId}:`, data.message); // Log error update
        return { ...prev, [plantId]: data.message };
      });
      setIsButtonDisabled((prev) => {
        console.log(`Disabling button for plant ${plantId} due to error`); // Log button disable
        return { ...prev, [plantId]: true };
      });
    };

    const handleMotorStatusUpdate = (data) => {
      const { plantId, timestamp } = data;
      if (!loginPlantIds.includes(plantId)) return;
      const sensor = getSensorForPlant(plantId);
      const plantStatus = sensor.plant_status;
      console.log("Received motor status update:", data); // Already present
      if (
        !lastUpdateTimes.current[plantId] ||
        timestamp >= lastUpdateTimes.current[plantId]
      ) {
        if (
          (data.command === "ON" && plantStatus === "RUNNING") ||
          (data.command === "OFF" && plantStatus === "IDLE")
        ) {
          setMotorStatuses((prev) => {
            console.log(`Updating motorStatuses for plant ${plantId}:`, data.command); // Log status update
            return { ...prev, [plantId]: data.command };
          });
          lastUpdateTimes.current[plantId] = timestamp;
        }
        setIsButtonDisabled((prev) => {
          console.log(`Updating isButtonDisabled for plant ${plantId}:`, !(plantStatus === "IDLE" || plantStatus === "RUNNING")); // Log button state
          return {
            ...prev,
            [plantId]: !(plantStatus === "IDLE" || plantStatus === "RUNNING"),
          };
        });
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

    socketWaterPump.emit("test_connection", {
      message: "Checking water-pump connection",
    });

    socketWaterPump.on("test_connection_response", (data) => {
      console.log("Received test connection response from water-pump:", data); // Already present
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
  }, [
    sensorMoto,
    sensorWaterPump,
    plantData,
    getSensorForPlant,
    plantMotors,
    loginPlantIds,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    console.log("Triggering initial data fetch"); // Log fetch trigger
  }, [fetchInitialData]);

  // Refresh data for specific plant
  useEffect(() => {
    if (sensorWaterPump?.plant_id && loginPlantIds.includes(sensorWaterPump.plant_id)) {
      fetchInitialData();
      console.log("Refreshing data for plant:", sensorWaterPump.plant_id); // Log refresh trigger
    }
  }, [sensorWaterPump, fetchInitialData, loginPlantIds]);

  // Initialize motorStatuses and motorNumbers
  useEffect(() => {
    plantData.forEach((plant) => {
      const sensor = getSensorForPlant(plant.plant_id);
      setMotorStatuses((prev) => {
        const status = sensor.plant_status === "RUNNING" ? "ON" : "OFF";
        console.log(`Initializing motorStatuses for plant ${plant.plant_id}:`, status); // Log status init
        return { ...prev, [plant.plant_id]: status };
      });
      setMotorNumbers((prev) => {
        const number = sensor.motor1_status === "ON"
          ? 1
          : sensor.motor2_status === "ON"
          ? 2
          : 1;
        console.log(`Initializing motorNumbers for plant ${plant.plant_id}:`, number); // Log number init
        return { ...prev, [plant.plant_id]: number };
      });
      setIsButtonDisabled((prev) => {
        const disabled = !(sensor.plant_status === "IDLE" || sensor.plant_status === "RUNNING");
        console.log(`Initializing isButtonDisabled for plant ${plant.plant_id}:`, disabled); // Log button init
        return { ...prev, [plant.plant_id]: disabled };
      });
    });
  }, [plantData, getSensorForPlant]);

  // Loading state
  if (loading) {
    console.log("Rendering loading state"); // Log loading render
    return (
      <div className="w-full mx-auto mb-16 lg:mb-[110px]">
        <div className="flex justify-center items-center h-64">
          <div className="text-base lg:text-lg">Loading plant data...</div>
        </div>
      </div>
    );
  }

  // Global error state
  if (error.global) {
    console.log("Rendering global error state:", error.global); // Log error render
    return (
      <div className="w-full mx-auto mb-16 lg:mb-[110px]">
        <div className="flex justify-center items-center h-64">
          <div className="text-base text-red-500 lg:text-lg">Error: {error.global}</div>
        </div>
      </div>
    );
  }

  // Render logic remains unchanged
  return (
    <div className="w-full mx-auto mb-16 lg:mb-[110px]">
      <div className="flex-1 w-full">
        <div className="mb-4 lg:mb-6 lg:px-[22px]">
          <div className="relative mt-6 lg:mt-9">
            <MagnifyingGlassIcon className="absolute left-3 top-6.5 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B] lg:h-5 lg:w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search plants by name..."
              className="w-full pl-10 pr-4 py-2 border border-[#DADADA] rounded-[12px] text-sm text-[#4E4D4D] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#208CD4] lg:w-[417px] lg:py-3 lg:text-[16px] lg:shadow-sm lg:mb-5"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 items-start lg:flex-row lg:flex-wrap lg:gap-[24px] lg:px-[22px] lg:pb-[110px] lg:max-w-full">
          {filteredPlants.length > 0 ? (
            filteredPlants.map((plant, index) => {
              const plantSensors = getMappedSensorsForPlant(plant.plant_id);
              const motors = getMappedMotorsForPlant(plant.plant_id);
              const sensor = getSensorForPlant(plant.plant_id);
              const connectionStatus = getConnectionStatusForPlant(
                plant.plant_id
              );
              const manualMode = getManualModeForPlant(plant.plant_id);
              const displayedPlantStatus = getDisplayedPlantStatus(
                plant.plant_id
              );
              const totalRunTime = calculateTotalRunTime(plant.plant_id);
              const currentMotorStatus = motorStatuses[plant.plant_id] || "OFF";
              const currentMotorNumber = motorNumbers[plant.plant_id] || 1;

              console.log(`Rendering plant ${plant.plant_id}:`, {
                plantSensors,
                motors,
                sensor,
                connectionStatus,
                manualMode,
                displayedPlantStatus,
                totalRunTime,
                currentMotorStatus,
                currentMotorNumber
              }); // Log plant render data

              return (
                <div
                  key={plant.plant_id || `plant-${index}`}
                  className="w-full max-w-[360px] px-2 py-2 border border-[#DADADA] rounded-[12px] bg-[#FFFFFF] lg:w-[417px] lg:max-w-[417px] lg:px-[10px] lg:py-[13px]"
                >
                  <div className="flex justify-between mb-2 items-center lg:mb-[10px]">
                    <p className="text-[#4E4D4D] text-base font-[700] max-w-[70%] overflow-wrap-break-word lg:text-[17px]">
                      {plant.plant_name || "Unknown Plant"}
                    </p>
                    {canControlPlant && (
                      <div className="flex flex-col items-center">
                        <button
                          id={plant.plant_id}
                          onClick={() => togglePump(plant.plant_id)}
                          disabled={
                            isButtonDisabled[plant.plant_id] ||
                            connectionStatus === "Disconnected"
                          }
                          className={`flex items-center py-2 px-4 ml-2 rounded-[6px] gap-2 justify-center text-sm text-[#FFFFFF] ${
                            isButtonDisabled[plant.plant_id] ||
                            connectionStatus === "Disconnected"
                              ? "bg-[#DADADA] cursor-not-allowed"
                              : currentMotorStatus === "ON"
                              ? "bg-[#EF5350]"
                              : "bg-[#66BB6A]"
                          } lg:py-[10px] lg:px-[18px] lg:ml-[10px] lg:gap-[10px] lg:text-[16px]`}
                        >
                          <img
                            src={icon}
                            alt="Icon"
                            className="w-4 h-4 lg:w-[20px] lg:h-[20px]"
                          />
                          {currentMotorStatus === "ON" ? "STOP" : "START"}
                        </button>
                        {error[plant.plant_id] && (
                          <p className="text-red-500 text-xs mt-1 lg:text-sm lg:mt-2">
                            {error[plant.plant_id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex text-xs text-[#6B6B6B] mb-2 font-[400] justify-between lg:text-[14px] lg:mb-[10px]">
                    <div className="pr-2 max-w-[33%] text-center lg:pr-[10px] lg:max-w-[30%]">
                      <p>Connection</p>
                      <p
                        className={`text-base font-[600] ${
                          connectionStatus === "Disconnected"
                            ? "text-[#EF5350]"
                            : "text-[#4CAF50]"
                        } lg:text-[18px]`}
                      >
                        {connectionStatus.charAt(0).toUpperCase() +
                          connectionStatus.slice(1).toLowerCase()}
                      </p>
                    </div>
                    <div className="pr-2 max-w-[33%] text-center lg:pr-[10px] lg:max-w-[30%]">
                      <p>Status</p>
                      <p
                        className={`text-base font-[600] ${
                          displayedPlantStatus === "Disconnected" ||
                          displayedPlantStatus === "POWER-OK"
                            ? "text-[#EF5350]"
                            : displayedPlantStatus === "RUNNING"
                            ? "text-[#4CAF50]"
                            : "text-[#208CD4]"
                        } lg:text-[18px]`}
                      >
                        {displayedPlantStatus
                          ? displayedPlantStatus.charAt(0).toUpperCase() +
                            displayedPlantStatus.slice(1).toLowerCase()
                          : "NA"}
                      </p>
                    </div>
                    <div className="max-w-[33%] text-center lg:max-w-[30%]">
                      <p>Mode</p>
                      <p className="text-base text-[#4CAF50] font-[600] lg:text-[18px]">
                        {connectionStatus === "Disconnected"
                          ? "NA"
                          : manualMode}
                      </p>
                    </div>
                  </div>
                  <div className="flex text-xs text-[#6B6B6B] mb-2 font-[400] justify-between lg:text-[14px] lg:mb-[10px]">
                    <div className="pr-2 max-w-[50%] text-center lg:pr-[10px]">
                      <p>V (V1/ V2/ V3)</p>
                      <p className="text-base text-[#208CD4] font-[600] lg:text-[18px]">
                        {connectionStatus === "Disconnected"
                          ? "NA"
                          : `${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorVoltageL1Key
                              ] ?? "NA"
                            }/ ${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorVoltageL2Key
                              ] ?? "NA"
                            }/ ${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorVoltageL3Key
                              ] ?? "NA"
                            } V`}
                      </p>
                    </div>
                    <div className="max-w-[50%] text-center">
                      <p>I (I1/ I2/ I3)</p>
                      <p className="text-base text-[#208CD4] font-[600] lg:text-[18px]">
                        {connectionStatus === "Disconnected"
                          ? "NA"
                          : `${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorCurrentL1Key
                              ] ?? "NA"
                            }/ ${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorCurrentL2Key
                              ] ?? "NA"
                            }/ ${
                              sensor[
                                motorStatusKeys(currentMotorNumber)
                                  .motorCurrentL3Key
                              ] ?? "NA"
                            } A`}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2 lg:mb-[6px]">
                    <p className="text-base text-[#4E4D4D] mb-2 font-[700] lg:text-[17px] lg:mb-[6px]">
                      Motor & Power
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {motors.length > 0 ? (
                        motors.map((motor) => {
                          const status = motor.status;
                          const cumulativeTime = motor.run_time_sec
                            ? new Date(motor.run_time_sec * 1000)
                                .toISOString()
                                .substr(11, 8)
                            : "00:00:00";

                          console.log(`Rendering motor for plant ${plant.plant_id}:`, motor); // Log motor render

                          return (
                            <div
                              key={motor.motor_id}
                              className="border border-[#DADADA] rounded-[8px] p-1 text-xs font-[400] text-[#6B6B6B] lg:p-1 lg:text-[14px]"
                            >
                              <div className="flex items-center justify-between font-[700] text-[#4E4D4D]">
                                <div className="text-start">
                                  <div className="flex items-center gap-1">
                                    <p className="text-sm lg:text-[16px]">
                                      {motor.motor_name}
                                    </p>
                                    <span className="text-[11px] lg:text-[13px]">
                                      ({getMotorLabel(motor.motor_working_order)})
                                    </span>
                                  </div>
                                </div>
                                <p
                                  className={`text-sm ${
                                    status === "ON"
                                      ? "text-[#4CAF50]"
                                      : status === "OFF"
                                      ? "text-[#EF5350]"
                                      : "text-[#208CD4]"
                                  } lg:text-[16px]`}
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
                    {motors.length > 0 && (
                      <div className="mt-2 text-xs text-[#6B6B6B] font-[400] flex justify-between lg:text-[14px]">
                        <p className="font-[700] text-[#4E4D4D]">Total Time</p>
                        <p className="text-[#208CD4] font-[600]">
                          {connectionStatus === "Disconnected"
                            ? "NA"
                            : `${new Date(totalRunTime * 1000)
                                .toISOString()
                                .substr(11, 8)} S`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="border-b border-b-[#208CD4] mb-2 text-[#4E4D4D] font-[700] text-base lg:mb-[6px] lg:text-[18px]">
                      Sensors & Actuators
                    </p>
                    <div className="mt-2 text-[#6B6B6B] text-xs font-[400] lg:mt-[6px] lg:text-[14px]">
                      <div className="grid grid-cols-4 gap-2 border-b border-b-[#DADADA] pb-2 lg:pb-[6px]">
                        {plantSensors.length > 0 ? (
                          plantSensors
                            .filter(
                              (apidata) => apidata.is_sensor_enabled === true
                            )
                            .map((apidata, index) => {
                              const isVacuumSwitch =
                                apidata.sensor_key === "vacuum_switch_ok";
                              const sensorValue = isVacuumSwitch
                                ? apidata.value == null ||
                                  connectionStatus === "Disconnected"
                                  ? "NA"
                                  : apidata.value === 1
                                  ? "OK"
                                  : "NOT OK"
                                : apidata.value == null ||
                                  connectionStatus === "Disconnected"
                                  ? "NA"
                                  : apidata.value;

                              console.log(`Rendering sensor for plant ${plant.plant_id}:`, apidata); // Log sensor render

                              return (
                                <div
                                  key={apidata.sensor_key || `sensor-${index}`}
                                >
                                  <p className="font-[600]">
                                    {apidata.sensor_name || "Sensor"}
                                  </p>
                                  <p
                                    className={`text-sm font-[600] ${
                                      isVacuumSwitch
                                        ? sensorValue === "OK"
                                          ? "text-[#4CAF50]"
                                          : "text-[#EF5350]"
                                        : sensorValue === "ON"
                                        ? "text-[#4CAF50]"
                                        : sensorValue === "OFF" ||
                                          sensorValue === "NA"
                                        ? "text-[#EF5350]"
                                        : "text-[#208CD4]"
                                    } lg:text-[15px]`}
                                  >
                                    {sensorValue}
                                  </p>
                                </div>
                              );
                            })
                        ) : (
                          <div className="col-span-3">
                            No enabled sensor data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-[#6B6B6B] text-sm lg:text-base">
              No plants found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;