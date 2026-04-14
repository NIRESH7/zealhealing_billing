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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: Layers }, // Remapped Upload to Projects for visual fit
    { name: 'Analytics', path: '/transactions', icon: BarChart3 }, // Remapped Transactions to Analytics
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'DB', path: '/db', icon: Database },
  ];

  // Helper to get breadcrumb name
  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.name : 'Overview';
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-[#1A1C1E]">
      {/* Sidebar */}
      <aside className="w-[260px] flex flex-col bg-white border-r border-[#E0E2E5]">
        <div className="flex px-8 items-center h-[72px]">
          <span className="text-xl font-black tracking-tighter text-[#1A1C1E]">MANAGEMENT_OS</span>
        </div>
        
        <div className="px-8 mt-4 mb-2">
            <p className="text-[11px] font-bold text-[#74777F] tracking-widest uppercase">System Admin</p>
            <p className="text-[12px] text-[#74777F]">Management Tier 1</p>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F1F3F9] text-[#1A1C1E]'
                    : 'text-[#44474E] hover:bg-[#F1F3F9]/50 hover:text-[#1A1C1E]'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-8 space-y-1">
           {isWaModalOpen && <WhatsAppLinkModal onClose={() => setIsWaModalOpen(false)} />}
           <button onClick={() => setIsWaModalOpen(true)} className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-sm font-semibold text-[#44474E] hover:bg-green-50 hover:text-green-600 transition-all text-left">
              <Smartphone className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Link WhatsApp
           </button>
           <button className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-sm font-semibold text-[#44474E] hover:bg-[#F1F3F9]/50 transition-all text-left">
              <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Help
           </button>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-sm font-semibold text-[#44474E] hover:bg-red-50 hover:text-red-600 transition-all text-left"
           >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Logout
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
