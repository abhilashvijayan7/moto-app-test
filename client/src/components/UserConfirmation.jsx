import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

const UserConfirmation = ({ isOpen, onClose, onConfirm, actionType = 'activate', user, userName = '' }) => {
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      console.log('Submit button clicked', user);
      const payload = {
        target_user_id: user.user_id,
        status: actionType,
      };

      const response = await axios.put(
        'https://water-pump.onrender.com/api/users/reset-status',
        payload,
        { withCredentials: true }
      );

      console.log('Success:', response.data);
      setSuccessMessage(`User ${actionType}d successfully`);
      onConfirm(); // Call external handler after success (optional)
      onClose();   // Close modal after submit
    } catch (err) {
      console.error('Error resetting status:', err);
    }
  };

  const isActivate = actionType === 'Active';
  const actionText = isActivate ? 'Activate' : 'Deactivate';
  const icon = isActivate ? <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-4xl" /> : <FontAwesomeIcon icon={faCircleCheck} className="text-red-500 text-4xl" />;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md">
        <div className="flex justify-center mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-center mb-2">{actionText} User</h2>
        <p className="text-gray-600 text-center">
          Are you sure you want to <strong>{actionText.toLowerCase()}</strong> user <strong>{userName}</strong>?
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${
              isActivate ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={handleSubmit}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmation;
