import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  FolderTree,
  Tag,
  Palette,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Category } from '@/src/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { PERMISSIONS } from '../types/permissions';

import { toast } from 'sonner';

import { IconPicker } from './IconPicker';

export function CategoriesView({ insideWrapper }: { insideWrapper?: boolean }) {
  const { userRole, hasPermission } = useAuth();
  const isAdmin = userRole === 'Admin';
  const canManage = true; // Temporary bypass for simplified UI
  
  

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categorias').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      // Map to keep icon_name -> icon_name mapping exact
      setCategories(data);
    }
    setLoading(false);
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    icon_name: 'Tag',
    color: '#137fec',
    parent_id: '' as string | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.name, // DB uses 'nombre'
      icon_name: formData.icon_name,
      color: formData.color,
      parent_id: formData.parent_id === '' ? null : formData.parent_id
    };

    if (editingId) {
      const { error } = await supabase.from('categorias').update(payload).eq('id', editingId);
      if (error) { toast.error("Error al editar"); return; }
      toast.success("Categoría editada exitosamente.");
    } else {
      const { error } = await supabase.from('categorias').insert([payload]);
      if (error) { toast.error("Error al crear"); return; }
      toast.success("Categoría creada exitosamente.");
    }
    
    fetchCategories();
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      icon_name: 'Tag',
      color: '#137fec',
      parent_id: null
    });
  };

  const handleEdit = (category: Category) => {
    
    setFormData({
      name: (category as any).nombre || category.name,
      icon_name: category.icon_name,
      color: category.color,
      parent_id: category.parent_id || ''
    });
    setEditingId(category.id);
    setShowForm(true);

  };

  const handleDelete = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Check if it's a parent category
    const hasChildren = categories.some(c => c.parent_id === id);
    if (hasChildren) {
      toast.error('No se puede eliminar una categoría que tiene subcategorías. Elimínelas primero.');
      return;
    }

    if (!isAdmin && !category.parent_id) {
      toast.error('Solo el Administrador puede eliminar categorías principales.');
      return;
    }

    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Categoría eliminada.");
      fetchCategories();
    }
    setShowDeleteConfirm(null);
  };

  const getHierarchy = () => {
    const buildTree = (parentId: string | null = null): (Category & { children: any[] })[] => {
      return categories
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    return buildTree(null);
  };

  const CategoryNode = ({ category, level = 0 }: { category: any, level?: number, key?: string }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="space-y-0.5">
        <div 
          className={cn(
            "flex items-center justify-between p-1.5 rounded-lg transition-colors duration-150 group",
            level === 0 ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
          )}
          style={{ marginLeft: level > 0 ? `${level * 20}px` : 0 }}
        >
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-400",
                !hasChildren && "invisible"
              )}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            <div 
              className="size-6 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <LayoutGrid size={12} />
            </div>

            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                {category.nombre}
              </h4>
              {level === 0 && <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">Principal</span>}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canManage && (
              <>
                <button 
                  onClick={() => handleEdit(category)}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors duration-150"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(category.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-150"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-0.5 mt-0.5">
            {category.children.map((child: any) => (
              <CategoryNode key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full space-y-4">
          {showForm ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 rounded-t-3xl">
                <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                  <Tag size={18} className="text-primary" />
                  {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre de la Categoría</label>
                    <input 
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-colors duration-150 outline-none text-sm font-medium"
                      placeholder="Ej: Impresión 3D"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría Padre (Opcional)</label>
                    <select 
                      value={formData.parent_id || ''}
                      onChange={(e) => setFormData({...formData, parent_id: e.target.value || null})}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-colors duration-150 outline-none text-sm font-medium appearance-none"
                    >
                      <option value="">Ninguna (Categoría Principal)</option>
                      {
                        // Helper to flatten hierarchy for select
                        (function renderOptions(nodes: any[], depth = 0): any[] {
                          let options: any[] = [];
                          for (const node of nodes) {
                            if (node.id === editingId) continue;
                            options.push(
                              <option key={node.id} value={node.id}>
                                {'\u00A0'.repeat(depth * 3)} {depth > 0 ? '↳ ' : ''}{node.nombre}
                              </option>
                            );
                            if (node.children?.length > 0) {
                              options = options.concat(renderOptions(node.children, depth + 1));
                            }
                          }
                          return options;
                        })(getHierarchy())
                      }
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Color Distintivo</label>
                    <div className="flex gap-3">
                      <input 
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="size-12 rounded-xl border-none p-0 overflow-hidden cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="flex-1 h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-colors duration-150 outline-none text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Icono (Nombre Lucide)</label>
                    <IconPicker 
                      value={formData.icon_name}
                      onChange={(iconName) => setFormData({...formData, icon_name: iconName})}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-700 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors duration-150"
                  >
                    {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {getHierarchy().map((parent) => (
                <CategoryNode key={parent.id} category={parent} />
              ))}

              {categories.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
                  <FolderTree className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No hay categorías configuradas.</p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    Crear la primera categoría
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¿Eliminar Categoría?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Esta acción no se puede deshacer. Asegúrate de que no haya productos vinculados a esta categoría.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-red-600 transition-colors duration-150"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
