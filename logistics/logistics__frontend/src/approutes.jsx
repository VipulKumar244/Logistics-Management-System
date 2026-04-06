import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import Login from "./pages/auth/login"; 
import Dashboard from "./pages/dashboard/dashboard";
import Navbar from "./components/navbar";

export default function AppRoutes() {
 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
       
        <Route 
          path="/" 
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace={true} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />

       
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn ? (
              <DashboardLayout onLogout={handleLogout}>
                <Dashboard />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace={true} />
            )
          } 
        />

       
        <Route path="/inventory" element={isLoggedIn ? <DashboardLayout onLogout={handleLogout}><div className="p-8 text-2xl font-bold">Inventory System (MySQL)</div></DashboardLayout> : <Navigate to="/" />} />
        <Route path="/shipments" element={isLoggedIn ? <DashboardLayout onLogout={handleLogout}><div className="p-8 text-2xl font-bold">Shipment Tracking (Monte Carlo)</div></DashboardLayout> : <Navigate to="/" />} />
        <Route path="/orders" element={isLoggedIn ? <DashboardLayout onLogout={handleLogout}><div className="p-8 text-2xl font-bold">Orders Management</div></DashboardLayout> : <Navigate to="/" />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


function DashboardLayout({ children, onLogout }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans overflow-x-hidden">
     
      <Navbar onLogout={onLogout} />
      <main className="flex-1 p-4 md:p-8 w-full">
        {children}
      </main>
    </div>
  );
}