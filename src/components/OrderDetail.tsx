import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  ArrowLeft, 
  Edit, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Zap, 
  Truck, 
  Calendar, 
  FileText, 
  PlusCircle, 
  CreditCard, 
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  X,
  MessageCircle,
  ExternalLink,
  Share2,
  Printer,
  Clock,
  Smartphone,
  ChevronRight,
  Package,
  History,
  TrendingUp,
  DollarSign,
  Download
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { apiService } from '@/src/services/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { PERMISSIONS } from '../types/permissions';
import { OrderStatus } from '@/src/types';
import { ReceiptDocument } from './ReceiptDocument';
import { supabase } from '../lib/supabase';

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [paymentData, setPaymentData] = useState({
    monto: 0,
    tipo_pago: 'Transferencia',
    observaciones: ''
  });

  const [orderStatuses, setOrderStatuses] = useState<string[]>([
    'FALTA DISEÑAR',
    'PREPARACIÓN',
    'EN IMPRESIÓN',
    'POSPROCESADO',
    'EMPAQUETADO',
    'ENTREGADO'
  ]);

  const [appConfig, setAppConfig] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const loadOrderData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      let { data: stData } = await supabase
        .from('diccionario_estados_pedido')
        .select('nombre_estado')
        .order('nivel_prioridad', { ascending: true });

      if (!stData || stData.length === 0) {
        const { data: st2 } = await supabase
          .from('diccionario_estados_pedidos')
          .select('nombre_estado')
          .order('nivel_prioridad', { ascending: true });
        if (st2 && st2.length > 0) stData = st2;
      }

      if (stData && stData.length > 0) {
        setOrderStatuses(stData.map((s: any) => s.nombre_estado));
      }

      const found = await apiService.getOrderById(id);
      if (found) {
        setOrder(found);
        const paymentHistory = await apiService.getPayments(found.id_pedido);
        setPayments(paymentHistory);

        if (found.vendedor) {
           const { data } = await supabase.from('perfiles_locales').select('*').eq('email', found.vendedor).maybeSingle();
           if (data) setSellerProfile(data);
        }
      }
      
      const conf = await apiService.getSystemConfig();
      if(conf) setAppConfig(conf);

    } catch (error) {
      console.error("Error al cargar datos del pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (isAccountStatement: boolean = false) => {
    if (!receiptRef.current) return;
    setIsGeneratingPDF(true);
    try {
      // Usamos un iframe para aislar el HTML del recibo de los estilos globales de Tailwind (que usan oklch y rompen html2canvas)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Iframe no disponible");
      
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #ffffff; }
              *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e2e8f0; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              .items-center { align-items: center; }
              .gap-4 { gap: 1rem; }
              .w-20 { width: 5rem; }
              .h-20 { height: 5rem; }
              .rounded-2xl { border-radius: 1rem; }
              .object-contain { object-fit: contain; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .pb-8 { padding-bottom: 2rem; }
              .mb-8 { margin-bottom: 2rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-16 { margin-top: 4rem; }
              .pt-8 { padding-top: 2rem; }
              .mb-4 { margin-bottom: 1rem; }
              .p-10 { padding: 2.5rem; }
              .p-4 { padding: 1.5rem; }
              .p-4 { padding: 1rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .w-\\[800px\\] { width: 800px; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .gap-5 { gap: 2rem; }
              .col-span-2 { grid-column: span 2 / span 2; }
              .w-full { width: 100%; }
              .text-left { text-align: left; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
              .pr-4 { padding-right: 1rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-\\[10px\\] { font-size: 10px; line-height: 14px; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
              .text-6xl { font-size: 3.75rem; line-height: 1; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }
              .font-bold { font-weight: 900; }
              .tracking-tight { letter-spacing: -0.025em; }
              .tracking-tighter { letter-spacing: -0.05em; }
              .tracking-widest { letter-spacing: 0.1em; }
              .tracking-\\[0\\.2em\\] { letter-spacing: 0.2em; }
              .uppercase { text-transform: uppercase; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .ml-2 { margin-left: 0.5rem; }
              .italic { font-style: italic; }
              .relative { position: relative; }
              .absolute { position: absolute; }
              .overflow-hidden { overflow: hidden; }
              .z-10 { z-index: 10; }
              .top-1\\/2 { top: 50%; }
              .left-1\\/2 { left: 50%; }
              .-translate-x-1\\/2 { transform: translateX(-50%) translateY(-50%) rotate(-12deg); }
              .opacity-10 { opacity: 0.1; }
              .pointer-events-none { pointer-events: none; }
              .rounded-2xl shadow-sm { border-radius: 1.5rem; }
              ul { list-style: none; margin: 0; padding: 0; }
              table { border-collapse: collapse; width: 100%; border-spacing: 0; text-indent: 0; }
            </style>
          </head>
          <body>
            ${receiptRef.current.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Permitir que las imágenes se carguen si las hay
      await new Promise(resolve => setTimeout(resolve, 500));

      const elementToRender = iframeDoc.body.firstElementChild as HTMLElement;
      if (!elementToRender) throw new Error("Contenido no encontrado");

      const canvas = await html2canvas(elementToRender, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${isAccountStatement ? 'Estado_Cuenta' : 'Recibo'}_Pedido_${order.id_pedido}.pdf`);
      toast.success('Documento PDF generado correctamente.');
      
      // Limpiar iframe
      document.body.removeChild(iframe);
    } catch (err) {
      console.error('Error generating PDF', err);
      toast.error('Ocurrió un error al generar el PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await apiService.appendDescription(order.id_pedido, newNote);
      if (res?.success) {
        setNewNote('');
        toast.success("Nota agregada correctamente");
        await loadOrderData();
      } else {
        toast.error("Error al agregar el detalle");
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === order.estado_pedido) return;
    setIsUpdatingStatus(true);
    try {
      const res = await apiService.updateOrderStatus(order.id_pedido, newStatus);
      if (res?.success) {
        toast.success(`Estado actualizado: ${newStatus}`);
        await loadOrderData();
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Simulación de usuario con permisos
  const currentUser = {
    name: 'Admin G3D',
    role: 'Administrador',
    permissions: ['CAN_EDIT_ORDERS']
  };

  const canEditOrder = currentUser.role === 'Administrador' || currentUser.permissions.includes('CAN_EDIT_ORDERS');

  const handleEditOrder = () => {
    if (!canEditOrder) {
      toast.error("No tienes permisos para editar pedidos.");
      return;
    }
    navigate(`/pedidos/editar/${order.id_pedido}`);
  };

  const handleAddPayment = async () => {
    const monto = Number(paymentData.monto);
    if (isNaN(monto) || monto <= 0) {
      toast.warning("Por favor ingrese un monto válido mayor a 0");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await apiService.addPayment({
        id_pedido: order.id_pedido,
        monto: monto,
        tipo_pago: paymentData.tipo_pago,
        observaciones: paymentData.observaciones
      });

      if (res?.success) {
        toast.success("Pago registrado correctamente");
        setShowPaymentModal(false);
        setPaymentData({ monto: 0, tipo_pago: 'Transferencia', observaciones: '' });
        await loadOrderData();
        
        // Generar automáticamente el recibo luego de registrar un pago
        setTimeout(() => {
          generatePDF(false);
        }, 800);
      } else {
        toast.error("Error al registrar pago", { description: res?.error || 'Error desconocido' });
      }
    } catch (error) {
      console.error("Error in handleAddPayment:", error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'EN PROCESO':
      case 'EN FABRICACIÓN':
        return 'bg-blue-500 text-white';
      case 'FALTA DISEÑAR':
        return 'bg-rose-500 text-white';
      case 'DISEÑADO':
        return 'bg-amber-500 text-white';
      case 'ENTREGADO':
        return 'bg-emerald-500 text-white';
      case 'PENDIENTE ENTREGA':
        return 'bg-slate-900 text-white shadow-sm border border-slate-700';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const openWhatsApp = () => {
    const phone = order.cliente_telefono?.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${order.cliente_nombre}, te escribimos de G3D sobre tu pedido #${order.id_pedido}. El estado actual es: ${order.estado_pedido}.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const openMap = () => {
    if (order.lat && order.lng) {
      window.open(`https://www.google.com/maps?q=${order.lat},${order.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(order.cliente_direccion)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className=" text-primary" size={48} />
          <p className="text-slate-500 font-bold  uppercase tracking-widest text-xs">Cargando Tablero...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-5 text-center bg-slate-50 h-full flex flex-col items-center justify-center">
        <AlertCircle size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Pedido no encontrado</h2>
        <p className="text-slate-500 mt-2">El pedido que buscas no existe o fue eliminado.</p>
        <button onClick={() => navigate('/pedidos')} className="mt-6 flex items-center gap-2 bg-slate-900 text-white shadow-sm border border-slate-700 px-6 py-3 rounded-xl font-bold  transition-colors duration-150">
          <ArrowLeft size={20} />
          Volver al listado
        </button>
      </div>
    );
  }

  const paymentPercentage = Math.min(100, (order.total_pagado / (order.precio_total || 1)) * 100);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Header Premium */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-4 sm:px-8 py-5 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/pedidos')}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors duration-150 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 "
          >
            <ArrowLeft size={28} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pedido #{order.id_pedido}</h2>
              <span className={cn(
                "px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-widest shadow-sm",
                getStatusColor(order.estado_pedido)
              )}>
                {order.estado_pedido}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tighter">
              <span className="flex items-center gap-1.5"><Calendar size={14} /> 
                { (order.fecha_creacion || order.created_at) && !isNaN(new Date(order.fecha_creacion || order.created_at).getTime()) 
                    ? new Date(order.fecha_creacion || order.created_at).toLocaleDateString() 
                    : '-' }
              </span>
              <span className="flex items-center gap-1.5"><User size={14} /> {order.vendedor}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={openWhatsApp}
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-bold  transition-colors duration-150 shadow-lg shadow-green-200 dark:shadow-green-900/20"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button 
            onClick={handleEditOrder}
            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-900 text-white shadow-sm border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:opacity-90 transition-colors duration-150 shadow-lg shadow-slate-200 dark:shadow-black/20"
          >
            <Edit size={18} />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-1 hidden sm:block"></div>
          <button 
            className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors duration-150"
            title="Compartir"
          >
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Hidden Receipt Component for PDF generation */}
      <ReceiptDocument 
        ref={receiptRef} 
        order={order} 
        payments={payments} 
        config={sellerProfile ? {
          nombre_tienda: sellerProfile.nombre_negocio || appConfig?.nombre_tienda,
          logo_url: sellerProfile.logo_url || appConfig?.logo_url,
          whatsapp: sellerProfile.telefono_negocio || sellerProfile.telefono_personal || appConfig?.whatsapp,
          direccion: sellerProfile.direccion_negocio || sellerProfile.direccion_personal,
          texto_pie_recibo: appConfig?.texto_pie_recibo,
        } : appConfig} 
        isAccountStatement={true} 
      />

      <main className="p-4 sm:p-5 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Timeline de Estados Interactiva */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-primary" />
              Línea de Tiempo del Pedido
            </h3>
            {isUpdatingStatus && <div className="flex items-center gap-2 text-primary font-bold text-[10px] "><Loader2 size={12} className="" /> ACTUALIZANDO...</div>}
          </div>
          
          <div className="flex items-center min-w-[800px] px-4">
            {(() => {
              const currentStatusUpper = order.estado_pedido?.toUpperCase();
              const currentIndex = orderStatuses.findIndex(s => s.toUpperCase() === currentStatusUpper);

              return orderStatuses.map((status, index) => {
                const isActive = currentIndex === index;
                const isPast = currentIndex > index;
                
                return (
                  <React.Fragment key={status}>
                    <div 
                      onClick={() => {
                        if (hasPermission(PERMISSIONS.PEDIDOS.ACCEDER_PEDIDOS.id)) {
                          handleStatusChange(status as OrderStatus);
                        } else {
                          toast.error("No tienes permiso para cambiar el estado.");
                        }
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-3 cursor-pointer group transition-colors duration-150",
                        isActive ? "scale-110" : "",
                        !hasPermission(PERMISSIONS.PEDIDOS.ACCEDER_PEDIDOS.id) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "size-10 rounded-2xl flex items-center justify-center border-2 transition-colors duration-150",
                        isActive ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : 
                        isPast ? "bg-emerald-500 border-emerald-500 text-white font-bold shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-600"
                      )}>
                        {isPast ? <CheckCircle2 size={18} /> : <span>{index + 1}</span>}
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider text-center whitespace-nowrap",
                        isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )}>
                        {status}
                      </span>
                      {isActive && <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full border-2 border-white dark:border-slate-900 animate-ping"></div>}
                    </div>
                    {index < orderStatuses.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 bg-slate-100 dark:bg-white/5 relative overflow-hidden">
                        <div className={cn(
                          "absolute inset-0 bg-primary transition-colors duration-150 duration-1000",
                          currentIndex >= index + 1 ? "w-full" : "w-0"
                        )}></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </section>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          
          {/* Card: Detalles del Producto (Grande) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-5 text-primary/5 group- transition-colors duration-150">
                <Package size={120} />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-2">
                  <Zap size={14} className="text-primary" />
                  Especificaciones del Trabajo
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Categoría / Tipo</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{order.tipo_trabajo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cantidad Solicitada</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {order.cantidad} 
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">unidades</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Fecha Prometida</p>
                      <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 self-start inline-flex">
                        <Clock size={16} className="text-primary" />
                        <p className="text-sm font-bold text-primary">{order.fecha_entrega}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Empresa / Vendedor</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{order.vendedor}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Peso Estimado</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {order.peso_kg || 0}
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">KG</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Volumen</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {order.volumen_m3 || 0}
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">M³</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Ítems del Pedido</p>
                  
                  {order.items && order.items.length > 0 ? (
                    <div className="grid gap-3">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Item {i + 1} 
                              {item.insumo && <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] uppercase tracking-widest">{item.insumo.nombre}</span>}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                              x{item.cantidad}
                            </span>
                          </div>
                          <p className="text-sm italic text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                            {item.descripcion_custom || 'Sin descrpción particular'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 italic text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                      "{order.descripcion || 'Sin descripción detallada'}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bitácora de Notas Interactiva */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  Bitácora de Producción
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm p-4 h-24 transition-colors duration-150 resize-none outline-none font-medium text-slate-700 dark:text-slate-200" 
                    placeholder="Escribe un avance técnico o nota interna..." 
                  />
                  <button 
                    onClick={handleAddNote}
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-slate-900 text-white shadow-sm border border-slate-700 rounded-lg  transition-colors duration-150 shadow-lg shadow-primary/20 disabled:opacity-0 disabled:scale-95"
                  >
                    {isSubmittingNote ? <Loader2 size={16} className="" /> : <Save size={16} />}
                  </button>
                </div>
                
                {/* Visualización de notas combinadas */}
                <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const content = order.notas_tecnicas || '';
                    const parts = content.split(/\n\[| \/\/\/ /);
                    
                    if (parts.length <= 1 && content.length < 5) return <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-4">No hay entradas adicionales en la bitácora.</p>;

                    return parts.reverse().map((entry: string, idx: number) => {
                      const isNewFormat = entry.includes(']:');
                      let timestamp = 'Nota Anterior';
                      let noteContent = entry;

                      if (isNewFormat) {
                        const [time, ...rest] = entry.split(']:');
                        timestamp = time.replace('[', '');
                        noteContent = rest.join(']:');
                      }

                      return (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-[6px] border-primary/20 hover:border-primary transition-colors duration-150 animate-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Clock size={10} className="text-primary" />
                               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{timestamp}</span>
                             </div>
                             {isNewFormat && <span className="text-[8px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">LOG</span>}
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{noteContent}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            
            {/* Card: Cliente (Compacta e Interactiva) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 shadow-sm group">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Smartphone size={14} className="text-primary" />
                Contacto del Cliente
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {order.cliente_nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{order.cliente_nombre}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{order.cliente_telefono || 'Sin teléfono'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => order.cliente_telefono && window.open(`tel:${order.cliente_telefono}`)}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-150 text-slate-600 dark:text-slate-300 group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-slate-400 group-hover/btn:text-primary" />
                      <span className="text-xs font-bold">Llamar Ahora</span>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => order.cliente_email && window.open(`mailto:${order.cliente_email}`)}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-150 text-slate-600 dark:text-slate-300 group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-slate-400 group-hover/btn:text-primary" />
                      <span className="text-xs font-bold">Enviar Email</span>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={openMap}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-150 text-slate-600 dark:text-slate-300 group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-slate-400 group-hover/btn:text-primary" />
                      <span className="text-xs font-bold truncate max-w-[120px]">{order.cliente_direccion || 'Ver en Mapa'}</span>
                    </div>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card: Módulo Financiero (Visual) */}
            <div className="bg-slate-900 p-5 rounded-2xl shadow-sm shadow-md shadow-slate-200 dark:shadow-black/40 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={80} />
              </div>
              
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-500" />
                Resumen Financiero
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-end justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Venta Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(order.precio_total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Abonado</p>
                    <p className="text-base font-bold text-emerald-400">+{formatCurrency(order.total_pagado)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Progreso de Pago</span>
                    <span className={cn(paymentPercentage === 100 ? "text-emerald-400" : "text-amber-400")}>{paymentPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-colors duration-150 duration-1000",
                        paymentPercentage === 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                      )} 
                      style={{ width: `${paymentPercentage}%` }} 
                    />
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl flex flex-col items-center justify-center gap-1",
                  order.saldo > 0 ? "bg-rose-500/20 border border-rose-500/20" : "bg-emerald-500/20 border border-emerald-500/20"
                )}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Saldo Pendiente</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    order.saldo > 0 ? "text-rose-400" : "text-emerald-400"
                  )}>
                    {formatCurrency(order.saldo)}
                  </p>
                </div>

                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-4 rounded-2xl bg-white text-slate-900 font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-colors duration-150 flex items-center justify-center gap-2  mb-3"
                >
                  <CreditCard size={16} />
                  Registrar Pago
                </button>
                <button 
                  onClick={() => generatePDF(true)}
                  disabled={isGeneratingPDF}
                  className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Generar Estado de Cuenta del Pedido"
                >
                  <Download size={14} />
                  {isGeneratingPDF ? 'Generando PDF...' : 'Descargar Estado de Cuenta'}
                </button>
              </div>
            </div>

            {/* Card: Historial de Pagos (Compacta) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Últimos Cobros</h3>
              <div className="space-y-3">
                {payments.slice().reverse().map((p) => (
                  <div key={p.id_pago} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 group hover:border-primary/20 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center p-0">
                        <DollarSign size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{p.tipo_pago}</p>
                        { (p.fecha || p.created_at) && !isNaN(new Date(p.fecha || p.created_at).getTime()) ? (
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            {new Date(p.fecha || p.created_at).toLocaleDateString()}
                          </p>
                        ) : null }
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(p.monto)}</p>
                      <button 
                        onClick={() => generatePDF(false)}
                        className="text-[8px] font-bold text-primary uppercase opacity-60 hover:opacity-100"
                        title="Descargar este recibo"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-[10px] italic text-slate-400 dark:text-slate-500 text-center py-4">No hay pagos registrados aún.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Pago Estilizado */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5 animate-in zoom-in-95 duration-300">
            <div className="p-5 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Registrar Cobro</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Pedido #{order.id_pedido}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="size-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Importe a Recibir</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</div>
                  <input 
                    type="number" 
                    value={paymentData.monto || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentData(prev => ({ ...prev, monto: val === '' ? 0 : parseFloat(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-6 rounded-2xl shadow-sm bg-slate-50 dark:bg-slate-800 border-none text-4xl font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 transition-colors duration-150"
                    placeholder="0"
                  />
                </div>
                {order.saldo > 0 && (
                  <button 
                    onClick={() => setPaymentData(prev => ({ ...prev, monto: order.saldo }))}
                    className="text-[10px] font-bold text-primary hover:underline ml-1"
                  >
                    Saldar total: {formatCurrency(order.saldo)}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Método</label>
                  <select 
                    value={paymentData.tipo_pago}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, tipo_pago: e.target.value }))}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold focus:ring-4 focus:ring-primary/10 text-slate-700 dark:text-slate-200"
                  >
                    <option>Transferencia</option>
                    <option>Efectivo</option>
                    <option>Mercado Pago</option>
                    <option>Tarjeta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Referencia</label>
                  <input 
                    type="text" 
                    value={paymentData.observaciones}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold focus:ring-4 focus:ring-primary/10 text-slate-700 dark:text-slate-200"
                    placeholder="Ej: Seña"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-white/5">
              <button 
                onClick={handleAddPayment}
                disabled={isSubmittingPayment || !paymentData.monto}
                className="w-full py-6 rounded-2xl shadow-sm bg-slate-900 text-white shadow-sm border border-slate-700 text-lg font-bold uppercase tracking-[0.2em] shadow-md shadow-primary/30 hover:scale-[1.02]  transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmittingPayment ? <Loader2 size={24} className="" /> : <CheckCircle2 size={24} />}
                {isSubmittingPayment ? 'Registrando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


