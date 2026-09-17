import React, { useState } from "react";
import { toast } from "sonner";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  receiptDetails?: {
    usuarioNombre?: string;
    usuarioRol?: string;
    usuarioEmail?: string;
    fechaEmision?: string;
    comprobanteId?: string;
    totalCobrado?: number;
    detallesCobrados?: Array<{
      cliente_nombre?: string;
      cliente_id?: string;
      plan_nombre?: string;
      comision_total?: number;
      monto_abonado?: number;
      saldo_restante?: number;
    }>;
    totalPendiente?: number;
    detallesPendientes?: Array<{
      cliente_nombre?: string;
      cliente_id?: string;
      plan_nombre?: string;
      comision_total?: number;
      monto_abonado?: number;
      saldo_restante?: number;
    }>;
  } | null;
  generateReceiptFormattedText?: (details: any) => string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  receiptDetails,
  generateReceiptFormattedText,
}) => {
  const [zoomActive, setZoomActive] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  if (!isOpen || (!imageUrl && !receiptDetails)) return null;

  // Si se envían detalles de liquidación oficiales, renderizamos la vista de liquidación
  if (receiptDetails) {
    const handleCopyText = () => {
      if (!generateReceiptFormattedText) return;
      const text = generateReceiptFormattedText(receiptDetails);
      navigator.clipboard.writeText(text);
      toast.success("Resumen formateado copiado al portapapeles.");
    };

    const handleShareWhatsapp = () => {
      if (!generateReceiptFormattedText) return;
      const text = generateReceiptFormattedText(receiptDetails);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            ✕
          </button>

          <div className="space-y-1 pr-6 text-left">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider">
              🧾 Comprobante Oficial de Liquidación
            </span>
            <h4 className="font-black text-lg text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              {receiptDetails?.usuarioNombre || "Usuario XTV"}
            </h4>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Rol: <strong className="text-slate-700 dark:text-slate-300">{receiptDetails?.usuarioRol || "Vendedor"}</strong></span>
              <span>·</span>
              <span>Email: <strong className="text-slate-700 dark:text-slate-300">{receiptDetails?.usuarioEmail}</strong></span>
            </p>
            <p className="text-[10px] text-slate-400">
              Emitido: {receiptDetails?.fechaEmision || new Date().toLocaleString()} · ID: {receiptDetails?.comprobanteId || "CMP-0001"}
            </p>
          </div>

          {/* TABLA DE CLIENTES COBRADOS EN ESTA LIQUIDACIÓN */}
          <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3 text-left">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                <span>✅ Clientes Incluidos en este Pago / Liquidación</span>
              </h5>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Total Abonado: ${receiptDetails?.totalCobrado?.toLocaleString() || 0} ARS
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Plan</th>
                    <th className="p-2.5 text-right">Comisión Total</th>
                    <th className="p-2.5 text-right">Monto Abonado</th>
                    <th className="p-2.5 text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receiptDetails?.detallesCobrados && receiptDetails.detallesCobrados.length > 0 ? (
                    receiptDetails.detallesCobrados.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">
                          {item.cliente_nombre}
                          <span className="block text-[9px] font-normal text-slate-400">ID: {item.cliente_id}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.plan_nombre}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                          ${item.comision_total?.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                          ${item.monto_abonado?.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {item.saldo_restante === 0 ? (
                            <span className="text-emerald-500 text-[10px] uppercase font-black">✓ Saldado</span>
                          ) : (
                            <span className="text-amber-500 text-[10px] uppercase font-black">${item.saldo_restante?.toLocaleString()}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">No hay clientes específicos asignados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA DE CLIENTES CON PAGO PENDIENTE */}
          {receiptDetails?.detallesPendientes && receiptDetails.detallesPendientes.length > 0 && (
            <div className="space-y-2 border-t border-slate-150 dark:border-slate-800 pt-3 text-left">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                  <span>⚠️ Clientes del Usuario Faltantes por Cobrar / Pendientes</span>
                </h5>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Pendiente Total: ${receiptDetails?.totalPendiente?.toLocaleString()} ARS
                </span>
              </div>

              <div className="border border-amber-200 dark:border-amber-950/60 rounded-xl overflow-hidden text-xs bg-amber-50/30 dark:bg-amber-950/10">
                <table className="w-full text-left">
                  <thead className="bg-amber-100/50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-[10px] font-extrabold text-amber-800 dark:text-amber-400 uppercase">
                    <tr>
                      <th className="p-2.5">Cliente</th>
                      <th className="p-2.5">Plan</th>
                      <th className="p-2.5 text-right">Comisión Total</th>
                      <th className="p-2.5 text-right">Ya Abonado</th>
                      <th className="p-2.5 text-right">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30">
                    {receiptDetails.detallesPendientes.map((item, i) => (
                      <tr key={i} className="hover:bg-amber-100/30 dark:hover:bg-amber-950/20">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {item.cliente_nombre}
                          <span className="block text-[9px] font-normal text-slate-400">ID: {item.cliente_id}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.plan_nombre}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                          ${item.comision_total?.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-500">
                          ${item.monto_abonado?.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-black text-amber-600 dark:text-amber-400">
                          ${item.saldo_restante?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPROBANTE DE IMAGEN ADJUNTO */}
          {imageUrl && (
            <div className="space-y-1.5 border-t border-slate-150 dark:border-slate-800 pt-3 text-left">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                📷 Captura de Transferencia / Garantía Adjunta
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-[300px] p-2">
                <img
                  src={imageUrl}
                  alt="Comprobante de Pago Adjunto"
                  className="max-h-[280px] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2 flex flex-wrap gap-2">
            {generateReceiptFormattedText && (
              <>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  📋 Copiar Resumen
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsapp}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  💬 Compartir en WhatsApp
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs rounded-xl transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si es un visualizador avanzado de imagen/voucher con Zoom Inteligente
  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 cursor-default animate-fade-in"
      onClick={() => {
        setZoomActive(false);
        onClose();
      }}
    >
      <div
        className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-3xl max-w-xl w-full relative overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del visualizador */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-left">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Visualizador Inteligente
            </h4>
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              Auditoría Avanzada de Voucher
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-white font-black text-sm px-3 py-1.5 hover:bg-slate-900 rounded-xl transition-all border border-slate-800"
            onClick={() => {
              setZoomActive(false);
              onClose();
            }}
          >
            Cerrar ×
          </button>
        </div>

        {/* Barra de herramientas */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setZoomActive(!zoomActive);
                toast.info(
                  !zoomActive
                    ? "🔍 Zoom Inteligente activado. Usa el puntero en PC o el tacto en móvil."
                    : "Vista estándar completa restaurada.",
                );
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                zoomActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              <span className="text-xs">🔍</span>
              {zoomActive ? "Desactivar Zoom" : "Activar Zoom"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!imageUrl) return;
                const loadingToast = toast.loading("Generando y preparando PNG nativo...");
                try {
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.drawImage(img, 0, 0);
                      const pngUrl = canvas.toDataURL("image/png");
                      const link = document.createElement("a");
                      link.download = `comprobante_${Date.now()}.png`;
                      link.href = pngUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.dismiss(loadingToast);
                      toast.success("📥 ¡Comprobante PNG descargado con éxito!");
                    } else {
                      toast.dismiss(loadingToast);
                      toast.error("No se pudo iniciar el canvas de conversión.");
                    }
                  };
                  img.onerror = () => {
                    toast.dismiss(loadingToast);
                    const link = document.createElement("a");
                    link.download = `comprobante_respaldo_${Date.now()}.png`;
                    link.href = imageUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Descargado enlace del comprobante.");
                  };
                  img.src = imageUrl;
                } catch (err) {
                  toast.dismiss(loadingToast);
                  toast.error("Error al procesar la descarga.");
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-black uppercase bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <span>📥</span> Descargar PNG
            </button>
          </div>

          <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
            {zoomActive ? "🔍 Inspect Active" : "👁️ Standard View"}
          </div>
        </div>

        {/* Contenido principal con/sin zoom */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 min-h-[40vh]">
          {!zoomActive ? (
            <div className="space-y-2.5">
              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-center relative group overflow-hidden">
                <img
                  src={imageUrl || ""}
                  className="max-h-[55vh] w-auto object-contain rounded-xl select-none"
                  alt="Voucher de pago"
                />
              </div>
              <div className="text-center p-3 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <p className="text-[11px] font-bold text-slate-400">
                  💡 ¿Quieres auditar firmas, importes o fechas borrosas?
                  Presiona el botón <span className="text-cyan-400">🔍 Activar Zoom</span> arriba.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Celular / Táctil */}
              <div className="block md:hidden space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-2xl text-[10px] font-bold text-amber-300 text-center uppercase tracking-wide">
                  📱 Modo Móvil: Desliza el dedo abajo para ver la lupa arriba
                </div>

                <div className="grid grid-rows-2 gap-3 h-[60vh]">
                  <div className="bg-slate-950 rounded-2xl border-2 border-cyan-500 relative overflow-hidden shadow-inner flex items-center justify-center">
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                      <div className="absolute w-8 h-8 rounded-full border border-rose-500/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                      </div>
                      <div className="absolute w-12 h-[1px] bg-rose-500/30"></div>
                      <div className="absolute h-12 w-[1px] bg-rose-500/30"></div>
                      <span className="absolute bottom-1 right-2 bg-slate-900/80 px-2 py-0.5 rounded-md text-[9px] font-black text-cyan-400 border border-slate-800 uppercase">
                        Visor Lupa
                      </span>
                    </div>

                    <img
                      src={imageUrl || ""}
                      className="absolute w-full h-full object-contain pointer-events-none"
                      style={{
                        transform: "scale(2.2)",
                        transformOrigin: `${touchPosition.x}% ${touchPosition.y}%`,
                        transition: "transform-origin 0.05s ease-out",
                      }}
                      alt="Detalle ampliado"
                    />
                  </div>

                  <div
                    className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
                    onTouchStart={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = ((touch.clientX - rect.left) / rect.width) * 100;
                      const y = ((touch.clientY - rect.top) / rect.height) * 100;
                      setTouchPosition({
                        x: Math.max(0, Math.min(100, x)),
                        y: Math.max(0, Math.min(100, y)),
                      });
                    }}
                    onTouchMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = ((touch.clientX - rect.left) / rect.width) * 100;
                      const y = ((touch.clientY - rect.top) / rect.height) * 100;
                      setTouchPosition({
                        x: Math.max(0, Math.min(100, x)),
                        y: Math.max(0, Math.min(100, y)),
                      });
                    }}
                  >
                    <img
                      src={imageUrl || ""}
                      className="w-full h-full object-contain pointer-events-none opacity-40 select-none pb-2"
                      alt="Voucher táctil"
                    />
                    <div
                      className="absolute w-6 h-6 rounded-full border-2 border-cyan-400 bg-cyan-400/20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                      style={{
                        left: `${touchPosition.x}%`,
                        top: `${touchPosition.y}%`,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PC Escritorio */}
              <div className="hidden md:block space-y-2">
                <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-cyan-300 text-center uppercase tracking-wide">
                  🖥️ Modo PC: Mueve el cursor sobre la imagen para inspeccionar con aumento
                </div>

                <div
                  className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center cursor-crosshair select-none h-[52vh]"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setMousePosition({ x, y });
                  }}
                >
                  <img
                    src={imageUrl || ""}
                    className="w-full h-full object-contain select-none transition-transform duration-75 ease-out"
                    style={{
                      transform: "scale(2.3)",
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    }}
                    alt="Detalle lupa escritorio"
                  />
                  <div className="absolute bottom-2.5 right-3 bg-black/75 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-cyan-400 border border-slate-800 pointer-events-none">
                    Zoom: 2.3x (Inspeccionando)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
          <span>Auditoría XTV</span>
          <span>Comprobante de Pago</span>
        </div>
      </div>
    </div>
  );
};
