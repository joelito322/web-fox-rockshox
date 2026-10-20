# 11b · Ingesta documental de amortiguadores

Categoría `shock`, slot `shock`. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta). «Shock» se presenta como «Amortiguador» en UI.

## Familias a desglosar

| Marca | Aire | Muelle | Fuente y condición |
| --- | --- | --- | --- |
| FOX | FLOAT X, FLOAT X2 | DHX, DHX2 | [Catálogo](https://ridefox.com/pages/bike-shocks), [fichas por año](https://tech.ridefox.com/bike/list/spec-sheets); no incluir Live Valve/electrónica automáticamente |
| RockShox | Super Deluxe, Vivid | Vivid Coil; Super Deluxe Coil solo antecedente excluido | [Series](https://www.sram.com/en/rockshox/series). [Vivid Coil reemplaza Super Deluxe Coil en la gama](https://support.rockshox.com/hc/en-us/articles/26413607489179-Does-RockShox-Vivid-Coil-replace-the-Super-Deluxe-Coil); el anterior queda excluido del inventario actual |
| Öhlins | TTX1Air, TTX2Air | TTX22 / TTX22m según referencia | [Familias MTB](https://www.ohlins.com/en-us/mountain-bike); revisión y uso enduro/DH por ficha |
| Marzocchi | Bomber Air, Bomber Inline | Bomber CR | [Manuales y despieces](https://bike.marzocchi.com/pages/product-service-manuals); comprobar aplicación concreta del Inline antes de incorporarlo a enduro |

## Campos por variante

| Campo/grupo | Tipo y unidad | Validación |
| --- | --- | --- |
| `eye_to_eye_mm`, `stroke_mm` | Números positivos mm | Pareja comercial real; no mezclar carrera de una referencia con entreojos de otra |
| `spring_type` | air/coil | Determina geometría exterior y documentación; un depósito de gas no convierte un muelle en resorte de aire |
| `mount_standard` | Código/objeto de montaje por extremo | Ojo/trunnion, ancho y diámetros de herrajes documentados; no basta la distancia entreojos |
| `damping_system`, `adjustments` | Código y lista documentada | Año, hidráulico, ajuste de compresión/rebote, palanca y posición de depósito |
| Muelle asociado | Tasa y unidad original, longitud libre/carrera admisible si constan | Especificación de la variante representada; no añadir un selector de todos los muelles ni recomendación por peso del ciclista |
| Envolvente | Medidas técnicas conocidas y referencia de depósito | Separar estimaciones del manifiesto; no deducir holgura real de una malla aproximada |
| `weight_g` | Número positivo o null | Indicar si incluye muelle/herrajes cuando la fuente lo precise |
| `maintenance` | Documentos/tareas/intervalos aplicables | Aire, muelle e hidráulico tienen operaciones distintas; no copiar intervalos de otra generación |

## Reglas de integración

Aro de la bicicleta no es una medida de selección del amortiguador: su vínculo es el cuadro, talla, montaje y postura. No fabricar variantes 27.5/29 de un amortiguador solo para llenar un filtro. La geometría del cuadro puede estar optimizada para una tecnología; documentar restricciones de fuente.

- Recurso versionado con anclajes por extremo, cuerpo, depósito y muelle/aire reconocibles.
- El cuadro puede tener amortiguador oculto: mostrar su ubicación real, sin colocarlo externamente para hacerlo visible. No añadir vista explosiva no solicitada.
- Datos nominales coincidentes no certifican encaje de depósito/herrajes; aviso conocido o datos insuficientes.
- Aceptación: cada variante aplica/restaura con su montaje, acabados y fuente de mantenimiento; un cambio de entreojos no estira el cuadro ni una pieza rígida para fingir encaje.

Referencia para casos límite: [RockShox, comprobación de instalación](https://www.sram.com/en/service/articles/RockShox-fitment-article). No se añade agenda, contador de horas, alertas de taller o registro de reparaciones.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
eye_to_eye_mm / stroke_mm: número positivo | null
spring_type: air | coil | null
mount_standard:
  upper / lower:
    type: eyelet | trunnion | código documentado | null
    width_mm / bolt_diameter_mm: número positivo | null
damping_system: texto de referencia | null
adjustments: lista de ajustes documentados
coil: null | {rate_value, rate_unit, free_length_mm, max_stroke_mm}
reservoir: null | {orientation_notes, documented_dimensions_mm}
weight_g: número positivo | null
maintenance: objeto común | null
```

## Contraejemplo de identificación, no referencia actual aprobada

[FOX identifica una referencia 2025 FLOAT X2 Factory](https://tech.ridefox.com/bike/search/serial/1164191-0024-T) como 205 × 65 mm, trunnion, con sus manuales/despieces asociados. Es evidencia de una referencia de 2025, no prueba de gama actual: no se incorpora a la ingesta sin evidencia adicional de vigencia y no se atribuye 205 × 65 a toda la familia. Quedan por completar herrajes, SKU comercial si consta, ficha íntegra y recurso; no queda lista para publicar por esta observación.

La referencia permite contrastar versiones con [la explicación de rediseño FLOAT X2/DHX2](https://ridefox.com/blogs/academy/fox-dhx2-and-float-x2-explained): no aplicar automáticamente un manual de servicio de otra construcción al mismo nombre de familia. Consulta: 18 de octubre de 2026.


## Lote concreto implementado el 19 de octubre de 2026

Fuente de ingesta: `supabase/catalog/initial-reviewed.json`. La primera ampliación añadió 34 variantes de amortiguador. Después se publicó únicamente Bomber CR 230×65 de ese grupo para el ejemplo enduro; las otras 33 permanecen en borrador. El total vigente del catálogo está en 12. Se validaron contra el diccionario tipado y se ingirieron transaccionalmente en Cloud. No equivale a publicación ni a cubrir todas las familias de este documento.

- **RockShox Vivid Coil Ultimate D1:** 24 combinaciones de entreojos/carrera que enumera su [ficha comercial actual](https://www.sram.com/en/rockshox/models/rs-vivc-ult-d1). Se distingue Trunnion de ojal estándar. No se combinan dimensiones de listas independientes; no se inventa SKU, dureza del muelle ni tune por medida. El fabricante enumera opciones de tune/herrajes sin vincularlas a cada medida: quedan pendientes de identificación concreta, sin crear variantes ficticias.
- **Marzocchi Bomber CR:** diez combinaciones métricas de la [tienda oficial](https://bike.marzocchi.com/products/bomber-cr-rear-shock), contrastadas con sus variantes estructuradas: estándar 210×50, 210×55, 230×60, 230×65 y 250×75; Trunnion 185×52,5, 185×55, 205×60, 205×65 y 225×75. Se conservan los diez códigos comerciales que ofrece esa fuente. El muelle se vende aparte: su tasa no se rellena por aproximación. Las referencias imperiales siguen documentadas por el fabricante y pendientes de incorporación; no se consideran inexistentes.

Los recursos genéricos de muelle están identificados y versionados en cada variante; revisión de geometría, manuales aplicables, herrajes y aceptación visual siguen dentro del plan antes de publicar. La ausencia de información confirmada no se sustituye por estimaciones en la ficha comercial.

Incidencia de investigación: la [ficha de Bomber 58](https://bike.marzocchi.com/products/bomber-58) muestra 203 mm en sus variantes seleccionables y 200 mm en su bloque de especificaciones. No se incorporó esta horquilla como si ambas cifras fueran una única medida verificada; resolver la discrepancia para el SKU concreto antes de completar su ingesta.

## Referencia incorporada al montaje DH

Bomber CR **250×75 estándar, 968-58-049**, ya publicada junto al ejemplo SUPREME DH V5. Conserva el acabado negro y la representación genérica de muelle. La medida no certifica herrajes, orientación ni tasa de muelle. Las demás medidas mantienen su estado en el [inventario versionado](../../supabase/catalog/README.md); no se publicaron todas por pertenecer a la misma familia.

## Segundo lote ejecutable · 19 de octubre de 2026

En `supabase/catalog/suspension-reviewed.json`, **FLOAT X2 Factory MY26** se ingiere por once SKU comerciales emparejados: estándar 210×50/52,5/55, 230×60/62,5/65 y 250×75; Trunnion 185×55, 205×60/65 y 225×75. Los códigos `979-01-204` a `214` conservan el emparejamiento del selector, no combinaciones deducidas. Solo 210×55 recibe el peso 708 g de la referencia publicada. Las medidas 225/250 carecen de palanca de dos posiciones. [Selector oficial](https://ridefox.com/products/float-x2-factory). Mantenimiento completo a 125 h documentado para esta generación, sin agenda ni contador: [servicio MY26–27](https://tech.ridefox.com/bike/parts-drawings/3052/float-x2-part-information).

**Öhlins TTX22m.2 MTBM 2208**: 230×65 de muelle, versión AM con depósito lateral y válvula azul. No deducir la dureza del muelle ni los herrajes. Se omiten clics de rebote porque la ficha contradice 6/7; no confundir esta referencia con la válvula DH. [Ficha vigente](https://www.ohlins.com/en-us/mountain-bike/rear-shocks/ttx22m-2-coil-230x65-am).

Las 24 medidas de **Vivid Coil Ultimate D1** previamente documentadas se revisan como recursos genéricos montables antes de publicar sus borradores existentes; se conserva la identidad de cada variante y se enlaza el servicio D1. No se inventan tunes, orientación comercial, tasa o precio por medida a partir de listas agregadas. [Combinaciones oficiales](https://www.sram.com/en/rockshox/models/rs-vivc-ult-d1).

Las representaciones son genéricas identificadas; no implican compatibilidad real con cualquier cuadro. La restricción del SUPREME para FLOAT X2 MY26 debe seguir produciendo aviso sin bloquear el montaje visual.
