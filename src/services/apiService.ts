/**
 * API SERVICE - CONEXIÓN CON SUPABASE (POSTGRESQL REAL-TIME)
 */
import { supabase, isOfflineMode } from '../lib/supabase';

export const apiService = {
  /**
   * Obtiene datos detallados del Dashboard
   */
  async getDashboardStats() {
    try {
      // 1. Obtener configuración de cuadros
      const { data: configCuadros, error: configError } = await supabase
        .from('configuracion_cuadros_inicio')
        .select('*')
        .order('orden');

      if (configError) throw configError;

      // 2. Obtener conteos para cada cuadro
      const cuadrosWithCounts = await Promise.all((configCuadros || []).map(async (cuadro) => {
        const { count, error } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .in('estado_id', cuadro.estados_ids || []);
        
        return {
          ...cuadro,
          count: count || 0
        };
      }));

      // 3. Finanzas del Negocio
      // Obtener todos los pedidos activos para clasificar y sumar
      const { data: allActiveOrders, error: activeError } = await supabase
        .from('pedidos')
        .select('saldo, estado_id, estado:estado_id(nombre_estado)');

      if (activeError) throw activeError;

      let debtorsCount = 0;
      let totalPending = 0;
      let budgetsCount = 0;
      let activosCount = 0;

      const seenDebtors = new Set();

      (allActiveOrders || []).forEach(order => {
        const est = order.estado as any;
        const status = (est?.nombre_estado || "").trim().toUpperCase();
        const isQuote = status.includes('PRESUPUEST') || status.includes('PREUPUEST') || status.includes('COTIZA');
        const saldo = parseFloat(order.saldo) || 0;

        if (isQuote) {
          budgetsCount++;
        } else {
          activosCount++;
          if (saldo > 0) {
            totalPending += saldo;
            debtorsCount++;
          }
        }
      });

      // Pedidos Finalizados (Entregados con Saldo 0) para estadísticas y gráfico
      // Asumiendo estado "Entregado" se verifica uniendo. Mapeamos luego.
      const { data: finishedOrdersData, error: finishedError } = await supabase
        .from('pedidos')
        .select('codigo_pedido, fecha_entrega, monto_total, saldo, estado:estado_id(nombre_estado)')
        .lte('saldo', 0)
        .not('fecha_entrega', 'is', null)
        .order('fecha_entrega', { ascending: false });

      if (finishedError) throw finishedError;
      
      const realFinished = (finishedOrdersData || []).filter(o => (o.estado as any)?.nombre_estado === 'Entregado').map(o => ({
         id_pedido: o.codigo_pedido,
         fecha_entrega: o.fecha_entrega,
         precio_total: o.monto_total,
         saldo: o.saldo
      }));

      // Pedidos Finalizados Hoy (para el conteo inicial)
      const today = new Date().toISOString().split('T')[0];
      const finishedToday = (finishedOrdersData || []).filter(o => 
        o.fecha_entrega && o.fecha_entrega.startsWith(today)
      ).length;

      // 4. Gráfico de Crecimiento (Simulado/Real)
      // Obtenemos pagos recientes para la línea de dinero
      const { data: recentPayments } = await supabase
        .from('pagos')
        .select('monto, created_at')
        .order('created_at', { ascending: true });

      // 5. Control de Calidad (Insumos sin imagen)
      const { count: noImageCount } = await supabase
        .from('insumos')
        .select('*', { count: 'exact', head: true })
        .or('imagenes.is.null');

      // También contar los que tienen array vacío si es posible, 
      // pero en Supabase con text[] suele ser null o tener datos.
      // Para estar seguros, traemos todos y filtramos si la query anterior no es suficiente,
      // pero por ahora usemos null.

      return {
        cuadros: cuadrosWithCounts,
        finanzas: {
          debtorsCount: debtorsCount || 0,
          totalPending,
          finishedCount: finishedToday,
        allFinishedOrders: realFinished,
          budgetsCount: budgetsCount || 0,
          activosCount: activosCount || 0
        },
        calidad: {
          noImageCount: noImageCount || 0
        },
        chartData: {
          payments: recentPayments || [],
          finishedOrders: realFinished
        }
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return null;
    }
  },

  /**
   * Obtiene datos del Dashboard (KPIs y Estados de Cuenta) - DEPRECATED (use getDashboardStats)
   */
  async getDashboardData() {
    try {
      const { data: orders, error } = await supabase
        .from('pedidos')
        .select('*');

      if (error) throw error;

      const kpis: Record<string, number> = {
        "Presupuesto": 0,
        "Falta Diseñar": 0,
        "Diseñado": 0,
        "En Proceso": 0,
        "Pendiente Entrega": 0
      };
      
      let totalSaldo = 0;
      let debtorsCount = 0;
      const seenDebtors = new Set();

      // Sales metrics
      let weeklySales = 0;
      let monthlySales = 0;
      let yearlySales = 0;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      orders.forEach(order => {
        const orderDate = new Date(order.fecha_creacion || order.created_at);
        const price = parseFloat(order.precio_total) || 0;

        if (orderDate >= startOfWeek) weeklySales += price;
        if (orderDate >= startOfMonth) monthlySales += price;
        if (orderDate >= startOfYear) yearlySales += price;

        if (order.archivado !== "SI") {
          const status = order.estado_pedido || "";
          const saldo = parseFloat(order.saldo) || 0;
          const isFinished = status === 'Entregado' && saldo <= 0;

          if (!isFinished) {
            // Case-insensitive matching but mapping to the specific keys
            const normalizedStatus = status.toLowerCase();
            if (normalizedStatus === 'presupuesto') kpis["Presupuesto"]++;
            else if (normalizedStatus === 'falta diseñar') kpis["Falta Diseñar"]++;
            else if (normalizedStatus === 'diseñado') kpis["Diseñado"]++;
            else if (normalizedStatus === 'en proceso' || normalizedStatus === 'en fabricación') kpis["En Proceso"]++;
            else if (normalizedStatus === 'pendiente entrega') kpis["Pendiente Entrega"]++;
          }
          
          if (saldo > 0) {
            totalSaldo += saldo;
            if (!seenDebtors.has(order.cliente_nombre)) {
              debtorsCount++;
              seenDebtors.add(order.cliente_nombre);
            }
          }
        }
      });

      return {
        kpis,
        totalSaldo,
        debtorsCount,
        totalOrders: orders.length,
        sales: {
          weekly: weeklySales,
          monthly: monthlySales,
          yearly: yearlySales
        }
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return null;
    }
  },

  /**
   * Obtiene un pedido por su ID
   */
  async getOrderById(id: string) {
    try {
      let data: any = null;
      // 1. Intentar primero consulta relacional
      const { data: relData } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:cliente_id(*),
          vendedor:vendedor_id(id, nombre),
          estado:estado_id(*),
          items:pedido_items(
            *,
            insumo:insumo_id(*)
          )
        `)
        .or(`codigo_pedido.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (relData) {
        data = relData;
      } else {
        // Fallback: consulta plana
        const { data: flatData } = await supabase
          .from('pedidos')
          .select('*')
          .or(`codigo_pedido.eq.${id},id.eq.${id}`)
          .maybeSingle();
        data = flatData;
      }

      if (data) {
        const refId = data.codigo_pedido || data.id_pedido || data.id;

        let meta: any = {};
        if (Array.isArray(data.notas_tecnicas) && data.notas_tecnicas.length > 0) {
          try {
            meta = JSON.parse(data.notas_tecnicas[0]);
          } catch {}
        } else if (typeof data.notas_tecnicas === 'string' && data.notas_tecnicas.trim().startsWith('{')) {
          try {
            meta = JSON.parse(data.notas_tecnicas);
          } catch {}
        }

        const rawOrder = meta.raw_order || {};
        const metaItems = meta.items && Array.isArray(meta.items) ? meta.items : [];
        const dbItems = data.items && Array.isArray(data.items) ? data.items : [];
        
        const itemsList = dbItems.length > 0 ? dbItems.map((i: any, idx: number) => {
          const mItem = metaItems[idx] || {};
          return {
            ...mItem,
            ...i,
            item: i.descripcion_custom || i.descripcion || mItem.item || mItem.item_nombre || 'Ítem G3D',
            descripcion_custom: i.descripcion_custom || mItem.descripcion_custom || i.descripcion || '',
            descripcion_fabricacion: i.descripcion_fabricacion || mItem.descripcion_fabricacion || mItem.notas_fabricacion || '',
            variante: i.variante || mItem.variante || mItem.tarifa || '',
            cantidad: i.cantidad || mItem.cantidad || 1,
            precio: parseFloat(i.precio_unitario || i.precio || mItem.precio || 0)
          };
        }) : (metaItems.length > 0 ? metaItems : []);

        const capturas = meta.capturas_pago || data.capturas_pago || data.comprobantes_pago || (data.comprobante_url ? [data.comprobante_url] : []);

        return {
          ...rawOrder,
          ...data,
          id: refId,
          id_pedido: refId,
          codigo_pedido: refId,
          cliente_id: data.cliente_id || data.cliente?.id || null,
          cliente_nombre: data.cliente?.nombre || data.cliente_nombre_temporal || data.cliente_nombre || 'Sin Nombre',
          cliente_telefono: data.cliente?.telefono_contacto || data.cliente_telefono_temporal || data.cliente_telefono || '',
          cliente_email: data.cliente?.email || data.cliente_email || '',
          cliente_direccion: data.cliente?.direccion_hogar || data.cliente_direccion || '',
          vendedor: data.vendedor?.nombre || data.vendedor_temporal || data.vendedor || 'Vendedor General',
          estado_pedido: data.estado?.nombre_estado || data.estado_pedido || data.estado || 'SIN DEFINIR',
          precio_total: parseFloat(data.monto_total ?? data.precio_total ?? data.precio ?? 0),
          total_pagado: parseFloat(data.monto_pagado ?? data.total_pagado ?? data.seña ?? 0),
          precio: parseFloat(data.precio ?? data.monto_total ?? data.precio_total ?? 0),
          seña: parseFloat(data.seña ?? data.monto_pagado ?? data.total_pagado ?? 0),
          items: itemsList.length > 0 ? itemsList : (rawOrder.items || []),
          capturas_pago: capturas,
          comprobantes_pago: capturas,
          bitacora_fabricacion: meta.bitacora_fabricacion || data.bitacora_fabricacion || []
        };
      }

      // Buscar en local storage
      const localDesigned = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const localV2 = JSON.parse(localStorage.getItem('g3d_pedidos_v2') || '[]');
      const foundLocal = [...localDesigned, ...localV2].find((o: any) => (o.id === id || o.id_pedido === id || o.codigo_pedido === id));
      if (foundLocal) {
        const lId = foundLocal.id || foundLocal.id_pedido || foundLocal.codigo_pedido;
        return {
          ...foundLocal,
          id: lId,
          id_pedido: lId,
          precio_total: parseFloat(foundLocal.precio_total ?? foundLocal.precio ?? 0),
          total_pagado: parseFloat(foundLocal.total_pagado ?? foundLocal.seña ?? 0)
        };
      }

      return null;
    } catch (error) {
      console.warn("Error fetching order by ID, buscando en respaldo local:", error);
      const localDesigned = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const localV2 = JSON.parse(localStorage.getItem('g3d_pedidos_v2') || '[]');
      const foundLocal = [...localDesigned, ...localV2].find((o: any) => (o.id === id || o.id_pedido === id || o.codigo_pedido === id));
      return foundLocal || null;
    }
  },

  /**
   * Obtiene todos los pedidos (con respaldo híbrido relacional/plano/local)
   */
  async getOrders() {
    try {
      let ordersData: any[] = [];
      let fetchFailed = false;

      // 1. Consulta liviana y veloz sobre la tabla principal de pedidos
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select(`
            *,
            estado:estado_id(id, nombre_estado, color_pastel_hex)
          `)
          .order('fecha_creacion', { ascending: false });

        if (!error && data) {
          ordersData = data;
        } else {
          fetchFailed = true;
        }
      } catch {
        fetchFailed = true;
      }

      // 2. Si falló la relacional, intentar consulta plana directa
      if (fetchFailed) {
        try {
          const { data: flatData, error: flatError } = await supabase
            .from('pedidos')
            .select('*');

          if (!flatError && flatData) {
            ordersData = flatData;
          }
        } catch (flatErr) {
          console.warn("[apiService.getOrders] Consulta plana también falló, usando caché local:", flatErr);
        }
      }

      // 3. Mapear de forma flexible los pedidos de la base de datos
      const mappedDbOrders = (ordersData || []).map(o => {
        const refId = o.codigo_pedido || o.id_pedido || o.id;
        const items = o.items && Array.isArray(o.items) ? o.items : [];
        
        let meta: any = {};
        if (Array.isArray(o.notas_tecnicas) && o.notas_tecnicas.length > 0) {
          try {
            meta = JSON.parse(o.notas_tecnicas[0]);
          } catch {}
        } else if (typeof o.notas_tecnicas === 'string' && o.notas_tecnicas.trim().startsWith('{')) {
          try {
            meta = JSON.parse(o.notas_tecnicas);
          } catch {}
        }

        const rawOrder = meta.raw_order || {};
        const mergedItems = meta.items && Array.isArray(meta.items) && meta.items.length > 0
          ? meta.items
          : (items.length > 0 ? items.map((i: any) => ({
              item: i.descripcion_custom || i.descripcion || i.item || 'Ítem G3D',
              cantidad: i.cantidad || 1,
              precio: parseFloat(i.precio_unitario || i.precio || 0),
              confirmado: Boolean(i.confirmado)
            })) : [{
              item: o.descripcion_general || o.descripcion || 'Ítem G3D',
              cantidad: o.cantidad || 1,
              precio: parseFloat(o.monto_total ?? o.precio ?? 0)
            }]);

        const capturas = meta.capturas_pago || o.capturas_pago || o.comprobantes_pago || (o.comprobante_url ? [o.comprobante_url] : []);
        const descFromItems = mergedItems.map((i: any) => i.item || i.descripcion_custom || i.descripcion || '').filter(Boolean).join(' || ');

        return {
          ...rawOrder,
          ...o,
          id: refId,
          id_pedido: refId,
          codigo_pedido: refId,
          cliente_nombre: o.cliente?.nombre || o.cliente_nombre_temporal || o.cliente_nombre || o.cliente || 'Sin Nombre',
          cliente_telefono: o.cliente?.telefono_contacto || o.cliente_telefono_temporal || o.cliente_telefono || o.telefono || '',
          cliente_email: o.cliente?.email || o.cliente_email || '',
          cliente_direccion: o.cliente?.direccion_hogar || o.cliente_direccion || '',
          vendedor: o.vendedor?.nombre || o.vendedor_temporal || o.vendedor || 'Vendedor General',
          vendedor_telefono: meta.vendedor_telefono || o.vendedor_telefono || '',
          estado_pedido: o.estado?.nombre_estado || o.estado_pedido || o.estado || 'Pendiente',
          precio_total: parseFloat(o.monto_total ?? o.precio_total ?? o.precio ?? 0),
          total_pagado: parseFloat(o.monto_pagado ?? o.total_pagado ?? o.seña ?? 0),
          precio: parseFloat(o.monto_total ?? o.precio_total ?? o.precio ?? 0),
          seña: parseFloat(o.monto_pagado ?? o.total_pagado ?? o.seña ?? 0),
          descripcion: descFromItems || o.descripcion_general || o.descripcion || '',
          item_nombre: mergedItems[0]?.item || descFromItems || 'Ítem G3D',
          cantidad: mergedItems.reduce((acc: number, curr: any) => acc + (curr.cantidad || 1), 0),
          fecha: o.fecha_creacion || o.fecha || o.created_at || new Date().toISOString(),
          fecha_creacion: o.fecha_creacion || o.fecha || o.created_at || new Date().toISOString(),
          items: mergedItems,
          capturas_pago: capturas,
          comprobantes_pago: capturas,
          comprobante_url: capturas[0] || o.comprobante_url || null,
          producto_confirmado: meta.producto_confirmado !== undefined ? meta.producto_confirmado : Boolean(o.producto_confirmado),
          bitacora_fabricacion: meta.bitacora_fabricacion || o.bitacora_fabricacion || []
        };
      });

      // 4. Traer respaldos guardados en local storage para no perder registros locales
      const localDesigned = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const localV2 = JSON.parse(localStorage.getItem('g3d_pedidos_v2') || '[]');

      const seenIds = new Set(mappedDbOrders.map((o: any) => o.id_pedido));
      const combined = [...mappedDbOrders];

      [...localDesigned, ...localV2].forEach((locOrder: any) => {
        const lId = locOrder.id || locOrder.id_pedido || locOrder.codigo_pedido;
        if (lId && !seenIds.has(lId)) {
          seenIds.add(lId);
          combined.push({
            ...locOrder,
            id: lId,
            id_pedido: lId,
            codigo_pedido: lId,
            cliente_nombre: locOrder.cliente_nombre || 'Sin Nombre',
            cliente_telefono: locOrder.cliente_telefono || '',
            vendedor: locOrder.vendedor || 'Vendedor General',
            estado_pedido: locOrder.estado_pedido || locOrder.estado || 'Pendiente',
            precio_total: parseFloat(locOrder.precio_total ?? locOrder.precio ?? 0),
            total_pagado: parseFloat(locOrder.total_pagado ?? locOrder.seña ?? 0),
            precio: parseFloat(locOrder.precio ?? locOrder.precio_total ?? 0),
            seña: parseFloat(locOrder.seña ?? locOrder.total_pagado ?? 0),
            descripcion: locOrder.descripcion || locOrder.item_nombre || (locOrder.items ? locOrder.items.map((i: any) => i.item || i.descripcion).join(' || ') : ''),
            cantidad: locOrder.cantidad || locOrder.item_cantidad || 1,
            fecha_creacion: locOrder.fecha_creacion || locOrder.fecha || new Date().toISOString()
          });
        }
      });

      // Sincronizar automáticamente la caché local con Supabase
      try {
        localStorage.setItem('g3d_designed_orders', JSON.stringify(combined));
      } catch (_sErr) {}

      return combined;
    } catch (error) {
      console.warn("[apiService.getOrders] Usando respaldo de pedidos en almacenamiento local:", error);
      const localDesigned = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const localV2 = JSON.parse(localStorage.getItem('g3d_pedidos_v2') || '[]');
      const mapLocal = (o: any) => {
        const lId = o.id || o.id_pedido || o.codigo_pedido;
        return {
          ...o,
          id: lId,
          id_pedido: lId,
          codigo_pedido: lId,
          cliente_nombre: o.cliente_nombre || 'Sin Nombre',
          cliente_telefono: o.cliente_telefono || '',
          vendedor: o.vendedor || 'Vendedor General',
          estado_pedido: o.estado_pedido || o.estado || 'Pendiente',
          precio_total: parseFloat(o.precio_total ?? o.precio ?? 0),
          total_pagado: parseFloat(o.total_pagado ?? o.seña ?? 0),
          precio: parseFloat(o.precio ?? o.precio_total ?? 0),
          seña: parseFloat(o.seña ?? o.total_pagado ?? 0),
          descripcion: o.descripcion || o.item_nombre || '',
          cantidad: o.cantidad || 1,
          fecha_creacion: o.fecha_creacion || o.fecha || new Date().toISOString()
        };
      };
      
      const combinedLocal = [...localDesigned.map(mapLocal), ...localV2.map(mapLocal)];
      const uniqueLocal: any[] = [];
      const seen = new Set();
      combinedLocal.forEach(item => {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          uniqueLocal.push(item);
        }
      });
      return uniqueLocal;
    }
  },

  /**
   * Guarda o actualiza un pedido de diseño G3D de manera síncrona en Supabase y respaldo local
   */
  async saveG3dOrder(order: any) {
    try {
      const id = order.id || order.id_pedido || order.codigo_pedido || `G3D-${Date.now()}`;
      const totalAmount = parseFloat(order.precio ?? order.precio_total ?? order.monto_total ?? 0);
      const paidAmount = parseFloat(order.seña ?? order.total_pagado ?? order.monto_pagado ?? 0);
      const itemsList = Array.isArray(order.items) ? order.items : [];
      const capturas = Array.isArray(order.capturas_pago) ? order.capturas_pago : (Array.isArray(order.comprobantes_pago) ? order.comprobantes_pago : (order.comprobante_url ? [order.comprobante_url] : []));

      const meta = {
        vendedor_telefono: order.vendedor_telefono || '',
        producto_confirmado: Boolean(order.producto_confirmado),
        capturas_pago: capturas,
        comprobantes_pago: capturas,
        bitacora_fabricacion: order.bitacora_fabricacion || [],
        items: itemsList,
        imagenes: order.imagenes || [],
        raw_order: { ...order, id, codigo_pedido: id }
      };

      const payload = {
        codigo_pedido: id,
        cliente_nombre_temporal: order.cliente_nombre || order.cliente || 'Sin Nombre',
        cliente_telefono_temporal: order.cliente_telefono || order.telefono || '',
        vendedor_temporal: order.vendedor || 'Vendedor General',
        monto_total: totalAmount,
        monto_pagado: paidAmount,
        tipo_trabajo: order.tipo_trabajo || 'Diseño G3D',
        descripcion_general: order.item_nombre || order.descripcion || (itemsList.length > 0 ? itemsList.map((i: any) => i.item || i.descripcion_custom || i.descripcion).filter(Boolean).join(' || ') : 'Pedido G3D'),
        notas_tecnicas: [JSON.stringify(meta)]
      };

      // 1. Persistir en Supabase (pedidos table)
      const { data: dbOrder, error: dbErr } = await supabase
        .from('pedidos')
        .upsert(payload, { onConflict: 'codigo_pedido' })
        .select('*')
        .maybeSingle();

      if (dbErr) {
        console.warn("[apiService.saveG3dOrder] Error guardando en Supabase pedidos:", dbErr.message);
      }

      const targetPedidoId = dbOrder?.id;

      // 2. Si tenemos ID de pedido y items, guardar en pedido_items
      if (targetPedidoId && itemsList.length > 0) {
        try {
          await supabase.from('pedido_items').delete().eq('pedido_id', targetPedidoId);

          const itemInserts = itemsList.map((it: any) => ({
            pedido_id: targetPedidoId,
            descripcion_custom: it.item || it.descripcion_custom || it.descripcion || 'Ítem G3D',
            cantidad: parseInt(String(it.cantidad || 1), 10),
            precio_unitario: parseFloat(String(it.precio || it.precio_unitario || totalAmount))
          }));

          await supabase.from('pedido_items').insert(itemInserts);
        } catch (itemErr) {
          console.warn("[apiService.saveG3dOrder] Error guardando items:", itemErr);
        }
      }

      // 3. Persistir también en LocalStorage (g3d_designed_orders)
      const local = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const existingIdx = local.findIndex((o: any) => (o.id === id || o.id_pedido === id || o.codigo_pedido === id));

      const fullOrderObj = {
        ...order,
        id,
        id_pedido: id,
        codigo_pedido: id,
        fecha: order.fecha || order.fecha_creacion || new Date().toISOString(),
        vendedor: payload.vendedor_temporal,
        vendedor_telefono: meta.vendedor_telefono,
        cliente_nombre: payload.cliente_nombre_temporal,
        cliente_telefono: payload.cliente_telefono_temporal,
        precio: totalAmount,
        precio_total: totalAmount,
        seña: paidAmount,
        total_pagado: paidAmount,
        capturas_pago: capturas,
        comprobantes_pago: capturas,
        comprobante_url: capturas[0] || null,
        producto_confirmado: meta.producto_confirmado,
        bitacora_fabricacion: meta.bitacora_fabricacion,
        items: itemsList
      };

      if (existingIdx >= 0) {
        local[existingIdx] = fullOrderObj;
      } else {
        local.unshift(fullOrderObj);
      }

      localStorage.setItem('g3d_designed_orders', JSON.stringify(local));

      return { success: true, data: fullOrderObj };
    } catch (err: any) {
      console.error("[apiService.saveG3dOrder] Error crítico:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Crea un nuevo pedido
   */
  async createOrder(payload: any, user: { name: string; role: string; permissions?: string[] }) {
    try {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-8);
      const codigoPedido = `G3D-${timestamp}`;
      
      const precioTotal = parseFloat(payload.PRECIO_TOTAL) || 0;
      const totalPagado = parseFloat(payload.TOTAL_PAGADO) || 0;

      // Intentamos recuperar o usar UUIDs si el frontend los mandara, 
      // si no, los pasamos a los temporales como hicimos en el SQL.
      
      // Necesitamos buscar el UUID del estado
      let estadoId = null;
      if (payload.ESTADO_PEDIDO) {
        const { data: estadoData } = await supabase
          .from('diccionario_estados_pedido')
          .select('id')
          .eq('nombre_estado', payload.ESTADO_PEDIDO)
          .maybeSingle();
        if (estadoData) estadoId = estadoData.id;
      }

      const { data: insertedOrder, error } = await supabase
        .from('pedidos')
        .insert([{
          codigo_pedido: codigoPedido,
          vendedor_temporal: payload.VENDEDOR || user.name,
          cliente_nombre_temporal: payload.CLIENTE_NOMBRE,
          cliente_telefono_temporal: payload.CLIENTE_TELEFONO,
          tipo_trabajo: payload.TIPO_TRABAJO,
          monto_total: precioTotal,
          monto_pagado: totalPagado,
          estado_id: estadoId,
          fecha_entrega: payload.FECHA_ENTREGA ? new Date(payload.FECHA_ENTREGA).toISOString() : null,
          lat: payload.LAT,
          lng: payload.LNG,
          delivery_min: payload.DELIVERY_MIN || 1,
          delivery_max: payload.DELIVERY_MAX || 3
        }])
        .select('*')
        .single();

      if (error) throw error;
      
      // Insertamos el texto completo de la descripción como un Item único si no nos pasaron array (Retrocompatibilidad)
      if (payload.DESCRIPCION) {
        await supabase.from('pedido_items').insert([{
           pedido_id: insertedOrder.id,
           descripcion_custom: payload.DESCRIPCION,
           cantidad: payload.CANTIDAD || 1,
           precio_unitario: precioTotal / (payload.CANTIDAD || 1)
        }]);
      }

      return { success: true, idPedido: codigoPedido };
    } catch (error) {
      console.error("Error creating order:", error);
      return { success: false, error };
    }
  },


  /**
   * Agrega texto a la descripción (Append)
   */
  async appendDescription(id: string, newText: string) {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('pedidos')
        .select('notas_tecnicas, codigo_pedido')
        .eq('codigo_pedido', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) throw new Error("Pedido no encontrado");

      const updatedDesc = order.notas_tecnicas 
        ? `${order.notas_tecnicas} /// ${newText}`
        : newText;

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ notas_tecnicas: updatedDesc })
        .eq('codigo_pedido', id);

      if (updateError) throw updateError;
      return { success: true };
    } catch (error) {
      console.error("Error appending description:", error);
      return { success: false };
    }
  },

  /**
   * Elimina pedidos de forma permanente
   */
  async deleteOrders(ids: string[]) {
    try {
      await supabase
        .from('pedidos')
        .delete()
        .in('codigo_pedido', ids);

      await supabase
        .from('pedidos')
        .delete()
        .in('id', ids);

      // Limpiar también en localStorage
      try {
        const local = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
        const filtered = local.filter((o: any) => !ids.includes(o.id) && !ids.includes(o.id_pedido) && !ids.includes(o.codigo_pedido));
        localStorage.setItem('g3d_designed_orders', JSON.stringify(filtered));
      } catch (_e) {}

      return { success: true };
    } catch (error) {
      console.error("Error deleting orders:", error);
      return { success: false, error };
    }
  },

  /**
   * Actualiza el estado del pedido
   */
  async updateOrderStatus(id: string, nuevoEstado: string) {
    try {
      // Necesitamos buscar el UUID del estado en diccionario_estados_pedido o diccionario_estados_pedidos
      let estadoId = null;
      if (nuevoEstado) {
        let { data: estadoData } = await supabase
          .from('diccionario_estados_pedido')
          .select('id')
          .ilike('nombre_estado', nuevoEstado)
          .maybeSingle();
        
        if (!estadoData) {
          const { data: e2 } = await supabase
            .from('diccionario_estados_pedidos')
            .select('id')
            .ilike('nombre_estado', nuevoEstado)
            .maybeSingle();
          if (e2) estadoData = e2;
        }

        if (estadoData) {
          estadoId = estadoData.id;
        } else {
          // Sembrado dinámico resiliente: si el estado no existe en el diccionario lo creamos en caliente
          const coloresPastel = ['#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#E0F2FE', '#F3E8FF', '#FAE8FF'];
          const colorAzar = coloresPastel[Math.floor(Math.random() * coloresPastel.length)];
          
          const { data: maxPriorityData } = await supabase
            .from('diccionario_estados_pedido')
            .select('nivel_prioridad')
            .order('nivel_prioridad', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          const proxPrioridad = (maxPriorityData?.nivel_prioridad || 0) + 10;
          
          const { data: newEstadoRow } = await supabase
            .from('diccionario_estados_pedido')
            .insert([{
              nombre_estado: nuevoEstado.toUpperCase(),
              color_pastel_hex: colorAzar,
              es_activo: true,
              nivel_prioridad: proxPrioridad
            }])
            .select('id')
            .single();
            
          if (newEstadoRow) {
            estadoId = newEstadoRow.id;
          }
        }
      }

      const updateData: any = {};
      if (estadoId) {
        updateData.estado_id = estadoId;
      }
      
      const isEntregado = nuevoEstado && nuevoEstado.toLowerCase() === 'entregado';
      if (isEntregado) {
        updateData.fecha_entrega = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        const { data: updatedCode } = await supabase
          .from('pedidos')
          .update(updateData)
          .eq('codigo_pedido', id)
          .select('id');

        if (!updatedCode || updatedCode.length === 0) {
          await supabase
            .from('pedidos')
            .update(updateData)
            .eq('id', id);
        }
      }

      // Sincronizar en respaldo de localStorage (g3d_designed_orders)
      try {
        const local = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
        const updatedLocal = local.map((o: any) => {
          if (o.id === id || o.id_pedido === id || o.codigo_pedido === id) {
            return {
              ...o,
              estado: nuevoEstado,
              estado_pedido: nuevoEstado
            };
          }
          return o;
        });
        localStorage.setItem('g3d_designed_orders', JSON.stringify(updatedLocal));
      } catch (e) {
        console.warn("Error actualizando localStorage g3d_designed_orders:", e);
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating status:", error);
      return { success: false };
    }
  },

  /**
   * Actualiza un pedido completo
   */
  async updateOrder(id: string, payload: any) {
    try {
      const precioTotal = parseFloat(payload.PRECIO_TOTAL) || 0;
      const totalPagado = parseFloat(payload.TOTAL_PAGADO) || 0;

      // Necesitamos buscar el UUID del estado
      let estadoId = null;
      if (payload.ESTADO_PEDIDO) {
        const { data: estadoData } = await supabase
          .from('diccionario_estados_pedido')
          .select('id')
          .ilike('nombre_estado', payload.ESTADO_PEDIDO)
          .maybeSingle();
        
        if (estadoData) {
          estadoId = estadoData.id;
        } else {
          // Sembrado dinámico resiliente: si el estado no existe en el diccionario lo creamos en caliente
          const coloresPastel = ['#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#E0F2FE', '#F3E8FF', '#FAE8FF'];
          const colorAzar = coloresPastel[Math.floor(Math.random() * coloresPastel.length)];
          
          const { data: maxPriorityData } = await supabase
            .from('diccionario_estados_pedido')
            .select('nivel_prioridad')
            .order('nivel_prioridad', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          const proxPrioridad = (maxPriorityData?.nivel_prioridad || 0) + 10;
          
          const { data: newEstadoRow } = await supabase
            .from('diccionario_estados_pedido')
            .insert([{
              nombre_estado: payload.ESTADO_PEDIDO.toUpperCase(),
              color_pastel_hex: colorAzar,
              es_activo: true,
              nivel_prioridad: proxPrioridad
            }])
            .select('id')
            .single();
            
          if (newEstadoRow) {
            estadoId = newEstadoRow.id;
          }
        }
      }

      const { data: currentOrder, error: fetchError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('codigo_pedido', id)
        .maybeSingle();

      if (fetchError || !currentOrder) {
        throw new Error("Pedido no encontrado");
      }

      const { error } = await supabase
        .from('pedidos')
        .update({
          vendedor_temporal: payload.VENDEDOR,
          cliente_nombre_temporal: payload.CLIENTE_NOMBRE,
          cliente_telefono_temporal: payload.CLIENTE_TELEFONO,
          tipo_trabajo: payload.TIPO_TRABAJO,
          monto_total: precioTotal,
          monto_pagado: totalPagado,
          estado_id: estadoId,
          fecha_entrega: payload.FECHA_ENTREGA ? new Date(payload.FECHA_ENTREGA).toISOString() : null,
          lat: payload.LAT,
          lng: payload.LNG,
          delivery_min: payload.DELIVERY_MIN || 1,
          delivery_max: payload.DELIVERY_MAX || 3
        })
        .eq('id', currentOrder.id);

      if (error) throw error;

      // También actualizamos el item del pedido de forma retrocompatible
      if (payload.DESCRIPCION) {
        const { data: existingItems } = await supabase
          .from('pedido_items')
          .select('id')
          .eq('pedido_id', currentOrder.id);

        if (existingItems && existingItems.length > 0) {
          await supabase
            .from('pedido_items')
            .update({
              descripcion_custom: payload.DESCRIPCION,
              precio_unitario: precioTotal,
              cantidad: parseFloat(payload.CANTIDAD || 1)
            })
            .eq('id', existingItems[0].id);
        } else {
          await supabase
            .from('pedido_items')
            .insert([{
              pedido_id: currentOrder.id,
              descripcion_custom: payload.DESCRIPCION,
              precio_unitario: precioTotal,
              cantidad: parseFloat(payload.CANTIDAD || 1)
            }]);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error updating order:", error);
      return { success: false, error: error.message || error };
    }
  },

  /**
   * Obtiene el historial de pagos de un pedido
   */
  async getPayments(id: string) {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('id_pedido', id);

      const local = localStorage.getItem('g3d_pagos');
      const localList = local ? JSON.parse(local) : [];

      if (error) {
        console.warn("Error fetching payments from Supabase, returning local list:", error.message);
        return localList.filter((p: any) => p.id_pedido === id);
      }

      const sqlPayments = data || [];
      const combined = [...sqlPayments];
      const localOnlyOfThisOrder = localList.filter((p: any) => 
        p.id_pedido === id && !sqlPayments.some((sq: any) => sq.id_pago === p.id_pago)
      );
      combined.push(...localOnlyOfThisOrder);

      let filteredLocalList = localList.filter((p: any) => p.id_pedido !== id);
      filteredLocalList.push(...combined);
      localStorage.setItem('g3d_pagos', JSON.stringify(filteredLocalList));
      
      return combined;
    } catch (error) {
      console.error("Error fetching payments, using localStorage fallback:", error);
      const local = localStorage.getItem('g3d_pagos');
      if (local) {
        const parsed = JSON.parse(local);
        return parsed.filter((p: any) => p.id_pedido === id);
      }
      return [];
    }
  },

  /**
   * Registra un nuevo pago para un pedido y actualiza los totales del pedido
   */
  async addPayment(paymentData: { id_pedido: string, monto: number, tipo_pago: string, observaciones: string, comprobante_url?: string | null }) {
    try {
      console.log("Iniciando addPayment con:", paymentData);
      
      if (!paymentData.id_pedido) throw new Error("ID de pedido no proporcionado");
      if (!paymentData.monto || paymentData.monto <= 0) throw new Error("Monto inválido");

      const idPago = `PAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newPayment = {
        id_pago: idPago,
        id_pedido: paymentData.id_pedido,
        monto: paymentData.monto,
        tipo_pago: paymentData.tipo_pago,
        observaciones: paymentData.observaciones,
        comprobante_url: paymentData.comprobante_url || null,
        fecha: new Date().toISOString()
      };

      // Guardar localmente de inmediato para asegurar persistencia visual
      const local = localStorage.getItem('g3d_pagos');
      const list = local ? JSON.parse(local) : [];
      list.push(newPayment);
      localStorage.setItem('g3d_pagos', JSON.stringify(list));

      // 1. Intentamos insertar el pago en tabla 'pagos' de Supabase
      let localOnly = false;
      const { error: insertError } = await supabase
        .from('pagos')
        .insert([newPayment]);

      if (insertError) {
        console.warn("[addPayment] Error al insertar en base de datos. Se mantiene en local cache fallback:", insertError.message);
        localOnly = true;
      }

      // 2. Calcular el total pagado sumando los pagos de manera robusta
      let totalPagado = 0;
      if (!localOnly) {
        // Consultar de la base de datos todos los pagos de este pedido para tener el total real consolidado
        const { data: dbPagos, error: queryError } = await supabase
          .from('pagos')
          .select('monto')
          .eq('id_pedido', paymentData.id_pedido);

        if (!queryError && dbPagos) {
          totalPagado = dbPagos.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
        } else {
          console.warn("Error al consultar pagos de la DB para recalcular el total, usando fallback local:", queryError?.message);
          totalPagado = list
            .filter((p: any) => p.id_pedido === paymentData.id_pedido)
            .reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
        }
      } else {
        totalPagado = list
          .filter((p: any) => p.id_pedido === paymentData.id_pedido)
          .reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
      }

      console.log("Total pagado recalculado de forma robusta:", totalPagado);

      // 3. Intentamos actualizar el pedido en la nube con el nuevo monto_pagado acumulado
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          monto_pagado: totalPagado
        })
        .eq('codigo_pedido', paymentData.id_pedido);

      if (updateError) {
        console.error("Error al actualizar totales del pedido en Supabase:", updateError);
        // Si el update falla en la nube, podemos persistir la actualización de pedidos en local storage también si quisiéramos.
        // Pero devolvemos success: true (híbrido) porque el pago está guardado localmente de forma segura.
        return { success: true, localOnly: true, warning: "Guardado localmente. Supabase pedidos no actualizado." };
      }

      console.log("addPayment completado con éxito", localOnly ? "(Offline/LocalOnly)" : "(Realtime Sincronizado)");
      return { success: true, localOnly };
    } catch (error: any) {
      console.error("Error crítico en addPayment:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * CATEGORÍAS
   */

  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async createCategory(payload: any) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: payload.name,
          icon_name: payload.icon_name,
          color: payload.color,
          parent_id: payload.parent_id || null
        }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error creating category:", error);
      return { success: false, error };
    }
  },

  async updateCategory(id: string, payload: any) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: payload.name,
          icon_name: payload.icon_name,
          color: payload.color,
          parent_id: payload.parent_id || null
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating category:", error);
      return { success: false, error };
    }
  },

  async deleteCategory(id: string) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting category:", error);
      return { success: false, error };
    }
  },

  /**
   * INSUMOS (STOCK)
   */
  async getInsumos() {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching insumos:", error);
      return [];
    }
  },

  async getVariants(parentId: string) {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .filter('especificaciones->>parentId', 'eq', parentId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching variants:", error);
      return [];
    }
  },

  async createInsumo(payload: any) {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .insert([{
          nombre: payload.nombre,
          categoria: payload.categoria,
          cantidad: payload.cantidad,
          unidad: payload.unidad,
          minimo_alerta: payload.minimo_alerta,
          stock_origin: payload.stock_origin,
          delivery_min: payload.delivery_min || 1,
          delivery_max: payload.delivery_max || 3,
          especificaciones: payload.especificaciones,
          detalle_cliente: payload.detalle_cliente,
          detalle_vendedor: payload.detalle_vendedor,
          detalle_empleado: payload.detalle_empleado,
          imagenes: payload.imagenes,
          publicado: payload.publicado,
          costo_publico: payload.costo_publico,
          costo_vendedor: payload.costo_vendedor,
          costo_proveedor: payload.costo_proveedor,
          proveedor_id: payload.proveedor_id,
          estado: payload.estado || 'Activo',
          category_id: payload.category_id,
          category_ids: payload.category_ids || [],
          link_stl: payload.link_stl,
          link_drive: payload.link_drive
        }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error creating insumo:", error);
      return { success: false, error };
    }
  },

  async updateInsumo(id: string, payload: any) {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .update({
          nombre: payload.nombre,
          categoria: payload.categoria,
          cantidad: payload.cantidad,
          unidad: payload.unidad,
          minimo_alerta: payload.minimo_alerta,
          stock_origin: payload.stock_origin,
          delivery_min: payload.delivery_min || 1,
          delivery_max: payload.delivery_max || 3,
          especificaciones: payload.especificaciones,
          detalle_cliente: payload.detalle_cliente,
          detalle_vendedor: payload.detalle_vendedor,
          detalle_empleado: payload.detalle_empleado,
          imagenes: payload.imagenes,
          publicado: payload.publicado,
          costo_publico: payload.costo_publico,
          costo_vendedor: payload.costo_vendedor,
          costo_proveedor: payload.costo_proveedor,
          proveedor_id: payload.proveedor_id,
          estado: payload.estado || 'Activo',
          category_id: payload.category_id,
          category_ids: payload.category_ids || [],
          link_stl: payload.link_stl,
          link_drive: payload.link_drive
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating insumo:", error);
      return { success: false, error };
    }
  },

  async deleteInsumo(id: string) {
    try {
      const { error } = await supabase
        .from('insumos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting insumo:", error);
      return { success: false, error };
    }
  },

  /**
   * PROVEEDORES
   */
  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }
  },

  async createSupplier(payload: any) {
    try {
      // Intentar insertar todas las columnas nuevas/extendidas directamente en Supabase
      const { data, error } = await supabase
        .from('proveedores')
        .insert([{
          nombre: payload.nombre,
          contacto: payload.contacto,
          telefono: payload.telefono,
          direccion: payload.direccion,
          notas: payload.notas,
          provincia: payload.provincia,
          gps_lat: payload.gps_lat,
          gps_lng: payload.gps_lng,
          items_provee: payload.items_provee || [],
          discount_rules: payload.discount_rules || [],
          emite_factura: payload.emite_factura || false,
          iva_incluido: payload.iva_incluido || false,
          descuento_efectivo: payload.descuento_efectivo || 0,
          descuento_transferencia: payload.descuento_transferencia || 0,
          last_updated: payload.last_updated || new Date().toLocaleDateString('es-AR'),
          importado_ocr: payload.importado_ocr || false
        }])
        .select()
        .single();
      
      if (error) {
        // Si el error es por columna inexistente, intentar la inserción básica fallback
        console.warn("Fallo inserción extendida, intentando fallback básico:", error.message);
        throw error;
      }
      return { success: true, data, isDbComplete: true };
    } catch (dbError: any) {
      // Inserción básica fallback para compatibilidad retrógrada temporal
      try {
        const { data, error } = await supabase
          .from('proveedores')
          .insert([{
            nombre: payload.nombre,
            contacto: payload.contacto,
            telefono: payload.telefono,
            direccion: payload.direccion,
            notas: payload.notas
          }])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data, isDbComplete: false };
      } catch (fallbackErr) {
        console.error("Error creating supplier (fallback):", fallbackErr);
        return { success: false, error: dbError };
      }
    }
  },

  async updateSupplier(id: string, payload: any) {
    try {
      // Intentar actualizar todas las columnas extendidas en Supabase
      const { data, error } = await supabase
        .from('proveedores')
        .update({
          nombre: payload.nombre,
          contacto: payload.contacto,
          telefono: payload.telefono,
          direccion: payload.direccion,
          notas: payload.notas,
          provincia: payload.provincia,
          gps_lat: payload.gps_lat,
          gps_lng: payload.gps_lng,
          items_provee: payload.items_provee || [],
          discount_rules: payload.discount_rules || [],
          emite_factura: payload.emite_factura || false,
          iva_incluido: payload.iva_incluido || false,
          descuento_efectivo: payload.descuento_efectivo || 0,
          descuento_transferencia: payload.descuento_transferencia || 0,
          last_updated: payload.last_updated || new Date().toLocaleDateString('es-AR'),
          importado_ocr: payload.importado_ocr || false
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.warn("Fallo actualización extendida, intentando actualización básica:", error.message);
        throw error;
      }
      return { success: true, data, isDbComplete: true };
    } catch (dbError: any) {
      // Inserción básica fallback para compatibilidad retrógrada temporal
      try {
        const { data, error } = await supabase
          .from('proveedores')
          .update({
            nombre: payload.nombre,
            contacto: payload.contacto,
            telefono: payload.telefono,
            direccion: payload.direccion,
            notas: payload.notas
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data, isDbComplete: false };
      } catch (fallbackErr) {
        console.error("Error updating supplier (fallback):", fallbackErr);
        return { success: false, error: dbError };
      }
    }
  },

  async deleteSupplier(id: string) {
    try {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting supplier:", error);
      return { success: false, error };
    }
  },

  /**
   * BÚSQUEDA INTELIGENTE
   */
  async searchCustomers(query: string) {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('cliente_nombre_temporal, cliente_telefono_temporal')
        .or(`cliente_nombre_temporal.ilike.%${query}%,cliente_telefono_temporal.ilike.%${query}%`)
        .order('fecha_creacion', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Mapear al formato que espera UI
      const mapped = (data || []).map(o => ({
        cliente_nombre: o.cliente_nombre_temporal,
        cliente_telefono: o.cliente_telefono_temporal
      }));
      
      // Eliminar duplicados por nombre
      const uniqueCustomers = Array.from(new Map(mapped.map(item => [item.cliente_nombre, item])).values());
      return uniqueCustomers;
    } catch (error) {
      console.error("Error searching customers:", error);
      return [];
    }
  },

  async getSystemConfig() {
    if (isOfflineMode) {
      const saved = localStorage.getItem('g3d_system_config_fallback');
      return saved ? JSON.parse(saved) : { dias_validez_link: 15 };
    }
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', '1')
        .maybeSingle();
      if (error) throw error;
      
      const configData = data?.datos || {};
      const finalConfig = { 
        ...configData,
        dias_validez_link: data?.dias_validez_link || configData?.dias_validez_link || 15 
      };
      localStorage.setItem('g3d_system_config_fallback', JSON.stringify(finalConfig));
      return finalConfig;
    } catch (error: any) {
      console.warn("Unable to fetch system config (using fallback):", error?.message || error);
      const saved = localStorage.getItem('g3d_system_config_fallback');
      return saved ? JSON.parse(saved) : { dias_validez_link: 15 };
    }
  },

  async updateSystemConfig(payload: any) {
    try {
      const { error } = await supabase
        .from('configuracion_sistema')
        .upsert({ 
          id: '1', 
          datos: payload,
          ultima_modificacion: new Date().toISOString()
        });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating system config:", error);
      return { success: false, error };
    }
  },

  async getSellersList() {
    try {
      const { data, error } = await supabase
        .from('perfiles_locales')
        .select('*')
        .order('nombre_negocio');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching sellers list:", error);
      return [];
    }
  },

  async getLogisticsConfig() {
    try {
      const { data, error } = await supabase
        .from('logistica_config')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching logistics config:", error);
      return null;
    }
  },

  async updateLogisticsConfig(payload: any) {
    try {
      const { error } = await supabase
        .from('logistica_config')
        .update(payload)
        .eq('id', 1);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating logistics config:", error);
      return { success: false, error };
    }
  },

  async getFleteros() {
    try {
      const { data, error } = await supabase
        .from('logistica_fleteros')
        .select('*')
        .order('nombre_completo');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching fleteros:", error);
      return [];
    }
  },

  async updateSellerProfile(id: string, payload: any) {
    try {
      const { error } = await supabase
        .from('perfiles_locales')
        .upsert({ id, ...payload });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating seller profile:", error);
      return { success: false, error };
    }
  },

  async updateFletero(id: string, payload: any) {
    try {
      const { error } = await supabase
        .from('logistica_fleteros')
        .upsert({ id, ...payload });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating fletero:", error);
      return { success: false, error };
    }
  },

  async getActiveTravels() {
    try {
      let travelsData: any[] = [];

      // 1. Consulta plana directa sobre logistica_viajes (evita error PGRST200 si no hay foreign key configurada)
      try {
        const { data, error } = await supabase
          .from('logistica_viajes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          travelsData = data;
        } else if (error) {
          console.warn("[apiService.getActiveTravels] Aviso al consultar logistica_viajes:", error.message || error);
        }
      } catch (err) {
        console.warn("[apiService.getActiveTravels] Error en consulta de viajes:", err);
      }

      // Si no hay datos en la BD remota, buscar en respaldo local
      if (!travelsData || travelsData.length === 0) {
        try {
          const localTravels = JSON.parse(localStorage.getItem('g3d_logistica_viajes') || '[]');
          if (Array.isArray(localTravels) && localTravels.length > 0) {
            travelsData = localTravels;
          }
        } catch (_locErr) {}
      }

      if (!travelsData || travelsData.length === 0) {
        return [];
      }

      // 2. Cargar en paralelo pedidos, fleteros y perfiles para hidratar las relaciones de forma segura
      const ordersMap: Record<string, any> = {};
      const fleterosMap: Record<string, any> = {};
      const vendedoresMap: Record<string, any> = {};

      try {
        const allOrders = await apiService.getOrders();
        (allOrders || []).forEach((o: any) => {
          const id = o.id || o.id_pedido || o.codigo_pedido;
          if (id) ordersMap[String(id)] = o;
        });
      } catch (_oErr) {}

      try {
        const allFleteros = await apiService.getFleteros();
        (allFleteros || []).forEach((f: any) => {
          if (f.id) fleterosMap[String(f.id)] = f;
        });
      } catch (_fErr) {}

      try {
        const { data: users } = await supabase.from('perfiles_locales').select('*');
        (users || []).forEach((u: any) => {
          if (u.id) vendedoresMap[String(u.id)] = u;
          if (u.email) vendedoresMap[String(u.email)] = u;
          if (u.usuario_nombre) vendedoresMap[String(u.usuario_nombre)] = u;
        });
      } catch (_uErr) {}

      // 3. Unificar los datos hidratados con valores de respaldo
      return travelsData.map((t: any) => {
        const pedidoId = t.pedido_id || t.id_pedido;
        const matchedPedido = pedidoId ? ordersMap[String(pedidoId)] : null;
        const matchedFletero = t.fletero_id ? fleterosMap[String(t.fletero_id)] : null;
        const matchedVendedor = t.vendedor_id ? vendedoresMap[String(t.vendedor_id)] : (t.vendedor_email ? vendedoresMap[String(t.vendedor_email)] : null);

        return {
          ...t,
          pedido: t.pedido || matchedPedido || {
            cliente_nombre: t.cliente_nombre || 'Cliente Final',
            cliente_direccion: t.cliente_direccion || t.destino || 'Destino',
            cliente_telefono: t.cliente_telefono || ''
          },
          fletero: t.fletero || matchedFletero || {
            nombre_completo: t.fletero_nombre || 'SIN ASIGNAR',
            tipo_vehiculo: t.fletero_vehiculo || '-'
          },
          vendedor: t.vendedor || matchedVendedor || {
            nombre_negocio: t.vendedor_nombre || 'Origen'
          }
        };
      });
    } catch (error) {
      console.warn("Aviso al obtener viajes activos:", error);
      return [];
    }
  },

  async getSellers() {
    try {
      const { data, error } = await supabase
        .from('perfiles_locales')
        .select('email, nombre, rol');

      if (error) throw error;
      return data.map(u => u.nombre || u.email);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      return [];
    }
  },

  async searchInsumos(query: string) {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .ilike('nombre', `%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error searching insumos:", error);
      return [];
    }
  },

  async updateStock(id: string, diff: number) {
    try {
      const { data: insumo, error: fetchError } = await supabase
        .from('insumos')
        .select('cantidad, nombre, minimo_alerta, modalidad, publicado')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const nuevaCantidad = (insumo.cantidad || 0) + diff;
      
      let updatePayload: any = { cantidad: nuevaCantidad };
      
      if (insumo.modalidad === 'inmediata' && nuevaCantidad <= 0 && insumo.publicado) {
        updatePayload.publicado = false;
        if (typeof window !== 'undefined') {
           const event = new CustomEvent('stock_zero_pause', { detail: { nombre: insumo.nombre } });
           window.dispatchEvent(event);
        }
      }
      
      const { error: updateError } = await supabase
        .from('insumos')
        .update(updatePayload)
        .eq('id', id);
      
      if (updateError) throw updateError;

      // Registrar venta en ranking si es un decremento (venta)
      if (diff < 0) {
        try {
          await apiService.registerSaleForRanking(id, Math.abs(diff));
        } catch (rankErr) {
          console.error("Error al registrar venta para ranking:", rankErr);
        }
      }

      // Alerta automática de stock mínimo
      if (diff < 0 && insumo.minimo_alerta !== null && nuevaCantidad <= insumo.minimo_alerta) {
        if (typeof window !== 'undefined') {
          // Despachar evento global para que el front lo capture y muestre la tostada, 
          // o podemos importar toast y llamarlo si está disponible
          const event = new CustomEvent('stock_alert', { detail: { nombre: insumo.nombre, stock: nuevaCantidad, id: id } });
          window.dispatchEvent(event);
        }
      }

      return { success: true, nuevaCantidad };
    } catch (error) {
      console.error("Error updating stock:", error);
      return { success: false, error };
    }
  },

  /**
   * Registra una venta en la tabla temporal de 90 días para el ranking de carruseles
   */
  async registerSaleForRanking(productoId: string, cantidad: number) {
    try {
      let negocioId = null;
      
      // 1. Buscar en 'productos'
      const { data: prod } = await supabase
        .from('g3d_productos')
        .select('negocio_id')
        .eq('id', productoId)
        .maybeSingle();
        
      if (prod && prod.negocio_id) {
        negocioId = prod.negocio_id;
      } else {
        // 2. Si no, en 'insumos'
        const { data: ins } = await supabase
          .from('insumos')
          .select('proveedor_id')
          .eq('id', productoId)
          .maybeSingle();
        
        if (ins && ins.proveedor_id) {
          negocioId = ins.proveedor_id;
        } else {
          // Fallback: perfil logueado actual
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            negocioId = sessionData.session.user.id;
          } else {
            // Último recurso: primer perfil local
            const { data: fallbackUser } = await supabase
              .from('perfiles_locales')
              .select('id')
              .limit(1)
              .maybeSingle();
            if (fallbackUser) negocioId = fallbackUser.id;
          }
        }
      }

      if (negocioId) {
        const { error } = await supabase
          .from('ranking_ventas_90dias')
          .insert([{
            producto_id: productoId,
            negocio_id: negocioId,
            cantidad: cantidad,
            fecha: new Date().toISOString()
          }]);
        if (error) {
          console.warn("Fallo inserción en ranking_ventas_90dias (comprobar si la tabla ya está creada en Supabase):", error.message);
        }
      }
    } catch (e) {
      console.error("No se pudo registrar venta para ranking:", e);
    }
  },

  /**
   * REPORTES DE SISTEMA (NOC)
   */
  async getReports(appOrigen?: string) {
    try {
      console.log("Fetching reports with filter:", appOrigen);
      let query = supabase
        .from('reportes_sistema')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (appOrigen && appOrigen !== 'TODOS') {
        query = query.eq('app_origen', appOrigen);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase error fetching reports:", error);
        throw error;
      }
      
      console.log("Reports fetched successfully:", data?.length || 0, "items");
      return data || [];
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
  },

  async updateReportStatus(id: any, status: string) {
    try {
      console.log(`Actualizando reporte ${id} (tipo ${typeof id}) a estado: ${status}`);
      
      // Intentar actualización
      const { data, error } = await supabase
        .from('reportes_sistema')
        .update({ estado: status })
        .eq('id', id)
        .select();

      if (error) {
        console.error("Error de Supabase al actualizar reporte:", error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        console.warn(`No se encontró el reporte con ID: ${id}.`);
        return { success: false, error: "Registro no encontrado o sin permisos" };
      }

      console.log("Reporte actualizado exitosamente:", data[0]);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating report status:", error);
      return { success: false, error: error.message || "Error desconocido" };
    }
  },

  async reportError(error: any, origin: string, userEmail?: string) {
    try {
      let mensaje = error?.message || String(error);
      const stack = error?.stack || null;
      const code = error?.code || null;

      if (stack) {
        mensaje += `\n\nStack Trace:\n${stack}`;
      }

      console.log("Reportando error al NOC:", mensaje);

      const { error: dbError } = await supabase
        .from('reportes_sistema')
        .insert([{
          app_origen: origin,
          mensaje_tecnico: mensaje,
          usuario_afectado: userEmail || 'Anónimo',
          estado: 'PENDIENTE',
          codigo_error: code,
          fecha: new Date().toISOString()
        }]);

      if (dbError) throw dbError;
    } catch (err) {
      console.error("Critical: Could not report system error:", err);
    }
  },

  async getHistorialMovimientos(filtros?: { search?: string, startDate?: string, endDate?: string, action?: string, entity?: string }) {
    try {
      let query = supabase
        .from('historial_movimientos')
        .select('*')
        .order('fecha', { ascending: false });

      if (filtros?.action) {
        query = query.eq('accion', filtros.action);
      }
      if (filtros?.entity) {
        query = query.eq('entidad', filtros.entity);
      }
      if (filtros?.startDate) {
        query = query.gte('fecha', filtros.startDate);
      }
      if (filtros?.endDate) {
        // Para incluir el dia completo
        query = query.lte('fecha', filtros.endDate + 'T23:59:59.999Z');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Si hay busqueda por texto
      if (filtros?.search && data) {
        const term = filtros.search.toLowerCase();
        return data.filter((m: any) => 
          (m.detalle?.toLowerCase().includes(term)) ||
          (m.entidad_id?.toLowerCase().includes(term)) ||
          (m.usuario_nombre?.toLowerCase().includes(term)) ||
          (m.accion?.toLowerCase().includes(term))
        );
      }

      return data;
    } catch (error) {
      console.error("Error getting history:", error);
      return [];
    }
  },

  async registrarMovimiento(payload: { 
    usuario_nombre: string,
    accion: string,
    entidad: string, 
    entidad_id: string, 
    detalle: string,
    valores_anteriores?: any,
    valores_nuevos?: any
  }) {
    try {
      const { error } = await supabase
        .from('historial_movimientos')
        .insert([{
          fecha: new Date().toISOString(),
          ...payload
        }]);
      if (error) throw error;
    } catch (error) {
      console.error("Error registering movement:", error);
      // No bloqueamos la operacion por un error en el historial
    }
  },

  async getPendingReportsCount() {
    if (isOfflineMode) return 0;
    try {
      const { count, error } = await supabase
        .from('reportes_sistema')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'PENDIENTE');
      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.warn("Unable to fetch pending reports count:", error?.message || error);
      return 0;
    }
  },

  /**
   * MÉTODOS HÍBRIDOS PARA ÍTEMS DE REVENDEDORES (Simulación de DB o fallback local)
   */
  async getResellerItems(revendedorId?: string) {
    try {
      const { data, error } = await supabase
        .from('items_revendedores')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;

      let items = data || [];
      if (revendedorId) {
        items = items.filter((it: any) => it.revendedor_id === revendedorId);
      }
      // Almacenar copia local para sincronizar
      localStorage.setItem('g3d_items_revendedores', JSON.stringify(items));
      return items;
    } catch (e: any) {
      console.warn("[getResellerItems] Cargando localmente: la tabla 'items_revendedores' no está activa o pre-creada aún:", e.message || e);
      const local = JSON.parse(localStorage.getItem('g3d_items_revendedores') || '[]');
      if (revendedorId) {
        return local.filter((it: any) => it.revendedor_id === revendedorId);
      }
      return local;
    }
  },

  async saveResellerItem(id: string, payload: any) {
    try {
      const dbPayload = {
        id,
        nombre: payload.nombre,
        categoria: payload.categoria,
        precio: Number(payload.precio) || 0,
        precio_con_iva: Number(payload.precio_con_iva) || 0,
        precio_efectivo: Number(payload.precio_efectivo) || 0,
        precio_transferencia: Number(payload.precio_transferencia) || 0,
        stock: Number(payload.stock) || 0,
        stock_tipo: payload.stock_tipo || 'fijo',
        dias_produccion_min: Number(payload.dias_produccion_min) || 0,
        dias_produccion_max: Number(payload.dias_produccion_max) || 0,
        imagenes: payload.imagenes || [],
        link_drive: payload.link_drive || '',
        link_stl: payload.link_stl || '',
        instrucciones_internas: payload.instrucciones_internas || '',
        estado: payload.estado || 'activo',
        revendedor_id: payload.revendedor_id,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('items_revendedores')
        .upsert(dbPayload);

      if (error) throw error;
      
      // Actualizar localStorage
      let local = JSON.parse(localStorage.getItem('g3d_items_revendedores') || '[]');
      local = local.filter((it: any) => it.id !== id);
      local.unshift(dbPayload);
      localStorage.setItem('g3d_items_revendedores', JSON.stringify(local));

      return { success: true };
    } catch (e: any) {
      console.warn("[saveResellerItem] Guardado localmente: la tabla 'items_revendedores' aún no está creada o no concuerda:", e.message || e);
      let local = JSON.parse(localStorage.getItem('g3d_items_revendedores') || '[]');
      
      const simulatedItem = {
        id,
        ...payload,
        precio: Number(payload.precio) || 0,
        precio_con_iva: Number(payload.precio_con_iva) || 0,
        precio_efectivo: Number(payload.precio_efectivo) || 0,
        precio_transferencia: Number(payload.precio_transferencia) || 0,
        stock: Number(payload.stock) || 0,
        dias_produccion_min: Number(payload.dias_produccion_min) || 0,
        dias_produccion_max: Number(payload.dias_produccion_max) || 0,
        last_updated: new Date().toISOString()
      };

      local = local.filter((it: any) => it.id !== id);
      local.unshift(simulatedItem);
      localStorage.setItem('g3d_items_revendedores', JSON.stringify(local));

      return { success: true, localOnly: true };
    }
  },

  async deleteResellerItem(id: string) {
    try {
      const { error } = await supabase
        .from('items_revendedores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      let local = JSON.parse(localStorage.getItem('g3d_items_revendedores') || '[]');
      local = local.filter((it: any) => it.id !== id);
      localStorage.setItem('g3d_items_revendedores', JSON.stringify(local));

      return { success: true };
    } catch (e: any) {
      console.warn("[deleteResellerItem] Borrado localmente debido a tabla inaccesible:", e.message || e);
      let local = JSON.parse(localStorage.getItem('g3d_items_revendedores') || '[]');
      local = local.filter((it: any) => it.id !== id);
      localStorage.setItem('g3d_items_revendedores', JSON.stringify(local));

      return { success: true, localOnly: true };
    }
  },

  // ==========================================
  // SECCIÓN PRINCIPAL: IPTV XTV CONTROL ENGINE
  // ==========================================
  async getIptvAccounts() {
    try {
      const { data, error } = await supabase
        .from('iptv_clientes')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      if (data) {
        return data.map((c: any) => {
          let limite_pantallas_api = 3;
          let reseller_notes = '';
          if (c.bitacora_comentarios && Array.isArray(c.bitacora_comentarios)) {
            const sys = c.bitacora_comentarios.find((b: any) => b.is_system && b.key === 'limite_pantallas_api');
            if (sys) limite_pantallas_api = Number(sys.value);
            
            const rn = c.bitacora_comentarios.find((b: any) => b.is_system && b.key === 'reseller_notes');
            if (rn) reseller_notes = String(rn.value);
          }
          const finalId = c.panel_client_id || c.xui_id || c.id_linea || '';
          return {
            ...c,
            limite_pantallas: c.limite_pantallas !== undefined ? Number(c.limite_pantallas) : 2,
            limite_pantallas_api: limite_pantallas_api,
            reseller_notes: reseller_notes,
            api_sincronizado: c.api_sincronizado !== undefined ? c.api_sincronizado : true,
            api_error_registro: c.api_error_registro || undefined,
            xui_id: finalId,
            id_linea: finalId,
            panel_client_id: finalId,
            member_id: c.member_id || undefined,
            access_token: c.access_token || undefined,
            playlist_url: c.playlist_url || undefined,
            package_id: c.package_id || undefined,
            bouquet: c.bouquet || undefined,
            raw_response_json: c.raw_response_json || undefined
          };
        });
      }
    } catch (e: any) {
      console.warn("[getIptvAccounts] Error leyendo Supabase, usando fallback LocalStorage o vacío:", e.message || e);
    }

    let local = localStorage.getItem('g3d_iptv_cuentas');
    if (!local) {
      return [];
    }
    return JSON.parse(local).map((c: any) => {
      let limite_pantallas_api = c.limite_pantallas_api !== undefined ? Number(c.limite_pantallas_api) : 3;
      let reseller_notes = c.reseller_notes || '';
      if (c.bitacora_comentarios && Array.isArray(c.bitacora_comentarios)) {
        const rn = c.bitacora_comentarios.find((b: any) => b.is_system && b.key === 'reseller_notes');
        if (rn) reseller_notes = String(rn.value);
      }
      const finalId = c.panel_client_id || c.xui_id || c.id_linea || '';
      return {
        ...c,
        limite_pantallas: c.limite_pantallas !== undefined ? Number(c.limite_pantallas) : 2,
        limite_pantallas_api: limite_pantallas_api,
        reseller_notes: reseller_notes,
        api_sincronizado: c.api_sincronizado !== undefined ? c.api_sincronizado : true,
        api_error_registro: c.api_error_registro || undefined,
        xui_id: finalId,
        id_linea: finalId,
        panel_client_id: finalId,
        member_id: c.member_id || undefined,
        access_token: c.access_token || undefined,
        playlist_url: c.playlist_url || undefined,
        package_id: c.package_id || undefined,
        bouquet: c.bouquet || undefined,
        raw_response_json: c.raw_response_json || undefined
      };
    });
  },

  async saveIptvAccount(account: any) {
    try {
      let bitacora = account.bitacora_comentarios || [];
      if (!Array.isArray(bitacora)) {
        bitacora = [];
      }
      bitacora = bitacora.filter((b: any) => !(b.is_system && b.key === 'limite_pantallas_api'));
      const apiScreens = account.limite_pantallas_api !== undefined ? Number(account.limite_pantallas_api) : 3;
      bitacora.push({
        is_system: true,
        key: 'limite_pantallas_api',
        value: apiScreens,
        date: new Date().toISOString()
      });

      // Guardar reseller_notes de forma segura en bitacora_comentarios
      bitacora = bitacora.filter((b: any) => !(b.is_system && b.key === 'reseller_notes'));
      if (account.reseller_notes !== undefined) {
        bitacora.push({
          is_system: true,
          key: 'reseller_notes',
          value: account.reseller_notes,
          date: new Date().toISOString()
        });
      }

      const pClientId = account.panel_client_id || account.xui_id || account.id_linea || null;

      let { error } = await supabase
        .from('iptv_clientes')
        .upsert([{
          username: account.username,
          password: account.password,
          url_panel_asignada: account.url_panel_asignada,
          estado: account.estado || 'Activo',
          limite_pantallas: account.limite_pantallas !== undefined ? Number(account.limite_pantallas) : 2,
          fecha_creacion: account.fecha_creacion || new Date().toISOString(),
          fecha_vencimiento: account.fecha_vencimiento || null,
          comentarios: account.comentarios || '',
          nombre_completo: account.nombre_completo || '',
          celular: account.celular || '',
          direccion_actual: account.direccion_actual || '',
          id_plan_proveedor: account.id_plan_proveedor || '',
          id_plan_venta: account.id_plan_venta || '',
          bitacora_comentarios: bitacora,
          creado_por: account.creado_por || 'admin',
          panel_client_id: pClientId ? String(pClientId) : null,
          member_id: account.member_id ? String(account.member_id) : null,
          access_token: account.access_token ? String(account.access_token) : null,
          playlist_url: account.playlist_url ? String(account.playlist_url) : null,
          bouquet: account.bouquet ? String(account.bouquet) : null,
          package_id: account.package_id ? String(account.package_id) : null,
          raw_response_json: account.raw_response_json || null
        }]);

      if (error) {
        console.warn("[saveIptvAccount] Falló upsert con columnas extendidas, reintentando con esquema básico...", error.message || error);
        // Fallback resiliente sin las nuevas columnas por si el usuario no ha migrado su base de datos o el cache está desactualizado
        const fallbackRes = await supabase
          .from('iptv_clientes')
          .upsert([{
            username: account.username,
            password: account.password,
            url_panel_asignada: account.url_panel_asignada,
            estado: account.estado || 'Activo',
            limite_pantallas: account.limite_pantallas !== undefined ? Number(account.limite_pantallas) : 2,
            fecha_creacion: account.fecha_creacion || new Date().toISOString(),
            fecha_vencimiento: account.fecha_vencimiento || null,
            comentarios: account.comentarios || '',
            nombre_completo: account.nombre_completo || '',
            celular: account.celular || '',
            direccion_actual: account.direccion_actual || '',
            id_plan_proveedor: account.id_plan_proveedor || '',
            id_plan_venta: account.id_plan_venta || '',
            bitacora_comentarios: bitacora,
            creado_por: account.creado_por || 'admin'
          }]);
        if (fallbackRes.error) throw fallbackRes.error;
      }
    } catch (e: any) {
      console.error("[saveIptvAccount] Error fatal guardando en Supabase:", e.message || e);
      return { success: false, error: e.message || e };
    }

    try {
      // Registrar también en LocalStorage para redundancia local inmediata
      let accounts = [];
      try {
        accounts = await this.getIptvAccounts();
      } catch {
        const local = localStorage.getItem('g3d_iptv_cuentas');
        if (local) accounts = JSON.parse(local);
      }
      accounts = accounts.filter((it: any) => it.username !== account.username);
      accounts.unshift(account);
      localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(accounts));
      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptvAccount] Error guardando copia local:", e);
      return { success: true, localError: e.message || e }; // Si se guardó en Supabase pero falló local, es éxito
    }
  },

  async deleteIptvAccount(username: string) {
    let supabaseError = null;
    try {
      // 1. Obtener todos los perfiles asociados a esta cuenta en Supabase para poder limpiar sus historiales
      const { data: dbProfiles, error: profsError } = await supabase
        .from('iptv_clientes_perfiles')
        .select('id')
        .eq('username_cuenta', username);

      if (!profsError && dbProfiles && dbProfiles.length > 0) {
        const profileIds = dbProfiles.map((p: any) => p.id);
        
        // 2. Eliminar historial de reproducción de todos estos perfiles
        await supabase
          .from('iptv_clientes_historial')
          .delete()
          .in('perfil_id', profileIds);
      }

      // 3. Eliminar los perfiles de la cuenta
      await supabase
        .from('iptv_clientes_perfiles')
        .delete()
        .eq('username_cuenta', username);

      // 4. Eliminar sesiones activas asociadas en Supabase (si existieran)
      try {
        await supabase
          .from('sesiones_activas_iptv')
          .delete()
          .eq('username_cuenta', username);
      } catch (sessSupaErr) {
        console.warn("No se pudo limpiar la tabla de sesiones activas en el backend:", sessSupaErr);
      }

      // 5. Eliminar la cuenta del cliente principal
      const { error } = await supabase
        .from('iptv_clientes')
        .delete()
        .eq('username', username);

      if (error) {
        supabaseError = error.message;
        throw error;
      }

      // 6. Limpieza de imágenes en los Buckets IPTV_TRANSFERENSIA e IPTV_STORGE asociados a este username
      try {
        const buckets = ['IPTV_TRANSFERENSIA', 'IPTV_STORGE'];
        for (const bucket of buckets) {
          // A. Intentar listar archivos en una "carpeta virtual" llamada igual que el username
          const { data: filesList, error: listError } = await supabase.storage
            .from(bucket)
            .list(username);

          if (!listError && filesList && filesList.length > 0) {
            const filesToRemove = filesList.map((f: any) => `${username}/${f.name}`);
            await supabase.storage
              .from(bucket)
              .remove(filesToRemove);
          }

          // B. Buscar posibles archivos sueltos en el root con prefijo `${username}_` o `${username}.`
          const { data: rootList, error: rootListError } = await supabase.storage
            .from(bucket)
            .list('');
          if (!rootListError && rootList && rootList.length > 0) {
            const prefix = `${username}_`;
            const prefixedFiles = rootList
              .filter((f: any) => f.name.startsWith(prefix) || f.name.startsWith(`${username}.`))
              .map((f: any) => f.name);
            if (prefixedFiles.length > 0) {
              await supabase.storage
                .from(bucket)
                .remove(prefixedFiles);
            }
          }
        }
      } catch (storageErr: any) {
        console.warn("[deleteIptvAccount] No se pudieron limpiar las imágenes de storage asociados a la cuenta:", storageErr.message || storageErr);
      }
    } catch (e: any) {
      console.warn("[deleteIptvAccount] Falló borrado relacional en Supabase, reintentando borrado directo:", e.message || e);
      supabaseError = e.message || String(e);
      
      // Fallback: intentar por lo menos borrar la cuenta directamente
      try {
        const { error: directErr } = await supabase
          .from('iptv_clientes')
          .delete()
          .eq('username', username);
        if (directErr) supabaseError = directErr.message;
        else supabaseError = null; // Si el directo funcionó, limpiamos el error
      } catch (fallErr) {
        console.error("Fallo total de eliminación directa en base de datos:", fallErr);
      }
    }

    try {
      let accounts = await this.getIptvAccounts();
      accounts = accounts.filter((it: any) => it.username !== username);
      localStorage.setItem('g3d_iptv_cuentas', JSON.stringify(accounts));

      // Limpieza cascada local de perfiles
      let profiles = JSON.parse(localStorage.getItem('g3d_iptv_perfiles') || '[]');
      profiles = profiles.filter((p: any) => p.username_cuenta !== username);
      localStorage.setItem('g3d_iptv_perfiles', JSON.stringify(profiles));

      // Limpieza cascada de sesiones
      let sessions = JSON.parse(localStorage.getItem('g3d_iptv_sesiones') || '[]');
      sessions = sessions.filter((s: any) => s.username_cuenta !== username);
      localStorage.setItem('g3d_iptv_sesiones', JSON.stringify(sessions));

      if (supabaseError) {
        return { success: true, localOnly: true, error: supabaseError };
      }
      return { success: true };
    } catch (e: any) {
      console.warn("[deleteIptvAccount] Error borrando localmente:", e);
      return { success: false, error: e.message || e };
    }
  },

  async getIptvActiveSessions(username?: string) {
    let local = localStorage.getItem('g3d_iptv_sesiones');
    if (!local) {
      return [];
    }
    const allSessions = JSON.parse(local);
    if (username) {
      return allSessions.filter((s: any) => s.username_cuenta === username);
    }
    return allSessions;
  },

  async deleteIptvActiveSession(sessionId: string) {
    try {
      let sessions = JSON.parse(localStorage.getItem('g3d_iptv_sesiones') || '[]');
      sessions = sessions.filter((s: any) => s.id !== sessionId);
      localStorage.setItem('g3d_iptv_sesiones', JSON.stringify(sessions));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || e };
    }
  },

  async getIptvProfiles(username?: string) {
    try {
      let query = supabase.from('iptv_clientes_perfiles').select('*');
      if (username) {
        query = query.eq('username_cuenta', username);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data;
      }
    } catch (e: any) {
      console.warn("[getIptvProfiles] Error leyendo perfiles de Supabase:", e.message || e);
    }

    let local = localStorage.getItem('g3d_iptv_perfiles');
    if (!local) {
      return [];
    }
    const allProfiles = JSON.parse(local);
    if (username) {
      return allProfiles.filter((p: any) => p.username_cuenta === username);
    }
    return allProfiles;
  },

  async saveIptvProfile(profile: any) {
    try {
      const { error } = await supabase
        .from('iptv_clientes_perfiles')
        .upsert([{
          id: profile.id || undefined,
          username_cuenta: profile.username_cuenta,
          nombre_perfil: profile.nombre_perfil,
          pin_perfil: profile.pin_perfil,
          avatar_url: profile.avatar_url
        }]);
      if (error) throw error;
    } catch (e: any) {
      console.warn("[saveIptvProfile] Error guardando perfil en Supabase:", e.message || e);
    }

    try {
      let all = await this.getIptvProfiles();
      all = all.filter((p: any) => p.id !== profile.id);
      all.push(profile);
      localStorage.setItem('g3d_iptv_perfiles', JSON.stringify(all));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || e };
    }
  },

  async deleteIptvProfile(profileId: string) {
    try {
      const { error } = await supabase
        .from('iptv_clientes_perfiles')
        .delete()
        .eq('id', profileId);
      if (error) throw error;
    } catch (e: any) {
      console.warn("[deleteIptvProfile] Error borrando perfil en Supabase:", e.message || e);
    }

    try {
      let all = await this.getIptvProfiles();
      all = all.filter((p: any) => p.id !== profileId);
      localStorage.setItem('g3d_iptv_perfiles', JSON.stringify(all));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || e };
    }
  },

  async getIptvPlaybackHistory(profileId?: string) {
    try {
      let query = supabase.from('iptv_clientes_historial').select('*');
      if (profileId) {
        query = query.eq('perfil_id', profileId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.warn("[getIptvPlaybackHistory] Error leyendo de Supabase:", e.message || e);
      let local = localStorage.getItem('g3d_iptv_historial');
      if (!local) {
        return [];
      }
      const allHist = JSON.parse(local);
      if (profileId) {
        return allHist.filter((h: any) => h.perfil_id === profileId);
      }
      return allHist;
    }
  },

  async saveIptvPlaybackHistory(record: any) {
    try {
      const { error } = await supabase
        .from('iptv_clientes_historial')
        .upsert(record);
      
      if (error) throw error;
      
      let all = await this.getIptvPlaybackHistory();
      all = all.filter((h: any) => h.id !== record.id);
      all.push(record);
      localStorage.setItem('g3d_iptv_historial', JSON.stringify(all));
      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptvPlaybackHistory] Guardado local en mock:", e.message || e);
      let all = await this.getIptvPlaybackHistory();
      all = all.filter((h: any) => h.id !== record.id);
      all.push(record);
      localStorage.setItem('g3d_iptv_historial', JSON.stringify(all));
      return { success: true, localOnly: true };
    }
  },

  async getIptvDnsProviders() {
    try {
      const { data, error } = await supabase
        .from('iptv_proveedores_dns')
        .select('*')
        .order('nombre_proveedor', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.warn("[getIptvDnsProviders] Fallback local o error:", e.message || e);
      const local = localStorage.getItem('g3d_iptv_proveedores_dns');
      if (!local) {
        const defaultDns = [
          { id: 'dns-1', nombre_proveedor: 'Servidor VIP Principal', url_dns: 'http://vip-xtv.pro:8080' },
          { id: 'dns-2', nombre_proveedor: 'Servidor Deportes HD', url_dns: 'http://sports-dns.xyz:1080' },
          { id: 'dns-3', nombre_proveedor: 'Servidor Latino Premium', url_dns: 'http://kids-xtv.pro:8080' }
        ];
        localStorage.setItem('g3d_iptv_proveedores_dns', JSON.stringify(defaultDns));
        return defaultDns;
      }
      return JSON.parse(local);
    }
  },

  async saveIptvDnsProvider(provider: any) {
    try {
      // Intentar insertar/actualizar en supabase
      const { error } = await supabase
        .from('iptv_proveedores_dns')
        .upsert(provider);
      if (error) throw error;

      // Sincronizar local
      let all = await this.getIptvDnsProviders();
      all = all.filter((p: any) => p.id !== provider.id);
      all.push(provider);
      localStorage.setItem('g3d_iptv_proveedores_dns', JSON.stringify(all));
      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptvDnsProvider] Guardado local:", e.message || e);
      let all = await this.getIptvDnsProviders();
      all = all.filter((p: any) => p.id !== provider.id);
      all.push(provider);
      localStorage.setItem('g3d_iptv_proveedores_dns', JSON.stringify(all));
      return { success: true, localOnly: true };
    }
  },

  async deleteIptvDnsProvider(id: string) {
    try {
      const { error } = await supabase
        .from('iptv_proveedores_dns')
        .delete()
        .eq('id', id);
      if (error) throw error;

      let all = await this.getIptvDnsProviders();
      all = all.filter((p: any) => p.id !== id);
      localStorage.setItem('g3d_iptv_proveedores_dns', JSON.stringify(all));
      return { success: true };
    } catch (e: any) {
      console.warn("[deleteIptvDnsProvider] Borrado local:", e.message || e);
      let all = await this.getIptvDnsProviders();
      all = all.filter((p: any) => p.id !== id);
      localStorage.setItem('g3d_iptv_proveedores_dns', JSON.stringify(all));
      return { success: true, localOnly: true };
    }
  },

  async getIptvBranding() {
    try {
      const { data, error } = await supabase
        .from('iptv_branding')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return data;
      }
      throw new Error("No data returned");
    } catch (e: any) {
      console.warn("[getIptvBranding] Usando local storage:", e.message || e);
      const local = localStorage.getItem('g3d_iptv_branding');
      return local ? JSON.parse(local) : { 
        logo_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80', 
        promo_spot_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHE4OWpvaXZ4cHJ5eDZ4ZWR2c2k4MGh0amNhdXFpOG9ubnF1Z2U4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif' 
      };
    }
  },

  async saveIptvBranding(branding: any) {
    try {
      const { error } = await supabase
        .from('iptv_branding')
        .upsert({ id: 1, ...branding });
      if (error) throw error;
      localStorage.setItem('g3d_iptv_branding', JSON.stringify(branding));
      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptvBranding] Guardado local alternativo:", e.message || e);
      localStorage.setItem('g3d_iptv_branding', JSON.stringify(branding));
      return { success: true, localOnly: true };
    }
  },

  async getIptvFinances() {
    try {
      const { data, error } = await supabase
        .from('iptv_finanzas_config')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        // Intentar leer los planes de proveedor como filas individuales de iptv_planes_proveedor
        let dbProviderPlans: any[] = [];
        try {
          const { data: provData, error: provError } = await supabase
            .from('iptv_planes_proveedor')
            .select('*');
          
          if (!provError && provData && provData.length > 0) {
            dbProviderPlans = provData.map(p => ({
              id: p.id,
              provider_name: p.provider_name || 'XUI.ONE API',
              name: p.name || '',
              months: Number(p.months),
              hours: p.hours != null ? Number(p.hours) : 0,
              screens: Number(p.screens),
              tokens: Number(p.tokens),
              token_price: p.token_price != null ? Number(p.token_price) : 1500,
              cost: Number(p.cost),
              archived: !!p.archived,
              provider_cost_id: p.provider_cost_id || ''
            }));
          } else {
            dbProviderPlans = Array.isArray(data.provider_plans) ? data.provider_plans : [];
          }
        } catch (provErr) {
          console.warn("[getIptvFinances] Error cargando tabla de filas de planes de proveedor, usando JSONB fallback:", provErr);
          dbProviderPlans = Array.isArray(data.provider_plans) ? data.provider_plans : [];
        }

        // Intentar leer los planes de venta como filas individuales de iptv_planes_venta
        let dbSalePlans: any[] = [];
        try {
          const { data: plansData, error: plansError } = await supabase
            .from('iptv_planes_venta')
            .select('*');
          
          if (!plansError && plansData && plansData.length > 0) {
            dbSalePlans = plansData.map(p => ({
              id: p.id,
              provider_plan_id: p.provider_plan_id || '',
              name: p.name || '',
              months: Number(p.months),
              hours: p.hours != null ? Number(p.hours) : 0,
              screens: Number(p.screens),
              tokens: Number(p.tokens),
              price: Number(p.price),
              screens_api: p.screens_api != null ? Number(p.screens_api) : Number(p.screens || 1),
              comision: p.comision != null ? Number(p.comision) : (p.comision_vendedor != null ? Number(p.comision_vendedor) : 0),
              comision_vendedor: p.comision_vendedor != null ? Number(p.comision_vendedor) : (p.comision != null ? Number(p.comision) : 0),
              comision_referente: p.comision_referente != null ? Number(p.comision_referente) : 0
            }));
          } else {
            dbSalePlans = Array.isArray(data.sale_plans) ? data.sale_plans : [];
          }
        } catch (planErr) {
          console.warn("[getIptvFinances] Error cargando tabla de filas de planes de venta, usando JSONB fallback:", planErr);
          dbSalePlans = Array.isArray(data.sale_plans) ? data.sale_plans : [];
        }

        const savedDollarRate = localStorage.getItem('g3d_iptv_active_dollar_rate');
        const savedTokenPkgUsd = localStorage.getItem('g3d_iptv_active_token_package_usd');
        const savedProviderName = localStorage.getItem('g3d_iptv_active_provider_name');
        const savedCreditsPerPack = localStorage.getItem('g3d_iptv_active_credits_per_pack');
        const savedAvailableCredits = localStorage.getItem('g3d_iptv_active_available_credits');

        return {
          ...data,
          dollar_rate: savedDollarRate != null ? Number(savedDollarRate) : (data.dollar_rate != null ? Number(data.dollar_rate) : 1000.00),
          token_package_usd: savedTokenPkgUsd != null ? Number(savedTokenPkgUsd) : (data.token_package_usd != null ? Number(data.token_package_usd) : 90),
          credits_per_pack: savedCreditsPerPack != null ? Number(savedCreditsPerPack) : (data.credits_per_pack != null ? Number(data.credits_per_pack) : 70),
          available_credits: savedAvailableCredits != null ? Number(savedAvailableCredits) : (data.available_credits != null ? Number(data.available_credits) : 350),
          provider_name: savedProviderName != null ? savedProviderName : (data.provider_name || 'Lucas Mayorista'),
          payment_discount: data.payment_discount != null ? Number(data.payment_discount) : 0,
          additional_tax_percent: data.additional_tax_percent != null ? Number(data.additional_tax_percent) : 0,
          app_maintenance_cost: data.app_maintenance_cost != null ? Number(data.app_maintenance_cost) : 0,
          street_tech_cost: data.street_tech_cost != null ? Number(data.street_tech_cost) : 0,
          provider_plans: dbProviderPlans,
          sale_plans: dbSalePlans,
          partners: Array.isArray(data.partners) ? data.partners : []
        };
      }
      throw new Error("No data returned");
    } catch (e: any) {
      console.warn("[getIptvFinances] Error leyendo base, usando local storage:", e.message || e);
      const local = localStorage.getItem('g3d_iptv_finanzas');
      if (local) return JSON.parse(local);
      const defaults = {
        dollar_rate: 1000.00,
        token_package_usd: 3.50,
        payment_discount: 0,
        additional_tax_percent: 0,
        app_maintenance_cost: 0,
        street_tech_cost: 0,
        provider_plans: [],
        sale_plans: [],
        partners: [
          { name: 'Socio A (Administrador)', percent: 50, role: 'Socio Administrador', advances: 0 },
          { name: 'Socio B (Capitalista)', percent: 30, role: 'Socio Inversionista', advances: 0 },
          { name: 'Plataforma (Mantenimiento)', percent: 20, role: 'Comisión Servidor', advances: 0 }
        ]
      };
      localStorage.setItem('g3d_iptv_finanzas', JSON.stringify(defaults));
      return defaults;
    }
  },

  async saveIptvFinances(data: any) {
    try {
      // 1. Obtener la configuración actual para no sobreescribir con valores vacíos involuntarios
      let existingConfig: any = {};
      try {
        const { data: currentData } = await supabase
          .from('iptv_finanzas_config')
          .select('*')
          .eq('id', 1)
          .single();
        if (currentData) {
          existingConfig = currentData;
        }
      } catch (errConfig) {
        console.warn("[saveIptvFinances] No se pudo obtener la configuración existente, usando datos nuevos directamente:", errConfig);
      }

      const payload = {
        id: 1,
        dollar_rate: data.dollar_rate !== undefined ? Number(data.dollar_rate) : (existingConfig.dollar_rate !== undefined ? Number(existingConfig.dollar_rate) : 1000.00),
        token_package_usd: data.token_package_usd !== undefined ? Number(data.token_package_usd) : (existingConfig.token_package_usd !== undefined ? Number(existingConfig.token_package_usd) : 3.50),
        payment_discount: data.payment_discount !== undefined ? Number(data.payment_discount) : (existingConfig.payment_discount !== undefined ? Number(existingConfig.payment_discount) : 0),
        additional_tax_percent: data.additional_tax_percent !== undefined ? Number(data.additional_tax_percent) : (existingConfig.additional_tax_percent !== undefined ? Number(existingConfig.additional_tax_percent) : 0),
        app_maintenance_cost: data.app_maintenance_cost !== undefined ? Number(data.app_maintenance_cost) : (existingConfig.app_maintenance_cost !== undefined ? Number(existingConfig.app_maintenance_cost) : 0),
        street_tech_cost: data.street_tech_cost !== undefined ? Number(data.street_tech_cost) : (existingConfig.street_tech_cost !== undefined ? Number(existingConfig.street_tech_cost) : 0),
        provider_plans: (data.provider_plans && data.provider_plans.length > 0) ? data.provider_plans : (existingConfig.provider_plans || []),
        sale_plans: (data.sale_plans && data.sale_plans.length > 0) ? data.sale_plans : (existingConfig.sale_plans || []),
        partners: (data.partners && data.partners.length > 0) ? data.partners : (existingConfig.partners || [])
      };

      const { error } = await supabase
        .from('iptv_finanzas_config')
        .upsert([payload]);
      
      if (error) throw error;

      // Sincronizar individualmente cada plan de proveedor en iptv_planes_proveedor como filas separadas
      if (Array.isArray(data.provider_plans) && data.provider_plans.length > 0) {
        try {
          const currentPlanIds = data.provider_plans.map((p: any) => p.id);
          
          // 1. Obtener los IDs guardados actualmente en la base para eliminar los que el usuario quitó EXPLICITAMENTE
          const { data: existingPlans } = await supabase
            .from('iptv_planes_proveedor')
            .select('id');
          
          if (existingPlans && existingPlans.length > 0) {
            const idsToDelete = existingPlans
              .map((ep: any) => ep.id)
              .filter((id: string) => !currentPlanIds.includes(id));
            
            if (idsToDelete.length > 0) {
              await supabase
                .from('iptv_planes_proveedor')
                .delete()
                .in('id', idsToDelete);
            }
          }

          // 2. Realizar upsert individual de cada plan activo o archivado
          for (const plan of data.provider_plans) {
            const planPayload = {
              id: plan.id,
              provider_name: plan.provider_name || 'XUI.ONE API',
              name: plan.name,
              months: Number(plan.months),
              hours: plan.hours != null ? Number(plan.hours) : 0,
              screens: Number(plan.screens),
              tokens: Number(plan.tokens) || 0,
              token_price: Number(plan.token_price) || 1500,
              cost: Number(plan.cost) || 0,
              archived: !!plan.archived,
              provider_cost_id: plan.provider_cost_id || null
            };
            
            await supabase
              .from('iptv_planes_proveedor')
              .upsert([planPayload]);
          }
        } catch (provErr: any) {
          console.warn("[saveIptvFinances] Error al persistir planes individuales en iptv_planes_proveedor:", provErr.message || provErr);
        }
      }

      // Sincronizar individualmente cada plan de venta en iptv_planes_venta como filas separadas
      if (Array.isArray(data.sale_plans) && data.sale_plans.length > 0) {
        try {
          const currentPlanIds = data.sale_plans.map((p: any) => p.id);
          
          // 1. Obtener los IDs guardados actualmente en la base para eliminar los que el usuario quitó
          // Solo ejecutamos purga si sale_plans no está vacío para evitar falsos positivos
          const { data: existingPlans } = await supabase
            .from('iptv_planes_venta')
            .select('id');
          
          if (existingPlans && existingPlans.length > 0) {
            const idsToDelete = existingPlans
              .map((ep: any) => ep.id)
              .filter((id: string) => !currentPlanIds.includes(id));
            
            if (idsToDelete.length > 0) {
              await supabase
                .from('iptv_planes_venta')
                .delete()
                .in('id', idsToDelete);
            }
          }

          // 2. Realizar upsert individual de cada plan activo
          for (const plan of data.sale_plans) {
            const screensApiVal = plan.screens_api != null ? Number(plan.screens_api) : Number(plan.screens || 1);
            const comisionVendedorVal = plan.comision_vendedor != null 
              ? Number(plan.comision_vendedor) 
              : (plan.comision != null ? Number(plan.comision) : 0);
            const comisionReferenteVal = plan.comision_referente != null 
              ? Number(plan.comision_referente) 
              : 0;

            const fullPayload = {
              id: plan.id,
              provider_plan_id: plan.provider_plan_id || null,
              name: plan.name,
              months: Number(plan.months),
              hours: plan.hours != null ? Number(plan.hours) : 0,
              screens: Number(plan.screens),
              tokens: Number(plan.tokens) || 0,
              price: Number(plan.price),
              screens_api: screensApiVal,
              comision: comisionVendedorVal,
              comision_vendedor: comisionVendedorVal,
              comision_referente: comisionReferenteVal,
              categoria_nombre: plan.categoria_nombre || '',
              categoria_id: plan.categoria_id || 'vip'
            };
            
            try {
              const { error: upsertErr } = await supabase
                .from('iptv_planes_venta')
                .upsert([fullPayload]);
              
              if (upsertErr) throw upsertErr;
            } catch (err: any) {
              console.warn("[saveIptvFinances] Upsert completo falló (posiblemente por columnas faltantes comision_vendedor/comision_referente), reintentando con payload clásico:", err.message || err);
              try {
                // Fallback con comision clásica si comision_vendedor/referente no existen aún
                const legacyPayload = {
                  id: plan.id,
                  provider_plan_id: plan.provider_plan_id || null,
                  name: plan.name,
                  months: Number(plan.months),
                  hours: plan.hours != null ? Number(plan.hours) : 0,
                  screens: Number(plan.screens),
                  tokens: Number(plan.tokens) || 0,
                  price: Number(plan.price),
                  screens_api: screensApiVal,
                  comision: comisionVendedorVal,
                  categoria_nombre: plan.categoria_nombre || '',
                  categoria_id: plan.categoria_id || 'vip'
                };
                const { error: legErr } = await supabase
                  .from('iptv_planes_venta')
                  .upsert([legacyPayload]);
                if (legErr) throw legErr;
              } catch (legFallbackErr: any) {
                // Fallback ultra seguro original
                const safePayload = {
                  id: plan.id,
                  provider_plan_id: plan.provider_plan_id || null,
                  name: plan.name,
                  months: Number(plan.months),
                  hours: plan.hours != null ? Number(plan.hours) : 0,
                  screens: Number(plan.screens),
                  tokens: Number(plan.tokens) || 0,
                  price: Number(plan.price)
                };
                await supabase
                  .from('iptv_planes_venta')
                  .upsert([safePayload]);
              }
            }
          }
        } catch (planErr: any) {
          console.warn("[saveIptvFinances] Error al persistir planes individuales en iptv_planes_venta:", planErr.message || planErr);
        }
      }

      localStorage.setItem('g3d_iptv_finanzas', JSON.stringify(payload));
      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptvFinances] Guardando localmente como fallback:", e.message || e);
      localStorage.setItem('g3d_iptv_finanzas', JSON.stringify(data));
      return { success: true, localOnly: true };
    }
  },

  async deleteIptvSalePlan(id: string) {
    try {
      const { error } = await supabase
        .from('iptv_planes_venta')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn("[deleteIptvSalePlan] Error deleting plan:", err.message || err);
      return { success: false, error: err.message || err };
    }
  },

  // ==========================================
  // COSTOS DE PROVEEDORES (REGISTRO CON UUID)
  // ==========================================
  async getIptvCostosProveedor(): Promise<IptvCostoProveedor[]> {
    try {
      const { data, error } = await supabase
        .from('iptv_costos_proveedor')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(item => ({
          id: item.id,
          proveedor: item.proveedor || '',
          plan: item.plan || '',
          precio: Number(item.precio) || 0,
          creditos: Number(item.creditos) || 0,
          link: item.link || '',
          fecha_creacion: item.fecha_creacion
        }));
      }
      return [];
    } catch (e: any) {
      console.warn("[getIptvCostosProveedor] Fallback a LocalStorage:", e.message || e);
      const local = localStorage.getItem('g3d_iptv_costos_proveedor');
      return local ? JSON.parse(local) : [];
    }
  },

  async saveIptvCostoProveedor(item: IptvCostoProveedor): Promise<{ success: boolean; data?: IptvCostoProveedor; localOnly?: boolean }> {
    try {
      const payload: any = {
        proveedor: item.proveedor || '',
        plan: item.plan || '',
        precio: Number(item.precio) || 0,
        creditos: Number(item.creditos) || 0,
        link: item.link || ''
      };

      if (item.id) {
        payload.id = item.id;
      }

      let { data, error } = await supabase
        .from('iptv_costos_proveedor')
        .upsert([payload])
        .select();

      if (error) {
        if (error.message?.includes('link') || error.details?.includes('link') || error.code === '42703' || error.message?.includes('column')) {
          console.warn("[saveIptvCostoProveedor] Reintentando guardar sin el campo link (columna no existe en Postgres)...");
          const fallbackPayload = { ...payload };
          delete fallbackPayload.link;
          const retryRes = await supabase
            .from('iptv_costos_proveedor')
            .upsert([fallbackPayload])
            .select();
          if (retryRes.error) throw retryRes.error;
          data = retryRes.data;
        } else {
          throw error;
        }
      }
      
      const currentList = await this.getIptvCostosProveedor();
      const updatedList = item.id 
        ? currentList.map(p => p.id === item.id ? { ...p, ...payload } : p)
        : [data?.[0] || { id: crypto.randomUUID(), ...payload, fecha_creacion: new Date().toISOString() }, ...currentList];
      
      localStorage.setItem('g3d_iptv_costos_proveedor', JSON.stringify(updatedList));

      return { 
        success: true, 
        data: data?.[0] ? { 
          id: data[0].id, 
          proveedor: data[0].proveedor, 
          plan: data[0].plan, 
          precio: Number(data[0].precio), 
          creditos: Number(data[0].creditos),
          link: data[0].link || '',
          fecha_creacion: data[0].fecha_creacion
        } : undefined 
      };
    } catch (e: any) {
      console.warn("[saveIptvCostoProveedor] Fallback local...", e.message || e);
      const currentList = await this.getIptvCostosProveedor();
      let savedItem: IptvCostoProveedor;
      let updatedList: IptvCostoProveedor[];

      if (item.id) {
        savedItem = { ...item };
        updatedList = currentList.map(p => p.id === item.id ? savedItem : p);
      } else {
        savedItem = {
          ...item,
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
          fecha_creacion: new Date().toISOString()
        };
        updatedList = [savedItem, ...currentList];
      }

      localStorage.setItem('g3d_iptv_costos_proveedor', JSON.stringify(updatedList));
      return { success: true, data: savedItem, localOnly: true };
    }
  },

  async deleteIptvCostoProveedor(id: string): Promise<{ success: boolean; localOnly?: boolean }> {
    try {
      const { error } = await supabase
        .from('iptv_costos_proveedor')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const currentList = await this.getIptvCostosProveedor();
      const updatedList = currentList.filter(item => item.id !== id);
      localStorage.setItem('g3d_iptv_costos_proveedor', JSON.stringify(updatedList));

      return { success: true };
    } catch (e: any) {
      console.warn("[deleteIptvCostoProveedor] Fallback local...", e.message || e);
      const currentList = await this.getIptvCostosProveedor();
      const updatedList = currentList.filter(item => item.id !== id);
      localStorage.setItem('g3d_iptv_costos_proveedor', JSON.stringify(updatedList));
      return { success: true, localOnly: true };
    }
  },

  async getIptv2ClientesRegistros() {
    try {
      const { data, error } = await supabase
        .from('iptv2_clientes_registros')
        .select('*')
        .order('creado_al', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.warn("[getIptv2ClientesRegistros] Fallback local...", e.message || e);
      return JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
    }
  },

  async getIptv2DispositivosMac() {
    try {
      const { data, error } = await supabase
        .from('iptv2_dispositivos_mac')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.warn("[getIptv2DispositivosMac] Fallback local...", e.message || e);
      return JSON.parse(localStorage.getItem('g3d_iptv2_dispositivos_mac') || '[]');
    }
  },

  async updateIptv2ClienteEstado(correo_usuario: string, updates: { estado: string; clave_xtream?: string }) {
    try {
      const { data, error } = await supabase
        .from('iptv2_clientes_registros')
        .update(updates)
        .eq('correo_usuario', correo_usuario)
        .select();
      if (error) throw error;
      
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const updatedList = localList.map((c: any) => c.correo_usuario === correo_usuario ? { ...c, ...updates } : c);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify(updatedList));

      return { success: true, data };
    } catch (e: any) {
      console.warn("[updateIptv2ClienteEstado] Fallback local...", e.message || e);
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const updatedList = localList.map((c: any) => c.correo_usuario === correo_usuario ? { ...c, ...updates } : c);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify(updatedList));
      return { success: true, localOnly: true };
    }
  },

  async saveIptv2ClienteRegistro(cliente: any, macAddresses?: string[]) {
    try {
      const { data, error } = await supabase
        .from('iptv2_clientes_registros')
        .upsert(cliente)
        .select();
      if (error) throw error;

      if (macAddresses && macAddresses.length > 0) {
        const macInserts = macAddresses.map(mac => ({
          correo_usuario: cliente.correo_usuario,
          mac_address: mac
        }));
        await supabase
          .from('iptv2_dispositivos_mac')
          .insert(macInserts);
      }

      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const filtered = localList.filter((c: any) => c.correo_usuario !== cliente.correo_usuario);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify([...filtered, cliente]));

      if (macAddresses && macAddresses.length > 0) {
        const localMacs = JSON.parse(localStorage.getItem('g3d_iptv2_dispositivos_mac') || '[]');
        const filteredMacs = localMacs.filter((m: any) => m.correo_usuario !== cliente.correo_usuario);
        const newMacs = macAddresses.map(mac => ({
          id: Math.random().toString(36).substring(2, 11),
          correo_usuario: cliente.correo_usuario,
          mac_address: mac,
          creado_al: new Date().toISOString()
        }));
        localStorage.setItem('g3d_iptv2_dispositivos_mac', JSON.stringify([...filteredMacs, ...newMacs]));
      }

      return { success: true };
    } catch (e: any) {
      console.warn("[saveIptv2ClienteRegistro] Fallback local...", e.message || e);
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const filtered = localList.filter((c: any) => c.correo_usuario !== cliente.correo_usuario);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify([...filtered, cliente]));

      if (macAddresses && macAddresses.length > 0) {
        const localMacs = JSON.parse(localStorage.getItem('g3d_iptv2_dispositivos_mac') || '[]');
        const filteredMacs = localMacs.filter((m: any) => m.correo_usuario !== cliente.correo_usuario);
        const newMacs = macAddresses.map(mac => ({
          id: Math.random().toString(36).substring(2, 11),
          correo_usuario: cliente.correo_usuario,
          mac_address: mac,
          creado_al: new Date().toISOString()
        }));
        localStorage.setItem('g3d_iptv2_dispositivos_mac', JSON.stringify([...filteredMacs, ...newMacs]));
      }
      return { success: true, localOnly: true };
    }
  },

  async deleteIptv2ClienteRegistro(correo_usuario: string) {
    try {
      const { error } = await supabase
        .from('iptv2_clientes_registros')
        .delete()
        .eq('correo_usuario', correo_usuario);
      if (error) throw error;
      
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const updatedList = localList.filter((c: any) => c.correo_usuario !== correo_usuario);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify(updatedList));

      const localMacs = JSON.parse(localStorage.getItem('g3d_iptv2_dispositivos_mac') || '[]');
      const updatedMacs = localMacs.filter((m: any) => m.correo_usuario !== correo_usuario);
      localStorage.setItem('g3d_iptv2_dispositivos_mac', JSON.stringify(updatedMacs));

      return { success: true };
    } catch (e: any) {
      console.warn("[deleteIptv2ClienteRegistro] Fallback local...", e.message || e);
      const localList = JSON.parse(localStorage.getItem('g3d_iptv2_clientes_registros') || '[]');
      const updatedList = localList.filter((c: any) => c.correo_usuario !== correo_usuario);
      localStorage.setItem('g3d_iptv2_clientes_registros', JSON.stringify(updatedList));

      const localMacs = JSON.parse(localStorage.getItem('g3d_iptv2_dispositivos_mac') || '[]');
      const updatedMacs = localMacs.filter((m: any) => m.correo_usuario !== correo_usuario);
      localStorage.setItem('g3d_iptv2_dispositivos_mac', JSON.stringify(updatedMacs));
      return { success: true, localOnly: true };
    }
  },

  // Gestión de Usuarios del Panel, Créditos y Solicitudes
  async getIptvPanelUsers() {
    try {
      const { data, error } = await supabase
        .from('perfiles_locales')
        .select('*')
        .order('email', { ascending: true });
      if (error) throw error;
      return (data || []).map((u: any) => ({
        ...u,
        usuario: u.email,
        creditos: u.creditos !== undefined ? Number(u.creditos) : 10,
        creditos_demo: u.creditos_demo !== undefined ? Number(u.creditos_demo) : 15
      }));
    } catch (e: any) {
      console.warn("[getIptvPanelUsers] Error reading perfiles_locales, falling back to local:", e.message || e);
      const mockUsers = [
        { usuario: 'admin@xtv.com', nombre: 'Administrador de Pruebas', rol: 'Administrador', creditos: 99999, creditos_demo: 99999 },
        { usuario: 'vendedor@xtv.com', nombre: 'Vendedor Local', rol: 'IPTV VENDEDORES', creditos: 10, creditos_demo: 15 }
      ];
      return mockUsers;
    }
  },

  async updateIptvPanelUserCredits(usuario: string, creditos_vip: number, creditos_demo?: number) {
    try {
      const updatePayload: any = { creditos: creditos_vip };
      if (creditos_demo !== undefined) {
        updatePayload.creditos_demo = creditos_demo;
      }
      const { error } = await supabase
        .from('perfiles_locales')
        .update(updatePayload)
        .eq('email', usuario.trim().toLowerCase());
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.warn("[updateIptvPanelUserCredits] Error in Supabase updating perfiles_locales credit:", e.message || e);
      return { success: true, localOnly: true };
    }
  },

  async getIptvCreditRequests() {
    try {
      const { data, error } = await supabase
        .from('iptv_creditos_solicitudes')
        .select('*')
        .order('creado_al', { ascending: false });
      
      const localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
      const deletedIds = JSON.parse(localStorage.getItem('g3d_deleted_credit_requests') || '[]');
      
      let merged = [];
      if (!error && data) {
        merged = [...data];
      }
      
      for (const req of localRequests) {
        if (!merged.some((r: any) => r.id === req.id)) {
          merged.push(req);
        }
      }
      
      merged = merged.filter((r: any) => !deletedIds.includes(r.id));
      
      return merged.map((row: any) => ({
        ...row,
        comprobante_url: row.comprobante_url || row.detalles?.comprobante_url || null,
        motivo_rechazo: row.motivo_rechazo || row.detalles?.motivo_rechazo || null
      }));
    } catch (err) {
      console.warn("getIptvCreditRequests error, falling back to local:", err);
      const localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
      const deletedIds = JSON.parse(localStorage.getItem('g3d_deleted_credit_requests') || '[]');
      return localRequests
        .filter((r: any) => !deletedIds.includes(r.id))
        .map((row: any) => ({
          ...row,
          comprobante_url: row.comprobante_url || row.detalles?.comprobante_url || null,
          motivo_rechazo: row.motivo_rechazo || row.detalles?.motivo_rechazo || null
        }));
    }
  },

  async createIptvCreditRequest(req: any) {
    const detalles = {
      ...(req.detalles || {}),
      comprobante_url: req.comprobante_url || null
    };
    const payload: any = {
      id: req.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
      reseller_usuario: req.reseller_usuario.trim().toLowerCase(),
      tipo_solicitud: req.tipo_solicitud,
      cantidad_creditos: req.cantidad_creditos || 0,
      detalles: detalles,
      estado: 'pendiente',
      creado_al: new Date().toISOString()
    };
    
    const localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
    localRequests.push(payload);
    localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));
    
    try {
      const { data, error } = await supabase
        .from('iptv_creditos_solicitudes')
        .insert([payload])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (e: any) {
      console.warn("createIptvCreditRequest Supabase error, saved locally:", e.message || e);
      return { success: true, data: [payload], localOnly: true };
    }
  },

  async updateIptvCreditRequest(id: string, req: any) {
    const detalles = {
      ...(req.detalles || {}),
      comprobante_url: req.comprobante_url || null
    };
    const payload: any = {
      tipo_solicitud: req.tipo_solicitud,
      cantidad_creditos: req.cantidad_creditos || 0,
      detalles: detalles,
      estado: 'pendiente',
      actualizado_al: new Date().toISOString()
    };
    
    const localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
    const idx = localRequests.findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      localRequests[idx] = {
        ...localRequests[idx],
        ...payload,
        detalles: { ...localRequests[idx].detalles, ...detalles }
      };
      localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));
    } else {
      localRequests.push({
        id,
        ...payload,
        detalles
      });
      localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));
    }
    
    try {
      const { data, error } = await supabase
        .from('iptv_creditos_solicitudes')
        .update(payload)
        .eq('id', id)
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (e: any) {
      console.warn("updateIptvCreditRequest Supabase error, updated locally:", e.message || e);
      return { success: true, localOnly: true };
    }
  },

  async deleteIptvCreditRequest(id: string) {
    const deletedIds = JSON.parse(localStorage.getItem('g3d_deleted_credit_requests') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('g3d_deleted_credit_requests', JSON.stringify(deletedIds));
    }
    
    let localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
    localRequests = localRequests.filter((r: any) => r.id !== id);
    localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));

    try {
      const { error } = await supabase
        .from('iptv_creditos_solicitudes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.warn("deleteIptvCreditRequest Supabase error, deleted locally:", e.message || e);
      return { success: true, localOnly: true };
    }
  },

  async updateIptvCreditRequestStatus(id: string, status: 'aprobado' | 'rechazado', procesado_por: string, motivo_rechazo?: string, nuevos_detalles?: any) {
    const localRequests = JSON.parse(localStorage.getItem('g3d_local_credit_requests') || '[]');
    const idx = localRequests.findIndex((r: any) => r.id === id);
    const updateLocal = (existing: any) => {
      const details = {
        ...(existing?.detalles || {}),
        ...(nuevos_detalles || {})
      };
      if (motivo_rechazo !== undefined) {
        details.motivo_rechazo = motivo_rechazo;
      }
      return {
        ...existing,
        estado: status,
        procesado_por,
        detalles: details,
        actualizado_al: new Date().toISOString()
      };
    };

    if (idx !== -1) {
      localRequests[idx] = updateLocal(localRequests[idx]);
      localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));
    } else {
      localRequests.push(updateLocal({ id }));
      localStorage.setItem('g3d_local_credit_requests', JSON.stringify(localRequests));
    }

    let existingDetails = {};
    try {
      const { data: existing } = await supabase
        .from('iptv_creditos_solicitudes')
        .select('detalles')
        .eq('id', id)
        .single();
      if (existing?.detalles) {
        existingDetails = existing.detalles;
      }
    } catch (e) {
      console.warn("No se pudieron recuperar los detalles previos de la solicitud:", e);
    }

    const detalles = {
      ...existingDetails,
      ...(nuevos_detalles || {})
    };
    if (motivo_rechazo !== undefined) {
      detalles.motivo_rechazo = motivo_rechazo;
    }

    const updatePayload: any = { 
      estado: status, 
      procesado_por,
      detalles,
      actualizado_al: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('iptv_creditos_solicitudes')
        .update(updatePayload)
        .eq('id', id)
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (e: any) {
      console.warn("updateIptvCreditRequestStatus Supabase error, updated locally:", e.message || e);
      return { success: true, localOnly: true };
    }
  },

  // ==========================================
  // CHOP TEMPLATES / PLANTILLAS DATABASE ENGINE
  // ==========================================
  async getChopPlantillas() {
    try {
      const { data, error } = await supabase
        .from('g3d_chop_plantillas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (e: any) {
      console.warn("getChopPlantillas error (maybe table not created yet):", e.message || e);
      return { success: false, error: e.message || e };
    }
  },

  async saveChopPlantilla(plantilla: any) {
    try {
      const payload = {
        nombre: plantilla.name,
        selected_tope: plantilla.selectedTope,
        selected_cuerpo: plantilla.selectedCuerpo,
        selected_mango: plantilla.selectedMango,
        selected_base: plantilla.selectedBase,
        color_tope: plantilla.colorTope,
        color_cuerpo: plantilla.colorCuerpo,
        color_mango: plantilla.colorMango,
        color_bands: plantilla.colorBands || [],
        embossed_text: plantilla.embossedText || '',
        text_depth_mode: plantilla.textDepthMode || 'embossed',
        text_color: plantilla.textColor || '#ffffff',
        text_size: plantilla.textSize || 42,
        text_rotation: plantilla.textRotation || 0,
        logo_image: plantilla.logoImage || null,
        created_at: new Date().toISOString()
      };

      let query;
      if (plantilla.db_id) {
        query = supabase
          .from('g3d_chop_plantillas')
          .update(payload)
          .eq('id', plantilla.db_id);
      } else {
        query = supabase
          .from('g3d_chop_plantillas')
          .insert([payload]);
      }

      const { data, error } = await query.select();
      if (error) throw error;
      return { success: true, data: data?.[0] };
    } catch (e: any) {
      console.error("saveChopPlantilla error:", e.message || e);
      return { success: false, error: e.message || e };
    }
  },

  async deleteChopPlantilla(id: string) {
    try {
      const { error } = await supabase
        .from('g3d_chop_plantillas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error("deleteChopPlantilla error:", e.message || e);
      return { success: false, error: e.message || e };
    }
  },

  async getRespuestasRapidas() {
    try {
      const local = localStorage.getItem('g3d_respuestas_rapidas');
      if (local) {
        return { success: true, data: JSON.parse(local) };
      }
      return { success: true, data: [] };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  },

  async saveRespuestaRapida(respuesta: any) {
    try {
      const local = JSON.parse(localStorage.getItem('g3d_respuestas_rapidas') || '[]');
      let updated = [];
      if (respuesta.id) {
        updated = local.map((r: any) => r.id === respuesta.id ? { ...r, ...respuesta } : r);
      } else {
        const newObj = { ...respuesta, id: 'rr-' + Date.now() };
        updated = [newObj, ...local];
      }
      localStorage.setItem('g3d_respuestas_rapidas', JSON.stringify(updated));
      return { success: true, data: respuesta };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  },

  async deleteRespuestaRapida(id: string) {
    try {
      const local = JSON.parse(localStorage.getItem('g3d_respuestas_rapidas') || '[]');
      const updated = local.filter((r: any) => r.id !== id);
      localStorage.setItem('g3d_respuestas_rapidas', JSON.stringify(updated));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }
};

export interface IptvCostoProveedor {
  id?: string;
  proveedor: string;
  plan: string;
  precio: number;
  creditos: number;
  link?: string;
  fecha_creacion?: string;
}


