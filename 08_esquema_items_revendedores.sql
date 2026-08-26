-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: ÍTEMS DE REVENDEDORES (CATÁLOGO DE USUARIOS)
-- =========================================================================
-- NOTA: Se ha deshabilitado el Row Level Security (RLS) para posibilitar
-- la sincronización instantánea y directa desde el panel de control.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.items_revendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    categoria TEXT,
    precio NUMERIC DEFAULT 0,
    precio_con_iva NUMERIC DEFAULT 0,
    precio_efectivo NUMERIC DEFAULT 0,
    precio_transferencia NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    stock_tipo TEXT DEFAULT 'fijo', -- 'fijo' (Entrega inmediata) o 'produccion' (Bajo pedido)
    dias_produccion_min INTEGER DEFAULT 0,
    dias_produccion_max INTEGER DEFAULT 0,
    imagenes TEXT[], -- Array de URLs de la galería
    link_drive TEXT,
    link_stl TEXT,
    instrucciones_internas TEXT,
    estado TEXT DEFAULT 'activo', -- 'activo' (Publicado), 'pausado', 'sin_stock'
    revendedor_id UUID REFERENCES public.perfiles_locales(id) ON DELETE CASCADE,
    creado_el TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para agilizar enlazados durante desarrollo
ALTER TABLE public.items_revendedores DISABLE ROW LEVEL SECURITY;
