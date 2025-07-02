import { Routes, Route, Navigate } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";
import Header from "./components/Header"; // Import the new Header component
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Motor from "./pages/Motor";
import UserManager from "./pages/UserManager";
import DeviceManager from "./pages/DeviceManager";
import MyDevice from "./pages/MyDevice";
import NewPlant from "./pages/NewPlant";
import AddMotor from "./pages/AddMotor";
import AddSensor from "./pages/AddSensor";
import Topic from "./pages/Topic";

function Support() {
  return <div className="p-6 text-[#4E4D4D] text-[24px]">Support Page</div>;
}

function ChangePassword() {
  return (
    <div className="p-6 text-[#4E4D4D] text-[24px]">Change Password Page</div>
  );
}

function Logout() {
  localStorage.removeItem("authToken"); // Example logout logic
  return <Navigate to="/home" />;
}

function App() {
  usePushNotifications();
  return (
    <div className="flex flex-col lg:flex-row lg:bg-[#DADADA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header /> {/* Add Header for mobile navigation */}
        <div className="flex-1">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/motor" element={<Motor />} />
            <Route path="/my-device" element={<MyDevice />} />
            <Route path="/device-manager" element={<DeviceManager />} />
            <Route path="/user-manager" element={<UserManager />} />
            <Route path="/new-plant" element={<NewPlant />} />
            <Route path="/add-motor" element={<AddMotor />} />
            <Route path="/add-sensor" element={<AddSensor />} />
            <Route path="/topic" element={<Topic />} />

            <Route path="/support" element={<Support />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<MyDevice />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
