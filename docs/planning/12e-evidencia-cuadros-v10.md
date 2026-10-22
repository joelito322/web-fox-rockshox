# 12e · Revisión integral de cuadros v10

21/10/2026. Contrato: [05d](05d-revision-integral-cuadros.md). Fuentes y decisiones por cada modelo en [references.md](../../models/catalog-v10/references.md). La mejora exterior se aplica a los quince cuadros publicados, no solo a los siete añadidos.

## Resultado

- Treinta GLB nuevos: dos tallas nativas por modelo, conservando M/L, S3/S4 y 17″/19″ según la marca. Los ocho cuadros originales conservan su trazado independiente y detalles estructurales v6, con envolventes redondeadas, anchura variable y volumen en ambos pares de brazos. Los siete gravity incorporan placas de bieletas, raíces, yugos, soportes y correcciones de sus perfiles; CAPRA mantiene el refuerzo asimétrico.
- Cuarenta y ocho imágenes/diagramas adicionales descargados e inspeccionados, además de las referencias v5/v6/v9 conservadas. Tres vídeos inspeccionados por muestras y capturas explícitas de detalle. Fotos de acción usadas solo como contexto. No se confunde descubrir una URL con inspeccionar una pieza ni se afirma haber agotado Internet.
- 210 capturas locales: treinta tallas × siete cámaras. Revisión visual de ambos lados, diagonales, frente, superior e inferior; coordenadas, normales, nombres de pintura y anclajes comprobados en los treinta archivos exportados. Correcciones intermedias con huecos en GT Force se descartaron antes de subir.
- Cuarenta y cinco capturas de quince bicicletas montadas: reposo y dos posturas internas de inspección (50/100 %). El script ahora invoca explícitamente la postura de revisión: mover los controles del producto sin reproducir debe seguir dejando reposo. La API interna recibe fracciones, no porcentajes enteros.
- Capturas agrupadas en cuatro o cinco mallas por archivo; vértices compartidos solo si coinciden posición, normal y UV. Conserva bordes de material y evita un draw call por tubo. Total: **49.503.140 bytes**, frente a **53.866.944** de las treinta capturas anteriores (**8,1 % menos**). Es una comparación de bytes GLB, no una medición de latencia o FPS en Android.

## Publicación e historial

`supabase/catalog/frames-v10-reviewed.json`, `frames-v10-successors.json` y `frames-v10-examples.json` son la fuente de la publicación. `uploads.json` registra SHA-256, identidad, ruta de Storage y fecha de verificación. El bucket público entrega los treinta GLB con hash correcto; no se sobrescribe ningún recurso.

`scripts/publish-frame-v10.mjs` y `supabase/operations/publish-frame-v10.sql` solo insertan recursos/variantes, retiran de selección las treinta predecesoras y actualizan las cuatro composiciones de ejemplo. No actualizan metadatos de otras categorías, medidas comerciales ni recursos históricos; tampoco modifican montajes privados. Sin migraciones, tablas, permisos o Edge Functions nuevos.

Estado Cloud comprobado en lectura: **70 modelos, 146 elecciones, 668 variantes y 666 recursos con historial, cuatro prearmadas/92 posiciones**; continúan 22 migraciones y doce tablas propias. Se compararon todas las identidades, medidas, acabados, manifiestos y rutas históricas de las fuentes anteriores. Evidencia: `cloud-before.json` y `cloud-after.json`.

Transición real con una cuenta temporal normal:

- Quince montajes parciales anteriores guardados antes de publicar, uno por cuadro; después conservaron sus IDs y se volvieron a guardar con revisión 2.
- Treinta variantes nuevas guardadas y cuatro composiciones completas guardadas.
- Cuenta temporal eliminada al terminar, con limpieza de sus montajes. Resultado versionado en `transition.json`.

Los montajes anteriores conservan la geometría elegida originalmente. Para usar v10 se elige la nueva variante del cuadro; no se convierte una bicicleta guardada silenciosamente.

## Validación y reproducción

- `node scripts/prepare-frame-v10.mjs --apply`: reconstruye en local, rechaza bytes diferentes de una captura v10 subida, carga y relee Storage; no publica elecciones.
- `node scripts/inspect-frame-v10.mjs`: carga los treinta GLB exportados y comprueba geometría, pintura y coordenadas de anclajes; genera `inspection.json`.
- `ATLAS_FRAME_REVIEW_OUTPUT=/tmp/atlas-frames-v10 node scripts/review-all-frames.mjs --v10 --all`: siete vistas por talla, sin errores de página.
- `ATLAS_MOTION_REVIEW_OUTPUT=/tmp/atlas-motion-v10 node scripts/review-suspension-motion.mjs --all --v10`: quince conjuntos montados, postura observada distinta de reposo y sin errores de página. Revisión estática interna, separada de los controles de reproducción del producto.
- `node scripts/validate-frame-v10.mjs`: solo lectura; verifica el estado posterior y conserva todos los recursos previos. `--before` corresponde al estado anterior a esta publicación, no al estado vigente.
- `node scripts/validate-frame-v10-transition.mjs --publish`: prueba con escrituras reales descrita arriba; aplica la publicación e incluye limpieza. No es una auditoría de solo lectura.
- TypeScript estricto adicional para el constructor y las dos herramientas internas; suite general: **144 pruebas / 40 archivos correctos**.

Las doce comprobaciones de navegador pasaron: cinco de interacción más una de guardado autenticado en cada plataforma (escritorio y Pixel 7 emulado). Las dos de guardado se repitieron por separado después de acotar al visor el selector de «Suspensión»: la navegación de grupos tiene otro botón con el mismo nombre. El runner admite un cuarto argumento de filtro para repetir solo el caso afectado, conservando la creación y limpieza de cuentas/imágenes.

La prueba inicial de transición encontró una importación de tipos de prearmadas incompatible con resolución directa de Node; se corrigió la herramienta sin cambiar el producto ni aplicar la publicación fallida. Se repitió la transición completa. Algunas capturas de desarrollo se interrumpieron al recargar Vite mientras se editaban herramientas; el lote final de 210 imágenes se ejecutó completo después de esos cambios. La suite general tuvo un timeout en la generación histórica de 128 mallas v4 mientras corrían simultáneamente varios navegadores; se repitió con los navegadores ya cerrados.

## Límites

Los anchos, radios, interiores y cierres ocultos siguen siendo estimaciones identificadas por modelo. Cherry Bomb no tiene una nueva vista superior calibrada y Ransom no reconstruye el mecanismo interior; SUPREME/Ransom conservan sus perfiles de movimiento exterior reducido. Las distancias diagnósticas de `inspection.json` miden centros de ejes contra superficie: el centro del eje trasero está en el espacio libre entre punteras y el anclaje interno del Ransom queda dentro de su cavidad; no son huecos estructurales medidos ni tolerancias de montaje. Comprobar distancia de registro de un anclaje no certifica todos los contactos, malla soldada, resistencia ni ausencia de colisiones. No se certifica parecido del 90 %, CAD, 30 fps o Android físico. La aceptación visual final del usuario permanece abierta.
