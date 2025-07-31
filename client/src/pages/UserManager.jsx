import React, { useState, useMemo, useEffect, useContext } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCalendarDays,
  faPhone,
  faEnvelope,
  faHouse,
  faLocation,
  faBuilding,
  faIndustry,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import add from "../images/add.png";
import component_11 from "../images/Component 11.png";
import component_13 from "../images/Component 13.png";
import AddUserModal from "../components/AddUserModal";
import UploadComponent from "../components/UploadComponent";
import UserConfirmation from "../components/UserConfirmation";
import inactive from "../images/inactive.svg";
import active from "../images/active.svg";
import edit from "../images/edit.svg";
import delet from "../images/delete.svg";
import link from "../images/link.svg";
import password from "../images/password.svg";
import user from "../images/user.svg";
import users from "../images/users.svg";

function UserManager() {
  const { user, isCheckingSession } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPageOptions = [8, 12, 16];
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState("activate");
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

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
      const response = await axios.get(
        "https://water-pump.onrender.com/api/UserPlantAccess/",
        { withCredentials: true }
      );
      console.log("UserPlantAccess Response:", response.data);

      const mappedData = response.data.map((user) => ({
        companyName: user.company || "N/A",
        full_name: user.full_name || "N/A",
        username: user.username || "N/A",
        role: user.role_name || "N/A",
        designation: user.designation || "N/A",
        dob: user.date_of_birth ? formatDisplayDate(user.date_of_birth) : "N/A",
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
        status: user.status,
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
  }, [location]);

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

  const handleOpenResetPassword = (user) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
    setMessage("");
  };

  const handleCloseResetPassword = () => {
    setIsResetPasswordOpen(false);
    setSelectedUser(null);
    setNewPassword("");
    setMessage("");
  };

  const handleConfirm = (userId, newStatus) => {
    setApiData((prevData) =>
      prevData.map((u) =>
        u.user_id === userId ? { ...u, status: newStatus } : u
      )
    );
    setTimeout(() => fetchUsers(), 500);
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

  const handleUserUpdate = (updatedUser) => {
    if (modalMode === "edit" && updatedUser) {
      setApiData((prevData) =>
        prevData.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );
    } else {
      fetchUsers();
    }
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

  const shouldShowResetIcon = (cardRole) => {
    console.log("Current user:", user);
    console.log("Checking reset icon for role:", cardRole);
    if (!user || !user.role) {
      console.log("No user or role, hiding reset icon");
      return false;
    }
    const currentRole = user.role.toLowerCase();
    const allowedRolesForSuperAdmin = ["admin", "normal", "regular"];
    const allowedRolesForAdmin = ["normal", "regular"];

    if (currentRole === "super admin") {
      return allowedRolesForSuperAdmin.includes(cardRole.toLowerCase());
    } else if (currentRole === "admin") {
      return allowedRolesForAdmin.includes(cardRole.toLowerCase());
    }
    console.log("User role not Super Admin or Admin, hiding reset icon");
    return false;
  };

  const handleResetPasswordConfirm = async () => {
    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }
    try {
      const response = await axios.post(
        "https://water-pump.onrender.com/api/users/reset-password",
        {
          target_user_id: selectedUser.user_id,
          new_password: newPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      setMessage("Password reset successful.");
      console.log(
        `Password reset successful for ${selectedUser?.full_name}:`,
        response.data
      );
      setTimeout(() => {
        setIsResetPasswordOpen(false);
        setSelectedUser(null);
        setNewPassword("");
        setMessage("");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setMessage(errorMessage);
      console.error(
        "Password reset failed:",
        err.response?.data || err.message
      );
    }
  };

  if (isCheckingSession || loading) {
    return (
      <div className="max-w-full mx-auto text-[#6B6B6B] my-4 sm:my-6 px-4 sm:px-6 lg:max-w-[1680px] lg:px-11">
        <div className="font-medium text-sm sm:text-base lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-bold text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-5">
              User Manager
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 text-center">
          <p className="text-sm sm:text-base text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full mx-auto text-[#6B6B6B] my-4 sm:my-6 px-4 sm:px-6 lg:max-w-[1680px] lg:px-11">
        <div className="font-medium text-sm sm:text-base lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-bold text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-5">
              User Manager
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 text-center text-red-500">
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-full mx-auto text-[#6B6B6B] my-4 sm:my-6 px-4 sm:px-6 lg:max-w-[1680px] lg:px-11">
        <div className="font-medium text-sm sm:text-base flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4">
          <div>
            <p className="text-[#4E4D4D] font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">
              User Manager
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:h-10 lg:h-12">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full sm:w-[287.4px] px-2 py-1.5 sm:px-3 sm:py-2 border border-[#DADADA] rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleOpenAddModal}
              className="bg-[#208CD4] flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-sm hover:bg-[#1b7bb9] transition-colors"
            >
              <img src={add} alt="Add User" className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <p className="font-normal text-xs sm:text-sm text-white">Add User</p>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl lg:mt-5">
          <div className="columns-1 sm:columns-2 lg:columns-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl">
            {paginatedData.map((card, cardIndex) => (
              <div
                className="card-div font-normal text-xs sm:text-sm border border-[#DADADA] rounded-lg px-3 sm:px-4 py-4 sm:py-6 mb-3 sm:mb-4 break-inside-avoid"
                key={`${card.user_id}-${card.status}`}
              >
                <div className="flex flex-col w-full border-b border-[#208CD4] pb-3 sm:pb-4">
                  <div className="flex flex-col">
                    <p className="text-[#4E4D4D] font-semibold text-sm sm:text-base break-words max-w-[90%]">
                      {card.full_name}
                    </p>
                    <p className="text-[#aba6a6] font-medium text-xs">
                      {card.role}
                    </p>
                  </div>
                  <div className="flex items-center w-full gap-2 sm:gap-3 mt-2">
                    <div className="flex-1 flex justify-center border border-blue-300 rounded">
                      <img
                        src={link}
                        alt="Upload"
                        className="w-8 h-7 sm:w-9 sm:h-8 p-1.5 sm:p-2"
                        onClick={handleOpenUpload}
                      />
                    </div>
                    <div className="flex-1 flex justify-center border border-blue-300 rounded">
                      <img
                        src={edit}
                        alt="Edit"
                        className="w-8 h-7 sm:w-9 sm:h-8 p-1.5 sm:p-2"
                        onClick={() => handleOpenEditModal(card)}
                      />
                    </div>
                    {card.user_id !== user?.user_id &&
                      ((user.role.toLowerCase() === "super admin") ||
                        (user.role.toLowerCase() === "admin" &&
                          !["super admin", "admin"].includes(
                            card.role.toLowerCase()
                          ))) && (
                        <div className="flex-1 flex justify-center border border-blue-300 rounded">
                          <img
                            src={card?.status === "Active" ? active : inactive}
                            alt={card?.status === "Active" ? "Active" : "Inactive"}
                            className="w-8 h-7 sm:w-9 sm:h-8 p-1.5 sm:p-2"
                            style={{
                              color: card?.status === "Active" ? "#22C55E" : "#EF4444",
                            }}
                            onClick={() =>
                              handleOpen(
                                card,
                                card.status === "Active" ? "Inactive" : "Active"
                              )
                            }
                          />
                        </div>
                      )}
                    {shouldShowResetIcon(card.role) && (
                      <div className="flex-1 flex justify-center border border-blue-300 rounded">
                        <img
                          src={password}
                          alt="Reset Password"
                          className="w-8 h-7 sm:w-9 sm:h-8 p-1.5 sm:p-2"
                          style={{ color: "#F59E0B" }}
                          onClick={() => handleOpenResetPassword(card)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
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
                        className="flex items-center gap-0.5 py-2 sm:py-2.5 min-h-[32px] sm:min-h-[40px] border-b border-[#DADADA]"
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="text-blue-400 text-lg sm:text-xl"
                        />
                        <p className="break-words max-w-[90%] text-xs sm:text-sm">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div>
                    {[
                      { icon: faCalendarDays, value: `DOJ: ${card.displayDoj}` },
                      { icon: faBuilding, value: card.company },
                      {
                        icon: faIndustry,
                        value: `Assigned Plant: ${card.assignedPlant}`,
                      },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-2 sm:py-2.5 min-h-[32px] sm:min-h-[40px] border-b border-[#DADADA]"
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="text-blue-400 text-lg sm:text-xl"
                        />
                        <p className="break-words max-w-[90%] text-xs sm:text-sm">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 mt-3 sm:mt-4 pb-3 sm:pb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#208CD4] text-white rounded text-xs sm:text-sm disabled:bg-gray-300 hover:bg-[#1b7bb9] transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm ${
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
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#208CD4] text-white rounded text-xs sm:text-sm disabled:bg-gray-300 hover:bg-[#1b7bb9] transition-colors"
            >
              Next
            </button>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 border border-[#DADADA] rounded bg-gray-100 text-[#6B6B6B] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#208CD4] hover:bg-gray-200 transition-colors"
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
      {isResetPasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[400px]">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Reset Password</h2>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              Reset password for {selectedUser?.full_name} (
              {selectedUser?.username})
            </p>
            <div className="mb-3 sm:mb-4">
              <label
                htmlFor="newPassword"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#208CD4]"
              />
            </div>
            {message && (
              <p
                className={`mb-3 sm:mb-4 text-xs sm:text-sm ${
                  message.includes("success")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseResetPassword}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded text-xs sm:text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPasswordConfirm}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#208CD4] text-white rounded text-xs sm:text-sm hover:bg-[#1b7bb9] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManager;