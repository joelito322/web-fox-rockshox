# Santa Cruz V10.8 CC · MY27 · v30

Reconstrucción individual de M/L, sucesora de v13. Otras 28 capturas vigentes, fotos reales, especificaciones y acabados se conservan. No reutiliza la forma del TUES ni altera recursos publicados.

## Referencias y criterio

Foto oficial del cuadro desnudo MY27 Liquid Blue, detalles del producto y despieces V10.8: URL, archivo y SHA en `references/sources.json`. La página MY27 utiliza detalles con nombres MY25/MY26; se conservan esos nombres y no se atribuyen a nuevas fotografías MY27. Soporte: https://www.santacruzbicycles.com/pages/product-support/v-10-8-my27 ; producto: https://www.santacruzbicycles.com/collections/v10/products/v10-frame-2027 . Se inspeccionaron imágenes y despieces, sin afirmar muestreo de vídeo en esta revisión.

`registration.json` registra landmarks sobre fotografía 3200×2400 normalizada a 1600×1200. La referencia es oblicua: rectificación afín de BB/dirección/eje trasero a los anclajes oficiales por talla. No es foto ortográfica ni medición uniforme, y L utiliza el mismo trazado adaptado a su geometría. Dirección, eje delantero/trasero y medidas comerciales permanecen exactos respecto a su versión anterior. Cinco estimaciones visuales cambian con contrato completo antes/después: tija/sillín, ambos ojos del amortiguador y pivote inferior. Los ojos se ajustan simétricamente a 250 mm sobre el eje observado; el inferior está parcialmente oculto.

Observado: pequeña ventana bajo tubo superior, tubo superior de transición horizontal a diagonal, arco delantero cóncavo alrededor del amortiguador, basculante de triángulo cerrado, dos enlaces VPP y protectores asimétricos. Inferido: profundidad, contracara de carbono, espesores exteriores, puentes, ejes parcialmente ocultos y transición de pipa. Despieces contrastan enlaces y conexiones de ambos lados. No duplicar freno/patilla/protector de cadena por simetría.

`contours.proposal.json` conserva trazado propio; `prepare-v10-v30-contours.py` usa Shapely 2.1.2 offline para limpiar la concavidad delantera antes de biselar. Sin dependencias/CSG runtime. `frames.ts` construye volumen con caras exteriores orientadas, tapas planas y biseles suavizados en mm; mantiene dirección/collar/pedalier abiertos. Bieletas, ejes, protector de cadena, guardabarros y apoyos se reconstruyen con el cuadro. No certifica diseño CAD, 100 % de parecido ni colisiones/laminado/contactos exhaustivos.

`contour-checks.proposal.json` conserva muestras antes de comparar; en `contour-checks.json` se corrigen dos etiquetas por opacidad de la fotografía antes del primer test de geometría (820/552 y 500/780). 52 puntos por talla, no porcentaje de parecido global. La comparación de v13 aplica el mismo registro de referencia actual; no representa un registro fotográfico histórico independiente.

## Comprobación y reposición

```sh
uv run --with shapely==2.1.2 scripts/prepare-v10-v30-contours.py
node scripts/prepare-frame-v30.mjs
node scripts/inspect-frame-v30-contours.mjs
node scripts/inspect-frame-v30-sides.mjs
node scripts/inspect-frame-v30-exports.mjs
node scripts/inspect-frame-v30-preservation.mjs
node scripts/inspect-frame-v30.mjs
node scripts/inspect-frame-v30-passages.mjs
node scripts/review-all-frames.mjs --v30 --all
node scripts/review-frame-v30-details.mjs
node scripts/review-frame-v30-overlay.mjs
ATLAS_LOCAL_MODEL_VERSIONS=v30 node scripts/review-suspension-motion.mjs --v30 --model=santa-cruz-v10-8-my27
```

`ATLAS_BASE_URL` permite otro servidor local. FrontSide debe golpear la misma pared próxima que DoubleSide desde ambas caras; materiales opacos con escritura de profundidad, sin doble cara global para ocultar fallos. 96 rayos en seis regiones/ocho direcciones por talla. La muestra de tirante usa 580/627: a 450/681 el rayo oblicuo pasaba fuera del tirante estrecho tanto en FrontSide como DoubleSide; no era inversión de caras. Reconstrucción completa dentro del V10; solo otras28 capturas y los dos históricos v13 se comparan byte a byte, sin afirmar preservación local de superficies del V10.

Perfil `motion-profile.json`/`suspension/v10-v30.json` seleccionado únicamente por dos identidades nuevas. Guía VPP exterior estimada, ojo inferior en enlace de entrada, superior fijo, intervalo conservador 0,12 rad. No certifica recorrido208 mm completo, palancas de fábrica o simulación física. Históricos conservan articulación anterior.

Después de revisar: `prepare-frame-v30.mjs --apply` carga/relee SHA, `validate-frame-v30-transition.mjs --publish` guarda dos anteriores, publica y comprueba dos nuevos con cuenta temporal eliminada. SQL propio `supabase/operations/publish-frame-v30.sql`; fuente comercial `supabase/catalog/frames-v30-reviewed.json`. Auditoría `validate-frame-v30.mjs` de solo lectura; `--before` solo corresponde al snapshot anterior. Nunca modificar bytes publicados v30; otra corrección física necesita versión nueva. Montajes privados no se convierten. Visor interno `/tests/fixtures/frame-v30-review.html?version=v30`, fuera del build. Evidencia en [12x](../../docs/planning/12x-evidencia-v10-v30.md). Sin commits salvo petición explícita.
