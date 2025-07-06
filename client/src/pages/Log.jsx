import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const socketMoto = io("https://moto-app-test.onrender.com", {
  transports: ["websocket"],
});

const DataLog = () => {
  const location = useLocation();
  const [logData, setLogData] = useState([]);
  const [sensorMoto, setSensorMoto] = useState({});
  const [plantNames, setPlantNames] = useState({}); // For dynamic plant name mapping

  // Fetch plant names from API
  useEffect(() => {
    const fetchPlantNames = async () => {
      try {
        const response = await axios.get("https://water-pump.onrender.com/api/plants");
        const plants = Array.isArray(response.data) ? response.data : [];
        console.log("Fetched plant names:", plants);
        const names = plants.reduce((acc, plant) => ({
          ...acc,
          [plant.plant_id]: plant.plant_name || `Unknown Plant ${plant.plant_id}`,
        }), {});
        setPlantNames(names);
      } catch (error) {
        console.error("Error fetching plant names:", error.message);
        setPlantNames({});
      }
    };

    fetchPlantNames();
  }, []);

  // Handle socket data and initial route state
  useEffect(() => {
    // Handle initial data from route state (for when navigation is implemented)
    const sensorData = location.state?.sensorData;
    if (sensorData && sensorData.data && sensorData.data.sensordata) {
      const plantId = sensorData.data.id;
      setSensorMoto((prev) => ({ ...prev, [plantId]: sensorData.data.sensordata }));
      console.log("Initial sensor data from route:", sensorData);
    }

    // Socket event listener for real-time updates
    const handleSensorDataMoto = (data) => {
      const plantId = data.data.id;
      const sensorData = data.data.sensordata;
      console.log(`Received sensor data for plant ${plantId}:`, sensorData);
      setSensorMoto((prev) => ({
        ...prev,
        [plantId]: sensorData,
      }));
    };

    socketMoto.on("sensor_data", handleSensorDataMoto);

    // Clean up socket listener
    return () => {
      socketMoto.off("sensor_data", handleSensorDataMoto);
    };
  }, [location.state]);

  // Format seconds to HH/MM/SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00/00/00";
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}/${minutes}/${secs}`;
  };

  // Update log every 5 seconds with current sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Current sensorMoto:", sensorMoto);
      console.log("Current plantNames:", plantNames);
      const newLogEntries = Object.entries(sensorMoto).map(([plantId, data]) => {
        if (!data || typeof data !== 'object') {
          console.log(`Invalid sensor data for plant ${plantId}`);
          return null;
        }
        const entry = {
          time: new Date().toLocaleTimeString(),
          plantId,
          plantName: plantNames[plantId] || `Unknown Plant ${plantId}`,
        };
        // Dynamically add all sensordata fields
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'vacuum_switch_ok') {
            entry[key] = value === 1 ? 'OK' : value === 0 ? 'NOT OK' : 'NA';
          } else if (key === 'manual_mode_active') {
            entry[key] = value === 1 ? 'Manual' : value === 0 ? 'Auto' : 'NA';
          } else if (key === 'motor_runtime_sec' || key === 'total_runtime_sec') {
            entry[key] = formatTime(value);
          } else {
            entry[key] = value !== undefined && value !== null ? value : 'NA';
          }
        });
        return entry;
      }).filter(entry => entry !== null);
      setLogData((prev) => {
        const updatedLog = [...newLogEntries, ...prev].slice(0, 10); // Keep last 10 entries
        console.log("Updated log entries:", updatedLog);
        return updatedLog;
      });
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [sensorMoto, plantNames]);

  // Dynamically determine headers from the latest log entry
  const headers = logData.length > 0
    ? Object.keys(logData[0]).filter(key => key !== 'plantId' && key !== 'time' && key !== 'plantName')
    : [];

  return (
    <div className="container mx-auto p-4 bg-white rounded-md shadow-md lg:mt-20">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Data Log</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">TIME</th>
            <th className="p-2 border">PLANT ID</th>
            <th className="p-2 border">PLANT NAME</th>
            {headers.map((header, index) => (
              <th key={index} className="p-2 border">{header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logData.map((log, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 border text-gray-600">{log.time}</td>
              <td className="p-2 border">{log.plantId}</td>
              <td className="p-2 border">{log.plantName}</td>
              {headers.map((header) => (
                <td key={header} className="p-2 border">
                  {header.endsWith('_status') || header === 'chlorineGasValve' || header === 'hoclValve' || header === 'waterInletValve' ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log[header] === "ON" ? "bg-green-100 text-green-800" : log[header] === "OFF" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                      {log[header]}
                    </span>
                  ) : (
                    log[header]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {logData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No log data available. Waiting for sensor updates...</p>
      )}
    </div>
  );
};

export default DataLog;