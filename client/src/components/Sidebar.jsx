import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ userRole }) => {
  const isSuperAdmin = userRole === "super admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;
  const isRegularOrNormal = userRole === "regular" || userRole === "normal" || isAdmin;

  const menuItems = [
    { path: "/home", label: "Home", showFor: isRegularOrNormal },
    { path: "/user-manager", label: "User Manager", showFor: isAdmin },
    { path: "/log", label: "Live Log", showFor: isAdmin },
    { path: "/saved-log", label: "Saved Log", showFor: isAdmin },
    { path: "/change-password", label: "Change Password", showFor: isRegularOrNormal },
    { path: "/logout", label: "Logout", showFor: isRegularOrNormal },
    { path: "/motor", label: "Motor", showFor: isSuperAdmin },
    { path: "/my-device", label: "My Device", showFor: isSuperAdmin },
    { path: "/device-manager", label: "Device Manager", showFor: isSuperAdmin },
    { path: "/new-plant", label: "New Plant", showFor: isSuperAdmin },
    { path: "/add-motor", label: "Add Motor", showFor: isSuperAdmin },
    { path: "/add-sensor", label: "Add Sensor", showFor: isSuperAdmin },
    { path: "/topic", label: "Topic", showFor: isSuperAdmin },
    { path: "/support", label: "Support", showFor: isSuperAdmin },
  ];

  return (
    <div className="w-full lg:w-[280px] bg-[#FFFFFF] lg:bg-[#F5F5F5] flex flex-col p-4 lg:p-6 h-auto lg:h-screen">
      <div className="hidden lg:block mb-6">
        <h1 className="text-[#4E4D4D] text-[24px] font-bold">Water Pump</h1>
      </div>
      <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-hidden">
        {menuItems.map(
          (item) =>
            item.showFor && (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `py-2 px-4 text-[16px] font-medium rounded-lg lg:mb-2 whitespace-nowrap lg:whitespace-normal ${
                    isActive
                      ? "bg-[#208CD4] text-[#FFFFFF]"
                      : "text-[#4E4D4D] hover:bg-[#E0E0E0]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
        )}
      </nav>
    </div>
  );
};

export default Sidebar;

// sdfsdfsdfsdfsdfsdf