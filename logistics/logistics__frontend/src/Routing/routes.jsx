import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Page Imports
import Login from "./components/login";
import Dashboard from "./components/dashboard";
import Inventory from "./components/inventory"; // You'll create these files next
import Shipments from "./components/shipment";
import Orders from "./components/orders";

// Component Imports
import Navbar from "./components/navbar";
import ErrorBoundary from "./components/ErrorBoundary";

export default function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/" 
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route 
          path="/dashboard" 
          element={isLoggedIn ? <Layout onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/inventory" 
          element={isLoggedIn ? <Layout onLogout={handleLogout}><Inventory /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/shipments" 
          element={isLoggedIn ? <Layout onLogout={handleLogout}><ErrorBoundary><Shipments /></ErrorBoundary></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/orders" 
          element={isLoggedIn ? <Layout onLogout={handleLogout}><Orders /></Layout> : <Navigate to="/" />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Layout Wrapper
 * Keeps the Navbar at the top and centers the content
 */
function Layout({ children, onLogout }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      <Navbar onLogout={onLogout} />
      <main className="flex-1 p-4 md:p-8 w-full max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}