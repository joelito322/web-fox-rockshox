# S-Works Enduro UDH · v23

Solicitud individual en paralelo autorizada por el usuario. Solo S3/S4 desde v13; medidas, acabados, prearmadas y montajes anteriores permanecen. Solo el marcador estimado `saddle` cambia en la nueva identidad, según el contrato exacto descrito abajo. Orden de publicación acordado: META v21 → Nomad v22 → Enduro v23 → Sender v24.

## Fuentes y observación

Tres fotografías originales Specialized de 2025, efectivamente inspeccionadas, y manual oficial 2025 Enduro descargado. Despiece impreso 12/PDF15 inspeccionado y tablas/pasos de montaje leídos. URLs, archivos y SHA en [sources.json](../../models/catalog-v23/references/sources.json). Foto 1200×1200 previa para registro sobre los tres anclajes históricos; las tres perspectivas actuales permiten contrastar perfiles y profundidad. No se afirma haber observado vídeo ni disponer de CAD.

Se reconstruye anatomía propia: superior y diagonal con codos explícitos, cuna en U abierta, soporte delantero fijo, extensión trasera móvil, bieleta superior/intermedia/inferior, par de vainas/tirantes y articulación Horst distinta del eje de rueda. Patilla UDH exterior completada en lado motriz y apoyos de freno en lado no motriz exclusivamente; protectores reemplazan el bloque anterior y siguen las superficies. Puerta SWAT y rótulos aproximados; tarjeta fotográfica conservada.

```text
superior ── sillín ── pivote superior
                        │ bieleta superior
                        │ enlace intermedio
vaina ── pivote inferior ── extensión ── ojo trasero
cuadro/diagonal ── apoyo fijo ─────────── ojo delantero
```

La nomenclatura histórica identifica delantero como `shock_upper` y trasero como `shock_lower`; no reinterpretar esos nombres como altura física. Profundidades, radios y superficies ocultas inferidas se distinguen de lo observado en README/perfil. No certificar 100 % CAD, ajuste de rodamientos, laminado, contactos exhaustivos, cinemática exacta ni Android físico/FPS.

## Validación local

- Dos capturas GLB estáticas, cinco mallas por talla, geometrías/normal finitas, nodos de pintura conservados y anclajes conforme al contrato versionado.
- Doce pruebas propias: fuente acotada, S3/S4 reales, medidas/acabados/anclajes, hashes, tramos largos rectos, cuna abierta y soporte delantero fijo/extensión trasera sin puente fijo, tres enlaces y taladros, y apoyos de freno solo en el lado no motriz.
- Veintidós rayos de dirección/asiento/pedalier despejados; los de pedalier abarcan 150 mm extra desde cada borde del shell para incluir mejillas exteriores. Las distancias desde el centro de un hueco hasta la superficie no describen una desalineación.
- Catorce vistas generales, diez detalles de pipa, dos superposiciones y ocho acercamientos de articulación. Se revisan ambas caras; la superposición es una referencia visual registrada, no aceptación dimensional.
- Metales previos y triángulos negros fuera de la máscara local conservados. Protección previa expresamente reconstruida, no afirmada intacta. Otros veintiocho SHA ajenos comprobados, con el snapshot definitivo de META v21 y Nomad v22 congelados.

## Excepción documentada de sillín

La revisión cruzada detectó una diferencia de 14,54° entre el marcador de sillín heredado y el tramo superior del tubo reconstruido (S3: 99,78° frente a 114,32°). Con autorización del integrador, solo `saddle` se alinea en los nuevos recursos conservando distancia a `seat_tube`; collar y perforación usan el mismo eje. El resto de anclajes es idéntico, en particular ojos del amortiguador, dirección, ejes y asiento. Pruebas de colinealidad y distancia en ambas tallas. [Cambios exactos](../../models/catalog-v23/anchor-changes.json) y SQL versionado `frame-v23-anchor-contract.sql` limitan los dos UUID; nunca alteran recursos históricos.

## Integración publicada

Revisión coordinada completada: tipos estrictos, build y **303 pruebas en 60 archivos** correctos. Dos GLB cargados y releídos por SHA (5.500.756 bytes totales), operación SQL individual aplicada en secuencia tras v22. Dos guardados anteriores reabiertos y dos nuevos guardados; cuenta temporal eliminada. Evidencia en [transición](../../models/catalog-v23/transition.json) y [auditoría Cloud](../../models/catalog-v23/cloud-after.json).

Tres poses del configurador real (reposo/50/100), sin errores de navegador, comprobadas con GLB locales congelados mediante interceptación explícita del runner antes de subirlos. Esto valida la integración visual del recurso; no simula la cinemática exacta ni certifica colisiones/FPS. [Resultado](../../models/catalog-v23/motion-review.json). Los 28 recursos ajenos y todos los guardados históricos se conservan. Estado tras esta publicación: **70 modelos, 146 elecciones, 768 variantes/766 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias.

Reposición: `prepare-frame-v23.mjs --apply` → `publish-frame-v23.mjs --apply`; SQL propio en `supabase/operations/`; auditoría de lectura `validate-frame-v23.mjs`. Capturas publicadas inmutables. Seleccionar de nuevo el cuadro usa esta revisión; no convertir guardados ni prearmadas.

Fuentes y herramientas en [models/catalog-v23](../../models/catalog-v23/README.md). No crear commits sin una solicitud explícita.
