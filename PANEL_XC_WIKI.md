# Wiki de Integración de Panel XC (Xtream Codes / XUI.ONE)

Este archivo sirve como referencia perpetua y regla de oro para cualquier IA que trabaje en este proyecto. Define la terminología, el comportamiento de la API del proveedor, las restricciones de interfaz y la documentación técnica completa de la API del distribuidor (Xtream-Masters Reseller API).

---

## 1. Diccionario de Términos del Proyecto
Para evitar confusiones en los prompts y en la escritura de código, respetamos estrictamente la nomenclatura del usuario:

*   **"Panel XC"**: Se refiere únicamente al panel de administración de IPTV del proveedor (basado en XUI.ONE o Xtream Codes) al cual nos conectamos a través de la API proxy (`/api/iptv/xui`).
*   **"Panel de Control"**: Se refiere a este proyecto web en general (la aplicación React en la que estamos trabajando actualmente).

---

## 2. Reglas de Oro de Integración con el Panel XC
Al escribir código, realizar integraciones o modificar interfaces que interactúen con la API del **Panel XC**, se deben seguir estas reglas obligatoriamente:

### ❌ REGLA 1: Sin Inputs de Credenciales en Nuevas Altas
*   **PROHIBIDO** mostrar campos de texto o entradas para que el administrador o el cliente completen un "usuario" o "contraseña" al dar de alta una cuenta o demo desde cero.
*   **Motivo**: El perfil de revendedor (reseller) de nuestro usuario **no tiene permisos** para elegir, editar o pre-establecer los nombres de usuario y las contraseñas en el Panel XC del proveedor.

### 🔑 REGLA 2: Generación del Lado del Panel (Auto-Generación)
*   Al crear una nueva línea o demo (`action: "create_line"` o `"create_demo"`), la petición HTTP POST enviada al backend `/api/iptv/xui` **no debe incluir** los campos de `username` ni `password` para forzar su autogeneración nativa.
*   El propio **Panel XC** del proveedor se encargará de generar automáticamente un usuario y contraseña válidos y seguros para esa nueva línea si no son provistos.

### 💾 REGLA 3: Captura y Persistencia en la Base de Datos
*   Una vez que el Panel XC procesa con éxito la petición de alta, devuelve en su JSON de respuesta las credenciales generadas de forma nativa (normalmente bajo las propiedades `username` y `password` dentro del objeto `data`).
*   Nuestra aplicación de control **debe capturar esas credenciales exactas** que devolvió la API y guardarlas de forma persistente en nuestra base de datos (`perfiles_locales` y la tabla de cuentas de IPTV) para que el cliente pueda consumirlas.

### 🛡️ REGLA 4: Contingencia Fuera de Línea
*   Si la API del Panel XC se encuentra fuera de línea, caída, o devuelve un error, el sistema del Panel de Control generará de forma automática y silenciosa credenciales numéricas/provisorias aleatorias de contingencia para permitir guardar el expediente del cliente de manera local, informando de esta situación mediante un aviso visual (`toast.warning`).

---

## 3. Especificación Técnica Completa de la API: Xtream-Masters Reseller API

### 3.1. Autenticación y URL Base
Todas las peticiones a la API requieren el parámetro de consulta `api_key` en cada solicitud. La clave API se encuentra en el panel de revendedor bajo **API Settings** (cada cuenta de distribuidor tiene una clave única ligada a su `api_access_code`).

#### Formato de la URL Base:
```
http://{server-dns}:{stream-port}/{api-access-code}/reseller/index.php
```
*Reemplazar `{server-dns}`, `{stream-port}` y `{api-access-code}` con las credenciales de conexión reales del panel.*

#### Prueba Rápida (Quick Test):
```bash
curl "http://your-server:port/access-code/reseller/index.php?api_key=YOUR_KEY&action=user_info"
```

---

### 3.2. Parámetros Globales (Global Parameters)
Disponibles en la mayoría o totalidad de los endpoints de la API:

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `api_key` | `string` | **SÍ** | Tu clave API única para autenticación. |
| `action` | `string` | **SÍ** | La acción de API que se desea realizar. |
| `start` | `int` | No (Opcional) | Desplazamiento de paginación para listados (por defecto: `0`). |
| `limit` | `int` | No (Opcional) | Cantidad de registros a retornar (por defecto: `50`). |
| `show_columns` | `string` | No (Opcional) | Lista de columnas separadas por comas a incluir en la respuesta. |
| `hide_columns` | `string` | No (Opcional) | Lista de columnas separadas por comas a excluir de la respuesta. |

---

### 3.3. Módulo General (General)

#### A) Obtener Información del Distribuidor (`action=user_info`)
Retorna los detalles de la cuenta de distribuidor, incluyendo créditos disponibles, estado y configuraciones.

*   **Método:** `GET`
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=user_info"
    ```
*   **Ejemplo de Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "STATUS_SUCCESS",
      "data": {
        "id": 152,
        "username": "myreseller",
        "email": "reseller@example.com",
        "credits": 485.00,
        "status": 1,
        "reseller_dns": "my.dns.com",
        "created_at": "2024-01-15 10:30:00",
        "member_group_id": 3,
        "allowed_pages": ["lines", "mag", "enigma", "activecodes"]
      }
    }
    ```

#### B) Obtener Paquetes Disponibles (`action=packages`)
Retorna la lista de paquetes o planes disponibles para la cuenta de revendedor, con su costo en créditos y duración.

*   **Método:** `GET`
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=packages"
    ```
*   **Ejemplo de Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "STATUS_SUCCESS",
      "data": [
        {
          "id": 1,
          "package_name": "1 Month",
          "credits": 5.00,
          "duration_months": 1,
          "is_trial": 0,
          "is_official": 1,
          "groups": [1, 3, 5]
        },
        {
          "id": 2,
          "package_name": "24h Trial",
          "credits": 0.00,
          "duration_months": 0,
          "is_trial": 1,
          "is_official": 1,
          "groups": [1, 3]
        }
      ]
    }
    ```

---

### 3.4. Gestión de Líneas M3U (Line Management)

#### A) Crear Línea (`action=create_line`)
Crea una nueva línea M3U. El usuario y la contraseña se autogeneran de forma nativa si no se envían.

*   **Método:** `POST`
*   **Parámetros:**
    *   `package` (`int`, **REQUERIDO**): ID del paquete obtenido del endpoint `packages`.
    *   `trial` (`int`, **REQUERIDO**): `0` = regular/comercial, `1` = demo/trial.
    *   `username` (`string`, Opcional): Usuario personalizado (se autogenera si se omite).
    *   `password` (`string`, Opcional): Contraseña personalizada (se autogenera si se omite).
    *   `is_isplock` (`int`, Opcional): `0` = deshabilitado, `1` = habilitar bloqueo de ISP.
    *   `allowed_ips[]` (`array`, Opcional): Lista de direcciones IP permitidas.
    *   `reseller_notes` (`string`, Opcional): Notas internas del revendedor.
    *   `bouquets_selected[]` (`array`, Opcional): Lista de IDs de ramilletes (bouquets) a asignar.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=create_line" \
      -d "package=1" \
      -d "trial=0" \
      -d "username=customer1" \
      -d "password=securepass" \
      -d "reseller_notes=Premium customer"
    ```
*   **Ejemplo de Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "STATUS_SUCCESS",
      "data": {
        "id": 4521,
        "username": "customer1",
        "password": "securepass",
        "package_id": 1,
        "exp_date": 1740000000,
        "is_trial": 0,
        "status": 1,
        "reseller_notes": "Premium customer",
        "created_at": "2025-01-15 14:30:00"
      }
    }
    ```

#### B) Editar / Renovar Línea (`action=edit_line`)
Edita las propiedades de una línea existente o la renueva/extiende asignando un nuevo paquete. Para extender la fecha de vencimiento, debe proveerse el parámetro `package`.

*   **Método:** `POST`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea a editar.
    *   `package` (`int`, Opcional): ID del paquete con el cual extender la línea.
    *   `username` (`string`, Opcional): Nuevo nombre de usuario.
    *   `password` (`string`, Opcional): Nueva contraseña.
    *   `is_isplock` (`int`, Opcional): `0` = deshabilitado, `1` = habilitar bloqueo de ISP.
    *   `allowed_ips[]` (`array`, Opcional): Lista de direcciones IP permitidas.
    *   `reseller_notes` (`string`, Opcional): Notas internas de administración.
    *   `bouquets_selected[]` (`array`, Opcional): Lista de ramilletes (bouquets) asignados.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=edit_line" \
      -d "id=4521" \
      -d "package=2" \
      -d "reseller_notes=Extended for another month"
    ```

#### C) Extender Línea Directa (`action=extend_line`)
Extiende la vigencia de una línea re-aplicando un paquete. La duración oficial del paquete se suma a la fecha de expiración actual de la línea (o desde "ahora" si ya estaba expirada) y descuenta créditos del revendedor. Conserva el usuario, contraseña y bouquets.

*   **Método:** `POST`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea a extender.
    *   `package` (`int`, **REQUERIDO**): ID del paquete para la renovación.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=extend_line" \
      -d "id=4521" \
      -d "package=2"
    ```
*   **Ejemplo de Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "STATUS_SUCCESS",
      "data": {
        "id": 4521,
        "exp_date": 1786708220
      }
    }
    ```

#### D) Obtener Detalles de una Línea (`action=get_line`)
Recupera la información completa de una única línea M3U por su identificador.

*   **Método:** `GET`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea.
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=get_line&id=4521"
    ```
*   **Ejemplo de Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "STATUS_SUCCESS",
      "data": {
        "id": 4521,
        "username": "customer1",
        "password": "securepass",
        "package_id": 1,
        "exp_date": 1740000000,
        "is_trial": 0,
        "is_isplock": 0,
        "status": 1,
        "allowed_ips": [],
        "reseller_notes": "Premium customer",
        "bouquets": [1, 4, 7],
        "created_at": "2025-01-15 14:30:00"
      }
    }
    ```

#### E) Listar Todas las Líneas (`action=get_lines`)
Recupera una lista paginada de todas las líneas M3U. Soporta búsquedas de coincidencia de texto y filtros de estado.

*   **Método:** `GET`
*   **Parámetros:**
    *   `start` (`int`, Opcional): Desplazamiento de paginación (por defecto: `0`).
    *   `limit` (`int`, Opcional): Registros por página (por defecto: `50`).
    *   `search[value]` (`string`, Opcional): Término de búsqueda por usuario o campos relacionados.
    *   `filter` (`int`, Opcional): `1` = Activas, `2` = Deshabilitadas, `3` = Baneadas, `4` = Expiradas, `5` = Demos/Trials.
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=get_lines&start=0&limit=50"
    ```

#### F) Eliminar Línea (`action=delete_line`)
Elimina permanentemente una línea del panel. Esta acción no se puede deshacer.

*   **Método:** `POST`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea a eliminar.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=delete_line" \
      -d "id=4521"
    ```

#### G) Deshabilitar Línea (`action=disable_line`)
Deshabilita temporalmente una línea de transmisión activa. La línea se puede volver a habilitar posteriormente.

*   **Método:** `POST`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea a desactivar.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=disable_line" \
      -d "id=4521"
    ```

#### H) Habilitar Línea (`action=enable_line`)
Vuelve a activar una línea que fue deshabilitada de forma previa.

*   **Método:** `POST`
*   **Parámetros:**
    *   `id` (`int`, **REQUERIDO**): ID de la línea a activar.
*   **Ejemplo de Petición:**
    ```bash
    curl -X POST "http://dns:port/access/reseller/index.php" \
      -d "api_key=YOUR_KEY" \
      -d "action=enable_line" \
      -d "id=4521"
    ```

---

### 3.5. Monitoreo, Bitácoras y Registros (Logs & Monitoring)

#### A) Historial de Actividad (`action=activity_logs`)
Recupera los registros de actividad detallados de la cuenta de revendedor con paginación integrada.

*   **Método:** `GET`
*   **Parámetros:**
    *   `start` (`int`, Opcional): Desplazamiento (por defecto: `0`).
    *   `limit` (`int`, Opcional): Registros por página (por defecto: `50`).
    *   `search[value]` (`string`, Opcional): Término de búsqueda en los logs.
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=activity_logs&start=0&limit=50"
    ```

#### B) Conexiones en Vivo (`action=live_connections`)
Lista las conexiones activas en tiempo real de todas las líneas y dispositivos asociados al revendedor. Útil para auditoría de pantallas simultáneas y geolocalizaciones de red.

*   **Método:** `GET`
*   **Parámetros:**
    *   `start` (`int`, Opcional): Desplazamiento (por defecto: `0`).
    *   `limit` (`int`, Opcional): Registros por página (por defecto: `50`).
    *   `search[value]` (`string`, Opcional): Búsqueda de conexión por usuario o IP.
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=live_connections&start=0&limit=50"
    ```

#### C) Historial de Créditos y Acciones (`action=user_logs`)
Obtiene la lista histórica de transacciones de créditos, compras de paquetes y auditorías de consumo de la cuenta.

*   **Método:** `GET`
*   **Parámetros:**
    *   `start` (`int`, Opcional): Desplazamiento (por defecto: `0`).
    *   `limit` (`int`, Opcional): Registros por página (por defecto: `50`).
    *   `search[value]` (`string`, Opcional): Filtro de búsqueda.
*   **Ejemplo de Petición:**
    ```bash
    curl -X GET "http://dns:port/access/reseller/index.php?api_key=YOUR_KEY&action=user_logs&start=0&limit=50"
    ```

---

## 4. Guía de Instrucciones Rápidas para el Usuario
Cuando quieras pedirme cambios relacionados con el Panel XC o el Panel de Control, puedes usar estas frases clave para que actúe de inmediato bajo estas directrices:

*   **"Trabajar en Panel XC"**: Para que revise y optimice la comunicación de la API proxy, la lectura de paquetes o la obtención de las líneas.
*   **"Crear cliente en Panel de Control"**: Para que optimice la vista del formulario, la bitácora de notas, la geolocalización o el flujo de almacenamiento en la base de datos sin tocar la API de credenciales.
