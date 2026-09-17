import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Phone, 
  Clock, 
  FileDown, 
  Info, 
  User, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Truck, 
  Workflow, 
  Layers, 
  Eye, 
  ExternalLink,
  ChevronDown,
  Building,
  Store,
  Printer,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  X,
  Edit
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface PedidoV2 {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  canal: 'tienda' | 'revendedor';
  revendedor_nombre?: string;
  producto_id: string;
  producto_nombre: string;
  variante_id?: string;
  variante_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  comision_plataforma: number;
  comision_influencer: number;
  modalidad: 'inmediata' | 'produccion';
  requiere_sena: boolean;
  sena_monto: number;
  sena_pagada: boolean;
  estado_pago: 'pendiente' | 'señado' | 'pagado_total';
  estado_produccion: 'no_aplica' | 'pendiente_diseno' | 'en_cola' | 'laminando' | 'imprimiendo' | 'post_procesado' | 'listo_taller';
  estado_envio: 'retiro_local' | 'pendiente_flete' | 'en_camino' | 'entregado' | 'cancelado';
  flete_tipo: 'propio' | 'uber_moto' | 'uber_auto' | 'retiro';
  flete_costo: number;
  flete_cobertura?: string;
  fecha_entrega_estimada?: string;
  instrucciones_operario?: string;
  drive_stl_link?: string;
  creado_el: string;
  vendedor_id?: string;
  estado_id?: string;
  estado_nombre?: string;
  estado_color?: string;
}

// Función para parsear y convertir enlaces de Google Drive compartidos en descargas directas
function convertDriveLinkToDirect(url: string): string {
  if (!url) return '';
  // Formatos comunes de Google Drive
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }
  return url;
}

export function OrdersCenterView2() {
  const { session, userRole } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoV2[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [workflowStates, setWorkflowStates] = useState<any[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [canalFilter, setCanalFilter] = useState<'todos' | 'tienda' | 'revendedor'>('todos');
  const [produccionFilter, setProduccionFilter] = useState<string>('todos');
  
  // Detalle & Formulario Modals
  const [selectedPedido, setSelectedPedido] = useState<PedidoV2 | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'fabrica' | 'ventas'>('control');

  // Estado del nuevo pedido
  const [newOrder, setNewOrder] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_direccion: '',
    canal: 'tienda' as 'tienda' | 'revendedor',
    revendedor_nombre: '',
    producto_id: '',
    variante_id: '',
    cantidad: 1,
    precio_personalizado: '',
    flete_tipo: 'retiro' as 'propio' | 'uber_moto' | 'uber_auto' | 'retiro',
    flete_costo: '0',
    flete_cobertura: '',
    sena_pagada: false,
    comision_plataforma: '10',
    comision_influencer: '5',
    estado_id: ''
  });

  // Estado del pedido en edición
  const [editOrder, setEditOrder] = useState({
    id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_direccion: '',
    canal: 'tienda' as 'tienda' | 'revendedor',
    revendedor_nombre: '',
    producto_id: '',
    variante_id: '',
    cantidad: 1,
    precio_personalizado: '',
    flete_tipo: 'retiro' as 'propio' | 'uber_moto' | 'uber_auto' | 'retiro',
    flete_costo: '0',
    flete_cobertura: '',
    estado_id: '',
    drive_stl_link: '',
    instrucciones_operario: ''
  });

  useEffect(() => {
    loadAllData();
  }, [session]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Cargar productos con sus variantes de Supabase
      const { data: prods } = await supabase.from('g3d_productos').select('*');
      const { data: vars } = await supabase.from('g3d_producto_variantes').select('*');
      
      const localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
      
      const resolvedProds = (prods || []).map(p => {
        const extra = localExtras[p.id] || {};
        return {
          ...p,
          variantes: vars?.filter(v => v.producto_id === p.id) || [],
          drive_stl_link: p.drive_stl_link || extra.drive_stl_link || '',
          descripcion_mayorista: p.descripcion_mayorista || extra.descripcion_mayorista || p.descripcion || ''
        };
      });
      setProductos(resolvedProds);

      // 1.5 Cargar estados del diccionario V1 activo
      const { data: dbStatuses } = await supabase
        .from('diccionario_estados_pedido')
        .select('*');
      
      const sortedStatuses = dbStatuses ? [...dbStatuses].sort((a, b) => (a.orden ?? a.nivel_prioridad ?? 0) - (b.orden ?? b.nivel_prioridad ?? 0)) : [];
      setAvailableStatuses(sortedStatuses);

      // Cargar Flujos y Estados de Trabajo
      try {
        const { data: dbWf } = await supabase.from('flujos').select('*');
        setWorkflowsList(dbWf || []);
        const { data: dbWfSt } = await supabase.from('flujo_estados').select('*');
        if (dbWfSt) {
          const sortedWst = [...dbWfSt].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
          setWorkflowStates(sortedWst);
        }
      } catch (err) {
        console.error("Error fetching workflows:", err);
      }

      if (sortedStatuses.length > 0) {
        setNewOrder(prev => ({ ...prev, estado_id: sortedStatuses[0].id }));
      }

      // 2. Cargar Pedidos de la tabla V1 activa en Supabase ('pedidos') de forma transparente
      try {
        const { data: dbOrders, error: dbError } = await supabase
          .from('pedidos')
          .select(`
            *,
            cliente:cliente_id(*),
            vendedor:vendedor_id(id, nombre),
            estado:estado_id(*),
            items:pedido_items(*)
          `)
          .order('fecha_creacion', { ascending: false });

        if (dbError) throw dbError;

        // Leer diccionario de extras simulados de localStorage
        const v2Extras = JSON.parse(localStorage.getItem('g3d_pedidos_v2_extras') || '{}');

        const resolvedOrders: PedidoV2[] = (dbOrders || []).map(o => {
          // Identificador principal: codigo_pedido
          const refId = o.codigo_pedido || o.id;
          const extra = v2Extras[refId] || {};
          
          const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
          const isProduction = o.tipo_trabajo === 'BAJO PEDIDO';
          const senaMontoEst = isProduction ? Math.ceil((o.monto_total || 0) * 0.4) : 0;
          const totalPaid = o.monto_pagado || 0;

          // Derivar estado_pago si no está salvado en extras
          let defaultEstadoPago: 'pendiente' | 'señado' | 'pagado_total' = 'pendiente';
          if (totalPaid >= (o.monto_total || 0) && o.monto_total > 0) {
            defaultEstadoPago = 'pagado_total';
          } else if (totalPaid > 0) {
            defaultEstadoPago = 'señado';
          }

          const matchedState = sortedStatuses.find(st => st.id === o.estado_id);

          const mapped: PedidoV2 = {
            id: refId,
            cliente_nombre: o.cliente?.nombre || o.cliente_nombre_temporal || 'Sin Nombre',
            cliente_telefono: o.cliente?.telefono_contacto || o.cliente_telefono_temporal || '',
            cliente_direccion: o.cliente?.direccion_hogar || o.cliente_direccion_v1 || extra.cliente_direccion || '',
            canal: extra.canal || 'tienda',
            revendedor_nombre: extra.revendedor_nombre || '',
            producto_id: extra.producto_id || firstItem?.insumo_id || '',
            producto_nombre: firstItem?.descripcion_custom || o.descripcion_general || 'Insumo/Impresión G3D',
            variante_id: extra.variante_id || undefined,
            variante_nombre: extra.variante_nombre || '',
            cantidad: firstItem?.cantidad || o.cantidad || 1,
            precio_unitario: firstItem?.precio_unitario || o.monto_total || 0,
            precio_total: o.monto_total || 0,
            comision_plataforma: extra.comision_plataforma !== undefined ? extra.comision_plataforma : 10,
            comision_influencer: extra.comision_influencer !== undefined ? extra.comision_influencer : 5,
            modalidad: isProduction ? 'produccion' : 'inmediata',
            requiere_sena: extra.requiere_sena !== undefined ? extra.requiere_sena : isProduction,
            sena_monto: extra.sena_monto !== undefined ? extra.sena_monto : senaMontoEst,
            sena_pagada: extra.sena_pagada !== undefined ? extra.sena_pagada : (totalPaid > 0),
            estado_pago: extra.estado_pago || defaultEstadoPago,
            estado_produccion: extra.estado_produccion || (isProduction ? (totalPaid > 0 ? 'en_cola' : 'pendiente_diseno') : 'no_aplica'),
            estado_envio: extra.estado_envio || (extra.flete_tipo === 'retiro' ? 'retiro_local' : 'pendiente_flete'),
            flete_tipo: extra.flete_tipo || 'retiro',
            flete_costo: extra.flete_costo || 0,
            flete_cobertura: extra.flete_cobertura || '',
            fecha_entrega_estimada: o.fecha_entrega || undefined,
            instrucciones_operario: o.notas_tecnicas || o.notes_tecnicas || extra.instrucciones_operario || '',
            drive_stl_link: o.drive_stl_link || extra.drive_stl_link || '',
            creado_el: o.fecha_creacion || new Date().toISOString(),
            vendedor_id: o.vendedor_id || undefined,
            estado_id: o.estado_id || undefined,
            estado_nombre: matchedState?.nombre_estado || o.estado?.nombre_estado || 'Venta General',
            estado_color: matchedState?.color_estado || o.estado?.color_estado || '#64748b'
          };

          // Guardar de vuelta para consistencia
          if (!v2Extras[refId]) {
            v2Extras[refId] = {
              canal: mapped.canal,
              revendedor_nombre: mapped.revendedor_nombre,
              producto_id: mapped.producto_id,
              variante_id: mapped.variante_id,
              variante_nombre: mapped.variante_nombre,
              comision_plataforma: mapped.comision_plataforma,
              comision_influencer: mapped.comision_influencer,
              requiere_sena: mapped.requiere_sena,
              sena_monto: mapped.sena_monto,
              sena_pagada: mapped.sena_pagada,
              estado_pago: mapped.estado_pago,
              estado_produccion: mapped.estado_produccion,
              estado_envio: mapped.estado_envio,
              flete_tipo: mapped.flete_tipo,
              flete_costo: mapped.flete_costo,
              flete_cobertura: mapped.flete_cobertura,
              instrucciones_operario: mapped.instrucciones_operario,
              drive_stl_link: mapped.drive_stl_link
            };
          }

          return mapped;
        });

        localStorage.setItem('g3d_pedidos_v2_extras', JSON.stringify(v2Extras));
        setPedidos(resolvedOrders);
        localStorage.setItem('g3d_pedidos_v2', JSON.stringify(resolvedOrders));

      } catch (err: any) {
        console.warn("[Supabase V1 Connect Fallback] Operando con caché local:", err.message || err);
        const localOrders = JSON.parse(localStorage.getItem('g3d_pedidos_v2') || '[]');
        setPedidos(localOrders);
      }

    } catch (error: any) {
      console.error("Error loading mock setup for v1-hybrid-v2:", error);
      toast.error("Ocurrió un inconveniente al sincronizar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambio de estado de un pedido
  const updatePedidoStatus = async (
    id: string, 
    field: 'estado_pago' | 'estado_produccion' | 'estado_envio' | 'sena_pagada', 
    value: any
  ) => {
    let finalOrderToUpdate: PedidoV2 | null = null;
    const updatedList = pedidos.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // Validaciones lógicas condicionales
        if (field === 'sena_pagada' && value === true && p.modalidad === 'produccion') {
          updated.estado_pago = 'señado' as const;
          if (updated.estado_produccion === 'no_aplica' || updated.estado_produccion === 'pendiente_diseno') {
            updated.estado_produccion = 'en_cola' as const;
          }
        }
        if (field === 'estado_pago' && value === 'pagado_total') {
          updated.sena_pagada = true;
        }
        finalOrderToUpdate = updated;
        return updated;
      }
      return p;
    });

    setPedidos(updatedList);
    localStorage.setItem('g3d_pedidos_v2', JSON.stringify(updatedList));

    // Guardar cambio en extras
    const v2Extras = JSON.parse(localStorage.getItem('g3d_pedidos_v2_extras') || '{}');
    if (!v2Extras[id]) v2Extras[id] = {};
    v2Extras[id][field] = value;
    if (finalOrderToUpdate) {
      v2Extras[id].estado_pago = (finalOrderToUpdate as PedidoV2).estado_pago;
      v2Extras[id].estado_produccion = (finalOrderToUpdate as PedidoV2).estado_produccion;
      v2Extras[id].sena_pagada = (finalOrderToUpdate as PedidoV2).sena_pagada;
    }
    localStorage.setItem('g3d_pedidos_v2_extras', JSON.stringify(v2Extras));

    // Sincronizar el campo 'monto_pagado' en la tabla de pedidos reales de Supabase
    try {
      const orderToUpdate = finalOrderToUpdate || updatedList.find(p => p.id === id);
      if (orderToUpdate) {
        let netMontoPagado = 0;
        if (orderToUpdate.estado_pago === 'pagado_total') {
          netMontoPagado = orderToUpdate.precio_total;
        } else if (orderToUpdate.estado_pago === 'señado') {
          netMontoPagado = orderToUpdate.sena_monto || Math.ceil(orderToUpdate.precio_total * 0.4);
        }

        // Si hay una diferencia positiva de pago, registrar una transacción en la tabla 'pagos'
        const currentPagado = orderToUpdate.total_pagado || 0;
        const diff = netMontoPagado - currentPagado;
        if (diff > 0) {
          const idPago = `PAG-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const autoPayment = {
            id_pago: idPago,
            id_pedido: id, // codigo_pedido
            monto: diff,
            tipo_pago: 'Transferencia',
            observaciones: `Ajuste automático por cambio de estado a ${orderToUpdate.estado_pago === 'pagado_total' ? 'Pagado Total' : 'Señado'}`,
            fecha: new Date().toISOString()
          };

          // Guardar localmente
          const localPagos = localStorage.getItem('g3d_pagos');
          const listPagos = localPagos ? JSON.parse(localPagos) : [];
          listPagos.push(autoPayment);
          localStorage.setItem('g3d_pagos', JSON.stringify(listPagos));

          // Insertar en Supabase
          const { error: insertErr } = await supabase
            .from('pagos')
            .insert([autoPayment]);
          if (insertErr) {
            console.warn("[Auto-Pago] Error al insertar en Supabase:", insertErr.message);
          }
        }

        const { error } = await supabase
          .from('pedidos')
          .update({
            monto_pagado: netMontoPagado
          })
          .eq('codigo_pedido', id);

        if (error) throw error;
      }
    } catch (err: any) {
      console.warn("[V1 Sincronización Fallida] No se pudo actualizar en Supabase (Modificado localmente):", err.message || err);
    }

    toast.success("Estado del pedido V1 actualizado correctamente");
    if (selectedPedido && selectedPedido.id === id) {
      setSelectedPedido(updatedList.find(p => p.id === id) || null);
    }
  };

  // Eliminar pedido
  const deletePedido = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas archivar/eliminar este pedido?")) {
      const filtered = pedidos.filter(p => p.id !== id);
      setPedidos(filtered);
      localStorage.setItem('g3d_pedidos_v2', JSON.stringify(filtered));

      const v2Extras = JSON.parse(localStorage.getItem('g3d_pedidos_v2_extras') || '{}');
      delete v2Extras[id];
      localStorage.setItem('g3d_pedidos_v2_extras', JSON.stringify(v2Extras));

      try {
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .eq('codigo_pedido', id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[V1 Sincronización Fallida] No se pudo eliminar de la base de datos:", err.message || err);
      }

      toast.success("Pedido archivado correctamente de Supabase V1 con éxito");
      setSelectedPedido(null);
    }
  };

  // Cambiar estado_id en Supabase V1
  const updatePedidoStatusId = async (pedidoId: string, stId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado_id: stId })
        .eq('codigo_pedido', pedidoId);

      if (error) throw error;

      const matchedState = availableStatuses.find(s => s.id === stId);
      
      const updatedList = pedidos.map(p => {
        if (p.id === pedidoId) {
          return {
            ...p,
            estado_id: stId,
            estado_nombre: matchedState?.nombre_estado || 'Sin Estado',
            estado_color: matchedState?.color_estado || '#64748b'
          };
        }
        return p;
      });

      setPedidos(updatedList);
      localStorage.setItem('g3d_pedidos_v2', JSON.stringify(updatedList));
      
      toast.success(`Estatus cambiado a "${matchedState?.nombre_estado || 'Sin Estado'}" en la base de datos V1`);
      
      if (selectedPedido && selectedPedido.id === pedidoId) {
        setSelectedPedido(updatedList.find(p => p.id === pedidoId) || null);
      }
    } catch (err: any) {
      console.error("Error updating status ID:", err);
      toast.error("No se pudo actualizar el estatus de la base de datos");
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = (p: PedidoV2) => {
    setEditOrder({
      id: p.id,
      cliente_nombre: p.cliente_nombre,
      cliente_telefono: p.cliente_telefono,
      cliente_direccion: p.cliente_direccion,
      canal: p.canal,
      revendedor_nombre: p.revendedor_nombre || '',
      producto_id: p.producto_id,
      variante_id: p.variante_id || '',
      cantidad: p.cantidad,
      precio_personalizado: p.precio_unitario.toString(),
      flete_tipo: p.flete_tipo,
      flete_costo: p.flete_costo.toString(),
      flete_cobertura: p.flete_cobertura || '',
      estado_id: p.estado_id || '',
      drive_stl_link: p.drive_stl_link || '',
      instrucciones_operario: p.instrucciones_operario || ''
    });
    setShowEditModal(true);
  };

  // Guardar edición de un pedido de forma sincrónica
  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder.producto_id || !editOrder.cliente_nombre) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    const matchedProd = productos.find(p => p.id === editOrder.producto_id);
    if (!matchedProd) return;

    let subitemName = '';
    let itemPrice = matchedProd.precio_base || 0;
    
    if (editOrder.variante_id) {
      const v = matchedProd.variantes?.find((vi: any) => vi.id === editOrder.variante_id);
      if (v) {
        subitemName = v.combinacion || v.nombre || '';
        itemPrice = v.precio || itemPrice;
      }
    }

    const priceUnit = editOrder.precio_personalizado !== '' ? parseFloat(editOrder.precio_personalizado) : itemPrice;
    const totalSeminario = priceUnit * editOrder.cantidad;
    const precioTotalCalculado = totalSeminario + (parseFloat(editOrder.flete_costo) || 0);

    try {
      const { data: ordHeader, error: fetchErr } = await supabase
        .from('pedidos')
        .select('id, monto_pagado')
        .eq('codigo_pedido', editOrder.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (ordHeader) {
        // Actualizar la cabecera
        const { error: updateErr } = await supabase
          .from('pedidos')
          .update({
            cliente_nombre_temporal: editOrder.cliente_nombre,
            cliente_telefono_temporal: editOrder.cliente_telefono,
            monto_total: precioTotalCalculado,
            estado_id: editOrder.estado_id || null,
            tipo_trabajo: matchedProd.modalidad === 'produccion' ? 'BAJO PEDIDO' : 'ENTREGA INMEDIATA',
            fecha_entrega: null
          })
          .eq('id', ordHeader.id);

        if (updateErr) throw updateErr;

        // Actualizar o insertar item
        const { data: existingItems } = await supabase
          .from('pedido_items')
          .select('id')
          .eq('pedido_id', ordHeader.id);

        if (existingItems && existingItems.length > 0) {
          const { error: itemErr } = await supabase
            .from('pedido_items')
            .update({
              cantidad: editOrder.cantidad,
              precio_unitario: priceUnit,
              descripcion_custom: `${matchedProd.nombre}${subitemName ? ' (' + subitemName + ')' : ''}`,
              insumo_id: matchedProd.id
            })
            .eq('id', existingItems[0].id);
          
          if (itemErr) throw itemErr;
        } else {
          const { error: itemErr } = await supabase
            .from('pedido_items')
            .insert([{
              pedido_id: ordHeader.id,
              cantidad: editOrder.cantidad,
              precio_unitario: priceUnit,
              descripcion_custom: `${matchedProd.nombre}${subitemName ? ' (' + subitemName + ')' : ''}`,
              insumo_id: matchedProd.id
            }]);
          
          if (itemErr) throw itemErr;
        }

        toast.info("Actualización sincrónica completa en Supabase de forma transparente");
      }
    } catch (err: any) {
      console.warn("[V1 Save Sync Fallback] Guardado localmente:", err.message || err);
    }

    // Persistir extras de localStorage
    const v2Extras = JSON.parse(localStorage.getItem('g3d_pedidos_v2_extras') || '{}');
    v2Extras[editOrder.id] = {
      ...v2Extras[editOrder.id],
      canal: editOrder.canal,
      revendedor_nombre: editOrder.canal === 'revendedor' ? editOrder.revendedor_nombre : '',
      producto_id: matchedProd.id,
      variante_id: editOrder.variante_id || '',
      variante_nombre: subitemName,
      flete_tipo: editOrder.flete_tipo,
      flete_costo: parseFloat(editOrder.flete_costo) || 0,
      flete_cobertura: editOrder.flete_cobertura,
      drive_stl_link: editOrder.drive_stl_link,
      instrucciones_operario: editOrder.instrucciones_operario,
      cliente_direccion: editOrder.cliente_direccion
    };
    localStorage.setItem('g3d_pedidos_v2_extras', JSON.stringify(v2Extras));

    // Actualizar local de Pedidos en memoria
    const matchedState = availableStatuses.find(s => s.id === editOrder.estado_id);
    const updated = pedidos.map(p => {
      if (p.id === editOrder.id) {
        return {
          ...p,
          cliente_nombre: editOrder.cliente_nombre,
          cliente_telefono: editOrder.cliente_telefono,
          cliente_direccion: editOrder.cliente_direccion,
          canal: editOrder.canal,
          revendedor_nombre: editOrder.canal === 'revendedor' ? editOrder.revendedor_nombre : '',
          producto_id: matchedProd.id,
          producto_nombre: matchedProd.nombre,
          variante_id: editOrder.variante_id || undefined,
          variante_nombre: subitemName,
          cantidad: editOrder.cantidad,
          precio_unitario: priceUnit,
          precio_total: precioTotalCalculado,
          flete_tipo: editOrder.flete_tipo,
          flete_costo: parseFloat(editOrder.flete_costo) || 0,
          flete_cobertura: editOrder.flete_cobertura,
          drive_stl_link: editOrder.drive_stl_link,
          instrucciones_operario: editOrder.instrucciones_operario,
          estado_id: editOrder.estado_id,
          estado_nombre: matchedState?.nombre_estado || p.estado_nombre,
          estado_color: matchedState?.color_estado || p.estado_color
        };
      }
      return p;
    });

    setPedidos(updated);
    localStorage.setItem('g3d_pedidos_v2', JSON.stringify(updated));

    setShowEditModal(false);
    toast.success("¡Pedido editado exitosamente!");
    
    if (selectedPedido && selectedPedido.id === editOrder.id) {
      setSelectedPedido(updated.find(p => p.id === editOrder.id) || null);
    }
  };

  // Crear pedido con soporte de base de datos activa o fallback
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrder.producto_id || !newOrder.cliente_nombre) {
      toast.error("Por favor completa los campos del producto y cliente obligatorios.");
      return;
    }

    const matchedProd = productos.find(p => p.id === newOrder.producto_id);
    if (!matchedProd) return;

    let subitemName = '';
    let itemPrice = matchedProd.precio_base || 0;
    
    // Si tiene variantes, buscarla
    if (newOrder.variante_id) {
      const v = matchedProd.variantes?.find((vi: any) => vi.id === newOrder.variante_id);
      if (v) {
        subitemName = v.combinacion || v.nombre || '';
        itemPrice = v.precio || itemPrice;
      }
    }

    // Precio personalizado sobreescribe el público
    const priceUnit = newOrder.precio_personalizado !== '' ? parseFloat(newOrder.precio_personalizado) : itemPrice;
    const totalSeminario = priceUnit * newOrder.cantidad;

    const isProduction = matchedProd.modalidad === 'produccion';
    const senaRequired = isProduction && (matchedProd.requiere_sena !== false);
    const senaMontoDef = senaRequired ? Math.ceil(totalSeminario * (parseFloat(matchedProd.sena_porcentaje || '40') / 100)) : 0;

    // Reducir stock simulado en memoria si la entrega es inmediata
    if (!isProduction) {
      const stockField = parseInt(matchedProd.stock_global) || 0;
      if (stockField > 0) {
        const updatedProds = productos.map(item => {
          if (item.id === matchedProd.id) {
            const nextStock = Math.max(0, stockField - newOrder.cantidad);
            if (nextStock === 0) {
              toast.error(`¡AUTO-PAUSA! El producto "${item.nombre}" se quedó sin stock y ha sido pausado de la tienda.`);
            } else if (nextStock <= (parseInt(item.minimo_alerta) || 0)) {
              toast.warning(`¡Alerta! "${item.nombre}" cruzó el umbral de alerta (Stock restante: ${nextStock})`);
            }
            return { ...item, stock_global: nextStock };
          }
          return item;
        });
        setProductos(updatedProds);
      }
    }

    // Generar códigos legibles e identificadores
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    const codigoPedido = `G3D-${timestamp}`;

    const precioTotalCalculado = totalSeminario + (parseFloat(newOrder.flete_costo) || 0);
    const initialMontoPagado = newOrder.sena_pagada 
      ? senaMontoDef 
      : (newOrder.sena_pagada === false && senaRequired === false && newOrder.sena_pagada === false) ? 0 : 0; 
    
    let defaultEstadoPago: 'pendiente' | 'señado' | 'pagado_total' = 'pendiente';
    if (newOrder.sena_pagada) {
      defaultEstadoPago = 'señado';
    }

    // 1. Intentar insertar en la tabla real 'pedidos' de V1 en Supabase
    try {
      let estadoId = newOrder.estado_id;
      if (!estadoId) {
        const { data: estData } = await supabase
          .from('diccionario_estados_pedido')
          .select('id')
          .ilike('nombre_estado', isProduction ? 'BAJO PEDIDO' : 'ENTREGA INMEDIATA')
          .maybeSingle();
        estadoId = estData?.id || null;
      }

      const { data: insertedOrder, error: createError } = await supabase
        .from('pedidos')
        .insert([{
          codigo_pedido: codigoPedido,
          vendedor_temporal: session?.user?.email || 'Vendedor V2',
          cliente_nombre_temporal: newOrder.cliente_nombre,
          cliente_telefono_temporal: newOrder.cliente_telefono,
          tipo_trabajo: isProduction ? 'BAJO PEDIDO' : 'ENTREGA INMEDIATA',
          monto_total: precioTotalCalculado,
          monto_pagado: initialMontoPagado,
          estado_id: estadoId || null,
          fecha_entrega: null,
          lat: -34.6037,
          lng: -58.3816,
          delivery_min: 1,
          delivery_max: 3
        }])
        .select('*')
        .single();

      if (createError) throw createError;

      if (insertedOrder) {
        // 2. Insertar item correspondiente en 'pedido_items'
        const { error: itemError } = await supabase
          .from('pedido_items')
          .insert([{
            pedido_id: insertedOrder.id,
            cantidad: newOrder.cantidad,
            precio_unitario: priceUnit,
            subtotal: totalSeminario,
            descripcion_custom: `${matchedProd.nombre}${subitemName ? ' (' + subitemName + ')' : ''}`,
            insumo_id: matchedProd.id
          }]);
        if (itemError) console.error("Error al registrar items en base de datos:", itemError);
      }
      
      toast.info("Sincronizado en la base de datos de Supabase V1 en tiempo real");

    } catch (err: any) {
      console.warn("[V1 Insert Sync Fallback] Registrando el pedido de manera local:", err.message || err);
    }

    // 3. Registrar extras en localStorage para mantener el playground V2
    const v2Extras = JSON.parse(localStorage.getItem('g3d_pedidos_v2_extras') || '{}');
    v2Extras[codigoPedido] = {
      canal: newOrder.canal,
      revendedor_nombre: newOrder.canal === 'revendedor' ? newOrder.revendedor_nombre : '',
      producto_id: matchedProd.id,
      variante_id: newOrder.variante_id || '',
      variante_nombre: subitemName,
      comision_plataforma: parseFloat(newOrder.comision_plataforma) || 0,
      comision_influencer: parseFloat(newOrder.comision_influencer) || 0,
      requiere_sena: senaRequired,
      sena_monto: senaMontoDef,
      sena_pagada: newOrder.sena_pagada,
      estado_pago: defaultEstadoPago,
      estado_produccion: isProduction ? (newOrder.sena_pagada ? 'en_cola' : 'pendiente_diseno') : 'no_aplica',
      estado_envio: newOrder.flete_tipo === 'retiro' ? 'retiro_local' : 'pendiente_flete',
      flete_tipo: newOrder.flete_tipo,
      flete_costo: parseFloat(newOrder.flete_costo) || 0,
      flete_cobertura: newOrder.flete_cobertura,
      instrucciones_operario: matchedProd.instrucciones_internas || '',
      drive_stl_link: matchedProd.drive_stl_link || ''
    };
    localStorage.setItem('g3d_pedidos_v2_extras', JSON.stringify(v2Extras));

    const matchedState = availableStatuses.find(s => s.id === newOrder.estado_id);

    // 4. Agregar a listado local
    const finalNewOrder: PedidoV2 = {
      id: codigoPedido,
      cliente_nombre: newOrder.cliente_nombre,
      cliente_telefono: newOrder.cliente_telefono,
      cliente_direccion: newOrder.cliente_direccion,
      canal: newOrder.canal,
      revendedor_nombre: newOrder.canal === 'revendedor' ? newOrder.revendedor_nombre : '',
      producto_id: matchedProd.id,
      producto_nombre: matchedProd.nombre,
      variante_id: newOrder.variante_id || undefined,
      variante_nombre: subitemName,
      cantidad: newOrder.cantidad,
      precio_unitario: priceUnit,
      precio_total: precioTotalCalculado,
      comision_plataforma: parseFloat(newOrder.comision_plataforma) || 0,
      comision_influencer: parseFloat(newOrder.comision_influencer) || 0,
      modalidad: matchedProd.modalidad || 'inmediata',
      requiere_sena: senaRequired,
      sena_monto: senaMontoDef,
      sena_pagada: newOrder.sena_pagada,
      estado_pago: defaultEstadoPago,
      estado_produccion: isProduction ? (newOrder.sena_pagada ? 'en_cola' : 'pendiente_diseno') : 'no_aplica',
      estado_envio: newOrder.flete_tipo === 'retiro' ? 'retiro_local' : 'pendiente_flete',
      flete_tipo: newOrder.flete_tipo,
      flete_costo: parseFloat(newOrder.flete_costo) || 0,
      flete_cobertura: newOrder.flete_cobertura,
      drive_stl_link: matchedProd.drive_stl_link,
      instrucciones_operario: matchedProd.instrucciones_internas,
      creado_el: now.toISOString(),
      vendedor_id: session?.user?.id || undefined,
      estado_id: newOrder.estado_id || undefined,
      estado_nombre: matchedState?.nombre_estado || 'Venta General',
      estado_color: matchedState?.color_estado || '#64748b'
    };

    const newOrdersList = [finalNewOrder, ...pedidos];
    setPedidos(newOrdersList);
    localStorage.setItem('g3d_pedidos_v2', JSON.stringify(newOrdersList));

    toast.success("¡Pedido creado exitosamente con el esquema integrado V1!");
    setShowAddModal(false);
    
    // Reset form
    setNewOrder({
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_direccion: '',
      canal: 'tienda',
      revendedor_nombre: '',
      producto_id: '',
      variante_id: '',
      cantidad: 1,
      precio_personalizado: '',
      flete_tipo: 'retiro',
      flete_costo: '0',
      flete_cobertura: '',
      sena_pagada: false,
      comision_plataforma: '10',
      comision_influencer: '5'
    });
  };

  const filteredOrders = pedidos.filter(p => {
    const matchesSearch = p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCanal = canalFilter === 'todos' || p.canal === canalFilter;
    
    const matchesProduccion = produccionFilter === 'todos' || 
                              (produccionFilter === 'G3D_MANUFACTURING' && p.modalidad === 'produccion') ||
                              (produccionFilter === 'RETAIL_DELIVERY' && p.modalidad === 'inmediata');
                              
    return matchesSearch && matchesCanal && matchesProduccion;
  });

  const selectedProduct = productos.find(p => p.id === newOrder.producto_id);
  const selectedProductEdit = productos.find(p => p.id === editOrder.producto_id);

  return (
    <div className="space-y-6">
      {/* Banner / Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-250 dark:border-white/5 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Workflow size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-500 tracking-wider uppercase block">Nueva Arquitectura Planificada</span>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
              Pedidos G3D <span className="text-[10px] bg-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none">v2 sandbox</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold">Crea o simula pedidos vinculando directamente catálogos, distribuidores, operarios de taller y sistemas de seña.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold leading-none shadow-md flex items-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus size={16} />
          Crear Pedido Real (v2)
        </button>
      </div>

      {/* Tarjeta de Advertencia Prolija */}
      <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 text-amber-900 dark:text-amber-200 text-xs">
        <AlertTriangle className="shrink-0 text-amber-500" size={18} />
        <div>
          <span className="font-extrabold text-[10px] uppercase tracking-wider block mb-0.5">Entorno Aislado del Pedidos 2</span>
          Este workspace y sus pedidos se almacenan dentro de tu navegador (<span className="font-mono">localStorage</span>). Te permite experimentar los flujos relacionales de reventa, seña y operaciones en talleres de impresión 3D a la perfección, sin escribir cambios crudos en la tabla relacional activa en producción de Supabase.
        </div>
      </div>

      {/* Selectores de Perfil del Espacio de Trabajo */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border dark:border-slate-800 max-w-sm">
        <button 
          onClick={() => setActiveTab('control')}
          className={cn(
            "flex-1 text-center py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-none flex items-center justify-center gap-1.5",
            activeTab === 'control' 
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-250"
          )}
        >
          <Layers size={13} />
          Torre Control
        </button>
        <button 
          onClick={() => setActiveTab('fabrica')}
          className={cn(
            "flex-1 text-center py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-none flex items-center justify-center gap-1.5",
            activeTab === 'fabrica' 
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-250"
          )}
        >
          <Printer size={13} />
          Fábrica G3D
        </button>
      </div>

      {/* VISTA PRINCIPAL: TORRE DE CONTROL */}
      {activeTab === 'control' && (
        <div className="space-y-4">
          {/* Grid de Stats Compactas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total Recibidos</span>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{pedidos.length}</p>
              </div>
              <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center"><Clock size={16} /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Seña Requerida</span>
                <p className="text-xl font-black text-amber-500 mt-0.5">
                  {pedidos.filter(p => p.modalidad === 'produccion' && !p.sena_pagada).length}
                </p>
              </div>
              <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center"><DollarSign size={16} /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">En Producción</span>
                <p className="text-xl font-black text-teal-500 mt-0.5">
                  {pedidos.filter(p => p.estado_produccion !== 'no_aplica' && p.estado_produccion !== 'listo_taller').length}
                </p>
              </div>
              <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400 flex items-center justify-center"><Printer size={16} /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total Ingresos Est.</span>
                <p className="text-xl font-black text-emerald-500 mt-0.5">
                  ${pedidos.reduce((acc, current) => acc + (Number(current?.precio_total) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center"><DollarSign size={16} /></div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por cliente o producto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-405" size={14} />
            </div>

            <div className="flex gap-2">
              <select 
                value={canalFilter} 
                onChange={e => setCanalFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-850 dark:text-slate-200 focus:outline-none"
              >
                <option value="todos">Todos los Canales</option>
                <option value="tienda">Tienda Web (Directo)</option>
                <option value="revendedor">Revendedores (Mayorista)</option>
              </select>

              <select 
                value={produccionFilter} 
                onChange={e => setProduccionFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-850 dark:text-slate-200 focus:outline-none"
              >
                <option value="todos">Todas las Modalidades</option>
                <option value="G3D_MANUFACTURING">Producción bajo Pedido</option>
                <option value="RETAIL_DELIVERY">Entrega Inmediata</option>
              </select>
            </div>
          </div>

          {/* Lista de Pedidos o No Resultados */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-12 text-center text-slate-505 font-bold text-xs space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p>No se encontraron registros de pedidos en este filtro.</p>
              <p className="text-slate-400 font-medium">¡Prueba a crear tu primer pedido de Sandbox v2 arriba!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Orders list */}
              <div className="lg:col-span-4 space-y-3 max-h-[1000px] overflow-y-auto">
                {filteredOrders.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPedido(p)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all text-left space-y-3 relative overflow-hidden",
                      selectedPedido?.id === p.id 
                        ? 'bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-500' 
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800/80'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          p.canal === 'tienda' ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60" : "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60"
                        )}>
                          {p.canal === 'tienda' ? 'Web Directa' : `Revendedor: ${p.revendedor_nombre || 'Interno'}`}
                        </span>
                        <h3 className="text-xs font-black text-slate-800 dark:text-white mt-1">{p.cliente_nombre}</h3>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white">${(Number(p?.precio_total) || 0).toLocaleString()}</span>
                    </div>

                    <div className="text-[10px] space-y-1.5 text-slate-507 dark:text-slate-350">
                      <div className="flex justify-between">
                        <span>Producto:</span>
                        <span className="font-bold truncate max-w-[150px]">{p.producto_nombre} {p.variante_nombre && `(${p.variante_nombre})`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modalidad:</span>
                        <span className="font-bold">{p.modalidad === 'produccion' ? '⚙️ Producción' : '📦 Retiro Stock'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pago / Producc</span>
                      <div className="flex gap-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase py-0.5 px-1.5 rounded-full",
                          p.estado_pago === 'pendiente' ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400" : (p.estado_pago === 'señado' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400")
                        )}>
                          {p.estado_pago}
                        </span>
                        {p.modalidad === 'produccion' && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase py-0.5 px-1.5 rounded-full">
                            {p.estado_produccion.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Order Detailed Sheet */}
              <div className="lg:col-span-8">
                {selectedPedido ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm text-left">
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3 h-10 items-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedPedido.id}</span>
                        <h2 className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">Hoja de Fiscalización Integral</h2>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(selectedPedido)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-100 rounded-lg text-xs font-black shadow-sm transition-colors"
                          title="Completar o Editar Datos de este Pedido"
                        >
                          <Edit size={14} />
                          Completar Datos
                        </button>
                        <button 
                          onClick={() => deletePedido(selectedPedido.id)}
                          className="p-2 border dark:border-slate-800 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/35 transition-colors"
                          title="Eliminar de v2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Estado de Pedido V1 (Diccionario de base de datos) */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-800 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-450 uppercase tracking-widest block">🚦 Estado del Pedido del Sistema V1</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {availableStatuses.map(st => {
                          const isSelected = selectedPedido.estado_id === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => updatePedidoStatusId(selectedPedido.id, st.id)}
                              className={cn(
                                "px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wide border transition-all",
                                isSelected 
                                  ? 'text-white font-extrabold shadow-sm' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
                              )}
                              style={isSelected ? { backgroundColor: st.color_estado, borderColor: st.color_estado } : {}}
                            >
                              {st.nombre_estado}
                            </button>
                          );
                        })}
                        {availableStatuses.length === 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold italic">No hay estados de diccionario V1 disponibles</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="space-y-2 bg-slate-50 dark:bg-slate-950/50 p-4.5 rounded-xl border dark:border-slate-800">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-extrabold border-b dark:border-slate-850 pb-1">👤 Cliente (Web Ticket)</span>
                        <div className="flex justify-between"><span>Nombre:</span> <span className="text-slate-900 dark:text-white">{selectedPedido.cliente_nombre}</span></div>
                        <div className="flex justify-between"><span>Teléfono:</span> <span className="text-slate-900 dark:text-white select-all">{selectedPedido.cliente_telefono || 'No provee'}</span></div>
                        <div className="flex justify-between"><span>Dirección:</span> <span className="text-slate-900 dark:text-white">{selectedPedido.cliente_direccion || 'Retiro en punto'}</span></div>
                      </div>

                      <div className="space-y-2 bg-slate-50 dark:bg-slate-950/50 p-4.5 rounded-xl border dark:border-slate-800">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-extrabold border-b dark:border-slate-850 pb-1">📦 Producto Relacionado</span>
                        <div className="flex justify-between"><span>Producto:</span> <span className="text-indigo-600 dark:text-indigo-400">{selectedPedido.producto_nombre}</span></div>
                        {selectedPedido.variante_nombre && <div className="flex justify-between"><span>Variante:</span> <span className="text-teal-600 dark:text-teal-400">{selectedPedido.variante_nombre}</span></div>}
                        <div className="flex justify-between"><span>Cantidad:</span> <span>{selectedPedido.cantidad} unidades</span></div>
                      </div>
                    </div>

                    {/* Comisiones y Rentabilidad Predictiva */}
                    <div className="bg-indigo-50/15 border border-indigo-200/50 dark:border-indigo-900/10 p-4 rounded-xl space-y-3">
                      <span className="text-[9px] font-black text-indigo-505 dark:text-indigo-400 uppercase tracking-widest block"><Sparkles className="inline mr-1" size={12} /> Cálculo de Comisiones & Costos Especiales</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                        <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-lg border dark:border-slate-850">
                          <span className="text-slate-400 block mb-0.5 font-semibold">Plataforma ({selectedPedido.comision_plataforma}%)</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">${((selectedPedido.precio_total - selectedPedido.flete_costo) * (selectedPedido.comision_plataforma / 100)).toFixed(2)}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-lg border dark:border-slate-850">
                          <span className="text-slate-400 block mb-0.5 font-semibold">Influencer ({selectedPedido.comision_influencer}%)</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">${((selectedPedido.precio_total - selectedPedido.flete_costo) * (selectedPedido.comision_influencer / 100)).toFixed(2)}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-lg border dark:border-slate-850">
                          <span className="text-slate-400 block mb-0.5 font-semibold">Subtotal Neto</span>
                          <span className="text-emerald-500 font-extrabold">${(selectedPedido.precio_total - selectedPedido.flete_costo - (((selectedPedido.precio_total - selectedPedido.flete_costo) * (selectedPedido.comision_plataforma / 100)) + ((selectedPedido.precio_total - selectedPedido.flete_costo) * (selectedPedido.comision_influencer / 100)))).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* RUTA DE FLUJO AUTOMATIZADO / ENRUTAMIENTO */}
                    {(() => {
                      const localProductExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
                      const prodExtra = localProductExtras[selectedPedido.producto_id];
                      let workflowId = prodExtra?.assigned_workflow_id || '';
                      let originStr = 'Asignación Individual de Insumo';

                      if (!workflowId) {
                        const rules = JSON.parse(localStorage.getItem('g3d_workflow_automation_rules') || '[]');
                        // 1. Buscar regla de canal
                        const channelRule = rules.find((r: any) => r.activo && r.trigger_type === 'channel_type' && r.trigger_value === selectedPedido.canal);
                        if (channelRule) {
                          workflowId = channelRule.flujo_destino_id;
                          originStr = `Filtro Automático de Canal: "${channelRule.name}"`;
                        } else {
                          // 2. Buscar regla de envío
                          const deliveryRule = rules.find((r: any) => r.activo && r.trigger_type === 'delivery_type' && r.trigger_value === selectedPedido.flete_tipo);
                          if (deliveryRule) {
                            workflowId = deliveryRule.flujo_destino_id;
                            originStr = `Filtro Automático de Envío: "${deliveryRule.name}"`;
                          }
                        }
                      }

                      const matchedWf = workflowsList.find(w => w.id === workflowId);
                      const wfSteps = matchedWf ? workflowStates.filter((s: any) => s.flujo_id === matchedWf.id) : [];

                      return (
                        <div className="bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-800 p-4 rounded-xl space-y-3 text-left">
                          <div className="flex justify-between items-center border-b dark:border-slate-850 pb-2">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">
                              🔄 Ruta de Trabajo Enrutada (Sandbox Workflow)
                            </span>
                            <span className="text-[8px] max-w-[50%] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black truncate uppercase" title={originStr}>
                              {originStr}
                            </span>
                          </div>

                          {matchedWf ? (
                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                Flujo Activo: {matchedWf.name}
                              </p>
                              {wfSteps.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {wfSteps.map((step: any, idx: number) => {
                                    // Simular que el paso actual corresponde al estado de producción o que va progresando
                                    const isCurrent = (selectedPedido.modalidad === 'inmediata' && idx === wfSteps.length - 1) || 
                                                      (selectedPedido.estado_produccion === 'pendiente_diseno' && idx === 0) ||
                                                      (selectedPedido.estado_produccion === 'en_cola' && idx === 1) ||
                                                      (selectedPedido.estado_produccion === 'laminando' && idx === 2) ||
                                                      (selectedPedido.estado_produccion === 'imprimiendo' && idx === 3) ||
                                                      (selectedPedido.estado_produccion === 'post_procesado' && idx === 4) ||
                                                      (selectedPedido.estado_produccion === 'listo_taller' && idx === wfSteps.length - 1);

                                    return (
                                      <React.Fragment key={step.id}>
                                        {idx > 0 && <span className="text-slate-350 text-[9px] font-black shrink-0">→</span>}
                                        <span 
                                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border transition-all duration-150"
                                          style={{ 
                                            backgroundColor: step.color_estado + '22', 
                                            borderColor: isCurrent ? step.color_estado : step.color_estado + '55', 
                                            color: step.color_estado,
                                            boxShadow: isCurrent ? `0 0 8px ${step.color_estado}55` : 'none',
                                            transform: isCurrent ? 'scale(1.05)' : 'none'
                                          }}
                                          title={`Paso ${step.step_order}`}
                                        >
                                          {isCurrent ? '● ' : ''}{step.nombre_estado}
                                        </span>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-bold italic">Este flujo no tiene estados de taller definidos aún.</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold italic">
                              Operando bajo Flujo General de Tienda (Sin desvíos condicionales de producción adaptados en Categorías y Flujos).
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Fletes y Envíos */}
                    <div className="space-y-2 text-xs font-bold text-slate-705 dark:text-slate-300">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block pb-1 border-b dark:border-slate-800">🚚 Logística Predictiva y Transporte</span>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 border dark:border-slate-800 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Truck className="text-teal-500" size={16} />
                          <div>
                            <p className="text-slate-900 dark:text-white capitalize">{selectedPedido.flete_tipo.replace('_', ' ')}</p>
                            {selectedPedido.flete_cobertura && <p className="text-[10px] text-slate-400 font-medium">Cobertura: {selectedPedido.flete_cobertura}</p>}
                          </div>
                        </div>
                        <span className="text-slate-900 dark:text-white font-extrabold">${selectedPedido.flete_costo} Costo</span>
                      </div>
                    </div>

                    {/* Flujo Seña y Pago Acciones */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cambiar estado del Pago v2</span>
                          <div className="flex gap-1.5 mt-1.5">
                            <button 
                              onClick={() => updatePedidoStatus(selectedPedido.id, 'estado_pago', 'pendiente')}
                              className={cn("px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wide", selectedPedido.estado_pago === 'pendiente' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300')}
                            >
                              Pendiente
                            </button>
                            <button 
                              onClick={() => updatePedidoStatus(selectedPedido.id, 'estado_pago', 'señado')}
                              className={cn("px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wide", selectedPedido.estado_pago === 'señado' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300')}
                            >
                              Señado
                            </button>
                            <button 
                              onClick={() => updatePedidoStatus(selectedPedido.id, 'estado_pago', 'pagado_total')}
                              className={cn("px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wide", selectedPedido.estado_pago === 'pagado_total' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300')}
                            >
                              Pagado Total
                            </button>
                          </div>
                        </div>

                        {selectedPedido.modalidad === 'produccion' && (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">¿Seña Pagada?</span>
                            <div className="flex gap-1.5 mt-1.5">
                              <button 
                                onClick={() => updatePedidoStatus(selectedPedido.id, 'sena_pagada', true)}
                                className={cn("px-3 py-1 rounded text-[10px] font-bold", selectedPedido.sena_pagada ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350')}
                              >
                                Sí
                              </button>
                              <button 
                                onClick={() => updatePedidoStatus(selectedPedido.id, 'sena_pagada', false)}
                                className={cn("px-3 py-1 rounded text-[10px] font-bold", !selectedPedido.sena_pagada ? 'bg-slate-400 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-405')}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Control de Producción para Fábrica */}
                      {selectedPedido.modalidad === 'produccion' && (
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 space-y-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-500 block">Cambiar Estado Operación (Fábrica G3D)</span>
                          <div className="flex flex-wrap gap-1">
                            {['pendiente_diseno', 'en_cola', 'laminando', 'imprimiendo', 'post_procesado', 'listo_taller'].map(statusName => (
                              <button
                                key={statusName}
                                onClick={() => updatePedidoStatus(selectedPedido.id, 'estado_produccion', statusName)}
                                className={cn(
                                  "px-2 py-1 rounded text-[9px] uppercase font-black tracking-wider transition-none",
                                  selectedPedido.estado_produccion === statusName 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                )}
                              >
                                {statusName.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WhatsApp al instante */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-250 dark:border-emerald-900/10 p-4 rounded-xl space-y-3">
                        <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block"><Phone className="inline mr-1" size={12} /> Coordinación al Instante (WhatsApp Cliente Directo)</span>
                        <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800 text-[11px] font-mono select-all text-slate-500 dark:text-slate-350 leading-relaxed">
                          Hola {selectedPedido.cliente_nombre}, soy tu vendedor de G3D. Te escribo por tu compra de '{selectedPedido.producto_nombre}'. Estado actual de tu pedido: *{selectedPedido.estado_pago.toUpperCase()}* y entrega *{selectedPedido.flete_tipo.toUpperCase()}*.{selectedPedido.modalidad === 'produccion' && ` (Seña Requerida: $${selectedPedido.sena_monto})`}. Coordinamos detalles.
                        </div>

                        <a 
                          href={`https://wa.me/${selectedPedido.cliente_telefono?.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex justify-center items-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                        >
                          <Phone size={14} /> Enviar Mensaje de WhatsApp Real
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 text-center text-slate-400 font-bold text-xs">
                    Selecciona un pedido de la lista de la izquierda para ver su hoja de ruta e información técnica.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA SECUNDARIA: ÁREA DE FÁBRICA / OPERARIOS */}
      {activeTab === 'fabrica' && (
        <div className="space-y-4 text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Printer size={16} /> Panel de Producción Operativa G3D (Fábrica)
            </h2>
            <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
              Los operarios de impresión 3D no necesitan detalles comerciales. Aquí ven únicamente las órdenes vigentes que requieren producción, sus fichas técnicas de impresión y el enlazado unificado para descarga directa de STL desde Google Drive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidos.filter(p => p.modalidad === 'produccion').length === 0 ? (
              <div className="col-span-1 md:col-span-3 text-center border p-12 bg-white dark:bg-slate-900 rounded-2xl text-slate-500 text-xs font-bold leading-relaxed">
                <Printer size={32} className="mx-auto text-slate-350 mb-2" />
                Ningún pedido de Sandbox v2 requiere operaciones en taller de impresión actualmente.
              </div>
            ) : (
              pedidos.filter(p => p.modalidad === 'produccion').map(o => (
                <div 
                  key={o.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start border-b dark:border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none">⚙️ Orden Técnica</span>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white mt-1">{o.producto_nombre}</h3>
                      {o.variante_nombre && <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Variante: {o.variante_nombre}</p>}
                    </div>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
                      Q: {o.cantidad}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-350">
                    <div className="flex justify-between">
                      <span>Estatus Fábrica:</span>
                      <span className="text-amber-500 uppercase text-[10px]">{o.estado_produccion.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border dark:border-slate-850">
                      <span className="text-[8px] text-amber-500 block uppercase font-extrabold pb-1">⚙ Ficha de Laminación & Notas</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-semibold line-clamp-3 leading-relaxed" title={o.instrucciones_operario}>
                        {o.instrucciones_operario || 'Sin instrucciones específicas adjuntas por administración.'}
                      </p>
                    </div>

                    {/* Enlace de Descarga de Google Drive STL */}
                    <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/20 p-3 rounded-lg space-y-2 text-center">
                      <span className="text-[9px] text-indigo-505 dark:text-indigo-400 block font-black uppercase tracking-wider">📁 Repositorio STL Unificado</span>
                      {o.drive_stl_link ? (
                        <div className="flex flex-col gap-1.5">
                          <a 
                            href={convertDriveLinkToDirect(o.drive_stl_link)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow transition-colors"
                          >
                            <FileDown size={12} /> Descargar STL Directo (1 Click)
                          </a>
                          <a 
                            href={o.drive_stl_link}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-605 text-[9px] flex items-center justify-center gap-1 underline font-medium"
                          >
                            Abrir carpeta compartida en Drive <ExternalLink size={9} />
                          </a>
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-404 font-bold italic">No se ha enlazado ningún archivo STL de Google Drive.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t dark:border-slate-800">
                    <select
                      value={o.estado_produccion}
                      onChange={e => updatePedidoStatus(o.id, 'estado_produccion', e.target.value as any)}
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 rounded-lg text-[10px] font-bold py-1 px-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="pendiente_diseno">Pendiente Diseño</option>
                      <option value="en_cola">En Cola</option>
                      <option value="laminando">Laminando</option>
                      <option value="imprimiendo">Imprimiendo</option>
                      <option value="post_procesado">Post-Procesado</option>
                      <option value="listo_taller">Listo en Taller</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO PEDIDO V2 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Cargar Registro de Pedido Real (Sandbox v2)</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 overflow-y-auto space-y-4 text-left custom-scrollbar leading-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Canal */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Canal Originador</span>
                  <select 
                    value={newOrder.canal}
                    onChange={e => setNewOrder({...newOrder, canal: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="tienda">Tienda Web Pública (Cliente Directo)</option>
                    <option value="revendedor">Revendedor Mayorista (Distribuidor)</option>
                  </select>
                </div>

                {/* Revendedor Nombre */}
                {newOrder.canal === 'revendedor' && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-405 block tracking-wider">Nombre del Revendedor *</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Distribuidor Sandro SRL"
                      value={newOrder.revendedor_nombre}
                      onChange={e => setNewOrder({...newOrder, revendedor_nombre: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Cliente Info */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Datos de Enrutado del Comprador</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Nombre Completo *</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Sandra García"
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                      value={newOrder.cliente_nombre}
                      onChange={e => setNewOrder({...newOrder, cliente_nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">WhatsApp de Contacto</span>
                    <input 
                      type="text" 
                      placeholder="e.g. +5491122334455"
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={newOrder.cliente_telefono}
                      onChange={e => setNewOrder({...newOrder, cliente_telefono: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Dirección de Entrega</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Av Corrientes 1250 4B"
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={newOrder.cliente_direccion}
                      onChange={e => setNewOrder({...newOrder, cliente_direccion: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Catálogo */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Selección de Ítems del Catálogo Unificado</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Elegir Producto *</span>
                    <select 
                      value={newOrder.producto_id}
                      onChange={e => setNewOrder({...newOrder, producto_id: e.target.value, variante_id: ''})}
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      required
                    >
                      <option value="">Selecciona un producto...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.modalidad === 'produccion' ? 'Bajo Pedido' : `Stock: ${p.stock_global}`})</option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && selectedProduct.variantes && selectedProduct.variantes.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 block">Elegir Variante de Producto *</span>
                      <select 
                        value={newOrder.variante_id}
                        onChange={e => setNewOrder({...newOrder, variante_id: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                        required
                      >
                        <option value="">Selecciona variante...</option>
                        {selectedProduct.variantes.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.combinacion || v.nombre} - Precio: ${v.precio} | Q: {v.stock}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Mostrar Info del Producto Seleccionado */}
                {selectedProduct && (
                  <div className="p-3 rounded-lg bg-indigo-50/20 dark:bg-indigo-950/20 text-xs text-slate-655 dark:text-slate-350 space-y-2">
                    <h4 className="font-extrabold text-[10px] text-indigo-505 uppercase tracking-wide">🔍 Información y Propósito del Item</h4>
                    
                    {/* Niveles de Propósito */}
                    <div className="space-y-1.5">
                      <p>🟢 <strong>Clientes (Tienda Web):</strong> {selectedProduct.detalle_cliente || 'Sin detalle público.'}</p>
                      
                      {newOrder.canal === 'revendedor' && (
                        <p className="border-t dark:border-slate-850 pt-1 text-teal-600 dark:text-teal-400">
                          🔵 <strong>Distribución (Mayorista):</strong> {selectedProduct.descripcion_mayorista || selectedProduct.descripcion || 'Sin condiciones especiales.'}
                        </p>
                      )}

                      {selectedProduct.modalidad === 'produccion' && (
                        <p className="border-t dark:border-slate-850 pt-1 text-amber-600 dark:text-amber-400">
                          🟠 <strong>Laminado (Operaciones):</strong> {selectedProduct.instrucciones_internas || 'Ficha de producción general.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cantidades & Precios */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs leading-none">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Cantidad</span>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    value={newOrder.cantidad}
                    onChange={e => setNewOrder({...newOrder, cantidad: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Precio Manual ($)</span>
                  <input 
                    type="number" 
                    placeholder="Auto del catálogo"
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none placeholder:text-[9.5px]"
                    value={newOrder.precio_personalizado}
                    onChange={e => setNewOrder({...newOrder, precio_personalizado: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-405 block">Comis. Plataf (%)</span>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    value={newOrder.comision_plataforma}
                    onChange={e => setNewOrder({...newOrder, comision_plataforma: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-405 block">Comis. Influ (%)</span>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    value={newOrder.comision_influencer}
                    onChange={e => setNewOrder({...newOrder, comision_influencer: e.target.value})}
                  />
                </div>
              </div>

              {/* Estatus Inicial V1 */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block font-black">Estatus Inicial del Pedido V1 (Diccionario)</span>
                <select 
                  value={newOrder.estado_id}
                  onChange={e => setNewOrder({...newOrder, estado_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none font-bold"
                >
                  {availableStatuses.map(st => (
                    <option key={st.id} value={st.id}>{st.nombre_estado}</option>
                  ))}
                  {availableStatuses.length === 0 && (
                    <option value="">-- Sin estados de diccionario --</option>
                  )}
                </select>
              </div>

              {/* Logística Predictiva Form */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-404 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Módulo de Envíos & Fletes Especiales</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Canal de Logística</span>
                    <select 
                      value={newOrder.flete_tipo}
                      onChange={e => setNewOrder({...newOrder, flete_tipo: e.target.value as any})}
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="retiro">Retiro en Taller / Local</option>
                      <option value="propio">Delivery Propio (Flejero)</option>
                      <option value="uber_moto">Uber / Cadetería en Moto</option>
                      <option value="uber_auto">Uber en Auto (Grande)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Costo de Envío ($)</span>
                    <input 
                      type="number" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={newOrder.flete_costo}
                      onChange={e => setNewOrder({...newOrder, flete_costo: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Zonificación / Notas</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Zona Oeste Recargo"
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={newOrder.flete_cobertura}
                      onChange={e => setNewOrder({...newOrder, flete_cobertura: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Seña pagada */}
              {selectedProduct && selectedProduct.modalidad === 'produccion' && (
                <div className="flex items-center gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/10 text-xs">
                  <input 
                    type="checkbox" 
                    id="chkSena"
                    checked={newOrder.sena_pagada}
                    onChange={e => setNewOrder({...newOrder, sena_pagada: e.target.checked})}
                    className="size-4 text-indigo-600 focus:ring-indigo-505 rounded"
                  />
                  <label htmlFor="chkSena" className="text-slate-800 dark:text-slate-205 font-bold cursor-pointer">
                    ¿El cliente ya pagó la Seña Requerida?
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md text-center"
                >
                  Registrar Pedido v2
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:text-slate-800 text-slate-600 dark:text-slate-300 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / COMPLETAR DATOS DEL PEDIDO V2 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Código: {editOrder.id}</span>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none mt-1">Completar Datos & Modificación</h2>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="p-5 overflow-y-auto space-y-4 text-left custom-scrollbar leading-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Canal */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Canal de Ventas</span>
                  <select 
                    value={editOrder.canal}
                    onChange={e => setEditOrder({...editOrder, canal: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="tienda">Tienda Web Pública (Cliente Directo)</option>
                    <option value="revendedor">Revendedor Mayorista (Distribuidor)</option>
                  </select>
                </div>

                {/* Revendedor Nombre */}
                {editOrder.canal === 'revendedor' && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-405 block tracking-wider">Nombre del Revendedor *</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Distribuidor Sandro SRL"
                      value={editOrder.revendedor_nombre}
                      onChange={e => setEditOrder({...editOrder, revendedor_nombre: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Cliente Info */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Datos de Enrutado del Comprador</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Nombre Completo *</span>
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={editOrder.cliente_nombre}
                      onChange={e => setEditOrder({...editOrder, cliente_nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">WhatsApp de Contacto</span>
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={editOrder.cliente_telefono}
                      onChange={e => setEditOrder({...editOrder, cliente_telefono: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Dirección de Entrega</span>
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      value={editOrder.cliente_direccion}
                      onChange={e => setEditOrder({...editOrder, cliente_direccion: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Catálogo */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Preferencia de Ítems e Inventario</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Elegir Producto *</span>
                    <select 
                      value={editOrder.producto_id}
                      onChange={e => setEditOrder({...editOrder, producto_id: e.target.value, variante_id: ''})}
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      required
                    >
                      <option value="">Selecciona un producto...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.modalidad === 'produccion' ? 'Bajo Pedido' : `Stock: ${p.stock_global}`})</option>
                      ))}
                    </select>
                  </div>

                  {editOrder.producto_id && productos.find(pr => pr.id === editOrder.producto_id)?.variantes?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 block">Elegir Variante de Producto</span>
                      <select 
                        value={editOrder.variante_id}
                        onChange={e => setEditOrder({...editOrder, variante_id: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="">Selecciona variante...</option>
                        {productos.find(pr => pr.id === editOrder.producto_id)?.variantes?.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.combinacion || v.nombre} - Precio: ${v.precio} | Q: {v.stock}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Cantidad & Específico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-none">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Cantidad Requerida</span>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    value={editOrder.cantidad}
                    onChange={e => setEditOrder({...editOrder, cantidad: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Precio Unitario override ($)</span>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-855 dark:text-slate-100 focus:outline-none"
                    value={editOrder.precio_personalizado}
                    onChange={e => setEditOrder({...editOrder, precio_personalizado: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Estatus de Pedido V1 (Diccionario)</span>
                  <select 
                    value={editOrder.estado_id}
                    onChange={e => setEditOrder({...editOrder, estado_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none font-bold"
                  >
                    <option value="">-- Sin Estado --</option>
                    {availableStatuses.map(st => (
                      <option key={st.id} value={st.id}>{st.nombre_estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logística Predictiva Edit */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Módulo de Envíos & Fletes Especiales</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Canal de Logística</span>
                    <select 
                      value={editOrder.flete_tipo}
                      onChange={e => setEditOrder({...editOrder, flete_tipo: e.target.value as any})}
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="retiro">Retiro en Taller / Local</option>
                      <option value="propio">Delivery Propio (Flejero)</option>
                      <option value="uber_moto">Uber / Cadetería en Moto</option>
                      <option value="uber_auto">Uber en Auto (Grande)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Costo de Envío ($)</span>
                    <input 
                      type="number" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                      value={editOrder.flete_costo}
                      onChange={e => setEditOrder({...editOrder, flete_costo: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Zonificación / Notas</span>
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                      value={editOrder.flete_cobertura}
                      onChange={e => setEditOrder({...editOrder, flete_cobertura: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Ficha Especialidades de Impresión 3D */}
              <div className="space-y-3 p-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold leading-normal">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest border-b dark:border-slate-855 pb-1 mb-1">Ficha de Laminación para Fábrica</span>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Enlace de Carpeta STL de Google Drive Compartido (Convertido automáticamente a descarga)</span>
                    <input 
                      type="url" 
                      placeholder="e.g. https://drive.google.com/drive/folders/..."
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none font-mono"
                      value={editOrder.drive_stl_link}
                      onChange={e => setEditOrder({...editOrder, drive_stl_link: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 block">Especificaciones Técnicas e Instrucciones del Operario / Diseñador</span>
                    <textarea 
                      placeholder="e.g. Laminar con infill de 15% giroide, boquilla de 0.4 mm, PLA Gris..."
                      rows={3}
                      className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none leading-relaxed font-semibold"
                      value={editOrder.instrucciones_operario}
                      onChange={e => setEditOrder({...editOrder, instrucciones_operario: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md text-center"
                >
                  Guardar Cambios Integrados
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:text-slate-800 text-slate-600 dark:text-slate-300 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
