import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Log from "./pages/Log";
import LoginPage from "./pages/Login";
import SavedLog from "./pages/SavedLog";
import { useState, useEffect } from "react";
import axios from "axios";

function Support() {
  return <div className="p-6 text-[#4E4D4D] text-[24px]">Support Page</div>;
}

function ChangePassword() {
  return (
    <div className="p-6 text-[#4E4D4D] text-[24px]">Change Password Page</div>
  );
}

function Logout() {
  return <Navigate to="/login" />;
}

// ProtectedRoute Component
const ProtectedRoute = ({ children, allowedForRestrictedUser }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const userType = location.state?.user?.role?.toLowerCase() || "normal";

  useEffect(() => {
    // If user data is present in location.state, consider authenticated initially
    // if (location.state?.user) {
    //   setIsAuthenticated(true);
    //   return;
    // }

    const checkSession = async () => {
      try {
        const response = await axios.get('https://water-pump.onrender.com/api/users/session/session-check', {
          withCredentials: true,
        });

        console.log("resppppp", response.data)

        // hgchgfhgfhgfhgfhgf
        setIsAuthenticated(response.data.loggedIn === true);
      } catch (error) {
        console.error("Session check error:", error);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, [location.state]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Display loading state while checking session
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if ((userType === "normal" || userType === "regular") && !allowedForRestrictedUser) {
    return <Navigate to="/home" />;
  }

  return children;
};

function App() {
  usePushNotifications();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const user = location.state?.user || null;

  return (
    <div className="flex flex-col lg:flex-row lg:bg-[#DADADA] min-h-screen">
      {!isLoginPage && <Sidebar userRole={user?.role?.toLowerCase() || "normal"} />}
      <div className="flex-1 flex flex-col">
        {!isLoginPage && <Header />}
        <div className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute allowedForRestrictedUser={true}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute allowedForRestrictedUser={true}>
                  <Log />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute allowedForRestrictedUser={true}>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logout"
              element={
                <ProtectedRoute allowedForRestrictedUser={true}>
                  <Logout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/motor"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <Motor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-device"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <MyDevice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-manager"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <DeviceManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-manager"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <UserManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-plant"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <NewPlant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-motor"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <AddMotor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-sensor"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <AddSensor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/topic"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <Topic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-log"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <SavedLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="*"
              element={
                <ProtectedRoute allowedForRestrictedUser={false}>
                  <MyDevice />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;