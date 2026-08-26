# Documentación de Conexiones, Variantes y Permisos G3D

Este documento detalla la arquitectura de datos, lógica de herencia y sistema de permisos para la gestión de productos personalizables impresos en 3D (FDM). Está diseñado para servir como manual técnico para que cualquier desarrollador o sistema de IA pueda replicar o integrar este catálogo en tiendas web, aplicaciones externas o servicios de automatización.

---

## 1. Estructura de Datos (JSON Schema)

Los productos del catálogo general de G3D se dividen en dos modalidades de venta:
1. **Productos Estándar con Variantes Planas:** Productos con atributos fijos o pre-combinados.
2. **Productos con Personalizador 3D en Cascada (FDM):** Configuración en 4 niveles para productos altamente personalizables (ej. un jarro chopero con múltiples modelos, motivos de fútbol, colores y litrajes).

La configuración del personalizador se almacena como metadatos en el campo de extras del producto (`g3d_productos_extras` o un objeto `customizer` anidado en el registro del producto).

### Formato del Objeto `customizer`

```json
{
  "enabled": true,
  "models": [
    {
      "nombre": "Chop Tradicional",
      "precio_minorista_offset": "0",
      "precio_mayorista_offset": "0",
      "imagen": "data:image/jpeg;base64,..."
    },
    {
      "nombre": "Chop Hexagonal",
      "precio_minorista_offset": "1200",
      "precio_mayorista_offset": "800",
      "imagen": "data:image/jpeg;base64,..."
    }
  ],
  "motifs": [
    {
      "nombre": "Boca Juniors",
      "precio_minorista_offset": "1500",
      "precio_mayorista_offset": "900",
      "imagen": "data:image/jpeg;base64,...",
      "colores": [
        {
          "nombre": "Azul y Oro",
          "color_hex": "#1e3a8a",
          "imagen": "data:image/jpeg;base64,...",
          "imagenes": [
            "data:image/jpeg;base64,...",
            "data:image/jpeg;base64,..."
          ]
        },
        {
          "nombre": "Amarillo Puro",
          "color_hex": "#eab308",
          "imagen": "data:image/jpeg;base64,...",
          "imagenes": []
        }
      ]
    },
    {
      "nombre": "River Plate",
      "precio_minorista_offset": "1500",
      "precio_mayorista_offset": "900",
      "imagen": "data:image/jpeg;base64,...",
      "colores": [
        {
          "nombre": "Blanco y Rojo",
          "color_hex": "#ffffff",
          "imagen": "data:image/jpeg;base64,...",
          "imagenes": [
            "data:image/jpeg;base64,...",
            "data:image/jpeg;base64,..."
          ]
        }
      ]
    }
  ],
  "capacities": [
    {
      "nombre": "500 ml",
      "precio_minorista_offset": "0",
      "precio_mayorista_offset": "0"
    },
    {
      "nombre": "750 ml",
      "precio_minorista_offset": "2000",
      "precio_mayorista_offset": "1200"
    }
  ]
}
```

---

## 2. Algoritmo de Cotización y Precios Dinámicos

Los precios dinámicos calculados en tiempo real sumarán (o restarán) las diferencias asignadas a cada una de las opciones seleccionadas por el usuario sobre el precio base del producto.

### Lógica de Cálculo en Pseudocódigo

```javascript
function calcularPrecioFinal(productoBase, seleccion) {
  let precioMino = parseFloat(productoBase.precio_minorista) || 0;
  let precioMayo = parseFloat(productoBase.precio_mayorista) || 0;

  if (productoBase.customizer && productoBase.customizer.enabled) {
    // 1. Añadir offset del Modelo seleccionado
    if (seleccion.model) {
      precioMino += parseFloat(seleccion.model.precio_minorista_offset) || 0;
      precioMayo += parseFloat(seleccion.model.precio_mayorista_offset) || 0;
    }
    
    // 2. Añadir offset del Motivo/Diseño seleccionado
    if (seleccion.motif) {
      precioMino += parseFloat(seleccion.motif.precio_minorista_offset) || 0;
      precioMayo += parseFloat(seleccion.motif.precio_mayorista_offset) || 0;
    }
    
    // 3. Los colores no modifican el precio (solo modifican la foto o renders), offset = 0
    
    // 4. Añadir offset de la Capacidad/Litraje seleccionada
    if (seleccion.capacity) {
      precioMino += parseFloat(seleccion.capacity.precio_minorista_offset) || 0;
      precioMayo += parseFloat(seleccion.capacity.precio_mayorista_offset) || 0;
    }
  }

  return {
    precio_minorista_final: precioMino,
    precio_mayorista_final: precioMayo
  };
}
```

---

## 3. Lógica de Imagen en Cascada (Cascading Renders)

Para evitar cargar cientos de combinaciones de imágenes idénticas, el sistema de visualización implementa una herencia de imágenes de atrás hacia adelante (Color ➔ Motivo ➔ Modelo ➔ Base del Producto):

1. **Prioridad 1 (Color):** 
   - Se busca si el color seleccionado dentro del motivo tiene una o varias imágenes cargadas (`color.imagenes` array).
   - En su defecto, se utiliza la imagen única del color (`color.imagen`).
2. **Prioridad 2 (Motivo):** Si la variante del color no tiene imágenes de muestra ancladas, hereda de forma transparente la imagen del motivo/diseño seleccionado (`motif.imagen`).
3. **Prioridad 3 (Modelo):** Si el motivo tampoco cuenta con imagen cargada, hereda la imagen del modelo de jarro (`model.imagen`).
4. **Prioridad 4 (Base):** En caso extremo de que ninguna de las selecciones anidadas contenga fotos cargadas, se hereda la foto principal cargada en el producto base general (`productoBase.imagen` o la primera de `productoBase.imagenes`).

---

## 4. Matriz de Permisos de Seguridad G3D

El acceso y visualización de tarifas mayoristas, configuraciones y creación de pedidos se rige estrictamente por la nomenclatura de rutas de permisos jerárquicos:

| Ruta del Permiso | Sección / Botón Protegido | Función |
| :--- | :--- | :--- |
| `G3d.CrearPedido.Ver` | Botón "Crear Pedido" | Controla la visualización del botón de creación en la interfaz |
| `G3d.CrearPedido.Acceder` | Acción "Crear Pedido" | Permite abrir el formulario de pedidos e interactuar con él |
| `G3d.ListaPrecios.Ver` | Botón "Lista de Precios" | Visibilidad de la lista de productos y configuraciones |
| `G3d.ListaPrecios.Acceder` | Vista "Lista de Precios" | Habilita el ingreso a la pantalla del catálogo completo |
| `G3d.PrecioMayorista.Ver` | Tarifa Mayorista | Permite visualizar la columna de precios y descuentos de revendedor |
| `G3d.PrecioMayorista.Acceder` | Aplicación de Descuento | Permite aplicar y computar montos de revendedor en presupuestos |

---

## 5. Integración del Resumen en Pedidos y Stock

Al concretar la compra o enviar un pedido del personalizador 3D al sistema central, el detalle exacto de las opciones seleccionadas se concatena en la descripción del ítem de la orden para que el área de producción de impresiones 3D sepa exactamente qué fabricar:

*   **Descripción del Ítem de Venta:** `"{productoBase.nombre} - [Modelo: {model.nombre}, Motivo: {motif.nombre}, Color: {color.nombre}, Capacidad: {capacity.nombre}]"`
*   **Identificador de Variante Compuesta:** Un string legible que puede ser copiado con un toque: `"Chop Tradicional - Boca Juniors - Azul Eléctrico (500 ml)"`.
