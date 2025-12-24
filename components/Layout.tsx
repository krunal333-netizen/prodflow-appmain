
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';
import { LayoutDashboard, Building2, Users, Calendar, DollarSign, Briefcase, Menu, X, Sun, Moon, LogOut, Shield, Search, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, theme, toggleTheme, logout, currentUser, toast } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleNavClick = (view: ViewState) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const getPageTitle = () => {
    switch (activeView) {
      case ViewState.DASHBOARD: return "Dashboard";
      case ViewState.SHOOTS: return "Shoot Planner";
      case ViewState.MODELS: return "Talent Database";
      case ViewState.TEAM: return "Crew Directory";
      case ViewState.BILLING: return "Billing & Finance";
      case ViewState.FIRMS: return "Organization Hub";
      case ViewState.USERS: return "Access Control";
      default: return "Dashboard";
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => handleNavClick(view)}
        className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 group border-l-4
          ${isActive 
            ? 'bg-purple-50 border-lightPrimary text-lightPrimary dark:bg-brand-500/10 dark:border-brand-500 dark:text-brand-400' 
            : 'text-[#A0AEC0] border-transparent hover:bg-gray-100 dark:hover:bg-navy-700'}
        `}
      >
        <Icon size={20} className={`${isActive ? 'text-lightPrimary' : 'text-[#A0AEC0] group-hover:text-lightText'}`} />
        <span className={`text-sm font-bold font-display ${isActive ? 'text-lightPrimary' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-lightBg dark:bg-navy-900 transition-colors duration-200 font-sans">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-navy-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-lightSuccess/90 border-lightSuccess/20 text-white' : 'bg-lightDanger/90 border-lightDanger/20 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
              <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
           </div>
        </div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-navy-800 flex flex-col transition-transform duration-300 no-print
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0 border-r border-lightBorder dark:border-navy-700
      `}>
        <div className="p-8 border-b border-lightBorder dark:border-navy-700">
           <h2 className="text-2xl font-black text-lightPrimary tracking-tighter">ProdFlow</h2>
        </div>
        
        <nav className="flex-1 py-4 space-y-1">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={ViewState.SHOOTS} icon={Calendar} label="Shoots" />
          <NavItem view={ViewState.MODELS} icon={Users} label="Talent" />
          <NavItem view={ViewState.TEAM} icon={Briefcase} label="Crew" />
          <NavItem view={ViewState.BILLING} icon={DollarSign} label="Billing" />
          
          <div className="my-6 mx-8 h-px bg-lightBorder dark:bg-navy-700 opacity-50"></div>
          
          {isAdmin && <NavItem view={ViewState.FIRMS} icon={Building2} label="Organization" />}
          {isAdmin && <NavItem view={ViewState.USERS} icon={Shield} label="Security" />}
        </nav>

        <div className="p-6 border-t border-lightBorder dark:border-navy-700">
           <div className="bg-lightBgSecondary dark:bg-navy-900 p-4 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-lightTextSecondary mb-1">Signed in as</p>
              <p className="text-sm font-black text-lightText dark:text-white truncate">{currentUser?.name}</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
         <header className="sticky top-0 z-20 px-6 py-4 no-print flex items-center justify-between bg-lightBg/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-lightBorder/30">
            <div className="flex items-center gap-4">
               <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-lightBgSecondary rounded-lg">
                  <Menu size={24} />
               </button>
               <h2 className="text-xl font-black text-lightText dark:text-white font-display hidden sm:block">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center gap-4">
               <button onClick={toggleTheme} className="p-2 text-lightTextSecondary hover:text-lightPrimary transition-colors">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
               </button>
               <div className="h-6 w-px bg-lightBorder dark:bg-navy-700 mx-1 hidden sm:block"></div>
               <button onClick={logout} className="p-2 text-lightTextSecondary hover:text-lightDanger transition-colors" title="Sign Out">
                 <LogOut size={20} />
               </button>
            </div>
         </header>

         <div className="p-6 md:p-10">
            {children}
         </div>
      </main>
    </div>
  );
};
