
import React from 'react';
import { User, Role } from '../types';
import { LogOut, Home, Users, QrCode, ClipboardList, Database, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab, isOnline }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400">SiteScan Pro</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Construction Site EMS</p>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          {user.role === Role.TIMEKEEPER && (
            <NavItem 
              icon={<QrCode size={20} />} 
              label="Scanner" 
              active={activeTab === 'scanner'} 
              onClick={() => setActiveTab('scanner')} 
            />
          )}
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label="Attendance Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          {user.role === Role.ADMIN && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Worker Manager" 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
            />
          )}
        </nav>

        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full space-x-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-20 shadow-md">
          <h1 className="text-xl font-bold text-blue-400">SiteScan</h1>
          <div className="flex items-center space-x-3">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
            <button onClick={onLogout}><LogOut size={20} /></button>
          </div>
        </header>

        {/* Top Desktop bar */}
        <div className="hidden md:flex items-center justify-end px-8 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-medium text-slate-600">
                  {isOnline ? 'System Online' : 'Offline Mode'}
                </span>
             </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex items-center justify-around p-2 bg-white border-t border-slate-200 sticky bottom-0 z-20">
          <MobileNavItem 
            icon={<LayoutDashboard size={24} />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          {user.role === Role.TIMEKEEPER && (
            <MobileNavItem 
              icon={<QrCode size={24} />} 
              label="Scan" 
              active={activeTab === 'scanner'} 
              onClick={() => setActiveTab('scanner')} 
            />
          )}
          <MobileNavItem 
            icon={<ClipboardList size={24} />} 
            label="Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          {user.role === Role.ADMIN && (
            <MobileNavItem 
              icon={<Users size={24} />} 
              label="Admin" 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
            />
          )}
        </nav>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full space-x-3 p-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center flex-1 py-1 transition-colors ${
      active ? 'text-blue-600' : 'text-slate-400'
    }`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

export default Layout;
