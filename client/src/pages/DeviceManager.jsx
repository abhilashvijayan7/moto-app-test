import React, { useState } from "react";
import cheveron_right from "../images/cheveron-right.png";
import add from "../images/add.png";
import component_11 from "../images/Component 11.png";
import component_13 from "../images/Component 13.png";
import image_1 from "../images/image (1).png";
import auto_awesome_motion from "../images/auto_awesome_motion.png";
import package_2 from "../images/package_2.png";
import language from "../images/language.png";
import group_1 from "../images/group (1).png";
import group_2 from "../images/group (2).png";
import calendar_month_2 from "../images/calendar_month (2).png";
import bar_chart_4_bars from "../images/bar_chart_4_bars.png";
import encrypted_1 from "../images/encrypted (1).png";
import enterprise from "../images/enterprise.png";

import UploadComponent from "../components/UploadComponent";
import AddDevice from "../components/AddNewDevice";
import EditDevice from "../components/EditDevice";

function DeviceManager() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleOpenUpload = () => {
    setIsUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
  };

  const newMockedCardData = [
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
    {
      deviceId: "IM012WCH0000033",
      installationDate: "Entry Date : 22-06-2025 11:14:54 ",
      locationCode: "IM0102WCH",
      maxDataLimit: "Maximum Data : 100",
      entryDate: "22-06-2025 11:14:54",
      apiKeyLabel: "API Key :",
      tankCapacity: "18",
      serialNumber: "1",
      locationName: "Pollachi Municipality",
    },
  ];

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (device) => {
    setSelectedDevice(device);
    setIsEditModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDevice(null);
  };

  const handleAddDevice = (deviceData) => {
    // Handle adding new device logic here
    console.log("Adding new device:", deviceData);
    handleCloseAddModal();
  };

  const handleEditDevice = (deviceData) => {
    // Handle editing device logic here
    console.log("Editing device:", deviceData);
    handleCloseEditModal();
  };

  return (
    <div>
      <div className="max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-[1380px] lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              Device Manager{" "}
            </p>
            <div className="flex bg-gray-100 w-[169px] py-1 px-2 rounded-sm mb-[18px]">
              <p>Home</p>
              <img src={cheveron_right} alt="" className="w-[20px] h-[20px]" />
              <p className="text-[#208CD4]">Device Manager</p>
            </div>
          </div>

          <div className="flex gap-1 mb-[24px] lg:h-12">
            <input
              type="text"
              placeholder="Search"
              className="border border-[#DADADA] rounded px-2 py-1 lg:w-[287.4px] w-full lg:bg-[#FFFFFF80]"
            />
            <button
              onClick={handleOpenAddModal}
              className="bg-[#208CD4] flex items-center gap-2 px-3 rounded-sm w-[170px] lg:w-auto"
            >
              <img src={add} alt="" className="w-[10px] h-[10px]" />
              <p className="font-[400] text-[12px] text-[#FFFFFF]">Add New Device</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-[#FFFFFF] p-4 rounded-xl">
          {newMockedCardData.map((card, cardIndex) => (
            <div
              className="card-div font-[400] text-[14px] border-1 border-[#DADADA] rounded-lg px-[16px] py-[24px]"
              key={cardIndex}
            >
              <div className="flex justify-between border-b border-[#208CD4] pb-[16px]">
                <div className="flex items-center gap-2 ">
                  <img src={image_1} alt="" className="w-[42px] h-[42px]" />
                  <p className="text-[#4E4D4D] font-[700] text-[20px]">
                    {card.deviceId}
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

              <div>
                {[
                  { icon: auto_awesome_motion, value: card.deviceId },
                  { icon: package_2, value: card.locationCode },
                  { icon: language, value: card.entryDate },
                  { icon: group_1, value: card.tankCapacity },
                  { icon: group_2, value: card.locationName },
                ].map((item, detailIndex) => (
                  <div
                    key={detailIndex}
                    className="flex border-b border-[#DADADA] py-[12px]"
                  >
                    <div className="flex items-center w-[48%] gap-1">
                      <img
                        src={item.icon}
                        alt=""
                        className="w-[24px] h-[24px]"
                      />
                      <p>{item.value}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {detailIndex !== 4 && (
                        <div className="flex items-center gap-0.5">
                          <img
                            src={
                              detailIndex === 0
                                ? calendar_month_2
                                : detailIndex === 1
                                ? bar_chart_4_bars
                                : detailIndex === 2
                                ? encrypted_1
                                : enterprise // for detailIndex === 3
                            }
                            alt=""
                            className="w-[24px] h-[24px]"
                          />
                          <p>
                            {detailIndex === 0
                              ? card.installationDate
                              : detailIndex === 1
                              ? card.maxDataLimit
                              : detailIndex === 2
                              ? card.apiKeyLabel
                              : detailIndex === 3
                              ? card.serialNumber
                              : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separate Modals */}
      <AddDevice
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleAddDevice}
      />
      
      <EditDevice
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditDevice}
        device={selectedDevice}
      />
      
      <UploadComponent 
        isOpen={isUploadOpen} 
        onClose={handleCloseUpload} 
      />
    </div>
  );
}

export default DeviceManager;