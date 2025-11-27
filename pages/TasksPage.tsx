import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/backend';
import { Lead, User, LeadStatus, LeadType, UserRole } from '../types';
import { TaskDetailModal } from '../components/TaskDetailModal';

interface TasksPageProps {
  currentUser: User;
}

export const TasksPage: React.FC<TasksPageProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Lead | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const allLeads = await LeadService.getAll(currentUser);
    
    // Filter tasks based on role
    if (currentUser.role === UserRole.ADMIN) {
        // Admin sees:
        // 1. Leads assigned specifically to them
        // 2. ANY lead in 'PROCESSING' status (needs attention)
        setTasks(allLeads.filter(l => 
            l.assignedTo === currentUser.id || 
            l.status === LeadStatus.PROCESSING
        ));
    } else {
        // Regular user sees only leads assigned to them
        setTasks(allLeads.filter(l => l.assignedTo === currentUser.id));
    }
    
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [currentUser]);

  const getStatusPill = (status: string) => {
    const styles: Record<string, string> = {
        [LeadStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        [LeadStatus.PROCESSING]: 'bg-purple-100 text-purple-800 border-purple-200', // Added PROCESSING
        [LeadStatus.ACCEPTED]: 'bg-blue-100 text-blue-800 border-blue-200',
        [LeadStatus.CLOSED_WON]: 'bg-green-100 text-green-800 border-green-200',
        [LeadStatus.CLOSED_LOST]: 'bg-red-100 text-red-800 border-red-200',
    }
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100'}`}>{status.replace('_', ' ')}</span>
  };
  
  const getPriorityBorder = (type: LeadType) => ({
    [LeadType.HOT]: 'border-l-4 border-red-500',
    [LeadType.WARM]: 'border-l-4 border-orange-400',
    [LeadType.COLD]: 'border-l-4 border-blue-400'
  })[type] || 'border-l-4 border-slate-300';

  return (
    <div className="p-4 md:p-6 pb-24">
        {loading ? <div className="text-center py-12 text-slate-400">
            <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin"></div>
            </div>
            Loading tasks...
        </div> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tasks.map(task => (
                    <div key={task.id} onClick={() => setSelectedTask(task)} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer relative ${getPriorityBorder(task.leadType)}`}>
                        {task.isFavorite && <div className="absolute top-3 right-3 text-yellow-400" title="Favorite">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.681 4.062a1 1 0 00.951.692h4.286c.837 0 1.18 1.074.545 1.59l-3.46 2.508a1 1 0 00-.364 1.118l1.373 4.223c.244.752-.642 1.4-1.296.956L10 15.65l-3.46 2.508c-.654.444-1.54-.204-1.296-.956l1.373-4.223a1 1 0 00-.364-1.118L2.038 9.226c-.635-.516-.292-1.59.545-1.59h4.286a1 1 0 00.951-.692l1.681-4.062z" clipRule="evenodd" /></svg>
                        </div>}
                        <h3 className="font-bold text-slate-900 text-lg truncate pr-8">{task.ownerName}</h3>
                        <div className="flex gap-2 my-2">
                             <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{task.industry}</span>
                             <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded font-medium border border-primary-100">{task.serviceNeeded}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            {getStatusPill(task.status)}
                            <button className="text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">Open</button>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-slate-300 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-slate-500 text-lg">🎉 No pending tasks!</p>
                        <p className="text-sm text-slate-400">You're all caught up.</p>
                    </div>
                )}
            </div>
        )}

        {selectedTask && (
            <TaskDetailModal 
                lead={selectedTask} 
                currentUser={currentUser}
                onClose={() => setSelectedTask(null)}
                onUpdate={async (id, updates) => {
                    await LeadService.update(id, updates, currentUser);
                    fetchTasks();
                    setSelectedTask({ ...selectedTask, ...updates });
                }}
            />
        )}
    </div>
  );
};