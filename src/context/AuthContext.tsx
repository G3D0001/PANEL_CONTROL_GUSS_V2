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
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  updateUserProfileLocally: (newProfile: any) => void;
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
    const rawInput = usuarioInput.trim();
    const userLower = rawInput.toLowerCase();
    const pass = contrasenaInput.trim();

    if (!rawInput || !pass) {
      return { success: false, error: 'Por favor, ingresa tu usuario y contraseña.' };
    }

    try {
      let foundUsers: any[] = [];

      // 1. Intentar búsqueda combinada inteligente en Supabase (email exacto, email con prefijo, usuario o nombre)
      try {
        const orFilter = userLower.includes('@')
          ? `email.ilike.${userLower}`
          : `email.ilike.${userLower},email.ilike.${userLower}@%,usuario.ilike.${userLower},nombre.ilike.${userLower}`;

        const { data: orData, error: orError } = await supabase
          .from('perfiles_locales')
          .select('*')
          .or(orFilter);

        if (!orError && Array.isArray(orData) && orData.length > 0) {
          foundUsers = orData;
        }
      } catch (errOr) {
        console.warn("[loginLocal] Búsqueda por filtro OR no disponible, usando búsqueda por lista:", errOr);
      }

      // 2. Fallback si el filtro OR no devolvió resultados: Búsqueda directa por posibles emails
      if (foundUsers.length === 0) {
        const possibleEmails = [userLower];
        if (!userLower.includes('@')) {
          possibleEmails.push(`${userLower}@xtv.com`);
          possibleEmails.push(`${userLower}@g3d.com`);
          possibleEmails.push(`${userLower}@gmail.com`);
        }

        const { data: emailData } = await supabase
          .from('perfiles_locales')
          .select('*')
          .in('email', possibleEmails);

        if (Array.isArray(emailData) && emailData.length > 0) {
          foundUsers = emailData;
        }
      }

      // 3. Fallback adicional: Búsqueda flexible por nombre que contenga el término
      if (foundUsers.length === 0) {
        const { data: nameData } = await supabase
          .from('perfiles_locales')
          .select('*')
          .ilike('nombre', `%${userLower}%`);

        if (Array.isArray(nameData) && nameData.length > 0) {
          foundUsers = nameData;
        }
      }

      // 4. Si aún no encontramos el usuario, consultar todos los perfiles si la lista es pequeña (para evitar problemas de formato)
      if (foundUsers.length === 0) {
        const { data: allData } = await supabase
          .from('perfiles_locales')
          .select('*')
          .limit(50);

        if (Array.isArray(allData) && allData.length > 0) {
          const matched = allData.filter((u: any) => {
            const uEmail = String(u.email || '').toLowerCase();
            const uNombre = String(u.nombre || '').toLowerCase();
            const uUser = String(u.usuario || '').toLowerCase();
            return (
              uEmail === userLower ||
              uEmail.startsWith(`${userLower}@`) ||
              uNombre.includes(userLower) ||
              uUser === userLower
            );
          });
          if (matched.length > 0) {
            foundUsers = matched;
          }
        }
      }

      // Si no se encontró ningún usuario con ese identificador
      if (foundUsers.length === 0) {
        return {
          success: false,
          error: `No se encontró ningún usuario registrado como "${rawInput}". Verifica que esté creado en la tabla "perfiles_locales" de Supabase (por nombre o correo).`
        };
      }

      // 5. Validar la contraseña contra las posibles columnas (password_hash, password, clave, contrasena)
      let matchedUser: any = null;
      for (const candidate of foundUsers) {
        const candidatePass = 
          candidate.password_hash || 
          candidate.password || 
          candidate.clave || 
          candidate.contrasena ||
          candidate.datos_adicionales?.password ||
          candidate.datos_adicionales?.password_hash ||
          candidate.datos_adicionales?.clave;

        if (candidatePass && String(candidatePass).trim() === pass) {
          matchedUser = candidate;
          break;
        }
      }

      if (!matchedUser) {
        const matchedCandidate = foundUsers[0];
        const displayName = matchedCandidate.nombre || matchedCandidate.email || rawInput;
        return {
          success: false,
          error: `Contraseña incorrecta para el usuario "${displayName}". Verifica la clave ingresada.`
        };
      }

      // 6. Verificar si el usuario está bloqueado o inactivo
      if (matchedUser.activo === false || matchedUser.bloqueado === true || matchedUser.estado === 'bloqueado') {
        return {
          success: false,
          error: '⛔ Acceso denegado: Este usuario ha sido bloqueado o desactivado por el Administrador.'
        };
      }

      // 7. Generar sesión exitosa
      const customSession = {
        id: matchedUser.id || `profile-id-${matchedUser.email}`,
        usuario: matchedUser.email || matchedUser.usuario || rawInput,
        nombre: matchedUser.nombre || matchedUser.email?.split('@')[0] || rawInput,
        rol: matchedUser.rol || 'VENDEDOR'
      };

      if (!skipSetSession) {
        localStorage.setItem('g3d_panel_usuario_sesion', JSON.stringify(customSession));
        setPanelSession(customSession);
        setUserProfile(matchedUser);
        toast.success(`¡Bienvenido ${customSession.nombre}!`);
      }

      return { success: true, sessionData: customSession };
    } catch (e: any) {
      console.warn("[loginLocal] Error consultando perfiles_locales:", e);
      return { 
        success: false, 
        error: `Error de conexión con la base de datos de Supabase: ${e.message || e}`
      };
    }
  }, []);

  const updateUserProfileLocally = useCallback((newProfileData: any) => {
    setUserProfile((prev: any) => {
      const merged = { ...(prev || {}), ...newProfileData };
      return merged;
    });

    if (panelSession) {
      const updatedSession = {
        ...panelSession,
        nombre: newProfileData.nombre || panelSession.nombre,
        rol: newProfileData.rol || panelSession.rol,
        avatar_url: newProfileData.avatar_url || newProfileData.foto_perfil || panelSession.avatar_url || ''
      };
      localStorage.setItem('g3d_panel_usuario_sesion', JSON.stringify(updatedSession));
      setPanelSession(updatedSession);
    }
  }, [panelSession]);

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
        const r = String(panelSession.rol || '').trim();
        const lower = r.toLowerCase();
        if (lower === 'admin' || lower === 'administrador' || lower === 'administrador total' || lower === 'superuser') {
          return 'Admin';
        }
        return r || 'VENDEDOR';
      })()
    : null, [panelSession]);

  const userRoles = useMemo(() => dbUserRoles.length > 0 ? dbUserRoles : (userRole ? [userRole] : []), [dbUserRoles, userRole]);
  const userPermissions = useMemo(() => dbPermissionsLoaded ? dbUserPermissions : (userRole === 'Admin' ? ['*'] : []), [dbPermissionsLoaded, dbUserPermissions, userRole]);

  const hasPermission = useCallback((node: string, actionType: 'ver' | 'interactuar' = 'ver'): boolean => {
    // Si el usuario actual está bloqueado o inactivo por el administrador, revocar todos los accesos
    if (userProfile && (userProfile.activo === false || userProfile.bloqueado === true || userProfile.estado === 'bloqueado')) {
      return false;
    }

    const activeRole = simulatedRole || userRole;
    if (!activeRole) return false;
    
    const normalizedRole = activeRole.toUpperCase();
    
    // Si es Administrador total, tiene acceso completo a todo (lectura y escritura), salvo que esté explícitamente negado
    const isAdminRole = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR' || normalizedRole === 'SUPERUSER' || userRoles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRADOR');

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
      } else if (isAdminRole) {
        currentPermissions = ['*'];
      }
    }

    // Normalizar permisos para incluir alias de compatibilidad bidireccional (evita fallos por diferencias de tipeo)
    const normalizedPermissions = [...currentPermissions];
    
    // Si tiene cualquier permiso de XTV / IPTV, se le otorga acceso al ingreso general del módulo XTV
    const hasAnyIptvChild = currentPermissions.some((p: string) => {
      if (p.startsWith('-')) return false;
      const lp = p.toLowerCase();
      return lp.startsWith('xtv.') || lp.startsWith('iptv.') || lp === '*';
    });

    if (hasAnyIptvChild) {
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'xtv.general.acceder')) {
        normalizedPermissions.push('Xtv.General.Acceder');
      }
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'iptv.inicioresendores.ingresar')) {
        normalizedPermissions.push('Iptv.InicioResendores.Ingresar');
      }
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'iptv.iniciorevendedores.ingresar')) {
        normalizedPermissions.push('Iptv.InicioRevendedores.Ingresar');
      }
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'inicio.xtv.ver')) {
        normalizedPermissions.push('Inicio.Xtv.Ver');
      }
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'inicio.xtv.acceder')) {
        normalizedPermissions.push('Inicio.Xtv.Acceder');
      }
    }

    // Si tiene permiso de G3D (G3d.AccesoCompleto, G3d.*) se le otorga acceso a todas las sub-secciones de la tienda G3D
    const hasG3dComplete = currentPermissions.some((p: string) => {
      if (p.startsWith('-')) return false;
      const lp = p.toLowerCase();
      return lp === 'g3d.accesocompleto' || lp === 'g3d.*' || lp === '*';
    });

    if (hasG3dComplete) {
      const g3dLegacyPerms = [
        'Stock.*', 'Stock.VistaGeneral.Ver', 'Pedidos.*', 'Pedidos.VistaGeneral.Ver',
        'Logistica.*', 'Logistica.VistaGeneral.Ver', 'Admin.VistaGeneral.Ver',
        'Inicio.G3d.Ver', 'Inicio.G3d.Acceder'
      ];
      g3dLegacyPerms.forEach(perm => {
        if (!normalizedPermissions.some(p => p.toLowerCase() === perm.toLowerCase())) {
          normalizedPermissions.push(perm);
        }
      });
    }

    // Si tiene cualquier permiso de G3D / Stock / Pedidos / Logística, se le otorga acceso a ver e ingresar a G3D
    const hasAnyG3dChild = currentPermissions.some((p: string) => {
      if (p.startsWith('-')) return false;
      const lp = p.toLowerCase();
      return lp.startsWith('g3d.') || lp.startsWith('stock.') || lp.startsWith('pedidos.') || lp.startsWith('logistica.') || lp === '*';
    });

    if (hasAnyG3dChild) {
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'inicio.g3d.ver')) {
        normalizedPermissions.push('Inicio.G3d.Ver');
      }
      if (!normalizedPermissions.some(p => p.toLowerCase() === 'inicio.g3d.acceder')) {
        normalizedPermissions.push('Inicio.G3d.Acceder');
      }
    }

    const cleanNode = node.toLowerCase();

    // 1. CHEQUEAR NEGACIÓN DIRECTA (Prioridad absoluta de bloqueo)
    const isNegated = normalizedPermissions.some((p: string) => {
      if (!p.startsWith('-')) return false;
      let cleanPerm = p.slice(1).toLowerCase();
      
      // Quitar sufijo :completo si existe para el chequeo de negación
      if (cleanPerm.endsWith(':completo')) {
        cleanPerm = cleanPerm.replace(':completo', '');
      }

      // Equivalencias de negación
      if (cleanPerm === 'iptv.inicioresendores.ingresar' || cleanPerm === 'iptv.iniciorevendedores.ingresar') {
        if (cleanNode === 'iptv.inicioresendores.ingresar' || cleanNode === 'iptv.iniciorevendedores.ingresar' || cleanNode === 'inicio.xtv.ver' || cleanNode === 'inicio.xtv.acceder') {
          return true;
        }
      }

      return cleanNode === cleanPerm;
    });

    if (isNegated) return false;

    // Si requiere interactuar y el rol es Admin, se le permite siempre que no esté negado
    if (isAdminRole) {
      return true;
    }

    // 2. CHEQUEAR PERMISOS POSITIVOS Y COMODINES
    const isGranted = normalizedPermissions.some((p: string) => {
      if (p.startsWith('-')) return false;
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
          return true;
        }
      }

      // Mapeo transparente bidireccional entre Xtv.* y Iptv.* / G3d.*
      const aliasMap: Record<string, string[]> = {
        'xtv.general.acceder': ['iptv.inicioresendores.ingresar', 'iptv.iniciorevendedores.ingresar', 'inicio.xtv.ver', 'inicio.xtv.acceder', 'iptv.acceso'],
        'xtv.lineas.creardirecto': ['iptv.creardirecto.ver', 'iptv.creardirecto.acceder'],
        'xtv.lineas.solicitar': ['iptv.solicitaractivacion.ver', 'iptv.solicitaractivacion.acceder'],
        'xtv.lineas.demo': ['iptv.creardirecto.demo', 'iptv.demo.ver', 'iptv.demo.acceder'],
        'xtv.clientes.verpropios': ['iptv.clientes.verpropios', 'iptv.clientes.ver', 'iptv.clientes.acceder'],
        'xtv.clientes.vertodos': ['iptv.clientes.vertodos', 'iptv.clientes.ver_todos'],
        'xtv.renovaciones.verpropias': ['iptv.renovaciones.verpropios', 'iptv.renovaciones.ver', 'iptv.renovaciones.acceder'],
        'xtv.renovaciones.vertodas': ['iptv.renovaciones.vertodos', 'iptv.renovaciones.renovar_general'],
        'xtv.solicitudes.ver': ['iptv.solicitudes.ver', 'iptv.solicitudes.acceder', 'iptv.solicitudes.vertodas'],
        'xtv.solicitudes.aprobar': ['iptv.solicitudes.aprobar'],
        'xtv.finanzas.verpropias': ['iptv.finanzas.ver', 'iptv.finanzas.acceder', 'iptv.finanzas.revendedores.ver', 'inicio.finanzas.ver', 'inicio.finanzas.acceder'],
        'xtv.finanzas.liquidaradmin': ['iptv.comisiones.solicitudes.interactuar', 'inicio.finanzasadmin.ver', 'inicio.finanzasadmin.acceder'],
        'xtv.ajustes.planes': ['iptv.planes.ver', 'iptv.planes.editar', 'iptv.ajustes.ver'],
        'xtv.ajustes.panelxc': ['iptv.panelxc.ver', 'admin.consolaapi.ver', 'admin.integracionxc.acceder', 'iptv.creditos_xc_panel.ver'],
        'g3d.accesocompleto': ['g3d.*', 'stock.*', 'pedidos.*', 'logistica.*', 'stock.vistageneral.ver', 'pedidos.vistageneral.ver', 'logistica.vistageneral.ver', 'inicio.g3d.ver', 'inicio.g3d.acceder']
      };

      for (const [canonical, aliases] of Object.entries(aliasMap)) {
        const fullGroup = [canonical, ...aliases];
        if (fullGroup.includes(cleanNode) && fullGroup.includes(cleanPerm)) {
          return true;
        }
      }

      // Equivalencias de alias para entrada a XTV
      if (
        (cleanNode === 'iptv.inicioresendores.ingresar' || cleanNode === 'iptv.iniciorevendedores.ingresar' || cleanNode === 'inicio.xtv.ver' || cleanNode === 'inicio.xtv.acceder' || cleanNode === 'xtv.general.acceder') &&
        (cleanPerm === 'iptv.inicioresendores.ingresar' || cleanPerm === 'iptv.iniciorevendedores.ingresar' || cleanPerm === 'inicio.xtv.ver' || cleanPerm === 'inicio.xtv.acceder' || cleanPerm === 'xtv.general.acceder')
      ) {
        return true;
      }

      if (
        (cleanNode === 'iptv.inicioresendores.veryinteractuar' || cleanNode === 'iptv.iniciorevendedores.veryinteractuar') &&
        (cleanPerm === 'iptv.inicioresendores.veryinteractuar' || cleanPerm === 'iptv.iniciorevendedores.veryinteractuar')
      ) {
        return true;
      }

      const isExactMatch = cleanNode === cleanPerm;

      if (isExactMatch) {
        if (actionType === 'interactuar') {
          return isPermissionComplete;
        }
        return true;
      }

      return false;
    });

    if (isGranted) return true;

    return false;
  }, [simulatedRole, userRole, userRoles, dbPermissionsLoaded, dbUserPermissions, userProfile]);

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
    loginLocal,
    setUserProfile,
    updateUserProfileLocally
  }), [
    session, user, userProfile, loading, signOut, refreshProfile, signInLocal,
    userRole, userRoles, userPermissions, simulatedRole, simulatedPermissions,
    hasPermission, persistPermissions, loginLocal, updateUserProfileLocally
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
