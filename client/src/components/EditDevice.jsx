import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

export default function EditDevice({ isOpen, onClose, onSubmit, device }) {
  const [formData, setFormData] = useState({
    dateOfEntry: '22-06-2025 11:19',
    deviceId: 'IMO12WCH0000033',
    productName: 'IMO102WCH',
    model: 'DHTIL',
    venderId: 'KRP Aqua Tech',
    maxData: '10',
    apiKey: '',
    status: 'Active',
    autoEnable: '0',
    pumpCount: '1',
    narration: ''
  });

  // Populate form when device prop changes
  useEffect(() => {
    if (device) {
      setFormData({
        dateOfEntry: device.entryDate || device.installationDate || '22-06-2025 11:19',
        deviceId: device.deviceId || '',
        productName: device.locationCode || device.productName || '',
        model: device.model || 'DHTIL',
        venderId: device.venderId || 'KRP Aqua Tech',
        maxData: device.maxDataLimit?.replace('Maximum Data : ', '') || device.maxData || '10',
        apiKey: device.apiKey || '',
        status: device.status || 'Active',
        autoEnable: device.autoEnable || '0',
        pumpCount: device.pumpCount || '1',
        narration: device.narration || ''
      });
    }
  }, [device]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving device data:', formData);
    if (onSubmit) {
      onSubmit({ ...formData, originalDevice: device });
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-xl">
          {/* Form Header */}
          <div className="flex items-center justify-between px-6 py-4 ">
            <h3 className="text-xl font-semibold text-gray-800">Edit Info</h3>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Form Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Date of Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Of Entry
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.dateOfEntry}
                      onChange={(e) => handleInputChange('dateOfEntry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="DD-MM-YYYY HH:MM"
                    />
                    <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Vendor ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Id
                  </label>
                  <select
                    value={formData.venderId}
                    onChange={(e) => handleInputChange('venderId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="KRP Aqua Tech">KRP Aqua Tech</option>
                    <option value="Other Vendor">Other Vendor</option>
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter API key"
                  />
                </div>

                {/* Auto Enable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Enable
                  </label>
                  <input
                    type="number"
                    value={formData.autoEnable}
                    onChange={(e) => handleInputChange('autoEnable', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Device ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID
                  </label>
                  <input
                    type="text"
                    value={formData.deviceId}
                    onChange={(e) => handleInputChange('deviceId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter device ID"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="DHTIL">DHTIL</option>
                    <option value="Other Model">Other Model</option>
                  </select>
                </div>

                {/* Maximum Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Data
                  </label>
                  <input
                    type="number"
                    value={formData.maxData}
                    onChange={(e) => handleInputChange('maxData', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="10"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Pump Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pump Count
                  </label>
                  <input
                    type="number"
                    value={formData.pumpCount}
                    onChange={(e) => handleInputChange('pumpCount', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Narration - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narration
              </label>
              <textarea
                value={formData.narration}
                onChange={(e) => handleInputChange('narration', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                placeholder="Enter narration..."
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-[#208CD4] text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}