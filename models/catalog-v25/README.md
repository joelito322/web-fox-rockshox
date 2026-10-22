# SUPREME DH V5 · v25

Revisión individual M/L desde v11. Conserva los otros catorce cuadros/28 capturas actuales, los guardados históricos, las cuatro prearmadas, especificaciones y acabados. La fotografía real del card permanece; no se sustituye por un render. No se añaden tablas, campos comerciales, CSG runtime ni reconstrucción de geometría en producto.

## Fuentes propias

[Archivos, URL y SHA](references/sources.json): catorce ilustraciones técnicas de la página oficial [SUPREME DH V5 TECH](https://www.commencal.com/us/en/tech-supreme-dh-v5.html); dos perspectivas del frameset FT3SUPV54 y una fotografía de taller/ajustes. El despiece distingue triángulo delantero, upper/lower link, barras auxiliares, pieza 6-bar, tirantes, vainas, puentes, guía/polea y protecciones. No usar XS ni V5.2 como sustituto de estas tallas/generación.

Cinco vídeos oficiales descargados de la [presentación SUPREME DH V5](https://www.commencal.com/us/en/landing-supreme-dh-v5.html): cinemática1, cinemática2/despiece, bridge, stays y flipchip. Se han muestreado realmente seis instantes por vídeo, a lo largo de sus duraciones, y revisado las cinco hojas de contacto. [Tiempos y capturas](references/video-review.json). Confirman contrapartes, eje/puente, apertura de punteras y disposición del elemento largo; no se deducen de ese muestreo todas las posiciones ni una curva de palanca exacta.

El perfil usa coordenadas 1452×928 de la imagen técnica lateral oficial, conservada en `models/reference-set/references/supreme-lateral.jpg`, registrada a BB/dirección/eje trasero heredados. Es una ilustración de geometría, no una fotografía ortográfica calibrada ni CAD. Se contrasta con la foto diagonal y los despieces/vídeos; profundidades, radios, uniones ocultas y adaptación entre tallas siguen estimados.

## Anatomía reconstruida

- Superior con rectas y desvíos locales, diagonal larga con curva inferior localizada, collar corto y dos ramas del arco delantero. Los extremos del arco convergen dentro del superior; el hueco triangular junto al collar permanece abierto.
- Tirantes y vainas de dos caras, articulaciones delanteras, adaptadores cortos del eje posterior, carcasas y puentes localizados. Soporte de freno solo en lado no motriz y patilla solo en transmisión, sin duplicación indiscriminada.
- Enlaces superior/inferior, barras de HVCS exterior con ventana longitudinal, apoyos y anillos de tornillos. Ambos ojos mantienen las posiciones de suspensión v11 y el entreojos comercial de 250 mm (precisión numérica heredada); no añadir un puente de pintura fijo a los ojos móviles.
- Polea dentada unilateral con vaciados, soporte y guía propios; guardabarros con apoyo transversal, protector de cadena/ribs y protector inferior siguiendo los nuevos miembros. Se eliminan fragmentos antiguos dentro de dos máscaras declaradas, reconstruyendo esas partes; las caras mecánicas fuera de las máscaras se conservan por triángulos.
- Dirección hueca y pasos de montaje abiertos. La holgura completa del pedalier incluye las mejillas móviles: la revisión de talla L detectó y corrigió una invasión pequeña de la placa inferior antes de subir archivos.

Las placas y profundidades representan el exterior del sistema HVCS, sin reconstruir los seis cuerpos internos de fábrica ni soldaduras o laminados. La inspección de suspensión conserva la guía reducida de v1; tres poses visuales no certifican contactos, cinemática exacta o los 220 mm completos.

## Anclaje de tija y conservación

Solo `saddle` visual cambia en las nuevas identidades, alineado al último tramo del tubo observado y con la misma longitud desde `seat_tube`. El resto de los anclajes, ojos de amortiguador, ruedas/dirección, medidas y acabados quedan exactos. Antes/después por ID en `anchor-corrections.json`; SQL exige únicamente ese cambio concreto. Se actualiza el marcador GLB correspondiente, sin tocar manifiestos ni recursos anteriores. No corregir un perfil fotografiado para acomodar una estimación de tija heredada.

La geometría se construye offline, se agrupa por material y se indexa. Los archivos GLB publicados son inmutables; cualquier corrección física posterior requiere otra identidad/versión.

## Flujo reproducible

Con frontend local o `ATLAS_BASE_URL`:

```sh
node scripts/prepare-frame-v25.mjs
node scripts/inspect-frame-v25-exports.mjs
node scripts/inspect-frame-v25-preservation.mjs
node scripts/inspect-frame-v25.mjs
node scripts/inspect-frame-v25-passages.mjs
node scripts/review-all-frames.mjs --v25 --all
node scripts/review-frame-v25-details.mjs
node scripts/review-frame-v25-overlay.mjs
node scripts/validate-frame-v25.mjs --before
```

`ATLAS_LOCAL_MODEL_VERSIONS=v25 node scripts/review-suspension-motion.mjs --v25 --model=commencal-supreme-dh-v5` revisa el montaje con los GLB locales antes de subirlos, sin modificar producto. Tras revisión, `prepare-frame-v25.mjs --apply` carga/relee por SHA y `publish-frame-v25.mjs --apply` publica solo sus dos elecciones. SQL fuente `supabase/operations/publish-frame-v25.sql`. `validate-frame-v25-transition.mjs --publish` realiza publicación/prueba de guardados anteriores/nuevos y limpia la cuenta temporal; auditoría posterior de lectura `validate-frame-v25.mjs`.

Visor interno `/tests/fixtures/frame-v25-review.html?version=v25&view=lateral`, fuera del build. Evidencia en [12t](../../docs/planning/12t-evidencia-supreme-v25.md). No certificar 100 % CAD, ajuste mecánico, ausencia exhaustiva de colisiones ni FPS/Android físico.

## Publicación y comprobación

Publicado tras v24: dos GLB/cinco mallas por talla, 6.086.508 bytes totales cargados/releídos por SHA. Tipos/build y 313 pruebas correctos, 28 SHA ajenos intactos, 22 rayos y 50 completos de BB libres. Dos montajes previos y dos nuevos comprobados con cuenta temporal eliminada. Estado propio: 70 modelos, 146 elecciones, 772 variantes/770 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas. Fotos de cards intactas. Evidencia detallada en 12t y archivos JSON locales. No alterar estos bytes; otra corrección física requiere nueva identidad.
