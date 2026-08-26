# 📋 Estado del Proyecto: G3D Control Panel

## 🎯 Objetivo General
Crear una aplicación profesional, escalable y autogestionable para la gestión de stock y tienda online, con arquitectura centralizada en Supabase y notificaciones inteligentes.

## 🛠️ Reglas de Negocio Establecidas
1. **Arquitectura:** Todo debe ser configurable desde el Panel de Control (sin valores fijos en código).
2. **Variantes:** Sistema estilo Mercado Libre (Maestro > Variantes) vinculado por `parentId` en `especificaciones`.
3. **Imágenes:** Sin límite de carga para productos.
4. **Categorías:** Jerarquía de Categorías y Subcategorías (category_id).
5. **Proveedores:** Vinculación profesional mediante `proveedor_id`.
6. **Calidad:** No se permite publicar (`publicado: true`) productos sin al menos una imagen.

## 🚀 Tareas en Curso (Prioridad Alta)
- [x] **Rediseño de Base de Datos y Auth:**
    - [x] Sincronización de tabla `perfiles_locales` directamente con `auth.users` mediante triggers SQL.
    - [x] SettingsView actualizado para usar `auth.uid()` (`user.id`) garantizando que los usuarios solo editen su propio registro.
    - [x] Eliminación de sistema de roles complejos por interfaz simple.
    - [x] Auditar y probar tablas de `pedidos`, `pagos` y `logistica` (Conexiones de asentar pagos corregidas con el schema normalizado en V1).
- [x] **Rediseño de Panel de Pedidos:**
    - [x] Separar Presupuestos de Pedidos Activos en Dashboard.
    - [x] Agregar filtro por Vendedor en la lista de pedidos.
    - [x] Mejorar visibilidad de estados para empleados y vendedores (Colores Vibrantes).
- [x] Carga de pedidos manual ágil con autocompletado de clientes y productos.
- [x] Integración de descuento de stock automático en pedidos manuales.
- [ ] **Sistema de Advertencias Proactivo:**
    - [ ] Implementar detección de errores en campos ocultos.
- [ ] **Panel de Configuraciones Centralizado:**
    - [x] Configuración de Pantalla (Zoom/Escalado y Tamaño de fuente) persistente por dispositivo.
    - [x] Arquitectura de Permisos Granulares (Ruta.Acción) centralizada.
    - [x] Simulador dinámico sincronizado con el registro de permisos.
    - [x] Configuración de APIs (Supabase, WhatsApp, n8n).
    - [ ] Gestión de Datos del Negocio (Logo, dirección, etc).
    - [ ] Administración de la Tienda (Horarios, banners).

## ⏳ Próximamente (Pendientes)
- [ ] Modificar las variantes en la carga de items al gestor de stock.
- [ ] **IMPORTANTE:** Eliminar `DevRoleSimulator` de `App.tsx` y borrar el archivo antes de exportar el proyecto final.
- [ ] Configurar Webhook de n8n para alertas de WhatsApp (Postergado por el usuario).
- [ ] Integración de Pasarela de Pagos.
- [ ] Sistema de Cupones de Descuento.

## ✅ Tareas Completadas
- [x] Implementación de Sistema de Variantes (Maestro/Variante).
- [x] Eliminación de límite de imágenes (10 -> Infinito).
- [x] Selector de Proveedores dinámico desde base de datos.
- [x] Jerarquía multinivel de Categorías, Multi-categoría e integración con Gemini para sugerencias inteligentes.
- [x] Gestión de categorías desde la carga de stock (Sugerencias IA y creación on-the-fly).
- [x] Visualización de colores de filamentos en la lista de stock.
- [x] Modal de validación con lista de campos faltantes.
- [x] Control de Calidad: Filtro y monitoreo de items sin imagen.
- [x] Restricción de publicación sin imágenes.
- [x] Dashboard dinámico con separación de Presupuestos vs Activos.
- [x] Sistema de Permisos organizado con descripciones (LuckPerms Simulator).
- [x] Colores vibrantes y sólidos para estados de pedido.
- [x] Ayuda visual para variables inteligentes en campos de detalle.

## 📌 Notas de Memoria
- La tabla principal es `insumos`.
- Los datos extra (hex, parentId, isVariant, colorsConfig) viven en el JSON `especificaciones`.
- El campo `publicado` controla la visibilidad en la tienda.
