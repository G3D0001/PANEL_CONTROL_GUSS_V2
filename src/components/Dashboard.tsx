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

// Componente para manejar visualizaci√≥n y copiado seguro de contrase√±as
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
        {show ? value : "‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢"}
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
        onClick={() => onCopy(value, "Contrase√±a copiada al portapapeles")}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="Copiar contrase√±a"
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
  bienvenida: `üé¨ *¬°Bienvenido a XTV!* üé¨\n\nHola *{nombre}*, tu cuenta VIP ha sido activada con √©xito. Aqu√≠ tienes tus credenciales de acceso para disfrutar del mejor entretenimiento:\n\nüë§ *Usuario:* {usuario}\nüîë *Contrase√±a:* {contrasena}\nüåê *Servidor:* {servidor}\nüåê *Playlist M3U8:* {m3u_url}\n\nüì• *Link de descarga de la App:* {link_descarga}\n\nüí° *Instrucciones de ingreso:*\n1. Descarga e instala la aplicaci√≥n desde el link anterior.\n2. Abre la app e ingresa tu Usuario y Contrase√±a.\n3. ¬°Listo! Ya puedes empezar a disfrutar de todo nuestro contenido.{nota}`,
  
  credenciales_rapidas: `Credenciales de *{nombre}*\nüë§ Usuario: {usuario}\nüîë Contrase√±a: {contrasena}\nüåê Servidor: {servidor}\nüåê Playlist M3U8: {m3u_url}`,
  
  recordatorio: `‚ö†Ô∏è *Aviso de Vencimiento - XTV* ‚ö†Ô∏è\n\nHola *{nombre}*, queremos recordarte que tu servicio de IPTV est√° pr√≥ximo a vencer:\n\nüë§ *Usuario/L√≠nea:* {usuario}\nüìÖ *Fecha de Vencimiento:* {fecha_vencimiento}\n\nPara renovar tu plan por un nuevo per√≠odo y continuar disfrutando de la programaci√≥n sin cortes, puedes ponerte en contacto con nosotros para registrar tu pago y renovar tu vigencia. ¬°Muchas gracias por tu preferencia!`,
  
  guia_descarga_general: `üì± *Descarga Oficial XTV* üì±\n\n¬°Hola! Aqu√≠ tienes el enlace oficial para descargar e instalar nuestra aplicaci√≥n en tus dispositivos Android, Fire Stick o TV Box:\n\nüì• *Descargar APK:* {link_descarga}\n\nüé¨ *¬øQu√© ofrecemos?*\n‚úÖ M√°s de 10.000 Canales en Vivo (Deportes, Premium, Nacionales, Internacionales).\n‚úÖ Pel√≠culas y Series de estreno (Netflix, Prime, Disney, HBO, etc.).\n‚úÖ Calidad HD, FHD y 4K.\n\n_Si necesitas una cuenta de prueba gratuita o activar tu suscripci√≥n, av√≠same y con gusto te la genero en minutos._`,
  
  metodos_pago: `üí≥ *M√©todos de Pago Autorizados* üí≥\n\nHola, para renovar o adquirir tu suscripci√≥n de *XTV*, puedes realizar tu transferencia o dep√≥sito a trav√©s de las siguientes opciones:\n\nüîπ *Mercado Pago / Transferencia bancaria:*\n- CVU/Alias: *xtv.oficial.mp*\n- Titular: XTV Suscripciones\n\nüëâ *Importante:* Una vez realizado el pago, por favor env√≠a una foto del comprobante/voucher junto con tu nombre de usuario para aplicar la activaci√≥n o renovaci√≥n de inmediato.\n\nüìû *Soporte WhatsApp:* {whatsapp}\nüåê *Tienda Web:* {tienda_url}`,
  
  smart_tv_gen: `üì∫ *Instrucciones para Smart TV - XTV* üì∫\n\nPara disfrutar de nuestro servicio en tu Smart TV (Samsung, LG, Sony, etc.), puedes utilizar aplicaciones populares como:\n\n1Ô∏è‚É£ *IPTV Smarters Pro* o *Smarters Player Lite* (Buscar en la tienda de apps de tu TV).\n2Ô∏è‚É£ *XCIPTV Player*.\n3Ô∏è‚É£ *Ibo Player* / *DuplexPlay*.\n\nCuando abras la aplicaci√≥n seleccionada, elige la opci√≥n de cargar lista mediante *API de Xtream Codes* e ingresa la URL de nuestro servidor:\nüëâ *URL del Servidor:* {servidor}\n\n_Av√≠same una vez instalada la app para proporcionarte tu Usuario y Contrase√±a de prueba o activaci√≥n comercial._`,
  
  firestick_gen: `üî• *Gu√≠a de Instalaci√≥n para Amazon Fire Stick / Android TV* üî•\n\nPara instalar nuestra aplicaci√≥n en dispositivos Fire Stick o Android TV, sigue estos sencillos pasos generales:\n\n1Ô∏è‚É£ Descarga la app gratuita *Downloader* desde la tienda de aplicaciones de tu dispositivo.\n2Ô∏è‚É£ Abre Downloader, ve a la secci√≥n Home y escribe el siguiente enlace de descarga directa:\nüëâ *{link_descarga}*\n3Ô∏è‚É£ Espera que finalice la descarga e instala la aplicaci√≥n (si te solicita permisos para or√≠genes desconocidos, ac√©ptalos en la configuraci√≥n de seguridad).\n4Ô∏è‚É£ Abre la aplicaci√≥n *XTV* una vez instalada.\n\n_Por favor, solic√≠tame tu Usuario y Contrase√±a para ingresar y comenzar a ver de inmediato._`
};

export function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, userRole, simulatedRole, setSimulatedRole, hasPermission, userProfile } =
    useAuth();
  const { businessProfile } = useApp();

  // Funci√≥n de mapeo de plantilla con datos din√°micos
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

  // Estados locales de la aplicaci√≥n Registros XTV
  const [loading, setLoading] = useState(true);
  const [panelUsers, setPanelUsers] = useState<any[]>([]);

  // Separaci√≥n de Cr√©ditos VIP y Demo
  const [currentUserCredits, setCurrentUserCredits] = useState<number>(0); // VIP fallback
  const [currentUserCreditsVIP, setCurrentUserCreditsVIP] = useState<number>(0);
  const [currentUserCreditsDemo, setCurrentUserCreditsDemo] =
    useState<number>(0);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Funci√≥n para eliminar clientes seleccionados o individuales de Supabase y localmente
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
        "Ocurri√≥ un error general al intentar eliminar los clientes: " +
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
        toast.success("Plantilla guardada y sincronizada en Supabase con √©xito.");
      } else {
        throw new Error("No se pudo persistir en la base de datos.");
      }
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    }
  };

  // Alarma auditiva y configuraci√≥n
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

  // Estados de Personalizaci√≥n del Inicio
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
      creditsLabel: systemConfig?.dashboard_customizations?.creditsLabel || "Cr√©ditos XC Panel"
    });
    setEditWelcomeModal(true);
  };

  const handleSaveWelcome = async () => {
    try {
      const toastId = toast.loading("Guardando personalizaci√≥n del inicio...");
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
        toast.success("¬°Inicio de XTV personalizado guardado correctamente!");
        setEditWelcomeModal(false);
      } else {
        toast.error("Error al guardar personalizaci√≥n en la nube.");
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || String(err)));
    }
  };

  // Estados de Edici√≥n de Tarjetas del Launchpad
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
      const toastId = toast.loading("Guardando personalizaci√≥n de la tarjeta...");
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
        toast.success("¬°Tarjeta personalizada guardada correctamente!");
        setEditCardId(null);
      } else {
        toast.error("Error al guardar personalizaci√≥n en la nube.");
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || String(err)));
    }
  };

  // Estados del Men√∫ y de Navegaci√≥n del Launchpad
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

  // Estados para la edici√≥n inline de una solicitud de activaci√≥n pendiente
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
      toast.error("La direcci√≥n del cliente es requerida.");
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

  // --- FUNCIONES NATIVAS DE GESTI√ìN DE FINANZAS Y RED DE VENDEDORES (XTV) ---
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

      // 2. Registrar la relaci√≥n en la tabla o local
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
        console.warn("Error insertando relaci√≥n en Supabase, guardando localmente:", e);
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
      toast.error(`Error al registrar relaci√≥n de vendedor: ${err.message || err}`);
      return false;
    }
  };

  const handleDeleteVendedorRelacion = async (relId: string) => {
    try {
      try {
        await supabase.from("iptv_vendedores_relacion").delete().eq("id", relId);
      } catch (e) {
        console.warn("Error eliminando relaci√≥n en Supabase:", e);
      }
      const updatedRels = vendedoresRelaciones.filter(r => r.id !== relId);
      setVendedoresRelaciones(updatedRels);
      localStorage.setItem("g3d_vendedores_relacion", JSON.stringify(updatedRels));
      toast.success("Relaci√≥n eliminada correctamente.");
    } catch (err: any) {
      toast.error(`Error al eliminar relaci√≥n: ${err.message || err}`);
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
        console.warn("Error guardando liquidaci√≥n en Supabase, guardando local:", e);
      }

      const updatedPagos = [...finanzasComisionesPagos.filter(p => p.cliente_id !== clienteId), payoutRecord];
      setFinanzasComisionesPagos(updatedPagos);
      localStorage.setItem("g3d_finanzas_comisiones", JSON.stringify(updatedPagos));

      return payoutRecord;
    } catch (err: any) {
      toast.error(`Error al registrar liquidaci√≥n: ${err.message || err}`);
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
      notes: row.notes || "Liquidaci√≥n de comisiones registradas en XTV.",
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
      toast.success("Solicitud de cobro registrada correctamente. El administrador liquidar√° el d√≠a de cobro semanal.");
      return true;
    } catch (err: any) {
      toast.error(`Error al solicitar liquidaci√≥n: ${err.message || err}`);
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
    // Validaci√≥n previa de revendedor
    const validation = validateResellerApiPayload(action, initialPayload || {});
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Par√°metros de API no v√°lidos para revendedor");
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
                "Petici√≥n de API XC cancelada por el usuario en el interceptor",
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

  // Cliente seleccionado para ver detalles en Renovaci√≥n (Beta)
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<
    any | null
  >(null);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewConfirmData, setRenewConfirmData] = useState<any | null>(null);

  // Nuevos estados para control de la modal de renovaci√≥n detallada
  const [renewStep, setRenewStep] = useState<"details" | "confirm">("details");
  const [selectedPlanForRenew, setSelectedPlanForRenew] = useState<any | null>(
    null,
  );
  const [renewDropdownOpen, setRenewDropdownOpen] = useState(false);
  const [renewCustomPrice, setRenewCustomPrice] = useState<number>(0);
  const [renewCustomScreens, setRenewCustomScreens] = useState<number>(2);
  const [renewIsSubmitting, setRenewIsSubmitting] = useState(false);

  // Estados para control de rechazos con notas explicativas y reutilizaci√≥n/correcci√≥n
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionRequestId, setRejectionRequestId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [correctingRequestId, setCorrectingRequestId] = useState<string | null>(
    null,
  );

  // Nuevos estados para edici√≥n de clientes y env√≠o de solicitudes de renovaci√≥n
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

  // Estados individuales para el formulario de edici√≥n de cliente
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

  // Estados para la secci√≥n de Tutoriales y Respuestas R√°pidas
  const [tutorialClient, setTutorialClient] = useState<any | null>(null);
  const [tutorialSearchTerm, setTutorialSearchTerm] = useState("");

  // Estados para el m√≥dulo de Invitaciones (Vendedor y Cliente XTV)
  const [invMenuMode, setInvMenuMode] = useState<'vendedor' | 'cliente' | null>(null);
  
  // Formulario Invitar Vendedor
  const [invVendNombre, setInvVendNombre] = useState("");
  const [invVendTelefono, setInvVendTelefono] = useState("");
  const [invVendDireccion, setInvVendDireccion] = useState("");
  const [invVendUserId, setInvVendUserId] = useState("");
  
  // Estado de validaci√≥n de ID de usuario invitado
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
          // Recomendar 3 opciones distintas con terminaciones num√©ricas
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
      const planName = selectedPlan ? selectedPlan.name : "Plan Est√°ndar VIP";
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

  // Funci√≥n para cambiar men√∫ con transici√≥n de deslizamiento
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
      badge: "‚ö° Carga Inmediata",
      iconName: "Sparkles",
      color1: "#10b981",
      color2: "#059669",
      action: () => {
        if (hasPermission("Iptv.CrearDirecto.Acceder")) {
          selectMenuWithScroll("crear_directo");
        } else {
          toast.error("Acceso Denegado: No tienes el permiso 'Iptv.CrearDirecto.Acceder' para abrir esta secci√≥n.");
        }
      },
      showCondition: hasPermission("Iptv.CrearDirecto.Ver") || hasPermission("Iptv.*") || hasPermission("Admin.*"),
    },
    {
      id: "solicitar_activacion",
      title: "Solicitar Activaci√≥n",
      badge: "üì• Ticket de Soporte",
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
      title: "Renovaci√≥n (Beta)",
      badge: "üîÑ Extender Vigencia",
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
      badge: "ü™ô Cr√©ditos y Soporte",
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
      badge: "üë• Activos y Demos",
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
      badge: "üíµ Red y Comisiones",
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
      title: "Respuesta R√°pida WSP",
      badge: "üí¨ Respuestas R√°pidas",
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
      id: "ajustes_configuracion",
      title: "Ajustes XTV",
      badge: "‚öôÔ∏è Gesti√≥n Central",
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

  // Formulario Solicitud de Cr√©dito / Ayuda
  const [reqAmount, setReqAmount] = useState(10);
  const [reqType, setReqType] = useState<
    | "asignar_credito"
    | "crear_cuenta"
    | "comprar_creditos_vip"
    | "comprar_creditos_demo"
  >("asignar_credito");
  const [reqDetailsText, setReqDetailsText] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);

  // Estado para la solicitud de activaci√≥n seleccionada en la pantalla de Solicitudes
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

  // Estado para la confirmaci√≥n interactiva de borrado de solicitud sin usar window.confirm
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [solicitudTab, setSolicitudTab] = useState<"pendientes" | "aprobadas" | "historial">("pendientes");

  // Estados para etiquetas personalizables de la bandeja de solicitudes (Guardados de forma local en localStorage)
  const [lblBandejaTitle, setLblBandejaTitle] = useState(() => localStorage.getItem("lblBandejaTitle") || "üóÇÔ∏è Bandeja de Solicitudes XTV");
  const [lblBandejaSubtitle, setLblBandejaSubtitle] = useState(() => localStorage.getItem("lblBandejaSubtitle") || "Monitorea, audita y aprueba las l√≠neas solicitadas por los vendedores.");
  const [lblTabPendientes, setLblTabPendientes] = useState(() => localStorage.getItem("lblTabPendientes") || "‚è≥ Pendientes");
  const [lblTabAprobadas, setLblTabAprobadas] = useState(() => localStorage.getItem("lblTabAprobadas") || "‚úÖ Aprobadas");
  const [lblTabHistorial, setLblTabHistorial] = useState(() => localStorage.getItem("lblTabHistorial") || "üìú Historial");
  const [lblPendientesLeyenda, setLblPendientesLeyenda] = useState(() => localStorage.getItem("lblPendientesLeyenda") || "üö® Solicitudes pendientes que deben ser activadas urgentemente:");
  const [lblHistorialLeyenda, setLblHistorialLeyenda] = useState(() => localStorage.getItem("lblHistorialLeyenda") || "üìú Archivo hist√≥rico de solicitudes procesadas (aprobadas y rechazadas):");

  // Estado para controlar qu√© etiqueta se est√° editando mediante un peque√±o formulario/input inline
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>("");

  // Estados para la duplicaci√≥n de vista: Activar L√≠nea vs Pago de Comisiones
  const [solicitudSection, setSolicitudSection] = useState<"activar_linea" | "pago_comisiones">("activar_linea");
  const [selectedCommissionPayout, setSelectedCommissionPayout] = useState<any | null>(null);
  const [commissionPayoutTab, setCommissionPayoutTab] = useState<"pendientes" | "en_proceso" | "historial">("pendientes");
  const [selectedPaidCommissionItem, setSelectedPaidCommissionItem] = useState<any | null>(null);
  const [payoutProofImage, setPayoutProofImage] = useState<string>("");
  const [payoutRefNotes, setPayoutRefNotes] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState<boolean>(false);
  const [showPayoutConfirmModal, setShowPayoutConfirmModal] = useState<boolean>(false);

  // Etiquetas para la bandeja de pago de comisiones
  const [lblComisionesTitle, setLblComisionesTitle] = useState(() => localStorage.getItem("lblComisionesTitle") || "üíµ Bandeja de Solicitudes de Pago de Comisiones");
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
    toast.success("üè∑Ô∏è Etiqueta personalizada guardada de forma local.");
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
      
      // Intentar vibraci√≥n nativa del celular si est√° disponible
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

  // Funci√≥n de s√≠ntesis de audio para notificaciones
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

    // Funci√≥n auxiliar para deducir o parsear horas de duraci√≥n a partir del objeto o del nombre del plan
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
      return 24; // fallback para demos gen√©ricas de 1 d√≠a
    };

    const finalDemoList =
      list.length === 0
        ? [
            {
              id: "custom-1h",
              name: "Demo 1 Hora (Sin l√≠mites)",
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

    // Ordenar de menor a mayor denominaci√≥n/duraci√≥n (horas)
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

      // Calcular o cargar cr√©ditos del usuario logueado (Vendedor o Admin)
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

      // Guardar todos los IDs para la evaluaci√≥n de notificaciones audible reactiva
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

      // Sincronizar cr√©ditos reales del panel XC en vivo
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
    const toastId = toast.loading("Actualizando cr√©ditos en vivo...");
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
        toast.error("La URL de tu panel no est√° configurada.");
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
          toast.success(`Cr√©ditos actualizados: ${creditsVal}`);
        } else {
          toast.error("No se encontr√≥ el campo de cr√©ditos en la respuesta del panel.");
        }
      } else {
        toast.error(`Error: ${xuiData.error || "No se pudo recuperar informaci√≥n."}`);
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

  // Auto-calcular reseller_notes din√°micamente si no ha sido editado manualmente
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

  // Sincronizar precio y pantallas informativos bas√°ndose estrictamente en selectedPlanForRenew
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

        // Comparar con IDs previamente conocidos (v√≠a ref para no disparar dependencias)
        const newPendings = currentPendingIds.filter(
          (id) => !knownRequestIdsRef.current.includes(id),
        );
        if (newPendings.length > 0) {
          // ¬°Hay tickets nuevos!
          if (soundEnabled && isSocioOrAdmin) {
            playNotificationSound(selectedTone);
            toast.info(
              `üîî ¬°Nueva solicitud de cr√©dito o activaci√≥n recibida! (${newPendings.length})`,
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

        // Caso 1: Es due√±o
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

  // Copiar credenciales gen√©rico con bot√≥n
  const copyToClipboard = (
    text: string,
    message: string = "Copiado al portapapeles",
  ) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Funci√≥n para confirmar la renovaci√≥n del plan seleccionado
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

    // Validaci√≥n estricta: Las cuentas Demo no se pueden extender ni renovar
    const isClientDemo = selectedClientForDetails.tipo_cuenta === "DEMO" ||
      selectedClientForDetails.is_demo ||
      (selectedClientForDetails.username && selectedClientForDetails.username.toLowerCase().startsWith("demo"));
    if (isClientDemo) {
      toast.error("‚ö†Ô∏è Los planes DEMO (Demostraci√≥n) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva l√≠nea VIP.");
      return;
    }

    if (planToUse.hours > 0 || planToUse.trial === 1 || planToUse.name?.toLowerCase().includes("demo")) {
      toast.error("‚ö†Ô∏è No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
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
        "‚ö†Ô∏è Debes adjuntar la captura del comprobante de pago para concretar la renovaci√≥n.",
      );
      return;
    }

    setRenewIsSubmitting(true);

    const creditsCost = planToUse.tokens || 1;
    if (!isAdmin && currentUserCreditsVIP < creditsCost) {
      toast.error(
        `No tienes cr√©ditos VIP suficientes para realizar renovaciones VIP (Costo: ${creditsCost} cr√©dito). Tienes: ${currentUserCreditsVIP}`,
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

      const durationDays = planToUse.duration || 30; // duraci√≥n en d√≠as o default 30
      const nextVenc = new Date(baseDate.getTime());
      nextVenc.setDate(nextVenc.getDate() + durationDays);

      // --- ENVIAR COMANDO DE RENOVACI√ìN AL PANEL FISICO XC ---
      let xuiData: any = null;
      if (systemConfig?.xui_url && systemConfig?.xui_token) {
        toast.loading("Enviando comando de renovaci√≥n al panel XC...");
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
          toast.success("¬°L√≠nea IPTV extendida f√≠sicamente en el panel XC!");
          logApiCall(
            "extend_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo de cr√©ditos reseller insuficiente en el panel XC.";
          toast.error(`‚ùå El panel XC rechaz√≥ la renovaci√≥n: ${errorMsg}`);
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
        toast.error("‚ùå No hay ning√∫n panel XC configurado en Ajustes. Configura el panel antes de renovar.");
        setRenewIsSubmitting(false);
        return; // ABORTAR RENOVACION LOCAL
      }

      const saleRecord = {
        fecha: new Date().toISOString(),
        autor: user?.email || "admin",
        comentario: `Comando de Reactivaci√≥n enviado: Renovado con ${planToUse.name} por $${renewCustomPrice !== undefined ? renewCustomPrice : (planToUse.price || planToUse.price_public || 0)}. Pantallas: ${renewCustomScreens}`,
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
          `¬°Cuenta ${selectedClientForDetails.username} reactivada exitosamente! Membres√≠a extendida hasta ${nextVenc.toLocaleDateString()}`,
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
      toast.error("Error al procesar renovaci√≥n: " + err.message);
    } finally {
      setRenewIsSubmitting(false);
    }
  };

  // --- NUEVA L√ìGICA: GUARDAR EDICI√ìN Y ENVIAR SOLICITUD DE RENOVACI√ìN DESDE TABLA ---
  const handleSaveEditedClient = async (updatedClient: any) => {
    try {
      toast.loading("Guardando cambios del cliente...");
      const res = await apiService.saveIptvAccount(updatedClient);
      if (res.success) {
        toast.dismiss();
        toast.success("¬°Cliente actualizado con √©xito!");
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

    // Validaci√≥n estricta: Las cuentas Demo no se pueden extender ni renovar
    const isClientDemo = client.tipo_cuenta === "DEMO" ||
      client.is_demo ||
      (client.username && client.username.toLowerCase().startsWith("demo"));
    if (isClientDemo) {
      toast.error("‚ö†Ô∏è Los planes DEMO (Demostraci√≥n) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva l√≠nea VIP.");
      return;
    }

    const isOwnClient = (client.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
    const canRenewThisClient = isAdmin || 
      hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
      (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);

    if (!canRenewThisClient) {
      toast.error("No tienes permisos suficientes para solicitar la renovaci√≥n de este cliente.");
      return;
    }

    if (!planId) {
      toast.error("Por favor selecciona un plan minorista para renovar.");
      return;
    }

    const selectedPlan = salePlans.find((p) => p.id === planId);
    if (!selectedPlan) {
      toast.error("El plan seleccionado no es v√°lido.");
      return;
    }

    if (selectedPlan.hours > 0 || selectedPlan.trial === 1 || selectedPlan.name?.toLowerCase().includes("demo")) {
      toast.error("‚ö†Ô∏è No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
      return;
    }

    if (!comprobante) {
      toast.error(
        "‚ö†Ô∏è Debes adjuntar la captura del comprobante de pago para realizar la solicitud.",
      );
      return;
    }

    setRequestRenewSubmitting(true);
    const toastId = toast.loading("Enviando solicitud de renovaci√≥n...");
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
            `Solicitud de renovaci√≥n para la cuenta ${client.username}`,
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
          "üöÄ ¬°Tu solicitud de renovaci√≥n y comprobante fueron enviados al Admin!",
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
      console.error("Error al enviar solicitud de renovaci√≥n:", err);
      toast.error(`‚ùå Error: ${err.message}`);
    } finally {
      setRequestRenewSubmitting(false);
    }
  };

  // --- NUEVA L√ìGICA: CREAR CUENTA DIRECTA (VIP O DEMO) UNIFICADO ---
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
      toast.error("El n√∫mero de celular del cliente es requerido.");
      setDirectSubmitting(false);
      return;
    }
    if (!address) {
      toast.error("La direcci√≥n de entrega/cliente es requerida.");
      setDirectSubmitting(false);
      return;
    }

    // --- GENERACI√ìN PREVIA DE CREDENCIALES PROVISIONALES ---
    // Esto es cr√≠tico porque el API del Panel XC exige la presencia de 'username' y 'password' obligatoriamente en el payload POST,
    // aun cuando luego el panel configure de forma nativa unas credenciales aleatorias.
    const randNum = Math.floor(100000 + Math.random() * 900000);
    let u = directType === "DEMO" ? `demo${randNum}` : `vip${randNum}`;

    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 6; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    p = `pass_${p}`;

    // --- PRIMERO VALIDAR CONDICIONES DE CR√âDITO Y REQUISITOS ---
    const selectedPlan = salePlans.find((plan) => plan.id === directPlanId);
    const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

    if (directType === "VIP") {
      const planPrice = selectedPlan ? Number(selectedPlan.price || 0) : 0;
      if (planPrice > 1 && !directComprobante) {
        toast.error(
          "‚ö†Ô∏è Para activar una cuenta VIP con costo mayor a $1, debes adjuntar la captura del comprobante de pago.",
        );
        setDirectSubmitting(false);
        return;
      }
      if (!isAdmin && currentUserCreditsVIP < creditsCost) {
        toast.error(
          `Cr√©ditos VIP insuficientes (Requeridos: ${creditsCost}, Tienes: ${currentUserCreditsVIP}). Solicita activaci√≥n por soporte en su lugar.`,
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

    // --- PASO 1: VERIFICAR CREDENCIALES Y CR√âDITOS (CONEXI√ìN T√âCNICA) ---
    if (!systemConfig?.xui_url || !systemConfig?.xui_token) {
      toast.error("‚ùå No hay ning√∫n panel XC configurado en Ajustes. Configura el panel antes de crear cuentas directas.");
      setDirectSubmitting(false);
      return;
    }

    toast.loading("Paso 1: Verificando conexi√≥n t√©cnica y cr√©ditos con el servidor XC...");
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
        toast.error(`‚ùå Paso 1 Fall√≥ (Conexi√≥n t√©cnica): El servidor XC no responde o las credenciales son inv√°lidas. Detalle: ${errDetail}`);
        setDirectSubmitting(false);
        return;
      }

      // Validar cr√©ditos devueltos por el panel
      const xcCredits = Number(testData.credits ?? testData.profile?.credits ?? testData.data?.credits ?? 999);
      if (xcCredits < 1) {
        toast.error(`‚ùå Paso 1 Fall√≥: Cr√©ditos insuficientes en tu panel f√≠sico XC (Disponibles: ${xcCredits}). Se requiere al menos 1 cr√©dito reseller.`);
        setDirectSubmitting(false);
        return;
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`‚ùå Paso 1 Fall√≥ (Error de conexi√≥n): No se pudo conectar con el servidor XC. ${err.message || String(err)}`);
      setDirectSubmitting(false);
      return;
    }

    // --- C√ÅLCULO DE DURACI√ìN Y EXPIRACI√ìN ---
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
        ? `Membres√≠a VIP Premium directa. Direcci√≥n: ${address}. Notas: ${notes}`
        : `L√≠nea de prueba directa. Direcci√≥n: ${address}. Notas: ${notes}`,
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
            ? `Venta de membres√≠a VIP Premium (${durationLabel}) directa iniciada. Creaci√≥n local previa.`
            : `Creaci√≥n de l√≠nea Demo (${durationLabel}) directa iniciada. Creaci√≥n local previa.`,
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
      api_error_registro: "Pendiente de alta f√≠sica en panel"
    };

    // --- PASO 2: GUARDAR LOS DATOS EN LA BASE DE DATOS LOCAL (SUPABASE) ---
    toast.loading("Paso 2: Guardando informaci√≥n del cliente en la Base de Datos local...");
    const resDb = await apiService.saveIptvAccount(newAccount);
    toast.dismiss();

    if (!resDb.success) {
      toast.error(`‚ùå Paso 2 Fall√≥ (Error Base de Datos): No se pudieron guardar los datos en Supabase (${resDb.error || "Error desconocido"}). Se detiene la operaci√≥n para evitar inconsistencias.`);
      setDirectSubmitting(false);
      return;
    }

    // --- PASO 3: REGISTRAR CUENTA EN EL PANEL FISICO XC DEL PROVEEDOR ---
    toast.loading("Paso 3: Creando y activando la l√≠nea f√≠sica en el panel XC...");
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

        // Si el panel de control XC le asign√≥ un nombre de usuario diferente, eliminamos el provisorio anterior
        // en Supabase y creamos la versi√≥n definitiva para evitar registros duplicados o inconsistencias
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
          // Descontar cr√©ditos al revendedor localmente si no es admin
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
                  ? `Creada VIP ${realUsername} directa consumiendo ${creditsCost} cr√©ditos. Saldo actual: ${remainingVIP}`
                  : `Creada Demo ${realUsername} directa consumiendo ${creditsCost} cr√©ditos. Saldo actual: ${remainingDemo}`,
              });
            } catch (e) {}
          }

          toast.success("¬°L√≠nea IPTV registrada, persistida en Base de Datos y activada f√≠sicamente en el panel XC!");
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
          toast.error("‚ö†Ô∏è Advertencia: La l√≠nea f√≠sica fue creada pero fall√≥ la actualizaci√≥n del registro local en Supabase.");
        }
      } else {
        const errorMsg = xuiData?.error || "Error de respuesta o saldo de cr√©ditos reseller insuficiente en el panel XC.";
        // Si el alta f√≠sica fall√≥, marcamos la cuenta local como "Fallo de Activaci√≥n" para que puedan reintentar la sincronizaci√≥n
        const failedAccount = {
          ...newAccount,
          estado: "Fallo_Activacion",
          api_sincronizado: false,
          api_error_registro: errorMsg
        };
        await apiService.saveIptvAccount(failedAccount);

        toast.error(`‚ùå El panel XC rechaz√≥ el alta f√≠sica de la l√≠nea: ${errorMsg}. El registro se guard√≥ localmente y podr√° sincronizarse nuevamente.`);
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

      toast.error(`‚ùå Error al conectar con el panel XC para la creaci√≥n: ${errorMsg}. El registro de base de datos se conservar√° localmente para sincronizaci√≥n.`);
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

  // --- FUNCI√ìN PARA AUTOCOMPLETAR DATOS DE PRUEBA (SOLO ADMINS) ---
  const handleAutocompleteTestData = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const firstNames = [
      "Carlos",
      "Ana",
      "Luis",
      "Marta",
      "Roberto",
      "Sof√≠a",
      "Esteban",
      "Luc√≠a",
      "Pedro",
      "Giselle",
    ];
    const lastNames = [
      "G√≥mez",
      "Rodr√≠guez",
      "Fern√°ndez",
      "L√≥pez",
      "Mart√≠nez",
      "D√≠az",
      "P√©rez",
      "S√°nchez",
      "Romero",
      "√Ålvarez",
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
    setDirectNotes("Testeo autom√°tico de administraci√≥n de XTV.");
    setDirectUser(`testadmin${randomSuffix}`);
    setDirectPass(`pass${randomSuffix}`);
    toast.success("‚ö° ¬°Datos de prueba autocompletados exitosamente!");
  };

  // --- NUEVA L√ìGICA: SOLICITAR ACTIVACI√ìN (TICKET DE ASISTENCIA A SOCIOS) ---
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
        toast.error("El n√∫mero de celular del cliente es requerido.");
        setDirectSubmitting(false);
        return;
      }
      if (!address) {
        toast.error("La direcci√≥n de entrega/cliente es requerida.");
        setDirectSubmitting(false);
        return;
      }

      const selectedPlan = salePlans.find((p) => p.id === directPlanId);

      if (directType === "VIP") {
        const planPrice = selectedPlan ? Number(selectedPlan.price || 0) : 0;
        if (planPrice > 1 && !directComprobante) {
          toast.error(
            "‚ö†Ô∏è Para solicitar una cuenta VIP con costo mayor a $1, debes adjuntar la captura del comprobante de pago.",
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
          comentarios: notes || "Solicitud de activaci√≥n del cliente",
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
            "üöÄ ¬°Tu solicitud rechazada ha sido corregida y enviada nuevamente para revisi√≥n!",
          );
        } else {
          toast.success(
            "üöÄ ¬°Solicitud de activaci√≥n enviada exitosamente a los Administradores!",
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
        toast.error("No se pudo enviar la solicitud de activaci√≥n.");
      }
    } catch (err: any) {
      console.error("Error al enviar solicitud de activaci√≥n:", err);
      toast.error(
        `‚ùå Error al conectar con la base de datos: ${err.message || err}`,
      );
    } finally {
      setDirectSubmitting(false);
    }
  };

  // --- NUEVA L√ìGICA: RENOVAR O REACTIVAR CLIENTE ---
  const handleRenewClient = async (account: any, planId: string) => {
    try {
      const selectedPlan = salePlans.find((p) => p.id === planId);
      // Validaci√≥n estricta: Las cuentas Demo no se pueden extender ni renovar
      const isClientDemo = account.tipo_cuenta === "DEMO" ||
        account.is_demo ||
        (account.username && account.username.toLowerCase().startsWith("demo"));
      if (isClientDemo) {
        toast.error("‚ö†Ô∏è Los planes DEMO (Demostraci√≥n) no se pueden extender ni renovar. Para continuar el servicio de este cliente, debes crear una nueva l√≠nea VIP.");
        return;
      }

      if (selectedPlan && (selectedPlan.hours > 0 || selectedPlan.trial === 1 || selectedPlan.name?.toLowerCase().includes("demo"))) {
        toast.error("‚ö†Ô∏è No se puede renovar utilizando un plan DEMO. Por favor selecciona un plan minorista VIP.");
        return;
      }

      const isVip = true;
      const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

      // Validar cr√©ditos del balance
      if (!isAdmin && currentUserCreditsVIP < creditsCost) {
        toast.error(
          `No tienes cr√©ditos VIP suficientes (Costo: ${creditsCost}, Tienes: ${currentUserCreditsVIP}).`,
        );
        return;
      }

      // Calcular nuevo vencimiento
      let nextVenc = new Date(
        account.fecha_vencimiento
          ? new Date(account.fecha_vencimiento).getTime()
          : Date.now(),
      );
      // Si ya est√° vencido, empezar desde hoy
      if (nextVenc < new Date()) {
        nextVenc = new Date();
      }

      let months = 1;
      let hours = 2;
      let planName = "Membres√≠a Renovada";
      let planPrice = 0;

      if (selectedPlan) {
        months = selectedPlan.months || 1;
        nextVenc.setMonth(nextVenc.getMonth() + months);
        planName = selectedPlan.name;
        planPrice = selectedPlan.price || 0;
      } else {
        nextVenc.setMonth(nextVenc.getMonth() + 1);
      }

      // Preparar venta hist√≥rica
      const screensCount = Number(selectedPlan?.screens_api || selectedPlan?.screens || account.limite_pantallas || 1);
      const nuevaVenta = {
        fecha: new Date().toISOString(),
        autor: user?.email || "admin",
        comentario: `Renovaci√≥n de membres√≠a (${planName})`,
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

      // --- ENVIAR COMANDO DE RENOVACI√ìN AL PANEL FISICO XC ---
      if (systemConfig?.xui_url && systemConfig?.xui_token) {
        toast.loading("Enviando comando de renovaci√≥n al panel XC...");
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

          toast.success("¬°L√≠nea IPTV extendida f√≠sicamente en el panel XC!");
          logApiCall(
            "extend_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo de cr√©ditos reseller insuficiente en el panel XC.";
          toast.error(`‚ùå El panel XC rechaz√≥ la renovaci√≥n: ${errorMsg}`);
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
        toast.error("‚ùå No hay ning√∫n panel XC configurado en Ajustes. Configura el panel antes de renovar.");
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
            detalle: `Se renov√≥ la membres√≠a de ${account.username} con plan ${planName}.`,
          });
        } catch {}

        toast.success(
          `üéâ ¬°Membres√≠a de ${account.nombre_completo || account.username} renovada con √©xito hasta ${nextVenc.toLocaleDateString()}!`,
        );
        setSelectedClientForDetails(null);
        setRenewConfirmData(null);
        fetchData();
      } else {
        toast.error("Error al procesar la renovaci√≥n en la base de datos.");
      }
    } catch (err: any) {
      toast.error("Ocurri√≥ un error inesperado al renovar: " + err.message);
    }
  };

  // 1. CREACI√ìN DE CUENTA DEMO (‚ö° CON CONTROL DE CR√âDITOS Y CASOS INSUFICIENTES)
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

    // Verificar si el usuario actual cuenta con cr√©ditos demo suficientes
    if (!isAdmin && currentUserCreditsDemo < 1) {
      toast.error(
        `No tienes cr√©ditos demo disponibles (Tienes: ${currentUserCreditsDemo}). Solicita recarga de saldo demo o activa membres√≠as.`,
      );
      setDemoSubmitting(false);
      return;
    }

    // Generar usuario autom√°tico inteligente
    const randNum = Math.floor(100000 + Math.random() * 900000);
    let generatedUsername = `demo${randNum}`;

    // Generar contrase√±a aleatoria
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let randPass = "";
    for (let i = 0; i < 6; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let generatedPassword = `pass_${randPass}`;

    // Determinar horas seg√∫n paquete
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
    const finalComments = `L√≠nea de prueba generada autom√°ticamente. Cliente: ${clientName}. Tel: ${demoCelular || "N/A"}. `;

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

    // Intentar conexi√≥n al XUI si los campos existen en el panel central
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

          toast.success("¬°Cuenta demo creada f√≠sicamente en el servidor!");
          logApiCall(
            "create_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o credenciales inv√°lidas en el panel XC.";
          console.warn("API de XUI devolvi√≥ √©xito falso:", errorMsg);
          toast.error(`‚ùå El panel XC rechaz√≥ la creaci√≥n de demo: ${errorMsg}`);
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
        toast.error(`‚ùå Error al conectar con el panel XC: ${errorMsg}`);
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
      toast.error("‚ùå No hay ning√∫n panel XC configurado en Ajustes. Configura el panel antes de crear demostraciones.");
      setDemoSubmitting(false);
      return; // ABORTAR CREACION LOCAL
    }

    // Instancia de cuenta construida con los campos de contacto del cliente (unificaci√≥n multi-app)
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
      // Restar 1 cr√©dito demo al vendedor
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
            detalle: `Vendedor cre√≥ cuenta demo gratis de ${durationHours}h. Costo: 1 cr√©dito demo. Restantes: ${remainingDemos}`,
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

  // 2. CREACI√ìN DE INTERFAZ VIP (CON CONTROL DE CR√âDITOS Y CASOS INSUFICIENTES)
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
      toast.error("Usuario, Contrase√±a y Nombre del cliente son requeridos.");
      setVipSubmitting(false);
      return;
    }

    // Buscar costo de cr√©ditos seg√∫n plan seleccionado
    const selectedPlan = salePlans.find((plan) => plan.id === vipPlanId);
    const creditsCost = selectedPlan ? Number(selectedPlan.tokens || 1) : 1;

    // Verificar si el usuario actual cuenta con cr√©ditos suficientes
    if (!isAdmin && currentUserCreditsVIP < creditsCost) {
      // Error amigable y sugerir enviar solicitud a administracion
      toast.error(
        `Saldo VIP insuficiente. No tienes los ${creditsCost} cr√©ditos necesarios (Tienes: ${currentUserCreditsVIP}). Procede a solicitar ayuda de creaci√≥n.`,
      );

      // Ofrecer precargar la solicitud de ticket
      setReqType("crear_cuenta");
      setReqAmount(creditsCost);
      setReqDetailsText(
        `Solicitud para crear cuenta VIP del cliente ${clName}. Plan: ${selectedPlan?.name || "Comercial"}. Usuario propuesto: ${u}, Contrase√±a: ${p}.`,
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
            "¬°Cuenta VIP alojada f√≠sicamente en el servidor de producci√≥n!",
          );
          logApiCall(
            "create_line",
            xuiData._payloadSent || payloadToSend,
            xuiData,
            true,
          );
        } else {
          const errorMsg = xuiData?.error || "Error de respuesta o saldo insuficiente de cr√©ditos reseller en el panel XC.";
          console.warn("Fallo de API al crear VIP:", errorMsg);
          toast.error(`‚ùå El panel XC rechaz√≥ la creaci√≥n de VIP: ${errorMsg}`);
          logApiCall(
            "create_line",
            xuiData?._payloadSent || payloadToSend,
            xuiData,
            false,
            errorMsg,
          );
          setVipSubmitting(false);
          return; // ABORTAR CREACI√ìN VIP LOCAL
        }
      } catch (err: any) {
        toast.dismiss();
        const errorMsg = err.message || String(err);
        console.warn("Fallo de API al conectar con XC:", errorMsg);
        toast.error(`‚ùå Error al conectar con el panel XC: ${errorMsg}`);
        logApiCall(
          "create_line",
          payloadToSend,
          null,
          false,
          errorMsg,
        );
        setVipSubmitting(false);
        return; // ABORTAR CREACI√ìN VIP LOCAL
      }
    } else {
      toast.error("‚ùå No hay ning√∫n panel XC configurado en Ajustes. Configura el panel antes de crear cuentas VIP.");
      setVipSubmitting(false);
      return; // ABORTAR CREACI√ìN VIP LOCAL
    }

    const newVipAccount = {
      username: u,
      password: p,
      url_panel_asignada: xuiUrl,
      estado: "Activo",
      limite_pantallas: selectedPlan ? Number(selectedPlan.screens || 2) : 2,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: expiration.toISOString(),
      comentarios: `L√≠nea VIP Premium de venta activa por ${months} Meses. Notas: ${vipNotes}`,
      nombre_completo: clName,
      celular: cell,
      direccion_actual: "",
      id_plan_proveedor: selectedPlan ? selectedPlan.provider_plan_id : "",
      id_plan_venta: vipPlanId,
      bitacora_comentarios: [
        {
          fecha: new Date().toISOString(),
          autor: user?.email || "Vendedor",
          comentario: `Venta de membres√≠a VIP Premium (${months} Meses) iniciada.`,
        },
      ],
      creado_por: user?.email || "admin",
    };

    const res = await apiService.saveIptvAccount(newVipAccount);

    if (res.success) {
      // Descontar cr√©ditos al revendedor si no es admin
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
            detalle: `Vendedor cre√≥ cuenta VIP ${u} consumiendo ${creditsCost} cr√©ditos. Nuevo saldo: ${remaining}`,
          });
        } catch (e) {}
      }

      toast.success("Membres√≠a VIP Premium guardada y activada.");

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

  // 3. ENV√çO DE SOLICITUD DE CR√âDITO / AYUDA (SOPORTE DE RESELLERS)
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
          "Tu solicitud y comprobante de transferencia fueron enviados a los Socios/Admin. Recibir√°s respuesta enseguida.",
        );
        setReqDetailsText("");
        setComprobanteUrl(null);
        fetchData();
      } else {
        toast.error("Ocurri√≥ un error al enviar tu solicitud.");
      }
    } catch (err: any) {
      console.error("Error al enviar solicitud de cr√©dito:", err);
      toast.error(`‚ùå Error de red o base de datos: ${err.message || err}`);
    } finally {
      setReqSubmitting(false);
    }
  };

  // 4. APROBACI√ìN O RECHAZO DE SOLICITUD POR ADMINISTRADORES Y SOCIOS
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
        toast.error("Error de seguridad: No tienes el permiso requerido para procesar l√≠neas de clientes (Admin.IntegracionXC.Acceder).");
        return;
      }

      // Si se aprueba y es de tipo "asignar_credito", le asignamos los cr√©ditos reales al reseller
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
              `Cr√©ditos DEMO asignados con √©xito a ${usernameToCredit}. Saldo actual: ${newDemo}`,
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
              `Cr√©ditos VIP asignados con √©xito a ${usernameToCredit}. Saldo actual: ${newVip}`,
            );
          } else if (selectedReq.tipo_solicitud === "crear_cuenta") {
            // AUTOMATIZACI√ìN DE REGISTROS IPTV CON UN CLIC DESDE LA BANDEJA ADMINISTRATIVA
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
                  ? `L√≠nea VIP Premium EXTENDIDA autom√°ticamente por administraci√≥n desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`
                  : `L√≠nea VIP Premium activada autom√°ticamente por administraci√≥n desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`;
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
                  ? `L√≠nea de prueba Demo EXTENDIDA autom√°ticamente por administraci√≥n desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`
                  : `L√≠nea de prueba Demo activada autom√°ticamente por administraci√≥n desde ticket de reseller ${usernameToCredit}. Notas: ${comments}`;
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
                  ? "Extendiendo membres√≠a f√≠sicamente en el servidor de producci√≥n XC..."
                  : "Registrando y activando cuenta f√≠sicamente en el servidor de producci√≥n XC...",
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
                      "¬°L√≠nea IPTV extendida f√≠sicamente en el panel XC!",
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
                      "¬°L√≠nea IPTV registrada y enlazada f√≠sicamente en el panel XC!",
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
                    "Advertencia: No se pudo actualizar en la API de XC, se guardar√° en modo local/contingencia. Detalle: " +
                      (xuiData?.error || "Error de conexi√≥n"),
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
                      ? `Membres√≠a extendida de forma central por administraci√≥n.`
                      : `Membres√≠a activada y autorizada de forma central por administraci√≥n.`,
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
                `¬°Cuenta de cliente IPTV para ${det.nombre_completo} activada autom√°ticamente en Supabase!`,
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

              // Deducir cr√©ditos al reseller si no es admin
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
          `La solicitud se marc√≥ como ${action.toUpperCase()} correctamente.`,
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
      
      {/* Bot√≥n de Activaci√≥n de Modo Edici√≥n (Solo para Administradores con permiso) */}
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
            {isEditMode ? 'Desactivar Edici√≥n' : 'Modo Edici√≥n'}
          </button>
        </div>
      )}

      {/* 1. SECCI√ìN SUPERIOR Y NAVEGACI√ìN */}
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
              Men√∫ XTV
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('Iptv.CreditosXC.Ver') && (
              <div 
                onClick={handleRefreshDashboardCredits}
                title="Sincronizar cr√©ditos en vivo"
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
          {/* 1. SECCI√ìN SUPERIOR BIENVENIDA */}
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

            {/* Bot√≥n de Cr√©ditos de XC Panel - Solo visible con el permiso correspondiente */}
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
                title={isEditMode ? "Editar textos" : "Hacer clic para sincronizar cr√©ditos reales en vivo"}
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
                      {systemConfig?.dashboard_customizations?.creditsLabel || "Cr√©ditos XC Panel"}
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
                  title="Actualizar cr√©ditos en vivo ahora"
                >
                  <RefreshCw size={14} className={isRefreshingCredits ? "animate-spin" : "hover:rotate-180 transition-transform duration-300"} />
                </button>
              </div>
            )}
          </div>

          {/* 2. MENU LAUNCHPAD DE BOTONES RECTANGULARES FLUYENTES (DISE√ëO INICIO ORIGINAL DE ALTA FIDELIDAD) */}
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
                          üîí Bloqueado
                        </span>
                      ) : item.customIcon ? (
                        <img src={item.customIcon} className="size-8 xs:size-9 sm:size-11 md:size-12 lg:size-14 xl:size-16 object-contain drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" alt="" />
                      ) : (
                        <IconComponent className="size-7 xs:size-8 sm:size-10 md:size-11 lg:size-13 xl:size-15 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" />
                      )}
                    </div>

                    {/* Body: T√≠tulo Completo Envolvente centrado */}
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
                      Carga inmediata consumiendo tu balance de cr√©ditos.
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
                      ‚ö° Autocompletar Datos de Testeo (Admin)
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
                      placeholder="Ej: Juan P√©rez"
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      onBlur={(e) => setDirectName(capitalizeName(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tel√©fono */}
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
                    {/* Direcci√≥n */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Direcci√≥n de Entrega *
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
                                    {p.name} ‚Äî Precio Minorista: ${p.price || 0} ARS
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
                                    {p.name} ‚Äî Precio Minorista: ${p.price || 0} ARS{" "}
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
                          Pantallas Simult√°neas Incluidas
                        </label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3">
                          <Tv size={16} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {directPantallas} Pantalla
                            {directPantallas > 1 ? "s" : ""} activa
                            {directPantallas > 1 ? "s" : ""} en simult√°neo
                          </span>
                        </div>
                      </div>

                      {/* Cargar Imagen Comprobante */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Comprobante de Pago (Galer√≠a/Explorador){" "}
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
                                              "¬°Captura optimizada correctamente de forma segura (~40 KB)!",
                                            );
                                          } else {
                                            setDirectComprobante(
                                              event.target?.result as string,
                                            );
                                            toast.dismiss(loadingToast);
                                            toast.success(
                                              "Cargado sin compresi√≥n.",
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
                                        // Fallback para m√≥viles si no soporta renderizar imagen o es HEIC/HEIF
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
                          placeholder="Ej: Requiere canales de f√∫tbol uruguayo..."
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
                            Notas de Reseller (XC / Panel F√≠sico) *
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
                                  toast.info("üîÑ Volviendo a c√°lculo autom√°tico");
                                } else {
                                  setIsResellerNotesEdited(true);
                                  toast.success("üìù Modo edici√≥n manual activado");
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
                            placeholder="Ej: [XTV]Juan P√©rez - Plan Familiar - vendedor@gmail.com"
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
                              ? "‚ö†Ô∏è Has editado la nota manualmente. No se sincronizar√° con los cambios del formulario hasta que vuelvas a presionar 'Auto-Calcular'."
                              : "Esta nota se guardar√° directamente en el panel XC f√≠sico de IPTV para identificar la cuenta."
                            : "Esta nota se genera din√°micamente seg√∫n el cliente, plan y tu usuario vendedor."}
                        </p>
                      </div>

                      {/* Bot√≥n Guardar */}
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
                            Crear L√≠nea Directa (
                            {directType === "VIP"
                              ? `${salePlans.find((p) => p.id === directPlanId)?.tokens || 1} Cr√©ditos`
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
                        üéâ ¬°Cuenta Creada Exitosamente!
                      </h4>
                      <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">
                        Copia las credenciales abajo o m√°ndalas directamente por
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
                            Contrase√±a IPTV
                          </span>
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl">
                            <span className="font-mono text-xs font-bold">
                              {directResult.password}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  directResult.password,
                                  "Contrase√±a copiada",
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
                          const wpMsg = `¬°Hola ${directResult.nombre_completo}! Aqu√≠ tienes tus accesos listos para XTV:\n\nüë§ Usuario: ${directResult.username}\nüîë Contrase√±a: ${directResult.password}\n\nEnlace playlist M3U:\n${directResult.m3u}\n\n¬°Que disfrutes el mejor servicio!`;
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
                          const text = `Cliente: ${directResult.nombre_completo}\nUsuario: ${directResult.username}\nContrase√±a: ${directResult.password}\nM3U Link: ${directResult.m3u}`;
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
                    <h5 className="font-bold text-sm">Esperando Generaci√≥n</h5>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Completa los campos obligatorios de la izquierda y
                      presiona el bot√≥n para emitir el alta inmediata en
                      XTV.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. WIDGET: SOLICITAR ACTIVACI√ìN (Ticket de Soporte) */}
          {currentMenu === "solicitar_activacion" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Solicitar Activaci√≥n
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Crea un ticket de soporte adjuntando comprobante de pago
                    para que un administrador te d√© el alta.
                  </p>
                </div>
              </div>

              {correctingRequestId && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <div className="space-y-1">
                    <span className="font-extrabold block">
                      üìù Corrigiendo Solicitud Anterior
                    </span>
                    <div className="text-slate-600 dark:text-slate-300">
                      Est√°s editando la solicitud de alta del cliente{" "}
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
                        "Correcci√≥n cancelada. Formulario reiniciado.",
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
                    ‚ö° Autocompletar Datos de Testeo (Admin)
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
                    placeholder="Ej: Juan P√©rez"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    onBlur={(e) => setDirectName(capitalizeName(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-slate-800 text-sm min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tel√©fono */}
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
                  {/* Direcci√≥n */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Direcci√≥n de Entrega *
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
                                  {p.name} ‚Äî Costo: ${p.price || 0} ARS ({p.months}
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
                                  {p.name} ‚Äî Costo: ${p.price || 0} ARS ({p.months}
                                  m) [Demo]
                                </option>
                              ))}
                      </select>
                    </div>

                    {/* Cantidad de Pantallas */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Pantallas Simult√°neas Incluidas
                      </label>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3">
                        <Tv size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {directPantallas} Pantalla{directPantallas > 1 ? "s" : ""}{" "}
                          activa{directPantallas > 1 ? "s" : ""} en simult√°neo
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
                                                "¬°Captura optimizada correctamente de forma segura (~40 KB)!",
                                              );
                                            } else {
                                              setDirectComprobante(
                                                event.target?.result as string,
                                              );
                                              toast.dismiss(loadingToast);
                                              toast.success(
                                                "Cargado sin compresi√≥n.",
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
                          Notas de Reseller (XC / Panel F√≠sico) *
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
                                toast.info("üîÑ Volviendo a c√°lculo autom√°tico");
                              } else {
                                setIsResellerNotesEdited(true);
                                toast.success("üìù Modo edici√≥n manual activado");
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
                          placeholder="Ej: [XTV]Juan P√©rez - Plan Familiar - vendedor@gmail.com"
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
                            ? "‚ö†Ô∏è Has editado la nota manualmente. No se sincronizar√° con los cambios del formulario hasta que vuelvas a presionar 'Auto-Calcular'."
                            : "Esta nota se enviar√° al panel f√≠sico XC cuando el administrador apruebe tu solicitud."
                          : "Esta nota se genera din√°mediamente seg√∫n el cliente, plan y tu usuario vendedor."}
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

                    {/* Bot√≥n Solicitar */}
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
                          Enviar Solicitud de Activaci√≥n
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* C. WIDGET: RENOVAR MEMBRES√çA / REPORTE COMPLETO */}
          {currentMenu === "renovaciones" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Vigencias, Expiraci√≥n and Renovaciones
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Busca, analiza el historial de compras y reactiva f√°cilmente
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
                      <th className="p-4">Tel√©fono</th>
                      <th className="p-4">Fecha de Vencimiento</th>
                      <th className="p-4">Plan Minorista Adquirido</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      // Filtrar para mostrar s√≥lo cuentas VIP (comerciales, no demos)
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
                          : "Plan Est√°ndar VIP";
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

                            {/* Tel√©fono */}
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

                            {/* Botones de Acci√≥n */}
                            <td
                              className="p-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-2">
                                {/* Bot√≥n Editar */}
                                <button
                                  onClick={() => startEditingClient(acc)}
                                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 font-bold border border-slate-200 dark:border-slate-700/60 transition-all hover:scale-[1.02]"
                                  title="Editar todos los datos del cliente"
                                >
                                  <Pencil size={12} />
                                  <span>Editar</span>
                                </button>

                                {/* Bot√≥n Eliminar */}
                                <button
                                  onClick={() => handleDeleteClients([acc.username])}
                                  className="px-2.5 py-1.5 bg-red-50/50 hover:bg-red-500 hover:text-white dark:bg-red-950/20 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1 font-bold border border-red-200/50 dark:border-red-900/30 transition-all hover:scale-[1.02]"
                                  title="Eliminar cliente"
                                >
                                  <Trash2 size={12} />
                                  <span>Eliminar</span>
                                </button>

                                {/* Bot√≥n Enviar Solicitud */}
                                <button
                                  onClick={() => {
                                    const isOwnClient = (acc.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                                    const canRenewThisClient = isAdmin || 
                                      hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
                                      (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);
                                    if (!canRenewThisClient) {
                                      toast.warning("No tienes permiso para renovar o solicitar la renovaci√≥n de este cliente.");
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
                                      ? "Renovaci√≥n Directa Inmediata"
                                      : "Enviar Solicitud de Renovaci√≥n"
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
                                      <span>Solicitar Renovaci√≥n</span>
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

                  // Generaci√≥n / Extracci√≥n del historial de ventas real (sin simulaci√≥n ni valores ficticios)
                  const salesHistory = (() => {
                    const realSales = (acc.bitacora_comentarios || [])
                      .filter(
                        (b: any) =>
                          b.tipo === "venta" ||
                          b.comentario?.toLowerCase().includes("plan") ||
                          b.comentario?.toLowerCase().includes("membres√≠a") ||
                          b.comentario?.toLowerCase().includes("renovaci√≥n") ||
                          b.comentario?.toLowerCase().includes("reactivaci√≥n"),
                      )
                      .map((b: any) => ({
                        fecha: b.fecha,
                        plan: b.plan_name || "Plan de Venta Est√°ndar",
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
                          {/* Bot√≥n Cerrar */}
                          <button
                            onClick={() => setSelectedClientForDetails(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>

                          {/* T√≠tulo de la Ficha del Cliente */}
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                              Ficha de Cliente
                            </span>
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                              {acc.nombre_completo || "Cliente VIP"}
                            </h3>
                            <div className="text-xs text-slate-500 mt-1 space-y-1">
                              <p className="font-semibold">
                                √öltimo Plan Adquirido:{" "}
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                  {salePlans.find((p: any) => p.id === acc.id_plan_venta)?.name || "Plan de Venta Est√°ndar"}
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-600 dark:text-slate-400">
                                <p className="flex items-center gap-1">
                                  <span>üìç Direcci√≥n:</span>{" "}
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {acc.direccion_actual || "No registrada"}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <span>üìû Tel√©fono:</span>{" "}
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
                              {/* Cuadro 1: Credenciales del Cliente y Datos de Conexi√≥n */}
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                                      üîë Credenciales y Conexi√≥n
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
                                      const textToCopy = `üë§ Usuario IPTV: ${acc.username}\nüîë Contrase√±a IPTV: ${acc.password}\nüåê Playlist M3U8: ${m3uUrl}${acc.panel_client_id ? `\nüÜî ID L√≠nea: ${acc.panel_client_id}` : ""}`;
                                      copyToClipboard(
                                        textToCopy,
                                        "¬°Credenciales completas copiadas!",
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
                                      Contrase√±a IPTV
                                    </span>
                                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border px-3 py-2 rounded-xl">
                                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {acc.password}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            acc.password,
                                            "Contrase√±a copiada",
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

                                  {/* Par√°metros T√©cnicos del Panel XC */}
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
                                        √öltimo Plan Adquirido
                                      </span>
                                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                        {salePlans.find((p: any) => p.id === acc.id_plan_venta)?.name || "Plan de Venta Est√°ndar"}
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

                              {/* Cuadro 2: Datos de Vendedor y Activaci√≥n */}
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                                <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                                  üë§ Datos de Soporte y Activaci√≥n
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Vendedor que registr√≥ */}
                                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                      Vendedor que registr√≥ al cliente
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

                                  {/* Usuario que activ√≥ la l√≠nea */}
                                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                      Usuario que activ√≥ la l√≠nea
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

                            {/* COLUMNA DERECHA: PROCESAR RENOVACI√ìN */}
                            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                              <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center justify-between">
                                <span>üîÑ Procesar Renovaci√≥n</span>
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
                                      L√≠nea de Demostraci√≥n (Demo)
                                    </h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                      Las cuentas Demo son pruebas temporales y <strong>no se pueden extender ni renovar</strong>. Para continuar el servicio de este cliente, dir√≠gete a <strong>Crear Cuenta</strong> y genera una nueva membres√≠a VIP.
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
                                    <span>Crear Nueva L√≠nea VIP para Cliente</span>
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
                                    Precio P√∫blico ($)
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

                              {/* Bot√≥n para Comprobante de Pago */}
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                                  üì∏ Comprobante de Pago (Requerido para renovar) *
                                </label>
                                <div className="flex items-center gap-3">
                                  <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl p-3.5 cursor-pointer hover:bg-slate-150/10 transition-all text-center bg-white dark:bg-slate-900 shadow-sm">
                                    <UploadCloud
                                      size={20}
                                      className="text-slate-400"
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 mt-1">
                                      {requestRenewComprobante
                                        ? "üì∏ Comprobante Listo"
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
                                                // Fallback para m√≥viles si no soporta renderizar imagen o es HEIC/HEIF
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
                                    +{planToUse?.duration || 30} D√≠as
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Costo Cr√©ditos:</span>
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

                              {/* BOTONES DE ACCI√ìN: CONFIRMAR (DIRECTA) & SOLICITAR RENOVACI√ìN */}
                              {(() => {
                                const isOwnClient = (selectedClientForDetails?.creado_por || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
                                const canRenewThisClient = isAdmin || 
                                  hasPermission("Iptv.Renovaciones.RenovarGeneral") || 
                                  (hasPermission("Iptv.Renovaciones.RenovarPropios") && isOwnClient);
                                return (
                                  <div className="space-y-2 pt-2">
                                    {/* Bot√≥n 1: Confirmar (Directo) */}
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
                                              Confirmar Activaci√≥n Directa
                                            </span>
                                          </>
                                        )}
                                      </button>
                                      {!hasDirectPrivilege && (
                                        <p className="text-[9px] text-slate-400 text-center leading-normal">
                                          ‚ö†Ô∏è Bot√≥n inhabilitado: No tienes permisos
                                          para activar l√≠neas directamente sin
                                          autorizaci√≥n.
                                        </p>
                                      )}
                                      {!canRenewThisClient && (
                                        <p className="text-[9px] text-red-500 text-center leading-normal font-bold">
                                          ‚ö†Ô∏è No tienes permisos de renovaci√≥n para este cliente.
                                        </p>
                                      )}
                                    </div>

                                    {/* Bot√≥n 2: Solicitar Renovaci√≥n */}
                                    <button
                                      onClick={async () => {
                                        if (!canRenewThisClient) {
                                          toast.error("No tienes permisos suficientes para solicitar la renovaci√≥n de este cliente.");
                                          return;
                                        }
                                        if (!requestRenewComprobante) {
                                          toast.error(
                                            "‚ö†Ô∏è Debes adjuntar la captura del comprobante de pago para realizar la solicitud.",
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
                                          <span>Solicitar Renovaci√≥n</span>
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

                      {/* 2. MODAL DE SOLICITUD DE RENOVACI√ìN INDEPENDIENTE ELIMINADO */}
                      {/* 3. MODAL DE EDICI√ìN COMPLETA DEL CLIENTE */}
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
                                Ficha de Edici√≥n
                              </span>
                              <h3 className="text-xl font-extrabold mt-1">
                                Editar Datos de{" "}
                                {editingClient.nombre_completo ||
                                  editingClient.username}
                              </h3>
                              <p className="text-slate-500 text-xs mt-0.5">
                                ID √önico de Acceso:{" "}
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

                              {/* Tel√©fono */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Tel√©fono
                                </label>
                                <input
                                  type="text"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-3 focus:outline-none ring-1 ring-slate-200 dark:ring-slate-800 border-none font-semibold text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Contrase√±a */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Contrase√±a de L√≠nea
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

                              {/* Pantallas M√°ximas */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  L√≠mite de Pantallas
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

                            {/* Direcci√≥n */}
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">
                                Direcci√≥n Actual / Log√≠stica
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

                            {/* SECCI√ìN ESPECIAL: NOTAS DE RESELLER */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">
                                  Notas de Reseller (XC / Panel F√≠sico)
                                </label>
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editIsResellerNotesManual) {
                                        setEditIsResellerNotesManual(false);
                                        toast.info(
                                          "üîÑ Volviendo a c√°lculo autom√°tico",
                                        );
                                      } else {
                                        setEditIsResellerNotesManual(true);
                                        toast.success(
                                          "üìù Modo edici√≥n manual activado",
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
                                  ? "Como Administrador puedes editar esta nota directamente. El resto de los revendedores ver√° el valor calculado en tiempo real."
                                  : "Esta nota se genera autom√°ticamente en vivo bas√°ndose en el nombre del cliente, plan contratado y creador de la cuenta."}
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

          {/* D. WIDGET: SOLICITAR AYUDA / CR√âDITOS & INBOX DE SOPORTE ADMIN */}
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

              // Obtener herencia de roles para filtrar de forma jer√°rquica
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
                  const planNombre = plan?.name || acc.plan_nombre || "Plan IPTV";

                  // Determinaci√≥n de comisiones seg√∫n plan (Multinivel)
                  const rawSellerComm = plan?.comision_vendedor != null 
                    ? Number(plan.comision_vendedor) 
                    : (plan && Number(plan.comision) > 0 ? Math.round(Number(plan.comision) * 0.8) : 4000);

                  const rawRecruiterComm = plan?.comision_padre != null 
                    ? Number(plan.comision_padre) 
                    : (plan && Number(plan.comision) > 0 ? Math.round(Number(plan.comision) * 0.2) : 1000);

                  const totalComm = rawSellerComm + rawRecruiterComm;

                  // Verificaci√≥n de Actividad del Vendedor en los √∫ltimos 30 d√≠as respecto a la fecha de la venta
                  const saleDate = new Date(acc.creado_al || acc.fecha_creacion || Date.now());
                  const thirtyDaysBefore = new Date(saleDate.getTime() - (30 * 24 * 60 * 60 * 1000));
                  
                  // Contar ventas del vendedor en esa ventana previa de 30 d√≠as
                  const salesInPeriod = accounts.filter((otherAcc: any) => {
                    const otherSeller = (otherAcc.creado_por || "").toLowerCase().trim();
                    if (otherSeller !== seller) return false;
                    const otherUserLower = (otherAcc.username || "").toLowerCase().trim();
                    const otherPlanLower = (otherAcc.plan_nombre || "").toLowerCase().trim();
                    if (otherUserLower.startsWith("demo") || otherPlanLower.includes("demo")) return false;
                    const otherDate = new Date(otherAcc.creado_al || otherAcc.fecha_creacion || 0);
                    return otherDate >= thirtyDaysBefore && otherDate <= saleDate;
                  }).length;

                  // Si tiene al menos 1 venta (incluyendo la actual), est√° activo (100%), de lo contrario pasivo (50%)
                  const isSellerActive = salesInPeriod >= 1;
                  const defaultSellerComm = isSellerActive ? rawSellerComm : Math.round(rawSellerComm * 0.5);
                  const defaultRecruiterComm = rawRecruiterComm;

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
                    isSellerActive,
                    rawSellerComm,
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
                  {/* Switcher de Secci√≥n */}
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
                        ‚ö° Activar L√≠nea
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
                        üíµ Pago de Comisiones
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
                              derecha para auditar la informaci√≥n del cliente,
                              el plan y su comprobante.
                            </p>
                          </div>
                        </div>
                      ) : isEditingRequest ? (
                        /* NUEVO FORMULARIO DE EDICI√ìN INLINE DE SOLICITUD PENDIENTE */
                        <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                          <div className="space-y-5">
                            {/* Cabecera de Edici√≥n */}
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
                                  placeholder="Ej. Juan P√©rez"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  N√∫mero de Celular
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
                                  Direcci√≥n
                                </label>
                                <input
                                  type="text"
                                  value={editRequestDireccion}
                                  onChange={(e) => setEditRequestDireccion(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
                                  placeholder="Ej. Av. de Mayo 123, CABA"
                                />
                              </div>

                              {/* Tipo de Membres√≠a (VIP o DEMO) */}
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                                  Tipo de Membres√≠a
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
                                            {p.name} ‚Äî ${p.price || 0} ARS ({p.months}m)
                                          </option>
                                        ))
                                    : salePlans
                                        .filter((p) => !p.archived && p.name.toLowerCase().includes("demo"))
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} ‚Äî ${p.price || 0} ARS {p.hours ? `(${p.hours}h)` : p.months ? `(${p.months}m)` : ""}
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
                                  <option value={2}>2 Pantallas simult√°neas</option>
                                  <option value={3}>3 Pantallas simult√°neas</option>
                                  <option value={4}>4 Pantallas simult√°neas</option>
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
                                  Auditor√≠a de Activaci√≥n
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

                            {/* 1. Informaci√≥n del Cliente */}
                            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-850/40">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Informaci√≥n del Cliente
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
                                    Direcci√≥n:
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
                                Plan / Membres√≠a Solicitada
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
                                        Costo de Membres√≠a:
                                      </span>
                                      <strong className="text-emerald-600 dark:text-emerald-400 mt-0.5 block font-black">
                                        ${Number(mPrice).toLocaleString("es-AR")} ARS
                                      </strong>
                                    </div>

                                    <div>
                                      <span className="text-slate-400 block font-medium">
                                        Comisi√≥n:
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

                          {/* Botones de acci√≥n r√°pida sobre la solicitud pendiente (Editar / Eliminar) */}
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
                                    
                                    toast.info("üìù Abriendo editor de solicitud...");
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
                                      toast.info("‚ö†Ô∏è Haz clic de nuevo en Eliminar para confirmar el borrado.");
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

                          {/* 4. Formulario de Notas & Acci√≥n de Aprobaci√≥n */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-4 space-y-4">
                            {selectedActivationRequest.estado ===
                            "pendiente" ? (
                              <>
                                {hasPermission("Iptv.Solicitudes.Aprobar") ? (
                                  <div className="space-y-4 text-left">
                                    {/* Credenciales de Activaci√≥n editable */}
                                    {/* Consola de Integraci√≥n XC & Pre-Auditor√≠a */}
                                    <div className="space-y-4 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/20 text-left">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">
                                          Consola de Integraci√≥n XC
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[8.5px] uppercase">
                                          Auto-Sincronizaci√≥n
                                        </span>
                                      </div>

                                      {/* Selector de Operaci√≥n */}
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                          Acci√≥n en el Servidor
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
                                            Crear Nueva L√≠nea
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
                                            Extender L√≠nea Existente
                                          </button>
                                        </div>
                                      </div>

                                      {/* Si es extender, mostramos input del ID de l√≠nea */}
                                      {approvalOperation === "extend_line" && (
                                        <div className="space-y-1.5 animate-fade-in">
                                          <label className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                            ID de L√≠nea XC a Extender *
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
                                                    ‚ö†Ô∏è Cuenta coincidente
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

                                      {/* Carga √∫til Pre-Visualizaci√≥n */}
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
                                              Payload API Pre-Auditor√≠a (Listo
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
                                                    "¬°Payload copiado al portapapeles!",
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
                                        Notas de Aprobaci√≥n / Auditor√≠a *
                                      </label>
                                      <textarea
                                        placeholder="Detalla que se aprob√≥ la creaci√≥n y asienta notas relevantes para el vendedor y cliente..."
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
                                      ‚ö†Ô∏è Contacta a un supervisor para que active la cuenta por vos...
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
                                                
                                                const textMsg = `¬°Hola ${supName}! Registr√© una solicitud de alta para el cliente "${clientName}" (${clientPhone}) con el plan "${planName}" y se encuentra pendiente. ¬øPodr√≠as aprobarla? Aqu√≠ tienes el link directo para verla en el panel:\n${reqLink}`;
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
                                                          {supPhone || "Sin tel√©fono registrado"}
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
                                    ‚úì Solicitud Completada Correctamente
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
                                      Contrase√±a:
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
                                          toast.success("Contrase√±a copiada.");
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

                                {/* Bot√≥n Compartir por WhatsApp */}
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
                                              "üìã Log de mensaje copiado para compartir por WhatsApp.",
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
                                            WhatsApp (Falta Tel√©fono)
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
                                  ‚ùå Solicitud Rechazada
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

                    {/* 2. LADO DERECHO (Lg: col-span-7): BANDEJA DE SOLICITUDES DE ACTIVACI√ìN CON 3 SOLAPAS */}
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
                                title="Editar T√≠tulo"
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

                      {/* Editor de pesta√±a inline si est√° activo */}
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
                        {/* 1. SECCI√ìN PENDIENTES */}
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
                                <p className="font-bold text-slate-700 dark:text-slate-300">¬°Todo al d√≠a!</p>
                                <p className="text-xs text-slate-400 mt-1">No hay solicitudes de alta pendientes en este momento.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. SECCI√ìN APROBADAS */}
                        {solicitudTab === "aprobadas" && (
                          <div className="space-y-4 animate-fade-in">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                              ‚úÖ Solicitudes que ya han sido aprobadas y activadas en el sistema:
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

                        {/* 3. SECCI√ìN HISTORIAL COMPLETO */}
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
                                          {req.detalles?.plan_nombre} ({req.detalles?.pantallas || 1} Pan) ¬∑ Vendedor: {req.reseller_usuario}
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
                                <p className="font-bold text-slate-700 dark:text-slate-300">Historial Vac√≠o</p>
                                <p className="text-xs text-slate-400 mt-1">No se registran solicitudes procesadas en el hist√≥rico.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ) : (
                    /* SECCI√ìN: PAGO DE COMISIONES */
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
                            /* VISTA PREVIA DE UN √çTEM YA PAGADO (HISTORIAL) */
                            <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                  <div>
                                    <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">Historial de Pago</span>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Comisi√≥n Liquidada</h4>
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
                                      <span className="text-slate-400 font-bold">Rol en Transacci√≥n:</span>
                                      <span className="capitalize font-extrabold text-slate-600 dark:text-slate-400">{selectedPaidCommissionItem.type}</span>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                    <p className="font-black text-[10px] uppercase text-slate-400">Detalles de Venta Original</p>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Cliente de L√≠nea:</span>
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
                            /* VISTA PREVIA DE UNA SOLICITUD PENDIENTE/EN PROCESO (CON BOT√ìN DE PAGO Y CONCURRENCIA) */
                            (() => {
                              const lock = systemConfig?.commission_locks?.[selectedCommissionPayout.requesterEmail];
                              const isLockedByMe = lock && lock.locked_by === user?.email;
                              return (
                                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                      <div>
                                        <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Vista Previa Protegida</span>
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Auditar Comisi√≥n</h4>
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
                                          {isLockedByMe ? "üîí Tienes el control exclusivo" : "‚ö†Ô∏è Bloqueada por otro operador"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                          {isLockedByMe
                                            ? "Ning√∫n otro operador podr√° pagarle a este usuario mientras tengas esta pesta√±a abierta."
                                            : `Esta solicitud est√° en tratamiento por ${lock?.locked_by || "otro administrador"}.`}
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
                                        <p className="font-black text-[10px] uppercase text-slate-400">L√≠neas a Liquidar ({selectedCommissionPayout.items.length})</p>
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
                                                {item.plan_nombre} ¬∑ Rol: <span className="capitalize font-bold">{item.type}</span>
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
                                        ‚öñÔ∏è Confirmar Transferencia y Liquidar
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
                                  title="Editar t√≠tulo"
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
                                  title="Editar subt√≠tulo"
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
                              ‚è≥ Pendientes
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
                              üîí En Proceso
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
                              üìú Historial
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
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Total L√≠neas</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Monto Total</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Operaci√≥n</th>
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
                                                      toast.error(`Esta orden est√° bloqueada por ${lock.locked_by}. No puedes tomarla.`);
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
                                    {isUserAdmin ? "Solicitudes que est√°n siendo procesadas en vivo por los administradores:" : "Mis solicitudes de cobro enviadas y su estado de procesamiento:"}
                                  </p>

                                  {inProcessPayoutList.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                            <th className="p-3 text-[10px] uppercase font-bold">Vendedor</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">L√≠neas</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Monto</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-center">Estado / Operador</th>
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Acci√≥n</th>
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
                                                        üîí En Tratamiento
                                                      </span>
                                                      <p className="text-[9px] text-slate-400 font-medium">Por: {payout.lock.locked_by === user?.email ? "M√≠ mismo" : payout.lock.locked_by}</p>
                                                    </div>
                                                  ) : (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-wider">
                                                      ‚è≥ Esperando Operador
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
                                                          const confirmCancel = window.confirm("¬øSeguro que deseas cancelar la solicitud de cobro de comisiones para estas l√≠neas? Volver√°n a estar seleccionables.");
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
                                                        ‚ùå Cancelar Cobro
                                                      </button>
                                                    ) : (
                                                      <span className="text-[10px] text-slate-400 italic">üîí Bloqueado por Pago</span>
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
                                      <p className="text-xs text-slate-400 mt-1">Ninguna solicitud de cobro est√° en tratamiento por el momento.</p>
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
                                    Historial de transferencias liquidadas con √©xito:
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
                                            <th className="p-3 text-[10px] uppercase font-bold text-right">Acci√≥n</th>
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
                                      <p className="font-bold text-slate-700 dark:text-slate-300">Historial Vac√≠o</p>
                                      <p className="text-xs text-slate-400 mt-1">No se registran comisiones liquidadas en el hist√≥rico por el momento.</p>
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
              // Obtener herencia de roles para filtrar de forma jer√°rquica
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

              // Filtrar seg√∫n permisos de visibilidad de clientes
              const myClients = accounts.filter((acc: any) => {
                if (isAdmin) return true;

                const creadoPorLower = (acc.creado_por || "").trim().toLowerCase();
                const userEmailLower = (user?.email || "").trim().toLowerCase();

                // Caso 1: Es due√±o
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

              // Filtrar seg√∫n estado / tipo de membres√≠a
              const filteredClients = myClients.filter((acc: any) => {
                // B√∫squeda textual
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

                // Filtro de categor√≠as
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

              // Contadores para las pesta√±as
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

                    {/* Barra de Filtros y B√∫squeda */}
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
                            ‚úï
                          </button>
                        )}
                      </div>

                      {/* Filtros r√°pidos con contadores */}
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

                    {/* Panel de Acci√≥n en Lote para Multiselecci√≥n */}
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
                        xúÏ}ms‰Fzÿ˜¸äﬁ©Õi(-áoÀ’ä^.Më\ù]í&π{w^+\hŒ@ã  C.≈cUÚ¡˘‚î/æsú™+«äRπr\eUÏR•Ï“ßÍ¯OÙ¨üêÁÈn †tœ)Óyq'ÓËóßü~ﬁ˙y!Dæ.g~ÔﬂçÎíP/¶‰BÎaBÊÊ»é‹ƒäàƒ‰‘ç›cè∆ö/€Å'ÈKœc˘÷ê∆dUÛuBN\/°u6<ó˙I‹ZaW˚eB∫ñmØÀ?ü!´è	|Èçƒ Ói∑¢	VBböPè⁄I6‹n7åË)ˆ≠›æ–„≥6öËàÕN‘=◊∑ΩëCcx¿` ∫èÍ¢ú∆Só:Ÿû«;0±’Nå|á:‰8àÕ∆ûï–Ÿ•˘y‚X—Îï¬›·Óqˆl‡&T¸‹?=Ñü˙&ôµœ-ˆ|;	ÏQºπ~üﬂ[Ü{ÉŸ•ﬁ29cÌQ—l∏>¨Qßu–smkˇh.¥>ì‰πá≥Kù««(ô#‘yV4nCœ„ëπ6¯Id≈ÙÍ¨q€Û,_¥ìXN0n3/®oªCú‡ÿM¥ÆÃ#«=ïﬂ:ÒË(2ågmÑlD˙V8ª†—¥áñˇx#¬˛ª˙∆4«æÎºx<Jí¿◊⁄FÅknø^ΩËê§JÉ‡Ücã] »›;qÒ∆Ã‘61)Æ¬ß4 ∑€b∫?K˜qá¶0«è›6k^≈|ÉÚa7∂o9º7ÒË™.ì+DõPÆëŒÆ=Úê;fkØ7>ºVHÁ5~SgÙê„¢4mòé.œy¥uNwONHÏ~P^Xºlßs¸öÅYõt2F: z4«˜ùïò2q]4|/¢6P^$ö„6±èOg˘Œä‹˛ È<^∑mN∫⁄ZÇ'¢¶'∞j9çè$«Ås.èÄÏ:tˆúà|ª/§Ù¢pòvQæP…çEa∞ç4p—’ç∑ﬁÑ.4§!≥¢xyBÌÅutös/Ú£µæË”3≤	Î*[òÈıirË)P˝G®ç-ı¸‡¨€*ú•S‹§√Ä¨í;ÿΩÎÖÄç8Äƒ“m {°ë∏(ÁÚß¯t•sòZÀ†∂Ï'‘˙ÍX	h.ıŒ>69b≈nﬂáΩ£5I@Txö:LæÅiZ≈è1»Íæ”>πnòc^@&´´´§oçiÎåƒ]„îá›:»µ¬„=\à÷wV™≥–¿—5ÚäÚÓEÂÌÀWÔÁdH€)”ç;˙`Ÿã\{R∏Ñ¨çüˇúÃk@g^l9'ûpÄ6(†˝1∂Ô¶'A4 í£P-/x4!)Á˘SÎvﬁ*È∏>yzıı$Ï÷sOH1‘∞[pà"1j!¨Ì ka
xÈÙí‡i`q¿nT#Ål†Òj˛ßÛ\ﬁÚ—≈ÀOÔit¡(Ç›≥8Î∏}7ÈË)˙C◊%‘µv{‘e⁄E4EæÜº¯(â4FÙöûØ^»l∆Ã‰pÒ™™ö‹’ÉzŒ"5E_P,@9äÇUûπ˚ÛôŸÇ›˙Ó-ÎÍ∞l%mﬂVÎa·ßE-ÎÚU;¥ÙﬂƒQ
•\◊“Ω°◊Gâ&<íÛ:≤‘~}º—Ö"{û:´˘RÍ)ƒLmX~®KµDœ¸B:H{†^ÇÿC–!Å˘’dî$/"§◊Î·õ˙fDº∆≥πÚ©∂Ÿ’ÿ¢ç◊TlµxçiØ≈KÿlG‰éê«ÅìÅ±ñ=l UÕ'µ∑xΩÖ∆[º¥Ã†Û6*ºŸs5‰Œ£'â.±+ô-„–≤AqûùÔ-k∂ mÑ√g‡'≥0ä»:<G6∑=LóD∫∑–™}À„∑~0<éË»•!Ü •aæÓËbœ£πP{vzÜ]xï!∆¿Òra>|Û©Æ˚ÀàÇ LÑ£A„L6∑„3†¥úPÔÍo°Ω@HF`*ı˙£iÊXG:z^~"z‘ I¬xenÓÃÍÈ‹]y ΩàÇd”Ó‹À??˚—ßs˝{§”ô—4‰ã3À’Œ—1®BØıç±xE‘[Ì¯ïFë.}HØíÂ®“»Úú‹ä%›˚àãuy“{r+¯Ï–∂ÛE}hbY6å≥è'†ëôë≈;x<cŸh¥Éà¸d`%Òzö4e∆#PﬂIπÛ⁄Ü\ÒÚú•ˇ∏ñÌó∑™a’5|t|0!Â◊;¢Rµ0 àG]uƒ1£Ü2iƒAyæb@˛tﬁjœ<ö´∫ä!‚°7{ŒZûgNˆM¥—1gip»»Ø‚Q£ëhMàoù∫}+	¢ûÌπ·q`ENÔ,4;†ôJ…∆˙≤.^I`≈I/Ÿ6ç„n'=∑É–µú†c‘ö∂LåWÛëÈBÕëÈC˘»¥∞∑D“Õ∫ß¶xÁç <O)˚Çe◊?ÅKü◊¶ÿo+ù€ªF:∑√>ΩjÉzû¡êN-oDπ—,-ò†6ê@†"…=2å˚Sß%…D{‹ê¡∏Êí{…Í`i⁄Q”Î∫hâ…ˆ{ÀYBäç7…Tˇé-(Æ€…nø ?ﬂ[66	∆§`˘<#|3ªHBﬁoi^~î35–…_ìQ“»‹'ÆÔπ>Ö€‹÷<˛‡w40⁄Ä¸ƒ”àa<ˇ˙PR™˘ùè§ìÈ¡%,«kÖué¢–£yØ‚ª‹≠∏UÈW‹7ÍXﬂÃa`ﬁIÙµb©‚ZMbL‰\<->Ç1%†YY1≤ﬂ≈K≤ó~ü∂È(ÑZR¸P°V.iKè”óvm‡ˆ÷^¨å“èAÖ:%ÅY≥	mñ¬=s/§ì¸K4ø1îàÈ–’≤6,Î¢≈$ÓùJ≥HÈà@6[Ê£LÔö)?w/ä0ôìCÍCq$Ã»U©˝Â¬ï0 ˘ÅO¶˝›¯üŸˇØcÇzÆ∞7Ñ∏⁄¡ëÅπjçÖ◊/øH\*yk!3Ûüå<ØU‰2ê≤2UâG¯öP'vã,È‡˜äòÉ7Ö+.Z…Á"öÒ∞˛†§J`∫÷Æt7ÓEÓ¿c—Dà”[∑˜T˜¿Œ Ld¬Ûe·„≠-NòÈWÖéœFq‚ûúœ‚·O*Äh∂õ€∏«Ì≈IÓEAhı-<”e⁄+:˜>˘8HÆæÒ…ñ√¢g…A‡iÏ"	≠»"ÎŒ–ı›8¡’éhLﬁü”eKÄ1Ïe≥S÷Iç4FjO≥NpÚ@g˘·<∫MÍ≈Òk|ÎËüÀF]ÿêÏ®Vk˛hó´3ÚÎı·F‹˝§Ëõíè†‰õ2˜¿à äXÅc©ƒıaˆ–’’ª3ÃL´/gzI;mü˙¡)€jõn~æ—í¿	L∂óÈFô¿ñYÒ{Dõ4±\/f˚≈ƒmÌ”œG4Ü|z&Ì:„V‡ıÉÑÜ›é√«bfòî&Ö‰0%÷b◊Òd¢√0
éA_ß”hk»ı:∆sìõ¡˘mkDl»W%HÅù˝Máº1ä"ËÈıG›Nƒ6ä4ä-¨ÅΩYEè]ﬂq˚”Ô22+Ó}ò“YÓó◊HO„∞À≥Ÿÿ¿YEê…î@“I2∑OOÄë6Œ∆!ì9ëC @€ñˇ;"gêÅÂ;›í–‘üˆ•|rˇ©∂èó
Ö/|’~I¬Nv≥z4¬üùœ=Æÿç≈3vÔC3·ÄΩ≤AÊO/ﬂ«ó∆íR‹∏^˘‡0≤‚¡‚ç…zÕN’⁄÷© F÷LN/G` k}Ä€∫ÓÅfTŸÆãñÉE9<¢|¬óû#-6jzè0;H≥Ìú„ƒ“bÛ™ICæôµFI@JrvYˆ˛∞YgoD@≈q√õX2ßÁˆÿµˆkÙ?sù÷íù ÿ-QôÓF˘ÿÆkÇPÀâÇÚdd°t2ÇæÈCÎÕÏNC¿Øe¨{—à[ƒ∂Ü«.P‹ÄPèe»âêàZû˚ª=Ú-r|ımRè”Ï¶Î∏'Â⁄w∂ç[∂fÛ‘æSÛÉÚvi„^ŒtãJ2€'=r∞µ±±}ı´≤πEûlÔ¨Ô¸—˙˘Ÿﬂ⁄ƒ;˚[OüÆ?€ﬁ⁄9‹Â7^lÌlnmÓÓoêÓO_Ãî∏ÔÖùKf,ä∑s¥⁄ˇ¬äQ4æÅªS˚Ó™™Sœ£—÷‰ˆß¡lÎU“E∆π÷£xèõ3Ã
øn äw·[‰´!ﬁiD6nq.¨!®µ–^≈Úâà·–Ú©«(m±`‰ÃNt[Cy3k¬Ìáo[!(ºÄû{ÈVû≠†Œ±d4 ç‹vIhaÿvDmoîpôH9x ^ ¬¯Ã
E¯'|z3€Ò=¬ˇ}\ÖZæp˚‘rvÔ$à∂,{–ç‘"ÜfE=◊?Ö˛ú#æP t•∑"~K¨%è≥¬~π!ÂRﬂ+∑≠|J¡Œ {R	n
EoG¢‡N√àA E?qAIóæÅe8ßHh:*Ècby^~ú≥ú≈Ñ9ÅlïT)kA’û¢!óÆF·ÀAˆ‚º cÌ9~äUN±B =G‚Uˆeç≈#F3$l$GÚiﬂﬁ;|°åoÊM¶q∂—e)ŸdßóF)7){¨≥åÖ¡ˆòÅ0˛âõ– 0:3ÿ|°˜<›ÉxB’âàÍΩ√ªQ‡k’Ê®ôøC&ß)lm‡ãNpÑ<0≤Ω
ˆmˆ-ÔjÜ∑¨j„6`0nCÅøH°vFË√ê$À0Cìy≤VÛ€
YEô»‡&wN ëÊÇç∆‰–k‰°°÷L4ÙÃJ=¶u3PΩOÊ{`*⁄ŸOë°•©Eu≤W˜¢ ‡‰‹∑a–¸¡„ãΩÆøßl{EÕµõfìÌè|B˘ˆY{rYàähF‘ÿ≠b¶ï≠UnÂÛÌ É-Mæ0ÜŒ¶ﬂÅKv1Loü:3ù&∞Ñ÷9Z.a8©®∏ë±÷=´(6ÿÏˆH ìícÂ27PséÒ{6ïf¯ˇÿ£,Ö‘QCa}Ωó Cx~yè—˘∫áSë·=ÑÃâÂ≈¥â≥dª∆`8π‹wz¯tn0UÎµÕü¶Ù*k8•∞¢˘î»f∫∂Z!T¯Æ›AD©ãkö«˙qÄ©íÚûîzù∑Ö,Ò&π£]Pù:»áüƒ]^´rV&Yn¢˛–6ya?¨â%Z!Û3Í∑Í“„¯FBÊV–‘<kúj#-‡)n—5Åc„BËÙ¿Ú|Zo∫Û˜–g3ºjíøTÔG‚˝(_É˛E∂ka*¢õQËpgﬂÒÅi“Ø¥π®‘\î7◊∂Ø“±â*Z$BwÓ§kûkªå•∏nDl⁄œ—•Ωá(mñœb=)4ﬂ0¯# \;+çg≥ho_∆ıˆÏ¸tr{ÿW∂-=r‰y¸ÛÛiT˝ ¡◊ä÷¯/rıÍë˙L:ó
V4"#”ßπÑ√ﬂP‰bhoHí◊W$Ÿ^˝0óõ~€©Ì(≥Z~Æo!S‘?ü÷ˇ5º%∂tÕãçørXÛf√o2ü™{¢@™Î $ú∂~A”Ë™ÒπAkmÆÂ…
âiyL"5{¢∞È’œ∞}ZÛ:7'XﬂMŸ◊tÒ,sx€¯≤$t®⁄lÏ¶û¨5;çì
òF¡Ø*.UÜïaÔ	XlΩ˛’∑>DÅG∫{x–_<óI∏h{Ê∆$◊LÓëaÄG–óƒxDç ∫–ÖœŸ7x'tÉÃ≠≥"∑û“&(πeüÙ’™°05F¡ô⁄–#($¸ﬁKm=
4¬ë8äß PT√„Ù0Ö‡å¨≤¯ïÍÿ∞5‘)ŒØ:È÷	¢m˘éùΩp¿⁄MºÈÙìh§`Õ¬VB#‘
™M»∫uıÂÜ|{…ú˘îlhô’˚EkXKúìåŸàƒã∆lÅ„¿ò/gË4QÁ»ø&@kï*KÆ∆ˆç´Ø<{‰±§πdxı∑Äxv%ÿä#⁄\0ÏÄ™©∂s≠±ü¨Dç[§È;QOÊÑ
€0–üëMôy¯f¯ä“b‰ˆµ«y>Ë/ï…ñ&¡≠ ”û¡ML ÁŒ„/D3°Ã÷¢ så3õ»`6cÆH˚Tnd&}Ô%R£uQw¨“0œnò5≠¥—sfÇ√-†aˆ⁄´í’5¿ßõAqA4Yb•’Z˚ï‡5ö‚-ÖH£	]m<1-o∑Æ*∞‚+c¬¥§rãöÑWÃÄ9<Á6m—7\îß‚Ö}÷~≠ˆPqùxñ≈Û¥ãtN YãPü’û∫˙÷K\îFóÊâsı5J£(√:ôÛóCcm2blÀ∂<˜ÿ´i†ú±è“ó$ù´˝#íÅ%Áõ÷yºé‡¸yx]JÃ?K∫0™˜…‚}¯Û`>˝≥0??_=ûì»ÃT@*éÎûÖOÛ∞—Q¥tGµ^)v’ÿÉ¶~¥]s∞≠::4ö„‰⁄z†®$◊–ÁÎrá<^-b¢JêSƒçÖ#9sbæ>0¥Íı<Í˜ìv±†nƒÅ>ü“ìd€Á-ÏQÿú8≈•˘ﬂ√ùÀN°}ÿâÆı’6n¿tìñwz≠é¡º]gµ√]í–yˆ◊,˙ÂYÆO£é*c∆•«∫~mX«0G††ΩY>÷ÅXw£cˇò$Á≠q©.{\÷$û˝s“jG	I)Yfﬂx$ú}ê˚ƒ7á–√òùˆUCL«êÔ+cÎéirFÅ>b|›˝ÔAÛ¥Åz	öºL+·“˙⁄[Ê¡ØßÙ∏/A4è†’Ú%„T˘˙˛À_˛_ÚÏÍî"¬#<Îgﬁ”˘h∞XıcıH}ﬁè
~¥≥9%≠qùOƒë39«Éj‹ô/2æﬁ0â¡b-r49|™ùt’^ØM©Û¥Q±”◊ÇG⁄=4´åò√+Ò‹œGÆ#^Á∏M*bÓ˙ !¿cI2≥U˛ ay_]å<¢CËkª¥ªßVùÉl≠slúö„-J±<≥ ∫õ"ß:∞£¿Û∫ÄL∏SÎù^‹z˜q„-éI≥ ;+ÍÇ/Áh≈_Jq ≥ós¢‡FVSânXNÄ8;±HŸwÊC≠ÑH™}˜ü˛yx0–»Sk‰€É–Ráœ7=à’ÆaF≥RPü r1;kjR·õ”vÅM·˛‹êeVM’«6Ò≤èàk<\…ø.Ø/}Ωﬂ»'8◊¸Ã"+d+ó§ã£ö„ÙˆõSñtC\tY∆¡”Í38¥Û¥O5·nrÚ£úÛHh]‰AÂëEK$∫ïôîrÒä«KI[˜ÓÖJ\#ÔI9ñKyñkÚ0,’$zyè¨∞ˆ8w^.0ıe%S_R2ı˜._]6∆UÄ∆˜’%¥Ù†1h©zÕ|låTÀìKM ≠Êh√‰‡R¢êîf 	C⁄◊\;˘∆Éö‰≈E◊ÂTW}©}’YT£r:ﬂ˘ø!Îá€/vIFogÿ†æ˚≈7do˝Ä›]∆õÕ!\-[¨9$M;‘«0ìÿHò¥÷k®ôtsT'œvÖÅﬂØå¨5cìú™ÌB•%^ÂmfÂY¿%a∫ [ˆ)~≥m±—<Æµ„Ù≤SG`É¿Öq%{ÌπQ⁄”7qh†è&é ÔtüL¡∏yL∑∞&≈«^˘ùQ>î¢‰©3∞z|k•jíkÖâk/Æ∞\aF„÷<´>v¯ì6d“
‡ö≤Áä∞Eæ´¢∏ã
vúsÙf˛±	⁄Å∏}?Âëoè¨íÀ≈T˚ï∏ŸT4ﬂª›ÚÒ‰Ö≥æôjv1≤æ0ŒÊ’Â˛K)∑6í:%y*«Yu/Ì•Äæ˚oø (¯“
Ä™)£ºkÌQ=!øß0•ø˙ëcÃôPòêÂ:SùMÛûòêà/≠êmø—òæ£≈¶ª/ynø£ÊS¢ÊŸ=fÿ!|«¶Á«ﬁ®êõÇ}ó)πx@üå¨à.æ#·H¬+æî]ﬁrôêó·ıª@ÀÀ˝ˆêÛ˚‹í∆›+ë‰íÒÔÊø–êﬁÁBé„Ø◊¸¥?ﬂ|“æS˛II¸tâ¸uX÷`8†…”¬9AóÅuf|D?€≈ïØNµêyñÑáo“Á°±ü‹`1V1¢ØO’]W¯F}PvÈ1•ÎÌâY¶H€õ©{…ò“ÿé†‚AIﬂäê‚U°cò	Y'µl3%7úPl±¡8Õ.-Â‘áﬂÜÊcíı&£“≠≤o;~Ê"„üÃäbít-ï›X,Á0ê∞”4Xo;’ùö®M–≤[Ùîmæ _r≥oz`≈,øπÉAãÂ›4âV≈ï†eFB≥#˛àûÇB-ı3[oj‘ÖP„Q,Ïƒ◊ì´âÍ(èzèîœ
yŒéuJ˚Ÿ·°áıQ∏˚CÊ˚°wñÃá N«∫¥ãyœt8ÒÄfâ<p·Òl¯¶Œ…Ã˚!Igqhw;∞bGπ1^«ˇÅ°1à%ÖüP:] 6lÀçÈgëñ›Úü‰c‰I¡J„l@(Lø/ı£®≈Nñ6˙ru£Á$°©´ï¨+63ÿüZ:®™î	˚®>i_]b˝∫-˝óÛœ•03r.¨Í∆. ú¢WDù€ãS8∏wàƒÆÔø¸Ûﬂ.Z0«6)Ù∞è⁄5ÌÜ‘πmâr[∞´‡©Vèg7éi
\+µëÀﬁ ﬁ]Ê5U©gÙﬂ˝˙/ˇÂü~ëj<ëLœÑa°Vh"hc»áÎ£√÷≥Ì≤±∑ww∂0¡Âã≠ù√ıÉŒ—∆ØÍ7Aù$[ÁUVÚ∆©d›&&Ñ°ô/‡nõ©‹ÿêÔ∫÷÷%ÈŸícVÊI±˚§}r™A]∫„°⁄•ÓèÌ“›∂Ì·Ó◊ß”5W-Í‹™µjŒ}ˇÂ/ˇû|ÇÆπ¬˝mü&."≈π¥Ø⁄Ê37∏ﬂ:gM_ç!K˛…Ë&È¶gvÁ$ÕFB<…3YÃï≥j¶v{&≈£ìsì‚¡gŸR…P#ÅvÛ˚Zô‡ìÛ˜{¥-9πq©ùEœû´‹¡2vº:Ämc@Ì◊«¡∑óA¿™Íwª¢yçZ
,|2}\´Rà\!$˙?D¶ã=Î<%›óüjtﬁñ5Ωµ¿ÉJêXî›C´Æ◊eﬂÏ∫ç-Y©4
î’,¢8Â∞9sœn=(rË§ ÁE» ≤J_ñS$≥^âñ]ﬁk\·⁄ãìµ%k#B5 EÄ}˜ﬂˇ3∞\ﬂ¶»&ÏFÉX÷!Ãr ®T§à≠h)^¶ì˙øÈp¨eÙ≠Ö+*YÒçSô∞¬Ë3ü”2Ø«t¨´¢”⁄Z∑%ì®¬”lmg1v—"-!Ÿø˙*t[≤∫k0ä&©ÖiÌæ ¢Ì⁄!&\Ø±ä4qÓA=∑èIW∏PÃRûVr≥¥¶aiÍ!sŒ=Hp[“—ËVÌIõ!ÌÂ~÷X?ÖÜi⁄ö:ês¬5˜í?iÿïàı,∑éŸƒ˘«¨ΩÜ/gX>h±n≈Ã4ö’ëÙxt	ç4€N+NzÒ»∂iw_P¬e3Ks‡∑,µõŸŸ%ŸêG¶°W2À∏‘{•’πV¡ßbhÿã…‰5vTßYçN≥>¨≤»j9ÒËr1T¨`»˚ê™ÒîdïTv/»+ÌÑ•ù§°FÚgˇ'%∫Ï| ÷Eµ:Ì‘QªNŒ€Mh3ˇúk•µ˚yZó1R{µuR¶∏yo)9,Ê•ô&›mËkj‘wøêæÂ≠"¿9zMùÁM◊êa9Ü¯æa2¸Áø)ê·‚  QñW«Äøù‘ ª%–ˆmi*ﬁ$7wMiΩvÌÕ…Ñl≠qU¯Çˆ‡Ú,oêp~j¥_jSEÙ©œ≥ø£ˆ7JÌø˚´ˇ] ˆX˙wò§O—LÃ∆Ã∞ﬁıOÇnG2yÓ‘G«ÍÈ’ûóıvYav˘áBŒèÉ(*ÿRß¶˙µ€JŸSU´Á"ôﬁAcª¥ﬁ3TÌŒfHw4‘h≥a>ÈúN;VºBÍ¬ÿs©Ù"»L∞ù«qÎK@¶Æ±∞ÌÆ’™%c´≈”ÿúÒ¥U∞2g:u?E{UöM)Vç±R≠≥™3&ØÕÎUˆÕH§ü˚61!îÑXgñõà"”b ˘‡°lµ∂|4e ‹xi"πiñs/°œ	ƒ>˘ ﬁ)Tøê"£ºÈMñΩI†≈JZ∂õú3GãÙû=ä‚ Çf$¥ ≠;™¢5ŸÕ™Gç•§xJ¢Ur.– àŒ÷‚Ò˘°ÿÅLàH◊Äå‘◊÷…/}£†V=lçáZiLY—ƒüXv´Ql≥Ç1ò-*£ıΩx"
›=•&Òø÷qx#@3◊áÌ5{>ã)VN¯'Ù@&©bê¡‹#û.YÜ‡w◊GÍ≤P¸‚¥á◊ÑŒßñ7Ç¡îS˙7ë$4ñﬂá∑∫4ıG‹(Ωﬂ•=@¯>Mz¨É∆∞ú–≥l:ÄL£’[ÙHÆ{è•NΩóπŸ˜zΩ¶	Ik)ÿ!,‹G$å&ŒVóíó∫¯úeîOÏQº˚÷s} È"øÖ¡I@1•/πPSí6Í'Wã-Õ{ÈF‚ã2O˝ÅÎ8 ˝eD◊ ¬®‰Ìﬂºó‰ä’fÄƒ-õŒ¬∆‘%a‹DxÉj9≠D1âÙ¸ ~ÇÂ∞áÖ:êjl„{8dÛ,ÜC›±qAhCú¶iâçHæ85≤≈pıdGÿÃ¯<
èöœ•ı2ÕDÃÍ®M‘“xvP6ìÎµÖ*∫∏{®‹—Ì∞â #∫ïvQº¶a≈Îr¶GÅJûß(®!Af©∆K÷Tëíu©˘\E,–ﬂËô	bœÎ9E¶WÒÿX}äa–úT˘√|´Á„π÷ÌÆËÊ˙∂º‹ŸÌŸˆÚ®nÌ÷«kZ€/-]0ø&>O·óŸ¡∫A”ó∞kcj¥¡¶nH—'rö∂íÇ"ƒ‰¢∏‘Ó…ÀØ∆ÒÙz4ó⁄ükIé¿™Já≠Å˙Â‹(¡Êˆ@k”◊:Õ3ﬂPá˚ôÉ¿çu˘Ãfê´on
∞¸kƒ£¸E °ßRÙâŒ0‡ô®Õå§°{=JéÁ\ûéÉ˘¬ÈÏ9J∫U·ÆúCæ5*YÕjD[æ\ºTM -FbÃ
‹#ÆÛã	c¿Å∂ƒtçí≈µKè`y¨°ªD¨~MMç,ıK?Wı›Ÿ¯{Y°gìwQf-≠ÇÆ»*œ[[ŒKıj6À≤¥•€@a∫JπHÎDó≥Ì2ÑµU»TØñ Qê&'ÄEUÍ3GÛ=.≤b”c¬"+Õ<=úHÀﬁé†vGä¨~∫ÂsÒ£Ù≤π°Ã,TY‰º|5Tû≠^h€{MœW/Ä,_ å¶R¶dnyπ∂R…¢éè_ìöÚ“a;J&odÀ AØ√·
£01¶◊xF¡Ù åÉAt≈˘Ùö¿»ë^ì;“KO
#zä#}ŸÎıÛΩíh¢&•◊J€xÉ∆SSZÉÃƒj	ñçYcÃ¡m’/Ω¶¶¶óñ*ò^Ìe ó⁄'ØÆƒ∑;’Í<û’uWëF§@–ZèbåõU 4R≥=ul°°B‘¶QâµŒ„ãj≈ÚKç∞ ∫ﬁe}Æ…YÍ¢T„¸í¸ˆ…ˆÊ
π(Ó$ì±ò¨R¯& Wï˝K´◊T}˝
˛ÆÈ÷ì†!™X≥$ﬂòFlìóñD±ágÇÊ&{Ë∆¿}°4äöì∂s}«ÌÚ©©∏#ä8±≈∑ä+$nﬁWØlá$n‚wŒµ·ñ@ïπÁoö≠•ÈjöSË&˙å ±ÑcŸeµÛòÁWH´’ÏÉ†a<HmÍ:vfîx¡ 9¨‘`ï&6ê‡ªô¬•ŒlDè/q»ì,Î≈+◊gÓ#«^êÊÀy˘∞∑å^ £ìÔ`o-®•b^w/dUÓ≠/◊UºzvËr«Í+Òä™YÈÆe∏≈J3çÈC+ÀsK7ålô’ﬂ'⁄9}©ÔhÁj»ØãL]7÷[*˚#Ï}¬V*¸™Ñ∑≤u‹xIeÃ``.Rr¨7”{°∂õC]|óÅ.nU`.ÓèÚ± )´.‹¯9xn`5¶˛)◊≥ælóKÖ\7ÑµÃàÈu!ôö√(8∂`†€√æ)£6ï»Ø±¬∏‰+¶…óûÅ|Ç%›0yy›Í|∆∞Åà—Ï≥¿±ºnçÃ&1éÑi»bÆ∆ïÏ™ãJÕNà8?Ø°›…±^R∞ÄxA‘íï¥zqç£ÛÇ≤tùÈz†”˙û’Ø)]wôÓΩG[Á4u'_lI5Øx[;` øåå8Q˘√∫“P˚y2øtÚ‡µπ“ËQÙGzbB\‡ Õ[ΩXæ,nÅá≤—æ|
ØüSÙ$◊ X|XËj(R©óvDyó¿FÍË‚ì¬∆ı7T:•»ç-ﬂÜﬂ"~—÷∞ÙìkÓd`ùß%Y#⁄gy41–&H3f‚ócÎ≥Ä‡±±#¥l∏AOs0z(™Éû≠UJòØCs&<Êˇ>˝íµ?©Yoö*´ƒnì˝≠MÚ3¯ªÒÙ˘·˙≥Ì≠ù√]ÌL¡òÖ\?=p•>}° ˝ì4¶~D√ëg¡˙≥‚Û<¨ô•iøÛﬂT…ñ˚d0{‚6)}c,µZµá-÷ÌieÔ˝ÓØˇkæ
;Xe#K‚‹∏'K◊\˘c€?≈º˘º˙GïƒÓπ®.ò∫»è√ë©O}äﬁ^Z—Ãä›>∆ bUÍ–J¢¿Ü›ÄçPP>œ—ˆ˘Ûg˙vD:iÌcli›7CÙ#œ:¶ﬁ¥ì^Ó∞#&~y4	Õ±^ZF¢s`≠Cáóà£ÛÈ√ÍËXèUët;ÖL‚Ë*ƒ“m}∂B˛`
ÊçËm3PŒâ,73ßáWK}•∂,∑ì7Ç(¢Ÿ¬ì÷HÖk§ªáÑ‰i–gußã⁄˝˜åqõy˝MÜ‹¨ââ±˚3¿ÓﬂÔcS®ø√pı∑√QàÈ’?§Uh<uä¬êœ`—å1{^ú±±Öâ˙Ÿ’◊æ;» î 5µUJ˘◊ãŸˆ∏±2ÑpGDëÎã¨2ÖXß4ïF˜©«jŸtÀﬁ–˜HâZ 7p°‰Ôà2≠÷
t“ÒS€éNÆ¶™b˛€Ø5oãì¢ÂœôÌº!	ø~ñ˝∂|˝Ú6)6(W>h⁄-j;GÚO‹h÷£‚6çHOj3ÓµÌ/V`Dj+J‹à∏Lı…jé¸d`%Òz6(… ÏR˜krÍ◊ÜƒgäoÛIdΩùH€¢23ˆÙ‰Íf¿9nKSNÁªbX
À˛6TJ”ê©=∏ ©nÜÅèZX∏w≥õº53ÕrB˙xÿ¬”˚’èœ∫C)_–@Ë≠	Í≠>:`F°üè‹0('©≈Ô?=|—C4º˙Ò_˙|tı5†&Ü.˝5„æÖIˆËõzºMû±áÿú\}e' Æ¨c◊cπq@i∂G®ˆ6´—;Ç1>rÒ≠S∑o%AÑÆp·q`ENÔÌÉá∞"›Œ€ 62]Ãa	”¬È±!À€€∆‘NpGÉÇÎä…3Î$Ê*cÆË÷î∞r|ö◊/S˚bˇ∞˝ƒà¬ïèâ§'m")? ⁄@®ry∏ÒÊZÏVD”s†˘÷s ÉR+c˝‹û⁄È©Àœe¢⁄‚…À˚¶∂?'0…ˆ‰ıW`efÒHô'!ª1ãÏ€`ãm·,%∂¥‘Û√⁄[û )DªûU!≠Vÿ.Cá˘9BG~"Y`πUTcF∫Ê,´°M’îzΩ˘å4ÉY«Àkdñ∂»º
Q92˘8≠CZö<iê∑VË/ÇÂÙÊ»ÜÂπ'Æ≠Á<˛§ºÚC˛h|çmÛbÇº¢C>aNpm=<”™SoY¿x{†xNçR[ Õ”D±x%©AÁ≤B¢„˛4:bXÊÖ|F£ `w¶óDÓWEîıåi∫j|g›◊9ùÓy†<ı&î'déÌbOyS∑Äs¬b5– yú¨„Í[/qáa	‡ÍÎöä·ÂKƒ sÉõY%8báÉ√f;ù%tÙ|¨Ñ)äëß÷`)€π$…P≠7¨å\ÃD€8rxøgG∞©Ç#ÃΩ8Ò∞Ö¡ä≈Í…PöIcr«(r3 ‡å£N˙®Ma¨º˝∞–æ,5ç.“@|=ñC;˛âõ∫áÉŒãpÊC»√U≈o∫≈¥Ç¢≥Z®¡Ÿ°;ƒdYõ@Òz’'ì(¿Áõ÷y¸‘∫≠ù∂8K∫∞ôﬁ'ã˜·œÉ˘ÙP⁄y£@¶√∞
dåàÓdµ∏¶Å˝ò/ ßgÚ.∞ÿﬁ≈'‘XGxõÖË√›˘ô^ü&8U„ıw»„’2‰¥Kcp⁄oA76Y±ZÖ)ågAØI‹@qÌ¿–iÊ[Y?“G6Î«È˚=bè¢h‹’ƒMãΩ¿Ù0ˇbàÔtªaﬁûÙ	{Æ√˘ì∏ÅΩ¬Ω#∂Ì∑–*ÿäÖŒ±Öµ^™wÖñ‰`äÛö-b}⁄è.6WjmFøô¬@‚¢joFœ¨d–c™nW˝ÿ˚dæ∑àÓêõ8CzX^Ú1»ÓqyèÃÎ3£fYj-Fs&¢ÂËùsû«ã<Æıµ‘;.ã&fQ«,Œ-Õ]Áu¢ñEf-a¸â089u4ﬁ®Ø)Ë\π®fY	˚ìcd”ÿVP ‡?+X„iGÓ^î9¿ÔP¸übjxdVä˚ªÅò?5zT≈n2L¯éø(≥·KTGRƒ,¿ä∂È>úBh=K≈&Ki]-n6π∆5ù¨eKHK8ªXÓ^®,u8ÛŒy¨®TXd9kK5U¶˚ˆÖ∑&Æ5dõüÔw;ø˝[qrıV+Íè"f¶£hÏX≠‡≥ﬂà„˜à3…!nä`ç¿´h_ŸW_¡G2äGÃøxEÄYµlh*¯"áHÒÙpºD‹'fìz4©z≈∞U4À3ÀØõÃÕÉlí£mÛcw.ÔÂ˜
ÖƒS%…ê›EÊ∂x-¡e[)&ÏßHpÕqeáë≤#≈˚∑/¥Ã v^3^L+bÏ6≈åù_g–ÿ˝,hl˝Í[iY[ä∆íõ–d{◊=&¥Ï»B:F17$™¿ ≥`! æ@?›/>π4r¨w¡c:?5è-≠êß€¯|{s}ülÏ>€>ÿﬁ›Ÿ: ›É›ßªd}ÛŸˆŒåvôóf'∆ÉP¶•∂ﬁP@◊Ö˚@}òö2[GVóqË‰u·sk-∆∑¬Ma¸ê±_ˇÂø¸”/“‰‘Ë-πgı≠H
?˝a=Ú“od»NúBùºxﬁ5ÙˆÚÂR¡aöO!Ê˛^´#¨fiyíhy©4àﬂô8“∆ëƒaê5dk}«Åá—e_\õÑ*Áì *x‰ïxπ§ëk∑ëS∑ﬂ~p∆“</)ﬁ+ú|6N&œ)jîâR2ê£¿Ãm‚Ÿê2ìx<ﬁ#¸¥>ítS(Æ±@ƒcXñ=zÜLµ{∆ƒn&=ÁπøÒî*™TÔXÉÅp˚˜
Dg0-?«T§Öø©^°óöB~3∑%æªr}‰:ôJ”
u∂lÌÎ\iKå‹“†µù °Zﬁı"∑K;µáæ◊}V≥ŸÁæ≈ëﬁ¿%ø¶⁄ß‰$ù3◊≤Sæí´,N‡ö_b7 Zûe∫w9#W ö9Rõ˛T+∂{_~π∞ôkDﬂéÅâ†`+ïv0º‘˜sª&/77£ }˜ç+˜ô∫¿UJs,çSÜO;Î∂y¶Ì¶Ï⁄u]ÁQî“õô.c/Y
˚Ù‘[«80fvÓ…2rﬂ?Ñ¡∂KÂ…±ÍL¨6”8ïô‘…¥3òw≈®t˝GÃ≤z∑uÆ]ÄIgiµ,|S…∏›jø–Úa¨nÔVMQ8âÃ›“I„Ùb‚D;N˚fÖë∆ÇSfªæÓπ‰=]˜¨Öñ⁄;j≥i∏…ﬁÄìÏEï ˘∞V_ü∏äíÅÀ»ªãTΩ.çUÃ√∞«∏u8ÙdÑ…koLTucı6⁄X›tklåU]Cwà◊RQC)NÍ¶X?C˜LB?	auüé„—•]IbYÈ“5Q%	›:◊Q;b*Ä÷œ<ç˙O,˝Z%≥ Åaiâ∆ì¥ï §r∑&ìbï™¿ñí(x†euN∏¿ÜÓ_h˜GÈÈá(∆¿ΩŸ Éí$_[:˘§Û¬mÃ`[^É	ktä5¶ù(<-zPÎıX 1t÷íQuçù¸hÁÀΩa˙yQ,ˇi≤ÅM‰\xùecjzÅZgsß4EˆÚuíπV˙ùMßz‰cÊdwc§/ÛT¸7G“Ÿ¯Ã÷ †¢Ó≈’1ˆÅ¸ù$ÚxMPbú≠h∏∂FI“Òq›gÕv¿P[JL±:˝¯ÕAÛíJÏ»}_Î€8ßËáú”n„◊[ Ë¢THy ıÔÆ≥ö'£R ∏•]“t ◊)O™uï‡zır¶œ=+≤]À√Ûù1 Âå°vËS„¯áíÎUR_ëŸ§âÂzÃÿ{è˘ﬂ´öçX§bπ f…e_EsF&YË%œ=ê"©ÿb15XΩØ…BônsÕ√ƒçø¶–Ã9AêÉfˇ∆}/à1±ÊpÁâ˙]iTûaª¯±µy\ñYd¡5h’zÌ…Ûö#	th£VA!Ü‡√R›ôÖ≈Ü-WàXZT∆ègß<P: J¿à⁄/Ûzâ_
n¥Zvjlh«ÑFJ◊Í´ﬂ‚©ﬂÓÍ≈¸˛Oe◊.á ey$ü4´)·ﬁE\t'l÷1+Úôã…J]?¶…Ï<˘ç8ı"õ¯äu.Å‘2åa√«Ø!‹Eòy±Òh˚&\˙Ö˚⁄–z3{Ü%W%¸9/⁄ífimÀ÷6NzSÖß'cº≠\∂.;Á}ëùÛæ»ŒY‚°f˚@¡Xs(Ê‹s¬<ó?MŒCÉóÕèçôcÓﬂpäFºÑ€iû∫∞≠ü±PŒVí5∏ﬂ:π…„≠ÇÍb(ï‚ÄYÀk6ãíËëΩu‡›88é(çÌ»=v#ñƒk∞Í‘#}≠>&Èe)˝Psf·ñ¿˛@[F˙zîj≥W¨fU∂QsÔg´ıWEr™?¥:QI!íe‹¶*Ñó∂©@Ô‚	4∆#∫`I3ükÍÛ:nXfqEÉùs9≥ıAdõ/∂v6∑6w˜∑»¡÷”≠ç√Ì›ù∆LÁY/5´Øg{–∑ià¿.]Ø¢J%èáxÃΩ—l∏π8[ø¡3AA÷¯¶fÂ n≠«RX.ô¿I´Rq9ö™„Ky	x!¥ŸIÈ„œX±∏˚SvíIı7<†…ˆbû:ÿDü”*˚RËU≈ó Vö‘<V<îçfíqmYmo[ö'ät<(¬Ëi}ˇÄ‹ΩHìi)Éäf™ÊVM∞ÈÇX[˘≠Ó˝§J…Ö`s'ùörC’q¿•¨9.Í<~ÜàD¿¸=≤étÌ"››êi:û^%-it„–'Óî™OùD9"5∂LÉ@U¬⁄Âó≤‚PZ∫ç±˙*’r1eÜÿ’◊Xu(ø¥˝5∑ë udHˆ\YTóMYnêÔÜLÓ–ÌÂû˝≠wíœø…'èGùíÏ#∏˛Îí~ˆ•¢?º¸”Ê •·Hu}≤Oé#∑R˙…á˜N˛)éÓì¶K¶¡¯Ôd ù«ÆA“z»–hf≤ÔÆ´5û7ïé\¥w€#lŒähõØ¬vay!∆
í.•ñc;TÍÚ¢Iéc›/êÍú∫?%?°ım¯vl˘∂πVO+˝÷V7˛Q<ó‡R_Ît4¬ãﬂNºﬂ∞¬dY‚p1sOÉ„îÁ6L–}¢‚“¨©YË3.Œ¥N\OìvZ∂M√dµ„≠>ù{_Ô•±cyûY%Ÿ&≈ÔÒZÔÂ¸ß&u9-ì»¥ÉÂ∞˙X/·	4±œnË◊@ ¢â^‡{|`ŸèÃ≥ßfK∏m#¸ª¢iÿå#/!@Çc&VÓ“x¯œzºi%÷Û˝ß™∫mËâö·í5	U*áv}VÜ∫ë‚'!®œo“ªrŸQ¸.»®x;S;K.óÚ'˘z≤ßÛ|–¸Ä∏¯lFÆã∑nóBÍ4†¢%◊Ê)#“¯ÇVâU¨¡`viQf9YûúÅÎ ÚÚÆÊ*≤≠æ:’a•©π√æˆfà#{UH}A⁄ÚÄäæ`µ˛0<ŸE&‚±≤Çãò9$∂aΩô»˛Ïcp¸öh`ÿrµ”ËÍ[])9œ·/Èœ≤Í ¢ àùŒx∫L}°Vƒ¡àÚPIRπG‚chÅŒ0CßÏ&Y	øb.\ö„’wL3'Î.üëw·[¢Ö∏|å@†ÿ§u⁄Øç≈c%AØ≈W=ÊYÎÔ§ïøŸ0ë9∆Q6¥Î£≠^°ô.oùîönàÒ»™ªM∆¿$+>˜m#±ñdˆ‰ó÷C'Aƒrˇ£TMÇì¬ÿısÎÃrëÇˇ¿íAà§˙Ú¨4—{cº≈Còº)Âì0yçgB0y#√5yâeÊDpöºtj˙BdˆBÂå~åWsªßÈÀÃ:d˙íL‡5_ùb“8ÕÕ8µDvo-_ªâÙ≠Mn:Ïœ‰r◊X¥ANçëiHg≠è¥<–¯s}4€ˇòz!»%OFæçÚ5˜≠≈ö {ã[ÍX·I£jÚÛÔ∂Ò^ë?÷°ÊÂL˝y$[D#í†u8© –g%≠*ö~¬  õ˙ÊèÜ&áá¶È÷ñDCŸÒNV∂ˆΩ˜ö7£Gí∞Ó^}ˇÂﬂ¸3yc˜Ÿﬁ˛Ó«Î;á[ds+-t∞±}ı´¸û◊;xˇè˝WÕmcª∞Üˇ¸ëÁº∏œ
π{!∆ÿı~v≤öµÔÌÃ≠øwŸ⁄.N¥‘∆~‡ÕH˝˝ÍO	‹QÙwÕ⁄g≈T∑“™íRBû‡OrÚ≥ÌΩ§m˝±ˇ›_˝	¿˝Èˆ¿¸  ¸Ò˛˙ÊÓô#€;O˙ª+Ì¿ñÌPµx#8∆íÈÒöî¡∞]Z´k•;tÀ≤›.⁄m∆NfòŒ˚.¶($êÖÀñ˝É&À…¡HW‹ósyÕ ƒ≈mÊDd≥Ï‘kÍXV∏Ò2ƒçøk.„˜_˛ÚÔ…˚áªáÎO…˙«ª;∞à+Ô„`SÄ
!çA≥:\V®WoÃ™µŒbtW[B√_ˇ÷xokgì·"asQÃ!Îk¢Y4√U–/^S+óçEWµÚfN=Î√[¯U*Ó¢é¸"‹˘Ú£˘”¡ßπ-¯º-g:õ“8aaÌ§Cú2+÷ñ8·›.=$Ø?è<=Q∑Úf2éÚD{‘Ïmjk7¨wõ¢‡H5î' ^W%e(‰2Nw±\ÁπüÇ}®Q∑x^≠aıdõ|vΩ{‚≤å%géV]A«AM@(9Ò•^@µ˘?ı
'Èúë_ú™v„ZUúÏôì¸ÙEßmN+ŒpÇâqOM&∏>¬xpø_ì·®∂Rmh†ió‘”πÑµg=÷ıR‰c¸Ì?ö=œ™ù^◊¨∂Dùm£ôhÑ‘Îó oÖ(âÎÄÚS7Yu¿%BèÖMhø´:Õ≤Ÿ÷¥%iÕ€[Ôçg{≥ÛÛÛõ`
•¢Lﬁ”u¶/V‘ö≠≤up∏^‘,€<ˆkΩıâaú	ì1B[ß·ﬁˇh∞‹‚-±Õ8lÓŸ4n:1.·˛'iñòl„y‡k\àYÖ¥Ë"®IÊÀ„∆ÎVOïZÉÂ¥Ê|àZYÁö#™5[IWc” ÇQÁ∏tló¬≤á π.∑÷E“C=VÔA3Ü|πÆ∆Q˝\+"ó20fYvK◊Æ{†Y£óTãk,‚∆{Mß:GsC∫µWöZ)‰≥Àãà∞]2’∂πìøÿwSm˘ ∂@ˆ±Ú∏Xu´-k‘&…«:açM¨#ZM÷?ÉºÄ ÷´FAV‹D6ÃÅ=≥¬%ÕeKjùñt·ñˆÁT1 (zŒ4)± ƒi‘BÖGÚ¥Â∞œºäê D∆¬X„‘Õ•ÃŸÛ*8k8à<Æö~ß◊uƒUPÑVLány±k5£ÂJç⁄"áÃ&fÍ¯LRåÇ6C˝ñçmå›#◊9ä◊aµMHl6»÷D„l˘x˛qdÇ∑(y˚†Ô™¿®@êHkmÇV∫BFs÷ƒÏ1¯ü§òMqπîMÒ~C2EëC;ÀRò’˛¶qHÌ´ØO\D+v˚¨8¨	ı·ßµà≠i	•õ“ÊèÈ:OåeŸ!{ÎüÏí¸ò>ØÔolØ?Öüíg€œv…ÛÉÁÎ˚€ª≠Üë6!P},®3p√&óÎ ©`lv·Ù´»Û|ÀS5Ωd∆~ÚöŸ_0ö µ]?±<Fcû#≈ÓHN…l¿Øgâ—∑≈4BJ Ÿ<∏∂Ÿfãi8y÷M˝Æo∑ö$ÒI∫78< &ä<≠˜ãLû*úß;®f◊,ÿ8%ªMçÂ&Àf>∑¨„R’Ä”û4∞ÕÜS ô^⁄ÆÊπœôÎîl;”≤Ó\Ø}G£ıüY„òw¥<R„ë∂∏a`Â—±Û‰È˝e;Oéﬁ&5UT∞˘3»‰ª}©lî…˜¸‚¥å2ÔÏ1uÉxgè—ºﬁ{å
z	å≥Ωı¶ó‹¯4q≤4˚V√¬-1hóñ“”sµ5]≥0Œ¶G⁄ ∑†2\r-ﬂ~∂˛…÷9ÿﬁ1VsüG->¯b‹uébY≤£È+±Íº”Mn_E´ã±˙Å˝ÍâîŒ‰∞ê∫fé|b¡ç‰ÍkÕúœF~“û´G[G*g∏%…ÑÎ*ª~ÍÕ$,Å@#ı61À ;Ì9¬ªÇØM†R^IrÒ!õkmÊ Ì≤¸“H pì§„„›Cå9({Î˚á€˚‰gd}c<˜°<¬úÖïùEV®È•ß<Fú9
JxOSlPW©hE›˘÷©€∑íÄE¬Ü«Å9Ω≥∂k˚÷j&	¨8È≈#€¶q‹ÌÏ”x4Ñ=ûÜp± 	°ãˇÇ‡QbÖVHAOÈÈ8\kÑ™€´£+ a©Œì?¨ÊÏ,˚`©lo‚B‘`[ù≠r∆a9lôºé_Ø˛îl‡`™O∂4≠ªTÀÒ˙≠GxÕ	ŒzX˛≠˚jê$aº27wfıÜtn{^Ω{L3pËÛ˝m§—ÅK√∑≈Â´{§sÃ€}8,ƒf∏ôﬁÃ∞Ûö1QJÜ">I√B’~
ò˙ÀøcÏVî∏¨B∆OVØá·[Ä∞ìD£Lè2iDä)r
q"ÆúÒÍh·õŸÂ
Ωù8ªÜ/§ï¨0|rƒ‹Ç}‡;nk˝eΩxÏkµ∆´aÕ1∞πÊ«µ≥∂7≈Û gK£·°’“-ËûÙ»¡÷FV|¯¸pw{˝)àx?#˚[{œ—G¸ÄÏ_˝«ΩÌM¯Pî.ÏQÍMÚå˙#Êu—I 1#´)u@3,Ù_è=7Gvè‰3dêÍJ&áÚ“jOòO€ %ÚçÆæä>πvYÖ]¨SÍl˚–úõ`j`d⁄`lVüˆ˙4Ÿ≤€}Øø‰±éé‹¸È˜*´(Æ¿É≈F+˝¨ë?8ÿ›È¡®c⁄-ˇäÆ’@Iﬁ∏o“»æ∫»~¿r5vÌÅÎ9+"·=ÑÄ:˝>≥:<ZÆíN≤(t÷∫Gﬂ·/g·Ëå>Vë£–≈í¬ ÿ€=Ëm(¬Œh¥™≤*q#üEoÒû4_√Qf˛Ñ:#<uÅƒPG$î<†…#í«™Ä4≥N∞ÓΩxø7∞‚Ù˛å:@7}“rúÏI’Á≥—»PÁﬂ—s⁄.”˙zØÈ9÷¥-`ŒLÔ‰üÓk\∏◊J@1X4u»V7ÔoÜG‘z]?4æ(±J√yô∑£L ˙ –ÏãÕ&C|Q%xáÖF
àëD#^	o•w´Vig¬’mW—ñ0@ç›·•√æ√ñ•øa‰Oß“êΩ'ÇÆ≈¥ı≠OB›XTƒ;v=◊±ñÄCx$(«2<Áù,yïm3N≤úU]∏—î∑AÌ∆ÎŒ–ıK ÆŸ·6¶.ˆÇ(]_Ï°«Ô°gõÌå’@H±‡±¨Mº≥÷£xØπ¡Jã V¯- +d 9¢WˇPï’)Mp¨8é6x§=-Æê=ærú[Å‘î˚heål‡~¶!˛:ûÖt;€ar⁄KPz/hÙcx1Ó‘–ß|MÄ≥!22Ï˜©«jÎr2£î-∫£+Fi _)* K%í‘ì1:±M‰±Æ…ﬂzëäÏ õƒ˝Rmè#këOv•ÊÔï∑e‘H)©“Öi,]ˇ%≈˙«Åﬂ"P˝a;wcó¯Ïrﬁ0(¿ohqàGUëP'ˆxÀuX!f◊ä·*‚®ö&4à|Ï,∏té$0 ≤X√úπÖÄ≈:cÖq bŒœz"WT_Ÿp2–$ÅBòoXèÀÍ.O”ˆY≤≠ú¯eÑPó˙•¶éhoßíÎk˜n7ÇÿjÊ6“¬¢≤`0" Osè0l§ú #|ÖAd)yá?ˇy]k∏‘>Ëç6cSÿZ§”J•â
¨k	ËeŸòÊÇ/9∑{í §¸0GªÚbøúˇî!¢X2Ò.êYTºïÿRËdµÙf-ìèa á÷√BbL˛<ΩÅÂ
ÎØıŒ–FbÖ·Qí=`™ÒQ_y-∑ˆ≤1’nvAË√0O©Ú@GïJ/qè¬cﬂ˘gG>ŒûÕ`‡ΩÍ=á√Q_á∑Aãã≠œx∫/ÜÅ∞eÛéqHS¶¢y∏´=◊ça3V‘gzõg 	9bà≤#â õ=∞¢ûr»¿Ô|-VÿÓQ=Z@>aœt9á]kÀ…≈µ ˆl∂;’Ã•d¯,≠}OÇ¨ÒÊ÷ìıÁOè~Ú„ı√ÉıΩΩ£√≠g{O◊∑§’Ω§“&≥§¶ÌgVˇ{BtPÚS[™¬©Ö‰•;ä¨F7"”wø˛
cﬂπ@∫Œ©˝˛’W!$k`∑√÷Ω˙ìÃ!RY∏ï—++‚ºƒu(ûK ä‰^Ìo‡iw_–õ6Â‹‘ß0 TX √‚‚8Üo1Ç©ñß’TØ‹2§ÉÖ"47hA6ÊzΩ/=œNd£´oﬁ∏√ ≈⁄ÓG©nGM…¨°€gû∂«ƒ`"B=E≤ˆ’≤Gàsq	ÕÔÓ)<Ë·K~p*
•G˚≠∑À‰ıh¡.˘—[ÜU˝ëk•LÁHH†-åÒWø!õ)õ¢d`dybYa˝ÅAíÓ'º°s}>{˜THˇvvà¬ÿÂ»Ú +Ä¸±Íê¿Ÿë¨œjœSÀ≈E H£ÖDÈŸR=tcÊãi·[#)°ﬂÇL wnV)Í&ÒQhıõi’˜_˛Ú¿ 6¬ÉòÔ»9∞ú\t≥ÇÕF¬«Gp^F™xeÂîàπ«.~ÈsŒú(VÊ>‡Çn˙~FGQ<Ôø]8$√∫u‰Go∆ƒCÿÍG…)"t˘˘ñ—úh$Tb"àMz∆qÄM#1$%œµ%⁄ì∂Â¿‘[ˆ’7¿9]NÍ"ÀÒq—˝ˆP<F¨˜ÿª}"É∂A‰GoÇú P˚40‰/~C>°s†SbOlm◊á÷@û@É‰ [$sd›w¢¿uÙ∞Ü∑çJˇ(ë!@‹q„0¿É‹SNd s)S~‘n_»‚E€4/E¿J∂9ör¯ÕaSaZ–©ÏM‡SÈŒßÛA≠·Ë⁄3ñ.•	Já+·Ï√,9È…#≈Ú]Ù5õ=±:Î™cAï•YMæ°≥¬>G¡~.8ƒ¿˜R∞iMÚ°á·„ŸeÊIsø∆©Q√°˛£¡R≈âÿÎ∑:?T9™’Á±ñﬂîÔâáß˘Krò∞3i#GËUÕ‹jCmtåñúõñÁ1ö±öéBU‚ô˘•xhî2J?äÿ˛œ,díJKíÑGsÉ•⁄ﬂ™yÛDR©o
÷Äl ÏAF¥»˛ÛÆæˆ©%S5Lº(J˝´oÖûË~¡$z«‚ÑôÀ≤º”• Ñà±r%1Â%]π≠¸àg£ƒ≈˚LƒÀ}%R+:äl\@Ì’B•&=`≠ÀH}myoˆ#‡(¯˜f<ª@º˛äÙuëaÌ√êÚËÇßœüÌ¨ìÌ?˙√Á€[˚õÎ+‰`Î)˙òÏÓ¨Ôß¯µÆ¬ÂÒ@˜–Û,"…Ï˝<=rÌö÷ÜÀ7m/ì¬¶R§ÃX—èP"O3T';L$´b[‘∫¢ÇÕ)Ø˘aG√Íº»°<ªÑaDA8ª0∑Hfô„«9ªQäZkÏA‰%æﬂ‰◊ËØQ´ï◊À√Q5è•Píòß∞ΩGƒ˘(lﬂÙ8ÑìN.zΩñjƒ¢ﬁrıÄ©Ÿ˝OUp˘∞“ÜY›eEIdo»|a~Îí+a5˜ü
^Ù˚Sî<Fè Ïüíº!›{ò…&¸≠⁄»ªáäÿCÙIîLﬂ0©—øØ9ACà”¬"_∑<ß;±Dxb“Ω(ùØâ%óı9såÈQ
ƒ√cJiÏï‚ÈB´xä	Ûs˙…ÿ-ßp»$Â∂5†“JÍW~ïÖà7ûPØ‘U0≠:≈~ÚsÕµ¸–ó9md_€<ëµÍ3‡•_ïèE¨Á#–,0_*NzX8•ÌJ_c'ΩdÖÿZ1õ9^º*g⁄ gIQ%|°Ï≠ØôÓﬂ’´√óOGÎqìFœı∑ ˙~ò£Ø∏…C˝”m‰a5˛Q¸˛@Ø2^xË\iÜÅÑª◊È¥s˘™}q¥M3â2&…™Iıe˜÷D–#ﬂÜEÿﬂK–FÅ È'ïP;§Ç·ãÌΩ÷å·b&i‘≥Ë~Q úêÉ¬>1ºŒnqVT¬º~ﬂê\òÃVª‡Æ9¶MîèûuôÍˆçx ˚€∏~*pvå2R@;,ë˝ë| ©]ûº5®„éÜr‰`Ö∫.≤l˙äÒÂ	ˆÒ	”ƒ &–—ÃeßÖ1∫u €J[5%'lOIX	´ù}–îPP7ø¯N¿]˝b°Ëƒ≤+2ÛÃ∞–Ad¡c+ã_}√éUg∫n§©_#!Ω·ßVª≈Ê÷˛÷∆è◊W4¬_§∆¨í›¥‰ˇ¥&9FöÜ˘r%TrKñc¡0µÂÚÇD±\'Q∞2Hí‘]î◊≈≥eÅ=o¢„›HQô≠V3öä^ÉË6t}‰@ã:®æºHΩ˛ïãS#7ßöù∞Bâ—V2ªX¥º K8ü‰√ëáVV= XµF…¯‘≤ó€jï+qb4¨—iïñÛ‘Bé÷‹y®v”Ñ¢U{=¢F;tY®‚ò•9è¨Vg]¡ûTÎ<˛˝‚ú3A*+«C~Kkù“¨±«≈7Bh˘ˆm˛ÜÈ™ˇ   ˇˇÏ}oo‹FöÁ˚˝ÂﬁÏ¶Â±ZRKrlmd£#uúûë%ç$;ôı2’§%z∫õí≠?÷Ë∞˚ÚÄ[‹Õf±,òÛ·ˆpyë{ÛÓp¿—7ôO0·ûÁ©"Y$´ä≈n……dLÃƒEã≈ß™ûøø_˛œUïñïäñD˛›…ë¶{Â$Ù^ÅπòØNˇ@˘ƒVËë™πÀÕÖ„{ò)mc˙pø›zRÕ^y}Ë÷£ ´Êa|Ft–C/¨æShD.:ÌíÑûet.YT¿ßë©“¯≈“Rﬁp–¿ã(",ºÂ’?h†µ∏ÙÂÏµ√?ı¢»9ˆˆøÇY‰%^ÊÂJˆ;∫óÕŒQËái)º-wåS	≥bº ∆≤ØÑ*–kPf‹{KEÙVGe…¯G´9Ù¢›≤ä∆,5≥— ˛|‚√¥„%≈ª˛óäEÆZªüâù€®ŸÉ¶WL2;ıaG¿¯!?ì‰ﬁ’S˜R`¯Ö’:¨à˘öïΩ‹•e∏ÿUÇ§∞UﬂÙD~f<ŸLN¶’≠≥˚ﬂ⁄Ãk~ıÛd¯Gú„¶{œí∫™€¨⁄@UZÈR¡…†öQ8=+ÇﬁxÃ¯>q∞@5¶,ÈH´ÍDËî¨8ì‡P~ü.?cLN4Ê≈Øí◊Bé•ë…™4®yjÅØ–.‹¬ŒSÜ'Ï“±?¿∑’„\È‚@˙Ä5<≈ö©>-4:ÚÑ≠ääí¬7„ßo∆Ù¥;q+üêÖäqŒΩ≥æÆ*®íU	nv$Âp˘^Û∞GlÒ∏òˇrÃ!,›jeÈaMπø>À ~¿JıÄ¢qÀwk∏‹
°tﬂ/’©fW†»+‚y}/LJª∆…®Ñz√£ÏóZ…≈ﬂT‰rR¸¢ò‚•è∫ﬁ …rÔkc≥ﬂàâ#µg`PT\Y∫êπM∆YÒ ißTU{á¨«Åhª∞’Uk3⁄‰]89'IöŸVÂ»µx)£§Û.Á∫®ö¬aˇûµ0©≠±l-##&GY¡ÁaÈ›H¯¸R™≤m∑+iÉ˘e7˜©3W	)3àÖ“ﬁuIK⁄≠µtRß¨£ÌxLÅú∆0±ã ƒâ—sõ∏πYa†Ò#W0=‘(ïûæóîpù>Úˆ¯Ksn7]√@É˝;xE9aè˛˙/EŸªm/-‹ƒpŸ˙cÿ≠ÿÂyTM™˚Õ⁄Â…aΩŸÌ¢0Hº6KV^q+ß:ßYW+ nãe»“é8∏'Z<G|æˇ¿Êv?_	∆lf9YÌViËé∆woS”8©ò0¥C‡˙õs?Óÿ&¢TO≥„]Ã?IcHßï}){CmÁœ>P~Xœê÷ãÈ'óıÈ&îÕ’|>%’≥˛ë8^¿ Ñ¸ <·Á∑ùkó˘$πaÇÙM™√…1cÿ¿ +OH´¯Br‘ç3$«ÙÒÜ‰òaûMw∏ıôf?◊t—á:”.›…Fß∏…|ﬁ©g T"í„fÛaÏ»⁄h≤Oºp á^Ë€ˆY⁄ 3?u˛køt⁄MØ®Sf-©ë∂Ù≤”xÕ-Xïvö¿˜9¥_«“≤Ø¨u◊°kQU1®˘Ze˘#Œ"ò[ãuÓQBpaQzËVÎzËn∫D¢êF`ˆÔ<«≈€QNŒwERSaøxäa∫h¢y¿ÁlJ<ë<ÇŒWìÎo+ãa‰£ŒRXòi)Ë›` bJíÕ∑…´YúÅ÷D*q\J?ﬂ–≠˜˝k˘ÅT3,)¿`}'’°Cj¯â¨]:ˆ∂Ë*RÈ:«—¬ë„ÉO®&ºéìGnú–GºÎ°zX+j”ñ—îZ1’∏ﬁJUMÒ¿∏"˚ÃyÉ·¥~Çy!:Ç≤A‚16öMk∑‰4_ßt+ıFƒ†å\gºú°.ª∆óÇ∞ÆqèQıú‚%vâ/¥°BW∞kZ‘Ë…mãÙ©EŒûDe‰»Ìnà≥◊ˇÓÃ–6H√©Ô°‹Úæ8«ûÌmÕ–Ùpyr8	rÀªÁ√∞sù°eD¸Kq|‰ˆ∑
0X£mÜáîr√Â…@`”?bƒN^cdÂ˙£Múúr√üwÿ>áqö°aÃ¬vù‚'=†≥ÏsÔ®°Äï–_Ú ,,CÇ_ìçèzæ´‰†ò©xhﬂ¨…gR¬Àü]Gã¡cjZrh¥÷1ò.ÿ ˝˚&ø^Ô9?¨ΩW…QHﬂ‚*À»E<8û Eúuv$<‘ª~UÑ/”¨3u†Ò(/®ıŸ`ı˝…îå· ã•jöf˙Tö‚Ws”<∑û”ç∂ƒóº˝[’.io∏9`®ˆé>Î8#‚9ı§Z©_≠£‘◊_!òÃÓ¿€wNΩdπ°à‹=¶∞jŸ 53Å9(¿T~Ô˙Y¿ˆÀC·˛x„ƒ_8‡⁄µpâÓ	(íÆ√≠≠Ñ◊ûï3ãPΩ=N∂§±2∑C˚dç *µ∂¬ií€€ﬂÀ>i;%ni"|1€$ÿ@≤òAΩ›]SˆÎ§§ÿ^Z]Cô69FP<}Ut)„E˜Õi1‰˛hí€cÈæ£Ë∑ƒéôÇ∑p∆Íbﬁ);≠su‰ îu™NhAÄmá∏1™[”btU¡‚¶M˝≠¨=µ˛É=ùõÚé,°U™ß;õù-÷{∫ª◊›Ô=«W?>Ôu?Oh|%2›Œì8∑Õ˛vgÁ)Î¡Ÿ≠ﬁÏ˙¸y£≥˜§√∂;ÿ–ÓˆI5KàòeNÂ\àµêY+œ1≈dÒ<9gI_x?√ønå·Ã$D7ÏõyﬁiTÒ≥p)a¢ úwΩWŒdó‡
•˜œåÍQz?’	˛m;ÔUPJ[õ¸ÅKi«˘º·ƒ9Ωjπ!‚•· ¨Ê9:¸ ‚I4IóIåI∆¿Fæä=lüûßŸÚXè◊ä‚`åt5Œ±Éª[~ˆ‰%ºên<»™]\ÖP©AùU, "óŸHë¨ÛG´ÛïÆ∫L	12ÔfŒ√i‘IA,6‡Õ'§Úú—ã√¸1´Rπ0Ù√T-¸\˛=Ëœ¿?V¶Ø™f≠íG±?E˜ºnwÍL»6DP€Œ©3B®E‚ 
&˝Eï"aTπ»Í‘nΩœ5¬bπ≤VÊj*‰√≈EÉm§ô€e—B˘∑^¬“Àç?Jöz˘[mx!dñjÌ‘z° e@˘¥N»´N∞9r ;[¿<€Í‹eE"]®\¶S
©Æ»—Ï.‹«5∂-MÆr±\¶z¡ÚRé¯Oüv¨7´‹§Vfb˛„ﬂyì˛¨—ç8=≤!Ë¥l©≠vıòp∞ˇÅ·£Â5FÄ⁄ªAã=ãåôç'8:F–v7X@a4bóÅ√Îﬂü˙C£T‘ÂEÒı€ëÎÑ	ÂëCºeŒ$tt,›Qi∞ ®cô·)OvπÑ£'¨7bkÑn¨rº9úm´y3µäÁxr!‰iZ\côÆÇ2Ø†ññ÷I’L˘hUŸ∏*€ÕjL°nPÆÙõ€e6X8,õ^ƒ%.$Q$F¬é|BE¿¨MæÂ© SÔŸé8±HéÊ£8©õí^Æä≈¨¡¿05˛Çz˝àx0õ£∆,Ä7
/¥é'Å^8<ƒΩΩ°s¨aÄ≈.lı√ ävBˇÿ¡Mgå.Ü¡$“PﬂõÇæ7“àV¯¡D—Ç3:uêéÕ˙´õiÏu˛÷lL,~E¥∏¯¬N–œïwúxò¥"n·øÓ·›çœ‡ûﬂüTB¢á≠Ìö∫HîßÒπéS<!>oπ°s∆øÙÈ[Ñˇ≠e‰±¬7<¶{D[EFi„%@˘≤`1g_3ä˝æâŸ]	èéüÖÉÏ•„`”âùg{[ÕÜè]ÄÃÓE1E0D≠ˇÃéπºªÎ`"\/˚ôu¶Î8%?8¸‡!ÃZ£‡ÃùÙÓee√ò5å‹≠Ù™¶´”ﬁÓEÀÅ›b‰n Ow€©~ÃG˘ï~“ïzCX≈-¡ó◊èêª¥)ØI∑EDIèÃn:Œ‰Ù›[ŸÀÄbïàõ‡WJjLwìõ
ÿÇMse¶W6®®“nleÏx‚";“8oôX≠\Oûn∫E∫˙=5—÷eÒıï∫o±¿N5F∞†lJ|í,‡\J˛#â⁄h*ñ…Y&ªq™'˝©5ÀÂ9^vìÈÔõz∂€Õı©gz~¬66≥…«IÕ»}#çZK?‹FQã¬~ç√l…∏¬ö ü˙çn
°î'm£K¬èºïa–GVS¨ãOñÌã™fZÖ—–®o3ÃÆ}[õe}U´ê#∏Èø	Â;ù€!.€5∫x^ïH†¨–∑MÛ\µ`m(ÿdúˆhØè?M∂¡˜õøGˆ ˝ÿAk“eËg)	
ìŒŸ¡·-|IƒasL€SxDÁóJQ¶qHµÏâ'sô¿OÊ_¨,¢;∑8ówrCPﬁ≥†∑K-ˆº∑–a›˝ÉÎøﬂﬁDñèùßª[]8’D[¥ôÊT(EZ≤MB™Õ(≥X«“D1yb*£©G¸ö˝‚:!XØ4À¨bÎäËànÛ-ÉÊØÆ¬ßag¸˚GØA¸Ê15’Å±ïñb‡ä©¥@g°;ÉxΩ!|§ƒà¸{©D}ó2T¨èh©Êdñ)x–Vmæÿ¬}]Óç%Ió˙ØçtR∆ˆwˇÒsÑ8Ú"∞O\¶Ktv#J‚DÜEJOç∞ó`ù:—cMÉª–·+yQ|Ÿ`Z∞IµÁ"	pˇì}b=5µÈÑ°§A‚’ (‘äG*cÍ∞¥ìı`≥[#6≈˙	ΩNPkaPMq¯ﬁßª;{ùßH/¥√6∫[œ∂`!Z ﬂùÌ˝ﬁÛ.{z˝ıÛﬁk\øÖG»Rÿ¸òÌÉ~ËçÊ4ôf•eÎêõ,âî%k©ÅaL¬∂Tå‡Âp‘ :@;QJyóFZöt"fû&Êdò_ˇ;{¿Ùîº©k∏oqïá;úwéú◊Çw÷Gb√ôåuÂe\5Ç®O‘sSa…◊|[8ÂaÖºØ‹ºíÂ„πÅ»Edáö[‰X∆®©¿[]¸+¸∑;6œPK¡ö¶!àÜñêˆ0v∆¢ÿ_ÇN^4ﬂ<€™ ã^ñéò:d´≥˛h§ƒŒÔf&ˆ]MUâC‘@U˘DÛﬁ)íñöûÈü ?«û_€üêÍHQªW‘ø˛˝ÿÔ;¢2€B'ˇ9πˆÕY†⁄ó9õ Ú†ÕÕ8X«	π˜£ôﬁ¨‹}=Q∆`ì«bÿµ
.∑.ûÆÙ˙Kmú!KÇﬂ/}◊e´ÁÍö=¡fœ¶n∂∏€À˘ñ“ræúæ@Õ?8tÀUôæüF‘uâÈ‚XÒm˘≤•_Ê¯ó™‡_¨Hâ∆…±9!™^7°¶'7ÁH¨I.Õé#\À‚≠}F"˛£n∑p;Õ8e
+5ïV<‘‚G“~¬ˇ)ËÆbiëWSÍc_ºıKsb+Y©ËpF~f¨o∂[m5∑‚&kXc/?∏ÃçdÎ¸ÍØXÒ‹≈’_Ω¥h◊ºÈCÊ—Xl-ÆFÃÉ/9Lbcç	±§‘oz1XÂ^≤c%¢”w∆Ò$tÙ√™M5*%ñ¡~»eπ ¸—+±µˆ∏∏¶1’ò´[Uª•ﬁ£gΩãñÁ∂v≠¥E‚Ö†N?¥1Ø0dwÄ2≤∂Cú¶AU{b¬[g^ûäÏJº˛ˇ	æ$ŒA™ê‹ÉÎÃﬁ{äù†È'/z±¯eı]Ál›(ŒÕ&µ÷‚±_ÄöÑ˝n!ú¬h⁄Ùæ‡S≥•≈≈Í'^‘z‚/í'∆¡8} õY<A≤Â˘€4/$Ák ‡ÒIlÊ‚=Ò≥?j¬SÓ±Ûπ9ÛÃø0›}aæ€òÄ™_ÑË=I/yÔ%ÔùIûA◊πM£Æf¡∞“˝¯TAy)«‰œ∂IÎ»πÃÜÚñg‹Tç
^&Vüú∏ß~‰–†
bGX§∞mìE‰ç$Â/›^ç:ùºX≠†›á1ºØ2è
6È Íjñ9 ΩÌÔπö∏:U˚t@\‘:\ïæå˜UÈyÜ5πéme2ìt›J€™ º®¥º⁄ú‹Ÿ b“Æ2UÑ]—d≥öFi◊yñxÏ‹îò≥LöA_‡ŒòòjÕÛSmÿ9"üÓ<€Ô"»’ÎÓoÏıvˆz;¨âV§üBã
Ò√«Hßº3`ëÖU'òDû≠sRË∑Cwçª)´–é*)’ØÕ“øHÆ…•B¨¡9I∑œÓõ¸Á√hπ'w7÷@D"ˆÛ·÷rëÊCâ»"Ÿp¢ØRÁü${õ;÷Öªi*geuDßû◊Ìñ‘†ô…ÄAè–jπ~#;Ç—S:KeÚfU…T%%Ãªï/U¯§ˆfQË@ù£¡…‘9v™ïA{“Ï⁄E…§7’÷ölu&Y<§XÍ∂`Ó$§"û˘èV3ØÖæü’;µ W≥lˆ’®<5C˘cOM˛úy7Ïﬂ9◊
8!ïWâÓ’ı _%àÆ§‰˜\Œ™‡>í(πJâ %èßeqë∂fL°çÈwg\.◊|≥Û$¨G)ê#7–m«∑^#YHâ–‰WÏ˙§hóÿìÃyjò-¸P√8·∑Ê	VßWçûhûH≥¿ ÛêÂ{`‡ …éZ≈·∑|q<©ïbßÀ≠%’µ•°,ú0óŒœœãS¯owo;˙>Ènw˜‡¸ngØ#WôÓÛ™”ÌO{OûÌu6z◊_o≥_∞ŒñînÙv∂·lT*,≈ê˘1∏TR™/$}”„·√/ôºÁ*ãJÛÂçÊ¬RQS˘†TI*è_Æî15ÌÚÇVVˇiQÊÂô+I—•Q¶∞¶HŒÈ¬x]Ar¶≠0*‡ëwÙÅÌ#Îâmã¨öBBCy>?uŒ˝!<¶ù¿‹W¿®ãˆ‘Ñí\¨z≠$û%s_ìXÚ•f[p9'UôeaW
©y.÷?"ŸJqrD,…≤ˇM_t%J-NõûYÊß©ÀY*KUDEŸ>mÛK
MI\êLtuabi´.äËRÆö2¡sEC&Má‰g⁄πl»jÈÕ◊\	›Zlói
›
‚8ÂzX‰Ñ„AI∫U…èÂ/ÄkÀıﬂáûìRZOZ M˚˙Ì√ËÊG$÷XxƒØ©MB	irqy^ØH«>ÁKXÉâ!#«U ãó˛{õu‘%xL¢§VıO—ÍÆí∆˙ík¨–ˆDb}5WR2ÚZíï¢O
æºÁï’SRKq∂¿n'-@eç¥úK¯f àè≠≤‰|¬ @ÂO5ƒ√JÇ≠÷/
Rùñ¯fãõ∆ÎYîd–¡VJ+ùéõ€˛Q∑æè∫ırŒWoì+ ÷f=Ã≠~ÑHßSG˝“=!8œ[´e86◊è1÷]œÑç}ºŒñj¨Ü|«ŒFAd$Ø≈◊$ßyzN,~£ ∆µ08ÛT,úÊıSø`¬Cû±ı∆ûÁN˙æ(∏4œ"ºd¶πVo–TgñaÚ`?©∫PP’	ﬁ`$7V9s:˝T≠8¯SÿˆÆŒ˝‚ ¯î?jÆﬁK0)≠Í—:[˝1Tá˝kâÍçÍTIßüStE.ÃH}¯3~ı%´Øä|¶u¢ú`j˚a´`@sÍµ›∑*~á=ﬁÿsBÕÿÀÁlVn¨Ç	∫Ω√3î˜∫üu˛v<Ëm¸¨{ õû°áõ£èﬁP◊ÏåA—ö¬ µ¿+*n_´+ñ"ì¡i4&Ω˛¶©GQŸÉ`c8	2‹óïOÖ Z˚¯dπLµyl‡∂|òC]”)Ò:Ùå?¸Î«B]V˛+≤íûTó⁄«Ê˜ø) >^8Y.ıZO_ùcCTë1Û0q,'O∆£G∑†gÑáÙ«Cò8·ı[åEË˛)ÎxAz«>ïáÚ L‰Tˆ8kÃÄBJ>,π7πí2KÕ¯#–&}'ä%SQπ|È*y û∑5◊mË√à8¢:8~Ò	Ühﬁ7Œ·Öy∞∞ÙR‘çRÁ¥<)Ç%]ˆ¿∏P±U™¯NˆÚ7Usù‰â7^Ø±nÆúí9ÓÎâ`«éΩë◊«T– S•©û' 2j” d|¨W$V∂Ä]$–'òb0âVä*h∞‹N!aó+cW˙%Dh¯ øµË¯M2›Uà)•-ˇíf–Á…V<“`ä·E)£⁄z©v´ÒjÑ.Ωƒå bÍ¥W⁄£¥hM¨ ç_°<òÄ^¬´ÑrUÑP éíõz≤R–=V’(¨π—!rvìRÃ◊ÓL0˙¡ £‚GQ¿[	X‘“£©dΩ-I@Ñè;ÖÂ©á˛∞9ß+ÜŒ’5Ô¬∆Ò 9¬{∞8$˚"õå≤˝)›ûtEŒúb]âè§ÈpXíE]_ìÛW"∂∏IÔGZfÀfH"c™¬Â÷¬∑·∏‹ªT˘â&tè∂}c>∞†8icü‚è[.DF˙ãT_øå’èbÖA›q û(X§”¨âv™©¯	VÉb)V
$Cá†ïÈTL ûˆÑç≠C·∂Ωß"⁄'∫[ΩßΩÌÏ˜ç≠UgJ¶Ë£`{â>?ãºp#Ω7jõ?ZŒA•!§äª-
€EπUÜÛ,N`|sE9ù∏Øƒ-åæôzr:—IåkØX„n¿î”õlﬂ˝G6ã∫Ëèed4}¬√9x≈íÏõ∂›∫®<ÉD!ÌåÔ
E	Ìä,7y[=uâ∂f~	‚7Ó∂Q,óèYTD(ÁÑYäK÷ÿK‘Ú#ˆÅ˘WI#ë]èLP'Ö‘	0"œ≈ƒ	ÚæáfÊxÇH`ú∆Å≥£Õò¡PºÚq€b'~Ñ©3N 7
N≈˜ªê[¥ua*ï‰Q/™√Œ$V‹ÍNxooƒÄÕjqJï¶Y)3í˛“∆“’‹⁄¡Ô†¬»‹$¶LΩë<É]:Èu&Ú∆Ñ„¶b¡}P˛˝FE˙9MFI1ÏB!•ˆJ	c$Á=ó»u
3_ß®ß¨*HçLß’‰ÛµÑV‘{b°ö\UßDË9Ò‘ﬂÜÜû¢ˆó>˚	[∫jôèyntDë&Ì©ÏÀ∑ç€&+(õ Ô≈¬˜V„ª¥ΩsØ?â=ÒAhÌèöÍÈT„ÀàEÒæå8EgnGﬂNÍÃmÓ˝ÎoÔ%ZmÕ°s˝Ìõw¶uw∂Èãﬁ¡Œ~á8ûv∑˜;?Ì$…≥."§|˛YÁ`ø≥ª++ﬁŒˆ≤Sœ‚ds˝	™›<åÙ„Rª˛yYÛNŒ… ∑L^?µ˛MºU~ÿxﬂè^#†Ú«ﬂ˝Îﬂ±ÔﬁvH£…¡∫ƒ˘ü	àÛñÚ-xi6î=¬µZ÷€=xéJŒ	¢zÉÊrÄB∂?;§?^?óöC√7	î(¢çS“´Îo#øïM0Î«>r"ˇx‚+9Üﬁ(r^„}«¬ı∞u “C<… 9u“ >‡ùcÍ≤h®ı÷:å=Gaπà¬„∞’n9¶	ÍË∑œÇ‡9ß˛1|¨ãK∆GÅ∫≠≥–‹g™ı‹£_Ñ€H•èÇáPLòü":—1txòØ;C≤o≈ûXFëDÌ"%Æ‰â¥
Æj∆¸äü¸±∏Ê'ÁSÂL^J•ÆjP
¨∆%L¸Ã‹–h˜ñï0∑/í,ê%kÕˇ0UÖPŒi©â°”•⁄X%zÇwg4∏P¸I2URYÒ˘”@‡  -±8ÆV 0331
8e‹OÜ2•mıŒcÄ≈◊‘˘‹ÕûtÒë›>Sä÷”Íj˜ˆ'ëyéõ¸®(Ò∑®¬o>ÔÓt∑7z†¡Ôu©@Öm<ÎncÓPoØªˇ~≤µÛÛg›ŒfGV‚£ì‡lìxh>¡ÕÌOUâˇA˚Œ50£vµ,KE»Éì1}S~˜ØÂE]q’J≠?Áæ0*“Q!<∂y.º<X¸åZy≈ﬂ
R&€ÂvŒâï“xMë◊ò¡HH®!KÄ…vn˙™.*k1Êb¯%-ÕRıèÜÚ≥Ô+6Ä67⁄E⁄LEß∂Éb™*ÛòRjØºEF∞$˘nÒs+|c„ø,qøoYûx˘¸W¶ÚPvJ=∏7éO[∞´á|Q	Z8–ÆíËÃÄÎÄâÇïVÖ&≈ûÍ6Ú&q2#îÛFn⁄^Ã¶î˛/K[|ÚëGh>îË◊ˇ¿v1@%o<˝ëˇe^0n#
?8&8Ë$!É—Ò£é;ÙG¬xDÍ[~ñ≤ı"8Ì∏˚’ƒ˝”%¬ÄÄeKéCˇ‘Ä! ∫0ÜA–ƒå übFoÓ;’;ˆ€ú=W\µ‚q€‰ÃÌƒ¡{£æ]Æ´®Ç◊U∞Xvcg{g´#¯\;€õ;˚ÏlkÁ	€¬:ª=ˆ≈F±∞∂y‚Dª¥"Ru≥A≤ﬁ∫€òcø˛u˙Ë¬5¥ô/·Õl#3Å'∑û√¶úª¡èËö9≥FT©k®¥
ÙµY¡P‡d«!ï:Ü	‡G¯” Y±¢	–¿æÊp3—©\,◊¯«†å-rdù≈s	˝VÙÕ«¡|»^Ö¡P‚d@[s˝„ kx`æí4,˙9ŒÁJ~√ï/Úñ*àœπ
b#“ÃÏµ≈…˜∫°“bÖ‚ã5ÉN{¢!Ç ‚ï≈•±∂G"Õg≤b€/´UJ≈ æ‘XBtÄG†8≈>˛Üj&óª∏"Î@xÍ#îY‚Ω¿´ï>	·¿ã0ë–?Ú±DFΩ·8@ó≈@ÒZSó)[âÌ
,†ß˛jæ<e∑¶FÚã≈¿˙zVj÷ç'±÷ŸGßˇQpÆÚE“ﬂ∞∫«˚»éˆΩ1ËúúCÂªQÂ¢w˜f	È‚Jésy.áÛ¡hp"QÆùUB Ûjq5Hù«Å”°ŸÂ\„–õ…º˛V?¢ã≥Î¸m6|%_
ÖÔ;ØÚ1…ñ$^ƒØ£πÊºäë"X¬ „Ã€Ò`Mq›|ÈB≈ErÖ5„ß˙D£˙·á_äSÈ˛#z ª–ã69ˇ=Bî⁄‹ôÙm—å…=)S…Â”‚ó‹˚ÛS'†∆ÒüŒ“ü
N⁄‹k…T§™˜=NMı2ùx˛-u_[Øöè+oÛ≈óJwπûÏtag∞"Í{ÇW´ÎF≥qºÏû˜a†eu"u∆c5«.U3±@øıYíUE[Ñÿ*pb¸!EÍÁ”™∞›(À∫Ãää	Æp	Ê◊“j]{ã^1dÈÃ§n4´*˝Sò√ôˇ∫‹&™ó–êàj|¸≠ê?UX¯pΩG9Lr±ES±√+(ÛL¸ ’üñF1}eQÅigÖ qç∫Á∞ú"‰:ªs«ø`/‡ÓñÔ*1™⁄„M/Ü-“s{x?ﬁ¿£†ë∑Î\ #€„VËú&'∑\'vc
ˇØÕ4Q±Ú°l˜ÊZö™Jáóö0éf„Ë∆g"2u,˚`ã©Z øGÕ&J˙ﬁÙµ∑L ]W>	ﬁ¡ºpD¡Û∞1•≤â•( <@9êÎUŸ*ïå¥2) :Ñ@˛ß≈∏/lHqp|<†Ωdû5yOïäô?iıFRú¸í,ÄW™1•
 l•˚#9tÉd´âÎ∏ìD&˝±êMê˚tÙÒcà&…pl‰ñ©‡Ù˝3>≠@ØÅ“’√˘iXﬁ≥ﬂ∆°2Jop∆”CTRÏØˇ⁄‚Ó‚dãIß–e¢ÁâL>ﬁj–È¥àqT∂ªVz/hŸπ¸Ω,ª%e"‰ì
 ùìÚ,˚áNö¥}Ò{πyÒõ÷Uú˜Ÿa!⁄|–n@ÆÀÆé|r,iv<^¯¢Õöh∏&N,Ø9NF†’VQÏ\¶Îˇ„l+XK7√«ÏÂ3^ÕºBúΩzâ_aóºËÊwÿ~‚í¯bCKéó=ORF†}÷ÏmÆ±ø¸ ˇó´9zà±µYô¶u¥Â⁄∏ıuHìOc∑>	ì•˛¥]∏≠ôãı{r˚¯{πm<˚NÊ¨ Ä?¸ˆkû<L≥¯Ìø∞ÓﬁﬁŒﬁL"hû–´y≥≠j™JF v˜üˇÔË?ˇøõò%∆?Ù1Å’1ﬁ7˝ßzïL~á\(¢Ù‡bÇO.ÎbU¬+·ƒÆfı,jˆJ›32∂C–º"òbCw-˚ïìö[L»Ñ…èº ˆu·º≠‚””gëÍ+cÙ˜÷√«-x	≤Ëç∫Ú©ä≈π‘9í¿d8ÑØd_ƒå›†zâf¥I•≈#SÓ´Yy≤√kEq0ﬁÉ±sLòÜf˙ùÏ0ß£ZZ¨?›ﬂŸnâ$éW∂w©I3ÂFÆ„ì¡¿˛Í∂Ì•Ñ9Èev£[pæ%b$íqıD˜Úa§sK∞0ÌÚÑ
∫mŸ⁄~Àéj…W%∆ä4ÿÍY£Iá-_W¡!IçCØh¯Ê¢∆íÔ2ı±ùK5äÂS8ÁÑ´n÷~\&ëbnpôgmÉaüåº´˘ëU
&uâ∏WìLztZH Úü˚ñê<˝ìpπzø1‡1€∆êsA˛∏wÜLö¯ﬁ‡ºﬂ™ÓºÈΩ°Úâ9kX*f®ÿ/îD•åG+n	gZŒ^NUi[≤j6o¸∂%„Wjì˛liMõ-_<,∂K≈aÒ6èãKíj•I˜Yãap∂	ÔÇß©\ˇ>K]a{Öµ•⁄;GèSÖè©Œﬁ]yÅ·
> i¥e©µí=õ‚&ât˜≤‰!'H/Q–:?YÄ™ueö5ÌÁ˙zAÓî {ià·lx§,
-	çnÈ]¶ÉÎo˙#ø—/J›µ⁄¯≥ÒØP¢™>uñﬂ©}Ãôé@⁄	éI˛]O+π™Uˆ∂Ö ´∞<
›ôQ(§¸{m=i˛òB˜îp4˚>G›Cî{x3êêŒ?x3ÚÒ$óN6£xﬁı£>£ü|ÿã··…x°O÷ﬁáGN0x$ˇlç9£ã{Ï¨ÁûØ¡à#§≈G)uw‡Û )ﬁ}ıË‘ÇWÏåáa¯r€Ä’˜ÃÊYk»Kœ0&[XèœÊÊÆ>^¯’ØP7)uja¢®ÔÕ_Q=Ω¶∫WsüˆU“çxÀégÒ≤‚TΩ(¿œÉ†"ämÃÖ-'ÁJ5Kπj¨ŒHÄ€WÂETcC≈Ù#πÿ~0pÜ<O4I]ıê•ˆ—»ãxMFYG√BÁu©F≈2õıæ%Ä1¨†!öÕ-`àpπ˝ ™>;©$)7)w<	EÈàß≤ÊN˝SU/≠RVsÇ0›÷fwãı∂∫{››Éù=*V‰I˛ÕÓfÔ†≥«v;øÿ⁄Èl≤ît´ª˝º◊Ÿõ+Vå=‚fÏå˝Ã ´Q§XÚÄÁÍ£aΩ*∆§ÑÕ1QßH‘E/¥üª¥˙E˝™Å’|’ Tb˛ñHÃ/π§Ç|∫Ω∞
"√J1Öæ›gûÉ}©¢õÀtQù?*øÖm&Ö∫ ≤»îÙ=Â‚∑o>ˇ®‡≤»∆ØHQ§„T€Ω˘Æ6Âÿ2%?sbìé¡ ó@GpØ%ï∂œ√<ÏX†c0§ßX`Ö`∆ú}éA8®ÌLª¶Èÿ7xb≤ï‰ë‰“–üfÂe˝FLîAQ˚ÀJeéQG†&Úäçqíô∞¶Æ4‘=?ıÈ\úû
∑F3,,ÎÜlmjºÓ|e.V¶âg® 5∞56ñ´\Ω¡&w–›ÓmÓXæãáŸ…=•[ª4ÁY—⁄ÅASæ+wUw9£'H- M·Áò[”õ"óØ£`Ù‹¯.m§‹.Áõ>rbwÊEÖâ"Ã,ÍhÀ∑–Ö`MŸùä≠{'ïÆlz9}§ÊK¸ˆk˛˚>héÁ~ƒû”ã®)≈=Vîk\;&Äó≈≈GI‹ü*…(%@&tıSL˜cyv
µÀöGdènûÍ1ç¥U"ñ :w‰†ß˝¥,+zLqπÑ"…÷¡ káìV˜≈Ÿ*•¥ÙÛA^{ñÉ¥&9;P*Ω◊‘#(™ì¯©Ç.ó√≈)B((^"BrQÇ§[ø§ÔÚõÍ¥∏äı5gEîÄ¢‘ï„Ñ¯∂ºéﬁ%s@˜êºZVXÙÂö¸›?æeﬂ˝«œ'◊ﬂpt‰àqldÁ´…ı∑Ej•"ÖœV5˝áø˚lˆ@¨nÒZ’°∏û^uêíÿì$˝èñG˜foqóú¡WJZdPçzmˆSÆó4j•ãöÜp!•C\⁄êx§¸&bÃ„∆>Õ˚ê*\CÔx@.¿r!*#„T™ô;‘ÕTu–Ë∏&ŒÈù†uJªü}`_X«ÒÈ¬˘ƒ#©k5ÚáìutU·∞·ÊÖÎ‹¥%iƒ3ò¿ä‘:}¡ªRÉ!ÆâíaQ)X–¥·˜UGÂaªŸÕ]Øﬂ∆rÙ,;`gîsÑhuÍ◊ıâ˝∆Iê˜ÇZN4mªBøJ√HÅ&Ö§π•m‰R∂áNfŸêî$R…Œ®ˇ»q‚ù;VZi*Nt1Í33+è¢≈9Wé^a‚ZÈKníw∂.+Q9uP£∂F˙8ÚÎ—’Íz∂õ»,ˆÆ◊"Xvq’¿*_	˘z§.àL†’j’∞dÃ9s|˛v89™u37b%∑˙"?êD;—Â›‰&.∑≥pyç€ ∑‚•◊XÉ˝ÑUÈôeŸ3ŒÀó∂Sº<ï+]{Ó¿LÖÆÃÇPÃ Â¿…ŸxvTYÀ<±ÍƒÑµ¨i5ﬂ C•ºê4√¡D_,µ€_2áÄísã≠áJ¥≤™§áÚjEi¸úãQ$b≥.vÌ¢ï?;50–ˆŒAÔ”ﬁÜ ˘ÈÓÙ∂vÿÁΩÌÕùœ˜Ÿ€Ën=€ÍÏ±ﬁˆ<êS,°≥q–{û√1‰„∞ƒ§5QñEÄ Å¿\ÒèOb"Õ∆(¿√Ñu<&éˆ\u‚√’2(ûÃêPÌõ^.b≠ û˙¢Ï¯-põó
∞PP&‚[äÀ>˜Ç6W5‡ÉØ>yÈ#xhøl¿î\$x1÷¸ÕG√#,2f§ÿÂ°œçG#I¢C.*oáJ+T$ñ5¯#êä≈Í—dt’w∑Èä¶, IT	È≤»1›ûxßNRY0q2:çˇÙOˆﬁVm2iôj£Sö¨:öçraQÖSÍkñ®…5Â
£5çG˝A)%âèéDπp≤lÀ{»˚a1»á!cSë¢b!LÈ¯∑F¡(Ùë¡h‡¡ñãuÈÜÖ (Y^*;™*2¥ºJ˝D∫…Eº÷‹ZEá«pÕ!Ô5uñ∞ÚÒ∆);™Æƒ¶A5’—Ô°∫ßiùø ØµËUÌÖÇk3àk©ZlßùZMDhDÇÅÚ\>È%6ƒf˘}5z$¥“ãP[Äe&πYOº»Ω≤à´«—†ùïœ™ÈìÀ≈ïXG´Ëó$1‚Cf,¬æP›Ù.|s”\¬0r“÷ù™÷”Eı¿9j6»å!*3Sá4´£˙Â…Öˆπ˜¢~†í=qN=ÓGÚFØÇ>πÍ∏c≤Ω‡}X˛‹√˙åæ∂éΩ∏;«O.zn≥qüŒSCÛC∏V˜Zh^¶ÕÈ}‹È%-ﬁÒﬁ(û˚ﬁYÛíy'Œ©èÛ∞É >i‹„˘sx’õª∫A8q‘€∂¨ˇ(îÚÇ÷.ß*wgŸ¥I7¨DåÜv[◊s¯(©hYÔBÔdóN ô⁄L·]—YM)Ñn˝ë”ï=Yç„¶ñS+r˛kÏ‰7f˚ ,*«lÁŒfá5ëèÈy9òv˜∫œ{ˆãîåiÆl I+j-C(Á^œ]ïWU∆s◊)Ã–Ó∫T©åœCaYÕ’Æ¥ü¶MZí˚π§¿ò÷åí€m+”òj*πh;§›aü(ùå	Êë»€Mˆ¶ç‘°4l∆Õwo∑ÆøyﬂÕ	ZŒM§ÂºC¥Pˆñé1ë´†¡sÀÑk√ Ó&ÓLäª:ØK˝›ÏB
Èñ†Í´O‚ÙÊ€ÏR]i∫ΩZ•¯–sUø›–;ıë=≈KI∂6+GR´¬ãø\ZZj/≠|π∞™ç'„¬™%d-‡≈ˆYE5†\Íä	M>'/™ÈÚå¿î2((ºµ	@ÍÚä‚åJL‡<ûœœ∞ÌÖér^Õ¥"æ´q~∂ˇ¨≥◊€ôzúÂeV@#—Ù#¨∂Ã˛§«î≥ÉΩŒ~˜˙7ùŒ8kÕ‘?È°ﬁ›Ílœ∫fPj :˚g]{è‘çÌT £'≥ç‹,¬Ë&ø˘S¢ß[«£∂˙µ
MGKF“y·`–ı[v+óã™£ãZ‹3ıxBﬁ%…{¬‹Ÿb,íX}õ<≈&a·©Ó„ düü8q√Ã®ätæVa`∆6†Úiˆâ¡°8Cv	˜ºÍ:õzÀ5@ÆbbÇIÄÁ⁄>B„‘?s≈Í>DÔ4<V€ˆıKé°˝Ãó¥}ií⁄<Ô?1#∫@>!JZ8~‹:ÔN¬AÚÈ≈L|ºÇZ?â„Ò⁄¬¬©?û?èO[–´µãï’ˆ#©‡\g/Ô~˜ˆ3§°¯‡ÔÍŒ]v0·LÇ†FÍ¬·	l4©aû›%Á Ú? 7ü|ÆΩ
1Î°u)ö˛Ô~˚ø9˙ÂËnä”m≈±0¨›˝ÂËèø˚Õˇdwî«ªÏó/?∏î%ÙÍó/Ò¢˙ªª!‰„˙ﬂq°,e‚¬ØˇªKëª2¯≈ØÏ˘oÏnÎB°opÖ]˚ÓÌÃ*B¬ã s5`∞—≠;b£ 
‚Õ⁄üOº‰≈Ëp˘y‡EqË≈ﬁ»‚j¥^Zøó≈îRÄ©`ÜU{ëß–≠LíÆs)sÅ9s∏‡æDÒã@˛Œú÷–[Äq∆{[°„›˜öø‹\8æáÓ¸´«∏}¨p	R∏ﬁ≥Ωﬁà7\; ^ÛJ9jåù˘#78kco‘§CãáGA•C—˜ ü¶4û$C']ˇŸHÏ)H‰{ÉÎo^°	(U¥íP';á2Øv éƒ|Ö):íSÎæÏó<R7‰∑ ˜AµÚ∆›—∞Ò(:qBmº≈¬	c?,Ì‘¬;cÂf(ﬂçG¶ÙAµL	ä≤ee∫‰Õ˘Ô?ZÃêNYfÂ∑lf…òÛ-Ûgßsﬂ#uÍÆs#Ú˜RÚ‘HÑTA:ŸøÆû'~ïJ/hÓ+äñm\ÙU»∑ òö˙ÔìTø"Éj9ﬂ©6ßóùıπ§Ì:§jó~ÕD5º[ﬁ):´wù(`übâ±•´Yô"¢#=ïü[˛W™8¿y˜ 	D‰ƒ˚ 9!í¶Ùà7KAπÁ`Rﬁuâπ˚v6áÒ(Î
9Êô	ﬁ∑ƒN˛ è£´∆“Oé$∑'u7kÍJï…U
Æ‹|)O⁄D¶¬ëì≠,QQ∑5‘L¥äôêÑ_.usÇvÈÖ¯à´›»ø9‚k<≠;t¸Å˙q∏ñYá˚)¸»#y%®10∑ä/´Å…À†˚8 ìJ§	Å˘√:{˚ˆ#†.’√òÃ˛ô˙» A≠À©PS.CÖ÷¨õ.—ÎÕ∂ÏÎP5·A˘Uä_ç›Uåô‡+˝ar-˜\qƒ∏÷◊âN<7ø-+W¢è ÍË“¢ñIU•BÊ.zvéÙ–»›kYEP(1m’∆THg<Z++˙jÌ)wúâ{8câà	Œ´+Ç#2‡ú	ŸÜ3é'°clM«âgÑ|Â¥D'N!I÷†Î{wuóIΩM}8≠H¶êß≈ä™¨‰∞,/ßNêÀ ﬂFÆ1«ﬂ£«≠ãJ¬0~†7Ø”Á∑eÌã £¥Ô·9˘r§ÕzÚŒ∏»Såc¯ÂMRâî,XtdÑjÂè
9ûœ:yg†nº=:a„Â7µÇë(ﬁjR’Å¯Ø ^ãˆìWˇ¬Â“£¨ ÜMÂ˙≈ﬁÙù—©…YåútH$26¸‹[ﬁ‡”Œáü˜6>É6ai´s€g›ﬁìœlÔx1Ém#>ÅpêËgª€N<åtâ˚¯/J≤¸Å2Ã¯H¥`ñf’}ÈËÿ› ≤Æ>u‚ì-◊Õ¶8yWnnÅÜ%Œq2piV∞∆ï◊v˘GEº«#ÈÎ€éK˙“∞sws≠-$ü n\≤·N€∏°ë©ñ/>”Z…õY ≥∏+Ì∏µ8ã˘ü√M¢XÕ	ËÈÊ}€µôÛîºü€}5∏∞ÂÜŒ_˜`Ó›cãÙ?z’{uæTíÖæEûãIk˜W≤7âÉM∞õûÌm5≈∆˙zÏ7‡a≠˚´V¿äY“…w√ x≈{\|úUC˘jSyo´q{¯Ó≠–H“çœElÚPäã„∞ÕˇÜÓœ>ôªcÛ=kL`’—N(Ùbzúb€˝∆k∫Ç>ˇ»%“ÇŒœ
Â@åE≈r¡±ÕË/ºW**©6ÑO
È]A≈6´ªx+ﬂ`¶/P…FÎÛoa1ˆÊëø≤Qò8à∂≠∆t„8√(ﬁ¿ZåQˆQã7æ•©„#Ñéåˇt¢d)&@óÓ´kÿ ∂:ó„¬÷Ékkç˙cP4∆Y∫y± XfHÃ˛Z¡ÇÇ¡¶√1˚M¯|Î•w∫ÇılI æıŒ•‹{n Ω∆L∫>ˆUâ,d˘z3õ/AÖAÃA∫C/s◊¸¿\QçGºó€À:	]ﬁuéΩ#… ˆFaÙì` mØ7∫Ø◊RwïèiX™û`˛ïÔ¥¯?˘óKÌÂï’˚hŒ*r\
†£T,®ö-ap≠_∂≠–Â“µ0i∞ôGì´*r*(}ÔàﬂãÉΩƒˇ)LÈ\	5,sRÈP“‰ªW3O}¡Û]O[õyœ‘%ÎÔ"Z$‹p4FeØ†)í›÷ªmºze/ö:¨M9ºï!ßN^ø-¨h+œ™∆’„ÁNq55»5nÊÓ+Á4Ô±hr‰1„+;¶„úcö≤O"Ë®›«ı–BJ¸/,2ﬁü˝Îåπ‹4„p¢…8™@'öå]¯¶.ÆuËz´œ+‰åﬁ8Ë">∆+ºà˛™Ò¯â|«‡l?Núk†xÕ9∞Àz˚;˚§[†„Ky7X/Tãæ≤ÿ≤‡ï6k†ENjc—,¥‚ù˚H;ÓπhÎ oáÔÂˆ@DœõcçqKd˙.q$`˚“9≠ˆí∏¡C?ù¸ƒ;–Ã««Ïí¡@ O!]ˆ%òk=’w◊ÑØ]ùCJ1éÀ˜Á@Y<‚[≥}è--H±≤óY+æ]ıM<”≤p#?©øY —wJgÙ∑%áF≈ùR@|Å¡ëyÚ∑¡Èp‚cêÇÚ8/*‰˚ê"q‚n˙Eœ‚æ§◊‚÷SÀ€≤~'=Æ∏5Î‡0Ìb˙;æ üxÜ‚†ëvïZ1≥≥â;§—≠æGZAa]3é{îR∑G–èˆÈõßQQ´FJ„ÈG{â‘k)7JBòƒ˝ºcù∏fè-•}356BeL‹I?sa÷YMZ Óu\Æ/∆gÇI^≤aÚc’≠Uñ\‚I‰Ù∂ù∏∑ à^Wÿs+õ‡oû‹òË®8Ú˙f¥XX`Œ†OŸﬁò¶ÓR. ºmÂ+;“Uüº]wç¬8Âæ;vÛé¯{q©™|sﬁ©CÏäÙ‘«¨ë‘
Öw˙ux/îI‰xT˙˚L/ÛC¸ÏﬂäÔ %	tÕO!5Z¸“ÄU}	]◊A.üPçe∞'Â3öã9vbî‘ÿº
AUh äÏa¢¡ˆSÆ1ÍH‰ÖqÛØ/u*_4 Zçiπ–k:…»O-î9n<âNöºA≠z¶ˆ iÜ¥ÈO’ÍnS~∞ÊaÉ†Ôˆ„ ©n°b+m≥qºÏ*ø¿Ω"—VÓ	∫œ"±Âyò”{4`I»˚ìêõ’⁄˝V–ˇN(“Jõ˘≤î~™fË2òfóWs:óü⁄9ò:r√/,ºåÑhê˜*È™‹”{¨ÿ”µ¸Îi:Ãgâ3ˆ©~§Ô	≠|_j∫ô{∏ƒ»tèˆ&Õ‡ò¿å™|&S)|ÑÇ≈Ö%ë¡ƒ•äª˛Ê‹èM∞®&∆*7ë_¶ëÿ† µ∏pÆ±.%‰Tî1¯ıÍ•Ê¡8{ù·™∂Äı#cUﬂëA
˚•∂Î∏`åµ ©sE¢0*‰1üG≤#E$à›b.◊Õ’Ç(ﬁW√2Ú±eÜUíÀç®Lÿ˙√˝Ω»¨Båw∞maé+˚Â'ÈòCl;UëRˆbâÁß‰K“O1Û@Üw’ö°≤£eÏªä]n1^bSªÎ˙)wQw‘wéº7ÑïﬂÏç®ÙÔãÉÁ9x$n˛‹ É^Z¶q3Ùq £T´qkÂJ∏¡q
N[+˙""√8z^ª©]EŸAEAÊ◊®—xò`#=r#-˘·JÆxA]rß*`|ÚYÂf66U∫yˆ&GUTgïôÑenÈ˛U©Wú`juQMhI(Õan¿ú”†âÛ†4/e|™*|Ù›¬ƒIºÛ7WªQ¢wØ~¸E2\î§|VèZ8Õ≈6A9Nˆ\ç“´ï©UçLq˛Ë›–{Âø&˝ÊﬂÅEzç>\Gâª*á œ⁄≈G4Ta7ê‡±¯¸≠3˛/u‡‹6Ãvê5–$›VjÒÀ5πV†tR––‚Q'˜êá·¶+gì"qÌÑÂ8èt´ù˝∆∞][˛Û|ùÇ(+e˛#qæ§ˇ7ê7Ù©úc™ﬁFí˜'ﬂØ √ÛoZêyìÔ˘œKêª1Xó^Ããè>	b°ónÑ◊ﬂ ˝aÙNÑ∫¢ém·ìnF¶ÂﬂãÙ;i+%≈TÛ)hH’DTñ*vB>•MÌ(K§Ωﬁhr)§_îï”5L9ÀãV9ir:åd3˙’°Jm≠Ù@$QVÍ´Õ‡√¸vﬁæsÍâë∑ÌD§”'Êq¿dﬂÕMVÊ·—D÷Œèâı11VÜKÉDXÿeﬁÃ‡±X—x,úµ«lÀôå˙'c«Â÷Z—k±=ÓπÔ˝Ô˝?*Wì÷È0(„≠ÿè•´æ≥ÇœÅ~Û£˜R–Ù:ôÒ—‚È…óeVzbQ8rBÆÁËêœ0äÙ¡ı∑ÒdHzÙ≠™Œz±√Cß0„]ô∂åø›c‘»{˘œÀÏ˚ƒqè—” Å<˝SC“¸M	Î>rVa•FﬁÎ≠	k·,*Ç=å:ÛtÅ†Ã+¸√êhÿÏ)fﬂá◊á˙˙†œë.ÏJ«°V#¸∑«h~U¿gTZ™„˘ÂjÑ¢Uç™•&ﬁ°⁄ü÷Øºã®Ÿ€ÿŸ>|⁄Ÿùkùq≥È√;˝Ãª0‘ÀÒ¨¸^)‰#[gI3/D∆î Ê§‹DvH¶.ﬁπMË∏òrÕõ1Â≈kÍ∂Ùu …ÔΩ~)†/2‰oJó^©≤ÎuãJÚzk…ªi1P¨Ç0•“6R2≈krH…pRΩ~"õ™¥∏t)Lœ±º÷À8Î“‚j∆ÍÙ°˘!kÙ3_ÂJZQΩ“.˚MV’n^ªÙ°∂«e:ŸÏ E®R¸tE ‹˘ôg–ü”;¥dWx®cfØÔ£öÎêçê{ÖÌ?¬ÿÓˆì%~J”Íù≠˜çG‚¯*œv=ò9#gÄµˆk¶/4ß]ˇK'2%6÷8“ñßI®±£™ÿ<VÏ6ÌÑ—Å2U0‚ûÚñˆ4–úöébcÈöÅ†ÜÂ±äaø*ı?_K${^FªAw—ÜWøNV˝)çúO‚6%áhÅ{@ØˆqÉ<!AU 0„\;Mî‘çG‹iàÏÔ#é:ñıÅchõ7çòq˚∂ŸñÌ7ÂL$x!ãaOV0¯-qP‡0àº<˜!ùπüœÈ+˙ÖsÀ’ç:“˘°˚¨?ü¯*:?y√N°˘`⁄Ï;{ÂCÇ—fËÔ¿HeXc`jçC!ÿÙ^9ìA‹ú˚]≈?ﬁå+q -Í>lœÃub')À∂@5≥¡4õf,2ÜQ'(Y‹qz.˜¯[^ÊSÑÜ<‚LDCeák >híÚuﬂﬁÇ≤7µ2»•†≈4˚ê˛˛°∂cÙgQ≈>ƒw¯–|)«√ã9ÿ–xtZ?˝ùˇ‰|8H~E¢ä∆ÇQü‹Ñ,'í¨ ®|≥CÂŸJÒ;ê„wâ^b˛⁄}îj› jÊÇ¨s-©mÇ’õEb◊*ÿl€GÒÁ<Èﬁ™åF_¥4v®ùô% ynû)R€Ò∏ôdv≤yWÿ}ÙÖ≈Z–e8ˇP5·¸∆£N:HÉÅ‰Nÿ?=ê9_MÆøe;qﬁ`°w_P.ù√õÑNXSM|®‡êW9’4*Rÿò‰˝ÄxO–ÇºG‰˚ÈÓ÷Ñ[◊√2w˝ãJ\ÈcÇπ˙
ßN±)⁄¥¶.*eÏIËu9€Öπö∂Ö©[p	∂IÄï$ˆ∫æø[è>~˛≤Æ«>muIkˇ⁄Z±*;üÓ÷Ü‡f ©√ ∏ ≈ÿ ]Ω§[¢ÎxKñ<äÊÊäø∞V÷åÁãÅµ=†3]-Üô¢/RÉ,¨Ï[≈§&`≠På ¡ØÒçt@˜5ÒÔø˜•¢˝ß∂T(ë≤®-≈Ì˜K≈vêˇ\óä}rm.œ©tœ˚¨⁄í<ÃûUãCn?‘Y@0@~Í˛bâÔ}VmUVmÓ‹‹ﬂ¸≈’_¸   ˇˇ üa¢·