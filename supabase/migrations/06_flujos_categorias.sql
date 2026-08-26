-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: CATEGORÍAS Y FLUJOS DE PRODUCCIÓN
-- =========================================================================

-- 1. TABLA: categorias (si no existe del script anterior)
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    icon_name TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: flujos (Los flujos de producción, ej. Impresión Básica, Premium)
CREATE TABLE IF NOT EXISTS public.flujos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: flujo_categorias (Relación: a qué categorías aplica un flujo)
CREATE TABLE IF NOT EXISTS public.flujo_categorias (
    flujo_id UUID NOT NULL REFERENCES public.flujos(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (flujo_id, categoria_id)
);

-- 4. TABLA: flujo_estados (Los pasos que conforman el flujo, ordenados)
CREATE TABLE IF NOT EXISTS public.flujo_estados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flujo_id UUID NOT NULL REFERENCES public.flujos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    step_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DESHABILITACIÓN EXPRESA DE RLS (SEGURIDAD) PARA DESARROLLO FLUIDO
-- =========================================================================
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flujos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flujo_categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flujo_estados DISABLE ROW LEVEL SECURITY;
