import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { SellerProfile, ResellerItem } from '../types';
import { 
  Building2, 
  Palette, 
  MapPin, 
  DollarSign, 
  ShieldAlert,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  XCircle,
  Link as LinkIcon,
  Copy,
  Tag,
  Boxes,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Percent,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CascadingCategorySelector } from './CascadingCategorySelector';
import { ImageManager } from './ImageManager';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function SellersManager() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'Admin';

  // Navegación de sección principal
  const [activeTab, setActiveTab] = useState<'sellers' | 'items'>(isAdmin ? 'sellers' : 'items');

  // Perfiles de vendedores / revendedores
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [editingSeller, setEditingSeller] = useState<Partial<SellerProfile> | null>(null);
  const [isSavingSeller, setIsSavingSeller] = useState(false);

  // Catálogo unificado de ítems
  const [allItems, setAllItems] = useState<ResellerItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Filtros para la pestaña "Todos los Ítems"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReseller, setFilterReseller] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterStockType, setFilterStockType] = useState('todos');

  // Gestión de Catálogo de un Vendedor Específico
  const [viewingCatalogSeller, setViewingCatalogSeller] = useState<SellerProfile | null>(null);
  const [catalogItems, setCatalogItems] = useState<ResellerItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Modal para Crear/Editar un Ítem Individual (del Catálogo de un Vendedor o general)
  const [editingItem, setEditingItem] = useState<Partial<ResellerItem> | null>(null);

  useEffect(() => {
    fetchSellers();
    fetchAllItems();
  }, [user]);

  const fetchSellers = async () => {
    setLoadingSellers(true);
    const data = await apiService.getSellersList();
    setSellers(data);
    setLoadingSellers(false);
  };

  const fetchAllItems = async () => {
    setLoadingItems(true);
    // Filtrado si no es admin, ya lo hace internamente la api o lo aplicamos
    const data = await apiService.getResellerItems();
    if (isAdmin) {
      setAllItems(data);
    } else if (user?.id) {
      setAllItems(data.filter((it: any) => it.revendedor_id === user.id));
    } else {
      setAllItems([]);
    }
    setLoadingItems(false);
  };

  const loadResellerCatalog = async (seller: SellerProfile) => {
    setViewingCatalogSeller(seller);
    setLoadingCatalog(true);
    const data = await apiService.getResellerItems(seller.id);
    setCatalogItems(data);
    setLoadingCatalog(false);
  };

  const copyAffiliateLink = (cod: string) => {
    if (!cod) {
      toast.error('Este vendedor no tiene código promocional configurado.');
      return;
    }
    const link = `${window.location.origin}/?ref=${cod}`;
    navigator.clipboard.writeText(link);
    toast.success('¡Enlace de Referido Copiado!', {
      description: 'El vendedor puede usar este link para invitar clientes.'
    });
  };

  // Guardar perfil de vendedor
  const handleSaveSeller = async () => {
    if (!editingSeller?.nombre_negocio) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }

    setIsSavingSeller(true);
    const sellerId = editingSeller.id || crypto.randomUUID();

    const payload = {
      ...editingSeller,
      iva_incluido: editingSeller.iva_incluido ?? false,
      descuento_efectivo: Number(editingSeller.descuento_efectivo) || 10,
      descuento_transferencia: Number(editingSeller.descuento_transferencia) || 5,
    };

    const success = await apiService.updateSellerProfile(sellerId, payload);
    
    if (success) {
      setEditingSeller(null);
      toast.success("Perfil de negocio guardado exitosamente");
      fetchSellers();
    } else {
      toast.error("Error al guardar el perfil");
    }
    setIsSavingSeller(false);
  };

  // Cálculos dinámicos bidireccionales del Formulario de Ítems
  const handleItemPriceChange = (
    field: 'precio' | 'precio_con_iva' | 'precio_efectivo' | 'precio_transferencia', 
    value: string,
    sellerDefaults?: { iva_incluido?: boolean; desc_efectivo?: number; desc_transferencia?: number }
  ) => {
    if (!editingItem) return;

    const numericVal = value === '' ? 0 : parseFloat(value) || 0;
    const isIvaInc = sellerDefaults?.iva_incluido ?? false;
    const descEf = sellerDefaults?.desc_efectivo ?? 10;
    const descTr = sellerDefaults?.desc_transferencia ?? 5;

    let updated = { ...editingItem };

    if (field === 'precio') {
      // Neto cambiado
      updated.precio = numericVal;
      updated.precio_con_iva = isIvaInc ? numericVal : Number((numericVal * 1.21).toFixed(2));
      updated.precio_efectivo = Number((updated.precio_con_iva * (1 - descEf / 100)).toFixed(2));
      updated.precio_transferencia = Number((updated.precio_con_iva * (1 - descTr / 100)).toFixed(2));
    } else if (field === 'precio_con_iva') {
      // Público cambiado
      updated.precio_con_iva = numericVal;
      updated.precio = isIvaInc ? numericVal : Number((numericVal / 1.21).toFixed(2));
      updated.precio_efectivo = Number((numericVal * (1 - descEf / 100)).toFixed(2));
      updated.precio_transferencia = Number((numericVal * (1 - descTr / 100)).toFixed(2));
    } else if (field === 'precio_efectivo') {
      updated.precio_efectivo = numericVal;
    } else if (field === 'precio_transferencia') {
      updated.precio_transferencia = numericVal;
    }

    setEditingItem(updated);
  };

  // Guardar Ítem de catálogo
  const handleSaveItem = async () => {
    if (!editingItem?.nombre) {
      toast.error("El nombre del artículo es obligatorio");
      return;
    }
    if (!editingItem?.revendedor_id) {
      toast.error("Error: el ítem debe pertenecer a un revendedor");
      return;
    }

    setIsSavingItem(true);
    const itemId = editingItem.id || crypto.randomUUID();
    
    const finalPayload = {
      ...editingItem,
      precio: Number(editingItem.precio) || 0,
      precio_con_iva: Number(editingItem.precio_con_iva) || 0,
      precio_efectivo: Number(editingItem.precio_efectivo) || 0,
      precio_transferencia: Number(editingItem.precio_transferencia) || 0,
      stock: Number(editingItem.stock) || 0,
      stock_tipo: editingItem.stock_tipo || 'fijo',
      estado: editingItem.estado || 'activo',
    };

    const res = await apiService.saveResellerItem(itemId, finalPayload);
    
    if (res.success) {
      toast.success("Artículo de catálogo guardado correctamente");
      setEditingItem(null);
      // Recargar datos
      if (viewingCatalogSeller) {
        loadResellerCatalog(viewingCatalogSeller);
      }
      fetchAllItems();
    } else {
      toast.error("Error al registrar el artículo");
    }
    setIsSavingItem(false);
  };

  // Eliminar ítem
  const handleDeleteItem = async (itemId: string) => {
    if (confirm("¿Estás absolutamente seguro de que deseas eliminar este artículo de catálogo?")) {
      const res = await apiService.deleteResellerItem(itemId);
      if (res.success) {
        toast.success("Artículo removido del catálogo");
        if (viewingCatalogSeller) {
          loadResellerCatalog(viewingCatalogSeller);
        }
        fetchAllItems();
      } else {
        toast.error("Error al eliminar");
      }
    }
  };

  // Filtrado final de ítems master
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.categoria && item.categoria.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesReseller = filterReseller === 'todos' || item.revendedor_id === filterReseller;
    const matchesStatus = filterStatus === 'todos' || item.estado === filterStatus;
    const matchesStockType = filterStockType === 'todos' || item.stock_tipo === filterStockType;

    return matchesSearch && matchesReseller && matchesStatus && matchesStockType;
  });

  return (
    <div className="p-4 md:p-5 space-y-6 animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1.5 text-left">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Building2 className="text-slate-900 dark:text-teal-400" size={28} />
            Módulo de Revendedores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            {isAdmin 
              ? 'Panel de control comercial, esquemas fiscales de vendedores y bases de catálogos cruzados.'
              : 'Administra tu negocio y publica tus productos de manera autónoma para venta en la plataforma.'}
          </p>
        </div>

        {/* Botones de acción rápida y Tabs de pantalla */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('sellers');
                setEditingSeller({ 
                  nombre_negocio: '', 
                  color_primario: '#2dd4bf',
                  limite_deuda: 10000,
                  saldo_comisiones: 0,
                  iva_incluido: false,
                  descuento_efectivo: 10,
                  descuento_transferencia: 5
                });
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm px-3.5 py-2 rounded-xl border border-slate-700 transition-all uppercase tracking-wider"
            >
              <Plus size={15} />
              Crear Revendedor
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => {
                setEditingItem({
                  nombre: '',
                  precio: 0,
                  precio_con_iva: 0,
                  precio_efectivo: 0,
                  precio_transferencia: 0,
                  stock: 5,
                  stock_tipo: 'fijo',
                  estado: 'activo',
                  imagenes: [],
                  revendedor_id: user?.id || ''
                });
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm px-3.5 py-2 rounded-xl border border-slate-700 transition-all uppercase tracking-wider"
            >
              <Plus size={15} />
              Agregar Ítem
            </button>
          )}
        </div>
      </div>

      {/* Selectores de Solapa Superior */}
      <div className="flex items-center border-b dark:border-slate-800 pb-px gap-1.5">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('sellers')}
            className={cn(
              "px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 border-b-2 leading-none",
              activeTab === 'sellers'
                ? "border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850/40"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <Building2 size={14} />
            Directorio de Revendedores ({sellers.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('items')}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 border-b-2 leading-none",
            activeTab === 'items'
              ? "border-slate-900 dark:border-teal-400 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850/40"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <Boxes size={14} />
          {isAdmin ? `Ítems de Catálogos (${allItems.length})` : `Mi Catálogo de Ventas (${allItems.length})`}
        </button>
      </div>

      {/* VISTA A: DIRECTORIO DE REVENDEDORES / VENDEDORES */}
      {activeTab === 'sellers' && isAdmin && (
        <div className="space-y-4">
          {loadingSellers ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <div className="size-8 border-3 border-slate-900 border-t-transparent dark:border-teal-400 dark:border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando directorio comercial...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-dashed rounded-3xl">
              <Building2 className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={36} />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No hay revendedores creados aún.</p>
              <p className="text-xs text-slate-400 mt-1">Crea un nuevo perfil para comenzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sellers.map((seller) => (
                <div 
                  key={seller.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all overflow-hidden relative flex flex-col justify-between"
                >
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-5 pointer-events-none"
                    style={{ backgroundColor: seller.color_primario || '#3b82f6' }}
                  />

                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Logo o Icono de negocio */}
                      <div 
                        className="size-12 rounded-xl flex items-center justify-center text-white border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 shrink-0"
                        style={{ backgroundColor: seller.logo_url ? '#f1f5f9' : seller.color_primario || '#3b82f6' }}
                      >
                        {seller.logo_url ? (
                          <img src={seller.logo_url} alt={seller.nombre_negocio} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={24} />
                        )}
                      </div>

                      {/* Estado */}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        seller.saldo_comisiones >= seller.limite_deuda 
                          ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-350 dark:border-rose-900/30" 
                          : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-350 dark:border-emerald-950/30"
                      )}>
                        {seller.saldo_comisiones >= seller.limite_deuda ? 'Bloqueado por deuda' : 'Perfil Activo'}
                      </span>
                    </div>

                    {/* Información básica */}
                    <div className="text-left space-y-1.5">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {seller.nombre_negocio}
                      </h3>
                      
                      {/* Código afiliado */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código Promo:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                          {seller.codigo_promocional || 'Sin Configurar'}
                        </span>
                      </div>

                      {/* Configuración fiscal/esquema */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          🧮 {seller.iva_incluido ? 'Con IVA' : 'Sin IVA'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          💸 -{seller.descuento_efectivo || 10}% Efectivo
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          🏦 -{seller.descuento_transferencia || 5}% Transferencia
                        </span>
                      </div>
                    </div>

                    {/* Deuda / Límites */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-left">
                      <div className="space-y-0.5">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-wider">Deuda Acumulada</p>
                        <p className="font-mono text-xs font-black text-rose-500">
                          ${(Number(seller.saldo_comisiones) || 0).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-wider">Límite Permitido</p>
                        <p className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                          ${(Number(seller.limite_deuda) || 0).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones principales */}
                  <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2.5">
                    <button 
                      onClick={() => setEditingSeller(seller)}
                      className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-xl transition-all"
                    >
                      Editar Perfil
                    </button>

                    <button 
                      onClick={() => loadResellerCatalog(seller)}
                      className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      Ver Catálogo
                    </button>

                    <div className="flex items-center gap-1">
                      {seller.codigo_promocional && (
                        <button 
                          onClick={() => copyAffiliateLink(seller.codigo_promocional!)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
                          title="Copiar link afiliado"
                        >
                          <LinkIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA B: MASTER CATÁLOGO & STATUS HUB ("Todos los Ítems") */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          
          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center gap-3.5 shadow-sm text-left">
            {/* Buscador */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar artículo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Selector de revendedor si es Admin */}
            {isAdmin && (
              <div className="space-y-0.5">
                <select
                  value={filterReseller}
                  onChange={(e) => setFilterReseller(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="todos">🏬 Todos los Negocios</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre_negocio}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Estado */}
            <div className="space-y-0.5">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none opacity-85 hover:opacity-100"
              >
                <option value="todos">🟢 Todos los Estados</option>
                <option value="activo">Publicado (Activo)</option>
                <option value="pausado">Pausado</option>
                <option value="sin_stock">Sin Stock auto-pausa</option>
              </select>
            </div>

            {/* Tipo de modalidad */}
            <div className="space-y-0.5">
              <select
                value={filterStockType}
                onChange={(e) => setFilterStockType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none opacity-85 hover:opacity-100"
              >
                <option value="todos">📦 Tipos de Stock</option>
                <option value="fijo">Inmediato (Fijo)</option>
                <option value="produccion">Bajo Demanda (Fábrica)</option>
              </select>
            </div>
          </div>

          {/* Listado de Ítems */}
          {loadingItems ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <div className="size-8 border-3 border-slate-900 border-t-transparent dark:border-teal-400 dark:border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando catálogo centralizado...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-dashed rounded-3xl">
              <Boxes className="mx-auto text-slate-350 dark:text-slate-700 mb-3 animate-pulse" size={32} />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Ningún artículo concuerda con tu búsqueda.</p>
              <p className="text-xs text-slate-400 mt-1">Intenta ajustando los filtros superiores.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/85 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-250 dark:border-slate-800/60 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="p-3">Artículo</th>
                      {isAdmin && <th className="p-3">Socio Comercial</th>
                      }<th className="p-3">Tipo / Estado</th>
                      <th className="p-3 text-right">Neto S/IVA</th>
                      <th className="p-3 text-right">Público C/IVA</th>
                      <th className="p-3 text-right">Efectivo</th>
                      <th className="p-3 text-right">Transferencia</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                    {filteredItems.map((item) => {
                      const seller = sellers.find(s => s.id === item.revendedor_id);
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 font-mono text-[11px]">
                          {/* Artículo con Foto */}
                          <td className="p-3 font-sans">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-lg bg-slate-100 border dark:border-slate-805 flex items-center justify-center overflow-hidden shrink-0">
                                {item.imagenes && item.imagenes[0] ? (
                                  <img src={item.imagenes[0]} alt={item.nombre} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div className="text-left leading-tight">
                                <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{item.nombre}</span>
                                {item.categoria && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{item.categoria}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Negocio */}
                          {isAdmin && (
                            <td className="p-3 font-sans text-left">
                              <span className="font-extrabold text-indigo-500 text-[10px] uppercase tracking-wider block bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 px-2 py-0.5 rounded-lg w-fit">
                                🏬 {seller?.nombre_negocio || 'Simulado Generico'}
                              </span>
                            </td>
                          )}

                          {/* Tipo / Estado */}
                          <td className="p-3 font-sans text-left">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase border tracking-wider leading-none",
                                item.stock_tipo === 'produccion' 
                                  ? "bg-amber-100/40 text-amber-600 border-amber-300 dark:border-amber-900/40" 
                                  : "bg-teal-100/40 text-teal-600 border-teal-300 dark:border-teal-900/40"
                              )}>
                                {item.stock_tipo === 'produccion' ? 'Bajo Pedido' : 'Stock Inmediato'}
                              </span>

                              <span className={cn(
                                "text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase border tracking-wider leading-none",
                                item.estado === 'activo' ? "bg-emerald-50 text-emerald-600 border-emerald-300 dark:border-emerald-950" :
                                item.estado === 'pausado' ? "bg-yellow-50 text-yellow-600 border-yellow-300 dark:border-yellow-950" :
                                "bg-rose-50 text-rose-600 border-rose-300 dark:border-rose-950"
                              )}>
                                {item.estado === 'activo' ? 'Publicado' : item.estado === 'pausado' ? 'Pausado' : 'Sin Stock'}
                              </span>
                            </div>
                          </td>

                          {/* Neto */}
                          <td className="p-3 text-right font-extrabold text-slate-500">
                            ${(Number(item.precio) || 0).toLocaleString('es-AR', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Con IVA */}
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                            ${(Number(item.precio_con_iva) || 0).toLocaleString('es-AR', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Efectivo */}
                          <td className="p-3 text-right font-bold text-emerald-550">
                            ${(Number(item.precio_efectivo) || 0).toLocaleString('es-AR', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Transferencia */}
                          <td className="p-3 text-right font-bold text-blue-500">
                            ${(Number(item.precio_transferencia) || 0).toLocaleString('es-AR', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Stock */}
                          <td className="p-3 text-right">
                            {item.stock_tipo === 'produccion' ? (
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Bajo Pedido</span>
                            ) : (
                              <span className={cn(
                                "font-extrabold",
                                item.stock <= 1 ? "text-rose-500" : item.stock <= 3 ? "text-amber-500" : "text-slate-650 dark:text-slate-350"
                              )}>
                                {item.stock} u.
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  // Obtener el revendedor activo para calcular con sus defaults
                                  setEditingItem(item);
                                }}
                                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 p-1.5 rounded-lg text-slate-700 dark:text-white border dark:border-slate-700 cursor-pointer"
                                title="Editar"
                              >
                                <Tag size={13} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 p-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
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
        </div>
      )}

      {/* MODAL 1: EDITAR / CONFIGURAR PERFIL DEL NEGOCIO */}
      <AnimatePresence>
        {editingSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSeller(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] border dark:border-slate-800 text-left"
            >
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b dark:border-slate-850 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={18} /> Ajustes del Negocio
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Definición de Perfil de Venta</p>
                  </div>
                  <button 
                    onClick={() => setEditingSeller(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                  >
                    <XCircle size={22} />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* Seccion 1: Datos de Identidad */}
                  <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border dark:border-slate-850">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">Identity & Logo</span>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Nombre de la Tienda de Venta</label>
                      <input 
                        type="text" 
                        value={editingSeller.nombre_negocio || ''}
                        onChange={(e) => setEditingSeller({...editingSeller, nombre_negocio: e.target.value})}
                        className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 font-bold text-xs"
                        placeholder="Ej: Impresiones 3D Juan"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Código Promocional Afiliado</label>
                        <input 
                          type="text" 
                          value={editingSeller.codigo_promocional || ''}
                          onChange={(e) => setEditingSeller({...editingSeller, codigo_promocional: e.target.value.toUpperCase().replace(/\s/g, '')})}
                          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 font-mono font-bold text-xs"
                          placeholder="e.g. JUAN3D"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Color Primario</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={editingSeller.color_primario || '#2dd4bf'}
                            onChange={(e) => setEditingSeller({...editingSeller, color_primario: e.target.value})}
                            className="size-11 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                          />
                          <div className="flex-1 font-mono text-[10px] font-bold p-3 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 leading-none">
                            {editingSeller.color_primario}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Logo URL o Imagen Cabecera</label>
                      <input 
                        type="text" 
                        value={editingSeller.logo_url || ''}
                        onChange={(e) => setEditingSeller({...editingSeller, logo_url: e.target.value})}
                        className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 font-mono text-[10px]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* NUEVA SECCION: ESQUEMA DE IMPUESTOS Y DESCUENTOS (Igual que Proveedores) */}
                  <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border dark:border-slate-850">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wide flex items-center gap-1">💸 Esquema Impositivo & Descuentos de Venta</span>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
                      <div className="text-left space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-205">Tax Scheme: ¿IVA Incluido por defecto?</p>
                        <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                          Si se activa, el precio base de cada artículo ya comprende el IVA (21%) para la Tienda.
                        </p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={editingSeller.iva_incluido || false}
                        onChange={(e) => setEditingSeller({...editingSeller, iva_incluido: e.target.checked})}
                        className="size-5 rounded-lg text-emerald-550 border-slate-350 dark:border-slate-800 focus:ring-0"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-405 flex items-center gap-1">💸 % Descuento Efectivo</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={editingSeller.descuento_efectivo !== undefined ? editingSeller.descuento_efectivo : 10}
                            onChange={(e) => setEditingSeller({...editingSeller, descuento_efectivo: parseFloat(e.target.value) || 0})}
                            className="w-full h-11 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-3.5 pr-8 font-mono text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-black font-sans">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-405 flex items-center gap-1">🏦 % Descuento Transferencia</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={editingSeller.descuento_transferencia !== undefined ? editingSeller.descuento_transferencia : 5}
                            onChange={(e) => setEditingSeller({...editingSeller, descuento_transferencia: parseFloat(e.target.value) || 0})}
                            className="w-full h-11 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-3.5 pr-8 font-mono text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-black font-sans">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seccion 3: Finanzas & Deudas */}
                  <div className="space-y-3.5 bg-rose-500/5 dark:bg-rose-950/10 p-3.5 rounded-2xl border border-rose-500/20 text-left">
                    <span className="text-[9px] font-black uppercase text-rose-500 tracking-wide flex items-center gap-1"><ShieldAlert size={14} /> Finanzas del Canal & Alertas de Deuda</span>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-rose-400">Saldo comisiones vendedor</label>
                        <input 
                          type="number" 
                          value={editingSeller.saldo_comisiones || 0}
                          onChange={(e) => setEditingSeller({...editingSeller, saldo_comisiones: parseFloat(e.target.value) || 0})}
                          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-rose-500 font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-slate-405">Límite de deuda (Crédito)</label>
                        <input 
                          type="number" 
                          value={editingSeller.limite_deuda || 0}
                          onChange={(e) => setEditingSeller({...editingSeller, limite_deuda: parseFloat(e.target.value) || 0})}
                          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ubicación GPS */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Ubicación de Despacho (GPS)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        step="any"
                        value={editingSeller.lat || ''}
                        onChange={(e) => setEditingSeller({...editingSeller, lat: parseFloat(e.target.value) || 0})}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 font-mono text-xs font-bold"
                        placeholder="Latitud"
                      />
                      <input 
                        type="number" 
                        step="any"
                        value={editingSeller.lng || ''}
                        onChange={(e) => setEditingSeller({...editingSeller, lng: parseFloat(e.target.value) || 0})}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 font-mono text-xs font-bold"
                        placeholder="Longitud"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t dark:border-slate-850">
                  <button 
                    onClick={() => setEditingSeller(null)}
                    className="flex-1 h-12 rounded-xl border dark:border-slate-805 font-black text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-center uppercase tracking-wider"
                  >
                    Salir
                  </button>
                  <button 
                    onClick={handleSaveSeller}
                    disabled={isSavingSeller}
                    className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 hover:bg-slate-800 uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSavingSeller ? (
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={16} />
                        Guardar Socio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: GESTIÓN DE CATÁLOGO COMPLETO DE UN VENDEDOR (Vista de Administrador) */}
      <AnimatePresence>
        {viewingCatalogSeller && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCatalogSeller(null)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border dark:border-slate-800 text-left flex flex-col max-h-[92vh]"
            >
              <div className="p-5 border-b dark:border-slate-850 flex items-center justify-between">
                <div className="text-left space-y-0.5">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Boxes size={18} className="text-indigo-500" /> Catálogo de {viewingCatalogSeller.nombre_negocio}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Administra los productos de este revendedor particular de forma sincrónica.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem({
                        nombre: '',
                        precio: 0,
                        precio_con_iva: 0,
                        precio_efectivo: 0,
                        precio_transferencia: 0,
                        stock: 5,
                        stock_tipo: 'fijo',
                        estado: 'activo',
                        imagenes: [],
                        revendedor_id: viewingCatalogSeller.id
                      });
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-sm"
                  >
                    <Plus size={14} /> Añadir Producto
                  </button>
                  <button 
                    onClick={() => setViewingCatalogSeller(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Lista interna de catálogo */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {loadingCatalog ? (
                  <div className="flex flex-col items-center justify-center p-20 gap-3">
                    <div className="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando ítems...</p>
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 dark:bg-slate-950/20 border border-dashed rounded-2xl">
                    <Boxes className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={24} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">El catálogo de este canal está vacío.</p>
                    <p className="text-[10px] text-slate-405 mt-1">Haz clic en "Añadir Producto" para crear el primero.</p>
                  </div>
                ) : (
                  <div className="border dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-950/80 border-b dark:border-slate-855 text-[8px] font-black uppercase tracking-wider text-slate-400">
                          <th className="p-2.5">Artículo / SKU</th>
                          <th className="p-2.5">Tipo / Estado</th>
                          <th className="p-2.5 text-right">Neto Base</th>
                          <th className="p-2.5 text-right">Con IVA</th>
                          <th className="p-2.5 text-right">Ef. Cash</th>
                          <th className="p-2.5 text-right">Tr. Bank</th>
                          <th className="p-2.5 text-right">Stock</th>
                          <th className="p-2.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                        {catalogItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-100/35 dark:hover:bg-slate-900/40">
                            {/* Nombre con miniatura */}
                            <td className="p-2.5 font-sans">
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0">
                                  {item.imagenes && item.imagenes[0] ? (
                                    <img src={item.imagenes[0]} alt={item.nombre} className="h-full w-full object-cover" />
                                  ) : (
                                    <ImageIcon size={12} className="text-slate-450" />
                                  )}
                                </div>
                                <div className="text-left leading-none">
                                  <span className="font-extrabold uppercase line-clamp-1">{item.nombre}</span>
                                  {item.categoria && <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">{item.categoria}</span>}
                                </div>
                              </div>
                            </td>

                            {/* Tipo y Estado */}
                            <td className="p-2.5 font-sans text-left">
                              <span className={cn(
                                "text-[7.5px] font-black px-1 rounded uppercase mr-1 border inline-block leading-none",
                                item.stock_tipo === 'produccion' ? "bg-amber-100/40 text-amber-600 border-amber-300 dark:border-amber-900/40" : "bg-teal-100/40 text-teal-600 border-teal-300 dark:border-teal-900/40"
                              )}>
                                {item.stock_tipo === 'produccion' ? 'Bajo Pedido' : 'Stock'}
                              </span>

                              <span className={cn(
                                "text-[7.5px] font-bold px-1 rounded uppercase border inline-block leading-none",
                                item.estado === 'activo' ? "bg-emerald-50 text-emerald-600 border-emerald-300" : "bg-yellow-50 text-yellow-600 border-yellow-300"
                              )}>
                                {item.estado === 'activo' ? 'Publicado' : 'Pausado'}
                              </span>
                            </td>

                            {/* Precios */}
                            <td className="p-2.5 text-right font-extrabold text-slate-405">${item.precio.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-black text-slate-800 dark:text-white">${item.precio_con_iva.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-550">${item.precio_efectivo.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-blue-500">${item.precio_transferencia.toLocaleString()}</td>

                            {/* Stock */}
                            <td className="p-2.5 text-right font-bold">
                              {item.stock_tipo === 'produccion' ? '-' : `${item.stock} u.`}
                            </td>

                            {/* Acciones */}
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="text-[9px] uppercase font-bold text-indigo-500 hover:underline p-1 cursor-pointer"
                                >
                                  Editar
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-[9px] uppercase font-bold text-rose-500 hover:underline p-1 cursor-pointer"
                                >
                                  Borrar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-4 border-t dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                <button 
                  onClick={() => setViewingCatalogSeller(null)}
                  className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl border border-slate-700"
                >
                  Cerrar Ventana
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CREAR / EDITAR ÍTEM INDIVIDUAL (CATÁLOGO REVENDEDOR) */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 text-left flex flex-col max-h-[92vh] overflow-hidden"
            >
              <div className="p-5 border-b dark:border-slate-850 flex items-center justify-between shrink-0">
                <div className="text-left space-y-0.5">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    📥 Editor de Ficha de Artículo de Revendedor
                  </h3>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Configura las fotos, precios bidireccionales de ventas y despacho fabril.</p>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Formulario */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                
                {/* 1. Datos Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-405">Nombre del Artículo / SKU</label>
                    <input 
                      type="text"
                      value={editingItem.nombre || ''}
                      onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                      placeholder="e.g. Set de Mate Dragon Ball Z"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-405">Estado / Publicación</label>
                    <select
                      value={editingItem.estado || 'activo'}
                      onChange={(e) => setEditingItem({...editingItem, estado: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="activo">🟢 Publicado (Activo/Visible)</option>
                      <option value="pausado">🟡 Pausado temporalmente</option>
                      <option value="sin_stock">🔴 Pausado (Sin Stock)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-405">Eje de Categoría (Jerarquía)</label>
                  <CascadingCategorySelector 
                    value={editingItem.categoria || ''}
                    onChange={(val) => setEditingItem({...editingItem, categoria: val})}
                  />
                </div>

                {/* 2. Logística y Despacho */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-850 rounded-2xl space-y-3">
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wide block">📦 Métodos de Stock y Plazos</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400">Modalidad de Stock</label>
                      <select
                        value={editingItem.stock_tipo || 'fijo'}
                        onChange={(e) => setEditingItem({...editingItem, stock_tipo: e.target.value as any, stock: e.target.value === 'produccion' ? 0 : 5})}
                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-3.5 py-2.2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="fijo">🚀 Entrega Inmediata (Físico en Stock)</option>
                        <option value="produccion">⏱️ Producción Bajo Pedido (Requiere días de fábrica)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400">
                        {editingItem.stock_tipo === 'produccion' ? 'Días Estimados Fábrica (Rango)' : 'Unidades en Stock Físico'}
                      </label>
                      {editingItem.stock_tipo === 'produccion' ? (
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <input 
                            type="number"
                            placeholder="Mín"
                            value={editingItem.dias_produccion_min || 0}
                            onChange={(e) => setEditingItem({...editingItem, dias_produccion_min: parseInt(e.target.value) || 0})}
                            className="h-10 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl font-mono text-center"
                          />
                          <input 
                            type="number"
                            placeholder="Máx"
                            value={editingItem.dias_produccion_max || 0}
                            onChange={(e) => setEditingItem({...editingItem, dias_produccion_max: parseInt(e.target.value) || 0})}
                            className="h-10 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl font-mono text-center"
                          />
                        </div>
                      ) : (
                        <input 
                          type="number"
                          value={editingItem.stock || 0}
                          onChange={(e) => setEditingItem({...editingItem, stock: parseInt(e.target.value) || 0})}
                          className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl font-mono font-black"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Precios Dinámicos Bidireccionales con IVA e Impuestos */}
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wide block">💰 Grilla Comercial de Precios</span>
                    {/* Alerta aclaratoria de qué defaults se están usando */}
                    <span className="text-[8.5px] font-bold text-slate-400 italic">
                      {isAdmin 
                        ? `* Aplica defaults del revendedor`
                        : `* Aplica tus defaults impositivos y de descuentos`}
                    </span>
                  </div>

                  {/* Inputs bidireccionales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    {/* 1. Neto */}
                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-slate-405 leading-none">Neto Base S/IVA</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          value={editingItem.precio !== undefined ? editingItem.precio : ''}
                          onChange={(e) => handleItemPriceChange(
                            'precio', 
                            e.target.value,
                            sellers.find(s => s.id === editingItem.revendedor_id)
                          )}
                          className="w-full h-9 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg pl-6 pr-1 font-mono text-[11px] font-black"
                          placeholder="Neto"
                        />
                      </div>
                    </div>

                    {/* 2. Con IVA Público */}
                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-indigo-500 leading-none">Público C/IVA (21%)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          value={editingItem.precio_con_iva !== undefined ? editingItem.precio_con_iva : ''}
                          onChange={(e) => handleItemPriceChange(
                            'precio_con_iva', 
                            e.target.value,
                            sellers.find(s => s.id === editingItem.revendedor_id)
                          )}
                          className="w-full h-9 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg pl-6 pr-1 font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400"
                          placeholder="Con IVA"
                        />
                      </div>
                    </div>

                    {/* 3. Efectivo */}
                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-emerald-500 leading-none">Precio CASH (-Ef.)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          value={editingItem.precio_efectivo !== undefined ? editingItem.precio_efectivo : ''}
                          onChange={(e) => handleItemPriceChange(
                            'precio_efectivo', 
                            e.target.value
                          )}
                          className="w-full h-9 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg pl-6 pr-1 font-mono text-[11px] font-black text-emerald-600"
                          placeholder="Efectivo"
                        />
                      </div>
                    </div>

                    {/* 4. Transferencia */}
                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-blue-500 leading-none font-sans">Precio BANK (-Tr.)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          value={editingItem.precio_transferencia !== undefined ? editingItem.precio_transferencia : ''}
                          onChange={(e) => handleItemPriceChange(
                            'precio_transferencia', 
                            e.target.value
                          )}
                          className="w-full h-9 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg pl-6 pr-1 font-mono text-[11px] font-black text-blue-500"
                          placeholder="Tr. Banco"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. Enlaces de Descarga STL / Drive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">🔗 Link Carpeta de Drive (Imágenes/STL)</label>
                    <input 
                      type="text"
                      value={editingItem.link_drive || ''}
                      onChange={(e) => setEditingItem({...editingItem, link_drive: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-[10px] font-mono"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">🌐 Link de STL Público o de Producción</label>
                    <input 
                      type="text"
                      value={editingItem.link_stl || ''}
                      onChange={(e) => setEditingItem({...editingItem, link_stl: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-[10px] font-mono"
                      placeholder="https://thingiverse.com/..."
                    />
                  </div>
                </div>

                {/* 5. Instrucciones de Fabricación Ocultas */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400">📝 Notas Internas o Instrucciones de Fabricación (Ocultas al Cliente Final)</label>
                  <textarea 
                    value={editingItem.instrucciones_internas || ''}
                    onChange={(e) => setEditingItem({...editingItem, instrucciones_internas: e.target.value})}
                    rows={2}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-[11px] font-sans font-semibold placeholder:text-slate-450"
                    placeholder="Detalla instrucciones de post-procesamiento, materiales sugeridos, pesos de relleno, etc..."
                  />
                </div>

                {/* 6. Galería de Imágenes */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400">🖼️ Galería de Capturas / Fotos del Producto (Habilitar hasta 5 fotos)</label>
                  <ImageManager 
                    images={editingItem.imagenes || []}
                    onChange={(imgs) => setEditingItem({...editingItem, imagenes: imgs})}
                  />
                </div>

              </div>

              {/* Botonera Guardar */}
              <div className="p-4 border-t dark:border-slate-850 bg-slate-100/50 dark:bg-slate-950/20 shrink-0 flex gap-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 h-11 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-75 * border dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={isSavingItem}
                  className="flex-[2] h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isSavingItem ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar Artículo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
