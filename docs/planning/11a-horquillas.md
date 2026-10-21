# 11a · Ingesta documental de horquillas

Categoría `fork`, slot `fork`. Marcas solicitadas: FOX, RockShox, Öhlins y Marzocchi. Aplican [campos comunes y estados](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [representación](05-configurador-3d.md). Familias localizadas no equivalen a variantes completas publicables.

## Familias a desglosar

| Marca | Familias de investigación | Desglose obligatorio |
| --- | --- | --- |
| FOX | 36, 38, 40, Podium | Generación, edición comercial/hidráulico real, aro y recorrido; distinguir simple/doble pletina. [36](https://ridefox.com/pages/fox-36), [38](https://ridefox.com/pages/fox-38), [40](https://ridefox.com/pages/fox-40), [Podium](https://ridefox.com/products/podium) |
| RockShox | Lyrik, ZEB, BoXXer, Domain; Psylo según aplicación; Yari con vigencia por confirmar | Nivel y código reales de cada generación; el índice incluye referencias de servicio, sin probar vigencia comercial. [Series oficiales](https://www.sram.com/en/rockshox/series), [Psylo](https://www.sram.com/en/rockshox/series/psylo?filters=&sort=Relevancy) |
| Öhlins | RXF36, RXF38, DH38 | Revisión M.x y versión aire/muelle documentada, sin duplicar por simetría. [Catálogo MTB](https://www.ohlins.com/en-us/mountain-bike), [RXF38 M.3 29/44/170](https://www.ohlins.com/en-us/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170) |
| Marzocchi | Bomber Z1, Z1 Coil, Super Z, Bomber Z, Bomber 58 | Separar originales, revisiones y conversiones; no asignar a la Z1 actual las especificaciones de una Z1 antigua. [Manuales y familias](https://bike.marzocchi.com/pages/product-service-manuals) |

FOX 34, RockShox SID y otros productos de categorías distintas no se incorporan solo por compartir marca. Se revisa uso declarado antes de ampliar el catálogo enduro/DH. Desde la ampliación del 21/10/2026 se permiten también generaciones históricas identificadas. Distinguir siempre listado de servicio, generación y vigencia comercial; una conversión Z1 Coil no se declara horquilla nueva de fábrica. Ver [11o](11o-ampliacion-gravity.md).

## Campos específicos de cada variante

| Grupo | Claves y tipo | Regla |
| --- | --- | --- |
| Uso | `disciplines` lista controlada; `crown_type` simple/doble | Fuente de generación concreta; no deducir pletina por color |
| Rueda | `wheel_format` código comercial; `wheel_bsd_mm` entero | 27.5/584 y 29/622 son referencias de nomenclatura; no diámetro exterior del neumático. Otras medidas solo con registro |
| Dimensiones | `travel_mm`, `axle_to_crown_mm`, `offset_mm`, `stanchion_diameter_mm`: números positivos o null | Unidades mm; no transformar un rango de familia en una variante ficticia |
| Dirección | `steerer_standard` código y dimensiones documentadas | Distinguir recta/cónica y diámetros; longitud cortada no se inventa |
| Eje | `axle_standard` código completo, diámetro y ancho | No comparar solo el ancho o asumir que todos los Boost son iguales |
| Freno | Montaje, disco mínimo/máximo y restricciones de fabricante | Límites desconocidos null; se contrastan con disco/adaptador |
| Arquitectura | `fork_layout` convencional/invertida | FOX Podium exige forma/anclajes de horquilla invertida; no simularla cambiando colores de una 38 |
| Resorte | `spring_type` air/coil; tipo/cámara o muelle documentado | Aire y muelle cambian volumen exterior/detalle y mantenimiento; «manual» no es tipo de resorte |
| Hidráulico | `damping_system`, ajustes disponibles y modo de accionamiento | No asignar GRIP/Charger/TTX a todas las generaciones del nombre |
| Acabados | IDs de acabado, color/material/nodos pintables | Acabado técnico diferente puede exigir variante; pintura libre separada de color oficial |
| Masa | `weight_g` positivo o null y contexto de medida | No comparar pesos de configuraciones distintas como equivalentes |
| Servicio | `maintenance` objeto con documentos y tareas por generación | Contrato común; no establecer un intervalo universal por marca |

Las claves de `specs` se validan según versión de contrato; no duplicar `disciplines` o acabados dentro de JSONB si ya viven en columnas/`allowed_finishes`.

## Validaciones y 3D

- Identidad de variante: fabricante + modelo/generación + sistema + aro + recorrido + offset + eje. El SKU, si existe, confirma una referencia; no se genera todo el cruce de opciones del configurador del fabricante.
- Aire/muelle solo se ofrecen cuando esa combinación existe. Un kit de conversión no demuestra una versión comercial de fábrica; conservar procedencia.
- Eje-corona y offset alimentan anclajes versionados; tubos, pletinas y botellas conservan proporciones. Dos variantes de acabado pueden compartir recurso.
- Incompatibilidad conocida con cuadro/rueda/disco produce aviso y permite montaje visual; datos mal formados o categoría errónea se rechazan.
- Caso de aceptación: cambiar 27.5/29 o simple/doble pletina, aplicar acabado, guardar y recuperar el mismo recurso y avisos. No dar por probadas todas las horquillas por validar una FOX.

Mantenimiento: partir de [fichas FOX](https://tech.ridefox.com/bike/list/spec-sheets), manual de servicio asociado al código RockShox, documentación Öhlins y manual Marzocchi de esa revisión. Las recomendaciones generales de una página de marca no sustituyen el manual aplicable.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
wheel_format: código | null
wheel_bsd_mm: entero positivo | null
travel_mm: número positivo | null
axle_to_crown_mm: número positivo | null
offset_mm: número no negativo | null
stanchion_diameter_mm: número positivo | null
crown_type: single | dual | null
fork_layout: conventional | inverted | null
steerer_standard: código | null
axle_standard: código completo | null
brake_mount: código | null
rotor_min_mm / rotor_max_mm: número positivo | null
spring_type: air | coil | null
damping_system: texto de referencia | null
adjustments: lista de ajustes documentados
weight_g: número positivo | null
maintenance: objeto común | null
```

## Datos de producto observados, sin generar SKU por cruce

| Referencia localizada | Datos observados | Pendiente para completar su variante |
| --- | --- | --- |
| [RockShox BoXXer Ultimate FS-BXR-ULT-D2](https://www.sram.com/en/rockshox/models/fs-bxr-ult-d2) | Modelo/código, resorte de aire LinearXL y hidráulico Charger 3.2 en la página de producto consultada | Selección comercial concreta de rueda, recorrido, offset, eje y manual de esa referencia; una lista de opciones de familia no demuestra cada combinación |
| [Marzocchi Bomber Z1 actual](https://bike.marzocchi.com/products/bomber-z1) | Chasis 36 mm y hidráulico Rail; la página presenta opciones 27.5/29 y recorridos, incluido uno DJ ajeno al enfoque inicial | Relación exacta rueda/recorrido/código; excluir versión DJ de una selección enduro por el solo nombre Z1 |
| [Öhlins RXF38 M.2](https://www.ohlins.com/storage/4D81EA83A21214EDFB4A57331844F3692B56F2CCA1ED9BD1BE95A5CDFE6D1B1E/9bd7e6402a3e42ff93f357c6b15e645b/pdf/media/0377e17f271d4af39560e027d515d36d/Owners%20manual%20RXF38%20m.2.pdf) | Manual propio con apartado de resorte de aire | Código y medidas concretas, anotaciones de servicio aplicables y recurso |
| [Marzocchi Z1 Coil](https://bike.marzocchi.com/pages/product-service-manuals) | Manual diferenciado y procedimiento de conversión aire a muelle en el índice oficial | Distinguir variante comercial de conversión documentada; no crear una Z1 Coil de cualquier generación actual |

Consulta: 18 de octubre de 2026. Estos datos se capturan a su nivel real de evidencia; no declaran una variante lista para seed ni un año no indicado por la fuente. Un registro de conversión/manual histórico como Z1 Coil queda fuera de la ingesta hasta demostrar vigencia actual.

[Öhlins documenta RXF38 M.3 Air TTX18 29/44/170](https://www.ohlins.com/en-us/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170): registro concreto de rueda 29, offset 44 mm y recorrido 170 mm. Completar eje, eje-corona y código comercial antes de publicarlo; no inferir las demás medidas. [FOX Podium](https://ridefox.com/products/podium) añade un caso de horquilla invertida que debe conservarse en datos y silueta.

## Primer lote concreto investigado durante implementación · 19/10/2026

Fuente editable de ingesta: [initial-reviewed.json](../../supabase/catalog/initial-reviewed.json). Registros **en borrador**, no inventario completo ni aceptación visual. No deducir combinaciones cartesianas de opciones de una ficha.

| Modelo / generación | Referencia exacta incorporada | Evidencia y límites |
| --- | --- | --- |
| FOX 38 Factory GRIP X2 · MY27 | Aire, 29″, 180 mm, Shiny Black, 910-21-412 | [Producto actual](https://ridefox.com/products/my27-fox-38-factory); la página mantiene una ficha por referencia. Año MY27 documentado; no trasladar hidráulico/aire de MY26 |
| Mismo modelo | Aire, 29″, 170 mm, Shiny Black, 910-21-415 | Misma ficha. La opción naranja tiene otra referencia; no fingir que el código negro identifica ambos acabados |
| Mismo modelo | Aire, 29″, 160 mm, Shiny Black, 910-21-416 | Misma ficha; diámetro de disco indicado 200–230 mm |
| Mismo modelo | Aire, 27,5″, 160 mm, Shiny Black, 910-21-426 | Misma ficha; no inventar una opción 180/27,5 a partir de selectores globales |
| Öhlins RXF38 m.3 Air TTX18 | 29″ / 44 / 170; FGMTB 3817 2510 | [Referencia oficial exacta](https://www.ohlins.com/en-it/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170); longitud eje-corona 583 mm, eje 15 × 110 y peso 2320 g con eje/tornillos. No asignar ese peso a la variante de muelle |

Para FOX se dejaron sin confirmar eje-corona, offset y peso por variante cuando la ficha revisada no los identifica de forma inequívoca. Los 2360 g que aparecen en la página tienen una configuración de referencia específica; no se copian a todos los recorridos. No hay precios ni intervalos de mantenimiento inventados. Faltan el resto de variantes/modelos acordados y sus manuales aplicables.

## Ampliación de descenso revisada · 19/10/2026

[FOX 40 Factory MY27 GRIP X2](https://ridefox.com/products/my27-fox-40-factory): tres referencias comerciales verificadas, 29/203 naranja **910-21-409**, 29/203 negra **910-21-410** y 27,5/203 negra **910-21-417**. Eje 20×110 BOOST, dirección recta 1 1/8, aire FLOAT EVOL GlideCore y disco 200–230 mm. No se copia el peso de partida de 27,5 a 29; offset y eje-corona siguen sin confirmar para estos SKU. Las tres referencias disponen del recurso v2 de doble pletina. El ejemplo DH usa la negra de 29.

Estado del lote anterior: FOX 38 29/170 está publicada; las otras tres FOX 38 y la Öhlins siguen en borrador. BoXXer D2 sigue pendiente de emparejar opciones concretas; no heredar resorte o hidráulico D1.

## Segundo lote ejecutable · 19 de octubre de 2026

Fuente local `supabase/catalog/suspension-reviewed.json`. Selección concreta, sin producto cartesiano de opciones:

- **ZEB Ultimate B1**: 29/170, dirección cónica 1,5, offset 44, eje 15×110, barras 38, discos 200–220; LinearXL/Charger 3.2. Peso 2550 g solo para la referencia 29/170/1,5 descrita por el fabricante. No copiar datos de A3. [Ficha B1](https://www.sram.com/en/rockshox/models/fs-zeb-ult-b1).
- **Bomber Z1 RAIL**: 29/150 negro `912-01-259`, 29/160 negro `912-01-258` y rojo `912-01-257`; aire, barras 36, dirección cónica, offset 44 y eje 15×110. Se conserva el acabado del selector; no atribuir el peso general a cada SKU. Excluir 100 mm DJ del alcance enduro/DH. El agotamiento temporal no equivale a descatalogación. [Ficha y selector](https://bike.marzocchi.com/products/bomber-z1).
- **RXF38 m.3 29/170 aire**: se completa publicación de la referencia documentada `FGMTB 3817 2510`, conservando el ID del borrador. [Ficha actual y manuales](https://www.ohlins.com/en-it/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170).

Los recursos son genéricos v1 identificados, revisados en composiciones de 23 posiciones; no certifican herrajes, logotipos ni detalles de fábrica. El lote no cierra aún todas las familias de suspensión enumeradas en este documento. El estado de aplicación y pruebas se registra en 12.

## Ampliación gravity · 21/10/2026

BoXXer Ultimate D2 y Select D2 (27.5/29, 200 mm); Bomber 58 (27.5, referencia comercial 203 mm, discrepancia de tabla 200 mm documentada); DH38 m.2 (27.5/29, aire/muelle, 200 mm). Fuentes, medidas acotadas y recursos propios en [11o](11o-ampliacion-gravity.md). No se ingiere el producto cartesiano completo de todos los recorridos/offsets. Eje 20×110 sin calificación no confirma Boost/no Boost: aviso de medida por confirmar; diferencias de dimensiones o formatos explícitos sí son conflictos.
