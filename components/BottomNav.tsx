
import React from 'react';
import { User } from '../types';

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: User;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', emoji: '📊' },
    { id: 'leads', label: 'Leads', emoji: '📂' },
    { id: 'new-lead', label: 'New', emoji: '➕' },
    { id: 'meetings', label: 'Calendar', emoji: '🗓️' },
    { id: 'tasks', label: 'Tasks', emoji: '✅' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-40 pb-safe border-t border-slate-800">
      <div className="grid grid-cols-5 items-center h-16">
        {navItems.map(item => {
          if (item.id === 'new-lead') {
            return (
              <div key={item.id} className="flex justify-center relative">
                  <button 
                    onClick={() => onNavigate('new-lead')}
                    className="w-14 h-14 -mt-8 rounded-full primary-gradient-bg text-white shadow-lg shadow-primary/50 flex flex-col items-center justify-center transform active:scale-90 transition-transform border-4 border-black"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                  </button>
              </div>
            );
          }
          const isActive = activePage === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ease-in-out transform ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="text-xl mb-1">
                {item.id === 'dashboard' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>}
                {item.id === 'leads' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" /></svg>}
                {item.id === 'meetings' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM11.25 15.75a.75.75 0 100 1.5.75.75 0 000-1.5zM15.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100 1.5.75.75 0 000-1.5z" /><path fillRule="evenodd" d="M7.5 1.5a.75.75 0 01.75.75V3h7.5V2.25a.75.75 0 011.5 0V3h.75A2.25 2.25 0 0120.25 5.25v13.5A2.25 2.25 0 0118 5.25H6a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 016 3h.75V2.25a.75.75 0 01.75-.75zm0 3.75a.75.75 0 01.75.75v.75h7.5v-.75a.75.75 0 011.5 0v.75h.75a.75.75 0 01.75.75v11.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V6.75a.75.75 0 01.75-.75h.75v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>}
                {item.id === 'tasks' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>}
              </span>
              <span className={`text-[10px] mt-0.5 font-bold`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
