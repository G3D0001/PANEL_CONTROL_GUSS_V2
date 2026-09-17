# 📖 WIKI DE CONEXIONES Y GUÍA DE INTEGRACIÓN (clubTivi - IPTV Control Panel)

Esta documentación sirve como un manual técnico autogestionable y portátil ("Skill") para integrar, conectar y sincronizar periféricos (como la App en Flutter, sitos web de demos o paneles adicionales) con este panel de administración de Supabase.

---

## 🗄️ 1. ESTRUCTURA CENTRAL DE LA BASE DE DATOS (SUPABASE)

Para evitar duplicidad y tablas muertas, el sistema se ha unificado en torno a estas tablas esenciales:

### `iptv_clientes` (Cuentas de Acceso)
Representa la línea o suscripción principal del panel IPTV.
*   **`username`** (TEXT, PK): Nombre de usuario/línea único.
*   **`password`** (TEXT): Contraseña de la línea.
*   **`nombre_cliente`** (TEXT): Nombre real o alias del suscriptor.
*   **`telefono`** (TEXT): Teléfono de contacto.
*   **`limite_pantallas`** (INTEGER): Cantidad de transmisiones simultáneas contratadas (ej: 1, 2, 3..).
*   **`fecha_vencimiento`** (TIMESTAMP/DATE): Cuándo caduca el acceso.
*   **`estado`** (TEXT): `Activo`, `PAUSADO`, `Pendiente`.
*   **`comentarios`** (TEXT): Notas privadas de administración.
*   **`fecha_creacion`** (TIMESTAMP): Fecha y hora de alta en el sistema.

### `iptv_clientes_perfiles` (Perfiles del Hogar)
Sub-perfiles creados dentro de una misma suscripción para que los familiares no compartan el historial.
*   **`id`** (UUID, PK): Identificador único del perfil.
*   **`username_cuenta`** (TEXT, FK): Vinculado a `username` en `iptv_clientes`.
*   **`nombre`** (TEXT): Nombre para mostrar en el perfil (ej: "Papá", "Niños").
*   **`pin`** (TEXT, NULL): PIN de seguridad opcional de 4 dígitos.
*   **`avatar_url`** (TEXT): Icono o imagen del perfil.

### `iptv_clientes_historial` (Historial de Reproducción)
Auditoría interna de consumo para cada sub-perfil.
*   **`id`** (UUID, PK): ID único.
*   **`perfil_id`** (UUID, FK): Vinculado a `id` en `iptv_clientes_perfiles`.
*   **`stream_id`** (INTEGER): ID del canal o película consumido.
*   **`tipo`** (TEXT): `live`, `movie` o `series`.
*   **`visto_el`** (TIMESTAMP): Fecha y hora del evento.

### `sesiones_activas_iptv` (Dispositivos en Vivo)
Control real-time de quién está transmitiendo para aplicar bloqueos o expulsión.
*   **`id`** (UUID, PK): ID de sesión.
*   **`username_cuenta`** (TEXT): Vinculado a `username` en `iptv_clientes`.
*   **`dispositivo_info`** (TEXT): Dispositivo (ej: "Samsung SmartTV", "Xiaomi Mi Box").
*   **`ip`** (TEXT): IP de conexión pública.
*   **`ultima_actividad`** (TIMESTAMP): Latido para mantener viva la sesión.

---

## 🪣 2. ORGANIZACIÓN DEL STORAGE (ARCHIVOS Y FOTOS)

Para mantener la base de datos libre de sobrepeso, la multimedia se organiza en los siguientes Buckets Públicos:

### 1. `IPTV_TRANSFERENSIA` (Capturas de Comprobantes)
*   **Uso:** Destinado única y exclusivamente para fotos, capturas o PDFs que acrediten transferencias bancarias de las renovaciones.
*   **Nombre de Archivo Sugerido:** `username/comprobante_timestamp.jpg` o `username_comprobante.jpg`.
*   **Ciclo de Vida:** Al eliminar un cliente o su línea, el sistema de forma automática escanea y purga todos los comprobantes contenidos en este directorio virtual para evitar almacenamiento huérfano.

### 2. `IPTV_STORGE` (Imágenes Personales y DNI)
*   **Uso:** Almacena fotos personales del cliente, perfiles hogareños o capturas de DNI para contrataciones de riesgo.
*   **Nombre de Archivo Sugerido:** `username/perfil_avatar.jpg` o `username_personal.jpg`.
*   **Ciclo de Vida:** Vinculado estrictamente al estado del cliente. Al eliminar de forma manual o masiva el cliente de la base de datos, el backend ejecuta una limpieza de lote eliminando todos los archivos que coincidan o tengan el prefijo del usuario.

---

## 🔌 3. ENDPOINTS Y SERVIDOR MIDDLEWARE (Full-stack Server proxy)

Este panel de control se levanta en el puerto `3000` con un proxy Node.js seguro que redirige requerimientos pesados a los distribuidores para evitar bloqueos por CORS en integraciones móviles u otros sitios de venta:

### A. Solicitar Configuración Global (Bypass de CORS para apps móviles o de TV)
*   **Ruta local:** `/api/settings`
*   **Método:** `GET`
*   **Respuesta:** Datos unificados de marcas, URLs activas del APK, versiones del sistema y credenciales públicas de clubTivi.

### B. Proxy para Peticiones Directas al panel XC o XUI (Filtros DNS, Selección de Paquetes y Creación)
*   **Ruta local:** `/api/iptv/xui`
*   **Método:** `POST`
*   **Payload (`action: "test"` - Sincronización y Diagnóstico Seguro, Sin Spam):**
```json
{
  "action": "test",
  "xuiUrl": "https://midominio.com",
  "xuiToken": "mizuritoken",
  "xuiAccessCode": "codigo_acceso_opcional"
}
```
*   **Payload (`action: "create_demo"` - Creación de Pruebas de 1h a 4h):**
```json
{
  "action": "create_demo",
  "xuiUrl": "https://midominio.com",
  "xuiToken": "token",
  "username": "clientedemo123",
  "password": "passdemo123",
  "packageId": "1",
  "trial": 1
}
```
*   **Payload (`action: "create_line"` - Suscripción Comercial Oficial de Pago):**
```json
{
  "action": "create_line",
  "xuiUrl": "https://midominio.com",
  "xuiToken": "token",
  "username": "clientereal99",
  "password": "passreal99",
  "packageId": "2",
  "trial": 0
}
```

---

## 🧹 4. PROTOCOLO AUTOMÁTICO DE HIGIENE Y PROTECCIÓN SIN HUELLAS

Cuando eliminas un cliente mediante este Panel de Control (de manera individual o usando los botones de **Limpieza Masiva**):
1.  **Eliminación Relacional:** Se busca el `username` del cliente.
2.  **Cascada de Perfiles:** Se eliminan recursivamente sus perfiles de hogar en `iptv_clientes_perfiles`.
3.  **Cascada de Historiales:** Se limpia todo rastro de consumos y reproducciones en `iptv_clientes_historial`.
4.  **Cascada de Conexiones:** Se desalojan las sesiones activas en `sesiones_activas_iptv`.
5.  **Purga Física en Storage:** El cliente de Supabase enumera y borra definitivamente todos los archivos guardados en los Buckets `IPTV_TRANSFERENSIA` y `IPTV_STORGE` que pertenezcan a esa cuenta.
6.  **Eliminación del Nucleo:** Borrado definitivo de la cuenta principal en `iptv_clientes`.
