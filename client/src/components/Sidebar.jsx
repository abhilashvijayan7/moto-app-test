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
import technology from "../images/technology_15876046.png";
import sensor from "../images/sensor_16704590.png";
import topic from "../images/topic2.png";
import livelogs from "../images/livelogs.png";
import savedlogs from "../images/saved-png.png";

function Sidebar({ user }) {
  const userType = user?.role?.toLowerCase() || "normal";
  const isRestrictedUser = userType === "normal" || userType === "regular";

  const menuItems = [
    { icon: dashboard, label: "Home", path: "/home" },
    ...(isRestrictedUser
      ? []
      : [
          { icon: devices, label: "My Device", path: "/my-device" },
          { icon: tv, label: "Device Manager", path: "/device-manager" },
          { icon: icons8_plus_32, label: "New Plant", path: "/new-plant" },
          { icon: deployed, label: "User Manager", path: "/user-manager" },
          { icon: technology, label: "Add Motor", path: "/add-motor" },
          { icon: sensor, label: "Add Sensor", path: "/add-sensor" },
          { icon: topic, label: "Add Topic", path: "/topic" },
          { icon: livelogs, label: "Live Log", path: "/log" },
          { icon: savedlogs, label: "Saved Log", path: "/saved-log" },
          { icon: headset, label: "Support", path: "/support" },
        ]),
    { icon: passkey, label: "Change Password", path: "/change-password" },
    { icon: logout, label: "Logout", path: "/logout" },
  ];

  return (
    <div className="left-side text-[#6B6B6B] w-[200px] bg-[#FFFFFF] shrink-0 hidden lg:block">
      <center>
        <img
          src={mainImage}
          alt="KRP Aquatech"
          width="75%"
          className="pt-[30px] ml-[5.5px] mb-[30px]"
        />
      </center>
      <div className="mr-[10px] ml-[10px] flex flex-col justify-center">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex py-[7px] pl-[10px] pr-[10px] gap-1 mb-[7px] ${
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