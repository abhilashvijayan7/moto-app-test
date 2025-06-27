import React, { useState, useEffect } from "react";

const AddUserModal = ({ isOpen, onClose, name, user }) => {
  // State to manage form inputs
  const [formData, setFormData] = useState({
    dateOfJoining: "",
    vendorType: "Admin",
    vendorName: "",
    gender: "Male",
    dateOfBirth: "",
    designation: "",
    company: "",
    address: "",
    location: "",
    contactNo: "",
    email: "",
    timeInterval: "",
    devices: "",
  });

  // Pre-populate form with user data when in edit mode
  useEffect(() => {
    if (user && name === "Edit User") {
      setFormData({
        dateOfJoining: user.doj ? user.doj.split(" ")[0] : "", // Format date for input (YYYY-MM-DD)
        vendorType: user.role || "Admin",
        vendorName: user.companyName || "",
        gender: user.gender || "Male",
        dateOfBirth: user.dob ? user.dob.split(" ")[0] : "", // Format date for input
        designation: "", // Not in user data, set as empty
        company: user.company || "",
        address: user.home || "",
        location: user.location || "",
        contactNo: user.call || "",
        email: user.mail || "",
        timeInterval: "", // Not in user data, set as empty
        devices: "", // Not in user data, set as empty
      });
    } else {
      // Reset form for add mode
      setFormData({
        dateOfJoining: "",
        vendorType: "Admin",
        vendorName: "",
        gender: "Male",
        dateOfBirth: "",
        designation: "",
        company: "",
        address: "",
        location: "",
        contactNo: "",
        email: "",
        timeInterval: "",
        devices: "",
      });
    }
  }, [user, name, isOpen]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name === "Edit User") {
      console.log("Editing user:", { ...formData, id: user?.apiKey }); // Include user ID for edit
    } else {
      console.log("Adding new user:", formData);
    }
    onClose(); // Close modal after submission
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
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Type
                  </label>
                  <select
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  >
                    <option>Admin</option>
                    <option>Renderer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
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
                    name="dateOfBirth"
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
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
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
                    name="location"
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
                    name="contactNo"
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time Interval
                  </label>
                  <input
                    type="text"
                    name="timeInterval"
                    value={formData.timeInterval}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Devices
                  </label>
                  <input
                    type="text"
                    name="devices"
                    value={formData.devices}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 border border-[#DADADA] rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#208CD4] text-white px-4 py-2 rounded-md hover:bg-[#1a6ea4]"
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