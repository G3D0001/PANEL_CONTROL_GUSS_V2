import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
    // 1. Obtener un pedido real
    const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, codigo_pedido, monto_total, monto_pagado, saldo')
        .limit(1);

    if (!pedidos || pedidos.length === 0) {
        console.error("No hay pedidos reales.");
        return;
    }

    const o = pedidos[0];
    console.log("Pedido seleccionado para prueba:", o);

    // 2. Simular addPayment
    console.log("Insertando pago de prueba...");
    const idPago = `TEST-ADD-${Date.now()}`;
    const newPayment = {
        id_pago: idPago,
        id_pedido: o.codigo_pedido,
        monto: 50,
        tipo_pago: 'Efectivo',
        observaciones: 'Prueba desde script',
        fecha: new Date().toISOString()
    };

    const { error: insertError } = await supabase
        .from('pagos')
        .insert([newPayment]);

    if (insertError) {
        console.error("❌ Falló inserción en 'pagos':", insertError);
        return;
    }
    console.log("✅ Inserción exitosa en 'pagos'");

    // Obtener todos los pagos para este pedido para calcular el total
    const { data: todosLosPagos } = await supabase
        .from('pagos')
        .select('monto')
        .eq('id_pedido', o.codigo_pedido);

    const totalPagado = (todosLosPagos || []).reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
    console.log("Total pagado acumulado calculado en la nube:", totalPagado);

    // Actualizar pedidos
    const { error: updateError } = await supabase
        .from('pedidos')
        .update({
            monto_pagado: totalPagado
        })
        .eq('codigo_pedido', o.codigo_pedido);

    if (updateError) {
        console.error("❌ Falló actualización de monto_pagado en 'pedidos':", updateError);
    } else {
        console.log("✅ Actualización exitosa en 'pedidos'");
    }

    // Consultar después de la prueba
    const { data: pDespues } = await supabase
        .from('pedidos')
        .select('id, codigo_pedido, monto_total, monto_pagado, saldo')
        .eq('id', o.id)
        .single();

    console.log("Pedido después de addPayment:", pDespues);

    // Limpieza
    await supabase.from('pagos').delete().eq('id_pago', idPago);
}
run();
