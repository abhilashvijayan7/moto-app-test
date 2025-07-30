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
        const updatedLog = [...newLogEntries, ...prev].slice(0, 40);
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
    <div className="min-h-screen p-4 sm:p-6 max-w-full sm:max-w-[480px] lg:max-w-none mx-auto text-[#6B6B6B] my-4">
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-[#4E4D4D] font-bold text-xl sm:text-2xl mb-4">
            Data Log
          </h2>
          {/* Desktop/Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-full">
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {['Time', 'Plant ID', 'Plant Name', ...headers.map(header => header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))].map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {header}
                    </div>
                  ))}
                </div>
              </div>
              {logData.length > 0 ? (
                logData.map((log, index) => (
                  <div key={index} className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 px-4 py-3 border-b border-gray-200 text-sm">
                    <div>{log.time}</div>
                    <div>{log.plantId}</div>
                    <div>{log.plantName}</div>
                    {headers.map((header) => (
                      <div key={header}>
                        {(header.endsWith('_status') || header === 'chlorineGasValve' || header === 'hoclValve' || header === 'waterInletValve' || header === 'vacuum_switch_ok' || header === 'manual_mode_active') ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                            ${log[header] === 'ON' || log[header] === 'OK' || log[header] === 'Manual' ? 'bg-green-100 text-green-800' : 
                              log[header] === 'OFF' || log[header] === 'NOT OK' || log[header] === 'Auto' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {log[header]}
                          </span>
                        ) : (
                          log[header]
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No log data available. Waiting for sensor updates...
                </div>
              )}
            </div>
          </div>
          {/* Mobile/Card View */}
          <div className="sm:hidden space-y-3">
            {logData.length > 0 ? (
              logData.map((log, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold">Time:</span>
                      <span>{log.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Plant ID:</span>
                      <span>{log.plantId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Plant Name:</span>
                      <span>{log.plantName}</span>
                    </div>
                    {headers.map((header) => (
                      <div key={header} className="flex justify-between">
                        <span className="font-semibold">
                          {header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                        </span>
                        <span>
                          {(header.endsWith('_status') || header === 'chlorineGasValve' || header === 'hoclValve' || header === 'waterInletValve' || header === 'vacuum_switch_ok' || header === 'manual_mode_active') ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                              ${log[header] === 'ON' || log[header] === 'OK' || log[header] === 'Manual' ? 'bg-green-100 text-green-800' : 
                                log[header] === 'OFF' || log[header] === 'NOT OK' || log[header] === 'Auto' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {log[header]}
                            </span>
                          ) : (
                            log[header]
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                No log data available. Waiting for sensor updates...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataLog;