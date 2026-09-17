# Esquema de Supabase (Fuente de la Verdad)

Este archivo mantiene el registro exacto de cómo están estructuradas las tablas en Supabase actualmente, basado en la información real extraída mediante comprobaciones. Sirve como memoria de la IA para que NUNCA deduzca campos que no existen.

## PROTOCOLO ESTRICTO DE MODIFICACIÓN SQL
1. **NUNCA alterar React primero:** Si se necesita modificar la base (ej. normalizar pedidos), el Agente DEBE proveer el código `.sql` necesario.
2. **Esperar Confirmación:** El Agente hará una pausa y ESPERARÁ a que el usuario confirme "SQL EJECUTADO Y OK".
3. **Reporte de Error:** Si el usuario indica un error en el SQL, el Agente pedirá el reporte (si falla), y reajustará su lógica SQL antes de tocar Frontend.
4. **Sincronizar:** Una vez que el Backend Supabase tiene el nuevo esquema sin errores, la IA actualizará este documento (`SUPABASE_SCHEMA.md`) y RECIÉN ENTONCES modificará las interfaces en TypeScript y componentes React.

---

## ESTRUCTURA ACTUAL DE LAS TABLAS (Verificado)

### 1. `perfiles_locales` (Usuarios y Perfiles)
Almacena usuarios y datos de negocio.
- `id` (uuid, primary key, REFERENCES auth.users(id) ON DELETE CASCADE)
- `email` (text, unique, not null), `password_hash` (text), `nombre` (text), `rol` (text)
- (Otras columnas: nombre_negocio, logo, direcciones, celulares, estado, lat, lng).

### 2. `configuracion_sistema`
Ajustes globales de la app con una o pocas filas.
- `id` (text, NOT NULL)
- `datos` (jsonb, Opcional - puede ser null)
- `ultima_modificacion` (timestamp with time zone)

### 3. `pedidos` (Esquema Original Plano)
La tabla de órdenes actual tiene los datos en formato plano.
- `id_pedido` (text, NOT NULL) / `id` omitido pero usa id_pedido.
- `cliente_id` (uuid), `vendedor` (text)
- `cliente_nombre`, `cliente_email`, `cliente_telefono`, `cliente_direccion` (text)
- `descripcion` (text), `tipo_trabajo` (text)
- `cantidad` (int)
- `precio_total`, `total_pagado`, `saldo` (numeric)
- `estado_pedido` (text)
- `fecha_entrega`, `fecha_creacion` (timestamp)
- `lat`, `lng` (numeric)
- `delivery_min`, `delivery_max` (int)

### 4. `insumos`
Productos y su stock.
- `id` (uuid, NOT NULL), `nombre` (text, NOT NULL), `categoria` (text, NOT NULL)
- `cantidad`, `minimo_alerta`, `delivery_min`, `delivery_max`
- `stock_origin`, `es_stock_propio`, `publicado` (boolean)
- `costo_proveedor`, `costo_vendedor`, `costo_publico` (numeric)
- `category_ids` (ARRAY), `imagenes` (ARRAY)
- `proveedor_id` (uuid)
- Y muchos datos detalles en texto (detalle_cliente, proveedor, etc).

### 5. `diccionario_estados_pedido`
- `id` (uuid, NOT NULL)
- `nombre_estado` (text, NOT NULL)
- `color_pastel_hex` (text, NOT NULL)
- `es_activo` (boolean, NOT NULL)
- `nivel_prioridad` (integer)

### 6. `historial_movimientos`
- `id` (uuid, NOT NULL)
- `accion`, `entidad_id`, `entidad`, `usuario_nombre`, `detalle` (text)
- `valores_anteriores`, `valores_nuevos` (jsonb)
- `fecha` (timestamp)

### 7. `categories`
- `id` (uuid, NOT NULL)
- `name` (text, NOT NULL), `icon_name`, `color` (text)
- `parent_id` (uuid)

### 8. `pagos`
- `id_pago` (text, NOT NULL), `id_pedido` (text)
- `monto` (numeric, NOT NULL)
- `fecha` (timestamp), `comprobante_url`, `tipo_pago`, `observaciones` (text)

### 9. Logística
Tablas: `logistica_config`, `logistica_fleteros`, `logistica_viajes`.

### 10. `pedidos_v2` (Esquema Planificado v2 - Listo en Código)
Módulo avanzado que enruta pedidos, seña y operaciones en fábricas G3D.
- `id` (text, PRIMARY KEY)
- `cliente_nombre` (text, not null)
- `cliente_telefono` (text), `cliente_direccion` (text)
- `canal` (text) - 'tienda' o 'revendedor'
- `revendedor_nombre` (text)
- `producto_id` (uuid, REFERENCES productos(id))
- `producto_nombre` (text, not null)
- `variante_id` (uuid, REFERENCES producto_variantes(id))
- `variante_nombre` (text)
- `cantidad` (integer)
- `precio_unitario`, `precio_total` (numeric)
- `comision_plataforma`, `comision_influencer` (numeric)
- `modalidad` (text) - 'inmediata' o 'produccion'
- `requiere_sena` (boolean), `sena_monto` (numeric), `sena_pagada` (boolean)
- `estado_pago` (text) - 'pendiente', 'señado', 'pagado_total'
- `estado_produccion` (text) - 'no_aplica', 'pendiente_diseno', 'en_cola', etc.
- `estado_envio` (text) - 'retiro_local', 'pendiente_flete', etc.
- `flete_tipo` (text), `flete_costo` (numeric), `flete_cobertura` (text)
- `fecha_entrega_estimada` (timestamp), `instrucciones_operario` (text), `drive_stl_link` (text)
- `creado_el` (timestamp), `vendedor_id` (uuid, REFERENCES perfiles_locales(id))

---
*Nota: Actualmente el sistema frontend usa `pedidos` plano para v1 y cuenta con una envoltura inteligente híbrida para `pedidos_v2` que opera en localStorage si la tabla no está creada, conectándose de forma instantánea al backend cuando se ejecute el archivo /07_esquema_pedidos_v2.sql.*
