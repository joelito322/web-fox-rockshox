# 12o · Fury Carbon High Pivot completo v20

Solicitud individual del usuario para Fury M/L desde sus recursos v13. Los otros catorce cuadros/28 capturas actuales quedan protegidos, incluidos CAPRA v15, CHERRY v16, Force v17, FRS v18 y Furious v19. Se conservan anclajes, especificaciones, acabados, prearmadas y montajes privados. Sin generador runtime, tablas, campos comerciales ni funciones nuevas.

## Fuentes y observación

Cinco fotos oficiales: lateral y diagonal del frameset Black; detalles High-Pivot LTS, Maximum Tunability y Ruckus Management para bieleta, polea, guía, punteras y protecciones. Dos manuales descargados y leídos: [Fury OMS](https://gtbicycles.com/cdn/shop/files/G24_GT_Fury_OMS.pdf?v=6564285968978387813) y [GT Tech Book 2024](https://cdn.shopify.com/s/files/1/0775/1912/6825/files/2024_GT_Tech_Book.pdf?v=1715117251). Este último se contrastó visualmente en sus páginas impresas 4–6 (PDF 5–7), correspondientes al Fury 2023+, sin usar el apartado 2019–2022 para definir esta silueta. [Archivos, URL y SHA](../../models/catalog-v20/references/sources.json).

La [ficha oficial del frameset](https://gtbicycles.com/products/fury-carbon-frameset) y el despiece distinguen la bieleta K91003, guía K11023, protecciones y bumpers. K91003 es un yugo sólido con taladros de rodamiento: no heredar la ventana calada grande del Force. El cuadro tiene ventana triangular real en la cuna inferior, apoyo inferior fijo del amortiguador y superior móvil. La referencia de otro acabado solo informa estructura, no cambia el acabado Black del catálogo.

Fotografías nativas 2150×1850; trazado 1696×1459 y registro heredado BB/dirección/eje trasero. Las dos imágenes repetidas/reducidas del conjunto anterior no se cuentan como cuatro perspectivas distintas. Las coordenadas registradas siguen siendo estimaciones visuales, no nuevas medidas comerciales ni CAD.

## Reconstrucción

Superior con hombro y espina propios del Fury; diagonal con rectas largas y desvíos locales, cuna de dos caras con ventana triangular abierta y apoyo inferior taladrado, bieleta de dos placas con tres apoyos, vainas con articulación delantera y secundaria trasera. Se completa ambos lados sin reflejar patilla, soporte de freno, polea o guía. Pipa hueca con paredes y miembros insertados, diámetro visual aproximado de 49 mm corroborado por ZS49, sin certificar ajuste.

Protecciones derivadas de las superficies de diagonal y vaina, topes laterales insertados en el superior y gráfica GT aproximada. Se corrigió una primera protección que sobresalía de la superficie junto a pipa y el tamaño aparente de la marca. Profundidades, secciones ocultas, radios y uniones por solape siguen inferidos. La tarjeta mantiene su foto existente; no se cambia por render.

Agrupación e indexado offline: cinco mallas por talla, sin incremento de trabajo de construcción del frontend. Se conservan metales y detalles negros anteriores fuera de la máscara de bieleta. [Método y reproducción](../../models/catalog-v20/README.md).

## Comprobaciones y publicación

- Build y tipos estrictos de constructor/fixtures correctos. **255 pruebas en 55 archivos**, incluyendo rectas y contornos, apertura de ventana y apoyo inferior fijo/superior sin puente fijo. Se mantienen advertencias previas del bundle/dependencias.
- Dos GLB finitos, anclajes y pintura presentes; cinco mallas por talla, **3.169.032 bytes** en total. Envolvente acotada; distancia desde centros huecos a superficie no es error de anclaje. [Inspección](../../models/catalog-v20/inspection.json).
- **28 capturas ajenas** mantienen SHA y los triángulos mecánicos fuera de la máscara permanecen. [Conservación](../../models/catalog-v20/preservation.json).
- **14 vistas generales**, diez primeros planos de dirección y dos superposiciones de la foto registrada. Revisión de ambas caras/superior/inferior; no equivale a una medición exhaustiva de silueta ni a certificación del 100 %.
- **22 rayos despejados** de dirección, sillín y pedalier. [Pasos](../../models/catalog-v20/bore-review.json). Ventana inferior y apoyos comprobados también mediante rayos con controles sobre superficie sólida.
- **Tres poses** de inspección de suspensión (reposo/50/100), sin errores del navegador y movimiento observado con el perfil existente. No valida cinemática exacta ni ausencia exhaustiva de colisiones; la horquilla del conjunto de prueba es una selección de inspección y no identifica un montaje comercial Fury. [Articulación](../../models/catalog-v20/motion-review.json).
- Dos recursos cargados y releídos por SHA, publicación SQL acotada aplicada; dos montajes anteriores reabiertos con identidad conservada y dos nuevos guardados. Cuenta temporal eliminada. [Transición](../../models/catalog-v20/transition.json).

Reposición tras v19: `prepare-frame-v20.mjs --apply` → `publish-frame-v20.mjs --apply`. SQL `supabase/operations/publish-frame-v20.sql`; auditoría de lectura `validate-frame-v20.mjs` y `cloud-after.json`. Estado: **70 modelos, 146 elecciones, 762 variantes/760 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias. Validadores previos representan sus snapshots históricos.

Guardados y prearmadas no se convierten: seleccionar de nuevo Fury usa v20. Los bytes publicados quedan inmutables. No certificar identidad CAD del 100 %, ajuste mecánico/laminado, continuidad o colisiones exhaustivas, ni Android físico/FPS. Sin commits salvo solicitud explícita.
