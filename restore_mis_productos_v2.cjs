const fs = require('fs');

let content = fs.readFileSync('src/components/MisProductosView.tsx', 'utf-8');

// Busquemos el inicio del modal de edición completa que pusimos antes:
const targetStartStr = '{/* Modal de edición completa de producto con tabla de variantes */}';
const startIndex = content.indexOf(targetStartStr);
if (startIndex === -1) {
  console.log("Error: Target start string not found");
  process.exit(1);
}

// El bloque de inicio que queremos reemplazar va desde targetStartStr hasta el inicio de la tabla o variantes
const nextCodeStr = '{editingProduct.variantes &&';
const nextIndex = content.indexOf(nextCodeStr, startIndex);
if (nextIndex === -1) {
  console.log("Error: nextCodeStr not found");
  process.exit(1);
}

const part1 = content.slice(0, startIndex);
const part2 = content.slice(nextIndex);

const modalHeader = `{/* Modal de edición de producto G3D (Completa / Rápida) */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-white">
              
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingProduct.id.startsWith('p-') ? 'Crear Producto G3D' : 'Editar Producto G3D'}
                </h3>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {editingProduct._isFullEdit ? (
                  <div className="space-y-4">
                    `;

fs.writeFileSync('src/components/MisProductosView.tsx', part1 + modalHeader + part2, 'utf-8');
console.log("Successfully rebuilt MisProductosView.tsx with full modal wrapper!");
