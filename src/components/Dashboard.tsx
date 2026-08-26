import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Users,
  Coins,
  Sparkles,
  Smartphone,
  Search,
  Plus,
  Check,
  X,
  Clock,
  ArrowRight,
  ArrowLeft,
  Settings,
  Copy,
  ExternalLink,
  HelpCircle,
  Send,
  Inbox,
  Calendar,
  Layers,
  Crown,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Tv,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  FileText,
  Terminal,
  Trash2,
  Pencil,
  Unlock,
  TrendingUp,
  DollarSign,
  Share2,
  AlertTriangle,
  PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { validateResellerApiPayload } from "../utils/resellerValidation";

// Componente para manejar visualización y copiado seguro de contraseñas
function PasswordCell({
  value,
  onCopy,
}: {
  value: string;
  onCopy: (text: string, msg: string) => void;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="font-mono font-bold tracking-widest text-slate-700 dark:text-slate-300">
        {show ? value : "••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button
        type="button"
        onClick={() => onCopy(value, "Contraseña copiada al portapapeles")}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="Copiar contraseña"
      >
        <Copy size={13} />
      </button>
    </div>
  );
}

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

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Send,
  RefreshCw,
  Inbox,
  Users,
  TrendingUp,
  HelpCircle,
  Smartphone,
  Settings,
  Tv,
  Crown,
  Lock,
  Zap,
  Clock,
  Layers
};

const DEFAULT_WHATSAPP_TEMPLATES = {
  bienvenida: `🎬 *¡Bienvenido a XTV!* 🎬\n\nHola *{nombre}*, tu cuenta VIP ha sido activada con éxito. Aquí tienes tus credenciales de acceso para disfrutar del mejor entretenimiento:\n\n👤 *Usuario:* {usuario}\n🔑 *Contraseña:* {contrasena}\n🌐 *Servidor:* {servidor}\n🌐 *Playlist M3U8:* {m3u_url}\n\n📥 *Link de descarga de la App:* {link_descarga}\n\n💡 *Instrucciones de ingreso:*\n1. Descarga e instala la aplicación desde el link anterior.\n2. Abre la app e ingresa tu Usuario y Contraseña.\n3. ¡Listo! Ya puedes empezar a disfrutar de todo nuestro contenido.{nota}`,
  
  credenciales_rapidas: `Credenciales de *{nombre}*\n👤 Usuario: {usuario}\n🔑 Contraseña: {contrasena}\n🌐 Servidor: {servidor}\n🌐 Playlist M3U8: {m3u_url}`,
  
  recordatorio: `⚠️ *Aviso de Vencimiento - XTV* ⚠️\n\nHola *{nombre}*, queremos recordarte que tu servicio de IPTV está próximo a vencer:\n\n👤 *Usuario/Línea:* {usuario}\n📅 *Fecha de Vencimiento:* {fecha_vencimiento}\n\nPara renovar tu plan por un nuevo período y continuar disfrutando de la programación sin cortes, puedes ponerte en contacto con nosotros para registrar tu pago y renovar tu vigencia. ¡Muchas gracias por tu preferencia!`,
  
  guia_descarga_general: `📱 *Descarga Oficial XTV* 📱\n\n¡Hola! Aquí tienes el enlace oficial para descargar e instalar nuestra aplicación en tus dispositivos Android, Fire Stick o TV Box:\n\n📥 *Descargar APK:* {link_descarga}\n\n🎬 *¿Qué ofrecemos?*\n✅ Más de 10.000 Canales en Vivo (Deportes, Premium, Nacionales, Internacionales).\n✅ Películas y Series de estreno (Netflix, Prime, Disney, HBO, etc.).\n✅ Calidad HD, FHD y 4K.\n\n_Si necesitas una cuenta de prueba gratuita o activar tu suscripción, avísame y con gusto te la genero en minutos._`,
  
  metodos_pago: `💳 *Métodos de Pago Autorizados* 💳\n\nHola, para renovar o adquirir tu suscripción de *XTV*, puedes realizar tu transferencia o depósito a través de las siguientes opciones:\n\n🔹 *Mercado Pago / Transferencia bancaria:*\n- CVU/Alias: *xtv.oficial.mp*\n- Titular: XTV Suscripciones\n\n👉 *Importante:* Una vez realizado el pago, por favor envía una foto del comprobante/voucher junto con tu nombre de usuario para aplicar la activación o renovación de inmediato.\n\n📞 *Soporte WhatsApp:* {whatsapp}\n🌐 *Tienda Web:* {tienda_url}`,
  
  smart_tv_gen: `📺 *Instrucciones para Smart TV - XTV* 📺\n\nPara disfrutar de nuestro servicio en tu Smart TV (Samsung, LG, Sony, etc.), puedes utilizar aplicaciones populares como:\n\n1️⃣ *IPTV Smarters Pro* o *Smarters Player Lite* (Buscar en la tienda de apps de tu TV).\n2️⃣ *XCIPTV Player*.\n3️⃣ *Ibo Player* / *DuplexPlay*.\n\nCuando abras la aplicación seleccionada, elige la opción de cargar lista mediante *API de Xtream Codes* e ingresa la URL de nuestro servidor:\n👉 *URL del Servidor:* {servidor}\n\n_Avísame una vez instalada la app para proporcionarte tu Usuario y Contraseña de prueba o activación comercial._`,
  
  firestick_gen: `🔥 *Guía de Instalación para Amazon Fire Stick / Android TV* 🔥\n\nPara instalar nuestra aplicación en dispositivos Fire Stick o Android TV, sigue estos sencillos pasos generales:\n\n1️⃣ Descarga la app gratuita *Downloader* desde la tienda de aplicaciones de tu dispositivo.\n2️⃣ Abre Downloader, ve a la sección Home y escribe el siguiente enlace de descarga directa:\n👉 *{link_descarga}*\n3️⃣ Espera que finalice la descarga e instala la aplicación (si te solicita permisos para orígenes desconocidos, acéptalos en la configuración de seguridad).\n4️⃣ Abre la aplicación *XTV* una vez instalada.\n\n_Por favor, solicítame tu Usuario y Contraseña para ingresar y comenzar a ver de inmediato._`
};

export function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, userRole, simulatedRole, setSimulatedRole, hasPermission, userProfile } =
    useAuth();
  const { businessProfile } = useApp();

  // Función de mapeo de plantilla con datos dinámicos
  const formatTemplateText = (text: string, clientData: any) => {
    if (!text) return "";
    const xuiUrl =
      systemConfig?.xc_url_completa ||
      systemConfig?.xui_url ||
      "http://vip-xtv.pro:8080";
    const apkUrl = systemConfig?.apk_url || "https://xtv.app/descargar";
    
    // Extraer datos del cliente adaptados a activaciones de cuenta o clientes regulares
    const clientName = 
      clientData?.nombre_completo || 
      clientData?.detalles?.nombre_completo || 
      "Cliente VIP";
    const username = 
      clientData?.username || 
      clientData?.detalles?.usuario_propuesto || 
      "";
    const password = 
      clientData?.password || 
      clientData?.detalles?.contrasena_propuesta || 
      "";
    const m3uUrl = username ? `${xuiUrl}/get.php?username=${username}&password=${password}&output=ts` : "";
    
    const rawDate = clientData?.fecha_vencimiento || clientData?.detalles?.fecha_vencimiento || "";
    const vDate = rawDate ? new Date(rawDate).toLocaleDateString() : "No definida";
    
    const notesStr = clientData?.detalles?.notas_aprobacion || clientData?.notas_aprobacion || "";
    const noteText = notesStr ? `\n\n*Nota del administrador:* ${notesStr}` : "";
    
    const wpNumber = user?.phone || systemConfig?.whatsapp || "";
    const cleanedWp = wpNumber.replace(/\D/g, "");
    const wpFormatted = wpNumber ? `+${cleanedWp}` : "Soporte oficial";
    const tiendaUrl = systemConfig?.tienda_url || "";

    return text
      .replace(/{nombre}/g, clientName)
      .replace(/{cliente}/g, clientName)
      .replace(/{usuario}/g, username)
      .replace(/{contrasena}/g, password)
      .replace(/{servidor}/g, xuiUrl)
      .replace(/{link_descarga}/g, apkUrl)
      .replace(/{apk_url}/g, apkUrl)
      .replace(/{m3u_url}/g, m3uUrl)
      .replace(/{fecha_vencimiento}/g, vDate)
      .replace(/{nota}/g, noteText)
      .replace(/{whatsapp}/g, wpFormatted)
      .replace(/{tienda_url}/g, tiendaUrl);
  };

  const generateWhatsappMessage = (req: any) => {
    const customTemplates = systemConfig?.whatsapp_templates || {};
    const text = customTemplates.bienvenida || DEFAULT_WHATSAPP_TEMPLATES.bienvenida;
    return formatTemplateText(text, req);
  };

  // Roles normalizados
  const roleLower = (simulatedRole || userRole || "").trim().toLowerCase();
  const isVendedor = roleLower.includes("vendedor");
  const isSocio = roleLower.includes("socio");
  const isSocioOrAdmin =
    roleLower === "admin" || roleLower === "administrador" || isSocio;
  const isAdmin = roleLower === "admin" || roleLower === "administrador";

  // Estados locales de la aplicación Registros XTV
  const [loading, setLoading] = useState(true);
  const [panelUsers, setPanelUsers] = useState<any[]>([]);

  // Separación de Créditos VIP y Demo
  const [currentUserCredits, setCurrentUserCredits] = useState<number>(0); // VIP fallback
  const [currentUserCreditsVIP, setCurrentUserCreditsVIP] = useState<number>(0);
  const [currentUserCreditsDemo, setCurrentUserCreditsDemo] =
    useState<number>(0);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Función para eliminar clientes seleccionados o individuales de Supabase y localmente
  const handleDeleteClients = async (usernamesToDelete: string[]) => {
    if (usernamesToDelete.length === 0) return;
    setDeleteConfirmUsernames(usernamesToDelete);
  };

  const executeDeleteClients = async (usernamesToDelete: string[]) => {
    setDeleteConfirmUsernames(null);
    const toastId = toast.loading(
      usernamesToDelete.length === 1
        ? "Eliminando cliente..."
        : `Eliminando ${usernamesToDelete.length} clientes...`,
    );

    try {
      let successCount = 0;
      let failCount = 0;

      for (const username of usernamesToDelete) {
        try {
          const cl = accounts.find((a: any) => a.username === username);
          if (cl) {
            try {
              await fetch("/api/iptv/xui", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "delete_line",
                  xuiUrl: systemConfig?.xui_url,
                  xuiToken: systemConfig?.xui_token,
                  xuiAccessCode: systemConfig?.xui_access_code,
                  id: cl.xui_id || cl.id_linea,
                }),
              });
            } catch (xuiErr) {
              console.warn("No se pudo eliminar del panel XC real:", xuiErr);
            }
          }

          await apiService.deleteIptvAccount(username);
          successCount++;
        } catch (err) {
          console.error(`Error al eliminar cliente ${username}:`, err);
          failCount++;
        }
      }

      setAccounts((prev) =>
        prev.filter((acc) => !usernamesToDelete.includes(acc.username)),
      );
      setSelectedClients((prev) =>
        prev.filter((u) => !usernamesToDelete.includes(u)),
      );

      toast.dismiss(toastId);
      if (failCount === 0) {
        toast.success(
          usernamesToDelete.length === 1
            ? "Cliente eliminado correctamente."
            : "Todos los clientes seleccionados fueron eliminados.",
        );
      } else {
        toast.success(
          `Se eliminaron ${successCount} clientes. Fallaron ${failCount}.`,
        );
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(
        "Ocurrió un error general al intentar eliminar los clientes: " +
          (error.message || error),
      );
    }
  };
  const [providerPlans, setProviderPlans] = useState<any[]>([]);
  const [salePlans, setSalePlans] = useState<any[]>([]);
  const [availableCredits, setAvailableCredits] = useState<number>(() => {
    const stored = localStorage.getItem('xui_api_credits') || localStorage.getItem('g3d_iptv_active_available_credits');
    return stored ? Number(stored) : 350;
  });
  const [isRefreshingCredits, setIsRefreshingCredits] = useState<boolean>(false);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateText, setEditingTemplateText] = useState<string>("");

  const handleSaveTemplate = async (templateId: string, textToSave: string) => {
    try {
      const sysConf = await apiService.getSystemConfig() || {};
      const existingTemplates = sysConf.whatsapp_templates || {};
      const updatedTemplates = {
        ...existingTemplates,
        [templateId]: textToSave
      };
      const updatedConfig = {
        ...sysConf,
        whatsapp_templates: updatedTemplates
      };
      const res = await apiService.updateSystemConfig(updatedConfig);
      if (res.success) {
        setSystemConfig(updatedConfig);
        setEditingTemplateId(null);
        toast.success("Plantilla guardada y sincronizada en Supabase con éxito.");
      } else {
        throw new Error("No se pudo persistir en la base de datos.");
      }
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    }
  };

  // Alarma auditiva y configuración
  const [selectedTone, setSelectedTone] = useState<
    "bip" | "campana" | "digital" | "alarma"
  >("digital");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [knownRequestIds, setKnownRequestIds] = useState<string[]>([]);
  const knownRequestIdsRef = React.useRef<string[]>([]);

  // Captura de transferencia (Voucher)
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [viewingComprobante, setViewingComprobante] = useState<string | null>(
    null,
  );
  const [zoomActive, setZoomActive] = useState<boolean>(false);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  // Estados de Personalización del Inicio
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editWelcomeModal, setEditWelcomeModal] = useState<boolean>(false);
  const [tempWelcome, setTempWelcome] = useState({
    welcomePrefix: "",
    welcomeSuffix: "",
    creditsLabel: ""
  });

  const handleOpenEditWelcome = () => {
    setTempWelcome({
      welcomePrefix: systemConfig?.dashboard_customizations?.welcomePrefix || "Bienvenido",
      welcomeSuffix: systemConfig?.dashboard_customizations?.welcomeSuffix || ".",
      creditsLabel: systemConfig?.dashboard_customizations?.creditsLabel || "Créditos XC Panel"
    });
    setEditWelcomeModal(true);
  };

  const handleSaveWelcome = async () => {
    try {
      const toastId = toast.loading("Guardando personalización del inicio...");
      const updatedConfig = {
        ...systemConfig,
        dashboard_customizations: {
          welcomePrefix: tempWelcome.welcomePrefix,
          welcomeSuffix: tempWelcome.welcomeSuffix,
          creditsLabel: tempWelcome.creditsLabel
        }
      };
      
      const res = await apiService.updateSystemConfig(updatedConfig);
      toast.dismiss(toastId);
      if (res.success) {
        setSystemConfig(updatedConfig);
        toast.success("¡Inicio de XTV personalizado guardado correctamente!");
        setEditWelcomeModal(false);
      } else {
        toast.error("Error al guardar personalización en la nube.");
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || String(err)));
    }
  };

  // Estados de Edición de Tarjetas del Launchpad
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [tempCard, setTempCard] = useState<{
    id: string;
    title: string;
    badge: string;
    iconName: string;
    color1: string;
    color2: string;
    customIcon: string | null;
  }>({
    id: "",
    title: "",
    badge: "",
    iconName: "Sparkles",
    color1: "#0074cc",
    color2: "#004580",
    customIcon: null
  });

  const handleOpenEditCard = (card: any) => {
    const savedCard = systemConfig?.dashboard_customizations?.cards?.[card.id] || {};
    setTempCard({
      id: card.id,
      title: savedCard.title || card.title,
      badge: savedCard.badge || card.badge,
      iconName: savedCard.iconName || card.iconName,
      color1: savedCard.color1 || card.color1,
      color2: savedCard.color2 || card.color2,
      customIcon: savedCard.customIcon || null
    });
    setEditCardId(card.id);
  };

  const handleSaveCard = async () => {
    if (!editCardId) return;
    try {
      const toastId = toast.loading("Guardando personalización de la tarjeta...");
      const updatedConfig = {
        ...systemConfig,
        dashboard_customizations: {
          ...systemConfig?.dashboard_customizations,
          cards: {
            ...(systemConfig?.dashboard_customizations?.cards || {}),
            [editCardId]: {
              title: tempCard.title,
              badge: tempCard.badge,
              iconName: tempCard.iconName,
              color1: tempCard.color1,
              color2: tempCard.color2,
              customIcon: tempCard.customIcon
            }
          }
        }
      };

      const res = await apiService.updateSystemConfig(updatedConfig);
      toast.dismiss(toastId);
      if (res.success) {
        setSystemConfig(updatedConfig);
        toast.success("¡Tarjeta personalizada guardada correctamente!");
        setEditCardId(null);
      } else {
        toast.error("Error al guardar personalización en la nube.");
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || String(err)));
    }
  };

  // Estados del Menú y de Navegación del Launchpad
  // 'inicio' | 'demo' | 'vip' | 'renovaciones' | 'finanzas' | 'ajustes' | 'mis_clientes' | 'finanzas_vendedores'
  const [currentMenu, setCurrentMenu] = useState<
    | "inicio"
    | "demo"
    | "vip"
    | "renovaciones"
    | "finanzas"
    | "ajustes"
    | "mis_clientes"
    | "crear_directo"
    | "solicitar_activacion"
    | "tutoriales"
    | "finanzas_vendedores"
    | "invitacion"
  >("inicio");

  const menuParam = searchParams.get("menu");

  useEffect(() => {
    if (menuParam) {
      const validMenus = [
        "inicio",
        "demo",
        "vip",
        "renovaciones",
        "finanzas",
        "ajustes",
        "mis_clientes",
        "crear_directo",
        "solicitar_activacion",
        "tutoriales",
        "finanzas_vendedores",
        "invitacion"
      ];
      if (validMenus.includes(menuParam) && currentMenu !== menuParam) {
        setCurrentMenu(menuParam as any);
      }
    } else if (currentMenu !== "inicio") {
      setCurrentMenu("inicio");
    }
  }, [menuParam]);

  const [approvedMessageModal, setApprovedMessageModal] = useState<
    string | null
  >(null);
  const [mcSearch, setMcSearch] = useState("");
  const [mcFilter, setMcFilter] = useState<
    "todos" | "activos" | "expirados" | "demos" | "vips"
  >("todos");
  const [showCommissions, setShowCommissions] = useState(false);
  const [showDirectBlockModal, setShowDirectBlockModal] = useState(false);

  // Buscador de clientes
  const [searchTerm, setSearchTerm] = useState("");

  // Formulario Demo (Legacy fallback)
  const [demoPkg, setDemoPkg] = useState("");
  const [demoName, setDemoName] = useState("");
  const [demoCelular, setDemoCelular] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoNotes, setDemoNotes] = useState("");
  const [demoResult, setDemoResult] = useState<any | null>(null);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  // Formulario VIP (comercial) (Legacy fallback)
  const [vipUser, setVipUser] = useState("");
  const [vipPass, setVipPass] = useState("");
  const [vipName, setVipName] = useState("");
  const [vipCelular, setVipCelular] = useState("");
  const [vipPlanId, setVipPlanId] = useState("");
  const [vipNotes, setVipNotes] = useState("");
  const [vipSubmitting, setVipSubmitting] = useState(false);

  // --- NUEVOS ESTADOS DEL FORMULARIO UNIFICADO Y PERSISTENCIA DE VENTAS ---
  const [directName, setDirectName] = useState("");
  const [directCelular, setDirectCelular] = useState("");
  const [directDireccion, setDirectDireccion] = useState("");
  const [directType, setDirectType] = useState<"VIP" | "DEMO" | null>(null);
  const [directPlanId, setDirectPlanId] = useState("");
  const [directPantallas, setDirectPantallas] = useState<number>(2);
  const [directComprobante, setDirectComprobante] = useState<string | null>(
    null,
  );
  const [directNotes, setDirectNotes] = useState("");
  const [directResellerNotes, setDirectResellerNotes] = useState("");
  const [isResellerNotesEdited, setIsResellerNotesEdited] = useState(false);
  const [directUser, setDirectUser] = useState("");
  const [directPass, setDirectPass] = useState("");
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directResult, setDirectResult] = useState<any | null>(null);

  // --- ESTADOS Y RELACIONES DE FINANZAS Y COMISIONES DE VENDEDORES (XTV) ---
  const [vendedoresRelaciones, setVendedoresRelaciones] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("g3d_vendedores_relacion") || "[]");
    } catch {
      return [];
    }
  });

  const [finanzasComisionesPagos, setFinanzasComisionesPagos] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("g3d_finanzas_comisiones") || "[]");
    } catch {
      return [];
    }
  });

  // Cargar datos de comisiones y redes de vendedores al montar
  useEffect(() => {
    const fetchFinanzasData = async () => {
      try {
        const { data: rels, error: rErr } = await supabase.from("iptv_vendedores_relacion").select("*");
        if (!rErr && rels) {
          setVendedoresRelaciones(rels);
          localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(rels));
        }
      } catch (e) {
        console.warn("Error leyendo iptv_vendedores_relacion de Supabase:", e);
      }

      try {
        const { data: pagos, error: pErr } = await supabase.from("iptv_finanzas_comisiones").select("*");
        if (!pErr && pagos) {
          setFinanzasComisionesPagos(pagos);
          localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(pagos));
        }
      } catch (e) {
        console.warn("Error leyendo iptv_finanzas_comisiones de Supabase:", e);
      }
    };
    fetchFinanzasData();
  }, []);

  // --- ESTADOS NATIVOS DEL MODULO DE FINANZAS Y RED DE RECLUTAMIENTO ---
  const [finanzasTab, setFinanzasTab] = useState<"mis_comisiones" | "liquidaciones" | "red">("mis_comisiones");
  const [commissionSearch, setCommissionSearch] = useState("");
  const [showAddRelModal, setShowAddRelModal] = useState(false);
  const [newInvitedEmail, setNewInvitedEmail] = useState("");
  const [newInvitedName, setNewInvitedName] = useState("");
  const [newInvitedPass, setNewInvitedPass] = useState("");
  const [selectedRelIdForDelete, setSelectedRelIdForDelete] = useState<string | null>(null);
  const [selectedCommissionsForPayout, setSelectedCommissionsForPayout] = useState<string[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutPayVendedor, setPayoutPayVendedor] = useState<boolean>(true);
  const [payoutPayReclutador, setPayoutPayReclutador] = useState<boolean>(true);
  const [payoutOverrideVendedor, setPayoutOverrideVendedor] = useState<string>("");
  const [payoutOverrideReclutador, setPayoutOverrideReclutador] = useState<string>("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutReceiptImage, setPayoutReceiptImage] = useState<string>("");
  const [payoutCustomAmounts, setPayoutCustomAmounts] = useState<Record<string, number>>({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string>("");
  const [viewingReceiptDetails, setViewingReceiptDetails] = useState<any>(null);
  const [selectedCommissionsToRequestPayout, setSelectedCommissionsToRequestPayout] = useState<string[]>([]);
  const [showSelectionCheckboxes, setShowSelectionCheckboxes] = useState(false);

  // Estados para la edición inline de una solicitud de activación pendiente
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [editRequestNombre, setEditRequestNombre] = useState("");
  const [editRequestCelular, setEditRequestCelular] = useState("");
  const [editRequestDireccion, setEditRequestDireccion] = useState("");
  const [editRequestPlanType, setEditRequestPlanType] = useState<"VIP" | "DEMO">("DEMO");
  const [editRequestPlanId, setEditRequestPlanId] = useState("");
  const [editRequestPantallas, setEditRequestPantallas] = useState<number>(2);
  const [editRequestSubmitting, setEditRequestSubmitting] = useState(false);

  const handleSaveEditedRequest = async () => {
    if (!selectedActivationRequest) return;
    
    if (!hasPermission("Admin.IntegracionXC.Acceder")) {
      toast.error("Error de seguridad: No tienes el permiso requerido para editar solicitudes de clientes (Admin.IntegracionXC.Acceder).");
      return;
    }
    
    if (!editRequestNombre.trim()) {
      toast.error("El nombre del cliente es requerido.");
      return;
    }
    if (!editRequestCelular.trim()) {
      toast.error("El celular del cliente es requerido.");
      return;
    }
    if (!editRequestDireccion.trim()) {
      toast.error("La dirección del cliente es requerida.");
      return;
    }
    if (!editRequestPlanId) {
      toast.error("Debes seleccionar un plan.");
      return;
    }

    setEditRequestSubmitting(true);
    try {
      toast.loading("Guardando cambios en la solicitud...");
      
      const selectedPlan = salePlans.find((p) => p.id === editRequestPlanId);
      const creditsCost = editRequestPlanType === "VIP" 
        ? (selectedPlan ? Number(selectedPlan.tokens || 1) : 1)
        : 1;

      const previousDetails = selectedActivationRequest.detalles || {};
      
      const updatedDetails = {
        ...previousDetails,
        nombre_completo: editRequestNombre.trim(),
        celular: editRequestCelular.trim(),
        direccion_actual: editRequestDireccion.trim(),
        tipo_cuenta: editRequestPlanType,
        plan_id: editRequestPlanId,
        plan_nombre: selectedPlan ? selectedPlan.name : (editRequestPlanType === "VIP" ? "VIP Comercial" : "Demo Gratis"),
        pantallas: Number(editRequestPantallas || 1),
        fecha_edicion: new Date().toISOString(),
      };

      const payload = {
        tipo_solicitud: selectedActivationRequest.tipo_solicitud || "crear_cuenta",
        cantidad_creditos: creditsCost,
        comprobante_url: selectedActivationRequest.comprobante_url,
        detalles: updatedDetails,
      };

      const res = await apiService.updateIptvCreditRequest(selectedActivationRequest.id, payload);
      
      toast.dismiss();
      if (res.success) {
        toast.success("Solicitud editada correctamente.");
        setIsEditingRequest(false);
        
        // Refresh local details immediately
        const updatedRequest = {
          ...selectedActivationRequest,
          cantidad_creditos: creditsCost,
          detalles: updatedDetails,
          actualizado_al: new Date().toISOString()
        };
        setSelectedActivationRequest(updatedRequest);
        fetchData();
      } else {
        toast.error("No se pudo actualizar la solicitud.");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error al editar la solicitud: ${err.message || err}`);
    } finally {
      setEditRequestSubmitting(false);
    }
  };

  // --- FUNCIONES NATIVAS DE GESTIÓN DE FINANZAS Y RED DE VENDEDORES (XTV) ---
  const handleSaveVendedorRelacion = async (inviterEmail: string, invitedEmail: string, invitedName: string, invitedPass: string) => {
    try {
      if (!invitedEmail.trim() || !invitedName.trim()) {
        toast.error("El correo y el nombre del vendedor son obligatorios.");
        return false;
      }

      const invEmail = inviterEmail.trim().toLowerCase();
      const invdEmail = invitedEmail.trim().toLowerCase();

      if (invEmail === invdEmail) {
        toast.error("No puedes reclutarte a ti mismo como vendedor hijo.");
        return false;
      }

      // Evitar duplicaciones
      const alreadyExists = vendedoresRelaciones.some(r => r.invited_email === invdEmail);
      if (alreadyExists) {
        toast.error("Este vendedor ya se encuentra reclutado en el sistema.");
        return false;
      }

      // 1. Crear el usuario en perfiles_locales si no existe para que pueda loguearse
      const randomUUID = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

      const profilePayload = {
        id: randomUUID,
        email: invdEmail,
        nombre: invitedName.trim(),
        rol: "IPTV VENDEDORES", // Rol de vendedor por defecto
        password_hash: invitedPass.trim() || "123456",
        avatar_url: "",
        foto_perfil: "",
        creditos: 10,
        creditos_demo: 15,
        iptv_invitado_por: invEmail,
        iptv_ventas_directas_cant: 0,
        iptv_ventas_red_cant: 0,
        iptv_comisiones_cobradas_total: 0
      };

      // Intentamos insertar el perfil local en la BD
      try {
        await supabase.from("perfiles_locales").insert([profilePayload]);
      } catch (e) {
        console.warn("No se pudo crear el perfil local de forma directa, tal vez ya existe:", e);
      }

      // 2. Registrar la relación en la tabla o local
      const newRelation = {
        id: Math.random().toString(36).substring(2, 11),
        inviter_email: invEmail,
        invited_email: invdEmail,
        creado_al: new Date().toISOString()
      };

      try {
        const { error } = await supabase.from("iptv_vendedores_relacion").insert([newRelation]);
        if (error) throw error;
      } catch (e) {
        console.warn("Error insertando relación en Supabase, guardando localmente:", e);
      }

      const updatedRels = [...vendedoresRelaciones, newRelation];
      setVendedoresRelaciones(updatedRels);
      localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(updatedRels));

      // Actualizar el panel de usuarios para reflejar el nuevo perfil en la UI
      setPanelUsers(prev => [...prev.filter(u => u.usuario !== invdEmail), {
        ...profilePayload,
        usuario: invdEmail,
        creditos: 10,
        creditos_demo: 15
      }]);

      toast.success(`Vendedor "${invitedName}" reclutado correctamente bajo tu red.`);
      return true;
    } catch (err: any) {
      toast.error(`Error al registrar relación de vendedor: ${err.message || err}`);
      return false;
    }
  };

  const handleDeleteVendedorRelacion = async (relId: string) => {
    try {
      try {
        await supabase.from("iptv_vendedores_relacion").delete().eq("id", relId);
      } catch (e) {
        console.warn("Error eliminando relación en Supabase:", e);
      }
      const updatedRels = vendedoresRelaciones.filter(r => r.id !== relId);
      setVendedoresRelaciones(updatedRels);
      localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(updatedRels));
      toast.success("Relación eliminada correctamente.");
    } catch (err: any) {
      toast.error(`Error al eliminar relación: ${err.message || err}`);
    }
  };

  const handleSaveCommissionPayout = async (
    clienteId: string,
    clienteNombre: string,
    planNombre: string,
    vendedorEmail: string,
    reclutadorEmail: string,
    comisionTotal: number,
    comisionVendedor: number,
    comisionReclutador: number,
    payVendedor: boolean,
    payReclutador: boolean,
    notes: string = "",
    comprobanteImg: string = "",
    vendedorAbonadoMonto?: number,
    reclutadorAbonadoMonto?: number
  ) => {
    try {
      const existing = finanzasComisionesPagos.find(p => p.cliente_id === clienteId);
      
      let wasVendedorPaidBefore = existing ? (existing.estado_pago === 'vendedor_pagado' || existing.estado_pago === 'completo') : false;
      let wasReclutadorPaidBefore = existing ? (existing.estado_pago === 'reclutador_pagado' || existing.estado_pago === 'completo') : false;

      const prevVAbonado = existing ? Number(existing.vendedor_abonado !== undefined ? existing.vendedor_abonado : (wasVendedorPaidBefore ? comisionVendedor : 0)) : 0;
      const prevRAbonado = existing ? Number(existing.reclutador_abonado !== undefined ? existing.reclutador_abonado : (wasReclutadorPaidBefore ? comisionReclutador : 0)) : 0;

      const newVAbonado = payVendedor 
        ? (vendedorAbonadoMonto !== undefined ? Number(vendedorAbonadoMonto) : Number(comisionVendedor))
        : prevVAbonado;

      const newRAbonado = payReclutador 
        ? (reclutadorAbonadoMonto !== undefined ? Number(reclutadorAbonadoMonto) : Number(comisionReclutador))
        : prevRAbonado;

      let nowVendedorPaid = newVAbonado >= Number(comisionVendedor);
      let nowReclutadorPaid = !reclutadorEmail || newRAbonado >= Number(comisionReclutador);

      let nuevoEstado: 'pendiente' | 'parcial' | 'vendedor_pagado' | 'reclutador_pagado' | 'completo' | 'solicitado' = 'pendiente';

      if (nowVendedorPaid && nowReclutadorPaid) {
        nuevoEstado = 'completo';
      } else if (nowVendedorPaid) {
        nuevoEstado = 'vendedor_pagado';
      } else if (nowReclutadorPaid) {
        nuevoEstado = 'reclutador_pagado';
      } else if (newVAbonado > 0 || newRAbonado > 0) {
        nuevoEstado = 'parcial';
      } else if (existing?.estado_pago === 'solicitado') {
        nuevoEstado = 'solicitado';
      }

      const payoutRecord = {
        id: existing?.id || Math.random().toString(36).substring(2, 11),
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        plan_nombre: planNombre,
        vendedor_email: vendedorEmail,
        reclutador_email: reclutadorEmail || "",
        comision_total: Number(comisionTotal),
        comision_vendedor: Number(comisionVendedor),
        comision_reclutador: Number(comisionReclutador),
        vendedor_abonado: Number(newVAbonado),
        reclutador_abonado: Number(newRAbonado),
        estado_pago: nuevoEstado,
        notes: notes || existing?.notes || "",
        creado_al: existing?.creado_al || new Date().toISOString(),
        pagado_vendedor_al: (payVendedor || newVAbonado > 0) ? new Date().toISOString() : (existing?.pagado_vendedor_al || null),
        pagado_reclutador_al: (payReclutador || newRAbonado > 0) ? new Date().toISOString() : (existing?.pagado_reclutador_al || null),
        comprobante_img: comprobanteImg || existing?.comprobante_img || "",
        solicitado_vendedor_al: existing?.solicitado_vendedor_al || null,
        solicitado_reclutador_al: existing?.solicitado_reclutador_al || null,
        solicitado_vendedor: existing?.solicitado_vendedor || false,
        solicitado_reclutador: existing?.solicitado_reclutador || false
      };

      try {
        const { error } = await supabase.from("iptv_finanzas_comisiones").upsert([payoutRecord]);
        if (error) throw error;
      } catch (e) {
        console.warn("Error guardando liquidación en Supabase, guardando local:", e);
      }

      const updatedPagos = [...finanzasComisionesPagos.filter(p => p.cliente_id !== clienteId), payoutRecord];
      setFinanzasComisionesPagos(updatedPagos);
      localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(updatedPagos));

      return payoutRecord;
    } catch (err: any) {
      toast.error(`Error al registrar liquidación: ${err.message || err}`);
      return null;
    }
  };

  const openReceiptDetails = (row: any, isRecruiterView: boolean = false, allRows: any[] = []) => {
    const targetUser = isRecruiterView ? row.recruiter : row.seller;
    const targetUserName = isRecruiterView ? row.recruiterName : row.sellerName;
    const rowsToUse = allRows.length > 0 ? allRows : [];

    const userRows = rowsToUse.filter((r: any) => 
      isRecruiterView ? (r.recruiter === targetUser) : (r.seller === targetUser)
    );

    const cobradosRows = userRows.filter((r: any) => {
      if (row.cliente_id === r.cliente_id) return true;
      if (row.comprobanteImg && r.comprobanteImg === row.comprobanteImg) return true;
      return false;
    });

    const targetRowsForCobrado = cobradosRows.length > 0 ? cobradosRows : [row];

    const pendientesRows = userRows.filter((r: any) => {
      const abonado = isRecruiterView ? r.rAbonado : r.vAbonado;
      const total = isRecruiterView ? r.rComm : r.vComm;
      const saldo = Math.max(0, total - abonado);
      return saldo > 0 && !targetRowsForCobrado.some((c: any) => c.cliente_id === r.cliente_id);
    });

    const detallesCobrados = targetRowsForCobrado.map((r: any) => {
      const total = isRecruiterView ? r.rComm : r.vComm;
      const abonado = isRecruiterView ? r.rAbonado : r.vAbonado;
      const saldo = Math.max(0, total - abonado);
      return {
        cliente_id: r.cliente_id,
        cliente_nombre: r.cliente_nombre,
        plan_nombre: r.plan_nombre,
        comision_total: total,
        monto_abonado: abonado > 0 ? abonado : total,
        saldo_restante: saldo,
        estado: saldo === 0 ? 'pagado_total' : 'pagado_parcial'
      };
    });

    const detallesPendientes = pendientesRows.map((r: any) => {
      const total = isRecruiterView ? r.rComm : r.vComm;
      const abonado = isRecruiterView ? r.rAbonado : r.vAbonado;
      const saldo = Math.max(0, total - abonado);
      return {
        cliente_id: r.cliente_id,
        cliente_nombre: r.cliente_nombre,
        plan_nombre: r.plan_nombre,
        comision_total: total,
        monto_abonado: abonado,
        saldo_restante: saldo,
        estado: abonado > 0 ? 'pagado_parcial' : 'pendiente'
      };
    });

    const totalCobrado = detallesCobrados.reduce((acc: number, c: any) => acc + c.monto_abonado, 0);
    const totalPendiente = detallesPendientes.reduce((acc: number, c: any) => acc + c.saldo_restante, 0);

    const details = {
      comprobanteId: `CMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      fechaEmision: new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }),
      usuarioNombre: targetUserName,
      usuarioEmail: targetUser,
      usuarioRol: isRecruiterView ? "Reclutador / Revendedor" : "Vendedor Directo",
      detallesCobrados,
      detallesPendientes,
      totalCobrado,
      totalPendiente,
      notes: row.notes || "Liquidación de comisiones registradas en XTV.",
      comprobanteImg: row.comprobanteImg || ""
    };

    setViewingReceiptDetails(details);
    setViewingReceiptUrl(row.comprobanteImg || "");
    setShowReceiptModal(true);
  };

  const handleRequestCommissionPayout = async (clienteIds: string[]) => {
    try {
      const updatedPagos = [...finanzasComisionesPagos];
      const sellerEmailLower = (user?.email || "").toLowerCase().trim();

      // Construir mapa de reclutadores
      const recruiterMap = new Map<string, string>();
      vendedoresRelaciones.forEach(r => {
        if (r.invited_email && r.inviter_email) {
          recruiterMap.set(r.invited_email.toLowerCase().trim(), r.inviter_email.toLowerCase().trim());
        }
      });

      for (const clienteId of clienteIds) {
        const existing = updatedPagos.find(p => p.cliente_id === clienteId);
        
        // Buscar cuenta
        const acc = accounts.find((a: any) => a.username === clienteId);
        if (!acc) continue;

        const seller = (acc.creado_por || "").toLowerCase().trim();
        const recruiter = recruiterMap.get(seller) || "";

        const plan = salePlans.find((p: any) => String(p.id) === String(acc.id_plan_venta));
        const planComm = plan && Number(plan.comision) > 0 ? Number(plan.comision) : 5000;
        const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";
        const totalComm = planComm;
        
        const defaultSellerComm = Math.round(planComm * 0.8);
        const defaultRecruiterComm = Math.round(planComm * 0.2);

        const isSeller = seller === sellerEmailLower;
        const isRecruiter = recruiter === sellerEmailLower;

        let nuevoEstado: 'pendiente' | 'solicitado' | 'vendedor_pagado' | 'reclutador_pagado' | 'completo' = 'solicitado';
        if (existing) {
          if (existing.estado_pago === 'vendedor_pagado' || existing.estado_pago === 'reclutador_pagado' || existing.estado_pago === 'completo') {
            nuevoEstado = existing.estado_pago;
          }
        }

        const payoutRecord = {
          id: existing?.id || Math.random().toString(36).substring(2, 11),
          cliente_id: clienteId,
          cliente_nombre: acc.nombre_completo || acc.username,
          plan_nombre: planNombre,
          vendedor_email: seller,
          reclutador_email: recruiter,
          comision_total: existing?.comision_total || totalComm,
          comision_vendedor: existing?.comision_vendedor || defaultSellerComm,
          comision_reclutador: existing?.comision_reclutador || defaultRecruiterComm,
          estado_pago: nuevoEstado,
          notes: existing?.notes || "Solicitado por el vendedor.",
          creado_al: existing?.creado_al || acc.creado_al || acc.fecha_creacion || new Date().toISOString(),
          pagado_vendedor_al: existing?.pagado_vendedor_al || null,
          pagado_reclutador_al: existing?.pagado_reclutador_al || null,
          comprobante_img: existing?.comprobante_img || "",
          solicitado_vendedor_al: isSeller ? new Date().toISOString() : (existing?.solicitado_vendedor_al || null),
          solicitado_reclutador_al: isRecruiter ? new Date().toISOString() : (existing?.solicitado_reclutador_al || null),
          solicitado_vendedor: isSeller ? true : (existing?.solicitado_vendedor || false),
          solicitado_reclutador: isRecruiter ? true : (existing?.solicitado_reclutador || false)
        };

        const idx = updatedPagos.findIndex(p => p.cliente_id === clienteId);
        if (idx >= 0) {
          updatedPagos[idx] = payoutRecord;
        } else {
          updatedPagos.push(payoutRecord);
        }

        try {
          await supabase.from("iptv_finanzas_comisiones").upsert([payoutRecord]);
        } catch (e) {
          console.warn("Error enviando solicitud de cobro en Supabase, guardando local:", e);
        }
      }

      setFinanzasComisionesPagos(updatedPagos);
      localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(updatedPagos));
      toast.success("Solicitud de cobro registrada correctamente. El administrador liquidará el día de cobro semanal.");
      return true;
    } catch (err: any) {
      toast.error(`Error al solicitar liquidación: ${err.message || err}`);
      return false;
    }
  };

  // Consola de Logs de la API XC de IPTV
  const [apiLogs, setApiLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("g3d_xc_api_logs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [apiInterceptorActive, setApiInterceptorActive] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState<{
    action: string;
    payload: any;
    onConfirm: (finalPayload: any) => Promise<any>;
    onCancel: () => void;
  } | null>(null);
  const [apiEditedJson, setApiEditedJson] = useState("");
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(
    null,
  );

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

  const logApiCall = (
    action: string,
    requestPayload: any,
    responseData: any,
    success: boolean,
    errorMsg?: string,
    warnings?: any[],
  ) => {
    const now = new Date();
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: now.toLocaleDateString(),
      action,
      requestPayload,
      responsePayload: responseData,
      success,
      error: errorMsg,
      warnings: warnings || responseData?.warnings || undefined,
    };
    setApiLogs((prev) => {
      const updated = [newLog, ...prev.filter((l: any) => l.id !== newLog.id)].slice(0, 100);
      try {
        localStorage.setItem("g3d_xc_api_logs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const executeOrInterceptApiCall = async (
    action: string,
    initialPayload: any,
    onConfirm: (finalPayload: any) => Promise<any>,
    onCancel: () => void,
  ): Promise<any> => {
    // Validación previa de revendedor
    const validation = validateResellerApiPayload(action, initialPayload || {});
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Parámetros de API no válidos para revendedor");
      onCancel();
      throw new Error(validation.errorMessage);
    }

    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach((w) => {
        toast.info(w.message, { duration: 5000 });
      });
    }

    const readyPayload = validation.sanitizedPayload;

    const isAllowedToIntercept =
      hasPermission("Admin.*") ||
      hasPermission("Iptv.*") ||
      hasPermission("Admin.ConsolaAPI.Ver");
    if (apiInterceptorActive && isAllowedToIntercept) {
      return new Promise((resolve, reject) => {
        setApiEditedJson(JSON.stringify(readyPayload, null, 2));
        setJsonValidationError(null);
        setPendingApiCall({
          action: readyPayload.action || action,
          payload: readyPayload,
          onConfirm: async (finalPayload) => {
            try {
              const res = await onConfirm(finalPayload);
              resolve(res);
            } catch (err) {
              reject(err);
            }
          },
          onCancel: () => {
            onCancel();
            reject(
              new Error(
                "Petición de API XC cancelada por el usuario en el interceptor",
              ),
            );
          },
        });
      });
    } else {
      return onConfirm(readyPayload);
    }
  };

  // Modal de Zoom de Imagen
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Alias para mantener compatibilidad con referencias en el HTML de la UI
  const finances = { sale_plans: salePlans, provider_plans: providerPlans };

  // Cliente seleccionado para ver detalles en Renovación (Beta)
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<
    any | null
  >(null);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewConfirmData, setRenewConfirmData] = useState<any | null>(null);

  // Nuevos estados para control de la modal de renovación detallada
  const [renewStep, setRenewStep] = useState<"details" | "confirm">("details");
  const [selectedPlanForRenew, setSelectedPlanForRenew] = useState<any | null>(
    null,
  );
  const [renewDropdownOpen, setRenewDropdownOpen] = useState(false);
  const [renewCustomPrice, setRenewCustomPrice] = useState<number>(0);
  const [renewCustomScreens, setRenewCustomScreens] = useState<number>(2);
  const [renewIsSubmitting, setRenewIsSubmitting] = useState(false);

  // Estados para control de rechazos con notas explicativas y reutilización/corrección
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionRequestId, setRejectionRequestId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [correctingRequestId, setCorrectingRequestId] = useState<string | null>(
    null,
  );

  // Nuevos estados para edición de clientes y envío de solicitudes de renovación
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [requestRenewClient, setRequestRenewClient] = useState<any | null>(
    null,
  );
  const [requestRenewPlanId, setRequestRenewPlanId] = useState<string>("");
  const [requestRenewComprobante, setRequestRenewComprobante] = useState<
    string | null
  >(null);
  const [requestRenewComments, setRequestRenewComments] = useState<string>("");
  const [requestRenewSubmitting, setRequestRenewSubmitting] =
    useState<boolean>(false);

  // Estados individuales para el formulario de edición de cliente
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editComments, setEditComments] = useState("");
  const [editScreens, setEditScreens] = useState<number>(2);
  const [editPlanId, setEditPlanId] = useState("");
  const [editExpiration, setEditExpiration] = useState("");
  const [editResellerNotes, setEditResellerNotes] = useState("");
  const [editIsResellerNotesManual, setEditIsResellerNotesManual] =
    useState(false);

  // Estados para la sección de Tutoriales y Respuestas Rápidas
  const [tutorialClient, setTutorialClient] = useState<any | null>(null);
  const [tutorialSearchTerm, setTutorialSearchTerm] = useState("");

  // Estados para el módulo de Invitaciones (Vendedor y Cliente XTV)
  const [invMenuMode, setInvMenuMode] = useState<'vendedor' | 'cliente' | null>(null);
  
  // Formulario Invitar Vendedor
  const [invVendNombre, setInvVendNombre] = useState("");
  const [invVendTelefono, setInvVendTelefono] = useState("");
  const [invVendDireccion, setInvVendDireccion] = useState("");
  const [invVendUserId, setInvVendUserId] = useState("");
  
  // Estado de validación de ID de usuario invitado
  const [invVendUserIdChecking, setInvVendUserIdChecking] = useState(false);
  const [invVendUserIdStatus, setInvVendUserIdStatus] = useState<'available' | 'taken' | 'empty'>('empty');
  const [invVendUserIdSuggestions, setInvVendUserIdSuggestions] = useState<string[]>([]);
  const [invVendSubmitting, setInvVendSubmitting] = useState(false);
  const [invVendCreated, setInvVendCreated] = useState<any | null>(null);

  // Formulario Invitar Cliente XTV
  const [invCliNombre, setInvCliNombre] = useState("");
  const [invCliTelefono, setInvCliTelefono] = useState("");
  const [invCliPlan, setInvCliPlan] = useState("demo_2h"); // 'demo_2h', 'mensual_vip'
  const [invCliLoading, setInvCliLoading] = useState(false);
  const [invCliCreated, setInvCliCreated] = useState<any | null>(null);

  // Helper para formatear fechas ISO a datetime-local
  const formatToDatetimeLocal = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - offset * 60 * 1000);
      return adjusted.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  // Validar disponibilidad del ID del vendedor invitado en tiempo real
  useEffect(() => {
    const checkUserIdAvailability = async () => {
      const cleanId = invVendUserId.trim().toLowerCase();
      if (!cleanId) {
        setInvVendUserIdStatus('empty');
        setInvVendUserIdSuggestions([]);
        return;
      }

      setInvVendUserIdChecking(true);
      try {
        const possibleEmail = cleanId.includes('@') ? cleanId : `${cleanId}@xtv.com`;
        const { data, error } = await supabase
          .from('perfiles_locales')
          .select('id, email')
          .eq('email', possibleEmail)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setInvVendUserIdStatus('taken');
          // Recomendar 3 opciones distintas con terminaciones numéricas
          const suggestions: string[] = [];
          for (let i = 0; i < 3; i++) {
            const randomNum = Math.floor(Math.random() * 90) + 10;
            suggestions.push(`${cleanId}${randomNum}`);
          }
          setInvVendUserIdSuggestions(suggestions);
        } else {
          setInvVendUserIdStatus('available');
          setInvVendUserIdSuggestions([]);
        }
      } catch (err) {
        console.error("Error al validar disponibilidad del ID:", err);
      } finally {
        setInvVendUserIdChecking(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkUserIdAvailability();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [invVendUserId]);

  const startEditingClient = (client: any) => {
    setEditingClient(client);
    setEditName(client.nombre_completo || "");
    setEditPhone(client.celular || "");
    setEditPassword(client.password || "");
    setEditAddress(client.direccion_actual || "");
    setEditComments(client.comentarios || "");
    setEditScreens(
      client.limite_pantallas !== undefined
        ? Number(client.limite_pantallas)
        : 2,
    );
    setEditPlanId(client.id_plan_venta || "");
    setEditExpiration(formatToDatetimeLocal(client.fecha_vencimiento));
    setEditResellerNotes(client.reseller_notes || "");
    setEditIsResellerNotesManual(false);
  };

  useEffect(() => {
    if (editingClient && !editIsResellerNotesManual) {
      const selectedPlan = salePlans.find((p) => p.id === editPlanId);
      const planName = selectedPlan ? selectedPlan.name : "Plan Estándar VIP";
      const clientName = editName.trim();
      const resellerUser = editingClient.creado_por || user?.email || "admin";
      const generated = `[XTV]${clientName || "(Nombre)"} - ${planName} - ${resellerUser}`;
      setEditResellerNotes(generated);
    }
  }, [
    editName,
    editPlanId,
    editIsResellerNotesManual,
    editingClient,
    salePlans,
    user?.email,
  ]);

  // Función para cambiar menú con transición de deslizamiento
  const selectMenuWithScroll = (menu: string) => {
    setCurrentMenu(menu as any);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("menu", menu);
      return newParams;
    });
    if (menu === "crear_directo" || menu === "solicitar_activacion") {
      setDirectType(null);
      setDirectPlanId("");
      setDirectName("");
      setDirectCelular("");
      setDirectDireccion("");
      setDirectNotes("");
      setDirectResellerNotes("");
      setIsResellerNotesEdited(false);
      setDirectUser("");
      setDirectPass("");
      setDirectComprobante(null);
    }
    setTimeout(() => {
      const container = document.getElementById("active-widget-container");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  };

  const defaultLaunchpadCards = useMemo(() => [
    {
      id: "crear_directo",
      title: "Crear Cuenta Directa",
      badge: "⚡ Carga Inmediata",
      iconName: "Sparkles",
      color1: "#10b981",
      color2: "#059669",
      action: () => {
        if (hasPermission("Iptv.CrearDirecto.Acceder")) {
          selectMenuWithScroll("crear_directo");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.CrearDirecto.Acceder' para abrir esta sección.");
        }
      },
      showCondition: hasPermission("Iptv.CrearDirecto.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "solicitar_activacion",
      title: "Solicitar Activación",
      badge: "📥 Ticket de Soporte",
      iconName: "Send",
      color1: "#f59e0b",
      color2: "#d97706",
      action: () => {
        if (hasPermission("Iptv.SolicitarActivacion.Acceder")) {
          selectMenuWithScroll("solicitar_activacion");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.SolicitarActivacion.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.SolicitarActivacion.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "renovaciones",
      title: "Renovación (Beta)",
      badge: "🔄 Extender Vigencia",
      iconName: "RefreshCw",
      color1: "#3b82f6",
      color2: "#2563eb",
      action: () => {
        if (hasPermission("Iptv.Renovaciones.Acceder")) {
          selectMenuWithScroll("renovaciones");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Renovaciones.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Renovaciones.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "finanzas",
      title: "Solicitudes",
      badge: "🪙 Créditos y Soporte",
      iconName: "Inbox",
      color1: "#8b5cf6",
      color2: "#7c3aed",
      action: () => {
        if (hasPermission("Iptv.Solicitudes.Acceder")) {
          selectMenuWithScroll("finanzas");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Solicitudes.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Solicitudes.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "mis_clientes",
      title: "Mis Clientes",
      badge: "👥 Activos y Demos",
      iconName: "Users",
      color1: "#06b6d4",
      color2: "#0891b2",
      action: () => {
        if (hasPermission("Iptv.Clientes.Acceder")) {
          selectMenuWithScroll("mis_clientes");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Clientes.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Clientes.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "finanzas_vendedores",
      title: "Finanzas",
      badge: "💵 Red y Comisiones",
      iconName: "TrendingUp",
      color1: "#ec4899",
      color2: "#db2777",
      action: () => {
        if (hasPermission("Iptv.Finanzas.Acceder") || hasPermission("Iptv.FinanzasRevendedores.Acceder")) {
          selectMenuWithScroll("finanzas_vendedores");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Finanzas.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Finanzas.Ver") || hasPermission("Iptv.FinanzasRevendedores.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "tutoriales",
      title: "Respuesta Rápida WSP",
      badge: "💬 Respuestas Rápidas",
      iconName: "MessageSquare",
      color1: "#14b8a6",
      color2: "#0d9488",
      action: () => {
        if (hasPermission("Iptv.Tutoriales.Acceder")) {
          selectMenuWithScroll("tutoriales");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Tutoriales.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Tutoriales.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "invitacion",
      title: "Invitación",
      badge: "📩 Sumar Socios",
      iconName: "UserCheck",
      color1: "#6366f1",
      color2: "#4f46e5",
      action: () => {
        selectMenuWithScroll("invitacion");
      },
      showCondition: true,
    },
    {
      id: "ajustes_configuracion",
      title: "Ajustes XTV",
      badge: "⚙️ Gestión Central",
      iconName: "Settings",
      color1: "#64748b",
      color2: "#475569",
      action: () => {
        if (hasPermission("Iptv.Ajustes.Acceder")) {
          navigate("/xtv?tab=central");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.Ajustes.Acceder' asignado.");
        }
      },
      showCondition: hasPermission("Iptv.Ajustes.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    }
  ], [hasPermission, selectMenuWithScroll, navigate, userRole]);

  const menuItems = useMemo(() => {
    return defaultLaunchpadCards.map((item) => {
      const saved = systemConfig?.dashboard_customizations?.cards?.[item.id] || {};
      return {
        ...item,
        title: saved.title || item.title,
        badge: saved.badge || item.badge,
        iconName: saved.iconName || item.iconName,
        color1: saved.color1 || item.color1,
        color2: saved.color2 || item.color2,
        customIcon: saved.customIcon || null,
      };
    });
  }, [defaultLaunchpadCards, systemConfig?.dashboard_customizations?.cards]);

  const isCardLocked = (cardId: string) => {
    if (cardId === "crear_directo") return !hasPermission("Iptv.CrearDirecto.Acceder");
    if (cardId === "solicitar_activacion") return !hasPermission("Iptv.SolicitarActivacion.Acceder");
    if (cardId === "renovaciones") return !hasPermission("Iptv.Renovaciones.Acceder");
    if (cardId === "ajustes_configuracion") {
      const hasConf =
        hasPermission("Admin.*") ||
        hasPermission("Iptv.*") ||
        hasPermission("Iptv.Ajustes.Ver") ||
        hasPermission("Iptv.Clientes.Ver") ||
        hasPermission("Iptv.Finanzas.Ver") ||
        hasPermission("Iptv.Branding.Ver") ||
        userRole === "Administrador" ||
        userRole === "IPTV SOCIOS" ||
        userRole === "G3D SOCIO";
      return !hasConf;
    }
    return false;
  };

  // Formulario Solicitud de Crédito / Ayuda
  const [reqAmount, setReqAmount] = useState(10);
  const [reqType, setReqType] = useState<
    | "asignar_credito"
    | "crear_cuenta"
    | "comprar_creditos_vip"
    | "comprar_creditos_demo"
  >("asignar_credito");
  const [reqDetailsText, setReqDetailsText] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);

  // Estado para la solicitud de activación seleccionada en la pantalla de Solicitudes
  const [selectedActivationRequest, setSelectedActivationRequest] = useState<
    any | null
  >(null);
  const [adminApprovalNotes, setAdminApprovalNotes] = useState<string>("");
  const [approvalUser, setApprovalUser] = useState<string>("");
  const [approvalPass, setApprovalPass] = useState<string>("");
  const [approvalOperation, setApprovalOperation] = useState<
    "create_line" | "extend_line"
  >("create_line");
  const [approvalLineId, setApprovalLineId] = useState<string>("");
  const [deleteConfirmUsernames, setDeleteConfirmUsernames] = useState<
    string[] | null
  >(null);

  // Estado para la confirmación interactiva de borrado de solicitud sin usar window.confirm
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [solicitudTab, setSolicitudTab] = useState<"pendientes" | "aprobadas" | "historial">("pendientes");

  // Estados para etiquetas personalizables de la bandeja de solicitudes (Guardados de forma local en localStorage)
  const [lblBandejaTitle, setLblBandejaTitle] = useState(() => localStorage.getItem("lblBandejaTitle") || "🗂️ Bandeja de Solicitudes XTV");
  const [lblBandejaSubtitle, setLblBandejaSubtitle] = useState(() => localStorage.getItem("lblBandejaSubtitle") || "Monitorea, audita y aprueba las líneas solicitadas por los vendedores.");
  const [lblTabPendientes, setLblTabPendientes] = useState(() => localStorage.getItem("lblTabPendientes") || "⏳ Pendientes");
  const [lblTabAprobadas, setLblTabAprobadas] = useState(() => localStorage.getItem("lblTabAprobadas") || "✅ Aprobadas");
  const [lblTabHistorial, setLblTabHistorial] = useState(() => localStorage.getItem("lblTabHistorial") || "📜 Historial");
  const [lblPendientesLeyenda, setLblPendientesLeyenda] = useState(() => localStorage.getItem("lblPendientesLeyenda") || "🚨 Solicitudes pendientes que deben ser activadas urgentemente:");
  const [lblHistorialLeyenda, setLblHistorialLeyenda] = useState(() => localStorage.getItem("lblHistorialLeyenda") || "📜 Archivo histórico de solicitudes procesadas (aprobadas y rechazadas):");

  // Estado para controlar qué etiqueta se está editando mediante un pequeño formulario/input inline
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>("");

  // Estados para la duplicación de vista: Activar Línea vs Pago de Comisiones
  const [solicitudSection, setSolicitudSection] = useState<"activar_linea" | "pago_comisiones">("activar_linea");
  const [selectedCommissionPayout, setSelectedCommissionPayout] = useState<any | null>(null);
  const [commissionPayoutTab, setCommissionPayoutTab] = useState<"pendientes" | "en_proceso" | "historial">("pendientes");
  const [selectedPaidCommissionItem, setSelectedPaidCommissionItem] = useState<any | null>(null);
  const [payoutProofImage, setPayoutProofImage] = useState<string>("");
  const [payoutRefNotes, setPayoutRefNotes] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState<boolean>(false);
  const [showPayoutConfirmModal, setShowPayoutConfirmModal] = useState<boolean>(false);

  // Etiquetas para la bandeja de pago de comisiones
  const [lblComisionesTitle, setLblComisionesTitle] = useState(() => localStorage.getItem("lblComisionesTitle") || "💵 Bandeja de Solicitudes de Pago de Comisiones");
  const [lblComisionesSubtitle, setLblComisionesSubtitle] = useState(() => localStorage.getItem("lblComisionesSubtitle") || "Monitorea, audita y aprueba las solicitudes de comisiones de los vendedores.");

  const handleSaveCustomLabel = (key: string, val: string) => {
    localStorage.setItem(key, val);
    if (key === "lblBandejaTitle") setLblBandejaTitle(val);
    if (key === "lblBandejaSubtitle") setLblBandejaSubtitle(val);
    if (key === "lblTabPendientes") setLblTabPendientes(val);
    if (key === "lblTabAprobadas") setLblTabAprobadas(val);
    if (key === "lblTabHistorial") setLblTabHistorial(val);
    if (key === "lblPendientesLeyenda") setLblPendientesLeyenda(val);
    if (key === "lblHistorialLeyenda") setLblHistorialLeyenda(val);
    if (key === "lblComisionesTitle") setLblComisionesTitle(val);
    if (key === "lblComisionesSubtitle") setLblComisionesSubtitle(val);
    setEditingLabelKey(null);
    toast.success("🏷️ Etiqueta personalizada guardada de forma local.");
  };

  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const prevPendingIdsRef = React.useRef<string[]>([]);

  const [activeApprovalNotification, setActiveApprovalNotification] = useState<any | null>(null);
  const prevApprovedIdsRef = React.useRef<string[]>([]);

  useEffect(() => {
    if (!hasPermission("Iptv.Solicitudes.Notificar")) return;

    const currentPendings = creditRequests.filter(
      (r) => r.tipo_solicitud === "crear_cuenta" && r.estado === "pendiente"
    );
    const currentPendingIds = currentPendings.map((r) => r.id);

    // Si es la primera carga, solo guardamos los IDs existentes para no spammear al iniciar
    if (prevPendingIdsRef.current.length === 0) {
      if (currentPendingIds.length > 0) {
        prevPendingIdsRef.current = currentPendingIds;
      }
      return;
    }

    // Buscamos si hay alguna solicitud nueva pendiente
    const newPending = currentPendings.find((r) => !prevPendingIdsRef.current.includes(r.id));
    if (newPending) {
      setActiveNotification(newPending);
      playNotificationSound("campana");
      
      // Intentar vibración nativa del celular si está disponible
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    // Actualizamos el registro de IDs conocidos
    prevPendingIdsRef.current = currentPendingIds;
  }, [creditRequests, hasPermission]);

  useEffect(() => {
    if (!hasPermission("Iptv.Solicitudes.NotificarActivacionExitosa")) return;

    const currentApproved = creditRequests.filter(
      (r) => r.tipo_solicitud === "crear_cuenta" && r.estado === "aprobado"
    );
    const currentApprovedIds = currentApproved.map((r) => r.id);

    // Si es la primera carga, guardamos los IDs existentes para no spammear al iniciar
    if (prevApprovedIdsRef.current.length === 0) {
      if (currentApprovedIds.length > 0) {
        prevApprovedIdsRef.current = currentApprovedIds;
      }
      return;
    }

    // Buscamos si hay alguna solicitud nueva aprobada
    const newApproved = currentApproved.find((r) => !prevApprovedIdsRef.current.includes(r.id));
    if (newApproved) {
      setActiveApprovalNotification(newApproved);
      playNotificationSound("campana");
    }

    // Actualizamos el registro de IDs conocidos
    prevApprovedIdsRef.current = currentApprovedIds;
  }, [creditRequests, hasPermission]);

  useEffect(() => {
    setDeletingRequestId(null);
  }, [selectedActivationRequest?.id]);

  // Función de síntesis de audio para notificaciones
  const playNotificationSound = (
    type: "bip" | "campana" | "digital" | "alarma",
  ) => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === "bip") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "campana") {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.8 + idx * 0.1,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.0);
        });
      } else if (type === "digital") {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.03, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + i * 0.1 + 0.15,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.2);
        });
      } else {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(500, ctx.currentTime);
        osc2.frequency.setValueAtTime(505, ctx.currentTime);
        osc1.type = "sawtooth";
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("No se pudo reproducir el sintetizador web audio: ", e);
    }
  };

  // Filtrar planes de prueba reales
  const demoPackagesFiltered = useMemo(() => {
    const list = providerPlans.filter(
      (p) =>
        !p.archived &&
        (p.tokens === 0 ||
          p.name.toLowerCase().includes("demo") ||
          p.name.toLowerCase().includes("trial") ||
          p.name.toLowerCase().includes("prueba") ||
          p.name.toLowerCase().includes("test")),
    );

    // Función auxiliar para deducir o parsear horas de duración a partir del objeto o del nombre del plan
    const getHours = (p: any) => {
      if (p.hours !== undefined) return Number(p.hours);
      const nameLower = p.name.toLowerCase();
      if (
        nameLower.includes("1h") ||
        nameLower.includes("1 hora") ||
        nameLower.includes("1 hours")
      )
        return 1;
      if (
        nameLower.includes("2h") ||
        nameLower.includes("2 hora") ||
        nameLower.includes("2 hours")
      )
        return 2;
      if (
        nameLower.includes("3h") ||
        nameLower.includes("3 hora") ||
        nameLower.includes("3 hours")
      )
        return 3;
      if (
        nameLower.includes("4h") ||
        nameLower.includes("4 hora") ||
        nameLower.includes("4 hours")
      )
        return 4;
      if (
        nameLower.includes("6h") ||
        nameLower.includes("6 hora") ||
        nameLower.includes("6 hours")
      )
        return 6;
      if (
        nameLower.includes("12h") ||
        nameLower.includes("12 hora") ||
        nameLower.includes("12 hours")
      )
        return 12;
      if (
        nameLower.includes("24h") ||
        nameLower.includes("24 hora") ||
        nameLower.includes("24 hours")
      )
        return 24;
      return 24; // fallback para demos genéricas de 1 día
    };

    const finalDemoList =
      list.length === 0
        ? [
            {
              id: "custom-1h",
              name: "Demo 1 Hora (Sin límites)",
              hours: 1,
              tokens: 0,
            },
            {
              id: "custom-3h",
              name: "Demo 3 Horas (Dispositivos ilimitados)",
              hours: 3,
              tokens: 0,
            },
            {
              id: "custom-6h",
              name: "Demo 6 Horas comercial",
              hours: 6,
              tokens: 0,
            },
          ]
        : list.map((p) => ({
            ...p,
            hours: getHours(p),
          }));

    // Ordenar de menor a mayor denominación/duración (horas)
    return [...finalDemoList].sort((a, b) => {
      const hA = a.hours || 1;
      const hB = b.hours || 1;
      return hA - hB;
    });
  }, [providerPlans]);

  // Carga inicial unificada de datos
  const fetchData = async () => {
    try {
      const usersData = await apiService.getIptvPanelUsers();
      setPanelUsers(usersData);

      // Calcular o cargar créditos del usuario logueado (Vendedor o Admin)
      if (user?.email) {
        const found = usersData.find(
          (u: any) =>
            u.usuario.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        const raw_vip = found ? found.creditos || 0 : isAdmin ? 99999 : 0;
        const raw_demo = found ? found.creditos_demo || 0 : isAdmin ? 99999 : 0;

        setCurrentUserCredits(raw_vip);
        setCurrentUserCreditsVIP(raw_vip);
        setCurrentUserCreditsDemo(raw_demo);
      }

      const accs = await apiService.getIptvAccounts();
      setAccounts(accs);

      const finances = await apiService.getIptvFinances();
      if (finances) {
        setProviderPlans(finances.provider_plans || []);
        setSalePlans(finances.sale_plans || []);
      }

      const requests = await apiService.getIptvCreditRequests();
      setCreditRequests(requests);

      // Guardar todos los IDs para la evaluación de notificaciones audible reactiva
      const ids = requests.map((r: any) => r.id);
      setKnownRequestIds(ids);
      knownRequestIdsRef.current = ids;

      const sysConf = await apiService.getSystemConfig();
      if (sysConf) {
        // Normalizar de forma proactiva las claves priorizando 'xc_' que son las credenciales reales cargadas en Ajustes XTV
        sysConf.xui_url = sysConf.xc_url_completa || sysConf.xui_url;
        sysConf.xui_token = sysConf.xc_token || sysConf.xui_token;
        sysConf.xui_access_code =
          sysConf.xc_access_code || sysConf.xui_access_code;
      }
      setSystemConfig(sysConf);

      // Sincronizar créditos reales del panel XC en vivo
      let liveCredits = null;
      if (sysConf && sysConf.xui_url) {
        try {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "test",
              xuiUrl: sysConf.xui_url,
              xuiToken: sysConf.xui_token,
              xuiAccessCode: sysConf.xui_access_code,
            }),
          });
          const xuiData = await resXui.json();
          if (xuiData.success) {
            const rawResp = xuiData.data || xuiData.raw_response || {};
            const rawData = rawResp.data || rawResp || {};
            
            if (rawData.credits !== undefined) liveCredits = Number(rawData.credits);
            else if (rawData.credit !== undefined) liveCredits = Number(rawData.credit);
            else if (rawData.balance !== undefined) liveCredits = Number(rawData.balance);
            else if (rawResp.credits !== undefined) liveCredits = Number(rawResp.credits);
            else if (xuiData.credits !== undefined) liveCredits = Number(xuiData.credits);
            else if (xuiData.data?.credits !== undefined) liveCredits = Number(xuiData.data.credits);
          }
        } catch (err) {
          console.warn("Error fetching live credits on dashboard load:", err);
        }
      }

      if (liveCredits !== null) {
        setAvailableCredits(liveCredits);
        localStorage.setItem('xui_api_credits', String(liveCredits));
      } else {
        const stored = localStorage.getItem('xui_api_credits');
        setAvailableCredits(
          stored ? Number(stored) : (finances?.available_credits != null ? Number(finances.available_credits) : 350)
        );
      }

      // Asignar primer plan de demo por defecto si existe
      const demoPls = (finances?.provider_plans || []).filter(
        (p: any) =>
          !p.archived &&
          (p.tokens === 0 ||
            p.name.toLowerCase().includes("demo") ||
            p.name.toLowerCase().includes("trial") ||
            p.name.toLowerCase().includes("prueba")),
      );
      if (demoPls.length > 0) {
        setDemoPkg(demoPls[0].id);
      } else {
        setDemoPkg("custom-1h");
      }

      // Primer plan de venta por defecto para VIP
      const slPls = (finances?.sale_plans || []).filter(
        (p: any) => !p.archived,
      );
      if (slPls.length > 0) {
        setVipPlanId(slPls[0].id);
      }
    } catch (err) {
      console.error("Error al cargar datos de Registros XTV:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDashboardCredits = async () => {
    if (isRefreshingCredits) return;
    setIsRefreshingCredits(true);
    const toastId = toast.loading("Actualizando créditos en vivo...");
    try {
      let url = systemConfig?.xui_url;
      let token = systemConfig?.xui_token;
      let accessCode = systemConfig?.xui_access_code;

      if (!url) {
        const sysConf = await apiService.getSystemConfig();
        if (sysConf) {
          sysConf.xui_url = sysConf.xc_url_completa || sysConf.xui_url;
          sysConf.xui_token = sysConf.xc_token || sysConf.xui_token;
          sysConf.xui_access_code = sysConf.xc_access_code || sysConf.xui_access_code;
          setSystemConfig(sysConf);
          url = sysConf.xui_url;
          token = sysConf.xui_token;
          accessCode = sysConf.xui_access_code;
        }
      }

      if (!url) {
        toast.dismiss(toastId);
        toast.error("La URL de tu panel no está configurada.");
        setIsRefreshingCredits(false);
        return;
      }

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
      toast.dismiss(toastId);
      if (xuiData.success) {
        const rawResp = xuiData.data || xuiData.raw_response || {};
        const rawData = rawResp.data || rawResp || {};
        
        let creditsVal = null;
        if (rawData.credits !== undefined) creditsVal = Number(rawData.credits);
        else if (rawData.credit !== undefined) creditsVal = Number(rawData.credit);
        else if (rawData.balance !== undefined) creditsVal = Number(rawData.balance);
        else if (rawResp.credits !== undefined) creditsVal = Number(rawResp.credits);
        else if (xuiData.credits !== undefined) creditsVal = Number(xuiData.credits);
        else if (xuiData.data?.credits !== undefined) creditsVal = Number(xuiData.data.credits);

        if (creditsVal !== null) {
          setAvailableCredits(creditsVal);
          localStorage.setItem('xui_api_credits', String(creditsVal));
          toast.success(`Créditos actualizados: ${creditsVal}`);
        } else {
          toast.error("No se encontró el campo de créditos en la respuesta del panel.");
        }
      } else {
        toast.error(`Error: ${xuiData.error || "No se pudo recuperar información."}`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Error de red: ${err.message || String(err)}`);
    } finally {
      setIsRefreshingCredits(false);
    }
  };

  // Efecto para auto-seleccionar el plan unificado cuando cambia el tipo de cuenta
  useEffect(() => {
    if (!directType) {
      setDirectPlanId("");
      return;
    }
    if (directType === "VIP") {
      const activeVip = salePlans.filter(
        (p) => !p.archived && !p.name.toLowerCase().includes("demo"),
      );
      if (activeVip.length > 0) {
        setDirectPlanId(activeVip[0].id);
        setDirectPantallas(Number(activeVip[0].screens || 2));
      }
    } else if (directType === "DEMO") {
      const activeDemo = salePlans.filter(
        (p) => !p.archived && p.name.toLowerCase().includes("demo"),
      );
      if (activeDemo.length > 0) {
        setDirectPlanId(activeDemo[0].id);
        setDirectPantallas(Number(activeDemo[0].screens || 1));
      }
    }
  }, [directType, salePlans]);

  // Auto-calcular reseller_notes dinámicamente si no ha sido editado manualmente
  useEffect(() => {
    if (!directType) {
      setDirectResellerNotes("");
      return;
    }
    if (!isResellerNotesEdited) {
      const selectedPlan = salePlans.find((p) => p.id === directPlanId);
      const planName = selectedPlan
        ? selectedPlan.name
        : directType === "VIP"
          ? "Plan VIP"
          : "Demo Gratis";
      const clientName = directName.trim();
      const resellerUser = user?.email || "admin";
      const generatedNotes = `[XTV]${clientName || "(Nombre)"} - ${planName} - ${resellerUser}`;
      setDirectResellerNotes(generatedNotes);
    }
  }, [
    directName,
    directPlanId,
    directType,
    user?.email,
    salePlans,
    isResellerNotesEdited,
  ]);

  // Efecto para inicializar selectedPlanForRenew al abrir la modal de detalles de un cliente
  useEffect(() => {
    if (selectedClientForDetails) {
      const selectablePlans = salePlans.filter(
        (p: any) => !p.name.toLowerCase().includes("demo") && !p.archived,
      );
      
      const existingPlan = salePlans.find(
        (p: any) => p.id === selectedClientForDetails.id_plan_venta
      );
      const isDemo = existingPlan?.name?.toLowerCase().includes("demo");
      
      // Si el cliente ya tiene un plan minorista real no-demo, lo usamos; si no, el primero minorista
      const initialPlan = (existingPlan && !isDemo) ? existingPlan : selectablePlans[0];
      setSelectedPlanForRenew(initialPlan || null);
    } else {
      setSelectedPlanForRenew(null);
    }
  }, [selectedClientForDetails, salePlans]);

  // Sincronizar precio y pantallas informativos basándose estrictamente en selectedPlanForRenew
  useEffect(() => {
    if (selectedPlanForRenew) {
      setRenewCustomPrice(selectedPlanForRenew.price || selectedPlanForRenew.price_public || 0);
      setRenewCustomScreens(selectedPlanForRenew.screens || 2);
    }
  }, [selectedPlanForRenew]);

  // Carga inicial estable
  useEffect(() => {
    fetchData();
  }, [user?.email]);

  // Auto-seleccionar solicitud si viene de un link de WhatsApp (req_id)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reqId = urlParams.get('req_id');
    if (reqId && creditRequests.length > 0) {
      const found = creditRequests.find((r: any) => String(r.id) === reqId);
      if (found) {
        setSelectedActivationRequest(found);
      }
    }
  }, [creditRequests]);

  // Polling sin bucle infinito usando Refs para IDs conocidos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const requests = await apiService.getIptvCreditRequests();
        const currentPendingIds = requests
          .filter((r: any) => r.estado === "pendiente")
          .map((r: any) => r.id);

        // Comparar con IDs previamente conocidos (vía ref para no disparar dependencias)
        const newPendings = currentPendingIds.filter(
          (id) => !knownRequestIdsRef.current.includes(id),
        );
        if (newPendings.length > 0) {
          // ¡Hay tickets nuevos!
          if (soundEnabled && isSocioOrAdmin) {
            playNotificationSound(selectedTone);
            toast.info(
              `🔔 ¡Nueva solicitud de crédito o activación recibida! (${newPendings.length})`,
              {
                duration: 5000,
                style: { background: "#0F172A", color: "#F8FAFC" },
              },
            );
          }
        }

        // Actualizar estados y la referencia
        setCreditRequests(requests);
        setKnownRequestIds(requests.map((r: any) => r.id));
        knownRequestIdsRef.current = requests.map((r: any) => r.id);
      } catch (e) {
        console.warn("Error en polling continuo de tickets de IPTV:", e);
      }
    }, 8500);

    return () => clearInterval(interval);
  }, [soundEnabled, selectedTone, isSocioOrAdmin]);

  // Filtrar cuentas pertenecientes (los revendedores solo ven las suyas, admin ve todas)
  const filteredAccounts = useMemo(() => {
    let list = accounts;
    if (!isAdmin && user?.email) {
      const savedInheritance = localStorage.getItem('g3d_roles_inheritance');
      const roleInheritance = savedInheritance ? JSON.parse(savedInheritance) : {};

      const isDescendantRole = (child: string, parent: string): boolean => {
        if (!child || !parent) return false;
        let current = child.trim().toLowerCase();
        const p = parent.trim().toLowerCase();
        if (current === p) return false;
        let visited = new Set<string>();
        while (current && !visited.has(current)) {
          visited.add(current);
          const matchedKey = Object.keys(roleInheritance).find(k => k.trim().toLowerCase() === current);
          if (!matchedKey) break;
          const parentRole = roleInheritance[matchedKey];
          if (!parentRole) break;
          const parentLower = parentRole.trim().toLowerCase();
          if (parentLower === p) return true;
          current = parentLower;
        }
        return false;
      };

      const currentUserRole = simulatedRole || userRole || "";

      list = accounts.filter((a) => {
        const creadoPorLower = (a.creado_por || "").trim().toLowerCase();
        const userEmailLower = user.email.trim().toLowerCase();

        // Caso 1: Es dueño
        if (creadoPorLower === userEmailLower) return true;

        // Caso 2: Permiso para ver clientes de roles hijo
        if (hasPermission("Iptv.Clientes.VerHijos")) {
          const creatorUser = panelUsers.find(
            (u: any) => u.usuario.trim().toLowerCase() === creadoPorLower
          );
          const creatorRole = creatorUser ? creatorUser.rol || "" : "";
          if (isDescendantRole(creatorRole, currentUserRole)) {
            return true;
          }
        }

        // Caso 3: Permiso para ver solo propios (si no se cumple lo anterior)
        if (hasPermission("Iptv.Clientes.VerPropios")) {
          return creadoPorLower === userEmailLower;
        }

        // Por defecto, si tiene acceso general de Ver pero no restricciones, puede ver todo
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          (a.nombre_completo &&
            a.nombre_completo.toLowerCase().includes(term)) ||
          (a.celular && a.celular.includes(term)) ||
          (a.comentarios && a.comentarios.toLowerCase().includes(term)),
      );
    }
    return list;
  }, [accounts, isAdmin, user, searchTerm, panelUsers, simulatedRole, userRole, hasPermission]);

  // Copiar credenciales genérico con botón
  const copyToClipboard = (
    text: string,
    message: string = "Copiado al portapapeles",
  ) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Función para confirmar la renovación del plan seleccionado
  const handleConfirmRenewal = async () => {
    const selectablePlans = salePlans.filter(
      (p: any) => !p.name.toLowerCase().includes("demo"),
    );
    const planToUse =
      selectedPlanForRenew ||
      (selectedClientForDetails
        ? salePlans.find(
            (p: any) => p.id === selectedClientForDetails.id_plan_venta,
          )
        : null) ||
      selectablePlans[0];
    if (!selectedClientForDetails || !planToUse) return;

    // Validación estricta: Las cuentas Demo no se pueden extender ni renovar
    const isClientDemo = selectedClientForDetails.tipo_cuenta === "DEMO" ||
      selectedClientForDetails.is_demo ||
      (selectedClientForDetails.username && selectedClientForDetails.username.toLowerCase().startsWith("demo"));
    if (isClientDemo) {
      toast.error("⚠️ Los planes DEMO (Demostración) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva línea VIP.");
      return;
    }

    if (planToUse.hours > 0 || planToUse.trial === 1 || planToUse.name?.toLowerCase().includes("demo")) {
      toast.error("⚠️ No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
      return;
    }

    const isOwnClient = (selectedClientForDetails.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
    const canRenewThisClient = isAdmin || 
      hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
      (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);

    if (!canRenewThisClient) {
      toast.error("No tienes permisos suficientes para renovar este cliente.");
      return;
    }

    if (!requestRenewComprobante) {
      toast.error(
        "⚠️ Debes adjuntar la captura del comprobante de pago para concretar la renovación.",
      );
      return;
    }

    setRenewIsSubmitting(true);

    const creditsCost = planToUse.tokens || 1;
    if (!isAdmin && currentUserCreditsVIP < creditsCost) {
      toast.error(
        `No tienes créditos VIP suficientes para realizar renovaciones VIP (Costo: ${creditsCost} crédito). Tienes: ${currentUserCreditsVIP}`,
      );
      setRenewIsSubmitting(false);
      return;
    }

    try {
      // Calcular nueva fecha de vencimiento
      const currentVenc = selectedClientForDetails.fecha_vencimiento
        ? new Date(selectedClientForDetails.fecha_vencimiento)
        : new Date();
      const baseDate =
        currentVenc.getTime() > Date.now() ? currentVenc : new Date();

      const durationDays = planToUse.duration || 30; // duración en días o default 30
      const nextVenc = new Date(baseDate.getTime());
      nextVenc.setDate(nextVenc.getDate() + durationDays);

      // --- ENVIAR COMANDO DE RENOVACIÓN AL PANEL FISICO XC ---
      let xuiData: any = null;
      if (systemConfig?.xui_url && systemConfig?.xui_token) {
        toast.loading("Enviando comando de renovación al panel XC...");
        const screensCount = Number(planToUse.screens_api || planToUse.screens || renewCustomScreens || 1);
        const updatedNotes = `[XTV] ${selectedClientForDetails.nombre_completo || selectedClientForDetails.username} - ${planToUse.name || "VIP"} - ${user?.usuario_nombre || user?.email || "Admin"}`;

        const payloadToSend: any = {
          action: "extend_line",
          xuiUrl: systemConfig.xui_url,
          xuiToken: systemConfig.xui_token,
          xuiAccessCode: systemConfig.xui_access_code,
          id: selectedClientForDetails.panel_client_id ? Number(selectedClientForDetails.panel_client_id) : (selectedClientForDetails.xui_id ? Number(selectedClientForDetails.xui_id) : undefined),
          username: selectedClientForDetails.username,
          package: Number(planToUse.provider_plan_id || "12"),
          reseller_notes: updatedNotes,
        };

        if (screensCount > 1) {
          payloadToSend.max_connections = screensCount;
        }

        const executeCall = async (finalPayload: any) => {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });
          const parsed = await resXui.json();
          return { ...parsed, _payloadSent: finalPayload };
        };

        xuiData = await executeOrInterceptApiCall(
          "extend_line",
          payloadToSend,
          executeCall,
          () => {},
        );

        toast.dismiss();

        if (xuiData && xuiData.success) {
          toast.success("¡Línea IPTV extendida físicamente en el panel XC!");
          logApiCall(
            "extend_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo de créditos reseller insuficiente en el panel XC.";
          toast.error(`❌ El panel XC rechazó la renovación: ${errorMsg}`);
          logApiCall(
            "extend_line",
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            false,
            errorMsg,
          );
          setRenewIsSubmitting(false);
          return; // ABORTAR RENOVACION LOCAL
        }
      } else {
        toast.error("❌ No hay ningún panel XC configurado en Ajustes. Configura el panel antes de renovar.");
        setRenewIsSubmitting(false);
        return; // ABORTAR RENOVACION LOCAL
      }

      const saleRecord = {
        fecha: new Date().toISOString(),
        autor: user?.email || "admin",
        comentario: `Comando de Reactivación enviado: Renovado con ${planToUse.name} por $${renewCustomPrice !== undefined ? renewCustomPrice : (planToUse.price || planToUse.price_public || 0)}. Pantallas: ${renewCustomScreens}`,
        tipo: "venta",
        plan_name: planToUse.name,
        monto: Number(renewCustomPrice !== undefined ? renewCustomPrice : (planToUse.price || planToUse.price_public || 0)),
        vendedor: user?.email || "admin",
        pantallas: Number(renewCustomScreens),
      };

      const renewedId = String(xuiData?.raw_response?.data?.id || xuiData?.data?.id || xuiData?.id || selectedClientForDetails.panel_client_id || selectedClientForDetails.xui_id || "");
      const renewedPackageId = String(xuiData?.raw_response?.data?.package_id || xuiData?.data?.package_id || planToUse.provider_plan_id || selectedClientForDetails.package_id || "");
      const renewedMemberId = String(xuiData?.raw_response?.data?.member_id || xuiData?.data?.member_id || selectedClientForDetails.member_id || "");
      const renewedAccessToken = String(xuiData?.raw_response?.data?.access_token || xuiData?.data?.access_token || selectedClientForDetails.access_token || "");
      const renewedPlaylistUrl = String(xuiData?.playlist_url || xuiData?.raw_response?.data?.playlist_url || selectedClientForDetails.playlist_url || "");
      const renewedBouquet = String(xuiData?.raw_response?.data?.bouquet || xuiData?.data?.bouquet || selectedClientForDetails.bouquet || "");
      const renewedRawResponse = xuiData?.raw_response || xuiData || selectedClientForDetails.raw_response_json || null;

      const updatedAcc = {
        ...selectedClientForDetails,
        fecha_vencimiento: nextVenc.toISOString(),
        limite_pantallas: Number(renewCustomScreens),
        id_plan_venta: planToUse.id,
        panel_client_id: renewedId || null,
        package_id: renewedPackageId || null,
        member_id: renewedMemberId || null,
        access_token: renewedAccessToken || null,
        playlist_url: renewedPlaylistUrl || null,
        bouquet: renewedBouquet || null,
        raw_response_json: renewedRawResponse || null,
        bitacora_comentarios: [
          ...(selectedClientForDetails.bitacora_comentarios || []),
          saleRecord,
        ],
      };

      const res = await apiService.saveIptvAccount(updatedAcc);
      if (res.success) {
        if (!isAdmin) {
          const remaining = currentUserCreditsVIP - creditsCost;
          await apiService.updateIptvPanelUserCredits(
            user.email,
            remaining,
            currentUserCreditsDemo,
          );
        }
        playNotificationSound("campana");
        toast.success(
          `¡Cuenta ${selectedClientForDetails.username} reactivada exitosamente! Membresía extendida hasta ${nextVenc.toLocaleDateString()}`,
        );

        // Resetear estados
        setSelectedClientForDetails(null);
        setSelectedPlanForRenew(null);
        setRenewStep("details");

        fetchData();
      } else {
        toast.error("Error al reactivar en base de datos: " + res.error);
      }
    } catch (err: any) {
      toast.error("Error al procesar renovación: " + err.message);
    } finally {
      setRenewIsSubmitting(false);
    }
  };

  // --- NUEVA LÓGICA: GUARDAR EDICIÓN Y ENVIAR SOLICITUD DE RENOVACIÓN DESDE TABLA ---
  const handleSaveEditedClient = async (updatedClient: any) => {
    try {
      toast.loading("Guardando cambios del cliente...");
      const res = await apiService.saveIptvAccount(updatedClient);
      if (res.success) {
        toast.dismiss();
        toast.success("¡Cliente actualizado con éxito!");
        setEditingClient(null);
        fetchData();
      } else {
        toast.dismiss();
        toast.error(
          "Error al actualizar cliente: " + (res.error || "Error desconocido"),
        );
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Error inesperado: " + err.message);
    }
  };

  const handleSendRenewalRequest = async (
    client: any,
    planId: string,
    comments: string,
    comprobante: string | null,
  ) => {
    if (!client) return;

    // Validación estricta: Las cuentas Demo no se pueden extender ni renovar
    const isClientDemo = client.tipo_cuenta === "DEMO" ||
      client.is_demo ||
      (client.username && client.username.toLowerCase().startsWith("demo"));
    if (isClientDemo) {
      toast.error("⚠️ Los planes DEMO (Demostración) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva línea VIP.");
      return;
    }

    const isOwnClient = (client.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
    const canRenewThisClient = isAdmin || 
      hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
      (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);

    if (!canRenewThisClient) {
      toast.error("No tienes permisos suficientes para solicitar la renovación de este cliente.");
      return;
    }

    if (!planId) {
      toast.error("Por favor selecciona un plan minorista para renovar.");
      return;
    }

    const selectedPlan = salePlans.find((p) => p.id === planId);
    if (!selectedPlan) {
      toast.error("El plan seleccionado no es válido.");
      return;
    }

    if (selectedPlan.hours > 0 || selectedPlan.trial === 1 || selectedPlan.name?.toLowerCase().includes("demo")) {
      toast.error("⚠️ No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
      return;
    }

    if (!comprobante) {
      toast.error(
        "⚠️ Debes adjuntar la captura del comprobante de pago para realizar la solicitud.",
      );
      return;
    }

    setRequestRenewSubmitting(true);
    const toastId = toast.loading("Enviando solicitud de renovación...");
    try {
      const creditsCost = Number(selectedPlan.tokens || 1);
      const payload = {
        reseller_usuario: user?.email || "vendedor",
        tipo_solicitud: "crear_cuenta",
        shadow_type: "renovacion",
        cantidad_creditos: creditsCost,
        comprobante_url: comprobante, // Base64
        detalles: {
          nombre_completo: client.nombre_completo,
          celular: client.celular,
          direccion_actual: client.direccion_actual || "",
          tipo_cuenta: "VIP",
          plan_id: planId,
          plan_nombre: selectedPlan.name,
          pantallas: Number(selectedPlan.screens_api || selectedPlan.screens || client.limite_pantallas || 1),
          screens_api: Number(selectedPlan.screens_api || selectedPlan.screens || client.limite_pantallas || 1),
          screens: Number(selectedPlan.screens || selectedPlan.screens_api || client.limite_pantallas || 1),
          comentarios:
            comments ||
            `Solicitud de renovación para la cuenta ${client.username}`,
          reseller_notes: `[XTV] ${client.nombre_completo || client.username} - ${selectedPlan.name} - ${user?.usuario_nombre || user?.email || "Vendedor"}`,
          usuario_propuesto: client.username,
          contrasena_propuesta: client.password,
          fecha_peticion: new Date().toISOString(),
        },
      };

      const res = await apiService.createIptvCreditRequest(payload);
      if (res.success) {
        toast.dismiss(toastId);
        toast.success(
          "🚀 ¡Tu solicitud de renovación y comprobante fueron enviados al Admin!",
        );
        setRequestRenewComprobante(null);
        setRequestRenewComments("");
        fetchData();
      } else {
        toast.dismiss(toastId);
        toast.error("Error al enviar la solicitud.");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error("Error al enviar solicitud de renovación:", err);
      toast.error(`❌ Error: ${err.message}`);
    } finally {
      setRequestRenewSubmitting(false);
    }
  };

  // --- NUEVA LÓGICA: CREAR CUENTA DIRECTA (VIP O DEMO) UNIFICADO ---
  const handleCreateDirectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSubmitting(true);

    if (!directType) {
      toast.error("Por favor, selecciona el Tipo de Cuenta (Demo o VIP).");
      setDirectSubmitting(false);
      return;
    }

    const clName = directName.trim();
    const phone = directCelular.trim();
    const address = directDireccion.trim();
    const notes = directNotes.trim();

    if (!clName) {
      toast.error("El nombre completo del cliente es requerido.");
      setDirectSubmitting(false);
      return;
    }
    if (!phone) {
      toast.error("El número de celular del cliente es requerido.");
      setDirectSubmitting(false);
      return;
    }
    if (!address) {
      toast.error("La dirección de entrega/cliente es requerida.");
      setDirectSubmitting(false);
      return;
    }

    // --- GENERACIÓN PREVIA DE CREDENCIALES PROVISIONALES ---
    // Esto es crítico porque el API del Panel XC exige la presencia de 'username' y 'password' obligatoriamente en el payload POST,
    // aun cuando luego el panel configure de forma nativa unas credenciales aleatorias.
    const randNum = Math.floor(100000 + Math.random() * 900000);
    let u = directType === "DEMO" ? `demo${randNum}` : `vip${randNum}`;

    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 6; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    p = `pass_${p}`;

    // --- PRIMERO VALIDAR CONDICIONES DE CRÉDITO Y REQUISITOS ---
    const selectedPlan = salePlans.find((plan) => plan.id === directPlanId);
    const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

    if (directType === "VIP") {
      const planPrice = selectedPlan ? Number(selectedPlan.price || 0) : 0;
      if (planPrice > 1 && !directComprobante) {
        toast.error(
          "⚠️ Para activar una cuenta VIP con costo mayor a $1, debes adjuntar la captura del comprobante de pago.",
        );
        setDirectSubmitting(false);
        return;
      }
      if (!isAdmin && currentUserCreditsVIP < creditsCost) {
        toast.error(
          `Créditos VIP insuficientes (Requeridos: ${creditsCost}, Tienes: ${currentUserCreditsVIP}). Solicita activación por soporte en su lugar.`,
        );
        setDirectSubmitting(false);
        return;
      }
    } else {
      if (!isAdmin && currentUserCreditsDemo < creditsCost) {
        toast.error(
          `Saldo de pruebas insuficiente. Requeridos: ${creditsCost}, Tienes: ${currentUserCreditsDemo} Demo disponibles.`,
        );
        setDirectSubmitting(false);
        return;
      }
    }

    let apiId = "";
    let apiMemberId = "";
    let apiAccessToken = "";
    let apiPlaylistUrl = "";
    let apiBouquet = "";
    let apiPackageId = "";
    let apiRawResponse: any = null;

    // --- PASO 1: VERIFICAR CREDENCIALES Y CRÉDITOS (CONEXIÓN TÉCNICA) ---
    if (!systemConfig?.xui_url || !systemConfig?.xui_token) {
      toast.error("❌ No hay ningún panel XC configurado en Ajustes. Configura el panel antes de crear cuentas directas.");
      setDirectSubmitting(false);
      return;
    }

    toast.loading("Paso 1: Verificando conexión técnica y créditos con el servidor XC...");
    try {
      const resTest = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: systemConfig.xui_url,
          xuiToken: systemConfig.xui_token,
          xuiAccessCode: systemConfig.xui_access_code,
        }),
      });
      const testData = await resTest.json();
      toast.dismiss();

      if (!testData || !testData.success) {
        const errDetail = testData?.error || "El panel XC no responde.";
        toast.error(`❌ Paso 1 Falló (Conexión técnica): El servidor XC no responde o las credenciales son inválidas. Detalle: ${errDetail}`);
        setDirectSubmitting(false);
        return;
      }

      // Validar créditos devueltos por el panel
      const xcCredits = Number(testData.credits ?? testData.profile?.credits ?? testData.data?.credits ?? 999);
      if (xcCredits < 1) {
        toast.error(`❌ Paso 1 Falló: Créditos insuficientes en tu panel físico XC (Disponibles: ${xcCredits}). Se requiere al menos 1 crédito reseller.`);
        setDirectSubmitting(false);
        return;
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`❌ Paso 1 Falló (Error de conexión): No se pudo conectar con el servidor XC. ${err.message || String(err)}`);
      setDirectSubmitting(false);
      return;
    }

    // --- CÁLCULO DE DURACIÓN Y EXPIRACIÓN ---
    let expirationDate = new Date();
    let durationLabel = "";
    let pkgLabel = "Cuenta VIP";

    if (directType === "VIP") {
      const months = selectedPlan ? Number(selectedPlan.months || 1) : 1;
      expirationDate.setMonth(expirationDate.getMonth() + months);
      durationLabel = `${months} Meses`;
      pkgLabel = selectedPlan ? selectedPlan.name : "VIP Comercial";
    } else {
      let durationHours = 2;
      let durationMonths = 0;
      if (selectedPlan) {
        pkgLabel = selectedPlan.name;
        if (selectedPlan.hours && selectedPlan.hours > 0) {
          durationHours = selectedPlan.hours;
        } else if (selectedPlan.months && selectedPlan.months > 0) {
          durationMonths = selectedPlan.months;
        }
      }

      if (durationMonths > 0) {
        expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
        durationLabel = `${durationMonths} Meses`;
      } else {
        expirationDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        durationLabel = `${durationHours} Horas`;
      }
    }

    let xuiUrl =
      systemConfig?.xc_url_completa ||
      systemConfig?.xui_url ||
      "http://vip-xtv.pro:8080";

    const newAccount = {
      username: u,
      password: p,
      url_panel_asignada: xuiUrl,
      estado: "Pendiente_Activacion",
      limite_pantallas: Number(
        directPantallas ||
          (selectedPlan ? Number(selectedPlan.screens || 2) : 2),
      ),
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: expirationDate.toISOString(),
      comentarios: directType === "VIP" 
        ? `Membresía VIP Premium directa. Dirección: ${address}. Notas: ${notes}`
        : `Línea de prueba directa. Dirección: ${address}. Notas: ${notes}`,
      nombre_completo: clName,
      celular: phone,
      direccion_actual: address,
      id_plan_proveedor: selectedPlan ? selectedPlan.provider_plan_id : "",
      id_plan_venta: directPlanId,
      bitacora_comentarios: [
        {
          fecha: new Date().toISOString(),
          autor: user?.email || "admin",
          comentario: directType === "VIP"
            ? `Venta de membresía VIP Premium (${durationLabel}) directa iniciada. Creación local previa.`
            : `Creación de línea Demo (${durationLabel}) directa iniciada. Creación local previa.`,
          es_venta: true,
          plan_nombre: pkgLabel,
          precio_minorista: selectedPlan ? selectedPlan.price || 0 : 0,
          vendedor: user?.email || "admin",
          pantallas: Number(directPantallas),
        },
      ],
      creado_por: user?.email || "admin",
      panel_client_id: null,
      api_sincronizado: false,
      api_error_registro: "Pendiente de alta física en panel"
    };

    // --- PASO 2: GUARDAR LOS DATOS EN LA BASE DE DATOS LOCAL (SUPABASE) ---
    toast.loading("Paso 2: Guardando información del cliente en la Base de Datos local...");
    const resDb = await apiService.saveIptvAccount(newAccount);
    toast.dismiss();

    if (!resDb.success) {
      toast.error(`❌ Paso 2 Falló (Error Base de Datos): No se pudieron guardar los datos en Supabase (${resDb.error || "Error desconocido"}). Se detiene la operación para evitar inconsistencias.`);
      setDirectSubmitting(false);
      return;
    }

    // --- PASO 3: REGISTRAR CUENTA EN EL PANEL FISICO XC DEL PROVEEDOR ---
    toast.loading("Paso 3: Creando y activando la línea física en el panel XC...");
    const planProvId = selectedPlan ? selectedPlan.provider_plan_id : "";

    let finalPkgIdNum = 1;
    const parsedNum = Number(planProvId);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      finalPkgIdNum = parsedNum;
    } else if (directType === "VIP") {
      const commercialPkg = providerPlans.find(
        (p) =>
          !p.archived &&
          p.tokens > 0 &&
          !p.name.toLowerCase().includes("demo") &&
          !p.name.toLowerCase().includes("trial"),
      );
      if (commercialPkg) {
        finalPkgIdNum = Number(commercialPkg.id);
      } else if (providerPlans.length > 0) {
        finalPkgIdNum = Number(providerPlans[0].id);
      }
    } else {
      const trialPkg = providerPlans.find(
        (p) =>
          !p.archived &&
          (p.tokens === 0 ||
            p.name.toLowerCase().includes("demo") ||
            p.name.toLowerCase().includes("trial")),
      );
      if (trialPkg) {
        finalPkgIdNum = Number(trialPkg.id);
      } else if (providerPlans.length > 0) {
        finalPkgIdNum = Number(providerPlans[0].id);
      }
    }

    const currentAction = "create_line";

    const payloadToSend: any = {
      action: currentAction,
      xuiUrl: systemConfig.xui_url,
      xuiToken: systemConfig.xui_token,
      xuiAccessCode: systemConfig.xui_access_code,
      package: finalPkgIdNum,
      trial: directType === "VIP" ? 0 : 1,
    };

    const screensCount = Number(selectedPlan?.screens_api || selectedPlan?.screens || directPantallas || 1);
    if (screensCount > 1) {
      payloadToSend.max_connections = screensCount;
    }

    if (directResellerNotes && directResellerNotes.trim()) {
      payloadToSend.reseller_notes = directResellerNotes.trim();
    }

    try {
      const executeCall = async (finalPayload: any) => {
        const resXui = await fetch("/api/iptv/xui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload),
        });
        const parsed = await resXui.json();
        return { ...parsed, _payloadSent: finalPayload };
      };

      const xuiData = await executeOrInterceptApiCall(
        currentAction,
        payloadToSend,
        executeCall,
        () => {
          setDirectSubmitting(false);
        },
      );

      toast.dismiss();

      if (xuiData && xuiData.success) {
        const realUsername = xuiData.username || xuiData.data?.username || u;
        const realPassword = xuiData.password || xuiData.data?.password || p;

        apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || "");
        apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
        apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
        apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || xuiData.data?.playlist_url || "");
        apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
        apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
        apiRawResponse = xuiData.raw_response || xuiData;

        // Si el panel de control XC le asignó un nombre de usuario diferente, eliminamos el provisorio anterior
        // en Supabase y creamos la versión definitiva para evitar registros duplicados o inconsistencias
        if (realUsername !== u) {
          await apiService.deleteIptvAccount(u);
        }

        const updatedAccount = {
          ...newAccount,
          username: realUsername,
          password: realPassword,
          estado: "Activo",
          api_sincronizado: true,
          api_error_registro: "",
          panel_client_id: apiId || null,
          member_id: apiMemberId || null,
          access_token: apiAccessToken || null,
          playlist_url: apiPlaylistUrl || null,
          bouquet: apiBouquet || null,
          package_id: apiPackageId || null,
          raw_response_json: apiRawResponse || null,
        };

        const resUpdate = await apiService.saveIptvAccount(updatedAccount);
        if (resUpdate.success) {
          // Descontar créditos al revendedor localmente si no es admin
          if (!isAdmin) {
            const isVip = directType === "VIP";
            const remainingVIP = isVip ? currentUserCreditsVIP - creditsCost : currentUserCreditsVIP;
            const remainingDemo = !isVip ? currentUserCreditsDemo - creditsCost : currentUserCreditsDemo;
            await apiService.updateIptvPanelUserCredits(user.email, remainingVIP, remainingDemo);

            try {
              await apiService.registrarMovimiento({
                usuario_nombre: user.email,
                accion: isVip ? "CLIENTE_VIP_CREADO_CREDITO" : "CLIENTE_DEMO_CREADO_CREDITO",
                entidad: "IPTV_CLIENTES",
                entidad_id: realUsername,
                detalle: isVip
                  ? `Creada VIP ${realUsername} directa consumiendo ${creditsCost} créditos. Saldo actual: ${remainingVIP}`
                  : `Creada Demo ${realUsername} directa consumiendo ${creditsCost} créditos. Saldo actual: ${remainingDemo}`,
              });
            } catch (e) {}
          }

          toast.success("¡Línea IPTV registrada, persistida en Base de Datos y activada físicamente en el panel XC!");
          logApiCall(
            currentAction,
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            true,
          );

          setDirectResult({
            username: realUsername,
            password: realPassword,
            url_panel_asignada: xuiUrl,
            m3u: `${xuiUrl}/get.php?username=${realUsername}&password=${realPassword}&output=ts`,
            tipo: directType,
            tipo_cuenta: directType,
            nombre_completo: clName,
            celular: phone,
            fecha_vencimiento: expirationDate.toISOString(),
            vencimiento: expirationDate.toLocaleDateString(),
            panel_client_id: apiId || null,
          });

          // Limpiar inputs del formulario
          setDirectType(null);
          setDirectName("");
          setDirectCelular("");
          setDirectDireccion("");
          setDirectNotes("");
          setDirectResellerNotes("");
          setIsResellerNotesEdited(false);
          setDirectUser("");
          setDirectPass("");
          setDirectComprobante(null);
          fetchData();
        } else {
          toast.error("⚠️ Advertencia: La línea física fue creada pero falló la actualización del registro local en Supabase.");
        }
      } else {
        const errorMsg = xuiData?.error || "Error de respuesta o saldo de créditos reseller insuficiente en el panel XC.";
        // Si el alta física falló, marcamos la cuenta local como "Fallo de Activación" para que puedan reintentar la sincronización
        const failedAccount = {
          ...newAccount,
          estado: "Fallo_Activacion",
          api_sincronizado: false,
          api_error_registro: errorMsg
        };
        await apiService.saveIptvAccount(failedAccount);

        toast.error(`❌ El panel XC rechazó el alta física de la línea: ${errorMsg}. El registro se guardó localmente y podrá sincronizarse nuevamente.`);
        logApiCall(
          currentAction,
          xuiData?._payloadSent || payloadToSend,
          xuiData,
          false,
          errorMsg,
        );
      }
    } catch (err: any) {
      toast.dismiss();
      const errorMsg = err.message || String(err);
      const failedAccount = {
        ...newAccount,
        estado: "Fallo_Activacion",
        api_sincronizado: false,
        api_error_registro: errorMsg
      };
      await apiService.saveIptvAccount(failedAccount);

      toast.error(`❌ Error al conectar con el panel XC para la creación: ${errorMsg}. El registro de base de datos se conservará localmente para sincronización.`);
      logApiCall(
        currentAction,
        payloadToSend,
        null,
        false,
        errorMsg,
      );
    } finally {
      setDirectSubmitting(false);
    }
  };

  // --- FUNCIÓN PARA AUTOCOMPLETAR DATOS DE PRUEBA (SOLO ADMINS) ---
  const handleAutocompleteTestData = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const firstNames = [
      "Carlos",
      "Ana",
      "Luis",
      "Marta",
      "Roberto",
      "Sofía",
      "Esteban",
      "Lucía",
      "Pedro",
      "Giselle",
    ];
    const lastNames = [
      "Gómez",
      "Rodríguez",
      "Fernández",
      "López",
      "Martínez",
      "Díaz",
      "Pérez",
      "Sánchez",
      "Romero",
      "Álvarez",
    ];
    const randomFirstName =
      firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName =
      lastNames[Math.floor(Math.random() * lastNames.length)];

    setDirectName(
      `[TEST-ADMIN] ${randomFirstName} ${randomLastName} ${randomSuffix}`,
    );
    setDirectCelular(
      `+54911${Math.floor(50000000 + Math.random() * 49999999)}`,
    );
    setDirectDireccion(`Calle Falsa ${randomSuffix}, CABA (Test)`);
    setDirectNotes("Testeo automático de administración de XTV.");
    setDirectUser(`testadmin${randomSuffix}`);
    setDirectPass(`pass${randomSuffix}`);
    toast.success("⚡ ¡Datos de prueba autocompletados exitosamente!");
  };

  // --- NUEVA LÓGICA: SOLICITAR ACTIVACIÓN (TICKET DE ASISTENCIA A SOCIOS) ---
  const handleRequestActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSubmitting(true);

    if (!directType) {
      toast.error("Por favor, selecciona el Tipo de Cuenta (Demo o VIP).");
      setDirectSubmitting(false);
      return;
    }

    try {
      const clName = directName.trim();
      const phone = directCelular.trim();
      const address = directDireccion.trim();
      const notes = directNotes.trim();
      const customUser = directUser
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const customPass = directPass.trim();

      if (!clName) {
        toast.error("El nombre completo del cliente es requerido.");
        setDirectSubmitting(false);
        return;
      }
      if (!phone) {
        toast.error("El número de celular del cliente es requerido.");
        setDirectSubmitting(false);
        return;
      }
      if (!address) {
        toast.error("La dirección de entrega/cliente es requerida.");
        setDirectSubmitting(false);
        return;
      }

      const selectedPlan = salePlans.find((p) => p.id === directPlanId);

      if (directType === "VIP") {
        const planPrice = selectedPlan ? Number(selectedPlan.price || 0) : 0;
        if (planPrice > 1 && !directComprobante) {
          toast.error(
            "⚠️ Para solicitar una cuenta VIP con costo mayor a $1, debes adjuntar la captura del comprobante de pago.",
          );
          setDirectSubmitting(false);
          return;
        }
      }

      const creditsCost =
        directType === "VIP"
          ? selectedPlan
            ? Number(selectedPlan.tokens || 1)
            : 1
          : 1;

      const payload = {
        reseller_usuario: user?.email || "vendedor",
        tipo_solicitud: "crear_cuenta", // Se identifica para creacion automatica
        cantidad_creditos: creditsCost,
        comprobante_url: directComprobante, // Base64
        detalles: {
          nombre_completo: clName,
          celular: phone,
          direccion_actual: address,
          tipo_cuenta: directType,
          plan_id: directPlanId,
          plan_nombre: selectedPlan
            ? selectedPlan.name
            : directType === "VIP"
              ? "VIP Comercial"
              : "Demo Gratis",
          pantallas: Number(selectedPlan?.screens_api || selectedPlan?.screens || directPantallas || 1),
          screens_api: Number(selectedPlan?.screens_api || selectedPlan?.screens || directPantallas || 1),
          screens: Number(selectedPlan?.screens || selectedPlan?.screens_api || directPantallas || 1),
          comentarios: notes || "Solicitud de activación del cliente",
          reseller_notes: directResellerNotes,
          usuario_propuesto: customUser,
          contrasena_propuesta: customPass,
          fecha_peticion: new Date().toISOString(),
        },
      };

      let res;
      if (correctingRequestId) {
        res = await apiService.updateIptvCreditRequest(
          correctingRequestId,
          payload,
        );
      } else {
        res = await apiService.createIptvCreditRequest(payload);
      }

      if (res.success) {
        if (correctingRequestId) {
          toast.success(
            "🚀 ¡Tu solicitud rechazada ha sido corregida y enviada nuevamente para revisión!",
          );
        } else {
          toast.success(
            "🚀 ¡Solicitud de activación enviada exitosamente a los Administradores!",
          );
        }
        setDirectType(null);
        setDirectName("");
        setDirectCelular("");
        setDirectDireccion("");
        setDirectNotes("");
        setDirectResellerNotes("");
        setIsResellerNotesEdited(false);
        setDirectUser("");
        setDirectPass("");
        setDirectComprobante(null);
        setCorrectingRequestId(null);
        fetchData();
        setCurrentMenu("finanzas"); // Ir a ver el inbox / historial
      } else {
        toast.error("No se pudo enviar la solicitud de activación.");
      }
    } catch (err: any) {
      console.error("Error al enviar solicitud de activación:", err);
      toast.error(
        `❌ Error al conectar con la base de datos: ${err.message || err}`,
      );
    } finally {
      setDirectSubmitting(false);
    }
  };

  // --- NUEVA LÓGICA: RENOVAR O REACTIVAR CLIENTE ---
  const handleRenewClient = async (account: any, planId: string) => {
    try {
      const selectedPlan = salePlans.find((p) => p.id === planId);
      // Validación estricta: Las cuentas Demo no se pueden extender ni renovar
      const isClientDemo = account.tipo_cuenta === "DEMO" ||
        account.is_demo ||
        (account.username && account.username.toLowerCase().startsWith("demo"));
      if (isClientDemo) {
        toast.error("⚠️ Los planes DEMO (Demostración) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva línea VIP.");
        return;
      }

      if (selectedPlan && (selectedPlan.hours > 0 || selectedPlan.trial === 1 || selectedPlan.name?.toLowerCase().includes("demo"))) {
        toast.error("⚠️ No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
        return;
      }

      const isVip = true;
      const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

      // Validar créditos del balance
      if (!isAdmin && currentUserCreditsVIP < creditsCost) {
        toast.error(
          `No tienes créditos VIP suficientes (Costo: ${creditsCost}, Tienes: ${currentUserCreditsVIP}).`,
        );
        return;
      }

      // Calcular nuevo vencimiento
      let nextVenc = new Date(
        account.fecha_vencimiento
          ? new Date(account.fecha_vencimiento).getTime()
          : Date.now(),
      );
      // Si ya está vencido, empezar desde hoy
      if (nextVenc < new Date()) {
        nextVenc = new Date();
      }

      let months = 1;
      let hours = 2;
      let planName = "Membresía Renovada";
      let planPrice = 0;

      if (selectedPlan) {
        months = selectedPlan.months || 1;
        nextVenc.setMonth(nextVenc.getMonth() + months);
        planName = selectedPlan.name;
        planPrice = selectedPlan.price || 0;
      } else {
        nextVenc.setMonth(nextVenc.getMonth() + 1);
      }

      // Preparar venta histórica
      const screensCount = Number(selectedPlan?.screens_api || selectedPlan?.screens || account.limite_pantallas || 1);
      const nuevaVenta = {
        fecha: new Date().toISOString(),
        autor: user?.email || "admin",
        comentario: `Renovación de membresía (${planName})`,
        es_venta: true,
        plan_nombre: planName,
        precio_minorista: planPrice,
        vendedor: user?.email || "admin",
        pantallas: screensCount,
      };

      let apiId = account.panel_client_id || account.xui_id || "";
      let apiMemberId = account.member_id || "";
      let apiAccessToken = account.access_token || "";
      let apiPlaylistUrl = account.playlist_url || "";
      let apiBouquet = account.bouquet || "";
      let apiPackageId = account.package_id || "";
      let apiRawResponse = account.raw_response_json || null;
      let xuiData: any = null;

      // --- ENVIAR COMANDO DE RENOVACIÓN AL PANEL FISICO XC ---
      if (systemConfig?.xui_url && systemConfig?.xui_token) {
        toast.loading("Enviando comando de renovación al panel XC...");
        const updatedNotes = `[XTV] ${account.nombre_completo || account.username} - ${planName} - ${user?.usuario_nombre || user?.email || "Admin"}`;

        const payloadToSend: any = {
          action: "extend_line",
          xuiUrl: systemConfig.xui_url,
          xuiToken: systemConfig.xui_token,
          xuiAccessCode: systemConfig.xui_access_code,
          username: account.username,
          id: account.panel_client_id ? Number(account.panel_client_id) : (account.xui_id ? Number(account.xui_id) : undefined),
          package: Number(selectedPlan?.provider_plan_id || "12"),
          reseller_notes: updatedNotes,
        };

        if (screensCount > 1) {
          payloadToSend.max_connections = screensCount;
        }

        const executeCall = async (finalPayload: any) => {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });
          const parsed = await resXui.json();
          return { ...parsed, _payloadSent: finalPayload };
        };

        xuiData = await executeOrInterceptApiCall(
          "extend_line",
          payloadToSend,
          executeCall,
          () => {},
        );

        toast.dismiss();

        if (xuiData && xuiData.success) {
          apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || apiId || "");
          apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || apiMemberId || "");
          apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || account.access_token || "");
          apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || account.playlist_url || "");
          apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || apiBouquet || "");
          apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || apiPackageId || "");
          apiRawResponse = xuiData.raw_response || xuiData;

          toast.success("¡Línea IPTV extendida físicamente en el panel XC!");
          logApiCall(
            "extend_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo de créditos reseller insuficiente en el panel XC.";
          toast.error(`❌ El panel XC rechazó la renovación: ${errorMsg}`);
          logApiCall(
            "extend_line",
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            false,
            errorMsg,
          );
          return; // ABORTAR RENOVACION LOCAL
        }
      } else {
        toast.error("❌ No hay ningún panel XC configurado en Ajustes. Configura el panel antes de renovar.");
        return; // ABORTAR RENOVACION LOCAL
      }

      const updatedAccount = {
        ...account,
        fecha_vencimiento: nextVenc.toISOString(),
        id_plan_venta: isVip ? planId : account.id_plan_venta,
        panel_client_id: apiId || null,
        member_id: apiMemberId || null,
        access_token: apiAccessToken || null,
        playlist_url: apiPlaylistUrl || null,
        bouquet: apiBouquet || null,
        package_id: apiPackageId || null,
        raw_response_json: apiRawResponse || null,
        bitacora_comentarios: [
          ...(account.bitacora_comentarios || []),
          nuevaVenta,
        ],
      };

      const res = await apiService.saveIptvAccount(updatedAccount);
      if (res.success) {
        // Descontar saldo
        if (!isAdmin) {
          if (isVip) {
            const remaining = currentUserCreditsVIP - creditsCost;
            await apiService.updateIptvPanelUserCredits(
              user.email,
              remaining,
              currentUserCreditsDemo,
            );
          } else {
            const remaining = currentUserCreditsDemo - 1;
            await apiService.updateIptvPanelUserCredits(
              user.email,
              currentUserCreditsVIP,
              remaining,
            );
          }
        }

        try {
          await apiService.registrarMovimiento({
            usuario_nombre: user.email,
            accion: "CLIENTE_RENOVADO",
            entidad: "IPTV_CLIENTES",
            entidad_id: account.username,
            detalle: `Se renovó la membresía de ${account.username} con plan ${planName}.`,
          });
        } catch {}

        toast.success(
          `🎉 ¡Membresía de ${account.nombre_completo || account.username} renovada con éxito hasta ${nextVenc.toLocaleDateString()}!`,
        );
        setSelectedClientForDetails(null);
        setRenewConfirmData(null);
        fetchData();
      } else {
        toast.error("Error al procesar la renovación en la base de datos.");
      }
    } catch (err: any) {
      toast.error("Ocurrió un error inesperado al renovar: " + err.message);
    }
  };

  // 1. CREACIÓN DE CUENTA DEMO (⚡ CON CONTROL DE CRÉDITOS Y CASOS INSUFICIENTES)
  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitting(true);

    // Validar nombre
    const clientName = demoName.trim();
    if (!clientName) {
      toast.error("Por favor, ingresa el nombre completo del cliente.");
      setDemoSubmitting(false);
      return;
    }

    // Verificar si el usuario actual cuenta con créditos demo suficientes
    if (!isAdmin && currentUserCreditsDemo < 1) {
      toast.error(
        `No tienes créditos demo disponibles (Tienes: ${currentUserCreditsDemo}). Solicita recarga de saldo demo o activa membresías.`,
      );
      setDemoSubmitting(false);
      return;
    }

    // Generar usuario automático inteligente
    const randNum = Math.floor(100000 + Math.random() * 900000);
    let generatedUsername = `demo${randNum}`;

    // Generar contraseña aleatoria
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let randPass = "";
    for (let i = 0; i < 6; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let generatedPassword = `pass_${randPass}`;

    // Determinar horas según paquete
    let durationHours = 2;
    let pkgLabel = "Demo Prueba";
    const foundPkg = demoPackagesFiltered.find((p) => p.id === demoPkg);
    if (foundPkg) {
      pkgLabel = foundPkg.name;
      durationHours = foundPkg.hours || 2;
    } else {
      if (demoPkg.includes("1h")) durationHours = 1;
      if (demoPkg.includes("3h")) durationHours = 3;
      if (demoPkg.includes("6h")) durationHours = 6;
    }

    const vencimiento = new Date(
      Date.now() + durationHours * 60 * 60 * 1000,
    ).toISOString();

    // Comentarios estructurados
    const finalComments = `Línea de prueba generada automáticamente. Cliente: ${clientName}. Tel: ${demoCelular || "N/A"}. `;

    // Obtener la URL centralizada asignada
    let xuiUrl =
      systemConfig?.xc_url_completa ||
      systemConfig?.xui_url ||
      "http://vip-xtv.pro:8080";
    let isReal = false;

    let demoApiId = "";
    let demoApiMemberId = "";
    let demoApiAccessToken = "";
    let demoApiPlaylistUrl = "";
    let demoApiBouquet = "";
    let demoApiPackageId = "";
    let demoApiRawResponse: any = null;

    // Intentar conexión al XUI si los campos existen en el panel central
    if (systemConfig?.xui_url && systemConfig?.xui_token) {
      toast.loading("Creando cuenta demo en la API activa del proveedor...");
      const payloadToSend: any = {
        action: "create_line",
        xuiUrl: systemConfig.xui_url,
        xuiToken: systemConfig.xui_token,
        xuiAccessCode: systemConfig.xui_access_code,
        package: Number(foundPkg ? foundPkg.id : "1"),
        trial: 1,
        reseller_notes: `[xtv] ${clientName || "Cliente Demo"} - ${foundPkg?.package_name || foundPkg?.name || "Demo"} - ${user?.usuario_nombre || user?.email || "Admin"} - ${user?.usuario_nombre || user?.email || "Admin"}`,
      };
      const demoScreens = Number(foundPkg?.screens_api || foundPkg?.screens || foundPkg?.max_connections || 1);
      if (demoScreens > 1) {
        payloadToSend.max_connections = demoScreens;
      }

      try {
        const executeCall = async (finalPayload: any) => {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });
          const parsed = await resXui.json();
          return { ...parsed, _payloadSent: finalPayload };
        };

        const xuiData = await executeOrInterceptApiCall(
          "create_line",
          payloadToSend,
          executeCall,
          () => {},
        );

        toast.dismiss();

        if (xuiData && xuiData.success) {
          isReal = true;
          xuiUrl = systemConfig.xui_url;
          const realUsername = xuiData.username || xuiData.data?.username;
          const realPassword = xuiData.password || xuiData.data?.password;
          if (realUsername) generatedUsername = realUsername;
          if (realPassword) generatedPassword = realPassword;

          demoApiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || "");
          demoApiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
          demoApiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
          demoApiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || "");
          demoApiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
          demoApiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
          demoApiRawResponse = xuiData.raw_response || xuiData;

          toast.success("¡Cuenta demo creada físicamente en el servidor!");
          logApiCall(
            "create_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o credenciales inválidas en el panel XC.";
          console.warn("API de XUI devolvió éxito falso:", errorMsg);
          toast.error(`❌ El panel XC rechazó la creación de demo: ${errorMsg}`);
          logApiCall(
            "create_line",
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            false,
            errorMsg,
          );
          setDemoSubmitting(false);
          return; // ABORTAR CREACION LOCAL
        }
      } catch (err: any) {
        toast.dismiss();
        const errorMsg = err.message || String(err);
        console.warn("No se pudo conectar con la API de XUI:", errorMsg);
        toast.error(`❌ Error al conectar con el panel XC: ${errorMsg}`);
        logApiCall(
          "create_line",
          payloadToSend,
          null,
          false,
          errorMsg,
        );
        setDemoSubmitting(false);
        return; // ABORTAR CREACION LOCAL
      }
    } else {
      toast.error("❌ No hay ningún panel XC configurado en Ajustes. Configura el panel antes de crear demostraciones.");
      setDemoSubmitting(false);
      return; // ABORTAR CREACION LOCAL
    }

    // Instancia de cuenta construida con los campos de contacto del cliente (unificación multi-app)
    const newAccount = {
      username: generatedUsername,
      password: generatedPassword,
      url_panel_asignada: xuiUrl,
      estado: "Activo",
      limite_pantallas: 2,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: vencimiento,
      comentarios: finalComments,
      nombre_completo: clientName,
      celular: demoCelular,
      direccion_actual: "",
      id_plan_proveedor: foundPkg ? foundPkg.id : "demo-pkg",
      id_plan_venta: "",
      bitacora_comentarios: [
        {
          fecha: new Date().toISOString(),
          autor: user?.email || "Vendedor",
          comentario: `Prueba demo de ${durationHours} horas iniciada comercialmente.`,
        },
      ],
      creado_por: user?.email || "admin",
      panel_client_id: demoApiId || null,
      member_id: demoApiMemberId || null,
      access_token: demoApiAccessToken || null,
      playlist_url: demoApiPlaylistUrl || null,
      bouquet: demoApiBouquet || null,
      package_id: demoApiPackageId || null,
      raw_response_json: demoApiRawResponse || null,
    };

    const res = await apiService.saveIptvAccount(newAccount);
    setDemoSubmitting(false);

    if (res.success) {
      // Restar 1 crédito demo al vendedor
      if (!isAdmin) {
        const remainingDemos = currentUserCreditsDemo - 1;
        await apiService.updateIptvPanelUserCredits(
          user.email,
          currentUserCreditsVIP,
          remainingDemos,
        );
        try {
          await apiService.registrarMovimiento({
            usuario_nombre: user.email,
            accion: "CLIENTE_DEMO_CREADO_CREDITO",
            entidad: "IPTV_CLIENTES",
            entidad_id: generatedUsername,
            detalle: `Vendedor creó cuenta demo gratis de ${durationHours}h. Costo: 1 crédito demo. Restantes: ${remainingDemos}`,
          });
        } catch (e) {}
      }

      setDemoResult({
        ...newAccount,
        realServer: isReal,
        unexpired_duration: `${durationHours} Horas`,
        m3u: `${xuiUrl}/get.php?username=${generatedUsername}&password=${generatedPassword}&output=ts`,
      });
      // Recargar lista y limpiar form
      setDemoName("");
      setDemoCelular("");
      setDemoEmail("");
      setDemoNotes("");
      fetchData();
      toast.success("Demo registrado y sincronizado en la Base de Datos.");
    } else {
      toast.error("Error al registrar cuenta demo localmente.");
    }
  };

  // 2. CREACIÓN DE INTERFAZ VIP (CON CONTROL DE CRÉDITOS Y CASOS INSUFICIENTES)
  const handleCreateVip = async (e: React.FormEvent) => {
    e.preventDefault();
    setVipSubmitting(true);

    let u = vipUser
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    let p = vipPass.trim();
    const clName = vipName.trim();
    const cell = vipCelular.trim();

    if (!u || !p || !clName) {
      toast.error("Usuario, Contraseña y Nombre del cliente son requeridos.");
      setVipSubmitting(false);
      return;
    }

    // Buscar costo de créditos según plan seleccionado
    const selectedPlan = salePlans.find((plan) => plan.id === vipPlanId);
    const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

    // Verificar si el usuario actual cuenta con créditos suficientes
    if (!isAdmin && currentUserCreditsVIP < creditsCost) {
      // Error amigable y sugerir enviar solicitud a administracion
      toast.error(
        `Saldo VIP insuficiente. No tienes los ${creditsCost} créditos necesarios (Tienes: ${currentUserCreditsVIP}). Procede a solicitar ayuda de creación.`,
      );

      // Ofrecer precargar la solicitud de ticket
      setReqType("crear_cuenta");
      setReqAmount(creditsCost);
      setReqDetailsText(
        `Solicitud para crear cuenta VIP del cliente ${clName}. Plan: ${selectedPlan?.name || "Comercial"}. Usuario propuesto: ${u}, Contraseña: ${p}.`,
      );
      setCurrentMenu("finanzas");

      setVipSubmitting(false);
      return;
    }

    // Crear cuenta VIP
    const months = selectedPlan ? Number(selectedPlan.months || 1) : 1;
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + months);

    let xuiUrl =
      systemConfig?.xc_url_completa ||
      systemConfig?.xui_url ||
      "http://vip-xtv.pro:8080";
    let isReal = false;

    // Conectar a la API activa si es posible
    if (systemConfig?.xui_url && systemConfig?.xui_token) {
      toast.loading("Creando cuenta de venta VIP en el proveedor de IPTV...");
      const payloadToSend: any = {
        action: "create_line",
        xuiUrl: systemConfig.xui_url,
        xuiToken: systemConfig.xui_token,
        xuiAccessCode: systemConfig.xui_access_code,
        package: Number(selectedPlan ? (selectedPlan.provider_plan_id || selectedPlan.id) : "1"),
        trial: 0,
        reseller_notes: `[xtv] ${clName || "Cliente VIP"} - ${selectedPlan?.name || "VIP"} - ${user?.usuario_nombre || user?.email || "Admin"} - ${user?.usuario_nombre || user?.email || "Admin"}`,
      };
      const screensCount = Number(selectedPlan?.screens_api || selectedPlan?.screens || 1);
      if (screensCount > 1) {
        payloadToSend.max_connections = screensCount;
      }

      try {
        const executeCall = async (finalPayload: any) => {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });
          const parsed = await resXui.json();
          return { ...parsed, _payloadSent: finalPayload };
        };

        const xuiData = await executeOrInterceptApiCall(
          "create_line",
          payloadToSend,
          executeCall,
          () => {},
        );

        toast.dismiss();

        if (xuiData && xuiData.success) {
          isReal = true;
          const realUsername = xuiData.username || xuiData.data?.username;
          const realPassword = xuiData.password || xuiData.data?.password;
          if (realUsername) u = realUsername;
          if (realPassword) p = realPassword;
          toast.success(
            "¡Cuenta VIP alojada físicamente en el servidor de producción!",
          );
          logApiCall(
            "create_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo insuficiente de créditos reseller en el panel XC.";
          console.warn("Fallo de API al crear VIP:", errorMsg);
          toast.error(`❌ El panel XC rechazó la creación de VIP: ${errorMsg}`);
          logApiCall(
            "create_line",
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            false,
            errorMsg,
          );
          setVipSubmitting(false);
          return; // ABORTAR CREACIÓN VIP LOCAL
        }
      } catch (err: any) {
        toast.dismiss();
        const errorMsg = err.message || String(err);
        console.warn("Fallo de API al conectar con XC:", errorMsg);
        toast.error(`❌ Error al conectar con el panel XC: ${errorMsg}`);
        logApiCall(
          "create_line",
          payloadToSend,
          null,
          false,
          errorMsg,
        );
        setVipSubmitting(false);
        return; // ABORTAR CREACIÓN VIP LOCAL
      }
    } else {
      toast.error("❌ No hay ningún panel XC configurado en Ajustes. Configura el panel antes de crear cuentas VIP.");
      setVipSubmitting(false);
      return; // ABORTAR CREACIÓN VIP LOCAL
    }

    const newVipAccount = {
      username: u,
      password: p,
      url_panel_asignada: xuiUrl,
      estado: "Activo",
      limite_pantallas: selectedPlan ? Number(selectedPlan.screens || 2) : 2,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: expiration.toISOString(),
      comentarios: `Línea VIP Premium de venta activa por ${months} Meses. Notas: ${vipNotes}`,
      nombre_completo: clName,
      celular: cell,
      direccion_actual: "",
      id_plan_proveedor: selectedPlan ? selectedPlan.provider_plan_id : "",
      id_plan_venta: vipPlanId,
      bitacora_comentarios: [
        {
          fecha: new Date().toISOString(),
          autor: user?.email || "Vendedor",
          comentario: `Venta de membresía VIP Premium (${months} Meses) iniciada.`,
        },
      ],
      creado_por: user?.email || "admin",
    };

    const res = await apiService.saveIptvAccount(newVipAccount);

    if (res.success) {
      // Descontar créditos al revendedor si no es admin
      if (!isAdmin) {
        const remaining = currentUserCreditsVIP - creditsCost;
        await apiService.updateIptvPanelUserCredits(
          user.email,
          remaining,
          currentUserCreditsDemo,
        );
        // Introducir auditoria en historial_movimientos
        try {
          await apiService.registrarMovimiento({
            usuario_nombre: user.email,
            accion: "CLIENTE_VIP_CREADO_CREDITO",
            entidad: "IPTV_CLIENTES",
            entidad_id: u,
            detalle: `Vendedor creó cuenta VIP ${u} consumiendo ${creditsCost} créditos. Nuevo saldo: ${remaining}`,
          });
        } catch (e) {}
      }

      toast.success("Membresía VIP Premium guardada y activada.");

      // Limpiar Formulario
      setVipUser("");
      setVipPass("");
      setVipName("");
      setVipCelular("");
      setVipNotes("");

      setCurrentMenu("inicio");
      fetchData();
    } else {
      toast.error("No se pudo persistir la cuenta VIP Premium.");
    }
    setVipSubmitting(false);
  };

  // 3. ENVÍO DE SOLICITUD DE CRÉDITO / AYUDA (SOPORTE DE RESELLERS)
  const handleSubmitCreditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitting(true);

    try {
      const payload = {
        reseller_usuario: user?.email || "vendedor",
        tipo_solicitud: reqType,
        cantidad_creditos: Number(reqAmount),
        comprobante_url: comprobanteUrl, // Adjuntamos voucher de la transferencia
        detalles: {
          comentarios: reqDetailsText,
          fecha_peticion: new Date().toISOString(),
        },
      };

      const res = await apiService.createIptvCreditRequest(payload);

      if (res.success) {
        toast.success(
          "Tu solicitud y comprobante de transferencia fueron enviados a los Socios/Admin. Recibirás respuesta enseguida.",
        );
        setReqDetailsText("");
        setComprobanteUrl(null);
        fetchData();
      } else {
        toast.error("Ocurrió un error al enviar tu solicitud.");
      }
    } catch (err: any) {
      console.error("Error al enviar solicitud de crédito:", err);
      toast.error(`❌ Error de red o base de datos: ${err.message || err}`);
    } finally {
      setReqSubmitting(false);
    }
  };

  // 4. APROBACIÓN O RECHAZO DE SOLICITUD POR ADMINISTRADORES Y SOCIOS
  const handleProcessRequest = async (
    reqId: string,
    action: "aprobado" | "rechazado",
    details: any,
    motivo_rechazo?: string,
  ) => {
    try {
      toast.loading("Procesando ticket de soporte...");

      const selectedReqForCheck = creditRequests.find((r) => r.id === reqId);
      if (selectedReqForCheck && selectedReqForCheck.tipo_solicitud === "crear_cuenta" && !hasPermission("Admin.IntegracionXC.Acceder")) {
        toast.dismiss();
        toast.error("Error de seguridad: No tienes el permiso requerido para procesar líneas de clientes (Admin.IntegracionXC.Acceder).");
        return;
      }

      // Si se aprueba y es de tipo "asignar_credito", le asignamos los créditos reales al reseller
      if (action === "aprobado") {
        const selectedReq = creditRequests.find((r) => r.id === reqId);
        if (selectedReq) {
          const usernameToCredit = selectedReq.reseller_usuario
            .trim()
            .toLowerCase();
          const resellerAccount = panelUsers.find(
            (u) => u.usuario.trim().toLowerCase() === usernameToCredit,
          );

          const currentVipCreds = resellerAccount
            ? Number(resellerAccount.creditos || 0)
            : 0;
          const currentDemoCreds = resellerAccount
            ? Number(resellerAccount.creditos_demo || 0)
            : 0;
          const amount = Number(selectedReq.cantidad_creditos || 0);

          if (selectedReq.tipo_solicitud === "comprar_creditos_demo") {
            const newDemo = currentDemoCreds + amount;
            await apiService.updateIptvPanelUserCredits(
              usernameToCredit,
              currentVipCreds,
              newDemo,
            );
            toast.success(
              `Créditos DEMO asignados con éxito a ${usernameToCredit}. Saldo actual: ${newDemo}`,
            );
          } else if (
            selectedReq.tipo_solicitud === "asignar_credito" ||
            selectedReq.tipo_solicitud === "comprar_creditos_vip"
          ) {
            const newVip = currentVipCreds + amount;
            await apiService.updateIptvPanelUserCredits(
              usernameToCredit,
              newVip,
              currentDemoCreds,
            );
            toast.success(
              `Créditos VIP asignados con éxito a ${usernameToCredit}. Saldo actual: ${newVip}`,
            );
          } else if (selectedReq.tipo_solicitud === "crear_cuenta") {
            // AUTOMATIZACIÓN DE REGISTROS IPTV CON UN CLIC DESDE LA BANDEJA ADMINISTRATIVA
            const det = selectedReq.detalles || {};
            const typeAcc = det.tipo_cuenta || "VIP";
            const operacion = details?.operacion || "create_line";
            const xuiLineId = details?.xui_line_id || null;

            // Buscar cuenta existente si es extend_line o por celular/nombre de coincidencia
            let matchedAcc: any = null;
            if (operacion === "extend_line" && xuiLineId) {
              matchedAcc = accounts.find(
                (acc: any) =>
                  String(acc.xui_id) === String(xuiLineId) ||
                  String(acc.id_linea) === String(xuiLineId),
              );
            }
            if (!matchedAcc) {
              matchedAcc = accounts.find(
                (acc: any) =>
                  (acc.celular &&
                    det.celular &&
                    acc.celular.trim() === det.celular.trim()) ||
                  (acc.nombre_completo &&
                    det.nombre_completo &&
                    acc.nombre_completo.toLowerCase().trim() ===
                      det.nombre_completo.toLowerCase().trim()),
              );
            }

            let u = matchedAcc
              ? matchedAcc.username
              : details?.usuario_propuesto ||
                det.usuario_propuesto ||
                `usr${Math.floor(100000 + Math.random() * 900000)}`;
            let p = matchedAcc
              ? matchedAcc.password
              : details?.contrasena_propuesta ||
                det.contrasena_propuesta ||
                `pass_${Math.random().toString(36).substring(2, 8)}`;

            let baseDate = Date.now();
            if (
              operacion === "extend_line" &&
              matchedAcc &&
              matchedAcc.fecha_vencimiento
            ) {
              const existingMillis = new Date(
                matchedAcc.fecha_vencimiento,
              ).getTime();
              if (existingMillis > Date.now()) {
                baseDate = existingMillis;
              }
            }

            let expirationDate: string | null = null;
            let comments = det.comentarios || "";
            let planVentaId = "";
            let planProvId = "";
            let selectedPlanForRequest: any = null;

            if (typeAcc === "VIP") {
              const selPl = salePlans.find((pl) => pl.id === det.plan_id);
              selectedPlanForRequest = selPl;
              const mths = selPl ? Number(selPl.months || 1) : 1;
              const exp = new Date(baseDate);
              exp.setMonth(exp.getMonth() + mths);
              expirationDate = exp.toISOString();
              comments =
                operacion === "extend_line"
                  ? `Línea VIP Premium EXTENDIDA automáticamente por administración desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`
                  : `Línea VIP Premium activada automáticamente por administración desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`;
              planVentaId = det.plan_id || "";
              planProvId = selPl ? selPl.provider_plan_id : "";
            } else {
              // Buscar primero si es un plan minorista de venta
              const selPl = salePlans.find((pl) => pl.id === det.plan_id);
              selectedPlanForRequest = selPl;
              const demoPl = !selPl
                ? demoPackagesFiltered.find((pl) => pl.id === det.plan_id)
                : null;

              const durationHrs = selPl
                ? Number(selPl.months) > 0
                  ? Number(selPl.months) * 730
                  : 2
                : demoPl
                  ? Number(demoPl.hours || 2)
                  : 2;

              expirationDate = new Date(
                baseDate + durationHrs * 60 * 60 * 1000,
              ).toISOString();
              comments =
                operacion === "extend_line"
                  ? `Línea de prueba Demo EXTENDIDA automáticamente por administración desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`
                  : `Línea de prueba Demo activada automáticamente por administración desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`;
              planVentaId = det.plan_id || "";
              planProvId = selPl
                ? selPl.provider_plan_id
                : demoPl
                  ? demoPl.id
                  : det.plan_id || "";
            }

            let xuiUrl =
              systemConfig?.xc_url_completa ||
              systemConfig?.xui_url ||
              "http://vip-xtv.pro:8080";
            let isReal = false;
            let finalXuiId =
              operacion === "extend_line"
                ? xuiLineId ||
                  (matchedAcc ? matchedAcc.xui_id || matchedAcc.id_linea : null)
                : null;

            let apiId = "";
            let apiMemberId = "";
            let apiAccessToken = "";
            let apiPlaylistUrl = "";
            let apiBouquet = "";
            let apiPackageId = "";
            let apiRawResponse: any = null;

            // REGISTRAR O EXTENDER CUENTA EN EL PANEL FISICO XC DEL PROVEEDOR
            if (systemConfig?.xui_url && systemConfig?.xui_token) {
              toast.loading(
                operacion === "extend_line"
                  ? "Extendiendo membresía físicamente en el servidor de producción XC..."
                  : "Registrando y activando cuenta físicamente en el servidor de producción XC...",
              );

              const payloadToSend: any = {
                action:
                  operacion === "extend_line" ? "extend_line" : "create_line",
                xuiUrl: systemConfig.xui_url,
                xuiToken: systemConfig.xui_token,
                xuiAccessCode: systemConfig.xui_access_code,
                package: Number(planProvId || "12"),
              };

              const clientName = det.nombre_completo || (matchedAcc ? matchedAcc.nombre_completo || matchedAcc.username : "Cliente");
              const planName = det.plan_nombre || selectedPlanForRequest?.name || (matchedAcc ? matchedAcc.nombre_plan || matchedAcc.plan_venta_nombre : "Plan");
              const requesterName = selectedReq.reseller_usuario || usernameToCredit || "Reseller";
              const approverName = user?.usuario_nombre || user?.email || "Admin";
              const formattedNotes = `[XTV] ${clientName} - ${planName} - ${requesterName} - ${approverName}`;
              const screensCount = Number(det.screens_api || det.pantallas || selectedPlanForRequest?.screens_api || selectedPlanForRequest?.screens || (matchedAcc ? matchedAcc.limite_pantallas : null) || 1);

              if (operacion === "extend_line") {
                payloadToSend.id = Number(finalXuiId || "0");
                if (matchedAcc?.username || det.usuario_propuesto) {
                  payloadToSend.username = matchedAcc?.username || det.usuario_propuesto;
                }
                if (formattedNotes.trim()) payloadToSend.reseller_notes = formattedNotes.trim();
                if (screensCount > 1) {
                  payloadToSend.max_connections = screensCount;
                }
              } else {
                payloadToSend.trial = typeAcc === "VIP" ? 0 : 1;
                if (formattedNotes.trim()) payloadToSend.reseller_notes = formattedNotes.trim();
                if (screensCount > 1) {
                  payloadToSend.max_connections = screensCount;
                }
              }

              try {
                const executeCall = async (finalPayload: any) => {
                  const resXui = await fetch("/api/iptv/xui", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(finalPayload),
                  });
                  const parsed = await resXui.json();
                  return { ...parsed, _payloadSent: finalPayload };
                };

                const xuiData = await executeOrInterceptApiCall(
                  payloadToSend.action,
                  payloadToSend,
                  executeCall,
                  () => {},
                );

                toast.dismiss();

                if (xuiData && xuiData.success) {
                  isReal = true;
                  if (operacion === "extend_line") {
                    toast.success(
                      "¡Línea IPTV extendida físicamente en el panel XC!",
                    );
                  } else {
                    const realUsername =
                      xuiData.username || xuiData.data?.username;
                    const realPassword =
                      xuiData.password || xuiData.data?.password;
                    if (realUsername) u = realUsername;
                    if (realPassword) p = realPassword;

                    const extractedId = xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id;
                    if (extractedId) finalXuiId = String(extractedId);

                    toast.success(
                      "¡Línea IPTV registrada y enlazada físicamente en el panel XC!",
                    );
                  }

                  apiId = String(xuiData.raw_response?.data?.id || xuiData.data?.id || xuiData.id || finalXuiId || "");
                  apiMemberId = String(xuiData.raw_response?.data?.member_id || xuiData.data?.member_id || "");
                  apiAccessToken = String(xuiData.raw_response?.data?.access_token || xuiData.data?.access_token || xuiData.access_token || "");
                  apiPlaylistUrl = String(xuiData.playlist_url || xuiData.raw_response?.data?.playlist_url || "");
                  apiBouquet = String(xuiData.raw_response?.data?.bouquet || xuiData.data?.bouquet || "");
                  apiPackageId = String(xuiData.raw_response?.data?.package_id || xuiData.data?.package_id || "");
                  apiRawResponse = xuiData.raw_response || xuiData;

                  logApiCall(
                    payloadToSend.action,
                    xuiData._payloadSent || payloadToSend,
                    xuiData,
                    true,
                  );
                } else {
                  console.warn(
                    "Fallo en la API de XC:",
                    xuiData?.error || "Error desconocido",
                  );
                  toast.error(
                    "Advertencia: No se pudo actualizar en la API de XC, se guardará en modo local/contingencia. Detalle: " +
                      (xuiData?.error || "Error de conexión"),
                  );
                  logApiCall(
                    payloadToSend.action,
                    xuiData?._payloadSent || payloadToSend,
                    xuiData,
                    false,
                    xuiData?.error,
                  );
                }
              } catch (err: any) {
                toast.dismiss();
                console.warn(
                  "Fallo de API al conectar con XC, se registra en modo offline:",
                  err.message || err,
                );
                logApiCall(
                  payloadToSend.action,
                  payloadToSend,
                  null,
                  false,
                  err.message || String(err),
                );
              }
            }

            const originalResellerNotes =
              det.reseller_notes ||
              `[XTV]${det.nombre_completo || "Cliente"} - ${det.plan_nombre || "Plan"} - ${usernameToCredit}`;
            const finalResellerNotes = `${originalResellerNotes} - ${user?.email || "admin"}`;

            const autoAcc = {
              username: u,
              password: p,
              url_panel_asignada: xuiUrl,
              estado: "Activo",
              limite_pantallas: Number(det.pantallas || 2),
              fecha_creacion: matchedAcc
                ? matchedAcc.fecha_creacion || new Date().toISOString()
                : new Date().toISOString(),
              fecha_vencimiento: expirationDate,
              comentarios: comments,
              reseller_notes: finalResellerNotes,
              nombre_completo:
                det.nombre_completo ||
                (matchedAcc ? matchedAcc.nombre_completo : "Cliente Reseller"),
              celular: det.celular || (matchedAcc ? matchedAcc.celular : ""),
              direccion_actual:
                det.direccion_actual ||
                (matchedAcc ? matchedAcc.direccion_actual : ""),
              id_plan_provider: planProvId,
              id_plan_venta: planVentaId,
              xui_id: finalXuiId || apiId,
              id_linea: finalXuiId || apiId,
              panel_client_id: apiId || finalXuiId || null,
              member_id: apiMemberId || null,
              access_token: apiAccessToken || matchedAcc?.access_token || null,
              playlist_url: apiPlaylistUrl || matchedAcc?.playlist_url || null,
              bouquet: apiBouquet || null,
              package_id: apiPackageId || null,
              raw_response_json: apiRawResponse || null,
              bitacora_comentarios: [
                ...(matchedAcc?.bitacora_comentarios || []),
                {
                  fecha: new Date().toISOString(),
                  autor: user?.email || "admin",
                  comentario:
                    operacion === "extend_line"
                      ? `Membresía extendida de forma central por administración.`
                      : `Membresía activada y autorizada de forma central por administración.`,
                  es_venta: true,
                  plan_nombre:
                    det.plan_nombre ||
                    (typeAcc === "VIP" ? "VIP Comercial" : "Demo Prueba"),
                  precio_minorista:
                    typeAcc === "VIP"
                      ? salePlans.find((pl) => pl.id === det.plan_id)?.price ||
                        1500
                      : 0,
                  vendedor: usernameToCredit,
                  pantallas: Number(det.pantallas || 2),
                },
              ],
              creado_por: matchedAcc
                ? matchedAcc.creado_por || usernameToCredit
                : usernameToCredit,
            };
            const autoRes = await apiService.saveIptvAccount(autoAcc);
            if (autoRes.success) {
              toast.success(
                `¡Cuenta de cliente IPTV para ${det.nombre_completo} activada automáticamente en Supabase!`,
              );

              // Guardar credenciales de vuelta en details para el ticket y mensaje de WhatsApp
              details.usuario_propuesto = u;
              details.contrasena_propuesta = p;

              // Generar mensaje de respuesta para el modal
              const tempReq = {
                detalles: {
                  nombre_completo: det.nombre_completo,
                  usuario_propuesto: u,
                  contrasena_propuesta: p,
                  notas_aprobacion: details?.notas_aprobacion || "",
                },
              };
              const msg = generateWhatsappMessage(tempReq);
              setApprovedMessageModal(msg);

              // Deducir créditos al reseller si no es admin
              const resellerAccount = panelUsers.find(
                (u) => u.usuario.trim().toLowerCase() === usernameToCredit,
              );
              if (resellerAccount && usernameToCredit !== "admin") {
                if (typeAcc === "VIP") {
                  const newVip = Math.max(0, currentVipCreds - amount);
                  await apiService.updateIptvPanelUserCredits(
                    usernameToCredit,
                    newVip,
                    currentDemoCreds,
                  );
                } else {
                  const newDemo = Math.max(0, currentDemoCreds - 1);
                  await apiService.updateIptvPanelUserCredits(
                    usernameToCredit,
                    currentVipCreds,
                    newDemo,
                  );
                }
              }
            } else {
              toast.error(
                "Error al persistir la cuenta de cliente desde el ticket.",
              );
            }
          }
        }
      }

      // Si se rechaza, guardamos el motivo de rechazo en los detalles de la solicitud
      const finalDetails = details ? { ...details } : {};
      if (action === "rechazado" && motivo_rechazo) {
        finalDetails.motivo_rechazo = motivo_rechazo;
      }

      const res = await apiService.updateIptvCreditRequestStatus(
        reqId,
        action,
        user?.email || "admin",
        motivo_rechazo,
        finalDetails,
      );
      toast.dismiss();

      if (res.success) {
        toast.success(
          `La solicitud se marcó como ${action.toUpperCase()} correctamente.`,
        );
        fetchData();
      } else {
        toast.error("Error al actualizar estado del ticket en base de datos.");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Error en el procesado del ticket: " + err.message);
    }
  };

  return (
    <div className="px-5 py-6 md:py-10 w-full space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* Botón de Activación de Modo Edición (Solo para Administradores con permiso) */}
      {hasPermission('Admin.ModoEdicionInterface.Habilitar') && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm border select-none ${
              isEditMode
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Pencil size={12} className={isEditMode ? "animate-bounce" : ""} />
            {isEditMode ? 'Desactivar Edición' : 'Modo Edición'}
          </button>
        </div>
      )}

      {/* 1. SECCIÓN SUPERIOR Y NAVEGACIÓN */}
      {currentMenu !== 'inicio' && !isEditMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} />
              Inicio General
            </button>

            <button
              type="button"
              onClick={() => setCurrentMenu('inicio')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer shadow-sm"
            >
              <Tv size={14} />
              Menú XTV
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('Iptv.CreditosXC.Ver') && (
              <div 
                onClick={handleRefreshDashboardCredits}
                title="Sincronizar créditos en vivo"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-extrabold cursor-pointer hover:brightness-105 active:scale-95 transition-all select-none"
              >
                <Coins size={14} className="text-yellow-300 animate-pulse shrink-0" />
                <span>{availableCredits} Fichas</span>
                <RefreshCw size={12} className={isRefreshingCredits ? "animate-spin ml-1" : "ml-1"} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 1. SECCIÓN SUPERIOR BIENVENIDA */}
          <div 
            onClick={() => { if (isEditMode) handleOpenEditWelcome(); }}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-3xl transition-all duration-200 relative w-full ${
              isEditMode ? 'ring-2 ring-dashed ring-amber-500 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10' : ''
            }`}
          >
            {isEditMode && (
              <span className="absolute -top-3 left-6 bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-30">
                <Pencil size={10} /> Hacer clic para editar encabezados
              </span>
            )}

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {systemConfig?.dashboard_customizations?.welcomePrefix || "Bienvenido"}{" "}
                <span className="text-yellow-500 dark:text-yellow-400 font-extrabold">
                  {user?.user_metadata?.name || "Colaborador"}
                </span>
                {systemConfig?.dashboard_customizations?.welcomeSuffix !== undefined 
                  ? systemConfig?.dashboard_customizations?.welcomeSuffix 
                  : "."}
              </h1>
            </div>

            {/* Botón de Créditos de XC Panel - Solo visible con el permiso correspondiente */}
            {hasPermission('Iptv.CreditosXC.Ver') && (
              <div 
                onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    handleOpenEditWelcome();
                  } else {
                    handleRefreshDashboardCredits();
                  }
                }}
                title={isEditMode ? "Editar textos" : "Hacer clic para sincronizar créditos reales en vivo"}
                className={`flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 rounded-2xl shadow-md border cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all select-none ${
                  isEditMode ? 'border-amber-500 ring-2 ring-amber-400' : 'border-indigo-400/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Coins
                    className="text-yellow-300 animate-pulse shrink-0"
                    size={20}
                  />
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider font-black opacity-90 leading-none">
                      {systemConfig?.dashboard_customizations?.creditsLabel || "Créditos XC Panel"}
                    </p>
                    <p className="text-base font-black leading-tight mt-0.5">
                      {availableCredits} Fichas Disponibles
                    </p>
                  </div>
                </div>
                
                <div className="h-6 w-px bg-white/20" />
                
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isEditMode) handleRefreshDashboardCredits(); }}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Actualizar créditos en vivo ahora"
                >
                  <RefreshCw size={14} className={isRefreshingCredits ? "animate-spin" : "hover:rotate-180 transition-transform duration-300"} />
                </button>
              </div>
            )}
          </div>

          {/* 2. MENU LAUNCHPAD DE BOTONES RECTANGULARES FLUYENTES (DISEÑO INICIO ORIGINAL DE ALTA FIDELIDAD) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 py-4 w-full items-stretch">
            {menuItems
              .filter((item) => item.showCondition)
              .map((item) => {
                const IconComponent = ICON_MAP[item.iconName] || Sparkles;
                const isLocked = isCardLocked(item.id);
                const isSelectedMenu = currentMenu === item.id;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (isEditMode) {
                        handleOpenEditCard(item);
                      } else {
                        item.action();
                      }
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${item.color1 || '#0074cc'} 0%, ${item.color2 || '#004580'} 100%)`,
                      boxShadow: isEditMode 
                        ? 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.4), 0 0 15px rgba(245, 158, 11, 0.4)'
                        : isSelectedMenu
                          ? 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), 0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                          : 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.35), 0 4px 8px -1px rgba(0, 0, 0, 0.2)'
                    }}
                    className={`group relative flex flex-col items-center justify-center text-center rounded-2xl border border-white/20 text-white cursor-pointer select-none transition-all duration-200 overflow-hidden aspect-square p-2 sm:p-3 md:p-4 lg:p-5 hover:-translate-y-1 hover:shadow-md active:translate-y-0 ${
                      isEditMode 
                        ? 'border-amber-500 ring-2 ring-amber-500 scale-98 brightness-95 hover:brightness-100 hover:scale-100' 
                        : isSelectedMenu
                          ? 'ring-2 ring-white/30 scale-102 brightness-110'
                          : ''
                    } ${isLocked && !isEditMode ? 'opacity-85' : ''}`}
                  >
                    {isEditMode && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 p-1.5 rounded-lg z-20 shadow-md flex items-center justify-center animate-pulse">
                        <Pencil size={11} />
                      </div>
                    )}

                    {/* Metallic Highlight Gloss Flare */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                    {/* Icono libre y centrado */}
                    <div className="flex items-center justify-center mb-1 sm:mb-2 md:mb-3">
                      {isLocked && !isEditMode ? (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase bg-black/45 px-2 py-1 rounded-full border border-white/10 text-white/95">
                          🔒 Bloqueado
                        </span>
                      ) : item.customIcon ? (
                        <img src={item.customIcon} className="size-8 xs:size-9 sm:size-11 md:size-12 lg:size-14 xl:size-16 object-contain drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" alt="" />
                      ) : (
                        <IconComponent className="size-7 xs:size-8 sm:size-10 md:size-11 lg:size-13 xl:size-15 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" />
                      )}
                    </div>

                    {/* Body: Título Completo Envolvente centrado */}
                    <div className="w-full text-center px-1">
                      <h3 className="text-[9.5px] xs:text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-black uppercase tracking-wide text-white leading-tight drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)] whitespace-normal break-words">
                        {item.title}
                      </h3>
                    </div>

                    {/* Ambient Soft Support Shadow */}
                    <div className="absolute -bottom-1 left-[8%] right-[8%] h-2 bg-black/25 blur-[4px] rounded-full pointer-events-none transition-all duration-300 group-hover:bg-black/35 group-hover:blur-[5px]" />
                  </div>
                );
              })}
          </div>
        </>
      )}

      {loading && (
        <div className="p-12 text-center">
          <Loader2
            className="animate-spin text-cyan-500 mx-auto mb-3"
            size={32}
          />
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
            Conectando con Supabase...
          </p>
        </div>
      )}

      {/* 3. VISTA WIDGET ACTIVA */}
      {!loading && (
        <div id="active-widget-container" className="space-y-6">
          {/* A. WIDGET: CREAR CUENTA DIRECTA (Carga Inmediata) */}
          {currentMenu === "crear_directo" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">
                      Crear Cuenta Directa
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Carga inmediata consumiendo tu balance de créditos.
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAutocompleteTestData}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                    >
                      ⚡ Autocompletar Datos de Testeo (Admin)
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleCreateDirectAccount}
                  className="space-y-4"
                >
                  {/* Nombre y Apellido */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      onBlur={(e) => setDirectName(capitalizeName(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Teléfono */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Celular / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej: +54911223344"
                        value={directCelular}
                        onChange={(e) => setDirectCelular(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                      />
                    </div>
                    {/* Dirección */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Dirección de Entrega *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Av. Rivadavia 1234"
                        value={directDireccion}
                        onChange={(e) => setDirectDireccion(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* 2 Botones para seleccionar Cuenta VIP o Cuenta Demo */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                      Tipo de Cuenta *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDirectType("DEMO");
                          const activeDemo = salePlans.filter(
                            (p) =>
                              !p.archived &&
                              p.name.toLowerCase().includes("demo"),
                          );
                          if (activeDemo.length > 0) {
                            setDirectPlanId(activeDemo[0].id);
                            setDirectPantallas(
                              Number(activeDemo[0].screens || 1),
                            );
                          }
                        }}
                        className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                          directType === "DEMO"
                            ? "bg-cyan-600 border-cyan-600 text-white shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Sparkles size={14} />
                        Cuenta Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDirectType("VIP");
                          // Seleccionar el primer plan VIP si existe
                          const slPls = (salePlans || []).filter(
                            (p: any) =>
                              !p.archived &&
                              !p.name.toLowerCase().includes("demo"),
                          );
                          if (slPls.length > 0) {
                            setDirectPlanId(slPls[0].id);
                            setDirectPantallas(slPls[0].screens || 1);
                          }
                        }}
                        className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                          directType === "VIP"
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Crown size={14} />
                        Cuenta VIP
                      </button>
                    </div>
                  </div>

                  {directType && (
                    <div className="space-y-4 animate-fade-in mt-4">
                      {/* Desplegable de Planes */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Seleccionar{" "}
                          {directType === "VIP" ? "Plan VIP" : "Paquete Demo"} *
                        </label>
                        <select
                          value={directPlanId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDirectPlanId(val);
                            const pl = salePlans.find((p) => p.id === val);
                            if (pl) {
                              setDirectPantallas(
                                Number(pl.screens_api || pl.screens || (directType === "VIP" ? 1 : 1)),
                              );
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                        >
                          {directType === "VIP"
                            ? salePlans
                                .filter(
                                  (p) =>
                                    !p.archived &&
                                    !p.name.toLowerCase().includes("demo"),
                                )
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} — Precio Minorista: ${p.price || 0} ARS
                                    ({p.months}m)
                                  </option>
                                ))
                            : salePlans
                                .filter(
                                  (p) =>
                                    !p.archived &&
                                    p.name.toLowerCase().includes("demo"),
                                )
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} — Precio Minorista: ${p.price || 0} ARS{" "}
                                    {p.hours
                                      ? `(${p.hours}h)`
                                      : p.months
                                        ? `(${p.months}m)`
                                        : ""}{" "}
                                    [Demo]
                                  </option>
                                ))}
                        </select>
                      </div>

                      {/* Cantidad de Pantallas */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          Pantallas Simultáneas Incluidas
                        </label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3">
                          <Tv size={16} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {directPantallas} Pantalla
                            {directPantallas > 1 ? "s" : ""} activa
                            {directPantallas > 1 ? "s" : ""} en simultáneo
                          </span>
                        </div>
                      </div>

                      {/* Cargar Imagen Comprobante */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Comprobante de Pago (Galería/Explorador){" "}
                          {(() => {
                            if (directType === "DEMO")
                              return "(Opcional para Demo)";
                            const selectedPlan = salePlans.find(
                              (plan) => plan.id === directPlanId,
                            );
                            const planPrice = selectedPlan
                              ? Number(selectedPlan.price || 0)
                              : 0;
                            return planPrice > 1 ? "*" : "(Opcional)";
                          })()}
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="relative overflow-hidden flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-colors text-xs font-bold min-h-[44px]">
                            <UploadCloud size={16} />
                            Seleccionar Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const loadingToast = toast.loading(
                                    "Optimizando y comprimiendo comprobante...",
                                  );
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const img = new Image();
                                      img.onload = () => {
                                        try {
                                          const canvas =
                                            document.createElement("canvas");
                                          const MAX_WIDTH = 800;
                                          const MAX_HEIGHT = 800;
                                          let width = img.width;
                                          let height = img.height;

                                          if (width > height) {
                                            if (width > MAX_WIDTH) {
                                              height = Math.round(
                                                (height * MAX_WIDTH) / width,
                                              );
                                              width = MAX_WIDTH;
                                            }
                                          } else {
                                            if (height > MAX_HEIGHT) {
                                              width = Math.round(
                                                (width * MAX_HEIGHT) / height,
                                              );
                                              height = MAX_HEIGHT;
                                            }
                                          }

                                          canvas.width = width;
                                          canvas.height = height;

                                          const ctx = canvas.getContext("2d");
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0, width, height);
                                            // Comprimir a JPEG con calidad 0.65: produce un base64 ultra-liviano (~40KB)
                                            const compressedBase64 =
                                              canvas.toDataURL("image/jpeg", 0.65);
                                            setDirectComprobante(compressedBase64);
                                            toast.dismiss(loadingToast);
                                            toast.success(
                                              "¡Captura optimizada correctamente de forma segura (~40 KB)!",
                                            );
                                          } else {
                                            setDirectComprobante(
                                              event.target?.result as string,
                                            );
                                            toast.dismiss(loadingToast);
                                            toast.success(
                                              "Cargado sin compresión.",
                                            );
                                          }
                                        } catch (canvasErr) {
                                          console.error(
                                            "Error al renderizar canvas:",
                                            canvasErr,
                                          );
                                          setDirectComprobante(
                                            event.target?.result as string,
                                          );
                                          toast.dismiss(loadingToast);
                                          toast.success("Comprobante cargado.");
                                        }
                                      };
                                      img.onerror = () => {
                                        // Fallback para móviles si no soporta renderizar imagen o es HEIC/HEIF
                                        setDirectComprobante(event.target?.result as string);
                                        toast.dismiss(loadingToast);
                                        toast.success(
                                          "Comprobante cargado en formato original.",
                                        );
                                      };
                                      img.src = event.target?.result as string;
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (err) {
                                    toast.dismiss(loadingToast);
                                    toast.error("Error al leer el archivo.");
                                  }
                                }
                              }}
                            />
                          </label>
                          {directComprobante && (
                            <div
                              className="relative group shrink-0 size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer"
                              onClick={() => setZoomImageUrl(directComprobante)}
                            >
                              <img
                                src={directComprobante}
                                alt="Preview"
                                className="size-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={12} className="text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notas */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          Notas Adicionales
                        </label>
                        <textarea
                          placeholder="Ej: Requiere canales de fútbol uruguayo..."
                          value={directNotes}
                          rows={2}
                          onChange={(e) => setDirectNotes(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-slate-800 text-sm"
                        />
                      </div>

                      {/* Notas Reseller */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                            Notas de Reseller (XC / Panel Físico) *
                          </label>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isResellerNotesEdited) {
                                  setIsResellerNotesEdited(false);
                                  const selectedPlan = salePlans.find(
                                    (p) => p.id === directPlanId,
                                  );
                                  const planName = selectedPlan
                                    ? selectedPlan.name
                                    : directType === "VIP"
                                      ? "Plan VIP"
                                      : "Demo Gratis";
                                  const clientName = directName.trim();
                                  const resellerUser = user?.email || "admin";
                                  setDirectResellerNotes(
                                    `[XTV]${clientName || "(Nombre)"} - ${planName} - ${resellerUser}`,
                                  );
                                  toast.info("🔄 Volviendo a cálculo automático");
                                } else {
                                  setIsResellerNotesEdited(true);
                                  toast.success("📝 Modo edición manual activado");
                                }
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                                isResellerNotesEdited
                                  ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {isResellerNotesEdited ? (
                                <>
                                  <RefreshCw
                                    size={10}
                                    className="animate-spin-slow"
                                  />
                                  Auto-Calcular
                                </>
                              ) : (
                                <>
                                  <Pencil size={10} />
                                  Editar Manualmente
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1 uppercase bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg">
                              <Lock size={10} />
                              En Vivo (Solo Lectura)
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ej: [XTV]Juan Pérez - Plan Familiar - vendedor@gmail.com"
                            value={directResellerNotes}
                            readOnly={!isAdmin || !isResellerNotesEdited}
                            onChange={(e) => {
                              setDirectResellerNotes(e.target.value);
                              setIsResellerNotesEdited(true);
                            }}
                            className={`w-full rounded-2xl px-4 py-3 focus:outline-none text-sm font-semibold transition-all ${
                              !isAdmin || !isResellerNotesEdited
                                ? "bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 ring-1 ring-slate-100 dark:ring-slate-900 cursor-not-allowed select-none"
                                : "bg-slate-50 dark:bg-slate-800/50 ring-2 ring-amber-500/50 dark:ring-amber-500/40 text-slate-800 dark:text-slate-100 focus:ring-amber-500"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {isAdmin
                            ? isResellerNotesEdited
                              ? "⚠️ Has editado la nota manualmente. No se sincronizará con los cambios del formulario hasta que vuelvas a presionar 'Auto-Calcular'."
                              : "Esta nota se guardará directamente en el panel XC físico de IPTV para identificar la cuenta."
                            : "Esta nota se genera dinámicamente según el cliente, plan y tu usuario vendedor."}
                        </p>
                      </div>

                      {/* Botón Guardar */}
                      <button
                        type="submit"
                        disabled={directSubmitting}
                        className="w-full py-4 bg-slate-900 text-white font-extrabold hover:bg-slate-800 rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {directSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Cargando Cuenta...
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            Crear Línea Directa (
                            {directType === "VIP"
                              ? `${salePlans.find((p) => p.id === directPlanId)?.tokens || 1} Créditos`
                              : "Demo Gratis"}
                            )
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* COLUMNA DERECHA: RESULTADO EN CASO DE LOGRARSE */}
              <div className="space-y-6">
                {directResult ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 right-0 p-4 shrink-0 text-emerald-500">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-emerald-800 dark:text-emerald-400 font-extrabold text-lg flex items-center gap-2">
                        🎉 ¡Cuenta Creada Exitosamente!
                      </h4>
                      <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">
                        Copia las credenciales abajo o mándalas directamente por
                        WhatsApp al cliente.
                      </p>
                    </div>

                    <div className="space-y-4 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-emerald-500/10">
                      <div className="space-y-2 border-b border-dashed border-slate-100 dark:border-slate-800 pb-3">
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Datos del Cliente
                        </p>
                        <p className="text-sm font-bold">
                          {directResult.nombre_completo}
                        </p>
                        {directResult.celular && (
                          <p className="text-xs text-slate-500">
                            Celular: {directResult.celular}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-mono">
                          Tipo: {directResult.tipo_cuenta || "VIP"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Vence:{" "}
                          {new Date(
                            directResult.fecha_vencimiento,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                            Usuario IPTV
                          </span>
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl">
                            <span className="font-mono text-xs font-bold text-cyan-600">
                              {directResult.username}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  directResult.username,
                                  "Usuario copiado",
                                )
                              }
                              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1 rounded-lg"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                            Contraseña IPTV
                          </span>
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl">
                            <span className="font-mono text-xs font-bold">
                              {directResult.password}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  directResult.password,
                                  "Contraseña copiada",
                                )
                              }
                              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1 rounded-lg"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                            Enlace M3U Playlist
                          </span>
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl gap-2">
                            <span className="font-mono text-[10px] truncate max-w-[200px]">
                              {directResult.m3u}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  directResult.m3u,
                                  "Playlist M3U copiado",
                                )
                              }
                              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1 rounded-lg shrink-0"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const wpMsg = `¡Hola ${directResult.nombre_completo}! Aquí tienes tus accesos listos para XTV:\n\n👤 Usuario: ${directResult.username}\n🔑 Contraseña: ${directResult.password}\n\nEnlace playlist M3U:\n${directResult.m3u}\n\n¡Que disfrutes el mejor servicio!`;
                          const url = `https://api.whatsapp.com/send?phone=${directResult.celular || ""}&text=${encodeURIComponent(wpMsg)}`;
                          window.open(url, "_blank");
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-700/20 min-h-[44px]"
                      >
                        <Send size={14} />
                        Enviar por WhatsApp
                      </button>

                      <button
                        onClick={() => {
                          const text = `Cliente: ${directResult.nombre_completo}\nUsuario: ${directResult.username}\nContraseña: ${directResult.password}\nM3U Link: ${directResult.m3u}`;
                          copyToClipboard(text, "Datos de cuenta copiados");
                        }}
                        className="py-3 px-4 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl min-h-[44px]"
                      >
                        Copiar Todo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 border border-dashed text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                      <Sparkles size={32} />
                    </div>
                    <h5 className="font-bold text-sm">Esperando Generación</h5>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Completa los campos obligatorios de la izquierda y
                      presiona el botón para emitir el alta inmediata en
                      XTV.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. WIDGET: SOLICITAR ACTIVACIÓN (Ticket de Soporte) */}
          {currentMenu === "solicitar_activacion" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Solicitar Activación
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Crea un ticket de soporte adjuntando comprobante de pago
                    para que un administrador te dé el alta.
                  </p>
                </div>
              </div>

              {correctingRequestId && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <div className="space-y-1">
                    <span className="font-extrabold block">
                      📝 Corrigiendo Solicitud Anterior
                    </span>
                    <div className="text-slate-600 dark:text-slate-300">
                      Estás editando la solicitud de alta del cliente{" "}
                      <strong>{directName}</strong>.
                      {(() => {
                        const originalReq = creditRequests.find(
                          (r: any) => r.id === correctingRequestId,
                        );
                        return originalReq?.detalles?.motivo_rechazo ? (
                          <div className="mt-1.5 bg-amber-100 dark:bg-amber-950/45 p-2 rounded-lg italic font-medium">
                            "Motivo del rechazo anterior:{" "}
                            {originalReq.detalles.motivo_rechazo}"
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCorrectingRequestId(null);
                      setDirectName("");
                      setDirectCelular("");
                      setDirectDireccion("");
                      setDirectNotes("");
                      setDirectUser("");
                      setDirectPass("");
                      setDirectComprobante(null);
                      toast.info(
                        "Corrección cancelada. Formulario reiniciado.",
                      );
                    }}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl font-bold tracking-tight transition-all shrink-0"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAutocompleteTestData}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                  >
                    ⚡ Autocompletar Datos de Testeo (Admin)
                  </button>
                </div>
              )}

              <form onSubmit={handleRequestActivation} className="space-y-4">
                {/* Nombre y Apellido */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Nombre y Apellido del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    onBlur={(e) => setDirectName(capitalizeName(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teléfono */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: +54911223344"
                      value={directCelular}
                      onChange={(e) => setDirectCelular(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                    />
                  </div>
                  {/* Dirección */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Dirección de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av. Rivadavia 1234"
                      value={directDireccion}
                      onChange={(e) => setDirectDireccion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                    />
                  </div>
                </div>

                {/* 2 Botones Tipo Cuenta */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                    Tipo de Cuenta Solicitada *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDirectType("DEMO");
                        const activeDemo = salePlans.filter(
                          (p) =>
                            !p.archived &&
                            p.name.toLowerCase().includes("demo"),
                        );
                        if (activeDemo.length > 0) {
                          setDirectPlanId(activeDemo[0].id);
                          setDirectPantallas(
                            Number(activeDemo[0].screens || 1),
                          );
                        }
                      }}
                      className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                        directType === "DEMO"
                          ? "bg-cyan-600 border-cyan-600 text-white shadow-sm"
                          : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Sparkles size={14} />
                      Cuenta Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDirectType("VIP");
                        const slPls = (salePlans || []).filter(
                          (p: any) =>
                            !p.archived &&
                            !p.name.toLowerCase().includes("demo"),
                        );
                        if (slPls.length > 0) {
                          setDirectPlanId(slPls[0].id);
                          setDirectPantallas(slPls[0].screens || 1);
                        }
                      }}
                      className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                        directType === "VIP"
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Crown size={14} />
                      Cuenta VIP
                    </button>
                  </div>
                </div>

                {directType && (
                  <div className="space-y-4 animate-fade-in mt-4">
                    {/* Desplegable de Planes */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                        Seleccionar{" "}
                        {directType === "VIP" ? "Plan VIP" : "Paquete Demo"} *
                      </label>
                      <select
                        value={directPlanId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDirectPlanId(val);
                          const pl = salePlans.find((p) => p.id === val);
                          if (pl) {
                            setDirectPantallas(
                              Number(pl.screens_api || pl.screens || (directType === "VIP" ? 1 : 1)),
                            );
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                      >
                        {directType === "VIP"
                          ? salePlans
                              .filter(
                                (p) =>
                                  !p.archived &&
                                  !p.name.toLowerCase().includes("demo"),
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — Costo: ${p.price || 0} ARS ({p.months}
                                  m)
                                </option>
                              ))
                          : salePlans
                              .filter(
                                (p) =>
                                  !p.archived &&
                                  p.name.toLowerCase().includes("demo"),
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — Costo: ${p.price || 0} ARS ({p.months}
                                  m) [Demo]
                                </option>
                              ))}
                      </select>
                    </div>

                    {/* Cantidad de Pantallas */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Pantallas Simultáneas Incluidas
                      </label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3">
                        <Tv size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {directPantallas} Pantalla{directPantallas > 1 ? "s" : ""}{" "}
                          activa{directPantallas > 1 ? "s" : ""} en simultáneo
                        </span>
                      </div>
                    </div>

                    {/* Cargar Foto de Comprobante */}
                    {(() => {
                      const isReqComprobante = (() => {
                        if (directType === "DEMO") return false;
                        const selectedPlan = salePlans.find(
                          (plan) => plan.id === directPlanId,
                        );
                        const planPrice = selectedPlan
                          ? Number(selectedPlan.price || 0)
                          : 0;
                        return planPrice > 1;
                      })();

                      return (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                            Adjuntar Foto del Comprobante{" "}
                            {isReqComprobante
                              ? "(Obligatorio) *"
                              : "(Opcional para Demo/Gratis)"}
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="relative overflow-hidden flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition-colors text-xs font-bold min-h-[44px]">
                              <UploadCloud size={16} />
                              Seleccionar Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const loadingToast = toast.loading(
                                      "Optimizando y comprimiendo comprobante...",
                                    );
                                    try {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new Image();
                                        img.onload = () => {
                                          try {
                                            const canvas =
                                              document.createElement("canvas");
                                            const MAX_WIDTH = 800;
                                            const MAX_HEIGHT = 800;
                                            let width = img.width;
                                            let height = img.height;

                                            if (width > height) {
                                              if (width > MAX_WIDTH) {
                                                height = Math.round(
                                                  (height * MAX_WIDTH) / width,
                                                );
                                                width = MAX_WIDTH;
                                              }
                                            } else {
                                              if (height > MAX_HEIGHT) {
                                                width = Math.round(
                                                  (width * MAX_HEIGHT) / height,
                                                );
                                                height = MAX_HEIGHT;
                                              }
                                            }

                                            canvas.width = width;
                                            canvas.height = height;

                                            const ctx = canvas.getContext("2d");
                                            if (ctx) {
                                              ctx.drawImage(
                                                img,
                                                0,
                                                0,
                                                width,
                                                height,
                                              );
                                              // Comprimir a JPEG con calidad 0.65: produce un base64 ultra-liviano (~40KB)
                                              const compressedBase64 =
                                                canvas.toDataURL(
                                                  "image/jpeg",
                                                  0.65,
                                                );
                                              setDirectComprobante(
                                                compressedBase64,
                                              );
                                              toast.dismiss(loadingToast);
                                              toast.success(
                                                "¡Captura optimizada correctamente de forma segura (~40 KB)!",
                                              );
                                            } else {
                                              setDirectComprobante(
                                                event.target?.result as string,
                                              );
                                              toast.dismiss(loadingToast);
                                              toast.success(
                                                "Cargado sin compresión.",
                                              );
                                            }
                                          } catch (canvasErr) {
                                            console.error(
                                              "Error al renderizar canvas:",
                                              canvasErr,
                                            );
                                            setDirectComprobante(
                                              event.target?.result as string,
                                            );
                                            toast.dismiss(loadingToast);
                                            toast.success("Comprobante cargado.");
                                          }
                                        };
                                        img.onerror = () => {
                                          setDirectComprobante(event.target?.result as string);
                                          toast.dismiss(loadingToast);
                                          toast.success(
                                            "Comprobante cargado en formato original.",
                                          );
                                        };
                                        img.src = event.target?.result as string;
                                      };
                                      reader.readAsDataURL(file);
                                    } catch (err) {
                                      toast.dismiss(loadingToast);
                                      toast.error("Error al leer el archivo.");
                                    }
                                  }
                                }}
                              />
                            </label>
                            {directComprobante && (
                              <div
                                className="relative group shrink-0 size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer"
                                onClick={() => setZoomImageUrl(directComprobante)}
                              >
                                <img
                                  src={directComprobante}
                                  alt="Preview"
                                  className="size-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 size={12} className="text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Notas Reseller */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                          Notas de Reseller (XC / Panel Físico) *
                        </label>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isResellerNotesEdited) {
                                setIsResellerNotesEdited(false);
                                const selectedPlan = salePlans.find(
                                  (p) => p.id === directPlanId,
                                );
                                const planName = selectedPlan
                                  ? selectedPlan.name
                                  : directType === "VIP"
                                    ? "Plan VIP"
                                    : "Demo Gratis";
                                const clientName = directName.trim();
                                const resellerUser = user?.email || "admin";
                                setDirectResellerNotes(
                                  `[XTV]${clientName || "(Nombre)"} - ${planName} - ${resellerUser}`,
                                );
                                toast.info("🔄 Volviendo a cálculo automático");
                              } else {
                                setIsResellerNotesEdited(true);
                                toast.success("📝 Modo edición manual activado");
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                              isResellerNotesEdited
                                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            {isResellerNotesEdited ? (
                              <>
                                <RefreshCw
                                  size={10}
                                  className="animate-spin-slow"
                                />
                                Auto-Calcular
                              </>
                            ) : (
                              <>
                                <Pencil size={10} />
                                Editar Manualmente
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1 uppercase bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg">
                            <Lock size={10} />
                            En Vivo (Solo Lectura)
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ej: [XTV]Juan Pérez - Plan Familiar - vendedor@gmail.com"
                          value={directResellerNotes}
                          readOnly={!isAdmin || !isResellerNotesEdited}
                          onChange={(e) => {
                            setDirectResellerNotes(e.target.value);
                            setIsResellerNotesEdited(true);
                          }}
                          className={`w-full rounded-2xl px-4 py-3 focus:outline-none text-sm font-semibold transition-all ${
                            !isAdmin || !isResellerNotesEdited
                              ? "bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 ring-1 ring-slate-100 dark:ring-slate-900 cursor-not-allowed select-none"
                              : "bg-slate-50 dark:bg-slate-800/50 ring-2 ring-amber-500/50 dark:ring-amber-500/40 text-slate-800 dark:text-slate-100 focus:ring-amber-500"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        {isAdmin
                          ? isResellerNotesEdited
                            ? "⚠️ Has editado la nota manualmente. No se sincronizará con los cambios del formulario hasta que vuelvas a presionar 'Auto-Calcular'."
                            : "Esta nota se enviará al panel físico XC cuando el administrador apruebe tu solicitud."
                          : "Esta nota se genera dinámediamente según el cliente, plan y tu usuario vendedor."}
                      </p>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Notas o Mensaje al Soporte
                      </label>
                      <textarea
                        placeholder="Agrega comentarios o detalles sobre tu pago..."
                        value={directNotes}
                        rows={2}
                        onChange={(e) => setDirectNotes(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-slate-800 text-sm"
                      />
                    </div>

                    {/* Botón Solicitar */}
                    <button
                      type="submit"
                      disabled={directSubmitting}
                      className="w-full py-4 bg-amber-600 text-white font-extrabold hover:bg-amber-700 rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {directSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Enviando Solicitud...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Enviar Solicitud de Activación
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* C. WIDGET: RENOVAR MEMBRESÍA / REPORTE COMPLETO */}
          {currentMenu === "renovaciones" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Vigencias, Expiración and Renovaciones
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Busca, analiza el historial de compras y reactiva fácilmente
                    las cuentas de tus clientes.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl focus:outline-none ring-1 ring-slate-200 border-none"
                  />
                </div>
              </div>

              {/* TABLA DE CLIENTES VIP */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider border-b">
                      <th className="p-4">Nombre de Cliente</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Teléfono</th>
                      <th className="p-4">Fecha de Vencimiento</th>
                      <th className="p-4">Plan Minorista Adquirido</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      // Filtrar para mostrar sólo cuentas VIP (comerciales, no demos)
                      const canSeeAll = hasPermission('Iptv.Renovaciones.VerTodos') || isAdmin;
                      const canSeePropios = hasPermission('Iptv.Renovaciones.VerPropios');

                      const vipClients = accounts.filter(
                        (acc: any) => {
                          const isVip = acc.tipo_cuenta === "VIP" || !!acc.id_plan_venta;
                          if (!isVip) return false;

                          if (canSeeAll) return true;
                          if (canSeePropios) {
                            return (acc.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                          }
                          // Si no tiene ninguno configurado, mostramos propios por seguridad
                          return (acc.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                        }
                      );
                      const filteredVip = vipClients.filter((acc: any) => {
                        const term = searchTerm.toLowerCase().trim();
                        return (
                          (acc.nombre_completo || "")
                            .toLowerCase()
                            .includes(term) ||
                          (acc.username || "").toLowerCase().includes(term) ||
                          (acc.celular || "").toLowerCase().includes(term)
                        );
                      });

                      if (filteredVip.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-8 text-center text-slate-400"
                            >
                              No se encontraron clientes VIP activos.
                            </td>
                          </tr>
                        );
                      }

                      return filteredVip.map((acc: any) => {
                        const isExpired =
                          acc.fecha_vencimiento &&
                          new Date(acc.fecha_vencimiento) < new Date();
                        const assignedPlan = salePlans.find(
                          (p: any) => p.id === acc.id_plan_venta,
                        );
                        const planName = assignedPlan
                          ? assignedPlan.name
                          : "Plan Estándar VIP";
                        const hasDirectPrivilege =
                          hasPermission("Iptv.CrearDirecto.Acceder") || isAdmin;

                        return (
                          <tr
                            key={acc.username}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedClientForDetails(acc);
                              setRequestRenewClient(acc);
                              setRenewStep("details");
                              setSelectedPlanForRenew(null);
                              setRequestRenewComprobante(null);
                              setRequestRenewComments("");
                              setRequestRenewPlanId(acc.id_plan_venta || "");
                            }}
                          >
                            {/* Nombre del Cliente */}
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              {acc.nombre_completo || "Cliente VIP"}
                            </td>

                            {/* Usuario */}
                            <td className="p-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              {acc.username}
                            </td>

                            {/* Teléfono */}
                            <td
                              className="p-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {acc.celular ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {acc.celular}
                                  </span>
                                  <a
                                    href={`https://wa.me/${acc.celular.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded hover:scale-105 transition-transform"
                                    title="Enviar WhatsApp directo"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            {/* Fecha de Vencimiento */}
                            <td className="p-4">
                              {acc.fecha_vencimiento ? (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-semibold ${isExpired ? "text-red-500 font-bold" : "text-slate-700 dark:text-slate-300"}`}
                                  >
                                    {new Date(
                                      acc.fecha_vencimiento,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span
                                    className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-emerald-500"}`}
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-400">
                                  Sin Fecha
                                </span>
                              )}
                            </td>

                            {/* Plan Adquirido */}
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                                {planName}
                              </span>
                            </td>

                            {/* Botones de Acción */}
                            <td
                              className="p-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-2">
                                {/* Botón Editar */}
                                <button
                                  onClick={() => startEditingClient(acc)}
                                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 font-bold border border-slate-200 dark:border-slate-700/60 transition-all hover:scale-[1.02]"
                                  title="Editar todos los datos del cliente"
                                >
                                  <Pencil size={12} />
                                  <span>Editar</span>
                                </button>

                                {/* Botón Eliminar */}
                                <button
                                  onClick={() => handleDeleteClients([acc.username])}
                                  className="px-2.5 py-1.5 bg-red-50/50 hover:bg-red-500 hover:text-white dark:bg-red-950/20 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1 font-bold border border-red-200/50 dark:border-red-900/30 transition-all hover:scale-[1.02]"
                                  title="Eliminar cliente"
                                >
                                  <Trash2 size={12} />
                                  <span>Eliminar</span>
                                </button>

                                {/* Botón Enviar Solicitud */}
                                <button
                                  onClick={() => {
                                    const isOwnClient = (acc.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                                    const canRenewThisClient = isAdmin || 
                                      hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
                                      (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);
                                    if (!canRenewThisClient) {
                                      toast.warning("No tienes permiso para renovar o solicitar la renovación de este cliente.");
                                      return;
                                    }
                                    setSelectedClientForDetails(acc);
                                    setRequestRenewClient(acc);
                                    setRenewStep("details");
                                    setSelectedPlanForRenew(null);
                                    setRequestRenewComprobante(null);
                                    setRequestRenewComments("");
                                    setRequestRenewPlanId(
                                      acc.id_plan_venta || "",
                                    );
                                  }}
                                  className={`px-2.5 py-1.5 text-white rounded-lg flex items-center gap-1 font-bold transition-all hover:scale-[1.02] shadow-sm ${
                                    (() => {
                                      const isOwnClient = (acc.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                                      const canRenewThisClient = isAdmin || 
                                        hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
                                        (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);
                                      if (!canRenewThisClient) return "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50";
                                      return hasDirectPrivilege ? "bg-indigo-600 hover:bg-indigo-500" : "bg-amber-600 hover:bg-amber-500";
                                    })()
                                  }`}
                                  title={
                                    hasDirectPrivilege
                                      ? "Renovación Directa Inmediata"
                                      : "Enviar Solicitud de Renovación"
                                  }
                                >
                                  {hasDirectPrivilege ? (
                                    <>
                                      <Zap size={12} />
                                      <span>Renovar Directo</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send size={12} />
                                      <span>Solicitar Renovación</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* POPUP MODAL DETALLADO CON HISTORIAL Y CONTROL DE VENTAS */}
              {selectedClientForDetails &&
                (() => {
                  const acc = selectedClientForDetails;
                  const isExpired =
                    acc.fecha_vencimiento &&
                    new Date(acc.fecha_vencimiento) < new Date();

                  // Generación / Extracción del historial de ventas real (sin simulación ni valores ficticios)
                  const salesHistory = (() => {
                    const realSales = (acc.bitacora_comentarios || [])
                      .filter(
                        (b: any) =>
                          b.tipo === "venta" ||
                          b.comentario?.toLowerCase().includes("plan") ||
                          b.comentario?.toLowerCase().includes("membresía") ||
                          b.comentario?.toLowerCase().includes("renovación") ||
                          b.comentario?.toLowerCase().includes("reactivación"),
                      )
                      .map((b: any) => ({
                        fecha: b.fecha,
                        plan: b.plan_name || "Plan de Venta Estándar",
                        monto: b.monto || 0,
                        vendedor: b.vendedor || b.autor || "admin",
                        pantallas: b.pantallas || acc.limite_pantallas || 2,
                        real: true,
                      }));

                    return realSales.reverse();
                  })();

                  const selectablePlans = salePlans.filter(
                    (p: any) => !p.name.toLowerCase().includes("demo"),
                  );
                  const planToUse =
                    selectedPlanForRenew ||
                    salePlans.find((p: any) => p.id === acc.id_plan_venta) ||
                    selectablePlans[0];
                  const isDemoClient =
                    acc.tipo_cuenta === "DEMO" ||
                    acc.is_demo ||
                    (acc.username && acc.username.toLowerCase().startsWith("demo"));
                  const hasDirectPrivilege =
                    hasPermission("Iptv.CrearDirecto.Acceder") || isAdmin;

                  return (
                    <>
                      {/* 1. POPUP MODAL DETALLADO: FICHA DE CLIENTE */}
                      <div
                        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
                        onClick={() => setSelectedClientForDetails(null)}
                      >
                        <div
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-5xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative scrollbar-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Botón Cerrar */}
                          <button
                            onClick={() => setSelectedClientForDetails(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>

                          {/* Título de la Ficha del Cliente */}
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                              Ficha de Cliente
                            </span>
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                              {acc.nombre_completo || "Cliente VIP"}
                            </h3>
                            <div className="text-xs text-slate-500 mt-1 space-y-1">
                              <p className="font-semibold">
                                Último Plan Adquirido:{" "}
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                  {salePlans.find((p: any) => p.id === acc.id_plan_venta)?.name || "Plan de Venta Estándar"}
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-600 dark:text-slate-400">
                                <p className="flex items-center gap-1">
                                  <span>📍 Dirección:</span>{" "}
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {acc.direccion_actual || "No registrada"}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <span>📞 Teléfono:</span>{" "}
                                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                                    {acc.celular || "No registrado"}
                                  </span>
                                  {acc.celular && (
                                    <a
                                      href={`https://wa.me/${acc.celular.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm hover:scale-105"
                                    >
                                      <MessageSquare size={11} />
                                      <span>Chat WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BENTO GRID DE DETALLES */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* COLUMNA IZQUIERDA: CREDENCIALES Y DATOS DEL VENDEDOR */}
                            <div className="lg:col-span-7 space-y-6">
                              {/* Cuadro 1: Credenciales del Cliente y Datos de Conexión */}
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                                      🔑 Credenciales y Conexión
                                    </h4>
                                    {(acc.panel_client_id || acc.xui_id || acc.id_linea) && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold rounded-lg">
                                        ID XC: #{acc.panel_client_id || acc.xui_id || acc.id_linea}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const xuiUrl =
                                        systemConfig?.xc_url_completa ||
                                        systemConfig?.xui_url ||
                                        "http://vip-xtv.pro:8080";
                                      const m3uUrl = acc.playlist_url || `${xuiUrl}/get.php?username=${acc.username}&password=${acc.password}&output=ts`;
                                      const textToCopy = `👤 Usuario IPTV: ${acc.username}\n🔑 Contraseña IPTV: ${acc.password}\n🌐 Playlist M3U8: ${m3uUrl}${acc.panel_client_id ? `\n🆔 ID Línea: ${acc.panel_client_id}` : ""}`;
                                      copyToClipboard(
                                        textToCopy,
                                        "¡Credenciales completas copiadas!",
                                      );
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm hover:scale-[1.01] active:scale-95 flex-shrink-0"
                                  >
                                    <Copy size={12} />
                                    <span>Copiar Todo</span>
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-dashed border-slate-200 dark:border-slate-850">
                                  <div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                                      Usuario IPTV
                                    </span>
                                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border px-3 py-2 rounded-xl">
                                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                                        {acc.username}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            acc.username,
                                            "Usuario copiado",
                                          )
                                        }
                                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
                                      >
                                        <Copy size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                                      Contraseña IPTV
                                    </span>
                                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border px-3 py-2 rounded-xl">
                                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {acc.password}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            acc.password,
                                            "Contraseña copiada",
                                          )
                                        }
                                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
                                      >
                                        <Copy size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                                      Enlace Playlist M3U8
                                    </span>
                                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border px-3 py-2 rounded-xl">
                                      <span className="font-mono text-[10px] truncate max-w-[280px]">
                                        {(() => {
                                          if (acc.playlist_url) return acc.playlist_url;
                                          const xuiUrl =
                                            systemConfig?.xc_url_completa ||
                                            systemConfig?.xui_url ||
                                            "http://vip-xtv.pro:8080";
                                          return `${xuiUrl}/get.php?username=${acc.username}&password=${acc.password}&output=ts`;
                                        })()}
                                      </span>
                                      <button
                                        onClick={() => {
                                          const xuiUrl =
                                            systemConfig?.xc_url_completa ||
                                            systemConfig?.xui_url ||
                                            "http://vip-xtv.pro:8080";
                                          const m3uUrl = acc.playlist_url || `${xuiUrl}/get.php?username=${acc.username}&password=${acc.password}&output=ts`;
                                          copyToClipboard(
                                            m3uUrl,
                                            "Enlace M3U8 copiado",
                                          );
                                        }}
                                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
                                      >
                                        <Copy size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Parámetros Técnicos del Panel XC */}
                                  {(acc.panel_client_id || acc.access_token || acc.member_id || acc.package_id) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 pb-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                                      {acc.panel_client_id && (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                                          <span className="text-[8px] uppercase font-black text-slate-400 block">ID Cliente XC</span>
                                          <div className="flex items-center justify-between gap-1 mt-0.5">
                                            <span className="font-mono text-xs font-extrabold text-cyan-600 dark:text-cyan-400 truncate">#{acc.panel_client_id}</span>
                                            <button onClick={() => copyToClipboard(acc.panel_client_id, "ID de Cliente copiado")} className="text-slate-400 hover:text-cyan-500 p-0.5"><Copy size={10} /></button>
                                          </div>
                                        </div>
                                      )}
                                      {acc.member_id && (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                                          <span className="text-[8px] uppercase font-black text-slate-400 block">Member ID</span>
                                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">{acc.member_id}</span>
                                        </div>
                                      )}
                                      {acc.package_id && (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                                          <span className="text-[8px] uppercase font-black text-slate-400 block">Package ID</span>
                                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">{acc.package_id}</span>
                                        </div>
                                      )}
                                      {acc.access_token && (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                                          <span className="text-[8px] uppercase font-black text-slate-400 block">Access Token</span>
                                          <div className="flex items-center justify-between gap-1 mt-0.5">
                                            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[55px]">{acc.access_token}</span>
                                            <button onClick={() => copyToClipboard(acc.access_token, "Access Token copiado")} className="text-slate-400 hover:text-cyan-500 p-0.5"><Copy size={10} /></button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-slate-400">
                                        Último Plan Adquirido
                                      </span>
                                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                        {salePlans.find((p: any) => p.id === acc.id_plan_venta)?.name || "Plan de Venta Estándar"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-slate-400">
                                        Fecha Vencimiento Plan
                                      </span>
                                      <p
                                        className={`font-bold text-xs ${isExpired ? "text-red-500" : "text-emerald-500"}`}
                                      >
                                        {acc.fecha_vencimiento
                                          ? new Date(
                                              acc.fecha_vencimiento,
                                            ).toLocaleString()
                                          : "Sin Fecha"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Cuadro 2: Datos de Vendedor y Activación */}
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                                <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                                  👤 Datos de Soporte y Activación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Vendedor que registró */}
                                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                      Vendedor que registró al cliente
                                    </span>
                                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                                      {(() => {
                                        const sellerProfile = panelUsers?.find(
                                          (u: any) =>
                                            (u.email && u.email.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                            (u.usuario && u.usuario.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                            (u.nombre_personal && u.nombre_personal.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                            (u.nombre && u.nombre.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase())
                                        );
                                        return (
                                          sellerProfile?.nombre_personal ||
                                          sellerProfile?.nombre ||
                                          sellerProfile?.nombre_completo ||
                                          acc.creado_por ||
                                          "Sistema"
                                        );
                                      })()}
                                    </p>
                                    {(() => {
                                      const sellerProfile = panelUsers?.find(
                                        (u: any) =>
                                          (u.email && u.email.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                          (u.usuario && u.usuario.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                          (u.nombre_personal && u.nombre_personal.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase()) ||
                                          (u.nombre && u.nombre.trim().toLowerCase() === acc.creado_por?.trim().toLowerCase())
                                      );
                                      const sellerPhone =
                                        sellerProfile?.telefono_contacto ||
                                        sellerProfile?.celular ||
                                        sellerProfile?.telefono_negocio ||
                                        "";
                                      return (
                                        sellerPhone && (
                                          <div className="flex items-center gap-2 pt-1">
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              Tel: {sellerPhone}
                                            </span>
                                            <a
                                              href={`https://wa.me/${sellerPhone.replace(/\D/g, "")}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-md transition-all shadow-sm"
                                            >
                                              <MessageSquare size={10} />
                                              <span>Chat</span>
                                            </a>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>

                                  {/* Usuario que activó la línea */}
                                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                      Usuario que activó la línea
                                    </span>
                                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                                      {(() => {
                                        const lastSale = salesHistory[0];
                                        const activatorEmail =
                                          lastSale?.vendedor ||
                                          acc.creado_por ||
                                          "admin";
                                        const activatorProfile = panelUsers?.find(
                                          (u: any) =>
                                            (u.email && u.email.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                            (u.usuario && u.usuario.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                            (u.nombre_personal && u.nombre_personal.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                            (u.nombre && u.nombre.trim().toLowerCase() === activatorEmail?.trim().toLowerCase())
                                        );
                                        return (
                                          activatorProfile?.nombre_personal ||
                                          activatorProfile?.nombre ||
                                          activatorProfile?.nombre_completo ||
                                          activatorEmail ||
                                          "Sistema"
                                        );
                                      })()}
                                    </p>
                                    {(() => {
                                      const lastSale = salesHistory[0];
                                      const activatorEmail =
                                        lastSale?.vendedor ||
                                        acc.creado_por ||
                                        "admin";
                                      const activatorProfile = panelUsers?.find(
                                        (u: any) =>
                                          (u.email && u.email.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                          (u.usuario && u.usuario.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                          (u.nombre_personal && u.nombre_personal.trim().toLowerCase() === activatorEmail?.trim().toLowerCase()) ||
                                          (u.nombre && u.nombre.trim().toLowerCase() === activatorEmail?.trim().toLowerCase())
                                      );
                                      const activatorPhone =
                                        activatorProfile?.telefono_contacto ||
                                        activatorProfile?.celular ||
                                        activatorProfile?.telefono_negocio ||
                                        "";
                                      return (
                                        activatorPhone && (
                                          <div className="flex items-center gap-2 pt-1">
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              Tel: {activatorPhone}
                                            </span>
                                            <a
                                              href={`https://wa.me/${activatorPhone.replace(/\D/g, "")}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-md transition-all shadow-sm"
                                            >
                                              <MessageSquare size={10} />
                                              <span>Chat</span>
                                            </a>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COLUMNA DERECHA: PROCESAR RENOVACIÓN */}
                            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                              <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center justify-between">
                                <span>🔄 Procesar Renovación</span>
                                {isDemoClient && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                                    No Renovable (Demo)
                                  </span>
                                )}
                              </h4>

                              {isDemoClient ? (
                                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4 my-auto">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                                    <AlertTriangle size={24} />
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                                      Línea de Demostración (Demo)
                                    </h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                      Las cuentas Demo son pruebas temporales y <strong>no se pueden extender ni renovar</strong>. Para continuar el servicio de este cliente, dirígete a <strong>Crear Cuenta</strong> y genera una nueva membresía VIP.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const clientName = acc.nombre_completo || "";
                                      const clientPhone = acc.celular || "";
                                      setSelectedClientForDetails(null);
                                      setCurrentMenu("crear_cuenta");
                                      setDirectName(clientName);
                                      setDirectCelular(clientPhone);
                                    }}
                                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <PlusCircle size={15} />
                                    <span>Crear Nueva Línea VIP para Cliente</span>
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Selector de Plan */}
                                  <div className="space-y-1 relative">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Seleccionar Plan Minorista
                                </label>
                                
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setRenewDropdownOpen(!renewDropdownOpen)}
                                    className="w-full bg-white dark:bg-slate-900 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 font-semibold text-slate-800 dark:text-slate-100 shadow-sm flex items-center justify-between transition-all"
                                  >
                                    <span>
                                      {planToUse?.name || "Selecciona un plan"}
                                    </span>
                                    <ChevronDown
                                      size={16}
                                      className={`text-slate-500 dark:text-slate-100 transition-transform duration-200 ${
                                        renewDropdownOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>

                                  {/* Listado de Opciones del Dropdown */}
                                  {renewDropdownOpen && (
                                    <>
                                      {/* Backdrop invisible para cerrar al hacer clic afuera */}
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setRenewDropdownOpen(false)}
                                      />
                                      
                                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 py-1">
                                        {selectablePlans.map((p: any) => {
                                          const isSelected = p.id === planToUse?.id;
                                          return (
                                            <button
                                              key={p.id}
                                              type="button"
                                              onClick={() => {
                                                setSelectedPlanForRenew(p);
                                                setRequestRenewPlanId(p.id);
                                                setRenewCustomPrice(p.price || p.price_public || 0);
                                                setRenewCustomScreens(p.screens || 2);
                                                setRenewDropdownOpen(false);
                                              }}
                                              className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                                                isSelected
                                                  ? "bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-white"
                                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                              }`}
                                            >
                                              <span>{p.name}</span>
                                              <span className="text-[10px] text-slate-500 dark:text-slate-100 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                ${p.price || 0}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Campos Auto-Asignados de Precio y Pantallas (Informativos, no editables) */}
                              <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                                    Precio Público ($)
                                  </label>
                                  <div className="w-full bg-slate-100/40 dark:bg-slate-950/40 text-xs rounded-xl p-2.5 ring-1 ring-slate-200/50 dark:ring-slate-800/50 font-bold text-slate-700 dark:text-slate-300 shadow-inner min-h-[38px] flex items-center">
                                    $ {renewCustomPrice !== undefined ? renewCustomPrice : planToUse?.price || 0}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                                    Pantallas
                                  </label>
                                  <div className="w-full bg-slate-100/40 dark:bg-slate-950/40 text-xs rounded-xl p-2.5 ring-1 ring-slate-200/50 dark:ring-slate-800/50 font-bold text-slate-700 dark:text-slate-300 shadow-inner min-h-[38px] flex items-center">
                                    {renewCustomScreens !== undefined ? renewCustomScreens : planToUse?.screens || 2}
                                  </div>
                                </div>
                              </div>

                              {/* Botón para Comprobante de Pago */}
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                                  📸 Comprobante de Pago (Requerido para renovar) *
                                </label>
                                <div className="flex items-center gap-3">
                                  <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl p-3.5 cursor-pointer hover:bg-slate-150/10 transition-all text-center bg-white dark:bg-slate-900 shadow-sm">
                                    <UploadCloud
                                      size={20}
                                      className="text-slate-400"
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 mt-1">
                                      {requestRenewComprobante
                                        ? "📸 Comprobante Listo"
                                        : "Subir Comprobante"}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const loadingToast = toast.loading(
                                            "Comprimiendo comprobante...",
                                          );
                                          try {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const img = new Image();
                                              img.onload = () => {
                                                try {
                                                  const canvas =
                                                    document.createElement(
                                                      "canvas",
                                                    );
                                                  const MAX_WIDTH = 800;
                                                  const MAX_HEIGHT = 800;
                                                  let width = img.width;
                                                  let height = img.height;

                                                  if (width > height) {
                                                    if (width > MAX_WIDTH) {
                                                      height = Math.round(
                                                        (height * MAX_WIDTH) /
                                                          width,
                                                      );
                                                      width = MAX_WIDTH;
                                                    }
                                                  } else {
                                                    if (height > MAX_HEIGHT) {
                                                      width = Math.round(
                                                        (width * MAX_HEIGHT) /
                                                          height,
                                                      );
                                                      height = MAX_HEIGHT;
                                                    }
                                                  }

                                                  canvas.width = width;
                                                  canvas.height = height;
                                                  const ctx =
                                                    canvas.getContext("2d");
                                                  ctx?.drawImage(
                                                    img,
                                                    0,
                                                    0,
                                                    width,
                                                    height,
                                                  );
                                                  const compressedBase64 =
                                                    canvas.toDataURL(
                                                      "image/jpeg",
                                                      0.7,
                                                    );

                                                  setRequestRenewComprobante(
                                                    compressedBase64,
                                                  );
                                                  toast.dismiss(loadingToast);
                                                  toast.success(
                                                    "Comprobante optimizado",
                                                  );
                                                } catch (err: any) {
                                                  toast.dismiss(loadingToast);
                                                  toast.error(
                                                    "Error al comprimir",
                                                  );
                                                }
                                              };
                                              img.onerror = () => {
                                                // Fallback para móviles si no soporta renderizar imagen o es HEIC/HEIF
                                                setRequestRenewComprobante(event.target?.result as string);
                                                toast.dismiss(loadingToast);
                                                toast.success(
                                                  "Comprobante cargado en formato original.",
                                                );
                                              };
                                              img.src = event.target
                                                ?.result as string;
                                            };
                                            reader.readAsDataURL(file);
                                          } catch (err: any) {
                                            toast.dismiss(loadingToast);
                                            toast.error("Error al leer archivo");
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                  {requestRenewComprobante && (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner flex-shrink-0">
                                      <img
                                        src={requestRenewComprobante}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Comentarios */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Comentarios / Notas Internas
                                </label>
                                <textarea
                                  placeholder="Ej: Transferencia por Ruth"
                                  value={requestRenewComments}
                                  onChange={(e) =>
                                    setRequestRenewComments(e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-slate-900 text-xs rounded-xl p-2.5 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none h-12 resize-none font-semibold text-slate-800 dark:text-slate-100 shadow-sm"
                                />
                              </div>

                              {/* Resumen del Plan */}
                              <div className="bg-slate-950 text-slate-300 p-3.5 rounded-2xl text-[11px] space-y-1.5 border border-slate-850">
                                <div className="flex justify-between">
                                  <span>Plan:</span>
                                  <strong className="text-white">
                                    {planToUse?.name}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Nueva Vigencia:</span>
                                  <strong className="text-emerald-400 font-bold">
                                    +{planToUse?.duration || 30} Días
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Costo Créditos:</span>
                                  <strong className="text-amber-400 font-bold">
                                    {planToUse?.tokens || 1} VIP
                                  </strong>
                                </div>
                                <div className="flex justify-between border-t border-slate-850 pt-1.5 font-bold">
                                  <span className="text-slate-200">
                                    Monto Registrado:
                                  </span>
                                  <span className="text-emerald-400 text-xs font-black">
                                    $
                                    {renewCustomPrice !== undefined
                                      ? renewCustomPrice
                                      : planToUse?.price || 0}
                                  </span>
                                </div>
                              </div>

                              {/* BOTONES DE ACCIÓN: CONFIRMAR (DIRECTA) & SOLICITAR RENOVACIÓN */}
                              {(() => {
                                const isOwnClient = (selectedClientForDetails?.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                                const canRenewThisClient = isAdmin || 
                                  hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
                                  (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);
                                return (
                                  <div className="space-y-2 pt-2">
                                    {/* Botón 1: Confirmar (Directo) */}
                                    <div className="space-y-1">
                                      <button
                                        onClick={handleConfirmRenewal}
                                        disabled={
                                          !hasDirectPrivilege ||
                                          !canRenewThisClient ||
                                          renewIsSubmitting
                                        }
                                        className={`w-full py-3 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                                          hasDirectPrivilege && canRenewThisClient
                                            ? "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-95 text-white"
                                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-100 cursor-not-allowed opacity-50"
                                        }`}
                                      >
                                        {renewIsSubmitting ? (
                                          <>
                                            <Loader2
                                              className="animate-spin"
                                              size={14}
                                            />
                                            <span>Procesando Directo...</span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 size={14} />
                                            <span>
                                              Confirmar Activación Directa
                                            </span>
                                          </>
                                        )}
                                      </button>
                                      {!hasDirectPrivilege && (
                                        <p className="text-[9px] text-slate-400 text-center leading-normal">
                                          ⚠️ Botón inhabilitado: No tienes permisos
                                          para activar líneas directamente sin
                                          autorización.
                                        </p>
                                      )}
                                      {!canRenewThisClient && (
                                        <p className="text-[9px] text-red-500 text-center leading-normal font-bold">
                                          ⚠️ No tienes permisos de renovación para este cliente.
                                        </p>
                                      )}
                                    </div>

                                    {/* Botón 2: Solicitar Renovación */}
                                    <button
                                      onClick={async () => {
                                        if (!canRenewThisClient) {
                                          toast.error("No tienes permisos suficientes para solicitar la renovación de este cliente.");
                                          return;
                                        }
                                        if (!requestRenewComprobante) {
                                          toast.error(
                                            "⚠️ Debes adjuntar la captura del comprobante de pago para realizar la solicitud.",
                                          );
                                          return;
                                        }
                                        await handleSendRenewalRequest(
                                          selectedClientForDetails,
                                          planToUse?.id || "",
                                          requestRenewComments,
                                          requestRenewComprobante,
                                        );
                                        setSelectedClientForDetails(null);
                                      }}
                                      disabled={requestRenewSubmitting || !canRenewThisClient}
                                      className={`w-full py-3 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                                        canRenewThisClient
                                          ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.01] active:scale-95"
                                          : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-100 cursor-not-allowed opacity-50"
                                      }`}
                                    >
                                      {requestRenewSubmitting ? (
                                        <>
                                          <Loader2
                                            className="animate-spin"
                                            size={14}
                                          />
                                          <span>Enviando Solicitud...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send size={14} />
                                          <span>Solicitar Renovación</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                      {/* 2. MODAL DE SOLICITUD DE RENOVACIÓN INDEPENDIENTE ELIMINADO */}
                      {/* 3. MODAL DE EDICIÓN COMPLETA DEL CLIENTE */}
                      {editingClient && (
                        <div
                          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
                          onClick={() => setEditingClient(null)}
                        >
                          <div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative scrollbar-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setEditingClient(null)}
                              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                              <X size={20} />
                            </button>

                            <div>
                              <span className="text-[10px] font-black uppercase text-cyan-600 tracking-wider">
                                Ficha de Edición
                              </span>
                              <h3 className="text-xl font-extrabold mt-1">
                                Editar Datos de{" "}
                                {editingClient.nombre_completo ||
                                  editingClient.username}
                              </h3>
                              <p className="text-slate-500 text-xs mt-0.5">
                                ID Único de Acceso:{" "}
                                <strong className="font-mono text-cyan-600">
                                  {editingClient.username}
                                </strong>
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Nombre Completo */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Nombre Completo
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Teléfono */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Teléfono
                                </label>
                                <input
                                  type="text"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Contraseña */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Contraseña de Línea
                                </label>
                                <input
                                  type="text"
                                  value={editPassword}
                                  onChange={(e) =>
                                    setEditPassword(e.target.value)
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Fecha de Vencimiento */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Fecha de Vencimiento
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editExpiration}
                                  onChange={(e) =>
                                    setEditExpiration(e.target.value)
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Pantallas Máximas */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Límite de Pantallas
                                </label>
                                <input
                                  type="number"
                                  value={editScreens}
                                  onChange={(e) =>
                                    setEditScreens(Number(e.target.value))
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Plan Minorista */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Plan Minorista Asignado
                                </label>
                                <select
                                  value={editPlanId}
                                  onChange={(e) =>
                                    setEditPlanId(e.target.value)
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                >
                                  {salePlans.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Dirección */}
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">
                                Dirección Actual / Logística
                              </label>
                              <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Comentarios de la cuenta */}
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">
                                Notas / Comentarios Internos
                              </label>
                              <textarea
                                value={editComments}
                                onChange={(e) =>
                                  setEditComments(e.target.value)
                                }
                                rows={2}
                                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100 resize-none"
                              />
                            </div>

                            {/* SECCIÓN ESPECIAL: NOTAS DE RESELLER */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">
                                  Notas de Reseller (XC / Panel Físico)
                                </label>
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editIsResellerNotesManual) {
                                        setEditIsResellerNotesManual(false);
                                        toast.info(
                                          "🔄 Volviendo a cálculo automático",
                                        );
                                      } else {
                                        setEditIsResellerNotesManual(true);
                                        toast.success(
                                          "📝 Modo edición manual activado",
                                        );
                                      }
                                    }}
                                    className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                                      editIsResellerNotesManual
                                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    {editIsResellerNotesManual ? (
                                      <>
                                        <RefreshCw
                                          size={10}
                                          className="animate-spin-slow"
                                        />
                                        Auto-Calcular
                                      </>
                                    ) : (
                                      <>
                                        <Pencil size={10} />
                                        Editar Notas de Reseller
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1 uppercase bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                    <Lock size={10} />
                                    En Vivo (Solo Lectura)
                                  </span>
                                )}
                              </div>

                              <input
                                type="text"
                                value={editResellerNotes}
                                readOnly={
                                  !isAdmin || !editIsResellerNotesManual
                                }
                                onChange={(e) => {
                                  setEditResellerNotes(e.target.value);
                                  setEditIsResellerNotesManual(true);
                                }}
                                className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
                                  !isAdmin || !editIsResellerNotesManual
                                    ? "bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 ring-1 ring-slate-100 dark:ring-slate-900 cursor-not-allowed select-none"
                                    : "bg-white dark:bg-slate-900 ring-2 ring-amber-500/50 dark:ring-amber-500/40 text-slate-800 dark:text-slate-100 focus:ring-amber-500"
                                }`}
                              />

                              <p className="text-[10px] text-slate-400 leading-normal">
                                {isAdmin
                                  ? "Como Administrador puedes editar esta nota directamente. El resto de los revendedores verá el valor calculado en tiempo real."
                                  : "Esta nota se genera automáticamente en vivo basándose en el nombre del cliente, plan contratado y creador de la cuenta."}
                              </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingClient(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...editingClient,
                                    nombre_completo: editName,
                                    celular: editPhone,
                                    password: editPassword,
                                    direccion_actual: editAddress,
                                    comentarios: editComments,
                                    limite_pantallas: editScreens,
                                    id_plan_venta: editPlanId,
                                    fecha_vencimiento: editExpiration
                                      ? new Date(editExpiration).toISOString()
                                      : editingClient.fecha_vencimiento,
                                    reseller_notes: editResellerNotes,
                                  };
                                  handleSaveEditedClient(updated);
                                }}
                                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm"
                              >
                                Guardar Cambios
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
            </div>
          )}

          {/* D. WIDGET: SOLICITAR AYUDA / CRÉDITOS & INBOX DE SOPORTE ADMIN */}
          {currentMenu === "finanzas" &&
            (() => {
              const canSeeAll = hasPermission("Iptv.Solicitudes.Ver");
              if (!canSeeAll) {
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                    <span className="material-symbols-outlined text-rose-500 text-5xl">block</span>
                    <h3 className="font-black text-slate-800 dark:text-white uppercase text-base">Acceso Denegado</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No tienes los permisos requeridos (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-600 font-mono">Iptv.Solicitudes.Ver</code>) para ver la bandeja de solicitudes globales del sistema.
                    </p>
                  </div>
                );
              }

              const isOwner = (req: any) =>
                req.reseller_usuario?.trim().toLowerCase() === user?.email?.trim().toLowerCase();

              // Obtener herencia de roles para filtrar de forma jerárquica
              const savedInheritance = localStorage.getItem('g3d_roles_inheritance');
              const roleInheritance = savedInheritance ? JSON.parse(savedInheritance) : {};

              const isDescendantRole = (child: string, parent: string): boolean => {
                if (!child || !parent) return false;
                let current = child.trim().toLowerCase();
                const p = parent.trim().toLowerCase();
                if (current === p) return false;
                let visited = new Set<string>();
                while (current && !visited.has(current)) {
                  visited.add(current);
                  const matchedKey = Object.keys(roleInheritance).find(k => k.trim().toLowerCase() === current);
                  if (!matchedKey) break;
                  const parentRole = roleInheritance[matchedKey];
                  if (!parentRole) break;
                  const parentLower = parentRole.trim().toLowerCase();
                  if (parentLower === p) return true;
                  current = parentLower;
                }
                return false;
              };

              const currentUserRole = simulatedRole || userRole || "";

              const satisfiesSoloHijos = (req: any) => {
                if (isOwner(req)) return true;
                if (!hasPermission("Iptv.Solicitudes.RecibirSoloHijos")) return true;
                const reqReseller = panelUsers.find(
                  (u: any) => u.usuario.trim().toLowerCase() === req.reseller_usuario?.trim().toLowerCase()
                );
                const resellerRole = reqReseller ? reqReseller.rol || "" : "";
                return isDescendantRole(resellerRole, currentUserRole);
              };

              const sellerEmailLower = (user?.email || "").toLowerCase().trim();

              // Construir mapa de reclutadores
              const recruiterMap = new Map<string, string>();
              vendedoresRelaciones.forEach(r => {
                if (r.invited_email && r.inviter_email) {
                  recruiterMap.set(r.invited_email.toLowerCase().trim(), r.inviter_email.toLowerCase().trim());
                }
              });

              // Mapeo completo de comisiones por cliente (excluyendo demos)
              const allCommissionRows = accounts
                .filter((acc: any) => {
                  const plan = salePlans.find((p: any) => String(p.id) === String(acc.id_plan_venta));
                  const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";
                  const usernameLower = (acc.username || "").toLowerCase().trim();
                  const planNameLower = (planNombre || "").toLowerCase().trim();
                  const isDemo = usernameLower.startsWith("demo") || planNameLower.includes("demo");
                  return !isDemo;
                })
                .map((acc: any) => {
                  const seller = (acc.creado_por || "").toLowerCase().trim();
                  const recruiter = recruiterMap.get(seller) || "";
                  
                  const plan = salePlans.find((p: any) => String(p.id) === String(acc.id_plan_venta));
                  const planComm = plan && Number(plan.comision) > 0 ? Number(plan.comision) : 5000;
                  
                  const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";
                  const totalComm = planComm;
                  
                  const defaultSellerComm = Math.round(planComm * 0.8);
                  const defaultRecruiterComm = Math.round(planComm * 0.2);

                  const sellerProfile = panelUsers.find(u => u.usuario.trim().toLowerCase() === seller);
                  const sellerName = sellerProfile ? sellerProfile.nombre : capitalizeName(seller);

                  const recruiterProfile = recruiter ? panelUsers.find(u => u.usuario.trim().toLowerCase() === recruiter) : null;
                  const recruiterName = recruiterProfile ? recruiterProfile.nombre : (recruiter ? capitalizeName(recruiter) : "Directo (Sin Red)");

                  const payment = finanzasComisionesPagos.find((p: any) => p.cliente_id === acc.username);
                  
                  const isSellerPaid = payment ? (payment.estado_pago === 'vendedor_pagado' || payment.estado_pago === 'completo') : false;
                  const isRecruiterPaid = payment ? (payment.estado_pago === 'reclutador_pagado' || payment.estado_pago === 'completo') : false;
                  const isFullyPaid = payment ? (payment.estado_pago === 'completo') : false;

                  const vComm = payment ? Number(payment.comision_vendedor) : defaultSellerComm;
                  const rComm = payment ? Number(payment.comision_reclutador) : defaultRecruiterComm;

                  const vAbonado = payment
                    ? (payment.vendedor_abonado !== undefined && payment.vendedor_abonado !== null
                        ? Number(payment.vendedor_abonado)
                        : (isSellerPaid ? vComm : 0))
                    : 0;

                  const rAbonado = payment
                    ? (payment.reclutador_abonado !== undefined && payment.reclutador_abonado !== null
                        ? Number(payment.reclutador_abonado)
                        : (isRecruiterPaid ? rComm : 0))
                    : 0;

                  const vSaldo = Math.max(0, vComm - vAbonado);
                  const rSaldo = Math.max(0, rComm - rAbonado);

                  const isSellerParcial = vAbonado > 0 && vAbonado < vComm;
                  const isRecruiterParcial = rAbonado > 0 && rAbonado < rComm;

                  const isSellerRequested = payment ? !!payment.solicitado_vendedor : false;
                  const isRecruiterRequested = payment ? !!payment.solicitado_reclutador : false;
                  const requestedSellerAt = payment ? payment.solicitado_vendedor_al : null;
                  const requestedRecruiterAt = payment ? payment.solicitado_reclutador_al : null;
                  const comprobanteImg = payment ? payment.comprobante_img || "" : "";
                  const notes = payment ? payment.notes || "" : "";

                  return {
                    cliente_id: acc.username,
                    cliente_nombre: acc.nombre_completo || acc.username,
                    plan_nombre: planNombre,
                    seller,
                    sellerName,
                    recruiter,
                    recruiterName,
                    totalComm,
                    vComm,
                    rComm,
                    vAbonado,
                    rAbonado,
                    vSaldo,
                    rSaldo,
                    isSellerPaid,
                    isRecruiterPaid,
                    isFullyPaid,
                    isSellerParcial,
                    isRecruiterParcial,
                    isSellerRequested,
                    isRecruiterRequested,
                    requestedSellerAt,
                    requestedRecruiterAt,
                    comprobanteImg,
                    notes,
                    creado_al: acc.creado_al || acc.fecha_creacion || new Date().toISOString(),
                    paymentRecord: payment
                  };
                });

              // 1. Solicitudes pendientes (faccion: pendientes de aprobar)
              const canSeeAllPendings = hasPermission("Iptv.Solicitudes.VerTodas") || hasPermission("Iptv.Solicitudes.Aprobar");
              const pendingActivations = creditRequests.filter(
                (req: any) =>
                  req.tipo_solicitud === "crear_cuenta" &&
                  req.estado === "pendiente" &&
                  (canSeeAllPendings || isOwner(req)) &&
                  satisfiesSoloHijos(req)
              );

              // 2. Solicitudes aprobadas (faccion: aprobadas)
              const canSeeAllApproved = hasPermission("Iptv.Solicitudes.VerTodas");
              const approvedActivations = creditRequests.filter(
                (req: any) =>
                  req.tipo_solicitud === "crear_cuenta" &&
                  req.estado === "aprobado" &&
                  (canSeeAllApproved || isOwner(req)) &&
                  satisfiesSoloHijos(req)
              );

              // 3. Historial completo (faccion: historial de aprobadas y rechazadas)
              const canSeeAllHistory = hasPermission("Iptv.Solicitudes.Historial");
              const processedActivations = creditRequests.filter(
                (req: any) =>
                  req.tipo_solicitud === "crear_cuenta" &&
                  req.estado !== "pendiente" &&
                  (canSeeAllHistory || isOwner(req)) &&
                  satisfiesSoloHijos(req)
              );
              return (
                <div className="space-y-6">
                  {/* Switcher de Sección */}
                  {hasPermission("Iptv.ComisionesSolicitudes.Interactuar") && (
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
                      <button
                        onClick={() => {
                          setSolicitudSection("activar_linea");
                          setSelectedCommissionPayout(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                          solicitudSection === "activar_linea"
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        ⚡ Activar Línea
                      </button>
                      <button
                        onClick={() => {
                          setSolicitudSection("pago_comisiones");
                          setSelectedActivationRequest(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                          solicitudSection === "pago_comisiones"
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        💵 Pago de Comisiones
                      </button>
                    </div>
                  )}

                  {solicitudSection === "activar_linea" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* 1. LADO IZQUIERDO (Lg: col-span-5): DETALLE DE LA SOLICITUD SELECCIONADA */}
                    {hasPermission("Admin.IntegracionXC.Acceder") && (
                      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm min-h-[480px] flex flex-col justify-between">
                      {!selectedActivationRequest ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                          <div className="size-16 rounded-3xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-600">
                            <UserCheck size={32} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                              Ninguna solicitud seleccionada
                            </h4>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto">
                              Toca una fila en la bandeja de solicitudes de la
                              derecha para auditar la información del cliente,
                              el plan y su comprobante.
                            </p>
                          </div>
                        </div>
                      ) : isEditingRequest ? (
                        /* NUEVO FORMULARIO DE EDICIÓN INLINE DE SOLICITUD PENDIENTE */
                        <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                          <div className="space-y-5">
                            {/* Cabecera de Edición */}
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                                  Editando Solicitud Pendiente
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                  {editRequestNombre || "Sin Nombre"}
                                </h3>
                              </div>
                            </div>

                            {/* Campos del Cliente */}
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Nombre Completo
                                </label>
                                <input
                                  type="text"
                                  value={editRequestNombre}
                                  onChange={(e) => setEditRequestNombre(e.target.value)}
                                  onBlur={(e) => setEditRequestNombre(capitalizeName(e.target.value))}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                  placeholder="Ej. Juan Pérez"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Número de Celular
                                </label>
                                <input
                                  type="text"
                                  value={editRequestCelular}
                                  onChange={(e) => setEditRequestCelular(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                  placeholder="Ej. +5491122334455"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Dirección
                                </label>
                                <input
                                  type="text"
                                  value={editRequestDireccion}
                                  onChange={(e) => setEditRequestDireccion(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                  placeholder="Ej. Av. de Mayo 123, CABA"
                                />
                              </div>

                              {/* Tipo de Membresía (VIP o DEMO) */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Tipo de Membresía
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditRequestPlanType("DEMO");
                                      const demoPlans = salePlans.filter((p) => !p.archived && p.name.toLowerCase().includes("demo"));
                                      if (demoPlans.length > 0) {
                                        setEditRequestPlanId(demoPlans[0].id);
                                        setEditRequestPantallas(demoPlans[0].screens || 1);
                                      } else {
                                        setEditRequestPlanId("");
                                      }
                                    }}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                      editRequestPlanType === "DEMO"
                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                    }`}
                                  >
                                    Demo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditRequestPlanType("VIP");
                                      const vipPlans = salePlans.filter((p) => !p.archived && !p.name.toLowerCase().includes("demo"));
                                      if (vipPlans.length > 0) {
                                        setEditRequestPlanId(vipPlans[0].id);
                                        setEditRequestPantallas(vipPlans[0].screens || 2);
                                      } else {
                                        setEditRequestPlanId("");
                                      }
                                    }}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                      editRequestPlanType === "VIP"
                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                    }`}
                                  >
                                    VIP
                                  </button>
                                </div>
                              </div>

                              {/* Selector de Plan */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Plan Seleccionado
                                </label>
                                <select
                                  value={editRequestPlanId}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditRequestPlanId(val);
                                    const pl = salePlans.find((p) => p.id === val);
                                    if (pl) {
                                      setEditRequestPantallas(pl.screens || (editRequestPlanType === "VIP" ? 2 : 1));
                                    }
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                >
                                  {editRequestPlanType === "VIP"
                                    ? salePlans
                                        .filter((p) => !p.archived && !p.name.toLowerCase().includes("demo"))
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} — ${p.price || 0} ARS ({p.months}m)
                                          </option>
                                        ))
                                    : salePlans
                                        .filter((p) => !p.archived && p.name.toLowerCase().includes("demo"))
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} — ${p.price || 0} ARS {p.hours ? `(${p.hours}h)` : p.months ? `(${p.months}m)` : ""}
                                          </option>
                                        ))}
                                </select>
                              </div>

                              {/* Cantidad de Pantallas */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Cantidad de Pantallas
                                </label>
                                <select
                                  value={editRequestPantallas}
                                  onChange={(e) => setEditRequestPantallas(Number(e.target.value))}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                >
                                  <option value={1}>1 Pantalla</option>
                                  <option value={2}>2 Pantallas simultáneas</option>
                                  <option value={3}>3 Pantallas simultáneas</option>
                                  <option value={4}>4 Pantallas simultáneas</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Botones de Guardar / Cancelar */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-6 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setIsEditingRequest(false)}
                              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={editRequestSubmitting}
                              onClick={handleSaveEditedRequest}
                              className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
                            >
                              {editRequestSubmitting ? "Guardando..." : "Guardar Cambios"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                          <div className="space-y-5">
                            {/* Cabecera del Detalle */}
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase text-cyan-650 dark:text-cyan-400 tracking-wider">
                                  Auditoría de Activación
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                  {selectedActivationRequest.detalles
                                    ?.nombre_completo || "Cliente"}
                                </h3>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  selectedActivationRequest.estado ===
                                  "pendiente"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse"
                                    : selectedActivationRequest.estado ===
                                        "aprobado"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-350"
                                      : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                }`}
                              >
                                {selectedActivationRequest.estado}
                              </span>
                            </div>

                            {/* 1. Información del Cliente */}
                            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Información del Cliente
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-xs text-left">
                                <div>
                                  <span className="text-slate-400 block font-medium">
                                    Celular:
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <strong className="text-slate-800 dark:text-slate-200">
                                      {selectedActivationRequest.detalles
                                        ?.celular || "No provisto"}
                                    </strong>
                                    {selectedActivationRequest.detalles
                                      ?.celular && (
                                      <a
                                        href={`https://wa.me/${selectedActivationRequest.detalles.celular.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-500 transition-colors"
                                        title="Contactar por WhatsApp"
                                      >
                                        <MessageSquare size={13} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">
                                    Dirección:
                                  </span>
                                  <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                                    {selectedActivationRequest.detalles
                                      ?.direccion_actual || "No provista"}
                                  </strong>
                                </div>
                                <div className="col-span-2 border-t border-slate-150/40 dark:border-slate-800 pt-2">
                                  <span className="text-slate-400 block font-medium">
                                    Vendedor Solicitante:
                                  </span>
                                  <strong className="text-slate-700 dark:text-slate-300 mt-0.5 block font-bold">
                                    {selectedActivationRequest.reseller_usuario}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* 2. Plan Solicitado */}
                            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Plan / Membresía Solicitada
                              </h4>
                              {(() => {
                                const associatedPlan = salePlans.find(
                                  (pl) => String(pl.id) === String(selectedActivationRequest.detalles?.plan_id)
                                );
                                const mPrice = associatedPlan?.price ?? selectedActivationRequest.detalles?.precio_minorista ?? 0;
                                const mComision = associatedPlan?.comision ?? 0;

                                return (
                                  <div className="grid grid-cols-2 gap-3 text-xs text-left">
                                    <div>
                                      <span className="text-slate-400 block font-medium">
                                        Plan:
                                      </span>
                                      <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block truncate font-bold">
                                        {selectedActivationRequest.detalles
                                          ?.plan_nombre || "No especificado"}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-medium">
                                        Pantallas:
                                      </span>
                                      <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                                        {selectedActivationRequest.detalles
                                          ?.pantallas || 1}{" "}
                                        Pantallas
                                      </strong>
                                    </div>
                                    
                                    <div>
                                      <span className="text-slate-400 block font-medium">
                                        Costo de Membresía:
                                      </span>
                                      <strong className="text-emerald-600 dark:text-emerald-400 mt-0.5 block font-black">
                                        ${Number(mPrice).toLocaleString("es-AR")} ARS
                                      </strong>
                                    </div>

                                    <div>
                                      <span className="text-slate-400 block font-medium">
                                        Comisión:
                                      </span>
                                      <strong className="text-indigo-600 dark:text-indigo-400 mt-0.5 block font-black">
                                        ${Number(mComision).toLocaleString("es-AR")} ARS
                                      </strong>
                                    </div>

                                    {isSocioOrAdmin && (
                                      <div className="col-span-2 mt-1 pt-2 border-t border-slate-150/40 dark:border-slate-800/60">
                                        <span className="text-slate-400 block font-medium">
                                          Costo de Solicitud:
                                        </span>
                                        <strong className="text-amber-600 dark:text-amber-400 mt-0.5 block font-black">
                                          {selectedActivationRequest.cantidad_creditos ||
                                            1}{" "}
                                          Ficha
                                          {selectedActivationRequest.detalles
                                            ?.tipo_cuenta === "VIP"
                                            ? " VIP"
                                            : " Demo"}
                                        </strong>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* 3. Comprobante de Pago (Miniatura Clickable) */}
                            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Comprobante / Captura de Pago
                              </h4>
                              {selectedActivationRequest.comprobante_url ? (
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      selectedActivationRequest.comprobante_url
                                    }
                                    className="w-14 h-14 object-cover rounded-xl shadow border border-slate-200 dark:border-slate-800 cursor-zoom-in transition-transform hover:scale-105"
                                    onClick={() =>
                                      setViewingComprobante(
                                        selectedActivationRequest.comprobante_url,
                                      )
                                    }
                                    alt="Miniatura de Comprobante"
                                  />
                                  <div className="space-y-0.5 text-left">
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                                      Captura de Transferencia
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setViewingComprobante(
                                          selectedActivationRequest.comprobante_url,
                                        )
                                      }
                                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                      <ZoomIn size={12} />
                                      Tocar para Ampliar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs block py-1">
                                  Sin captura adjunta
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botones de acción rápida sobre la solicitud pendiente (Editar / Eliminar) */}
                          {selectedActivationRequest.estado === "pendiente" && (
                            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40 text-left mt-2">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Acciones de Solicitud Pendiente
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const det = selectedActivationRequest.detalles || {};
                                    setEditRequestNombre(det.nombre_completo || det.cliente || det.nombre || "");
                                    setEditRequestCelular(det.celular || "");
                                    setEditRequestDireccion(det.direccion_actual || det.direccion || "");
                                    
                                    const matchedPlan = salePlans.find((p) => p.id === det.plan_id);
                                    const isDemo = matchedPlan ? matchedPlan.name.toLowerCase().includes("demo") : (det.tipo_cuenta === "DEMO" || (det.plan_nombre && det.plan_nombre.toLowerCase().includes("demo")));
                                    
                                    setEditRequestPlanType(isDemo ? "DEMO" : "VIP");
                                    setEditRequestPlanId(det.plan_id || "");
                                    setEditRequestPantallas(Number(det.pantallas || 1));
                                    setIsEditingRequest(true);
                                    
                                    toast.info("📝 Abriendo editor de solicitud...");
                                  }}
                                  className="py-2 px-4 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 border border-amber-500/20 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Pencil size={13} />
                                  Editar
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (deletingRequestId !== selectedActivationRequest.id) {
                                      setDeletingRequestId(selectedActivationRequest.id);
                                      toast.info("⚠️ Haz clic de nuevo en Eliminar para confirmar el borrado.");
                                      return;
                                    }
                                    try {
                                      toast.loading("Eliminando solicitud...");
                                      const res = await apiService.deleteIptvCreditRequest(selectedActivationRequest.id);
                                      toast.dismiss();
                                      if (res.success) {
                                        toast.success("Solicitud eliminada exitosamente.");
                                        setCreditRequests(prev => prev.filter(r => r.id !== selectedActivationRequest.id));
                                        setSelectedActivationRequest(null);
                                        fetchData();
                                      } else {
                                        toast.error("No se pudo eliminar la solicitud.");
                                      }
                                    } catch (err: any) {
                                      toast.dismiss();
                                      toast.error(`Error al eliminar: ${err.message || err}`);
                                    }
                                  }}
                                  className={`py-2 px-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all border ${
                                    deletingRequestId === selectedActivationRequest.id
                                      ? "bg-red-600 text-white border-red-600 animate-pulse"
                                      : "bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/20"
                                  }`}
                                >
                                  <Trash2 size={13} />
                                  {deletingRequestId === selectedActivationRequest.id ? "Confirmar Borrado" : "Eliminar"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 4. Formulario de Notas & Acción de Aprobación */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-4 space-y-4">
                            {selectedActivationRequest.estado ===
                            "pendiente" ? (
                              <>
                                {hasPermission("Iptv.Solicitudes.Aprobar") ? (
                                  <div className="space-y-4 text-left">
                                    {/* Credenciales de Activación editable */}
                                    {/* Consola de Integración XC & Pre-Auditoría */}
                                    <div className="space-y-4 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/20 text-left">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">
                                          Consola de Integración XC
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[8.5px] uppercase">
                                          Auto-Sincronización
                                        </span>
                                      </div>

                                      {/* Selector de Operación */}
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                          Acción en el Servidor
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setApprovalOperation(
                                                "create_line",
                                              )
                                            }
                                            className={`py-2 px-3 rounded-xl text-[10.5px] font-bold text-center border transition-all ${
                                              approvalOperation ===
                                              "create_line"
                                                ? "bg-indigo-600 border-indigo-600 text-white font-black shadow-sm"
                                                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            Crear Nueva Línea
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setApprovalOperation(
                                                "extend_line",
                                              )
                                            }
                                            className={`py-2 px-3 rounded-xl text-[10.5px] font-bold text-center border transition-all ${
                                              approvalOperation ===
                                              "extend_line"
                                                ? "bg-indigo-600 border-indigo-600 text-white font-black shadow-sm"
                                                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            Extender Línea Existente
                                          </button>
                                        </div>
                                      </div>

                                      {/* Si es extender, mostramos input del ID de línea */}
                                      {approvalOperation === "extend_line" && (
                                        <div className="space-y-1.5 animate-fade-in">
                                          <label className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                            ID de Línea XC a Extender *
                                          </label>
                                          <input
                                            type="number"
                                            value={approvalLineId}
                                            onChange={(e) =>
                                              setApprovalLineId(e.target.value)
                                            }
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-xs text-slate-800 dark:text-slate-100 font-bold"
                                            placeholder="Ej: 12345"
                                          />
                                          {(() => {
                                            const det =
                                              selectedActivationRequest?.detalles ||
                                              {};
                                            const matched = accounts.find(
                                              (acc: any) =>
                                                (acc.celular &&
                                                  det.celular &&
                                                  acc.celular.trim() ===
                                                    det.celular.trim()) ||
                                                (acc.nombre_completo &&
                                                  det.nombre_completo &&
                                                  acc.nombre_completo
                                                    .toLowerCase()
                                                    .trim() ===
                                                    det.nombre_completo
                                                      .toLowerCase()
                                                      .trim()),
                                            );
                                            return matched ? (
                                              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-2.5 mt-1">
                                                <p className="text-[9.5px] text-amber-700 dark:text-amber-400 font-black leading-normal flex items-center gap-1">
                                                  <span>
                                                    ⚠️ Cuenta coincidente
                                                    detectada:
                                                  </span>
                                                </p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-350 mt-0.5 leading-normal">
                                                  Usuario:{" "}
                                                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                                                    {matched.username}
                                                  </span>{" "}
                                                  | ID XC actual:{" "}
                                                  <span className="font-bold">
                                                    {matched.xui_id ||
                                                      matched.id_linea ||
                                                      "N/D"}
                                                  </span>
                                                </p>
                                              </div>
                                            ) : null;
                                          })()}
                                        </div>
                                      )}

                                      {/* Carga útil Pre-Visualización */}
                                      {(() => {
                                        const originalResellerNotes =
                                          selectedActivationRequest.detalles
                                            ?.reseller_notes ||
                                          `[XTV]${selectedActivationRequest.detalles?.nombre_completo || "Cliente"} - ${selectedActivationRequest.detalles?.plan_nombre || "Plan"} - ${selectedActivationRequest.reseller_usuario || "vendedor"}`;
                                        const approvedResellerNotes = `${originalResellerNotes} - ${user?.email || "admin"}`;
                                        const matchedSalePlan = salePlans.find(
                                          (pl) =>
                                            pl.id ===
                                              selectedActivationRequest.detalles
                                                ?.plan_id ||
                                            pl.provider_plan_id ===
                                              selectedActivationRequest.detalles
                                                ?.plan_id,
                                        );
                                        const screensCount = Number(
                                          selectedActivationRequest.detalles
                                            ?.screens_api ||
                                            selectedActivationRequest.detalles
                                              ?.pantallas ||
                                            matchedSalePlan?.screens_api ||
                                            matchedSalePlan?.screens ||
                                            1,
                                        );

                                        const previewPayload: any = {
                                          action:
                                            approvalOperation === "extend_line"
                                              ? "extend_line"
                                              : "create_line",
                                          package: Number(
                                            matchedSalePlan?.provider_plan_id ||
                                              selectedActivationRequest.detalles
                                                ?.plan_id ||
                                              "12",
                                          ),
                                          ...(approvalOperation === "extend_line"
                                            ? {
                                                id: Number(
                                                  approvalLineId || "0",
                                                ),
                                                ...(screensCount > 1
                                                  ? {
                                                      max_connections:
                                                        screensCount,
                                                    }
                                                  : {}),
                                              }
                                            : {
                                                trial:
                                                  selectedActivationRequest
                                                    .detalles?.tipo_cuenta ===
                                                  "VIP"
                                                    ? 0
                                                    : 1,
                                                ...(screensCount > 1
                                                  ? {
                                                      max_connections:
                                                        screensCount,
                                                    }
                                                  : {}),
                                              }),
                                          reseller_notes: approvedResellerNotes,
                                        };

                                        return (
                                          <div className="space-y-1 pt-1">
                                            <span className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                              Payload API Pre-Auditoría (Listo
                                              para Enviar)
                                            </span>
                                            <div className="bg-slate-950 rounded-xl p-3 text-[10px] font-mono text-cyan-400 relative group overflow-x-auto text-left leading-normal border border-slate-800">
                                              <pre>
                                                {JSON.stringify(
                                                  previewPayload,
                                                  null,
                                                  2,
                                                )}
                                              </pre>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const copyText =
                                                    JSON.stringify(
                                                      previewPayload,
                                                      null,
                                                      2,
                                                    );
                                                  navigator.clipboard.writeText(
                                                    copyText,
                                                  );
                                                  toast.success(
                                                    "¡Payload copiado al portapapeles!",
                                                  );
                                                }}
                                                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-colors"
                                                title="Copiar Payload"
                                              >
                                                Copiar
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                                        <FileText size={12} />
                                        Notas de Aprobación / Auditoría *
                                      </label>
                                      <textarea
                                        placeholder="Detalla que se aprobó la creación y asienta notas relevantes para el vendedor y cliente..."
                                        value={adminApprovalNotes}
                                        onChange={(e) =>
                                          setAdminApprovalNotes(e.target.value)
                                        }
                                        rows={2}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-slate-800 text-xs placeholder:text-slate-400"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={async () => {
                                          const updatedDetails = {
                                            ...selectedActivationRequest.detalles,
                                            notas_aprobacion:
                                              adminApprovalNotes.trim(),
                                            operacion: approvalOperation,
                                            xui_line_id:
                                              approvalOperation ===
                                              "extend_line"
                                                ? approvalLineId
                                                : null,
                                          };
                                          await handleProcessRequest(
                                            selectedActivationRequest.id,
                                            "aprobado",
                                            updatedDetails,
                                          );
                                          setSelectedActivationRequest(null);
                                          setAdminApprovalNotes("");
                                        }}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                      >
                                        <CheckCircle size={14} />
                                        Aprobar Alta
                                      </button>

                                      <button
                                        onClick={() => {
                                          setRejectionRequestId(
                                            selectedActivationRequest.id,
                                          );
                                          setRejectionReason("");
                                          setRejectionModalOpen(true);
                                        }}
                                        className="w-full py-2.5 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                                      >
                                        <XCircle size={14} />
                                        Rechazar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center text-xs text-amber-400 font-bold">
                                      ⚠️ Contacta a un supervisor para que active la cuenta por vos...
                                    </div>
                                    {(() => {
                                      const supervisors = (panelUsers || []).filter((u: any) => {
                                        const r = (u.rol || "").trim().toLowerCase();
                                        return r === "admin" || r === "administrador" || r.includes("socio");
                                      });

                                      if (supervisors.length > 0) {
                                        return (
                                          <div className="space-y-3">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block text-left pl-1">
                                              Supervisores Disponibles
                                            </span>
                                            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                                              {supervisors.map((sup: any, idx: number) => {
                                                const supName = sup.nombre_personal || sup.nombre || sup.nombre_completo || sup.email || "Supervisor";
                                                const supPhone = sup.telefono_contacto || sup.celular || sup.telefono_negocio || "";
                                                
                                                // Generar el mensaje de WhatsApp predefinido
                                                const clientName = selectedActivationRequest?.detalles?.cliente || selectedActivationRequest?.detalles?.nombre || 'test';
                                                const clientPhone = selectedActivationRequest?.detalles?.celular || '';
                                                const planName = selectedActivationRequest?.detalles?.plan_nombre || '';
                                                const reqLink = `${window.location.origin}/xtv?req_id=${selectedActivationRequest?.id}`;
                                                
                                                const textMsg = `¡Hola ${supName}! Registré una solicitud de alta para el cliente "${clientName}" (${clientPhone}) con el plan "${planName}" y se encuentra pendiente. ¿Podrías aprobarla? Aquí tienes el link directo para verla en el panel:\n${reqLink}`;
                                                const waUrl = supPhone ? `https://wa.me/${supPhone.replace(/\D/g, "")}?text=${encodeURIComponent(textMsg)}` : "";
                                                
                                                return (
                                                  <div 
                                                    key={sup.id || idx} 
                                                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 p-3 rounded-2xl flex items-center justify-between gap-3 transition-all group"
                                                  >
                                                    <div className="flex items-center gap-2.5 text-left">
                                                      <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:scale-105 transition-transform">
                                                        <span className="text-xs font-black uppercase">{supName.substring(0, 2)}</span>
                                                      </div>
                                                      <div>
                                                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                                                          {supName}
                                                        </h4>
                                                        <span className="text-[10px] text-slate-500 font-mono block">
                                                          {supPhone || "Sin teléfono registrado"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    
                                                    {supPhone && (
                                                      <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                                                      >
                                                        Solicitar
                                                      </a>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="text-[10px] text-slate-500 italic text-center py-2">
                                            No hay supervisores o socios con contacto registrados en el sistema.
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </>
                            ) : selectedActivationRequest.estado ===
                              "aprobado" ? (
                              <div className="space-y-4 text-left">
                                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-4 rounded-2xl text-xs text-emerald-850 dark:text-emerald-400 space-y-2">
                                  <span className="font-extrabold block">
                                    ✓ Solicitud Completada Correctamente
                                  </span>
                                  {selectedActivationRequest.detalles
                                    ?.notas_aprobacion && (
                                    <p className="italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100/30">
                                      "Nota:{" "}
                                      {
                                        selectedActivationRequest.detalles
                                          .notas_aprobacion
                                      }
                                      "
                                    </p>
                                  )}
                                </div>

                                {/* Mostrar Credenciales para compartir */}
                                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-850 space-y-3 font-mono text-[11px] relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-1.5 bg-slate-800 text-[8px] uppercase font-black text-cyan-400 rounded-bl-xl">
                                    Credenciales
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">
                                      Usuario:
                                    </span>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white select-all">
                                        {selectedActivationRequest.detalles
                                          ?.usuario_propuesto || "No asignado"}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            selectedActivationRequest.detalles
                                              ?.usuario_propuesto || "",
                                          );
                                          toast.success(
                                            "Usuario copiado al portapapeles.",
                                          );
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 font-sans font-bold hover:underline"
                                      >
                                        Copiar
                                      </button>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-900 pt-2">
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">
                                      Contraseña:
                                    </span>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white select-all">
                                        {selectedActivationRequest.detalles
                                          ?.contrasena_propuesta ||
                                          "No asignada"}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            selectedActivationRequest.detalles
                                              ?.contrasena_propuesta || "",
                                          );
                                          toast.success("Contraseña copiada.");
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 font-sans font-bold hover:underline"
                                      >
                                        Copiar
                                      </button>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-900 pt-2">
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">
                                      Servidor XC URL:
                                    </span>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                        {systemConfig?.xc_url_completa ||
                                          systemConfig?.xui_url ||
                                          "http://vip-xtv.pro:8080"}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            systemConfig?.xc_url_completa ||
                                              systemConfig?.xui_url ||
                                              "http://vip-xtv.pro:8080",
                                          );
                                          toast.success(
                                            "Servidor URL copiado.",
                                          );
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 font-sans font-bold hover:underline"
                                      >
                                        Copiar
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Botón Compartir por WhatsApp */}
                                <div className="grid grid-cols-1 gap-2">
                                  {(() => {
                                    const phoneNum = (
                                      selectedActivationRequest.detalles
                                        ?.celular || ""
                                    ).replace(/[^0-9]/g, "");
                                    const msgText = generateWhatsappMessage(
                                      selectedActivationRequest,
                                    );
                                    const waUrl = phoneNum
                                      ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(msgText)}`
                                      : "";

                                    return (
                                      <>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              msgText,
                                            );
                                            toast.success(
                                              "📋 Log de mensaje copiado para compartir por WhatsApp.",
                                            );
                                          }}
                                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                                        >
                                          <Copy size={13} />
                                          Copiar Mensaje Listo
                                        </button>

                                        {waUrl ? (
                                          <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm text-center"
                                          >
                                            <MessageSquare size={14} />
                                            Compartir por WhatsApp
                                          </a>
                                        ) : (
                                          <button
                                            disabled
                                            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                                          >
                                            <MessageSquare size={14} />
                                            WhatsApp (Falta Teléfono)
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 p-4 rounded-2xl text-xs text-red-800 dark:text-red-400 space-y-2 text-left">
                                <span className="font-extrabold block">
                                  ❌ Solicitud Rechazada
                                </span>
                                {selectedActivationRequest.detalles?.motivo_rechazo && (
                                  <p className="italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-red-100/30 text-slate-700 dark:text-slate-300">
                                    "Motivo: {selectedActivationRequest.detalles.motivo_rechazo}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* 2. LADO DERECHO (Lg: col-span-7): BANDEJA DE SOLICITUDES DE ACTIVACIÓN CON 3 SOLAPAS */}
                    <div className={`${hasPermission("Admin.IntegracionXC.Acceder") ? "lg:col-span-7" : "lg:col-span-12"} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-left`}>
                      <div>
                        {editingLabelKey === "lblBandejaTitle" ? (
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-1.5 text-sm font-extrabold focus:outline-none focus:ring-cyan-500 text-slate-800 dark:text-slate-100 flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveCustomLabel("lblBandejaTitle", editingLabelValue)}
                              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-all"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingLabelKey(null)}
                              className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5 group">
                            <span>{lblBandejaTitle}</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingLabelKey("lblBandejaTitle");
                                  setEditingLabelValue(lblBandejaTitle);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 transition-all rounded-lg"
                                title="Editar Título"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </h3>
                        )}

                        {editingLabelKey === "lblBandejaSubtitle" ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-1 text-xs focus:outline-none focus:ring-cyan-500 text-slate-600 dark:text-slate-300 flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveCustomLabel("lblBandejaSubtitle", editingLabelValue)}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-[10px] font-black uppercase transition-all"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingLabelKey(null)}
                              className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 group">
                            <span>{lblBandejaSubtitle}</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingLabelKey("lblBandejaSubtitle");
                                  setEditingLabelValue(lblBandejaSubtitle);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 transition-all rounded-lg"
                                title="Editar Leyenda"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Selector de Facciones (Solapas de estilo Airbnb) */}
                      <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl gap-1">
                        <div className="flex-1 relative group">
                          <button
                            type="button"
                            onClick={() => setSolicitudTab("pendientes")}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                              solicitudTab === "pendientes"
                                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                          >
                            <span>{lblTabPendientes}</span>
                            {pendingActivations.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full animate-pulse">
                                {pendingActivations.length}
                              </span>
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLabelKey("lblTabPendientes");
                                setEditingLabelValue(lblTabPendientes);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 bg-white dark:bg-slate-800 shadow-sm rounded-lg transition-all"
                              title="Editar Nombre"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 relative group">
                          <button
                            type="button"
                            onClick={() => setSolicitudTab("aprobadas")}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                              solicitudTab === "aprobadas"
                                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                          >
                            <span>{lblTabAprobadas}</span>
                            {approvedActivations.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded-full">
                                {approvedActivations.length}
                              </span>
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLabelKey("lblTabAprobadas");
                                setEditingLabelValue(lblTabAprobadas);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 bg-white dark:bg-slate-800 shadow-sm rounded-lg transition-all"
                              title="Editar Nombre"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 relative group">
                          <button
                            type="button"
                            onClick={() => setSolicitudTab("historial")}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                              solicitudTab === "historial"
                                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                          >
                            <span>{lblTabHistorial}</span>
                            {processedActivations.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-slate-400/80 text-white rounded-full">
                                {processedActivations.length}
                              </span>
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLabelKey("lblTabHistorial");
                                setEditingLabelValue(lblTabHistorial);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 bg-white dark:bg-slate-800 shadow-sm rounded-lg transition-all"
                              title="Editar Nombre"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editor de pestaña inline si está activo */}
                      {isAdmin && editingLabelKey && ["lblTabPendientes", "lblTabAprobadas", "lblTabHistorial"].includes(editingLabelKey) && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-fade-in">
                          <span className="text-[10px] font-black uppercase text-slate-400">Editar Nombre:</span>
                          <input
                            type="text"
                            value={editingLabelValue}
                            onChange={(e) => setEditingLabelValue(e.target.value)}
                            className="bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-cyan-500 text-slate-800 dark:text-slate-100 flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCustomLabel(editingLabelKey, editingLabelValue)}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-[10px] font-black uppercase transition-all"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingLabelKey(null)}
                            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-bold transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* 1. SECCIÓN PENDIENTES */}
                        {solicitudTab === "pendientes" && (
                          <div className="space-y-4 animate-fade-in">
                            {editingLabelKey === "lblPendientesLeyenda" ? (
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={editingLabelValue}
                                  onChange={(e) => setEditingLabelValue(e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-1 text-xs focus:outline-none text-slate-800 dark:text-slate-100 flex-1"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveCustomLabel("lblPendientesLeyenda", editingLabelValue)}
                                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-[9px] font-black uppercase transition-all"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingLabelKey(null)}
                                  className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px]"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5 group">
                                <span>{lblPendientesLeyenda}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      setEditingLabelKey("lblPendientesLeyenda");
                                      setEditingLabelValue(lblPendientesLeyenda);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-450 hover:text-cyan-500 transition-all rounded"
                                    title="Editar Leyenda"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                )}
                              </p>
                            )}
                            {pendingActivations.length > 0 ? (
                              <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                                      <th className="p-3">Cliente / Celular</th>
                                      <th className="p-3">Plan / Pantallas</th>
                                      <th className="p-3">Vendedor</th>
                                      <th className="p-3 text-right">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pendingActivations.map((req: any) => {
                                      const isSelected = selectedActivationRequest?.id === req.id;
                                      return (
                                        <tr
                                          key={req.id}
                                          onClick={() => {
                                            setSelectedActivationRequest(req);
                                            setIsEditingRequest(false);
                                            setAdminApprovalNotes("");
                                            setApprovalUser(req.detalles?.usuario_propuesto || "");
                                            setApprovalPass(req.detalles?.contrasena_propuesta || "");
                                            const det = req.detalles || {};
                                            const matchedAcc = accounts.find(
                                              (acc: any) =>
                                                (acc.celular && det.celular && acc.celular.trim() === det.celular.trim()) ||
                                                (acc.nombre_completo && det.nombre_completo && acc.nombre_completo.toLowerCase().trim() === det.nombre_completo.toLowerCase().trim()),
                                            );
                                            if (matchedAcc) {
                                              setApprovalOperation("extend_line");
                                              setApprovalLineId(String(matchedAcc.xui_id || matchedAcc.id_linea || ""));
                                            } else {
                                              setApprovalOperation("create_line");
                                              setApprovalLineId("");
                                            }
                                          }}
                                          className={`cursor-pointer transition-all ${
                                            isSelected
                                              ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-l-4 border-l-cyan-500"
                                              : "hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                                          }`}
                                        >
                                          <td className="p-3">
                                            <div className="space-y-0.5">
                                              <p className="font-extrabold text-slate-800 dark:text-slate-100">
                                                {req.detalles?.nombre_completo || "Cliente"}
                                              </p>
                                              <p className="text-[10px] font-mono text-slate-400">
                                                {req.detalles?.celular || "Sin celular"}
                                              </p>
                                            </div>
                                          </td>
                                          <td className="p-3">
                                            <div className="space-y-0.5">
                                              <span className="inline-block px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-purple-100/80 text-purple-800 dark:bg-purple-950/30 text-purple-400">
                                                {req.detalles?.tipo_cuenta || "VIP"}
                                              </span>
                                              <p className="text-[10.5px] text-slate-500 font-bold mt-1">
                                                {req.detalles?.plan_nombre} ({req.detalles?.pantallas || 1} Pan)
                  </p>
                </div>
              </td>
                                          <td className="p-3 font-medium text-slate-550">
                                            {req.reseller_usuario}
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                                              Pendiente
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                <CheckCircle className="mx-auto mb-2 text-emerald-600 animate-pulse" size={32} />
                                <p className="font-bold text-slate-700 dark:text-slate-300">¡Todo al día!</p>
                                <p className="text-xs text-slate-400 mt-1">No hay solicitudes de alta pendientes en este momento.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. SECCIÓN APROBADAS */}
                        {solicitudTab === "aprobadas" && (
                          <div className="space-y-4 animate-fade-in">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                              ✅ Solicitudes que ya han sido aprobadas y activadas en el sistema:
                            </p>
                            {approvedActivations.length > 0 ? (
                              <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                                      <th className="p-3">Cliente / Celular</th>
                                      <th className="p-3">Plan / Pantallas</th>
                                      <th className="p-3">Vendedor</th>
                                      <th className="p-3 text-right">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {approvedActivations.map((req: any) => {
                                      const isSelected = selectedActivationRequest?.id === req.id;
                                      return (
                                        <tr
                                          key={req.id}
                                          onClick={() => {
                                            setSelectedActivationRequest(req);
                                            setIsEditingRequest(false);
                                            setAdminApprovalNotes("");
                                            setApprovalUser(req.detalles?.usuario_propuesto || "");
                                            setApprovalPass(req.detalles?.contrasena_propuesta || "");
                                            const det = req.detalles || {};
                                            const matchedAcc = accounts.find(
                                              (acc: any) =>
                                                (acc.celular && det.celular && acc.celular.trim() === det.celular.trim()) ||
                                                (acc.nombre_completo && det.nombre_completo && acc.nombre_completo.toLowerCase().trim() === det.nombre_completo.toLowerCase().trim()),
                                            );
                                            if (matchedAcc) {
                                              setApprovalOperation("extend_line");
                                              setApprovalLineId(String(matchedAcc.xui_id || matchedAcc.id_linea || ""));
                                            } else {
                                              setApprovalOperation("create_line");
                                              setApprovalLineId("");
                                            }
                                          }}
                                          className={`cursor-pointer transition-all ${
                                            isSelected
                                              ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-l-4 border-l-cyan-500"
                                              : "hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                                          }`}
                                        >
                                          <td className="p-3">
                                            <div className="space-y-0.5">
                                              <p className="font-extrabold text-slate-800 dark:text-slate-100">
                                                {req.detalles?.nombre_completo || "Cliente"}
                                              </p>
                                              <p className="text-[10px] font-mono text-slate-400">
                                                {req.detalles?.celular || "Sin celular"}
                                              </p>
                                            </div>
                                          </td>
                                          <td className="p-3">
                                            <div className="space-y-0.5">
                                              <span className="inline-block px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 text-emerald-400">
                                                {req.detalles?.tipo_cuenta || "VIP"}
                                              </span>
                                              <p className="text-[10.5px] text-slate-500 font-bold mt-1">
                                                {req.detalles?.plan_nombre} ({req.detalles?.pantallas || 1} Pan)
                                              </p>
                                            </div>
                                          </td>
                                          <td className="p-3 font-medium text-slate-550">
                                            {req.reseller_usuario}
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-150 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                                              Aprobada
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                <span className="material-symbols-outlined text-4xl text-slate-350 block mb-2">check_circle</span>
                                <p className="font-bold text-slate-700 dark:text-slate-300">Sin Solicitudes Aprobadas</p>
                                <p className="text-xs text-slate-400 mt-1">No se registran solicitudes aprobadas bajo tus niveles de acceso.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. SECCIÓN HISTORIAL COMPLETO */}
                        {solicitudTab === "historial" && (
                          <div className="space-y-4 animate-fade-in">
                            {editingLabelKey === "lblHistorialLeyenda" ? (
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={editingLabelValue}
                                  onChange={(e) => setEditingLabelValue(e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-1 text-xs focus:outline-none text-slate-800 dark:text-slate-100 flex-1"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveCustomLabel("lblHistorialLeyenda", editingLabelValue)}
                                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-[9px] font-black uppercase transition-all"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingLabelKey(null)}
                                  className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px]"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5 group">
                                <span>{lblHistorialLeyenda}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      setEditingLabelKey("lblHistorialLeyenda");
                                      setEditingLabelValue(lblHistorialLeyenda);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-450 hover:text-cyan-500 transition-all rounded"
                                    title="Editar Leyenda"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                )}
                              </p>
                            )}
                            {processedActivations.length > 0 ? (
                              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {processedActivations.map((req: any) => {
                                  const isApproved = req.estado === "aprobado";
                                  const isSelected = selectedActivationRequest?.id === req.id;
                                  return (
                                    <div
                                      key={req.id}
                                      onClick={() => {
                                        setSelectedActivationRequest(req);
                                        setIsEditingRequest(false);
                                        setAdminApprovalNotes("");
                                        setApprovalUser(req.detalles?.usuario_propuesto || "");
                                        setApprovalPass(req.detalles?.contrasena_propuesta || "");
                                        const det = req.detalles || {};
                                        const matchedAcc = accounts.find(
                                          (acc: any) =>
                                            (acc.celular && det.celular && acc.celular.trim() === det.celular.trim()) ||
                                            (acc.nombre_completo && det.nombre_completo && acc.nombre_completo.toLowerCase().trim() === det.nombre_completo.toLowerCase().trim()),
                                        );
                                        if (matchedAcc) {
                                          setApprovalOperation("extend_line");
                                          setApprovalLineId(String(matchedAcc.xui_id || matchedAcc.id_linea || ""));
                                        } else {
                                          setApprovalOperation("create_line");
                                          setApprovalLineId("");
                                        }
                                      }}
                                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden cursor-pointer transition-all ${
                                        isSelected
                                          ? "ring-2 ring-cyan-500 bg-cyan-50/10 border-cyan-300"
                                          : isApproved
                                            ? "bg-emerald-50/10 border-emerald-100/30 hover:bg-emerald-50/20"
                                            : "bg-rose-50/10 border-rose-100/30 hover:bg-rose-50/20"
                                      }`}
                                    >
                                      <div className="space-y-1 text-left flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                                            {req.detalles?.nombre_completo || "Cliente"}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase shrink-0 ${
                                              isApproved
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-bold"
                                            }`}
                                          >
                                            {req.estado}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold">
                                          {req.detalles?.plan_nombre} ({req.detalles?.pantallas || 1} Pan) · Vendedor: {req.reseller_usuario}
                                        </p>
                                        {req.detalles?.notes_aprobacion && (
                                          <p className="text-slate-600 dark:text-slate-200 italic text-[10px] truncate mt-1">
                                            "Nota: {req.detalles.notes_aprobacion}"
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                <span className="material-symbols-outlined text-4xl text-slate-350 block mb-2">history</span>
                                <p className="font-bold text-slate-700 dark:text-slate-300">Historial Vacío</p>
                                <p className="text-xs text-slate-400 mt-1">No se registran solicitudes procesadas en el histórico.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ) : (
                    /* SECCIÓN: PAGO DE COMISIONES */
                    <div className="animate-fade-in space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LADO IZQUIERDO: VISTA PREVIA DETALLADA / CONCURRENCIA */}
                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm min-h-[480px] flex flex-col justify-between">
                          {!selectedCommissionPayout && !selectedPaidCommissionItem ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                              <div className="size-16 rounded-3xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-600">
                                <span className="material-symbols-outlined text-4xl">payments</span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                                  Ninguna solicitud seleccionada
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                  Selecciona una solicitud de cobro de comisiones para auditar al vendedor, ver el desglose detallado de ventas, y adjuntar el comprobante de transferencia.
                                </p>
                              </div>
                            </div>
                          ) : selectedPaidCommissionItem ? (
                            /* VISTA PREVIA DE UN ÍTEM YA PAGADO (HISTORIAL) */
                            <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                  <div>
                                    <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">Historial de Pago</span>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Comisión Liquidada</h4>
                                  </div>
                                  <button
                                    onClick={() => setSelectedPaidCommissionItem(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold">Beneficiario:</span>
                                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedPaidCommissionItem.type === "vendedor" ? selectedPaidCommissionItem.sellerName : selectedPaidCommissionItem.recruiterName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold">Email:</span>
                                      <span className="font-mono text-slate-600 dark:text-slate-300">{selectedPaidCommissionItem.type === "vendedor" ? selectedPaidCommissionItem.seller : selectedPaidCommissionItem.recruiter}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold">Monto Liquidado:</span>
                                      <span className="font-extrabold text-emerald-600">${selectedPaidCommissionItem.amountPaid} ARS</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold">Fecha de Pago:</span>
                                      <span>{new Date(selectedPaidCommissionItem.pagado_al).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold">Rol en Transacción:</span>
                                      <span className="capitalize font-extrabold text-slate-600 dark:text-slate-400">{selectedPaidCommissionItem.type}</span>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                    <p className="font-black text-[10px] uppercase text-slate-400">Detalles de Venta Original</p>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Cliente de Línea:</span>
                                      <span className="font-bold">{selectedPaidCommissionItem.cliente_nombre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Plan de IPTV:</span>
                                      <span className="font-bold">{selectedPaidCommissionItem.plan_nombre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">ID del Cliente:</span>
                                      <span className="font-mono">{selectedPaidCommissionItem.cliente_id}</span>
                                    </div>
                                  </div>

                                  {selectedPaidCommissionItem.comprobante_img && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Comprobante de Transferencia</span>
                                      <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900">
                                        <img
                                          src={selectedPaidCommissionItem.comprobante_img}
                                          alt="Comprobante"
                                          className="w-full max-h-[180px] object-contain mx-auto"
                                        />
                                        <button
                                          onClick={() => {
                                            const w = window.open("");
                                            if (w) w.document.write(`<img src="${selectedPaidCommissionItem.comprobante_img}" style="max-width:100%; max-height:100vh; display:block; margin:auto;"/>`);
                                          }}
                                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                                        >
                                          <span className="material-symbols-outlined mr-1">visibility</span> Ver Pantalla Completa
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedPaidCommissionItem(null)}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all"
                              >
                                Cerrar Detalle de Historial
                              </button>
                            </div>
                          ) : (
                            /* VISTA PREVIA DE UNA SOLICITUD PENDIENTE/EN PROCESO (CON BOTÓN DE PAGO Y CONCURRENCIA) */
                            (() => {
                              const lock = systemConfig?.commission_locks?.[selectedCommissionPayout.requesterEmail];
                              const isLockedByMe = lock && lock.locked_by === user?.email;
                              return (
                                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                      <div>
                                        <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Vista Previa Protegida</span>
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Auditar Comisión</h4>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          if (isLockedByMe) {
                                            const updatedLocks = { ...systemConfig?.commission_locks };
                                            delete updatedLocks[selectedCommissionPayout.requesterEmail];
                                            const updatedConfig = { ...systemConfig, commission_locks: updatedLocks };
                                            await apiService.updateSystemConfig(updatedConfig);
                                            setSystemConfig(updatedConfig);
                                            toast.success("Solicitud liberada correctamente.");
                                          }
                                          setSelectedCommissionPayout(null);
                                        }}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50"
                                      >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                      </button>
                                    </div>

                                    <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                                      isLockedByMe
                                        ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                        : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                                    }`}>
                                      <span className="material-symbols-outlined text-sm animate-pulse">
                                        {isLockedByMe ? "lock_open" : "lock"}
                                      </span>
                                      <div>
                                        <p className="font-bold">
                                          {isLockedByMe ? "🔒 Tienes el control exclusivo" : "⚠️ Bloqueada por otro operador"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                          {isLockedByMe
                                            ? "Ningún otro operador podrá pagarle a este usuario mientras tengas esta pestaña abierta."
                                            : `Esta solicitud está en tratamiento por ${lock?.locked_by || "otro administrador"}.`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                      <p className="font-black text-[10px] uppercase text-slate-400">Datos del Vendedor</p>
                                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                                        <p className="font-black text-slate-900 dark:text-white text-sm">
                                          {selectedCommissionPayout.requesterName}
                                        </p>
                                        <p className="text-slate-500 font-mono text-[10px]">{selectedCommissionPayout.requesterEmail}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <p className="font-black text-[10px] uppercase text-slate-400">Líneas a Liquidar ({selectedCommissionPayout.items.length})</p>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                          Total: ${selectedCommissionPayout.totalRequested} ARS
                                        </span>
                                      </div>
                                      
                                      <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedCommissionPayout.items.map((item: any, idx: number) => (
                                          <div key={idx} className="pt-1.5 flex justify-between items-start text-xs">
                                            <div>
                                              <p className="font-extrabold text-slate-950 dark:text-white">{item.cliente_nombre}</p>
                                              <p className="text-[9px] text-slate-400">
                                                {item.plan_nombre} · Rol: <span className="capitalize font-bold">{item.type}</span>
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-black text-slate-900 dark:text-white">${item.amountToPay} ARS</p>
                                              {item.comprobanteImg ? (
                                                <button
                                                  onClick={() => {
                                                    const w = window.open("");
                                                    if (w) w.document.write(`<img src="${item.comprobanteImg}" style="max-width:100%; max-height:100vh; display:block; margin:auto;"/>`);
                                                  }}
                                                  className="text-[9px] text-cyan-600 hover:underline font-bold flex items-center justify-end gap-0.5 mt-0.5 ml-auto"
                                                >
                                                  <span className="material-symbols-outlined text-[10px]">image</span> Comprobante
                                                </button>
                                              ) : (
                                                <span className="text-[9px] text-slate-400 italic">Sin comprobante</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {isLockedByMe && (
                                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                      <button
                                        onClick={() => {
                                          setPayoutProofImage("");
                                          setPayoutRefNotes("");
                                          setShowPayoutConfirmModal(true);
                                        }}
                                        className="w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                      >
                                        ⚖️ Confirmar Transferencia y Liquidar
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const updatedLocks = { ...systemConfig?.commission_locks };
                                          delete updatedLocks[selectedCommissionPayout.requesterEmail];
                                          const updatedConfig = { ...systemConfig, commission_locks: updatedLocks };
                                          await apiService.updateSystemConfig(updatedConfig);
                                          setSystemConfig(updatedConfig);
                                          setSelectedCommissionPayout(null);
                                          toast.success("Has cancelado el proceso y liberado la orden.");
                                        }}
                                        className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                                      >
                                        Liberar y Cerrar Vista Previa
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* LADO DERECHO: LA BANDEJA DE TABLAS */}
                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 text-base">
                                  {lblComisionesTitle}
                                </h3>
                                <button
                                  onClick={() => {
                                    setEditingLabelKey("lblComisionesTitle");
                                    setEditingLabelValue(lblComisionesTitle);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                  title="Editar título"
                                >
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500">
                                  {lblComisionesSubtitle}
                                </p>
                                <button
                                  onClick={() => {
                                    setEditingLabelKey("lblComisionesSubtitle");
                                    setEditingLabelValue(lblComisionesSubtitle);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                  title="Editar subtítulo"
                                >
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex border-b border-slate-100 dark:border-slate-800/80 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                            <button
                              onClick={() => {
                                setCommissionPayoutTab("pendientes");
                                setSelectedCommissionPayout(null);
                              }}
                              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                commissionPayoutTab === "pendientes"
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                  : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300"
                              }`}
                            >
                              ⏳ Pendientes
                            </button>
                            <button
                              onClick={() => {
                                setCommissionPayoutTab("en_proceso");
                                setSelectedCommissionPayout(null);
                              }}
                              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                commissionPayoutTab === "en_proceso"
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                  : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300"
                              }`}
                            >
                              🔒 En Proceso
                            </button>
                            <button
                              onClick={() => {
                                setCommissionPayoutTab("historial");
                                setSelectedCommissionPayout(null);
                              }}
                              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                commissionPayoutTab === "historial"
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                  : "text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300"
                              }`}
                            >
                              📜 Historial
                            </button>
                          </div>

                          <div>
                            {commissionPayoutTab === "pendientes" && (() => {
                              const groupedPendingPayouts: Record<string, any> = {};
                              allCommissionRows.forEach((row) => {
                                const lock = systemConfig?.commission_locks?.[row.seller];
                                const isLockedByOtherSeller = lock && lock.locked_by !== user?.email;
                                
                                if (row.isSellerRequested && !row.isSellerPaid && !isLockedByOtherSeller) {
                                  const email = row.seller;
                                  if (!groupedPendingPayouts[email]) {
                                    groupedPendingPayouts[email] = {
                                      requesterEmail: email,
                                      requesterName: row.sellerName || email,
                                      totalRequested: 0,
                                      items: []
                                    };
                                  }
                                  groupedPendingPayouts[email].totalRequested += row.vComm;
                                  groupedPendingPayouts[email].items.push({
                                    ...row,
                                    type: "vendedor",
                                    amountToPay: row.vComm
                                  });
                                }

                                const lockRecr = row.recruiter ? systemConfig?.commission_locks?.[row.recruiter] : null;
                                const isLockedByOtherRecr = lockRecr && lockRecr.locked_by !== user?.email;

                                if (row.isRecruiterRequested && !row.isRecruiterPaid && row.recruiter && !isLockedByOtherRecr) {
                                  const email = row.recruiter;
                                  if (!groupedPendingPayouts[email]) {
                                    groupedPendingPayouts[email] = {
                                      requesterEmail: email,
                                      requesterName: row.recruiterName || email,
                                      totalRequested: 0,
                                      items: []
                                    };
                                  }
                                  groupedPendingPayouts[email].totalRequested += row.rComm;
                                  groupedPendingPayouts[email].items.push({
                                    ...row,
                                    type: "reclutador",
                                    amountToPay: row.rComm
                                  });
                                }
                              });

                              const pendingPayoutList = Object.values(groupedPendingPayouts);

                              return (
                                <div className="space-y-4">
                                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                    Solicitudes de cobro activas listas para transferir:
                                  </p>

                                  {pendingPayoutList.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                            <th className="p-3 text-[10px] uppercase font-bold">Vendedor / Solicitante</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Total Líneas</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Monto Total</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Operación</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                          {pendingPayoutList.map((payout: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                              <td className="p-3">
                                                <p className="font-extrabold text-slate-950 dark:text-white">{payout.requesterName}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{payout.requesterEmail}</p>
                                              </td>
                                              <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">
                                                {payout.items.length}
                                              </td>
                                              <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">
                                                ${payout.totalRequested} ARS
                                              </td>
                                              <td className="p-3 text-right">
                                                <button
                                                  onClick={async () => {
                                                    const lock = systemConfig?.commission_locks?.[payout.requesterEmail];
                                                    if (lock && lock.locked_by !== user?.email) {
                                                      toast.error(`Esta orden está bloqueada por ${lock.locked_by}. No puedes tomarla.`);
                                                      return;
                                                    }

                                                    const updatedLocks = {
                                                      ...(systemConfig?.commission_locks || {}),
                                                      [payout.requesterEmail]: {
                                                        locked_by: user?.email || "admin@gmail.com",
                                                        locked_at: new Date().toISOString()
                                                      }
                                                    };
                                                    const updatedConfig = {
                                                      ...systemConfig,
                                                      commission_locks: updatedLocks
                                                    };
                                                    await apiService.updateSystemConfig(updatedConfig);
                                                    setSystemConfig(updatedConfig);
                                                    setSelectedCommissionPayout(payout);
                                                    toast.success("Has tomado la orden. Vista previa protegida en vivo.");
                                                  }}
                                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-[11px] font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                                                >
                                                  <span className="material-symbols-outlined text-[12px]">visibility</span> Aceptar y ver
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">payments</span>
                                      <p className="font-bold text-slate-700 dark:text-slate-300">Sin Solicitudes Pendientes</p>
                                      <p className="text-xs text-slate-400 mt-1">Los vendedores no han solicitado cobros de comisiones pendientes por el momento.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {commissionPayoutTab === "en_proceso" && (() => {
                              const isUserAdmin = isAdmin;
                              const userEmailLower = (user?.email || "").toLowerCase().trim();
                              const activeLocks = systemConfig?.commission_locks || {};
                              const groupedInProcessPayouts: Record<string, any> = {};

                              allCommissionRows.forEach((row) => {
                                const lock = activeLocks[row.seller];
                                
                                if (row.isSellerRequested && !row.isSellerPaid) {
                                  const email = row.seller;
                                  const isLocked = !!lock;
                                  
                                  if ((isUserAdmin && isLocked) || (!isUserAdmin && email === userEmailLower)) {
                                    if (!groupedInProcessPayouts[email]) {
                                      groupedInProcessPayouts[email] = {
                                        requesterEmail: email,
                                        requesterName: row.sellerName || email,
                                        totalRequested: 0,
                                        items: [],
                                        lock: lock || null
                                      };
                                    }
                                    groupedInProcessPayouts[email].totalRequested += row.vComm;
                                    groupedInProcessPayouts[email].items.push({
                                      ...row,
                                      type: "vendedor",
                                      amountToPay: row.vComm
                                    });
                                  }
                                }

                                const lockRecr = row.recruiter ? activeLocks[row.recruiter] : null;
                                if (row.isRecruiterRequested && !row.isRecruiterPaid && row.recruiter) {
                                  const email = row.recruiter;
                                  const isLocked = !!lockRecr;

                                  if ((isUserAdmin && isLocked) || (!isUserAdmin && email === userEmailLower)) {
                                    if (!groupedInProcessPayouts[email]) {
                                      groupedInProcessPayouts[email] = {
                                        requesterEmail: email,
                                        requesterName: row.recruiterName || email,
                                        totalRequested: 0,
                                        items: [],
                                        lock: lockRecr || null
                                      };
                                    }
                                    groupedInProcessPayouts[email].totalRequested += row.rComm;
                                    groupedInProcessPayouts[email].items.push({
                                      ...row,
                                      type: "reclutador",
                                      amountToPay: row.rComm
                                    });
                                  }
                                }
                              });

                              const inProcessPayoutList = Object.values(groupedInProcessPayouts);

                              return (
                                <div className="space-y-4">
                                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                    {isUserAdmin ? "Solicitudes que están siendo procesadas en vivo por los administradores:" : "Mis solicitudes de cobro enviadas y su estado de procesamiento:"}
                                  </p>

                                  {inProcessPayoutList.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                            <th className="p-3 text-[10px] uppercase font-bold">Vendedor</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Líneas</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Monto</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Estado / Operador</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                          {inProcessPayoutList.map((payout: any, idx: number) => {
                                            const isLockedByMe = payout.lock && payout.lock.locked_by === user?.email;
                                            return (
                                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                <td className="p-3">
                                                  <p className="font-extrabold text-slate-950 dark:text-white">{payout.requesterName}</p>
                                                  <p className="text-[10px] text-slate-400 font-mono">{payout.requesterEmail}</p>
                                                </td>
                                                <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">
                                                  {payout.items.length}
                                                </td>
                                                <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                                                  ${payout.totalRequested} ARS
                                                </td>
                                                <td className="p-3 text-center">
                                                  {payout.lock ? (
                                                    <div className="space-y-0.5">
                                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded text-[9px] font-black uppercase tracking-wider">
                                                        🔒 En Tratamiento
                                                      </span>
                                                      <p className="text-[9px] text-slate-400 font-medium">Por: {payout.lock.locked_by === user?.email ? "Mí mismo" : payout.lock.locked_by}</p>
                                                    </div>
                                                  ) : (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-wider">
                                                      ⏳ Esperando Operador
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-3 text-right">
                                                  {isUserAdmin ? (
                                                    <div className="flex justify-end gap-1.5">
                                                      <button
                                                        onClick={() => setSelectedCommissionPayout(payout)}
                                                        className="px-2.5 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-extrabold rounded-lg shadow-sm"
                                                      >
                                                        Ver Detalle
                                                      </button>
                                                      {isLockedByMe && (
                                                        <button
                                                          onClick={async () => {
                                                            const updatedLocks = { ...systemConfig?.commission_locks };
                                                            delete updatedLocks[payout.requesterEmail];
                                                            const updatedConfig = { ...systemConfig, commission_locks: updatedLocks };
                                                            await apiService.updateSystemConfig(updatedConfig);
                                                            setSystemConfig(updatedConfig);
                                                            setSelectedCommissionPayout(null);
                                                            toast.success("Has liberado el bloqueo de esta orden.");
                                                          }}
                                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold rounded-lg"
                                                        >
                                                          Liberar
                                                        </button>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    !payout.lock ? (
                                                      <button
                                                        onClick={async () => {
                                                          const confirmCancel = window.confirm("¿Seguro que deseas cancelar la solicitud de cobro de comisiones para estas líneas? Volverán a estar seleccionables.");
                                                          if (!confirmCancel) return;

                                                          try {
                                                            const updatedPagos = [...finanzasComisionesPagos];
                                                            for (const it of payout.items) {
                                                              const existingIdx = updatedPagos.findIndex(p => p.cliente_id === it.cliente_id);
                                                              if (existingIdx !== -1) {
                                                                const record = updatedPagos[existingIdx];
                                                                if (it.type === "vendedor") {
                                                                  record.solicitado_vendedor = false;
                                                                  record.solicitado_vendedor_al = null;
                                                                } else {
                                                                  record.solicitado_reclutador = false;
                                                                  record.solicitado_reclutador_al = null;
                                                                }
                                                                if (!record.solicitado_vendedor && !record.solicitado_reclutador) {
                                                                  record.estado_pago = "pendiente";
                                                                }
                                                                await supabase.from("iptv_finanzas_comisiones").upsert([record]);
                                                              }
                                                            }
                                                            setFinanzasComisionesPagos(updatedPagos);
                                                            localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(updatedPagos));
                                                            toast.success("Solicitud de cobro cancelada correctamente. Las comisiones vuelven a estar seleccionables.");
                                                          } catch (error) {
                                                            toast.error("Error al cancelar la solicitud.");
                                                          }
                                                        }}
                                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-[10px] font-black rounded-lg"
                                                      >
                                                        ❌ Cancelar Cobro
                                                      </button>
                                                    ) : (
                                                      <span className="text-[10px] text-slate-400 italic">🔒 Bloqueado por Pago</span>
                                                    )
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">lock_clock</span>
                                      <p className="font-bold text-slate-700 dark:text-slate-300">Sin Solicitudes en Proceso</p>
                                      <p className="text-xs text-slate-400 mt-1">Ninguna solicitud de cobro está en tratamiento por el momento.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {commissionPayoutTab === "historial" && (() => {
                              const paidCommissionItems: any[] = [];
                              allCommissionRows.forEach((row) => {
                                if (row.isSellerPaid && row.requestedSellerAt) {
                                  paidCommissionItems.push({
                                    ...row,
                                    type: "vendedor",
                                    amountPaid: row.vComm,
                                    pagado_al: row.paymentRecord?.pagado_vendedor_al || row.creado_al,
                                    comprobante_img: row.paymentRecord?.comprobante_img || row.comprobanteImg
                                  });
                                }
                                if (row.isRecruiterPaid && row.requestedRecruiterAt && row.recruiter) {
                                  paidCommissionItems.push({
                                    ...row,
                                    type: "reclutador",
                                    amountPaid: row.rComm,
                                    pagado_al: row.paymentRecord?.pagado_reclutador_al || row.creado_al,
                                    comprobante_img: row.paymentRecord?.comprobante_img || row.comprobanteImg
                                  });
                                }
                              });

                              paidCommissionItems.sort((a, b) => new Date(b.pagado_al).getTime() - new Date(a.pagado_al).getTime());

                              return (
                                <div className="space-y-4">
                                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                    Historial de transferencias liquidadas con éxito:
                                  </p>

                                  {paidCommissionItems.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                            <th className="p-3 text-[10px] uppercase font-bold">Fecha / Hora</th>
                                            <th className="p-3 text-[10px] uppercase font-bold">Solicitante</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Monto Pagado</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Tipo</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                          {paidCommissionItems.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                              <td className="p-3 text-[11px]">
                                                {new Date(item.pagado_al).toLocaleString()}
                                              </td>
                                              <td className="p-3">
                                                <p className="font-extrabold text-slate-950 dark:text-white">
                                                  {item.type === "vendedor" ? item.sellerName : item.recruiterName}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-mono">
                                                  {item.type === "vendedor" ? item.seller : item.recruiter}
                                                </p>
                                              </td>
                                              <td className="p-3 text-right font-black text-emerald-600">
                                                ${item.amountPaid} ARS
                                              </td>
                                              <td className="p-3 text-center">
                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold capitalize text-[10px]">
                                                  {item.type}
                                                </span>
                                              </td>
                                              <td className="p-3 text-right">
                                                <button
                                                  onClick={() => {
                                                    setSelectedCommissionPayout(null);
                                                    setSelectedPaidCommissionItem(item);
                                                  }}
                                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-[10px] font-extrabold rounded-lg flex items-center gap-1.5 ml-auto"
                                                >
                                                  <span className="material-symbols-outlined text-[12px]">visibility</span> Ver Comprobante
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                      <span className="material-symbols-outlined text-4xl text-slate-350 block mb-2">history</span>
                                      <p className="font-bold text-slate-700 dark:text-slate-300">Historial Vacío</p>
                                      <p className="text-xs text-slate-400 mt-1">No se registran comisiones liquidadas en el histórico por el momento.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* E. WIDGET: MIS CLIENTES (ACTIVOS Y DEMOS EXPIRADAS) */}
          {currentMenu === "mis_clientes" &&
            (() => {
              // Obtener herencia de roles para filtrar de forma jerárquica
              const savedInheritance = localStorage.getItem('g3d_roles_inheritance');
              const roleInheritance = savedInheritance ? JSON.parse(savedInheritance) : {};

              const isDescendantRole = (child: string, parent: string): boolean => {
                if (!child || !parent) return false;
                let current = child.trim().toLowerCase();
                const p = parent.trim().toLowerCase();
                if (current === p) return false;
                let visited = new Set<string>();
                while (current && !visited.has(current)) {
                  visited.add(current);
                  const matchedKey = Object.keys(roleInheritance).find(k => k.trim().toLowerCase() === current);
                  if (!matchedKey) break;
                  const parentRole = roleInheritance[matchedKey];
                  if (!parentRole) break;
                  const parentLower = parentRole.trim().toLowerCase();
                  if (parentLower === p) return true;
                  current = parentLower;
                }
                return false;
              };

              const currentUserRole = simulatedRole || userRole || "";

              // Filtrar según permisos de visibilidad de clientes
              const myClients = accounts.filter((acc: any) => {
                if (isAdmin) return true;

                const creadoPorLower = (acc.creado_por || "").trim().toLowerCase();
                const userEmailLower = (user?.email || "").trim().toLowerCase();

                // Caso 1: Es dueño
                if (creadoPorLower === userEmailLower) return true;

                // Caso 2: Permiso para ver clientes de roles hijo
                if (hasPermission("Iptv.Clientes.VerHijos")) {
                  const creatorUser = panelUsers.find(
                    (u: any) => u.usuario.trim().toLowerCase() === creadoPorLower
                  );
                  const creatorRole = creatorUser ? creatorUser.rol || "" : "";
                  if (isDescendantRole(creatorRole, currentUserRole)) {
                    return true;
                  }
                }

                // Caso 3: Permiso para ver solo propios (si no se cumple lo anterior)
                if (hasPermission("Iptv.Clientes.VerPropios")) {
                  return creadoPorLower === userEmailLower;
                }

                // Por defecto, si tiene acceso general de Ver pero no restricciones, puede ver todo
                return true;
              });

              // Filtrar según estado / tipo de membresía
              const filteredClients = myClients.filter((acc: any) => {
                // Búsqueda textual
                const textMatches =
                  (acc.nombre_completo || "")
                    .toLowerCase()
                    .includes(mcSearch.toLowerCase()) ||
                  (acc.username || "")
                    .toLowerCase()
                    .includes(mcSearch.toLowerCase()) ||
                  (acc.celular || "")
                    .toLowerCase()
                    .includes(mcSearch.toLowerCase());

                if (!textMatches) return false;

                // Filtro de categorías
                const isExpired =
                  acc.fecha_vencimiento &&
                  new Date(acc.fecha_vencimiento).getTime() < Date.now();
                const isDemo = !acc.id_plan_venta; // Si no tiene plan de venta asignado es demo

                if (mcFilter === "activos") {
                  return !isExpired;
                } else if (mcFilter === "expirados") {
                  return isExpired;
                } else if (mcFilter === "demos") {
                  return isDemo;
                } else if (mcFilter === "vips") {
                  return !isDemo;
                }
                return true;
              });

              // Contadores para las pestañas
              const countAll = myClients.length;
              const countActivos = myClients.filter(
                (acc: any) =>
                  !acc.fecha_vencimiento ||
                  new Date(acc.fecha_vencimiento).getTime() >= Date.now(),
              ).length;
              const countExpirados = myClients.filter(
                (acc: any) =>
                  acc.fecha_vencimiento &&
                  new Date(acc.fecha_vencimiento).getTime() < Date.now(),
              ).length;
              const countDemos = myClients.filter(
                (acc: any) => !acc.id_plan_venta,
              ).length;
              const countVips = myClients.filter(
                (acc: any) => acc.id_plan_venta,
              ).length;

              return (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                    {/* Encabezado */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                      <div className="text-left">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="text-blue-500" size={20} />
                          Mis Clientes Propios
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Visualiza, busca y copia las credenciales de tus
                          cuentas activas o demos (posiblemente ya expiradas)
                          creadas desde tu panel.
                        </p>
                      </div>
                    </div>

                    {/* Barra de Filtros y Búsqueda */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                      {/* Buscador */}
                      <div className="relative flex-1 max-w-md">
                        <Search
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Buscar por cliente, usuario o celular..."
                          value={mcSearch}
                          onChange={(e) => setMcSearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs text-slate-800 dark:text-slate-100"
                        />
                        {mcSearch && (
                          <button
                            onClick={() => setMcSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filtros rápidos con contadores */}
                      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        <button
                          onClick={() => setMcFilter("todos")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            mcFilter === "todos"
                              ? "bg-slate-900 text-white dark:bg-slate-800"
                              : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Todos ({countAll})
                        </button>
                        <button
                          onClick={() => setMcFilter("activos")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            mcFilter === "activos"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Activos ({countActivos})
                        </button>
                        <button
                          onClick={() => setMcFilter("expirados")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            mcFilter === "expirados"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Expirados ({countExpirados})
                        </button>
                        <button
                          onClick={() => setMcFilter("demos")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            mcFilter === "demos"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Solo Demos ({countDemos})
                        </button>
                        <button
                          onClick={() => setMcFilter("vips")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            mcFilter === "vips"
                              ? "bg-purple-600 text-white"
                              : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Solo VIPs ({countVips})
                        </button>
                      </div>
                    </div>

                    {/* Panel de Acción en Lote para Multiselección */}
                    {selectedClients.length > 0 && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                            Has seleccionado{" "}
                            <span className="font-black underline">
                              {selectedClients.length}
                            </span>{" "}
                            {selectedClients.length === 1
                              ? "cliente"
                              : "clientes"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedClients([])}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDeleteClients(selectedClients)}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-black hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-650/20"
                          >
                            <Trash2 size={13} />
                            Eliminar Seleccionados
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tabla de Clientes */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800">
                      {filteredClients.length > 0 ? (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                              <th className="p-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    filteredClients.length > 0 &&
                                    filteredClients.every((acc: any) =>
                                      selectedClients.includes(acc.username),
                                    )
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Agregar todos los visibles
                                      const visibleUsernames =
                                        filteredClients.map(
                                          (acc: any) => acc.username,
                                        );
                                      setSelectedClients((prev) => {
                                        const union = new Set([
                                          ...prev,
                                          ...visibleUsernames,
                                        ]);
                                        return Array.from(union);
                                      });
                                    } else {
                                      // Quitar los visibles
                                      const visibleUsernames =
                                        filteredClients.map(
                                          (acc: any) => acc.username,
                                        );
                                      setSelectedClients((prev) =>
                                        prev.filter(
                                          (u) => !visibleUsernames.includes(u),
                                        ),
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-600 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </th>
                              <th className="p-3">Cliente / Celular</th>
                              <th className="p-3">Usuario / Contraseña</th>
                              <th className="p-3">Plan Contratado</th>
                              <th className="p-3">Vencimiento</th>
                              <th className="p-3">
                                <div className="flex items-center gap-1">
                                  <span>Comisión</span>
                                  <button
                                    onClick={() =>
                                      setShowCommissions(!showCommissions)
                                    }
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                                    title={
                                      showCommissions
                                        ? "Ocultar Comisión"
                                        : "Ver Comisión"
                                    }
                                  >
                                    {showCommissions ? (
                                      <EyeOff size={12} />
                                    ) : (
                                      <Eye size={12} />
                                    )}
                                  </button>
                                </div>
                              </th>
                              <th className="p-3">Precio Plan</th>
                              <th className="p-3">Estado</th>
                              <th className="p-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredClients.map((acc: any) => {
                              const isExpired =
                                acc.fecha_vencimiento &&
                                new Date(acc.fecha_vencimiento).getTime() <
                                  Date.now();
                              const isDemo = !acc.id_plan_venta;
                              const isSelected = selectedClients.includes(
                                acc.username,
                              );

                              // Obtener datos del plan de venta asignado
                              const assignedPlan = salePlans.find(
                                (p: any) => p.id === acc.id_plan_venta,
                              );
                              const planName = assignedPlan
                                ? assignedPlan.name
                                : acc.id_plan_venta
                                  ? `Plan ${acc.id_plan_venta}`
                                  : "Demo gratis";
                              const planPrice = assignedPlan
                                ? assignedPlan.price || 0
                                : 0;
                              const planCommission = assignedPlan
                                ? assignedPlan.comision || 0
                                : 0;

                              // Formatear fecha
                              let expiryLabel = "Sin Límite";
                              if (acc.fecha_vencimiento) {
                                const d = new Date(acc.fecha_vencimiento);
                                expiryLabel =
                                  d.toLocaleDateString() +
                                  " " +
                                  d.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                              }

                              return (
                                <tr
                                  key={acc.username}
                                  className={`transition-colors ${
                                    isSelected
                                      ? "bg-rose-50/40 dark:bg-rose-950/5"
                                      : "hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedClients((prev) => [
                                            ...prev,
                                            acc.username,
                                          ]);
                                        } else {
                                          setSelectedClients((prev) =>
                                            prev.filter(
                                              (u) => u !== acc.username,
                                            ),
                                          );
                                        }
                                      }}
                                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-600 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 text-left">
                                    <div className="space-y-0.5">
                                      <p className="font-extrabold text-slate-800 dark:text-slate-100">
                                        {acc.nombre_completo || "Cliente"}
                                      </p>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] text-slate-450 font-bold">
                                          {acc.celular || "Sin teléfono"}
                                        </p>
                                        {acc.celular && (
                                          <a
                                            href={`https://wa.me/${acc.celular.replace(/[^0-9]/g, "")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-md hover:scale-105 transition-transform"
                                            title="Contactar por WhatsApp"
                                          >
                                            <Send size={10} />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400">
                                          U:
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 select-all">
                                          {acc.username}
                                        </span>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              acc.username,
                                            );
                                            toast.success("Usuario copiado");
                                          }}
                                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600"
                                        >
                                          <Copy size={11} />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400">
                                          P:
                                        </span>
                                        <PasswordCell
                                          value={acc.password}
                                          onCopy={(t, msg) => {
                                            navigator.clipboard.writeText(t);
                                            toast.success(
                                              msg || "Contraseña copiada",
                                            );
                                          }}
                                        />
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              acc.password,
                                            );
                                            toast.success("Contraseña copiada");
                                          }}
                                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600"
                                        >
                                          <Copy size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-0.5 text-left">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                                          isDemo
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                            : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                                        }`}
                                      >
                                        {planName}
                                      </span>
                                      <p className="text-[10px] text-slate-450 font-bold">
                                        {acc.limite_pantallas || 2} Pantallas
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                      <Clock
                                        size={11}
                                        className="text-slate-400"
                                      />
                                      <span>{expiryLabel}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-250">
                                    {showCommissions ? (
                                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                        ${planCommission.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 select-none">
                                        ••••
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                    ${planPrice.toLocaleString()}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                        isExpired
                                          ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      }`}
                                    >
                                      {isExpired ? "Expirado" : "Activo"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div
                                      className="flex items-center justify-end gap-1.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Botón Editar - Solo visible para Administradores */}
                                      {isAdmin && (
                                        <button
                                          onClick={() =>
                                            startEditingClient(acc)
                                          }
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
                                          title="Editar Cliente"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                      )}

                                      {/* Botón Renovar - Disponible para todos */}
                                      <button
                                        onClick={() => {
                                          setSelectedClientForDetails(acc);
                                          setRequestRenewClient(acc);
                                          setRenewStep("details");
                                          setSelectedPlanForRenew(null);
                                          setRequestRenewComprobante(null);
                                          setRequestRenewComments("");
                                          setRequestRenewPlanId(
                                            acc.id_plan_venta || "",
                                          );
                                          setCurrentMenu("renovaciones");
                                        }}
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                                        title="Renovar Cliente"
                                      >
                                        <RefreshCw size={11} />
                                      </button>

                                      {/* Botón Eliminar - Solo visible para Administradores */}
                                      {isAdmin && (
                                        <button
                                          onClick={() => handleDeleteClients([acc.username])}
                                          className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/50 dark:border-rose-900/30"
                                          title="Eliminar Cliente"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <Users
                            size={32}
                            className="mx-auto text-slate-300 dark:text-slate-700"
                          />
                          <p className="text-xs font-bold uppercase tracking-wider">
                            No se encontraron clientes
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Prueba cambiando el filtro o realizando una búsqueda
                            diferente.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* F. SECCIÓN DE FINANZAS Y RED DE RECLUTAMIENTO DE REVENDEDORES (XTV) */}
          {currentMenu === "finanzas_vendedores" &&
            (() => {
              const sellerEmailLower = (user?.email || "").toLowerCase().trim();
              const isUserAdmin = isAdmin;
              const activeUserName = panelUsers.find(u => u.usuario.trim().toLowerCase() === sellerEmailLower)?.nombre || capitalizeName(sellerEmailLower);

              // Construir mapa de reclutadores
              const recruiterMap = new Map<string, string>();
              vendedoresRelaciones.forEach(r => {
                if (r.invited_email && r.inviter_email) {
                  recruiterMap.set(r.invited_email.toLowerCase().trim(), r.inviter_email.toLowerCase().trim());
                }
              });

              // Mapeo completo de comisiones por cliente (excluyendo demos)
              const allCommissionRows = accounts
                .filter((acc: any) => {
                  const plan = salePlans.find((p: any) => String(p.id) === String(acc.id_plan_venta));
                  const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";
                  const usernameLower = (acc.username || "").toLowerCase().trim();
                  const planNameLower = (planNombre || "").toLowerCase().trim();
                  const isDemo = usernameLower.startsWith("demo") || planNameLower.includes("demo");
                  return !isDemo;
                })
                .map((acc: any) => {
                  const seller = (acc.creado_por || "").toLowerCase().trim();
                  const recruiter = recruiterMap.get(seller) || "";
                  
                  const plan = salePlans.find((p: any) => String(p.id) === String(acc.id_plan_venta));
                  const planComm = plan && Number(plan.comision) > 0 ? Number(plan.comision) : 5000;
                  
                  const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";
                  const totalComm = planComm;
                  
                  const defaultSellerComm = Math.round(planComm * 0.8);
                  const defaultRecruiterComm = Math.round(planComm * 0.2);

                  const sellerProfile = panelUsers.find(u => u.usuario.trim().toLowerCase() === seller);
                  const sellerName = sellerProfile ? sellerProfile.nombre : capitalizeName(seller);

                  const recruiterProfile = recruiter ? panelUsers.find(u => u.usuario.trim().toLowerCase() === recruiter) : null;
                  const recruiterName = recruiterProfile ? recruiterProfile.nombre : (recruiter ? capitalizeName(recruiter) : "Directo (Sin Red)");

                  const payment = finanzasComisionesPagos.find((p: any) => p.cliente_id === acc.username);
                  
                  const isSellerPaid = payment ? (payment.estado_pago === 'vendedor_pagado' || payment.estado_pago === 'completo') : false;
                  const isRecruiterPaid = payment ? (payment.estado_pago === 'reclutador_pagado' || payment.estado_pago === 'completo') : false;
                  const isFullyPaid = payment ? (payment.estado_pago === 'completo') : false;

                  const vComm = payment ? Number(payment.comision_vendedor) : defaultSellerComm;
                  const rComm = payment ? Number(payment.comision_reclutador) : defaultRecruiterComm;

                  const vAbonado = payment
                    ? (payment.vendedor_abonado !== undefined && payment.vendedor_abonado !== null
                        ? Number(payment.vendedor_abonado)
                        : (isSellerPaid ? vComm : 0))
                    : 0;

                  const rAbonado = payment
                    ? (payment.reclutador_abonado !== undefined && payment.reclutador_abonado !== null
                        ? Number(payment.reclutador_abonado)
                        : (isRecruiterPaid ? rComm : 0))
                    : 0;

                  const vSaldo = Math.max(0, vComm - vAbonado);
                  const rSaldo = Math.max(0, rComm - rAbonado);

                  const isSellerParcial = vAbonado > 0 && vAbonado < vComm;
                  const isRecruiterParcial = rAbonado > 0 && rAbonado < rComm;

                  const isSellerRequested = payment ? !!payment.solicitado_vendedor : false;
                  const isRecruiterRequested = payment ? !!payment.solicitado_reclutador : false;
                  const requestedSellerAt = payment ? payment.solicitado_vendedor_al : null;
                  const requestedRecruiterAt = payment ? payment.solicitado_reclutador_al : null;
                  const comprobanteImg = payment ? payment.comprobante_img || "" : "";
                  const notes = payment ? payment.notes || "" : "";

                  return {
                    cliente_id: acc.username,
                    cliente_nombre: acc.nombre_completo || acc.username,
                    plan_nombre: planNombre,
                    seller,
                    sellerName,
                    recruiter,
                    recruiterName,
                    totalComm,
                    vComm,
                    rComm,
                    vAbonado,
                    rAbonado,
                    vSaldo,
                    rSaldo,
                    isSellerPaid,
                    isRecruiterPaid,
                    isFullyPaid,
                    isSellerParcial,
                    isRecruiterParcial,
                    isSellerRequested,
                    isRecruiterRequested,
                    requestedSellerAt,
                    requestedRecruiterAt,
                    comprobanteImg,
                    notes,
                    creado_al: acc.creado_al || acc.fecha_creacion || new Date().toISOString(),
                    paymentRecord: payment
                  };
                });

              // Filtrar según el rol (Para el listado de Mis Comisiones, mostramos solo las propias y las de su red de reclutamiento)
              const visibleCommissions = allCommissionRows.filter(row => {
                return row.seller === sellerEmailLower || row.recruiter === sellerEmailLower;
              });

              // Búsqueda textual
              const searchedCommissions = visibleCommissions.filter(row => {
                if (!commissionSearch.trim()) return true;
                const term = commissionSearch.toLowerCase();
                return (
                  row.cliente_id.toLowerCase().includes(term) ||
                  row.cliente_nombre.toLowerCase().includes(term) ||
                  row.plan_nombre.toLowerCase().includes(term) ||
                  row.seller.toLowerCase().includes(term) ||
                  row.recruiter.toLowerCase().includes(term) ||
                  row.sellerName.toLowerCase().includes(term) ||
                  row.recruiterName.toLowerCase().includes(term)
                );
              });

              // Cálculos de métricas
              const mySellerPending = allCommissionRows
                .filter(r => r.seller === sellerEmailLower && !r.isSellerPaid)
                .reduce((acc, curr) => acc + curr.vComm, 0);

              const mySellerPaid = allCommissionRows
                .filter(r => r.seller === sellerEmailLower && r.isSellerPaid)
                .reduce((acc, curr) => acc + curr.vComm, 0);

              const myRecruiterPending = allCommissionRows
                .filter(r => r.recruiter === sellerEmailLower && !r.isRecruiterPaid)
                .reduce((acc, curr) => acc + curr.rComm, 0);

              const myRecruiterPaid = allCommissionRows
                .filter(r => r.recruiter === sellerEmailLower && r.isRecruiterPaid)
                .reduce((acc, curr) => acc + curr.rComm, 0);

              const globalTotalPending = allCommissionRows
                .reduce((acc, curr) => {
                  let pending = 0;
                  if (!curr.isSellerPaid) pending += curr.vComm;
                  if (curr.recruiter && !curr.isRecruiterPaid) pending += curr.rComm;
                  return acc + pending;
                }, 0);

              const globalTotalPaid = allCommissionRows
                .reduce((acc, curr) => {
                  let paid = 0;
                  if (curr.isSellerPaid) paid += curr.vComm;
                  if (curr.recruiter && curr.isRecruiterPaid) paid += curr.rComm;
                  return acc + paid;
                }, 0);

              const myDirectRecruits = vendedoresRelaciones.filter(r => r.inviter_email.toLowerCase().trim() === sellerEmailLower);

              return (
                <div id="active-widget-container" className="space-y-6">
                  {/* Cabecera / Banner Airbnb Style */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          💵 Módulo Activo
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Finanzas y Red de Vendedores
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xl">
                        Administra el pago de comisiones, visualiza liquidaciones del panel de revendedores, y gestiona tu red de vendedores referidos con herencia pasiva.
                      </p>
                    </div>
                    <button
                      onClick={() => selectMenuWithScroll("inicio")}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 transition-all font-bold text-xs flex items-center gap-2 shadow-sm self-stretch md:self-auto"
                    >
                      ← Volver al Launchpad
                    </button>
                  </div>

                  {/* Bento Grid de Métricas Financieras */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Caja 1: Mis Ventas Directas */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mis Ventas Directas</span>
                        <span className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                          <DollarSign size={18} />
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${(mySellerPending + mySellerPaid).toLocaleString()} ARS
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            ● Pendiente: ${mySellerPending.toLocaleString()}
                          </span>
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            ✓ Cobrado: ${mySellerPaid.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Caja 2: Ingresos de Red (Reclutador) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Red Pasiva Reclutados</span>
                        <span className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
                          <Share2 size={18} />
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          ${(myRecruiterPending + myRecruiterPaid).toLocaleString()} ARS
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            ● Pendiente: ${myRecruiterPending.toLocaleString()}
                          </span>
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            ✓ Cobrado: ${myRecruiterPaid.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Caja 3: Estado de Red o Métricas Globales */}
                    {isUserAdmin ? (
                      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Caja Global Liquidaciones (Admin)</span>
                          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                            <TrendingUp size={18} />
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black tracking-tight">
                            ${(globalTotalPending + globalTotalPaid).toLocaleString()} ARS
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-amber-400 font-bold">
                              ● Por Pagar: ${globalTotalPending.toLocaleString()}
                            </span>
                            <span className="text-emerald-400 font-bold">
                              ✓ Liquidado: ${globalTotalPaid.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mi Red</span>
                          <span className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
                            <Users size={18} />
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {myDirectRecruits.length} {myDirectRecruits.length === 1 ? 'Vendedor' : 'Vendedores'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Recluta nuevos vendedores para comisionar un porcentaje de sus ventas.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Solapas de Navegación del Panel de Finanzas */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
                    <button
                      onClick={() => setFinanzasTab("mis_comisiones")}
                      className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                        finanzasTab === "mis_comisiones"
                          ? "border-slate-900 dark:border-white text-slate-950 dark:text-white font-black"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      🧾 Mis Comisiones y Ventas
                    </button>
                    
                    <button
                      onClick={() => setFinanzasTab("red")}
                      className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                        finanzasTab === "red"
                          ? "border-slate-900 dark:border-white text-slate-950 dark:text-white font-black"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      👥 Mi Red y Reclutamiento
                    </button>

                    {isUserAdmin && (
                      <button
                        onClick={() => setFinanzasTab("liquidaciones")}
                        className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                          finanzasTab === "liquidaciones"
                            ? "border-slate-900 dark:border-white text-slate-950 dark:text-white font-black"
                            : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        ⚖️ Liquidar Comisiones (Admin)
                      </button>
                    )}
                  </div>

                  {/* TAB 1: MIS COMISIONES Y VENTAS */}
                  {finanzasTab === "mis_comisiones" && (
                    <div className="space-y-4">
                      {/* Cabecera de Acciones para Cobros del Vendedor */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                                💰 Gestión de Retiros y Comisiones
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Administra tus ingresos y solicita la liquidación de tus comisiones pendientes de pago.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const newMode = !showSelectionCheckboxes;
                                setShowSelectionCheckboxes(newMode);
                                if (!newMode) {
                                  setSelectedCommissionsToRequestPayout([]);
                                }
                              }}
                              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                                showSelectionCheckboxes
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-850 dark:hover:bg-slate-100"
                              }`}
                            >
                              {showSelectionCheckboxes ? "❌ Cancelar Selección" : "💵 Solicitar pago de comisiones"}
                            </button>
                          </div>

                          {showSelectionCheckboxes && (
                            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                                Acciones de Selección Rápida
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const eligibleSellers = searchedCommissions.filter(row => {
                                      const isCurrentSeller = row.seller === sellerEmailLower;
                                      const isPaid = isCurrentSeller ? row.isSellerPaid : false;
                                      const isRequested = isCurrentSeller ? row.isSellerRequested : false;
                                      return isCurrentSeller && !isPaid && !isRequested;
                                    }).map(row => row.cliente_id);
                                    setSelectedCommissionsToRequestPayout(eligibleSellers);
                                    toast.success(`Se seleccionaron ${eligibleSellers.length} comisiones de venta propia.`);
                                  }}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-all"
                                >
                                  🎯 Seleccionar mis comisiones de venta
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const eligibleRecruiters = searchedCommissions.filter(row => {
                                      const isCurrentRecruiter = row.recruiter === sellerEmailLower;
                                      const isPaid = isCurrentRecruiter ? row.isRecruiterPaid : false;
                                      const isRequested = isCurrentRecruiter ? row.isRecruiterRequested : false;
                                      return isCurrentRecruiter && !isPaid && !isRequested;
                                    }).map(row => row.cliente_id);
                                    setSelectedCommissionsToRequestPayout(eligibleRecruiters);
                                    toast.success(`Se seleccionaron ${eligibleRecruiters.length} comisiones de revendedores.`);
                                  }}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-all"
                                >
                                  👥 Seleccionar comisiones de mis revendedores
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const allEligible = searchedCommissions.filter(row => {
                                      const isCurrentSeller = row.seller === sellerEmailLower;
                                      const isCurrentRecruiter = row.recruiter === sellerEmailLower;
                                      const isPaid = isCurrentSeller ? row.isSellerPaid : (isCurrentRecruiter ? row.isRecruiterPaid : false);
                                      const isRequested = isCurrentSeller ? row.isSellerRequested : (isCurrentRecruiter ? row.isRecruiterRequested : false);
                                      return !isPaid && !isRequested;
                                    }).map(row => row.cliente_id);
                                    setSelectedCommissionsToRequestPayout(allEligible);
                                    toast.success(`Se seleccionaron ${allEligible.length} comisiones en total.`);
                                  }}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-all"
                                >
                                  ✨ Seleccionar todo
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCommissionsToRequestPayout([]);
                                    toast.info("Selección limpiada.");
                                  }}
                                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 rounded-lg font-bold text-[11px] transition-all"
                                >
                                  Borrar Selección
                                </button>
                              </div>

                              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Filas seleccionadas: <strong className="text-slate-800 dark:text-white font-extrabold">{selectedCommissionsToRequestPayout.length}</strong>
                                </span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    disabled={selectedCommissionsToRequestPayout.length === 0}
                                    onClick={async () => {
                                      await handleRequestCommissionPayout(selectedCommissionsToRequestPayout);
                                      setSelectedCommissionsToRequestPayout([]);
                                      setShowSelectionCheckboxes(false);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    ✓ Solicitar Seleccionadas ({selectedCommissionsToRequestPayout.length})
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Buscador de Comisiones */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          value={commissionSearch}
                          onChange={(e) => setCommissionSearch(e.target.value)}
                          placeholder="Buscar por cliente, plan, vendedor..."
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:text-white"
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                {showSelectionCheckboxes && (
                                  <th className="p-4 w-10 text-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        searchedCommissions.length > 0 &&
                                        searchedCommissions.filter(row => {
                                          const isCurrentSeller = row.seller === sellerEmailLower;
                                          const isCurrentRecruiter = row.recruiter === sellerEmailLower;
                                          const isPaid = isCurrentSeller ? row.isSellerPaid : (isCurrentRecruiter ? row.isRecruiterPaid : false);
                                          const isRequested = isCurrentSeller ? row.isSellerRequested : (isCurrentRecruiter ? row.isRecruiterRequested : false);
                                          return !isPaid && !isRequested;
                                        }).every(row => selectedCommissionsToRequestPayout.includes(row.cliente_id))
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          const eligible = searchedCommissions
                                            .filter(row => {
                                              const isCurrentSeller = row.seller === sellerEmailLower;
                                              const isCurrentRecruiter = row.recruiter === sellerEmailLower;
                                              const isPaid = isCurrentSeller ? row.isSellerPaid : (isCurrentRecruiter ? row.isRecruiterPaid : false);
                                              const isRequested = isCurrentSeller ? row.isSellerRequested : (isCurrentRecruiter ? row.isRecruiterRequested : false);
                                              return !isPaid && !isRequested;
                                            })
                                            .map(row => row.cliente_id);
                                          setSelectedCommissionsToRequestPayout(eligible);
                                        } else {
                                          setSelectedCommissionsToRequestPayout([]);
                                        }
                                      }}
                                      className="rounded border-slate-300"
                                    />
                                  </th>
                                )}
                                <th className="p-4 text-[10px] uppercase font-bold text-slate-400">Cliente/Plan</th>
                                <th className="p-4 text-[10px] uppercase font-bold text-slate-400">Vendedor</th>
                                <th className="p-4 text-[10px] uppercase font-bold text-slate-400">Revendedor</th>
                                <th className="p-4 text-[10px] uppercase font-bold text-slate-400">Mi Comisión</th>
                                <th className="p-4 text-[10px] uppercase font-bold text-slate-400 text-right">Estado Liquidación</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                              {searchedCommissions.length > 0 ? (
                                searchedCommissions.map((row: any, idx: number) => {
                                  const isCurrentSeller = row.seller === sellerEmailLower;
                                  const isCurrentRecruiter = row.recruiter === sellerEmailLower;
                                  
                                  let miPorcion = 0;
                                  let miEstado = false;
                                  let miSolicitado = false;
                                  if (isCurrentSeller) {
                                    miPorcion = row.vComm;
                                    miEstado = row.isSellerPaid;
                                    miSolicitado = row.isSellerRequested;
                                  } else if (isCurrentRecruiter) {
                                    miPorcion = row.rComm;
                                    miEstado = row.isRecruiterPaid;
                                    miSolicitado = row.isRecruiterRequested;
                                  } else if (isUserAdmin) {
                                    miPorcion = row.totalComm;
                                    miEstado = row.isFullyPaid;
                                    miSolicitado = row.isSellerRequested || row.isRecruiterRequested;
                                  }

                                  const canSelect = !miEstado && !miSolicitado;

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/20">
                                      {showSelectionCheckboxes && (
                                        <td className="p-4 text-center">
                                          {canSelect ? (
                                            <input
                                              type="checkbox"
                                              checked={selectedCommissionsToRequestPayout.includes(row.cliente_id)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setSelectedCommissionsToRequestPayout(prev => [...prev, row.cliente_id]);
                                                } else {
                                                  setSelectedCommissionsToRequestPayout(prev => prev.filter(id => id !== row.cliente_id));
                                                }
                                              }}
                                              className="rounded border-slate-300"
                                            />
                                          ) : (
                                            <span className="text-slate-300 select-none">-</span>
                                          )}
                                        </td>
                                      )}
                                      <td className="p-4 space-y-0.5">
                                        <p className="font-extrabold text-slate-900 dark:text-white">{row.cliente_nombre}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{row.plan_nombre} · ID: {row.cliente_id}</p>
                                      </td>
                                      <td className="p-4">
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-300">
                                          {activeUserName}
                                        </span>
                                      </td>
                                      <td className="p-4">
                                        {isCurrentRecruiter ? (
                                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded font-medium" title={row.seller}>
                                            {row.sellerName}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">Directo (Sin Red)</span>
                                        )}
                                      </td>
                                      <td className="p-4 space-y-0.5 font-bold">
                                        <p className="text-slate-900 dark:text-white">${miPorcion.toLocaleString()} ARS</p>
                                      </td>
                                      <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {miEstado ? (
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-extrabold text-[10px] uppercase">
                                              ✓ Cobrado
                                            </span>
                                          ) : miSolicitado ? (
                                            <span className="px-2.5 py-1 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 rounded-full font-extrabold text-[10px] uppercase flex items-center gap-1">
                                              ⏳ Solicitado
                                            </span>
                                          ) : (
                                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-full font-extrabold text-[10px] uppercase">
                                              ● Pendiente
                                            </span>
                                          )}

                                          {miEstado && row.comprobanteImg && (
                                            <button
                                              onClick={() => {
                                                setViewingReceiptUrl(row.comprobanteImg);
                                                setShowReceiptModal(true);
                                              }}
                                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                              title="Ver Comprobante de Pago"
                                            >
                                              <Eye size={12} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400 space-y-1">
                                    <Users size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                                    <p className="font-bold">Sin Comisiones Encontradas</p>
                                    <p className="text-[11px] text-slate-500">No hay ventas registradas o liquidadas bajo este criterio.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MI RED Y RECLUTAMIENTO */}
                  {finanzasTab === "red" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Formulario / Acción para Reclutar */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                            ➕ Reclutar Nuevo Vendedor
                          </h3>
                          <p className="text-xs text-slate-500">
                            Invita a un nuevo vendedor a unirse a tu red para generar una comisión pasiva del 20% en cada venta que concrete.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Nombre Completo</label>
                            <input
                              type="text"
                              value={newInvitedName}
                              onChange={(e) => setNewInvitedName(e.target.value)}
                              placeholder="Ej: Juan Perez"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Correo Electrónico (Para Login)</label>
                            <input
                              type="email"
                              value={newInvitedEmail}
                              onChange={(e) => setNewInvitedEmail(e.target.value)}
                              placeholder="Ej: juan@gmail.com"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Contraseña de Acceso</label>
                            <input
                              type="password"
                              value={newInvitedPass}
                              onChange={(e) => setNewInvitedPass(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white"
                            />
                          </div>

                          <button
                            onClick={async () => {
                              const success = await handleSaveVendedorRelacion(sellerEmailLower, newInvitedEmail, newInvitedName, newInvitedPass);
                              if (success) {
                                setNewInvitedEmail("");
                                setNewInvitedName("");
                                setNewInvitedPass("");
                              }
                            }}
                            className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-850 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl transition-all font-bold text-xs"
                          >
                            ✓ Confirmar y Registrar Vendedor
                          </button>
                        </div>

                        {/* Compartir invitación de WhatsApp */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Fórmula de Invitación WhatsApp:</p>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 rounded-xl font-mono leading-relaxed relative group">
                            ¡Hola! Te invito a unirte a nuestro equipo de revendedores de XTV. Regístrate aquí y empieza a ganar excelentes comisiones. Contáctame para habilitar tu cuenta.
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("¡Hola! Te invito a unirte a nuestro equipo de revendedores de XTV. Regístrate aquí y empieza a ganar excelentes comisiones. Contáctame para habilitar tu cuenta.");
                                toast.success("¡Texto de invitación copiado!");
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shadow-sm"
                              title="Copiar texto de invitación"
                            >
                              <Share2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Listado de Mi Red / Vendedores Reclutados */}
                      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                            👥 Vendedores en Mi Red
                          </h3>
                          <p className="text-xs text-slate-500">
                            Lista completa de revendedores asociados directamente a tu red que comisionan contigo.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                <th className="pb-3 text-[10px] uppercase font-bold">Vendedor</th>
                                <th className="pb-3 text-[10px] uppercase font-bold">Ventas Totales</th>
                                <th className="pb-3 text-[10px] uppercase font-bold">Ingreso Pasivo Generado</th>
                                <th className="pb-3 text-[10px] uppercase font-bold text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {vendedoresRelaciones.filter(r => isUserAdmin ? true : r.inviter_email.toLowerCase().trim() === sellerEmailLower).length > 0 ? (
                                vendedoresRelaciones
                                  .filter(r => isUserAdmin ? true : r.inviter_email.toLowerCase().trim() === sellerEmailLower)
                                  .map((rel: any, idx: number) => {
                                    // Calcular ventas y pasivos
                                    const sellerClients = accounts.filter((acc: any) => (acc.creado_por || "").toLowerCase().trim() === rel.invited_email.toLowerCase().trim());
                                    
                                    const totalPassiveCommission = sellerClients.reduce((acc: number, curr: any) => {
                                      const plan = salePlans.find((p: any) => String(p.id) === String(curr.id_plan_venta));
                                      const comm = plan && Number(plan.comision) > 0 ? Number(plan.comision) : 5000;
                                      return acc + Math.round(comm * 0.2);
                                    }, 0);

                                    return (
                                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                        <td className="py-3 space-y-0.5">
                                          <p className="font-bold text-slate-900 dark:text-white">{rel.invited_email}</p>
                                          {isUserAdmin && (
                                            <p className="text-[10px] text-slate-400">Reclutador: {rel.inviter_email}</p>
                                          )}
                                        </td>
                                        <td className="py-3">
                                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                            {sellerClients.length} Ventas
                                          </span>
                                        </td>
                                        <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">
                                          ${totalPassiveCommission.toLocaleString()} ARS
                                        </td>
                                        <td className="py-3 text-right">
                                          {(isUserAdmin || rel.inviter_email.toLowerCase().trim() === sellerEmailLower) && (
                                            <button
                                              onClick={() => {
                                                if (confirm("¿Estás seguro de eliminar esta relación de reclutamiento? Esto no eliminará el usuario pero cancelará la comisión pasiva.")) {
                                                  handleDeleteVendedorRelacion(rel.id);
                                                }
                                              }}
                                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                                              title="Eliminar Relación"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                              ) : (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-400 space-y-1">
                                    <Users size={24} className="mx-auto text-slate-300 dark:text-slate-700" />
                                    <p className="font-bold">Aún no posees vendedores en tu red</p>
                                    <p className="text-[11px] text-slate-500">Recluta un vendedor usando el formulario de la izquierda.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIQUIDAR COMISIONES (SOLO ADMIN) */}
                  {finanzasTab === "liquidaciones" && isUserAdmin && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                            ⚖️ Liquidar y Pagar Comisiones
                          </h3>
                          <p className="text-xs text-slate-500">
                            Selecciona múltiples clientes con comisiones pendientes para liquidarlas al revendedor y al reclutador pasivo correspondientes de una sola vez.
                          </p>
                        </div>

                        {selectedCommissionsForPayout.length > 0 && (
                          <button
                            onClick={() => {
                              const selectedRows = allCommissionRows.filter(r => selectedCommissionsForPayout.includes(r.cliente_id));
                              const totalVend = selectedRows.reduce((sum, r) => sum + (r.isSellerPaid ? 0 : r.vComm), 0);
                              const totalRecr = selectedRows.reduce((sum, r) => sum + (r.recruiter && !r.isRecruiterPaid ? r.rComm : 0), 0);
                              
                              setPayoutPayVendedor(true);
                              setPayoutPayReclutador(true);
                              setPayoutOverrideVendedor(String(totalVend));
                              setPayoutOverrideReclutador(String(totalRecr));
                              setPayoutNotes("");
                              setShowPayoutModal(true);
                            }}
                            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-850 dark:hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
                          >
                            ⚖️ Liquidar ({selectedCommissionsForPayout.length}) Seleccionados
                          </button>
                        )}
                      </div>

                      {/* Grilla tabular global de liquidación */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                              <th className="p-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCommissionsForPayout.length > 0 && selectedCommissionsForPayout.length === allCommissionRows.filter(r => !r.isFullyPaid).length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const unpaids = allCommissionRows.filter(r => !r.isFullyPaid).map(r => r.cliente_id);
                                      setSelectedCommissionsForPayout(unpaids);
                                    } else {
                                      setSelectedCommissionsForPayout([]);
                                    }
                                  }}
                                  className="rounded border-slate-300"
                                />
                              </th>
                              <th className="p-3 text-[10px] uppercase font-bold">Cliente / Plan</th>
                              <th className="p-3 text-[10px] uppercase font-bold">Vendedor</th>
                              <th className="p-3 text-[10px] uppercase font-bold">Revendedor</th>
                              <th className="p-3 text-[10px] uppercase font-bold">Comisión Vendedor</th>
                              <th className="p-3 text-[10px] uppercase font-bold">Comisión Revendedor</th>
                              <th className="p-3 text-[10px] uppercase font-bold text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {allCommissionRows.length > 0 ? (
                              allCommissionRows.map((row: any, idx: number) => {
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                    <td className="p-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedCommissionsForPayout.includes(row.cliente_id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedCommissionsForPayout(prev => [...prev, row.cliente_id]);
                                          } else {
                                            setSelectedCommissionsForPayout(prev => prev.filter(id => id !== row.cliente_id));
                                          }
                                        }}
                                        className="rounded border-slate-300"
                                      />
                                    </td>
                                    <td className="p-3 space-y-0.5">
                                      <p className="font-extrabold text-slate-950 dark:text-white">{row.cliente_nombre}</p>
                                      <p className="text-[10px] text-slate-500">{row.plan_nombre} · ID: {row.cliente_id}</p>
                                    </td>
                                    <td className="p-3 space-y-1">
                                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300" title={row.seller}>
                                        {row.sellerName}
                                      </span>
                                      <div className="flex flex-col gap-0.5 text-[9px]">
                                        {row.isSellerPaid ? (
                                          <span className="text-emerald-500 font-bold">✓ Pagado</span>
                                        ) : (
                                          <span className="text-amber-500 font-bold">● Pendiente</span>
                                        )}
                                        {row.isSellerRequested && !row.isSellerPaid && (
                                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 rounded text-[8px] font-black uppercase tracking-wider w-fit">
                                            ⏳ Solicitado
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 space-y-1">
                                      {row.recruiter ? (
                                        <>
                                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium" title={row.recruiter}>
                                            {row.recruiterName}
                                          </span>
                                          <div className="flex flex-col gap-0.5 text-[9px]">
                                            {row.isRecruiterPaid ? (
                                              <span className="text-emerald-500 font-bold">✓ Pagado</span>
                                            ) : (
                                              <span className="text-amber-500 font-bold">● Pendiente</span>
                                            )}
                                            {row.isRecruiterRequested && !row.isRecruiterPaid && (
                                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 rounded text-[8px] font-black uppercase tracking-wider w-fit">
                                                ⏳ Solicitado
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-slate-400 italic text-[11px]">Directo (Sin Red)</span>
                                      )}
                                    </td>
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                                      ${row.vComm.toLocaleString()} ARS
                                    </td>
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                                      ${row.rComm.toLocaleString()} ARS
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {row.isFullyPaid ? (
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-black text-[9px] uppercase">
                                            Completo
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-full font-black text-[9px] uppercase">
                                            Parcial / Pendiente
                                          </span>
                                        )}

                                        <button
                                          onClick={() => openReceiptDetails(row, false, allCommissionRows)}
                                          className="px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1 font-bold text-[10px]"
                                          title="Ver Comprobante y Detalle Desglosado por Cliente"
                                        >
                                          <Eye size={12} />
                                          <span>Detalle</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400">
                                  <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                                  <p className="font-bold">No hay registros de ventas para liquidar</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Modal de Liquidación de Comisiones Seleccionadas */}
                      {showPayoutModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
                            <button
                              onClick={() => setShowPayoutModal(false)}
                              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                              <X size={18} />
                            </button>

                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                                ⚖️ Confirmar Liquidación Masiva
                              </h4>
                              <p className="text-xs text-slate-500">
                                Estás liquidando comisiones para {selectedCommissionsForPayout.length} clientes. Puedes sobreescribir los montos reales de pago a continuación.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                                  Fracciones a Liquidar en este Pago:
                                </span>

                                {/* VENDEDORES SELECTION */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-900 dark:text-white select-none">
                                      <input
                                        type="checkbox"
                                        checked={payoutPayVendedor}
                                        onChange={(e) => setPayoutPayVendedor(e.target.checked)}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
                                      />
                                      <span>✓ Liquidar Vendedores</span>
                                    </label>
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg">
                                      ARS ${Number(payoutOverrideVendedor).toLocaleString()}
                                    </span>
                                  </div>
                                  {payoutPayVendedor && (
                                    <div className="pl-6 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Monto Manual Ajustado (Opcional)</label>
                                      <input
                                        type="number"
                                        value={payoutOverrideVendedor}
                                        onChange={(e) => setPayoutOverrideVendedor(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 rounded-lg text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-slate-150 dark:border-slate-800/60 my-2"></div>

                                {/* REVENDEDORES SELECTION */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-900 dark:text-white select-none">
                                      <input
                                        type="checkbox"
                                        checked={payoutPayReclutador}
                                        onChange={(e) => setPayoutPayReclutador(e.target.checked)}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
                                      />
                                      <span>✓ Liquidar Revendedores</span>
                                    </label>
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                                      ARS ${Number(payoutOverrideReclutador).toLocaleString()}
                                    </span>
                                  </div>
                                  {payoutPayReclutador && (
                                    <div className="pl-6 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Monto Manual Ajustado (Opcional)</label>
                                      <input
                                        type="number"
                                        value={payoutOverrideReclutador}
                                        onChange={(e) => setPayoutOverrideReclutador(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 rounded-lg text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Notas de Liquidación</label>
                                <textarea
                                  value={payoutNotes}
                                  onChange={(e) => setPayoutNotes(e.target.value)}
                                  placeholder="Ej: Pago realizado via transferencia bancaria."
                                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 focus:outline-none dark:text-white h-20 resize-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Captura de Comprobante (Opcional)</label>
                                <div className="mt-1 flex flex-col gap-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setPayoutReceiptImage(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                                  />
                                  {payoutReceiptImage && (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center group">
                                      <img
                                        src={payoutReceiptImage}
                                        alt="Vista previa del comprobante"
                                        className="max-h-full max-w-full object-contain"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPayoutReceiptImage("")}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all text-[10px] font-bold"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 flex gap-3">
                                <button
                                  onClick={() => {
                                    setPayoutReceiptImage("");
                                    setShowPayoutModal(false);
                                  }}
                                  className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={async () => {
                                    const selectedRows = allCommissionRows.filter(r => selectedCommissionsForPayout.includes(r.cliente_id));
                                    
                                    for (const r of selectedRows) {
                                      await handleSaveCommissionPayout(
                                        r.cliente_id,
                                        r.cliente_nombre,
                                        r.plan_nombre,
                                        r.seller,
                                        r.recruiter,
                                        r.totalComm,
                                        r.vComm,
                                        r.rComm,
                                        payoutPayVendedor,
                                        payoutPayReclutador,
                                        payoutNotes,
                                        payoutReceiptImage
                                      );
                                    }
                                    
                                    setSelectedCommissionsForPayout([]);
                                    setPayoutReceiptImage("");
                                    setShowPayoutModal(false);
                                  }}
                                  className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-850 dark:hover:bg-slate-100 rounded-xl text-xs font-bold"
                                >
                                  ✓ Confirmar Pago
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Helper Function para formatear texto de comprobante */}
                      {(() => {
                        return null;
                      })()}
                      {showReceiptModal && (
                        (() => {
                          const generateReceiptFormattedText = (details: any) => {
                            if (!details) return '';
                            let txt = `🧾 *COMPROBANTE DE LIQUIDACIÓN DE COMISIONES*\n`;
                            txt += `👤 Usuario: ${details.usuarioNombre || 'N/A'}\n`;
                            if (details.usuarioRol) txt += `📋 Rol: ${details.usuarioRol}\n`;
                            if (details.fechaEmision) txt += `📅 Fecha: ${details.fechaEmision}\n`;
                            txt += `\n✅ *CLIENTES COBRADOS / INCLUIDOS:*\n`;
                            if (details.detallesCobrados?.length > 0) {
                              details.detallesCobrados.forEach((item: any, idx: number) => {
                                txt += `${idx + 1}. ${item.cliente_nombre} (${item.plan_nombre}): $${item.monto_abonado?.toLocaleString()} ARS\n`;
                              });
                            }
                            txt += `\n💰 *TOTAL ABONADO:* $${details.totalCobrado?.toLocaleString() || 0} ARS\n`;
                            if (details.detallesPendientes?.length > 0) {
                              txt += `\n⚠️ *PENDIENTE TOTAL:* $${details.totalPendiente?.toLocaleString() || 0} ARS\n`;
                            }
                            return txt;
                          };

                          return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
                            <button
                              onClick={() => {
                                setShowReceiptModal(false);
                                setViewingReceiptUrl("");
                                setViewingReceiptDetails(null);
                              }}
                              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
                            >
                              <X size={18} />
                            </button>

                            <div className="space-y-1 pr-6">
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                                🧾 Comprobante Oficial de Liquidación
                              </span>
                              <h4 className="font-black text-lg text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
                                {viewingReceiptDetails?.usuarioNombre || "Usuario XTV"}
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-2">
                                <span>Rol: <strong className="text-slate-700 dark:text-slate-300">{viewingReceiptDetails?.usuarioRol || "Vendedor"}</strong></span>
                                <span>·</span>
                                <span>Email: <strong className="text-slate-700 dark:text-slate-300">{viewingReceiptDetails?.usuarioEmail}</strong></span>
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Emitido: {viewingReceiptDetails?.fechaEmision || new Date().toLocaleString()} · ID: {viewingReceiptDetails?.comprobanteId || "CMP-0001"}
                              </p>
                            </div>

                            {/* TABLA DE CLIENTES COBRADOS EN ESTA LIQUIDACIÓN */}
                            <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                                  <span>✅ Clientes Incluidos en este Pago / Liquidación</span>
                                </h5>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  Total Abonado: ${viewingReceiptDetails?.totalCobrado?.toLocaleString() || 0} ARS
                                </span>
                              </div>

                              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase">
                                    <tr>
                                      <th className="p-2.5">Cliente</th>
                                      <th className="p-2.5">Plan</th>
                                      <th className="p-2.5 text-right">Comisión Total</th>
                                      <th className="p-2.5 text-right">Monto Abonado</th>
                                      <th className="p-2.5 text-right">Saldo Restante</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {viewingReceiptDetails?.detallesCobrados?.length > 0 ? (
                                      viewingReceiptDetails.detallesCobrados.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                          <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">
                                            {item.cliente_nombre}
                                            <span className="block text-[9px] font-normal text-slate-400">ID: {item.cliente_id}</span>
                                          </td>
                                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.plan_nombre}</td>
                                          <td className="p-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                                            ${item.comision_total?.toLocaleString()}
                                          </td>
                                          <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            ${item.monto_abonado?.toLocaleString()}
                                          </td>
                                          <td className="p-2.5 text-right font-bold">
                                            {item.saldo_restante === 0 ? (
                                              <span className="text-emerald-500 text-[10px] uppercase font-black">✓ Saldado</span>
                                            ) : (
                                              <span className="text-amber-500 text-[10px] uppercase font-black">${item.saldo_restante?.toLocaleString()}</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">No hay clientes específicos asignados</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* TABLA DE CLIENTES CON PAGO PENDIENTE O PARCIAL DEL MISMO USUARIO */}
                            {viewingReceiptDetails?.detallesPendientes?.length > 0 && (
                              <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                                    <span>⚠️ Clientes del Usuario Faltantes por Cobrar / Pendientes</span>
                                  </h5>
                                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    Pendiente Total: ${viewingReceiptDetails?.totalPendiente?.toLocaleString()} ARS
                                  </span>
                                </div>

                                <div className="border border-amber-200 dark:border-amber-950/60 rounded-xl overflow-hidden text-xs bg-amber-50/30 dark:bg-amber-950/10">
                                  <table className="w-full text-left">
                                    <thead className="bg-amber-100/50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-[10px] font-extrabold text-amber-800 dark:text-amber-400 uppercase">
                                      <tr>
                                        <th className="p-2.5">Cliente</th>
                                        <th className="p-2.5">Plan</th>
                                        <th className="p-2.5 text-right">Comisión Total</th>
                                        <th className="p-2.5 text-right">Ya Abonado</th>
                                        <th className="p-2.5 text-right">Saldo Pendiente</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                      {viewingReceiptDetails.detallesPendientes.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-amber-100/30 dark:hover:bg-amber-950/20">
                                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                            {item.cliente_nombre}
                                            <span className="block text-[9px] font-normal text-slate-400">ID: {item.cliente_id}</span>
                                          </td>
                                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.plan_nombre}</td>
                                          <td className="p-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                                            ${item.comision_total?.toLocaleString()}
                                          </td>
                                          <td className="p-2.5 text-right font-semibold text-slate-500">
                                            ${item.monto_abonado?.toLocaleString()}
                                          </td>
                                          <td className="p-2.5 text-right font-black text-amber-600 dark:text-amber-400">
                                            ${item.saldo_restante?.toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* COMPROBANTE DE IMAGEN SINO */}
                            {viewingReceiptUrl && (
                              <div className="space-y-1.5 border-t border-slate-150 dark:border-slate-800 pt-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                  📷 Captura de Transferencia / Garantía Adjunta
                                </span>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-[300px] p-2">
                                  <img
                                    src={viewingReceiptUrl}
                                    alt="Comprobante de Pago Adjunto"
                                    className="max-h-[280px] max-w-full object-contain rounded-lg"
                                  />
                                </div>
                              </div>
                            )}

                            {/* BOTONES DE COMPARTIR Y ACCIÓN */}
                            <div className="pt-2 flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  const text = generateReceiptFormattedText(viewingReceiptDetails);
                                  navigator.clipboard.writeText(text);
                                  toast.success("Resumen formateado copiado al portapapeles.");
                                }}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                              >
                                📋 Copiar Resumen
                              </button>

                              <button
                                onClick={() => {
                                  const text = generateReceiptFormattedText(viewingReceiptDetails);
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                                }}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                              >
                                💬 Compartir en WhatsApp
                              </button>

                              <button
                                onClick={() => {
                                  setShowReceiptModal(false);
                                  setViewingReceiptUrl("");
                                  setViewingReceiptDetails(null);
                                }}
                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs rounded-xl transition-all"
                              >
                                Entendido
                              </button>
                            </div>
                          </div>
                        </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* F. SECCIÓN DE TUTORIALES Y RESPUESTAS RÁPIDAS */}
          {currentMenu === "tutoriales" &&
            (() => {
              // Obtener herencia de roles para filtrar de forma jerárquica
              const savedInheritance = localStorage.getItem('g3d_roles_inheritance');
              const roleInheritance = savedInheritance ? JSON.parse(savedInheritance) : {};

              const isDescendantRole = (child: string, parent: string): boolean => {
                if (!child || !parent) return false;
                let current = child.trim().toLowerCase();
                const p = parent.trim().toLowerCase();
                if (current === p) return false;
                let visited = new Set<string>();
                while (current && !visited.has(current)) {
                  visited.add(current);
                  const matchedKey = Object.keys(roleInheritance).find(k => k.trim().toLowerCase() === current);
                  if (!matchedKey) break;
                  const parentRole = roleInheritance[matchedKey];
                  if (!parentRole) break;
                  const parentLower = parentRole.trim().toLowerCase();
                  if (parentLower === p) return true;
                  current = parentLower;
                }
                return false;
              };

              const currentUserRole = simulatedRole || userRole || "";

              // Filtrar según permisos de visibilidad de clientes
              const myClients = accounts.filter((acc: any) => {
                if (isAdmin) return true;

                const creadoPorLower = (acc.creado_por || "").trim().toLowerCase();
                const userEmailLower = (user?.email || "").trim().toLowerCase();

                // Caso 1: Es dueño
                if (creadoPorLower === userEmailLower) return true;

                // Caso 2: Permiso para ver clientes de roles hijo
                if (hasPermission("Iptv.Clientes.VerHijos")) {
                  const creatorUser = panelUsers.find(
                    (u: any) => u.usuario.trim().toLowerCase() === creadoPorLower
                  );
                  const creatorRole = creatorUser ? creatorUser.rol || "" : "";
                  if (isDescendantRole(creatorRole, currentUserRole)) {
                    return true;
                  }
                }

                // Caso 3: Permiso para ver solo propios (si no se cumple lo anterior)
                if (hasPermission("Iptv.Clientes.VerPropios")) {
                  return creadoPorLower === userEmailLower;
                }

                // Por defecto, si tiene acceso general de Ver pero no restricciones, puede ver todo
                return true;
              });

              const searchedClients = myClients.filter((acc: any) => {
                const term = tutorialSearchTerm.toLowerCase().trim();
                if (!term) return true;
                return (
                  (acc.nombre_completo || "").toLowerCase().includes(term) ||
                  (acc.username || "").toLowerCase().includes(term) ||
                  (acc.celular || "").toLowerCase().includes(term)
                );
              });

              // activeClient ya no toma por defecto searchedClients[0] si tutorialClient es null
              const activeClient = tutorialClient;

              const customTemplates = systemConfig?.whatsapp_templates || {};

              const quickTemplates = [
                {
                  id: "bienvenida",
                  title: "🎬 Bienvenida Oficial XTV",
                  description: "Mensaje completo de bienvenida con credenciales, link de descarga de la app y pasos para ingresar.",
                  requiresClient: true,
                  getContent: (client?: any) => {
                    if (!client) return "";
                    const text = customTemplates.bienvenida || DEFAULT_WHATSAPP_TEMPLATES.bienvenida;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "credenciales_rapidas",
                  title: "⚡ Datos de Acceso Rápidos",
                  description: "Formato súper compacto y directo, ideal para clientes experimentados que solo necesitan las credenciales de ingreso.",
                  requiresClient: true,
                  getContent: (client?: any) => {
                    if (!client) return "";
                    const text = customTemplates.credenciales_rapidas || DEFAULT_WHATSAPP_TEMPLATES.credenciales_rapidas;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "recordatorio",
                  title: "⚠️ Recordatorio de Próximo Vencimiento",
                  description: "Mensaje amigable para recordar el vencimiento de la cuenta e incentivar la renovación rápida.",
                  requiresClient: true,
                  getContent: (client?: any) => {
                    if (!client) return "";
                    const text = customTemplates.recordatorio || DEFAULT_WHATSAPP_TEMPLATES.recordatorio;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "guia_descarga_general",
                  title: "📥 Descarga e Instalación de XTV (General)",
                  description: "Mensaje informativo para compartir con cualquier interesado con los enlaces de descarga directa y de soporte.",
                  requiresClient: false,
                  getContent: (client?: any) => {
                    const text = customTemplates.guia_descarga_general || DEFAULT_WHATSAPP_TEMPLATES.guia_descarga_general;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "metodos_pago",
                  title: "💳 Información de Pago y Renovación (Vendedor)",
                  description: "Mensaje con los datos del vendedor para recibir pagos de renovaciones o activaciones de planes.",
                  requiresClient: false,
                  getContent: (client?: any) => {
                    const text = customTemplates.metodos_pago || DEFAULT_WHATSAPP_TEMPLATES.metodos_pago;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "smart_tv_gen",
                  title: "📺 Instrucciones Generales para Smart TV",
                  description: "Mensaje explicativo para Smart TVs sobre cómo instalar aplicaciones IPTV compatibles.",
                  requiresClient: false,
                  getContent: (client?: any) => {
                    const text = customTemplates.smart_tv_gen || DEFAULT_WHATSAPP_TEMPLATES.smart_tv_gen;
                    return formatTemplateText(text, client);
                  }
                },
                {
                  id: "firestick_gen",
                  title: "🔥 Guía de Instalación para Amazon Fire Stick / Android TV",
                  description: "Guía paso a paso sobre cómo instalar XTV en dispositivos de streaming sin necesidad de cliente seleccionado.",
                  requiresClient: false,
                  getContent: (client?: any) => {
                    const text = customTemplates.firestick_gen || DEFAULT_WHATSAPP_TEMPLATES.firestick_gen;
                    return formatTemplateText(text, client);
                  }
                }
              ];

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-150 dark:border-slate-800 pb-5 gap-4">
                    <div>
                      <h3 className="text-lg font-black uppercase text-slate-800 dark:text-white flex items-center gap-2 font-sans">
                        <span>📖 Tutoriales y Respuestas Rápidas</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full lowercase font-bold tracking-normal normal-case">activo</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        Selecciona una línea de cliente en el menú de la izquierda para generar respuestas personalizadas de acceso, o utiliza los tutoriales generales directamente.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* COLUMNA IZQUIERDA: SELECCIONAR CLIENTE */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          Buscar Línea de Cliente IPTV
                        </label>
                        <div className="relative">
                          <Search
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={14}
                          />
                          <input
                            type="text"
                            placeholder="Nombre, usuario o celular de la línea..."
                            value={tutorialSearchTerm}
                            onChange={(e) => setTutorialSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 text-xs rounded-xl focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Líneas de Clientes ({searchedClients.length})
                        </label>
                        <div className="max-h-[380px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                          {searchedClients.length > 0 ? (
                            searchedClients.map((c: any) => {
                              const isSelected = activeClient?.username === c.username;
                              return (
                                <button
                                  key={c.username}
                                  onClick={() => setTutorialClient(isSelected ? null : c)}
                                  className={`w-full text-left p-3 flex flex-col gap-1 transition-all hover:bg-slate-50 dark:hover:bg-slate-850 ${
                                    isSelected
                                      ? "bg-indigo-50/70 dark:bg-indigo-950/20 border-l-4 border-indigo-600"
                                      : "border-l-4 border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                                      {c.nombre_completo || "Cliente VIP"}
                                    </span>
                                    <span className="font-mono text-[9px] font-bold text-cyan-600 dark:text-cyan-400 truncate max-w-[100px]">
                                      @{c.username}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>📞 {c.celular || "Sin celular"}</span>
                                    {c.fecha_vencimiento && (
                                      <span className="font-medium text-[9px]">
                                        📅 {new Date(c.fecha_vencimiento).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No tienes líneas de clientes que coincidan con la búsqueda.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: RESPUESTAS RÁPIDAS */}
                    <div className="lg:col-span-8 space-y-6">
                      {activeClient ? (
                        /* Resumen de la Línea Seleccionada */
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-950 flex flex-wrap items-center justify-between gap-4 text-left">
                          <div className="flex-1 min-w-[200px]">
                            <p className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-indigo-500 animate-pulse"></span>
                              Línea de Cliente Seleccionada
                            </p>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white font-sans mt-0.5">
                              {activeClient.nombre_completo || "Cliente VIP"}
                            </h4>
                            <p className="text-slate-500 font-mono text-[10px] mt-0.5">
                              Usuario: <strong className="text-cyan-600">@{activeClient.username}</strong> | Clave: <strong>{activeClient.password}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeClient.celular && (
                              <a
                                href={`https://wa.me/${activeClient.celular.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm hover:scale-[1.01]"
                              >
                                <MessageSquare size={13} />
                                <span>Abrir WhatsApp</span>
                              </a>
                            )}
                            <button
                              onClick={() => setTutorialClient(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl transition-all"
                            >
                              Quitar filtro ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Información de visualización general */
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/10 dark:border-amber-500/20 text-left">
                          <p className="text-xs text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1.5">
                            <span>💡</span>
                            <span>Visualizando Respuestas Rápidas Generales</span>
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-200 mt-1">
                            Selecciona una línea de cliente en el menú de la izquierda para habilitar las respuestas con credenciales, listas de reproducción M3U y recordatorios de vencimiento personalizados.
                          </p>
                        </div>
                      )}

                      {/* Lista de Plantillas */}
                      <div className="space-y-4">
                        {(() => {
                          const templatesToShow = quickTemplates.filter(
                            (t) => !t.requiresClient || activeClient !== null
                          );

                          return templatesToShow.map((t) => {
                            const renderedText = t.getContent(activeClient);
                            return (
                              <div
                                key={t.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                              >
                                {/* Cabecera de la plantilla */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-850/20 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-sans">
                                        {t.title}
                                      </h5>
                                      {t.requiresClient && (
                                        <span className="text-[8px] uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-black tracking-wider">
                                          Cliente
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      {t.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Botón de Editar Plantilla */}
                                    <button
                                      onClick={() => {
                                        setEditingTemplateId(t.id);
                                        const customTpl = systemConfig?.whatsapp_templates || {};
                                        setEditingTemplateText(customTpl[t.id] || DEFAULT_WHATSAPP_TEMPLATES[t.id as keyof typeof DEFAULT_WHATSAPP_TEMPLATES] || "");
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-xl transition-all"
                                    >
                                      <Pencil size={11} />
                                      <span>Editar</span>
                                    </button>

                                    {/* Copiar con botón */}
                                    <button
                                      onClick={() => {
                                        copyToClipboard(
                                          renderedText,
                                          "¡Respuesta rápida copiada con éxito!"
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all hover:scale-[1.01]"
                                    >
                                      <Copy size={11} />
                                      <span>Copiar</span>
                                    </button>
                                    {/* Compartir por WhatsApp directo si hay celular */}
                                    {activeClient?.celular && (
                                      <a
                                        href={`https://wa.me/${activeClient.celular.replace(/\D/g, "")}?text=${encodeURIComponent(renderedText)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-xl transition-all hover:scale-[1.01]"
                                      >
                                        <MessageSquare size={11} />
                                        <span>Enviar WA</span>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Cuerpo / Previsualización u Hoja de Edición */}
                                <div className="p-4 bg-slate-50/20 text-left">
                                  {editingTemplateId === t.id ? (
                                    <div className="space-y-4">
                                      <div className="relative">
                                        <textarea
                                          value={editingTemplateText}
                                          onChange={(e) => setEditingTemplateText(e.target.value)}
                                          rows={10}
                                          className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 font-mono text-slate-800 dark:text-slate-100 leading-relaxed font-semibold"
                                          placeholder="Escribe el texto de tu plantilla aquí..."
                                        />
                                        <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                                          {editingTemplateText.length} caracteres
                                        </div>
                                      </div>

                                      {/* Tags/badges interactivos de variables de reemplazo */}
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                          💡 Haz clic para insertar variables en el texto:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {[
                                            { code: "{nombre}", label: "Nombre Cliente" },
                                            { code: "{usuario}", label: "Usuario" },
                                            { code: "{contrasena}", label: "Contraseña" },
                                            { code: "{servidor}", label: "Servidor URL" },
                                            { code: "{m3u_url}", label: "Playlist M3U" },
                                            { code: "{link_descarga}", label: "Link Descarga App" },
                                            { code: "{fecha_vencimiento}", label: "Vencimiento" },
                                            { code: "{nota}", label: "Nota Admin" },
                                            { code: "{whatsapp}", label: "WA Soporte" },
                                            { code: "{tienda_url}", label: "Tienda Web" }
                                          ].map((varItem) => (
                                            <button
                                              key={varItem.code}
                                              type="button"
                                              onClick={() => {
                                                setEditingTemplateText(prev => prev + varItem.code);
                                              }}
                                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                                            >
                                              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{varItem.code}</span>
                                              <span className="text-slate-400 ml-1 text-[9px]">({varItem.label})</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Controles del editor */}
                                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                        <button
                                          onClick={() => handleSaveTemplate(t.id, editingTemplateText)}
                                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
                                        >
                                          <Check size={12} />
                                          <span>Guardar Plantilla</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingTemplateId(null);
                                            setEditingTemplateText("");
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl transition-all"
                                        >
                                          <X size={12} />
                                          <span>Cancelar</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <pre className="font-mono text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl font-semibold">
                                      {renderedText}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* SECCIÓN DE INVITACIÓN - MINIMENÚ DE SOCIOS Y CLIENTES XTV */}
      {currentMenu === "invitacion" && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Cabecera / Retorno */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <button
              onClick={() => {
                setInvMenuMode(null);
                setInvVendNombre("");
                setInvVendTelefono("");
                setInvVendDireccion("");
                setInvVendUserId("");
                setInvVendCreated(null);
                setInvCliNombre("");
                setInvCliTelefono("");
                setInvCliCreated(null);
                setCurrentMenu("inicio");
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-[1.01]"
            >
              <span>← Volver al Panel de Inicio</span>
            </button>
            <div className="text-right">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Centro de Invitaciones XTV
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Sumar Vendedores y Clientes
              </p>
            </div>
          </div>

          {/* Menú Principal de Invitación o Modos del Formulario */}
          {!invMenuMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Tarjeta de Invitación a Vendedor */}
              <button
                onClick={() => setInvMenuMode('vendedor')}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-left hover:border-indigo-550 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all hover:-translate-y-1 duration-300"
              >
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-5">
                  <UserCheck size={24} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  Invitar a ser Vendedor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Suma nuevos revendedores e intermediarios bajo tu red jerárquica. Podrás asignarles créditos, auditar sus movimientos y ganar comisiones por sus ventas.
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  <span>Comenzar Registro</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>

              {/* Tarjeta de Invitación a Cliente */}
              <button
                onClick={() => setInvMenuMode('cliente')}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-left hover:border-teal-550 dark:hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/5 transition-all hover:-translate-y-1 duration-300"
              >
                <div className="h-12 w-12 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform mb-5">
                  <Tv size={24} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  Invitar a ser Cliente XTV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Genera credenciales de acceso de prueba o planes oficiales para clientes finales de entretenimiento. Genera invitaciones automáticas con descarga de APK directa.
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                  <span>Generar Enlace Demo</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </div>
          ) : invMenuMode === 'vendedor' ? (
            /* ================= FORMULARIO INVITAR VENDEDOR ================= */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Registro de Vendedor Invitado
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase font-black">
                      Nueva cuenta en tu red de afiliados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInvMenuMode(null);
                    setInvVendNombre("");
                    setInvVendTelefono("");
                    setInvVendDireccion("");
                    setInvVendUserId("");
                    setInvVendCreated(null);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  Regresar
                </button>
              </div>

              {invVendCreated ? (
                /* ÉXITO REGISTRO VENDEDOR */
                <div className="space-y-6 text-center py-4 animate-scale-up">
                  <div className="h-14 w-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                    <Check size={28} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      ¡Vendedor Reclutado Exitosamente!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
                      La cuenta se ha creado de manera fidedigna en Supabase. El vendedor ya puede iniciar sesión en la plataforma con sus credenciales.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl max-w-md mx-auto text-left space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-1.5">
                      Ficha de Acceso Vendedor
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      <span className="text-slate-450 uppercase text-[10px]">Nombre:</span>
                      <span className="col-span-2 text-slate-800 dark:text-slate-200">{invVendCreated.nombre}</span>

                      <span className="text-slate-450 uppercase text-[10px]">Email Acceso:</span>
                      <span className="col-span-2 text-indigo-500 dark:text-indigo-400 font-mono">{invVendCreated.email}</span>

                      <span className="text-slate-450 uppercase text-[10px]">Clave Temporal:</span>
                      <span className="col-span-2 text-slate-800 dark:text-slate-200 font-mono">123456</span>

                      <span className="text-slate-450 uppercase text-[10px]">Teléfono:</span>
                      <span className="col-span-2 text-slate-800 dark:text-slate-200">{invVendCreated.telefono_principal || "No especificado"}</span>

                      <span className="text-slate-450 uppercase text-[10px]">Dirección:</span>
                      <span className="col-span-2 text-slate-800 dark:text-slate-200">{invVendCreated.direccion_escrita || "No especificado"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        const wspMsg = `*¡Hola ${invVendCreated.nombre}!* 🚀\nTe invito a formar parte de nuestra red de vendedores de *XTV*.\n\n*Tus datos de acceso:*\n🌐 *Plataforma:* ${window.location.origin}\n📧 *Usuario:* ${invVendCreated.email}\n🔑 *Clave:* 123456\n\n_¡Ya puedes iniciar sesión, cargar créditos y gestionar tus propios clientes!_`;
                        window.open(`https://api.whatsapp.com/send?phone=${invVendCreated.telefono_principal.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(wspMsg)}`, '_blank');
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10"
                    >
                      <MessageSquare size={14} />
                      <span>Compartir por WhatsApp</span>
                    </button>
                    <button
                      onClick={() => {
                        setInvVendNombre("");
                        setInvVendTelefono("");
                        setInvVendDireccion("");
                        setInvVendUserId("");
                        setInvVendCreated(null);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                    >
                      Registrar Otro Vendedor
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULARIO EDITABLE DE VENDEDOR */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!invVendNombre.trim() || !invVendUserId.trim() || !invVendTelefono.trim()) {
                      toast.error("El nombre completo, ID de usuario y teléfono son campos obligatorios.");
                      return;
                    }
                    if (invVendUserIdStatus !== 'available') {
                      toast.error("Por favor, selecciona o ingresa un ID de usuario que se encuentre disponible.");
                      return;
                    }

                    setInvVendSubmitting(true);
                    const cleanId = invVendUserId.trim().toLowerCase();
                    const invitedEmail = cleanId.includes('@') ? cleanId : `${cleanId}@xtv.com`;
                    const inviterEmail = user?.email || userProfile?.email || "admin@xtv.com";

                    // Reclutar usando el método nativo robusto enriquecido
                    const randomUUID = typeof crypto.randomUUID === 'function' 
                      ? crypto.randomUUID() 
                      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                          return v.toString(16);
                        });

                    const profilePayload = {
                      id: randomUUID,
                      email: invitedEmail,
                      nombre: invVendNombre.trim(),
                      rol: "IPTV VENDEDORES",
                      password_hash: "123456",
                      avatar_url: "",
                      foto_perfil: "",
                      creditos: 10,
                      creditos_demo: 15,
                      iptv_invitado_por: inviterEmail,
                      iptv_ventas_directas_cant: 0,
                      iptv_ventas_red_cant: 0,
                      iptv_comisiones_cobradas_total: 0,
                      telefono_principal: invVendTelefono.trim(),
                      direccion_escrita: invVendDireccion.trim(),
                      fecha_inicio: new Date().toISOString()
                    };

                    try {
                      // Insertamos en perfiles_locales
                      const { error: profileError } = await supabase.from("perfiles_locales").insert([profilePayload]);
                      if (profileError) throw profileError;

                      // Insertamos la relación de árbol
                      const newRelation = {
                        id: Math.random().toString(36).substring(2, 11),
                        inviter_email: inviterEmail,
                        invited_email: invitedEmail,
                        creado_al: new Date().toISOString()
                      };

                      try {
                        await supabase.from("iptv_vendedores_relacion").insert([newRelation]);
                      } catch (relErr) {
                        console.warn("Relación no insertada, guardando fallback:", relErr);
                      }

                      // Sincronizar estados locales de Dashboard
                      const updatedRels = [...vendedoresRelaciones, newRelation];
                      setVendedoresRelaciones(updatedRels);
                      localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(updatedRels));
                      setPanelUsers(prev => [...prev.filter(u => u.usuario !== invitedEmail), {
                        ...profilePayload,
                        usuario: invitedEmail
                      }]);

                      setInvVendCreated(profilePayload);
                      toast.success(`Vendedor "${invVendNombre}" registrado de forma fidedigna.`);
                    } catch (err: any) {
                      console.error(err);
                      toast.error(`Error al registrar vendedor: ${err.message || err}`);
                    } finally {
                      setInvVendSubmitting(false);
                    }
                  }}
                  className="space-y-4 text-left"
                >
                  {/* UUID Oculto y Nombre de quien invita */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Patrocinador / Quien Invita
                      </span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {userProfile?.nombre || user?.email || "Administrador Central"}
                      </span>
                    </div>
                    {/* El UUID se conserva de forma oculta en el input de abajo de forma fidedigna */}
                    <input
                      type="hidden"
                      value={userProfile?.id || user?.id || ""}
                      readOnly
                    />
                    <div className="text-right">
                      <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 uppercase">
                        Vínculo Activo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre Completo */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Pedro Picapiedra"
                        value={invVendNombre}
                        onChange={(e) => setInvVendNombre(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Teléfono Móvil *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. +549112345678"
                        value={invVendTelefono}
                        onChange={(e) => setInvVendTelefono(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Dirección Actual */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Dirección Actual
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Siempreviva 742, Springfield"
                      value={invVendDireccion}
                      onChange={(e) => setInvVendDireccion(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                    />
                  </div>

                  {/* ID de Usuario Invitado con Verificación */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                      ID de Usuario Invitado *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ej. vendedorjuan"
                        value={invVendUserId}
                        onChange={(e) => setInvVendUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="w-full p-3.5 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-mono font-semibold"
                      />
                      {/* Icono de verificación interactiva */}
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        {invVendUserIdChecking ? (
                          <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : invVendUserIdStatus === 'available' ? (
                          <div className="h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">
                            ✓
                          </div>
                        ) : invVendUserIdStatus === 'taken' ? (
                          <div className="h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            ×
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Estados de validación y sugerencias */}
                    {invVendUserIdStatus === 'available' && (
                      <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <span>✓ ID de usuario disponible:</span>
                        <span className="font-mono">{invVendUserId.trim().toLowerCase()}@xtv.com</span>
                      </p>
                    )}

                    {invVendUserIdStatus === 'taken' && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl space-y-2">
                        <p className="text-[10px] font-bold text-red-600">
                          ✗ El ID de usuario ya se encuentra registrado. Por favor selecciona una de las siguientes opciones sugeridas libres:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {invVendUserIdSuggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                setInvVendUserId(sug);
                                setInvVendUserIdStatus('available');
                                setInvVendUserIdSuggestions([]);
                              }}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-700 dark:text-red-300 text-[10px] font-mono font-black rounded-lg transition-all"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={invVendSubmitting || invVendUserIdStatus !== 'available'}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-150 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-500/10"
                  >
                    {invVendSubmitting ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Procesando Registro...</span>
                      </>
                    ) : (
                      <span>Completar e Invitar Vendedor</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ================= FORMULARIO INVITAR CLIENTE XTV ================= */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-teal-50 dark:bg-teal-950/40 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <Tv size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Invitación de Cliente XTV
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase font-black">
                      Generar credencial y demo en un clic
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInvMenuMode(null);
                    setInvCliNombre("");
                    setInvCliTelefono("");
                    setInvCliCreated(null);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  Regresar
                </button>
              </div>

              {invCliCreated ? (
                /* INVITACIÓN DE CLIENTE GENERADA */
                <div className="space-y-6 animate-scale-up">
                  <div className="text-center space-y-1.5">
                    <div className="h-12 w-12 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/20">
                      <Check size={24} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      ¡Invitación de Cliente Generada!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
                      La cuenta IPTV ha quedado activa en el panel con el plan de demo seleccionado. Comparte la tarjeta de descarga con el cliente.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl text-left space-y-3 relative group">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-1.5">
                      Mensaje de Invitación (WhatsApp Ready)
                    </span>
                    <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all max-h-[160px] overflow-y-auto">
                      {`*¡Hola ${invCliCreated.nombre}!* 🎬✨\nTu acceso a *XTV Premium* está listo.\n\n*Tus credenciales de acceso:*\n🌐 *Servidor:* http://xtvdigital.net:8080\n👤 *Usuario:* ${invCliCreated.usuario}\n🔑 *Contraseña:* ${invCliCreated.password}\n📱 *Límite:* 2 pantallas simultáneas\n⏳ *Duración:* Plan Demo 2 Horas\n\n⬇️ *Descarga la App de XTV directo desde aquí:* \nhttps://xtv.net/download.apk`}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        const message = `*¡Hola ${invCliCreated.nombre}!* 🎬✨\nTu acceso a *XTV Premium* está listo.\n\n*Tus credenciales de acceso:*\n🌐 *Servidor:* http://xtvdigital.net:8080\n👤 *Usuario:* ${invCliCreated.usuario}\n🔑 *Contraseña:* ${invCliCreated.password}\n📱 *Límite:* 2 pantallas simultáneas\n⏳ *Duración:* Plan Demo 2 Horas\n\n⬇️ *Descarga la App de XTV directo desde aquí:* \nhttps://xtv.net/download.apk`;
                        navigator.clipboard.writeText(message);
                        toast.success("¡Texto de invitación copiado al portapapeles!");
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-500/10"
                    >
                      <FileText size={14} />
                      <span>Copiar Texto Invitación</span>
                    </button>
                    <button
                      onClick={() => {
                        const message = `*¡Hola ${invCliCreated.nombre}!* 🎬✨\nTu acceso a *XTV Premium* está listo.\n\n*Tus credenciales de acceso:*\n🌐 *Servidor:* http://xtvdigital.net:8080\n👤 *Usuario:* ${invCliCreated.usuario}\n🔑 *Contraseña:* ${invCliCreated.password}\n📱 *Límite:* 2 pantallas simultáneas\n⏳ *Duración:* Plan Demo 2 Horas\n\n⬇️ *Descarga la App de XTV directo desde aquí:* \nhttps://xtv.net/download.apk`;
                        window.open(`https://api.whatsapp.com/send?phone=${invCliCreated.celular.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10"
                    >
                      <MessageSquare size={14} />
                      <span>Enviar por WhatsApp</span>
                    </button>
                    <button
                      onClick={() => {
                        setInvCliNombre("");
                        setInvCliTelefono("");
                        setInvCliCreated(null);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                    >
                      Generar Otra Demo
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULARIO EDITABLE DE CLIENTE */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!invCliNombre.trim() || !invCliTelefono.trim()) {
                      toast.error("El nombre completo y el teléfono son campos obligatorios.");
                      return;
                    }

                    setInvCliLoading(true);
                    toast.loading("Generando cuenta demo en API XTV...");

                    // Generar credenciales aleatorias
                    const randUser = "xtv_" + Math.random().toString(36).substring(2, 9);
                    const randPass = Math.floor(100000 + Math.random() * 900000).toString();

                    try {
                      const expirationDate = new Date();
                      expirationDate.setHours(expirationDate.getHours() + 2);

                      const mockClient = {
                        id: Math.random().toString(36).substring(2, 11),
                        nombre_completo: invCliNombre.trim(),
                        celular: invCliTelefono.trim(),
                        usuario: randUser,
                        password: randPass,
                        limite_pantallas: 2,
                        id_plan_venta: "plan_demo_2h",
                        creado_al: new Date().toISOString(),
                        expiracion_al: expirationDate.toISOString(),
                        estado_activo: true,
                        vendedor: user?.email || "vendedor@xtv.com"
                      };

                      // Registrar cliente en BD
                      const { error } = await supabase.from("iptv_clientes").insert([mockClient]);
                      if (error) throw error;

                      // Sincronizar en local
                      const updatedClients = [...accounts, mockClient];
                      setAccounts(updatedClients);
                      localStorage.setItem("g3d_iptv_clientes", JSON.stringify(updatedClients));

                      setInvCliCreated(mockClient);
                      toast.dismiss();
                      toast.success(`Demo generada correctamente para ${invCliNombre}`);
                    } catch (err: any) {
                      toast.dismiss();
                      console.error(err);
                      toast.error(`Error al generar demo IPTV: ${err.message || err}`);
                    } finally {
                      setInvCliLoading(false);
                    }
                  }}
                  className="space-y-4 text-left"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre del Cliente */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Pedro Picapiedra"
                        value={invCliNombre}
                        onChange={(e) => setInvCliNombre(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>

                    {/* Teléfono del Cliente */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Teléfono Móvil *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. +549112345678"
                        value={invCliTelefono}
                        onChange={(e) => setInvCliTelefono(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Plan / Tipo de Demo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Plan de Duración de Demo *
                    </label>
                    <select
                      value={invCliPlan}
                      onChange={(e) => setInvCliPlan(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-semibold appearance-none"
                    >
                      <option value="demo_2h">Prueba Demo Gratis - 2 Horas (2 Pantallas Simultáneas)</option>
                      <option value="demo_24h" disabled>Prueba Premium - 24 Horas (Inhabilitado temporalmente)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={invCliLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-150 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-teal-500/10"
                  >
                    {invCliLoading ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generando Demo...</span>
                      </>
                    ) : (
                      <span>Generar Invitación con Demo Gratis</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL IMPRESIVA DE PREVIEW DE COMPROBANTE DE PAGO CON ZOOM INTELIGENTE Y DESCARGA NATIVA PNG */}
      {viewingComprobante && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 cursor-default animate-fade-in"
          onClick={() => {
            setViewingComprobante(null);
            setZoomActive(false);
          }}
        >
          <div
            className="bg-slate-905 dark:bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-3xl max-w-xl w-full relative overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del visualizador */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-450 animate-ping"></span>
                  Visualizador Inteligente
                </h4>
                <p className="text-[10px] text-slate-450 uppercase font-bold">
                  Auditoría Avanzada de Voucher
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-white font-black text-sm px-3 py-1.5 hover:bg-slate-900 rounded-xl transition-all border border-slate-800"
                onClick={() => {
                  setViewingComprobante(null);
                  setZoomActive(false);
                }}
              >
                Cerrar ×
              </button>
            </div>

            {/* Barra de herramientas / Botones de acción directos */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-850 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setZoomActive(!zoomActive);
                    toast.info(
                      !zoomActive
                        ? "🔍 Zoom Inteligente activado. Usa el puntero en PC o el tacto en móvil."
                        : "Vista estándar completa restaurada.",
                    );
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                    zoomActive
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
                      : "bg-slate-850 hover:bg-slate-800 text-white border border-slate-750"
                  }`}
                >
                  <span className="text-xs">🔍</span>
                  {zoomActive ? "Desactivar Zoom" : "Activar Zoom"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const loadingToast = toast.loading(
                      "Generando y preparando PNG nativo...",
                    );
                    try {
                      const img = new Image();
                      img.crossOrigin = "anonymous";
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          ctx.drawImage(img, 0, 0);
                          // Forzar conversión y descarga en formato PNG nativo auténtico
                          const pngUrl = canvas.toDataURL("image/png");
                          const link = document.createElement("a");
                          link.download = `comprobante_inspeccionado_${Date.now()}.png`;
                          link.href = pngUrl;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.dismiss(loadingToast);
                          toast.success(
                            "📥 ¡Comprobante PNG descargado con éxito!",
                          );
                        } else {
                          toast.dismiss(loadingToast);
                          toast.error(
                            "No se pudo iniciar el canvas de conversión.",
                          );
                        }
                      };
                      img.onerror = () => {
                        toast.dismiss(loadingToast);
                        // Descarga de respaldo si falla canvas
                        const link = document.createElement("a");
                        link.download = `comprobante_respaldo_${Date.now()}.png`;
                        link.href = viewingComprobante;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success("Descargado enlace del comprobante.");
                      };
                      img.src = viewingComprobante;
                    } catch (err) {
                      toast.dismiss(loadingToast);
                      toast.error("Error al procesar la descarga.");
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-black uppercase bg-slate-850 hover:bg-slate-800 text-white border border-slate-750 flex items-center gap-1.5 transition-all"
                >
                  <span>📥</span> Descargar PNG
                </button>
              </div>

              <div className="text-[10px] uppercase font-black text-slate-450 tracking-wider">
                {zoomActive ? "🔍 Inspect Active" : "👁️ Standard View"}
              </div>
            </div>

            {/* Contenido principal del visualizador */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 min-h-[40vh]">
              {!zoomActive ? (
                /* 1. VISTA ESTÁNDAR COMPLETA (Sin Zoom) */
                <div className="space-y-2.5">
                  <div className="bg-slate-950 p-2 rounded-2xl border border-slate-850 flex items-center justify-center relative group overflow-hidden">
                    <img
                      src={viewingComprobante}
                      className="max-h-[55vh] w-auto object-contain rounded-xl select-none"
                      alt="Voucher de pago estándar"
                    />
                  </div>
                  <div className="text-center p-3 bg-slate-900/40 rounded-2xl border border-slate-850/60">
                    <p className="text-[11px] font-bold text-slate-400">
                      💡 ¿Quieres auditar firmas, importes o fechas borrosas?
                      Presiona el botón{" "}
                      <span className="text-cyan-400">🔍 Activar Zoom</span>{" "}
                      arriba.
                    </p>
                  </div>
                </div>
              ) : (
                /* 2. VISTA DE ZOOM INTELIGENTE (Inspector Activo) */
                <div className="space-y-4">
                  {/* COMPORTAMIENTO CELULAR / RESPONSIVE MÓVIL (Táctil con Split Screen) */}
                  <div className="block md:hidden space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-2xl text-[10px] font-bold text-amber-300 text-center uppercase tracking-wide">
                      📱 Modo Móvil: Desliza el dedo abajo para ver la lupa
                      arriba
                    </div>

                    <div className="grid grid-rows-2 gap-3 h-[60vh]">
                      {/* Visor superior (Lente de aumento 50% de zoom - escala ampliada sin tapar con el dedo) */}
                      <div className="bg-slate-950 rounded-2xl border-2 border-cyan-500 relative overflow-hidden shadow-inner flex items-center justify-center">
                        <div className="absolute inset-0 z-10 pointers-events-none flex items-center justify-center">
                          {/* Retícula de mira telescópica en el centro exacto */}
                          <div className="absolute w-8 h-8 rounded-full border border-rose-500/40 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          </div>
                          <div className="absolute w-12 h-[1px] bg-rose-500/30"></div>
                          <div className="absolute h-12 w-[1px] bg-rose-500/30"></div>
                          <span className="absolute bottom-1 right-2 bg-slate-900/80 px-2 py-0.5 rounded-md text-[9px] font-black text-cyan-400 border border-slate-800 uppercase">
                            Visor Lupa
                          </span>
                        </div>

                        {/* Duplicado de la imagen escalada en base a la coordenada de touchPosition */}
                        <img
                          src={viewingComprobante}
                          className="absolute w-full h-full object-contain pointer-events-none"
                          style={{
                            transform: "scale(2.2)",
                            transformOrigin: `${touchPosition.x}% ${touchPosition.y}%`,
                            transition: "transform-origin 0.05s ease-out",
                          }}
                          alt="Detalle ampliado de la captura"
                        />
                      </div>

                      {/* Mapa de toque inferior (Imagen completa táctil) */}
                      <div
                        className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
                        onTouchStart={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const touch = e.touches[0];
                          const x =
                            ((touch.clientX - rect.left) / rect.width) * 100;
                          const y =
                            ((touch.clientY - rect.top) / rect.height) * 100;
                          setTouchPosition({
                            x: Math.max(0, Math.min(100, x)),
                            y: Math.max(0, Math.min(100, y)),
                          });
                        }}
                        onTouchMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const touch = e.touches[0];
                          const x =
                            ((touch.clientX - rect.left) / rect.width) * 100;
                          const y =
                            ((touch.clientY - rect.top) / rect.height) * 100;
                          setTouchPosition({
                            x: Math.max(0, Math.min(100, x)),
                            y: Math.max(0, Math.min(100, y)),
                          });
                        }}
                      >
                        <img
                          src={viewingComprobante}
                          className="w-full h-full object-contain pointer-events-none opacity-40 select-none pb-2"
                          alt="Voucher mapa de toque"
                        />

                        {/* Indicador visible flotante de la mira en la imagen inferior */}
                        <div
                          className="absolute w-6 h-6 rounded-full border-2 border-cyan-455 bg-cyan-400/20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                          style={{
                            left: `${touchPosition.x}%`,
                            top: `${touchPosition.y}%`,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-450"></div>
                        </div>

                        <span className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-400 border border-slate-800">
                          Panel Táctil de Selección (Toca aquí)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COMPORTAMIENTO MOUSE / PC ESCRITORIO (Lupa interactiva de una sola imagen al mover mouse) */}
                  <div className="hidden md:block space-y-2">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-cyan-300 text-center uppercase tracking-wide">
                      🖥️ Modo PC: Pasa y mueve el cursor sobre la imagen para
                      aplicar Zoom exacto
                    </div>

                    <div
                      className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative flex items-center justify-center cursor-crosshair select-none h-[52vh]"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setMousePosition({ x, y });
                      }}
                    >
                      <img
                        src={viewingComprobante}
                        className="w-full h-full object-contain select-none transition-transform duration-75 ease-out"
                        style={{
                          transform: "scale(2.3)",
                          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        }}
                        alt="Detalle lupa escritorio"
                      />

                      <div className="absolute bottom-2.5 right-3 bg-black/75 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-cyan-400 border border-slate-800 pointer-events-none">
                        Zoom: 2.3x (Inspeccionando)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de modal */}
            <div className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Socio Split: Vigilancia</span>
              <span>XTV Auditor v3.1</span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL MODERNA DE ZOOM GENERAL PARA COMPROBANTES DE CONFIGURACIÓN Y ACTIVACIONES --- */}
      {zoomImageUrl && (
        <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
          {/* Cabecera flotante */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-4 text-white z-10">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Maximize2 size={16} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Visor de Comprobantes
                </p>
                <p className="text-[10px] text-slate-400">
                  Usa los controles de abajo o pellizca para aplicar zoom
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setZoomScale(1);
                setZoomImageUrl(null);
              }}
              className="size-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer min-h-[44px]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de la imagen con escala dinámica */}
          <div className="flex-1 w-full max-w-4xl flex items-center justify-center overflow-auto rounded-3xl border border-white/10 bg-slate-900/50 p-4 relative select-none">
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoomScale})`,
              }}
            >
              <img
                src={zoomImageUrl}
                alt="Zoomed Comprobante"
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Barra de controles inferior */}
          <div className="mt-4 bg-slate-900/80 border border-slate-800 backdrop-blur px-6 py-3 rounded-2xl flex items-center gap-4 z-10">
            <button
              onClick={() => setZoomScale((prev) => Math.max(1, prev - 0.5))}
              disabled={zoomScale <= 1}
              className="size-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all min-h-[44px]"
              title="Reducir Zoom"
            >
              <ZoomOut size={16} />
            </button>

            <span className="font-mono text-xs font-bold text-slate-300 w-12 text-center">
              {zoomScale.toFixed(1)}x
            </span>

            <button
              onClick={() => setZoomScale((prev) => Math.min(5, prev + 0.5))}
              disabled={zoomScale >= 5}
              className="size-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all min-h-[44px]"
              title="Aumentar Zoom"
            >
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-6 bg-slate-850"></div>

            <button
              onClick={() => setZoomScale(1)}
              disabled={zoomScale === 1}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase transition-all min-h-[44px]"
            >
              Resetear
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE NOTA DE RECHAZO DE TICKET */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                ⚠️ Especificar Motivo de Rechazo
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Indica el motivo del rechazo. Esto le permitirá al socio
                corregir el error y reenviar la solicitud corregida de
                inmediato.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-500 block">
                Motivo o Notas de Corrección
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: El comprobante adjunto pertenece a otro pago o los datos de usuario propuesto ya están en uso."
                className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500 outline-none resize-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectionModalOpen(false);
                  setRejectionRequestId(null);
                  setRejectionReason("");
                }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error("Por favor, especifica un motivo de rechazo.");
                    return;
                  }
                  if (rejectionRequestId) {
                    const req = creditRequests.find(
                      (r) => r.id === rejectionRequestId,
                    );
                    handleProcessRequest(
                      rejectionRequestId,
                      "rechazado",
                      req?.detalles,
                      rejectionReason.trim(),
                    );
                  }
                  setRejectionModalOpen(false);
                  setRejectionRequestId(null);
                  setRejectionReason("");
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-lg shadow-red-500/10"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CLIENTE */}
      {deleteConfirmUsernames && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            <div>
              <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                ⚠️ ¿Confirmar Eliminación Irreversible?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Estás a punto de eliminar de forma permanente{" "}
                {deleteConfirmUsernames.length === 1
                  ? "este cliente"
                  : `estos ${deleteConfirmUsernames.length} clientes`}
                . Esta acción no se puede deshacer y purgará todos los
                subperfiles, historiales de renovación y comprobantes asociados
                de la base de datos de producción.
              </p>
            </div>

            <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/45 dark:border-rose-900/30 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-black text-rose-600 block">
                Cuentas que se purgarán:
              </span>
              <div className="max-h-24 overflow-y-auto text-xs font-mono font-bold text-slate-700 dark:text-slate-300 space-y-1">
                {deleteConfirmUsernames.map((u, i) => (
                  <div key={u} className="flex items-center gap-1.5">
                    <span className="text-rose-400">{i + 1}.</span>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUsernames(null)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteClients(deleteConfirmUsernames)}
                className="flex-1 py-3 bg-rose-650 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-lg shadow-rose-500/10"
              >
                Sí, Eliminar de raíz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALTA EXITOSA CON MENSAJE RESPUESTA WHATSAPP */}
      {approvedMessageModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            <div>
              <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                🚀 ¡Alta Activada con Éxito!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La cuenta de cliente IPTV se ha registrado en Supabase y se ha
                enlazado con el panel físico de producción. Copia el siguiente
                mensaje preformateado para responder al socio de inmediato.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-slate-500 block">
                  Mensaje de Respuesta Generado
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(approvedMessageModal);
                    toast.success(
                      "Mensaje copiado al portapapeles correctamente",
                    );
                  }}
                  className="px-2.5 py-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 rounded-lg hover:scale-105 transition-all font-bold flex items-center gap-1"
                >
                  <Copy size={11} />
                  Copiar Mensaje
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={approvedMessageModal}
                  className="w-full h-44 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setApprovedMessageModal(null);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-lg"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA CREACION CUENTA DIRECTA BLOQUEADA */}
      {showDirectBlockModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            <div className="text-center">
              <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200/50 dark:border-amber-800/30">
                <Lock size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Acceso Restringido
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-200 mt-2 leading-relaxed">
                No tienes el permiso{" "}
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 bg-amber-100/30 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md">
                  Iptv.CrearDirecto.Acceder
                </span>{" "}
                asignado.
              </p>
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 text-slate-600 dark:text-slate-300 text-xs leading-normal">
                📍 Puedes solicitar la creación directa de cuentas a un{" "}
                <strong>Administrador</strong> del sistema o adquirir un rol con
                privilegios autorizados.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDirectBlockModal(false);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors"
              >
                Cerrar Mensaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONSOLA DE COMANDOS Y LOGS DE LA API XC --- */}
      {(hasPermission("Admin.*") ||
        hasPermission("Iptv.*") ||
        hasPermission("Admin.ConsolaAPI.Ver") ||
        isAdmin) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mt-12 text-slate-100 font-sans shadow-2xl relative overflow-hidden">
          {/* Fondo sutil estilo terminal */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Terminal size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Consola de Comandos y Logs de la API XC
                </h3>
                <p className="text-[10px] text-slate-400">
                  Inspecciona las peticiones enviadas al servidor físico y las
                  respuestas recibidas en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={apiInterceptorActive}
                  onChange={(e) => setApiInterceptorActive(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="text-[10px] font-bold text-slate-400">
                  Interceptor de API (Editar pre-envío)
                </span>
                <div className="relative w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white"></div>
              </label>

              <button
                onClick={() => {
                  setApiLogs([]);
                  try {
                    localStorage.removeItem("g3d_xc_api_logs");
                  } catch (e) {}
                  toast.success("Historial de logs de API limpiado");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-400 transition-colors cursor-pointer"
              >
                Limpiar Historial
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden min-h-[180px] max-h-[400px] overflow-y-auto">
            {apiLogs.length > 0 ? (
              <div className="divide-y divide-slate-850">
                {apiLogs.map((log) => {
                  const isExpanded = !!expandedLogs[log.id];
                  const logDetectedId = log.responsePayload?.raw_response?.data?.id || 
                                        log.responsePayload?.data?.id || 
                                        log.responsePayload?.id || 
                                        log.requestPayload?.id;
                  const logUser = log.responsePayload?.username || 
                                  log.responsePayload?.data?.username || 
                                  log.requestPayload?.username || 
                                  "";
                  const logNotes = log.requestPayload?.reseller_notes || "";

                  return (
                    <div key={log.id} className="text-xs font-mono">
                      {/* Cabecera del Log */}
                      <div
                        onClick={() => toggleLogExpanded(log.id)}
                        className="p-3 hover:bg-slate-900/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-sans">
                            {log.timestamp}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              log.action === "create_line" &&
                              log.requestPayload?.trial === 1
                                ? "bg-cyan-950 text-cyan-400 border border-cyan-800/30"
                                : log.action === "extend_line"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30"
                                : "bg-indigo-950 text-indigo-400 border border-indigo-800/30"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-slate-300 font-bold max-w-[200px] sm:max-w-[340px] truncate">
                            {logNotes ? logNotes : logUser ? `Usuario: ${logUser}` : "Petición a Servidor XC"}
                            {logDetectedId ? ` (ID: #${logDetectedId})` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 ${
                              log.success
                                ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/30"
                                : "bg-red-950/50 text-red-400 border border-red-800/30"
                            }`}
                          >
                            {log.success ? "✓ EXITO" : "✗ ERROR"}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* Detalles Expandidos */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950/80 border-t border-slate-850 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Comando/Payload enviado */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans uppercase font-black tracking-wider">
                                <span>Payload de API Solicitado</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      JSON.stringify(
                                        log.requestPayload,
                                        null,
                                        2,
                                      ),
                                    );
                                    toast.success("Payload copiado");
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                >
                                  <Copy size={11} /> Copiar
                                </button>
                              </div>
                              <pre className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[10px] text-slate-300 max-h-[180px] border border-slate-800">
                                {JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>

                            {/* Respuesta del Servidor XC */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans uppercase font-black tracking-wider">
                                <span>Respuesta en Bruto del Servidor</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      JSON.stringify(
                                        log.responsePayload,
                                        null,
                                        2,
                                      ),
                                    );
                                    toast.success("Respuesta copiada");
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                >
                                  <Copy size={11} /> Copiar
                                </button>
                              </div>
                              <pre
                                className={`p-3 rounded-xl overflow-x-auto text-[10px] max-h-[180px] border ${
                                  log.success
                                    ? "bg-slate-900 text-emerald-300 border-slate-800"
                                    : "bg-red-950/20 text-red-300 border-red-900/30"
                                }`}
                              >
                                {log.responsePayload
                                  ? JSON.stringify(log.responsePayload, null, 2)
                                  : "No se recibió respuesta o fallo de conexión"}
                              </pre>
                            </div>
                          </div>

                          {log.error && (
                            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] text-red-300">
                              <span className="font-sans font-black uppercase text-[9px] text-red-400 block mb-1">
                                Detalle del Error Técnico:
                              </span>
                              {log.error}
                            </div>
                          )}

                          {log.warnings && log.warnings.length > 0 && (
                            <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-[11px] text-amber-300 space-y-1">
                              <span className="font-sans font-black uppercase text-[9px] text-amber-400 block">
                                ⚠️ Advertencias de Revendedor / Panel:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                                {log.warnings.map((w: any, wIdx: number) => (
                                  <li key={wIdx}>{typeof w === "string" ? w : (w.message || JSON.stringify(w))}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Terminal className="size-8 mx-auto mb-2 text-slate-600 opacity-50" />
                No se han registrado llamadas a la API en esta sesión de
                trabajo.
                <p className="text-[10px] text-slate-600 mt-1">
                  Crea una cuenta demo o comercial para ver la depuración en
                  vivo.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DEL INTERCEPTOR DE API XC (EDITAR PAYLOAD ANTES DE ENVIAR) --- */}
      {pendingApiCall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl max-w-2xl w-full text-slate-100 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-850 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white font-sans">
                  Interceptor de API XC (Pre-Envío)
                </h3>
                <p className="text-xs text-slate-400">
                  Inspecciona y edita el JSON del comando generado antes de
                  enviarlo físicamente al panel.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-sans">
                  Acción de la petición:{" "}
                  <span className="text-cyan-400 uppercase font-mono font-black">
                    {pendingApiCall.action}
                  </span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/30 font-sans">
                  COMANDO DETENIDO
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-sans font-bold">
                  <span>Editor de JSON (Payload):</span>
                  {jsonValidationError ? (
                    <span className="text-red-400 font-bold text-[10px]">
                      ⚠️ JSON Inválido: {jsonValidationError}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[10px]">
                      ✓ JSON Sintaxis Válida
                    </span>
                  )}
                </div>

                <textarea
                  value={apiEditedJson}
                  onChange={(e) => {
                    const val = e.target.value;
                    setApiEditedJson(val);
                    try {
                      JSON.parse(val);
                      setJsonValidationError(null);
                    } catch (err: any) {
                      setJsonValidationError(err.message);
                    }
                  }}
                  className="w-full h-80 bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed space-y-1 font-sans">
                <p className="font-bold text-white">
                  💡 ¿Qué puedes hacer aquí?
                </p>
                <p>
                  • Cambiar el{" "}
                  <code className="text-cyan-400 font-mono">username</code>,{" "}
                  <code className="text-cyan-400 font-mono">password</code>, o{" "}
                  <code className="text-cyan-400 font-mono">packageId</code>.
                </p>
                <p>
                  • Probar valores modificados para validar las reglas del
                  backend.
                </p>
                <p>
                  • El comando se enviará al endpoint{" "}
                  <code className="text-cyan-400 font-mono">/api/iptv/xui</code>{" "}
                  simulando la llamada editada.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-950 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => {
                  pendingApiCall.onCancel();
                  setPendingApiCall(null);
                  toast.error("Operación abortada.");
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
              >
                Cancelar Operación
              </button>

              <button
                disabled={!!jsonValidationError}
                onClick={async () => {
                  if (jsonValidationError) return;
                  try {
                    const parsedPayload = JSON.parse(apiEditedJson);
                    const call = pendingApiCall;
                    setPendingApiCall(null);
                    toast.loading(
                      "Enviando comando editado al panel físico...",
                    );
                    await call.onConfirm(parsedPayload);
                  } catch (err: any) {
                    toast.dismiss();
                    toast.error("Error al ejecutar comando: " + err.message);
                  }
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  jsonValidationError
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                ✓ Enviar Comando Editado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN ESTILO WINDOWS / CELULAR IN-APP INTERACTIVA */}
      {activeNotification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 rounded-3xl p-5 shadow-2xl animate-fade-in text-white pointer-events-auto">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 animate-bounce">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0 text-left text-white">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  Nueva Solicitud Activa 🔔
                </span>
                <button
                  onClick={() => setActiveNotification(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <p className="font-extrabold text-sm text-slate-100 mt-1 truncate">
                {activeNotification.detalles?.nombre_completo || "Cliente Nuevo"}
              </p>
              <p className="text-xs text-slate-350 mt-0.5 font-bold">
                Plan: {activeNotification.detalles?.plan_nombre || "IPTV Plan"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Por: {activeNotification.reseller_usuario}
              </p>
              
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedActivationRequest(activeNotification);
                    setIsEditingRequest(false);
                    setAdminApprovalNotes("");
                    setApprovalUser(activeNotification.detalles?.usuario_propuesto || "");
                    setApprovalPass(activeNotification.detalles?.contrasena_propuesta || "");
                    setSolicitudTab("pendientes");
                    setActiveNotification(null);
                    
                    // Hacer scroll suave para enfocar el panel
                    const container = document.getElementById("xtv-panel-main");
                    if (container) {
                      container.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase rounded-xl transition shadow-sm"
                >
                  Ver Solicitud
                </button>
                <button
                  onClick={() => setActiveNotification(null)}
                  className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] font-black uppercase rounded-xl transition border border-slate-800"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN DE CUENTA ACTIVADA (CON VISTA PREVIA Y WHATSAPP) */}
      {activeApprovalNotification && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in text-white">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative text-left">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                  ¡Línea Activada en Base de Datos! 🚀
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {activeApprovalNotification.detalles?.nombre_completo || "Cliente Nuevo"}
                </h3>
              </div>
              <button
                onClick={() => setActiveApprovalNotification(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Vista Previa de la Cuenta en BD */}
            <div className="mt-4 bg-[#111214]/50 border border-slate-800/80 rounded-2xl p-4 space-y-2 font-mono text-[11px] leading-relaxed">
              <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-400">CLIENTE:</span>
                <span className="font-bold text-white truncate max-w-[200px]">
                  {activeApprovalNotification.detalles?.nombre_completo || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-400">USUARIO:</span>
                <span className="font-bold text-emerald-400 select-all">
                  {activeApprovalNotification.detalles?.usuario_propuesto || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-400">CONTRASEÑA:</span>
                <span className="font-bold text-emerald-400 select-all">
                  {activeApprovalNotification.detalles?.contrasena_propuesta || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-400">PLAN:</span>
                <span className="font-bold text-white text-right">
                  {activeApprovalNotification.detalles?.plan_nombre || "IPTV Plan"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CELULAR:</span>
                <span className="font-bold text-white">
                  {activeApprovalNotification.detalles?.celular || "N/A"}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 italic leading-normal">
              La cuenta ya está guardada de forma segura en la base de datos de Supabase. Abajo tienes el mensaje preformateado para enviar directamente por WhatsApp al cliente.
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  const name = activeApprovalNotification.detalles?.nombre_completo || "";
                  const userProposed = activeApprovalNotification.detalles?.usuario_propuesto || "";
                  const passProposed = activeApprovalNotification.detalles?.contrasena_propuesta || "";
                  const plan = activeApprovalNotification.detalles?.plan_nombre || "IPTV Plan";
                  const phone = activeApprovalNotification.detalles?.celular || "";
                  const xcUrl = systemConfig?.xc_url_completa || systemConfig?.xui_url || "http://vip-xtv.pro:8080";
                  
                  const message = `*¡Hola ${name}!* Tu servicio de TV ya se encuentra *ACTIVO y listo para disfrutar.* 📺✨\n\n*Detalles de tu cuenta:*\n👤 *Usuario:* \`${userProposed}\`\n🔑 *Contraseña:* \`${passProposed}\`\n📦 *Plan:* ${plan}\n🌐 *Servidor:* ${xcUrl}\n\n¡Gracias por confiar en nosotros! Que disfrutes del mejor entretenimiento.`;
                  
                  navigator.clipboard.writeText(message);
                  toast.success("Mensaje copiado al portapapeles");
                  
                  if (phone) {
                    const waUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, "_blank");
                  } else {
                    toast.error("El cliente no tiene un teléfono registrado para WhatsApp.");
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-black uppercase rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Compartir por WhatsApp al Cliente
              </button>
              
              <button
                onClick={() => setActiveApprovalNotification(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white text-[11px] font-black uppercase rounded-xl transition border border-slate-700/50 text-center"
              >
                Cerrar Notificación
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayoutConfirmModal && selectedCommissionPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Paso Final</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Liquidar Transferencia</h3>
              </div>
              <button
                onClick={() => setShowPayoutConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div>
                  <p className="text-slate-400 font-bold">Destinatario:</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{selectedCommissionPayout.requesterName}</p>
                  <p className="text-slate-400 font-mono mt-0.5">{selectedCommissionPayout.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">Monto de Transferencia:</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">${selectedCommissionPayout.totalRequested} ARS</p>
                </div>
              </div>

              {/* Subida del Comprobante */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                  Comprobante de Transferencia *
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all rounded-2xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer flex-1 text-slate-600 dark:text-slate-300 min-h-[44px]">
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <span className="text-xs font-black">Subir Captura</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const loadingToast = toast.loading("Comprimiendo y optimizando comprobante...");
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              try {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 800;
                                const MAX_HEIGHT = 800;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height = Math.round((height * MAX_WIDTH) / width);
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width = Math.round((width * MAX_HEIGHT) / height);
                                    height = MAX_HEIGHT;
                                  }
                                }

                                canvas.width = width;
                                canvas.height = height;

                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL("image/jpeg", 0.65);
                                  setPayoutProofImage(compressedBase64);
                                  toast.dismiss(loadingToast);
                                  toast.success("¡Captura optimizada correctamente de forma segura (~40 KB)!");
                                } else {
                                  setPayoutProofImage(event.target?.result as string);
                                  toast.dismiss(loadingToast);
                                  toast.success("Cargado sin compresión.");
                                }
                              } catch (err) {
                                console.error("Error al renderizar canvas:", err);
                                setPayoutProofImage(event.target?.result as string);
                                toast.dismiss(loadingToast);
                                toast.success("Comprobante cargado.");
                              }
                            };
                            img.onerror = () => {
                              setPayoutProofImage(event.target?.result as string);
                              toast.dismiss(loadingToast);
                              toast.success("Comprobante cargado.");
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  {payoutProofImage && (
                    <div className="relative group shrink-0 size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <img src={payoutProofImage} alt="Preview" className="size-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Notas de referencia */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Notas o Referencia de Pago</label>
                <textarea
                  placeholder="Ej: Transferido por Galicia. Transacción #123456..."
                  value={payoutRefNotes}
                  rows={2}
                  onChange={(e) => setPayoutRefNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-slate-850 text-xs dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPayoutConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all"
              >
                Atrás
              </button>
              <button
                onClick={async () => {
                  if (!payoutProofImage) {
                    toast.error("Por favor, sube el comprobante de transferencia para liquidar.");
                    return;
                  }
                  setIsSubmittingPayout(true);
                  try {
                    const updatedPagos = [...finanzasComisionesPagos];
                    const nowStr = new Date().toISOString();

                    for (const item of selectedCommissionPayout.items) {
                      const existingIdx = updatedPagos.findIndex(p => p.cliente_id === item.cliente_id);
                      const record = existingIdx !== -1 ? { ...updatedPagos[existingIdx] } : {
                        id: Math.random().toString(36).substring(2, 11),
                        cliente_id: item.cliente_id,
                        cliente_nombre: item.cliente_nombre,
                        plan_nombre: item.plan_nombre,
                        vendedor_email: item.seller,
                        reclutador_email: item.recruiter || "",
                        comision_total: item.totalComm,
                        comision_vendedor: item.vComm,
                        comision_reclutador: item.rComm,
                        creado_al: item.creado_al || nowStr,
                        pagado_vendedor_al: null,
                        pagado_reclutador_al: null,
                        comprobante_img: "",
                        solicitado_vendedor: item.isSellerRequested,
                        solicitado_reclutador: item.isRecruiterRequested,
                        solicitado_vendedor_al: item.requestedSellerAt,
                        solicitado_reclutador_al: item.requestedRecruiterAt,
                        notes: item.notes || ""
                      };

                      if (item.type === "vendedor") {
                        record.pagado_vendedor_al = nowStr;
                        record.comprobante_img = payoutProofImage;
                        record.notes = payoutRefNotes || record.notes;
                        
                        // Calcular estado de pago
                        const recruiterPaid = record.pagado_reclutador_al || !record.reclutador_email;
                        record.estado_pago = recruiterPaid ? "completo" : "vendedor_pagado";
                      } else {
                        record.pagado_reclutador_al = nowStr;
                        record.comprobante_img = payoutProofImage;
                        record.notes = payoutRefNotes || record.notes;

                        const sellerPaid = record.pagado_vendedor_al;
                        record.estado_pago = sellerPaid ? "completo" : "reclutador_pagado";
                      }

                      // Guardar en Supabase
                      await supabase.from("iptv_finanzas_comisiones").upsert([record]);

                      if (existingIdx !== -1) {
                        updatedPagos[existingIdx] = record;
                      } else {
                        updatedPagos.push(record);
                      }
                    }

                    setFinanzasComisionesPagos(updatedPagos);
                    localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(updatedPagos));

                    // Liberar bloqueo de concurrencia
                    const updatedLocks = { ...(systemConfig?.commission_locks || {}) };
                    delete updatedLocks[selectedCommissionPayout.requesterEmail];
                    const updatedConfig = { ...systemConfig, commission_locks: updatedLocks };
                    await apiService.updateSystemConfig(updatedConfig);
                    setSystemConfig(updatedConfig);

                    setSelectedCommissionPayout(null);
                    setShowPayoutConfirmModal(false);
                    toast.success("¡Pago de comisiones liquidado con éxito!");
                  } catch (err: any) {
                    toast.error(`Error al procesar pago: ${err.message || err}`);
                  } finally {
                    setIsSubmittingPayout(false);
                  }
                }}
                disabled={isSubmittingPayout}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmittingPayout ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check</span> Confirmar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal de Edición de Encabezados (Inicio XTV) */}
      {editWelcomeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil size={16} className="text-amber-500" />
                Editar Encabezados de Inicio (XTV)
              </h3>
              <button onClick={() => setEditWelcomeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Prefijo de Bienvenida</label>
                <input 
                  type="text" 
                  value={tempWelcome.welcomePrefix}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, welcomePrefix: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Sufijo de Bienvenida</label>
                <input 
                  type="text" 
                  value={tempWelcome.welcomeSuffix}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, welcomeSuffix: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Etiqueta del Botón de Créditos</label>
                <input 
                  type="text" 
                  value={tempWelcome.creditsLabel}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, creditsLabel: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setEditWelcomeModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveWelcome}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal de Edición de Tarjetas del Launchpad (XTV) */}
      {editCardId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil size={16} className="text-amber-500" />
                Editar Botón: {tempCard.title}
              </h3>
              <button onClick={() => setEditCardId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none text-left">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Título del Botón</label>
                <input 
                  type="text" 
                  value={tempCard.title}
                  onChange={(e) => setTempCard({ ...tempCard, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Badge Informativo</label>
                <input 
                  type="text" 
                  value={tempCard.badge}
                  onChange={(e) => setTempCard({ ...tempCard, badge: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-2">Seleccionar Ícono</label>
                <div className="grid grid-cols-5 gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-150 dark:border-slate-900">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const IconComponent = ICON_MAP[iconKey];
                    const isSelected = tempCard.iconName === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setTempCard({ ...tempCard, iconName: iconKey })}
                        className={`size-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500 scale-105 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                        title={iconKey}
                      >
                        <IconComponent size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cargar nuevo SVG / PNG */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Cargar Ícono Personalizado (SVG / PNG)</label>
                
                {tempCard.customIcon ? (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="size-12 rounded-xl bg-slate-950/20 backdrop-blur-sm flex items-center justify-center border border-slate-200/20 shadow-sm p-1">
                      <img src={tempCard.customIcon} className="size-full object-contain" alt="Custom Icon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Ícono Personalizado Activo</p>
                      <p className="text-[10px] text-slate-400">Guardado en formato base64</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTempCard({ ...tempCard, customIcon: null })}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempCard(prev => ({ ...prev, customIcon: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/png, image/svg+xml, image/jpeg';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTempCard(prev => ({ ...prev, customIcon: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30 flex flex-col items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-2xl text-slate-500 dark:text-slate-100">upload_file</span>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Arrastra un archivo aquí o haz clic para explorar</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-100 uppercase tracking-widest mt-0.5">Soporta SVG, PNG y JPG (se adaptará al diseño)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Gradient Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1.5">Color de Fondo 1</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={tempCard.color1}
                      onChange={(e) => setTempCard({ ...tempCard, color1: e.target.value })}
                      className="size-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={tempCard.color1}
                      onChange={(e) => setTempCard({ ...tempCard, color1: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1.5">Color de Fondo 2</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={tempCard.color2}
                      onChange={(e) => setTempCard({ ...tempCard, color2: e.target.value })}
                      className="size-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={tempCard.color2}
                      onChange={(e) => setTempCard({ ...tempCard, color2: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setEditCardId(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveCard}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
