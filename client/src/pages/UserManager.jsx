import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import add from "../images/add.png";
import component_11 from "../images/Component 11.png";
import component_13 from "../images/Component 13.png";
import group from "../images/group.png";
import calendar_month from "../images/calendar_month.png";
import call from "../images/call.png";
import calendar_month_1 from "../images/calendar_month (1).png";
import mail from "../images/mail.png";
import sentiment_satisfied from "../images/sentiment_satisfied.png";
import home from "../images/home.png";
import humidity_low from "../images/humidity_low.png";
import location_on from "../images/location_on.png";
import encrypted from "../images/encrypted.png";
import AddUserModal from "../components/AddUserModal";
import UploadComponent from "../components/UploadComponent";

function UserManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPageOptions = [8, 12, 16];

  // Format date to DD/MM/YYYY
  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.log(`Invalid date for display:`, dateStr); // Debug: Log invalid date
      return "N/A";
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("https://water-pump.onrender.com/api/UserPlantAccess");
        console.log("Raw UserPlantAccess response:", response.data); // Debug: Log raw response

        // Fetch additional user details from /api/users/{id}
        const users = await Promise.all(
          response.data.map(async (user) => {
            try {
              const userDetails = await axios.get(`https://water-pump.onrender.com/api/users/${user.user_id}`);
              console.log(`User details for ${user.user_id}:`, userDetails.data); // Debug: Log user details
              return { ...user, date_of_joining: userDetails.data.date_of_joining };
            } catch (err) {
              console.error(`Error fetching details for user ${user.user_id}:`, err.response?.data || err.message);
              return { ...user, date_of_joining: null };
            }
          })
        );

        // Map API response to match the current data structure
        const mappedData = users.map((user) => ({
          companyName: user.full_name || user.username || "N/A",
          role: user.designation || "N/A",
          dob: user.date_of_birth
            ? formatDisplayDate(user.date_of_birth)
            : "N/A",
          call: user.contact_number || "N/A",
          doj: user.date_of_joining || "N/A", // Pass raw date_of_joining for AddUserModal
          displayDoj: formatDisplayDate(user.date_of_joining), // Formatted for UI
          mail: user.email || "N/A",
          gender: user.gender || "N/A",
          home: user.address || "N/A",
          company: user.company || "N/A",
          location: user.location || "N/A",
          assignedPlant:
            user.plants && user.plants.length > 0
              ? user.plants.map((plant) => plant.plant_name).join(", ")
              : "No plants assigned",
          user_id: user.user_id, // Add user_id for PUT request
        }));

        setApiData(mappedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err.response?.data || err.message);
        setError("Failed to fetch users. Please try again.");
        setApiData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleOpenUpload = () => {
    setIsUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode("add");
    setSelectedUser(null);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return apiData.filter((card) =>
      Object.values(card).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [apiData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              User Manager
            </p>
          </div>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              User Manager
            </p>
          </div>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1680px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              User Manager
            </p>
          </div>

          <div className="flex gap-2 mb-[24px] lg:h-12">
            <input
              type="text"
              placeholder="Search users..."
              className="border border-[#DADADA] rounded px-2 py-1 w-[287.4px] lg:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleOpenAddModal}
              className="bg-[#208CD4] flex items-center gap-2 px-3 py-1 rounded-sm hover:bg-[#1b7bb9] transition-colors"
            >
              <img src={add} alt="" className="w-[10px] h-[10px]" />
              <p className="font-[400] text-[12px] text-[#FFFFFF]">Add User</p>
            </button>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl">
          <div className="columns-1 lg:columns-4 gap-4 p-4 rounded-xl">
            {paginatedData.map((card, cardIndex) => (
              <div
                className="card-div font-[400] text-[14px] border border-[#DADADA] rounded-lg px-[16px] py-[24px] mb-4 break-inside-avoid"
                key={cardIndex}
              >
                <div className="flex justify-between border-b border-[#208CD4] pb-[16px]">
                  <div className="flex items-center gap-2">
                    <p className="text-[#4E4D4D] font-[600] text-[16px] break-words max-w-[200px]">
                      {card.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <img
                      src={component_11}
                      alt=""
                      className="w-[56px] h-[42px]"
                      onClick={handleOpenUpload}
                    />
                    <img
                      src={component_13}
                      alt="Edit"
                      className="w-[56px] h-[42px] cursor-pointer"
                      onClick={() => handleOpenEditModal(card)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-[16px]">
                  <div>
                    {[
                      { icon: group, value: card.role },
                      { icon: call, value: card.call },
                      { icon: mail, value: card.mail },
                      { icon: home, value: card.home },
                      { icon: location_on, value: card.location },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-[8px] min-h-[40px] border-b border-[#DADADA]"
                      >
                        <img
                          src={item.icon}
                          alt=""
                          className="w-[24px] h-[24px]"
                        />
                        <p className="break-words max-w-[90%]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    {[
                      { icon: calendar_month, value: `DOB: ${card.dob}` },
                      { icon: calendar_month_1, value: `DOJ: ${card.displayDoj}` },
                      { icon: sentiment_satisfied, value: card.gender },
                      { icon: humidity_low, value: card.company },
                      {
                        icon: encrypted,
                        value: `Assigned Plant: ${card.assignedPlant}`,
                      },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-[8px] min-h-[40px] border-b border-[#DADADA]"
                      >
                        <img
                          src={item.icon}
                          alt=""
                          className="w-[24px] h-[24px]"
                        />
                        <p className="break-words max-w-[90%]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-1 lg:col-span-4 flex justify-center items-center gap-2 mt-4 pb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#208CD4] text-white rounded disabled:bg-gray-300 hover:bg-[#1b7bb9] transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? "bg-[#208CD4] text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } transition-colors`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-[#208CD4] text-white rounded disabled:bg-gray-300 hover:bg-[#1b7bb9] transition-colors"
            >
              Next
            </button>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-3 py-1 border border-[#DADADA] rounded bg-gray-100 text-[#6B6B6B] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#208CD4] hover:bg-gray-200 transition-colors"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <AddUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        name={modalMode === "add" ? "Add New User" : "Edit User"}
        user={selectedUser}
        onSuccess={() => fetchUsers()} // Re-fetch users on success
      />
      <UploadComponent isOpen={isUploadOpen} onClose={handleCloseUpload} />
    </div>
  );
}

export default UserManager;

// eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee