-- Script Definitivo: Sincronización y Seguridad para perfiles_locales y configuracion_sistema
-- 1. ASEGURAR ESTRUCTURA DE LA TABLA perfiles_locales
-- OJO: ESTAMOS USANDO auth.users(id) DIRECTAMENTE.
CREATE TABLE IF NOT EXISTS public.perfiles_locales (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  nombre TEXT,
  rol TEXT DEFAULT 'Usuario',
  avatar_url TEXT,
  foto_perfil TEXT,
  logo_negocio TEXT,
  nombre_negocio TEXT,
  direccion_negocio TEXT,
  direccion_hogar TEXT,
  telefono_contacto TEXT,
  datos_adicionales JSONB DEFAULT '{}'::jsonb,
  referencia_personal TEXT,
  lat_personal NUMERIC,
  lng_personal NUMERIC,
  logo_url TEXT,
  telefono_negocio TEXT,
  email_negocio TEXT,
  referencia_negocio TEXT,
  lat_negocio NUMERIC,
  lng_negocio NUMERIC,
  ciudad TEXT,
  provincia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existía, asegurarse de que ID es foreign key a auth.users (si falla, avísame, puede que haya IDs q no existen en auth.users)
-- Evita agregar constraints si ya existen.
-- ALTER TABLE public.perfiles_locales ADD CONSTRAINT perfiles_locales_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. TRIGGER MAGICO: Cada vez que un usuario se registra, se crea su perfil vacío
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_locales (id, email, nombre, rol, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'rol', 'Usuario'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atar el trigger a la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. ASEGURAR ESTRUCTURA DE LA TABLA configuracion_sistema
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  id INT PRIMARY KEY DEFAULT 1,
  dias_validez_link INT DEFAULT 15,
  whatsapp_contacto TEXT,
  logo_principal TEXT,
  color_primario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla vieja tenia una columna "datos" requerida, le quitamos la restricción
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracion_sistema' AND column_name='datos') THEN
    ALTER TABLE public.configuracion_sistema ALTER COLUMN datos DROP NOT NULL;
  END IF;
END $$;

-- Asegurar al menos la fila 1 en configuracion_sistema
INSERT INTO public.configuracion_sistema (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. RESET DE POLITICAS (RLS) PARA QUE TODO FUNCIONE SIN BLOQUEOS
ALTER TABLE public.perfiles_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Limpiar politicas viejas
DROP POLICY IF EXISTS "Permitir select a todos" ON public.perfiles_locales;
DROP POLICY IF EXISTS "Permitir update a dueños" ON public.perfiles_locales;
DROP POLICY IF EXISTS "Permitir insert" ON public.perfiles_locales;
DROP POLICY IF EXISTS "Permitir delete a dueños" ON public.perfiles_locales;
DROP POLICY IF EXISTS "Acceso total config" ON public.configuracion_sistema;

-- Crear Politicas Seguras y Funcionales:
-- Los usuarios autenticados pueden ver todos los perfiles locales (útil para el panel)
CREATE POLICY "Permitir select a todos" 
ON public.perfiles_locales FOR SELECT 
USING (true);

-- Un usuario SOLAMENTE puede modificar su propio registro (usando su ID inmutable de la db auth.users)
CREATE POLICY "Permitir update a dueños" 
ON public.perfiles_locales FOR UPDATE 
USING (auth.uid() = id);

-- La inserción ahora es automática por el trigger. La App NUNCA inserta un usuario directo a esta tabla, solo Supabase Auth lo hace.
CREATE POLICY "Permitir insert" 
ON public.perfiles_locales FOR INSERT 
WITH CHECK (false); -- Bloqueado desde el frontend

-- Un usuario puede eliminar su propio registro
CREATE POLICY "Permitir delete a dueños" 
ON public.perfiles_locales FOR DELETE 
USING (auth.uid() = id);

-- Configuracion global publica
CREATE POLICY "Acceso total config" 
ON public.configuracion_sistema FOR ALL 
USING (true);

-- EXTRA: Migrar usuarios existentes de auth.users a perfiles_locales por si quedaron huerfanos:
INSERT INTO public.perfiles_locales (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
