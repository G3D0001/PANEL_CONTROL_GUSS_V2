import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LogOut,
  ChevronDown,
  Rotate3d,
  CheckCircle2,
  XCircle,
  Loader2,
  Home,
  ReceiptText,
  Package,
  Store,
  Truck,
  Building2,
  Navigation,
  Lock,
  LayoutGrid,
  History,
  Settings,
  User,
  Users,
  ShieldCheck,
  Bug,
  Sparkles,
  Tv
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase, isOfflineMode } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { PERMISSIONS } from '../types/permissions';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Comprobar si la ruta actual pertenece a cada grupo
  const isG3dActive = useMemo(() => {
    const g3dPaths = ["/mis-productos", "/pedidos", "/moderacion", "/clasificacion", "/proveedores", "/revendedores", "/logistica"];
    return g3dPaths.some(p => location.pathname === p) || (location.pathname === '/' && location.search.includes('menu=g3d'));
  }, [location.pathname, location.search]);

  const isXtvActive = useMemo(() => {
    return location.pathname.startsWith('/xtv') || (location.pathname === '/' && location.search.includes('menu=xtv'));
  }, [location.pathname, location.search]);

  const isAppsActive = useMemo(() => {
    return location.pathname === '/apps' || location.pathname === '/simulador';
  }, [location.pathname]);

  const isSystemActive = useMemo(() => {
    return location.pathname === '/reportes' || location.pathname === '/historial' || location.pathname === '/configuracion';
  }, [location.pathname]);

  // Estados de apertura de grupos (cerrados por defecto salvo que la ruta actual pertenezca al grupo)
  const [isG3dExpanded, setIsG3dExpanded] = useState(() => isG3dActive);
  const [isXtvExpanded, setIsXtvExpanded] = useState(() => isXtvActive);
  const [isAppsExpanded, setIsAppsExpanded] = useState(() => isAppsActive);
  const [isSystemExpanded, setIsSystemExpanded] = useState(() => isSystemActive);

  // Sincronizar apertura automática al navegar a una sección
  useEffect(() => {
    if (isG3dActive) setIsG3dExpanded(true);
    if (isXtvActive) setIsXtvExpanded(true);
    if (isAppsActive) setIsAppsExpanded(true);
    if (isSystemActive) setIsSystemExpanded(true);
  }, [isG3dActive, isXtvActive, isAppsActive, isSystemActive]);

  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error' | 'offline'>('checking');
  const [pendingReports, setPendingReports] = useState(0);
  const { user, userRole, userPermissions, hasPermission, signOut } = useAuth();
  const { businessProfile } = useApp();

  // Módulo G3D - Tienda Web
  const g3dItems = [
    { to: "/mis-productos", label: "Catálogo & Stock", icon: Package, permission: PERMISSIONS.STOCK.ACCEDER_CATALOGO.id },
    { to: "/pedidos", label: "Gestión de Pedidos", icon: ReceiptText, permission: PERMISSIONS.PEDIDOS.ACCEDER_PEDIDOS.id },
    { to: "/moderacion", label: "Moderación Store", icon: Lock, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/clasificacion", label: "Categorías y Flujos", icon: LayoutGrid, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/proveedores", label: "Proveedores", icon: Truck, permission: PERMISSIONS.STOCK.ACCEDER_CATALOGO.id },
    { to: "/revendedores", label: "Revendedores", icon: Building2, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/logistica", label: "Logística Central", icon: Navigation, permission: PERMISSIONS.LOGISTICA.ACCEDER_LOGISTICA.id },
  ].filter(item => hasPermission(item.permission));

  // Módulo XTV - TV Digital
  const xtvItems = [
    { to: "/xtv?menu=crear_directo", label: "Crear Línea Directa", icon: Sparkles, permission: 'Iptv.CrearDirecto.Ver' },
    { to: "/xtv?menu=solicitar_activacion", label: "Solicitar / Demo", icon: Tv, permission: 'Iptv.SolicitarActivacion.Ver' },
    { to: "/xtv?menu=renovaciones", label: "Renovaciones", icon: Rotate3d, permission: 'Iptv.Renovaciones.Ver' },
    { to: "/xtv?menu=mis_clientes", label: "Mis Clientes", icon: User, permission: 'Iptv.Clientes.Ver' },
    { to: "/xtv?menu=finanzas", label: "Solicitudes & Créditos", icon: ReceiptText, permission: 'Iptv.Solicitudes.Ver' },
  ].filter(item => hasPermission(item.permission) || hasPermission('Iptv.*') || hasPermission('Admin.*'));

  // Módulo Sistema & Auditoría
  const systemItems = [
    { to: "/configuracion?tab=users", label: "Usuarios & Perfiles", icon: Users, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/configuracion?tab=permissions", label: "Permisos RBAC", icon: ShieldCheck, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/reportes", label: "Centro de Reportes", icon: Bug, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id, badge: true },
    { to: "/historial", label: "Historial de Auditoría", icon: History, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/configuracion", label: "Ajustes del Sistema", icon: Settings, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
  ].filter(item => hasPermission(item.permission) || userRole === 'Admin' || userRole === 'Administrador');

  const canShowG3d = g3dItems.length > 0;
  const canShowXtv = xtvItems.length > 0 || hasPermission('Inicio.Xtv.Ver') || hasPermission('Iptv.*');
  const canShowApps = hasPermission('Admin.VistaGeneral.Ver') || hasPermission(PERMISSIONS.STOCK.ACCEDER_CATALOGO.id);
  const canShowSystem = systemItems.length > 0;

  useEffect(() => {
    const checkConnection = async () => {
      if (isOfflineMode) {
        setDbStatus('offline');
        return;
      }
      try {
        const { error } = await supabase.from('pedidos').select('id').limit(1);
        if (error) throw error;
        setDbStatus('connected');
      } catch (err) {
        console.warn("Supabase connection warning (handled gracefully):", err);
        setDbStatus('error');
      }
    };

    const fetchReportsCount = async () => {
      if (userRole === 'Admin' || userPermissions.includes('ACCESO_TOTAL')) {
        const count = await apiService.getPendingReportsCount();
        setPendingReports(count);
      }
    };

    checkConnection();
    fetchReportsCount();

    // Escuchar actualizaciones de reportes
    window.addEventListener('reports_updated', fetchReportsCount);
    return () => window.removeEventListener('reports_updated', fetchReportsCount);
  }, [userRole, userPermissions]);

  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (confirmLogout) {
      const t = setTimeout(() => setConfirmLogout(false), 4000);
      return () => clearTimeout(t);
    }
  }, [confirmLogout]);

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setConfirmLogout(false);
    await signOut();
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-[85%] sm:w-80 max-w-[320px] glass-panel border-r border-slate-200/50 dark:border-white/5 flex flex-col shrink-0 h-screen transition-colors duration-150 duration-500 lg:w-72 lg:relative lg:translate-x-0 lg:rounded-none",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-4 flex flex-col gap-4 h-full relative">
        {/* Close button for mobile */}
        <button 
          onClick={handleClose}
          className="lg:hidden absolute top-4 right-6 size-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 shadow-md border border-slate-100"
        >
          <XCircle size={20} />
        </button>

        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center p-2 mb-2 border-b border-slate-250/30 dark:border-white/5 w-full">
          {businessProfile.panel_logo_url || businessProfile.logo_url ? (
            <div className="w-full max-h-16 flex items-center justify-center overflow-hidden mb-1">
              <img 
                src={businessProfile.panel_logo_url || businessProfile.logo_url} 
                alt="Logo Encabezado" 
                className="max-h-12 w-auto object-contain" 
                referrerPolicy="no-referrer" 
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full group">
              <div 
                className="size-10 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-2xl shadow-primary/30 transition-all duration-500 hover:rotate-6"
                style={{ backgroundColor: businessProfile.color_primario || '#00C2FF' }}
              >
                <span className="material-symbols-outlined text-2xl">3d_rotation</span>
              </div>
              <div>
                <h1 className="font-bold text-xl leading-none truncate max-w-[160px] tracking-tighter text-slate-800 dark:text-white">
                  {businessProfile.nombre_negocio || 'G3D APP'}
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-cyan-500/80 mt-1 flex items-center gap-2">
                  <span className="size-1.5 bg-cyan-500 rounded-full " />
                  Admin Panel
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-2 -mr-3 custom-scrollbar">
          {/* 1. SECCIÓN: INICIO GENERAL */}
          <div className="flex flex-col">
            <div
              className={cn(
                "w-full flex items-center justify-between rounded-xl transition-colors duration-150 group relative overflow-hidden text-left",
                location.pathname === '/' && (location.search === '' || location.search.includes('menu=main'))
                  ? "bg-slate-100 dark:bg-slate-900/40 text-slate-900 dark:text-white font-black" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50"
              )}
            >
              <NavLink
                to="/"
                onClick={handleClose}
                className="flex-1 flex items-center gap-3 px-4 py-2 cursor-pointer"
              >
                <Home 
                  size={18} 
                  className={cn(
                    "transition-colors duration-150", 
                    location.pathname === '/' && (location.search === '' || location.search.includes('menu=main')) ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,194,255,0.4)]" : "text-slate-400 group-hover:text-primary"
                  )} 
                />
                <span className="text-[13px] font-bold tracking-tight">Inicio General</span>
              </NavLink>
            </div>
          </div>

          {/* 2. SECCIÓN: TIENDA G3D */}
          {canShowG3d && (
            <div className="flex flex-col">
              <div
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-150 group relative overflow-hidden text-left select-none",
                  isG3dActive
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shadow-xs border border-orange-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                {/* Al tocar el texto/icono: navega a Inicio G3D y despliega el acordeón */}
                <NavLink
                  to="/?menu=g3d"
                  onClick={() => {
                    setIsG3dExpanded(true);
                    handleClose();
                  }}
                  className="flex-1 flex items-center gap-3 py-1 cursor-pointer"
                >
                  <Package 
                    size={18} 
                    className={cn(
                      "transition-colors duration-150",
                      isG3dActive ? "text-orange-500 scale-105" : "text-slate-400 group-hover:text-orange-500"
                    )} 
                  />
                  <span className="text-[13px] font-bold tracking-tight">Tienda G3D</span>
                </NavLink>
                
                {/* Al tocar la flechita: solo abre o cierra el desplegable sin navegar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsG3dExpanded(!isG3dExpanded);
                  }}
                  className="p-1.5 hover:bg-orange-500/20 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={isG3dExpanded ? "Plegar menú" : "Desplegar menú"}
                >
                  <ChevronDown 
                    size={15} 
                    className={cn(
                      "transition-transform duration-300 ease-out",
                      isG3dExpanded ? "rotate-180 text-orange-500" : ""
                    )}
                  />
                </button>
              </div>

              {isG3dExpanded && (
                <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                  <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />
                  {g3dItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                          isActive
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                        )}
                      >
                        <item.icon size={14} className={isActive ? "text-orange-500" : "text-slate-400"} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. SECCIÓN: IPTV XTV */}
          {canShowXtv && (
            <div className="flex flex-col">
              <div
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-150 group relative overflow-hidden text-left select-none",
                  isXtvActive
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                {/* Al tocar el texto/icono: navega a Inicio XTV y despliega el acordeón */}
                <NavLink
                  to="/xtv"
                  onClick={() => {
                    setIsXtvExpanded(true);
                    handleClose();
                  }}
                  className="flex-1 flex items-center gap-3 py-1 cursor-pointer"
                >
                  <Tv 
                    size={18} 
                    className={cn(
                      "transition-colors duration-150",
                      isXtvActive ? "text-blue-500 scale-105" : "text-slate-400 group-hover:text-blue-500"
                    )} 
                  />
                  <span className="text-[13px] font-bold tracking-tight">IPTV XTV</span>
                </NavLink>
                
                {/* Al tocar la flechita: solo abre o cierra el desplegable sin navegar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsXtvExpanded(!isXtvExpanded);
                  }}
                  className="p-1.5 hover:bg-blue-500/20 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={isXtvExpanded ? "Plegar menú" : "Desplegar menú"}
                >
                  <ChevronDown 
                    size={15} 
                    className={cn(
                      "transition-transform duration-300 ease-out",
                      isXtvExpanded ? "rotate-180 text-blue-500" : ""
                    )}
                  />
                </button>
              </div>

              {isXtvExpanded && (
                <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                  <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />
                  {xtvItems.map((item) => {
                    const isActive = location.pathname + location.search === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                          isActive
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                        )}
                      >
                        <item.icon size={14} className={isActive ? "text-blue-500" : "text-slate-400"} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. SECCIÓN: APLICACIONES & HERRAMIENTAS */}
          {canShowApps && (
            <div className="flex flex-col">
              <div
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-150 group relative overflow-hidden text-left select-none",
                  isAppsActive
                    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold shadow-xs border border-teal-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                {/* Al tocar el texto/icono: navega a Apps y despliega el acordeón */}
                <NavLink
                  to="/apps"
                  onClick={() => {
                    setIsAppsExpanded(true);
                    handleClose();
                  }}
                  className="flex-1 flex items-center gap-3 py-1 cursor-pointer"
                >
                  <LayoutGrid 
                    size={18} 
                    className={cn(
                      "transition-colors duration-150",
                      isAppsActive ? "text-teal-500 scale-105" : "text-slate-400 group-hover:text-teal-500"
                    )} 
                  />
                  <span className="text-[13px] font-bold tracking-tight">Aplicaciones</span>
                </NavLink>

                {/* Al tocar la flechita: solo abre o cierra el desplegable sin navegar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsAppsExpanded(!isAppsExpanded);
                  }}
                  className="p-1.5 hover:bg-teal-500/20 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={isAppsExpanded ? "Plegar menú" : "Desplegar menú"}
                >
                  <ChevronDown 
                    size={15} 
                    className={cn(
                      "transition-transform duration-300 ease-out",
                      isAppsExpanded ? "rotate-180 text-teal-500" : ""
                    )}
                  />
                </button>
              </div>

              {isAppsExpanded && (
                <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                  <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />
                  
                  {hasPermission('Admin.VistaGeneral.Ver') && (
                    <NavLink
                      to="/apps"
                      onClick={handleClose}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                        location.pathname === '/apps'
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                      )}
                    >
                      <LayoutGrid size={14} className={location.pathname === '/apps' ? "text-teal-500" : "text-slate-400"} />
                      <span className="truncate">Panel de Apps</span>
                    </NavLink>
                  )}

                  {hasPermission(PERMISSIONS.STOCK.ACCEDER_CATALOGO.id) && (
                    <NavLink
                      to="/simulador"
                      onClick={handleClose}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                        location.pathname === '/simulador'
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                      )}
                    >
                      <Rotate3d size={14} className={location.pathname === '/simulador' ? "text-cyan-500" : "text-slate-400"} />
                      <span className="truncate">Simulador Chop 3D</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. SECCIÓN: SISTEMA & AUDITORÍA */}
          {canShowSystem && (
            <div className="flex flex-col">
              <div
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-150 group relative overflow-hidden text-left select-none",
                  isSystemActive
                    ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-slate-700" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                {/* Al tocar el texto/icono: navega al módulo de reportes/sistema y despliega el acordeón */}
                <NavLink
                  to="/reportes"
                  onClick={() => {
                    setIsSystemExpanded(true);
                    handleClose();
                  }}
                  className="flex-1 flex items-center gap-3 py-1 cursor-pointer"
                >
                  <Bug 
                    size={18} 
                    className={cn(
                      "transition-colors duration-150",
                      isSystemActive ? "text-primary scale-105" : "text-slate-400 group-hover:text-primary"
                    )} 
                  />
                  <span className="text-[13px] font-bold tracking-tight">Sistema</span>
                </NavLink>

                {/* Al tocar la flechita: solo abre o cierra el desplegable sin navegar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsSystemExpanded(!isSystemExpanded);
                  }}
                  className="p-1.5 hover:bg-slate-300/40 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={isSystemExpanded ? "Plegar menú" : "Desplegar menú"}
                >
                  <ChevronDown 
                    size={15} 
                    className={cn(
                      "transition-transform duration-300 ease-out",
                      isSystemExpanded ? "rotate-180 text-primary" : ""
                    )}
                  />
                </button>
              </div>

              {isSystemExpanded && (
                <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                  <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />
                  {systemItems.map((item) => {
                    const currentFullPath = location.pathname + (location.search || '');
                    const isActive = item.to.includes('?') 
                      ? currentFullPath === item.to 
                      : (location.pathname === item.to && (!location.search || location.search === ''));
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                          isActive
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                        )}
                      >
                        <item.icon size={14} className={isActive ? "text-primary" : "text-slate-400"} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Tienda Web Link */}
        {hasPermission(PERMISSIONS.STOCK.ACCEDER_CATALOGO.id) && (
          <div className="pb-4">
            <a 
              href={businessProfile?.tienda_url || '#'} 
              target={businessProfile?.tienda_url ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!businessProfile?.tienda_url) {
                  e.preventDefault();
                  import('sonner').then(({ toast }) => toast.info('Configura la URL de la tienda en Preferencias Globales.'));
                }
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-sm border border-slate-700 hover:bg-slate-800 transition-colors duration-150 group"
            >
              <Store size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                 <span className="text-xs font-bold">Tienda Web</span>
                 <span className="text-[9px] text-slate-400 font-medium">Ver catálogo online</span>
              </div>
            </a>
          </div>
        )}

        {/* Profile Section (Unified & Ultra-compact to fit flawlessly on all screen heights) */}
        <div className="mt-auto border-t border-slate-200/50 dark:border-white/5 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="size-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-2xl">account_circle</span>
              )}
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-[11px] font-black truncate text-slate-800 dark:text-white leading-tight">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#00C2FF] truncate">
                  {userRole || 'Usuario'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Selector Modo Claro / Oscuro */}
              <ThemeToggle className="size-7" />

              {/* Botón Configuración */}
              <NavLink 
                to="/configuracion" 
                title="Configuración"
                onClick={handleClose}
                className={({ isActive }) => cn(
                  "p-1.5 rounded-lg transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white",
                  isActive ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : ""
                )}
              >
                <Settings size={15} />
              </NavLink>

              {/* Botón Cerrar Sesión */}
              <button 
                onClick={handleLogout}
                title={confirmLogout ? "Clic para Confirmar Salida" : "Cerrar Sesión"}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-300",
                  confirmLogout 
                    ? "bg-rose-500 text-white animate-pulse" 
                    : "hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                )}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="px-2 py-0.5 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "size-1.5 rounded-full",
                dbStatus === 'connected' ? "bg-emerald-500" : dbStatus === 'offline' ? "bg-amber-500" : dbStatus === 'error' ? "bg-rose-500" : "bg-slate-300"
              )} />
              <span>
                {dbStatus === 'connected' ? "Supabase Online" : dbStatus === 'offline' ? "Local Offline" : dbStatus === 'error' ? "Error Red" : "Conectando..."}
              </span>
            </div>
            {confirmLogout && (
              <span className="text-rose-500 animate-pulse font-black">¡CONFIRMAR!</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
