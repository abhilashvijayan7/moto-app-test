import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SavedLog = () => {
  const [logData, setLogData] = useState([]);
  const [plantNames, setPlantNames] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Configurable records per page

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

  // Fetch plant operation data based on date range
  const fetchPlantData = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new fetch
    try {
      const response = await axios.get(
        `https://water-pump.onrender.com/api/plantops/filter?start=${startDate}&end=${endDate}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      console.log("Fetched plant data:", data);

      // Map API data to match existing logData structure
      const formattedData = data.map((item) => ({
        time: new Date(item.recorded_at).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        plantId: item.plant_id,
        plantName: plantNames[item.plant_id] || item.plant_name || `Unknown Plant ${item.plant_id}`,
        plant_status: item.plant_status || 'NA',
        operational_mode: item.operational_mode || 'NA',
        chlorine_cylinder_weight: item.chlorine_cylinder_weight || 'NA',
        chlorine_gas_valve_status: item.chlorine_gas_valve_status ? 'ON' : 'OFF',
        hocl_valve_status: item.hocl_valve_status ? 'ON' : 'OFF',
        water_inflow_status: item.water_inflow_status ? 'ON' : 'OFF',
        chlorine_leakage_detected: item.chlorine_leakage_detected ? 'YES' : 'NO',
        manual_mode_pressed: item.manual_mode_pressed ? 'YES' : 'NO',
        physical_on_button_pressed: item.physical_on_button_pressed ? 'YES' : 'NO',
        plant_voltage_l1: item.plant_voltage_l1 || 'NA',
        plant_voltage_l2: item.plant_voltage_l2 || 'NA',
        plant_voltage_l3: item.plant_voltage_l3 || 'NA',
        plant_current_l1: item.plant_current_l1 || 'NA',
        plant_current_l2: item.plant_current_l2 || 'NA',
        plant_current_l3: item.plant_current_l3 || 'NA',
        residual_chlorine_plant: item.residual_chlorine_plant || 'NA',
        residual_chlorine_farthest: item.residual_chlorine_farthest || 'NA',
        water_level_glr: item.water_level_glr || 'NA',
        water_level_oht: item.water_level_oht || 'NA',
        last_fault_message: item.last_fault_message || 'NA',
        plant_total_time: item.plant_total_time
          ? formatTime(
              item.plant_total_time.hours * 3600 +
              item.plant_total_time.minutes * 60 +
              item.plant_total_time.seconds
            )
          : '00:00:00',
        vaccum_switch_status: item.vaccum_switch_status === null ? 'NA' : item.vaccum_switch_status ? 'OK' : 'NOT OK',
      }));

      setLogData(formattedData); // Store all data without limit
    } catch (error) {
      console.error("Error fetching plant data:", error.message);
      setError("Failed to fetch data. Please try again.");
      setLogData([]);
    } finally {
      setLoading(false);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00:00";
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  // Handle date input changes
  const handleDateChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlantData();
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = logData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(logData.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5; // Show up to 5 page buttons at a time
    const sideButtons = Math.floor((maxPageButtons - 1) / 2);

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - sideButtons);
      let endPage = Math.min(totalPages, currentPage + sideButtons);

      if (endPage - startPage < maxPageButtons - 1) {
        if (startPage === 1) {
          endPage = maxPageButtons;
        } else if (endPage === totalPages) {
          startPage = totalPages - (maxPageButtons - 1);
        }
      }

      if (startPage > 2) {
        pageNumbers.push(1);
        if (startPage > 3) pageNumbers.push('...');
      }
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Dynamically determine headers
  const headers = logData.length > 0
    ? Object.keys(logData[0]).filter(key => key !== 'plantId' && key !== 'time' && key !== 'plantName')
    : [];

  return (
    <div className="container mx-auto p-2 sm:p-4 bg-white rounded-md shadow-md lg:mt-10">
      <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-700">Data Log</h2>

      {/* Date Range Form */}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => handleDateChange(e, 'start')}
            className="p-2 border rounded-md text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => handleDateChange(e, 'end')}
            className="p-2 border rounded-md text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !startDate || !endDate}
          className="p-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </form>

      {error && (
        <p className="text-center text-red-500 mb-4 text-sm sm:text-base">{error}</p>
      )}

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
            {currentRecords.map((log, index) => (
              <tr key={index} className="border-t">
                <td className="p-1 sm:p-2 border text-gray-600">{log.time}</td>
                <td className="p-1 sm:p-2 border">{log.plantId}</td>
                <td className="p-1 sm:p-2 border">{log.plantName}</td>
                {headers.map((header) => (
                  <td key={header} className="p-1 sm:p-2 border">
                    {(header.endsWith('_status') || header.includes('valve') || header === 'chlorine_leakage_detected' || 
                      header === 'manual_mode_pressed' || header === 'physical_on_button_pressed') ? (
                      <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${log[header] === "ON" || log[header] === "YES" || log[header] === "OK" ? "bg-green-100 text-green-800" : 
                          log[header] === "OFF" || log[header] === "NO" || log[header] === "NOT OK" ? "bg-red-100 text-red-800" : 
                          "bg-gray-100 text-gray-800"}`}>
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
        {currentRecords.map((log, index) => (
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
                    {(header.endsWith('_status') || header.includes('valve') || header === 'chlorine_leakage_detected' || 
                      header === 'manual_mode_pressed' || header === 'physical_on_button_pressed') ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                        ${log[header] === "ON" || log[header] === "YES" || log[header] === "OK" ? "bg-green-100 text-green-800" : 
                          log[header] === "OFF" || log[header] === "NO" || log[header] === "NOT OK" ? "bg-red-100 text-red-800" : 
                          "bg-gray-100 text-gray-800"}`}>
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

      {/* Pagination Controls */}
      {logData.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, logData.length)} of {logData.length} records
          </div>
          <div className="flex gap-2 items-center overflow-x-auto sm:overflow-x-visible">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
            >
              Previous
            </button>
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-gray-700">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`p-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {logData.length === 0 && !loading && !error && (
        <p className="text-center text-gray-500 mt-3 sm:mt-4 text-sm sm:text-base">
          No log data available. Please select a date range and fetch data.
        </p>
      )}
    </div>
  );
};

export default SavedLog;