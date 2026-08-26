import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  // Estados disponibles
  const { data: estados } = await supabase.from('diccionario_estados_pedido').select('id, nombre_estado, nivel_prioridad').order('nivel_prioridad');
  console.log('ESTADOS:', estados?.map(e => e.nombre_estado));

  // Muestra de pedidos con el join de estado (como getOrders)
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('codigo_pedido, monto_total, monto_pagado, saldo, fecha_creacion, cliente_nombre_temporal, estado:estado_id(nombre_estado)')
    .limit(48);

  let totalSaldo = 0;
  const kpis: Record<string, number> = {};
  const seenDebtors = new Set<string>();
  let debtors = 0;
  let sumaMontos = 0;
  (pedidos || []).forEach((p: any) => {
    const estado = p.estado?.nombre_estado || 'SIN ESTADO';
    kpis[estado] = (kpis[estado] || 0) + 1;
    const saldo = parseFloat(p.saldo) || 0;
    sumaMontos += parseFloat(p.monto_total) || 0;
    if (saldo > 0) {
      totalSaldo += saldo;
      const cliente = p.cliente_nombre_temporal || 'anon';
      if (!seenDebtors.has(cliente)) { debtors++; seenDebtors.add(cliente); }
    }
  });
  console.log('\nKPIs por estado (real):', kpis);
  console.log('Suma monto_total:', sumaMontos);
  console.log('Total saldo pendiente:', totalSaldo);
  console.log('Cantidad deudores:', debtors);
  console.log('Total pedidos:', pedidos?.length);
}
run().catch(e => console.error('FATAL', e));
