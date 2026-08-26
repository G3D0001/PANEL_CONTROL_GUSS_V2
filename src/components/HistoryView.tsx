import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  User, 
  Tag, 
  History as HistoryIcon,
  ArrowRight,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { apiService } from '@/src/services/apiService';

export function HistoryView() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const loadMovements = async () => {
    setLoading(true);
    const data = await apiService.getHistorialMovimientos({
      search: searchTerm,
      startDate: startDate,
      endDate: endDate,
      action: filterAction,
      entity: filterEntity
    });
    setMovements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMovements();
  }, [searchTerm, startDate, endDate, filterAction, filterEntity]);

  const extractFieldValue = (obj: any, label: string) => {
    if (!obj) return '-';
    // Para simplificar la vista, extraer un campo representativo (e ej: estado)
    if (obj.estado_pedido) return obj.estado_pedido;
    if (obj.monto) return `$${obj.monto}`;
    return Object.values(obj)[0] as string || '-';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="p-5 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-slate-900">Historial de Movimientos</h2>
          <p className="text-slate-500 text-sm">Trazabilidad y auditoría de eventos del sistema en tiempo real</p>
        </div>
      </header>

      <div className="px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-colors duration-150"
            placeholder="Buscar por ID, detalle o usuario..."
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg items-center px-3 py-1.5 gap-2">
           <Calendar size={16} className="text-slate-400" />
           <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="text-sm outline-none bg-transparent" />
           <span className="text-slate-400 text-sm">a</span>
           <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="text-sm outline-none bg-transparent" />
        </div>

        <select 
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 outline-none"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">Todas las Acciones</option>
          <option value="CREACION">Creación</option>
          <option value="EDICION">Edición</option>
          <option value="ELIMINACION">Eliminación</option>
          <option value="CAMBIO_ESTADO">Cambio de Estado</option>
        </select>
        
        <select 
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 outline-none"
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        >
          <option value="">Todas las Entidades</option>
          <option value="PEDIDO">Pedidos</option>
          <option value="PAGO">Pagos</option>
          <option value="USUARIO">Usuarios</option>
          <option value="STOCK">Stock</option>
          <option value="CONFIG">Configuración</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="card overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción / Entidad</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Afectado</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalle</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Anterior / Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 className=" mx-auto text-primary" size={24} />
                    <p className="mt-2 text-sm font-medium text-slate-500">Cargando historial...</p>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron movimientos registrados en este periodo.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const dateObj = new Date(m.fecha);
                  const displayDate = dateObj.toLocaleDateString();
                  const displayTime = dateObj.toLocaleTimeString();
                  const iniciales = m.usuario_nombre ? m.usuario_nombre.substring(0, 2).toUpperCase() : '??';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{displayDate}</div>
                        <div className="text-xs text-slate-500">{displayTime}</div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{iniciales}</div>
                          <span className="text-sm font-medium">{m.usuario_nombre || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <ActionBadge type={m.accion} label={m.accion} />
                          <span className="text-xs text-slate-400 font-medium">{m.entidad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-primary">{m.entidad_id || '-'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-slate-600 line-clamp-2">{m.detalle}</p>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {(m.valores_anteriores && m.valores_nuevos) ? (
                          <div className="flex items-center gap-2 text-xs">
                             <span className="px-2 py-0.5 bg-slate-100 rounded truncate max-w-[100px] border border-slate-200" title={JSON.stringify(m.valores_anteriores)}>
                               {extractFieldValue(m.valores_anteriores, 'Anterior')}
                             </span>
                             <ArrowRight size={12} className="text-slate-400 shrink-0" />
                             <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded truncate max-w-[100px] border border-green-200" title={JSON.stringify(m.valores_nuevos)}>
                               {extractFieldValue(m.valores_nuevos, 'Nuevo')}
                             </span>
                          </div>
                        ) : m.valores_nuevos ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs border border-green-200">Nuevo Registro</span>
                        ) : m.valores_anteriores ? (
                           <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs border border-red-200">Registro Eliminado</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ type, label }: { type: string, label: string }) {
  let styleClass = 'bg-slate-100 text-slate-700';
  if (type === 'CREACION') styleClass = 'bg-purple-100 text-purple-700';
  if (type === 'EDICION') styleClass = 'bg-blue-100 text-blue-700';
  if (type === 'ELIMINACION') styleClass = 'bg-red-100 text-red-700';
  if (type === 'CAMBIO_ESTADO') styleClass = 'bg-emerald-100 text-emerald-700';

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-bold tracking-wide",
      styleClass
    )}>
      {label}
    </span>
  );
}


