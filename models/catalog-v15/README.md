# CAPRA MK3 Carbon MX · reconstrucción completa de trayectos v15

Solicitud: eliminar curvas distribuidas en todo el trayecto y conservarlas solo en los desvíos reales. La revisión adversarial de tres agentes confirmó que v14 solo cambiaba raíces y dejaba el Catmull–Rom y la anchura sinusoidal v10 en el cuerpo. Esta versión reconstruye los miembros completos del CAPRA, en sus dos tallas; no altera los otros catorce cuadros ni bytes publicados v1–v14.

## Referencias y observación

Fotos oficiales conservadas en `models/catalog-v10/references/images/yt-capra-mk3-carbon-mx-{1,2,3,4}.png`, lateral v9 y fotograma previamente inspeccionado `capra-video-220.jpg`. El superior y la diagonal tienen largas rectas, con radios locales en sillín/pedalier/pipa; las vainas y tirantes son mayormente rectos con desvíos de conexión. No se atribuyen nuevas medidas comerciales ni revisión de vídeos completos a este trabajo.

`profile.json` retraza los ejes y las secciones. El grosor perpendicular de zonas limpias del lateral, redimensionado a los landmarks anteriores, orienta las semialturas centrales: superior ~16–18 mm y diagonal ~27,5–29 mm. Son estimaciones de representación; la profundidad, secciones ocultas, radios y los cierres siguen inferidos. No certifican CAD ni fidelidad del 100 %.

## Método

`path.ts` interpola cada tramo y sus secciones linealmente por distancia. Solo en ventanas de desvío declaradas utiliza arcos cuadráticos, limitados al 45 % del segmento adyacente para evitar solapamiento. Tangentes analíticas y normales de loft exactas en fronteras, sin Catmull ni seno longitudinal. Las secciones transversales siguen redondeadas/facetadas: rectitud longitudinal no significa aristas de corte en toda la pieza.

`capra-builder.ts` es una fuente offline versionada derivada del constructor histórico v10, con perfil propio y muestreo nuevo; no cambia el renderer publicado anterior ni el runtime. Conserva la asimetría del refuerzo de la ventana. La llegada superior queda al 85 % del eje y la inferior al 43 %, contrastadas contra la fotografía registrada. El soporte frontal del amortiguador se proyecta sobre la diagonal real, evitando elegir un landmark lejano. Los ojos y demás anclajes permanecen en sus posiciones previas; las bieletas/herrajes no pintables se conservan del GLB v14. La rotulación se coloca sobre la diagonal recta nueva. Se mantienen talla, generación, acabados y campos comerciales.

## Validación requerida

Pruebas de ejes, tangentes y contornos en intervalos rectos, controles negativos Catmull/seno, ambos tamaños, foto lateral registrada y revisión opuesta/oblicua, pasos de montaje y montaje articulado. Los 28 recursos ajenos mantienen sus hashes. Conservar identidades de montajes antiguos y comprobar guardado de sucesores tras publicación acotada.

Revisión local `/tests/fixtures/frame-v15-review.html?version=v15`, fuera del producto. Preparar/cargar `scripts/prepare-frame-v15.mjs --apply`; publicar solo después de revisión mediante `scripts/publish-frame-v15.mjs --apply`. Sin commits automáticos.

Estado: dos recursos publicados con auditoría final correcta. 192 pruebas/47 archivos, build/tipos, vistas/superposiciones, revisión articulada y transición de dos montajes antiguos/dos nuevos completados. Evidencia en [12j](../../docs/planning/12j-evidencia-capra-trayectos-v15.md). No cambiar físicamente v15 publicada; nuevas correcciones necesitan otra identidad. Aceptación estética del usuario abierta.
