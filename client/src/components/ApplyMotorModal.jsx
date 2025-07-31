import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [plantName, setPlantName] = useState('');
  const [isLoadingPlantName, setIsLoadingPlantName] = useState(false);
  const [plantNameError, setPlantNameError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [motorsPerPage, setMotorsPerPage] = useState(10);
  const [editingMotor, setEditingMotor] = useState(null);
  const motorBrandInputRef = useRef(null);

  // Fetch available motors
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

  // Fetch plant name
  useEffect(() => {
    if (isOpen && plant_id) {
      const fetchPlantName = async () => {
        try {
          setIsLoadingPlantName(true);
          setPlantNameError('');
          const response = await axios.get('https://water-pump.onrender.com/api/plants');
          const plant = response.data.find(p => p.plant_id === parseInt(plant_id, 10));
          if (plant) {
            setPlantName(plant.plant_name || `Plant ${plant_id}`);
          } else {
            setPlantName(`Plant ${plant_id}`);
            setPlantNameError('Plant not found.');
          }
        } catch (error) {
          console.error('Error fetching plant name:', error);
          setPlantName(`Plant ${plant_id}`);
          setPlantNameError('Failed to load plant name.');
        } finally {
          setIsLoadingPlantName(false);
        }
      };
      fetchPlantName();
    }
  }, [isOpen, plant_id]);

  // Fetch plant motors
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

          const loggingMotorMap = new Map(
            availableMotors.map(motor => [String(motor.motor_id), motor.motor_name || `Motor ${motor.motor_id}`])
          );

          sortedMotors.forEach(motor => {
            const motorName = loggingMotorMap.get(String(motor.motor_id)) || 'Unknown';
            console.log(`Plant Motor ID: ${motor.plant_motor_id}, Motor Name: ${motorName}`);
          });
        } catch (error) {
          console.error('Error fetching plant motors:', error);
          setPlantMotorsError('Failed to load plant motors. Please try again.');
        } finally {
          setIsLoadingPlantMotors(false);
        }
      };
      fetchPlantMotors();
    }
  }, [isOpen, plant_id, availableMotors]);

  // Create motor map for UI rendering
  const motorMap = useMemo(() => {
    return new Map(
      availableMotors.map(motor => [String(motor.motor_id), motor.motor_name || `Motor ${motor.motor_id}`])
    );
  }, [availableMotors]);

  const removeMotor = (id) => {
    if (motors.length > 1) {
      setMotors(motors.filter(motor => motor.id !== id));
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

  const handleEditChange = (field, value) => {
    if (field === 'motor_running_time') {
      if (value === '' || (Number(value) >= 1 && Number(value) <= 6)) {
        setEditingMotor({ ...editingMotor, [field]: value });
      }
    } else {
      setEditingMotor({ ...editingMotor, [field]: value });
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

      const [singlePayload] = payload;

      console.log('Single payload being sent:', singlePayload);
      
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

      await axios.post('https://water-pump.onrender.com/api/plantmotors', singlePayload);
      await axios.get('https://water-pump.onrender.com/api/plants');
      const plantMotorsResponse = await axios.get('https://water-pump.onrender.com/api/plantmotors');
      const filteredMotors = plantMotorsResponse.data.filter(motor => motor.plant_id === plantIdNum);
      setPlantMotors(filteredMotors.sort((a, b) => 
        new Date(b.installation_date) - new Date(a.installation_date)
      ));
      setMotors([{ id: 1, selectedMotor: '', maxRunningTime: '', workingOrder: '' }]);
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

  const handleEdit = (motor) => {
    setEditingMotor({
      plant_motor_id: motor.plant_motor_id,
      motor_id: motor.motor_id,
      motor_brand: motor.motor_brand,
      motor_running_time: motor.motor_running_time.toString(),
      motor_working_order: motor.motor_working_order.toString(),
      installation_date: motor.installation_date.split('T')[0]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMotor) return;

    const invalidFields = !editingMotor.motor_brand ||
      !editingMotor.motor_running_time ||
      isNaN(editingMotor.motor_running_time) ||
      Number(editingMotor.motor_running_time) < 1 ||
      Number(editingMotor.motor_running_time) > 6 ||
      !editingMotor.motor_working_order ||
      isNaN(editingMotor.motor_working_order) ||
      Number(editingMotor.motor_working_order) < 1 ||
      !editingMotor.installation_date;

    if (invalidFields) {
      setMotorsError('Please ensure all fields are filled: Brand, Max Running Time (1–6), Working Order (positive number), and Installation Date.');
      return;
    }

    const otherMotors = plantMotors.filter(m => m.plant_motor_id !== editingMotor.plant_motor_id);
    if (otherMotors.some(m => m.motor_working_order === Number(editingMotor.motor_working_order))) {
      setMotorsError('Working Order must be unique.');
      return;
    }

    try {
      setMotorsError('');
      const payload = {
        installation_date: editingMotor.installation_date,
        motor_brand: editingMotor.motor_brand,
        motor_running_time: parseInt(editingMotor.motor_running_time, 10),
        motor_working_order: parseInt(editingMotor.motor_working_order, 10)
      };

      await axios.put(`https://water-pump.onrender.com/api/plantmotors/${editingMotor.plant_motor_id}`, payload);
      const plantMotorsResponse = await axios.get('https://water-pump.onrender.com/api/plantmotors');
      const filteredMotors = plantMotorsResponse.data.filter(motor => motor.plant_id === parseInt(plant_id, 10));
      setPlantMotors(filteredMotors.sort((a, b) => 
        new Date(b.installation_date) - new Date(a.installation_date)
      ));
      setEditingMotor(null);
    } catch (error) {
      console.error('Error updating motor:', error);
      setMotorsError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        `Failed to update motor data (Server Error: ${error.response?.status || 'Unknown'}).`
      );
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (editingMotor) {
          setEditingMotor(null);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, editingMotor]);

  // Focus motor brand input when editingMotor changes
  useEffect(() => {
    if (editingMotor && motorBrandInputRef.current) {
      motorBrandInputRef.current.focus();
    }
  }, [editingMotor]);

  // Search and pagination for plant motors
  const filteredPlantMotors = plantMotors.filter(motor =>
    motor.motor_brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(motor.motor_id).includes(searchQuery) ||
    String(motor.motor_running_time).includes(searchQuery) ||
    String(motor.motor_working_order).includes(searchQuery) ||
    (motorMap.get(String(motor.motor_id)) || '').toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      {/* Modal Container: Reduced padding and full width on mobile */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Apply Motor</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Plant ID: {plant_id || 'Not provided'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          {motorsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex justify-between items-start">
                <p className="text-xs sm:text-sm font-medium text-red-800">{motorsError}</p>
                <button
                  onClick={() => setMotorsError('')}
                  className="text-red-600 hover:text-red-800 text-base sm:text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {!editingMotor ? (
            <div className="space-y-4 sm:space-y-6">
              {motors.map((motor) => (
                <div key={motor.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
                  {/* Select Motor: Full width on mobile */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Select Motor
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm sm:text-base"
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
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Max Running Time: Full width on mobile */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Max Running Time (Hours)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      value={motor.maxRunningTime}
                      onChange={(e) => handleMotorChange(motor.id, 'maxRunningTime', e.target.value)}
                      placeholder="Maximum 6 Hours"
                      min="1"
                      max="6"
                      step="1"
                    />
                  </div>

                  {/* Working Order: Full width on mobile */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                      Working Order
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      value={motor.workingOrder}
                      onChange={(e) => handleMotorChange(motor.id, 'workingOrder', e.target.value)}
                      placeholder="Enter order"
                      min="1"
                      step="1"
                    />
                  </div>

                  {/* Action Buttons: Touch-friendly size */}
                  <div className="col-span-1 sm:col-span-3 flex justify-end space-x-2">
                    {motors.length > 1 && (
                      <button
                        onClick={() => removeMotor(motor.id)}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Remove motor"
                      >
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Edit Motor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
                {/* Motor Name: Full width on mobile */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Motor Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm sm:text-base"
                    value={motorMap.get(String(editingMotor.motor_id)) || '-'}
                    disabled
                  />
                </div>

                {/* Motor Brand */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Motor Brand
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={editingMotor.motor_brand}
                    onChange={(e) => handleEditChange('motor_brand', e.target.value)}
                    placeholder="Enter brand"
                    ref={motorBrandInputRef}
                  />
                </div>

                {/* Max Running Time */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Max Running Time (Hours)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={editingMotor.motor_running_time}
                    onChange={(e) => handleEditChange('motor_running_time', e.target.value)}
                    placeholder="Maximum 6 Hours"
                    min="1"
                    max="6"
                    step="1"
                  />
                </div>

                {/* Working Order */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Working Order
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={editingMotor.motor_working_order}
                    onChange={(e) => handleEditChange('motor_working_order', e.target.value)}
                    placeholder="Enter order"
                    min="1"
                    step="1"
                  />
                </div>

                {/* Installation Date */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    value={editingMotor.installation_date}
                    onChange={(e) => handleEditChange('installation_date', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setEditingMotor(null)}
                  className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  Cancel Edit
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 sm:px-8 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
                >
                  Save Edit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!editingMotor && (
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 sm:px-8 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
              disabled={isLoadingMotors}
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Plant Motors Table Section */}
        <div className="p-4 sm:p-6">
          <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {isLoadingPlantName ? 'Loading plant name...' : `Applied Motors for ${plantName}`}
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search applied motors..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full sm:w-64 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                  <select 
                    value={motorsPerPage}
                    onChange={handleShowChange}
                    className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                  >
                    <option value={1}>Show 1</option>
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                  </select>
                </div>
              </div>

              {plantNameError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex justify-between items-start">
                    <div className="text-yellow-800">
                      <p className="text-xs sm:text-sm font-medium">{plantNameError}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPlantNameError('');
                        const fetchPlantName = async () => {
                          try {
                            setIsLoadingPlantName(true);
                            const response = await axios.get('https://water-pump.onrender.com/api/plants');
                            const plant = response.data.find(p => p.plant_id === parseInt(plant_id, 10));
                            setPlantName(plant ? plant.plant_name || `Plant ${plant_id}` : `Plant ${plant_id}`);
                          } catch (error) {
                            console.error('Error retrying plant name fetch:', error);
                            setPlantName(`Plant ${plant_id}`);
                            setPlantNameError('Failed to load plant name.');
                          } finally {
                            setIsLoadingPlantName(false);
                          }
                        };
                        fetchPlantName();
                      }}
                      className="text-xs sm:text-sm underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {plantMotorsError && (
                <div className="bg-red-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-xs sm:text-sm font-medium">{plantMotorsError}</p>
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
                      className="text-xs sm:text-sm underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {isLoadingPlantMotors ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">Loading applied motors...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[60px]">S/No</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">Motor ID</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">Motor Name</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Motor Brand</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">Max Running Time (Hours)</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Working Order</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">Installation Date</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[80px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {paginatedPlantMotors.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-sm sm:text-base">
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
                                {motorMap.get(String(motor.motor_id)) || '-'}
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
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                <button
                                  onClick={() => handleEdit(motor)}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                                  title="Edit motor"
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

                  {/* Mobile Card View: Enhanced spacing and font sizes */}
                  <div className="md:hidden space-y-3">
                    {paginatedPlantMotors.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        {searchQuery ? 'No motors found matching your search.' : 'No motors applied to this plant yet.'}
                      </div>
                    ) : (
                      paginatedPlantMotors.map((motor, index) => (
                        <div key={motor.plant_motor_id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                                #{startIndex + index + 1}
                              </span>
                              <h3 className="font-semibold text-gray-900 text-base">
                                {motorMap.get(String(motor.motor_id)) || 'Unknown'}
                              </h3>
                            </div>
                            <button
                              onClick={() => handleEdit(motor)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                              title="Edit motor"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Motor ID:</span>
                              <span className="text-gray-900">{motor.motor_id}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Motor Name:</span>
                              <span className="text-gray-900">{motorMap.get(String(motor.motor_id)) || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Motor Brand:</span>
                              <span className="text-gray-900">{motor.motor_brand}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Max Running Time:</span>
                              <span className="text-gray-900">{motor.motor_running_time} Hours</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Working Order:</span>
                              <span className="text-gray-900">{motor.motor_working_order}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-medium text-xs">Installation Date:</span>
                              <span className="text-gray-900">{new Date(motor.installation_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination: Adjusted for mobile */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:mt-6">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded ${
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
                            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-medium rounded ${
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
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded ${
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