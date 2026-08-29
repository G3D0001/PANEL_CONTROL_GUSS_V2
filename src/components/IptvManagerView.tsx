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
  Terminal
} from 'lucide-react';
import { apiService, IptvCostoProveedor } from '../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

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
  comision?: number; // Comisión total/vendedor legacy
  comision_vendedor?: number; // Comisión para el vendedor que despacha la línea
  comision_padre?: number; // Comisión para el invitador/patrocinador del vendedor
  categoria_nombre?: string;
  categoria_id?: 'demo' | 'vip' | 'xxx';
}

interface IptvAccount {
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
  const [accounts, setAccounts] = useState<IptvAccount[]>([]);
  
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
  const [loading, setLoading] = useState(true);
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
    comision_padre: string | number;
    categoria_nombre?: string;
    categoria_id?: 'demo' | 'vip' | 'xxx';
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
    comision_padre: '',
    categoria_nombre: '',
    categoria_id: 'vip'
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
          rawData.user_info?.credits,
          rawData.user_data?.credits,
          rawData.credit,
          rawData.balance,
          rawResp.credits,
          rawResp.user_info?.credits,
          rawResp.user_data?.credits,
          rawResp.credit,
          rawResp.balance,
          xuiData.credits,
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
          rawData.user_info?.credits,
          rawData.user_data?.credits,
          rawData.credit,
          rawData.balance,
          rawResp.credits,
          rawResp.user_info?.credits,
          rawResp.user_data?.credits,
          rawResp.credit,
          rawResp.balance,
          xuiData.credits,
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

      setProviderPlans(finalMergedList);
      await apiService.saveIptvFinances({
        ...financesRef.current,
        provider_plans: finalMergedList,
        sale_plans: (salePlansRef.current && salePlansRef.current.length > 0) ? salePlansRef.current : (financesRef.current?.sale_plans || []),
        partners: (partnersRef.current && partnersRef.current.length > 0) ? partnersRef.current : (financesRef.current?.partners || [])
      });

      if (!silent) {
        toast.dismiss();
        toast.success(`¡Sincronizado con éxito! Se cargaron ${mappedBouquets.length} bouquets reales desde tu panel.`);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Intentamos cargar la configuración centralizada de la API de XUI.ONE
      let sysConf: any = null;
      try {
        sysConf = await apiService.getSystemConfig();
        if (sysConf) {
          const isActiveXc = sysConf.iptv_panel_active === 'xc_reseller';
          setXuiConfig({
            xui_url: (isActiveXc ? sysConf.xc_url_completa : sysConf.xui_url) || '',
            xui_token: (isActiveXc ? sysConf.xc_token : sysConf.xui_token) || '',
            xui_access_code: (isActiveXc ? sysConf.xc_access_code : sysConf.xui_access_code) || '',
            xui_package_id: (isActiveXc ? sysConf.xc_package_id : sysConf.xui_package_id) || '1',
            iptv_panel_active: sysConf.iptv_panel_active || 'xui_one'
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
      } catch (err) {
        console.warn("Error leyendo configuración centralizada XUI.ONE", err);
      }

      // 1. Obtener datos clave de IPTV del API Service
      const accs = await apiService.getIptvAccounts();
      // Sincronizar localStorage con la base de datos real para purgar obsoletos locales
      localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(accs));
      const profs = await apiService.getIptvProfiles();
      const hist = await apiService.getIptvPlaybackHistory();
      const sess = await apiService.getIptvActiveSessions();
      const brand = await apiService.getIptvBranding();
      const finObj = await apiService.getIptvFinances();

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

      // Cargar costos de proveedor de la tabla dedicada iptv_costos_proveedor
      const cProveedor = await apiService.getIptvCostosProveedor();
      setProviderCosts(cProveedor);

      // Cargar solicitudes de la app APK/web (iptv2)
      try {
        const regs = await apiService.getIptv2ClientesRegistros();
        const dMacs = await apiService.getIptv2DispositivosMac();
        setRegistros(regs || []);
        setMacs(dMacs || []);
      } catch (regsErr) {
        console.warn("Error cargando registros o macs de iptv2:", regsErr);
      }

      setProviderPlans(currentProviderPlans);
      setSalePlans(currentSalePlans);
      setPartners(currentPartners);

      setFinances({
        ...loadedFinances,
        provider_plans: currentProviderPlans,
        sale_plans: currentSalePlans,
        partners: currentPartners
      });

      // Banners persistidos en branding o fallback local
      if (brand) {
        setBrandLogoUrl(brand.logo_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80');
        setBrandPromoSpotUrl(brand.promo_spot_url || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHE4OWpvaXZ4cHJ5eDZ4ZWR2c2k4MGh0amNhdXFpOG9ubnF1Z2U4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif');
        
        if (brand.banners_rotativos) {
          setBanners(brand.banners_rotativos);
        } else {
          // Inicializar banners demo
          const defaultBanners: BannerAd[] = [
            { id: 'b-1', name: 'Gran Estreno de Fin de Semana', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', active: true },
            { id: 'b-2', name: 'Super Promo Canales de Deporte', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80', active: true }
          ];
          setBanners(defaultBanners);
        }

        if (brand.img_settings) {
          setImgSettings({
            logo: { zoom: 1, x: 0, y: 0, ...(brand.img_settings.logo || {}) },
            spot: { zoom: 1, x: 0, y: 0, ...(brand.img_settings.spot || {}) }
          });
        }
      }

      setAccounts(accs);
      setProfiles(profs);
      setPlaybackHistory(hist);
      setActiveSessions(sess);

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
          setTimeout(() => {
            syncLiveCredits(true, actualUrl, actualToken, actualCode).catch(() => {});
            syncXuiPackages(true, actualUrl, actualToken, actualCode, actualPkgId).catch(() => {});
          }, 1200);
        }
      }

    } catch (e) {
      toast.error('Error general al sincronizar IPTV Central');
    } finally {
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

            return {
              username: line.username || line.nombre_usuario || '',
              password: line.password || line.contraseña || '',
              url_panel_asignada: xuiConfig.xui_url,
              estado: finalStatus,
              limite_pantallas: line.max_connections !== undefined ? Number(line.max_connections) : (line.is_isp_locked ? 1 : 2),
              fecha_creacion: line.creado_en || line.created_at || new Date().toISOString(),
              fecha_vencimiento: expirationIso,
              comentarios: line.reseller_notes || line.notas_del_revendedor || line.comentarios || '',
              isFromApi: true,
              id_linea_panel: line.id
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
    customAvailableCredits?: number
  ) => {
    const provList = updatedProvider !== undefined ? updatedProvider : providerPlansRef.current;
    const saleList = updatedSale !== undefined ? updatedSale : salePlansRef.current;
    const partList = updatedPartners !== undefined ? updatedPartners : partnersRef.current;

    const rateVal = customRate !== undefined ? customRate : dollarRate;
    const pkgUsdVal = customPkgUsd !== undefined ? customPkgUsd : tokenPackageUsd;
    const providerNameVal = customProviderName !== undefined ? customProviderName : providerName;
    const creditsPerPackVal = customCreditsPerPack !== undefined ? customCreditsPerPack : creditsPerPack;
    const availableCreditsVal = customAvailableCredits !== undefined ? customAvailableCredits : availableCredits;

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
      available_credits: availableCreditsVal
    };

    // Guardar en localStorage de inmediato para persistencia permanente en recarga
    localStorage.setItem('g3d_iptv_active_dollar_rate', String(rateVal));
    localStorage.setItem('g3d_iptv_active_token_package_usd', String(pkgUsdVal));
    localStorage.setItem('g3d_iptv_active_provider_name', providerNameVal);
    localStorage.setItem('g3d_iptv_active_credits_per_pack', String(creditsPerPackVal));
    localStorage.setItem('g3d_iptv_active_available_credits', String(availableCreditsVal));

    setFinances(updatedFinances);
    await apiService.saveIptvFinances(updatedFinances);
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
      const randNum = Math.floor(10000 + Math.random() * 90000);
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

    let hours = 1;
    const matchedPlan = providerPlans.find(p => p.id === demoPackage);
    if (matchedPlan) {
      const nameLower = matchedPlan.name.toLowerCase();
      if (nameLower.includes('3h') || nameLower.includes('3 hora')) hours = 3;
      else if (nameLower.includes('6h') || nameLower.includes('6 hora')) hours = 6;
      else if (nameLower.includes('4h') || nameLower.includes('4 hora')) hours = 4;
      else if (nameLower.includes('2h') || nameLower.includes('2 hora')) hours = 2;
      else if (nameLower.includes('12h') || nameLower.includes('12 hora')) hours = 12;
      else if (nameLower.includes('24h') || nameLower.includes('24 hora')) hours = 24;
    }

    const expDate = new Date(Date.now() + hours * 3600000).toISOString().substring(0, 19).replace('T', ' ');

    const newDemoAccount: any = {
      username: finalUsername,
      password: finalPassword,
      url_panel_asignada: xuiConfig.xui_url || 'http://vip-xtv.pro:8080',
      estado: 'Activo',
      limite_pantallas: 1,
      fecha_vencimiento: expDate,
      id_plan_proveedor: demoPackage,
      id_plan_venta: '',
      sociedad_id: 'soc-central',
      comentarios: demoResellerNotes || 'Demo de prueba creada desde panel',
      contacto_email: demoContactEmail || '',
      es_demo: true,
      creado_por: user?.id || user?.email || 'admin'
    };

    try {
      const res = await apiService.saveIptvAccount(newDemoAccount);
      if (res.success) {
        setAccounts(prev => [newDemoAccount, ...prev]);
        setDemoCreatedResult({
          username: finalUsername,
          password: finalPassword
        });
        toast.success('¡Demo creada exitosamente!');
      } else {
        toast.error('Error al registrar la demo en el sistema');
      }
    } catch (e: any) {
      toast.error('Error: ' + (e.message || String(e)));
    } finally {
      setIsSavingIptv(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Selector de Pestañas de IPTV */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Tv size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Administración Central IPTV</h1>
            <p className="text-xs text-slate-500">Control operativo, clientes, finanzas, branding y solicitudes mayoristas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {isTabAllowed('clientes') && (
            <button
              onClick={() => setActiveTab('clientes')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'clientes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Users size={14} />
              Clientes & Líneas
            </button>
          )}
          {isTabAllowed('finanzas') && (
            <button
              onClick={() => setActiveTab('finanzas')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'finanzas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <DollarSign size={14} />
              Finanzas & Planes
            </button>
          )}
          {isTabAllowed('branding') && (
            <button
              onClick={() => setActiveTab('branding')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'branding'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Sparkles size={14} />
              Branding & Banners
            </button>
          )}
          {isTabAllowed('mensajes') && (
            <button
              onClick={() => setActiveTab('mensajes')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'mensajes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <MessageSquare size={14} />
              Mensajería & Plantillas
            </button>
          )}
          {isTabAllowed('solicitudes') && (
            <button
              onClick={() => setActiveTab('solicitudes')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'solicitudes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <ShieldAlert size={14} />
              Solicitudes & Créditos
            </button>
          )}
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Gestión de Líneas & Clientes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Administra cuentas activas, demos, vencimientos y bitácora de soporte</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartDemoAccountRegistration}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                + Crear Demo
              </button>
              <button
                onClick={handleStartFullAccountRegistration}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Users size={14} />
                + Nueva Cuenta Oficial
              </button>
            </div>
          </div>

          {/* Tabla de Cuentas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Cuentas Registradas ({accounts.length})</span>
              <button onClick={fetchData} className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>
            {accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Contraseña</th>
                      <th className="p-3">Vencimiento</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Pantallas</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accounts.map(acc => (
                      <tr key={acc.username} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{acc.username}</td>
                        <td className="p-3 font-mono text-slate-500">
                          {visiblePasswords[acc.username] ? acc.password : '••••••••'}
                          <button onClick={(e) => togglePasswordVisibility(acc.username, e)} className="ml-2 text-slate-400 hover:text-slate-600">
                            {visiblePasswords[acc.username] ? <EyeOff size={12} className="inline" /> : <Eye size={12} className="inline" />}
                          </button>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{acc.fecha_vencimiento || 'Sin fecha'}</td>
                        <td className="p-3">
                          <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                            acc.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          )}>
                            {acc.estado}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{acc.limite_pantallas || 1}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedClient(acc)}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">No hay cuentas registradas.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Demo */}
      {showDemoAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-base font-extrabold text-white">Crear Cuenta Demo Oficial</h3>
              </div>
              <button onClick={() => setShowDemoAccountModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {!demoCreatedResult ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Prefijo de Usuario (Opcional, mín. 8 caracteres)</label>
                  <input
                    type="text"
                    value={demoCustomUsernamePrefix}
                    onChange={(e) => setDemoCustomUsernamePrefix(e.target.value)}
                    placeholder="Dejar vacío para generar automático"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Duración de la Prueba</label>
                  <select
                    value={demoPackage}
                    onChange={(e: any) => setDemoPackage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="pkg-1h">1 Hora de Prueba</option>
                    <option value="pkg-3h">3 Horas de Prueba</option>
                    <option value="pkg-6h">6 Horas de Prueba</option>
                    <option value="pkg-4h-3p">4 Horas (3 Pantallas)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Notas del Cliente / Teléfono</label>
                  <input
                    type="text"
                    value={demoResellerNotes}
                    onChange={(e) => setDemoResellerNotes(e.target.value)}
                    placeholder="Ej: Demo para Carlos vía WhatsApp"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowDemoAccountModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateDemoAccountSubmit}
                    disabled={isSavingIptv}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSavingIptv ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isSavingIptv ? 'Creando Demo...' : 'Generar Demo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-4 text-left">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle size={16} />
                  Demo Creada Exitosamente
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block font-sans">Usuario</span>
                    <span className="text-emerald-400 font-bold select-all">{demoCreatedResult.username}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block font-sans">Contraseña</span>
                    <span className="text-emerald-400 font-bold select-all">{demoCreatedResult.password}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setDemoCreatedResult(null);
                      setShowDemoAccountModal(false);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}