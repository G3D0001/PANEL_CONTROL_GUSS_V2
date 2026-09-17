import React, { useState } from 'react';
import { LogisticsSettings } from './LogisticsSettings';
import { FleterosManager } from './FleterosManager';
import { LogisticsDashboard } from './LogisticsDashboard';
import { Navigation, Users, Settings } from 'lucide-react';

export function LogisticsCenterView() {
  const [activeTab, setActiveTab] = useState<'viajes' | 'fleteros' | 'configuracion'>('viajes');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Logística Central</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gestión integral de repartidores, torre de control de viajes y tarifas.
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full sm:w-fit p-1">
        <button
          onClick={() => setActiveTab('viajes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 \${
            activeTab === 'viajes'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <Navigation size={16} />
          Torre de Control
        </button>
        <button
          onClick={() => setActiveTab('fleteros')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 \${
            activeTab === 'fleteros'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} />
          Fleteros
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 \${
            activeTab === 'configuracion'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <Settings size={16} />
          Tarifas
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'viajes' && <LogisticsDashboard insideWrapper />}
        {activeTab === 'fleteros' && <FleterosManager insideWrapper />}
        {activeTab === 'configuracion' && <LogisticsSettings insideWrapper />}
      </div>
    </div>
  );
}
