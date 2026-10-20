# 11f · Ingesta documental de cambios traseros y mandos asociados

Categoría/slot `rear_derailleur`. Una elección incluye cambio y mando asociado; no selector independiente de mando. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta), [cassettes/cadenas](11g-cassettes-y-cadenas.md).

## Familias a investigar

| Marca | Familias | Identificación y fuentes |
| --- | --- | --- |
| Shimano | DEORE, SLX, DEORE XT, XTR para enduro según referencia; SAINT/ZEE de gravedad solo si se demuestra vigencia actual | [Especificaciones](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf), [XT](https://bike.shimano.com/products/series/deorext.html), [ZEE RD-M640-SS 10v](https://bike.shimano.com/en-UK/products/components/pdp.P-RD-M640-SS.html) y [despiece M640/M820](https://si.shimano.com/de/pdfs/ev/RD-M640-3438/EV-RD-M640-3438A.pdf) |
| SRAM | GX Eagle mecánico, GX DH; otros niveles Eagle solo con referencia completa | [GX Eagle RD-GX-1-B2](https://www.sram.com/en/sram/models/rd-gx-1-b2), [registro de GX DH en V10](https://www.santacruzbicycles.com/pages/product-support/v-10-8-my27) |

El despiece histórico o página de servicio no basta para aprobar SAINT/ZEE ni ninguna familia: exigir oferta actual documentada del código elegido.

No equiparar una familia de grupo a una versión concreta de cambio. Electrónica/Transmission no se incorpora automáticamente por ser una gama: si se incluye una referencia comercial, documentar montaje, mando y sus auxiliares; no añadir emparejamiento, firmware o baterías seleccionables. Por ahora la selección propuesta parte de conjuntos mecánicos verificables.

## Campos y reglas

| Grupo | Datos |
| --- | --- |
| Identidad | Código comercial, generación, variante/tamaño de caja y disciplina |
| Transmisión | Velocidades admitidas, ecosistema, tipo de accionamiento y cadena admitida |
| Capacidad | Capacidad total, piñón mínimo/máximo y restricciones documentadas |
| Montaje | Patilla/anclaje y versión de interfaz; no deducir compatibilidad solo de UDH o número de velocidades |
| Mando asociado | `associated_shifter`: marca/modelo/código, velocidades, accionamiento, interfaz y fuentes |
| Exterior | Dimensiones reales conocidas; geometría estimada, pivotes y roldanas en recurso versionado |
| Servicio | Ajustes y manual de instalación/mantenimiento aplicable, sin asistente de reparación nuevo |

El recurso compuesto ancla cambio al cuadro y mando al manillar. Sustituir/quitar/deshacer el slot actualiza ambos elementos; cadena recalculada en postura estática. No confundir selección visual conjunta con kit vendido junto ni sumar precios sin fuente.

Validar ecosistema, mando y cassette por documentación, no por marca o coincidencia de velocidades. Combinaciones no verificadas conservan incertidumbre. Aceptación: un cambio enduro y otro DH, sus mandos distintos, conflicto conocido y reapertura de cada variante; todas las demás variantes elegidas también deben comprobarse.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
speed_count: entero positivo | null
ecosystem / actuation / mount_standard: código | null
cage: texto/código documentado | null
total_capacity_teeth / min_sprocket_teeth / max_sprocket_teeth: entero positivo | null
chain_system: código | null
associated_shifter:
  brand / model: nombre real
  manufacturer_code: texto | null
  speed_count: entero positivo | null
  actuation / clamp_standard: código | null
  sources: lista de evidencias de esa asociación
weight_g: número positivo | null
maintenance: objeto común | null
```


## Primer conjunto enduro revisado · 19 de octubre de 2026

SLX RD-M7100-SGS de 12 velocidades con mando SL-M7100-R asociado; cassette 10–51 como referencia documentada. La asociación es visual y no afirma que sea un kit comercial. La ampliación SRAM DH se documenta a continuación.

Datos concretos, fuentes y recursos en [inventario versionado](../../supabase/catalog/README.md); estado real de aplicación/publicación en [12](12-estado-implementacion.md). Este lote no completa por sí solo todas las familias previstas en este documento.

## Ampliación SRAM DH revisada

[GX DH RD-GX-1DH-A3](https://www.sram.com/en/sram/models/rd-gx-1dh-a3): siete velocidades, caja media, piñón máximo 25 y cadena Powerchain 11. Mando asociado [SL-GX-DH-A2](https://www.sram.com/en/sram/models/sl-gx-dh-a2), siete velocidades por cable. La abrazadera depende de versión y no se afirma incluida. No confundir el dato «RD Minimum (Cassette) 24» con el piñón pequeño de 24 dientes: se deja sin traducir a ese campo. Publicado en el lote DH; no representa todo el inventario SRAM.
