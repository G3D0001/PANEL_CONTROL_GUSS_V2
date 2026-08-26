import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    const { data: cols, error: errCols } = await supabase.from('pedidos').select('*, estado:estado_id(*), items:pedido_items(*)').limit(5);
    console.log("pedidos:", JSON.stringify(cols, null, 2), errCols?.message);
}
run();
