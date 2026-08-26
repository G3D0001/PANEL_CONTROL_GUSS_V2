import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { cn } from '../lib/utils';

interface TokenMeterProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function TokenMeter({ className, showTitle = true, compact = false }: TokenMeterProps) {
  const [usage, setUsage] = useState(GeminiService.getUsage());

  useEffect(() => {
    const handleUpdate = () => {
      setUsage(GeminiService.getUsage());
    };

    window.addEventListener('ai_usage_updated', handleUpdate);
    return () => window.removeEventListener('ai_usage_updated', handleUpdate);
  }, []);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-colors duration-150 duration-500",
              usage.percentage > 80 ? "bg-rose-500" : usage.percentage > 50 ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${usage.percentage}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
          {usage.count}/{usage.limit} IA
        </span>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4", className)}>
      {showTitle && (
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">analytics</span>
          Consumo de IA (Varita)
        </h4>
      )}
      <div className="space-y-4">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-500">Uso Diario</span>
          <span className={cn(
            usage.percentage > 90 ? "text-rose-500" : "text-primary"
          )}>
            {usage.count} / {usage.limit} peticiones
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-colors duration-150 duration-1000",
              usage.percentage > 80 ? "bg-rose-500" : usage.percentage > 50 ? "bg-amber-500" : "bg-primary",
              usage.count > 0 && ""
            )}
            style={{ width: `${usage.percentage}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 italic leading-tight">
          {usage.percentage >= 100 
            ? "⚠️ Has alcanzado el límite diario gratuito. Se restablecerá mañana."
            : "*Sujeto a las políticas de uso gratuito de Google Gemini. El límite se reinicia cada 24hs."}
        </p>
      </div>
    </div>
  );
}
