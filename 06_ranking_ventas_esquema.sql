-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: RANKING DE VENTAS Y AUTO-LIMPIEZA A 90 DÍAS
-- =========================================================================
-- Este script define la tabla para registrar las estadísticas de venta
-- de productos y negocios con un mecanismo de poda automática para
-- mantener solo los últimos 90 días en almacenamiento permanente.
-- =========================================================================

-- 1. Crear tabla de Registro de Ventas para Rankings
CREATE TABLE IF NOT EXISTS public.ranking_ventas_90dias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
    negocio_id UUID REFERENCES public.perfiles_locales(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deshabilitar RLS temporalmente según solicitud para desarrollo fluido
ALTER TABLE public.ranking_ventas_90dias DISABLE ROW LEVEL SECURITY;

-- 2. Crear función de auto-limpieza permanente (mantiene solo los últimos 90 días)
CREATE OR REPLACE FUNCTION public.limpiar_ranking_ventas_90dias()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.ranking_ventas_90dias 
    WHERE fecha < NOW() - INTERVAL '90 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger de ejecución automática post-inserción
DROP TRIGGER IF EXISTS trigger_limpiar_ranking_ventas ON public.ranking_ventas_90dias;
CREATE TRIGGER trigger_limpiar_ranking_ventas
AFTER INSERT ON public.ranking_ventas_90dias
FOR EACH STATEMENT
EXECUTE FUNCTION public.limpiar_ranking_ventas_90dias();
