import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Pencil,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  CheckCircle2,
  Sparkles,
  Database,
  Smartphone,
  ChevronDown,
  User,
  ShoppingBag,
  DollarSign,
  X,
  ArrowLeft,
  Tv,
  FileText,
  LayoutGrid,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

// Facciones soportadas
interface FactionOption {
  id: string;
  label: string;
  color: string;
  description: string;
}

const FACTION_OPTIONS: FactionOption[] = [
  { id: 'general', label: 'Uso General', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', description: 'Disponible como consulta general en la Consola de Respuestas.' },
  { id: 'crear_directo', label: 'Crear Demo/Línea XTV', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', description: 'Aparece flotante al dar de alta cuentas IPTV directas.' },
  { id: 'solicitar_activacion', label: 'Solicitar Activación', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', description: 'Se muestra al vendedor al generar un ticket de activación.' },
  { id: 'renovaciones', label: 'Renovaciones XTV', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400', description: 'Disponible al gestionar vencimientos o detalles de clientes.' },
  { id: 'invitacion', label: 'Centro de Invitaciones', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', description: 'Disponible al crear vendedores o demos rápidas de un toque.' },
  { id: 'mis_clientes', label: 'Listado de Clientes', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400', description: 'Disponible como acciones rápidas en la tabla de clientes.' },
  { id: 'g3d_pedidos', label: 'Logística/Pedidos G3D', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', description: 'Disponible en la administración de pedidos de impresión 3D.' },
  { id: 'crear_demo', label: 'Crear Demo', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400', description: 'Disponible al generar credenciales de demostración temporal.' },
  { id: 'invitar_usuario', label: 'Invitar Usuario', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400', description: 'Disponible al invitar y dar de alta a nuevos revendedores.' },
  { id: 'invitar_cliente', label: 'Invitar Cliente', color: 'bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-400', description: 'Disponible al compartir demos rápidas de un toque.' },
  { id: 'instrucciones', label: 'Instrucciones', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', description: 'Guías de uso e instalación para enviar a clientes.' },
  { id: 'tutorial', label: 'Tutorial', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', description: 'Videos explicativos y guías paso a paso.' }
];

interface VariableGroup {
  name: string;
  icon: any;
  color: string;
  variables: {
    token: string;
    description: string;
    testFallback: string;
  }[];
}

const VARIABLE_GROUPS: VariableGroup[] = [
  {
    name: '🎬 Datos del Cliente (IPTV/XTV)',
    icon: Tv,
    color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400',
    variables: [
      { token: '{cliente_nombre}', description: 'Nombre completo del cliente', testFallback: 'Juan Pérez' },
      { token: '{cliente_usuario}', description: 'Usuario de acceso IPTV', testFallback: 'xtv_juan99' },
      { token: '{cliente_password}', description: 'Contraseña de la cuenta', testFallback: 'pass8812' },
      { token: '{cliente_servidor}', description: 'Servidor DNS / Endpoint APK', testFallback: 'http://xtv-vip.pro:8080' },
      { token: '{cliente_vencimiento}', description: 'Fecha de vencimiento', testFallback: '15/08/2026' },
      { token: '{cliente_pantallas}', description: 'Cant. dispositivos permitidos', testFallback: '2 Pantallas' },
      { token: '{cliente_m3u_url}', description: 'URL de lista de reproducción M3U8', testFallback: 'http://xtv-vip.pro:8080/get.php?auth=juan' },
      { token: '{cliente_link_demo}', description: 'Link de descarga oficial de la APK', testFallback: 'https://bit.ly/xtv-apk-pro' }
    ]
  },
  {
    name: '💼 Datos del Vendedor / Sponsor',
    icon: User,
    color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400',
    variables: [
      { token: '{usuario_nombre}', description: 'Nombre del vendedor patrocinador', testFallback: 'Carlos Distribuidor' },
      { token: '{usuario_telefono}', description: 'Teléfono de contacto del vendedor', testFallback: '+5491122334455' },
      { token: '{usuario_email}', description: 'Correo del vendedor o sponsor', testFallback: 'carlos_ventas@gmail.com' }
    ]
  },
  {
    name: '📦 Pedidos e Impresión G3D',
    icon: ShoppingBag,
    color: 'border-orange-200 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400',
    variables: [
      { token: '{pedido_id}', description: 'ID de pedido único', testFallback: 'G3D-9481' },
      { token: '{pedido_producto}', description: 'Nombre del producto / Chop', testFallback: 'Chop Cervecero Vikingo 1.0L' },
      { token: '{pedido_total}', description: 'Importe total del pedido', testFallback: '$15,800.00' },
      { token: '{pedido_colores}', description: 'Filamento y colores elegidos', testFallback: 'Bronce Antiguo con Bandas Negras' },
      { token: '{pedido_estado}', description: 'Estado actual de fabricación', testFallback: 'En Proceso de Impresión 3D' }
    ]
  },
  {
    name: '💰 Finanzas y Liquidaciones',
    icon: DollarSign,
    color: 'border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400',
    variables: [
      { token: '{comision_monto}', description: 'Comisión del último periodo', testFallback: '$4,500.00' },
      { token: '{comisiones_pendientes}', description: 'Saldo acumulado para cobrar', testFallback: '$18,200.00' }
    ]
  }
];

export function QuickResponsesView() {
  const navigate = useNavigate();
  const { hasPermission, user, userRole } = useAuth();

  // Permisos para administrar (Crear, Editar, Eliminar)
  const isAdmin = userRole === 'Administrador' || hasPermission('Admin.*') || hasPermission('Iptv.RespuestasRapidas.Administrar');

  // Estados del listado de respuestas
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFactionFilter, setSelectedFactionFilter] = useState<string>('all');

  // Estados del formulario (Alta / Edición)
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formMensaje, setFormMensaje] = useState<string>('');
  const [formDestinatario, setFormDestinatario] = useState<'cliente' | 'usuario' | 'todos'>('cliente');
  const [formFacciones, setFormFacciones] = useState<string[]>(['general']);
  const [formImagenBase64, setFormImagenBase64] = useState<string | null>(null);
  const [formUsuarioEspecifico, setFormUsuarioEspecifico] = useState<string | null>(null);
  const [modalVarsOpen, setModalVarsOpen] = useState<boolean>(false);
  const [modalVarsExpandedGroups, setModalVarsExpandedGroups] = useState<Record<string, boolean>>({
    '🎬 Datos del Cliente (IPTV/XTV)': true
  });

  // Estados del Simulador en Vivo
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '🎬 Datos del Cliente (IPTV/XTV)': true
  });
  
  // Registros reales para la simulación
  const [realClients, setRealClients] = useState<any[]>([]);
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);

  // Selección activa para la simulación
  const [selectedSimClient, setSelectedSimClient] = useState<string>('demo');
  const [selectedSimUser, setSelectedSimUser] = useState<string>('demo');
  const [selectedSimOrder, setSelectedSimOrder] = useState<string>('demo');

  // Estado para copiar la respuesta
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simCopied, setSimCopied] = useState<boolean>(false);

  // Ref del textarea para insertar variables
  const mensajeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar respuestas y datos de simulación
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getRespuestasRapidas();
      if (res.success && res.data) {
        setRespuestas(res.data);
      }

      // Cargar clientes reales
      const clientsData = await apiService.getIptvAccounts();
      if (clientsData && Array.isArray(clientsData)) {
        setRealClients(clientsData);
      }

      // Cargar usuarios reales
      const usersData = await apiService.getIptvPanelUsers();
      if (usersData && Array.isArray(usersData)) {
        setRealUsers(usersData);
      }

      // Cargar pedidos reales
      const ordersData = await apiService.getOrders();
      if (ordersData && Array.isArray(ordersData)) {
        setRealOrders(ordersData);
      }
    } catch (e: any) {
      console.error("Error al cargar datos:", e);
      toast.error("Error al sincronizar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Insertar variable en la posición del cursor
  const handleInsertVariable = (token: string) => {
    if (!mensajeTextareaRef.current) return;

    const textarea = mensajeTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formMensaje;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setFormMensaje(before + token + after);
    
    // Cerrar el desplegable automáticamente para no estorbar
    setModalVarsOpen(false);
    
    // Devolver el foco al textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + token.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);

    toast.info(`Variable ${token} insertada.`);
  };

  // Compresor de imagen Canvas local en Base64 (Regla 21)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Comprimiendo y codificando imagen local...");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; // Resolución compacta para optimizar Base64 (~40KB)
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75); // Calidad balanceada
          setFormImagenBase64(compressedBase64);
          toast.dismiss(toastId);
          toast.success("Captura/Comprobante cargado de forma local correctamente.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Eliminar respuesta de la DB de Supabase
  const handleDeleteResponse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar de forma permanente esta respuesta rápida de la base de datos de Supabase? No se podrá recuperar.")) return;

    try {
      const res = await apiService.deleteRespuestaRapida(id);
      if (res.success) {
        toast.success("La respuesta rápida ha sido eliminada permanentemente.");
        loadData();
      }
    } catch (e: any) {
      toast.error("Error al eliminar de la base de datos: " + e.message);
    }
  };

  // Guardar (Crear o Editar) en Supabase
  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formMensaje.trim()) {
      toast.error("Por favor completa el título y el cuerpo del mensaje.");
      return;
    }

    const payload: any = {
      id: editingId || undefined,
      titulo: formTitulo.trim(),
      mensaje: formMensaje.trim(),
      destinatario_tipo: formDestinatario,
      usuario_especifico_id: formUsuarioEspecifico || null,
      imagen_base64: formImagenBase64,
      facciones: formFacciones,
      created_at: new Date().toISOString()
    };

    const loadingToast = toast.loading("Guardando respuesta en Supabase...");
    try {
      const res = await apiService.saveRespuestaRapida(payload);
      toast.dismiss(loadingToast);

      if (res.success) {
        toast.success(editingId ? "Respuesta rápida actualizada correctamente." : "Respuesta rápida creada en Supabase.");
        setShowFormModal(false);
        resetForm();
        loadData();
      } else {
        throw new Error(res.error || "Falla al registrar.");
      }
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error("Error al guardar en base de datos: " + e.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitulo('');
    setFormMensaje('');
    setFormDestinatario('cliente');
    setFormFacciones(['general']);
    setFormImagenBase64(null);
    setFormUsuarioEspecifico(null);
  };

  const handleOpenEdit = (msg: any) => {
    setEditingId(msg.id);
    setFormTitulo(msg.titulo);
    setFormMensaje(msg.mensaje);
    setFormDestinatario(msg.destinatario_tipo || 'cliente');
    setFormFacciones(msg.facciones || ['general']);
    setFormImagenBase64(msg.imagen_base64 || null);
    setFormUsuarioEspecifico(msg.usuario_especifico_id || null);
    setShowFormModal(true);
  };

  // Compilar variables para la simulación en vivo
  const compileLiveMessage = (templateText: string) => {
    if (!templateText) return '';

    let compiled = templateText;

    // 1. Datos del cliente seleccionados
    let cNombre = 'Juan Pérez';
    let cUsuario = 'xtv_juan99';
    let cPassword = 'pass8812';
    let cServidor = 'http://xtv-vip.pro:8080';
    let cVencimiento = '15/08/2026';
    let cPantallas = '2 Pantallas';
    let cM3u = 'http://xtv-vip.pro:8080/get.php?auth=juan';
    let cLinkDemo = 'https://bit.ly/xtv-apk-pro';

    if (selectedSimClient !== 'demo') {
      const client = realClients.find(c => c.id === selectedSimClient || c.username === selectedSimClient);
      if (client) {
        cNombre = client.nombre || client.username || 'Cliente Real';
        cUsuario = client.username || '';
        cPassword = client.password || '';
        cServidor = client.dns_servidor || 'http://xtv-vip.pro:8080';
        cVencimiento = client.fecha_vencimiento ? new Date(client.fecha_vencimiento).toLocaleDateString() : 'N/A';
        cPantallas = `${client.limite_pantallas || 2} Pantallas`;
        cM3u = client.playlist_m3u || '';
        cLinkDemo = client.apk_descarga_url || 'https://bit.ly/xtv-apk-pro';
      }
    }

    // 2. Datos del vendedor seleccionados
    let uNombre = user?.user_metadata?.nombre || 'Carlos Distribuidor';
    let uPhone = user?.user_metadata?.telefono || '+5491122334455';
    let uEmail = user?.email || 'carlos_ventas@gmail.com';

    if (selectedSimUser !== 'demo') {
      const u = realUsers.find(x => x.id === selectedSimUser || x.email === selectedSimUser);
      if (u) {
        uNombre = u.nombre || u.email || 'Vendedor Real';
        uPhone = u.telefono || '+5491122334455';
        uEmail = u.email || '';
      }
    }

    // 3. Datos de pedido G3D seleccionados
    let pId = 'G3D-9481';
    let pProducto = 'Chop Cervecero Vikingo 1.0L';
    let pTotal = '$15,800.00';
    let pColores = 'Bronce Antiguo con Bandas Negras';
    let pEstado = 'En Proceso de Impresión 3D';

    if (selectedSimOrder !== 'demo') {
      const order = realOrders.find(o => o.id === selectedSimOrder);
      if (order) {
        pId = `G3D-${order.id.toString().substring(0,6)}`;
        pProducto = order.producto_nombre || 'Jarra Chop Personalizada';
        pTotal = order.total ? `$${Number(order.total).toLocaleString()}` : '$0';
        pColores = order.colores_config || 'Filamento Premium';
        pEstado = order.estado || 'Recibido';
      }
    }

    // 4. Datos de Finanzas
    const comMonto = '$4,500.00';
    const comPendientes = '$18,200.00';

    // Reemplazos de las variables
    compiled = compiled
      .replace(/{cliente_nombre}/g, cNombre)
      .replace(/{cliente_usuario}/g, cUsuario)
      .replace(/{cliente_password}/g, cPassword)
      .replace(/{cliente_servidor}/g, cServidor)
      .replace(/{cliente_vencimiento}/g, cVencimiento)
      .replace(/{cliente_pantallas}/g, cPantallas)
      .replace(/{cliente_m3u_url}/g, cM3u)
      .replace(/{cliente_link_demo}/g, cLinkDemo)
      
      .replace(/{usuario_nombre}/g, uNombre)
      .replace(/{usuario_telefono}/g, uPhone)
      .replace(/{usuario_email}/g, uEmail)
      
      .replace(/{pedido_id}/g, pId)
      .replace(/{pedido_producto}/g, pProducto)
      .replace(/{pedido_total}/g, pTotal)
      .replace(/{pedido_colores}/g, pColores)
      .replace(/{pedido_estado}/g, pEstado)
      
      .replace(/{comision_monto}/g, comMonto)
      .replace(/{comisiones_pendientes}/g, comPendientes);

    return compiled;
  };

  // Copiar al portapapeles con feedback visual
  const handleCopyText = (text: string, id: string | 'sim') => {
    navigator.clipboard.writeText(text);
    if (id === 'sim') {
      setSimCopied(true);
      toast.success("¡Mensaje compilado con variables reales copiado!");
      setTimeout(() => setSimCopied(false), 2000);
    } else {
      setCopiedId(id);
      toast.success("Respuesta rápida copiada.");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtrar respuestas según búsqueda y facciones
  const filteredRespuestas = respuestas.filter(msg => {
    const matchesSearch = 
      msg.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.mensaje.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFaction = 
      selectedFactionFilter === 'all' || 
      (msg.facciones && msg.facciones.includes(selectedFactionFilter));

    return matchesSearch && matchesFaction;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* HEADER SUPERIOR */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              <LayoutGrid className="w-4 h-4" />
              <span>Aplicaciones</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900 dark:text-white">Respuestas Rápidas</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Respuestas Rápidas Globales
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Motor central de mensajería con variables automáticas para acelerar el soporte técnico y las ventas de todo el ecosistema.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/apps')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 transition-all cursor-pointer shadow-sm"
              id="back-to-apps-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Aplicaciones
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  resetForm();
                  setShowFormModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-850 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-md shadow-slate-900/10 dark:shadow-emerald-950/20"
                id="create-new-response-btn"
              >
                <Plus className="w-4.5 h-4.5" />
                Crear Respuesta Rápida
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA CENTRAL (8 COLUMNAS): LISTADO Y FILTROS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BARRA DE FILTROS Y BÚSQUEDA */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o contenido..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all text-slate-800 dark:text-slate-100"
                id="search-responses-input"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedFactionFilter('all')}
                className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  selectedFactionFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-400'
                }`}
              >
                Todas
              </button>
              {FACTION_OPTIONS.map(fac => (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFactionFilter(fac.id)}
                  className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedFactionFilter === fac.id
                      ? 'bg-slate-900 text-white dark:bg-indigo-600'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-400'
                  }`}
                >
                  {fac.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTADO DE RESPUESTAS RÁPIDAS */}
          {loading ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl space-y-3 shadow-inner">
              <RefreshCw className="w-10 h-10 animate-spin text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Sincronizando con Supabase...</p>
            </div>
          ) : filteredRespuestas.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl space-y-4 shadow-sm">
              <div className="size-14 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">No se encontraron respuestas</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No hay respuestas registradas para este filtro o búsqueda. ¡Crea una nueva plantilla para el soporte de tus vendedores!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRespuestas.map((msg) => {
                return (
                  <div
                    key={msg.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-5 md:p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-start justify-between gap-5 relative group"
                    id={`response-card-${msg.id}`}
                  >
                    <div className="space-y-3.5 flex-1 min-w-0">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                          {msg.titulo}
                        </h3>
                        
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 px-2 py-0.5 rounded-md">
                          Para: {msg.destinatario_tipo === 'cliente' ? '🎬 Clientes' : msg.destinatario_tipo === 'usuario' ? '💼 Vendedores' : '🌍 Todos'}
                        </span>

                        {msg.imagen_base64 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Captura
                          </span>
                        )}
                      </div>

                      {/* Cuerpo de la plantilla */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all scrollbar-thin">
                        {msg.mensaje}
                      </div>

                      {/* Facciones de la respuesta */}
                      <div className="flex flex-wrap gap-1">
                        {msg.facciones && msg.facciones.map((facId: string) => {
                          const opt = FACTION_OPTIONS.find(f => f.id === facId);
                          return (
                            <span
                              key={facId}
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                opt ? opt.color : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {opt ? opt.label : facId}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-row md:flex-col items-center justify-end md:items-end gap-2 shrink-0 md:border-l md:border-slate-100 dark:md:border-slate-850 md:pl-5">
                      <button
                        onClick={() => handleCopyText(msg.mensaje, msg.id)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-200/40 dark:border-slate-750 ${
                          copiedId === msg.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60'
                        }`}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(msg)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                            title="Editar Plantilla"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteResponse(msg.id, e)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-xl transition-all cursor-pointer"
                            title="Eliminar de Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* COLUMNA LATERAL (4 COLUMNAS): EL MOTOR DE VARIABLES Y SIMULADOR */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECCIÓN 1: MOTOR DE VARIABLES INTERACTIVO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="size-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-150">
                  Diccionario de Variables
                </h3>
                <p className="text-[10px] text-slate-400">
                  Haz clic en cualquier variable para insertarla en tu editor.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {VARIABLE_GROUPS.map((group) => {
                const Icon = group.icon;
                const isExpanded = !!expandedGroups[group.name];

                return (
                  <div key={group.name} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.name]: !isExpanded }))}
                      className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-750 dark:text-slate-350 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{group.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-white dark:bg-slate-900 space-y-2 border-t border-slate-100 dark:border-slate-800/40">
                            {group.variables.map((v) => (
                              <div
                                key={v.token}
                                onClick={() => handleInsertVariable(v.token)}
                                className={`flex items-center justify-between p-2 rounded-xl border border-dashed transition-all cursor-pointer ${group.color} hover:scale-[1.01]`}
                                title="Haga clic para insertar"
                              >
                                <code className="text-xs font-mono font-bold">{v.token}</code>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                  {v.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: SIMULADOR DE BURBUJA WHATSAPP (VISTA PREVIA REAL) */}
          <div className="bg-gradient-to-br from-indigo-50/10 via-slate-50/25 to-indigo-100/10 dark:from-slate-900 dark:to-slate-950 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-4">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-150">
                  Simulador de Datos Reales
                </h3>
                <p className="text-[10px] text-slate-400">
                  Inyecta registros de la DB para ver el mensaje final compilado.
                </p>
              </div>
            </div>

            {/* Selectores de Registros para Alimentar la Simulación */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Cliente (IPTV):</span>
                  <span className="text-slate-300 dark:text-slate-700">Total: {realClients.length}</span>
                </label>
                <select
                  value={selectedSimClient}
                  onChange={(e) => setSelectedSimClient(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-250 cursor-pointer"
                >
                  <option value="demo">✨ Cliente Demo Fallback (Fijo)</option>
                  {realClients.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.nombre || c.username} ({c.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Vendedor (Patrocinador):</span>
                  <span className="text-slate-300 dark:text-slate-700">Total: {realUsers.length}</span>
                </label>
                <select
                  value={selectedSimUser}
                  onChange={(e) => setSelectedSimUser(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-250 cursor-pointer"
                >
                  <option value="demo">✨ Vendedor Demo Fallback (Fijo)</option>
                  {realUsers.map(u => (
                    <option key={u.id || u.email} value={u.id || u.email}>
                      💼 {u.nombre || u.email} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Pedido Impresión 3D (G3D):</span>
                  <span className="text-slate-300 dark:text-slate-700">Total: {realOrders.length}</span>
                </label>
                <select
                  value={selectedSimOrder}
                  onChange={(e) => setSelectedSimOrder(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-250 cursor-pointer"
                >
                  <option value="demo">✨ Pedido Demo Fallback (Fijo)</option>
                  {realOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      📦 G3D-{o.id.toString().substring(0,5)}: {o.producto_nombre} (${Number(o.total || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Burbuja WhatsApp Previsualización */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Burbuja de Envío en Vivo
              </span>

              <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-900 min-h-[160px] relative overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 bg-opacity-[0.04] bg-[radial-gradient(#128c7e_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                <div className="relative z-10 self-end max-w-[90%] bg-[#dcf8c6] dark:bg-emerald-950/80 border border-emerald-100 dark:border-emerald-900/60 p-3 rounded-2xl rounded-tr-none text-slate-800 dark:text-slate-100 shadow-sm text-[11px] leading-relaxed select-all">
                  {/* Vista previa compilada en tiempo real */}
                  <div className="whitespace-pre-wrap font-sans text-[11px] break-words">
                    {filteredRespuestas.length > 0 
                      ? compileLiveMessage(filteredRespuestas[0].mensaje) 
                      : 'Escribe o selecciona una plantilla para ver la simulación en tiempo real...'
                    }
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right mt-1.5 flex items-center justify-end gap-1 select-none">
                    <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-sky-500 font-bold">✓✓</span>
                  </div>
                </div>

                {filteredRespuestas.length > 0 && (
                  <div className="relative z-10 pt-3 flex flex-col gap-2">
                    <button
                      onClick={() => handleCopyText(compileLiveMessage(filteredRespuestas[0].mensaje), 'sim')}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                        simCopied 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/10'
                      }`}
                      id="copy-simulated-message-btn"
                    >
                      {simCopied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>¡Copiado de un Toque!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Compilado Real</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO MODAL ALTA / MODIFICACIÓN DE RESPUESTAS (EN SUPABASE) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
              id="quick-response-form-modal"
            >
              {/* Cabecera del Modal */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-tight">
                      {editingId ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Creación de plantillas dinámicas guardadas en Supabase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSaveResponse} className="p-6 space-y-5 flex-1 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Título de la Respuesta:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder="ej: 🎬 Bienvenida Oficial XTV"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm font-bold text-slate-800 dark:text-slate-100"
                    id="form-title-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Destinatario Objetivo:
                    </label>
                    <select
                      value={formDestinatario}
                      onChange={(e: any) => setFormDestinatario(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="cliente">🎬 Clientes (XTV / IPTV)</option>
                      <option value="usuario">💼 Vendedores / Miembros</option>
                      <option value="todos">🌍 Todos / Público General</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Uploader de Captura (Opcional - Regla 21):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="form-image-file-input"
                      />
                      <label
                        htmlFor="form-image-file-input"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-dashed border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        <span>{formImagenBase64 ? 'Cambiar Foto' : 'Subir Comprobante/Banner'}</span>
                      </label>
                      {formImagenBase64 && (
                        <button
                          type="button"
                          onClick={() => setFormImagenBase64(null)}
                          className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 rounded-xl cursor-pointer"
                          title="Quitar imagen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                 <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Cuerpo del Mensaje (Mensaje / Plantilla):
                    </label>

                    {/* Botón del Desplegable de Variables */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setModalVarsOpen(!modalVarsOpen)}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all select-none cursor-pointer border border-amber-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Inyectar Variable ⚡</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${modalVarsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {modalVarsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xl z-50 p-3 max-h-80 overflow-y-auto space-y-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                            Selecciona una variable para inyectar:
                          </p>
                          {VARIABLE_GROUPS.map((group) => {
                            const Icon = group.icon;
                            const isExpanded = !!modalVarsExpandedGroups[group.name];
                            return (
                              <div key={group.name} className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setModalVarsExpandedGroups(prev => ({ ...prev, [group.name]: !isExpanded }))}
                                  className="w-full flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 text-[11px] font-bold text-slate-700 dark:text-slate-350 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{group.name}</span>
                                  </div>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                  <div className="p-2 bg-white dark:bg-slate-900 space-y-1.5 border-t border-slate-100 dark:border-slate-800/40">
                                    {group.variables.map((v) => (
                                      <div
                                        key={v.token}
                                        onClick={() => {
                                          handleInsertVariable(v.token);
                                        }}
                                        className={`flex items-center justify-between p-1.5 rounded-lg border border-dashed transition-all cursor-pointer ${group.color} hover:scale-[1.01]`}
                                      >
                                        <code className="text-[10px] font-mono font-bold">{v.token}</code>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                          {v.description}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <textarea
                    ref={mensajeTextareaRef}
                    required
                    rows={8}
                    value={formMensaje}
                    onChange={(e) => setFormMensaje(e.target.value)}
                    placeholder="Escribe el mensaje utilizando corchetes para las variables. ej: Hola *{cliente_nombre}*, bienvenido..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-mono text-slate-800 dark:text-slate-100 leading-relaxed"
                    id="form-message-input-area"
                  />
                </div>

                {/* Selección Múltiple de Facciones para ver como respuestas rápidas */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Asignar Facciones (Sectores de Visualización):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
                    {FACTION_OPTIONS.map((fac) => {
                      const isChecked = formFacciones.includes(fac.id);
                      return (
                        <label
                          key={fac.id}
                          className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormFacciones(prev => prev.filter(id => id !== fac.id));
                              } else {
                                setFormFacciones(prev => [...prev, fac.id]);
                              }
                            }}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">
                              {fac.label}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal block">
                              {fac.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Previsualización en el Form de la imagen si está cargada */}
                {formImagenBase64 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Previsualización de Imagen Cargada:
                    </span>
                    <img
                      src={formImagenBase64}
                      alt="Captura cargada"
                      className="max-h-40 rounded-xl object-contain border border-slate-250 dark:border-slate-800 mx-auto"
                    />
                  </div>
                )}

                {/* Botones de Guardar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-850 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                    id="save-response-submit-btn"
                  >
                    Guardar en Supabase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
