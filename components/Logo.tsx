
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-16" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Icon Container */}
        <div className="bg-white rounded-xl p-1.5 h-full w-auto aspect-square flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0">
            <img 
              src="https://amwalpay.om/wp-content/uploads/2023/11/WhatsApp-Image-2025-04-20-at-12.04.42.jpeg" 
              alt="Amwal Logo" 
              className="h-full w-full object-contain" 
            />
        </div>
        {/* Text Section */}
        <div className="flex flex-col justify-center h-full min-w-0">
            <h1 className="font-black text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap flex items-center" style={{ fontSize: '140%' }}>
                Amwal<span className="text-primary">Pay</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mt-0.5 truncate">
                Survey Portal
            </span>
        </div>
    </div>
  );
};
