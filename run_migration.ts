import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
// Usamos anon key, pero si RLS está activo podría fallar.
// Intentemos ver si poemos migrar mediante SQL function o RPC, 
// o simplemente copiando los datos:
const supabase = createClient(url, key);

async function migrate() {
    console.log("Leyendo pedidos_old...");
    const { data: oldOrders, error: oldError } = await supabase.from('pedidos_old').select('*');
    if (oldError) {
        console.error("Error leyendo pedidos_old:", oldError);
        return;
    }
    console.log(`Se encontraron ${oldOrders?.length} pedidos en pedidos_old.`);

    if (!oldOrders || oldOrders.length === 0) return;

    console.log("Insertando en pedidos...");
    for (const old of oldOrders) {
        
        let estadoId = null;
        if (old.estado_pedido) {
            const { data: est, error: estErr } = await supabase
                .from('diccionario_estados_pedido')
                .select('id')
                .ilike('nombre_estado', old.estado_pedido)
                .maybeSingle();
            
            if (est) estadoId = est.id;
        }

        const { data: newOrder, error: insErr } = await supabase.from('pedidos').insert([{
            codigo_pedido: old.id_pedido,
            cliente_nombre_temporal: old.cliente_nombre,
            cliente_telefono_temporal: old.cliente_telefono,
            vendedor_temporal: old.vendedor,
            fecha_creacion: old.fecha_creacion,
            fecha_entrega: old.fecha_entrega,
            tipo_trabajo: old.tipo_trabajo,
            monto_total: old.precio_total,
            monto_pagado: old.total_pagado,
            delivery_min: old.delivery_min,
            delivery_max: old.delivery_max,
            lat: old.lat,
            lng: old.lng,
            estado_id: estadoId
        }]).select('id').maybeSingle();

        if (insErr) {
            console.error("Error al insertar en pedidos:", old.id_pedido, insErr.message);
        } else if (newOrder) {
            console.log("Insertado pedido:", old.id_pedido, "con ID UUID:", newOrder.id);
            
            // Insertar item
            const { error: itemErr } = await supabase.from('pedido_items').insert([{
                pedido_id: newOrder.id,
                descripcion_custom: old.descripcion || 'Sin descripción',
                cantidad: old.cantidad || 1,
                precio_unitario: (old.precio_total || 0) / (old.cantidad || 1)
            }]);
            
            if (itemErr) {
                console.error("Error al insertar item:", itemErr.message);
            }
        }
    }
    console.log("Migración completada.");
}

migrate();
