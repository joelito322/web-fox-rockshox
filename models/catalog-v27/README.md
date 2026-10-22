# TUES MK4 Carbon · v27

Corrección final individual M/L tras la revisión v26. Misma investigación propia, perfil e interpretación del TUES MK4: [fuentes, fotogramas, metodología y límites](../catalog-v26/README.md). El acercamiento final de dirección en v26 mostró discontinuidades de la llegada inferior; sus archivos quedan inmutables como snapshot intermedio, sin considerarla aceptación final.

V27 termina las secciones completas de superior/diagonal dentro del cuerpo exterior de pipa; en el último tramo se reducen ancho/altura a 21/20 mm y se centra la llegada inferior al 48 % del eje. Son secciones exteriores estimadas, no medidas comerciales. Se conservan eje, extremos y paso interior. Se ajusta la profundidad de las placas y del pequeño YT a las nuevas superficies para que no queden separados. No hay corrección global ni intercambio de perfiles de otras marcas.

Conserva especificaciones, acabados y todos los anclajes de v26; el cálculo de saddle conserva su alineación/longitud y solo puede producir la misma referencia con redondeo numérico. El contrato exacto se registra por UUID y solo permite esa clave. No se alteran recursos ni montajes privados anteriores, fotos de cards o prearmadas. Las 28 capturas ajenas conservan sus SHA.

Construcción offline `frames.ts`, dos GLB estáticos/cinco mallas por talla. Herramientas `scripts/*v27*.mjs` repiten inspección de geometría/pasos completos, conservación, vistas/overlay, transición y auditoría Cloud. Reposición tras v26: `prepare-frame-v27.mjs --apply` → `publish-frame-v27.mjs --apply`; SQL `supabase/operations/publish-frame-v27.sql`. `validate-frame-v27-transition.mjs --publish` aplica/publica entre pruebas de guardados anteriores/nuevos y limpia su cuenta temporal. `validate-frame-v27.mjs` es de lectura posterior; fuentes y capturas anteriores permanecen.

Visor interno `/tests/fixtures/frame-v27-review.html?version=v27&view=lateral`. `ATLAS_LOCAL_MODEL_VERSIONS=v27 node scripts/review-suspension-motion.mjs --v27 --model=yt-tues-mk4-carbon` revisa GLB locales antes de carga. Fuera del build de producto; no CSG ni geometría runtime.

Evidencia final en [12u](../../docs/planning/12u-evidencia-tues-v26.md). No certificar CAD/100 %, ajuste mecánico, cinemática/colisiones exhaustivas ni Android físico/FPS. Sin commits salvo solicitud explícita.
