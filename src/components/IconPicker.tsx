import React, { useState, useMemo, useRef, useEffect } from 'react';
import { icons } from 'lucide-react';
import { Search } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

// Prepare the list of icon names
const allIconNames = Object.keys(icons);

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter icons
  const filteredIcons = useMemo(() => {
    if (!searchTerm) {
      return allIconNames.slice(0, 150); // Show max 150 initially to be fast
    }
    const lowerSearch = searchTerm.toLowerCase();
    return allIconNames.filter(name => name.toLowerCase().includes(lowerSearch)).slice(0, 150);
  }, [searchTerm]);

  const CurrentIcon = (icons as any)[value] || icons.Tag;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-colors duration-150 outline-none text-sm font-medium flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <CurrentIcon size={18} className="text-primary" />
          <span className="text-slate-700 dark:text-slate-300">{value}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 left-0 right-0 w-full min-w-[280px] h-[300px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar iconos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="grid grid-cols-5 gap-1">
              {filteredIcons.map((iconName) => {
                const IconComponent = (icons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`p-2 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${value === iconName ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400'}`}
                    title={iconName}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="text-center p-4 text-slate-500 text-sm">
                No se encontraron iconos
              </div>
            )}
            {filteredIcons.length >= 150 && (
              <div className="text-center p-2 text-slate-400 text-xs">
                Mostrando los primeros 150 resultados. Sigue escribiendo para buscar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
