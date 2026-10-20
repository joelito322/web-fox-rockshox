# 11i · Ingesta documental de bielas y platos

Categoría/slot `crankset`. Plato/catalina **incluido con las bielas**, sin selector independiente. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [pedalier](11h-pedalieres.md).

## Marcas y conjuntos de partida

| Marca | Referencias/familias | Fuente |
| --- | --- | --- |
| SRAM / TRUVATIV | GX Eagle DUB; DESCENDANT DH | [Especificaciones de interfaces SRAM](https://www.sram.com/globalassets/document-hierarchy/frame-fit-specifications/mtb/2024-mtb-frame-fit-specifications.pdf), [DESCENDANT DH](https://www.sram.com/en/service/models/fc-desc-dh-b1) |
| Shimano | Conjuntos de gamas MTB seleccionadas y referencias de gravedad documentadas | [Especificaciones Shimano](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf) |
| Race Face | Atlas, SixC, Turbine y otros conjuntos con aplicación documentada | [Guía de bielas](https://www.raceface.com/pages/crank-selection-guide); no mezclar interfaces CINCH con otras por proximidad de diámetro |

## Campos y validaciones

| Grupo | Datos de variante |
| --- | --- |
| Bielas | Longitud mm, material, eje/interfaz, ancho de caja admitido y restricciones |
| Línea de cadena | Distancia mm, offset y configuración documentada; no deducirla del ancho de buje únicamente |
| Plato incluido | Referencia, dentado entero, perfil, interfaz de montaje y ecosistema de cadena |
| Pedales | Rosca/interfaz admitida, sin deducir compatibilidad solo de ser MTB |
| Exterior/servicio | Dimensiones, peso/contexto, acabado y fuente/manual |

La variante identifica una combinación comercial/documentada de bielas y plato; no se generan todos los dentados sobre todas las longitudes por suposición. Si la fuente vende bielas sin plato, el conjunto ATLAS debe identificar explícitamente el plato asociado y no atribuirle un precio de kit de fábrica.

Recurso compuesto de ambas bielas y plato, con pedales anclados en sus extremos. Cambiar dentado o longitud actualiza sus dimensiones sin deformar piezas rígidas; no se añade simulación de pedaleo. Guardar restaura el conjunto completo y sus acabados. Retirar las bielas no borra automáticamente un pedalier o pedales elegidos: se avisa de dependencias y se conserva el borrador.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
crank_length_mm: número positivo | null
spindle_standard: código | null
spindle_diameter_mm: número positivo | null
bb_shell_fit: lista de cajas/restricciones documentadas
chainline_mm: número positivo | null
chainring:
  brand / model / manufacturer_code: texto de referencia | null
  teeth: entero positivo | null
  mount_standard / chain_system: código | null
  offset_mm: número con signo | null
pedal_thread: código completo | null
material: código/texto documentado | null
weight_g: número positivo | null
maintenance: objeto común | null
```


## Primer conjunto enduro revisado · 19 de octubre de 2026

SLX OEM de 165 mm con plato SLX de 32 dientes, respaldado por META SX V5 ESSENTIAL 2026. El código específico de biela y línea de cadena no constan en esa fuente y permanecen desconocidos; no se deducen de la caja del cuadro.

Datos concretos, fuentes y recursos en [inventario versionado](../../supabase/catalog/README.md); estado real de aplicación/publicación en [12](12-estado-implementacion.md). Este lote no completa por sí solo todas las familias previstas en este documento.

## Ampliación de descenso revisada

[TRUVATIV DESCENDANT DH FC-DESC-DH-B1](https://www.sram.com/en/truvativ/models/fc-desc-dh-b1): DUB, línea de cadena 56,5 mm y plato X-SYNC Direct Mount de tres tornillos. La combinación **165 mm/34 dientes** se respalda adicionalmente en la [SUPREME DH V5 RIDE 2026](https://www.commencal.com/en/commencal-supreme-dh-v5-ride-pyrite-grey-2026-en/BT5SUPV5RIEU1M.html?lang=en_FR). No se asigna un SKU de venta inexistente en esas fuentes; plato y bielas conservan una sola selección.
