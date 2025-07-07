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
  const [plantNames, setPlantNames] = useState({});

  // Load log data from localStorage on component mount
  useEffect(() => {
    const savedLogData = localStorage.getItem('logData');
    if (savedLogData) {
      setLogData(JSON.parse(savedLogData));
    }
  }, []);

  // Save log data to localStorage whenever it changes
  useEffect(() => {
    if (logData.length > 0) {
      localStorage.setItem('logData', JSON.stringify(logData));
    }
  }, [logData]);

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
    const sensorData = location.state?.sensorData;
    if (sensorData && sensorData.data && sensorData.data.sensordata) {
      const plantId = sensorData.data.id;
      setSensorMoto((prev) => ({ ...prev, [plantId]: sensorData.data.sensordata }));
      console.log("Initial sensor data from route:", sensorData);
    }

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
    return () => {
      socketMoto.off("sensor_data", handleSensorDataMoto);
    };
  }, [location.state]);

  // Format seconds to HH/MM/SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00:00";
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  // Format current time to HH:MM:SS
  const formatCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Update log every 5 seconds
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
          time: formatCurrentTime(),
          plantId,
          plantName: plantNames[plantId] || `Unknown Plant ${plantId}`,
        };
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
        const updatedLog = [...newLogEntries, ...prev].slice(0, 10);
        console.log("Updated log entries:", updatedLog);
        return updatedLog;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sensorMoto, plantNames]);

  // Dynamically determine headers
  const headers = logData.length > 0
    ? Object.keys(logData[0]).filter(key => key !== 'plantId' && key !== 'time' && key !== 'plantName')
    : [];

  return (
    <div className="container mx-auto p-2 sm:p-4 bg-white rounded-md shadow-md lg:mt-10">
      <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-700">Data Log</h2>
      
      {/* Desktop/Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-1 sm:p-2 border">TIME</th>
              <th className="p-1 sm:p-2 border">PLANT ID</th>
              <th className="p-1 sm:p-2 border">PLANT NAME</th>
              {headers.map((header, index) => (
                <th key={index} className="p-1 sm:p-2 border">
                  {header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logData.map((log, index) => (
              <tr key={index} className="border-t">
                <td className="p-1 sm:p-2 border text-gray-600">{log.time}</td>
                <td className="p-1 sm:p-2 border">{log.plantId}</td>
                <td className="p-1 sm:p-2 border">{log.plantName}</td>
                {headers.map((header) => (
                  <td key={header} className="p-1 sm:p-2 border">
                    {header.endsWith('_status') || header === 'chlorineGasValve' || header === 'hoclValve' || header === 'waterInletValve' ? (
                      <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${log[header] === "ON" ? "bg-green-100 text-green-800" : log[header] === "OFF" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
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
      </div>

      {/* Mobile/Card View */}
      <div className="sm:hidden space-y-4">
        {logData.map((log, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-semibold">Time:</div>
              <div>{log.time}</div>
              <div className="font-semibold">Plant ID:</div>
              <div>{log.plantId}</div>
              <div className="font-semibold">Plant Name:</div>
              <div>{log.plantName}</div>
              {headers.map((header) => (
                <React.Fragment key={header}>
                  <div className="font-semibold">
                    {header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                  </div>
                  <div>
                    {header.endsWith('_status') || header === 'chlorineGasValve' || header === 'hoclValve' || header === 'waterInletValve' ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${log[header] === "ON" ? "bg-green-100 text-green-800" : log[header] === "OFF" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {log[header]}
                      </span>
                    ) : (
                      log[header]
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      {logData.length === 0 && (
        <p className="text-center text-gray-500 mt-3 sm:mt-4 text-sm sm:text-base">
          No log data available. Waiting for sensor updates...
        </p>
      )}
    </div>
  );
};

export default DataLog;

// log after local storage