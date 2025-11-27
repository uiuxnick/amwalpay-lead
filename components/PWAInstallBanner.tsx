import React from 'react';

export const PWAInstallBanner: React.FC<{ onInstall: () => void; onDismiss: () => void; isIos: boolean; }> = ({ onInstall, onDismiss, isIos }) => {
  return (
    <div className="fixed z-[100] bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:w-96 p-4 pointer-events-none flex justify-center md:justify-end">
      <div className="glassmorphism rounded-2xl shadow-2xl p-5 w-full max-w-sm pointer-events-auto animate-slide-up relative">
        
        <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
        </button>

        <div className="flex items-start gap-4">
          <div className="primary-gradient-bg p-3 rounded-xl shrink-0 flex items-center justify-center w-12 h-12 text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Install App</h3>
            
            {isIos ? (
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <p>Install this app on your iPhone for the best experience:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <li>Tap the <span className="font-bold text-primary">Share</span> icon below.</li>
                        <li>Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.</li>
                    </ol>
                </div>
            ) : (
                <>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">Add to home screen for offline access and instant loading.</p>
                    <button onClick={onInstall} className="w-full primary-gradient-bg text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-md hover:opacity-90 transition-all active:scale-95 relative overflow-hidden group">
                        Install Now
                        <span className="absolute inset-0 animate-neon-glow opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </button>
                </>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};
