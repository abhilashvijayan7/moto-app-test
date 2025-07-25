import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import DataTable from '../components/DataTable';

const SavedLog = () => {
  const [plantNames, setPlantNames] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryType, setSummaryType] = useState('plant');
  const [tableFilters, setTableFilters] = useState({
    time: '',
    plantId: '',
    plantName: '',
  });

  const [plantSearch, setPlantSearch] = useState('');
  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define static fields for motor summary
  const staticFields = [];

  const dynamicFields = useMemo(() => {
    if (!data.length) return [];
    const allKeys = Object.keys(data[0]);
    return allKeys.filter((key) => !staticFields.includes(key));
  }, [data, staticFields]);

  const staticColumns = staticFields.map((field) => ({
    label: field === 'total_run_time' ? 'Total Run Time' : field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '),
    accessor: field,
  }));

  const dynamicColumns = dynamicFields.map((field) => ({
    label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '),
    accessor: field,
  }));

  const columns = [...staticColumns, ...dynamicColumns];

  // Fetch plant names
  useEffect(() => {
    const fetchPlantNames = async () => {
      try {
        const response = await axios.get('https://water-pump.onrender.com/api/plants');
        const plants = Array.isArray(response.data) ? response.data : [];
        const names = plants.reduce(
          (acc, plant) => ({
            ...acc,
            [plant.plant_id]: plant.plant_name || `Unknown Plant ${plant.plant_id}`,
          }),
          {}
        );
        setPlantNames(names);
      } catch (error) {
        console.error('Error fetching plant names:', error.message);
        setPlantNames({});
      }
    };
    fetchPlantNames();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPlantDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMotorSummary = async () => {
    if (!tableFilters.plantId || !startDate || !endDate) {
      setError('Please select a plant, start date, and end date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Fetching motor summary data for plant:', tableFilters.plantId, 'start:', startDate, 'end:', endDate);
      const response = await fetch(
        `https://water-pump.onrender.com/api/plantops/plant/${tableFilters.plantId}/motors/summary?start=${startDate}&end=${endDate}`
      );
      if (!response.ok) throw new Error(`Failed to load motor summary data: ${response.status}`);
      const json = await response.json();
      console.log('Motor summary response:', json);

      if (!Array.isArray(json)) {
        console.error('Expected json to be an array, got:', json);
        setError('Invalid data format received from server.');
        setData([]);
        setTotalRows(0);
        return;
      }

      const transformedData = json.map(item => ({
        ...item,
        total_run_time: `${item.total_run_time.hours || 0}h ${item.total_run_time.minutes || 0}m ${item.total_run_time.seconds || 0}s`
      }));

      setData(transformedData);
      setTotalRows(transformedData.length);
      console.log('Transformed motor summary data:', transformedData);
    } catch (err) {
      console.error('Error fetching motor summary:', err);
      setError(err.message || 'Something went wrong while fetching motor summary data.');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantLog = async () => {
    if (!tableFilters.plantId || !startDate || !endDate) {
      setError('Please select a plant, start date, and end date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use a high limit to fetch all data in one request
      const limit = 10000; // Large limit to fetch all records (adjust based on API limits)
      const url = `https://water-pump.onrender.com/api/plantops/plant/${tableFilters.plantId}/motors/motordynamicpaginated?start=${startDate}&end=${endDate}&limit=${limit}&offset=0`;
      console.log('Fetching plant log data from:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load plant log data: ${response.status}`);
      const json = await response.json();
      console.log('Plant log response:', json);

      if (!Array.isArray(json.data)) {
        console.error('Expected json.data to be an array, got:', json.data);
        setError('Invalid data format received from server.');
        setData([]);
        setTotalRows(0);
        return;
      }

      setData(json.data);
      setTotalRows(json.totalCount || json.data.length);
      console.log('Plant log data:', json.data);
    } catch (err) {
      console.error('Error fetching plant log:', err);
      setError(err.message || 'Something went wrong while fetching plant log data.');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (summaryType === 'motor') {
      fetchMotorSummary();
    } else {
      fetchPlantLog();
    }
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
  };

  const handleSummaryTypeChange = (e) => {
    setSummaryType(e.target.value);
    setData([]);
    setTotalRows(0);
    setError('');
  };

  const handleTableFilterChange = (field, value) => {
    setTableFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlantSelect = (plantId, plantName) => {
    setTableFilters((prev) => ({
      ...prev,
      plantId,
      plantName,
    }));
    setPlantSearch('');
    setIsPlantDropdownOpen(false);
  };

  const filteredPlants = Object.entries(plantNames).filter(
    ([plantId, plantName]) =>
      plantId.toLowerCase().includes(plantSearch.toLowerCase()) ||
      plantName.toLowerCase().includes(plantSearch.toLowerCase())
  );

  const isSubmitDisabled = !tableFilters.plantId || !startDate || !endDate;

  return (
    <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1480px] lg:px-11 lg:py-11 lg:w-full lg:bg-white lg:rounded-xl">
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">Log</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <select
                id="summaryType"
                value={summaryType}
                onChange={handleSummaryTypeChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="plant">Plant Log</option>
                <option value="motor">Motor Summary</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative" ref={dropdownRef}>
              <div
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white text-sm cursor-pointer flex items-center"
                onClick={() => setIsPlantDropdownOpen(!isPlantDropdownOpen)}
              >
                <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={plantSearch}
                  onChange={(e) => {
                    setPlantSearch(e.target.value);
                    setIsPlantDropdownOpen(true);
                  }}
                  placeholder={tableFilters.plantName || 'Search plants...'}
                  className="w-full bg-transparent focus:outline-none text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {isPlantDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredPlants.length > 0 ? (
                    filteredPlants.map(([plantId, plantName]) => (
                      <div
                        key={plantId}
                        className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                        onClick={() => handlePlantSelect(plantId, plantName)}
                      >
                        {plantName} (ID: {plantId})
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No plants found</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => handleDateChange(e, 'start')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => handleDateChange(e, 'end')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={`px-4 py-2 rounded-md text-white ${
                isSubmitDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Fetch {summaryType === 'motor' ? 'Motor Summary' : 'Plant Log'}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-red-500 py-4 text-sm">{error}</p>}

        {loading && <p className="text-center text-gray-500 py-4 text-sm">Loading...</p>}

        <div className="p-4">
          <DataTable
            data={data}
            totalRows={totalRows}
            columns={columns}
            pageSizeOptions={summaryType === 'motor' ? [5, 10, 20] : [5, 10, 15, 20, 50, 100]}
            defaultPageSize={summaryType === 'motor' ? 5 : 5}
          />
        </div>
      </div>
    </div>
  );
};

export default SavedLog;

// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk