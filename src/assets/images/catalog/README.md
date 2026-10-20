# Fotografías del catálogo

Ampliación del 19/10/2026: 40 fotografías de referencia añadidas a las imágenes anteriores. Se resuelven por slug de modelo usando el nombre del archivo WebP; `photos.json` conserva la procedencia y se usa para comprobar cobertura, sin incluir sus URLs en el bundle del cliente; la foto explícita de variante o modelo tiene prioridad. Las nuevas referencias también admiten la clave estable `catalog:<slug>` en los campos de imagen existentes. Esto permite completar el catálogo sin reingerir datos técnicos o modificar recursos 3D.

`photos.json` registra modelo, archivo, página de procedencia, URL de descarga, consulta, alcance y bytes. Los 40 WebP suman aproximadamente 1,07 MB; lado máximo de 800 px, orientación corregida y márgenes exteriores recortados. Las imágenes pequeñas de Shimano se conservan a su resolución de origen, sin agrandarlas. Las fotos existentes mantienen sus fuentes en [inventario](../../../../supabase/catalog/README.md#fotos-de-referencia-locales).

Las fuentes son las páginas de fabricantes y sus CDN, salvo la foto del cuadro Nomad 7 CC MY27 de Tribestore y la del rotor SM-RT86 de Probike. Se inspeccionaron hojas de contacto: cuadro separado, generación identificada y producto correspondiente. SRAM ZEB utiliza la toma negra de la galería B1; Schwalbe utiliza la vista de tacos de Magic Mary, sin trasladar la etiqueta radial de otra fotografía de su página. Shimano SLX M7100/M7120 muestra sus respectivas pinzas, sin atribuir a la foto un kit comercial completo.

Son fotos del modelo/familia, no certificación de talla, recorrido, compuesto, longitud, acabado o SKU seleccionados. El cuadro puede incluir un amortiguador en su foto de fabricante; esa foto no altera las piezas del montaje. Se descartan imágenes sociales de marca, otras generaciones o bicicletas completas como sustituto de un cuadro. La referencia fotográfica de Canyon conserva el fondo de estudio original.

Los derechos de las fotografías y marcas corresponden a sus titulares. Registrar una fuente no equivale a declarar una licencia abierta o una colaboración comercial. No se eliminaron marcas de agua ni se generaron imágenes con IA. El frontend sirve los archivos locales sin hotlink.

## Cobertura y pendientes

46 de los 53 modelos del inventario revisado tienen fotografía local: las 40 nuevas y seis modelos con fotos anteriores. Los siete restantes son:

- Cinco auxiliares ATLAS genéricos (manillar, potencia convencional/directa, sillín y tija), que no son productos comerciales fotografiados.
- Bielas Shimano SLX OEM: el documento identifica familia/165 mm/plato 32T pero no el modelo exacto; no asignar FC-M7100-1 por deducción.
- SCOTT Ransom RC 427727: falta una imagen verificada de esta referencia foggy grey. Se descartaron imágenes del Ransom 900 RC 425711 mistyade green con otro amortiguador.

Conservar las referencias genéricas actuales en esos casos. Completar una foto pendiente requiere una correspondencia verificable, no publicar un modelo nuevo o cambiar sus especificaciones.
