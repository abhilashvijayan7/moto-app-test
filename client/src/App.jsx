import React, { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import Log from "./pages/LiveLog";
import LoginPage from "./pages/Login";
import SavedLog from "./pages/SavedLog";
import AddLocation from "./pages/AddLocation";

import { UserContext, UserProvider } from "./context/UserContext";

import ChangePassword from "./pages/ChangePassword";

function Support() {
  return <div className="p-6 text-gray-700 text-2xl">Support Page</div>;
}

// A component to handle the main layout of the app
const AppLayout = () => {
  const location = useLocation();
  // Don't show header/sidebar on the login page
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col lg:flex-row  min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
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
          <ProtectedRoute  allowedForRestrictedUser={true}>
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
        path="/add-location"
        element={
          <ProtectedRoute allowedForRestrictedUser={false}>
            <AddLocation />
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
  );
};


function Logout() {
  const { logout } = useContext(UserContext);
  React.useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/login" />;
}

// const ProtectedRoute = ({ children, allowedForRestrictedUser }) => {
//   const { user, isCheckingSession } = useContext(UserContext);
//   const location = useLocation();

//   if (isCheckingSession) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         Loading...
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} />;
//   }



//   const userType = user?.role?.toLowerCase() || "normal";

//   console.log("mythiliiiiii", user);

//   if (
//     (userType === "normal" || userType === "regular") &&
//     !allowedForRestrictedUser
//   ) {
//     return <Navigate to="/home" />;
//   }

//   return <div>{React.cloneElement(children, { user })}</div>;
// };

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isCheckingSession } = useContext(UserContext);
  const location = useLocation();

  // 1. Show a loading indicator while the session is being checked
  if (isCheckingSession) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // 2. If no user, redirect to the login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. (Optional) If a specific role is required, check for it
  if (requiredRole && user.role?.toLowerCase() !== requiredRole) {
    // If the user doesn't have the required role, redirect them to the home page
    return <Navigate to="/home" replace />;
  }

  // 4. If all checks pass, render the component
  return children;
};

function App() {
  usePushNotifications();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <UserProvider>
      {/* <div className="flex flex-col lg:flex-row lg:bg-gray-200 min-h-screen">
        {!isLoginPage && <Sidebar />}
        <div className="flex-1 flex flex-col">
          {!isLoginPage && <Header />}
          <div className="flex-1">
            
          </div>
        </div>
      </div> */}
      <AppLayout />
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </UserProvider>
  );
}

export default App;

// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
