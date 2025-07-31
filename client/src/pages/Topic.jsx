import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      {/* Header and Breadcrumb: Stacked vertically on mobile */}
      <div className="max-w-full mx-auto text-[#6B6B6B] my-4 sm:my-6 px-4 sm:px-6 lg:max-w-[1280px] lg:px-11">
        <div className="font-medium text-sm sm:text-base flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4">
          <div>
            <p className="text-[#4E4D4D] font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">
              {isEditMode ? "Edit Topic" : "Apply Topic"}
            </p>
            {/* <div className="flex bg-gray-100 w-[140px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-sm mb-3 sm:mb-4 items-center gap-1.5 sm:gap-2">
              <p className="text-xs sm:text-sm">Home</p>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <p className="text-[#208CD4] text-xs sm:text-sm">
                {isEditMode ? "Edit Topic" : "Apply Topic"}
              </p>
            </div> */}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-full mx-auto my-4 sm:my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
                  {isEditMode ? 'Edit Topic' : 'Apply Topic'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                  {isEditMode ? 'Edit topic details' : 'Select a plant and enter topic details'}
                </p>
              </div>
            </div>

            {/* Page Content */}
            <div className="space-y-4 sm:space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 relative">
                  <div className="flex justify-between items-start">
                    <p className="text-xs sm:text-sm font-medium text-green-800">{successMessage}</p>
                    <button
                      className="text-green-600 hover:text-green-800 text-base sm:text-lg font-bold leading-none"
                      onClick={() => setSuccessMessage(null)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message for API Failure */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 relative">
                  <div className="flex justify-between items-start">
                    <p className="text-xs sm:text-sm font-medium text-red-800">{error}</p>
                    <button
                      className="text-red-600 hover:text-red-800 text-base sm:text-lg font-bold leading-none"
                      onClick={() => setError(null)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Select Plant */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Select Plant
                    </label>
                    <div className="relative">
                      <select
                        name="plant_id"
                        value={formData.plant_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm sm:text-base"
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
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Motor Topic */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Motor Topic
                    </label>
                    <input
                      type="text"
                      name="motor_topic"
                      value={formData.motor_topic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Enter motor topic"
                      required
                    />
                  </div>

                  {/* Sensor Topic */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Sensor Topic
                    </label>
                    <input
                      type="text"
                      name="sensor_topic"
                      value={formData.sensor_topic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Enter sensor topic"
                      required
                    />
                  </div>

                  {/* Valve Topic */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Valve Topic
                    </label>
                    <input
                      type="text"
                      name="valve_topic"
                      value={formData.valve_topic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Enter valve topic"
                      required
                    />
                  </div>
                </div>

                {/* Page Footer */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-2 sm:px-8 sm:py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
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
                    className="px-6 py-2 sm:px-8 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                  >
                    {isEditMode ? 'Update Topic' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Topics Table Section */}
        <div className="mt-4 sm:mt-6">
          <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  Applied Topics
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search applied topics..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full sm:w-64 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                  <select
                    value={motorsPerPage}
                    onChange={handleMotorsPerPageChange}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                  >
                    <option value="1">Show 1</option>
                    <option value="10">Show 10</option>
                    <option value="25">Show 25</option>
                    <option value="50">Show 50</option>
                  </select>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[60px]">
                        S/No
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[100px]">
                        Plant ID
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[150px]">
                        Plant Name
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[120px]">
                        Motor Topic
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[150px]">
                        Sensor Topic
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[120px]">
                        Valve Topic
                      </th>
                      <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 min-w-[150px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedPlantTopics.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="border border-gray-300 px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
                          {searchQuery ? 'No topics found matching your search.' : 'No topics applied yet.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedPlantTopics.map((topic, index) => (
                        <tr key={topic.plant_topic_id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {(currentPage - 1) * motorsPerPage + index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {topic.plant_id || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {topic.plant_name || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {topic.motor_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {topic.sensor_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {topic.valve_topic || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 flex gap-2">
                            <button
                              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md transition-colors"
                              title="Edit topic"
                              onClick={() => handleEdit(topic)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-md transition-colors"
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
              <div className="md:hidden space-y-3">
                {paginatedPlantTopics.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    {searchQuery ? 'No topics found matching your search.' : 'No topics applied yet.'}
                  </div>
                ) : (
                  paginatedPlantTopics.map((topic, index) => (
                    <div key={topic.plant_topic_id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                            #{(currentPage - 1) * motorsPerPage + index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {topic.plant_name || 'Unknown'}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                            title="Edit topic"
                            onClick={() => handleEdit(topic)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors"
                            title="Delete topic"
                            onClick={() => handleDelete(topic.plant_topic_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
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
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded ${
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
                          className={`px-2.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded ${
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
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded ${
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