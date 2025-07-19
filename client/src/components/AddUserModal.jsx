import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X } from "lucide-react";

const AddUserModal = ({ isOpen, onClose, name, user }) => {
  // State for form inputs with camelCase keys
  const [formData, setFormData] = useState({
    dateOfJoining: "",
    userType: "Admin",
    userName: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    gender: "Male",
    dateOfBirth: "",
    designation: "",
    company: "",
    address: "",
    location: "",
    contactNo: "",
    email: "",
    devices: [], // Array to store selected plant IDs
  });

  // State for plants data and UI
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State for search
  const dropdownRef = useRef(null);

  // Mapping between UI label names and formData keys
  const nameToKeyMap = {
    "Date Of Joining": "dateOfJoining",
    "User Type": "userType",
    "User Name": "userName",
    "Full Name": "fullName",
    Password: "password",
    "Confirm Password": "confirmPassword",
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
        setLoading(true);
        setError(null);
        const response = await axios.get('https://water-pump.onrender.com/api/plants');
        console.log("API Response:", response.data); // Debug API response
        const plantData = Array.isArray(response.data) ? response.data : [];
        setPlants(plantData);
      } catch (error) {
        console.error("Error fetching plants:", error);
        setError("Failed to load plants. Please try again.");
        setPlants([]);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      fetchPlants();
    }
  }, [isOpen]);

  // Pre-populate form for edit mode or reset for add mode
  useEffect(() => {
    if (user && name === "Edit User") {
      console.log("User data for edit:", user); // Debug user data
      setFormData({
        dateOfJoining: user.doj ? user.doj.split(" ")[0] : "",
        userType: user.role || "Admin",
        userName: user.companyName || "",
        fullName: user.fullName || "",
        password: "", // Password not provided in user prop
        confirmPassword: "", // Confirm Password not provided in user prop
        gender: user.gender || "Male",
        dateOfBirth: user.dob ? user.dob.split(" ")[0] : "",
        designation: "",
        company: user.company || "",
        address: user.home || "",
        location: user.location || "",
        contactNo: user.call || "",
        email: user.mail || "",
        devices: Array.isArray(user.devices) ? user.devices.map(String) : [], // Ensure string IDs
      });
    } else {
      setFormData({
        dateOfJoining: "",
        userType: "Admin",
        userName: "",
        fullName: "",
        password: "",
        confirmPassword: "",
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
  }, [user, name, isOpen]);

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
    const formDataKey = nameToKeyMap[name]; // Map UI name to formData key
    setFormData((prev) => ({ ...prev, [formDataKey]: value }));
  };

  // Handle plant checkbox changes
  const handleDeviceChange = (plantId) => {
    const stringPlantId = String(plantId);
    console.log("Toggling plant ID:", stringPlantId); // Debug selection
    setFormData((prev) => {
      const updatedDevices = prev.devices.includes(stringPlantId)
        ? prev.devices.filter((id) => id !== stringPlantId)
        : [...prev.devices, stringPlantId];
      console.log("Updated devices:", updatedDevices); // Debug updated devices
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

  // Get selected plant names for display with truncation and count
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

  // Filter and sort plants: checked first, then unchecked, filtered by search term
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
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData); // Debug form data
    if (name === "Edit User") {
      console.log("Editing user:", { ...formData, id: user?.apiKey });
    } else {
      console.log("Adding new user:", formData);
    }
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 w-full max-w-[480px] lg:max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[28px] font-[700] text-[#4D4D4D]">{name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                      className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                      className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white text-sm overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                      {getSelectedPlantNames()}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="Search plants..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full py-1 px-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        {loading ? (
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
                                className="mr-2 h-4 w-4 text-[#208CD4] focus:ring-blue-500 border-gray-200 rounded"
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
                        className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                      >
                        <option>Admin</option>
                        <option>Renderer</option>
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
                      className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                      className="mt-1 block w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-[#208CD4] text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
              >
                {name === "Edit User" ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default AddUserModal;

// perfect