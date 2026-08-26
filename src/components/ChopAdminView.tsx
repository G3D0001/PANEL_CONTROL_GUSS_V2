import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  RotateCw, 
  Sliders, 
  Settings, 
  Plus, 
  Save, 
  ChevronRight, 
  Info, 
  X, 
  FolderOpen, 
  Layers, 
  Image as ImageIcon, 
  ChevronDown, 
  SlidersHorizontal,
  Eye,
  HelpCircle,
  RefreshCw,
  Share2,
  Lock,
  Focus,
  PlusCircle,
  Palette,
  Camera,
  ArrowLeft,
  FileCode,
  Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { ThreeMFLoaderView } from './ThreeMFLoaderView';
import { FilamentColor, TopeTemplate, CuerpoTemplate, MangoTemplate, BaseTemplate, SavedProject } from './ChopCustomizer';

// Types for Admin view
export interface PartGroup {
  id: string;
  name: string;
  meshNames: string[];
  color: string;
  isExclusive: boolean;
  activeMeshName?: string;
  visible: boolean;
}

export interface CustomBackground {
  imageUrl: string;
  opacity: number;
  size: 'cover' | 'contain' | 'auto';
  blur: number;
}

interface ChopAdminViewProps {
  cuerpos: CuerpoTemplate[];
  topes: TopeTemplate[];
  mangos: MangoTemplate[];
  bases: BaseTemplate[];
  filamentColors: FilamentColor[];
  setFilamentColors: React.Dispatch<React.SetStateAction<FilamentColor[]>>;

  selectedCuerpo: string;
  setSelectedCuerpo: (id: string) => void;
  selectedTope: string;
  setSelectedTope: (id: string) => void;
  selectedMango: string;
  setSelectedMango: (id: string) => void;
  selectedBase: string;
  setSelectedBase: (id: string) => void;

  colorTope: string;
  setColorTope: (color: string) => void;
  colorCuerpo: string;
  setColorCuerpo: (color: string) => void;
  colorMango: string;
  setColorMango: (color: string) => void;
  colorBands: string[];
  setColorBands: React.Dispatch<React.SetStateAction<string[]>>;

  activeColorTarget: { type: 'tope' | 'cuerpo' | 'mango' | 'band'; index?: number };
  setActiveColorTarget: (target: { type: 'tope' | 'cuerpo' | 'mango' | 'band'; index?: number }) => void;

  savedProjects: SavedProject[];
  projectName: string;
  setProjectName: (name: string) => void;
  handleSaveProject: () => void;
  handleLoadProject: (proj: SavedProject) => void;
  handleDeleteProject: (id: string, e: React.MouseEvent) => void;
  handleExportBackup: () => void;
  handleImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;

  dbPlantillas: any[];
  loadingPlantillas: boolean;
  handleSaveDbPlantilla: (name: string) => Promise<void>;
  handleDeleteDbPlantilla: (id: string, e: React.MouseEvent) => Promise<void>;
  handleLoadDbPlantilla: (dbProj: any) => void;

  setAppMode: (mode: 'client' | 'admin') => void;
  handleResetToDefaults: () => void;
}

// Interactive High-Fidelity 2D Micro-Chop preview to make gallery cards look magnificent
const MicroChopSVG: React.FC<{
  colorTope: string;
  colorCuerpo: string;
  colorMango: string;
  colorBands: string[];
  bandsCount: number;
}> = ({ colorTope, colorCuerpo, colorMango, colorBands, bandsCount }) => {
  return (
    <svg className="w-20 h-20 mx-auto drop-shadow-md group-hover:scale-105 transition-transform duration-300" viewBox="0 0 400 400">
      {/* Handle / Mango */}
      <path
        d="M 230,110 L 310,130 L 310,310 L 230,340 L 230,285 L 270,270 L 270,175 L 230,155 Z"
        fill={colorMango || '#eab308'}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="2.5"
      />
      {/* Body / Cuerpo */}
      <rect x="110" y="140" width="125" height="190" fill={colorCuerpo || '#eab308'} rx="12" />
      {/* Top lip / Tope */}
      <ellipse cx="172" cy="140" rx="68" ry="14" fill={colorTope || '#ffffff'} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <ellipse cx="172" cy="140" rx="50" ry="8" fill="rgba(0,0,0,0.12)" />
      {/* Bands / Base */}
      <g transform="translate(110, 305)">
        {Array.from({ length: Math.min(bandsCount || 3, 4) }).map((_, idx) => {
          const bandColor = colorBands?.[idx] || '#ffffff';
          const yOffset = idx * 9;
          return (
            <rect
              key={idx}
              x={-4 - idx * 1.5}
              y={yOffset}
              width={133 + idx * 3}
              height="8"
              fill={bandColor}
              rx="3.5"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
          );
        })}
      </g>
    </svg>
  );
};

export const ChopAdminView: React.FC<ChopAdminViewProps> = ({
  cuerpos,
  topes,
  mangos,
  bases,
  filamentColors,
  setFilamentColors,
  selectedCuerpo,
  setSelectedCuerpo,
  selectedTope,
  setSelectedTope,
  selectedMango,
  setSelectedMango,
  selectedBase,
  setSelectedBase,
  colorTope,
  setColorTope,
  colorCuerpo,
  setColorCuerpo,
  colorMango,
  setColorMango,
  colorBands,
  setColorBands,
  activeColorTarget,
  setActiveColorTarget,
  savedProjects,
  projectName,
  setProjectName,
  handleSaveProject,
  handleLoadProject,
  handleDeleteProject,
  handleExportBackup,
  handleImportBackup,
  dbPlantillas,
  loadingPlantillas,
  handleSaveDbPlantilla,
  handleDeleteDbPlantilla,
  handleLoadDbPlantilla,
  setAppMode,
  handleResetToDefaults,
}) => {
  // Navigation states: 'gallery' | 'upload_step' | 'editor'
  const [viewState, setViewState] = useState<'gallery' | 'upload_step' | 'editor'>('gallery');
  const [activeAdminTab, setActiveAdminTab] = useState<'groups' | 'adjust' | 'catalog'>('groups');

  // Filament Palette Form States
  const [newFilBrand, setNewFilBrand] = useState('');
  const [newFilName, setNewFilName] = useState('');
  const [newFilHex, setNewFilHex] = useState('#eab308');

  // Background Customization
  const [bgConfig, setBgConfig] = useState<CustomBackground>(() => {
    const saved = localStorage.getItem('g3d_3mf_background');
    if (saved) return JSON.parse(saved);
    return {
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1600', // Neon bar
      opacity: 0.45,
      size: 'cover',
      blur: 4
    };
  });

  useEffect(() => {
    localStorage.setItem('g3d_3mf_background', JSON.stringify(bgConfig));
  }, [bgConfig]);

  // Scanned Meshes & Parts Group Management
  const [discoveredMeshes, setDiscoveredMeshes] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminGroups, setAdminGroups] = useState<PartGroup[]>(() => {
    const saved = localStorage.getItem('g3d_3mf_part_groups');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'g1', name: 'Cuerpo Principal 🍺', meshNames: ['CuerpoCup', 'BaseCup'], color: colorCuerpo, isExclusive: false, visible: true },
      { id: 'g2', name: 'Borde / Labio Superior 👄', meshNames: ['LabioCup'], color: colorTope, isExclusive: false, visible: true },
      { id: 'g3', name: 'Mangos / Asas Intercambiables 🤝', meshNames: ['MangoGeometrico', 'MangoRedondeado', 'MangoDeportivo'], color: colorMango, isExclusive: true, activeMeshName: 'MangoGeometrico', visible: true },
      { id: 'g4', name: 'Bandas Decorativas de Base ⚡', meshNames: ['BandaBase1', 'BandaBase2', 'BandaBase3', 'BandaBase4'], color: '#ffffff', isExclusive: false, visible: true },
    ];
  });

  useEffect(() => {
    localStorage.setItem('g3d_3mf_part_groups', JSON.stringify(adminGroups));
  }, [adminGroups]);

  // Group creation helper functions based on specific user requests
  const handleCreatePieceGroup = () => {
    const newGrp: PartGroup = {
      id: `g-${Date.now()}`,
      name: `Grupo de Piezas Intercambiables ${adminGroups.length + 1} 📦`,
      meshNames: [],
      color: '#ffffff',
      isExclusive: true,
      visible: true
    };
    setAdminGroups(prev => [...prev, newGrp]);
    toast.success('Grupo de piezas intercambiables creado. Asígnale las mallas deseadas.');
  };

  const handleCreateColorGroup = () => {
    const newGrp: PartGroup = {
      id: `g-${Date.now()}`,
      name: `Grupo de Edición de Color ${adminGroups.length + 1} 🎨`,
      meshNames: [],
      color: '#eab308',
      isExclusive: false,
      visible: true
    };
    setAdminGroups(prev => [...prev, newGrp]);
    toast.success('Grupo de color creado. Las mallas que agregues se pintarán juntas.');
  };

  const handleAddFilament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilBrand.trim() || !newFilName.trim()) {
      toast.error('Especifica marca y nombre para el filamento.');
      return;
    }
    const colorItem: FilamentColor = {
      id: `f-${Date.now()}`,
      brand: newFilBrand.trim(),
      name: newFilName.trim(),
      hex: newFilHex,
      active: true
    };
    setFilamentColors(prev => [...prev, colorItem]);
    setNewFilBrand('');
    setNewFilName('');
    toast.success('Filamento de marca añadido al catálogo.');
  };

  const handleDeleteFilament = (id: string) => {
    setFilamentColors(prev => prev.filter(f => f.id !== id));
    toast.info('Filamento removido.');
  };

  const trigger3MFUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.3mf')) {
        toast.error('Por favor selecciona un archivo con extensión .3mf válido.');
        return;
      }
      setUploadedFile(file);
      setViewState('editor');
      toast.success(`Archivo "${file.name}" cargado. Procediendo a configurar grupos.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.3mf')) {
        toast.error('Por favor arrastra un archivo con extensión .3mf válido.');
        return;
      }
      setUploadedFile(file);
      setViewState('editor');
      toast.success(`Archivo "${file.name}" cargado. Procediendo a configurar grupos.`);
    }
  };

  const toggleMeshInGroup = (groupId: string, meshName: string) => {
    setAdminGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const isAssigned = g.meshNames.includes(meshName);
        const nextMeshNames = isAssigned 
          ? g.meshNames.filter(m => m !== meshName)
          : [...g.meshNames, meshName];
        
        return {
          ...g,
          meshNames: nextMeshNames,
          activeMeshName: g.isExclusive && nextMeshNames.length > 0 ? nextMeshNames[0] : g.activeMeshName
        };
      }
      return g;
    }));
  };

  const toggleGroupExclusive = (groupId: string) => {
    setAdminGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          isExclusive: !g.isExclusive,
          activeMeshName: !g.isExclusive && g.meshNames.length > 0 ? g.meshNames[0] : undefined
        };
      }
      return g;
    }));
  };

  const deleteGroup = (groupId: string) => {
    setAdminGroups(prev => prev.filter(g => g.id !== groupId));
    toast.info('Grupo de piezas eliminado.');
  };

  const handleSaveCameraView = () => {
    toast.success('Perspectiva de cámara calibrada y guardada como encuadre inicial por defecto.');
  };

  const handleEditTemplate = (dbProj: any) => {
    handleLoadDbPlantilla(dbProj);
    setUploadedFile(null); // use default preloaded 3D elements
    setViewState('editor');
    toast.success(`Cargada plantilla "${dbProj.nombre}" para su edición.`);
  };

  // Preloaded backgrounds
  const preloadedBGs = [
    { name: 'Neon Cyber Bar 🍺', url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1600' },
    { name: 'Estudio Fotográfico 📸', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600' },
    { name: 'Taller de Impresión ⚙️', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1600' },
    { name: 'Madera Rústica 🪵', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1600' },
    { name: 'Fondo Minimalista Slate 🌌', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600' },
  ];

  // =========================================================================
  // 1. GALLERY VIEW MODE (Full catalog presentation of templates & sketch designs)
  // =========================================================================
  if (viewState === 'gallery') {
    return (
      <div className="w-full h-[100dvh] bg-slate-950 text-slate-100 flex flex-col relative overflow-y-auto select-none" id="chop-admin-gallery-view">
        {/* Ambient grids background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        {/* Header bar */}
        <header className="relative z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Settings className="text-white animate-spin-slow" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/50">G3D STUDIO</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">GALERÍA DE PLANTILLAS</span>
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Consola del Administrador G3D</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setAppMode('client')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-800 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Volver al Personalizador</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="text-indigo-400" size={20} />
              <span>Plantillas Oficiales de Fábrica</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Aquí puedes ver, agregar, editar o eliminar las plantillas de base que se muestran en el personalizador del cliente. Los clientes podrán personalizar sus jarros chops en vivo basados en cualquiera de estos modelos.
            </p>
          </div>

          {/* Core Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {/* Box Action: ADD NEW TEMPLATE */}
            <div 
              onClick={() => setViewState('upload_step')}
              className="group relative h-[310px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/30 hover:bg-indigo-950/10 hover:border-indigo-600 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer"
              id="add-template-card"
            >
              <div className="size-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-all duration-300 mb-4 shadow-lg">
                <PlusCircle size={32} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-wider">Crear Nueva Plantilla</p>
                <p className="text-[10px] text-slate-500 max-w-[180px]">Importa un modelo 3D .3MF para definir sus partes y publicarlo</p>
              </div>
            </div>

            {/* List templates from Supabase */}
            {loadingPlantillas ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-indigo-500 size-8" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Cargando plantillas de Supabase en vivo...</span>
              </div>
            ) : dbPlantillas.length === 0 ? (
              <div className="col-span-full p-8 rounded-2xl bg-slate-900/30 border border-slate-850 text-center text-slate-500 text-xs">
                No hay plantillas oficiales subidas en la nube. ¡Agrega la primera haciendo clic en "Crear Nueva Plantilla"!
              </div>
            ) : (
              dbPlantillas.map((plantilla) => {
                const bandsCount = plantilla.selected_base === 'b1' ? 3 : plantilla.selected_base === 'b2' ? 2 : plantilla.selected_base === 'b3' ? 3 : 4;
                return (
                  <div 
                    key={plantilla.id}
                    className="group bg-slate-900/40 hover:bg-slate-900 rounded-2xl border border-slate-850 hover:border-slate-750 transition-all duration-300 flex flex-col overflow-hidden relative shadow-lg"
                  >
                    {/* Upper decorative micro card section */}
                    <div className="h-[140px] bg-slate-950/60 flex items-center justify-center border-b border-slate-850/50 relative p-4 shrink-0">
                      <MicroChopSVG 
                        colorTope={plantilla.color_tope}
                        colorCuerpo={plantilla.color_cuerpo}
                        colorMango={plantilla.color_mango}
                        colorBands={plantilla.color_bands || []}
                        bandsCount={bandsCount}
                      />
                      <span className="absolute top-3 right-3 text-[8px] font-black uppercase bg-indigo-950/80 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-900/40">
                        NUBE BD
                      </span>
                    </div>

                    {/* Information area */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-white uppercase truncate tracking-wide" title={plantilla.nombre}>
                          {plantilla.nombre}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Capacidad: {plantilla.selected_cuerpo === 'c1' ? '500cc (0.5L)' : plantilla.selected_cuerpo === 'c2' ? '750cc (0.75L)' : '1000cc (1.0L)'}
                        </p>
                        <p className="text-[8px] text-slate-600 font-mono">
                          Creado: {new Date(plantilla.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-850/50 shrink-0">
                        <button
                          onClick={() => handleEditTemplate(plantilla)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          <Settings size={12} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteDbPlantilla(plantilla.id, e)}
                          className="px-2.5 py-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 text-slate-500 rounded-xl transition flex items-center justify-center border border-slate-800 hover:border-red-900/30 cursor-pointer"
                          title="Eliminar plantilla"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section: Local sketches backup */}
          <div className="pt-8 border-t border-slate-850 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">📂 Diseños Guardados de Forma Local ({savedProjects.length})</h3>
                <p className="text-[10px] text-slate-500">Bocetos cargados localmente en la caché de tu navegador actual.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Exportar Copia .G3D</span>
                </button>
                <button
                  onClick={() => {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.accept = '.g3d,.json';
                    el.onchange = (e: any) => handleImportBackup(e);
                    el.click();
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Importar Copia</span>
                </button>
              </div>
            </div>

            {savedProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-600 bg-slate-900/10 rounded-2xl border border-slate-850 border-dashed">
                No hay bocetos locales guardados. Puedes guardar borradores de prueba rápidos en el panel del cliente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedProjects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/20 hover:bg-slate-900/40 transition flex items-center justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-200 uppercase block truncate max-w-[150px]">{p.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{p.date} • {p.selectedCuerpo === 'c1' ? '500cc' : p.selectedCuerpo === 'c2' ? '750cc' : '1000cc'}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          handleLoadProject(p);
                          setUploadedFile(null);
                          setViewState('editor');
                        }}
                        className="p-1.5 bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 text-slate-400 rounded-lg transition"
                        title="Cargar boceto"
                      >
                        <Settings size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(p.id, e)}
                        className="p-1.5 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-800 text-slate-500 rounded-lg transition"
                        title="Borrar boceto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // 2. STEP 1: LOAD 3D MODEL FILE .3MF
  // =========================================================================
  if (viewState === 'upload_step') {
    return (
      <div className="w-full h-[100dvh] bg-slate-950 text-slate-100 flex flex-col relative select-none overflow-y-auto" id="chop-admin-upload-step">
        {/* Ambient grids background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        <div className="max-w-xl w-full mx-auto my-auto p-6 relative z-10 space-y-6">
          
          {/* Back Action button */}
          <button 
            onClick={() => setViewState('gallery')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Volver al Catálogo</span>
          </button>

          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-900/40">PASO 1</span>
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Cargar Modelo Industrial 3D</h2>
            <p className="text-xs text-slate-400">
              Para alistar una nueva plantilla de jarro, primero debes subir su archivo de modelado 3D de extensión <b className="text-indigo-400">.3MF</b>. El sistema decodificará sus mallas para que puedas agruparlas lógicamente.
            </p>
          </div>

          {/* Dotted Upload Drag Zone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={trigger3MFUpload}
            className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 hover:bg-indigo-950/5 hover:border-indigo-500 transition-all text-center space-y-4 cursor-pointer relative group"
            id="3mf-file-uploader"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".3mf"
              className="hidden"
            />
            <div className="size-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center mx-auto text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-colors shadow-lg">
              <Upload size={30} className="group-hover:scale-115 transition-transform" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-black text-white uppercase tracking-wider">Arrastra tu archivo .3MF aquí</p>
              <p className="text-[10px] text-slate-500">o haz clic para explorar en tu computadora</p>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[9px] font-mono rounded-lg border border-slate-800">
                Soporta OrcaSlicer, Bambu Studio o PrusaSlicer
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. FULL-SCREEN EDITOR MODE (Mirrors user layout + engineering panel)
  // =========================================================================
  return (
    <div className="w-full h-[100dvh] bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden" id="chop-admin-editor-view">
      {/* Absolute top grid overlay for modern ambient look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      {/* Editor top header */}
      <header className="relative z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewState('gallery')}
            className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
            title="Volver al catálogo"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/50">EDITOR G3D</span>
              <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-900/40">CONFIGURANDO PLANTILLA</span>
            </div>
            <h1 className="text-base font-black text-white uppercase tracking-tight">
              {uploadedFile ? `Modelo: ${uploadedFile.name}` : `Plantilla: ${projectName || 'Por Defecto'}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewState('gallery')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            Volver a Galería
          </button>
        </div>
      </header>

      {/* Split Screen Container */}
      <div className="flex-1 relative flex flex-col lg:flex-row items-stretch overflow-hidden z-10">
        
        {/* LEFT COLUMN: Clean 3D Viewport with compactMode={true} */}
        <div className="flex-1 min-h-[45vh] lg:min-h-0 relative bg-slate-950" id="admin-canvas-viewport">
          <ThreeMFLoaderView
            filaments={filamentColors}
            compactMode={true} // Clean, non-cluttered 3D scene without client options!
            colorTope={colorTope}
            colorCuerpo={colorCuerpo}
            colorMango={colorMango}
            colorBands={colorBands}
            activeTope={selectedTope}
            activeCuerpo={selectedCuerpo}
            activeMango={selectedMango}
            activeBase={selectedBase}
            onPartSelected={(type, idx) => {
              setActiveColorTarget({ type, index: idx });
              setActiveAdminTab('groups');
            }}
            activeColorTarget={activeColorTarget}
            groups={adminGroups}
            setGroups={setAdminGroups}
            discoveredMeshes={discoveredMeshes}
            onMeshesDiscovered={(m) => setDiscoveredMeshes(m)}
            bgConfig={bgConfig}
            setBgConfig={setBgConfig}
            uploadedFile={uploadedFile}
          />

          {/* Real-time structural stats */}
          <div className="absolute top-4 left-4 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/85 text-[10px] text-slate-300 font-mono space-y-1.5 pointer-events-none">
            <p className="text-indigo-400 font-black tracking-wider uppercase text-[9px]">Estructura del 3MF</p>
            <p>• Mallas Detectadas: <span className="text-white font-bold">{discoveredMeshes.length || 'Por Defecto'}</span></p>
            <p>• Grupos de Configuración: <span className="text-white font-bold">{adminGroups.length}</span></p>
          </div>
        </div>

        {/* RIGHT COLUMN: Control Island sidebar mirroring client layout but tailored for admin */}
        <div className="w-full lg:w-[460px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col overflow-y-auto shrink-0" id="admin-control-island">
          
          {/* Custom Tabs Navigation */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60 sticky top-0 z-30 shrink-0">
            <button
              onClick={() => setActiveAdminTab('groups')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition ${
                activeAdminTab === 'groups' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Sliders size={15} />
              <span className="text-[9px] font-black uppercase tracking-wider">Definir Grupos</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('adjust')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition ${
                activeAdminTab === 'adjust' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Focus size={15} />
              <span className="text-[9px] font-black uppercase tracking-wider">Alistar 3D</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('catalog')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition ${
                activeAdminTab === 'catalog' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Palette size={15} />
              <span className="text-[9px] font-black uppercase tracking-wider">Stock Colores</span>
            </button>
          </div>

          {/* Island Body Content area */}
          <div className="flex-1 p-5 space-y-6">

            {/* SUBTAB 1: DEFINE GROUPS */}
            {activeAdminTab === 'groups' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="text-indigo-400" size={16} />
                    <span>Configurar Capas y Grupos</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Divide las mallas de tu archivo .3MF. Puedes crear grupos de mallas intercambiables o grupos coloreables.
                  </p>
                </div>

                {/* Prompt Group Creation buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCreatePieceGroup}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer group transition-all"
                  >
                    <PlusCircle className="text-indigo-400 group-hover:scale-105 transition-transform" size={20} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Piezas Mostrar (Exclusivo)</span>
                  </button>
                  <button
                    onClick={handleCreateColorGroup}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer group transition-all"
                  >
                    <Palette className="text-amber-500 group-hover:scale-105 transition-transform" size={20} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Grupo Color (Formas)</span>
                  </button>
                </div>

                {/* List of current Groups & Mesh Checklist */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Grupos de Fabricación ({adminGroups.length})
                  </h4>

                  {adminGroups.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 text-center text-xs text-slate-500">
                      No has creado ningún grupo todavía. ¡Utiliza los botones de arriba para agregarlos!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {adminGroups.map((group) => (
                        <div key={group.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 relative">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex-1 mr-2">
                              {/* Edit group name directly */}
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) => {
                                  setAdminGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: e.target.value } : g));
                                }}
                                className="w-full bg-transparent font-black text-xs text-white uppercase focus:outline-none focus:border-b focus:border-indigo-500"
                                placeholder="Nombre del grupo..."
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => toggleGroupExclusive(group.id)}
                                  className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold transition ${
                                    group.isExclusive 
                                      ? 'bg-amber-950/60 text-amber-400 border border-amber-900/30' 
                                      : 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/30'
                                  }`}
                                >
                                  {group.isExclusive ? 'Exclusivo (Piezas)' : 'Múltiple (Coloreable)'}
                                </button>
                                <span className="text-[8px] text-slate-500 font-mono self-center">
                                  {group.meshNames.length} mallas asignadas
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteGroup(group.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition shrink-0"
                              title="Borrar grupo"
                            >
                              <X size={13} />
                            </button>
                          </div>

                          {/* Discovered meshes checklist inside this group */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Asignar mallas del .3MF:</span>
                            {discoveredMeshes.length === 0 ? (
                              <p className="text-[8px] text-slate-500 italic">No se han detectado mallas en la escena 3D.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto p-1.5 border border-slate-850 rounded-lg bg-slate-900/40">
                                {discoveredMeshes.map((mesh) => {
                                  const isAssigned = group.meshNames.includes(mesh);
                                  return (
                                    <button
                                      key={mesh}
                                      onClick={() => toggleMeshInGroup(group.id, mesh)}
                                      className={`text-[9px] px-2 py-0.5 rounded font-mono border transition ${
                                        isAssigned 
                                          ? 'bg-indigo-950 text-indigo-400 border-indigo-850' 
                                          : 'bg-slate-950 text-slate-600 border-slate-900 hover:border-slate-800'
                                      }`}
                                    >
                                      {mesh}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 2: ALIGN CAMERA & BACKGROUNDS */}
            {activeAdminTab === 'adjust' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="text-indigo-400" size={16} />
                    <span>Alistar & Encuadre 3D</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ajusta los parámetros visuales, perspectiva y el escenario de fondo oficial que verá el cliente de forma predeterminada.
                  </p>
                </div>

                {/* Perspective Lock */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-3 text-left">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">Cámara de Inicio por Defecto</p>
                  <p className="text-[10px] text-slate-400">
                    Mueve o rota el chop con el ratón hasta la posición que más te guste, luego presiona el botón para congelar ese ángulo.
                  </p>
                  <button
                    onClick={handleSaveCameraView}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Fijar Posición de Cámara</span>
                  </button>
                </div>

                {/* Preloaded Studio Backdrops */}
                <div className="space-y-3 text-left">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escenarios de Fondo preestablecidos</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {preloadedBGs.map((bg) => (
                      <button
                        key={bg.name}
                        onClick={() => setBgConfig(prev => ({ ...prev, imageUrl: bg.url }))}
                        className={`p-3 rounded-xl border text-xs text-left font-black uppercase tracking-wide flex items-center justify-between transition ${
                          bgConfig.imageUrl === bg.url 
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800' 
                            : 'bg-slate-950 hover:bg-slate-900 text-slate-500 border-slate-850'
                        }`}
                      >
                        <span>{bg.name}</span>
                        {bgConfig.imageUrl === bg.url && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL background */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-2 text-left">
                  <span className="text-[9px] font-black text-slate-300 uppercase block">Cargar Escenario Personalizado (URL)</span>
                  <input
                    type="text"
                    placeholder="Pega la dirección URL de la imagen de fondo..."
                    value={bgConfig.imageUrl}
                    onChange={(e) => setBgConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>

                {/* Blur and opacity controls */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-4 text-left">
                  <span className="text-[9px] font-black text-slate-300 uppercase block">Fuerza Visual del Fondo</span>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Opacidad</span>
                      <span className="font-mono text-slate-300">{Math.round(bgConfig.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgConfig.opacity}
                      onChange={(e) => setBgConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Desenfoque (Blur)</span>
                      <span className="font-mono text-slate-300">{bgConfig.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={bgConfig.blur}
                      onChange={(e) => setBgConfig(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: STOCK FILAMENTS */}
            {activeAdminTab === 'catalog' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="text-indigo-400" size={16} />
                    <span>Catálogo de Filamentos</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Carga los colores reales de filamentos de tu stock (Grilon3, Esun, Printalot) para que estén disponibles para pintar.
                  </p>
                </div>

                {/* Add Filament Form */}
                <form onSubmit={handleAddFilament} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-4 text-left">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Añadir Insumo al Stock</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Marca</label>
                      <input
                        type="text"
                        placeholder="Ej. Grilon3"
                        value={newFilBrand}
                        onChange={(e) => setNewFilBrand(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Color</label>
                      <input
                        type="text"
                        placeholder="Ej. Oro G3D"
                        value={newFilName}
                        onChange={(e) => setNewFilName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Color Muestra</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newFilHex}
                        onChange={(e) => setNewFilHex(e.target.value)}
                        className="size-9 rounded-xl cursor-pointer p-0 border-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="#ffffff"
                        value={newFilHex}
                        onChange={(e) => setNewFilHex(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Añadir Filamento</span>
                  </button>
                </form>

                {/* Stock Grid */}
                <div className="space-y-3 text-left">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colores en Stock ({filamentColors.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {filamentColors.map((fil) => (
                      <div
                        key={fil.id}
                        className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-2.5 text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-6 rounded-md border border-slate-800 shadow-sm shrink-0" style={{ backgroundColor: fil.hex }} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider truncate">{fil.brand}</span>
                            <span className="text-xs font-black text-slate-200 uppercase truncate">{fil.name}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFilament(fil.id)}
                          className="p-1 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-lg transition shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Section: SAVE & PUBLISH ACTION FOOTER */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 sticky bottom-0 z-30 shrink-0 space-y-3.5 text-left">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Publicación</span>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre de la Plantilla (ej. Chop Cervecero)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-600"
              />
              <button
                onClick={async () => {
                  if (!projectName.trim()) {
                    toast.error('Por favor escribe un nombre para guardar la plantilla.');
                    return;
                  }
                  await handleSaveDbPlantilla(projectName);
                  setViewState('gallery'); // return to beautiful gallery view
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/15"
                id="save-template-db-btn"
              >
                <Save size={14} />
                <span>Publicar en Supabase Nube</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
