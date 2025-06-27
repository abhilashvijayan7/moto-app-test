import React, { useState } from "react";
import language_1 from "../images/language (1).png";
import group_3 from "../images/group (3).png";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Eye,
  FileText,
  Calculator,
  ChevronRight,
} from "lucide-react";

function MyDevice() {
  const [filters, setFilters] = useState({
    reportType: "Running Hours Report",
    location: "Govt Medical College Thrissur - S...",
    startDate: "22-06-2025 11:00",
    endDate: "22-06-2025 19:00",
    search: "",
  });

  const [tableFilters, setTableFilters] = useState({
    dateOfEntry: "",
    deviceId: "",
    startBy: "",
    stopBy: "",
    startAt: "",
    stopAt: "",
    workingHr: "",
    runningSecs: "",
    cLatStart: "",
    cLatStop: "",
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleTableFilterChange = (field, value) => {
    setTableFilters((prev) => ({ ...prev, [field]: value }));
  };

  const summaryData = {
    sum: 0,
    average: 0,
    max: 0,
    min: 0,
  };

  return (
    <div>
      {/* Header Section */}
      <div className="max-w-[450px] mx-auto text-[#6B6B6B] my-6 lg:max-w-none lg:px-11 lg:w-full">
        <div className="font-[500] text-[14px] lg:flex lg:justify-between lg:items-center">
          <div>
            <p className="text-[#4E4D4D] font-[700] text-[28px] mb-[20px]">
              My Devices{" "}
            </p>
            <div className="flex bg-gray-100 w-[156px] py-1 px-2 rounded-sm mb-[18px] items-center">
              <p>Home</p>
              <ChevronRight className="w-[20px] h-[20px] mx-1" />
              <p className="text-[#208CD4]">My Devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen p-4 lg:p-6 max-w-[480px] mx-auto text-[#6B6B6B] my-6 lg:max-w-none lg:mx-0 lg:px-11">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Controls */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Report Type Dropdown */}
              <div className="relative">
                 <img
                  src={language_1}
                  alt=""
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10"
                />
                <select
                  value={filters.reportType}
                  onChange={(e) =>
                    handleFilterChange("reportType", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value="Running Hours Report">
                    Running Hours Report
                  </option>
                  <option value="Daily Report">Daily Report</option>
                  <option value="Weekly Report">Weekly Report</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Location Dropdown */}
              <div className="relative">
                <img
                  src={group_3}
                  alt=""
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10"
                />
                <select
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value="Govt Medical College Thrissur - S...">
                    Govt Medical College Thrissur - S...
                  </option>
                  <option value="Location 2">Location 2</option>
                  <option value="Location 3">Location 3</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <select
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value={filters.startDate}>
                    {filters.startDate || "Start Date"}
                  </option>
                  <option value="22-06-2025 09:00">
                    June 22, 2025 - 09:00 AM
                  </option>
                  <option value="22-06-2025 10:30">
                    June 22, 2025 - 10:30 AM
                  </option>
                  <option value="22-06-2025 11:00">
                    June 22, 2025 - 11:00 AM
                  </option>
                  <option value="22-06-2025 14:15">
                    June 22, 2025 - 02:15 PM
                  </option>
                  <option value="22-06-2025 16:20">
                    June 22, 2025 - 04:20 PM
                  </option>
                  <option value="23-06-2025 08:00">
                    June 23, 2025 - 08:00 AM
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <select
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                >
                  <option value={filters.endDate}>
                    {filters.endDate || "End Date"}
                  </option>
                  <option value="22-06-2025 19:00">
                    June 22, 2025 - 07:00 PM
                  </option>
                  <option value="22-06-2025 20:30">
                    June 22, 2025 - 08:30 PM
                  </option>
                  <option value="22-06-2025 21:00">
                    June 22, 2025 - 09:00 PM
                  </option>
                  <option value="23-06-2025 18:15">
                    June 23, 2025 - 06:15 PM
                  </option>
                  <option value="23-06-2025 19:20">
                    June 23, 2025 - 07:20 PM
                  </option>
                  <option value="24-06-2025 20:00">
                    June 24, 2025 - 08:00 PM
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Search and Action Buttons */}
            <div className="mt-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#208CD4] text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#208CD4] text-[#208CD4] rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#208CD4] text-[#208CD4] rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium">
                  <Calculator className="w-4 h-4" />C
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            {/* Table Headers with Filters */}
            <div className="min-w-full">
              {/* Column Headers */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-10 gap-4 px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Date of Entry
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Device Id
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Start By
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Stop By
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Start At
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Stop At
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Working Hr.
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    Running Secs
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    CLat Start
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    CLat Stop
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-10 gap-4 px-4 py-2 bg-white border-b border-gray-200">
                  {Object.keys(tableFilters).map((key, index) => (
                    <div key={key} className="relative">
                      <input
                        type="text"
                        value={tableFilters[key]}
                        onChange={(e) =>
                          handleTableFilterChange(key, e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder=""
                      />
                      <Filter className="absolute right-2 top-1.5 w-3 h-3 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Body - No Data State */}
              <div className="text-center py-16 text-gray-500">
                <div className="text-sm">No data to display</div>
              </div>
            </div>
          </div>

          {/* Footer with Summary and Create Filter */}
          <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Create Filter Button */}
              <button className="flex items-center gap-2 text-[#208CD4] hover:text-blue-700 font-medium text-sm">
                <Filter className="w-4 h-4" />
                Create Filter
              </button>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:flex lg:gap-8 gap-4 text-sm">
                <div className="flex justify-between lg:block">
                  <span className="text-gray-600 font-medium">Sum :</span>
                  <span className="text-[#208CD4] font-semibold lg:ml-2">
                    {summaryData.sum}
                  </span>
                </div>
                <div className="flex justify-between lg:block">
                  <span className="text-gray-600 font-medium">Average :</span>
                  <span className="text-[#208CD4] font-semibold lg:ml-2">
                    {summaryData.average}
                  </span>
                </div>
                <div className="flex justify-between lg:block">
                  <span className="text-gray-600 font-medium">Max :</span>
                  <span className="text-[#208CD4] font-semibold lg:ml-2">
                    {summaryData.max}
                  </span>
                </div>
                <div className="flex justify-between lg:block">
                  <span className="text-gray-600 font-medium">Min :</span>
                  <span className="text-[#208CD4] font-semibold lg:ml-2">
                    {summaryData.min}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyDevice;