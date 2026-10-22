# Evidencia · Uniones de dirección v12

**Retirada por petición del usuario:** la corrección global v12 se revierte a v11. La evidencia siguiente describe la publicación histórica, no la versión vigente ni aceptación visual. Los recursos se conservan para montajes históricos. Operación y comprobación: `scripts/rollback-frame-v12.mjs`; no republicar v12.

Relacionado: [contrato de revisión](05d-revision-integral-cuadros.md), [aperturas v11](12f-evidencia-pasos-v11.md), [estado](12-estado-implementacion.md).

## Defecto y corrección

La apertura axial de v11 no corregía la unión exterior de la pipa: tubos terminados en sus planos extremos sobresalían por arriba/abajo, generaban orejas o dejaban intersecciones visibles. La revisión amplía el control a las caras exteriores y al espacio inmediato fuera de ambos bordes.

V12 aproxima los extremos de los tubos hacia el interior de la pipa con una transición localizada que conserva su espesor. Sustituye la camisa anterior y sus superficies penetrantes por recorte cónico offline y una sección anular continua. Los quince modelos tienen perfiles de radio exterior explícitos, estimados desde las referencias heredadas por generación. No se declaran cotas nuevas de fabricante ni una reconstrucción exacta de soldaduras/carbono.

Se conservan eje, longitud y anclajes, especificaciones, acabados y todos los recursos anteriores. Treinta GLB nuevos, 49.531.060 bytes, cuatro/cinco mallas como antes. No hay CSG runtime ni nuevas consultas de interacción. La envolvente exterior cambia localmente; el mayor cambio combinado de extremos de bounding box es 9,21 mm, no una medida de error respecto a la bicicleta real.

## Comprobaciones locales

- Exportaciones: treinta recursos, posiciones/normales finitas, grupos pintables y anclajes presentes (`models/catalog-v12/inspection.json`). Identidades y SHA de v11 conservados.
- 210 renders generales: siete perspectivas por talla, quince modelos y treinta variantes; sin errores de página (`/tmp/atlas-frames-v12`). Una ejecución inicial fue interrumpida por la recarga de desarrollo al regenerar fuentes; se repitió completa con servidor de revisión aislado sin HMR.
- 150 primeros planos: dirección axial y uniones lateral, frontal, posterior e inferior de las treinta variantes (`detail-review.json`, `/tmp/atlas-v12-details`). La inspección visual se apoya en hojas de los quince modelos y los renders individuales.
- 330 rayos de paso: se amplía la prueba de dirección 50 mm fuera de cada extremo y se añaden posiciones laterales. Se detectan 60 rayos obstruidos en v11 y cero en v12; sillín/pedalier mantienen su comprobación anterior (`bore-review.json`). Esto no acredita ajuste de rodamientos ni ausencia exhaustiva de colisiones.
- Build y TypeScript correctos. Suite final: 152 pruebas en 43 archivos. La comprobación estricta de TypeScript incluye constructor y herramientas internas.

## Publicación y recorridos

Treinta recursos cargados y releídos por SHA; publicación acotada completada y cuatro prearmadas actualizadas. Auditoría remota de lectura correcta: 70 modelos, 146 elecciones, 728 variantes/726 recursos históricos, cuatro prearmadas/92 posiciones; las geometrías y especificaciones históricas se conservan.

Quince conjuntos revisados con horquilla y suspensión, en reposo, postura intermedia y final (45 vistas, `motion-review.json`). Transición real: quince montajes v11 guardados antes de publicar y reabiertos/regrabados después, treinta montajes parciales v12 y cuatro completos; cuenta temporal eliminada (`transition.json`). Las posturas son la inspección exterior estimada existente, no recorridos físicos certificados.

Cuatro recorridos de navegador correctos (dos escritorio y dos Pixel 7 emulado sobre Chromium): reproducción/restablecimiento y guardado/reapertura autenticados. Ambos runners terminaron correctamente tras limpiar imágenes y cuentas temporales. La emulación no equivale a Chrome/Brave Android físico.

Recursos e identidades nuevas en `models/catalog-v12/` y `supabase/catalog/frames-v12-*.json`; operación SQL versionada antes de cualquier publicación.

## Límites

Pipa y unión exterior son aproximaciones visuales específicas de cada modelo. No certifican CAD, tolerancias de fabricación, compatibilidad física, radios de laminado/soldadura, parecido del 90 %, colisiones exhaustivas ni FPS en Android físico. Los montajes guardados conservan sus versiones; la elección nueva usa v12 ya publicada. Las herramientas de revisión no forman parte del build de producto.
