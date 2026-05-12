'use client'
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock, Eye, EyeOff, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch {
      setError(isRegister ? 'Registration Failed' : 'Authentication Invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans selection:bg-emerald-100 relative overflow-hidden">
      
      {/* Devotional Glow Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-100/30 rounded-full blur-[140px] animate-pulse" />
         <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[350px] h-[350px] bg-yellow-200/20 rounded-full blur-[100px] z-0" />
      </div>

      {/* Left Branding Side - Soft Healing Green Contrast */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 bg-[#f0fdf4] md:border-r border-emerald-100/50">
         <div className="w-full max-w-sm flex flex-col items-center text-center">
            <div className="relative mb-8">
               <div className="w-28 h-28 rounded-full bg-white shadow-[0_20px_50px_rgba(16,185,129,0.1)] p-4 flex items-center justify-center border border-emerald-50">
                  <img src="/logo.png" alt="Zeal Healing" className="w-full h-full object-contain" />
               </div>
               <div className="absolute bottom-2 right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-white" />
            </div>
            
            <div className="space-y-4">
               <h1 className="text-[44px] font-black text-slate-900 tracking-tighter leading-[1]">
                  BILLING<br />
                  <span className="text-emerald-600">PORTAL.</span>
               </h1>
               <div className="h-0.5 w-10 bg-emerald-600 mx-auto rounded-full" />
               <p className="max-w-[240px] text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.4em] leading-loose mt-4">
                  Global System Entry Protocol
               </p>
            </div>

            <div className="mt-16 flex items-center gap-2">
               <div className="flex -space-x-1">
                  {[1,2,3].map(i => <div key={i} className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-white" />)}
               </div>
               <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.3em]">ACTIVE SYSTEM</span>
            </div>
         </div>
      </div>

      {/* Right Auth Side - Compact Box with Bold Text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[#fafbfc]">
         {/* The Card Box - Premium Curved Rectangle */}
         <div className="w-full max-w-[420px] bg-white border border-slate-100 p-12 rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5 relative">
            
            <div className="mb-10 text-center">
               <h2 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                  {isRegister ? 'Join System' : 'Welcome to'}<br />
                  <span className="text-emerald-600">{isRegister ? 'Personnel' : 'Zeal Healing'}</span>
               </h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">
                  {isRegister ? 'Register New Account' : 'Initialize Credentials'}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
               
               {/* Identity Field */}
               <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                     {isRegister ? 'Username' : 'Username'}
                  </label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                     </div>
                     <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Type username here"
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500/40 focus:ring-[6px] focus:ring-emerald-500/5 transition-all font-mono"
                     />
                  </div>
               </div>

               {/* Key Field */}
               <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                     {isRegister ? 'Enter Password' : 'Password'}
                  </label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                     </div>
                     <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500/40 focus:ring-[6px] focus:ring-emerald-500/5 transition-all font-mono"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-800 hover:text-emerald-600 transition-all font-bold"
                     >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                     </button>
                  </div>
               </div>

               {/* Confirm Key Field (Only for Register) */}
               {isRegister && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                     <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                        Confirm Password
                     </label>
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                           <CheckCircle2 className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        </div>
                        <input
                           type={showPassword ? "text" : "password"}
                           required
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="••••••••••••"
                           className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500/40 focus:ring-[6px] focus:ring-emerald-500/5 transition-all font-mono"
                        />
                     </div>
                  </div>
               )}

               {/* Error Display */}
               {error && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                     <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
                     {error}
                  </div>
               )}

               {/* Action Trigger - Softer Emerald Button */}
               <div className="pt-3">
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl transition-all active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-emerald-100/50 overflow-hidden relative"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                     {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                        <>
                           <span className="text-[12px] font-black uppercase tracking-[0.3em]">{isRegister ? 'Create Account' : 'Verify & Enter'}</span>
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                     )}
                  </button>
               </div>
            </form>

            <div className="mt-10 flex flex-col items-center">
               <button 
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-[10px] font-black text-slate-400 hover:text-emerald-700 uppercase tracking-[0.2em] transition-colors border-b-2 border-slate-50 hover:border-emerald-100 pb-0.5"
               >
                  {isRegister ? 'Already have an account? Login' : 'Need an account? Create one'}
               </button>
            </div>
         </div>
      </div>

   </div>
  );
}
