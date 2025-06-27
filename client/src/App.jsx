// import React from "react";
// import Dashboard from "./pages/Dashboard";
// import Motor from "./pages/Motor";
// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import usePushNotifications from "./hooks/usePushNotifications";

// function App() {
//     usePushNotifications();

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Dashboard />} />
//         <Route path="/motor" element={<Motor />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import { Routes, Route, Navigate, useNavigate ,Link} from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";
import Motor from "./pages/Motor";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import UserManager from "./pages/UserManager";
import DeviceManager from "./pages/DeviceManager";
import MyDevice from "./pages/MyDevice";
import NewPlant from "./pages/NewPlant";
import AddMotor from "./pages/AddMotor";
import AddSensor from "./pages/AddSensor";
// Placeholder components for other routes



function Support() {
  return <div className="p-6 text-[#4E4D4D] text-[24px]">Support Page</div>;
}

function ChangePassword() {
  return (
    <div className="p-6 text-[#4E4D4D] text-[24px]">Change Password Page</div>
  );
}

function Logout() {
  const navigate = useNavigate();
  localStorage.removeItem("authToken"); // Example logout logic
  navigate("/home");
  return null;
}

function App() {
  usePushNotifications();
  return (
    <div className="flex flex-col lg:flex-row lg:bg-[#DADADA] min-h-screen">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/motor" element={<Motor />} />
        <Route path="/home" element={<Home />} />
        <Route path="/add-motor" element={<AddMotor />} />

        
        <Route path="/my-device" element={<MyDevice />} />
        <Route path="/new-plant" element={<NewPlant />} />
        <Route path="/add-sensor" element={<AddSensor />} />

        
        <Route path="/device-manager" element={<DeviceManager />} />
        <Route path="/user-manager" element={<UserManager />} />
        <Route path="/support" element={<Support />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<Navigate to="/home" />} />{" "}
        {/* Redirect root to /home */}
        <Route path="*" element={<MyDevice />} /> {/* Fallback route */}
      </Routes>
    </div>
  );
}

export default App;
