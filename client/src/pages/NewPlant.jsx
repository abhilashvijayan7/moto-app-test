import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import ApplyMotorModal from "../components/ApplyMotorModal";
import ApplySensorModal from "../components/ApplySensorModal";

function NewPlant() {
  const [formData, setFormData] = useState({
    plantName: "",
    location: "",
    contactPerson: "",
    phone: "",
    email: "",
    deviceId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [plants, setPlants] = useState([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [plantsError, setPlantsError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [plantsPerPage, setPlantsPerPage] = useState(10);
  const [isMotorModalOpen, setIsMotorModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError("");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  useEffect(() => {
    fetchLocations();
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setIsLoadingPlants(true);
      setPlantsError("");
      const response = await fetch("https://water-pump.onrender.com/api/plants");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const sortedPlants = data.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return (b.plant_id || 0) - (a.plant_id || 0);
      });
      setPlants(sortedPlants);
    } catch (error) {
      console.error("Error fetching plants:", error);
      setPlantsError("Failed to load plants. Please refresh the page.");
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      setLocationsError("");
      const response = await fetch("https://water-pump.onrender.com/api/locations");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocationsError("Failed to load locations. Please refresh the page.");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (submitError) setSubmitError("");
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleEditPlant = (plant) => {
    const location = locations.find((loc) => loc.id === plant.plant_location_id);
    setFormData({
      plantName: plant.plant_name || "",
      location: location ? location.address : "",
      contactPerson: plant.contact_person || "",
      phone: plant.contact_phone || "",
      email: plant.contact_email || "",
      deviceId: plant.device_id ? plant.device_id.toString() : "",
    });
    setIsEditing(true);
    setEditingPlantId(plant.plant_id);
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleCancelEdit = () => {
    setFormData({
      plantName: "",
      location: "",
      contactPerson: "",
      phone: "",
      email: "",
      deviceId: "",
    });
    setIsEditing(false);
    setEditingPlantId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      if (!formData.plantName.trim()) throw new Error("Plant name is required");
      if (!formData.location.trim()) throw new Error("Location is required");
      if (!formData.contactPerson.trim()) throw new Error("Contact person is required");
      if (!formData.phone.trim()) throw new Error("Phone number is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.deviceId.trim()) throw new Error("Device ID is required");

      const deviceId = parseInt(formData.deviceId.trim(), 10);
      if (isNaN(deviceId) || deviceId.toString() !== formData.deviceId.trim()) {
        throw new Error("Device ID must be a valid number");
      }

      const selectedLocation = locations.find((loc) => loc.address === formData.location);
      if (!selectedLocation) throw new Error("Please select a valid location");

      const plantData = {
        plant_name: formData.plantName.trim(),
        plant_location_id: selectedLocation.id,
        contact_person: formData.contactPerson.trim(),
        contact_email: formData.email.trim(),
        contact_phone: formData.phone.trim(),
        device_id: deviceId,
      };

      if (isEditing) {
        const response = await fetch(`https://water-pump.onrender.com/api/plants/${editingPlantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantData),
        });

        const responseText = await response.text();
        if (!response.ok) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || errorData.error || `Server Error: ${response.status}`);
          } catch (parseError) {
            throw new Error(`Server Error (${response.status}): ${responseText || "Unknown error"}`);
          }
        }

        setSubmitSuccess(true);
        await fetchPlants();
        handleCancelEdit();
      } else {
        const plantResponse = await fetch("https://water-pump.onrender.com/api/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantData),
        });

        const plantResponseText = await plantResponse.text();
        if (!plantResponse.ok) {
          try {
            const errorData = JSON.parse(plantResponseText);
            throw new Error(errorData.message || errorData.error || `Server Error: ${plantResponse.status}`);
          } catch (parseError) {
            throw new Error(`Server Error (${plantResponse.status}): ${plantResponseText || "Unknown error"}`);
          }
        }

        const plantResult = JSON.parse(plantResponseText);
        const plantLocationData = {
          plant_id: plantResult.plant_id,
          location_id: plantResult.plant_location_id,
          installation_date: new Date().toISOString().split("T")[0],
        };

        const plantLocationResponse = await fetch("https://water-pump.onrender.com/api/plant-locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantLocationData),
        });

        const plantLocationResponseText = await plantLocationResponse.text();
        if (!plantLocationResponse.ok) {
          try {
            const errorData = JSON.parse(plantLocationResponseText);
            throw new Error(errorData.message || errorData.error || `Server Error: ${plantLocationResponse.status}`);
          } catch (parseError) {
            throw new Error(`Server Error (${plantLocationResponse.status}): ${plantLocationResponseText || "Unknown error"}`);
          }
        }

        setSubmitSuccess(true);
        await fetchPlants();
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error:", error);
      setSubmitError(error.message || `Failed to ${isEditing ? "update" : "add"} plant. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlants = plants.filter(
    (plant) =>
      plant.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.contact_phone?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredPlants.length / plantsPerPage);
  const startIndex = (currentPage - 1) * plantsPerPage;
  const paginatedPlants = filteredPlants.slice(startIndex, startIndex + plantsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleShowChange = (e) => {
    setPlantsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleApplyMotor = (plant) => {
    if (!plant?.plant_id) {
      setPlantsError("Invalid plant selected. Please try again.");
      return;
    }
    setSelectedPlant(plant);
    setIsMotorModalOpen(true);
  };

  const handleCloseMotorModal = async () => {
    setIsMotorModalOpen(false);
    setSelectedPlant(null);
    await fetchPlants(); // Refresh plant list after modal closes
  };

  const handleApplySensor = (plant) => {
    if (!plant?.plant_id) {
      setPlantsError("Invalid plant selected. Please try again.");
      return;
    }
    setSelectedPlant(plant);
    setIsSensorModalOpen(true);
  };

  const handleCloseSensorModal = () => {
    setIsSensorModalOpen(false);
    setSelectedPlant(null);
  };

  const handleApplySensorSubmit = async (sensors, plantId) => {
    try {
      if (!plantId) throw new Error("No plant selected");
      if (!sensors || sensors.length === 0) throw new Error("No sensors selected");

      const invalidSensors = sensors.filter((sensor) => !sensor.minValue || !sensor.maxValue);
      if (invalidSensors.length > 0) {
        throw new Error("All sensors must have min and max values");
      }

      const sensorData = sensors.map((sensor) => ({
        sensor_type: sensor.sensorType,
        min_value: sensor.minValue,
        max_value: sensor.maxValue,
        plant_id: plantId,
      }));

      const response = await fetch(`https://water-pump.onrender.com/api/plants/${plantId}/sensors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorData),
      });

      const responseText = await response.text();
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || errorData.error || `Server Error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server Error (${response.status}): ${responseText || "Unknown error"}`);
        }
      }

      setSubmitSuccess(true);
      await fetchPlants();
    } catch (error) {
      console.error("Error applying sensors:", error);
      setSubmitError(error.message || "Failed to apply sensors. Please try again.");
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            currentPage === 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="px-2 text-gray-500">...</span>);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            currentPage === page ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {page}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="px-2 text-gray-500">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            currentPage === totalPages ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="flex-1">
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              {isEditing ? "Edit Plant" : "Add New Plant"}
            </p>
            <div className="flex bg-gray-100 w-[166px] py-1 px-2 rounded-sm mb-[18px] items-center">
              <p>Home</p>
              <ChevronRight className="w-[20px] h-[20px] text-gray-500" />
              <p className="text-[#208CD4]">{isEditing ? "Edit Plant" : "Add New Plant"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
              {isEditing ? "Edit Plant" : "New Plant"}
            </h1>

            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-green-800">
                    {isEditing ? "Plant updated successfully!" : "Plant and location relationship added successfully!"}
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-green-600 hover:text-green-800 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                  <button
                    onClick={() => setSubmitError("")}
                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {locationsError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="text-yellow-800">
                  <p className="text-sm font-medium">{locationsError}</p>
                  <button
                    onClick={fetchLocations}
                    className="text-sm underline hover:no-underline mt-1"
                  >
                    Retry loading locations
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
                    Plant Name *
                  </label>
                  <input
                    type="text"
                    id="plantName"
                    name="plantName"
                    value={formData.plantName}
                    onChange={handleInputChange}
                    placeholder="Name of Plant"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    disabled={isLoadingLocations}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {isLoadingLocations ? "Loading locations..." : "Select Location"}
                    </option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.address}>
                        {location.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID * (Numeric)
                  </label>
                  <input
                    type="text"
                    id="deviceId"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter a numeric ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-6 gap-4">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="font-medium py-3 px-8 rounded-md transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoadingLocations}
                  className={`font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting || isLoadingLocations
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-[#208CD4] hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update Plant" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">Plants List</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <select
                  value={plantsPerPage}
                  onChange={handleShowChange}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={5}>Show 5</option>
                  <option value={10}>Show 10</option>
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
                </select>
              </div>
            </div>

            {plantsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-red-800">{plantsError}</p>
                  <button
                    onClick={fetchPlants}
                    className="text-sm underline hover:no-underline text-red-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {isLoadingPlants ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading plants...</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">S/No</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Plant Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Contact Person</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Contact Number</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedPlants.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            {searchQuery ? "No plants found matching your search." : "No plants added yet."}
                          </td>
                        </tr>
                      ) : (
                        paginatedPlants.map((plant, index) => (
                          <tr key={plant.plant_id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.plant_name}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {locations.find((loc) => loc.id === plant.plant_location_id)?.address || "N/A"}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.contact_person}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.contact_phone}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditPlant(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleApplyMotor(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Apply Motor
                                </button>
                                <button
                                  onClick={() => handleApplySensor(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Apply Sensor
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {paginatedPlants.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? "No plants found matching your search." : "No plants added yet."}
                    </p>
                  ) : (
                    paginatedPlants.map((plant, index) => (
                      <div key={plant.plant_id} className="border border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">#{startIndex + index + 1}</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Name:</span> {plant.plant_name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Location:</span>{" "}
                          {locations.find((loc) => loc.id === plant.plant_location_id)?.address || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Contact:</span> {plant.contact_person}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Phone:</span> {plant.contact_phone}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleEditPlant(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleApplyMotor(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Apply Motor
                          </button>
                          <button
                            onClick={() => handleApplySensor(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Apply Sensor
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex space-x-1">{renderPagination()}</div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ApplyMotorModal
        isOpen={isMotorModalOpen}
        onClose={handleCloseMotorModal}
        plant_id={selectedPlant?.plant_id}
      />
      <ApplySensorModal
        isOpen={isSensorModalOpen}
        onClose={handleCloseSensorModal}
        onSave={handleApplySensorSubmit}
        plantId={selectedPlant?.plant_id}
      />
    </div>
  );
}

export default NewPlant;