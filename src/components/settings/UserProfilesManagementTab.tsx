import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, User, Shield, ShieldCheck, Key, Search, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, 
  X, Check, Lock, Unlock, ChevronRight, ChevronDown, ChevronUp, Layers, Save,
  FolderOpen, Filter, ArrowLeft, ArrowRight, Sparkles, HelpCircle, UserPlus, Ban, UserX,
  Tv, ShoppingBag, Settings, RotateCcw, Camera, Phone, Mail, Globe, Landmark,
  Receipt, MessageSquare, Percent, DollarSign, ExternalLink, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { compressAndProcessImage } from '../../utils/imageCompressor';

interface UserProfilesManagementTabProps {
  currentUser: any;
  onDataChanged: () => Promise<void>;
  onNavigateToPermissions?: (userId: string) => void;
}

interface SeguridadRol {
  id: string;
  nombre: string;
  rol_padre: string | null;
  permisos: string[];
  descripcion?: string;
}

export function UserProfilesManagementTab({ 
  currentUser, 
  onDataChanged,
  onNavigateToPermissions 
}: UserProfilesManagementTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lista de usuarios y roles
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<SeguridadRol[]>([]);
  
  // Filtros y búsquedas
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Usuario seleccionado
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Sub-pestaña activa de la ficha (Personal, Negocio G3D, Negocio XTV)
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'g3d' | 'xtv'>('personal');

  // Inputs para imágenes locales (Regla de Oro #21)
  const personalAvatarRef = useRef<HTMLInputElement>(null);
  const g3dLogoRef = useRef<HTMLInputElement>(null);
  const xtvLogoRef = useRef<HTMLInputElement>(null);

  // Estados del Formulario del Usuario Seleccionado
  // 1. Roles Múltiples Asignados
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  
  // 2. Perfil Personal
  const [formPersonal, setFormPersonal] = useState({
    nombre: '',
    email: '',
    telefono: '',
    dni_cuit: '',
    direccion: '',
    avatar_url: '',
    isBlocked: false,
    newPassword: '',
    confirmPassword: '',
    alias: '',
    cbu: '',
    banco: '',
    titular: ''
  });

  // 3. Perfil Negocio G3D (Tienda Web)
  const [formG3d, setFormG3d] = useState({
    business_name: '',
    cuit_tax_id: '',
    tax_condition: 'Responsable Inscripto',
    address: '',
    whatsapp: '',
    email: '',
    logo_url: '',
    commission_rate: 0,
    price_list_assigned: 'Minorista',
    receipt_header: 'G3D - Impresiones 3D & Grabados Láser',
    receipt_footer: '¡Gracias por confiar en G3D!',
    payment_alias: '',
    payment_cbu: '',
    payment_bank: '',
    shipping_branch: ''
  });

  // 4. Perfil Negocio XTV (TV Digital)
  const [formXtv, setFormXtv] = useState({
    reseller_alias: '',
    support_whatsapp: '',
    support_email: '',
    telegram_channel: '',
    official_domain: 'xtv.ar',
    logo_url: '',
    credits_balance: 0,
    welcome_message: '🔥 ¡Hola {usuario}! Tu servicio XTV Digital está activo.\n🔑 Clave: {clave}\n📺 Lista M3U: {m3u}\n¡Disfruta del mejor contenido!',
    payment_alias: '',
    payment_cbu: '',
    payment_bank: '',
    reseller_notes: ''
  });

  // Modales
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserSelectedRoles, setNewUserSelectedRoles] = useState<string[]>(['VENDEDOR']);
  const [creatingUser, setCreatingUser] = useState(false);

  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Cargar Usuarios y Roles desde Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Roles
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
          { id: 'Administrador', nombre: 'Administrador General', rol_padre: null, permisos: ['Admin.*', '*'] },
          { id: 'VENDEDOR', nombre: 'Vendedor G3D', rol_padre: 'REVENDEDOR', permisos: ['Pedidos.*', 'Stock.VistaGeneral.Ver'] },
          { id: 'REVENDEDOR', nombre: 'Revendedor XTV', rol_padre: null, permisos: ['Iptv.*'] },
          { id: 'LOGISTICA', nombre: 'Operador Logística', rol_padre: null, permisos: ['Logistica.*'] }
        ];
      }
      setRolesList(loadedRoles);

      // 2. Usuarios
      const { data: dbUsers, error } = await supabase
        .from('perfiles_locales')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (dbUsers && dbUsers.length > 0) {
        setUsersList(dbUsers);
        // Si no hay usuario seleccionado, seleccionar el primero
        if (!selectedUserId) {
          loadUserDataIntoForm(dbUsers[0]);
        } else {
          const current = dbUsers.find(u => u.id === selectedUserId);
          if (current) {
            loadUserDataIntoForm(current);
          }
        }
      }
    } catch (err: any) {
      console.warn('Error cargando datos de perfiles_locales:', err);
      toast.error('Error al sincronizar usuarios de Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cargar datos de un usuario en el formulario local
  const loadUserDataIntoForm = (user: any) => {
    setSelectedUserId(user.id);

    // Multi-roles
    let roles: string[] = [];
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      roles = user.roles;
    } else if (typeof user.roles === 'string' && user.roles.startsWith('[')) {
      try {
        roles = JSON.parse(user.roles);
      } catch {
        roles = [user.rol || 'VENDEDOR'];
      }
    } else if (user.rol) {
      roles = [user.rol];
    } else {
      roles = ['VENDEDOR'];
    }
    setSelectedUserRoles(roles);

    // Perfil Personal
    const isBlocked = user.activo === false || user.bloqueado === true || user.estado === 'bloqueado';
    const datosBancarios = user.negocio_datos_bancarios || {};
    const datosAdicionales = user.datos_adicionales || {};

    setFormPersonal({
      nombre: user.nombre || '',
      email: user.email || user.usuario || '',
      telefono: user.telefono || '',
      dni_cuit: datosAdicionales.dni_cuit || user.cuit || '',
      direccion: datosAdicionales.direccion || user.direccion || '',
      avatar_url: user.avatar_url || user.foto_perfil || '',
      isBlocked,
      newPassword: '',
      confirmPassword: '',
      alias: datosBancarios.alias || '',
      cbu: datosBancarios.cbu || '',
      banco: datosBancarios.banco || '',
      titular: datosBancarios.titular || ''
    });

    // Perfil G3D
    const rawG3d = user.perfil_g3d || datosAdicionales.perfil_g3d || {};
    setFormG3d({
      business_name: rawG3d.business_name || user.nombre_negocio || '',
      cuit_tax_id: rawG3d.cuit_tax_id || '',
      tax_condition: rawG3d.tax_condition || 'Responsable Inscripto',
      address: rawG3d.address || '',
      whatsapp: rawG3d.whatsapp || '',
      email: rawG3d.email || '',
      logo_url: rawG3d.logo_url || '',
      commission_rate: Number(rawG3d.commission_rate) || 0,
      price_list_assigned: rawG3d.price_list_assigned || 'Minorista',
      receipt_header: rawG3d.receipt_header || 'G3D - Impresiones 3D & Grabados Láser',
      receipt_footer: rawG3d.receipt_footer || '¡Gracias por confiar en G3D!',
      payment_alias: rawG3d.payment_alias || '',
      payment_cbu: rawG3d.payment_cbu || '',
      payment_bank: rawG3d.payment_bank || '',
      shipping_branch: rawG3d.shipping_branch || ''
    });

    // Perfil XTV
    const rawXtv = user.perfil_xtv || datosAdicionales.perfil_xtv || {};
    setFormXtv({
      reseller_alias: rawXtv.reseller_alias || rawXtv.brand_name || '',
      support_whatsapp: rawXtv.support_whatsapp || '',
      support_email: rawXtv.support_email || '',
      telegram_channel: rawXtv.telegram_channel || '',
      official_domain: rawXtv.official_domain || 'xtv.ar',
      logo_url: rawXtv.logo_url || '',
      credits_balance: Number(rawXtv.credits_balance) || 0,
      welcome_message: rawXtv.welcome_message || '🔥 ¡Hola {usuario}! Tu servicio XTV Digital está activo.\n🔑 Clave: {clave}\n📺 Lista M3U: {m3u}\n¡Disfruta del mejor contenido!',
      payment_alias: rawXtv.payment_alias || '',
      payment_cbu: rawXtv.payment_cbu || '',
      payment_bank: rawXtv.payment_bank || '',
      reseller_notes: rawXtv.reseller_notes || ''
    });
  };

  // Toggle de un rol en la lista multi-rol del usuario seleccionado
  const handleToggleUserRole = (roleId: string) => {
    setSelectedUserRoles(prev => {
      const exists = prev.includes(roleId);
      if (exists) {
        if (prev.length === 1) {
          toast.warning('El usuario debe conservar al menos un rol asignado.');
          return prev;
        }
        return prev.filter(r => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Subida interactiva de imágenes locales (Regla #21)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    onSuccess: (base64: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`Procesando ${label}...`);
      const base64 = await compressAndProcessImage(file, 600, 600, 0.88);
      onSuccess(base64);
      toast.dismiss();
      toast.success(`${label} cargado con éxito`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error al procesar imagen: ${err.message || err}`);
    }
  };

  // Guardar Cambios de la Ficha Completa del Usuario Seleccionado
  const handleSaveUserProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserId) {
      toast.error('Selecciona un usuario para guardar.');
      return;
    }

    if (formPersonal.newPassword) {
      if (formPersonal.newPassword.length < 6) {
        toast.error('La contraseña debe tener un mínimo de 6 caracteres.');
        return;
      }
      if (formPersonal.newPassword !== formPersonal.confirmPassword) {
        toast.error('Las contraseñas no coinciden.');
        return;
      }
    }

    setSaving(true);
    try {
      const primaryRole = selectedUserRoles[0] || 'VENDEDOR';
      const isBlocked = formPersonal.isBlocked;

      const updatePayload: any = {
        nombre: formPersonal.nombre.trim(),
        telefono: formPersonal.telefono.trim(),
        avatar_url: formPersonal.avatar_url,
        rol: primaryRole,
        roles: selectedUserRoles,
        activo: !isBlocked,
        bloqueado: isBlocked,
        estado: isBlocked ? 'bloqueado' : 'activo',
        negocio_datos_bancarios: {
          alias: formPersonal.alias.trim(),
          cbu: formPersonal.cbu.trim(),
          banco: formPersonal.banco.trim(),
          titular: formPersonal.titular.trim(),
        },
        perfil_g3d: formG3d,
        perfil_xtv: formXtv,
        datos_adicionales: {
          dni_cuit: formPersonal.dni_cuit.trim(),
          direccion: formPersonal.direccion.trim(),
          roles: selectedUserRoles,
          perfil_g3d: formG3d,
          perfil_xtv: formXtv,
        }
      };

      if (formPersonal.newPassword) {
        updatePayload.password_hash = formPersonal.newPassword.trim();
      }

      const { error } = await supabase
        .from('perfiles_locales')
        .update(updatePayload)
        .eq('id', selectedUserId);

      if (error) throw error;

      // Actualizar lista local de usuarios
      setUsersList(prev => prev.map(u => u.id === selectedUserId ? {
        ...u,
        ...updatePayload
      } : u));

      setFormPersonal(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      toast.success('Ficha 360° del usuario guardada con éxito.');
      await onDataChanged();
    } catch (err: any) {
      console.error('Error al guardar usuario:', err);
      toast.error('Error al guardar en Supabase: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  // Bloqueo / Desbloqueo rápido de un usuario
  const handleToggleUserBlock = async (user: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentBlocked = user.activo === false || user.bloqueado === true || user.estado === 'bloqueado';
    const newBlocked = !currentBlocked;

    try {
      const { error } = await supabase
        .from('perfiles_locales')
        .update({
          activo: !newBlocked,
          bloqueado: newBlocked,
          estado: newBlocked ? 'bloqueado' : 'activo'
        })
        .eq('id', user.id);

      if (error) throw error;

      setUsersList(prev => prev.map(u => u.id === user.id ? {
        ...u,
        activo: !newBlocked,
        bloqueado: newBlocked,
        estado: newBlocked ? 'bloqueado' : 'activo'
      } : u));

      if (selectedUserId === user.id) {
        setFormPersonal(prev => ({ ...prev, isBlocked: newBlocked }));
      }

      toast.success(newBlocked ? `Usuario "${user.nombre || user.email}" bloqueado.` : `Usuario "${user.nombre || user.email}" desbloqueado.`);
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al cambiar estado del usuario: ' + err.message);
    }
  };

  // Crear Nuevo Usuario
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) {
      toast.error('Completa los campos obligatorios (Nombre, Email y Clave).');
      return;
    }

    if (newUserPass.length < 6) {
      toast.error('La clave debe tener al menos 6 caracteres.');
      return;
    }

    setCreatingUser(true);
    try {
      const emailLower = newUserEmail.trim().toLowerCase();
      const primaryRole = newUserSelectedRoles[0] || 'VENDEDOR';

      const newUserObj = {
        nombre: newUserName.trim(),
        email: emailLower,
        usuario: emailLower,
        password_hash: newUserPass.trim(),
        rol: primaryRole,
        roles: newUserSelectedRoles,
        activo: true,
        bloqueado: false,
        estado: 'activo',
        permisos_extra: [],
        permisos_denegados: [],
        perfil_g3d: {},
        perfil_xtv: {},
        negocio_datos_bancarios: {},
        datos_adicionales: {
          roles: newUserSelectedRoles
        }
      };

      const { data, error } = await supabase
        .from('perfiles_locales')
        .insert(newUserObj)
        .select()
        .single();

      if (error) throw error;

      setUsersList(prev => [...prev, data]);
      loadUserDataIntoForm(data);
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      setNewUserSelectedRoles(['VENDEDOR']);
      toast.success(`Usuario "${data.nombre}" creado exitosamente.`);
      await onDataChanged();
    } catch (err: any) {
      console.error('Error al crear usuario:', err);
      toast.error('Error al crear usuario: ' + (err.message || 'Verifica la conexión'));
    } finally {
      setCreatingUser(false);
    }
  };

  // Eliminar Usuario
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const { error } = await supabase
        .from('perfiles_locales')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      const remaining = usersList.filter(u => u.id !== userToDelete.id);
      setUsersList(remaining);
      if (selectedUserId === userToDelete.id && remaining.length > 0) {
        loadUserDataIntoForm(remaining[0]);
      } else if (remaining.length === 0) {
        setSelectedUserId(null);
      }

      toast.success(`Usuario "${userToDelete.nombre || userToDelete.email}" eliminado.`);
      setUserToDelete(null);
      await onDataChanged();
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  // Filtrar lista de usuarios
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || 
        (u.nombre && u.nombre.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.telefono && u.telefono.toLowerCase().includes(q)) ||
        (u.rol && u.rol.toLowerCase().includes(q));

      const isBlocked = u.activo === false || u.bloqueado === true || u.estado === 'bloqueado';
      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && !isBlocked) || 
        (statusFilter === 'BLOCKED' && isBlocked);

      const userRolesArr = Array.isArray(u.roles) ? u.roles : [u.rol];
      const matchRole = roleFilter === 'ALL' || userRolesArr.includes(roleFilter);

      return matchQuery && matchStatus && matchRole;
    });
  }, [usersList, searchQuery, statusFilter, roleFilter]);

  const selectedUser = useMemo(() => {
    return usersList.find(u => u.id === selectedUserId) || null;
  }, [usersList, selectedUserId]);

  return (
    <div className="space-y-6">
      
      {/* 1. ENCABEZADO Y CONTROLES PRINCIPALES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-md text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Gestión Integral de Usuarios y Perfiles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administración 360° de identidades personales, negocios G3D, cuentas XTV y asignación de múltiples roles.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateUserModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>

          <button
            type="button"
            onClick={() => handleSaveUserProfile()}
            disabled={saving || !selectedUserId}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Ficha
          </button>
        </div>
      </div>

      {/* 2. LAYOUT PRINCIPAL: SIDEBAR DE USUARIOS + FICHA 360° */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col lg:flex-row min-h-[750px] transition-colors">
        
        {/* COLUMNA IZQUIERDA: LISTA Y BUSCADOR DE USUARIOS */}
        <div className="w-full lg:w-80 shrink-0 bg-slate-50/80 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4">
          
          {/* Buscador */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
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

          {/* Filtros de Estado */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Todos ({usersList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('BLOCKED')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'BLOCKED'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Bloqueados
            </button>
          </div>

          {/* Lista de Usuarios */}
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No se encontraron usuarios.
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserId === user.id;
                const isBlocked = user.activo === false || user.bloqueado === true || user.estado === 'bloqueado';
                const userRolesArr = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.rol || 'VENDEDOR'];

                return (
                  <div
                    key={user.id}
                    onClick={() => loadUserDataIntoForm(user)}
                    className={`group w-full p-3 rounded-2xl text-xs transition-all flex flex-col gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : isBlocked
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-600 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        {/* Avatar o Iniciales */}
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10">
                          {user.avatar_url || user.foto_perfil ? (
                            <img src={user.avatar_url || user.foto_perfil} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300">
                              {(user.nombre || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="truncate">
                          <p className="font-bold truncate leading-tight">{user.nombre || user.email}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Controles Rápidos */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleUserBlock(user, e)}
                          className={`p-1 rounded-md transition-colors ${
                            isBlocked 
                              ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/40' 
                              : isSelected ? 'text-indigo-200 hover:bg-indigo-700' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                          title={isBlocked ? "Desbloquear" : "Bloquear"}
                        >
                          {isBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(user);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 hover:text-rose-600 ${
                            isSelected ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Chips de Roles Asignados */}
                    <div className="flex flex-wrap gap-1 items-center">
                      {userRolesArr.map((rId: string) => {
                        const rName = rolesList.find(r => r.id === rId)?.nombre || rId;
                        return (
                          <span
                            key={rId}
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                              isSelected
                                ? 'bg-indigo-700/60 text-white border border-indigo-400/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {rName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: FICHA 360° DEL USUARIO SELECCIONADO */}
        <div className="flex-1 p-5 flex flex-col gap-6 overflow-y-auto max-h-[850px]">
          {selectedUser ? (
            <div className="space-y-6">
              
              {/* CABECERA DEL USUARIO SELECCIONADO */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar con botón de edición */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center shadow-md">
                      {formPersonal.avatar_url ? (
                        <img src={formPersonal.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => personalAvatarRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow border border-indigo-400 transition-transform hover:scale-110 cursor-pointer"
                      title="Cambiar Foto"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={personalAvatarRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, (base64) => setFormPersonal(p => ({ ...p, avatar_url: base64 })), 'Foto de Perfil')}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {formPersonal.nombre || 'Sin Nombre'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        formPersonal.isBlocked 
                          ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {formPersonal.isBlocked ? 'BLOQUEADO' : 'ACTIVO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formPersonal.email}
                    </p>
                  </div>
                </div>

                {/* Acciones de Cabecera */}
                <div className="flex items-center gap-2">
                  {onNavigateToPermissions && (
                    <button
                      type="button"
                      onClick={() => onNavigateToPermissions(selectedUserId)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                      title="Ver y ajustar permisos granulares de este usuario"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      Permisos RBAC
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleUserBlock(selectedUser)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formPersonal.isBlocked
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {formPersonal.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {formPersonal.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN DE ASIGNACIÓN MULTI-ROL (Regla de Oro #3 y requerimiento del usuario) */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Roles Asignados a este Usuario (Multi-Roles)</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Tilda o destilda roles para otorgar paquetes de permisos en 1 clic
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {rolesList.map(role => {
                    const isAssigned = selectedUserRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleToggleUserRole(role.id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isAssigned
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`size-3.5 rounded flex items-center justify-center border ${
                          isAssigned ? 'bg-white text-indigo-600 border-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isAssigned && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{role.nombre}</span>
                        {role.permisos?.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isAssigned ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {role.permisos.length} perms
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SELECTOR DE PESTAÑAS DE PERFIL: PERSONAL, NEGOCIO G3D, NEGOCIO XTV */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('personal')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeSubTab === 'personal'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  1. Perfil Personal
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('g3d')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeSubTab === 'g3d'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  2. Negocio G3D (Tienda)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('xtv')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeSubTab === 'xtv'
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  3. Negocio XTV (TV Digital)
                </button>
              </div>

              {/* FORMULARIOS MODULARES SEGÚN SUB-PESTAÑA */}
              <form onSubmit={handleSaveUserProfile} className="space-y-5">
                
                {/* SUB-PESTAÑA 1: PERFIL PERSONAL */}
                {activeSubTab === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          value={formPersonal.nombre}
                          onChange={(e) => setFormPersonal(p => ({ ...p, nombre: e.target.value }))}
                          required
                          placeholder="Ej. Gustavo Castillo"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Correo / Usuario de Acceso
                        </label>
                        <input
                          type="text"
                          value={formPersonal.email}
                          disabled
                          className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teléfono / WhatsApp Personal
                        </label>
                        <input
                          type="text"
                          value={formPersonal.telefono}
                          onChange={(e) => setFormPersonal(p => ({ ...p, telefono: e.target.value }))}
                          placeholder="+54 9 11 1234-5678"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          DNI o CUIT Personal
                        </label>
                        <input
                          type="text"
                          value={formPersonal.dni_cuit}
                          onChange={(e) => setFormPersonal(p => ({ ...p, dni_cuit: e.target.value }))}
                          placeholder="20-12345678-9"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Dirección / Domicilio Particular
                        </label>
                        <input
                          type="text"
                          value={formPersonal.direccion}
                          onChange={(e) => setFormPersonal(p => ({ ...p, direccion: e.target.value }))}
                          placeholder="Calle, Número, Localidad, Provincia"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Datos Bancarios Personales */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <Landmark className="w-4 h-4 text-indigo-500" />
                        <span>Datos Bancarios para Cobros / Liquidaciones Personales</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Alias Bancario</label>
                          <input
                            type="text"
                            value={formPersonal.alias}
                            onChange={(e) => setFormPersonal(p => ({ ...p, alias: e.target.value }))}
                            placeholder="mi.alias.mp"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">CBU / CVU</label>
                          <input
                            type="text"
                            value={formPersonal.cbu}
                            onChange={(e) => setFormPersonal(p => ({ ...p, cbu: e.target.value }))}
                            placeholder="00000031000..."
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Banco / Billetera</label>
                          <input
                            type="text"
                            value={formPersonal.banco}
                            onChange={(e) => setFormPersonal(p => ({ ...p, banco: e.target.value }))}
                            placeholder="Mercado Pago / Santander"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Titular de la Cuenta</label>
                          <input
                            type="text"
                            value={formPersonal.titular}
                            onChange={(e) => setFormPersonal(p => ({ ...p, titular: e.target.value }))}
                            placeholder="Nombre del Titular"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cambio de Contraseña */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <Key className="w-4 h-4 text-indigo-500" />
                        <span>Restablecer Contraseña de Acceso</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nueva Contraseña (opcional)</label>
                          <input
                            type="password"
                            value={formPersonal.newPassword}
                            onChange={(e) => setFormPersonal(p => ({ ...p, newPassword: e.target.value }))}
                            placeholder="Dejar en blanco para conservar la actual"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Confirmar Nueva Contraseña</label>
                          <input
                            type="password"
                            value={formPersonal.confirmPassword}
                            onChange={(e) => setFormPersonal(p => ({ ...p, confirmPassword: e.target.value }))}
                            placeholder="Repetir nueva contraseña"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-PESTAÑA 2: NEGOCIO G3D (TIENDA WEB) */}
                {activeSubTab === 'g3d' && (
                  <div className="space-y-4">
                    {/* Logo de Negocio G3D */}
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-amber-500/30 flex items-center justify-center">
                          {formG3d.logo_url ? (
                            <img src={formG3d.logo_url} alt="Logo G3D" className="w-full h-full object-contain p-1" />
                          ) : (
                            <ShoppingBag className="w-7 h-7 text-amber-500" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => g3dLogoRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md shadow transition-transform hover:scale-110 cursor-pointer"
                          title="Cargar Logo G3D"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <input
                          ref={g3dLogoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (base64) => setFormG3d(p => ({ ...p, logo_url: base64 })), 'Logo G3D')}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Identidad Comercial G3D del Usuario</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Logo y membrete para presupuestos, pedidos de tienda y remitos personalizados.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre Comercial / Marca Fantasía G3D
                        </label>
                        <input
                          type="text"
                          value={formG3d.business_name}
                          onChange={(e) => setFormG3d(p => ({ ...p, business_name: e.target.value }))}
                          placeholder="Ej. G3D Sucursal Palermo"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          CUIT / Identificación Fiscal
                        </label>
                        <input
                          type="text"
                          value={formG3d.cuit_tax_id}
                          onChange={(e) => setFormG3d(p => ({ ...p, cuit_tax_id: e.target.value }))}
                          placeholder="30-71234567-8"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Condición frente al IVA
                        </label>
                        <select
                          value={formG3d.tax_condition}
                          onChange={(e) => setFormG3d(p => ({ ...p, tax_condition: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        >
                          <option value="Responsable Inscripto">Responsable Inscripto</option>
                          <option value="Monotributo">Monotributo</option>
                          <option value="Consumidor Final">Consumidor Final</option>
                          <option value="Exento">Exento</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Comisión Asignada en Tienda (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={formG3d.commission_rate}
                            onChange={(e) => setFormG3d(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 0 }))}
                            placeholder="10"
                            className="w-full pl-3.5 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                          />
                          <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          WhatsApp Comercial G3D
                        </label>
                        <input
                          type="text"
                          value={formG3d.whatsapp}
                          onChange={(e) => setFormG3d(p => ({ ...p, whatsapp: e.target.value }))}
                          placeholder="+54 9 11 9876-5432"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sucursal de Despacho / Logística
                        </label>
                        <input
                          type="text"
                          value={formG3d.shipping_branch}
                          onChange={(e) => setFormG3d(p => ({ ...p, shipping_branch: e.target.value }))}
                          placeholder="Depósito Central / Sucursal Norte"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-PESTAÑA 3: NEGOCIO XTV (TV DIGITAL) */}
                {activeSubTab === 'xtv' && (
                  <div className="space-y-4">
                    {/* Logo XTV */}
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-cyan-500/30 flex items-center justify-center">
                          {formXtv.logo_url ? (
                            <img src={formXtv.logo_url} alt="Logo XTV" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Tv className="w-7 h-7 text-cyan-500" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => xtvLogoRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md shadow transition-transform hover:scale-110 cursor-pointer"
                          title="Cargar Logo XTV"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <input
                          ref={xtvLogoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (base64) => setFormXtv(p => ({ ...p, logo_url: base64 })), 'Logo XTV')}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Identidad de Revendedor XTV</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Marca, plantilla de WhatsApp y canales de atención para sus clientes de televisión digital.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Marca / Alias de Revendedor XTV
                        </label>
                        <input
                          type="text"
                          value={formXtv.reseller_alias}
                          onChange={(e) => setFormXtv(p => ({ ...p, reseller_alias: e.target.value }))}
                          placeholder="Ej. XTV Premium BA"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Cupo / Saldo de Créditos Fichas XTV
                        </label>
                        <input
                          type="number"
                          value={formXtv.credits_balance}
                          onChange={(e) => setFormXtv(p => ({ ...p, credits_balance: parseInt(e.target.value, 10) || 0 }))}
                          placeholder="0"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          WhatsApp de Soporte a Clientes XTV
                        </label>
                        <input
                          type="text"
                          value={formXtv.support_whatsapp}
                          onChange={(e) => setFormXtv(p => ({ ...p, support_whatsapp: e.target.value }))}
                          placeholder="+54 9 11 5555-0000"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Canal de Telegram / Enlace
                        </label>
                        <input
                          type="text"
                          value={formXtv.telegram_channel}
                          onChange={(e) => setFormXtv(p => ({ ...p, telegram_channel: e.target.value }))}
                          placeholder="https://t.me/mi_canal_xtv"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Plantilla de Mensaje de Bienvenida / Entrega de Cuenta
                        </label>
                        <textarea
                          rows={4}
                          value={formXtv.welcome_message}
                          onChange={(e) => setFormXtv(p => ({ ...p, welcome_message: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Variables disponibles: <code className="text-cyan-500 font-bold">{'{usuario}'}</code>, <code className="text-cyan-500 font-bold">{'{clave}'}</code>, <code className="text-cyan-500 font-bold">{'{m3u}'}</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTÓN FINAL DE GUARDAR */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Ficha Completa del Usuario
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Ningún usuario seleccionado</p>
              <p className="text-xs text-slate-400 mt-1">Selecciona un usuario de la lista izquierda para ver y editar su ficha 360°.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA CREAR NUEVO USUARIO */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-base">Registrar Nuevo Usuario</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Lucas Fernández"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico / Usuario *</label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="lucas@miempresa.com"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Roles Iniciales (Multi-Rol)</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {rolesList.map(r => {
                    const isChecked = newUserSelectedRoles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setNewUserSelectedRoles(prev => 
                            prev.includes(r.id) 
                              ? (prev.length > 1 ? prev.filter(x => x !== r.id) : prev) 
                              : [...prev, r.id]
                          );
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          isChecked 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CONFIRMAR ELIMINACIÓN DE USUARIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">¿Eliminar Usuario?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Se eliminará permanentemente la cuenta de <span className="font-bold text-slate-900 dark:text-white">{userToDelete.nombre || userToDelete.email}</span> de Supabase.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {deletingUser ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
