import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarDays, faPhone, faEnvelope, faHouse, faLocation, faBuilding, faCalendar, faVenusMars, faIndustry, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import add from "../images/add.png";
import component_11 from "../images/Component 11.png";
import component_13 from "../images/Component 13.png";
import AddUserModal from "../components/AddUserModal";
import UploadComponent from "../components/UploadComponent";
import UserConfirmation from '../components/UserConfirmation';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState('activate');

  // Format date to DD/MM/YYYY
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://water-pump.onrender.com/api/UserPlantAccess");
      console.log("UserPlantAccess Response:", response.data);

      const mappedData = response.data.map((user) => ({
        companyName: user.company || "N/A",
        full_name: user.full_name || "N/A",
        username: user.username || "N/A",
        role: user.role_name || "N/A",
        designation: user.designation || "N/A",
        dob: user.date_of_birth
          ? formatDisplayDate(user.date_of_birth)
          : "N/A",
        call: user.contact_number || "N/A",
        doj: user.date_of_joining || "N/A",
        displayDoj: user.date_of_joining
          ? formatDisplayDate(user.date_of_joining)
          : "N/A",
        mail: user.email || "N/A",
        gender: user.gender || "N/A",
        home: user.address || "N/A",
        company: user.company || "N/A",
        location: user.location || "N/A",
        assignedPlant:
          user.plants && user.plants.length > 0
            ? user.plants.map((plant) => plant.plant_name).join(", ")
            : "No plants assigned",
        user_id: user.user_id,
        status: user.status
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

  useEffect(() => {
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

  const handleOpen = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    console.log(`${actionType} confirmed for`, selectedUser);
    setShowConfirm(false);
    fetchUsers();
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

  const handleUserUpdate = (updatedUser) => {
    if (modalMode === 'edit' && updatedUser) {
      setApiData(prevData =>
        prevData.map(user =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );
    } else {
      fetchUsers();
    }
  };

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
                  <div className="flex flex-col">
                    <p className="text-[#4E4D4D] font-[600] text-[16px] break-words max-w-[200px]">
                      {card.full_name}
                    </p>
                    <p className="text-[#aba6a6] font-[500] text-[12px]">
                      {card.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <img
                      src={component_11}
                      alt=""
                      className="w-[36px] h-[32px]"
                      onClick={handleOpenUpload}
                    />
                    <img
                      src={component_13}
                      alt="Edit"
                      className="w-[36px] h-[32px] cursor-pointer"
                      onClick={() => handleOpenEditModal(card)}
                    />
                    <FontAwesomeIcon
                      icon={card?.status === 'Active' ? faCircleCheck : faCircleXmark}
                      className={card?.status === 'Active' ? "text-green-500 text-xl" : "text-red-500 text-xl"}
                      onClick={() => handleOpen(card, card.status === 'Active' ? 'Inactive' : 'Active')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-[16px]">
                  <div>
                    {[
                      { icon: faUser, value: card.designation },
                      { icon: faPhone, value: card.call },
                      { icon: faEnvelope, value: card.mail },
                      { icon: faHouse, value: card.home },
                      { icon: faLocation, value: card.location },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-[8px] min-h-[40px] border-b border-[#DADADA]"
                      >
                        <FontAwesomeIcon icon={item.icon} className="text-blue-400 text-xl" />
                        <p className="break-words max-w-[90%]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    {[
                      { icon: faCalendarDays, value: `DOB: ${card.dob}` },
                      { icon: faCalendarDays, value: `DOJ: ${card.displayDoj}` },
                      { icon: faVenusMars, value: card.gender },
                      { icon: faBuilding, value: card.company },
                      {
                        icon: faIndustry,
                        value: `Assigned Plant: ${card.assignedPlant}`,
                      },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-[8px] min-h-[40px] border-b border-[#DADADA]"
                      >
                        <FontAwesomeIcon icon={item.icon} className="text-blue-400 text-xl" />
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
        onSuccess={handleUserUpdate}
      />
      <UploadComponent isOpen={isUploadOpen} onClose={handleCloseUpload} />
      <UserConfirmation
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        actionType={actionType}
        user={selectedUser}
        userName={selectedUser?.full_name}
      />
    </div>
  );
}

export default UserManager;


// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk