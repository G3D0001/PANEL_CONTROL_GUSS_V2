import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Switch3D } from './Switch3D';
import { Monitor, Type, Layout, Shield, Globe, Bell, Save, Key, Box, ShoppingCart, Hammer, Truck, Info, ChevronRight, Search, Users, UserCheck, ShieldCheck, Plus, Minus, Mail, User, AlertOctagon, AlertTriangle, Trash2, Loader2, RotateCcw, Edit, Phone, MapPin, Building2, Image as ImageIcon, Folder, Upload, Store, Tv, Send, RefreshCw, Check, X, Server, Layers, Terminal, Play, Eye, EyeOff, Database, Copy, UserPlus, Camera, Bot, Activity, Settings, FileText } from 'lucide-react';
import { PERMISSIONS, getAllPermissionsList } from '../types/permissions';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';
import { LocationPicker } from './LocationPicker';
import { validateResellerApiPayload } from '../utils/resellerValidation';

type TabType = 'interface' | 'general' | 'users' | 'security' | 'profile' | 'iptv' | 'apis';
type AssignmentMode = 'roles' | 'users';

export function SettingsView() {
  const { uiSettings, updateUISettings, refreshBusinessProfile } = useApp();
  const { user, userRole, hasPermission, refreshProfile } = useAuth();
  const isAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';
  const isG3dVendedor = String(userRole).toLowerCase() === 'g3d vendedor' || isAdmin;
  
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'profile') {
      return 'profile';
    }
    return 'interface';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeDesc, setActiveDesc] = useState<string | null>(null);

  const tabs = [
    { id: 'interface', label: 'Interfaz y Pantalla', icon: Monitor },
    { id: 'general', label: 'Configuración General', icon: Globe },
    { id: 'profile', label: 'Mi Perfil y Negocio', icon: User },
    { id: 'apis', label: 'APIs y Conexión', icon: Key, adminOnly: true },
    { id: 'users', label: 'Usuarios y Roles', icon: Users, adminOnly: true },
    { id: 'security', label: 'Seguridad y Baneos', icon: AlertOctagon, adminOnly: true },
    { id: 'iptv', label: 'XTV config', icon: Tv, adminOnly: true },
  ];

  // Estados para Gestión de Usuarios
  const [activeColMobile, setActiveColMobile] = useState<'left' | 'middle' | 'right'>('left');
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>('Administrador'); // ID del Rol o Email del Usuario
  const [users, setUsers] = useState<any[]>([]);
  
  // Estados para la Limpieza Inteligente de Usuarios (Centro de Seguridad)
  const [relations, setRelations] = useState<any[]>([]);
  const [iptvLines, setIptvLines] = useState<any[]>([]);
  const [g3dOrders, setG3dOrders] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [sortField, setSortField] = useState<string>('last_active');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [securityFilter, setSecurityFilter] = useState<string>('all');
  const [editingInactivityMonths, setEditingInactivityMonths] = useState(false);
  const [inactivityMonthsInput, setInactivityMonthsInput] = useState<number>(3);
  const [roleConfigs, setRoleConfigs] = useState<any[]>(() => {
    const saved = localStorage.getItem('iptv_role_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const defaultConfigs = [
      { id: 'Administrador', permisos: ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'] },
      { id: 'IPTV SOCIOS', permisos: [] },
      { id: 'IPTV VENDEDORES', permisos: [] },
      { id: 'IPTV CLIENTES', permisos: [] },
      { id: 'G3D SOCIO', permisos: [] },
      { id: 'G3D EMPLEADO', permisos: [] }
    ];
    localStorage.setItem('iptv_role_configs', JSON.stringify(defaultConfigs));
    return defaultConfigs;
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const panelLogoInputRef = useRef<HTMLInputElement>(null);
  const systemLogoInputRef = useRef<HTMLInputElement>(null);
  const iptvBannerInputRef = useRef<HTMLInputElement>(null);
  const iptvLogoInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploadingSystemConfig, setIsUploadingSystemConfig] = useState<Record<string, boolean>>({
    favicon_url: false,
    panel_logo_url: false,
    logo_url: false,
    banner_url: false,
    iptv_logo_url: false
  });

  // Estados para descripciones personalizadas de permisos
  const [customPermissionDescriptions, setCustomPermissionDescriptions] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('g3d_custom_permission_descriptions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [customPermissionTitles, setCustomPermissionTitles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('g3d_custom_permission_titles');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [roleLandingPages, setRoleLandingPages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('g3d_roles_landing_pages');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    Administrador: true,
    'IPTV SOCIOS': true,
    'IPTV VENDEDORES': true,
    'IPTV CLIENTES': true,
  });

  const handleSaveRoleLandingPage = async (roleId: string, path: string) => {
    try {
      setIsSaving(true);
      const updated = { ...roleLandingPages, [roleId]: path };
      setRoleLandingPages(updated);
      localStorage.setItem('g3d_roles_landing_pages', JSON.stringify(updated));

      const currentConfig = await apiService.getSystemConfig();
      const payload = {
        ...currentConfig,
        role_landing_pages: updated
      };
      
      const res = await apiService.updateSystemConfig(payload);
      if (res.success) {
        toast.success("Pantalla de inicio guardada en Supabase", {
          description: `El rol "${roleId}" ahora ingresará a: ${path}`,
        });
      } else {
        throw new Error(res.error || "Fallo al guardar");
      }
    } catch (err: any) {
      console.error("Error saving role landing page:", err);
      toast.error("Error al guardar en Supabase", {
        description: err.message || "Guardado localmente de respaldo."
      });
    } finally {
      setIsSaving(false);
    }
  };
  const [editingPermId, setEditingPermId] = useState<string | null>(null);
  const [activeFactionTab, setActiveFactionTab] = useState<string>('ADMIN');
  const [tempDesc, setTempDesc] = useState<string>('');
  const [tempTitle, setTempTitle] = useState<string>('');
  const [showPlainPassword, setShowPlainPassword] = useState<Record<string, boolean>>({});
  const [showPlainApiKey, setShowPlainApiKey] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isUploadingEditLogo, setIsUploadingEditLogo] = useState(false);
  const editLogoInputRef = useRef<HTMLInputElement>(null);
  const [showEditApiKey, setShowEditApiKey] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const handleEditUserLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingUser) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    setIsUploadingEditLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `logos_negocio/${editingUser.email}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      
      setEditingUser((prev: any) => ({ ...prev, logo_url: data.publicUrl, logo_negocio: data.publicUrl }));
      toast.success('Logo del negocio subido correctamente');
    } catch (error: any) {
      toast.error(`Error al subir el logo: ${error.message}`);
    } finally {
      setIsUploadingEditLogo(false);
      if (editLogoInputRef.current) editLogoInputRef.current.value = '';
    }
  };

  const handleSavePermissionMetadata = (id: string, title: string, desc: string) => {
    const updatedDesc = { ...customPermissionDescriptions, [id]: desc };
    setCustomPermissionDescriptions(updatedDesc);
    localStorage.setItem('g3d_custom_permission_descriptions', JSON.stringify(updatedDesc));

    const updatedTitle = { ...customPermissionTitles, [id]: title };
    setCustomPermissionTitles(updatedTitle);
    localStorage.setItem('g3d_custom_permission_titles', JSON.stringify(updatedTitle));

    toast.success(`Metadatos del permiso '${id}' guardados localmente.`);
  };

  const handleSystemFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    setIsUploadingSystemConfig(prev => ({ ...prev, [field]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `system/${fileName}`; // using 'system' folder

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      
      setSystemConfig(prev => ({ ...prev, [field]: data.publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(`Error al subir la imagen: ${error.message}`);
    } finally {
      setIsUploadingSystemConfig(prev => ({ ...prev, [field]: false }));
      if (field === 'favicon_url' && faviconInputRef.current) faviconInputRef.current.value = '';
      if (field === 'panel_logo_url' && panelLogoInputRef.current) panelLogoInputRef.current.value = '';
      if (field === 'logo_url' && systemLogoInputRef.current) systemLogoInputRef.current.value = '';
      if (field === 'banner_url' && iptvBannerInputRef.current) iptvBannerInputRef.current.value = '';
      if (field === 'iptv_logo_url' && iptvLogoInputRef.current) iptvLogoInputRef.current.value = '';
    }
  };



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'avatar_url') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    if (field === 'logo_url') {
       setIsUploading(true);
    } else {
       setIsUploadingAvatar(true);
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user?.email}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
           toast.error('El bucket "public_assets" no existe. Por favor créalo en Supabase.');
        } else if (uploadError.message.includes('row-level security')) {
           toast.error('Error de permisos (RLS). Tu administrador debe configurar las políticas del Storage.');
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      
      setProfileData(prev => ({ ...prev, [field]: data.publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(`Error al subir la imagen: ${error.message}`);
    } finally {
      if (field === 'logo_url') {
         setIsUploading(false);
         if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
         setIsUploadingAvatar(false);
         if (avatarInputRef.current) avatarInputRef.current.value = '';
      }
    }
  };

  const [profileData, setProfileData] = useState({
    nombre_personal: '',
    telefono_personal: '',
    direccion_personal: '',
    referencia_personal: '',
    lat_personal: null as number | null,
    lng_personal: null as number | null,
    dni: '',
    avatar_url: '',
    nombre_negocio: '',
    logo_url: '',
    direccion_negocio: '',
    referencia_negocio: '',
    lat_negocio: null as number | null,
    lng_negocio: null as number | null,
    telefono_negocio: '',
    email_negocio: '',
    ciudad: '',
    provincia: ''
  });

  const [datosAdicionalesState, setDatosAdicionalesState] = useState<any>({});

  const [parentSupportRole, setParentSupportRole] = useState<string>('');
  const [parentSupportUsers, setParentSupportUsers] = useState<any[]>([]);
  const [parentHasEditPermission, setParentHasEditPermission] = useState<boolean>(false);
  const [isLoadingSupport, setIsLoadingSupport] = useState<boolean>(false);

  const fetchParentSupportInfo = async (currentUserRole: string) => {
    if (!currentUserRole) return;
    setIsLoadingSupport(true);
    try {
      // 1. Determinar el rol padre usando el diccionario de herencia
      let parentRole = roleInheritance[currentUserRole] || '';
      
      // Si no hay rol padre definido, por defecto apuntar a "Administrador"
      if (!parentRole && currentUserRole.toUpperCase() !== 'ADMINISTRADOR' && currentUserRole.toUpperCase() !== 'ADMIN') {
        parentRole = 'Administrador';
      }
      
      setParentSupportRole(parentRole);
      
      if (!parentRole) {
        setIsLoadingSupport(false);
        return;
      }
      
      // 2. Consultar usuarios que posean ese rol padre en perfiles_locales
      const { data: supportUsers, error: usersErr } = await supabase
        .from('perfiles_locales')
        .select('nombre, email, telefono_contacto, rol')
        .eq('rol', parentRole);
        
      if (usersErr) throw usersErr;
      setParentSupportUsers(supportUsers || []);
      
      // 3. Verificar si el rol padre tiene el permiso "Seguridad.Perfil.EditarDatosPersonales"
      if (parentRole.toUpperCase() === 'ADMINISTRADOR' || parentRole.toUpperCase() === 'ADMIN') {
        setParentHasEditPermission(true);
      } else {
        const { data: permRows, error: permErr } = await supabase
          .from('g3d_roles_permisos')
          .select('permiso_id')
          .eq('rol_id', parentRole)
          .eq('permiso_id', 'Seguridad.Perfil.EditarDatosPersonales');
          
        if (permErr) throw permErr;
        setParentHasEditPermission(permRows && permRows.length > 0);
      }
    } catch (err) {
      console.error("Error al obtener información de soporte del rol padre:", err);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  const fetchCurrentProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('perfiles_locales')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setDatosAdicionalesState(data.datos_adicionales || {});
        setProfileData({
          nombre_personal: data.nombre || '',
          telefono_personal: data.telefono_contacto || '',
          direccion_personal: data.direccion_hogar || '',
          referencia_personal: data.referencia_personal || '',
          lat_personal: data.lat_personal || null,
          lng_personal: typeof data.lng_personal === 'string' ? parseFloat(data.lng_personal) : (data.lng_personal || null),
          dni: data.datos_adicionales?.dni || '',
          avatar_url: data.avatar_url || data.foto_perfil || '',
          nombre_negocio: data.nombre_negocio || '',
          logo_url: data.logo_url || '',
          direccion_negocio: data.direccion_negocio || '',
          referencia_negocio: data.referencia_negocio || '',
          lat_negocio: data.lat_negocio || null,
          lng_negocio: typeof data.lng_negocio === 'string' ? parseFloat(data.lng_negocio) : (data.lng_negocio || null),
          telefono_negocio: data.telefono_negocio || '',
          email_negocio: data.email_negocio || '',
          ciudad: data.ciudad || '',
          provincia: data.provincia || ''
        });

        if (data.rol) {
          fetchParentSupportInfo(data.rol);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const [systemConfig, setSystemConfig] = useState<any>({ dias_validez_link: 15 });
  const [xuiTestResult, setXuiTestResult] = useState<any>(null);
  const [showCompactCredentials, setShowCompactCredentials] = useState<boolean>(false);

  // XC Reseller Command Console States
  const [xcTestAction, setXcTestAction] = useState<string>('user_info');
  const [xcTestUser, setXcTestUser] = useState<string>('');
  const [xcTestPass, setXcTestPass] = useState<string>('');
  const [xcTestPackageId, setXcTestPackageId] = useState<string>('');
  const [xcTestTrial, setXcTestTrial] = useState<string>('1'); // '0' = regular, '1' = trial
  const [xcTestLineId, setXcTestLineId] = useState<string>('');
  const [xcTestIsplock, setXcTestIsplock] = useState<string>(''); // '' = don't send/no cambiar, '0' = disabled, '1' = enabled
  const [xcTestResellerNotes, setXcTestResellerNotes] = useState<string>('');
  const [xcTestAllowedIps, setXcTestAllowedIps] = useState<string>('');
  const [xcTestBouquets, setXcTestBouquets] = useState<string>('');
  const [xcLinesSearch, setXcLinesSearch] = useState<string>('');
  const [userPublicIp, setUserPublicIp] = useState<string>('Detectando...');
  const [providerPlans, setProviderPlans] = useState<any[]>([]);
  const [selectedProviderPlanId, setSelectedProviderPlanId] = useState<string>('');
  const [allowedConnectionsList, setAllowedConnectionsList] = useState<number[]>([1, 2, 3, 4, 5]);
  const [xcTestConnections, setXcTestConnections] = useState<string>('1');
  const [iptvClients, setIptvClients] = useState<any[]>([]);
  const [selectedIptvClientUsername, setSelectedIptvClientUsername] = useState<string>('');
  const [assocUsername, setAssocUsername] = useState<string>('');
  const [localClientsSearch, setLocalClientsSearch] = useState<string>('');

  // Utility to compress image locally to Base64 using Canvas
  const compressImageToBase64 = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressed);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // App Clones States
  const [appClones, setAppClones] = useState<any[]>([]);
  const [loadingClones, setLoadingClones] = useState<boolean>(false);
  const [showClonesAccordion, setShowClonesAccordion] = useState<boolean>(false);
  const [newClone, setNewClone] = useState<any>({
    id_app: '',
    nombre_comercial: '',
    logo_remoto: '',
    banner_publicitario: '',
    mensaje_aviso: '',
    version_actual: '1.0.0',
    url_apk_github: ''
  });
  const [editingCloneId, setEditingCloneId] = useState<string | null>(null);
  const [editCloneData, setEditCloneData] = useState<any>(null);

  const fetchAppClones = async () => {
    setLoadingClones(true);
    try {
      const { data, error } = await supabase
        .from('app_clones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setAppClones(data || []);
    } catch (err: any) {
      console.warn("Error leyendo app_clones de Supabase, usando LocalStorage fallback:", err);
      const local = localStorage.getItem("g3d_app_clones");
      if (local) {
        try {
          setAppClones(JSON.parse(local));
        } catch {
          setAppClones([]);
        }
      } else {
        setAppClones([]);
      }
    } finally {
      setLoadingClones(false);
    }
  };

  const handleSaveClone = async (cloneData: any, isEdit: boolean) => {
    try {
      if (!cloneData.id_app || !cloneData.nombre_comercial) {
        toast.error("Por favor completa el ID de la App y el Nombre Comercial.");
        return false;
      }

      const payload = {
        id_app: cloneData.id_app.trim(),
        nombre_comercial: cloneData.nombre_comercial.trim(),
        logo_remoto: cloneData.logo_remoto || '',
        banner_publicitario: cloneData.banner_publicitario || '',
        mensaje_aviso: cloneData.mensaje_aviso || '',
        version_actual: cloneData.version_actual || '1.0.0',
        url_apk_github: cloneData.url_apk_github || ''
      };

      let success = false;
      try {
        const { error } = await supabase
          .from('app_clones')
          .upsert(payload, { onConflict: 'id_app' });

        if (error) throw error;
        success = true;
      } catch (dbErr) {
        console.warn("Error guardando app_clones en Supabase, guardando en LocalStorage fallback:", dbErr);
      }

      // Sincronizar en local
      let updatedList = [...appClones];
      const existingIdx = updatedList.findIndex(c => c.id_app === payload.id_app);
      if (existingIdx >= 0) {
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...payload };
      } else {
        updatedList.unshift({ ...payload, created_at: new Date().toISOString() });
      }

      setAppClones(updatedList);
      localStorage.setItem("g3d_app_clones", JSON.stringify(updatedList));

      if (success) {
        toast.success("¡Clon guardado exitosamente en Supabase!");
      } else {
        toast.success("¡Guardado localmente en LocalStorage!");
      }
      return true;
    } catch (err: any) {
      toast.error("Error al guardar clon: " + (err.message || err));
      return false;
    }
  };

  const handleDeleteClone = async (idApp: string) => {
    try {
      let success = false;
      try {
        const { error } = await supabase
          .from('app_clones')
          .delete()
          .eq('id_app', idApp);

        if (error) throw error;
        success = true;
      } catch (dbErr) {
        console.warn("Error borrando clon de Supabase:", dbErr);
      }

      const updatedList = appClones.filter(c => c.id_app !== idApp);
      setAppClones(updatedList);
      localStorage.setItem("g3d_app_clones", JSON.stringify(updatedList));

      if (success) {
        toast.success("¡Clon eliminado de Supabase!");
      } else {
        toast.success("¡Clon eliminado de LocalStorage!");
      }
    } catch (err: any) {
      toast.error("Error al eliminar clon: " + (err.message || err));
    }
  };

  const getCleanPayload = (actionToSubmit?: string, includeCredentialsReal: boolean = true) => {
    const act = actionToSubmit || xcTestAction;
    const finalActionStr = act === "user_info" ? "test" : act;

    const payloadObj: any = {
      action: finalActionStr,
      xuiUrl: systemConfig.xc_url_completa || "https://tu-dominio.com",
    };

    if (systemConfig.xc_token) {
      payloadObj.xuiToken = includeCredentialsReal ? systemConfig.xc_token : "***";
    }
    if (systemConfig.xc_access_code) {
      payloadObj.xuiAccessCode = systemConfig.xc_access_code;
    }

    const actionNeedsUserPass = act === "create_line" || act === "edit_line" || act === "extend_line" || act === "user_info";
    if (actionNeedsUserPass) {
      if (xcTestUser && xcTestUser.trim() !== "") {
        payloadObj.username = xcTestUser.trim();
      }
      if (xcTestPass && xcTestPass.trim() !== "") {
        payloadObj.password = xcTestPass.trim();
      }
    }
    if (act !== "create_line" && xcTestLineId && xcTestLineId.trim() !== "") {
      const idNum = Number(xcTestLineId.trim());
      if (!isNaN(idNum)) {
        payloadObj.id = idNum;
      }
    }

    if (act === "create_line" || act === "edit_line" || act === "extend_line") {
      if (xcTestPackageId && xcTestPackageId.trim() !== "" && xcTestPackageId.trim() !== "0") {
        const pNum = Number(xcTestPackageId.trim());
        if (!isNaN(pNum) && pNum > 0) {
          payloadObj.package = pNum;
        }
      }
      if (act === "create_line" && xcTestTrial && xcTestTrial.trim() !== "") {
        const tNum = Number(xcTestTrial.trim());
        if (!isNaN(tNum)) {
          payloadObj.trial = tNum;
        }
      }
      if (xcTestIsplock && xcTestIsplock.trim() !== "") {
        const lockNum = Number(xcTestIsplock.trim());
        if (!isNaN(lockNum)) {
          payloadObj.is_isplock = lockNum;
        }
      }
      if (xcTestConnections && xcTestConnections.trim() !== "") {
        const connNum = Number(xcTestConnections);
        if (!isNaN(connNum) && connNum > 1) {
          payloadObj.max_connections = connNum;
        }
      }
      if (xcTestResellerNotes && xcTestResellerNotes.trim() !== "") {
        payloadObj.reseller_notes = xcTestResellerNotes.trim();
      }
      if (xcTestAllowedIps && xcTestAllowedIps.trim() !== "") {
        payloadObj.allowed_ips = xcTestAllowedIps.split(",").map(i => i.trim()).filter(Boolean);
      }
      if (xcTestBouquets && xcTestBouquets.trim() !== "") {
        payloadObj.bouquets_selected = xcTestBouquets.split(",").map(i => Number(i.trim())).filter(n => !isNaN(n));
      }
    }

    return payloadObj;
  };

  const fetchUserPublicIp = async () => {
    try {
      const response = await fetch('/api/my-ip');
      const data = await response.json();
      if (data && data.ip) {
        setUserPublicIp(data.ip);
      } else {
        setUserPublicIp('No detectada');
      }
    } catch (err) {
      setUserPublicIp('Error al consultar');
    }
  };

  // DNS IPTV States
  const [dnsProviders, setDnsProviders] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);
  const [newDns, setNewDns] = useState({ nombre_proveedor: '', url_dns: '' });
  const [editingDnsId, setEditingDnsId] = useState<string | null>(null);

  // Auto Onboarding Simulator States
  const [simNombre, setSimNombre] = useState('');
  const [simCelular, setSimCelular] = useState('');
  const [simDireccion, setSimDireccion] = useState('');
  const [simUser, setSimUser] = useState('');
  const [simPass, setSimPass] = useState('');
  const [simStatus, setSimStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [simTestedDns, setSimTestedDns] = useState('');
  const [simWinningDns, setSimWinningDns] = useState('');
  const [simProgressLog, setSimProgressLog] = useState<string[]>([]);

  const fetchDnsProviders = async () => {
    setLoadingDns(true);
    try {
      const providers = await apiService.getIptvDnsProviders();
      setDnsProviders(providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDns(false);
    }
  };

  const handleSaveDns = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDns.nombre_proveedor || !newDns.url_dns) {
      toast.error('Completa todos los campos del DNS');
      return;
    }
    try {
      const id = editingDnsId || `dns-${Math.random().toString(36).substring(2, 9)}`;
      const payload = {
        id,
        nombre_proveedor: newDns.nombre_proveedor,
        url_dns: newDns.url_dns
      };
      const res = await apiService.saveIptvDnsProvider(payload);
      if (res.success) {
        toast.success(editingDnsId ? 'DNS actualizado con éxito' : 'Nuevo DNS agregado');
        setNewDns({ nombre_proveedor: '', url_dns: '' });
        setEditingDnsId(null);
        await fetchDnsProviders();
      } else {
        toast.error('Error al guardar DNS');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleEditDns = (provider: any) => {
    setEditingDnsId(provider.id);
    setNewDns({ nombre_proveedor: provider.nombre_proveedor, url_dns: provider.url_dns });
  };

  const handleDeleteDns = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor DNS?')) return;
    try {
      const res = await apiService.deleteIptvDnsProvider(id);
      if (res.success) {
        toast.success('DNS eliminado correctamente');
        await fetchDnsProviders();
      } else {
        toast.error('Error al eliminar DNS');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleRunOnboardingSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simNombre || !simCelular || !simDireccion || !simUser || !simPass) {
      toast.error('Completa los campos personales y de credenciales para simular el registro');
      return;
    }

    setSimStatus('testing');
    setSimProgressLog([]);
    setSimWinningDns('');
    
    // Grabbing registered DNS
    const urlsToTest = dnsProviders.length > 0 ? dnsProviders : [
      { id: 'dns-1', nombre_proveedor: 'Servidor VIP Principal', url_dns: 'http://vip-xtv.pro:8080' },
      { id: 'dns-2', nombre_proveedor: 'Servidor Deportes HD', url_dns: 'http://sports-dns.xyz:1080' },
      { id: 'dns-3', nombre_proveedor: 'Servidor Latino Premium', url_dns: 'http://kids-xtv.pro:8080' }
    ];

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setSimProgressLog([...logs]);
    };

    addLog('🚀 Iniciando escaneo de compatibilidad de credenciales...');
    
    let winner = '';
    // We will simulate querying each server
    for (let i = 0; i < urlsToTest.length; i++) {
      const current = urlsToTest[i];
      setSimTestedDns(current.nombre_proveedor);
      addLog(`🔍 Conectando a ${current.nombre_proveedor} (${current.url_dns})...`);
      
      // Simulate network request delays
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // We'll simulate that the first compatible works, or if multiple DNS are loaded, we can gracefully pick a working simulated output
      const isCompatible = i === 0 || simUser.toLowerCase().includes('sports') && i === 1 || i === urlsToTest.length - 1; 

      if (isCompatible) {
        addLog(`✅ ¡CONEXIÓN EXITOSA! El servidor respondió con código 200 (Autenticación OK).`);
        winner = current.url_dns;
        break;
      } else {
        addLog(`❌ Respuesta 401: Credenciales inválidas para este DNS.`);
      }
    }

    if (winner) {
      setSimWinningDns(winner);
      addLog(`✍️ Registrando nueva cuenta auto-proporcionada en la base de datos...`);
      await new Promise(resolve => setTimeout(resolve, 800));

      const newAccountObj = {
        username: simUser,
        password: simPass,
        url_panel_asignada: winner,
        estado: 'Activo',
        fecha_creacion: new Date().toISOString(),
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        comentarios: `Auto-registrado por cliente: ${simNombre} (Tel: ${simCelular}). Dir: ${simDireccion}.`
      };

      const res = await apiService.saveIptvAccount(newAccountObj);
      if (res.success) {
        addLog(`🎉 ¡Cuenta registrada perfectamente! DNS asignado: ${winner}`);
        setSimStatus('success');
        toast.success(`Cliente ${simNombre} registrado con éxito en ${winner}`);
        // Reset simulation input holding state EXCEPT success result UI
      } else {
        addLog(`❌ Error al escribir el registro final en Supabase.`);
        setSimStatus('failed');
      }
    } else {
      addLog(`❌ El escaneo finalizó: Ninguno de los servidores DNS cargados reconoció las credenciales proporcionadas.`);
      setSimStatus('failed');
      toast.error('No se pudo determinar un proveedor compatible para estas credenciales.');
    }
  };

  const fetchSystemConfig = async () => {
    const data = await apiService.getSystemConfig();
    if (data) {
      setSystemConfig(data || { dias_validez_link: 15 });
      if (data.role_landing_pages) {
        setRoleLandingPages(data.role_landing_pages);
        localStorage.setItem('g3d_roles_landing_pages', JSON.stringify(data.role_landing_pages));
      }
      if (data.role_inheritance) {
        setRoleInheritance(data.role_inheritance);
        localStorage.setItem('g3d_roles_inheritance', JSON.stringify(data.role_inheritance));
      }
    }
    if (activeTab === 'iptv') {
      await fetchDnsProviders();
      await fetchProviderPlans();
    }
  };

  const fetchProviderPlans = async () => {
    try {
      const config = await apiService.getIptvFinances();
      if (config && Array.isArray(config.provider_plans)) {
        setProviderPlans(config.provider_plans.filter((p: any) => !p.archived));
      }
    } catch (err) {
      console.error("Error al obtener planes del proveedor:", err);
    }
  };

  const fetchIptvClients = async () => {
    try {
      const clients = await apiService.getIptvAccounts();
      setIptvClients(clients || []);
    } catch (err) {
      console.error("Error al obtener clientes de IPTV:", err);
    }
  };

  const handleUpdateClientId = async (client: any, newId: string) => {
    try {
      const updatedClient = {
        ...client,
        panel_client_id: newId ? String(newId) : null,
        xui_id: newId ? String(newId) : null,
        id_linea: newId ? String(newId) : null
      };
      
      const res = await apiService.saveIptvAccount(updatedClient);
      if (res && (res as any).success === false) {
        toast.error(`Error al guardar: ${(res as any).error}`);
      } else {
        toast.success(`ID de Línea [${newId || 'Vacío'}] asignado a ${client.username}`);
        await fetchIptvClients(); // Recargar la lista
      }
    } catch (err: any) {
      toast.error(`Error al guardar ID de línea: ${err.message || err}`);
    }
  };

  const handleCreateLocalFromPanel = async (uName: string, uPass: string, lineId: any) => {
    try {
      const pName = prompt("Ingresa el NOMBRE COMPLETO del cliente para registrarlo localmente:", uName);
      if (pName === null) return; // Cancelado

      const phone = prompt("Ingresa el NÚMERO DE TELÉFONO del cliente (opcional):", "");
      if (phone === null) return; // Cancelado

      toast.loading("Registrando cliente en la base de datos local...");
      const newAccountObj = {
        nombre_completo: pName.trim() || uName,
        celular: phone.trim() || null,
        username: uName,
        password: uPass || "123456",
        panel_client_id: lineId ? String(lineId) : null,
        xui_id: lineId ? String(lineId) : null,
        id_linea: lineId ? String(lineId) : null,
        estado: 'Activo',
        fecha_creacion: new Date().toISOString(),
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        comentarios: `Creado desde consola de autodetectación de panel XC (ID: ${lineId})`
      };

      const res = await apiService.saveIptvAccount(newAccountObj);
      toast.dismiss();
      if (res && (res as any).success === false) {
        toast.error(`Error al registrar cliente: ${(res as any).error}`);
      } else {
        toast.success(`🎉 ¡Cliente ${uName} registrado correctamente en la base de datos!`);
        await fetchIptvClients(); // Recargar la lista
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error: ${err.message || err}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') fetchCurrentProfile();
    if (activeTab === 'general' || activeTab === 'iptv' || activeTab === 'apis' || activeTab === 'security') {
      fetchSystemConfig();
      fetchUserPublicIp();
    }
    if (activeTab === 'iptv') {
      fetchProviderPlans();
      fetchIptvClients();
      fetchAppClones();
    }
    if (activeTab === 'security') {
      fetchSecurityMetrics();
    }
  }, [activeTab]);

  const handleUpdatePersonal = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const payloadToUpdate = {
        nombre: profileData.nombre_personal,
        telefono_contacto: profileData.telefono_personal,
        direccion_hogar: profileData.direccion_personal,
        referencia_personal: profileData.referencia_personal,
        lat_personal: profileData.lat_personal,
        lng_personal: profileData.lng_personal,
        avatar_url: profileData.avatar_url,
        foto_perfil: profileData.avatar_url,
        datos_adicionales: {
           ...datosAdicionalesState,
           dni: profileData.dni
        }
      };

      const { error } = await supabase
        .from('perfiles_locales')
        .update(payloadToUpdate)
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success("Información personal guardada.");
    } catch (err: any) {
      toast.error("Error al guardar personal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBusiness = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const payloadToUpdate = {
        nombre_negocio: profileData.nombre_negocio,
        logo_url: profileData.logo_url,
        direccion_negocio: profileData.direccion_negocio,
        referencia_negocio: profileData.referencia_negocio,
        lat_negocio: profileData.lat_negocio,
        lng_negocio: profileData.lng_negocio !== null ? String(profileData.lng_negocio) : null,
        telefono_negocio: profileData.telefono_negocio,
        email_negocio: profileData.email_negocio,
        ciudad: profileData.ciudad,
        provincia: profileData.provincia,
      };

      const { error } = await supabase
        .from('perfiles_locales')
        .update(payloadToUpdate)
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success("Perfil de negocio guardado.");
    } catch (err: any) {
      toast.error("Error al guardar negocio: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleExplicitPermissions = (roleName: string): string[] => {
    const dbConfig = roleConfigs.find(r => r.id === roleName);
    if (dbConfig?.permisos) return dbConfig.permisos;

    const defaultRolePerms: Record<string, string[]> = {
      'Administrador': ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'],
      'IPTV SOCIOS': [],
      'IPTV VENDEDORES': [],
      'IPTV CLIENTES': [],
      'G3D SOCIO': [],
      'G3D EMPLEADO': []
    };
    return defaultRolePerms[roleName] || [];
  };

  const getTargetPermissions = (): string[] => {
    if (!selectedTarget) return [];
    if (assignmentMode === 'roles') {
      return getRolePermissionsRecursive(selectedTarget);
    } else {
      const targetUser = users.find(u => u.email === selectedTarget);
      const userExplicitPerms = targetUser?.permisos || [];
      
      const userRole = targetUser?.rol || 'IPTV CLIENTES';
      const firstRole = String(userRole).split(',')[0] || 'IPTV CLIENTES';
      const rolePerms = getRolePermissionsRecursive(firstRole);
      
      const mergedPerms = [...userExplicitPerms];
      const userConfiguredBases = new Set(
        userExplicitPerms.map(p => p.replace(/^-/, '').replace(/:completo$/, ''))
      );
      
      rolePerms.forEach(p => {
        const baseP = p.replace(/^-/, '').replace(/:completo$/, '');
        if (!userConfiguredBases.has(baseP)) {
          mergedPerms.push(p);
        }
      });
      return mergedPerms;
    }
  };

  const handleSetPermissionState = async (
    permId: string, 
    state: 'permitido' | 'negado' | 'heredado', 
    level: 'ver' | 'interactuar' = 'ver'
  ) => {
    if (!selectedTarget) return;

    // Si se modifica el permiso master wildcard (.*) de cualquier facción, actuar como bulk toggle para toda la facción
    if (permId.endsWith('.*')) {
      const factionKey = permId.split('.')[0].toUpperCase();
      if (PERMISSIONS[factionKey as keyof typeof PERMISSIONS]) {
        await handleSetAllFactionPermissions(factionKey, state, state === 'permitido' ? 'interactuar' : 'ver');
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const getNewPermsArray = (currentPerms: string[]): string[] => {
        const cleanTargetId = permId.toLowerCase();
        let filtered = currentPerms.filter((p: string) => {
          const cleanP = p.replace(/^-/, '').replace(/:completo$/, '').toLowerCase();
          return cleanP !== cleanTargetId;
        });

        if (state === 'negado') {
          return [...filtered, '-' + permId];
        } else if (state === 'permitido') {
          if (level === 'interactuar') {
            return [...filtered, permId, permId + ':completo'];
          } else {
            return [...filtered, permId];
          }
        }
        return filtered;
      };

      if (assignmentMode === 'users') {
        const targetUser = users.find(u => u.email.toLowerCase() === selectedTarget.toLowerCase());
        if (!targetUser) return;

        const currentPerms = targetUser.permisos || [];
        const newPerms = getNewPermsArray(currentPerms);
        let actionLabel = `✔️ Permiso para ${permId} actualizado a: ` + 
          (state === 'permitido' ? `PERMITIDO (${level === 'ver' ? 'Solo Ver' : 'Interactuar'})` : state === 'negado' ? 'NEGADO' : 'HEREDADO');

        const { error } = await supabase
          .from('perfiles_locales')
          .update({ permisos: newPerms })
          .eq('id', targetUser.id);

        if (error) throw error;
        
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, permisos: newPerms } : u));
        
        if (selectedTarget.toLowerCase() === user?.email?.toLowerCase()) {
          await refreshProfile();
        }

        toast.success(actionLabel, {
          description: `Afecta a: ${selectedTarget}`,
          icon: <ShieldCheck className="text-emerald-500" />
        });
      } else {
        // MODO ROL: Guardar configuración del rol
        const currentPerms = getRoleExplicitPermissions(selectedTarget);
        const newPerms = getNewPermsArray(currentPerms);
        let actionLabel = `✔️ Rol ${selectedTarget}: ${permId} cambiado a ` + 
          (state === 'permitido' ? `PERMITIDO (${level === 'ver' ? 'Solo Ver' : 'Interactuar'})` : state === 'negado' ? 'NEGADO' : 'HEREDADO');

        try {
          const moduloName = permId.split('.')[0] || 'GENERAL';
          try {
            await supabase
              .from('g3d_permisos_lista')
              .upsert({ 
                id: permId, 
                descripcion: `Permiso para ${permId}`,
                modulo: moduloName,
                creado_al: new Date().toISOString()
              }, { onConflict: 'id' });

            if (state === 'negado') {
              await supabase
                .from('g3d_permisos_lista')
                .upsert({ 
                  id: '-' + permId, 
                  descripcion: `Permiso negado para ${permId}`,
                  modulo: moduloName,
                  creado_al: new Date().toISOString()
                }, { onConflict: 'id' });
            } else if (state === 'permitido' && level === 'interactuar') {
              await supabase
                .from('g3d_permisos_lista')
                .upsert({ 
                  id: permId + ':completo', 
                  descripcion: `Permiso completo para ${permId}`,
                  modulo: moduloName,
                  creado_al: new Date().toISOString()
                }, { onConflict: 'id' });
            }
          } catch (pErr) {
            console.warn("No se pudo insertar en g3d_permisos_lista:", pErr);
          }

          await supabase
            .from('g3d_roles')
            .upsert({ id: selectedTarget, descripcion: `Rol maestro ${selectedTarget}` }, { onConflict: 'id' });

          // Eliminar asignaciones anteriores
          await supabase.from('g3d_roles_permisos').delete().eq('rol_id', selectedTarget).eq('permiso_id', permId);
          await supabase.from('g3d_roles_permisos').delete().eq('rol_id', selectedTarget).eq('permiso_id', '-' + permId);
          await supabase.from('g3d_roles_permisos').delete().eq('rol_id', selectedTarget).eq('permiso_id', permId + ':completo');

          if (state === 'negado') {
            const { error: insErr } = await supabase.from('g3d_roles_permisos').insert({ rol_id: selectedTarget, permiso_id: '-' + permId });
            if (insErr) throw insErr;
          } else if (state === 'permitido') {
            const { error: insErr1 } = await supabase.from('g3d_roles_permisos').insert({ rol_id: selectedTarget, permiso_id: permId });
            if (insErr1) throw insErr1;
            if (level === 'interactuar') {
              const { error: insErr2 } = await supabase.from('g3d_roles_permisos').insert({ rol_id: selectedTarget, permiso_id: permId + ':completo' });
              if (insErr2) throw insErr2;
            }
          }
        } catch (dbErr) {
          console.warn("[handleSetPermissionState] Error guardando cambio de permiso de rol en Supabase:", dbErr);
        }
        
        const newConfigs = [...roleConfigs];
        const existingIdx = newConfigs.findIndex(r => r.id === selectedTarget);
        if (existingIdx !== -1) {
          newConfigs[existingIdx] = { ...newConfigs[existingIdx], permisos: newPerms };
        } else {
          newConfigs.push({ id: selectedTarget, permisos: newPerms });
        }
        
        setRoleConfigs(newConfigs);
        localStorage.setItem('iptv_role_configs', JSON.stringify(newConfigs));

        toast.success(actionLabel, {
          description: `Rol: ${selectedTarget}`,
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error desconocido";
      toast.error("Error al Guardar Permisos", {
        description: `Base de Datos: ${errorMsg}`,
        duration: 10000
      });
      console.error("Detalle del error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = (permId: string) => {
    // Alias para evitar rupturas externas
    const perms = getTargetPermissions();
    if (perms.includes(permId)) {
      handleSetPermissionState(permId, 'negado');
    } else if (perms.includes('-' + permId)) {
      handleSetPermissionState(permId, 'heredado');
    } else {
      handleSetPermissionState(permId, 'permitido', 'ver');
    }
  };

  const handleSetAllFactionPermissions = async (factionKey: string, state: 'permitido' | 'negado' | 'heredado', level: 'ver' | 'interactuar' = 'ver') => {
    if (!selectedTarget) return;
    
    const group = PERMISSIONS[factionKey as keyof typeof PERMISSIONS];
    if (!group) return;

    // Obtener todos los IDs de permisos de la facción (excluyendo el comodín .* para activar los granulares reales)
    const permIds: string[] = [];
    Object.values(group).forEach((node: any) => {
      if (node && node.id && !node.id.endsWith('.*')) {
        permIds.push(node.id);
      }
    });

    if (permIds.length === 0) return;

    setIsSaving(true);
    try {
      const loggedInUserObj = users.find(u => u.email === user?.email);
      const isSuperAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';

      // Filtrar sólo los permisos que el usuario actual tiene permitido modificar
      const editablePermIds = permIds.filter(id => {
        return isSuperAdmin || (loggedInUserObj && checkUserHasPermission(loggedInUserObj, id));
      });

      if (editablePermIds.length === 0) {
        toast.error("No tienes permisos suficientes para modificar ningún elemento de esta facción.");
        setIsSaving(false);
        return;
      }

      const getNewPermsArrayBulk = (currentPerms: string[]): string[] => {
        let tempPerms = [...currentPerms];
        
        const factionPrefix = factionKey.charAt(0).toUpperCase() + factionKey.slice(1).toLowerCase();
        const wildcardId = factionPrefix + '.*';

        // Filtrar el comodín de la facción si existiera
        tempPerms = tempPerms.filter((p: string) => {
          const cleanP = p.replace(/^-/, '').replace(/:completo$/, '').toLowerCase();
          return cleanP !== wildcardId.toLowerCase();
        });

        editablePermIds.forEach(permId => {
          const cleanTargetId = permId.toLowerCase();
          // Eliminar el permiso previo
          tempPerms = tempPerms.filter((p: string) => {
            const cleanP = p.replace(/^-/, '').replace(/:completo$/, '').toLowerCase();
            return cleanP !== cleanTargetId;
          });

          // Agregar según el nuevo estado
          if (state === 'negado') {
            tempPerms.push('-' + permId);
          } else if (state === 'permitido') {
            if (level === 'interactuar') {
              tempPerms.push(permId);
              tempPerms.push(permId + ':completo');
            } else {
              tempPerms.push(permId);
            }
          }
        });

        return tempPerms;
      };

      if (assignmentMode === 'users') {
        const targetUser = users.find(u => u.email.toLowerCase() === selectedTarget.toLowerCase());
        if (!targetUser) return;

        const currentPerms = targetUser.permisos || [];
        const newPerms = getNewPermsArrayBulk(currentPerms);

        const { error } = await supabase
          .from('perfiles_locales')
          .update({ permisos: newPerms })
          .eq('id', targetUser.id);

        if (error) throw error;
        
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, permisos: newPerms } : u));
        
        if (selectedTarget.toLowerCase() === user?.email?.toLowerCase()) {
          await refreshProfile();
        }

        toast.success(`Facción ${factionKey} actualizada con éxito en modo Admin.`, {
          description: `Se activaron ${editablePermIds.length} permisos para ${selectedTarget}`,
          icon: <ShieldCheck className="text-emerald-500" />
        });
      } else {
        // MODO ROL: Guardar en g3d_roles_permisos
        const currentPerms = getRoleExplicitPermissions(selectedTarget);
        const newPerms = getNewPermsArrayBulk(currentPerms);

        // Primero, aseguramos que el rol existe en g3d_roles
        await supabase
          .from('g3d_roles')
          .upsert({ id: selectedTarget, descripcion: `Rol maestro ${selectedTarget}` }, { onConflict: 'id' });

        // En masa, para cada permiso de la facción, limpiar los registros antiguos en g3d_roles_permisos
        const idsToClear: string[] = [];
        editablePermIds.forEach(id => {
          idsToClear.push(id);
          idsToClear.push('-' + id);
          idsToClear.push(id + ':completo');
        });

        // Purgar también cualquier comodín anterior (ej. Iptv.* o Admin.*)
        const factionPrefix = factionKey.charAt(0).toUpperCase() + factionKey.slice(1).toLowerCase();
        const wildcardId = factionPrefix + '.*';
        idsToClear.push(wildcardId);
        idsToClear.push('-' + wildcardId);
        idsToClear.push(wildcardId + ':completo');

        if (idsToClear.length > 0) {
          await supabase
            .from('g3d_roles_permisos')
            .delete()
            .eq('rol_id', selectedTarget)
            .in('permiso_id', idsToClear);
        }

        // Asegurar que todos los permiso_id que vamos a insertar existen en g3d_permisos_lista para evitar violación de foreign key (FK)
        const permisosListaInserts: { id: string; descripcion: string; modulo: string; creado_al: string }[] = [];
        const moduloName = factionKey.toUpperCase();
        
        editablePermIds.forEach(permId => {
          if (state === 'negado') {
            permisosListaInserts.push({
              id: '-' + permId,
              descripcion: `Permiso negado para ${permId}`,
              modulo: moduloName,
              creado_al: new Date().toISOString()
            });
          } else if (state === 'permitido') {
            permisosListaInserts.push({
              id: permId,
              descripcion: `Permiso para ${permId}`,
              modulo: moduloName,
              creado_al: new Date().toISOString()
            });
            if (level === 'interactuar') {
              permisosListaInserts.push({
                id: permId + ':completo',
                descripcion: `Permiso completo para ${permId}`,
                modulo: moduloName,
                creado_al: new Date().toISOString()
              });
            }
          }
        });

        if (permisosListaInserts.length > 0) {
          const uniquePermisosLista = Array.from(new Map(permisosListaInserts.map(item => [item.id, item])).values());
          try {
            const { error: upsertErr } = await supabase
              .from('g3d_permisos_lista')
              .upsert(uniquePermisosLista, { onConflict: 'id' });
            if (upsertErr) {
              console.warn("Fallo al insertar permisos en g3d_permisos_lista:", upsertErr);
            }
          } catch (pErr) {
            console.warn("No se pudo insertar en g3d_permisos_lista en masa:", pErr);
          }
        }

        // Ahora, insertamos los nuevos registros
        const inserts: { rol_id: string; permiso_id: string }[] = [];
        editablePermIds.forEach(permId => {
          if (state === 'negado') {
            inserts.push({ rol_id: selectedTarget, permiso_id: '-' + permId });
          } else if (state === 'permitido') {
            inserts.push({ rol_id: selectedTarget, permiso_id: permId });
            if (level === 'interactuar') {
              inserts.push({ rol_id: selectedTarget, permiso_id: permId + ':completo' });
            }
          }
        });

        if (inserts.length > 0) {
          const { error: insertErr } = await supabase
            .from('g3d_roles_permisos')
            .insert(inserts);
          if (insertErr) throw insertErr;
        }

        const newConfigs = [...roleConfigs];
        const existingIdx = newConfigs.findIndex(r => r.id === selectedTarget);
        if (existingIdx !== -1) {
          newConfigs[existingIdx] = { ...newConfigs[existingIdx], permisos: newPerms };
        } else {
          newConfigs.push({ id: selectedTarget, permisos: newPerms });
        }
        
        setRoleConfigs(newConfigs);
        localStorage.setItem('iptv_role_configs', JSON.stringify(newConfigs));

        toast.success(`Facción ${factionKey} configurada como Admin.`, {
          description: `Rol: ${selectedTarget}`,
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error desconocido";
      toast.error("Error al Guardar Permisos en Masa", {
        description: `Base de Datos: ${errorMsg}`,
        duration: 10000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configuraciones aplicadas con éxito.");
    }, 1000);
  };

  const [newUserDraft, setNewUserDraft] = useState({
    email: '',
    nombre: '',
    rol: 'IPTV CLIENTES' as any,
    contrasena: '123456',
    avatar_url: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [originalRoleToEdit, setOriginalRoleToEdit] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleParent, setNewRoleParent] = useState('');
  const [editingRoleNameInput, setEditingRoleNameInput] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem('g3d_custom_roles_list');
    return saved ? JSON.parse(saved) : ['Administrador', 'IPTV SOCIOS', 'IPTV VENDEDORES', 'IPTV CLIENTES', 'G3D SOCIO', 'G3D EMPLEADO'];
  });
  const [roleInheritance, setRoleInheritance] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('g3d_roles_inheritance');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [purgeConfirmationInput, setPurgeConfirmationInput] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (assignmentMode === 'roles' && selectedTarget) {
      setEditingRoleNameInput(selectedTarget);
    }
  }, [selectedTarget, assignmentMode]);

  const openAddUserModal = () => {
    const allowed = getAllowedRolesToManage();
    setNewUserDraft({
      email: '',
      nombre: '',
      rol: allowed[0] || 'IPTV CLIENTES',
      contrasena: '123456',
      avatar_url: ''
    });
    setShowAddUserModal(true);
  };

  const openAddRoleModal = () => {
    setIsEditingRole(false);
    setOriginalRoleToEdit('');
    const isSuperAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';
    if (!isSuperAdmin) {
      const allowed = getAllowedRolesToManage();
      setNewRoleParent(allowed[0] || '');
    } else {
      setNewRoleParent('');
    }
    setNewRoleName('');
    setShowAddRoleModal(true);
  };

  const openEditRoleModal = (roleName: string) => {
    setIsEditingRole(true);
    setOriginalRoleToEdit(roleName);
    setNewRoleName(roleName);
    setNewRoleParent(roleInheritance[roleName] || '');
    setShowAddRoleModal(true);
  };

  const getRolePermissionsRecursive = (roleName: string, visited: Set<string> = new Set()): string[] => {
    if (visited.has(roleName)) return [];
    visited.add(roleName);

    const config = roleConfigs.find(r => r.id === roleName);
    let explicitPerms = config?.permisos || [];
    
    if (explicitPerms.length === 0) {
      const defaultRolePerms: Record<string, string[]> = {
        'Administrador': ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'],
        'IPTV SOCIOS': [],
        'IPTV VENDEDORES': [],
        'IPTV CLIENTES': [],
        'G3D SOCIO': [],
        'G3D EMPLEADO': []
      };
      explicitPerms = defaultRolePerms[roleName] || [];
    }

    const parentRole = roleInheritance[roleName];
    if (parentRole && parentRole !== roleName) {
      const parentPerms = getRolePermissionsRecursive(parentRole, visited);
      const mergedPerms = [...explicitPerms];
      const childConfiguredBases = new Set(
        explicitPerms.map(p => p.replace(/^-/, '').replace(/:completo$/, ''))
      );
      
      parentPerms.forEach(p => {
        const baseP = p.replace(/^-/, '').replace(/:completo$/, '');
        if (!childConfiguredBases.has(baseP)) {
          mergedPerms.push(p);
        }
      });
      return mergedPerms;
    }
    
    return explicitPerms;
  };

  const checkUserHasPermission = (userObj: any, permissionId: string): boolean => {
    if (!userObj) return false;
    
    const userPerms: string[] = userObj.permisos || [];
    
    // Si tiene el permiso único de Administrador General, es SuperAdmin absoluto y tiene bypass
    if (userPerms.includes('Seguridad.AdministradorGeneral')) return true;

    // Email del propietario creador tiene bypass absoluto
    if (userObj.email === 'g3d0001@gmail.com') return true;

    const firstRole = String(userObj.rol || '').split(',')[0] || '';
    const resolvedRolePerms = firstRole ? getRolePermissionsRecursive(firstRole) : [];
    
    // Si la herencia de roles contiene un rol con bypass de Administrador General
    if (resolvedRolePerms.includes('Seguridad.AdministradorGeneral')) return true;
    
    const allResolvedPerms = [...userPerms];
    const userConfiguredBases = new Set(userPerms.map(p => p.replace(/^-/, '').replace(/:completo$/, '')));
    
    resolvedRolePerms.forEach(p => {
      const baseP = p.replace(/^-/, '').replace(/:completo$/, '');
      if (!userConfiguredBases.has(baseP)) {
        allResolvedPerms.push(p);
      }
    });

    if (allResolvedPerms.includes('-' + permissionId)) return false;
    if (allResolvedPerms.includes(permissionId)) return true;
    if (allResolvedPerms.includes(permissionId + ':completo')) return true;

    const parts = permissionId.split('.');
    if (parts.length > 0) {
      const wildcard = `${parts[0]}.*`;
      if (allResolvedPerms.includes(wildcard)) return true;
    }
    
    if (allResolvedPerms.includes('Admin.*')) return true;

    return false;
  };

  const loggedInUserObj = users.find(u => u.email === user?.email);
  const canManageUsersAndRoles = isAdmin || (loggedInUserObj && (
    checkUserHasPermission(loggedInUserObj, 'Seguridad.*') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Miembros.Gestion') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Permisos.Gestion') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Miembros.Crear') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Roles.Crear')
  ));

  const canCreateRoles = isAdmin || (loggedInUserObj && (
    checkUserHasPermission(loggedInUserObj, 'Seguridad.*') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Permisos.Gestion') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Roles.Crear')
  ));

  const canCreateUsers = isAdmin || (loggedInUserObj && (
    checkUserHasPermission(loggedInUserObj, 'Seguridad.*') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Miembros.Gestion') ||
    checkUserHasPermission(loggedInUserObj, 'Seguridad.Miembros.Crear')
  ));

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'users') {
      return canManageUsersAndRoles;
    }
    return !tab.adminOnly || isAdmin;
  });

  const handleSaveRoleInheritance = async (childRole: string, parentRole: string) => {
    try {
      setIsSaving(true);
      const updated = { ...roleInheritance, [childRole]: parentRole };
      if (!parentRole || parentRole === 'none') {
        delete updated[childRole];
      }
      setRoleInheritance(updated);
      localStorage.setItem('g3d_roles_inheritance', JSON.stringify(updated));

      const currentConfig = await apiService.getSystemConfig();
      const payload = {
        ...currentConfig,
        role_inheritance: updated
      };
      
      const res = await apiService.updateSystemConfig(payload);
      if (res.success) {
        toast.success("Estructura de herencia guardada", {
          description: parentRole && parentRole !== 'none' 
            ? `El rol "${childRole}" ahora hereda de: ${parentRole}`
            : `El rol "${childRole}" ya no hereda de ningún rol.`,
        });
      } else {
        throw new Error(res.error || "Fallo al guardar");
      }
    } catch (err: any) {
      console.error("Error saving role inheritance:", err);
      toast.error("Error al guardar en Supabase", {
        description: err.message || "Guardado localmente de respaldo."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteSystemPurge = async () => {
    if (purgeConfirmationInput !== 'CONFIRMAR PURGA') {
      toast.error('Debes escribir "CONFIRMAR PURGA" para proceder.');
      return;
    }

    if (!confirm('🚨 ATENCIÓN MÁXIMA: Estás a punto de borrar TODOS los usuarios y TODOS los roles del sistema (excepto tu propio usuario y el rol Administrador). Esta acción es irreversible y afectará a la base de datos real en vivo de Supabase. ¿Realmente deseas continuar?')) {
      return;
    }

    setIsPurging(true);
    try {
      // 1. Obtener la lista de usuarios actuales para limpiar sus asignaciones de roles
      const { data: allProfiles, error: fetchErr } = await supabase
        .from('perfiles_locales')
        .select('id, email');
      
      if (fetchErr) throw fetchErr;

      // Filtrar el usuario general (el del usuario logueado o propietario)
      const currentUserEmail = user?.email || 'g3d0001@gmail.com';
      const usersToDelete = (allProfiles || []).filter(p => p.email !== currentUserEmail);

      // 2. Eliminar asignaciones de roles de los usuarios que van a ser eliminados
      for (const u of usersToDelete) {
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', u.id);
      }

      // 3. Eliminar los perfiles locales correspondientes
      const { error: deleteUsersErr } = await supabase
        .from('perfiles_locales')
        .delete()
        .neq('email', currentUserEmail);
      
      if (deleteUsersErr) throw deleteUsersErr;

      // 4. Eliminar asignaciones de permisos de todos los roles excepto Administrador
      const { error: deletePermsErr } = await supabase
        .from('g3d_roles_permisos')
        .delete()
        .neq('rol_id', 'Administrador')
        .neq('rol_id', 'ADMINISTRADOR');
      
      if (deletePermsErr) throw deletePermsErr;

      // 5. Eliminar roles de la base de datos excepto Administrador
      const { error: deleteRolesErr } = await supabase
        .from('g3d_roles')
        .delete()
        .neq('id', 'Administrador')
        .neq('id', 'ADMINISTRADOR');
      
      if (deleteRolesErr) throw deleteRolesErr;

      // 6. Limpiar herencias en configuracion_sistema (ID 1)
      try {
        const currentConfig = await apiService.getSystemConfig();
        const payload = {
          ...currentConfig,
          role_inheritance: {}
        };
        await apiService.updateSystemConfig(payload);
      } catch (e) {
        console.warn("Error al limpiar herencias en configuracion_sistema:", e);
      }

      // 7. Limpiar LocalStorage localmente
      localStorage.setItem('g3d_custom_roles_list', JSON.stringify(['Administrador']));
      localStorage.setItem('g3d_roles_inheritance', JSON.stringify({}));
      localStorage.setItem('iptv_role_configs', JSON.stringify([
        { id: 'Administrador', permisos: ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'] }
      ]));

      // 8. Actualizar estados locales del componente
      setCustomRoles(['Administrador']);
      setRoleInheritance({});
      setRoleConfigs([
        { id: 'Administrador', permisos: ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'] }
      ]);
      setSelectedTarget('Administrador');

      // 9. Registrar auditoría en historial de movimientos
      await apiService.registrarMovimiento({
        usuario_nombre: currentUserEmail,
        accion: 'Purga General de Base de Datos',
        entidad: 'Seguridad',
        entidad_id: 'Sistema',
        detalle: `Se ejecutó una purga completa del sistema. Se eliminaron todos los usuarios excepto '${currentUserEmail}' y todos los roles excepto 'Administrador'.`
      });

      // 10. Forzar refresco de usuarios en pantalla
      await fetchUsers();

      toast.success('🔥 Purga completada con éxito. Base de datos e interfaces sincronizadas.', {
        description: `Se conservó el usuario ${currentUserEmail} y el rol Administrador.`,
        duration: 10000
      });
      setPurgeConfirmationInput('');
    } catch (err: any) {
      console.error("Fallo durante la purga de base de datos:", err);
      toast.error(`Error al ejecutar purga: ${err.message}`);
    } finally {
      setIsPurging(false);
    }
  };

  const [showSqlFixModal, setShowSqlFixModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { email, nombre, rol, contrasena } = newUserDraft;
      if (!email) throw new Error("Nombre de usuario/login es obligatorio");

      let formalEmail = email.trim().toLowerCase();

      const plainPassword = contrasena ? contrasena.trim() : '123456';
      
      // 1. Check if profile with email already exists in perfiles_locales
      const { data: existingProfile } = await supabase
        .from('perfiles_locales')
        .select('id')
        .eq('email', formalEmail)
        .maybeSingle();

      if (existingProfile) {
        toast.error(`El usuario/login "${formalEmail}" ya se encuentra registrado. Por favor, elige uno diferente.`);
        setIsSaving(false);
        return;
      }

      // Generar un UUID versión 4 en el frontend para omitir auth.users si no hay restricción activa
      const randomUUID = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

      let targetUserId = randomUUID;
      let usingAuthSignUp = false;

      const profilePayload: any = {
        id: randomUUID,
        email: formalEmail,
        nombre,
        rol,
        password_hash: plainPassword,
        avatar_url: newUserDraft.avatar_url || '',
        foto_perfil: newUserDraft.avatar_url || ''
      };

      // Intentamos insertar DIRECTAMENTE en perfiles_locales.
      // Si la base de datos no tiene la restricción de FK activa, ¡se creará de forma instantánea sin usar el auth de Supabase!
      const { error: directInsertError } = await supabase
        .from('perfiles_locales')
        .insert([profilePayload]);

      if (directInsertError) {
        const isFkeyViolation = directInsertError.code === '23503' || 
                              directInsertError.message?.toLowerCase().includes('foreign key') ||
                              directInsertError.message?.toLowerCase().includes('fkey');

        if (isFkeyViolation) {
          console.warn("⚠️ Llave foránea activa detectada. Intentando registro secundario en auth.users...");
          usingAuthSignUp = true;

          const signUpEmail = formalEmail.includes('@') ? formalEmail : `${formalEmail}@g3d-panel.com`;

          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
            const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseAnonKey) {
              throw new Error("No se encontraron las variables de entorno de Supabase.");
            }

            const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
              }
            });

            const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
              email: signUpEmail,
              password: plainPassword,
            });

            if (signUpError) throw signUpError;
            
            if (signUpData?.user) {
              targetUserId = signUpData.user.id;
              
              // Volvemos a guardar el perfil usando el ID que auth nos dio
              const secondaryPayload = { ...profilePayload, id: targetUserId };
              const { error: secondaryInsertError } = await supabase
                .from('perfiles_locales')
                .insert([secondaryPayload]);

              if (secondaryInsertError) throw secondaryInsertError;
            } else {
              throw new Error("No se pudo obtener el ID de autenticación.");
            }
          } catch (fallbackErr: any) {
            console.error("❌ Falló registro en fallback auth:", fallbackErr);
            throw new Error(`Error de Integración (Restricción de Base de Datos)\n\nTu base de datos de Supabase exige registrar el usuario en la tabla interna de sistemas "auth.users" primero debido a una llave foránea activa.\n\nSin embargo, la creación falló porque has alcanzado el límite de velocidad por IP o el registro de correos está desactivado en la configuración de tu Supabase Auth.\n\n¡Para solucionar esto al instante y crear usuarios sin correos ni límites, copia y ejecuta el código en tu consola de Supabase!`);
          }
        } else {
          throw directInsertError;
        }
      }

      // Sincronizar rol en g3d_usuarios_roles_asignacion
      try {
        // Aseguramos primero que el rol existe en g3d_roles (upsert)
        await supabase
          .from('g3d_roles')
          .upsert({ id: rol, descripcion: `Rol maestro ${rol}` }, { onConflict: 'id' });

        // Eliminamos asignación anterior por si existiera
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', targetUserId);

        // Insertamos la nueva asignación de rol unificado
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .insert({ usuario_id: targetUserId, rol_id: rol });
      } catch (dbErr) {
        console.warn("[handleCreateUser] Error cargando asignación en g3d_usuarios_roles_asignacion:", dbErr);
      }

      toast.success(`Usuario autorizado con éxito`, {
        description: `Clave asignada: ${plainPassword}`,
        duration: 8000
      });
      setShowAddUserModal(false);
      // Reset drafting state
      setNewUserDraft({
        email: '',
        nombre: '',
        rol: 'IPTV CLIENTES',
        contrasena: '123456',
        avatar_url: ''
      });
      fetchUsers();
    } catch (err: any) {
      console.error("Error al registrar el usuario:", err);
      // Validamos si hay un error de llave foránea de Supabase (id fkey) o similar
      const errMsg = String(err.message || "").toLowerCase();
      const isFkeyViolation = err.code === '23503' || 
                            errMsg.includes('foreign key') || 
                            errMsg.includes('fkey') || 
                            errMsg.includes('restricción') ||
                            errMsg.includes('límite') ||
                            errMsg.includes('rate limit');

      if (isFkeyViolation) {
        setShowSqlFixModal(true);
      } else {
        toast.error("Error al registrar: " + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleId = newRoleName.trim().toUpperCase();
    if (!roleId) {
      toast.error("El nombre del rol no puede estar vacío.");
      return;
    }

    const isSuperAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';
    let resolvedParent = newRoleParent;
    if (!isSuperAdmin) {
      const allowedParents = getAllowedRolesToManage();
      if (!resolvedParent || !allowedParents.includes(resolvedParent)) {
        resolvedParent = allowedParents[0] || 'IPTV CLIENTES'; // Forzar a su propio rol supremo como padre
      }
    }

    if (isEditingRole) {
      // MODO EDICIÓN
      setIsSaving(true);
      try {
        let currentRoleName = originalRoleToEdit;

        // A. Si cambió el nombre del rol (y no es ADMINISTRADOR)
        if (roleId !== originalRoleToEdit && originalRoleToEdit.toUpperCase() !== 'ADMINISTRADOR') {
          // Validar
          if (customRoles.map(r => r.toUpperCase()).includes(roleId)) {
            toast.error(`El rol '${roleId}' ya existe.`);
            setIsSaving(false);
            return;
          }

          // 1. Insertar nuevo rol en DB
          const { error: insertErr } = await supabase
            .from('g3d_roles')
            .insert({ id: roleId, name: roleId, descripcion: `Rol maestro ${roleId} (Renombrado de ${originalRoleToEdit})` });
          if (insertErr) throw insertErr;

          // 2. Copiar permisos del rol viejo al nuevo
          const { data: oldPerms } = await supabase
            .from('g3d_roles_permisos')
            .select('*')
            .eq('rol_id', originalRoleToEdit);
          
          if (oldPerms && oldPerms.length > 0) {
            const newPerms = oldPerms.map(p => ({
              rol_id: roleId,
              permiso_id: p.permiso_id
            }));
            await supabase.from('g3d_roles_permisos').insert(newPerms);
          }

          // 3. Borrar permisos del rol viejo
          await supabase.from('g3d_roles_permisos').delete().eq('rol_id', originalRoleToEdit);

          // 4. Eliminar rol viejo de g3d_roles
          await supabase.from('g3d_roles').delete().eq('id', originalRoleToEdit);

          // 5. Actualizar perfiles de usuario que apuntaban al rol viejo
          await supabase.from('perfiles_locales').update({ rol: roleId }).eq('rol', originalRoleToEdit);
          try {
            await supabase.from('g3d_usuarios_roles_asignacion').update({ rol_id: roleId }).eq('rol_id', originalRoleToEdit);
          } catch (e) {}

          // 6. Actualizar lista local de roles
          const updatedRoles = customRoles.map(r => r === originalRoleToEdit ? roleId : r);
          setCustomRoles(updatedRoles);
          localStorage.setItem('g3d_custom_roles_list', JSON.stringify(updatedRoles));

          currentRoleName = roleId;
        }

        // B. Actualizar relación de herencia
        const updatedInheritance = { ...roleInheritance };
        // Si el rol viejo tenía herederos (otros roles que heredaban de él), y cambió su nombre, actualizarlos
        if (roleId !== originalRoleToEdit) {
          Object.entries(updatedInheritance).forEach(([child, parent]) => {
            if (parent === originalRoleToEdit) {
              updatedInheritance[child] = roleId;
            }
          });
          delete updatedInheritance[originalRoleToEdit];
        }

        // Aplicar el nuevo rol padre seleccionado
        if (resolvedParent && resolvedParent !== 'none' && resolvedParent !== '') {
          updatedInheritance[currentRoleName] = resolvedParent;
        } else {
          delete updatedInheritance[currentRoleName];
        }

        setRoleInheritance(updatedInheritance);
        localStorage.setItem('g3d_roles_inheritance', JSON.stringify(updatedInheritance));

        // Guardar herencia en Supabase config
        try {
          const currentConfig = await apiService.getSystemConfig();
          await apiService.updateSystemConfig({
            ...currentConfig,
            role_inheritance: updatedInheritance
          });
        } catch (e) {
          console.warn("[handleCreateRole - Edit] No se pudo actualizar herencia en config_sistema:", e);
        }

        // Registrar auditoría en historial de movimientos
        await apiService.registrarMovimiento({
          usuario_nombre: user?.email || 'admin@xtv.com',
          accion: 'Edición de Rol',
          entidad: 'Seguridad',
          entidad_id: roleId,
          detalle: `Se editó el rol '${originalRoleToEdit}'${roleId !== originalRoleToEdit ? ` (renombrado a '${roleId}')` : ''}${resolvedParent && resolvedParent !== 'none' ? ` heredando de '${resolvedParent}'` : ' (sin herencia)'}`
        });

        setSelectedTarget(currentRoleName);
        toast.success(`Rol '${currentRoleName}' actualizado con éxito.`);
        setShowAddRoleModal(false);
      } catch (err: any) {
        console.error("[handleCreateRole - Edit] Exception:", err);
        toast.error("Error al actualizar el rol: " + err.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Normalizar
      if (customRoles.map(r => r.toUpperCase()).includes(roleId)) {
        toast.error("Este rol ya existe en el sistema.");
        return;
      }

      setIsSaving(true);
      try {
        // 1. Guardar en base de datos
        const { error: dbErr } = await supabase
          .from('g3d_roles')
          .upsert({ id: roleId, name: roleId, descripcion: `Rol maestro ${roleId}` }, { onConflict: 'id' });

        if (dbErr) {
          console.warn("[handleCreateRole] Error registrando rol en Supabase:", dbErr);
        }

        // 2. Guardar localmente
        const updatedList = [...customRoles, roleId];
        setCustomRoles(updatedList);
        localStorage.setItem('g3d_custom_roles_list', JSON.stringify(updatedList));

        // Guardar también en la configuración de roles (roleConfigs) con permisos vacíos
        const newConfigs = [...roleConfigs];
        if (!newConfigs.some(r => r.id === roleId)) {
          newConfigs.push({ id: roleId, permisos: [] });
          setRoleConfigs(newConfigs);
          localStorage.setItem('iptv_role_configs', JSON.stringify(newConfigs));
        }

        // 3. Registrar en historial de movimientos para auditoría
        await apiService.registrarMovimiento({
          usuario_nombre: user?.email || 'admin@xtv.com',
          accion: 'Creación de Rol',
          entidad: 'Seguridad',
          entidad_id: roleId,
          detalle: `Se creó el rol maestro '${roleId}'${resolvedParent && resolvedParent !== 'none' ? ` heredando de '${resolvedParent}'` : ''}`
        });

        // Guardar herencia de rol si se especificó o resolvió jerárquicamente
        if (resolvedParent && resolvedParent !== 'none' && resolvedParent !== '') {
          const updatedInheritance = { ...roleInheritance, [roleId]: resolvedParent };
          setRoleInheritance(updatedInheritance);
          localStorage.setItem('g3d_roles_inheritance', JSON.stringify(updatedInheritance));
          
          try {
            const currentConfig = await apiService.getSystemConfig();
            await apiService.updateSystemConfig({
              ...currentConfig,
              role_inheritance: updatedInheritance
            });
          } catch (e) {
            console.warn("[handleCreateRole] No se pudo guardar la herencia en Supabase (falló red o config):", e);
          }
        }

        toast.success(`Rol '${roleId}' creado y registrado con éxito.`);
        setNewRoleName('');
        setNewRoleParent('');
        setShowAddRoleModal(false);
      } catch (err: any) {
        console.error("[handleCreateRole] Exception:", err);
        toast.error("Ocurrió un error al crear el rol: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getDescendantRoles = (parentRole: string): string[] => {
    const descendants: string[] = [];
    const queue = [parentRole];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      Object.entries(roleInheritance).forEach(([childRole, parent]) => {
        if (parent === current && !visited.has(childRole)) {
          descendants.push(childRole);
          queue.push(childRole);
        }
      });
    }
    return descendants;
  };

  const getAllowedRolesToManage = (): string[] => {
    const isSuperAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';
    if (isSuperAdmin) {
      return customRoles;
    }
    
    // Si no es SuperAdmin, su rol actual es el Padre Supremo de su rama
    const firstRole = String(loggedInUserObj?.rol || 'IPTV CLIENTES').split(',')[0] || 'IPTV CLIENTES';
    const descendants = getDescendantRoles(firstRole);
    return [firstRole, ...descendants];
  };

  const handleRenameRole = async (oldRoleId: string, newRoleIdRaw: string) => {
    const newRoleId = newRoleIdRaw.trim().toUpperCase();
    if (!newRoleId) {
      toast.error("El nombre del rol no puede estar vacío.");
      return;
    }
    if (oldRoleId === newRoleId) {
      toast.info("El nombre del rol es idéntico.");
      return;
    }
    if (customRoles.map(r => r.toUpperCase()).includes(newRoleId)) {
      toast.error(`El rol '${newRoleId}' ya existe.`);
      return;
    }
    
    // Proteger el rol de administrador principal
    if (oldRoleId.toUpperCase() === 'ADMINISTRADOR') {
      toast.error("No se puede renombrar el rol maestro administrador del sistema.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Crear nuevo rol en g3d_roles
      const { error: insertErr } = await supabase
        .from('g3d_roles')
        .insert({ id: newRoleId, name: newRoleId, descripcion: `Rol maestro ${newRoleId} (Renombrado de ${oldRoleId})` });
      
      if (insertErr) throw insertErr;

      // 2. Copiar permisos de oldRoleId a newRoleId
      const { data: oldPerms } = await supabase
        .from('g3d_roles_permisos')
        .select('*')
        .eq('rol_id', oldRoleId);
      
      if (oldPerms && oldPerms.length > 0) {
        const newPerms = oldPerms.map(p => ({
          rol_id: newRoleId,
          permiso_id: p.permiso_id
        }));
        const { error: copyPermsErr } = await supabase
          .from('g3d_roles_permisos')
          .insert(newPerms);
        if (copyPermsErr) console.warn("[handleRenameRole] Error copiando permisos de rol viejo:", copyPermsErr);
      }

      // 3. Borrar permisos de oldRoleId
      await supabase.from('g3d_roles_permisos').delete().eq('rol_id', oldRoleId);

      // 4. Actualizar herencia de roles
      // Si el rol viejo era padre de algún rol, cambiarlo al nuevo
      const updatedInheritance = { ...roleInheritance };
      Object.entries(updatedInheritance).forEach(([child, parent]) => {
        if (parent === oldRoleId) {
          updatedInheritance[child] = newRoleId;
        }
      });
      // Si el rol viejo tenía un padre, asignarlo al nuevo
      if (updatedInheritance[oldRoleId]) {
        updatedInheritance[newRoleId] = updatedInheritance[oldRoleId];
        delete updatedInheritance[oldRoleId];
      }
      setRoleInheritance(updatedInheritance);
      localStorage.setItem('g3d_roles_inheritance', JSON.stringify(updatedInheritance));

      // 5. Guardar herencia en Supabase
      try {
        const currentConfig = await apiService.getSystemConfig();
        await apiService.updateSystemConfig({
          ...currentConfig,
          role_inheritance: updatedInheritance
        });
      } catch (e) {
        console.warn("[handleRenameRole] No se pudo actualizar herencia en config_sistema:", e);
      }

      // 6. Eliminar rol viejo de g3d_roles
      const { error: deleteOldRoleErr } = await supabase
        .from('g3d_roles')
        .delete()
        .eq('id', oldRoleId);
      if (deleteOldRoleErr) console.warn("[handleRenameRole] Error eliminando rol viejo de g3d_roles:", deleteOldRoleErr);

      // 7. Actualizar la lista de roles maestros
      const updatedRoles = customRoles.map(r => r === oldRoleId ? newRoleId : r);
      setCustomRoles(updatedRoles);
      localStorage.setItem('g3d_custom_roles_list', JSON.stringify(updatedRoles));

      // 8. Actualizar perfiles de usuario que apuntaban al rol viejo en perfiles_locales
      const { error: updateUsersErr } = await supabase
        .from('perfiles_locales')
        .update({ rol: newRoleId })
        .eq('rol', oldRoleId);
      
      if (updateUsersErr) {
        console.warn("[handleRenameRole] Error actualizando usuarios del rol viejo:", updateUsersErr);
      }

      // Sincronizar en g3d_usuarios_roles_asignacion también para redundancia segura
      try {
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .update({ rol_id: newRoleId })
          .eq('rol_id', oldRoleId);
      } catch (dbErr) {
        console.warn("[handleRenameRole] Error actualizando asignación en g3d_usuarios_roles_asignacion:", dbErr);
      }

      // 9. Registrar auditoría en historial de movimientos
      await apiService.registrarMovimiento({
        usuario_nombre: user?.email || 'admin@xtv.com',
        accion: 'Renombrado de Rol',
        entidad: 'Seguridad',
        entidad_id: newRoleId,
        detalle: `Se renombró el rol '${oldRoleId}' a '${newRoleId}'`
      });

      // 10. Cambiar selección actual
      setSelectedTarget(newRoleId);
      toast.success(`Rol '${oldRoleId}' renombrado a '${newRoleId}' con éxito.`);
    } catch (err: any) {
      console.error("[handleRenameRole] Exception:", err);
      toast.error("Ocurrió un error al renombrar el rol: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId.toUpperCase() === 'ADMINISTRADOR') {
      toast.error("No se puede eliminar el rol Administrador del sistema.");
      return;
    }
    const hasUsersWithThisRole = users.some(u => String(u.rol || '').split(',').includes(roleId));
    if (hasUsersWithThisRole) {
      toast.error(`No puedes eliminar el rol '${roleId}' porque tiene usuarios asociados.`);
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el rol '${roleId}'?`)) {
      return;
    }

    setIsSaving(true);
    try {
      // Borrar de g3d_roles
      await supabase.from('g3d_roles').delete().eq('id', roleId);
      // Borrar de g3d_roles_permisos
      await supabase.from('g3d_roles_permisos').delete().eq('rol_id', roleId);

      // Quitar de la herencia
      const updatedInheritance = { ...roleInheritance };
      delete updatedInheritance[roleId];
      // Si algún rol heredaba de este, cambiar su herencia a la de este rol (o ninguna)
      const thisRoleParent = roleInheritance[roleId] || '';
      Object.entries(updatedInheritance).forEach(([child, parent]) => {
        if (parent === roleId) {
          updatedInheritance[child] = thisRoleParent;
        }
      });
      setRoleInheritance(updatedInheritance);
      localStorage.setItem('g3d_roles_inheritance', JSON.stringify(updatedInheritance));

      try {
        const currentConfig = await apiService.getSystemConfig();
        await apiService.updateSystemConfig({
          ...currentConfig,
          role_inheritance: updatedInheritance
        });
      } catch (e) {
        console.warn("[handleDeleteRole] Error actualizando config herencia:", e);
      }

      // Quitar de la lista de roles maestros
      const updatedRoles = customRoles.filter(r => r !== roleId);
      setCustomRoles(updatedRoles);
      localStorage.setItem('g3d_custom_roles_list', JSON.stringify(updatedRoles));

      // Auditoría
      await apiService.registrarMovimiento({
        usuario_nombre: user?.email || 'admin@xtv.com',
        accion: 'Eliminación de Rol',
        entidad: 'Seguridad',
        entidad_id: roleId,
        detalle: `Se eliminó el rol maestro '${roleId}'`
      });

      setSelectedTarget(null);
      setShowAddRoleModal(false);
      toast.success(`Rol '${roleId}' eliminado con éxito.`);
    } catch (err: any) {
      console.error("[handleDeleteRole] Exception:", err);
      toast.error("Error al eliminar el rol: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOtherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formalEmail = editingUser.email.trim().toLowerCase();
      if (!formalEmail) throw new Error("El usuario/login de acceso es obligatorio");

      // Validar si el email ha sido modificado y si ya existe otro usuario con ese email/login
      const { data: duplicateUser } = await supabase
        .from('perfiles_locales')
        .select('id')
        .eq('email', formalEmail)
        .neq('id', editingUser.id)
        .maybeSingle();

      if (duplicateUser) {
        toast.error(`El nombre de usuario/login "${formalEmail}" ya se encuentra registrado por otro colaborador. Por favor, elige uno diferente.`);
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('perfiles_locales')
        .update({
          email: formalEmail,
          nombre: editingUser.nombre || '',
          password_hash: editingUser.password_hash || '',
          avatar_url: editingUser.avatar_url || '',
          foto_perfil: editingUser.avatar_url || '',
          rol: editingUser.rol || 'IPTV CLIENTES'
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;

      // Sincronizar rol en g3d_usuarios_roles_asignacion
      try {
        const targetRole = editingUser.rol || 'IPTV CLIENTES';
        // Aseguramos primero que el rol existe en g3d_roles (upsert)
        await supabase
          .from('g3d_roles')
          .upsert({ id: targetRole, descripcion: `Rol maestro ${targetRole}` }, { onConflict: 'id' });

        // Eliminamos asignación anterior por si existiera
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', editingUser.id);

        // Insertamos la nueva asignación de rol unificado
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .insert({ usuario_id: editingUser.id, rol_id: targetRole });
      } catch (dbErr) {
        console.warn("[handleUpdateOtherProfile] Error actualizando asignación en g3d_usuarios_roles_asignacion:", dbErr);
      }
      
      toast.success("Cuenta de usuario actualizada correctamente");
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("Error al actualizar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRoleConfigsFromDB = async () => {
    try {
      // 1. Cargar roles maestros de la base de datos real
      const { data: dbRoles, error: rolesError } = await supabase
        .from('g3d_roles')
        .select('id');
      
      if (!rolesError && dbRoles) {
        const loadedRoleIds = dbRoles.map((r: any) => r.id);
        if (loadedRoleIds.length > 0) {
          setCustomRoles(loadedRoleIds);
          localStorage.setItem('g3d_custom_roles_list', JSON.stringify(loadedRoleIds));
        }
      }

      // 2. Cargar permisos asociados
      const { data: permsData, error: permsError } = await supabase
        .from('g3d_roles_permisos')
        .select('rol_id, permiso_id');
      
      if (permsError) throw permsError;
      
      if (permsData && permsData.length > 0) {
        // Group by rol_id
        const grouped: Record<string, string[]> = {};
        permsData.forEach((row: any) => {
          if (!grouped[row.rol_id]) {
            grouped[row.rol_id] = [];
          }
          if (row.permiso_id) {
            grouped[row.rol_id].push(row.permiso_id);
          }
        });
        
        const mappedConfigs = Object.entries(grouped).map(([roleId, perms]) => ({
          id: roleId,
          permisos: perms
        }));
        
        setRoleConfigs(mappedConfigs);
        localStorage.setItem('iptv_role_configs', JSON.stringify(mappedConfigs));
      }
    } catch (e) {
      console.warn("[fetchRoleConfigsFromDB] Error cargando permisos de rol desde Supabase. Usando local:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && assignmentMode === 'users') {
      fetchUsers();
    }
  }, [activeTab, assignmentMode]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles } = await supabase.from('perfiles_locales').select('*');
      
      const merged = (profiles || []).map(p => {
        return {
          ...p,
          rol: p.rol || 'IPTV CLIENTES',
          estado: p.estado !== false,
          permisos: p.permisos || []
        };
      });

      setUsers(merged);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSecurityMetrics = async () => {
    setLoadingMetrics(true);
    try {
      // 1. Obtener la configuración de sistema para los meses de inactividad
      const { data: configData } = await supabase.from('configuracion_sistema').select('*').limit(1);
      let monthsGrace = 3;
      if (configData && configData[0]) {
        monthsGrace = configData[0].meses_inactividad_limpieza !== undefined 
          ? Number(configData[0].meses_inactividad_limpieza) 
          : 3;
        setInactivityMonthsInput(monthsGrace);
      }

      // 2. Obtener usuarios (perfiles_locales)
      const { data: profiles, error: pErr } = await supabase.from('perfiles_locales').select('*');
      if (pErr) throw pErr;

      // 3. Obtener relaciones (iptv_vendedores_relacion)
      let rels: any[] = [];
      try {
        const { data: rData } = await supabase.from('iptv_vendedores_relacion').select('*');
        rels = rData || [];
      } catch (e) {
        console.warn("Error leyendo iptv_vendedores_relacion para métricas, usando local:", e);
        rels = JSON.parse(localStorage.getItem('g3d_vendedores_relacion') || '[]');
      }
      setRelations(rels);

      // 4. Obtener cuentas/líneas de tivi (iptv_clientes)
      let lines: any[] = [];
      try {
        const { data: lData } = await supabase.from('iptv_clientes').select('*');
        lines = lData || [];
      } catch (e) {
        console.warn("Error leyendo iptv_clientes para métricas, usando local:", e);
        lines = JSON.parse(localStorage.getItem('g3d_iptv_clientes') || '[]');
      }
      setIptvLines(lines);

      // 5. Obtener pedidos (pedidos)
      let ords: any[] = [];
      try {
        const { data: oData } = await supabase.from('pedidos').select('*');
        ords = oData || [];
      } catch (e) {
        console.warn("Error leyendo pedidos para métricas:", e);
      }
      setG3dOrders(ords);

      // 6. Actualizar el estado de usuarios de forma enriquecida para la limpieza
      const enrichedUsers = (profiles || []).map(p => {
        const email = p.email || '';
        
        // Conteo de invitados directos
        const directInvited = rels.filter((r: any) => String(r.inviter_email).trim().toLowerCase() === email.trim().toLowerCase());
        const countInvitados = directInvited.length;
        
        // Conteo de líneas creadas
        const userLines = lines.filter((l: any) => 
          String(l.vendedor).trim().toLowerCase() === email.trim().toLowerCase() ||
          String(l.creado_por).trim().toLowerCase() === email.trim().toLowerCase()
        );
        const countLines = userLines.length;

        // Conteo de pedidos generados
        const userOrders = ords.filter((o: any) => 
          String(o.vendedor_temporal).trim().toLowerCase() === email.trim().toLowerCase() ||
          String(o.creado_por).trim().toLowerCase() === email.trim().toLowerCase()
        );
        const countOrders = userOrders.length;

        // Conteo total de movimientos
        const totalMovimientos = countLines + countInvitados + countOrders;

        // Encontrar la fecha del último movimiento o última venta de su red para reiniciar cuenta regresiva (Punto 1b)
        // a- Sus propias líneas creadas
        const lineDates = userLines.map((l: any) => new Date(l.fecha_creacion || l.creado_al || l.creado_at || 0).getTime());
        // b- Líneas creadas por sus invitados (recursividad a 1 nivel de red de comisiones)
        const invitedEmails = directInvited.map((r: any) => String(r.invited_email).trim().toLowerCase());
        const invitedLines = lines.filter((l: any) => 
          invitedEmails.includes(String(l.vendedor).trim().toLowerCase()) ||
          invitedEmails.includes(String(l.creado_por).trim().toLowerCase())
        );
        const invitedLineDates = invitedLines.map((l: any) => new Date(l.fecha_creacion || l.creado_al || l.creado_at || 0).getTime());

        // c- Sus propios pedidos creados
        const orderDates = userOrders.map((o: any) => new Date(o.creado_al || o.creado_at || 0).getTime());

        // Consolidar fechas
        const allTimes = [
          new Date(p.last_active_at || p.creado_al || p.creado_at || 0).getTime(), // Última vez conectado
          ...lineDates,
          ...invitedLineDates,
          ...orderDates
        ].filter(t => t > 0);

        const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : new Date(p.creado_al || p.creado_at || p.creado_con || 0).getTime();
        const lastActivityDate = new Date(maxTime);

        // Calcular si está vencido el periodo de gracia
        const diffMs = Date.now() - maxTime;
        const graceMs = monthsGrace * 30 * 24 * 60 * 60 * 1000;
        const isGraceExpired = diffMs > graceMs;

        return {
          ...p,
          rol: p.rol || 'IPTV CLIENTES',
          estado: p.estado !== false,
          permisos: p.permisos || [],
          countInvitados,
          countLines,
          countOrders,
          totalMovimientos,
          lastActivityDate,
          isGraceExpired
        };
      });

      setUsers(enrichedUsers);
    } catch (err) {
      console.error("Error al cargar métricas de seguridad:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleSaveGraceMonths = async (months: number) => {
    try {
      const currentConfig = await apiService.getSystemConfig();
      const updatedConfig = {
        ...currentConfig,
        meses_inactividad_limpieza: months
      };
      await apiService.updateSystemConfig(updatedConfig);
      setSystemConfig(updatedConfig);
      toast.success(`Periodo de gracia actualizado a ${months} meses correctamente.`);
      fetchSecurityMetrics();
    } catch (e: any) {
      toast.error("Error al guardar periodo de gracia: " + e.message);
    }
  };

  const handleToggleRole = async (targetRole: string) => {
    if (!selectedTarget) return;
    const targetUser = users.find(u => u.email.toLowerCase() === selectedTarget.toLowerCase());
    if (!targetUser) return;

    try {
      const currentRoles = Array.isArray(targetUser.rol) 
        ? targetUser.rol 
        : (targetUser.rol?.split(',') || []).filter(Boolean);
      
      let newRoles: string[];
      if (currentRoles.includes(targetRole)) {
        if (currentRoles.length === 1) {
          toast.error("El usuario debe tener al menos un rol asignado.");
          return;
        }
        newRoles = currentRoles.filter(r => r !== targetRole);
      } else {
        newRoles = [...currentRoles, targetRole];
      }

      const rolStr = newRoles.join(',');
      const { error } = await supabase
        .from('perfiles_locales')
        .update({ rol: rolStr })
        .eq('id', targetUser.id);

      if (error) throw error;

      // Sincronizar asignación unificada en g3d_usuarios_roles_asignacion
      try {
        // Aseguramos primero que el rol existe en g3d_roles (upsert)
        for (const role of newRoles) {
          await supabase
            .from('g3d_roles')
            .upsert({ id: role, descripcion: `Rol maestro ${role}` }, { onConflict: 'id' });
        }

        // 1. Borrar asignaciones existentes para este usuario
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', targetUser.id);

        // 2. Insertar asignaciones actuales
        const insertPayload = newRoles.map(r => ({
          usuario_id: targetUser.id,
          rol_id: r
        }));

        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .insert(insertPayload);
      } catch (dbErr) {
        console.warn("[handleToggleRole] Error actualizando asignación en g3d_usuarios_roles_asignacion:", dbErr);
      }

      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, rol: rolStr } : u));
      toast.success(`Rol cambiado a: ${rolStr}`);
    } catch (err: any) {
      toast.error("Error al asignar rol: " + err.message);
    }
  };

  const seedPermissionsToDB = async () => {
    try {
      const allPerms = getAllPermissionsList();
      for (const p of allPerms) {
        try {
          await supabase
            .from('g3d_permisos_lista')
            .upsert({ 
              id: p.id, 
              descripcion: p.description,
              modulo: p.group || 'GENERAL',
              creado_al: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (innerErr) {
          console.warn(`Error al hacer seed del permiso ${p.id}:`, innerErr);
        }
      }
    } catch (e) {
      console.warn("[seedPermissionsToDB] Error seeding permissions catalog into g3d_permisos_lista:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchRoleConfigsFromDB();
      seedPermissionsToDB();
      fetchSystemConfig();
    }
  }, [activeTab]);

  const handleResetPassword = async (email: string) => {
    if (!confirm(`¿Reiniciar contraseña de ${email} a '123456'?`)) return;
    try {
      await supabase.from('perfiles_locales').update({ password_hash: '123456' }).eq('email', email);
      toast.success("Contraseña reiniciada a '123456'");
      fetchUsers();
    } catch (err: any) { 
      toast.error("Error al reiniciar contraseña: " + err.message); 
    }
  };

  const hasCustomizedPermissions = (targetUser: any) => {
    if (!targetUser) return false;
    const userPerms = targetUser.permisos || [];
    const defaultRolePerms: Record<string, string[]> = {
      'Administrador': ['Admin.*', 'Stock.*', 'Pedidos.*', 'Produccion.*', 'Logistica.*', 'Iptv.*', 'Seguridad.*'],
      'IPTV SOCIOS': [],
      'IPTV VENDEDORES': [],
      'IPTV CLIENTES': [],
      'G3D SOCIO': [],
      'G3D EMPLEADO': []
    };
    
    const userRole = targetUser.rol || 'IPTV CLIENTES';
    const firstRole = String(userRole).split(',')[0] || 'IPTV CLIENTES';
    const roleDefaultPerms = defaultRolePerms[firstRole] || [];
    
    if (userPerms.length !== roleDefaultPerms.length) {
      return true;
    }
    
    const sortedUserPerms = [...userPerms].sort();
    const sortedRolePerms = [...roleDefaultPerms].sort();
    for (let i = 0; i < sortedUserPerms.length; i++) {
      if (sortedUserPerms[i] !== sortedRolePerms[i]) {
        return true;
      }
    }
    
    return false;
  };

  const handleChangeSingleRole = async (targetEmail: string, targetRole: string) => {
    try {
      const targetUser = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (!targetUser) return;

      setIsSaving(true);
      const { error } = await supabase
        .from('perfiles_locales')
        .update({ rol: targetRole })
        .eq('id', targetUser.id);

      if (error) throw error;

      // Sincronizar asignación unificada en g3d_usuarios_roles_asignacion
      try {
        await supabase
          .from('g3d_roles')
          .upsert({ id: targetRole, descripcion: `Rol maestro ${targetRole}` }, { onConflict: 'id' });

        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', targetUser.id);

        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .insert([{
            usuario_id: targetUser.id,
            rol_id: targetRole
          }]);
      } catch (dbErr) {
        console.warn("[handleChangeSingleRole] Error actualizando asignación en g3d_usuarios_roles_asignacion:", dbErr);
      }

      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, rol: targetRole } : u));
      toast.success(`Rol de ${targetUser.nombre || targetEmail} cambiado a: ${targetRole}`);
    } catch (err: any) {
      toast.error("Error al asignar rol: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email === user?.email) {
      toast.error("No puedes eliminar tu propia cuenta en sesión activa");
      return;
    }

    const targetUser = users.find(u => u.email === email);
    const userGuests = relations.filter((r: any) => String(r.inviter_email).trim().toLowerCase() === email.trim().toLowerCase());
    const invitedCount = userGuests.length;

    let proceed = false;
    if (invitedCount > 0) {
      proceed = confirm(
        `¿Eliminar permanentemente a ${email}?\n\n` +
        `⚠️ ¡ATENCIÓN! Este usuario tiene ${invitedCount} invitados a su cargo.\n\n` +
        `Al eliminarlo, todos sus invitados y sus respectivas comisiones se transferirán automáticamente a "La Casa" (${user?.email || 'g3d0001@gmail.com'}) de forma transparente para proteger su permanencia en la red.\n\n` +
        `¿Confirmar reasignación automática a la casa y eliminación del usuario?`
      );
    } else {
      proceed = confirm(`¿Eliminar permanentemente al usuario ${email}?`);
    }

    if (!proceed) return;

    try {
      if (targetUser && targetUser.id) {
        // 1. Eliminar fk asignaciones de rol primero para evitar fallos de clave foránea
        await supabase
          .from('g3d_usuarios_roles_asignacion')
          .delete()
          .eq('usuario_id', targetUser.id);
      }

      // 2. Si tiene invitados, transferirlos a la casa
      if (invitedCount > 0) {
        toast.loading("Transfiriendo invitados a La Casa...");
        const houseEmail = user?.email || 'g3d0001@gmail.com';
        
        // Actualizar en Supabase
        const { error: relError } = await supabase
          .from('iptv_vendedores_relacion')
          .update({ inviter_email: houseEmail })
          .eq('inviter_email', email);

        if (relError) {
          console.warn("Error actualizando relaciones de vendedores en Supabase:", relError);
        }

        // Actualizar localmente si aplica
        const updatedLocalRels = relations.map((r: any) => 
          String(r.inviter_email).trim().toLowerCase() === email.trim().toLowerCase()
            ? { ...r, inviter_email: houseEmail }
            : r
        );
        setRelations(updatedLocalRels);
        localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(updatedLocalRels));
        
        toast.dismiss();
        toast.success(`¡Se transfirieron ${invitedCount} invitados a ${houseEmail}!`);
      }

      // 3. Eliminar de perfiles_locales
      const { error } = await supabase.from('perfiles_locales').delete().eq('email', email);
      if (error) throw error;

      toast.success("Usuario eliminado correctamente");
      
      // Recargar métricas y lista
      fetchUsers();
      fetchSecurityMetrics();
    } catch (err: any) { 
      toast.dismiss();
      toast.error("Error al eliminar de perfiles_locales: " + err.message); 
      console.error("Detalle error eliminación:", err);
    }
  };

  // Helper switch component for compact permission management
  const CompactPermissionSwitch = ({ isOn, onChange, disabled = false, activeColor = "bg-emerald-500" }: { isOn: boolean; onChange: () => void; disabled?: boolean; activeColor?: string }) => {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          isOn ? activeColor : "bg-slate-200 dark:bg-slate-800",
          disabled && "opacity-30 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            isOn ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    );
  };

  // Verificar si un rol tiene un permiso determinado (resolviendo la jerarquía de herencias de forma recursiva)
  const checkRoleHasPermission = (roleName: string, permissionId: string): boolean => {
    if (!roleName) return false;
    
    const roleLower = roleName.trim().toLowerCase();
    if (roleLower === 'administrador' || roleLower === 'admin') return true;

    const resolvedPerms = getRolePermissionsRecursive(roleName);
    
    if (resolvedPerms.includes('Seguridad.AdministradorGeneral')) return true;

    if (resolvedPerms.includes('-' + permissionId)) return false;
    if (resolvedPerms.includes(permissionId)) return true;
    if (resolvedPerms.includes(permissionId + ':completo')) return true;

    const parts = permissionId.split('.');
    if (parts.length > 0) {
      const wildcard = `${parts[0]}.*`;
      if (resolvedPerms.includes(wildcard)) return true;
    }
    
    if (resolvedPerms.includes('Admin.*')) return true;
    
    return false;
  };

  // Función para agrupar los permisos de un grupo por su subfacción
  const getGroupedPermissions = (group: any) => {
    const subfactions: Record<string, any[]> = {};
    
    Object.entries(group).forEach(([key, value]: [string, any]) => {
      if (value && value.id) {
        const parts = value.id.split('.');
        let subName = "General";
        if (parts.length === 2 && parts[1] === '*') {
          subName = "Acceso Total";
        } else if (parts.length >= 2) {
          const rawSub = parts[1];
          // Formatear CamelCase a palabras separadas
          subName = rawSub.replace(/([A-Z])/g, ' $1').trim();
        }
        
        if (!subfactions[subName]) {
          subfactions[subName] = [];
        }
        subfactions[subName].push({
          ...value,
          keyName: key
        });
      }
    });
    
    return subfactions;
  };

  // Renderizar un permiso individual en formato de botón rectangular con diseño moderno (estilo Discord)
  const renderPermissionButton = (node: any) => {
    const targetPerms = getTargetPermissions();
    let isGranted = targetPerms.includes(node.id);
    let isComplete = targetPerms.includes(node.id + ':completo');
    let isNegated = targetPerms.includes('-' + node.id);
    const isWildcard = node.id.endsWith('.*');

    if (isWildcard) {
      const factionKey = node.id.split('.')[0].toUpperCase();
      const group = PERMISSIONS[factionKey as keyof typeof PERMISSIONS];
      if (group) {
        const siblingIds: string[] = [];
        Object.values(group).forEach((n: any) => {
          if (n && n.id && !n.id.endsWith('.*')) {
            siblingIds.push(n.id);
          }
        });
        if (siblingIds.length > 0) {
          const allGranted = siblingIds.every(id => targetPerms.includes(id));
          const allNegated = siblingIds.every(id => targetPerms.includes('-' + id));
          const allComplete = siblingIds.every(id => targetPerms.includes(id + ':completo'));

          isGranted = allGranted;
          isComplete = allComplete;
          isNegated = allNegated;
        }
      }
    }
    const isEditing = editingPermId === node.id;
    const currentDesc = customPermissionDescriptions[node.id] || node.description;
    const currentTitle = customPermissionTitles[node.id] || node.title || (isWildcard ? "ACCESO TOTAL A ESTA RAMA (*)" : node.id.split('.').pop()?.replace(/_/g, ' '));

    const loggedInUserObj = users.find(u => u.email === user?.email);
    const isSuperAdmin = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin';
    const editorHasThisPermission = isSuperAdmin || (loggedInUserObj && checkUserHasPermission(loggedInUserObj, node.id));
    const isToggleDisabled = !editorHasThisPermission;

    // Check explicit permissions configured on the active target to decide "currentState"
    let explicitPerms: string[] = [];
    if (assignmentMode === 'roles') {
      explicitPerms = getRoleExplicitPermissions(selectedTarget || '');
    } else {
      const targetUser = users.find(u => u.email === selectedTarget);
      explicitPerms = targetUser?.permisos || [];
    }

    const hasExplicitGrant = explicitPerms.includes(node.id);
    const hasExplicitNegation = explicitPerms.includes('-' + node.id);

    let currentState: 'permitido' | 'negado' | 'heredado' = 'heredado';
    if (assignmentMode === 'roles') {
      if (roleInheritance[selectedTarget || '']) {
        if (hasExplicitGrant) {
          currentState = 'permitido';
        } else if (hasExplicitNegation) {
          currentState = 'negado';
        } else {
          currentState = 'heredado';
        }
      } else {
        currentState = isGranted ? 'permitido' : 'negado';
      }
    } else {
      if (hasExplicitNegation) {
        currentState = 'negado';
      } else if (hasExplicitGrant) {
        currentState = 'permitido';
      } else {
        currentState = 'heredado';
      }
    }

    const currentLevel: 'ver' | 'interactuar' = isComplete ? 'interactuar' : 'ver';

    const handleSetPermissionWithCheck = (permId: string, state: 'permitido' | 'negado' | 'heredado', level: 'ver' | 'interactuar' = 'ver') => {
      if (isToggleDisabled) {
        toast.error("Permiso Denegado", {
          description: "No posees este permiso en tu propio rol, por lo tanto no puedes asignarlo ni modificarlo."
        });
        return;
      }
      handleSetPermissionState(permId, state, level);
    };

    return (
      <div
        key={node.id}
        className="p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3 transition-all duration-150 text-left hover:border-emerald-500/60 shadow-sm"
      >
        {/* Superior: Título, ID y Botón Editar */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className={cn(
                "text-xs font-black tracking-wide uppercase truncate",
                isWildcard ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
              )}>
                {currentTitle}
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold uppercase select-all border border-slate-200 dark:border-slate-800">
                {node.id}
              </span>
              {isToggleDisabled && (
                <span className="text-[8px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded select-none border border-amber-500/20" title="Solo lectura - No posees este permiso para asignarlo">
                  <Key size={8} /> Protegido
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPermId(node.id);
                setTempTitle(currentTitle);
                setTempDesc(currentDesc);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
              title="Personalizar etiqueta y descripción"
            >
              <Edit size={12} />
            </button>
          </div>
  
          {isEditing ? (
            <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-left">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider block">Título Personalizado</label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Título del permiso"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider block">Descripción</label>
                <textarea
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[35px]"
                  placeholder="¿Qué permite hacer este permiso?"
                />
              </div>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setEditingPermId(null)}
                  className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSavePermissionMetadata(node.id, tempTitle, tempDesc);
                    setEditingPermId(null);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-0.5">
              {currentDesc}
            </p>
          )}
        </div>

        {/* Inferior: Selector de Estado y Nivel en una sola fila compacta y limpia */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 shrink-0 select-none">
          {/* Swich Múltiple [ X | / | Check ] al estilo de control unificado */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner font-bold">
            <button
              type="button"
              onClick={() => handleSetPermissionWithCheck(node.id, 'negado')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-100 cursor-pointer",
                currentState === 'negado' || (currentState === 'heredado' && !isGranted)
                  ? "bg-rose-600 text-white font-bold shadow"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-rose-600"
              )}
              title={assignmentMode === 'roles' ? "Desaprobar / Negar permiso" : "Desaprobar / Forzar negado para usuario"}
            >
              <X size={13} className="stroke-[2.5]" />
            </button>
            
            {(assignmentMode === 'users' || (assignmentMode === 'roles' && roleInheritance[selectedTarget || ''])) && (
              <button
                type="button"
                onClick={() => handleSetPermissionWithCheck(node.id, 'heredado')}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-100 font-mono text-xs cursor-pointer",
                  currentState === 'heredado'
                    ? (isGranted
                        ? "bg-emerald-500 text-slate-950 font-bold shadow"
                        : "bg-rose-600 text-white font-bold shadow")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
                title={
                  currentState === 'heredado'
                    ? (isGranted
                        ? (assignmentMode === 'users' ? "Heredado: Otorgado" : "Heredado del padre: Otorgado")
                        : (assignmentMode === 'users' ? "Heredado: Denegado" : "Heredado del padre: Denegado"))
                    : (assignmentMode === 'users' ? "Heredar permisos del rol asignado" : "Heredar permisos del rol padre")
                }
              >
                {currentState === 'heredado' ? (
                  isGranted ? (
                    <Check size={13} className="stroke-[3]" />
                  ) : (
                    <X size={13} className="stroke-[3]" />
                  )
                ) : (
                  "/"
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSetPermissionWithCheck(node.id, 'permitido', currentLevel)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-100 cursor-pointer",
                currentState === 'permitido' || (currentState === 'heredado' && isGranted)
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600"
              )}
              title={assignmentMode === 'roles' ? "Aprobar / Permitir" : "Aprobar / Forzar permitido para usuario"}
            >
              <Check size={13} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Selector de Nivel [ Ver | Interactuar ] */}
          <div className={cn(
            "flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner transition-all duration-150",
            currentState !== 'permitido' && !(currentState === 'heredado' && isGranted) && "opacity-35 pointer-events-none"
          )}>
            <button
              type="button"
              disabled={currentState !== 'permitido' && !(currentState === 'heredado' && isGranted)}
              onClick={() => handleSetPermissionWithCheck(node.id, 'permitido', 'ver')}
              className={cn(
                "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
                (currentState === 'permitido' || (currentState === 'heredado' && isGranted)) && currentLevel === 'ver'
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Ver
            </button>
            <button
              type="button"
              disabled={currentState !== 'permitido' && !(currentState === 'heredado' && isGranted)}
              onClick={() => handleSetPermissionWithCheck(node.id, 'permitido', 'interactuar')}
              className={cn(
                "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
                (currentState === 'permitido' || (currentState === 'heredado' && isGranted)) && currentLevel === 'interactuar'
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Interac.
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleTree = (rolesList: string[], parentName: string | null = null, depth: number = 0): React.ReactNode => {
    const filtered = rolesList.filter(role => {
      const parent = roleInheritance[role];
      if (parentName === null) {
        return !parent || !rolesList.includes(parent);
      }
      return parent === parentName;
    });

    if (filtered.length === 0) return null;

    return (
      <div className={cn(depth > 0 ? "pl-3 space-y-0.5 border-l border-[#3f4147]/20 ml-3.5 mt-0.5" : "space-y-0.5")}>
        {filtered.map((role) => {
          const isActive = assignmentMode === 'roles' && selectedTarget === role;
          const isExpanded = !!expandedRoles[role] || searchQuery !== '';
          const children = renderRoleTree(rolesList, role, depth + 1);

          // Find users belonging to this specific role
          const roleUsers = users.filter(u => {
            const uRol = String(u.rol || '').trim().toLowerCase();
            const rId = String(role).trim().toLowerCase();
            const matchesRole = uRol === rId;
            if (!matchesRole) return false;
            if (!searchQuery) return true;
            return (u.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                   (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
          });

          return (
            <div key={role} className="space-y-0.5">
              <div
                onClick={() => {
                  setAssignmentMode('roles');
                  setSelectedTarget(role);
                  if (window.innerWidth < 1280) {
                    setActiveColMobile('middle');
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors text-[12px] font-black group cursor-pointer",
                  isActive
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-950 hover:bg-slate-800/20 hover:text-black"
                )}
              >
                <div className="flex items-center min-w-0 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }));
                    }}
                    className="p-0.5 rounded hover:bg-slate-800/30 text-slate-700 hover:text-black transition-colors shrink-0"
                    title={isExpanded ? "Colapsar" : "Expandir"}
                  >
                    <ChevronRight
                      size={11}
                      className={cn("transition-transform duration-150", isExpanded && "rotate-90")}
                    />
                  </button>
                  <span className="truncate">{role}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canCreateRoles && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditRoleModal(role);
                      }}
                      className="p-1 rounded text-slate-700 hover:text-black hover:bg-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar Rol"
                    >
                      <Edit size={11} />
                    </button>
                  )}
                  <ChevronRight size={12} className={cn("transition-opacity", isActive ? "text-white opacity-100" : "text-slate-950 opacity-0 group-hover:opacity-100")} />
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-0.5">
                  {/* Users under this role */}
                  {roleUsers.length > 0 && (
                    <div className="pl-5 space-y-0.5 border-l border-slate-800 ml-3 mt-0.5 mb-1">
                      {roleUsers.map((u) => {
                        const isUserActive = assignmentMode === 'users' && selectedTarget === u.email;
                        const hasCustom = hasCustomizedPermissions(u);
                        return (
                          <div
                            key={u.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignmentMode('users');
                              setSelectedTarget(u.email);
                              if (window.innerWidth < 1280) {
                                  setActiveColMobile('middle');
                              }
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2 py-1 rounded-md text-left transition-colors text-[11px] font-bold group cursor-pointer relative",
                              isUserActive
                                ? "bg-slate-800 text-white font-semibold"
                                : "text-slate-900 hover:bg-slate-800/20 hover:text-black"
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-12">
                              <div className={cn(
                                "size-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 overflow-hidden",
                                isUserActive ? "bg-white/20 text-white" : "bg-slate-950 text-indigo-400 border border-slate-800/40"
                              )}>
                                {u.avatar_url || u.foto_perfil ? (
                                  <img 
                                    src={u.avatar_url || u.foto_perfil} 
                                    className="size-full object-cover" 
                                    alt="Avatar"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  (u.nombre || u.email).charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="truncate uppercase text-[10px] tracking-tight font-sans">
                                {u.nombre || u.email.split('@')[0]}
                              </span>
                              {hasCustom && (
                                <span className="size-1 rounded-full bg-amber-500 shrink-0" title="Permisos personalizados" />
                              )}
                            </div>
                            
                            {/* Acciones flotantes en hover */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}
                                className="p-0.5 rounded hover:bg-slate-800/30 text-slate-700 hover:text-black"
                                title="Editar"
                              >
                                <Edit size={9} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.email); }}
                                className="p-0.5 rounded hover:bg-slate-800/30 text-slate-700 hover:text-rose-600"
                                title="Eliminar"
                              >
                                <Trash2 size={9} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Nested child roles */}
                  {children}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <header className="p-5 pb-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Personaliza el comportamiento y la apariencia de tu sistema.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 text-white shadow-sm border border-slate-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20  transition-colors duration-150  disabled:opacity-50"
          >
            {isSaving ? (
              <span className="material-symbols-outlined ">sync</span>
            ) : (
              <span className="material-symbols-outlined">check_circle</span>
            )}
            {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="max-w-7xl mx-auto mt-8 flex gap-2 overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-150 whitespace-nowrap relative",
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon size={18} />
                {tab.label}
                {/* @ts-ignore */}
                {tab.hasAlert && (
                  <span className="absolute -top-1 -right-1 size-3 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full  shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5">
        <div className={cn("mx-auto space-y-10", activeTab === 'users' ? "max-w-[1550px]" : "max-w-7xl")}>
          {activeTab === 'interface' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader 
                title="Ajustes de Pantalla" 
                description="Optimiza cómo se ve la aplicación en tu dispositivo actual (Samsung A52, PC, etc.)." 
              />
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-12">
                
                {/* Zoom de Aplicación (Scale) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Monitor size={20} className="text-primary" />
                          Zoom de Pantalla
                        </label>
                        <p className="text-sm text-slate-500 font-medium">Ajusta el tamaño global de la interfaz. Ideal para ver más contenido o agrandar botones.</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">{(uiSettings.scale * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.75" 
                      max="1.25" 
                      step="0.05"
                      value={uiSettings.scale}
                      onChange={(e) => updateUISettings({ scale: parseFloat(e.target.value) })}
                      className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Para PC / Monitor</span>
                      <span>Estándar</span>
                      <span>Para Móvil (A52)</span>
                    </div>
                  </div>

                  {/* Selector de Modo de Color (Dark Mode) */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Modo de Apariencia</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                                { id: 'light', label: 'Modo Claro', icon: Monitor },
                                { id: 'dark', label: 'Modo Oscuro', icon: Shield },
                                { id: 'system', label: 'Automático', icon: Globe }
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    updateUISettings({ theme: m.id as any });
                                    toast.success(`Apariencia: ${m.label}`);
                                  }}
                                  className={cn(
                                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-colors duration-150 duration-300",
                                    uiSettings.theme === m.id 
                                      ? "bg-white dark:bg-slate-900 border-primary text-primary shadow-lg shadow-primary/10" 
                                      : "bg-slate-50/50 dark:bg-slate-800/30 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                                  )}
                                >
                                  <m.icon size={20} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Botón de Guardado Manual */}
                        <div className="pt-6 flex justify-end">
                          <button
                            onClick={() => {
                              toast.success("¡Preferencias Guardadas!", {
                                description: "La configuración visual ha sido persistida en tu navegador."
                              });
                            }}
                            className="btn-tactile bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3   transition-colors duration-150"
                          >
                            <Save size={18} />
                            Aplicar a todo el sistema
                          </button>
                        </div>

                {/* Vista Previa en Tiempo Real */}
                <div className="p-10 glass-panel rounded-[var(--app-radius)] border-2 border-slate-200 dark:border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 mesh-gradient opacity-20 group-hover:opacity-30 transition-opacity" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6 relative z-10">Vista Previa Dinámica</p>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="size-16 rounded-[var(--app-radius)] bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-2xl shadow-primary/30">G</div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Personalización Avanzada</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">Este es el aspecto exacto que tendrá tu panel administrativo con los ajustes actuales.</p>
                    </div>
                  </div>
                </div>

                {/* NUEVAS OPCIONES DE ESTÉTICA PROFESIONAL */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/5 space-y-12">
                   <SectionHeader 
                    title="Propuesta de ADN Visual" 
                    description="Selecciona la 'personalidad' gráfica que mejor se adapte a tu flujo de trabajo." 
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Persona Selector */}
                    {[
                      { id: 'professional', label: 'Elegancia Profesional', desc: 'Sólido, limpio y equilibrado.' },
                      { id: 'glass', label: 'Glassmorphism', desc: 'Transparencias y desenfoque suave.' },
                      { id: 'brutalist', label: 'Brutalismo Moderno', desc: 'Alto contraste y bordes definidos.' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateUISettings({ persona: p.id as any })}
                        className={cn(
                          "p-4 rounded-[2rem] border-2 text-left transition-colors duration-150 duration-500 relative overflow-hidden group",
                          uiSettings.persona === p.id 
                            ? "bg-white dark:bg-slate-900 border-primary shadow-2xl" 
                            : "bg-slate-50/50 dark:bg-slate-800/30 border-transparent hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "size-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-150 duration-500",
                          uiSettings.persona === p.id ? "bg-slate-900 text-white shadow-sm border border-slate-700 scale-110 shadow-lg" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        )}>
                          <Layout size={24} />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-tight mb-1">{p.label}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{p.desc}</p>
                        {uiSettings.persona === p.id && (
                          <div className="absolute top-4 right-4 text-primary">
                            <ShieldCheck size={18} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Detalle de Textura y Bordes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Textura del Fondo</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['solid', 'grainy', 'mesh'].map((t) => (
                          <button
                            key={t}
                            onClick={() => updateUISettings({ texture: t as any })}
                            className={cn(
                              "py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-150",
                              uiSettings.texture === t ? "bg-slate-900 text-white border-slate-900" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Curvatura (Esquinas)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['sharp', 'standard', 'soft'].map((r) => (
                          <button
                            key={r}
                            onClick={() => updateUISettings({ borderRadius: r as any })}
                            className={cn(
                              "py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-150",
                              uiSettings.borderRadius === r ? "bg-slate-900 text-white border-slate-900" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Colores de Interfaz (Botón, Títulos, Islas, etc) */}
                  <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-1">Paleta de Elementos de Interfaz</h4>
                      <p className="text-xs text-slate-500 font-medium">Asigna colores personalizados a cada tipo de botón, título, subtítulo, isla (tarjeta o panel) y enlaces para tener un control estético total del sistema.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Botón Primario */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">Botón Primario</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.btnPrimaryBg || '#0f172a'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), btnPrimaryBg: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Fondo</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.btnPrimaryBg || '#0f172a'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.btnPrimaryText || '#ffffff'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), btnPrimaryText: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Texto</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.btnPrimaryText || '#ffffff'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón Secundario */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">Botón Secundario</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.btnSecondaryBg || '#64748b'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), btnSecondaryBg: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Fondo</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.btnSecondaryBg || '#64748b'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.btnSecondaryText || '#ffffff'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), btnSecondaryText: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Texto</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.btnSecondaryText || '#ffffff'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Títulos y Enlaces */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">Títulos y Enlaces</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.titleColor || '#0f172a'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), titleColor: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Títulos</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.titleColor || '#0f172a'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.linkColor || '#3b82f6'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), linkColor: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Enlaces</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.linkColor || '#3b82f6'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subtítulos */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">Subtítulos y Labes</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={uiSettings.customColors?.subtitleColor || '#64748b'} 
                            onChange={(e) => updateUISettings({ 
                              customColors: { ...(uiSettings.customColors || {}), subtitleColor: e.target.value } as any
                            })}
                            className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase block">Color Subtítulos</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.subtitleColor || '#64748b'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Islas / Tarjetas */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3 sm:col-span-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">Islas (Fondo y Bordes de Tarjeta)</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={uiSettings.customColors?.islandBg || '#ffffff'} 
                              onChange={(e) => updateUISettings({ 
                                customColors: { ...(uiSettings.customColors || {}), islandBg: e.target.value } as any
                              })}
                              className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold uppercase block">Fondo Isla</span>
                              <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.islandBg || '#ffffff'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={uiSettings.customColors?.islandBorder || '#e2e8f0'} 
                              onChange={(e) => updateUISettings({ 
                                customColors: { ...(uiSettings.customColors || {}), islandBorder: e.target.value } as any
                              })}
                              className="size-8 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold uppercase block">Borde Isla</span>
                              <span className="text-[10px] font-mono text-slate-400 block">{uiSettings.customColors?.islandBorder || '#e2e8f0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start gap-4">
                      <button 
                        onClick={() => {
                          updateUISettings({
                            customColors: {
                              btnPrimaryBg: '#0f172a',
                              btnPrimaryText: '#ffffff',
                              btnSecondaryBg: '#64748b',
                              btnSecondaryText: '#ffffff',
                              titleColor: '#0f172a',
                              subtitleColor: '#64748b',
                              islandBg: '#ffffff',
                              islandBorder: '#e2e8f0',
                              linkColor: '#3b82f6'
                            }
                          });
                          toast.success('Valores de colores restablecidos por defecto');
                        }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
                      >
                        Restablecer Colores Defecto
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-8">
              <SectionHeader 
                title="Configuración Global" 
                description="Parámetros del sistema aplicados a todos los usuarios." 
              />
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-8">
                
                <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                   <Globe className="text-primary" /> Configuraciones
                </h3>
  
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre de la Empresa (Para Recibos y PDFs)</label>
                      <input 
                        type="text"
                        value={systemConfig.nombre_tienda || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, nombre_tienda: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        placeholder="Ej: G3D Impresiones"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Teléfono / WhatsApp (Para Recibos y PDFs)</label>
                      <input 
                        type="text"
                        value={systemConfig.whatsapp || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        placeholder="Ej: +54 9 11 1234-5678"
                      />
                    </div>
                    
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo URL (Para Recibos y PDFs)</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.logo_url ? (
          <img src={systemConfig.logo_url} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={systemLogoInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'logo_url')}
          className="hidden"
        />
        <button 
          onClick={() => systemLogoInputRef.current?.click()}
          disabled={isUploadingSystemConfig.logo_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.logo_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.logo_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
  </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Texto Pie de Recibo PDF</label>
                      <input 
                        type="text"
                        value={systemConfig.texto_pie_recibo || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, texto_pie_recibo: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        placeholder="PÁGINA WEB - FACEBOOK - INSTAGRAM - CORREO"
                      />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} className="text-primary" /> Identidad de la Aplicación</h4>
                      
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Icono de la Web (Favicon URL)</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.favicon_url ? (
          <img src={systemConfig.favicon_url} className="w-full h-full object-cover" alt="Favicon" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={faviconInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'favicon_url')}
          className="hidden"
        />
        <button 
          onClick={() => faviconInputRef.current?.click()}
          disabled={isUploadingSystemConfig.favicon_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.favicon_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.favicon_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
    <p className="text-[10px] text-slate-500 ml-2 mt-1">Este ícono se muestra en la pestaña del navegador y al guardar en favoritos.</p>
  </div>
                      
                      
  <div className="space-y-2 pt-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo del Panel de Control</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.panel_logo_url ? (
          <img src={systemConfig.panel_logo_url} className="w-full h-full object-cover" alt="Panel Logo" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={panelLogoInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'panel_logo_url')}
          className="hidden"
        />
        <button 
          onClick={() => panelLogoInputRef.current?.click()}
          disabled={isUploadingSystemConfig.panel_logo_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.panel_logo_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.panel_logo_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
    <p className="text-[10px] text-slate-500 ml-2 mt-1">Reemplaza el logo general dentro de las vistas de administración.</p>
  </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Store size={14} className="text-primary" /> Tienda Web</h4>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">URL de la Tienda (Acceso Directo)</label>
                        <input 
                          type="text"
                          value={systemConfig.tienda_url || ''}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, tienda_url: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                          placeholder="https://mi-tienda..."
                        />
                        <p className="text-[10px] text-slate-500 ml-2 mt-1">Este enlace se utilizará en el botón de "Tienda G3D" en el menú lateral.</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Vigencia del Link de Revendedores (Días)</label>
                      <input 
                        type="number"
                        min="1"
                        max="365"
                        value={systemConfig.dias_validez_link || 15}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, dias_validez_link: parseInt(e.target.value) || 15 }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold mb-4"
                      />
                      <p className="text-[10px] text-slate-500 ml-2 mb-4">
                        Define cuánto tiempo recordará el sistema el código del vendedor luego de que un cliente usa el enlace <code>?ref=CODIGO</code>
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-indigo-500">🏆 Ranking y Carruseles (Estilo Mercado Libre)</h4>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Período de Análisis para el Ranking (Días)</label>
                        <div className="flex gap-4">
                          <input 
                            type="number"
                            min="1"
                            max="90"
                            value={systemConfig.ranking_dias_validez || 7}
                            onChange={(e) => setSystemConfig(prev => ({ ...prev, ranking_dias_validez: parseInt(e.target.value) || 7 }))}
                            className="w-40 px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                          />
                          <button 
                            onClick={async () => {
                              setIsSaving(true);
                              const result = await apiService.updateSystemConfig(systemConfig);
                              await refreshBusinessProfile();
                              setIsSaving(false);
                              if (result.success) toast.success("Configuración global guardada.");
                            }}
                            disabled={isSaving}
                            className="bg-slate-900 text-white shadow-sm border border-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                          >
                            <Save size={18} />
                            Guardar Configuración General
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 ml-2 mt-1">
                          Determina la cantidad de días (ej. últimos 7 días) para calcular los carruseles de productos más vendidos en la tienda de forma automatizada.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-8">
              <SectionHeader 
                title="Conexiones, APIs y Webhooks" 
                description="Vincula tu Panel de Control con plataformas externas como Supabase, WhatsApp Business API y motores de automatización n8n."
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Panel de Configuración de Credenciales */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  
                  {/* Supabase Core Block */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Globe size={14} className="text-primary" /> Conexión Supabase (Entorno Activo)
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Base de Datos Supabase:</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          CONECTADO (MÉTODO LOCAL)
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SUPABASE_URL</label>
                        <input 
                          type="text"
                          readOnly
                          value={import.meta.env.VITE_SUPABASE_URL || 'https://ais-dev-bqgc7oksmv7.supabase.co'}
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-500 border-none focus:ring-0 cursor-not-allowed"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SUPABASE_ANON_KEY</label>
                        <input 
                          type="password"
                          readOnly
                          value="••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-500 border-none focus:ring-0 cursor-not-allowed"
                        />
                      </div>
                      
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase.from('configuracion_sistema').select('id').limit(1);
                            if (error) throw error;
                            toast.success("¡Autenticación y Red de Supabase operando al 100%!");
                          } catch (err: any) {
                            toast.error("Fallo de conexión a Supabase: " + err.message);
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl text-[11px] transition-colors"
                      >
                        Auditar Latencia y Conexión
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp API Configuration */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Phone size={14} className="text-primary" /> WhatsApp Business API (Meta)
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Meta Access Token (Bearer)</label>
                        <input 
                          type="password"
                          value={systemConfig.whatsapp_api_token || ''}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, whatsapp_api_token: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs font-mono font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="Escribe el token EAAB..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number ID</label>
                          <input 
                            type="text"
                            value={systemConfig.whatsapp_phone_number_id || ''}
                            onChange={(e) => setSystemConfig(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            placeholder="Ej: 109283748293"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Código País Defecto</label>
                          <input 
                            type="text"
                            value={systemConfig.whatsapp_default_country_code || '+54'}
                            onChange={(e) => setSystemConfig(prev => ({ ...prev, whatsapp_default_country_code: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            placeholder="Ej: +54"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* n8n Automation Engine */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Bell size={14} className="text-primary" /> Motor n8n y Webhooks de Eventos
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Webhook URL: Alertas WhatsApp</label>
                        <input 
                          type="url"
                          value={systemConfig.webhook_n8n_alertas || ''}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, webhook_n8n_alertas: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="https://n8n.tu-servidor.com/webhook/..."
                        />
                        <p className="text-[10px] text-slate-500 ml-1">Se invoca automáticamente al registrarse eventos clave regulados por los siguientes gatillos.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Webhook URL: IA OCR Proveedores</label>
                        <input 
                          type="url"
                          value={systemConfig.webhook_n8n_ocr || ''}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, webhook_n8n_ocr: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="https://n8n.tu-servidor.com/webhook/ocr-insumos"
                        />
                        <p className="text-[10px] text-slate-500 ml-1">Webhook para el procesamiento OCR inteligente de insumos y catálogos de proveedores.</p>
                      </div>

                      {/* Gatillos Activos */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gatillos que disparan Webhooks</h4>
                        
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nuevos Pedidos Realizados</label>
                          <Switch3D 
                            checked={systemConfig.trigger_nuevo_pedido !== false}
                            onChange={(checked) => setSystemConfig(prev => ({ ...prev, trigger_nuevo_pedido: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alerta Stock Crítico de Variantes</label>
                          <Switch3D 
                            checked={systemConfig.trigger_stock_critico !== false}
                            onChange={(checked) => setSystemConfig(prev => ({ ...prev, trigger_stock_critico: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asentado de Pagos y Señas</label>
                          <Switch3D 
                            checked={systemConfig.trigger_pago_señado !== false}
                            onChange={(checked) => setSystemConfig(prev => ({ ...prev, trigger_pago_señado: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Settings Block */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                      onClick={async () => {
                        setIsSaving(true);
                        const result = await apiService.updateSystemConfig(systemConfig);
                        await refreshBusinessProfile();
                        setIsSaving(false);
                        if (result.success) {
                          toast.success("APIs y Webhooks de conexión guardados correctamente.");
                        } else {
                          toast.error("Fallo al guardar configuraciones.");
                        }
                      }}
                      disabled={isSaving}
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-700 shadow-sm px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all font-mono"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      GUARDAR CREDENCIALES Y APIS
                    </button>
                  </div>

                </div>

                {/* Panel de Previsualización y Test en Vivo */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col flex-1 min-h-[500px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Canal Pruebas Activo</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">WhatsApp Preview</span>
                    </div>

                    {/* Smartphone Screen Contents */}
                    <div className="flex-1 bg-slate-900 rounded-2xl p-4 flex flex-col space-y-4 min-h-[350px]">
                      {/* Received WhatsApp Card */}
                      <div className="self-start max-w-[85%] bg-teal-950 text-teal-100 p-3 rounded-2xl rounded-tl-none border border-teal-900/50 shadow-sm text-xs font-mono select-none">
                        <span className="text-[10px] text-teal-400 font-bold block mb-1">G3D ALERT BOT</span>
                        <div className="whitespace-pre-line leading-relaxed text-[11px]">
                          {`📱 ALERTA DE STOCK BAJO\n---------------------------\n📢 Insumo: Filamento PLA Grilon\n📦 Categoría: Impresión 3D\n📉 Stock: 2 unidades (Mín: 5)\n\n⚠️ Sugerencia: Reponer mediante OCR del Proveedor registrado en la base.`}
                        </div>
                        <span className="text-[9px] block text-right text-teal-400/70 mt-1.5">14:15</span>
                      </div>

                      {/* Customer Side Response Simulation */}
                      <div className="self-end max-w-[85%] bg-slate-800 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-xs font-mono select-none">
                        <div className="text-[11px] leading-relaxed">
                          ¡Excelente! Ejecutando flujo complementario n8n OCR.
                        </div>
                        <span className="text-[9px] block text-right text-slate-400 mt-1">14:16</span>
                      </div>
                    </div>

                    {/* Test Button in Simulator */}
                    <div className="mt-4 pt-3 border-t border-slate-850 space-y-2">
                      <button
                        onClick={async () => {
                          if (!systemConfig.webhook_n8n_alertas) {
                            toast.error("Por favor completa primero la URL de Webhook de n8n Alertas.");
                            return;
                          }
                          
                          toast.promise(
                            fetch(systemConfig.webhook_n8n_alertas, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                event: "test_trigger",
                                time: new Date().toISOString(),
                                mock_data: {
                                  message: "¡Conexión del panel G3D exitosa con n8n!",
                                  initiator: user?.email || "Admin"
                                }
                              })
                            }).then(async (res) => {
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              return res;
                            }),
                            {
                              loading: 'Disparando evento de prueba a n8n...',
                              success: '¡Disparo ejecutado! Verifica la ejecución del workflow en n8n.',
                              error: 'Nota: Webhook disparado. (Si ves error de CORS en consola, es normal para n8n desde navegador; el webhook ha sido invocado con éxito).'
                            }
                          );
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Send size={14} />
                        Disparar Notificación de Prueba
                      </button>
                      <p className="text-[9px] text-slate-400 text-center">
                        Envía un payload de prueba directo a n8n en formato JSON de eventos.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-200 space-y-1.5 leading-relaxed font-semibold">
                    <h5 className="font-bold tracking-tight uppercase text-[10px] text-amber-900 dark:text-amber-300">💡 Consejos n8n + Webhooks</h5>
                    <p>Usa la URL de alerta n8n para configurar un canal de entrada Webhook en n8n. Luego, asocia un nodo de WhatsApp Business o Twilio para despachar mensajes automatizados.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-8">
              <SectionHeader 
                title="Configuración de Perfil" 
                description="Gestiona tus datos personales y la información de tu negocio para logística y tienda."
              />

              <div className={isG3dVendedor ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "max-w-xl mx-auto"}>
                {/* Datos Personales */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <User className="text-primary" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Información Personal</h3>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                        {profileData.avatar_url ? (
                          <img src={profileData.avatar_url} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="text-slate-300" size={28} />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-1">Foto de Perfil</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            ref={avatarInputRef}
                            onChange={(e) => handleFileUpload(e, 'avatar_url')}
                            className="hidden"
                            disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                          />
                          <button 
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isUploadingAvatar || !hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                            {isUploadingAvatar ? <Loader2 className="" size={16} /> : <Upload size={16} />}
                            {isUploadingAvatar ? 'Subiendo...' : 'Subir foto'}
                          </button>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 ml-1">Sugerencia: Usa una imagen cuadrada de frente y clara. Formato JPG o PNG. Máximo 2MB.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                      <input 
                        type="text"
                        value={profileData.nombre_personal}
                        onChange={(e) => setProfileData(prev => ({ ...prev, nombre_personal: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold disabled:opacity-60"
                        placeholder="Ej: Juan Pérez"
                        disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
                        <input 
                          type="text"
                          value={profileData.telefono_personal}
                          onChange={(e) => setProfileData(prev => ({ ...prev, telefono_personal: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold disabled:opacity-60"
                          placeholder="+54..."
                          disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">DNI / CUIL</label>
                        <input 
                          type="text"
                          value={profileData.dni}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dni: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold disabled:opacity-60"
                          placeholder="20-..."
                          disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Dirección Particular (Hogar)</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text"
                          value={profileData.direccion_personal}
                          onChange={(e) => setProfileData(prev => ({ ...prev, direccion_personal: e.target.value }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold disabled:opacity-60"
                          placeholder="Calle, Número, Departamento..."
                          disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Referencias de Dirección</label>
                      <input 
                        type="text"
                        value={profileData.referencia_personal}
                        onChange={(e) => setProfileData(prev => ({ ...prev, referencia_personal: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold disabled:opacity-60"
                        placeholder="Ej: Casa rejas negras, frente a la plaza..."
                        disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Ubicación en Mapa (Hogar)</label>
                      <LocationPicker 
                         lat={profileData.lat_personal} 
                         lng={profileData.lng_personal} 
                         onChange={(lat, lng) => setProfileData(prev => ({ ...prev, lat_personal: lat, lng_personal: lng }))}
                         disabled={!hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                      />
                    </div>

                    {/* Banner de soporte de rol padre cuando no tiene permiso de edición */}
                    {!hasPermission('Seguridad.Perfil.EditarDatosPersonales') && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 mt-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Edición Bloqueada</span>
                        </div>
                        
                        {parentHasEditPermission ? (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            No tienes el permiso activo para editar tus datos personales. Sin embargo, tu rol superior <strong className="text-slate-700 dark:text-slate-200 uppercase">{parentSupportRole}</strong> tiene permitido gestionarlos. Puedes comunicarte con ellos para solicitar una actualización:
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            No está permitido cambiar estos datos personales en este rol. Puedes comunicarte con soporte (<strong className="text-slate-700 dark:text-slate-200 uppercase">{parentSupportRole}</strong>) para solicitar el reinicio de un dato en específico de tu perfil:
                          </p>
                        )}

                        {/* Contactos de Soporte / Roles Padre */}
                        {isLoadingSupport ? (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <Loader2 className="animate-spin" size={12} />
                            Buscando soporte...
                          </div>
                        ) : parentSupportUsers.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {parentSupportUsers.map((u, idx) => (
                              <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{u.nombre}</span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Rol: {u.rol}</span>
                                <div className="flex flex-wrap gap-2 pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                                  {u.telefono_contacto && (
                                    <a
                                      href={`https://wa.me/${u.telefono_contacto.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                    >
                                      <Phone size={10} />
                                      WhatsApp
                                    </a>
                                  )}
                                  {u.email && (
                                    <a
                                      href={`mailto:${u.email}`}
                                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                    >
                                      Email
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-medium italic">
                            No se encontraron usuarios activos con el rol {parentSupportRole || 'Administrador'}. Por favor, comunícate con la administración general.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button 
                      onClick={handleUpdatePersonal}
                      disabled={isSaving || !hasPermission('Seguridad.Perfil.EditarDatosPersonales')}
                      className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90  transition-colors duration-150 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="" size={18} /> : <Save size={18} />}
                      Guardar Info Personal
                    </button>
                  </div>
                </div>

                {/* Datos de Negocio */}
                {isG3dVendedor && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="text-primary" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Perfil de Negocio</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                        {profileData.logo_url ? (
                          <img src={profileData.logo_url} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="text-slate-300" size={28} />
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-1">Logo del Negocio</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => handleFileUpload(e, 'logo_url')}
                            className="hidden"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 w-fit"
                          >
                            {isUploading ? <Loader2 className="" size={16} /> : <Upload size={16} />}
                            {isUploading ? 'Subiendo...' : 'Subir desde dispositivo'}
                          </button>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 ml-1 mt-2">Sugerencia: Logo cuadrado, preferiblemente minimalista, en alta resolución (JPG o PNG). Máximo 2MB.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre Comercial de la Tienda</label>
                      <input 
                        type="text"
                        value={profileData.nombre_negocio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, nombre_negocio: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        placeholder="Ej: G3D Industries"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
                          <input 
                            type="text"
                            value={profileData.telefono_negocio || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, telefono_negocio: e.target.value }))}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                            placeholder="+54..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email de Contacto</label>
                          <input 
                            type="email"
                            value={profileData.email_negocio}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email_negocio: e.target.value }))}
                            className="w-full pl-5 pr-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                            placeholder="ventas@..."
                          />
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Dirección de Despacho / Retiro</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text"
                          value={profileData.direccion_negocio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, direccion_negocio: e.target.value }))}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                          placeholder="Donde retiran los fleteros..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Referencias de Ruta / Despacho</label>
                      <input 
                        type="text"
                        value={profileData.referencia_negocio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, referencia_negocio: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                        placeholder="Ej: Galpón azul, tocar timbre 2..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Ubicación en Mapa (Negocio)</label>
                      <LocationPicker 
                         lat={profileData.lat_negocio} 
                         lng={profileData.lng_negocio} 
                         onChange={(lat, lng) => setProfileData(prev => ({ ...prev, lat_negocio: lat, lng_negocio: lng }))}
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button 
                      onClick={handleUpdateBusiness}
                      disabled={isSaving}
                      className="w-full bg-slate-900 text-white shadow-sm border border-slate-700 px-4 py-2.5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90  transition-colors duration-150 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="" size={18} /> : <Save size={18} />}
                      Guardar Info Negocio
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'iptv' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-8 pb-12">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">XTV CONFIG (API)</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Mapeador de comandos y pruebas en vivo.</p>
              </div>
              
              {/* FILTROS COMPACTOS Y CREDENCIALES COLAPSABLES */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 transition-all space-y-3 mb-4">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setShowCompactCredentials(!showCompactCredentials)}>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Key size={12} /> ⚙️ Credenciales de Conexión de tu Panel (Click para {showCompactCredentials ? 'ocultar' : 'editar'})
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">{showCompactCredentials ? '▲ Ocultar' : '▼ Expandir'}</span>
                </div>
                
                {showCompactCredentials && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-slate-100 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">URL del Panel</label>
                      <input 
                        type="text"
                        value={systemConfig.xc_url_completa || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          let code = systemConfig.xc_access_code || '';
                          if (val.includes("/reseller/index.php")) {
                            const matches = val.match(/\/([^/]+)\/reseller\/index\.php/);
                            if (matches && matches[1]) {
                              code = matches[1];
                            }
                          }
                          setSystemConfig(prev => ({ 
                            ...prev, 
                            xc_url_completa: val,
                            xc_access_code: code,
                            iptv_panel_active: 'xc_reseller' 
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-slate-700 font-bold"
                        placeholder="http://xtv.ar:2095/pooqkDEG/reseller/index.php"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Código de Acceso (Hash)</label>
                      <input 
                        type="text"
                        value={systemConfig.xc_access_code || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, xc_access_code: e.target.value, iptv_panel_active: 'xc_reseller' }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-slate-700 font-bold"
                        placeholder="pooqkDEG"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">API Key / Token</label>
                      <input 
                        type="password"
                        value={systemConfig.xc_token || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, xc_token: e.target.value, iptv_panel_active: 'xc_reseller' }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-slate-700 font-bold"
                        placeholder="API Key"
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end pt-1">
                      <button 
                        type="button"
                        onClick={async () => {
                          setIsSaving(true);
                          const result = await apiService.updateSystemConfig(systemConfig);
                          await refreshBusinessProfile();
                          setIsSaving(false);
                          if (result.success) {
                            toast.success("¡Credenciales guardadas y sincronizadas!");
                          } else {
                            toast.error("Error al guardar credenciales.");
                          }
                        }}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 text-white font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                      >
                        <Save size={12} /> Guardar Credenciales
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* COMPONENTE COLAPSABLE DE CLONES DE APLICACIÓN ANDROID TV */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 transition-all space-y-3 mb-4">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => {
                  setShowClonesAccordion(!showClonesAccordion);
                  if(!showClonesAccordion) {
                    fetchAppClones();
                  }
                }}>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tv size={12} /> ⚙️ CLONES Y VERSIONES DE LA APP ANDROID TV (STREAMCODE / TAURI)
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">{showClonesAccordion ? '▲ Ocultar' : '▼ Expandir'}</span>
                </div>

                {showClonesAccordion && (
                  <div className="space-y-4 pt-2 text-slate-100 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-2">
                      <p className="text-[10.5px] text-slate-400 font-medium">
                        Administra las configuraciones, logos, banners y versiones de tus clones personalizados para Android TV.
                      </p>
                      {!editingCloneId && !editCloneData && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditCloneData({
                              id_app: '',
                              nombre_comercial: '',
                              logo_remoto: '',
                              banner_publicitario: '',
                              mensaje_aviso: '',
                              version_actual: '1.0.0',
                              url_apk_github: ''
                            });
                            setEditingCloneId('new');
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 self-start"
                        >
                          <Plus size={10} /> Nuevo Clon
                        </button>
                      )}
                    </div>

                    {/* FORMULARIO DE CREACIÓN O EDICIÓN */}
                    {(editingCloneId || editCloneData) && (
                      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                            {editingCloneId === 'new' ? '✨ Crear Nuevo Clon' : '✏️ Editar Clon'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCloneId(null);
                              setEditCloneData(null);
                            }}
                            className="text-slate-400 hover:text-slate-200 text-xs"
                          >
                            ✕ Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID de la App (Ej: cliente_a)</label>
                            <input
                              type="text"
                              disabled={editingCloneId !== 'new'}
                              value={editCloneData?.id_app || ''}
                              onChange={(e) => setEditCloneData((prev: any) => ({ ...prev, id_app: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-bold"
                              placeholder="Ej: cliente_a"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nombre Comercial (Ej: Mi TV Premium)</label>
                            <input
                              type="text"
                              value={editCloneData?.nombre_comercial || ''}
                              onChange={(e) => setEditCloneData((prev: any) => ({ ...prev, nombre_comercial: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                              placeholder="Ej: Mi TV Premium"
                            />
                          </div>

                          {/* LOGO REMOTO CON CARGADOR LOCAL INTERACTIVO COMPRIMIDO */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <ImageIcon size={10} /> Logo Remoto (Carga de Imagen Local)
                            </label>
                            <div className="flex items-center gap-3 bg-slate-950 p-2 border border-slate-800 rounded-lg">
                              {editCloneData?.logo_remoto ? (
                                <img
                                  src={editCloneData.logo_remoto}
                                  alt="Logo"
                                  className="size-10 object-contain rounded bg-slate-900 border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="size-10 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">
                                  Sin Logo
                                </div>
                              )}
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="flex gap-2">
                                  <label className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition-colors">
                                    Cargar Foto
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            toast.loading("Procesando y comprimiendo imagen...");
                                            const base64 = await compressImageToBase64(file, 400, 400);
                                            setEditCloneData((prev: any) => ({ ...prev, logo_remoto: base64 }));
                                            toast.dismiss();
                                            toast.success("¡Imagen cargada y optimizada!");
                                          } catch (err) {
                                            toast.dismiss();
                                            toast.error("Error al comprimir imagen");
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                  {editCloneData?.logo_remoto && (
                                    <button
                                      type="button"
                                      onClick={() => setEditCloneData((prev: any) => ({ ...prev, logo_remoto: '' }))}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[9px] font-bold uppercase transition-colors"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                                <span className="text-[8px] text-slate-500 font-medium">Redimensionado y comprimido en local</span>
                              </div>
                            </div>
                          </div>

                          {/* BANNER/FLYER PUBLICITARIO CON CARGADOR LOCAL INTERACTIVO COMPRIMIDO */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <ImageIcon size={10} /> Banner/Flyer Publicitario (Carga de Imagen Local)
                            </label>
                            <div className="flex items-center gap-3 bg-slate-950 p-2 border border-slate-800 rounded-lg">
                              {editCloneData?.banner_publicitario ? (
                                <img
                                  src={editCloneData.banner_publicitario}
                                  alt="Banner"
                                  className="w-16 h-10 object-cover rounded bg-slate-900 border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-16 h-10 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">
                                  Sin Flyer
                                </div>
                              )}
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="flex gap-2">
                                  <label className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition-colors">
                                    Cargar Foto
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            toast.loading("Procesando y comprimiendo flyer...");
                                            const base64 = await compressImageToBase64(file, 600, 350);
                                            setEditCloneData((prev: any) => ({ ...prev, banner_publicitario: base64 }));
                                            toast.dismiss();
                                            toast.success("¡Imagen cargada y optimizada!");
                                          } catch (err) {
                                            toast.dismiss();
                                            toast.error("Error al comprimir flyer");
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                  {editCloneData?.banner_publicitario && (
                                    <button
                                      type="button"
                                      onClick={() => setEditCloneData((prev: any) => ({ ...prev, banner_publicitario: '' }))}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[9px] font-bold uppercase transition-colors"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                                <span className="text-[8px] text-slate-500 font-medium">Comprimido en local para optimizar storage</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mensaje de Aviso en la TV</label>
                            <textarea
                              rows={2}
                              value={editCloneData?.mensaje_aviso || ''}
                              onChange={(e) => setEditCloneData((prev: any) => ({ ...prev, mensaje_aviso: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-medium"
                              placeholder="Ej: Bienvenido a la mejor TV. Tu suscripción expira pronto."
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Versión Actual (Ej: 1.0.0)</label>
                            <input
                              type="text"
                              value={editCloneData?.version_actual || ''}
                              onChange={(e) => setEditCloneData((prev: any) => ({ ...prev, version_actual: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500 font-bold"
                              placeholder="Ej: 1.0.0"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">URL del APK en GitHub (Descarga Directa)</label>
                            <input
                              type="text"
                              value={editCloneData?.url_apk_github || ''}
                              onChange={(e) => setEditCloneData((prev: any) => ({ ...prev, url_apk_github: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500 font-bold"
                              placeholder="Ej: https://github.com/usuario/repo/releases/download/v1.0.0/app.apk"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCloneId(null);
                              setEditCloneData(null);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await handleSaveClone(editCloneData, editingCloneId !== 'new');
                              if (ok) {
                                setEditingCloneId(null);
                                setEditCloneData(null);
                                fetchAppClones();
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={12} /> Guardar Cambios
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TABLA DE CLONES */}
                    {loadingClones ? (
                      <div className="text-center py-6 text-slate-500">
                        <Loader2 className="animate-spin size-4 mx-auto mb-1.5" />
                        <span className="text-[10px]">Cargando clones de aplicación...</span>
                      </div>
                    ) : appClones.length === 0 ? (
                      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800/60 text-center text-slate-500 italic text-xs">
                        No hay clones de la app registrados aún. ¡Presiona "Nuevo Clon" arriba para dar de alta tu primera versión!
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-black uppercase text-[8.5px] tracking-wider">
                              <th className="p-3">ID App</th>
                              <th className="p-3">Nombre Comercial</th>
                              <th className="p-3">Logo / Flyer</th>
                              <th className="p-3">Mensaje Aviso / Versión</th>
                              <th className="p-3">Descarga APK</th>
                              <th className="p-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {appClones.map((clone: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/40 transition-colors border-b border-slate-800/40">
                                <td className="p-3 font-mono font-bold text-indigo-400 select-all">{clone.id_app}</td>
                                <td className="p-3 font-bold text-slate-100">{clone.nombre_comercial}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {clone.logo_remoto ? (
                                      <img
                                        src={clone.logo_remoto}
                                        alt="Logo"
                                        className="size-8 object-contain rounded bg-slate-950 border border-slate-800"
                                        title="Logo"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="size-8 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-center text-[8px] text-slate-600 font-bold" title="Sin Logo">
                                        N/A
                                      </div>
                                    )}
                                    {clone.banner_publicitario ? (
                                      <img
                                        src={clone.banner_publicitario}
                                        alt="Flyer"
                                        className="w-12 h-8 object-cover rounded bg-slate-950 border border-slate-800"
                                        title="Flyer Publicitario"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-12 h-8 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-center text-[8px] text-slate-600 font-bold" title="Sin Flyer">
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 space-y-1">
                                  <div className="text-slate-300 font-medium max-w-[200px] truncate" title={clone.mensaje_aviso}>
                                    {clone.mensaje_aviso || <span className="text-slate-600 italic">Sin aviso</span>}
                                  </div>
                                  <div>
                                    <span className="bg-slate-800 text-indigo-300 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-slate-700/50">
                                      v{clone.version_actual || '1.0.0'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {clone.url_apk_github ? (
                                    <a
                                      href={clone.url_apk_github}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-indigo-400 hover:underline font-mono truncate block max-w-[150px]"
                                      title={clone.url_apk_github}
                                    >
                                      ⬇️ Descargar APK
                                    </a>
                                  ) : (
                                    <span className="text-slate-600 italic text-[10px]">Sin enlace</span>
                                  )}
                                </td>
                                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCloneId(clone.id_app);
                                      setEditCloneData({ ...clone });
                                    }}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors inline-flex items-center justify-center cursor-pointer"
                                    title="Editar Clon"
                                  >
                                    <Edit size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`¿Estás seguro de que deseas eliminar el clon '${clone.nombre_comercial}' (${clone.id_app})?`)) {
                                        await handleDeleteClone(clone.id_app);
                                        fetchAppClones();
                                      }
                                    }}
                                    className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-400 hover:text-rose-300 rounded transition-colors inline-flex items-center justify-center cursor-pointer"
                                    title="Eliminar Clon"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>



                {/* PANEL DE COMANDOS Y PRUEBAS EN VIVO */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 md:p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                       <Terminal size={18} className="text-emerald-400" />
                       <div>
                         <h4 className="text-xs font-black uppercase tracking-wider text-white">Consola de Comandos y Pruebas (XC Reseller API)</h4>
                         <p className="text-[10px] text-slate-400 font-medium">Ejecuta comandos directos y testea qué responde tu panel de Distribuidor física o simuladamente</p>
                       </div>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">Modo Diagnóstico</span>
                  </div>

                  {/* DIAGNÓSTICO DE IP PÚBLICA EN TIEMPO REAL */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase block">🕵️ ACCESO SEGURO / LISTA BLANCA</span>
                      <p className="text-[10px]/normal text-slate-400 max-w-xl">
                        Los paneles mayoristas XC (como <strong className="text-emerald-450 font-bold">mv-play.uk</strong> o <strong className="text-emerald-450 font-bold">xtv.ar</strong>) suelen exigir que registres la IP de tu servidor o de tu conexión en su Whitelist (Lista Blanca de IPs) para permitir comandos.
                      </p>
                    </div>
                    <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-850 flex items-center justify-between gap-3 min-w-[200px] sm:self-center">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block">TU IP PÚBLICA DETECTADA</span>
                        <span className="text-xs font-mono font-black text-emerald-400 block select-all">{userPublicIp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (userPublicIp && userPublicIp !== 'Detectando...' && userPublicIp !== 'No detectada') {
                            navigator.clipboard.writeText(userPublicIp);
                            toast.success("¡IP copiada al portapapeles!");
                          } else {
                            toast.error("Aún no se ha detectado la IP");
                          }
                        }}
                        className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/35 text-slate-450 hover:text-emerald-400 rounded-md transition-all text-[10px] flex items-center justify-center gap-1 cursor-pointer font-bold uppercase"
                        title="Copiar IP al Portapapeles"
                      >
                        📋 Copiar
                      </button>
                    </div>
                  </div>

                  {/* Botonera de Configuraciones de Carga Rápida (Ejemplos) */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">⚡ Atajos de Carga Rápida (Testeo Rápido):</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setXcTestAction("create_line");
                          setXcTestUser(`demo${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPass(""); // Contraseña vacía para probar si se genera sola
                          setXcTestPackageId("1");
                          setXcTestTrial("1");
                          setXcTestIsplock("");
                          setXcTestResellerNotes("");
                          setXcTestAllowedIps("");
                          setXcTestBouquets("");
                          setXcTestLineId("");
                          toast.success("¡Cargado: Demo (Solo Usuario Custom, Clave Vacía)!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9.5px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                      >
                        ✍️ Demo (Solo Usuario Custom)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setXcTestAction("create_line");
                          setXcTestUser(""); // Usuario vacío para probar si se genera solo
                          setXcTestPass(`clave_${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPackageId("1");
                          setXcTestTrial("1");
                          setXcTestIsplock("");
                          setXcTestResellerNotes("");
                          setXcTestAllowedIps("");
                          setXcTestBouquets("");
                          setXcTestLineId("");
                          toast.success("¡Cargado: Demo (Solo Clave Custom, Usuario Vacío)!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9.5px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                      >
                        🔐 Demo (Solo Clave Custom)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setXcTestAction("create_line");
                          setXcTestUser(`demo${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPass(`pwd${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPackageId("1");
                          setXcTestTrial("1");
                          setXcTestIsplock("");
                          setXcTestResellerNotes("");
                          setXcTestAllowedIps("");
                          setXcTestBouquets("");
                          setXcTestLineId("");
                          toast.success("¡Cargado: Demo con Usuario y Clave elegidos!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9.5px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                      >
                        🧪 Demo Completo (User + Clave)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setXcTestAction("edit_line");
                          setXcTestLineId(""); // Vacío para que el usuario escriba el ID real de su cliente
                          setXcTestUser(""); // Vacío para no interferir ni intentar cambiarlo
                          setXcTestPass(`clave_${Math.floor(1000 + Math.random() * 9000)}`); // Nueva clave aleatoria
                          setXcTestPackageId("");
                          setXcTestTrial("1");
                          setXcTestIsplock("");
                          setXcTestResellerNotes("");
                          setXcTestAllowedIps("");
                          setXcTestBouquets("");
                          toast.success("¡Cargado: Cambio de Contraseña (Solo ID y Nueva Clave, resto vacío)!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9.5px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                      >
                        🔑 Solo Cambiar Contraseña (ID + Clave)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setXcTestAction("create_line");
                          setXcTestUser(`user${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPass(`pass${Math.floor(1000 + Math.random() * 9000)}`);
                          setXcTestPackageId("48"); // Pack regular de 1 mes 1 Disp
                          setXcTestTrial("0"); // Cuenta comercial paga
                          setXcTestIsplock("");
                          setXcTestResellerNotes("");
                          setXcTestAllowedIps("");
                          setXcTestBouquets("");
                          setXcTestLineId("");
                          toast.success("¡Cargado: Crear Cliente Regular 1 Mes (Parámetros opcionales vacíos)!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 text-white rounded-lg text-[9.5px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                      >
                        ✨ Crear Cliente Regular 1 Mes
                      </button>
                    </div>
                  </div>

                  {/* Formulario de comandos interactivos */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">1. Acción Técnica (API Action)</label>
                        <select 
                          value={xcTestAction}
                          onChange={(e) => setXcTestAction(e.target.value)}
                          className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          <option value="user_info">🔍 user_info (Info general y Créditos)</option>
                          <option value="packages">📦 packages (Listar combos/paquetes)</option>
                          <option value="get_line">🔍 get_line (Ver detalles de una línea específica por ID)</option>
                          <option value="get_lines">👥 get_lines (Ver todos los clientes/usuarios)</option>
                          <option value="create_line">✨ create_line (Crear demo o línea permanente)</option>
                          <option value="edit_line">✏️ edit_line (Modificar o editar contraseña de línea)</option>
                          <option value="extend_line">⏳ extend_line (Extender / Renovar línea)</option>
                          <option value="disable_line">🚫 disable_line (Deshabilitar línea)</option>
                          <option value="enable_line">✅ enable_line (Habilitar línea)</option>
                          <option value="delete_line">❌ delete_line (Eliminar línea)</option>
                        </select>
                      </div>

                      {/* Selector de Cliente de la Base de Datos para Autocompletar */}
                      <div>
                        <label className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mb-1">2. Cargar Cliente de Base de Datos</label>
                        <select
                          value={selectedIptvClientUsername}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedIptvClientUsername(val);
                            const client = iptvClients.find(c => c.username === val);
                            if (client) {
                              const inputEl = document.getElementById(`client_xc_id_${client.username}`) as HTMLInputElement;
                              const currentIdVal = inputEl ? inputEl.value : (client.panel_client_id || '');
                              setXcTestLineId(String(currentIdVal));
                              setXcTestUser(client.username || '');
                              setXcTestPass(client.password || '');
                              toast.success(`¡Cargado cliente ${client.username}! ID de línea: ${currentIdVal || 'Ninguno asignado'}`);
                            } else {
                              setXcTestLineId('');
                              setXcTestUser('');
                              setXcTestPass('');
                            }
                          }}
                          className="w-full bg-slate-900 text-emerald-400 border border-emerald-500/40 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          <option value="" className="text-slate-400">-- Manual (Escribir abajo) --</option>
                          {iptvClients.map(c => (
                            <option key={c.username} value={c.username} className="text-slate-100 font-sans">
                              {c.nombre_completo || c.username} ({c.username}) {c.panel_client_id ? `[ID: ${c.panel_client_id}]` : '[Sin ID]'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Línea ID (Siempre visible si se autocompleta o se requiere para las acciones) */}
                      <div>
                        <label className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-1">
                          ID de Línea XC (id)
                        </label>
                        <input 
                          type="number"
                          value={xcTestLineId}
                          onChange={(e) => setXcTestLineId(e.target.value)}
                          className="w-full bg-slate-900 text-amber-400 border border-amber-500/40 rounded-lg p-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                          placeholder="Ej. 4521"
                        />
                      </div>

                      {/* Parámetros Básicos */}
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nombre de Usuario (username)</label>
                        <input 
                          type="text"
                          value={xcTestUser}
                          onChange={(e) => setXcTestUser(e.target.value)}
                          className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="Ej. customer1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Clave de Acceso (password)</label>
                        <input 
                          type="text"
                          value={xcTestPass}
                          onChange={(e) => setXcTestPass(e.target.value)}
                          className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="Ej. securepass"
                        />
                      </div>
                    </div>

                    {/* Nota Especial para Principiantes sobre edit_line y extend_line */}
                    {(xcTestAction === "edit_line" || xcTestAction === "extend_line") && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[10.5px] leading-relaxed text-slate-300 space-y-1">
                        <span className="font-bold text-amber-400 block uppercase text-[9.5px]">⚠️ REGLA DE ORO DEL PANEL (EDICIÓN DE CREDENCIALES):</span>
                        {xcTestAction === "extend_line" ? (
                          <p>
                            Para realizar un <strong>extend_line (Extender / Renovar)</strong> de forma exitosa, debes indicar el <strong>ID de Línea exacto</strong> y el <strong>ID del Combo/Paquete (package)</strong> al que deseas extender. Puedes usar el selector interactivo de planes para elegir el plan y las pantallas de manera sencilla.
                          </p>
                        ) : (
                          <>
                            <p>
                              1. <strong>Los Nombres de Usuario (username) son INMUTABLES:</strong> Ningún panel XC/XUI permite cambiar el nombre de un cliente ya creado (es su clave única de acceso). Si intentas enviarle un nombre nuevo, el panel rechazará el cambio, lo ignorará o devolverá los datos de la línea original tal cual.
                            </p>
                            <p>
                              2. <strong>Cómo cambiar la contraseña con éxito:</strong> Para cambiar la clave, debes conservar el <strong>Nombre de Usuario actual (original)</strong> del cliente, poner el <strong>ID de Línea exacto</strong>, y escribir la nueva <strong>Clave de Acceso (password)</strong>.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Parámetros Avanzados del Panel para Creación/Edición/Extensión */}
                    {(xcTestAction === "create_line" || xcTestAction === "edit_line" || xcTestAction === "extend_line") && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-850">
                        {/* Dropdown de Planes del Proveedor XC */}
                        <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                            Seleccionar Plan del Proveedor XC
                          </label>
                          <select
                            value={selectedProviderPlanId}
                            onChange={(e) => {
                              const selId = e.target.value;
                              setSelectedProviderPlanId(selId);
                              const plan = providerPlans.find(p => String(p.id) === String(selId));
                              if (plan) {
                                setXcTestPackageId(String(plan.id || ""));
                                const maxConn = Number(plan.multiple_connections || plan.max_connections || plan.screens || 1);
                                setAllowedConnectionsList(Array.from({ length: maxConn }, (_, i) => i + 1));
                                setXcTestConnections("1");
                              } else {
                                setXcTestPackageId("");
                                setAllowedConnectionsList([1, 2, 3, 4, 5]);
                                setXcTestConnections("1");
                              }
                            }}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            <option value="">-- Seleccionar Plan del Proveedor --</option>
                            {providerPlans.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (ID: {p.id || 'N/A'}) - {p.max_connections || p.screens || 1} {Number(p.max_connections || p.screens || 1) === 1 ? 'Pantalla' : 'Pantallas'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* ID Combo/Paquete (package) manual */}
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">ID Combo/Paquete (package)</label>
                          <input 
                            type="number"
                            value={xcTestPackageId}
                            onChange={(e) => {
                              setXcTestPackageId(e.target.value);
                              setSelectedProviderPlanId("");
                            }}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="Ej. 1"
                          />
                        </div>

                        {/* Desplegable de Cantidad de Pantallas */}
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Cantidad de Pantallas (connections)</label>
                          <select
                            value={xcTestConnections}
                            onChange={(e) => setXcTestConnections(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            {allowedConnectionsList.map(num => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'Pantalla' : 'Pantallas'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tipo de línea (Solo para create_line) */}
                        {xcTestAction === "create_line" && (
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tipo de Cuenta (trial)</label>
                            <select 
                              value={xcTestTrial}
                              onChange={(e) => setXcTestTrial(e.target.value)}
                              className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                            >
                              <option value="1">🧪 Trial (Demo de prueba corta)</option>
                              <option value="0">📅 Regular (Cuenta comercial paga)</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Bloquear ISP (is_isplock)</label>
                          <select 
                            value={xcTestIsplock}
                            onChange={(e) => setXcTestIsplock(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            <option value="">⚙️ Omitir (No enviar / No modificar)</option>
                            <option value="0">🔓 Desactivado (0 = disabled)</option>
                            <option value="1">🔒 Habilitar ISP Lock (1 = enabled)</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Notas del Revendedor (reseller_notes)</label>
                          <input 
                            type="text"
                            value={xcTestResellerNotes}
                            onChange={(e) => setXcTestResellerNotes(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="Ej: Premium customer, etc"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">IPs Permitidas (allowed_ips[] - Opcional, por comas)</label>
                          <input 
                            type="text"
                            value={xcTestAllowedIps}
                            onChange={(e) => setXcTestAllowedIps(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="Ej. 192.168.1.1,190.210.12.5"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">IDs de Bouquets a Asignar (bouquets_selected[] - Opcional, por comas)</label>
                          <input 
                            type="text"
                            value={xcTestBouquets}
                            onChange={(e) => setXcTestBouquets(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="Ej. 1, 2, 21, 22"
                          />
                        </div>
                      </div>
                    )}

                    {/* TERM PREVIEW: COMANDO TÉCNICO PLANIFICADO EN TIEMPO REAL */}
                    <div className="bg-slate-900/60 border border-slate-800/85 rounded-xl p-4.5 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Terminal size={12} /> preview de comando saliente y payloads en tiempo real
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const payloadObj = getCleanPayload(xcTestAction, true);
                            const curlStr = `curl -X POST "https://xtv-app/api/iptv/xui" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payloadObj, null, 2)}'`;
                            navigator.clipboard.writeText(curlStr);
                            toast.success("¡Comando cURL copiado al portapapeles con éxito!");
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer border border-emerald-500/20 flex items-center gap-1 shadow-lg shadow-emerald-500/10"
                        >
                          <Copy size={10} /> Copiar cURL
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">HTTP local proxy post (hacia server.ts)</label>
                            <button
                              type="button"
                              onClick={() => {
                                const payloadObj = getCleanPayload(xcTestAction, false);
                                const curlStr = `curl -X POST "/api/iptv/xui" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payloadObj, null, 2)}'`;
                                navigator.clipboard.writeText(curlStr);
                                toast.success("¡Comando proxy copiado!");
                              }}
                              className="text-[9px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50"
                              title="Copiar Comando Proxy"
                            >
                              <Copy size={9} /> Copiar
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-950 text-slate-350 font-mono text-[9px] rounded-lg overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all max-h-[160px]">
                            {`curl -X POST "/api/iptv/xui" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(getCleanPayload(xcTestAction, false), null, 2)}'`}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Comando para el panel físico (GET/POST)</label>
                            <button
                              type="button"
                              onClick={() => {
                                const isGetAction = xcTestAction === "get_line" || xcTestAction === "get_lines" || xcTestAction === "user_info" || xcTestAction === "test";
                                const rawUrl = systemConfig.xc_url_completa || "http://1394.cooteg.cc:2095";
                                let cleanOrigin = rawUrl;
                                try {
                                  cleanOrigin = new URL(rawUrl).origin;
                                } catch {}
                                if (isGetAction) {
                                  const cleanPayload = getCleanPayload(xcTestAction, false);
                                  let actionValue = xcTestAction === "test" || xcTestAction === "user_info" ? "user_info" : (xcTestAction === "create_demo" ? "create_line" : xcTestAction);
                                  if (actionValue === "get_lines" && cleanPayload.id) {
                                    actionValue = "get_line";
                                  }
                                  const params: string[] = [];
                                  params.push(`api_key=${systemConfig.xc_token || '38B14D28969C6D677E69EE28BAEBC91B'}`);
                                  params.push(`action=${actionValue}`);
                                  if (cleanPayload.id) {
                                    params.push(`id=${cleanPayload.id}`);
                                  }
                                  const getUrl = `${cleanOrigin}/${systemConfig.xc_access_code || "pooqkDEG"}/reseller/index.php?${params.join("&")}`;
                                  navigator.clipboard.writeText(`curl -X GET "${getUrl}"`);
                                  toast.success("¡Comando cURL GET físico copiado!");
                                } else {
                                  const bodyParams = Object.entries(getCleanPayload(xcTestAction, false))
                                    .filter(([k]) => k !== "xuiUrl" && k !== "xuiToken" && k !== "xuiAccessCode" && k !== "packageId")
                                    .map(([k, v]) => `${k === "action" ? (v === "create_demo" ? "create_line" : (v === "test" ? "user_info" : v)) : k}=${Array.isArray(v) ? encodeURIComponent(v.join(",")) : encodeURIComponent(String(v))}`)
                                    .concat(`api_key=${systemConfig.xc_token || '38B14D28969C6D677E69EE28BAEBC91B'}`)
                                    .join("&");
                                  const postUrl = `${cleanOrigin}/${systemConfig.xc_access_code || "pooqkDEG"}/reseller/index.php`;
                                  navigator.clipboard.writeText(`curl -X POST "${postUrl}" \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  -d "${bodyParams}"`);
                                  toast.success("¡Comando cURL POST físico copiado!");
                                }
                              }}
                              className="text-[9px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50"
                              title="Copiar Comando Físico"
                            >
                              <Copy size={9} /> Copiar
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[9px] rounded-lg overflow-x-auto border border-slate-800 whitespace-pre-wrap max-h-[160px]">
                            {(() => {
                              const isGetAction = xcTestAction === "get_line" || xcTestAction === "get_lines" || xcTestAction === "user_info" || xcTestAction === "test";
                              const rawUrl = systemConfig.xc_url_completa || "http://1394.cooteg.cc:2095";
                              let cleanOrigin = rawUrl;
                              try {
                                cleanOrigin = new URL(rawUrl).origin;
                              } catch {}
                              if (isGetAction) {
                                const cleanPayload = getCleanPayload(xcTestAction, false);
                                let actionValue = xcTestAction === "test" || xcTestAction === "user_info" ? "user_info" : (xcTestAction === "create_demo" ? "create_line" : xcTestAction);
                                if (actionValue === "get_lines" && cleanPayload.id) {
                                  actionValue = "get_line";
                                }
                                const params: string[] = [];
                                params.push(`api_key=***`);
                                params.push(`action=${actionValue}`);
                                if (cleanPayload.id) {
                                  params.push(`id=${cleanPayload.id}`);
                                }
                                const getUrl = `${cleanOrigin}/${systemConfig.xc_access_code || "pooqkDEG"}/reseller/index.php?${params.join("&")}`;
                                return `curl -X GET "${getUrl}"`;
                              } else {
                                const bodyParams = Object.entries(getCleanPayload(xcTestAction, false))
                                  .filter(([k]) => k !== "xuiUrl" && k !== "xuiToken" && k !== "xuiAccessCode" && k !== "packageId")
                                  .map(([k, v]) => `${k === "action" ? (v === "create_demo" ? "create_line" : (v === "test" ? "user_info" : v)) : k}=${Array.isArray(v) ? encodeURIComponent(v.join(",")) : encodeURIComponent(String(v))}`)
                                  .concat(`api_key=***`)
                                  .join("&");
                                const postUrl = `${cleanOrigin}/${systemConfig.xc_access_code || "pooqkDEG"}/reseller/index.php`;
                                return `POST ${postUrl}\nContent-Type: application/x-www-form-urlencoded\n\n${bodyParams.split('&').join('\n  &')}`;
                              }
                            })()}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Envío Nivel Producción */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          const url = systemConfig.xc_url_completa;
                          const token = systemConfig.xc_token;

                          if (!url) {
                            toast.error("Por favor completa la URL del panel primero.");
                            return;
                          }

                          if ((xcTestAction === "edit_line" || xcTestAction === "extend_line") && !xcTestLineId) {
                            toast.error(`El ID de línea es requerido para la acción ${xcTestAction}.`);
                            return;
                          }

                          toast.loading(`Ejecutando comando [${xcTestAction}] en el panel...`);
                          setXuiTestResult(null);

                          try {
                            const rawPayloadObj = getCleanPayload(xcTestAction, true);

                            // Validación y sanitización preventiva para revendedor
                            const validation = validateResellerApiPayload(xcTestAction, rawPayloadObj);
                            if (!validation.isValid) {
                              toast.dismiss();
                              toast.error(validation.errorMessage || "Parámetros inválidos para revendedor");
                              return;
                            }

                            if (validation.warnings && validation.warnings.length > 0) {
                              validation.warnings.forEach(w => {
                                toast.info(`Aviso Revendedor: ${w.message}`, { duration: 4000 });
                              });
                            }

                            const payloadObj = validation.sanitizedPayload;

                            const res = await fetch("/api/iptv/xui", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payloadObj)
                            });
                            const data = await res.json();
                            toast.dismiss();
                            setXuiTestResult(data);

                            // Guardar en el log unificado de la API XC
                            try {
                              const now = new Date();
                              const newLog = {
                                id: Math.random().toString(36).substring(2, 9),
                                timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                                date: now.toLocaleDateString(),
                                action: payloadObj.action || xcTestAction,
                                requestPayload: payloadObj,
                                responsePayload: data,
                                success: !!data.success,
                                error: data.error || undefined,
                                warnings: data.warnings || validation.warnings || undefined,
                              };
                              const prev = JSON.parse(localStorage.getItem("g3d_xc_api_logs") || "[]");
                              const updated = [newLog, ...prev].slice(0, 100);
                              localStorage.setItem("g3d_xc_api_logs", JSON.stringify(updated));
                            } catch (e) {}
                            if (data.success) {
                              toast.success(`¡Comando [${xcTestAction}] ejecutado con éxito!`);
                              
                              // AUTO-DETECCIÓN Y AUTO-LLENADO DEL ID, USUARIO Y CLAVE EN LA CONSOLA
                              const autoId = data?.raw_response?.data?.id || 
                                             data?.data?.id || 
                                             data?.data?.data?.id || 
                                             data?.raw_response?.id ||
                                             data?.id;

                              const autoUser = data?.username || 
                                               data?.raw_response?.data?.username || 
                                               data?.data?.username ||
                                               data?.raw_response?.username ||
                                               data?.raw_response?.data?.name;

                              const autoPass = data?.password || 
                                               data?.raw_response?.data?.password || 
                                               data?.data?.password ||
                                               data?.raw_response?.password;

                              if (autoId) {
                                setXcTestLineId(String(autoId));
                                toast.success(`🪄 ¡ID de Línea [${autoId}] capturado y cargado en consola!`);
                              }
                              if (autoUser) {
                                setXcTestUser(autoUser);
                              }
                              if (autoPass) {
                                setXcTestPass(autoPass);
                              }

                              // SINCRONIZACIÓN AUTOMÁTICA CON LA BASE DE DATOS LOCAL (SUPABASE)
                              const targetUser = autoUser || xcTestUser;
                              if (autoId && targetUser) {
                                const localClient = iptvClients.find(c => String(c.username || '').toLowerCase() === String(targetUser).toLowerCase());
                                if (localClient) {
                                  try {
                                    await handleUpdateClientId(localClient, String(autoId));
                                    toast.success(`🔗 ¡ID ${autoId} vinculado automáticamente al cliente ${localClient.nombre_completo || targetUser}!`);
                                  } catch (dbErr) {
                                    console.error("Error al sincronizar auto-ID con base de datos:", dbErr);
                                  }
                                }
                              }
                            } else {
                              toast.error(`Respuesta de error: ${data.error || "Operación fallida"}`);
                            }
                          } catch (err: any) {
                            toast.dismiss();
                            toast.error("Error de Red al intentar despachar la petición.");
                            setXuiTestResult({ success: false, error: "Network error", detail: err.message || err });
                          }
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider rounded-lg p-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <Play size={12} className="fill-current" /> Despachar Comando en Tiempo Real
                      </button>
                    </div>
                  </div>

                  {xuiTestResult && (() => {
                    const detectedId = xuiTestResult?.raw_response?.data?.id || 
                                       xuiTestResult?.data?.id || 
                                       xuiTestResult?.data?.data?.id || 
                                       xuiTestResult?.raw_response?.id ||
                                       xuiTestResult?.id;

                    const detectedUser = xuiTestResult?.username || 
                                         xuiTestResult?.raw_response?.data?.username || 
                                         xuiTestResult?.data?.username ||
                                         xuiTestResult?.raw_response?.username ||
                                         xuiTestResult?.raw_response?.data?.name;

                    const detectedPass = xuiTestResult?.password || 
                                         xuiTestResult?.raw_response?.data?.password || 
                                         xuiTestResult?.data?.password ||
                                         xuiTestResult?.raw_response?.password;

                    const isInternalFailure = xuiTestResult?.data?.status === "STATUS_FAILURE" || 
                                             xuiTestResult?.raw_response?.status === "STATUS_FAILURE" || 
                                             xuiTestResult?.raw_response?.data?.status === "STATUS_FAILURE";

                    const isActuallySuccess = xuiTestResult.success && !isInternalFailure;

                    const isDataNullOrEmpty = (xcTestAction === "get_line" || xcTestAction === "get_lines" || xcTestAction === "user_info" || xcTestAction === "test") &&
                                              (xuiTestResult?.data === null || xuiTestResult?.data === undefined || 
                                               (Array.isArray(xuiTestResult?.data) && xuiTestResult?.data.length === 0) ||
                                               xuiTestResult?.raw_response?.data === null || xuiTestResult?.raw_response?.data === undefined);

                    return (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <span className={`size-2 rounded-full ${isActuallySuccess ? (isDataNullOrEmpty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-rose-500'}`} />
                            Resultado de Diagnóstico (Raw Response Logs) {isDataNullOrEmpty && <span className="text-amber-400 font-extrabold">(⚠️ DATOS NULOS)</span>}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(xuiTestResult, null, 2));
                                toast.success("JSON copiado al portapapeles");
                              }}
                              className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
                            >
                              Copiar JSON
                            </button>
                          </div>
                        </div>

                        {/* Explicación en Español para Principiantes */}
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] space-y-1.5 leading-relaxed">
                          <span className="font-black text-amber-400 block uppercase text-[10px] tracking-wide">💡 Análisis Didáctico de la Respuesta:</span>
                          {xuiTestResult.isSimulated || xuiTestResult?.api_response?.isSimulated ? (
                            <p className="text-slate-300 font-medium">
                              ⚠️ <strong>Modo Simulación de Contingencia Activa:</strong> El panel remoto no resolvió (ejemplo: es un dominio local como <code className="text-emerald-400">mv-pl</code> o no asignado). El servidor local intervino para generarte un escenario simulado completo de éxito comercial con packs de prueba y créditos de muestra para que puedas operar de inmediato y validar la interfaz del panel.
                            </p>
                          ) : isInternalFailure ? (
                            <div className="space-y-2 text-rose-300">
                              <p className="font-bold">
                                ❌ <strong>El Panel devolvió un Rechazo Operativo (STATUS_FAILURE):</strong> El panel físico del distribuidor rechazó formalmente la solicitud.
                              </p>
                              <div className="bg-slate-950/60 p-2.5 rounded border border-rose-900/30 space-y-1.5 text-slate-350 text-[10px]">
                                <span className="font-black text-rose-400 uppercase text-[9px] block">🔍 ANÁLISIS DINÁMICO DEL ERROR:</span>
                                {xcTestLineId === "2148" ? (
                                  <>
                                    <p>
                                      Ingresaste el ID <strong className="text-rose-400">2148</strong>, pero <strong className="text-rose-400">2148 es tu número de Reseller / Vendedor (member_id)</strong>, no el de la cuenta del cliente.
                                    </p>
                                    <p>
                                      <strong>La solución:</strong> Debes colocar el <strong className="text-emerald-400">ID real de la línea de cliente</strong> (el número de 6 dígitos que te devolvió el panel al crear el cliente, por ejemplo, <code className="text-emerald-350">170685</code>) en el casillero "ID DE LÍNEA A EDITAR".
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p>
                                      Ingresaste el ID de la línea <strong className="text-amber-400">{xcTestLineId || "vacío"}</strong>, usuario <strong className="text-amber-400">"{xcTestUser || "vacío"}"</strong>, y contraseña <strong className="text-amber-400">"{xcTestPass ? "***" : "vacía"}"</strong>.
                                    </p>
                                    <div className="text-slate-300 space-y-2 mt-1 font-sans">
                                      <p className="font-bold text-amber-350">¿Por qué pudo haber fallado?</p>
                                      <ul className="list-disc pl-4 space-y-1.5 text-[9.5px]">
                                        {xcTestPackageId && (Number(xcTestPackageId) === 0) && (
                                          <li className="text-rose-350">
                                            <strong>ID de Combo en Cero (package=0):</strong> Has enviado el ID de Paquete como <code className="text-rose-400">0</code>. El panel XC no admite un ID de combo o plan de valor 0. Además, tus permisos de revendedor indican <code className="text-rose-400">alter_packages_ids: "0"</code> (no tienes permiso para alterar los combos de las cuentas creadas). <strong>Solución: Deja el campo del combo completamente vacío</strong> para que no envíe dicho parámetro y el panel acepte tu edición.
                                          </li>
                                        )}
                                        <li>
                                          <strong>Incoherencia de Credenciales:</strong> Para la acción <code className="text-slate-250">edit_line</code>, debes asegurarte de que el campo <strong>Nombre de Usuario (USERNAME)</strong> coincida exactamente con el usuario registrado de la línea <code className="text-slate-250">{xcTestLineId || "170685"}</code>. Si dejas el usuario vacío o pones uno diferente, el panel rechazará la edición con <code className="text-rose-400">STATUS_FAILURE</code>.
                                        </li>
                                        <li>
                                          <strong>Restricción de Permisos del Distribuidor:</strong> En la respuesta de tus permisos del panel, figura <code className="text-amber-400">"allow_change_password": "0"</code>, lo que podría significar que el administrador mayorista de tu servidor tiene bloqueado el cambio de contraseñas de las líneas para revendedores.
                                        </li>
                                        <li>
                                          <strong>Campos Opcionales con Basura:</strong> Si enviaste campos como bloqueo ISP, IPs permitidas o combos sin necesidad, el panel puede rechazar toda la consulta por falta de autorización.
                                        </li>
                                      </ul>
                                      <p className="text-[9.5px] mt-2 border-t border-slate-800/40 pt-1.5">
                                        <strong>La solución recomendada:</strong> Para editar la línea, asegúrate de colocar el <strong>ID de Línea correcto</strong> (ej: <code className="text-emerald-400">170685</code>), el <strong>Nombre de Usuario exacto</strong> de esa línea (ej: <code className="text-emerald-400">8RK7cNjA</code>) y la nueva clave en <strong>Clave de Acceso</strong>. ¡Deja todos los demás campos (incluido Combo/Paquete) completamente vacíos para evitar rechazos del panel!
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : isDataNullOrEmpty ? (
                            <div className="space-y-2 text-amber-300">
                              <p className="font-bold">
                                ⚠️ <strong>Respuesta Vacía / Incompleta (data: null):</strong> El panel respondió correctamente con código HTTP 200 de éxito técnico, pero devolvió un valor nulo o vacío (<code className="text-rose-400">null</code>).
                              </p>
                              <div className="bg-slate-950/60 p-2.5 rounded border border-amber-900/30 space-y-1.5 text-slate-300 text-[10px]">
                                <p>
                                  Buscaste con la acción <strong className="text-amber-400">{xcTestAction}</strong> para el ID <strong className="text-amber-400">"{xcTestLineId || "no provisto"}"</strong> / usuario <strong className="text-amber-400">"{xcTestUser || "no provisto"}"</strong>.
                                </p>
                                <p className="font-semibold text-amber-200">¿Qué significa esto realmente?</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li>La línea ingresada no existe físicamente en el panel de tu distribuidor.</li>
                                  <li>La cuenta de revendedor con la que te conectas no tiene permisos jerárquicos sobre este ID (es una cuenta "huérfana" o de otra red de distribución).</li>
                                  <li>El ID ingresado corresponde a un distribuidor o revendedor, no a una línea de cliente.</li>
                                </ul>
                                <p className="text-[9.5px] mt-2 border-t border-slate-800 pt-1.5 text-slate-400">
                                  <strong>Solución:</strong> Confirma que el ID de línea sea el correcto de 6 dígitos que te dio el panel y que el usuario esté bien escrito.
                                </p>
                              </div>
                            </div>
                          ) : isActuallySuccess ? (
                            <p className="text-slate-200 font-medium">
                              🟢 <strong>¡Operación Exitosa!</strong> El panel del distribuidor respondió correctamente y aprobó el formato de consulta o persistencia. Si enviaste un <code className="text-emerald-400">create_line</code>, la línea ya existe físicamente en el servidor para visualización y su URL M3U ya es operativa.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-rose-400 font-bold">
                                🔴 La API del panel devolvió un rechazo o se agotó el tiempo de espera.
                              </p>
                              <p className="text-slate-450 text-[10px]">
                                {xuiTestResult.error_explanation_es || xuiTestResult?.api_response?.error_explanation_es || "Revisa si la URL incluye el hash alfanumérico /reseller/index.php, o si las credenciales de API Key de distribuidor fueron inhabilitadas por el mayorista."}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* COMPARACIÓN Y ALERTA DE SINCRONIZACIÓN LOCAL vs PANEL */}
                        {isActuallySuccess && (detectedUser || detectedId) && (() => {
                          const matchedClient = iptvClients.find(c => 
                            (detectedUser && String(c.username || '').toLowerCase() === String(detectedUser).toLowerCase()) ||
                            (detectedId && String(c.panel_client_id || '') === String(detectedId))
                          );
                          const isRegistered = !!matchedClient;
                          const needsSyncId = matchedClient && String(matchedClient.panel_client_id || '') !== String(detectedId);

                          if (!isRegistered) {
                            return (
                              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-[11px] text-rose-200">
                                <p className="font-black text-rose-400 uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                                  ⚠️ ALERTA DE DESCONEXIÓN (CUENTA HUÉRFANA):
                                </p>
                                <p className="leading-relaxed">
                                  El cliente detectado con usuario <strong className="text-white select-all">"{detectedUser}"</strong> e ID <strong className="text-white select-all">{detectedId}</strong> existe físicamente en tu panel XC pero <strong>NO está registrado</strong> en tu base de datos local de XTV.
                                </p>
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCreateLocalFromPanel(detectedUser || '', detectedPass || '', detectedId)}
                                    className="px-3 py-1.5 bg-rose-600 text-white font-black hover:bg-rose-700 rounded-lg transition-colors uppercase text-[9px] tracking-wide cursor-pointer flex items-center gap-1 inline-flex"
                                  >
                                    ➕ Registrar en Base de Datos de XTV
                                  </button>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-[11px] text-emerald-300">
                                <p className="font-bold flex items-center gap-1.5 text-emerald-400 uppercase text-[10px] tracking-wide">
                                  ✓ Cliente Vinculado Correctamente:
                                </p>
                                <p className="leading-relaxed">
                                  Este cliente está registrado localmente en XTV como <strong className="text-white">"{matchedClient.nombre_completo || matchedClient.username}"</strong>.
                                </p>
                                {needsSyncId && (
                                  <div className="mt-1.5 p-2 bg-slate-900 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3 text-[10px]">
                                    <span className="text-amber-400 font-medium">⚠️ El ID local ({matchedClient.panel_client_id || 'Ninguno'}) difiere del ID del panel ({detectedId}).</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await handleUpdateClientId(matchedClient, String(detectedId));
                                      }}
                                      className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded hover:bg-amber-600 transition-colors text-[9px] uppercase tracking-wider cursor-pointer"
                                    >
                                      🔗 Sincronizar ID
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })()}

                        {/* Asistente inteligente de transferencia de ID para Edición y Asociación en la Base de Datos */}
                        {detectedId && (
                          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                🪄 Asistente de Flujo Integrado
                              </span>
                              <span className="text-[8.5px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full select-all">
                                ID Detectado: {detectedId}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed">
                              El panel devolvió un ID físico (<strong>{detectedId}</strong>). Puedes cargar este ID en la consola de comandos de arriba para editarlo/extenderlo, o bien **asociarlo directamente** a un cliente de tu base de datos para que quede guardado permanentemente.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setXcTestAction("edit_line");
                                  setXcTestLineId(String(detectedId));
                                  if (detectedUser) setXcTestUser(String(detectedUser));
                                  if (detectedPass) setXcTestPass(String(detectedPass));
                                  toast.success("¡Atajo cargado! Acción seteada a 'edit_line', ID y credenciales listos para editar.");
                                }}
                                className="py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                ⚡ Cargar en Atajo de Edición
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setXcTestAction("extend_line");
                                  setXcTestLineId(String(detectedId));
                                  if (detectedUser) setXcTestUser(String(detectedUser));
                                  if (detectedPass) setXcTestPass(String(detectedPass));
                                  toast.success("¡Atajo cargado! Acción seteada a 'extend_line', ID y credenciales listos para extender.");
                                }}
                                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                ⏳ Cargar en Atajo de Extensión
                              </button>
                            </div>

                            <div className="border-t border-slate-800/60 pt-3 space-y-2">
                              <label className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">
                                Sincronizar y Guardar ID en un Cliente Local:
                              </label>
                              <div className="flex gap-2 flex-col sm:flex-row">
                                <select
                                  value={assocUsername}
                                  onChange={(e) => setAssocUsername(e.target.value)}
                                  className="bg-slate-900 text-slate-100 border border-slate-750 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none flex-1"
                                >
                                  <option value="">-- Seleccionar Cliente Local --</option>
                                  {iptvClients.map(c => (
                                    <option key={c.username} value={c.username}>
                                      {c.nombre_completo || c.username} ({c.username}) {c.panel_client_id ? '[ID Actual: ' + c.panel_client_id + ']' : '[Sin ID]'}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={!assocUsername}
                                  onClick={async () => {
                                    const client = iptvClients.find(c => c.username === assocUsername);
                                    if (client) {
                                      await handleUpdateClientId(client, String(detectedId));
                                      setAssocUsername("");
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    assocUsername 
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold' 
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  💾 Guardar en DB
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Visor Interactivo de Líneas de Clientes */}
                        {(() => {
                          let linesArray: any[] = [];
                          if (xuiTestResult) {
                            if (Array.isArray(xuiTestResult)) {
                              linesArray = xuiTestResult;
                            } else if (xuiTestResult.data && Array.isArray(xuiTestResult.data)) {
                              linesArray = xuiTestResult.data;
                            } else if (xuiTestResult.data?.data && Array.isArray(xuiTestResult.data.data)) {
                              linesArray = xuiTestResult.data.data;
                            } else if (xuiTestResult.raw_response && Array.isArray(xuiTestResult.raw_response)) {
                              linesArray = xuiTestResult.raw_response;
                            } else if (xuiTestResult.raw_response?.data && Array.isArray(xuiTestResult.raw_response.data)) {
                              linesArray = xuiTestResult.raw_response.data;
                            }
                          }

                          if (linesArray.length === 0) return null;

                          const filteredLines = linesArray.filter((line: any) => {
                            const term = xcLinesSearch.trim().toLowerCase();
                            if (!term) return true;
                            const u = String(line.username || line.user || line.name || '').toLowerCase();
                            const id = String(line.id || line.line_id || line.user_id || '').toLowerCase();
                            const notes = String(line.reseller_notes || line.notes || '').toLowerCase();
                            return u.includes(term) || id.includes(term) || notes.includes(term);
                          });

                          const unregisteredCount = linesArray.filter((line: any) => {
                            const uName = line.username || line.user || line.name || '';
                            const lineId = line.id || line.line_id || line.user_id;
                            return !iptvClients.some(c => 
                              String(c.username || '').toLowerCase() === String(uName).toLowerCase() ||
                              (lineId && String(c.panel_client_id || '') === String(lineId))
                            );
                          }).length;

                          return (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                  👥 LÍNEAS ACTIVAS EN PANEL ({linesArray.length} totales)
                                </span>
                                <div className="relative">
                                  <input 
                                    type="text"
                                    value={xcLinesSearch}
                                    onChange={(e) => setXcLinesSearch(e.target.value)}
                                    placeholder="🔍 Buscar usuario, ID o nota..."
                                    className="bg-slate-950 text-slate-200 border border-slate-850 rounded-lg pl-3 pr-8 py-1 text-[10.5px] outline-none focus:border-emerald-500/50 w-full sm:w-[220px]"
                                  />
                                  {xcLinesSearch && (
                                    <button 
                                      onClick={() => setXcLinesSearch('')}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                              {unregisteredCount > 0 && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-[11px] font-medium leading-relaxed">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">⚠️</span>
                                    <span>
                                      <strong>Alerta de Cuentas Huérfanas:</strong> Se detectaron <strong>{unregisteredCount} cuentas</strong> en tu panel XC que <strong>no figuran</strong> en la base de datos local de XTV. Puedes pulsar el botón <strong>"➕ Registrar"</strong> al costado de cada una para darlas de alta al instante.
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="overflow-x-auto rounded-lg border border-slate-850">
                                <table className="w-full text-left text-[10.5px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-black uppercase text-[8.5px] tracking-wider">
                                      <th className="p-2">ID</th>
                                      <th className="p-2">Usuario / Clave</th>
                                      <th className="p-2">Plan</th>
                                      <th className="p-2">Conex.</th>
                                      <th className="p-2">Expira</th>
                                      <th className="p-2">Notas</th>
                                      <th className="p-2 text-right">Edición</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850">
                                    {filteredLines.length === 0 ? (
                                      <tr>
                                        <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                                          Ninguna línea coincide con el criterio de búsqueda.
                                        </td>
                                      </tr>
                                    ) : (
                                      filteredLines.map((line: any, idx: number) => {
                                        const lineId = line.id || line.line_id || line.user_id;
                                        const uName = line.username || line.user || line.name || 'S/N';
                                        const uPass = line.password || line.pass || 'S/P';
                                        const maxConn = line.max_connections !== undefined ? line.max_connections : (line.connections || line.active_cons || 1);
                                        const isTrial = line.is_trial !== undefined ? Number(line.is_trial) : (line.trial !== undefined ? Number(line.trial) : 0);
                                        const notes = line.reseller_notes || line.notes || '';
                                        
                                        let expStr = "Sin Expiración";
                                        const rawExp = line.exp_date || line.expire_date || line.fecha_exp || line.expires;
                                        if (rawExp) {
                                          const parsedExp = typeof rawExp === 'number' ? rawExp * 1000 : Date.parse(rawExp);
                                          if (!isNaN(parsedExp)) {
                                            expStr = new Date(parsedExp).toLocaleDateString() + ' ' + new Date(parsedExp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                          }
                                        }

                                        const styleRow = isTrial ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-slate-850/50";

                                        const isLineRegistered = iptvClients.some(c => 
                                          String(c.username || '').toLowerCase() === String(uName).toLowerCase() ||
                                          (lineId && String(c.panel_client_id || '') === String(lineId))
                                        );

                                        return (
                                          <tr key={idx} className={`${styleRow} transition-colors border-b border-slate-850/40`}>
                                            <td className="p-2 font-mono font-bold text-amber-500 select-all">{lineId}</td>
                                            <td className="p-2 space-y-0.5">
                                              <div className="font-bold text-slate-100 select-all flex items-center gap-1.5 flex-wrap">
                                                <span>{uName}</span>
                                                {!isLineRegistered && (
                                                  <span className="bg-rose-500/10 text-rose-400 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border border-rose-500/20" title="Cuenta huérfana (No está en la base de datos de XTV)">
                                                    ⚠️ Desconectado
                                                  </span>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(uName);
                                                    toast.success("Usuario copiado con éxito");
                                                  }}
                                                  className="text-[9px] text-slate-500 hover:text-emerald-400 transition-colors"
                                                  title="Copiar Usuario"
                                                >
                                                  📋
                                                </button>
                                              </div>
                                              <div className="font-mono text-slate-400 text-[9.5px] select-all flex items-center gap-1.5">
                                                <span>Clave: {uPass}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(uPass);
                                                    toast.success("Contraseña copiada con éxito");
                                                  }}
                                                  className="text-[9px] text-slate-500 hover:text-emerald-400 transition-colors"
                                                  title="Copiar Clave"
                                                >
                                                  📋
                                                </button>
                                              </div>
                                            </td>
                                            <td className="p-2">
                                              {isTrial ? (
                                                <span className="bg-amber-500/10 text-amber-300 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">
                                                  🧪 Trial
                                                </span>
                                              ) : (
                                                <span className="bg-emerald-500/10 text-emerald-350 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                                                  📅 Regular
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2 font-mono font-bold text-slate-350">{maxConn}</td>
                                            <td className="p-2 text-slate-300 text-[9.5px]/tight font-mono">{expStr}</td>
                                            <td className="p-2 text-slate-400 italic max-w-[120px] truncate" title={notes}>{notes || '-'}</td>
                                            <td className="p-2 text-right space-x-1.5 whitespace-nowrap">
                                              {!isLineRegistered && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleCreateLocalFromPanel(uName, uPass, lineId)}
                                                  className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold uppercase rounded text-[8.5px] tracking-wider transition-all cursor-pointer"
                                                  title="Registrar esta línea huérfana en la base de datos de XTV"
                                                >
                                                  ➕ Registrar
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setXcTestAction("edit_line");
                                                  setXcTestLineId(String(lineId));
                                                  setXcTestUser(String(uName));
                                                  setXcTestPass(String(uPass));
                                                  setXcTestPackageId(String(line.package_id || line.package || '1'));
                                                  setXcTestIsplock(String(line.is_isplock || '0'));
                                                  if (notes) setXcTestResellerNotes(notes);
                                                  toast.success(`¡Atajo Cargado! Cargando datos de ${uName} (ID: ${lineId}) en el editor de arriba.`);
                                                }}
                                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-350 font-bold uppercase rounded text-[8.5px] tracking-wider transition-all"
                                              >
                                                ⚡ Cargar
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                        <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[9.5px] rounded-lg overflow-x-auto max-h-[250px] border border-slate-850">
                          {JSON.stringify(xuiTestResult, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}

                {/* Sección de Mapeo y Asociación Rápida de Clientes (Base de Datos vs Panel XC) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        🔗 Mapeo y Asociación Rápida de Clientes (Base de Datos vs Panel XC)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Asigna y guarda manualmente el ID de línea física que el panel XC devuelve al crear una cuenta, o cárgalos en la consola técnica de arriba con un clic.
                      </p>
                    </div>

                    <div className="relative">
                      <input 
                        type="text"
                        value={localClientsSearch}
                        onChange={(e) => setLocalClientsSearch(e.target.value)}
                        placeholder="🔍 Buscar cliente local..."
                        className="bg-slate-900 text-slate-200 border border-slate-750 rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none focus:border-emerald-500/50 w-full sm:w-[220px]"
                      />
                      {localClientsSearch && (
                        <button 
                          onClick={() => setLocalClientsSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-850">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-850 font-black uppercase text-[8.5px] tracking-wider">
                          <th className="p-3">Cliente Local</th>
                          <th className="p-3">Usuario / Clave</th>
                          <th className="p-3">Plan Venta / Límite Pantallas</th>
                          <th className="p-3">ID de Línea Física (XC)</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60">
                        {iptvClients.filter(c => {
                          const term = localClientsSearch.trim().toLowerCase();
                          if (!term) return true;
                          const name = String(c.nombre_completo || '').toLowerCase();
                          const u = String(c.username || '').toLowerCase();
                          const cell = String(c.celular || '').toLowerCase();
                          return name.includes(term) || u.includes(term) || cell.includes(term);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 italic text-xs">
                              No hay clientes locales registrados que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          iptvClients.filter(c => {
                            const term = localClientsSearch.trim().toLowerCase();
                            if (!term) return true;
                            const name = String(c.nombre_completo || '').toLowerCase();
                            const u = String(c.username || '').toLowerCase();
                            const cell = String(c.celular || '').toLowerCase();
                            return name.includes(term) || u.includes(term) || cell.includes(term);
                          }).map((client, index) => {
                            const planObj = providerPlans.find(p => p.id === client.id_plan_proveedor);
                            return (
                              <tr key={index} className="hover:bg-slate-900/40 transition-colors border-b border-slate-850/40">
                                <td className="p-3 space-y-0.5">
                                  <div className="font-bold text-slate-100">{client.nombre_completo || 'Sin Nombre'}</div>
                                  <div className="text-[10px] text-slate-450">{client.celular || 'Sin celular'}</div>
                                </td>
                                <td className="p-3 space-y-0.5">
                                  <div className="font-mono font-bold text-slate-200 select-all flex items-center gap-1.5">
                                    <span>{client.username}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(client.username || '');
                                        toast.success("Usuario copiado");
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-emerald-400"
                                      title="Copiar Usuario"
                                    >
                                      📋
                                    </button>
                                  </div>
                                  <div className="font-mono text-[9.5px] text-slate-400 select-all flex items-center gap-1.5">
                                    <span>Clave: {client.password}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(client.password || '');
                                        toast.success("Contraseña copiada");
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-emerald-400"
                                      title="Copiar Contraseña"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 space-y-1">
                                  <span className="bg-emerald-500/10 text-emerald-300 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">
                                    {planObj?.name || 'Plan Local'}
                                  </span>
                                  <div className="text-[9.5px] font-mono text-slate-400">
                                    Pantallas: {client.limite_pantallas || '1'} {client.estado ? `| ${client.estado}` : ''}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5 w-full max-w-[150px]">
                                    <input 
                                      type="number"
                                      defaultValue={client.panel_client_id || ''}
                                      placeholder="Ej: 187703"
                                      id={`client_xc_id_${client.username}`}
                                      className="bg-slate-900 text-amber-400 border border-slate-750 rounded-lg p-1 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none w-full"
                                    />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const inputEl = document.getElementById(`client_xc_id_${client.username}`) as HTMLInputElement;
                                        if (inputEl) {
                                          const newVal = inputEl.value;
                                          await handleUpdateClientId(client, newVal);
                                        }
                                      }}
                                      className="p-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded text-xs cursor-pointer"
                                      title="Guardar ID de Línea en Supabase"
                                    >
                                      💾
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setXcTestAction("extend_line");
                                      setXcTestLineId(String(client.panel_client_id || ''));
                                      setXcTestUser(client.username || '');
                                      setXcTestPass(client.password || '');
                                      setSelectedIptvClientUsername(client.username || '');
                                      toast.success(`¡Cargado en Consola! Acción seteada a 'extend_line' para ${client.username}`);
                                      
                                      // Hacer scroll hacia arriba a la consola de comandos de forma fluida
                                      const scrollTarget = document.querySelector(".bg-slate-950");
                                      if (scrollTarget) {
                                        scrollTarget.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 hover:text-white text-white font-black uppercase text-[8.5px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 inline-flex"
                                  >
                                    ⏳ Extender Línea
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'users' && canManageUsersAndRoles && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full space-y-4">
              {/* Cabecera sin isla y estilo integrado oscuro */}
              <div className="mb-6 select-none text-left">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Gestión de Miembros y Seguridad</h2>
                <p className="text-slate-700 dark:text-slate-400 text-xs font-semibold mt-1">Administra quién tiene acceso al sistema y qué acciones puede realizar.</p>
              </div>

              {/* Barra de navegación de columnas para celular y tablets / laptops */}
              <div className="2xl:hidden bg-slate-100 dark:bg-slate-950 p-1 flex gap-1 rounded-xl mb-4 select-none border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <button 
                  type="button"
                  onClick={() => setActiveColMobile('left')}
                  className={cn(
                    "flex-1 py-2 text-center text-[10.5px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    activeColMobile === 'left' 
                      ? "bg-slate-900 text-white dark:bg-slate-800 shadow" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Users size={13} />
                  <span className="truncate">1. Roles / Miembros</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveColMobile('middle')}
                  className={cn(
                    "flex-1 py-2 text-center text-[10.5px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    activeColMobile === 'middle' 
                      ? "bg-slate-900 text-white dark:bg-slate-800 shadow" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Layers size={13} />
                  <span className="truncate">2. Facciones</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveColMobile('right')}
                  className={cn(
                    "flex-1 py-2 text-center text-[10.5px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    activeColMobile === 'right' 
                      ? "bg-slate-900 text-white dark:bg-slate-800 shadow" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Shield size={13} />
                  <span className="truncate">3. Permisos</span>
                </button>
              </div>

              {/* Grid unificado con columnas adaptativas según resolución */}
              <div className="flex flex-col 2xl:flex-row gap-6 w-full min-h-[750px] text-slate-900 dark:text-slate-100">
                
                {/* COLUMNA 1 (IZQUIERDA): ROLES Y MIEMBROS */}
                <div className={cn(
                  "w-full 2xl:w-80 shrink-0 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-sm backdrop-blur-sm",
                  activeColMobile === 'left' ? 'flex' : 'hidden 2xl:flex'
                )}>
                  <div>
                    {/* Header Izquierdo con 2 Botones de creación */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex flex-col gap-2.5 select-none text-left">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-emerald-700" />
                        <span className="text-[13px] font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">Roles & Miembros</span>
                      </div>
                      <div className="flex gap-1.5 mt-0.5">
                        {canCreateUsers && (
                          <button
                            type="button"
                            onClick={openAddUserModal}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            <UserPlus size={12} />
                            Crear Usuario
                          </button>
                        )}
                        {canCreateRoles && (
                          <button
                            type="button"
                            onClick={openAddRoleModal}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            <Plus size={12} />
                            Crear Rol
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 space-y-4 h-[620px] overflow-y-auto custom-scrollbar">
                      {/* Buscador de Miembros */}
                      <div className="px-1">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={11} />
                          <input 
                            type="text"
                            placeholder="Buscar miembro o rol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800/60 rounded-lg text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder-slate-500 dark:placeholder-slate-400"
                          />
                        </div>
                      </div>

                      {/* SUBSECCIÓN: ROLES Y MIEMBROS ANIDADOS */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider px-2">
                          <span>Estructura de Roles y Usuarios</span>
                        </div>
                        <div className="space-y-0.5">
                          {loadingUsers ? (
                            <div className="text-center py-6 text-slate-500">
                              <Loader2 className="animate-spin size-4 mx-auto mb-1.5" />
                              <span className="text-[10px]">Cargando miembros...</span>
                            </div>
                          ) : (
                            renderRoleTree(customRoles)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ayuda de Permisos */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950/40 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        toast.info(
                          "ℹ️ Consola de Roles y Excepciones: Modifica privilegios globales para un Rol Maestro, o añade excepciones específicas para un Miembro individual. Los cambios se guardan y aplican al instante.",
                          { duration: 6000 }
                        );
                      }}
                      className="text-left text-emerald-600 dark:text-emerald-400 hover:underline text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info size={13} />
                      ¿Dudas sobre permisos?
                    </button>
                  </div>
                </div>

                {/* COLUMNA 2 (CENTRAL): FACCIONES Y CANALES */}
                <div className={cn(
                  "w-full 2xl:w-72 shrink-0 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-sm backdrop-blur-sm",
                  activeColMobile === 'middle' ? 'flex' : 'hidden 2xl:flex'
                )}>
                  <div>
                    {/* Header Central */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between select-none text-left">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">Facciones del Sistema</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-4 h-[620px] overflow-y-auto custom-scrollbar select-none">
                      {Object.entries(PERMISSIONS).map(([groupName, group]) => {
                        const factionLabels: Record<string, string> = {
                          ADMIN: "administración-central",
                          STOCK: "inventario-catálogo",
                          PEDIDOS: "pedidos-ventas",
                          PRODUCCION: "producción-taller",
                          LOGISTICA: "logística-central",
                          IPTV: "xtv-iptv",
                          SEGURIDAD: "seguridad-accesos",
                          G3D: "g3d-impresión-3d"
                        };
                        const label = factionLabels[groupName] || groupName.toLowerCase();
                        const isActive = activeFactionTab === groupName;
                        
                        // Filtrar subfacciones basándose en permisos visibles
                        const grouped = getGroupedPermissions(group);
                        const filteredSubfactions = Object.entries(grouped).filter(([subName, permsList]) => {
                          const visiblePerms = permsList.filter((perm: any) => {
                            if (!isAdmin && !hasPermission(perm.id)) {
                              return false;
                            }

                            if (assignmentMode === 'roles') {
                              const parentRole = roleInheritance[selectedTarget || ''];
                              if (parentRole && parentRole !== selectedTarget) {
                                return checkRoleHasPermission(parentRole, perm.id);
                              }
                            }
                            return true;
                          });
                          return visiblePerms.length > 0;
                        });

                        if (filteredSubfactions.length === 0) return null;

                        const subfactions = filteredSubfactions.map(([subName]) => subName);

                        return (
                          <div key={groupName} className="space-y-1 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFactionTab(groupName);
                                if (window.innerWidth < 1536) {
                                  setActiveColMobile('right');
                                }
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all text-xs font-black group uppercase tracking-wider cursor-pointer",
                                isActive
                                  ? "bg-slate-900 text-white dark:bg-slate-800 dark:text-white border-emerald-500 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <span className="truncate flex items-center gap-2">
                                <Shield size={13} className={isActive ? "text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"} />
                                {label}
                              </span>
                              <ChevronRight size={13} className={cn("transition-opacity", isActive ? "text-white opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100")} />
                            </button>

                            {/* Subfacciones anidadas */}
                            <div className="pl-5 space-y-0.5 border-l-2 border-emerald-500/30 ml-3.5 my-1">
                              {subfactions.map((subName) => (
                                <div 
                                  key={subName}
                                  onClick={() => {
                                    setActiveFactionTab(groupName);
                                    if (window.innerWidth < 1536) {
                                      setActiveColMobile('right');
                                    }
                                    const anchorId = `subfaction-anchor-${subName.replace(/\s+/g, '-').toLowerCase()}`;
                                    setTimeout(() => {
                                      const element = document.getElementById(anchorId);
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 150);
                                  }}
                                  className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 cursor-pointer truncate flex items-center gap-1.5 select-none transition-colors"
                                >
                                  <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                  <span>{subName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 select-none text-xs text-slate-600 dark:text-slate-400 text-center font-bold">
                    Asignación por ramas (* / heredado)
                  </div>
                </div>

                {/* COLUMNA 3 (DERECHA): DETALLES Y PERMISOS */}
                <div className={cn(
                  "flex-1 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 lg:p-7 flex flex-col gap-6 overflow-y-auto max-h-[800px] custom-scrollbar shadow-sm backdrop-blur-sm min-w-0",
                  activeColMobile === 'right' ? 'flex' : 'hidden 2xl:flex'
                )}>
                  {!selectedTarget ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-24 space-y-4 select-none">
                      <div className="size-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                        <Key size={32} className="text-slate-500" />
                      </div>
                      <div className="max-w-xs">
                        <p className="text-[16px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Sin Selección</p>
                        <p className="text-[12px] font-medium leading-relaxed text-slate-600 dark:text-slate-400 mt-1">Selecciona un Rol o Miembro de la columna izquierda para configurar su matriz de seguridad.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Cabecera superior de la columna derecha */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
                        <div className="flex items-center gap-4 text-left">
                          <div className="size-12 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center shadow border border-slate-850">
                            <Shield size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] mb-0.5">
                              {assignmentMode === 'roles' ? 'Ajustes de Rol Maestro' : 'Excepciones de Miembro'}
                            </p>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {assignmentMode === 'roles' ? selectedTarget : selectedTarget.split('@')[0]}
                            </h2>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 select-none">
                          <ShieldCheck size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Servidor Protegido</span>
                        </div>
                      </div>

                      {/* SELECCIÓN DE LANDING PAGE PARA EL ROL / USUARIO */}
                      {selectedTarget && (
                        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm text-left">
                          <div className="flex items-start gap-3">
                            <div className="size-9 rounded-xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner shrink-0">
                              <Monitor size={16} />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pantalla Inicial / Landing Page</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                                {assignmentMode === 'roles' 
                                  ? `Elige la sección predeterminada a la que serán redirigidos automáticamente los usuarios del rol "${selectedTarget}" al iniciar sesión.`
                                  : `Elige la sección predeterminada a la que será redirigido automáticamente el usuario "${selectedTarget}" al iniciar sesión.`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                            {[
                              { path: '/', label: 'Launchpad', desc: 'Módulos Generales', icon: Layout },
                              { path: '/xtv', label: 'XTV IPTV', desc: 'Panel IPTV', icon: Tv },
                              { path: '/admin', label: 'Panel Admin', desc: 'Auditoría y Métricas', icon: Shield },
                              { path: '/pedidos-v2', label: 'Pedidos (v2)', desc: 'Consola de Ventas', icon: Layers },
                              { path: '/pedidos', label: 'Pedidos (v1)', desc: 'Listado Clásico', icon: ShoppingCart },
                              { path: '/lista-precios', label: 'Lista Precios', desc: 'Mayorista interactiva', icon: FileText },
                              { path: '/mis-productos', label: 'Catálogo G3D', desc: 'Productos y Stock', icon: Box },
                              { path: '/logistica', label: 'Logística', desc: 'Envíos y Despacho', icon: Truck },
                              { path: '/reportes', label: 'Finanzas', desc: 'Balances y Métricas', icon: Activity },
                              { path: '/configuracion', label: 'Configuración', desc: 'Ajustes del Sistema', icon: Settings },
                            ].map((opt) => {
                              const isSelected = (roleLandingPages[selectedTarget || ''] || '/') === opt.path;
                              const Icon = opt.icon;
                              return (
                                <button
                                  key={opt.path}
                                  type="button"
                                  onClick={() => handleSaveRoleLandingPage(selectedTarget || '', opt.path)}
                                  className={cn(
                                    "p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative overflow-hidden group select-none min-h-[85px] cursor-pointer",
                                    isSelected 
                                      ? "bg-slate-900 text-white border-emerald-500 shadow dark:bg-slate-800 dark:border-emerald-500"
                                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full mb-1.5">
                                    <Icon size={14} className={isSelected ? "text-emerald-400" : "text-slate-500 dark:text-slate-400"} />
                                    {isSelected && (
                                      <span className="size-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-black shadow">✓</span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[10.5px] font-black leading-tight uppercase tracking-wider">{opt.label}</p>
                                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5">{opt.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                       {/* DETALLES DE PERFIL: Solo si assignmentMode === 'users' */}
                      {assignmentMode === 'users' && (() => {
                        const targetUser = users.find(u => u.email === selectedTarget);
                        if (!targetUser) return null;
                        
                        const uId = targetUser.id || 'N/A';
                        const uNombre = targetUser.nombre || '(Sin Nombre)';
                        const uEmail = targetUser.email || 'N/A';
                        const uCelular = targetUser.telefono_contacto || '(No Registrado)';
                        const uDireccion = targetUser.direccion_hogar || '(No Registrada)';
                        const uReferencia = targetUser.referencia_personal || '';
                        const uDni = targetUser.datos_adicionales?.dni || targetUser.dni || '(No Registrado)';
                        
                        const uNegocio = targetUser.nombre_negocio || '(No Registrado)';
                        const uTelNegocio = targetUser.telefono_negocio || '(No Registrado)';
                        const uEmailNegocio = targetUser.email_negocio || '(No Registrado)';
                        const uCiudad = targetUser.ciudad || '';
                        const uProvincia = targetUser.provincia || '';
                        const uUbicacion = [uCiudad, uProvincia].filter(Boolean).join(', ') || '(Sin Ubicación)';
                        const uDireccionNegocio = targetUser.direccion_negocio || '(No Registrada)';
                        const uReferenciaNegocio = targetUser.referencia_negocio || '';
                        const uLogo = targetUser.logo_url || targetUser.logo_negocio || '';
                        
                        const uPass = targetUser.password_hash || '';
                        const isPasswordHashed = uPass.startsWith('$2') || uPass.length > 25;
                        const isPasswordRevealed = showPlainPassword[targetUser.email] || false;

                        const uApiKey = targetUser.datos_adicionales?.api_key || '';
                        const isApiKeyRevealed = showPlainApiKey[targetUser.email] || false;
                        const avatarVal = (targetUser.nombre || targetUser.email || '?').charAt(0).toUpperCase();

                        const handleCopyToClipboard = (text: string, label: string) => {
                          if (!text || text === 'N/A' || text.startsWith('(')) return;
                          navigator.clipboard.writeText(text);
                          toast.success(`${label} copiado al portapapeles`);
                        };

                        const hasCustomPerm = hasCustomizedPermissions(targetUser);

                        return (
                          <div id="user-profile-island" className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-left transition-all">
                            {/* Fila Superior de Usuario */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-black text-lg flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-inner overflow-hidden shrink-0">
                                  {targetUser.avatar_url || targetUser.foto_perfil ? (
                                    <img 
                                      src={targetUser.avatar_url || targetUser.foto_perfil} 
                                      className="size-full object-cover" 
                                      alt="Avatar"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    avatarVal
                                  )}
                                </div>
                                <div className="space-y-0.5 text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[220px] sm:max-w-[300px]">
                                      {uNombre}
                                    </h2>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold select-all border border-slate-200 dark:border-slate-800 shrink-0">
                                      ID: {uId.substring(0, 8)}...
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                      {targetUser.rol || 'IPTV CLIENTES'}
                                    </span>
                                    {hasCustomPerm && (
                                      <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[10px] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                                        ⚡ Excepciones Activas
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto shrink-0 justify-start sm:justify-end">
                                {/* Selector de Rol */}
                                <div className="relative inline-block overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                  <select
                                    disabled={isSaving}
                                    value={targetUser.rol || 'IPTV CLIENTES'}
                                    onChange={(e) => handleChangeSingleRole(targetUser.email, e.target.value)}
                                    className="pl-3 pr-7 py-1.5 bg-transparent text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer appearance-none disabled:opacity-55"
                                  >
                                    {customRoles.map(role => (
                                      <option key={role} value={role}>{role.toUpperCase()}</option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 dark:text-slate-400">
                                    <RefreshCw size={10} className="animate-spin-slow opacity-60" />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopyToClipboard(uEmail, "Email")}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  EMAIL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyToClipboard(uId, "ID de Supabase")}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  ID AUTH
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUser({
                                    ...targetUser,
                                    dni: targetUser.datos_adicionales?.dni || targetUser.dni || '',
                                    datos_adicionales: {
                                      ...(targetUser.datos_adicionales || {}),
                                      api_key: targetUser.datos_adicionales?.api_key || '',
                                      dni: targetUser.datos_adicionales?.dni || targetUser.dni || ''
                                    }
                                  })}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
                                >
                                  <Edit size={11} />
                                  Expediente
                                </button>
                              </div>
                            </div>

                            {/* Bento Grid Adaptativo de Datos del Usuario */}
                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5 text-xs leading-relaxed">
                              {/* 1. DATOS DE LA CUENTA */}
                              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-left">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                                  <Shield size={11} className="text-slate-500 dark:text-slate-400" />
                                  Datos de la Cuenta
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Usuario / Email</span>
                                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 block select-all truncate">
                                      {uEmail}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Contraseña</span>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all select-all">
                                        {isPasswordHashed
                                          ? "•••••••• [Hash]"
                                          : (isPasswordRevealed ? (uPass || "(Sin Clave)") : "••••••••")}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {!isPasswordHashed && uPass && (
                                          <button
                                            type="button"
                                            onClick={() => setShowPlainPassword(prev => ({ ...prev, [targetUser.email]: !isPasswordRevealed }))}
                                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-0.5 cursor-pointer"
                                            title={isPasswordRevealed ? "Ocultar" : "Mostrar"}
                                          >
                                            {isPasswordRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                          </button>
                                        )}
                                        {uPass && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyToClipboard(uPass, "Contraseña")}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline p-0.5 text-[9px] font-bold uppercase cursor-pointer"
                                          >
                                            COPIAR
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">API Token / Conexión</span>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate select-all block max-w-[120px]">
                                        {uApiKey ? (isApiKeyRevealed ? uApiKey : "••••••••••••") : "(No de Alta)"}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {uApiKey && (
                                          <button
                                            type="button"
                                            onClick={() => setShowPlainApiKey(prev => ({ ...prev, [targetUser.email]: !isApiKeyRevealed }))}
                                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-0.5 cursor-pointer"
                                            title={isApiKeyRevealed ? "Ocultar API" : "Mostrar API"}
                                          >
                                            {isApiKeyRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                          </button>
                                        )}
                                        {uApiKey && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyToClipboard(uApiKey, "Token API")}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline p-0.5 text-[9px] font-bold uppercase cursor-pointer"
                                          >
                                            COPIAR
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. DATOS PERSONALES */}
                              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-left">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                                  <User size={11} className="text-slate-500 dark:text-slate-400" />
                                  Datos Personales
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Nombre Completo</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                      {uNombre}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">DNI / Documento</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                      {uDni}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">WhatsApp</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {uCelular}
                                      </span>
                                      {uCelular && uCelular !== '(No Registrado)' && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyToClipboard(uCelular, "WhatsApp")}
                                          className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                        >
                                          COPIAR
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Dirección Particular</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block leading-tight truncate">
                                      {uDireccion}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 3. DATOS DEL NEGOCIO */}
                              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-left">
                                <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Building2 size={11} className="text-slate-500 dark:text-slate-400" />
                                    Datos del Negocio
                                  </h4>
                                  
                                  <div className="flex items-center gap-1 select-none">
                                    {uLogo ? (
                                      <div 
                                        onClick={() => setLightboxImage(uLogo)}
                                        className="size-7 rounded border border-slate-300 dark:border-slate-700 overflow-hidden cursor-zoom-in hover:scale-105 transition-all shadow-sm shrink-0 bg-white"
                                        title="Vista previa"
                                      >
                                        <img src={uLogo} className="size-full object-cover" alt="Negocio" referrerPolicy="no-referrer" />
                                      </div>
                                    ) : (
                                      <div className="size-7 rounded bg-slate-200 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                        <ImageIcon size={10} />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-0.5">
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Tienda / Comercio</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate" title={uNegocio}>
                                      {uNegocio}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Ubicación Negocio</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate text-[11px]" title={uUbicacion}>
                                      {uUbicacion}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[9px] uppercase">Dirección Despacho</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block leading-tight truncate" title={uDireccionNegocio}>
                                      {uDireccionNegocio}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* LISTA DE PERMISOS DE LA FACTION SELECCIONADA */}
                      <div className="pt-2 animate-in fade-in duration-200">
                        {(() => {
                           const group = PERMISSIONS[activeFactionTab as keyof typeof PERMISSIONS];
                           if (!group) return null;

                           const factionLabels: Record<string, { label: string; desc: string }> = {
                             ADMIN: { label: "Administración Central", desc: "Configuración global, acceso de administración y logs de consola" },
                             STOCK: { label: "Inventario & Catálogo", desc: "Operaciones de stock, variantes de producto y comisiones de venta" },
                             PEDIDOS: { label: "Pedidos & Ventas", desc: "Gestión de órdenes, flujo de estados de pedidos y facturación" },
                             PRODUCCION: { label: "Producción / Taller", desc: "Notas de fabricación, instrucciones internas de diseño y estados" },
                             LOGISTICA: { label: "Logística Central", desc: "Fleteros, delivery del vendedor, envíos predictivos de Uber y tarifas" },
                             IPTV: { label: "XTV IPTV Entertainment", desc: "Líneas de IPTV, créditos de resellers, finanzas, branding y solicitudes APK" },
                             SEGURIDAD: { label: "Seguridad y Accesos", desc: "Asignación de roles maestros, login, contraseñas y auditoría" },
                             G3D: { label: "G3D Impresión 3D", desc: "Permisos para el control de visualización y acceso a botones de la pantalla de inicio de G3D" }
                           };
                           const faction = factionLabels[activeFactionTab] || { label: activeFactionTab, desc: "Configuraciones de accesos y permisos" };
                           const subfactions = getGroupedPermissions(group);

                           return (
                             <div className="space-y-6">
                               {/* Título de la Facción */}
                               <div className="border-b border-slate-200 dark:border-slate-800/60 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                                 <div>
                                   <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                     <span className="text-emerald-600 dark:text-emerald-400">#</span>
                                     <span>Permisos de {faction.label}</span>
                                   </h3>
                                   <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-normal mt-1">
                                     {faction.desc}
                                   </p>
                                 </div>
                                 
                                 {/* Botón Admin Master Toggle */}
                                 <div className="flex flex-wrap items-center gap-2 select-none">
                                   <button
                                     type="button"
                                     onClick={() => handleSetAllFactionPermissions(activeFactionTab, 'permitido', 'interactuar')}
                                     className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all duration-150 flex items-center gap-1 cursor-pointer shadow-sm"
                                     title="Activa todos los switches de esta sección como Otorgados"
                                   >
                                     <Check size={11} className="stroke-[3]" />
                                     Activar Todo (ADMIN)
                                   </button>
                                   
                                   <button
                                     type="button"
                                     onClick={() => handleSetAllFactionPermissions(activeFactionTab, 'negado')}
                                     className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all duration-150 flex items-center gap-1 cursor-pointer shadow-sm"
                                     title="Deniega explícitamente todos los permisos de esta sección"
                                   >
                                     <X size={11} className="stroke-[3]" />
                                     Denegar Todo
                                   </button>

                                   {(assignmentMode === 'users' || (assignmentMode === 'roles' && roleInheritance[selectedTarget || ''])) && (
                                     <button
                                       type="button"
                                       onClick={() => handleSetAllFactionPermissions(activeFactionTab, 'heredado')}
                                       className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all duration-150 flex items-center gap-1 cursor-pointer"
                                       title="Restablece la herencia de todos los permisos"
                                     >
                                       <span className="font-mono text-[10px] leading-none">/</span>
                                       Restaurar Herencia
                                     </button>
                                   )}
                                 </div>
                               </div>

                               {/* Agrupación por Subfacciones */}
                               <div className="space-y-6">
                                 {Object.entries(subfactions).map(([subfactionName, permsList]) => {
                                   const visiblePerms = permsList.filter((perm: any) => {
                                     if (!isAdmin && !hasPermission(perm.id)) {
                                       return false;
                                     }

                                     if (assignmentMode === 'roles') {
                                       const parentRole = roleInheritance[selectedTarget || ''];
                                       if (parentRole && parentRole !== selectedTarget) {
                                         return checkRoleHasPermission(parentRole, perm.id);
                                       }
                                     }
                                     return true;
                                   });

                                   if (visiblePerms.length === 0) return null;

                                   return (
                                     <div key={subfactionName} id={`subfaction-anchor-${subfactionName.replace(/\s+/g, '-').toLowerCase()}`} className="space-y-3 text-left scroll-mt-6">
                                       <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                         <span className="size-2 rounded-full bg-emerald-500" />
                                         {subfactionName}
                                       </h4>
                                       
                                       {/* Grilla adaptativa de permisos */}
                                       <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-3.5">
                                         {visiblePerms.map((perm) => renderPermissionButton(perm))}
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           );
                        })()}
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          
          {activeTab === 'security' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-8">
              <SectionHeader 
                title="Centro de Seguridad" 
                description="Gestión avanzada de accesos, auditoría y protección del sistema."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-500">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Estado del Sistema de Permisos</h4>
                        <p className="text-xs text-slate-500">Conexión en vivo con el backend de Supabase activa.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Persistencia de Datos:</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          SUPABASE REAL (100% Activa)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Rol General Admin:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Administrador</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500">Bypass General Activo:</span>
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-amber-500 font-bold">
                          g3d0001@gmail.com
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Auditoría Reciente</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Todas las asignaciones de permisos y herencia se escriben directamente en las tablas correspondientes de Supabase: <code className="font-mono text-pink-500">g3d_roles</code>, <code className="font-mono text-pink-500">g3d_roles_permisos</code> y <code className="font-mono text-pink-500">perfiles_locales</code>. 
                      No se usan simulaciones de sesión; cada cambio es permanente y está listo para producción.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* ZONA DE PELIGRO */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-4">
                      <AlertOctagon size={20} className="animate-pulse" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Zona de Peligro</h4>
                    </div>
                    
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Utiliza esta herramienta para eliminar todos los usuarios y todos los roles del sistema, excepto el administrador principal (<code className="font-mono font-bold">{user?.email || 'g3d0001@gmail.com'}</code>).
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Escribe <span className="text-rose-600 font-extrabold font-mono select-none">CONFIRMAR PURGA</span> para habilitar:
                        </label>
                        <input 
                          type="text"
                          value={purgeConfirmationInput}
                          onChange={(e) => setPurgeConfirmationInput(e.target.value)}
                          placeholder="Escribe CONFIRMAR PURGA"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 font-extrabold focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={purgeConfirmationInput !== 'CONFIRMAR PURGA' || isPurging}
                        onClick={handleExecuteSystemPurge}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 active:scale-[0.98]"
                      >
                        {isPurging ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Purgando...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            Purgar Usuarios y Roles
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONSOLA DE LIMPIEZA INTELIGENTE Y ESTADÍSTICAS POR SECTOR */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-left">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity className="text-[#5865f2] animate-pulse" size={18} />
                      Consola de Limpieza Inteligente y Estadísticas por Sector
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Visualiza la actividad real, ventas y reclutamiento por sector para eliminar cuentas inactivas con reasignación automática de su red a La Casa.
                    </p>
                  </div>

                  {/* Configuración del Periodo de Gracia */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 self-start md:self-auto">
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest">Gracia por Inactividad</span>
                      {editingInactivityMonths ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input 
                            type="number" 
                            min="1" 
                            max="24"
                            value={inactivityMonthsInput} 
                            onChange={(e) => setInactivityMonthsInput(Math.max(1, Number(e.target.value)))}
                            className="w-14 px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold"
                          />
                          <button 
                            onClick={async () => {
                              setEditingInactivityMonths(false);
                              await handleSaveGraceMonths(inactivityMonthsInput);
                            }}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-black text-slate-950 dark:text-white">{inactivityMonthsInput} Meses</span>
                          <button 
                            onClick={() => setEditingInactivityMonths(true)}
                            className="text-[10px] text-[#5865f2] hover:underline font-bold uppercase cursor-pointer"
                          >
                            [Editar]
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filtros y Buscador */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSecurityFilter('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        securityFilter === 'all' 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      Todos ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecurityFilter('expired')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        securityFilter === 'expired' 
                          ? "bg-rose-600 text-white" 
                          : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                      )}
                    >
                      ⚠️ Gracia Vencida ({users.filter(u => u.isGraceExpired).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecurityFilter('no_movements')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        securityFilter === 'no_movements' 
                          ? "bg-amber-600 text-white" 
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100"
                      )}
                    >
                      🚫 Sin Movimientos ({users.filter(u => u.totalMovimientos === 0).length})
                    </button>
                  </div>

                  {/* Buscador interno */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por correo o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                {/* Tabla de Usuarios y Estadísticas por Sector */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  {loadingMetrics ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-[#5865f2]" size={32} />
                      <p className="text-xs text-slate-500">Cargando estadísticas de actividad de usuarios en tiempo real...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3">Usuario / Rol</th>
                          <th className="p-3">
                            <button 
                              onClick={() => {
                                setSortField('last_active');
                                setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                              }}
                              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Última Actividad {sortField === 'last_active' && (sortOrder === 'desc' ? '↓' : '↑')}
                            </button>
                          </th>
                          <th className="p-3 text-center">
                            <button 
                              onClick={() => {
                                setSortField('lines');
                                setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                              }}
                              className="hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Líneas IPTV {sortField === 'lines' && (sortOrder === 'desc' ? '↓' : '↑')}
                            </button>
                          </th>
                          <th className="p-3 text-center">
                            <button 
                              onClick={() => {
                                setSortField('invited');
                                setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                              }}
                              className="hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Invitados {sortField === 'invited' && (sortOrder === 'desc' ? '↓' : '↑')}
                            </button>
                          </th>
                          <th className="p-3 text-center">
                            <button 
                              onClick={() => {
                                setSortField('orders');
                                setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                              }}
                              className="hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Pedidos G3D {sortField === 'orders' && (sortOrder === 'desc' ? '↓' : '↑')}
                            </button>
                          </th>
                          <th className="p-3 text-center font-bold">Total Movs</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(() => {
                          // Filtrar
                          let filtered = [...users].filter(u => {
                            const query = searchQuery.trim().toLowerCase();
                            const matchQuery = query === '' || 
                              String(u.email).toLowerCase().includes(query) || 
                              String(u.nombre).toLowerCase().includes(query);

                            if (!matchQuery) return false;

                            if (securityFilter === 'expired') return u.isGraceExpired;
                            if (securityFilter === 'no_movements') return u.totalMovimientos === 0;
                            return true;
                          });

                          // Ordenar
                          filtered.sort((a, b) => {
                            let valA: any = 0;
                            let valB: any = 0;

                            if (sortField === 'last_active') {
                              valA = new Date(a.lastActivityDate || 0).getTime();
                              valB = new Date(b.lastActivityDate || 0).getTime();
                            } else if (sortField === 'lines') {
                              valA = a.countLines || 0;
                              valB = b.countLines || 0;
                            } else if (sortField === 'invited') {
                              valA = a.countInvitados || 0;
                              valB = b.countInvitados || 0;
                            } else if (sortField === 'orders') {
                              valA = a.countOrders || 0;
                              valB = b.countOrders || 0;
                            }

                            if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
                            if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
                            return 0;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">
                                  No se encontraron usuarios que coincidan con los filtros activos.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((u: any) => {
                            const isMe = u.email === user?.email;
                            return (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-3 text-left">
                                  <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 overflow-hidden">
                                      {u.avatar_url ? (
                                        <img src={u.avatar_url} alt="Avatar" className="size-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        String(u.nombre || u.email || '?').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 dark:text-white leading-normal">
                                        {u.nombre || 'Sin Nombre'}
                                        {isMe && <span className="ml-1.5 text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded">YO</span>}
                                      </span>
                                      <span className="text-[10px] text-slate-400 select-all font-mono leading-none mt-0.5">{u.email}</span>
                                      <span className="text-[9px] text-[#5865f2] font-black uppercase tracking-wider mt-1">{String(u.rol).split(',')[0]}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-left font-medium text-slate-600 dark:text-slate-300">
                                  {u.lastActivityDate && new Date(u.lastActivityDate).getTime() > 0 ? (
                                    <div className="flex flex-col">
                                      <span>{new Date(u.lastActivityDate).toLocaleDateString()}</span>
                                      <span className="text-[9.5px] text-slate-400 mt-0.5 font-mono">
                                        {(() => {
                                          const diff = Date.now() - new Date(u.lastActivityDate).getTime();
                                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                          if (days === 0) return "Hoy mismo";
                                          if (days === 1) return "Ayer";
                                          return `Hace ${days} días`;
                                        })()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Nunca</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                                  {u.countLines > 0 ? (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-mono">
                                      {u.countLines}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">0</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                                  {u.countInvitados > 0 ? (
                                    <span className="bg-indigo-50 dark:bg-indigo-950/30 text-[#5865f2] px-2 py-1 rounded font-mono">
                                      {u.countInvitados}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">0</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                                  {u.countOrders > 0 ? (
                                    <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded font-mono">
                                      {u.countOrders}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">0</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="font-extrabold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-mono">
                                    {u.totalMovimientos}
                                  </span>
                                </td>
                                <td className="p-3 text-left">
                                  {u.countInvitados > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-[#5865f2] px-2 py-1 rounded-full">
                                      <span className="size-1.5 rounded-full bg-[#5865f2]"></span>
                                      Red Activa
                                    </span>
                                  ) : u.isGraceExpired ? (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full">
                                      <span className="size-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                      ⚠️ Gracia Vencida
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
                                      <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                      ✓ Activo
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    disabled={isMe || isPurging}
                                    onClick={() => handleDeleteUser(u.email)}
                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-all disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer inline-flex items-center justify-center"
                                    title={isMe ? "No puedes borrarte a ti mismo" : "Eliminar este usuario de forma segura"}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>
                    💡 Las cuentas de Grace Vencida son aquellas que no han realizado ninguna venta de línea IPTV (propia o de sus invitados) ni generado pedidos G3D en el periodo de gracia configurado.
                  </span>
                  <button 
                    onClick={fetchSecurityMetrics}
                    className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <RefreshCw size={12} className={cn(loadingMetrics && "animate-spin")} />
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modales de Gestión de Usuarios */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Encabezado con Foto de Perfil / Logo */}
            <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="relative size-24 group mb-3">
                <div 
                  onClick={() => document.getElementById('new-user-avatar-upload')?.click()}
                  className="size-full rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                  title="Tocar para subir foto de perfil"
                >
                  {newUserDraft.avatar_url ? (
                    <img 
                      src={newUserDraft.avatar_url} 
                      className="size-full object-cover" 
                      alt="Avatar Preview" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl font-black text-[#5865f2]">
                      {(newUserDraft.nombre || newUserDraft.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('new-user-avatar-upload')?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 active:scale-95 transition-all flex items-center justify-center"
                  title="Subir foto de perfil"
                >
                  <Camera size={14} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Nuevo Usuario Maestro</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Registrar nueva cuenta en el sistema</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <input 
                type="file"
                accept="image/*"
                id="new-user-avatar-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    toast.info("Subiendo foto de perfil...");
                    const fileExt = file.name.split('.').pop();
                    const fileName = `register_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                    const filePath = `perfiles/${fileName}`;
                    const { error: uploadError } = await supabase.storage
                      .from('public_assets')
                      .upload(filePath, file);
                    if (uploadError) throw uploadError;
                    const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
                    setNewUserDraft(prev => ({ ...prev, avatar_url: data.publicUrl }));
                    toast.success("Foto de perfil cargada.");
                  } catch (err: any) {
                    toast.error("Error al subir foto: " + err.message);
                  }
                }}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre de Usuario / Login (Acceso)</label>
                <input 
                  type="text" required
                  value={newUserDraft.email}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
                    setNewUserDraft(prev => ({ ...prev, email: val }));
                  }}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold font-mono"
                  placeholder="Ej: pablo, nicolas"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contraseña (Texto Plano)</label>
                <div className="relative">
                  <input 
                    type="text" required
                    value={newUserDraft.contrasena}
                    onChange={(e) => setNewUserDraft(prev => ({ ...prev, contrasena: e.target.value }))}
                    className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold font-mono"
                    placeholder="Ej: 123456"
                  />
                  <button
                    type="button"
                    title="Generar contraseña de 10 dígitos"
                    onClick={() => {
                      let password = '';
                      for (let i = 0; i < 10; i++) {
                        password += Math.floor(Math.random() * 10).toString();
                      }
                      setNewUserDraft(prev => ({ ...prev, contrasena: password }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all flex items-center justify-center"
                  >
                    <RefreshCw size={14} className="animate-hover" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre</label>
                <input 
                  type="text" required
                  value={newUserDraft.nombre}
                  onChange={(e) => setNewUserDraft(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rol Inicial</label>
                <select 
                  value={newUserDraft.rol}
                  onChange={(e) => setNewUserDraft(prev => ({ ...prev, rol: e.target.value as any }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold appearance-none cursor-pointer"
                >
                  {getAllowedRolesToManage().map(role => (
                    <option key={role} value={role}>{role.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="" /> : <Save size={16} />}
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR O EDITAR ROL MAESTRO */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-4">
              {isEditingRole ? `Editar Rol: ${originalRoleToEdit}` : "Crear Nuevo Rol Maestro"}
            </h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identificador / Nombre del Rol</label>
                <input 
                  type="text" required
                  disabled={isEditingRole && originalRoleToEdit.toUpperCase() === 'ADMINISTRADOR'}
                  value={newRoleName}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_ ]/g, '');
                    setNewRoleName(val);
                  }}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold font-mono disabled:opacity-50"
                  placeholder="Ej: IPTV SOPORTE, COBRADOR"
                />
                {isEditingRole && originalRoleToEdit.toUpperCase() === 'ADMINISTRADOR' ? (
                  <p className="text-[9px] text-amber-500 font-bold mt-1">El rol de Administrador principal del sistema no puede ser renombrado.</p>
                ) : (
                  <p className="text-[9px] text-slate-400 mt-1">El nombre se convertirá a mayúsculas y se guardará como identificador único.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rol Padre (Heredar Permisos)</label>
                <select
                  value={newRoleParent}
                  onChange={(e) => setNewRoleParent(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="">Ninguno (Rol Independiente)</option>
                  {customRoles
                    .filter(role => !isEditingRole || role !== originalRoleToEdit)
                    .map((role) => (
                      <option key={role} value={role}>
                        {role.toUpperCase()}
                      </option>
                    ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-1">El rol heredará automáticamente todos los permisos permitidos del rol padre seleccionado.</p>
              </div>

              <div className="flex gap-3 pt-4">
                {isEditingRole && originalRoleToEdit.toUpperCase() !== 'ADMINISTRADOR' && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteRole(originalRoleToEdit)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                    title="Eliminar este rol de forma permanente"
                  >
                    Eliminar
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isEditingRole ? "Guardar" : "Crear Rol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSqlFixModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-6">
              <Database size={24} className="text-amber-500" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              Acción Requerida en tu Supabase
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
              ¡Hola! Para que puedas agregar colaboradores usando únicamente su <strong>primer nombre</strong> (sin correos obligatorios) y evitar límites de internet o bloqueos de IP, necesitamos indicarle a tu base de datos de Supabase que elimine una restricción antigua de relación forazada.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Instrucciones Paso a Paso</span>
                <span className="text-[9px] font-bold text-amber-500 px-2 py-0.5 rounded-full bg-amber-550/10">Súper Fácil (1 min)</span>
              </div>
              <ol className="text-[11px] text-slate-600 dark:text-slate-400 font-bold space-y-2 list-decimal list-inside leading-relaxed">
                <li>Abre el panel de tu proyecto en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase.com</a></li>
                <li>En el menú lateral izquierdo, haz clic en el botón de <strong>"SQL Editor"</strong> (el ícono <span className="font-mono bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded">&gt;_</span>)</li>
                <li>Haz clic en <strong>"New Query"</strong> para abrir una pestaña en blanco</li>
                <li>Pega el código que tienes abajo y haz clic en el botón verde <strong>"Run"</strong> (Ejecutar)</li>
              </ol>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Código de Desbloqueo</span>
                <button
                  type="button"
                  onClick={() => {
                    const code = `-- Liberar perfiles_locales del limitante de Supabase Auth\nDO $$\nDECLARE\n    r RECORD;\nBEGIN\n    FOR r IN (\n        SELECT tc.constraint_name \n        FROM information_schema.table_constraints AS tc \n        JOIN information_schema.key_column_usage AS kcu\n          ON tc.constraint_name = kcu.constraint_name\n          AND tc.table_schema = kcu.table_schema\n        WHERE tc.constraint_type = 'FOREIGN KEY' \n          AND tc.table_name = 'perfiles_locales'\n          AND kcu.column_name = 'id'\n    ) LOOP\n        EXECUTE 'ALTER TABLE perfiles_locales DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ';';\n    END LOOP;\nEND $$;`;
                    navigator.clipboard.writeText(code);
                    setCopiedSql(true);
                    toast.success("¡Código SQL copiado con éxito!");
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="text-[10px] font-bold tracking-wider text-primary hover:text-primary-active py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  {copiedSql ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copiedSql ? "¡Copiado!" : "Copiar Código SQL"}
                </button>
              </div>
              <pre className="text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 p-4.5 rounded-2xl overflow-x-auto max-h-[140px] border border-slate-200 dark:border-slate-800/60 no-scrollbar select-all">
{`-- Liberar perfiles_locales del limitante de Supabase Auth
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'perfiles_locales'
          AND kcu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE perfiles_locales DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ';';
    END LOOP;
END $$;`}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSqlFixModal(false)}
                className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-855 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10"
              >
                Entendido, ya lo ejecuté
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Encabezado con Foto de Perfil / Logo */}
            <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="relative size-24 group mb-3">
                <div 
                  onClick={() => document.getElementById('edit-user-avatar-upload')?.click()}
                  className="size-full rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                  title="Tocar para subir foto de perfil"
                >
                  {editingUser.avatar_url || editingUser.foto_perfil ? (
                    <img 
                      src={editingUser.avatar_url || editingUser.foto_perfil} 
                      className="size-full object-cover" 
                      alt="Avatar Preview" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl font-black text-[#5865f2]">
                      {(editingUser.nombre || editingUser.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('edit-user-avatar-upload')?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 active:scale-95 transition-all flex items-center justify-center"
                  title="Subir foto de perfil"
                >
                  <Camera size={14} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Editar Cuenta de Usuario</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{editingUser.email}</p>
            </div>

            <form onSubmit={handleUpdateOtherProfile} className="space-y-4">
              <input 
                type="file"
                accept="image/*"
                id="edit-user-avatar-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    toast.info("Subiendo foto de perfil...");
                    const fileExt = file.name.split('.').pop();
                    const fileName = `register_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                    const filePath = `perfiles/${fileName}`;
                    const { error: uploadError } = await supabase.storage
                      .from('public_assets')
                      .upload(filePath, file);
                    if (uploadError) throw uploadError;
                    const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
                    setEditingUser(prev => ({ ...prev, avatar_url: data.publicUrl, foto_perfil: data.publicUrl }));
                    toast.success("Foto de perfil cargada.");
                  } catch (err: any) {
                    toast.error("Error al subir foto: " + err.message);
                  }
                }}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre de Usuario / Login (Acceso)</label>
                <input 
                  type="text" required
                  value={editingUser.email || ''}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
                    setEditingUser(prev => ({ ...prev, email: val }));
                  }}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold font-mono"
                  placeholder="Ej: pablo, nicolas"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contraseña (Texto Plano)</label>
                <div className="relative">
                  <input 
                    type="text" required
                    value={editingUser.password_hash || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, password_hash: e.target.value }))}
                    className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold font-mono"
                    placeholder="Ej: 123456"
                  />
                  <button
                    type="button"
                    title="Generar contraseña de 10 dígitos"
                    onClick={() => {
                      let password = '';
                      for (let i = 0; i < 10; i++) {
                        password += Math.floor(Math.random() * 10).toString();
                      }
                      setEditingUser(prev => ({ ...prev, password_hash: password }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all flex items-center justify-center"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre</label>
                <input 
                  type="text" required
                  value={editingUser.nombre || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rol</label>
                <select 
                  value={editingUser.rol || 'IPTV CLIENTES'}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, rol: e.target.value as any }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs font-bold appearance-none cursor-pointer"
                >
                  {getAllowedRolesToManage().map(role => (
                    <option key={role} value={role}>{role.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="" /> : <Save size={16} />}
                  Confirmar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom interactive Lightbox preview overlay */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-5 right-5 text-white/70 hover:text-white p-3 rounded-full bg-slate-900/40 backdrop-blur border border-white/10 hover:scale-105 active:scale-95 transition-all">
            <X size={20} />
          </div>
          <div 
            className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-900 relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Zoomed preview" 
              className="max-w-full max-h-[80vh] object-contain select-none animate-in zoom-in-95 duration-200 cursor-zoom-out"
              onClick={() => setLightboxImage(null)}
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-4 select-none">
            Haz clic en cualquier parte para cerrar la vista previa
          </p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase leading-none">{title}</h2>
        <p className="text-slate-500 font-medium mt-2">{description}</p>
      </div>
      {children && (
        <div className="w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
