# 11j · Ingesta documental de pedales

Categoría/slot `pedals`: selección de la pareja, sin selector izquierdo/derecho. ROCKBROS es marca solicitada; se investigan otras opciones documentadas. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta).

## Registros iniciales

| Marca | Modelos o líneas de investigación | Fuente |
| --- | --- | --- |
| ROCKBROS | Plataforma de nylon/composite y plataforma de aluminio CNC, referencia exacta por ficha | [Catálogo oficial](https://rockbrosbike.us/collections/bike-pedals), [plataforma nylon](https://rockbrosbike.us/products/rock-bros-mountain-bike-pedals-nylon-composite-bearing-9-16-mtb-bicycle-pedals-with-wide-flat-platform) |
| Race Face | Chester; otros modelos solo con ficha localizada | [Chester](https://www.raceface.com/products/chester-pedal) |
| Shimano | Pedales de las líneas MTB documentadas, si se incluyen automáticos o plataformas | [Catálogo técnico](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf); código y aplicación aún por fijar |

No inventar nombre de modelo ROCKBROS si la tienda usa un título descriptivo; conservar su referencia comercial o URL canónica. Una variante por construcción/tamaño técnico, acabados como opciones.

## Campos y pruebas

- Tipo: plataforma/automático/mixto documentado; sistema de cala solo si aplica. No se añade catálogo de zapatillas o calas seleccionables.
- Dimensiones de plataforma y espesor mm; material del cuerpo/eje, rosca/interfaz, masa indicando pareja o unidad.
- Pines, concavidad y forma como características documentadas; representación aproximada sin modelar cada tornillo si no aporta valor.
- Acabados, fuente, foto y mantenimiento aplicable; un color no crea otro producto técnico.

Comprobar anclajes izquierdo/derecho, orientación, tamaño exterior y eje. Guardar una sola elección restaura ambos pedales. Incompatibilidad con biela conocida se avisa; un ID de otra categoría se rechaza. No calcular agarre o resistencia a impactos a partir de la forma 3D.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
pedal_type: flat | clipless | hybrid
platform_width_mm / platform_length_mm / platform_thickness_mm: número positivo | null
thread_standard: código completo | null
body_material / spindle_material: texto documentado | null
cleat_system: código | null
pin_notes / bearing_notes: texto documentado | null
weight_g: número positivo | null
weight_basis: pair | unit | null
maintenance: objeto común | null
```
