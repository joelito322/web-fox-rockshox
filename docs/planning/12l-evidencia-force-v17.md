# 12l · GT Force Carbon High Pivot completo v17

El usuario solicita aplicar al Force el rigor visual aprobado para CAPRA y CHERRY. El alcance comprende únicamente las dos elecciones Force M/L, con predecesoras v13. Los otros catorce cuadros y sus veintiocho capturas actuales quedan protegidos, incluidos CAPRA v15 y CHERRY v16. Se conservan anclajes, acabados, medidas y especificaciones; no se convierten montajes privados ni prearmadas.

## Referencias y reconstrucción

Se inspeccionaron cinco fotografías oficiales: lateral y diagonal del frameset, detalle del conjunto High Pivot LTS, detalle de puntera/flip chip y detalle de protección/guía de transmisión. Archivos reales, URLs y hashes en [references/sources.json](../../models/catalog-v17/references/sources.json). Los cuatro archivos Force de v10 no representaban cuatro perspectivas: dos eran duplicados y otro una reducción. Las tres nuevas fotografías de detalle aportan evidencia independiente.

El perfil propio conserva el espacio de coordenadas de inspección v10, 1696×1459, mientras las fotografías generales originales tienen 2150×1850 píxeles. Los landmarks anteriores registran los nuevos contornos sobre los anclajes inmutables de cada talla; no se sustituyen medidas comerciales por píxeles de una fotografía.

La reconstrucción offline conserva rectas longitudinales y limita radios a los desvíos reales del Force. El ramal entre sillín y valle del superior forma la abertura triangular GT; se mantiene abierta. La bieleta recibe contorno y ventana alargada propios, dos placas y apoyos: ojo superior del amortiguador móvil sobre bieleta y cuna inferior fija sobre cuadro. Las contrapartes estructurales se completan sin duplicar polea, patilla o protector unilateral. El tratamiento selectivo de `detalle1` debe conservar la polea y retirar únicamente el balancín sustituido; no eliminar la malla negra completa por su nombre compartido.

Las secciones transversales, profundidades ocultas, separación de placas y radios exteriores son inferencias visuales, diferenciadas de las observaciones fotográficas. El helper de trayectos v15 se reutiliza sin modificar sus bytes ni imponer la silueta CAPRA o CHERRY al Force. No CSG ni reconstrucción de mallas durante el uso del producto.

## Validación y publicación

- Build de producto y tipado estricto de constructor/fixtures correctos; 230 pruebas en 52 archivos (`pnpm run test --maxWorkers=2`). Se conservan advertencias existentes de tamaño de bundle y dependencias.
- Dos GLB, seis mallas por talla y 2.804.844 bytes en total: posiciones/normales finitas, pintura y anclajes presentes. [Inspección](../../models/catalog-v17/inspection.json).
- 28 capturas ajenas conservan SHA. Triángulos de metal y de los elementos negros fuera de la máscara local permanecen; la polea no se elimina al sustituir la bieleta combinada. [Preservación](../../models/catalog-v17/preservation.json).
- 14 vistas generales, diez primeros planos y dos superposiciones fotográficas registradas. La revisión cruzada detectó una abertura exterior bajo la pipa: se elevó la llegada de diagonal y redujo su sección terminal dentro de esta nueva versión, sin parche ni cambios ajenos. Segunda revisión M/L confirma que desapareció la media luna y sigue abierto el canal. Persisten sección simplificada y faceteado interior visibles en macro.
- 22 rayos de dirección/sillín/pedalier sin obstrucción; pruebas de rectitud y abertura/apoyo de bieleta en ambas tallas. Esto no prueba ausencia exhaustiva de colisiones ni exactitud CAD. [Rayos](../../models/catalog-v17/bore-review.json).
- Montaje Force en reposo/50/100 de inspección: tres capturas sin errores de navegador y movimiento observado. No es simulación física ni aceptación de FPS. [Articulación](../../models/catalog-v17/motion-review.json).
- Dos recursos cargados y releídos por SHA; publicación SQL acotada aplicada. Transición real de dos montajes anteriores y dos nuevos, con cuenta temporal eliminada. [Transición](../../models/catalog-v17/transition.json).

Fuentes de publicación: `prepare-frame-v17.mjs --apply` → `publish-frame-v17.mjs --apply`; SQL `supabase/operations/publish-frame-v17.sql`. Historial v1–v16 inmutable. No se cambian prearmadas ni montajes privados. La auditoría de lectura posterior queda en `models/catalog-v17/cloud-after.json`.

Estado tras publicación: **70 modelos, 146 elecciones, 756 variantes/754 recursos históricos, cuatro prearmadas y 92 posiciones**, con 22 migraciones y doce tablas propias. Los montajes guardados mantienen su versión; volver a seleccionar Force usa v17. No se certifica identidad CAD del 100 %, profundidades mecánicas exactas, colisiones exhaustivas, Android físico ni FPS. Sin commits.
