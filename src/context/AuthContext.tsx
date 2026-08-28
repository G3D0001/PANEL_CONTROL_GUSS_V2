import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  session: any | null;
  user: any | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInLocal: (user: any) => void;
  // Extras
  isWhitelisted: boolean | null;
  hasProfile: boolean | null;
  userRole: string | null; // 'Admin' | 'Vendedor'
  userRoles: string[];
  userPermissions: string[];
  simulatedRole: string | null;
  simulatedPermissions: string[] | null;
  hasPermission: (node: string) => boolean;
  setSimulatedRole: (role: string | null) => void;
  setSimulatedPermissions: (perms: string[]) => void;
  persistPermissions: () => Promise<{ success: boolean; error?: string }>;
  loginLocal: (usuario: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [panelSession, setPanelSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Simulated Roles / Custom permissions
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const [simulatedPermissions, setSimulatedPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    // Al iniciar, cargar sesión local si existe
    const savedSession = localStorage.getItem('g3d_panel_usuario_sesion');
    if (savedSession) {
      try {
        setPanelSession(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('g3d_panel_usuario_sesion');
      }
    }
    setLoading(false);
  }, []);

  const [dbUserRoles, setDbUserRoles] = useState<string[]>([]);
  const [dbUserPermissions, setDbUserPermissions] = useState<string[]>([]);
  const [dbPermissionsLoaded, setDbPermissionsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!panelSession) {
      setDbUserRoles([]);
      setDbUserPermissions([]);
      setDbPermissionsLoaded(false);
      return;
    }

    const loadUserRolesAndPerms = async () => {
      try {
        const userId = panelSession.id;

        // 1. Obtener datos del usuario desde perfiles_locales
        const { data: profileData } = await supabase
          .from('perfiles_locales')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileData) {
          setUserProfile(profileData);
          
          // Registrar última actividad de forma silenciosa
          const nowIso = new Date().toISOString();
          const datos_adicionales = profileData.datos_adicionales || {};
          const updatedAdicionales = { ...datos_adicionales, last_active_at: nowIso };
          try {
            await supabase
              .from('perfiles_locales')
              .update({ 
                last_active_at: nowIso,
                datos_adicionales: updatedAdicionales
              })
              .eq('id', userId);
          } catch (e) {
            try {
              await supabase
                .from('perfiles_locales')
                .update({ 
                  datos_adicionales: updatedAdicionales
                })
                .eq('id', userId);
            } catch (innerErr) {
              console.warn("No se pudo guardar la última actividad:", innerErr);
            }
          }
        }

        // Obtener roles del usuario (soporta multi-roles en roles o fallback a rol individual)
        let userRolesList: string[] = [];
        if (Array.isArray(profileData?.roles) && profileData.roles.length > 0) {
          userRolesList = profileData.roles;
        } else if (typeof profileData?.roles === 'string' && profileData.roles.startsWith('[')) {
          try {
            userRolesList = JSON.parse(profileData.roles);
          } catch {
            userRolesList = [profileData.rol || panelSession.rol || 'VENDEDOR'];
          }
        } else {
          const userAssignedRole = profileData?.rol || panelSession.rol || 'VENDEDOR';
          userRolesList = [userAssignedRole];
        }

        // Obtener roles y su herencia desde seguridad_roles
        const { data: dbRolesData } = await supabase
          .from('seguridad_roles')
          .select('*');

        const rolesMap = new Map<string, { rol_padre?: string | null; permisos: string[] }>();
        if (dbRolesData && dbRolesData.length > 0) {
          dbRolesData.forEach((r: any) => {
            const rawPerms = Array.isArray(r.permisos) ? r.permisos : (typeof r.permisos === 'string' ? JSON.parse(r.permisos) : []);
            rolesMap.set(r.id, {
              rol_padre: r.rol_padre,
              permisos: rawPerms
            });
          });
        }

        // Helper recursivo para resolver permisos con herencia
        const getInheritedRolePermissions = (roleId: string, visited: Set<string> = new Set()): string[] => {
          if (!roleId || visited.has(roleId)) return [];
          visited.add(roleId);

          const roleObj = rolesMap.get(roleId);
          if (!roleObj) {
            // Si el rol es Administrador, tiene Admin.* por defecto
            if (roleId.toLowerCase() === 'administrador' || roleId.toLowerCase() === 'admin') {
              return ['Admin.*'];
            }
            return [];
          }

          const currentPerms = roleObj.permisos || [];
          if (roleObj.rol_padre) {
            const parentPerms = getInheritedRolePermissions(roleObj.rol_padre, visited);
            return Array.from(new Set([...parentPerms, ...currentPerms]));
          }

          return currentPerms;
        };

        // Permisos base obtenidos de la suma de TODOS los roles asignados y su jerarquía
        const baseRolePermsSet = new Set<string>();
        userRolesList.forEach(rId => {
          const rolePerms = getInheritedRolePermissions(rId);
          rolePerms.forEach(p => baseRolePermsSet.add(p));
        });
        const baseRolePerms = Array.from(baseRolePermsSet);

        // Permisos extra y permisos denegados del usuario
        const userExtra = Array.isArray(profileData?.permisos_extra) 
          ? profileData.permisos_extra 
          : (typeof profileData?.permisos_extra === 'string' ? JSON.parse(profileData.permisos_extra) : []);

        const userDenied = Array.isArray(profileData?.permisos_denegados) 
          ? profileData.permisos_denegados 
          : (typeof profileData?.permisos_denegados === 'string' ? JSON.parse(profileData.permisos_denegados) : []);

        // Compatibilidad con columna legacy "permisos" si no hay permisos_extra
        const legacyPerms = Array.isArray(profileData?.permisos) ? profileData.permisos : [];

        // Permisos unificados con negaciones explícitas marcadas con prefijo "-"
        const effectivePermsSet = new Set<string>();

        // 1. Agregar permisos del rol y de herencia
        baseRolePerms.forEach(p => effectivePermsSet.add(p));

        // 2. Agregar permisos extra
        userExtra.forEach((p: string) => effectivePermsSet.add(p));
        legacyPerms.forEach((p: string) => {
          if (!p.startsWith('-')) effectivePermsSet.add(p);
        });

        // 3. Aplicar denegaciones (tienen prioridad absoluta)
        const finalPermissions: string[] = [];
        const deniedSet = new Set(userDenied.map((p: string) => p.toLowerCase().replace(/^-/, '')));

        // Agregar también las negaciones legadas
        legacyPerms.forEach((p: string) => {
          if (p.startsWith('-')) {
            deniedSet.add(p.slice(1).toLowerCase());
          }
        });

        effectivePermsSet.forEach(p => {
          const clean = p.toLowerCase();
          if (!deniedSet.has(clean)) {
            finalPermissions.push(p);
          }
        });

        // Agregar las negaciones explícitas al array de permisos como -permiso
        deniedSet.forEach(d => {
          finalPermissions.push(`-${d}`);
        });

        setDbUserRoles(userRolesList);
        setDbUserPermissions(finalPermissions);
        setDbPermissionsLoaded(true);
      } catch (e) {
        console.warn("[AuthContext] Error consultando rol unificado en Supabase, usando fallback local:", e);
        const currentRol = panelSession.rol || 'VENDEDOR';
        setDbUserRoles([currentRol]);
        
        let basePermissions: string[] = currentRol === 'Administrador' ? ['Admin.*'] : [];
        const savedRoleConfigs = localStorage.getItem('iptv_role_configs');
        if (savedRoleConfigs) {
          try {
            const parsed = JSON.parse(savedRoleConfigs);
            const config = parsed.find((r: any) => r.id.toUpperCase() === currentRol.toUpperCase());
            if (config && Array.isArray(config.permisos)) {
              basePermissions = config.permisos;
            }
          } catch (err) {
            basePermissions = [];
          }
        }

        setDbUserPermissions(basePermissions);
        setDbPermissionsLoaded(true);
      }
    };

    // Cargar inicialmente
    loadUserRolesAndPerms();

    // SUSCRIPCIÓN EN TIEMPO REAL CON SUPABASE
    const userId = panelSession.id;
    
    const realtimeChannel = supabase
      .channel(`user-auth-realtime:${userId}`)
      // Escuchar cambios en perfiles_locales para el usuario logueado
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfiles_locales',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log("[Realtime Auth] Detectado cambio en perfiles_locales:", payload);
          loadUserRolesAndPerms();
        }
      )
      // Escuchar cambios globales en seguridad_roles
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seguridad_roles'
        },
        (payload) => {
          console.log("[Realtime Auth] Detectado cambio global en seguridad_roles, recargando...");
          loadUserRolesAndPerms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [panelSession]);

  // --- CONTROL DE INACTIVIDAD DE 1 HORA ---
  useEffect(() => {
    if (!panelSession) return;

    const actualizarActividad = () => {
      localStorage.setItem('g3d_panel_ultima_actividad', Date.now().toString());
    };

    // Escuchar interacciones para detectar actividad del usuario
    window.addEventListener('mousemove', actualizarActividad);
    window.addEventListener('mousedown', actualizarActividad);
    window.addEventListener('keypress', actualizarActividad);
    window.addEventListener('scroll', actualizarActividad);
    window.addEventListener('touchstart', actualizarActividad);

    actualizarActividad();

    const checkInterval = setInterval(() => {
      const ultimaActividadStr = localStorage.getItem('g3d_panel_ultima_actividad');
      if (ultimaActividadStr) {
        const ultimaActividad = parseInt(ultimaActividadStr, 10);
        const unaHora = 3600000; // 1 hora en milisegundos

        if (Date.now() - ultimaActividad > unaHora) {
          clearInterval(checkInterval);
          signOut();
          toast.warning("Tu sesión ha sido cerrada automáticamente por 1 hora de inactividad.", {
            duration: 10000,
          });
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', actualizarActividad);
      window.removeEventListener('mousedown', actualizarActividad);
      window.removeEventListener('keypress', actualizarActividad);
      window.removeEventListener('scroll', actualizarActividad);
      window.removeEventListener('touchstart', actualizarActividad);
      clearInterval(checkInterval);
    };
  }, [panelSession]);

  const loginLocal = useCallback(async (usuarioInput: string, contrasenaInput: string, skipSetSession = false): Promise<{ success: boolean; error?: string; sessionData?: any }> => {
    const userLower = usuarioInput.trim().toLowerCase();
    const pass = contrasenaInput.trim();

    try {
      // Intentar encontrar con email directo o con el sufijo @xtv.com aplicable
      let possibleEmails = [userLower];
      if (!userLower.includes('@')) {
        possibleEmails.push(`${userLower}@xtv.com`);
      }

      // 1. Intentamos consultar la tabla única central "perfiles_locales"
      const { data, error } = await supabase
        .from('perfiles_locales')
        .select('*')
        .in('email', possibleEmails)
        .eq('password_hash', pass)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Verificar si el usuario está bloqueado o inactivo
        if (data.activo === false || data.bloqueado === true || data.estado === 'bloqueado') {
          return {
            success: false,
            error: '⛔ Acceso denegado: Este usuario ha sido bloqueado o desactivado por el Administrador.'
          };
        }

        const customSession = {
          id: data.id || `profile-id-${data.email}`,
          usuario: data.email,
          nombre: data.nombre || data.email.split('@')[0],
          rol: data.rol || 'IPTV CLIENTES'
        };
        if (!skipSetSession) {
          localStorage.setItem('g3d_panel_usuario_sesion', JSON.stringify(customSession));
          setPanelSession(customSession);
          toast.success(`¡Bienvenido ${customSession.nombre}!`);
        }
        return { success: true, sessionData: customSession };
      }
    } catch (e: any) {
      console.warn("[loginLocal] Error consultando perfiles_locales:", e);
      return { 
        success: false, 
        error: `Error de conexión con la base de datos de Supabase: ${e.message || e}`
      };
    }

    return {
      success: false,
      error: 'Usuario o contraseña incorrectos. Verifica que el usuario exista en la tabla "perfiles_locales" de Supabase con su respectivo correo y contraseña.'
    };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('g3d_panel_usuario_sesion');
    sessionStorage.removeItem('g3d_initial_redirect_done');
    setPanelSession(null);
    toast.info("Sesión cerrada.");
  }, []);

  const signInLocal = useCallback((sessionData: any) => {
    localStorage.setItem('g3d_panel_usuario_sesion', JSON.stringify(sessionData));
    sessionStorage.removeItem('g3d_initial_redirect_done');
    setPanelSession(sessionData);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (panelSession?.id) {
      try {
        const { data, error } = await supabase
          .from('perfiles_locales')
          .select('*')
          .eq('id', panelSession.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setUserProfile(data);
          const updatedSession = {
            ...panelSession,
            nombre: data.nombre || panelSession.nombre,
            rol: data.rol || panelSession.rol,
            avatar_url: data.avatar_url || data.foto_perfil || ''
          };
          localStorage.setItem('g3d_panel_usuario_sesion', JSON.stringify(updatedSession));
          setPanelSession(updatedSession);
        }
      } catch (e) {
        console.warn("Error refreshing profile:", e);
      }
    }
  }, [panelSession]);

  const persistPermissions = useCallback(async () => ({ success: true }), []);

  // Map settings to old vars so other views don't break
  const user = useMemo(() => panelSession ? {
    id: panelSession.id,
    email: panelSession.usuario,
    user_metadata: {
      name: panelSession.nombre,
      full_name: userProfile?.nombre || panelSession.nombre,
      avatar_url: userProfile?.avatar_url || userProfile?.foto_perfil || '',
      foto_perfil: userProfile?.foto_perfil || userProfile?.avatar_url || ''
    }
  } : null, [panelSession, userProfile]);

  const session = useMemo(() => panelSession ? {
    user: user,
    expires_at: 9999999999
  } : null, [panelSession, user]);

  const userRole = useMemo(() => panelSession
    ? (() => {
        const r = String(panelSession.rol || '').trim().toLowerCase();
        if (r === 'admin' || r === 'administrador' || r === 'administrador total' || r === 'superuser') {
          return 'Admin';
        }
        if (r === 'iptv_socios' || r === 'iptv socios' || r === 'iptv socio' || r === 'socio') {
          return 'IPTV SOCIOS';
        }
        if (r === 'iptv_vendedores' || r === 'iptv vendedores' || r === 'iptv vendedor' || r === 'vendedor') {
          return 'IPTV VENDEDORES';
        }
        if (r === 'iptv_clientes' || r === 'iptv clientes' || r === 'iptv cliente' || r === 'cliente') {
          return 'IPTV CLIENTES';
        }
        return panelSession.rol || 'IPTV CLIENTES';
      })()
    : null, [panelSession]);

  const userRoles = useMemo(() => dbUserRoles.length > 0 ? dbUserRoles : (userRole ? [userRole] : []), [dbUserRoles, userRole]);
  const userPermissions = useMemo(() => dbPermissionsLoaded ? dbUserPermissions : (userRole === 'Admin' ? ['*'] : ['IPTV.Ver']), [dbPermissionsLoaded, dbUserPermissions, userRole]);

  const hasPermission = useCallback((node: string, actionType: 'ver' | 'interactuar' = 'ver'): boolean => {
    // Si el usuario actual está bloqueado o inactivo por el administrador, revocar todos los accesos
    if (userProfile && (userProfile.activo === false || userProfile.bloqueado === true || userProfile.estado === 'bloqueado')) {
      return false;
    }

    const activeRole = simulatedRole || userRole;
    if (!activeRole) return false;
    
    const normalizedRole = activeRole.toUpperCase();
    
    // Si es Administrador total, tiene acceso completo a todo (lectura y escritura), salvo que esté explícitamente negado
    const isAdminRole = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR' || normalizedRole === 'SUPERUSER';

    // Cargar permisos desde DB o fallback local
    let currentPermissions: string[] = [];
    if (dbPermissionsLoaded && !simulatedRole) {
      currentPermissions = dbUserPermissions;
    } else {
      let savedRoleConfigs = localStorage.getItem('iptv_role_configs');
      if (savedRoleConfigs) {
        try {
          const parsed = JSON.parse(savedRoleConfigs);
          const config = parsed.find((r: any) => r.id.toUpperCase() === normalizedRole);
          if (config && Array.isArray(config.permisos)) {
            currentPermissions = config.permisos;
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const defaultConfigs = [
          { id: 'Administrador', permisos: ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'] },
          { id: 'IPTV SOCIOS', permisos: ['Iptv.InicioResendores.Ingresar', 'Iptv.InicioResendores.VerYInteractuar', 'Iptv.Finanzas.Ver', 'Iptv.Branding.Ver', 'Iptv.Renovaciones.Acceder', 'Iptv.AyudaCreditos.Acceder'] },
          { id: 'IPTV VENDEDORES', permisos: ['Iptv.InicioResendores.Ingresar', 'Iptv.InicioResendores.VerYInteractuar', 'Iptv.Clientes.Ver', 'Iptv.Mensajes.Ver', 'Iptv.Solicitudes.Ver', 'Iptv.CrearDirecto.Acceder', 'Iptv.SolicitarActivacion.Acceder'] },
          { id: 'IPTV CLIENTES', permisos: ['Iptv.InicioResendores.Ingresar', 'Iptv.InicioResendores.VerYInteractuar', 'Iptv.Clientes.Ver', 'Iptv.Solicitudes.Ver'] }
        ];
        localStorage.setItem('iptv_role_configs', JSON.stringify(defaultConfigs));
        const config = defaultConfigs.find((r: any) => r.id.toUpperCase() === normalizedRole);
        if (config) {
          currentPermissions = config.permisos;
        }
      }
    }

    // Normalizar permisos para incluir alias de compatibilidad bidireccional
    const normalizedPermissions = [...currentPermissions];
    const hasOldIptv = currentPermissions.some((p: string) => p.toLowerCase() === 'iptv.vistageneral.ver' || p.toLowerCase() === 'iptv.vistageneral.ver:completo');
    const hasNewIptv = currentPermissions.some((p: string) => p.toLowerCase() === 'iptv.inicioresendores.ingresar' || p.toLowerCase() === 'iptv.inicioresendores.ingresar:completo');
    const hasVerInteract = currentPermissions.some((p: string) => p.toLowerCase() === 'iptv.inicioresendores.veryinteractuar' || p.toLowerCase() === 'iptv.inicioresendores.veryinteractuar:completo');

    if (hasOldIptv && !hasNewIptv) {
      normalizedPermissions.push('Iptv.InicioResendores.Ingresar');
    }
    if (hasNewIptv && !hasOldIptv) {
      normalizedPermissions.push('Iptv.VistaGeneral.Ver');
    }
    if (hasVerInteract && !hasNewIptv) {
      normalizedPermissions.push('Iptv.InicioResendores.Ingresar');
    }

    const cleanNode = node.toLowerCase();

    // Determinar si el permiso buscado está otorgado explícita y positivamente en normalizedPermissions
    const isExplicitlyGranted = normalizedPermissions.some((p: string) => {
      if (p.startsWith('-')) return false;
      let cleanP = p.toLowerCase();
      if (cleanP.endsWith(':completo')) {
        cleanP = cleanP.replace(':completo', '');
      }
      return cleanP === cleanNode;
    });

    // 1. CHEQUEAR NEGACIÓN DIRECTA (Sólo coincidencias exactas para permitir que el switch Admin se apague sin afectar a los específicos)
    const isNegated = normalizedPermissions.some((p: string) => {
      if (!p.startsWith('-')) return false;
      let cleanPerm = p.slice(1).toLowerCase();
      
      // Quitar sufijo :completo si existe para el chequeo de negación
      if (cleanPerm.endsWith(':completo')) {
        cleanPerm = cleanPerm.replace(':completo', '');
      }

      // Si es una negación específica exacta (ej: -iptv.inicioresendores.ingresar)
      return cleanNode === cleanPerm;
    });

    if (isNegated) return false;

    // Si requiere interactuar y el rol es Admin, se le permite siempre que no esté negado
    if (actionType === 'interactuar' && isAdminRole) {
      return true;
    }

    // 2. CHEQUEAR PERMISOS POSITIVOS
    const isGranted = normalizedPermissions.some((p: string) => {
      let cleanPerm = p.toLowerCase();
      let isPermissionComplete = false;

      if (cleanPerm.endsWith(':completo')) {
        cleanPerm = cleanPerm.replace(':completo', '');
        isPermissionComplete = true;
      }

      // Si es un comodín general de la rama o de todo el sistema
      if (cleanPerm === '*' || cleanPerm.endsWith('.*')) {
        const prefix = cleanPerm === '*' ? '' : cleanPerm.slice(0, -2);
        const matchesBranch = prefix ? cleanNode.startsWith(prefix) : true;
        
        if (matchesBranch) {
          // Un comodín otorga acceso completo (interactuar) por defecto
          return true;
        }
      }

      const isExactMatch = cleanNode === cleanPerm;

      if (isExactMatch) {
        if (actionType === 'interactuar') {
          // Si requiere interactuar, el permiso debe estar guardado como completo
          return isPermissionComplete;
        }
        // Si requiere solo ver, cualquier coincidencia exacta (completo o solo ver) es suficiente
        return true;
      }

      return false;
    });

    if (isGranted) return true;

    // 3. FALLBACK PARA ADMINISTRADOR TOTAL (si no está explícitamente negado)
    if (isAdminRole) {
      return true;
    }

    return false;
  }, [simulatedRole, userRole, dbPermissionsLoaded, dbUserPermissions]);

  // Memoizar el value evita re-renders innecesarios de todos los consumidores
  // de useAuth() cuando el provider se renderiza sin que cambie el estado de auth.
  const contextValue = useMemo(() => ({
    session,
    user,
    userProfile,
    loading,
    signOut,
    refreshProfile,
    signInLocal,
    isWhitelisted: true,
    hasProfile: true,
    userRole,
    userRoles,
    userPermissions,
    simulatedRole,
    simulatedPermissions,
    hasPermission,
    setSimulatedRole,
    setSimulatedPermissions,
    persistPermissions,
    loginLocal
  }), [
    session, user, userProfile, loading, signOut, refreshProfile, signInLocal,
    userRole, userRoles, userPermissions, simulatedRole, simulatedPermissions,
    hasPermission, persistPermissions, loginLocal
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
