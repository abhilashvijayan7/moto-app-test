import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import usePushNotifications from './hooks/usePushNotifications';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Motor from './pages/Motor';
import UserManager from './pages/UserManager';
import DeviceManager from './pages/DeviceManager';
import MyDevice from './pages/MyDevice';
import NewPlant from './pages/NewPlant';
import AddMotor from './pages/AddMotor';
import AddSensor from './pages/AddSensor';
import Topic from './pages/Topic';
import Log from './pages/Log';
import LoginPage from './pages/Login';
import SavedLog from './pages/SavedLog';
import { UserContext, UserProvider } from './context/UserContext';

function Support() {
  return <div className="p-6 text-gray-700 text-2xl">Support Page</div>;
}

function ChangePassword() {
  return <div className="p-6 text-gray-700 text-2xl">Change Password Page</div>;
}

function Logout() {
  const { logout } = useContext(UserContext);
  React.useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/login" />;
}

// ProtectedRoute Component
const ProtectedRoute = ({ children, allowedForRestrictedUser }) => {
  const { user } = useContext(UserContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  const userType = user?.role?.toLowerCase() || 'normal';
  if ((userType === 'normal' || userType === 'regular') && !allowedForRestrictedUser) {
    return <Navigate to="/home" />;
  }

  return <div>{React.cloneElement(children, { user })}</div>;
};

function App() {
  usePushNotifications();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { user } = useContext(UserContext) || {};

  return (
    <UserProvider>
      <div className="flex flex-col lg:flex-row lg:bg-gray-200 min-h-screen">
        {!isLoginPage && <Sidebar />}
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
    </UserProvider>
  );
}

export default App;