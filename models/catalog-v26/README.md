# TUES MK4 Carbon · v26

Revisión individual M/L desde v13; recursos nuevos e inmutables. Conserva los otros catorce cuadros/28 capturas, guardados históricos, cuatro prearmadas, especificaciones, acabados y fotografía real del card.

## Referencias y criterio

[Fuentes/URL/SHA](references/sources.json): fotografía lateral Shell White MX, diagonal no motriz y tres detalles oficiales MK4 conservados en v10; manual oficial MY2024, despiece de triángulo trasero en página impresa 31. No usar MK3 ni atribuir al Ultra Modulus Carbon las propiedades comerciales del CORE 2 CF.

Vídeo oficial YT Workshop **How to Change Wheel Size with TUES MK4 FLIP LINK**, descargado y realmente muestreado a 40/180/280/340/400/470 s. [Hoja de contacto](references/workshop-contact.jpg), fotogramas y [registro](references/video-review.json). Confirma la bieleta maciza independiente, rodamientos de extremo, dos lados de la cuna y herrajes desmontables. No es una reconstrucción de todas las posiciones.

Perfil propio en coordenadas de la imagen lateral 2048 px, registrada por pedalier/dirección/eje posterior. Se corrige la referencia visual antigua del pedalier, desplazada hacia el plato, al centro de bielas observado. Se conservan los anclajes mecánicos heredados: el registro fotográfico no sustituye CAD calibrado y los soportes de ojos se adaptan a esos anclajes. Profundidades, radios, caras ocultas y adaptación de M a L son estimados.

## Reconstrucción

- Superior de recorrido prácticamente recto, diagonal con cambios de sección y curva inferior localizada; cuello corto, unión de sillín redondeada y abertura principal despejada.
- V4L con ambos tirantes y vainas, puentes localizados fuera del volumen central del neumático; Flip Link horizontal macizo con extremos redondeados y apoyos bilaterales.
- Punteras traseras e insertos de ajuste, apoyos y tapas. Patilla solo motriz y soportes de freno solo no motrices. Se corrigieron apoyos inicialmente separados del tirante en la revisión antes de publicar.
- Cuna inferior con paso de amortiguador y soportes de los ojos existentes. Protecciones de diagonal y cadena; esta última termina antes del ascenso al pivote. Puertos/topes localizados junto a dirección y marca YT contenida.
- Dirección, collar y pedalier abiertos. Los detalles mecánicos anteriores se reconstruyen expresamente: no se declara que se hayan conservado sus triángulos. El recurso y manifiesto v13 permanecen intactos.

Solo cambia la referencia visual `saddle` de las identidades nuevas, alineada al último tramo y con la misma longitud desde `seat_tube`. [Antes/después por ID](anchor-corrections.json); publicador y SQL solo permiten esa excepción. Todos los demás anclajes, incluidos ambos ojos y entreojos de 250 mm, siguen exactos numéricamente. Esto no certifica las cotas reales de fábrica.

Geometría offline, agrupada por material e indexada, sin reconstrucción ni CSG en producto. Las curvas locales de placas usan ocho subdivisiones para conservar su borde sin multiplicar innecesariamente el archivo. La inspección conserva el perfil cinemático estimado anterior; no se certifican palancas, contactos o recorrido comercial completo.

## Reproducción

Con frontend o `ATLAS_BASE_URL`:

```sh
node scripts/prepare-frame-v26.mjs
node scripts/inspect-frame-v26-exports.mjs
node scripts/inspect-frame-v26-preservation.mjs
node scripts/inspect-frame-v26.mjs
node scripts/inspect-frame-v26-passages.mjs
node scripts/review-all-frames.mjs --v26 --all
node scripts/review-frame-v26-details.mjs
node scripts/review-frame-v26-overlay.mjs
node scripts/validate-frame-v26.mjs --before
```

Montaje previo a carga: `ATLAS_LOCAL_MODEL_VERSIONS=v26 node scripts/review-suspension-motion.mjs --v26 --model=yt-tues-mk4-carbon`. Tras revisar, `prepare-frame-v26.mjs --apply` sube/relee por SHA. `validate-frame-v26-transition.mjs --publish` prueba guardados previos, aplica el SQL individual y prueba nuevos; limpia su cuenta temporal. Alternativa de reposición: `publish-frame-v26.mjs --apply` tras v25. Fuente `supabase/operations/publish-frame-v26.sql`; auditoría posterior de lectura `validate-frame-v26.mjs`.

Visor interno `/tests/fixtures/frame-v26-review.html?version=v26&view=lateral`, fuera del build. Evidencia en [12u](../../docs/planning/12u-evidencia-tues-v26.md). No certificar 100 % CAD, ajuste mecánico exacto, colisiones exhaustivas, FPS ni Android físico. Sin commits salvo solicitud explícita.
