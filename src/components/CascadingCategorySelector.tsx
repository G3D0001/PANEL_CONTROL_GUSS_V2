import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// High quality fallback categories in case database is empty
const FALLBACK_CATEGORIES = [
  {
    id: "f1",
    nombre: "Filamentos",
    children: [
      {
        id: "f1-1",
        nombre: "PLA",
        children: [
          { id: "f1-1-1", nombre: "Nacional" },
          { id: "f1-1-2", nombre: "Importado" }
        ]
      },
      {
        id: "f1-2",
        nombre: "PETG",
        children: [
          { id: "f1-2-1", nombre: "Premium" }
        ]
      },
      {
        id: "f1-3",
        nombre: "ABS",
        children: [
          { id: "f1-3-1", nombre: "Técnico" }
        ]
      }
    ]
  },
  {
    id: "f2",
    nombre: "Resinas",
    children: [
      { id: "f2-1", nombre: "Standard LCD/SLA" }
    ]
  },
  {
    id: "f3",
    nombre: "Insumos y Repuestos",
    children: [
      {
        id: "f3-1",
        nombre: "Boquillas",
        children: [
          { id: "f3-1-1", nombre: "Bronce" },
          { id: "f3-1-2", nombre: "Hardened Steel" }
        ]
      },
      {
        id: "f3-2",
        nombre: "Extrusores",
        children: [
          { id: "f3-2-1", nombre: "Directo" }
        ]
      }
    ]
  }
];

export function CascadingCategorySelector({ 
  value, 
  onChange,
  showAllOption = false
}: { 
  value: string; 
  onChange: (category: string) => void;
  showAllOption?: boolean;
}) {
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchFromSupabase() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre');
        
        if (!error && data && data.length > 0) {
          setDbCategories(data);
        }
      } catch (err) {
        console.error("Error retrieving unified categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFromSupabase();
  }, []);

  // Construct categorical tree in memory
  const getHierarchy = () => {
    if (dbCategories.length === 0) {
      return FALLBACK_CATEGORIES;
    }

    const buildTree = (parentId: string | null = null): any[] => {
      return dbCategories
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          id: c.id,
          nombre: c.nombre,
          color: c.color,
          icon_name: c.icon_name,
          children: buildTree(c.id)
        }));
    };
    return buildTree(null);
  };

  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const traverseAndFindPath = (nodes: any[], target: string, path: string[] = []): string[] | null => {
    for (const node of nodes) {
      const currentPath = [...path, node.nombre];
      if (node.nombre === target) {
        return currentPath;
      }
      if (node.children && node.children.length > 0) {
        const res = traverseAndFindPath(node.children, target, currentPath);
        if (res) return res;
      }
    }
    return null;
  };

  const displayValue = () => {
    if (value === 'Todas') return "Todas las Categorías";
    if (!value) return "Seleccionar categoría...";
    
    // If we have "Child Category", construct path: "Parent -> Sub -> Child"
    const tree = getHierarchy();
    const cleanValue = value.includes("->") ? value.split("->").pop()?.trim() || value : value;
    const path = traverseAndFindPath(tree, cleanValue);
    if (path) {
      return path.join(" ➔ ");
    }
    return value;
  };

  const treeData = getHierarchy();

  // Recursive element renderer
  const renderTreeNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedIds[node.id];
    const isSelected = value === node.nombre || (value && value.endsWith(node.nombre));

    return (
      <div key={node.id} className="space-y-0.5">
        <div 
          onClick={() => {
            // Select category and construct hierarchical format
            onChange(node.nombre);
            setIsOpen(false);
          }}
          className={`group flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 relative
            ${isSelected 
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-305 border border-indigo-100 dark:border-indigo-900/30' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-805'}`}
          style={{ paddingLeft: `${Math.max(8, level * 20)}px` }}
        >
          <div className="flex items-center gap-2">
            {/* Expansion Arrow */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => handleToggleExpand(node.id, e)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <div className="w-5" /> // spacing spacer
            )}

            {/* Icon */}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={14} className="text-amber-500 dark:text-amber-450 shrink-0" />
              ) : (
                <Folder size={14} className="text-amber-400 dark:text-amber-500/80 shrink-0" />
              )
            ) : (
              <FileText size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            )}

            {/* Folder / File Node Name */}
            <span className={isSelected ? "font-bold" : ""}>{node.nombre}</span>
          </div>

          <div className="flex items-center gap-1.5 pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isSelected ? (
              <Check size={12} className="text-indigo-600 dark:text-indigo-400" />
            ) : (
              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md uppercase font-black">Seleccionar</span>
            )}
          </div>
        </div>

        {/* Child Subfolders recursion */}
        {hasChildren && isExpanded && (
          <div className="transition-all">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative font-sans leading-none z-50">
      {/* Selector Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-805 dark:text-slate-200 cursor-pointer flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
      >
        <span className="truncate">{displayValue()}</span>
        {loading ? (
          <Loader2 size={13} className="animate-spin text-indigo-500" />
        ) : (
          <ChevronDown size={13} className="text-slate-400" />
        )}
      </div>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Windows-style folder explorer popup */}
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-3 max-h-[300px] overflow-y-auto space-y-1 text-slate-900 dark:text-slate-100 animate-in fade-in duration-100">
            <div className="px-2 pb-1.5 mb-1 border-b dark:border-slate-800 text-[9px] uppercase font-black tracking-wider text-slate-400 flex justify-between items-center">
              <span>Arbol de Categorías</span>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="text-indigo-550 hover:underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            
            <div className="space-y-1">
              {showAllOption && (
                <div 
                  onClick={() => {
                    onChange('Todas');
                    setIsOpen(false);
                  }}
                  className={`group flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 relative
                    ${value === 'Todas' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-305 border border-indigo-100 dark:border-indigo-900/30 font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-805'}`}
                >
                  <FolderOpen size={14} className="text-indigo-500 shrink-0" />
                  <span>Todas las Categorías</span>
                </div>
              )}
              {treeData.map((rootNode: any) => renderTreeNode(rootNode, 0))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
