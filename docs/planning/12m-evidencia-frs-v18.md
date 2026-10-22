# 12m · FRS V3 Pure White completo v18

Solicitud individual del usuario: mejorar el FRS M/L según su diseño original y reemplazar el render de su tarjeta por imagen original del cuadro. Predecesoras v13; otros catorce cuadros/28 capturas protegidos, incluidos CAPRA v15, CHERRY v16 y Force v17. No cambiar especificaciones, acabados, anclajes, prearmadas ni montajes privados.

## Fuentes y construcción

Dos fotografías oficiales del frameset Pure White (lateral y diagonal) y nueve ilustraciones técnicas oficiales FRS V3: dirección/bumpers, bieleta, pivote principal, vainas, punteras, protecciones y dos rutas de cables. [Fuentes, archivos y SHA](../../models/catalog-v18/references/sources.json). Las ilustraciones explican piezas ocultas y uniones; no se cuentan como nueve fotografías independientes ni como acceso a CAD. Algunas representan acabados sin pintura y se usan solo para forma y relaciones.

El trazado conserva las referencias de inspección 1920×1280 del perfil anterior; las fuentes históricas de 2000×1333 se escalan al superponer. Se registran al ensamblaje existente mediante pedalier, dirección y eje trasero. Las posiciones de ensamblaje anteriores son estimaciones: esta revisión no convierte esas posiciones en cotas CAD ni cambia la geometría comercial declarada.

El superior tiene un eje recto; diagonal y sillín conservan codos locales propios. Vainas por pares con articulación diferenciada en puntera y cierre transversal de los apoyos delanteros. Bieleta con ventana rectangular alargada y dos placas; soporte superior del amortiguador fijo a diagonal, inferior móvil con orejetas hasta su anclaje heredado. Máscaras explícitas sustituyen únicamente la antigua bieleta negra y la patilla genérica; triángulos negros ajenos y metal anterior se conservan. Protector estriado de cadena unilateral con abertura blanca, protección inferior y superior de diagonal y bumpers laterales; soporte de freno en su lado propio. Rotulación superior vertical espaciada y rótulos FRS aproximados; no se certifica reproducción tipográfica exacta.

La preparación offline agrupa por material y deduplica vértices: seis mallas por talla; relieves no agregan una llamada de dibujo individual. No nuevo generador runtime, CSG, campos de guardado ni dependencias.

## Fotografía de catálogo

`src/assets/images/catalog/commencal-frs-v3.webp` usa la fotografía oficial original conservada como `models/catalog-v9/references/frs-frame.webp`, sin reconstrucción generativa. Muestra únicamente el cuadro Pure White con su fondo de estudio original. SHA comprobado desde la tarjeta pública; [evidencia](../../models/catalog-v18/card-review.json). Render anterior archivado en `references/prior-card-render.webp`; listado vigente en `photos.json`, retirado de `renders.json`. El generador histórico de render rechaza `--apply` para no sobrescribir la elección fotográfica. El resto de imágenes no cambia; cobertura actual 65 fotografías y cinco renders.

## Validación

- Tipos estrictos de constructor/fixtures y build correctos; 239 pruebas en 53 archivos (`pnpm run test --maxWorkers=2`). Persisten advertencias anteriores de bundle grande y dependencias.
- Dos GLB con geometría finita, anclajes y pintura presentes: seis mallas por talla y 2.800.268 bytes totales. [Inspección](../../models/catalog-v18/inspection.json).
- 28 recursos ajenos con SHA intacto; triángulos de metal y detalles negros fuera de las dos máscaras conservados. Bieleta y patilla se reconstruyen explícitamente. [Preservación](../../models/catalog-v18/preservation.json).
- 14 vistas generales de ambas tallas/caras, diez detalles de dirección y dos fotografías registradas. Se corrigieron localmente llegada a pipa, conformación de protector de cadena y colocación de palabra superior; la revisión macro posterior confirma canal abierto, unión exterior sin hueco y texto sobre el tubo. Existe faceteado interior en macro y las uniones por solape no certifican una malla soldada.
- 22 rayos de dirección/sillín/pedalier despejados. Pruebas de rectitud, ventana/apoyo de bieleta, soporte superior fijo/inferior libre y fotografía real. [Rayos](../../models/catalog-v18/bore-review.json).
- Montaje de inspección en reposo/50/100: tres capturas y movimiento observado sin errores de navegador. Es la aproximación de inspección existente, no simulación física, garantía de continuidad cinemática exhaustiva o aceptación de FPS. [Articulación](../../models/catalog-v18/motion-review.json).
- Carga y relectura SHA de dos recursos, publicación SQL acotada y transición de dos guardados anteriores/dos nuevos, con cuenta temporal eliminada. [Transición](../../models/catalog-v18/transition.json). Fotografía verificada desde la tarjeta pública por SHA.

Publicación aplicada tras v17: `prepare-frame-v18.mjs --apply` → `publish-frame-v18.mjs --apply`, fuente SQL `supabase/operations/publish-frame-v18.sql`. Auditoría posterior de lectura `validate-frame-v18.mjs`, evidencia `cloud-after.json`; anteriores son snapshots. Estado: **70 modelos, 146 elecciones, 758 variantes/756 recursos históricos, cuatro prearmadas y 92 posiciones**, mismas 22 migraciones/doce tablas propias. Guardados previos y prearmadas sin conversión.

Secciones transversales, profundidad oculta, radios y unión superficial siguen estimados; no certificar CAD/100 %, soldadura exacta, ajuste mecánico, colisiones exhaustivas o Android físico/FPS. Los guardados anteriores mantienen sus recursos; volver a elegir FRS usa la nueva revisión. Sin commits salvo solicitud explícita.
