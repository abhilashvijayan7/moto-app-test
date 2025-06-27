import React, { useState } from "react";
import cheveron_right from "../images/cheveron-right.png";
import add from "../images/add.png";
import image from "../images/image.png";
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

import UploadComponent from '../components/UploadComponent';


function UserManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // Track modal mode: "add" or "edit"
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user for editing
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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
      dob: "22-06-2025 11:14:54",
      call: "123-456-7890",
      doj: "22-06-2025 11:14:54",
      mail: "admin1@krp.com",
      gender: "Male",
      home: "123 Main St",
      company: "KRP Aqua Tech",
      location: "City A",
      apiKey: "API12345",
    },
    {
      companyName: "Aqua Solutions 2",
      role: "Editor",
      dob: "23-06-2025 12:30:45",
      call: "234-567-8901",
      doj: "23-06-2025 12:30:45",
      mail: "editor1@aqua2.com",
      gender: "Female",
      home: "456 Elm St",
      company: "Aqua Solutions",
      location: "City B",
      apiKey: "API67890",
    },
    {
      companyName: "Water Tech 3",
      role: "Viewer",
      dob: "24-06-2025 09:45:22",
      call: "345-678-9012",
      doj: "24-06-2025 09:45:22",
      mail: "viewer1@watertech.com",
      gender: "Male",
      home: "789 Oak St",
      company: "Water Tech",
      location: "City C",
      apiKey: "API11223",
    },
    {
      companyName: "Hydro Dynamics 4",
      role: "Manager",
      dob: "25-06-2025 15:20:10",
      call: "456-789-0123",
      doj: "25-06-2025 15:20:10",
      mail: "manager1@hydro.com",
      gender: "Female",
      home: "101 Pine St",
      company: "Hydro Dynamics",
      location: "City D",
      apiKey: "API44556",
    },
    {
      companyName: "Pure Flow 5",
      role: "Admin",
      dob: "26-06-2025 08:55:33",
      call: "567-890-1234",
      doj: "26-06-2025 08:55:33",
      mail: "admin2@pureflow.com",
      gender: "Male",
      home: "202 Birch St",
      company: "Pure Flow",
      location: "City E",
      apiKey: "API77889",
    },
    {
      companyName: "Aqua Innovations 6",
      role: "Editor",
      dob: "27-06-2025 10:10:10",
      call: "678-901-2345",
      doj: "27-06-2025 10:10:10",
      mail: "editor1@aquainno.com",
      gender: "Female",
      home: "303 Cedar St",
      company: "Aqua Innovations",
      location: "City F",
      apiKey: "API99001",
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

  return (
    <div>
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1280px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              User Manager
            </p>
            <div className="flex bg-gray-100 w-[156px] py-1 px-2 rounded-sm mb-[18px]">
              <p>Home</p>
              <img src={cheveron_right} alt="" className="w-[20px] h-[20px]" />
              <p className="text-[#208CD4]">User Manager</p>
            </div>
          </div>

          <div className="flex gap-1 mb-[24px] lg:h-12">
            <input
              type="text"
              placeholder="Search"
              className="border border-[#DADADA] rounded px-2 py-1 w-[287.4px] lg:bg-[#FFFFFF80]"
            />
            <button
              onClick={handleOpenAddModal}
              className="bg-[#208CD4] flex items-center gap-2 px-3 rounded-sm"
            >
              <img src={add} alt="" className="w-[10px] h-[10px]" />
              <p className="font-[400] text-[12px] text-[#FFFFFF]">Add User</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-[#FFFFFF] p-4 rounded-xl">
          {mockedCardData.map((card, cardIndex) => (
            <div
              className="card-div font-[400] text-[14px] border-1 border-[#DADADA] rounded-lg px-[16px] py-[24px]"
              key={cardIndex}
            >
              <div className="flex justify-between border-b border-[#208CD4] pb-[16px]">
                <div className="flex items-center gap-2 ">
                  <img src={image} alt="" className="w-[42px] h-[42px]" />
                  <p className="text-[#4E4D4D] font-[700] text-[20px]">
                    {card.companyName}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <img src={component_11} alt="" className="w-[56px] h-[42px]"         onClick={handleOpenUpload}
/>
                  <img
                    src={component_13}
                    alt="Edit"
                    className="w-[56px] h-[42px] cursor-pointer"
                    onClick={() => handleOpenEditModal(card)}
                  />
                </div>
              </div>

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
                    className="flex border-b border-[#DADADA] py-[12px]"
                  >
                    <div className="flex items-center w-[46%] gap-0.5">
                      <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
                      <p>{item.value}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <img
                        src={
                          detailIndex === 0
                            ? calendar_month
                            : detailIndex === 1
                            ? calendar_month_1
                            : detailIndex === 2
                            ? sentiment_satisfied
                            : detailIndex === 3
                            ? humidity_low
                            : encrypted
                        }
                        alt=""
                        className="w-[24px] h-[24px]"
                      />
                      <p>
                        {detailIndex === 0
                          ? `DOB : ${card.dob}`
                          : detailIndex === 1
                          ? `DOJ : ${card.doj}`
                          : detailIndex === 2
                          ? card.gender
                          : detailIndex === 3
                          ? card.company
                          : `API Key : ${card.apiKey}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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