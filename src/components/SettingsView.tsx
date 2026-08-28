import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Users, Building2, ShieldCheck, Key, ShieldAlert, Settings, 
  RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ProfileSettingsTab } from './settings/ProfileSettingsTab';
import { UserProfilesManagementTab } from './settings/UserProfilesManagementTab';
import { BusinessIdentitiesTab } from './settings/BusinessIdentitiesTab';
import { PermissionsCasbinTab } from './settings/PermissionsCasbinTab';
import { ApisIntegrationsTab } from './settings/ApisIntegrationsTab';
import { SystemSecurityTab } from './settings/SystemSecurityTab';

export type SettingsTabType = 'profile' | 'users' | 'permissions' | 'businesses' | 'apis' | 'security';

export function SettingsView() {
  const { user, profile, hasPermission, isDevMode, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTabType;
  
  const [activeTab, setActiveTab] = useState<SettingsTabType>(tabFromUrl || 'profile');
  const [targetUserIdForPermissions, setTargetUserIdForPermissions] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  // Sincronizar cambios en el query param si cambian externamente
  useEffect(() => {
    const currentTabParam = searchParams.get('tab') as SettingsTabType;
    if (currentTabParam && ['profile', 'users', 'permissions', 'businesses', 'apis', 'security'].includes(currentTabParam)) {
      setActiveTab(currentTabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: SettingsTabType) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Cargar configuración global de Supabase
  const fetchSystemConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (data) {
        setSystemConfig(data);
        localStorage.setItem('g3d_configuracion_sistema_cache', JSON.stringify(data));
      } else {
        const cached = localStorage.getItem('g3d_configuracion_sistema_cache');
        if (cached) {
          try {
            setSystemConfig(JSON.parse(cached));
          } catch {
            setSystemConfig({});
          }
        }
      }
    } catch (err: any) {
      console.warn('Advertencia al consultar configuracion_sistema:', err?.message || err);
      const cached = localStorage.getItem('g3d_configuracion_sistema_cache');
      if (cached) {
        try {
          setSystemConfig(JSON.parse(cached));
        } catch {
          setSystemConfig({});
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const isAdmin = profile?.rol === 'Administrador' || isDevMode || hasPermission?.('Admin.*');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-xl shadow-indigo-600/30 text-white">
            <Settings className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Panel de Configuraciones Generales
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestión modular de usuarios, identidades de negocio, perfiles XTV/G3D, APIs y permisos RBAC.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchSystemConfig();
            refreshProfile();
            toast.success('Configuraciones recargadas');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700/60 transition-all hover:scale-105 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      {/* Navegación Modular por Pestañas */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
          }`}
        >
          <User className="w-4 h-4 text-indigo-300" /> Mi Perfil
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300" /> Usuarios & Perfiles
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetUserIdForPermissions(undefined);
                handleTabChange('permissions');
              }}
              className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-300" /> Permisos RBAC
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('businesses')}
              className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'businesses'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-300" /> Negocios & Logos
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('apis')}
              className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'apis'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-4 h-4 text-indigo-300" /> APIs & Integraciones
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('security')}
              className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-indigo-300" /> Seguridad & Sistema
            </button>
          </>
        )}
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="pt-2">
        {activeTab === 'profile' && (
          <ProfileSettingsTab
            user={user}
            profile={profile}
            onProfileUpdated={refreshProfile}
          />
        )}

        {activeTab === 'users' && isAdmin && (
          <UserProfilesManagementTab
            currentUser={user}
            onDataChanged={async () => {
              await fetchSystemConfig();
              await refreshProfile();
            }}
            onNavigateToPermissions={(userId) => {
              setTargetUserIdForPermissions(userId);
              setActiveTab('permissions');
            }}
          />
        )}

        {activeTab === 'permissions' && isAdmin && (
          <PermissionsCasbinTab
            currentUser={user}
            initialSelectedUserId={targetUserIdForPermissions}
            onDataChanged={async () => {
              await fetchSystemConfig();
              await refreshProfile();
            }}
          />
        )}

        {activeTab === 'businesses' && isAdmin && (
          <BusinessIdentitiesTab
            config={systemConfig}
            onConfigSaved={fetchSystemConfig}
          />
        )}

        {activeTab === 'apis' && isAdmin && (
          <ApisIntegrationsTab
            config={systemConfig}
            onConfigSaved={fetchSystemConfig}
          />
        )}

        {activeTab === 'security' && isAdmin && (
          <SystemSecurityTab
            config={systemConfig}
            onConfigSaved={fetchSystemConfig}
          />
        )}
      </div>
    </div>
  );
}
