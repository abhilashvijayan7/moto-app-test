import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import toast from 'react-hot-toast';

function ChangePassword() {
  const { user, isCheckingSession } = useContext(UserContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.log(`Invalid date for display:`, dateStr);
      return 'N/A';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchUserDetails = async () => {
    // --- THIS IS THE FIX ---
    // 1. Check for either 'userId' (from login) or 'user_id' (from session refresh).
    const id = user?.userId || user?.user_id;

    // 2. If neither ID exists, then show the error.
    if (!id) {
      setError('User ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 3. Use the consistent 'id' variable in the API call.
      const response = await axios.get(`https://water-pump.onrender.com/api/UserPlantAccess/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      console.log("UserPlantAccess Response:", response.data);

      const currentUserDetails = Array.isArray(response.data) ? response.data[0] : response.data;

      if (currentUserDetails) {
        setUserData({
          companyName: currentUserDetails.company || 'N/A',
          full_name: currentUserDetails.full_name || user.username || 'N/A',
          username: currentUserDetails.username || user.username || 'N/A',
          role: currentUserDetails.role_name || user.role || 'N/A',
          designation: currentUserDetails.designation || 'N/A',
          dob: currentUserDetails.date_of_birth ? formatDisplayDate(currentUserDetails.date_of_birth) : 'N/A',
          call: currentUserDetails.contact_number || 'N/A',
          doj: currentUserDetails.date_of_joining || 'N/A',
          displayDoj: currentUserDetails.date_of_joining ? formatDisplayDate(currentUserDetails.date_of_joining) : 'N/A',
          mail: currentUserDetails.email || 'N/A',
          gender: currentUserDetails.gender || 'N/A',
          home: currentUserDetails.address || 'N/A',
          company: currentUserDetails.company || 'N/A',
          location: currentUserDetails.location || 'N/A',
          assignedPlant: currentUserDetails.plants && currentUserDetails.plants.length > 0
            ? currentUserDetails.plants.map((plant) => plant.plant_name).join(', ')
            : 'No plants assigned',
          user_id: currentUserDetails.user_id,
          status: currentUserDetails.status || 'N/A',
        });
        setError(null);
      } else {
        setError('Could not find detailed user information.');
      }
    } catch (err) {
      console.error('Error fetching user details:', err.response?.data || err.message);
      setError('Failed to fetch user details.');
    } finally {
      setLoading(false);
    }
  };

  // This hook now correctly waits for the user object to be available
  useEffect(() => {
    if (!isCheckingSession && user) {
      fetchUserDetails();
    }
  }, [isCheckingSession, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Please fill in all password fields.');
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      toast.error('New passwords do not match.');
      return;
    }

    try {
      await axios.post(
        'https://water-pump.onrender.com/api/users/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setMessage('Password updated successfully.');
      toast.success('Password updated successfully.');
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update password. Please try again.';
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  // This "guard clause" is the key. It shows a loading screen
  // and prevents the rest of the component from rendering until the user is confirmed.
  if (isCheckingSession || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading User Data...</div>
      </div>
    );
  }

  // A secondary loading state for when we are fetching this page's specific data
  if (loading) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center">
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }
  
  // An error state if fetching fails or the user data couldn't be found
  if (error || !userData) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center text-red-500">
          <p>{error || 'Could not load user data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] w-full mx-auto text-[#4E4D4D] my-6 px-4 sm:px-6 lg:px-11">
      {/* Page Heading */}
      <h1 className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold mb-6 text-[#333] text-center lg:text-left">
        Change Password
      </h1>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Password Update Form */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#208CD4] text-center lg:text-left">
            Update Password
          </h2>

          {/* Hidden Field for Autocomplete */}
          <input
            type="password"
            name="dummy-password"
            autoComplete="new-password"
            style={{ display: 'none' }}
          />

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="off"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>

            {/* Message */}
            {message && (
              <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 w-full sm:w-auto bg-[#208CD4] text-white rounded-lg hover:bg-[#1b7bb9] transition-all"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Right: Profile Details */}
        <div className="bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl p-5 sm:p-6 md:p-8">
          {/* Header */}
          <div className="border-b border-[#208CD4] pb-4 mb-6">
            <p className="text-gray-800 text-lg sm:text-xl font-semibold break-words text-center lg:text-left">
              {userData.full_name}
            </p>
            <p className="text-gray-500 font-medium text-sm capitalize text-center lg:text-left">
              {userData.role}
            </p>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                { label: 'Designation', value: userData.designation },
                { label: 'Contact Number', value: userData.call },
                { label: 'Email', value: userData.mail },
                { label: 'Address', value: userData.home },
                { label: 'Location', value: userData.location },
              ].map((item, index) => (
                <div key={index}>
                  <p className="text-gray-600 text-sm font-medium">{item.label}</p>
                  <p className="text-gray-900 text-sm break-words">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { label: 'Date of Birth', value: userData.dob },
                { label: 'Date of Joining', value: userData.displayDoj },
                { label: 'Gender', value: userData.gender },
                { label: 'Company', value: userData.company },
                { label: 'Assigned Plant', value: userData.assignedPlant },
              ].map((item, index) => (
                <div key={index}>
                  <p className="text-gray-600 text-sm font-medium">{item.label}</p>
                  <p className="text-gray-900 text-sm break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}

export default ChangePassword;
