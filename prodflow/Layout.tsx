import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';
import { LayoutDashboard, Building2, Users, Calendar, DollarSign, Briefcase, Menu, X, Sun, Moon, LogOut, Shield } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, theme, toggleTheme, logout, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ViewState) => {
    setActiveView(view);
    setIsMobileMenuOpen(false); // Close menu on mobile after selection
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => handleNavClick(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 font-medium ${
        activeView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-700 dark:text-gray-200 p-1">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">ProdFlow</span>
          </div>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out no-print
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
      `}>
        {/* Sidebar Header (Hidden on Mobile as it duplicates the top bar mostly, but needed for close button) */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">P</div>
              <span className="font-bold text-gray-900 dark:text-white tracking-tight">ProdFlow</span>
           </div>
           <button className="md:hidden text-gray-500 dark:text-gray-400" onClick={() => setIsMobileMenuOpen(false)}>
             <X size={24} />
           </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={ViewState.SHOOTS} icon={Calendar} label="Shoots" />
          <NavItem view={ViewState.MODELS} icon={Users} label="Talent" />
          <NavItem view={ViewState.TEAM} icon={Briefcase} label="Crew" />
          <NavItem view={ViewState.BILLING} icon={DollarSign} label="Billing" />
          
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 space-y-1">
             <NavItem view={ViewState.FIRMS} icon={Building2} label="Firm Profile" />
             {currentUser?.role === 'ADMIN' && (
                <NavItem view={ViewState.USERS} icon={Shield} label="User Access" />
             )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
           {/* Desktop Theme Toggle */}
           <div className="hidden md:flex items-center justify-between mb-4 px-2">
             <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Appearance</span>
             <button onClick={toggleTheme} className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
               {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
             </button>
           </div>

           <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
                 {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role}</p>
              </div>
           </div>
           
           <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors">
              <LogOut size={16} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden min-h-[calc(100vh-64px)] md:min-h-screen">
         {children}
      </main>
    </div>
  );
};