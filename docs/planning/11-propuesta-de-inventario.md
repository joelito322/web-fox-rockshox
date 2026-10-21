# 11 · Inventario e ingesta documental por categoría

Estado: inventario en ejecución desde el 19 de octubre de 2026. Actualización del 21/10: `cockpit-reviewed.json` añade seis modelos comerciales de contacto con recursos v8, para **59 modelos y 120 variantes seleccionables actuales**. Las cifras siguientes de cinco fuentes conservan la base histórica; no sustituyen esta ampliación. Conserva la cobertura ampliada por el usuario y sustituye la propuesta anterior de cuatro cuadros/una talla. Existen cinco fuentes de catálogo en Cloud: `initial-reviewed.json`, `braking-reviewed.json`, `suspension-reviewed.json`, `frames-reviewed.json` y `tyres-reviewed.json`, bajo `supabase/catalog/`. Suman 53 modelos y 128 variantes; los 53 modelos y 116 variantes están publicados (114 seleccionables y dos capturas anteriores), y doce variantes permanecen en borrador. Hay dos familias de ejemplos ATLAS de enduro/descenso, con cuatro composiciones M/L de 23 posiciones. La cobertura comercial completa sigue pendiente; ver [12](12-estado-implementacion.md).

El usuario solicita un registro amplio por categorías, con modelos, campos y validaciones en Markdown específicos. Esta carpeta contiene el contrato y el registro inicial de familias localizadas con fuentes oficiales. **No constituye todavía una ingesta exhaustiva de todos los SKU, generaciones y medidas del mercado**: las referencias físicas incompletas se identifican como pendientes y no se publican ni se inventan.

**Delimitación ampliada el 21/10/2026:** el usuario autoriza también generaciones anteriores identificadas. Toda referencia exige evidencia de identidad, generación y medidas; solo se declara vigente si existe evidencia comercial actual. [11o](11o-ampliacion-gravity.md) concreta la ampliación gravity.

## Cobertura indicada por el usuario

- Horquillas y amortiguadores FOX, RockShox, Öhlins y Marzocchi; aro donde aplique, aire/muelle, generación, diseño, ajustes y mantenimiento específicos.
- Cuadros enduro y descenso: COMMENCAL, Santa Cruz, Canyon, Trek, SCOTT, DA BOMB y Specialized; investigar otras marcas con registros pertinentes. Tallas principales M y L, conservando el tallaje original cuando sea diferente.
- Frenos Shimano, Magura y SRAM, sus gamas y referencias documentadas, incluidos 2 y 4 pistones donde existan.
- Cambios traseros con mando asociado y cassettes Shimano/SRAM; cadena correspondiente documentada.
- Pedalieres seleccionables por marca/tipo; bielas con plato/catalina incluido, sin selector independiente de plato.
- Pedales ROCKBROS y otras marcas verificables; aros, bujes y neumáticos de distintas marcas y medidas.
- Neumáticos Maxxis, CST, Kenda, Michelin y Schwalbe, con carcasa/compuesto y orientación de terreno respaldada por fuente.
- Actualización del 21/10/2026: modelos comerciales reales de manillar, potencia, tija y sillín con imágenes y recursos propios, en una selección inicial acotada de seis familias según [11n](11n-componentes-comerciales-de-contacto.md). Conservar genéricos ATLAS y montajes anteriores; sin editor paramétrico libre ni categorías nuevas.

Las marcas se normalizan a su denominación real: Öhlins, Marzocchi, DA BOMB, ROCKBROS. No se crean marcas nuevas a partir de errores de transcripción. «Y las demás» abre investigación de referencias, no una promesa sin límite de haber catalogado el mercado mundial.

## Índice de ingesta

| Documento | Modelos y campos que gobierna |
| --- | --- |
| [11a · Horquillas](11a-horquillas.md) | Marcas, pletinas, aro, resorte, hidráulico, recorrido, ejes y mantenimiento |
| [11b · Amortiguadores](11b-amortiguadores.md) | Aire/muelle, medidas, anclajes, depósito, ajustes y mantenimiento |
| [11c · Cuadros](11c-cuadros.md) | Registro enduro/DH, tallas M/L, geometría e interfaces |
| [11d · Frenos](11d-frenos.md) | Gamas, pinza/maneta, pistones, fluido y servicio |
| [11e · Discos](11e-discos.md) | Familias, diámetros, espesor y anclajes |
| [11f · Cambios y mandos](11f-cambios.md) | Shimano/SRAM, ecosistemas, velocidades y mando asociado |
| [11g · Cassettes y cadenas](11g-cassettes-y-cadenas.md) | Piñones, núcleo, dentado y cadena por sistema |
| [11h · Pedalieres](11h-pedalieres.md) | Marcas, caja, eje, interfaces y selección independiente |
| [11i · Bielas y platos](11i-bielas-y-platos.md) | Conjuntos, longitudes, eje, dentado y línea de cadena |
| [11j · Pedales](11j-pedales.md) | Plataformas/otros tipos, medidas, material e interfaz |
| [11k · Aros y bujes](11k-aros-y-bujes.md) | Marcas, ETRTO, agujeros, eje, disco y núcleo |
| [11l · Neumáticos](11l-neumaticos.md) | Marcas/modelos, medida, carcasa, compuesto y suelo |
| [11m · Contacto y auxiliares](11m-contacto-y-auxiliares.md) | Genéricos ATLAS conservados y contratos de interfaz |
| [11n · Complementos comerciales](11n-componentes-comerciales-de-contacto.md) | Renthal, DEITY, OneUp y WTB: seis modelos documentados, fotos y recursos v8 |

Estos documentos detallan los contratos de [03a](03a-esquema-y-campos.md); no crean trece tablas ni un proceso nuevo. Las ocho tablas de negocio y cuatro IAM permanecen. Campos de una misma responsabilidad se mantienen juntos: no un MD por columna o por acabado.

```text
Marca → familia comercial → generación y versión física → acabados
                            ├── especificaciones y fuentes
                            ├── mantenimiento aplicable
                            └── representación 3D versionada

Cuadro/talla → interfaces → piezas por slot → montaje visual guardado
```

## Contrato común de ingesta

Los campos comunes se definen una sola vez aquí y en el árbol de [03a](03a-esquema-y-campos.md); cada MD agrega campos específicos. No duplicar una propiedad en una columna y JSONB como fuentes editables distintas.

| Destino existente | Campos que se completan | Condición |
| --- | --- | --- |
| `brands` | `id`, `name`, `slug`, `region`, `published` | Nombre normalizado; región null si no consta |
| `components` | `id`, `brand_id`, `name`, `slug`, `category`, `disciplines`, `description`, `technical_notes`, `image_key`, `sources`, `published` | Familia identificada y uso documentado; foto ausente admite placeholder, no una foto de otra pieza como exacta |
| `component_variants` | `id`, `component_id`, `label`, `model_year`, `generation`, `manufacturer_code`, `image_key`, `sources`, `specs_schema_version`, `specs`, `price_reference`, `allowed_finishes`, `visual_asset_id`, `representation`, `published`, `selectable` | Una combinación física real, con las excepciones genéricas de 11m explícitas; año/SKU desconocidos null |
| `visual_assets` | `id`, `kind`, `storage_path` o `generator_key`, `manifest`, `reference_notes`, `published` | Recurso/manifiesto versionado obligatorio para publicar como seleccionable, incluso si es genérico |
| `bike_presets` / items | Identidad, clase fábrica/ejemplo, talla mediante cuadro, fuente y una variante por slot | Composición concreta; no copiar todas las tallas ni llamar fábrica a un ejemplo ATLAS |
| `build_items` / preset items | `slot`, `variant_id`, `finish_id`, `custom_color`, relaciones/IDs existentes | Pedalier en su nuevo slot; sin fila separada para plato o mando asociado |

### Evidencia y valores desconocidos

Para cada familia registrar URL oficial y fecha de consulta, disciplina declarada y estado documental. Para cada variante añadir fuente de la combinación concreta y de sus atributos; un catálogo de familia no demuestra todos sus SKU. Mantener la denominación y unidad original cuando evite confusiones, con conversión de unidades explícita si se normaliza.

Estados **solo documentales**, sin columnas nuevas: familia localizada; vigencia por confirmar; variante por completar; variante documentada; recurso pendiente; lista para publicar; excluida por histórica/discontinuada. «Lista para publicar» exige datos y recurso comprobados; no es sinónimo de «ya ingerida». Los registros iniciales de 11a–11l están a nivel de familia salvo donde se identifique un código; la revisión completa de medidas/SKU sigue pendiente.

Valores desconocidos null, nunca cero, rangos combinados ni medidas del recurso estimado copiadas a la ficha. Una dimensión visual puede estimarse para una representación identificada; una característica comercial o intervalo de servicio no se inventa. El recurso puede compartirse cuando corresponda, manteniendo parámetros/versiones de cada variante.

### Mantenimiento por referencia

`specs.maintenance` es un objeto opcional del contrato de categoría; no una tabla, perfil del ciclista o agenda. Cuando no hay información verificada es null. Si existe, contiene:

| Propiedad | Tipo y uso |
| --- | --- |
| `documents` | Lista de `{title, url, revision}`; revisión null si no figura; URL oficial del manual aplicable |
| `tasks` | Lista de `{name, interval_hours, interval_months, interval_text, conditions, source_url}` |
| Intervalos | Números positivos o null; `interval_text` conserva la instrucción original y su lógica («lo que ocurra antes», condiciones de uso, etc.) |
| Aplicabilidad | Modelo/generación y versión cubiertos, indicados en la nota/fuente de la variante |

Una tarea puede tener intervalos null si la fuente solo indica una condición; no convertir una inspección previa a cada salida en un número inventado de horas. Aire/muelle no basta para determinar el mantenimiento: revisar hidráulico, generación y manual. No copiar a todas las piezas un intervalo de 50/100/200 horas, ni añadir recordatorios, seguimiento de uso o gestión de taller.

### Variantes, vigencia y precio

Generación, aro, recorrido, tipo de resorte, carcasa/compuesto, interfaces o medidas técnicas pueden cambiar la identidad física. Un acabado cosmético no exige otra variante. No cruzar todas las opciones publicadas para fabricar combinaciones inexistentes.

Se pueden ingerir gama actual y generaciones históricas documentadas, según la ampliación expresa del usuario del 21/10/2026. Una página de servicio o despiece no demuestra vigencia: comprobar catálogo/producto actual y referencia física, registrando URL y fecha. Un manual antiguo puede aplicar a una referencia actual si el fabricante lo vincula; no equivale a una generación nueva. Los históricos pueden incorporarse identificando año/generación y su condición de archivo, sin atribuirles vigencia actual. Sin evidencia suficiente, «vigencia por confirmar», sin publicar. La falta de stock temporal no determina por sí sola la retirada del fabricante. La retirada posterior de una variante ya ingerida conserva las reglas de 03 para montajes existentes.

Precio orientativo solo con importe, moneda, mercado, fuente y fecha de la variante observada. Sin evidencia suficiente, null. Los genéricos ATLAS no llevan precio comercial inventado.

## Validaciones completas antes de publicar

1. Vigencia actual, identidad, categoría y combinación física verificadas; talla M/L o denominación original correcta, sin equivalencias supuestas.
2. `specs` con tipos/unidades y claves admitidas por versión; rangos coherentes, null explícito y tamaño acotado. `maintenance` estructurado y respaldado por fuente cuando se incluya.
3. Interfaces de ambas piezas verificadas o incertidumbre registrada; distinguir error de datos de conflicto mecánico permitido.
4. Acabados/nodos, color habilitado y fuente visual; toda variante seleccionable montable en 3D con recurso publicado versionado.
5. Selección, sustitución, retirada/deshacer, avisos, guardado y recuperación para cada variante acordada; estados pendientes o fallidos no aparentan aplicación.
6. Filtros y comparación de hasta tres variantes de la misma categoría, sin mezclar atributos de distintas versiones. Incluir aro, talla, tipo de resorte, pistones o terreno solo donde aplique y existan datos.
7. Prearmadas por talla con posiciones completas del inventario acordado, pedalier incluido y fuentes que distingan fábrica/ejemplo.

## Estado y pendientes de la ingesta documental

Esta actualización completa la **separación por categoría, los grupos de campos y los criterios de validación**. Amplía el registro de familias localizadas para las marcas solicitadas. No se declara terminada la recogida de todos los valores de cada variante: faltan fichas concretas, generaciones y medidas, tallas no equivalentes, manuales aplicables y preparación de recursos.

Se retira la pregunta anterior de «dos o cuatro cuadros»: la dirección vigente es cobertura por marcas/modelos actuales documentados y M/L. Los dos ejemplos ATLAS enduro/DH siguen siendo recorridos de prueba y propuesta de contenido, sin limitar el catálogo ni sustituir su aceptación integral.

Delimitación temporal actualizada por el usuario: gama actual y generaciones anteriores identificadas (11o). Completar la evidencia de vigencia y los campos de cada referencia es una tarea de las fases 1–3 del plan de implementación, con comprobación de cobertura en 4–6 según 08. La ingesta documental no se declara cerrada hasta completar esa tarea; no es un requisito externo previo al inicio del plan. Esta redacción inicial no acreditaba una ingesta real. La implementación fue autorizada posteriormente y su estado vigente está en 12.

- [11o · Ampliación gravity](11o-ampliacion-gravity.md): once modelos adicionales de cuadros/horquillas, actuales e históricos identificados.
