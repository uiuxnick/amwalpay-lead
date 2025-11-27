
import React, { useState, useEffect } from 'react';
import { Meeting, User } from '../types';

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Meeting, 'id' | 'createdAt'>) => Promise<void>;
  initialDate: string;
  currentUser: User;
}

export const MeetingFormModal: React.FC<MeetingFormModalProps> = ({ isOpen, onClose, onSubmit, initialDate, currentUser }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('09:00');
  const [description, setDescription] = useState('');
  const [imageData, setImageData] = useState('');
  const [reminder, setReminder] = useState(false); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (isOpen && initialDate) setDate(initialDate);
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setImageData(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title, date, time, description, imageData, userId: currentUser.id, reminder
      });
      onClose();
    } catch (e) {
      alert("Failed to save meeting");
    } finally {
      setLoading(false);
    }
  };

  // Dark mode: white bg, black text, light color scheme for date pickers
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-white border border-slate-200 dark:border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-slate-900 placeholder-slate-400 transition-all [color-scheme:light]";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-grow">
      <div className="glassmorphism w-full max-w-md rounded-2xl shadow-2xl p-6 bg-white dark:bg-slate-800">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Meeting</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClass}>Title *</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Meeting with..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Date *</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Time *</label><input type="time" required value={time} onChange={e => setTime(e.target.value)} className={inputClass} /></div>
            </div>
            <div>
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Agenda or notes..." />
            </div>
            <div>
                <label className={labelClass}>Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                {imageData && <img src={imageData} alt="Preview" className="mt-2 h-20 w-auto rounded border" />}
            </div>
            <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                <input id="reminder" type="checkbox" checked={reminder} onChange={e => setReminder(e.target.checked)} className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                <label htmlFor="reminder" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">Set Email Reminder</label>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 primary-gradient-bg text-white rounded-lg text-sm font-bold hover:opacity-90">{loading ? 'Saving...' : 'Save Meeting'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};
