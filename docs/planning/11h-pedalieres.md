# 11h · Ingesta documental de pedalieres

**Decisión confirmada:** pedalier seleccionable independiente; plato incluido con bielas. Nueva categoría/slot `bottom_bracket` en las mismas tablas existentes, sin tabla propia. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta), [bielas y platos](11i-bielas-y-platos.md).

## Marcas y tipos documentados

| Marca | Familias/tipos de partida | Fuente |
| --- | --- | --- |
| SRAM | DUB: variante para caja de cuadro concreta | [Manuales DUB](https://docs.sram.com/en-US/publications/7unL17qdyCWxTL38aPmYJ0/home), [identificar pedalier](https://www.sram.com/en/quarq/campaigns/how-to-find-your-bottom-bracket) |
| Shimano | Referencias MTB roscadas/press-fit para el eje especificado; códigos exactos por variante | [Especificaciones oficiales](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf) |
| Race Face | CINCH; BSA 30 mm y otras cajas admitidas documentadas | [BSA CINCH](https://www.raceface.com/products/bsa-cinch-30mm), [guía de selección](https://www.raceface.com/pages/crank-selection-guide) |

BSA roscado y press-fit describen interfaces de caja; DUB/CINCH/HOLLOWTECH II son familias/sistemas y no sustituyen la descripción completa. No asumir que dos piezas llamadas press-fit son iguales.

## Campos de cada variante

| Campo | Tipo / validación |
| --- | --- |
| `shell_standard` | Código completo de caja, roscada o press-fit |
| Ancho/diámetro de caja | Números positivos mm; rosca/paso si aplica, según fuente |
| `spindle_standard` y diámetro | Código y mm; no redondear sistemas distintos a «aprox. 30» |
| Configuración | Cazoletas externas/internas, rodamientos, separadores admitidos y restricciones |
| Producto | Marca, familia, referencia comercial, material, masa y acabado si constan |
| Servicio | Manual aplicable e información de montaje; no inventar pares de apriete |
| Visual | Recurso versionado de cazoletas/volumen visible y anclaje al origen de pedalier |

`bottom_bracket` expresa el conjunto de pedalier seleccionado; el eje integrado en las bielas no se duplica como otra pieza. Se comparan **ambas interfaces**: cuadro↔pedalier y pedalier↔bielas. Una coincidencia con el cuadro no demuestra la segunda.

Si queda oculto entre cuadro y bielas, su selección sigue existiendo en lista, ficha y guardado; no se exagera el tamaño para hacerlo visible. Sin pedalier no se afirma montaje mecánico completo, aunque se permita la vista de las bielas.

Aceptar cada variante exige selección real por marca/tipo, comprobación conocida o incertidumbre, guardado y reapertura. No dejarlo como texto auxiliar fijo ahora que se confirmó su selector.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
shell_standard: código | null
shell_width_mm / shell_diameter_mm: número positivo | null
shell_thread: código/medida completa | null
spindle_standard: código | null
spindle_diameter_mm: número positivo | null
cup_type: external | internal | código documentado | null
bearing_notes / spacer_notes / restrictions: texto de fuente | null
material: código/texto documentado | null
weight_g: número positivo | null
maintenance: objeto común | null
```

## Referencia concreta localizada

[Race Face BSA CINCH 30 mm](https://www.raceface.com/products/bsa-cinch-30mm) confirma una familia de pedalier BSA para sistema de eje de 30 mm. Antes de una variante publicable se completa ancho de caja, código comercial, separadores y restricciones de la configuración. No asignar ese pedalier a unas bielas SRAM DUB o Shimano por aproximar diámetros; [la guía de Race Face](https://www.raceface.com/pages/crank-selection-guide) distingue esos sistemas. Consulta: 18 de octubre de 2026.


## Primer conjunto enduro revisado · 19 de octubre de 2026

SM-BB71-41A Press-Fit HOLLOWTECH II, con cajas admitidas 89,5/92 mm indicadas en texto. No se duplican SKU por esas dos cajas ni se inventan separadores o una medida de eje no verificada.

Datos concretos, fuentes y recursos en [inventario versionado](../../supabase/catalog/README.md); estado real de aplicación/publicación en [12](12-estado-implementacion.md). Este lote no completa por sí solo todas las familias previstas en este documento.

## Ampliación de descenso revisada

[SRAM DUB PressFit BB-DUB-PF-A1](https://www.sram.com/en/sram/models/bb-dub-pf-a1), caja **PF107**. La [tabla de separadores](https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/dub-mtb-bottom-bracket-compatibility-chart.pdf) documenta 2 mm exteriores a la derecha para la fila DH/PF107. No trasladar esa receta a DUB MTB o a PF30; no asignar el peso de BB92 al PF107.
