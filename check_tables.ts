import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
    const { data: cols, error: errCols } = await supabase.from('pedidos_old').select('id_pedido, estado_pedido');
    const { data: dict } = await supabase.from('diccionario_estados_pedido').select('*');
    
    if (cols && dict) {
        let count = 0;
        for (const order of cols) {
             const matchingDict = dict.find(d => d.nombre_estado.toLowerCase().trim() === (order.estado_pedido || '').toLowerCase().trim());
             if (matchingDict) {
                 const { error } = await supabase.from('pedidos').update({ estado_id: matchingDict.id }).eq('codigo_pedido', order.id_pedido);
                 if (error) {
                     console.error("error:", error);
                 } else {
                     count++;
                 }
             }
        }
        console.log(`Updated ${count} orders`);
    }
}
run();
