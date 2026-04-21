'use client'
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, User, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(isRegister ? 'Registration failed. Username/mail might exist.' : 'The username or password you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans selection:bg-primary-100">
      
      {/* Background Decor - Very subtle gradient to prevent "flat" look while keeping it white */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-6">
        
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] mb-6 overflow-hidden border border-slate-50">
            <img src="/logo.png" alt="Zeal Healing" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Zeal Healing</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-[0.2em]">Secure Staff Portal</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wider">
                {isRegister ? "Mail ID" : "Staff ID / Username"}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRegister ? "Enter your mail ID" : "Enter your username"}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <div className="w-1 h-1 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegister ? "Register Account" : "Connect to Portal"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button 
              type="button" 
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors tracking-wide"
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
            </button>
            
            {!isRegister && (
              <button 
                type="button"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest mt-2"
              >
                Forgot Credentials?
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Secured by BillingSync Enterprise
        </p>
      </div>
    </div>
  );
}
