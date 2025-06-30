import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import mainImage from "../images/image 3.png"; // Use the same logo as Sidebar
import dashboard from "../images/dashboard.png";
import devices from "../images/devices.png";
import tv from "../images/tv_options_input_settings.png";
import deployed from "../images/deployed_code_account.png";
import headset from "../images/headset_mic.png";
import passkey from "../images/passkey.png";
import logout from "../images/logout.png";
import icons8_plus_32 from "../images/icons8-plus-32.png";
import technology from "../images/technology_15876046.png";
import sensor from "../images/sensor_16704590.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const menuItems = [
    { icon: dashboard, label: "Home", path: "/home" },
    { icon: devices, label: "My Device", path: "/my-device" },
    { icon: tv, label: "Device Manager", path: "/device-manager" },
    { icon: icons8_plus_32, label: "New Plant", path: "/new-plant" },
    { icon: deployed, label: "User Manager", path: "/user-manager" },
    { icon: headset, label: "Support", path: "/support" },
    { icon: technology, label: "Add Motor", path: "/add-motor" },
    { icon: sensor, label: "Add Sensor", path: "/add-sensor" },
    { icon: passkey, label: "Change Password", path: "/change-password" },
    { icon: logout, label: "Logout", path: "/logout" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between mt-[40px] mb-[9px] px-4">
        <img src={mainImage} alt="Header" className="h-10" />
        <button
          onClick={toggleMenu}
          className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className="w-[24px] h-[24px] text-gray-700" />
          ) : (
            <Menu className="w-[24px] h-[24px] text-gray-700" />
          )}
        </button>
      </div>
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed top-0 left-0 w-full h-full bg-white z-50 flex flex-col p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <img src={mainImage} alt="Header" className="h-10" />
            <button
              onClick={toggleMenu}
              className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Close menu"
            >
              <X className="w-[24px] h-[24px] text-gray-700" />
            </button>
          </div>
          <nav className="flex flex-col gap-4 text-[#6B6B6B]">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex py-[12px] pl-[20px] pr-[12px] gap-3 ${
                    isActive ? "bg-[#f5f3f3] rounded-[8px]" : ""
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
                <p>{item.label}</p>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Header;