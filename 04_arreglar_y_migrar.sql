-- Deshabilitar la seguridad RLS temporalmente
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items DISABLE ROW LEVEL SECURITY;

-- Asegurarse de tener las columnas temporales
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS cliente_nombre_temporal TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono_temporal TEXT,
ADD COLUMN IF NOT EXISTS vendedor_temporal TEXT;

-- Migrar cabeceras
INSERT INTO public.pedidos (
    codigo_pedido,
    cliente_nombre_temporal,
    cliente_telefono_temporal,
    vendedor_temporal,
    fecha_creacion,
    fecha_entrega,
    tipo_trabajo,
    monto_total,
    monto_pagado,
    estado_id,
    delivery_min,
    delivery_max,
    lat,
    lng
)
SELECT 
    po.id_pedido, 
    po.cliente_nombre,
    po.cliente_telefono,
    po.vendedor,
    po.fecha_creacion::timestamp with time zone,
    po.fecha_entrega::timestamp with time zone,
    po.tipo_trabajo,
    po.precio_total,
    po.total_pagado,
    (SELECT id FROM public.diccionario_estados_pedido dep WHERE dep.nombre_estado ILIKE po.estado_pedido LIMIT 1),
    po.delivery_min,
    po.delivery_max,
    po.lat,
    po.lng
FROM public.pedidos_old po
ON CONFLICT (codigo_pedido) DO NOTHING;

-- Migrar items
INSERT INTO public.pedido_items (
    pedido_id,
    descripcion_custom,
    cantidad,
    precio_unitario
)
SELECT 
    p.id,
    po.descripcion,
    po.cantidad,
    po.precio_total / NULLIF(po.cantidad, 0)
FROM public.pedidos p
JOIN public.pedidos_old po ON p.codigo_pedido = po.id_pedido
WHERE NOT EXISTS (
    SELECT 1 FROM public.pedido_items pi WHERE pi.pedido_id = p.id
);

-- Rehabilitar RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para poder usar la app de una vez sin que joda el RLS
DROP POLICY IF EXISTS "Permitir todo - Pedidos" ON public.pedidos;
CREATE POLICY "Permitir todo - Pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo - Items" ON public.pedido_items;
CREATE POLICY "Permitir todo - Items" ON public.pedido_items FOR ALL USING (true) WITH CHECK (true);
