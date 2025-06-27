import React from 'react';

const UploadComponent = ({ isOpen, onClose }) => {
  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-600 text-lg font-semibold">Upload Files</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
            <input className="bg-[#FFFFFF] text-[#208CD4] px-4 py-2 border border-[#208CD4] rounded hover:bg-blue-200 w-[200px]" type='file'/>
            
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="bg-[#FFFFFF] text-[#208CD4] border border-[#208CD4] px-4 py-2 rounded hover:bg-blue-200"
            >
              Cancel
            </button>
            <button className="bg-[#208CD4] text-white px-4 py-2 rounded hover:bg-blue-600">
              Upload
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default UploadComponent;