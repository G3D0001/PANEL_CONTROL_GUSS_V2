import fs from 'fs';
let c = fs.readFileSync('src/components/WorkflowsView.tsx', 'utf8');

c = c.replace(
  /<div className="flex flex-col h-full">[\s\S]*?\{\!insideWrapper && \([\s\S]*?<header[\s\S]*?<\/header>\)\}/,
  `<div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="text-primary" size={20} />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Flujos de Trabajo
            </h2>
          </div>
          <p className="text-xs text-slate-500">Asigna modelos de producción según categoría</p>
        </div>
        {!editingWf && (
          <button 
            onClick={() => setEditingWf({ id: \`new-\${Date.now()}\`, name: 'Nuevo Flujo', categoryIds: [], states: [] })}
            className="flex flex-row items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors duration-150"
          >
            <Plus size={14} /> Crear Flujo
          </button>
        )}
      </div>`
);

c = c.replace(/<div className="flex-1 overflow-y-auto p-4">/, '<div className="flex-1 overflow-y-auto">');

fs.writeFileSync('src/components/WorkflowsView.tsx', c);
