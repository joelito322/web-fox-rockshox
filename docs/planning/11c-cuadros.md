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

## Primer lote concreto investigado durante implementación · 19/10/2026

[Fuente de ingesta](../../supabase/catalog/initial-reviewed.json): COMMENCAL META SX V5 Team Cloud, tallas originales M y L, **en borrador**. Se contrastó la [ficha actual de cuadro](https://www.commencal.com/en/bikes/frames%20%2F%20a%20la%20carte/enduro/meta%20sx%20v5/FT3MSXV5TMEXL.html?lang=en_FR), cuya tabla incluye las geometrías M/L. El identificador del enlace corresponde a una opción de talla; no se inventaron códigos de fabricante para M/L a partir de ese identificador.

Datos incorporados: geometría M/L documentada, ruedas 29/27,5, recorrido 165, amortiguador 230 × 65, caja PF92, eje trasero 12 × 148 y tija 34,9. No se asignó el peso general del cuadro a ambas tallas. El valor «+4» rotulado como altura de pedalier resulta ambiguo: se dejó sin interpretar en vez de convertirlo en una altura o caída falsa.

El manifiesto visual conserva posiciones estimadas identificadas y separadas de `specs`; no certifica los anclajes reales del amortiguador ni el movimiento de la suspensión. Revisión de silueta, proporciones y versiones pendiente de 05. Este lote no completa otras familias COMMENCAL, el descenso ni las demás marcas del alcance.

### Continuación de ingesta: SUPREME DH V5

Fuente comercial actual comprobada el 19 de octubre de 2026: [cuadro Clear Silver M/L](https://www.commencal.com/fr/bikes/cadres%20%2F%20a%20la%20carte/downhill/supreme%20dh%20v5/FT3SUPV54M.html?lang=fr_FR). Registrar geometría Low por talla, sin convertir la fila ambigua de altura de pedalier en una altura absoluta. Entreojos 250×75, rueda 29/27,5, caja Press Fit 107 y eje 12×157. La incompatibilidad expresa con Float X2 2026 debe conservarse en restricciones. El recurso v2 identifica la polea y las bieletas como aproximadas.

La composición ATLAS reutiliza piezas publicadas compatibles en las medidas conocidas, completadas con doble pletina FOX 40, transmisión SRAM DH, pedalier DUB PF107, bujes apropiados y auxiliares propios. Es un ejemplo de montaje; no se presenta como bicicleta de fábrica ni certificación de competición. Se valida como parte de las fases 08, primero con fuente local y vista de revisión, después en Cloud y navegador.

## Ampliación concreta por marca · 19/10/2026

Fuente preparada: [`frames-reviewed.json`](../../supabase/catalog/frames-reviewed.json), seis modelos, doce variantes seleccionables y dos capturas anteriores. La publicación se condiciona a comprobar la ingesta, recursos por talla y recorrido real de selección/guardado; este documento no equivale por sí solo a datos aplicados.

| Modelo actual | Tallas originales | Referencia geométrica | Suspensión y ruedas |
| --- | --- | --- | --- |
| Santa Cruz Nomad 7 CC MY27 | M / L | Hi, reach 455/475 y wheelbase 1246/1276 mm | 170 mm, 230×65, MX |
| Canyon Sender CFR high-pivot | M / L | MX predeterminada, reach 468/495 y wheelbase 1273/1303 mm | 200 mm, 250×75, MX; eje trasero 12×148 |
| Specialized S-Works Enduro UDH | S3 / S4 | Low BB, reach 464/487 y wheelbase 1246/1274 mm | 170 mm, 205×60 Trunnion, 29/29 |
| DA BOMB Cherry Bomb 29 | 17″ / 19″ | Tabla oficial 2026, reach 442,2/459,2 y wheelbase 1184,9/1206,1 mm | 147 mm, 210×55, 29/29 |
| SCOTT Ransom RC, artículo 427727 | M / L | Manual de plataforma enlazado por el producto actual, reach 458/483 y wheelbase 1238,8/1270,4 mm | 170 mm, 205×65 Trunnion, 29/29 de referencia |
| Trek Slash AL Gen 6 | M / L | MX predeterminada, reach 448/488,1 y wheelbase 1223,8/1277,7 mm | 170 mm, 230×65, MX y polea |

Fuentes oficiales actuales: [Nomad soporte MY27](https://web.santacruzbicycles.com/pages/product-support/nomad-7-my27) y [selector de cuadro/acabado/SKU](https://web.santacruzbicycles.com/products/nomad-frame-2027); [Sender CFR](https://www.canyon.com/en-gb/mountain-bikes/downhill-bikes/sender/sender-cfr-underdog/4448.html); [S-Works Enduro](https://www.specialized.com/qa/en/s-works-enduro-frameset/p/4276009); [Cherry Bomb 29](https://www.dabombmtb.com/product_detail/CherryBomb29/) y [geometrías vigentes](https://www.dabombmtb.com/supports/FRAME-GEOMETRY/); [Ransom RC 427727](https://www.scott-sports.com/global/en/product/scott-ransom-rc-frame-shock) y [manual enlazado](https://static.scott-sports.com/image/upload/v1778094871/2118622.pdf); [Slash AL frameset](https://www.trekbikes.com/us/en_US/bikes/mountain-bikes/trail-mountain-bikes/slash/f/F341/slash-al-gen-6-frameset/42271/) y [Slash AL con tabla de geometría](https://www.trekbikes.com/ie/en_IE/bikes/mountain-bikes/trail-mountain-bikes/slash/f/F341/slash-9-gx-axs-t-type-gen-6/41669/).

Los selectores dinámicos de Trek pueden responder solo con el contenedor de la familia: se conserva la identificación AL Gen 6 y la tabla MX contrastada, sin trasladar pesos/interfaces de un Slash de carbono. El manual Ransom rotulado 2024 sigue enlazado por el artículo actual; no se transforma esa fecha en año comercial de 427727. La tabla DA BOMB 2026 prevalece sobre el antiguo PDF que rotulaba otras medidas/tallas. No se hereda de Nomad 6 la holgura de neumático de Nomad 7.

Se conservan S3/S4 y 17″/19″ sin renombrarlos M/L. Los pesos de conjuntos con amortiguador o sin talla verificable no pasan a peso de cuadro desnudo. Medidas desconocidas, alturas ambiguas y SKU ausentes permanecen sin completar. Los acabados comerciales tienen nombres originales; el color del visor es aproximado, sin prometer una muestra de pintura.

Cada talla obtiene un recurso genérico v2 propio y anclajes explícitamente estimados. El visor conserva distancia entre ejes/reach/stack por talla y recorrido de cadena con polea en Sender/Slash; no reproduce el carenado integrado Ransom ni las bieletas/cinemáticas exactas de las marcas. No se modifican recursos publicados de COMMENCAL ni se atribuyen composiciones de fábrica a estos nuevos cuadros. Queda investigar otras familias enduro/DH del registro y completar aceptación visual integral.

El [manual Enduro 2025 enlazado por la ficha actual](https://media.specialized.com/support/collateral/2025_ENDURO_USER_MANUAL_ENGLISH.pdf), secciones 3.1/4.4, confirma BSA y anchura 73 mm. Para completar esta medida sin sobrescribir lo publicado, conservar las dos capturas anteriores como no seleccionables y crear una nueva referencia por talla con caja de 73 mm y el mismo recurso visual. El producto/modelo no se descataloga. La fecha del manual no asigna año comercial al cuadro.

```text
Catálogo normal → S3 actual / S4 actual, caja BSA 73
Enlace anterior → captura anterior conservada; fuera de nuevas selecciones
Montaje guardado → misma referencia y mismo recurso que se guardaron
```

La ficha normal prioriza variantes seleccionables; un enlace explícito a una referencia anterior conserva su detalle y avisa que no se aplica a un montaje nuevo. No duplicar las tallas en el selector normal ni reemplazar referencias de montajes guardados.
