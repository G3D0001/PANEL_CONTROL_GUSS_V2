import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  Image as ImageIcon,
  Copy,
  Sparkles,
  Sliders,
  CheckCircle,
  Undo,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Plus,
  Download,
  Eye,
  Edit3,
  X,
  Upload,
  Info,
  Wand2,
  Tag,
  MessageSquare,
  Bookmark,
  Building2,
  Bot,
  RotateCcw,
  FileText,
  ArrowLeft,
  Check,
  Smartphone,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Scissors,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Definición de Interfaces para la Galería de Prompts
export interface PromptField {
  id: string;
  label: string; // ej. "Título Principal", "Precio", "WhatsApp"
  value: string;
  isEditable: boolean;
}

export interface PromptImage {
  id: string;
  url: string; // Base64 o URL
  name: string; // Nombre asignado que identifica su función (ej: "Tu Logo", "Ejemplo Estilo Neón")
}

export interface AIRoleInstruction {
  id: string;
  name: string; // Nombre amigable para mostrar en desplegable
  text: string; // Contenido completo de la instrucción de actuación
}

export interface BannerPromptItem {
  id: string;
  title: string;
  category: string;
  socialNetwork?: string; // Red Social / Formato de Destino (ej: "Instagram Feed 1:1", "Instagram Story 9:16", etc.)
  description: string;
  editableDetailsNote: string; // Detalles de lo que es editable vs no editable
  aiRoleTitle: string; // Nombre amigable del rol de IA
  aiRoleInstruction: string; // Texto de actuación del rol de IA
  styleReferenceInstruction: string; // Instrucción de referencia de estilo visual al final
  fields: PromptField[];
  images: PromptImage[]; // Imágenes con sus nombres/funciones asociadas
  created_at: string;
}

// Opciones de Redes Sociales y Formatos de Imagen
export const SOCIAL_NETWORK_OPTIONS = [
  'Instagram Feed / Post (Cuadrado 1:1 - 1080x1080 px)',
  'Instagram Story / Reels / WhatsApp Status (Vertical 9:16 - 1080x1920 px)',
  'Facebook Post / Anuncio (Horizontal 1.91:1 - 1200x630 px)',
  'YouTube Thumbnail / Portada (Horizontal 16:9 - 1280x720 px)',
  'TikTok Video / Story (Vertical 9:16 - 1080x1920 px)',
  'Banner Web Horizontal / Encabezado (16:9 - 1920x1080 px)',
  'Flyer Impreso / Cuadrado Universal (1:1)'
];

// Roles de IA Predeterminados
const DEFAULT_AI_ROLES: AIRoleInstruction[] = [
  {
    id: 'role-senior-designer',
    name: 'Diseñador Gráfico Senior (Recomendado)',
    text: 'Actúa como un Diseñador Gráfico Profesional Senior de nivel agencia publicitaria. Tu objetivo es crear un banner / flyer publicitario comercial de alto impacto visual con composición pulida y jerarquía tipográfica impecable.'
  },
  {
    id: 'role-marketing-specialist',
    name: 'Especialista en Marketing Digital',
    text: 'Actúa como un Especialista en Marketing Digital y Diseñador Visual. Tu objetivo es crear una gráfica publicitaria enfocada en conversión directa para redes sociales, maximizando el contraste y la llamada a la acción.'
  },
  {
    id: 'role-tech-minimalist',
    name: 'Diseñador Minimalista Tech & 3D',
    text: 'Actúa como un Diseñador Gráfico Minimalista especializado en tecnología e ingeniería 3D. Tu objetivo es crear un flyer limpio, elegante y de vanguardia con fondo oscuro y detalles técnicos sutiles.'
  }
];

// Instrucción de Referencia Estándar por Defecto
const DEFAULT_STYLE_REFERENCE_INSTRUCTION = 
  'Toma como referencia absoluta el estilo visual, paleta de colores, tipografías, composición y estética general del banner/flyer adjunto en las imágenes de ejemplo. Todo debe tomarse como guía de diseño visual a excepción del contenido textual explícito, el cual debe ser reemplazado exactamente por los datos proporcionados en los campos de texto.';

// Categorías Iniciales Predeterminadas (Vacías para sincronización con Supabase)
const INITIAL_CATEGORIES: string[] = [];

// Función de Normalización de Imágenes para Retrocompatibilidad
const normalizePromptImages = (rawImages: any[]): PromptImage[] => {
  if (!rawImages) return [];
  return rawImages.map((img, idx) => {
    if (typeof img === 'string') {
      return {
        id: `img-${idx}-${Date.now()}`,
        url: img,
        name: idx === 0 ? 'Imagen de Referencia Estilo' : `Elemento Adjunto ${idx + 1}`
      };
    }
    return {
      id: img.id || `img-${idx}-${Date.now()}`,
      url: img.url || '',
      name: img.name || `Imagen ${idx + 1}`
    };
  });
};

// Prompts Iniciales Predefinidos
const INITIAL_PROMPTS: BannerPromptItem[] = [];

// Corrector de Ortografía y Formato Exhaustivo
export const correctSpellingAndFormatting = (text: string): string => {
  if (!text) return '';

  let lines = text.split('\n');

  lines = lines.map(line => {
    let trimmed = line.trim();
    if (!trimmed) return '';

    // Múltiples espacios
    trimmed = trimmed.replace(/\s+/g, ' ');

    // 1. Frases complejas, ubicaciones y modismos
    trimmed = trimmed
      .replace(/\barmamos tu jarro a tu gu\b/gi, 'armamos tu jarro a tu gusto')
      .replace(/\bsantiago del estero\b/gi, 'Santiago del Estero')
      .replace(/\bbuenos aires\b/gi, 'Buenos Aires')
      .replace(/\bcordoba\b/gi, 'Córdoba')
      .replace(/\benvios a todo el pais\b/gi, 'Envíos a todo el país')
      .replace(/\benvios a domicilio\b/gi, 'Envíos a domicilio')
      .replace(/\bsin interes\b/gi, 'sin interés')
      .replace(/\bmercado\s*pago\b/gi, 'Mercado Pago');

    // 2. Errores fonéticos y ortográficos comunes (k/qu, v/b, c/s/z, faltas de tilde)
    trimmed = trimmed
      .replace(/\bcualkier\b/gi, 'cualquier')
      .replace(/\bcualkiera\b/gi, 'cualquiera')
      .replace(/\bvevida\b/gi, 'bebida')
      .replace(/\bvevidas\b/gi, 'bebidas')
      .replace(/\bespesial\b/gi, 'especial')
      .replace(/\bespesiales\b/gi, 'especiales')
      .replace(/\bkedar\b/gi, 'quedar')
      .replace(/\bke\b/gi, 'que')
      .replace(/\bk\b/gi, 'que')
      .replace(/\bq\b/gi, 'que')
      .replace(/\bimpresi\b/gi, 'impresión')
      .replace(/\bimpresion\b/gi, 'impresión')
      .replace(/\bpasion\b/gi, 'pasión')
      .replace(/\bpront\b/gi, 'Prompt')
      .replace(/\bprons\b/gi, 'Prompts')
      .replace(/\bflayer\b/gi, 'Flyer')
      .replace(/\bflaier\b/gi, 'Flyer')
      .replace(/\bwsp\b/gi, 'WhatsApp')
      .replace(/\bwasap\b/gi, 'WhatsApp')
      .replace(/\bwhasap\b/gi, 'WhatsApp')
      .replace(/\bwatsap\b/gi, 'WhatsApp')
      .replace(/\bwhastapp\b/gi, 'WhatsApp')
      .replace(/\bcada 1\b/gi, 'cada uno')
      .replace(/\bcad 1\b/gi, 'cada uno')
      .replace(/\bcad\b/gi, 'cada')
      .replace(/\btitulo\b/gi, 'Título')
      .replace(/\btitulos\b/gi, 'Títulos')
      .replace(/\bsubtitulo\b/gi, 'Subtítulo')
      .replace(/\beslogan\b/gi, 'Eslogan')
      .replace(/\bdescripcion\b/gi, 'Descripción')
      .replace(/\badicionales\b/gi, 'Adicionales')
      .replace(/\btambien\b/gi, 'también')
      .replace(/\bmas\b/gi, 'más')
      .replace(/\benvio\b/gi, 'Envío')
      .replace(/\benvios\b/gi, 'Envíos')
      .replace(/\bgarantia\b/gi, 'Garantía')
      .replace(/\bedicion\b/gi, 'Edición')
      .replace(/\bpromocion\b/gi, 'Promoción')
      .replace(/\bpromociones\b/gi, 'Promociones')
      .replace(/\batencion\b/gi, 'Atención')
      .replace(/\bsolucion\b/gi, 'Solución')
      .replace(/\bsoluciones\b/gi, 'Soluciones')
      .replace(/\btecnologia\b/gi, 'Tecnología')
      .replace(/\btelefono\b/gi, 'Teléfono')
      .replace(/\bpagina\b/gi, 'Página')
      .replace(/\bcatalogo\b/gi, 'Catálogo')
      .replace(/\bdescuento\b/gi, 'Descuento')
      .replace(/\bgratis\b/gi, 'Gratis')
      .replace(/\boferta\b/gi, 'Oferta')
      .replace(/\bunidades\b/gi, 'Unidades')
      .replace(/\bdisponible\b/gi, 'Disponible')
      .replace(/\biptv\b/gi, 'IPTV')
      .replace(/\bg3d\b/gi, 'G3D')
      .replace(/\bsmart tv\b/gi, 'Smart TV')
      .replace(/\bfirestick\b/gi, 'Firestick')
      .replace(/\btv box\b/gi, 'TV Box')
      .replace(/\bdolares\b/gi, 'Dólares')
      .replace(/\bonline\b/gi, 'Online')
      .replace(/\bhd\b/gi, 'HD')
      .replace(/\b4k\b/gi, '4K');

    // 3. Reemplazo fonético de k -> qu antes de e, i
    trimmed = trimmed.replace(/\b(\w*)k([ei])(\w*)\b/gi, (match, p1, p2, p3) => {
      const lower = match.toLowerCase();
      if (lower === 'k' || lower === 'ok') return match;
      return p1 + 'qu' + p2 + p3;
    });

    // 4. Corrección de tildes en terminaciones -cion -> -ción, -sion -> -sión
    trimmed = trimmed.replace(/\b(\w+)cion\b/gi, '$1ción');
    trimmed = trimmed.replace(/\b(\w+)sion\b/gi, '$1sión');

    // 5. Formateo de precios numéricos (ej: $22000 -> $22.000, $20000 -> $20.000)
    trimmed = trimmed.replace(/(?<!\d)\b(\d{2,3})(\d{3})\b(?!\d)/g, '$1.$2');

    // 6. Espaciado tras signos de puntuación
    trimmed = trimmed
      .replace(/([.,:;!?])([^\s0-9"'])/g, '$1 $2')
      .replace(/\s+([.,:;!?])/g, '$1');

    // 7. Capitalizar primera letra de la frase
    if (/^[a-záéíóúñ]/i.test(trimmed)) {
      trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

    return trimmed;
  });

  return lines.join('\n');
};

export default function AppsView() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeApp, setActiveApp] = useState<'catalog' | 'prompt-gallery'>('catalog');

  // Modo del Prompt (Original u Optimizado con IA)
  const [promptMode, setPromptMode] = useState<'original' | 'optimized'>('original');

  // URL del Logo del Negocio o Perfil del usuario
  const userBusinessLogo = userProfile?.logo_url 
    || userProfile?.foto_perfil 
    || userProfile?.avatar_url 
    || userProfile?.datos_adicionales?.logo_url 
    || userProfile?.datos_adicionales?.logo
    || localStorage.getItem('g3d_business_logo') 
    || localStorage.getItem('g3d_system_logo');

  // Categorías Guardadas en localStorage (Inicia vacía para sincronizar con Supabase)
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      localStorage.removeItem('g3d_banner_categories');
      const saved = localStorage.getItem('aplicaciones_prompts_categorias_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error cargando categorías:", e);
    }
    return [];
  });

  // Guardar Categorías en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aplicaciones_prompts_categorias_v1', JSON.stringify(categories));
    } catch (e) {
      console.error("Error guardando categorías:", e);
    }
  }, [categories]);

  // Roles de IA Guardados en localStorage
  const [aiRoles, setAiRoles] = useState<AIRoleInstruction[]>(() => {
    try {
      const saved = localStorage.getItem('g3d_ai_role_instructions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error cargando roles de IA:", e);
    }
    return DEFAULT_AI_ROLES;
  });

  // Guardar Roles de IA
  useEffect(() => {
    try {
      localStorage.setItem('g3d_ai_role_instructions', JSON.stringify(aiRoles));
    } catch (e) {
      console.error("Error guardando roles de IA:", e);
    }
  }, [aiRoles]);

  // Lista de Prompts Guardados (Inicia vacía por defecto para sincronizar con Supabase)
  const [prompts, setPrompts] = useState<BannerPromptItem[]>(() => {
    try {
      // Limpiar versiones viejas con mocks si existieran
      localStorage.removeItem('g3d_banner_prompts');
      localStorage.removeItem('g3d_banner_prompts_v2');
      localStorage.removeItem('g3d_banner_prompts_v3');
      const saved = localStorage.getItem('aplicaciones_prompts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          images: normalizePromptImages(item.images),
          aiRoleTitle: item.aiRoleTitle || DEFAULT_AI_ROLES[0].name,
          aiRoleInstruction: item.aiRoleInstruction || DEFAULT_AI_ROLES[0].text,
          styleReferenceInstruction: item.styleReferenceInstruction || DEFAULT_STYLE_REFERENCE_INSTRUCTION
        }));
      }
    } catch (e) {
      console.error("Error al cargar prompts:", e);
    }
    return [];
  });

  // Guardar Prompts en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aplicaciones_prompts_v1', JSON.stringify(prompts));
    } catch (e) {
      console.error("Error guardando prompts:", e);
    }
  }, [prompts]);

  // Filtro y Selección de Prompt
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedPrompt, setSelectedPrompt] = useState<BannerPromptItem | null>(() => prompts.length > 0 ? prompts[0] : null);

  // Modal de Crear/Editar Prompt
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<BannerPromptItem | null>(null);

  // Modal de Visor de Imagen Fullscreen ("Ojito") con Soporte para Navegación por Galería
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    name: string;
    imagesList?: { url: string; name: string }[];
    currentIndex?: number;
  } | null>(null);

  // Modal de Opción de Formato de Descargar (PNG vs JPG)
  const [downloadModalTarget, setDownloadModalTarget] = useState<{ url: string; name: string } | null>(null);

  // Navegación en Visor de Imágenes (Anterior / Siguiente)
  const handlePrevImage = () => {
    if (!viewingImage || !viewingImage.imagesList || viewingImage.imagesList.length <= 1) return;
    const curr = viewingImage.currentIndex ?? 0;
    const newIdx = (curr - 1 + viewingImage.imagesList.length) % viewingImage.imagesList.length;
    const target = viewingImage.imagesList[newIdx];
    setViewingImage({
      ...target,
      imagesList: viewingImage.imagesList,
      currentIndex: newIdx
    });
  };

  const handleNextImage = () => {
    if (!viewingImage || !viewingImage.imagesList || viewingImage.imagesList.length <= 1) return;
    const curr = viewingImage.currentIndex ?? 0;
    const newIdx = (curr + 1) % viewingImage.imagesList.length;
    const target = viewingImage.imagesList[newIdx];
    setViewingImage({
      ...target,
      imagesList: viewingImage.imagesList,
      currentIndex: newIdx
    });
  };

  // Listener de Teclas ESC y Flechas Izquierda/Derecha para Navegación en Galería y Cierre
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingImage) setViewingImage(null);
        if (downloadModalTarget) setDownloadModalTarget(null);
      } else if (viewingImage && viewingImage.imagesList && viewingImage.imagesList.length > 1) {
        if (e.key === 'ArrowLeft') {
          const curr = viewingImage.currentIndex ?? 0;
          const newIdx = (curr - 1 + viewingImage.imagesList.length) % viewingImage.imagesList.length;
          const target = viewingImage.imagesList[newIdx];
          setViewingImage({
            ...target,
            imagesList: viewingImage.imagesList,
            currentIndex: newIdx
          });
        } else if (e.key === 'ArrowRight') {
          const curr = viewingImage.currentIndex ?? 0;
          const newIdx = (curr + 1) % viewingImage.imagesList.length;
          const target = viewingImage.imagesList[newIdx];
          setViewingImage({
            ...target,
            imagesList: viewingImage.imagesList,
            currentIndex: newIdx
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingImage, downloadModalTarget]);

  // Estado de Copiado de Prompt
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Estado para Modal de Aislador de Objetos y Eliminación de Fondo
  const [bgRemovalModalOpen, setBgRemovalModalOpen] = useState(false);
  const [bgRemovalImage, setBgRemovalImage] = useState<{ id?: string; url: string; name: string } | null>(null);
  const [bgObjectName, setBgObjectName] = useState<string>('');
  const [bgTolerance, setBgTolerance] = useState<number>(28);
  const [bgFeathering, setBgFeathering] = useState<boolean>(true);
  const [bgKeyColor, setBgKeyColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [bgProcessedUrl, setBgProcessedUrl] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);

  // Procesador de Canvas para Eliminación de Fondo
  const processBgRemoval = (
    imgUrl: string,
    keyColor: { r: number; g: number; b: number } | null,
    tolerance: number,
    feathering: boolean
  ) => {
    if (!imgUrl) return;
    setIsProcessingBg(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingBg(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Color a remover (Si no se hizo clic, toma la esquina superior izquierda)
        const keyR = keyColor ? keyColor.r : data[0];
        const keyG = keyColor ? keyColor.g : data[1];
        const keyB = keyColor ? keyColor.b : data[2];

        const maxDist = (tolerance / 100) * 441.67;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dist = Math.sqrt((r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2);

          if (dist < maxDist) {
            if (feathering && dist > maxDist * 0.65) {
              const alphaFactor = (dist - maxDist * 0.65) / (maxDist * 0.35);
              data[i + 3] = Math.round(255 * alphaFactor);
            } else {
              data[i + 3] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setBgProcessedUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error("Error procesando eliminación de fondo:", e);
        toast.error("No se pudo remover el fondo de esta imagen.");
      } finally {
        setIsProcessingBg(false);
      }
    };
    img.onerror = () => {
      setIsProcessingBg(false);
      toast.error("Error al cargar la imagen para procesar.");
    };
  };

  // Abrir Modal de Remoción de Fondo para cualquier imagen
  const handleOpenBgRemoval = (img: { id?: string; url: string; name: string }) => {
    setBgRemovalImage(img);
    setBgObjectName(img.name || 'Objeto Aislado');
    setBgTolerance(28);
    setBgFeathering(true);
    setBgKeyColor(null);
    setBgRemovalModalOpen(true);
    processBgRemoval(img.url, null, 28, true);
  };

  // Muestrear color del Canvas al hacer clic
  const handleCanvasClickToSampleColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const sampledColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    setBgKeyColor(sampledColor);
    if (bgRemovalImage) {
      processBgRemoval(bgRemovalImage.url, sampledColor, bgTolerance, bgFeathering);
      toast.info("Color de fondo muestreado para eliminación.");
    }
  };

  // Guardar Imagen Aislada en el Formulario del Prompt
  const handleSaveIsolatedImageToPrompt = () => {
    if (!bgProcessedUrl || !bgRemovalImage) return;

    const cleanName = bgObjectName.trim() || bgRemovalImage.name || 'Objeto Aislado';
    const updatedImg = {
      id: bgRemovalImage.id || `img-${Date.now()}`,
      url: bgProcessedUrl,
      name: `${cleanName} (Sin Fondo PNG)`
    };

    setFormImages(prev => {
      const exists = prev.some(i => i.id === bgRemovalImage.id);
      if (exists) {
        return prev.map(i => i.id === bgRemovalImage.id ? updatedImg : i);
      }
      return [...prev, updatedImg];
    });

    setBgRemovalModalOpen(false);
    toast.success(`¡"${cleanName}" aislado y guardado como recurso PNG transparente!`);
  };

  // Descargar PNG Transparente Aislado
  const handleDownloadIsolatedPng = () => {
    if (!bgProcessedUrl) return;
    const cleanName = (bgObjectName || 'Objeto_Aislado')
      .trim()
      .replace(/[^a-zA-Z0-9_ -]/g, '')
      .replace(/\s+/g, '_');

    const link = document.createElement('a');
    link.href = bgProcessedUrl;
    link.download = `${cleanName}_sin_fondo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Descargando PNG transparente en alta definición...");
  };

  // Formulario temporal para nuevo/edición
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0] || 'General');
  const [formSocialNetwork, setFormSocialNetwork] = useState(SOCIAL_NETWORK_OPTIONS[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showAiRoleDropdown, setShowAiRoleDropdown] = useState<boolean>(false);
  const [formDescription, setFormDescription] = useState('');
  const [formEditableNote, setFormEditableNote] = useState('');
  const [formFields, setFormFields] = useState<PromptField[]>([]);
  const [formImages, setFormImages] = useState<PromptImage[]>([]);
  const [formAiRoleTitle, setFormAiRoleTitle] = useState(DEFAULT_AI_ROLES[0].name);
  const [formAiRoleInstruction, setFormAiRoleInstruction] = useState(DEFAULT_AI_ROLES[0].text);
  const [formStyleReferenceInstruction, setFormStyleReferenceInstruction] = useState(DEFAULT_STYLE_REFERENCE_INSTRUCTION);

  // Abrir Modal para Crear Nuevo Prompt
  const handleOpenCreateModal = () => {
    setEditingPrompt(null);
    setFormTitle('');
    setFormCategory(categories[0] || 'General');
    setFormSocialNetwork(SOCIAL_NETWORK_OPTIONS[0]);
    setFormDescription('');
    setFormEditableNote('');
    setFormAiRoleTitle(aiRoles[0]?.name || DEFAULT_AI_ROLES[0].name);
    setFormAiRoleInstruction(aiRoles[0]?.text || DEFAULT_AI_ROLES[0].text);
    setFormStyleReferenceInstruction(DEFAULT_STYLE_REFERENCE_INSTRUCTION);
    setFormFields([
      { id: '1', label: 'Título Principal', value: '', isEditable: true },
      { id: '2', label: 'Subtítulo', value: '', isEditable: true },
      { id: '3', label: 'Eslogan', value: '', isEditable: true },
      { id: '4', label: 'Precio / Oferta', value: '', isEditable: true },
      { id: '5', label: 'Medio de Contacto', value: '', isEditable: true }
    ]);
    setFormImages([]);
    setShowEditModal(true);
  };

  // Abrir Modal para Editar Prompt
  const handleOpenEditModal = (item: BannerPromptItem) => {
    setEditingPrompt(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormSocialNetwork(item.socialNetwork || SOCIAL_NETWORK_OPTIONS[0]);
    setFormDescription(item.description);
    setFormEditableNote(item.editableDetailsNote);
    setFormAiRoleTitle(item.aiRoleTitle || aiRoles[0]?.name || DEFAULT_AI_ROLES[0].name);
    setFormAiRoleInstruction(item.aiRoleInstruction || aiRoles[0]?.text || DEFAULT_AI_ROLES[0].text);
    setFormStyleReferenceInstruction(item.styleReferenceInstruction || DEFAULT_STYLE_REFERENCE_INSTRUCTION);
    setFormFields(item.fields ? JSON.parse(JSON.stringify(item.fields)) : []);
    setFormImages(item.images ? normalizePromptImages(item.images) : []);
    setShowEditModal(true);
  };

  // Corrección ortográfica individual con toast
  const applyCorrection = (getter: string, setter: (val: string) => void, fieldName: string) => {
    const corrected = correctSpellingAndFormatting(getter);
    setter(corrected);
    toast.success(`Ortografía de ${fieldName} corregida.`);
  };

  // Cambio de Rol de IA seleccionado
  const handleAiRoleSelect = (roleName: string) => {
    setFormAiRoleTitle(roleName);
    const found = aiRoles.find(r => r.name === roleName);
    if (found) {
      setFormAiRoleInstruction(found.text);
    }
  };

  // Guardar nuevo Rol de IA reusable
  const handleSaveCustomRole = () => {
    if (!formAiRoleTitle.trim() || !formAiRoleInstruction.trim()) {
      toast.error("Por favor completa el nombre y la instrucción del rol.");
      return;
    }
    const exists = aiRoles.some(r => r.name.toLowerCase() === formAiRoleTitle.trim().toLowerCase());
    if (!exists) {
      const newRole: AIRoleInstruction = {
        id: `role-${Date.now()}`,
        name: formAiRoleTitle.trim(),
        text: formAiRoleInstruction.trim()
      };
      setAiRoles(prev => [...prev, newRole]);
      toast.success("Nuevo Rol de IA guardado en la lista reutilizable.");
    } else {
      toast.info("El rol de IA ya existe en la lista.");
    }
  };

  // Agregar un Campo Editable
  const handleAddField = () => {
    setFormFields(prev => [
      ...prev,
      { id: `field-${Date.now()}`, label: 'Nuevo Campo', value: '', isEditable: true }
    ]);
  };

  // Eliminar un Campo Editable
  const handleRemoveField = (id: string) => {
    setFormFields(prev => prev.filter(f => f.id !== id));
  };

  // Actualizar un Campo Editable
  const handleFieldChange = (id: string, key: 'label' | 'value' | 'isEditable', val: any) => {
    setFormFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  // Estado y funciones para reordenar campos (Drag & Drop y Flechas)
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formFields.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setFormFields(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStartField = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOverField = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIndex === null || draggedFieldIndex === index) return;
    setFormFields(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedFieldIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedFieldIndex(index);
  };

  const handleDragEndField = () => {
    setDraggedFieldIndex(null);
  };

  // Cargar Imagen de Referencia Local
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const defaultName = file.name ? file.name.split('.')[0] : `Imagen ${formImages.length + index + 1}`;
          const newImg = {
            id: `img-${Date.now()}-${index}`,
            url: reader.result as string,
            name: defaultName
          };
          setFormImages(prev => [...prev, newImg]);

          // Si es la última imagen cargada, ofrecer abrir el aislador de objetos / removedor de fondo
          if (index === files.length - 1) {
            handleOpenBgRemoval(newImg);
            toast.info("¿Deseas aislar un objeto o remover el fondo de esta imagen?");
          }
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success("Imagen de referencia agregada.");
  };

  // Actualizar el nombre de una imagen
  const handleImageNameChange = (id: string, newName: string) => {
    setFormImages(prev => prev.map(img => img.id === id ? { ...img, name: newName } : img));
  };

  // Guardar Prompt (Crear o Editar)
  const handleSavePrompt = () => {
    if (!formTitle.trim()) {
      toast.error("Por favor ingresa un título para el prompt.");
      return;
    }

    const cleanCategory = formCategory.trim();
    if (cleanCategory) {
      // Guardar categoría única si no existe
      const catExists = categories.some(c => c.toLowerCase() === cleanCategory.toLowerCase());
      if (!catExists) {
        setCategories(prev => [...prev, cleanCategory]);
      }
    }

    // Auto-guardar rol de IA en la lista reutilizable si es un rol nuevo con título e instrucción
    const cleanRoleTitle = formAiRoleTitle.trim();
    const cleanRoleInstruction = formAiRoleInstruction.trim();
    if (cleanRoleTitle && cleanRoleInstruction) {
      const roleExists = aiRoles.some(r => r.name.toLowerCase() === cleanRoleTitle.toLowerCase());
      if (!roleExists) {
        const newRole: AIRoleInstruction = {
          id: `role-${Date.now()}`,
          name: cleanRoleTitle,
          text: cleanRoleInstruction
        };
        setAiRoles(prev => [...prev, newRole]);
      }
    }

    const newItem: BannerPromptItem = {
      id: editingPrompt ? editingPrompt.id : `prompt-${Date.now()}`,
      title: formTitle,
      category: cleanCategory || 'General',
      socialNetwork: formSocialNetwork || SOCIAL_NETWORK_OPTIONS[0],
      description: formDescription,
      editableDetailsNote: formEditableNote,
      aiRoleTitle: formAiRoleTitle,
      aiRoleInstruction: formAiRoleInstruction,
      styleReferenceInstruction: formStyleReferenceInstruction,
      fields: formFields,
      images: formImages,
      created_at: editingPrompt ? editingPrompt.created_at : new Date().toISOString()
    };

    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === newItem.id ? newItem : p));
      toast.success("Prompt actualizado exitosamente.");
    } else {
      setPrompts(prev => [newItem, ...prev]);
      toast.success("Nuevo prompt guardado en la galería.");
    }

    setSelectedPrompt(newItem);
    setShowEditModal(false);
  };

  // Eliminar Prompt
  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Deseas eliminar este prompt de la galería?")) return;
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (selectedPrompt?.id === id) {
      const remaining = prompts.filter(p => p.id !== id);
      setSelectedPrompt(remaining.length > 0 ? remaining[0] : null);
    }
    toast.info("Prompt eliminado de la galería.");
  };

  // Generar el Texto del Prompt Final Ensamblado (Original)
  const generateCompiledPromptText = (item: BannerPromptItem) => {
    if (!item) return '';

    const cleanTitle = correctSpellingAndFormatting(item.title);
    const cleanDesc = correctSpellingAndFormatting(item.description || '');
    const cleanNote = correctSpellingAndFormatting(item.editableDetailsNote || '');

    let text = `--- INSTRUCCIÓN Y ROL DEL DISEÑADOR DE IA ---\n`;
    text += `${item.aiRoleInstruction || 'Actúa como un Diseñador Gráfico Profesional Senior de nivel agencia publicitaria.'}\n\n`;

    text += `--- CONCEPTO GENERAL Y TÍTULO DEL BANNER ---\n`;
    text += `• CONCEPTO: "${cleanTitle}"\n`;
    if (cleanDesc) text += `• DESCRIPCIÓN: ${cleanDesc}\n`;
    text += `\n`;

    text += `--- RED SOCIAL DESTINO Y FORMATO DE IMAGEN ---\n`;
    text += `• FORMATO / RED SOCIAL: ${item.socialNetwork || SOCIAL_NETWORK_OPTIONS[0]}\n`;
    text += `• ESPECIFICACIÓN TÉCNICA: Adaptar el diseño, composición visual, márgenes de seguridad y relación de aspecto para publicar en ${item.socialNetwork || 'la red social especificada'}.\n\n`;

    if (cleanNote) {
      text += `--- REGLAS DE ADAPTACIÓN Y ELEMENTOS EDITABLES ---\n`;
      text += `${cleanNote}\n\n`;
    }

    text += `--- CONTENIDO Y TEXTOS A INCLUIR EN EL BANNER ---\n`;
    item.fields.forEach(f => {
      const cleanLabel = correctSpellingAndFormatting(f.label).toUpperCase();
      const cleanVal = correctSpellingAndFormatting(f.value);
      if (cleanVal.trim()) {
        text += `• ${cleanLabel}: "${cleanVal}"\n`;
      }
    });
    text += `\n`;

    if (item.images && item.images.length > 0) {
      text += `--- IMÁGENES DE REFERENCIA Y SUS FUNCIONES ---\n`;
      item.images.forEach((img, idx) => {
        const name = correctSpellingAndFormatting(img.name || `Imagen de Referencia ${idx + 1}`);
        text += `• RECURSO [${name.toUpperCase()}]: Utilizar como guía/referencia específica para "${name}". Extraer producto, isotipo o estructura visual manteniendo fidelidad de marca.\n`;
      });
      text += `\n`;
    }

    text += `--- INSTRUCCIÓN DE REFERENCIA Y ESTILO VISUAL ---\n`;
    text += `${item.styleReferenceInstruction || DEFAULT_STYLE_REFERENCE_INSTRUCTION}\n\n`;

    text += `Requisitos de Salida: Formato Ultra HD, composición profesional limpia, máximo contraste y legibilidad adaptada a ${item.socialNetwork || 'redes sociales'}.`;
    return text;
  };

  // Generar el Texto del Prompt Optimizado Profesional con IA
  const generateOptimizedPromptText = (item: BannerPromptItem) => {
    if (!item) return '';

    const cleanTitle = correctSpellingAndFormatting(item.title);
    const cleanDesc = correctSpellingAndFormatting(item.description || '');
    const cleanNote = correctSpellingAndFormatting(item.editableDetailsNote || '');

    let text = `--- INSTRUCCIÓN DE IA Y ROL DE ALTO NIVEL (OPTIMIZADO CON IA) ---\n`;
    text += `${item.aiRoleInstruction || 'Actúa como un Diseñador Gráfico Profesional Senior de nivel agencia publicitaria internacional.'}\n`;
    text += `Especialidad: Dirección de arte comercial, diseño publicitario de alto rendimiento y composición tipográfica de impacto visual sin faltas ortográficas.\n\n`;

    text += `--- DIRECCIÓN DE ARTE Y CONCEPTO VISUAL ---\n`;
    text += `• CONCEPTO PRINCIPAL: "${cleanTitle}"\n`;
    if (cleanDesc) text += `• DESCRIPCIÓN Y OBJETIVO: ${cleanDesc}\n`;
    text += `• FORMATO Y RED SOCIAL DE DESTINO: ${item.socialNetwork || SOCIAL_NETWORK_OPTIONS[0]} -> Optimizar el encuadre visual, escala tipográfica y distribución gráfica exactamente para las dimensiones y densidad de pantalla de dicho formato.\n`;
    text += `• ESTILO Y ATMÓSFERA: Renderizado Ultra-HD 8K, iluminación dramática con alto contraste, composición limpia basada en cuadrícula publicitaria, paleta de colores coherente y acabados profesionales de alto impacto.\n\n`;

    if (cleanNote) {
      text += `--- REGLAS ESTRUCTURALES DE ADAPTACIÓN ---\n`;
      text += `${cleanNote}\n`;
      text += `Garantizar legibilidad 100% clara en dispositivos móviles. Evitar saturaciones de texto o distorsiones tipográficas.\n\n`;
    }

    text += `--- CONTENIDO TEXTUAL EXACTO Y JERARQUÍA (FIDELIDAD TOTAL & CORRECCIÓN DE ERRORES) ---\n`;
    item.fields.forEach(f => {
      const cleanLabel = correctSpellingAndFormatting(f.label).toUpperCase();
      const cleanVal = correctSpellingAndFormatting(f.value);
      if (cleanVal.trim()) {
        text += `• [CAMPO ${cleanLabel}]: "${cleanVal}" -> Renderizar con tipografía de alto contraste, tamaño destacado e integración orgánica al diseño general.\n`;
      }
    });
    text += `\n`;

    if (item.images && item.images.length > 0) {
      text += `--- GUÍA EXPLÍCITA DE RECURSOS VISUALES Y ELEMENTOS ADJUNTOS ---\n`;
      text += `El usuario ha incluido ${item.images.length} recurso(s) de imagen con nombres y funciones específicas que DEBES tomar como referencia directa:\n`;
      item.images.forEach((img, idx) => {
        const cleanImgName = correctSpellingAndFormatting(img.name || `Recurso ${idx + 1}`);
        text += `• RECURSO [${cleanImgName.toUpperCase()}]: Extraer la forma, isotipo, estilo 3D o composición de esta imagen para ubicarla en el diseño según su función ("${cleanImgName}"). Mantener la fidelidad exacta del producto o marca sin deformarlo.\n`;
      });
      text += `\n`;
    }

    text += `--- INSTRUCCIONES DE ESTILO VISUAL, RENDER Y ACABADO ---\n`;
    text += `${item.styleReferenceInstruction || DEFAULT_STYLE_REFERENCE_INSTRUCTION}\n`;
    text += `Técnica recomendada: Fotografía y gráfica comercial de alta calidad, sombras suaves y realistas, contraste cromático optimizado para conversión en ${item.socialNetwork || 'redes sociales'}.\n\n`;

    text += `Requisitos de Salida Técnica: Relación de aspecto optimizada para ${item.socialNetwork || 'redes sociales'}, nitidez quirúrgica en bordes de fuentes, sin artefactos borrosos ni faltas ortográficas.`;

    return text;
  };

  // Copiar Prompt al Portapapeles
  const handleCopyPrompt = (item: BannerPromptItem) => {
    const text = promptMode === 'optimized'
      ? generateOptimizedPromptText(item)
      : generateCompiledPromptText(item);
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success(promptMode === 'optimized' ? "¡Prompt optimizado con IA copiado al portapapeles!" : "¡Prompt original copiado al portapapeles!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Descargar e Convertir Imagen en PNG o JPG mediante Canvas
  const downloadImageConverted = (imgUrl: string, fileName: string, format: 'png' | 'jpg' = 'png') => {
    const cleanName = (fileName || 'Imagen_Referencia')
      .trim()
      .replace(/[^a-zA-Z0-9_ -]/g, '')
      .replace(/\s+/g, '_');

    toast.info(`Procesando descarga en formato ${format.toUpperCase()}...`);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          triggerDirectDownload(imgUrl, `${cleanName}.${format}`);
          return;
        }

        if (format === 'jpg') {
          // Fondo blanco sólido para JPG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpg' ? 0.92 : undefined;

        canvas.toBlob((blob) => {
          if (!blob) {
            triggerDirectDownload(imgUrl, `${cleanName}.${format}`);
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${cleanName}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          toast.success(`¡Imagen descargada como ${format.toUpperCase()} con éxito!`);
        }, mimeType, quality);
      } catch (err) {
        console.error("Error convirtiendo imagen en canvas:", err);
        triggerDirectDownload(imgUrl, `${cleanName}.${format}`);
      }
    };

    img.onerror = () => {
      triggerDirectDownload(imgUrl, `${cleanName}.${format}`);
    };

    img.src = imgUrl;
  };

  const triggerDirectDownload = (url: string, fileNameWithExt: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNameWithExt;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("¡Imagen descargada con éxito!");
  };

  // Abrir Modal de Formato de Descarga Directa
  const handleOpenDownloadModal = (imgUrl: string, fileName: string) => {
    setDownloadModalTarget({ url: imgUrl, name: fileName });
  };

  // Prompts Filtrados por Categoría
  const filteredPrompts = selectedCategory === 'TODOS'
    ? prompts
    : prompts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 font-sans">

      {/* HEADER PRINCIPAL */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              <LayoutGrid className="w-4.5 h-4.5" />
              <span>Panel de Control</span>
              <ChevronRight className="w-3 h-3" />
              <span>Aplicaciones</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Herramientas y Aplicaciones
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Diseña y gestiona tus prompts publicitarios con campos editables, corrección ortográfica e instrucciones reutilizables.
            </p>
          </div>

          {activeApp !== 'catalog' && (
            <button
              onClick={() => setActiveApp('catalog')}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 transition-all cursor-pointer shadow-sm"
              id="back-to-catalog-btn"
            >
              <Undo className="w-4 h-4" />
              Volver al Catálogo
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* VISTA 1: CATÁLOGO DE APLICACIONES */}
        {activeApp === 'catalog' && (
          <div className="space-y-8 animate-fade-in flex flex-col items-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 py-4 w-full max-w-4xl justify-center items-stretch">

              {/* BOTÓN LAUNCHPAD: SIMULADOR CHOP 3D */}
              <div className="relative flex flex-col justify-between py-1 h-full">
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/simulador')}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.4), 0 4px 10px -1px rgba(234, 88, 12, 0.35)'
                  }}
                  className="group relative flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-white/20 text-white cursor-pointer select-none transition-all duration-200 overflow-hidden aspect-square p-4 sm:p-5"
                  id="launchpad-chop-simulator"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                  <div className="flex items-center justify-center mb-2 sm:mb-3">
                    <span className="material-symbols-outlined text-4xl xs:text-5xl sm:text-6xl text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]">
                      3d_rotation
                    </span>
                  </div>

                  <div className="w-full text-center px-1">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-white leading-tight drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)] whitespace-normal break-words">
                      Simulador Chop 3D
                    </h3>
                  </div>
                </motion.div>

                <div className="absolute -bottom-1 left-[8%] right-[8%] h-2 bg-black/20 blur-[4px] rounded-full pointer-events-none" />
              </div>

              {/* BOTÓN LAUNCHPAD: GALERÍA DE PROMPTS PARA BANNERS */}
              <div className="relative flex flex-col justify-between py-1 h-full">
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveApp('prompt-gallery')}
                  style={{
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.4), 0 4px 10px -1px rgba(13, 148, 136, 0.35)'
                  }}
                  className="group relative flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-white/20 text-white cursor-pointer select-none transition-all duration-200 overflow-hidden aspect-square p-4 sm:p-5"
                  id="launchpad-prompt-gallery"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                  <div className="flex items-center justify-center mb-2 sm:mb-3">
                    <Sparkles className="w-10 h-10 xs:w-12 sm:w-14 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" />
                  </div>

                  <div className="w-full text-center px-1">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-white leading-tight drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)] whitespace-normal break-words">
                      Galería de Prompts
                    </h3>
                  </div>
                </motion.div>

                <div className="absolute -bottom-1 left-[8%] right-[8%] h-2 bg-black/20 blur-[4px] rounded-full pointer-events-none" />
              </div>

            </div>

            <div className="max-w-md text-center bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Selecciona la Galería de Prompts para generar y personalizar tus banners publicitarios con etiquetas, categorías dinámicas y roles de IA.
              </p>
            </div>
          </div>
        )}

        {/* VISTA 2: GALERÍA DE PROMPTS Y CREADOR DE BANNERS */}
        {activeApp === 'prompt-gallery' && (
          <div className="space-y-6">

            {/* BARRA SUPERIOR DE ACCIONES Y FILTROS */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Categorías:</span>
                {['TODOS', ...categories].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                id="create-new-prompt-btn"
              >
                <Plus className="w-4 h-4" />
                Nuevo Prompt de Banner
              </button>
            </div>

            {/* CONTENIDO PRINCIPAL: GRILLA DE TARJETAS Y DETALLE DEL PROMPT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* COLUMNA IZQUIERDA: LISTA DE TARJETAS (5 COLUMNAS) */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  Prompts Guardados ({filteredPrompts.length})
                </h3>

                {filteredPrompts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No hay prompts en esta categoría. ¡Crea uno nuevo con el botón superior!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                    {filteredPrompts.map(item => {
                      const isSelected = selectedPrompt?.id === item.id;
                      const hasImage = item.images && item.images.length > 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedPrompt(item)}
                          className={`p-4 rounded-2xl ring-1 transition-all cursor-pointer relative group flex gap-3 ${
                            isSelected
                              ? 'bg-teal-500/5 ring-teal-500 dark:ring-teal-500/80 shadow-md'
                              : 'bg-white dark:bg-slate-900 ring-slate-200/60 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {/* Miniatura de imagen si existe */}
                          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                            {hasImage ? (
                              <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 pr-12 min-w-0">
                             <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-black uppercase">
                                {item.category}
                              </span>
                              {item.socialNetwork && (
                                <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 rounded text-[9px] font-bold truncate max-w-[150px]">
                                  {item.socialNetwork.split('(')[0].trim()}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {item.fields?.length || 0} campos
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </h4>

                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                              {item.description || 'Sin descripción'}
                            </p>
                          </div>

                          {/* Botones de Acción sobre la tarjeta */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }}
                              className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Editar Prompt"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeletePrompt(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                              title="Eliminar Prompt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: VISTA EN DETALLE DEL PROMPT SELECCIONADO (7 COLUMNAS) */}
              <div className="lg:col-span-7">
                {selectedPrompt ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200/60 dark:ring-slate-800 shadow-sm space-y-6">

                    {/* ENCABEZADO DEL PROMPT SELECCIONADO */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {selectedPrompt.category}
                          </span>
                          {selectedPrompt.socialNetwork && (
                            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold">
                              {selectedPrompt.socialNetwork}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            Rol: {selectedPrompt.aiRoleTitle || 'Diseñador Gráfico Senior'}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedPrompt.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {selectedPrompt.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(selectedPrompt)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>

                    {/* SECCIÓN DE NOTA SOBRE CAMPOS EDITABLES VS NO EDITABLES */}
                    {selectedPrompt.editableDetailsNote && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                          <Info className="w-4 h-4" />
                          <span>Detalles de Edición & Reglas de Estilo:</span>
                        </div>
                        <p className="text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                          {selectedPrompt.editableDetailsNote}
                        </p>
                      </div>
                    )}

                    {/* SECCIÓN DE CAMPOS CONFIGURADOS CON BOTÓN DE CORRECCIÓN ORTOGRÁFICA */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-teal-600" />
                        <span>Completar Campos del Banner</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedPrompt.fields.map(field => (
                          <div key={field.id} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                                {field.label}
                              </span>
                              <button
                                onClick={() => {
                                  const corrected = correctSpellingAndFormatting(field.value);
                                  const updatedFields = selectedPrompt.fields.map(f => f.id === field.id ? { ...f, value: corrected } : f);
                                  const updatedPrompt = { ...selectedPrompt, fields: updatedFields };
                                  setSelectedPrompt(updatedPrompt);
                                  setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
                                  toast.success(`Ortografía de ${field.label} corregida.`);
                                }}
                                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 rounded cursor-pointer"
                                title="Corregir ortografía de este campo"
                              >
                                <Wand2 className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => {
                                const updatedFields = selectedPrompt.fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f);
                                const updatedPrompt = { ...selectedPrompt, fields: updatedFields };
                                setSelectedPrompt(updatedPrompt);
                                setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                              placeholder={`Ingresar ${field.label}...`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECCIÓN DE IMÁGENES DE REFERENCIA CON ETIQUETAS Y NOMBRES */}
                    {(() => {
                      const currentGalleryImages = [
                        ...(userBusinessLogo ? [{ url: userBusinessLogo, name: 'Logo Oficial de tu Negocio' }] : []),
                        ...(selectedPrompt.images || []).map((img, i) => ({ url: img.url, name: img.name || `Imagen Referencia ${i + 1}` }))
                      ];

                      return (
                        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-teal-600" />
                              <span>Imágenes de Referencia Recomendadas</span>
                            </h4>
                            {userBusinessLogo && (
                              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Logo de Tu Negocio Activo
                              </span>
                            )}
                          </div>

                          {/* TARJETA DESTACADA DEL LOGO DEL NEGOCIO DEL USUARIO */}
                          {userBusinessLogo && (
                            <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/80 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  <img src={userBusinessLogo} alt="Logo de Tu Negocio" className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[9px] font-black uppercase tracking-wider">
                                      Tu Negocio
                                    </span>
                                    <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">Recurso de Marca</span>
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                    Logo Oficial de tu Negocio
                                  </h5>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Descárgalo o utilízalo como referencia visual para la IA al crear el banner.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => setViewingImage({ url: userBusinessLogo, name: 'Logo Oficial de tu Negocio', imagesList: currentGalleryImages, currentIndex: 0 })}
                                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-all"
                                  title="Ver logo en pantalla completa"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenDownloadModal(userBusinessLogo, 'Logo_De_Mi_Negocio')}
                                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer flex items-center gap-1 transition-all"
                                  title="Descargar Logo de tu Negocio"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Descargar Logo</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedPrompt.images && selectedPrompt.images.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {selectedPrompt.images.map((img, idx) => (
                                <div key={img.id || idx} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-2 space-y-1.5">
                                  <div className="group relative rounded-lg overflow-hidden aspect-video bg-slate-100 dark:bg-slate-950">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => setViewingImage({
                                          url: img.url,
                                          name: img.name || `Imagen Referencia ${idx + 1}`,
                                          imagesList: currentGalleryImages,
                                          currentIndex: (userBusinessLogo ? 1 : 0) + idx
                                        })}
                                        className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md cursor-pointer"
                                        title="Ver pantalla completa"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleOpenDownloadModal(img.url, img.name || `Referencia_${idx + 1}`)}
                                        className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow cursor-pointer"
                                        title="Descargar Imagen"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <Tag className="w-3 h-3 text-teal-500 flex-shrink-0" />
                                    <span className="truncate">{img.name || `Imagen ${idx + 1}`}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No hay imágenes adicionales de referencia cargadas para este prompt.</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* SECCIÓN DEL PROMPT FINAL ENSAMBLADO CON BOTÓN DE OPTIMIZADOR IA Y COPIAR 1-CLIC */}
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 border border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> Prompt Unificado para la IA
                        </span>

                        {/* CONTROL DEL OPTIMIZADOR DE PROMPTS DE IA */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setPromptMode('original');
                              toast.info("Mostrando Prompt Estándar Original.");
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              promptMode === 'original'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPromptMode('optimized');
                              toast.success("✨ ¡Prompt optimizado con IA para Midjourney / ChatGPT / Gemini!");
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                              promptMode === 'optimized'
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                                : 'text-teal-400 hover:text-teal-300'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Optimizado con IA</span>
                          </button>
                        </div>
                      </div>

                      {/* BANNER DE NOTIFICACIÓN DE ESTADO OPTIMIZADO */}
                      {promptMode === 'optimized' && (
                        <div className="bg-teal-950/60 border border-teal-800/80 p-2.5 rounded-lg flex items-center justify-between gap-2 text-[11px] text-teal-300 font-medium">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <span><strong>Modo Optimizado Activo:</strong> Rol senior enriquecido, composición 8K, iluminación e indicaciones de estilo para la IA.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPromptMode('original')}
                            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer transition-colors"
                            title="Restaurar a Prompt Original"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="bg-slate-950 p-3.5 rounded-lg font-mono text-xs leading-relaxed text-slate-200 max-h-[260px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800/80">
                        {promptMode === 'optimized'
                          ? generateOptimizedPromptText(selectedPrompt)
                          : generateCompiledPromptText(selectedPrompt)}
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(selectedPrompt)}
                        className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                          copiedId
                            ? 'bg-emerald-600 text-white'
                            : promptMode === 'optimized'
                              ? 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950'
                              : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                        }`}
                        id="copy-prompt-final-btn"
                      >
                        {copiedId ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>¡Prompt Copiado con Éxito!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{promptMode === 'optimized' ? 'Copiar Prompt Optimizado con IA (1-Clic)' : 'Copiar Prompt Unificado (1-Clic)'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    Selecciona un prompt de la izquierda para ver su contenido, imágenes y copiar sus instrucciones.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* MODAL PARA CREAR O EDITAR PROMPT */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>{editingPrompt ? 'Editar Prompt de Banner' : 'Crear Nuevo Prompt de Banner'}</span>
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* TÍTULO Y CORRECCIÓN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Título del Banner / Prompt</label>
                  <button
                    onClick={() => applyCorrection(formTitle, setFormTitle, 'Título')}
                    className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Wand2 className="w-3 h-3" /> Corregir Ortografía
                  </button>
                </div>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold"
                  placeholder="Ej: Flyer Promo IPTV 4K Neón"
                />
              </div>

              {/* CATEGORÍA EDICIÓN Y SELECCIÓN UNIFICADA (COMBOBOX) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => applyCorrection(formCategory, setFormCategory, 'Categoría')}
                      className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Wand2 className="w-3 h-3" /> Corregir Ortografía
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formCategory}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Escribir o seleccionar categoría..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(prev => !prev)}
                      className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
                      title="Ver categorías guardadas"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* DESPLEGABLE CON LAS CATEGORÍAS GUARDADAS Y PREDICCIÓN */}
                  {showCategoryDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      {categories
                        .filter(c => c.toLowerCase().includes(formCategory.toLowerCase().trim()))
                        .map(cat => (
                          <div
                            key={cat}
                            onClick={() => {
                              setFormCategory(cat);
                              setShowCategoryDropdown(false);
                            }}
                            className={`px-3 py-2 cursor-pointer font-semibold flex items-center justify-between hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 transition-colors ${
                              formCategory.toLowerCase() === cat.toLowerCase()
                                ? 'bg-teal-50/80 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-bold'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span>{cat}</span>
                            {formCategory.toLowerCase() === cat.toLowerCase() && (
                              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                            )}
                          </div>
                        ))}

                      {categories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase().trim())).length === 0 && (
                        <div className="px-3 py-2 text-slate-400 italic text-[11px]">
                          Sin coincidencias. "{formCategory}" se guardará como nueva categoría al guardar.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Descripción Breve</label>
                    <button
                      onClick={() => applyCorrection(formDescription, setFormDescription, 'Descripción')}
                      className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Wand2 className="w-3 h-3" /> Corregir
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100"
                    placeholder="Ej: Estilo cine con resplandor neón..."
                  />
                </div>
              </div>

              {/* RED SOCIAL Y FORMATO DE DESTINO DE LA IMAGEN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span>Red Social y Formato de Imagen de Destino</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Define aspecto y tamaño para la IA</span>
                </div>
                <select
                  value={formSocialNetwork}
                  onChange={(e) => setFormSocialNetwork(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  {SOCIAL_NETWORK_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECCIÓN DE ROL DE IA REUTILIZABLE (UNIFICADA - COMBOBOX) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    <span>Instrucción Inicial de IA / Rol de Actuación</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveCustomRole}
                    className="px-2 py-1 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-teal-200 transition-colors"
                  >
                    <Bookmark className="w-3 h-3" /> Guardar este Rol
                  </button>
                </div>

                {/* COMBINACIÓN UNIFICADA: ENTRADA Y DESPLEGABLE */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-extrabold text-slate-400">Nombre del Rol</span>
                    <button
                      type="button"
                      onClick={() => applyCorrection(formAiRoleTitle, setFormAiRoleTitle, 'Nombre de Rol')}
                      className="text-slate-400 hover:text-teal-600 text-[10px] flex items-center gap-0.5 cursor-pointer font-semibold"
                    >
                      <Wand2 className="w-2.5 h-2.5" /> Corregir
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formAiRoleTitle}
                      onFocus={() => setShowAiRoleDropdown(true)}
                      onChange={(e) => {
                        setFormAiRoleTitle(e.target.value);
                        setShowAiRoleDropdown(true);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Escribir o seleccionar rol reutilizable..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiRoleDropdown(prev => !prev)}
                      className="absolute right-1.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="Ver roles guardados"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAiRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* DESPLEGABLE CON ROLES GUARDADOS */}
                  {showAiRoleDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      {aiRoles
                        .filter(r => r.name.toLowerCase().includes(formAiRoleTitle.toLowerCase().trim()))
                        .map(r => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setFormAiRoleTitle(r.name);
                              setFormAiRoleInstruction(r.text);
                              setShowAiRoleDropdown(false);
                            }}
                            className={`px-3 py-2 cursor-pointer font-semibold flex items-center justify-between hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 transition-colors ${
                              formAiRoleTitle.toLowerCase() === r.name.toLowerCase()
                                ? 'bg-teal-50/80 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-bold'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className="truncate pr-2">{r.name}</span>
                            {formAiRoleTitle.toLowerCase() === r.name.toLowerCase() && (
                              <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            )}
                          </div>
                        ))}

                      {aiRoles.filter(r => r.name.toLowerCase().includes(formAiRoleTitle.toLowerCase().trim())).length === 0 && (
                        <div className="px-3 py-2 text-slate-400 italic text-[11px]">
                          Sin coincidencias. "{formAiRoleTitle}" se guardará como nuevo rol al guardar.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-extrabold text-slate-400">Texto Completo de la Instrucción de Actuación</span>
                    <button
                      type="button"
                      onClick={() => applyCorrection(formAiRoleInstruction, setFormAiRoleInstruction, 'Instrucción de Actuación')}
                      className="text-slate-400 hover:text-teal-600 text-[10px] flex items-center gap-0.5 cursor-pointer font-semibold"
                    >
                      <Wand2 className="w-2.5 h-2.5" /> Corregir
                    </button>
                  </div>
                  <textarea
                    value={formAiRoleInstruction}
                    onChange={(e) => setFormAiRoleInstruction(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs h-16 resize-none leading-relaxed"
                    placeholder="Instrucción detallada de cómo debe actuar la IA..."
                  />
                </div>
              </div>

              {/* DETALLES EDITABLE VS NO EDITABLE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Detalles de lo que es Editable vs No Editable</label>
                  <button
                    onClick={() => applyCorrection(formEditableNote, setFormEditableNote, 'Reglas Editables')}
                    className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Wand2 className="w-3 h-3" /> Corregir Ortografía
                  </button>
                </div>
                <textarea
                  value={formEditableNote}
                  onChange={(e) => setFormEditableNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 h-16 resize-none"
                  placeholder="Ej: Editable: Título, precios y WhatsApp. No Editable: Fondo oscuro y estilo tipográfico."
                />
              </div>

              {/* CAMPOS EDITABLES DEL FORMULARIO */}
              <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Campos de Texto del Banner</label>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">(Arrastra o usa las flechas para ordenar)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (formTitle) setFormTitle(correctSpellingAndFormatting(formTitle));
                        if (formDescription) setFormDescription(correctSpellingAndFormatting(formDescription));
                        if (formEditableNote) setFormEditableNote(correctSpellingAndFormatting(formEditableNote));
                        if (formStyleReferenceInstruction) setFormStyleReferenceInstruction(correctSpellingAndFormatting(formStyleReferenceInstruction));

                        setFormFields(prev => prev.map(f => ({
                          ...f,
                          label: correctSpellingAndFormatting(f.label),
                          value: correctSpellingAndFormatting(f.value)
                        })));

                        setFormImages(prev => prev.map(img => ({
                          ...img,
                          name: correctSpellingAndFormatting(img.name)
                        })));

                        toast.success("¡Ortografía de todos los campos e imágenes corregida!");
                      }}
                      className="px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-amber-300 dark:border-amber-800"
                      title="Corregir ortografía de todos los campos e imágenes a la vez"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Corregir Todos (+1 Clic)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-2.5 py-1 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Agregar Campo
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formFields.map((f, index) => (
                    <div
                      key={f.id}
                      draggable
                      onDragStart={() => handleDragStartField(index)}
                      onDragOver={(e) => handleDragOverField(e, index)}
                      onDragEnd={handleDragEndField}
                      className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border transition-all ${
                        draggedFieldIndex === index
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 opacity-70 shadow-lg scale-[1.01]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* CONTROLES DE REORDENAMIENTO: ARRASTRE Y FLECHAS */}
                      <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
                        <div
                          className="p-1 cursor-grab active:cursor-grabbing hover:text-teal-600 rounded"
                          title="Arrastrar para cambiar posición (subir/bajar)"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveField(index, 'up')}
                            className="p-0.5 text-slate-400 hover:text-teal-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formFields.length - 1}
                            onClick={() => handleMoveField(index, 'down')}
                            className="p-0.5 text-slate-400 hover:text-teal-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => handleFieldChange(f.id, 'label', e.target.value)}
                        className="w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
                        placeholder="Etiqueta (ej. Precio)"
                      />
                      <input
                        type="text"
                        value={f.value}
                        onChange={(e) => handleFieldChange(f.id, 'value', e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                        placeholder="Valor por defecto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const corrected = correctSpellingAndFormatting(f.value);
                          handleFieldChange(f.id, 'value', corrected);
                          toast.success(`Ortografía de ${f.label} corregida.`);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer"
                        title="Corregir valor"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(f.id)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Eliminar campo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARGA DE IMÁGENES DE REFERENCIA CON ETIQUETADO DE FUNCIÓN */}
              <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Imágenes de Ejemplo y Sus Funciones/Nombres</label>
                  {userBusinessLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        const exists = formImages.some(img => img.url === userBusinessLogo);
                        if (exists) {
                          toast.info("El logo de tu negocio ya está agregado en las imágenes.");
                          return;
                        }
                        setFormImages(prev => [
                          ...prev,
                          {
                            id: `user-logo-${Date.now()}`,
                            url: userBusinessLogo,
                            name: 'Tu Logo de Negocio'
                          }
                        ]);
                        toast.success("¡Logo de tu negocio añadido a las imágenes del prompt!");
                      }}
                      className="px-2.5 py-1 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir el logo de tu negocio automáticamente"
                    >
                      <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Añadir Mi Logo de Negocio (+1 clic)</span>
                    </button>
                  )}
                </div>

                <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-slate-500">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar imágenes desde tu PC o Móvil</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {formImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {formImages.map((img) => (
                      <div key={img.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Nombre / Función</span>
                          <input
                            type="text"
                            value={img.name}
                            onChange={(e) => handleImageNameChange(img.id, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
                            placeholder="ej. Tu Logo, Ejemplo Estilo..."
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenBgRemoval(img)}
                            className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                            title="Aislar objeto / Remover fondo de esta imagen"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormImages(prev => prev.filter(i => i.id !== img.id))}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Eliminar imagen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INSTRUCCIÓN DE REFERENCIA DE ESTILO FINAL */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Instrucción Final de Referencia Visual de Imágenes</label>
                  <button
                    onClick={() => applyCorrection(formStyleReferenceInstruction, setFormStyleReferenceInstruction, 'Instrucción de Referencia')}
                    className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Wand2 className="w-3 h-3" /> Corregir Ortografía
                  </button>
                </div>
                <textarea
                  value={formStyleReferenceInstruction}
                  onChange={(e) => setFormStyleReferenceInstruction(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 h-20 resize-none text-xs leading-relaxed"
                  placeholder="Instrucción de cómo debe tomar la referencia de imágenes..."
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Guardar Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE FORMATO DE DESCARGA DIRECTA (PNG / JPG) */}
      {downloadModalTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDownloadModalTarget(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    Opciones de Descarga Directa
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[220px]">
                    {downloadModalTarget.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDownloadModalTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Volver / Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MUESTRA PREVIA EN MINIATURA */}
            <div className="w-full h-32 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center">
              <img src={downloadModalTarget.url} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
              Selecciona el formato en el que deseas guardar el archivo en tu dispositivo:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  downloadImageConverted(downloadModalTarget.url, downloadModalTarget.name, 'png');
                  setDownloadModalTarget(null);
                }}
                className="p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span className="flex items-center gap-1.5 font-extrabold text-sm">
                  <Download className="w-4 h-4" /> Formato PNG
                </span>
                <span className="text-[10px] text-teal-100 font-normal">
                  Mantiene Transparencia / Sin Fondo
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadImageConverted(downloadModalTarget.url, downloadModalTarget.name, 'jpg');
                  setDownloadModalTarget(null);
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02] border border-slate-700"
              >
                <span className="flex items-center gap-1.5 font-extrabold text-sm">
                  <Download className="w-4 h-4" /> Formato JPG
                </span>
                <span className="text-[10px] text-slate-300 font-normal">
                  Fondo Blanco Comprimido
                </span>
              </button>
            </div>

            {/* BOTÓN PROMINENTE DE VOLVER / ATRÁS */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDownloadModalTarget(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver / Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX FULLSCREEN PARA VER IMAGEN CON BOTÓN VOLVER PROMINENTE, NAVEGACIÓN Y OPCIONES PNG/JPG */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)}
        >
          {/* BARRA SUPERIOR CON BOTÓN DE VOLVER ATRÁS, CONTADOR Y DESCARGA */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* BOTÓN PROMINENTE DE VOLVER ATRÁS */}
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Volver / Cerrar Vista Previa</span>
            </button>

            {/* TÍTULO DE LA IMAGEN Y CONTADOR DE GALERÍA */}
            <div className="hidden sm:flex flex-col items-center min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[200px] md:max-w-[350px]">
                {viewingImage.name || 'Vista Previa de Imagen'}
              </span>
              {viewingImage.imagesList && viewingImage.imagesList.length > 1 && (
                <span className="text-[10px] text-teal-400 font-extrabold tracking-wider">
                  Imagen {(viewingImage.currentIndex ?? 0) + 1} de {viewingImage.imagesList.length}
                </span>
              )}
            </div>

            {/* OPCIONES DE DESCARGA RÁPIDA DENTRO DE LA VISTA PREVIA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadImageConverted(viewingImage.url, viewingImage.name, 'png')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Descargar en formato PNG (Transparente)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => downloadImageConverted(viewingImage.url, viewingImage.name, 'jpg')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Descargar en formato JPG"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingImage;
                  setViewingImage(null);
                  handleOpenBgRemoval(target);
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white border border-teal-500 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                title="Aislar objeto o remover el fondo de esta imagen para dejarla transparente"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Aislar / Sin Fondo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CONTENEDOR CENTRAL DE LA IMAGEN CON FLECHAS FLOTANTES Y NAVEGACIÓN */}
          <div 
            className="relative flex-1 w-full flex items-center justify-center p-2 min-h-0 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* FLECHA IZQUIERDA (ANTERIOR) */}
            {viewingImage.imagesList && viewingImage.imagesList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 bg-slate-900/85 hover:bg-teal-600 text-white border border-slate-700/80 rounded-full shadow-2xl cursor-pointer transition-all hover:scale-110 z-30 flex items-center justify-center"
                title="Anterior (Flecha izquierda ←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={viewingImage.url} 
              alt={viewingImage.name || "Vista Previa"} 
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800/80 bg-slate-950/50 transition-all duration-200" 
            />

            {/* FLECHA DERECHA (SIGUIENTE) */}
            {viewingImage.imagesList && viewingImage.imagesList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-900/85 hover:bg-teal-600 text-white border border-slate-700/80 rounded-full shadow-2xl cursor-pointer transition-all hover:scale-110 z-30 flex items-center justify-center"
                title="Siguiente (Flecha derecha →)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* BARRA INFERIOR DE ACCIONES, ATAJOS Y RETORNO */}
          <div 
            className="w-full max-w-xl bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3 text-slate-300 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Navega con <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-[10px]">→</kbd> o presiona <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-[10px]">ESC</kbd> para salir.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la Lista</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REMOCIÓN DE FONDO Y AISLADOR DE OBJETOS */}
      {bgRemovalModalOpen && bgRemovalImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative space-y-4">
            {/* CABECERA CON TÍTULO Y BOTÓN DE CIERRE */}
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg">
                    Aislador de Objetos & Eliminación de Fondo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transforma tu elemento o logo en una imagen PNG transparente limpia sin deformaciones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBgRemovalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INPUT PARA ESPECIFICAR QUÉ OBJETO SE CONSERVA */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Objeto / Elemento a Conservar</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">(Toca la imagen para muestrear el color a borrar)</span>
              </label>
              <input
                type="text"
                value={bgObjectName}
                onChange={(e) => setBgObjectName(e.target.value)}
                placeholder="ej: Jarra Chop 3D, Logo G3D, Producto..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            {/* CANVAS INTERACTIVO CON FONDO TRANSPARENTE CON CUADRÍCULA */}
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 dark:bg-slate-950">
              {isProcessingBg && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-10 text-white font-bold text-xs gap-2">
                  <Sparkles className="w-5 h-5 animate-spin text-teal-400" />
                  <span>Removiendo fondo...</span>
                </div>
              )}

              {bgProcessedUrl ? (
                <canvas
                  ref={(canvas) => {
                    if (canvas && bgProcessedUrl) {
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) ctx.drawImage(img, 0, 0);
                      };
                      img.src = bgProcessedUrl;
                    }
                  }}
                  onClick={handleCanvasClickToSampleColor}
                  className="max-h-full max-w-full object-contain cursor-crosshair shadow-lg"
                  title="Haz clic sobre cualquier área del fondo para remover ese color específico"
                />
              ) : (
                <img src={bgRemovalImage.url} alt="" className="max-h-full max-w-full object-contain" />
              )}
            </div>

            {/* CONTROLES DE TOLERANCIA Y SUAVIZADO DE BORDES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Tolerancia de Fondo</span>
                  <span className="text-teal-600 dark:text-teal-400">{bgTolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={bgTolerance}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBgTolerance(val);
                    processBgRemoval(bgRemovalImage.url, bgKeyColor, val, bgFeathering);
                  }}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 font-bold text-slate-700 dark:text-slate-300">
                <span>Suavizado de Bordes</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !bgFeathering;
                    setBgFeathering(next);
                    processBgRemoval(bgRemovalImage.url, bgKeyColor, bgTolerance, next);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer transition-all border ${
                    bgFeathering
                      ? 'bg-teal-500 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {bgFeathering ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadIsolatedPng}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG Transparente</span>
              </button>

              <button
                type="button"
                onClick={handleSaveIsolatedImageToPrompt}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Guardar como Recurso en Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
