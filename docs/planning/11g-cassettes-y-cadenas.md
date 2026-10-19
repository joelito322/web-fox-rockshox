# 11g · Ingesta documental de cassettes y cadenas

Categorías/slots `cassette` y `chain`, dos elecciones independientes. UI: «Cassette» o «Piñones» con vocabulario uniforme, sin tratarlos como piezas diferentes. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta).

## Familias y referencias

| Marca | Cassette | Cadena y fuente |
| --- | --- | --- |
| Shimano | DEORE CS-M6100-12, SLX CS-M7100-12, XT CS-M8100-12; otras referencias solo con código verificado | Registrar cadena admitida por esa generación y sistema. [Catálogo técnico](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf), [SLX M7100](https://bike.shimano.com/en-NZ/products/components/pdp.P-CS-M7100-12.html) |
| SRAM | XG-1275 Eagle, PG-720 DH; niveles adicionales documentados | [XG-1275](https://www.sram.com/en/sram/models/cs-xg-1275-c1), [PG-720 A2](https://www.sram.com/en/sram/models/cs-pg-720-a2), [GX Eagle Chain](https://www.sram.com/en/sram/models/cn-eagl-gx-a1), [PC-1110](https://www.sram.com/en/sram/models/cn-1110-a1) |

En las fuentes de PG-720/V10 existen cassettes DH de 7 velocidades con cadena de 11: no imponer igualdad numérica cassette/cadena como regla universal. HG tradicional y HG slim requieren códigos completos de interfaz; no guardar un único texto «HG» si oculta la diferencia.

## Campos por cassette

- Número de velocidades: entero; dentado como secuencia de enteros reales, mínimo/máximo coherentes.
- Núcleo/interfaz: código completo documentado; espaciadores o restricciones como notas/auxiliares, sin selector extra.
- Ecosistema, generación, tecnologías, material y construcción; peso con contexto y acabado.
- Fuente por combinación real: no cruzar cualquier rango comercial con cualquier núcleo.

## Campos por cadena

- Velocidades/sistemas admitidos según fabricante, código de cadena y tecnología.
- Número de eslabones de venta si consta, cierre y sentido de montaje cuando esté documentado; no convertir ese número en cálculo automático de longitud necesaria.
- Peso/contexto, acabado y fuentes de servicio. No inferir intercambiabilidad de Eagle, T-Type/Flattop o sistemas Shimano por marca.

Aceptar exige escala de piñones y ruta simplificada de cadena por plato/cassette/cambio, preservando la postura estática. No hay cambio de marchas simulado, selector de piñón activo ni tensado físico. Las piezas seleccionadas y avisos se guardan; ausencia de cadena o cassette deja montaje incompleto, sin certificar funcionamiento.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
cassette:
  speed_count: entero positivo
  sprocket_teeth: lista de enteros positivos ordenados
  freehub_standard / ecosystem: código completo | null
  construction / material: texto documentado | null
  spacer_notes: texto de fuente | null
  weight_g: número positivo | null
  maintenance: objeto común | null
chain:
  supported_systems: lista documentada
  nominal_speed_count: entero positivo | null
  link_count: entero positivo | null
  connector / direction_notes: texto documentado | null
  weight_g: número positivo | null
  maintenance: objeto común | null
```
