# META SX V5 · v21

Revisión individual M/L desde v11. Mantiene las 28 capturas actuales de los otros catorce cuadros, los anclajes de montaje, especificaciones y acabados. Sin conversión de montajes guardados ni prearmadas; sin cambios de tablas, Auth o frontend de producto.

## Fuentes

[Archivos, URL y SHA](references/sources.json): foto oficial del frameset Team Cloud, fotografía de contexto y siete ilustraciones técnicas de conjunto, triángulo delantero, enlaces VCS, triángulo trasero, protecciones y encaminamiento. Página oficial [META SX V5 TECH](https://www.commencal.com/us/en/tech-meta-sx-v5.html). La foto de contexto muestra acción y no constituye una vista calibrada; no contar los duplicados/reducciones de una misma lateral como perspectivas distintas. Las ilustraciones de enlaces y triángulo delantero aparecen compartidas bajo nombre META V5 en la página específica SX V5; no asumir que el triángulo trasero SX y V5 sea idéntico.

Se conserva el registro visual original de foto 1200×800 con BB [554,671], dirección [1069,78], eje trasero [104,645]. `profile.json` define trayectos nuevos propios, sin recalibrar medidas comerciales desde píxeles. Profundidades, redondeos, uniones ocultas y detalles de acabado continúan inferidos; no es CAD.

## Construcción

Superior recto con cambio local al llegar a dirección; diagonal larga recta y transición inferior localizada; tubo de sillín con variaciones de trayectoria propias. Refuerzo pequeño entre sillín/superior, sin curvar todo el miembro. Vainas/tirantes y montantes delanteros del triángulo trasero emparejados, puentes y carcasas de apoyo. Los enlaces superior/inferior VCS, clevis y herrajes negros/metálicos de v11 se conservan por triángulos. No sustituirlos por un balancín Fury/Force ni unir con pintura el ojo móvil inferior.

Orejetas superiores fijas conectadas al superior y taladradas, con abertura entre ellas. Pipa hueca y llegada de miembros dentro de su envolvente; conserva las posiciones previamente aprobadas. Punteras, patilla unilateral, bosses de freno solo en su lado y protecciones de diagonal/vaina. Entradas de cable laterales embebidas en superficie; letras aproximadas COMMENCAL en ambos lados. No modelado mecánico de tornillos, fabricación o resistencia.

`frames.ts` reconstruye offline y agrupa por material con indexado final: seis mallas por talla. GLB estático en producto, sin CSG runtime. Capturas/identidades en `uploads.json`; una vez publicadas no se alteran sus bytes.

## Reproducción y evidencia

Con frontend local o `ATLAS_BASE_URL`:

```sh
node scripts/prepare-frame-v21.mjs
node scripts/inspect-frame-v21-exports.mjs
node scripts/inspect-frame-v21-preservation.mjs
node scripts/inspect-frame-v21.mjs
node scripts/review-all-frames.mjs --v21 --all
node scripts/review-frame-v21-details.mjs
node scripts/review-frame-v21-overlay.mjs
node scripts/validate-frame-v21.mjs --before
```

Tras revisión/pruebas, `prepare-frame-v21.mjs --apply` carga y relee SHA; `publish-frame-v21.mjs --apply` publica las dos elecciones. SQL conservado en `supabase/operations/publish-frame-v21.sql`. `validate-frame-v21-transition.mjs --publish` ejecuta publicación y prueba guardados antiguos/nuevos con cuenta temporal que elimina; la auditoría posterior `validate-frame-v21.mjs` es lectura.

Visor interno `/tests/fixtures/frame-v21-review.html?version=v21&view=lateral`, fuera del build. Evidencia y límites en [12p](../../docs/planning/12p-evidencia-meta-v21.md). No certificar identidad CAD del 100 %, contactos/colisiones exhaustivos, cinemática exacta ni FPS/Android físico.
