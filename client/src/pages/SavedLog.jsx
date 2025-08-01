import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Search, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
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
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate columns dynamically from data keys
  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).map((key) => ({
      label: key === 'total_run_time' ? 'Total Run Time' : key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      accessor: key,
    }));
  }, [data]);

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        startDateRef.current &&
        !startDateRef.current.contains(event.target) &&
        endDateRef.current &&
        !endDateRef.current.contains(event.target)
      ) {
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
      const { data: resultData, totalCount } = await fetchData({ page: 1, pageSize: 5 });
      setData(resultData);
      setTotalRows(totalCount);
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
    if (type === 'startDate') setStartDate(value);
    else if (type === 'endDate') setEndDate(value);
  };

  const handleSummaryTypeChange = (e) => {
    setSummaryType(e.target.value);
    setData([]);
    setTotalRows(0);
    setError('');
    setStartDate('');
    setEndDate('');
    setPlantSearch('');
    setTableFilters({
      time: '',
      plantId: '',
      plantName: '',
    });
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

  const fetchData = async ({ page, pageSize }) => {
    if (!tableFilters.plantId || !startDate || !endDate) {
      return { data: [], totalCount: 0 };
    }

    const offset = (page - 1) * pageSize;
    const url = `https://water-pump.onrender.com/api/plantops/plant/${tableFilters.plantId}/motors/motordynamicpaginated?start=${startDate}&end=${endDate}&limit=${pageSize}&offset=${offset}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch paginated plant log');

      const json = await response.json();
      const resultData = Array.isArray(json.data) ? json.data : [];

      return {
        data: resultData,
        totalCount: json.totalCount || resultData.length,
      };
    } catch (err) {
      console.error('Error fetching paginated plant log:', err);
      return { data: [], totalCount: 0 };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-full mx-auto text-[#6B6B6B] my-4 sm:my-6 px-4 sm:px-6 lg:max-w-[1280px] lg:px-8">
        <div className="font-medium text-sm sm:text-base flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4">
          <div>
            <p className="text-[#4E4D4D] font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">
              Log
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-full mx-auto my-4 sm:my-6 lg:max-w-[1280px]">
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-2 sm:p-6 border-b border-gray-200">
            <h2 className="text-[#4E4D4D] font-bold text-xl sm:text-2xl mb-4">
              Log
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
              <div className="relative">
                <select
                  id="summaryType"
                  value={summaryType}
                  onChange={handleSummaryTypeChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 appearance-none bg-white text-sm text-gray-700"
                >
                  <option value="plant">Plant Log</option>
                  <option value="motor">Motor Summary</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 pointer-events-none" />
              </div>

              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-600 bg-white cursor-pointer flex items-center"
                  onClick={() => setIsPlantDropdownOpen(!isPlantDropdownOpen)}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 pointer-events-none" />
                  <input
                    type="text"
                    value={plantSearch}
                    onChange={(e) => {
                      setPlantSearch(e.target.value || '');
                      setIsPlantDropdownOpen(true);
                    }}
                    placeholder={tableFilters.plantName || 'Search plants...'}
                    className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 pointer-events-none" />
                </div>
                {isPlantDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-40 overflow-y-auto">
                    {filteredPlants.length > 0 ? (
                      filteredPlants.map(([plantId, plantName]) => (
                        <div
                          key={plantId}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 pointer-events-none z-10" />
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => handleDateChange(e, 'startDate')}
                  ref={startDateRef}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm text-gray-700"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 pointer-events-none z-10" />
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => handleDateChange(e, 'endDate')}
                  ref={endDateRef}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm text-gray-700"
                />
              </div>

              <div className="mt-4 sm:mt-0">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled || loading}
                  className={`w-full px-4 py-2 rounded-md text-white font-semibold text-sm ${
                    isSubmitDisabled || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Loading...' : `Fetch ${summaryType === 'motor' ? 'Motor Summary' : 'Plant Log'}`}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-center text-red-500 py-4 text-sm">{error}</p>}

          {loading && <p className="text-center text-gray-500 py-4 text-sm">Loading...</p>}

          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <DataTable
                mode={summaryType === 'plant' ? 'server' : 'client'}
                fetchData={summaryType === 'plant' ? fetchData : undefined}
                data={data}
                totalRows={totalRows}
                columns={columns}
                pageSizeOptions={summaryType === 'motor' ? [5, 10, 20] : [5, 10, 15, 20, 50, 100]}
                defaultPageSize={5}
                onExportCSV={
                  summaryType === 'plant'
                    ? () => {
                        window.open(
                          `https://water-pump.onrender.com/api/export/plantcsv/${tableFilters.plantId}/motors?start=${startDate}&end=${endDate}`,
                          '_blank'
                        );
                      }
                    : undefined
                }
                onExportExcel={
                  summaryType === 'plant'
                    ? () => {
                        window.open(
                          `https://water-pump.onrender.com/api/export/plantexcel/${tableFilters.plantId}/motors?start=${startDate}&end=${endDate}`,
                          '_blank'
                        );
                      }
                    : undefined
                }
                paginationClassName="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4"
                paginationButtonClassName="px-4 py-2 text-sm font-medium text-white bg-[#208CD4] border border-[#208CD4] rounded-md hover:bg-[#1A73B0] focus:outline-none focus:ring-2 focus:ring-[#208CD4] disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] touch-manipulation"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedLog;


  // sssssssssssssssssssssssssssssssssssssssssss