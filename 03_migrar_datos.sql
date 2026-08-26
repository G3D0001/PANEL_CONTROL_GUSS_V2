-- =========================================================================================
-- MIGRACIÓN DE DATOS DESDE pedidos_old HACIA pedidos y pedido_items
-- =========================================================================================

-- 1. Insertamos las cabeceras de los pedidos
-- Como no tenemos ID de clientes/vendedores locales por ahora en pedidos_old, los dejamos NULL o los vinculamos si coinciden nombres.
-- Por seguridad y simplicidad, pasamos el "cliente_nombre", "vendedor", etc., como variables textuales en pedidos si fuera necesario, 
-- PERO nuestro nuevo esquema asume UUIDs. 
-- *NOTA: Si los clientes no existen como usuarios en perfiles_locales, no tendrán UUID.* 
-- Para no perder la info de texto plano, es recomendable agregar las columnas de respaldo en la nueva tabla (Temporalmente o definitivamente).

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cliente_nombre_temporal TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono_temporal TEXT,
ADD COLUMN IF NOT EXISTS vendedor_temporal TEXT;

INSERT INTO pedidos (
    codigo_pedido,
    cliente_nombre_temporal,
    cliente_telefono_temporal,
    vendedor_temporal,
    fecha_creacion,
    fecha_entrega,
    tipo_trabajo,
    monto_total,
    monto_pagado,
    estado_id,          -- NUEVO
    delivery_min,
    delivery_max,
    lat,
    lng
)
SELECT 
    po.id_pedido, -- e.g. G3D-13395171
    po.cliente_nombre,
    po.cliente_telefono,
    po.vendedor,
    po.fecha_creacion::timestamp with time zone,
    po.fecha_entrega::timestamp with time zone,
    po.tipo_trabajo,
    po.precio_total,
    po.total_pagado,
    (SELECT id FROM diccionario_estados_pedido dep WHERE dep.nombre_estado ILIKE po.estado_pedido LIMIT 1), -- ASIGNAR ESTADO
    po.delivery_min,
    po.delivery_max,
    po.lat,
    po.lng
FROM pedidos_old po
ON CONFLICT (codigo_pedido) DO NOTHING;

-- 2. Insertar los Items como un único item custom para no perder la descripción anterior
INSERT INTO pedido_items (
    pedido_id,
    descripcion_custom,
    cantidad,
    precio_unitario
)
SELECT 
    p.id,
    po.descripcion,
    po.cantidad,
    po.precio_total / NULLIF(po.cantidad, 0) -- Evitar división por cero
FROM pedidos p
JOIN pedidos_old po ON p.codigo_pedido = po.id_pedido
WHERE NOT EXISTS (
    SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id
);
