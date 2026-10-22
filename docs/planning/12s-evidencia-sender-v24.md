# Sender CFR high-pivot MY25 · revisión individual v24

## Alcance y corrección de generación

Solicitud del usuario: mejorar Sender CFR en paralelo con META, Nomad y S-Works Enduro, con la mayor fidelidad posible. Solo M/L de `canyon-sender-cfr-high-pivot`, desde v13. No se certifica 100 % CAD.

El inventario comercial declaraba el Sender high-pivot actual (MX, 200 mm, 250 × 75, carbono CFR), pero el trazado visual previo procedía del Sender verde de 2021. Se reemplaza por anatomía de la generación oficial presentada en mayo de 2025, sin modificar especificaciones comerciales o recursos históricos. [Fuentes y decisiones](../../models/catalog-v24/README.md), fotografías/URLs/SHA en `models/catalog-v24/references/sources.json`.

Diez fotografías originales oficiales descargadas e inspeccionadas; varias son acción o detalles y no equivalen a diez perspectivas completas. Se excluye el despiece 2021 que aparece en búsqueda. No se afirma disponer de vídeo inspeccionado ni despiece MY25 no accesible públicamente.

## Construcción y contratos

Superior/diagonal de secciones explícitas, Y corta, basculante por parejas, soportes fijos superiores, bieleta inferior, polea dentada unilateral y guardas. Dirección/collar/pedalier abiertos; los herrajes de la generación anterior no se conservan como si fueran actuales. Profundidades, superficies ocultas, letras y radios son aproximaciones exteriores.

Excepción autorizada por coordinación: seis anclajes visuales estimados cambian exclusivamente en los dos recursos nuevos. Dirección, ejes y pedalier permanecen iguales. `models/catalog-v24/anchor-changes.json` registra UUID, antes/después y motivos. La operación SQL exige los dos contratos exactos de `supabase/operations/frame-v24-anchor-contract.sql`, manifiesto restante y campos comerciales conservados; no es permiso general para cambiar anclajes.

Movimiento propio `models/catalog-v24/motion-profile.json`, seleccionado por identidad/versión de recurso, mantiene el perfil histórico para montajes anteriores. Basculante de pivote alto y ojo superior fijo; guía inferior estimada/intervalo conservador. No representa los 200 mm completos ni un mecanismo CAD.

## Evidencia local

- Dos capturas GLB, cinco mallas por talla. Ver bytes y SHA finales en `uploads.json`.
- Inspección de finitud, índices, marcadores y pintura en `inspection.json`.
- 22 rayos de apertura sin obstrucciones en `bore-review.json`; no certifican rodamientos o inserciones completas.
- Catorce vistas generales, diez detalles de pipa y dos superposiciones registradas. Artefactos de revisión local en `/tmp/atlas-frames-v24` y `/tmp/atlas-v24-details`; índices reproducibles en los JSON de v24.
- Doce pruebas propias verifican alcance, conservación, recursos nuevos, anclajes versionados, rectas y abertura de bieleta. La batería compartida final, ensamblaje/movimiento, transición y Cloud se completan en la coordinación conjunta.

## Integración publicada

Revisión coordinada completada: tipos estrictos, build y **303 pruebas en 60 archivos** correctos. Dos GLB cargados y releídos por SHA (2.816.928 bytes totales), operación SQL individual aplicada en secuencia tras v23. Dos guardados anteriores reabiertos y dos nuevos guardados; cuenta temporal eliminada. Evidencia en [transición](../../models/catalog-v24/transition.json) y [auditoría Cloud](../../models/catalog-v24/cloud-after.json).

Tres poses del configurador real (reposo/50/100), sin errores de navegador, comprobadas con GLB locales congelados mediante interceptación explícita del runner antes de subirlos. Esto valida la integración visual del recurso; no simula la cinemática exacta ni certifica colisiones/FPS. [Resultado](../../models/catalog-v24/motion-review.json). Los 28 recursos ajenos y todos los guardados históricos se conservan. Estado tras esta publicación: **70 modelos, 146 elecciones, 770 variantes/768 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias.

Reposición: `prepare-frame-v24.mjs --apply` → `publish-frame-v24.mjs --apply`; SQL propio en `supabase/operations/`; auditoría de lectura `validate-frame-v24.mjs`. Capturas publicadas inmutables. Seleccionar de nuevo el cuadro usa esta revisión; no convertir guardados ni prearmadas.

La revisión cruzada detectó el eje heredado de tija desalineado: `saddle` ahora prolonga el último tramo real del tubo, manteniendo longitud estimada. Las placas superiores son negras con tres tornillos observados. La longitud 250 mm documentada fija la distancia entre ojos; la foto en perspectiva fija su eje, sin reducir una medida conocida a los 230–236 mm que arrojaría el registro bruto.

La tarjeta anterior muestra la plataforma Sender 2021/pre-MY25, no el high-pivot actual. Copia y diagnóstico en `models/catalog-v24/card-review.json`; sustitución coordinada por render MY25 identificado, sin reutilizar fotos de otra generación.

## Integración de movimiento y tarjeta

El frontend selecciona el perfil nuevo solo para los dos IDs de recurso v24 (`src/features/configurator/model/suspension/sender-v24.json`). Los perfiles anteriores permanecen para recursos históricos. Cuatro pruebas específicas comprueban selección por identidad en ambas tallas, pivote alto, ojo superior fijo, compresión y conservación del perfil v13. El JSON runtime coincide con la fuente offline. La guía es reducida y conservadora; no se declara el recorrido comercial completo ni una cinemática CAD.

La imagen anterior verde pertenece a Sender 2021: se archiva con su metadata en `models/catalog-v24/references/`. La tarjeta usa ahora render transparente del GLB MY25 publicado en acabado Void Black, no una fotografía comercial de otra generación. Procedencia/SHA en `card-reference.json` y `src/assets/images/catalog/renders.json`. Comprobación de imagen servida en catálogo y captura en `card-review.json`; etiqueta común de producto «Referencia visual». La falta de una fotografía del cuadro MY25 aislado permanece identificada, sin disfrazar el render como foto.

## Portada Sender restaurada por el usuario · 21/10/2026

El usuario solicita conservar la fotografía real anterior en el card del Sender. Restaurada exactamente desde `models/catalog-v24/references/prior-card-generation-2021.webp`; es una referencia fotográfica de la plataforma 2021, sin atribuirla al 3D MY25. El modelo 3D v24, sus anclajes y movimiento permanecen. Render retirado archivado, registro vigente en `photos.json`, eliminado de renders actuales. Cobertura: 65 referencias fotográficas y cinco renders. El generador v24 bloquea `--apply` para impedir reemplazarla otra vez. Sin commits.
