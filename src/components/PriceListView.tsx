import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Table, 
  LayoutGrid, 
  ArrowLeft, 
  Image as ImageIcon, 
  Package, 
  Info,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  Plus,
  X,
  Upload,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  FolderDown,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { CascadingCategorySelector } from './CascadingCategorySelector';
import { MultiImageManager } from './MultiImageManager';
import { parseImages, getProductImages, getProductMainImage, getDisplayImage } from '../utils/imageUtils';

const DEFAULT_CHOP_MODELS = [
  { id: 'chop-m-1', nombre: 'Silueta Clásica (Cuerpo Recto)', precio_minorista_offset: '0', precio_mayorista_offset: '0', imagen: '' },
  { id: 'chop-m-2', nombre: 'Silueta Facetada (Octogonal)', precio_minorista_offset: '500', precio_mayorista_offset: '400', imagen: '' },
  { id: 'chop-m-3', nombre: 'Silueta Vikinga (Abombada)', precio_minorista_offset: '800', precio_mayorista_offset: '600', imagen: '' }
];

const DEFAULT_CHOP_MOTIFS = [
  { id: 'chop-mo-1', nombre: 'Escudo Deportivo (Fútbol)', precio_minorista_offset: '0', precio_mayorista_offset: '0', imagen: '', colores: ['Boca Juniors', 'River Plate', 'Selección Argentina'] },
  { id: 'chop-mo-2', nombre: 'Logo Geek / Gamer', precio_minorista_offset: '200', precio_mayorista_offset: '150', imagen: '', colores: ['PlayStation', 'Xbox', 'Nintendo'] },
  { id: 'chop-mo-3', nombre: 'Cerveza y Oktoberfest', precio_minorista_offset: '100', precio_mayorista_offset: '80', imagen: '', colores: ['Classic Gold', 'Amber Ale', 'Stout Dark'] }
];

const DEFAULT_CHOP_COLORS = [
  { id: 'chop-c-1', nombre: 'Azul Eléctrico / Amarillo (Boca)', marca: 'Grilon3', hex: '#1e3a8a' },
  { id: 'chop-c-2', nombre: 'Rojo Carmín / Blanco (River)', marca: 'Esun', hex: '#b91c1c' },
  { id: 'chop-c-3', nombre: 'Celeste / Blanco (Argentina)', marca: 'Printalot', hex: '#0284c7' },
  { id: 'chop-c-4', nombre: 'Negro Mate / Oro Seda (Premium)', marca: 'Grilon3', hex: '#111827' }
];

const DEFAULT_CHOP_LITRAJES = [
  { id: 'chop-l-1', nombre: '0.5L (Chico / Individual)', factor: '1', precio_minorista_offset: '0', precio_mayorista_offset: '0' },
  { id: 'chop-l-2', nombre: '0.75L (Mediano / Recarga)', factor: '1.25', precio_minorista_offset: '800', precio_mayorista_offset: '600' },
  { id: 'chop-l-3', nombre: '1.0L (Familiar / Vikingo)', factor: '1.5', precio_minorista_offset: '1500', precio_mayorista_offset: '1200' }
];

export function PriceListView() {
  const navigate = useNavigate();
  const { session, hasPermission } = useAuth();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [categories, setCategories] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'marketplace' | 'table'>('marketplace');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});

  // New item form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState({
    nombre: '',
    precio: '',
    precio_mayorista: '',
    categoria: 'Impresión 3D',
    imagenes: [] as string[],
    customCategory: '',
    descripcion: '',
    archivo_link: ''
  });

  // Edit item form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    precio: '',
    precio_mayorista: '',
    categoria: 'Impresión 3D',
    imagenes: [] as string[],
    customCategory: '',
    descripcion: '',
    archivo_link: ''
  });
  const [editVariantes, setEditVariantes] = useState<any[]>([]);
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null);
  const [editingCreateVariantIdx, setEditingCreateVariantIdx] = useState<number | null>(null);
  const [newVariantNombre, setNewVariantNombre] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantPriceMayorista, setNewVariantPriceMayorista] = useState('');
  const [newVariantImages, setNewVariantImages] = useState<string[]>([]);
  const [newVariantLink, setNewVariantLink] = useState('');

  // Estados para el Personalizador 3D (FDM)
  const [editModalTab, setEditModalTab] = useState<'info' | 'customizer'>('info');
  const [createModalTab, setCreateModalTab] = useState<'info' | 'customizer'>('info');
  const [customizerEnabled, setCustomizerEnabled] = useState(false);
  const [customizerModels, setCustomizerModels] = useState<any[]>([]);
  const [customizerMotifs, setCustomizerMotifs] = useState<any[]>([]);
  const [customizerColors, setCustomizerColors] = useState<any[]>([]);
  const [customizerCapacities, setCustomizerCapacities] = useState<any[]>([]);
  const [activeMotifIdx, setActiveMotifIdx] = useState<number>(0);

  // Estados de edición interna de elementos del personalizador
  const [editingModelIdx, setEditingModelIdx] = useState<number | null>(null);
  const [editingMotifIdx, setEditingMotifIdx] = useState<number | null>(null);
  const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
  const [editingCapacityIdx, setEditingCapacityIdx] = useState<number | null>(null);
  const [editingMotifColorIdx, setEditingMotifColorIdx] = useState<number | null>(null);

  // Formularios de sub-elementos para el creador del personalizador
  const [modelForm, setModelForm] = useState({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '', imagen: '' });
  const [motifForm, setMotifForm] = useState({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '', imagen: '', colores: [] as any[] });
  const [colorForm, setColorForm] = useState({ nombre: '', color_hex: '#6366f1', imagen: '', imagenes: [] as string[] });
  const [motifColorForm, setMotifColorForm] = useState({ nombre: '', color_hex: '#6366f1', imagen: '', imagenes: [] as string[] });
  const [capacityForm, setCapacityForm] = useState({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '' });

  // Estados del selector interactivo de la Vista Previa (Armá tu producto)
  const [custStep, setCustStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedMotif, setSelectedMotif] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<any>(null);

  // Creación con Variantes
  const [createWithVariantes, setCreateWithVariantes] = useState(false);
  const [createVariantes, setCreateVariantes] = useState<any[]>([]);
  const [createVariantNombre, setCreateVariantNombre] = useState('');
  const [createVariantColor, setCreateVariantColor] = useState('');
  const [createVariantPrice, setCreateVariantPrice] = useState('');
  const [createVariantPriceMayorista, setCreateVariantPriceMayorista] = useState('');
  const [createVariantImages, setCreateVariantImages] = useState<string[]>([]);
  const [createVariantLink, setCreateVariantLink] = useState('');
  const [createVariantImgMode, setCreateVariantImgMode] = useState<'product' | 'own'>('product');
  const [editVariantImgMode, setEditVariantImgMode] = useState<'product' | 'own'>('product');

  // IA Mejorar Descripción
  const [improvingDescription, setImprovingDescription] = useState(false);

  // Vista Previa de Producto
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedPreviewVariant, setSelectedPreviewVariant] = useState<any>(null);
  const [activePreviewImgIdx, setActivePreviewImgIdx] = useState<number>(0);

  const handleOpenPreview = (product: any) => {
    setPreviewItem(product);
    setSelectedPreviewVariant(product.variantes && product.variantes.length > 0 ? product.variantes[0] : null);
    
    const cust = product.customizer || {};
    if (cust && cust.enabled) {
      const initialModel = cust.modelos?.[0] || null;
      const initialMotif = cust.motivos?.[0] || null;
      const motifColors = initialMotif?.colores || [];
      const initialColor = motifColors.length > 0 
        ? motifColors[0] 
        : (cust.colores?.[0] || null);

      setSelectedModel(initialModel);
      setSelectedMotif(initialMotif);
      setSelectedColor(initialColor);
      setSelectedCapacity(cust.litrajes?.[0] || null);
      setCustStep(0);
    } else {
      setSelectedModel(null);
      setSelectedMotif(null);
      setSelectedColor(null);
      setSelectedCapacity(null);
    }
    
    setActivePreviewImgIdx(0);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewItem(null);
    setSelectedPreviewVariant(null);
    setSelectedModel(null);
    setSelectedMotif(null);
    setSelectedColor(null);
    setSelectedCapacity(null);
    setActivePreviewImgIdx(0);
  };

  const handleSelectPreviewVariant = (v: any) => {
    setSelectedPreviewVariant(v);
    setActivePreviewImgIdx(0);
  };

  // Derived preview data based on selected variant or product base
  const isCustomizerActive = previewItem?.customizer?.enabled;

  const previewImages = isCustomizerActive
    ? (() => {
        // Lógica de cascada jerárquica: Color -> Motivo -> Modelo -> Imagen Base del Producto
        const colorImages = parseImages(selectedColor?.imagenes || selectedColor?.imagen);
        if (colorImages.length > 0) return colorImages;

        const motifImages = parseImages(selectedMotif?.imagenes || selectedMotif?.imagen);
        if (motifImages.length > 0) return motifImages;

        const modelImages = parseImages(selectedModel?.imagenes || selectedModel?.imagen);
        if (modelImages.length > 0) return modelImages;

        return getProductImages(previewItem);
      })()
    : (() => {
        if (selectedPreviewVariant) {
          const varImgs = getProductImages(selectedPreviewVariant);
          if (varImgs.length > 0) return varImgs;
        }
        return getProductImages(previewItem);
      })();

  const previewPrice = isCustomizerActive
    ? (previewItem?.precio || 0) +
      (selectedModel?.precio_minorista_offset ? parseFloat(selectedModel.precio_minorista_offset) || 0 : 0) +
      (selectedMotif?.precio_minorista_offset ? parseFloat(selectedMotif.precio_minorista_offset) || 0 : 0) +
      (selectedCapacity?.precio_minorista_offset ? parseFloat(selectedCapacity.precio_minorista_offset) || 0 : 0)
    : (selectedPreviewVariant && selectedPreviewVariant.precio > 0
        ? selectedPreviewVariant.precio
        : (previewItem ? previewItem.precio : 0));

  const previewWholesalePrice = isCustomizerActive
    ? (previewItem?.precio_mayorista || 0) +
      (selectedModel?.precio_mayorista_offset ? parseFloat(selectedModel.precio_mayorista_offset) || 0 : 0) +
      (selectedMotif?.precio_mayorista_offset ? parseFloat(selectedMotif.precio_mayorista_offset) || 0 : 0) +
      (selectedCapacity?.precio_mayorista_offset ? parseFloat(selectedCapacity.precio_mayorista_offset) || 0 : 0)
    : (selectedPreviewVariant && selectedPreviewVariant.precio_mayorista > 0
        ? selectedPreviewVariant.precio_mayorista
        : (previewItem ? previewItem.precio_mayorista : 0));

  const previewLink = selectedPreviewVariant && selectedPreviewVariant.archivo_link
    ? selectedPreviewVariant.archivo_link
    : (previewItem ? previewItem.archivo_link : '');

  const handleAutoCorrectField = (field: 'nombre' | 'descripcion', mode: 'create' | 'edit') => {
    const getValue = () => {
      if (mode === 'create') {
        return itemForm[field] || '';
      } else {
        return editForm[field] || '';
      }
    };

    const text = getValue().trim();
    if (!text) {
      toast.error("Por favor, ingresa algún texto primero.");
      return;
    }

    let result = '';
    if (field === 'nombre') {
      // Remover espacios múltiples
      let cleaned = text.replace(/\s+/g, ' ');
      // Primera letra mayúscula, el resto minúscula
      result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    } else {
      // Descripción
      // Remover espacios múltiples
      let cleaned = text.replace(/\s+/g, ' ');
      // Dividir por oraciones (. ! ?) y capitalizar la primera de cada una
      let sentences = cleaned.split(/([.!?]\s+)/);
      for (let i = 0; i < sentences.length; i += 2) {
        if (sentences[i]) {
          const trimmedSentence = sentences[i].trim();
          if (trimmedSentence) {
            sentences[i] = trimmedSentence.charAt(0).toUpperCase() + trimmedSentence.slice(1).toLowerCase();
          }
        }
      }
      result = sentences.join('');
      // Agregar punto final si no tiene signo de puntuación final
      if (result && !/[.!?]$/.test(result)) {
        result += '.';
      }
    }

    if (mode === 'create') {
      setItemForm(prev => ({ ...prev, [field]: result }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: result }));
    }
    toast.success("¡Ortografía y formato corregidos!");
  };

  const handleImproveDescription = async (mode: 'create' | 'edit') => {
    const name = mode === 'create' ? itemForm.nombre : editForm.nombre;
    const desc = mode === 'create' ? itemForm.descripcion : editForm.descripcion;

    if (!name.trim() && !desc.trim()) {
      toast.error("Ingresa al menos el nombre o una descripción inicial para mejorar.");
      return;
    }

    setImprovingDescription(true);
    try {
      const response = await fetch('/api/gemini/improve-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productName: name,
          description: desc
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con la API de IA');
      }

      const resData = await response.json();
      if (resData.success) {
        if (mode === 'create') {
          setItemForm(prev => ({ ...prev, descripcion: resData.improvedText }));
        } else {
          setEditForm(prev => ({ ...prev, descripcion: resData.improvedText }));
        }
        toast.success("¡Descripción mejorada con Inteligencia Artificial!");
      } else {
        toast.error("No se pudo mejorar la descripción con IA.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error al procesar el texto.");
    } finally {
      setImprovingDescription(false);
    }
  };

  const handleAddCreateVariantLocally = () => {
    if (!createVariantNombre.trim() && !createVariantColor.trim()) {
      toast.error("Por favor ingresa el nombre o el color de la variante.");
      return;
    }
    const varPrice = parseFloat(createVariantPrice) || 0;
    const varPriceMayorista = parseFloat(createVariantPriceMayorista) || 0;
    const combinacionVal = createVariantNombre.trim() || createVariantColor.trim();
    const newVar = {
      id: `new-create-var-${Date.now()}`,
      combinacion: combinacionVal,
      nombre: createVariantNombre.trim() || null,
      color: createVariantColor.trim() || null,
      precio: varPrice,
      precio_mayorista: varPriceMayorista,
      imagenes: createVariantImages,
      imagen: createVariantImages[0] || '',
      stock: 10,
      minimo_alerta: 2,
      archivo_link: createVariantLink.trim()
    };
    setCreateVariantes(prev => [...prev, newVar]);
    setCreateVariantNombre('');
    setCreateVariantColor('');
    setCreateVariantPrice('');
    setCreateVariantPriceMayorista('');
    setCreateVariantImages([]);
    setCreateVariantLink('');
    setCreateVariantImgMode('product');
  };

  const handleRemoveCreateVariantLocally = (idx: number) => {
    setCreateVariantes(prev => prev.filter((_, i) => i !== idx));
    if (editingCreateVariantIdx === idx) {
      setEditingCreateVariantIdx(null);
      setCreateVariantNombre('');
      setCreateVariantColor('');
      setCreateVariantPrice('');
      setCreateVariantPriceMayorista('');
      setCreateVariantImages([]);
      setCreateVariantLink('');
      setCreateVariantImgMode('product');
    } else if (editingCreateVariantIdx !== null && editingCreateVariantIdx > idx) {
      setEditingCreateVariantIdx(prev => prev !== null ? prev - 1 : null);
    }
  };

  const handleUpdateCreateVariantLocally = () => {
    if (editingCreateVariantIdx === null) return;
    if (!createVariantNombre.trim() && !createVariantColor.trim()) {
      toast.error("Por favor ingresa el nombre o el color de la variante.");
      return;
    }
    const varPrice = parseFloat(createVariantPrice) || 0;
    const varPriceMayorista = parseFloat(createVariantPriceMayorista) || 0;
    const combinacionVal = createVariantNombre.trim() || createVariantColor.trim();

    setCreateVariantes(prev => {
      const updated = [...prev];
      updated[editingCreateVariantIdx] = {
        ...updated[editingCreateVariantIdx],
        combinacion: combinacionVal,
        nombre: createVariantNombre.trim() || null,
        color: createVariantColor.trim() || null,
        precio: varPrice,
        precio_mayorista: varPriceMayorista,
        imagenes: createVariantImages,
        imagen: createVariantImages[0] || '',
        archivo_link: createVariantLink.trim()
      };
      return updated;
    });

    setEditingCreateVariantIdx(null);
    setCreateVariantNombre('');
    setCreateVariantColor('');
    setCreateVariantPrice('');
    setCreateVariantPriceMayorista('');
    setCreateVariantImages([]);
    setCreateVariantLink('');
    setCreateVariantImgMode('product');
  };

  const handleUpdateVariantLocally = () => {
    if (editingVariantIdx === null) return;
    if (!newVariantNombre.trim() && !newVariantColor.trim()) {
      toast.error("Por favor ingresa el nombre o el color de la variante.");
      return;
    }
    const varPrice = parseFloat(newVariantPrice) || 0;
    const varPriceMayorista = parseFloat(newVariantPriceMayorista) || 0;
    const combinacionVal = newVariantNombre.trim() || newVariantColor.trim();

    setEditVariantes(prev => {
      const updated = [...prev];
      updated[editingVariantIdx] = {
        ...updated[editingVariantIdx],
        combinacion: combinacionVal,
        nombre: newVariantNombre.trim() || null,
        color: newVariantColor.trim() || null,
        precio: varPrice,
        precio_mayorista: varPriceMayorista,
        imagenes: newVariantImages,
        imagen: newVariantImages[0] || '',
        archivo_link: newVariantLink.trim()
      };
      return updated;
    });

    setEditingVariantIdx(null);
    setNewVariantNombre('');
    setNewVariantColor('');
    setNewVariantPrice('');
    setNewVariantPriceMayorista('');
    setNewVariantImages([]);
    setNewVariantLink('');
    setEditVariantImgMode('product');
  };

  useEffect(() => {
    loadProducts();
  }, [session]);

  const loadProducts = async () => {
    setLoading(true);
    
    // Fallback inicial ultra-rápido desde el caché local de localStorage
    let cachedProductsLoaded = false;
    try {
      const cachedProds = localStorage.getItem('g3d_productos_cache');
      const cachedCats = localStorage.getItem('g3d_categories_cache');
      const cachedDbCats = localStorage.getItem('g3d_db_categories_cache');
      
      if (cachedProds) {
        const parsedProds = JSON.parse(cachedProds);
        if (Array.isArray(parsedProds) && parsedProds.length > 0) {
          // Aseguramos que inicialmente se marquen como is_synced: false para representar el estado de caché
          const cachedWithFlag = parsedProds.map(p => ({ ...p, is_synced: false }));
          setProducts(cachedWithFlag);
          cachedProductsLoaded = true;
        }
      }
      if (cachedCats) {
        const parsedCats = JSON.parse(cachedCats);
        if (Array.isArray(parsedCats)) {
          setCategories(parsedCats);
        }
      }
      if (cachedDbCats) {
        const parsedDbCats = JSON.parse(cachedDbCats);
        if (Array.isArray(parsedDbCats)) {
          setDbCategories(parsedDbCats);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el caché local inicial:", e);
    }

    try {
      // Query productos real scale
      const { data: productos, error } = await supabase
        .from('g3d_productos')
        .select('*')
        .eq('publicado', true) // Solo mostrar publicados en la lista de precios
        .order('nombre', { ascending: true });

      if (error) throw error;

      const productIds = (productos || []).map(p => p.id);
      let variantes: any[] = [];
      if (productIds.length > 0) {
        const { data: varsData, error: varsError } = await supabase
          .from('g3d_producto_variantes')
          .select('*')
          .in('producto_id', productIds);
        if (!varsError && varsData) {
          variantes = varsData;
        }
      }

      let localExtras = {};
      try {
        localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      } catch (e) {
        console.error("Error al parsear g3d_productos_extras:", e);
      }

      const fullProducts = (productos || []).map(p => {
        const extra = (localExtras as any)[p.id] || {};
        const parsedProdImgs = getProductImages(p);
        const prodVariantes = (variantes?.filter(v => v.producto_id === p.id) || []).map((v: any) => {
          const parsedVarImgs = getProductImages(v);
          const varWholesales = extra.variantes_mayoristas || {};
          const varWholesale = varWholesales[v.combinacion] || 0;
          return {
            ...v,
            imagenes: parsedVarImgs,
            imagen: parsedVarImgs[0] || '',
            imagen_url: parsedVarImgs[0] || '',
            archivo_link: v.sku || '',
            precio_mayorista: varWholesale
          };
        });
        return {
          ...p,
          precio: p.precio_base || 0,
          precio_mayorista: extra.precio_mayorista || 0,
          categoria: p.categoria_texto || 'Impresión 3D',
          imagenes: parsedProdImgs,
          imagen: parsedProdImgs[0] || '',
          variantes: prodVariantes,
          archivo_link: p.instrucciones_internas || '',
          customizer: extra.customizer || null,
          is_synced: true // ¡Sincronizado con éxito con la base de datos!
        };
      });

      setProducts(fullProducts);

      const { data: catData } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (catData) {
        setDbCategories(catData);
      }

      // Extract unique categories
      const cats = Array.from(new Set(fullProducts.map(p => p.categoria))) as string[];
      setCategories(cats);

      // Guardar en caché para futuros accesos instantáneos y soporte offline
      try {
        localStorage.setItem('g3d_productos_cache', JSON.stringify(fullProducts));
        localStorage.setItem('g3d_categories_cache', JSON.stringify(cats));
        if (catData) {
          localStorage.setItem('g3d_db_categories_cache', JSON.stringify(catData));
        }
      } catch (cacheErr) {
        console.warn("No se pudo guardar la lista de precios en el caché local:", cacheErr);
      }

    } catch (err: any) {
      console.error("Error cargando lista de precios:", err);
      if (cachedProductsLoaded) {
        toast.info("Mostrando lista de precios local (Modo offline / Conexión inestable).");
      } else {
        toast.error("Error al sincronizar lista de precios con la nube: " + (err.message || err));
        setProducts([]);
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const compressOptionImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1080;
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
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          callback(compressedBase64);
          toast.success("Imagen de opción procesada con éxito.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const compressMultipleOptionImages = (files: FileList, callback: (base64List: string[]) => void) => {
    const fileList = Array.from(files);
    const targetCount = fileList.length;
    if (targetCount === 0) return;

    const results = new Array<string>(targetCount);
    let processedCount = 0;

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          const MAX_HEIGHT = 1080;
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
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            results[index] = compressedBase64;
          }
          processedCount++;
          if (processedCount === targetCount) {
            // Filter out any potential empty indices to be fully safe, keeping original selection order intact
            const finalResults = results.filter(Boolean);
            callback(finalResults);
            toast.success(`${finalResults.length} imágenes procesadas preservando el orden de selección.`);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using Canvas
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1080;
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
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85); // 85% high quality jpeg
          setItemForm(prev => ({ ...prev, imagen: compressedBase64 }));
          toast.success("Imagen de alta calidad procesada y comprimida localmente.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setEditForm(prev => ({ ...prev, imagen: compressedBase64 }));
          toast.success("Imagen de edición procesada.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.nombre.trim()) {
      toast.error("Por favor ingresa el nombre del producto.");
      return;
    }
    const precioNum = parseFloat(itemForm.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      toast.error("Por favor ingresa un precio minorista válido.");
      return;
    }

    const finalCategory = itemForm.categoria === 'Nueva' 
      ? itemForm.customCategory.trim() 
      : itemForm.categoria;

    if (!finalCategory) {
      toast.error("Por favor especifica una categoría.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        nombre: itemForm.nombre.trim(),
        precio_base: precioNum,
        categoria_texto: finalCategory,
        imagenes: itemForm.imagenes,
        publicado: true,
        stock_global: 10,
        minimo_alerta: 2,
        modalidad: 'inmediata',
        negocio_id: session?.user?.id || null,
        descripcion: (itemForm.descripcion || '').trim(),
        instrucciones_internas: (itemForm.archivo_link || '').trim()
      };

      const { data, error } = await supabase
        .from('g3d_productos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Save wholesale price to g3d_productos_extras
      const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      const varWholesales: Record<string, number> = {};
      createVariantes.forEach((v: any) => {
        if (v.precio_mayorista !== undefined) {
          varWholesales[v.combinacion] = parseFloat(v.precio_mayorista) || 0;
        }
      });
      localExtras[data.id] = {
        ...localExtras[data.id],
        precio_base: precioNum,
        precio_mayorista: parseFloat(itemForm.precio_mayorista) || 0,
        variantes_mayoristas: varWholesales
      };
      localStorage.setItem('g3d_productos_extras', JSON.stringify(localExtras));

      // Guardar variantes en la Base de Datos si corresponde
      let finalVariantesList: any[] = [];
      if (createWithVariantes && createVariantes.length > 0) {
        const varsToInsert = createVariantes.map((v: any) => {
          const vImgs = v.imagenes || (v.imagen ? [v.imagen] : []);
          return {
            producto_id: data.id,
            combinacion: v.combinacion || v.nombre || v.color || '',
            nombre: v.nombre || null,
            color: v.color || null,
            precio: parseFloat(v.precio) || 0,
            stock: v.stock || 10,
            minimo_alerta: v.minimo_alerta || 2,
            imagen: JSON.stringify(vImgs),
            imagen_idx: null,
            sku: (v.archivo_link || '').trim()
          };
        });

        const { data: insertedVars, error: varInsertError } = await supabase
          .from('g3d_producto_variantes')
          .insert(varsToInsert)
          .select();
        
        if (varInsertError) throw varInsertError;
        
        finalVariantesList = (insertedVars || []).map((v: any) => {
          const vImgs = getProductImages(v);
          const varWholesale = varWholesales[v.combinacion] || 0;
          return {
            ...v,
            imagenes: vImgs,
            imagen: vImgs[0] || '',
            imagen_url: vImgs[0] || '',
            archivo_link: v.sku || '',
            precio_mayorista: varWholesale
          };
        });
      }

      toast.success("¡Producto agregado a la lista de precios con éxito!");
      
      const createdProduct = {
        id: data.id,
        nombre: data.nombre,
        precio_base: data.precio_base,
        precio: data.precio_base || 0,
        precio_mayorista: parseFloat(itemForm.precio_mayorista) || 0,
        categoria_texto: data.categoria_texto,
        categoria: data.categoria_texto || 'Impresión 3D',
        imagenes: parseImages(data.imagenes || itemForm.imagenes),
        imagen: getProductMainImage({ imagenes: data.imagenes || itemForm.imagenes }),
        publicado: data.publicado,
        stock_global: data.stock_global,
        minimo_alerta: data.minimo_alerta,
        modalidad: data.modalidad,
        descripcion: data.descripcion || '',
        archivo_link: data.instrucciones_internas || '',
        variantes: finalVariantesList
      };

      setProducts(prev => [createdProduct, ...prev]);
      
      setCategories(prev => {
        if (!prev.includes(finalCategory)) {
          return [...prev, finalCategory];
        }
        return prev;
      });

      setItemForm({
        nombre: '',
        precio: '',
        precio_mayorista: '',
        categoria: 'Impresión 3D',
        imagenes: [] as string[],
        customCategory: '',
        descripcion: '',
        archivo_link: ''
      });
      setCreateWithVariantes(false);
      setCreateVariantes([]);
      setCreateVariantNombre('');
      setCreateVariantColor('');
      setCreateVariantPrice('');
      setCreateVariantImages([]);
      setCreateVariantLink('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("Error creando producto:", err);
      toast.error("Error al registrar el producto: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (product: any) => {
    setEditingItem(product);
    const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
    const extra = localExtras[product.id] || {};
    setEditForm({
      nombre: product.nombre,
      precio: String(product.precio_base || product.precio || 0),
      precio_mayorista: String(extra.precio_mayorista || product.precio_mayorista || 0),
      categoria: product.categoria || 'Impresión 3D',
      imagenes: product.imagenes || (product.imagen ? [product.imagen] : []),
      customCategory: '',
      descripcion: product.descripcion || '',
      archivo_link: product.archivo_link || product.instrucciones_internas || ''
    });
    setEditVariantes((product.variantes || []).map((v: any) => ({
      ...v,
      archivo_link: v.sku || v.archivo_link || '',
      precio_mayorista: v.precio_mayorista || 0
    })));
    
    // Cargar personalizador si existe
    const cust = extra.customizer || { enabled: false, modelos: [], motivos: [], colores: [], litrajes: [] };
    setCustomizerEnabled(cust.enabled || false);
    setCustomizerModels(cust.modelos || []);
    setCustomizerMotifs(cust.motivos || []);
    setCustomizerColors(cust.colores || []);
    setCustomizerCapacities(cust.litrajes || []);
    setActiveMotifIdx(0);
    setEditModalTab('info');

    setNewVariantNombre('');
    setNewVariantColor('');
    setNewVariantPrice('');
    setNewVariantPriceMayorista('');
    setNewVariantLink('');
    setIsEditModalOpen(true);
  };

  const handleAddVariantLocally = () => {
    if (!newVariantNombre.trim() && !newVariantColor.trim()) {
      toast.error("Por favor ingresa el nombre o el color de la variante.");
      return;
    }
    const varPrice = parseFloat(newVariantPrice) || 0;
    const varPriceMayorista = parseFloat(newVariantPriceMayorista) || 0;
    const combinacionVal = newVariantNombre.trim() || newVariantColor.trim();
    const newVar = {
      id: `new-var-${Date.now()}`,
      combinacion: combinacionVal,
      nombre: newVariantNombre.trim() || null,
      color: newVariantColor.trim() || null,
      precio: varPrice,
      precio_mayorista: varPriceMayorista,
      imagenes: newVariantImages,
      imagen: newVariantImages[0] || '',
      stock: 10,
      minimo_alerta: 2,
      archivo_link: newVariantLink.trim()
    };
    setEditVariantes(prev => [...prev, newVar]);
    setNewVariantNombre('');
    setNewVariantColor('');
    setNewVariantPrice('');
    setNewVariantPriceMayorista('');
    setNewVariantImages([]);
    setNewVariantLink('');
    setEditVariantImgMode('product');
  };

  const handleRemoveVariantLocally = (idx: number) => {
    setEditVariantes(prev => prev.filter((_, i) => i !== idx));
    if (editingVariantIdx === idx) {
      setEditingVariantIdx(null);
      setNewVariantNombre('');
      setNewVariantColor('');
      setNewVariantPrice('');
      setNewVariantPriceMayorista('');
      setNewVariantImages([]);
      setNewVariantLink('');
      setEditVariantImgMode('product');
    } else if (editingVariantIdx !== null && editingVariantIdx > idx) {
      setEditingVariantIdx(prev => prev !== null ? prev - 1 : null);
    }
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editForm.nombre.trim()) {
      toast.error("Por favor ingresa el nombre del producto.");
      return;
    }
    const precioNum = parseFloat(editForm.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      toast.error("Por favor ingresa un precio minorista válido.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update product in Supabase
      const payload: any = {
        nombre: editForm.nombre.trim(),
        precio_base: precioNum,
        categoria_texto: editForm.categoria,
        imagenes: editForm.imagenes,
        descripcion: (editForm.descripcion || '').trim(),
        instrucciones_internas: (editForm.archivo_link || '').trim()
      };

      const { error: updateError } = await supabase
        .from('g3d_productos')
        .update(payload)
        .eq('id', editingItem.id);

      if (updateError) throw updateError;

      // 2. Save wholesale price in local extras
      const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      const varWholesales: Record<string, number> = {};
      editVariantes.forEach((v: any) => {
        if (v.precio_mayorista !== undefined) {
          varWholesales[v.combinacion] = parseFloat(v.precio_mayorista) || 0;
        }
      });
      localExtras[editingItem.id] = {
        ...localExtras[editingItem.id],
        precio_base: precioNum,
        precio_mayorista: parseFloat(editForm.precio_mayorista) || 0,
        variantes_mayoristas: varWholesales,
        customizer: {
          enabled: customizerEnabled,
          modelos: customizerModels,
          motivos: customizerMotifs,
          colores: customizerColors,
          litrajes: customizerCapacities
        }
      };
      localStorage.setItem('g3d_productos_extras', JSON.stringify(localExtras));

      // 3. Update variants in DB (Delete all and insert new ones)
      await supabase.from('g3d_producto_variantes').delete().eq('producto_id', editingItem.id);

      const varsToInsert = editVariantes.map((v: any) => {
        const vImgs = v.imagenes || (v.imagen ? [v.imagen] : []);
        return {
          producto_id: editingItem.id,
          combinacion: v.combinacion || v.nombre || v.color || '',
          nombre: v.nombre || null,
          color: v.color || null,
          precio: parseFloat(v.precio) || 0,
          stock: v.stock || 10,
          minimo_alerta: v.minimo_alerta || 2,
          imagen: JSON.stringify(vImgs),
          imagen_idx: v.imagen_idx ?? null,
          sku: (v.archivo_link || '').trim()
        };
      });

      if (varsToInsert.length > 0) {
        const { error: varInsertError } = await supabase
          .from('g3d_producto_variantes')
          .insert(varsToInsert);
        if (varInsertError) throw varInsertError;
      }

      toast.success("¡Producto y variantes guardados exitosamente!");

      // Reload products list to reflect database changes perfectly
      await loadProducts();
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error("Error al guardar edición:", err);
      toast.error("Error al guardar cambios: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${name}" y todas sus variantes de la lista de precios de G3D? Esta acción no se puede deshacer y afectará a los catálogos en vivo.`);
    if (!confirmed) return;

    try {
      // Delete variants first due to foreign key relationships
      const { error: deleteVariantsError } = await supabase
        .from('g3d_producto_variantes')
        .delete()
        .eq('producto_id', id);

      if (deleteVariantsError) throw deleteVariantsError;

      // Then delete product
      const { error: deleteProductError } = await supabase
        .from('g3d_productos')
        .delete()
        .eq('id', id);

      if (deleteProductError) throw deleteProductError;

      // Clean up cache
      const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      if (localExtras[id]) {
        delete localExtras[id];
        localStorage.setItem('g3d_productos_extras', JSON.stringify(localExtras));
      }

      toast.success("¡Producto y variantes eliminados exitosamente!");
      await loadProducts();
    } catch (err: any) {
      console.error("Error al eliminar producto:", err);
      toast.error("Error al eliminar producto: " + err.message);
    }
  };

  // Helper to format currency like Facebook Marketplace ($ 35 000)
  const formatPriceMarketplace = (price: number) => {
    const formatted = Math.round(price)
      .toLocaleString('es-AR')
      .replace(/\./g, ' '); // Reemplazar puntos por espacios
    return `$ ${formatted}`;
  };

  // Find descendants for hierarchical categories
  const getAllDescendants = (categoryName: string): string[] => {
    const list: string[] = [categoryName];
    const findNodeAndAddChildren = (name: string) => {
      const cat = dbCategories.find(c => c.nombre.toLowerCase() === name.toLowerCase());
      if (cat) {
        const children = dbCategories.filter(c => c.parent_id === cat.id);
        children.forEach(child => {
          if (!list.map(l => l.toLowerCase()).includes(child.nombre.toLowerCase())) {
            list.push(child.nombre);
            findNodeAndAddChildren(child.nombre);
          }
        });
      }
    };
    findNodeAndAddChildren(categoryName);
    return list;
  };

  // Filtering & Sorting
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.categoria.toLowerCase().includes(searchQuery.toLowerCase());
      const activeCategories = selectedCategory === 'Todas' ? [] : getAllDescendants(selectedCategory);
      const matchesCategory = selectedCategory === 'Todas' || activeCategories.some(cat => p.categoria.toLowerCase() === cat.toLowerCase());
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'price-asc') {
        return a.precio - b.precio;
      } else if (sortBy === 'price-desc') {
        return b.precio - a.precio;
      }
      return 0;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      
      {/* Boton de Retorno e Identidad superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-white/5 shadow-sm mt-2 text-left">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/?menu=g3d')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm cursor-pointer"
            title="Volver a Inicio G3D"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                Consulta Comercial
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Lista de Precios Oficial
                {loading && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full animate-pulse">
                    <span className="size-1.5 border border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    Sincronizando...
                  </span>
                )}
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Explora el catálogo, consulta importes de reventa y comparte información de productos.</p>
          </div>
        </div>

        {/* Toggles de Vista & Botón Crear */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Toggles de Vista */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl justify-center">
            <button 
              onClick={() => setViewMode('marketplace')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'marketplace' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={14} />
              Marketplace
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Table size={14} />
              Tabla de Precios
            </button>
          </div>

          {/* Botones de Creación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Clear customizer first
                setCustomizerEnabled(false);
                setCustomizerModels([]);
                setCustomizerMotifs([]);
                setCustomizerColors([]);
                setCustomizerCapacities([]);
                setCreateModalTab('info');
                
                setItemForm({
                  nombre: '',
                  precio: '',
                  precio_mayorista: '',
                  categoria: 'Impresión 3D',
                  imagenes: [] as string[],
                  customCategory: '',
                  descripcion: '',
                  archivo_link: ''
                });
                setCreateWithVariantes(false);
                setCreateVariantes([]);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-850 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer border border-slate-200 dark:border-slate-850"
            >
              <Plus size={15} />
              Ítem Estándar
            </button>
            <button
              onClick={() => {
                // Pre-populate Jarro Chop Template
                setCustomizerEnabled(true);
                setCustomizerModels(DEFAULT_CHOP_MODELS);
                setCustomizerMotifs(DEFAULT_CHOP_MOTIFS);
                setCustomizerColors(DEFAULT_CHOP_COLORS);
                setCustomizerCapacities(DEFAULT_CHOP_LITRAJES);
                setCreateModalTab('info');
                
                setItemForm({
                  nombre: 'Jarra Chop 3D Personalizada',
                  precio: '4500',
                  precio_mayorista: '3500',
                  categoria: 'Jarras Choperas 3D',
                  imagenes: ['https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=600'],
                  customCategory: '',
                  descripcion: 'Espectacular jarra chopera 3D totalmente personalizada de nivel profesional. Elige tu silueta, el motivo/temática que prefieras, la combinación de colores de filamento que más te guste y el litraje deseado.',
                  archivo_link: ''
                });
                setCreateWithVariantes(true);
                // Pre-populate standard variants that correspond to colors
                setCreateVariantes([
                  { combinacion: 'Boca Juniors (Azul / Amarillo)', nombre: 'Boca Juniors', color: 'Azul / Amarillo', precio: 4500, precio_mayorista: 3500, imagenes: [], stock: 50, minimo_alerta: 5, archivo_link: '' },
                  { combinacion: 'River Plate (Rojo / Blanco)', nombre: 'River Plate', color: 'Rojo / Blanco', precio: 4500, precio_mayorista: 3500, imagenes: [], stock: 50, minimo_alerta: 5, archivo_link: '' },
                  { combinacion: 'Argentina (Celeste / Blanco)', nombre: 'Selección Argentina', color: 'Celeste / Blanco', precio: 4500, precio_mayorista: 3500, imagenes: [], stock: 50, minimo_alerta: 5, archivo_link: '' }
                ]);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:scale-102"
              title="Crear un ítem chopero con múltiples variantes y personalizador 3D habilitado de fábrica"
            >
              <Sparkles size={14} className="text-amber-200 animate-pulse" />
              Crear Jarro Chop 3D 🍺
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Categorías y Orden */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
        
        {/* Buscador */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por artículo, modelo o categoría..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Categoria */}
        <div className="w-full sm:w-64">
          <CascadingCategorySelector
            value={selectedCategory}
            onChange={(cat) => setSelectedCategory(cat)}
            showAllOption={true}
          />
        </div>

        {/* Orden */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="name">Alfabético (A-Z)</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Disclaimer de actualización */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 flex gap-2 text-amber-800 dark:text-amber-300 text-xs text-left">
        <Info className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" size={16} />
        <div>
          <span className="font-bold">Información de Lista de Precios:</span> Los valores aquí mostrados corresponden a los productos publicados activos en la Tienda G3D. Los precios de venta sugeridos pueden incluir variaciones de materiales o configuraciones.
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="size-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Precios en Vivo...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-8">
          <Package className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">No se encontraron artículos</p>
          <p className="text-xs text-slate-400 mt-1">Prueba modificando los filtros o ingresando un término de búsqueda alternativo.</p>
        </div>
      ) : (
        <>
          {/* MODO MARKETPLACE DE FACEBOOK */}
          {viewMode === 'marketplace' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {filteredProducts.map((p) => {
                const selectedVarId = selectedVariantMap[p.id];
                const selectedVar = p.variantes?.find((v: any) => v.id === selectedVarId);
                
                const displayName = selectedVar 
                  ? `${p.nombre} - ${selectedVar.nombre || selectedVar.color || selectedVar.combinacion}` 
                  : p.nombre;
                
                const displayImage = getDisplayImage(p, selectedVar);
                
                const displayPrice = selectedVar && selectedVar.precio > 0 
                  ? selectedVar.precio 
                  : p.precio;
                
                const displayWholesalePrice = selectedVar && selectedVar.precio_mayorista > 0 
                  ? selectedVar.precio_mayorista 
                  : p.precio_mayorista;

                const displayLink = selectedVar?.archivo_link || p.archivo_link;

                return (
                  <div 
                    key={p.id} 
                    onClick={() => handleOpenPreview(p)}
                    className="group flex flex-col bg-transparent overflow-hidden text-left relative cursor-pointer"
                  >
                    {/* Contenedor de Imagen 1:1 estilo Marketplace */}
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                      {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt={displayName} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x600/e2e8f0/64748b?text=G3D+Creative";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-2">
                          <ImageIcon size={32} />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Sin Foto</span>
                        </div>
                      )}

                      {/* Botón de Link de Modelo 3D */}
                      {displayLink && (
                        <a
                          href={displayLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 left-2 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer z-10 flex items-center justify-center"
                          title="Descargar Modelo 3D / Archivo"
                        >
                          <FolderDown size={13} />
                        </a>
                      )}
                      
                      {/* Botón de Edición flotante en la foto */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(p);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/95 dark:bg-slate-900/95 text-slate-750 dark:text-slate-250 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl shadow-md backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer z-10"
                        title="Editar Ítem y Variantes"
                      >
                        <Pencil size={13} />
                      </button>

                      {/* Botón de Eliminar flotante en la foto */}
                      {hasPermission('G3d.Catalogo.Eliminar') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p.id, p.nombre);
                          }}
                          className="absolute top-2 right-11 p-2 bg-white/95 dark:bg-slate-900/95 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl shadow-md backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer z-10 animate-in fade-in duration-100"
                          title="Eliminar Ítem del Catálogo"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* Badge de Categoría Discreto */}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-bold bg-black/60 text-white rounded-md backdrop-blur-md">
                        {p.categoria}
                      </span>

                      {/* Indicador de Estado de Sincronización (Caché vs Nube) */}
                      <div 
                        className={`absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black rounded-md backdrop-blur-md text-white shadow-sm transition-all duration-300 ${
                          p.is_synced 
                            ? 'bg-emerald-600/80' 
                            : 'bg-rose-600/80 animate-pulse'
                        }`}
                        title={p.is_synced ? 'Sincronizado con base de datos real' : 'Mostrando desde caché local (Offline)'}
                      >
                        <span className={`size-1 rounded-full ${p.is_synced ? 'bg-emerald-300' : 'bg-rose-300 animate-ping'}`} />
                        <span>{p.is_synced ? 'NUBE' : 'CACHÉ'}</span>
                      </div>
                    </div>

                    {/* Bloque de Textos debajo de la foto */}
                    <div className="mt-2.5 px-0.5 space-y-0.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Precios Minorista & Mayorista */}
                        <div className="flex flex-col gap-0.5">
                          <div className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            {formatPriceMarketplace(displayPrice)}
                            <span className="text-[9px] text-slate-400 font-bold ml-1.5 uppercase tracking-wider">Mino</span>
                          </div>
                          {displayWholesalePrice > 0 && hasPermission('G3d.PrecioMayorista.Ver') && (
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-tight leading-none mt-1">
                              {formatPriceMarketplace(displayWholesalePrice)}
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold ml-1 uppercase tracking-wider">Mayo</span>
                            </div>
                          )}
                        </div>
                        {/* Nombre del Producto */}
                        <div 
                          className="text-xs text-slate-800 dark:text-slate-350 font-semibold leading-tight line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 pt-1"
                          title={displayName}
                        >
                          {displayName}
                        </div>

                        {/* Selector de Variantes Interactivo */}
                        {p.variantes && p.variantes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                            {p.variantes.map((v: any) => {
                              const isSelected = selectedVariantMap[p.id] === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVariantMap(prev => ({
                                      ...prev,
                                      [p.id]: isSelected ? '' : v.id
                                    }));
                                  }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' 
                                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {v.color || v.nombre || v.combinacion}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Botón de Editar Explícito */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(p);
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-150 dark:border-slate-800/80 transition shadow-sm cursor-pointer"
                      >
                        <Pencil size={11} className="text-indigo-500" />
                        Editar Ítem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODO TABLA COMPACTA Y MODERNA */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 w-16 text-center">Foto</th>
                      <th className="p-4">Nombre del Producto</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-center">Variantes</th>
                      <th className="p-4 text-right">Precio Minorista</th>
                      {hasPermission('G3d.PrecioMayorista.Ver') && <th className="p-4 text-right">Precio Mayorista</th>}
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredProducts.map((p) => {
                      const selectedVarId = selectedVariantMap[p.id];
                      const selectedVar = p.variantes?.find((v: any) => v.id === selectedVarId);
                      
                      const displayName = selectedVar 
                        ? `${p.nombre} (${selectedVar.nombre || selectedVar.color || selectedVar.combinacion})` 
                        : p.nombre;
                      
                      const displayImage = getDisplayImage(p, selectedVar);
                      
                      const displayPrice = selectedVar && selectedVar.precio > 0 
                        ? selectedVar.precio 
                        : p.precio;
                      
                      const displayWholesalePrice = selectedVar && selectedVar.precio_mayorista > 0 
                        ? selectedVar.precio_mayorista 
                        : p.precio_mayorista;

                      const displayLink = selectedVar?.archivo_link || p.archivo_link;

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => handleOpenPreview(p)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        >
                          <td className="p-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 flex items-center justify-center mx-auto">
                              {displayImage ? (
                                <img 
                                  src={displayImage} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/150x150/e2e8f0/64748b?text=G3D";
                                  }}
                                />
                              ) : (
                                <ImageIcon size={16} className="text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-900 dark:text-white font-extrabold line-clamp-1">{displayName}</span>
                              <span 
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black rounded-md ${
                                  p.is_synced 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 animate-pulse'
                                }`}
                                title={p.is_synced ? 'Sincronizado con base de datos' : 'Mostrando desde caché local'}
                              >
                                <span className={`size-1 rounded-full ${p.is_synced ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                                {p.is_synced ? 'NUBE' : 'CACHÉ'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">ID: {p.id}</span>
                            
                            {/* Selector de Variantes Interactivo en Tabla */}
                            {p.variantes && p.variantes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.variantes.map((v: any) => {
                                  const isSelected = selectedVariantMap[p.id] === v.id;
                                  return (
                                    <button
                                      key={v.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVariantMap(prev => ({
                                          ...prev,
                                          [p.id]: isSelected ? '' : v.id
                                        }));
                                      }}
                                      className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider transition cursor-pointer ${
                                        isSelected 
                                          ? 'bg-indigo-600 text-white shadow-sm' 
                                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      {v.color || v.nombre || v.combinacion}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px]">
                              {p.categoria}
                            </span>
                          </td>
                          <td className="p-4 text-center text-slate-500">
                            {p.variantes && p.variantes.length > 0 ? (
                              <span className="text-indigo-600 dark:text-indigo-400">{p.variantes.length} Variantes</span>
                            ) : (
                              <span className="text-slate-400">Sin variantes</span>
                            )}
                          </td>
                          <td className="p-4 text-right text-slate-950 dark:text-white font-black text-sm">
                            {formatPriceMarketplace(displayPrice)}
                          </td>
                          {hasPermission('G3d.PrecioMayorista.Ver') && (
                            <td className="p-4 text-right text-amber-600 dark:text-amber-400 font-black text-sm">
                              {displayWholesalePrice > 0 ? formatPriceMarketplace(displayWholesalePrice) : '-'}
                            </td>
                          )}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {displayLink && (
                                <a
                                  href={displayLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Descargar Modelo 3D / Archivo"
                                >
                                  <FolderDown size={11} />
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(p);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Pencil size={11} className="text-indigo-500" />
                                Editar
                              </button>
                              {hasPermission('G3d.Catalogo.Eliminar') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduct(p.id, p.nombre);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 size={11} />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL PARA CREAR NUEVO ÍTEM DE LA LISTA DE PRECIOS */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Crear Nuevo Ítem
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCreateVariantIdx(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCreateItem}>
              <div className="p-5 space-y-4 text-left max-h-[60vh] overflow-y-auto">
                {/* Nombre */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Nombre del Producto *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoCorrectField('nombre', 'create')}
                      className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      ⚡ Corregir
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={itemForm.nombre}
                    onChange={(e) => setItemForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Soporte para Celular Universal"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Descripción del Producto
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAutoCorrectField('descripcion', 'create')}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-extrabold uppercase tracking-wider cursor-pointer"
                      >
                        ⚡ Corregir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImproveDescription('create')}
                        disabled={improvingDescription}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 font-extrabold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                      >
                        <Sparkles size={11} className={improvingDescription ? "animate-spin" : ""} />
                        {improvingDescription ? 'Mejorando...' : 'Mejorar con IA'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={itemForm.descripcion || ''}
                    onChange={(e) => setItemForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej. Material PLA, alta calidad, diseño personalizado..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Precios Minorista & Mayorista */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={itemForm.precio}
                      onChange={(e) => setItemForm(prev => ({ ...prev, precio: e.target.value }))}
                      placeholder="Ej. 1500"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Precio Mayorista ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={itemForm.precio_mayorista}
                      onChange={(e) => setItemForm(prev => ({ ...prev, precio_mayorista: e.target.value }))}
                      placeholder="Ej. 1200"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => setItemForm(prev => ({ 
                        ...prev, 
                        categoria: prev.categoria === 'Nueva' ? 'Impresión 3D' : 'Nueva' 
                      }))}
                      className="text-[10px] text-indigo-605 hover:underline font-black uppercase tracking-wider cursor-pointer"
                    >
                      {itemForm.categoria === 'Nueva' ? 'Seleccionar del Árbol' : '+ Crear Categoría'}
                    </button>
                  </div>
                  
                  {itemForm.categoria === 'Nueva' ? (
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mi Categoría Personalizada"
                      value={itemForm.customCategory}
                      onChange={(e) => setItemForm(prev => ({ ...prev, customCategory: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 animate-in slide-in-from-top-1 duration-150"
                    />
                  ) : (
                    <CascadingCategorySelector
                      value={itemForm.categoria}
                      onChange={(cat) => setItemForm(prev => ({ ...prev, categoria: cat }))}
                    />
                  )}
                </div>

                {/* Carga de Imagen Local */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    Fotos del Producto
                  </label>
                  <MultiImageManager
                    images={itemForm.imagenes}
                    onChange={(imgs) => setItemForm(prev => ({ ...prev, imagenes: imgs }))}
                  />
                </div>

                {/* Link del Modelo 3D / Archivo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Link del Modelo 3D / Archivo de impresión
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={itemForm.archivo_link}
                      onChange={(e) => setItemForm(prev => ({ ...prev, archivo_link: e.target.value }))}
                      placeholder="Ej. https://www.thingiverse.com/thing:123456"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {itemForm.archivo_link && (
                      <a
                        href={itemForm.archivo_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-slate-250 dark:hover:bg-slate-700 transition"
                        title="Probar Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* SWITCH ACTIVAR VARIANTES */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-slate-400" />
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                        Activar Variantes
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Habilita la creación de colores, tamaños o precios custom.
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createWithVariantes}
                      onChange={(e) => setCreateWithVariantes(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* SECCIÓN DE ADMINISTRACIÓN DE VARIANTES (CREACIÓN) */}
                {createWithVariantes && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200 border-t border-slate-150 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                        Variantes del Nuevo Ítem
                      </label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {createVariantes.length} registradas
                      </span>
                    </div>

                    {/* Lista de variantes actuales */}
                    {createVariantes.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {createVariantes.map((v, idx) => (
                          <div 
                            key={v.id || idx} 
                            className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            <div className="flex items-center gap-2">
                            {v.imagenes && v.imagenes.length > 0 ? (
                              <div className="relative w-8 h-8 flex-shrink-0">
                                <img
                                  src={v.imagenes[0]}
                                  alt=""
                                  className="w-full h-full rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                {v.imagenes.length > 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-[7px] font-black text-white px-1 rounded-full shadow">
                                    +{v.imagenes.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : v.imagen ? (
                              <img
                                src={v.imagen}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                                <ImageIcon size={12} />
                              </div>
                            )}
                              <div>
                                <span className="font-extrabold flex flex-wrap items-center gap-1">
                                  {v.nombre && <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[10px]">Nombre: {v.nombre}</span>}
                                  {v.color && <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px]">Color: {v.color}</span>}
                                  {!v.nombre && !v.color && <span>{v.combinacion}</span>}
                                  {v.archivo_link && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5" title={v.archivo_link}>
                                      3D ✓
                                    </span>
                                  )}
                                </span>
                                <div className="text-[10px] font-mono mt-0.5 space-x-1.5 flex flex-wrap gap-1">
                                  {v.precio > 0 && (
                                    <span className="text-slate-600 dark:text-slate-400">Min: <b className="text-slate-900 dark:text-white">{formatPriceMarketplace(v.precio)}</b></span>
                                  )}
                                  {v.precio_mayorista > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400">May: <b className="text-amber-700 dark:text-amber-300">{formatPriceMarketplace(v.precio_mayorista)}</b></span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCreateVariantIdx(idx);
                                  setCreateVariantNombre(v.nombre || '');
                                  setCreateVariantColor(v.color || '');
                                  setCreateVariantPrice(v.precio ? String(v.precio) : '');
                                  setCreateVariantPriceMayorista(v.precio_mayorista ? String(v.precio_mayorista) : '');
                                  setCreateVariantImages(v.imagenes || (v.imagen ? [v.imagen] : []));
                                  setCreateVariantLink(v.archivo_link || '');
                                  
                                  const hasCustomImages = v.imagenes && v.imagenes.length > 0 && !v.imagenes.every((img: string) => itemForm.imagenes.includes(img));
                                  setCreateVariantImgMode(hasCustomImages ? 'own' : 'product');
                                }}
                                className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                title="Editar Variante"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCreateVariantLocally(idx)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Variante"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Agrega variantes debajo para que se listen aquí</p>
                      </div>
                    )}

                    {/* Formulario para agregar variante */}
                    <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3 text-left">
                      {editingCreateVariantIdx !== null ? (
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none flex items-center gap-1">
                          <Pencil size={10} /> Editar Variante Registrada
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Agregar Nueva Variante</p>
                      )}
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nombre</label>
                          <input
                            type="text"
                            placeholder="Ej. Grande, XL"
                            value={createVariantNombre}
                            onChange={(e) => {
                              setCreateVariantNombre(e.target.value);
                              if (e.target.value) setCreateVariantColor('');
                            }}
                            disabled={!!createVariantColor}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Color</label>
                          <input
                            type="text"
                            placeholder="Ej. Rojo, Azul"
                            value={createVariantColor}
                            onChange={(e) => {
                              setCreateVariantColor(e.target.value);
                              if (e.target.value) setCreateVariantNombre('');
                            }}
                            disabled={!!createVariantNombre}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Precio Minorista ($)</label>
                          <input
                            type="number"
                            placeholder="Minorista"
                            value={createVariantPrice}
                            onChange={(e) => setCreateVariantPrice(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Precio Mayorista ($)</label>
                          <input
                            type="number"
                            placeholder="Mayorista"
                            value={createVariantPriceMayorista}
                            onChange={(e) => setCreateVariantPriceMayorista(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Seleccionar Foto de la Variante */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Origen de las Fotos de esta Variante
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCreateVariantImgMode('product');
                              setCreateVariantImages([]);
                            }}
                            className={`py-2 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl border transition-all cursor-pointer text-center ${
                              createVariantImgMode === 'product'
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Imágenes del Producto
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateVariantImgMode('own');
                              setCreateVariantImages([]);
                            }}
                            className={`py-2 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl border transition-all cursor-pointer text-center ${
                              createVariantImgMode === 'own'
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Galería Propia (Subir)
                          </button>
                        </div>

                        {createVariantImgMode === 'product' ? (
                          itemForm.imagenes.length > 0 ? (
                            <div className="space-y-1 mt-1.5 animate-in fade-in duration-200">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">
                                Selecciona de las fotos cargadas arriba (Selección Múltiple):
                              </span>
                              <div className="flex gap-2 items-center overflow-x-auto py-1">
                                {itemForm.imagenes.map((img, idx) => {
                                  const isSelected = createVariantImages.includes(img);
                                  const selectIdx = createVariantImages.indexOf(img);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setCreateVariantImages(prev => prev.includes(img) ? prev.filter(x => x !== img) : [...prev, img])}
                                      className={`relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                                        isSelected 
                                          ? 'border-indigo-600 scale-105 shadow-sm' 
                                          : 'border-transparent hover:border-slate-300'
                                      }`}
                                    >
                                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                                          <div className="bg-indigo-600 text-[8px] font-bold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                                            {selectIdx + 1}
                                          </div>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                              * Sube primero fotos al producto arriba para poder asociarlas aquí, o cambia a "Galería Propia (Subir)" para cargar una imagen exclusiva de esta variante.
                            </p>
                          )
                        ) : (
                          <div className="space-y-1.5 mt-1.5 animate-in fade-in duration-200">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">
                              Sube imágenes exclusivas para esta variante:
                            </span>
                            <MultiImageManager
                              images={createVariantImages}
                              onChange={(imgs) => setCreateVariantImages(imgs)}
                              maxImages={5}
                            />
                          </div>
                        )}
                      </div>

                      {/* Link del Modelo 3D de Variante */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          Link del Modelo 3D / Archivo de esta variante
                        </label>
                        <input
                          type="url"
                          placeholder="Ej. https://www.thingiverse.com/thing:123456"
                          value={createVariantLink}
                          onChange={(e) => setCreateVariantLink(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {editingCreateVariantIdx !== null ? (
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCreateVariantIdx(null);
                              setCreateVariantNombre('');
                              setCreateVariantColor('');
                              setCreateVariantPrice('');
                              setCreateVariantPriceMayorista('');
                              setCreateVariantImages([]);
                              setCreateVariantLink('');
                              setCreateVariantImgMode('product');
                            }}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar Edición
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateCreateVariantLocally}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            ✓ Actualizar Variante
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleAddCreateVariantLocally}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            + Agregar Variante
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCreateVariantIdx(null);
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creando...' : 'Crear Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR ÍTEM Y SUS VARIANTES */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Editar Producto y Variantes
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {editingItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setEditModalTab('info')}
                className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
                  editModalTab === 'info'
                    ? 'border-b-2 border-slate-950 dark:border-white text-slate-950 dark:text-white bg-white dark:bg-slate-900/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-250'
                }`}
              >
                Información & Variantes
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('customizer')}
                className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
                  editModalTab === 'customizer'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-250'
                }`}
              >
                🎛️ Personalizador 3D
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveEditItem}>
              <div className="p-5 space-y-5 text-left max-h-[60vh] overflow-y-auto">
                {editModalTab === 'info' ? (
                  <>
                    {/* Nombre */}
                    <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Nombre del Producto *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoCorrectField('nombre', 'edit')}
                      className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      ⚡ Corregir
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editForm.nombre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                 {/* Descripción */}
                 <div className="space-y-1">
                   <div className="flex justify-between items-center">
                     <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                       Descripción del Producto
                     </label>
                     <div className="flex items-center gap-3">
                       <button
                         type="button"
                         onClick={() => handleAutoCorrectField('descripcion', 'edit')}
                         className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-extrabold uppercase tracking-wider cursor-pointer"
                       >
                         ⚡ Corregir
                       </button>
                       <button
                         type="button"
                         onClick={() => handleImproveDescription('edit')}
                         disabled={improvingDescription}
                         className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 font-extrabold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                       >
                         <Sparkles size={11} className={improvingDescription ? "animate-spin" : ""} />
                         {improvingDescription ? 'Mejorando...' : 'Mejorar con IA'}
                       </button>
                     </div>
                   </div>
                   <textarea
                     rows={2}
                     value={editForm.descripcion || ''}
                     onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                     placeholder="Ej. Material PLA, alta calidad, diseño personalizado..."
                     className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                   />
                 </div>

                {/* Precios Minorista & Mayorista */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={editForm.precio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, precio: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Precio Mayorista ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editForm.precio_mayorista}
                      onChange={(e) => setEditForm(prev => ({ ...prev, precio_mayorista: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Categoría
                  </label>
                  <CascadingCategorySelector
                    value={editForm.categoria}
                    onChange={(cat) => setEditForm(prev => ({ ...prev, categoria: cat }))}
                  />
                </div>

                {/* Imagen del Producto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    Fotos del Producto
                  </label>
                  <MultiImageManager
                    images={editForm.imagenes}
                    onChange={(imgs) => setEditForm(prev => ({ ...prev, imagenes: imgs }))}
                  />
                </div>

                {/* Link del Modelo 3D / Archivo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Link del Modelo 3D / Archivo de impresión
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editForm.archivo_link}
                      onChange={(e) => setEditForm(prev => ({ ...prev, archivo_link: e.target.value }))}
                      placeholder="Ej. https://www.thingiverse.com/thing:123456"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {editForm.archivo_link && (
                      <a
                        href={editForm.archivo_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-slate-250 dark:hover:bg-slate-700 transition"
                        title="Probar Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* SECCIÓN DE ADMINISTRACIÓN DE VARIANTES */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                      Administrar Variantes
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {editVariantes.length} registradas
                    </span>
                  </div>

                  {/* Lista de variantes actuales */}
                  {editVariantes.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {editVariantes.map((v, idx) => (
                        <div 
                          key={v.id || idx} 
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <div className="flex items-center gap-2">
                            {v.imagenes && v.imagenes.length > 0 ? (
                              <div className="relative w-8 h-8 flex-shrink-0">
                                <img
                                  src={v.imagenes[0]}
                                  alt=""
                                  className="w-full h-full rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                {v.imagenes.length > 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-[7px] font-black text-white px-1 rounded-full shadow">
                                    +{v.imagenes.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : (v.imagen || v.imagen_url) ? (
                              <img
                                src={v.imagen || v.imagen_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                                <ImageIcon size={12} />
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold flex flex-wrap items-center gap-1">
                                {v.nombre && <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[10px]">Nombre: {v.nombre}</span>}
                                {v.color && <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px]">Color: {v.color}</span>}
                                {!v.nombre && !v.color && <span>{v.combinacion}</span>}
                                {v.archivo_link && (
                                  <a
                                    href={v.archivo_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 hover:underline"
                                    title={v.archivo_link}
                                  >
                                    3D ✓ <ExternalLink size={9} />
                                  </a>
                                )}
                              </span>
                               <div className="text-[10px] font-mono mt-0.5 space-x-1.5 flex flex-wrap gap-1 text-left">
                                 {v.precio > 0 && (
                                   <span className="text-slate-600 dark:text-slate-400">Min: <b className="text-slate-900 dark:text-white">{formatPriceMarketplace(v.precio)}</b></span>
                                 )}
                                 {v.precio_mayorista > 0 && (
                                   <span className="text-amber-600 dark:text-amber-400">May: <b className="text-amber-700 dark:text-amber-300">{formatPriceMarketplace(v.precio_mayorista)}</b></span>
                                 )}
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVariantIdx(idx);
                                setNewVariantNombre(v.nombre || '');
                                setNewVariantColor(v.color || '');
                                setNewVariantPrice(v.precio ? String(v.precio) : '');
                                setNewVariantPriceMayorista(v.precio_mayorista ? String(v.precio_mayorista) : '');
                                setNewVariantImages(v.imagenes || (v.imagen ? [v.imagen] : []));
                                setNewVariantLink(v.archivo_link || '');
                                
                                const hasCustomImages = v.imagenes && v.imagenes.length > 0 && !v.imagenes.every((img: string) => editForm.imagenes.includes(img));
                                setEditVariantImgMode(hasCustomImages ? 'own' : 'product');
                              }}
                              className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Editar Variante"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantLocally(idx)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Variante"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">El producto se vende por unidad estándar (sin variantes)</p>
                    </div>
                  )}

                  {/* Formulario para agregar variante */}
                  <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                    {editingVariantIdx !== null ? (
                      <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none flex items-center gap-1">
                        <Pencil size={10} /> Editar Variante Registrada
                      </p>
                    ) : (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Agregar Nueva Variante</p>
                    )}
                    <div className="grid grid-cols-4 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nombre</label>
                        <input
                          type="text"
                          placeholder="Ej. Grande, XL"
                          value={newVariantNombre}
                          onChange={(e) => {
                            setNewVariantNombre(e.target.value);
                            if (e.target.value) setNewVariantColor('');
                          }}
                          disabled={!!newVariantColor}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Color</label>
                        <input
                          type="text"
                          placeholder="Ej. Rojo, Azul"
                          value={newVariantColor}
                          onChange={(e) => {
                            setNewVariantColor(e.target.value);
                            if (e.target.value) setNewVariantNombre('');
                          }}
                          disabled={!!newVariantNombre}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Precio Minorista ($)</label>
                        <input
                          type="number"
                          placeholder="Minorista"
                          value={newVariantPrice}
                          onChange={(e) => setNewVariantPrice(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Precio Mayorista ($)</label>
                        <input
                          type="number"
                          placeholder="Mayorista"
                          value={newVariantPriceMayorista}
                          onChange={(e) => setNewVariantPriceMayorista(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Seleccionar Foto de la Variante */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Origen de las Fotos de esta Variante
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditVariantImgMode('product');
                            setNewVariantImages([]);
                          }}
                          className={`py-2 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl border transition-all cursor-pointer text-center ${
                            editVariantImgMode === 'product'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Imágenes del Producto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditVariantImgMode('own');
                            setNewVariantImages([]);
                          }}
                          className={`py-2 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl border transition-all cursor-pointer text-center ${
                            editVariantImgMode === 'own'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Galería Propia (Subir)
                        </button>
                      </div>

                      {editVariantImgMode === 'product' ? (
                        editForm.imagenes.length > 0 ? (
                          <div className="space-y-1 mt-1.5 animate-in fade-in duration-200">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">
                              Selecciona de las fotos cargadas arriba (Selección Múltiple):
                            </span>
                            <div className="flex gap-2 items-center overflow-x-auto py-1">
                              {editForm.imagenes.map((img, idx) => {
                                const isSelected = newVariantImages.includes(img);
                                const selectIdx = newVariantImages.indexOf(img);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setNewVariantImages(prev => prev.includes(img) ? prev.filter(x => x !== img) : [...prev, img])}
                                    className={`relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                                      isSelected 
                                        ? 'border-indigo-600 scale-105 shadow-sm' 
                                        : 'border-transparent hover:border-slate-300'
                                    }`}
                                  >
                                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                                        <div className="bg-indigo-600 text-[8px] font-bold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                                          {selectIdx + 1}
                                        </div>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                            * Sube primero fotos al producto arriba para poder asociarlas aquí, o cambia a "Galería Propia (Subir)" para cargar una imagen exclusiva de esta variante.
                          </p>
                        )
                      ) : (
                        <div className="space-y-1.5 mt-1.5 animate-in fade-in duration-200">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">
                            Sube imágenes exclusivas para esta variante:
                          </span>
                          <MultiImageManager
                            images={newVariantImages}
                            onChange={(imgs) => setNewVariantImages(imgs)}
                            maxImages={5}
                          />
                        </div>
                      )}
                    </div>

                    {/* Link del Modelo 3D de Variante */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        Link del Modelo 3D / Archivo de esta variante
                      </label>
                      <input
                        type="url"
                        placeholder="Ej. https://www.thingiverse.com/thing:123456"
                        value={newVariantLink}
                        onChange={(e) => setNewVariantLink(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {editingVariantIdx !== null ? (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVariantIdx(null);
                            setNewVariantNombre('');
                            setNewVariantColor('');
                            setNewVariantPrice('');
                            setNewVariantPriceMayorista('');
                            setNewVariantImages([]);
                            setNewVariantLink('');
                            setEditVariantImgMode('product');
                          }}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar Edición
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateVariantLocally}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          ✓ Actualizar Variante
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddVariantLocally}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          + Agregar Variante
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-150 text-left">
                {/* Título de ayuda */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/40 rounded-xl">
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
                    Sistema de Armado en Cascada (3D FDM)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Permite a tus clientes armar y cotizar este producto paso a paso en la vista previa. Los precios calculados sumarán los diferenciales (+ o -) de cada opción seleccionada sobre el precio base. Las imágenes heredan en cascada según la selección (Color → Motivo → Modelo → Base).
                  </p>
                </div>

                {/* Toggle de Habilitar */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                      Habilitar Personalizador 3D
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Activa la interfaz interactiva en la lista de precios para este ítem
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={customizerEnabled} 
                      onChange={(e) => setCustomizerEnabled(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {customizerEnabled && (
                  <div className="space-y-6">
                    {/* ================= MODELOS ================= */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          1. Modelos Disponibles ({customizerModels.length})
                        </h5>
                        <span className="text-[10px] text-slate-400">Ej: Tradicional, Hexagonal, Vikingo</span>
                      </div>
                      
                      {/* Formulario Modelo */}
                      {editingModelIdx !== null ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {editingModelIdx === -1 ? 'Agregar Nuevo Modelo' : `Editar Modelo #${editingModelIdx + 1}`}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre del Modelo</label>
                              <input 
                                type="text" 
                                placeholder="Ej. Chop Tradicional" 
                                value={modelForm.nombre}
                                onChange={(e) => setModelForm(prev => ({ ...prev, nombre: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Foto del Modelo</label>
                              <div className="flex items-center gap-2">
                                {modelForm.imagen ? (
                                  <div className="relative w-8 h-8 flex-shrink-0">
                                    <img src={modelForm.imagen} className="w-full h-full rounded object-cover border border-slate-200 dark:border-slate-800" referrerPolicy="no-referrer" />
                                    <button type="button" onClick={() => setModelForm(prev => ({ ...prev, imagen: '' }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-[8px]"><X size={8} /></button>
                                  </div>
                                ) : (
                                  <label className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200">
                                    <Upload size={10} />
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) compressOptionImage(file, (base64) => setModelForm(prev => ({ ...prev, imagen: base64 })));
                                      }}
                                    />
                                  </label>
                                )}
                                <span className="text-[9px] text-slate-400">Opcional</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Minorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. 1000 o -500" 
                                value={modelForm.precio_minorista_offset}
                                onChange={(e) => setModelForm(prev => ({ ...prev, precio_minorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Mayorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. 500" 
                                value={modelForm.precio_mayorista_offset}
                                onChange={(e) => setModelForm(prev => ({ ...prev, precio_mayorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => setEditingModelIdx(null)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (!modelForm.nombre.trim()) { toast.error("Ingresa el nombre del modelo"); return; }
                                const updated = [...customizerModels];
                                const record = { ...modelForm };
                                if (editingModelIdx === -1) {
                                  updated.push(record);
                                } else {
                                  updated[editingModelIdx] = record;
                                }
                                setCustomizerModels(updated);
                                setEditingModelIdx(null);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              ✓ Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {customizerModels.map((m, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 animate-in fade-in duration-100">
                                {m.imagen && <img src={m.imagen} className="w-5 h-5 rounded object-cover border" referrerPolicy="no-referrer" />}
                                <span className="font-extrabold">{m.nombre}</span>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  ({parseFloat(m.precio_minorista_offset) >= 0 ? '+' : ''}{m.precio_minorista_offset || 0})
                                </span>
                                <button type="button" onClick={() => { setEditingModelIdx(idx); setModelForm(m); }} className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1" title="Editar"><Pencil size={11} /></button>
                                <button type="button" onClick={() => setCustomizerModels(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer" title="Eliminar"><Trash2 size={11} /></button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => { setEditingModelIdx(-1); setModelForm({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '', imagen: '' }); }}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/20 rounded-lg cursor-pointer"
                            >
                              + Nuevo Modelo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ================= MOTIVOS ================= */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          2. Motivos / Diseños ({customizerMotifs.length})
                        </h5>
                        <span className="text-[10px] text-slate-400">Ej: Boca Juniors, River, Personalizado</span>
                      </div>
                      
                      {/* Formulario Motivo */}
                      {editingMotifIdx !== null ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {editingMotifIdx === -1 ? 'Agregar Nuevo Motivo' : `Editar Motivo #${editingMotifIdx + 1}`}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre del Motivo</label>
                              <input 
                                type="text" 
                                placeholder="Ej. Boca Juniors, Personalizado" 
                                value={motifForm.nombre}
                                onChange={(e) => setMotifForm(prev => ({ ...prev, nombre: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Foto del Motivo</label>
                              <div className="flex items-center gap-2">
                                {motifForm.imagen ? (
                                  <div className="relative w-8 h-8 flex-shrink-0">
                                    <img src={motifForm.imagen} className="w-full h-full rounded object-cover border border-slate-200 dark:border-slate-800" referrerPolicy="no-referrer" />
                                    <button type="button" onClick={() => setMotifForm(prev => ({ ...prev, imagen: '' }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-[8px]"><X size={8} /></button>
                                  </div>
                                ) : (
                                  <label className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200">
                                    <Upload size={10} />
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) compressOptionImage(file, (base64) => setMotifForm(prev => ({ ...prev, imagen: base64 })));
                                      }}
                                    />
                                  </label>
                                )}
                                <span className="text-[9px] text-slate-400">Opcional</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Minorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. +1500 (trabajo extra)" 
                                value={motifForm.precio_minorista_offset}
                                onChange={(e) => setMotifForm(prev => ({ ...prev, precio_minorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Mayorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. +800" 
                                value={motifForm.precio_mayorista_offset}
                                onChange={(e) => setMotifForm(prev => ({ ...prev, precio_mayorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* ================= SECCIÓN DE COLORES / VARIANTES DEL DISEÑO ================= */}
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                🎨 Variantes de Color de este Diseño ({motifForm.colores?.length || 0})
                              </label>
                              <span className="text-[9px] text-slate-400 font-bold">Asigna la foto de la jarra/taza en el color que representa este diseño</span>
                            </div>

                            {/* Formulario de Color específico para este motivo */}
                            {editingMotifColorIdx !== null ? (
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-950/60 shadow-sm space-y-3">
                                <div className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                  {editingMotifColorIdx === -1 ? '➕ Agregar Variante de Color al Diseño' : `✏️ Editar Variante de Color #${editingMotifColorIdx + 1}`}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Nombre del Color / Variante</label>
                                    <input 
                                      type="text" 
                                      placeholder="Ej. Blanco y Rojo" 
                                      value={motifColorForm.nombre}
                                      onChange={(e) => setMotifColorForm(prev => ({ ...prev, nombre: e.target.value }))}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Tonalidad (Gotero Nativo)</label>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="color" 
                                        value={motifColorForm.color_hex}
                                        onChange={(e) => setMotifColorForm(prev => ({ ...prev, color_hex: e.target.value }))}
                                        className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                                      />
                                      <span className="text-[10px] font-mono font-bold text-slate-600">{motifColorForm.color_hex}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Fotos del diseño en este color */}
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Fotos de la jarra en este color (Se comprime automáticamente para evitar consumos de almacenamiento)</label>
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <label className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-850 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                      <Upload size={14} className="text-slate-500" />
                                      <span className="text-[8px] font-bold uppercase mt-1 text-slate-500">Subir</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple
                                        className="hidden" 
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files.length > 0) {
                                            compressMultipleOptionImages(e.target.files, (base64List) => {
                                              setMotifColorForm(prev => {
                                                const updatedImgs = [...(prev.imagenes || []), ...base64List];
                                                return {
                                                  ...prev,
                                                  imagenes: updatedImgs,
                                                  imagen: updatedImgs[0] || ''
                                                };
                                              });
                                            });
                                          }
                                        }}
                                      />
                                    </label>

                                    {motifColorForm.imagenes && motifColorForm.imagenes.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {motifColorForm.imagenes.map((imgBase64, imgIdx) => (
                                          <div key={imgIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <img src={imgBase64} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            <button 
                                              type="button" 
                                              onClick={() => setMotifColorForm(prev => {
                                                const updatedImgs = prev.imagenes.filter((_, i) => i !== imgIdx);
                                                return {
                                                  ...prev,
                                                  imagenes: updatedImgs,
                                                  imagen: updatedImgs[0] || ''
                                                };
                                              })}
                                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 cursor-pointer"
                                            >
                                              <X size={8} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingMotifColorIdx(null)}
                                    className="px-2.5 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase rounded-lg cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      if (!motifColorForm.nombre.trim()) { toast.error("Ingresa el nombre del color"); return; }
                                      const updatedColors = [...(motifForm.colores || [])];
                                      const record = {
                                        ...motifColorForm,
                                        imagenes: motifColorForm.imagenes || [],
                                        imagen: motifColorForm.imagenes?.[0] || motifColorForm.imagen || ''
                                      };

                                      if (editingMotifColorIdx === -1) {
                                        updatedColors.push(record);
                                      } else {
                                        updatedColors[editingMotifColorIdx] = record;
                                      }

                                      setMotifForm(prev => ({
                                        ...prev,
                                        colores: updatedColors
                                      }));
                                      setEditingMotifColorIdx(null);
                                      toast.success("Variante de color asignada al diseño.");
                                    }}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase rounded-lg cursor-pointer"
                                  >
                                    ✓ Asignar Color
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                  {(motifForm.colores || []).map((c: any, idx: number) => {
                                    const photosCount = c.imagenes?.length || (c.imagen ? 1 : 0);
                                    return (
                                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 animate-in fade-in duration-100">
                                        <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.color_hex }} />
                                        <span className="font-extrabold text-[10px]">{c.nombre}</span>
                                        {photosCount > 0 && (
                                          <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5">
                                            <ImageIcon size={9} />
                                            {photosCount}
                                          </span>
                                        )}
                                        <button 
                                          type="button" 
                                          onClick={() => {
                                            setEditingMotifColorIdx(idx);
                                            setMotifColorForm({
                                              nombre: c.nombre,
                                              color_hex: c.color_hex,
                                              imagen: c.imagen || '',
                                              imagenes: c.imagenes || (c.imagen ? [c.imagen] : [])
                                            });
                                          }}
                                          className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                                          title="Editar Color"
                                        >
                                          <Pencil size={10} />
                                        </button>
                                        <button 
                                          type="button" 
                                          onClick={() => {
                                            setMotifForm(prev => ({
                                              ...prev,
                                              colores: (prev.colores || []).filter((_, i) => i !== idx)
                                            }));
                                          }}
                                          className="text-red-400 hover:text-red-600 cursor-pointer"
                                          title="Eliminar Color"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    );
                                  })}

                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setEditingMotifColorIdx(-1);
                                      setMotifColorForm({ nombre: '', color_hex: '#6366f1', imagen: '', imagenes: [] });
                                    }}
                                    className="px-2.5 py-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/10 rounded-lg cursor-pointer"
                                  >
                                    + Asignar Variante de Color con Foto
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => setEditingMotifIdx(null)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (!motifForm.nombre.trim()) { toast.error("Ingresa el nombre del motivo"); return; }
                                const updated = [...customizerMotifs];
                                const record = { ...motifForm };
                                if (editingMotifIdx === -1) {
                                  updated.push(record);
                                } else {
                                  updated[editingMotifIdx] = record;
                                }
                                setCustomizerMotifs(updated);
                                setEditingMotifIdx(null);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              ✓ Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {customizerMotifs.map((m, idx) => {
                              const isActive = activeMotifIdx === idx;
                              const colorsCount = m.colores?.length || 0;
                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => setActiveMotifIdx(idx)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer animate-in fade-in duration-100 ${
                                    isActive 
                                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm' 
                                      : 'bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                  }`}
                                >
                                  {m.imagen && <img src={m.imagen} className="w-5 h-5 rounded object-cover border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />}
                                  <span className="font-extrabold">{m.nombre}</span>
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black ml-1">
                                    ({colorsCount})
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold ml-1">
                                    ({parseFloat(m.precio_minorista_offset) >= 0 ? '+' : ''}{m.precio_minorista_offset || 0})
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setEditingMotifIdx(idx); setMotifForm(m); }} 
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer ml-1" 
                                    title="Editar"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setCustomizerMotifs(prev => prev.filter((_, i) => i !== idx));
                                      if (activeMotifIdx >= idx && activeMotifIdx > 0) {
                                        setActiveMotifIdx(prev => prev - 1);
                                      }
                                    }} 
                                    className="text-red-400 hover:text-red-600 cursor-pointer" 
                                    title="Eliminar"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              );
                            })}
                            <button 
                              type="button" 
                              onClick={() => { setEditingMotifIdx(-1); setMotifForm({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '', imagen: '', colores: [] }); }}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/20 rounded-lg cursor-pointer"
                            >
                              + Nuevo Motivo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ================= COLORES ================= */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      {customizerMotifs.length === 0 ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl text-center border border-slate-200 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            ⚠️ Primero debes crear al menos un Motivo en el paso 2 para configurar sus variantes de colores.
                          </span>
                        </div>
                      ) : (
                        (() => {
                          const activeMotif = customizerMotifs[activeMotifIdx] || customizerMotifs[0] || { nombre: '', colores: [] };
                          const activeMotifColors = activeMotif.colores || [];

                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                  3. Colores para el Motivo "{activeMotif.nombre}" ({activeMotifColors.length})
                                </h5>
                                <span className="text-[10px] text-slate-400">Cada motivo tiene sus propios colores con una o varias fotos</span>
                              </div>
                              
                              {/* Formulario Color */}
                              {editingColorIdx !== null ? (
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                    {editingColorIdx === -1 ? 'Agregar Nuevo Color' : `Editar Color #${editingColorIdx + 1}`}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre del Color</label>
                                      <input 
                                        type="text" 
                                        placeholder="Ej. Azul Eléctrico" 
                                        value={colorForm.nombre}
                                        onChange={(e) => setColorForm(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tonalidad (Gotero Nativo)</label>
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="color" 
                                          value={colorForm.color_hex}
                                          onChange={(e) => setColorForm(prev => ({ ...prev, color_hex: e.target.value }))}
                                          className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                                        />
                                        <span className="text-[10px] font-mono font-bold text-slate-600">{colorForm.color_hex}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Carga Múltiple de Fotos para esta Variante Color */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Fotos de Muestra en este Color (Puedes seleccionar varias a la vez)</label>
                                    <div className="flex items-start gap-3 flex-wrap">
                                      <label className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-850 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                        <Upload size={14} />
                                        <span className="text-[8px] font-bold uppercase mt-1">Subir</span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          multiple
                                          className="hidden" 
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                              compressMultipleOptionImages(e.target.files, (base64List) => {
                                                setColorForm(prev => {
                                                  const updatedImgs = [...(prev.imagenes || []), ...base64List];
                                                  return {
                                                    ...prev,
                                                    imagenes: updatedImgs,
                                                    imagen: updatedImgs[0] || ''
                                                  };
                                                });
                                              });
                                            }
                                          }}
                                        />
                                      </label>

                                      {/* Galería de fotos cargadas en el formulario actual */}
                                      {colorForm.imagenes && colorForm.imagenes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {colorForm.imagenes.map((imgBase64, imgIdx) => (
                                            <div key={imgIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                              <img src={imgBase64} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                              <button 
                                                type="button" 
                                                onClick={() => setColorForm(prev => {
                                                  const updatedImgs = prev.imagenes.filter((_, i) => i !== imgIdx);
                                                  return {
                                                    ...prev,
                                                    imagenes: updatedImgs,
                                                    imagen: updatedImgs[0] || ''
                                                  };
                                                })}
                                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 cursor-pointer"
                                              >
                                                <X size={8} />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 leading-tight block pt-1">
                                      Selecciona una o más fotos. La primera foto se usará como portada principal cuando se elija este color.
                                    </span>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button 
                                      type="button" 
                                      onClick={() => setEditingColorIdx(null)}
                                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        if (!colorForm.nombre.trim()) { toast.error("Ingresa el nombre del color"); return; }
                                        const updatedColors = [...(activeMotif.colores || [])];
                                        const record = { 
                                          ...colorForm,
                                          imagenes: colorForm.imagenes || [],
                                          imagen: colorForm.imagenes?.[0] || colorForm.imagen || ''
                                        };
                                        if (editingColorIdx === -1) {
                                          updatedColors.push(record);
                                        } else {
                                          updatedColors[editingColorIdx] = record;
                                        }
                                        
                                        // Guardamos al motivo activo
                                        const updatedMotifs = [...customizerMotifs];
                                        const targetIdx = customizerMotifs[activeMotifIdx] ? activeMotifIdx : 0;
                                        updatedMotifs[targetIdx] = {
                                          ...updatedMotifs[targetIdx],
                                          colores: updatedColors
                                        };
                                        setCustomizerMotifs(updatedMotifs);
                                        setEditingColorIdx(null);
                                      }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                    >
                                      ✓ Guardar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {activeMotifColors.map((c: any, idx: number) => {
                                      const photosCount = c.imagenes?.length || (c.imagen ? 1 : 0);
                                      return (
                                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 animate-in fade-in duration-100">
                                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" style={{ backgroundColor: c.color_hex }} />
                                          <span className="font-extrabold">{c.nombre}</span>
                                          {photosCount > 0 && (
                                            <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5">
                                              <ImageIcon size={10} />
                                              {photosCount}
                                            </span>
                                          )}
                                          <button 
                                            type="button" 
                                            onClick={() => { 
                                              setEditingColorIdx(idx); 
                                              setColorForm({ 
                                                nombre: c.nombre, 
                                                color_hex: c.color_hex, 
                                                imagen: c.imagen || '', 
                                                imagenes: c.imagenes || (c.imagen ? [c.imagen] : []) 
                                              }); 
                                            }} 
                                            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1" 
                                            title="Editar"
                                          >
                                            <Pencil size={11} />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const updatedColors = activeMotifColors.filter((_: any, i: number) => i !== idx);
                                              const updatedMotifs = [...customizerMotifs];
                                              const targetIdx = customizerMotifs[activeMotifIdx] ? activeMotifIdx : 0;
                                              updatedMotifs[targetIdx] = {
                                                ...updatedMotifs[targetIdx],
                                                colores: updatedColors
                                              };
                                              setCustomizerMotifs(updatedMotifs);
                                            }} 
                                            className="text-red-400 hover:text-red-600 cursor-pointer" 
                                            title="Eliminar"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      );
                                    })}
                                    <button 
                                      type="button" 
                                      onClick={() => { setEditingColorIdx(-1); setColorForm({ nombre: '', color_hex: '#6366f1', imagen: '', imagenes: [] }); }}
                                      className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/20 rounded-lg cursor-pointer"
                                    >
                                      + Nuevo Color
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()
                      )}
                    </div>

                    {/* ================= LITRAJES / TAMAÑOS ================= */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          4. Tamaños / Capacidad ({customizerCapacities.length})
                        </h5>
                        <span className="text-[10px] text-slate-400">Ej: 500ml, 750ml, 1 Litro</span>
                      </div>
                      
                      {/* Formulario Capacidad */}
                      {editingCapacityIdx !== null ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {editingCapacityIdx === -1 ? 'Agregar Nuevo Tamaño' : `Editar Tamaño #${editingCapacityIdx + 1}`}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Capacidad / Medida</label>
                            <input 
                              type="text" 
                              placeholder="Ej. 500 ml, 1 Litro" 
                              value={capacityForm.nombre}
                              onChange={(e) => setCapacityForm(prev => ({ ...prev, nombre: e.target.value }))}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Minorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. +1500, -300" 
                                value={capacityForm.precio_minorista_offset}
                                onChange={(e) => setCapacityForm(prev => ({ ...prev, precio_minorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Diferencia Mayorista ($)</label>
                              <input 
                                type="number" 
                                placeholder="Ej. +900" 
                                value={capacityForm.precio_mayorista_offset}
                                onChange={(e) => setCapacityForm(prev => ({ ...prev, precio_mayorista_offset: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => setEditingCapacityIdx(null)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (!capacityForm.nombre.trim()) { toast.error("Ingresa el tamaño"); return; }
                                const updated = [...customizerCapacities];
                                const record = { ...capacityForm };
                                if (editingCapacityIdx === -1) {
                                  updated.push(record);
                                } else {
                                  updated[editingCapacityIdx] = record;
                                }
                                setCustomizerCapacities(updated);
                                setEditingCapacityIdx(null);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              ✓ Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {customizerCapacities.map((c, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 animate-in fade-in duration-100">
                                <span className="font-extrabold">{c.nombre}</span>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  ({parseFloat(c.precio_minorista_offset) >= 0 ? '+' : ''}{c.precio_minorista_offset || 0})
                                </span>
                                <button type="button" onClick={() => { setEditingCapacityIdx(idx); setCapacityForm(c); }} className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1" title="Editar"><Pencil size={11} /></button>
                                <button type="button" onClick={() => setCustomizerCapacities(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer" title="Eliminar"><Trash2 size={11} /></button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => { setEditingCapacityIdx(-1); setCapacityForm({ nombre: '', precio_minorista_offset: '', precio_mayorista_offset: '' }); }}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/20 rounded-lg cursor-pointer"
                            >
                              + Nuevo Tamaño
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

              {/* Botones de acción */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                    setEditingVariantIdx(null);
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewModalOpen && previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col">
            
            {/* Header de Vista Previa */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-md">
                  {previewItem.categoria || 'Sin Categoría'}
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mt-1">
                  Vista Previa del Producto
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido en 2 Columnas estilo Marketplace */}
            <div className="p-6 overflow-y-auto max-h-[75vh] bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
                
                {/* Columna Izquierda (Visual / Carrusel): 5 de 12 columnas */}
                <div className="md:col-span-5 space-y-4">
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center relative shadow-inner">
                    {previewImages.length > 0 ? (
                      <img 
                        src={previewImages[activePreviewImgIdx] || previewImages[0]} 
                        alt={previewItem.nombre} 
                        className="w-full h-full object-cover transition-all"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x600/e2e8f0/64748b?text=G3D+Creative";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        <ImageIcon size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sin Imagen</span>
                      </div>
                    )}

                    {/* Indicador de número de foto */}
                    {previewImages.length > 1 && (
                      <span className="absolute bottom-3 right-3 px-2 py-1 text-[9px] font-black bg-black/60 text-white rounded-lg backdrop-blur-md">
                        {activePreviewImgIdx + 1} / {previewImages.length}
                      </span>
                    )}
                  </div>

                  {/* Miniaturas */}
                  {previewImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {previewImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePreviewImgIdx(idx)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                            activePreviewImgIdx === idx 
                              ? 'border-indigo-600 scale-105 shadow-md' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/150x150/e2e8f0/64748b?text=Error";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Columna Derecha (Metadata & Configuración): 7 de 12 columnas */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    
                    {/* Título & Descripción */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                        {previewItem.nombre}
                      </h2>
                      {previewItem.descripcion ? (
                        <p className="text-xs text-slate-650 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          {previewItem.descripcion}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic font-medium">Sin descripción disponible.</p>
                      )}
                    </div>

                    {/* Bloque de Precios del Marketplace */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-950/80 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          {selectedPreviewVariant ? `Precio (${selectedPreviewVariant.nombre || selectedPreviewVariant.color || selectedPreviewVariant.combinacion})` : 'Precio base'}
                        </span>
                        <div className="text-xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5">
                          {formatPriceMarketplace(previewPrice)}
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold ml-1.5 uppercase tracking-wider">Minorista</span>
                        </div>
                      </div>

                      {previewWholesalePrice > 0 && hasPermission('G3d.PrecioMayorista.Ver') && (
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-500 block">
                            Mayorista
                          </span>
                          <div className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight mt-0.5">
                            {formatPriceMarketplace(previewWholesalePrice)}
                            <span className="text-[9px] text-amber-550 font-bold ml-1.5 uppercase tracking-wider">Mayorista</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón de descarga de archivo 3D / link */}
                    {previewLink && (
                      <a
                        href={previewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                      >
                        <FolderDown size={14} />
                        Descargar Modelo 3D / Archivo
                      </a>
                    )}

                    {/* Selección de Variantes o Personalizador en Cascada */}
                    {previewItem.customizer?.enabled ? (
                      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-450 block flex items-center gap-1">
                          <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                          Personalizar {previewItem.nombre}:
                        </span>

                        {/* 1. Seleccionar Modelo */}
                        {(() => {
                          const availableModels = previewItem.customizer.modelos || previewItem.customizer.models || [];
                          if (availableModels.length === 0) return null;

                          return (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                1. Selecciona el Modelo:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {availableModels.map((model: any, idx: number) => {
                                  const isSelected = selectedModel?.nombre === model.nombre;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedModel(model)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {model.imagen && (
                                        <img src={model.imagen} className="w-5 h-5 rounded object-cover" referrerPolicy="no-referrer" />
                                      )}
                                      <span>{model.nombre}</span>
                                      {parseFloat(model.precio_minorista_offset) !== 0 && (
                                        <span className="text-[9px] opacity-80 ml-1">
                                          ({parseFloat(model.precio_minorista_offset) > 0 ? '+' : ''}{model.precio_minorista_offset})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. Seleccionar Motivo */}
                        {(() => {
                          const availableMotifs = previewItem.customizer.motivos || previewItem.customizer.motifs || [];
                          if (availableMotifs.length === 0) return null;

                          return (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                2. Elige el Motivo / Diseño:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {availableMotifs.map((motif: any, idx: number) => {
                                  const isSelected = selectedMotif?.nombre === motif.nombre;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setSelectedMotif(motif);
                                        // Seleccionar automáticamente el primer color disponible de este motivo
                                        if (motif.colores && motif.colores.length > 0) {
                                          setSelectedColor(motif.colores[0]);
                                        } else {
                                          setSelectedColor(previewItem.customizer.colores?.[0] || previewItem.customizer.colors?.[0] || null);
                                        }
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {motif.imagen && (
                                        <img src={motif.imagen} className="w-5 h-5 rounded object-cover" referrerPolicy="no-referrer" />
                                      )}
                                      <span>{motif.nombre}</span>
                                      {parseFloat(motif.precio_minorista_offset) !== 0 && (
                                        <span className="text-[9px] opacity-80 ml-1">
                                          ({parseFloat(motif.precio_minorista_offset) > 0 ? '+' : ''}{motif.precio_minorista_offset})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Seleccionar Color */}
                        {(() => {
                          const motifColors = selectedMotif?.colores || [];
                          const globalColors = previewItem.customizer.colores || previewItem.customizer.colors || [];
                          const availableColors = motifColors.length > 0 ? motifColors : globalColors;

                          if (availableColors.length === 0) return null;

                          return (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                3. Color para el Motivo "{selectedMotif?.nombre || 'este diseño'}":
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {availableColors.map((color: any, idx: number) => {
                                  const isSelected = selectedColor?.nombre === color.nombre;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedColor(color)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <span 
                                        className="w-3.5 h-3.5 rounded-full border border-white/45 flex-shrink-0" 
                                        style={{ backgroundColor: color.color_hex }}
                                      />
                                      <span>{color.nombre}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. Seleccionar Litraje / Tamaño */}
                        {(() => {
                          const availableCapacities = previewItem.customizer.litrajes || previewItem.customizer.capacities || [];
                          if (availableCapacities.length === 0) return null;

                          return (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                4. Capacidad / Tamaño:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {availableCapacities.map((cap: any, idx: number) => {
                                  const isSelected = selectedCapacity?.nombre === cap.nombre;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedCapacity(cap)}
                                      className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <span>{cap.nombre}</span>
                                      {parseFloat(cap.precio_minorista_offset) !== 0 && (
                                        <span className="text-[9px] opacity-80 ml-1">
                                          ({parseFloat(cap.precio_minorista_offset) > 0 ? '+' : ''}{cap.precio_minorista_offset})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Resumen de Combinación Seleccionada */}
                        <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                            Variante seleccionada para el pedido:
                          </span>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono">
                            {selectedModel?.nombre || 'Ninguno'} ➔ {selectedMotif?.nombre || 'Ninguno'} ➔ {selectedColor?.nombre || 'Ninguno'} ({selectedCapacity?.nombre || 'Ninguno'})
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const comboString = `${selectedModel?.nombre || ''} - ${selectedMotif?.nombre || ''} - ${selectedColor?.nombre || ''} (${selectedCapacity?.nombre || ''})`;
                                navigator.clipboard.writeText(comboString);
                                toast.success("Combinación copiada para tu pedido!");
                              }}
                              className="inline-flex items-center gap-1 text-[9px] text-slate-500 hover:text-indigo-600 font-extrabold uppercase tracking-wider cursor-pointer"
                            >
                              <Copy size={11} />
                              Copiar Configuración
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      previewItem.variantes && previewItem.variantes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Seleccionar Variante:
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {previewItem.variantes.map((v: any) => {
                              const isSelected = selectedPreviewVariant?.id === v.id;
                              const displayLabel = v.color || v.nombre || v.combinacion || `Variante ${v.id.substring(0, 4)}`;

                              return (
                                <button
                                  key={v.id}
                                  onClick={() => handleSelectPreviewVariant(v)}
                                  className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm border cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20'
                                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {displayLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}

                  </div>
                </div>

              </div>
            </div>

            {/* Footer con opción de editar rápida si tiene permisos */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClosePreview}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClosePreview();
                  handleOpenEdit(previewItem);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                <Pencil size={11} />
                Editar Producto
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
