
import React from 'react';
import { User, UserRole } from '../types';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SidebarProps {
  user: User;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onInstall?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activePage,
  onNavigate,
  onLogout,
  onInstall
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
        { id: 'leads', label: 'All Leads', emoji: '📂' },
        { id: 'favorites', label: 'Favorites', emoji: '⭐' },
        { id: 'tasks', label: 'My Tasks', emoji: '✅' },
        { id: 'meetings', label: 'Meetings', emoji: '🗓️' },
        { id: 'reports', label: 'Reports', emoji: '📈', admin: true },
    ];

    const adminItems = [
        { id: 'users', label: 'Manage Users', emoji: '👥' },
        { id: 'settings', label: 'Settings', emoji: '⚙️' },
    ];
    
    return (
        <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl text-text border-r border-border shadow-2xl z-30">
            {/* Header with Large Logo - Adjusted for new layout */}
            <div className="flex items-center justify-center h-28 border-b border-border bg-card-secondary/30 shrink-0 px-4">
                <Logo className="h-14 w-full max-w-[220px]" />
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map(item => (
                    (!item.admin || user.role === UserRole.ADMIN) && (
                        <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${activePage === item.id ? 'primary-gradient-bg text-white shadow-glow scale-[1.02]' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text hover:pl-5'}`}>
                            <span className="text-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                            {item.label}
                        </button>
                    )
                ))}
                {user.role === UserRole.ADMIN && (
                    <>
                        <div className="pt-6 pb-2 px-4 text-xs font-extrabold text-text-tertiary uppercase tracking-widest opacity-80">Admin Controls</div>
                        {adminItems.map(item => (
                             <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${activePage === item.id ? 'primary-gradient-bg text-white shadow-glow' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text hover:pl-5'}`}>
                                <span className="text-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                                {item.label}
                            </button>
                        ))}
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-border bg-card-secondary/50 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => onNavigate('profile')}>
                    <div className="w-10 h-10 rounded-full primary-gradient-bg flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-md border-2 border-white dark:border-slate-700">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-text truncate">{user.name}</div>
                        <div className="text-xs text-text-secondary truncate opacity-80">{user.role}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onLogout(); }} title="Logout" className="text-text-tertiary hover:text-danger p-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                    </button>
                </div>
                
                {onInstall && (
                    <button onClick={onInstall} className="w-full flex items-center gap-3 p-2 rounded-lg text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-xs font-bold uppercase tracking-wider">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Install App
                    </button>
                )}
                
                <ThemeSwitcher />
            </div>
        </div>
    );
};
