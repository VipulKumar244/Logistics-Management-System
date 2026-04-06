import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
   
    const validEmail = "ad@sk";
    const validPassword = "1234";

    if (email === validEmail && password === validPassword) {
      setError('');
      onLogin(); 
    } else {
      setError('Invalid Credentials. Access Denied.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4 selection:bg-blue-100">
      <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-[400px]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-200">
            <KeyRound size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">LETS GO</h2>
          <p className="text-slate-500 text-sm font-medium">Logistics Control Service</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3.5 rounded-xl border border-red-100 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
              Access ID
            </label>
            <input
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ad@sk"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none text-slate-900 caret-blue-600 placeholder:text-slate-300 font-bold transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
              Security Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none text-slate-900 caret-blue-600 placeholder:text-slate-300 font-bold transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 mt-2"
          >
            <span>Authorize Access</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[9px] font-bold text-green-600 uppercase tracking-tight">
              Redis-Backed Session Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}