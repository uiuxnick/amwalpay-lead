
import React, { useEffect, useState } from 'react';
import { User, DashboardStats } from '../types';
import { LeadService } from '../services/backend';

interface DashboardPageProps {
    currentUser: User;
    onNavigate: (page: string, filters?: any) => void;
}

// --- CUSTOM SVG COMPONENTS ---

const AreaChart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="white" stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={`M0,100 L0,${100 - ((data[0] - min)/range)*100} ${points.split(' ').map((p, i) => `L${p}`).join(' ')} L100,100 Z`} fill={`url(#grad-${color})`} stroke="none" />
            <polyline points={points} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
};

const ProgressBar: React.FC<{ value: number, max: number, colorClass: string, label: string, subLabel: string }> = ({ value, max, colorClass, label, subLabel }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-text">{label}</span>
                <span className="text-xs font-medium text-text-tertiary">{subLabel}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass} shadow-sm`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await LeadService.getDashboardStats(currentUser);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const handleCardClick = (type: 'total' | 'month' | 'today') => {
      const now = new Date();
      let filters: any = {};
      if (type === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filters.dateFrom = startOfMonth.toISOString().slice(0, 10);
      }
      if (type === 'today') {
          const todayStr = now.toISOString().slice(0, 10);
          filters.dateFrom = todayStr;
          filters.dateTo = todayStr;
      }
      onNavigate('leads', filters);
  };

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );

  if (!stats) return <div className="min-h-full flex items-center justify-center text-red-400 font-mono p-10">Failed to load statistics.</div>;

  const trendData = [12, 19, 15, 22, 28, 24, 32, 35]; 
  const monthData = [5, 8, 12, 10, 15, 18, 22];

  return (
    <div className="min-h-full p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
            <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
               👋 Dashboard
            </h1>
            <p className="text-sm text-text-secondary mt-1 font-medium">Welcome back, <span className="primary-gradient-text font-bold">{currentUser.name}</span>.</p>
        </div>
        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm font-bold text-text-secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
      
      {/* Vibrant Colorful Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Violet */}
        <div onClick={() => handleCardClick('total')} className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden text-white group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <p className="text-xs font-bold text-violet-100 uppercase tracking-wider mb-1">📂 Total Leads</p>
            <h3 className="text-4xl font-black">{stats.totalLeads}</h3>
            <div className="mt-4 h-10 w-full"><AreaChart data={trendData} color="total" /></div>
        </div>

        {/* Card 2: Emerald */}
        <div onClick={() => handleCardClick('month')} className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden text-white group">
             <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">📅 This Month</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black">{stats.newThisMonth}</h3>
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">+{stats.newToday} today</span>
            </div>
            <div className="mt-4 h-10 w-full"><AreaChart data={monthData} color="month" /></div>
        </div>

        {/* Card 3: Amber */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden text-white group">
             <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">⚡ Conversion</p>
            <h3 className="text-4xl font-black">24.8%</h3>
            <div className="mt-4 w-full bg-black/10 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full shadow-sm" style={{ width: '24.8%' }}></div>
            </div>
            <p className="text-[10px] text-amber-100 mt-2 font-medium">Won vs Total</p>
        </div>

        {/* Card 4: Rose */}
        <div onClick={() => onNavigate('tasks')} className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden text-white group">
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <p className="text-xs font-bold text-rose-100 uppercase tracking-wider mb-1">✅ Pending Tasks</p>
            <h3 className="text-4xl font-black">{stats.pendingTasks.length}</h3>
            <p className="text-xs text-rose-100 mt-2 font-medium">Action Required</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {/* Industry Distribution */}
              <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
                  <h3 className="font-bold text-text text-lg mb-6 flex items-center gap-2">🏭 Industries</h3>
                  <div className="space-y-6">
                      {stats.leadsByIndustry.length === 0 ? (
                          <div className="text-center py-8 text-text-tertiary">No data available</div>
                      ) : (
                          stats.leadsByIndustry.slice(0, 5).map((item, idx) => (
                              <ProgressBar 
                                key={idx} 
                                label={item.name} 
                                subLabel={`${item.value} Leads`} 
                                value={item.value} 
                                max={stats.totalLeads} 
                                colorClass={idx === 0 ? 'bg-violet-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-amber-500' : 'bg-slate-400'} 
                              />
                          ))
                      )}
                  </div>
              </div>

              {/* Recent Meetings */}
              <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-text text-lg flex items-center gap-2">🗓️ Upcoming Meetings</h3>
                      <button onClick={() => onNavigate('meetings')} className="text-xs text-primary font-bold hover:underline">View Calendar</button>
                  </div>
                  <div className="space-y-4">
                      {stats.upcomingMeetings.length === 0 ? (
                          <p className="text-text-tertiary text-sm italic">No upcoming meetings scheduled.</p>
                      ) : (
                          stats.upcomingMeetings.map(m => (
                              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-card-secondary border border-border transition-colors hover:border-primary/30 group">
                                  <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl w-14 h-14 shadow-sm border border-border shrink-0 group-hover:scale-110 transition-transform">
                                      <span className="text-[10px] font-bold text-primary uppercase">{new Date(m.date).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-xl font-black text-text leading-none">{new Date(m.date).getDate()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-text text-sm truncate">{m.title}</h4>
                                      <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                                          ⏰ {m.time}
                                      </p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
              {/* Top Services */}
              <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
                  <h3 className="font-bold text-text text-lg mb-4 flex items-center gap-2">🏆 Top Services</h3>
                  <div className="flex flex-wrap gap-2">
                      {stats.leadsByService.slice(0, 8).map((s, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-border text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all cursor-default shadow-sm">
                              {s.name} <span className="opacity-70 ml-1">({s.value})</span>
                          </span>
                      ))}
                  </div>
              </div>

              {/* Favorite Leads */}
              <div className="bg-card rounded-2xl border border-border shadow-soft p-0 overflow-hidden">
                  <div className="p-6 border-b border-border bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                      <h3 className="font-bold text-text text-lg flex items-center gap-2">⭐ Priority Leads</h3>
                  </div>
                  <div className="divide-y divide-border">
                      {stats.favoriteLeads.length === 0 ? (
                          <div className="p-6 text-center text-text-tertiary text-sm">No favorited leads yet.</div>
                      ) : (
                          stats.favoriteLeads.map(l => (
                              <div key={l.id} onClick={() => onNavigate('leads')} className="p-4 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer group">
                                  <div className="w-10 h-10 rounded-full primary-gradient-bg text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                                      {l.ownerName.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors">{l.ownerName}</p>
                                      <p className="text-xs text-text-secondary truncate">{l.industry}</p>
                                  </div>
                                  <span className="text-yellow-400 drop-shadow-sm">★</span>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
    