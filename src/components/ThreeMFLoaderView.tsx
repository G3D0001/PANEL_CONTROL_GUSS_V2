import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as fflate from 'fflate';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Trash2, 
  Eye, 
  EyeOff, 
  Grid, 
  Layers, 
  Image as ImageIcon, 
  Plus, 
  Sliders, 
  RotateCcw, 
  Flame, 
  SlidersHorizontal,
  FolderOpen,
  Scissors,
  Check,
  Type,
  ChevronRight,
  HelpCircle,
  Copy,
  Move,
  RotateCw,
  Maximize2,
  MousePointer,
  RefreshCw,
  Video,
  Cloud,
  LogOut,
  Search,
  FileCode,
  Download,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  subscribeAuth, 
  googleSignIn, 
  googleSignOut, 
  listDriveFiles, 
  uploadFileToDrive, 
  DriveFile 
} from '../lib/driveService';

// Define fflate globally so ThreeMFLoader can find it
if (typeof window !== 'undefined') {
  (window as any).fflate = fflate;
}

// Interfaces
export interface FilamentColor {
  id: string;
  brand: string;
  name: string;
  hex: string;
  active: boolean;
}

export interface PartGroup {
  id: string;
  name: string;
  meshNames: string[]; // List of mesh names assigned to this group
  color: string; // Current color hex code
  isExclusive: boolean; // Only one mesh in meshNames visible at a time
  activeMeshName?: string; // If exclusive, which mesh is currently visible
  visible: boolean;
}

export interface CustomBackground {
  imageUrl: string;
  opacity: number;
  size: 'cover' | 'contain' | 'auto';
  blur: number;
}

export interface SavedCameraView {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

// Default Filaments (matching ChopCustomizer)
const CORES_DEFAULT: FilamentColor[] = [
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

export interface ThreeMFLoaderViewProps {
  filaments?: FilamentColor[];
  compactMode?: boolean;
  colorTope?: string;
  colorCuerpo?: string;
  colorMango?: string;
  colorBands?: string[];
  activeTope?: string;
  activeCuerpo?: string;
  activeMango?: string;
  activeBase?: string;
  logoImage?: string | null;
  logoScale?: number;
  logoRotate?: number;
  logoX?: number;
  logoY?: number;
  textEngrave?: string;
  textDepthMode?: 'embossed' | 'carved' | 'flat';
  textColor?: string;
  textSize?: number;
  textRotation?: number;
  onPartSelected?: (partType: 'tope' | 'cuerpo' | 'mango' | 'band', index?: number) => void;
  activeColorTarget?: { type: 'tope' | 'cuerpo' | 'mango' | 'band'; index?: number };
  onOpenAdmin?: () => void;
  groups?: PartGroup[];
  setGroups?: (groups: PartGroup[]) => void;
  discoveredMeshes?: string[];
  onMeshesDiscovered?: (meshes: string[]) => void;
  bgConfig?: CustomBackground;
  setBgConfig?: (bg: CustomBackground) => void;
  uploadedFile?: File | null;
  hoveredMeshName?: string | null;
}

export const ThreeMFLoaderView: React.FC<ThreeMFLoaderViewProps> = ({ 
  filaments = CORES_DEFAULT,
  compactMode = false,
  colorTope = '#ffffff',
  colorCuerpo = '#eab308',
  colorMango = '#eab308',
  colorBands = ['#ffffff', '#dc2626', '#1e3a8a', '#ffffff'],
  activeTope = 't1',
  activeCuerpo = 'c1',
  activeMango = 'm1',
  activeBase = 'b1',
  logoImage = null,
  logoScale = 1.0,
  logoRotate = 0,
  logoX = 0,
  logoY = 0,
  textEngrave = 'G3D PRO',
  textDepthMode: textDepthModeProp = 'embossed',
  textColor: textColorProp = '#ffffff',
  textSize: textSizeProp = 42,
  textRotation: textRotationProp = 0,
  onPartSelected,
  activeColorTarget,
  onOpenAdmin,
  groups: groupsProp,
  setGroups: onGroupsChange,
  discoveredMeshes: discoveredMeshesProp,
  onMeshesDiscovered,
  bgConfig: bgConfigProp,
  setBgConfig: onBgConfigChange,
  uploadedFile,
  hoveredMeshName = null,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  // Three.js instances refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const textTextureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const logoTextureRef = useRef<THREE.Texture | null>(null);
  const logoMeshRef = useRef<THREE.Mesh | null>(null);

  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [localHoveredMeshName, setLocalHoveredMeshName] = useState<string | null>(null);
  const activeHoveredMeshName = hoveredMeshName !== null ? hoveredMeshName : localHoveredMeshName;
  
  // Interactive 3D Editor Tools: 'orbit' (Orbit view), 'select' (Select and Paint parts), 'translate' (Move), 'rotate' (Rotate), 'scale' (Scale)
  const [activeTool, setActiveTool] = useState<'orbit' | 'select' | 'translate' | 'rotate' | 'scale'>('orbit');
  
  // Whether we are transforming a single piece ('part') or the entire model ('model')
  const [transformTarget, setTransformTarget] = useState<'part' | 'model'>('part');
  
  // Current 2D flat perspective view or free 3D rotation view
  const [viewPerspective, setViewPerspective] = useState<'2d' | '3d'>('3d');

  // Selected mesh name for transformations
  const [selectedMeshName, setSelectedMeshName] = useState<string | null>(null);
  
  // All scanned meshes inside the 3D scene (lifted fallback)
  const [internalDiscoveredMeshes, setInternalDiscoveredMeshes] = useState<string[]>([]);
  const discoveredMeshes = discoveredMeshesProp !== undefined ? discoveredMeshesProp : internalDiscoveredMeshes;
  const setDiscoveredMeshes = (meshes: string[]) => {
    setInternalDiscoveredMeshes(meshes);
    onMeshesDiscovered?.(meshes);
  };
  
  // Part grouping configurations (lifted fallback)
  const [internalGroups, setInternalGroups] = useState<PartGroup[]>(() => {
    const saved = localStorage.getItem('g3d_3mf_part_groups');
    if (saved) return JSON.parse(saved);
    
    // Default Groups
    return [
      { id: 'g1', name: 'Cuerpo Principal 🍺', meshNames: ['CuerpoCup', 'BaseCup'], color: colorCuerpo, isExclusive: false, visible: true },
      { id: 'g2', name: 'Borde / Labio Superior 👄', meshNames: ['LabioCup'], color: colorTope, isExclusive: false, visible: true },
      { id: 'g3', name: 'Mangos / Asas Intercambiables 🤝', meshNames: ['MangoGeometrico', 'MangoRedondeado', 'MangoDeportivo'], color: colorMango, isExclusive: true, activeMeshName: 'MangoGeometrico', visible: true },
      { id: 'g4', name: 'Bandas Decorativas de Base ⚡', meshNames: ['BandaBase1', 'BandaBase2', 'BandaBase3', 'BandaBase4'], color: '#ffffff', isExclusive: false, visible: true },
    ];
  });
  const groups = groupsProp !== undefined ? groupsProp : internalGroups;
  const setGroups = (g: PartGroup[]) => {
    setInternalGroups(g);
    onGroupsChange?.(g);
  };

  // Selected group for color assignment (used in stand-alone)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('g1');

  // Background state (lifted fallback)
  const [internalBgConfig, setInternalBgConfig] = useState<CustomBackground>(() => {
    const saved = localStorage.getItem('g3d_3mf_background');
    if (saved) return JSON.parse(saved);
    return {
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1600', // Neon bar background
      opacity: compactMode ? 0.05 : 0.45,
      size: 'cover',
      blur: compactMode ? 10 : 4
    };
  });
  const bgConfig = bgConfigProp !== undefined ? bgConfigProp : internalBgConfig;
  const setBgConfig = (bg: CustomBackground) => {
    setInternalBgConfig(bg);
    onBgConfigChange?.(bg);
  };

  // Saved camera calibration
  const [cameraView, setCameraView] = useState<SavedCameraView | null>(() => {
    const saved = localStorage.getItem('g3d_3mf_camera_view');
    return saved ? JSON.parse(saved) : null;
  });

  // Automatically load uploadedFile if passed via prop
  useEffect(() => {
    if (uploadedFile) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          load3MFBuffer(arrayBuffer, uploadedFile.name);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, [uploadedFile]);

  // EMBOSS / ENGRAVE TEXT DRIVING
  const [embossedText, setEmbossedText] = useState<string>(textEngrave);
  const [textDepthMode, setTextDepthMode] = useState<'embossed' | 'carved' | 'flat'>(textDepthModeProp);
  const [textColor, setTextColor] = useState<string>(textColorProp);
  const [textSize, setTextSize] = useState<number>(textSizeProp);
  const [textRotation, setTextRotation] = useState<number>(textRotationProp);
  const [textYPos, setTextYPos] = useState<number>(0);

  // Google Drive Integration States
  const [driveUser, setDriveUser] = useState<any>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [driveLoading, setDriveLoading] = useState<boolean>(false);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [drivePastedLink, setDrivePastedLink] = useState<string>('');

  const loadDriveFiles = async (token: string) => {
    setDriveLoading(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al listar archivos de Google Drive: ${err.message || String(err)}`);
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeAuth((user, token) => {
      setDriveUser(user);
      setDriveToken(token);
      if (token) {
        loadDriveFiles(token);
      } else {
        setDriveFiles([]);
      }
    });
    return unsubscribe;
  }, []);

  // Sync props to state in compact mode
  useEffect(() => {
    if (compactMode) {
      setEmbossedText(textEngrave);
      setTextDepthMode(textDepthModeProp);
      setTextColor(textColorProp);
      setTextSize(textSizeProp);
      setTextRotation(textRotationProp);
    }
  }, [textEngrave, textDepthModeProp, textColorProp, textSizeProp, textRotationProp, compactMode]);

  // Save configurations helper (only in stand-alone mode)
  useEffect(() => {
    if (!compactMode) {
      localStorage.setItem('g3d_3mf_part_groups', JSON.stringify(groups));
    }
  }, [groups, compactMode]);

  useEffect(() => {
    localStorage.setItem('g3d_3mf_background', JSON.stringify(bgConfig));
  }, [bgConfig]);

  // ==========================================
  // TEXTURE CANVAS FOR EMBOSSED TEXT
  // ==========================================
  const drawTextCanvas = () => {
    const canvas = textTextureCanvasRef.current || document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 512);

    // Draw transparent background
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 512);

    // Style text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${textSize}px "JetBrains Mono", "Space Grotesk", sans-serif`;

    const x = 256;
    const y = 256;

    if (textDepthMode === 'embossed') {
      // 3D emboss shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText(embossedText, x + 2, y + 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillText(embossedText, x - 1, y - 1);
      ctx.fillStyle = textColor;
      ctx.fillText(embossedText, x, y);
    } else if (textDepthMode === 'carved') {
      // Carved / engraved caladura shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(embossedText, x + 1, y + 1);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(embossedText, x - 1.5, y - 1.5);
      ctx.fillStyle = '#111111'; // Inner caladura dark plastic look
      ctx.fillText(embossedText, x, y);
    } else {
      // Flat silk printing look
      ctx.fillStyle = textColor;
      ctx.fillText(embossedText, x, y);
    }

    textTextureCanvasRef.current = canvas;
    if (textTextureRef.current) {
      textTextureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    drawTextCanvas();
  }, [embossedText, textSize, textColor, textDepthMode]);

  // ==========================================
  // LOGO LOADING ENGINE
  // ==========================================
  useEffect(() => {
    if (!logoImage) {
      logoTextureRef.current = null;
      if (logoMeshRef.current) {
        logoMeshRef.current.visible = false;
      }
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      logoImage,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        logoTextureRef.current = texture;
        if (logoMeshRef.current) {
          const mat = logoMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.map = texture;
          mat.needsUpdate = true;
          logoMeshRef.current.visible = true;
        }
      },
      undefined,
      (err) => {
        console.error("Error loading logo texture", err);
      }
    );
  }, [logoImage]);

  // ==========================================
  // APPLY CUSTOM TRANSFORMS FROM LOCAL STORAGE
  // ==========================================
  const applySavedTransforms = (group: THREE.Group) => {
    const savedTransforms = localStorage.getItem('g3d_chop_mesh_transforms');
    if (!savedTransforms) return;

    try {
      const transforms = JSON.parse(savedTransforms);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && transforms[child.name]) {
          const t = transforms[child.name];
          if (t.position) child.position.set(t.position.x, t.position.y, t.position.z);
          if (t.rotation) child.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
          if (t.scale) child.scale.set(t.scale.x, t.scale.y, t.scale.z);
        }
      });
    } catch (e) {
      console.error("Error reading saved transforms", e);
    }
  };

  // ==========================================
  // THREE.JS SCENE CONTEXT SETUP & RUNTIME
  // ==========================================
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const containerWidth = mountRef.current.clientWidth;
    const containerHeight = mountRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(40, containerWidth / containerHeight, 0.1, 1000);
    
    // Position camera using saved view or default standard product presentation
    if (cameraView) {
      camera.position.set(cameraView.position.x, cameraView.position.y, cameraView.position.z);
    } else {
      camera.position.set(0, 4, 15);
    }
    cameraRef.current = camera;

    // 3. Renderer with transparent background (for custom background image)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear old mounts
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(8, 16, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.5); // Subtle violet fill light
    fillLight.position.set(-8, 6, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45); // Gorgeous backrim spotlight
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    // Subtle bottom bounce light
    const floorLight = new THREE.DirectionalLight(0xffffff, 0.25);
    floorLight.position.set(0, -10, 0);
    scene.add(floorLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't allow camera to go too far below
    controls.minDistance = 4;
    controls.maxDistance = 35;
    
    if (cameraView) {
      controls.target.set(cameraView.target.x, cameraView.target.y, cameraView.target.z);
    } else {
      controls.target.set(0, 0.8, 0);
    }
    controlsRef.current = controls;

    // 6. Grid floor (discreet 3D print bed grid)
    const gridHelper = new THREE.GridHelper(18, 18, 0x8338ec, 0x334155);
    gridHelper.position.y = -2.8;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 7. Base model group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 8. Transform Controls (Gizmos)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    transformControls.addEventListener('change', () => {
      renderer.render(scene, camera);
      
      // Real-time transform tracking & saving to LocalStorage
      const object = transformControls.object;
      if (object) {
        const saved = localStorage.getItem('g3d_chop_mesh_transforms');
        const transforms = saved ? JSON.parse(saved) : {};
        transforms[object.name] = {
          position: { x: object.position.x, y: object.position.y, z: object.position.z },
          rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
          scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z }
        };
        localStorage.setItem('g3d_chop_mesh_transforms', JSON.stringify(transforms));
      }
    });
    
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    // 9. Text Decal Texture Setup
    const canvas = document.createElement('canvas');
    textTextureCanvasRef.current = canvas;
    const textTexture = new THREE.CanvasTexture(canvas);
    textTextureRef.current = textTexture;
    drawTextCanvas();

    // 10. Generate Fallback or Reactive Cup meshes
    generateFallbackProceduralCup();

    // 11. Custom transforms restore
    applySavedTransforms(modelGroup);

    // Click raycaster event
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!renderer || !camera || !modelGroup) return;

      // Calculate mouse position relative to canvas bounds
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        // Grab top-most mesh parent inside modelGroup
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== modelGroup && hitObject.parent !== scene) {
          hitObject = hitObject.parent;
        }

        if (hitObject) {
          const name = hitObject.name;
          
          // Select mode -> select color target directly
          if (activeTool === 'select') {
            setSelectedMeshName(name);
            transformControls.detach();
            
            if (name.includes('Tope') || name.includes('Labio')) {
              onPartSelected?.('tope');
              setSelectedGroupId('g2');
            } else if (name.includes('Cuerpo')) {
              onPartSelected?.('cuerpo');
              setSelectedGroupId('g1');
            } else if (name.includes('Mango') || name.includes('Handle')) {
              onPartSelected?.('mango');
              setSelectedGroupId('g3');
            } else if (name.includes('BandaBase') || name.includes('Ring')) {
              const num = name.match(/\d+/);
              const idx = num ? parseInt(num[0]) - 1 : 0;
              onPartSelected?.('band', idx);
              setSelectedGroupId('g4');
            }
          } else {
            // Gizmo Mode (Translate/Rotate/Scale) -> attach transform controls!
            transformControls.attach(hitObject);
            setSelectedMeshName(name);
          }
        }
      } else {
        // Deselect if clicked empty space
        if (activeTool !== 'select' && !transformControls.dragging) {
          transformControls.detach();
          setSelectedMeshName(null);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handleCanvasClick);

    // Resize observer
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        handleResize();
      });
    });
    resizeObserver.observe(mountRef.current);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      
      // Update decal orientation
      if (textTextureRef.current) {
        textTextureRef.current.rotation = THREE.MathUtils.degToRad(textRotation);
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('pointerdown', handleCanvasClick);
        rendererRef.current.dispose();
      }
      transformControls.dispose();
    };
  }, [activeTool, activeCuerpo, activeMango, activeTope, activeBase, colorBands.length]);

  // Stable Refs to access state inside Three.js animation/events without rebuilding scene
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const transformTargetRef = useRef(transformTarget);
  useEffect(() => {
    transformTargetRef.current = transformTarget;
  }, [transformTarget]);

  const selectedMeshNameRef = useRef(selectedMeshName);
  useEffect(() => {
    selectedMeshNameRef.current = selectedMeshName;
  }, [selectedMeshName]);

  // ==========================================
  // THREE.JS SCENE CONTEXT SETUP & RUNTIME
  // ==========================================
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const containerWidth = mountRef.current.clientWidth;
    const containerHeight = mountRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(40, containerWidth / containerHeight, 0.1, 1000);
    
    // Position camera using saved view or default standard product presentation
    if (cameraView) {
      camera.position.set(cameraView.position.x, cameraView.position.y, cameraView.position.z);
    } else {
      camera.position.set(0, 4, 15);
    }
    cameraRef.current = camera;

    // 3. Renderer with transparent background (for custom background image)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear old mounts
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(8, 16, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.5); // Subtle violet fill light
    fillLight.position.set(-8, 6, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45); // Gorgeous backrim spotlight
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    // Subtle bottom bounce light
    const floorLight = new THREE.DirectionalLight(0xffffff, 0.25);
    floorLight.position.set(0, -10, 0);
    scene.add(floorLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't allow camera to go too far below
    controls.minDistance = 4;
    controls.maxDistance = 35;
    
    if (cameraView) {
      controls.target.set(cameraView.target.x, cameraView.target.y, cameraView.target.z);
    } else {
      controls.target.set(0, 0.8, 0);
    }
    controlsRef.current = controls;

    // 6. Grid floor (discreet 3D print bed grid)
    const gridHelper = new THREE.GridHelper(18, 18, 0x8338ec, 0x334155);
    gridHelper.position.y = -2.8;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 7. Base model group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 8. Transform Controls (Gizmos)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    transformControls.addEventListener('change', () => {
      renderer.render(scene, camera);
      
      // Real-time transform tracking & saving to LocalStorage
      const object = transformControls.object;
      if (object) {
        const saved = localStorage.getItem('g3d_chop_mesh_transforms');
        const transforms = saved ? JSON.parse(saved) : {};
        transforms[object.name] = {
          position: { x: object.position.x, y: object.position.y, z: object.position.z },
          rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
          scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z }
        };
        localStorage.setItem('g3d_chop_mesh_transforms', JSON.stringify(transforms));
      }
    });
    
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    // 8b. BoxHelper (Hitbox Outline)
    const boxHelper = new THREE.BoxHelper(new THREE.Object3D(), 0x3b82f6);
    scene.add(boxHelper);
    boxHelper.visible = false;

    // 9. Text Decal Texture Setup
    const canvas = document.createElement('canvas');
    textTextureCanvasRef.current = canvas;
    const textTexture = new THREE.CanvasTexture(canvas);
    textTextureRef.current = textTexture;
    drawTextCanvas();

    // 10. Generate Fallback or Reactive Cup meshes
    generateFallbackProceduralCup();

    // 11. Custom transforms restore
    applySavedTransforms(modelGroup);

    // Click raycaster event
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!renderer || !camera || !modelGroup) return;

      // Calculate mouse position relative to canvas bounds
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      const activeT = activeToolRef.current;

      if (intersects.length > 0) {
        // Grab top-most mesh parent inside modelGroup
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== modelGroup && hitObject.parent !== scene) {
          hitObject = hitObject.parent;
        }

        if (hitObject) {
          const name = hitObject.name;
          
          if (activeT === 'orbit') {
            // Orbit view mode: clicking doesn't select or attach transform controls
            return;
          }

          setSelectedMeshName(name);

          if (activeT === 'select') {
            transformControls.detach();
            
            if (name.includes('Tope') || name.includes('Labio')) {
              onPartSelected?.('tope');
              setSelectedGroupId('g2');
            } else if (name.includes('Cuerpo')) {
              onPartSelected?.('cuerpo');
              setSelectedGroupId('g1');
            } else if (name.includes('Mango') || name.includes('Handle')) {
              onPartSelected?.('mango');
              setSelectedGroupId('g3');
            } else if (name.includes('BandaBase') || name.includes('Ring')) {
              const num = name.match(/\d+/);
              const idx = num ? parseInt(num[0]) - 1 : 0;
              onPartSelected?.('band', idx);
              setSelectedGroupId('g4');
            }
          }
        }
      } else {
        // Deselect if clicked empty space
        if (activeT !== 'select' && activeT !== 'orbit' && !transformControls.dragging) {
          transformControls.detach();
          setSelectedMeshName(null);
        }
      }
    };

    // Double-click to select individual piece
    const handleCanvasDblClick = (event: MouseEvent) => {
      if (!renderer || !camera || !modelGroup) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== modelGroup && hitObject.parent !== scene) {
          hitObject = hitObject.parent;
        }

        if (hitObject) {
          const name = hitObject.name;
          setSelectedMeshName(name);
          
          const activeT = activeToolRef.current;
          // Auto-attach transform controls on double click
          if (activeT === 'translate' || activeT === 'rotate' || activeT === 'scale') {
            const targetObj = transformTargetRef.current === 'model' ? modelGroup : hitObject;
            transformControls.attach(targetObj);
          } else {
            setActiveTool('select');
          }

          if (name.includes('Tope') || name.includes('Labio')) {
            onPartSelected?.('tope');
            setSelectedGroupId('g2');
          } else if (name.includes('Cuerpo')) {
            onPartSelected?.('cuerpo');
            setSelectedGroupId('g1');
          } else if (name.includes('Mango') || name.includes('Handle')) {
            onPartSelected?.('mango');
            setSelectedGroupId('g3');
          } else if (name.includes('BandaBase') || name.includes('Ring')) {
            const num = name.match(/\d+/);
            const idx = num ? parseInt(num[0]) - 1 : 0;
            onPartSelected?.('band', idx);
            setSelectedGroupId('g4');
          }
          toast.success(`Doble click: Pieza "${name}" enfocada.`);
        }
      }
    };

    // Hover raycaster pointermove event
    const handlePointerMove = (event: PointerEvent) => {
      if (!renderer || !camera || !modelGroup) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== modelGroup && hitObject.parent !== scene) {
          hitObject = hitObject.parent;
        }

        if (hitObject) {
          setLocalHoveredMeshName(hitObject.name);
          return;
        }
      }
      setLocalHoveredMeshName(null);
    };

    renderer.domElement.addEventListener('pointerdown', handleCanvasClick);
    renderer.domElement.addEventListener('dblclick', handleCanvasDblClick);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // Resize observer
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        handleResize();
      });
    });
    resizeObserver.observe(mountRef.current);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      
      // Update decal orientation
      if (textTextureRef.current) {
        textTextureRef.current.rotation = THREE.MathUtils.degToRad(textRotation);
      }

      // Update Bounding Box Hitbox overlay dynamically
      const activeT = activeToolRef.current;
      const object = transformControls.object;
      if (object && activeT !== 'orbit' && activeT !== 'select') {
        boxHelper.setFromObject(object);
        boxHelper.visible = true;
        boxHelper.update();
      } else {
        boxHelper.visible = false;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('pointerdown', handleCanvasClick);
        rendererRef.current.domElement.removeEventListener('dblclick', handleCanvasDblClick);
        rendererRef.current.domElement.removeEventListener('pointermove', handlePointerMove);
        rendererRef.current.dispose();
      }
      transformControls.dispose();
    };
  }, []);

  // Regenerate procedural fallback cup on template change, if no 3MF is loaded
  useEffect(() => {
    if (!modelLoaded && modelGroupRef.current) {
      generateFallbackProceduralCup();
    }
  }, [activeCuerpo, activeMango, activeTope, activeBase, colorBands.length, modelLoaded]);

  // Handle live perspective swaps
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const scene = sceneRef.current;
    if (!camera || !controls || !scene) return;

    if (viewPerspective === '2d') {
      // Direct beautiful angled flat alignment (semi-orthographic product focus)
      controls.enabled = false;
      camera.position.set(0.2, 1.9, 11);
      controls.target.set(0, 1.0, 0);
      controls.update();
      
      // Hide print helper grid for ultimate clean presentation
      scene.traverse((child) => {
        if (child instanceof THREE.GridHelper) {
          child.visible = false;
        }
      });
    } else {
      // Re-enable 3D interactive controls
      controls.enabled = activeTool === 'orbit';
      camera.position.set(0, 4, 15);
      controls.target.set(0, 0.8, 0);
      controls.update();
      
      scene.traverse((child) => {
        if (child instanceof THREE.GridHelper) {
          child.visible = true;
        }
      });
    }
  }, [viewPerspective, activeTool]);

  // Adjust Transform controls mode and object attachment dynamically
  useEffect(() => {
    const transformControls = transformControlsRef.current;
    const controls = controlsRef.current;
    if (!transformControls) return;

    if (activeTool === 'select' || activeTool === 'orbit') {
      transformControls.detach();
      if (controls) {
        controls.enabled = true; // allow view rotation when select or orbit is active
      }
      return;
    }

    if (controls) {
      controls.enabled = !transformControls.dragging;
    }

    if (activeTool === 'translate') {
      transformControls.setMode('translate');
    } else if (activeTool === 'rotate') {
      transformControls.setMode('rotate');
    } else if (activeTool === 'scale') {
      transformControls.setMode('scale');
    }

    if (transformTarget === 'model') {
      if (modelGroupRef.current) {
        transformControls.attach(modelGroupRef.current);
      }
    } else {
      if (selectedMeshName && modelGroupRef.current) {
        let foundObject: THREE.Object3D | undefined;
        modelGroupRef.current.traverse((child) => {
          if (child.name === selectedMeshName) {
            foundObject = child;
          }
        });
        
        if (!foundObject) {
          foundObject = modelGroupRef.current.children.find(c => c.name === selectedMeshName);
        }

        if (foundObject) {
          transformControls.attach(foundObject);
        } else {
          transformControls.detach();
        }
      } else {
        transformControls.detach();
      }
    }
  }, [transformTarget, selectedMeshName, activeTool]);

  // Sync colors & properties on state updates
  useEffect(() => {
    applyGroupColorsToScene();
  }, [
    colorCuerpo, 
    colorMango, 
    colorTope, 
    colorBands, 
    groups, 
    activeCuerpo, 
    activeMango, 
    activeTope, 
    embossedText, 
    textDepthMode, 
    textColor, 
    textSize, 
    textRotation,
    activeHoveredMeshName
  ]);

  // ==========================================
  // GENERATE THE HIGH-FIDELITY CHOP 3D MODEL
  // ==========================================
  const generateFallbackProceduralCup = () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    // Clear previous elements
    while(modelGroup.children.length > 0) {
      modelGroup.remove(modelGroup.children[0]);
    }

    const matConfig = (color: string) => new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.38, // High fidelity premium plastic matte-shiny finish
      metalness: 0.08,
      bumpScale: 0.06
    });

    // Compute sizing multipliers based on current selected volume (0.5L, 0.75L, 1.0L)
    let bodyRadius = 2.1;
    let bodyHeight = 5.0;
    
    if (activeCuerpo === 'c2') { // 750cc
      bodyRadius = 2.4;
      bodyHeight = 5.4;
    } else if (activeCuerpo === 'c3') { // 1000cc
      bodyRadius = 2.7;
      bodyHeight = 6.0;
    }

    // 1. Cuerpo Principal (Cylinder body)
    const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius - 0.1, bodyHeight, 36);
    const bodyMesh = new THREE.Mesh(bodyGeom, matConfig(compactMode ? colorCuerpo : '#d4af37'));
    bodyMesh.name = 'CuerpoCup';
    bodyMesh.position.y = bodyHeight / 2 - 1.5;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // 2. Labio / Tope Superior (Upper ring)
    const rimRadius = bodyRadius + 0.08;
    const rimThickness = activeTope === 't2' ? 0.22 : 0.15;
    const rimGeom = new THREE.TorusGeometry(rimRadius, rimThickness, 16, 64);
    const rimMesh = new THREE.Mesh(rimGeom, matConfig(compactMode ? colorTope : '#1e1e1e'));
    rimMesh.name = 'LabioCup';
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = bodyHeight - 1.5;
    rimMesh.castShadow = true;
    modelGroup.add(rimMesh);

    // 3. Extruded Handle (Mangos)
    const extSettings = { depth: 0.45, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    let handleMesh: THREE.Mesh | null = null;

    if (activeMango === 'm1' || !compactMode) {
      // A) Mango Geometrico G3D
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(1.8, 0.3);
      shape.lineTo(1.8, -3.2);
      shape.lineTo(0, -3.5);
      shape.lineTo(0, -2.8);
      shape.lineTo(1.1, -2.6);
      shape.lineTo(1.1, -0.6);
      shape.lineTo(0, -0.4);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, extSettings);
      geom.center();
      handleMesh = new THREE.Mesh(geom, matConfig(compactMode ? colorMango : '#eab308'));
      handleMesh.name = 'MangoGeometrico';
      handleMesh.position.set(bodyRadius + 0.3, bodyHeight / 2 - 1.3, 0);
      handleMesh.castShadow = true;
      modelGroup.add(handleMesh);
    }

    if (activeMango === 'm2' || (!compactMode && handleMesh === null)) {
      // B) Mango Redondeado Confort
      const shape = new THREE.Shape();
      shape.absarc(0, -1.5, 1.8, Math.PI / 2, -Math.PI / 2, true);
      shape.lineTo(0, -3.1);
      shape.absarc(0, -1.5, 1.2, -Math.PI / 2, Math.PI / 2, false);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, extSettings);
      geom.center();
      handleMesh = new THREE.Mesh(geom, matConfig(compactMode ? colorMango : '#eab308'));
      handleMesh.name = 'MangoRedondeado';
      handleMesh.position.set(bodyRadius + 0.3, bodyHeight / 2 - 1.3, 0);
      handleMesh.castShadow = true;
      if (compactMode) {
        modelGroup.add(handleMesh);
      } else {
        handleMesh.visible = false;
        modelGroup.add(handleMesh);
      }
    }

    if (activeMango === 'm3' || (!compactMode && handleMesh === null)) {
      // C) Mango Deportivo
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(2, 0.5, 2.2, -1.5);
      shape.quadraticCurveTo(2.4, -3.2, 0, -3.5);
      shape.lineTo(0, -2.9);
      shape.quadraticCurveTo(1.5, -2.7, 1.4, -1.5);
      shape.quadraticCurveTo(1.3, -0.4, 0, -0.6);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, extSettings);
      geom.center();
      handleMesh = new THREE.Mesh(geom, matConfig(compactMode ? colorMango : '#eab308'));
      handleMesh.name = 'MangoDeportivo';
      handleMesh.position.set(bodyRadius + 0.35, bodyHeight / 2 - 1.3, 0);
      handleMesh.castShadow = true;
      if (compactMode) {
        modelGroup.add(handleMesh);
      } else {
        handleMesh.visible = false;
        modelGroup.add(handleMesh);
      }
    }

    // 4. Base / Stacked Bands
    const bandHeight = 0.16;
    const bandRadius = bodyRadius + 0.12;
    const totalBands = compactMode ? colorBands.length : 3;

    for (let i = 0; i < totalBands; i++) {
      const bandColor = compactMode ? colorBands[i] : '#ffffff';
      const bandGeom = new THREE.CylinderGeometry(bandRadius - i * 0.03, bandRadius - i * 0.03, bandHeight, 36);
      const bandMesh = new THREE.Mesh(bandGeom, matConfig(bandColor));
      bandMesh.name = `BandaBase${i + 1}`;
      // Stack down below the cylinder body bottom
      bandMesh.position.y = -1.45 - i * (bandHeight + 0.02);
      bandMesh.castShadow = true;
      modelGroup.add(bandMesh);
    }

    // 5. Interactive Decal Logo Plane
    const logoGeom = new THREE.PlaneGeometry(1.5, 1.5);
    const logoMat = new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.3,
      side: THREE.DoubleSide,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });
    const logoMesh = new THREE.Mesh(logoGeom, logoMat);
    logoMesh.name = 'LogoPlane';
    // Offset slightly in front of cylinder face
    logoMesh.position.set(0, bodyHeight / 2 - 1.2, bodyRadius + 0.08);
    logoMesh.scale.set(logoScale, logoScale, 1);
    logoMesh.rotation.z = THREE.MathUtils.degToRad(logoRotate);
    
    // Convert 2D SVG offset to small 3D units
    logoMesh.position.x += logoX / 80;
    logoMesh.position.y -= logoY / 80;

    logoMesh.visible = logoImage !== null;
    modelGroup.add(logoMesh);
    logoMeshRef.current = logoMesh;

    // Save list of discovered meshes
    const names: string[] = [];
    modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        names.push(child.name);
      }
    });
    setDiscoveredMeshes(names);
    
    // Apply colors and decals
    applyGroupColorsToScene();
    setModelLoaded(true);
  };

  // Apply colors to either loaded 3MF or generated procedural cup
  const applyGroupColorsToScene = () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    if (compactMode) {
      // Reactive binding from Customizer props
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const name = child.name;
          
          // Apply dynamic group color matching if defined
          let foundGroupColor: string | null = null;
          if (groups && groups.length > 0) {
            const groupMatch = groups.find(g => g.meshNames.includes(name));
            if (groupMatch) {
              if (groupMatch.isExclusive) {
                child.visible = groupMatch.activeMeshName === name;
              } else {
                child.visible = true;
              }
              foundGroupColor = groupMatch.color;
            }
          }

          if (foundGroupColor) {
            child.material.color.set(foundGroupColor);
          } else {
            if (name.includes('Cuerpo')) {
              child.material.color.set(colorCuerpo);
            } else if (name.includes('Labio') || name.includes('Tope')) {
              child.material.color.set(colorTope);
            } else if (name.includes('Mango') || name.includes('Handle')) {
              child.material.color.set(colorMango);
            } else if (name.includes('BandaBase')) {
              const match = name.match(/\d+/);
              const idx = match ? parseInt(match[0]) - 1 : 0;
              if (colorBands[idx]) {
                child.material.color.set(colorBands[idx]);
              }
            }
          }

          // Hover highlight overlay (emissive neon pink)
          if (activeHoveredMeshName === name) {
            child.material.emissive.setHex(0xec4899);
            child.material.emissiveIntensity = 0.95;
          } else {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }

          child.material.needsUpdate = true;
        }
      });
    } else {
      // Standalone loaded groups colors
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const name = child.name;
          
          // Find if this mesh belongs to any group
          const group = groups.find(g => g.meshNames.includes(name));
          if (group) {
            if (!group.visible) {
              child.visible = false;
            } else if (group.isExclusive) {
              child.visible = group.activeMeshName === name;
            } else {
              child.visible = true;
            }
            child.material.color.set(group.color);
          }

          // Hover highlight overlay (emissive neon pink)
          if (activeHoveredMeshName === name) {
            child.material.emissive.setHex(0xec4899);
            child.material.emissiveIntensity = 0.95;
          } else {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }

          child.material.needsUpdate = true;
        }
      });
    }

    applyTextEmbossingTexture();
  };

  const applyTextEmbossingTexture = () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    const cuerpo = modelGroup.getObjectByName('CuerpoCup') as THREE.Mesh;
    if (cuerpo && cuerpo.material instanceof THREE.MeshStandardMaterial) {
      if (embossedText.trim() === '') {
        cuerpo.material.map = null;
        cuerpo.material.bumpMap = null;
        cuerpo.material.needsUpdate = true;
        return;
      }

      if (textTextureRef.current) {
        cuerpo.material.map = textTextureRef.current;
        if (textDepthMode !== 'flat') {
          cuerpo.material.bumpMap = textTextureRef.current;
          cuerpo.material.bumpScale = textDepthMode === 'embossed' ? 0.08 : -0.08;
        } else {
          cuerpo.material.bumpMap = null;
        }
        cuerpo.material.needsUpdate = true;
      }
    }
  };

  // RESTORE ORIGINAL FACTORY COORDINATES
  const handleResetTransforms = () => {
    localStorage.removeItem('g3d_chop_mesh_transforms');
    
    // Reset positions back to template default
    generateFallbackProceduralCup();
    
    const transformControls = transformControlsRef.current;
    if (transformControls) {
      transformControls.detach();
    }
    setSelectedMeshName(null);
    toast.success("¡Estructura restablecida a la posición original!");
  };

  const load3MFBuffer = (arrayBuffer: ArrayBuffer, fileName: string = 'Modelo 3MF') => {
    try {
      const loader = new ThreeMFLoader();
      const object3D = loader.parse(arrayBuffer);
      
      const modelGroup = modelGroupRef.current;
      if (!modelGroup || !sceneRef.current) {
        return;
      }

      while(modelGroup.children.length > 0) {
        modelGroup.remove(modelGroup.children[0]);
      }

      const box = new THREE.Box3().setFromObject(object3D);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5.0 / maxDim;
      object3D.scale.set(scale, scale, scale);
      object3D.position.set(-center.x * scale, -center.y * scale + 1, -center.z * scale);

      const meshNames: string[] = [];
      let index = 1;
      
      object3D.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.name || child.name.trim() === '') {
            child.name = `Parte_3MF_#${index++}`;
          }
          meshNames.push(child.name);
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#94a3b8'),
            roughness: 0.4,
            metalness: 0.1
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelGroup.add(object3D);
      setDiscoveredMeshes(meshNames);
      setModelLoaded(true);

      const newPartGroup: PartGroup = {
        id: `g_uploaded_${Date.now()}`,
        name: `Piezas 3MF Cargadas 📦`,
        meshNames: meshNames,
        color: '#2563eb',
        isExclusive: false,
        visible: true
      };
      
      setGroups([newPartGroup]);
      toast.success(`Modelo 3MF "${fileName}" cargado con éxito! Se descubrieron ${meshNames.length} piezas.`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al procesar el archivo 3MF: ${err.message || 'Formato inválido'}`);
    }
  };

  const handle3MFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        load3MFBuffer(arrayBuffer, file.name);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSTLFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        
        const modelGroup = modelGroupRef.current;
        if (!modelGroup) {
          toast.error("Por favor, carga primero un modelo base 3MF antes de integrar un STL.");
          return;
        }

        // Standard high-quality material for the new STL piece
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#8338ec'),
          roughness: 0.4,
          metalness: 0.1
        });

        // Unique name for the newly loaded mesh piece
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
        const uniqueMeshName = `${cleanName}_STL_${Date.now()}`;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = uniqueMeshName;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Center on floor Bed
        mesh.position.set(0, 0, 0);

        modelGroup.add(mesh);

        // Update list of discovered meshes in state
        const updatedMeshes = [...discoveredMeshes, uniqueMeshName];
        setDiscoveredMeshes(updatedMeshes);

        // Include this mesh in the first available group so it gets colored
        if (groups && groups.length > 0) {
          const updatedGroups = groups.map((g, idx) => {
            if (idx === 0) {
              return {
                ...g,
                meshNames: [...g.meshNames, uniqueMeshName]
              };
            }
            return g;
          });
          setGroups(updatedGroups);
        } else {
          const newPartGroup: PartGroup = {
            id: `g_uploaded_${Date.now()}`,
            name: `Piezas Cargadas 🧩`,
            meshNames: [uniqueMeshName],
            color: '#8338ec',
            isExclusive: false,
            visible: true
          };
          setGroups([newPartGroup]);
        }

        applyGroupColorsToScene();
        toast.success(`Pieza STL "${file.name}" integrada con éxito como "${uniqueMeshName}".`);
      } catch (err: any) {
        console.error(err);
        toast.error(`Error al procesar el archivo STL: ${err.message || 'Formato inválido'}`);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleLoadDriveFile = async (driveFile: DriveFile) => {
    setIsDriveModalOpen(false);
    setLoading(true);
    try {
      const url = `/api/drive/download?fileId=${driveFile.id}`;
      const headers: Record<string, string> = {};
      if (driveToken) {
        headers['Authorization'] = `Bearer ${driveToken}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error de descarga (Código: ${res.status})`);
      }

      const isJson = driveFile.name.toLowerCase().endsWith('.json') || driveFile.mimeType === 'application/json';
      
      if (isJson) {
        const configJson = await res.json();
        if (configJson.groups) {
          setGroups(configJson.groups);
        }
        if (configJson.embossedText !== undefined) {
          setEmbossedText(configJson.embossedText);
        }
        if (configJson.textDepthMode !== undefined) {
          setTextDepthMode(configJson.textDepthMode);
        }
        if (configJson.textColor !== undefined) {
          setTextColor(configJson.textColor);
        }
        if (configJson.textSize !== undefined) {
          setTextSize(configJson.textSize);
        }
        if (configJson.textRotation !== undefined) {
          setTextRotation(configJson.textRotation);
        }
        if (configJson.bgConfig !== undefined) {
          setBgConfig(configJson.bgConfig);
        }
        toast.success(`Configuración del proyecto "${driveFile.name}" cargada con éxito!`);
      } else {
        const arrayBuffer = await res.arrayBuffer();
        load3MFBuffer(arrayBuffer, driveFile.name);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al importar de Google Drive: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPastedLink = async () => {
    if (!drivePastedLink.trim()) {
      toast.error('Por favor introduce un enlace o ID válido de Google Drive.');
      return;
    }

    let fileId = drivePastedLink.trim();
    const driveReg = /\/file\/d\/([a-zA-Z0-9_-]{25,50})/;
    const openReg = /[?&]id=([a-zA-Z0-9_-]{25,50})/;
    
    const dMatch = fileId.match(driveReg);
    const oMatch = fileId.match(openReg);
    
    if (dMatch && dMatch[1]) {
      fileId = dMatch[1];
    } else if (oMatch && oMatch[1]) {
      fileId = oMatch[1];
    }

    setIsDriveModalOpen(false);
    setLoading(true);
    try {
      const url = `/api/drive/download?fileId=${fileId}`;
      const headers: Record<string, string> = {};
      if (driveToken) {
        headers['Authorization'] = `Bearer ${driveToken}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Error al descargar el archivo compartido. Asegúrate de que el enlace tenga los accesos públicos activos.`);
      }

      const arrayBuffer = await res.arrayBuffer();
      load3MFBuffer(arrayBuffer, `Enlace Drive (${fileId.substring(0, 6)}...)`);
      setDrivePastedLink('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al descargar archivo desde el enlace.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProjectToDrive = async () => {
    if (!driveUser || !driveToken) {
      toast.error('Debes iniciar sesión con Google para guardar proyectos en tu Drive.');
      return;
    }

    const filename = window.prompt('Introduce un nombre para guardar este proyecto en Google Drive:', 'mi_chop_personalizado');
    if (!filename) return;

    const confirmed = window.confirm(`¿Confirmas subir el proyecto "${filename}.json" a tu cuenta de Google Drive?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const projectConfig = {
        groups,
        embossedText,
        textDepthMode,
        textColor,
        textSize,
        textRotation,
        bgConfig,
        savedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(projectConfig, null, 2)], { type: 'application/json' });
      const driveFile = await uploadFileToDrive(driveToken, `${filename}.json`, blob, 'application/json');
      
      toast.success(`¡Proyecto guardado con éxito en tu Google Drive! (ID: ${driveFile.id})`);
      loadDriveFiles(driveToken);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar en Google Drive: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveCameraView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const view: SavedCameraView = {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
    };

    setCameraView(view);
    localStorage.setItem('g3d_3mf_camera_view', JSON.stringify(view));
    toast.success("Ángulo de cámara inicial guardado correctamente!");
  };

  const handleResetCamera = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (cameraView) {
      camera.position.set(cameraView.position.x, cameraView.position.y, cameraView.position.z);
      controls.target.set(cameraView.target.x, cameraView.target.y, cameraView.target.z);
    } else {
      camera.position.set(0, 4, 15);
      controls.target.set(0, 0.8, 0);
    }
    controls.update();
    toast.info("Cámara orientada al ángulo predeterminado.");
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBgConfig({ ...bgConfig, imageUrl: url });
      toast.success("Fondo del simulador cargado.");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = () => {
    const name = window.prompt("Introduce el nombre del nuevo grupo:");
    if (!name || name.trim() === '') return;

    const newGroup: PartGroup = {
      id: `g_${Date.now()}`,
      name: name,
      meshNames: [],
      color: '#ffffff',
      isExclusive: false,
      visible: true
    };

    setGroups([...groups, newGroup]);
    toast.success(`Grupo "${name}" creado.`);
  };

  const handleDeleteGroup = (id: string) => {
    if (groups.length <= 1) {
      toast.error("Debes mantener al menos un grupo de color activo.");
      return;
    }
    setGroups(groups.filter(g => g.id !== id));
    toast.info("Grupo removido.");
  };

  const handleToggleMeshInGroup = (groupId: string, meshName: string) => {
    setGroups(groups.map((g) => {
      if (g.id === groupId) {
        const exists = g.meshNames.includes(meshName);
        const newMeshNames = exists 
          ? g.meshNames.filter(m => m !== meshName)
          : [...g.meshNames, meshName];
        
        return { 
          ...g, 
          meshNames: newMeshNames,
          activeMeshName: newMeshNames.includes(g.activeMeshName || '') ? g.activeMeshName : newMeshNames[0]
        };
      }
      if (g.id !== groupId && g.meshNames.includes(meshName)) {
        return {
          ...g,
          meshNames: g.meshNames.filter(m => m !== meshName)
        };
      }
      return g;
    }));
  };

  // Compact renderer view
  if (compactMode) {
    return (
      <div className="w-full h-full relative flex flex-col items-stretch overflow-hidden select-none" id="3mf-loader-container">
        
        {/* BOTÓN PARA CONFIGURAR MODELOS Y GRUPOS 3D */}
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-slate-950/80 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg border border-white/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 backdrop-blur-md group"
            title="Configurar Modelos 3D y Grupos"
          >
            <Settings size={12} className="text-indigo-400 group-hover:text-white transition-colors" />
            <span>Modelos & Grupos 3D</span>
          </button>
        )}

        {/* FLOATING ADMIN TOOLBAR IN COMPACT MODE */}
        {groups && (
          <div className="absolute top-16 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl max-w-[95%]">
            {/* ORBIT */}
            <button
              type="button"
              onClick={() => setActiveTool('orbit')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'orbit'
                  ? 'bg-[#8338ec] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Rotar vista (Orbitar)"
            >
              <RefreshCw size={12} className={activeTool === 'orbit' ? 'animate-spin-slow' : ''} />
              <span>Orbitar 🔄</span>
            </button>

            {/* TRANSLATE / MOVE */}
            <button
              type="button"
              onClick={() => setActiveTool('translate')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'translate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Mover pieza seleccionada o modelo entero"
            >
              <Move size={12} />
              <span>Mover 🎛️</span>
            </button>

            {/* ROTATE PIECES */}
            <button
              type="button"
              onClick={() => setActiveTool('rotate')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'rotate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Rotar mallas individualmente"
            >
              <RotateCw size={12} />
              <span>Rotar 📐</span>
            </button>

            {/* SCALE WITH HITBOX */}
            <button
              type="button"
              onClick={() => setActiveTool('scale')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'scale'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Escalar tamaño (Muestra hitbox azul de selección)"
            >
              <Maximize2 size={12} />
              <span>Escalar 📐</span>
            </button>

            {/* SELECT & PAINT */}
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'select'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Seleccionar y Pintar"
            >
              <MousePointer size={12} />
              <span>Pintar 🎨</span>
            </button>

            {/* DIVIDER */}
            <div className="w-[1px] h-5 bg-slate-800 mx-1" />

            {/* TRANSFORM TARGET */}
            <div className="flex items-center bg-slate-900/60 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTransformTarget('part')}
                className={`px-2 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  transformTarget === 'part'
                    ? 'bg-slate-800 text-indigo-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Transformar sólo la pieza activa"
              >
                Pieza
              </button>
              <button
                type="button"
                onClick={() => setTransformTarget('model')}
                className={`px-2 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  transformTarget === 'model'
                    ? 'bg-slate-800 text-indigo-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Transformar todo el modelo completo"
              >
                Todo
              </button>
            </div>

            {/* INTEGRATE STL PIECE BUTTON */}
            <button
              type="button"
              onClick={() => document.getElementById('stl-file-uploader-hidden')?.click()}
              className="px-2 py-1 bg-indigo-950/50 hover:bg-indigo-900 hover:text-white text-indigo-400 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-indigo-900/50 text-[9.5px] font-bold uppercase tracking-wider"
              title="Integrar archivo STL al proyecto"
            >
              <span>+ STL 🧩</span>
            </button>

            {/* RESET BUTTON */}
            <button
              type="button"
              onClick={handleResetTransforms}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
              title="Restablecer posiciones originales"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        )}

        {/* PERSPECTIVE SWITCH (2D Frontal vs 3D libre) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-black/75 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setViewPerspective('2d')}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              viewPerspective === '2d' 
                ? 'bg-[#8338ec] text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista 2D Frontal
          </button>
          <button
            onClick={() => setViewPerspective('3d')}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              viewPerspective === '3d' 
                ? 'bg-[#8338ec] text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista 3D Libre
          </button>
        </div>

        {/* Selected element notification badge */}
        {selectedMeshName && (
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/75 border border-white/10 rounded-xl backdrop-blur-md text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Seleccionado: <span className="text-[#8338ec]">{selectedMeshName}</span>
          </div>
        )}

        {/* THE WEBGL MOUNT POINT */}
        <div 
          ref={mountRef} 
          className="w-full h-full min-h-[460px] sm:min-h-[520px] z-10 cursor-grab active:cursor-grabbing" 
        />

        {/* Canvas hidden for embossing text raster generation */}
        <canvas ref={textTextureCanvasRef} className="hidden" />

      </div>
    );
  }

  // Stand-alone Mode
  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl" id="3mf-loader-container">
      
      {/* HEADER BAR */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#8338ec]/10 text-[#8338ec] rounded-xl">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              Simulador 3D Real .3MF
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded-md animate-bounce">
                ORCA ENGINE
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Mapeador de filamentos en vivo, agrupamiento exclusivo y calados
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sliders size={13} />
            {isAdmin ? 'Guardar Cambios' : 'Ajustes Fabricante'}
          </button>

          <button
            onClick={triggerFileInput}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8338ec] hover:bg-[#7226db] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            title="Subir archivo .3MF desde OrcaSlicer, Bambu Studio o PrusaSlicer"
          >
            <FolderOpen size={13} />
            Cargar .3MF
          </button>

          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            title="Cargar o gestionar archivos desde tu cuenta de Google Drive"
          >
            <Cloud size={13} />
            Google Drive 📁
          </button>

          {driveUser && (
            <button
              onClick={handleSaveProjectToDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              title="Guardar el estado y los grupos actuales en Google Drive"
            >
              <Check size={13} />
              Guardar en Drive 💾
            </button>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handle3MFUpload} 
            accept=".3mf" 
            className="hidden" 
          />
        </div>
      </div>

      {/* CORE VIEWPORT & CONFIG GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
        
        {/* LEFT COLUMN: 3D VIEWPORT */}
        <div className="lg:col-span-7 relative flex flex-col border-r border-slate-100 dark:border-slate-800 select-none bg-slate-100/50 dark:bg-slate-950/20">
          
          <div 
            className="absolute inset-0 z-0 transition-all pointer-events-none"
            style={{
              backgroundImage: bgConfig.imageUrl ? `url(${bgConfig.imageUrl})` : 'none',
              backgroundSize: bgConfig.size,
              backgroundPosition: 'center',
              opacity: bgConfig.opacity,
              filter: `blur(${bgConfig.blur}px)`,
            }}
          />

          {/* FLOATING ADMIN TOOLBAR */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl max-w-[95%]">
            {/* ORBIT */}
            <button
              type="button"
              onClick={() => setActiveTool('orbit')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'orbit'
                  ? 'bg-[#8338ec] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Rotar vista (Orbitar)"
            >
              <RefreshCw size={12} className={activeTool === 'orbit' ? 'animate-spin-slow' : ''} />
              <span>Orbitar 🔄</span>
            </button>

            {/* TRANSLATE / MOVE */}
            <button
              type="button"
              onClick={() => setActiveTool('translate')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'translate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Mover pieza seleccionada o modelo entero"
            >
              <Move size={12} />
              <span>Mover 🎛️</span>
            </button>

            {/* ROTATE PIECES */}
            <button
              type="button"
              onClick={() => setActiveTool('rotate')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'rotate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Rotar mallas individualmente"
            >
              <RotateCw size={12} />
              <span>Rotar 📐</span>
            </button>

            {/* SCALE WITH HITBOX */}
            <button
              type="button"
              onClick={() => setActiveTool('scale')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'scale'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Escalar tamaño (Muestra hitbox azul de selección)"
            >
              <Maximize2 size={12} />
              <span>Escalar 📐</span>
            </button>

            {/* SELECT & PAINT */}
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
                activeTool === 'select'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title="Seleccionar y Pintar"
            >
              <MousePointer size={12} />
              <span>Pintar 🎨</span>
            </button>

            {/* DIVIDER */}
            <div className="w-[1px] h-5 bg-slate-800 mx-1" />

            {/* TRANSFORM TARGET */}
            <div className="flex items-center bg-slate-900/60 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTransformTarget('part')}
                className={`px-2 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  transformTarget === 'part'
                    ? 'bg-slate-800 text-indigo-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Transformar sólo la pieza activa"
              >
                Pieza
              </button>
              <button
                type="button"
                onClick={() => setTransformTarget('model')}
                className={`px-2 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  transformTarget === 'model'
                    ? 'bg-slate-800 text-indigo-400 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Transformar todo el modelo completo"
              >
                Todo
              </button>
            </div>

            {/* INTEGRATE STL PIECE BUTTON */}
            <button
              type="button"
              onClick={() => document.getElementById('stl-file-uploader-hidden')?.click()}
              className="px-2 py-1 bg-indigo-950/50 hover:bg-indigo-900 hover:text-white text-indigo-400 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-indigo-900/50 text-[9.5px] font-bold uppercase tracking-wider"
              title="Integrar archivo STL al proyecto"
            >
              <span>+ STL 🧩</span>
            </button>

            {/* RESET BUTTON */}
            <button
              type="button"
              onClick={handleResetTransforms}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
              title="Restablecer posiciones originales"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            <button
              onClick={handleResetCamera}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-md transition cursor-pointer"
              title="Restablecer posición de cámara predeterminada"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div ref={mountRef} className="w-full h-[380px] lg:h-full min-h-[420px] z-10 cursor-grab active:cursor-grabbing" />

          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white gap-3">
              <div className="size-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                Procesando Archivo .3MF y Descomprimiendo XML...
              </span>
            </div>
          )}

          <canvas ref={textTextureCanvasRef} className="hidden" />

          <div className="absolute bottom-3 inset-x-3 z-10 flex justify-center">
            <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-wrap items-center justify-center gap-2 max-w-full">
              {groups.map((group) => {
                if (!group.isExclusive || group.meshNames.length === 0) return null;
                return (
                  <div key={group.id} className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider">
                      {group.name.split(' ')[0]}:
                    </span>
                    <div className="flex gap-1">
                      {group.meshNames.map((mName) => {
                        const isSelected = group.activeMeshName === mName;
                        const displayLabel = mName
                          .replace('Mango', '')
                          .replace('Geometrico', 'Geométrico')
                          .replace('Redondeado', 'Redondo')
                          .replace('Deportivo', 'Deportivo');
                        
                        return (
                          <button
                            key={mName}
                            onClick={() => {
                              setGroups(groups.map(g => g.id === group.id ? { ...g, activeMeshName: mName } : g));
                              toast.info(`Cargando parte excluida: ${displayLabel}`);
                            }}
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md transition ${
                              isSelected 
                                ? 'bg-[#8338ec] text-white shadow-sm' 
                                : 'bg-white/10 hover:bg-white/20 text-slate-300'
                            }`}
                          >
                            {displayLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PAINT & GROUP MANAGEMENT */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 border-slate-150 dark:border-slate-800">
          
          <div className="p-5 space-y-5 overflow-y-auto max-h-[600px] text-left flex-1">
            
            {isAdmin ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right duration-200">
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Camera size={12} />
                    Alineación y Encuadre 3D
                  </span>
                  <p className="text-[10px] text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                    Mueve el modelo con tu mouse/dedo hasta la posición que más te guste, luego presiona el botón para fijarlo como ángulo por defecto del usuario.
                  </p>
                  <button
                    onClick={handleSaveCameraView}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Fijar Cámara Actual como Predeterminada
                  </button>
                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon size={12} />
                    Fondo Personalizado del Simulador
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL de imagen..."
                      value={bgConfig.imageUrl}
                      onChange={(e) => setBgConfig({ ...bgConfig, imageUrl: e.target.value })}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                    />
                    <button
                      onClick={() => bgInputRef.current?.click()}
                      className="px-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-white transition"
                    >
                      <Upload size={13} />
                    </button>
                    <input 
                      type="file" 
                      ref={bgInputRef} 
                      onChange={handleBgUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Opacidad ({Math.round(bgConfig.opacity * 100)}%)</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={bgConfig.opacity}
                        onChange={(e) => setBgConfig({ ...bgConfig, opacity: parseFloat(e.target.value) })}
                        className="w-full accent-[#8338ec]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Efecto Blur ({bgConfig.blur}px)</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="12" 
                        step="1"
                        value={bgConfig.blur}
                        onChange={(e) => setBgConfig({ ...bgConfig, blur: parseInt(e.target.value) })}
                        className="w-full accent-[#8338ec]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Agrupamiento de Piezas del 3MF
                    </span>
                    <button
                      onClick={handleCreateGroup}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                    >
                      <Plus size={10} />
                      Nuevo Grupo
                    </button>
                  </div>

                  {groups.map((group) => (
                    <div key={group.id} className="p-3 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={group.color} 
                            onChange={(e) => setGroups(groups.map(g => g.id === group.id ? { ...g, color: e.target.value } : g))}
                            className="size-5 rounded cursor-pointer border-0"
                          />
                          <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase">
                            {group.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                          Solo mostrar una pieza a la vez (Exclusivo)
                        </span>
                        <input 
                          type="checkbox" 
                          checked={group.isExclusive}
                          onChange={(e) => setGroups(groups.map(g => g.id === group.id ? { ...g, isExclusive: e.target.checked } : g))}
                          className="accent-[#8338ec]"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wide">
                          Asignar piezas del modelo:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1 border border-slate-100 dark:border-slate-850 rounded-lg">
                          {discoveredMeshes.map((meshName) => {
                            const isSelected = group.meshNames.includes(meshName);
                            return (
                              <button
                                key={meshName}
                                onClick={() => handleToggleMeshInGroup(group.id, meshName)}
                                className={`px-2 py-0.5 text-[8.5px] font-bold rounded border transition ${
                                  isSelected 
                                    ? 'bg-[#8338ec]/15 text-[#8338ec] border-[#8338ec]/30' 
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-150 dark:border-slate-800 hover:text-slate-600'
                                }`}
                              >
                                {meshName}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))}

                </div>

              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-left duration-200">
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    1. Selecciona el Sector del Jarro a Pintar:
                  </span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {groups.map((group) => {
                      const isSelected = selectedGroupId === group.id;
                      return (
                        <div
                          key={group.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white dark:bg-slate-950 border-[#8338ec] shadow-md scale-[1.01]' 
                              : 'bg-white dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="size-4.5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                              style={{ backgroundColor: group.color }}
                            />
                            <div>
                              <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white tracking-wide block">
                                {group.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                                {group.meshNames.length} piezas vinculadas
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroups(groups.map(g => g.id === group.id ? { ...g, visible: !g.visible } : g));
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer animate-none"
                              title={group.visible ? "Ocultar sector" : "Mostrar sector"}
                            >
                              {group.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-red-500" />}
                            </button>
                            <ChevronRight size={13} className="text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {(() => {
                    const activeGroup = groups.find(g => g.id === selectedGroupId);
                    if (!activeGroup) return null;

                    return (
                      <>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          2. Asigna un Color de Filamento para "{activeGroup.name}":
                        </span>

                        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                          {filaments.map((filament) => {
                            const isCurrentColor = activeGroup.color.toLowerCase() === filament.hex.toLowerCase();
                            return (
                              <button
                                key={filament.id}
                                onClick={() => {
                                  setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, color: filament.hex } : g));
                                  toast.success(`Pintado "${activeGroup.name}" con ${filament.name}`);
                                }}
                                className={`p-2 bg-white dark:bg-slate-950/60 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                                  isCurrentColor 
                                    ? 'border-[#8338ec] ring-1 ring-[#8338ec] scale-102 shadow-sm' 
                                    : 'border-slate-150 dark:border-slate-800/80 hover:border-slate-300'
                                }`}
                              >
                                <div 
                                  className="size-3.5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                                  style={{ backgroundColor: filament.hex }}
                                />
                                <div className="text-left overflow-hidden">
                                  <span className="text-[9.5px] font-black text-slate-800 dark:text-white block truncate uppercase tracking-tight">
                                    {filament.name.replace(' G3D', '').replace(' Chop', '')}
                                  </span>
                                  <span className="text-[7.5px] text-slate-400 block truncate font-bold uppercase tracking-widest">
                                    {filament.brand}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="p-4 bg-white dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800/85 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-wider flex items-center gap-1">
                    <Type size={13} className="text-[#8338ec]" />
                    Grabado y Calado OrcaSlicer (Texturas)
                  </span>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 block">Texto Grabado / Embosado</span>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="Escribe el texto..."
                      value={embossedText}
                      onChange={(e) => setEmbossedText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Efecto Calado</span>
                      <select
                        value={textDepthMode}
                        onChange={(e: any) => setTextDepthMode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase"
                      >
                        <option value="embossed">Embosado Relieve 凸</option>
                        <option value="carved">Calado Bajo Relieve 凹</option>
                        <option value="flat">Plano Impreso / Serigrafía</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Color de Seda</span>
                      <input 
                        type="color" 
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-8 cursor-pointer rounded-lg border-0 bg-slate-50 dark:bg-slate-900 p-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Tamaño ({textSize}px)</span>
                      <input 
                        type="range" 
                        min="20" 
                        max="75" 
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value))}
                        className="w-full accent-[#8338ec]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Orientación ({textRotation}°)</span>
                      <input 
                        type="range" 
                        min="-180" 
                        max="180" 
                        value={textRotation}
                        onChange={(e) => setTextRotation(parseInt(e.target.value))}
                        className="w-full accent-[#8338ec]"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950/20 flex items-center justify-between text-left">
            <div>
              <span className="text-[8px] font-black text-[#8338ec] block uppercase tracking-widest">
                Consumo estimado
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase font-mono">
                ~ 160g PLA Filament
              </span>
            </div>
            
            <button
              onClick={() => {
                const colorsUsed = groups.map(g => `${g.name}: ${g.color}`).join('\n');
                navigator.clipboard.writeText(`Mi Jarro Chop 3D:\n${colorsUsed}\nTexto: ${embossedText}`);
                toast.success("¡Especificaciones del Jarro copiadas para tu pedido!");
              }}
              className="px-3.5 py-1.5 bg-[#8338ec] hover:bg-[#7226db] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              Pedir por Whatsapp 🍺
            </button>
          </div>

        </div>

      </div>

      {/* GOOGLE DRIVE SYNC MODAL */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Cloud size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Explorador de Google Drive Cloud
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Sincroniza y descarga tus archivos .3MF y proyectos JSON
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <span className="text-xs font-bold uppercase tracking-wider">✕ Cerrar</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* IF NOT LOGGED IN */}
              {!driveUser ? (
                <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                  <div className="size-16 mx-auto bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <Cloud size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wide">
                      Conecta tu cuenta de Google Drive
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Accede a tus modelos 3D y plantillas .3mf guardadas en la nube. Podrás importarlos directamente en un clic o exportar tus combinaciones de colores.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      googleSignIn();
                    }}
                    className="mx-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    <Cloud size={16} />
                    Iniciar Sesión con Google
                  </button>
                </div>
              ) : (
                /* IF LOGGED IN */
                <div className="space-y-4">
                  
                  {/* Active Google User Details */}
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {driveUser.picture ? (
                        <img 
                          src={driveUser.picture} 
                          alt={driveUser.name} 
                          className="size-9 rounded-full border border-blue-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="size-9 bg-blue-500 text-white font-black rounded-full flex items-center justify-center text-xs uppercase">
                          {driveUser.name?.substring(0, 2)}
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-xs font-black text-slate-800 dark:text-white block uppercase tracking-wide">
                          {driveUser.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-semibold">
                          {driveUser.email}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => googleSignOut()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      <LogOut size={11} />
                      Desconectar
                    </button>
                  </div>

                  {/* Paste Share Link Direct Input Helper */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block text-left">
                      Cargar por Enlace Público de Google Drive (Bypass Rápido)
                    </span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Pega el enlace de compartir de Google Drive aquí..."
                        value={drivePastedLink}
                        onChange={(e) => setDrivePastedLink(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-medium"
                      />
                      <button
                        onClick={handleLoadPastedLink}
                        className="px-4 py-2 bg-[#8338ec] hover:bg-[#7226db] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-sm"
                      >
                        Importar Enlace
                      </button>
                    </div>
                  </div>

                  {/* Search and List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-left">
                        Archivos de tu Drive (.3mf o proyectos .json)
                      </span>
                      <button
                        onClick={() => loadDriveFiles(driveToken!)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Actualizar lista"
                      >
                        <RefreshCw size={12} className={driveLoading ? 'animate-spin text-blue-500' : ''} />
                      </button>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Buscar archivos..."
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-medium"
                      />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {driveLoading ? (
                      <div className="py-12 text-center space-y-2">
                        <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto" />
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">
                          Cargando archivos de Drive...
                        </span>
                      </div>
                    ) : (
                      <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                        {(() => {
                          const filtered = driveFiles.filter(f => 
                            f.name.toLowerCase().includes(driveSearch.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                                No se encontraron archivos coincidentes.
                              </div>
                            );
                          }

                          return filtered.map((file) => {
                            const isJson = file.name.toLowerCase().endsWith('.json');
                            return (
                              <div 
                                key={file.id} 
                                className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850/40 rounded-xl transition border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`p-2 rounded-lg ${isJson ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-500'}`}>
                                    <FileCode size={16} />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <span className="text-[11.5px] font-black text-slate-800 dark:text-white block truncate uppercase tracking-tight">
                                      {file.name}
                                    </span>
                                    <span className="text-[8.5px] text-slate-400 block font-bold uppercase tracking-wider">
                                      {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Tamaño desconocido'} • {isJson ? 'PROYECTO JSON' : 'MODELO 3MF'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleLoadDriveFile(file)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer shadow-sm transition"
                                  >
                                    Importar
                                  </button>
                                  <a
                                    href={`/api/drive/download?fileId=${file.id}`}
                                    download={file.name}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
                                    title="Descargar archivo a tu PC"
                                    referrerPolicy="no-referrer"
                                  >
                                    <Download size={13} />
                                  </a>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                © Google Drive API V3 • clubTivi Customizer Engine
              </span>
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden STL File Input */}
      <input 
        type="file" 
        id="stl-file-uploader-hidden" 
        onChange={handleSTLFileUpload} 
        accept=".stl" 
        className="hidden" 
      />

    </div>
  );
};
