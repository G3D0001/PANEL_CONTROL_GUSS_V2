const fs = require('fs');

let content = fs.readFileSync('src/components/MisProductosView.tsx', 'utf-8');

// Definimos el inicio y el fin de la sección rota de forma robusta
const startIndex = content.indexOf('<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tipo Componente</label>');
if (startIndex === -1) {
  console.log("Error: Start index not found");
  process.exit(1);
}

const targetEndStr = '<td className="p-2 font-bold text-slate-800 dark:text-slate-200 text-[10px]">{v.nombre}</td>';
const endIndex = content.indexOf(targetEndStr);
if (endIndex === -1) {
  console.log("Error: End index not found");
  process.exit(1);
}

// Tomamos todo lo anterior al label de "Tipo Componente"
// Pero miremos: el div que contiene a "Tipo Componente" empieza justo antes con "                  <div>"
const beforeLabel = content.lastIndexOf('<div>', startIndex);
if (beforeLabel === -1) {
  console.log("Error: beforeLabel not found");
  process.exit(1);
}

const part1 = content.slice(0, beforeLabel);
const part2 = content.slice(endIndex);

const replacement = `                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tipo Componente</label>
                    <select
                      value={fabItemForm.tipo}
                      onChange={e => setFabItemForm({ ...fabItemForm, tipo: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
                    >
                      <option value="Insumo">Insumo</option>
                      <option value="Máquina">Máquina</option>
                      <option value="Acabado">Acabado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Unidad</label>
                    <input 
                      type="text" 
                      placeholder="Ej: g, hr, unidad"
                      value={fabItemForm.unidad}
                      onChange={e => setFabItemForm({ ...fabItemForm, unidad: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Costo Unitario ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={fabItemForm.costo_unitario}
                    onChange={e => setFabItemForm({ ...fabItemForm, costo_unitario: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsG3dFabModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveFabItem}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shadow"
                >
                  {editingFabItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición completa de producto con tabla de variantes */}
        {editingProduct && editingProduct._isFullEdit && (
          <div className="space-y-4">
            {editingProduct.variantes && editingProduct.variantes.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Variantes / Combinaciones</label>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="p-2 text-center w-28">Imagen</th>
                        <th className="p-2">Combinación</th>
                        {editingProduct.modalidad === 'inmediata' && (
                          <>
                            <th className="p-2 text-center w-20">Stock</th>
                            <th className="p-2 text-center w-20">Mínimo</th>
                          </>
                        )}
                        <th className="p-2 text-right w-28">Precio ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingProduct.variantes.map((v, vIdx) => {
                        const itemsV = v.items_insumos || [];
                        let costComponents = itemsV.reduce((acc, cur) => {
                          const matchItem = g3dFabItems.find(f => f.id === cur.fab_item_id);
                          const price = matchItem ? matchItem.costo_unitario : 0;
                          return acc + (cur.cantidad * price);
                        }, 0);
                        const timeHours = parseFloat(v.tiempo_horas || editingProduct.tiempo_horas) || 0;
                        const costTime = timeHours * machineCostHr;
                        const totalCost = costComponents + costTime;

                        const percPlat = parseFloat(platformCommission) || 0;
                        const pBase = parseFloat(v.precio || 0) || 0;
                        const pFinal = pBase * (1 + (percPlat / 100));

                        return (
                          <React.Fragment key={v.id || vIdx}>
                            <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="p-1.5 text-center">
                                 <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                    {/* Los dos botones */}
                                    <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                       <button
                                          type="button"
                                          onClick={() => {
                                             const newVars = [...editingProduct.variantes];
                                             newVars[vIdx].usar_imagenes_padre = true;
                                             newVars[vIdx].imagen = '';
                                             newVars[vIdx].imagen_url = '';
                                             setEditingProduct({...editingProduct, variantes: newVars});
                                          }}
                                          className={\`px-1.5 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer \${
                                             v.usar_imagenes_padre !== false
                                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
                                          }\`}
                                          title="Usar fotos del producto padre"
                                       >
                                          Padre
                                       </button>
                                       <button
                                          type="button"
                                          onClick={() => {
                                             const newVars = [...editingProduct.variantes];
                                             newVars[vIdx].usar_imagenes_padre = false;
                                             setEditingProduct({...editingProduct, variantes: newVars});
                                          }}
                                          className={\`px-1.5 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer \${
                                             v.usar_imagenes_padre === false
                                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
                                          }\`}
                                          title="Cargar foto propia de galería"
                                       >
                                          Cargar
                                       </button>
                                    </div>

                                    {/* Área condicional */}
                                    {v.usar_imagenes_padre !== false ? (
                                       <select
                                          value={v.imagen_idx ?? ''}
                                          onChange={e => {
                                             const newVars = [...editingProduct.variantes];
                                             const idx = e.target.value === '' ? null : parseInt(e.target.value);
                                             newVars[vIdx].imagen_idx = idx;
                                             const imgs = editingProduct.imagenes || [];
                                             newVars[vIdx].imagen = idx !== null && imgs[idx] ? imgs[idx] : '';
                                             newVars[vIdx].imagen_url = idx !== null && imgs[idx] ? imgs[idx] : '';
                                             setEditingProduct({...editingProduct, variantes: newVars});
                                          }}
                                          className="w-full text-[9px] rounded bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 py-0.5 px-1 font-bold text-slate-600 dark:text-slate-350 focus:outline-none"
                                          title="Foto del padre asignada"
                                       >
                                          <option value="">➖ Ninguna</option>
                                          {(editingProduct.imagenes || []).map((_, i) => (
                                             <option key={i} value={i}>Foto #\${i+1}</option>
                                          ))}
                                       </select>
                                    ) : (
                                       <div className="flex items-center gap-1">
                                          {v.imagen || v.imagen_url ? (
                                             <div className="relative size-7 rounded border border-slate-200 dark:border-slate-700 overflow-hidden group shadow-sm">
                                                <img src={v.imagen || v.imagen_url} alt="" className="size-full object-cover" />
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const newVars = [...editingProduct.variantes];
                                                      newVars[vIdx].imagen = '';
                                                      newVars[vIdx].imagen_url = '';
                                                      setEditingProduct({...editingProduct, variantes: newVars});
                                                   }}
                                                   className="absolute inset-0 bg-rose-600/95 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                   <X size={8} />
                                                </button>
                                             </div>
                                          ) : (
                                             <label className="inline-flex items-center justify-center size-7 rounded border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-emerald-500 cursor-pointer transition-all">
                                                <Upload size={10} />
                                                <input
                                                   type="file"
                                                   accept="image/*"
                                                   className="hidden"
                                                   onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                         const reader = new FileReader();
                                                         reader.onload = (ev) => {
                                                            const img = new Image();
                                                            img.onload = () => {
                                                               const canvas = document.createElement('canvas');
                                                               const MAX_WIDTH = 400;
                                                               const MAX_HEIGHT = 400;
                                                               let width = img.width;
                                                               let height = img.height;
                                                               if (width > height) {
                                                                  if (width > MAX_WIDTH) {
                                                                     height *= MAX_WIDTH / width;
                                                                     width = MAX_WIDTH;
                                                                  }
                                                               } else {
                                                                  if (height > MAX_HEIGHT) {
                                                                     width *= MAX_HEIGHT / height;
                                                                     height = MAX_HEIGHT;
                                                                  }
                                                               }
                                                               canvas.width = width;
                                                               canvas.height = height;
                                                               const ctx = canvas.getContext('2d');
                                                               ctx?.drawImage(img, 0, 0, width, height);
                                                               const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                                                               const newVars = [...editingProduct.variantes];
                                                               newVars[vIdx].imagen = dataUrl;
                                                               newVars[vIdx].imagen_url = dataUrl;
                                                               setEditingProduct({...editingProduct, variantes: newVars});
                                                            };
                                                            img.src = ev.target?.result as string;
                                                         };
                                                         reader.readAsDataURL(file);
                                                      }
                                                   }}
                                                />
                                             </label>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              </td>
`;

fs.writeFileSync('src/components/MisProductosView.tsx', part1 + replacement + part2, 'utf-8');
console.log("Successfully restored MisProductosView.tsx!");
