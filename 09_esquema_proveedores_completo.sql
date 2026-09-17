-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: COLUMNAS DE PROVEEDORES COMPLETO (S/RLS)
-- =========================================================================
-- Añade soporte para geolocalización, IVA, descuentos e ítems del catálogo
-- directamente en la tabla de proveedores para máxima persistencia.
-- =========================================================================

-- Añadir columnas a proveedores si no existen
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS gps_lat TEXT;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS gps_lng TEXT;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS items_provee JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS discount_rules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS emite_factura BOOLEAN DEFAULT false;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS iva_incluido BOOLEAN DEFAULT false;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS descuento_efectivo NUMERIC DEFAULT 0;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS descuento_transferencia NUMERIC DEFAULT 0;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS last_updated TEXT;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS importado_ocr BOOLEAN DEFAULT false;

-- Deshabilitar políticas RLS si existen para agilizar enlazados durante el desarrollo
ALTER TABLE public.proveedores DISABLE ROW LEVEL SECURITY;
