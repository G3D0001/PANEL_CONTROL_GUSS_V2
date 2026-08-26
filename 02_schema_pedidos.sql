-- =========================================================================================
-- MIGRACIÓN DE ESQUEMA DE PEDIDOS (NORMALIZACIÓN)
-- =========================================================================================

-- 1. Renombramos la tabla vieja para no perder ningún dato (Backup automático).
ALTER TABLE IF EXISTS public.pedidos RENAME TO pedidos_old;

-- 2. Creamos la nueva tabla de Pedidos Generales (Cabecera)
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido TEXT UNIQUE NOT NULL,

    -- Claves foráneas reales al perfil
    cliente_id UUID REFERENCES public.perfiles_locales(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES public.perfiles_locales(id) ON DELETE SET NULL,
    
    -- Relación al diccionario de estados
    estado_id UUID REFERENCES public.diccionario_estados_pedido(id) ON DELETE SET NULL,
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    
    tipo_trabajo TEXT,
    notas_tecnicas TEXT[],
    
    monto_total NUMERIC DEFAULT 0,
    monto_pagado NUMERIC DEFAULT 0,
    -- Generado automáticamente, cero margen de error
    saldo NUMERIC GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
    
    delivery_min INTEGER,
    delivery_max INTEGER,
    lat NUMERIC,
    lng NUMERIC
);

-- Habilitar Seguridad RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 3. Creamos la tabla de Detalles (Los productos/insumos dentro del pedido)
CREATE TABLE public.pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    insumo_id UUID REFERENCES public.insumos(id) ON DELETE SET NULL, -- Puede ser null si es 100% custom

    descripcion_custom TEXT NOT NULL, 
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC NOT NULL DEFAULT 0,
    
    subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- Habilitar Seguridad RLS
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

-- 4. Adaptar políticas básicas para pruebas (Luego las endurecemos)
CREATE POLICY "Permitir todo a usuarios logueados (Prueba temporal) - Pedidos" ON public.pedidos FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir todo a usuarios logueados (Prueba temporal) - Items" ON public.pedido_items FOR ALL USING (auth.uid() IS NOT NULL);

-- NOTA: Como la app está en modo de actualización masiva, recomiendo ejecutar esto
-- para limpiar la estructura. Los pedidos viejos quedaron guardados en "pedidos_old".
