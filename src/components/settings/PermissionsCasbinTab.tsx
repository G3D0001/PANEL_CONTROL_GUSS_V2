import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Shield, Key, Search, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, 
  X, Check, Lock, Unlock, ChevronRight, ChevronDown, ChevronUp, Sliders, ShieldCheck, UserCheck, Layers, Save,
  FolderOpen, Filter, ArrowLeft, ArrowRight, Sparkles, HelpCircle, UserPlus, Ban, UserX,
  Maximize2, Minimize2, GitBranch, ShieldAlert, CheckSquare, MinusCircle, RefreshCw, Tv, ShoppingBag, Settings,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { PERMISSIONS, getAllPermissionsList } from '../../types/permissions';

interface PermissionsCasbinTabProps {
  currentUser: any;
  onDataChanged: () => Promise<void>;
}

type SelectionType = 'role' | 'user';

interface CustomPermMeta {
  title?: string;
  description?: string;
}

interface SeguridadRol {
  id: string;
  nombre: string;
  rol_padre: string | null;
  permisos: string[];
  descripcion?: string;
}

export function PermissionsCasbinTab({ currentUser, onDataChanged }: PermissionsCasbinTabProps) {
  const [loading, setLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Lista de usuarios reales en Supabase (perfiles_locales)
  const [usersList, setUsersList] = useState<any[]>([]);
  // Lista de roles reales en Supabase (seguridad_roles)
  const [rolesList, setRolesList] = useState<SeguridadRol[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFactionTab, setActiveFactionTab] = useState<'ALL' | 'XTV' | 'G3D' | 'ADMIN'>('ALL');

  // Selección actual: Por Rol o por Usuario
  const [selectionType, setSelectionType] = useState<SelectionType>('role');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('REVENDEDOR');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Permisos para el ROL seleccionado (solo directos del rol)
  const [roleDirectPerms, setRoleDirectPerms] = useState<string[]>([]);
  const [selectedRoleParent, setSelectedRoleParent] = useState<string>('');

  // Configuración de permisos para el USUARIO seleccionado
  const [userExtraPerms, setUserExtraPerms] = useState<string[]>([]);
  const [userDeniedPerms, setUserDeniedPerms] = useState<string[]>([]);
  const [userAssignedRole, setUserAssignedRole] = useState<string>('VENDEDOR');

  // Estado de acordeones desplegables por facción
  const [expandedFactions, setExpandedFactions] = useState<Record<string, boolean>>({
    ADMIN: true,
    IPTV: true,
    G3D: true,
    PEDIDOS: true,
    FINANZAS_CONSOLIDADAS: false,
    LOGISTICA: false
  });

  // Customizaciones locales de Título y Descripción de permisos (Regla de Oro #11)
  const [customMetadata, setCustomMetadata] = useState<Record<string, CustomPermMeta>>(() => {
    try {
      const saved = localStorage.getItem('g3d_custom_permissions_desc');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modales
  const [editingPermId, setEditingPermId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  // Modal para Crear Nuevo Usuario
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Modal para Crear Nuevo Rol
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleParent, setNewRoleParent] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Modal para Confirmar Eliminación de Usuario
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Modal para Confirmar Eliminación de Rol
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Facciones de trabajo normalizadas con iconos, categorías y descripciones claras
  const FACTIONS_CONFIG: Record<string, { label: string; icon: string; subtitle: string; scope: 'XTV' | 'G3D' | 'ADMIN' }> = {
    IPTV: { label: 'XTV - SERVICIO DE TV DIGITAL', icon: '📺', subtitle: 'Líneas físicas XC, cuentas demo, MAG, M3U y revendedores XTV', scope: 'XTV' },
    G3D: { label: 'G3D - TIENDA WEB & CATALOGO', icon: '🛍️', subtitle: 'Catálogo de productos, variantes, stock y moderación store', scope: 'G3D' },
    PEDIDOS: { label: 'G3D - PEDIDOS & DESPACHOS', icon: '📦', subtitle: 'Gestión de compras, órdenes de clientes y cotizaciones de tienda', scope: 'G3D' },
    LOGISTICA: { label: 'G3D - LOGÍSTICA & FLETEROS', icon: '🚚', subtitle: 'Torre de control logística, fleteros, cadetería y rutas', scope: 'G3D' },
    STOCK: { label: 'G3D - INVENTARIO & PROVEEDORES', icon: '🏷️', subtitle: 'Insumos, lista de costos de proveedores y reposición', scope: 'G3D' },
    ADMIN: { label: 'ADMINISTRACIÓN CENTRAL', icon: '🛡️', subtitle: 'Gestión de roles, usuarios, privilegios y accesos maestros', scope: 'ADMIN' },
    FINANZAS_CONSOLIDADAS: { label: 'FINANZAS & COMISIONES', icon: '💰', subtitle: 'Auditoría de caja, comisiones de venta y balances generales', scope: 'ADMIN' },
    SEGURIDAD: { label: 'SEGURIDAD & AUDITORÍA', icon: '🔒', subtitle: 'Tokens de API, llaves de integración y registros del sistema', scope: 'ADMIN' },
    CONFIGURACIONES: { label: 'AJUSTES & PERSONALIZACIÓN', icon: '⚙️', subtitle: 'Identidad, diseño de tienda, WhatsApp y parámetros globales', scope: 'ADMIN' },
    INICIO: { label: 'PANTALLA DE INICIO (DASHBOARD)', icon: '🏠', subtitle: 'Visibilidad de accesos directos y tarjetas del menú', scope: 'ADMIN' },
    UTILIDADES: { label: 'UTILIDADES & HERRAMIENTAS', icon: '🧰', subtitle: 'Simuladores y calculadoras técnicas', scope: 'ADMIN' },
  };

  // 1. CARGAR DATOS REALES DE SUPABASE: seguridad_roles y perfiles_locales
  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      // Cargar Roles desde seguridad_roles
      const { data: dbRoles } = await supabase
        .from('seguridad_roles')
        .select('*')
        .order('nombre', { ascending: true });

      let loadedRoles: SeguridadRol[] = [];
      if (dbRoles && dbRoles.length > 0) {
        loadedRoles = dbRoles.map((r: any) => ({
          id: r.id,
          nombre: r.nombre || r.id,
          rol_padre: r.rol_padre || null,
          permisos: Array.isArray(r.permisos) ? r.permisos : (typeof r.permisos === 'string' ? JSON.parse(r.permisos) : []),
          descripcion: r.descripcion || ''
        }));
      } else {
        loadedRoles = [
          { id: 'REVENDEDOR', nombre: 'Revendedor', rol_padre: null, permisos: ['IPTV.Ver', 'IPTV.Clientes.Ver', 'IPTV.Demos.Crear'] },
          { id: 'VENDEDOR', nombre: 'Vendedor', rol_padre: 'REVENDEDOR', permisos: ['Pedidos.Ver', 'Pedidos.Crear', 'Finanzas.Comisiones.Ver'] },
          { id: 'ADMIN_XTV', nombre: 'Administrador XTV', rol_padre: 'VENDEDOR', permisos: ['IPTV.*', 'Finanzas.*'] },
          { id: 'Administrador', nombre: 'Administrador General', rol_padre: null, permisos: ['Admin.*', '*'] }
        ];
      }
      setRolesList(loadedRoles);

      // Cargar Usuarios desde perfiles_locales
      const { data: dbUsers } = await supabase
        .from('perfiles_locales')
        .select('*')
        .order('created_at', { ascending: true });

      if (dbUsers && dbUsers.length > 0) {
        setUsersList(dbUsers);
      } else if (currentUser) {
        setUsersList([{
          id: currentUser.id || '1',
          nombre: currentUser.nombre || 'Administrador',
          email: currentUser.usuario || currentUser.email || 'admin@admin.com',
          rol: currentUser.rol || 'Administrador',
          permisos_extra: [],
          permisos_denegados: [],
          activo: true
        }]);
      }
    } catch (err: any) {
      console.warn('Error cargando roles o usuarios de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  // Mapa de roles para consulta rápida
  const rolesMap = useMemo(() => {
    const map = new Map<string, SeguridadRol>();
    rolesList.forEach(r => map.set(r.id, r));
    return map;
  }, [rolesList]);

  // Helper recursivo para calcular los permisos heredados del padre
  const getInheritedPermissionsForRole = (roleId: string, visited: Set<string> = new Set()): string[] => {
    if (!roleId || visited.has(roleId)) return [];
    visited.add(roleId);

    const role = rolesMap.get(roleId);
    if (!role) return [];

    if (role.rol_padre) {
      const parentPerms = getInheritedPermissionsForRole(role.rol_padre, visited);
      const parentDirect = rolesMap.get(role.rol_padre)?.permisos || [];
      return Array.from(new Set([...parentPerms, ...parentDirect]));
    }
    return [];
  };

  // Helper para obtener todos los permisos efectivos de un rol (Directos + Heredados)
  const getAllRolePermissions = (roleId: string): { direct: string[]; inherited: string[]; total: string[] } => {
    const role = rolesMap.get(roleId);
    if (!role) return { direct: [], inherited: [], total: [] };

    const direct = role.permisos || [];
    const inherited = getInheritedPermissionsForRole(roleId);
    const total = Array.from(new Set([...direct, ...inherited]));

    return { direct, inherited, total };
  };

  // Helper para verificar si una lista de permisos incluye un permiso específico (soporta comodines como 'Seccion.*' o '*')
  const isPermissionIncluded = (permList: string[], targetPerm: string): boolean => {
    if (!permList || permList.length === 0) return false;
    if (permList.includes('*')) return true;
    if (permList.includes(targetPerm)) return true;

    const parts = targetPerm.split('.');
    if (parts.length >= 2) {
      const wildcard = `${parts[0]}.*`;
      if (permList.includes(wildcard)) return true;
    }
    if (parts.length >= 3) {
      const subWildcard = `${parts[0]}.${parts[1]}.*`;
      if (permList.includes(subWildcard)) return true;
    }
    return false;
  };

  // Al seleccionar un ROL: actualizar estado local
  const handleSelectRole = (roleId: string) => {
    setSelectionType('role');
    setSelectedRoleId(roleId);
    setSelectedUserId(null);

    const role = rolesMap.get(roleId);
    if (role) {
      setRoleDirectPerms(role.permisos || []);
      setSelectedRoleParent(role.rol_padre || '');
    }
  };

  // Al seleccionar un USUARIO: actualizar estado local
  const handleSelectUser = (user: any) => {
    setSelectionType('user');
    setSelectedUserId(user.id);

    const userRole = user.rol || 'VENDEDOR';
    setUserAssignedRole(userRole);
    setUserExtraPerms(Array.isArray(user.permisos_extra) ? user.permisos_extra : []);
    setUserDeniedPerms(Array.isArray(user.permisos_denegados) ? user.permisos_denegados : []);
  };

  // Sincronizar selección inicial
  useEffect(() => {
    if (rolesList.length > 0 && selectionType === 'role' && !selectedRoleId) {
      handleSelectRole(rolesList[0].id);
    }
  }, [rolesList]);

  // Modificar asignación directa de un permiso para el ROL seleccionado
  const handleToggleRoleDirectPermission = (permId: string) => {
    const isDirect = roleDirectPerms.includes(permId);
    if (isDirect) {
      setRoleDirectPerms(prev => prev.filter(p => p !== permId));
    } else {
      setRoleDirectPerms(prev => [...prev, permId]);
    }
  };

  // Cambiar el rol padre del rol actual
  const handleChangeRoleParent = (newParent: string) => {
    if (newParent === selectedRoleId) {
      toast.error('Un rol no puede heredar de sí mismo.');
      return;
    }
    setSelectedRoleParent(newParent);
  };

  // Alternar permiso EXTRA para el usuario seleccionado
  const handleToggleUserExtraPermission = (permId: string) => {
    const hasExtra = userExtraPerms.includes(permId);
    if (hasExtra) {
      setUserExtraPerms(prev => prev.filter(p => p !== permId));
    } else {
      setUserExtraPerms(prev => [...prev, permId]);
      setUserDeniedPerms(prev => prev.filter(p => p !== permId));
    }
  };

  // Alternar permiso DENEGADO (Bloqueo explícito) para el usuario
  const handleToggleUserDeniedPermission = (permId: string) => {
    const hasDenied = userDeniedPerms.includes(permId);
    if (hasDenied) {
      setUserDeniedPerms(prev => prev.filter(p => p !== permId));
    } else {
      setUserDeniedPerms(prev => [...prev, permId]);
      setUserExtraPerms(prev => prev.filter(p => p !== permId));
    }
  };

  // Resetear permisos del usuario a los por defecto de su rol
  const handleResetUserToRoleDefaults = () => {
    setUserExtraPerms([]);
    setUserDeniedPerms([]);
    toast.info('Permisos del usuario restablecidos a los de su rol.');
  };

  // Estado calculado para cada tarjeta de permiso según el sujeto seleccionado
  const getPermissionStatus = (permId: string) => {
    if (selectionType === 'role') {
      const isDirect = roleDirectPerms.includes(permId) || roleDirectPerms.includes('*');
      const inheritedList = getInheritedPermissionsForRole(selectedRoleId);
      const isInherited = isPermissionIncluded(inheritedList, permId);
      const effectiveActive = isDirect || isInherited;

      return {
        effectiveActive,
        isDirect,
        isInherited,
        isExtra: false,
        isDenied: false,
        sourceLabel: isDirect ? 'Directo del Rol' : isInherited ? 'Heredado del Padre' : 'Inactivo'
      };
    } else {
      const isDenied = isPermissionIncluded(userDeniedPerms, permId);
      const isExtra = isPermissionIncluded(userExtraPerms, permId);

      const roleObj = getAllRolePermissions(userAssignedRole);
      const comesFromRole = isPermissionIncluded(roleObj.total, permId);

      const effectiveActive = (comesFromRole || isExtra) && !isDenied;

      return {
        effectiveActive,
        isDirect: false,
        isInherited: comesFromRole && !isDenied && !isExtra,
        isExtra,
        isDenied,
        sourceLabel: isDenied ? 'Bloqueado Explícitamente' : isExtra ? 'Otorgado Extra' : comesFromRole ? 'Por Rol Base' : 'Inactivo'
      };
    }
  };

  // GUARDAR CAMBIOS EN SUPABASE
  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      if (selectionType === 'role') {
        const { error } = await supabase
          .from('seguridad_roles')
          .upsert({
            id: selectedRoleId,
            nombre: rolesMap.get(selectedRoleId)?.nombre || selectedRoleId,
            rol_padre: selectedRoleParent || null,
            permisos: roleDirectPerms
          });

        if (error) throw error;

        setRolesList(prev => prev.map(r => r.id === selectedRoleId ? {
          ...r,
          rol_padre: selectedRoleParent || null,
          permisos: roleDirectPerms
        } : r));

        toast.success(`Rol "${rolesMap.get(selectedRoleId)?.nombre || selectedRoleId}" guardado correctamente.`);
      } else if (selectionType === 'user' && selectedUserId) {
        const { error } = await supabase
          .from('perfiles_locales')
          .update({
            rol: userAssignedRole,
            permisos_extra: userExtraPerms,
            permisos_denegados: userDeniedPerms
          })
          .eq('id', selectedUserId);

        if (error) throw error;

        setUsersList(prev => prev.map(u => u.id === selectedUserId ? {
          ...u,
          rol: userAssignedRole,
          permisos_extra: userExtraPerms,
          permisos_denegados: userDeniedPerms
        } : u));

        toast.success('Permisos y rol del usuario guardados correctamente.');
      }

      await onDataChanged();
    } catch (err: any) {
      console.error('Error al guardar permisos:', err);
      toast.error('Error al guardar en Supabase: ' + (err.message || 'Error'));
    } finally {
      setSavingPermissions(false);
    }
  };

  // Crear Nuevo Rol
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error('Ingresa un nombre para el rol');
      return;
    }

    const newId = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    if (rolesList.some(r => r.id === newId)) {
      toast.error('Ya existe un rol con este identificador.');
      return;
    }

    try {
      const newRole: SeguridadRol = {
        id: newId,
        nombre: newRoleName.trim(),
        rol_padre: newRoleParent || null,
        permisos: [],
        descripcion: newRoleDesc.trim()
      };

      const { error } = await supabase
        .from('seguridad_roles')
        .insert({
          id: newRole.id,
          nombre: newRole.nombre,
          rol_padre: newRole.rol_padre,
          permisos: newRole.permisos,
          descripcion: newRole.descripcion
        });

      if (error) throw error;

      setRolesList(prev => [...prev, newRole]);
      setSelectedRoleId(newRole.id);
      setSelectionType('role');
      setRoleDirectPerms([]);
      setSelectedRoleParent(newRole.rol_padre || '');
      setShowCreateRoleModal(false);
      setNewRoleName('');
      setNewRoleParent('');
      setNewRoleDesc('');
      toast.success(`Rol "${newRole.nombre}" creado exitosamente.`);
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al crear rol: ' + (err.message || 'Error'));
    }
  };

  // Eliminar Rol
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const { error } = await supabase
        .from('seguridad_roles')
        .delete()
        .eq('id', roleToDelete);

      if (error) throw error;

      setRolesList(prev => prev.filter(r => r.id !== roleToDelete));
      toast.success(`Rol "${roleToDelete}" eliminado.`);
      setRoleToDelete(null);
      if (rolesList.length > 0) {
        setSelectedRoleId(rolesList[0].id);
      }
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al eliminar rol: ' + (err.message || 'Error'));
    }
  };

  // Bloquear / Desbloquear Usuario
  const handleToggleUserBlock = async (user: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyActive = user.activo !== false && user.bloqueado !== true && user.estado !== 'bloqueado';
    const newActiveState = !isCurrentlyActive;
    const newEstado = newActiveState ? 'activo' : 'bloqueado';

    try {
      const { error } = await supabase
        .from('perfiles_locales')
        .update({ 
          activo: newActiveState,
          bloqueado: !newActiveState,
          estado: newEstado 
        })
        .eq('id', user.id);

      if (error) throw error;

      setUsersList(prev => prev.map(u => u.id === user.id ? { 
        ...u, 
        activo: newActiveState, 
        bloqueado: !newActiveState, 
        estado: newEstado 
      } : u));

      if (newActiveState) {
        toast.success(`Usuario "${user.nombre || user.email}" activado.`);
      } else {
        toast.warning(`Usuario "${user.nombre || user.email}" bloqueado.`);
      }
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al cambiar estado: ' + (err.message || 'Error'));
    }
  };

  // Eliminar Usuario de perfiles_locales
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const { error } = await supabase
        .from('perfiles_locales')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      setUsersList(prev => prev.filter(u => u.id !== userToDelete.id));
      if (selectedUserId === userToDelete.id) {
        setSelectedUserId(null);
        setSelectionType('role');
      }

      toast.success(`Usuario "${userToDelete.nombre || userToDelete.email}" eliminado.`);
      setUserToDelete(null);
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al eliminar usuario: ' + (err.message || 'Error'));
    } finally {
      setDeletingUser(false);
    }
  };

  // Crear Nuevo Usuario en perfiles_locales
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      toast.error('Ingresa el correo o nombre de usuario');
      return;
    }

    setCreatingUser(true);
    try {
      const assigned = newUserRole || rolesList[0]?.id || 'VENDEDOR';
      const newUser = {
        id: `user-${Date.now()}`,
        nombre: newUserName.trim() || newUserEmail.split('@')[0],
        email: newUserEmail.trim().toLowerCase(),
        password_hash: newUserPass.trim() || '123456',
        rol: assigned,
        permisos_extra: [],
        permisos_denegados: [],
        activo: true,
        estado: 'activo',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('perfiles_locales')
        .insert(newUser);

      if (error) throw error;

      setUsersList(prev => [...prev, newUser]);
      handleSelectUser(newUser);
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      toast.success(`Usuario "${newUser.nombre}" creado exitosamente.`);
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al crear usuario: ' + (err.message || 'Error'));
    } finally {
      setCreatingUser(false);
    }
  };

  // Guardar Personalización de Título y Descripción de Permiso (Regla #11)
  const handleSaveCustomMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermId) return;

    const updated = {
      ...customMetadata,
      [editingPermId]: {
        title: customTitle.trim(),
        description: customDesc.trim()
      }
    };

    setCustomMetadata(updated);
    localStorage.setItem('g3d_custom_permissions_desc', JSON.stringify(updated));
    setEditingPermId(null);
    toast.success('¡Descripción y título del permiso guardados!');
  };

  const handleResetMetadata = (permId: string) => {
    const updated = { ...customMetadata };
    delete updated[permId];
    setCustomMetadata(updated);
    localStorage.setItem('g3d_custom_permissions_desc', JSON.stringify(updated));
    setEditingPermId(null);
    toast.info('Permiso restablecido a sus valores por defecto.');
  };

  // Filtrado de facciones y permisos
  const filteredFactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: Array<{
      key: string;
      label: string;
      icon: string;
      subtitle: string;
      scope: 'XTV' | 'G3D' | 'ADMIN';
      items: Array<{ id: string; defaultTitle: string; defaultDesc: string }>;
    }> = [];

    Object.entries(PERMISSIONS).forEach(([factionKey, groupObj]) => {
      const config = FACTIONS_CONFIG[factionKey] || {
        label: factionKey,
        icon: '📁',
        subtitle: 'Módulo de permisos del sistema',
        scope: 'ADMIN' as const
      };

      if (activeFactionTab !== 'ALL' && config.scope !== activeFactionTab) {
        return;
      }

      const rawItems = Object.entries(groupObj).map(([k, v]: [string, any]) => ({
        id: v.id,
        defaultTitle: v.title || k.replace(/_/g, ' '),
        defaultDesc: v.description || ''
      }));

      const matchingItems = rawItems.filter(item => {
        if (!q) return true;
        const custom = customMetadata[item.id] || {};
        const title = (custom.title || item.defaultTitle).toLowerCase();
        const desc = (custom.description || item.defaultDesc).toLowerCase();
        const id = item.id.toLowerCase();
        return title.includes(q) || desc.includes(q) || id.includes(q) || config.label.toLowerCase().includes(q);
      });

      if (matchingItems.length > 0) {
        result.push({
          key: factionKey,
          label: config.label,
          icon: config.icon,
          subtitle: config.subtitle,
          scope: config.scope,
          items: matchingItems
        });
      }
    });

    return result;
  }, [searchQuery, customMetadata, activeFactionTab]);

  // Sujeto activo para la barra superior
  const selectedSubjectDisplay = useMemo(() => {
    if (selectionType === 'user') {
      const user = usersList.find(u => u.id === selectedUserId);
      const isBlocked = user && (user.activo === false || user.bloqueado === true || user.estado === 'bloqueado');
      const roleObj = rolesMap.get(userAssignedRole);
      return {
        title: user ? user.nombre : 'Usuario',
        subtitle: user ? `@${user.email}` : '',
        roleName: roleObj?.nombre || userAssignedRole,
        badge: isBlocked ? 'USUARIO BLOQUEADO' : 'CONFIGURACIÓN DE USUARIO',
        isBlocked
      };
    } else {
      const roleObj = rolesMap.get(selectedRoleId);
      const count = usersList.filter(u => u.rol === selectedRoleId).length;
      const parentObj = roleObj?.rol_padre ? rolesMap.get(roleObj.rol_padre) : null;
      return {
        title: roleObj?.nombre || selectedRoleId,
        subtitle: `${count} usuario(s) vinculados`,
        roleName: parentObj ? `Hereda de: ${parentObj.nombre}` : 'Rol Raíz (Sin Herencia)',
        badge: 'ROL MAESTRO',
        isBlocked: false
      };
    }
  }, [selectionType, selectedRoleId, selectedUserId, usersList, rolesMap, userAssignedRole]);

  // Conteo total de permisos activos para el sujeto
  const totalActivePermissionsCount = useMemo(() => {
    let active = 0;
    filteredFactions.forEach(f => {
      f.items.forEach(i => {
        if (getPermissionStatus(i.id).effectiveActive) {
          active++;
        }
      });
    });
    return active;
  }, [filteredFactions, selectionType, selectedRoleId, selectedUserId, roleDirectPerms, userExtraPerms, userDeniedPerms, userAssignedRole]);

  return (
    <div className="space-y-6">
      
      {/* 1. ENCABEZADO Y CONTROLES PRINCIPALES (100% HD - MODO CLARO Y OSCURO) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-2xl transition-colors">
        
        {/* Título & Icono */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-md text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Gestión de Permisos & Seguridad RBAC
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control granular de roles maestros con herencia y excepciones directas por usuario para XTV y G3D Store.
            </p>
          </div>
        </div>

        {/* Buscador & Guardado */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar permiso o módulo..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={savingPermissions}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            {savingPermissions ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar en Supabase
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE ALCANCE / FILTRO POR UNIDAD DE NEGOCIO (XTV vs G3D vs ADMIN) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFactionTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeFactionTab === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={14} />
          <span>Todos los Módulos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFactionTab('XTV')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeFactionTab === 'XTV'
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/20'
              : 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/40 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
          }`}
        >
          <Tv size={14} />
          <span>XTV Digital TV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFactionTab('G3D')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeFactionTab === 'G3D'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <ShoppingBag size={14} />
          <span>G3D Tienda Web</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFactionTab('ADMIN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeFactionTab === 'ADMIN'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
          }`}
        >
          <Shield size={14} />
          <span>Administración Central</span>
        </button>
      </div>

      {/* 3. CONTENEDOR PRINCIPAL: SIDEBAR + PANEL DE PERMISOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col md:flex-row min-h-[750px] transition-colors">
        
        {/* SIDEBAR LATERAL: ROLES Y USUARIOS */}
        <div className="w-full md:w-80 shrink-0 bg-slate-50/80 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-5 overflow-y-auto max-h-[850px]">
          
          {/* SECCIÓN ROLES MAESTROS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Roles Maestros</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-mono font-bold">
                  {rolesList.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewRoleParent(rolesList[0]?.id || '');
                  setShowCreateRoleModal(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 rounded-lg transition-all cursor-pointer"
                title="Crear nuevo rol maestro"
              >
                <Plus className="w-3 h-3" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {rolesList.map((role) => {
                const isSelected = selectionType === 'role' && selectedRoleId === role.id;
                const parent = role.rol_padre ? rolesMap.get(role.rol_padre) : null;
                const userCount = usersList.filter(u => u.rol === role.id).length;

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`group w-full p-3 rounded-2xl text-xs transition-all flex flex-col gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Shield className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                        <span className="truncate">{role.nombre}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}>
                          {userCount} {userCount === 1 ? 'usr' : 'usrs'}
                        </span>

                        {role.id !== 'Administrador' && role.id !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToDelete(role.id);
                            }}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 hover:text-rose-600 ${
                              isSelected ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                            title="Eliminar este Rol"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] flex items-center gap-1">
                      {parent ? (
                        <span className={`flex items-center gap-1 font-mono ${isSelected ? 'text-indigo-200' : 'text-amber-600 dark:text-amber-400/90'}`}>
                          <GitBranch className="w-3 h-3" />
                          Hereda de: {parent.nombre}
                        </span>
                      ) : (
                        <span className={`font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                          Rol Raíz (Sin Herencia)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN USUARIOS DEL SISTEMA */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Usuarios</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-mono font-bold">
                  {usersList.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewUserRole(rolesList[0]?.id || 'VENDEDOR');
                  setShowCreateUserModal(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 rounded-lg transition-all cursor-pointer"
                title="Crear nuevo usuario"
              >
                <UserPlus className="w-3 h-3" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
              {usersList.map((user) => {
                const isSelected = selectionType === 'user' && selectedUserId === user.id;
                const isBlocked = user.activo === false || user.bloqueado === true || user.estado === 'bloqueado';
                const roleObj = rolesMap.get(user.rol);

                const extraCount = Array.isArray(user.permisos_extra) ? user.permisos_extra.length : 0;
                const deniedCount = Array.isArray(user.permisos_denegados) ? user.permisos_denegados.length : 0;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`group w-full p-3 rounded-2xl text-xs transition-all flex flex-col gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : isBlocked
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className={`size-2 rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="truncate font-semibold">{user.nombre || user.email}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Botón Bloquear / Desbloquear */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleUserBlock(user, e)}
                          className={`p-1 rounded-md transition-colors ${
                            isBlocked 
                              ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/40' 
                              : isSelected ? 'text-indigo-200 hover:bg-indigo-700' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                          title={isBlocked ? "Desbloquear Usuario" : "Bloquear Acceso al Usuario"}
                        >
                          {isBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(user);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 hover:text-rose-600 ${
                            isSelected ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-mono truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        Rol: {roleObj?.nombre || user.rol || 'Sin rol'}
                      </span>

                      <div className="flex items-center gap-1">
                        {extraCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                            +{extraCount}
                          </span>
                        )}
                        {deniedCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-mono">
                            -{deniedCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: PERMISOS ORGANIZADOS POR FACCIONES */}
        <div className="flex-1 p-5 flex flex-col gap-6 overflow-y-auto max-h-[850px]">
          
          {/* BARRA DE INFORMACIÓN DEL SUJETO SELECCIONADO */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${selectionType === 'role' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'}`}>
                {selectionType === 'role' ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    {selectedSubjectDisplay.badge}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedSubjectDisplay.title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedSubjectDisplay.subtitle} • <span className="text-indigo-600 dark:text-indigo-400 font-medium">{selectedSubjectDisplay.roleName}</span>
                </p>
              </div>
            </div>

            {/* Selector de Rol Padre o Rol de Usuario */}
            <div className="flex items-center gap-2">
              {selectionType === 'role' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Hereda de:</span>
                  <select
                    value={selectedRoleParent}
                    onChange={(e) => handleChangeRoleParent(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">(Ninguno - Rol Raíz)</option>
                    {rolesList.filter(r => r.id !== selectedRoleId).map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Rol Asignado:</span>
                  <select
                    value={userAssignedRole}
                    onChange={(e) => setUserAssignedRole(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleResetUserToRoleDefaults}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    title="Restablecer a permisos por defecto del rol"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold rounded-xl shrink-0">
                {totalActivePermissionsCount} activos
              </div>
            </div>
          </div>

          {/* LISTA DE FACCIONES EN ACORDEÓN */}
          <div className="space-y-4">
            {filteredFactions.map(faction => {
              const isExpanded = expandedFactions[faction.key] ?? false;
              const activeInFaction = faction.items.filter(i => getPermissionStatus(i.id).effectiveActive).length;

              return (
                <div 
                  key={faction.key} 
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm transition-colors"
                >
                  {/* CABECERA DE LA FACCIÓN */}
                  <div 
                    onClick={() => setExpandedFactions(prev => ({ ...prev, [faction.key]: !prev[faction.key] }))}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{faction.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black tracking-wide text-slate-900 dark:text-white uppercase">
                            {faction.label}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {activeInFaction} / {faction.items.length} activos
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {faction.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* CONTENIDO DESPLEGABLE DE PERMISOS */}
                  {isExpanded && (
                    <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800">
                      {faction.items.map(item => {
                        const status = getPermissionStatus(item.id);
                        const custom = customMetadata[item.id] || {};
                        const displayTitle = custom.title || item.defaultTitle;
                        const displayDesc = custom.description || item.defaultDesc;

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                              status.effectiveActive
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                                : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/60 opacity-80'
                            }`}
                          >
                            {/* Cabecera del Permiso con Lápiz para Admin */}
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                  {displayTitle}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPermId(item.id);
                                    setCustomTitle(displayTitle);
                                    setCustomDesc(displayDesc);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                  title="Editar Título y Explicación del Permiso (Regla #11)"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {displayDesc}
                              </p>
                            </div>

                            {/* Badge de Código y Switch Toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[130px]" title={item.id}>
                                {item.id}
                              </span>

                              {/* Switch para Rol vs Acciones para Usuario */}
                              {selectionType === 'role' ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleDirectPermission(item.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    status.isDirect
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : status.isInherited
                                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                                  }`}
                                >
                                  {status.isDirect ? 'Directo' : status.isInherited ? 'Heredado' : 'Inactivo'}
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserExtraPermission(item.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      status.isExtra 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                                    }`}
                                    title="Otorgar como permiso Extra"
                                  >
                                    +Extra
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserDeniedPermission(item.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      status.isDenied 
                                        ? 'bg-rose-600 text-white' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100'
                                    }`}
                                    title="Bloquear permiso para este usuario"
                                  >
                                    -Bloquear
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: EDITAR TÍTULO Y DESCRIPCIÓN DEL PERMISO (REGLA DE ORO #11) */}
      {editingPermId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Personalizar Permiso
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {editingPermId}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPermId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Legible
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Funcional
                </label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleResetMetadata(editingPermId)}
                  className="text-xs text-slate-400 hover:text-rose-500"
                >
                  Restablecer
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPermId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVO USUARIO */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
                Nuevo Usuario
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email / Usuario</label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@g3d.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="Clave inicial"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rol Inicial</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md"
                >
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVO ROL */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                Nuevo Rol Maestro
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Rol</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ej. Soporte Técnico XTV"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Heredar Permisos De</label>
                <select
                  value={newRoleParent}
                  onChange={(e) => setNewRoleParent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="">(Sin herencia - Rol Raíz)</option>
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md"
                >
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE USUARIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle size={24} />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ¿Eliminar Usuario?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Se eliminará permanentemente al usuario <strong className="text-slate-900 dark:text-white">{userToDelete.nombre || userToDelete.email}</strong> del sistema.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md"
              >
                {deletingUser ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE ROL */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle size={24} />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ¿Eliminar Rol Maestro?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Se eliminará el rol <strong className="text-slate-900 dark:text-white">{roleToDelete}</strong>. Los usuarios asignados a este rol deberán ser reasignados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
