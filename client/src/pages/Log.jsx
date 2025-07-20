import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import draw2 from "../images/draw2.webp";

const Login = () => {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login button clicked", { loginInput, password });
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        'https://water-pump.onrender.com/api/users/login',
        {
          username: loginInput,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      console.log("Login API Response:", response.data);
      console.log("Navigating to /home with user data:", response.data);

      // Navigate to /home with user data in state
      navigate("/home", { state: { user: response.data } });
    } catch (error) {
      console.error("Login error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
      console.log("Login attempt completed, loading:", false);
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


// boookkk