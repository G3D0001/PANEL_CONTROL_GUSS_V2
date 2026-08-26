import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Trash2, 
  Download, 
  Copy, 
  Upload, 
  Check, 
  RotateCw, 
  Sliders, 
  MessageSquare,
  RefreshCw,
  Eye,
  Settings,
  HelpCircle,
  Plus,
  Save,
  ChevronRight,
  Info,
  X,
  FolderOpen,
  Calendar,
  Layers,
  Image as ImageIcon,
  Type,
  FileCode,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { ThreeMFLoaderView } from './ThreeMFLoaderView';

// Re-use types
import { FilamentColor, TopeTemplate, CuerpoTemplate, MangoTemplate, BaseTemplate, SavedProject } from './ChopCustomizer';

export interface ChopClientViewProps {
  cuerpos: CuerpoTemplate[];
  topes: TopeTemplate[];
  mangos: MangoTemplate[];
  bases: BaseTemplate[];
  filamentColors: FilamentColor[];
  
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

  logoImage: string | null;
  setLogoImage: (img: string | null) => void;
  originalLogo: string | null;
  setOriginalLogo: (img: string | null) => void;
  removeBgMode: 'none' | 'white' | 'black';
  setRemoveBgMode: (mode: 'none' | 'white' | 'black') => void;
  bgThreshold: number;
  setBgThreshold: (threshold: number) => void;
  logoScale: number;
  setLogoScale: (scale: number) => void;
  logoRotate: number;
  setLogoRotate: (rotate: number) => void;
  logoX: number;
  setLogoX: (x: number) => void;
  logoY: number;
  setLogoY: (y: number) => void;

  embossedText: string;
  setEmbossedText: (text: string) => void;
  textDepthMode: 'embossed' | 'carved' | 'flat';
  setTextDepthMode: (mode: 'embossed' | 'carved' | 'flat') => void;
  textColor: string;
  setTextColor: (color: string) => void;
  textSize: number;
  setTextSize: (size: number) => void;
  textRotation: number;
  setTextRotation: (rotate: number) => void;

  savedProjects: SavedProject[];
  projectName: string;
  setProjectName: (name: string) => void;
  handleSaveProject: () => void;
  handleLoadProject: (proj: SavedProject) => void;
  handleDeleteProject: (id: string, e: React.MouseEvent) => void;
  handleExportBackup: () => void;
  handleImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;

  handleCopyLink: () => void;
  handleWhatsAppShare: () => void;
  handleDownloadImage: () => void;

  setAppMode: (mode: 'client' | 'admin') => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dbPlantillas: any[];
  loadingPlantillas: boolean;
  handleSaveDbPlantilla: (name: string) => Promise<void>;
  handleDeleteDbPlantilla: (id: string, e: React.MouseEvent) => Promise<void>;
  handleLoadDbPlantilla: (dbProj: any) => void;
}

export const ChopClientView: React.FC<ChopClientViewProps> = ({
  cuerpos,
  topes,
  mangos,
  bases,
  filamentColors,
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
  logoImage,
  setLogoImage,
  originalLogo,
  setOriginalLogo,
  removeBgMode,
  setRemoveBgMode,
  bgThreshold,
  setBgThreshold,
  logoScale,
  setLogoScale,
  logoRotate,
  setLogoRotate,
  logoX,
  setLogoX,
  logoY,
  setLogoY,
  embossedText,
  setEmbossedText,
  textDepthMode,
  setTextDepthMode,
  textColor,
  setTextColor,
  textSize,
  setTextSize,
  textRotation,
  setTextRotation,
  savedProjects,
  projectName,
  setProjectName,
  handleSaveProject,
  handleLoadProject,
  handleDeleteProject,
  handleExportBackup,
  handleImportBackup,
  handleCopyLink,
  handleWhatsAppShare,
  handleDownloadImage,
  setAppMode,
  fileInputRef,
  dbPlantillas,
  loadingPlantillas,
  handleSaveDbPlantilla,
  handleDeleteDbPlantilla,
  handleLoadDbPlantilla
}) => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [activeClientTab, setActiveClientTab] = useState<'capacity' | 'shapes' | 'colors' | 'logo' | 'text' | 'gallery' | 'specs'>('capacity');
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const activeCuerpoObj = cuerpos.find(c => c.id === selectedCuerpo) || cuerpos[0];
  const activeTopeObj = topes.find(t => t.id === selectedTope) || topes[0];
  const activeMangoObj = mangos.find(m => m.id === selectedMango) || mangos[0];
  const activeBaseObj = bases.find(b => b.id === selectedBase) || bases[0];

  const getActiveTargetColorValue = () => {
    if (activeColorTarget.type === 'tope') return colorTope;
    if (activeColorTarget.type === 'cuerpo') return colorCuerpo;
    if (activeColorTarget.type === 'mango') return colorMango;
    if (activeColorTarget.type === 'band') {
      return colorBands[activeColorTarget.index ?? 0] || '#ffffff';
    }
    return colorCuerpo;
  };

  const updateActiveTargetColor = (color: string) => {
    if (activeColorTarget.type === 'tope') setColorTope(color);
    if (activeColorTarget.type === 'cuerpo') setColorCuerpo(color);
    if (activeColorTarget.type === 'mango') setColorMango(color);
    if (activeColorTarget.type === 'band') {
      const idx = activeColorTarget.index ?? 0;
      setColorBands(prev => {
        const next = [...prev];
        next[idx] = color;
        return next;
      });
    }
  };

  // Group filaments by brand for an outstanding picker UI
  const filamentsByBrand = filamentColors.reduce((acc, f) => {
    if (!f.active) return acc;
    if (!acc[f.brand]) acc[f.brand] = [];
    acc[f.brand].push(f);
    return acc;
  }, {} as Record<string, FilamentColor[]>);

  // Client tabs definition
  const tabs = [
    { id: 'capacity', label: 'Capacidad', icon: Sliders, desc: 'Volumen' },
    { id: 'shapes', label: 'Siluetas', icon: RotateCw, desc: 'Moldes' },
    { id: 'colors', label: 'Pintar', icon: SlidersHorizontal, desc: 'Filamentos' },
    { id: 'logo', label: 'Logotipo', icon: ImageIcon, desc: 'Escudos' },
    { id: 'text', label: 'Texto 3D', icon: Type, desc: 'Grabado' },
    { id: 'gallery', label: 'Galería', icon: FolderOpen, desc: 'Respaldos' },
    { id: 'specs', label: 'Pedido', icon: MessageSquare, desc: 'Finalizar' },
  ] as const;

  const renderTabContent = () => {
    switch (activeClientTab) {
      case 'capacity':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Capacidad</span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">1. Volumen del Jarro (Litraje)</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {cuerpos.map(c => (
                <button
                  key={c.id}
                  id={`btn-cuerpo-${c.id}`}
                  onClick={() => {
                    setSelectedCuerpo(c.id);
                    toast.success(`Capacidad cambiada a ${c.name}`);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    selectedCuerpo === c.id 
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-md shadow-indigo-600/5 scale-105'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl opacity-75">sports_bar</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">{c.name.split(' ')[1] || c.name}</span>
                    <span className="text-[8px] opacity-75 font-mono">{c.litraje}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[9px] tracking-wide">💡 Proporción Predictiva:</span>
              <p>Al alternar la capacidad, el modelo 3D recalcula el alto del cilindro de forma matemática para mantener el litraje óptimo. Manijas y bases se ajustan automáticamente.</p>
            </div>
          </div>
        );

      case 'shapes':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Siluetas</span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">2. Moldes y Estilos</h3>
            </div>

            {/* Tope Styles */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Diseño del Tope / Labio Superior</span>
              <div className="grid grid-cols-3 gap-2">
                {topes.map(t => (
                  <button
                    key={t.id}
                    id={`btn-tope-${t.id}`}
                    onClick={() => setSelectedTope(t.id)}
                    className={`px-2 py-2 rounded-xl border text-center text-[10px] font-black uppercase transition-all cursor-pointer ${
                      selectedTope === t.id
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.name.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Mango Styles */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Diseño de la Manija / Mango</span>
              <div className="grid grid-cols-3 gap-2">
                {mangos.map(m => (
                  <button
                    key={m.id}
                    id={`btn-mango-${m.id}`}
                    onClick={() => setSelectedMango(m.id)}
                    className={`px-2 py-2 rounded-xl border text-center text-[10px] font-black uppercase transition-all cursor-pointer ${
                      selectedMango === m.id
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.name.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Styles */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estilo de Base / Franjas de Color</span>
              <div className="grid grid-cols-2 gap-2">
                {bases.map(b => (
                  <button
                    key={b.id}
                    id={`btn-base-${b.id}`}
                    onClick={() => {
                      setSelectedBase(b.id);
                      toast.success(`Base cambiada a ${b.name}`);
                    }}
                    className={`px-2 py-2 rounded-xl border text-left text-[10px] font-black uppercase transition-all cursor-pointer ${
                      selectedBase === b.id
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block font-black truncate">{b.name}</span>
                    <span className="text-[8px] text-slate-400 font-medium lowercase">({b.bandsCount} franjas)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Filamentos</span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">3. Pintar Secciones</h3>
              </div>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-400 font-mono">
                {getActiveTargetColorValue()}
              </span>
            </div>

            {/* Quick selector of parts */}
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pieza Seleccionada a Pintar</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { type: 'cuerpo', label: 'Cuerpo', desc: 'Principal' },
                  { type: 'tope', label: 'Tope', desc: 'Labio' },
                  { type: 'mango', label: 'Manija', desc: 'Mango' },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => setActiveColorTarget({ type: item.type as any })}
                    className={`flex-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all cursor-pointer ${
                      activeColorTarget.type === item.type 
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* Bands selector */}
              {activeBaseObj.bandsCount > 0 && (
                <div className="space-y-1 mt-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Franjas de Base</span>
                  <div className="flex gap-1">
                    {Array.from({ length: activeBaseObj.bandsCount }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveColorTarget({ type: 'band', index: idx })}
                        className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-black uppercase border transition-all cursor-pointer ${
                          activeColorTarget.type === 'band' && activeColorTarget.index === idx
                            ? 'bg-indigo-600 border-indigo-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-850'
                        }`}
                      >
                        Franja {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filaments catalog */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {Object.keys(filamentsByBrand).length > 0 ? (
                (Object.entries(filamentsByBrand) as [string, FilamentColor[]][]).map(([brand, colors]) => (
                  <div key={brand} className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100/40 pb-0.5">{brand}</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {colors.map(color => {
                        const isSelected = getActiveTargetColorValue().toLowerCase() === color.hex.toLowerCase();
                        return (
                          <button
                            key={color.id}
                            title={`${color.brand} - ${color.name}`}
                            onClick={() => updateActiveTargetColor(color.hex)}
                            className={`h-8 rounded-lg cursor-pointer relative flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 scale-105 border-transparent' 
                                : 'border-slate-200 dark:border-slate-800 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.hex }}
                          >
                            {isSelected ? (
                              <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                                <Check size={12} className="text-white drop-shadow" />
                              </div>
                            ) : (
                              <span className="text-[7px] bg-black/40 text-white px-0.5 py-0.5 rounded absolute bottom-0.5 left-0.5 right-0.5 font-black uppercase text-center truncate">
                                {color.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No hay filamentos de stock guardados.</p>
              )}
            </div>

            {/* Free hex color fallback */}
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
              <input
                type="color"
                value={getActiveTargetColorValue()}
                onChange={(e) => updateActiveTargetColor(e.target.value)}
                className="size-8 rounded-lg cursor-pointer p-0 border border-slate-200 dark:border-slate-800"
              />
              <div className="flex-1">
                <span className="text-[10px] font-black text-slate-900 dark:text-white block uppercase tracking-wide leading-none">Mezcla Libre / Hexadecimal</span>
                <span className="text-[9px] text-slate-500 font-mono">Hex: {getActiveTargetColorValue().toUpperCase()}</span>
              </div>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Personalizado</span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">4. Cargar Escudo o Logo</h3>
              </div>
              {logoImage && (
                <button
                  onClick={() => {
                    setLogoImage(null);
                    setOriginalLogo(null);
                    toast.success("Logo removido");
                  }}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={11} />
                  <span>Quitar</span>
                </button>
              )}
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-200 hover:border-indigo-500/50 dark:border-slate-800 dark:hover:border-indigo-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer bg-slate-50/50 dark:bg-slate-950/20"
            >
              <div className="size-9 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                <Upload size={16} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-950 dark:text-white block uppercase tracking-wide">Arrastrar o seleccionar Logo</span>
                <span className="text-[8px] text-slate-400 block">Formato JPG, PNG o WEBP de alta resolución</span>
              </div>
            </div>

            {originalLogo && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Filtro Inteligente de Transparencia</span>
                <div className="flex gap-1.5">
                  {(['none', 'white', 'black'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setRemoveBgMode(mode)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase border transition cursor-pointer ${
                        removeBgMode === mode ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {mode === 'none' ? 'Original' : mode === 'white' ? 'Quitar Blanco' : 'Quitar Negro'}
                    </button>
                  ))}
                </div>

                {removeBgMode !== 'none' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-slate-400 uppercase font-black">
                      <span>Tolerancia de fondo</span>
                      <span className="text-indigo-600">{bgThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="110"
                      value={bgThreshold}
                      onChange={(e) => setBgThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Adjustments for scale/rotation */}
            {logoImage && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Dimensiones y Desplazamientos</span>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="space-y-0.5">
                    <label className="font-bold text-slate-400 flex justify-between uppercase">
                      <span>Escala</span>
                      <span>{Math.round(logoScale * 100)}%</span>
                    </label>
                    <input type="range" min="0.3" max="2.0" step="0.05" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-full accent-indigo-600 h-1" />
                  </div>

                  <div className="space-y-0.5">
                    <label className="font-bold text-slate-400 flex justify-between uppercase">
                      <span>Rotar</span>
                      <span>{logoRotate}°</span>
                    </label>
                    <input type="range" min="-180" max="180" step="5" value={logoRotate} onChange={(e) => setLogoRotate(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1" />
                  </div>

                  <div className="space-y-0.5">
                    <label className="font-bold text-slate-400 flex justify-between uppercase">
                      <span>Mover X</span>
                      <span>{logoX}px</span>
                    </label>
                    <input type="range" min="-60" max="60" value={logoX} onChange={(e) => setLogoX(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1" />
                  </div>

                  <div className="space-y-0.5">
                    <label className="font-bold text-slate-400 flex justify-between uppercase">
                      <span>Mover Y</span>
                      <span>{logoY}px</span>
                    </label>
                    <input type="range" min="-110" max="110" value={logoY} onChange={(e) => setLogoY(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1" />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setLogoScale(1.0);
                      setLogoRotate(0);
                      setLogoX(0);
                      setLogoY(0);
                      toast.info("Ajustes restablecidos.");
                    }}
                    className="inline-flex items-center gap-1 text-[8px] font-black text-slate-500 hover:text-slate-700 uppercase"
                  >
                    <RefreshCw size={10} />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Letras 3D</span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">5. Grabado y Bajorrelieve</h3>
              </div>
              {embossedText && (
                <button
                  onClick={() => {
                    setEmbossedText('');
                    toast.success("Texto grabado removido.");
                  }}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={11} />
                  <span>Quitar</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Texto Personalizado</label>
              <input
                type="text"
                maxLength={24}
                value={embossedText}
                onChange={(e) => setEmbossedText(e.target.value)}
                placeholder="Ej. PAPÁ, MATEO, G3D"
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase block">Color Letras</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="size-6 rounded cursor-pointer p-0 border-0"
                  />
                  <span className="text-[10px] font-mono font-bold uppercase">{textColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex justify-between">
                  <span>Tamaño</span>
                  <span className="font-mono">{textSize}px</span>
                </label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={textSize}
                  onChange={(e) => setTextSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1 mt-1.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estilo de Relieve</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['embossed', 'carved', 'flat'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTextDepthMode(mode);
                      toast.success(mode === 'embossed' ? "Efecto de relieve" : mode === 'carved' ? "Efecto bajorrelieve" : "Texto plano superficial");
                    }}
                    className={`py-2 rounded-xl border text-center text-[9px] font-black uppercase transition cursor-pointer ${
                      textDepthMode === mode
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {mode === 'embossed' ? 'Relieve' : mode === 'carved' ? 'Calado' : 'Plano'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase flex justify-between">
                <span>Inclinación Alrededor</span>
                <span className="font-mono">{textRotation}°</span>
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={textRotation}
                onChange={(e) => setTextRotation(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1 mt-1.5"
              />
            </div>
          </div>
        );

      case 'gallery':
        const isAdmin = userRole === 'Administrador';
        return (
          <div className="space-y-4 animate-fade-in flex flex-col h-full max-h-[500px]">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Galería</span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">6. Modelos de la Casa y Galería</h3>
            </div>

            {/* Formulario de Guardado */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2 shrink-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Guardar Simulación Actual</span>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Ej. Mi Chop Dorado, Club G3D..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProject}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-black uppercase text-[9px] tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Guarda este diseño de forma local en tu navegador"
                  >
                    <Save size={12} />
                    <span>Guardar Borrador (Local)</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleSaveDbPlantilla(projectName)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Guarda este diseño en Supabase como una plantilla oficial reutilizable por todos los usuarios"
                    >
                      <Sparkles size={12} />
                      <span>Subir como Plantilla (Nube)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Listas de Galería (Dos secciones en un contenedor scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[160px] max-h-[220px]">
              {/* Sección 1: Plantillas Oficiales de Supabase */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">⭐ Plantillas Oficiales ({dbPlantillas?.length || 0})</span>
                  {loadingPlantillas && (
                    <span className="text-[8px] text-indigo-500 font-bold animate-pulse">Sincronizando...</span>
                  )}
                </div>
                {dbPlantillas && dbPlantillas.length > 0 ? (
                  <div className="space-y-1.5">
                    {dbPlantillas.map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => handleLoadDbPlantilla(proj)}
                        className="p-2 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 rounded-xl border border-indigo-100/30 dark:border-indigo-950/20 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="size-6 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                            <Sparkles size={12} />
                          </div>
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-[10px] font-black text-slate-950 dark:text-white uppercase truncate max-w-[150px]">{proj.nombre}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Modelo Oficial de Fábrica</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteDbPlantilla(proj.id, e)}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-md transition cursor-pointer shrink-0"
                            title="Eliminar plantilla de la base de datos"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-500 italic">No hay plantillas oficiales subidas en la nube.</p>
                )}
              </div>

              {/* Sección 2: Proyectos Locales */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">📂 Mis Simulaciones Locales ({savedProjects.length})</span>
                {savedProjects.length > 0 ? (
                  <div className="space-y-1.5">
                    {savedProjects.map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => handleLoadProject(proj)}
                        className="p-2 bg-slate-100/40 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="size-6 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm">sports_bar</span>
                          </div>
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-[10px] font-black text-slate-950 dark:text-white uppercase truncate max-w-[150px]">{proj.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{proj.date}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-md transition cursor-pointer shrink-0"
                          title="Eliminar diseño local"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-500 italic">No tienes diseños guardados en tu caché local.</p>
                )}
              </div>
            </div>

            {/* Cache protection / Backup buttons */}
            <div className="bg-indigo-50/40 dark:bg-indigo-950/10 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-950/30 space-y-2">
              <div>
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block leading-none mb-1">Copia de Seguridad y Caché</span>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Si borras el historial o cambias de PC, perderás tus diseños locales. Descarga una copia aquí para restaurarla cuando quieras:</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-2 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 text-[9px] font-black uppercase tracking-wider hover:bg-indigo-50/30 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download size={11} />
                  <span>Exportar Respaldo</span>
                </button>
                <button
                  onClick={() => importFileInputRef.current?.click()}
                  className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 text-[9px] font-black uppercase tracking-wider hover:bg-slate-50 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload size={11} />
                  <span>Importar Respaldo</span>
                </button>
                <input
                  type="file"
                  ref={importFileInputRef}
                  onChange={handleImportBackup}
                  accept=".g3d,.json"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        );

      case 'specs':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ficha Técnica</span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">7. Confirmar y Enviar Pedido</h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] font-mono space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100/40 pb-1 font-bold">
                <span>Capacidad / Volumen:</span>
                <span className="text-indigo-600 dark:text-indigo-400 uppercase">{activeCuerpoObj.name} ({activeCuerpoObj.litraje})</span>
              </div>
              <div className="flex justify-between">
                <span>Tope Silueta:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{activeTopeObj.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cuerpo principal:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{colorCuerpo}</span>
              </div>
              <div className="flex justify-between">
                <span>Manija / Mango:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{activeMangoObj.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100/40 pb-1">
                <span>Mango Color:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{colorMango}</span>
              </div>
              <div className="flex justify-between">
                <span>Plantilla Base:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{activeBaseObj.name}</span>
              </div>
              {Array.from({ length: activeBaseObj.bandsCount }).map((_, idx) => (
                <div key={idx} className="flex justify-between pl-3 text-[9px] opacity-80">
                  <span>• Color Franja {idx + 1}:</span>
                  <span className="font-bold uppercase">{colorBands[idx] || '#ffffff'}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1 font-bold text-[11px]">
                <span>Escudo / Logotipo:</span>
                <span className={logoImage ? 'text-emerald-600' : 'text-slate-400'}>
                  {logoImage ? 'Cargado ✓' : 'No cargado'}
                </span>
              </div>
              {embossedText && (
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Grabado 3D:</span>
                  <span className="text-cyan-500 uppercase">"{embossedText}"</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Enviar Pedido por WhatsApp</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider transition cursor-pointer border border-slate-200/50 dark:border-slate-700"
                >
                  <Copy size={12} />
                  <span>Copiar Link</span>
                </button>
                <button
                  onClick={handleDownloadImage}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider transition cursor-pointer border border-slate-200/50 dark:border-slate-700"
                >
                  <Download size={12} />
                  <span>Ficha Técnica HD</span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-slate-900 dark:text-white relative flex flex-col lg:flex-row">
      {/* 1. TOP-BAR / IMMERSIVE SHORTCUT ACTIONS */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 shadow-lg cursor-pointer transition-all hover:scale-105"
          title="Volver al Panel Administrativo"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div className="hidden sm:flex flex-col bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800/50 text-white shadow-lg leading-none">
          <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400">G3D Creator</span>
          <span className="text-[11px] font-black uppercase mt-0.5">Simulador de Chop 3D</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setAppMode('admin')}
          className="px-4 py-3 bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-105"
          title="Configuración de fábrica de siluetas, marcas y filamentos"
        >
          <Settings size={14} />
          <span>Ajustes de Fábrica</span>
        </button>
      </div>

      {/* 2. MAIN WORKSPACE */}
      
      {/* DESKTOP VIEWPORT LAYOUT */}
      <div className="hidden lg:flex flex-row w-full h-full relative">
        {/* Visualizer (3D View in background/left side) */}
        <div className="flex-1 h-full relative z-0">
          <ThreeMFLoaderView 
            compactMode={true}
            colorTope={colorTope}
            colorCuerpo={colorCuerpo}
            colorMango={colorMango}
            colorBands={colorBands}
            activeTope={selectedTope}
            activeCuerpo={selectedCuerpo}
            activeMango={selectedMango}
            activeBase={selectedBase}
            logoImage={logoImage}
            logoScale={logoScale}
            logoRotate={logoRotate}
            logoX={logoX}
            logoY={logoY}
            textEngrave={embossedText}
            textDepthMode={textDepthMode}
            textColor={textColor}
            textSize={textSize}
            textRotation={textRotation}
            onPartSelected={(partType, index) => {
              setActiveColorTarget({ type: partType, index });
              setActiveClientTab('colors');
              toast.info(`Sección para pintar activada: ${partType === 'band' ? `Franja de Base ${index! + 1}` : partType === 'tope' ? 'Tope' : partType === 'mango' ? 'Manija' : 'Cuerpo'}`);
            }}
            activeColorTarget={activeColorTarget}
            onOpenAdmin={() => setAppMode('admin')}
          />

          <div className="absolute bottom-6 left-6 bg-slate-950/70 backdrop-blur-sm border border-slate-800/50 px-4 py-2 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-none">
            <span className="material-symbols-outlined text-sm text-cyan-400">3d_rotation</span>
            <span>Arrastra para girar • Rueda para zoom • Haz clic en una pieza para pintarla</span>
          </div>
        </div>

        {/* Floating Tool Island (Right Side) */}
        <div className="w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl z-10 m-6 flex flex-col overflow-hidden h-[calc(100vh-48px)] animate-fade-in relative">
          
          {/* Island Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
            <div>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">FÁBRICA CREATIVA</span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Personalizador Chop</h2>
            </div>
            <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-mono uppercase">
              {activeCuerpoObj.name.split(' ')[1] || '500cc'}
            </span>
          </div>

          {/* Compact Grid Tab Buttons */}
          <div className="grid grid-cols-4 gap-1 p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {tabs.map(tab => {
              const isSelected = activeClientTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-desktop-${tab.id}`}
                  onClick={() => setActiveClientTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={15} />
                  <span className="text-[8px] font-black uppercase mt-1 tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Island Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {renderTabContent()}
          </div>

          {/* Island Footer Info */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-wider">
            <span>G3D FÁBRICA DE CHOP</span>
            <span className="text-cyan-500">100% Autogestionable</span>
          </div>
        </div>
      </div>

      {/* MOBILE VIEWPORT LAYOUT */}
      <div className="flex lg:hidden flex-col w-full h-full">
        {/* Top Half: Visualizer */}
        <div className="flex-1 relative bg-slate-950 z-0">
          <ThreeMFLoaderView 
            compactMode={true}
            colorTope={colorTope}
            colorCuerpo={colorCuerpo}
            colorMango={colorMango}
            colorBands={colorBands}
            activeTope={selectedTope}
            activeCuerpo={selectedCuerpo}
            activeMango={selectedMango}
            activeBase={selectedBase}
            logoImage={logoImage}
            logoScale={logoScale}
            logoRotate={logoRotate}
            logoX={logoX}
            logoY={logoY}
            textEngrave={embossedText}
            textDepthMode={textDepthMode}
            textColor={textColor}
            textSize={textSize}
            textRotation={textRotation}
            onPartSelected={(partType, index) => {
              setActiveColorTarget({ type: partType, index });
              setActiveClientTab('colors');
              toast.info(`Sección para pintar: ${partType === 'band' ? `Franja Base ${index! + 1}` : partType === 'tope' ? 'Tope' : partType === 'mango' ? 'Manija' : 'Cuerpo'}`);
            }}
            activeColorTarget={activeColorTarget}
            onOpenAdmin={() => setAppMode('admin')}
          />
          <div className="absolute bottom-3 left-3 bg-slate-950/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 pointer-events-none">
            <span className="material-symbols-outlined text-[10px] text-cyan-400">3d_rotation</span>
            <span>Arrastra para girar • Toca piezas</span>
          </div>
        </div>

        {/* Bottom Half: Island Panel */}
        <div className="h-[55vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden">
          {/* Scrollable Horizontal Tabs Row */}
          <div className="flex items-center gap-1 p-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto select-none no-scrollbar flex-none">
            {tabs.map(tab => {
              const isSelected = activeClientTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-mobile-${tab.id}`}
                  onClick={() => setActiveClientTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer flex-none h-10 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <tab.icon size={13} />
                  <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Area (Scrolleable with padding) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
