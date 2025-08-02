import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import mainImage from '../images/image 3.png';
import dashboard from '../images/dashboard.png';
import devices from '../images/devices.png';
import tv from '../images/tv_options_input_settings.png';
import deployed from '../images/deployed_code_account.png';
import headset from '../images/headset_mic.png';
import passkey from '../images/passkey.png';
import logout from '../images/logout.png';
import icons8_plus_32 from '../images/icons8-plus-32.png';
import technology from '../images/technology_15876046.png';
import sensor from '../images/sensor_16704590.png';
import topic from '../images/topic2.png';
import livelogs from '../images/livelogs.png';
import savedlogs from '../images/saved-png.png';
import { UserContext } from '../context/UserContext';
import location from "../images/location.png"

function Sidebar() {
  const { user } = useContext(UserContext);
  const normalizedRole = user ? user.role.toLowerCase() : 'normal';

  // Define all possible menu items
  const allMenuItems = [
    { icon: dashboard, label: 'Home', path: '/home' },
    // { icon: devices, label: 'My Device', path: '/my-device' },
    { icon: location, label: 'Add Location', path: '/add-location' },
    { icon: icons8_plus_32, label: 'New Plant', path: '/new-plant' },
    { icon: technology, label: 'Add Motor', path: '/add-motor' },
    { icon: sensor, label: 'Add Sensor', path: '/add-sensor' },
    { icon: topic, label: 'Add Topic', path: '/topic' },
        { icon: deployed, label: 'User Manager', path: '/user-manager' },

    { icon: livelogs, label: 'Live Log', path: '/log' },
    { icon: savedlogs, label: 'Saved Log', path: '/saved-log' },
    // { icon: headset, label: 'Support', path: '/support' },
    { icon: passkey, label: 'Change Password', path: '/change-password' },
    { icon: logout, label: 'Logout', path: '/logout' },
  ];

  // Filter menu items based on user role
  const getMenuItems = () => {
    if (normalizedRole === 'super admin') {
      return allMenuItems;
    } else if (normalizedRole === 'admin') {
      return allMenuItems.filter((item) =>
        ['Home', 'User Manager', 'Live Log', 'Saved Log', 'Change Password', 'Logout'].includes(
          item.label
        )
      );
    } else {
      return allMenuItems.filter((item) =>
        ['Home', 'Change Password', 'Logout'].includes(item.label)
      );
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="left-side text-gray-600 w-[200px] bg-white shrink-0 hidden lg:block  border-r-2 border-[#DADADA]">
      <center>
        <img
          src={mainImage}
          alt="KRP Aquatech"
          width="75%"
          className="pt-8 ml-1.5 mb-8"
        />
      </center>
      <div className="mr-2.5 ml-2.5 flex flex-col justify-center">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex py-2 pl-2.5 pr-2.5 gap-1 mb-2 ${
                isActive ? 'bg-gray-100 rounded-lg' : ''
              }`
            }
          >
            <div>
              <img src={item.icon} alt="" className="w-6 h-6" />
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

// hgfhdsgfhsdfghjdsgfjhdsgfjhdsgfsdjhfgdsjhgdshjfgds