import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Play, Pause, Edit3, Image as ImageIcon, Box, Plus, X, CheckCircle2, Grid, List, AlertCircle, AlertTriangle, Brain, Search, Sparkles, Trash2, DollarSign, Clock, Settings, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { CascadingCategorySelector } from './CascadingCategorySelector';
import { ImageManager } from './ImageManager';
import { getProductImages, parseImages } from '../utils/imageUtils';
import { Tooltip } from './Tooltip';
import { Switch3D } from './Switch3D';

const PREDEFINED_COLORS = [
  { name: 'Negro', hex: '#0f172a' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Gris', hex: '#64748b' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Cian', hex: '#06b6d4' },
];

const MOCK_PRODUCTS = [
  { id: 'p-1', nombre: 'Jarra Chop - Un Poco de Ruido 500ml', categoria: 'Impresión 3D', stock: 2, minimo_alerta: 1, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: ['https://images.unsplash.com/photo-1517260739337-6799d239ce83?w=800&q=80', 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80'], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-2', nombre: 'Maceta Groot 15cm Pintada a Mano', categoria: 'Impresión 3D', stock: 0, minimo_alerta: 2, publicado: false, estado: 'Pausado', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-3', nombre: 'Llavero Spotify Personalizado Acrílico', categoria: 'Llaveros', stock: 5, minimo_alerta: 6, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-4', nombre: 'Mate Camionero Impreso 3D Termo', categoria: 'Mates', stock: 0, minimo_alerta: 1, publicado: false, estado: 'Pausado', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-5', nombre: 'Cartel Luminoso Logo Custom LED', categoria: 'Cartelería', stock: 1, minimo_alerta: 0, publicado: true, estado: 'Activo', modalidad: 'produccion', delivery_min: 3, delivery_max: 5, tiempo_entrega: 'Entre 3 y 5 días', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-5', nombre: 'Soporte Auriculares Escritorio Batman', categoria: 'Accesorios', stock: 3, minimo_alerta: 5, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-7', nombre: 'Figura Iron Man Busto 20cm Colección', categoria: 'Figuras', stock: 1, minimo_alerta: 2, publicado: true, estado: 'Activo', modalidad: 'produccion', delivery_min: 5, delivery_max: 7, tiempo_entrega: 'Entre 5 y 7 días', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-5', nombre: 'Filamento PLA+ Grilon3D Negro 1Kg', categoria: 'Filamentos', stock: 0, minimo_alerta: 5, publicado: false, estado: 'Pausado', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-9', nombre: 'Filamento PETG Printalot Blanco 1Kg', categoria: 'Filamentos', stock: 8, minimo_alerta: 4, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-10', nombre: 'Soporte Joystick PS5 Xbox One Dual', categoria: 'Accesorios', stock: 6, minimo_alerta: 2, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-11', nombre: 'Maceta Bulbasaur Pokémon 10cm', categoria: 'Macetas', stock: 12, minimo_alerta: 5, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-12', nombre: 'Lámpara Luna 3D Táctil 15cm RGB', categoria: 'Decoración', stock: 2, minimo_alerta: 2, publicado: true, estado: 'Activo', modalidad: 'produccion', delivery_min: 2, delivery_max: 4, tiempo_entrega: 'Entre 2 y 4 días', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-13', nombre: 'Maceta Yoda Star Wars', categoria: 'Macetas', stock: 3, minimo_alerta: 5, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-14', nombre: 'Letras Corpóreas Polifan (Por letra)', categoria: 'Cartelería', stock: 100, minimo_alerta: 10, publicado: true, estado: 'Activo', modalidad: 'produccion', delivery_min: 2, delivery_max: 3, tiempo_entrega: 'Entre 2 y 3 días', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-15', nombre: 'Llavero Calendario Aniversario', categoria: 'Llaveros', stock: 15, minimo_alerta: 5, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-16', nombre: 'Cartel Neón LED "Open" 50x20cm', categoria: 'Cartelería', stock: 1, minimo_alerta: 2, publicado: true, estado: 'Activo', modalidad: 'produccion', delivery_min: 5, delivery_max: 7, tiempo_entrega: 'Entre 5 y 7 días', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-17', nombre: 'Base Notebook Inclinable Plegable', categoria: 'Oficina', stock: 4, minimo_alerta: 5, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-18', nombre: 'Soporte Celular Plegable de Mesa', categoria: 'Accesorios', stock: 20, minimo_alerta: 10, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-19', nombre: 'Mate Darth Vader 3D + Bombilla', categoria: 'Mates', stock: 0, minimo_alerta: 3, publicado: true, estado: 'Pausado', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
  { id: 'p-20', nombre: 'Llavero QR WiFi Escaneable', categoria: 'Llaveros', stock: 8, minimo_alerta: 4, publicado: true, estado: 'Activo', modalidad: 'inmediata', delivery_min: 0, delivery_max: 0, tiempo_entrega: 'Inmediata', imagenes: [], flujo_actual: 'No asignado', es_stock_propio: true },
];

export function MisProductosView() {
  const { session, userRole } = useAuth();
  const isMainStore = userRole === 'Admin' || userRole === 'Produccion';
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'catalog';

  const [platformCommission, setPlatformCommission] = useState('10');

  // --- G3D PRECIOS & FABRICACIÓN STATE ---
  const [g3dPriceItems, setG3dPriceItems] = useState<any[]>([]);
  const [g3dFabItems, setG3dFabItems] = useState<any[]>([]);
  const machineCostHr = g3dFabItems.find(f => f.tipo === 'Máquina')?.costo_unitario || 120;
  const [isG3dPriceModalOpen, setIsG3dPriceModalOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<any | null>(null);
  
  // Form para ítems de lista de precios
  const [priceItemForm, setPriceItemForm] = useState({
    nombre: '',
    categoria: 'General',
    precio_publico: '',
    tiempo_horas: '2',
    items_insumos: [] as { fab_item_id: string; cantidad: number }[]
  });

  // Modal e inputs para fabricaciones (Insumos/Máquina/Pintura)
  const [isG3dFabModalOpen, setIsG3dFabModalOpen] = useState(false);
  const [editingFabItem, setEditingFabItem] = useState<any | null>(null);
  const [fabItemForm, setFabItemForm] = useState({
    nombre: '',
    tipo: 'Insumo', // Insumo, Máquina, Acabado
    unidad: 'g',    // g, hr, unidad
    costo_unitario: ''
  });

  const loadG3dPriceAndFabData = () => {
    try {
      const savedPrice = localStorage.getItem('g3d_price_list_items');
      const savedFab = localStorage.getItem('g3d_fabricacion_items');
      
      if (savedPrice) {
        setG3dPriceItems(JSON.parse(savedPrice));
      } else {
        // Mock inicial de lista de precios
        const initialPrices = [
          { id: 'pli-1', nombre: 'Maceta Groot 12cm', categoria: 'Macetas', precio_publico: 5500, tiempo_horas: 4, items_insumos: [{ fab_item_id: 'fbi-1', cantidad: 120 }, { fab_item_id: 'fbi-2', cantidad: 4 }] },
          { id: 'pli-2', nombre: 'Busto Darth Vader 15cm', categoria: 'Figuras', precio_publico: 12000, tiempo_horas: 12, items_insumos: [{ fab_item_id: 'fbi-1', cantidad: 250 }, { fab_item_id: 'fbi-2', cantidad: 12 }, { fab_item_id: 'fbi-3', cantidad: 1 }] }
        ];
        localStorage.setItem('g3d_price_list_items', JSON.stringify(initialPrices));
        setG3dPriceItems(initialPrices);
      }
      
      if (savedFab) {
        setG3dFabItems(JSON.parse(savedFab));
      } else {
        // Mock inicial de componentes de fabricación
        const initialFab = [
          { id: 'fbi-1', nombre: 'Filamento PLA Grilon3D', tipo: 'Insumo', unidad: 'g', costo_unitario: 18 },
          { id: 'fbi-2', nombre: 'Consumo Eléctrico Impresora', tipo: 'Máquina', unidad: 'hr', costo_unitario: 120 },
          { id: 'fbi-3', nombre: 'Kit de Lijado & Pintura base', tipo: 'Acabado', unidad: 'unidad', costo_unitario: 800 }
        ];
        localStorage.setItem('g3d_fabricacion_items', JSON.stringify(initialFab));
        setG3dFabItems(initialFab);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadG3dPriceAndFabData();
  }, []);

  const getFabricationCost = (items_insumos: { fab_item_id: string; cantidad: number }[]) => {
    let total = 0;
    if (!items_insumos) return 0;
    for (const item of items_insumos) {
      const fab = g3dFabItems.find(f => f.id === item.fab_item_id);
      if (fab) {
        total += (fab.costo_unitario || 0) * (item.cantidad || 0);
      }
    }
    return total;
  };

  const handleSaveFabItem = () => {
    try {
      if (!fabItemForm.nombre || !fabItemForm.costo_unitario) {
        toast.error("Por favor complete los campos obligatorios.");
        return;
      }
      const saved = JSON.parse(localStorage.getItem('g3d_fabricacion_items') || '[]');
      if (editingFabItem) {
        const updated = saved.map((x: any) => {
          if (x.id === editingFabItem.id) {
            return {
              ...x,
              nombre: fabItemForm.nombre,
              tipo: fabItemForm.tipo,
              unidad: fabItemForm.unidad,
              costo_unitario: parseFloat(fabItemForm.costo_unitario) || 0
            };
          }
          return x;
        });
        localStorage.setItem('g3d_fabricacion_items', JSON.stringify(updated));
        toast.success("Item de fabricación actualizado.");
      } else {
        const newItem = {
          id: 'fbi-' + Date.now(),
          nombre: fabItemForm.nombre,
          tipo: fabItemForm.tipo,
          unidad: fabItemForm.unidad,
          costo_unitario: parseFloat(fabItemForm.costo_unitario) || 0
        };
        saved.push(newItem);
        localStorage.setItem('g3d_fabricacion_items', JSON.stringify(saved));
        toast.success("Nuevo item de fabricación agregado.");
      }
      setIsG3dFabModalOpen(false);
      setEditingFabItem(null);
      loadG3dPriceAndFabData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteFabItem = (id: string) => {
    try {
      if (!confirm("¿Estás seguro de eliminar este ítem de fabricación?")) return;
      const saved = JSON.parse(localStorage.getItem('g3d_fabricacion_items') || '[]');
      const filtered = saved.filter((x: any) => x.id !== id);
      localStorage.setItem('g3d_fabricacion_items', JSON.stringify(filtered));
      toast.success("Item eliminado.");
      loadG3dPriceAndFabData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSavePriceItem = () => {
    try {
      if (!priceItemForm.nombre || !priceItemForm.precio_publico) {
        toast.error("Por favor complete los campos obligatorios.");
        return;
      }
      const saved = JSON.parse(localStorage.getItem('g3d_price_list_items') || '[]');
      if (editingPriceItem) {
        const updated = saved.map((x: any) => {
          if (x.id === editingPriceItem.id) {
            return {
              ...x,
              nombre: priceItemForm.nombre,
              categoria: priceItemForm.categoria,
              precio_publico: parseFloat(priceItemForm.precio_publico) || 0,
              tiempo_horas: parseFloat(priceItemForm.tiempo_horas) || 0,
              items_insumos: priceItemForm.items_insumos
            };
          }
          return x;
        });
        localStorage.setItem('g3d_price_list_items', JSON.stringify(updated));
        toast.success("Precio de catálogo actualizado.");
      } else {
        const newItem = {
          id: 'pli-' + Date.now(),
          nombre: priceItemForm.nombre,
          categoria: priceItemForm.categoria,
          precio_publico: parseFloat(priceItemForm.precio_publico) || 0,
          tiempo_horas: parseFloat(priceItemForm.tiempo_horas) || 0,
          items_insumos: priceItemForm.items_insumos
        };
        saved.push(newItem);
        localStorage.setItem('g3d_price_list_items', JSON.stringify(saved));
        toast.success("Nuevo ítem de catálogo registrado.");
      }
      setIsG3dPriceModalOpen(false);
      setEditingPriceItem(null);
      loadG3dPriceAndFabData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeletePriceItem = (id: string) => {
    try {
      if (!confirm("¿Estás seguro de eliminar este ítem de la lista de precios?")) return;
      const saved = JSON.parse(localStorage.getItem('g3d_price_list_items') || '[]');
      const filtered = saved.filter((x: any) => x.id !== id);
      localStorage.setItem('g3d_price_list_items', JSON.stringify(filtered));
      toast.success("Ítem eliminado.");
      loadG3dPriceAndFabData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const [currentSection, setCurrentSection] = useState<'catalog' | 'ai_items'>('catalog');
  const [aiItems, setAiItems] = useState<any[]>([]);
  const [aiSearch, setAiSearch] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [stockFilter, setStockFilter] = useState<'all' | 'no-stock' | 'low-stock'>('all');

  const [bulkStock, setBulkStock] = useState<number | ''>('');
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');

  const handleAddAttribute = () => {
    let newAttrs = [...(editingProduct.atributos || [])];
    newAttrs.push({nombre: '', valores: ''});
    setEditingProduct({...editingProduct, atributos: newAttrs});
  };

  const handleRemoveAttribute = (idx: number) => {
    let newAttrs = [...(editingProduct.atributos || [])];
    newAttrs.splice(idx, 1);
    handleAttributeUpdate(newAttrs);
  };

  const handleAttributeChange = (idx: number, field: string, value: string) => {
    let newAttrs = [...(editingProduct.atributos || [])];
    newAttrs[idx][field] = value;
    handleAttributeUpdate(newAttrs);
  };

  const handleAttributeUpdate = (newAttrs: any[]) => {
    const validAttrs = newAttrs.filter((a: any) => a.nombre.trim() !== '' && a.valores.trim() !== '');
    
    if (validAttrs.length === 0) {
        setEditingProduct({...editingProduct, atributos: newAttrs, variantes: []});
        return;
    }

    let combinations: string[][] = [[]];
    for (const attr of validAttrs) {
        const vals = attr.valores.split(',').map((v: string) => v.trim()).filter(Boolean);
        if (vals.length === 0) continue;
        
        const nextCombos: string[][] = [];
        for (const combo of combinations) {
            for (const val of vals) {
                nextCombos.push([...combo, val]);
            }
        }
        combinations = nextCombos;
    }

    if (combinations.length === 0 || combinations[0].length === 0) {
        setEditingProduct({...editingProduct, atributos: newAttrs, variantes: []});
        return;
    }

    const currentVariants = editingProduct.variantes || [];
    const newVariants = combinations.map(combo => {
        const comboName = combo.join(' / ');
        const existing = currentVariants.find((v: any) => v.nombre === comboName);
        if (existing) return existing;
        return {
            id: `v-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
            nombre: comboName,
            stock: editingProduct.stock || 0,
            precio: editingProduct.precio || 0,
            minimo_alerta: editingProduct.minimo_alerta || 0,
            imagen: ''
        };
    });

    setEditingProduct({...editingProduct, atributos: newAttrs, variantes: newVariants});
  };

  const applyBulkToVariants = () => {
     if (!editingProduct.variantes || editingProduct.variantes.length === 0) return;
     const newVariantes = editingProduct.variantes.map((v: any) => ({
         ...v,
         stock: bulkStock !== '' ? bulkStock : v.stock,
         precio: bulkPrice !== '' ? bulkPrice : v.precio
     }));
     setEditingProduct({...editingProduct, variantes: newVariantes});
     toast.success('Valores aplicados a todas las variantes');
  };

  useEffect(() => {
    loadData();
    const fetchCategories = async () => {
      try {
        const { data } = await supabase.from('insumos').select('categoria').neq('categoria', null);
        if (data && data.length > 0) {
          const uniqueCats = Array.from(new Set(data.map(d => d.categoria).filter(Boolean))) as string[];
          setCategories(uniqueCats);
        }
      } catch (e) {}
    };
    const fetchWorkflows = async () => {
      try {
        const { data } = await supabase.from('flujos').select('id, name');
        if (data) setWorkflows(data);
      } catch (e) {}
    };
    fetchCategories();
    fetchWorkflows();
  }, [session, userRole]);

  useEffect(() => {
    if (editingProduct && editingProduct.id) {
      const localProductExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      const extra = localProductExtras[editingProduct.id] || {};
      if (editingProduct.pago_mercadopago === undefined) {
        setEditingProduct((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            drive_stl_link: prev.drive_stl_link !== undefined ? prev.drive_stl_link : (extra.drive_stl_link || ''),
            descripcion_mayorista: prev.descripcion_mayorista !== undefined ? prev.descripcion_mayorista : (extra.descripcion_mayorista || ''),
            assigned_workflow_id: prev.assigned_workflow_id !== undefined ? prev.assigned_workflow_id : (extra.assigned_workflow_id || ''),
            pago_mercadopago: extra.pago_mercadopago || false,
            mp_payout_term: extra.mp_payout_term || '14days',
            pricing_calculation_mode: extra.pricing_calculation_mode || 'from_base',
            precio_base: extra.precio_base || prev.precio_base || prev.precio || 0,
            has_mp_connected: extra.has_mp_connected || false,
            mp_client_id: extra.mp_client_id || '',
            mp_seller_cuit: extra.mp_seller_cuit || '',
          };
        });
      }
    }
  }, [editingProduct?.id]);

  useEffect(() => {
    const fetchAiItems = async () => {
      try {
        const { data: sups } = await supabase.from('proveedores').select('id, nombre');
        const localSuppliersExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
        const itemsList: any[] = [];
        
        // Map of supplier ID to name
        const supplierNames: Record<string, string> = {};
        if (sups) {
          sups.forEach(s => {
            supplierNames[s.id] = s.nombre;
          });
        }

        Object.entries(localSuppliersExtras).forEach(([supplierId, extra]: [string, any]) => {
          const sName = supplierNames[supplierId] || 'Proveedor Desconocido';
          if (extra.items_provee && extra.items_provee.length > 0) {
            extra.items_provee.forEach((item: any) => {
              itemsList.push({
                supplierId,
                supplierName: sName,
                nombre: item.nombre,
                precio: item.precio || 0,
                last_updated: extra.last_updated || '24/05/2026',
                emite_factura: extra.emite_factura || false,
                importado_ocr: extra.importado_ocr !== undefined ? extra.importado_ocr : true
              });
            });
          }
        });
        setAiItems(itemsList);
      } catch (err) {
        console.error("Error reading AI-saved items: ", err);
      }
    };
    if (currentSection === 'ai_items') {
      fetchAiItems();
    }
  }, [currentSection, session]);

  const loadData = async () => {
    setLoading(true);
    
    // Fallback inicial ultra-rápido desde el caché local
    let cachedProductsLoaded = false;
    try {
      const cachedProds = localStorage.getItem('g3d_mis_productos_cache');
      if (cachedProds) {
        const parsedProds = JSON.parse(cachedProds);
        if (Array.isArray(parsedProds) && parsedProds.length > 0) {
          setProducts(parsedProds);
          cachedProductsLoaded = true;
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el caché inicial en MisProductosView:", e);
    }

    try {
      let query = supabase.from('g3d_productos').select('*');
      if (!isMainStore && session?.user?.id) {
        query = query.eq('negocio_id', session.user.id);
      }
      const { data: productos, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      const { data: variantes } = await supabase.from('g3d_producto_variantes').select('*');
      const { data: atributos } = await supabase.from('g3d_producto_atributos').select('*');

      let localExtras = {};
      try {
        localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      } catch (e) {
        console.error("Error al parsear g3d_productos_extras:", e);
      }

      const fullProducts = (productos || []).map(p => {
        const extra = (localExtras as any)[p.id] || {};
        const parsedImgs = getProductImages(p);
        return {
          ...p,
          precio: p.precio_base,
          stock: p.stock_global,
          categoria: p.categoria_texto,
          imagenes: parsedImgs,
          imagen: parsedImgs[0] || '',
          variantes: (variantes?.filter(v => v.producto_id === p.id) || []).map(v => {
            const vImgs = getProductImages(v);
            return {
              ...v,
              imagenes: vImgs,
              imagen: vImgs[0] || ''
            };
          }),
          atributos: atributos?.filter(a => a.producto_id === p.id).map(a => ({
             nombre: a.nombre,
             valores: a.valores.join(', ')
          })) || [],
          tiempo_entrega: p.modalidad === 'inmediata' ? 'Inmediata' : `Entre ${p.delivery_min || 1} y ${p.delivery_max || 3} días`,
          drive_stl_link: p.drive_stl_link || extra.drive_stl_link || '',
          descripcion_mayorista: p.descripcion_mayorista || extra.descripcion_mayorista || p.descripcion || '',
          assigned_workflow_id: extra.assigned_workflow_id || ''
        };
      });

      setProducts(fullProducts);

      // Guardar en caché para futuros accesos instantáneos y soporte offline
      try {
        localStorage.setItem('g3d_mis_productos_cache', JSON.stringify(fullProducts));
      } catch (cacheErr) {
        console.warn("No se pudo guardar g3d_mis_productos_cache:", cacheErr);
      }

    } catch (e: any) {
      console.error("Error cargando productos en MisProductosView:", e);
      if (cachedProductsLoaded) {
        toast.info("Mostrando productos locales (Modo offline / Conexión inestable).");
      } else {
        toast.error('Error cargando productos: ' + (e.message || e));
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string, currentlyPublished: boolean) => {
    try {
      const product = products.find(p => p.id === id);
      if (!currentlyPublished && product?.stock === 0 && product?.modalidad === 'inmediata') {
        toast.error('No puedes publicar un producto con entrega inmediata sin stock.');
        return;
      }

      const newStatus = !currentlyPublished;
      const { error } = await supabase.from('g3d_productos').update({
        publicado: newStatus,
        estado: newStatus ? 'Activo' : 'Pausado'
      }).eq('id', id);
      
      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, publicado: newStatus, estado: newStatus ? 'Activo' : 'Pausado' } : p
      ));
      toast.success(newStatus ? 'Producto publicado' : 'Publicación pausada');
    } catch (err: any) {
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    
    try {
      const isNew = editingProduct.id.startsWith('p-');
      const isFullEdit = editingProduct._isFullEdit;
      const isImmediata = editingProduct.modalidad === 'inmediata';
      const actualStock = parseInt(editingProduct.stock) || 0;
      const isAutoPaused = isImmediata && actualStock <= 0;
      const actualPublish = isAutoPaused ? false : editingProduct.publicado;
      const actualEstado = actualPublish ? 'Activo' : 'Pausado';
      
      const payload: any = {
        nombre: editingProduct.nombre,
        precio_base: editingProduct.precio || 0,
        stock_global: actualStock,
        minimo_alerta: parseInt(editingProduct.minimo_alerta) || 0,
        publicado: actualPublish ?? true,
        estado: actualEstado,
        imagenes: editingProduct.imagenes || [],
        modalidad: editingProduct.modalidad || 'inmediata',
        categoria_texto: editingProduct.categoria || 'Impresión 3D'
      };

      if (isImmediata) {
         payload.delivery_min = 0;
         payload.delivery_max = 0;
      } else {
         payload.delivery_min = parseInt(editingProduct.delivery_min) || 1;
         payload.delivery_max = parseInt(editingProduct.delivery_max) || 3;
         payload.requiere_sena = editingProduct.requiere_sena || false;
         payload.sena_porcentaje = parseInt(editingProduct.sena_porcentaje) || 50;
         payload.sena_tolerancia_dias = parseInt(editingProduct.sena_tolerancia_dias) || 15;
      }

      if (isNew || isFullEdit) {
        payload.descripcion = editingProduct.descripcion || '';
        payload.instrucciones_internas = editingProduct.instrucciones_internas || '';
        payload.detalle_cliente = editingProduct.detalle_cliente || '';
        payload.envio_propio = editingProduct.envio_propio || false;
        payload.costo_envio = parseInt(editingProduct.costo_envio) || 0;
        payload.zona_cobertura = editingProduct.zona_cobertura || '';
        payload.envio_uber = editingProduct.envio_uber || false;
        payload.envio_uber_moto = editingProduct.envio_uber_moto || false;
        payload.envio_uber_auto = editingProduct.envio_uber_auto || false;
        payload.pago_transferencia = editingProduct.pago_transferencia ?? true;
        payload.pago_efectivo = editingProduct.pago_efectivo || false;
        
        if (isNew) {
           payload.negocio_id = session?.user?.id || null;
        }
      }

      let returnedId = editingProduct.id;

      if (isNew) {
        const { data, error } = await supabase.from('g3d_productos').insert([payload]).select().single();
        if (error) throw error;
        returnedId = data.id;
      } else {
        const { error } = await supabase.from('g3d_productos').update(payload).eq('id', returnedId);
        if (error) throw error;
      }

      // Guardar campos especiales localmente para soportar el catálogo inteligente
      const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      localExtras[returnedId] = {
         drive_stl_link: editingProduct.drive_stl_link || '',
         descripcion_mayorista: editingProduct.descripcion_mayorista || '',
         assigned_workflow_id: editingProduct.assigned_workflow_id || '',
         pago_mercadopago: editingProduct.pago_mercadopago || false,
         mp_payout_term: editingProduct.mp_payout_term || '14days',
         pricing_calculation_mode: editingProduct.pricing_calculation_mode || 'from_base',
         precio_base: editingProduct.precio_base || 0,
         has_mp_connected: editingProduct.has_mp_connected || false,
         mp_client_id: editingProduct.mp_client_id || '',
         mp_seller_cuit: editingProduct.mp_seller_cuit || '',
      };
      localStorage.setItem('g3d_productos_extras', JSON.stringify(localExtras));

      // Guardar Atributos y Variantes si los hay
      if (isNew || isFullEdit) {
         // Borrar anteriores
         if (!isNew) {
            await supabase.from('g3d_producto_atributos').delete().eq('producto_id', returnedId);
            await supabase.from('g3d_producto_variantes').delete().eq('producto_id', returnedId);
         }

         const attrsToInsert = (editingProduct.atributos || []).map((a: any) => ({
             producto_id: returnedId,
             nombre: a.nombre,
             valores: Array.isArray(a.valores) ? a.valores : a.valores.split(',').map((v: string) => v.trim()).filter(Boolean)
         }));

         if (attrsToInsert.length > 0) {
             await supabase.from('g3d_producto_atributos').insert(attrsToInsert);
             
             const varsToInsert = (editingProduct.variantes || []).map((v: any) => ({
                 producto_id: returnedId,
                 combinacion: v.combinacion,
                 precio: v.precio || 0,
                 stock: v.stock || 0,
                 minimo_alerta: v.minimo_alerta || 0,
                 imagen_idx: v.imagen_idx,
                 sku: v.sku || null
             }));
             if (varsToInsert.length > 0) {
                await supabase.from('g3d_producto_variantes').insert(varsToInsert);
             }
         }
      }

      toast.success("Producto guardado exitosamente");
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Error guardando: ' + err.message);
    }
  };

  const [selectedFabId, setSelectedFabId] = useState('');
  const [selectedFabQty, setSelectedFabQty] = useState('');

  const handleAddFabComponentToForm = (fabId: string, quantityStr: string) => {
    if (!fabId || !quantityStr) return;
    const qty = parseFloat(quantityStr) || 0;
    if (qty <= 0) return;
    
    // Check if already exists
    const existingIdx = priceItemForm.items_insumos.findIndex(x => x.fab_item_id === fabId);
    if (existingIdx > -1) {
      const updated = [...priceItemForm.items_insumos];
      updated[existingIdx].cantidad += qty;
      setPriceItemForm({ ...priceItemForm, items_insumos: updated });
    } else {
      setPriceItemForm({
        ...priceItemForm,
        items_insumos: [...priceItemForm.items_insumos, { fab_item_id: fabId, cantidad: qty }]
      });
    }
  };

  const handleRemoveFabComponentFromForm = (fabId: string) => {
    setPriceItemForm({
      ...priceItemForm,
      items_insumos: priceItemForm.items_insumos.filter(x => x.fab_item_id !== fabId)
    });
  };

  if (currentTab === 'g3d_precios') {
    return (
      <div className="space-y-8 pb-12 text-slate-900 dark:text-white text-left">
        
        {/* Header de la Sección */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                  Módulo G3D
                </span>
                <h1 className="text-xl font-extrabold text-slate-850 dark:text-white tracking-tight">Lista de Precios y Costos de Fabricación</h1>
              </div>
              <p className="text-slate-500 font-medium text-xs mt-0.5">Calcula costos de impresión 3D, márgenes y mantén tus precios actualizados.</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => {
                setSearchParams({ tab: 'catalog' });
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer w-1/2 md:w-auto text-center"
            >
              Volver al Catálogo
            </button>
            <button 
              onClick={() => {
                setEditingPriceItem(null);
                setPriceItemForm({
                  nombre: '',
                  categoria: 'Impresión 3D',
                  precio_publico: '',
                  tiempo_horas: '4',
                  items_insumos: []
                });
                setSelectedFabId('');
                setSelectedFabQty('');
                setIsG3dPriceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer w-1/2 md:w-auto"
            >
              <Plus size={16} />
              Nuevo Precio Catálogo
            </button>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Principal: Lista de Precios del Catálogo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Grid size={18} className="text-primary" />
                    Lista de Precios de Venta
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Muestra los valores al público y calcula el costo real según sus componentes asignados.</p>
                </div>
              </div>

              {g3dPriceItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  No hay productos registrados en el catálogo de precios.
                </div>
              ) : (
                <div className="space-y-4">
                  {g3dPriceItems.map((item) => {
                    const cost = getFabricationCost(item.items_insumos);
                    const publicPrice = item.precio_publico || 0;
                    const profit = publicPrice - cost;
                    const marginPct = publicPrice > 0 ? Math.round((profit / publicPrice) * 100) : 0;
                    const markup = cost > 0 ? (publicPrice / cost).toFixed(1) : '0.0';

                    return (
                      <div 
                        key={item.id} 
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/[0.3] dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between gap-4 transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                              {item.categoria}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ID: {item.id}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{item.nombre}</h3>
                          
                          {/* Componentes asignados */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.items_insumos && item.items_insumos.length > 0 ? (
                              item.items_insumos.map((com: any, cidx: number) => {
                                const matchedFab = g3dFabItems.find(f => f.id === com.fab_item_id);
                                return (
                                  <span key={cidx} className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200/50 dark:border-slate-800/40 font-semibold">
                                    {matchedFab ? matchedFab.nombre : 'Insumo'} ({com.cantidad}{matchedFab ? matchedFab.unidad : ''})
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-rose-500 dark:text-rose-400 font-extrabold uppercase tracking-wide">⚠ Sin componentes o costos asignados</span>
                            )}
                          </div>
                        </div>

                        {/* Financial stats of this pricing item */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                          
                          {/* Costo fabricacion */}
                          <div className="text-right min-w-[70px]">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Costo Fab.</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              ${cost.toLocaleString()}
                            </span>
                          </div>

                          {/* Precio público */}
                          <div className="text-right min-w-[70px]">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">P. Público</span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              ${publicPrice.toLocaleString()}
                            </span>
                          </div>

                          {/* Margen */}
                          <div className="text-right min-w-[70px]">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Margen</span>
                            <span className={cn(
                              "text-xs font-black block",
                              marginPct > 50 ? "text-emerald-600 dark:text-emerald-400" : marginPct > 25 ? "text-orange-500" : "text-rose-500"
                            )}>
                              {marginPct}% ({markup}x)
                            </span>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-1.5 pl-2">
                            <button 
                              onClick={() => {
                                setEditingPriceItem(item);
                                setPriceItemForm({
                                  nombre: item.nombre,
                                  categoria: item.categoria || 'Impresión 3D',
                                  precio_publico: String(item.precio_publico),
                                  tiempo_horas: String(item.tiempo_horas || 4),
                                  items_insumos: item.items_insumos || []
                                });
                                setSelectedFabId('');
                                setSelectedFabQty('');
                                setIsG3dPriceModalOpen(true);
                              }}
                              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeletePriceItem(item.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Insumos, Tiempos de Máquina y Costos Base de Fabricación */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Settings size={18} className="text-orange-500" />
                    Insumos y Costos Base
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Componentes con los que se fabrican las piezas. No descuentan stock físico de venta.</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setEditingFabItem(null);
                  setFabItemForm({
                    nombre: '',
                    tipo: 'Insumo',
                    unidad: 'g',
                    costo_unitario: ''
                  });
                  setIsG3dFabModalOpen(true);
                }}
                className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 mb-4"
              >
                <Plus size={14} />
                Agregar Insumo/Costo Base
              </button>

              {g3dFabItems.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Sin insumos base guardados.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {g3dFabItems.map((fab) => (
                    <div key={fab.id} className="py-3 flex justify-between items-center gap-3">
                      <div>
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md",
                          fab.tipo === 'Insumo' ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400" :
                          fab.tipo === 'Máquina' ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                          "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400"
                        )}>
                          {fab.tipo}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1 uppercase block truncate max-w-[150px]">
                          {fab.nombre}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-slate-400 uppercase">Costo Base</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                            ${fab.costo_unitario} <span className="text-[10px] text-slate-400 font-semibold">/ {fab.unidad}</span>
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setEditingFabItem(fab);
                              setFabItemForm({
                                  nombre: fab.nombre,
                                  tipo: fab.tipo || 'Insumo',
                                  unidad: fab.unidad || 'g',
                                  costo_unitario: String(fab.costo_unitario)
                              });
                              setIsG3dFabModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFabItem(fab.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal: Crear/Editar Costo Base */}
        {isG3dFabModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white">
              
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  {editingFabItem ? 'Editar Costo de Insumo' : 'Agregar Costo de Insumo'}
                </h3>
                <button onClick={() => setIsG3dFabModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Nombre del Componente *</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Filamento PLA Premium"
                    value={fabItemForm.nombre}
                    onChange={e => setFabItemForm({ ...fabItemForm, nombre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                                    <div>
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

        {/* Modal de edición de producto G3D (Completa / Rápida) */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-white">
              
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingProduct.id.startsWith('p-') ? 'Crear Producto G3D' : 'Editar Producto G3D'}
                </h3>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {editingProduct._isFullEdit ? (
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
                                          className={`px-1.5 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer ${
                                             v.usar_imagenes_padre !== false
                                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
                                          }`}
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
                                          className={`px-1.5 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer ${
                                             v.usar_imagenes_padre === false
                                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
                                          }`}
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
                                             <option key={i} value={i}>Foto #${i+1}</option>
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
<td className="p-2 font-bold text-slate-800 dark:text-slate-200 text-[10px]">{v.nombre}</td>
                                      {editingProduct.modalidad === 'inmediata' && (
                                        <>
                                          <td className="p-1">
                                             <input 
                                               type="number" 
                                               value={v.stock} 
                                               onChange={e => {
                                                  const newVars = [...editingProduct.variantes];
                                                  newVars[vIdx].stock = parseInt(e.target.value) || 0;
                                                  setEditingProduct({...editingProduct, variantes: newVars});
                                               }}
                                               className="w-full text-center font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px]"
                                             />
                                          </td>
                                          <td className="p-1">
                                             <input 
                                               type="number" 
                                               value={v.minimo_alerta} 
                                               onChange={e => {
                                                  const newVars = [...editingProduct.variantes];
                                                  newVars[vIdx].minimo_alerta = parseInt(e.target.value) || 0;
                                                  setEditingProduct({...editingProduct, variantes: newVars});
                                               }}
                                               className="w-full text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px]"
                                             />
                                          </td>
                                        </>
                                      )}
                                      <td className="p-1.5 pr-2 flex items-center gap-1">
                                         <span className="text-slate-400 font-bold text-[10px]">$</span>
                                         <input 
                                           type="number" 
                                           value={v.precio} 
                                           onChange={e => {
                                              const newVars = [...editingProduct.variantes];
                                              newVars[vIdx].precio = parseInt(e.target.value) || 0;
                                              setEditingProduct({...editingProduct, variantes: newVars});
                                           }}
                                           className="w-full text-right bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1 font-bold text-slate-900 dark:text-white text-[10px]"
                                         />
                                      </td>
                                   </tr>
                                   <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                      <td colSpan={editingProduct.modalidad === 'inmediata' ? 5 : 3} className="py-1 px-2 border-b border-slate-100 dark:border-slate-700/50">
                                         <div className="flex justify-end text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                                            Ganancia Neta: <span className="text-slate-400 font-normal">${pBase.toLocaleString()}</span> &nbsp;|&nbsp; Público en Tienda ({percPlat}% plat{editingProduct.pago_mercadopago ? ' + MP' : ''}): <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">${Math.round(pFinal).toLocaleString()}</span>
                                         </div>
                                      </td>
                                   </tr>
                                 </React.Fragment>
                               )})}
                             </tbody>
                           </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                // FORMULARIO EDICION RAPIDA (Lo original)
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Nombre del Producto</label>
                    <input 
                      value={editingProduct.nombre}
                      onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-colors duration-150"
                    />
                  </div>

                  {(!editingProduct.variantes || editingProduct.variantes.length === 0) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Stock Disp.</label>
                        <input 
                          type="number"
                          value={editingProduct.stock}
                          onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-colors duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Mín alert</label>
                        <input 
                          type="number"
                          value={editingProduct.minimo_alerta || 0}
                          onChange={e => setEditingProduct({...editingProduct, minimo_alerta: parseInt(e.target.value) || 0})}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-colors duration-150"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-2 text-center rounded-md border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 font-bold tracking-widest">
                       Para editar el stock por variante,<br/> usa la <strong>Edición completa</strong>.
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Imágenes del Producto</label>
                    <ImageManager 
                      images={editingProduct.imagenes || []}
                      onChange={(imgs) => setEditingProduct({...editingProduct, imagenes: imgs})}
                    />
                  </div>

                  {isMainStore && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/30">
                      <label className="block text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase mb-1.5">Flujo Productivo (Simulación)</label>
                      <select 
                        className="w-full bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800/30 rounded-lg p-1.5 text-xs font-bold text-amber-900 dark:text-amber-300"
                      >
                        <option>Impresión Premium (Con lijado y pintura)</option>
                        <option>Impresión Básica (Sin pintura)</option>
                        <option>Digital (Inmediato)</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-4">
              {!(editingProduct.id.startsWith('p-') || editingProduct._isFullEdit) ? (
                <button
                  onClick={() => setEditingProduct({...editingProduct, _isFullEdit: true})}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors underline decoration-dotted underline-offset-2 ml-1"
                >
                  Editar artículo completo
                </button>
              ) : <div />}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150 shadow flex items-center justify-center min-w-[120px]"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
}

