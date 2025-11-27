import React, { useState } from 'react';
import { Lead, User, LeadStatus, UserRole } from '../types';
import { InteractionLog } from './InteractionLog';
import { FilePreviewModal } from './FilePreviewModal';
import { AiScoreModal } from './AiScoreModal';
import { MeetingFormModal } from './MeetingFormModal';
import { MeetingService } from '../services/backend';

interface TaskDetailModalProps {
  lead: Lead;
  currentUser: User;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ lead, currentUser, onUpdate, onClose }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info'); 
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const canEdit = currentUser.role === UserRole.ADMIN || (currentUser.permissions?.canEdit ?? false);

  const handleStatusChange = async (newStatus: LeadStatus) => await onUpdate(lead.id, { status: newStatus });
  const handleToggleFavorite = async () => await onUpdate(lead.id, { isFavorite: !lead.isFavorite });

  const handleAddLog = async (type: 'COMMENT' | 'SMS' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP', content: string) => {
      const log = { id: Date.now().toString(), type, content, createdBy: currentUser.name, createdAt: new Date().toISOString() };
      const newLogs = [...(lead.interactionLog || []), log];
      await onUpdate(lead.id, { interactionLog: newLogs as any });
  };

  const handleMeetingSubmit = async (data: any) => {
      await MeetingService.create({
          ...data,
          description: `Meeting for lead: ${lead.ownerName}\n${data.description || ''}`
      });
      await handleAddLog('MEETING', `Scheduled meeting: ${data.title} on ${data.date} at ${data.time}`);
      setIsMeetingModalOpen(false);
  };

  const InfoRow: React.FC<{ label: string, value?: string | React.ReactNode, className?: string }> = ({ label, value, className }) => (
      <div className={`py-3 border-b border-border last:border-0 ${className}`}>
          <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{label}</p>
          <div className="text-sm text-text font-medium break-words mt-0.5">{value || '-'}</div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4 animate-modal-grow">
      <AiScoreModal lead={lead} isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      
      {/* Meeting Modal nested */}
      <MeetingFormModal 
        isOpen={isMeetingModalOpen} 
        onClose={() => setIsMeetingModalOpen(false)} 
        onSubmit={handleMeetingSubmit}
        currentUser={currentUser}
        initialDate={new Date().toISOString().split('T')[0]}
      />

      <div className="bg-background w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-border bg-card shrink-0 z-10">
            <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-3 h-10 rounded-full ${lead.leadType === 'HOT' ? 'bg-rose-500' : lead.leadType === 'WARM' ? 'bg-amber-500' : 'bg-sky-500'}`}></div>
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-text truncate">{lead.ownerName}</h2>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="truncate">{lead.industry}</span>
                        {lead.serviceNeeded && <><span className="opacity-50">•</span><span className="truncate">{lead.serviceNeeded}</span></>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
                 <button onClick={() => setIsAiModalOpen(true)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white primary-gradient-bg rounded-lg shadow-md hover:opacity-90 transition-opacity">
                    ✨ AI Insights
                 </button>
                <select value={lead.status} onChange={(e) => handleStatusChange(e.target.value as LeadStatus)} disabled={!canEdit} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 outline-none transition-colors appearance-none text-center ${!canEdit ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${
                    lead.status === LeadStatus.PENDING ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                    lead.status === LeadStatus.PROCESSING ? 'bg-purple-100 text-purple-800 border-purple-200' : 
                    lead.status === LeadStatus.ACCEPTED ? 'bg-sky-100 text-sky-800 border-sky-200' :
                    lead.status === LeadStatus.CLOSED_WON ? 'bg-green-100 text-green-800 border-green-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-text-secondary rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
            </div>
        </div>

        <div className="flex md:hidden border-b border-border bg-card">
            <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-secondary'}`}>Details</button>
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-secondary'}`}>Activity</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className={`md:w-1/2 xl:w-1/3 bg-card border-r border-border overflow-y-auto p-4 md:p-6 custom-scrollbar ${activeTab === 'chat' ? 'hidden md:block' : 'block'}`}>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">📞 Contact Info</h4>
                        <InfoRow label="Mobile" value={lead.mobile} />
                        <InfoRow label="Email" value={lead.email} />
                        <InfoRow label="Main POC" value={lead.mainPoc} />
                        {(lead.latitude && lead.longitude) && <InfoRow label="Location" value={<a href={`https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">View on Map</a>} />}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">🏢 Business Details</h4>
                        <InfoRow label="Industry" value={`${lead.industry} ${lead.subIndustry ? `> ${lead.subIndustry}` : ''}`} />
                        <InfoRow label="Platform" value={lead.platform} />
                        <InfoRow label="Acquirer" value={lead.acquirer} />
                        <InfoRow label="GMV" value={lead.gmv} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">💡 Lead Context</h4>
                        <InfoRow label="Source" value={lead.leadSource} />
                        <InfoRow label="Initial Notes" value={<p className="text-sm text-text-secondary italic">"{lead.remarks || 'None'}"</p>} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {/* High Contrast Dark Mode Button: White background, Black text */}
                        {lead.crFileData && (
                            <button 
                                onClick={() => setIsPreviewOpen(true)} 
                                className="w-full py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-slate-100 transition-all shadow-sm border border-slate-200"
                            >
                                📄 View Document
                            </button>
                        )}
                        <button 
                            onClick={handleToggleFavorite} 
                            className={`w-full py-2 border rounded-lg text-sm font-bold transition-all shadow-sm ${
                                lead.isFavorite 
                                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                    : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            {lead.isFavorite ? '⭐ Unfavorite' : '☆ Favorite'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`flex-1 flex flex-col h-full relative ${activeTab === 'info' ? 'hidden md:flex' : 'flex'}`}>
                <div className="absolute inset-0 flex flex-col">
                    <InteractionLog 
                        lead={lead} 
                        currentUser={currentUser} 
                        onAddLog={handleAddLog} 
                        onScheduleMeeting={() => setIsMeetingModalOpen(true)}
                    />
                </div>
            </div>
        </div>
      </div>

      <FilePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} fileName={lead.crFileName || 'Document'} fileUrl={lead.crFileData} file={null} />
    </div>
  );
};