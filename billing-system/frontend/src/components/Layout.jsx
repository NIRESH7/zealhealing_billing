import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  BarChart3, 
  FileText, 
  Search, 
  Bell, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut,
  Database,
  Smartphone,
  MessageCircle,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import WhatsAppLinkModal from './WhatsAppLinkModal';

export default function Layout() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: Layers }, 
    { name: 'Analytics', path: '/transactions', icon: BarChart3 }, 
    { name: 'Products', path: '/products', icon: Database },
    { name: 'WhatsApp', path: '/whatsapp-monitor', icon: MessageCircle },
  ];

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.name : 'Overview';
  };

  return (
    <div className="flex h-screen bg-[#ffffff] font-sans text-slate-700">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <div className={`flex items-center h-24 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-8 justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-50">
                <img src="/logo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
              </div>
              <span className="text-[13px] font-black tracking-tighter text-slate-900 uppercase">Zeal Healing</span>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="px-8 mt-4 mb-2">
              <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Administrator</p>
          </div>
        )}

        <nav className={`flex-1 mt-6 space-y-1 transition-all ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg font-medium transition-all duration-200 ${
                  isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-4 py-2 gap-3'
                } ${
                  isActive
                    ? 'bg-slate-50 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-emerald-500/70'}`} strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="text-[13px] font-bold">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`pb-8 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
           {isWaModalOpen && <WhatsAppLinkModal onClose={() => setIsWaModalOpen(false)} />}
           <button onClick={() => setIsWaModalOpen(true)} className={`flex items-center rounded-lg font-medium text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all text-left ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-4 py-2 gap-3 w-full'}`}>
              <Smartphone className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={2} />
              {!isCollapsed && <span className="text-[13px] font-bold">Sync</span>}
           </button>
           <button 
             onClick={handleLogout}
             className={`flex items-center rounded-lg font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-left ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-4 py-2 gap-3 w-full'}`}
           >
              <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-500" strokeWidth={2} />
              {!isCollapsed && <span className="text-[13px] font-bold">Logout</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between bg-white border-b border-slate-100 px-8 shrink-0">
          <div className="flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-10 pr-4 text-[13px] font-black focus:bg-white focus:border-emerald-400 outline-none placeholder-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex items-center gap-5 ml-4">
              {/* Profile Avatar Clickable */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 pl-5 border-l border-slate-100 group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[14px] shadow-lg shadow-emerald-100 transition-transform group-hover:scale-105 active:scale-95">
                      {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95">
                    <div className="p-4 bg-emerald-50/50 rounded-xl mb-2 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                          {user?.username?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-[14px] font-black text-slate-900 leading-none">{user?.username}</p>
                          <div className="flex items-center gap-1 mt-1 text-emerald-600">
                             <ShieldCheck className="w-3 h-3" />
                             <span className="text-[9px] font-black uppercase tracking-widest">Administrator</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <LogOut className="w-4 h-4" />
                          Terminate Session
                       </button>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-12">
          <Outlet context={{ pageTitle: getPageTitle(), searchQuery }} />
        </div>
      </main>
    </div>
  );
}
