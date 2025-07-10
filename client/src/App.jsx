import { Routes, Route, Navigate } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";
import Header from "./components/Header";
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
import Log from "./pages/Log"
import LoginPage from "./pages/Login";
import SavedLog from "./pages/SavedLog";
function Support() {
  return <div className="p-6 text-[#4E4D4D] text-[24px]">Support Page</div>;
}

function ChangePassword() {
  return (
    <div className="p-6 text-[#4E4D4D] text-[24px]">Change Password Page</div>
  );
}

function Logout() {
  localStorage.removeItem("authToken");
  return <Navigate to="/home" />;
}

function App() {
  usePushNotifications();
  const isLoginPage = window.location.pathname === "/login";

  return (
    <div className="flex flex-col lg:flex-row lg:bg-[#DADADA] min-h-screen">
      {!isLoginPage && <Sidebar />}
      <div className="flex-1 flex flex-col">
        {!isLoginPage && <Header />}
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
            <Route path="/log" element={<Log />} />
            <Route path="/login" element={<LoginPage />} />
                        <Route path="/saved-log" element={<SavedLog/>} />

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