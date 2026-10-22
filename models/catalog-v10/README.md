# Capturas de cuadros v10

Revisión de los quince cuadros del catálogo, treinta tallas. Constructor offline en TypeScript/Three.js; el producto carga los GLB preparados, sin construir estos modelos en tiempo de ejecución.

- `predecessors.json`: contratos y archivos publicados anteriores, conservados.
- `frames.ts`, `contour-volume.ts`, `rounded-mesh.ts`: reemplazo de envolventes planas por secciones volumétricas trazadas; conserva los detalles estructurales v6, mantiene los anclajes y agrupa materiales para no multiplicar draw calls.
- `new-frames.ts`, `frame-profiles.json`: siete perfiles gravity independientes, volumen variable, placas de bieletas con ventanas, raíces y asimetría CAPRA. Dimensiones de representación estimadas, no cotas comerciales nuevas.
- `references.md`, `references/`: fuentes, observación/inferencia y capturas audiovisuales.
- `exports/`, `uploads.json`: GLB, SHA-256, nueva identidad y ruta de Storage. Una captura subida no puede regenerarse con otros bytes bajo la misma identidad.
- `geometry.test.ts`: cobertura de las treinta tallas, conservación de especificaciones/anclajes y hashes anteriores, volumen y placas.

Preparación local: `node scripts/prepare-frame-v10.mjs`. `--apply` carga y relee los binarios, pero no cambia elecciones del catálogo. Publicación separada mediante `scripts/publish-frame-v10.mjs --apply`, después de las verificaciones locales.

Revisión interna: `/tests/fixtures/frame-review.html?version=v10`. El selector permite comparar el predecesor y la nueva captura por modelo/talla y siete cámaras. No forma parte del build de producto. Capturas: `ATLAS_FRAME_REVIEW_OUTPUT=/tmp/atlas-frames-v10 node scripts/review-all-frames.mjs --v10 --all`.

No se alteran los GLB, los generadores ni los perfiles publicados v1–v9. Montajes guardados conservan sus referencias; al elegir la nueva variante se utiliza v10. Sin certificación CAD ni porcentaje de fidelidad.
