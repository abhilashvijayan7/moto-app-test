import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function ApplyTopicPage() {
  // State for table data and form inputs
  const [paginatedPlantTopics, setPaginatedPlantTopics] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [motorsPerPage, setMotorsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // State for plants data and error
  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);

  // Fetch plants from API using Axios
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get('https://water-pump.onrender.com/api/plants');
        console.log('API Response:', response.data); // Debug log
        setPlants(response.data);
        setError(null);
      } catch (err) {
        console.error('API Error:', err); // Debug log
        setError(err.message || 'Failed to fetch plants. This may be due to CORS restrictions.');
      }
    };
    fetchPlants();
  }, []);

  // Handlers for form inputs
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleMotorsPerPageChange = (e) => {
    setMotorsPerPage(Number(e.target.value));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Apply Topic</h2>
            <p className="text-sm text-gray-500 mt-1">Select a plant and enter topic details</p>
          </div>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {/* Error Message for API Failure */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  className="text-red-600 hover:text-red-800 text-lg font-bold"
                  onClick={() => setError(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Select Plant */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Select Plant
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Select a plant...</option>
                    {plants.length === 0 ? (
                      <option value="" disabled>
                        No plants available
                      </option>
                    ) : (
                      plants.map((plant) => (
                        <option key={plant.plant_id} value={plant.plant_id}>
                          {plant.plant_name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Motor Topic */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Motor Topic
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter motor topic"
                />
              </div>

              {/* Sensor Topic */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Sensor Topic
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter sensor topic"
                />
              </div>

              {/* Valve Topic */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Valve Topic
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter valve topic"
                />
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-3 flex justify-end space-x-2">
                {/* Placeholder for buttons, no changes needed */}
              </div>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* Topics Table Section */}
        <div className="p-6">
          <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Applied Topics
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search applied topics..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <select
                    value={motorsPerPage}
                    onChange={handleMotorsPerPageChange}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={1}>Show 1</option>
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                  </select>
                </div>
              </div>

              {/* Error Messages Placeholder */}
              {false && (
                <div className="bg-red-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-sm font-medium">Failed to load topics.</p>
                    </div>
                    <button className="text-sm underline hover:no-underline">
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[60px]">S/No</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">Plant ID</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">Plant Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Motor Topic</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">Sensor Topic</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Valve Topic</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedPlantTopics.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          {searchQuery ? 'No topics found matching your search.' : 'No topics applied yet.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedPlantTopics.map((topic, index) => (
                        <tr key={topic.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {topic.plant_id || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {topic.plant_name || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {topic.motor_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {topic.sensor_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {topic.valve_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            <button
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                              title="Edit topic"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {paginatedPlantTopics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No topics found matching your search.' : 'No topics applied yet.'}
                  </div>
                ) : (
                  paginatedPlantTopics.map((topic, index) => (
                    <div key={topic.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {topic.plant_name || 'Unknown'}
                          </h3>
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                          title="Edit topic"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Plant ID:</span>
                          <span className="text-gray-900">{topic.plant_id || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Plant Name:</span>
                          <span className="text-gray-900">{topic.plant_name || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Motor Topic:</span>
                          <span className="text-gray-900">{topic.motor_topic || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Sensor Topic:</span>
                          <span className="text-gray-900">{topic.sensor_topic || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Valve Topic:</span>
                          <span className="text-gray-900">{topic.valve_topic || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                  <button
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`px-3 py-2 text-sm font-medium rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}