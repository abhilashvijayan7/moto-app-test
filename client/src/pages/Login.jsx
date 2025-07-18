
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import draw2 from "../images/draw2.webp";

const Login = () => {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput === "normal user" && password === "normal user") {
      localStorage.setItem("authToken", "mock-token-normal");
      localStorage.setItem("userType", "normal");
      localStorage.setItem("plantId", "15");
      navigate("/home");
    } else if (loginInput === "regular user" && password === "regular user") {
      localStorage.setItem("authToken", "mock-token-regular");
      localStorage.setItem("userType", "regular");
      localStorage.setItem("plantId", "15");
      navigate("/home");
    } else if (loginInput === "super admin" && password === "super admin") {
      localStorage.setItem("authToken", "mock-token-superAdmin");
      localStorage.setItem("userType", "superAdmin");
      navigate("/home");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-1/2">
          <img src={draw2} alt="Login Illustration" className="w-full h-full object-cover" />
        </div>
        <div className="w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            <div className="mb-4">
              <label htmlFor="loginInput" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                id="loginInput"
                placeholder="Enter email or username"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
