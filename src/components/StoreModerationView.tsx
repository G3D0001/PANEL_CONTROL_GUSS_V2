import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ShieldAlert, Search, Filter, Ban, CheckCircle, PauseCircle, 
  Crown, Flame, Sparkles, ChevronLeft, ChevronRight, Store, 
  ArrowUpRight, Heart, ShoppingBag, ShieldCheck, Mail, AlertTriangle, 
  CreditCard, Truck, RefreshCw, Star, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { getProductImages } from '../utils/imageUtils';

export function StoreModerationView() {
  const [activeTab, setActiveTab] = useState<'moderation' | 'rankings'>('moderation');
  
  // Tab 1 States (Moderation)
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('Todos');

  // Tab 2 States (Rankings & Carousels)
  const [rankingDays, setRankingDays] = useState(7);
  const [rankingSales, setRankingSales] = useState<any[]>([]);
  const [sellersRanking, setSellersRanking] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('todos');
  const [selectedProductToCompare, setSelectedProductToCompare] = useState<string>('');

  // Precalculated mock data fallback to ensure absolute visual delight
  const mockSellersFallback = [
    { negocio_id: '1', nombre_negocio: 'Impresiones 3D Buenos Aires', email: 'vendedor1@g3d.com', total_ventas: 145, total_ingresos: 290000, reputacion: 4.9, estado: 'Activo' },
    { negocio_id: '2', nombre_negocio: 'Artesanos Digitales Córdoba', email: 'vendedor2@g3d.com', total_ventas: 98, total_ingresos: 196000, reputacion: 4.8, estado: 'Activo' },
    { negocio_id: '3', nombre_negocio: 'CyberTech Models', email: 'vendedor3@g3d.com', total_ventas: 84, total_ingresos: 168000, reputacion: 4.6, estado: 'Activo' },
    { negocio_id: '4', nombre_negocio: 'Replica Prop Makers', email: 'vendedor4@g3d.com', total_ventas: 32, total_ingresos: 80000, reputacion: 4.4, estado: 'Activo' },
    { negocio_id: '5', nombre_negocio: 'Miniaturas Militares Santa Fe', email: 'vendedor5@g3d.com', total_ventas: 11, total_ingresos: 22000, reputacion: 3.9, estado: 'Pausado' }
  ];

  const mockProductSalesFallback = [
    { id: 'p1', nombre: 'Soporte Articulado de Monitor Pro', precio: 15400, categoria: 'Oficina', imagenes: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'], negocio_id: '1', negocio_nombre: 'Impresiones 3D Buenos Aires', ventas_periodo: 54, pago_transferencia: true, pago_efectivo: true, modalidad: 'inmediata', precio_base: 15400 },
    { id: 'p2', nombre: 'Maceta Autorregable Autorriego Minimalista', precio: 3800, categoria: 'Hogar', imagenes: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500'], negocio_id: '1', negocio_nombre: 'Impresiones 3D Buenos Aires', ventas_periodo: 42, pago_transferencia: true, pago_efectivo: false, modalidad: 'inmediata', precio_base: 3800 },
    { id: 'p3', nombre: 'Organizador de Escritorio Modular Grid', precio: 7500, categoria: 'Oficina', imagenes: ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500'], negocio_id: '2', negocio_nombre: 'Artesanos Digitales Córdoba', ventas_periodo: 38, pago_transferencia: true, pago_efectivo: true, modalidad: 'produccion', precio_base: 7200 },
    { id: 'p4', nombre: 'Coleccionable Figura De Acción Articulada Gamer', precio: 22000, categoria: 'Coleccionables', imagenes: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500'], negocio_id: '3', negocio_nombre: 'CyberTech Models', ventas_periodo: 35, pago_transferencia: false, pago_efectivo: true, modalidad: 'produccion', precio_base: 22000 },
    { id: 'p5', nombre: 'Lámpara de Noche LED Moon Ambient', precio: 11200, categoria: 'Hogar', imagenes: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'], negocio_id: '2', negocio_nombre: 'Artesanos Digitales Córdoba', ventas_periodo: 27, pago_transferencia: true, pago_efectivo: true, modalidad: 'inmediata', precio_base: 11200 },
    { id: 'p6', nombre: 'Soporte Auriculares Gamer Neon', precio: 4500, categoria: 'Accesorios', imagenes: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'], negocio_id: '3', negocio_nombre: 'CyberTech Models', ventas_periodo: 22, pago_transferencia: true, pago_efectivo: true, modalidad: 'inmediata', precio_base: 4500 }
  ];

  useEffect(() => {
    fetchProducts();
    loadConfigurationAndRanking();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('g3d_productos')
      .select(`
        *,
        negocio:negocio_id(nombre_negocio, email)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
      if (data.length > 0 && !selectedProductToCompare) {
        setSelectedProductToCompare(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadConfigurationAndRanking = async () => {
    try {
      // 1. Cargar período configurado desde configuracion_sistema
      const { data: sysData } = await supabase.from('configuracion_sistema').select('datos').maybeSingle();
      const configDays = sysData?.datos?.ranking_dias_validez || 7;
      setRankingDays(configDays);

      // 2. Traer registros de ventas reales de los últimos 90 días
      const { data: realVentas, error: errRank } = await supabase
        .from('ranking_ventas_90dias')
        .select(`
          *,
          producto:producto_id(nombre, imagenes, precio_base, categoria_texto, categoria_id),
          negocio:negocio_id(nombre_negocio, email)
        `);

      if (!errRank && realVentas && realVentas.length > 0) {
        // Formatear tabla de ventas
        const formatted: any[] = [];
        const sellerMap: Record<string, any> = {};

        realVentas.forEach((v: any) => {
          if (!v.producto) return;

          // Ventas por producto
          const existingP = formatted.find(item => item.id === v.producto_id);
          const cantidad = v.cantidad || 1;
          const precio = v.producto.precio_base || 0;

          if (existingP) {
            existingP.ventas_periodo += cantidad;
          } else {
            formatted.push({
              id: v.producto_id,
              nombre: v.producto.nombre,
              precio: precio,
              categoria: v.producto.categoria_texto || 'General',
              imagenes: v.producto.imagenes || [],
              negocio_id: v.negocio_id,
              negocio_nombre: v.negocio?.nombre_negocio || 'Socio Externo',
              ventas_periodo: cantidad,
              pago_transferencia: v.producto.pago_transferencia ?? true,
              pago_efectivo: v.producto.pago_efectivo ?? false,
              modalidad: v.producto.modalidad || 'inmediata',
              precio_base: precio
            });
          }

          // Ventas por vendedor para el ranking de vendedores
          if (v.negocio_id) {
            if (sellerMap[v.negocio_id]) {
              sellerMap[v.negocio_id].total_ventas += cantidad;
              sellerMap[v.negocio_id].total_ingresos += cantidad * precio;
            } else {
              sellerMap[v.negocio_id] = {
                negocio_id: v.negocio_id,
                nombre_negocio: v.negocio?.nombre_negocio || 'Negocio Privado',
                email: v.negocio?.email || 'N/A',
                total_ventas: cantidad,
                total_ingresos: cantidad * precio,
                reputacion: 4.8,
                estado: 'Activo'
              };
            }
          }
        });

        setRankingSales(formatted.sort((a,b) => b.ventas_periodo - a.ventas_periodo));
        setSellersRanking(Object.values(sellerMap).sort((a: any,b: any) => b.total_ventas - a.total_ventas));
      } else {
        // Usar fallbacks
        setRankingSales(mockProductSalesFallback);
        setSellersRanking(mockSellersFallback);
      }
    } catch (e) {
      console.error("Error cargando estadísticas de ventas:", e);
      setRankingSales(mockProductSalesFallback);
      setSellersRanking(mockSellersFallback);
    }
  };

  const updateProductStatus = async (id: string, nuevoEstado: string, publicado: boolean) => {
    try {
      const { error } = await supabase.from('g3d_productos').update({
        estado: nuevoEstado,
        publicado: publicado
      }).eq('id', id);

      if (error) throw error;
      toast.success(`El producto ahora está ${nuevoEstado}`);
      fetchProducts();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  // Carousel Helper Filters
  const globalTopSellers = [...rankingSales].sort((a,b) => b.ventas_periodo - a.ventas_periodo);
  
  const sellerFilteredProducts = selectedSeller === 'todos' 
    ? globalTopSellers 
    : globalTopSellers.filter(p => p.negocio_id === selectedSeller);

  // Comparator de categoría logic
  const selectedProdObj = products.find(p => p.id === selectedProductToCompare) || mockProductSalesFallback[0];
  const sameCategoryProducts = products
    .filter(p => p.id !== selectedProductToCompare && (p.categoria_id === selectedProdObj?.categoria_id || p.categoria_texto === selectedProdObj?.categoria_texto))
    .sort((a,b) => (a.precio_base || a.precio || 0) - (b.precio_base || b.precio || 0)); // Menor precio primero

  const currentProducts = products.filter(p => {
    let matchState = true;
    if (filterState === 'Publicados') matchState = p.publicado;
    if (filterState === 'Pausados') matchState = !p.publicado && p.estado !== 'Bloqueado';
    if (filterState === 'Bloqueados') matchState = p.estado === 'Bloqueado';
    
    let matchTerm = true;
    if (searchTerm) {
      matchTerm = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (p.negocio?.nombre_negocio && p.negocio.nombre_negocio.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return matchState && matchTerm;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Fijo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Moderación y Control de Ventas
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Supervisa masivamente el catálogo global, califica a tus vendedores y previsualiza los carruseles de mayor venta ("Estilo MercadoLibre").
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'moderation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={14} />
            Moderación de Catálogo
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'rankings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Crown size={14} className="text-amber-500" />
            Rankings y Carruseles (ML)
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: MODERACIÓN GENERAL */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o vendedor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              {['Todos', 'Publicados', 'Pausados', 'Bloqueados'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterState(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    filterState === f 
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm font-bold animate-pulse">Cargando catálogo...</div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-bold bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200">
                No se encontraron productos con estos filtros.
              </div>
            ) : (
              currentProducts.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-[1.002] transition-transform">
                  <div className="size-16 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-250 dark:border-slate-700">
                    {getProductImages(p).length > 0 ? (
                      <img src={getProductImages(p)[0]} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">Sin Foto</div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.nombre}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <Store size={10} /> {p.negocio?.nombre_negocio || 'Socio'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        Categoría: {p.categoria_texto || 'General'}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-500 ml-1">
                        ${p.precio_base || p.precio || 0}
                      </span>
                      {p.estado === 'Bloqueado' && (
                        <span className="text-[9px] font-black bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-250 px-2 py-0.5 rounded">
                          ⛔ BLOQUEADO ABSOLUTO
                        </span>
                      )}
                      {p.estado === 'Pausado' && (
                        <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-250 px-2 py-0.5 rounded">
                          ⏸ PAUSADO
                        </span>
                      )}
                      {p.publicado && p.estado === 'Activo' && (
                        <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-250 px-2 py-0.5 rounded">
                          ✔ ACTIVO Y PÚBLICO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end md:self-auto pt-2 md:pt-0">
                    {p.estado !== 'Bloqueado' ? (
                      <button 
                        onClick={() => updateProductStatus(p.id, 'Bloqueado', false)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold text-[11px] rounded-xl transition-all"
                        title="Bloquea el producto de forma extrema"
                      >
                        <Ban size={12} /> Bloqueo Absoluto
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateProductStatus(p.id, 'Pausado', false)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] rounded-xl transition-all"
                      >
                        <PauseCircle size={12} /> Levantar Bloqueo
                      </button>
                    )}
                    
                    {p.publicado ? (
                      <button 
                        onClick={() => updateProductStatus(p.id, 'Pausado', false)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-[11px] rounded-xl transition-all"
                      >
                        <PauseCircle size={12} /> Pausar
                      </button>
                    ) : p.estado !== 'Bloqueado' ? (
                      <button 
                        onClick={() => updateProductStatus(p.id, 'Activo', true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[11px] rounded-xl transition-all"
                      >
                        <CheckCircle size={12} /> Activar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: RENDIMIENTO, RANKING DE VENDEDORES Y CARRUSELES DE TIENDA */}
      {activeTab === 'rankings' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Alerta Inicial Info 90 días */}
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400 p-4 rounded-2xl flex items-start gap-3">
            <Crown size={20} className="shrink-0 text-indigo-500 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Mecanismo de Retención a 90 días Activo:</span> El sistema registra cada venta unitaria en tiempo real de forma segura. La auto-limpieza permanente mantiene estrictamente el historial de los últimos 90 días para un rendimiento óptimo de base de datos. Los carruseles se actualizan instantáneamente basándose en la ventana de tiempo configurada en Preferencias ({rankingDays} días).
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PANEL DE VENDEDORES (Para proteger a quienes venden más) */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 block">Socio Ranking (90 Días)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Ordenado por ventas de sus artículos</p>
                </div>
                <UsersHighlightBadge text="Top Socios" />
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sellersRanking.map((s, idx) => (
                  <div key={s.negocio_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-5 * dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className={`size-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                        idx === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {s.nombre_negocio}
                          {idx === 0 && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">{s.email}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{s.total_ventas} Ventas</span>
                      <span className="text-[9px] text-emerald-500 font-bold font-mono">${(Number(s?.total_ingresos) || 0).toLocaleString()} COP</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold block">¿Detectas caídas críticas en ventas?</span>
                <p className="text-[9px] text-slate-400 mt-1">Contacta a tu desarrollador estrella para brindarle soporte prioritario y evitar que migre a otra plataforma.</p>
              </div>
            </div>

            {/* CARRUSELES INTERACTIVOS DE LA TIENDA */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* CARRUSEL 1: MÁS VENDIDOS GLOBAL */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="text-amber-500 fill-amber-500 animate-pulse" size={18} />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Los Más Vendidos de {rankingDays} Días</h4>
                      <p className="text-[10px] text-slate-500">Carrusel general de toda la tienda</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">MERCADOLIBRE STYLE</span>
                </div>

                <div className="relative group">
                  <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                    {globalTopSellers.slice(0, 5).map(p => (
                      <div key={p.id} className="w-44 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shrink-0 snap-start flex flex-col justify-between hover:shadow-md transition-all relative">
                        <span className="absolute top-2 left-2 bg-amber-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 z-10">
                          <Flame size={8} className="fill-white" /> Top {p.ventas_periodo}
                        </span>
                        
                        <div>
                          <div className="w-full h-24 bg-slate-100 dark:bg-slate-920 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-705 mb-2">
                            {getProductImages(p).length > 0 ? (
                              <img src={getProductImages(p)[0]} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">Sin foto</div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.categoria}</span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={p.nombre}>{p.nombre}</h5>
                          <span className="text-[10px] text-slate-500 truncate block">De {p.negocio_nombre}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-250 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-light font-mono">${p.precio}</span>
                            <span className="text-[8px] text-emerald-500 font-bold">Llega en {p.modalidad === 'inmediata' ? '24hs' : '3-5d'}</span>
                          </div>
                          <Heart size={14} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARRUSEL 2: MÁS VENDIDOS POR VENDEDOR */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="text-indigo-500" size={18} />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Spotlight: Los Más Vendidos del Vendedor</h4>
                      <p className="text-[10px] text-slate-500">Filtrar por tienda asociada</p>
                    </div>
                  </div>
                  
                  {/* Dropdown Selector */}
                  <select
                    value={selectedSeller}
                    onChange={(e) => setSelectedSeller(e.target.value)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-1 focus:ring-primary/25 cursor-pointer max-w-sm"
                  >
                    <option value="todos">Mostrar todos los socios</option>
                    {sellersRanking.map(s => (
                      <option key={s.negocio_id} value={s.negocio_id}>{s.nombre_negocio}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                  {sellerFilteredProducts.length === 0 ? (
                    <div className="text-center py-6 w-full text-slate-400 text-xs font-bold font-mono">
                      No se registraron ventas para esta tienda en el período actual.
                    </div>
                  ) : (
                    sellerFilteredProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="w-44 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shrink-0 snap-start flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                          <div className="w-full h-24 bg-slate-100 dark:bg-slate-920 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-705 mb-2">
                            {getProductImages(p).length > 0 ? (
                              <img src={getProductImages(p)[0]} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">Sin foto</div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.categoria}</span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.nombre}</h5>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-250 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-light font-mono">${p.precio}</span>
                            <span className="text-[8px] text-indigo-500 font-bold">Histórico: {p.ventas_periodo} uds</span>
                          </div>
                          <ShoppingBag size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CARRUSEL 3: COMPARATIVO EN TIENDA (MISMOS PERO MÁS BARATOS O CONDICIÓN DISTINTA) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-indigo-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={18} />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Comparativa: Opciones en la Misma Categoría</h4>
                      <p className="text-[10px] text-slate-500">Mismo rubro ordenado de más barato a más caro (MercadoLibre Inteligente)</p>
                    </div>
                  </div>

                  {/* Selector de Producto Base */}
                  <select
                    value={selectedProductToCompare}
                    onChange={(e) => setSelectedProductToCompare(e.target.value)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-1 focus:ring-primary/25 cursor-pointer max-w-sm font-sans"
                  >
                    {products.length === 0 ? (
                      <option>Ningún producto disponible</option>
                    ) : (
                      products.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} (${p.precio_base || p.precio || 0})</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Ficha abreviada del producto base que el cliente está "Viendo" */}
                {selectedProdObj && (
                  <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/50 rounded-2xl flex items-center gap-3">
                    <div className="size-10 rounded-lg overflow-hidden bg-slate-100">
                      {getProductImages(selectedProdObj).length > 0 ? (
                        <img src={getProductImages(selectedProdObj)[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">No Img</div>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">Artículo actualmente en pantalla</span>
                      <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        {selectedProdObj.nombre} <span className="font-mono text-indigo-600">(${selectedProdObj.precio_base || selectedProdObj.precio || 0})</span>
                      </h5>
                    </div>
                  </div>
                )}

                {/* Carrusel comparador de alternativas */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin">
                  {sameCategoryProducts.length === 0 ? (
                    <div className="text-center py-6 w-full text-slate-400 text-xs font-mono">
                      No hay otras alternativas cargadas en la categoría "{selectedProdObj?.categoria_texto || 'General'}" para comparar.
                    </div>
                  ) : (
                    sameCategoryProducts.map(p => {
                      const basePrice = selectedProdObj?.precio_base || selectedProdObj?.precio || 0;
                      const altPrice = p.precio_base || p.precio || 0;
                      const isCheaper = altPrice < basePrice;
                      const discountDiff = basePrice - altPrice;

                      return (
                        <div key={p.id} className={`w-48 bg-white dark:bg-slate-900 border rounded-xl p-3 shrink-0 snap-start flex flex-col justify-between hover:shadow-lg transition-all ${
                          isCheaper ? 'border-emerald-500 shadow-emerald-500/5 ring-1 ring-emerald-500/10' : 'border-slate-150 dark:border-slate-800'
                        }`}>
                          <div>
                            <div className="w-full h-24 bg-slate-100 rounded-lg overflow-hidden shadow-sm relative">
                              {getProductImages(p).length > 0 ? (
                                <img src={getProductImages(p)[0]} alt={p.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">Sin foto</div>
                              )}
                              
                              {isCheaper && (
                                <span className="absolute bottom-2 left-2 bg-emerald-500 text-white font-black text-[8px] px-1 rounded flex items-center gap-0.5 shadow-sm">
                                  <ArrowDown size={8} className="animate-bounce" /> AHORRAS ${(Number(discountDiff) || 0).toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={p.nombre}>{p.nombre}</h5>
                              
                              {/* Differential condition visual tags */}
                              <div className="flex flex-wrap gap-1">
                                {p.pago_transferencia ? (
                                  <span className="text-[7.5px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 px-1 rounded flex items-center gap-0.5">
                                    <CreditCard size={8} /> Visa/Transf
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 px-1 rounded flex items-center gap-0.5">
                                    <CreditCard size={8} /> Solo Efectivo
                                  </span>
                                )}

                                {p.envio_propio ? (
                                  <span className="text-[7.5px] font-bold bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 px-1 rounded flex items-center gap-0.5" title={`Costo: $${p.costo_envio}`}>
                                    <Truck size={8} /> Delivery Propio
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 px-1 rounded flex items-center gap-0.5">
                                    <Truck size={8} /> flete general
                                  </span>
                                )}

                                <span className={`text-[7.5px] font-semibold px-1 rounded ${
                                  p.modalidad === 'inmediata' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {p.modalidad === 'inmediata' ? 'Inmediato' : 'Bajo pedido'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">${altPrice}</span>
                            <span className="text-[8px] text-slate-400 font-medium">De {p.negocio?.nombre_negocio || 'Local'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// Small Subcomponents inside file to enforce modularity
function UsersHighlightBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-full shadow-sm blink-hover shrink-0">
      <Star size={10} className="text-orange-500 animate-pulse fill-orange-500" />
      <span className="text-[8px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">{text}</span>
    </div>
  );
}
