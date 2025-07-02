import React, { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";

function AddSensorAndMotor() {
  // State for Sensor Type
  const [sensorTypeForm, setSensorTypeForm] = useState({
    sensorTypeName: "",
  });
  const [sensorTypes, setSensorTypes] = useState([]);
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [submitTypeError, setSubmitTypeError] = useState("");
  const [submitTypeSuccess, setSubmitTypeSuccess] = useState(false);
  const [hasSensorType, setHasSensorType] = useState(false);

  // State for Sensor
  const [sensorForm, setSensorForm] = useState({
    sensorName: "",
    sensorType: "",
    deviceType: "sensor",
    onTime: "", // New field for valve on time
    offTime: "", // New field for valve off time
  });
  const [sensors, setSensors] = useState([]);
  const [isSubmittingSensor, setIsSubmittingSensor] = useState(false);
  const [submitSensorError, setSubmitSensorError] = useState("");
  const [submitSensorSuccess, setSubmitSensorSuccess] = useState(false);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);
  const [sensorsError, setSensorsError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sensorsPerPage, setSensorsPerPage] = useState(10);
  const [editingSensorId, setEditingSensorId] = useState(null);
  const sensorNameInputRef = useRef(null);

  // Helper function for API calls
  const apiCall = async (url, options = {}) => {
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP ${response.status}`
      );
    }

    return response.json();
  };

  // Auto-dismiss timers
  useEffect(() => {
    if (submitTypeSuccess) {
      const timer = setTimeout(() => setSubmitTypeSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitTypeSuccess]);

  useEffect(() => {
    if (submitTypeError) {
      const timer = setTimeout(() => setSubmitTypeError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [submitTypeError]);

  useEffect(() => {
    if (submitSensorSuccess) {
      const timer = setTimeout(() => setSubmitSensorSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSensorSuccess]);

  useEffect(() => {
    if (submitSensorError) {
      const timer = setTimeout(() => setSubmitSensorError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [submitSensorError]);

  // Focus sensor name input when editing
  useEffect(() => {
    if (editingSensorId && sensorNameInputRef.current) {
      sensorNameInputRef.current.focus();
    }
  }, [editingSensorId]);

  // Fetch sensors and sensor types on mount
  useEffect(() => {
    fetchSensors();
    fetchSensorTypes();
  }, []);

  const fetchSensorTypes = async () => {
    try {
      const data = await apiCall(
        "https://water-pump.onrender.com/api/sensors/sensor-types"
      );
      console.log("Fetched sensor types:", data);
      setSensorTypes(data);
      setHasSensorType(data.length > 0);
    } catch (error) {
      console.error("Error fetching sensor types:", error);
      setHasSensorType(false);
    }
  };

  const fetchSensors = async () => {
    try {
      setIsLoadingSensors(true);
      setSensorsError("");
      const data = await apiCall(
        "https://water-pump.onrender.com/api/sensors/relations"
      );
      setSensors(data);
    } catch (error) {
      setSensorsError("Failed to load sensors. Please refresh the page.");
    } finally {
      setIsLoadingSensors(false);
    }
  };

  const handleSensorTypeChange = (e) => {
    setSensorTypeForm({ sensorTypeName: e.target.value });
    if (submitTypeError) setSubmitTypeError("");
    if (submitTypeSuccess) setSubmitTypeSuccess(false);
  };

  const handleSensorTypeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingType(true);
    setSubmitTypeError("");
    setSubmitTypeSuccess(false);

    try {
      if (!sensorTypeForm.sensorTypeName.trim()) {
        throw new Error("Sensor type name is required");
      }

      const response = await apiCall(
        "https://water-pump.onrender.com/api/sensors/types",
        {
          method: "POST",
          body: JSON.stringify({
            sensor_type_name: sensorTypeForm.sensorTypeName.trim(),
          }),
        }
      );

      const createdSensorTypeId = response.id || response.sensor_type_id;
      console.log("Created sensor type with ID:", createdSensorTypeId);

      setSubmitTypeSuccess(true);
      setSensorTypeForm({ sensorTypeName: "" });
      await fetchSensorTypes();
    } catch (error) {
      setSubmitTypeError(
        error.message || "Failed to add sensor type. Please try again."
      );
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleSensorChange = (e) => {
    const { name, value } = e.target;
    setSensorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (submitSensorError) setSubmitSensorError("");
    if (submitSensorSuccess) setSubmitSensorSuccess(false);
  };

  const createSensorRelation = async (sensorId, sensorTypeId) => {
    try {
      const relationData = {
        sensor_id: sensorId,
        sensor_type_id: sensorTypeId,
      };

      console.log("Creating sensor relation with data:", relationData);

      const response = await apiCall(
        "https://water-pump.onrender.com/api/sensors/relation",
        {
          method: "POST",
          body: JSON.stringify(relationData),
        }
      );

      console.log("Sensor relation created successfully:", response);
      return response;
    } catch (error) {
      console.error("Error creating sensor relation:", error);
      throw error;
    }
  };

  const handleSensorSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSensor(true);
    setSubmitSensorError("");
    setSubmitSensorSuccess(false);

    try {
      if (!sensorForm.sensorName.trim())
        throw new Error("Sensor name is required");
      if (!sensorForm.sensorType.trim())
        throw new Error("Sensor type is required");
      if (!sensorForm.deviceType)
        throw new Error("Device type is required");
      if (sensorForm.deviceType === "valve") {
        if (!sensorForm.onTime || isNaN(sensorForm.onTime) || sensorForm.onTime <= 0)
          throw new Error("On time must be a positive number");
        if (!sensorForm.offTime || isNaN(sensorForm.offTime) || sensorForm.offTime <= 0)
          throw new Error("Off time must be a positive number");
      }

      const selectedSensorType = sensorTypes.find(
        (type) => type.sensor_type_name === sensorForm.sensorType.trim()
      );

      if (!selectedSensorType) {
        throw new Error("Selected sensor type not found");
      }

      const sensorTypeId =
        selectedSensorType.id || selectedSensorType.sensor_type_id;

      if (!sensorTypeId) {
        throw new Error("Sensor type ID not found");
      }

      if (editingSensorId) {
        const editSensorData = {
          sensor_name: sensorForm.sensorName.trim(),
          sensor_type_id: sensorTypeId,
          device_type: sensorForm.deviceType,
          on_time: sensorForm.deviceType === "valve" ? Number(sensorForm.onTime) : null,
          off_time: sensorForm.deviceType === "valve" ? Number(sensorForm.offTime) : null,
        };

        try {
          console.log("Editing sensor with ID:", editingSensorId);

          const response = await apiCall(
            `https://water-pump.onrender.com/api/sensors/${editingSensorId}`,
            {
              method: "PUT",
              body: JSON.stringify(editSensorData),
            }
          );

          console.log("Sensor updated successfully:", response);

          setSubmitSensorSuccess(true);
          setSensorForm({ sensorName: "", sensorType: "", deviceType: "sensor", onTime: "", offTime: "" });
          setEditingSensorId(null);
          await fetchSensors();
        } catch (error) {
          console.error("Error updating sensor:", error);
          setSubmitSensorError(
            error.message || "Failed to update sensor. Please try again."
          );
        }
      } else {
        const sensorData = {
          sensor_name: sensorForm.sensorName.trim(),
          sensor_type_name: sensorForm.sensorType.trim(),
          device_type: sensorForm.deviceType,
          on_time: sensorForm.deviceType === "valve" ? Number(sensorForm.onTime) : null,
          off_time: sensorForm.deviceType === "valve" ? Number(sensorForm.offTime) : null,
        };

        console.log("Creating sensor with data:", sensorData);
        const sensorResponse = await apiCall(
          "https://water-pump.onrender.com/api/sensors",
          {
            method: "POST",
            body: JSON.stringify(sensorData),
          }
        );

        const createdSensorId =
          sensorResponse.id ||
          sensorResponse.sensor_id ||
          sensorResponse.data?.id ||
          sensorResponse.data?.sensor_id;

        console.log("Created sensor with ID:", createdSensorId);
        console.log("Full sensor response:", sensorResponse);

        if (!createdSensorId) {
          throw new Error("Sensor created but ID not found in response");
        }

        try {
          await createSensorRelation(createdSensorId, sensorTypeId);
          console.log("Sensor and relation created successfully");
        } catch (relationError) {
          console.error("Sensor created but relation failed:", relationError);
          setSubmitSensorError(
            `Sensor created successfully, but there was an issue linking it to the sensor type: ${relationError.message}`
          );
        }

        setSubmitSensorSuccess(true);
        setSensorForm({ sensorName: "", sensorType: "", deviceType: "sensor", onTime: "", offTime: "" });
        await fetchSensors();
      }
    } catch (error) {
      console.error("Error in sensor submission:", error);
      setSubmitSensorError(
        error.message ||
          "Failed to add sensor. Please check your input and try again."
      );
    } finally {
      setIsSubmittingSensor(false);
    }
  };

  const editSensor = (sensor) => {
    console.log(sensor);
    setSensorForm({
      sensorName: sensor.sensor_name || "",
      sensorType: sensor.sensor_type_name || "",
      deviceType: sensor.device_type || "sensor",
      onTime: sensor.on_time || "",
      offTime: sensor.off_time || "",
    });
    setEditingSensorId(sensor.sensor_id);

    window.scrollTo({
      top: document.querySelector(".p-4.lg\\:p-6").offsetTop,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setSensorForm({ sensorName: "", sensorType: "", deviceType: "sensor", onTime: "", offTime: "" });
    setEditingSensorId(null);
    if (sensorNameInputRef.current) {
      sensorNameInputRef.current.blur();
    }
  };

  // Filter and paginate sensors
  const filteredSensors = sensors.filter(
    (sensor) =>
      sensor.sensor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.sensor_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.device_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSensors.length / sensorsPerPage);
  const startIndex = (currentPage - 1) * sensorsPerPage;
  const paginatedSensors = filteredSensors.slice(
    startIndex,
    startIndex + sensorsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleShowChange = (e) => {
    setSensorsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Sensor Type Section */}
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              {editingSensorId ? "Edit Sensor/Valve" : "Add Sensor/Valve"}
            </p>
            <div className="flex bg-gray-100 w-[148px] py-1 px-2 rounded-sm mb-[18px] items-center">
              <p>Home</p>
              <ChevronRight className="w-[20px] h-[20px] text-gray-500" />
              <p className="text-[#208CD4]">
                {editingSensorId ? "Edit Sensor/Valve" : "Add Sensor/Valve"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Add Sensor Type
              </h1>

              {submitTypeSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-green-800">
                      <p className="text-sm font-medium">
                        Sensor type added successfully!
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitTypeSuccess(false)}
                      className="text-green-600 hover:text-green-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {submitTypeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-sm font-medium">{submitTypeError}</p>
                    </div>
                    <button
                      onClick={() => setSubmitTypeError("")}
                      className="text-red-600 hover:text-red-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="sensorTypeName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sensor Type Name
                    </label>
                    <input
                      type="text"
                      id="sensorTypeName"
                      name="sensorTypeName"
                      value={sensorTypeForm.sensorTypeName}
                      onChange={handleSensorTypeChange}
                      placeholder="Enter Sensor Type Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSensorTypeSubmit}
                    disabled={isSubmittingType}
                    className={`font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSubmittingType
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#208CD4] hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isSubmittingType ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Section */}
      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Sensor/Valve
              </h1>

              {submitSensorSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-green-800">
                      <p className="text-sm font-medium">
                        {editingSensorId
                          ? "Sensor/Valve updated successfully!"
                          : "Sensor/Valve added successfully!"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitSensorSuccess(false)}
                      className="text-green-600 hover:text-green-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {submitSensorError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="text-red-800">
                      <p className="text-sm font-medium">{submitSensorError}</p>
                    </div>
                    <button
                      onClick={() => setSubmitSensorError("")}
                      className="text-red-600 hover:text-red-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="sensorName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sensor/Valve Name
                    </label>
                    <input
                      type="text"
                      id="sensorName"
                      name="sensorName"
                      value={sensorForm.sensorName}
                      onChange={handleSensorChange}
                      placeholder="Name of Sensor/Valve"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                      ref={sensorNameInputRef}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sensorType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sensor Type
                    </label>
                    <select
                      id="sensorType"
                      name="sensorType"
                      value={sensorForm.sensorType}
                      onChange={handleSensorChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={!hasSensorType}
                    >
                      <option value="">Select Sensor Type</option>
                      {sensorTypes.map((type, index) => (
                        <option
                          key={type.id || type.sensor_type_id || `type-${index}`}
                          value={type.sensor_type_name}
                        >
                          {type.sensor_type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="deviceType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Device Type
                    </label>
                    <select
                      id="deviceType"
                      name="deviceType"
                      value={sensorForm.deviceType}
                      onChange={handleSensorChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="sensor">Sensor</option>
                      <option value="valve">Valve</option>
                    </select>
                  </div>

                  {sensorForm.deviceType === "valve" && (
                    <>
                      <div>
                        <label
                          htmlFor="onTime"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          On Time (seconds)
                        </label>
                        <input
                          type="number"
                          id="onTime"
                          name="onTime"
                          value={sensorForm.onTime}
                          onChange={handleSensorChange}
                          placeholder="Enter On Time"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="offTime"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Off Time (seconds)
                        </label>
                        <input
                          type="number"
                          id="offTime"
                          name="offTime"
                          value={sensorForm.offTime}
                          onChange={handleSensorChange}
                          placeholder="Enter Off Time"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  {editingSensorId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="font-medium py-3 px-8 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSensorSubmit}
                    disabled={isSubmittingSensor || !hasSensorType}
                    className={`font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSubmittingSensor || !hasSensorType
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#208CD4] hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isSubmittingSensor
                      ? "Saving..."
                      : editingSensorId
                      ? "Update Sensor/Valve"
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensors Table Section */}
      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Sensors/Valves List
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sensors/valves..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <select
                  value={sensorsPerPage}
                  onChange={handleShowChange}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={1}>Show 1</option>
                  <option value={10}>Show 10</option>
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
                </select>
              </div>
            </div>

            {sensorsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div className="text-red-800">
                    <p className="text-sm font-medium">{sensorsError}</p>
                  </div>
                  <button
                    onClick={fetchSensors}
                    className="text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {isLoadingSensors ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading sensors/valves...</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          S/No
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Name
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Sensor Type
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Device Type
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          On Time
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Off Time
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedSensors.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                          >
                            {searchQuery
                              ? "No sensors/valves found matching your search."
                              : "No sensors/valves added yet."}
                          </td>
                        </tr>
                      ) : (
                        paginatedSensors.map((sensor, index) => (
                          <tr
                            key={sensor.id || sensor.sensor_id || `sensor-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {startIndex + index + 1}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {sensor.sensor_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {sensor.sensor_type_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {sensor.device_type}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {sensor.on_time ? `${sensor.on_time} sec` : '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {sensor.off_time ? `${sensor.off_time} sec` : '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              <button
                                onClick={() => editSensor(sensor)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedSensors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No sensors/valves found matching your search."
                        : "No sensors/valves added yet."}
                    </div>
                  ) : (
                    paginatedSensors.map((sensor, index) => (
                      <div
                        key={sensor.id || sensor.sensor_id || `sensor-${index}`}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                              #{startIndex + index + 1}
                            </span>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {sensor.sensor_name}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editSensor(sensor)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">
                              Sensor Type:
                            </span>
                            <span className="text-gray-900">
                              {sensor.sensor_type_name}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">
                              Device Type:
                            </span>
                            <span className="text-gray-900">
                              {sensor.device_type}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">
                              On Time:
                            </span>
                            <span className="text-gray-900">
                              {sensor.on_time ? `${sensor.on_time} sec` : '-'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-medium">
                              Off Time:
                            </span>
                            <span className="text-gray-900">
                              {sensor.off_time ? `${sensor.off_time} sec` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded ${
                        currentPage === totalPages
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
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
    </div>
  );
}

export default AddSensorAndMotor;