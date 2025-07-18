import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const AddUserModal = ({ isOpen, onClose, name, user }) => {
  // State for form inputs with camelCase keys
  const [formData, setFormData] = useState({
    dateOfJoining: "",
    userType: "Admin",
    userName: "",
    fullName: "",
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
  const dropdownRef = useRef(null);

  // Mapping between UI label names and formData keys
  const nameToKeyMap = {
    "Date Of Joining": "dateOfJoining",
    "User Type": "userType",
    "User Name": "userName",
    "Full Name": "fullName",
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

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Get selected plant names for display
  const getSelectedPlantNames = () => {
    return formData.devices
      .map((id) => {
        const plant = plants.find((p) => String(p.plant_id) === id);
        return plant ? plant.plant_name : null;
      })
      .filter(Boolean)
      .join(", ") || "Select plants";
  };

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
      <div className="fixed inset-0 bg-[#DADADA] bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md lg:max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div className="lg:flex lg:gap-4">
              <div className="flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="Date Of Joining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User Type
                  </label>
                  <select
                    name="User Type"
                    value={formData.userType}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  >
                    <option>Admin</option>
                    <option>Renderer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User Name
                  </label>
                  <input
                    type="text"
                    name="User Name"
                    value={formData.userName}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="Gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Of Birth
                  </label>
                  <input
                    type="date"
                    name="Date Of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    name="Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="Address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="Location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact No
                  </label>
                  <input
                    type="text"
                    name="Contact No"
                    value={formData.contactNo}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Plants
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2 text-left bg-white focus:outline-none truncate"
                    >
                      {getSelectedPlantNames()}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-[#DADADA] rounded-md shadow-lg max-h-60 overflow-auto">
                        {loading ? (
                          <div className="p-2 text-gray-500">Loading plants...</div>
                        ) : error ? (
                          <div className="p-2 text-red-500">{error}</div>
                        ) : plants.length === 0 ? (
                          <div className="p-2 text-gray-500">No plants available</div>
                        ) : (
                          plants.map((plant) => (
                            <label
                              key={plant.plant_id}
                              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.devices.includes(String(plant.plant_id))}
                                onChange={() => handleDeviceChange(plant.plant_id)}
                                className="mr-2 h-4 w-4 text-[#208CD4] focus:ring-[#208CD4] border-gray-300 rounded"
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
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#208CD4] text-white px-4 py-2 rounded-md hover:bg-[#1a6ea4] focus:outline-none"
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