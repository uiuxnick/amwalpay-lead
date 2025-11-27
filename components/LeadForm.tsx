
import React, { useState, useEffect } from 'react';
import { Lead, SocialLink, User, UserRole, LeadStatus, LeadType, AppSettings, DEFAULT_CONFIG, SERVICES } from '../types';
import { SettingsService } from '../services/backend';
import { FilePreviewModal } from './FilePreviewModal';

interface LeadFormProps {
  initialData?: Lead;
  currentUser: User;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isModal?: boolean;
  isReadOnly?: boolean;
}

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h3 className="text-sm font-extrabold text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="text-primary">{icon}</span>
            {title}
        </h3>
        <div className="space-y-5">
            {children}
        </div>
    </div>
)

export const LeadForm: React.FC<LeadFormProps> = ({ initialData, currentUser, onSubmit, onCancel, isModal = false, isReadOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState('');
  
  const [ownerName, setOwnerName] = useState(initialData?.ownerName || '');
  const [mainPoc, setMainPoc] = useState(initialData?.mainPoc || '');
  const [countryCode, setCountryCode] = useState('+968');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState(initialData?.email || '');
  
  const [latitude, setLatitude] = useState<number | undefined>(initialData?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialData?.longitude);

  const [crNumber, setCrNumber] = useState(initialData?.crNumber || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [subIndustry, setSubIndustry] = useState(initialData?.subIndustry || '');
  const [leadSource, setLeadSource] = useState(initialData?.leadSource || '');
  
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [acquirer, setAcquirer] = useState(initialData?.acquirer || '');
  const [gmv, setGmv] = useState(initialData?.gmv || '');
  const [serviceNeeded, setServiceNeeded] = useState(initialData?.serviceNeeded || '');
  
  const [leadType, setLeadType] = useState<LeadType>(initialData?.leadType || LeadType.WARM);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
      (initialData?.socialLinks && initialData.socialLinks.length > 0) 
      ? initialData.socialLinks 
      : [{ type: 'Instagram', url: '' }]
  );
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  
  const [crFileName, setCrFileName] = useState(initialData?.crFileName || '');
  const [crFileData, setCrFileData] = useState(initialData?.crFileData || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    SettingsService.getSettings().then(s => { 
        if(s.config) setConfig({ ...DEFAULT_CONFIG, ...s.config }); 
    });
    if (initialData?.mobile) {
      const parts = initialData.mobile.split(' ');
      if (parts.length > 1) { setCountryCode(parts[0]); setMobile(parts.slice(1).join(' ')); }
      else setMobile(initialData.mobile);
    }
  }, [initialData]);

  const availableSubIndustries = config?.industries?.find(i => i.name === industry)?.subIndustries || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => { setCrFileData(reader.result as string); setCrFileName(file.name); setSelectedFile(file); };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoadingLoc(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please check browser permissions.");
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddSocialLink = () => setSocialLinks([...socialLinks, { type: 'Instagram', url: '' }]);
  const handleRemoveSocialLink = (index: number) => setSocialLinks(socialLinks.filter((_, i) => i !== index));

  const handleSocialLinkChange = (index: number, field: 'type' | 'url', value: string) => {
      const newLinks = [...socialLinks];
      newLinks[index] = { ...newLinks[index], [field]: value };
      setSocialLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError('');
    try {
      setLoading(true);
      await onSubmit({
        ownerName, mainPoc, mobile: `${countryCode} ${mobile}`, email,
        latitude, longitude, crNumber, industry, subIndustry, leadSource, platform, 
        acquirer, gmv, serviceNeeded, socialLinks: socialLinks.filter(l => l.url.trim() !== ''),
        remarks, leadType, crFileName, crFileData
      });
    } catch (e: any) {
      setError(e.message || "Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };
  
  // IMPORTANT: Explicit white bg and black text for dark mode inputs with color-scheme:light
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-slate-900 placeholder-slate-400 transition-all shadow-sm disabled:bg-slate-200/50 disabled:cursor-not-allowed [color-scheme:light]";
  const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[right_1rem_center] pr-8`;
  const labelClass = "block text-xs font-bold text-text-secondary mb-1.5";

  const priorityClasses: Record<LeadType, string> = {
    [LeadType.HOT]: 'bg-rose-500 text-white shadow-rose-200',
    [LeadType.WARM]: 'bg-amber-500 text-white shadow-amber-200',
    [LeadType.COLD]: 'bg-sky-500 text-white shadow-sky-200',
  }

  return (
    <div className="bg-transparent h-full">
      <form onSubmit={handleSubmit} className="space-y-8 w-full pb-48">
        {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200 text-sm font-semibold">{error}</div>}
        
        {/* Priority Section - High Contrast in Dark Mode */}
        <div className="bg-slate-50 dark:bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
            <h2 className="text-xs text-slate-500 dark:text-black font-extrabold uppercase tracking-wide">Lead Priority</h2>
            <div className="flex bg-white dark:bg-slate-100 p-1 rounded-lg border border-slate-200 dark:border-slate-300">
                {[LeadType.HOT, LeadType.WARM, LeadType.COLD].map(t => (
                    <button key={t} type="button" onClick={() => setLeadType(t)} disabled={isReadOnly} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${leadType === t ? `${priorityClasses[t]} shadow-md` : 'text-slate-500 hover:text-slate-900'} disabled:opacity-70`}>
                        {t === 'HOT' ? '🔥' : t === 'WARM' ? '☀️' : '❄️'} {t}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
            <Section title="👤 Contact Details" icon={<></>}>
                <div><label className={labelClass}>Owner Name *</label><input required value={ownerName} onChange={e => setOwnerName(e.target.value)} className={inputClass} placeholder="Full Name" disabled={isReadOnly} /></div>
                <div><label className={labelClass}>Main Point of Contact</label><input value={mainPoc} onChange={e => setMainPoc(e.target.value)} className={inputClass} placeholder="Manager Name (Optional)" disabled={isReadOnly} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Mobile *</label>
                        <div className="flex gap-2">
                            <input className="w-20 text-center px-1 py-2.5 bg-slate-50 dark:bg-white border border-border rounded-lg text-slate-900 text-sm shadow-sm [color-scheme:light]" value={countryCode} onChange={e => setCountryCode(e.target.value)} disabled={isReadOnly} />
                            <input required type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className={inputClass} placeholder="12345678" disabled={isReadOnly} />
                        </div>
                    </div>
                    <div><label className={labelClass}>Email *</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="email@domain.com" disabled={isReadOnly} /></div>
                </div>
                <div>
                     <label className={labelClass}>📍 Location (GPS)</label>
                     <div className="flex items-center gap-3">
                         <button type="button" onClick={handleGetLocation} disabled={loadingLoc || isReadOnly} className="flex-1 bg-card border border-primary-200 text-primary-700 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-50 flex items-center justify-center gap-2 disabled:opacity-50 dark:bg-slate-800 dark:text-primary-400 dark:border-primary-900 dark:hover:bg-slate-700">
                             {loadingLoc ? 'Getting...' : 'Capture Current Location'}
                         </button>
                         {latitude && longitude && <a href={`https://www.google.com/maps?q=${latitude},${longitude}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg border border-green-200 hover:bg-green-200" title="View on Map"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.42-.238.698-.422.28-.184.6-.4.964-.663l.004-.002a28.4 28.4 0 002.438-1.662 29.255 29.255 0 002.34-1.928A24.409 24.409 0 0019 10c0-5.523-4.477-10-10-10S1 4.477 1 10c0 2.136.67 4.14 1.87 5.855.02.03.04.06.06.09.06.09.12.18.18.27a29.11 29.11 0 001.99 2.344 28.37 28.37 0 001.662 2.438l.002.004.004.004.01.004.008.018.007.012a5.74 5.74 0 00.14.282zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></a>}
                     </div>
                     {latitude && longitude && <p className="text-[10px] text-text-tertiary mt-1 font-mono">Lat: {latitude.toFixed(5)}, Long: {longitude.toFixed(5)}</p>}
                </div>
            </Section>

            <Section title="🏢 Business Profile" icon={<></>}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Industry *</label>
                        <select required value={industry} onChange={e => { setIndustry(e.target.value); setSubIndustry(''); }} className={selectClass} disabled={isReadOnly}><option value="">Select...</option>{config?.industries?.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}</select>
                    </div>
                    <div>
                        <label className={labelClass}>Sub-Category</label>
                        <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)} className={selectClass} disabled={!industry || isReadOnly}><option value="">Select...</option>{availableSubIndustries.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>CR Number</label><input value={crNumber} onChange={e => setCrNumber(e.target.value)} className={inputClass} placeholder="CR..." disabled={isReadOnly} /></div>
                    <div>
                        <label className={labelClass}>Lead Source</label>
                        <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className={selectClass} disabled={isReadOnly}><option value="">Select...</option>{config?.leadSources?.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                </div>
            </Section>
        </div>
        
        <Section title="💻 Tech & Financials" icon={<></>}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div><label className={labelClass}>Current Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className={selectClass} disabled={isReadOnly}><option value="">None</option>{config?.platforms?.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className={labelClass}>Existing Acquirer</label><select value={acquirer} onChange={e => setAcquirer(e.target.value)} className={selectClass} disabled={isReadOnly}><option value="">None</option>{config?.acquirers?.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div><label className={labelClass}>Expected GMV</label><select value={gmv} onChange={e => setGmv(e.target.value)} className={selectClass} disabled={isReadOnly}><option value="">Select Range</option>{config?.gmvRanges?.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label className={labelClass}>Service Needed *</label><select required value={serviceNeeded} onChange={e => setServiceNeeded(e.target.value)} className={selectClass} disabled={isReadOnly}><option value="">Select Service</option>{SERVICES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
        </Section>
        
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Section title="📝 Remarks & Attachments" icon={<></>}>
                    <div><label className={labelClass}>Notes</label><textarea value={remarks} onChange={e => setRemarks(e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Enter initial remarks here..." disabled={isReadOnly} /></div>
                    <div>
                        <label className={labelClass}>Upload CR / Doc</label>
                        <div className="flex items-center gap-2 mt-1">
                            <label className={`flex-1 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-card text-center transition-colors ${isReadOnly ? 'cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <span className="text-xs font-medium text-text-secondary truncate block">{crFileName || "Choose File"}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} disabled={isReadOnly} />
                            </label>
                            {crFileData && <button type="button" onClick={() => setIsPreviewOpen(true)} className="p-3 bg-card border border-primary-200 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-50 shadow-sm dark:bg-slate-800 dark:border-primary-900 dark:text-primary-400">View</button>}
                        </div>
                    </div>
                </Section>
            </div>
            <div className="lg:col-span-1">
                <Section title="🔗 Social Links" icon={<></>}>
                <div className="space-y-2">
                    {socialLinks.map((link, i) => (
                        <div key={i} className="flex gap-2">
                            <select value={link.type} onChange={e => handleSocialLinkChange(i, 'type', e.target.value)} className={`w-32 ${selectClass} px-2`} disabled={isReadOnly}>
                                <option>Instagram</option><option>Website</option><option>Social</option><option>Other</option>
                            </select>
                            <input value={link.url} onChange={e => handleSocialLinkChange(i, 'url', e.target.value)} className={inputClass} placeholder="https://..." disabled={isReadOnly} />
                            {socialLinks.length > 1 && <button type="button" onClick={() => handleRemoveSocialLink(i)} className="text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full font-bold disabled:opacity-50" disabled={isReadOnly}>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                            </button>}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddSocialLink} className="mt-3 text-xs bg-card border border-primary-200 text-primary-600 font-bold px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 dark:bg-slate-800 dark:border-primary-900 dark:text-primary-400" disabled={isReadOnly}>+ Add Link</button>
            </Section>
            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-card/60 backdrop-blur-lg p-4 border-t border-border flex justify-end gap-4 z-[50] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
            <button type="button" onClick={onCancel} className="px-6 py-3 border border-border rounded-lg text-text-secondary font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">{isReadOnly ? 'Back' : 'Cancel'}</button>
            {!isReadOnly && <button type="submit" disabled={loading} className="px-8 py-3 primary-gradient-bg text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-all transform active:scale-95 disabled:opacity-70 text-sm relative overflow-hidden group">
                {loading ? 'Saving...' : 'Save Lead'}
                <span className="absolute inset-0 primary-gradient-bg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </button>}
        </div>
      </form>
      <FilePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} fileName={crFileName} file={selectedFile} fileUrl={crFileData} />
    </div>
  );
};
