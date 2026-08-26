-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: PRODUCTOS, VARIANTES Y NEGOCIOS
-- =========================================================================
-- NOTA: Se ha deshabilitado el Row Level Security (RLS) según tu solicitud 
-- para evitar bloqueos durante el desarrollo de la aplicación.
-- =========================================================================

-- 1. TABLA: categorias (Opcional, si queremos migrar la falsa a base de datos real)
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    icon_name TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: productos (Reemplaza a insumos y centraliza la información)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Vinculación al negocio/usuario (De perfiles_locales)
    negocio_id UUID REFERENCES public.perfiles_locales(id) ON DELETE CASCADE,
    
    -- Información Principal
    nombre TEXT NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    categoria_texto TEXT, -- Como respaldo si no usan tabla relacional
    estado TEXT DEFAULT 'Activo',
    publicado BOOLEAN DEFAULT true,
    
    -- Descripciones y textos
    descripcion TEXT, -- Uso interno/administrativo
    instrucciones_internas TEXT, -- Exclusivo admin/producción
    detalle_cliente TEXT, -- Visible en tienda online
    
    -- Imágenes (Se guarda un array de URLs de Supabase Storage)
    imagenes TEXT[] DEFAULT '{}',
    
    -- Precios y Stock Globales (Se usan SOLO si el producto NO tiene variantes)
    precio_base NUMERIC DEFAULT 0,
    stock_global INTEGER DEFAULT 0,
    minimo_alerta INTEGER DEFAULT 0,
    
    -- Modalidad de Entrega / Logística
    modalidad TEXT DEFAULT 'inmediata', -- 'inmediata' o 'produccion'
    delivery_min INTEGER DEFAULT 1,
    delivery_max INTEGER DEFAULT 3,
    
    -- Opciones de Envío
    envio_propio BOOLEAN DEFAULT false,
    costo_envio NUMERIC DEFAULT 0,
    zona_cobertura TEXT,
    envio_uber BOOLEAN DEFAULT false,
    envio_uber_moto BOOLEAN DEFAULT false,
    envio_uber_auto BOOLEAN DEFAULT false,
    
    -- Métodos de Pago y Seña
    pago_transferencia BOOLEAN DEFAULT true,
    pago_efectivo BOOLEAN DEFAULT false,
    requiere_sena BOOLEAN DEFAULT false,
    sena_porcentaje INTEGER DEFAULT 50,
    sena_tolerancia_dias INTEGER DEFAULT 15,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: producto_atributos (Sirve para saber qué ejes tiene la matriz ej: Color, Talle)
CREATE TABLE IF NOT EXISTS public.producto_atributos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL, -- ej. "Color", "Talle"
    valores TEXT[] NOT NULL DEFAULT '{}' -- ej. '{"Rojo", "Azul"}'
);

-- 4. TABLA: producto_variantes (Los SKUs reales, las combinaciones de los atributos)
CREATE TABLE IF NOT EXISTS public.producto_variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    
    -- Json que guarda la mezcla exacta. Ej: {"Color": "Rojo", "Talle": "XL"}
    combinacion JSONB NOT NULL DEFAULT '{}',
    
    precio NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    minimo_alerta INTEGER DEFAULT 0,
    imagen_idx INTEGER, -- Índice de la imagen principal del producto que le corresponde
    sku TEXT, -- Código interno por variante (Opcional)

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DESHABILITACIÓN EXPRESA DE RLS (SEGURIDAD) PARA DESARROLLO FLUIDO
-- =========================================================================

ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_atributos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes DISABLE ROW LEVEL SECURITY;

-- Nota: Si usabas anteriormente "insumos", esa tabla la dejaremos intacta
-- como respaldo, pero React empezará a conectarse a estas nuevas tablas
-- cuando hagamos la integración.
