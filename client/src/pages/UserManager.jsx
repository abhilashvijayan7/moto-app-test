import React, { useState, useMemo } from "react";
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
  const itemsPerPageOptions = [4, 8, 12, 16];

  const handleOpenUpload = () => {
    setIsUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
  };

  const mockedCardData = [
    {
      companyName: "KRP Aqua Tech 1",
      role: "Admin",
      dob: "22-06-2025",
      call: "123-456-7890",
      doj: "22-06-2025",
      mail: "admin1@krp.com",
      gender: "Male",
      home: "123 Main St",
      company: "KRP Aqua Tech",
      location: "City A",
      assignedPlant: "Plant F6 , Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ",
    },
    {
      companyName: "Aqua Solutions 2",
      role: "Editor",
      dob: "23-06-2025",
      call: "234-567-8901",
      doj: "23-06-2025",
      mail: "editor1@aqua2.com",
      gender: "Female",
      home: "456 Elm St",
      company: "Aqua Solutions",
      location: "City B",
      assignedPlant: "Plant B2",
    },
    {
      companyName: "Water Tech 3",
      role: "Viewer",
      dob: "24-06-2025",
      call: "345-678-9012",
      doj: "24-06-2025",
      mail: "viewer1@watertech.com",
      gender: "Male",
      home: "789 Oak St",
      company: "Water Tech",
      location: "City C",
      assignedPlant: " Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 , Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6",
    },
    {
      companyName: "Hydro Dynamics 4",
      role: "Manager",
      dob: "25-06-2025",
      call: "456-789-0123",
      doj: "25-06-2025",
      mail: "manager1@hydro.com",
      gender: "Female",
      home: "101 Pine St",
      company: "Hydro Dynamics",
      location: "City D",
      assignedPlant: "Plant D4",
    },
    {
      companyName: "Pure Flow 5",
      role: "Admin",
      dob: "26-06-2025",
      call: "567-890-1234",
      doj: "26-06-2025",
      mail: "admin2@pureflow.com",
      gender: "Male",
      home: "202 Birch St",
      company: "Pure Flow",
      location: "City E",
      assignedPlant: "Plant E5",
    },
    {
      companyName: "Aqua Innovations 6",
      role: "Editor",
      dob: "27-06-2025",
      call: "678-901-2345",
      doj: "27-06-2025",
      mail: "editor1@aquainno.com",
      gender: "Female",
      home: "303 Cedar St",
      company: "Aqua Innovations",
      location: "City F",
      assignedPlant: "Plant F6 , Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,Plant F6 ,",
    },
  ];

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
    return mockedCardData.filter((card) =>
      Object.values(card).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

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
                        <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
                        <p className="break-words max-w-[90%]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    {[
                      { icon: calendar_month, value: `DOB: ${card.dob}` },
                      { icon: calendar_month_1, value: `DOJ: ${card.doj}` },
                      { icon: sentiment_satisfied, value: card.gender },
                      { icon: humidity_low, value: card.company },
                      { icon: encrypted, value: `Assigned Plant: ${card.assignedPlant}` },
                    ].map((item, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-center gap-0.5 py-[8px] min-h-[40px] border-b border-[#DADADA]"
                      >
                        <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
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
                  currentPage === page ? "bg-[#208CD4] text-white" : "bg-gray-100 hover:bg-gray-200"
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
      />
      <UploadComponent isOpen={isUploadOpen} onClose={handleCloseUpload} />
    </div>
  );
}

export default UserManager;

// perfect of the perfect