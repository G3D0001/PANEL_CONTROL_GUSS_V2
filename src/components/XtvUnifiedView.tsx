import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Dashboard } from "./Dashboard";
import { IptvManagerView } from "./IptvManagerView";
import { Tv, ShieldAlert, Layers, Laptop } from "lucide-react";
import { cn } from "../lib/utils";

export default function XtvUnifiedView() {
  const { userRole, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Check custom permission boundaries
  const canAccessCentral = 
    hasPermission('Iptv.Clientes.Ver') || 
    hasPermission('Iptv.Finanzas.Ver') || 
    hasPermission('Iptv.Branding.Ver') || 
    hasPermission('Iptv.*') ||
    userRole === 'Admin' ||
    userRole === 'Administrador';

  const canAccessPanel = 
    hasPermission('Iptv.InicioRevendedores.Ingresar') ||
    hasPermission('Iptv.InicioResendores.Ingresar') || 
    hasPermission('Iptv.InicioResendores.VerYInteractuar') || 
    hasPermission('Iptv.InicioRevendedores.VerYInteractuar') || 
    hasPermission('Inicio.Xtv.Acceder') ||
    hasPermission('Inicio.Xtv.Ver') ||
    hasPermission('Iptv.CrearDirecto.Ver') ||
    hasPermission('Iptv.SolicitarActivacion.Ver') ||
    hasPermission('Iptv.Renovaciones.Ver') ||
    hasPermission('Iptv.Clientes.Ver') ||
    hasPermission('Iptv.Solicitudes.Ver') || 
    hasPermission('Iptv.Finanzas.Ver') || 
    hasPermission('Iptv.Tutoriales.Ver') || 
    hasPermission('Iptv.*') ||
    userRole === 'Admin' ||
    userRole === 'Administrador';

  // Determine starting tab based on search param, path name, or permissions
  const [activeTab, setActiveTab] = useState<'panel' | 'central'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'panel' && canAccessPanel) return 'panel';
    if (tabParam === 'central' && canAccessCentral) return 'central';

    // Default heuristics - Prefer Panel as requested by the user
    if (canAccessPanel) return 'panel';
    if (canAccessCentral) return 'central';
    return 'panel';
  });

  // Sync tab state when path or params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'panel' && canAccessPanel) {
      setActiveTab('panel');
    } else if (tabParam === 'central' && canAccessCentral) {
      setActiveTab('central');
    }
  }, [searchParams, canAccessPanel, canAccessCentral]);

  const handleTabChange = (tab: 'panel' | 'central') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // If the user has access to absolutely nothing under IPTV
  if (!canAccessPanel && !canAccessCentral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-450 rounded-2xl flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900 shadow-sm animate-pulse">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Acceso Restringido</h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mt-1.5 leading-relaxed">
          No tienes los permisos requeridos (<span className="font-mono">Iptv.InicioResendores.Ingresar</span>) para visualizar la consola de entretenimiento XTV. Contacta con soporte técnico.
        </p>
      </div>
    );
  }

  // Render direct single view if they only have access to one section
  if (canAccessPanel && !canAccessCentral) {
    return <Dashboard />;
  }

  if (canAccessCentral && !canAccessPanel) {
    return <IptvManagerView />;
  }

  // Render unified dual tabs view if they can access both
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Navigation Bar: Only visible when in 'central' mode, acting as a back button header */}
      {activeTab === 'central' && (
        <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => handleTabChange('panel')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-colors py-2 px-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-750"
          >
            <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
            Volver al Panel de Resendedores
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-250/20">
              Administración Central
            </span>
          </div>
        </div>
      )}

      {/* Viewport Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'panel' ? <Dashboard /> : <IptvManagerView />}
      </div>
    </div>
  );
}
