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

  const staticFields = [];

  const dynamicFields = useMemo(() => {
    if (!data.length) return [];
    const allKeys = Object.keys(data[0]);
    return allKeys.filter((key) => !staticFields.includes(key));
  }, [data]);

  const staticColumns = staticFields.map((field) => ({
    label: field.charAt(0).toUpperCase() + field.slice(1),
    accessor: field,
  }));

  const dynamicColumns = dynamicFields.map((field) => ({
    label: field.charAt(0).toUpperCase() + field.slice(1),
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

  const fetchDataFromServer = useCallback(
    async ({ page, pageSize }) => {
      if (!tableFilters.plantId || !startDate || !endDate) return { data: [], totalCount: 0 };
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://water-pump.onrender.com/api/plantops/plant/${tableFilters.plantId}/motors/motordynamicpaginated?start=${startDate}&end=${endDate}&limit=${pageSize}&offset=${(page - 1) * pageSize}`
        );
        if (!response.ok) throw new Error('Failed to load data.');
        const json = await response.json();
        setData(json.data);
        setTotalRows(json.totalCount);
        return { data: json.data, totalCount: json.totalCount };
      } catch (err) {
        setError(err.message || 'Something went wrong');
        return { data: [], totalCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    [tableFilters.plantId, startDate, endDate]
  );

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
  };

  const handleSummaryTypeChange = (e) => {
    setSummaryType(e.target.value);
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
        </div>

        {error && <p className="text-center text-red-500 py-4 text-sm">{error}</p>}

        <div className="p-4">
          <DataTable
            mode="server"
            fetchData={fetchDataFromServer}
            totalRows={totalRows}
            columns={columns}
            pageSizeOptions={[5, 10, 15, 20, 50, 100]} // Added 5 to pageSizeOptions
            defaultPageSize={5} // Set default page size to 5
          />
        </div>
      </div>
    </div>
  );
};

export default SavedLog;

// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk