# GT Fury Carbon High Pivot · v20

Revisión individual M/L de la generación Fury 2023+, desde las capturas v13. No afecta Force, FRS, Furious ni los restantes cuadros; `protected-captures.json` conserva los SHA de los otros 28 recursos actuales. Anclajes, acabados y especificaciones comerciales permanecen iguales. Los montajes históricos conservan sus recursos y las prearmadas no se convierten.

## Fuentes y trazado

[Fuentes descargadas y SHA](references/sources.json): cinco fotografías oficiales (dos perspectivas Black del frameset y tres detalles de articulación, ajustes y protección), manual Fury y GT Tech Book 2024. En este último se usan las páginas impresas 4–6 de Fury 2023 (páginas PDF 5–7), no el Fury 2019–2022 del apartado siguiente. El manual confirma carbono, ZS49, BSA83, amortiguador 225×75 trunnion y los accesorios; no se cambian medidas existentes del catálogo a partir de estos datos.

Las fotos originales tienen 2150×1850; el perfil propio usa 1696×1459 y el registro heredado BB/dirección/eje trasero para mantener el montaje. Esto es una aproximación visual registrada, no una calibración dimensional CAD. Las dos imágenes históricas repetidas o miniaturas no se cuentan como perspectivas nuevas. Las referencias de otro acabado se usan únicamente para entender estructura.

## Construcción

`profile.json` y `frames.ts` reconstruyen superior con hombro de sillín, diagonal con desvíos locales, espina, vainas articuladas y cuna inferior. La ventana triangular de la cuna queda abierta en ambos laterales; el ojo inferior tiene apoyos fijos y el superior pertenece a la bieleta móvil. K91003 se representa como yugo sólido de dos placas con taladros de apoyo: no hereda la gran ventana lateral del Force. Polea y guía en lado de transmisión, herrajes y soporte de freno asimétricos; sin reflejar accesorios indiscriminadamente.

Dirección hueca con entrada/salida y unión de miembros; diámetro visual aproximado de 49 mm sin certificar ajuste. Protecciones siguen la diagonal y vaina; los topes de horquilla están insertados en la superficie del superior. Rótulo GT aproximado en ambos lados, sin alterar los recursos de tipografía anteriores. Profundidades, radios, detalles ocultos y superficies de unión siguen inferidos. Secciones longitudinales explícitas mantienen rectas fuera de desvíos.

Reconstrucción y agrupación por material exclusivamente offline, con indexado final: cinco mallas por talla. Se conservan triángulos mecánicos anteriores fuera de la máscara de bieleta y los metales. El frontend descarga GLB estáticos; no se añade CSG runtime ni lógica comercial nueva.

## Flujo reproducible

Con frontend de desarrollo activo (o `ATLAS_BASE_URL`):

```sh
node scripts/prepare-frame-v20.mjs
node scripts/inspect-frame-v20-exports.mjs
node scripts/inspect-frame-v20-preservation.mjs
node scripts/inspect-frame-v20.mjs
node scripts/review-all-frames.mjs --v20 --all
node scripts/review-frame-v20-details.mjs
node scripts/review-frame-v20-overlay.mjs
node scripts/validate-frame-v20.mjs --before
```

Después de la revisión y pruebas, `prepare-frame-v20.mjs --apply` carga/relee los binarios por SHA; `publish-frame-v20.mjs --apply` publica solo sus elecciones. SQL conservado en `supabase/operations/publish-frame-v20.sql`. La prueba de transición `validate-frame-v20-transition.mjs --publish` publica, crea y reabre guardados de prueba anteriores/nuevos y elimina la cuenta temporal. `validate-frame-v20.mjs` posterior es lectura. Tras publicar no se alteran bytes de esta versión: otra corrección requiere otra identidad.

Revisión local interna: `/tests/fixtures/frame-v20-review.html?version=v20&view=lateral`, excluida del build de producto. Evidencia y limitaciones en [12o](../../docs/planning/12o-evidencia-fury-v20.md). No certificar identidad del 100 %, ajuste mecánico, ausencia exhaustiva de colisiones, cinemática exacta ni FPS/Android físico.
