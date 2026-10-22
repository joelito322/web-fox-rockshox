# Canyon Sender CFR high-pivot MY25 · v24

Revisión individual de M/L desde v13. Preparación offline propia, sin modificar ningún binario histórico. Las referencias anteriores del constructor pertenecían al Sender verde de 2021 aunque el catálogo declaraba high-pivot actual. Esta revisión utiliza la generación presentada oficialmente el 6 de mayo de 2025. No reutiliza su antigua topología de dos bieletas.

## Referencias y observación

[Presentación oficial Canyon](https://media-centre.canyon.com/en-INT/248858-all-new-canyon-sender-cfr-downhill-bike-unveiled-with-high-pivot-suspension-design/), fotografías originales descargadas en `references/`, URL y SHA en `references/sources.json`. Diez archivos distintos: lateral completa, transmisión, contracara/amortiguador, unión inferior, pipa/cockpit, eje trasero y fotografías de acción. Las fotos de acción no sustituyen perspectivas técnicas ni se cuentan como diez vistas completas del cuadro. `side-registration.jpg` es un derivado reducido a 1800 × 1200 de `official-09.jpg`; su escala corresponde a `profile.json`.

La búsqueda de despiece MY25 no produjo una lámina pública verificable: el portal de Canyon solicita identificación de la bicicleta para modelos posteriores a 2024. Se excluyen expresamente las láminas M086 de 2021 y M34 de 2019. No se afirma haber inspeccionado vídeos ni un CAD no accesible.

Se observan superior largo recto, unión de sillín en Y corta, diagonal recta con desvío inferior, basculante por parejas, polea unilateral, montaje superior fijo del amortiguador y bieleta inferior móvil. Pipa/collar/pedalier conservan conductos reales. Las profundidades, radios locales, letras y caras ocultas se estiman; no se certifica identidad del 100 %, tolerancias, ajuste ni ausencia exhaustiva de colisiones.

## Anclajes y excepción versionada

`senderAnchors()` conserva dirección, ambos ejes y pedalier comerciales. Corrige seis anclajes visuales estimados únicamente en la nueva identidad: sillín/tubo de sillín, ojos del amortiguador, pivote principal y polea. Pivote y polea son coaxiales en la arquitectura nueva. El registro de las fotos se mantiene en los tres puntos pedalier/dirección/eje trasero, por talla. No es calibración ortográfica.

`anchor-changes.json` registra antes/después, UUID y justificación. `supabase/operations/frame-v24-anchor-contract.sql` contiene la lista exacta de dos sucesores autorizados y sus anclajes. El publicador no permite una modificación arbitraria del manifiesto: comprueba ese contrato exacto, el resto del manifiesto y todos los campos comerciales. Los montajes anteriores siguen utilizando sus recursos/anclajes originales; ninguna prearmada ni montaje privado se transforma.

Se reconstruyen también los herrajes de la topología nueva, en lugar de retener los mecanismos incompatibles del Sender 2021. Patilla, soporte de freno, polea y protección de transmisión conservan su lado específico. No se refleja cualquier accesorio indiscriminadamente.

## Movimiento

`motion-profile.json` es un perfil propio `atlas-motion-sender-v24`, seleccionado solo para recursos `catalog/v24/`. El perfil anterior permanece para recursos históricos. El basculante es un cuerpo rígido que gira alrededor del pivote alto; el ojo superior queda fijo y el inferior usa una guía de bieleta reducida. El punto de accionamiento oculto es inferido y el intervalo es conservador (0,09 radianes), no todo el recorrido comercial de 200 mm ni la curva real de palanca. La postura de inspección no se persiste.

## Reproducción

```sh
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/prepare-frame-v24.mjs
node scripts/prepare-frame-v24-anchor-contract.mjs
node scripts/publish-frame-v24.mjs
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/inspect-frame-v24-exports.mjs
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/inspect-frame-v24.mjs
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/review-frame-v24-general.mjs --v24 --all
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/review-frame-v24-details.mjs
ATLAS_BASE_URL=http://127.0.0.1:5199 node scripts/review-frame-v24-overlay.mjs
```

Los comandos anteriores no escriben en Cloud. Publicación coordinada después de v21 → v22 → v23: preparación con `--apply` carga y relee los dos GLB inmutables; transición `validate-frame-v24-transition.mjs --publish` publica únicamente los dos sucesores y comprueba guardados viejos/nuevos con limpieza de cuenta temporal. Auditoría `validate-frame-v24.mjs` de solo lectura. No ejecutar contra el snapshot anterior a v23 ni mutar bytes después de cargar.

`protected-captures.json` tiene los 28 SHA de los otros catorce cuadros actuales, incluyendo v21/v22/v23. Si esas revisiones aún están ajustándose en paralelo, regenerar esta lista desde sus capturas finales antes de la validación final. Sin commits salvo solicitud explícita.

La revisión cruzada detectó el eje heredado de tija desalineado: `saddle` ahora prolonga el último tramo real del tubo, manteniendo longitud estimada. Las placas superiores son negras con tres tornillos observados. La longitud 250 mm documentada fija la distancia entre ojos; la foto en perspectiva fija su eje, sin reducir una medida conocida a los 230–236 mm que arrojaría el registro bruto.

La tarjeta anterior muestra la plataforma Sender 2021/pre-MY25, no el high-pivot actual. Copia y diagnóstico en `models/catalog-v24/card-review.json`; sustitución coordinada por render MY25 identificado, sin reutilizar fotos de otra generación.

## Cierre coordinado

Publicado tras v23: carga/relectura SHA, transición de dos guardados anteriores/dos nuevos y limpieza de cuenta temporal correctas; auditoría `cloud-after.json`. Tres poses integradas sin errores de navegador. Tipos/build y suite conjunta de 303 pruebas correctos. Estado propio del snapshot: 70 modelos, 146 elecciones, 770 variantes/768 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. El snapshot más reciente es v24; validadores anteriores son históricos. No mutar capturas publicadas ni convertir montajes.
