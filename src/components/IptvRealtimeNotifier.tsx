import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Volume2, VolumeX, ShieldAlert, Check, AlertTriangle, Play, HelpCircle, Bell, UserCheck } from 'lucide-react';

// Web Audio API continuous synthesizer for Dual Discordant Siren (Continuous attention-grabbing beep)
class DiscordantBuzzer {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('g3d_alarm_muted') === 'true';
  }

  setMute(state: boolean) {
    this.isMuted = state;
    localStorage.setItem('g3d_alarm_muted', String(state));
    if (state) {
      this.muteVolume();
    } else {
      this.unmuteVolume();
    }
  }

  getMuted() {
    return this.isMuted;
  }

  private muteVolume() {
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {}
    }
  }

  private unmuteVolume() {
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
      } catch (e) {}
    }
  }

  start() {
    if (this.audioCtx) return; // Already running
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      
      // Loud volume (0.6) if not muted, else 0
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      // Desynchronized dual oscillators for an annoying high-alert tone
      this.osc1 = this.audioCtx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(780, this.audioCtx.currentTime);
      this.osc1.connect(this.gainNode);

      this.osc2 = this.audioCtx.createOscillator();
      this.osc2.type = 'square';
      this.osc2.frequency.setValueAtTime(820, this.audioCtx.currentTime);
      this.osc2.connect(this.gainNode);

      this.osc1.start();
      this.osc2.start();

      let toggle = false;
      this.intervalId = setInterval(() => {
        if (!this.audioCtx || this.isMuted) return;
        // Sweeping siren frequencies
        const f1 = toggle ? 1000 : 600;
        const f2 = toggle ? 1080 : 680;
        toggle = !toggle;

        try {
          this.osc1?.frequency.exponentialRampToValueAtTime(f1, this.audioCtx.currentTime + 0.28);
          this.osc2?.frequency.exponentialRampToValueAtTime(f2, this.audioCtx.currentTime + 0.28);
        } catch (e) {}
      }, 300);

    } catch (e) {
      console.warn("Could not boot synthetic alarm buzzer:", e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.audioCtx?.close();
    } catch (e) {}
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.audioCtx = null;
  }
}

export function IptvRealtimeNotifier() {
  const { user, userRole } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const buzzerRef = useRef<DiscordantBuzzer | null>(null);

  // Solamente admins escuchan y gestionan alarmas en simutáneo
  const isAdmin = userRole === 'Admin';

  useEffect(() => {
    if (!isAdmin) {
      if (buzzerRef.current) {
        buzzerRef.current.stop();
        buzzerRef.current = null;
      }
      return;
    }

    // Inicializar el silbato de alerta
    const buzzer = new DiscordantBuzzer();
    buzzerRef.current = buzzer;
    setMuted(buzzer.getMuted());

    // 1. Cargar las solicitudes pendientes actuales iniciales de la base
    const fetchPendientes = async () => {
      try {
        const { data, error } = await supabase
          .from('iptv2_clientes_registros')
          .select('*')
          .eq('estado', 'pendiente_aprobacion');
        
        if (error) {
          // Si la tabla no está creada, usar fallback local
          const localRegs = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
          const p = localRegs.filter((r: any) => r.estado === 'pendiente_aprobacion' && !r.procesado_por);
          setActiveAlerts(p);
          return;
        }

        // Mostrar solo los que NO han sido asignados
        const filtrado = (data || []).filter(r => !r.procesado_por);
        setActiveAlerts(filtrado);
      } catch (e) {
        console.warn("[RealtimeNotifier] No se pudo cargar registros pendientes:", e);
      }
    };
    fetchPendientes();

    // 2. Suscribirse a Supabase Realtime para cambios instantáneos distribuidos en red
    const channel = supabase
      .channel('public:iptv2_clientes_registros')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iptv2_clientes_registros' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          
          if (eventType === 'INSERT') {
            if (newRow.estado === 'pendiente_aprobacion' && !newRow.procesado_por) {
              setActiveAlerts(prev => {
                if (prev.some(x => x.correo_usuario === newRow.correo_usuario)) return prev;
                // Emitir una tostada de aviso urgente
                toast.error(`🔔 ¡Urgente! Nueva solicitud de Demo recibida de: ${newRow.nombre_completo}`, {
                  duration: 15000,
                  position: 'top-center'
                });
                return [...prev, newRow];
              });
            }
          } else if (eventType === 'UPDATE') {
            // Si el estado ya no es pendiente_aprobacion o el registro fue reclamado por alguien
            if (newRow.estado !== 'pendiente_aprobacion' || newRow.procesado_por) {
              setActiveAlerts(prev => {
                const found = prev.find(x => x.correo_usuario === newRow.correo_usuario);
                if (found && newRow.procesado_por && newRow.procesado_por !== user?.email) {
                  // Notificar que otro administrador fue más veloz
                  toast.info(`⚡ El administrador "${newRow.procesado_por}" ya tomó la solicitud de ${newRow.nombre_completo}! Alarma cortada.`);
                }
                return prev.filter(x => x.correo_usuario !== newRow.correo_usuario);
              });
            } else if (newRow.estado === 'pendiente_aprobacion' && !newRow.procesado_por) {
              // Si regresó a un estado pendiente libre
              setActiveAlerts(prev => {
                if (prev.some(x => x.correo_usuario === newRow.correo_usuario)) return prev;
                return [...prev, newRow];
              });
            }
          } else if (eventType === 'DELETE') {
            setActiveAlerts(prev => prev.filter(x => x.correo_usuario !== oldRow.correo_usuario));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (buzzerRef.current) {
        buzzerRef.current.stop();
        buzzerRef.current = null;
      }
    };
  }, [isAdmin, user?.email]);

  // Manejo de reproducción de la alarma según el estado
  useEffect(() => {
    if (!buzzerRef.current) return;

    if (activeAlerts.length > 0) {
      // Activar alarma continua
      buzzerRef.current.start();
    } else {
      // Apagar alarma
      buzzerRef.current.stop();
    }
  }, [activeAlerts]);

  // Activa el audio manual si el navegador reclamaba políticas de interacción
  const handleInteractionUnlock = () => {
    if (buzzerRef.current && activeAlerts.length > 0) {
      buzzerRef.current.start();
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleInteractionUnlock);
    return () => window.removeEventListener('click', handleInteractionUnlock);
  }, [activeAlerts]);

  // Conmutador del silenciador (Mute)
  const toggleMute = () => {
    if (buzzerRef.current) {
      const nextState = !muted;
      buzzerRef.current.setMute(nextState);
      setMuted(nextState);
      if (nextState) {
        toast.info("Alarma audible silenciada provisionalmente en esta pestaña.");
      } else {
        toast.success("Alarma audible restablecida con volumen alto.");
      }
    }
  };

  // Reclamar/Tomar solicitud con validación concurrente ultrarrápida
  const handleClaim = async (req: any) => {
    setClaiming(req.correo_usuario);
    const adminEmail = user?.email || 'Administrador Central';
    const t0 = performance.now();

    try {
      // UPDATE atómico: sólo asigna si procesado_por sigue siendo nulo
      const { data, error } = await supabase
        .from('iptv2_clientes_registros')
        .update({
          procesado_por: adminEmail,
          estado: 'creando' // Cambiamos el estado para que deje de alarmar
        })
        .eq('correo_usuario', req.correo_usuario)
        .is('procesado_por', null)
        .select();

      const msDiff = Math.round(performance.now() - t0);

      if (error) throw error;

      if (data && data.length > 0) {
        // ÉXITO: El administrador actual ganó la competencia concurrentemente
        toast.success(`🎉 ¡Asignado con éxito! Resolviste la carrera de clics en ${msDiff}ms. Redirigiendo...`);
        // Eliminarlo de la lista local inmediatamente para apagar el buzzer
        setActiveAlerts(prev => prev.filter(x => x.correo_usuario !== req.correo_usuario));
        
        // Redirigir o emitir evento de navegación para crear la cuenta
        window.dispatchEvent(new CustomEvent('nav_to_solicitud', { detail: { req, email: req.correo_usuario } }));
      } else {
        // FALLÓ: Otro administrador fue más rápido y ya actualizó el registro
        // Busquemos quién lo obtuvo
        const { data: current } = await supabase
          .from('iptv2_clientes_registros')
          .select('procesado_por')
          .eq('correo_usuario', req.correo_usuario)
          .maybeSingle();

        const claimer = current?.procesado_por || 'otro administrador';
        toast.error(`❌ ¡UY! No llegaste a tiempo. El usuario '${claimer}' fue más veloz y ya está atendiendo la solicitud.`);
        // Quitarlo ya que tiene asignación
        setActiveAlerts(prev => prev.filter(x => x.correo_usuario !== req.correo_usuario));
      }
    } catch (e: any) {
      // Fallback local si no hay conexión a Supabase
      console.warn("Error reclamando de forma remota, aplicando asignación local:", e);
      toast.success("Asignado en sesión local (tabla de respaldo).");
      
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const updated = localList.map((c: any) => 
        c.correo_usuario === req.correo_usuario 
          ? { ...c, procesado_por: adminEmail, estado: 'creando' } 
          : c
      );
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify(updated));
      setActiveAlerts(prev => prev.filter(x => x.correo_usuario !== req.correo_usuario));
    } finally {
      setClaiming(null);
    }
  };

  if (!isAdmin || activeAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-rose-500/40 text-white rounded-3xl p-5 shadow-2xl relative overflow-hidden ring-4 ring-rose-500/20">
        {/* Blinking alarm background effect */}
        <div className="absolute inset-0 bg-rose-600/5 animate-pulse pointer-events-none" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white ring-4 ring-rose-500/40 animate-bounce">
              <Bell className="animate-wiggle" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-rose-455 flex items-center gap-2">
                ¡ALERTA DE PETICIÓN!
                <span className="size-2 bg-red-400 rounded-full animate-ping" />
              </h4>
              <p className="text-[10px] text-slate-300 font-bold mt-0.5">
                Hay {activeAlerts.length} solicitud{activeAlerts.length > 1 ? 'es' : ''} demo a la espera
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleMute}
            className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-all cursor-pointer"
            title={muted ? "Activar Sonido" : "Silenciar Alarma Fuerte"}
          >
            {muted ? <VolumeX size={15} className="text-amber-500" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>
        </div>

        <div className="mt-4 space-y-2.5 relative z-10">
          {activeAlerts.map(req => (
            <div 
              key={req.correo_usuario}
              className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2.5 text-xs text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-slate-100 truncate max-w-[200px]">{req.nombre_completo}</p>
                  <p className="text-[10px] text-rose-400/80 font-semibold mt-0.5 truncate max-w-[200px]">
                    Plan: <span className="font-mono text-[9px] font-black">{req.plan_id || 'Demo Gratis'}</span>
                  </p>
                  {req.vendedor_creador && (
                    <p className="text-[9px] text-slate-400/90 font-medium">
                      Por Vendedor: <span className="text-cyan-500 font-bold">{req.vendedor_creador}</span>
                    </p>
                  )}
                </div>
                <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded tracking-wide">
                  {new Date(req.creado_al).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  id={`claim-${req.correo_usuario}`}
                  disabled={claiming === req.correo_usuario}
                  onClick={() => handleClaim(req)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[9px] tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-900/40 disabled:opacity-50 transition-all"
                >
                  {claiming === req.correo_usuario ? (
                    'Reclamando...'
                  ) : (
                    <>
                      <UserCheck size={11} /> TOMAR TAREA
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[8px] text-slate-500 font-medium text-center mt-3 uppercase tracking-wider relative z-10">
          Coordinación en simultáneo activa vía Supabase Channels
        </p>
      </div>
    </div>
  );
}
