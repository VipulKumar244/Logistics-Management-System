import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import Navbar from './components/navbar';
import Dashboard from './components/dashboard';
import Login from './components/login';
import Orders from './components/orders';
import Shipments from './components/shipment'; 
import Inventory from './components/inventory'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('virex_auth') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('virex_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('virex_auth');
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
      
        <Route 
          path="/" 
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } 
        />

    
        <Route 
          path="/*" 
          element={
            isLoggedIn ? (
              <DashboardLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        >
       
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="orders" element={<Orders />} />
          
        
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function DashboardLayout({ onLogout }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      <Navbar onLogout={onLogout} />

      <main className="flex-1 p-4 md:p-8 w-full">
        <header className="mb-2 md:mb-4 border-b border-slate-200 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Operational Overview
              </h1>
              <p className="text-slate-500 mt-2 text-base md:text-lg italic">
                A resilient, observable platform for end-to-end logistics.
              </p>
            </div>
            
          
          </div>
        </header>

       
        <Outlet />
      </main>
    </div>
  );
}

export default App;