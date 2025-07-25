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
  const [successMessage, setSuccessMessage] = useState(null);

  // State for form inputs and edit mode
  const [formData, setFormData] = useState({
    plant_id: '',
    motor_topic: '',
    sensor_topic: '',
    valve_topic: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTopicId, setEditTopicId] = useState(null);

  // Fetch plants from API
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get('https://water-pump.onrender.com/api/plants');
        console.log('Plants API Response:', response.data);
        setPlants(response.data);
        setError(null);
      } catch (err) {
        console.error('API Error (Plants):', err);
        setError(err.message || 'Failed to fetch plants. This may be due to CORS restrictions.');
      }
    };
    fetchPlants();
  }, []);

  // Fetch applied topics from API
  useEffect(() => {
    const fetchPlantTopics = async () => {
      try {
        const response = await axios.get('https://water-pump.onrender.com/api/planttopics');
        console.log('Plant Topics API Response:', response.data);
        const topics = response.data;

        // Filter out topics without a valid plant_topic_id
        const validTopics = topics.filter(topic => topic.plant_topic_id != null);

        // Map plant names to topics
        const topicsWithPlantNames = validTopics.map(topic => ({
          ...topic,
          plant_name: plants.find(plant => plant.plant_id === topic.plant_id)?.plant_name || 'Unknown'
        }));

        // Filter topics based on search query
        const filteredTopics = topicsWithPlantNames.filter(
          (topic) =>
            topic.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.motor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.sensor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.valve_topic?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Calculate pagination
        const totalItems = filteredTopics.length;
        setTotalPages(Math.ceil(totalItems / motorsPerPage));
        const startIndex = (currentPage - 1) * motorsPerPage;
        const paginatedData = filteredTopics.slice(startIndex, startIndex + motorsPerPage);
        setPaginatedPlantTopics(paginatedData);
        setError(null);
      } catch (err) {
        console.error('API Error (Plant Topics):', err);
        setError(err.message || 'Failed to fetch plant topics.');
      }
    };
    fetchPlantTopics();
  }, [currentPage, motorsPerPage, searchQuery, plants]);

  // Handlers for form inputs
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleMotorsPerPageChange = (e) => {
    setMotorsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // Validate input fields for edit
        if (!formData.motor_topic || !formData.sensor_topic || !formData.valve_topic) {
          setError('All topic fields are required.');
          setSuccessMessage(null);
          return;
        }
        // Update existing topic
        const payload = {
          motor_topic: formData.motor_topic,
          sensor_topic: formData.sensor_topic,
          valve_topic: formData.valve_topic,
        };
        console.log('Edit Payload:', payload);
        console.log('Edit Topic ID:', editTopicId);
        await axios.put(`https://water-pump.onrender.com/api/planttopics/${editTopicId}`, payload);
        setSuccessMessage(`Topic ID ${editTopicId} updated successfully`);
      } else {
        // Add new topic
        const payload = {
          plant_id: Number(formData.plant_id),
          motor_topic: formData.motor_topic,
          sensor_topic: formData.sensor_topic,
          valve_topic: formData.valve_topic,
        };
        await axios.post('https://water-pump.onrender.com/api/planttopics', payload);
        setSuccessMessage('New topic added successfully');
      }
      setError(null);
      // Reset form
      setFormData({
        plant_id: '',
        motor_topic: '',
        sensor_topic: '',
        valve_topic: '',
      });
      setIsEditMode(false);
      setEditTopicId(null);
      // Re-fetch topics to update table
      const response = await axios.get('https://water-pump.onrender.com/api/planttopics');
      const topics = response.data;
      const validTopics = topics.filter(topic => topic.plant_topic_id != null);
      const topicsWithPlantNames = validTopics.map(topic => ({
        ...topic,
        plant_name: plants.find(plant => plant.plant_id === topic.plant_id)?.plant_name || 'Unknown'
      }));
      const filteredTopics = topicsWithPlantNames.filter(
        (topic) =>
          topic.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.motor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.sensor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.valve_topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTotalPages(Math.ceil(filteredTopics.length / motorsPerPage));
      const startIndex = (currentPage - 1) * motorsPerPage;
      setPaginatedPlantTopics(filteredTopics.slice(startIndex, startIndex + motorsPerPage));
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        err.message ||
        `Failed to ${isEditMode ? 'update' : 'apply'} topic.`
      );
      setSuccessMessage(null);
    }
  };

  // Handle edit button click
  const handleEdit = (topic) => {
    console.log('Topic Object:', topic);
    if (!topic.plant_topic_id) {
      setError('Invalid topic ID.');
      setSuccessMessage(null);
      return;
    }
    setIsEditMode(true);
    setEditTopicId(topic.plant_topic_id);
    setFormData({
      plant_id: topic.plant_id.toString(),
      motor_topic: topic.motor_topic || '',
      sensor_topic: topic.sensor_topic || '',
      valve_topic: topic.valve_topic || '',
    });
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete topic ID ${id}?`)) return;
    try {
      await axios.delete(`https://water-pump.onrender.com/api/planttopics/${id}`);
      setPaginatedPlantTopics(paginatedPlantTopics.filter(topic => topic.plant_topic_id !== id));
      setSuccessMessage(`Topic ID ${id} deleted successfully`);
      setError(null);
      // Re-fetch topics to ensure consistency
      const response = await axios.get('https://water-pump.onrender.com/api/planttopics');
      const topics = response.data;
      const validTopics = topics.filter(topic => topic.plant_topic_id != null);
      const topicsWithPlantNames = validTopics.map(topic => ({
        ...topic,
        plant_name: plants.find(plant => plant.plant_id === topic.plant_id)?.plant_name || 'Unknown'
      }));
      const filteredTopics = topicsWithPlantNames.filter(
        (topic) =>
          topic.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.motor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.sensor_topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.valve_topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTotalPages(Math.ceil(filteredTopics.length / motorsPerPage));
      const startIndex = (currentPage - 1) * motorsPerPage;
      setPaginatedPlantTopics(filteredTopics.slice(startIndex, startIndex + motorsPerPage));
      if (filteredTopics.length <= startIndex && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Delete Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || `Failed to delete topic ID ${id}`);
      setSuccessMessage(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{isEditMode ? 'Edit Topic' : 'Apply Topic'}</h2>
            <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Edit topic details' : 'Select a plant and enter topic details'}</p>
          </div>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                <button
                  className="text-green-600 hover:text-green-800 text-lg font-bold"
                  onClick={() => setSuccessMessage(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Select Plant */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Select Plant
                </label>
                <div className="relative">
                  <select
                    name="plant_id"
                    value={formData.plant_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    required
                    disabled={isEditMode}
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
                  name="motor_topic"
                  value={formData.motor_topic}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter motor topic"
                  required
                />
              </div>

              {/* Sensor Topic */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Sensor Topic
                </label>
                <input
                  type="text"
                  name="sensor_topic"
                  value={formData.sensor_topic}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter sensor topic"
                  required
                />
              </div>

              {/* Valve Topic */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Valve Topic
                </label>
                <input
                  type="text"
                  name="valve_topic"
                  value={formData.valve_topic}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter valve topic"
                  required
                />
              </div>
            </div>

            {/* Page Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setFormData({
                    plant_id: '',
                    motor_topic: '',
                    sensor_topic: '',
                    valve_topic: '',
                  });
                  setIsEditMode(false);
                  setEditTopicId(null);
                  setSuccessMessage(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                {isEditMode ? 'Update Topic' : 'Save Changes'}
              </button>
            </div>
          </form>
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
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">Actions</th>
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
                        <tr key={topic.plant_topic_id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {(currentPage - 1) * motorsPerPage + index + 1}
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
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 ">
                            <button
                              className="px-2.5 py-1 bg-blue-500 mr-2 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                              title="Edit topic"
                              onClick={() => handleEdit(topic)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                              title="Delete topic"
                              onClick={() => handleDelete(topic.plant_topic_id)}
                            >
                              Delete
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
                    <div key={topic.plant_topic_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                            #{(currentPage - 1) * motorsPerPage + index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {topic.plant_name || 'Unknown'}
                          </h3>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                            title="Edit topic"
                            onClick={() => handleEdit(topic)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                            title="Delete topic"
                            onClick={() => handleDelete(topic.plant_topic_id)}
                          >
                            Delete
                          </button>
                        </div>
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = Math.floor((currentPage - 1) / 5) * 5 + i + 1;
                    if (pageNum <= totalPages) {
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
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

// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk