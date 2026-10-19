# 11a · Ingesta documental de horquillas

Categoría `fork`, slot `fork`. Marcas solicitadas: FOX, RockShox, Öhlins y Marzocchi. Aplican [campos comunes y estados](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [representación](05-configurador-3d.md). Familias localizadas no equivalen a variantes completas publicables.

## Familias a desglosar

| Marca | Familias de investigación | Desglose obligatorio |
| --- | --- | --- |
| FOX | 36, 38, 40, Podium | Generación, edición comercial/hidráulico real, aro y recorrido; distinguir simple/doble pletina. [36](https://ridefox.com/pages/fox-36), [38](https://ridefox.com/pages/fox-38), [40](https://ridefox.com/pages/fox-40), [Podium](https://ridefox.com/products/podium) |
| RockShox | Lyrik, ZEB, BoXXer, Domain; Psylo según aplicación; Yari con vigencia por confirmar | Nivel y código reales de cada generación; el índice incluye referencias de servicio, sin probar vigencia comercial. [Series oficiales](https://www.sram.com/en/rockshox/series), [Psylo](https://www.sram.com/en/rockshox/series/psylo?filters=&sort=Relevancy) |
| Öhlins | RXF36, RXF38, DH38 | Revisión M.x y versión aire/muelle documentada, sin duplicar por simetría. [Catálogo MTB](https://www.ohlins.com/en-us/mountain-bike), [RXF38 M.3 29/44/170](https://www.ohlins.com/en-us/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170) |
| Marzocchi | Bomber Z1, Z1 Coil, Super Z, Bomber Z, Bomber 58 | Separar originales, revisiones y conversiones; no asignar a la Z1 actual las especificaciones de una Z1 antigua. [Manuales y familias](https://bike.marzocchi.com/pages/product-service-manuals) |

FOX 34, RockShox SID y otros productos de categorías distintas no se incorporan solo por compartir marca. Se revisa uso declarado antes de ampliar el catálogo enduro/DH. Solo gama actual documentada: un modelo histórico localizado no se ingesta; distinguir listado de servicio de producto vigente. La Z1 Coil requiere demostrar una oferta comercial actual, y no solo un kit o manual histórico.

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
