
import React, { useState, useEffect, useCallback } from 'react';
import { AuthService, SettingsService, SyncService } from './services/backend';
import { User, UserRole, SyncStatus } from './types';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { LeadsPage } from './pages/LeadsPage';
import { TasksPage } from './pages/TasksPage'; 
import { UsersPage } from './pages/UsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MeetingsPage } from './pages/MeetingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { Logo } from './components/Logo';
import { PWAInstallBanner } from './components/PWAInstallBanner';

const AppLoader: React.FC = () => (
    <div className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg flex flex-col items-center justify-center z-[100]">
        <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
    </div>
);

const SyncStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<SyncStatus>('synced');
    const [count, setCount] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const checkStatus = useCallback(() => {
        const { status, count } = SyncService.getStatus();
        setStatus(status);
        setCount(count);
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        window.addEventListener('online', checkStatus);
        window.addEventListener('offline', checkStatus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', checkStatus);
            window.removeEventListener('offline', checkStatus);
        }
    }, [checkStatus]);

    const handleRetry = async () => {
        setIsSyncing(true);
        await SyncService.processOfflineQueue();
        checkStatus();
        setIsSyncing(false);
    }
    
    const Icon = {
        synced: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>,
        pending: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 animate-pulse-cloud"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>,
        failed: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>,
    }[status];

    const message = {
        synced: 'All data is synced to the cloud.',
        pending: `${count} item(s) are waiting to be synced.`,
        failed: `${count} item(s) failed to sync. Please retry.`,
    }[status];

    return (
        <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <div className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-full bg-card-secondary border border-border/80 shadow-sm text-text-secondary">
                {isSyncing ? <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div> : Icon}
                <span className="hidden lg:inline text-xs font-semibold capitalize">{isSyncing ? 'Syncing...' : status}</span>
            </div>
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-card p-3 rounded-xl shadow-2xl z-50 border border-border text-sm animate-modal-grow">
                    <p className="font-semibold">{message}</p>
                    {status !== 'synced' && navigator.onLine && (
                        <button onClick={handleRetry} disabled={isSyncing} className="w-full text-center mt-3 px-3 py-2 primary-gradient-bg text-white rounded-lg text-xs font-bold hover:opacity-80 disabled:opacity-50 transition-opacity">
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    )}
                    {!navigator.onLine && <p className="mt-2 text-amber-600 text-xs">You are offline. Connect to the internet to sync data.</p>}
                </div>
            )}
        </div>
    );
}

const App: React.FC = () => {
  const [appLoading, setAppLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState('dashboard'); 
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const [leadFilters, setLeadFilters] = useState({});

  useEffect(() => {
    const initApp = async () => {
        const user = AuthService.getCurrentUser();
        if (user) setCurrentUser(user);
        
        try {
            const settings = await SettingsService.getSettings();
            document.title = settings.appName;
            const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (appleIcon && settings.appIconUrl) appleIcon.href = settings.appIconUrl;
        } catch (e) { console.error(e); }

        setTimeout(() => setAppLoading(false), 1000);
    };

    initApp();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
        SyncService.processOfflineQueue().then(({ synced }) => {
            if (synced > 0) {
                if ('vibrate' in navigator) navigator.vibrate(100);
                if (activePage === 'leads' || activePage === 'dashboard') window.location.reload(); 
            }
        });
    };
    
    const checkPlatform = () => {
        const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(inStandalone);
        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIos(ios);
    };
    checkPlatform();

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!isStandalone) setShowInstallBanner(true);
    };

    const handleAppInstalled = () => { setDeferredPrompt(null); setShowInstallBanner(false); setIsStandalone(true); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (navigator.onLine) SyncService.processOfflineQueue();

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, activePage]);

  const handleLoginSuccess = () => { setCurrentUser(AuthService.getCurrentUser()); setActivePage('dashboard'); };
  const handleLogout = () => { AuthService.logout(); setCurrentUser(null); };
  const handleDashboardNavigate = (filters: any) => { setLeadFilters(filters); setActivePage('leads'); };

  const handleInstallClick = () => {
      setShowInstallBanner(false);
      if (isIos) {
          alert("To install: Tap the 'Share' icon and then 'Add to Home Screen'.");
      }
      else if (deferredPrompt) {
          deferredPrompt.prompt();
      } else {
          alert("Installation can be done through your browser's menu (usually 'Add to Home Screen' or 'Install App').");
      }
  };

  const getPageTitle = (page: string) => {
    const titles: { [key: string]: string } = {
        dashboard: '📊 Dashboard',
        leads: '📂 All Leads',
        favorites: '⭐ Favorites',
        tasks: '✅ My Tasks',
        meetings: '🗓️ Meetings',
        reports: '📈 Reports & Analytics',
        users: '👥 User Management',
        settings: '⚙️ Settings',
        profile: '👤 My Profile',
        'new-lead': '➕ New Lead Form',
    };
    return titles[page] || page.replace('-', ' ');
  };
  
  const renderContent = () => {
    if (!currentUser) return null;

    const pageClass = "flex-1 overflow-y-auto scroll-smooth h-full bg-background";
    switch (activePage) {
        case 'dashboard': return <div className={pageClass}><DashboardPage currentUser={currentUser} onNavigate={handleDashboardNavigate} /></div>;
        case 'leads': return <div className={pageClass}><LeadsPage currentUser={currentUser} initialFilters={leadFilters} /></div>;
        case 'favorites': return <div className={pageClass}><LeadsPage currentUser={currentUser} showFavoritesOnly={true} /></div>;
        case 'tasks': return <div className={pageClass}><TasksPage currentUser={currentUser} /></div>;
        case 'meetings': return <div className={pageClass}><MeetingsPage currentUser={currentUser} /></div>;
        case 'reports': return <div className={pageClass}>{currentUser.role === UserRole.ADMIN ? <ReportsPage /> : <div className="p-6">Unauthorized</div>}</div>;
        case 'users': return <div className={pageClass}>{currentUser.role === UserRole.ADMIN ? <UsersPage /> : <div className="p-6">Unauthorized</div>}</div>;
        case 'settings': return <div className={pageClass}>{currentUser.role === UserRole.ADMIN ? <SettingsPage /> : <div className="p-6">Unauthorized</div>}</div>;
        case 'profile': return <div className={pageClass}><ProfilePage currentUser={currentUser} /></div>;
        case 'new-lead': return <div className={pageClass}><LeadsPage currentUser={currentUser} initialViewMode="detail" /></div>;
        default: return <div className="p-8 font-mono text-red-400">404: Page not found</div>;
    }
  };

  if (appLoading) return <AppLoader />;
  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 shrink-0">
        <Sidebar 
            user={currentUser} 
            activePage={activePage} 
            onNavigate={setActivePage} 
            onLogout={handleLogout} 
            onInstall={deferredPrompt ? handleInstallClick : undefined}
        />
      </div>
      {/* Mobile Sidebar (off-canvas) */}
      <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} flex`}>
         <div className="w-64">
           <Sidebar 
                user={currentUser} 
                activePage={activePage} 
                onNavigate={(page) => { setActivePage(page); setIsMobileOpen(false); }} 
                onLogout={handleLogout} 
                onInstall={deferredPrompt ? handleInstallClick : undefined}
            />
         </div>
         <div className="flex-1 bg-black/60" onClick={() => setIsMobileOpen(false)}></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-card/80 backdrop-blur-lg border-b border-border h-16 flex items-center justify-between px-4 shrink-0 z-20 sticky top-0">
          <Logo className="h-10" />
          <div className="flex items-center gap-2">
            <SyncStatusIndicator />
            <button onClick={() => setIsMobileOpen(true)} className="p-2 text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-card/80 backdrop-blur-lg border-b border-border h-20 items-center justify-between px-8 shrink-0 z-10 sticky top-0">
            <h1 className="text-2xl font-bold text-text capitalize tracking-tight">{getPageTitle(activePage)}</h1>
            <div className="flex items-center gap-4">
              <SyncStatusIndicator />
            </div>
        </header>
        
        <main className="flex-1 flex flex-col min-h-0">
            {renderContent()}
        </main>
        
        <BottomNav activePage={activePage} onNavigate={setActivePage} user={currentUser} />
        
        {showInstallBanner && <PWAInstallBanner onInstall={handleInstallClick} onDismiss={() => setShowInstallBanner(false)} isIos={isIos} />}
      </div>
    </div>
  );
};

export default App;
