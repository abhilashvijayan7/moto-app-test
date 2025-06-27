import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

function AddMotor() {
  const [formData, setFormData] = useState({
    motorName: '',
    motorType: '',
    manufacturer: '',
    modelNumber: '',
    installationDate: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [motors, setMotors] = useState([]);
  const [isLoadingMotors, setIsLoadingMotors] = useState(true);
  const [motorsError, setMotorsError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [motorsPerPage, setMotorsPerPage] = useState(10);
  const [editingMotorId, setEditingMotorId] = useState(null);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  useEffect(() => {
    fetchMotors();
  }, []);

  const fetchMotors = async () => {
    try {
      setIsLoadingMotors(true);
      setMotorsError('');
      
      const response = await fetch('https://water-pump.onrender.com/api/motors');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched motors:', data);
      
      const sortedMotors = data.sort((a, b) => {
        if (a.installation_date && b.installation_date) {
          return new Date(b.installation_date) - new Date(a.installation_date);
        }
        return 0;
      });
      
      setMotors(sortedMotors);
    } catch (error) {
      console.error('Error fetching motors:', error);
      if (error.name === 'TypeError') {
        setMotorsError('Network error. Please check your connection and try again.');
      } else {
        setMotorsError('Failed to load motors. Please refresh the page.');
      }
    } finally {
      setIsLoadingMotors(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (submitError) setSubmitError('');
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Validate required fields
      if (!formData.motorName.trim()) {
        throw new Error('Motor name is required');
      }
      if (!formData.motorType.trim()) {
        throw new Error('Motor type is required');
      }
      if (!formData.manufacturer.trim()) {
        throw new Error('Manufacturer is required');
      }
      if (!formData.modelNumber.trim()) {
        throw new Error('Model number is required');
      }
      if (!formData.installationDate.trim()) {
        throw new Error('Installation date is required');
      }

      const motorData = {
        motor_name: formData.motorName.trim(),
        motor_type: formData.motorType.trim(),
        manufacturer: formData.manufacturer.trim(),
        model_number: formData.modelNumber.trim(),
        installation_date: formData.installationDate.trim()
      };

      console.log('Submitting motor data:', motorData);

      const url = editingMotorId 
        ? `https://water-pump.onrender.com/api/motors/${editingMotorId}`
        : 'https://water-pump.onrender.com/api/motors';

        console.log(url)
      
      const method = editingMotorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motorData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server Error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(editingMotorId ? 'Motor update response:' : 'Motor creation response:', responseData);

      setSubmitSuccess(true);
      
      setFormData({
        motorName: '',
        motorType: '',
        manufacturer: '',
        modelNumber: '',
        installationDate: new Date().toISOString().split('T')[0]
      });
      setEditingMotorId(null);
      
      await fetchMotors();

    } catch (error) {
      console.error('Error:', error);
      setSubmitError(error.message || `Failed to ${editingMotorId ? 'update' : 'add'} motor. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleEdit = (motor) => {
  console.log('Motor object:', motor);
  const formattedInstallationDate = motor.installation_date
    ? new Date(motor.installation_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  setFormData({
    motorName: motor.motor_name || '',
    motorType: motor.motor_type || '',
    manufacturer: motor.manufacturer || '',
    modelNumber: motor.model_number || '',
    installationDate: formattedInstallationDate
  });
  setEditingMotorId(motor.motor_id); 
  setSubmitError('');
  setSubmitSuccess(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const handleCancelEdit = () => {
    setFormData({
      motorName: '',
      motorType: '',
      manufacturer: '',
      modelNumber: '',
      installationDate: new Date().toISOString().split('T')[0]
    });
    setEditingMotorId(null);
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const filteredMotors = motors.filter(motor =>
    motor.motor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    motor.motor_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    motor.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    motor.model_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMotors.length / motorsPerPage);
  const startIndex = (currentPage - 1) * motorsPerPage;
  const paginatedMotors = filteredMotors.slice(startIndex, startIndex + motorsPerPage);

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

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              {editingMotorId ? 'Edit Motor' : 'Add Motor'}
            </p>
            <div className="flex bg-gray-100 w-[140px] py-1 px-2 rounded-sm mb-[18px] items-center">
              <p>Home</p>
              <ChevronRight className="w-[20px] h-[20px] text-gray-500" />
              <p className="text-[#208CD4]">{editingMotorId ? 'Edit Motor' : 'Add Motor'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                {editingMotorId ? 'Edit Motor' : 'Add Motor'}
              </h1>
              
              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-green-800">
                      <p className="text-sm font-medium">
                        Motor {editingMotorId ? 'updated' : 'added'} successfully!
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="text-green-600 hover:text-green-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-sm font-medium">{submitError}</p>
                    </div>
                    <button
                      onClick={() => setSubmitError('')}
                      className="text-red-600 hover:text-red-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="motorName" className="block text-sm font-medium text-gray-700 mb-2">
                      Motor Name *
                    </label>
                    <input
                      type="text"
                      id="motorName"
                      name="motorName"
                      value={formData.motorName}
                      onChange={handleInputChange}
                      placeholder="Enter Motor Name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="motorType" className="block text-sm font-medium text-gray-700 mb-2">
                      Motor Type *
                    </label>
                    <input
                      type="text"
                      id="motorType"
                      name="motorType"
                      value={formData.motorType}
                      onChange={handleInputChange}
                      placeholder="Enter Motor Type"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      placeholder="Enter Manufacturer"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Model Number *
                    </label>
                    <input
                      type="text"
                      id="modelNumber"
                      name="modelNumber"
                      value={formData.modelNumber}
                      onChange={handleInputChange}
                      placeholder="Enter Model Number"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lp:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Installation Date *
                    </label>
                    <input
                      type="date"
                      id="installationDate"
                      name="installationDate"
                      value={formData.installationDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit/Cancel Buttons */}
                <div className="flex justify-end pt-6 gap-4">
                  {editingMotorId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#208CD4] hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : editingMotorId ? 'Update Motor' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motors Table Section */}
      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">Motors List</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search motors..."
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

            {motorsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div className="text-red-800">
                    <p className="text-sm font-medium">{motorsError}</p>
                  </div>
                  <button
                    onClick={fetchMotors}
                    className="text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {isLoadingMotors ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading motors...</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">S/No</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Motor Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Motor Type</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Manufacturer</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Model Number</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Installation Date</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedMotors.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            {searchQuery ? 'No motors found matching your search.' : 'No motors added yet.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedMotors.map((motor, index) => (
                          <tr key={motor.id || `motor-${index}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {startIndex + index + 1}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {motor.motor_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {motor.motor_type}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {motor.manufacturer}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {motor.model_number}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {motor.installation_date}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEdit(motor)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedMotors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No motors found matching your search.' : 'No motors added yet.'}
                    </div>
                  ) : (
                    paginatedMotors.map((motor, index) => (
                      <div key={motor.id || `motor-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                              #{startIndex + index + 1}
                            </span>
                            <h3 className="font-semibold text-gray-900 text-lg">{motor.motor_name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(motor)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Motor Type:</span>
                            <span className="text-gray-900">{motor.motor_type}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Manufacturer:</span>
                            <span className="text-gray-900">{motor.manufacturer}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Model Number:</span>
                            <span className="text-gray-900">{motor.model_number}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">Installation Date:</span>
                            <span className="text-gray-900">{motor.installation_date}</span>
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
  );
}

export default AddMotor;