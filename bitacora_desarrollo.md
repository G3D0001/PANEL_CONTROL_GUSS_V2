# Bitácora de Desarrollo - G3D (Memoria del Proyecto)

Este documento centraliza el estado actual, configuración visual y funciones lógicas de las vistas modificadas para que sirva de memoria permanente para el Agente IA.

## Vistas Actuales y su Configuración

### 1. MisProductosView (`src/components/MisProductosView.tsx`)
**Objetivo:** Permitir a los usuarios y vendedores administrar su catálogo de productos.
**Lógica de Diferenciación:**
- Administradores (`Admin` / `Produccion`): Gestionan productos propios (`stock_origin = 'Propio'`).
- Vendedores: Gestionan productos donde `creado_por` sea igual a su ID de sesión. Permite diferenciar proveedores externos.

**Formulario Completo (Creación de Producto y Edición Completa):**
- **Nombre del Producto (`nombre`):** Texto requerido.
- **Categoría (`categoria`):** Utiliza un Componente Customizado Dinámico (`CascadingCategorySelector`) que permite navegar en 3 niveles de categorías, como en MercadoLibre. Actualmente funciona con Mock Data interno.
- **Descripción Administrativa (`descripcion`):** Texto para uso interno.
- **Detalle Cliente (`detalle_cliente`):** Texto visible en la tienda.
- **Stock Inicial (`cantidad`):** Stock disponible actualmente.
- **Mínimo de Alerta (`minimo_alerta`):** Umbral numérico para disparar notificaciones de bajo inventario. (Agregado recientemente).
- **URL Imagen (`imagenes[0]`):** Enlace principal de la imagen.
- **Modalidades (Vendedores excluyendo Admins):** 
  - *Requiere Producción/Armado:* Define días Mínimos (`delivery_min`) y Máximos (`delivery_max`). Entrará en flujo productivo.
  - *Entrega Inmediata:* Define `delivery_min` y `delivery_max` a 0. Se envía directo sin producción.
- **Flujo Productivo (Vista de Admins):** Muestra el flujo al que será asignado, con controles de días para los admintradores locales.

**Formulario Edición Rápida (Modal alternativo para Actualización Veloz):**
- Nombre (`nombre`)
- Stock (`cantidad`)
- Tiempo Entrega (`delivery_min` a `delivery_max`)
- Imagen (`imagen`)

---

### 2. Gestión de Pedidos y Resta de Stock
- La resta de stock (`cantidad` de insumos) se efectuará **automáticamente** en el momento de la confirmación o creación del pedido. Se deberá validar la cantidad inicial contra el `minimo_alerta` que dispara notificaciones.

### 3. Gestión de Categorías Simulada (`src/components/CategoriesView.tsx`)
**Objetivo:** Permitir la organización jerárquica y el etiquetado a través de árbol de categorías.
- El panel ahora es un Simulador Reactivo con CRUD falso con `useState`.
- **Selector de Íconos (`IconPicker.tsx`):** Componente avanzado que carga dinámicamente toda la biblioteca de `lucide-react` (~1600 íconos) con un modal flotante posicionado de forma absoluta para no romper el layout. Contiene scroll interno a 350px de altura y barra de búsqueda en tiempo real integrada.

---

### 4. Laboratorio G3D (`src/components/LaboratorioFlujosView.tsx`)
**Objetivo:** Entorno aislado de simulación interactiva ("Sandbox") para diseñar la lógica de enrutado de pedidos y estructurar las especificaciones de fabricación.
- **Triple Descripción del Negocio:**
  1. *Descripción de la Tienda (Público):* Detalles comerciales principales que visualizan los compradores de la Web.
  2. *Información Mayorista (Interno para Vendedores):* Exclusivo para revendedores y administradores, ideal para configurar escalas de precios o advertencias de despacho.
  3. *Parámetros Técnicos de Impresión (Fábrica/Producción G3D):* Exclusivo para los operarios. Oculta todos los datos financieros y personales del comprador para evitar distracciones, asegurando máxima confidencialidad. Ideal para indicar velocidad, soportes y filamento.
- **Integración con Google Drive Gratuito (Direct Download):** Esquema automatizado que extrae el File ID de un enlace compartido de Drive y lo transforma a la URL de descarga directa de la API de Google Docs. Tus operarios descargan archivos .stl/.gcode en un clic con costo de almacenamiento $0.
- **Enrutado Inteligente:**
  - *Socio en Lista Blanca G3D:* Recibe la orden con parámetros técnicos (3ra descripción), link de Drive y checklist industrial despersonalizada.
  - *No Registrado / Colaboradores:* Pasa al panel comercial con estimación de fletes Uber/Moto y botones para WhatsApp preconfigurados de coordinación directa con el cliente.
- **Sandbox Multirroles Interactivos:** Permite alternar la perspectiva de la interfaz entre Administrador, Revendedores y Operarios en tiempo real para visualizar exactamente cómo viaja la data por el sistema.

---

*(Este archivo será actualizado de forma progresiva según Avance de Desarrollo de Agentes IA)*

### 5. Consola IPTV XTV Central (`src/components/IptvManagerView.tsx`)
**Objetivo:** Gestión avanzada de socios, branding simulado, y alta interactiva de clientes.
- **Selector de Registro Unificado (Dos Canales de Entrada):** Al hacer clic en "Nuevo Cliente", se despliega un selector visual interactivo de estilo minimalista que solicita la elección inicial entre:
  1. *Generar Cuenta Demo (Trial):* Lanza el Asistente Multitabs.
  2. *Registrar Plan Completo:* Redirige al formulario tradicional para enlazados comerciales estándar.
- **Asistente Multitabs "Add Trial Line" (Estilo XUI.ONE):** Formulario estructurado en 3 pasos con cálculo predictivo en vivo:
  - *Details:* Personalización opcional del prefijo (con terminación segura `@xtv.net`), selección del paquete trial (1h, 3h, 6h o 4h con 3 pantallas), y campos integrados opcionales de Correo de Contacto y Notas de Reseller.
  - *Restrictions:* Configuración en acceso libre (Abierto, omitiendo restricciones para asegurar que el cliente de prueba conecte sin bloqueos de ISP/IP).
  - *Review Purchase (Contenido Autorizado):* Selección pormenorizada de grupos de canales, películas y series autorizadas para la demo, con botón para selección/deselección interactiva masiva.
- **Consola de Credenciales Compartibles (Copy-Paste Ready de un Solo Clic):** Al confirmarse la creación, se eliminan los prompts de carga por un resumen global de credenciales bien organizador. Cuenta con botones individuales para copiar Host, Puerto, Usuario, Contraseña, o Playlist M3U por separado, e incluye un botón maestro "Copiar todas las credenciales" que genera una plantilla perfectamente estructurada para enviar al cliente final por mensajería.
- **Sincronización:** Se persiste directamente en la Base de Datos real bajo `apiService.saveIptvAccount` asegurando que toda cuenta demo quede asimilada instantáneamente en la interfaz de clientes activos.
- **Unificación de Feedback Visual (Copy-Paste Ready para Todo Plan):** Optimizamos el generador para que, al guardar exitosamente CUALQUIER cuenta (tanto Demos/Trials como Planes de Venta Minoristas), se despliegue de inmediato la pantalla de éxito con toda la información recopilada. Se cargan plantillas inteligentes y profesionales optimizadas según el caso para enviar a los clientes por WhatsApp o Telegram de un solo clic.
- **Rediseño Completo del Formulario de Alta y Notas (Clean UI 2 Columnas):** Segmentamos el formulario de clientes IPTV en dos bloques organizados. La columna izquierda consolida los Datos Personales (+54 código de país autocompletado, dirección y detector interactivo de enlaces de Google Maps con botón para GPS en vivo) junto con la Bitácora/Notas del Cliente (añadiendo notas de manera individual en tiempo real sin salir de la vista). La columna derecha centraliza la "Selección del Plan Comercial" usando pestañas tipo facción rápida, un menú desplegable simplificado para planes demo o minoristas (recalculando el vencimiento aproximado en vivo en la UI), las credenciales de entrada de Xtream codes (con el campo password oculto y automatizado para que se asigne de manera aleatoria segura por el sistema) y el estado activo del cliente.
- **Auto-Generador Inteligente de Contraseñas (XUI-Friendly):** Para solucionar la rigidez técnica del panel XUI.ONE, agregamos un botón interactivo "🎲 Generar Clave Azar" que autogenera contraseñas alfanuméricas seguras y previene bloqueos de ISP or rebotes del servidor, reduciendo el desgaste de créditos imprevisto por errores manuales.

