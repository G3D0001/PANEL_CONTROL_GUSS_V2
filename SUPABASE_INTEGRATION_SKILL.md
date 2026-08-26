# SKILL DE INTEGRACIÓN CON SUPABASE Y API CENTRAL DE clubTivi (G3D)

Este documento es la **Guía Maestra de Integración y Conexión Unificada (SOP / Skill)**. Sirve para que cualquier Inteligencia Artificial (u otro desarrollador) que comience a trabajar en las aplicaciones hijas o secundarias (como la aplicación móvil clubTivi Flutter, la Tienda Web del Cliente, etc.) entienda de modo instantáneo cómo comunicarse con este Panel de Control, cómo de manera coordinada autenticar a los usuarios con su **primer nombre** (sin correos obligatorios), cómo validar permisos de forma reactiva y cómo consumir el catálogo de insumos de Supabase de manera automatizada.

---

## 📌 1. CONEXIÓN DIRECTA A DESARROLLO (VITE + EXPRESS SERVER)

El panel cuenta con un servidor full-stack (Express + Vite) unificado. El puerto externo es el **3000** de manera permanente. 

Para que cualquier aplicación externa se conecte, puede consultar directamente la IP/Dominio del panel consumiendo las APIs REST nativas con cabeceras de lectura pública `Access-Control-Allow-Origin: *` habilitadas por defecto.

---

## 🔐 2. AUTENTICACIÓN POR "PRIMER NOMBRE" Y ACCESO CENTRALIZADO

En el ecosistema clubTivi, **no se utiliza Supabase Auth tradicional (signup por email)** para las cuentas locales ni para el panel de vendedores, debido a las restricciones de IP (Rate Limits) del entorno sandboxed de Supabase.

La autenticación se realiza de manera simplificada y 100% autogestionada mediante **consultas directas a la tabla central `perfiles_locales`**, coincidiendo el "email" (que actúa como campo `username` o `login` plano).

### Flujo de login en Apps Hijas (Flutter, React, etc.)
Cuando un cliente escribe su login simple (ej: `"pablo"`) y su contraseña (ej: `"123456"`):
1. La aplicación hija hace una solicitud HTTP POST al endpoint de la API centralizada del panel: `/api/auth/login`.
2. O bien, si se comunica directo con Supabase, busca en la tabla `perfiles_locales` donde la columna `email` sea igual a `"pablo"` o `"pablo@xtv.com"` y el `password_hash` coincida.

---

## 🚀 3. ENDPOINTS API REST DISPONIBLES EN EL PANEL

La otra IA puede consumir o actualizar estos endpoints HTTP en el servidor Express del Panel (IP-De-Tu-Servidor:3000):

### 🔑 A) POST /api/auth/login (Autenticación Maestra de Cuentas)
Valida credenciales usando únicamente el nombre de usuario de acceso (primer nombre o login simple) y retorna el perfil, su rol y los parámetros IP/Banners configurados en clubTivi.

*   **Endpoint:** `/api/auth/login`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "username": "pablo",
      "password": "tu_contrasena_aqui"
    }
    ```
*   **Respuesta de Éxito (200 OK):**
    ```json
    {
      "success": true,
      "message": "¡Sesión iniciada correctamente!",
      "usuario": {
        "id": "8fa52f20-b42d-4bb1-a67b-1cb8ff8f2ba1",
        "login": "pablo",
        "nombre": "Pablo Torres",
        "rol": "IPTV CLIENTES",
        "celular": "1123456789",
        "logo_url": "https://...",
        "negocio_nombre": " clubTivi Mendoza"
      },
      "config_clubtivi": {
        "iptv_url": "http://xtv.ar:2095",
        "banner_url": "https://...",
        "latest_version": "1.4.2",
        "apk_url": "https://..."
      }
    }
    ```
*   **Respuesta de Cuenta Suspendida/Cambio de Permisos (403 Forbidden):**
    Si la administración deshabilita la cuenta o le quita los accesos, la API rechaza el ingreso protegiendo el contenido:
    ```json
    {
      "success": false,
      "error": "Esta cuenta está suspendida por la administración de clubTivi. Contacta al soporte técnico."
    }
    ```
*   **Respuesta de Datos Inválidos (401 Unauthorized):**
    ```json
    {
      "success": false,
      "error": "Usuario o contraseña inválidos."
    }
    ```

### ⚙️ B) GET /api/settings (Ajustes de IPTV del Sistema)
*   **Endpoint:** `/api/settings`
*   **Método:** `GET`
*   **Respuesta:**
    ```json
    {
      "iptv_url": "http://xtv.ar:2095",
      "banner_url": "https://..."
    }
    ```

### 📱 C) GET /api/version (Última Versión APK de la App Android)
*   **Endpoint:** `/api/version`
*   **Método:** `GET`
*   **Respuesta:**
    ```json
    {
      "latest_version": "1.4.2",
      "apk_url": "https://...",
      "update_notes": "Mejora de interfaz y corrección de reproductor de video."
    }
    ```

### 📡 D) POST /api/iptv/xui (Proxy Seguro para XC Reseller)
Enruta llamadas de activación de demos, consultas de líneas e historiales al panel simulador o remoto, utilizando balances y transiciones rápidas de créditos.

---

## 🗄️ 4. MODELO DE DATOS NORMALIZADO EN SUPABASE

### 1) Tabla Central `perfiles_locales` (Usuarios y Negocios)
Es la fuente de la verdad de los colaboradores, clientes, vendedores y sus configuraciones comerciales:
*   `id` (UUID, Primary Key) - Se genera en frontend/backend como UUIDv4.
*   `email` (TEXT, UNIQUE) - Almacena el login del usuario (ej: `"pablo"`).
*   `password_hash` (TEXT) - Almacena la clave en formato de texto plano para simplicidad local.
*   `nombre` (TEXT) - Nombre completo de la persona.
*   `rol` (TEXT) - Ej: `'Administrador'`, `'IPTV SOCIOS'`, `'IPTV VENDEDORES'`, `'IPTV CLIENTES'`.
*   `telefono_contacto` (TEXT) - Celular personal para alertas.
*   `nombre_negocio`, `telefono_negocio`, `logo_url`, `direccion_negocio` (TEXT).
*   `estado` (TEXT) - `'activo'`, `'suspendido'` o `'deshabilitado'`.
*   `datos_adicionales` (JSONB) - Almacena datos extras (ej: `{"api_key": "xux_...", "dni": "..."}`).

### 2) Tabla Global de Ajustes `configuracion_sistema`
Contiene la configuración de clubTivi de nivel Administrador (con ID 1):
*   `id` (TEXT) - Valor de inicialización '1'.
*   `datos` (JSONB) - Estructura:
    ```json
    {
      "iptv_url": "http://...",
      "banner_url": "https://...",
      "latest_version": "1.0.0",
      "apk_url": "https://...",
      "update_notes": "...",
      "color_primario": "#0f172a"
    }
    ```

---

## ⚠️ 5. DESBLOQUEO CRÍTICO DE SUPABASE (LLAVE FORÁNEA DE AUTH)

Por defecto, algunas plantillas de Supabase vinculan la columna `perfiles_locales.id` con `auth.users.id` mendiante una llave foránea (`REFERENCES auth.users(id) ON DELETE CASCADE`).
Esto bloquea la inserción directa de colaboradores planos y dispara el error de Rate Limit por IP.

### Solución Definitiva (Ejecutar en Supabase SQL Editor):
Para eliminar la restricción molesta y poder crear usuarios al instante ingresando su login ("primer nombre") desvinculado de correos electrónicos, debes ejecutar este código de un solo clic en tu consola SQL de Supabase:

```sql
-- Buscar y eliminar cualquier restricción de clave foránea en la columna ID de la tabla perfiles_locales
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'perfiles_locales'
          AND kcu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE perfiles_locales DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ';';
    END LOOP;
END $$;
```

---

## 🛠️ 6. REGLAS MAESTRAS DE INTEGRACIÓN PARA OTRAS IA

Cuando construyas o edites apps conectadas a esta base de datos:
1.  **Protección Condicional de Caída:** Si el endpoint `/api/auth/login` o la base de datos de Supabase no responden (caída física de internet, mantenimiento etc.), la aplicación hija **DEBE congelar la UI** e impedir accesos, desplegando un cuadro amigable: *"Error de conectividad de cuenta. El servicio clubTivi está experimentando una interrupción técnica de red. Volvemos enseguida."*
2.  **Soporte Multirrol Restringido:** Las aplicaciones móviles o tiendas del cliente **NO deben permitir el acceso a roles que entren en conflicto.** Valida siempre que `usuario.rol` sea igual a `'IPTV CLIENTES'` o el asignado por el panel. Si es `'Administrador'` y la app móvil es exclusivamente para clientes, advierte del conflicto restringiendo el paso si así lo requiere la lógica corporativa.
3.  **Un solo origen de catálogo:** No dupliques tablas de stock o insumos. Consume siempre `productos`, `producto_atributos` y `producto_variantes` en tiempo real desde Supabase para proteger los cálculos interactivos de Bento-grid y márgenes impositivos.

---
