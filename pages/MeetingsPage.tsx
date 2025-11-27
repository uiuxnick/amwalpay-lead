
import React, { useState, useEffect } from 'react';
import { Meeting, User } from '../types';
import { MeetingService } from '../services/backend';
import { MeetingFormModal } from '../components/MeetingFormModal';

interface MeetingsPageProps {
  currentUser: User;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({ currentUser }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [calendarOptionsMeeting, setCalendarOptionsMeeting] = useState<Meeting | null>(null);

  const [hoveredDateMeetings, setHoveredDateMeetings] = useState<Meeting[] | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);

  const fetchMeetings = async () => {
      setLoading(true);
      const data = await MeetingService.getAll(currentUser);
      setMeetings(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, [currentUser]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Delete meeting?")) {
          await MeetingService.delete(id);
          fetchMeetings();
      }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, dayMeetings: Meeting[]) => {
    if (dayMeetings.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        setPopoverPosition({ top: rect.bottom + 5, left: rect.left });
        setHoveredDateMeetings(dayMeetings);
    }
  };
  const handleMouseLeave = () => { setPopoverPosition(null); setHoveredDateMeetings(null); };

  const renderCalendarDays = () => {
      const days = [];
      for (let i = 0; i < firstDayOfMonth; i++) { days.push(<div key={`empty-${i}`} className="bg-transparent"></div>); }
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayMeetings = meetings.filter(m => m.date === dateStr);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
          days.push(
              <div key={d} onClick={() => handleDateClick(d)} onMouseEnter={(e) => handleMouseEnter(e, dayMeetings)} onMouseLeave={handleMouseLeave}
                  className={`border border-slate-100 dark:border-slate-700 p-2 min-h-[100px] cursor-pointer hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors relative flex flex-col ${isToday ? 'bg-primary-50/70 dark:bg-primary-900/20' : dayMeetings.length > 0 ? 'bg-violet-50/50 dark:bg-violet-900/20' : 'bg-white dark:bg-slate-800'}`}>
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'primary-gradient-bg text-white' : 'text-slate-700 dark:text-slate-300'}`}>{d}</div>
                  <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar text-[11px]">
                      {dayMeetings.slice(0, 2).map(m => <div key={m.id} className="bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 rounded truncate font-medium border border-violet-200 dark:border-violet-700">{m.time} {m.title}</div>)}
                      {dayMeetings.length > 2 && <div className="text-gray-500 dark:text-gray-400 font-bold mt-1 text-center">+ {dayMeetings.length - 2} more</div>}
                  </div>
                  {dayMeetings.length > 0 && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-violet-500 rounded-full"></div>}
              </div>
          );
      }
      return days;
  };

  const meetingsThisMonth = meetings.filter(m => new Date(m.date).getMonth() === currentDate.getMonth() && new Date(m.date).getFullYear() === currentDate.getFullYear());
  const groupedMeetings = meetingsThisMonth.reduce((acc, m) => ({ ...acc, [m.date]: [...(acc[m.date] || []), m] }), {} as Record<string, Meeting[]>);
  const sortedDates = Object.keys(groupedMeetings).sort();

  return (
    <div className="p-4 md:p-6 pb-24 h-screen flex flex-col">
       <div className="flex justify-between items-center mb-4">
           <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
               <button onClick={handlePrevMonth} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
               </button>
               <span className="font-bold text-sm md:text-base w-32 md:w-40 text-center truncate text-slate-900 dark:text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
               <button onClick={handleNextMonth} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                </button>
           </div>
           <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setIsFormModalOpen(true); }} className="primary-gradient-bg text-white w-10 h-10 rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-transform active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            </button>
       </div>

       <div className="hidden md:flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden">
           <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{day}</div>)}
           </div>
           <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-100 dark:bg-slate-900 gap-px">{renderCalendarDays()}</div>
       </div>

       <div className="md:hidden flex-1 h-full overflow-y-auto custom-scrollbar space-y-6">
           {loading ? <div className="text-center text-slate-400 mt-10">Loading...</div> :
            sortedDates.length === 0 ? <div className="bg-white dark:bg-slate-800 p-8 rounded-lg text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 mx-1 mt-4">No meetings for {currentDate.toLocaleString('default', { month: 'long' })}.</div> :
            sortedDates.map(date => (
                <div key={date} className="space-y-2">
                    <div className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur py-2 px-1 z-10 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{new Date(date).toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        {new Date(date).toDateString() === new Date().toDateString() && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Today</span>}
                    </div>
                    <div className="space-y-3 pl-2 pr-1">
                        {groupedMeetings[date].map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg w-14 h-14 shrink-0 border border-primary-100 dark:border-primary-800">
                                        <span className="text-sm font-bold">{m.time}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{m.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{m.description || 'No details.'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {m.reminder && <span className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1">🔔 Reminder</span>}
                                            <button onClick={(e) => { e.stopPropagation(); setCalendarOptionsMeeting(m); }} className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 hover:bg-blue-100 font-semibold">Add to Calendar</button>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(m.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 -mr-2 -mt-2">
                                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
       </div>

       <MeetingFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} initialDate={selectedDate || ''} currentUser={currentUser} onSubmit={async (data) => { await MeetingService.create(data); fetchMeetings(); }} />
       {calendarOptionsMeeting && <CalendarOptionsModal meeting={calendarOptionsMeeting} onClose={() => setCalendarOptionsMeeting(null)} />}

      {hoveredDateMeetings && popoverPosition && (
          <div style={{ top: popoverPosition.top, left: popoverPosition.left }} className="fixed z-50 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 w-64 animate-modal-grow">
              <h4 className="font-bold text-sm mb-2 border-b dark:border-slate-700 pb-1 text-slate-800 dark:text-white">{new Date(hoveredDateMeetings[0].date).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                  {hoveredDateMeetings.map(m => (
                      <div key={m.id} className="text-xs flex items-center justify-between gap-2 group">
                          <div>
                            <span className="font-bold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded whitespace-nowrap">{m.time}</span>
                            <span className="text-slate-600 dark:text-slate-300 ml-2">{m.title}</span>
                          </div>
                           <button onClick={(e) => { e.stopPropagation(); setCalendarOptionsMeeting(m); }} className="text-[10px] opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 hover:underline">Calendar</button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

const CalendarOptionsModal: React.FC<{meeting: Meeting, onClose: () => void}> = ({ meeting, onClose }) => {
    const handleGoogleCalendar = () => {
        const startTime = new Date(`${meeting.date}T${meeting.time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const toGCalTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${toGCalTime(startTime)}/${toGCalTime(endTime)}&details=${encodeURIComponent(meeting.description || '')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleIcsDownload = () => {
        const startTime = new Date(`${meeting.date}T${meeting.time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const toIcsTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "") + 'Z';

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            `UID:${meeting.id}@amwal-survey.com`,
            `DTSTAMP:${toIcsTime(new Date())}`,
            `DTSTART:${toIcsTime(startTime)}`,
            `DTEND:${toIcsTime(endTime)}`,
            `SUMMARY:${meeting.title}`,
            `DESCRIPTION:${meeting.description || ''}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join('\n');
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-grow">
            <div className="glassmorphism w-full max-w-sm rounded-2xl shadow-2xl p-6 bg-white dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add to Calendar</h3>
                <div className="space-y-3">
                    <button onClick={handleGoogleCalendar} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-6 h-6" alt="Google Calendar"/>
                        <span className="font-semibold text-slate-700 dark:text-white">Google Calendar</span>
                    </button>
                    <button onClick={handleIcsDownload} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-500 dark:text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" /></svg>
                        <span className="font-semibold text-slate-700 dark:text-white">Apple, Outlook, etc. (.ics)</span>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
            </div>
        </div>
    );
};
