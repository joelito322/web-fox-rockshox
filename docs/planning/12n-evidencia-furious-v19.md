# 12n · Furious V3 2021 completo v19

Solicitud individual del usuario para Furious M/L desde sus recursos v13. Los otros catorce cuadros/28 capturas actuales quedan protegidos, incluidos CAPRA v15, CHERRY v16, Force v17 y FRS v18. Anclajes, especificaciones, acabados, prearmadas y montajes privados se conservan. No reconstrucción runtime, tablas, campos comerciales o funciones de producto nuevos.

## Fuentes y observación

Cuatro fotografías oficiales Gun Metal de la bicicleta 2021: lateral, diagonal, detalle de articulación y vista superior. Además, foto oficial japonesa del cuadro Gunmetal sin afirmar el año de esa fotografía suplementaria. Nueve ilustraciones técnicas de las piezas FUV3 que la lista oficial 2021 identifica como comunes: bieleta, pivotes, puntera, protecciones y bumpers. [Archivos, URLs y SHA](../../models/catalog-v19/references/sources.json).

La lista oficial [2021 Furious Essential](https://static.commencal.com/tech/2021-COMMENCAL-FURIOUS-ESSENTIAL.pdf?nocache=1771013794) se leyó mediante el PDF en caché web; el origen directo rechazó la descarga y no se declara un PDF local. Confirma W20FUV3ROCKER, AXLEMP, AXLECS, RHR, BUMPER y PROTECDT. Esto permite consultar los despieces comunes; no permite suponer iguales toda la silueta ni la gráfica de Furious y FRS.

El trazado tiene coordenadas 2000×1138 de la lateral histórica y se registra a los anclajes existentes. Estos continúan siendo estimaciones de ensamblaje: no se transforman píxeles en nuevas cotas comerciales ni se certifica geometría CAD.

## Reconstrucción propia

Superior con hombro local junto a sillín y largo tramo recto hasta el interior de la pipa, sin cuello artificial al final. Diagonal y sillín con codos localizados, secciones más planas de aluminio en miembros longitudinales y vainas. El basculante tiene dos lados y articulación diferenciada en puntera, cierres transversales delanteros y tapas de pivote. Bieleta de dos placas con ventana alargada; apoyo superior del amortiguador fijo y con orejetas ensanchadas, inferior móvil hasta su anclaje heredado. Protecciones, patilla y soporte de freno conservan sus lados; el protector de cadena sigue su superficie en profundidad.

Los trayectos principales y contorno de bieleta son propios del Furious. Solo algunos accesorios confirmados comunes se registran desde la construcción anterior. Las máscaras locales sustituyen antigua bieleta/patilla genéricas, conservando triángulos negros ajenos y metal. La agrupación por material y deduplicación offline mantiene seis mallas por talla. Profundidades, secciones ocultas, radios y tipografía siguen inferidos; rótulos aproximados, no copia gráfica exacta.

La tarjeta conserva su recorte fotográfico existente del cuadro 2021; las superficies que antes ocultaban componentes se reconstruyeron en ese recurso previo y no se usan como referencia dimensional. No se cambia por un render ni se modifica la fotografía de FRS o las demás tarjetas.

## Validación y publicación

- Build y tipos estrictos de constructor/fixtures correctos; 247 pruebas en 54 archivos (`pnpm run test --maxWorkers=2`). Siguen las advertencias previas de tamaño de bundle/dependencias, sin nuevos cambios del frontend de producto.
- Dos GLB finitos con anclajes y pintura presentes; seis mallas por talla, 2.804.564 bytes en total. Límites de extensión descartan accesorios lejanos a la envolvente del cuadro. [Inspección](../../models/catalog-v19/inspection.json).
- 28 capturas ajenas mantienen SHA; triángulos de metal y detalles negros fuera de las máscaras preservados. [Conservación](../../models/catalog-v19/preservation.json).
- 14 vistas generales (M/L y ambas caras), diez primeros planos de dirección y dos superposiciones de la foto 2021 registrada. Se corrigieron el cuello artificial al final del superior, secciones de vainas y orejetas ensanchadas; revisión final sin hueco exterior bajo pipa. Borde interior facetado y uniones por solape siguen siendo simplificaciones.
- 22 rayos de dirección/sillín/pedalier despejados; pruebas de rectas, ventana y apoyos de bieleta y superior fijo/inferior sin puente fijo. [Pasos](../../models/catalog-v19/bore-review.json).
- Montaje articulado en reposo/50/100: tres capturas sin errores del navegador, movimiento observado con el perfil de inspección existente. No equivale a reconstrucción cinemática exacta o aceptación de FPS. [Articulación](../../models/catalog-v19/motion-review.json).
- Dos recursos cargados/releídos por SHA, publicación SQL acotada aplicada, dos guardados anteriores y dos nuevos comprobados; cuenta temporal eliminada. [Transición](../../models/catalog-v19/transition.json).

Reposición tras v18: `prepare-frame-v19.mjs --apply` → `publish-frame-v19.mjs --apply`; fuente SQL `supabase/operations/publish-frame-v19.sql`. Auditoría posterior `validate-frame-v19.mjs` en `cloud-after.json`; validadores previos describen snapshots. Estado tras publicación: **70 modelos, 146 elecciones, 760 variantes/758 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias. No se convierten montajes guardados ni prearmadas.

No certificar identidad CAD del 100 %, soldadura/laminado o ajuste mecánico exactos, ausencia exhaustiva de colisiones, continuidad cinemática exhaustiva o Android físico/FPS. Los montajes guardados mantienen su recurso histórico; volver a seleccionar Furious usa la nueva revisión. Sin commits salvo solicitud explícita.
