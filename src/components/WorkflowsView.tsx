import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, Edit2, CheckCircle2, GripVertical, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface WorkflowState {
  id?: string;
  flujo_id?: string;
  name: string;
  color: string;
  step_order?: number;
}

interface Workflow {
  id: string;
  name: string;
  categoryIds: string[];
  states: WorkflowState[];
}

const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

export function WorkflowsView({ insideWrapper }: { insideWrapper?: boolean }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [categories, setCategories] = useState<{id: string, nombre: string}[]>([]);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats } = await supabase.from('categorias').select('id, nombre');
      if (cats) setCategories(cats);

      // Fetch workflows
      let { data: wfes } = await supabase.from('flujos').select('*').order('created_at', { ascending: true });

      if (wfes && wfes.length === 0) {
        try {
          // Seedor de flujo inicial usando diccionario_estados_pedido
          const { data: dictRows } = await supabase.from('diccionario_estados_pedido').select('*').order('nivel_prioridad', { ascending: true });
          const listToSeed = dictRows && dictRows.length > 0 ? dictRows : [
            { nombre_estado: 'Pendiente de Pago', color_pastel_hex: '#6B7280' },
            { nombre_estado: 'Diseño o Slicing', color_pastel_hex: '#3B82F6' },
            { nombre_estado: 'En Cola de Impresión', color_pastel_hex: '#F59E0B' },
            { nombre_estado: 'Imprimiendo', color_pastel_hex: '#10B981' },
            { nombre_estado: 'Post-Procesado', color_pastel_hex: '#8B5CF6' },
            { nombre_estado: 'Listo para Entregar', color_pastel_hex: '#EC4899' },
            { nombre_estado: 'Entregado', color_pastel_hex: '#10B981' }
          ];

          const { data: insertedWf } = await supabase.from('flujos').insert({
            name: 'Flujo de Trabajo Principal'
          }).select().single();

          if (insertedWf) {
            const stateInserts = listToSeed.map((item: any, idx) => ({
              flujo_id: insertedWf.id,
              name: item.nombre_estado || item.name || 'Estado',
              color: item.color_pastel_hex || item.color || '#3B82F6',
              step_order: idx
            }));
            await supabase.from('flujo_estados').insert(stateInserts);
            const { data: refetchedWfes } = await supabase.from('flujos').select('*').order('created_at', { ascending: true });
            wfes = refetchedWfes;
          }
        } catch (e) {
          console.error("Error seeding initial workflow:", e);
        }
      }
      
      // Fetch categories relationships
      const { data: rels } = await supabase.from('flujo_categorias').select('*');
      
      // Fetch states
      const { data: sts } = await supabase.from('flujo_estados').select('*').order('step_order', { ascending: true });

      if (wfes) {
        const fullWorkflows: Workflow[] = wfes.map(wf => {
          return {
            id: wf.id,
            name: wf.name,
            categoryIds: (rels || []).filter(r => r.flujo_id === wf.id).map(r => r.categoria_id),
            states: (sts || []).filter(s => s.flujo_id === wf.id).map(s => ({
              id: s.id,
              name: s.name,
              color: s.color,
              step_order: s.step_order,
              flujo_id: s.flujo_id
            }))
          };
        });
        setWorkflows(fullWorkflows);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !editingWf) return;
    const newStates = Array.from(editingWf.states);
    const [reordered] = newStates.splice(result.source.index, 1);
    newStates.splice(result.destination.index, 0, reordered);
    setEditingWf({ ...editingWf, states: newStates });
  };

  const saveWorkflow = async () => {
    if (!editingWf) return;
    
    try {
      let flujo_id = editingWf.id;
      const isNew = flujo_id.startsWith('new-');

      if (isNew) {
        const { data: inserted, error: insertErr } = await supabase.from('flujos').insert({
          name: editingWf.name
        }).select().single();
        if (insertErr) throw insertErr;
        flujo_id = inserted.id;
      } else {
        const { error: updErr } = await supabase.from('flujos').update({
          name: editingWf.name
        }).eq('id', flujo_id);
        if (updErr) throw updErr;
      }

      // Update Categories Relationship
      await supabase.from('flujo_categorias').delete().eq('flujo_id', flujo_id);
      if (editingWf.categoryIds.length > 0) {
        const catInserts = editingWf.categoryIds.map(cid => ({ flujo_id, categoria_id: cid }));
        await supabase.from('flujo_categorias').insert(catInserts);
      }

      // Update States
      // Deleting all and recreating is easiest, unless they have IDs tying them to something else.
      // We will preserve IDs if available to prevent breaking external relations in the future
      await supabase.from('flujo_estados').delete().eq('flujo_id', flujo_id);
      
      if (editingWf.states.length > 0) {
        const stateInserts = editingWf.states.map((st, idx) => {
           return {
             flujo_id,
             name: st.name,
             color: st.color,
             step_order: idx
           };
        });
        await supabase.from('flujo_estados').insert(stateInserts);
      }

      toast.success("Flujo guardado con éxito.");
      setEditingWf(null);
      fetchData();
    } catch(err) {
      console.error("Error saving workflow", err);
      toast.error("Error al guardar el flujo");
    }
  };

  const deleteWorkflow = async (id: string) => {
    if(!window.confirm("¿Seguro que deseas eliminar este flujo y todos sus estados?")) return;
    try {
      if(!id.startsWith('new-')){
         await supabase.from('flujos').delete().eq('id', id);
      }
      toast.success("Flujo eliminado");
      setEditingWf(null);
      fetchData();
    } catch(e) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
            onClick={() => setEditingWf({ id: `new-${Date.now()}`, name: 'Nuevo Flujo', categoryIds: [], states: [] })}
            className="flex flex-row items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors duration-150"
          >
            <Plus size={14} /> Crear Flujo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {editingWf ? (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
              <h2 className="text-base font-bold">Editar Flujo: {editingWf.name}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => deleteWorkflow(editingWf.id)} 
                  className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg font-bold"
                >
                  Eliminar
                </button>
                <button onClick={() => setEditingWf(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Cancelar</button>
                <button onClick={saveWorkflow} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} /> Guardar
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Flujo</label>
              <input 
                value={editingWf.name}
                onChange={e => setEditingWf({...editingWf, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categorías Asociadas</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const isSelected = editingWf.categoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const newCats = isSelected 
                            ? editingWf.categoryIds.filter(id => id !== cat.id)
                            : [...editingWf.categoryIds, cat.id];
                          setEditingWf({...editingWf, categoryIds: newCats});
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 border",
                          isSelected 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {cat.nombre}
                      </button>
                    );
                  })}
                  {categories.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No hay categorías en el sistema. Crea categorías primero.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 mt-6">
                <label className="block text-xs font-bold text-slate-500 uppercase">Estados (Orden del flujo)</label>
                <button 
                  onClick={() => setEditingWf({
                    ...editingWf, 
                    states: [...editingWf.states, { name: 'Nuevo Estado', color: DEFAULT_COLORS[editingWf.states.length % DEFAULT_COLORS.length] }]
                  })}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} /> Añadir Estado
                </button>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="statesList">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {editingWf.states.map((state, index) => (
                        // @ts-ignore
                        <Draggable key={state.id || `st-${index}`} draggableId={state.id || `st-${index}`} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                            >
                              <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                                <GripVertical size={20} />
                              </div>
                              <input 
                                type="color"
                                value={state.color || '#3B82F6'}
                                onChange={(e) => {
                                  const newStates = [...editingWf.states];
                                  newStates[index].color = e.target.value;
                                  setEditingWf({...editingWf, states: newStates});
                                }}
                                className="size-6 rounded-full shrink-0 cursor-pointer border-none p-0 outline-none bg-transparent overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full shadow-sm"
                              />
                              <input 
                                value={state.name}
                                onChange={(e) => {
                                  const newStates = [...editingWf.states];
                                  newStates[index].name = e.target.value;
                                  setEditingWf({...editingWf, states: newStates});
                                }}
                                className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-bold text-sm"
                                placeholder="Nombre del estado"
                              />
                              <button 
                                onClick={() => {
                                  const newStates = editingWf.states.filter((_, i) => i !== index);
                                  setEditingWf({...editingWf, states: newStates});
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <div key={wf.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 hover:shadow-md transition-colors duration-150 group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{wf.name}</h3>
                    <div className="flex gap-2 text-xs font-bold text-slate-500">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {wf.states.length} Estados
                      </span>
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                        {wf.categoryIds.length} Categorías vinculadas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingWf(wf)} className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-4">
                    {wf.states.map((st, i) => (
                      <div key={st.id || i} className="flex items-center gap-4 relative z-10">
                        <div className="size-6 rounded-full border-4 border-white dark:border-slate-900 shrink-0" style={{ backgroundColor: st.color }} />
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Paso {i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!loading && workflows.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <Network size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aún no hay flujos de producción creados.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
