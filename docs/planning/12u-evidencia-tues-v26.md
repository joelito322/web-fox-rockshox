# 12u · TUES MK4 Carbon · v26/v27

Revisión individual autorizada, M/L desde v13. Conservar los otros catorce cuadros, fotografías reales, prearmadas y montajes históricos. Nueva identidad física; sin modificaciones de recursos publicados ni CSG runtime.

## Trabajo y aceptación

1. Contrastar fotografía lateral, diagonal no motriz, detalles de Flip Link y manual oficial MK4 2024, separando observación e inferencia.
2. Reconstruir tubos, unión de sillín, V4L, pares de brazos, puentes y punteras ajustables. Conservar anclajes mecánicos; solo corregir la referencia visual de tija si el trazado lo exige, con evidencia exacta y excepción SQL acotada.
3. Exportar dos GLB estáticos. Revisar ambas caras, dirección, superior/inferior, superposición y montaje articulado; comprobar pasos completos de pedalier y contratos. Preservar los 28 SHA ajenos y documentar las zonas reconstruidas, sin llamar conservación a piezas sustituidas.
4. Tipos/pruebas/build; cargar/releer SHA y publicar únicamente dos elecciones. Validar guardados anteriores/nuevos y auditoría de datos sin alterar fotos.

## Resultado comprobado

Publicado después de v25. Dos GLB/cinco mallas por talla, **4.901.868 bytes totales**, cargados y releídos por SHA. Auditoría de datos en `models/catalog-v26/cloud-after.json`; transición de **dos montajes previos/dos nuevos** y cuenta temporal eliminada en `transition.json`. Estado: **70 modelos,146 elecciones,774 variantes/772 recursos históricos**, cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias. Los guardados previos conservan v13; volver a elegir TUES aplica v26. Fotografía real del card intacta.

Fuentes propias: fotografía lateral, diagonal no motriz y detalles oficiales, más despiece del manual MK4 MY2024 p31; vídeo YT Workshop descargado y seis instantes realmente muestreados. [Registro de fuentes](../../models/catalog-v26/references/sources.json), [vídeo](../../models/catalog-v26/references/video-review.json). Perfil/constructores y límites en [README v26](../../models/catalog-v26/README.md). El centro de pedalier fotografiado sustituye el punto de trazado antiguo desplazado hacia el plato; no cambia el anclaje mecánico publicado.

Superior prácticamente recto, diagonal de sección variable/curva inferior localizada, unión redondeada de sillín y cuello corto. Brazos de ambos lados, Flip Link macizo, cuna abierta, puentes, punteras e insertos; freno y patilla unilaterales. Detalles anteriores reconstruidos expresamente, sin declararlos preservados por triángulos. Solo `saddle` visual se alinea en las nuevas identidades, con igual longitud; el resto de anclajes y los250mm entreojos se conservan. Contratos exactos por UUID y excepción SQL acotada. No se modifican especificaciones ni acabados.

- Tipos estrictos/build correctos y **321 pruebas en62 archivos**; ocho pruebas propias de alcance/hash, pares, conservación de contratos, orientación tija y ventanas/pedalier.
- **28 SHA ajenos intactos**, geometrías/anclajes/pintura finitos. [Conservación](../../models/catalog-v26/preservation.json), [inspección](../../models/catalog-v26/inspection.json).
- **14 vistas generales**, diez primeros planos, dos superposiciones registradas y tres poses integradas sin errores del navegador. [General](../../models/catalog-v26/general-review.json), [dirección](../../models/catalog-v26/detail-review.json), [overlay](../../models/catalog-v26/overlay-review.json), [movimiento](../../models/catalog-v26/motion-review.json).
- **22 rayos axiales y50 rayos completos de pedalier**, a través de todas las mallas entre z=±0,15m, sin obstrucciones; eje de tija alineado en M/L. [Pasos](../../models/catalog-v26/bore-review.json), [pasaje completo](../../models/catalog-v26/passage-review.json).
- Revisión previa corrigió soportes de freno separados y protección de cadena extendida sobre el ascenso al pivote. Placas redondeadas con subdivisión acotada reducen payload de8,64 a4,90MB el par, manteniendo cinco mallas por talla; no equivale a FPS medidos.

El registro es una aproximación de fotografía, no CAD ortográfico. Anchos ocultos, radios, uniones y M/L son inferidos. Se conserva la cinemática estimada anterior, sin certificar contactos exhaustivos, palancas/recorrido exactos, Android físico ni100% dimensional. Recursos nuevos inmutables, sin commits.

Reposición tras v25: `prepare-frame-v26.mjs --apply` → `publish-frame-v26.mjs --apply`. SQL individual en `supabase/operations/publish-frame-v26.sql`; auditoría de lectura vigente `validate-frame-v26.mjs`.

## Corrección localizada v27 · publicada

El último acercamiento visual detectó una discontinuidad exterior en la llegada de diagonal a pipa después de publicar v26. No se considera esa unión aceptada en v26. Conservar sus bytes/historial y crear v27 exclusivamente M/L: terminar la sección completa de las raíces dentro del cuerpo exterior de dirección, sin cerrar el paso interior ni deformar globalmente otros cuadros. Repetir acercamientos de ambas caras, rayos, contratos, poses y transición. Misma investigación de v26; no atribuir nuevas mediciones.

### Resultado final v27

La raíz inferior termina centrada al48% de dirección y ambas llegadas reducen su sección final a20/21mm dentro del cuerpo exterior; se conservan eje/extremos/paso. Son cotas de construcción visual estimadas, no medidas comerciales. Placas y YT se apoyan en la superficie. Se revisaron los diez acercamientos antes de la carga inmutable, incluyendo ambas caras M/L, además de14 vistas generales/dos overlays y tres poses integradas. No aplicar cambios globales a otros cuadros.

**329 pruebas en63 archivos**, tipos estrictos y build correctos. Dos GLB/cinco mallas por talla, **4.899.392 bytes totales**, cargados/releídos por SHA.22 rayos axiales y50 completos de BB libres, eje de tija alineado;28 capturas ajenas intactas. Fuentes/capturas/operaciones en [README v27](../../models/catalog-v27/README.md); conservación, inspección, bores, pasos completos, general, detalles, overlays y movimiento en sus JSON. La cinemática anterior conserva su condición estimada; no declarar su exactitud por estas tres poses.

Publicación individual aplicada, transición de dos guardados v26/dos v27 y cuenta temporal eliminada en [transition](../../models/catalog-v27/transition.json). La transición v26 ya había comprobado dos v13/dos v26. Auditoría de lectura [cloud-after](../../models/catalog-v27/cloud-after.json) conserva todos los manifiestos/especificaciones/historial y prearmadas. Estado vigente: **70 modelos,146 elecciones,776 variantes/774 recursos históricos**, cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias. V26 queda histórico, v27 vigente para M/L. Fotos reales sin cambios; volver a seleccionar el cuadro aplica v27.

Reposición después de v26: `prepare-frame-v27.mjs --apply` → `publish-frame-v27.mjs --apply`. Fuente `supabase/operations/publish-frame-v27.sql`; auditoría actual de lectura `validate-frame-v27.mjs`. No modificación de bytes publicados ni commits.
