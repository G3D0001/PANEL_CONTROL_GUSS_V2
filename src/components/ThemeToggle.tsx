import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'icon' | 'pill';
}

export function ThemeToggle({ className = '', variant = 'button' }: ThemeToggleProps) {
  const { uiSettings, updateUISettings } = useApp();
  const isDark = uiSettings.theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    updateUISettings({ theme: nextTheme });
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        id="btn-theme-toggle-pill"
        onClick={toggleTheme}
        title={isDark ? 'Cambiar a Modo Claro (HD)' : 'Cambiar a Modo Oscuro'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer select-none ${
          isDark
            ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700 shadow-sm'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun size={14} className="text-amber-400 animate-spin-slow" />
            <span className="text-[11px] font-bold">Modo Claro</span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-indigo-600" />
            <span className="text-[11px] font-bold">Modo Oscuro</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      id="btn-theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a Modo Claro (HD)' : 'Cambiar a Modo Oscuro'}
      className={`size-9 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer select-none ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-400 border-slate-700 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-300 shadow-sm'
      } ${className}`}
    >
      {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
    </button>
  );
}
