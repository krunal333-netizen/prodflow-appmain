import React, { useState, useMemo } from 'react';
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
import { Card, Input, Button } from './components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, Filter, Youtube, Instagram, ArrowRight, Video, ShoppingBag, Baby, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { shoots, models, invoices, currentUser } = useApp();
  
  // Date Filtering State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Filter Shoots based on Date Range
  const filteredShoots = useMemo(() => {
    return shoots.filter(s => {
      if (!startDate && !endDate) return true;
      const sDate = new Date(s.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      return sDate >= start && sDate <= end;
    });
  }, [shoots, startDate, endDate]);

  // 2. Filter Invoices based on Date Range
  const filteredInvoices = useMemo(() => {
     return invoices.filter(i => {
      if (!startDate && !endDate) return true;
      // Convert DD/MM/YYYY to Date object for comparison if needed, or rely on stored format if ISO
      // Assuming ISO or standard parseable string for simplicity in this demo, 
      // but in real apps invoice.date might need strict parsing.
      // The current invoice date is locale string which is hard to filter range-wise without parsing.
      // For this logic, we will rely on the Invoice Date being relatively recent or standard.
      // To keep it robust, we'll try to parse 'en-GB' format manually or assume matching shoot date range is better proxy?
      // Let's filter by matching Shoot ID for accuracy since invoices are linked to Shoots.
      const linkedShoot = shoots.find(s => s.id === i.shootId);
      if (!linkedShoot) return true;
      const sDate = new Date(linkedShoot.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      return sDate >= start && sDate <= end;
     });
  }, [invoices, shoots, startDate, endDate]);

  // Calculations
  const totalRevenue = filteredInvoices.filter(i => i.type === 'INVOICE').reduce((sum, i) => sum + i.total, 0);
  const activeShoots = filteredShoots.filter(s => s.status === 'Planned').length;
  
  // Next Upcoming Shoot Logic
  const nextShoot = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = shoots
      .filter(s => new Date(s.date) >= today && s.status !== 'Cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [shoots]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
     const monthCounts: Record<string, number> = {};
     filteredShoots.forEach(s => {
        const date = new Date(s.date);
        const month = date.toLocaleString('default', { month: 'short' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
     });
     // Sort roughly by month order if needed, or just map keys
     const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     return Object.keys(monthCounts)
       .sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b))
       .map(m => ({ name: m, shoots: monthCounts[m] }));
  }, [filteredShoots]);

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors relative overflow-hidden">
      <div className="z-10 relative">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={String(value)}>{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color} z-10 relative`}>
        <Icon size={24} />
      </div>
      <div className={`absolute -right-4 -bottom-4 opacity-10 ${color.replace('bg-', 'text-')} transform scale-150`}>
         <Icon size={100} />
      </div>
    </div>
  );

  // Profile Specific Logic
  const profilesToTrack = [
     { key: 'G3Surat', label: 'G3Surat', icon: Instagram, color: 'text-pink-600' },
     { key: 'G3NXT', label: 'G3NXT', icon: ShoppingBag, color: 'text-orange-500' },
     { key: 'Youtube', label: 'Youtube', icon: Youtube, color: 'text-red-600' },
     { key: 'G3Mens', label: 'G3Mens', icon: User, color: 'text-blue-600' },
     { key: 'G3Kids', label: 'G3Kids', icon: Baby, color: 'text-green-500' },
  ];

  const getProfileStats = (profileKey: string) => {
     // Find models associated with this profile
     const relevantModelIds = models.filter(m => 
       // Ensure profileType is array before methods, though logic in manager ensures it.
       // The types.ts defines it as string[].
       (Array.isArray(m.profileType) ? m.profileType : [m.profileType]).some(pt => pt.toLowerCase().includes(profileKey.toLowerCase())) || 
       (profileKey === 'Youtube' && (Array.isArray(m.profileType) ? m.profileType : [m.profileType]).some(pt => pt.toLowerCase().includes('youtube')))
     ).map(m => m.id);

     // Find shoots that use these models
     const relevantShoots = filteredShoots.filter(s => s.modelIds.some(mid => relevantModelIds.includes(mid)));
     
     const count = relevantShoots.length;
     // Approx cost logic: Sum of invoices for these shoots? Or estimated budget? 
     // Let's use estimated budget from shoot expenses + model charges for simplicity in this view
     const estCost = relevantShoots.reduce((sum, s) => {
        // Model costs
        let mCost = 0;
        s.modelIds.forEach(mid => {
           if (relevantModelIds.includes(mid)) {
              const m = models.find(mod => mod.id === mid);
              if(m) mCost += (s.locationType === 'Indoor' ? m.charges.indoorReels : m.charges.outdoorReels);
           }
        });
        return sum + mCost;
     }, 0);

     return { count, estCost };
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
           <p className="text-gray-500 dark:text-gray-400">Overview of your production activities.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="flex items-center gap-2 px-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
           </div>
           <div className="flex items-center gap-2">
              <input 
                 type="date" 
                 value={startDate} 
                 onChange={e => setStartDate(e.target.value)} 
                 className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-gray-400">-</span>
              <input 
                 type="date" 
                 value={endDate} 
                 onChange={e => setEndDate(e.target.value)} 
                 className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
           </div>
           {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                 Clear
              </button>
           )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
           title="Active Shoots" 
           value={activeShoots} 
           subtext={`In selected period`}
           icon={Video} 
           color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
        />
        <StatCard 
           title="Next Shoot" 
           value={nextShoot ? nextShoot.title : "No upcoming"} 
           subtext={nextShoot ? new Date(nextShoot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
           icon={Calendar} 
           color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
        />
        <StatCard 
           title="Total Invoiced" 
           value={`₹${totalRevenue.toLocaleString()}`} 
           subtext="Service & Travel"
           icon={DollarSign} 
           color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
        />
        <StatCard 
           title="Pending POs" 
           value={filteredInvoices.filter(i => i.type === 'PO').length} 
           subtext="Awaiting Invoice"
           icon={TrendingUp} 
           color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Shoot Frequency" className="lg:col-span-2">
          <div className="h-64 w-full">
             {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.1)'}} 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '0.5rem' }}
                    />
                    <Bar dataKey="shoots" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data in this range</div>
             )}
          </div>
        </Card>
        
        <Card title="Upcoming Schedule" className="lg:col-span-1">
           <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredShoots
                  .filter(s => new Date(s.date) >= new Date())
                  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(shoot => (
                <div key={shoot.id} className="group flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
                   <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{shoot.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded font-medium">{shoot.type}</span>
                         <span className="text-xs text-gray-500">{new Date(shoot.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</span>
                      </div>
                   </div>
                   {shoot.status === 'Planned' && <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>}
                </div>
              ))}
              {filteredShoots.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No upcoming activity</p>}
           </div>
        </Card>
      </div>

      {/* Brand Profile Stats */}
      <div>
         <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Instagram size={20} className="text-pink-600"/> Page Performance
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {profilesToTrack.map((profile) => {
               const stats = getProfileStats(profile.key);
               return (
                  <div key={profile.key} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-3">
                        <span className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${profile.color}`}>
                           <profile.icon size={20} />
                        </span>
                        {stats.count > 0 && <span className="text-xs font-bold text-gray-400">Activity</span>}
                     </div>
                     <h4 className="font-bold text-gray-900 dark:text-white">{profile.label}</h4>
                     <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Shoots</span>
                     </div>
                     <div className="mt-1 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                        <span className="text-gray-400">Est. Talent Cost</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">₹{stats.estCost > 0 ? (stats.estCost/1000).toFixed(1) + 'k' : '0'}</span>
                     </div>
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