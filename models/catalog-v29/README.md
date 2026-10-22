# TUES MK4 Carbon · v29 · caras exteriores

El usuario aprueba la forma v28 y detecta aspecto transparente/hueco al girarla. Esta revisión conserva los contornos preparados v28, todos los anclajes, especificaciones y acabados; corrige exclusivamente el sentido de las caras extruidas y sus normales. Fuentes de forma/fotografía: [v28](../catalog-v28/README.md), sin nueva interpretación de silueta.

## Causa y corrección

La transformación de imagen (Y descendente) a mundo (Y ascendente) refleja el plano. Se mantuvo el orden previo de los triángulos extruidos; sus caras quedaron orientadas hacia dentro. Materiales de paredes opacos, pero el render normal FrontSide descartaba la pared cercana y mostraba la opuesta, dando el efecto de cuadro abierto.

`frames.ts` invierte el orden de cada triángulo **solo en las superficies derivadas de esa extrusión**, antes de calcular normales/recortar pasos. No invierte las camisas/cilindros que ya tenían orientación correcta. No cambia posiciones ni activa DoubleSide/transparencia global. Normales de caras principales y biseles recalculadas con la regla de unidades de v28.

Nuevas identidades M/L para conservar bytes e historial v28. Todos los anclajes se clonan exactos, sin recalcularlos; publicador y SQL exigen igualdad completa del manifiesto anterior. Las dos nuevas identidades reutilizan exactamente el perfil de inspección v28 mediante lista explícita `motion-assets.json`/`tues-v29-assets.json`, sin modificar las posturas de otros recursos.

## Validación

`inspect-frame-v29-sides.mjs` compara FrontSide y DoubleSide sobre ambos GLB, en seis regiones y ocho direcciones por talla: **96 rayos**. Antes96 descartaban la pared cercana; después0. Distancia máxima de superficie DoubleSide anterior/nueva ≈3,31×10⁻¹⁰m y límites iguales dentro de1µm (tolerancia de comparación numérica, no precisión física del modelo). Materiales opacos/depthWrite verificados. Además, pruebas de regresión FrontSide en ambas caras para impedir que un test solo DoubleSide vuelva a ocultar el fallo.

Se conservan las54 muestras fotográficas independientes por talla y los pasos de dirección/collar/pedalier. Revisión multivista normal de14 capturas y montaje articulado en tres poses. Mantener la distinción entre ver la pared exterior próxima y probar solidez visual frente a certificar malla CAD/manifold o colisiones mecánicas exhaustivas.

## Reproducción

```sh
node scripts/prepare-frame-v29.mjs
node scripts/inspect-frame-v29-sides.mjs
node scripts/inspect-frame-v29-exports.mjs
node scripts/inspect-frame-v29-preservation.mjs
node scripts/inspect-frame-v29.mjs
node scripts/inspect-frame-v29-passages.mjs
node scripts/review-all-frames.mjs --v29 --all
node scripts/validate-frame-v29.mjs --before
```

Montaje previo a carga: `ATLAS_LOCAL_MODEL_VERSIONS=v29 node scripts/review-suspension-motion.mjs --v29 --model=yt-tues-mk4-carbon`. Tras revisión, `prepare-frame-v29.mjs --apply` carga/relee SHA; `validate-frame-v29-transition.mjs --publish` comprueba dos guardados anteriores, aplica SQL y comprueba dos nuevos, eliminando cuenta temporal. Reposición tras v28 con `publish-frame-v29.mjs --apply`; fuente `supabase/operations/publish-frame-v29.sql`. Auditoría posterior de lectura `validate-frame-v29.mjs`.

Visor interno `/tests/fixtures/frame-v29-review.html?version=v29&view=diagonal`, fuera del build. Evidencia [12w](../../docs/planning/12w-evidencia-caras-tues-v29.md). Forma aprobada preservada, fotos reales, otras28 capturas y prearmadas intactas; privados anteriores mantienen versión. Sin commits salvo solicitud explícita.
