---
name: xtv-design-standard
description: Estándar y guía de diseño unificado para tablas, botones, fuentes, islas (islands) y colores customizados de XTV.
---

# Estándar de Diseño Visual y Maquetación para XTV Digital

Esta guía define el ADN visual rígido que se debe respetar en cada pantalla y desarrollo del Panel de Administración de XTV. Ningún elemento, botón o fila de tabla debe ser diseñado sin adherir a esta estructura simplificada, densificada y coherente ("Airbnb / Clean UI").

## 1. Tipografía y Jerarquía Visual

- **Fuentes Centrales**: 
  - Primaria: `"Plus Jakarta Sans"` para textos limpios y legibles.
  - Técnica: `"JetBrains Mono"` para claves Xtream, URLs, cuentas, contraseñas, contadores y métricas impositivas/proveedor.
- **Títulos**: Clase utilitaria `dyn-title` para heredar el color seleccionado por el usuario en configuración, combinado con `tracking-tight font-extrabold uppercase`.
- **Subtítulos**: Clase utilitaria `dyn-subtitle` para heredar el color de subtítulos, típicamente con `text-xs tracking-wider uppercase opacity-80`.

---

## 2. Paleta de Colores Dinámica e Inyección

Para lograr cohesión y que todas las pantallas reflejen los colores que el usuario edita en la solapa "Interfaz y Pantalla", se inyectan variables CSS globales. Se deben priorizar siempre estas clases utilitarias en lugar de usar colores estáticos:

- **Botones Primarios**: Usar `dyn-btn-primary hover:scale-[1.02] active:scale-[0.98] transition-all`
- **Botones Secundarios**: Usar `dyn-btn-secondary hover:bg-opacity-90`
- **Títulos**: Usar `dyn-title`
- **Subtítulos**: Usar `dyn-subtitle text-xs`
- **Islas / Paneles**: Usar `dyn-island border p-5 rounded-[1.8rem]`
- **Enlaces / Links**: Usar `dyn-link underline cursor-pointer`

---

## 3. Arquitectura y Diseño de Tablas Unificadas

Las tablas no deben verse recargadas ni contener un desorden de botones desalineados. Sigue estas reglas de estructuración:

### Reglas de Diseño de Filas:
1. **Unificación de Botones**: Coloca todas las acciones agrupadas en un menú desplegable de opciones o un panel lateral de edición rápida en lugar de llenar la fila de botones.
2. **Uso de Badges**: Los estados (Activo, Vencido, Expirado, Pausado) deben usar cápsulas semánticas muy compactas con bordes limpios sin degradados ruidosos:
   - Activo: `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase`
   - Vencido/Expirado: `bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase`
   - Demos: `bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase`
3. **Contraste de Celdas**: El nombre del cliente y el identificador de usuario deben ocupar las columnas de mayor peso tipográfico. El resto de la información (teléfonos, vencimientos, etc.) debe usar fuentes mono-espaciadas medianas o más sutiles.

---

## 4. Estilos de Islas (Islands) / Paneles de Control

- Las tarjetas e islas administran información modular (Bento-grid).
- Deben usar curvas amplias de radio configurable (`rounded-[var(--app-radius)]` o `rounded-2xl` / `rounded-[1.5rem]`).
- Fondo y bordes deben respetar `dyn-island` para amoldarse a los ajustes del usuario en tiempo real.
