import React, { useState } from 'react';
import { User } from '../types';
import { UserService } from '../services/backend';

interface ProfilePageProps {
  currentUser: User;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser }) => {
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');
      try {
          const updates: any = { name, avatarUrl };
          if (password) updates.password = password;
          await UserService.update(currentUser.id, updates);
          setMessage('Profile updated successfully!');
          setPassword('');
      } catch (e: any) {
          setMessage('Error: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const reader = new FileReader();
          reader.onload = () => setAvatarUrl(reader.result as string);
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-slate-900 placeholder-slate-400 transition-all shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-600 mb-1.5";

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-6">My Profile</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleSave} className="space-y-6">
                {message && <div className={`p-3 rounded-lg text-sm font-semibold ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}

                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full primary-gradient-bg p-1 overflow-hidden">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white shadow-md">
                                {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">{name.charAt(0)}</div>}
                            </div>
                        </div>
                        <label className="absolute bottom-1 right-1 primary-gradient-bg text-white p-2 rounded-full cursor-pointer shadow-lg hover:opacity-90 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" disabled value={currentUser.email} className={`${inputClass} bg-slate-200/50 text-slate-500 cursor-not-allowed`} />
                </div>

                <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                    <p className="text-xs text-slate-400 mt-1">Only enter if you want to change it.</p>
                </div>

                <button disabled={loading} className="w-full primary-gradient-bg text-white py-2.5 rounded-lg font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50">
                    {loading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>
        </div>
    </div>
  );
};
