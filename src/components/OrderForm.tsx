import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  User, 
  PenTool, 
  CreditCard, 
  Settings,
  Calendar,
  Badge,
  Phone,
  MapPin,
  Mail,
  FileText,
  Hammer,
  Tag,
  ShoppingBasket,
  DollarSign,
  Wallet,
  CheckCircle,
  Timer,
  CalendarCheck,
  Loader2,
  ArrowLeft,
  Save,
  Search,
  Package,
  Plus,
  Minus,
  History,
  Navigation,
  ChevronRight,
  Check,
  ChevronLeft,
  Zap,
  Target,
  Clock,
  Briefcase,
  Flag,
  AlertTriangle,
  Heart,
  Wand2,
  HelpCircle,
  ChevronDown,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
import { apiService } from '@/src/services/apiService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GeminiService } from '../services/geminiService';
import { cn } from '@/src/lib/utils';
import { useApp } from '../context/AppContext';
import { VariableHelp } from './VariableHelp';
import { renderSmartText } from '../lib/textUtils';
import { toast } from 'sonner';

export function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const { businessProfile } = useApp();
  const userName = user?.user_metadata?.full_name || user?.email || 'Sistema';
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [availableSellers, setAvailableSellers] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  
  // Estados para Búsqueda Inteligente
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemResults, setItemResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showItemResults, setShowItemResults] = useState(false);
  const [deductStock, setDeductStock] = useState(true);
  
  // Lista de Feriados Nacionales Argentinos 2024/2025 (Simplificada)
  const FERIADOS_ARG = [
    '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-24', '2024-03-28', '2024-03-29', '2024-04-01', '2024-04-02', '2024-05-01', '2024-05-25', '2024-06-17', '2024-06-20', '2024-06-21', '2024-07-09', '2024-08-17', '2024-10-11', '2024-10-12', '2024-11-18', '2024-11-20', '2024-12-08', '2024-12-25',
    '2025-01-01', '2025-03-03', '2025-03-04', '2025-03-24', '2025-04-02', '2025-04-17', '2025-04-18', '2025-05-01', '2025-05-25', '2025-06-16', '2025-06-20', '2025-07-09', '2025-08-15', '2025-10-12', '2025-11-20', '2025-12-08', '2025-12-25'
  ];

  // Función para calcular Hoy + 3 días hábiles (Salta Fines de semana y Feriados Argentinos)
  const getInitialDeliveryDate = () => {
    let date = new Date();
    let count = 0;
    while (count < 3) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      const isWeekend = day === 0 || day === 6;
      const isHoliday = FERIADOS_ARG.includes(dateStr);
      
      if (!isWeekend && !isHoliday) count++;
    }
    return date.toISOString().split('T')[0];
  };

  // Función para obtener código afiliado si sigue vigente
  const getAffiliateCode = () => {
    const code = localStorage.getItem('g3d_affiliate_ref');
    const expires = localStorage.getItem('g3d_affiliate_expires');
    if (code && expires && Date.now() < parseInt(expires, 10)) {
      return code;
    }
    // Si expiró o no existe limpiamos
    if (expires && Date.now() > parseInt(expires, 10)) {
      localStorage.removeItem('g3d_affiliate_ref');
      localStorage.removeItem('g3d_affiliate_expires');
    }
    return userName;
  };

  const [formData, setFormData] = useState({
    CLIENTE_NOMBRE: '',
    CLIENTE_TELEFONO: '',
    CLIENTE_DIRECCION: '',
    CLIENTE_EMAIL: '',
    DESCRIPCION: '',
    NUEVA_NOTA: '', // Para bitácora incremental
    TIPO_TRABAJO: 'Impresión 3D',
    CANTIDAD: 1,
    PRECIO_TOTAL: 0,
    TOTAL_PAGADO: 0,
    ESTADO_PEDIDO: 'PRESUPUESTAR',
    FECHA_ENTREGA: getInitialDeliveryDate(),
    VENDEDOR: getAffiliateCode(),
    LAT: -34.6037, // Default Buenos Aires
    LNG: -58.3816,
    DELIVERY_MIN: 1,
    DELIVERY_MAX: 3,
    PESO_KG: 0,
    VOLUMEN_M3: 0
  });

  const [logisticsConfig, setLogisticsConfig] = useState<any>(null);

  useEffect(() => {
    async function loadLogistics() {
      const config = await apiService.getLogisticsConfig();
      setLogisticsConfig(config);
    }
    loadLogistics();
    async function loadStatuses() {
      const { data, error } = await supabase
        .from('diccionario_estados_pedido')
        .select('*')
        .eq('es_activo', true);
      
      if (!error && data) {
        // Ordenar por nivel_prioridad o orden si existen
        const sortedData = [...data].sort((a, b) => {
          const orderA = a.orden ?? a.nivel_prioridad ?? 0;
          const orderB = b.orden ?? b.nivel_prioridad ?? 0;
          return orderA - orderB;
        });
        setAvailableStatuses(sortedData);
      }
    }
    loadStatuses();

    async function loadSellers() {
      const sellers = await apiService.getSellers();
      setAvailableSellers(sellers);
    }
    loadSellers();

    async function loadCategories() {
      const categories = await apiService.getCategories();
      setAvailableCategories(categories || []);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchOrder = async () => {
        try {
          const order = await apiService.getOrderById(id);
          if (order) {
            setFormData({
              CLIENTE_NOMBRE: order.cliente_nombre || '',
              CLIENTE_TELEFONO: order.cliente_telefono || '',
              CLIENTE_DIRECCION: order.cliente_direccion || '',
              CLIENTE_EMAIL: order.cliente_email || '',
              DESCRIPCION: order.descripcion || '',
              TIPO_TRABAJO: order.tipo_trabajo || 'Impresión 3D',
              CANTIDAD: order.cantidad || 1,
              PRECIO_TOTAL: order.precio_total || 0,
              TOTAL_PAGADO: order.total_pagado || 0,
              ESTADO_PEDIDO: order.estado_pedido || 'PRESUPUESTAR',
              FECHA_ENTREGA: order.fecha_entrega || getInitialDeliveryDate(),
              VENDEDOR: order.vendedor || userName,
              LAT: parseFloat(order.lat) || -34.6037,
              LNG: parseFloat(order.lng) || -58.3816,
              DELIVERY_MIN: order.delivery_min || 1,
              DELIVERY_MAX: order.delivery_max || 3
            });
          } else {
            alert("No se encontró el pedido a editar.");
            navigate('/pedidos');
          }
        } catch (error) {
          console.error("Error fetching order for edit:", error);
        } finally {
          setFetching(false);
        }
      };
      fetchOrder();
    }
  }, [id, isEdit, navigate, userName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'PRECIO_TOTAL' || name === 'TOTAL_PAGADO' || name === 'CANTIDAD' ? parseFloat(value) || 0 : value 
    }));

    // Búsqueda de clientes en tiempo real
    if (name === 'CLIENTE_NOMBRE') {
      if (value.length > 2) {
        handleCustomerSearch(value);
      } else {
        setCustomerResults([]);
        setShowCustomerResults(false);
      }
    }
  };

  const handleCustomerSearch = async (query: string) => {
    const results = await apiService.searchCustomers(query);
    setCustomerResults(results);
    setShowCustomerResults(results.length > 0);
  };

  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      CLIENTE_NOMBRE: customer.cliente_nombre,
      CLIENTE_TELEFONO: customer.cliente_telefono || '',
      CLIENTE_DIRECCION: customer.cliente_direccion || '',
      CLIENTE_EMAIL: customer.cliente_email || ''
    }));
    setShowCustomerResults(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          if (data.display_name) {
            setFormData(prev => ({ 
              ...prev, 
              CLIENTE_DIRECCION: data.display_name,
              LAT: latitude,
              LNG: longitude
            }));
          } else {
            setFormData(prev => ({ 
              ...prev, 
              CLIENTE_DIRECCION: `${latitude}, ${longitude}`,
              LAT: latitude,
              LNG: longitude
            }));
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setFormData(prev => ({ 
            ...prev, 
            CLIENTE_DIRECCION: `${latitude}, ${longitude}`,
            LAT: latitude,
            LNG: longitude
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de dar permisos de GPS.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleItemSearch = async (query: string) => {
    setItemSearch(query);
    if (query.length > 1) {
      const results = await apiService.searchInsumos(query);
      setItemResults(results);
      setShowItemResults(true);
    } else {
      setItemResults([]);
      setShowItemResults(false);
    }
  };

  const addItemToOrder = (item: any) => {
    const newItem = {
      id: item.id,
      nombre: item.nombre,
      precio: item.costo_publico || 0,
      cantidad: 1,
      unidad: item.unidad
    };
    
    setSelectedItems(prev => [...prev, newItem]);
    
    const details = [];
    if (item.detalle_vendedor) details.push(`[SISTEMA]: ${item.detalle_vendedor}`);
    if (item.detalle_empleado) details.push(`[PRODUCCIÓN]: ${item.detalle_empleado}`);
    
    const itemDetail = details.length > 0 ? details.join('\n') : (item.detalle_cliente || '');
    const newDesc = formData.DESCRIPCION 
      ? `${formData.DESCRIPCION}\n\n* ${item.nombre.toUpperCase()}:\n${itemDetail}` 
      : `* ${item.nombre.toUpperCase()}:\n${itemDetail}`;
    
    setFormData(prev => ({
      ...prev,
      DESCRIPCION: newDesc,
      PRECIO_TOTAL: prev.PRECIO_TOTAL + (item.costo_publico || 0),
      DELIVERY_MIN: item.delivery_min || prev.DELIVERY_MIN,
      DELIVERY_MAX: item.delivery_max || prev.DELIVERY_MAX
    }));
    
    setItemSearch('');
    setShowItemResults(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.CLIENTE_NOMBRE || formData.PRECIO_TOTAL <= 0) {
      alert("Por favor complete los campos obligatorios antes de finalizar.");
      return;
    }

    setLoading(true);
    
    try {
      // Si hay una nueva nota, la agregamos a la descripción con fecha y usuario
      let finalDescription = formData.DESCRIPCION;
      if (formData.NUEVA_NOTA) {
        const now = new Date().toLocaleString();
        const note = `\n[${now} - ${userName}]: ${formData.NUEVA_NOTA}`;
        finalDescription = `${formData.DESCRIPCION}${note}`;
      }

      let result;
      if (isEdit) {
        result = await apiService.updateOrder(id, { ...formData, DESCRIPCION: finalDescription });
      } else {
        result = await apiService.createOrder({ ...formData, DESCRIPCION: finalDescription }, user || { name: 'Sistema' });
      }
      
      if (result?.success) {
        if (deductStock && selectedItems.length > 0) {
          for (const item of selectedItems) {
            await apiService.updateStock(item.id, -item.cantidad);
          }
        }
        navigate(isEdit ? `/pedidos/${id}` : '/pedidos');
      } else {
        alert("Error al guardar el pedido.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (activeStep === 1 && !formData.CLIENTE_NOMBRE) {
      alert("Debe ingresar el nombre del cliente.");
      return;
    }
    if (activeStep === 2 && (!formData.DESCRIPCION || !formData.ESTADO_PEDIDO)) {
      alert("Debe completar la descripción y seleccionar un estado para la producción.");
      return;
    }
    setActiveStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { id: 1, title: 'Identidad', icon: User },
    { id: 2, title: 'Producción', icon: Hammer },
    { id: 3, title: 'Finanzas', icon: CreditCard }
  ];

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className=" text-primary" size={48} />
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs ">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-10 px-4">
      {/* Progress Wizard */}
      <div className="w-full max-w-4xl mb-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              {isEdit ? `Editando #${id}` : 'Nuevo Pedido'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Paso {activeStep} de 3: {steps.find(s => s.id === activeStep)?.title}
            </p>
          </div>
          <button 
            onClick={() => navigate(isEdit ? `/pedidos/${id}` : '/pedidos')}
            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors duration-150 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm border border-slate-100 dark:border-white/5"
          >
            <ArrowLeft size={24} />
          </button>
        </header>

        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 dark:bg-white/5 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-10 transition-colors duration-150 duration-500"
            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = activeStep > s.id;
            const isActive = activeStep === s.id;
            
            return (
              <div key={s.id} className="relative z-20 flex flex-col items-center gap-3">
                <div 
                  onClick={() => s.id < activeStep && setActiveStep(s.id)}
                  className={cn(
                    "size-12 rounded-2xl flex items-center justify-center transition-colors duration-150 border-2 shadow-lg",
                    isActive ? "bg-primary border-primary text-white scale-110 ring-4 ring-primary/10" : 
                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white cursor-pointer" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-600"
                  )}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.2em]",
                  isActive ? "text-primary" : isCompleted ? "text-emerald-500" : "text-slate-400 dark:text-slate-600 shadow-none"
                )}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8 min-h-[500px]">
        {/* PASO 1: CLIENTE */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[40px] shadow-md border border-slate-100 dark:border-white/5 space-y-6">
              <div className="relative">
                <InputField 
                  label="Nombre y Apellido del Cliente" 
                  name="CLIENTE_NOMBRE"
                  value={formData.CLIENTE_NOMBRE}
                  onChange={handleChange}
                  onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                  onFocus={() => formData.CLIENTE_NOMBRE.length > 2 && setShowCustomerResults(true)}
                  placeholder="Escriba el nombre..." 
                  icon={Badge} 
                  required
                />
                {showCustomerResults && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-50 dark:divide-white/5">
                    {customerResults.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary">{c.cliente_nombre}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{c.cliente_telefono || 'Sin teléfono'}</p>
                        </div>
                        <Plus size={16} className="text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                  label="Teléfono / WhatsApp" 
                  name="CLIENTE_TELEFONO"
                  value={formData.CLIENTE_TELEFONO}
                  onChange={handleChange}
                  placeholder="+54 9 11 ..." 
                  icon={Phone} 
                />
                <InputField 
                  label="Email de ContactO" 
                  name="CLIENTE_EMAIL"
                  type="email"
                  value={formData.CLIENTE_EMAIL}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com" 
                  icon={Mail} 
                />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <InputField 
                    label="Dirección de Entrega" 
                    name="CLIENTE_DIRECCION"
                    value={formData.CLIENTE_DIRECCION}
                    onChange={handleChange}
                    placeholder="Calle 123, Ciudad..." 
                    icon={MapPin} 
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="absolute right-4 top-10 p-2 text-slate-300 dark:text-slate-600 hover:text-primary transition-colors duration-150"
                  >
                    {isLocating ? <Loader2 size={18} className=" text-primary" /> : <Navigation size={18} />}
                  </button>
                </div>
                
                <div className="h-44 w-full rounded-2xl shadow-sm border-4 border-slate-50 dark:border-slate-800 overflow-hidden shadow-inner relative">
                  <MapContainer 
                    center={[formData.LAT, formData.LNG]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <DraggableMarker formData={formData} setFormData={setFormData} />
                    <MapRecenter lat={formData.LAT} lng={formData.LNG} />
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: PRODUCCIÓN */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[40px] shadow-md border border-slate-100 dark:border-white/5 space-y-8">
              
              {/* Selector de Estado (Compacto) */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Flag size={14} className="text-primary" />
                  Estado del Pedido en Producción
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => {
                    const isSelected = formData.ESTADO_PEDIDO === status.nombre_estado;
                    const statusColor = status.color_pastel_hex || '#f1f5f9';
                    
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ESTADO_PEDIDO: status.nombre_estado }))}
                        className={cn(
                          "px-3 py-2 rounded-xl border-2 transition-colors duration-150 flex items-center gap-2 shrink-0",
                          isSelected 
                            ? "bg-white dark:bg-slate-800 shadow-md scale-105 border-primary ring-4 ring-primary/5" 
                            : "bg-slate-50/50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        <div 
                          className="size-2.5 rounded-full shadow-inner"
                          style={{ backgroundColor: statusColor }}
                        />
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest",
                          isSelected ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {status.nombre_estado}
                        </span>
                        {isSelected && <Check size={12} className="text-primary" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asistente de Catálogo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBasket size={14} className="text-primary" />
                    Asistente de Stock
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-primary uppercase tracking-tighter">Descontar Stock</span>
                    <input type="checkbox" checked={deductStock} onChange={(e) => setDeductStock(e.target.checked)} className="size-4 accent-primary rounded cursor-pointer" />
                  </label>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={itemSearch} 
                    onChange={(e) => handleItemSearch(e.target.value)} 
                    placeholder="Escribe un insumo para cargar rápidamente..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 border-transparent dark:border-white/5 focus:ring-4 focus:ring-primary/5 text-xs font-bold shadow-sm dark:text-white dark:placeholder:text-slate-600"
                  />
                  {showItemResults && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-50 dark:divide-white/5">
                      {itemResults.map(item => (
                        <button key={item.id} type="button" onClick={() => addItemToOrder(item)} className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between group">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.nombre}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{item.categoria} (${item.costo_publico})</p>
                          </div>
                          <Plus size={16} className="text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bitácora Técnica (PRINCIPAL) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <label className="text-[10px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <PenTool size={16} className="text-primary" />
                    Hoja de Ruta / Bitácora Técnica
                  </label>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/5">OBLIGATORIO</span>
                </div>
                
                {/* Si es edición y no es admin, la descripción base es solo lectura */}
                {isEdit && userRole !== 'Admin' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-white/5 opacity-70">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Descripción Base (Bloqueada)</p>
                      {formData.DESCRIPCION || 'Sin descripción'}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-4">Agregar nota a la bitácora</label>
                      <textarea 
                        name="NUEVA_NOTA"
                        value={formData.NUEVA_NOTA}
                        onChange={handleChange}
                        placeholder="Escribe aquí el avance o detalle nuevo..."
                        className="w-full min-h-[120px] text-sm font-medium p-4 rounded-2xl shadow-sm border-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm ring-0 focus:ring-4 focus:ring-primary/5 transition-colors duration-150 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <textarea 
                      name="DESCRIPCION"
                      value={formData.DESCRIPCION}
                      onChange={handleChange}
                      placeholder="Describe aquí todos los detalles técnicos para la fabricación: medidas, colores, rellenos, etc..."
                      className="w-full min-h-[250px] text-lg font-medium p-5 rounded-[40px] border-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors duration-150 shadow-inner outline-none ring-0 focus:ring-4 focus:ring-primary/5"
                    />
                    <div className="absolute right-6 bottom-6 flex items-center gap-2">
                      <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Optimizar con IA</p>
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (!formData.DESCRIPCION) return;
                          setLoading(true);
                          try {
                            const fixed = await GeminiService.fixText(formData.DESCRIPCION, businessProfile.ai_prompt);
                            setFormData(prev => ({ ...prev, DESCRIPCION: fixed }));
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="size-10 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20   transition-colors duration-150"
                      >
                        <Zap size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Especificaciones de Carga (Logística) */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl shadow-sm border border-blue-100/50 dark:border-blue-900/20 space-y-4">
                <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Package size={14} /> Dimensiones para Logística
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-2">PESO (KG)</label>
                    <input 
                      type="number" 
                      name="PESO_KG"
                      value={formData.PESO_KG}
                      onChange={handleChange}
                      className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-colors duration-150 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-2">VOLUMEN (M³)</label>
                    <input 
                      type="number" 
                      name="VOLUMEN_M3"
                      value={formData.VOLUMEN_M3}
                      onChange={handleChange}
                      className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-colors duration-150 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tiempos de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-50 dark:border-white/5">
                <div className="space-y-4 text-left">
                   <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Trabajo</label>
                   <CategoryPicker 
                      value={formData.TIPO_TRABAJO}
                      categories={availableCategories}
                      onChange={(val: any) => setFormData(prev => ({ ...prev, TIPO_TRABAJO: val }))}
                   />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block text-center">Plazo de Entrega (Días hábiles)</label>
                  <div className="flex items-center gap-4">
                    <input type="number" name="DELIVERY_MIN" value={formData.DELIVERY_MIN} onChange={handleChange} className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-[20px] text-center font-bold text-lg focus:ring-2 focus:ring-primary/10 transition-colors duration-150 outline-none" placeholder="Mín" />
                    <span className="font-bold text-slate-200 dark:text-slate-700">A</span>
                    <input type="number" name="DELIVERY_MAX" value={formData.DELIVERY_MAX} onChange={handleChange} className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-[20px] text-center font-bold text-lg focus:ring-2 focus:ring-primary/10 transition-colors duration-150 outline-none" placeholder="Máx" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase italic">
                    <Clock size={14} />
                    <span>Se mostrará como "{formData.DELIVERY_MIN} a {formData.DELIVERY_MAX} días"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: FINANZAS */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
               <div className="absolute top-[-50px] right-[-50px] p-5 opacity-5"><DollarSign size={300} /></div>
               
               <div className="space-y-10 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-4">Precio Total del Trabajo</label>
                       <div className="relative group">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-500">$</span>
                          <input 
                            type="number" 
                            name="PRECIO_TOTAL"
                            value={formData.PRECIO_TOTAL || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border-2 border-white/5 hover:border-white/10 focus:border-primary focus:bg-white/20 transition-colors duration-150 rounded-2xl shadow-sm py-8 pl-14 pr-8 text-5xl font-bold outline-none tracking-tighter"
                            placeholder="0"
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-4">Monto Recibido</label>
                       <div className="relative group">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-500">$</span>
                          <input 
                            type="number" 
                            name="TOTAL_PAGADO"
                            value={formData.TOTAL_PAGADO || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border-2 border-white/5 hover:border-white/10 focus:border-emerald-500 focus:bg-white/20 transition-colors duration-150 rounded-2xl shadow-sm py-8 pl-14 pr-8 text-5xl font-bold outline-none text-emerald-400 tracking-tighter"
                            placeholder="0"
                          />
                       </div>
                    </div>
                  </div>

                  <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.5em]">Saldo Pendiente a Cobrar</p>
                    <p className={cn(
                      "text-7xl font-bold tracking-tighter",
                      formData.PRECIO_TOTAL - formData.TOTAL_PAGADO > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      ${(formData.PRECIO_TOTAL - formData.TOTAL_PAGADO).toLocaleString()}
                    </p>
                    {formData.PRECIO_TOTAL - formData.TOTAL_PAGADO <= 0 && formData.PRECIO_TOTAL > 0 && (
                      <div className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Check size={16} /> Pedido Totalmente Pagado</div>
                    )}
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-[40px] border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="size-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
                  {formData.VENDEDOR.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Estado del Pedido</p>
                  <div className="flex items-center gap-2 font-bold text-emerald-500 uppercase tracking-widest text-xs">
                     <div className="size-2 rounded-full bg-emerald-500 " />
                     {formData.ESTADO_PEDIDO || 'SIN DEFINIR'}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Responsable de Carga</p>
                  {userRole === 'Admin' ? (
                    <select 
                      name="VENDEDOR"
                      value={formData.VENDEDOR}
                      onChange={handleChange}
                      className="text-lg font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-primary transition-colors"
                    >
                      {availableSellers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formData.VENDEDOR}</p>
                  )}
                </div>
              </div>
              <div className="text-center sm:text-right flex flex-col items-center sm:items-end w-full sm:w-auto">
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Vencimiento / Entrega</p>
                <div className="flex items-center gap-2 text-primary font-bold text-lg bg-primary/5 px-4 py-2 rounded-2xl">
                  <CalendarCheck size={20} />
                  <span>{formData.FECHA_ENTREGA}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navegación Step-by-Step */}
        <footer className="flex items-center justify-between gap-4 pt-12">
          {activeStep > 1 ? (
            <button 
              type="button" 
              onClick={prevStep}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-sm bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-colors duration-150 border border-slate-200 dark:border-white/10 shadow-sm"
            >
              <ChevronLeft size={20} />
              Atrás
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => navigate('/pedidos')}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-sm bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 hover:text-rose-500 font-bold uppercase tracking-[0.2em] text-[10px] transition-colors duration-150 border border-slate-200 dark:border-white/10 shadow-sm"
            >
              Cancelar
            </button>
          )}

          {activeStep < 3 ? (
            <button 
              type="button" 
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-4 px-6 py-4 rounded-2xl shadow-sm bg-slate-900 dark:bg-slate-900 text-white shadow-sm border border-slate-700 font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02]  transition-colors duration-150 shadow-md shadow-slate-200 dark:shadow-black/20 outline-none"
            >
              Continuar 
              <ChevronRight size={22} className="" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => handleSubmit()}
              disabled={loading || formData.PRECIO_TOTAL <= 0}
              className="flex-1 flex items-center justify-center gap-4 px-6 py-4 rounded-2xl shadow-sm bg-slate-900 text-white shadow-sm border border-slate-700 font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02]  transition-colors duration-150 shadow-md shadow-primary/30 disabled:opacity-50 outline-none"
            >
              {loading ? <Loader2 size={24} className="" /> : <CheckCircle size={24} />}
              {isEdit ? 'Aplicar Cambios' : 'Confirmar Pedido'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// Map Helpers
const DraggableMarker = ({ formData, setFormData }: any) => {
  const markerRef = useRef<any>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          setFormData((prev: any) => ({ ...prev, LAT: pos.lat, LNG: pos.lng }));
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) setFormData((prev: any) => ({ ...prev, CLIENTE_DIRECCION: data.display_name }));
            });
        }
      },
    }),
    [],
  );
  return <Marker draggable={true} eventHandlers={eventHandlers} position={[formData.LAT, formData.LNG]} ref={markerRef} />;
};

const MapRecenter = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng]);
  return null;
};

// Reusable UI Components
function InputField({ label, icon: Icon, prefix, ...props }: any) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
        {Icon && <Icon size={12} className="text-slate-400 dark:text-slate-500" />}
        {label}
      </label>
      <div className="relative group">
        {prefix && <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">{prefix}</span>}
        <input 
          className={cn(
            "w-full bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/5 transition-colors duration-150 rounded-[24px] py-4 px-6 text-xs font-bold outline-none",
            prefix && "pl-12"
          )}
          {...props}
        />
      </div>
    </div>
  );
}

function CategoryPicker({ value, categories, onChange }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><Briefcase size={18} /></div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-transparent focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/5 text-xs font-bold shadow-sm appearance-none outline-none"
      >
        {categories.map((c: any) => <option key={c.id} value={c.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{c.name}</option>)}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
        <ChevronDown size={20} />
      </div>
    </div>
  );
}
