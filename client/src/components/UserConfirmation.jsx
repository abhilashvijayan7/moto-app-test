import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

const UserConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'Active', // Expecting 'Active' or 'Inactive'
  user,
  userName = '',
}) => {
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const newStatus = actionType; // 'Active' or 'Inactive'

    if (!user?.user_id || !newStatus) {
      setStatusMessage('Target user ID and status required.');
      return;
    }

    try {
      const payload = {
        user_id: user.user_id,
        status: newStatus,
      };

      console.log("Sending status update payload:", payload);

      const response = await axios.put(
        'https://water-pump.onrender.com/api/users/reset-status',
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );

      console.log('Status update response:', response.status, response.data);
      setStatusMessage(`User ${newStatus.toLowerCase()}d successfully`);
      onConfirm(user.user_id, newStatus); // Notify parent to update UI
      setTimeout(() => {
        onClose(); // Close modal after success
      }, 1500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update user status. Please try again.';
      console.error('Error resetting status:', err.response?.status, err.response?.data, err.message);
      setStatusMessage(errorMessage);
    }
  };

  const isActivate = actionType === 'Active';
  const actionText = isActivate ? 'Activate' : 'Deactivate';
  const icon = isActivate ? (
    <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-4xl" />
  ) : (
    <FontAwesomeIcon icon={faCircleCheck} className="text-red-500 text-4xl" />
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md">
        <div className="flex justify-center mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-center mb-2">{actionText} User</h2>
        <p className="text-gray-600 text-center">
          Are you sure you want to <strong>{actionText.toLowerCase()}</strong> user <strong>{userName}</strong>?
        </p>
        {statusMessage && (
          <p
            className={`mt-4 text-sm text-center ${
              statusMessage.includes('success') ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {statusMessage}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={statusMessage.includes('success')}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${
              isActivate ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={handleSubmit}
            disabled={statusMessage.includes('success')}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmation;
