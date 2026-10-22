# Inventario revisado y recursos versionados

## TUES · paredes exteriores v29 · 21/10/2026

El usuario **aprueba la forma v28** y pide corregir el aspecto transparente/hueco al girar. V29 corrige solamente winding/normales de superficies extruidas: imagenY descendente→mundoY ascendente reflejaba coordenadas sin invertir caras. No cambiar la silueta aprobada sin otra petición, no invertir camisas correctas ni activar DoubleSide global. Fuente `models/catalog-v29/`, evidencia [12w](../../docs/planning/12w-evidencia-caras-tues-v29.md). Contornosv28 y todos los anclajes/medidas/acabados exactos; contrato/publicador/SQL exigen manifiesto completo igual.

Regresión nueva: FrontSide debe encontrar la misma pared próxima que DoubleSide.96 rayos antes descartaban pared cercana/0 después; superficies muestreadas coinciden≈3,31×10⁻¹⁰m y límites dentro1µm numérico. Verificar orientación con render normal: pruebas solo DoubleSide pueden ocultar este bug.14 vistas/tres poses,54 muestras por talla,22 rayos axiales/50 completos BB libres;28 capturas ajenas intactas.355 pruebas/tipos/build correctos. Dos GLB/cinco mallas por talla,4.252.892bytes, cargados/releídosSHA; dos guardados previos/dos nuevos y limpieza comprobados. Fotos/prearmadas intactas.

V29 M/L vigente:70 modelos,146 elecciones,780 variantes/778 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas. Reposición tras v28 mediante prepare/publish-frame-v29 y SQL individual; auditoría actual validate-frame-v29. Nuevos recursos reutilizan movimiento v28 por asociación explícita `tues-v29-assets.json`; no modificar posturas anteriores. Privados anteriores conservan versión: reelección del cuadro aplica corrección. No CAD/colisiones exhaustivas/Android físico/FPS certificados ni commits sin petición.


## TUES MK4 Carbon · revisión adversarial v28 · 21/10/2026

El usuario rechazó el parecido v27. Tres agentes auditaron silueta, trasera y registro, con correcciones/revisión cruzada antes de publicar. V28 vigente para M/L; v26/v27 quedan históricos y no son aceptación de parecido. No volver a usar headtop1277/274 como eje real: caía sobre barraFOX40. Raster2300×1400, normalizado porancho2048/alto1246,6087. Contornos de carbono anchos y perfil propio, registro por similitud sin cizalla. Fuentes/propuestas/constructores en `models/catalog-v28/`, evidencia [12v](../../docs/planning/12v-evidencia-tues-v28.md).

Ocho anclajes visuales estimados corregidos con contrato completo antes/después porUUID y SQL acotado; rear exacto, shock250mm/pipa110mm, especificaciones y acabados conservados. Collar centrado en corte real, no borde. Perfil propio de movimiento solo para dos assetsv28: similitud, ojo inferior móvil/entrada y pivote oculto887/790 inferido, intervalo0,09rad. Históricos intactos; no afirmar palancas exactas o recorrido completo. Flip Link separado transversalmente del muelle con espaciadores: tres poses confirmaron eliminación de las estrías de intersección.

54 puntos independientes de fotografía pasan en M/L; v27 fallaba14–21 según registro/talla. No confundir muestra con porcentaje de parecido global. 14 vistas/diez acercamientos/dos overlays y tres poses, 22 rayos axiales/50 completos BB libres, 28 SHA ajenos intactos. Normales de bisel se calculan en mm para evitar cuantización1cm de Three; caps mantienen normal plana y profundidad afín sin clamp. Se limpiaron puntas de bisel de dirección tras revisión cercana: las muestras no las detectaban. Resta pequeña transición estimada de pipa; no certificar100%/CAD, profundidades/cinemática/colisiones exhaustivas niAndroid físico/FPS.

Tipos/build y341 pruebas correctos; tras última limpieza se repitieron12 específicas y comprobaciones visuales/GLB. Dos GLB/cinco mallas por talla,4.252.748bytes, cargados/releídosSHA. Dos guardados anteriores/dos nuevos y cuenta temporal eliminada comprobados. Fotos reales y prearmadas intactas. Estado vigente:70 modelos,146 elecciones,778 variantes/776 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas. Reposición tras v27: prepare/publish-frame-v28, SQL local y contratos exactos; auditoría actual de lectura validate-frame-v28. Guardados previos conservan versión; volver a seleccionar TUES aplica v28. Sin commits.


## TUES MK4 Carbon · cierre v27 · 21/10/2026

V27 es la elección vigente M/L tras la reconstrucción individual v26. La inspección final encontró una discontinuidad exterior de la raíz inferior en v26: se conserva ese snapshot inmutable y se corrige únicamente TUES con secciones completas dentro de la pipa. Ninguna corrección global. Fotografías, especificaciones, otros anclajes y las 28 capturas ajenas permanecen; las placas y YT se apoyan sobre la superficie revisada. Fuentes/investigación propias en v26, construcción/capturas/SQL en `models/catalog-v27/` y `supabase/operations/publish-frame-v27.sql`.

Tipos/build y **329 pruebas en 63 archivos** correctos; cinco mallas por talla, 4.899.392 bytes totales; 14 vistas, diez detalles de ambas caras, dos overlays y tres poses. 22 rayos axiales/50 completos BB libres. Dos GLB cargados/releídos por SHA; dos guardados anteriores/dos nuevos comprobados y cuenta temporal eliminada. Estado vigente: **70 modelos, 146 elecciones, 776 variantes/774 recursos históricos**, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas. Auditoría actual de lectura `validate-frame-v27.mjs`; reposición después de v26 mediante prepare/publish-frame-v27. Guardados previos no se convierten. Evidencia y límites en [12u](../../docs/planning/12u-evidencia-tues-v26.md); sin CAD/100 % certificado, cinemática/colisiones exhaustivas, Android físico/FPS ni commits.


## TUES MK4 Carbon v26 · 21/10/2026

Revisión individual M/L publicada desde v13; fuentes offline `models/catalog-v26/`, evidencia [12u](../../docs/planning/12u-evidencia-tues-v26.md). Fotos propias MK4, manual2024 p31 y vídeo YT Workshop descargado/seis instantes muestreados. Superior/diagonal/sillín propios, Flip Link macizo y triángulo trasero bilateral con punteras ajustables. Detalles anteriores reconstruidos expresamente; solo saddle visual alineado, conservando longitud y todos los otros anclajes/especificaciones/acabados. Fotos reales de cards intactas.

Dos GLB/cinco mallas por talla,4.901.868bytes; tipos/build y321 pruebas correctos.28 SHA ajenos intactos,14 vistas/diez detalles/dos overlays/tres poses;22 rayos axiales y50 completos BB libres. Carga/relectura SHA y transición de dos guardados anteriores/dos nuevos con cuenta temporal eliminada. Estado vigente:70 modelos,146 elecciones,774 variantes/772 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias. Reposición tras v25 mediante prepare/publish-frame-v26; SQL individual y correcciones por UUID en repo, auditoría vigente de lectura validate-frame-v26. Guardados/prearmadas no se convierten. Sin certificación CAD/100%, cinemática exacta, colisiones exhaustivas ni Android físico/FPS; sin commits. Snapshots anteriores se conservan debajo como historial.


## Estado vigente: GLB v6, frenos v7 y complementos comerciales v8

La base visual sigue siendo `visual-v7-reviewed.json` con cuatro prearmadas en `visual-v7-examples.json`; se amplía con `cockpit-reviewed.json`: seis modelos comerciales v8 de Renthal, DEITY, OneUp y WTB. Total actual: **59 modelos y 120 elecciones seleccionables**, sin cambiar las prearmadas ni retirar los auxiliares ATLAS. Conserva GLB v6 para los cuadros/suspensiones, renderer v7 para nueve frenos y v5 para las piezas sin cambio. La publicación v6 creó 85 sucesoras y reutilizó 43 capturas; la v7 creó nueve sucesoras de freno y reutilizó 119. El publicador no archiva los mapeos de identidad sin cambio.

Reposición completa: cinco fuentes históricas → v3 → v4 → v5 → v6 → v7 → `node scripts/ingest-catalog.mjs supabase/catalog/cockpit-reviewed.json --apply`; ejecutar `node scripts/publish-visuals.mjs --version=v6 --apply` y finalizar con `--version=v7 --apply`. Requiere migraciones 017/018 y GLB cargados con `node scripts/upload-visual-v5.mjs --version=v6 --apply`. La opción de versión es explícita: el valor predeterminado del publicador sigue siendo v4. Conservar todas las fuentes y rutas anteriores.

Fuentes editables e inferencias en `models/catalog-v6/README.md`. Snapshot ampliado: **612 variantes y 610 recursos históricos, cuatro prearmadas, 59 modelos**. Los 606 IDs de variante y 604 recursos previos conservan sus enlaces/manifiestos originales. V8 requiere migración 021; esta es una ampliación parcial, no una publicación mediante `publish-visuals.mjs --version=v8` (esa opción no existe). Fuentes, cotas, imágenes y límites en `docs/planning/11n-componentes-comerciales-de-contacto.md`. Evidencia histórica en `docs/planning/12c-evidencia-continuidad.md`; no equivale a CAD ni a Android físico aceptado.


## Fuentes históricas de catálogo

`initial-reviewed.json` conserva 29 modelos y 74 variantes, de las cuales 62 están publicadas. Se completó la publicación de RXF38 m.3 y las 24 medidas Vivid Coil D1 tras comprobar sus representaciones genéricas. Permanecen doce variantes en borrador; no se cambian sus medidas para forzar publicación.

`braking-reviewed.json` aporta diez modelos y doce variantes publicados de frenos/discos. `suspension-reviewed.json` añade cuatro modelos y dieciséis variantes publicados: ZEB Ultimate B1 29/170, Bomber Z1 RAIL 29/150 y 29/160 con acabados documentados, once FLOAT X2 Factory MY26 y TTX22m.2 MTBM 2208. `frames-reviewed.json` añade seis modelos, doce variantes seleccionables por talla y dos capturas anteriores conservadas de Santa Cruz, Canyon, Specialized, DA BOMB, SCOTT y Trek. `tyres-reviewed.json` aporta cuatro modelos y doce variantes de CST, Kenda, Michelin y Schwalbe. El total es **53 modelos/128 variantes**, con **53 modelos/116 variantes publicados, de las que 114 son seleccionables** y doce variantes en borrador. Aplicar las cinco fuentes antes de las composiciones; ninguna fuente aislada sustituye al catálogo completo.

Los recursos nuevos reutilizan el generador v1 con identidad propia, también al montarlos en cuadros v2; no modifican geometrías publicadas. Los pesos conservan su medida de referencia y los intervalos requieren fuente de la generación concreta. Las revisiones de recurso no certifican instalación física.

Las MAGURA conservan Royal Blood, manual de MT y mantenimiento condicionado por síntomas, sin inventar una purga anual. El peso de conjunto, lado o SKU sin correspondencia exacta permanece ausente. Maven B1 no hereda datos de A1. Los precios MAGURA son PVP de referencia con IVA alemán del 19 %, fechados y enlazados; no se suman como presupuesto del montaje.

`enduro-examples.json` contiene dos versiones M/L de un mismo ejemplo ATLAS con 23 posiciones. Parte del cuadro COMMENCAL META SX V5 y combina FOX 38 Factory MY27, Marzocchi Bomber CR, Shimano SLX, DT Swiss, Maxxis, ROCKBROS y los cuatro [auxiliares propios](atlas-auxiliaries.md). No se etiqueta como montaje de fábrica ni se atribuye un año comercial a la composición.

Las medidas desconocidas permanecen ausentes o null. La fuente OEM de las bielas identifica SLX, 165 mm y plato de 32 dientes, pero no el sufijo de biela, SKU, diámetro de eje o línea de cadena: no se completan por deducción. Los herrajes del amortiguador y la selección de muelle no quedan certificados por coincidir entreojos/carrera. No se suman precios de conjuntos agrupados visualmente. Al reponer un proyecto completo, aplicar las cinco fuentes de catálogo antes de sus composiciones; una fuente no elimina las referencias de la otra.

`downhill-examples.json` añade dos versiones M/L del ejemplo SUPREME DH V5, con FOX 40 Factory MY27, Bomber CR 250×75, transmisión SRAM DH de siete velocidades, núcleo XD, pedalier DUB PF107, bujes 20×110 BOOST/12×157 y auxiliares propios. Conserva 23 posiciones por versión; las ruedas/neumáticos reutilizados son referencias del catálogo, sin declarar certificación de competición del conjunto.

## Aplicación y validación

Con Node de `.node-version`:

```sh
node scripts/ingest-catalog.mjs supabase/catalog/initial-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/braking-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/suspension-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/frames-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/tyres-reviewed.json
node scripts/ingest-presets.mjs supabase/catalog/enduro-examples.json
node scripts/ingest-presets.mjs supabase/catalog/downhill-examples.json
```

Estas órdenes validan sin escribir. `--apply` aplica cada documento transaccionalmente al proyecto Cloud existente. Aplicar catálogo antes de composiciones. La ingesta de prearmadas comparte `iam.validate_preset_document` con el RPC administrativo; no usa una copia menos estricta de sus reglas. No sustituye las migraciones ni crea tablas adicionales.

Para revisar recursos antes de publicarlos, abrir `/tests/fixtures/scene-preview.html` en Vite local; `?size=L` muestra la otra talla; `?discipline=downhill&size=L` selecciona descenso. Esta entrada interna materializa los recursos en memoria para revisión sin cambiar los indicadores de publicación en Cloud. No forma parte del build de producción ni se ofrece como ruta comercial.

## Recursos publicados

El generador `atlas-bike-v1` está separado en `src/features/configurator/scene/generators/BikeV1.tsx`, junto con su ensamblaje v1 en `model/assembly.ts`. Tras su primera publicación, cambios de geometría o anclajes efectivos requieren una nueva clave de generador y otra variante/recurso. Conservar el generador anterior para reproducir montajes guardados. La cámara o la gestión de errores pueden mejorar manteniendo la geometría y la identidad del recurso.

El recurso de cuadro `atlas-bike-v2` conserva su ensamblaje de descenso en `model/assemblyV2.ts`; la escena integra las piezas comunes del generador anterior y representa doble pletina, potencia directa, bieletas y polea con recorrido de cadena. Sus anclajes de detalle siguen marcados como estimados. La elección del ensamblaje se conserva mediante el recurso del cuadro guardado, no mediante un nombre o disciplina mutable. La migración 013 impide publicar generadores que el cliente no soporta.

Las representaciones procedimentales son genéricas o aproximadas, según cada variante. No equivalen a CAD del fabricante. El primer conjunto ya está publicado en Supabase Cloud de desarrollo y dispone de pruebas públicas y de guardado/reapertura con cuentas temporales. La revisión de siluetas y proporciones de este conjunto no acredita rendimiento de un dispositivo real ni toda la fidelidad exigida a la entrega final.

## Fotos de referencia locales

Las fotos se sirven desde `src/assets/images/catalog/` y se resuelven por `src/data/images.ts`; no se usa hotlink desde el frontend. Procedencia consultada el 19 de octubre de 2026:

| Archivo | Fuente oficial | Tamaño preparado |
| --- | --- | --- |
| `assegai.jpg` | [Maxxis Assegai](https://shop.maxxis.com/products/assegai), imagen del dibujo Assegai | 640 px, unos 40 kB |
| `minion-dhr-ii.jpg` | [Maxxis Minion DHR II](https://shop.maxxis.com/products/minion-dhr-ii), imagen del dibujo DHR II | 640 px, unos 38 kB |
| `rockbros-nylon.jpg` | [ROCKBROS 2017-12](https://rockbrosusa.com/products/rockbros-mtb-pedals-mountain-bike-pedals-lightweight-nylon-fiber-bicycle-platform-pedals-for-bmx-mtb-9-16), imagen del acabado negro | 640 px, unos 60 kB |

Una foto de familia no acredita por sí sola un SKU, dimensión, acabado o compuesto; esos datos conservan su fuente de variante.

Las fotos locales adicionales `supreme-dh-v5.jpg` y `fox-40-my27-black.png` proceden, respectivamente, de la ficha oficial del [cuadro](https://www.commencal.com/fr/bikes/cadres%20%2F%20a%20la%20carte/downhill/supreme%20dh%20v5/FT3SUPV54M.html?lang=fr_FR) y de la variante negra 910-21-410 en [FOX](https://ridefox.com/products/my27-fox-40-factory), consultadas el 19 de octubre de 2026. La foto del cuadro ilustra la familia, sin certificar su acabado ni sustituir el modelo 3D.

La foto `magura-mt5.png` conserva el PNG original de [MAGURA MT5](https://magura.com/product/mt5/), consultado el 19 de octubre de 2026 (800×640, unos 304 kB, con transparencia). Ilustra la pinza y maneta de referencia; no se reutiliza para MT5 PRO u otras versiones con manetas distintas. Para revisión interna: `?brake=magura-mt5&rotor=magura-mdr-p` en la entrada de escena.

Las fotos `marzocchi-z1-rail-black.jpg` y `marzocchi-z1-rail-red.jpg` se obtuvieron del CDN enlazado por las variantes oficiales [Bomber Z1 RAIL](https://bike.marzocchi.com/products/bomber-z1), a 800 px (unos 23/35 kB). La variante roja conserva su foto roja; no se toma el nombre MY25 del archivo como prueba del año comercial. El generador v1 sigue representando una horquilla genérica, sin atribuir esa foto a una malla CAD.

Comprobaciones reproducibles del visor: `node scripts/review-scene.mjs` con Vite en 5174 revisa las 41 variantes de suspensión del lote/publicación de borradores; `node scripts/measure-scene.mjs` prepara una compilación aislada bajo `node_modules/.cache/` y mide las dos disciplinas en Chromium con red limitada. Este compilado interno contiene fuentes de revisión y **no es el frontend que se despliega**. Evidencia y límites en [12a](../../docs/planning/12a-evidencia-del-visor.md).

Las ampliaciones de cuadros conservan S3/S4 y 17″/19″, geometrías por talla y anclajes estimados; no certifican mecanismos o carenados de marca. Las de neumáticos conservan carcasa/compuesto por SKU y no suman capas TPI ni trasladan pesos de otra referencia. Fuentes y límites en [11c](../../docs/planning/11c-cuadros.md) y [11l](../../docs/planning/11l-neumaticos.md). `node scripts/review-scene.mjs --frames` prepara doce cuadros y cuatro cámaras por talla; `--tyres` prepara las doce variantes de neumáticos sobre la posición delantera. La revisión usa recursos genéricos identificados; queda pendiente el parecido final de detalle.

Specialized conserva sus dos capturas iniciales como publicadas no seleccionables; dos nuevas capturas incorporan BSA 73 mm del manual oficial sin cambiar sus recursos ni geometría. Los enlaces y montajes anteriores conservan su referencia. El selector normal muestra las dos tallas vigentes, no las capturas retiradas.

Ampliación fotográfica posterior: 40 WebP nuevos, registro de procedencia y alcance en [README de imágenes](../../src/assets/images/catalog/README.md) y `photos.json`. `src/data/images.ts` admite `catalog:<slug>` y resuelve por slug cuando `image_key` es null. La foto de variante tiene prioridad; no se modificaron datos técnicos ni se reingirieron modelos para conectar estas imágenes. Cobertura local: 46 modelos con foto; cinco genéricos ATLAS y dos referencias comerciales pendientes documentadas.


## Historial visual

Los conjuntos `visual-v3-*`, `visual-v4-*`, `visual-v5-*`, `visual-v6-*` y `visual-v7-*` conservan sus fuentes completas, sucesoras y composiciones. V3 aporta perfiles por modelo; v4 corrige secciones transversales; v5 integra las primeras mallas trazadas; v6 cierra conexiones multivista; v7 completa las carcasas de pinza conservando el montaje corregido.

Las migraciones 014–018 y los scripts de publicación viven fuera de esta carpeta, en el repositorio. La gestión remota y los accesos están en [Supabase](../README.md); la evidencia de la revisión actual está en [12c](../../docs/planning/12c-evidencia-continuidad.md). Nunca reemplazar binarios publicados ni alterar medidas comerciales al mejorar recursos exteriores. No publicar borradores ni borrar el historial para limpiar la selección.

## Ampliación gravity v9 · 21/10/2026

`gravity-reviewed.json` añade once modelos y 26 variantes, con perfiles GLB de la migración 022. Estado actual: 70 modelos, 146 elecciones publicadas, 638 variantes/636 recursos con historial; cuatro prearmadas. Mantener también la ingesta de cockpit: no son fuentes intercambiables ni catálogos completos aislados.

Después de las cinco fuentes históricas y publicaciones explícitas v3…v7, aplicar `cockpit-reviewed.json` y terminar con `gravity-reviewed.json`. Primero aplicar 022 y preparar/cargar los GLB de `models/catalog-v9/` con `node scripts/prepare-gravity-models.mjs --apply`; después `node scripts/ingest-catalog.mjs supabase/catalog/gravity-reviewed.json --apply`. **No existe opción v9 del publicador visual general**, porque la ingesta es aditiva y no reemplaza elecciones anteriores. `node scripts/validate-gravity-publication.mjs` comprueba en lectura identidades/recursos previos, medidas/manifiestos nuevos y visibilidad pública.

Generaciones históricas identificadas autorizadas por el usuario. Furious 2021 no hereda geometría de bloques FRS actuales; TUES sin tabla confirmada no publica cotas estimadas. Referencias, incertidumbre y aceptación en [11o](../../docs/planning/11o-ampliacion-gravity.md).

## Revisión integral de cuadros v10 · 21/10/2026

Después de gravity, cargar/verificar `node scripts/prepare-frame-v10.mjs --apply` y publicar `node scripts/publish-frame-v10.mjs --apply`. Fuentes `frames-v10-reviewed.json`, `frames-v10-successors.json`, `frames-v10-examples.json`. El publicador solo añade treinta representaciones de los quince cuadros, retira sus elecciones anteriores y actualiza las cuatro prearmadas; mantiene todas las demás categorías y recursos históricos. No usar el publicador visual general con v10.

Estado vigente: 70 modelos, 146 elecciones y 668 variantes/666 recursos con historial. Validación actual: `node scripts/validate-frame-v10.mjs`; el validador gravity de arriba conserva su snapshot anterior y sus expectativas de elecciones no describen el catálogo posterior a v10. Evidencia en [12e](../../docs/planning/12e-evidencia-cuadros-v10.md). Los GLB v10 ya publicados tampoco se reconstruyen con bytes distintos bajo la misma identidad.

## Continuación de cuadros v11

Después de v10, preparar/cargar `node scripts/prepare-frame-v11.mjs --apply` y publicar `node scripts/publish-frame-v11.mjs --apply`. Fuente `frames-v11-reviewed.json`, sucesoras y cuatro prearmadas; SQL acotado `supabase/operations/publish-frame-v11.sql`. No usar el publicador general. `node scripts/validate-frame-v11.mjs` es la auditoría de lectura vigente; la de v10 conserva su estado histórico.

V11 conserva especificaciones y anclajes al abrir pasos e incorporar la pared interior de dirección, con nuevos GLB e identidades. Estado: 70 modelos, 146 elecciones, 698 variantes/696 recursos históricos y cuatro prearmadas. Evidencia y límites en [12f](../../docs/planning/12f-evidencia-pasos-v11.md). No alterar recursos publicados ni convertir automáticamente montajes guardados.

## Uniones exteriores de dirección v12

Después de v11: `node scripts/prepare-frame-v12.mjs --apply` carga treinta recursos nuevos verificados por SHA; `node scripts/publish-frame-v12.mjs --apply` aplica las fuentes `frames-v12-reviewed.json`, sucesoras y prearmadas mediante SQL acotado en `supabase/operations/publish-frame-v12.sql`. No usar el publicador visual general. La auditoría de lectura vigente es `node scripts/validate-frame-v12.mjs`; las comprobaciones v11/anteriores conservan sus snapshots.

Publicación: 70 modelos, 146 elecciones, 728 variantes/726 recursos históricos, cuatro prearmadas. Pipa y uniones exteriores corregidas sin cambiar medidas comerciales, acabados o anclajes. Los montajes guardados mantienen la variante original. Evidencia en [12g](../../docs/planning/12g-evidencia-direccion-v12.md); geometrías publicadas inmutables.

## Reversión solicitada de la pipa v12 · 21/10/2026

El usuario pide deshacer la última corrección global: algunos modelos anteriores estaban bien. Se restaura v11 en las treinta elecciones de cuadro y en las prearmadas, conservando todo el historial y sin cambiar montajes privados. V12 queda retirado y no debe republicarse. Fuente de reversión: `supabase/operations/rollback-frame-v12.sql`; aplicar/verificar con `node scripts/rollback-frame-v12.mjs --apply` (sin `--apply` solo comprueba). Las cifras históricas siguen en 728 variantes/726 recursos y 146 elecciones. Las comprobaciones de publicación v12 describen su snapshot anterior, no la elección actual. Cualquier nueva corrección debe aislar modelos defectuosos y comprobar simetría real sin duplicar detalles legítimamente asimétricos.

## Continuidad localizada v13

Cinco cuadros aprobados permanecen en sus diez variantes v11; solo los otros diez cuadros reciben veinte sucesoras v13. Fuentes `frames-v13-reviewed.json` y `frames-v13-successors.json`, sin reingesta de prearmadas. Cargar/verificar con `node scripts/prepare-frame-v13.mjs --apply` y publicar mediante `node scripts/publish-frame-v13.mjs --apply`; SQL acotado en `supabase/operations/publish-frame-v13.sql`. No usar el publicador visual general. V12 sigue retirada; en reposición limpia su reversión se aplica ANTES de v13, nunca como paso final sobre el catálogo v13.

Estado vigente: 70 modelos, 146 elecciones, 748 variantes/746 recursos históricos, cuatro prearmadas. Auditoría de lectura actual `node scripts/validate-frame-v13.mjs`; las anteriores son snapshots históricos. Preservar v1–v13 y los montajes guardados. Evidencia y límites en [12h](../../docs/planning/12h-evidencia-uniones-v13.md). Sin commits automáticos.

## Ajuste individual CAPRA v14

Después de v13: `prepare-frame-v14.mjs --apply` carga dos recursos inmutables y `publish-frame-v14.mjs --apply` publica solo las dos sucesoras CAPRA de `frames-v14-reviewed.json`/`frames-v14-successors.json`, mediante `supabase/operations/publish-frame-v14.sql`. Las otras veintiocho elecciones de cuadro y las cuatro prearmadas no se reescriben. Auditoría de lectura vigente `validate-frame-v14.mjs`; fuentes/validadores anteriores conservan su snapshot. Estado: 70 modelos, 146 elecciones, 750 variantes/748 recursos históricos. Evidencia en [12i](../../docs/planning/12i-evidencia-capra-v14.md); no convertir automáticamente los montajes guardados.

## CAPRA completo v15

Después de v14: `prepare-frame-v15.mjs --apply` carga/verifica dos GLB y `publish-frame-v15.mjs --apply` aplica solo las sucesoras CAPRA de `frames-v15-reviewed.json`/`frames-v15-successors.json`, mediante `supabase/operations/publish-frame-v15.sql`. Reconstrucción completa de trayectos, no parche de raíces; no se mutan recursos anteriores ni se reescriben otros cuadros/prearmadas/montajes privados. Auditoría actual `validate-frame-v15.mjs`; snapshots anteriores históricos. Estado: 70 modelos, 146 elecciones, 752 variantes/750 recursos históricos. Evidencia y límites en [12j](../../docs/planning/12j-evidencia-capra-trayectos-v15.md).

## CHERRY BOMB completo v16

Después de v15: `prepare-frame-v16.mjs --apply` carga/verifica dos recursos y `publish-frame-v16.mjs --apply` publica solo CHERRY 17″/19″ desde `frames-v16-reviewed.json`/`frames-v16-successors.json`, mediante SQL `supabase/operations/publish-frame-v16.sql`. Predecesoras CHERRY v11, no CAPRA v15; no reescribir otros cuadros/prearmadas/montajes privados. Auditoría actual `validate-frame-v16.mjs`, anteriores son snapshots. Estado: 70 modelos, 146 elecciones, 754 variantes/752 recursos históricos. Referencias y límites en [12k](../../docs/planning/12k-evidencia-cherry-bomb-v16.md).


## GT Force Carbon High Pivot completo v17 · publicado

Dos elecciones Force M/L publicadas desde v13; las otras 28 capturas actuales mantienen sus SHA, incluidos CAPRA v15 y CHERRY v16. Perfil propio, triángulo GT, bieleta calada y conservación selectiva de polea. Build/tipos y 230 pruebas correctos; 14 vistas generales, diez detalles, dos overlays, 22 rayos despejados y tres poses articuladas. Carga/relectura SHA, auditoría remota y transición de dos montajes anteriores/dos nuevos con limpieza de cuenta temporal comprobadas. Estado: 70 modelos, 146 elecciones, 756 variantes/754 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. No se convierten guardados ni prearmadas. Reposición tras v16: `prepare-frame-v17.mjs --apply` → `publish-frame-v17.mjs --apply`; fuente SQL `supabase/operations/publish-frame-v17.sql`. Auditoría vigente `validate-frame-v17.mjs`; validadores anteriores describen sus snapshots. Evidencia y límites en [12l](../../docs/planning/12l-evidencia-force-v17.md). No certificar CAD/100 %, colisiones exhaustivas o Android físico/FPS. Sin commits.

## FRS V3 Pure White v18 · publicado

Dos elecciones FRS M/L actualizadas desde v13, sin cambiar las otras 28 capturas, prearmadas ni montajes privados. Perfil propio, bieleta calada, soportes superior fijo/inferior móvil, protecciones y fotografía oficial original del cuadro en la tarjeta (65 fotos/cinco renders actuales). Seis mallas por talla; dos GLB cargados/releídos por SHA, build/tipos y 239 pruebas correctos, revisión multivista/pasos/articulación y transición de guardados con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 758 variantes/756 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Reposición tras v17: `prepare-frame-v18.mjs --apply` → `publish-frame-v18.mjs --apply`; SQL `supabase/operations/publish-frame-v18.sql`. Auditoría vigente `validate-frame-v18.mjs`; anteriores describen snapshots. Evidencia y límites en [12m](../../docs/planning/12m-evidencia-frs-v18.md). Sin certificación CAD/100 %, colisiones exhaustivas o Android/FPS físicos. Sin commits.

## Furious V3 2021 v19 · publicado

Dos elecciones M/L actualizadas desde v13, con perfil propio de la generación 2021, soporte superior ensanchado, bieleta calada, basculante y protecciones; otras 28 capturas intactas. Seis mallas por talla, dos GLB cargados/releídos por SHA y publicados, tipos/build y 247 pruebas correctos; revisión multivista/pasos/articulación y transición con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 760 variantes/758 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Guardados y prearmadas sin conversión. Reposición tras v18: `prepare-frame-v19.mjs --apply` → `publish-frame-v19.mjs --apply`; SQL `supabase/operations/publish-frame-v19.sql`. Auditoría vigente `validate-frame-v19.mjs`; anteriores son snapshots. Evidencia y límites en [12n](../../docs/planning/12n-evidencia-furious-v19.md). No certificar CAD/100 %, colisiones exhaustivas o Android físico/FPS. Sin commits.

## Fury Carbon High Pivot v20 · publicado

Dos elecciones M/L actualizadas desde v13 para Fury 2023+, con perfil propio, ventana triangular inferior, yugo sólido, guía y protecciones; otras 28 capturas intactas. Cinco mallas por talla, dos GLB cargados/releídos por SHA y publicados; tipos/build y 255 pruebas correctos. Revisión multivista/pasos/articulación y transición con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 762 variantes/760 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Guardados y prearmadas sin conversión. Reposición tras v19: `prepare-frame-v20.mjs --apply` → `publish-frame-v20.mjs --apply`; SQL `supabase/operations/publish-frame-v20.sql`. Auditoría vigente `validate-frame-v20.mjs`; anteriores son snapshots. Evidencia y límites en [12o](../../docs/planning/12o-evidencia-fury-v20.md). No certificar CAD/100 %, colisiones/cinemática exhaustivas o Android físico/FPS. Sin commits.

## META SX V5 v21 · publicado

Dos elecciones M/L desde v11, perfil propio y VCS conservado; otros 28 recursos intactos. Tipos/build y 263 pruebas correctos, vistas/pasos/articulación, carga/relectura SHA y transición comprobadas. Estado: 70 modelos, 146 elecciones, 764 variantes/762 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Reposición tras v20: `prepare-frame-v21.mjs --apply` → `publish-frame-v21.mjs --apply`; SQL `supabase/operations/publish-frame-v21.sql`, auditoría vigente `validate-frame-v21.mjs`. Guardados y prearmadas sin conversión. [12p](../../docs/planning/12p-evidencia-meta-v21.md). Sin certificación CAD/100 % ni commits.

## Nomad v22, S-Works Enduro v23 y Sender v24 · publicados

Revisión por tres agentes con contraste cruzado y coordinación principal. Seis elecciones nuevas, seis GLB cargados/releídos por SHA, guardados anteriores/nuevos comprobados y cuentas temporales eliminadas. Tipos/build y 303 pruebas correctos. Nomad M/L y Enduro S3/S4 conservan anclajes de suspensión y corrigen únicamente saddle visual con contrato exacto; Sender M/L corrige la generación MY25, anclajes visuales y perfil propio de movimiento seleccionado por ID de recurso. No se convierten montajes históricos ni prearmadas.

Estado final del snapshot: **70 modelos, 146 elecciones, 770 variantes/768 recursos históricos, cuatro prearmadas/92 posiciones**, 22 migraciones/doce tablas propias. Reposición secuencial tras v21: prepare/publish v22 → v23 → v24 con contratos SQL propios antes de publicación. Auditoría vigente `validate-frame-v24.mjs`; las anteriores describen sus snapshots. Tarjeta Sender usa render del recurso MY25 identificado; fotografía2021 archivada. Evidencia: [12q](../../docs/planning/12q-evidencia-nomad-v22.md), [12r](../../docs/planning/12r-evidencia-enduro-v23.md) y [12s](../../docs/planning/12s-evidencia-sender-v24.md). No certificar CAD/100 %, colisiones o cinemática exhaustivas ni Android físico/FPS. Sin commits.

## SUPREME DH V5 v25 · publicado

Dos elecciones M/L desde v11, silueta propia y HVCS exterior contrastados con fotos/despieces y cinco vídeos oficiales realmente muestreados. Cinco mallas/talla, dos GLB cargados/releídos por SHA y publicados; build/tipos y 313 pruebas correctos. 28 recursos ajenos conservados, multivista/overlay/articulación, pasos completos y transición anteriores/nuevos con cuenta temporal eliminada. Solo saddle visual alineado mediante contrato por ID; suspensión/especificaciones/acabados conservados. Fotos reales y prearmadas sin cambios.

Estado del snapshot: **70 modelos, 146 elecciones, 772 variantes/770 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias. Reposición tras v24: `prepare-frame-v25.mjs --apply` → `publish-frame-v25.mjs --apply`; SQL `supabase/operations/publish-frame-v25.sql`, auditoría vigente `validate-frame-v25.mjs`. Anteriores son snapshots; no convertir guardados ni alterar bytes publicados. Evidencia [12t](../../docs/planning/12t-evidencia-supreme-v25.md). Sin certificación CAD/100 %, cinemática/colisiones exhaustivas o Android físico/FPS. Sin commits.


## V10.8 CC MY27 · revisión individual v30

Reconstrucción propia M/L desde foto oficial del cuadro desnudo y despieces V10.8: ventanas, arco delantero, basculante cerrado y enlaces VPP. Cinco anclajes visuales estimados con contrato antes/después; geometría oficial de dirección/ruedas, medidas y acabados conservados. Perfil de movimiento nuevo solo para recursos v30; conservar históricos y fotografías. Preparación, controles de silueta/paredes/pasos, multivista, pruebas y publicación forman parte de la fase 3, con evidencia y límites en [12x](../../docs/planning/12x-evidencia-v10-v30.md). No afirmar CAD/100 % de parecido ni aceptación integral del producto.


## Prearmadas y suspensión v2

Fuente aditiva vigente `motion-v2-examples.json`: mismas cuatro composiciones/92 posiciones, solo cuatro cuadros actualizados a META v21/SUPREME v25 al detectar referencias retiradas que impedían abrirlas. Reposición tras publicar v30: `node scripts/sync-motion-presets.mjs --apply` (SQL en operations), preserva88 posiciones y privados con snapshot antes/después. No sustituir ni borrar fuentes históricas. Detalle en [motion-v2](../../models/motion-v2/README.md) y [12y](../../docs/planning/12y-evidencia-suspension-v2.md). No migraciones, assets o variantes nuevas.
