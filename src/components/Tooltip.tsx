import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [active, setActive] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-950',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-x-4 border-x-transparent border-b-4 border-b-slate-900 dark:border-b-slate-950',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-y-4 border-y-transparent border-l-4 border-l-slate-900 dark:border-l-slate-950',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-950'
  };

  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {children}
      {active && content && (
        <div className={`absolute z-50 w-64 p-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-950 text-[10px] font-bold text-white dark:text-slate-200 shadow-xl ring-1 ring-white/10 backdrop-blur-sm pointer-events-none leading-relaxed transition-all duration-150 scale-100 ${positionClasses[position]}`}>
          <span className="block text-[8px] font-black text-indigo-400 dark:text-indigo-350 uppercase tracking-widest mb-1">
            💡 Indicación Informativa
          </span>
          {content}
          <div className={`absolute h-0 w-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
