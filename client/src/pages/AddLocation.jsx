import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, X } from "lucide-react";

function AddLocation() {
  const [formData, setFormData] = useState({
    locationName: "",
    city: "",
    address: "",
    zipcode: "",
    country: "",
    state: "",
    contact: "",
    phoneNumber: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationsPerPage, setLocationsPerPage] = useState(10);
  const locationNameInputRef = useRef(null);

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
    if (editingLocationId && locationNameInputRef.current) {
      locationNameInputRef.current.focus();
    }
  }, [editingLocationId]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      setLocationsError("");
      const response = await fetch("https://water-pump.onrender.com/api/locations");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched locations:", data);
      const sortedLocations = data.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return (b.id || 0) - (a.id || 0);
      });
      setLocations(sortedLocations);
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

  const handleEditLocation = (location) => {
    console.log(location);
    setFormData({
      locationName: location.location_name || "",
      city: location.city || "",
      address: location.address || "",
      zipcode: location.zipcode || "",
      country: location.country || "",
      state: location.state || "",
      contact: location.contact || "",
      phoneNumber: location.phone_number ? location.phone_number.toString() : "",
    });
    setIsEditing(true);
    setEditingLocationId(location.location_id);
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleCancelEdit = () => {
    setFormData({
      locationName: "",
      city: "",
      address: "",
      zipcode: "",
      country: "",
      state: "",
      contact: "",
      phoneNumber: "",
    });
    setIsEditing(false);
    setEditingLocationId(null);
    if (locationNameInputRef.current) {
      locationNameInputRef.current.blur();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      if (!formData.locationName.trim()) throw new Error("Location name is required");
      if (!formData.city.trim()) throw new Error("City is required");
      if (!formData.address.trim()) throw new Error("Address is required");
      if (!formData.zipcode.trim()) throw new Error("ZIP code is required");
      if (!formData.country.trim()) throw new Error("Country is required");
      if (!formData.state.trim()) throw new Error("State is required");
      if (!formData.contact.trim()) throw new Error("Contact person is required");
      if (!formData.phoneNumber.trim()) throw new Error("Phone number is required");

      const locationData = {
        location_name: formData.locationName.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        zipcode: formData.zipcode.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        contact: formData.contact.trim(),
        phone_number: formData.phoneNumber.trim(),
        geo_latitude: 0,
        geo_longitude: 0,
      };

      if (isEditing) {
        const response = await fetch(`https://water-pump.onrender.com/api/locations/${editingLocationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(locationData),
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
        await fetchLocations();
        handleCancelEdit();
      } else {
        const response = await fetch("https://water-pump.onrender.com/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(locationData),
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
        await fetchLocations();
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error:", error);
      setSubmitError(error.message || `Failed to ${isEditing ? "update" : "add"} location. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLocations = locations.filter(
    (location) =>
      location.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.phone_number?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredLocations.length / locationsPerPage);
  const startIndex = (currentPage - 1) * locationsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + locationsPerPage);

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
    setLocationsPerPage(Number(e.target.value));
    setCurrentPage(1);
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
      <div className="p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px]">
        <div className="max-w-full bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
              {isEditing ? "Edit Location" : "Add New Location"}
            </h1>

            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-green-800">
                    {isEditing ? "Location updated successfully!" : "Location added successfully!"}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    id="locationName"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    placeholder="Enter location name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                    ref={locationNameInputRef}
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select Country</option>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                    <option value="uk">United Kingdom</option>
                    <option value="au">Australia</option>
                    <option value="de">Germany</option>
                    <option value="fr">France</option>
                    <option value="in">India</option>
                    <option value="jp">Japan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select State</option>
                    <option value="al">Alabama</option>
                    <option value="ak">Alaska</option>
                    <option value="az">Arizona</option>
                    <option value="ar">Arkansas</option>
                    <option value="ca">California</option>
                    <option value="co">Colorado</option>
                    <option value="ct">Connecticut</option>
                    <option value="de">Delaware</option>
                    <option value="fl">Florida</option>
                    <option value="ga">Georgia</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    id="zipcode"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    placeholder="Enter ZIP code"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none placeholder-gray-400"
                    placeholder="Enter full address"
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
                  disabled={isSubmitting}
                  className={`font-medium py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-[#208CD4] hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update Location" : "Save Changes"}
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
              <h2 className="text-2xl font-semibold text-gray-900">Locations List</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <select
                  value={locationsPerPage}
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

            {locationsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-red-800">{locationsError}</p>
                  <button
                    onClick={fetchLocations}
                    className="text-sm underline hover:no-underline text-red-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {isLoadingLocations ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading locations...</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">S/No</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Location Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Address</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">City</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Contact Person</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Phone Number</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedLocations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            {searchQuery ? "No locations found matching your search." : "No locations added yet."}
                          </td>
                        </tr>
                      ) : (
                        paginatedLocations.map((location, index) => (
                          <tr key={location.id || `location-${index}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{location.location_name}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{location.address}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{location.city}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{location.contact}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{location.phone_number}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditLocation(location)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Edit
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
                  {paginatedLocations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? "No locations found matching your search." : "No locations added yet."}
                    </p>
                  ) : (
                    paginatedLocations.map((location, index) => (
                      <div key={location.id || `location-${index}`} className="border border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">#{startIndex + index + 1}</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Name:</span> {location.location_name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Address:</span> {location.address}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">City:</span> {location.city}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Contact:</span> {location.contact}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Phone:</span> {location.phone_number}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleEditLocation(location)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Edit
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
    </div>
  );
}

export default AddLocation;