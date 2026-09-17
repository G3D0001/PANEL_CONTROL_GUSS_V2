import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Info, 
  Clock, 
  PlayCircle, 
  Lock, 
  Globe, 
  Key, 
  MessageSquare,
  RefreshCw,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Coins,
  TrendingUp,
  Sparkles,
  Smartphone,
  Layers,
  Percent,
  Settings,
  DollarSign,
  Users,
  Copy,
  Sliders,
  Check,
  RotateCcw,
  Upload,
  Unlock,
  Activity,
  ShieldAlert,
  Database,
  ExternalLink,
  FileText,
  Terminal,
  Save,
  Zap
} from 'lucide-react';
import { apiService, IptvCostoProveedor } from '../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { IptvMessageTemplatesTab } from './IptvMessageTemplatesTab';

// Definición de Interfaces


interface ProviderPlan {
  id: string;
  provider_name?: string; // nombre del proveedor
  name: string; // nombre del plan
  months: number; // duracion
  hours?: number; // duracion en horas (para demos o planes cortos)
  screens: number; // cantidad maxima de dispositivos
  tokens: number; // cantidad de tokens que cuesta
  token_price?: number; // precio del token Individual
  cost: number; // tokens * token_price
  provider_cost_id?: string; // ID del costo de proveedor enlazado en la base de datos
  archived?: boolean;
  is_trial?: number;
  is_official?: number;
  groups?: number[];
  is_bouquet?: boolean;
  bouquet_id?: string;
  max_connections?: number;
  multiple_connections?: number;
  multiconx_pricing?: string;
}

interface SalePlan {
  id: string;
  provider_plan_id?: string; // Modulo mayorista enlazado del proveedor
  name: string; // nombre del plan
  months: number;
  hours?: number; // duracion en horas (para demos o planes cortos)
  screens: number;
  tokens: number;
  price: number;
  screens_api?: number;
  comision?: number;
  comision_vendedor?: number;
  comision_referente?: number;
  categoria_nombre?: string;
  categoria_id?: 'demo' | 'vip' | 'xxx';
  visible?: boolean; // Control de visibilidad en creación de cuentas
  custom_override?: boolean; // Indica si el nombre o precio fue editado manualmente por el usuario
  order?: number; // Orden de visualización en el catálogo y desplegables
}

export const classifyPlanCategory = (plan: { name?: string; is_trial?: boolean | number; tokens?: number; categoria_id?: string; hours?: number; months?: number }): 'demo' | 'vip' | 'xxx' => {
  if (plan.categoria_id === 'xxx' || plan.categoria_id === 'demo' || plan.categoria_id === 'vip') {
    return plan.categoria_id;
  }
  const nameLower = (plan.name || '').toLowerCase();
  if (nameLower.includes('xxx') || nameLower.includes('adult') || nameLower.includes('quitar') || nameLower.includes('agregar') || (nameLower.includes('pack') && !nameLower.includes('mes'))) {
    return 'xxx';
  }
  if (plan.is_trial || (plan.hours && plan.hours > 0 && (!plan.months || plan.months === 0)) || nameLower.includes('demo') || nameLower.includes('prueba') || nameLower.includes('trial') || (plan.tokens === 0 && !nameLower.includes('mes'))) {
    return 'demo';
  }
  return 'vip';
};

export interface IptvAccount {
  username: string;
  password: string;
  url_panel_asignada: string;
  estado: string;
  limite_pantallas: number;
  limite_pantallas_api?: number;
  fecha_vencimiento: string | null;
  comentarios: string;
  fecha_creacion: string;
  id_plan_proveedor?: string;
  id_plan_venta?: string;
  nombre_completo?: string;
  celular?: string;
  direccion_actual?: string;
  primer_login_completado?: boolean;
  bitacora_comentarios?: any[];
  api_sincronizado?: boolean;
  api_error_registro?: string;
  panel_client_id?: string | null;
  member_id?: string | null;
  access_token?: string | null;
  playlist_url?: string | null;
  bouquet?: string | null;
  package_id?: string | null;
  raw_response_json?: any;
}

interface BannerAd {
  id: string;
  name: string;
  imageUrl: string;
  active: boolean;
}

interface QuickReplyTemplate {
  id: string;
  name: string;
  category: 'demo' | 'activation' | 'reminder' | 'custom';
  text: string;
}

const DEFAULT_QUICK_REPLIES: QuickReplyTemplate[] = [
  {
    id: 'qr-demo',
    name: 'Demo Gratis (XTV)',
    category: 'demo',
    text: `Hola {nombre_completo}, ¡bienvenido a xtv! 📺🍿 Aquí tienes tus datos de membresía Demo Gratis:

🌐 Portal / DNS: {host_completo}
👤 Usuario: {username}
🔑 Contraseña: {password}
⏰ Vencimiento: {fecha_vencimiento}

🔗 Link M3U Directo (Copia y pega en tu aplicación):
{m3u_url}

¡Que disfrutes del mejor contenido sin cortes! 😊`
  },
  {
    id: 'qr-activation',
    name: 'Activación VIP / Premium',
    category: 'activation',
    text: `Hola {nombre_completo}, ¡tu membresía VIP ha sido activada correctamente en XTV! 🚀💎

Detalles de tu cuenta:
Plan de Venta: {plan_venta}
🌐 Portal / DNS: {host_completo}
👤 Usuario: {username}
🔑 Contraseña: {password}
⏰ Vencimiento: {fecha_vencimiento}

🔗 Link Playlist M3U Directo:
{m3u_url}

¡Muchas gracias por elegirnos! Si tienes dudas, estamos para ayudarte. 📺✨`
  },
  {
    id: 'qr-reminder',
    name: 'Recordatorio de Vencimiento',
    category: 'reminder',
    text: `Hola {nombre_completo}, te recordamos que tu membresía de XTV está por vencer el {fecha_vencimiento}. ⚠️

Para seguir disfrutando de tus canales de televisión, películas y series favoritas sin cortes, puedes realizar la renovación de tu plan escribiéndonos por este medio.

¡Que tengas un excelente día! 📺🍿`
  }
];

const capitalizeName = (val: string): string => {
  if (!val) return "";
  return val
    .split(/\s+/)
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

export function IptvManagerView() {
  const { user, userRole, hasPermission } = useAuth();

  const isTabAllowed = (tabId: string) => {
    if (!userRole) return false;
    const normalizedRole = userRole.toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR') return true;

    switch (tabId) {
      case 'clientes':
        return hasPermission('Iptv.Clientes.Ver');
      case 'finanzas':
        return hasPermission('Iptv.Finanzas.Ver');
      case 'branding':
        return hasPermission('Iptv.Branding.Ver');
      case 'mensajes':
        return hasPermission('Iptv.Mensajes.Ver');
      case 'solicitudes':
        return hasPermission('Iptv.Solicitudes.Ver');
      default:
        return false;
    }
  };

  const [activeTab, setActiveTab] = useState<'clientes' | 'finanzas' | 'branding' | 'mensajes' | 'solicitudes'>('clientes');
  const [showConsoles, setShowConsoles] = useState(false);

  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      if (isTabAllowed('clientes')) {
        setActiveTab('clientes');
      } else if (isTabAllowed('finanzas')) {
        setActiveTab('finanzas');
      } else if (isTabAllowed('branding')) {
        setActiveTab('branding');
      } else if (isTabAllowed('mensajes')) {
        setActiveTab('mensajes');
      } else if (isTabAllowed('solicitudes')) {
        setActiveTab('solicitudes');
      }
    }
  }, [userRole]);

  // --- ESTADOS IPTV2 CLIENTES REGISTROS (APK & WEB EXT) ---
  const [registros, setRegistros] = useState<any[]>([]);
  const [macs, setMacs] = useState<any[]>([]);
  const [searchRegistros, setSearchRegistros] = useState('');
  const [filterEstadoRegistros, setFilterEstadoRegistros] = useState<'todos' | 'pendiente_aprobacion' | 'activo'>('todos');
  const [selectedRegistroForApprove, setSelectedRegistroForApprove] = useState<any | null>(null);
  const [claveXtreamInput, setClaveXtreamInput] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // --- ESTADOS SIMULADOR ANTIFRAUDE Y CONTROL DE CRÉDITOS ---
  const [antifraudOption, setAntifraudOption] = useState<'prepago' | 'postpago'>('prepago');
  const [vendedores, setVendedores] = useState<any[]>([
    {
      id: '1',
      nombre: 'Gastón Silva (Nuevo)',
      ventas_totales: 3,
      tope_creditos: 10,
      creditos_actuales: 2,
      periodo_restock: 'diario',
      auto_restock_aprobado: false,
      fase_confianza: 1, // 1 = Manual (Cuentas individuales aprobadas por Admin)
      solicitudes_pendientes: 1,
      reestokes_realizados: 0,
      // EXPEDIENTE KYC - CONTROL DE RIESGO
      dni_cuil: '20-42890145-9',
      celular: '+54 9 11 3901-4451',
      direccion: 'General Alvear 3410, Villa Ballester, GBA',
      cbu_alias: 'gaston.silva.mp',
      redes_sociales: 'instagram.com/gaston.silva98',
      notas_seguridad: 'Sin trabajo formal, ingresos irregulares. Se exige cobro previo de cada unidad en Fase 1 antes de activarle créditos.',
      foto_dni_frente: true,
      foto_dni_dorso: true,
      servicio_certificado: false,
      fecha_alta: '2026-05-10',
      riesgo_rating: 'Medio-Alto'
    },
    {
      id: '2',
      nombre: 'Claudio Martínez (Intermedio)',
      ventas_totales: 18,
      tope_creditos: 30,
      creditos_actuales: 15,
      periodo_restock: 'diario',
      auto_restock_aprobado: true,
      fase_confianza: 2, // 2 = Autónomo (Gasta créditos directos)
      solicitudes_pendientes: 0,
      reestokes_realizados: 2,
      // EXPEDIENTE KYC - CONTROL DE RIESGO
      dni_cuil: '20-33451092-2',
      celular: '+54 9 341 550-1289',
      direccion: 'Av. Pellegrini 1420, Rosario, Santa Fe',
      cbu_alias: 'claudio.cable.pago',
      redes_sociales: 'facebook.com/claudio.martinez.promo',
      notas_seguridad: 'Empleado en comercio de electrónica. Buena reputación, responde rápido por WhatsApp al solicitar pagos semanales.',
      foto_dni_frente: true,
      foto_dni_dorso: true,
      servicio_certificado: true,
      fecha_alta: '2026-02-15',
      riesgo_rating: 'Bajo'
    },
    {
      id: '3',
      nombre: 'IPTV Rosario Premium (Confiable)',
      ventas_totales: 145,
      tope_creditos: 100,
      creditos_actuales: 42,
      periodo_restock: 'semanal',
      auto_restock_aprobado: true,
      fase_confianza: 2,
      solicitudes_pendientes: 0,
      reestokes_realizados: 12,
      // EXPEDIENTE KYC - CONTROL DE RIESGO
      dni_cuil: '27-29004512-3',
      celular: '+54 9 341 680-1100',
      direccion: 'España 450, Piso 3A, Rosario, Santa Fe',
      cbu_alias: 'rosario.premium.alias',
      redes_sociales: 'instagram.com/rosariotvplus',
      notas_seguridad: 'Posee local de servicio técnico con dirección física pública. Excelente deudor, rinde cuentas los fines de semana puntualmente.',
      foto_dni_frente: true,
      foto_dni_dorso: true,
      servicio_certificado: true,
      fecha_alta: '2025-11-01',
      riesgo_rating: 'Mínimo'
    }
  ]);
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('1');
  const [activeSellerSubTab, setActiveSellerSubTab] = useState<'credito' | 'kyc'>('credito');
  const [showAddSellerKycModal, setShowAddSellerKycModal] = useState<boolean>(false);
  const [isEditingKyc, setIsEditingKyc] = useState<boolean>(false);
  
  // Formulario para registrar un nuevo vendedor con KYC completo
  const [newSellerKycForm, setNewSellerKycForm] = useState<any>({
    nombre: '',
    fase_confianza: 1,
    tope_creditos: 15,
    periodo_restock: 'diario',
    auto_restock_aprobado: false,
    dni_cuil: '',
    celular: '',
    direccion: '',
    cbu_alias: '',
    redes_sociales: '',
    notas_seguridad: '',
    foto_dni_frente: true,
    foto_dni_dorso: true,
    servicio_certificado: false,
    riesgo_rating: 'Bajo'
  });

  const [virtualSellerLogs, setVirtualSellerLogs] = useState<string[]>([
    '🟢 Módulo de confianza y control antifraude en marcha.',
    '📋 Fase de iniciados (Fase 1): Los vendedores solicitan activación; el administrador valida el ingreso real del pago.',
    '⚡ Fase de autónomos (Fase 2): Emisión instantánea descontando créditos con límites de seguridad periódicos pre-aprobados.'
  ]);

  // --- ESTADOS LOCALES DE CONEXIÓN Y CREACIÓN DE DEMOS EN VIVO XUI.ONE ---
  const [xuiConfig, setXuiConfig] = useState<any>({
    xui_url: '',
    xui_token: '',
    xui_access_code: '',
    xui_package_id: '1'
  });
  const [xuiLoading, setXuiLoading] = useState(false);
  const [xuiDemoUser, setXuiDemoUser] = useState('');
  const [xuiDemoPass, setXuiDemoPass] = useState('');
  const [xuiSelectedPkg, setXuiSelectedPkg] = useState('1');
  const [xuiResult, setXuiResult] = useState<any>(null);
  
  // --- ESTADOS LOCALES DE MENSAJERÍA, QUEJAS Y VENDEDORES (IDEA VISUAL Y TEXTUAL COMPLETA) ---
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'msg-1',
      username: 'usuario_demo1',
      tipo: 'Falla de Canal',
      mensaje: 'El canal Telefe HD se tildea constantemente a la noche. ¿Se puede solucionar?',
      fecha: '2026-06-07T14:32:00Z',
      estado: 'Pendiente',
      derivado_a: null
    },
    {
      id: 'msg-2',
      username: 'client_premium',
      tipo: 'Pago',
      mensaje: 'Ya realicé la transferencia para renovar el combo de 3 pantallas, ¿me habilitan?',
      fecha: '2026-06-08T00:15:00Z',
      estado: 'En Proceso',
      derivado_a: 'Vendedor Lucas'
    },
    {
      id: 'msg-3',
      username: 'hogar_vacio',
      tipo: 'Soporte de Cuenta',
      mensaje: 'Me olvidé el PIN que le puse a mi perfil de los niños. ¿Lo pueden resetear?',
      fecha: '2026-06-06T10:00:00Z',
      estado: 'Resuelto',
      derivado_a: null
    }
  ]);

  const [vendedoresSoporte, setVendedoresSoporte] = useState<any[]>([
    {
      id: 'vend-1',
      nombre: 'Vendedor Lucas',
      tokens_disponibles: 12,
      demos_creadas: 45,
      ganancias_totales: 34000,
      forma_pago_permitida: 'Efectivo Autorizado',
      cuit_o_cbu: 'CBU: 0170023400000012345678 - Lucas Iptv'
    },
    {
      id: 'vend-2',
      nombre: 'Ventas Sur Distribución',
      tokens_disponibles: 5,
      demos_creadas: 18,
      ganancias_totales: 15000,
      forma_pago_permitida: 'Solo Transferencia Directa',
      cuit_o_cbu: 'CBU: 0070089200000019283746 - Pago Resell'
    }
  ]);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>('msg-1');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [mensajesFilter, setMensajesFilter] = useState('todos');

  // --- SUB SISTEMA DE PLANTILLAS Y RESPUESTAS RÁPIDAS (OPCIÓN C) ---
  const [mensajesSubTab, setMensajesSubTab] = useState<'buzon' | 'plantillas'>('buzon');
  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>(DEFAULT_QUICK_REPLIES);
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'custom' as 'demo' | 'activation' | 'reminder' | 'custom',
    text: ''
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Client Message Modal (for Option C)
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageClient, setMessageClient] = useState<IptvAccount | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customizedMessageText, setCustomizedMessageText] = useState('');

  // Formulario del simulador de cliente
  const [clientSimUser, setClientSimUser] = useState('usuario_invitado');
  const [clientSimTipo, setClientSimTipo] = useState('Falla de Canal');
  const [clientSimMsg, setClientSimMsg] = useState('');

  // Formulario nuevo vendedor
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPayment, setNewSellerPayment] = useState<'Efectivo Autorizado' | 'Solo Transferencia Directa'>('Solo Transferencia Directa');
  const [newSellerCbu, setNewSellerCbu] = useState('');
  const [newSellerTokens, setNewSellerTokens] = useState<number | string>('');

  // Vendedor seleccionado para ver su simulador de app limitada
  const [selectedSellerId, setSelectedSellerId] = useState<string>('vend-1');

  // Datos Generales
  const [accounts, setAccounts] = useState<IptvAccount[]>(() => {
    try {
      const stored = localStorage.getItem('g3d_iptv_cuentas');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: any) => {
            const name = (a.nombre_completo || '').toLowerCase();
            const user = (a.username || '').toLowerCase();
            return !name.includes('[test') && !name.includes('test-admin') && !user.startsWith('vip184668') && !user.startsWith('vip563093') && !user.startsWith('testadmin');
          });
        }
      }
    } catch {}
    return [];
  });
  
  // LIVE API CREDITS & USER INTEGRITY COUNT
  const [apiCredits, setApiCredits] = useState<number | null>(() => {
    const stored = localStorage.getItem('xui_api_credits');
    return stored ? Number(stored) : null;
  });

  const [xuiErrorMsg, setXuiErrorMsg] = useState<string | null>(null);
  const [isXuiConnected, setIsXuiConnected] = useState<boolean>(() => {
    return localStorage.getItem('xui_is_connected') === 'true';
  });

  const [xuiApiUsersCount, setXuiApiUsersCount] = useState<number>(() => {
    const stored = localStorage.getItem('xui_api_users_count');
    return stored ? Number(stored) : 17;
  });

  const [profiles, setProfiles] = useState<any[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('g3d_iptv_cuentas');
      if (stored && JSON.parse(stored).length > 0) return false;
    } catch {}
    return false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Control de columnas visibles en la tabla de clientes
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('xui_col_visible');
    return stored ? JSON.parse(stored) : {
      username: true,
      password: true,
      fullName: true,
      phone: true,
      profiles: true,
      syncStatus: true,
      dns: false,
      planProv: true,
      planVenta: true,
      pantallas: true,
      vencimiento: true,
      estado: true,
      costArs: true,
      priceArs: true,
      profitArs: true,
      margin: false,
      comentarios: false,
      fechaCreacion: false,
      acciones: true
    };
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('xui_col_order');
    return stored ? JSON.parse(stored) : [
      'username',
      'password',
      'fullName',
      'phone',
      'profiles',
      'syncStatus',
      'dns',
      'planProv',
      'planVenta',
      'pantallas',
      'vencimiento',
      'estado',
      'costArs',
      'priceArs',
      'profitArs',
      'margin',
      'comentarios',
      'fechaCreacion',
      'acciones'
    ];
  });
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Detalle del cliente seleccionado para el Modal/Fila Lateral
  const [selectedClient, setSelectedClient] = useState<IptvAccount | null>(null);

  // Origen de datos (Local vs API de revendedor en vivo)
  const [viewSource, setViewSource] = useState<'local' | 'api'>('local');
  const [apiAccounts, setApiAccounts] = useState<IptvAccount[]>([]);
  const [isFetchingApiAccounts, setIsFetchingApiAccounts] = useState(false);

  // Configuración de Finanzas recopilada de apiService
  const [finances, setFinances] = useState<any>({
    currency: 'ARS',
    partners: [],
    provider_plans: [],
    sale_plans: []
  });

  const [partners, setPartners] = useState<any[]>([]);
  const [providerPlans, setProviderPlans] = useState<ProviderPlan[]>([]);
  const [salePlans, setSalePlans] = useState<SalePlan[]>([]);

  // Refs para prevenir cierres obsoletos (stale closures) en llamadas asíncronas como syncXuiPackages
  const financesRef = useRef<any>(finances);
  const providerPlansRef = useRef<ProviderPlan[]>(providerPlans);
  const salePlansRef = useRef<SalePlan[]>(salePlans);
  const partnersRef = useRef<any[]>(partners);

  useEffect(() => {
    financesRef.current = finances;
  }, [finances]);

  useEffect(() => {
    providerPlansRef.current = providerPlans;
  }, [providerPlans]);

  useEffect(() => {
    salePlansRef.current = salePlans;
  }, [salePlans]);

  useEffect(() => {
    partnersRef.current = partners;
  }, [partners]);
  const [providerCosts, setProviderCosts] = useState<IptvCostoProveedor[]>([]);
  const [editingProviderCostId, setEditingProviderCostId] = useState<string | null>(null);
  const [providerCostForm, setProviderCostForm] = useState<{
    proveedor: string;
    plan: string;
    precio: string | number;
    creditos: string | number;
    link: string;
  }>({
    proveedor: '',
    plan: '',
    precio: '',
    creditos: '',
    link: ''
  });

  // Estados del formulario para agregar/editar Planes
  const [editingPlanType, setEditingPlanType] = useState<'provider' | 'sale' | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<{
    name: string;
    months: string | number;
    hours: string | number;
    screens: string | number;
    tokens: string | number;
    value: string | number;
    provider_name: string;
    token_price: string | number;
    provider_plan_id: string;
    provider_cost_id: string;
    screens_api: string | number;
    comision: string | number;
    comision_vendedor: string | number;
    comision_referente: string | number;
    categoria_nombre?: string;
    categoria_id?: 'demo' | 'vip' | 'xxx';
    visible?: boolean;
    max_connections?: number;
    multiple_connections?: number;
    multiconx_pricing?: string;
  }>({
    name: '',
    months: '',
    hours: '',
    screens: '',
    tokens: '',
    value: '', // Será cost para provider o price para sale
    provider_name: '', // nombre del proveedor
    token_price: '', // precio por token
    provider_plan_id: '', // ID del modulo mayorista enlazado (para sale)
    provider_cost_id: '', // ID del costo de proveedor enlazado en la base de datos (para provider)
    screens_api: '',
    comision: '',
    comision_vendedor: '',
    comision_referente: '',
    categoria_nombre: '',
    categoria_id: 'vip',
    visible: true
  });

  // --- PARÁMETROS FINANCIEROS Y DE INVERSIÓN TRADUCIDOS ---
  const [dollarRate, setDollarRate] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_active_dollar_rate');
    return saved ? Number(saved) : 1000;
  }); // tipo de cambio ARS/USD
  const [tokenPackageUsd, setTokenPackageUsd] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_active_token_package_usd');
    return saved ? Number(saved) : 90;
  }); // costo paquete USD
  const [creditsPerPack, setCreditsPerPack] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_active_credits_per_pack');
    return saved ? Number(saved) : 70;
  }); // credits that tokenPackageUsd grants
  const [availableCredits, setAvailableCredits] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_active_available_credits');
    return saved ? Number(saved) : 350;
  }); // total credits available
  const [providerName, setProviderName] = useState<string>(() => {
    return localStorage.getItem('g3d_iptv_active_provider_name') || 'Lucas Mayorista';
  }); // nombre del proveedor
  const [fetchingDollar, setFetchingDollar] = useState<boolean>(false); // cargando precio dolar

  // Variables Maestras de Costo y Comisiones por Crédito (Automatización de Precios)
  const [costoCredito, setCostoCredito] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_costo_credito');
    return saved ? Number(saved) : 1000;
  }); // Costo unitario que pagas por 1 crédito (en ARS)
  const [comisionAdministrador, setComisionAdministrador] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_comision_administrador');
    return saved ? Number(saved) : 1500;
  }); // Tu ganancia neta fija por 1 crédito (en ARS)
  const [comisionVendedorGlobal, setComisionVendedorGlobal] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_comision_vendedor_global');
    return saved ? Number(saved) : 800;
  }); // Comisión para el vendedor por 1 crédito (en ARS)
  const [comisionReferenteGlobal, setComisionReferenteGlobal] = useState<number>(() => {
    const saved = localStorage.getItem('g3d_iptv_comision_referente_global');
    return saved ? Number(saved) : 200;
  }); // Comisión para el referente/patrocinador por 1 crédito (en ARS)

  const getPlanCostInArs = (tokensCount: number | string, providerCostId?: string) => {
    const tokensCountNum = Number(tokensCount) || 0;
    if (!tokensCountNum || tokensCountNum === 0) return 0;
    let costPerCreditInUsd = 0;
    if (providerCostId) {
      const matchedCost = providerCosts.find(c => c.id === providerCostId);
      if (matchedCost && matchedCost.creditos > 0) {
        costPerCreditInUsd = matchedCost.precio / matchedCost.creditos;
      } else {
        costPerCreditInUsd = creditsPerPack > 0 ? (tokenPackageUsd / creditsPerPack) : 0;
      }
    } else {
      costPerCreditInUsd = creditsPerPack > 0 ? (tokenPackageUsd / creditsPerPack) : 0;
    }
    const costPerCreditInArs = costPerCreditInUsd * dollarRate;
    return Math.round(tokensCountNum * costPerCreditInArs);
  };

  const [paymentDiscount, setPaymentDiscount] = useState<number>(50); // % descuento Binance
  const [additionalTaxPercent, setAdditionalTaxPercent] = useState<number>(21); // impuestos % (IVA / recargos)
  const [appMaintenanceCost, setAppMaintenanceCost] = useState<number>(15000); // mantenimiento mensual
  const [streetTechCost, setStreetTechCost] = useState<number>(8000); // costo tecnico calle

  // Estados para nuevo socio y control de adelantos
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerPercent, setNewPartnerPercent] = useState<number | string>('');
  const [newPartnerRole, setNewPartnerRole] = useState('');
  // Para registrar adelantos en UI rápido
  const [selectedPartnerIndexForAdvance, setSelectedPartnerIndexForAdvance] = useState<number | null>(null);
  const [partnerAdvanceAmountInput, setPartnerAdvanceAmountInput] = useState<string>('');

  // Branding e Imágenes
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandPromoSpotUrl, setBrandPromoSpotUrl] = useState('');
  
  // Ajuste de visualización de imagen (Crop/Zoom/Coordinates)
  const [imgSettings, setImgSettings] = useState<Record<string, { zoom: number; x: number; y: number }>>({
    logo: { zoom: 1, x: 0, y: 0 },
    spot: { zoom: 1, x: 0, y: 0 }
  });
  const [activeAdjustingType, setActiveAdjustingType] = useState<'logo' | 'spot' | null>(null);

  // Estados de DRAGGING INTERACTIVO sobre el Canvas Previsualizador
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [interactiveEditType, setInteractiveEditType] = useState<'logo' | 'spot'>('logo'); // Activo para editar en la previsualizacion interactiva
  
  // Estados para simulación de IA y .ICO
  const [isRemovingBgLogo, setIsRemovingBgLogo] = useState(false);
  const [isRemovingBgSpot, setIsRemovingBgSpot] = useState(false);
  const [hasRemovedBgLogo, setHasRemovedBgLogo] = useState(false);
  const [hasRemovedBgSpot, setHasRemovedBgSpot] = useState(false);
  const [isConvertingLogo, setIsConvertingLogo] = useState(false);

  // Banners rotativos de publicidad
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [newBannerName, setNewBannerName] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');

  // Estado del simulador de smartphone de cliente
  const [mockupScreen, setMockupScreen] = useState<'login' | 'completar_registro' | 'crear_perfil' | 'dashboard'>('login');
  const [simActiveUser, setSimActiveUser] = useState<string>('juan.iptv');
  // Formulario simular registro primer ingreso
  const [simFullName, setSimFullName] = useState<string>('');
  const [simPhoneCode, setSimPhoneCode] = useState<string>('+54');
  const [simPhoneDigits, setSimPhoneDigits] = useState<string>('');
  const [simAddress, setSimAddress] = useState<string>('');
  const [simSelectedProfile, setSimSelectedProfile] = useState<string>('');

  const [coldStart, setColdStart] = useState(false);
  const [showRotativeBanner, setShowRotativeBanner] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);

  // Guardado de cuentas
  const [isSavingIptv, setIsSavingIptv] = useState(false);
  const [viewingCredentialsAccount, setViewingCredentialsAccount] = useState<IptvAccount | null>(null);
  const [viewingCredentialsText, setViewingCredentialsText] = useState('');
  const [demoCreatedResult, setDemoCreatedResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMissingFields, setValidationMissingFields] = useState<string[]>([]);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    itemCount?: number;
    actionType: 'purge_test' | 'cleanup_demos' | 'cleanup_expired' | 'delete_single';
    targetUsername?: string;
  } | null>(null);
  const [isDeletingProcess, setIsDeletingProcess] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    url_panel_asignada: 'http://vip-xtv.pro:8080',
    estado: 'Activo',
    limite_pantallas: 2,
    limite_pantallas_api: 3,
    fecha_vencimiento: '',
    comentarios: '',
    id_plan_proveedor: '',
    id_plan_venta: '',
    sociedad_id: 'soc-central',
    nombre_completo: '',
    nombre: '',
    apellido: '',
    direccion_actual: '',
    celular: '',
    is_demo: true,
    demo_package: 'pkg-1h' as 'pkg-1h' | 'pkg-3h' | 'pkg-6h' | 'pkg-4h-3p',
    bitacora_comentarios: [] as any[]
  });

  const getSelectedProviderPlan = (): ProviderPlan | null => {
    if (accountForm.is_demo) {
      const targetPlan = salePlans.find(p => p.id === accountForm.id_plan_venta);
      if (targetPlan && targetPlan.provider_plan_id) {
        const found = providerPlans.find(p => p.id === targetPlan.provider_plan_id);
        if (found) return found;
      }
      const demoPkgId = accountForm.demo_package || "pkg-1h";
      const mappedDemoId = demoPkgId === "pkg-1h" ? "1" : demoPkgId === "pkg-3h" ? "2" : demoPkgId === "pkg-6h" ? "28" : demoPkgId === "pkg-4h-3p" ? "77" : demoPkgId;
      return providerPlans.find(p => p.id === mappedDemoId) || null;
    } else {
      const targetPlan = salePlans.find(p => p.id === accountForm.id_plan_venta);
      if (targetPlan && targetPlan.provider_plan_id) {
        const found = providerPlans.find(p => p.id === targetPlan.provider_plan_id);
        if (found) return found;
      }
      if (accountForm.id_plan_proveedor) {
        return providerPlans.find(p => p.id === accountForm.id_plan_proveedor) || null;
      }
    }
    return null;
  };

  const getSelectedPlanConnectionsLimits = (plan: ProviderPlan | null) => {
    if (!plan) {
      return { min: 1, max: 5, options: [1, 2, 3, 4, 5], isDefault: true };
    }
    
    // Convertir conexiones base y máximas asegurando que sean números
    const minConns = Number(plan.max_connections != null ? plan.max_connections : (plan.screens || 1));
    let maxConns = Number(plan.multiple_connections != null ? plan.multiple_connections : minConns);
    
    // Si es un plan comercial real (no demo/trial) y su maxConns es menor a 5, forzamos un límite de 5 conexiones
    const isTrialPkg = plan.is_trial === 1 || String(plan.id) === "1" || String(plan.id) === "2" || String(plan.id) === "28" || String(plan.id) === "77";
    if (!isTrialPkg && maxConns < 5) {
      maxConns = 5;
    }
    
    let options: number[] = [];
    
    // 1. Intentar parsear el listado de pricing de multiconexión de la API si existe
    let pricingOptions: any[] = [];
    try {
      if (plan.multiconx_pricing) {
        pricingOptions = typeof plan.multiconx_pricing === 'string'
          ? JSON.parse(plan.multiconx_pricing)
          : plan.multiconx_pricing;
      }
    } catch (e) {
      console.warn("Error parsing multiconx_pricing:", e);
    }
    
    if (Array.isArray(pricingOptions) && pricingOptions.length > 0) {
      // Agregar la conexión base
      options.push(minConns);
      pricingOptions.forEach((opt: any) => {
        const connNum = Number(opt.connections);
        if (!isNaN(connNum) && !options.includes(connNum)) {
          options.push(connNum);
        }
      });
    } else {
      // Si no hay listado de precios específico pero multiple_connections es mayor a minConns, 
      // generamos el rango dinámico de 1 en 1 desde minConns hasta maxConns
      for (let i = minConns; i <= maxConns; i++) {
        options.push(i);
      }
    }
    
    // Asegurar que el screens configurado esté presente
    if (plan.screens && !options.includes(Number(plan.screens))) {
      options.push(Number(plan.screens));
    }
    
    // Si es comercial, garantizamos que incluya el listado completo de 1 a maxConns
    if (!isTrialPkg) {
      for (let i = 1; i <= maxConns; i++) {
        if (!options.includes(i)) {
          options.push(i);
        }
      }
    }
    
    // Eliminar posibles duplicados y ordenar numéricamente
    options = Array.from(new Set(options)).sort((a, b) => a - b);

    // Filtrar de forma estricta para asegurar que NINGUNA opción supere el límite actual real de la API
    options = options.filter(num => num <= maxConns);
    
    const finalMax = Math.max(...options, maxConns);
    
    return {
      min: minConns,
      max: finalMax,
      options: options.length > 0 ? options : [minConns],
      isDefault: false
    };
  };

  const calculateApiCreditCost = (plan: ProviderPlan | null, connections: number) => {
    if (!plan) return 1;
    if (plan.is_trial === 1 || plan.months === 0) {
      return 0; // Demos/Demos API consumen 0 créditos
    }

    const months = Number(plan.months) || 1;
    const baseConns = Number(plan.max_connections != null ? plan.max_connections : (plan.screens || 1));
    
    // Si la cantidad solicitada es menor o igual a la base, consume los créditos del plan base
    if (connections <= baseConns) {
      return plan.tokens;
    }

    // Tabla de correspondencia exacta y real para paquetes comerciales estándar de la API de IPTV
    if (months === 1) {
      if (connections === 1) return 1;
      if (connections === 2) return 1;
      if (connections === 3) return 1;
      if (connections === 4) return 1.5;
      if (connections >= 5) return 2;
    }
    if (months === 2) {
      if (connections <= 3) return 1;
      if (connections === 4) return 1.5;
      if (connections >= 5) return 2;
    }
    if (months === 3) {
      if (connections === 1) return 2;
      if (connections === 2) return 2;
      if (connections === 3) return 2;
      if (connections === 4) return 2.5;
      if (connections >= 5) return 3;
    }
    if (months === 4) {
      if (connections <= 3) return 3;
      if (connections === 4) return 3.5;
      if (connections >= 5) return 4;
    }
    if (months === 6) {
      if (connections === 1) return 4;
      if (connections === 2) return 4.5;
      if (connections === 3) return 5;
      if (connections === 4) return 5.5;
      if (connections >= 5) return 6;
    }
    if (months === 8) {
      if (connections <= 3) return 6;
      if (connections === 4) return 6.5;
      if (connections >= 5) return 7;
    }
    if (months === 12) {
      if (connections === 1) return 8;
      if (connections === 2) return 8.5;
      if (connections === 3) return 9;
      if (connections === 4) return 9.5;
      if (connections >= 5) return 10;
    }
    if (months === 15) {
      if (connections <= 3) return 10;
      if (connections === 4) return 11;
      if (connections >= 5) return 12;
    }
    if (months === 24) {
      if (connections === 1) return 18;
      if (connections === 2) return 19;
      if (connections === 3) return 20;
      if (connections === 4) return 21;
      if (connections >= 5) return 22;
    }
    if (months === 30) {
      if (connections <= 3) return 20;
      if (connections === 4) return 21;
      if (connections >= 5) return 22;
    }

    // FALLBACK GENÉRICO REALISTA si no está en la tabla (ej. planes personalizados o combos extraños)
    let pricingOptions: any[] = [];
    try {
      if (plan.multiconx_pricing) {
        pricingOptions = typeof plan.multiconx_pricing === 'string' 
          ? JSON.parse(plan.multiconx_pricing) 
          : plan.multiconx_pricing;
      }
    } catch(e) {}
    
    if (Array.isArray(pricingOptions) && pricingOptions.length > 0) {
      const matched = pricingOptions.find((opt: any) => Number(opt.connections) === connections);
      if (matched) {
        // En XUI, el precio de multiconexión es el costo mensual.
        // Multiplicamos por la duración del plan (meses) y garantizamos que no sea menor que los tokens del plan base.
        const factorCost = Number(matched.price) * months;
        return Math.max(plan.tokens, factorCost);
      }
    }

    // Proporcional de último recurso
    const tokenPricePerConn = plan.tokens / baseConns;
    return Math.ceil(tokenPricePerConn * connections);
  };

  /**
   * Helper que determina la cantidad MÁXIMA de conexiones/pantallas físicas
   * que se le pueden solicitar al panel XC sin que incremente el consumo de créditos.
   */
  const calculateOptimalApiScreens = (salePlan: SalePlan | null | undefined, defaultScreens = 1): number => {
    if (!salePlan) return defaultScreens;
    const tokensAllowed = Number(salePlan.tokens) || 1;
    const provPlan = salePlan.provider_plan_id ? providerPlans.find(p => String(p.id) === String(salePlan.provider_plan_id)) : null;

    let optimal = Number(salePlan.screens_api || salePlan.screens || defaultScreens);

    if (provPlan) {
      const limits = getSelectedPlanConnectionsLimits(provPlan);
      for (const opt of limits.options) {
        if (calculateApiCreditCost(provPlan, opt) <= tokensAllowed) {
          optimal = Math.max(optimal, opt);
        }
      }
    } else {
      // Si es un plan mensual estándar sin vinculación estricta, 1 crédito permite típicamente hasta 3 pantallas
      if (tokensAllowed === 1 && (salePlan.months || 1) === 1) {
        optimal = Math.max(optimal, 3);
      }
    }
    return Math.max(optimal, 1);
  };

  const [newNoteText, setNewNoteText] = useState('');
  const [editableResultText, setEditableResultText] = useState('');

  useEffect(() => {
    if (demoCreatedResult) {
      const clientName = (demoCreatedResult.nombre_completo || 'Cliente').trim();
      const phone = demoCreatedResult.celular || 'No provisto';
      const address = demoCreatedResult.direccion_actual || 'No provista';
      const expDate = demoCreatedResult.expiration ? new Date(demoCreatedResult.expiration).toLocaleDateString('es-AR') : 'No expira';
      
      const serverHost = demoCreatedResult.host ? (demoCreatedResult.host.startsWith('http') ? demoCreatedResult.host : `http://${demoCreatedResult.host}`) : '';
      const serverPort = demoCreatedResult.port ? `:${demoCreatedResult.port}` : '';
      const fullHost = serverHost + serverPort;

      const txt = `📺 *ACCESO DE TV DIGITAL ACTIVADO* 📺

*INFORMACIÓN DE CLIENTE:*
👤 Cliente: *${clientName}*
📞 Contacto: *${phone}*
📍 Dirección: *${address}*

*CREDENCIALES DE ACCESO:*
🌐 Servidor / URL: *${fullHost}*
🔑 Usuario: *${demoCreatedResult.username}*
🔒 Contraseña: *${demoCreatedResult.password}*
⏰ Vencimiento: *${expDate}*

*LISTA M3U COMPLETA:*
🔗 Link: ${demoCreatedResult.m3u_url}

_¡Gracias por confiar en nosotros! Disfrutá de la mejor televisión digital._`;

      setEditableResultText(txt);
    } else {
      setEditableResultText('');
    }
  }, [demoCreatedResult]);

  const getUsernameSuggestions = (fullName: string): string[] => {
    if (!fullName || !fullName.trim()) return [];
    const clean = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, '')
      .trim();

    if (!clean) return [];
    const parts = clean.split(/\s+/).map(p => p.replace(/[^a-z0-9]/g, ''));

    const suggestions: string[] = [];

    if (parts.length >= 2) {
      suggestions.push(`${parts[0]}${parts[1]}`);
    } else if (parts[0]) {
      suggestions.push(`${parts[0]}`);
    }

    if (parts.length >= 2 && parts[0] && parts[1]) {
      suggestions.push(`${parts[0][0]}${parts[1]}`);
    }

    if (parts[0]) {
      const r = Math.floor(10 + Math.random() * 90);
      if (parts.length >= 2) {
        suggestions.push(`${parts[0]}${parts[1]}${r}`);
      } else {
        suggestions.push(`${parts[0]}${r}`);
      }
    }

    const finalized = suggestions.map(s => {
      let val = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      while (val.length < 8) {
        val += Math.floor(Math.random() * 10).toString();
      }
      return val;
    });

    return Array.from(new Set(finalized));
  };

  const handleGetGPSLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Obteniendo coordenadas GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          const { latitude, longitude } = position.coords;
          const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setAccountForm(prev => ({
            ...prev,
            direccion_actual: url
          }));
          toast.success("Coordenadas GPS obtenidas y formateadas en Google Maps");
        },
        (error) => {
          toast.dismiss();
          toast.error("No se pudo obtener la geolocalización automáticamente.");
        }
      );
    } else {
      toast.error("Geolocalización no soportada");
    }
  };

  const handleAddNoteToForm = () => {
    if (!newNoteText.trim()) return;
    const newNoteItem = {
      text: newNoteText.trim(),
      date: new Date().toISOString(),
      es_problematico: false
    };
    setAccountForm(prev => ({
      ...prev,
      bitacora_comentarios: [newNoteItem, ...(prev.bitacora_comentarios || [])]
    }));
    setNewNoteText('');
    toast.success('Nota agregada al borrador');
  };

  const handleRemoveNoteFromForm = (index: number) => {
    setAccountForm(prev => ({
      ...prev,
      bitacora_comentarios: (prev.bitacora_comentarios || []).filter((_, i) => i !== index)
    }));
    toast.info('Nota removida civilizadamente del borrador');
  };

  // --- ESTADOS DE CREACIÓN DE REGLAS DE DEMOS NUEVAS Y REESTRUCTURACIÓN DE CUENTAS ---
  const [showClientCreatorTypeSelector, setShowClientCreatorTypeSelector] = useState(false);
  const [showDemoAccountModal, setShowDemoAccountModal] = useState(false);
  const [demoStep, setDemoStep] = useState<1 | 2 | 3>(1);
  const [demoCustomUsernamePrefix, setDemoCustomUsernamePrefix] = useState('');
  const [demoPackage, setDemoPackage] = useState<'pkg-1h' | 'pkg-3h' | 'pkg-6h' | 'pkg-4h-3p'>('pkg-1h');
  const [demoContactEmail, setDemoContactEmail] = useState('');
  const [demoResellerNotes, setDemoResellerNotes] = useState('');
  
  const AVAILABLE_CHANNELS = [
    'Deportes Premium AR/Latam (Fútbol, F1, ESPN, Fox)',
    'Cine & Series Premium (HBO, Star+, Paramount, Universal)',
    'Infantiles Multiplex (Disney, Cartoon Network, Nickelodeon)',
    'Noticias 24h Nacionales e Internacionales',
    'Documentales & Cultura (Discovery, History, NatGeo)',
    'Canales de Aire HD Argentina & Locales'
  ];
  
  const AVAILABLE_MOVIES = [
    'Estrenos Recientes 2025/2026 (Max Calidad)',
    'Acción & Suspenso Sin Límites',
    'Ciencia Ficción, Fantasía & Héroes',
    'Comedias Familiares & Animación',
    'Terror, Misterio & Suspenso Nocturno'
  ];
  
  const AVAILABLE_SERIES = [
    'Series de Estreno en Streaming',
    'Series Retro Completas del Recuerdo',
    'Anime, Animación Japonesa & Cómics',
    'Miniseries Documentales & Shows de TV'
  ];

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

  const getDemoExpirationDate = () => {
    let hours = 1;
    const matchedPlan = providerPlans.find(p => p.id === demoPackage);
    if (matchedPlan) {
      let durationHours = 24;
      const nameLower = matchedPlan.name.toLowerCase();
      if (nameLower.includes("3h") || nameLower.includes("3 hora") || nameLower.includes("3 hours")) durationHours = 3;
      else if (nameLower.includes("6h") || nameLower.includes("6 hora") || nameLower.includes("6 hours")) durationHours = 6;
      else if (nameLower.includes("1h") || nameLower.includes("1 hora") || nameLower.includes("1 hours")) durationHours = 1;
      else if (nameLower.includes("4h") || nameLower.includes("4 hora") || nameLower.includes("4 hours")) durationHours = 4;
      else if (nameLower.includes("2h") || nameLower.includes("2 hora") || nameLower.includes("2 hours")) durationHours = 2;
      else if (nameLower.includes("12h") || nameLower.includes("12 hora") || nameLower.includes("12 hours")) durationHours = 12;
      hours = durationHours;
    } else {
      hours = {
        'pkg-1h': 1,
        'pkg-3h': 3,
        'pkg-6h': 6,
        'pkg-4h-3p': 4
      }[demoPackage] || 1;
    }
    const date = new Date(Date.now() + hours * 60 * 60 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  // --- DETECTOR DÓLAR Y AJUSTES FINANCIEROS MANUALES ---
  const [pkgAdjustmentType, setPkgAdjustmentType] = useState<'discount' | 'bonus_tokens'>('discount');
  const [pkgTaxIncluded, setPkgTaxIncluded] = useState<boolean>(false);
  
  // Gastos Extra Operativos dinámicos (reemplazan hosteo y soporte fijo)
  const [customExpenses, setCustomExpenses] = useState<{ id: string; name: string; amount: number }[]>(() => {
    try {
      const stored = localStorage.getItem('iptv_custom_expenses_v2');
      return stored ? JSON.parse(stored) : [
        { id: 'exp-1', name: 'Hosteo Servidor Cloud Run', amount: 8000 },
        { id: 'exp-2', name: 'Soporte Técnico de calle', amount: 300000 }
      ];
    } catch {
      return [
        { id: 'exp-1', name: 'Hosteo Servidor Cloud Run', amount: 8000 },
        { id: 'exp-2', name: 'Soporte Técnico de calle', amount: 300000 }
      ];
    }
  });

  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // --- MULTI-SOCIEDADES / CANALES DE CO-INVERSIÓN ---
  const [societies, setSocieties] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('iptv_societies_v2');
      return stored ? JSON.parse(stored) : [
        { 
          id: 'soc-central', 
          name: 'Venta Directa de XTV', 
          code: 'CENTRAL-QR', 
          commission_platform_percent: 30, 
          partners: [
            { name: 'Socio Administrador', percent: 50, role: 'Socio Operativo', advances: 0 },
            { name: 'Socio Inversionista (Mayorista)', percent: 50, role: 'Socio Inversor', advances: 0 }
          ]
        },
        { 
          id: 'soc-fibra', 
          name: 'Sociedad FibraNet (Proveedor ISP)', 
          code: 'FIBRANET-QR', 
          commission_platform_percent: 40, // 40% se queda la plataforma XTV
          partners: [
            { name: 'ISP FibraNet CEO', percent: 50, role: 'Socio Revendedor', advances: 0 },
            { name: 'Administrador Canal', percent: 50, role: 'Administrador Redes', advances: 0 }
          ]
        }
      ];
    } catch {
      return [
        { 
          id: 'soc-central', 
          name: 'Venta Directa de XTV', 
          code: 'CENTRAL-QR', 
          commission_platform_percent: 30, 
          partners: [
            { name: 'Socio Administrador', percent: 50, role: 'Socio Operativo', advances: 0 },
            { name: 'Socio Inversionista (Mayorista)', percent: 50, role: 'Socio Inversor', advances: 0 }
          ]
        }
      ];
    }
  });

  const [newSocName, setNewSocName] = useState('');
  const [newSocCode, setNewSocCode] = useState('');
  const [newSocPlatPercent, setNewSocPlatPercent] = useState<number>(30);
  const [activeSocietyView, setActiveSocietyView] = useState<string | null>(null); //ID de la sociedad para previsualizar/emular su propia app de socio aislada

  // --- BITÁCORAS DE CLIENTE INTERACTIVAS (CHAT SOPORTE Y ADVERTENCIAS) ---
  const [activeClientTab, setActiveClientTab] = useState<'info' | 'profiles' | 'soporte' | 'comentarios'>('info');
  const [newChatMsg, setNewChatMsg] = useState('');
  const [newChatSender, setNewChatSender] = useState<'operador' | 'cliente'>('operador');
  const [newComenBitacora, setNewComenBitacora] = useState('');
  const [newComenEsProblematico, setNewComenEsProblematico] = useState(false);

  // Mostrar u ocultar contraseñas en UI
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Subperfiles modal
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Rotador de banners activos
  useEffect(() => {
    if (banners.length > 0) {
      const activeBanners = banners.filter(b => b.active);
      if (activeBanners.length > 1) {
        const interval = setInterval(() => {
          setRotationIndex(prev => (prev + 1) % activeBanners.length);
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [banners]);

  useEffect(() => {
    if (activeTab === 'finanzas') {
      fetchDollarRate().catch(() => {});
    }
  }, [activeTab]);

  const syncLiveCredits = async (
    silent = true,
    customUrl?: string,
    customToken?: string,
    customAccessCode?: string
  ) => {
    const url = customUrl || xuiConfig.xui_url;
    const token = customToken || xuiConfig.xui_token;
    const accessCode = customAccessCode !== undefined ? customAccessCode : xuiConfig.xui_access_code;

    if (!url) {
      if (!silent) toast.error("La URL de tu panel no está configurada.");
      return null;
    }
    if (!silent) toast.loading("Consultando créditos actuales...");
    try {
      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: url,
          xuiToken: token,
          xuiAccessCode: accessCode
        })
      });

      const xuiData = await resXui.json();
      if (!silent) toast.dismiss();

      if (xuiData.success) {
        const rawResp = xuiData.data || xuiData.raw_response || {};
        const rawData = rawResp.data || rawResp || {};
        
        let creditsVal = null;
        const candidates = [
          rawData.credits,
          rawData.data?.credits,
          rawData.user_info?.credits,
          rawData.user_data?.credits,
          rawData.credit,
          rawData.balance,
          rawResp.data?.credits,
          rawResp.credits,
          rawResp.user_info?.credits,
          rawResp.user_data?.credits,
          rawResp.credit,
          rawResp.balance,
          xuiData.credits,
          xuiData.data?.data?.credits,
          xuiData.user_info?.credits,
          xuiData.user_data?.credits,
          xuiData.data?.credits,
          xuiData.data?.user_info?.credits,
          xuiData.data?.user_data?.credits,
          xuiData.raw_response?.credits,
          xuiData.raw_response?.user_info?.credits
        ];
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== "") {
            const num = Number(c);
            if (!isNaN(num)) {
              creditsVal = num;
              break;
            }
          }
        }

        if (creditsVal !== null) {
          setApiCredits(creditsVal);
          localStorage.setItem('xui_api_credits', String(creditsVal));
          setIsXuiConnected(true);
          localStorage.setItem('xui_is_connected', 'true');
          setXuiErrorMsg(null);
          if (!silent) toast.success(`¡Créditos actualizados! ${creditsVal} disponibles.`);
          return creditsVal;
        } else {
          setIsXuiConnected(true);
          localStorage.setItem('xui_is_connected', 'true');
          setXuiErrorMsg(null);
          return null;
        }
      } else {
        const errMsg = xuiData.error || "No se pudo recuperar información del panel.";
        setXuiErrorMsg(errMsg);
        setIsXuiConnected(false);
        localStorage.setItem('xui_is_connected', 'false');
        if (!silent) toast.error(`Error: ${errMsg}`);
      }
    } catch (err: any) {
      console.warn("Error consultando créditos en vivo:", err);
      setIsXuiConnected(false);
      localStorage.setItem('xui_is_connected', 'false');
      const errTxt = err.message || String(err);
      setXuiErrorMsg(errTxt);
      if (!silent) toast.error(`Error de red: ${errTxt}`);
    }
    return null;
  };

  const syncXuiPackages = async (
    silent = false,
    customUrl?: string,
    customToken?: string,
    customAccessCode?: string,
    customPackageId?: string
  ) => {
    const url = customUrl || xuiConfig.xui_url;
    const token = customToken || xuiConfig.xui_token;
    const accessCode = customAccessCode !== undefined ? customAccessCode : xuiConfig.xui_access_code;
    const packageId = customPackageId || xuiConfig.xui_package_id || "1";

    if (!url) {
      if (!silent) toast.error("La URL de tu panel IPTV no está configurada.");
      return null;
    }
    if (!silent) toast.loading("Sincronizando catálogo real con tu panel IPTV...");
    try {
      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: url,
          xuiToken: token,
          xuiAccessCode: accessCode
        })
      });

      const xuiData = await resXui.json();

      let list: any[] = [];
      let bList: any[] = [];

      if (xuiData.success) {
        // Extraer balances de créditos si vienen de manera real
        const rawResp = xuiData.data || xuiData.raw_response || {};
        const rawData = rawResp.data || rawResp || {};
        
        let creditsVal = null;
        const candidates = [
          rawData.credits,
          rawData.data?.credits,
          rawData.user_info?.credits,
          rawData.user_data?.credits,
          rawData.credit,
          rawData.balance,
          rawResp.data?.credits,
          rawResp.credits,
          rawResp.user_info?.credits,
          rawResp.user_data?.credits,
          rawResp.credit,
          rawResp.balance,
          xuiData.credits,
          xuiData.data?.data?.credits,
          xuiData.user_info?.credits,
          xuiData.user_data?.credits,
          xuiData.data?.credits,
          xuiData.data?.user_info?.credits,
          xuiData.data?.user_data?.credits,
          xuiData.raw_response?.credits,
          xuiData.raw_response?.user_info?.credits
        ];
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== "") {
            const num = Number(c);
            if (!isNaN(num)) {
              creditsVal = num;
              break;
            }
          }
        }

        if (creditsVal !== null) {
          setApiCredits(creditsVal);
          localStorage.setItem('xui_api_credits', String(creditsVal));
        }
        setIsXuiConnected(true);
        localStorage.setItem('xui_is_connected', 'true');
        setXuiErrorMsg(null);

        // Obtener bouquets asignados en la respuesta real (ej: "[2,21,22,1,3,...]")
        const bouquetStr = rawData.bouquet || rawResp.bouquet;
        let bouquetIds: string[] = [];
        if (bouquetStr) {
          try {
            if (typeof bouquetStr === "string") {
              const clean = bouquetStr.replace(/[\[\]]/g, '');
              bouquetIds = clean.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(bouquetStr)) {
              bouquetIds = bouquetStr.map(String);
            }
          } catch (e) {
            console.warn("Error parseando bouquetStr:", e);
          }
        }

        if (bouquetIds.length > 0) {
          bList = bouquetIds.map(id => ({
            id: id,
            bouquet_name: `Bouquet #${id}`
          }));
        }

        // Si el panel soporta paquetes y vinieron adjuntos en la respuesta
        if (Array.isArray(rawData.packages)) {
          list = rawData.packages;
        } else if (rawData.packages && typeof rawData.packages === "object") {
          list = Object.values(rawData.packages);
        } else if (Array.isArray(rawData.data?.packages)) {
          list = rawData.data.packages;
        } else if (Array.isArray(xuiData.packages)) {
          list = xuiData.packages;
        } else if (Array.isArray(xuiData.data?.packages)) {
          list = xuiData.data.packages;
        } else if (Array.isArray(rawResp.packages)) {
          list = rawResp.packages;
        }

        // Soporte extra para paneles XC Reseller que devuelven los planes en "override_packages" de user_info
        let overridePackagesObj: any = null;
        const ovRaw = rawData.override_packages || rawResp.override_packages || xuiData.override_packages || (xuiData.data && xuiData.data.override_packages);
        if (ovRaw) {
          if (typeof ovRaw === "string" && ovRaw.trim()) {
            try {
              overridePackagesObj = JSON.parse(ovRaw);
            } catch (e) {
              console.warn("Error parseando override_packages string:", e);
            }
          } else if (typeof ovRaw === "object") {
            overridePackagesObj = ovRaw;
          }
        }

        if (overridePackagesObj) {
          const COMMON_PACKAGES: Record<string, { name: string; months: number; credits: number; is_trial: number }> = {
            "129": { name: "⚡ 1 Mes", months: 1, credits: 1, is_trial: 0 },
            "130": { name: "⚡ 3 Meses", months: 3, credits: 2, is_trial: 0 },
            "131": { name: "⚡ 6 Meses", months: 6, credits: 4, is_trial: 0 },
            "132": { name: "⚡ 12 Meses", months: 12, credits: 8, is_trial: 0 },
            "133": { name: "⚡ 24 Meses", months: 24, credits: 16, is_trial: 0 },
            "134": { name: "⭐ 3 Meses + 1 Gratis", months: 4, credits: 3, is_trial: 0 },
            "135": { name: "⭐ 6 Meses + 2 Gratis", months: 8, credits: 5, is_trial: 0 },
            "136": { name: "⭐ 12 Meses + 3 Gratis", months: 15, credits: 10, is_trial: 0 },
            "137": { name: "⭐ 24 Meses + 6 Gratis", months: 30, credits: 20, is_trial: 0 },
            "74": { name: "⛔ Quitar XXX Gratis", months: 0, credits: 0, is_trial: 0 },
            "75": { name: "⛔ Agregar XXX Gratis", months: 0, credits: 0, is_trial: 0 },
            "1": { name: "❇️ Demo 1 Hora", months: 0, credits: 0, is_trial: 1 },
            "2": { name: "❇️ Demo 3 Horas", months: 0, credits: 0, is_trial: 1 },
            "28": { name: "❇️ Demo 6 Horas", months: 0, credits: 0, is_trial: 1 },
            "77": { name: "♻️ Demo 4 Horas (3 disp.)", months: 0, credits: 0, is_trial: 1 }
          };

          const keys = Object.keys(overridePackagesObj);
          const overrideList = keys.map(pkgId => {
            const pkgInfo = overridePackagesObj[pkgId];
            const predefined = COMMON_PACKAGES[String(pkgId)];
            const defCredits = pkgInfo && pkgInfo.official_credits !== "" && pkgInfo.official_credits !== null ? Number(pkgInfo.official_credits) : (predefined ? predefined.credits : 1);
            
            const maxConns = pkgInfo && pkgInfo.max_connections !== undefined ? Number(pkgInfo.max_connections) : 1;
            const multipleConns = pkgInfo && pkgInfo.multiple_connections !== undefined ? Number(pkgInfo.multiple_connections) : maxConns;
            const multiconxPricingStr = pkgInfo && pkgInfo.multiconx_pricing !== undefined 
              ? (typeof pkgInfo.multiconx_pricing === "object" ? JSON.stringify(pkgInfo.multiconx_pricing) : String(pkgInfo.multiconx_pricing))
              : undefined;

            return {
              id: pkgId,
              package_id: pkgId,
              name: predefined ? predefined.name : `Paquete Proveedor #${pkgId}`,
              credits: defCredits,
              official_credits: defCredits,
              is_official: predefined ? (predefined.is_trial ? 0 : 1) : 1,
              is_trial: predefined ? predefined.is_trial : 0,
              months: predefined ? predefined.months : 1,
              max_connections: maxConns,
              multiple_connections: multipleConns,
              multiconx_pricing: multiconxPricingStr
            };
          });
          
          if (list.length === 0) {
            list = overrideList;
          } else {
            const listIds = list.map(item => String(item.id || item.package_id));
            overrideList.forEach(ovItem => {
              if (!listIds.includes(String(ovItem.id))) {
                list.push(ovItem);
              }
            });
          }
        }
      } else {
        // Si falló el trial, arrojar error descriptivo físico
        throw new Error(xuiData.error || "El panel rechazó la sincronización experimental.");
      }

      // Garantizar la existencia de los planes demo tradicionales y planes comerciales comunes
      // para que nunca queden omitidos ni archivados si la API no los envía explícitamente.
      const currentListIds = list.map(item => String(item.id || item.package_id));
      const DEFAULT_DEMOS = [
        { id: "1", package_id: "1", name: "❇️ Demo 1 Hora", is_trial: 1, credits: 0, official_credits: 0, trial_duration: 1, trial_duration_in_hours: 1, trial_duration_in: "hours", screens: 1, months: 0, hours: 1, max_connections: 1 },
        { id: "2", package_id: "2", name: "❇️ Demo 3 Horas", is_trial: 1, credits: 0, official_credits: 0, trial_duration: 3, trial_duration_in_hours: 3, trial_duration_in: "hours", screens: 1, months: 0, hours: 3, max_connections: 1 },
        { id: "28", package_id: "28", name: "❇️ Demo 6 Horas", is_trial: 1, credits: 0, official_credits: 0, trial_duration: 6, trial_duration_in_hours: 6, trial_duration_in: "hours", screens: 1, months: 0, hours: 6, max_connections: 1 },
        { id: "77", package_id: "77", name: "♻️ Demo 4 Horas (3 disp.)", is_trial: 1, credits: 0, official_credits: 0, trial_duration: 4, trial_duration_in_hours: 4, trial_duration_in: "hours", screens: 3, months: 0, hours: 4, max_connections: 3 }
      ];

      DEFAULT_DEMOS.forEach(demo => {
        if (!currentListIds.includes(String(demo.id))) {
          list.push(demo);
        }
      });

      const DEFAULT_COMMERCIALS = [
        { 
          id: "129", 
          package_id: "129", 
          name: "⚡ 1 Mes", 
          is_trial: 0, 
          credits: 1, 
          official_credits: 1, 
          months: 1, 
          screens: 1, 
          max_connections: 1,
          multiple_connections: 5,
          multiconx_pricing: '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]'
        },
        { 
          id: "130", 
          package_id: "130", 
          name: "⚡ 3 Meses", 
          is_trial: 0, 
          credits: 2, 
          official_credits: 2, 
          months: 3, 
          screens: 1, 
          max_connections: 1,
          multiple_connections: 5,
          multiconx_pricing: '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]'
        },
        { 
          id: "131", 
          package_id: "131", 
          name: "⚡ 6 Meses", 
          is_trial: 0, 
          credits: 4, 
          official_credits: 4, 
          months: 6, 
          screens: 1, 
          max_connections: 1,
          multiple_connections: 5,
          multiconx_pricing: '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]'
        },
        { 
          id: "132", 
          package_id: "132", 
          name: "⚡ 12 Meses", 
          is_trial: 0, 
          credits: 8, 
          official_credits: 8, 
          months: 12, 
          screens: 1, 
          max_connections: 1,
          multiple_connections: 5,
          multiconx_pricing: '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]'
        }
      ];

      DEFAULT_COMMERCIALS.forEach(comm => {
        if (!currentListIds.includes(String(comm.id))) {
          list.push(comm);
        }
      });

      const syncedIds: string[] = [];
      const mappedSynced: ProviderPlan[] = list.map((pkg: any, index: number) => {
        const id = String(pkg.id || pkg.package_id || (index + 1));
        syncedIds.push(id);
        const name = pkg.name || pkg.package_name || `Paquete IPTV #${id}`;
        
        // Soporte nativo para XC Reseller - Multi Panel
        let apiCredits = 1;
        if (pkg.credits !== undefined) {
          apiCredits = Number(pkg.credits);
        } else if (pkg.official_credits !== undefined) {
          apiCredits = Number(pkg.official_credits);
        } else if (pkg.trial_credits !== undefined && Number(pkg.is_trial || pkg.trial || 0) === 1) {
          apiCredits = Number(pkg.trial_credits);
        }

        let apiMonths = 1;
        let apiHours: number | undefined = undefined;
        
        if (pkg.months !== undefined) {
          apiMonths = Number(pkg.months);
        } else if (pkg.official_duration !== undefined) {
          const dur = Number(pkg.official_duration);
          const durIn = String(pkg.official_duration_in || "months").toLowerCase();
          if (durIn.includes("month")) {
            apiMonths = dur;
          } else if (durIn.includes("year")) {
            apiMonths = dur * 12;
          } else if (durIn.includes("hour")) {
            apiHours = dur;
            apiMonths = 0;
          } else {
            apiMonths = Math.max(1, Math.round(dur / 30));
          }
        }

        // Manejar Demos/Trials con duración en horas
        const isTrial = (pkg.is_trial !== undefined ? Number(pkg.is_trial) : 0) || (pkg.is_official === "0" && pkg.trial_duration !== "0" ? 1 : 0);
        if (isTrial === 1 || pkg.trial_duration !== undefined && Number(pkg.trial_duration) > 0) {
          const dur = Number(pkg.trial_duration || pkg.trial_duration_in_hours || 1);
          const durIn = String(pkg.trial_duration_in || "hours").toLowerCase();
          if (durIn.includes("hour")) {
            apiHours = dur;
            apiMonths = 0;
          }
        }

        const apiScreens = pkg.screens !== undefined ? Number(pkg.screens) : (pkg.max_connections !== undefined ? Number(pkg.max_connections) : 1);
        const maxConns = pkg.max_connections !== undefined ? Number(pkg.max_connections) : 1;
        
        let multipleConns = pkg.multiple_connections !== undefined ? Number(pkg.multiple_connections) : undefined;
        let multiconxPricingStr = typeof pkg.multiconx_pricing === "object" ? JSON.stringify(pkg.multiconx_pricing) : (pkg.multiconx_pricing || undefined);

        if (isTrial !== 1) {
          const currentMultiple = multipleConns != null ? multipleConns : 1;
          if (currentMultiple <= 1) {
            multipleConns = 5;
            if (!multiconxPricingStr) {
              multiconxPricingStr = '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]';
            }
          }
        } else {
          multipleConns = multipleConns != null ? multipleConns : apiScreens;
        }

        const existing = providerPlans.find(p => p.id === id);
        return {
          id: id,
          provider_name: "API Panel",
          name: existing?.name ? existing.name : name,
          months: existing?.months != null ? existing.months : apiMonths,
          hours: existing?.hours != null ? existing.hours : apiHours,
          screens: existing?.screens != null ? existing.screens : apiScreens,
          tokens: existing?.tokens != null ? existing.tokens : apiCredits,
          token_price: existing?.token_price != null ? existing.token_price : 1500,
          cost: (existing?.tokens != null ? existing.tokens : apiCredits) * (existing?.token_price != null ? existing.token_price : 1500),
          archived: false,
          is_trial: isTrial,
          is_official: pkg.is_official !== undefined ? Number(pkg.is_official) : 1,
          groups: pkg.groups ? (typeof pkg.groups === "string" ? JSON.parse(pkg.groups) : pkg.groups) : [],
          max_connections: maxConns,
          multiple_connections: multipleConns,
          multiconx_pricing: multiconxPricingStr
        };
      });

      const mappedBouquets: ProviderPlan[] = bList.map((item: any) => {
        const id = `bouquet_${item.id}`;
        const existing = providerPlans.find(p => p.id === id);
        return {
          id: id,
          provider_name: existing?.provider_name || "API Panel (Bouquet)",
          name: existing?.name || `💐 Bouquet #${item.id} (Canales / VOD)`,
          months: existing?.months != null ? existing.months : 1,
          screens: existing?.screens != null ? existing.screens : 1,
          tokens: existing?.tokens != null ? existing.tokens : 1,
          token_price: existing?.token_price != null ? existing.token_price : 1500,
          cost: (existing?.tokens != null ? existing.tokens : 1) * (existing?.token_price != null ? existing.token_price : 1500),
          archived: false,
          is_trial: existing?.is_trial != null ? existing.is_trial : 0,
          is_official: 1,
          is_bouquet: true,
          bouquet_id: String(item.id)
        };
      });

      const syncedBouquetIds = mappedBouquets.map(b => b.id);
      const allSyncedIds = [...syncedIds, ...syncedBouquetIds];

      // Archivar planes antiguos que no están en el lote activo devuelto, excepto si son demos/trials que siempre están disponibles
      const archivedPlans = providerPlans
        .filter(p => !allSyncedIds.includes(p.id))
        .map(p => {
          const isDemoPkg = p.is_trial || !p.tokens || Number(p.tokens) === 0 || p.id === "1" || p.id === "2";
          return { ...p, archived: isDemoPkg ? false : true };
        });

      const finalMergedList = [...mappedSynced, ...mappedBouquets, ...archivedPlans];

      // Duplicación automática y sincronización de planes mayoristas hacia salePlans según la Matriz de Costos por Crédito
      let updatedSalePlans = [...(salePlansRef.current && salePlansRef.current.length > 0 ? salePlansRef.current : (financesRef.current?.sale_plans || []))];
      let newPlansDuplicatedCount = 0;

      // Obtener el precio unitario del crédito calibrado en la Matriz
      const unitCost = Number(localStorage.getItem('g3d_iptv_costo_credito')) || 10000;
      const unitAdmin = Number(localStorage.getItem('g3d_iptv_comision_administrador')) || 2000;
      const unitVend = Number(localStorage.getItem('g3d_iptv_comision_vendedor_global')) || 1500;
      const unitRef = Number(localStorage.getItem('g3d_iptv_comision_referente_global')) || 500;
      const matrixUnitPrice = unitCost + unitAdmin + unitVend + unitRef;
      const effectiveCreditPrice = matrixUnitPrice > 0 ? matrixUnitPrice : 14000;

      mappedSynced.forEach(provPkg => {
        const catId = classifyPlanCategory(provPkg);
        const provTokens = Number(provPkg.tokens) || 0;
        const tokensCount = catId === 'demo' ? 0 : (provTokens > 0 ? provTokens : (provPkg.months || 1));
        const finalPrice = catId === 'demo' ? 0 : (tokensCount * effectiveCreditPrice);
        const finalComVend = catId === 'demo' ? 0 : (tokensCount * unitVend);
        const finalComRef = catId === 'demo' ? 0 : (tokensCount * unitRef);

        const existingIndex = updatedSalePlans.findIndex(sp => String(sp.provider_plan_id) === String(provPkg.id));
        if (existingIndex >= 0) {
          // Ya existe: si tiene override manual respetamos su nombre y precio; si no, calibramos con la Matriz
          const existing = updatedSalePlans[existingIndex];
          const hasManualOverride = existing.custom_override === true;

          let cleanName = existing.name;
          if (!hasManualOverride) {
            cleanName = provPkg.name;
          } else if (cleanName.startsWith('⭐ Promo: ') || cleanName.startsWith('🚀 Oferta Especial: ')) {
            cleanName = provPkg.name;
          }

          const targetPrice = hasManualOverride && existing.price > 0 ? existing.price : finalPrice;
          const targetComVend = hasManualOverride && existing.comision_vendedor !== undefined ? existing.comision_vendedor : finalComVend;
          const targetComRef = hasManualOverride && existing.comision_referente !== undefined ? existing.comision_referente : finalComRef;

          updatedSalePlans[existingIndex] = {
            ...existing,
            name: cleanName,
            categoria_id: existing.categoria_id || catId,
            categoria_nombre: existing.categoria_nombre || (catId === 'demo' ? 'Demos Gratuitas' : catId === 'xxx' ? 'Paquetes Adultos XXX' : 'Membresías VIP'),
            visible: existing.visible !== undefined ? existing.visible : true,
            tokens: tokensCount,
            screens_api: provPkg.max_connections || provPkg.screens || 1,
            price: targetPrice,
            comision: targetComVend,
            comision_vendedor: targetComVend,
            comision_referente: targetComRef,
            custom_override: hasManualOverride
          };
        } else {
          // No existe: duplicamos el paquete mayorista con su nombre real idéntico y precio calculado según la Matriz
          const newSalePlan: SalePlan = {
            id: `sale-${provPkg.id}-${Date.now()}`,
            provider_plan_id: String(provPkg.id),
            name: provPkg.name, // Nombre exacto del paquete del proveedor (sin nombres inventados)
            months: provPkg.months || 0,
            hours: provPkg.hours || 0,
            screens: provPkg.screens || 1,
            tokens: tokensCount,
            price: finalPrice, // Precio calibrado: si 1 crédito = $14000, si 3 créditos = $42000
            screens_api: provPkg.max_connections || provPkg.screens || 1,
            comision: finalComVend,
            comision_vendedor: finalComVend,
            comision_referente: finalComRef,
            categoria_nombre: catId === 'demo' ? 'Demos Gratuitas' : catId === 'xxx' ? 'Paquetes Adultos XXX' : 'Membresías VIP',
            categoria_id: catId,
            visible: true, // Por defecto visible
            custom_override: false
          };
          updatedSalePlans.push(newSalePlan);
          newPlansDuplicatedCount++;
        }
      });

      setSalePlans(updatedSalePlans);

      setProviderPlans(finalMergedList);
      try {
        const res = await apiService.saveIptvFinances({
          ...financesRef.current,
          provider_plans: finalMergedList,
          sale_plans: updatedSalePlans,
          partners: (partnersRef.current && partnersRef.current.length > 0) ? partnersRef.current : (financesRef.current?.partners || [])
        });
        if (res && res.success === false) {
          toast.error(`Error de sincronización con Supabase: ${res.error || 'Verifica las columnas de la tabla'}`);
        }
      } catch (err: any) {
        toast.error(`Error al conectar con Supabase: ${err.message || err}`);
      }

      if (!silent) {
        toast.dismiss();
        if (newPlansDuplicatedCount > 0) {
          toast.success(`¡Sincronizado! Se duplicaron y calibraron ${newPlansDuplicatedCount} paquetes del panel con los precios de tu Matriz.`);
        } else {
          toast.success(`¡Sincronizado con éxito! Se verificaron los paquetes del panel y se calibraron los precios minoristas.`);
        }
      }
      return finalMergedList;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      setXuiErrorMsg(errMsg);
      setIsXuiConnected(false);
      localStorage.setItem('xui_is_connected', 'false');
      setApiCredits(null);
      localStorage.removeItem('xui_api_credits');
      
      if (!silent) {
        toast.dismiss();
        toast.error(`Error de Sincronización Real: ${errMsg}`);
      }
      return null;
    }
  };

  const fetchData = async (silent = true) => {
    if (!silent && accounts.length === 0) {
      setLoading(true);
    }
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    try {
      // 1. Obtener datos clave de IPTV del API Service en paralelo
      const [sysConfRes, accsRes, profsRes, sessRes, finObjRes, cProvRes] = await Promise.allSettled([
        apiService.getSystemConfig(),
        apiService.getIptvAccounts(),
        apiService.getIptvProfiles(),
        apiService.getIptvActiveSessions(),
        apiService.getIptvFinances(),
        apiService.getIptvCostosProveedor()
      ]);

      const sysConf = sysConfRes.status === 'fulfilled' ? sysConfRes.value : null;
      if (sysConf) {
        const isActiveXc = sysConf.iptv_panel_active === 'xc_reseller';
        setXuiConfig({
          xui_url: (isActiveXc ? sysConf.xc_url_completa : sysConf.xui_url) || '',
          xui_token: (isActiveXc ? sysConf.xc_token : sysConf.xui_token) || '',
          xui_access_code: (isActiveXc ? sysConf.xc_access_code : sysConf.xui_access_code) || '',
          xui_package_id: (isActiveXc ? sysConf.xc_package_id : sysConf.xui_package_id) || '1',
          iptv_panel_active: sysConf.iptv_panel_active || 'xui_one',
          api_settings: sysConf.api_settings || {}
        });
        setXuiSelectedPkg((isActiveXc ? sysConf.xc_package_id : sysConf.xui_package_id) || '1');

        // Cargar plantillas de respuestas rápidas (Opción C)
        if (sysConf.whatsapp_automations && sysConf.whatsapp_automations.quick_replies) {
          setQuickReplies(sysConf.whatsapp_automations.quick_replies);
        } else {
          const stored = localStorage.getItem('g3d_quick_replies');
          if (stored) {
            try {
              setQuickReplies(JSON.parse(stored));
            } catch (e) {
              setQuickReplies(DEFAULT_QUICK_REPLIES);
            }
          }
        }
      }

      const accs = accsRes.status === 'fulfilled' && accsRes.value ? accsRes.value : [];
      if (accsRes.status === 'fulfilled') {
        localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(accs));
        setAccounts(accs);
      }
      const profs = profsRes.status === 'fulfilled' && profsRes.value ? profsRes.value : [];
      setProfiles(profs);
      const sess = sessRes.status === 'fulfilled' && sessRes.value ? sessRes.value : [];
      setActiveSessions(sess);

      const finObj = finObjRes.status === 'fulfilled' && finObjRes.value ? finObjRes.value : null;

      // 2. Fallbacks de Configuración Financiera y Planes segun lo solicitado
      const loadedFinances = finObj || {};
      
      // Cargar configuraciones del dolar e inversion traducida si existen
      if (loadedFinances.dollar_rate !== undefined) setDollarRate(loadedFinances.dollar_rate);
      if (loadedFinances.token_package_usd !== undefined) setTokenPackageUsd(loadedFinances.token_package_usd);
      if (loadedFinances.credits_per_pack !== undefined) setCreditsPerPack(loadedFinances.credits_per_pack);
      if (loadedFinances.available_credits !== undefined) setAvailableCredits(loadedFinances.available_credits);
      if (loadedFinances.provider_name !== undefined) setProviderName(loadedFinances.provider_name);
      if (loadedFinances.payment_discount !== undefined) setPaymentDiscount(loadedFinances.payment_discount);
      if (loadedFinances.additional_tax_percent !== undefined) setAdditionalTaxPercent(loadedFinances.additional_tax_percent);
      if (loadedFinances.app_maintenance_cost !== undefined) setAppMaintenanceCost(loadedFinances.app_maintenance_cost);
      if (loadedFinances.street_tech_cost !== undefined) setStreetTechCost(loadedFinances.street_tech_cost);
      if (loadedFinances.costo_credito !== undefined) setCostoCredito(Number(loadedFinances.costo_credito));
      if (loadedFinances.comision_administrador !== undefined) setComisionAdministrador(Number(loadedFinances.comision_administrador));
      if (loadedFinances.comision_vendedor !== undefined) setComisionVendedorGlobal(Number(loadedFinances.comision_vendedor));
      if (loadedFinances.comision_referente !== undefined) setComisionReferenteGlobal(Number(loadedFinances.comision_referente));

      // Planes del proveedor por defecto (si no existen)
      const defaultProviderPlans: ProviderPlan[] = [
        { id: "1", provider_name: "API Panel", name: "❇️ Demo 1 Hora", months: 0, hours: 1, screens: 1, tokens: 0, cost: 0, token_price: 1500, is_trial: 1, is_official: 0, groups: [2,7] },
        { id: "2", provider_name: "API Panel", name: "❇️ Demo 3 Horas", months: 0, hours: 3, screens: 1, tokens: 0, cost: 0, token_price: 1500, is_trial: 1, is_official: 0, groups: [2,7] },
        { id: "28", provider_name: "API Panel", name: "❇️ Demo 6 Horas", months: 0, hours: 6, screens: 1, tokens: 0, cost: 0, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "47", provider_name: "API Panel", name: "☀️ PROMO 2x1", months: 2, screens: 3, tokens: 1, cost: 1500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "48", provider_name: "API Panel", name: "#C - 1 Mes 1 Dispositivo (Consume 1 credito)", months: 1, screens: 1, tokens: 1, cost: 1500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "49", provider_name: "API Panel", name: "#D - 1 Mes 3 Dispositivos (Consume 1 credito)", months: 1, screens: 3, tokens: 1, cost: 1500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "50", provider_name: "API Panel", name: "#E - 1 Mes 5 Dispositivos (Consume 2 creditos)", months: 1, screens: 5, tokens: 2, cost: 3000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "51", provider_name: "API Panel", name: "#F - 3 Meses 1 Dispositivo (Consume 2 creditos)", months: 3, screens: 1, tokens: 2, cost: 3000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "52", provider_name: "API Panel", name: "#B - PROMO 3x2  (Activa 3 meses 3 Dispositivos y consume 2 creditos)", months: 3, screens: 3, tokens: 2, cost: 3000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "53", provider_name: "API Panel", name: "#G - 3 Meses 5 Dispositivos (Consume 3 creditos)", months: 3, screens: 5, tokens: 3, cost: 4500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "54", provider_name: "API Panel", name: "#H - 6 Meses 1 Dispositivo (Consume 4 creditos)", months: 6, screens: 1, tokens: 4, cost: 6000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "55", provider_name: "API Panel", name: "#I - 6 Meses 3 Dispositivos (Consume 5 creditos)", months: 6, screens: 3, tokens: 5, cost: 7500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "56", provider_name: "API Panel", name: "#J - 6 Meses 5 Dispositivos (Consume 6 creditos)", months: 6, screens: 5, tokens: 6, cost: 9000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "57", provider_name: "API Panel", name: "#K - 12 Meses 1 Dispositivo (Consume 8 creditos)", months: 12, screens: 1, tokens: 8, cost: 12000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "58", provider_name: "API Panel", name: "#L - 12 Meses 3 Dispositivos (Consume 9 creditos)", months: 12, screens: 3, tokens: 9, cost: 13500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "59", provider_name: "API Panel", name: "#M - 12 Meses 5 Dispositivos (Consume 10 creditos)", months: 12, screens: 5, tokens: 10, cost: 15000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "61", provider_name: "API Panel", name: "#N - 3+1 (4 Meses) 3 Dispositivos (Consume 3 creditos)", months: 4, screens: 3, tokens: 3, cost: 4500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "62", provider_name: "API Panel", name: "#O - 3+1 (4 Meses) 5 Dispositivos (Consume 4 creditos)", months: 4, screens: 5, tokens: 4, cost: 6000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "63", provider_name: "API Panel", name: "#P - 6+2 (8 Meses) 3 Dispositivos (Consume 6 creditos)", months: 8, screens: 3, tokens: 6, cost: 9000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "64", provider_name: "API Panel", name: "#Q - 6+2 (8 Meses) 5 Dispositivos (Consume 7 creditos)", months: 8, screens: 5, tokens: 7, cost: 10500, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "65", provider_name: "API Panel", name: "#R - 12+3 (15 Meses) 3 Dispositivos (Consume 10 creditos)", months: 15, screens: 3, tokens: 10, cost: 15000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "66", provider_name: "API Panel", name: "#S - 12+3 (15 Meses) 5 Dispositivos (Consume 12 creditos)", months: 15, screens: 5, tokens: 12, cost: 18000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "67", provider_name: "API Panel", name: "#T - 24+6 (30 Meses) 3 Dispositivos (Consume 20 creditos)", months: 30, screens: 3, tokens: 20, cost: 30000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "68", provider_name: "API Panel", name: "#U - 24+6 (30 Meses) 5 Dispositivos (Consume 22 creditos)", months: 30, screens: 5, tokens: 22, cost: 33000, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "74", provider_name: "API Panel", name: "⛔ Quitar XXX Gratis", months: 0, screens: 1, tokens: 0, cost: 0, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7] },
        { id: "75", provider_name: "API Panel", name: "⛔ Agregar XXX Gratis", months: 0, screens: 1, tokens: 0, cost: 0, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7] },
        { id: "77", provider_name: "API Panel", name: "♻️ Demo 4 Horas (3 dispositivos)", months: 0, hours: 4, screens: 3, tokens: 0, cost: 0, token_price: 1500, is_trial: 0, is_official: 0, groups: [2,7] },
        { id: "129", provider_name: "API Panel", name: "⚡ 1 Mes", months: 1, screens: 1, tokens: 1, cost: 1500, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "130", provider_name: "API Panel", name: "⚡ 3 Meses", months: 3, screens: 1, tokens: 2, cost: 3000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "131", provider_name: "API Panel", name: "⚡ 6 Meses", months: 6, screens: 1, tokens: 4, cost: 6000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "132", provider_name: "API Panel", name: "⚡ 12 Meses", months: 12, screens: 1, tokens: 8, cost: 12000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "133", provider_name: "API Panel", name: "⚡ 24 Meses", months: 24, screens: 1, tokens: 18, cost: 27000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7] },
        { id: "134", provider_name: "API Panel", name: "⭐ 3 meses +1 mes gratis", months: 4, screens: 1, tokens: 3, cost: 4500, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "135", provider_name: "API Panel", name: "⭐ 6 meses +2 meses gratis", months: 8, screens: 1, tokens: 5, cost: 7500, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "136", provider_name: "API Panel", name: "⭐ 12 meses +3 meses gratis", months: 15, screens: 1, tokens: 10, cost: 15000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7,13] },
        { id: "137", provider_name: "API Panel", name: "⭐ 24 meses +6 meses gratis", months: 30, screens: 1, tokens: 20, cost: 30000, token_price: 1500, is_trial: 0, is_official: 1, groups: [2,7] }
      ];

      // Planes de venta por defecto (si no existen)
      const defaultSalePlans: SalePlan[] = [];

      const rawProviderPlans = loadedFinances.provider_plans && loadedFinances.provider_plans.length > 0
        ? loadedFinances.provider_plans
        : defaultProviderPlans;

      const currentProviderPlans = rawProviderPlans.map((p: ProviderPlan) => {
        const isTrial = p.is_trial === 1 || String(p.id) === "1" || String(p.id) === "2" || String(p.id) === "28" || String(p.id) === "77";
        if (isTrial) {
          return {
            ...p,
            max_connections: p.max_connections != null ? Number(p.max_connections) : (p.screens || 1),
            multiple_connections: p.multiple_connections != null ? Number(p.multiple_connections) : (p.screens || 1)
          };
        }
        // Para planes reales o comerciales, si no tienen múltiples conexiones configuradas o es igual a 1, les damos 5 por defecto
        const currentMultiple = p.multiple_connections != null ? Number(p.multiple_connections) : 1;
        if (currentMultiple <= 1) {
          return {
            ...p,
            max_connections: p.max_connections != null ? Number(p.max_connections) : (p.screens || 1),
            multiple_connections: 5,
            multiconx_pricing: p.multiconx_pricing || '[{"connections":2,"price":1,"isCustom":true},{"connections":3,"price":1,"isCustom":true},{"connections":4,"price":1.5,"isCustom":true},{"connections":5,"price":2,"isCustom":true}]'
          };
        }
        return p;
      });

      const currentSalePlans = loadedFinances.sale_plans && loadedFinances.sale_plans.length > 0
        ? loadedFinances.sale_plans
        : defaultSalePlans;

      const currentPartners = loadedFinances.partners && loadedFinances.partners.length > 0
        ? loadedFinances.partners
        : [
            { name: 'Socio A (Administrador)', percent: 50, role: 'Socio Administrador', advances: 0 },
            { name: 'Socio B (Capitalista)', percent: 30, role: 'Socio Inversionista', advances: 0 },
            { name: 'Plataforma (Mantenimiento)', percent: 20, role: 'Comisión Servidor', advances: 0 }
          ];

      // Costos de proveedor
      const cProveedor = cProvRes.status === 'fulfilled' && cProvRes.value ? cProvRes.value : [];
      setProviderCosts(cProveedor);

      setProviderPlans(currentProviderPlans);
      setSalePlans(currentSalePlans);
      setPartners(currentPartners);

      setFinances({
        ...loadedFinances,
        provider_plans: currentProviderPlans,
        sale_plans: currentSalePlans,
        partners: currentPartners
      });

      // Inicializar el conteo de la API si no existe para sincronía perfecta inicial
      if (!localStorage.getItem('xui_api_users_count')) {
        setXuiApiUsersCount(accs.length);
        localStorage.setItem('xui_api_users_count', String(accs.length));
      }

      // Sincronizar de forma automática al inicio usando las credenciales del panel activo (XUI o XC Reseller)
      if (sysConf) {
        const isActiveXc = sysConf.iptv_panel_active === 'xc_reseller';
        const actualUrl = (isActiveXc ? sysConf.xc_url_completa : sysConf.xui_url) || '';
        const actualToken = (isActiveXc ? sysConf.xc_token : sysConf.xui_token) || '';
        const actualCode = (isActiveXc ? sysConf.xc_access_code : sysConf.xui_access_code) || '';
        const actualPkgId = (isActiveXc ? sysConf.xc_package_id : sysConf.xui_package_id) || '1';

        if (actualUrl && actualToken) {
          setTimeout(async () => {
            try {
              // Secuenciar de forma ordenada para no disparar ráfagas concurrentes que saturen el panel remoto (evitando HTTP 429)
              await syncLiveCredits(true, actualUrl, actualToken, actualCode);
              await new Promise(r => setTimeout(r, 600));
              await syncXuiPackages(true, actualUrl, actualToken, actualCode, actualPkgId);
            } catch (syncErr) {
              console.warn("Sincronización inicial en segundo plano completada:", syncErr);
            }
          }, 1200);
        }
      }

    } catch (e) {
      console.warn("Sincronización IPTV en segundo plano completada con advertencia:", e);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const handleImportToLocal = async (line: IptvAccount) => {
    try {
      toast.loading(`Importando cliente "${line.username}" a Base de Datos Local...`);
      const toSave = {
        ...line,
        isFromApi: false, 
        nombre_completo: line.nombre_completo || 'Cliente Importado del Panel',
        celular: line.celular || 'Pendiente',
        direccion_actual: line.direccion_actual || 'Pendiente'
      };
      const res = await apiService.saveIptvAccount(toSave);
      toast.dismiss();
      if (res.success) {
        toast.success(`Cliente "${line.username}" importado y guardado con éxito.`);
        await fetchData();
      } else {
        throw new Error("No se pudo persistir en Supabase");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error al importar: ${err.message || err}`);
    }
  };

  const fetchApiAccounts = async (silent = false) => {
    if (!xuiConfig.xui_url) {
      if (!silent) toast.error("La URL de tu panel XUI.ONE / Reseller no está configurada.");
      return;
    }
    setIsFetchingApiAccounts(true);
    if (!silent) toast.loading("Cargando líneas en tiempo real desde la API del panel...");
    try {
      const res = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_lines",
          xuiUrl: xuiConfig.xui_url,
          xuiToken: xuiConfig.xui_token,
          xuiAccessCode: xuiConfig.xui_access_code,
          start: 0,
          limit: 100
        })
      });
      const responseData = await res.json();
      if (!silent) toast.dismiss();
      
      if (responseData.success) {
        const apiResponse = responseData.data || {};
        const rawLines = Array.isArray(apiResponse) ? apiResponse : (apiResponse.data || []);
        
        if (rawLines && rawLines.length > 0) {
          const mapped: IptvAccount[] = rawLines.map((line: any) => {
            const expTimestamp = line.fecha_exp || line.fecha_de_caducidad || line.exp_date || line.fecha_vencimiento || line.expire_date;
            let expirationIso: string | null = null;
            if (expTimestamp) {
              const seconds = Number(expTimestamp);
              if (!isNaN(seconds)) {
                const isUnix = seconds < 10000000000;
                expirationIso = new Date(seconds * (isUnix ? 1000 : 1)).toISOString();
              } else {
                expirationIso = new Date(expTimestamp).toISOString();
              }
            }

            const rawStatus = line.estado !== undefined ? line.estado : line.status;
            let finalStatus = 'Activo';
            if (rawStatus === 2 || rawStatus === '2' || rawStatus === 'Disabled' || rawStatus === 'Deshabilitado' || rawStatus === 'Pausado') {
              finalStatus = 'Pausado';
            } else if (rawStatus === 3 || rawStatus === '3' || rawStatus === 'Blocked' || rawStatus === 'Bloqueado') {
              finalStatus = 'Suspendida';
            }

            const localMatch = accounts.find(a => (a.username || '').toLowerCase() === (line.username || '').toLowerCase());

            return {
              username: line.username || line.nombre_usuario || '',
              nombre_completo: localMatch?.nombre_completo || line.nombre_completo || line.reseller_notes || '',
              telefono: localMatch?.telefono || line.telefono || '',
              password: line.password || line.contraseña || '',
              url_panel_asignada: xuiConfig.xui_url,
              estado: finalStatus,
              limite_pantallas: line.max_connections !== undefined ? Number(line.max_connections) : (line.is_isp_locked ? 1 : 2),
              fecha_creacion: line.creado_en || line.created_at || new Date().toISOString(),
              fecha_vencimiento: expirationIso,
              comentarios: line.reseller_notes || line.notas_del_revendedor || line.comentarios || '',
              isFromApi: true,
              api_sincronizado: true,
              id_linea_panel: line.id,
              id_plan_venta: localMatch?.id_plan_venta || undefined
            };
          });
          setApiAccounts(mapped);
          if (!silent) toast.success(`¡Se cargaron ${mapped.length} líneas en vivo desde el Panel!`);
        } else {
          setApiAccounts([]);
          if (!silent) toast.info("No se encontraron líneas creadas en tu panel de revendedor todavía.");
        }
      } else {
        throw new Error(responseData.error || "Error indeterminado.");
      }
    } catch (err: any) {
      if (!silent) toast.dismiss();
      console.error("Error al obtener líneas del panel:", err);
      if (!silent) {
        toast.error(`Error al conectar con la API: ${err.message || err}. Mostrando simulador de conexión.`);
      }
      const mockApiLines = [
        {
          username: "testapiclient1",
          password: "pass_demo1",
          url_panel_asignada: xuiConfig.xui_url,
          estado: "Activo",
          limite_pantallas: 2,
          fecha_creacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          fecha_vencimiento: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
          comentarios: "Línea real testeada de API. Nota: Cuenta Premium.",
          isFromApi: true,
          id_linea_panel: 101
        },
        {
          username: "jperez77",
          password: "iiv2wku",
          url_panel_asignada: xuiConfig.xui_url,
          estado: "Activo",
          limite_pantallas: 1,
          fecha_creacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          fecha_vencimiento: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
          comentarios: "Línea demo de 1 hora de prueba.",
          isFromApi: true,
          id_linea_panel: 102
        }
      ];
      setApiAccounts(mockApiLines);
    } finally {
      setIsFetchingApiAccounts(false);
    }
  };

  const saveFinancesState = async (
    updatedProvider?: ProviderPlan[], 
    updatedSale?: SalePlan[], 
    updatedPartners?: any[],
    customRate?: number,
    customPkgUsd?: number,
    customDiscount?: number,
    customTax?: number,
    customMaint?: number,
    customStreet?: number,
    customProviderName?: string,
    customCreditsPerPack?: number,
    customAvailableCredits?: number,
    customCostoCredito?: number,
    customComisionAdmin?: number,
    customComisionVend?: number,
    customComisionRef?: number
  ) => {
    const provList = updatedProvider !== undefined ? updatedProvider : providerPlansRef.current;
    const saleList = updatedSale !== undefined ? updatedSale : salePlansRef.current;
    const partList = updatedPartners !== undefined ? updatedPartners : partnersRef.current;

    const rateVal = customRate !== undefined ? customRate : dollarRate;
    const pkgUsdVal = customPkgUsd !== undefined ? customPkgUsd : tokenPackageUsd;
    const providerNameVal = customProviderName !== undefined ? customProviderName : providerName;
    const creditsPerPackVal = customCreditsPerPack !== undefined ? customCreditsPerPack : creditsPerPack;
    const availableCreditsVal = customAvailableCredits !== undefined ? customAvailableCredits : availableCredits;
    const costoCreditoVal = customCostoCredito !== undefined ? customCostoCredito : costoCredito;
    const comisionAdminVal = customComisionAdmin !== undefined ? customComisionAdmin : comisionAdministrador;
    const comisionVendVal = customComisionVend !== undefined ? customComisionVend : comisionVendedorGlobal;
    const comisionRefVal = customComisionRef !== undefined ? customComisionRef : comisionReferenteGlobal;

    const updatedFinances = {
      ...(financesRef.current || finances),
      provider_plans: provList,
      sale_plans: saleList,
      partners: partList,
      dollar_rate: rateVal,
      token_package_usd: pkgUsdVal,
      payment_discount: customDiscount !== undefined ? customDiscount : paymentDiscount,
      additional_tax_percent: customTax !== undefined ? customTax : additionalTaxPercent,
      app_maintenance_cost: customMaint !== undefined ? customMaint : appMaintenanceCost,
      street_tech_cost: customStreet !== undefined ? customStreet : streetTechCost,
      provider_name: providerNameVal,
      credits_per_pack: creditsPerPackVal,
      available_credits: availableCreditsVal,
      costo_credito: costoCreditoVal,
      comision_administrador: comisionAdminVal,
      comision_vendedor: comisionVendVal,
      comision_referente: comisionRefVal
    };

    // Guardar en localStorage de inmediato para persistencia permanente en recarga
    localStorage.setItem('g3d_iptv_active_dollar_rate', String(rateVal));
    localStorage.setItem('g3d_iptv_active_token_package_usd', String(pkgUsdVal));
    localStorage.setItem('g3d_iptv_active_provider_name', providerNameVal);
    localStorage.setItem('g3d_iptv_active_credits_per_pack', String(creditsPerPackVal));
    localStorage.setItem('g3d_iptv_active_available_credits', String(availableCreditsVal));
    localStorage.setItem('g3d_iptv_costo_credito', String(costoCreditoVal));
    localStorage.setItem('g3d_iptv_comision_administrador', String(comisionAdminVal));
    localStorage.setItem('g3d_iptv_comision_vendedor_global', String(comisionVendVal));
    localStorage.setItem('g3d_iptv_comision_referente_global', String(comisionRefVal));

    setFinances(updatedFinances);
    try {
      const res = await apiService.saveIptvFinances(updatedFinances);
      if (res && res.success === false) {
        toast.error(`Error guardando configuración en Supabase: ${res.error || 'Verifica las columnas de la tabla'}`);
      }
    } catch (err: any) {
      toast.error(`Error de conexión con Supabase: ${err.message || err}`);
    }
  };

  // --- API DE COTIZACIÓN DE DÓLAR EN TIEMPO REAL ---
  const fetchDollarRate = async () => {
    setFetchingDollar(true);
    try {
      // Intentamos con Dolar Blue, que es la divisa real de los proveedores de IPTV en Argentina
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      if (res.ok) {
        const data = await res.json();
        if (data && data.venta) {
          const rateVal = Math.round(Number(data.venta));
          setDollarRate(rateVal);
          await saveFinancesState(undefined, undefined, undefined, rateVal);
          toast.success(`Dólar Blue actualizado en vivo: $${rateVal} ARS`);
          return;
        }
      }
      
      // Fallback a Dolar Oficial si Blue falla
      const resOfi = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (resOfi.ok) {
        const dataOfi = await resOfi.json();
        if (dataOfi && dataOfi.venta) {
          const rateVal = Math.round(Number(dataOfi.venta));
          setDollarRate(rateVal);
          await saveFinancesState(undefined, undefined, undefined, rateVal);
          toast.success(`Dólar Oficial actualizado en vivo: $${rateVal} ARS`);
          return;
        }
      }
      throw new Error();
    } catch (e: any) {
      // Fallback robusto al promedio de mercado actual si falla la API
      setDollarRate(1220);
      await saveFinancesState(undefined, undefined, undefined, 1220);
      toast.info('Utilizando dólar blue cotizado del mercado actual como fallback: $1220 ARS');
    } finally {
      setFetchingDollar(false);
    }
  };

  // --- MATRIZ DE COSTOS Y COMISIONES POR CRÉDITO (AUTOMATIZACIÓN DE PRECIOS) ---
  const handleSaveCreditFinances = async () => {
    try {
      await saveFinancesState(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        costoCredito,
        comisionAdministrador,
        comisionVendedorGlobal,
        comisionReferenteGlobal
      );
      toast.success('¡Matriz de Costos y Comisiones guardada exitosamente!');
    } catch (err) {
      toast.error('Error al guardar la matriz de costos y comisiones');
    }
  };

  const handleRecalculateAllSalePlans = async () => {
    const precioCredito = (Number(costoCredito) || 0) + (Number(comisionAdministrador) || 0) + (Number(comisionVendedorGlobal) || 0) + (Number(comisionReferenteGlobal) || 0);
    if (precioCredito <= 0) {
      toast.warning('Configura los montos de costos y comisiones antes de recalcular.');
      return;
    }

    let count = 0;
    const updatedSale = salePlans.map(plan => {
      let tokensCount = Number(plan.tokens) || 0;
      const matchedProv = plan.provider_plan_id ? providerPlans.find(p => p.id === plan.provider_plan_id) : null;
      if (tokensCount <= 0 && matchedProv) {
        tokensCount = Number(matchedProv.tokens) || 1;
      }
      if (tokensCount <= 0) tokensCount = 1;

      // Calcular max screens que cuestan esos mismos tokens en el proveedor
      let maxScreens = plan.screens_api || plan.screens || 1;
      if (matchedProv) {
        const limits = getSelectedPlanConnectionsLimits(matchedProv);
        for (const opt of limits.options) {
          if (calculateApiCreditCost(matchedProv, opt) <= tokensCount) {
            maxScreens = Math.max(maxScreens, opt);
          }
        }
      }

      count++;
      const isDemo = plan.categoria_id === 'demo' || (plan.name || '').toLowerCase().includes('demo');
      const newPrice = isDemo ? 0 : Math.round(tokensCount * precioCredito);
      const newComVend = isDemo ? 0 : Math.round(tokensCount * (Number(comisionVendedorGlobal) || 0));
      const newComRef = isDemo ? 0 : Math.round(tokensCount * (Number(comisionReferenteGlobal) || 0));

      return {
        ...plan,
        tokens: tokensCount,
        price: newPrice,
        comision: newComVend,
        comision_vendedor: newComVend,
        comision_referente: newComRef,
        screens_api: maxScreens
      };
    });

    setSalePlans(updatedSale);
    await saveFinancesState(undefined, updatedSale);
    toast.success(`⚡ ¡Precios y pantallas optimizados para ${count} planes minoristas!`);
  };

  // --- AJUSTE DE GASTOS EXTRA DINÁMICOS ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount.trim()) {
      toast.warning('Ingresa un nombre y monto de gasto válidos');
      return;
    }
    const val = parseFloat(newExpenseAmount);
    if (isNaN(val) || val <= 0) {
      toast.warning('El monto del costo extra debe ser mayor a $0');
      return;
    }
    const updated = [
      ...customExpenses,
      { id: `exp-${Date.now()}`, name: newExpenseName.trim(), amount: val }
    ];
    setCustomExpenses(updated);
    localStorage.setItem('iptv_custom_expenses_v2', JSON.stringify(updated));
    setNewExpenseName('');
    setNewExpenseAmount('');
    toast.success(`Gasto extra "${newExpenseName}" sumado correctamente`);
  };

  const handleRemoveExpense = (id: string) => {
    const updated = customExpenses.filter(e => e.id !== id);
    setCustomExpenses(updated);
    localStorage.setItem('iptv_custom_expenses_v2', JSON.stringify(updated));
    toast.info('Gasto removido de la liquidación de socios');
  };

  // --- MULTI-SOCIEDADES / ISPs CON CO-INVERSIÓN ---
  const handleAddSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName.trim() || !newSocCode.trim()) {
      toast.warning('Escribe un nombre e identificador QR para la Sociedad');
      return;
    }
    const newSoc = {
      id: `soc-${Date.now()}`,
      name: newSocName.trim(),
      code: newSocCode.trim().toUpperCase(),
      commission_platform_percent: Number(newSocPlatPercent),
      partners: [
        { name: 'Socio ISP local', percent: 50, role: 'Vendedor Local', advances: 0 },
        { name: 'Socio Técnico local', percent: 50, role: 'Instalador de Redes', advances: 0 }
      ]
    };
    const updated = [...societies, newSoc];
    setSocieties(updated);
    localStorage.setItem('iptv_societies_v2', JSON.stringify(updated));
    setNewSocName('');
    setNewSocCode('');
    toast.success(`Sociedad ISP/Socio "${newSoc.name}" creada con éxito`);
  };

  const handleRemoveSociety = (id: string) => {
    if (id === 'soc-central') {
      toast.error('La Sociedad Venta Directa de XTV es el canal primordial y no se puede borrar');
      return;
    }
    const updated = societies.filter(s => s.id !== id);
    setSocieties(updated);
    localStorage.setItem('iptv_societies_v2', JSON.stringify(updated));
    toast.info('Canal de sociedad de co-inversión removido');
  };

  const handleUpdateSocietyPartnerAdvance = (socId: string, partnerName: string, amountStr: string) => {
    const val = parseFloat(amountStr) || 0;
    const updated = societies.map(s => {
      if (s.id === socId) {
        return {
          ...s,
          partners: s.partners.map((p: any) => p.name === partnerName ? { ...p, advances: val } : p)
        };
      }
      return s;
    });
    setSocieties(updated);
    localStorage.setItem('iptv_societies_v2', JSON.stringify(updated));
    toast.success('Adelanto de socio actualizado para esta sociedad');
  };

  // --- BITÁCORAS DE CLIENTES DE IPTV: CHAT SOPORTE Y ADVERTENCIAS ---
  // Guardado de la modal de clientes al cerrar
  const handleCloseAndSaveClientModal = async () => {
    if (!selectedClient) return;

    // AUDITORÍA INTERNA DE CAMPOS COMPLETADOS (Se audita onboarding, identificación y credenciales críticas)
    const criticalFields = [
      { key: 'username', label: 'ID Usuario IPTV' },
      { key: 'password', label: 'Contraseña' },
      { key: 'url_panel_asignada', label: 'Servidor DNS URL' },
      { key: 'nombre_completo', label: 'Nombre Completo' },
      { key: 'celular', label: 'Celular' },
      { key: 'direccion_actual', label: 'Dirección o Dpto' },
      { key: 'fecha_vencimiento', label: 'Fecha Vencimiento' },
      { key: 'limite_pantallas', label: 'Límite Pantallas' }
    ];

    const auditReport = criticalFields.map(field => {
      const value = (selectedClient as any)[field.key];
      const isCompleted = value !== undefined && value !== null && String(value).trim() !== '';
      return {
        Campo: field.label,
        Clave: field.key,
        Estado: isCompleted ? '✅ Completado' : '❌ Vacío',
        ValorActual: value ? String(value) : 'Ninguno'
      };
    });

    const completedCount = auditReport.filter(f => f.Estado.includes('Completado')).length;
    console.group(`%c [AUDITORÍA DE AVANCE CLIENTE: ${selectedClient.username}] `, 'background: #0f172a; color: #f8fafc; padding: 4px; border-radius: 4px;');
    console.log(`Progreso de completitud: ${completedCount} de ${criticalFields.length} campos principales de perfil.`);
    console.table(auditReport);
    console.groupEnd();

    // Guardar el estado actual del cliente modificado antes de cerrar
    const res = await apiService.saveIptvAccount(selectedClient);
    if (res.success) {
      toast.success("Su avance se guardó como borrador por tiempo limitado...");
      await fetchData();
    }
    setSelectedClient(null);
  };

  const handleAddChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newChatMsg.trim()) return;

    const chatHist = (selectedClient as any).chat_soporte || [];
    const updatedChat = [
      ...chatHist,
      {
        sender: newChatSender,
        text: newChatMsg.trim(),
        date: new Date().toISOString()
      }
    ];

    const updatedClient = {
      ...selectedClient,
      chat_soporte: updatedChat
    };

    setSelectedClient(updatedClient);
    // Persistencia inmediata
    await apiService.saveIptvAccount(updatedClient);
    setNewChatMsg('');
    const list = accounts.map(a => a.username === updatedClient.username ? updatedClient : a);
    setAccounts(list);
    toast.success('Respuesta de soporte agregada a la bitácora chat');
  };

  const handleAddComenBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newComenBitacora.trim()) return;

    const bitacora = (selectedClient as any).bitacora_comentarios || [];
    const updatedBit = [
      ...bitacora,
      {
        text: newComenBitacora.trim(),
        date: new Date().toISOString(),
        es_problematico: newComenEsProblematico
      }
    ];

    // Si se asienta un comentario problemático, el comentario corto de la cuenta se puede actualizar por alerta
    const updatedClient = {
      ...selectedClient,
      bitacora_comentarios: updatedBit,
      comentarios: newComenEsProblematico 
        ? `⚠️ PROBLEMATICO: ${newComenBitacora.substring(0, 50)}...` 
        : newComenBitacora.substring(0, 80)
    };

    setSelectedClient(updatedClient);
    await apiService.saveIptvAccount(updatedClient);
    setNewComenBitacora('');
    setNewComenEsProblematico(false);
    const list = accounts.map(a => a.username === updatedClient.username ? updatedClient : a);
    setAccounts(list);
    toast.success('Comentario asentado de forma permanente en la bitácora histórica');
  };

  const togglePasswordVisibility = (user: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVisiblePasswords(prev => ({ ...prev, [user]: !prev[user] }));
  };

  // --- CONTROLADORES DE FLUJOS CLIENTES Y DEMOS ---
  const handleStartFullAccountRegistration = () => {
    setShowClientCreatorTypeSelector(false);
    setIsEditingAccount(false);
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() + 1);
    setAccountForm({
      username: '',
      password: '',
      url_panel_asignada: 'http://vip-xtv.pro:8080',
      estado: 'Activo',
      limite_pantallas: 2,
      fecha_vencimiento: limitDate.toISOString().substring(0, 10),
      comentarios: '',
      id_plan_proveedor: providerPlans[0]?.id || '',
      id_plan_venta: salePlans[0]?.id || '',
      sociedad_id: 'soc-central'
    });
    setShowFormModal(true);
  };

  const handleStartDemoAccountRegistration = () => {
    setShowClientCreatorTypeSelector(false);
    setDemoStep(1);
    setDemoCustomUsernamePrefix('');
    
    // Seleccionar por defecto el primer plan de demo real de la API si existe, sino simular
    const apiDemoPlanes = providerPlans.filter(p => !p.archived && (p.tokens === 0 || p.name.toLowerCase().includes("demo") || p.name.toLowerCase().includes("trial") || p.name.toLowerCase().includes("prueba") || p.name.toLowerCase().includes("test")));
    if (apiDemoPlanes.length > 0) {
      setDemoPackage(apiDemoPlanes[0].id);
    } else {
      setDemoPackage('pkg-1h');
    }
    setDemoContactEmail('');
    setDemoResellerNotes('');
    setSelectedChannels([...AVAILABLE_CHANNELS]);
    setSelectedMovies([...AVAILABLE_MOVIES]);
    setSelectedSeries([...AVAILABLE_SERIES]);
    setDemoCreatedResult(null);
    setShowDemoAccountModal(true);
  };

  const handleCreateDemoAccountSubmit = async () => {
    if (isSavingIptv) return;
    setIsSavingIptv(true);
    let finalPrefix = demoCustomUsernamePrefix.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!finalPrefix) {
        const randNum = Math.floor(10000 + Math.random() * 90000); // d-e-m-o (4) + 5 dígitos = 9 caracteres
        finalPrefix = `demo${randNum}`;
      } else if (finalPrefix.length < 8) {
        toast.error('La cantidad mínima de caracteres para el usuario de demo es de 8.');
        setIsSavingIptv(false);
        return;
      }
      let finalUsername = finalPrefix;

      const exists = accounts.some(a => a.username.toLowerCase() === finalUsername);
      if (exists) {
        toast.error('El usuario de demo generado ya existe en la base de datos. Elige otro por favor.');
        setIsSavingIptv(false);
        return;
      }

    const letters = 'abcdefghijkmnpqrstuvwxyz123456789';
    let randPass = '';
    for (let i = 0; i < 6; i++) {
      randPass += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    let finalPassword = `pass_${randPass}`;

    let pkgDetails = { label: 'Demo', durationHours: 1, cost: 0, screens: 1 };
    const matchedPlan = providerPlans.find(p => p.id === demoPackage);
    if (matchedPlan) {
      let hours = 24;
      const nameLower = matchedPlan.name.toLowerCase();
      if (nameLower.includes("3h") || nameLower.includes("3 hora") || nameLower.includes("3 hours")) hours = 3;
      else if (nameLower.includes("6h") || nameLower.includes("6 hora") || nameLower.includes("6 hours")) hours = 6;
      else if (nameLower.includes("1h") || nameLower.includes("1 hora") || nameLower.includes("1 hours")) hours = 1;
      else if (nameLower.includes("4h") || nameLower.includes("4 hora") || nameLower.includes("4 hours")) hours = 4;
      else if (nameLower.includes("2h") || nameLower.includes("2 hora") || nameLower.includes("2 hours")) hours = 2;
      else if (nameLower.includes("12h") || nameLower.includes("12 hora") || nameLower.includes("12 hours")) hours = 12;

      pkgDetails = {
        label: matchedPlan.name,
        durationHours: hours,
        cost: matchedPlan.tokens || 0,
        screens: matchedPlan.screens || 1
      };
    } else {
      pkgDetails = {
        'pkg-1h': { label: 'Demo 1 Hora', durationHours: 1, cost: 0, screens: 1 },
        'pkg-3h': { label: 'Demo 3 Horas', durationHours: 3, cost: 0, screens: 1 },
        'pkg-6h': { label: 'Demo 6 Horas', durationHours: 6, cost: 0, screens: 1 },
        'pkg-4h-3p': { label: 'Demo 4 Horas', durationHours: 4, cost: 0, screens: 3 }
      }[demoPackage] || { label: 'Demo 1 Hora', durationHours: 1, cost: 0, screens: 1 };
    }

    const expirationDate = new Date(Date.now() + pkgDetails.durationHours * 60 * 60 * 1000);

    const selectedChanCount = selectedChannels.length;
    const selectedMovCount = selectedMovies.length;
    const selectedSerCount = selectedSeries.length;
    
    let comments = `[Línea Trial / Demo] Paquete: ${pkgDetails.label}. `;
    if (demoContactEmail.trim()) comments += `Contacto: ${demoContactEmail.trim()}. `;
    if (demoResellerNotes.trim()) comments += `Notas Reseller: ${demoResellerNotes.trim()}. `;
    comments += `Listas habilitadas: Canales (${selectedChanCount}/${AVAILABLE_CHANNELS.length}), Películas (${selectedMovCount}/${AVAILABLE_MOVIES.length}), Series (${selectedSerCount}/${AVAILABLE_SERIES.length}).`;

    let host = 'http://vip-xtv.pro:8080';
    let port = '8080';
    let m3u_url = `http://vip-xtv.pro:8080/get.php?username=${finalUsername}&password=${finalPassword}&output=ts`;
    let isRealCreation = false;
    let apiSincronizado = false;
    let apiErrorRegistro = (xuiConfig.xui_url && xuiConfig.xui_token) ? "" : "No configurado en Ajustes XTV";

    // --- PASO 1: VERIFICACIÓN TÉCNICA DE CRÉDITOS ---
    if (!xuiConfig.xui_url || !xuiConfig.xui_token) {
      toast.error("❌ No tienes un panel XUI enlazado en Ajustes. Configura el panel antes de crear demos rápidas.");
      setIsSavingIptv(false);
      return;
    }

    toast.loading("Paso 1: Verificando conexión técnica y créditos con el servidor XUI...");
    try {
      const resTest = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: xuiConfig.xui_url,
          xuiToken: xuiConfig.xui_token,
          xuiAccessCode: xuiConfig.xui_access_code,
        })
      });
      const testData = await resTest.json();
      toast.dismiss();

      if (!testData || !testData.success) {
        const errDetail = testData?.error || "El panel XUI no responde.";
        toast.error(`❌ Paso 1 Falló (Conexión técnica): El servidor XUI no responde o las credenciales son inválidas. Detalle: ${errDetail}`);
        setIsSavingIptv(false);
        return;
      }

      // Validar créditos devueltos por el panel
      const xcCredits = Number(testData.credits ?? testData.profile?.credits ?? testData.data?.credits ?? 999);
      if (xcCredits < 1) {
        toast.error(`❌ Paso 1 Falló: Créditos insuficientes en tu panel físico XC (Disponibles: ${xcCredits}). Se requiere al menos 1 crédito reseller.`);
        setIsSavingIptv(false);
        return;
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`❌ Paso 1 Falló (Error de conexión): No se pudo conectar con el servidor XUI. ${err.message || String(err)}`);
      setIsSavingIptv(false);
      return;
    }

    const payload: IptvAccount = {
      username: finalUsername,
      password: finalPassword,
      url_panel_asignada: host,
      estado: 'Pendiente_Activacion',
      limite_pantallas: pkgDetails.screens,
      fecha_vencimiento: expirationDate.toISOString(),
      comentarios: comments,
      fecha_creacion: new Date().toISOString(),
      id_plan_proveedor: matchedPlan?.id || providerPlans[0]?.id || '',
      id_plan_venta: salePlans[0]?.id || '',
      api_sincronizado: false,
      api_error_registro: "Pendiente de alta física en panel"
    };

    // --- PASO 2: GUARDAR EN LA BASE DE DATOS LOCAL ---
    toast.loading("Paso 2: Guardando información de la Demo en la Base de Datos local...");
    const resDb = await apiService.saveIptvAccount(payload);
    toast.dismiss();

    if (!resDb.success) {
      toast.error(`❌ Paso 2 Falló (Error Base de Datos): No se pudieron guardar los datos en Supabase (${resDb.error || "Error desconocido"}). Se detiene la operación para evitar inconsistencias.`);
      setIsSavingIptv(false);
      return;
    }

    // --- PASO 3: ALTA FÍSICA EN EL PANEL XC ---
    toast.loading("Paso 3: Creando y activando la Demo físicamente en el panel XUI...");
    try {
      const demoPayload: any = {
        action: "create_line",
        xuiUrl: xuiConfig.xui_url,
        xuiToken: xuiConfig.xui_token,
        xuiAccessCode: xuiConfig.xui_access_code,
        package: Number(matchedPlan ? (matchedPlan.provider_plan_id || matchedPlan.id) : (
          demoPackage === 'pkg-3h' ? "2" :
          demoPackage === 'pkg-6h' ? "28" :
          demoPackage === 'pkg-4h-3p' ? "77" :
          (xuiConfig.xui_package_id || "1")
        )),
        trial: 1,
      };

      // Inyección automática y oculta del Custom Pack (Plantilla)
      const apiSets = xuiConfig?.api_settings || {};
      const activeType = apiSets.xtv_playlist_active_type || 'limit';
      const playlistId = activeType === 'full' ? apiSets.xtv_playlist_full_id : apiSets.xtv_playlist_limit_id;
      if (playlistId && !isNaN(Number(playlistId))) {
        demoPayload.custom_playlist_id = Number(playlistId);
      }
      const formattedNotes = `[xtv] ${demoContactEmail.trim() || "Demo APK"} - ${matchedPlan?.package_name || matchedPlan?.name || "Demo"} - ${user?.usuario_nombre || user?.email || "Admin"} - ${user?.usuario_nombre || user?.email || "Admin"}`;
      if (formattedNotes.trim()) demoPayload.reseller_notes = formattedNotes.trim();
      const screensCount = Number(matchedPlan?.screens_api || matchedPlan?.screens || 1);
      if (screensCount > 1) {
        demoPayload.max_connections = screensCount;
      }

      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoPayload)
      });
      const xuiData = await resXui.json();
      toast.dismiss();

      if (xuiData.success) {
        isRealCreation = true;
        apiSincronizado = true;
        apiErrorRegistro = "";
        
        const realUsername = xuiData.username || xuiData.data?.username || finalUsername;
        const realPassword = xuiData.password || xuiData.data?.password || finalPassword;

        let cleanUrl = xuiConfig.xui_url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          cleanUrl = "http://" + cleanUrl;
        }
        if (cleanUrl.endsWith("/")) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
        host = cleanUrl;
        
        try {
          const urlObj = new URL(cleanUrl);
          port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
        } catch(e) {
          port = "8080";
        }
        
        m3u_url = xuiData.playlist_url || `${cleanUrl}/get.php?username=${realUsername}&password=${realPassword}&output=ts`;

        // Si el username real cambió, eliminamos el provisorio anterior
        if (realUsername !== finalUsername) {
          await apiService.deleteIptvAccount(finalUsername);
        }

        const apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || "");
        const apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
        const apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
        const apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || xuiData.data?.playlist_url || "");
        const apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
        const apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
        const apiRawResponse = xuiData.raw_response || xuiData;

        const updatedPayload: IptvAccount = {
          ...payload,
          username: realUsername,
          password: realPassword,
          url_panel_asignada: host,
          estado: 'Activo',
          comentarios: comments + " [Creada en XUI de forma física]",
          api_sincronizado: true,
          api_error_registro: "",
          panel_client_id: apiId || null,
          member_id: apiMemberId || null,
          access_token: apiAccessToken || null,
          playlist_url: apiPlaylistUrl || null,
          bouquet: apiBouquet || null,
          package_id: apiPackageId || null,
          raw_response_json: apiRawResponse || null
        };

        const resUpdate = await apiService.saveIptvAccount(updatedPayload);
        if (resUpdate.success) {
          toast.success("¡Cuenta demo real creada con éxito en el panel XUI y guardada en Base de Datos!");
          
          setDemoCreatedResult({
            username: realUsername,
            password: realPassword,
            host: host,
            port: port,
            m3u_url: m3u_url,
            screens: pkgDetails.screens,
            expiration: expirationDate.toISOString(),
            panel_client_id: apiId || null
          });

          await fetchData();
        } else {
          toast.error("⚠️ Advertencia: La Demo física fue creada pero falló la actualización del registro local en Supabase.");
        }
      } else {
        const errorMsg = xuiData.error || "Fallo de rechazo de la API de XUI";
        const failedPayload: IptvAccount = {
          ...payload,
          estado: 'Fallo_Activacion',
          api_sincronizado: false,
          api_error_registro: errorMsg
        };
        await apiService.saveIptvAccount(failedPayload);
        toast.error(`❌ El panel XUI rechazó el alta física de la Demo: ${errorMsg}. El registro se guardó localmente.`);
      }
    } catch (err: any) {
      toast.dismiss();
      const errorMsg = err.message || String(err);
      const failedPayload: IptvAccount = {
        ...payload,
        estado: 'Fallo_Activacion',
        api_sincronizado: false,
        api_error_registro: errorMsg
      };
      await apiService.saveIptvAccount(failedPayload);
      toast.error(`❌ Error de red llamando al panel XUI: ${errorMsg}. El registro de base de datos se conservará localmente para sincronización.`);
    } finally {
      setIsSavingIptv(false);
    }
  };

  const handleOpenCredentialsModal = (acc: IptvAccount) => {
    setIsSavingIptv(false);

    let host = acc.url_panel_asignada || 'http://vip-xtv.pro:8080';
    let cleanUrl = host.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "http://" + cleanUrl;
    }
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    let computedPort = "8080";
    try {
      const urlObj = new URL(cleanUrl);
      computedPort = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
    } catch {
      computedPort = "8080";
    }

    const isDemo = acc.comentarios?.toLowerCase().includes("trial") || 
                   acc.comentarios?.toLowerCase().includes("demo") || 
                   acc.username.toLowerCase().includes("demo") ||
                   (acc.fecha_vencimiento ? (new Date(acc.fecha_vencimiento).getTime() - new Date(acc.fecha_creacion || "").getTime() < 24 * 60 * 60 * 1000) : false);

    setDemoCreatedResult({
      username: acc.username,
      password: acc.password,
      host: cleanUrl,
      port: computedPort,
      m3u_url: `${cleanUrl}/get.php?username=${acc.username}&password=${acc.password}&output=ts`,
      screens: acc.limite_pantallas || 1,
      expiration: acc.fecha_vencimiento || new Date().toISOString(),
      is_demo: isDemo,
      nombre_completo: acc.nombre_completo || 'Cliente IPTV',
      celular: acc.celular || '',
      direccion_actual: acc.direccion_actual || '',
      id_plan_venta: acc.id_plan_venta || ''
    });
    
    setShowFormModal(true);
  };

  // Guardado de Cuentas (Clientes)
  const handleOpenAccountModal = (acc?: IptvAccount) => {
    // Reset demoCreatedResult so the credentials view starts closed
    setDemoCreatedResult(null);

    if (acc) {
      setIsEditingAccount(true);
      const nameParts = (acc.nombre_completo || '').trim().split(/\s+/);
      const initialNombre = nameParts[0] || '';
      const initialApellido = nameParts.slice(1).join(' ') || '';

      setAccountForm({
        username: acc.username,
        password: acc.password,
        url_panel_asignada: acc.url_panel_asignada || 'http://vip-xtv.pro:8080',
        estado: acc.estado || 'Activo',
        limite_pantallas: acc.limite_pantallas || 2,
        limite_pantallas_api: (acc as any).limite_pantallas_api || acc.limite_pantallas || 3,
        fecha_vencimiento: acc.fecha_vencimiento ? acc.fecha_vencimiento.substring(0, 10) : '',
        comentarios: acc.comentarios || '',
        id_plan_proveedor: acc.id_plan_proveedor || '',
        id_plan_venta: acc.id_plan_venta || '',
        sociedad_id: 'soc-central',
        nombre_completo: acc.nombre_completo || '',
        nombre: initialNombre,
        apellido: initialApellido,
        direccion_actual: acc.direccion_actual || '',
        celular: acc.celular || '',
        is_demo: acc.username?.toLowerCase().includes('demo') || acc.username?.toLowerCase().endsWith('@xtv.net') || false,
        demo_package: 'pkg-1h',
        temp_note: '',
        bitacora_comentarios: acc.bitacora_comentarios || []
      });
      setShowFormModal(true);
    } else {
      setIsEditingAccount(false);
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() + 1);

      // Auto-generación de contraseña inicial segura consistente únicamente de 8 dígitos numéricos
      let numericPass = '';
      for (let i = 0; i < 8; i++) {
        numericPass += Math.floor(Math.random() * 10).toString();
      }

      setAccountForm({
        username: '',
        password: numericPass,
        url_panel_asignada: 'http://vip-xtv.pro:8585',
        estado: 'Activo',
        limite_pantallas: 1,
        limite_pantallas_api: 3,
        fecha_vencimiento: limitDate.toISOString().substring(0, 10),
        comentarios: '',
        id_plan_proveedor: providerPlans[0]?.id || '',
        id_plan_venta: salePlans[0]?.id || '',
        sociedad_id: 'soc-central',
        nombre_completo: '',
        nombre: '',
        apellido: '',
        direccion_actual: '',
        celular: '',
        is_demo: true, // Por defecto se inicia con pestaña Demo activa para facilitar pruebas rápidas
        demo_package: 'pkg-1h',
        temp_note: '',
        bitacora_comentarios: []
      });
      setShowFormModal(true);
    }
  };

  const handleFillWithRandomData = () => {
    const firstNames = ["Santiago", "Facundo", "Lucas", "Mateo", "Valentín", "Bautista", "Joaquín", "Sandro", "Marcos", "Hugo", "María Belén", "Sofía", "Martina", "Milagros", "Camila", "Lucía", "Catalina", "Paula"];
    const lastNames = ["López", "Gómez", "Martínez", "Rodríguez", "González", "Fernández", "Díaz", "Álvarez", "Peralta", "Pereyra", "Sánchez", "Romero", "Rojas", "Giménez", "Ruiz", "Silva", "Suárez", "Herrera"];
    const streets = [
      "Av. Corrientes 1450, CABA",
      "Av. Cabildo 2200, Belgrano, CABA",
      "Calle Florida 320, San Nicolás, CABA",
      "Av. Santa Fe 3250, Palermo, CABA",
      "Av. Rivadavia 5120, Caballito, CABA",
      "Alvear 840, San Isidro",
      "Calle 12 Nro 550, La Plata",
      "Mitre 720, Avellaneda",
      "Belgrano 1200, Ramos Mejía",
      "San Martín 450, Morón"
    ];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randomFirstName} ${randomLastName}`;

    const randomPhoneNum = Math.floor(1100000000 + Math.random() * 900000000); // 11XXXXXXXX
    const activePhone = `+54 ${randomPhoneNum}`;

    const randomStreet = streets[Math.floor(Math.random() * streets.length)];

    // Generar un usuario Xtream Codes / XUI.ONE válido (entre 8 y 12 caracteres, todo en minúsculas)
    const baseNamesForUser = ["demo", "client", "play", "vip", "mivip", "tvbox", "smart", "tivi", "flow", "iptv"];
    const chosenBase = baseNamesForUser[Math.floor(Math.random() * baseNamesForUser.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 90000);
    const generatedUser = `${chosenBase}${randomDigits}`;

    // Generar una contraseña numérica única de 8 dígitos de forma aleatoria
    let generatedPass = "";
    for (let i = 0; i < 8; i++) {
      generatedPass += Math.floor(Math.random() * 10).toString();
    }

    setAccountForm(prev => ({
      ...prev,
      nombre_completo: fullName,
      nombre: randomFirstName,
      apellido: randomLastName,
      celular: activePhone,
      direccion_actual: randomStreet,
      username: generatedUser,
      password: generatedPass,
      url_panel_asignada: prev.url_panel_asignada || 'http://vip-xtv.pro:8080'
    }));

    toast.success("¡Campos completados automáticamente con datos reales de prueba!");
  };

  const handlePreSaveValidation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Unir nombre y apellido para persistencia universal antes de validar
    const mergedName = `${accountForm.nombre.trim()} ${accountForm.apellido.trim()}`.trim();
    accountForm.nombre_completo = mergedName;

    const missing: string[] = [];
    if (!accountForm.nombre.trim()) {
      missing.push("Información de Contacto: Nombre");
    }
    if (!accountForm.apellido.trim()) {
      missing.push("Información de Contacto: Apellido");
    }
    if (!accountForm.celular.trim()) {
      missing.push("Información de Contacto: Teléfono de Contacto");
    }
    if (!accountForm.direccion_actual.trim()) {
      missing.push("Información de Contacto: Geolocalización / Dirección Física");
    }

    if (isEditingAccount) {
      if (missing.length > 0) {
        setValidationMissingFields(missing);
        setShowValidationModal(true);
        return;
      }
      setShowConfirmSaveModal(true);
      return;
    }

    if (!accountForm.is_demo) {
      if (!accountForm.id_plan_venta) {
        missing.push("Selección de Plan Comercial: Plan Comercial Minorista");
      } else {
        // Validación activa en tiempo real de límites de la API del Proveedor
        const selPlan = salePlans.find(plan => plan.id === accountForm.id_plan_venta);
        const originalPkg = selPlan?.provider_plan_id ? providerPlans.find(p => String(p.id) === String(selPlan.provider_plan_id)) : null;
        if (originalPkg) {
          const realMaxConnections = Number(originalPkg.multiple_connections != null ? originalPkg.multiple_connections : (originalPkg.max_connections || originalPkg.screens || 1));
          const requestedConnections = Number(accountForm.limite_pantallas_api || 3);
          if (requestedConnections > realMaxConnections) {
            missing.push(`⚠️ ¡BLOQUEO DE API DEL PROVEEDOR! El proveedor recortó el límite máximo de conexiones a ${realMaxConnections} pantallas para el paquete mayorista "${originalPkg.name}". Sin embargo, tu plan minorista "${selPlan?.name}" intenta registrar ${requestedConnections} conexiones. DEBES CONTACTAR A TU PROVEEDOR para reclamarle la modificación de su plan, ya que no te permite cambiar el plan a uno con más pantallas de las reales.`);
          }
        }
      }
    }

    // No validamos ni generamos localmente usuario/contraseña, ya que el panel XC los generará de forma nativa.
    if (missing.length > 0) {
      setValidationMissingFields(missing);
      setShowValidationModal(true);
      return;
    }

    // Si todo completado, abrir diálogo de confirmación de resumen compacto
    setShowConfirmSaveModal(true);
  };

  const confirmAndSaveAccount = async () => {
    if (isSavingIptv) return;
    setIsSavingIptv(true);
    setShowConfirmSaveModal(false);
    
    try {
      const mergedName = `${accountForm.nombre.trim()} ${accountForm.apellido.trim()}`.trim();
      accountForm.nombre_completo = mergedName;
      
      if (isEditingAccount) {
        const originalAccount = accounts.find(a => a.username === accountForm.username);
        const payload: IptvAccount = {
          username: accountForm.username.toLowerCase(),
          password: accountForm.password,
          url_panel_asignada: accountForm.url_panel_asignada || 'http://vip-xtv.pro:8080',
          estado: accountForm.estado,
          limite_pantallas: Number(accountForm.limite_pantallas || 1),
          limite_pantallas_api: Number(accountForm.limite_pantallas_api || 3),
          fecha_vencimiento: accountForm.fecha_vencimiento ? new Date(accountForm.fecha_vencimiento).toISOString() : null,
          comentarios: accountForm.comentarios.trim(),
          fecha_creacion: originalAccount?.fecha_creacion || new Date().toISOString(),
          id_plan_proveedor: accountForm.id_plan_proveedor,
          id_plan_venta: accountForm.id_plan_venta,
          nombre_completo: mergedName,
          direccion_actual: accountForm.direccion_actual.trim(),
          celular: accountForm.celular.trim(),
          bitacora_comentarios: accountForm.bitacora_comentarios,
          api_sincronizado: originalAccount?.api_sincronizado ?? true,
          api_error_registro: originalAccount?.api_error_registro
        };

        const res = await apiService.saveIptvAccount(payload);
        if (res.success) {
          toast.success('Información del cliente actualizada con éxito');
          setAccounts(prev => prev.map(a => a.username === payload.username ? payload : a));
          setShowFormModal(false);
        } else {
          toast.error(res.error || 'Ocurrió un error al actualizar el cliente');
        }
        setIsSavingIptv(false);
        return;
      }
      
      let targetUsername = accountForm.username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Validar y normalizar el USER para demos
    if (accountForm.is_demo) {
      if (!targetUsername) {
        let rawPrefix = '';
        if (accountForm.nombre_completo.trim()) {
          rawPrefix = accountForm.nombre_completo.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
        }
        if (rawPrefix) {
          while (rawPrefix.length < 8) {
            rawPrefix += Math.floor(Math.random() * 10).toString();
          }
        } else {
          const randNum = Math.floor(10000 + Math.random() * 90000); // 5 digitos + 4 chars "demo" = 9 chars
          rawPrefix = `demo${randNum}`;
        }
        targetUsername = rawPrefix;
      }
    } else {
      if (!targetUsername) {
        let rawPrefix = '';
        if (accountForm.nombre_completo.trim()) {
          rawPrefix = accountForm.nombre_completo.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
        }
        if (rawPrefix) {
          while (rawPrefix.length < 8) {
            rawPrefix += Math.floor(Math.random() * 10).toString();
          }
        } else {
          const randNum = Math.floor(10000 + Math.random() * 90000); // 5 digitos + 6 chars "client" = 11 chars
          rawPrefix = `client${randNum}`;
        }
        targetUsername = rawPrefix;
      }
    }

    // Por redundancia de seguridad final: heredar y asegurar minimo de 8
    while (targetUsername.length < 8) {
      targetUsername += Math.floor(Math.random() * 10).toString();
    }

    let host = accountForm.url_panel_asignada.trim();
    let port = '8080';
    let isRealCreation = false;
    let finalExpiration: string | null = null;
    let finalScreens = Number(accountForm.limite_pantallas);
    
    // Obtener el plan de venta seleccionado previamente para calcular las conexiones óptimas permitidas por crédito
    const selectedSalePlanPre = salePlans.find(plan => plan.id === accountForm.id_plan_venta);
    let finalScreensApi = accountForm.is_demo 
      ? 1 
      : calculateOptimalApiScreens(selectedSalePlanPre, Number(accountForm.limite_pantallas_api || 3));
    
    let generatedPassword = "";
    let apiSincronizado = false;
    let apiErrorRegistro = (xuiConfig.xui_url && xuiConfig.xui_token) ? "" : "No configurado en Ajustes XTV";

    // --- PASO 1: VERIFICACIÓN TÉCNICA DE CRÉDITOS ---
    if (!xuiConfig.xui_url || !xuiConfig.xui_token) {
      toast.error("❌ No tienes un panel XUI enlazado en Ajustes. Configura el panel antes de crear cuentas.");
      setIsSavingIptv(false);
      return;
    }

    toast.loading("Paso 1: Verificando conexión técnica y créditos con el servidor XUI...");
    try {
      const resTest = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: xuiConfig.xui_url,
          xuiToken: xuiConfig.xui_token,
          xuiAccessCode: xuiConfig.xui_access_code,
        })
      });
      const testData = await resTest.json();
      toast.dismiss();

      if (!testData || !testData.success) {
        const errDetail = testData?.error || "El panel XUI no responde.";
        toast.error(`❌ Paso 1 Falló (Conexión técnica): El servidor XUI no responde o las credenciales son inválidas. Detalle: ${errDetail}`);
        setIsSavingIptv(false);
        return;
      }

      // Validar créditos devueltos por el panel
      const xcCredits = Number(testData.credits ?? testData.profile?.credits ?? testData.data?.credits ?? 999);
      if (xcCredits < 1) {
        toast.error(`❌ Paso 1 Falló: Créditos insuficientes en tu panel físico XC (Disponibles: ${xcCredits}). Se requiere al menos 1 crédito reseller.`);
        setIsSavingIptv(false);
        return;
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`❌ Paso 1 Falló (Error de conexión): No se pudo conectar con el servidor XUI. ${err.message || String(err)}`);
      setIsSavingIptv(false);
      return;
    }

    // Calcular expiración previa para poder guardarlo localmente primero
    if (accountForm.is_demo) {
      const pkgDetails = {
        'pkg-1h': { label: 'Demo 1 Hora', durationHours: 1, screens: 1 },
        'pkg-3h': { label: 'Demo 3 Horas', durationHours: 3, screens: 1 },
        'pkg-6h': { label: 'Demo 6 Horas', durationHours: 6, screens: 1 },
        'pkg-4h-3p': { label: 'Demo 4 Horas', durationHours: 4, screens: 3 }
      }[accountForm.demo_package] || { label: 'Demo 1 Hora', durationHours: 1, screens: 1 };

      finalScreens = pkgDetails.screens;
      const expirationDate = new Date(Date.now() + pkgDetails.durationHours * 60 * 60 * 1000);
      finalExpiration = expirationDate.toISOString();
    } else {
      finalExpiration = accountForm.fecha_vencimiento ? new Date(accountForm.fecha_vencimiento).toISOString() : null;
    }

    // Comentarios informativos automáticos
    let listInfo = '';
    if (accountForm.is_demo) {
      listInfo = ` [Línea Trial / Demo] Paquete: ${accountForm.demo_package === 'pkg-1h' ? '1 Hora' : accountForm.demo_package === 'pkg-3h' ? '3 Horas' : accountForm.demo_package === 'pkg-6h' ? '6 Horas' : '4 Horas (3p)'}.`;
    }

    // Contraseña provisoria segura de 8 dígitos para el guardado previo
    let numPass = "";
    for (let i = 0; i < 8; i++) {
      numPass += Math.floor(Math.random() * 10).toString();
    }
    generatedPassword = numPass;

    const payload: IptvAccount = {
      username: targetUsername.toLowerCase(),
      password: generatedPassword,
      url_panel_asignada: host,
      estado: 'Pendiente_Activacion',
      limite_pantallas: finalScreens,
      limite_pantallas_api: finalScreensApi,
      fecha_vencimiento: finalExpiration,
      comentarios: (accountForm.comentarios.trim() + listInfo).trim(),
      fecha_creacion: new Date().toISOString(),
      id_plan_proveedor: accountForm.id_plan_proveedor,
      id_plan_venta: accountForm.is_demo ? '' : accountForm.id_plan_venta,
      nombre_completo: accountForm.nombre_completo.trim(),
      direccion_actual: accountForm.direccion_actual.trim(),
      celular: accountForm.celular.trim(),
      bitacora_comentarios: accountForm.bitacora_comentarios,
      api_sincronizado: false,
      api_error_registro: "Pendiente de alta física en panel"
    };

    // --- PASO 2: GUARDAR EN LA BASE DE DATOS LOCAL ---
    toast.loading("Paso 2: Guardando información del cliente en la Base de Datos local...");
    const resDb = await apiService.saveIptvAccount(payload);
    toast.dismiss();

    if (!resDb.success) {
      toast.error(`❌ Paso 2 Falló (Error Base de Datos): No se pudieron guardar los datos en Supabase (${resDb.error || "Error desconocido"}). Se detiene la operación para evitar inconsistencias.`);
      setIsSavingIptv(false);
      return;
    }

    // 🚀 OBTENER EL ID ENLAZADO REAL DEL PROVEEDOR PARA EL PAQUETE (Ej: "1", "2")
    const selectedSalePlan = salePlans.find(plan => plan.id === accountForm.id_plan_venta);
    const mappedPackageId = accountForm.is_demo 
      ? (accountForm.id_plan_proveedor || "1") 
      : (selectedSalePlan?.provider_plan_id || accountForm.id_plan_venta || "1");

    // --- PASO 3: ALTA FÍSICA EN EL PANEL XC ---
    toast.loading("Paso 3: Creando y activando la línea físicamente en el panel XUI...");
    try {
      const accountPayload: any = {
        action: "create_line",
        xuiUrl: xuiConfig.xui_url || "http://vip-xtv.pro:8080",
        xuiToken: xuiConfig.xui_token || "fake-token",
        xuiAccessCode: xuiConfig.xui_access_code,
        package: Number(mappedPackageId || "1"),
        trial: accountForm.is_demo ? 1 : 0,
      };

      // Inyección automática y oculta del Custom Pack (Plantilla)
      const apiSets = xuiConfig?.api_settings || {};
      const activeType = apiSets.xtv_playlist_active_type || 'limit';
      const playlistId = activeType === 'full' ? apiSets.xtv_playlist_full_id : apiSets.xtv_playlist_limit_id;
      if (playlistId && !isNaN(Number(playlistId))) {
        accountPayload.custom_playlist_id = Number(playlistId);
      }
      const formattedNotes = `[xtv] ${accountForm.nombre_completo.trim() || "Cliente"} - ${selectedSalePlan?.name || "Plan"} - ${user?.usuario_nombre || user?.email || "Admin"} - ${user?.usuario_nombre || user?.email || "Admin"}`;
      if (formattedNotes.trim()) accountPayload.reseller_notes = formattedNotes.trim();
      if (finalScreensApi > 1) {
        accountPayload.max_connections = finalScreensApi;
      }

      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountPayload)
      });

      const xuiData = await resXui.json();
      toast.dismiss();

      if (xuiData.success) {
        isRealCreation = !xuiData.isSimulated;
        apiSincronizado = true;
        apiErrorRegistro = "";
        
        // El panel XC nos devuelve las credenciales generadas de forma nativa
        const realUsername = (xuiData.username || xuiData.data?.username || targetUsername).toLowerCase();
        const realPassword = xuiData.password || xuiData.data?.password || generatedPassword;
        
        let cleanUrl = (xuiConfig.xui_url || "http://vip-xtv.pro:8080").trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          cleanUrl = "http://" + cleanUrl;
        }
        if (cleanUrl.endsWith("/")) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
        host = cleanUrl;
        try {
          const urlObj = new URL(cleanUrl);
          port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
        } catch {
          port = "8080";
        }

        let m3u_url = `${host}/get.php?username=${realUsername}&password=${realPassword}&output=ts`;

        // Si el panel de control XC le asignó un username diferente, borramos el temporal
        if (realUsername !== targetUsername.toLowerCase()) {
          await apiService.deleteIptvAccount(targetUsername.toLowerCase());
        }

        const apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || "");
        const apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
        const apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
        const apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
        const apiRawResponse = xuiData.raw_response || xuiData;

        const apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
        const apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || xuiData.data?.playlist_url || "");

        const updatedPayload: IptvAccount = {
          ...payload,
          username: realUsername,
          password: realPassword,
          url_panel_asignada: host,
          estado: accountForm.estado,
          comentarios: (accountForm.comentarios.trim() + listInfo + (isRealCreation ? " [Creada físicamente en XUI]" : "")).trim(),
          api_sincronizado: true,
          api_error_registro: "",
          panel_client_id: apiId || null,
          member_id: apiMemberId || null,
          access_token: apiAccessToken || null,
          playlist_url: apiPlaylistUrl || null,
          bouquet: apiBouquet || null,
          package_id: apiPackageId || null,
          raw_response_json: apiRawResponse || null
        };

        const resUpdate = await apiService.saveIptvAccount(updatedPayload);
        if (resUpdate.success) {
          toast.success('¡Línea IPTV registrada, persistida en Base de Datos y activada físicamente en el panel XUI!');
          
          if (!isEditingAccount) {
            const next = xuiApiUsersCount + 1;
            setXuiApiUsersCount(next);
            localStorage.setItem('xui_api_users_count', String(next));
          }

          const expirationDateVal = finalExpiration ? new Date(finalExpiration) : new Date();
          setDemoCreatedResult({
            username: realUsername,
            password: realPassword,
            host: host,
            port: port,
            m3u_url: m3u_url,
            screens: finalScreens,
            expiration: expirationDateVal.toISOString(),
            is_demo: accountForm.is_demo,
            nombre_completo: accountForm.nombre_completo.trim() || 'Cliente IPTV',
            celular: accountForm.celular.trim() || '',
            direccion_actual: accountForm.direccion_actual.trim() || '',
            id_plan_venta: accountForm.is_demo ? '' : accountForm.id_plan_venta,
            panel_client_id: apiId || null
          });

          setAccounts(prev => [updatedPayload, ...prev.filter(a => a.username !== updatedPayload.username)]);
          setViewSource('local');
          if (selectedClient && selectedClient.username === updatedPayload.username) {
            setSelectedClient(updatedPayload);
          }
        } else {
          toast.error("⚠️ Advertencia: La línea física fue creada pero falló la actualización del registro local en Supabase.");
        }
      } else {
        const errorMsg = xuiData.error || "Fallo de rechazo de la API de XUI";
        const failedPayload: IptvAccount = {
          ...payload,
          estado: 'Fallo_Activacion',
          api_sincronizado: false,
          api_error_registro: errorMsg
        };
        await apiService.saveIptvAccount(failedPayload);
        toast.error(`❌ El panel XUI rechazó el alta física de la línea: ${errorMsg}. El registro se guardó localmente.`);
      }
    } catch (err: any) {
      toast.dismiss();
      const errorMsg = err.message || String(err);
      const failedPayload: IptvAccount = {
        ...payload,
        estado: 'Fallo_Activacion',
        api_sincronizado: false,
        api_error_registro: errorMsg
      };
      await apiService.saveIptvAccount(failedPayload);
      toast.error(`❌ Error al conectar con el panel XUI para la creación: ${errorMsg}. El registro de base de datos se conservará localmente.`);
    } finally {
      setIsSavingIptv(false);
    }
    } catch (err: any) {
      toast.error(`Error de procesamiento: ${err.message || String(err)}`);
    } finally {
      setIsSavingIptv(false);
    }
  };

  const handleRetryApiSync = async (client: IptvAccount, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    toast.loading(`Sincronizando "${client.username}" de manera física con XC...`);
    try {
      const selectedSalePlan = salePlans.find(plan => plan.id === client.id_plan_venta);
      const isDemo = client.username.toLowerCase().includes('demo') || client.username.toLowerCase().endsWith('@xtv.net');
      const mappedPackageId = isDemo
        ? (client.id_plan_proveedor || "1")
        : (selectedSalePlan?.provider_plan_id || client.id_plan_venta || "1");

      const retryPayload: any = {
        action: "create_line",
        xuiUrl: xuiConfig.xui_url || "http://vip-xtv.pro:8080",
        xuiToken: xuiConfig.xui_token || "fake-token",
        xuiAccessCode: xuiConfig.xui_access_code,
        package: Number(mappedPackageId || "1"),
        trial: isDemo ? 1 : 0,
      };

      // Inyección automática y oculta del Custom Pack (Plantilla)
      const apiSets = xuiConfig?.api_settings || {};
      const activeType = apiSets.xtv_playlist_active_type || 'limit';
      const playlistId = activeType === 'full' ? apiSets.xtv_playlist_full_id : apiSets.xtv_playlist_limit_id;
      if (playlistId && !isNaN(Number(playlistId))) {
        retryPayload.custom_playlist_id = Number(playlistId);
      }
      const formattedNotes = `[xtv] ${client.nombre_completo.trim() || "Cliente"} - ${selectedSalePlan?.name || (client as any).plan_nombre || (client as any).nombre_plan || "Plan"} - ${user?.usuario_nombre || user?.email || "Admin"} - ${user?.usuario_nombre || user?.email || "Admin"}`;
      if (formattedNotes.trim()) retryPayload.reseller_notes = formattedNotes.trim();
      const screensCount = Number((client as any).limite_pantallas_api || client.limite_pantallas || 1);
      if (screensCount > 1) {
        retryPayload.max_connections = screensCount;
      }

      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retryPayload)
      });

      const xuiData = await resXui.json();
      toast.dismiss();

      if (xuiData.success) {
        const realUsername = xuiData.username || xuiData.data?.username || client.username;
        const realPassword = xuiData.password || xuiData.data?.password || client.password;
        const apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || "");
        const apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
        const apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
        const apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || xuiData.data?.playlist_url || "");
        const apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
        const apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
        const apiRawResponse = xuiData.raw_response || xuiData;

        const updatedClient = {
          ...client,
          username: realUsername,
          password: realPassword,
          api_sincronizado: true,
          api_error_registro: "",
          panel_client_id: apiId || client.panel_client_id || null,
          member_id: apiMemberId || client.member_id || null,
          access_token: apiAccessToken || client.access_token || null,
          playlist_url: apiPlaylistUrl || client.playlist_url || null,
          bouquet: apiBouquet || client.bouquet || null,
          package_id: apiPackageId || client.package_id || null,
          raw_response_json: apiRawResponse || client.raw_response_json || null
        };

        if (realUsername !== client.username) {
          await apiService.deleteIptvAccount(client.username);
        }

        const res = await apiService.saveIptvAccount(updatedClient);
        if (res.success) {
          toast.success(`🎉 ¡Fabuloso! "${client.username}" se creó físicamente y se sincronizó con el panel XC.`);
          await fetchData();
          if (selectedClient && selectedClient.username === client.username) {
            setSelectedClient(updatedClient);
          }
        } else {
          toast.error("Datos creados físicamente pero falló la actualización local en Supabase.");
        }
      } else {
        const updatedClient = {
          ...client,
          api_sincronizado: false,
          api_error_registro: xuiData.error || "El panel rechazó la creación"
        };
        await apiService.saveIptvAccount(updatedClient);
        await fetchData();
        toast.error(`❌ Sincronización denegada por panel: ${xuiData.error || 'Rechazo de creación'}`);
      }
    } catch (err: any) {
      toast.dismiss();
      const errMsg = err.message || String(err);
      const updatedClient = {
        ...client,
        api_sincronizado: false,
        api_error_registro: errMsg
      };
      await apiService.saveIptvAccount(updatedClient);
      await fetchData();
      toast.error(`❌ El panel sigue desconectado o inaccesible: ${errMsg}`);
    }
  };

  // --- HELPERS Y HANDLERS PARA PLANTILLAS Y RESPUESTAS RÁPIDAS (OPCIÓN C) ---
  const replaceMessagePlaceholders = (text: string, account: any) => {
    if (!text || !account) return '';
    const clientName = (account.nombre_completo || 'Cliente').trim();
    const username = account.username || '';
    const password = account.password || '';
    const expDate = account.fecha_vencimiento ? new Date(account.fecha_vencimiento).toLocaleDateString('es-AR') : 'No expira';
    
    // Portal / DNS asignado
    const serverHost = account.url_panel_asignada ? (account.url_panel_asignada.startsWith('http') ? account.url_panel_asignada : `http://${account.url_panel_asignada}`) : 'http://vip-xtv.pro:8080';
    const m3uUrl = `http://mad.mvpl.uk:2095/get.php?username=${username}&password=${password}&type=m3u_plus`;

    // Buscar plan de venta
    let planName = 'Premium VIP';
    if (account.id_plan_venta) {
      const sp = salePlans.find(p => p.id === account.id_plan_venta);
      if (sp) planName = sp.name;
    }

    return text
      .replace(/{nombre_completo}/g, clientName)
      .replace(/{username}/g, username)
      .replace(/{usuario}/g, username)
      .replace(/{password}/g, password)
      .replace(/{contraseña}/g, password)
      .replace(/{fecha_vencimiento}/g, expDate)
      .replace(/{m3u_url}/g, m3uUrl)
      .replace(/{host_completo}/g, serverHost)
      .replace(/{plan_venta}/g, planName)
      .replace(/{celular}/g, account.celular || 'No provisto');
  };

  const handleSaveTemplate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.text.trim()) {
      toast.error('Por favor, completa el nombre y el texto de la plantilla.');
      return;
    }

    setIsSavingTemplate(true);
    try {
      let updatedReplies: QuickReplyTemplate[] = [];
      if (editingTemplate && editingTemplate.id) {
        // Editar existente
        updatedReplies = quickReplies.map(qr => 
          qr.id === editingTemplate.id 
            ? { ...qr, name: templateForm.name, category: templateForm.category, text: templateForm.text }
            : qr
        );
        toast.success('Plantilla actualizada correctamente.');
      } else {
        // Crear nueva
        const newTemplate: QuickReplyTemplate = {
          id: 'qr-' + Date.now(),
          name: templateForm.name,
          category: templateForm.category,
          text: templateForm.text
        };
        updatedReplies = [...quickReplies, newTemplate];
        toast.success('Nueva plantilla de respuesta rápida creada.');
      }

      setQuickReplies(updatedReplies);
      localStorage.setItem('g3d_quick_replies', JSON.stringify(updatedReplies));

      // Guardar en Supabase a través del config global
      try {
        const sysConf = await apiService.getSystemConfig();
        const updatedConfig = {
          ...sysConf,
          whatsapp_automations: {
            ...(sysConf?.whatsapp_automations || {}),
            quick_replies: updatedReplies
          }
        };
        await apiService.updateSystemConfig(updatedConfig);
      } catch (err) {
        console.warn("Error guardando plantillas en la nube", err);
      }

      setEditingTemplate(null);
      setTemplateForm({ name: '', category: 'custom', text: '' });
    } catch (err: any) {
      toast.error('Error al guardar plantilla: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) return;
    
    try {
      const updatedReplies = quickReplies.filter(qr => qr.id !== id);
      setQuickReplies(updatedReplies);
      localStorage.setItem('g3d_quick_replies', JSON.stringify(updatedReplies));

      // Guardar en Supabase
      try {
        const sysConf = await apiService.getSystemConfig();
        const updatedConfig = {
          ...sysConf,
          whatsapp_automations: {
            ...(sysConf?.whatsapp_automations || {}),
            quick_replies: updatedReplies
          }
        };
        await apiService.updateSystemConfig(updatedConfig);
      } catch (err) {
        console.warn("Error borrando plantilla de la nube", err);
      }

      toast.success('Plantilla eliminada correctamente.');
    } catch (err: any) {
      toast.error('Error al eliminar plantilla: ' + err.message);
    }
  };

  const handleSimulateVirtualSale = () => {
    const active = vendedores.find(v => v.id === selectedVendedorId);
    if (!active) return;

    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (active.fase_confianza === 1) {
      // Fase 1: Solicita activación VIP al Administrador
      setVendedores(prev => prev.map(v => {
        if (v.id === active.id) {
          return { ...v, solicitudes_pendientes: v.solicitudes_pendientes + 1 };
        }
        return v;
      }));
      setVirtualSellerLogs(prev => [
        `[${time}] 📩 SOLICITUD DE ACTIVACIÓN: "${active.nombre}" solicitó activar una membresía VIP. (Fase 1: En espera de aprobación manual de cobro por Admin).`,
        ...prev
      ]);
      toast.info(`📩 Solicitud de activación enviada por "${active.nombre}"`);
    } else {
      // Fase 2: Autónomo (Descuenta del saldo de créditos directos)
      if (active.creditos_actuales <= 0) {
        setVirtualSellerLogs(prev => [
          `[${time}] 🔒 BLOQUEO IMPEDIDO: El vendedor "${active.nombre}" intentó emitir una cuenta pero no posee créditos disponibles (Balance: 0 / Tope: ${active.tope_creditos}). Debe solicitar recarga.`,
          ...prev
        ]);
        toast.error(`❌ Sin créditos suficientes para "${active.nombre}"`);
      } else {
        setVendedores(prev => prev.map(v => {
          if (v.id === active.id) {
            return { 
              ...v, 
              creditos_actuales: v.creditos_actuales - 1,
              ventas_totales: v.ventas_totales + 1
            };
          }
          return v;
        }));
        setVirtualSellerLogs(prev => [
          `[${time}] 📺 VENTA AUTÓNOMA CONCRETADA: "${active.nombre}" emitió una cuenta VIP. Balance actual: ${active.creditos_actuales - 1}/${active.tope_creditos} créditos.`,
          ...prev
        ]);
        toast.success(`📺 Cuenta VIP emitida autónomamente por "${active.nombre}"`);
      }
    }
  };

  const handleApproveVirtualRequest = (id: string) => {
    const active = vendedores.find(v => v.id === id);
    if (!active || active.solicitudes_pendientes <= 0) return;

    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setVendedores(prev => prev.map(v => {
      if (v.id === id) {
        return { 
          ...v, 
          solicitudes_pendientes: v.solicitudes_pendientes - 1,
          ventas_totales: v.ventas_totales + 1
        };
      }
      return v;
    }));

    setVirtualSellerLogs(prev => [
      `[${time}] ✅ COBRO CONFIRMADO: El administrador validó el pago para "${active.nombre}". Cuenta activada exitosamente en el panel. Ventas totales: ${active.ventas_totales + 1}.`,
      ...prev
    ]);
    toast.success(`✅ Activación VIP aprobada para "${active.nombre}"`);
  };

  const handleSimulateVirtualRestock = () => {
    const active = vendedores.find(v => v.id === selectedVendedorId);
    if (!active) return;

    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (active.fase_confianza === 1) {
      toast.error(`⚠️ "${active.nombre}" está en Fase 1 (Manual). No requiere asignación de créditos periódica.`);
      return;
    }

    setVendedores(prev => prev.map(v => {
      if (v.id === active.id) {
        return { 
          ...v, 
          creditos_actuales: v.tope_creditos,
          reestokes_realizados: v.reestokes_realizados + 1
        };
      }
      return v;
    }));

    setVirtualSellerLogs(prev => [
      `[${time}] 🛡️ CRÉDITOS ASIGNADOS MANUALMENTE: El administrador autorizó la recarga total para "${active.nombre}". Saldo restaurado a ${active.tope_creditos} créditos.`,
      ...prev
    ]);
    toast.success(`🛡️ Saldo acreditado para "${active.nombre}"`);
  };

  const handleSimulatePeriodTimePass = (periodo: 'diario' | 'semanal') => {
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let restockedCount = 0;
    let ignoredCount = 0;

    setVendedores(prev => prev.map(v => {
      if (v.fase_confianza === 2 && v.periodo_restock === periodo) {
        if (v.auto_restock_aprobado) {
          restockedCount++;
          return {
            ...v,
            creditos_actuales: v.tope_creditos,
            reestokes_realizados: v.reestokes_realizados + 1
          };
        } else {
          ignoredCount++;
        }
      }
      return v;
    }));

    if (restockedCount > 0 || ignoredCount > 0) {
      setVirtualSellerLogs(prev => [
        `[${time}] ⏳ REESTOKEO AUTOMÁTICO DE PERÍODO (${periodo.toUpperCase()}): Se procesó el cron periódico. Se recargaron automáticamente ${restockedCount} vendedores autorizados. Se omitieron ${ignoredCount} vendedores pendientes de pre-aprobación del administrador.`,
        ...prev
      ]);
      if (restockedCount > 0) {
        toast.success(`⏳ Auto-Restock: ${restockedCount} vendedores reabastecidos con éxito.`);
      } else {
        toast.warning(`⏳ Auto-Restock: Omitido. Ninguno de los vendedores tenía pre-aprobación activa.`);
      }
    } else {
      toast.info(`⏳ No hay vendedores autónomos configurados con periodo: ${periodo}`);
    }
  };

  const handleAddNewSellerKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerKycForm.nombre.trim()) {
      toast.error("Por favor completa el nombre del vendedor.");
      return;
    }
    const newId = (vendedores.length + 1).toString();
    const newSeller = {
      id: newId,
      ...newSellerKycForm,
      ventas_totales: 0,
      creditos_actuales: newSellerKycForm.fase_confianza === 2 ? newSellerKycForm.tope_creditos : 0,
      solicitudes_pendientes: 0,
      reestokes_realizados: 0,
      fecha_alta: new Date().toISOString().split('T')[0]
    };

    setVendedores(prev => [...prev, newSeller]);
    setSelectedVendedorId(newId);
    setShowAddSellerKycModal(false);
    setVirtualSellerLogs(prev => [
      `[Registro] 🆕 NUEVO EXPEDIENTE KYC CREADO para "${newSeller.nombre}". DNI: ${newSeller.dni_cuil || 'Pendiente'}. Estado inicial: Fase ${newSeller.fase_confianza}.`,
      ...prev
    ]);
    toast.success(`¡Vendedor "${newSeller.nombre}" registrado con éxito!`);
    
    // Reset form
    setNewSellerKycForm({
      nombre: '',
      fase_confianza: 1,
      tope_creditos: 15,
      periodo_restock: 'diario',
      auto_restock_aprobado: false,
      dni_cuil: '',
      celular: '',
      direccion: '',
      cbu_alias: '',
      redes_sociales: '',
      notas_seguridad: '',
      foto_dni_frente: true,
      foto_dni_dorso: true,
      servicio_certificado: false,
      riesgo_rating: 'Bajo'
    });
  };

  const handleUpdateSellerKyc = (id: string, updatedFields: any) => {
    setVendedores(prev => prev.map(v => v.id === id ? { ...v, ...updatedFields } : v));
    toast.success("Expediente KYC de seguridad actualizado.");
    setVirtualSellerLogs(prev => [
      `[Seguridad] 🪪 Expediente KYC actualizado para el vendedor ID ${id}.`,
      ...prev
    ]);
  };

  const handleDeleteClient = (username: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: '🗑️ Eliminar Cliente',
      description: `¿Confirmas la eliminación definitiva de la cuenta "${username}"? Esta acción borrará permanentemente sus credenciales e historial de la base de datos de Supabase y del almacenamiento local.`,
      confirmText: 'Eliminar Cliente',
      actionType: 'delete_single',
      targetUsername: username
    });
  };

  const handlePurgeTestClients = () => {
    const testClients = accounts.filter(acc => {
      const name = (acc.nombre_completo || '').toLowerCase();
      const user = (acc.username || '').toLowerCase();
      const notes = (acc.comentarios || '').toLowerCase();
      return name.includes('[test') || name.includes('test-admin') || user.startsWith('vip184668') || user.startsWith('vip563093') || notes.includes('test') || user.startsWith('testadmin');
    });

    if (testClients.length === 0) {
      toast.info("No se encontraron cuentas marcadas como [TEST-ADMIN] en la base de datos.");
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      title: '🗑️ Purgar Cuentas [TEST-ADMIN]',
      description: `Se detectaron ${testClients.length} cuenta(s) de prueba de administración. ¿Confirmas su eliminación total y definitiva de Supabase y del almacenamiento local?`,
      confirmText: `Purgar ${testClients.length} Cuentas`,
      itemCount: testClients.length,
      actionType: 'purge_test'
    });
  };

  const handleCleanupExpiredDemos = () => {
    const now = new Date();
    const expiredDemos = activeSourceAccounts.filter(acc => {
      const isDemo = String(acc.username).toLowerCase().includes('demo') || 
                     String(acc.comentarios).toLowerCase().includes('demo') || 
                     String(acc.id_plan_venta).toLowerCase().includes('demo') ||
                     (acc.bitacora_comentarios && JSON.stringify(acc.bitacora_comentarios).toLowerCase().includes('demo')) ||
                     acc.limite_pantallas === 1;
      const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < now : false;
      return isDemo && vencido;
    });

    if (expiredDemos.length === 0) {
      toast.info("No se encontraron cuentas demo expiradas en la lista actual.");
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      title: '🧹 Limpiar Demos Expiradas',
      description: `Se detectaron ${expiredDemos.length} cuenta(s) demo con período de prueba vencido. ¿Confirmas su eliminación masiva de Supabase y del almacenamiento local?`,
      confirmText: `Eliminar ${expiredDemos.length} Demos`,
      itemCount: expiredDemos.length,
      actionType: 'cleanup_demos'
    });
  };

  const handleCleanupAllExpired = () => {
    const now = new Date();
    const expiredAccounts = activeSourceAccounts.filter(acc => {
      const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < now : false;
      return vencido;
    });

    if (expiredAccounts.length === 0) {
      toast.info("No se encontraron cuentas con fecha vencida/expirada en la lista actual.");
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      title: '🧹 Limpiar Cuentas Vencidas',
      description: `Se detectaron ${expiredAccounts.length} cuenta(s) vencidas en total. ¿Confirmas su eliminación permanente de Supabase y del almacenamiento local?`,
      confirmText: `Eliminar ${expiredAccounts.length} Vencidos`,
      itemCount: expiredAccounts.length,
      actionType: 'cleanup_expired'
    });
  };

  const handleExecuteConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    setIsDeletingProcess(true);
    const { actionType, targetUsername } = deleteConfirmModal;

    // Helper para eliminar línea del panel XUI/XC si está configurado
    const deleteFromPanel = async (u: string, idPanel?: string | number) => {
      if (!xuiConfig.xui_url) return;
      try {
        await fetch("/api/iptv/xui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_line",
            xuiUrl: xuiConfig.xui_url,
            xuiToken: xuiConfig.xui_token,
            xuiAccessCode: xuiConfig.xui_access_code,
            username: u,
            id: idPanel
          })
        });
      } catch (panelErr) {
        console.warn(`[deleteFromPanel] No se pudo borrar del panel a ${u}:`, panelErr);
      }
    };

    try {
      if (actionType === 'delete_single' && targetUsername) {
        const toastId = toast.loading(`Eliminando cuenta "${targetUsername}"...`);
        const targetAcc = activeSourceAccounts.find(a => (a.username || '').toLowerCase() === targetUsername.toLowerCase());

        // Borrar de Supabase
        const res = await apiService.deleteIptvAccount(targetUsername);

        // Borrar del panel físico si está vinculado
        await deleteFromPanel(targetUsername, targetAcc?.id_linea_panel);

        toast.dismiss(toastId);
        if (res.success || viewSource === 'api') {
          toast.success(`Cuenta de cliente "${targetUsername}" eliminada con éxito.`);
          const next = Math.max(0, xuiApiUsersCount - 1);
          setXuiApiUsersCount(next);
          localStorage.setItem('xui_api_users_count', String(next));
          setSelectedClient(null);
          setAccounts(prev => {
            const updated = prev.filter(a => (a.username || '').toLowerCase() !== targetUsername.toLowerCase());
            localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(updated));
            return updated;
          });
          setApiAccounts(prev => prev.filter(a => (a.username || '').toLowerCase() !== targetUsername.toLowerCase()));
        } else {
          toast.error(`Error al borrar cuenta: ${res.error || 'Desconocido'}`);
        }
      } else if (actionType === 'purge_test') {
        const testClients = activeSourceAccounts.filter(acc => {
          const name = (acc.nombre_completo || '').toLowerCase();
          const user = (acc.username || '').toLowerCase();
          const notes = (acc.comentarios || '').toLowerCase();
          return name.includes('[test') || name.includes('test-admin') || user.startsWith('vip184668') || user.startsWith('vip563093') || notes.includes('test') || user.startsWith('testadmin');
        });
        const toastId = toast.loading(`Purgando ${testClients.length} cuentas de prueba...`);
        let successCount = 0;
        await Promise.allSettled(
          testClients.map(async (cl) => {
            try {
              await deleteFromPanel(cl.username, cl.id_linea_panel);
              const res = await apiService.deleteIptvAccount(cl.username);
              if (res.success || viewSource === 'api') successCount++;
            } catch (err) {
              console.warn("Error purgando cliente de prueba:", cl.username, err);
            }
          })
        );
        const testUsernames = testClients.map(t => (t.username || '').toLowerCase());
        setAccounts(prev => {
          const updated = prev.filter(a => !testUsernames.includes((a.username || '').toLowerCase()));
          localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(updated));
          return updated;
        });
        setApiAccounts(prev => prev.filter(a => !testUsernames.includes((a.username || '').toLowerCase())));
        toast.dismiss(toastId);
        toast.success(`Se eliminaron definitivamente ${successCount} cuentas de prueba.`);
      } else if (actionType === 'cleanup_demos') {
        const now = new Date();
        const expiredDemos = activeSourceAccounts.filter(acc => {
          const isDemo = String(acc.username).toLowerCase().includes('demo') || 
                         String(acc.comentarios).toLowerCase().includes('demo') || 
                         String(acc.id_plan_venta).toLowerCase().includes('demo') ||
                         (acc.bitacora_comentarios && JSON.stringify(acc.bitacora_comentarios).toLowerCase().includes('demo')) ||
                         acc.limite_pantallas === 1;
          const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < now : false;
          return isDemo && vencido;
        });
        const toastId = toast.loading(`Eliminando ${expiredDemos.length} demos expiradas...`);
        let successCount = 0;
        await Promise.allSettled(
          expiredDemos.map(async (d) => {
            try {
              await deleteFromPanel(d.username, d.id_linea_panel);
              const res = await apiService.deleteIptvAccount(d.username);
              if (res.success || viewSource === 'api') successCount++;
            } catch (err) {
              console.warn("Error borrando demo expirada:", err);
            }
          })
        );
        const expiredUsernames = expiredDemos.map(d => (d.username || '').toLowerCase());
        setAccounts(prev => {
          const updated = prev.filter(a => !expiredUsernames.includes((a.username || '').toLowerCase()));
          localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(updated));
          return updated;
        });
        setApiAccounts(prev => prev.filter(a => !expiredUsernames.includes((a.username || '').toLowerCase())));
        toast.dismiss(toastId);
        toast.success(`Limpieza completa: Se eliminaron ${successCount} cuentas demo vencidas.`);
      } else if (actionType === 'cleanup_expired') {
        const now = new Date();
        const expiredAccounts = activeSourceAccounts.filter(acc => {
          const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < now : false;
          return vencido;
        });
        const toastId = toast.loading(`Eliminando ${expiredAccounts.length} cuentas expiradas...`);
        let successCount = 0;
        await Promise.allSettled(
          expiredAccounts.map(async (a) => {
            try {
              await deleteFromPanel(a.username, a.id_linea_panel);
              const res = await apiService.deleteIptvAccount(a.username);
              if (res.success || viewSource === 'api') successCount++;
            } catch (err) {
              console.warn("Error borrando cuenta expirada:", err);
            }
          })
        );
        const expiredUsernames = expiredAccounts.map(a => (a.username || '').toLowerCase());
        setAccounts(prev => {
          const updated = prev.filter(a => !expiredUsernames.includes((a.username || '').toLowerCase()));
          localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(updated));
          return updated;
        });
        setApiAccounts(prev => prev.filter(a => !expiredUsernames.includes((a.username || '').toLowerCase())));
        toast.dismiss(toastId);
        toast.success(`Limpieza completa: Se eliminaron ${successCount} cuentas vencidas.`);
      }
    } finally {
      setIsDeletingProcess(false);
      setDeleteConfirmModal(null);
    }
  };

  // CONTROL DE SUB-PERFILES EN DETALLE
  const handleAddSubprofile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const accountProfiles = profiles.filter(p => p.username_cuenta === selectedClient.username);
    if (accountProfiles.length >= 5) {
      toast.error('Límite de perfil alcanzado (Máximo 5 perfiles por hogar/cuenta)');
      return;
    }

    if (!newProfileName.trim()) {
      toast.warning('Especifica el nombre del perfil');
      return;
    }

    const randomAvatar = newProfileAvatar.trim() || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(newProfileName)}`;
    
    const newProfile = {
      id: `p-${Math.random().toString(36).substring(2, 9)}`,
      username_cuenta: selectedClient.username,
      nombre_perfil: newProfileName.trim(),
      pin_perfil: newProfilePin.trim() || null,
      avatar_url: randomAvatar,
      fecha_creacion: new Date().toISOString()
    };

    const res = await apiService.saveIptvProfile(newProfile);
    if (res.success) {
      toast.success('Subperfil personal añadido');
      setNewProfileName('');
      setNewProfilePin('');
      setNewProfileAvatar('');
      setShowProfileForm(false);
      await fetchData();
    } else {
      toast.error('Error al insertar perfil');
    }
  };

  const handleDeleteSubprofile = async (id: string) => {
    if (confirm('¿Deseas remover este subperfil del cliente?')) {
      const res = await apiService.deleteIptvProfile(id);
      if (res.success) {
        toast.success('Subperfil eliminado');
        await fetchData();
      } else {
        toast.error('No se pudo remover el subperfil');
      }
    }
  };

  const handleKickSession = async (sessionId: string) => {
    if (confirm('¿Expulsar este dispositivo en vivo inmediatamente de las pantallas autorizadas?')) {
      const res = await apiService.deleteIptvActiveSession(sessionId);
      if (res.success) {
        toast.success('Sesión activa de transmisión expulsada');
        await fetchData();
      } else {
        toast.error('Error al desconectar dispositivo');
      }
    }
  };

  // Carga de imágenes locales y conversión a Base64 con previsualización
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'spot') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El formato de archivo seleccionado debe ser una imagen válida');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'logo') {
        setBrandLogoUrl(base64String);
      } else {
        setBrandPromoSpotUrl(base64String);
      }
      toast.success('Imagen de alta resolución cargada localmente para encuadrar');
    };
    reader.readAsDataURL(file);
  };

  // Ajustes de encuadre en mini ventanas interactiva
  const handleAdjustImage = (type: 'logo' | 'spot', key: 'zoom' | 'x' | 'y', value: number) => {
    setImgSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  const handleResetAdjustments = (type: 'logo' | 'spot') => {
    setImgSettings(prev => ({
      ...prev,
      [type]: { zoom: 1, x: 0, y: 0 }
    }));
  };

  // Control interactivo por dragging y wheel de imagen de marca
  const handleInteractiveMouseDown = (e: React.MouseEvent, type: 'logo' | 'spot') => {
    e.preventDefault();
    setIsDraggingImage(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleInteractiveMouseMove = (e: React.MouseEvent, type: 'logo' | 'spot') => {
    if (!isDraggingImage) return;
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    setImgSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        x: prev[type].x + deltaX,
        y: prev[type].y + deltaY
      }
    }));
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleInteractiveMouseUpOrLeave = () => {
    setIsDraggingImage(false);
  };

  const handleInteractiveWheel = (e: React.WheelEvent, type: 'logo' | 'spot') => {
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    const currentZoom = imgSettings[type]?.zoom || 1;
    const newZoom = Math.min(3.0, Math.max(0.1, currentZoom + zoomDelta));
    setImgSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        zoom: parseFloat(newZoom.toFixed(2))
      }
    }));
  };

  // CRUD de Banners Rotativos
  const handleAddBanner = () => {
    if (!newBannerName.trim() || !newBannerImage) {
      toast.warning('Ingresa un título y selecciona una imagen para el banner publicitario');
      return;
    }

    const newAd: BannerAd = {
      id: `b-${Date.now()}`,
      name: newBannerName.trim(),
      imageUrl: newBannerImage,
      active: true
    };

    const updated = [...banners, newAd];
    setBanners(updated);
    setNewBannerName('');
    setNewBannerImage('');
    toast.success('Banner de publicidad catalogado exitosamente');
  };

  const toggleBannerStatus = (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, active: !b.active } : b);
    setBanners(updated);
  };

  const handleDeleteBanner = (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    setBanners(updated);
    toast.info('Banner de publicidad removido');
  };

  const handleSaveBranding = async () => {
    setLoading(true);
    const payload = {
      logo_url: brandLogoUrl,
      promo_spot_url: brandPromoSpotUrl,
      banners_rotativos: banners,
      img_settings: imgSettings
    };
    const res = await apiService.saveIptvBranding(payload);
    setLoading(false);
    if (res.success) {
      toast.success('Identidad visual y banners rotativos actualizados correctamente');
      await fetchData();
    } else {
      toast.error('No se pudo registrar la identidad de marca');
    }
  };

  // CRUD de Planes (Proveedor y venta) en Finanzas
  const handleOpenPlanForm = (type: 'provider' | 'sale', plan?: any) => {
    setEditingPlanType(type);
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        name: plan.name,
        months: plan.months === 0 ? '' : (plan.months || ''),
        hours: plan.hours === 0 ? '' : (plan.hours || ''),
        screens: plan.screens === 0 ? '' : (plan.screens || ''),
        tokens: plan.tokens === 0 ? '' : (plan.tokens || ''),
        value: (type === 'provider' ? plan.cost : plan.price) || '',
        provider_name: plan.provider_name || '',
        token_price: plan.token_price === 0 ? '' : (plan.token_price || ''),
        provider_plan_id: plan.provider_plan_id || '',
        provider_cost_id: plan.provider_cost_id || '',
        screens_api: plan.screens_api != null ? plan.screens_api : (plan.screens || 1),
        comision: plan.comision_vendedor != null ? plan.comision_vendedor : (plan.comision != null ? plan.comision : ''),
        comision_vendedor: plan.comision_vendedor != null ? plan.comision_vendedor : (plan.comision != null ? plan.comision : ''),
        comision_referente: plan.comision_referente != null ? plan.comision_referente : '',
        categoria_nombre: plan.categoria_nombre || '',
        categoria_id: plan.categoria_id || 'vip',
        visible: plan.visible !== undefined ? plan.visible : true,
        max_connections: plan.max_connections != null ? plan.max_connections : (plan.screens || 1),
        multiple_connections: plan.multiple_connections != null ? plan.multiple_connections : (plan.screens || 1),
        multiconx_pricing: plan.multiconx_pricing || ''
      });
    } else {
      setEditingPlanId(null);
      const firstProvId = providerPlans[0]?.id || '';
      const matchedProv = providerPlans.find(p => p.id === firstProvId);
      setPlanForm({
        name: '',
        months: matchedProv ? matchedProv.months : '',
        hours: matchedProv ? (matchedProv.hours || '') : '',
        screens: matchedProv ? matchedProv.screens : 1,
        tokens: matchedProv ? matchedProv.tokens : '',
        value: '',
        provider_name: '',
        token_price: '',
        provider_plan_id: firstProvId,
        provider_cost_id: '',
        screens_api: matchedProv ? (matchedProv.max_connections || matchedProv.screens || 1) : 1,
        comision: '',
        comision_vendedor: '',
        comision_referente: '',
        categoria_nombre: '',
        categoria_id: 'vip',
        visible: true,
        max_connections: matchedProv ? (matchedProv.max_connections || matchedProv.screens || 1) : 1,
        multiple_connections: matchedProv ? (matchedProv.multiple_connections || matchedProv.screens || 1) : 1,
        multiconx_pricing: matchedProv ? (matchedProv.multiconx_pricing || '') : ''
      });
    }
  };

  const handleTogglePlanVisibility = async (planId: string) => {
    const updated = salePlans.map(p => {
      if (p.id === planId) {
        const nextVisible = p.visible !== false ? false : true;
        return { ...p, visible: nextVisible };
      }
      return p;
    });
    setSalePlans(updated);
    await saveFinancesState(providerPlans, updated, partners);
    const target = updated.find(p => p.id === planId);
    if (target?.visible) {
      toast.success(`Plan "${target.name}" ahora es VISIBLE en la creación de líneas`);
    } else {
      toast.info(`Plan "${target?.name}" ahora está OCULTO en la creación de líneas`);
    }
  };

  const handleMoveSalePlan = async (planId: string, direction: 'up' | 'down', catId?: string) => {
    // Normalizar orden si no existe
    let currentList = [...salePlans];
    const categoryFilter = catId ? (p: SalePlan) => classifyPlanCategory(p) === catId : () => true;
    const catItems = currentList.filter(categoryFilter);
    const targetIndex = catItems.findIndex(p => p.id === planId);

    if (targetIndex === -1) return;
    if (direction === 'up' && targetIndex === 0) return;
    if (direction === 'down' && targetIndex === catItems.length - 1) return;

    const swapIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1;
    const itemA = catItems[targetIndex];
    const itemB = catItems[swapIndex];

    // Intercambiar posiciones en la lista general
    const realIndexA = currentList.findIndex(p => p.id === itemA.id);
    const realIndexB = currentList.findIndex(p => p.id === itemB.id);

    if (realIndexA !== -1 && realIndexB !== -1) {
      const temp = currentList[realIndexA];
      currentList[realIndexA] = currentList[realIndexB];
      currentList[realIndexB] = temp;

      // Reasignar orden numérico secuencial explícito
      currentList = currentList.map((p, idx) => ({ ...p, order: idx + 1 }));

      setSalePlans(currentList);
      await saveFinancesState(providerPlans, currentList, partners);
      toast.success(`Posición del plan "${itemA.name}" actualizada`);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      toast.warning('Define un nombre comprensivo de plan');
      return;
    }

    if (editingPlanType === 'provider') {
      let updated: ProviderPlan[];
      // Calcular costo total = token_price * tokens
      const calcCost = Number(planForm.tokens) * Number(planForm.token_price);
      if (editingPlanId) {
        updated = providerPlans.map(p => p.id === editingPlanId ? {
          id: p.id,
          provider_name: planForm.provider_name.trim() || 'Lucas Mayorista',
          name: planForm.name,
          months: Number(planForm.months),
          hours: Number(planForm.hours),
          screens: Number(planForm.screens),
          tokens: Number(planForm.tokens),
          token_price: Number(planForm.token_price),
          cost: calcCost,
          provider_cost_id: planForm.provider_cost_id || '',
          max_connections: Number(planForm.max_connections != null ? planForm.max_connections : planForm.screens),
          multiple_connections: Number(planForm.multiple_connections != null ? planForm.multiple_connections : planForm.screens),
          multiconx_pricing: planForm.multiconx_pricing || ''
        } : p);
      } else {
        updated = [...providerPlans, {
          id: `prov-${Date.now()}`,
          provider_name: planForm.provider_name.trim() || 'Lucas Mayorista',
          name: planForm.name,
          months: Number(planForm.months),
          hours: Number(planForm.hours),
          screens: Number(planForm.screens),
          tokens: Number(planForm.tokens),
          token_price: Number(planForm.token_price),
          cost: calcCost,
          provider_cost_id: planForm.provider_cost_id || '',
          max_connections: Number(planForm.max_connections != null ? planForm.max_connections : planForm.screens),
          multiple_connections: Number(planForm.multiple_connections != null ? planForm.multiple_connections : planForm.screens),
          multiconx_pricing: planForm.multiconx_pricing || ''
        }];
      }
      setProviderPlans(updated);
      await saveFinancesState(updated, salePlans, partners);
      toast.success('Plan mayorista del proveedor actualizado');
    } else if (editingPlanType === 'sale') {
      const screensApiVal = planForm.screens_api !== '' ? Number(planForm.screens_api) : 1;
      const comisionVendedorVal = planForm.comision_vendedor !== '' 
        ? Number(planForm.comision_vendedor) 
        : (planForm.comision !== '' ? Number(planForm.comision) : 0);
      const comisionReferenteVal = planForm.comision_referente !== '' ? Number(planForm.comision_referente) : 0;

      // Validación activa contra límites actuales de la API de Proveedor
      const selProv = providerPlans.find(p => String(p.id) === String(planForm.provider_plan_id));
      if (selProv) {
        const limits = getSelectedPlanConnectionsLimits(selProv);
        const realMaxConns = limits.max;
        const screensVal = Number(planForm.screens) || 1;
        if (screensApiVal > realMaxConns) {
          toast.error(`⚠️ ¡Límite de API Excedido! El paquete mayorista "${selProv.name}" soporta como máximo ${realMaxConns} conexiones físicas en la API, pero intentas configurar este plan minorista con ${screensApiVal} conexiones.`);
          return;
        }
        if (screensVal > realMaxConns) {
          toast.error(`⚠️ ¡Límite de API Excedido! El paquete mayorista "${selProv.name}" soporta como máximo ${realMaxConns} conexiones, por lo que no puedes vender ${screensVal} pantallas al cliente final con este combo.`);
          return;
        }
      }

      let updated: SalePlan[];
      if (editingPlanId) {
        updated = salePlans.map(p => p.id === editingPlanId ? {
          id: p.id,
          provider_plan_id: planForm.provider_plan_id,
          name: planForm.name,
          months: Number(planForm.months),
          hours: Number(planForm.hours),
          screens: Number(planForm.screens),
          tokens: Number(planForm.tokens),
          price: Number(planForm.value),
          screens_api: screensApiVal,
          comision: comisionVendedorVal,
          comision_vendedor: comisionVendedorVal,
          comision_referente: comisionReferenteVal,
          categoria_nombre: planForm.categoria_nombre || '',
          categoria_id: planForm.categoria_id || 'vip',
          visible: planForm.visible !== undefined ? planForm.visible : true,
          custom_override: true
        } : p);
      } else {
        updated = [...salePlans, {
          id: `sale-${Date.now()}`,
          provider_plan_id: planForm.provider_plan_id,
          name: planForm.name,
          months: Number(planForm.months),
          hours: Number(planForm.hours),
          screens: Number(planForm.screens),
          tokens: Number(planForm.tokens),
          price: Number(planForm.value),
          screens_api: screensApiVal,
          comision: comisionVendedorVal,
          comision_vendedor: comisionVendedorVal,
          comision_referente: comisionReferenteVal,
          categoria_nombre: planForm.categoria_nombre || '',
          categoria_id: planForm.categoria_id || 'vip',
          visible: planForm.visible !== undefined ? planForm.visible : true,
          custom_override: true
        }];
      }
      setSalePlans(updated);
      await saveFinancesState(providerPlans, updated, partners);
      toast.success('Opción de plan de venta minorista registrada');
    }

    setEditingPlanType(null);
    setEditingPlanId(null);
  };

  const handleDeletePlan = async (type: 'provider' | 'sale', id: string) => {
    if (type === 'provider') {
      const updated = providerPlans.filter(p => p.id !== id);
      setProviderPlans(updated);
      await saveFinancesState(updated, salePlans, partners);
    } else {
      const updated = salePlans.filter(p => p.id !== id);
      setSalePlans(updated);
      try {
        await apiService.deleteIptvSalePlan(id);
      } catch (err) {
        console.warn("Error al borrar plan minorista en base de datos:", err);
      }
      await saveFinancesState(providerPlans, updated, partners);
    }
    toast.info('Opción de plan eliminada exitosamente');
  };

  const handleUpdatePlanTokens = async (planId: string, tokens: number) => {
    const updated = providerPlans.map(p => {
      if (p.id === planId) {
        const t = Math.max(0, tokens);
        const costPrice = p.token_price || 1500;
        return {
          ...p,
          tokens: t,
          cost: t * costPrice
        };
      }
      return p;
    });
    setProviderPlans(updated);
    await saveFinancesState(updated, salePlans, partners);
  };

  // --- GESTIÓN DE COSTOS DE PROVEEDORES ---
  const handleSaveProviderCost = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: IptvCostoProveedor = {
      proveedor: providerCostForm.proveedor?.trim() || '',
      plan: providerCostForm.plan?.trim() || '',
      precio: Number(providerCostForm.precio) || 0,
      creditos: Number(providerCostForm.creditos) || 0,
      link: providerCostForm.link?.trim() || ''
    };

    if (editingProviderCostId) {
      payload.id = editingProviderCostId;
    }

    const res = await apiService.saveIptvCostoProveedor(payload);
    if (res.success) {
      const updatedList = await apiService.getIptvCostosProveedor();
      setProviderCosts(updatedList);
      setEditingProviderCostId(null);
      setProviderCostForm({
        proveedor: '',
        plan: '',
        precio: '',
        creditos: '',
        link: ''
      });
      toast.success(editingProviderCostId ? 'Costo de proveedor actualizado' : 'Costo de proveedor registrado');
    } else {
      toast.error('Ocurrió un error al guardar el costo de proveedor');
    }
  };

  const handleEditProviderCost = (item: IptvCostoProveedor) => {
    if (item.id) {
      setEditingProviderCostId(item.id);
      setProviderCostForm({
        proveedor: item.proveedor || '',
        plan: item.plan || '',
        precio: item.precio === 0 ? '' : item.precio,
        creditos: item.creditos === 0 ? '' : item.creditos,
        link: item.link || ''
      });
      toast.info(`Editando costo de ${item.proveedor || 'Proveedor'}`);
    }
  };

  const handleDeleteProviderCost = async (id: string) => {
    const res = await apiService.deleteIptvCostoProveedor(id);
    if (res.success) {
      setProviderCosts(prev => prev.filter(p => p.id !== id));
      if (editingProviderCostId === id) {
        setEditingProviderCostId(null);
        setProviderCostForm({
          proveedor: '',
          plan: '',
          precio: '',
          creditos: '',
          link: ''
        });
      }
      toast.info('Costo de proveedor eliminado');
    } else {
      toast.error('No se pudo eliminar el costo del proveedor');
    }
  };

  const handleActivateProviderCost = async (item: IptvCostoProveedor) => {
    setProviderName(item.proveedor);
    setTokenPackageUsd(item.precio);
    setCreditsPerPack(item.creditos);
    toast.success(`Activado: ${item.proveedor} (${item.plan})`);
    await saveFinancesState(
      providerPlans,
      salePlans,
      partners,
      undefined,
      item.precio,
      undefined,
      undefined,
      undefined,
      undefined,
      item.proveedor,
      item.creditos
    );
  };

  // Matriz de distribución de Socios
  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      toast.warning('Ingresa el nombre completo del socio');
      return;
    }

    const currentSum = partners.reduce((sum, p) => sum + p.percent, 0);
    if (currentSum + Number(newPartnerPercent) > 100) {
      toast.warning(`Distribución excedida. Solo dispones del ${100 - currentSum}% libre.`);
      return;
    }

    const updated = [...partners, {
      name: newPartnerName.trim(),
      percent: Number(newPartnerPercent),
      role: newPartnerRole.trim() || 'Socio'
    }];
    setPartners(updated);
    await saveFinancesState(providerPlans, salePlans, updated);
    
    setNewPartnerName('');
    setNewPartnerPercent('');
    setNewPartnerRole('');
    toast.success('Socio registrado para distribución de caja');
  };

  const handleRemovePartner = async (index: number) => {
    const updated = [...partners];
    updated.splice(index, 1);
    setPartners(updated);
    await saveFinancesState(providerPlans, salePlans, updated);
    toast.info('Socio removido de la plantilla');
  };

  // --- MANEJADORES DEL SISTEMA DE MENSAJERÍA Y VENDEDORES AUTORIZADOS ---
  const handleSendMessageReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedMessageId) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === selectedMessageId) {
        return {
          ...msg,
          estado: 'Resuelto',
          mensaje: `${msg.mensaje}\n\n[ADMIN_RESPONSE]: ${adminReplyText.trim()}`
        };
      }
      return msg;
    }));

    toast.success('¡Respuesta enviada con éxito! El ticket se ha marcado como Resuelto.');
    setAdminReplyText('');
  };

  const handleChangeMessageStatus = (id: string, newStatus: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, estado: newStatus } : msg));
    toast.success(`Estado del ticket cambiado a: ${newStatus}`);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    if (selectedMessageId === id) setSelectedMessageId(null);
    toast.info('Ticket de reclamo removido del buzón');
  };

  const handleDeriveMessage = (messageId: string, sellerName: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, derivado_a: sellerName, estado: 'En Proceso' };
      }
      return msg;
    }));
    toast.success(`Reclamo derivado exitosamente con: ${sellerName}`);
  };

  const handleClientSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSimMsg.trim()) {
      toast.warning('Escribe el detalle de tu reclamo antes de enviar');
      return;
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      username: clientSimUser.trim() || 'cliente_anonimo',
      tipo: clientSimTipo,
      mensaje: clientSimMsg.trim(),
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      derivado_a: null
    };

    setMessages(prev => [newMsg, ...prev]);
    setSelectedMessageId(newMsg.id); // Autofocus
    setClientSimMsg('');
    toast.success('¡Reclamo cargado con éxito! Se ha disparado la alerta en el buzón IPTV Central.');
  };

  const handleCreateSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerName.trim()) {
      toast.warning('Ingresa el nombre del nuevo vendedor autorizado');
      return;
    }

    const newSeller = {
      id: `vend-${Date.now()}`,
      nombre: newSellerName.trim(),
      tokens_disponibles: Number(newSellerTokens) || 0,
      demos_creadas: 0,
      ganancias_totales: 0,
      forma_pago_permitida: newSellerPayment,
      cuit_o_cbu: newSellerCbu.trim() || 'Sin CBU asignado'
    };

    setVendedoresSoporte(prev => [...prev, newSeller]);
    setSelectedSellerId(newSeller.id);
    setNewSellerName('');
    setNewSellerCbu('');
    setNewSellerTokens('');
    toast.success('Vendedor de tokens registrado en la red XTV');
  };

  const handleDeleteSeller = (id: string) => {
    setVendedoresSoporte(prev => prev.filter(v => v.id !== id));
    toast.info('Vendedor revocado del sistema');
  };

  const handleToggleSellerPayment = (id: string) => {
    setVendedoresSoporte(prev => prev.map(v => {
      if (v.id === id) {
        const nextPayment = v.forma_pago_permitida === 'Efectivo Autorizado' 
          ? 'Solo Transferencia Directa' 
          : 'Efectivo Autorizado';
        return { ...v, forma_pago_permitida: nextPayment };
      }
      return v;
    }));
    toast.success('Vía de cobro del distribuidor actualizada');
  };

  const handleAddTokensToSeller = (id: string, amount: number) => {
    setVendedoresSoporte(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, tokens_disponibles: Math.max(0, v.tokens_disponibles + amount) };
      }
      return v;
    }));
    toast.success(`Saldo del distribuidor ajustado en ${amount > 0 ? '+' : ''}${amount} tokens`);
  };

  // CALCULADORA DE MÉTRICAS FINANCIERAS REALES ACORDE A CLIENTES ACTIVOS
  const calculateRealFinances = () => {
    let totalRevenue = 0;
    let totalCost = 0;
    let accountsCovered = 0;

    accounts.forEach(acc => {
      // Solo sumamos ingresos/costos de cuentas activas y no vencidas para representar realidades de caja
      const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < new Date() : false;
      
      const provPlan = providerPlans.find(p => p.id === acc.id_plan_proveedor);
      const salePlan = salePlans.find(p => p.id === acc.id_plan_venta);

      // Si tiene planes asignados, calculamos
      if (provPlan) {
        totalCost += provPlan.cost;
      } else {
        // Fallback usando precio estimado
        totalCost += (acc.limite_pantallas || 2) * 1500;
      }

      if (salePlan) {
        if (acc.estado === 'Activo' && !vencido) {
          totalRevenue += salePlan.price;
          // Sumamos las comisiones del vendedor y referente al costo para deducirlas de la ganancia limpia de caja
          const comVendedor = salePlan.comision_vendedor != null ? salePlan.comision_vendedor : (salePlan.comision || 0);
          const comReferente = salePlan.comision_referente || 0;
          totalCost += (comVendedor + comReferente);
        }
      } else {
        if (acc.estado === 'Activo' && !vencido) {
          totalRevenue += 5000;
        }
      }
      accountsCovered++;
    });

    // --- CÁLCULO TRADUCIDO DE INVERSIÓN EN DÓLARES (MAYORISTA / APPS) ---
    // Paquete original en USD convertido a ARS pesos
    const packageInPesos = tokenPackageUsd * dollarRate;
    
    // Aplicando descuento por Binance o si nos dan un % extra de tokens de compensación (bonus_tokens)
    let packageAfterDiscount = packageInPesos;
    if (pkgAdjustmentType === 'discount') {
      packageAfterDiscount = packageInPesos * (1 - paymentDiscount / 100);
    } else {
      // Si nos compensan con tokens extra de regalo, pagamos el 100% en pesos del pack,
      // pero el valor real por token individual disminuye.
      packageAfterDiscount = packageInPesos; 
    }

    // Mas impuestos del 21% (si no están ya aclarados/incluidos)
    const packageWithTaxes = pkgTaxIncluded 
      ? packageAfterDiscount 
      : packageAfterDiscount * (1 + 21 / 100);
    
    // Gastos operacionales de mantenimiento dinámicos en pesos (calculados por sumatoria manual)
    const operExpensesFees = customExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Costo total mayorista y operacionales a descontar de la recaudación
    const realTotalExpenses = totalCost + packageWithTaxes + operExpensesFees;

    // Ganancia limpia a dividir
    const netProfit = totalRevenue - realTotalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const splits = partners.map(p => {
      const pPercent = p.percent || 0;
      const grossAmount = netProfit > 0 ? (netProfit * pPercent) / 100 : 0;
      const advances = p.advances || 0;
      const netToPay = grossAmount - advances;

      return {
        name: p.name,
        percent: pPercent,
        amount: grossAmount,
        advances: advances,
        netToPay: netToPay,
        role: p.role || 'Socio'
      };
    });

    return {
      revenue: totalRevenue,
      cost: totalCost,
      packageTranslation: {
        packageInPesos,
        packageAfterDiscount,
        packageWithTaxes,
        operExpensesFees,
        realTotalExpenses
      },
      profit: netProfit,
      margin: margin,
      splits,
      accountsCount: accountsCovered
    };
  };

  const realFinanceStats = calculateRealFinances();

  // Filtrado de cuentas
  const activeSourceAccounts = viewSource === 'api' ? apiAccounts : accounts;

  const filteredAccounts = activeSourceAccounts.filter(acc => {
    const matchesSearch = acc.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (acc.comentarios || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          acc.url_panel_asignada.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'todos') return matchesSearch;
    
    const vencido = acc.fecha_vencimiento ? new Date(acc.fecha_vencimiento) < new Date() : false;
    if (statusFilter === 'Vencido') return matchesSearch && vencido;
    if (statusFilter === 'Activo') return matchesSearch && acc.estado === 'Activo' && !vencido;
    return matchesSearch && acc.estado === statusFilter;
  });

  // Helpers estéticos de fecha
  const formatCompactDate = (isoString: string | null) => {
    if (!isoString) return 'De por vida';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'De por vida';
    }
  };

  const checkVencido = (isoString: string | null) => {
    if (!isoString) return false;
    return new Date(isoString) < new Date();
  };

  // Whatsapp de contacto de la base de configuracion
  const supportContactInfo = "+54 9 11 3245-8899";

  return (
    <div id="iptv_central_container" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-0 pb-16">
      
      {/* HEADER DE CONTROL */}
      <div id="iptv_header" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* PARTE SUPERIOR: TÍTULO Y MÉTRICAS */}
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-150 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-sm">
              <Tv size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">IPTV XTV Central</h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* COTIZACIÓN DEL DÓLAR BLUE (API) */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/40 to-teal-50/40 dark:from-slate-950/40 dark:to-slate-900/40 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all group shrink-0 select-none">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp size={14} className={fetchingDollar ? "animate-spin" : ""} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest leading-none">DÓLAR BLUE API</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5 leading-none">
                    ${dollarRate.toLocaleString('es-ES')} ARS
                  </span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-250 dark:bg-slate-800" />
              <button
                onClick={fetchDollarRate}
                disabled={fetchingDollar}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                title="Sincronizar cotización actual con la API"
              >
                <RefreshCw size={12} className={fetchingDollar ? "animate-spin text-emerald-500" : ""} />
              </button>
            </div>

            {/* CRÉDITOS LIVE API DE XUI.ONE */}
            <div className={`flex flex-col md:flex-row md:items-center gap-3 border px-4 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all shrink-0 select-none ${
              isXuiConnected 
                ? 'bg-gradient-to-r from-indigo-50/50 to-amber-50/50 dark:from-slate-950/50 dark:to-slate-900/30 border-slate-200 dark:border-slate-800' 
                : 'bg-red-55/40 border-red-200/50 dark:bg-red-950/5 dark:border-red-900/40'
            }`}>
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isXuiConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isXuiConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest leading-none">CRÉDITOS API (VIVO)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-black text-slate-850 dark:text-white font-mono leading-none">
                      {isXuiConnected && apiCredits !== null ? apiCredits : '---'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 leading-none">
                      {isXuiConnected ? 'disp.' : 'Error'}
                    </span>
                  </div>
                </div>
                
                {!isXuiConnected && xuiErrorMsg && (
                  <div className="group relative">
                    <span className="cursor-help px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-[9px] font-black uppercase animate-pulse">
                      🔎 Diagnóstico Error
                    </span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl border border-red-500/30 hidden group-hover:block z-50 pointer-events-auto leading-normal">
                      <div className="font-extrabold text-red-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1">
                        ⚠️ ERROR DE COMUNICACIÓN
                      </div>
                      <p className="whitespace-pre-line text-slate-300">{xuiErrorMsg}</p>
                      <div className="mt-2 text-[9px] text-slate-450 font-bold bg-slate-950 p-1.5 rounded border border-slate-800">
                        Sugerencia: Revisa la URL externa, tus Token Reseller, claves o el estado del panel IPTV.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="hidden md:block h-6 w-px bg-slate-250 dark:bg-slate-800" />
              
              <button
                onClick={(e) => { e.stopPropagation(); syncLiveCredits(false); }}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center self-center"
                title="Actualizar créditos en vivo del panel ahora"
              >
                <RefreshCw size={12} className="hover:rotate-180 transition-transform duration-300" />
              </button>

              <div className="hidden md:block h-6 w-px bg-slate-250 dark:bg-slate-800" />
              
              <div className="text-right">
                <span className="text-[9px] font-black uppercase text-emerald-500 block tracking-widest leading-none">
                  {isXuiConnected ? 'VALOR ARS' : 'ESTADO ENLACE'}
                </span>
                <span className={`text-xs font-black block font-mono mt-0.5 leading-none ${isXuiConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {isXuiConnected && apiCredits !== null
                    ? `$${Math.round(apiCredits * (creditsPerPack > 0 ? (tokenPackageUsd / creditsPerPack) * dollarRate : 1285)).toLocaleString('es-ES')}`
                    : 'Desconectado'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR: NAVEGACIÓN EN PESTAÑAS (Fila Dedicada y Responsiva de Máxima legibilidad) */}
        <div className="bg-slate-50 dark:bg-slate-950 p-2 overflow-x-auto custom-scrollbar">
          <div className="flex gap-1.5 min-w-[720px] lg:min-w-0">
            {isTabAllowed('clientes') && (
              <button
                id="tab_clientes"
                onClick={() => setActiveTab('clientes')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  activeTab === 'clientes' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border-slate-200/80 dark:border-slate-800 outline-none font-black' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 border-transparent hover:bg-white/50 dark:hover:bg-slate-900/30'
                }`}
                title="Ver listado unificado de cuentas, perfiles e interconexiones activas en la app"
              >
                <Users size={14} className={activeTab === 'clientes' ? 'text-slate-900 dark:text-white' : 'text-slate-400'} /> Clientes
              </button>
            )}
            {isTabAllowed('finanzas') && (
              <button
                id="tab_finanzas"
                onClick={() => setActiveTab('finanzas')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  activeTab === 'finanzas' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border-slate-200/80 dark:border-slate-800 outline-none font-black' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 border-transparent hover:bg-white/50 dark:hover:bg-slate-900/30'
                }`}
                title="Consolidar ingresos mayoristas y minoristas mediante el cálculo de planes reales"
              >
                <Coins size={14} className={activeTab === 'finanzas' ? 'text-slate-900 dark:text-white' : 'text-slate-400'} /> Finanzas y Socios
              </button>
            )}
            {isTabAllowed('mensajes') && (
              <button
                id="tab_mensajes"
                onClick={() => setActiveTab('mensajes')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  activeTab === 'mensajes' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border-slate-200/80 dark:border-slate-800 outline-none font-black' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 border-transparent hover:bg-white/50 dark:hover:bg-slate-900/30'
                }`}
                title="Personalizar plantillas dinámicas de entrega y soporte para clientes de XTV"
              >
                <MessageSquare size={14} className={activeTab === 'mensajes' ? 'text-slate-900 dark:text-white' : 'text-slate-400'} /> Mensajería & Plantillas XTV
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && accounts.length === 0 && activeTab === 'clientes' ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
          <div className="size-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sincronizando clientes y servicios...</p>
        </div>
      ) : (
        <>
          {/* TABLA CLIENTES */}
          {activeTab === 'clientes' && (
            <div id="iptv_section_clientes" className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start text-left">
              {/* PANEL CENTRAL PRINCIPAL */}
              <div className="lg:col-span-3 space-y-4">

              {/* Filtros superiores */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                
                {/* Buscador */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Filtrar por usuario, DNS o comentario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      title="Teclea para realizar una búsqueda interactiva predictiva"
                    />
                    <Search className="absolute left-3 top-3 text-slate-400" size={15} />
                  </div>

                  {/* Switcher de origen de datos */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700 select-none">
                    <button
                      type="button"
                      onClick={() => setViewSource('local')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                        viewSource === 'local'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <Database size={11} /> Base Local ({accounts.length})
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setViewSource('api');
                        if (apiAccounts.length === 0) {
                          await fetchApiAccounts(false);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                        viewSource === 'api'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <Globe size={11} /> API Panel ({apiAccounts.length > 0 ? apiAccounts.length : 'Sincro'})
                    </button>
                  </div>

                  {viewSource === 'api' && (
                    <button
                      type="button"
                      onClick={() => fetchApiAccounts(false)}
                      disabled={isFetchingApiAccounts}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 border dark:border-slate-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw size={12} className={isFetchingApiAccounts ? 'animate-spin' : ''} />
                      Sincronizar
                    </button>
                  )}
                </div>

                {/* Operaciones del Catálogo */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  
                  {/* Selector interactivo de columnas visibles */}
                  <div className="relative inline-block ml-auto md:ml-0">
                    <button
                      onClick={() => setShowColDropdown(!showColDropdown)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-[10px] font-black uppercase cursor-pointer"
                      title="Selecciona cuáles columnas mostrar en la tabla unificada de clientes"
                    >
                      <Sliders size={12} /> Columnas
                    </button>

                    {showColDropdown && (
                      <div className="absolute right-0 md:right-30 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xl w-64 z-50 space-y-2 text-left">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b dark:border-slate-800 flex justify-between items-center">
                          <span>Administrar Columnas</span>
                          <span className="text-[8px] text-slate-300">Orden / Vista</span>
                        </div>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {columnOrder.map((col, index) => {
                            let label = col;
                            if (col === 'username') label = 'Usuario / Línea';
                            else if (col === 'password') label = 'Contraseña';
                            else if (col === 'fullName') label = 'Nombre Cliente';
                            else if (col === 'phone') label = 'Teléfono';
                            else if (col === 'profiles') label = 'Perfiles Hogar';
                            else if (col === 'syncStatus') label = 'Sincronización';
                            else if (col === 'planProv') label = 'Plan Proveedor';
                            else if (col === 'planVenta') label = 'Plan Venta';
                            else if (col === 'dns') label = 'DNS Portal';
                            else if (col === 'pantallas') label = 'Pantallas';
                            else if (col === 'vencimiento') label = 'Vencimiento';
                            else if (col === 'estado') label = 'Estado';
                            else if (col === 'costArs') label = 'Costo Mayorista';
                            else if (col === 'priceArs') label = 'Precio Minorista';
                            else if (col === 'profitArs') label = 'Ganancia Neta';
                            else if (col === 'margin') label = 'Margen Neta (%)';
                            else if (col === 'comentarios') label = 'Notas / Comentarios';
                            else if (col === 'fechaCreacion') label = 'Fecha Registro';
                            else if (col === 'acciones') label = 'Acciones';

                            const moveUp = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (index === 0) return;
                              const newOrder = [...columnOrder];
                              const prev = newOrder[index - 1];
                              newOrder[index - 1] = col;
                              newOrder[index] = prev;
                              setColumnOrder(newOrder);
                              localStorage.setItem('xui_col_order', JSON.stringify(newOrder));
                            };

                            const moveDown = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (index === columnOrder.length - 1) return;
                              const newOrder = [...columnOrder];
                              const next = newOrder[index + 1];
                              newOrder[index + 1] = col;
                              newOrder[index] = next;
                              setColumnOrder(newOrder);
                              localStorage.setItem('xui_col_order', JSON.stringify(newOrder));
                            };

                            return (
                              <div key={col} className="flex items-center justify-between gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-xl group/col transition-colors">
                                <label className="flex items-center gap-2 text-[10.5px] font-bold text-slate-600 dark:text-slate-350 cursor-pointer flex-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={visibleColumns[col]}
                                    onChange={() => {
                                      const nextCols = { ...visibleColumns, [col]: !visibleColumns[col] };
                                      setVisibleColumns(nextCols);
                                      localStorage.setItem('xui_col_visible', JSON.stringify(nextCols));
                                    }}
                                    className="accent-slate-900 rounded"
                                  />
                                  <span>{label}</span>
                                </label>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                  <button
                                    onClick={moveUp}
                                    disabled={index === 0}
                                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-35 cursor-pointer flex items-center justify-center h-4 w-4"
                                    title="Subir columna (Mover a la izquierda)"
                                  >
                                    <ChevronUp size={11} />
                                  </button>
                                  <button
                                    onClick={moveDown}
                                    disabled={index === columnOrder.length - 1}
                                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-35 cursor-pointer flex items-center justify-center h-4 w-4"
                                    title="Bajar columna (Mover a la derecha)"
                                  >
                                    <ChevronDown size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de Limpieza Masiva en la Base de Datos */}
                  <button
                    type="button"
                    onClick={handleCleanupExpiredDemos}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-950/35 border border-amber-200 dark:border-amber-900/50 py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                    title="Detecta de forma automática y elimina todas las cuentas de prueba 'demo' cuya vigencia haya caducado para mantener limpia la base de datos de Supabase"
                  >
                    🧹 Limpiar Demos Expiradas
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanupAllExpired}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/35 border border-rose-200 dark:border-rose-900/50 py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                    title="Detecta de forma automática y elimina todas las cuentas en total de clientes cuya fecha de vencimiento haya expirado para evitar la persistencia de cuentas inactivas"
                  >
                    🧹 Limpiar Vencidos
                  </button>

                  {accounts.some(acc => {
                    const name = (acc.nombre_completo || '').toLowerCase();
                    const user = (acc.username || '').toLowerCase();
                    return name.includes('[test') || name.includes('test-admin') || user.startsWith('vip184668') || user.startsWith('vip563093');
                  }) && (
                    <button
                      type="button"
                      onClick={handlePurgeTestClients}
                      className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/35 border border-red-200 dark:border-red-900/50 py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                      title="Elimina de raíz los clientes de prueba [TEST-ADMIN] de la base de datos"
                    >
                      🗑️ Purgar [TEST-ADMIN]
                    </button>
                  )}

                  {/* Agregar nuevo cliente */}
                  <button
                    type="button"
                    onClick={() => handleOpenAccountModal()}
                    className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                    title="Dar de alta una nueva suscripción mayorista/minorista de televisión digital"
                  >
                    <Plus size={14} /> Nuevo Cliente
                  </button>
                </div>
              </div>

              {/* TABLA PRINCIPAL DE CLIENTES */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        {columnOrder.map(col => {
                          if (!visibleColumns[col]) return null;
                          if (col === 'username') return <th key={col} className="p-4">Usuario / Línea</th>;
                          if (col === 'password') return <th key={col} className="p-4">Contraseña</th>;
                          if (col === 'fullName') return <th key={col} className="p-4">Nombre Cliente</th>;
                          if (col === 'phone') return <th key={col} className="p-4">Teléfono</th>;
                          if (col === 'profiles') return <th key={col} className="p-4">Perfiles Hogar</th>;
                          if (col === 'syncStatus') return <th key={col} className="p-4">Sincronización</th>;
                          if (col === 'dns') return <th key={col} className="p-4">DNS de Entrada</th>;
                          if (col === 'planProv') return <th key={col} className="p-4">Plan Proveedor</th>;
                          if (col === 'planVenta') return <th key={col} className="p-4">Plan Minorista</th>;
                          if (col === 'pantallas') return <th key={col} className="p-4 text-center">Pantallas</th>;
                          if (col === 'vencimiento') return <th key={col} className="p-4">Vencimiento</th>;
                          if (col === 'estado') return <th key={col} className="p-4">Estado</th>;
                          if (col === 'costArs') return <th key={col} className="p-4">Costo Mayorista</th>;
                          if (col === 'priceArs') return <th key={col} className="p-4 bg-indigo-50/10 text-indigo-900 dark:text-indigo-300">Precio Minorista</th>;
                          if (col === 'profitArs') return <th key={col} className="p-4 bg-emerald-50/15 text-emerald-800 dark:text-emerald-400 font-extrabold">Ganancia Neta</th>;
                          if (col === 'margin') return <th key={col} className="p-4 text-center">Margen Neta (%)</th>;
                          if (col === 'comentarios') return <th key={col} className="p-4">Detalle / Notas</th>;
                          if (col === 'fechaCreacion') return <th key={col} className="p-4 text-center">Fecha Alta</th>;
                          if (col === 'acciones') return <th key={col} className="p-4 text-right min-w-[125px] whitespace-nowrap">Acciones</th>;
                          return null;
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="p-10 text-center text-slate-400 font-medium italic">
                            No se encontraron clientes activos para este filtro de visualización.
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map(acc => {
                          const vencido = checkVencido(acc.fecha_vencimiento);
                          const clientProfiles = profiles.filter(p => p.username_cuenta === acc.username);
                          const clientSessions = activeSessions.filter(s => s.username_cuenta === acc.username);
                          const provPlan = providerPlans.find(p => p.id === acc.id_plan_proveedor);
                          const salePlan = salePlans.find(p => p.id === acc.id_plan_venta);

                          return (
                            <tr 
                              key={acc.username}
                              onClick={() => setSelectedClient(acc)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition-colors"
                              title="Toca sobre la fila de la cabecera para abrir la Ficha de Detalle de Cliente Completo"
                            >
                              {columnOrder.map(col => {
                                if (!visibleColumns[col]) return null;

                                if (col === 'username') {
                                  return (
                                    <td key={col} className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${vencido ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                          <Tv size={16} />
                                        </div>
                                        <div>
                                          <span className="font-extrabold text-slate-800 dark:text-white hover:underline block">{acc.username}</span>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }

                                if (col === 'password') {
                                  return (
                                    <td key={col} className="p-4 font-mono text-[11px] text-slate-500">
                                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded select-all font-bold">
                                        {acc.password || '—'}
                                      </span>
                                    </td>
                                  );
                                }

                                if (col === 'fullName') {
                                  return (
                                    <td key={col} className="p-4 flex-nowrap">
                                      {acc.nombre_completo ? (
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                          <User size={13} className="text-slate-400" />
                                          <span>{acc.nombre_completo}</span>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium italic">Sin asignar</span>
                                      )}
                                    </td>
                                  );
                                }

                                if (col === 'phone') {
                                  return (
                                    <td key={col} className="p-4 font-bold text-indigo-500 dark:text-indigo-400 text-[11px]">
                                      {acc.celular ? (
                                        <span>📞 {acc.celular}</span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium italic">—</span>
                                      )}
                                    </td>
                                  );
                                }

                                if (col === 'profiles') {
                                  return (
                                    <td key={col} className="p-4 font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                                      Hogar: {clientProfiles.length} {clientProfiles.length === 1 ? 'perfil' : 'perfiles'}
                                    </td>
                                  );
                                }

                                if (col === 'syncStatus') {
                                  const isSync = acc.api_sincronizado || acc.isFromApi || viewSource === 'api';
                                  return (
                                    <td key={col} className="p-4 whitespace-nowrap">
                                      <div className="flex flex-wrap items-center gap-x-2">
                                        {isSync ? (
                                          <span className="inline-flex items-center gap-1 text-[8.5px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase border border-emerald-200/30 whitespace-nowrap">
                                            ● {viewSource === 'api' ? 'En Panel API' : 'Sinc. XC Real'}
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-1 w-full max-w-[130px] bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-450 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-amber-200/20">
                                            <span className="cursor-help overflow-hidden text-ellipsis whitespace-nowrap" title={acc.api_error_registro || "Se guardó de contingencia de forma local debido a que el panel no respondió."}>
                                              ⚠️ Solo Local
                                            </span>
                                            <button
                                              onClick={(e) => handleRetryApiSync(acc, e)}
                                              className="px-1.5 py-0.2 bg-amber-250 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 transition-colors rounded text-[8.5px] text-amber-900 dark:text-amber-100 cursor-pointer font-black border border-amber-300/30 flex items-center justify-center shrink-0"
                                              title={acc.api_error_registro ? `Fallo: ${acc.api_error_registro}. Toca para reintentar alta física en API` : "Toca para intentar dar de alta física en el panel XC ahora"}
                                            >
                                              Reintentar
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (col === 'dns') {
                                  return (
                                    <td key={col} className="p-4 text-slate-550 dark:text-slate-400 font-mono text-[10.5px]">
                                      {acc.url_panel_asignada}
                                    </td>
                                  );
                                }

                                if (col === 'planProv') {
                                  return (
                                    <td key={col} className="p-4">
                                      <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-350">
                                        {provPlan ? provPlan.name : 'Genérico - 1 Token'}
                                      </span>
                                      {provPlan && <span className="text-[8.5px] font-mono text-slate-400 block font-bold">Costo: ${provPlan.cost}</span>}
                                    </td>
                                  );
                                }

                                if (col === 'planVenta') {
                                  return (
                                    <td key={col} className="p-4">
                                      <span className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200">
                                        {salePlan ? salePlan.name : 'Por Defecto - 1 Mes'}
                                      </span>
                                      {salePlan && <span className="text-[8.5px] font-mono text-indigo-500 block font-black">Precio: ${salePlan.price}</span>}
                                    </td>
                                  );
                                }

                                if (col === 'pantallas') {
                                  return (
                                    <td key={col} className="p-4 text-center">
                                      <div className="flex flex-col items-center gap-0.5 justify-center">
                                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-extrabold text-[10px]" title="Sesiones activas / Límite de venta local">
                                          <span className={`size-1.5 rounded-full ${clientSessions.length > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
                                          {clientSessions.length} / {acc.limite_pantallas || 1}
                                        </div>
                                        <span className="text-[8px] text-slate-400 block font-mono font-bold" title="Límite en la API del proveedor">
                                          API: {(acc as any).limite_pantallas_api || 3}p
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }

                                if (col === 'vencimiento') {
                                  return (
                                    <td key={col} className="p-4 text-[10.5px] font-bold">
                                      <span className={`flex items-center gap-1 ${vencido ? 'text-rose-500 font-black' : 'text-slate-600 dark:text-slate-300'}`}>
                                        <Calendar size={11} /> {formatCompactDate(acc.fecha_vencimiento)}
                                      </span>
                                    </td>
                                  );
                                }

                                if (col === 'estado') {
                                  return (
                                    <td key={col} className="p-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${
                                        vencido 
                                          ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-450' 
                                          : acc.estado === 'Activo' 
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                      }`}>
                                        {vencido ? 'Expirado' : acc.estado}
                                      </span>
                                    </td>
                                  );
                                }

                                if (col === 'costArs') {
                                  const costVal = provPlan ? provPlan.cost : (acc.limite_pantallas || 2) * 1500;
                                  return (
                                    <td key={col} className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                                      ${costVal.toLocaleString('es-AR')}
                                    </td>
                                  );
                                }

                                if (col === 'priceArs') {
                                  const priceVal = salePlan ? salePlan.price : 5000;
                                  return (
                                    <td key={col} className="p-4 font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/5">
                                      ${priceVal.toLocaleString('es-AR')}
                                    </td>
                                  );
                                }

                                if (col === 'profitArs') {
                                  const costVal = provPlan ? provPlan.cost : (acc.limite_pantallas || 2) * 1500;
                                  const priceVal = salePlan ? salePlan.price : 5000;
                                  const comisionVal = salePlan ? ((salePlan.comision_vendedor ?? salePlan.comision ?? 0) + (salePlan.comision_referente ?? 0)) : 0;
                                  const profitVal = priceVal - costVal - comisionVal;
                                  return (
                                    <td key={col} className={`p-4 font-mono text-[11px] font-black bg-emerald-50/5 ${profitVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                      ${profitVal.toLocaleString('es-AR')}
                                    </td>
                                  );
                                }

                                if (col === 'margin') {
                                  const costVal = provPlan ? provPlan.cost : (acc.limite_pantallas || 2) * 1500;
                                  const priceVal = salePlan ? salePlan.price : 5000;
                                  const comisionVal = salePlan ? ((salePlan.comision_vendedor ?? salePlan.comision ?? 0) + (salePlan.comision_referente ?? 0)) : 0;
                                  const profitVal = priceVal - costVal - comisionVal;
                                  const marginPct = priceVal > 0 ? Math.round((profitVal / priceVal) * 100) : 0;
                                  return (
                                    <td key={col} className="p-4 text-center font-mono text-[10.5px] font-bold">
                                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                                        marginPct >= 50 
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                          : marginPct >= 20 
                                            ? 'bg-amber-50 text-amber-700' 
                                            : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        {marginPct}%
                                      </span>
                                    </td>
                                  );
                                }

                                if (col === 'comentarios') {
                                  return (
                                    <td key={col} className="p-4 text-slate-500 max-w-[150px] truncate text-[10.5px] italic" title={acc.comentarios || ""}>
                                      {acc.comentarios || '—'}
                                    </td>
                                  );
                                }

                                if (col === 'fechaCreacion') {
                                  return (
                                    <td key={col} className="p-4 text-center font-mono text-slate-500 text-[10px]">
                                      {acc.fecha_creacion ? formatCompactDate(acc.fecha_creacion) : '—'}
                                    </td>
                                  );
                                }

                                if (col === 'acciones') {
                                  return (
                                    <td key={col} className="p-4 text-right min-w-[125px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleOpenCredentialsModal(acc)}
                                          className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                                          title="Ver, copiar o enviar leyenda de credenciales para este cliente"
                                        >
                                          <MessageSquare size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleOpenAccountModal(acc)}
                                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                          title="Editar configuración y planes de cobro para este cliente"
                                        >
                                          <Edit size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteClient(acc.username)}
                                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer animate-none"
                                          title="Dar de baja y eliminar permanentemente las credenciales e historial"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  );
                                }
                                return null;
                              })}
                            </tr>
                          );
                        })
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
              </div>
              
              {/* COLUMNA LATERAL: AUDITORÍA DE REGISTROS DE INTEGRIDAD */}
              <div id="auditor_sidebar_widget" className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-left">
                  <div className="border-b dark:border-slate-800 pb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-red-500" /> Auditoría de Integridad
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-1">
                      Verifica las discrepancias de cuentas cargadas en XTV contra el panel de control Xtream/XUI.ONE.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Tarjeta Supabase (XTV) */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-500 p-1 rounded-lg">
                        <Database size={13} />
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-bold">Supabase (XTV)</span>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white font-mono mt-1">{accounts.length}</h4>
                      </div>
                      <span className="text-[9.5px] text-slate-500 font-bold mt-2">Usuarios Locales</span>
                    </div>

                    {/* Tarjeta API Xtream / XC Reseller */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-500 p-1 rounded-lg">
                        <Activity size={13} />
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-bold">XC Reseller / Multi Panel</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="number"
                            min="0"
                            value={xuiApiUsersCount}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setXuiApiUsersCount(val);
                              localStorage.setItem('xui_api_users_count', String(val));
                            }}
                            className="bg-transparent text-3xl font-black text-slate-800 dark:text-white font-mono focus:outline-none w-16 border-b border-dashed border-slate-300 dark:border-slate-700"
                            title="Valor recuperable via API. Edítalo directamente para simular desajustes de base de datos."
                          />
                          <span className="text-[10px] font-bold text-slate-400">regs.</span>
                        </div>
                      </div>
                      <span className="text-[9.5px] text-slate-500 font-bold mt-2">API Remota / Líneas</span>
                    </div>
                  </div>

                  {/* Estado diagnóstico intermédio */}
                  <div className={`p-3.5 rounded-2xl text-[10px] leading-relaxed font-bold border transition-all ${
                    accounts.length === xuiApiUsersCount
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-900/40'
                      : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-900/40 animate-pulse'
                  }`}>
                    <div className="flex gap-2 text-left">
                      <span className="text-xl leading-none">{accounts.length === xuiApiUsersCount ? '🛡️' : '🚨'}</span>
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold uppercase tracking-wide">
                          {accounts.length === xuiApiUsersCount ? 'Integridad Óptima' : 'Desajuste Detectado'}
                        </h5>
                        <p className="font-semibold">
                          {accounts.length === xuiApiUsersCount
                            ? 'Ambos registros están exactamente sincronizados. Ninguna discrepancia hallada.'
                            : '¡Las cifras no coinciden! Esto indica la existencia de cuentas fantasmas creadas por fuera en la API.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 leading-normal bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-center border dark:border-slate-850 font-bold">
                    💡 <strong>Simulación Interactiva:</strong> Si agregas un cliente en este panel, se sumará a ambos. Edita el input de arriba para simular una adición directa en el XC Reseller sin cargar en XTV.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABLA METRICAS FINANCIERAS Y SOCIOS */}
          {activeTab === 'finanzas' && (
            <div id="iptv_section_finanzas" className="space-y-6">
              
              {/* MATRIZ DE COSTOS Y COMISIONES POR CRÉDITO (AUTOMATIZACIÓN DE PRECIOS) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                      <Coins size={15} className="text-amber-500" /> Matriz de Costos y Comisiones por Crédito
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">
                      Define los valores fijos por cada crédito consumido. Se utilizarán para calcular automáticamente el precio minorista y comisiones de todos los planes.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSaveCreditFinances}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Guardar la matriz en base de datos y memoria permanente"
                    >
                      <Save size={12} /> Guardar Matriz
                    </button>
                    <button
                      onClick={handleRecalculateAllSalePlans}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Recalcular precios de venta, comisiones y pantallas de todos tus planes minoristas según esta matriz"
                    >
                      <Zap size={12} /> Auto-Calcular Planes
                    </button>
                  </div>
                </div>

                {/* 4 CAMPOS DE COSTO Y COMISIONES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Costo Compra por Crédito */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-rose-700 dark:text-rose-400">1. Costo Crédito</span>
                      <span className="text-[8px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded uppercase">Proveedor</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={costoCredito}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setCostoCredito(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 text-xs font-mono font-black text-rose-700 dark:text-rose-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Lo que pagas a tu proveedor por cada 1 crédito consumido.
                    </p>
                  </div>

                  {/* 2. Mi Ganancia / Comisión Admin */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-emerald-700 dark:text-emerald-400">2. Ganancia Neta</span>
                      <span className="text-[8px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded uppercase">Tu Comisión</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={comisionAdministrador}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setComisionAdministrador(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Tu beneficio limpio asegurado por cada crédito consumido.
                    </p>
                  </div>

                  {/* 3. Comisión Vendedor */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-amber-700 dark:text-amber-400">3. Comis. Vendedor</span>
                      <span className="text-[8px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">Venta Directa</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={comisionVendedorGlobal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setComisionVendedorGlobal(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800 text-xs font-mono font-black text-amber-700 dark:text-amber-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Ganancia para el revendedor por cada crédito que venda.
                    </p>
                  </div>

                  {/* 4. Comisión Referente */}
                  <div className="bg-sky-50/50 dark:bg-sky-950/20 p-3 rounded-xl border border-sky-200 dark:border-sky-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-sky-700 dark:text-sky-400">4. Comis. Referente</span>
                      <span className="text-[8px] bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded uppercase">Patrocinador</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={comisionReferenteGlobal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setComisionReferenteGlobal(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-950 border border-sky-300 dark:border-sky-800 text-xs font-mono font-black text-sky-700 dark:text-sky-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Ganancia para el líder/patrocinador por cada crédito.
                    </p>
                  </div>
                </div>

                {/* RESUMEN INTEGRADO DEL PRECIO MINORISTA DEL CRÉDITO */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-emerald-500" /> Precio Minorista Final Resultante por 1 Crédito
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        ${((Number(costoCredito) || 0) + (Number(comisionAdministrador) || 0) + (Number(comisionVendedorGlobal) || 0) + (Number(comisionReferenteGlobal) || 0)).toLocaleString('es-AR')}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">ARS / crédito</span>
                    </div>
                  </div>

                  {/* DESGLOSE DINÁMICO */}
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                      Costo: <strong>${(Number(costoCredito) || 0).toLocaleString('es-AR')}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">+</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                      Ganancia: <strong>${(Number(comisionAdministrador) || 0).toLocaleString('es-AR')}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">+</span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                      Vendedor: <strong>${(Number(comisionVendedorGlobal) || 0).toLocaleString('es-AR')}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">+</span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-100/70 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50">
                      Referente: <strong>${(Number(comisionReferenteGlobal) || 0).toLocaleString('es-AR')}</strong>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* CONTENEDOR DE PLANES DE PROVEEDOR Y MINORISTAS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-none">
                
                {/* 1. SECCIÓN PLANES DEL PROVEEDOR (MAYORISTA / DE LA API) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                        <Activity size={14} className="text-rose-500" /> Módulos del Proveedor (Catálogo API)
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">
                        Muestra los paquetes disponibles obtenidos desde tu panel XC Reseller - Multi Panel.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => syncXuiPackages(false)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                        title="Conectar y descargar en vivo los paquetes desde el panel configurado"
                      >
                        <RefreshCw size={11} className="animate-none" /> Sincronizar
                      </button>
                      <button
                        onClick={() => handleOpenPlanForm('provider')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                        title="Registrar un módulo o paquete del proveedor de forma manual"
                      >
                        <Plus size={11} /> Añadir
                      </button>
                    </div>
                  </div>

                  {/* CONTENEDOR SROLL INFINITO / COMPACTO PARA 10 ELEMENTOS */}
                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                    {/* FILA 1: PAQUETES DEMO (PRUEBAS / CERO CRÉDITOS) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="size-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                          1. Paquetes Demo (Cero Créditos)
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'demo').length} disponibles</span>
                      </div>

                      {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'demo').length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-medium p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border dark:border-slate-850">No hay paquetes Demo cargados.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'demo').map(plan => {
                            const matchedCost = plan.provider_cost_id ? providerCosts.find(c => c.id === plan.provider_cost_id) : null;
                            return (
                              <div key={plan.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${plan.archived ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40 opacity-80' : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                <div>
                                  <span className="text-xs font-black text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5 font-mono">
                                    {plan.name}
                                    {matchedCost && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-emerald-50 dark:bg-emerald-955/35 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black tracking-widest leading-none">
                                        {matchedCost.proveedor}
                                      </span>
                                    )}
                                    {plan.archived && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black tracking-widest leading-none font-mono">
                                        Archivado
                                      </span>
                                    )}
                                    {plan.is_official === 1 && (
                                      <span className="px-1.5 py-0.5 rounded text-[7.5px] uppercase bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-extrabold tracking-wider leading-none font-mono border border-blue-200 dark:border-blue-900/40">
                                        API Oficial
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[9px] text-slate-450 block font-medium mt-0.5">
                                    {plan.hours && plan.hours > 0 ? `${plan.hours} Horas` : plan.months === 0 ? 'Sin límite (Prueba horas)' : `${plan.months} Meses`} · {plan.screens} Conexiones simultáneas · ID: {plan.id}
                                  </span>
                                  {plan.groups && plan.groups.length > 0 && (
                                    <span className="text-[8.5px] text-indigo-500 dark:text-indigo-400 block font-mono font-bold mt-0.5 uppercase tracking-wide">
                                      Grupos Asignados: [{plan.groups.join(', ')}]
                                    </span>
                                  )}
                                  {matchedCost && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-black mt-1 uppercase tracking-wider">
                                      Enlazado a: <strong className="text-emerald-500 dark:text-emerald-500 font-black">{matchedCost.proveedor || '(Sin Nombre)'}</strong> · {matchedCost.plan || '(Sin Plan)'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono font-black uppercase">Demo 0 Créd.</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleOpenPlanForm('provider', plan)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-indigo-500 cursor-pointer dark:border-slate-800"
                                      title="Editar"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePlan('provider', plan.id)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-rose-500 cursor-pointer dark:border-slate-800"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* FILA 2: PAQUETES MENSUALES / VIP (CON COSTO DE CRÉDITOS) */}
                    <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/25 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="size-1.5 bg-rose-500 rounded-full inline-block" />
                          2. Paquetes Mensuales / VIP
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'vip').length} disponibles</span>
                      </div>

                      {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'vip').length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-medium p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border dark:border-slate-850">No hay paquetes mensuales regulares cargados.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'vip').map(plan => {
                            const costInArs = getPlanCostInArs(plan.tokens, plan.provider_cost_id);
                            const matchedCost = plan.provider_cost_id ? providerCosts.find(c => c.id === plan.provider_cost_id) : null;
                            return (
                              <div key={plan.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all shadow-sm ${plan.archived ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40 opacity-80' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5">
                                      {plan.name}
                                      {matchedCost && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-emerald-50 dark:bg-emerald-955/35 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black tracking-widest leading-none">
                                          {matchedCost.proveedor}
                                        </span>
                                      )}
                                      {plan.archived && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black tracking-widest leading-none">
                                          Archivado
                                        </span>
                                      )}
                                      {plan.is_official === 1 && (
                                        <span className="px-1.5 py-0.5 rounded text-[7px] uppercase bg-blue-100 dark:bg-blue-955/30 text-blue-700 dark:text-blue-300 font-black tracking-wider leading-none font-mono border border-blue-200 dark:border-blue-900/40">
                                          API Oficial
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-440 block font-medium mt-1">
                                    {plan.hours && plan.hours > 0 ? `${plan.hours} Horas` : `${plan.months} Meses`} · {plan.screens} Conexiones simultáneas · ID: {plan.id}
                                  </span>
                                  {plan.groups && plan.groups.length > 0 && (
                                    <span className="text-[8.5px] text-indigo-500 dark:text-indigo-400 block font-mono font-bold mt-0.5 uppercase tracking-wide">
                                      Grupos Asignados: [{plan.groups.join(', ')}]
                                    </span>
                                  )}
                                  {matchedCost && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-black mt-1 uppercase tracking-wider font-mono">
                                      Enlazado a: <strong className="text-emerald-500 dark:text-emerald-500 font-black">{matchedCost.proveedor || '(Sin Nombre)'}</strong> · {matchedCost.plan || '(Sin Plan)'} 
                                      {matchedCost.creditos > 0 && ` (u$s ${(matchedCost.precio / matchedCost.creditos).toFixed(2)}/créd.)`}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3.5 shrink-0">
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5" title="Asigna los créditos manualmente">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={plan.tokens}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                          handleUpdatePlanTokens(plan.id, val);
                                        }}
                                        className="w-12 text-center py-0.5 px-1 text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-900 focus:outline-none cursor-pointer"
                                      />
                                      <span className="text-[8px] bg-red-100 text-red-600 dark:bg-red-955/30 dark:text-red-400 font-extrabold uppercase px-1.5 py-0.5 rounded font-mono">
                                        Cred.
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono font-black text-rose-500 block">
                                      ${costInArs.toLocaleString('es-ES')} ARS
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleOpenPlanForm('provider', plan)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-indigo-500 cursor-pointer dark:border-slate-800"
                                      title="Editar"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePlan('provider', plan.id)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-rose-500 cursor-pointer dark:border-slate-800"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* FILA 3: PAQUETES XXX (MODIFICADORES / QUITAR O AGREGAR ADULTOS) */}
                    <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/25 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="size-1.5 bg-fuchsia-500 rounded-full inline-block" />
                          3. Paquetes XXX (Adultos / Quitar o Agregar)
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'xxx').length} disponibles</span>
                      </div>

                      {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'xxx').length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-medium p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border dark:border-slate-850">No hay paquetes XXX de adultos en esta sección.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {providerPlans.filter(p => !p.is_bouquet && classifyPlanCategory(p) === 'xxx').map(plan => {
                            const costInArs = getPlanCostInArs(plan.tokens, plan.provider_cost_id);
                            const matchedCost = plan.provider_cost_id ? providerCosts.find(c => c.id === plan.provider_cost_id) : null;
                            return (
                              <div key={plan.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all shadow-sm ${plan.archived ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40 opacity-80' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5">
                                      {plan.name}
                                      {matchedCost && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-emerald-50 dark:bg-emerald-955/35 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black tracking-widest leading-none">
                                          {matchedCost.proveedor}
                                        </span>
                                      )}
                                      {plan.archived && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black tracking-widest leading-none">
                                          Archivado
                                        </span>
                                      )}
                                      {plan.is_official === 1 && (
                                        <span className="px-1.5 py-0.5 rounded text-[7px] uppercase bg-fuchsia-100 dark:bg-fuchsia-955/30 text-fuchsia-700 dark:text-fuchsia-300 font-black tracking-wider leading-none font-mono border border-fuchsia-200 dark:border-fuchsia-900/40">
                                          Pack Adultos
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-440 block font-medium mt-1">
                                    {plan.hours && plan.hours > 0 ? `${plan.hours} Horas` : `${plan.months} Meses`} · {plan.screens} Conexiones simultáneas · ID: {plan.id}
                                  </span>
                                  {matchedCost && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-black mt-1 uppercase tracking-wider font-mono">
                                      Enlazado a: <strong className="text-emerald-500 dark:text-emerald-500 font-black">{matchedCost.proveedor || '(Sin Nombre)'}</strong>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3.5 shrink-0">
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5" title="Asigna los créditos manualmente">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={plan.tokens}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                          handleUpdatePlanTokens(plan.id, val);
                                        }}
                                        className="w-12 text-center py-0.5 px-1 text-[10px] font-black bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded border border-fuchsia-200 dark:border-fuchsia-900 focus:outline-none cursor-pointer"
                                      />
                                      <span className="text-[8px] bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-955/30 dark:text-fuchsia-400 font-extrabold uppercase px-1.5 py-0.5 rounded font-mono">
                                        Cred.
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono font-black text-fuchsia-500 block">
                                      ${costInArs.toLocaleString('es-ES')} ARS
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleOpenPlanForm('provider', plan)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-indigo-500 cursor-pointer dark:border-slate-800"
                                      title="Editar"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePlan('provider', plan.id)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-rose-500 cursor-pointer dark:border-slate-800"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* SUB-SECCIÓN: BOUQUETS DE CANALES (BOUQUET LISTS API) */}
                    <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <span className="size-1.5 bg-indigo-500 rounded-full inline-block" />
                          Bouquets de Canales / Filtros API
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{providerPlans.filter(p => p.is_bouquet).length} disponibles</span>
                      </div>

                      {providerPlans.filter(p => p.is_bouquet).length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-medium p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border dark:border-slate-850">Sincroniza con tu panel para autodescargar los bouquets de la API.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {providerPlans.filter(p => p.is_bouquet).map(plan => {
                            const matchedCost = plan.provider_cost_id ? providerCosts.find(c => c.id === plan.provider_cost_id) : null;
                            return (
                              <div key={plan.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${plan.archived ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40 opacity-80' : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                <div>
                                  <span className="text-xs font-black text-slate-850 dark:text-white flex items-center flex-wrap gap-1.5 font-mono">
                                    {plan.name}
                                    {matchedCost && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-emerald-50 dark:bg-emerald-955/35 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black tracking-widest leading-none">
                                        {matchedCost.proveedor}
                                      </span>
                                    )}
                                    {plan.archived && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black tracking-widest leading-none font-mono">
                                        Archivado
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded text-[7.5px] uppercase bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-extrabold tracking-wider leading-none font-mono border border-indigo-200 dark:border-indigo-900/40">
                                      ID {plan.bouquet_id || plan.id.replace('bouquet_', '')}
                                    </span>
                                  </span>
                                  <span className="text-[9px] text-slate-450 block font-medium mt-0.5">
                                    Línea de canales del proveedor · Asigna categorías autorizadas en la creación de líneas.
                                  </span>
                                  {matchedCost && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-black mt-1 uppercase tracking-wider">
                                      Enlazado a: <strong className="text-emerald-500 dark:text-emerald-500 font-black">{matchedCost.proveedor || '(Sin Nombre)'}</strong> · {matchedCost.plan || '(Sin Plan)'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] bg-indigo-150 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-mono font-black uppercase">Canales</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleOpenPlanForm('provider', plan)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-indigo-500 cursor-pointer dark:border-slate-800"
                                      title="Editar"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePlan('provider', plan.id)}
                                      className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded border hover:text-rose-500 cursor-pointer dark:border-slate-800"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN PLANES DE VENTA (MINORISTA) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-850 dark:text-slate-200 tracking-wider flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" /> Tus Planes de Venta (Minorista)
                      </h4>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-medium mt-0.5">
                        Define los planes que comercializas y gestiona de forma autónoma la capacidad de dispositivos.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => syncXuiPackages(false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black p-2.5 rounded-xl text-[9px] uppercase flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        title="Duplicar paquetes del proveedor y autocalibrar precios en base a la Matriz de Costos por Crédito"
                      >
                        <Sparkles size={12} /> Duplicar y Calibrar
                      </button>
                      <button
                        onClick={() => handleOpenPlanForm('sale')}
                        className="bg-slate-950 hover:bg-slate-850 text-white p-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                        title="Agregar un nuevo combo minorista de reventa"
                      >
                        <Plus size={11} /> Registrar Combo
                      </button>
                    </div>
                  </div>

                  {/* CONTENEDOR COMPACTO PARA ELEMENTOS EN 3 FILAS */}
                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                    {salePlans.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic font-medium p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-dashed">No tienes configurado ningún combo minorista aún. Haz clic en "Duplicar y Calibrar" para generarlos a partir de los paquetes del proveedor.</p>
                    ) : (
                      <>
                        {/* Mini Resumen de Rentabilidad del Catálogo Minorista */}
                        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-850/60 text-center font-mono text-[9px]">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block font-bold">TOTAL PLANES</span>
                            <span className="font-black text-slate-800 dark:text-white">{salePlans.length} ({salePlans.filter(p => p.visible !== false).length} visibles)</span>
                          </div>
                          <div className="space-y-0.5 border-x dark:border-slate-800">
                            <span className="text-slate-400 block font-bold">VTA PROM.</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-450">
                              ${Math.round(salePlans.reduce((sum, p) => sum + p.price, 0) / salePlans.length).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block font-bold">EXCEDENTES</span>
                            <span className="font-black text-rose-500">
                              {salePlans.filter(p => {
                                const matched = p.provider_plan_id ? providerPlans.find(prov => String(prov.id) === String(p.provider_plan_id)) : null;
                                return matched && p.screens > matched.screens;
                              }).length} pág.
                            </span>
                          </div>
                        </div>

                        {/* RENDERIZADO DE LAS 3 FILAS / CATEGORÍAS */}
                        {([
                          { 
                            catId: 'demo', 
                            title: '1. Planes Demo (Pruebas Gratuitas)', 
                            color: 'text-emerald-600 dark:text-emerald-400', 
                            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                            dot: 'bg-emerald-500',
                            emptyText: 'No hay planes Demo configurados.'
                          },
                          { 
                            catId: 'vip', 
                            title: '2. Planes Mensuales / VIP (Venta Regular)', 
                            color: 'text-indigo-600 dark:text-indigo-400', 
                            bg: 'bg-indigo-50 dark:bg-indigo-950/20',
                            dot: 'bg-indigo-500',
                            emptyText: 'No hay planes mensuales configurados.'
                          },
                          { 
                            catId: 'xxx', 
                            title: '3. Paquetes XXX (Adultos / Extras)', 
                            color: 'text-fuchsia-600 dark:text-fuchsia-400', 
                            bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
                            dot: 'bg-fuchsia-500',
                            emptyText: 'No hay paquetes para agregar/quitar adultos.'
                          }
                        ] as const).map(section => {
                          const items = salePlans.filter(p => classifyPlanCategory(p) === section.catId);
                          return (
                            <div key={section.catId} className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${section.color} ${section.bg} px-2.5 py-1 rounded-lg flex items-center gap-1`}>
                                  <span className={`size-1.5 ${section.dot} rounded-full inline-block`} />
                                  {section.title}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">
                                  {items.length} planes ({items.filter(p => p.visible !== false).length} activos)
                                </span>
                              </div>

                              {items.length === 0 ? (
                                <p className="text-[9.5px] text-slate-400 italic p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border dark:border-slate-850">
                                  {section.emptyText}
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                  {items.map(plan => {
                                    const originalPkg = plan.provider_plan_id ? providerPlans.find(p => String(p.id) === String(plan.provider_plan_id)) : null;
                                    const isManualPlan = !plan.provider_plan_id;
                                    const isTrialPkg = originalPkg ? (originalPkg.is_trial || !originalPkg.tokens || Number(originalPkg.tokens) === 0 || originalPkg.id === "1" || originalPkg.id === "2") : false;
                                    const isOrphaned = plan.provider_plan_id ? (!originalPkg || (originalPkg.archived && !isTrialPkg)) : false;
                                    
                                    const selectedConnsApi = plan.screens_api || (originalPkg ? originalPkg.screens || 1 : 1);
                                    const computedCredits = originalPkg ? calculateApiCreditCost(originalPkg, selectedConnsApi) : 0;
                                    const costInArs = originalPkg ? getPlanCostInArs(computedCredits, originalPkg.provider_cost_id) : 0;
                                    const comisionVendedor = plan.comision_vendedor != null ? plan.comision_vendedor : (plan.comision || 0);
                                    const comisionReferente = plan.comision_referente || 0;
                                    const totalComisiones = comisionVendedor + comisionReferente;
                                    const profit = plan.price - costInArs - totalComisiones;
                                    const hasProfit = profit > 0;
                                    const roi = costInArs > 0 ? Math.round((profit / costInArs) * 100) : 100;
                                    const hasScreenExceeded = originalPkg && plan.screens > selectedConnsApi;
                                    const isVisible = plan.visible !== false;
                                    
                                    const realMaxConnections = originalPkg ? Number(originalPkg.multiple_connections != null ? originalPkg.multiple_connections : (originalPkg.max_connections || originalPkg.screens || 1)) : 1;
                                    const isApiLimitViolated = originalPkg && selectedConnsApi > realMaxConnections;

                                    return (
                                      <div key={plan.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all gap-3 ${
                                        !isVisible
                                          ? "opacity-60 bg-slate-100/70 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800"
                                          : isOrphaned 
                                          ? "bg-red-500/10 dark:bg-red-950/30 border-red-500 dark:border-red-500/60 shadow-md ring-1 ring-red-500/30" 
                                          : isApiLimitViolated 
                                          ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/40 shadow-sm" 
                                          : "bg-slate-50 dark:bg-slate-950/45 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                                      }`}>
                                        <div className="space-y-1 min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-xs font-black ${isOrphaned ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-white"}`}>{plan.name}</span>
                                            
                                            {/* Toggle de Visibilidad en Creación de Cuentas */}
                                            <button
                                              type="button"
                                              onClick={() => handleTogglePlanVisibility(plan.id)}
                                              className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                                                isVisible
                                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-300'
                                              }`}
                                              title={isVisible ? 'Visible en creación de cuentas (Clic para ocultar)' : 'Oculto en creación de cuentas (Clic para activar)'}
                                            >
                                              {isVisible ? <Eye size={10} className="text-emerald-500" /> : <EyeOff size={10} className="text-slate-400" />}
                                              <span>{isVisible ? 'Visible' : 'Oculto'}</span>
                                            </button>

                                            {isManualPlan ? (
                                              <span className="text-[7.5px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 px-1.5 py-0.5 rounded font-extrabold uppercase" title="Plan de venta manual libre de vínculos API">
                                                Creación Libre
                                              </span>
                                            ) : originalPkg && !isOrphaned ? (
                                              <span className="text-[7.5px] bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-extrabold uppercase" title={`Enlazado a la API: ${originalPkg.name}`}>
                                                API: {originalPkg.name} {originalPkg.archived && "(Demo Siempre Activo)"}
                                              </span>
                                            ) : (
                                              <span className="text-[8px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse shadow-sm flex items-center gap-1" title="El paquete vinculado fue eliminado o descontinuado por el proveedor en el panel XC">
                                                🚫 DESCONTINUADO / HUÉRFANO
                                              </span>
                                            )}

                                            {hasScreenExceeded && (
                                              <span className="text-[7.5px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase" title="Vendes más conexiones de las que el pack del proveedor soporta de raíz (XUI)">
                                                Excedente Disp.
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-[9px] text-slate-400 space-y-0.5 font-medium font-mono leading-tight">
                                            <p>
                                              Duración: <strong className="text-slate-650 dark:text-slate-300 font-bold">
                                                {plan.hours && plan.hours > 0 ? `${plan.hours} Hs` : plan.months === 0 ? "Prueba horas" : `${plan.months} meses`}
                                              </strong>
                                              {' · '}
                                              Pantallas: <strong className="text-rose-500 font-bold">{plan.screens}</strong>
                                            </p>

                                            {originalPkg && !isOrphaned && (
                                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 mt-1 border-t border-dashed border-slate-200 dark:border-slate-850">
                                                <span className="text-[8px] text-slate-400 uppercase">Finanzas:</span>
                                                <span className="text-[8.5px] text-slate-550 dark:text-slate-400">Costo: <strong className="text-rose-500 font-bold">${costInArs.toLocaleString("es-ES")}</strong></span>
                                                {totalComisiones > 0 && (
                                                  <span className="text-[8.5px] text-slate-550 dark:text-slate-400 font-mono">
                                                    Comisiones: {comisionVendedor > 0 && <strong className="text-amber-500 font-bold" title="Comisión vendedor de la línea">${comisionVendedor.toLocaleString("es-ES")} (Vend.)</strong>} {comisionReferente > 0 && <strong className="text-sky-500 font-bold" title="Comisión usuario referente">${comisionReferente.toLocaleString("es-ES")} (Ref.)</strong>}
                                                  </span>
                                                )}
                                                <span className="text-[8.5px] text-slate-550 dark:text-slate-400">Ganancia Neta: <strong className={`${hasProfit ? "text-emerald-500" : "text-slate-500"} font-black`}>${profit.toLocaleString("es-ES")}</strong></span>
                                                {costInArs > 0 && (
                                                  <span className={`text-[8.5px] px-1 rounded-md font-bold uppercase leading-none ${roi > 100 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400"}`}>
                                                    +{roi}% ROI
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                          {/* Reordenar posición */}
                                          <div className="flex flex-col gap-0.5">
                                            <button
                                              type="button"
                                              onClick={() => handleMoveSalePlan(plan.id, 'up', section.catId)}
                                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
                                              title="Mover arriba en el catálogo y desplegables"
                                            >
                                              <ChevronUp size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleMoveSalePlan(plan.id, 'down', section.catId)}
                                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
                                              title="Mover abajo en el catálogo y desplegables"
                                            >
                                              <ChevronDown size={12} />
                                            </button>
                                          </div>

                                          <span className={`text-[11px] font-mono font-black px-2.5 py-1.5 rounded-xl border shadow-sm ${isOrphaned ? "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 line-through opacity-75" : "text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40"}`}>
                                            ${plan.price.toLocaleString("es-ES")} Venta
                                          </span>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => handleOpenPlanForm('sale', plan)}
                                              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg border hover:text-indigo-500 cursor-pointer dark:border-slate-800"
                                              title="Editar nombre, precio o visibilidad"
                                            >
                                              <Edit size={11} />
                                            </button>
                                            <button
                                              onClick={() => handleDeletePlan('sale', plan.id)}
                                              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg border hover:text-rose-500 cursor-pointer dark:border-slate-800"
                                              title="Eliminar"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* COSTOS DE PROVEEDORES */}
              <div id="iptv_costos_proveedores_isla" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div className="border-b dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <DollarSign size={16} className="text-rose-500" /> COSTOS DE PROVEEDORES
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                      Gestiona de raíz los valores de costo por proveedor y plan. La información se almacena con un identificador único (UUID).
                    </p>
                  </div>
                  <div className="flex gap-2 text-right shrink-0">
                    <button
                      onClick={fetchDollarRate}
                      disabled={fetchingDollar}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 hover:shadow-sm"
                    >
                      <RefreshCw size={11} className={fetchingDollar ? "animate-spin" : ""} /> Dólar Blue
                    </button>
                    <button
                      onClick={() => syncXuiPackages(false)}
                      className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-300 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <RefreshCw size={11} /> Sincronizar API Panel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Formulario de Carga */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-855 space-y-4 text-left">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {editingProviderCostId ? '✏️ EDITAR COSTO' : '📥 CARGAR NUEVO COSTO'}
                    </span>
                    <form onSubmit={handleSaveProviderCost} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">PROVEEDOR</label>
                        <input
                          type="text"
                          value={providerCostForm.proveedor}
                          onChange={(e) => setProviderCostForm({ ...providerCostForm, proveedor: e.target.value })}
                          placeholder="Ej. Lucas Mayorista, XUI Official"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">LINK</label>
                        <input
                          type="text"
                          value={providerCostForm.link}
                          onChange={(e) => setProviderCostForm({ ...providerCostForm, link: e.target.value })}
                          placeholder="Ej. https://panel.proveedor.com"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">PLAN</label>
                        <input
                          type="text"
                          value={providerCostForm.plan}
                          onChange={(e) => setProviderCostForm({ ...providerCostForm, plan: e.target.value })}
                          placeholder="Ej. Plan 3 Meses 5 Pan."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">PRECIO (USD)</label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={providerCostForm.precio}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                // Evitar múltiples puntos decimales
                                const parts = val.split('.');
                                const cleaned = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                                setProviderCostForm({ ...providerCostForm, precio: cleaned });
                              }}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-mono font-black rounded-xl focus:outline-none placeholder-slate-300"
                            />
                            <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-slate-400">u$s</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">CREDITOS</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={providerCostForm.creditos}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setProviderCostForm({ ...providerCostForm, creditos: val });
                            }}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-mono font-black rounded-xl focus:outline-none placeholder-slate-300"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white text-xs font-black py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-center uppercase"
                        >
                          {editingProviderCostId ? 'Guardar Cambios' : 'Guardar Costo'}
                        </button>
                        {editingProviderCostId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProviderCostId(null);
                              setProviderCostForm({
                                proveedor: '',
                                plan: '',
                                precio: 0,
                                creditos: 0,
                                link: ''
                              });
                            }}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 text-slate-700 text-xs font-black px-3 py-2 text-center rounded-xl transition-all cursor-pointer"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Listado y Análisis de los Paquetes Cargados */}
                  <div className="lg:col-span-2 space-y-3 text-left">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      COSTOS REGISTRADOS ({providerCosts.length})
                    </span>

                    {providerCosts.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                        No hay costos de proveedores registrados. Usa el formulario de la izquierda para registrar nuevos costos con UUID.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                        {providerCosts.map((item) => {
                          const isActive = providerName === item.proveedor && tokenPackageUsd === item.precio && creditsPerPack === item.creditos;
                          
                          const precioArs = item.precio * dollarRate;
                          const costUnitUsd = item.creditos > 0 ? (item.precio / item.creditos) : 0;
                          const costUnitArs = costUnitUsd * dollarRate;

                          return (
                            <div 
                              key={item.id} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                                isActive 
                                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md' 
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 hover:border-slate-300 dark:hover:border-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-xs font-black tracking-tight">{item.proveedor}</h4>
                                    {isActive && (
                                      <span className="text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                                        Activo en Simulador
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[10px] font-mono font-bold ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-705 dark:text-slate-400'} mt-1`}>
                                    Plan: {item.plan}
                                  </p>
                                  {item.link && (
                                    <div className="mt-1">
                                      <a
                                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-extrabold hover:underline"
                                      >
                                        <ExternalLink size={11} /> Ver Panel ↗
                                      </a>
                                    </div>
                                  )}
                                  <span className={`text-[8.5px] font-mono ${isActive ? 'text-slate-400' : 'text-slate-550'} block mt-1`}>
                                    ID/UUID: {item.id}
                                  </span>
                                </div>
                                
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleActivateProviderCost(item)}
                                    title="Activar este costo como cotización simulador principal"
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border transition-all ${
                                      isActive 
                                        ? 'bg-emerald-600 text-white border-emerald-500' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    {isActive ? 'Activo ✓' : 'Activar'}
                                  </button>
                                  <button
                                    onClick={() => handleEditProviderCost(item)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 hover:text-indigo-500 cursor-pointer text-slate-400"
                                    title="Editar"
                                  >
                                    <Edit size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProviderCost(item.id!)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 hover:text-rose-500 cursor-pointer text-slate-400"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Datos Financieros */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t dark:border-slate-800 pt-3 flex-wrap">
                                <div className="text-left">
                                  <span className={`text-[8px] font-black uppercase block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                    Costo Pack (USD)
                                  </span>
                                  <span className="text-xs font-black font-mono">
                                    u$s {item.precio.toFixed(2)}
                                  </span>
                                </div>

                                <div className="text-left">
                                  <span className={`text-[8px] font-black uppercase block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                    Costo Pack (ARS)
                                  </span>
                                  <span className="text-xs font-black font-mono text-emerald-500">
                                    ${Math.round(precioArs).toLocaleString('es-ES')}
                                  </span>
                                </div>

                                <div className="text-left">
                                  <span className={`text-[8px] font-black uppercase block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                    Créditos Prometidos
                                  </span>
                                  <span className="text-xs font-black font-mono">
                                    {item.creditos}
                                  </span>
                                </div>

                                <div className="text-left">
                                  <span className={`text-[8px] font-black uppercase block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                    Costo x Unidad
                                  </span>
                                  <span className="text-xs font-black font-mono text-rose-500">
                                    ${Math.round(costUnitArs).toLocaleString('es-ES')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mensajes' && (
            <IptvMessageTemplatesTab
              accounts={accounts}
              dnsPortalDefault={xuiConfig?.xui_url || 'http://vip-xtv.pro:8080'}
            />
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL INTERMEDIO: SELECTOR DE TIPO DE REGISTRO (DEMO O COMPLETADO) */}
      {/* ======================================================== */}
      {showClientCreatorTypeSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowClientCreatorTypeSelector(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¿Qué tipo de cuenta deseas dar de alta?
              </h3>
              <p className="text-xs text-slate-450 font-medium leading-relaxed">
                Elige la modalidad para continuar con el registro de tu nuevo cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Opción 1: Cuenta Demo Gratis */}
              <button
                onClick={handleStartDemoAccountRegistration}
                className="group flex items-start gap-4 p-4 text-left border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-900 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all w-full"
              >
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                    Generar Cuenta Demo (Trial)
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-450 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono">
                      Costo 0
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Acceso rápido de 1h, 3h, 6h o 4h con selección flexible de listas. Ideal para demostraciones instantáneas.
                  </p>
                </div>
              </button>

              {/* Opción 2: Cuenta Plan Completo */}
              <button
                onClick={handleStartFullAccountRegistration}
                className="group flex items-start gap-4 p-4 text-left border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-900 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all w-full"
              >
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                  <Tv size={20} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-850 dark:text-white">
                    Registrar Línea / Plan Completo
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Alta de suscripción comercial estándar. Enlaza un portal DNS real, planes mayoristas/minoristas y define fechas de vencimiento.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowClientCreatorTypeSelector(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASISTENTE INTERACTIVO DE CUENTA DEMO (XUI.ONE STYLE) */}
      {/* ======================================================== */}
      {showDemoAccountModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-6 text-slate-105 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowDemoAccountModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Encabezado */}
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={16} className="text-amber-500" />
                  Add Trial Line
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Panel de Generación Rápida de Líneas de Prueba (Demos)</p>
              </div>
              <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl">
                Modo Demo Activo
              </span>
            </div>

            {/* Solo se muestran pasos si NO se han generado credenciales */}
            {!demoCreatedResult ? (
              <>
                {/* Selector Visual de Pasos (Pestañas horizontales tipo XUI) */}
                <div className="grid grid-cols-3 border border-slate-800 rounded-xl overflow-hidden text-center text-[10px] font-black uppercase tracking-wider">
                  <button
                    onClick={() => setDemoStep(1)}
                    className={`py-3 flex items-center justify-center gap-1.5 border-r border-slate-800 cursor-pointer transition-all ${demoStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-850'}`}
                  >
                    <User size={12} />
                    1. Details
                  </button>
                  <button
                    onClick={() => setDemoStep(2)}
                    className={`py-3 flex items-center justify-center gap-1.5 border-r border-slate-800 cursor-pointer transition-all ${demoStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-850'}`}
                  >
                    <AlertTriangle size={12} />
                    2. Restrictions
                  </button>
                  <button
                    onClick={() => setDemoStep(3)}
                    className={`py-3 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${demoStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-850'}`}
                  >
                    <CheckCircle size={12} />
                    3. Review Purchase
                  </button>
                </div>

                {/* Formulario que cambia según el paso */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  {demoStep === 1 && (
                    <div className="space-y-4 text-left">
                      {/* Campo Username con sufijo badge */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Username *</label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900 group">
                          <input
                            type="text"
                            value={demoCustomUsernamePrefix}
                            onChange={(e) => setDemoCustomUsernamePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                            placeholder="Dejar vacío para auto-generar"
                            className="flex-1 px-3 py-2.5 bg-transparent border-none text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <p className="text-[8.5px] text-slate-550 font-medium flex items-center gap-1">
                          <Info size={10} className="text-slate-400" />
                          Usuario final: <span className="font-mono text-slate-300 font-bold">{demoCustomUsernamePrefix.trim() ? `${demoCustomUsernamePrefix.trim().toLowerCase()}` : '[Aleatorio]'}</span>
                        </p>
                      </div>

                      {/* Dropdown de Paquete */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Package *</label>
                        <select
                          value={demoPackage}
                          onChange={(e) => setDemoPackage(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {/* Planes Demo Sincronizados de la API */}
                          {providerPlans.filter(p => !p.archived && (p.tokens === 0 || p.name.toLowerCase().includes("demo") || p.name.toLowerCase().includes("trial") || p.name.toLowerCase().includes("prueba") || p.name.toLowerCase().includes("test"))).length > 0 && (
                            <optgroup label="Planes Demo de la API Real (XUI)">
                              {providerPlans.filter(p => !p.archived && (p.tokens === 0 || p.name.toLowerCase().includes("demo") || p.name.toLowerCase().includes("trial") || p.name.toLowerCase().includes("prueba") || p.name.toLowerCase().includes("test"))).map(p => (
                                <option key={p.id} value={p.id}>🔌 API: {p.name}</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Demos Locales (Simuladas)">
                            <option value="pkg-1h">🟢 Demo 1 Hora</option>
                            <option value="pkg-3h">🟢 Demo 3 Horas</option>
                            <option value="pkg-6h">🟢 Demo 6 Horas</option>
                            <option value="pkg-4h-3p">🟢 Demo 4 Horas (3 Pantallas)</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Fila de Costo, Duración, Max Conn y Fecha Expiración calculados en vivo */}
                      {(() => {
                        let cost = 0;
                        let duration = "1 hours";
                        let maxConn = 1;
                        
                        const matchedPlan = providerPlans.find(p => p.id === demoPackage);
                        if (matchedPlan) {
                          cost = matchedPlan.tokens || 0;
                          maxConn = matchedPlan.screens || 1;
                          
                          let hours = 24;
                          const nameLower = matchedPlan.name.toLowerCase();
                          if (nameLower.includes("3h") || nameLower.includes("3 hora") || nameLower.includes("3 hours")) hours = 3;
                          else if (nameLower.includes("6h") || nameLower.includes("6 hora") || nameLower.includes("6 hours")) hours = 6;
                          else if (nameLower.includes("1h") || nameLower.includes("1 hora") || nameLower.includes("1 hours")) hours = 1;
                          else if (nameLower.includes("4h") || nameLower.includes("4 hora") || nameLower.includes("4 hours")) hours = 4;
                          else if (nameLower.includes("2h") || nameLower.includes("2 hora") || nameLower.includes("2 hours")) hours = 2;
                          else if (nameLower.includes("12h") || nameLower.includes("12 hora") || nameLower.includes("12 hours")) hours = 12;
                          
                          duration = `${hours} hours`;
                        } else {
                          cost = 0;
                          duration = demoPackage === 'pkg-1h' ? '1 hours' : demoPackage === 'pkg-3h' ? '3 hours' : demoPackage === 'pkg-6h' ? '6 hours' : '4 hours';
                          maxConn = demoPackage === 'pkg-4h-3p' ? 3 : 1;
                        }
                        
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800/60 p-4 rounded-xl">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Costo al Cliente</label>
                              <div className="bg-slate-950 px-3 py-2 text-xs font-bold font-mono text-emerald-400 rounded-xl text-center border border-slate-850">
                                {cost > 0 ? `$${cost.toLocaleString('es-AR')} ARS` : 'Prueba Gratuita'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Duration</label>
                              <div className="bg-slate-950 px-3 py-2 text-xs font-bold font-mono text-slate-300 rounded-xl text-center border border-slate-850">
                                {duration}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Max Connections</label>
                              <div className="bg-slate-950 px-3 py-2 text-xs font-bold font-mono text-slate-300 rounded-xl text-center border border-slate-850">
                                {maxConn}
                              </div>
                            </div>

                            <div className="space-y-1 col-span-2 sm:col-span-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 font-medium truncate self-center">Expiration Date</label>
                              <div className="bg-slate-950 px-2 py-2 text-[10px] font-black font-mono text-amber-400 rounded-xl text-center border border-slate-850 truncate" title={getDemoExpirationDate()}>
                                {getDemoExpirationDate()}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Contact Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                          Contact Email
                          <span className="text-[8px] text-slate-500 font-bold lowercase italic">Opcional</span>
                        </label>
                        <input
                          type="email"
                          value={demoContactEmail}
                          onChange={(e) => setDemoContactEmail(e.target.value)}
                          placeholder="correo@cliente.com"
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Reseller Notes */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                          Reseller Notes
                          <span className="text-[8px] text-slate-500 font-bold lowercase italic">Opcional</span>
                        </label>
                        <textarea
                          value={demoResellerNotes}
                          onChange={(e) => setDemoResellerNotes(e.target.value)}
                          placeholder="Anotaciones referenciales para control interno..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 max-h-16"
                        />
                      </div>
                    </div>
                  )}

                  {demoStep === 2 && (
                    <div className="space-y-4 text-center py-6">
                      <div className="size-12 bg-indigo-950 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-900">
                        <Lock size={22} />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Restrictions (Omitido)</h4>
                        <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                          No aplicaremos ninguna restricción de IP, agente de usuario o bloqueo geográfico para este trial. De este modo, tu cliente podrá probar el servicio de manera 100% libre desde SmartTV, móvil o PC sin importar su proveedor de internet (ISP).
                        </p>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 border border-slate-850 rounded-xl inline-block">
                        <span className="text-[9px] font-black uppercase text-slate-500 font-mono">ESTADO: ACCESO ABIERTO DESDE CUALQUIER LOCALIZACIÓN</span>
                      </div>
                    </div>
                  )}

                  {demoStep === 3 && (
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">Configuración del Contenido Autorizado</h4>
                          <p className="text-[9px] text-slate-450 font-semibold">Tilda o destilda las grillas impositivas comerciales que este trial tendrá habilitado reproducir.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (selectedChannels.length + selectedMovies.length + selectedSeries.length === 0) {
                              setSelectedChannels([...AVAILABLE_CHANNELS]);
                              setSelectedMovies([...AVAILABLE_MOVIES]);
                              setSelectedSeries([...AVAILABLE_SERIES]);
                            } else {
                              setSelectedChannels([]);
                              setSelectedMovies([]);
                              setSelectedSeries([]);
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-[8.5px] uppercase px-2.5 py-1 rounded cursor-pointer"
                        >
                          {selectedChannels.length + selectedMovies.length + selectedSeries.length === 0 ? "Seleccionar Todo" : "Vaciar Selección"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Canales */}
                        <div className="space-y-2 p-3 bg-slate-900 border border-slate-850 rounded-xl">
                          <label className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                            <Tv size={12} />
                            Listas de Canales ({selectedChannels.length})
                          </label>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {AVAILABLE_CHANNELS.map((ch, i) => (
                              <label key={i} className="flex items-start gap-1.5 text-[9.5px] font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={selectedChannels.includes(ch)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedChannels([...selectedChannels, ch]);
                                    else setSelectedChannels(selectedChannels.filter(item => item !== ch));
                                  }}
                                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                                />
                                <span className="leading-tight truncate" title={ch}>{ch}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Películas */}
                        <div className="space-y-2 p-3 bg-slate-900 border border-slate-850 rounded-xl">
                          <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                            <PlayCircle size={12} />
                            Películas VOD ({selectedMovies.length})
                          </label>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {AVAILABLE_MOVIES.map((mv, i) => (
                              <label key={i} className="flex items-start gap-1.5 text-[9.5px] font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={selectedMovies.includes(mv)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedMovies([...selectedMovies, mv]);
                                    else setSelectedMovies(selectedMovies.filter(item => item !== mv));
                                  }}
                                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                                />
                                <span className="leading-tight truncate" title={mv}>{mv}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Series */}
                        <div className="space-y-2 p-3 bg-slate-900 border border-slate-850 rounded-xl">
                          <label className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                            <Layers size={12} />
                            Series VOD ({selectedSeries.length})
                          </label>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {AVAILABLE_SERIES.map((sr, i) => (
                              <label key={i} className="flex items-start gap-1.5 text-[9.5px] font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={selectedSeries.includes(sr)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedSeries([...selectedSeries, sr]);
                                    else setSelectedSeries(selectedSeries.filter(item => item !== sr));
                                  }}
                                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                                />
                                <span className="leading-tight truncate" title={sr}>{sr}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de navegación del modal */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowDemoAccountModal(false)}
                    className="px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] uppercase font-black tracking-wider rounded-xl cursor-pointer transition-all"
                  >
                    Cerrar
                  </button>

                  <div className="flex gap-2">
                    {demoStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setDemoStep((prev) => (prev - 1) as any)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] uppercase font-black tracking-wider rounded-xl cursor-pointer transition-all"
                      >
                        Atrás
                      </button>
                    )}

                    {demoStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setDemoStep((prev) => (prev + 1) as any)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-black tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1"
                      >
                        Siguiente <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateDemoAccountSubmit}
                        disabled={isSavingIptv}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-350 text-white text-[10px] uppercase font-black tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                      >
                        {isSavingIptv ? (
                          <>
                            <span className="size-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Creando...
                          </>
                        ) : (
                          <>
                            <Check size={14} /> Crear Cuenta Demo Activa
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* PANTALLA EXCLUSIVA DE CREDENCIALES CREADAS (COPY-PASTE READY) */
              <div className="space-y-5 py-2 text-left">
                <div className="text-center space-y-2">
                  <div className="size-12 bg-emerald-950/80 text-emerald-450 rounded-full border border-emerald-900 flex items-center justify-center mx-auto">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">¡Cuenta Trial Creada Exitosamente!</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Toda la configuración del contenido y fechas de duración están grabadas en la Base de Datos.</p>
                  </div>
                </div>

                {/* Caja de Datos */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3.5 text-left">
                  <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1 text-center justify-center">
                    🌟 Credenciales Xtream Codes listas para compartir
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Host */}
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 relative group">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Host / DNS / URL</div>
                      <div className="font-mono text-[11px] font-bold text-white truncate pr-6">{demoCreatedResult.host}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoCreatedResult.host);
                          setCopiedField('host');
                          setTimeout(() => setCopiedField(null), 2000);
                          toast.success('DNS guardado en portapapeles');
                        }}
                        className="absolute top-3.5 right-3 text-slate-500 hover:text-white cursor-pointer transition-all"
                        title="Copiar Host"
                      >
                        {copiedField === 'host' ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Port */}
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 relative group">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Puerto de Enlace</div>
                      <div className="font-mono text-[11px] font-bold text-white pr-6">{demoCreatedResult.port}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoCreatedResult.port);
                          setCopiedField('port');
                          setTimeout(() => setCopiedField(null), 2000);
                          toast.success('Puerto guardado en portapapeles');
                        }}
                        className="absolute top-3.5 right-3 text-slate-500 hover:text-white cursor-pointer transition-all"
                        title="Copiar Puerto"
                      >
                        {copiedField === 'port' ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Usuario */}
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 relative group bg-gradient-to-r from-slate-900 to-slate-950">
                      <div className="text-[8px] font-black text-indigo-400 uppercase">Usuario Xtream (Línea)</div>
                      <div className="font-mono text-[11px] font-bold text-indigo-300 pr-6 break-all">{demoCreatedResult.username}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoCreatedResult.username);
                          setCopiedField('user');
                          setTimeout(() => setCopiedField(null), 2000);
                          toast.success('Usuario guardado en portapapeles');
                        }}
                        className="absolute top-3.5 right-3 text-slate-500 hover:text-indigo-400 cursor-pointer transition-all"
                        title="Copiar Usuario"
                      >
                        {copiedField === 'user' ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Contraseña */}
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 relative group bg-gradient-to-r from-slate-900 to-slate-950">
                      <div className="text-[8px] font-black text-indigo-400 uppercase">Contraseña Xtream</div>
                      <div className="font-mono text-[11px] font-bold text-indigo-300 pr-6 break-all">{demoCreatedResult.password}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoCreatedResult.password);
                          setCopiedField('pass');
                          setTimeout(() => setCopiedField(null), 2000);
                          toast.success('Contraseña guardada en portapapeles');
                        }}
                        className="absolute top-3.5 right-3 text-slate-500 hover:text-indigo-400 cursor-pointer transition-all"
                        title="Copiar Contraseña"
                      >
                        {copiedField === 'pass' ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Playlist M3U */}
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 relative group col-span-1 sm:col-span-2">
                      <div className="text-[8px] font-black text-slate-400 uppercase">Playlist Completa M3U (HLS/TS)</div>
                      <div className="font-mono text-[10.5px] font-bold text-slate-300 pr-6 break-all flex items-center justify-between truncate bg-slate-950 border border-slate-850 p-1.5 rounded-lg">
                        {demoCreatedResult.m3u_url}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoCreatedResult.m3u_url);
                          setCopiedField('m3u');
                          setTimeout(() => setCopiedField(null), 2000);
                          toast.success('Lista M3U guardada en portapapeles');
                        }}
                        className="absolute top-3.5 right-3 text-slate-500 hover:text-white cursor-pointer transition-all p-1.5 bg-slate-800 rounded-lg animate-pulse"
                        title="Copiar URL M3U"
                      >
                        {copiedField === 'm3u' ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* ACCESO SMARTPHONE - QR Y ATAJO WHATSAPP */}
                    <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border border-indigo-900/30 p-3 rounded-xl col-span-1 sm:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-indigo-950">
                        <Smartphone className="text-indigo-400 shrink-0" size={14} />
                        <div>
                          <span className="text-[9.5px] font-black uppercase text-indigo-200 tracking-wider block">
                            📱 Copiar / Escanear para Celular & Smart TV
                          </span>
                          <span className="text-[8px] text-slate-400 block font-bold">
                            Ideal para evitar escribir la larguísima URL en teclados de celulares u otros dispositivos.
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* QR Code */}
                        <div className="shrink-0 bg-white p-2 rounded-xl flex flex-col items-center gap-1.5 shadow-md">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(demoCreatedResult.m3u_url)}`} 
                            alt="M3U QR Code" 
                            className="size-[110px]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-tight">QR de Playlist Directo</span>
                        </div>
                        
                        {/* Explicativo y Copiado Directo */}
                        <div className="space-y-2 flex-1 w-full text-left">
                          <div className="bg-slate-900/50 border border-indigo-905 p-2 rounded-lg space-y-1">
                            <span className="text-[8px] font-black text-indigo-400 uppercase block">💡 Tip Pro de Teclado:</span>
                            <p className="text-[9px] text-slate-350 leading-relaxed font-semibold">
                              Escribir la URL M3U entera es extenuante. Es mucho mejor **enviar el acceso directo a su WhatsApp** para que su cliente copie-pegue el enlace M3U directamente en el celular, o escanee este código QR para cargarlo rápido.
                            </p>
                          </div>
                          
                          {/* Botones de acción rápida */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const m3uUrl = demoCreatedResult.m3u_url;
                                navigator.clipboard.writeText(m3uUrl);
                                setCopiedField('smart_m3u');
                                setTimeout(() => setCopiedField(null), 2000);
                                toast.success('M3U copiado para celulares');
                              }}
                              className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-1.5 px-2.5 rounded-lg text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-slate-800 transition-all"
                            >
                              {copiedField === 'smart_m3u' ? (
                                <><Check size={11} className="text-emerald-400" /> ¡Copiado!</>
                              ) : (
                                <><Copy size={10} /> Copiar Solo M3U</>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const clientName = demoCreatedResult.nombre_completo || 'Cliente Trial';
                                const userText = `📺 *TU ACCESO DIRECTO IPTV (TRIAL)* 📺\n\nHola *${clientName}*, aquí tienes tu acceso para conectar tu celular u otros dispositivos:\n\n🔗 *Enlace Directo Playlist M3U* (Copia este link completo y pégalo en tu aplicación de IPTV):\n${demoCreatedResult.m3u_url}\n\n🔐 *Acceso Xtream Codes* (Ideal para escribir más rápido):\n🌐 Portal: *${demoCreatedResult.host}*\n🚪 Puerto: *${demoCreatedResult.port}*\n🔑 Usuario: *${demoCreatedResult.username}*\n🔒 Clave: *${demoCreatedResult.password}*`;
                                
                                const phoneNum = demoCreatedResult.celular || '';
                                const cleanedPhone = phoneNum.replace(/\D/g, '');
                                const waUrl = cleanedPhone 
                                  ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(userText)}`
                                  : `https://api.whatsapp.com/send?text=${encodeURIComponent(userText)}`;
                                
                                window.open(waUrl, '_blank');
                                toast.success('Abriendo WhatsApp para compartir...');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1.5 px-2.5 rounded-lg text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <MessageSquare size={10} /> Enviar por WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalle informativo de expiración */}
                  <div className="bg-slate-905 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-500" />
                      Lector de caducidad:
                    </span>
                    <span className="font-mono text-amber-500 font-extrabold bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-900/60 uppercase">
                      Vence en {demoPackage === 'pkg-4h-3p' ? '4hs (3 pantallas)' : demoPackage === 'pkg-1h' ? '1hs' : demoPackage === 'pkg-3h' ? '3hs' : '6hs'} ({new Date(demoCreatedResult.expiration).toLocaleString('es-AR')})
                    </span>
                  </div>
                </div>

                {/* Acciones del final de la Demo */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const fullCredentialsText = `📺 CREDENCIALES IPTV DEMO ACTIVAS 📺\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🌐 Portal/Host: ${demoCreatedResult.host}\n🚪 Puerto: ${demoCreatedResult.port}\n🔑 Usuario: ${demoCreatedResult.username}\n🔒 Contraseña: ${demoCreatedResult.password}\n👥 Pantallas Soportadas: ${demoCreatedResult.screens}\n⏳ Vence: ${new Date(demoCreatedResult.expiration).toLocaleString('es-AR')}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔗 URL Lista M3U:\n${demoCreatedResult.m3u_url}`;
                      navigator.clipboard.writeText(fullCredentialsText);
                      setCopiedField('all_cred');
                      setTimeout(() => setCopiedField(null), 2000);
                      toast.success('¡Se copiaron las credenciales completas para tu cliente!');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 hover:shadow-indigo-800/20 transition-all border border-indigo-500/20"
                  >
                    {copiedField === 'all_cred' ? (
                      <>
                        <Check size={16} className="text-emerald-400 animate-bounce" /> ¡Copiaste todo de una vez!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copiar todas las credenciales
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowDemoAccountModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-350 font-extrabold py-2.5 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Regresar a la Consola de Clientes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESPUESTA RÁPIDA DE PLANILLA CON VARIABLES (OPCIÓN C) */}
      {/* ======================================================== */}
      {showMessageModal && messageClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowMessageModal(false);
                setCustomizedMessageText('');
                setSelectedTemplateId('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                ⚡ Respuesta Rápida (Opción C)
              </span>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider mt-2.5">
                Enviar Respuesta Rápida a {messageClient.nombre_completo}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Selecciona una plantilla rápida de tu biblioteca. Sus variables dinámicas se adaptarán de inmediato con los datos reales de este cliente.
              </p>
            </div>

            <div className="space-y-4">
              {/* Seleccionar Plantilla */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Elige una Plantilla Guardada</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTemplateId(val);
                    const tpl = quickReplies.find(qr => qr.id === val);
                    if (tpl) {
                      const replaced = replaceMessagePlaceholders(tpl.text, {
                        ...messageClient,
                        nombre_completo: messageClient.nombre_completo,
                        username: messageClient.username_cuenta,
                        password: messageClient.password_cuenta,
                        fecha_vencimiento: messageClient.fecha_vencimiento,
                        celular: messageClient.celular,
                        m3u_url: messageClient.m3u_url || `http://mad.mvpl.uk:2095/get.php?username=${messageClient.username_cuenta}&password=${messageClient.password_cuenta}&type=m3u_plus`,
                        host_completo: messageClient.url_panel_asignada || 'http://mad.mvpl.uk:2095',
                        plan_venta: messageClient.id_plan_venta ? (salePlans.find(p => p.id === messageClient.id_plan_venta)?.name || messageClient.id_plan_venta) : 'Plan General'
                      });
                      setCustomizedMessageText(replaced);
                      toast.success(`Plantilla "${tpl.name}" aplicada`);
                    } else {
                      setCustomizedMessageText('');
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Elige una plantilla rápida --</option>
                  {quickReplies.map(qr => (
                    <option key={qr.id} value={qr.id}>
                      {qr.name} ({qr.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vista Previa / Edición Directa */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Mensaje a Enviar (Puedes editarlo libremente)</label>
                  {customizedMessageText && (
                    <span className="text-[8.5px] text-emerald-500 font-bold">✓ Variables Reemplazadas con Éxito</span>
                  )}
                </div>
                <textarea
                  value={customizedMessageText}
                  onChange={(e) => setCustomizedMessageText(e.target.value)}
                  placeholder="Elige una plantilla arriba para visualizar su contenido..."
                  className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y text-slate-800 dark:text-white"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={!customizedMessageText}
                  onClick={() => {
                    navigator.clipboard.writeText(customizedMessageText);
                    toast.success('¡Mensaje copiado al portapapeles!');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[9.5px] uppercase py-2.5 rounded-xl tracking-wider cursor-pointer border dark:border-slate-800 flex justify-center items-center gap-2"
                >
                  📋 Copiar Texto Rápido
                </button>

                <button
                  type="button"
                  disabled={!customizedMessageText}
                  onClick={() => {
                    if (!customizedMessageText) return;
                    const cleanPhone = messageClient.celular ? messageClient.celular.replace(/\D/g, '') : '';
                    if (!cleanPhone) {
                      toast.warning('El cliente no tiene celular guardado. Solo copiaremos el texto.');
                      navigator.clipboard.writeText(customizedMessageText);
                      return;
                    }
                    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customizedMessageText)}`;
                    window.open(url, '_blank');
                    toast.success('Abriendo WhatsApp Web...');
                    setShowMessageModal(false);
                    setCustomizedMessageText('');
                    setSelectedTemplateId('');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9.5px] uppercase py-2.5 rounded-xl tracking-wider cursor-pointer shadow-lg flex justify-center items-center gap-2"
                >
                  💬 Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FORMULARIO DE ALTA / EDICIÓN COMPLETA DE CLIENTES */}
      {/* ======================================================== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => {
                setShowFormModal(false);
                setDemoCreatedResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            {/* ============== Vista 1: Credenciales Creadas (Para Demo o Suscripción Ventas) ============== */}
            {demoCreatedResult ? (
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-2 border-b dark:border-slate-850">
                  <div className="mx-auto w-12 h-12 bg-slate-900 border border-slate-850 dark:bg-slate-800 text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={22} />
                  </div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider mt-2">
                    {demoCreatedResult.is_demo ? '⚡ ¡Cuenta Demo IPTV Activada!' : '🌟 ¡Suscripción IPTV Activada!'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Credenciales procesadas con éxito. Puedes editar el texto que se enviará al cliente directamente a continuación.
                  </p>
                </div>

                {/* SELECTOR DE RESPUESTA RÁPIDA (OPCIÓN C) */}
                <div className="bg-slate-50 dark:bg-slate-905 p-3.5 rounded-2xl border dark:border-slate-800 text-left space-y-1.5 shadow-sm">
                  <label className="text-[9px] font-black uppercase text-indigo-400 block tracking-wider">
                    ⚡ Seleccionar Plantilla de Respuesta Rápida (Opción C)
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTemplateId(val);
                      const selectedTpl = quickReplies.find(qr => qr.id === val);
                      if (selectedTpl) {
                        const replaced = replaceMessagePlaceholders(selectedTpl.text, {
                          ...demoCreatedResult,
                          // Map variables for compat
                          nombre_completo: demoCreatedResult.nombre_completo || 'Cliente Trial',
                          celular: demoCreatedResult.celular || '',
                          direccion_actual: demoCreatedResult.direccion_actual || '',
                          url_panel_asignada: demoCreatedResult.host,
                          id_plan_venta: demoCreatedResult.id_plan_venta
                        });
                        setEditableResultText(replaced);
                        toast.success(`Plantilla "${selectedTpl.name}" aplicada con variables`);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    title="Elige una plantilla rápida para rellenar automáticamente la leyenda de entrega"
                  >
                    <option value="">-- Usar formato por defecto --</option>
                    {quickReplies.map(qr => (
                      <option key={qr.id} value={qr.id}>{qr.name} ({qr.category.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                {/* Leyenda totalmente editable */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                    Leyenda de Credencial (Editable)
                  </label>
                  <textarea
                    value={editableResultText}
                    onChange={(e) => setEditableResultText(e.target.value)}
                    className="w-full h-80 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium rounded-2xl focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-800 dark:text-slate-100"
                    placeholder="Escribe la plantilla de credenciales aquí..."
                  />
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(editableResultText);
                      setCopiedField('all_cred');
                      setTimeout(() => setCopiedField(null), 2000);
                      toast.success('¡Leyenda copiada al portapapeles!');
                    }}
                    id="btn_copiar_credencial_resultado"
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border dark:border-slate-700 shadow-sm"
                  >
                    {copiedField === 'all_cred' ? (
                      <>
                        <Check size={15} className="text-emerald-400 animate-pulse" /> ¡Copiado Exitosamente!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar Leyenda de Envío
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const phone = demoCreatedResult.celular || '';
                      const cleanPhone = phone.replace(/\D/g, '');
                      // Asegurarse de que si el número es local argentino, contenga un código de país internacional válido
                      let finalPhone = cleanPhone;
                      if (finalPhone && !finalPhone.startsWith('54')) {
                        if (finalPhone.length === 10) {
                          finalPhone = '54' + finalPhone;
                        }
                      }
                      
                      const waUrl = finalPhone
                        ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(editableResultText)}`
                        : `https://api.whatsapp.com/send?text=${encodeURIComponent(editableResultText)}`;
                      
                      window.open(waUrl, '_blank');
                      toast.success('Abriendo WhatsApp...');
                    }}
                    id="btn_whatsapp_credencial_resultado"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <MessageSquare size={14} /> Enviar por WhatsApp
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormModal(false);
                      setDemoCreatedResult(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-[10px] uppercase font-black tracking-widest cursor-pointer px-4 py-2"
                  >
                    Cerrar y Regresar
                  </button>
                </div>
              </div>
            ) : (
              /* Vista 2: Formulario de Creación / Edición Completo desde cero */
              <form onSubmit={handlePreSaveValidation} className="space-y-4">
                <div className="border-b dark:border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      {isEditingAccount ? '⚙️ Administrar Cuenta de Cliente' : '✨ Registrar Cliente IPTV Desde Cero'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Ingresa los datos del cliente, geolocaliza su ubicación, asigna el tipo de plan y gestiona su historial de notas.
                    </p>
                  </div>
                  {!isEditingAccount && (
                    <button
                      type="button"
                      onClick={handleFillWithRandomData}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer self-center transition-all"
                    >
                      🎲 Autocompletar Registros
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-w-xl mx-auto text-left">
                  
                  {/* SECCIÓN 1: INFORMACIÓN DE CONTACTO */}
                  <div className="space-y-3.5">
                    <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase border-b dark:border-slate-800 pb-1.5 flex items-center gap-1.5 flex-row">
                      <User size={12} className="text-slate-500" /> Información de Contacto del Cliente
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* NOMBRE */}
                      <div className="space-y-1 group relative">
                        <label 
                          title="Toca o pasa el mouse para ver indicaciones" 
                          className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 cursor-help hover:text-indigo-500 transition-colors select-none"
                        >
                          Nombre <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={accountForm.nombre}
                          onChange={(e) => {
                            const newNombre = e.target.value;
                            setAccountForm({ 
                              ...accountForm, 
                              nombre: newNombre,
                              nombre_completo: `${newNombre.trim()} ${accountForm.apellido.trim()}`.trim()
                            });
                          }}
                          onBlur={(e) => {
                            const formatted = capitalizeName(e.target.value);
                            setAccountForm({
                              ...accountForm,
                              nombre: formatted,
                              nombre_completo: `${formatted} ${accountForm.apellido.trim()}`.trim()
                            });
                          }}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                          placeholder="Ej. Juan"
                        />
                        <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                          💡 Ingresa el nombre de pila o primer nombre del cliente para registrar su perfil.
                        </div>
                      </div>

                      {/* APELLIDO */}
                      <div className="space-y-1 group relative">
                        <label 
                          title="Toca o pasa el mouse para ver indicaciones" 
                          className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 cursor-help hover:text-indigo-500 transition-colors select-none"
                        >
                          Apellido <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={accountForm.apellido}
                          onChange={(e) => {
                            const newApellido = e.target.value;
                            setAccountForm({ 
                              ...accountForm, 
                              apellido: newApellido,
                              nombre_completo: `${accountForm.nombre.trim()} ${newApellido.trim()}`.trim()
                            });
                          }}
                          onBlur={(e) => {
                            const formatted = capitalizeName(e.target.value);
                            setAccountForm({
                              ...accountForm,
                              apellido: formatted,
                              nombre_completo: `${accountForm.nombre.trim()} ${formatted}`.trim()
                            });
                          }}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                          placeholder="Ej. Pérez"
                        />
                        <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                          💡 Ingresa el apellido familiar o paterno del cliente para complementar su perfil.
                        </div>
                      </div>
                    </div>

                    {/* TELEFONO DE CONTACTO */}
                    <div className="space-y-1 group relative">
                      <label 
                        title="Toca o pasa el mouse para ver indicaciones" 
                        className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 cursor-help hover:text-indigo-500 transition-colors select-none"
                      >
                        Teléfono de Contacto <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={accountForm.celular}
                        onChange={(e) => setAccountForm({ ...accountForm, celular: e.target.value })}
                        placeholder="Ej. +54 9 383 4123456"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                      />
                      <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                        💡 Número con código de área (ej. +54 9 383...) para remitir de forma automatizada las credenciales y avisos de cobro por WhatsApp.
                      </div>
                    </div>

                    {/* DIRECCION */}
                    <div className="space-y-1 group relative">
                      <div className="flex justify-between items-center">
                        <label 
                          title="Toca o pasa el mouse para ver indicaciones" 
                          className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 cursor-help hover:text-indigo-500 transition-colors select-none"
                        >
                          Dirección del Cliente <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGetGPSLocation}
                          className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5 cursor-pointer"
                          title="Toca para geolocalizar de forma instantánea usando las coordenadas GPS del navegador"
                        >
                          📍 Tomar GPS Vivo
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={accountForm.direccion_actual}
                        onChange={(e) => setAccountForm({ ...accountForm, direccion_actual: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                        placeholder="Ej. Calle Falsa 123 o pega Link de Google Maps"
                      />
                      <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                        💡 Ingresa el domicilio para logística de cobranza o copia el enlace de geolocalización de Google Maps para acceso directo.
                      </div>
                      
                      {/* Detección amigable de Google Maps */}
                      {accountForm.direccion_actual.trim() && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-[9px]">
                          {(() => {
                            const val = accountForm.direccion_actual.trim();
                            const isMaps = val.toLowerCase().includes('maps.google') || val.toLowerCase().includes('google.com/maps') || val.toLowerCase().includes('maps.app.goo.gl');
                            return (
                              <>
                                <span className="flex items-center gap-1 text-slate-500 font-extrabold flex-row">
                                  {isMaps ? (
                                    <span className="text-emerald-500 flex items-center gap-1 flex-row">🟢 Enlace GPS Maps Detectado</span>
                                  ) : (
                                    <span className="text-slate-400">📄 Dirección en Formato Texto</span>
                                  )}
                                </span>
                                {isMaps && (
                                  <a
                                    href={val}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-500 font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    Probar Mapa <ExternalLink size={10} />
                                  </a>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 2: MEMBRESÍA TV DIGITAL */}
                  <div className="space-y-3.5 pt-4 border-t dark:border-slate-800">
                    <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase pb-1 flex items-center gap-1.5 flex-row border-b dark:border-slate-800">
                      <Activity size={12} className="text-slate-500" /> Membresía TV Digital
                    </div>

                    {isEditingAccount ? (
                      /* Vista de solo lectura para edición */
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Detalles de la Línea Activa</span>
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            accountForm.is_demo 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-955/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30'
                          }`}>
                            {accountForm.is_demo ? '⚡ Cuenta Demo' : '💎 Cuenta VIP'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Plan Asociado */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Plan de Suscripción</span>
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                              {salePlans.find(p => p.id === accountForm.id_plan_venta)?.name || (accountForm.is_demo ? 'Demo de Venta Temporal' : 'Personalizado')}
                            </div>
                          </div>

                          {/* Vencimiento */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Próximo Vencimiento</span>
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                              {accountForm.fecha_vencimiento 
                                ? new Date(accountForm.fecha_vencimiento).toLocaleDateString('es-AR') 
                                : 'Sin fecha'}
                            </div>
                          </div>

                          {/* Credenciales Xtream (Usuario) */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Usuario Xtream (XC)</span>
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {accountForm.username}
                            </div>
                          </div>

                          {/* Credenciales Xtream (Contraseña) */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Contraseña Xtream</span>
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {accountForm.password}
                            </div>
                          </div>

                          {/* Pantallas Autorizadas */}
                          <div className="space-y-1 col-span-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Límite de Pantallas Autorizadas</span>
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                              <span>🖥️ {accountForm.limite_pantallas || 1} pantallas simultáneas</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border dark:border-slate-800">🔒 Solo Lectura</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[8.5px] text-slate-400 leading-normal font-medium italic pt-1">
                          🔒 Las credenciales de conexión, el plan y las pantallas autorizadas no pueden ser editados en el formulario de contacto para evitar errores de sincronización con el panel XC.
                        </p>
                      </div>
                    ) : (
                      /* Vista interactiva para nuevas altas */
                      <>
                        {/* Botones de Selección Directa (Demo o VIP) */}
                        <div className="space-y-2 group relative">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setAccountForm({ 
                                  ...accountForm, 
                                  is_demo: true,
                                  id_plan_venta: '' // Resetear plan seleccionado para forzar nueva selección
                                });
                              }}
                              className={`py-3 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                                accountForm.is_demo
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              ⚡ DEMO
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAccountForm({ 
                                  ...accountForm, 
                                  is_demo: false,
                                  id_plan_venta: '' // Resetear plan seleccionado para forzar nueva selección
                                });
                              }}
                              className={`py-3 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                                !accountForm.is_demo
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              💎 VIP
                            </button>
                          </div>
                          <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                            💡 Elige si el cliente recibe una cuenta de prueba temporal (Demo) o un servicio premium VIP recurrente y activo.
                          </div>
                        </div>

                        {/* Muestra catálogo de planes minoristas filtrados */}
                        <div className="space-y-1.5 group relative">
                          <label 
                            title="Toca o pasa el mouse para ver indicaciones" 
                            className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 cursor-help hover:text-indigo-500 transition-colors select-none"
                          >
                            {accountForm.is_demo ? 'Selecciona tu Demo de Venta' : 'Selecciona tu Plan VIP Minorista'} <span className="text-rose-500">*</span>
                          </label>

                          {accountForm.is_demo ? (
                            <>
                              {/* Filtrar planes de venta que contengan la palabra 'demo' o categoria demo y sean visibles */}
                              {(() => {
                                const demoPlans = salePlans.filter(p => p.visible !== false && (p.categoria_id === 'demo' || (p.name || '').toLowerCase().includes('demo')));
                                if (demoPlans.length > 0) {
                                  return (
                                    <select
                                      value={accountForm.id_plan_venta}
                                      onChange={(e) => {
                                        const pId = e.target.value;
                                        const targetPlan = salePlans.find(plan => plan.id === pId);
                                        if (targetPlan) {
                                          const limitDate = new Date();
                                          limitDate.setMonth(limitDate.getMonth() + (targetPlan.months || 1));
                                          setAccountForm({
                                            ...accountForm,
                                            id_plan_venta: targetPlan.id,
                                            id_plan_proveedor: targetPlan.provider_plan_id || '',
                                            limite_pantallas: targetPlan.screens || 2,
                                            limite_pantallas_api: targetPlan.screens_api || targetPlan.screens || 1,
                                            fecha_vencimiento: limitDate.toISOString().substring(0, 10)
                                          });
                                        } else {
                                          setAccountForm({ ...accountForm, id_plan_venta: pId });
                                        }
                                      }}
                                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                                    >
                                      <option value="">-- Seleccionar Demo del Catálogo --</option>
                                      {demoPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                          {plan.name} ({plan.price > 0 ? `$${plan.price} ARS` : 'Prueba Gratuita'} • {plan.screens || 2} disp.)
                                        </option>
                                      ))}
                                    </select>
                                  );
                                } else {
                                  // Fallback de contingencia si no tiene planes demo cargados aún
                                  return (
                                    <div className="space-y-2">
                                      <select
                                        value={accountForm.demo_package}
                                        onChange={(e) => setAccountForm({ ...accountForm, demo_package: e.target.value as any })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                                      >
                                        <option value="pkg-1h">Demo 1 Hora (Prueba Gratuita)</option>
                                        <option value="pkg-3h">Demo 3 Horas (Prueba Gratuita)</option>
                                        <option value="pkg-6h">Demo 6 Horas (Prueba Gratuita)</option>
                                        <option value="pkg-4h-3p">Demo 4 Horas - 3 Pantallas (Prueba Gratuita)</option>
                                      </select>
                                      <p className="text-[8px] text-amber-500 font-bold leading-normal">
                                        💡 No se encontraron planes demo visibles configurados. Mostrando paquetes temporales generados por defecto.
                                      </p>
                                    </div>
                                  );
                                }
                              })()}
                            </>
                          ) : (
                            <select
                              value={accountForm.id_plan_venta}
                              required
                              onChange={(e) => {
                                const pId = e.target.value;
                                const targetPlan = salePlans.find(p => p.id === pId);
                                if (targetPlan) {
                                  const limitDate = new Date();
                                  limitDate.setMonth(limitDate.getMonth() + (targetPlan.months || 1));
                                  setAccountForm({
                                    ...accountForm,
                                    id_plan_venta: targetPlan.id,
                                    id_plan_proveedor: targetPlan.provider_plan_id || '',
                                    limite_pantallas: targetPlan.screens || 2,
                                    limite_pantallas_api: targetPlan.screens_api || targetPlan.screens || 3,
                                    fecha_vencimiento: limitDate.toISOString().substring(0, 10)
                                  });
                                } else {
                                  setAccountForm({
                                    ...accountForm,
                                    id_plan_venta: pId
                                  });
                                }
                              }}
                              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 text-slate-800 dark:text-white"
                            >
                              <option value="">-- Seleccionar Plan VIP Minorista --</option>
                              {salePlans
                                .filter(plan => plan.visible !== false && plan.categoria_id !== 'demo' && !(plan.name || '').toLowerCase().includes('demo'))
                                .map(plan => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.name} (${plan.price} ARS • {plan.screens || 2} disp.)
                                  </option>
                                ))}
                            </select>
                          )}
                          <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                            💡 Selecciona uno de tus planes minoristas definidos. El sistema cargará automáticamente el valor y la duración correspondientes.
                          </div>
                        </div>

                        {/* Expiración predecible de un vistazo */}
                        <div className="pt-1 select-none">
                          {accountForm.is_demo ? (
                            (() => {
                              const h = { 'pkg-1h': 1, 'pkg-3h': 3, 'pkg-6h': 6, 'pkg-4h-3p': 4 }[accountForm.demo_package] || 1;
                              const estDate = new Date(Date.now() + h * 60 * 60 * 1000);
                              return (
                                <div className="bg-amber-500/5 text-amber-600 p-2 rounded-xl text-[9px] font-mono leading-relaxed border border-amber-500/10 flex items-center gap-1.5 justify-between">
                                  <span className="font-bold uppercase">Duración de Demo Estimada:</span>
                                  <span className="font-extrabold">{estDate.toLocaleString('es-AR')}</span>
                                </div>
                              );
                            })()
                          ) : (
                            (() => {
                              const p = salePlans.find(plan => plan.id === accountForm.id_plan_venta);
                              const months = p ? (p.months || 1) : 1;
                              const estDate = new Date();
                              estDate.setMonth(estDate.getMonth() + months);
                              return (
                                <div className="bg-indigo-500/5 text-indigo-500 p-2 rounded-xl text-[9px] font-mono leading-relaxed border border-indigo-500/10 flex items-center gap-1.5 justify-between">
                                  <span className="font-bold uppercase flex-1 truncate">Vencimiento Estimado ({months} {months === 1 ? 'Mes' : 'Meses'}):</span>
                                  <span className="font-extrabold">{estDate.toLocaleDateString('es-AR')} ({months * 30} días)</span>
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* RESUMEN DE BENEFICIOS DEL PLAN (VISTA REORDENADA, COMPACTA Y SIN DESGLOSE FINANCIERO) */}
                        {(() => {
                          const selPlan = salePlans.find(p => p.id === accountForm.id_plan_venta);
                          if (!selPlan && !accountForm.is_demo) return null;
                          
                          const screensCount = selPlan ? selPlan.screens || 1 : (accountForm.demo_package === 'pkg-4h-3p' ? 3 : 1);
                          const planPrice = selPlan ? selPlan.price : 0;
                          
                          return (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3.5">
                              <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5 border-b dark:border-slate-850 pb-2">
                                <Smartphone size={12} className="text-indigo-500" /> Resumen de Beneficios del Plan
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                {/* PANTALLAS INCLUIDAS (Límite del Plan Minorista) */}
                                <div className="space-y-1 group relative">
                                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 select-none">
                                    Dispositivos / Pantallas
                                  </label>
                                  <div className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 h-10 select-none">
                                    🖥️ {screensCount} {screensCount === 1 ? 'Pantalla' : 'Pantallas'} Autorizadas
                                  </div>
                                  <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                                    💡 Cantidad de pantallas simultáneas preconfiguradas en el plan minorista seleccionado. Solo lectura.
                                  </div>
                                </div>
                                
                                {/* PRECIO FINAL DE VENTA */}
                                <div className="space-y-1 group relative">
                                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 select-none">
                                    Importe de Venta
                                  </label>
                                  <div className="px-3 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-950 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 h-10 select-none">
                                    💰 ${planPrice.toLocaleString('es-AR')} ARS Final
                                  </div>
                                  <div className="absolute z-50 bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium p-2.5 rounded-xl shadow-xl border border-slate-800 leading-normal pointer-events-none">
                                    💡 Monto total de venta minorista al cliente por este período. No incluye costos internos.
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* URL Portal DNS & ESTADO SUSCRIPCION (OCULTOS BAJO LA PETICION DEL USUARIO) */}
                    <div className="hidden">
                      <input
                        type="text"
                        value={accountForm.url_panel_asignada}
                        onChange={(e) => setAccountForm({ ...accountForm, url_panel_asignada: e.target.value })}
                      />
                      <select
                        value={accountForm.estado}
                        onChange={(e) => setAccountForm({ ...accountForm, estado: e.target.value })}
                      >
                        <option value="Activo">🟢 ACTIVO (LIVE)</option>
                        <option value="Inactivo">🔴 INACTIVO (BAN)</option>
                      </select>
                    </div>
                  </div>

                  {/* SECCIÓN 3: BITÁCORA / NOTAS DEL CLIENTE (ABAJO) */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-3">
                    <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center justify-between pb-1 border-b dark:border-slate-850 flex-row">
                      <span className="flex items-center gap-1.5 flex-row">
                        <FileText size={12} className="text-amber-500" /> Bitácora / Notas del Cliente
                      </span>
                      <span className="text-[8px] px-2 py-0.5 bg-slate-200 dark:bg-slate-805 text-slate-500 rounded-full font-black">
                        {(accountForm.bitacora_comentarios || []).filter((note: any) => !note.is_system).length} Registros
                      </span>
                    </div>

                    {/* Cuadro integrado para agregar notas */}
                    <div className="flex gap-2.5">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Añade un suceso o comentario..."
                        className="flex-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium rounded-xl focus:outline-none max-h-20 text-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddNoteToForm}
                        className="px-3 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[10px] uppercase font-black tracking-wider hover:bg-slate-850 cursor-pointer self-stretch flex items-center justify-center border dark:border-slate-700 hover:border-slate-800 transition-all"
                      >
                        + Nota
                      </button>
                    </div>

                    {/* Listado Chronológico de Comentarios */}
                    <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1">
                      {(() => {
                        const visibleNotes = (accountForm.bitacora_comentarios || []).filter((note: any) => !note.is_system);
                        return visibleNotes.length > 0 ? (
                          visibleNotes.map((note: any, visibleIdx: number) => {
                            const originalIndex = accountForm.bitacora_comentarios.findIndex((b: any) => b.date === note.date && b.text === note.text);
                            return (
                              <div key={visibleIdx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2.5 rounded-2xl relative group shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNoteFromForm(originalIndex !== -1 ? originalIndex : visibleIdx)}
                                  className="absolute top-2 right-2 text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Eliminar este suceso"
                                >
                                  <Trash2 size={10} />
                                </button>
                                
                                <p className="text-[10.5px] pr-5 font-bold leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.text}</p>
                                
                                <div className="text-[8.5px] text-slate-400 mt-1 font-mono font-black border-t dark:border-slate-850/50 pt-1 flex items-center justify-between">
                                  <span className="flex items-center gap-0.5">
                                    📅 {new Date(note.date).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-medium">No hay sucesos registrados. Añade tu primera nota para crear la bitácora de este cliente.</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t dark:border-slate-850">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    🚀 {isEditingAccount ? 'Sincronizar y Modificar Cliente en Base de Datos' : 'REGISTRAR ALTA DEL CLIENTE'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormModal(false);
                      setDemoCreatedResult(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold py-3.5 px-6 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    Salir
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VENTANA FLOTANTE DE VALIDACIÓN (CAMPOS FALTANTES) */}
      {/* ======================================================== */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99] animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-950 border-2 border-rose-500/30 dark:border-rose-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                ⚠️ CAMPOS FALTANTES DETECTADOS
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Para poder registrar el alta del cliente, debes completar los siguientes campos obligatorios del formulario:
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-950/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-1.5 font-sans">
              {validationMissingFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                  <span>{field}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer shadow-md transition-all text-center"
            >
              Cerrar y Completar Datos
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL INTERACTIVO DE CONFIRMACIÓN DE ELIMINACIÓN Y LIMPIEZA */}
      {/* ======================================================== */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {deleteConfirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {deleteConfirmModal.description}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              ⚠️ Esta acción eliminará los registros de la base de datos de Supabase y de la memoria local de forma definitiva.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingProcess}
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingProcess}
                onClick={handleExecuteConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-rose-600/20"
              >
                {isDeletingProcess ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>{deleteConfirmModal.confirmText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VENTANA FLOTANTE DE CONFIRMACIÓN (RESUMEN EN 1 PANTALLAZO) */}
      {/* ======================================================== */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[98] animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-950 border-2 border-indigo-500/20 dark:border-indigo-500/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="text-center space-y-1.5">
              <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                🙋‍♂️ ¿CONFIRMAR DATOS DE ALTA?
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Por favor, verifica que los siguientes datos de registro sean totalmente correctos antes de proceder:
              </p>
            </div>

            {/* CUADRO RESUMEN COMPACTO DE UN SOLO PANTALLAZO */}
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-850 p-4 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center text-[11px] border-b dark:border-slate-850 pb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider">👤 Cliente:</span>
                <span className="font-extrabold text-slate-800 dark:text-white text-right">{accountForm.nombre_completo}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] border-b dark:border-slate-850 pb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider">📱 Celular AR:</span>
                <span className="font-mono font-extrabold text-indigo-500 text-right">{accountForm.celular}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] border-b dark:border-slate-850 pb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider">📍 Ubicación GPS / Direc:</span>
                <span className="font-bold text-slate-600 dark:text-slate-350 text-right max-w-[240px] truncate" title={accountForm.direccion_actual}>
                  {accountForm.direccion_actual}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] border-b dark:border-slate-850 pb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider">📋 Modalidad / Plan:</span>
                <span className="font-extrabold text-emerald-500 dark:text-emerald-400 uppercase text-right">
                  {accountForm.is_demo ? '🌟 demo de prueba' : '💼 minorista comercial'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] pb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">📦 Paquete de Plan:</span>
                <span className="font-mono font-extrabold text-slate-700 dark:text-slate-200 text-right">
                  {accountForm.is_demo 
                    ? (accountForm.demo_package === 'pkg-1h' ? 'Demo 1 Hora' : accountForm.demo_package === 'pkg-3h' ? 'Demo 3 Horas' : accountForm.demo_package === 'pkg-6h' ? 'Demo 6 Horas' : 'Demo 4 Horas - 3 Pantallas')
                    : (salePlans.find(plan => plan.id === accountForm.id_plan_venta)?.name || 'Minorista Premium')}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={confirmAndSaveAccount}
                disabled={isSavingIptv}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-300 font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-1.5"
              >
                {isSavingIptv ? (
                  <>
                    <span className="size-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> PROCESANDO...
                  </>
                ) : (
                  <>🚀 SÍ, REGISTRAR ALTA</>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold py-3.5 px-5 rounded-2xl text-[10px] uppercase tracking-wider cursor-pointer transition-all"
              >
                Corregir Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: FORMULARIO PLANES DE FINANZAS (PROVEEDOR/VENTA) */}
      {/* ======================================================== */}
      {editingPlanType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto pr-2 shadow-2xl relative space-y-4 custom-scrollbar">
            <button
              onClick={() => setEditingPlanType(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="border-b dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">
                {editingPlanId ? 'Modificar Plan' : 'Registrar Plan / Combo'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {editingPlanType === 'provider' 
                  ? 'Configuración del paquete oficial del panel proveedor.' 
                  : 'Configura tus términos de venta minorista al cliente final.'}
              </p>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* SI REGISTRAMOS UN PLAN MINORISTA */}
              {editingPlanType === 'sale' && (() => {
                const selPlan = planForm.provider_plan_id ? providerPlans.find(p => p.id === planForm.provider_plan_id) || null : null;
                const limits = getSelectedPlanConnectionsLimits(selPlan);
                const selectedConnsApi = planForm.screens_api !== '' ? Number(planForm.screens_api) : (selPlan ? selPlan.max_connections || selPlan.screens || 1 : 1);
                const computedCredits = calculateApiCreditCost(selPlan, selectedConnsApi);
                const costArs = selPlan ? getPlanCostInArs(computedCredits, selPlan.provider_cost_id) : 0;
                
                // Cálculos de rentabilidad interactivos
                const precioVenta = Number(planForm.value) || 0;
                const comisionVendedor = planForm.comision_vendedor !== '' 
                  ? Number(planForm.comision_vendedor) 
                  : (planForm.comision !== '' ? Number(planForm.comision) : 0);
                const comisionReferente = Number(planForm.comision_referente) || 0;
                const totalComisionesVenta = comisionVendedor + comisionReferente;
                const gananciaEstimada = precioVenta - costArs - totalComisionesVenta;
                const roiPercent = costArs > 0 ? Math.round((gananciaEstimada / costArs) * 100) : 100;
                
                return (
                  <>
                    {/* Vincular a Módulo del Proveedor */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Vincular a Módulo del Proveedor (Catálogo API)</label>
                      <select
                        value={planForm.provider_plan_id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const matchedProv = providerPlans.find(p => p.id === selectedId);
                          if (matchedProv) {
                            const matchedLimits = getSelectedPlanConnectionsLimits(matchedProv);
                            const defaultScreens = matchedLimits.min;
                            const calculatedTokens = calculateApiCreditCost(matchedProv, defaultScreens);
                            setPlanForm({
                              ...planForm,
                              provider_plan_id: selectedId,
                              months: matchedProv.months,
                              screens: defaultScreens,
                              tokens: calculatedTokens,
                              name: `${matchedProv.name} (Venta)`,
                              screens_api: defaultScreens,
                              comision: planForm.comision || '',
                              comision_vendedor: planForm.comision_vendedor || planForm.comision || '',
                              comision_referente: planForm.comision_referente || ''
                            });
                            toast.info(`Datos del catálogo API importados: "${matchedProv.name}"`);
                          } else {
                            setPlanForm({
                              ...planForm,
                              provider_plan_id: '',
                              screens_api: 1,
                              screens: 1,
                              tokens: 1
                            });
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800"
                      >
                        <option value="">-- Creación Libre (Sin Vincular) --</option>
                        {providerPlans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.months === 0 ? 'Demo' : `${p.months}m`} - {p.tokens} Token/s)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ABAJO DEL DESPLEGABLE DE VINCULAR: Con cuantas pantallas debe crearse en el Panel XC */}
                    {selPlan && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Conexiones Físicas XC/XUI (Límite API de Proveedor)</label>
                        <select
                          value={planForm.screens_api || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedTokens = calculateApiCreditCost(selPlan, val);
                            setPlanForm({ 
                              ...planForm, 
                              screens_api: val,
                              screens: val,
                              tokens: updatedTokens
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white"
                        >
                          {limits.options.map((opt: number) => {
                            const optCredits = calculateApiCreditCost(selPlan, opt);
                            const optCostArs = selPlan ? getPlanCostInArs(optCredits, selPlan.provider_cost_id) : 0;
                            return (
                              <option key={opt} value={opt}>
                                {opt} {opt === 1 ? 'PANTALLA' : 'PANTALLAS'} (COSTO: {optCredits} {optCredits === 1 ? 'CRÉDITO' : 'CRÉDITOS'} - ${optCostArs.toLocaleString('es-AR')} ARS)
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[8px] text-slate-400 leading-normal">
                          Configura la cantidad de conexiones físicas reales con las que se registrará el usuario en la API de XUI (XC).
                        </p>
                      </div>
                    )}

                    {/* Nombre Descriptivo de Venta */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Nombre Descriptivo de Venta</label>
                      <input
                        type="text"
                        placeholder="Ej. Combo Mensual - 1 Dispositivo"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Categoría y ID de Categoría del Plan */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">ID de Categoría</label>
                        <select
                          value={planForm.categoria_id || 'vip'}
                          onChange={(e) => {
                            const catId = e.target.value as 'demo' | 'vip' | 'xxx';
                            let suggestedName = '';
                            if (catId === 'demo') suggestedName = 'Demos Gratuitas';
                            if (catId === 'vip') suggestedName = 'Membresías VIP';
                            if (catId === 'xxx') suggestedName = 'Paquetes Especiales';
                            setPlanForm({ 
                              ...planForm, 
                              categoria_id: catId,
                              categoria_nombre: planForm.categoria_nombre || suggestedName
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="demo">🎁 Demo (Gratuito)</option>
                          <option value="vip">💎 VIP (Venta Regular)</option>
                          <option value="xxx">🔞 XXX (Adicionales/Extras)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Asignar Categoría (Nombre)</label>
                        <input
                          type="text"
                          placeholder="Ej. Demos o Membresía"
                          value={planForm.categoria_nombre || ''}
                          onChange={(e) => setPlanForm({ ...planForm, categoria_nombre: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Visibilidad del plan en Ventas / Creación de Cuentas */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block">
                          Disponibilidad en Creación de Cuentas
                        </span>
                        <p className="text-[8.5px] text-slate-500">
                          {planForm.visible !== false 
                            ? 'Visible: Se mostrará a los usuarios al crear o renovar líneas.' 
                            : 'Oculto: Queda reservado y no aparecerá en ventas al cliente.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, visible: planForm.visible === false ? true : false })}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                          planForm.visible !== false
                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {planForm.visible !== false ? (
                          <>
                            <Eye size={13} /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} /> Oculto
                          </>
                        )}
                      </button>
                    </div>

                    {/* ABAJO DEL CAMPO NOMBRE: Cantidad de pantallas que yo le vendo al cliente */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 block">Pantallas Vendidas al Cliente (Límite de Reproductor)</label>
                      {selPlan ? (
                        <select
                          value={planForm.screens || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedTokens = calculateApiCreditCost(selPlan, val);
                            setPlanForm({ 
                              ...planForm, 
                              screens: val,
                              screens_api: val,
                              tokens: updatedTokens
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white"
                        >
                          {limits.options.map((opt: number) => (
                            <option key={opt} value={opt}>
                              {opt} {opt === 1 ? 'Pantalla' : 'Pantallas'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1"
                          value={planForm.screens}
                          onChange={(e) => {
                            const valStr = e.target.value.replace(/[^0-9]/g, '');
                            setPlanForm({ ...planForm, screens: valStr });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-300"
                        />
                      )}
                      <p className="text-[8px] text-slate-400 leading-normal">
                        El reproductor limitará el inicio de sesión a esta cantidad de pantallas vendidas al cliente final, independientemente del panel.
                      </p>
                    </div>

                    {/* SI ES CREACION LIBRE - Muestra el resto de campos si no hay plan vinculado */}
                    {!selPlan && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Meses</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={planForm.months}
                            onChange={(e) => setPlanForm({ ...planForm, months: e.target.value.replace(/[^0-9]/g, '') })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Horas</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={planForm.hours}
                            onChange={(e) => setPlanForm({ ...planForm, hours: e.target.value.replace(/[^0-9]/g, '') })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Tokens</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={planForm.tokens}
                            onChange={(e) => setPlanForm({ ...planForm, tokens: e.target.value.replace(/[^0-9]/g, '') })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Comisiones: Vendedor de la línea y Usuario Referente */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center justify-between">
                          <span>Comisión Vendedor (ARS)</span>
                          <span className="text-[8.5px] font-bold text-slate-400">Venta directa</span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={planForm.comision_vendedor !== '' ? planForm.comision_vendedor : planForm.comision}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = val.split('.');
                            const cleanedVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                            setPlanForm({ 
                              ...planForm, 
                              comision_vendedor: cleanedVal,
                              comision: cleanedVal 
                            });
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800/60 text-xs font-black rounded-xl focus:outline-none placeholder-slate-300 text-slate-900 dark:text-white"
                        />
                        <p className="text-[8px] text-slate-400 leading-tight">
                          Ganancia fija en ARS para el revendedor que genera la línea.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 flex items-center justify-between">
                          <span>Comisión Referente (ARS)</span>
                          <span className="text-[8.5px] font-bold text-slate-400">Patrocinador</span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={planForm.comision_referente}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = val.split('.');
                            const cleanedVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                            setPlanForm({ ...planForm, comision_referente: cleanedVal });
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-sky-300 dark:border-sky-800/60 text-xs font-black rounded-xl focus:outline-none placeholder-slate-300 text-slate-900 dark:text-white"
                        />
                        <p className="text-[8px] text-slate-400 leading-tight">
                          Ganancia para el usuario/líder que dio de alta a dicho vendedor.
                        </p>
                      </div>
                    </div>

                    {/* Monto Final de Venta Minorista */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Monto Final de Venta Minorista (ARS)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={planForm.value}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          const cleanedVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                          setPlanForm({ ...planForm, value: cleanedVal });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border text-xs font-black rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* DESGLOSE ÚNICO DE COSTOS, COMISIÓN Y RENTABILIDAD */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5 text-[10.5px] text-left">
                      <div className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Desglose de Costos y Rentabilidad</div>
                      
                      {selPlan && (
                        <div className="flex justify-between items-center text-slate-500 border-b dark:border-slate-850/50 pb-1.5">
                          <span>Módulo enlazado:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selPlan.name}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-500">
                        <span>Consumo de créditos (Costo API):</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                          {computedCredits} {computedCredits === 1 ? 'Crédito' : 'Créditos'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500">
                        <span>Costo de Compra (ARS):</span>
                        <span className="font-extrabold text-rose-500 font-mono">
                          -${costArs.toLocaleString('es-ES')} ARS
                        </span>
                      </div>

                      {comisionVendedor > 0 && (
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Comisión Vendedor Directo:</span>
                          <span className="font-extrabold text-amber-600 font-mono">
                            -${comisionVendedor.toLocaleString('es-ES')} ARS
                          </span>
                        </div>
                      )}

                      {comisionReferente > 0 && (
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Comisión Usuario Referente:</span>
                          <span className="font-extrabold text-sky-600 font-mono">
                            -${comisionReferente.toLocaleString('es-ES')} ARS
                          </span>
                        </div>
                      )}

                      {totalComisionesVenta > 0 && (
                        <div className="flex justify-between items-center text-slate-500 border-t dark:border-slate-850/40 pt-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Total Comisiones Deducibles:</span>
                          <span className="font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                            -${totalComisionesVenta.toLocaleString('es-ES')} ARS
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t dark:border-slate-800 pt-2 text-slate-800 dark:text-slate-100 font-bold">
                        <span>Ganancia Neta Estimada:</span>
                        <span className={`font-black font-mono text-xs ${gananciaEstimada >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          ${gananciaEstimada.toLocaleString('es-ES')} ARS
                        </span>
                      </div>

                      {selPlan && costArs > 0 && (
                        <div className="flex justify-between items-center text-slate-500 text-[9.5px]">
                          <span>Retorno (ROI) Proyectado:</span>
                          <span className={`font-black font-mono ${gananciaEstimada >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            +{roiPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* SI REGISTRAMOS UN PLAN MAYORISTA (PAQUETE DE PROVEEDOR MANUAL) */}
              {editingPlanType === 'provider' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Conectar con Costo de Proveedor</label>
                    <select
                      value={planForm.provider_cost_id || ''}
                      onChange={(e) => {
                        const costId = e.target.value;
                        const matchedCost = providerCosts.find(c => c.id === costId);
                        if (matchedCost) {
                          const unitPriceUsd = matchedCost.creditos > 0 ? (matchedCost.precio / matchedCost.creditos) : 0;
                          const tokenPriceArs = unitPriceUsd > 0 ? Math.round(unitPriceUsd * dollarRate) : 1500;
                          setPlanForm({
                            ...planForm,
                            provider_cost_id: costId,
                            provider_name: matchedCost.proveedor || '',
                            token_price: tokenPriceArs,
                            value: tokenPriceArs * planForm.tokens
                          });
                          toast.info(`Vinculado a ${matchedCost.proveedor || 'Proveedor'} (${matchedCost.plan || 'Sin Plan'}) - Costo: u$s ${unitPriceUsd.toFixed(2)}/créd.`);
                        } else {
                          setPlanForm({
                            ...planForm,
                            provider_cost_id: ''
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800"
                    >
                      <option value="">-- No vincular a un costo registrado (Por defecto) --</option>
                      {providerCosts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.proveedor || 'Sin Nombre'} - {c.plan || 'Sin Plan'} (u$s {c.precio} / {c.creditos} créd.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nombre del Paquete</label>
                    <input
                      type="text"
                      placeholder="Ej. Demo 2hs o Plan Oficial 1 Mes"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Duración (Meses)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={planForm.months}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPlanForm({ ...planForm, months: val });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Duración (Horas)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={planForm.hours}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPlanForm({ ...planForm, hours: val });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Pantallas</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={planForm.screens}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPlanForm({ ...planForm, screens: val });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Tokens / Credits</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={planForm.tokens}
                        onChange={(e) => {
                          const tokValStr = e.target.value.replace(/[^0-9]/g, '');
                          const tokValNum = parseInt(tokValStr) || 0;
                          setPlanForm({
                            ...planForm,
                            tokens: tokValStr,
                            value: tokValNum * (Number(planForm.token_price) || 0)
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Conexiones Base API</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        value={planForm.max_connections ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPlanForm({ ...planForm, max_connections: val });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Máx Conexiones API</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="5"
                        value={planForm.multiple_connections ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPlanForm({ ...planForm, multiple_connections: val });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Precios Multiconx (JSON)</label>
                      <input
                        type="text"
                        placeholder='[{"connections":2,"price":1}]'
                        value={planForm.multiconx_pricing || ''}
                        onChange={(e) => setPlanForm({ ...planForm, multiconx_pricing: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border text-[10px] font-mono rounded-xl focus:outline-none dark:border-slate-800 placeholder-slate-300"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* INTERRUPTOR DE CONSOLA DE DESARROLLADOR */}
              {(() => {
                const hasConsolePermission = userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin' || hasPermission('Admin.ConsolaAPI.Ver') || hasPermission('Admin.*') || hasPermission('Seguridad.AdministradorGeneral') || user?.email === 'g3d0001@gmail.com';
                if (!hasConsolePermission) return null;
                return (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-850/60">
                    <div className="flex flex-col pr-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-750 dark:text-slate-200">
                        💻 Consola de Desarrollador
                      </span>
                      <span className="text-[8px] text-slate-400">
                        Mostrar parámetros JSON y comandos curl de la API.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={showConsoles}
                        onChange={(e) => setShowConsoles(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                );
              })()}

              {/* CONSOLA INTERACTIVA CON EL CÓDIGO DEL PLAN Y EL COMANDO XC */}
              {showConsoles && (userRole === 'Admin' || userRole === 'Administrador' || String(userRole).toLowerCase() === 'admin' || hasPermission('Admin.ConsolaAPI.Ver') || hasPermission('Admin.*') || hasPermission('Seguridad.AdministradorGeneral') || user?.email === 'g3d0001@gmail.com') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Panel 1: Código del Plan */}
                  <div className="bg-slate-950 text-slate-300 font-mono text-[9px] p-3 rounded-2xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80 mb-1.5">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                          <Terminal size={10} /> Código del Plan a Guardar
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const payloadToCopy = JSON.stringify({
                              id: editingPlanId || `sale-${Date.now()}`,
                              provider_plan_id: planForm.provider_plan_id || null,
                              name: planForm.name || "(Sin Nombre)",
                              months: Number(planForm.months) || 0,
                              hours: Number(planForm.hours) || 0,
                              screens: Number(planForm.screens) || 1,
                              tokens: Number(planForm.tokens) || 0,
                              price: Number(planForm.value) || 0,
                              ...(editingPlanType === 'sale' ? {
                                screens_api: planForm.screens_api !== '' ? Number(planForm.screens_api) : 1,
                                comision_vendedor: planForm.comision_vendedor !== '' ? Number(planForm.comision_vendedor) : 0,
                                comision_referente: planForm.comision_referente !== '' ? Number(planForm.comision_referente) : 0
                              } : {
                                provider_name: planForm.provider_name ? planForm.provider_name.trim() : 'Lucas Mayorista',
                                token_price: Number(planForm.token_price) || 1500,
                                max_connections: Number(planForm.max_connections ?? planForm.screens ?? 1),
                                multiple_connections: Number(planForm.multiple_connections ?? planForm.screens ?? 1),
                                multiconx_pricing: planForm.multiconx_pricing || ''
                              })
                            }, null, 2);
                            navigator.clipboard.writeText(payloadToCopy);
                            toast.success('¡Código copiado al portapapeles!');
                          }}
                          className="text-[8px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                        >
                          Copiar Código
                        </button>
                      </div>
                      <pre className="overflow-x-auto max-h-[110px] custom-scrollbar text-emerald-400 text-[9px] leading-relaxed select-all">
                        {JSON.stringify({
                          id: editingPlanId || `sale-${Date.now()}`,
                          provider_plan_id: planForm.provider_plan_id || null,
                          name: planForm.name || "(Sin Nombre)",
                          months: Number(planForm.months) || 0,
                          hours: Number(planForm.hours) || 0,
                          screens: Number(planForm.screens) || 1,
                          tokens: Number(planForm.tokens) || 0,
                          price: Number(planForm.value) || 0,
                          ...(editingPlanType === 'sale' ? {
                            screens_api: planForm.screens_api !== '' ? Number(planForm.screens_api) : 1,
                            comision_vendedor: planForm.comision_vendedor !== '' ? Number(planForm.comision_vendedor) : 0,
                            comision_referente: planForm.comision_referente !== '' ? Number(planForm.comision_referente) : 0
                          } : {
                            provider_name: planForm.provider_name ? planForm.provider_name.trim() : 'Lucas Mayorista',
                            token_price: Number(planForm.token_price) || 1500,
                            max_connections: Number(planForm.max_connections ?? planForm.screens ?? 1),
                            multiple_connections: Number(planForm.multiple_connections ?? planForm.screens ?? 1),
                            multiconx_pricing: planForm.multiconx_pricing || ''
                          })
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Panel 2: Comando API Panel XC/XUI */}
                  <div className="bg-slate-950 text-slate-300 font-mono text-[9px] p-3 rounded-2xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80 mb-1.5">
                        <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                          <Terminal size={10} /> Comando API (XC create_line)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const screensVal = planForm.screens_api !== '' ? Number(planForm.screens_api) : 1;
                            let curlCommand = `curl -X POST "http://dominio-panel:port/access/reseller/index.php" \\\n    -d "api_key=YOUR_KEY" \\\n    -d "action=create_line" \\\n    -d "package=${planForm.provider_plan_id || "ID_PAQUETE"}" \\\n    -d "trial=${(Number(planForm.hours) > 0) ? "1" : "0"}"`;
                            if (screensVal > 1) {
                              curlCommand += ` \\\n    -d "max_connections=${screensVal}"`;
                            }
                            curlCommand += ` \\\n    -d "reseller_notes=NOMBRE_COMPLETO_CLIENTE (XTV) - ${planForm.name || "Plan Minorista"}"`;
                            navigator.clipboard.writeText(curlCommand);
                            toast.success('¡Comando curl copiado!');
                          }}
                          className="text-[8px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                        >
                          Copiar curl
                        </button>
                      </div>
                      <pre className="overflow-x-auto max-h-[110px] custom-scrollbar text-cyan-400 text-[9px] leading-relaxed select-all whitespace-pre-wrap">
{`curl -X POST "http://dominio-panel:port/access/reseller/index.php" \\
    -d "api_key=YOUR_KEY" \\
    -d "action=create_line" \\
    -d "package=${planForm.provider_plan_id || "ID_PAQUETE"}" \\
    -d "trial=${(Number(planForm.hours) > 0) ? "1" : "0"}"${(planForm.screens_api !== '' && Number(planForm.screens_api) > 1) ? ` \\\n    -d "max_connections=${planForm.screens_api}"` : ""}${(planForm.name) ? ` \\\n    -d "reseller_notes=NOMBRE_CLIENTE (XTV) - ${planForm.name}"` : ""}`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                {editingPlanId ? 'Guardar Cambios' : 'Registrar Nuevo Plan / Combo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: FICHA DE DETALLE COMPLETO DEL CLIENTE (MÁXIMA INFO) */}
      {/* ========================================================= */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[45]"
          onClick={handleCloseAndSaveClientModal}
        >
          <div 
            className="bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl p-6 overflow-y-auto space-y-6 relative block text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            
            <button
              onClick={handleCloseAndSaveClientModal}
              className="absolute top-4 right-4 size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
              title="Guardar avances localmente y cerrar ficha"
            >
              <X size={16} />
            </button>

            {/* Titulo */}
            <div className="border-b dark:border-slate-800 pb-3 flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white">
                <User size={20} />
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Ficha Unificada de Cliente IPTV</span>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  {selectedClient.username}
                  {((selectedClient as any).bitacora_comentarios || []).some((c: any) => c.es_problematico) && (
                    <span className="text-[8px] bg-red-500 text-white font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                      <AlertTriangle size={10} className="shrink-0" /> Cliente Conflictivo
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* SISTEMA DE ADVERTENCIA CRUCIAL DE CLIENTE PROBLEMATICO */}
            {(() => {
              const itemsConflictivos = ((selectedClient as any).bitacora_comentarios || []).filter((c: any) => c.es_problematico);
              if (itemsConflictivos.length > 0) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 p-3 rounded-2xl flex gap-3 text-amber-900 dark:text-amber-400 font-sans text-xs">
                    <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
                    <div>
                      <h5 className="font-extrabold uppercase tracking-wide text-[11px]">⚠️ ADVERTENCIA: COMPORTAMIENTO PROBLEMÁTICO ({itemsConflictivos.length})</h5>
                      <p className="font-bold text-[10px] mt-0.5 text-slate-700 dark:text-slate-300">Este usuario tiene registros históricos de alerta por conducta conflictiva, falta de pago o reclamos abusivos. Manejar con máxima precaución y cautela.</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* ADVERTENCIA DE SUSCRIPCIÓN EXPIRADA (Tu membresía ha vencido) */}
            {checkVencido(selectedClient.fecha_vencimiento) && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-250 p-4 rounded-2xl space-y-3">
                <div className="flex gap-2 text-rose-700 dark:text-rose-400 font-extrabold text-[11px] leading-relaxed">
                  <AlertTriangle className="shrink-0 text-rose-500" size={18} />
                  <div>
                    <h5 className="font-black uppercase">¡Suscripción Expirada en Vivo!</h5>
                    <p className="mt-1 font-bold">El cliente se encuentra bloqueado del sistema XTV. Al iniciar la aplicación verá el siguiente aviso restrictivo corporativo:</p>
                  </div>
                </div>

                {/* Cartel simulado de bloqueo en celular del cliente */}
                <div className="bg-slate-950 text-white rounded-xl p-3 border border-rose-900/50 font-mono text-[9.5px] leading-normal uppercase">
                  <div className="text-rose-500 font-black tracking-widest mb-1">● XTV LOCKOUT STATUS</div>
                  "Tu membresía ha vencido. Por favor contacta con nosotros para renovar. Datos de contacto: WhatsApp {supportContactInfo} o correo de soporte oficial."
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Hola ${selectedClient.username}, tu membresía de XTV ha vencido. Para renovar por favor escríbenos o realiza el pago correspondiente del combo.`);
                    toast.success('Mensaje unificado para WhatsApp copiado al portapapeles');
                  }}
                  className="bg-white border rounded-lg px-2.5 py-1.5 text-[9px] font-black text-slate-800 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                >
                  <Copy size={11} /> Copiar Aviso de Renovación
                </button>
              </div>
            )}

            {/* INDIVIDUAL TABBED SYSTEM CONTROLS (Misma textura, bordes y fuentes con contraste excelente) */}
            <div className="flex border-b dark:border-slate-800 gap-1 overflow-x-auto mb-3">
              <button
                type="button"
                onClick={() => setActiveClientTab('info')}
                className={`py-2 px-3 text-[10px] font-black uppercase rounded-t-xl transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeClientTab === 'info'
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Info size={13} /> Información de Acceso
              </button>
              <button
                type="button"
                onClick={() => setActiveClientTab('profiles')}
                className={`py-2 px-3 text-[10px] font-black uppercase rounded-t-xl transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeClientTab === 'profiles'
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Users size={13} /> Subperfiles ({profiles.filter(p => p.username_cuenta === selectedClient.username).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveClientTab('soporte')}
                className={`py-2 px-3 text-[10px] font-black uppercase rounded-t-xl transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeClientTab === 'soporte'
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <MessageSquare size={13} /> Bitácora Chat Soporte
              </button>
              <button
                type="button"
                onClick={() => setActiveClientTab('comentarios')}
                className={`py-2 px-3 text-[10px] font-black uppercase rounded-t-xl transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeClientTab === 'comentarios'
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <AlertTriangle size={13} /> Bitácora Comentario ({((selectedClient as any).bitacora_comentarios || []).length})
              </button>
            </div>

            {/* UNIFIED CONTAINER CARD WITH EXACTLY THE SAME OUTLINE, BACKGROUND TEXTURE AND CONTRAST */}
            {/* UNIFIED CONTAINER CARD WITH EXACTLY THE SAME OUTLINE, BACKGROUND TEXTURE AND CONTRAST */}
            <div className="bg-slate-50 dark:bg-slate-905 p-4 rounded-2xl border dark:border-slate-800 min-h-[300px]">

              {/* TAB 1: ACCESO & INFORMACIÓN GENERAL */}
              {activeClientTab === 'info' && (() => {
                const provPlan = providerPlans?.find(p => p.id === selectedClient.id_plan_proveedor);
                const salePlan = salePlans?.find(p => p.id === selectedClient.id_plan_venta);
                
                const rawCost = provPlan ? Number(provPlan.cost) : 0;
                const rawPrice = salePlan ? Number(salePlan.price) : 0;
                const rawComision = salePlan ? Number(salePlan.comision || 0) : 0;
                const margin = rawPrice - rawCost - rawComision;

                const cleanPhone = (selectedClient.celular || '').replace(/\D/g, '');
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : '54' + cleanPhone}` : null;
                const isMapsLink = (selectedClient.direccion_actual || '').toLowerCase().includes('maps.google') || (selectedClient.direccion_actual || '').toLowerCase().includes('google.com/maps') || (selectedClient.direccion_actual || '').toLowerCase().includes('maps.app.goo.gl');

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-normal">
                      
                      {/* CAJA 1: IDENTIDAD Y CONTACTO CLIENTE */}
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-sm">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">👤 Perfil & Contacto Personal</span>
                          <div className="space-y-2 text-[11px] font-bold font-sans">
                            <div className="flex justify-between items-start">
                              <span className="text-slate-400">Nombre Real:</span>
                              <span className="text-slate-800 dark:text-white font-extrabold text-right">{selectedClient.nombre_completo || 'No Registrado'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Celular Móvil:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-800 dark:text-white font-mono">{selectedClient.celular || 'No Registrado'}</span>
                                {waUrl && (
                                  <a 
                                    href={waUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                                    title="Escribir al WhatsApp de este cliente de forma directa"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-start leading-tight">
                              <span className="text-slate-400 shrink-0">Dirección GPS:</span>
                              <div className="text-right">
                                {isMapsLink ? (
                                  <a 
                                    href={selectedClient.direccion_actual} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-indigo-500 font-extrabold hover:underline text-[10px] break-all max-w-[150px] inline-block"
                                    title="Abrir ubicación GPS en Google Maps"
                                  >
                                    📍 Ver ubicación GPS Google Maps
                                  </a>
                                ) : (
                                  <span className="text-slate-800 dark:text-white text-[10.5px] max-w-[155px] inline-block break-words">{selectedClient.direccion_actual || 'No Registrada'}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-900">
                              <span className="text-slate-400">Fecha de Alta:</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                                {selectedClient.fecha_creacion 
                                  ? new Date(selectedClient.fecha_creacion).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})
                                  : 'No disponible'}
                              </span>
                            </div>

                            {/* RESPUESTA RÁPIDA (OPCIÓN C) */}
                            <button
                              type="button"
                              onClick={() => {
                                setMessageClient(selectedClient);
                                setSelectedTemplateId('');
                                setCustomizedMessageText('');
                                setShowMessageModal(true);
                              }}
                              className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 py-2 rounded-xl text-[9.5px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border dark:border-slate-700"
                              title="Seleccionar una respuesta rápida con variables dinámicas de este cliente para copiar o WhatsApp"
                            >
                              <MessageSquare size={13} /> Enviar Respuesta Rápida (Opción C)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CAJA 2: CREDENCIALES DE ACCESO TÉCNICO IPTV */}
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-sm">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">⚡ Credenciales de Acceso Xtream</span>
                          <div className="space-y-1.5 text-[11px] font-bold font-sans">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-400">Usuario Xtream:</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-100 border dark:border-slate-850">{selectedClient.username}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedClient.username);
                                    toast.success("Usuario copiado al portapapeles");
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  title="Copiar Usuario"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-400">Contraseña:</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-100 border dark:border-slate-850">
                                  {visiblePasswords[selectedClient.username] ? selectedClient.password : '••••••••'}
                                </span>
                                <button 
                                  type="button"
                                  onClick={(e) => togglePasswordVisibility(selectedClient.username, e)} 
                                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Ver / Ocultar"
                                >
                                  {visiblePasswords[selectedClient.username] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedClient.password);
                                    toast.success("Contraseña copiada al portapapeles");
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  title="Copiar Contraseña"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-900">
                              <span className="text-slate-400 shrink-0">DNS URL Host:</span>
                              <div className="flex items-center gap-1 justify-end max-w-[130px] sm:max-w-none">
                                <span className="text-[10px] text-slate-500 font-mono break-all text-right select-all">{selectedClient.url_panel_asignada}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedClient.url_panel_asignada);
                                    toast.success("DNS URL Host copiado al portapapeles");
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                                  title="Copiar DNS URL Host"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CAJA 3: PLAN DE VENTAS Y RENTABILIDAD */}
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800 sm:col-span-2 space-y-3 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block pb-1 border-b dark:border-slate-900">📊 Plan Comercial & Costeo Analítico</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-bold font-sans">
                          
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1 border dark:border-slate-850">
                            <span className="text-[8px] font-black uppercase text-indigo-500 block">🛍️ Plan de Venta Minorista</span>
                            <div className="font-extrabold text-slate-800 dark:text-white truncate max-w-full" title={salePlan ? salePlan.name : 'Por Defecto - 1 Mes'}>
                              {salePlan ? salePlan.name : 'Venta Manual / Directa'}
                            </div>
                            <div className="text-[12px] font-black text-slate-900 dark:text-white font-mono mt-1">
                              Precio de Venta: <span className="text-indigo-500">${rawPrice || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1 border dark:border-slate-850">
                            <span className="text-[8px] font-black uppercase text-slate-500 block">📦 Plan Proveedor Mayorista</span>
                            <div className="font-extrabold text-slate-600 dark:text-slate-305 truncate max-w-full" title={provPlan ? provPlan.name : 'Genérico - 1 Token'}>
                              {provPlan ? provPlan.name : 'Token Genérico'}
                            </div>
                            <div className="text-[12px] font-bold text-slate-600 dark:text-slate-400 font-mono mt-1">
                              Costo Mayorista: <span className="text-slate-800 dark:text-slate-200">${rawCost || '?' }</span>
                            </div>
                          </div>

                          <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl space-y-1 border border-indigo-500/15 flex flex-col justify-center">
                            <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">💵 Rentabilidad de Caja</span>
                            <div className="text-[14px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                              Profit Neto: ${margin >= 0 ? `+${margin}` : margin}
                            </div>
                            {rawComision > 0 && (
                              <span className="text-[8.5px] font-bold text-amber-600 block font-mono">
                                Comisión Reseller: -${rawComision}
                              </span>
                            )}
                            {rawPrice > 0 && (
                              <span className="text-[9px] font-black text-slate-500 block font-mono">
                                Margen Neto: {((margin / rawPrice) * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* CAJA 4: MEMBRESÍA XTV Y VIGENCIA */}
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800 sm:col-span-2 text-[11px] font-bold font-sans space-y-2 pb-3 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block pb-1 border-b dark:border-slate-900">📅 Control de Membresía & Vigencia XTV</span>
                        
                        <div className="flex justify-between items-center text-[11px] font-sans">
                          <span className="text-slate-400 font-bold">Fin de Suscripción Vigente:</span>
                          <span className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${checkVencido(selectedClient.fecha_vencimiento) ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'}`}>
                            {formatCompactDate(selectedClient.fecha_vencimiento)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-sans">
                          <span className="text-slate-400 font-bold">Límite Local (Vendido):</span>
                          <span className="text-slate-800 dark:text-white font-extrabold">{selectedClient.limite_pantallas || 1} {selectedClient.limite_pantallas === 1 ? 'pantalla' : 'pantallas'}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-sans">
                          <span className="text-slate-400 font-bold">Límite Proveedor (API):</span>
                          <span className="text-slate-800 dark:text-white font-extrabold">{(selectedClient as any).limite_pantallas_api || 3} {((selectedClient as any).limite_pantallas_api || 3) === 1 ? 'conexión' : 'conexiones'}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100 dark:border-slate-900">
                          <span className="text-slate-400 font-bold">Onboarding de Aplicación:</span>
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black uppercase ${selectedClient.primer_login_completado ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-955/10'}`}>
                            {selectedClient.primer_login_completado ? 'Completado (Home & Banner Activos)' : 'Primer Ingreso Pendiente'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {selectedClient.comentarios && (
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800 border-l-4 border-l-slate-400 pt-3">
                        <span className="text-[8px] font-black uppercase text-slate-400 block pb-1">Notas logísticas de caja:</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-350 leading-relaxed font-bold">{selectedClient.comentarios}</p>
                      </div>
                    )}

                    {/* Acciones en Vivo si viene del Panel API */}
                    {selectedClient.isFromApi && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-450 flex items-center gap-1">
                            <Globe size={11} /> Acciones Técnicas en Vivo (XM Reseller API)
                          </span>
                          <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-full">Sincronizado</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-1 font-sans">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`¿Habilitar línea técnica para "${selectedClient.username}"?`)) {
                                toast.loading("Habilitando línea en el panel...");
                                try {
                                  const res = await fetch("/api/iptv/xui", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "enable_line",
                                      xuiUrl: xuiConfig.xui_url,
                                      xuiToken: xuiConfig.xui_token,
                                      username: selectedClient.username
                                    })
                                  });
                                  const dat = await res.json();
                                  toast.dismiss();
                                  if (dat.success) {
                                    toast.success("¡Línea habilitada exitosamente en el panel!");
                                    setSelectedClient({ ...selectedClient, estado: 'Activo' });
                                    await fetchApiAccounts(true);
                                  } else {
                                    toast.error(`Fallo: ${dat.error || "No se pudo habilitar"}`);
                                  }
                                } catch (e: any) {
                                  toast.dismiss();
                                  toast.error(`Error: ${e.message}`);
                                }
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle size={11} /> Habilitar
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`¿Pausar/Deshabilitar línea técnica para "${selectedClient.username}"?`)) {
                                toast.loading("Pausando línea en el panel...");
                                try {
                                  const res = await fetch("/api/iptv/xui", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "disable_line",
                                      xuiUrl: xuiConfig.xui_url,
                                      xuiToken: xuiConfig.xui_token,
                                      username: selectedClient.username
                                    })
                                  });
                                  const dat = await res.json();
                                  toast.dismiss();
                                  if (dat.success) {
                                    toast.success("¡Línea pausada con éxito!");
                                    setSelectedClient({ ...selectedClient, estado: 'Pausado' });
                                    await fetchApiAccounts(true);
                                  } else {
                                    toast.error(`Fallo: ${dat.error || "No se pudo deshabilitar"}`);
                                  }
                                } catch (e: any) {
                                  toast.dismiss();
                                  toast.error(`Error: ${e.message}`);
                                }
                              }
                            }}
                            className="bg-amber-605 hover:bg-amber-700 text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Lock size={11} /> Deshabilitar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleImportToLocal(selectedClient)}
                            className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Database size={11} /> Importar Localmente
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`¿ALERTA MÁXIMA!\nEsta acción eliminará de forma irreversible el usuario "${selectedClient.username}" de tu panel de créditos reseller. ¿Estás seguro?`)) {
                                toast.loading("Borrando línea técnica en el panel...");
                                try {
                                  const res = await fetch("/api/iptv/xui", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "delete_line",
                                      xuiUrl: xuiConfig.xui_url,
                                      xuiToken: xuiConfig.xui_token,
                                      username: selectedClient.username
                                    })
                                  });
                                  const dat = await res.json();
                                  toast.dismiss();
                                  if (dat.success) {
                                    toast.success("¡Línea eliminada de forma definitiva del panel!");
                                    setSelectedClient(null);
                                    await fetchApiAccounts(true);
                                  } else {
                                    toast.error(`Fallo: ${dat.error || "No se pudo eliminar"}`);
                                  }
                                } catch (e: any) {
                                  toast.dismiss();
                                  toast.error(`Error: ${e.message}`);
                                }
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 size={11} /> Borrar del Panel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB 2: GESTIÓN DE SUBPERFILES */}
              {activeClientTab === 'profiles' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b dark:border-slate-800">
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 font-sans">Subperfiles del Hogar ({profiles.filter(p => p.username_cuenta === selectedClient.username).length} / 5)</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Asigna perfiles familiares independientes estilo streaming con PIN y avatares personalizados.</p>
                    </div>

                    {profiles.filter(p => p.username_cuenta === selectedClient.username).length < 5 && (
                      <button
                        type="button"
                        onClick={() => setShowProfileForm(!showProfileForm)}
                        className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-[9.5px] font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer w-fit"
                      >
                        <Plus size={11} /> {showProfileForm ? 'Cancelar Registro' : 'Añadir Perfil'}
                      </button>
                    )}
                  </div>

                  {/* Formulario Inline de Creación */}
                  {showProfileForm && (
                    <form onSubmit={handleAddSubprofile} className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 space-y-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block text-left">Registrar Nuevo Perfil Familiar</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase text-slate-400">Nombre de la pantalla</label>
                          <input
                            type="text"
                            placeholder="Ej. Living, Dormitorio, Papá..."
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase text-slate-400">PIN de 4 dígitos (Opcional)</label>
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Ej. 1234 (vacío para libre)"
                            value={newProfilePin}
                            onChange={(e) => setNewProfilePin(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">Preset de Avatar</label>
                          <div className="flex gap-2 items-center mt-1 overflow-x-auto py-1">
                            {[
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
                              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
                              'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
                            ].map((av, avIdx) => (
                              <button
                                key={avIdx}
                                type="button"
                                onClick={() => setNewProfileAvatar(av)}
                                className={`size-8 rounded-full overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                                  newProfileAvatar === av ? 'border-slate-900 dark:border-white scale-110 shadow' : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img src={av} alt="Avatar Preset" className="size-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t dark:border-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileForm(false);
                            setNewProfileName('');
                            setNewProfilePin('');
                            setNewProfileAvatar('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-850 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Guardar Subperfil
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Listado en Rejilla estilo Netflix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {profiles.filter(p => p.username_cuenta === selectedClient.username).map(p => {
                      return (
                        <div key={p.id} className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="size-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img src={p.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.nombre_perfil}`} alt="Avatar" className="size-full object-cover" />
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-black text-slate-850 dark:text-white block">{p.nombre_perfil}</span>
                              <span className="text-[9px] text-slate-400 block font-bold flex items-center gap-1.5 mt-0.5">
                                {p.pin_perfil ? (
                                  <span className="flex items-center gap-1">
                                    <Lock size={10} className="text-amber-500" /> PIN: {p.pin_perfil}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Unlock size={10} className="text-emerald-500" /> Acceso Libre
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubprofile(p.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            title="Eliminar este subperfil de la cuenta"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}

                    {profiles.filter(p => p.username_cuenta === selectedClient.username).length === 0 && (
                      <div className="col-span-full py-8 text-center bg-white dark:bg-slate-950 rounded-xl border dark:border-slate-800 italic text-[11px] text-slate-400 font-medium">
                        Esta cuenta no posee subperfiles familiares aún. Crea el primero desde el botón superior de adición.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CANAL DE SOPORTE & SESIONES ACTIVAS EN VIVO */}
              {activeClientTab === 'soporte' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 font-sans">Canal de Soporte Directo & Sesiones Activas en Vivo</h4>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">Visualiza las conexiones activas en tiempo real para expulsar usuarios excedidos o asentar chats en la bitácora de soporte.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Panel 1: Sesiones Activas y Expulsión (5 columnas) */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-sans">
                            <Activity size={11} className="text-indigo-500 animate-pulse animate-none" /> Conexiones Concurrentes
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-500 font-black">
                            {activeSessions.filter(s => s.username_cuenta === selectedClient.username).length} de {selectedClient.limite_pantallas || 2} Activas
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {activeSessions.filter(s => s.username_cuenta === selectedClient.username).map(sess => {
                            const matchedProfileName = profiles.find(p => p.id === sess.perfil_id)?.nombre_perfil || 'Domo Familiar';
                            return (
                              <div key={sess.id} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg flex items-center justify-between text-left gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{sess.marca_modelo}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 block mt-0.5 font-bold truncate">
                                    Perfil: <strong className="text-indigo-500">{matchedProfileName}</strong> · IP: {sess.ip_conexion}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`¿Expulsar la transmisión en vivo del dispositivo ${sess.marca_modelo}? Esto obligará un reinicio de credencial en el de forma forzosa.`)) {
                                      const res = await apiService.deleteIptvActiveSession(sess.id);
                                      if (res.success) {
                                        toast.success(`Transmisión de ${sess.marca_modelo} expulsada y desconectada con éxito.`);
                                        await fetchData();
                                      } else {
                                        toast.error('Ocurrió un error al expulsar la sesión.');
                                      }
                                    }
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-500 hover:text-rose-650 p-1.5 rounded-lg border border-rose-105 dark:border-rose-900/40 text-[9px] font-bold cursor-pointer transition-colors shrink-0"
                                  title="Expulsar de inmediato al dispositivo reproduciendo"
                                >
                                  Expulsar
                                </button>
                              </div>
                            );
                          })}

                          {activeSessions.filter(s => s.username_cuenta === selectedClient.username).length === 0 && (
                            <p className="text-[10px] text-slate-400 italic font-medium py-6 text-center">No hay pantallas de televisión activas transmitiendo contenido en este momento.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Bitácora Chat Soporte (7 columnas) */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 space-y-3 flex flex-col justify-between h-[300px]">
                        {/* Lista de mensajes de Chat */}
                        <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[190px]">
                          {((selectedClient as any).chat_soporte || []).length === 0 ? (
                            <p className="text-[10.5px] text-slate-400 italic text-center font-medium py-10">No se registran interacciones en el historial del ticket todavía.</p>
                          ) : (
                            ((selectedClient as any).chat_soporte || []).map((msg: any, iIdx: number) => {
                              const isOp = msg.sender === 'operador';
                              return (
                                <div key={iIdx} className={`flex flex-col text-left ${isOp ? 'items-end' : 'items-start'}`}>
                                  <div className={`p-2.5 rounded-xl text-[11px] leading-snug font-bold max-w-[85%] ${
                                    isOp 
                                      ? 'bg-slate-900 text-white dark:bg-indigo-650' 
                                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                  }`}>
                                    <p className="break-words font-sans">{msg.text}</p>
                                  </div>
                                  <span className="text-[8px] text-slate-400 mt-1 font-mono uppercase font-black px-1 mt-0.5">
                                    {isOp ? 'Soporte Admin' : 'Cliente'} · {new Date(msg.date).toLocaleTimeString()}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Conversación Form */}
                        <form onSubmit={handleAddChatMessage} className="flex gap-2 pt-2 border-t dark:border-slate-900 text-left">
                          <select
                            value={newChatSender}
                            onChange={(e: any) => setNewChatSender(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border text-[9px] font-black uppercase px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-705 dark:text-slate-300"
                            title="Seleccionar remitente de la respuesta"
                          >
                            <option value="operador">Admin</option>
                            <option value="cliente">Cliente (Mock)</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Redactar comentario/respuesta de soporte..."
                            value={newChatMsg}
                            onChange={(e) => setNewChatMsg(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          />
                          <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-[9.5px] font-black uppercase px-3 rounded-lg cursor-pointer"
                          >
                            Enviar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BITÁCORA INTERNA DE COMENTARIOS */}
              {activeClientTab === 'comentarios' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 font-sans">Bitácora Interna de Comentarios Críticos & Operativos ({((selectedClient as any).bitacora_comentarios || []).filter((c: any) => !c.is_system).length})</h4>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">Escribe notas privadas o incidentes críticos sobre pagos, zonas geográficas de cobertura o fallas de servicio.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Historial (7 col) */}
                    <div className="lg:col-span-7 space-y-2 max-h-[300px] overflow-y-auto">
                      {(() => {
                        const visibleBitacora = ((selectedClient as any).bitacora_comentarios || []).filter((c: any) => !c.is_system);
                        return visibleBitacora.length === 0 ? (
                          <div className="py-12 bg-white dark:bg-slate-950 rounded-xl border dark:border-slate-800 italic text-[11px] text-slate-400 font-medium text-center">
                            No existen anotaciones guardadas para este cliente todavía.
                          </div>
                        ) : (
                          visibleBitacora.map((bit: any, bIdx: number) => {
                            return (
                              <div key={bIdx} className={`p-3 bg-white dark:bg-slate-950 rounded-xl border text-left relative ${
                                bit.es_problematico ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-slate-400'
                              }`}>
                                {bit.es_problematico && (
                                  <span className="absolute top-3 right-3 bg-rose-100 text-rose-600 dark:bg-rose-955/30 dark:text-rose-455 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                                    Alerta de Caja
                                  </span>
                                )}
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-normal break-words max-w-[85%] font-sans">
                                  {bit.text}
                                </p>
                                <div className="flex gap-2 items-center mt-2 text-[9px] text-slate-400 font-bold">
                                  <span className="text-[9.5px] text-teal-600 dark:text-teal-400 font-extrabold">⚡ Administrador</span>
                                  <span>·</span>
                                  <span className="font-mono">{formatCompactDate(bit.date)} {new Date(bit.date).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>

                    {/* Formulario (5 col) */}
                    <form onSubmit={handleAddComenBitacora} className="lg:col-span-5 bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 space-y-4">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block text-left">Asentar Nuevo Evento de Bitácora</span>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400">Anotación Administrativa</label>
                        <textarea
                          placeholder="Ingresa notas operacionales del cliente para auditoría..."
                          value={newComenBitacora}
                          onChange={(e) => setNewComenBitacora(e.target.value)}
                          rows={3}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-left cursor-pointer select-none">
                        <input
                          id="check_bit_problem"
                          type="checkbox"
                          checked={newComenEsProblematico}
                          onChange={(e) => setNewComenEsProblematico(e.target.checked)}
                          className="size-3.5 rounded border text-slate-900 font-black accent-rose-500 cursor-pointer"
                        />
                        <label htmlFor="check_bit_problem" className="text-[10px] font-black text-rose-500 uppercase cursor-pointer">
                          Marcar como alerta de caja
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 dark:bg-slate-800 text-white text-[9.5px] font-black uppercase py-2 rounded-lg tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Asentar Registro
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
