# Cuadros v11 · Pasos de montaje

Continuación de la revisión de los quince cuadros. Se trabaja exclusivamente sobre copias de los treinta GLB v10 congelados; sus siluetas, colores, nombres de pintura y anclajes se conservan. Fuentes y observación/inferencia originales: [v10](../catalog-v10/references.md).

La revisión encuentra superficies de las envolventes que atraviesan el interior de dirección, collar de sillín o pedalier. `bores.ts` resta cilindros finitos de los triángulos interferentes, con interpolación de normales/UV y reutilización de vértices. Las camisas ya presentes aportan paredes interiores; la dirección recibe además una pared cilíndrica continua, con normales hacia el interior, agrupada en la misma malla pintable. No se añaden tubos macizos ni un draw call por corte. Operación offline, sin CSG en el configurador.

Los radios son holguras visuales conservadoras dentro de las camisas representadas (dirección 27,2 mm, pedalier 19,5 mm y sillín un milímetro menor que su radio nominal). No cambian estándares comerciales ni certifican mecanizado, ajuste físico o longitud completa de inserción de tija. El paso del collar tiene 27 mm hacia el interior; no se reconstruye una cavidad interna completa.

Preparar: `node scripts/prepare-frame-v11.mjs`; `--apply` carga y relee Storage. Publicar solo tras pruebas: `node scripts/publish-frame-v11.mjs --apply`. Estos dos entry points corresponden a v11; las herramientas v10 permanecen como historial.

Recursos nuevos en `exports/`; SHA, identidades y fechas en `uploads.json`. No regenerar recursos publicados con bytes distintos bajo la misma identidad. Comparación local `/tests/fixtures/frame-v11-review.html?version=v11`, excluida del build público.

La comparación de pasos se reproduce con `node scripts/inspect-frame-v11.mjs`: nueve rayos por talla, a dos caras, limitados al cilindro finito previsto. `node scripts/inspect-frame-v11-exports.mjs` comprueba atributos, pintura y anclajes del GLB. `review-frame-v11-details.mjs` captura tres primeros planos de cada modelo y `review-all-frames.mjs --v11 --all` conserva las siete cámaras generales por talla. Los resultados son evidencia de geometría visual, no tolerancias de taller ni ausencia exhaustiva de colisiones.
