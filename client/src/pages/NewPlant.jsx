import React, { useState, useEffect, useRef } from "react";
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
    installationDate: new Date().toISOString().split("T")[0], // Default to current date
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
  const plantNameInputRef = useRef(null);

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
    if (editingPlantId && plantNameInputRef.current) {
      plantNameInputRef.current.focus();
    }
  }, [editingPlantId]);

  useEffect(() => {
    fetchLocations();
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setIsLoadingPlants(true);
      setPlantsError("");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plants`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched plants:", data);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/locations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched locations:", data);
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
    setFormData({
      plantName: plant.plant_name || "",
      location: plant.location_name || "",
      contactPerson: plant.contact_person || "",
      phone: plant.contact_phone || "",
      email: plant.contact_email || "",
      deviceId: plant.device_id ? plant.device_id.toString() : "",
      installationDate: plant.installation_date || new Date().toISOString().split("T")[0],
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
      installationDate: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
    setEditingPlantId(null);
    if (plantNameInputRef.current) {
      plantNameInputRef.current.blur();
    }
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
      if (!formData.installationDate.trim()) throw new Error("Installation date is required");

      const selectedLocation = locations.find((loc) => loc.location_name === formData.location);
      console.log("Selected Location:", selectedLocation);

      if (!selectedLocation || !selectedLocation.location_id) {
        throw new Error("Invalid location selected. Please choose a valid location.");
      }

      const plantData = {
        plant_name: formData.plantName.trim(),
        location_id: Number(selectedLocation.location_id),
        installation_date: formData.installationDate,
        contact_person: formData.contactPerson.trim(),
        contact_email: formData.email.trim(),
        contact_phone: formData.phone.trim(),
        device_id: formData.deviceId.trim(),
      };

      console.log("Request Payload for Plant:", JSON.stringify(plantData));

      if (isEditing) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plants/${editingPlantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantData),
        });

        const responseText = await response.text();
        console.log("PUT Response:", responseText);
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
        const plantResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantData),
        });

        const plantResponseText = await plantResponse.text();
        console.log("POST Response for Plant:", plantResponseText);
        if (!plantResponse.ok) {
          try {
            const errorData = JSON.parse(plantResponseText);
            throw new Error(errorData.message || errorData.error || `Server Error: ${plantResponse.status}`);
          } catch (parseError) {
            throw new Error(`Server Error (${plantResponse.status}): ${plantResponseText || "Unknown error"}`);
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
    await fetchPlants();
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

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plants/${plantId}/sensors`, {
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

  const isSubmitDisabled = isSubmitting || isLoadingLocations || locations.length === 0;

  return (
    <div className="flex-1">
      <div className="p-3 sm:p-4 lg:p-6 max-w-[640px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1440px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
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

            {locations.length === 0 && !isLoadingLocations && (
              <p className="text-red-500 text-sm mt-2">No locations available. Please add a location first.</p>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    ref={plantNameInputRef}
                  />
                </div>
                <div>
                  <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID *
                  </label>
                  <input
                    type="text"
                    id="deviceId"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Device ID (e.g., esp32-wtp-test-1185abt25)"
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
                      <option key={location.location_id || `location-${location.location_name}`} value={location.location_name}>
                        {location.location_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date *
                  </label>
                  <input
                    type="date"
                    id="installationDate"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              </div>
              <div className="flex justify-end pt-6 gap-4">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="font-medium py-2.5 sm:py-3 px-6 sm:px-8 rounded-md transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className={`font-medium py-2.5 sm:py-3 px-6 sm:px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitDisabled ? "bg-gray-400 text-white cursor-not-allowed" : "bg-[#208CD4] hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update Plant" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 max-w-[640px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1440px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Plants List</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <select
                  value={plantsPerPage}
                  onChange={handleShowChange}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                          <tr key={plant.plant_id || `plant-${index}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.plant_name}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {plant.location_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.contact_person}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{plant.contact_phone}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              <div className="flex space-x-2 flex-wrap gap-y-2">
                                <button
                                  onClick={() => handleEditPlant(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleApplyMotor(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
                                >
                                  Apply Motor
                                </button>
                                <button
                                  onClick={() => handleApplySensor(plant)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
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
                      <div key={plant.plant_id || `plant-${index}`} className="border border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">#{startIndex + index + 1}</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Name:</span> {plant.plant_name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Location:</span> {plant.location_name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Contact:</span> {plant.contact_person}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Phone:</span> {plant.contact_phone}
                        </p>
                        <div className="flex space-x-2 mt-2 flex-wrap gap-y-2">
                          <button
                            onClick={() => handleEditPlant(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleApplyMotor(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
                          >
                            Apply Motor
                          </button>
                          <button
                            onClick={() => handleApplySensor(plant)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 no-underline"
                          >
                            Apply Sensor
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md w-full sm:w-auto ${
                        currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex flex-wrap justify-center space-x-1">{renderPagination()}</div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md w-full sm:w-auto ${
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


// kjsfjkhskjdfhsjkdfhkjsdhf
