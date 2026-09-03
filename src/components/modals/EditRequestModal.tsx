import React from "react";

export interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  setNombre: (value: string) => void;
  celular: string;
  setCelular: (value: string) => void;
  direccion: string;
  setDireccion: (value: string) => void;
  planType: "VIP" | "DEMO";
  setPlanType: (value: "VIP" | "DEMO") => void;
  planId: string;
  setPlanId: (value: string) => void;
  pantallas: number;
  setPantallas: (value: number) => void;
  salePlans: any[];
  isSubmitting: boolean;
  onSave: () => void;
  capitalizeName?: (str: string) => string;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  isOpen,
  onClose,
  nombre,
  setNombre,
  celular,
  setCelular,
  direccion,
  setDireccion,
  planType,
  setPlanType,
  planId,
  setPlanId,
  pantallas,
  setPantallas,
  salePlans,
  isSubmitting,
  onSave,
  capitalizeName = (str: string) => str,
}) => {
  if (!isOpen) return null;

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
      <div className="space-y-5">
        {/* Cabecera de Edición */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
              Editando Solicitud Pendiente
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {nombre || "Sin Nombre"}
            </h3>
          </div>
        </div>

        {/* Campos del Cliente */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={(e) => setNombre(capitalizeName(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Número de Celular
            </label>
            <input
              type="text"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
              placeholder="Ej. +5491122334455"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Dirección
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
              placeholder="Ej. Av. de Mayo 123, CABA"
            />
          </div>

          {/* Tipo de Membresía (VIP o DEMO) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Tipo de Membresía
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanType("DEMO");
                  const demoPlans = salePlans.filter((p) => !p.archived && p.name.toLowerCase().includes("demo"));
                  if (demoPlans.length > 0) {
                    setPlanId(demoPlans[0].id);
                    setPantallas(demoPlans[0].screens || 1);
                  } else {
                    setPlanId("");
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  planType === "DEMO"
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanType("VIP");
                  const vipPlans = salePlans.filter((p) => !p.archived && !p.name.toLowerCase().includes("demo"));
                  if (vipPlans.length > 0) {
                    setPlanId(vipPlans[0].id);
                    setPantallas(vipPlans[0].screens || 2);
                  } else {
                    setPlanId("");
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  planType === "VIP"
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                VIP
              </button>
            </div>
          </div>

          {/* Selector de Plan */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Plan Seleccionado
            </label>
            <select
              value={planId}
              onChange={(e) => {
                const val = e.target.value;
                setPlanId(val);
                const pl = salePlans.find((p) => p.id === val);
                if (pl) {
                  setPantallas(pl.screens || (planType === "VIP" ? 2 : 1));
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
            >
              {planType === "VIP"
                ? salePlans
                    .filter((p) => !p.archived && !p.name.toLowerCase().includes("demo"))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price || 0} ARS ({p.months}m)
                      </option>
                    ))
                : salePlans
                    .filter((p) => !p.archived && p.name.toLowerCase().includes("demo"))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price || 0} ARS {p.hours ? `(${p.hours}h)` : p.months ? `(${p.months}m)` : ""}
                      </option>
                    ))}
            </select>
          </div>

          {/* Cantidad de Pantallas */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              Cantidad de Pantallas
            </label>
            <select
              value={pantallas}
              onChange={(e) => setPantallas(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl px-4 py-3 focus:outline-none text-sm min-h-[44px]"
            >
              <option value={1}>1 Pantalla</option>
              <option value={2}>2 Pantallas simultáneas</option>
              <option value={3}>3 Pantallas simultáneas</option>
              <option value={4}>4 Pantallas simultáneas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones de Guardar / Cancelar */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSave}
          className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
};
