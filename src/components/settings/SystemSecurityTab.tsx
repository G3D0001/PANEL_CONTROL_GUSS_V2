import React, { useState } from 'react';
import { ShieldAlert, Lock, Sliders, Save, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface SystemSecurityTabProps {
  config: any;
  onConfigSaved: () => Promise<void>;
}

export function SystemSecurityTab({ config, onConfigSaved }: SystemSecurityTabProps) {
  const [loading, setLoading] = useState(false);

  // Parámetros de seguridad
  const [intentosMaximos, setIntentosMaximos] = useState(config?.intentos_maximos || 5);
  const [tiempoBloqueo, setTiempoBloqueo] = useState(config?.tiempo_bloqueo_minutos || 15);
  const [diasValidezLink, setDiasValidezLink] = useState(config?.dias_validez_link || 7);
  const [costoKwh, setCostoKwh] = useState(config?.costo_kwh || 45);
  const [margenDefecto, setMargenDefecto] = useState(config?.margen_defecto || 40);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        intentos_maximos: Number(intentosMaximos) || 5,
        tiempo_bloqueo_minutos: Number(tiempoBloqueo) || 15,
        dias_validez_link: Number(diasValidezLink) || 7,
        costo_kwh: Number(costoKwh) || 45,
        margen_defecto: Number(margenDefecto) || 40,
      };

      const { error } = await supabase
        .from('configuracion_sistema')
        .update(payload)
        .eq('id', 1);

      if (error) throw error;

      await onConfigSaved();
      toast.success('Parámetros de seguridad y cálculo guardados en Supabase');
    } catch (err: any) {
      console.error('Error al guardar seguridad:', err);
      toast.error('Error al guardar: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveSecurity} className="space-y-6 max-w-4xl">
      {/* Políticas de Bloqueo y Acceso */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Políticas de Acceso y Prevención de Fuerza Bruta
            </h3>
            <p className="text-xs text-slate-400">
              Protege el panel de control ante intentos reiterados de inicio de sesión no autorizados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Intentos Máximos Fallidos
            </label>
            <input
              type="number"
              value={intentosMaximos}
              onChange={(e) => setIntentosMaximos(Number(e.target.value))}
              min={1}
              max={20}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Tiempo de Bloqueo Temporal (Minutos)
            </label>
            <input
              type="number"
              value={tiempoBloqueo}
              onChange={(e) => setTiempoBloqueo(Number(e.target.value))}
              min={1}
              max={120}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Parámetros Operativos del Sistema */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Parámetros Operativos y de Fabricación (G3D)
            </h3>
            <p className="text-xs text-slate-400">
              Valores globales para cálculo de costos de impresión 3D y validez de enlaces de presupuesto.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Días de Validez de Presupuestos
            </label>
            <input
              type="number"
              value={diasValidezLink}
              onChange={(e) => setDiasValidezLink(Number(e.target.value))}
              min={1}
              max={90}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Costo de Energía kWh ($ ARS)
            </label>
            <input
              type="number"
              value={costoKwh}
              onChange={(e) => setCostoKwh(Number(e.target.value))}
              min={0}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Margen de Ganancia por Defecto (%)
            </label>
            <input
              type="number"
              value={margenDefecto}
              onChange={(e) => setMargenDefecto(Number(e.target.value))}
              min={0}
              max={300}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Parámetros de Seguridad
        </button>
      </div>
    </form>
  );
}
