import React from 'react';
import { formatCurrency } from '../lib/utils';

interface ReceiptProps {
  order: any;
  payments: any[];
  config: any;
  isAccountStatement?: boolean;
}

export const ReceiptDocument = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ order, payments, config, isAccountStatement = false }, ref) => {
    
    return (
      <div 
        ref={ref} 
        style={{
          width: '560px', /* Mobile friendly width, fits easily with no horizontal scroll if scaled */
          minHeight: '800px',
          margin: '0 auto',
          fontFamily: "'Inter', sans-serif",
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '752px' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
            {/* Logo Box */}
            <div style={{ width: '35%', padding: '24px', borderRight: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '24px', fontWeight: '900', borderRadius: '8px', letterSpacing: '1px' }}>
                    LOGO
                  </div>
                )}
            </div>
            {/* Business Data Box */}
            <div style={{ width: '65%', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <h1 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                    {config?.nombre_tienda || 'DATOS DEL NEGOCIO'}
                </h1>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    <span style={{color: '#94a3b8'}}>DIRECCIÓN:</span> {config?.direccion || 'NO REGISTRADA'}
                </p>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    <span style={{color: '#94a3b8'}}>TELÉFONO:</span> {config?.whatsapp || 'NO REGISTRADO'}
                </p>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    <span style={{color: '#94a3b8'}}>PEDIDO:</span> #{order?.id_pedido}
                </p>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', margin: '0', textTransform: 'uppercase' }}>
                    <span style={{color: '#94a3b8'}}>FECHA EMISIÓN:</span> {new Date().toLocaleDateString()}
                </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flexGrow: 1 }}>
            
            {/* Left Column (Detalles) */}
            <div style={{ width: '55%', padding: '24px', borderRight: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px', color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase' }}>CATEGORÍA / SERVICIO:</p>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', margin: '0', textTransform: 'uppercase' }}>{order?.tipo_trabajo}</p>
                </div>

                <div style={{ marginBottom: '30px', flexGrow: 1 }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase' }}>DETALLES DEL PEDIDO:</p>
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #e2e8f0', minHeight: '300px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '500', color: '#334155', margin: '0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {order?.descripcion || '- Sin descripción -'}
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '2px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px', color: '#94a3b8' }}>CLIENTE:</span>
                       <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{order?.cliente_nombre}</span>
                    </div>
                </div>
            </div>

            {/* Right Column (Finanzas) */}
            <div style={{ width: '45%', padding: '0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
                <div style={{ padding: '24px', borderBottom: '2px solid #cbd5e1' }}>
                     <h2 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#0f172a', margin: '0 0 24px 0', textAlign: 'center', textTransform: 'uppercase' }}>
                         FINANZAS
                     </h2>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', margin: '0 0 4px 0', letterSpacing: '1px' }}>TOTAL</p>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatCurrency(order?.precio_total || 0)}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', margin: '0 0 4px 0', letterSpacing: '1px' }}>ABONADO</p>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#10b981', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatCurrency(order?.total_pagado || 0)}</p>
                    </div>

                    {order?.saldo <= 0 ? (
                        <div style={{ margin: '16px 0', textAlign: 'center', padding: '16px', backgroundColor: '#ecfdf5', border: '2px dashed #10b981', borderRadius: '8px' }}>
                             <p style={{ fontSize: '9px', fontWeight: '900', color: '#059669', margin: '0 0 4px 0', letterSpacing: '1px' }}>SALDO PENDIENTE</p>
                             <div style={{ marginTop: '12px' }}>
                               <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', color: '#10b981', border: '2px solid #10b981', padding: '4px 8px', borderRadius: '4px', transform: 'rotate(-5deg)' }}>
                                   LIBRE DE DEUDA
                               </span>
                             </div>
                        </div>
                    ) : (
                        <div style={{ margin: '16px 0', padding: '16px', backgroundColor: '#fff1f2', border: '2px solid #fecdd3', borderRadius: '8px' }}>
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#f43f5e', margin: '0 0 4px 0', letterSpacing: '1px' }}>SALDO PENDIENTE</p>
                            <p style={{ fontSize: '18px', fontWeight: '900', color: '#e11d48', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {formatCurrency(order?.saldo || 0)}
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px', flexGrow: 1 }}>
                     <p style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '2px', color: '#94a3b8', margin: '0 0 16px 0', textAlign: 'center', textTransform: 'uppercase' }}>PAGOS ANTERIORES</p>
                     {payments && payments.length > 0 ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {payments.map((p, idx) => (
                                 <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                         <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>
                                           { (p.fecha || p.created_at) && !isNaN(new Date(p.fecha || p.created_at).getTime()) ? new Date(p.fecha || p.created_at).toLocaleDateString() : '' }
                                         </span>
                                         <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', color: '#475569', textTransform: 'uppercase' }}>{p.tipo_pago}</span>
                                     </div>
                                     <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                         +{formatCurrency(p.monto)}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#94a3b8', margin: '0' }}>No hay registros</p>
                         </div>
                     )}
                </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '2px solid #cbd5e1', backgroundColor: '#0f172a', padding: '24px', textAlign: 'center', color: '#ffffff' }}>
               <p style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                   DATOS DE CONTACTO
               </p>
               <p style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
                   {config?.texto_pie_recibo || 'PÁGINA WEB - FACEBOOK - INSTAGRAM - CORREO'}
               </p>
               {/* AFIP Disclosure - Documento no válido como factura */}
               <p style={{ fontSize: '6px', fontWeight: '700', color: '#64748b', margin: '0', letterSpacing: '1px', textTransform: 'uppercase' }}>
                   DOCUMENTO NO VÁLIDO COMO FACTURA - COMPROBANTE DE USO INTERNO
               </p>
          </div>

        </div>
      </div>
    );
  }
);

