import React, { useState } from 'react';
import { CategoriesView } from './CategoriesView';
import { WorkflowsView } from './WorkflowsView';
import { WorkflowRulesView } from './WorkflowRulesView';
import { LayoutGrid, Workflow, Sparkles } from 'lucide-react';

export function ClassificationView() {
  const [activeTab, setActiveTab] = useState<'categories' | 'workflows' | 'workflow_rules'>('categories');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Etiquetas &amp; Flujos</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gestiona de forma unificada la clasificación de tu catálogo y los estados logísticos.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutGrid size={16} />
          Árbol de Categorías
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 ${
            activeTab === 'workflows'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-850'
          }`}
        >
          <Workflow size={16} />
          Flujos de Trabajo
        </button>
        <button
          onClick={() => setActiveTab('workflow_rules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 ${
            activeTab === 'workflow_rules'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-850'
          }`}
        >
          <Sparkles size={16} className="text-indigo-500" />
          Automatización &amp; Reglas
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'categories' && <CategoriesView insideWrapper />}
        {activeTab === 'workflows' && <WorkflowsView insideWrapper />}
        {activeTab === 'workflow_rules' && <WorkflowRulesView />}
      </div>
    </div>
  );
}
