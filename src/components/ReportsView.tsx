import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Copy, 
  ExternalLink, 
  Filter,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  User,
  Bug,
  MessageSquare,
  Calendar,
  X,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ReportStatus = 'PENDIENTE' | 'EN REVISIÓN' | 'SOLUCIONADO';
type AppOrigen = 'TODOS' | 'TIENDA_ONLINE' | 'PANEL_CONTROL' | 'APP_MOVIL';

interface Reporte {
  id: string;
  fecha: string;
  usuario_afectado: string;
  codigo_error: string;
  mensaje_tecnico: string;
  comentario_usuario: string;
  app_origen: string;
  estado: ReportStatus;
  pagina?: string;
  metadata?: any;
}

export function ReportsView() {
  const [reports, setReports] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppOrigen>('TODOS');
  const [selectedReport, setSelectedReport] = useState<Reporte | null>(null);
  const [localStatus, setLocalStatus] = useState<ReportStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [viewTab, setViewTab] = useState<'ACTIVOS' | 'HISTORIAL'>('ACTIVOS');

  useEffect(() => {
    if (selectedReport) {
      setLocalStatus(selectedReport.estado);
    } else {
      setLocalStatus(null);
    }
  }, [selectedReport]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await apiService.getReports(filter);
      console.log("Datos recibidos en ReportsView:", data);
      setReports(data);
    } catch (err) {
      console.error("Error al cargar reportes en el componente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();

    // Suscripción en tiempo real a la tabla de reportes
    const channel = supabase
      .channel('reportes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes_sistema' },
        (payload) => {
          console.log("Cambio detectado en reportes_sistema:", payload);
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleCopyToClipboard = () => {
    if (!selectedReport) return;
    const text = `ERROR NOC G3D:
ID: ${selectedReport.id}
APP: ${selectedReport.app_origen}
USUARIO: ${selectedReport.usuario_afectado}
CÓDIGO: ${selectedReport.codigo_error || 'N/A'}
MENSAJE: ${selectedReport.mensaje_tecnico}
COMENTARIO: ${selectedReport.comentario_usuario || 'Sin comentarios'}
PÁGINA: ${selectedReport.pagina || 'N/A'}
METADATA: ${JSON.stringify(selectedReport.metadata || {}, null, 2)}`;
    
    navigator.clipboard.writeText(text);
    alert("Datos copiados para Antigravity. Pégalos en el chat.");
  };

  const handleStatusSave = async () => {
    if (!selectedReport || !localStatus) return;
    
    setUpdating(true);
    const res = await apiService.updateReportStatus(selectedReport.id, localStatus);
    
    if (res.success) {
      const newStatus = localStatus;
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, estado: newStatus } : r));
      setSelectedReport(prev => prev ? { ...prev, estado: newStatus } : null);
      
      // Forzar recarga para asegurar sincronización con DB
      await loadReports();
      
      // Si se solucionó y estamos en la pestaña activos, lo quitamos de la vista actual después de un pequeño delay
      if (newStatus === 'SOLUCIONADO' && viewTab === 'ACTIVOS') {
        setSelectedReport(null);
      }
      
      // Disparar evento para actualizar el sidebar
      window.dispatchEvent(new Event('reports_updated'));
    } else {
      console.error("Falla en guardado de reporte:", res);
      alert(`Error al guardar el estado: ${res.error || 'Intenta de nuevo'}. Revisar consola para más detalles.`);
    }
    setUpdating(false);
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-rose-500 text-white';
      case 'EN REVISIÓN': return 'bg-amber-500 text-white';
      case 'SOLUCIONADO': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getAppIcon = (app: string) => {
    switch (app) {
      case 'TIENDA_ONLINE': return <Globe size={16} />;
      case 'PANEL_CONTROL': return <Monitor size={16} />;
      case 'APP_MOVIL': return <Smartphone size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const filteredReports = reports.filter(r => {
    if (viewTab === 'ACTIVOS') return r.estado !== 'SOLUCIONADO';
    return r.estado === 'SOLUCIONADO';
  });

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
            <div className="size-14 sm:size-16 p-3 bg-rose-500 text-white rounded-[20px] shadow-md shadow-rose-500/20 flex items-center justify-center">
              <Bug size={32} />
            </div>
            Centro de Reportes (NOC)
          </h2>
          <p className="text-slate-500 mt-3 font-bold text-sm sm:text-base">Administración y monitoreo del ecosistema G3D.</p>
        </div>
        <button 
          onClick={loadReports}
          className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary hover:border-primary transition-colors duration-150 shadow-sm "
        >
          <RefreshCw size={24} className={cn(loading && "")} />
        </button>
      </header>

      {/* Selector de Pestañas */}
      <div className="flex gap-5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setViewTab('ACTIVOS'); setSelectedReport(null); }}
          className={cn(
            "pb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-150 relative whitespace-nowrap",
            viewTab === 'ACTIVOS' ? "text-primary" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Reportes Activos
          {viewTab === 'ACTIVOS' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
        </button>
        <button 
          onClick={() => { setViewTab('HISTORIAL'); setSelectedReport(null); }}
          className={cn(
            "pb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-150 relative whitespace-nowrap",
            viewTab === 'HISTORIAL' ? "text-primary" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Historial de Errores
          {viewTab === 'HISTORIAL' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* Filtros de Origen */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {(['TODOS', 'TIENDA_ONLINE', 'PANEL_CONTROL', 'APP_MOVIL'] as AppOrigen[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors duration-150",
              filter === opt 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {opt.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista de Reportes */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className=" text-primary" size={40} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando reportes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {viewTab === 'ACTIVOS' ? '¡Todo en orden!' : 'No hay historial'}
                </p>
                <p className="text-sm text-slate-500">
                  {viewTab === 'ACTIVOS' 
                    ? 'No hay fallas técnicas pendientes de revisión.' 
                    : 'Aún no se han solucionado reportes para archivar.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha / App</th>
                    <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuario Afectado</th>
                    <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Error</th>
                    <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr 
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={cn(
                        "group cursor-pointer transition-colors duration-150 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30",
                        selectedReport?.id === report.id && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                            {format(new Date(report.fecha), 'dd/MM HH:mm')}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-slate-400 uppercase">
                            {getAppIcon(report.app_origen)}
                            {report.app_origen.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{report.usuario_afectado}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <code className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-bold">
                          {report.codigo_error}
                        </code>
                      </td>
                      <td className="p-5 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                          getStatusColor(report.estado)
                        )}>
                          {report.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detalle del Reporte */}
        <div className="space-y-6">
          {selectedReport ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 shadow-md space-y-8 sticky top-5 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Detalle del Error</h3>
                <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Mensaje Técnico</label>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-rose-400 break-all leading-relaxed shadow-inner">
                    {selectedReport.mensaje_tecnico}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Comentario del Usuario</label>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-900 italic flex gap-3">
                    <MessageSquare className="shrink-0 text-amber-400" size={20} />
                    {selectedReport.comentario_usuario || "Sin comentarios adicionales."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Código</label>
                    <span className="text-xs font-bold text-slate-700">{selectedReport.codigo_error}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Página</label>
                    <span className="text-xs font-bold text-slate-700 truncate block" title={selectedReport.pagina || selectedReport.metadata?.page}>
                      {selectedReport.pagina || selectedReport.metadata?.page || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Usuario</label>
                    <span className="text-xs font-bold text-slate-700 truncate block" title={selectedReport.usuario_afectado}>{selectedReport.usuario_afectado}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha</label>
                    <span className="text-xs font-bold text-slate-700">{format(new Date(selectedReport.fecha), 'dd MMM yyyy')}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cambiar Estado</label>
                  <div className="flex gap-2">
                    {(['PENDIENTE', 'EN REVISIÓN', 'SOLUCIONADO'] as ReportStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setLocalStatus(st)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 border-2",
                          localStatus === st 
                            ? st === 'SOLUCIONADO' ? "bg-emerald-500 border-emerald-500 text-white" :
                              st === 'EN REVISIÓN' ? "bg-amber-500 border-amber-500 text-white" :
                              "bg-rose-500 border-rose-500 text-white"
                            : "border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {localStatus !== selectedReport.estado && (
                    <button
                      onClick={handleStatusSave}
                      disabled={updating}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors duration-150 flex items-center justify-center gap-2 mt-2 animate-in fade-in slide-in-from-top-2"
                    >
                      {updating ? <RefreshCw className="" size={16} /> : <CheckCircle2 size={16} />}
                      Guardar Cambio de Estado
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCopyToClipboard}
                  className="w-full py-4 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-colors duration-150 flex items-center justify-center gap-3"
                >
                  <Copy size={20} />
                  Copiar para Antigravity
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
              <div className="size-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                <Filter size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Selecciona un reporte</p>
                <p className="text-xs text-slate-400 mt-1">Haz clic en una fila para ver los detalles técnicos y acciones.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return <RefreshCw className={cn("", className)} size={size} />;
}
