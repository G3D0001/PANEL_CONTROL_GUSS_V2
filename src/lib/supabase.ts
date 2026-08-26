import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isOfflineMode = !supabaseUrl || 
                             supabaseUrl.includes('placeholder-url') || 
                             !supabaseAnonKey || 
                             supabaseAnonKey.includes('placeholder-key');

if (isOfflineMode) {
  console.warn('⚠️ AVISO: La aplicación está funcionando en modo local offline (sin conexión a Supabase real).');
  console.info('👉 Para habilitar la persistencia en la nube, ve a Configuración (Settings) de AI Studio e ingresa las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

// Exportamos el cliente incluso si fallan las credenciales para evitar errores de importación descendente
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

