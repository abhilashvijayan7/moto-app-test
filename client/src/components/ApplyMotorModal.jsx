import React, { useState, useEffect } from 'react';
import { ChevronDown, Minus, X } from 'lucide-react';
import axios from 'axios';

export default function ApplyMotorModal({ isOpen, onClose, plant_id }) {
  const [motors, setMotors] = useState([
    { id: 1, selectedMotor: '', maxRunningTime: '', workingOrder: '' }
  ]);
  const [availableMotors, setAvailableMotors] = useState([]);
  const [isLoadingMotors, setIsLoadingMotors] = useState(false);
  const [motorsError, setMotorsError] = useState('');
  const [plantMotors, setPlantMotors] = useState([]);
  const [isLoadingPlantMotors, setIsLoadingPlantMotors] = useState(false);
  const [plantMotorsError, setPlantMotorsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [motorsPerPage, setMotorsPerPage] = useState(10);

  // Fetch available motors when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchMotors = async () => {
        try {
          setIsLoadingMotors(true);
          setMotorsError('');
          const response = await axios.get('https://water-pump.onrender.com/api/motors');
          setAvailableMotors(response.data);
        } catch (error) {
          console.error('Error fetching motors:', error);
          setMotorsError('Failed to load motors. Please try again.');
        } finally {
          setIsLoadingMotors(false);
        }
      };
      fetchMotors();
    }
  }, [isOpen]);

  // Fetch plant motors when modal opens
  useEffect(() => {
    if (isOpen && plant_id) {
      const fetchPlantMotors = async () => {
        try {
          setIsLoadingPlantMotors(true);
          setPlantMotorsError('');
          const response = await axios.get('https://water-pump.onrender.com/api/plantmotors');
          const filteredMotors = response.data.filter(motor => motor.plant_id === parseInt(plant_id, 10));
          const sortedMotors = filteredMotors.sort((a, b) => 
            new Date(b.installation_date) - new Date(a.installation_date)
          );
          setPlantMotors(sortedMotors);
        } catch (error) {
          console.error('Error fetching plant motors:', error);
          setPlantMotorsError('Failed to load plant motors. Please try again.');
        } finally {
          setIsLoadingPlantMotors(false);
        }
      };
      fetchPlantMotors();
    }
  }, [isOpen, plant_id]);

  const removeMotor = (id) => {
    if (motors.length > 1) {
      const updatedMotors = motors.filter(motor => motor.id !== id);
      setMotors(updatedMotors);
    }
  };

  const handleMotorChange = (id, field, value) => {
    if (field === 'maxRunningTime') {
      if (value === '' || (Number(value) >= 1 && Number(value) <= 6)) {
        setMotors(motors.map(motor =>
          motor.id === id ? { ...motor, [field]: value } : motor
        ));
      }
    } else {
      setMotors(motors.map(motor =>
        motor.id === id ? { ...motor, [field]: value } : motor
      ));
    }
  };

  const handleSave = async () => {
    console.log('Raw plant_id prop:', plant_id, 'Type:', typeof plant_id);
    if (!plant_id || plant_id === '' || plant_id === 'undefined' || plant_id === 'null') {
      console.error('Invalid plant_id:', plant_id);
      setMotorsError(`Invalid plant ID: "${plant_id}". Please select a plant first.`);
      return;
    }
    
    const plantIdNum = parseInt(plant_id, 10);
    if (isNaN(plantIdNum) || plantIdNum <= 0) {
      console.error('plant_id conversion failed:', plant_id, '->', plantIdNum);
      setMotorsError(`Invalid plant ID: "${plant_id}". Please select a valid plant.`);
      return;
    }

    const invalidMotors = motors.filter(motor => 
      motor.selectedMotor === '' ||
      motor.maxRunningTime === '' || 
      isNaN(motor.maxRunningTime) || 
      Number(motor.maxRunningTime) < 1 || 
      Number(motor.maxRunningTime) > 6 ||
      motor.workingOrder === '' || 
      isNaN(motor.workingOrder) || 
      Number(motor.workingOrder) < 1
    );
    if (invalidMotors.length > 0) {
      setMotorsError('Please ensure all fields are filled: Select a motor, Max Running Time (1–6), and Working Order (positive number).');
      return;
    }

    const workingOrders = motors.map(m => Number(m.workingOrder));
    if (new Set(workingOrders).size !== workingOrders.length) {
      setMotorsError('Working Order values must be unique for each motor.');
      return;
    }

    const selectedMotorIds = motors.map(m => Number(m.selectedMotor));
    if (new Set(selectedMotorIds).size !== selectedMotorIds.length) {
      setMotorsError('Each motor must be unique. Please select different motors.');
      return;
    }

    try {
      setMotorsError('');
      console.log('Final plantIdNum:', plantIdNum, 'Type:', typeof plantIdNum);
      
      const payload = motors.map(motor => ({
        plant_id: plantIdNum,
        motor_id: parseInt(motor.selectedMotor, 10),
        installation_date: new Date().toISOString().split('T')[0], 
        motor_brand: 'General', 
        motor_running_time: parseInt(motor.maxRunningTime, 10),
        motor_working_order: parseInt(motor.workingOrder, 10)
      }));

      console.log('Payload being sent:', payload);

      const [singlepayload] = payload;

      console.log('Single payload being sent:', singlepayload);
      
      const invalidPayload = payload.some(item => 
        !item.plant_id || isNaN(item.plant_id) || 
        !item.motor_id || isNaN(item.motor_id) ||
        !item.motor_running_time || isNaN(item.motor_running_time) ||
        !item.motor_working_order || isNaN(item.motor_working_order)
      );
      
      if (invalidPayload) {
        console.error('Invalid payload detected:', payload);
        setMotorsError('Invalid data detected. Please check all fields.');
        return;
      }

      const response = await axios.post('https://water-pump.onrender.com/api/plantmotors', singlepayload);
      await axios.get('https://water-pump.onrender.com/api/plants');
      const plantMotorsResponse = await axios.get('https://water-pump.onrender.com/api/plantmotors');
      const filteredMotors = plantMotorsResponse.data.filter(motor => motor.plant_id === plantIdNum);
      setPlantMotors(filteredMotors.sort((a, b) => 
        new Date(b.installation_date) - new Date(a.installation_date)
      ));
      onClose();
    } catch (error) {
      console.error('Error submitting motors:', error);
      console.error('Server response:', error.response?.data);
      setMotorsError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        `Failed to save motor data (Server Error: ${error.response?.status || 'Unknown'}).`
      );
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Search and pagination for plant motors
  const filteredPlantMotors = plantMotors.filter(motor =>
    motor.motor_brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(motor.motor_id).includes(searchQuery) ||
    String(motor.motor_running_time).includes(searchQuery) ||
    String(motor.motor_working_order).includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredPlantMotors.length / motorsPerPage);
  const startIndex = (currentPage - 1) * motorsPerPage;
  const paginatedPlantMotors = filteredPlantMotors.slice(startIndex, startIndex + motorsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleShowChange = (e) => {
    setMotorsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Apply Motor</h2>
            <p className="text-sm text-gray-500 mt-1">Plant ID: {plant_id || 'Not provided'} </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {motorsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-red-800">{motorsError}</p>
                <button
                  onClick={() => setMotorsError('')}
                  className="text-red-600 hover:text-red-800 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

 Bread crumb navigation
          <div className="space-y-6">
            {motors.map((motor) => (
              <div key={motor.id} className="grid grid-cols-12 gap-6 items-center">
                {/* Select Motor */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Select Motor
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                      value={motor.selectedMotor}
                      onChange={(e) => handleMotorChange(motor.id, 'selectedMotor', e.target.value)}
                      disabled={isLoadingMotors}
                    >
                      <option value="">
                        {isLoadingMotors ? 'Loading motors...' : 'Select a motor...'}
                      </option>
                      {availableMotors.map((availableMotor) => (
                        <option 
                          key={availableMotor.motor_id} 
                          value={availableMotor.motor_id}
                        >
                          {availableMotor.motor_name || `Motor ${availableMotor.motor_id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Max Running Time */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Max Running Time (Hours)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={motor.maxRunningTime}
                    onChange={(e) => handleMotorChange(motor.id, 'maxRunningTime', e.target.value)}
                    placeholder="Maximum 6 Hours"
                    min="1"
                    max="6"
                    step="1"
                  />
                </div>

                {/* Working Order */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Working Order
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={motor.workingOrder}
                    onChange={(e) => handleMotorChange(motor.id, 'workingOrder', e.target.value)}
                    placeholder="Enter order"
                    min="1"
                    step="1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="col-span-3 flex justify-end space-x-2">
                  {motors.length > 1 && (
                    <button
                      onClick={() => removeMotor(motor.id)}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                      title="Remove motor"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            disabled={isLoadingMotors}
          >
            Save Changes
          </button>
        </div>

        {/* Plant Motors Table Section */}
        <div className="p-6">
          <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-gray-900">Applied Motors for Plant {plant_id}</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search applied motors..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <select 
                    value={motorsPerPage}
                    onChange={handleShowChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={1}>Show 1</option>
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                  </select>
                </div>
              </div>

              {plantMotorsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-sm font-medium">{plantMotorsError}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPlantMotorsError('');
                        const fetchPlantMotors = async () => {
                          try {
                            setIsLoadingPlantMotors(true);
                            const response = await axios.get('https://water-pump.onrender.com/api/plantmotors');
                            const filteredMotors = response.data.filter(motor => motor.plant_id === parseInt(plant_id, 10));
                            setPlantMotors(filteredMotors.sort((a, b) => 
                              new Date(b.installation_date) - new Date(a.installation_date)
                            ));
                          } catch (error) {
                            console.error('Error retrying plant motors fetch:', error);
                            setPlantMotorsError('Failed to load plant motors. Please try again.');
                          } finally {
                            setIsLoadingPlantMotors(false);
                          }
                        };
                        fetchPlantMotors();
                      }}
                      className="text-sm underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {isLoadingPlantMotors ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading applied motors...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">S/No</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Motor ID</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Motor Brand</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Max Running Time (Hours)</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Working Order</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Installation Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {paginatedPlantMotors.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                              {searchQuery ? 'No motors found matching your search.' : 'No motors applied to this plant yet.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedPlantMotors.map((motor, index) => (
                            <tr key={motor.plant_motor_id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {startIndex + index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {motor.motor_id}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {motor.motor_brand}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {motor.motor_running_time}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {motor.motor_working_order}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {new Date(motor.installation_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {paginatedPlantMotors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? 'No motors found matching your search.' : 'No motors applied to this plant yet.'}
                      </div>
                    ) : (
                      paginatedPlantMotors.map((motor, index) => (
                        <div key={motor.plant_motor_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                                #{startIndex + index + 1}
                              </span>
                              <h3 className="font-semibold text-gray-900 text-lg">Motor {motor.motor_id}</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium">Motor Brand:</span>
                              <span className="text-gray-900">{motor.motor_brand}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium">Max Running Time:</span>
                              <span className="text-gray-900">{motor.motor_running_time} Hours</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium">Working Order:</span>
                              <span className="text-gray-900">{motor.motor_working_order}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium">Installation Date:</span>
                              <span className="text-gray-900">{new Date(motor.installation_date).toLocaleDateString()}</span>
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
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
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
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}