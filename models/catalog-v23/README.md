# Specialized S-Works Enduro UDH · v23

Revisión individual de las tallas comerciales **S3/S4**, sin renombrarlas M/L ni alterar medidas o acabados. Conserva todos los anclajes salvo el marcador estimado de sillín de la nueva identidad, cuya excepción se detalla abajo. Predecesores GLB v13; los restantes catorce cuadros conservan sus capturas. Montajes históricos y prearmadas permanecen en su identidad. Publicación coordinada después de META v21 y Nomad v22; no ejecutar la auditoría previa contra un snapshot anterior.

## Evidencia de forma

Tres fotografías originales 2025 de Specialized: lateral, diagonal delantera y diagonal trasera; las tres se inspeccionaron realmente. Se conservan en `references/` con sus URLs/SHA en `sources.json`. El manual oficial **2025 Enduro**, descargado y leído, confirma la construcción UDH, el soporte delantero de amortiguador y la extensión trasera; se inspeccionó el despiece de la página impresa 12 (página PDF 15), además de tablas y montaje de las páginas impresas 10–19. No sustituirlo por el manual 2020 ni atribuir a esta generación piezas de otro año.

La foto histórica 1200×1200 `catalog-v5/references/specialized-s-works-enduro-udh.jpg` aporta el registro de pedalier, cabeza de dirección y eje trasero, conservando el ensamblaje aprobado. Tiene perspectiva; una superposición registrada no es una calibración CAD. No se encontraron ni se analizaron vídeos nuevos en este trabajo: no contarlos como evidencia.

## Anatomía propia

`profile.json` reconstruye los recorridos y secciones de Enduro: superior recto con hombro local de sillín, diagonal ancha con codos bajos, rama de sillín y cuna abierta en U, vainas con cambio de altura propio y tirantes por pares. Los tramos rectos y sus cambios de sección son lineales; los radios se limitan a desvíos. No hereda la silueta ni la ventana inferior de Fury/Force.

El ojo delantero, identificado `shock_upper` en el contrato histórico, tiene apoyos fijos. El ojo trasero `shock_lower` corresponde a una extensión articulada propia: no añadir allí un puente de pintura. La bieleta superior, las dos piezas intermedias y la bieleta inferior conservan sus separaciones y taladros, con la extensión por pares alrededor del amortiguador. La puntera Horst está debajo/delante del eje de rueda; no confundir ambos pivotes.

Dos apoyos de freno solo en el tirante **no motriz**, con bases insertadas en el tubo y taladros. No reflejarlos en el lado opuesto ni confundirlos con un refuerzo de guardabarros. Patilla UDH exterior unilateral completada por debajo del eje, sin duplicarla al lado de freno. Los herrajes anteriores permanecen y los triángulos negros fuera de la máscara declarada se conservan. La protección anterior maciza se reemplaza expresamente por protector inferior y guarda de vaina motriz ceñidos al recorrido; puerta SWAT adosada y rótulos aproximados. La tarjeta conserva su fotografía previa.

La dirección hueca mantiene eje y longitud; asiento/pedalier también conservan pasos abiertos. Profundidades, radios de carbono, caras ocultas, tipografía, secciones transversales y pequeños herrajes siguen estimados desde las imágenes. No se certifica identidad del 100 %, laminado, resistencia, ajustes mecánicos o ausencia exhaustiva de colisiones. La inspección animada usa el perfil exterior existente, no una solución cinemática CAD completa.

Construcción y agrupación por material exclusivamente offline, con índices finales y transformaciones de cada lote horneadas al espacio del grupo: cinco mallas por talla. El navegador carga GLB estáticos; no se incorpora un generador ni CSG al producto.

## Excepción de eje de sillín

La revisión cruzada detectó que el marcador `saddle` heredado daba un eje de 99,78° frente a los 114,32° del tramo superior observado en S3. Solo la posición de `saddle` nueva se alinea con el tubo manteniendo su distancia a `seat_tube`; collar y perforación siguen el mismo eje. `seat_tube`, dirección, ruedas, pedalier y ojos del amortiguador permanecen idénticos. No es un cambio de medidas comerciales ni conversión de guardados.

`anchor-changes.json` documenta antes/después; `supabase/operations/frame-v23-anchor-contract.sql` contiene una lista exacta por los dos UUID. Publicador y auditor comprueban que únicamente cambia ese marcador. La prueba de colinealidad y conservación de distancia cubre ambas tallas. Los rayos de pedalier se extienden 150 mm por fuera de cada borde del shell para comprobar también mejillas exteriores.

## Reproducción

```sh
ATLAS_BASE_URL=http://127.0.0.1:5198 node scripts/prepare-frame-v23.mjs
node scripts/prepare-frame-v23-anchor-contract.mjs
node scripts/inspect-frame-v23-preservation.mjs
ATLAS_BASE_URL=http://127.0.0.1:5198 node scripts/inspect-frame-v23-exports.mjs
ATLAS_BASE_URL=http://127.0.0.1:5198 node scripts/inspect-frame-v23.mjs
ATLAS_FRAME_REVIEW_OUTPUT=/tmp/atlas-frames-v23 node scripts/review-frame-v23.mjs --all
node scripts/review-frame-v23-details.mjs
node scripts/review-frame-v23-linkage.mjs
node scripts/review-frame-v23-overlay.mjs
pnpm run test models/catalog-v23/publication.test.ts --maxWorkers=1
```

El fixture `/tests/fixtures/frame-v23-review.html?version=v23&view=lateral` es interno y queda fuera del build. `prepare-frame-v23.mjs` sin `--apply` solo captura fuentes y recursos locales. `--apply` carga/relee SHA inmutable; `publish-frame-v23.mjs --apply` utiliza el SQL acotado de `supabase/operations/publish-frame-v23.sql`. Transición histórica/nueva y limpieza: `validate-frame-v23-transition.mjs --publish`. Auditoría de lectura posterior: `validate-frame-v23.mjs`. No cambiar bytes después de cargar/publicar; otra corrección requiere otra identidad.

Estado y límites: [evidencia v23](../../docs/planning/12r-evidencia-enduro-v23.md). Sin commits salvo petición explícita.

## Cierre coordinado

Publicado tras v22: carga/relectura SHA, transición de dos guardados anteriores/dos nuevos y limpieza de cuenta temporal correctas; auditoría `cloud-after.json`. Tres poses integradas sin errores de navegador. Tipos/build y suite conjunta de 303 pruebas correctos. Estado propio del snapshot: 70 modelos, 146 elecciones, 768 variantes/766 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. El snapshot más reciente es v24; validadores anteriores son históricos. No mutar capturas publicadas ni convertir montajes.
