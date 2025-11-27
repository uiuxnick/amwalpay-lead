
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/backend';
import { User, UserRole } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await UserService.getAll()); } 
    catch (e) { console.error("Failed to fetch users", e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenCreate = () => {
    setEditingUser({ role: UserRole.USER, isActive: true, permissions: { canEdit: false, canDelete: false } });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    const { password, ...userWithoutPassword } = user;
    setEditingUser({ ...userWithoutPassword, permissions: user.permissions || { canEdit: false, canDelete: false } });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { ...editingUser };
      if (payload.id && (!payload.password || payload.password.trim() === '')) delete payload.password;
      if (payload.id) await UserService.update(payload.id, payload);
      else {
        if (!payload.password) throw new Error("Password is required for new users");
        await UserService.create(payload as any);
      }
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const executeDelete = async () => {
    if (!userToDelete?.id) return;
    try {
      await UserService.delete(userToDelete.id);
      await fetchUsers();
      setUserToDelete(null);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
      setUserToDelete(null);
    }
  };

  // Dark mode specific: white bg, black text, light color scheme
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-white border border-slate-200 dark:border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-slate-900 [color-scheme:light]";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <button onClick={handleOpenCreate} className="px-4 py-2 primary-gradient-bg text-white rounded-lg hover:opacity-90 shadow-lg text-sm font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Create User
        </button>
      </div>

      <div className="md:hidden space-y-3">
        {users.map(user => (
            <div key={user.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-text text-lg">{user.name}</h3>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === UserRole.ADMIN ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-800'}`}>{user.role}</span>
                    <div className="flex gap-2">
                         <button onClick={() => handleEdit(user)} className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100">Edit</button>
                         {user.id !== 'admin-1' && <button onClick={() => setUserToDelete(user)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100">Delete</button>}
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="hidden md:block bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-card-secondary/30 text-text-secondary font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-3">Name</th><th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Permissions</th><th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-card-secondary/20 transition-colors">
                <td className="px-6 py-4">
                    <div className="font-medium text-text">{user.name}</div>
                    <div className="text-xs text-text-tertiary">{user.email}</div>
                </td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === UserRole.ADMIN ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-800'}`}>{user.role}</span></td>
                <td className="px-6 py-4 text-xs text-text-secondary">
                   {user.role === UserRole.ADMIN ? <span className="text-primary font-semibold">Full Access</span> : (
                       <div className="flex flex-col gap-1">
                           <span className={user.permissions?.canEdit ? 'text-green-600' : 'text-red-500'}>Edit: {user.permissions?.canEdit ? 'Yes' : 'No'}</span>
                           <span className={user.permissions?.canDelete ? 'text-green-600' : 'text-red-500'}>Delete: {user.permissions?.canDelete ? 'Yes' : 'No'}</span>
                       </div>
                   )}
                </td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(user)} className="text-primary hover:text-primary-700 mr-4 font-semibold transition-colors">Edit</button>
                  {user.id !== 'admin-1' && <button type="button" onClick={() => setUserToDelete(user)} className="text-red-600 hover:text-red-800 font-semibold transition-colors">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-grow">
          <div className="glassmorphism rounded-xl shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingUser.id ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{formError}</div>}
              <div><label className={labelClass}>Name</label><input required type="text" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className={inputClass} /></div>
              <div><label className={labelClass}>{editingUser.id ? 'New Password (Optional)' : 'Password'}</label><input type="password" placeholder={editingUser.id ? 'Leave blank to keep current' : ''} value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className={inputClass} /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className={labelClass}>Role</label><select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className={inputClass}><option value={UserRole.USER}>User</option><option value={UserRole.ADMIN}>Admin</option></select></div>
                <div className="flex-1"><label className={labelClass}>Status</label><select value={editingUser.isActive ? 'true' : 'false'} onChange={e => setEditingUser({...editingUser, isActive: e.target.value === 'true'})} className={inputClass}><option value="true">Active</option><option value="false">Inactive</option></select></div>
              </div>
              {editingUser.role === UserRole.USER && (
                  <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Permissions</label>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingUser.permissions?.canEdit || false} onChange={e => setEditingUser({...editingUser, permissions: { ...(editingUser.permissions || {canDelete:false}), canEdit: e.target.checked }})} className="w-4 h-4 text-primary rounded focus:ring-primary border-slate-300" /><span className="text-sm text-slate-900 dark:text-white">Can Edit Leads</span></label>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingUser.permissions?.canDelete || false} onChange={e => setEditingUser({...editingUser, permissions: { ...(editingUser.permissions || {canEdit:false}), canDelete: e.target.checked }})} className="w-4 h-4 text-primary rounded focus:ring-primary border-slate-300" /><span className="text-sm text-slate-900 dark:text-white">Can Delete Leads</span></label>
                      </div>
                  </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 primary-gradient-bg text-white rounded-lg hover:opacity-90 font-semibold transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-grow">
          <div className="glassmorphism rounded-xl shadow-lg max-w-sm w-full p-6 bg-white dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>? This action is irreversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold">Cancel</button>
              <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm font-semibold">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
