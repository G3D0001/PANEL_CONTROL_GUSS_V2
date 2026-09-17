import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { LogisticsConfig } from '../types';
import { 
  Truck, 
  MapPin, 
  TrendingUp, 
  Save, 
  RefreshCw,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function LogisticsSettings({ insideWrapper }: { insideWrapper?: boolean }) {
  const [config, setConfig] = useState<LogisticsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const data = await apiService.getLogisticsConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    const { success } = await apiService.updateLogisticsConfig(config);
    
    if (success) {
      setMessage({ type: 'success', text: 'Configuración actualizada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Error al actualizar la configuración' });
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full " />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando tarifas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Truck className="text-primary" />
          Configuración de Logística de Red
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Define las tarifas base que la Tienda y la App de Fleteros usarán para calcular envíos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card: Tarifas Base */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <h2 className="font-bold text-lg">Cálculo de Distancia</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Precio Mínimo de Viaje
              </label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="number" 
                  value={config?.precio_minimo_viaje || 0}
                  onChange={(e) => setConfig(prev => prev ? {...prev, precio_minimo_viaje: parseFloat(e.target.value) || 0} : null)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary font-mono font-bold text-lg transition-colors duration-150"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400 px-2">
                * Tarifa base por solo mover el vehículo, sin importar la distancia corta.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Precio por cada 100 Metros
              </label>
              <div className="relative group">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="number" 
                  value={config?.precio_100_metros || 0}
                  onChange={(e) => setConfig(prev => prev ? {...prev, precio_100_metros: parseFloat(e.target.value) || 0} : null)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary font-mono font-bold text-lg transition-colors duration-150"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400 px-2">
                * Se aplicará este valor proporcionalmente a la distancia de la ruta.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card: Ganancia Plataforma */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <h2 className="font-bold text-lg">Comisión de Plataforma</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Porcentaje Admin (%)
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-focus-within:text-primary transition-colors">%</span>
                <input 
                  type="number" 
                  value={config?.comision_admin_percent || 0}
                  onChange={(e) => setConfig(prev => prev ? {...prev, comision_admin_percent: parseFloat(e.target.value) || 0} : null)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary font-mono font-bold text-lg transition-colors duration-150"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400 px-2">
                * Tu ganancia neta por cada viaje coordinado a través de la app.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-sm space-y-2 border border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-2 text-primary">
                 <Info size={16} />
                 <p className="text-xs font-bold uppercase tracking-widest">Ejemplo de Pago</p>
               </div>
               <div className="space-y-1 text-xs">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Costo total calculado:</span>
                   <span className="font-bold">$2,500</span>
                 </div>
                 <div className="flex justify-between text-emerald-600 font-bold">
                   <span>Tu Ganancia ({config?.comision_admin_percent}%):</span>
                   <span>${(2500 * (config?.comision_admin_percent || 0) / 100).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                   <span>Recibe el Fletero:</span>
                   <span className="font-bold">${(2500 - (2500 * (config?.comision_admin_percent || 0) / 100)).toLocaleString()}</span>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerta de sincronización */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl shadow-sm flex gap-4">
        <AlertCircle className="text-blue-500 shrink-0" size={24} />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-widest">Aviso Importante</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Cualquier cambio guardado aquí afectará instantáneamente al cotizador de la **Tienda Web** 
            y a las ganancias informadas en la **App de Fleteros**. Asegúrate de comunicar los cambios de tarifas a tus asociados.
          </p>
        </div>
      </div>

      {/* Barra de acciones inferior */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-lg">
        <button 
          onClick={fetchConfig}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
        >
          <RefreshCw size={20} />
          Descartar Cambios
        </button>

        <div className="flex items-center gap-4">
          {message && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className={cn(
                 "px-4 py-2 rounded-xl text-xs font-bold",
                 message.type === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
               )}
             >
               {message.text}
             </motion.div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-700 font-bold shadow-md shadow-primary/30   disabled:opacity-50 transition-colors duration-150"
          >
            {isSaving ? (
              <RefreshCw className="" size={20} />
            ) : (
              <Save size={20} />
            )}
            Guardar Tarifas Globales
          </button>
        </div>
      </div>
    </div>
  );
}
