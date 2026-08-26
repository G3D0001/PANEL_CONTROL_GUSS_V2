import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Plus, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Building2, 
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
  Map,
  Package,
  Copy,
  Check,
  Compass,
  FileText,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
  Globe,
  FileImage,
  Brain,
  Upload,
  MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { CascadingCategorySelector } from './CascadingCategorySelector';
import { Switch3D } from './Switch3D';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type ViewMode = 'table' | 'grid';

const PROVINCES_LIST = [
  "Buenos Aires",
  "Capital Federal (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
];

const ITEM_CATEGORIES = [
  "Filamentos -> PLA -> Nacional",
  "Filamentos -> PLA -> Importado",
  "Filamentos -> PETG -> Premium",
  "Filamentos -> ABS -> Técnico",
  "Resinas -> Standard -> LCD/SLA",
  "Insumos -> Boquillas -> Bronce",
  "Insumos -> Boquillas -> Hardened Steel",
  "Repuestos -> Extrusores -> Directo",
  "Repuestos -> Hotends -> HighFlow",
  "Accesorios -> Adhesivos -> Laca",
  "Servicios -> Calibración -> Taller"
];

interface SupplierExt {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  provincia?: string;
  notas?: string;
  created_at?: string;
  // Extras locales de producción (evita alterar Supabase sin autorización)
  gps_lat?: string;
  gps_lng?: string;
  items_provee?: Array<{ id?: string; nombre: string; categoria?: string; precio: number; precio_sin_iva?: number; last_updated?: string; imagen?: string }>;
  discount_rules?: Array<{
    id: string;
    type: 'total_money' | 'same_qty' | 'mixed_qty';
    threshold: number;
    discount_pct: number;
    description?: string;
  }>;
  importado_ocr?: boolean;
  last_updated?: string;
  emite_factura?: boolean;
  iva_incluido?: boolean;
  descuento_efectivo?: number;
  descuento_transferencia?: number;
}

function InteractiveSupplierMap({ 
  lat, 
  lng, 
  onCoordsChange 
}: { 
  lat: string; 
  lng: string; 
  onCoordsChange: (lat: string, lng: string) => void;
}) {
  const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  const latVal = hasCoords ? parseFloat(lat) : -34.6037;
  const lngVal = hasCoords ? parseFloat(lng) : -58.3816;
  const mapCenter: [number, number] = [latVal, lngVal];

  function MapEvents() {
    useMapEvents({
      click(e) {
        onCoordsChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      }
    });
    return null;
  }

  function MapViewSync() {
    const map = useMap();
    useEffect(() => {
      if (hasCoords) {
        map.setView(mapCenter, 15);
      }
    }, [latVal, lngVal]);
    return null;
  }

  return (
    <div className="w-full h-full min-h-[175px] relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={hasCoords ? 15 : 11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <MapViewSync />
        {hasCoords && (
          <Marker 
            position={mapCenter}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const position = marker.getLatLng();
                onCoordsChange(position.lat.toFixed(6), position.lng.toFixed(6));
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export function SuppliersView() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'n8n_prod' | 'global_items'>('suppliers');
  const [view, setView] = useState<'list' | 'form' | 'confirm'>('list');
  const [suppliers, setSuppliers] = useState<SupplierExt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState(''); // Búsqueda de ubicación por ítem
  const [editingSupplier, setEditingSupplier] = useState<SupplierExt | null>(null);
  const [openedSupplierId, setOpenedSupplierId] = useState<string | null>(null);
  const [n8nMethodTab, setN8nMethodTab] = useState<'screenshot' | 'scraping' | 'rawtext'>('screenshot');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [viewWithIva, setViewWithIva] = useState(false); // Visualizar IVA estimado en la app

  // Estados del Prompt y Copiado
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
  const [isCopiedJson, setIsCopiedJson] = useState(false);

  // Estados para filtro e imágenes de insumos globales
  const [globalItemSearch, setGlobalItemSearch] = useState('');
  const [globalItemSupplierFilter, setGlobalItemSupplierFilter] = useState('');
  const [editingImageItem, setEditingImageItem] = useState<{
    supplierId: string;
    itemId: string;
    nombre: string;
    currentImage: string;
  } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `supplier_items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('El bucket "public_assets" no existe en Supabase. Cómputo de contingencia activo.');
        } else {
          toast.error(`Error de Storage: ${uploadError.message}`);
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      setNewImageUrl(data.publicUrl);
      toast.success('Imagen de insumo subida e incorporada al catálogo.');
    } catch (error: any) {
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    direccion: '',
    provincia: '',
    notas: '',
    gps_lat: '',
    gps_lng: '',
    items_provee_text: '',
    emite_factura: false,
    iva_incluido: false,
    descuento_efectivo: 0,
    descuento_transferencia: 0
  });

  const [formItems, setFormItems] = useState<Array<{
    id: string;
    nombre: string;
    categoria: string;
    precio_sin_iva: number;
    last_updated: string;
    imagen?: string;
  }>>([]);

  const [formDiscountRules, setFormDiscountRules] = useState<Array<{
    id: string;
    type: 'total_money' | 'same_qty' | 'mixed_qty';
    threshold: number;
    discount_pct: number;
    description: string;
  }>>([]);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showWarningSummary, setShowWarningSummary] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Estados para agregado de item individual manual rapido
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemCat, setQuickItemCat] = useState('');
  const [quickItemNet, setQuickItemNet] = useState<number | ''>('');
  const [quickItemGross, setQuickItemGross] = useState<number | ''>('');

  // Cargar Proveedores de Producción
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Obtener de Supabase (Tabla real 'proveedores')
      const supabaseSuppliers = await apiService.getSuppliers();
      
      // 2. Obtener metadatos extras de localStorage para no alterar/corromper el esquema real de Supabase
      const localExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
      
      const fullSuppliersList = (supabaseSuppliers || []).map((s: any) => {
        const extra = localExtras[s.id] || {};
        return {
          ...s,
          gps_lat: extra.gps_lat || '',
          gps_lng: extra.gps_lng || '',
          provincia: extra.provincia || '',
          items_provee: extra.items_provee || [],
          discount_rules: extra.discount_rules || [],
          importado_ocr: extra.importado_ocr !== undefined ? extra.importado_ocr : false,
          last_updated: extra.last_updated || (s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : '24/05/2026'),
          emite_factura: extra.emite_factura !== undefined ? extra.emite_factura : false,
          iva_incluido: extra.iva_incluido !== undefined ? extra.iva_incluido : false,
          descuento_efectivo: extra.descuento_efectivo !== undefined ? Number(extra.descuento_efectivo) : 0,
          descuento_transferencia: extra.descuento_transferencia !== undefined ? Number(extra.descuento_transferencia) : 0
        };
      });

      setSuppliers(fullSuppliersList);
    } catch (e) {
      console.error(e);
      toast.error('Ocurrió un problema cargando los proveedores reales.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      direccion: '',
      provincia: '',
      notas: '',
      gps_lat: '',
      gps_lng: '',
      items_provee_text: '',
      emite_factura: false,
      iva_incluido: false,
      descuento_efectivo: 0,
      descuento_transferencia: 0
    });
    setFormItems([]);
    setFormDiscountRules([]);
    setAttemptedSubmit(false);
    setShowWarningSummary(false);
    setEditingSupplier(null);
    setView('list');
  };

  const handleEdit = (supplier: SupplierExt) => {
    setEditingSupplier(supplier);
    setFormData({
      nombre: supplier.nombre,
      contacto: supplier.contacto || '',
      telefono: supplier.telefono || '',
      direccion: supplier.direccion || '',
      provincia: supplier.provincia || '',
      notas: supplier.notas || '',
      gps_lat: supplier.gps_lat || '',
      gps_lng: supplier.gps_lng || '',
      items_provee_text: '',
      emite_factura: supplier.emite_factura !== undefined ? supplier.emite_factura : false,
      iva_incluido: supplier.iva_incluido !== undefined ? supplier.iva_incluido : false,
      descuento_efectivo: supplier.descuento_efectivo !== undefined ? Number(supplier.descuento_efectivo) : 0,
      descuento_transferencia: supplier.descuento_transferencia !== undefined ? Number(supplier.descuento_transferencia) : 0
    });

    const isIvaInc = supplier.iva_incluido !== undefined ? supplier.iva_incluido : false;
    setFormItems(supplier.items_provee ? supplier.items_provee.map((i, index) => {
      const pSinIva = i.precio_sin_iva !== undefined ? Number(i.precio_sin_iva) : (isIvaInc ? Number((i.precio / 1.21).toFixed(2)) : Number(i.precio));
      return {
        id: i.id || `ITM-${String(index + 1).padStart(2, '0')}`,
        nombre: i.nombre,
        categoria: i.categoria || 'Filamentos -> PLA -> Nacional',
        precio_sin_iva: pSinIva,
        last_updated: i.last_updated || supplier.last_updated || '25/05/2026',
        imagen: i.imagen || ''
      };
    }) : []);

    setFormDiscountRules(supplier.discount_rules ? supplier.discount_rules.map((rule) => ({
      id: rule.id,
      type: rule.type,
      threshold: Number(rule.threshold),
      discount_pct: Number(rule.discount_pct),
      description: rule.description || ''
    })) : []);

    setAttemptedSubmit(false);
    setShowWarningSummary(false);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const res = await apiService.deleteSupplier(id);
    if (res.success) {
      toast.success('Proveedor eliminado correctamente.');
      // Eliminar extras de producción locales
      const localExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
      delete localExtras[id];
      localStorage.setItem('g3d_suppliers_extras', JSON.stringify(localExtras));
      
      loadAllData();
      setShowDeleteConfirm(null);
    } else {
      toast.error('Error al eliminar el proveedor.');
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la empresa es obligatorio.');
      return;
    }

    // Check if there are missing fields
    const missing = [];
    if (!formData.contacto.trim()) missing.push('Contacto');
    if (!formData.telefono.trim()) missing.push('WhatsApp/Teléfono');
    if (!formData.direccion.trim()) missing.push('Dirección física');
    if (!formData.gps_lat.trim() || !formData.gps_lng.trim()) missing.push('Ubicación GPS (Mapa)');
    if (formItems.length === 0) missing.push('Precios de Costo (Catálogo)');

    if (missing.length > 0) {
      setAttemptedSubmit(true);
      setShowWarningSummary(true);
      toast.warning('Aviso: Ficha con datos faltantes, pero puedes avanzar al resumen y proceder.');
    }

    setView('confirm');
  };

  const handleBypassAndConfirm = () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la empresa es obligatorio.');
      return;
    }
    // Set map to defaults to avoid empty map failures if bypassed
    const currentLat = formData.gps_lat || "-34.6037";
    const currentLng = formData.gps_lng || "-58.3816";
    setFormData(prev => ({
      ...prev,
      gps_lat: currentLat,
      gps_lng: currentLng
    }));
    setView('confirm');
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      const mappedItems = formItems.map(itm => {
        // Preservar la imagen si existía o venía previamente
        const originalImage = itm.imagen || editingSupplier?.items_provee?.find(o => o.id === itm.id || o.nombre === itm.nombre)?.imagen || '';
        return {
          id: itm.id,
          nombre: itm.nombre,
          categoria: itm.categoria,
          precio_sin_iva: Number(itm.precio_sin_iva || 0),
          precio: formData.iva_incluido 
            ? Number(((itm.precio_sin_iva || 0) * 1.21).toFixed(2)) 
            : Number((itm.precio_sin_iva || 0).toFixed(2)),
          last_updated: itm.last_updated,
          imagen: originalImage
        };
      });

      let returnedId = '';
      if (editingSupplier) {
        await apiService.updateSupplier(editingSupplier.id, {
          nombre: formData.nombre,
          contacto: formData.contacto,
          telefono: formData.telefono,
          direccion: formData.direccion,
          notas: formData.notes || formData.notas
        });
        returnedId = editingSupplier.id;
      } else {
        const res = await apiService.createSupplier({
          nombre: formData.nombre,
          contacto: formData.contacto,
          telefono: formData.telefono,
          direccion: formData.direccion,
          notas: formData.notas
        });
        if (res.success && res.data) {
          returnedId = res.data.id;
        }
      }

      if (returnedId) {
        const localExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} a las ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} hs`;
        
        localExtras[returnedId] = {
          gps_lat: formData.gps_lat,
          gps_lng: formData.gps_lng,
          provincia: formData.provincia,
          items_provee: mappedItems,
          discount_rules: formDiscountRules,
          importado_ocr: editingSupplier ? (editingSupplier.importado_ocr || false) : false,
          last_updated: formattedDate,
          emite_factura: formData.emite_factura,
          iva_incluido: formData.iva_incluido,
          descuento_efectivo: formData.descuento_efectivo,
          descuento_transferencia: formData.descuento_transferencia
        };
        localStorage.setItem('g3d_suppliers_extras', JSON.stringify(localExtras));

        toast.success(editingSupplier ? 'Ficha de Proveedor guardada con éxito' : 'Proveedor registrado exitosamente');
        resetForm();
        loadAllData();
      } else {
        toast.error('No se pudo guardar en Supabase.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red al guardar el proveedor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectGeocode = async (dir: string, prov: string) => {
    if (!dir.trim()) return;
    try {
      const queryParts = [dir];
      if (prov.trim()) queryParts.push(prov);
      queryParts.push('Argentina');
      const searchQuery = queryParts.join(', ');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setFormData(prev => ({
          ...prev,
          gps_lat: parseFloat(result.lat).toFixed(6),
          gps_lng: parseFloat(result.lon).toFixed(6)
        }));
        toast.success(`Mapa centrado automáticamente en: ${dir}`, {
          description: "Puedes arrastrar el pin rojo en el mapa para ajustar la precisión o hacer click.",
          duration: 3500
        });
      } else {
        // Fallback: Si no lo encuentra, busca por la Provincia elegida para no dejar el mapa en Buenos Aires por defecto
        if (prov.trim()) {
          const fallbackQuery = `${prov}, Argentina`;
          const fbResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fallbackQuery)}`
          );
          const fbData = await fbResponse.json();
          if (fbData && fbData.length > 0) {
            const result = fbData[0];
            setFormData(prev => ({
              ...prev,
              gps_lat: parseFloat(result.lat).toFixed(6),
              gps_lng: parseFloat(result.lon).toFixed(6)
            }));
            toast.warning(`Dirección exacta no encontrada. Centramos el mapa en ${prov}. ¡Haz click o arrastra el pin rojo para marcar la ubicación real!`, {
              duration: 5050
            });
            return;
          }
        }
        toast.warning(`No pudimos encontrar la ubicación de "${dir}". Por favor, centra el mapa manualmente haciendo click.`, {
          duration: 4000
        });
      }
    } catch (e) {
      console.error("Auto geocoding failed", e);
    }
  };

  const handleAddressAutoGeocode = (newDir: string, newProv: string) => {
    if (newDir.trim()) {
      fetchDirectGeocode(newDir, newProv);
    }
  };

  const handleQuickAddItem = (supplierId: string) => {
    if (!quickItemName.trim()) {
      toast.error('Ingresa el nombre del insumo / SKU.');
      return;
    }
    const netVal = Number(quickItemNet) || 0;
    if (netVal <= 0) {
      toast.error('Ingresa un costo neto válido.');
      return;
    }
    
    // Obtener catálogo existente de extras de localStorage
    const localExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
    const extra = localExtras[supplierId] || {};
    const existingItems = extra.items_provee || [];
    
    // Generar un id unico simplificado
    const newId = `ITM-${Date.now().toString().slice(-6)}`;
    
    // En el catalogo se guarda el "precio_sin_iva" como valor core
    // y para el precio redondeado publico, calculamos con o sin IVA segun el de la ficha
    const newItem = {
      id: newId,
      nombre: quickItemName.trim(),
      categoria: quickItemCat || "Filamentos -> PLA -> Nacional",
      precio_sin_iva: netVal,
      precio: extra.iva_incluido ? Number((netVal * 1.21).toFixed(2)) : Number(netVal.toFixed(2)),
      last_updated: new Date().toLocaleDateString('es-AR')
    };
    
    const updatedItems = [...existingItems, newItem];
    
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} a las ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} hs`;
    
    localExtras[supplierId] = {
      ...extra,
      items_provee: updatedItems,
      last_updated: formattedDate
    };
    
    localStorage.setItem('g3d_suppliers_extras', JSON.stringify(localExtras));
    
    toast.success(`Insumo "${quickItemName}" añadido exitosamente al catálogo del proveedor!`);
    
    // Reset inputs
    setQuickItemName('');
    setQuickItemCat('');
    setQuickItemNet('');
    setQuickItemGross('');
    
    // Refresh visual state
    loadAllData();
  };

  // Función de geolocalización real usando el servicio público API Nominatim de OpenStreetMap (100% libre, sin simulator)
  const geocodeAddress = async () => {
    if (!formData.direccion.trim()) {
      toast.error('Ingresa una dirección en el campo de texto antes de geolocalizar.');
      return;
    }
    setGeocoding(true);
    toast.info('Consultando coordenadas mediante OpenStreetMap Nominatim...');
    try {
      // Concatenar dirección, provincia y país para una geolocalización de alta precisión
      const queryParts = [formData.direccion];
      if (formData.provincia.trim()) {
        queryParts.push(formData.provincia);
      }
      queryParts.push('Argentina');
      const searchQuery = queryParts.join(', ');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setFormData(prev => ({
          ...prev,
          gps_lat: parseFloat(result.lat).toFixed(6),
          gps_lng: parseFloat(result.lon).toFixed(6)
        }));
        toast.success(`¡Coordenadas obtenidas en base a "${searchQuery}"!`);
      } else {
        toast.warning('No se encontraron coordenadas específicas. Por favor ingréselas manualmente.');
      }
    } catch (error) {
      console.error('Error en geocoding real:', error);
      toast.error('No se pudo geolocalizar la dirección en tiempo real. Intente ingresar un formato simple.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleBulkParse = () => {
    if (!bulkText.trim()) {
      toast.error('Por favor, pegue algún texto para procesar.');
      return;
    }
    
    // Split by lines
    const lines = bulkText.split('\n');
    const parsedItems: any[] = [];
    let lineCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Match format: "Name : Price" or "Name Price" or "Name - Price"
      let name = '';
      let price = 0;

      if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        name = parts[0].trim();
        price = parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 0;
      } else if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        name = parts[0].trim();
        price = parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 0;
      } else {
        // Find last space
        const lastSpace = trimmed.lastIndexOf(' ');
        if (lastSpace !== -1) {
          name = trimmed.substring(0, lastSpace).trim();
          price = parseFloat(trimmed.substring(lastSpace).replace(/[^0-9.]/g, '')) || 0;
        } else {
          name = trimmed;
          price = 0;
        }
      }

      if (name) {
        lineCount++;
        parsedItems.push({
          id: `BULK-${lineCount}-${Date.now().toString().slice(-4)}`,
          nombre: name,
          categoria: 'Filamentos -> PLA -> Nacional',
          precio_sin_iva: price,
          last_updated: new Date().toLocaleDateString('es-AR')
        });
      }
    });

    if (parsedItems.length === 0) {
      toast.error('No se pudo identificar ningún insumo. Use formato "Insumo: 12000"');
      return;
    }

    setFormItems([...formItems, ...parsedItems]);
    setShowBulkModal(false);
    toast.success(`¡Procesado exitoso! Se importaron ${parsedItems.length} insumos al catálogo.`);
  };

  const copyPromptToClipboard = () => {
    const promptText = `Eres un extractor de datos de presupuestos de insumos 3D altamente preciso.
Recibirás un documento PDF, una imagen/captura de pantalla de WhatsApp, o un texto raw.
Debes extraer un JSON estructurado de la siguiente forma libre de cualquier otro texto:
{
  "nombre": "Nombre de la Empresa o Razón Social",
  "contacto": "Nombre de la persona o asesor de contacto (dejar en blanco si no se declara)",
  "telefono": "Número de WhatsApp o teléfono directo de ventas con código de área (dejar en blanco si no se declara)",
  "direccion": "Dirección física postal exacta para geolocalización (dejar en blanco si no se declara)",
  "notas": "Notas adicionales o vigencia del presupuesto",
  "items_provee": [
    { "nombre": "Nombre exacto del filamento, resina o insumo", "precio": 12500 }
  ]
}

REGLA DE ORO DE EXTRACTO: No asumas datos que no existen. Si no hay teléfono o dirección, déjalos estrictamente en blanco (""). El Panel de Control G3D alertará al usuario sobre estos datos faltantes para que los complete manualmente.`;

    navigator.clipboard.writeText(promptText);
    setIsCopiedPrompt(true);
    toast.success('Prompt de n8n copiado al portapapeles');
    setTimeout(() => setIsCopiedPrompt(false), 2000);
  };

  const copyJsonToClipboard = () => {
    const jsonExample = `{
  "nombre": "Distribuidora PLA 3D",
  "contacto": "Juan Pérez",
  "telefono": "+541155667788",
  "direccion": "Lavalle 950, CABA, Argentina",
  "notas": "Precios vigentes hasta fin de mes. Descuento 5% por transferencias.",
  "items_provee": [
    { "nombre": "PLA Premium 1KG", "precio": 14500 },
    { "nombre": "ABS High Gloss 1KG", "precio": 15800 }
  ]
}`;
    navigator.clipboard.writeText(jsonExample);
    setIsCopiedJson(true);
    toast.success('Estructura JSON copiada al portapapeles');
    setTimeout(() => setIsCopiedJson(false), 2000);
  };

  // Filtrado de proveedores reales
  const filteredSuppliers = suppliers.filter(s => {
    const matchesGeneral = 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contacto && s.contacto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.direccion && s.direccion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesItems = itemSearchTerm === '' || (s.items_provee && s.items_provee.some(item => 
      item.nombre.toLowerCase().includes(itemSearchTerm.toLowerCase())
    ));

    return matchesGeneral && matchesItems;
  });

  // Consolidar todos los ítems cargados de los proveedores con su respectivo negocio asociado
  const allSupplierItemsForGlobal = React.useMemo(() => {
    const list: Array<{
      id: string; // ID visual único
      itemKey: string; // ID original del ítem
      nombre: string;
      categoria?: string;
      precio_sin_iva: number;
      last_updated?: string;
      imagen?: string;
      supplierId: string;
      supplierNombre: string;
      emite_factura: boolean;
      iva_incluido?: boolean;
    }> = [];

    suppliers.forEach((s) => {
      if (s.items_provee) {
        s.items_provee.forEach((item: any, idx: number) => {
          list.push({
            id: `${s.id}-${item.id || idx}`,
            itemKey: item.id || `itm-${idx}`,
            nombre: item.nombre,
            categoria: item.categoria,
            precio_sin_iva: item.precio_sin_iva !== undefined ? Number(item.precio_sin_iva) : (item.precio ? Number(item.precio) : 0),
            last_updated: item.last_updated || s.last_updated || '25/05/2026',
            imagen: item.imagen || '',
            supplierId: s.id,
            supplierNombre: s.nombre,
            emite_factura: !!s.emite_factura,
            iva_incluido: !!s.iva_incluido
          });
        });
      }
    });

    return list;
  }, [suppliers]);

  // Filtrado reactivo de items globales
  const filteredGlobalItems = React.useMemo(() => {
    return allSupplierItemsForGlobal.filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(globalItemSearch.toLowerCase()) || 
                            (item.categoria && item.categoria.toLowerCase().includes(globalItemSearch.toLowerCase()));
      const matchesSupplier = !globalItemSupplierFilter || item.supplierId === globalItemSupplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [allSupplierItemsForGlobal, globalItemSearch, globalItemSupplierFilter]);

  // Actualizar imagen para un ítem en localStorage
  const handleSaveItemImage = (supplierId: string, itemId: string, imageUrl: string) => {
    const localExtras = JSON.parse(localStorage.getItem('g3d_suppliers_extras') || '{}');
    if (localExtras[supplierId]) {
      const extra = localExtras[supplierId];
      const items = extra.items_provee || [];
      const updatedItems = items.map((itm: any) => {
        if (itm.id === itemId) {
          return { ...itm, imagen: imageUrl };
        }
        return itm;
      });
      localExtras[supplierId] = {
        ...extra,
        items_provee: updatedItems
      };
      localStorage.setItem('g3d_suppliers_extras', JSON.stringify(localExtras));
      toast.success('Imagen del insumo actualizada con éxito');
      setEditingImageItem(null);
      setNewImageUrl('');
      loadAllData();
    } else {
      toast.error('No se encontró la información del proveedor');
    }
  };

  // Helper de validación de datos faltantes para alertas (Aplica a todo proveedor)
  const checkMissingFields = (s: SupplierExt) => {
    const missing = [];
    if (!s.contacto?.trim()) missing.push('Contacto');
    if (!s.telefono?.trim()) missing.push('WhatsApp/Teléfono');
    if (!s.direccion?.trim()) missing.push('Dirección física');
    if (!s.gps_lat?.trim() || !s.gps_lng?.trim()) missing.push('Ubicación GPS');
    if (!s.items_provee || s.items_provee.length === 0) missing.push('Precios de Costo');
    return missing;
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Truck size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase block">Abastecimiento y Talleres G3D</span>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
              Gestión de Proveedores Real
            </h1>
            <p className="text-slate-505 text-xs font-semibold">
              Registra costos mayoristas, mapea ubicaciones GPS reales de retiro y asocia flujos n8n para digitalizar WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { resetForm(); setView('form'); }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold leading-none shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            Crear Proveedor Manual
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 dark:border-slate-850">
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={cn(
            "px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === 'suppliers' 
              ? "border-indigo-600 text-slate-900 dark:text-white" 
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <Building2 size={14} />
          📦 Mis Proveedores ({filteredSuppliers.length})
        </button>
        <button 
          onClick={() => setActiveTab('global_items')}
          className={cn(
            "px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === 'global_items' 
              ? "border-indigo-600 text-slate-900 dark:text-white" 
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <Package size={14} className="text-emerald-550" />
          ✨ Insumos de Proveedores ({allSupplierItemsForGlobal.length})
        </button>
        <button 
          onClick={() => setActiveTab('n8n_prod')}
          className={cn(
            "px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === 'n8n_prod' 
              ? "border-indigo-600 text-slate-900 dark:text-white" 
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <Sparkles size={14} className="text-indigo-550" />
          🔌 Integración n8n Real (Producción)
        </button>
      </div>

      {/* MÓDULO 1: LISTADO DE PROVEEDORES REALES */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {view === 'list' ? (
            <div className="space-y-5">
              {/* Barra de Búsqueda Dual */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="md:col-span-6 relative">
                  <span className="text-[9px] uppercase font-black text-slate-400 block mb-1 text-left ml-1">Buscar Empresa / Dirección</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre, contacto o dirección..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                  </div>
                </div>

                <div className="md:col-span-6 relative border-t md:border-t-0 md:border-l dark:border-slate-800 pt-2 md:pt-0 md:pl-3">
                  <span className="text-[9px] uppercase font-black text-indigo-500 block mb-1 text-left ml-1">🔎 ¿Dónde consigo un Ítem? (Buscador Mayorista)</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Escribe el insumo (ej: ABS, PLA, Resina)..."
                      value={itemSearchTerm}
                      onChange={e => setItemSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-indigo-200/50 dark:border-indigo-900/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                    <Package className="absolute left-2.5 top-2.5 text-indigo-500" size={13} />
                    {itemSearchTerm && (
                      <button 
                        onClick={() => setItemSearchTerm('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de Proveedores */}
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando base de datos de Supabase...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed text-slate-450 font-bold text-xs space-y-2">
                  <Truck size={36} className="mx-auto text-slate-300" />
                  <p>No se encontraron proveedores activos con los filtros indicados.</p>
                  <p className="text-slate-400 font-medium">Crea uno nuevo presionando "Crear Proveedor Manual".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSuppliers.map((s) => {
                    const missing = checkMissingFields(s);
                    const isCompleted = missing.length === 0;

                    return (
                      <div 
                        key={s.id}
                        className={cn(
                          "bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden text-left",
                          isCompleted 
                            ? "border-slate-200 dark:border-slate-850 hover:border-slate-350" 
                            : "border-amber-300 dark:border-amber-900/40 bg-amber-500/[0.01]"
                        )}
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">{s.nombre}</h3>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {s.importado_ocr && (
                                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-450 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                    n8n OCR
                                  </span>
                                )}
                                {s.emite_factura ? (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                    🧾 Emite Factura (Con IVA)
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                    ❌ Costo Neto Sin IVA
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                              {s.contacto ? <span className="text-slate-600 dark:text-slate-300">👤 Contacto: {s.contacto}</span> : <span className="text-amber-600 font-bold">👤 Sin Contacto Comercial</span>}
                            </p>
                          </div>
                          {!isCompleted && (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-955/10 border border-amber-200/50 dark:border-amber-900/20 rounded-xl space-y-1">
                              <span className="text-[9px] font-black uppercase text-amber-605 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                <AlertTriangle size={12} className="text-amber-500 animate-pulse" /> Ficha de Datos Incompleta
                              </span>
                              <p className="text-[9px] text-slate-500 dark:text-slate-300 font-medium font-semibold">
                                Faltan completar: <span className="font-extrabold text-amber-650 dark:text-amber-450">{missing.join(', ')}</span>
                              </p>
                            </div>
                          )}

                          {/* Ficha de Información de Contacto y Logística */}
                          <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-350">
                            
                            {/* Fila Teléfono / Acciones de Comunicación Real */}
                            <div className="grid grid-cols-2 gap-2">
                              {s.telefono ? (
                                <>
                                  <a
                                    href={`tel:${s.telefono.replace(/\s+/g, '').replace(/[^0-9+]/g, '')}`}
                                    className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white py-2 px-2.5 rounded-xl font-bold text-[10px] border border-slate-200/40 dark:border-slate-700/30 transition-all cursor-pointer shadow-sm text-center leading-none"
                                    title="Llamar directamente por teléfono celular"
                                  >
                                    <Phone size={11} className="text-indigo-500 shrink-0" />
                                    Llamar Celular
                                  </a>
                                  <a
                                    href={`https://wa.me/${s.telefono.replace(/\s+/g, '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer shadow-sm text-center leading-none animate-none"
                                    title="Enviar mensaje de WhatsApp"
                                  >
                                    <MessageCircle size={11} className="text-white shrink-0" />
                                    WSP
                                  </a>
                                </>
                              ) : (
                                <div className="col-span-2 text-center py-2 px-3 border border-dashed rounded-xl border-amber-200 text-amber-600 text-[10px] font-bold italic bg-amber-500/[0.03]">
                                  ⚠️ Sin WhatsApp Vinculado
                                </div>
                              )}
                            </div>

                            {/* Dirección como Enlace GPS e Indicador */}
                            {s.direccion ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${s.gps_lat && s.gps_lng ? `${s.gps_lat},${s.gps_lng}` : encodeURIComponent(`${s.direccion}${s.provincia ? ', ' + s.provincia : ''}, Argentina`)}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="group flex items-start gap-2 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-150/10 transition-all cursor-pointer text-left"
                                title="Abrir ubicación en Google Maps / Trazar Ruta"
                              >
                                <MapPin size={13} className="text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div className="space-y-0.5 leading-snug truncate">
                                  <span className="text-[8px] uppercase font-black text-indigo-550 dark:text-indigo-400 tracking-wider flex items-center gap-0.5">
                                    Dirección Física (Retiro Fletero)
                                    <ExternalLink size={8} className="inline opacity-60 group-hover:opacity-100" />
                                  </span>
                                  <p className="text-[10.5px] font-bold underline decoration-indigo-200 text-slate-800 dark:text-slate-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-300 truncate" title={s.direccion}>
                                    {s.direccion} {s.provincia && <span className="text-indigo-400 font-semibold font-mono">({s.provincia})</span>}
                                  </p>
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-600 italic font-bold p-2.5 border border-dashed border-amber-250/50 rounded-xl bg-amber-500/[0.02]">
                                <MapPin size={11} className="shrink-0" />
                                <span>Falta dirección física de retiro</span>
                              </div>
                            )}

                          </div>
                        </div>

                        {/* Botón de Expansión de Precios (Tabla) */}
                        <button 
                          onClick={() => setOpenedSupplierId(openedSupplierId === s.id ? null : s.id)}
                          className="w-full mt-3 bg-indigo-50 hover:bg-indigo-100/85 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-indigo-100/50 dark:border-indigo-900/30 transition-all"
                        >
                          {openedSupplierId === s.id ? (
                            <>
                              <ChevronUp size={11} />
                              Ocultar Precios Extensivos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={11} />
                              Ver Precios en Tabla ({s.items_provee ? s.items_provee.length : 0})
                            </>
                          )}
                        </button>

                        {/* Listado en Formato de Tabla + Fecha de última actualización si se expande */}
                        {openedSupplierId === s.id && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-3 duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border dark:border-slate-850">
                              <span className="flex items-center gap-1 text-slate-550 dark:text-slate-400">
                                <Calendar size={11} className="text-indigo-500" />
                                Actualizado: <span className="text-slate-900 dark:text-indigo-400 font-extrabold">{s.last_updated || '24/05/2026'}</span>
                              </span>
                              
                              <button 
                                onClick={() => setViewWithIva(!viewWithIva)}
                                className={cn(
                                  "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-sans leading-none",
                                  viewWithIva 
                                    ? "bg-teal-600 text-white shadow-sm" 
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                                )}
                              >
                                {viewWithIva ? "🔢 Simulando IVA (+21%)" : "🔢 Simular IVA (+21%)"}
                              </button>
                            </div>

                            {s.items_provee && s.items_provee.length > 0 ? (
                              <div className="overflow-hidden rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100/85 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                      <th className="p-2.5 pl-3">Insumo / SKU</th>
                                      <th className="p-2.5 text-right">Neto (S/IVA)</th>
                                      <th className="p-2.5 text-right pr-3">C/IVA (Gral. 21%)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
                                    {s.items_provee.map((item, idx) => {
                                      const basePrice = item.precio_sin_iva !== undefined ? Number(item.precio_sin_iva) : (item.precio ? Number(item.precio) : 0);
                                      const grossPrice = Number((basePrice * 1.21).toFixed(2));

                                      return (
                                        <tr key={idx} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 font-semibold font-mono text-[10px] transition-none">
                                          <td className="p-2 pl-3 text-slate-805 dark:text-slate-200 font-bold font-sans">
                                            <div className="flex flex-col">
                                              <span className="font-extrabold uppercase text-[10px] tracking-tight">{item.nombre}</span>
                                              {item.categoria && (
                                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">📁 {item.categoria}</span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-2 text-right text-slate-600 dark:text-slate-400 font-extrabold">
                                            ${basePrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          </td>
                                          <td className="p-2 text-right pr-3 font-black text-indigo-600 dark:text-indigo-400">
                                            ${grossPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center text-[10px] text-amber-650 dark:text-amber-400 font-bold">
                                No tiene precios registrados en su catálogo.
                              </div>
                            )}

                            {/* Formulario rápido para agregar ítem manual individual directo */}
                            <div className="bg-slate-150/35 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 space-y-2 text-left mt-3">
                              <div className="text-[10px] uppercase font-black text-indigo-650 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                                ➕ Carga Manual Rápida de Insumo Individual
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                                Agrega un insumo individualmente al catálogo de este proveedor de forma sincrónica sin abrir la modal completa de edición.
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1.5 items-end">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400">Nombre del Insumo</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. PLA Premium Amarillo"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-550"
                                    value={quickItemName} 
                                    onChange={(e) => setQuickItemName(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400">Categoría Relacionada</label>
                                  <CascadingCategorySelector 
                                    value={quickItemCat} 
                                    onChange={(val) => setQuickItemCat(val)} 
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 space-y-0">
                                  <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-bold text-slate-405 block whitespace-nowrap">Neto S/IVA</label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-bold">$</span>
                                      <input 
                                        type="number" 
                                        placeholder="S/IVA"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-5 pr-1.5 py-1.5 text-[11px] font-bold font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                        value={quickItemNet} 
                                        onChange={(e) => {
                                          const rawVal = e.target.value === '' ? '' : parseFloat(e.target.value);
                                          setQuickItemNet(rawVal);
                                          if (rawVal === '') {
                                            setQuickItemGross('');
                                          } else {
                                            setQuickItemGross(Number((rawVal * 1.21).toFixed(2)));
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-bold text-slate-405 block whitespace-nowrap">Con IVA (21%)</label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-bold">$</span>
                                      <input 
                                        type="number" 
                                        placeholder="C/IVA"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-5 pr-1.5 py-1.5 text-[11px] font-bold font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                        value={quickItemGross} 
                                        onChange={(e) => {
                                          const rawVal = e.target.value === '' ? '' : parseFloat(e.target.value);
                                          setQuickItemGross(rawVal);
                                          if (rawVal === '') {
                                            setQuickItemNet('');
                                          } else {
                                            setQuickItemNet(Number((rawVal / 1.21).toFixed(2)));
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => handleQuickAddItem(s.id)} 
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] py-1.5 rounded-xl h-[33px] transition-all tracking-wider cursor-pointer"
                                >
                                  Guardar Insumo
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botones de Acción */}
                        <div className="flex gap-2 pt-3 mt-4 border-t dark:border-slate-850">
                          <button 
                            onClick={() => handleEdit(s)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                          >
                            <Edit2 size={11} /> Configurar Ficha
                          </button>
                          
                          <button 
                            onClick={() => setShowDeleteConfirm(s.id)}
                            className="p-1.5 border hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-colors border-rose-100 dark:border-rose-950/35"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : view === 'confirm' ? (
            /* RESUMEN TÉCNICO Y CONFIRMACIÓN PREVIA DE LA FICHA */
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300 text-left space-y-6">
              
              {/* Cabecera del Resumen */}
              <div className="border-b dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Validación de Carga Obligatoria</span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    🔍 Confirmación Previa: Registro de Proveedor
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
                    Revise este informe técnico. Si toda la información coincide con sus registros, guarde de forma permanente.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setView('form')}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 size={13} /> Volver a Editar
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleFinalSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {loading ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                    Confirmar e Insertar
                  </button>
                </div>
              </div>

              {/* Grid de Bento Plan */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-normal">
                
                {/* Columna Izquierda: Datos Básicos y Condiciones */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Tarjeta 1: Datos Personales / Comerciales */}
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b dark:border-slate-850 pb-1.5">👤 Información de la Empresa</span>
                    
                    <div className="grid grid-cols-1 gap-3 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Razón Social:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-sm">{formData.nombre}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Contacto:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold truncate block">
                            {formData.contacto.trim() ? formData.contacto : "❌ Sin contacto programado"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Teléfono / WhatsApp:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 font-mono">
                            <Phone size={11} className="text-teal-600 shrink-0" /> {formData.telefono.trim() ? formData.telefono : "❌ Sin teléfono"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 2: Configuración Impositiva */}
                  <div className="p-4 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5 text-xs font-semibold">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b dark:border-slate-850 pb-1.5">🧾 Configuración Impositiva y Facturación</span>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">¿Emite Factura Comercial?</span>
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase block",
                          formData.emite_factura ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                          {formData.emite_factura ? "🧾 Sí, emite factura" : "❌ No emite factura"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                        Los precios de su catálogo se registran de forma transparente con un desglose automático de IVA en la matriz del panel para facilitar las decisiones de costeo y compra.
                      </p>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">📝 Comentarios / Notas de Compras</span>
                    <p className="text-slate-600 dark:text-slate-300 font-medium italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border dark:border-slate-850">
                      {formData.notas.trim() ? formData.notas : "Sin observaciones específicas de logística o pago."}
                    </p>
                  </div>

                </div>

                {/* Columna Derecha: Logística y Artículos */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Tarjeta 3: Dirección y GPS OSM Live */}
                  <div className="p-4 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b dark:border-slate-850 pb-1.5">📍 Ubicación de Retiro Logístico</span>
                    
                    <div className="text-xs font-semibold space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Dirección de Retiro:</span>
                        <div className="flex items-start gap-1 pb-1">
                          <MapPin size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                          <span className="text-slate-850 dark:text-slate-100 font-extrabold">{formData.direccion.trim() ? formData.direccion : "❌ Sin dirección"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg font-mono">
                        <div>
                          <span className="text-slate-400 block font-sans">Latitud:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{formData.gps_lat.trim() ? formData.gps_lat : "⚠️ Vacío"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">Longitud:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{formData.gps_lng.trim() ? formData.gps_lng : "⚠️ Vacío"}</span>
                        </div>
                      </div>

                      <div className="h-[120px] rounded-lg overflow-hidden border dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900">
                        {formData.gps_lat && formData.gps_lng ? (
                          <iframe 
                            title="OSM Live Confirmation Preview"
                            src={`https://maps.google.com/maps?q=${formData.gps_lat},${formData.gps_lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                            className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-180"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-[10px] text-slate-400 font-bold">
                            <AlertTriangle size={16} className="text-amber-500 mb-1" />
                            <span>No posees coordenadas GPS. El mapa de visualización no se renderizará.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 4: Catálogo y precios */}
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center border-b dark:border-slate-850 pb-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">📦 Costos Mayoristas Catalogados ({formItems.length})</span>
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">
                        Modulador Técnico
                      </span>
                    </div>

                    {formItems.length === 0 ? (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-center text-xs font-bold text-amber-500">
                        ⚠️ No se detectó ningún insumo con precio en el catálogo. Se creará una ficha vacía.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {formItems.map((item, idx) => {
                          const basePrice = item.precio_sin_iva;
                          const finalPrice = formData.iva_incluido ? Number((item.precio_sin_iva * 1.21).toFixed(2)) : item.precio_sin_iva;
                          const cashPrice = finalPrice * (1 - (formData.descuento_efectivo || 0) / 100);
                          const transferPrice = finalPrice * (1 - (formData.descuento_transferencia || 0) / 100);

                          return (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-850 p-2.5 rounded-lg text-xs leading-normal space-y-1 my-0.5 font-semibold">
                              <div className="flex justify-between font-bold dark:text-white">
                                <span className="font-extrabold truncate max-w-[170px] font-sans">{item.nombre}</span>
                                <span className="font-black text-slate-900 dark:text-indigo-305 font-mono">${finalPrice.toLocaleString('es-AR', {minimumFractionDigits: 1})}</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono border-t border-slate-200/40 dark:border-slate-800 pt-1">
                                <span>Neto S/IVA: ${basePrice.toLocaleString('es-AR', {minimumFractionDigits: 1})}</span>
                                <span className="text-emerald-600 font-bold">Público {formData.iva_incluido ? 'C/IVA (21%)' : 'S/IVA'}: ${finalPrice.toLocaleString('es-AR', {minimumFractionDigits: 1})}</span>
                              </div>
                              <div className="text-[8px] text-indigo-500">Categoría: {item.categoria}</div>
                              {(formData.descuento_efectivo > 0 || formData.descuento_transferencia > 0) && (
                                <div className="flex gap-2 text-[8px] font-bold mt-0.5 justify-end font-mono">
                                  {formData.descuento_efectivo > 0 && (
                                    <span className="text-teal-600">💸 Ef: ${cashPrice.toLocaleString('es-AR', {minimumFractionDigits: 1})}</span>
                                  )}
                                  {formData.descuento_transferencia > 0 && (
                                    <span className="text-blue-500 font-bold">🏦 Tr: ${transferPrice.toLocaleString('es-AR', {minimumFractionDigits: 1})}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Advertencia Final */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/25 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 w-4" size={16} />
                <p className="text-[11px] text-slate-505 dark:text-amber-450 leading-relaxed font-bold">
                  ⚠️ <strong>Aviso del Coordinador G3D:</strong> Una vez confirmado el envío, los datos de costos mayoristas del catálogo impactarán de forma directa de manera predecible en las fórmulas de cálculo de tu sistema de cotizaciones. Asegúrate de verificar que el importe cargado esté libre de errores tipográficos.
                </p>
              </div>

              {/* Botones de Confirmación y Reset */}
              <div className="flex gap-3 pt-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setView('form')}
                  className="flex-1 bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft size={14} /> Volver y Corregir Ficha
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSave}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:bg-slate-400"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Confirmar y Guardar Ficha
                </button>
              </div>

            </div>
          ) : (
            /* FORMULARIO DE EDICIÓN CON INDICADORES DINÁMICOS DE CAMPOS VACÍOS */
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm animate-in fade-in duration-300 text-left">
              <div className="flex items-center justify-between mb-6 border-b dark:border-slate-850 pb-3 h-10">
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={16} className="text-indigo-600" />
                    {editingSupplier ? 'Editar Registro de Proveedor / Configuración' : 'Dar de Alta Nuevo Proveedor'}
                  </h2>
                </div>
                <button 
                  onClick={resetForm}
                  className="flex items-center gap-1 text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-black uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Volver al Listado
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 leading-none shadow-none">
                {/* SECCIÓN 1: DATOS GENERALES DE CONTACTO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-850">
                  {/* Nombre Empresa */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Empresa / Razón Social *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        placeholder="e.g. Plast-Flex Mayorista"
                        required
                      />
                    </div>
                  </div>

                  {/* Contacto Humano */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Contacto comercial / Vendedor</label>
                    <div className={cn(
                      "relative rounded-xl border transition-all p-0.5",
                      attemptedSubmit && !formData.contacto.trim() ? "border-amber-500 bg-amber-500/[0.04]" : "border-transparent"
                    )}>
                      <input 
                        type="text"
                        value={formData.contacto}
                        onChange={e => setFormData({...formData, contacto: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Carlos Spinelli"
                      />
                      {attemptedSubmit && !formData.contacto.trim() && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold mt-1 ml-1 flex items-center gap-1">
                          <AlertTriangle size={10} /> Considere agregar un nombre de contacto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Celular */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Número de Celular o WhatsApp *</label>
                    <div className={cn(
                      "relative rounded-xl border transition-all p-0.5",
                      attemptedSubmit && !formData.telefono.trim() ? "border-amber-500 bg-amber-500/[0.04]" : "border-transparent"
                    )}>
                      <input 
                        type="text"
                        value={formData.telefono}
                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. 11 5566-7788"
                      />
                      {attemptedSubmit && !formData.telefono.trim() && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold mt-1 ml-1 flex items-center gap-1">
                          <AlertTriangle size={10} /> Se requiere un teléfono de contacto
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS DE GEOPOSICIONAMIENTO Y MAPA (JUSTO ARRIBA DE NOTAS) */}
                <div className="space-y-4 bg-slate-50/60 dark:bg-slate-950/30 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-sans">
                      📍 Datos de Envío y Georreferencia de Retiro
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-400 leading-none">
                      (Para los Fleteros y Logística)
                    </span>
                  </div>

                  {/* Dirección de Retiro Con Alerta Condicional e incorporado dropdown de provincia */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Provincia y Dirección de Retiro *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <select
                          value={formData.provincia}
                          onChange={e => {
                            const newProv = e.target.value;
                            setFormData({...formData, provincia: newProv});
                            handleAddressAutoGeocode(formData.direccion, newProv);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Provincia ...</option>
                          {PROVINCES_LIST.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div className={cn(
                        "sm:col-span-2 relative rounded-xl border transition-all p-0.5",
                        attemptedSubmit && !formData.direccion.trim() ? "border-amber-500 bg-amber-500/[0.04]" : "border-transparent"
                      )}>
                        <input 
                          type="text"
                          value={formData.direccion}
                          onChange={e => setFormData({...formData, direccion: e.target.value})}
                          onBlur={() => handleAddressAutoGeocode(formData.direccion, formData.provincia)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddressAutoGeocode(formData.direccion, formData.provincia);
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-505"
                          placeholder="Calle, Altura, Localidad"
                        />
                        {attemptedSubmit && !formData.direccion.trim() && (
                          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold mt-1 ml-1 flex items-center gap-1">
                            <AlertTriangle size={10} /> Se requiere cargar la dirección física
                          </p>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          disabled={geocoding || !formData.direccion.trim()}
                          onClick={geocodeAddress}
                          className="w-full h-[34px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold leading-none shadow flex items-center justify-center gap-1 cursor-pointer disabled:bg-slate-350 disabled:cursor-not-allowed transition-all"
                          title="Ubicar dirección de texto en el mapa interactivo"
                        >
                          {geocoding ? <Loader2 className="animate-spin" size={13} /> : <Search size={13} />}
                          Ubicar GPS
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MAPA SOLAMENTE */}
                  <div className="bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border dark:border-slate-800 h-[220px] relative z-20 shadow-inner">
                    <InteractiveSupplierMap 
                      lat={formData.gps_lat} 
                      lng={formData.gps_lng} 
                      onCoordsChange={(newLat, newLng) => {
                        setFormData(prev => ({
                          ...prev,
                          gps_lat: newLat,
                          gps_lng: newLng
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Notas u Observaciones del Proveedor */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Notas u Observaciones del Proveedor</label>
                  <textarea 
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    placeholder="Vigencia de cotización, condiciones de pago, tiempo de despacho..."
                  />
                </div>

                {/* Opción de Facturación */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/45 space-y-3 text-left">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-sans">Configuración Comercial</span>
                  
                  {/* Checkbox Emite Factura */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl text-left">
                    <div className="space-y-1">
                      <label htmlFor="emite_factura" className="text-[11px] font-black uppercase text-slate-800 dark:text-white cursor-pointer select-none block">
                        Emite Factura Comercial (A / B / C)
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-normal font-sans">
                        Indica si el proveedor expide facturación fiscal por las compras.
                      </p>
                    </div>
                    <Switch3D 
                      checked={formData.emite_factura}
                      onChange={checked => setFormData({...formData, emite_factura: checked})}
                    />
                  </div>
                </div>

                {/* SECCIÓN 2: CATÁLOGO DE COSTOS MAYORISTAS (AL FINAL DE LA PÁGINA) */}
                <div className="space-y-3.5 border-t dark:border-slate-800 pt-5 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                        Catálogo de Costos Mayoristas (Insumos que provee) *
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">
                        Costos de adquisición para el cálculo automático de presupuestos de producción.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `ITM-${String(formItems.length + 1).padStart(2, '0')}`;
                          setFormItems([
                            ...formItems,
                            {
                              id: newId,
                              nombre: '',
                              categoria: '',
                              precio_sin_iva: 0,
                              last_updated: new Date().toLocaleDateString('es-AR')
                            }
                          ]);
                          toast.success('¡Fila vacía añadida!');
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/40 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus size={12} /> Añadir Fila
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkText('');
                          setShowBulkModal(true);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-950/40 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Brain size={12} /> Importar Lote
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "rounded-2xl border transition-all overflow-visible bg-white dark:bg-slate-900",
                    attemptedSubmit && formItems.length === 0 ? "border-amber-500 bg-amber-500/[0.04]" : "border-slate-200 dark:border-slate-800"
                  )}>
                    {formItems.length === 0 ? (
                      <div className="p-8 text-center space-y-2.5">
                        <Package size={32} className="text-slate-300 dark:text-slate-705 mx-auto" strokeWidth={1.5} />
                        <div>
                          <p className="text-xs font-bold text-slate-650 dark:text-slate-300">No hay insumos cargados en esta ficha</p>
                          <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-0.5 leading-normal">
                            Use 'Añadir Fila' o importe un listado rápido.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-visible">
                        <table className="w-full text-left border-collapse text-xs table-fixed">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
                              <th className="p-3 w-[5%]">#</th>
                              <th className="p-3 w-[40%]">Nombre Insumo / SKU</th>
                              <th className="p-3 w-[30%]">Categoría Relacionada</th>
                              <th className="p-3 w-[10vw]">Cost Neto S/IVA</th>
                              <th className="p-3 w-[10vw]">Cost C/IVA (21%)</th>
                              <th className="p-3 w-[5%] text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-slate-850 divide-slate-100 bg-white dark:bg-slate-900 overflow-visible">
                            {formItems.map((item, idx) => {
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/30 transition-colors overflow-visible">
                                  <td className="p-3 text-slate-400 font-mono font-bold text-[10px]">{idx + 1}</td>
                                  
                                  {/* Nombre Campo */}
                                  <td className="p-3">
                                    <input 
                                      type="text"
                                      value={item.nombre}
                                      onChange={(e) => {
                                        const updated = [...formItems];
                                        updated[idx].nombre = e.target.value;
                                        setFormItems(updated);
                                      }}
                                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-505"
                                      placeholder="e.g. Grilon PLA Natural"
                                    />
                                  </td>

                                  {/* Categoria */}
                                  <td className="p-3 overflow-visible relative" style={{ zIndex: formItems.length + 10 - idx }}>
                                    <CascadingCategorySelector
                                      value={item.categoria}
                                      onChange={(val) => {
                                        const updated = [...formItems];
                                        updated[idx].categoria = val;
                                        setFormItems(updated);
                                      }}
                                    />
                                  </td>

                                  {/* Precio sin IVA */}
                                  <td className="p-3">
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">$</span>
                                      <input 
                                        type="number"
                                        value={item.precio_sin_iva || ''}
                                        onChange={(e) => {
                                          const updated = [...formItems];
                                          updated[idx].precio_sin_iva = Math.max(0, parseFloat(e.target.value) || 0);
                                          setFormItems(updated);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold font-mono focus:outline-none"
                                        placeholder="0"
                                      />
                                    </div>
                                  </td>

                                  {/* Precio con IVA interactivos */}
                                  <td className="p-3">
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">$</span>
                                      <input 
                                        type="number"
                                        value={item.precio_sin_iva ? Number((item.precio_sin_iva * 1.21).toFixed(2)) : ''}
                                        onChange={(e) => {
                                          const rawGross = Math.max(0, parseFloat(e.target.value) || 0);
                                          const updated = [...formItems];
                                          updated[idx].precio_sin_iva = Number((rawGross / 1.21).toFixed(2));
                                          setFormItems(updated);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold font-mono focus:outline-none"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </td>

                                  {/* Eliminar */}
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = formItems.filter((_, i) => i !== idx);
                                        setFormItems(updated);
                                        toast.info('Renglón removido del catálogo.');
                                      }}
                                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-bold"
                                      title="Quitar de la lista"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {attemptedSubmit && formItems.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1 bg-amber-500/5 border border-amber-500/25 p-2.5 rounded-xl font-sans text-left">
                      <AlertTriangle size={12} /> Se requiere registrar al menos un insumo en el catálogo mayorista.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl text-xs font-bold leading-none shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Truck size={14} />}
                    {editingSupplier ? 'Guardar Cambios en Ficha' : 'Dar de Alta Proveedor'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBypassAndConfirm}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
                    title="Omitir alertas y registrar proveedor inmediatamente"
                  >
                    <AlertTriangle size={14} />
                    Omitir Alertas y Guardar (Carga Rápida)
                  </button>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-4 border dark:border-slate-800 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MÓDULO 2: CONECTIVIDAD REAL Y PRODUCCIÓN CON n8n */}
      {activeTab === 'n8n_prod' && (
        <div className="space-y-6 text-left">
          {/* Tarjeta de Encabezado */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-20px] scale-150 opacity-10 pointer-events-none">
              <Sparkles size={160} className="text-teal-400 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 text-teal-400">
              <Sparkles size={18} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest leading-none">Arquitectura de Integración Real</span>
            </div>
            
            <h2 className="text-base font-black tracking-tight uppercase">Conecta tu n8n para Capturar Precios Web y WhatsApp</h2>
            <p className="text-slate-350 text-xs leading-relaxed max-w-4xl font-semibold">
              Dado que muchos proveedores no envían archivos PDF y en su lugar tienen <strong className="text-teal-400 font-extrabold">tiendas online con precios cambiantes</strong>, hemos desarrollado una solución de extracción de alto rendimiento. Usa un solo flujo en n8n para recopilar precios usando capturas visuales, scraping por link o textos brutos.
            </p>
          </div>

          {/* Selector de Métodos de Extracción en n8n */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-815 p-4 rounded-xl space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="border-b dark:border-slate-850 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-black text-indigo-500 block">Estrategias de Automatización de Costos</span>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">¿Cómo deseas capturar los precios de tus proveedores?</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-955 p-1 rounded-xl shrink-0">
                <button 
                  onClick={() => setN8nMethodTab('screenshot')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                    n8nMethodTab === 'screenshot' 
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <FileImage size={12} />
                  📸 Captura + Notas
                </button>
                <button 
                  onClick={() => setN8nMethodTab('scraping')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                    n8nMethodTab === 'scraping' 
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <Globe size={12} />
                  🌐 Scraping Link
                </button>
                <button 
                  onClick={() => setN8nMethodTab('rawtext')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                    n8nMethodTab === 'rawtext' 
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <FileText size={12} />
                  📝 Pegar Texto
                </button>
              </div>
            </div>

            {/* Renderizado de Detalles del Método Elegido */}
            {n8nMethodTab === 'screenshot' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
                <div className="space-y-3 font-sans">
                  <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase">Recomendado para Tiendas Visuales o Instagram</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">📸 Captura de Pantalla + Notas Aclaratorias por WhatsApp</h4>
                  <p>
                    Cuando tu proveedor tiene una web con carrito de compras pero no tiene lista de precios de insumos descargable, simplemente **toma una captura de pantalla** desde tu celular de la grilla de productos activos y envíala a tu número de WhatsApp de n8n.
                  </p>
                  <p className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-600 dark:text-amber-450">
                    <strong>💡 ¡Añade Textos de Ayuda!</strong> Al enviar la imagen por WhatsApp, escribe un comentario descriptivo en el pie de foto. Ejemplo: <em>"Sumar 21% de IVA que no figura en imagen. El proveedor es Filament-AR"</em>. La Inteligencia Artificial analizará la imagen aplicando tu instrucción exacta en tiempo real.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2.5 border dark:border-slate-850 font-sans">
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">🛠️ Estructura del Nodo n8n (Pasos):</span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-505 dark:text-slate-450 font-bold">
                    <li><strong>Webhook / WhatsApp Trigger:</strong> Recibe el mensaje con la captura realizada (imagen de WhatsApp).</li>
                    <li><strong>HTTP Request:</strong> Descarga la imagen binaria desde los servidores del gateway de WhatsApp de forma segura.</li>
                    <li><strong>Nodo Google Gemini (Vision LMM - Gratis):</strong> Le pasa la imagen binaria. El nodo de Gemini recibe el parámetro de texto de ayuda de WhatsApp como <code>Caption</code> en combinación con el Prompt Maestro.</li>
                    <li><strong>Supabase Node:</strong> Realiza el POST del JSON resultante para ser mapeado inmediatamente.</li>
                  </ol>
                </div>
              </div>
            )}

            {n8nMethodTab === 'scraping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
                <div className="space-y-3 font-sans">
                  <span className="text-[10px] font-black text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded uppercase font-black">Fácil & Automático</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">🌐 Extracción por URL Directa (Web Scraping Link)</h4>
                  <p>
                    Simplemente **envía por WhatsApp el enlace directo** de la sección de precios de la web de tu proveedor (por ejemplo: <code>https://proveedor3d.com/categoria/filamentos</code>).
                  </p>
                  <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850 text-[11px] text-slate-500 dark:text-slate-400">
                    En n8n, cuando se detecta un enlace, se usa un nodo de extracción de HTML de manera silenciosa. La IA de Gemini purifica el código caótico del sitio web seleccionando únicamente los nombres de artículos y sus precios correspondientes para actualizarlos.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2.5 border dark:border-slate-850 font-sans">
                  <span className="text-[9px] font-black uppercase text-teal-555 tracking-wider">🛠️ Estructura del Nodo n8n (Pasos):</span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-505 dark:text-slate-455 font-bold">
                    <li><strong>WhatsApp Trigger:</strong> Detecta que el mensaje contiene una URL (<code>http://</code> o <code>https://</code>).</li>
                    <li><strong>HTTP Request / Scraping:</strong> Realiza una llamada GET a la URL. Se sugiere utilizar herramientas como <strong className="text-emerald-600 font-black">Firecrawl / ScrapingBee</strong> o un simple GET que traiga el texto plano.</li>
                    <li><strong>HTML to Text (Opcional):</strong> Limpia las etiquetas HTML dejando solo el texto legible de la tienda.</li>
                    <li><strong>IA Google Gemini Node (Gratis):</strong> Recibe el texto bruto del catálogo de la web del proveedor, descarta menús, pies de página o cabeceras y recupera el JSON puro con los costos.</li>
                  </ol>
                </div>
              </div>
            )}

            {n8nMethodTab === 'rawtext' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
                <div className="space-y-3 font-sans">
                  <span className="text-[10px] font-black text-indigo-550 bg-indigo-500/10 px-2 py-0.5 rounded uppercase font-black">Ultra Rápido</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">📋 Texto Bruto Copiado y Pegado de la Tienda Web</h4>
                  <p>
                    Si estás viendo la web del proveedor desde tu computadora, arrastra el mouse seleccionando la lista de precios de la grilla de productos, cópiala con <code>Ctrl + C</code> y pégala directamente en tu chat de WhatsApp de G3D.
                  </p>
                  <p className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-xl text-[11px] text-indigo-600 dark:text-indigo-400">
                    A la IA de Gemini no le importa el formato, la separación de espacios, ni los emojis distractores. La máquina entiende de inmediato los insumos y sus variaciones, descartando cualquier basura de formato en milisegundos.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2.5 border dark:border-slate-850 font-sans">
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">🛠️ Estructura del Nodo n8n (Pasos):</span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-505 dark:text-slate-450 font-bold">
                    <li><strong>WhatsApp Message Trigger:</strong> Recibe el bloque de texto copiado por el usuario de forma directa.</li>
                    <li><strong>Google Gemini Node (Gratis):</strong> Recibe el bloque de texto en crudo adjuntando el Prompt Maestro unificado.</li>
                    <li><strong>SQL Supabase:</strong> Inserta cada artículo con costo mayorista directamente, actualizando en caso de que ya estuviese mapeado con anterioridad.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Instrucciones con Peras y Manzanas */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block border-b dark:border-slate-850 pb-2 flex items-center gap-1.5">
                <Lock size={12} className="text-indigo-500" />
                Flujo Tecnológico de Sincronización
              </span>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase mb-1">1. Recibe el WhatsApp</h4>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400">
                    Tu número de WhatsApp corporativo (conectado a la API oficial de WhatsApp o a un Gateway como Twilio, Z-API o Evolution API) recibe la captura de pantalla o mensaje de costos de tu proveedor.
                  </p>
                </div>

                <div className="border-t dark:border-slate-850 pt-3">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase mb-1">2. Petición HTTP a la Inteligencia Artificial</h4>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400">
                    n8n toma la imagen o PDF, descarga el archivo temporalmente y lo envía a un nodo de <strong className="text-emerald-600">Google Gemini Flash (100% Gratis con tu API Key)</strong> pasándole el <strong>Prompt Maestro de Extracción</strong> proporcionado a la derecha. No necesitas pagar a OpenAI.
                  </p>
                </div>

                <div className="border-t dark:border-slate-850 pt-3">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase mb-1">3. Inserción Directa en Supabase</h4>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400">
                    n8n recibe la respuesta JSON purificada, y ejecuta una llamada HTTP POST a tu tabla <strong>proveedores</strong> en Supabase, utilizando tus credenciales seguras de conexión para persistir la información.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-1">
                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">💡 Nota de Seguridad</span>
                    <p className="text-[10px] leading-normal text-slate-650 dark:text-slate-350 font-bold">
                      Cualquier proveedor de n8n completado mediante la automatización aparecerá inmediatamente con la etiqueta <strong>"n8n OCR"</strong>. Al entrar, la app auditará qué datos faltan por registrar para que puedas completarlos manualmente en segundos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Esquemas copy-paste y Prompts oficiales */}
            <div className="lg:col-span-7 space-y-5">
              {/* Bloque del Prompt Maquina */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-815 p-5 rounded-2xl space-y-3 relative shadow-sm text-left font-sans">
                <div className="flex justify-between items-center border-b dark:border-slate-850 pb-2">
                  <span className="text-[9px] font-black uppercase text-indigo-550 tracking-wider flex items-center gap-1">
                    <FileText size={12} className="text-indigo-500" />
                    Prompt Maestro Multi-Entrada (Copiar a OpenAI/Gemini)
                  </span>
                  <button 
                    onClick={copyPromptToClipboard}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 p-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 text-slate-700 dark:text-white transition-all cursor-pointer shadow-sm"
                  >
                    {isCopiedPrompt ? <Check size={12} className="text-emerald-500" /> : <Copy size={11} />}
                    Copiar Prompt
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-xl border dark:border-slate-850 h-[190px] overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-650 dark:text-slate-350 select-all border-dashed animate-none">
{`Eres un extractor inteligente avanzado de datos de presupuestos de insumos 3D de alta precisión.
Tu trabajo es procesar el input provisto (que puede ser una Imagen/Captura de Pantalla, texto web rasterizado de scraping o una transcripción cruda) y extraer un JSON structured libre de cualquier markdown, formato de bloque o de formato adicional basandote en los precios originales sin impuestos.

REGLAS DE PROCESAMIENTO MULTI-ENTRADA:
1. SI EL INPUT ES UNA CAPTURA DE PANTALLA O IMAGEN: Identifica los precios de costo bruto tal como figuran en la lista del emisor, SIN sumarle ningún cargo tributario como IVA. Extrae el costo neto limpio sin IVA de manera nativa. Desprecia cualquier incremento impositivo en el procesamiento.
2. SI EL INPUT ES TEXTO PROCEDENTE DE SCRAPING WEB (HTML / LINK): Purga todo elemento distractor del maquetado (menús, banners, políticas, divisores, headers) y concéntrate únicamente en la sección del catálogo de costos iniciales originales del proveedor.
3. SI EL INPUT ES TEXTO PLANO COPIADO Y PEGADO: Traduce la lista desordenada asociando el valor del precio bruto original del proveedor, sin aplicar fórmulas de impuestos.

ESTRUCTURA DE SALIDA REQUERIDA (JSON PURO):
{
  "nombre": "Establece la Empresa proveedora (si te lo indica el usuario en sus notas o figura en la captura/web, de lo contrario establece el dominio de la web o un nombre descriptivo lógico)",
  "contacto": "Nombre de la persona o asesor de contacto (dejar en blanco si no se declara)",
  "telefono": "Número de WhatsApp o teléfono directo de ventas con código de área (dejar en blanco si no se declara)",
  "direccion": "Dirección física postal exacta para geolocalización (dejar en blanco si no se declara o no se conoce)",
  "notes": "Notas adicionales que resuman vigencia, notas aclaratorias añadidas del usuario, IVA o tipo de cambio aplicable",
  "items_provee": [
    { "nombre": "Nombre exacto del filamento, resina, boquilla o insumo", "precio": 12500 }
  ]
}

REGLA DE ORO DE IMPUESTOS: El extractor NO DEBE realizar cálculos de impuestos ni sumar IVA. El IVA se calcula y simula localmente en la aplicación G3D. Guarde el costo bruto original (Neto) en el campo "precio", debe ser exclusivamente un valor numérico.`}
                </div>
              </div>

              {/* Parámetros JSON esperados para Supabase API POST */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b dark:border-slate-850 pb-2">
                  <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider flex items-center gap-1">
                    <Sparkles size={12} />
                    Estructura JSON Esperada para Sincronización de Base de Datos
                  </span>
                  <button 
                    onClick={copyJsonToClipboard}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 p-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 text-slate-700 dark:text-white transition-all"
                  >
                    {isCopiedJson ? <Check size={12} className="text-emerald-500" /> : <Copy size={11} />}
                    Copiar JSON
                  </button>
                </div>

                <p className="text-[11px] text-slate-505 dark:text-slate-400 font-semibold leading-relaxed">
                  Tu nodo HTTP POST en n8n debe enviar la siguiente estructura JSON directamente a Supabase para actualizar o registrar nuevos datos con consistencia impecable:
                </p>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border dark:border-slate-850 font-mono text-[10px] leading-relaxed text-slate-650 dark:text-slate-350 h-[105px] overflow-y-auto select-all">
{`{
  "nombre": "Nombre del Proveedor",
  "contacto": "Filtro Comercial o Persona",
  "telefono": "Teléfono de ventas oficial",
  "direccion": "Avenida Siempre Viva 742, CP 1430",
  "notas": "Notas mapeadas automáticamente en producción",
  "items_provee": [
    { "nombre": "PLA 1KG Grilon3", "precio": 12500 }
  ]
}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULO 3: FACCION INSUMOS DE PROVEEDORES (GLOBAL ITEMS) */}
      {activeTab === 'global_items' && (
        <div className="space-y-6">
          {/* Tarjeta Informativa Principal */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-5 rounded-2xl text-left space-y-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-left">
              <Package className="text-emerald-550" size={16} />
              Catálogo Global Unificado de Insumos ({filteredGlobalItems.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Vea todos los precios mayoristas indexados de sus proveedores en un solo panel. Agregue imágenes del catálogo o asigne una foto de WhatsApp para identificar visualmente cada filamento, resina o repuesto.
            </p>
          </div>

          {/* Filtros de la Facción */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="md:col-span-8 relative">
              <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Filtrar por Nombre o Categoría</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. PLA, ABS, Bronce, Taller..."
                  value={globalItemSearch}
                  onChange={e => setGlobalItemSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
              </div>
            </div>

            <div className="md:col-span-4 relative border-t md:border-t-0 md:border-l dark:border-slate-800 pt-2 md:pt-0 md:pl-3">
              <label className="text-[10px] uppercase font-black text-indigo-505 block mb-1">Filtrar por Negocio Emisor</label>
              <select
                value={globalItemSupplierFilter}
                onChange={e => setGlobalItemSupplierFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-550"
              >
                <option value="">Todos los Negocios ...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de Ítems */}
          {filteredGlobalItems.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-10 text-center space-y-2">
              <Package size={40} className="text-slate-300 dark:text-slate-700 mx-auto" strokeWidth={1} />
              <p className="text-xs font-black text-slate-700 dark:text-slate-350 uppercase">No encontramos insumos catalogados</p>
              <p className="text-[11px] text-slate-400 font-semibold max-w-sm mx-auto">
                No hay insumos que coincidan con la búsqueda, o tus proveedores aún no tienen artículos con costo cargados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {filteredGlobalItems.map((item) => {
                const roundedGrossPrice = Number((item.precio_sin_iva * 1.21).toFixed(2));
                return (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col group"
                  >
                    {/* Contenedor de Imagen */}
                    <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-200/50 dark:border-slate-850/50">
                      {item.imagen ? (
                        <img 
                          src={item.imagen} 
                          alt={item.nombre} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-slate-400 dark:text-slate-600 text-center">
                          <Package size={34} strokeWidth={1.2} />
                          <span className="text-[9px] uppercase font-black tracking-wider mt-1 text-slate-400">Sin Imagen Cargada</span>
                        </div>
                      )}

                      {/* Botón Overlay para Cargar/Editar Imagen */}
                      <button
                        onClick={() => {
                          setEditingImageItem({
                            supplierId: item.supplierId,
                            itemId: item.itemKey,
                            nombre: item.nombre,
                            currentImage: item.imagen || ''
                          });
                          setNewImageUrl(item.imagen || '');
                        }}
                        className="absolute bottom-2.5 right-2.5 bg-slate-900/85 hover:bg-slate-950 backdrop-blur text-white p-2 rounded-xl border border-white/10 shadow-lg cursor-pointer transition-all hover:scale-105"
                        title="Asociar imagen o preset"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-1">
                        {/* Categoría Pill */}
                        {item.categoria && (
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 p-1 rounded-md font-black uppercase tracking-wider block w-fit">
                            📁 {item.categoria.includes("->") ? item.categoria.split("->").pop()?.trim() : item.categoria}
                          </span>
                        )}
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-snug tracking-tight line-clamp-2">
                          {item.nombre}
                        </h3>
                      </div>

                      {/* Información de Costeo */}
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 font-mono text-[11px] leading-none">
                        <div className="flex justify-between items-center text-slate-505 dark:text-slate-400 font-bold">
                          <span>Neto S/IVA:</span>
                          <span className="text-slate-900 dark:text-slate-200">
                            ${item.precio_sin_iva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {item.emite_factura ? (
                          <div className="flex justify-between items-center text-indigo-650 dark:text-indigo-400 font-extrabold bg-indigo-50/20 dark:bg-indigo-950/10 p-1.5 rounded-lg border border-indigo-150/10">
                            <span>Precio C/IVA (21%):</span>
                            <span>
                              ${roundedGrossPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[8.5px] uppercase font-black text-slate-400 bg-slate-100/50 dark:bg-slate-950/40 p-1 rounded-lg text-center font-sans tracking-wide">
                            Responsable Monotributo / S/IVA
                          </div>
                        )}
                      </div>

                      {/* Info del Negocio */}
                      <div className="border-t dark:border-slate-850 pt-2.5 flex flex-col gap-1 text-[10px] text-slate-555 dark:text-slate-450 font-sans">
                        <div className="flex items-center gap-1 font-bold">
                          <Building2 size={11} className="text-indigo-505 shrink-0" />
                          <span className="truncate text-slate-800 dark:text-slate-300 font-extrabold">{item.supplierNombre}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold border-t dark:border-slate-800/40 pt-1 mt-0.5">
                          <span>Actualizado:</span>
                          <span>{item.last_updated}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODAL PARA CAMBIO DE IMAGEN */}
          {editingImageItem && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border dark:border-slate-815 text-left space-y-4 font-sans max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b dark:border-slate-850 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileImage className="text-indigo-505" size={16} />
                    Asociar Imagen para {editingImageItem.nombre}
                  </h3>
                  <button 
                    onClick={() => { setEditingImageItem(null); setNewImageUrl(''); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Vista previa de la imagen actual */}
                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-850">
                  <div className="size-16 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 relative border dark:border-slate-800">
                    {newImageUrl ? (
                      <img src={newImageUrl} alt="Ajuste preliminar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-white">
                        <Loader2 className="animate-spin" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase text-indigo-505 block">Visualización en la Ficha</p>
                    <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                      Carga una imagen nueva de tu computadora, reutiliza un diseño del catálogo o asocia un preajuste temático de inmediato.
                    </p>
                  </div>
                </div>

                {/* SUBIDA DE ARCHIVO DESDE EL ESCRITORIO */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Carga de Imagen Local:</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-100/40 dark:hover:bg-slate-900/30 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="animate-spin text-indigo-550" size={15} />
                        Subiendo imagen al Storage...
                      </>
                    ) : (
                      <>
                        <Upload className="text-indigo-550" size={15} />
                        Cargar desde mi Escritorio / PC
                      </>
                    )}
                  </button>
                </div>

                {/* Pegar enlace personalizado (opcional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
                    <span>O pegar enlace URL de Imagen:</span>
                    <span className="text-[9px] text-slate-400 font-normal normal-case">Pega enlaces externos</span>
                  </label>
                  <input 
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mifoto.jpg"
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-550"
                  />
                </div>

                {/* CATÁLOGO DE IMÁGENES REUTILIZABLES (Colección de imágenes ya cargadas) */}
                {(() => {
                  const loadedSupplierImages = Array.from(
                    new Set(
                      suppliers
                        .flatMap(s => s.items_provee || [])
                        .map(item => item.imagen)
                        .filter((img): img is string => typeof img === 'string' && img.trim() !== '')
                    )
                  );

                  if (loadedSupplierImages.length > 0) {
                    return (
                      <div className="space-y-2 border-t dark:border-slate-800 pt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">♻️ Reutilizar de Insumos Cargados (Ahorro de Memoria):</span>
                        <div className="grid grid-cols-4 gap-2 max-h-[110px] overflow-y-auto pr-1">
                          {loadedSupplierImages.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewImageUrl(imgUrl)}
                              className={`aspect-square p-0.5 border rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer
                                ${newImageUrl === imgUrl ? "border-indigo-505 ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800"}`}
                              title="Hacer click para reutilizar esta imagen"
                            >
                              <img src={imgUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Preajustes Premium 3D de Unsplash */}
                <div className="space-y-2 border-t dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">🎨 Preajustes Rápidos / Ejemplos Unsplash:</span>
                  <div className="grid grid-cols-2 gap-2 max-h-[115px] overflow-y-auto pr-1">
                    {[
                      { name: "Filamento PLA Blanco", url: "https://images.unsplash.com/photo-1615840287214-7fe58a8f668f?auto=format&fit=crop&w=300&q=80" },
                      { name: "Filamento PLA Negro", url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=300&q=80" },
                      { name: "Filamento PLA Rojo", url: "https://images.unsplash.com/photo-1614850523011-8f49fc9ea66a?auto=format&fit=crop&w=300&q=80" },
                      { name: "Filamento PLA Azul", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80" },
                      { name: "Filamento PLA Amarillo", url: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?auto=format&fit=crop&w=300&q=80" },
                      { name: "Resina UV Standard", url: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=300&q=80" },
                      { name: "Boquilla (Brass Nozzle)", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" },
                      { name: "Partes Impresora (Hotend)", url: "https://images.unsplash.com/photo-1530124391168-bfa3b94b29de?auto=format&fit=crop&w=300&q=80" }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewImageUrl(preset.url)}
                        className={`p-1.5 border rounded-xl text-left text-[9px] font-bold flex gap-1.5 items-center transition-all cursor-pointer hover:border-indigo-505
                          ${newImageUrl === preset.url ? "border-indigo-505 bg-indigo-50/10 dark:bg-indigo-950/15" : "border-slate-150 dark:border-slate-800"}`}
                      >
                        <img src={preset.url} alt="" referrerPolicy="no-referrer" className="size-5 rounded object-cover shrink-0" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => { setEditingImageItem(null); setNewImageUrl(''); }}
                    className="flex-1 bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-350 py-2.5 rounded-xl font-bold uppercase text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSaveItemImage(editingImageItem.supplierId, editingImageItem.itemId, newImageUrl)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold uppercase text-[10px] shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={11} />
                    Asociar de Inmediato
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN POR LOTE (BULK IMPORT) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border dark:border-slate-815 text-left space-y-4 font-sans">
            <div className="flex justify-between items-center border-b dark:border-slate-850 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="text-emerald-555" size={16} />
                Importar Insumos en Lote por Texto
              </h3>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5 font-sans">
              <span className="text-[10px] font-black uppercase text-emerald-600 block">💡 Formato Resiliente Inteligente</span>
              <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-normal font-semibold">
                Pega tus renglones de precios directamente desde WhatsApp, Bloc de notas o emails. El sistema procesará inteligentemente cada línea buscando nombres y precios. Formatos preferidos:
              </p>
              <pre className="bg-slate-50 dark:bg-slate-950 px-2.5 py-2 rounded-lg font-mono text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed max-h-[85px] overflow-y-auto">
{`PLA Grilon Celeste: 12400
PLA 3DM Negro - 11000
Resina Standard LCD 15200`}
              </pre>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Pega el texto aquí:</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-955 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white min-h-[160px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Pegue aquí el bloque de texto..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-350 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px]"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleBulkParse}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow cursor-pointer"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl border dark:border-slate-815 text-left">
            <div className="size-16 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center mb-1 uppercase tracking-tight">¿Eliminar Proveedor?</h3>
            <p className="text-slate-505 dark:text-slate-400 text-center mb-6 text-xs leading-relaxed font-semibold">
              Esta acción eliminará al proveedor e inhabilitará su catálogo de costos mayoristas del simulador de fletes y Torre de Control Logística.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px]"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
