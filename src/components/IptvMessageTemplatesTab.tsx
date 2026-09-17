import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Copy, Check, RefreshCw, Send, Smartphone, Sparkles, User, Info, Cloud, CloudCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IptvAccount } from '../types';
import { apiService } from '../services/apiService';

export interface TemplateSet {
  alta_vip: string;
  alta_demo: string;
  renovacion: string;
  vencimiento: string;
  soporte: string;
}

const DEFAULT_TEMPLATES: TemplateSet = {
  alta_vip: `¡Hola {nombre_completo}! 👋 Tu membresía de televisión digital ha sido activada con éxito 🚀

📺 *DATOS DE ACCESO:*
👤 *Usuario:* {username}
🔑 *Contraseña:* {password}
🖥️ *Pantallas Simultáneas:* {pantallas}
📅 *Vigencia:* {fecha_vencimiento}
📦 *Plan:* {plan}

🔗 *DNS / Portal:* {dns}
📥 *Lista M3U:* {m3u_url}

Si necesitas asistencia para configurarlo en tu Smart TV, TV Box o teléfono celular, avísanos por este chat. ¡A disfrutar! ✨`,

  alta_demo: `¡Hola {nombre_completo}! 🎁 Aquí tienes tu acceso de prueba gratuita:

📺 *DATOS DE PRUEBA:*
👤 *Usuario:* {username}
🔑 *Contraseña:* {password}
🖥️ *Pantallas:* {pantallas}
⏳ *Vigencia:* Prueba Gratuita (Vence {fecha_vencimiento})

🔗 *DNS / Portal:* {dns}
📥 *Lista M3U:* {m3u_url}

Pruébalo con tranquilidad y cualquier duda sobre los canales estamos a tu total disposición 🙌`,

  renovacion: `¡Hola {nombre_completo}! ✅ Tu renovación ha sido procesada con éxito 🥳

📦 *Plan:* {plan}
👤 *Usuario:* {username}
📅 *Nueva fecha de vencimiento:* {fecha_vencimiento}
🖥️ *Pantallas:* {pantallas}

¡Muchas gracias por seguir confiando en nuestro servicio! Que lo disfrutes al máximo 📺`,

  vencimiento: `¡Hola {nombre_completo}! ⚠️ Te informamos que tu suscripción de televisión digital vence el {fecha_vencimiento}.

👤 *Usuario:* {username}
📦 *Plan:* {plan}

Para mantener tu cuenta activa y no sufrir cortes en la señal, por favor respóndenos a este mensaje para coordinar el pago. ¡Muchas gracias! 🙌`,

  soporte: `¡Hola {nombre_completo}! 🛠️ En relación a tu consulta técnica sobre tu línea ({username}):

Por favor realiza los siguientes pasos rápidos:
1️⃣ Verifica que tu conexión a internet funcione con fluidez (mínimo 20MB recomendados).
2️⃣ Cierra y vuelve a abrir la aplicación, o reinicia tu Smart TV / TV Box.
3️⃣ Comprueba que tu usuario ({username}) y contraseña estén escritos respetando mayúsculas y minúsculas.

Si el inconveniente continúa, envíanos una foto del mensaje de error o el nombre del canal afectado para resolverlo de inmediato 🤝`
};

const AVAILABLE_VARIABLES = [
  { tag: '{nombre_completo}', label: 'Nombre Cliente', desc: 'Nombre y apellido del abonado' },
  { tag: '{username}', label: 'Usuario', desc: 'Usuario o línea de acceso' },
  { tag: '{password}', label: 'Contraseña', desc: 'Clave de acceso de la cuenta' },
  { tag: '{pantallas}', label: 'Pantallas', desc: 'Cantidad de conexiones permitidas' },
  { tag: '{fecha_vencimiento}', label: 'Vencimiento', desc: 'Fecha límite de la membresía' },
  { tag: '{plan}', label: 'Plan', desc: 'Nombre del paquete o plan contratado' },
  { tag: '{dns}', label: 'DNS / Portal', desc: 'Dirección del servidor o DNS' },
  { tag: '{m3u_url}', label: 'Enlace M3U', desc: 'URL completa de la lista de reproducción' },
  { tag: '{telefono}', label: 'Teléfono', desc: 'Número de WhatsApp del cliente' },
];

interface Props {
  accounts: IptvAccount[];
  dnsPortalDefault?: string;
}

const TEMPLATE_TITLES: Record<keyof TemplateSet, string> = {
  alta_vip: 'Alta VIP (Línea Oficial)',
  alta_demo: 'Alta Demo (Prueba Gratuita)',
  renovacion: 'Renovación Exitosa',
  vencimiento: 'Aviso de Vencimiento',
  soporte: 'Soporte Técnico'
};

export const IptvMessageTemplatesTab: React.FC<Props> = ({ accounts, dnsPortalDefault = 'http://vip-xtv.pro:8080' }) => {
  const [activeTemplateKey, setActiveTemplateKey] = useState<keyof TemplateSet>('alta_vip');
  const [templates, setTemplates] = useState<TemplateSet>(() => {
    try {
      const saved = localStorage.getItem('g3d_iptv_message_templates');
      if (saved) return { ...DEFAULT_TEMPLATES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_TEMPLATES;
  });

  const [loadingFromDb, setLoadingFromDb] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedClientUsername, setSelectedClientUsername] = useState<string>(accounts[0]?.username || '');
  const [copied, setCopied] = useState(false);

  // Cargar plantillas desde Supabase al iniciar
  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        setLoadingFromDb(true);
        const remote = await apiService.getIptvMessageTemplates();
        if (isMounted && remote && Object.keys(remote).length > 0) {
          setTemplates(prev => ({
            ...prev,
            ...remote
          }));
        }
      } catch (err) {
        console.warn("[IptvMessageTemplatesTab] Error al cargar plantillas de Supabase:", err);
      } finally {
        if (isMounted) setLoadingFromDb(false);
      }
    };
    fetchTemplates();
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Guardar cambios con persistencia local y sincronización automática en Supabase
  const handleSaveCurrentTemplate = (newText: string) => {
    const updated = { ...templates, [activeTemplateKey]: newText };
    setTemplates(updated);
    localStorage.setItem('g3d_iptv_message_templates', JSON.stringify(updated));

    // Debounce de guardado en la base de datos de Supabase
    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiService.saveIptvMessageTemplate(
          activeTemplateKey,
          newText,
          TEMPLATE_TITLES[activeTemplateKey]
        );
        if (res.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          setSaveStatus('error');
        }
      } catch (e) {
        setSaveStatus('error');
      }
    }, 700);
  };

  const handleResetToDefault = async () => {
    if (confirm(`¿Restablecer la plantilla "${TEMPLATE_TITLES[activeTemplateKey]}" a su formato original de fábrica?`)) {
      const defaultText = DEFAULT_TEMPLATES[activeTemplateKey];
      const updated = { ...templates, [activeTemplateKey]: defaultText };
      setTemplates(updated);
      localStorage.setItem('g3d_iptv_message_templates', JSON.stringify(updated));
      
      setSaveStatus('saving');
      try {
        await apiService.saveIptvMessageTemplate(
          activeTemplateKey,
          defaultText,
          TEMPLATE_TITLES[activeTemplateKey]
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        toast.success("Plantilla restablecida y sincronizada con Supabase.");
      } catch (e) {
        setSaveStatus('error');
        toast.error("Error al sincronizar con Supabase, guardado en memoria local.");
      }
    }
  };

  const handleInsertVariable = (tag: string) => {
    const current = templates[activeTemplateKey];
    handleSaveCurrentTemplate(current + ' ' + tag);
    toast.info(`Variable ${tag} agregada al texto`);
  };

  // Obtener cliente seleccionado o datos de muestra
  const client = accounts.find(a => a.username === selectedClientUsername) || accounts[0] || {
    username: 'cliente_vip',
    password: 'tv' + Math.floor(1000 + Math.random() * 9000),
    nombre_completo: 'Juan Pérez',
    celular: '+5491198765432',
    limite_pantallas: 3,
    fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    id_plan_venta: 'Plan Full 3 Pantallas',
    url_panel_asignada: dnsPortalDefault
  };

  // Generar vista previa con reemplazo de variables
  const formatPreviewMessage = () => {
    const raw = templates[activeTemplateKey] || '';
    const dns = client.url_panel_asignada || dnsPortalDefault;
    const m3u = `${dns}/get.php?username=${client.username}&password=${client.password}&type=m3u_plus&output=ts`;
    const vencimiento = client.fecha_vencimiento 
      ? new Date(client.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '30 días';

    return raw
      .replace(/{nombre_completo}/g, client.nombre_completo || client.username || 'Estimado/a')
      .replace(/{username}/g, client.username || 'usuario_demo')
      .replace(/{password}/g, client.password || '******')
      .replace(/{pantallas}/g, String(client.limite_pantallas || 1))
      .replace(/{fecha_vencimiento}/g, vencimiento)
      .replace(/{plan}/g, client.id_plan_venta || 'Membresía XTV')
      .replace(/{dns}/g, dns)
      .replace(/{m3u_url}/g, m3u)
      .replace(/{telefono}/g, client.celular || '+54 9 ...');
  };

  const previewMessage = formatPreviewMessage();

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    toast.success("¡Mensaje formateado copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const phone = (client.celular || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(previewMessage);
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  return (
    <div id="iptv_section_mensajes" className="space-y-6 text-left">
      {/* CABECERA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MessageSquare size={20} />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Gestor Dinámico de Plantillas XTV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza las respuestas automáticas para entregas de líneas, demos, renovaciones y avisos de cobro con variables inteligentes.
              </p>
            </div>
          </div>
        </div>

        {/* SELECTOR DE PLANTILLA */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border dark:border-slate-700/80">
          <button
            onClick={() => setActiveTemplateKey('alta_vip')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeTemplateKey === 'alta_vip'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ⭐ Alta VIP
          </button>
          <button
            onClick={() => setActiveTemplateKey('alta_demo')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeTemplateKey === 'alta_demo'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🎁 Alta Demo
          </button>
          <button
            onClick={() => setActiveTemplateKey('renovacion')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeTemplateKey === 'renovacion'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🔄 Renovación
          </button>
          <button
            onClick={() => setActiveTemplateKey('vencimiento')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeTemplateKey === 'vencimiento'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ⏰ Vencimiento
          </button>
          <button
            onClick={() => setActiveTemplateKey('soporte')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
              activeTemplateKey === 'soporte'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🛠️ Soporte
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: EDITOR DE PLANTILLA Y VARIABLES */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    Editando Plantilla:
                  </span>
                  {/* Indicador de estado Supabase */}
                  {loadingFromDb ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                      <Loader2 size={10} className="animate-spin" /> Conectando BD...
                    </span>
                  ) : saveStatus === 'saving' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                      <Loader2 size={10} className="animate-spin" /> Guardando en Supabase...
                    </span>
                  ) : saveStatus === 'saved' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      <CloudCheck size={11} /> Sincronizado en BD
                    </span>
                  ) : saveStatus === 'error' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                      <Cloud size={10} /> Error de red (Guardado Local)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <Cloud size={10} /> Base de Datos Activa
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white capitalize">
                  {TEMPLATE_TITLES[activeTemplateKey] || activeTemplateKey.replace('_', ' ')}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1"
                title="Restablece esta plantilla al formato de fábrica"
              >
                <RefreshCw size={11} /> Restaurar de Fábrica
              </button>
            </div>

            {/* CHIPS DE VARIABLES INSERTABLES */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">
                Haz clic en una variable para insertarla al final del mensaje:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    title={v.desc}
                  >
                    <span>+</span> {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* TEXTAREA DEL MENSAJE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block">
                Cuerpo del Mensaje (Soporta formato WhatsApp con *negrita* y _cursiva_)
              </label>
              <textarea
                rows={12}
                value={templates[activeTemplateKey]}
                onChange={(e) => handleSaveCurrentTemplate(e.target.value)}
                placeholder="Escribe el mensaje con variables como {nombre_completo}, {username}, {password}..."
                className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 leading-relaxed custom-scrollbar"
              />
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
              <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
                <strong>Sincronización en la Nube y Multi-App:</strong> Cada cambio que realices se guarda en tiempo real en la tabla <code className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded text-[10px]">iptv_plantillas_mensajes</code> de Supabase y en la memoria local, estando disponible de inmediato para todas las aplicaciones y bots conectados.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR DE WHATSAPP CON DATOS REALES */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-500" />
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                  Simulador de Entrega
                </h4>
              </div>

              {/* SELECTOR DE CLIENTE REAL */}
              {accounts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <select
                    value={selectedClientUsername}
                    onChange={(e) => setSelectedClientUsername(e.target.value)}
                    className="text-[10px] font-bold py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none max-w-[150px] truncate"
                  >
                    {accounts.map(acc => (
                      <option key={acc.username} value={acc.username}>
                        {acc.nombre_completo || acc.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* PANTALLA TIPO WHATSAPP */}
            <div className="bg-[#EFEAE2] dark:bg-[#0b141a] p-4 rounded-2xl border border-slate-300 dark:border-slate-800 min-h-[320px] flex flex-col justify-between shadow-inner">
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-[9px] bg-white/70 dark:bg-slate-800/80 text-slate-500 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Hoy • Vista previa de entrega
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/50 dark:border-slate-700/50 max-w-[95%] text-xs leading-relaxed whitespace-pre-wrap font-sans select-text">
                  {previewMessage}
                </div>
              </div>

              <div className="text-right text-[8.5px] text-slate-400 mt-2">
                ✓✓ Entregado con variables resueltas
              </div>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyPreview}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send size={14} /> Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
