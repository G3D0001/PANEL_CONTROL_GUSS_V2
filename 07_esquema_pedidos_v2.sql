-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: PEDIDOS V2 (SISTEMA DE FACTURACIÓN Y PRODUCCIÓN)
-- =========================================================================
-- NOTA: Se ha deshabilitado el Row Level Security (RLS) según tu solicitud 
-- para evitar bloqueos durante el desarrollo de la aplicación.
-- =========================================================================

-- TABLA: pedidos_v2 (Estructura relacional de pedidos de segunda generación)
CREATE TABLE IF NOT EXISTS public.pedidos_v2 (
    id TEXT PRIMARY KEY,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT,
    cliente_direccion TEXT,
    canal TEXT DEFAULT 'tienda', -- 'tienda' o 'revendedor'
    revendedor_nombre TEXT,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    variante_id UUID REFERENCES public.producto_variantes(id) ON DELETE SET NULL,
    variante_nombre TEXT,
    cantidad INTEGER DEFAULT 1,
    precio_unitario NUMERIC DEFAULT 0,
    precio_total NUMERIC DEFAULT 0,
    comision_plataforma NUMERIC DEFAULT 0,
    comision_influencer NUMERIC DEFAULT 0,
    modalidad TEXT DEFAULT 'inmediata', -- 'inmediata' o 'produccion'
    requiere_sena BOOLEAN DEFAULT false,
    sena_monto NUMERIC DEFAULT 0,
    sena_pagada BOOLEAN DEFAULT false,
    estado_pago TEXT DEFAULT 'pendiente', -- 'pendiente', 'señado', 'pagado_total'
    estado_produccion TEXT DEFAULT 'no_aplica', -- 'no_aplica', 'pendiente_diseno', 'en_cola', 'laminando', 'imprimiendo', 'post_procesado', 'listo_taller'
    estado_envio TEXT DEFAULT 'retiro_local', -- 'retiro_local', 'pendiente_flete', 'en_camino', 'entregado', 'cancelado'
    flete_tipo TEXT DEFAULT 'retiro', -- 'propio', 'uber_moto', 'uber_auto', 'retiro'
    flete_costo NUMERIC DEFAULT 0,
    flete_cobertura TEXT,
    fecha_entrega_estimada TIMESTAMPTZ,
    instrucciones_operario TEXT,
    drive_stl_link TEXT,
    creado_el TIMESTAMPTZ DEFAULT NOW(),
    vendedor_id UUID REFERENCES public.perfiles_locales(id) ON DELETE SET NULL
);

-- Deshabilitar RLS para agilizar enlazados durante desarrollo
ALTER TABLE public.pedidos_v2 DISABLE ROW LEVEL SECURITY;
