-- ====================================================================
-- SCRIPT DE MIGRACIÓN: AGREGAR COMISIÓN DE VENDEDOR Y COMISIÓN DE REFERENTE
-- TABLA: iptv_planes_venta
-- COPIAR Y PEGAR ESTO EN EL EDITOR SQL DE SUPABASE
-- REGLA DE ORO #20: TABLAS CON PREFIJO 'iptv_'
-- ====================================================================

-- 1. Agregar las nuevas columnas comision_vendedor y comision_referente si no existen
ALTER TABLE iptv_planes_venta 
ADD COLUMN IF NOT EXISTS comision_vendedor NUMERIC(10,2) DEFAULT 0.00;

ALTER TABLE iptv_planes_venta 
ADD COLUMN IF NOT EXISTS comision_referente NUMERIC(10,2) DEFAULT 0.00;

-- 2. Migrar datos existentes: Si ya existía comision, inicializar comision_vendedor con ese valor
UPDATE iptv_planes_venta
SET comision_vendedor = COALESCE(comision, 0.00)
WHERE (comision_vendedor IS NULL OR comision_vendedor = 0.00) AND comision IS NOT NULL AND comision > 0;

-- 3. Asegurar que los permisos permanezcan asignados
GRANT ALL ON TABLE iptv_planes_venta TO anon, authenticated, service_role;
