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

  useEffect(() => {
    if (!isCheckingSession && !user) {
      console.log('No user after session check, redirecting to /login');
      navigate('/login', { state: { from: '/change-password' } });
    }
  }, [isCheckingSession, user, navigate]);

  const fetchUserDetails = async () => {
    if (!user || !user.user_id) {
      setError('Please log in to change your password.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('https://water-pump.onrender.com/api/UserPlantAccess', {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      console.log('UserPlantAccess Response:', response.data);

      const mappedData = response.data
        .filter((apiUser) => apiUser.user_id === user.user_id)
        .map((apiUser) => ({
          companyName: apiUser.company || 'N/A',
          full_name: apiUser.full_name || user.username || 'N/A',
          username: apiUser.username || user.username || 'N/A',
          role: apiUser.role_name || user.role || 'N/A',
          designation: apiUser.designation || 'N/A',
          dob: apiUser.date_of_birth ? formatDisplayDate(apiUser.date_of_birth) : 'N/A',
          call: apiUser.contact_number || 'N/A',
          doj: apiUser.date_of_joining || 'N/A',
          displayDoj: apiUser.date_of_joining ? formatDisplayDate(apiUser.date_of_joining) : 'N/A',
          mail: apiUser.email || 'N/A',
          gender: apiUser.gender || 'N/A',
          home: apiUser.address || 'N/A',
          company: apiUser.company || 'N/A',
          location: apiUser.location || 'N/A',
          assignedPlant: apiUser.plants && apiUser.plants.length > 0
            ? apiUser.plants.map((plant) => plant.plant_name).join(', ')
            : user.userPlants && user.userPlants.length > 0
            ? user.userPlants.map((plant) => plant.plant_name).join(', ')
            : 'No plants assigned',
          user_id: apiUser.user_id,
          status: apiUser.status || 'N/A',
        }));

      if (mappedData.length > 0) {
        setUserData(mappedData[0]);
        setError(null);
      } else {
        console.warn('No matching user in UserPlantAccess, falling back to UserContext');
        setUserData({
          companyName: 'N/A',
          full_name: user.username || 'N/A',
          username: user.username || 'N/A',
          role: user.role || 'N/A',
          designation: 'N/A',
          dob: 'N/A',
          call: 'N/A',
          doj: 'N/A',
          displayDoj: 'N/A',
          mail: 'N/A',
          gender: 'N/A',
          home: 'N/A',
          company: 'N/A',
          location: 'N/A',
          assignedPlant: user.userPlants && user.userPlants.length > 0
            ? user.userPlants.map((plant) => plant.plant_name).join(', ')
            : 'No plants assigned',
          user_id: user.user_id,
          status: 'N/A',
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching user details:', err.response?.data || err.message);
      setError('Failed to fetch user details. Using session data.');
      setUserData({
        companyName: 'N/A',
        full_name: user.username || 'N/A',
        username: user.username || 'N/A',
        role: user.role || 'N/A',
        designation: 'N/A',
        dob: 'N/A',
        call: 'N/A',
        doj: 'N/A',
        displayDoj: 'N/A',
        mail: 'N/A',
        gender: 'N/A',
        home: 'N/A',
        company: 'N/A',
        location: 'N/A',
        assignedPlant: user.userPlants && user.userPlants.length > 0
          ? user.userPlants.map((plant) => plant.plant_name).join(', ')
          : 'No plants assigned',
        user_id: user.user_id,
        status: 'N/A',
      });
    } finally {
      setLoading(false);
    }
  };

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
        'https://water-pump.onrender.com/api/user/change-password',
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
      console.error('Password update failed:', err.response?.data || err.message);
      setMessage('Failed to update password. Please try again.');
      toast.error('Failed to update password. Please try again.');
    }
  };

  if (isCheckingSession || loading) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center">
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center text-red-500">
          <p>{error || 'Please log in to change your password.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
      <div className="font-[500] text-[14px]">
        <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
          Change Password
        </p>
      </div>
      <div className="bg-[#FFFFFF] rounded-xl p-4">
        <div className="font-[400] text-[14px] border border-[#DADADA] rounded-lg px-[16px] py-[24px] mb-4">
          <div className="border-b border-[#208CD4] pb-[16px]">
            <p className="text-[#4E4D4D] font-[600] text-[16px] break-words">
              {userData.full_name}
            </p>
            <p className="text-[#aba6a6] font-[500] text-[12px]">
              {userData.role}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-[16px]">
            <div>
              {[
                { label: 'Designation', value: userData.designation },
                { label: 'Contact Number', value: userData.call },
                { label: 'Email', value: userData.mail },
                { label: 'Address', value: userData.home },
                { label: 'Location', value: userData.location },
              ].map((item, detailIndex) => (
                <div
                  key={detailIndex}
                  className="py-[8px] min-h-[40px] border-b border-[#DADADA]"
                >
                  <p className="font-[500] text-[#4E4D4D]">{item.label}:</p>
                  <p className="break-words max-w-[90%]">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              {[
                { label: 'Date of Birth', value: userData.dob },
                { label: 'Date of Joining', value: userData.displayDoj },
                { label: 'Gender', value: userData.gender },
                { label: 'Company', value: userData.company },
                { label: 'Assigned Plant', value: userData.assignedPlant },
              ].map((item, detailIndex) => (
                <div
                  key={detailIndex}
                  className="py-[8px] min-h-[40px] border-b border-[#DADADA]"
                >
                  <p className="font-[500] text-[#4E4D4D]">{item.label}:</p>
                  <p className="break-words max-w-[90%]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Update Password</h2>
          <form onSubmit={handleSubmit}>
            {/* Dummy input to confuse autofill */}
            <input
              type="password"
              style={{ display: 'none' }}
              name="dummy-password"
              autoComplete="new-password"
            />
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name={`current-password-${Math.random().toString(36).substring(2)}`}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="off"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>
            <div className="mb-4">
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
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>
            <div className="mb-4">
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
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>
            {message && (
              <p className={`mb-4 text-sm ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#208CD4] text-white rounded hover:bg-[#1b7bb9] transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;