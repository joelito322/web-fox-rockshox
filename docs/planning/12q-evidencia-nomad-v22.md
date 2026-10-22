# Nomad 7 CC · fidelidad individual v22

## Alcance

El usuario solicita revisar Nomad 7 CC en paralelo con META SX V5, S-Works Enduro y Sender CFR. Este conjunto solo modifica Nomad 7 MY27 M/L, desde v11, con fuentes offline en `models/catalog-v22/`. META v21 y los otros trece cuadros conservan sus SHA; no son una corrección global de pipa.

## Evidencia y decisiones

Dos fotografías oficiales de cuadro MY27 del mismo ángulo/acabados distintos, doce archivos de detalle y cinco fotos de piezas reales; siete despieces específicos Nomad 7 realmente abiertos. Los archivos no equivalen a perspectivas distintas: algunos detalles repiten encuadre/acabado. Fuente y SHA en `references/sources.json`, detalles/observación/inferencia en el README propio.

Se han reconstruido el superior, diagonal y su codo, bifurcación inferior de sillín, arco del basculante y pares traseros, ventana triangular del triángulo delantero, dos enlaces VPP con puentes, taladros y tornillería local, Glovebox y protecciones. No se replica el VPP de Nomad 6. La fuente técnica confirma IS41/IS52, 230×65 y MX; los datos comerciales existentes no se reescriben.

Se investigó un posible desplazamiento del ojo trasero y **se descartó antes de cualquier publicación**: la parte visible de la espiral no es el ojo oculto. El entreojos histórico es coherente con 230 mm; la hipótesis alternativa daba ~153 mm. Se mantienen los anclajes de suspensión, acabados y especificaciones, completando la horquilla/clevis trasera con apoyo en despiece.

## Validación local

- Dos recursos con seis mallas por talla; finitud, escala exterior, nodos pintables y anclajes comprobados.
- Doce pruebas propias de alcance/hash/contratos, rectas y desviaciones locales, apoyo delantero fijo, paso central libre del ojo trasero y ventana triangular abierta con control sólido.
- 22 rayos axiales despejados en ambas tallas; protección por SHA de los otros 28 recursos y conservación de triángulos de detalle fuera de la máscara local.
- Catorce vistas generales, diez detalles de dirección y dos superposiciones registradas; ficheros de resultados en el directorio v22. Revisión visual lateral/opuesta/diagonal y despieces realizada.

## Revisión cruzada: pedalier y tija

El agente principal pidió descartar un tapón aparente del pedalier con un segmento suficientemente largo. `inspect-frame-v22-passages.mjs` comprueba todas las mallas del GLB desde z=+0,15 a z=−0,15, en el centro y anillos de 6/12/18mm: 50 rayos, cero impactos. No hubo que abrir ni deformar otra zona: el paso completo ya estaba libre.

La misma revisión detectó 8,83°/10,33° de diferencia entre la tija heredada y el tramo superior real. Se autorizó corregir únicamente la referencia visual `saddle` en los nuevos recursos v22; conserva longitud y los otros ocho anclajes, sin retorcer el perfil propio. Estado posterior: 0° en ambas tallas. IDs y antes/después en `anchor-corrections.json`. SQL admite solo este cambio exacto; originales v11 inmutables. No cambia el perfil de suspensión.

## Integración publicada

Revisión coordinada completada: tipos estrictos, build y **303 pruebas en 60 archivos** correctos. Dos GLB cargados y releídos por SHA (4.257.828 bytes totales), operación SQL individual aplicada en secuencia tras v21. Dos guardados anteriores reabiertos y dos nuevos guardados; cuenta temporal eliminada. Evidencia en [transición](../../models/catalog-v22/transition.json) y [auditoría Cloud](../../models/catalog-v22/cloud-after.json).

Tres poses del configurador real (reposo/50/100), sin errores de navegador, comprobadas con GLB locales congelados mediante interceptación explícita del runner antes de subirlos. Esto valida la integración visual del recurso; no simula la cinemática exacta ni certifica colisiones/FPS. [Resultado](../../models/catalog-v22/motion-review.json). Los 28 recursos ajenos y todos los guardados históricos se conservan. Estado tras esta publicación: **70 modelos, 146 elecciones, 766 variantes/764 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias.

Reposición: `prepare-frame-v22.mjs --apply` → `publish-frame-v22.mjs --apply`; SQL propio en `supabase/operations/`; auditoría de lectura `validate-frame-v22.mjs`. Capturas publicadas inmutables. Seleccionar de nuevo el cuadro usa esta revisión; no convertir guardados ni prearmadas.

No es CAD ni identidad del 100 %, ajuste de rodamientos o comprobación completa de colisiones/cinemática. Las profundidades y zonas ocultas siguen siendo inferidas. No se certifica Android físico/FPS. Sin commits.
