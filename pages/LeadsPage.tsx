import React, { useState, useEffect, useRef } from 'react';
import { LeadService, UserService, SettingsService } from '../services/backend';
import { Lead, User, UserRole, LeadStatus, DEFAULT_CONFIG, FormConfig, SyncStatus } from '../types';
import { LeadForm } from '../components/LeadForm';
import { AiScoreModal } from '../components/AiScoreModal';

interface LeadsPageProps {
  currentUser: User;
  initialFilters?: { dateFrom?: string, dateTo?: string, userFilter?: string, industry?: string, service?: string };
  showFavoritesOnly?: boolean;
  initialViewMode?: 'list' | 'detail';
}

const getStatusBadge = (status: string) => {
    const colors: any = { 
        [LeadStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        [LeadStatus.PROCESSING]: 'bg-purple-100 text-purple-800 border-purple-200', // Added PROCESSING
        [LeadStatus.ACCEPTED]: 'bg-blue-100 text-blue-800 border-blue-200', 
        [LeadStatus.CLOSED_WON]: 'bg-green-100 text-green-800 border-green-200', 
        [LeadStatus.CLOSED_LOST]: 'bg-red-100 text-red-800 border-red-200' 
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${colors[status] || 'bg-gray-100'}`}>
          {status.replace('_', ' ')}
      </span>
    );
};

const SyncIndicator: React.FC<{ status?: SyncStatus }> = ({ status }) => {
    if (!status || status === 'synced') return null;
    const icon = {
        pending: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-500 animate-pulse-cloud"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>,
        failed: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>,
    }[status];
    return <div className="absolute top-3 right-3" title={`Status: ${status}`}>{icon}</div>;
};


export const LeadsPage: React.FC<LeadsPageProps> = ({ currentUser, initialFilters, showFavoritesOnly = false, initialViewMode = 'list' }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<FormConfig>(DEFAULT_CONFIG);
  
  // View Modes: List, Detail, Kanban
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'kanban'>(initialViewMode === 'detail' ? 'detail' : 'list');
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  
  const [loading, setLoading] = useState(true);
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>(initialFilters?.industry || '');
  const [filterDateFrom, setFilterDateFrom] = useState<string>(initialFilters?.dateFrom || '');
  const [filterDateTo, setFilterDateTo] = useState<string>(initialFilters?.dateTo || '');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const data = await LeadService.getAll(currentUser);
    const settings = await SettingsService.getSettings();
    if(settings.config) setConfig(settings.config);
    
    let filtered = isAdmin ? data : data.filter(l => l.userId === currentUser.id);
    
    if (showFavoritesOnly) {
        filtered = filtered.filter(l => l.isFavorite);
    }
    setLeads(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    if (isAdmin) {
        const uData = await UserService.getAll();
        setUsers(uData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [currentUser, showFavoritesOnly]);

  useEffect(() => {
      if (initialViewMode === 'detail') {
          setViewMode('detail');
          setEditingLead(undefined);
      }
  }, [initialViewMode]);

  const filteredLeads = leads.filter(lead => {
     const matchesSearch = !searchTerm || 
        lead.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.mobile.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesStatus = !filterStatus || lead.status === filterStatus;
     const matchesIndustry = !filterIndustry || lead.industry === filterIndustry;

     const createdAt = new Date(lead.createdAt);
     const from = filterDateFrom ? new Date(filterDateFrom) : null;
     const to = filterDateTo ? new Date(filterDateTo) : null;
     if (from && createdAt < from) return false;
     if (to) {
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
     }
     
     return matchesSearch && matchesStatus && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleRowClick = (lead: Lead) => {
      setEditingLead(lead);
      setViewMode('detail');
      window.scrollTo(0,0);
  };

  const handleCreateNew = () => {
      setEditingLead(undefined);
      setViewMode('detail');
      window.scrollTo(0,0);
  };

  const handleBack = () => {
      setViewMode('list');
      setEditingLead(undefined);
  };

  const handleExport = () => {
    const headers = ['ID', 'Owner Name', 'Mobile', 'Email', 'Industry', 'Service', 'Status', 'Created At'];
    const rows = filteredLeads.map(l => [l.id, `"${l.ownerName}"`, `"${l.mobile}"`, l.email, l.industry, l.serviceNeeded, l.status, l.createdAt]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          const rows = text.split('\n').slice(1); // Skip header
          let successCount = 0;
          
          for (const row of rows) {
              const cols = row.split(',');
              if (cols.length < 3) continue;
              try {
                  // Basic mapping assuming CSV format: Name, Mobile, Email, Industry, Service
                  await LeadService.create({
                      ownerName: cols[0]?.trim() || 'Imported Lead',
                      mobile: cols[1]?.trim() || '',
                      email: cols[2]?.trim() || '',
                      industry: cols[3]?.trim() || 'Other',
                      serviceNeeded: cols[4]?.trim() || 'Other',
                      leadSource: 'Import',
                      leadType: 'WARM',
                      socialLinks: []
                  }, currentUser);
                  successCount++;
              } catch (err) {
                  console.error("Failed row", row);
              }
          }
          alert(`Successfully imported ${successCount} leads.`);
          setImportModalOpen(false);
          await fetchAll();
      };
      reader.readAsText(file);
  };

  const handleAssign = async (userId: string) => {
      if (!editingLead) return;
      await LeadService.update(editingLead.id, { assignedTo: userId }, currentUser);
      await fetchAll();
      setEditingLead({ ...editingLead, assignedTo: userId });
  };

  const handleStatusChange = async (newStatus: string) => {
      if (!editingLead) return;
      await LeadService.update(editingLead.id, { status: newStatus as LeadStatus }, currentUser);
      await fetchAll();
      setEditingLead({ ...editingLead, status: newStatus as LeadStatus });
  };

  const handleToggleFavorite = async () => {
      if (!editingLead) return;
      const newVal = !editingLead.isFavorite;
      await LeadService.update(editingLead.id, { isFavorite: newVal }, currentUser);
      await fetchAll();
      setEditingLead({ ...editingLead, isFavorite: newVal });
  };

  const handleDelete = async () => {
    if (!editingLead) return;
    if (window.confirm(`Are you sure you want to delete lead "${editingLead.ownerName}"? This action cannot be undone.`)) {
        try {
            await LeadService.delete(editingLead.id, currentUser);
            await fetchAll();
            handleBack();
        } catch (err: any) {
            alert(`Error deleting lead: ${err.message}`);
        }
    }
  };

  // --- Kanban Logic ---
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
      setDraggedLeadId(leadId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
      e.preventDefault();
      if (!draggedLeadId) return;
      
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.status !== newStatus) {
          // Optimistic update
          const updatedLeads = leads.map(l => l.id === draggedLeadId ? { ...l, status: newStatus } : l);
          setLeads(updatedLeads);
          
          try {
              await LeadService.update(draggedLeadId, { status: newStatus }, currentUser);
          } catch (error) {
              // Revert if failed
              console.error("Failed to update status", error);
              fetchAll();
          }
      }
      setDraggedLeadId(null);
  };

  // High contrast input style for Dark Mode
  const filterInputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900 [color-scheme:light]";

  // --- Detail View ---
  if (viewMode === 'detail') {
      const isReadOnly = !!editingLead && !isAdmin && !currentUser.permissions?.canEdit;
      return (
          <div className="bg-slate-50 min-h-full flex flex-col">
              {editingLead && <AiScoreModal lead={editingLead} isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />}
              <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-3">
                  <div className="flex items-center gap-4">
                      <button onClick={handleBack} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.94 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                          Back
                      </button>
                      <h1 className="text-lg font-bold text-slate-900">
                          {editingLead ? (isReadOnly ? 'View Details' : 'Edit Details') : 'New Lead'}
                      </h1>
                  </div>
                  
                  {editingLead && (
                      <div className="flex flex-wrap items-center gap-3">
                          <button onClick={() => setIsAiModalOpen(true)} className="px-3 py-2 text-xs font-bold text-white primary-gradient-bg rounded-lg shadow-md hover:opacity-90 transition-opacity">
                            ✨ AI Insights
                          </button>
                          
                          <button 
                            onClick={handleToggleFavorite}
                            className={`p-2 rounded-full transition-colors ${editingLead.isFavorite ? 'text-yellow-400 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400'}`}
                            title="Toggle Favorite"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {(isAdmin || currentUser.permissions?.canDelete) && (
                            <button onClick={handleDelete} className="px-3 py-2 text-xs font-bold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-opacity">
                              Delete
                            </button>
                          )}

                          <select 
                            value={editingLead.status} 
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isReadOnly}
                            className={`text-xs font-bold uppercase px-3 py-2 rounded-lg border-2 outline-none ${ isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer' } ${
                                editingLead.status === LeadStatus.PENDING ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                                editingLead.status === LeadStatus.PROCESSING ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                editingLead.status === LeadStatus.ACCEPTED ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                editingLead.status === LeadStatus.CLOSED_WON ? 'bg-green-50 text-green-800 border-green-200' :
                                'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                              <option value={LeadStatus.PENDING}>PENDING</option>
                              <option value={LeadStatus.PROCESSING}>PROCESSING</option>
                              <option value={LeadStatus.ACCEPTED}>ACCEPTED</option>
                              <option value={LeadStatus.CLOSED_WON}>WON</option>
                              <option value={LeadStatus.CLOSED_LOST}>LOST</option>
                          </select>

                          {isAdmin && (
                              <select 
                                value={editingLead.assignedTo || ''}
                                onChange={(e) => handleAssign(e.target.value)}
                                className="text-sm border border-slate-300 rounded-lg px-2 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none"
                              >
                                  <option value="">Assign To...</option>
                                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                          )}
                      </div>
                  )}
              </div>
              <div className="flex-1 max-w-5xl mx-auto w-full py-6 px-4">
                  <LeadForm 
                      currentUser={currentUser} 
                      initialData={editingLead} 
                      onSubmit={async (d) => { 
                          editingLead ? await LeadService.update(editingLead.id, d, currentUser) : await LeadService.create(d, currentUser); 
                          await fetchAll(); 
                          handleBack();
                      }} 
                      onCancel={handleBack}
                      isReadOnly={isReadOnly}
                  />
              </div>
          </div>
      );
  }

  // --- Main List/Kanban View ---
  return (
    <div className="p-4 md:p-6 space-y-4 min-h-screen pb-24 relative">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
          <div className="flex-1 flex gap-4">
             <input 
                type="text" 
                placeholder="Search by name, phone, or email..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
              />
              {/* View Toggle */}
              <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex shrink-0">
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-600'}`} title="List View">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-600'}`} title="Kanban Board">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2 6a2 2 0 012-2h4a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm9 0a2 2 0 012-2h4a2 2 0 012 2v7a2 2 0 01-2 2h-4a2 2 0 01-2-2V6z" /></svg>
                  </button>
              </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setImportModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 011.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" /></svg> Import
            </button>
            <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg> Export
            </button>
            <button onClick={handleCreateNew} className="primary-gradient-bg text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                New Lead
            </button>
          </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-slate-200 dark:border-border shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={filterInputClass}/>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={filterInputClass}/>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className={filterInputClass}>
              <option value="">All Statuses</option>
              {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
           <select value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setCurrentPage(1); }} className={filterInputClass}>
              <option value="">All Industries</option>
              {config.industries.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
          </select>
      </div>

      {viewMode === 'kanban' ? (
          <div className="flex overflow-x-auto gap-4 pb-4 h-[calc(100vh-280px)]">
              {Object.values(LeadStatus).map(status => {
                  const statusLeads = filteredLeads.filter(l => l.status === status);
                  return (
                      <div 
                        key={status} 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                        className="min-w-[300px] w-[300px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                          <div className={`p-3 border-b border-slate-200 dark:border-slate-700 rounded-t-xl font-bold text-sm flex justify-between sticky top-0 bg-inherit z-10 ${
                              status === LeadStatus.PENDING ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                              status === LeadStatus.PROCESSING ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' :
                              status === LeadStatus.ACCEPTED ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                              status === LeadStatus.CLOSED_WON ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                              'text-red-600 bg-red-50 dark:bg-red-900/20'
                          }`}>
                              <span>{status.replace('_', ' ')}</span>
                              <span className="bg-white dark:bg-slate-800 px-2 rounded-full text-xs border border-current">{statusLeads.length}</span>
                          </div>
                          <div className="p-2 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                              {statusLeads.map(lead => (
                                  <div 
                                    key={lead.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                    onClick={() => handleRowClick(lead)}
                                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                                  >
                                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{lead.ownerName}</h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lead.industry}</p>
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                          <span className={`text-[10px] font-bold px-1.5 rounded ${lead.leadType === 'HOT' ? 'bg-rose-100 text-rose-700' : lead.leadType === 'WARM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                              {lead.leadType === 'HOT' ? '🔥' : lead.leadType === 'WARM' ? '☀️' : '❄️'} {lead.leadType}
                                          </span>
                                          <span className="text-[10px] text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )
              })}
          </div>
      ) : (
        <>
            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
                {loading ? <div className="text-center py-10 text-slate-400">Loading...</div> : 
                filteredLeads.length === 0 ? <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">No leads found.</div> : 
                currentLeads.map(lead => (
                    <div key={lead.id} onClick={() => handleRowClick(lead)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform relative">
                        {lead.isFavorite && <div className="absolute top-1 right-1 text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.681 4.062a1 1 0 00.951.692h4.286c.837 0 1.18 1.074.545 1.59l-3.46 2.508a1 1 0 00-.364 1.118l1.373 4.223c.244.752-.642 1.4-1.296.956L10 15.65l-3.46 2.508c-.654.444-1.54-.204-1.296-.956l1.373-4.223a1 1 0 00-.364-1.118L2.038 9.226c-.635-.516-.292-1.59.545-1.59h4.286a1 1 0 00.951-.692l1.681-4.062z" clipRule="evenodd" /></svg>
                        </div>}
                        <SyncIndicator status={lead.syncStatus} />
                        <div className="flex justify-between items-start mb-1 pr-6">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">{lead.ownerName}</h3>
                                <p className="text-xs text-slate-500">{lead.mobile}</p>
                            </div>
                            {getStatusBadge(lead.status)}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{lead.industry}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-4 py-2">Client</th>
                                <th className="px-4 py-2">Industry</th>
                                <th className="px-4 py-2">Service</th>
                                <th className="px-4 py-2 text-center">Date</th>
                                <th className="px-4 py-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">Loading...</td></tr> : 
                            filteredLeads.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">No leads found.</td></tr> : 
                            currentLeads.map(lead => (
                                    <tr 
                                        key={lead.id} 
                                        onClick={() => handleRowClick(lead)} 
                                        className="hover:bg-primary-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-2 relative">
                                            {lead.isFavorite && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-yellow-400 text-xs">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 1.75a.75.75 0 01.692 1.032l-1.32 3.242a.75.75 0 00.564.978l3.432.343a.75.75 0 01.428 1.283l-2.62 2.24a.75.75 0 00-.216.67l.794 3.232a.75.75 0 01-1.09.808L8 13.511l-2.73 1.584a.75.75 0 01-1.09-.808l.794-3.232a.75.75 0 00-.216-.67l-2.62-2.24a.75.75 0 01.428-1.283l3.432-.343a.75.75 0 00.564-.978L7.308 2.782A.75.75 0 018 1.75z" clipRule="evenodd" /></svg>
                                            </span>}
                                            <SyncIndicator status={lead.syncStatus} />
                                            <div className="flex flex-col ml-2">
                                                <span className="font-bold text-slate-900">{lead.ownerName}</span>
                                                <span className="text-[11px] text-slate-500">{lead.mobile}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                {lead.industry}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 truncate max-w-[150px]">
                                            {lead.serviceNeeded}
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs text-slate-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {getStatusBadge(lead.status)}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border rounded hover:bg-slate-50 disabled:opacity-50 text-sm">Prev</button>
                    <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border rounded hover:bg-slate-50 disabled:opacity-50 text-sm">Next</button>
                </div>
            )}
        </>
      )}

      {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-grow">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Import Leads (CSV)</h3>
                  <div className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                          Upload a CSV file with headers: Name, Mobile, Email, Industry, Service.
                      </p>
                      <label className="block w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <span className="text-primary font-bold">Click to Upload CSV</span>
                          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                      </label>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setImportModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm">Cancel</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};