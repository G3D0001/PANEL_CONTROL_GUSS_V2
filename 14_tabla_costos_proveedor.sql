-- ====================================================================
-- SCRIPT DE MIGRACIÓN: CREACIÓN DE TABLA PARA COSTOS DE PROVEEDORES (IPTV)
-- COPIAR Y PEGAR ESTO EN EL EDITOR SQL DE SUPABASE
-- GRUPO ALFABÉTICO REGLA 20: PREFIJO 'iptv_'
-- ====================================================================

-- 1. Crear la tabla de costos de proveedor con UUID
CREATE TABLE IF NOT EXISTS iptv_costos_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor VARCHAR(255) NOT NULL,
  plan VARCHAR(255) NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  creditos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Habilitar la replicación de datos en tiempo real en Supabase para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_costos_proveedor;

-- 3. Otorgar permisos de lectura y escritura para el rol público
GRANT ALL ON TABLE iptv_costos_proveedor TO anon, authenticated, service_role;
