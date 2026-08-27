import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Menu, X } from 'lucide-react';
import { apiService } from './services/apiService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'sonner';
import { IptvRealtimeNotifier } from './components/IptvRealtimeNotifier';
import { ThemeToggle } from './components/ThemeToggle';

// Vistas ligeras del flujo de autenticación: se cargan siempre, se dejan directas.
import { Login } from './components/Login';
import { PantallaInvitacion } from './components/PantallaInvitacion';
import { WelcomeForm } from './components/WelcomeForm';
import { ProfileCompletionOverlay } from './components/ProfileCompletionOverlay';

// Vistas pesadas por ruta: se cargan bajo demanda (code-splitting) para que el
// navegador NO tenga que descargar todo (three.js, recharts, jspdf, etc.) al inicio.
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const HomeView = lazy(() => import('./components/HomeView').then(m => ({ default: m.HomeView })));
const OrdersList = lazy(() => import('./components/OrdersList').then(m => ({ default: m.OrdersList })));
const OrderForm = lazy(() => import('./components/OrderForm').then(m => ({ default: m.OrderForm })));
const OrderDetail = lazy(() => import('./components/OrderDetail').then(m => ({ default: m.OrderDetail })));
const HistoryView = lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const SuppliersView = lazy(() => import('./components/SuppliersView').then(m => ({ default: m.SuppliersView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const ReportsView = lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));
const SellersManager = lazy(() => import('./components/SellersManager').then(m => ({ default: m.SellersManager })));
const LogisticsCenterView = lazy(() => import('./components/LogisticsCenterView').then(m => ({ default: m.LogisticsCenterView })));
const ClassificationView = lazy(() => import('./components/ClassificationView').then(m => ({ default: m.ClassificationView })));
const MisProductosView = lazy(() => import('./components/MisProductosView').then(m => ({ default: m.MisProductosView })));
const StoreModerationView = lazy(() => import('./components/StoreModerationView').then(m => ({ default: m.StoreModerationView })));
const OrdersCenterView2 = lazy(() => import('./components/OrdersCenterView2').then(m => ({ default: m.OrdersCenterView2 })));
const IptvManagerView = lazy(() => import('./components/IptvManagerView').then(m => ({ default: m.IptvManagerView })));
const PriceListView = lazy(() => import('./components/PriceListView').then(m => ({ default: m.PriceListView })));
const AppsView = lazy(() => import('./components/AppsView'));
const XtvUnifiedView = lazy(() => import('./components/XtvUnifiedView'));
const ChopCustomizer = lazy(() => import('./components/ChopCustomizer').then(m => ({ default: m.ChopCustomizer })));

// Fallback mostrado mientras se descarga el chunk de una vista con lazy-loading.
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface ProtectedRouteProps {
  element: React.ReactElement;
  permission: string;
}

function ProtectedRoute({ element, permission }: ProtectedRouteProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-sm">
          <div className="size-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">shield_lock</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 dark:text-white uppercase text-base tracking-tight">Acceso Restringido</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tu rol de usuario actual no tiene asignado el permiso necesario para acceder a esta sección.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-1">Permiso Requerido:</span>
            <code className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg block overflow-x-auto select-all">
              {permission}
            </code>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    );
  }

  return element;
}

function AppContent() {
  const location = useLocation();
  const { session, user, userProfile, isWhitelisted, hasProfile, loading, userRole } = useAuth();
  const { businessProfile } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    // Escaneo del código de referido
    const handleAffiliateLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      
      if (ref) {
        // Traemos la configuración global para saber los días de validez
        const sysConfig = await apiService.getSystemConfig();
        const dias = sysConfig.dias_validez_link || 15;
        const expiresAt = Date.now() + (dias * 24 * 60 * 60 * 1000);
        
        localStorage.setItem('g3d_affiliate_ref', ref);
        localStorage.setItem('g3d_affiliate_expires', expiresAt.toString());
        
        urlParams.delete('ref');
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, '', newUrl);
        
        console.log(`[Afiliados] Código de referido '${ref}' almacenado con validez de ${dias} días.`);
      }
    };
    handleAffiliateLink();
  }, []);

  React.useEffect(() => {
    const handleStockAlert = (e: any) => {
      const { nombre, stock } = e.detail;
      import('sonner').then(({ toast }) => {
        toast.warning(
          `¡Stock Bajo! El producto "${nombre}" ha llegado a su umbral de alerta (Quedan: ${stock}).`,
          { duration: 10000, position: 'top-center' }
        );
      });
    };

    const handleStockZeroPause = (e: any) => {
      const { nombre } = e.detail;
      import('sonner').then(({ toast }) => {
        toast.error(
          `¡Sin Stock! El producto "${nombre}" se ha pausado automáticamente en la tienda.`,
          { duration: 10000, position: 'top-center' }
        );
      });
    };
    
    window.addEventListener('stock_alert', handleStockAlert);
    window.addEventListener('stock_zero_pause', handleStockZeroPause);
    return () => {
       window.removeEventListener('stock_alert', handleStockAlert);
       window.removeEventListener('stock_zero_pause', handleStockZeroPause);
    };
  }, []);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      apiService.reportError(event.error || event.message, 'PANEL_CONTROL', session?.user?.email || 'Sistema');
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      apiService.reportError(event.reason || 'Unhandled Promise Rejection', 'PANEL_CONTROL', session?.user?.email || 'Sistema');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [session]);

  React.useEffect(() => {
    if (businessProfile) {
      if (businessProfile.nombre_negocio) {
        document.title = businessProfile.nombre_negocio;
      }
      if (businessProfile.favicon_url) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = businessProfile.favicon_url;
      }
    }
  }, [businessProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  const cleanPath = location.pathname.toLowerCase().trim().replace(/\/$/, "");
  const isPublicRoute = cleanPath === '/simulador' || cleanPath === '/customizer';

  if (!user && isPublicRoute) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/simulador" element={<ChopCustomizer />} />
            <Route path="/customizer" element={<ChopCustomizer />} />
            <Route path="*" element={<Navigate to="/simulador" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isProfileIncomplete = user && userProfile ? (
    !userProfile.nombre || userProfile.nombre.trim() === '' ||
    !userProfile.telefono_contacto || userProfile.telefono_contacto.trim() === '' ||
    !userProfile.direccion_hogar || userProfile.direccion_hogar.trim() === '' ||
    !(userProfile.foto_perfil || userProfile.avatar_url) ||
    userProfile.password_hash === '123456'
  ) : false;

  if (isProfileIncomplete) {
    return <ProfileCompletionOverlay />;
  }

  return renderContent();

  function renderContent() {
    const cleanPath = location.pathname.toLowerCase().trim().replace(/\/$/, "");
    const isSimulatorRoute = cleanPath === '/simulador' || cleanPath === '/customizer';
    if (isSimulatorRoute) {
      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
          <IptvRealtimeNotifier />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/simulador" element={<ChopCustomizer />} />
              <Route path="/customizer" element={<ChopCustomizer />} />
              <Route path="*" element={<Navigate to="/simulador" replace />} />
            </Routes>
          </Suspense>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen">
        <IptvRealtimeNotifier />
        <div className="app-shell">
          
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar (Renderizado fuera de sidebar-container para evitar el 'hidden' en moviles) */}
          <div className="lg:hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>

          {/* Desktop Sidebar */}
          <div className="sidebar-container">
            <Sidebar isOpen={false} />
          </div>
          
          <main className="content-canvas">
            {/* Mobile Header - Solo visible en móvil */}
            <header className="lg:hidden h-20 glass-panel flex items-center justify-between px-6 shrink-0 z-30 shadow-sm sticky top-0 border-b-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors duration-150 "
              >
                <Menu size={28} />
              </button>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">3d_rotation</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white tracking-tight">G3D System</span>
              </div>
              <ThemeToggle variant="icon" />
            </header>

            {/* Desktop Theme Toggle Pill - Fijado en esquina superior derecha */}
            <div className="hidden lg:flex fixed top-5 right-8 z-40 pointer-events-auto">
              <ThemeToggle variant="pill" />
            </div>

            <div className="flex-1 lg:p-8 overflow-y-auto">
               <Suspense fallback={<RouteFallback />}>
               <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/xtv" element={<ProtectedRoute permission="Iptv.InicioResendores.Ingresar" element={<XtvUnifiedView />} />} />
                 <Route path="/xtv-panel" element={<Navigate to="/xtv" replace />} />
                <Route path="/admin" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<Dashboard />} />} />
                <Route path="/tareas" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrdersList />} />} />
                <Route path="/pedidos" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrdersList />} />} />
                <Route path="/pedidos-v2" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrdersCenterView2 />} />} />
                <Route path="/pedidos/nuevo" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrderForm />} />} />
                <Route path="/pedidos/editar/:id" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrderForm />} />} />
                <Route path="/pedidos/:id" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrderDetail />} />} />
                <Route path="/historial" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<HistoryView />} />} />
                <Route path="/clasificacion" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<ClassificationView />} />} />
                <Route path="/mis-productos" element={<ProtectedRoute permission="Stock.VistaGeneral.Ver" element={<MisProductosView />} />} />
                <Route path="/lista-precios" element={<ProtectedRoute permission="Stock.VistaGeneral.Ver" element={<PriceListView />} />} />
                <Route path="/moderacion" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<StoreModerationView />} />} />
                <Route path="/proveedores" element={<ProtectedRoute permission="Stock.VistaGeneral.Ver" element={<SuppliersView />} />} />
                <Route path="/revendedores" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<SellersManager />} />} />
                <Route path="/iptv-xtv" element={<Navigate to="/xtv" replace />} />
                <Route path="/logistica" element={<ProtectedRoute permission="Logistica.VistaGeneral.Ver" element={<LogisticsCenterView />} />} />
                <Route path="/apps" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<AppsView />} />} />
                <Route path="/reportes" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<ReportsView />} />} />
                <Route path="/configuracion" element={<ProtectedRoute permission="Admin.VistaGeneral.Ver" element={<SettingsView />} />} />
                <Route path="/simulador" element={<ChopCustomizer />} />
                <Route path="/customizer" element={<ChopCustomizer />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
               </Suspense>
            </div>
          </main>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Toaster position="top-right" richColors expand={true} />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppProvider>
    </Router>
  );
}



