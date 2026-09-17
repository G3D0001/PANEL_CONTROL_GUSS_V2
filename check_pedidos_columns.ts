import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
    // Vamos a consultar un pedido de la base de datos para ver sus campos y valores actuales de monto_total, monto_pagado y saldo
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, codigo_pedido, monto_total, monto_pagado, saldo')
        .limit(5);

    if (error) {
        console.error("Error al consultar pedidos:", error);
        return;
    }

    console.log("Pedidos y sus montos/saldos:");
    pedidos?.forEach(p => {
        console.log(`ID: ${p.id}, Código: ${p.codigo_pedido}, Total: ${p.monto_total}, Pagado: ${p.monto_pagado}, Saldo: ${p.saldo}`);
    });
}
run();
