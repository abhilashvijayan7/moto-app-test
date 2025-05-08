import React from "react";
import Dashboard from "./pages/Dashboard";
import Motor from "./pages/Motor";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/motor" element={<Motor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
