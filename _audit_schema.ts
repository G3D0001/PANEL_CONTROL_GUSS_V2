import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

const tables = ['pedidos', 'insumos', 'proveedores', 'categories', 'pagos', 'diccionario_estados_pedido'];

async function run() {
  console.log('URL:', url ? 'OK' : 'MISSING', '| KEY:', key ? 'OK' : 'MISSING');
  for (const t of tables) {
    const { data, error, count } = await supabase
      .from(t)
      .select('*', { count: 'exact' })
      .limit(1);
    if (error) {
      console.log(`\n[${t}] ERROR: ${error.message}`);
      continue;
    }
    const cols = data && data[0] ? Object.keys(data[0]) : [];
    console.log(`\n[${t}] filas totales: ${count} | columnas (${cols.length}):`);
    console.log('  ' + cols.join(', '));
  }
}
run().catch(e => console.error('FATAL', e));
