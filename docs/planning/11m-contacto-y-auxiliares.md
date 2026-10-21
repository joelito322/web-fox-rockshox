# 11m · Manillar, potencia, sillín y auxiliares

Actualización del 21/10/2026: el usuario autoriza añadir modelos comerciales reales de manillar, potencia, tija y sillín, con fotografía y representación 3D propias. La selección inicial acotada y sus variantes viven en [11n](11n-componentes-comerciales-de-contacto.md); los diseños ATLAS descritos abajo se conservan para montajes existentes y como opciones genéricas identificadas. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta). La ampliación mantiene las categorías y controles actuales; no añade selectores de accesorios ni un catálogo ilimitado.

## Representaciones ATLAS conservadas

| Elemento | Tratamiento | Datos necesarios |
| --- | --- | --- |
| Manillar | Genérico; sin diversificación por marca/modelo | Anchura, diámetro de abrazadera, elevación/ángulos de referencia cuando afecten a la forma; sin exigir ficha comercial extensa |
| Potencia DH | Genérica de montaje directo sobre pletina | Interfaz de montaje y abrazadera, dimensiones/anclajes para la horquilla seleccionada |
| Potencia enduro | Genérica de abrazadera al tubo de dirección | Diámetro de dirección, abrazadera de manillar, longitud/elevación de representación |
| Sillín | Genérico, sin variedad de gamas | Volumen exterior y anclaje/raíles de referencia |
| Tija | Conservar solución sencilla del inventario anterior, sin ampliar catálogo por esta indicación | Diámetro, inserción y longitud/postura; telescópica solo si se incluye esa referencia |

Las medidas de un elemento genérico describen el diseño visual ATLAS, no un producto de marca. En las tablas existentes puede identificarse bajo ATLAS como «Manillar genérico», «Potencia directa genérica», «Potencia convencional genérica» o «Sillín genérico», con procedencia de diseño propio en `sources` cuando exista una fuente web real, o en `visual_assets.reference_notes` con la ruta del documento local de diseño, `representation=generic`, recurso versionado y precio null. No atribuirle un SKU, disponibilidad o especificaciones de un fabricante real. Esto constituye la excepción explícita de auxiliares genéricos frente al catálogo comercial de las otras categorías.

No se añade un editor paramétrico libre ni una lista de medidas ficticias. Concretar las dimensiones de referencia necesarias al preparar el manifiesto; cualquier alternativa de tamaño debe aportar una diferencia útil. Las selecciones existentes de manillar/potencia/sillín pueden mantenerse simples, sin obligar a recorrer fichas comerciales extensas.

Una potencia DH no se elige automáticamente solo por la etiqueta de disciplina: se resuelve según horquilla/pletina reales. Conservar la elección manual y los avisos si se combina una potencia con una interfaz distinta. No fingir que un soporte genérico elimina incompatibilidades mecánicas.

## Auxiliares no seleccionables

Radios, cables/latiguillos, puños, dirección, patilla, adaptadores, tornillería y herrajes se resuelven como geometría o documentación asociada a las piezas pertinentes. Una polea de reenvío propia de un cuadro high-pivot pertenece a su recurso. No añadir tablas o catálogo de kits.

**Excepción confirmada:** el pedalier ya no es auxiliar fijo: tiene selector propio, según [11h](11h-pedalieres.md). El plato continúa asociado a bielas; el mando a cambio trasero; pinza y maneta al conjunto de freno. Para una tija telescópica elegida, el mando/cableado puede ser auxiliar, sin selector nuevo.

Cada elección que aparece en el montaje debe persistirse mediante su slot o identidad del conjunto que la contiene. Un auxiliar no introduce estado editable oculto que no pueda reconstruirse. Comprobar alineación, lectura clara de «Genérico», color permitido, retirada/restauración y ausencia de precios inventados.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
handlebar:
  width_mm / clamp_diameter_mm: número positivo
  rise_mm / upsweep_deg / backsweep_deg: número | null
stem:
  mount_type: steerer_clamp | direct_mount
  steerer_diameter_mm: número positivo | null
  bar_clamp_diameter_mm: número positivo
  length_mm / angle_deg: número | null
  direct_mount_interface: código/referencia del manifiesto | null
saddle:
  length_mm / width_mm: número positivo
  rail_interface: código/referencia del manifiesto
seatpost:
  diameter_mm / length_mm: número positivo | null
  insertion_mm / travel_mm: número no negativo | null
  actuation: código | null
```


Diseño concreto inicial: [Auxiliares ATLAS v1](../../supabase/catalog/atlas-auxiliaries.md). Cuatro piezas de enduro identificadas en la fuente de ingesta; no cubren todavía la potencia directa DH. No crear URLs ficticias para cumplir el campo de fuente web.

## Auxiliares DH incorporados

Potencia directa ATLAS de 40 mm/31,8 y tija fija de 31,6×250 mm, con inserción visual de 110 mm. Son dos variantes genéricas propias v2, sin SKU o precio comercial; fuente de diseño en [atlas-auxiliaries.md](../../supabase/catalog/atlas-auxiliaries.md). No se usa la tija de 34,9 ni la potencia convencional como sustituto silencioso del conjunto DH. La tornillería de potencia requiere comprobación física.
