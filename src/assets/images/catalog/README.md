# Fotografías del catálogo

Ampliación del 19/10/2026: 40 fotografías de referencia añadidas a las imágenes anteriores. Se resuelven por slug de modelo usando el nombre del archivo WebP; `photos.json` conserva la procedencia y se usa para comprobar cobertura, sin incluir sus URLs en el bundle del cliente; la foto explícita de variante o modelo tiene prioridad. Las nuevas referencias también admiten la clave estable `catalog:<slug>` en los campos de imagen existentes. Esto permite completar el catálogo sin reingerir datos técnicos o modificar recursos 3D.

`photos.json` registra modelo, archivo, página de procedencia, URL de descarga, consulta, alcance y bytes. Los 40 WebP suman aproximadamente 1,07 MB; lado máximo de 800 px, orientación corregida y márgenes exteriores recortados. Las imágenes pequeñas de Shimano se conservan a su resolución de origen, sin agrandarlas. Las fotos existentes mantienen sus fuentes en [inventario](../../../../supabase/catalog/README.md#fotos-de-referencia-locales).

Las fuentes son las páginas de fabricantes y sus CDN, salvo la foto del cuadro Nomad 7 CC MY27 de Tribestore y la del rotor SM-RT86 de Probike. Se inspeccionaron hojas de contacto: cuadro separado, generación identificada y producto correspondiente. SRAM ZEB utiliza la toma negra de la galería B1; Schwalbe utiliza la vista de tacos de Magic Mary, sin trasladar la etiqueta radial de otra fotografía de su página. Shimano SLX M7100/M7120 muestra sus respectivas pinzas, sin atribuir a la foto un kit comercial completo.

Son fotos del modelo/familia, no certificación de talla, recorrido, compuesto, longitud, acabado o SKU seleccionados. El cuadro puede incluir un amortiguador en su foto de fabricante; esa foto no altera las piezas del montaje. Se descartan imágenes sociales de marca y otras generaciones. Las fichas de cuadros muestran exclusivamente el cuadro separado, nunca una bicicleta completa. Las fotos de montaje completo se conservan solo como fuente de investigación. La referencia original de Canyon incluía fondo de estudio; el archivo servido ahora usa el recorte del 21/10 indicado abajo.

Los derechos de las fotografías y marcas corresponden a sus titulares. Registrar una fuente no equivale a declarar una licencia abierta o una colaboración comercial. No se eliminan marcas de agua. Los recortes de fondo realizados con imagegen el 21/10 se identifican abajo y no se presentan como fotografías originales sin retoque. El frontend sirve los archivos locales sin hotlink.

## Cobertura histórica · 19/10/2026

46 de los 53 modelos del inventario revisado tienen fotografía local: las 40 nuevas y seis modelos con fotos anteriores. Los siete sin fotografía en ese momento eran:

- Cinco auxiliares ATLAS genéricos (manillar, potencia convencional/directa, sillín y tija), que no son productos comerciales fotografiados.
- Bielas Shimano SLX OEM: el documento identifica familia/165 mm/plato 32T pero no el modelo exacto; no asignar FC-M7100-1 por deducción.
- SCOTT Ransom RC 427727: falta una imagen verificada de esta referencia foggy grey. Se descartaron imágenes del Ransom 900 RC 425711 mistyade green con otro amortiguador.

Conservar las referencias genéricas actuales en esos casos. Completar una foto pendiente requiere una correspondencia verificable, no publicar un modelo nuevo o cambiar sus especificaciones.

## Actualización de complementos · 21/10/2026 (antes de gravity)

El catálogo ampliado tiene 59 modelos: los 53 anteriores y seis referencias comerciales de Renthal, DEITY, OneUp y WTB. Cada modelo cuenta ahora con imagen local: 54 referencias fotográficas (de familia o montaje OEM, con su alcance) y cinco vistas de la geometría ATLAS. Las imágenes de genéricos son renders de sus modelos existentes, no fotografías de otro producto comercial. Procedencia de fotos en `photos.json`; renders en `renders.json`.

- Canyon Sender: recorte del cuadro real sin el fondo de estudio.
- Marzocchi Bomber CR y Z1 RAIL negra/roja: eliminación del fondo gris; la variante roja mantiene su referencia roja. Los Z1 nuevos usan WebP con alfa, conservando los JPG originales como fuente histórica.
- ROCKBROS 2017-12: pedales aislados sin cabecera promocional ni fondo oscuro; marca impresa en el producto conservada.
- SCOTT Ransom RC: foto del artículo **427727 / Foggy Grey** del distribuidor 99 Bikes, identidad contrastada con la ficha SCOTT oficial; no se usa el cuadro 425711 de otra generación.
- Shimano SLX OEM 165/32: referencia aislada de la foto oficial del montaje META SX. Conserva un pequeño tramo de cadena que tapa el plato en la fuente; no significa que la cadena esté incluida. No se atribuye FC-M7100-1 por deducción. Sigue siendo una referencia de montaje OEM, no identificación de un SKU desconocido.
- Renthal Fatbar35 AluGold, DEITY Racepoint35 White, Renthal APEX35 V2 Black, Renthal INTEGRA35 Black/AluGold y OneUp V3 180: fotografías del fabricante recortadas. En los Renthal se elimina también el reflejo, para que no parezcan dos productos. WTB Volt Fusion Form Titanium usa el PNG original con transparencia. Medidas y fuentes exactas en [11n](../../../../docs/planning/11n-componentes-comerciales-de-contacto.md).

Los recortes se hicieron con la herramienta integrada **imagegen**, sobre los originales inspeccionados, y se exportaron a WebP con alfa y lado máximo 800 px. Se conserva el producto, perspectiva, color, marca y herrajes; no se pretende certificar identidad píxel a píxel tras el retoque. Algunas referencias conservan sombra fotográfica suave; no una escena o rectángulo de estudio. Las fotografías anteriores con fondo blanco no intervenidas conservan su archivo/fuente.

Prompt común de los recortes:

```text
Make a clean genuine alpha-transparent cutout of the original real product photograph.
Keep the product itself unchanged: no redesign, new parts, invented geometry,
recoloring, new text or logos. Background visible through holes must be transparent.
Remove studio floor, cast shadows and reflected copies, preserving only the one
actual product. Center tightly with a small even transparent margin.
```

Indicaciones específicas: conservar los ojos del amortiguador y huecos entre tubos; conservar pinzas/tornillería y el color de cada variante; para ROCKBROS retirar solo el texto promocional exterior; para Renthal conservar el objeto superior y eliminar su reflejo inferior; para OEM aislar brazo derecho/plato y conservar el segmento de cadena que realmente los tapa. Los prompts y límites por archivo se registran en `photos.json`; los Z1 y ROCKBROS también conservan la fuente histórica en el README del catálogo Supabase.

Los cinco ATLAS se reproducen con `node scripts/generate-generic-component-images.mjs --apply`, leyendo sus variantes publicadas y renderizando el mismo recurso de montaje sobre fondo transparente. No modifica el catálogo Cloud ni la geometría publicada. Las fotos comerciales se resuelven por slug y las variantes conservan prioridad sobre la imagen general del modelo.

## Ampliación gravity · 21/10/2026

Cobertura actual: **70 modelos con imagen**, 64 referencias fotográficas y seis renders del recurso real. Esta actualización añade diez referencias comerciales, dos fotos alternativas de color (BoXXer negro y Bomber 58 rojo) y un render del FRS. Las coberturas 46/53 y 59/59 anteriores son snapshots históricos.

Procedencia y hashes originales en `photos.json` y `models/catalog-v9/references/photos.json`. Imágenes nuevas optimizadas a lado máximo 800 px; canales alfa nativos en V10/TUES/CAPRA/BoXXer, y recortes con **imagegen integrado** en GT Fury/Force, Bomber 58 negro/rojo, DH38 y Furious. Prompt empleado: «Remove only the studio background and floor shadow. Preserve the complete product, shape, proportions, paint and existing markings; transparent holes, no invented pieces, no halo or new shadows». No se usa generación de una bicicleta inventada como fotografía de producto.

La foto del DH38 muestra el chasis Coil sin coronas: referencia exterior común, no fotografía de cada sistema de resorte ni de un conjunto comercial con coronas. TUES/CAPRA/Furious usan el cuadro aislado mediante imagegen integrado a partir de su fotografía original; se retiran ruedas, horquilla, transmisión, sillín y demás componentes. Las superficies antes ocultas son reconstrucciones visuales, no documentación del fabricante. La vista 3D y las miniaturas de montajes conservan su estado real guardado.

FRS: tres intentos de recorte sobre la foto oficial dejaron halo y **no se publican**. La tarjeta utiliza `commencal-frs-v3.webp`, render transparente del GLB publicado, generado por `scripts/generate-gravity-reference-images.mjs --apply`; registro en `renders.json`. La foto original permanece en `models/catalog-v9/references/frs-frame.webp`. La etiqueta «Referencia visual» evita presentar renders como fotografías. La rotulación del recurso 3D es aproximada.

No se retiraron fondos de fotografías históricas que esta ampliación no modifica. El retoque de una foto tampoco convierte sus proporciones o superficies ocultas en evidencia de CAD.

## Corrección de cuadros aislados · 21/10/2026

Revisados los 15 cuadros. Se reemplazan TUES MK4, CAPRA MK3 MX y Furious 2021 por imágenes de cuadro separado, con alfa real y sin componentes del montaje. Herramienta: imagegen integrado, modo de edición. Prompts exactos y rutas finales en `photos.json` (`editing.prompt` y `file`). Se descarta el primer ensayo de Furious por alterar la marca; se repite desde el original de mayor resolución. Las fuentes originales de investigación y los GLB permanecen intactos.
