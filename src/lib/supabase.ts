import { createClient } from '@supabase/supabase-js';

// URL y Clave Pública reales de la base de datos Supabase del proyecto
const SUPABASE_PROJECT_URL = 'https://cpdkhdfyaanhoeutapnq.supabase.co';
const SUPABASE_PROJECT_KEY = 'sb_publishable_oGAtaRgPl-HjeliUj_ZCKg_h0zjzKM9';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || SUPABASE_PROJECT_KEY;

export const isOfflineMode = false;

// Cliente Supabase conectado directamente a producción
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

