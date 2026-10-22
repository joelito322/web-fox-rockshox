# Dirección exterior · v12

**Retirada por petición del usuario:** la corrección global v12 se revierte a v11. La evidencia siguiente describe la publicación histórica, no la versión vigente ni aceptación visual. Los recursos se conservan para montajes históricos. Operación y comprobación: `scripts/rollback-frame-v12.mjs`; no republicar v12.

Nueva revisión de los quince cuadros y sus treinta tallas a partir de los GLB v11, conservados por SHA. Fuentes fotográficas y generaciones: [referencias v10](../catalog-v10/references.md), `catalog-v5`/`catalog-v6` y `catalog-v9`. Se volvió a contrastar la unión de tubos con las fotografías ya descargadas; no se atribuyen nuevas mediciones a esas imágenes.

El defecto común era terminar los tubos superior/inferior sobre los planos extremos de dirección: aparecían orejas, solapes y segmentos fuera de la pipa. `frames.ts` aproxima sus extremos hacia el interior del cuerpo manteniendo espesor, con transición localizada a 130 mm del eje; sustituye la camisa anterior y sus intersecciones mediante recorte cónico offline y una pipa anular continua. Las caras exteriores, interior y bordes se exportan juntas en el grupo pintable existente. No se añaden operaciones geométricas al navegador de producto.

`headProfiles` declara radios exteriores estimados por modelo (no estándares de rodamientos). El diámetro interior visual de 54,6 mm no certifica una dirección comercial. Los anclajes superior/inferior, eje, longitud, especificaciones, acabados e identidades anteriores permanecen intactos. La transición exacta de carbono, radios de soldadura y asientos internos siguen aproximados; no es CAD ni un ajuste mecánico verificado.

Revisión interna: `/tests/fixtures/frame-v12-review.html?version=v12`, comparación con v11 y vistas cercanas lateral, frontal, trasera, inferior y axial. Fuente nueva en `supabase/catalog/frames-v12-*.json`; SQL acotado a variantes/recursos/prearmadas en `supabase/operations/publish-frame-v12.sql`. Preparar con `scripts/prepare-frame-v12.mjs`; `--apply` sube recursos inmutables y los relee por SHA. La publicación del catálogo es una operación separada.
