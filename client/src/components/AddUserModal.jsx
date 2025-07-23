import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X } from "lucide-react";

const AddUserModal = ({ isOpen, onClose, name, user, onSuccess }) => {
  // State for form inputs with camelCase keys
  const [formData, setFormData] = useState({
    dateOfJoining: "",
    userType: "", // Will store role_id
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

  // State for plants, roles, and UI
  const [plants, setPlants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Mapping between UI label names and formData keys
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

  // Fetch plants from API
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoadingPlants(true);
        setError(null);
        const response = await axios.get('https://water-pump.onrender.com/api/plants');
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

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        setError(null);
        const response = await axios.get('https://water-pump.onrender.com/api/roles');
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

  // Pre-populate form for edit mode or reset for add mode
  useEffect(() => {
    if (user && name === "Edit User") {
      console.log("User data for edit:", user); // Debug: Log entire user object
      console.log("Date of Joining (doj):", user.doj, "Date of Birth (dob):", user.dob); // Debug: Log specific date fields
      console.log("Raw API fields:", { date_of_joining: user.date_of_joining, date_of_birth: user.date_of_birth }); // Debug: Check raw API fields
      
      const selectedRole = roles.find((role) => role.role_name === user.role);
      const roleId = selectedRole ? selectedRole.role_id.toString() : (roles.length > 0 ? roles[0].role_id.toString() : "");
      // Parse assignedPlant to extract plant names and match with plant IDs
      const assignedPlantNames = user.assignedPlant && user.assignedPlant !== "No plants assigned"
        ? user.assignedPlant.split(", ").map(name => name.trim())
        : [];
      const assignedPlantIds = plants
        .filter(plant => assignedPlantNames.includes(plant.plant_name))
        .map(plant => String(plant.plant_id));

      // Format dates to YYYY-MM-DD
      const formatDate = (dateStr, field) => {
        if (!dateStr || typeof dateStr !== "string" || dateStr === "N/A") {
          console.log(`Invalid or missing date for ${field}:`, dateStr); // Debug: Log invalid date
          return "";
        }
        let date;
        if (dateStr.includes("/")) {
          // Handle DD/MM/YYYY format from UserManager
          const [day, month, year] = dateStr.split("/");
          if (!day || !month || !year) {
            console.log(`Invalid ${field} format:`, dateStr); // Debug: Log format issue
            return "";
          }
          date = new Date(`${year}-${month}-${day}`);
        } else {
          // Handle YYYY-MM-DD, ISO, or other formats
          date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) {
          console.log(`Failed to parse ${field}:`, dateStr); // Debug: Log parsing failure
          return "";
        }
        const formattedDate = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
        console.log(`Formatted ${field}:`, dateStr, "->", formattedDate); // Debug: Log transformation
        return formattedDate;
      };

      const newFormData = {
        dateOfJoining: formatDate(user.doj, "dateOfJoining"), // Pre-fill with formatted doj
        userType: roleId,
        userName: user.companyName || user.username || "",
        fullName: user.companyName || user.full_name || "", // Pre-fill with user.companyName or full_name
        password: "",
        gender: user.gender || "Male",
        dateOfBirth: formatDate(user.dob, "dateOfBirth"), // Pre-fill with formatted dob
        designation: user.role || user.designation || "", // Pre-fill with user.role or designation
        company: user.company || "",
        address: user.home || user.address || "",
        location: user.location || "",
        contactNo: user.call || user.contact_number || "",
        email: user.mail || user.email || "",
        devices: assignedPlantIds,
      };
      setFormData(newFormData);
      console.log("formData after set:", newFormData); // Debug: Log formData
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

  // Close dropdown when clicking outside
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

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formDataKey = nameToKeyMap[name];
    setFormData((prev) => ({ ...prev, [formDataKey]: value }));
  };

  // Handle plant checkbox changes
  const handleDeviceChange = (plantId) => {
    const stringPlantId = String(plantId);
    setFormData((prev) => {
      const updatedDevices = prev.devices.includes(stringPlantId)
        ? prev.devices.filter((id) => id !== stringPlantId)
        : [...prev.devices, stringPlantId];
      return { ...prev, devices: updatedDevices };
    });
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Get selected plant names for display
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

  // Filter and sort plants
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: formData.userName,
      password: formData.password,
      email: formData.email,
      full_name: formData.fullName,
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
      ...(name !== "Edit User" && { date_of_joining: formData.dateOfJoining }), // Use date_of_joining for add mode
    };

    try {
      setLoadingPlants(true);
      setError(null);

      const url = name === "Edit User" && user?.user_id
        ? `https://water-pump.onrender.com/api/users/${user.user_id}`
        : 'https://water-pump.onrender.com/api/users';

      const method = name === "Edit User" ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`${name} response:`, response.data);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(`${name} error:`, error.response?.data || error.message);
      setError(error.response?.data?.message || `Failed to ${name.toLowerCase()}. Please try again.`);
    } finally {
      setLoadingPlants(false);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-sm border border-[#DADADA] p-4 lg:p-6 w-full max-w-[480px] lg:max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[28px] font-[700] text-[#4D4D4D]">{name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}
            <div className="lg:grid lg:grid-cols-3 lg:gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="Date Of Joining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      name="Gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Company
                  </label>
                  <input
                    type="text"
                    name="Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Date Of Birth
                  </label>
                  <input
                    type="date"
                    name="Date Of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Contact No
                  </label>
                  <input
                    type="text"
                    name="Contact No"
                    value={formData.contactNo}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <input
                    type="text"
                    name="Address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Location
                  </label>
                  <input
                    type="text"
                    name="Location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Plants
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white text-sm overflow-hidden whitespace-nowrap text-ellipsis"
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
                            className="w-full py-1 px-2 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        {loadingPlants ? (
                          <div className="p-2 text-gray-500 text-sm">Loading plants...</div>
                        ) : error ? (
                          <div className="p-2 text-red-500 text-sm">{error}</div>
                        ) : filteredAndSortedPlants.length === 0 ? (
                          <div className="p-2 text-gray-500 text-sm">No plants found</div>
                        ) : (
                          filteredAndSortedPlants.map((plant) => (
                            <label
                              key={plant.plant_id}
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm"
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
                <h3 className="text-lg font-semibold text-[#4D4D4D]">Login Info</h3>
                <div className="lg:grid lg:grid-cols-3 lg:gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        User Type
                      </label>
                      <div className="relative">
                        <select
                          name="User Type"
                          value={formData.userType}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
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
                      <label className="block text-sm font-medium text-gray-600">
                        User Name
                      </label>
                      <input
                        type="text"
                        name="User Name"
                        value={formData.userName}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Password
                      </label>
                      <input
                        type="password"
                        name="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-[#DADADA] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
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
                className={`flex items-center gap-2 px-4 py-2 bg-[#208CD4] text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium ${loadingPlants ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingPlants ? "Processing..." : name === "Edit User" ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default AddUserModal;

// eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee