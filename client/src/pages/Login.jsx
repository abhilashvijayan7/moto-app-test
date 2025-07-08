import React from 'react';
import draw2 from "../images/draw2.webp";

const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-1/2">
          <img src={draw2} alt="Login Illustration" className="w-full h-full object-cover" />
        </div>
        <div className="w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="loginInput" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                id="loginInput"
                placeholder="Enter email or username"
                className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;