
import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { FirmSettings } from './modules/FirmSettings';
import { ModelManager } from './modules/ModelManager';
import { TeamManager } from './modules/TeamManager';
import { ShootScheduler } from './modules/ShootScheduler';
import { FinanceModule } from './modules/FinanceModule';
import { UserManagement } from './modules/UserManagement';
import { Login } from './modules/Login';
import { ViewState } from './types';
import { Card, Input, Button, Select } from './components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, Filter, Youtube, Instagram, ArrowRight, Video, ShoppingBag, Baby, User, CheckCircle2, X, Zap, LayoutDashboard } from 'lucide-react';
import { PROFILE_TYPES } from './constants';

const Dashboard: React.FC = () => {
  const { shoots, models, invoices, setActiveView } = useApp();
  const [isMounted, setIsMounted] = useState(false);
  
  // Filtering State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('All');

  // Ensure chart only renders after a slight delay for stable container measurements
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredShoots = useMemo(() => {
    return shoots.filter(s => {
      if (selectedPage !== 'All' && s.page !== selectedPage) return false;
      if (!startDate && !endDate) return true;
      const sDate = new Date(s.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      return sDate >= start && sDate <= end;
    });
  }, [shoots, startDate, endDate, selectedPage]);

  const filteredInvoices = useMemo(() => {
     return invoices.filter(i => {
      const linkedShoot = shoots.find(s => s.id === i.shootId);
      if (selectedPage !== 'All') {
         if (!linkedShoot || linkedShoot.page !== selectedPage) return false;
      }
      if (!startDate && !endDate) return true;
      if (!linkedShoot) return true;
      const sDate = new Date(linkedShoot.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      return sDate >= start && sDate <= end;
     });
  }, [invoices, shoots, startDate, endDate, selectedPage]);

  const totalRevenue = filteredInvoices.filter(i => i.type === 'INVOICE').reduce((sum, i) => sum + i.total, 0);
  const activeShoots = filteredShoots.filter(s => ['Planning', 'Scheduled', 'In Progress'].includes(s.status)).length;
  
  const nextShoot = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = filteredShoots 
      .filter(s => new Date(s.date) >= today && ['Planning', 'Scheduled', 'In Progress'].includes(s.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [filteredShoots]);

  const chartData = useMemo(() => {
     const monthCounts: Record<string, number> = {};
     filteredShoots.forEach(s => {
        const date = new Date(s.date);
        const month = date.toLocaleString('en-US', { month: 'short' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
     });
     const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const sortedKeys = Object.keys(monthCounts).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));
     
     if (sortedKeys.length === 0) return [];
     return sortedKeys.map(m => ({ name: m, shoots: monthCounts[m] }));
  }, [filteredShoots]);

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
    <div className="bg-lightCard dark:bg-navy-800 p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all hover:scale-[1.02] duration-500 group border border-lightBorder dark:border-navy-700/50 relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-110 duration-500 ${colorClass}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        {trend && (
           <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${trend > 0 ? 'bg-lightSuccess/10 text-lightSuccess' : 'bg-lightDanger/10 text-lightDanger'}`}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
           </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">{title}</p>
        <h3 className="text-2xl font-black text-lightText dark:text-white font-display tracking-tight truncate">{value}</h3>
        <p className="text-[10px] font-bold text-lightTextSecondary dark:text-gray-400 mt-1 uppercase tracking-wider">{subtext}</p>
      </div>
    </div>
  );

  const profilesToTrack = [
     { key: 'G3Surat', label: 'G3Surat', icon: Instagram, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
     { key: 'G3NXT', label: 'G3NXT', icon: ShoppingBag, color: 'text-orange-500 bg-orange-900/20' },
     { key: 'Youtube', label: 'Youtube', icon: Youtube, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
     { key: 'G3Mens', label: 'G3Mens', icon: User, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
     { key: 'G3Kids', label: 'G3Kids', icon: Baby, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  ];

  const getProfileStats = (profileKey: string) => {
     const relevantShoots = filteredShoots.filter(s => s.page && s.page.toLowerCase().includes(profileKey.toLowerCase()));
     return { count: relevantShoots.length };
  };

  return (
    <div className="space-y-10 animate-pageInUp">
      {/* Header & Filter Section */}
      <div className="flex flex-col gap-8 relative z-[60]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-lightPrimary/10 text-lightPrimary border border-lightBorder/50 dark:border-navy-700/50 shadow-sm">
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Command Center</h1>
                <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Enterprise operations overview and live telemetry</p>
              </div>
           </div>
           <div className="flex items-center gap-3 p-1.5 bg-white/60 dark:bg-navy-800/60 backdrop-blur-md rounded-2xl border border-lightBorder dark:border-navy-700/50 shadow-soft">
              <div className="p-2.5 bg-lightPrimary/10 rounded-xl text-lightPrimary">
                 <Zap size={20} strokeWidth={3} className="animate-pulse" />
              </div>
              <div className="pr-4">
                 <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest leading-none mb-1">System Status</p>
                 <p className="text-xs font-black text-lightSuccess uppercase tracking-tighter leading-none">All Modules Operational</p>
              </div>
           </div>
        </div>
        
        <div className="bg-white/95 dark:bg-navy-800/95 p-5 rounded-2xl shadow-soft border border-lightBorder dark:border-navy-700/50 relative z-[60]">
           <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex items-center gap-3 shrink-0 lg:border-r border-lightBorder dark:border-navy-700 lg:pr-8">
                 <Filter size={18} strokeWidth={3} className="text-lightPrimary" />
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-lightText dark:text-white">Telemetry Filters</span>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center flex-1">
                <div className="w-full sm:w-64">
                   <Select 
                     options={['All', ...PROFILE_TYPES]}
                     value={selectedPage}
                     onChange={(e) => setSelectedPage(e.target.value)}
                     placeholder="Select Page"
                   />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <div className="flex-1 sm:w-44">
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                   </div>
                   <div className="h-0.5 w-4 bg-lightBorder dark:bg-navy-700"></div>
                   <div className="flex-1 sm:w-44">
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                   </div>
                </div>

                {(startDate || endDate || selectedPage !== 'All') && (
                   <button 
                      onClick={() => { setStartDate(''); setEndDate(''); setSelectedPage('All'); }} 
                      className="px-6 h-[50px] text-[10px] text-lightDanger hover:bg-red-50 dark:hover:bg-red-900/10 font-black uppercase tracking-widest rounded-xl border border-red-100 dark:border-red-900/40 transition-all flex items-center justify-center gap-2 group"
                   >
                      <X size={14} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Clear Workspace
                   </button>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard 
           title="Shoots Pipeline" 
           value={activeShoots} 
           subtext="Planning or Scheduled"
           icon={Video} 
           colorClass="bg-lightPrimary" 
           trend={12}
        />
        <StatCard 
           title="Next Up" 
           value={nextShoot ? nextShoot.title : "Idle"} 
           subtext={nextShoot ? new Date(nextShoot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No upcoming projects'}
           icon={Calendar} 
           colorClass="bg-lightSuccess" 
        />
        <StatCard 
           title="Projected Billing" 
           value={`₹${(totalRevenue/1000).toFixed(1)}k`} 
           subtext="Total Unissued Drafts"
           icon={DollarSign} 
           colorClass="bg-lightWarning" 
        />
        <StatCard 
           title="Commercial Gap" 
           value={filteredInvoices.filter(i => i.type === 'PO').length} 
           subtext="Pending PO to Invoice"
           icon={CheckCircle2} 
           colorClass="bg-lightDanger" 
           trend={-5}
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
        <Card title="Volume Analytics" className="lg:col-span-2 border-none shadow-soft overflow-hidden" noHeaderBorder>
          <div className="w-full h-[380px] mt-6 relative overflow-hidden">
             {isMounted && chartData.length > 0 ? (
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorShoots" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4318FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF7" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 800}} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 800}} 
                      />
                      <Tooltip 
                        cursor={{stroke: '#4318FF', strokeWidth: 1.5}} 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '16px', boxShadow: '0 20px 48px rgba(0,0,0,0.1)', padding: '16px' }}
                        itemStyle={{ color: '#2B3674', fontWeight: 900, fontSize: '14px' }}
                        labelStyle={{ color: '#A3AED0', fontSize: '9px', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="shoots" 
                        stroke="#4318FF" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorShoots)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-lightTextSecondary font-bold gap-4 opacity-50">
                  <div className="w-20 h-20 bg-lightBgSecondary rounded-full flex items-center justify-center"><TrendingUp size={32} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {!isMounted ? 'Calibrating Metrics...' : (chartData.length === 0 ? 'No historical data available' : 'Loading Analytics...')}
                  </p>
                </div>
             )}
          </div>
        </Card>
        
        <Card title="Imminent Deadlines" className="border-none shadow-soft" noHeaderBorder>
           <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar mt-6">
              {filteredShoots
                  .filter(s => new Date(s.date) >= new Date())
                  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 8)
                  .map(shoot => (
                <div key={shoot.id} 
                     onClick={() => setActiveView(ViewState.SHOOTS)}
                     className="group flex items-center gap-4 p-4 bg-lightBg dark:bg-navy-900/40 rounded-2xl border border-lightBorder/50 dark:border-navy-700/50 hover:border-lightPrimary/40 hover:bg-white dark:hover:bg-navy-800 transition-all cursor-pointer shadow-sm hover:shadow-md">
                   <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-navy-800 text-lightPrimary shadow-sm font-black border border-lightBorder dark:border-navy-700 group-hover:bg-lightPrimary group-hover:text-white transition-all duration-300">
                      <span className="text-[8px] uppercase leading-none mb-1 opacity-60 group-hover:opacity-100">{new Date(shoot.date).toLocaleDateString('en-GB', {month: 'short'})}</span>
                      <span className="text-lg leading-none">{new Date(shoot.date).getDate()}</span>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="font-black text-lightText dark:text-white text-sm truncate uppercase tracking-tight leading-none mb-1.5">{shoot.title}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[8px] px-1.5 py-0.5 rounded border border-lightBorder dark:border-navy-700 text-lightTextSecondary font-black uppercase tracking-widest">{shoot.type}</span>
                      </div>
                   </div>
                   <ArrowRight size={14} strokeWidth={3} className="text-lightTextSecondary opacity-30 group-hover:opacity-100 group-hover:text-lightPrimary transition-all transform group-hover:translate-x-1" />
                </div>
              ))}
              {filteredShoots.length === 0 && (
                <div className="py-24 text-center flex flex-col items-center gap-4">
                   <Calendar size={40} className="text-lightTextSecondary opacity-10" />
                   <p className="text-lightTextSecondary text-[10px] font-black uppercase tracking-[0.2em]">Queue Empty</p>
                </div>
              )}
           </div>
        </Card>
      </div>

      {/* Page Analytics */}
      <div className="pt-6 relative z-0">
         <div className="flex items-center gap-4 mb-10">
            <h2 className="text-xl font-black text-lightText dark:text-white font-display uppercase tracking-widest">Global Traction</h2>
            <div className="flex-1 h-px bg-lightBorder dark:bg-navy-700 opacity-50"></div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {profilesToTrack.map((profile) => {
               const stats = getProfileStats(profile.key);
               return (
                  <div key={profile.key} className="bg-lightCard dark:bg-navy-800 p-8 rounded-2xl shadow-soft border border-lightBorder dark:border-navy-700/50 transition-all hover:-translate-y-2 group relative overflow-hidden">
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className={`p-4 rounded-xl ${profile.color} shadow-inner transition-transform group-hover:scale-110 duration-500`}>
                           <profile.icon size={24} strokeWidth={3} />
                        </div>
                        {stats.count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-lightSuccess animate-ping"></div>}
                     </div>
                     <h4 className="font-black text-lightTextSecondary dark:text-gray-400 text-[10px] uppercase tracking-[0.25em] mb-3 relative z-10">{profile.label}</h4>
                     <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-4xl font-black text-lightText dark:text-white font-display tracking-tighter">{stats.count}</span>
                        <span className="text-[10px] text-lightTextSecondary font-black uppercase tracking-widest opacity-60">Projects</span>
                     </div>
                     <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-lightPrimary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};

const MainContent = () => {
  const { activeView, currentUser } = useApp();
  
  switch (activeView) {
    case ViewState.FIRMS: return <FirmSettings />;
    case ViewState.MODELS: return <ModelManager />;
    case ViewState.TEAM: return <TeamManager />;
    case ViewState.SHOOTS: return <ShootScheduler />;
    case ViewState.BILLING: return <FinanceModule />;
    case ViewState.USERS: return currentUser?.role === 'ADMIN' ? <UserManagement /> : <Dashboard />;
    default: return <Dashboard />;
  }
};

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Login />;
  }

  return (
    <Layout>
      <MainContent />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  );
};

export default App;
