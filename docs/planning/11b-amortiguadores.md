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
