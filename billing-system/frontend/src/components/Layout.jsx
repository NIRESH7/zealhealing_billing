import React, { useContext, useState } from 'react';
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
  Smartphone
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: Layers }, 
    { name: 'Analytics', path: '/transactions', icon: BarChart3 }, 
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'DB', path: '/db', icon: Database },
  ];

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.name : 'Overview';
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-[#1A1C1E]">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-[#E0E2E5] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
        <div className={`flex items-center h-[80px] transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-8 justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-500">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <span className="text-xl font-black tracking-tighter text-slate-900 whitespace-nowrap uppercase">Zeal Healing</span>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-all ${isCollapsed ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100' : ''}`}
          >
            <Layers className={`w-5 h-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="px-8 mt-6 mb-2 animate-in slide-in-from-left-2 duration-300">
              <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Executive Access</p>
              <p className="text-[12px] font-bold text-slate-900 italic">System Administrator</p>
          </div>
        )}

        <nav className={`flex-1 mt-8 space-y-1.5 transition-all ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-xl font-bold transition-all duration-300 overflow-hidden ${
                  isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'px-4 py-2.5 gap-4'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors`} strokeWidth={isActive ? 3 : 2.5} />
                  {!isCollapsed && <span className="text-[13px] animate-in fade-in slide-in-from-left-4 duration-500">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`pb-8 space-y-1.5 grayscale hover:grayscale-0 transition-all duration-500 ${isCollapsed ? 'px-3' : 'px-4'}`}>
           {isWaModalOpen && <WhatsAppLinkModal onClose={() => setIsWaModalOpen(false)} />}
           <button onClick={() => setIsWaModalOpen(true)} className={`flex items-center rounded-xl font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all text-left ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'px-4 py-2.5 gap-4 w-full'}`}>
              <Smartphone className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
              {!isCollapsed && <span className="text-[13px] animate-in fade-in duration-500">Sync Data</span>}
           </button>
           <button 
             onClick={handleLogout}
             className={`flex items-center rounded-xl font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-left ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'px-4 py-2.5 gap-4 w-full'}`}
           >
              <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
              {!isCollapsed && <span className="text-[13px] animate-in fade-in duration-500">Disconnect</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between bg-white border-b border-[#E0E2E5] px-8 shrink-0">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74777F]" />
                <input 
                    type="text" 
                    placeholder="Search resources..."
                    className="w-full bg-[#F1F3F9] border-none rounded-lg py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#4448D4]/20 outline-none placeholder-[#74777F]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-4">
              <button className="text-[#44474E] hover:text-[#1A1C1E] transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button onClick={() => navigate('/settings')} className="text-[#44474E] hover:text-[#1A1C1E] transition-colors">
                <SettingsIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-2 border-l border-[#E0E2E5]">
                 <div className="w-9 h-9 rounded-lg bg-[#4448D4] text-white flex items-center justify-center font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                 </div>
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
