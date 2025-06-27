import { NavLink } from "react-router-dom";
import mainImage from "../images/image 3.png";
import dashboard from "../images/dashboard.png";
import devices from "../images/devices.png";
import tv from "../images/tv_options_input_settings.png";
import deployed from "../images/deployed_code_account.png";
import headset from "../images/headset_mic.png";
import passkey from "../images/passkey.png";
import logout from "../images/logout.png";
import icons8_plus_32 from "../images/icons8-plus-32.png";

function Sidebar() {
  const menuItems = [
    { icon: dashboard, label: "Home", path: "/home" },
    { icon: devices, label: "My Device", path: "/my-device" },
    { icon: tv, label: "Device Manager", path: "/device-manager" },
    { icon: icons8_plus_32, label: "New Plant", path: "/new-plant" },
    { icon: deployed, label: "User Manager", path: "/user-manager" },
    
    { icon: headset, label: "Support", path: "/support" },
    { icon: passkey, label: "Change Password", path: "/change-password" },
    { icon: logout, label: "Logout", path: "/logout" },
  ];

  return (
    <div className="left-side text-[#6B6B6B] w-[236px] bg-[#FFFFFF] shrink-0 hidden lg:block">
      <img
        src={mainImage}
        alt=""
        className="pt-[40px] ml-[5.5px] mb-[35px]"
      />
      <div className="mr-[26px] ml-[16px] flex flex-col justify-center ">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex py-[12px] pl-[20px] pr-[12px] gap-3 mb-[12px] ${
                isActive ? "bg-[#f5f3f3] rounded-[8px]" : ""
              }`
            }
          >
            <div>
              <img src={item.icon} alt="" className="w-[24px] h-[24px]" />
            </div>
            <div>
              <p>{item.label}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;