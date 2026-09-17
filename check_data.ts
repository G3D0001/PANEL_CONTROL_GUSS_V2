import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('iptv_clientes').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Columns of iptv_clientes:", Object.keys(data[0] || {}));
    }
}
check();
