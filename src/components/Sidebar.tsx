import React, { useState, useEffect } from 'react';
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [isInicioExpanded, setIsInicioExpanded] = useState(true);
  const [isAppsExpanded, setIsAppsExpanded] = useState(true);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error' | 'offline'>('checking');
  const [pendingReports, setPendingReports] = useState(0);
  const { user, userRole, userPermissions, hasPermission, signOut } = useAuth();
  const { businessProfile } = useApp();

  const navItems = [
    { to: "/mis-productos", label: "Catálogo & Stock", icon: Package, permission: PERMISSIONS.STOCK.ACCEDER_CATALOGO.id },
    { to: "/moderacion", label: "Moderación Store", icon: Lock, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/pedidos", label: "Pedidos", icon: ReceiptText, permission: PERMISSIONS.PEDIDOS.ACCEDER_PEDIDOS.id },
    { to: "/pedidos-v2", label: "Pedidos v2", icon: Sparkles, permission: PERMISSIONS.PEDIDOS.ACCEDER_PEDIDOS.id },
    { to: "/clasificacion", label: "Categorías y Flujos", icon: LayoutGrid, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/proveedores", label: "Proveedores", icon: Truck, permission: PERMISSIONS.STOCK.ACCEDER_CATALOGO.id },
    { to: "/revendedores", label: "Revendedores", icon: Building2, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
    { to: "/logistica", label: "Logística Central", icon: Navigation, permission: PERMISSIONS.LOGISTICA.ACCEDER_LOGISTICA.id },
    { to: "/reportes", label: "Centro de Reportes", icon: Bug, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id, badge: true },
    { to: "/historial", label: "Historial", icon: History, permission: PERMISSIONS.ADMIN.ACCEDER_ADMINISTRACION.id },
  ];

  const visibleNavItems = navItems.filter(item => {
    return hasPermission(item.permission);
  });

  const canShowApps = hasPermission('Admin.VistaGeneral.Ver') || hasPermission(PERMISSIONS.STOCK.ACCEDER_CATALOGO.id);

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
          onClick={onClose}
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

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 -mr-3 custom-scrollbar">
          {/* Item Padre - Inicio */}
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
                onClick={onClose}
                className="flex-1 flex items-center gap-3 px-4 py-2 cursor-pointer"
              >
                <Home 
                  size={18} 
                  className={cn(
                    "transition-colors duration-150", 
                    location.pathname === '/' && (location.search === '' || location.search.includes('menu=main')) ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,194,255,0.4)]" : "text-slate-400 group-hover:text-primary"
                  )} 
                />
                <span className="text-[13px] font-bold tracking-tight">Inicio</span>
              </NavLink>
              
              <button
                onClick={() => setIsInicioExpanded(!isInicioExpanded)}
                className="p-2.5 mr-1 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronDown 
                  size={16} 
                  className={cn(
                    "text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ease-out",
                    isInicioExpanded ? "rotate-180" : ""
                  )}
                />
              </button>
            </div>

            {/* Items Hijos - Conexiones y Atajos */}
            {isInicioExpanded && (
              <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                {/* Vertical tree branch guide line */}
                <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />

                {/* 1. Inicio G3D */}
                {hasPermission('Inicio.G3d.Ver') && (
                  <NavLink
                    to="/?menu=g3d"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                      location.pathname === '/' && location.search.includes('menu=g3d')
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-orange-500 shrink-0 animate-pulse" />
                    <span className="truncate">Inicio G3D</span>
                  </NavLink>
                )}

                {/* 2. Inicio XTV */}
                {hasPermission('Inicio.Xtv.Ver') && (
                  <NavLink
                    to="/?menu=xtv"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                      location.pathname === '/' && location.search.includes('menu=xtv')
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                    <span className="truncate">Inicio XTV</span>
                  </NavLink>
                )}

                {/* 3. Configuraciones */}
                {hasPermission('Inicio.Config.Ver') && (
                  <NavLink
                    to="/?menu=config"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                      location.pathname === '/' && location.search.includes('menu=config')
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-pink-500 shrink-0" />
                    <span className="truncate">Configuraciones</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {visibleNavItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl transition-colors duration-150 duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200 dark:ring-white/10" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white dark:bg-slate-800 -z-10" 
                    />
                  )}
                  <div className="relative shrink-0">
                    <item.icon 
                      size={18} 
                      className={cn(
                        "transition-colors duration-150 duration-500", 
                        isActive ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,194,255,0.4)]" : "text-slate-400 group-hover:text-primary group-"
                      )} 
                    />
                    {item.badge && pendingReports > 0 && (
                      <div className="absolute -top-1 -right-1 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 " />
                    )}
                  </div>
                  <span className={cn(
                    "text-[13px] font-bold tracking-tight transition-colors duration-150 duration-300",
                    isActive ? "translate-x-1" : "group-"
                  )}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Item Padre - Aplicaciones */}
          {canShowApps && (
            <div className="flex flex-col">
              <div
                className={cn(
                  "w-full flex items-center justify-between rounded-xl transition-colors duration-150 group relative overflow-hidden text-left",
                  location.pathname === '/apps'
                    ? "bg-slate-100 dark:bg-slate-900/40 text-slate-900 dark:text-white font-black" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50"
                )}
              >
                <NavLink
                  to="/apps"
                  onClick={onClose}
                  className="flex-1 flex items-center gap-3 px-4 py-2 cursor-pointer"
                >
                  <LayoutGrid 
                    size={18} 
                    className={cn(
                      "transition-colors duration-150", 
                      location.pathname === '/apps' ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(0,194,255,0.4)]" : "text-slate-400 group-hover:text-primary"
                    )} 
                  />
                  <span className="text-[13px] font-bold tracking-tight">Aplicaciones</span>
                </NavLink>

                <button
                  onClick={() => setIsAppsExpanded(!isAppsExpanded)}
                  className="p-2.5 mr-1 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronDown 
                    size={16} 
                    className={cn(
                      "text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ease-out",
                      isAppsExpanded ? "rotate-180" : ""
                    )}
                  />
                </button>
              </div>

              {/* Items Hijos - Aplicaciones */}
              {isAppsExpanded && (
                <div className="relative pl-7 pr-1 py-1 flex flex-col gap-1">
                  {/* Vertical tree branch guide line */}
                  <div className="absolute left-[18px] top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none" />

                  {/* 1. Panel de Aplicaciones */}
                  {hasPermission('Admin.VistaGeneral.Ver') && (
                    <NavLink
                      to="/apps"
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                        location.pathname === '/apps'
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                      )}
                    >
                      <div className="size-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="truncate">Acceder</span>
                    </NavLink>
                  )}

                  {/* 2. Simulador Chop */}
                  {hasPermission(PERMISSIONS.STOCK.ACCEDER_CATALOGO.id) && (
                    <NavLink
                      to="/simulador"
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px] font-bold relative overflow-hidden",
                        location.pathname === '/simulador'
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                      )}
                    >
                      <div className="size-1.5 rounded-full bg-cyan-500 shrink-0 animate-pulse" />
                      <span className="truncate">Simulador Chop</span>
                    </NavLink>
                  )}
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
              {/* Botón Configuración */}
              <NavLink 
                to="/configuracion" 
                title="Configuración"
                onClick={onClose}
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
