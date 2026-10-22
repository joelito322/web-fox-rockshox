# 12h · Continuidad localizada de dirección v13

El usuario identifica cinco cuadros correctos: META SX V5, SUPREME DH V5, Cherry Bomb 29, Nomad 7 y Ransom RC. Sus diez variantes v11 quedan protegidas. V12 sigue retirada; esta corrección abarca únicamente Sender CFR High Pivot, S-Works Enduro UDH, Slash AL Gen 6, V10.8, TUES MK4, CAPRA MK3 MX, GT Fury/Force High Pivot, FRS V3 y Furious V3 2021, en sus veinte tallas publicadas.

## Método y límites

Fuentes y constructor offline en [catalog-v13](../../models/catalog-v13/README.md). Se reutilizan los trazados propios y las referencias multivista de v10; los cinco modelos aprobados sirven como referencia de continuidad, sin copiar su silueta a otras marcas. No se atribuyen nuevas mediciones ni inspecciones de vídeos a esta corrección.

Se reemplazan solo las raíces superior/diagonal próximas a la dirección, con secciones completas y simétricas que llegan al cuerpo de la pipa. El recorte local tiene radio 110 mm y extensión axial de 70 mm a cada extremo; su polígono de 32 caras alcanza 110,6 mm. La trayectoria anterior se sigue desde 160 mm hasta unos 65 mm; el resto resuelve el contacto sin comprimir globalmente los tubos. En los siete gravity se conserva la pipa original. Sender/Enduro/Slash reciben una camisa anular limpia sobre el mismo eje, extremos y radio exterior previo: sus fragmentos superpuestos producían bandas visibles. Los restos planos heredados se eliminan por coincidencia exacta de triángulos y proximidad, sin borrar el cuerpo indiscriminadamente.

Las secciones y rellenos son inferencias exteriores. No certifican soldaduras, laminado, alojamiento de rodamientos, CAD, un porcentaje de parecido o ausencia exhaustiva de colisiones.

## Comprobaciones locales

- Veinte GLB, 31.157.356 bytes; posiciones/normales finitas, anclajes y nodos pintables conservados; cuatro o cinco mallas por archivo.
- 140 vistas generales y 100 primeros planos de las veinte variantes. Ambas caras, frente, superior, inferior y diagonales; revisión interna `/tests/fixtures/frame-v13-review.html?version=v13`, excluida del build de producto.
- 220 rayos de dirección/sillín/pedalier: 60 obstruidos antes y cero después. Los de dirección se extienden fuera de ambos bordes. Es una muestra de corredores, no un ensayo mecánico.
- Conservación de vértices originales fuera de las zonas declaradas: cero faltantes a la tolerancia numérica de comparación de 1 µm. Las diez capturas protegidas mantienen SHA-256. Diferencia máxima de límites de envolvente: 8,35 mm por retirada de salientes locales; no se interpreta como precisión física.
- Simetría de las raíces nuevas por rayos opuestos en las veinte variantes. No se duplican poleas, protecciones ni otros detalles legítimamente laterales.
- Build correcto y 175 pruebas en 44 archivos. Un ensayo simultáneo con capturas agotó el tiempo de una prueba antigua v4; la ejecución final completa, sin carga gráfica concurrente, pasa. Un ensayo durante la preparación leyó hashes intermedios; se repitió sobre capturas congeladas y pasa.

Evidencias: `uploads.json`, `inspection.json`, `bore-review.json`, `preservation.json`, `general-review.json`, `detail-review.json` y `publication.test.ts` en `models/catalog-v13/`.

## Publicación e integración

Veinte GLB cargados y releídos por SHA-256; publicación acotada aplicada mediante `supabase/operations/publish-frame-v13.sql`. Solo se retiran las veinte elecciones predecesoras; los diez recursos/elecciones de los cinco modelos aprobados y las cuatro prearmadas siguen en v11. No se reescriben montajes privados. Estado: **70 modelos, 146 elecciones, 748 variantes/746 recursos históricos, cuatro prearmadas y 92 posiciones**; siguen 22 migraciones y doce tablas propias, sin cambios de Auth/IAM/Edge Functions.

Quince montajes articulados, 45 capturas de reposo/50/100 %, sin errores de página. Cuatro recorridos de navegador correctos: reproducción/restauración y guardado autenticado con reapertura, en escritorio y móvil emulado. Los runners eliminaron cuentas e imágenes temporales. Estas pruebas no equivalen a Android físico, medición de FPS o validación exhaustiva de contactos.

Transición con cuenta normal temporal: diez montajes v11 guardados antes de publicar conservan sus identidades y se vuelven a guardar; veinte montajes v13 nuevos y cuatro composiciones completas se guardan correctamente. Cuenta y montajes temporales eliminados. Evidencias `transition.json`, `motion-review.json` y `validation.json`. Auditoría remota final de solo lectura: las doce comprobaciones pasan; `cloud-before.json` y `cloud-after.json` registran la conservación del historial, contratos y elecciones protegidas.

Los montajes existentes conservan su representación histórica. Para incorporar la corrección, seleccionar de nuevo el cuadro del catálogo actualizado. Reposición limpia: restaurar v11/retirar v12 antes de cargar/publicar v13; no volver a ejecutar la reversión histórica como último paso sobre v13. Las versiones publicadas son inmutables; otro cambio físico necesita nueva identidad. La aceptación estética del usuario sigue abierta. Sin commits.
