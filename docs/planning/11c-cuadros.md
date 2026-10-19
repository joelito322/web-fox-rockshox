# 11c · Ingesta documental de cuadros enduro y descenso

Categoría/slot `frame`. Cobertura indicada por el usuario: marcas con modelos enduro/DH documentados, tallas principales **M y L**. Se retira el límite anterior de cuatro cuadros y una talla. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta).

## Registro de familias

| Marca | Enduro / gravedad a estudiar | Descenso | Registro oficial |
| --- | --- | --- | --- |
| COMMENCAL | META SX V5 | SUPREME DH V5 | [META SX](https://www.commencal.com/en/bikes/frames%20%2F%20a%20la%20carte/enduro/meta%20sx%20v5/FT3MSXV5TMEXL.html?lang=en_FR), [SUPREME DH](https://www.commencal.com/us/en/bikes/frames%20%2F%20a%20la%20carte/downhill/supreme%20dh%20v5/FT3SUPV54M.html?lang=en_US) |
| Santa Cruz | Nomad | V10 | [Nomad 7](https://web.santacruzbicycles.com/pages/product-support/nomad-7-my27), [V10.8](https://www.santacruzbicycles.com/pages/product-support/v-10-8-my27) |
| Canyon | Strive; Torque con su clasificación declarada | Sender | [Enduro](https://www.canyon.com/en-dk/mountain-bikes/enduro-bikes/), [Sender](https://media-centre.canyon.com/en-INT/248858-all-new-canyon-sender-cfr-downhill-bike-unveiled-with-high-pivot-suspension-design/) |
| Trek | Slash | Session | [Slash](https://www.trekbikes.com/ca/en_CA/slash/), [Session](https://www.trekbikes.com/international/en_IN_TL/bikes/mountain-bikes/downhill-mountain-bikes/session/c/B351/) |
| SCOTT | Ransom | Gambler | [Ransom](https://www.scott-sports.com/gb/en/ransom), [Gambler](https://www.scott-sports.com/global/en/products/bike-bikes-mtb-gravity-gambler) |
| DA BOMB | Cherry Bomb 29 | Foab Bomb 275 | [Registro del fabricante](https://www.dabombbike.com/weapon.php?cid=15&f=15&m=d&pid=64); tallas y generaciones pendientes de ficha específica |
| Specialized | Enduro | Demo | [Enduro](https://www.specialized.com/ba/en/shop/bikes/mountain-bikes/trail-bikes/enduro?sortBy=price-desc&sortDirection=desc), [Demo Expert](https://www.specialized.com/ca/en/demo-expert/p/200510) |
| YT, ampliación investigada | CAPRA | TUES | [Catálogo oficial](https://www.yt-industries.com/en-uk/Bikes/) |
| Giant, ampliación investigada | Reign | Glory, vigencia/generación por confirmar | [Reign](https://www.giant-bicycles.com/discover/en-us/mountain-biking/enduro/reign), [registro histórico Glory DH](https://www.giant-bicycles.com/_upload_in/bikes/models/brochure/2007/GloryDH.pdf) |

Las siete primeras marcas forman la cobertura solicitada de investigación. YT/Giant responden a buscar otras con registros; no declaran cerrada una lista mundial. Ampliar con otra marca exige identificar modelo, generación, tallas y referencia suficiente, sin un modelo ficticio por cada disciplina. Solo se ingesta gama actual documentada: el registro histórico de Glory demuestra antecedentes, pero queda fuera hasta localizar su oferta actual. Igual criterio para cualquier catálogo/registro de servicio antiguo. No incorporar e-MTB con motor/batería por compartir nombre con un cuadro convencional.

## Campos de cada talla/variante

| Grupo | Datos tipados | Validación |
| --- | --- | --- |
| Identidad | Marca, modelo, generación/año, material, denominación de talla original | M y L reales cuando existan; dos variantes físicas, no dos rótulos del mismo recurso |
| Geometría | Reach, stack, tubo superior efectivo, tubo de sillín, dirección, vainas, distancia entre ejes, altura/caída de pedalier y ángulos | mm/grados, postura y fuente por talla; no completar con la talla vecina |
| Ruedas | Formato delantero/trasero, BSD y restricciones de neumático conocidas | Admitir mullet documentado; no multiplicar todas las combinaciones 27.5/29 |
| Suspensión | Tipo, recorrido trasero, longitud/carrera y anclajes de amortiguador | Postura estática de referencia; no simulación cinemática |
| Interfaces | Dirección, eje trasero, patilla/montaje de cambio, caja de pedalier, tija/abrazadera, freno | Estándar completo, dimensiones y restricciones verificadas |
| Montaje delantero | Rango/tipo de horquilla admitida y referencia eje-corona si consta | Una horquilla doble pletina no se valida solo por poder dibujarse |
| Acabados | Material, zonas pintables y opciones reales | Color libre solo según habilitación; no inventar edición de fábrica |
| Referencias | Fotos/vistas, tabla geométrica, manual, fecha y recurso visual | Silueta preparada para cada modelo y talla; estimaciones identificadas |

### Tallas que no se llaman M/L

Conservar la nomenclatura del fabricante: [Specialized S-Sizing](https://www.specialized.com/us/en/s-sizing) y tallajes de geometría no son equivalencias universales con M/L. Registrar la talla original y su geometría; proponer las dos tallas pertinentes con esa documentación antes de publicarlas. No renombrar S3 como M ni S4 como L por suposición. Si un modelo no ofrece ambas tallas, registrar la excepción en vez de crear una variante inexistente.

## Ensamblaje y aceptación

Cada recurso declara pedalier como origen, ejes, dirección, tija, anclajes de amortiguador, montaje de frenos/cambio y, si procede, polea de reenvío asociada al cuadro. Una transmisión high-pivot necesita recorrido visual de cadena coherente; no se añade selector de polea ni motor de simulación.

Las prearmadas usan una talla concreta y piezas concretas verificadas; no se duplica una composición M en L sin comprobar interfaces. Se conservan ejemplos ATLAS iniciales de enduro/DH como recorridos de aceptación, sin que sustituyan el resto del inventario acordado. «Fábrica» exige composición oficial exacta.

Aceptar cada cuadro y talla implica comparar silueta/vistas, anclajes, proporciones M/L, guardar y recuperar; no basta con cargar una bicicleta de referencia. No prometer holguras o compatibilidad de fabricación a partir de recursos aproximados.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
size_label: talla original documentada
material / suspension_type: código documentado | null
wheel_front / wheel_rear: código | null
geometry:
  reach_mm / stack_mm / effective_top_tube_mm: número positivo | null
  seat_tube_mm / head_tube_mm / chainstay_mm / wheelbase_mm: número positivo | null
  head_angle_deg / seat_angle_deg: número en (0, 180) | null
  bb_height_mm: número positivo | null
  bb_drop_mm: número con signo | null
  reference_position: texto de postura documentada
rear_travel_mm: número no negativo | null
shock_fit: null | {eye_to_eye_mm, stroke_mm, upper_mount, lower_mount, restrictions}
headset_standard / rear_axle_standard / derailleur_mount: código | null
bb_shell: null | {standard, width_mm, diameter_mm, thread}
seatpost_diameter_mm / seat_clamp_diameter_mm: número positivo | null
brake_mount: código | null
fork_restrictions / tire_clearance_notes: texto de fuente | null
weight_g: número positivo | null
maintenance: objeto común | null
```
