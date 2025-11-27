
import React, { useState, useEffect } from 'react';
import { LeadService, UserService } from '../services/backend';
import { Lead, User, LeadStatus } from '../types';

export const ReportsPage: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const adminUser = { id: 'admin', role: 'ADMIN' } as User;
        const [leadData, userData] = await Promise.all([LeadService.getAll(adminUser), UserService.getAll()]);
        setLeads(leadData);
        setUsers(userData.filter(u => u.role !== 'ADMIN'));
        setLoading(false);
    };

    useEffect(() => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        setDateFrom(oneMonthAgo.toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        fetchData();
    }, []);
    
    const filteredLeads = leads.filter(lead => {
        const createdAt = new Date(lead.createdAt);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if(from && createdAt < from) return false;
        if(to) {
            to.setHours(23, 59, 59, 999);
            if(createdAt > to) return false;
        }
        return true;
    });

    const funnelData = [
        { status: LeadStatus.PENDING, label: 'Total Leads', count: filteredLeads.length },
        { status: LeadStatus.ACCEPTED, label: 'Accepted', count: filteredLeads.filter(l => [LeadStatus.ACCEPTED, LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST].includes(l.status)).length },
        { status: LeadStatus.CLOSED_WON, label: 'Won', count: filteredLeads.filter(l => l.status === LeadStatus.CLOSED_WON).length },
    ];
    const totalFunnelStart = funnelData[0].count || 1;

    const leaderboard = users
        .map(user => ({
            ...user,
            createdCount: filteredLeads.filter(l => l.userId === user.id).length,
            wonCount: filteredLeads.filter(l => l.assignedTo === user.id && l.status === LeadStatus.CLOSED_WON).length,
        }))
        .sort((a, b) => b.createdCount - a.createdCount)
        .slice(0, 10);

    const geoLeads = filteredLeads.filter(l => l.latitude && l.longitude);

    // Widget Container (Theme Aware)
    const Widget: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
      <div className={`bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-soft h-full ${className}`}>
          <div className="px-5 py-4 border-b border-border shrink-0 bg-card-secondary/30">
              <h3 className="font-bold text-text text-sm uppercase tracking-wider">{title}</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    );
    
    const dateInputClass = "px-3 py-2 border border-border rounded-lg text-sm bg-card dark:bg-white dark:text-slate-900 text-text shadow-sm focus:ring-2 focus:ring-primary outline-none";

    return (
        <div className="p-4 md:p-6 space-y-6 min-h-full">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-lg font-bold text-text">Performance Analytics</h2>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-text-secondary">Range:</div>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={dateInputClass}/>
                    <div className="text-sm text-text-tertiary">to</div>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={dateInputClass}/>
                </div>
            </div>

            {loading ? <div className="text-center py-20 text-text-tertiary">
                <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin"></div>
                </div>
                Loading report data...
            </div> : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Widget title="Lead Conversion Funnel">
                            <div className="space-y-4">
                                {funnelData.map((item, i) => {
                                    const percentage = (item.count / totalFunnelStart) * 100;
                                    const colors = ['bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];
                                    return (
                                        <div key={item.status}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-bold text-sm text-text-secondary">{item.label}</span>
                                                <span className="font-extrabold text-text text-lg">{item.count}</span>
                                            </div>
                                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-md w-full overflow-hidden">
                                                <div className={`h-full rounded-md ${colors[i]} transition-all duration-1000`} style={{width: `${percentage}%`}}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Widget>
                        <Widget title="Performance Leaderboard">
                            <div className="space-y-3">
                                {leaderboard.map((u, i) => (
                                    <div key={u.id} className="flex items-center gap-3 p-2 bg-card-secondary/50 rounded-lg border border-border">
                                        <div className="font-bold text-xs w-5 text-center text-text-tertiary">{i+1}.</div>
                                        <div className="w-8 h-8 rounded-full primary-gradient-bg text-white flex items-center justify-center font-bold text-sm shadow-sm">{u.name.charAt(0)}</div>
                                        <div className="flex-1"><div className="font-bold text-sm text-text">{u.name}</div></div>
                                        <div className="text-right">
                                            <div className="font-extrabold text-primary">{u.createdCount}</div>
                                            <div className="text-[10px] text-text-tertiary">Leads</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Widget>
                    </div>

                    <div className="lg:col-span-2 min-h-[400px] lg:min-h-0">
                        <Widget title="Geospatial Lead Distribution">
                            {geoLeads.length > 0 ? (
                                <iframe className="w-full h-full border-0 rounded-lg" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...geoLeads.map(l=>l.longitude!))-.1}%2C${Math.min(...geoLeads.map(l=>l.latitude!))-.1}%2C${Math.max(...geoLeads.map(l=>l.longitude!))+.1}%2C${Math.max(...geoLeads.map(l=>l.latitude!))+.1}&layer=mapnik`}></iframe>
                            ) : <div className="flex items-center justify-center h-full text-text-tertiary">No location data available.</div>}
                        </Widget>
                    </div>
                </div>
            )}
        </div>
    );
};
    