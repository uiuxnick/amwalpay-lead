import React, { useState, useEffect } from 'react';
import { SettingsService, EmailService } from '../services/backend';
import { AppSettings, DEFAULT_CONFIG, FormConfig } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    id: 'config', appName: 'Amwal Survey', appIconUrl: '',
    config: DEFAULT_CONFIG, smtpConfig: {}
  });
  const [activeTab, setActiveTab] = useState<'app' | 'form' | 'smtp'>('app');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    SettingsService.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
        await SettingsService.updateSettings(settings);
        setMessage('Configuration saved successfully! Reload app to see changes.');
    } catch (e: any) {
        let msg = e.message || "Unknown error";
        if (msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("42P01")) msg = "Missing Database Table. Run the SQL Fix below.";
        setMessage(`Error: ${msg}`);
    } finally {
        setLoading(false);
    }
  };

  const handleTestEmail = async () => {
      if (!testEmail) {
          alert("Please enter a recipient email for testing.");
          return;
      }
      setSendingTest(true);
      try {
          await EmailService.sendTest(settings.smtpConfig || {}, testEmail);
          alert("Test email simulated successfully! Check the browser console.");
      } catch (e: any) {
          alert(`Test failed: ${e.message}`);
      } finally {
          setSendingTest(false);
      }
  }

  const handleListChange = (key: keyof FormConfig, index: number, val: string) => {
      if (!settings.config) return;
      const newList = [...(settings.config[key] as string[])];
      newList[index] = val;
      setSettings({ ...settings, config: { ...settings.config, [key]: newList } });
  };
  const handleAddItem = (key: keyof FormConfig) => {
      if (!settings.config) return;
      setSettings({ ...settings, config: { ...settings.config, [key]: [...(settings.config[key] as string[]), ''] } });
  };
  const handleRemoveItem = (key: keyof FormConfig, index: number) => {
      if (!settings.config) return;
      setSettings({ ...settings, config: { ...settings.config, [key]: (settings.config[key] as string[]).filter((_, i) => i !== index) } });
  };
  const handleIndustryChange = (index: number, field: 'name' | 'sub', val: string, subIndex?: number) => {
      if (!settings.config) return;
      const newInd = [...settings.config.industries];
      if (field === 'name') newInd[index].name = val;
      else if (field === 'sub' && subIndex !== undefined) newInd[index].subIndustries[subIndex] = val;
      setSettings({ ...settings, config: { ...settings.config, industries: newInd } });
  };
  const handleAddSub = (indIndex: number) => {
      if (!settings.config) return;
      const newInd = [...settings.config.industries];
      newInd[indIndex].subIndustries.push('');
      setSettings({ ...settings, config: { ...settings.config, industries: newInd } });
  };

  // Updated Input Class for Dark Mode (White BG, Black Text, Light Color Scheme for Pickers)
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-slate-900 [color-scheme:light]";
  const labelClass = "block text-xs font-bold text-text-secondary mb-1.5";
  const tabClass = (tab: string) => `px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === tab ? 'bg-card border-border border-b-card -mb-px border text-primary' : 'text-text-tertiary border-transparent border-b-border border hover:text-text'}`;

  return (
    <div className="p-4 md:p-6 pb-24 max-w-4xl mx-auto">
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-extrabold text-text tracking-tight">App Settings</h1>
         <button onClick={handleSave} disabled={loading} className="px-6 py-2 primary-gradient-bg text-white rounded-lg hover:opacity-90 shadow-lg font-bold text-sm">
            {loading ? 'Saving...' : 'Save Changes'}
         </button>
       </div>
       
       <div className="flex border-b border-border my-6">
           <button onClick={() => setActiveTab('app')} className={tabClass('app')}>App Branding</button>
           <button onClick={() => setActiveTab('form')} className={tabClass('form')}>Form & CRM Lists</button>
           <button onClick={() => setActiveTab('smtp')} className={tabClass('smtp')}>SMTP & Notifications</button>
       </div>

       <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          {message && (
              <div className={`p-4 mb-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <p className="font-bold">{message}</p>
              </div>
          )}

          {activeTab === 'app' && (
              <div className="space-y-6">
                  <div>
                      <label className={labelClass}>App Name</label>
                      <input type="text" value={settings.appName} onChange={e => setSettings({ ...settings, appName: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                      <label className={labelClass}>App Icon URL</label>
                      <input type="text" value={settings.appIconUrl} onChange={e => setSettings({ ...settings, appIconUrl: e.target.value })} className={inputClass} />
                      <div className="mt-2 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border border-border overflow-hidden"><img src={settings.appIconUrl} alt="Preview" className="w-full h-full object-cover" /></div>
                          <div className="text-xs text-text-tertiary">Preview of icon used for PWA and Header.</div>
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'form' && settings.config && (
              <div className="space-y-8">
                  <div>
                      <h3 className="font-bold text-text mb-4 border-b border-border pb-2">Industries & Sub-Industries</h3>
                      <div className="space-y-4">
                          {settings.config.industries.map((ind, idx) => (
                              <div key={idx} className="border border-border rounded-lg p-4 bg-card-secondary/30">
                                  <div className="flex items-center gap-2 mb-2">
                                      <input value={ind.name} onChange={e => handleIndustryChange(idx, 'name', e.target.value)} className="flex-1 px-3 py-1.5 border rounded bg-white text-slate-900 font-bold text-sm" placeholder="Industry Name" />
                                      <button onClick={() => setSettings({...settings, config: {...settings.config!, industries: settings.config!.industries.filter((_, i) => i !== idx)}})} className="text-red-500 px-2">✕</button>
                                  </div>
                                  <div className="pl-4 space-y-2 border-l-2 border-border">
                                      {ind.subIndustries.map((sub, sIdx) => (
                                          <div key={sIdx} className="flex items-center gap-2">
                                              <span className="text-text-tertiary">↳</span>
                                              <input value={sub} onChange={e => handleIndustryChange(idx, 'sub', e.target.value, sIdx)} className="flex-1 px-2 py-1 border rounded text-xs bg-white text-slate-900" placeholder="Sub Industry" />
                                              <button onClick={() => setSettings({...settings, config: {...settings.config!, industries: settings.config!.industries.map((industry, i) => i === idx ? {...industry, subIndustries: industry.subIndustries.filter((_, si) => si !== sIdx)} : industry)}})} className="text-red-400 text-xs">✕</button>
                                          </div>
                                      ))}
                                      <button onClick={() => handleAddSub(idx)} className="text-xs text-primary font-bold mt-1">+ Add Sub-Industry</button>
                                  </div>
                              </div>
                          ))}
                          <button onClick={() => setSettings({...settings, config: {...settings.config!, industries: [...settings.config!.industries, {name: '', subIndustries: []}]}})} className="bg-primary text-white px-3 py-1.5 rounded text-sm font-bold shadow">+ New Industry</button>
                      </div>
                  </div>

                  {['platforms', 'acquirers', 'leadSources'].map(key => (
                      <div key={key}>
                          <h3 className="font-bold text-text mb-4 border-b border-border pb-2 capitalize">{key.replace('leadSources', 'Lead Sources')}</h3>
                          <div className="grid grid-cols-2 gap-2">
                              {(settings.config![key as keyof FormConfig] as string[]).map((p: string, idx: number) => (
                                  <div key={idx} className="flex gap-2">
                                      <input value={p} onChange={e => handleListChange(key as keyof FormConfig, idx, e.target.value)} className="flex-1 px-3 py-1.5 border rounded bg-white text-slate-900 text-sm" />
                                      <button onClick={() => handleRemoveItem(key as keyof FormConfig, idx)} className="text-red-500">✕</button>
                                  </div>
                              ))}
                          </div>
                          <button onClick={() => handleAddItem(key as keyof FormConfig)} className="mt-2 text-sm text-primary font-bold">+ Add Item</button>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'smtp' && (
              <div className="space-y-6">
                  <h3 className="font-bold text-text text-lg">SMTP Configuration</h3>
                  <p className="text-sm text-text-secondary -mt-4">Configure your email server to send meeting reminders.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div><label className={labelClass}>SMTP Host</label><input type="text" value={settings.smtpConfig?.host || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, host: e.target.value}})} className={inputClass} placeholder="smtp.example.com" /></div>
                      <div><label className={labelClass}>SMTP Port</label><input type="number" value={settings.smtpConfig?.port || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, port: Number(e.target.value)}})} className={inputClass} placeholder="587" /></div>
                  </div>
                  <div><label className={labelClass}>SMTP Username</label><input type="text" value={settings.smtpConfig?.user || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, user: e.target.value}})} className={inputClass} placeholder="user@example.com" /></div>
                  <div><label className={labelClass}>SMTP Password</label><input type="password" value={settings.smtpConfig?.pass || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, pass: e.target.value}})} className={inputClass} placeholder="••••••••" /></div>
                  
                  <div>
                      <label className={labelClass}>Encryption</label>
                      <select value={settings.smtpConfig?.encryption || 'none'} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, encryption: e.target.value as any}})} className={inputClass}>
                          <option value="none">None</option>
                          <option value="ssl">SSL</option>
                          <option value="tls">TLS</option>
                          <option value="starttls">STARTTLS</option>
                      </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                      <div><label className={labelClass}>From Address</label><input type="email" value={settings.smtpConfig?.fromAddress || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, fromAddress: e.target.value}})} className={inputClass} placeholder="notifications@amwal.com" /></div>
                      <div><label className={labelClass}>From Name</label><input type="text" value={settings.smtpConfig?.fromName || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, fromName: e.target.value}})} className={inputClass} placeholder="Amwal System" /></div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                      <h3 className="font-bold text-text text-sm mb-3 uppercase tracking-wide">Test Configuration</h3>
                      <div className="flex gap-3">
                          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Enter recipient email" className={`flex-1 ${inputClass}`} />
                          <button onClick={handleTestEmail} disabled={sendingTest} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50">
                              {sendingTest ? 'Sending...' : 'Send Test Email'}
                          </button>
                      </div>
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};