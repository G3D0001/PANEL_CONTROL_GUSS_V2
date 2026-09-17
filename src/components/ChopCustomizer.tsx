import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { 
  Sparkles, 
  Trash2, 
  Download, 
  Share2, 
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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch3D } from './Switch3D';
import { ThreeMFLoaderView } from './ThreeMFLoaderView';
import { ChopClientView } from './ChopClientView';
import { ChopAdminView } from './ChopAdminView';

// ==========================================
// TYPES & SCHEMAS FOR CONFIGURATION
// ==========================================

export interface FilamentColor {
  id: string;
  brand: string; // e.g. "Grilon3", "Esun", "Printalot"
  name: string;  // e.g. "Amarillo Chop", "Rojo Fuego"
  hex: string;   // e.g. "#eab308"
  active: boolean;
}

export interface TopeTemplate {
  id: string;
  name: string;
  ry: number; // thickness/ellipse height ratio
  yOffset: number; // custom placement offset
  scale: number;
  customPath?: string; // Optional custom SVG path d="..." to draw instead of standard ellipse
}

export interface CuerpoTemplate {
  id: string;
  name: string;
  litraje: string; // e.g. "500cc (0.5L)", "750cc (0.75L)", "1000cc (1.0L)"
  scaleX: number; // width multiplier (e.g. 1.0, 1.15, 1.3)
  scaleY: number; // height multiplier (e.g. 1.0, 1.1, 1.25)
}

export interface MangoTemplate {
  id: string;
  name: string;
  path: string; // SVG path command e.g. "M 270,110 L 350,130 ..."
  scale: number;
  xOffset: number;
  yOffset: number;
}

export interface BaseTemplate {
  id: string;
  name: string;
  bandsCount: number; // e.g. 2, 3, or 4
  // Generates paths dynamically based on cx (center) and bodyWidth for a perfect fit!
  // If provided, we can also use fixed/custom paths.
  bandPaths: string[]; // custom paths relative to (0,0) or dynamic generators
}

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  selectedTope: string;
  selectedCuerpo: string;
  selectedMango: string;
  selectedBase: string;
  colorTope: string;
  colorCuerpo: string;
  colorMango: string;
  colorBands: string[];
  logoImage: string | null;
  embossedText: string;
  textDepthMode: 'embossed' | 'carved' | 'flat';
  textColor: string;
  textSize: number;
  textRotation: number;
}

// ==========================================
// INITIAL DEFAULT PRESETS (THEME FACTORY)
// ==========================================

const DEFAULT_FILAMENTS: FilamentColor[] = [
  { id: 'f1', brand: 'Grilon3', name: 'Oro G3D', hex: '#d4af37', active: true },
  { id: 'f2', brand: 'Grilon3', name: 'Amarillo Chop', hex: '#eab308', active: true },
  { id: 'f3', brand: 'Grilon3', name: 'Negro Mate', hex: '#1e1e1e', active: true },
  { id: 'f4', brand: 'Grilon3', name: 'Blanco Puro', hex: '#ffffff', active: true },
  { id: 'f5', brand: 'Grilon3', name: 'Rojo Fuego', hex: '#e11d48', active: true },
  { id: 'f6', brand: 'Esun', name: 'Azul Eléctrico', hex: '#2563eb', active: true },
  { id: 'f7', brand: 'Esun', name: 'Celeste Arg', hex: '#7dd3fc', active: true },
  { id: 'f8', brand: 'Esun', name: 'Naranja Vivo', hex: '#ea580c', active: true },
  { id: 'f9', brand: 'Printalot', name: 'Verde Bosque', hex: '#16a34a', active: true },
  { id: 'f10', brand: 'Printalot', name: 'Gris Plata', hex: '#94a3b8', active: true },
];

const DEFAULT_TOPES: TopeTemplate[] = [
  { id: 't1', name: 'Borde Plano Clásico', ry: 18, yOffset: 0, scale: 1.0 },
  { id: 't2', name: 'Labio Grueso Redondo', ry: 26, yOffset: -2, scale: 1.05 },
  { id: 't3', name: 'Borde Acampanado Alto', ry: 14, yOffset: -6, scale: 1.0, customPath: 'M 100,0 C 100,-15 280,-15 280,0 C 280,10 100,10 100,0' },
];

const DEFAULT_CUERPOS: CuerpoTemplate[] = [
  { id: 'c1', name: 'Chop Estándar (500cc)', litraje: '0.5 Litros', scaleX: 1.0, scaleY: 1.0 },
  { id: 'c2', name: 'Chop Mediano (750cc)', litraje: '0.75 Litros', scaleX: 1.15, scaleY: 1.1 },
  { id: 'c3', name: 'Chop Gigante (1000cc)', litraje: '1.0 Litro', scaleX: 1.3, scaleY: 1.25 },
];

const DEFAULT_MANGOS: MangoTemplate[] = [
  { 
    id: 'm1', 
    name: 'Manija Geométrica G3D', 
    path: 'M 0,40 L 80,60 L 80,260 L 0,290 L 0,230 L 40,215 L 40,115 L 0,95 Z', 
    scale: 1.0, 
    xOffset: -10, 
    yOffset: 0 
  },
  { 
    id: 'm2', 
    name: 'Asa Redondeada Confort', 
    path: 'M 0,30 C 70,10 100,50 100,150 C 100,250 70,290 0,270 C 15,230 50,210 50,150 C 50,90 15,70 0,30 Z', 
    scale: 1.0, 
    xOffset: -5, 
    yOffset: 10 
  },
  { 
    id: 'm3', 
    name: 'Mango Deportivo Ergonómico', 
    path: 'M 0,35 L 75,55 C 85,55 90,75 85,95 L 70,145 C 80,155 85,175 75,195 L 60,245 C 70,255 70,275 55,285 L 0,265 L 0,215 L 25,200 L 35,145 L 20,130 L 30,85 L 0,70 Z', 
    scale: 1.0, 
    xOffset: -10, 
    yOffset: 5 
  }
];

const DEFAULT_BASES: BaseTemplate[] = [
  {
    id: 'b1',
    name: 'Tratamiento Clásico 3-Bandas',
    bandsCount: 3,
    bandPaths: [
      'M 0,0 L 160,0 L 166,20 L -6,20 Z',    // Band 1
      'M -6,20 L 166,20 L 174,40 L -14,40 Z', // Band 2
      'M -14,40 L 174,40 L 180,60 L -20,60 Z' // Band 3
    ]
  },
  {
    id: 'b2',
    name: 'Base Compacta 2-Bandas',
    bandsCount: 2,
    bandPaths: [
      'M -3,0 L 163,0 L 172,26 L -12,26 Z',   // Band 1
      'M -12,26 L 172,26 L 180,56 L -20,56 Z' // Band 2
    ]
  },
  {
    id: 'b3',
    name: 'Doble Anillo Ranurado',
    bandsCount: 3,
    bandPaths: [
      'M -5,5 C -5,-5 165,-5 165,5 C 165,15 -5,15 -5,5 Z', // Ring 1
      'M -2,12 L 162,12 L 162,38 L -2,38 Z',                // Central sleeve
      'M -8,38 C -8,28 168,28 168,38 C 168,48 -8,48 -8,38 Z' // Ring 3
    ]
  },
  {
    id: 'b4',
    name: 'Armadura Base 4-Bandas G3D',
    bandsCount: 4,
    bandPaths: [
      'M 2,0 L 158,0 L 162,14 L -2,14 Z',
      'M -2,14 L 162,14 L 168,28 L -8,28 Z',
      'M -8,28 L 168,28 L 174,42 L -14,42 Z',
      'M -14,42 L 174,42 L 180,56 L -20,56 Z'
    ]
  }
];

export function ChopCustomizer() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  
  // Customizer active client tab selection: capacity, shapes, colors, logo, text, gallery, specs
  const [activeClientTab, setActiveClientTab] = useState<'capacity' | 'shapes' | 'colors' | 'logo' | 'text' | 'gallery' | 'specs'>('capacity');
  
  // Project Gallery storage states
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    const saved = localStorage.getItem('g3d_chop_chop_projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Database Plantillas (Supabase)
  const [dbPlantillas, setDbPlantillas] = useState<any[]>([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);

  const fetchDbPlantillas = async () => {
    setLoadingPlantillas(true);
    const res = await apiService.getChopPlantillas();
    if (res.success && res.data) {
      setDbPlantillas(res.data);
    }
    setLoadingPlantillas(false);
  };

  useEffect(() => {
    fetchDbPlantillas();
  }, []);

  // Storage Persistence Request (To prevent automatic clearing of localStorage on cache clean)
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persisted) => {
        if (persisted) {
          console.log("Storage is persisted and exempt from automatic cleanup!");
        } else {
          console.log("Requesting storage persistence...");
        }
      });
    }
  }, []);

  // ==========================================
  // PERSISTENT EDITABLE STATE MANAGER
  // ==========================================
  const [filamentColors, setFilamentColors] = useState<FilamentColor[]>(() => {
    const saved = localStorage.getItem('g3d_customizer_filaments');
    return saved ? JSON.parse(saved) : DEFAULT_FILAMENTS;
  });

  const [topes, setTopes] = useState<TopeTemplate[]>(() => {
    const saved = localStorage.getItem('g3d_customizer_topes');
    return saved ? JSON.parse(saved) : DEFAULT_TOPES;
  });

  const [cuerpos, setCuerpos] = useState<CuerpoTemplate[]>(() => {
    const saved = localStorage.getItem('g3d_customizer_cuerpos');
    return saved ? JSON.parse(saved) : DEFAULT_CUERPOS;
  });

  const [mangos, setMangos] = useState<MangoTemplate[]>(() => {
    const saved = localStorage.getItem('g3d_customizer_mangos');
    return saved ? JSON.parse(saved) : DEFAULT_MANGOS;
  });

  const [bases, setBases] = useState<BaseTemplate[]>(() => {
    const saved = localStorage.getItem('g3d_customizer_bases');
    return saved ? JSON.parse(saved) : DEFAULT_BASES;
  });

  // Save states to local storage when changed
  useEffect(() => {
    localStorage.setItem('g3d_customizer_filaments', JSON.stringify(filamentColors));
  }, [filamentColors]);
  useEffect(() => {
    localStorage.setItem('g3d_customizer_topes', JSON.stringify(topes));
  }, [topes]);
  useEffect(() => {
    localStorage.setItem('g3d_customizer_cuerpos', JSON.stringify(cuerpos));
  }, [cuerpos]);
  useEffect(() => {
    localStorage.setItem('g3d_customizer_mangos', JSON.stringify(mangos));
  }, [mangos]);
  useEffect(() => {
    localStorage.setItem('g3d_customizer_bases', JSON.stringify(bases));
  }, [bases]);

  // ==========================================
  // CUSTOMIZER ACTIVE DESIGN SELECTIONS
  // ==========================================
  const [selectedTope, setSelectedTope] = useState<string>(() => topes[0]?.id || 't1');
  const [selectedCuerpo, setSelectedCuerpo] = useState<string>(() => cuerpos[0]?.id || 'c1');
  const [selectedMango, setSelectedMango] = useState<string>(() => mangos[0]?.id || 'm1');
  const [selectedBase, setSelectedBase] = useState<string>(() => bases[0]?.id || 'b1');

  // Dynamic colors chosen for each slot
  const [colorTope, setColorTope] = useState('#ffffff');
  const [colorCuerpo, setColorCuerpo] = useState('#eab308');
  const [colorMango, setColorMango] = useState('#eab308');
  
  // Custom list of band colors to support 2, 3, 4, 5 etc. bases dynamically!
  const [colorBands, setColorBands] = useState<string[]>(['#ffffff', '#dc2626', '#1e3a8a', '#ffffff']);

  // Active section for paint target
  const [activeColorTarget, setActiveColorTarget] = useState<{ type: 'tope' | 'cuerpo' | 'mango' | 'band'; index?: number }>({ type: 'cuerpo' });

  // Mode: 'client' (design) or 'admin' (setup/templates manager)
  const [appMode, setAppMode] = useState<'client' | 'admin'>('client');
  const [show3DMode, setShow3DMode] = useState<boolean>(false);

  // ==========================================
  // LOGO STATE & UPLOADER
  // ==========================================
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [originalLogo, setOriginalLogo] = useState<string | null>(null);
  const [removeBgMode, setRemoveBgMode] = useState<'none' | 'white' | 'black'>('white');
  const [bgThreshold, setBgThreshold] = useState<number>(40);

  // Logo Transformations
  const [logoScale, setLogoScale] = useState<number>(1.0);
  const [logoRotate, setLogoRotate] = useState<number>(0);
  const [logoX, setLogoX] = useState<number>(0);
  const [logoY, setLogoY] = useState<number>(0);

  // Text Engraving States
  const [embossedText, setEmbossedText] = useState<string>('G3D PRO');
  const [textDepthMode, setTextDepthMode] = useState<'embossed' | 'carved' | 'flat'>('embossed');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textSize, setTextSize] = useState<number>(42);
  const [textRotation, setTextRotation] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // ADMIN CONFIGURE / EDIT STATES
  // ==========================================
  const [adminTab, setAdminTab] = useState<'filaments' | 'topes' | 'cuerpos' | 'mangos' | 'bases'>('filaments');
  
  // Form hooks for adding/editing templates
  const [newFilament, setNewFilament] = useState({ brand: '', name: '', hex: '#6366f1' });
  const [newTope, setNewTope] = useState({ name: '', ry: 18, yOffset: 0, scale: 1.0, customPath: '' });
  const [newCuerpo, setNewCuerpo] = useState({ name: '', litraje: '', scaleX: 1.0, scaleY: 1.0 });
  const [newMango, setNewMango] = useState({ name: '', path: '', scale: 1.0, xOffset: 0, yOffset: 0 });
  const [newBase, setNewBase] = useState({ name: '', bandsCount: 3, bandPaths: [] as string[] });

  // Reset defaults helper
  const handleResetToDefaults = () => {
    if (window.confirm("¿Estás seguro de que quieres restablecer todos los filamentos, siluetas de mango, topes y bases a los valores de fábrica? Perderás cualquier cambio personalizado.")) {
      setFilamentColors(DEFAULT_FILAMENTS);
      setTopes(DEFAULT_TOPES);
      setCuerpos(DEFAULT_CUERPOS);
      setMangos(DEFAULT_MANGOS);
      setBases(DEFAULT_BASES);
      toast.success("Valores de fábrica restablecidos correctamente.");
    }
  };

  // ==========================================
  // GEOMETRY MATH CALCULATIONS (PROCEDURAL STYLING)
  // ==========================================
  const activeCuerpoObj = cuerpos.find(c => c.id === selectedCuerpo) || cuerpos[0] || DEFAULT_CUERPOS[0];
  const activeTopeObj = topes.find(t => t.id === selectedTope) || topes[0] || DEFAULT_TOPES[0];
  const activeMangoObj = mangos.find(m => m.id === selectedMango) || mangos[0] || DEFAULT_MANGOS[0];
  const activeBaseObj = bases.find(b => b.id === selectedBase) || bases[0] || DEFAULT_BASES[0];

  // Procedural sizing based on Litrage multiplier
  const cx = 190; // Center X
  const baseWidth = 160 * activeCuerpoObj.scaleX;
  const baseHeight = 240 * activeCuerpoObj.scaleY;
  const bodyLeftX = cx - baseWidth / 2;
  const bodyRightX = cx + baseWidth / 2;
  
  // Anchored at y = 330 so the bases stack nicely in the same bottom region
  const bodyBottomY = 330;
  const bodyTopY = bodyBottomY - baseHeight;

  // Active color fetch
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

  // ==========================================
  // LOADING URL INTEGRATIONS (SHAREABLE DEEP LINKS)
  // ==========================================
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ut = params.get('t'); // top hex
      const uc = params.get('c'); // body hex
      const um = params.get('m'); // handle hex
      const ub = params.get('b'); // base bands separated by comma
      const st = params.get('st'); // tope style ID
      const sc = params.get('sc'); // cuerpo style ID
      const sm = params.get('sm'); // mango style ID
      const sb = params.get('sb'); // base style ID

      if (ut) setColorTope(`#${ut}`);
      if (uc) setColorCuerpo(`#${uc}`);
      if (um) setColorMango(`#${um}`);
      if (ub) {
        const hexes = ub.split(',').map(h => `#${h}`);
        setColorBands(hexes);
      }
      if (st && topes.some(x => x.id === st)) setSelectedTope(st);
      if (sc && cuerpos.some(x => x.id === sc)) setSelectedCuerpo(sc);
      if (sm && mangos.some(x => x.id === sm)) setSelectedMango(sm);
      if (sb && bases.some(x => x.id === sb)) setSelectedBase(sb);

      const logoParam = params.get('logo');
      if (logoParam) {
        const storedLogo = localStorage.getItem('g3d_customizer_logo');
        if (storedLogo) {
          setLogoImage(storedLogo);
          setOriginalLogo(storedLogo);
        }
      }
    } catch (e) {
      console.error("Error reading shared url spec:", e);
    }
  }, [topes, cuerpos, mangos, bases]);

  // Client-side background removal algorithm
  const processImageBackground = (base64Src: string, mode: 'none' | 'white' | 'black', threshold: number) => {
    if (mode === 'none') {
      setLogoImage(base64Src);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        let remove = false;
        if (mode === 'white') {
          if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
            remove = true;
          }
        } else if (mode === 'black') {
          if (r < threshold && g < threshold && b < threshold) {
            remove = true;
          }
        }

        if (remove) {
          data[i+3] = 0; // Set Alpha to 0
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const transparentBase64 = canvas.toDataURL('image/png');
      setLogoImage(transparentBase64);
    };
    img.src = base64Src;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOriginalLogo(base64);
      processImageBackground(base64, removeBgMode, bgThreshold);
      toast.success("Logotipo cargado y procesado localmente.");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (originalLogo) {
      processImageBackground(originalLogo, removeBgMode, bgThreshold);
    }
  }, [removeBgMode, bgThreshold, originalLogo]);

  // ==========================================
  // SHARE SPECS GENERATOR
  // ==========================================
  const getShareLink = () => {
    const t = colorTope.replace('#', '');
    const c = colorCuerpo.replace('#', '');
    const m = colorMango.replace('#', '');
    const b = colorBands.map(h => h.replace('#', '')).join(',');

    const query = `st=${selectedTope}&sc=${selectedCuerpo}&sm=${selectedMango}&sb=${selectedBase}&t=${t}&c=${c}&m=${m}&b=${b}${logoImage ? '&logo=1' : ''}`;
    return `${window.location.origin}${window.location.pathname}?${query}`;
  };

  const handleCopyLink = () => {
    if (logoImage) {
      try {
        localStorage.setItem('g3d_customizer_logo', logoImage);
      } catch (e) {
        console.warn("No se pudo persistir el logo en localStorage por límites de cuota.");
      }
    }
    navigator.clipboard.writeText(getShareLink());
    toast.success("¡Vínculo de simulación copiado!", {
      description: "El link contiene la configuración exacta de siluetas, litraje y colores de marca."
    });
  };

  const handleWhatsAppShare = () => {
    const text = `*¡Hola G3D! He diseñado un Jarro Chop personalizado en el Simulador:*
--------------------------------------
* Capacidad: ${activeCuerpoObj.name} (${activeCuerpoObj.litraje})
* Silueta del Tope: ${activeTopeObj.name}
* Silueta de la Manija: ${activeMangoObj.name}
* Modelo de Base: ${activeBaseObj.name} (${activeBaseObj.bandsCount} bandas)
--------------------------------------
* CORES DE FILAMENTOS SELECCIONADOS *
- Labio / Tope: ${colorTope}
- Cuerpo principal: ${colorCuerpo}
- Manija / Mango: ${colorMango}
- Bandas de Base: ${colorBands.slice(0, activeBaseObj.bandsCount).join(' / ')}
--------------------------------------
👉 Ver, editar o fabricar diseño en vivo aquí:
${getShareLink()}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    toast.success("Redirigiendo a WhatsApp con las especificaciones de fabricación.");
  };

  // ==========================================
  // HIGH-RESOLUTION CANVAS EXPORTER
  // ==========================================
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill high resolution workspace
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative brand pattern
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '900 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G3D CREATIVE', canvas.width / 2, canvas.height / 2);

    // Manual rendering on Canvas matching the exact SVG layout
    const renderMugToCanvas = () => {
      const scaleFactor = 2.5; // High-res scale factor
      const scX = activeCuerpoObj.scaleX;
      const scY = activeCuerpoObj.scaleY;
      
      const canvasCx = canvas.width / 2 - 50;
      const canvasWidth = 160 * scX * scaleFactor;
      const canvasHeight = 240 * scY * scaleFactor;
      const canvasBottomY = 330 * scaleFactor + 100;
      const canvasTopY = canvasBottomY - canvasHeight;

      // 1. Render Handle in background
      ctx.save();
      ctx.fillStyle = colorMango;
      ctx.translate(canvasCx + canvasWidth / 2 + activeMangoObj.xOffset * scaleFactor, canvasTopY + activeMangoObj.yOffset * scaleFactor);
      ctx.scale(activeMangoObj.scale * scaleFactor, activeMangoObj.scale * scaleFactor);
      
      const p = new Path2D(activeMangoObj.path);
      ctx.fill(p);
      ctx.restore();

      // Shadow on handle
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.translate(canvasCx + canvasWidth / 2 + activeMangoObj.xOffset * scaleFactor, canvasTopY + activeMangoObj.yOffset * scaleFactor);
      ctx.scale(activeMangoObj.scale * scaleFactor, activeMangoObj.scale * scaleFactor);
      ctx.fill(p);
      ctx.restore();

      // 2. Render Cylinder Body
      ctx.fillStyle = colorCuerpo;
      ctx.fillRect(canvasCx - canvasWidth / 2, canvasTopY, canvasWidth, canvasHeight);

      // 3. Shading & specularity gradients on cylinder
      const bodyGrad = ctx.createLinearGradient(canvasCx - canvasWidth / 2, 0, canvasCx + canvasWidth / 2, 0);
      bodyGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
      bodyGrad.addColorStop(0.12, 'rgba(0, 0, 0, 0.05)');
      bodyGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
      bodyGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      bodyGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.05)');
      bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(canvasCx - canvasWidth / 2, canvasTopY, canvasWidth, canvasHeight);

      // Specular glare shine
      const glareGrad = ctx.createLinearGradient(canvasCx - canvasWidth / 2, 0, canvasCx + canvasWidth / 2, 0);
      glareGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0)');
      glareGrad.addColorStop(0.27, 'rgba(255, 255, 255, 0.45)');
      glareGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glareGrad;
      ctx.fillRect(canvasCx - canvasWidth / 2, canvasTopY, canvasWidth, canvasHeight);

      // 4. Draw Logo inside Cylinder Mask
      if (logoImage) {
        const logoImgObj = new Image();
        logoImgObj.onload = () => {
          ctx.save();
          // Clip logo inside the body boundaries
          ctx.beginPath();
          ctx.rect(canvasCx - canvasWidth / 2 + 10, canvasTopY + 10, canvasWidth - 20, canvasHeight - 20);
          ctx.clip();

          const lW = 140 * logoScale * scaleFactor;
          const lH = 140 * logoScale * scaleFactor;
          const lx = canvasCx + logoX * scaleFactor;
          const ly = canvasTopY + canvasHeight / 2 + logoY * scaleFactor;

          ctx.translate(lx, ly);
          ctx.rotate((logoRotate * Math.PI) / 180);
          ctx.drawImage(logoImgObj, -lW / 2, -lH / 2, lW, lH);
          ctx.restore();

          // Render front parts (tope, base)
          drawFrontParts();
        };
        logoImgObj.src = logoImage;
      } else {
        drawFrontParts();
      }

      function drawFrontParts() {
        // 5. Draw Top Lip (Tope)
        ctx.save();
        ctx.fillStyle = colorTope;
        ctx.translate(canvasCx, canvasTopY + activeTopeObj.yOffset * scaleFactor);
        ctx.scale(activeTopeObj.scale, activeTopeObj.scale);
        
        ctx.beginPath();
        if (activeTopeObj.customPath) {
          ctx.translate(-190 * scaleFactor, 0);
          ctx.scale(scaleFactor, scaleFactor);
          const customP = new Path2D(activeTopeObj.customPath);
          ctx.fill(customP);
        } else {
          ctx.ellipse(0, 0, (canvasWidth / 2 + 8), activeTopeObj.ry * scaleFactor * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Inner shadow ellipse
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.beginPath();
          ctx.ellipse(0, 0, (canvasWidth / 2 - 4), activeTopeObj.ry * scaleFactor * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 6. Draw Bases (Base)
        ctx.save();
        ctx.translate(canvasCx - canvasWidth / 2, canvasBottomY);
        // Map band paths
        activeBaseObj.bandPaths.forEach((pathStr, index) => {
          ctx.save();
          ctx.fillStyle = colorBands[index] || '#ffffff';
          ctx.scale(scaleFactor * scX, scaleFactor);
          // Scale base heights proportional to scaling
          const bandP = new Path2D(pathStr);
          ctx.fill(bandP);

          // Shadow overlay on bands
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fill(bandP);
          ctx.restore();
        });
        ctx.restore();

        // Draw Specs Information Plate
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(15,23,42,0.08)';
        ctx.shadowBlur = 30;
        ctx.fillRect(50, canvas.height - 220, 600, 170);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, canvas.height - 220, 600, 170);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('FICHA DE MODELADO OFICIAL G3D', 80, canvas.height - 180);

        ctx.fillStyle = '#475569';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Capacidad / Litraje: ${activeCuerpoObj.name} (${activeCuerpoObj.litraje})`, 80, canvas.height - 150);
        ctx.fillText(`Componentes: Tope: ${activeTopeObj.name}  |  Mango: ${activeMangoObj.name}`, 80, canvas.height - 125);
        ctx.fillText(`Base: ${activeBaseObj.name} (${activeBaseObj.bandsCount} bandas de color)`, 80, canvas.height - 100);
        ctx.fillText(`Colores filamento: ${colorCuerpo} (cuerpo), ${colorMango} (mango), ${colorTope} (tope)`, 80, canvas.height - 75);

        // Save image file
        const url = canvas.toDataURL('image/jpeg', 0.9);
        const a = document.createElement('a');
        a.download = `G3D-Custom-Chop-${activeCuerpoObj.litraje.replace(' ', '')}.jpg`;
        a.href = url;
        a.click();
        toast.success("Imagen de producción generada e instalada en tu dispositivo.");
      }
    };

    renderMugToCanvas();
  };

  // ==========================================
  // FILAMENT ADD / REMOVE LOGIC
  // ==========================================
  const handleAddFilament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilament.brand || !newFilament.name) {
      toast.error("Por favor ingresa marca y nombre de color del filamento.");
      return;
    }
    const fil: FilamentColor = {
      id: `f-${Date.now()}`,
      brand: newFilament.brand,
      name: newFilament.name,
      hex: newFilament.hex,
      active: true
    };
    setFilamentColors(prev => [...prev, fil]);
    setNewFilament({ brand: '', name: '', hex: '#6366f1' });
    toast.success("Nuevo filamento de marca agregado con éxito.");
  };

  const handleDeleteFilament = (id: string) => {
    setFilamentColors(prev => prev.filter(f => f.id !== id));
    toast.info("Filamento removido de la paleta.");
  };

  // ==========================================
  // PROJECT GALLERY ACTIONS
  // ==========================================
  const handleSaveProject = () => {
    if (!projectName.trim()) {
      toast.error("Por favor ingresa un nombre para el diseño.");
      return;
    }
    const newProject: SavedProject = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      date: new Date().toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      selectedTope,
      selectedCuerpo,
      selectedMango,
      selectedBase,
      colorTope,
      colorCuerpo,
      colorMango,
      colorBands,
      logoImage,
      embossedText,
      textDepthMode,
      textColor,
      textSize,
      textRotation,
    };
    
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('g3d_chop_chop_projects', JSON.stringify(updated));
    setProjectName('');
    toast.success(`Diseño "${newProject.name}" guardado exitosamente.`);
  };

  const handleSaveDbPlantilla = async (name: string) => {
    if (!name.trim()) {
      toast.error("Por favor, ingresa un nombre para la plantilla.");
      return;
    }

    const plantillaData = {
      name: name.trim(),
      selectedTope,
      selectedCuerpo,
      selectedMango,
      selectedBase,
      colorTope,
      colorCuerpo,
      colorMango,
      colorBands,
      logoImage,
      embossedText,
      textDepthMode,
      textColor,
      textSize,
      textRotation
    };

    const toastId = toast.loading("Guardando plantilla oficial en Supabase...");
    const res = await apiService.saveChopPlantilla(plantillaData);
    if (res.success) {
      toast.success(`Plantilla "${name}" guardada en la base de datos con éxito!`, { id: toastId });
      setProjectName('');
      fetchDbPlantillas(); // Refresh from Supabase
    } else {
      toast.error(`Error al guardar en Supabase: ${res.error}`, { id: toastId });
    }
  };

  const handleDeleteDbPlantilla = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta plantilla oficial de la base de datos? Esto afectará a todos los usuarios.")) {
      return;
    }

    const toastId = toast.loading("Eliminando plantilla oficial...");
    const res = await apiService.deleteChopPlantilla(id);
    if (res.success) {
      toast.success("Plantilla eliminada de la base de datos.", { id: toastId });
      fetchDbPlantillas(); // Refresh from Supabase
    } else {
      toast.error(`Error al eliminar: ${res.error}`, { id: toastId });
    }
  };

  const handleLoadDbPlantilla = (dbProj: any) => {
    const proj: SavedProject = {
      id: dbProj.id,
      name: dbProj.nombre,
      date: new Date(dbProj.created_at).toLocaleDateString(),
      selectedTope: dbProj.selected_tope,
      selectedCuerpo: dbProj.selected_cuerpo,
      selectedMango: dbProj.selected_mango,
      selectedBase: dbProj.selected_base,
      colorTope: dbProj.color_tope,
      colorCuerpo: dbProj.color_cuerpo,
      colorMango: dbProj.color_mango,
      colorBands: dbProj.color_bands || [],
      logoImage: dbProj.logo_image || null,
      embossedText: dbProj.embossed_text || '',
      textDepthMode: dbProj.text_depth_mode || 'embossed',
      textColor: dbProj.text_color || '#ffffff',
      textSize: dbProj.text_size || 42,
      textRotation: dbProj.text_rotation || 0
    };
    handleLoadProject(proj);
  };

  const handleLoadProject = (proj: SavedProject) => {
    setSelectedTope(proj.selectedTope);
    setSelectedCuerpo(proj.selectedCuerpo);
    setSelectedMango(proj.selectedMango);
    setSelectedBase(proj.selectedBase);
    setColorTope(proj.colorTope);
    setColorCuerpo(proj.colorCuerpo);
    setColorMango(proj.colorMango);
    setColorBands(proj.colorBands || []);
    setLogoImage(proj.logoImage || null);
    setEmbossedText(proj.embossedText || '');
    setTextDepthMode(proj.textDepthMode || 'embossed');
    setTextColor(proj.textColor || '#ffffff');
    setTextSize(proj.textSize || 42);
    setTextRotation(proj.textRotation || 0);
    toast.success(`Diseño "${proj.name}" cargado correctamente.`);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Seguro que deseas eliminar este diseño de tu galería?")) {
      const updated = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem('g3d_chop_chop_projects', JSON.stringify(updated));
      toast.info("Diseño eliminado de la galería.");
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(savedProjects, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'g3d_chop_galeria_respaldo.g3d');
      linkElement.click();
      toast.success("Copia de seguridad exportada con éxito como archivo .g3d");
    } catch (e) {
      toast.error("Error al exportar copia de seguridad.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated = parsed.filter(p => p.id && p.name && p.selectedCuerpo);
          if (validated.length === 0) {
            toast.error("El archivo no contiene un formato de galería G3D válido.");
            return;
          }
          const merged = [...validated, ...savedProjects];
          const unique = merged.reduce((acc, curr) => {
            if (!acc.some(x => x.id === curr.id)) acc.push(curr);
            return acc;
          }, [] as SavedProject[]);

          setSavedProjects(unique);
          localStorage.setItem('g3d_chop_chop_projects', JSON.stringify(unique));
          toast.success(`¡Se importaron ${validated.length} diseños exitosamente a tu galería!`);
        } else {
          toast.error("El formato del archivo de respaldo es incorrecto.");
        }
      } catch (err) {
        toast.error("Error al leer el archivo de respaldo. Asegúrate de que sea un archivo .g3d válido.");
      }
    };
    reader.readAsText(file);
  };

  // Group filaments by brand for an outstanding clean picker UI
  const filamentsByBrand = filamentColors.reduce((acc, f) => {
    if (!f.active) return acc;
    if (!acc[f.brand]) acc[f.brand] = [];
    acc[f.brand].push(f);
    return acc;
  }, {} as Record<string, FilamentColor[]>);

  if (appMode === 'client') {
    return (
      <ChopClientView
        cuerpos={cuerpos}
        topes={topes}
        mangos={mangos}
        bases={bases}
        filamentColors={filamentColors}
        selectedCuerpo={selectedCuerpo}
        setSelectedCuerpo={setSelectedCuerpo}
        selectedTope={selectedTope}
        setSelectedTope={setSelectedTope}
        selectedMango={selectedMango}
        setSelectedMango={setSelectedMango}
        selectedBase={selectedBase}
        setSelectedBase={setSelectedBase}
        colorTope={colorTope}
        setColorTope={setColorTope}
        colorCuerpo={colorCuerpo}
        setColorCuerpo={setColorCuerpo}
        colorMango={colorMango}
        setColorMango={setColorMango}
        colorBands={colorBands}
        setColorBands={setColorBands}
        activeColorTarget={activeColorTarget}
        setActiveColorTarget={setActiveColorTarget}
        logoImage={logoImage}
        setLogoImage={setLogoImage}
        originalLogo={originalLogo}
        setOriginalLogo={setOriginalLogo}
        removeBgMode={removeBgMode}
        setRemoveBgMode={setRemoveBgMode}
        bgThreshold={bgThreshold}
        setBgThreshold={setBgThreshold}
        logoScale={logoScale}
        setLogoScale={setLogoScale}
        logoRotate={logoRotate}
        setLogoRotate={setLogoRotate}
        logoX={logoX}
        setLogoX={setLogoX}
        logoY={logoY}
        setLogoY={setLogoY}
        embossedText={embossedText}
        setEmbossedText={setEmbossedText}
        textDepthMode={textDepthMode}
        setTextDepthMode={setTextDepthMode}
        textColor={textColor}
        setTextColor={setTextColor}
        textSize={textSize}
        setTextSize={setTextSize}
        textRotation={textRotation}
        setTextRotation={setTextRotation}
        savedProjects={savedProjects}
        projectName={projectName}
        setProjectName={setProjectName}
        handleSaveProject={handleSaveProject}
        handleLoadProject={handleLoadProject}
        handleDeleteProject={handleDeleteProject}
        handleExportBackup={handleExportBackup}
        handleImportBackup={handleImportBackup}
        handleCopyLink={handleCopyLink}
        handleWhatsAppShare={handleWhatsAppShare}
        handleDownloadImage={handleDownloadImage}
        setAppMode={setAppMode}
        fileInputRef={fileInputRef}
        dbPlantillas={dbPlantillas}
        loadingPlantillas={loadingPlantillas}
        handleSaveDbPlantilla={handleSaveDbPlantilla}
        handleDeleteDbPlantilla={handleDeleteDbPlantilla}
        handleLoadDbPlantilla={handleLoadDbPlantilla}
      />
    );
  }

  return (
    <ChopAdminView
      cuerpos={cuerpos}
      topes={topes}
      mangos={mangos}
      bases={bases}
      filamentColors={filamentColors}
      setFilamentColors={setFilamentColors}
      selectedCuerpo={selectedCuerpo}
      setSelectedCuerpo={setSelectedCuerpo}
      selectedTope={selectedTope}
      setSelectedTope={setSelectedTope}
      selectedMango={selectedMango}
      setSelectedMango={setSelectedMango}
      selectedBase={selectedBase}
      setSelectedBase={setSelectedBase}
      colorTope={colorTope}
      setColorTope={setColorTope}
      colorCuerpo={colorCuerpo}
      setColorCuerpo={setColorCuerpo}
      colorMango={colorMango}
      setColorMango={setColorMango}
      colorBands={colorBands}
      setColorBands={setColorBands}
      activeColorTarget={activeColorTarget}
      setActiveColorTarget={setActiveColorTarget}
      savedProjects={savedProjects}
      projectName={projectName}
      setProjectName={setProjectName}
      handleSaveProject={handleSaveProject}
      handleLoadProject={handleLoadProject}
      handleDeleteProject={handleDeleteProject}
      handleExportBackup={handleExportBackup}
      handleImportBackup={handleImportBackup}
      dbPlantillas={dbPlantillas}
      loadingPlantillas={loadingPlantillas}
      handleSaveDbPlantilla={handleSaveDbPlantilla}
      handleDeleteDbPlantilla={handleDeleteDbPlantilla}
      handleLoadDbPlantilla={handleLoadDbPlantilla}
      setAppMode={setAppMode}
      handleResetToDefaults={handleResetToDefaults}
    />
  );
}
