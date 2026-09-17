-- =========================================================================
-- PARCHE DE BASE DE DATOS: CORRECCIÓN DE CONSTRAINT DE PAGOS V1
-- =========================================================================
-- ESTO RESUELVE EL ERROR: "insert or update on table "pagos" violates foreign key constraint "pagos_id_pedido_fkey""
--
-- CAUSA: Durante la normalización del esquema de pedidos a V1 (02_schema_pedidos.sql), 
-- la tabla original 'pedidos' fue renombrada a 'pedidos_old'. Como consecuencia, de manera 
-- automática Postgres apuntó la constraint 'pagos_id_pedido_fkey' de la tabla 'pagos' hacia 'pedidos_old.id_pedido'. 
-- Al registrar pagos para pedidos nuevos (que se guardan directamente en la nueva tabla estructurada 
-- 'pedidos'), el motor fallaba porque el código no existía en 'pedidos_old'.
-- =========================================================================

-- 1. Primero, eliminamos cualquier pago huérfano que no exista en la nueva tabla 'pedidos' (cabecera).
-- Esto asegura que al recrear la clave foránea no haya colisiones de integridad.
DELETE FROM public.pagos 
WHERE id_pedido NOT IN (
    SELECT codigo_pedido FROM public.pedidos
);

-- 2. Eliminamos la clave foránea desactualizada que aún apuntaba a 'pedidos_old'.
ALTER TABLE public.pagos 
DROP CONSTRAINT IF EXISTS pagos_id_pedido_fkey;

-- 3. Creamos la nueva clave foránea que enlaza el código de pedido almacenado en 'pagos.id_pedido' 
-- directamente con 'pedidos.codigo_pedido' (TEXT) de forma robusta e integrada.
ALTER TABLE public.pagos
ADD CONSTRAINT pagos_id_pedido_fkey 
FOREIGN KEY (id_pedido) 
REFERENCES public.pedidos(codigo_pedido) 
ON DELETE CASCADE;

-- ¡Listo! Ahora los pagos de Pedidos V1 se asentarán correctamente y en paralelo con Pedidos v2.
