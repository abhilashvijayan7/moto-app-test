import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const AddUserModal = ({ isOpen, onClose, name, user, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dateOfJoining: "",
    userType: "",
    userName: "",
    fullName: "",
    password: "",
    gender: "Male",
    dateOfBirth: "",
    designation: "",
    company: "",
    address: "",
    location: "",
    contactNo: "",
    email: "",
    devices: [],
  });
  const [plants, setPlants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);


  const nameToKeyMap = {
    "Date Of Joining": "dateOfJoining",
    "User Type": "userType",
    "User Name": "userName",
    "Full Name": "fullName",
    Password: "password",
    Gender: "gender",
    "Date Of Birth": "dateOfBirth",
    Designation: "designation",
    Company: "company",
    Address: "address",
    Location: "location",
    "Contact No": "contactNo",
    Email: "email",
    Plants: "devices",
  };


  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoadingPlants(true);
        setError(null);
const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/plants`, { timeout: 10000 });
        const plantData = Array.isArray(response.data) ? response.data : [];
        setPlants(plantData);
      } catch (error) {
        console.error("Error fetching plants:", error);
        setError("Failed to load plants. Please try again.");
        setPlants([]);
      } finally {
        setLoadingPlants(false);
      }
    };
    if (isOpen) {
      fetchPlants();
    }
  }, [isOpen]);


  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        setError(null);
const response = await axios.get(  
  `${import.meta.env.VITE_API_BASE_URL}/roles`,  
  { timeout: 10000 }  
);  
        const roleData = Array.isArray(response.data) ? response.data : [];
        setRoles(roleData);
        if (roleData.length > 0 && name !== "Edit User") {
          setFormData((prev) => ({ ...prev, userType: roleData[0].role_id.toString() }));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError("Failed to load roles. Please try again.");
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, name]);


  useEffect(() => {
    if (user && name === "Edit User") {
      const selectedRole = roles.find((role) => role.role_name === user.role);
      const roleId = selectedRole ? selectedRole.role_id.toString() : (roles.length > 0 ? roles[0].role_id.toString() : "");
      const assignedPlantNames = user.assignedPlant && user.assignedPlant !== "No plants assigned"
        ? user.assignedPlant.split(", ").map(name => name.trim())
        : [];
      const assignedPlantIds = plants
        .filter(plant => assignedPlantNames.includes(plant.plant_name))
        .map(plant => String(plant.plant_id));


      const formatDate = (dateStr, field) => {
        if (!dateStr || typeof dateStr !== "string" || dateStr === "N/A") {
          console.log(`Invalid or missing date for ${field}:`, dateStr);
          return "";
        }
        let date;
        if (dateStr.includes("/")) {
          const [day, month, year] = dateStr.split("/");
          if (!day || !month || !year) {
            console.log(`Invalid ${field} format:`, dateStr);
            return "";
          }
          date = new Date(`${year}-${month}-${day}`);
        } else {
          date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) {
          console.log(`Failed to parse ${field}:`, dateStr);
          return "";
        }
        return date.toISOString().split("T")[0];
      };


      setFormData({
        dateOfJoining: formatDate(user.doj, "dateOfJoining"),
        userType: roleId,
        userName: user.username || "",
        fullName: user.full_name || "",
        password: "",
        gender: user.gender || "Male",
        dateOfBirth: formatDate(user.dob, "dateOfBirth"),
        designation: user.designation || "",
        company: user.company || "",
        address: user.home || user.address || "",
        location: user.location || "",
        contactNo: user.call || user.contact_number || "",
        email: user.mail || user.email || "",
        devices: assignedPlantIds,
      });
    } else {
      setFormData({
        dateOfJoining: "",
        userType: roles.length > 0 ? roles[0].role_id.toString() : "",
        userName: "",
        fullName: "",
        password: "",
        gender: "Male",
        dateOfBirth: "",
        designation: "",
        company: "",
        address: "",
        location: "",
        contactNo: "",
        email: "",
        devices: [],
      });
    }
  }, [user, name, isOpen, roles, plants]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    const formDataKey = nameToKeyMap[name];
    if (formDataKey === "userName") {
      // Allow alphabets, numbers, and special characters (., _, -)
      const validValue = value.replace(/[^A-Za-z0-9._-]/g, '');
      setFormData((prev) => ({ ...prev, [formDataKey]: validValue }));
    } else {
      setFormData((prev) => ({ ...prev, [formDataKey]: value }));
    }
  };


  const handleDeviceChange = (plantId) => {
    const stringPlantId = String(plantId);
    setFormData((prev) => {
      const updatedDevices = prev.devices.includes(stringPlantId)
        ? prev.devices.filter((id) => id !== stringPlantId)
        : [...prev.devices, stringPlantId];
      return { ...prev, devices: updatedDevices };
    });
  };


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };


  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };


  const getSelectedPlantNames = () => {
    const selectedPlants = formData.devices
      .map((id) => {
        const plant = plants.find((p) => String(p.plant_id) === id);
        return plant ? plant.plant_name : null;
      })
      .filter(Boolean);


    if (selectedPlants.length === 0) {
      return "Select plants";
    } else if (selectedPlants.length === 1) {
      return selectedPlants[0];
    } else if (selectedPlants.length <= 2) {
      return selectedPlants.join(", ");
    } else {
      return `${selectedPlants[0]}, ${selectedPlants[1]} +${selectedPlants.length - 2} more`;
    }
  };


  const filteredAndSortedPlants = plants
    .filter((plant) =>
      plant.plant_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aChecked = formData.devices.includes(String(a.plant_id));
      const bChecked = formData.devices.includes(String(b.plant_id));
      if (aChecked && !bChecked) return -1;
      if (!aChecked && bChecked) return 1;
      return 0;
    });


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: formData.userName,
      password: formData.password,
      email: formData.email,
      full_name: formData.fullName,
      date_of_joining: formData.dateOfJoining,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      company: formData.company,
      address: formData.address,
      location: formData.location,
      contact_number: formData.contactNo,
      designation: formData.designation,
      status: "Active",
      notes: "",
      plant_ids: formData.devices.map(Number),
      role_id: Number(formData.userType),
    };


    try {
      setLoadingPlants(true);
      setError(null);


const url = name === "Edit User" && user?.user_id  
  ? `${import.meta.env.VITE_API_BASE_URL}/users/${user.user_id}`  
  : `${import.meta.env.VITE_API_BASE_URL}/users`;  
const method = name === "Edit User" ? 'PUT' : 'POST';  



      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });


      const formatDisplayDate = (dateStr) => {
        if (!dateStr || dateStr === "N/A") return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.log(`Invalid date for display:`, dateStr);
          return "N/A";
        }
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };


      const updatedUser = {
        companyName: response.data.company || formData.company || "N/A",
        full_name: response.data.full_name || formData.fullName || "N/A",
        username: response.data.username || formData.userName || "N/A",
        role: roles.find((role) => role.role_id === Number(formData.userType))?.role_name || "N/A",
        designation: response.data.designation || formData.designation || "N/A",
        dob: response.data.date_of_birth ? formatDisplayDate(response.data.date_of_birth) : "N/A",
        call: response.data.contact_number || formData.contactNo || "N/A",
        doj: response.data.date_of_joining || formData.dateOfJoining || "N/A",
        displayDoj: response.data.date_of_joining ? formatDisplayDate(response.data.date_of_joining) : "N/A",
        mail: response.data.email || formData.email || "N/A",
        gender: response.data.gender || formData.gender || "N/A",
        home: response.data.address || formData.address || "N/A",
        company: response.data.company || formData.company || "N/A",
        location: response.data.location || formData.location || "N/A",
        assignedPlant: formData.devices.length > 0
          ? formData.devices
              .map((id) => plants.find((p) => String(p.plant_id) === id)?.plant_name)
              .filter(Boolean)
              .join(", ") || "No plants assigned"
          : "No plants assigned",
        user_id: response.data.user_id || user?.user_id,
        status: response.data.status || "Active",
      };


      onSuccess(updatedUser);
      toast.success(name === "Edit User" ? "User updated successfully!" : "User added successfully!");
      onClose();
      if (name === "Add New User") {
        navigate('/user-manager');
      }
    } catch (error) {
      console.error(`${name} error:`, error.response?.data || error.message);
      setError(error.response?.data?.message || `Failed to ${name.toLowerCase()}. Please try again.`);
      toast.error(error.response?.data?.message || `Failed to ${name.toLowerCase()}.`);
    } finally {
      setLoadingPlants(false);
    }
  };


  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-md shadow-sm border border-[#DADADA] p-4 sm:p-4 md:p-6 w-full max-w-[480px] md:max-w-[640px] lg:max-w-6xl max-h-[90vh] sm:max-h-[90vh] md:max-h-[85vh] lg:max-h-none overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] sm:text-[24px] md:text-[26px] lg:text-[28px] font-[500] text-[#4D4D4D]">
                {name}
              </h2>
              <h6 className="text-xs sm:text-sm text-gray-500">{formData.userName}</h6>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {error && (
              <div className="text-red-500 text-xs sm:text-sm mb-4">{error}</div>
            )}
            <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="Date Of Joining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      name="Gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Company
                  </label>
                  <input
                    type="text"
                    name="Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Date Of Birth
                  </label>
                  <input
                    type="date"
                    name="Date Of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Contact No
                  </label>
                  <input
                    type="text"
                    name="Contact No"
                    value={formData.contactNo}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <input
                    type="text"
                    name="Address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Location
                  </label>
                  <input
                    type="text"
                    name="Location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600">
                    Plants
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white text-xs sm:text-sm overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                      {getSelectedPlantNames()}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-[#DADADA] rounded-md shadow-sm max-h-60 overflow-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="Search plants..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full py-1 px-2 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                          />
                        </div>
                        {loadingPlants ? (
                          <div className="p-2 text-gray-500 text-xs sm:text-sm">
                            Loading plants...
                          </div>
                        ) : error ? (
                          <div className="p-2 text-red-500 text-xs sm:text-sm">
                            {error}
                          </div>
                        ) : filteredAndSortedPlants.length === 0 ? (
                          <div className="p-2 text-gray-500 text-xs sm:text-sm">
                            No plants found
                          </div>
                        ) : (
                          filteredAndSortedPlants.map((plant) => (
                            <label
                              key={plant.plant_id}
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={formData.devices.includes(String(plant.plant_id))}
                                onChange={() => handleDeviceChange(plant.plant_id)}
                                className="mr-2 h-4 w-4 text-[#208CD4] focus:ring-blue-500 border-[#DADADA] rounded"
                              />
                              <span>{plant.plant_name || "Unnamed Plant"}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {name !== "Edit User" && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#4D4D4D]">
                  Login Info
                </h3>
                <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600">
                        User Type
                      </label>
                      <div className="relative">
                        <select
                          name="User Type"
                          value={formData.userType}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm"
                        >
                          {loadingRoles ? (
                            <option value="">Loading roles...</option>
                          ) : roles.length > 0 ? (
                            roles.map((role) => (
                              <option key={role.role_id} value={role.role_id}>
                                {role.role_name}
                              </option>
                            ))
                          ) : (
                            <option value="">No roles available</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600">
                        User Name
                      </label>
                      <input
                        type="text"
                        name="User Name"
                        value={formData.userName}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={formData.showPassword ? "text" : "password"}
                          name="Password"
                          value={formData.password}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {formData.showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loadingPlants}
                className={`flex items-center gap-2 px-4 py-2 bg-[#208CD4] text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-xs sm:text-sm font-medium ${
                  loadingPlants ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loadingPlants
                  ? "Processing..."
                  : name === "Edit User"
                  ? "Update"
                  : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};


export default AddUserModal;


// user name correction