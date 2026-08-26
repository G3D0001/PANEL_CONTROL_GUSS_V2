import fs from 'fs';
let c = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');

c = c.replace(
  /<div className="flex flex-col h-full">[\s\S]*?\{\!insideWrapper && \([\s\S]*?<header[\s\S]*?<\/header>\)\}/,
  `<div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="text-primary" size={20} />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Gestión de Categorías
            </h2>
          </div>
          <p className="text-xs text-slate-500">Organiza tus insumos y productos con jerarquías y subcategorías.</p>
        </div>
        {canManage && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex flex-row items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors duration-150"
          >
            <PlusCircle size={14} /> Añadir
          </button>
        )}
      </div>`
);

// also fix the container of the content
// we used to have: <div className="flex-1 overflow-y-auto p-5">...
c = c.replace(/<div className="flex-1 overflow-y-auto p-5">/, '<div className="flex-1 overflow-y-auto">');
c = c.replace(/<div className="max-w-4xl mx-auto space-y-6">/, '<div className="w-full space-y-4">');

// and the "no categories" text:
c = c.replace(
  /text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 dark:border-slate-800/,
  "text-center py-12 text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-800 border-dashed rounded-xl"
);

fs.writeFileSync('src/components/CategoriesView.tsx', c);
