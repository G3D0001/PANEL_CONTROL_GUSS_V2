import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { FleteroProfile } from '../types';
import { 
  User, 
  Truck, 
  Bike, 
  Car, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Save, 
  Search,
  DollarSign,
  Package,
  XCircle,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function FleterosManager({ insideWrapper }: { insideWrapper?: boolean }) {
  const [fleteros, setFleteros] = useState<FleteroProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFletero, setEditingFletero] = useState<Partial<FleteroProfile> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFleteros();
  }, []);

  const fetchFleteros = async () => {
    setLoading(true);
    const data = await apiService.getFleteros();
    setFleteros(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingFletero?.nombre_completo) {
      alert("El nombre es obligatorio");
      return;
    }

    setIsSaving(true);
    const id = editingFletero.id || crypto.randomUUID();
    const { success } = await apiService.updateFletero(id, {
      ...editingFletero,
      id
    });
    
    if (success) {
      setEditingFletero(null);
      fetchFleteros();
    } else {
      alert("Error al guardar el fletero");
    }
    setIsSaving(false);
  };

  const filteredFleteros = fleteros.filter(f => 
    f.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'Moto': return <Bike size={20} />;
      case 'Auto': return <Car size={20} />;
      case 'Camion': return <Truck size={20} />;
      default: return <Truck size={20} />;
    }
  };

  return (
    <div className="p-4 md:p-5 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <User className="text-primary" />
            Gestión de Fleteros
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Registra y audita a los conductores de tu red de logística privada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar fletero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64 transition-colors duration-150"
            />
          </div>
          <button 
            onClick={() => setEditingFletero({ 
              nombre_completo: '', 
              tipo_vehiculo: 'Moto',
              activo: true,
              saldo_deuda: 0,
              peso_max_kg: 20,
              volumen_max_m3: 0.1
            })}
            className="flex items-center gap-2 bg-slate-900 text-white shadow-sm border border-slate-700 px-5 h-11 rounded-xl font-bold shadow-lg shadow-primary/20   transition-colors duration-150 whitespace-nowrap"
          >
            <Plus size={20} />
            Nuevo Alta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full " />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consultando base de datos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleteros.map((fletero) => (
            <motion.div 
              key={fletero.id}
              layoutId={fletero.id}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-colors duration-150 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center text-slate-400">
                    {fletero.foto_perfil ? (
                      <img src={fletero.foto_perfil} alt={fletero.nombre_completo} className="w-full h-full object-cover" />
                    ) : (
                      <User size={30} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {fletero.nombre_completo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1",
                        fletero.activo ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {fletero.activo ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        {fletero.activo ? 'Verificado' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                  {getVehicleIcon(fletero.tipo_vehiculo)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Capacidad Peso</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Package size={14} className="text-primary" />
                    {fletero.peso_max_kg} KG
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status Viaje</p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {fletero.viaje_actual_id ? 'EN VIAJE' : 'DISPONIBLE'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Comisiones Pendientes</p>
                  <p className={cn(
                    "text-lg font-mono font-bold",
                    fletero.saldo_deuda > 5000 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    ${fletero.saldo_deuda.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingFletero(fletero)}
                  className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs   transition-colors duration-150"
                >
                  Ver Perfil
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      <AnimatePresence>
        {editingFletero && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFletero(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-700 flex items-center justify-center shadow-lg shadow-primary/20">
                      <User size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil de Fletero</h2>
                      <p className="text-sm text-slate-500">Configuración técnica y de seguridad.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingFletero(null)}
                    className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                  >
                    <XCircle size={28} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Columna Izquierda: Identidad */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={editingFletero.nombre_completo || ''}
                        onChange={(e) => setEditingFletero({...editingFletero, nombre_completo: e.target.value})}
                        className="w-full h-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary font-bold transition-colors duration-150"
                        placeholder="Ej: Marcelo Gomez"
                      />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Tipo de Vehículo</label>
                       <div className="grid grid-cols-3 gap-2">
                         {['Moto', 'Auto', 'Camion'].map((type) => (
                           <button
                             key={type}
                             onClick={() => setEditingFletero({...editingFletero, tipo_vehiculo: type as any})}
                             className={cn(
                               "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors duration-150 gap-1",
                               editingFletero.tipo_vehiculo === type 
                                 ? "border-primary bg-primary/5 text-primary" 
                                 : "border-slate-100 dark:border-slate-800 text-slate-400"
                             )}
                           >
                             {getVehicleIcon(type)}
                             <span className="text-[10px] font-bold uppercase">{type}</span>
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">URL Foto Perfil</label>
                      <div className="relative">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={editingFletero.foto_perfil || ''}
                          onChange={(e) => setEditingFletero({...editingFletero, foto_perfil: e.target.value})}
                          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary font-bold text-xs"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Capacidades y Cuenta */}
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[2rem] space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacidad de Carga</p>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between px-1">
                          <span className="text-[10px] font-bold text-slate-500">Peso Máximo (KG)</span>
                          <span className="text-xs font-bold text-primary">{editingFletero.peso_max_kg || 0} KG</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="2000"
                          value={editingFletero.peso_max_kg || 0}
                          onChange={(e) => setEditingFletero({...editingFletero, peso_max_kg: parseInt(e.target.value)})}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between px-1">
                          <span className="text-[10px] font-bold text-slate-500">Volumen Máx (M³)</span>
                          <span className="text-xs font-bold text-primary">{editingFletero.volumen_max_m3 || 0} M³</span>
                        </div>
                        <input 
                          type="number" 
                          step="0.1"
                          value={editingFletero.volumen_max_m3 || 0}
                          onChange={(e) => setEditingFletero({...editingFletero, volumen_max_m3: parseFloat(e.target.value)})}
                          className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-700 border-none focus:ring-2 focus:ring-primary font-bold text-sm"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 space-y-4">
                      <div className="flex items-center gap-2 text-rose-500">
                        <DollarSign size={18} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Estado Contable</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1 text-center">
                           <p className="text-[10px] font-bold text-rose-400">Deuda Comisiones</p>
                           <input 
                             type="number" 
                             value={editingFletero.saldo_deuda || 0}
                             onChange={(e) => setEditingFletero({...editingFletero, saldo_deuda: parseFloat(e.target.value) || 0})}
                             className="w-full text-center bg-transparent border-none p-0 font-mono font-bold text-lg text-rose-600 focus:ring-0"
                           />
                         </div>
                         <div className="flex items-center justify-center">
                           <button 
                             onClick={() => setEditingFletero({...editingFletero, activo: !editingFletero.activo})}
                             className={cn(
                               "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors duration-150 shadow-md",
                               editingFletero.activo ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                             )}
                           >
                             {editingFletero.activo ? 'Validado' : 'Suspendido'}
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                    onClick={() => setEditingFletero(null)}
                    className="flex-1 h-14 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-800 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[2] h-14 rounded-[1.5rem] bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]  disabled:opacity-50 transition-colors duration-150"
                  >
                    {isSaving ? (
                      <div className="size-5 border-2 border-slate-400 border-t-white rounded-full " />
                    ) : (
                      <>
                        <Save size={20} />
                        Guardar Fletero
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
