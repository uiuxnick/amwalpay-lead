
import React, { useState, useEffect, useRef } from 'react';
import { Lead, User } from '../types';
import { AIService } from '../services/ai';

interface InteractionLogProps {
  lead: Lead;
  currentUser: User;
  onAddLog: (type: 'COMMENT' | 'SMS' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP', content: string) => Promise<void>;
  onScheduleMeeting?: () => void;
}

export const InteractionLog: React.FC<InteractionLogProps> = ({ lead, currentUser, onAddLog, onScheduleMeeting }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState<'COMMENT' | 'SMS' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP'>('COMMENT');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;
      setLoading(true);
      await onAddLog(type, text); 
      setText('');
      setType('COMMENT');
      setLoading(false);
  };

  const handleSummarize = async () => {
      setIsSummarizing(true);
      try {
          const result = await AIService.summarizeInteractions(lead.interactionLog || []);
          setSummary(result);
      } catch (e: any) {
          setSummary(`Error: ${e.message}`);
      } finally {
          setIsSummarizing(false);
      }
  };

  const handleDraftReply = async () => {
      setIsDrafting(true);
      try {
          const draft = await AIService.draftFollowUp(lead);
          setText(draft);
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setIsDrafting(false);
      }
  };

  const handleTypeClick = (t: 'COMMENT' | 'SMS' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP') => {
      setType(t);
      
      // Direct Actions
      if (t === 'CALL') {
          if (lead.mobile) window.open(`tel:${lead.mobile.replace(/\s/g, '')}`);
          else alert("No mobile number available for this lead.");
      } else if (t === 'EMAIL') {
          if (lead.email) window.open(`mailto:${lead.email}`);
          else alert("No email address available for this lead.");
      } else if (t === 'WHATSAPP') {
          if (lead.mobile) {
              // Remove all non-numeric characters for WhatsApp link
              const cleanNumber = lead.mobile.replace(/[^0-9]/g, '');
              window.open(`https://wa.me/${cleanNumber}`);
          } else {
              alert("No mobile number available for this lead.");
          }
      } else if (t === 'MEETING' && onScheduleMeeting) {
          onScheduleMeeting();
      }
  };

  useEffect(() => {
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [lead.interactionLog, summary]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);


  const logs = lead.interactionLog || [];

  const icons: {[key: string]: string} = {
      CALL: '📞',
      SMS: '✉️',
      MEETING: '🤝',
      COMMENT: '💬',
      EMAIL: '📧',
      WHATSAPP: '💬'
  };

  // Updated actions list: Removed SMS, Added Email & WhatsApp
  const actionButtons = [
      { id: 'CALL', label: 'Call', emoji: '📞' },
      { id: 'EMAIL', label: 'Email', emoji: '📧' },
      { id: 'WHATSAPP', label: 'WhatsApp', emoji: '💬' },
      { id: 'MEETING', label: 'Meeting', emoji: '🤝' },
      { id: 'COMMENT', label: 'Comment', emoji: '💬' },
  ];

  return (
    <div className="flex flex-col h-full relative bg-slate-100 dark:bg-slate-900 w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-36">
            {logs.length > 2 && !summary && (
                <div className="flex justify-center my-2">
                    <button onClick={handleSummarize} disabled={isSummarizing} className="bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full text-xs font-bold text-primary hover:bg-primary-50 transition-all shadow-sm flex items-center gap-2">
                        {isSummarizing ? 'Thinking...' : '✨ Summarize with AI'}
                    </button>
                </div>
            )}
            {summary && (
                <div className="bg-card border-l-4 border-primary p-4 my-4 relative text-text rounded-r-lg shadow-md">
                    <button onClick={() => setSummary(null)} className="absolute top-2 right-2 text-text-tertiary hover:text-text p-1">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    </button>
                    <h4 className="font-bold text-sm mb-2 text-primary-600">AI Summary</h4>
                    <div className="text-sm space-y-1 whitespace-pre-wrap prose prose-sm text-text-secondary">{summary}</div>
                </div>
            )}
            
            {logs.length === 0 && (
                <div className="text-center py-16 text-text-tertiary flex flex-col items-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-base font-semibold text-text-secondary">No activity recorded</p>
                    <p className="text-xs mt-1">Add a note or update to start the timeline.</p>
                </div>
            )}
            
            {logs.map((log, idx) => {
                const isMe = log.createdBy === currentUser.name;
                // Dark Mode High Contrast: Explicitly white background with black text for bubbles
                const bubbleClass = isMe 
                    ? 'primary-gradient-bg text-white rounded-br-lg' 
                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-lg';

                return (
                    <div key={idx} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm text-white ring-2 ring-white ${isMe ? 'primary-gradient-bg' : 'bg-slate-400'}`}>
                            {log.createdBy.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed relative ${bubbleClass}`}>
                            <div className={`text-[10px] font-bold mb-1.5 opacity-80 uppercase tracking-wider flex items-center gap-2 ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                {icons[log.type] || '💬'} {log.type} by {log.createdBy}
                            </div>
                            <p className="whitespace-pre-wrap break-words">{log.content}</p>
                            <div className={`text-[9px] mt-2 text-right ${isMe ? 'text-blue-100/70' : 'text-slate-400'}`}>
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 no-scrollbar">
                    {actionButtons.map(btn => (
                        <button key={btn.id} type="button" onClick={() => handleTypeClick(btn.id as any)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors whitespace-nowrap border flex items-center gap-1.5 ${type === btn.id ? 'primary-gradient-bg text-white border-transparent shadow-md' : 'bg-white dark:bg-slate-800 text-text-secondary border-border hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                           <span>{btn.emoji}</span> {btn.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}}
                            className="w-full bg-slate-50 dark:bg-white border-2 border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none resize-none overflow-y-auto text-slate-900 placeholder-slate-400 transition-all"
                            placeholder={`Add note for ${type.toLowerCase()}...`} rows={1}
                        />
                        <button type="button" onClick={handleDraftReply} disabled={isDrafting} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-light p-2 rounded-full hover:bg-primary/10" title="Draft Reply with AI">
                            {isDrafting ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 0110 3z" /><path fillRule="evenodd" d="M11.49 2.176a.75.75 0 01.425.86l-.667 2.667.618.309a.75.75 0 01.353.946l-1.5 3a.75.75 0 01-1.22.257l-.34-.425a.75.75 0 01.03-1.06l1.373-1.372-1.25-5a.75.75 0 01.86-.425zM4.74 3.428a.75.75 0 01.86.425l1.25 5-1.373 1.372a.75.75 0 11-1.09-1.03l.34-.425a.75.75 0 011.22-.257l1.5 3a.75.75 0 01-.353.946l-.618.31-2.667-.668a.75.75 0 01-.425.861 8 8 0 1010.87-6.924.75.75 0 01.21-1.044 8 8 0 00-10.87 6.924z" clipRule="evenodd" /></svg>}
                        </button>
                    </div>
                    <button type="submit" disabled={!text.trim() || loading} className="w-11 h-11 flex items-center justify-center primary-gradient-bg text-white rounded-full shadow-lg hover:opacity-90 transition-all transform active:scale-90 disabled:opacity-50 disabled:scale-100 shrink-0">
                        {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 8.25m0 0l4.341 4.341a.75.75 0 00.95-.826l-1.414-4.949a.75.75 0 00-.826-.95L8.25 11.25l3 3z" /></svg>}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
