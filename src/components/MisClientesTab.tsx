import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Trash2,
  Send,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Pencil,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// Interfaz para el cliente / cuenta IPTV
export interface ClientAccount {
  username: string;
  password?: string;
  nombre_completo?: string;
  celular?: string;
  id_plan_venta?: string | number | null;
  fecha_vencimiento?: string | null;
  limite_pantallas?: number;
  creado_por?: string;
  plan_nombre?: string;
  [key: string]: any;
}

// Interfaz para planes de venta
export interface SalePlan {
  id: string | number;
  name: string;
  price?: number;
  comision?: number;
  screens?: number;
  [key: string]: any;
}

// Props del componente MisClientesTab
export interface MisClientesTabProps {
  /** Lista de clientes (o clientes ya filtrados según el alcance del usuario) */
  clients?: ClientAccount[];
  /** Lista pre-filtrada opcional */
  filteredClients?: ClientAccount[];
  /** Catálogo de planes de venta para resolver nombres y precios */
  salePlans?: SalePlan[];
  /** Indica si el usuario actual es Administrador */
  isAdmin?: boolean;
  /** Función verificadora de permisos */
  hasPermission?: (permission: string) => boolean;
  /** Arreglo opcional con los permisos activos del usuario */
  userPermissions?: string[];
  /** Callback para eliminar uno o varios clientes seleccionados */
  onDeleteClient?: (usernames: string[]) => void;
  /** Callback para iniciar la edición de un cliente */
  onEditClient?: (client: ClientAccount) => void;
  /** Callback para iniciar la renovación de una cuenta */
  onRenewClient?: (client: ClientAccount) => void;
  /** Control opcional de visibilidad de comisiones */
  showCommissions?: boolean;
  /** Callback para alternar visualización de comisiones */
  onToggleCommissions?: () => void;
  /** Cantidad de elementos por página (por defecto 15) */
  initialPageSize?: number;
}

// Subcomponente para visualización y copiado seguro de contraseñas
function PasswordCell({
  value,
  onCopy,
}: {
  value?: string;
  onCopy: (text: string, msg: string) => void;
}) {
  const [show, setShow] = useState(false);
  const passwordText = value || "";

  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="font-mono font-bold tracking-widest text-slate-700 dark:text-slate-300 select-all">
        {show ? passwordText : "••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button
        type="button"
        onClick={() => onCopy(passwordText, "Contraseña copiada")}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="Copiar contraseña"
      >
        <Copy size={12} />
      </button>
    </div>
  );
}

export const MisClientesTab: React.FC<MisClientesTabProps> = React.memo(({
  clients = [],
  filteredClients: externalFilteredClients,
  salePlans = [],
  isAdmin = false,
  hasPermission,
  userPermissions = [],
  onDeleteClient,
  onEditClient,
  onRenewClient,
  showCommissions: controlledShowCommissions,
  onToggleCommissions,
  initialPageSize = 15,
}) => {
  // Estado local para búsqueda y filtro de categoría
  const [mcSearch, setMcSearch] = useState("");
  const [mcFilter, setMcFilter] = useState<"todos" | "activos" | "expirados" | "demos" | "vips">("todos");
  
  // Estado local para selección múltiple
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Estado local de comisiones si no es controlado por props
  const [localShowCommissions, setLocalShowCommissions] = useState(false);
  const isCommissionsVisible = controlledShowCommissions !== undefined ? controlledShowCommissions : localShowCommissions;

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Verificación de permisos para edición y eliminación
  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    if (hasPermission) {
      return hasPermission("Iptv.Clientes.Editar") || hasPermission("Iptv.*");
    }
    return userPermissions.includes("Iptv.Clientes.Editar") || userPermissions.includes("Iptv.*");
  }, [isAdmin, hasPermission, userPermissions]);

  const canDelete = useMemo(() => {
    if (isAdmin) return true;
    if (hasPermission) {
      return hasPermission("Iptv.Clientes.Eliminar") || hasPermission("Iptv.*");
    }
    return userPermissions.includes("Iptv.Clientes.Eliminar") || userPermissions.includes("Iptv.*");
  }, [isAdmin, hasPermission, userPermissions]);

  // Lista base sobre la cual operar
  const baseList = externalFilteredClients && externalFilteredClients.length > 0 && !mcSearch && mcFilter === "todos"
    ? externalFilteredClients
    : clients;

  // Contadores para pestañas rápidas calculados sobre la base total
  const countAll = baseList.length;
  const countActivos = useMemo(() => {
    return baseList.filter(
      (acc) => !acc.fecha_vencimiento || new Date(acc.fecha_vencimiento).getTime() >= Date.now(),
    ).length;
  }, [baseList]);

  const countExpirados = useMemo(() => {
    return baseList.filter(
      (acc) => acc.fecha_vencimiento && new Date(acc.fecha_vencimiento).getTime() < Date.now(),
    ).length;
  }, [baseList]);

  const countDemos = useMemo(() => {
    return baseList.filter((acc) => !acc.id_plan_venta).length;
  }, [baseList]);

  const countVips = useMemo(() => {
    return baseList.filter((acc) => !!acc.id_plan_venta).length;
  }, [baseList]);

  // Filtrado reactivo según búsqueda de texto y filtro de categoría
  const displayedClients = useMemo(() => {
    return baseList.filter((acc) => {
      // 1. Búsqueda por texto (nombre, usuario, celular)
      if (mcSearch.trim()) {
        const query = mcSearch.toLowerCase().trim();
        const textMatches =
          (acc.nombre_completo || "").toLowerCase().includes(query) ||
          (acc.username || "").toLowerCase().includes(query) ||
          (acc.celular || "").toLowerCase().includes(query);
        if (!textMatches) return false;
      }

      // 2. Filtro de estado
      const isExpired = acc.fecha_vencimiento && new Date(acc.fecha_vencimiento).getTime() < Date.now();
      const isDemo = !acc.id_plan_venta;

      if (mcFilter === "activos") return !isExpired;
      if (mcFilter === "expirados") return isExpired;
      if (mcFilter === "demos") return isDemo;
      if (mcFilter === "vips") return !isDemo;
      return true;
    });
  }, [baseList, mcSearch, mcFilter]);

  // Paginación reactiva
  const totalPages = Math.max(1, Math.ceil(displayedClients.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClients = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return displayedClients.slice(start, start + pageSize);
  }, [displayedClients, validCurrentPage, pageSize]);

  // Toggle de selección para todos los visibles
  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const visibleUsernames = paginatedClients.map((acc) => acc.username);
      setSelectedClients((prev) => Array.from(new Set([...prev, ...visibleUsernames])));
    } else {
      const visibleUsernames = paginatedClients.map((acc) => acc.username);
      setSelectedClients((prev) => prev.filter((u) => !visibleUsernames.includes(u)));
    }
  };

  // Toggle de selección individual
  const handleToggleSelectClient = (username: string, checked: boolean) => {
    if (checked) {
      setSelectedClients((prev) => [...prev, username]);
    } else {
      setSelectedClients((prev) => prev.filter((u) => u !== username));
    }
  };

  const handleToggleCommissionsClick = () => {
    if (onToggleCommissions) {
      onToggleCommissions();
    } else {
      setLocalShowCommissions(!localShowCommissions);
    }
  };

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
              Visualiza, busca y copia las credenciales de tus cuentas activas o demos
              (posiblemente ya expiradas) creadas desde tu panel.
            </p>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Buscador de texto */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por cliente, usuario o celular..."
              value={mcSearch}
              onChange={(e) => {
                setMcSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs text-slate-800 dark:text-slate-100"
            />
            {mcSearch && (
              <button
                type="button"
                onClick={() => {
                  setMcSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros rápidos con contadores */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => {
                setMcFilter("todos");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                mcFilter === "todos"
                  ? "bg-slate-900 text-white dark:bg-slate-800"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Todos ({countAll})
            </button>
            <button
              type="button"
              onClick={() => {
                setMcFilter("activos");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                mcFilter === "activos"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Activos ({countActivos})
            </button>
            <button
              type="button"
              onClick={() => {
                setMcFilter("expirados");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                mcFilter === "expirados"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Expirados ({countExpirados})
            </button>
            <button
              type="button"
              onClick={() => {
                setMcFilter("demos");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                mcFilter === "demos"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Solo Demos ({countDemos})
            </button>
            <button
              type="button"
              onClick={() => {
                setMcFilter("vips");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                mcFilter === "vips"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Solo VIPs ({countVips})
            </button>
          </div>
        </div>

        {/* Panel de Acción en Lote para Multiselección */}
        {selectedClients.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Has seleccionado{" "}
                <span className="font-black underline">{selectedClients.length}</span>{" "}
                {selectedClients.length === 1 ? "cliente" : "clientes"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedClients([])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              {canDelete && onDeleteClient && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteClient(selectedClients);
                    setSelectedClients([]);
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-black hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
                >
                  <Trash2 size={13} />
                  Eliminar Seleccionados
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabla de Clientes */}
        <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800">
          {displayedClients.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedClients.length > 0 &&
                        paginatedClients.every((acc) => selectedClients.includes(acc.username))
                      }
                      onChange={(e) => handleSelectAllVisible(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-600 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Cliente / Celular</th>
                  <th className="p-3">Usuario / Contraseña</th>
                  <th className="p-3">Plan Contratado</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">
                    <div className="flex items-center gap-1">
                      <span>Comisión</span>
                      <button
                        type="button"
                        onClick={handleToggleCommissionsClick}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                        title={isCommissionsVisible ? "Ocultar Comisión" : "Ver Comisión"}
                      >
                        {isCommissionsVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </th>
                  <th className="p-3">Precio Plan</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedClients.map((acc) => {
                  const isExpired =
                    acc.fecha_vencimiento &&
                    new Date(acc.fecha_vencimiento).getTime() < Date.now();
                  const isDemo = !acc.id_plan_venta;
                  const isSelected = selectedClients.includes(acc.username);

                  // Obtener datos del plan de venta asignado
                  const assignedPlan = salePlans.find(
                    (p) => String(p.id) === String(acc.id_plan_venta),
                  );
                  const planName = assignedPlan
                    ? assignedPlan.name
                    : acc.id_plan_venta
                      ? `Plan ${acc.id_plan_venta}`
                      : "Demo gratis";
                  const planPrice = assignedPlan ? assignedPlan.price || 0 : 0;
                  const planCommission = assignedPlan ? assignedPlan.comision || 0 : 0;

                  // Formatear fecha de vencimiento
                  let expiryLabel = "Sin Límite";
                  if (acc.fecha_vencimiento) {
                    const d = new Date(acc.fecha_vencimiento);
                    expiryLabel =
                      d.toLocaleDateString() +
                      " " +
                      d.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                  }

                  return (
                    <tr
                      key={acc.username}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-rose-50/40 dark:bg-rose-950/5"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            handleToggleSelectClient(acc.username, e.target.checked)
                          }
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-600 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-left">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">
                            {acc.nombre_completo || "Cliente"}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">
                              {acc.celular || "Sin teléfono"}
                            </p>
                            {acc.celular && (
                              <a
                                href={`https://wa.me/${acc.celular.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md hover:scale-105 transition-transform"
                                title="Contactar por WhatsApp"
                              >
                                <Send size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              U:
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 select-all">
                              {acc.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(acc.username);
                                toast.success("Usuario copiado");
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="Copiar usuario"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              P:
                            </span>
                            <PasswordCell
                              value={acc.password}
                              onCopy={(t, msg) => {
                                navigator.clipboard.writeText(t);
                                toast.success(msg || "Contraseña copiada");
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5 text-left">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                              isDemo
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                            }`}
                          >
                            {planName}
                          </span>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">
                            {acc.limite_pantallas || 2} Pantallas
                          </p>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-400" />
                          <span>{expiryLabel}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {isCommissionsVisible ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            ${planCommission.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 select-none">••••</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        ${planPrice.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                            isExpired
                              ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {isExpired ? "Expirado" : "Activo"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Botón Editar */}
                          {canEdit && onEditClient && (
                            <button
                              type="button"
                              onClick={() => onEditClient(acc)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
                              title="Editar Cliente"
                            >
                              <Pencil size={11} />
                            </button>
                          )}

                          {/* Botón Renovar */}
                          {onRenewClient && (
                            <button
                              type="button"
                              onClick={() => onRenewClient(acc)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                              title="Renovar Cliente"
                            >
                              <RefreshCw size={11} />
                            </button>
                          )}

                          {/* Botón Eliminar */}
                          {canDelete && onDeleteClient && (
                            <button
                              type="button"
                              onClick={() => onDeleteClient([acc.username])}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/50 dark:border-rose-900/30"
                              title="Eliminar Cliente"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users
                size={32}
                className="mx-auto text-slate-300 dark:text-slate-700"
              />
              <p className="text-xs font-bold uppercase tracking-wider">
                No se encontraron clientes
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Prueba cambiando el filtro o realizando una búsqueda diferente.
              </p>
            </div>
          )}
        </div>

        {/* Paginación y Contador de Registros */}
        {displayedClients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span>
                Mostrando{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(
                    (validCurrentPage - 1) * pageSize + 1,
                    displayedClients.length,
                  )}
                </strong>{" "}
                a{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(validCurrentPage * pageSize, displayedClients.length)}
                </strong>{" "}
                de{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {displayedClients.length}
                </strong>{" "}
                clientes
              </span>

              <div className="hidden sm:flex items-center gap-1.5 ml-4">
                <span className="text-[11px]">Por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-300">
                  Página {validCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MisClientesTab.displayName = "MisClientesTab";

export default MisClientesTab;
