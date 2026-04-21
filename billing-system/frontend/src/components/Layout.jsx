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
    { name: 'Products', path: '/products', icon: Database },
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
            <Layers className="w-4 h-4" />
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
                  <item.icon className="w-4 h-4 shrink-0 transition-colors" strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="text-[13px]">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`pb-8 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
           {isWaModalOpen && <WhatsAppLinkModal onClose={() => setIsWaModalOpen(false)} />}
           <button onClick={() => setIsWaModalOpen(true)} className={`flex items-center rounded-lg font-medium text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all text-left ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-4 py-2 gap-3 w-full'}`}>
              <Smartphone className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!isCollapsed && <span className="text-[13px]">Sync</span>}
           </button>
           <button 
             onClick={handleLogout}
             className={`flex items-center rounded-lg font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-left ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-4 py-2 gap-3 w-full'}`}
           >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!isCollapsed && <span className="text-[13px]">Logout</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between bg-white border-b border-slate-100 px-8 shrink-0">
          <div className="flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-10 pr-4 text-[13px] focus:bg-white focus:border-slate-400 outline-none placeholder-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex items-center gap-5 ml-4">
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/settings')} className="text-slate-400 hover:text-slate-900 transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 pl-5 border-l border-slate-100">
                 <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[12px]">
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
