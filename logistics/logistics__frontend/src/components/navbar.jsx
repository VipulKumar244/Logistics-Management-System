import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import { 
  LogOut, 
  ChevronDown, 
  Package, 
  MapPin, 
  ClipboardEdit, 
  LayoutDashboard,
  User,
  Menu,
  X 
} from "lucide-react";

export default function Navbar({ onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Package size={18} />, label: "Inventory", path: "/inventory" },
    { icon: <MapPin size={18} />, label: "Shipments", path: "/shipments" },
    { icon: <ClipboardEdit size={18} />, label: "Orders", path: "/orders" },
  ];

  return (
    <nav className="bg-slate-900 text-slate-300 border-b border-slate-700 px-6 md:px-12 py-4 sticky top-0 z-50 w-full">
      <div className="w-full flex justify-between items-center">
   
        <div className="flex items-center gap-6 md:gap-12">
    
          <button 
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <span className="text-xl md:text-2xl font-bold text-white tracking-tighter uppercase select-none">
            VIREX LOGI
          </span>
          
          <div className="hidden lg:flex items-center gap-10 border-l border-slate-700 pl-10">
            {navLinks.map((link, idx) => (
              <NavLink 
                key={idx} 
                to={link.path}
           
                className={({ isActive }) => `
                  flex items-center gap-2 transition-colors text-sm font-semibold group
                  ${isActive ? 'text-blue-400' : 'hover:text-white'}
                `}
              >
               
                {({ isActive }) => (
                  <>
                    <span className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

      
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-500 transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white shadow-lg">
              <User size={16} />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-white leading-none">Soumik Kar</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase mt-1">Admin Access</span>
            </div>
            <ChevronDown size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-slate-700"></div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors group active:scale-95"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

    
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-700 py-4 px-6 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top duration-300">
          {navLinks.map((link, idx) => (
            <NavLink 
              key={idx} 
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-0
                ${isActive ? 'text-blue-400' : 'text-slate-300'}
              `}
            >
              <span className="opacity-70">{link.icon}</span>
              <span className="text-base font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}