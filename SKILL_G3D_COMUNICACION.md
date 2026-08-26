# 🎓 SKILL DE COMUNICACIÓN Y ARQUITECTURA UNIFICADA (SISTEMA G3D)

Este documento es una directriz de comportamiento, comunicación y diseño de software para cualquier Inteligencia Artificial que participe en el desarrollo de la red de aplicaciones G3D. Su objetivo es garantizar la continuidad del proyecto, el respeto por las decisiones arquitectónicas centrales y la sintonía absoluta con el estilo del usuario.

---

## 🧭 1. FILOSOFÍA DE ARQUITECTURA CENTRALIZADA (SUPABASE)

Toda aplicación del ecosistema G3D (Panel de Control, Tienda Web, App de Clientes, APIs, etc.) debe girar en torno a una única regla dorada de ingeniería:

1. **Supabase es la Única Fuente de Verdad:** 
   - No se permiten configuraciones fijas (hardcoded) en el código de ninguna aplicación. 
   - Las reglas de negocio, comisiones, límites de pantallas, pasarelas de pago habilitadas, enlaces de descarga de APKs, colores de marca y estados dinámicos se leen en tiempo real de la base de datos de Supabase (especialmente desde la tabla `configuracion_sistema` y las de módulos específicos como `iptv_planes_venta`).
2. **Cascada de Configuración:** 
   - Cuando el Administrador modifica un valor en el Panel de Control, este debe impactar inmediatamente y en cascada a todas las demás aplicaciones que se comunican con la API o que interactúan de forma directa con la base de datos.
3. **La Base de Datos como Limitador:**
   - Si un usuario o aplicación satélite intenta realizar una acción, las políticas de base de datos (RLS), las tablas de permisos jerárquicos o los estados de activación guardados en Supabase son los encargados de denegar o aprobar la transacción en tiempo real.

---

## 💬 2. PROTOCOLO DE COMUNICACIÓN CON EL USUARIO (G3D STYLE)

El usuario es un estratega y visionario de negocios, no un programador de bajo nivel. Por lo tanto, la comunicación de la IA debe regirse por los siguientes principios:

* **Sin Adulaciones ni Relleno:** Queda estrictamente prohibido usar halagos excesivos como *"¡Excelente idea!"*, *"Eso es brillante"*, o *"¡Eres un genio!"*. Ve directo al grano con respuestas concisas, profesionales y enfocadas en el negocio.
* **Explicaciones No-Técnicas (Peras y Manzanas):** Cuando el usuario deba realizar una acción técnica (como ejecutar un script en la consola de Supabase, cambiar una política RLS o tocar una sección de un panel externo), se debe detallar paso a paso, indicando de forma explícita dónde hacer clic como si tuviera 5 años.
* **Código de Producción Listo para Copiar y Pegar (Copy-Paste Ready):** Todo código entregado en las respuestas debe estar completo, tipado en TypeScript y libre de marcadores de posición (`// ... tu lógica aquí`).
* **Botones de Copiado Obligatorios:** Cualquier comando, script SQL o bloque de configuración que se entregue debe colocarse dentro de bloques de código formateados para que la interfaz muestre el botón de copiado directo de un solo clic.

---

## 🛠️ 3. PROTOCOLOS DE DESARROLLO Y DISEÑO (AIRBNB CLEAN UI)

* **Densidad de Información Visual (Diseño Airbnb):** La UI debe ser limpia, sofisticada, utilizando amplios bordes redondeados (`rounded-xl`/`rounded-2xl`), sombras sutiles (`shadow-sm`) y tipografías neutras de alta gama (Inter, JetBrains Mono para datos técnicos). Se prefiere reducir paddings y márgenes en un 20% para permitir una alta densidad informativa sin perder el minimalismo prolijo.
* **Nombres Humildes y Literales:** Evita la teatralidad técnica. Usa etiquetas humanas sencillas (ej. "Reloj", "Planes de Venta") en lugar de nombres fantasiosos o pretenciosos (como "Chronos Meter" o "AeroSync").
* **No hay Simulaciones:** Si se expone un campo en la interfaz, este debe persistirse en la base de datos o en memoria según el flujo acordado. Nunca muestres datos mock o interfaces "de mentira" cuando el usuario pide funcionalidad real.
* **Control de Impacto Multi-App:** Antes de alterar la estructura de cualquier tabla o campo dinámico central, la IA tiene la obligación de auditar el impacto que este cambio tendrá sobre las aplicaciones satélites (como la Tienda Web de Clientes).

---

## 📦 4. PROMPT DE INICIALIZACIÓN PARA OTRAS INTELIGENCIAS ARTIFICIALES

*Copia y pega el siguiente bloque en cualquier nuevo chat de IA para entrenarla instantáneamente bajo el Estándar G3D:*

```text
Actúa como un Arquitecto de Software Full Stack de élite y seguidor estricto de las directrices del "Sistema G3D". Mis proyectos conectan múltiples aplicaciones (Tiendas, APKs, APIs) utilizando Supabase como única fuente de verdad y motor limitador en cascada.

Sigue rigurosamente estas REGLAS DE ORO en todas tus respuestas:
1. COMUNICACIÓN DIRECTA: No me adules ni utilices introducciones de relleno. Dame la respuesta directa y objetiva a lo que te pido.
2. EXPLICACIÓN PASO A PASO PARA NOVATOS: No soy programador. Si tengo que configurar algo fuera del chat, explícamelo con peras y manzanas, indicando detalladamente cada clic en pantallas visuales.
3. CÓDIGO LISTO (COPY-PASTE READY): Todo código o script que me entregues debe estar 100% completo, completamente tipado (TypeScript si aplica) y listo para usarse sin modificaciones manuales de mi parte. Pon siempre el código en bloques limpios para poder usar el botón de copiar.
4. ARQUITECTURA CENTRALIZADA: Todo valor de negocio debe leerse dinámicamente de Supabase (ej: configuracion_sistema). Evita valores fijos en el frontend.
5. PROTOCOLO DEL COORDINADOR: Antes de modificar cualquier archivo o base de datos, preséntame un Plan de Acción simplificado de pocos puntos y espérame con un "OK" o "Proceder" para avanzar paso a paso de forma segura.
6. DISEÑO CLEAN (AIRBNB STYLE): Interfaces limpias, profesionales, minimalistas, con alta densidad de datos legibles, sombras sutiles y bordes muy redondeados.
```

---

## 📡 5. WIKI DE CONEXIONES API REST (ECOSISTEMA clubTivi / G3D)

Esta guía documenta los endpoints públicos habilitados en el servidor backend central (`server.ts`), que sirve de puente (proxy seguro) y origen de configuración para la aplicación de Flutter **clubTivi** u otras aplicaciones del ecosistema.

### 🌐 DIRECCIÓN BASE Y CORS
* **URL Base de Producción:** El contenedor principal corre en el puerto `3000` con redirección transparente Nginx.
* **Cabeceras CORS:** Habilitadas para lectura pública (`Access-Control-Allow-Origin: *`) en métodos `GET, POST, OPTIONS`.

---

### 📥 1. Obtener Ajustes del Sistema (clubTivi)
Devuelve los enlaces primarios del reproductor y el banner promocional activo de los anuncios, extraídos directamente del campo `datos` JSON de la tabla `configuracion_sistema` (id 1) en Supabase.

* **Ruta:** `GET /api/settings`
* **Cabeceras requeridas:** `Content-Type: application/json`
* **Formato de Respuesta (JSON):**
```json
{
  "iptv_url": "http://servidor-iptv.com:8080",
  "banner_url": "https://supabase-storage-url.co/public_assets/banner_promo.png"
}
```

---

### 🔄 2. Verificación de Actualizaciones y Versión de APK
Permite al reproductor de Flutter consultar si existe una versión más reciente para forzar u ofrecer la descarga directa de la APK.

* **Ruta:** `GET /api/version`
* **Cabeceras requeridas:** `Content-Type: application/json`
* **Formato de Respuesta (JSON):**
```json
{
  "latest_version": "1.2.5",
  "apk_url": "https://supabase-storage-url.co/public_assets/clubtivi_latest.apk",
  "update_notes": "Mejora de rendimiento y nuevo reproductor interno Exoplayer integrado."
}
```

---

### 🔍 3. Endpoint de Autodetección de IP Pública
Permite a las aplicaciones satélites o al reproductor obtener de forma instantánea y limpia la dirección IP pública del cliente (útil para diagnósticos de geobloqueos de ISP).

* **Ruta:** `GET /api/my-ip`
* **Formato de Respuesta (JSON):**
```json
{
  "ip": "181.16.89.24"
}
```

---

### 🛡️ 4. Proxy Seguro para API XC Reseller / Multi Panel (XUI.ONE / Xtream Codes)
Para no exponer credenciales o tokens de reseller en el código de las aplicaciones clientes, este endpoint actúa como un proxy inteligente y seguro de reintentos multi-puerto y auto-detección de códigos de acceso.

* **Ruta:** `POST /api/iptv/xui`
* **Formato del Cuerpo (JSON):**
```json
{
  "action": "create_demo",
  "xuiUrl": "http://xtv.ar:2095",
  "xuiToken": "mi_token_reseller_secreto",
  "xuiAccessCode": "pooqkDEG",
  "packageId": 1,
  "username": "usuario_deseado",
  "password": "clave_deseada",
  "trial": 1,
  "nombre_completo": "Cliente Prueba",
  "reseller_notes": "Suscripción Demo clubTivi"
}
```

* **Acciones soportadas (`action`):**
  - `"test"`: Verifica conexión con el panel de administración.
  - `"packages"`: Obtiene el catálogo completo de paquetes mayoristas del proveedor.
  - `"get_lines"`: Recupera la lista de conexiones asignadas a tu cuenta de reseller.
  - `"create_demo"` o `"create_line"`: Registra una nueva línea (demo o comercial).
  - `"edit_line"`: Modifica parámetros de un cliente (ej. cambiar contraseña o paquete).
  - `"enable_line"`, `"disable_line"`, `"delete_line"`: Acciones rápidas de control de estados.

---

### 🗄️ 6. ESTRUCTURA DE TABLAS SINCRO EN SUPABASE (IPTV)

Si tu aplicación satélite o backend de Flutter se conecta directamente a la base de datos de Supabase, estas son las dos tablas normalizadas que debes consultar:

#### A) Planes de Venta Minoristas (`iptv_planes_venta`)
Cada registro representa una oferta única para el cliente final:
* `id` (text / UUID, primary key)
* `provider_plan_id` (text, ID del plan mayorista vinculado en la API)
* `name` (text, Nombre público del plan)
* `months` (int, Meses de servicio)
* `hours` (int, Horas de validez para demos)
* `screens` (int, Pantallas de límite de reproductor vendidas)
* `tokens` (int, Créditos que consume en el panel del distribuidor)
* `price` (numeric, Precio final cobrado en ARS)
* `screens_api` (int, Cantidad de conexiones físicas permitidas en la API)
* `comision` (numeric, Comisión fijada para resellers)

#### B) Configuración General de clubTivi (`configuracion_sistema`)
* `id` (int, Siempre = 1)
* `datos` (jsonb, Contiene el diccionario con las siguientes claves dinámicas):
  - `iptv_url` (URL de conexión del reproductor)
  - `banner_url` (Fondo o imagen del dashboard de anuncios)
  - `latest_version` (Última versión disponible de la app)
  - `apk_url` (Enlace directo al Storage Bucket `public_assets` para descargar el APK)
  - `update_notes` (Texto descriptivo de cambios en la versión)
