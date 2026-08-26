import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { MapPin, Truck, Clock, CheckCircle2, AlertCircle, Search, RefreshCw, Navigation, ExternalLink, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function LogisticsDashboard({ insideWrapper }: { insideWrapper?: boolean }) {
  const [travels, setTravels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | 'Pendiente' | 'Asignado' | 'En Camino' | 'Entregado'>('Todos');

  useEffect(() => {
    fetchTravels();
    const interval = setInterval(fetchTravels, 30000); // Auto refresh cada 30s
    return () => clearInterval(interval);
  }, []);

  const fetchTravels = async () => {
    const data = await apiService.getActiveTravels();
    setTravels(data);
    setLoading(false);
  };

  const filteredTravels = travels.filter(t => filter === 'Todos' || t.estado === filter);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Asignado': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En Camino': return 'bg-purple-100 text-purple-700 border-purple-200 ';
      case 'Entregado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-5 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Navigation className="text-primary" />
            Torre de Control Logística
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            Monitor de envíos en tiempo real de toda la red G3D.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
          {['Todos', 'Pendiente', 'Asignado', 'En Camino', 'Entregado'].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150",
                filter === opt 
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Buscando Fletero</p>
           <p className="text-3xl font-bold text-amber-500">{travels.filter(t => t.estado === 'Pendiente').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">En Tránsito</p>
           <p className="text-3xl font-bold text-blue-500">{travels.filter(t => t.estado === 'En Camino').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Entregados Hoy</p>
           <p className="text-3xl font-bold text-emerald-500">{travels.filter(t => t.estado === 'Entregado').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Comisión Plataforma</p>
           <p className="text-3xl font-bold text-slate-800 dark:text-white">
             ${travels.reduce((acc, t) => acc + (t.comision_admin || 0), 0).toLocaleString()}
           </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <RefreshCw className="size-10 text-primary " />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando con satélites...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-3">Pedido / Destinatario</div>
            <div className="col-span-2">Ruta (Desde - Hasta)</div>
            <div className="col-span-2">Logística / Driver</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-2 text-right">Monto / Distancia</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
             {filteredTravels.length === 0 ? (
               <div className="p-20 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-400 font-bold">No hay movimientos logísticos registrados en este filtro.</p>
               </div>
             ) : (
               filteredTravels.map((travel) => (
                 <motion.div 
                   key={travel.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="grid grid-cols-12 items-center bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-primary/20 transition-colors duration-150 group"
                 >
                   <div className="col-span-3 flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Package size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">#{String(travel.pedido_id || travel.id || '---').slice(0,8)}</p>
                        <p className="text-xs font-bold text-slate-500">{travel.pedido?.cliente_nombre || 'Cliente Final'}</p>
                      </div>
                   </div>

                   <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <MapPin size={10} className="text-rose-400" />
                        <span className="truncate">{travel.vendedor?.nombre_negocio || 'Origen'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <Navigation size={10} className="text-emerald-400" />
                        <span className="truncate">{travel.pedido?.cliente_direccion || 'Destino'}</span>
                      </div>
                   </div>

                   <div className="col-span-2">
                     <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Truck size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {travel.fletero?.nombre_completo || 'SIN ASIGNAR'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400">{travel.fletero?.tipo_vehiculo || '-'}</p>
                        </div>
                     </div>
                   </div>

                   <div className="col-span-2 flex justify-center">
                      <div className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shrink-0 flex items-center gap-2",
                        getStatusStyle(travel.estado)
                      )}>
                        {travel.estado === 'Entregado' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {travel.estado}
                      </div>
                   </div>

                   <div className="col-span-2 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${travel.monto_total?.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">{travel.distancia_km?.toFixed(1)} KM aprox</p>
                   </div>

                   <div className="col-span-1 flex justify-end">
                      <button className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors duration-150 flex items-center justify-center">
                        <ExternalLink size={18} />
                      </button>
                   </div>
                 </motion.div>
               ))
             )}
          </div>
        </div>
      )}
    </div>
  );
}
