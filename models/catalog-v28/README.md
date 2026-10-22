# TUES MK4 Carbon · v28

Reconstrucción individual M/L tras el rechazo explícito de v27. Tres agentes auditaron silueta, estructura/trasera y registro/anclajes por separado, con revisión cruzada del candidato antes de publicar. No se extiende a otros cuadros. Fotografías reales del card, prearmadas y guardados históricos permanecen.

## Fallos de v27 y fuentes

El punto de dirección anterior caía sobre la barra FOX40; imponerlo mediante registro afín introducía cizalla y distinta escala vertical/horizontal. Los centros del superior estaban desplazados hasta unos32px. Los tubos circulares estrechos y sus uniones no representaban las caras anchas moldeadas del carbono. Las pruebas anteriores comprobaban integridad, no semejanza.

Ambos raster oficiales tienen2300×1400px; ancho normalizado2048 implica alto1246,6087, no1240. Fuentes propias conservadas en [v26](../catalog-v26/references/sources.json): lateral Shell White MX, opuesta/diagonal no motriz, tres detalles MK4, manualMY2024 p31 y vídeo YT Workshop realmente muestreado. No usar MK3 como sustituto. Las propuestas frontales normalizadas y traseras nativas declaran sus espacios; `prepare-tues-v28-contours.py` convierte y une cuerpos compatibles, sin mezclar unidades.

## Método

- `front-contours.proposal.json`, `rear-contours.proposal.json`: bordes observados, regiones ocultas, correcciones y topología. Unión2D offline dentro del frente y dentro del conjunto superior trasero; no unir cuerpos articulados distintos.
- `contours.json`: cinco cuerpos/contornos resultantes. Reproducir con `uv run --with shapely==2.1.2 scripts/prepare-tues-v28-contours.py`; la captura GLB utiliza el JSON preparado y no requiere Python en producto.
- `registration.ts/json`: similitud uniforme BB/eje trasero, sin cizalla. Pipa de110mm centrada sobre referencia parcialmente oculta y dirección anterior estimada; ojos250mm con pequeña corrección simétrica respecto a eje fotografiado. Collar centrado realmente en el corte blanco nativo929,5/542, no en el antiguo borde815/480. Perspectiva/talla de la foto y caras ocultas impiden metrología exacta.
- Ocho anclajes visuales estimados corregidos en nuevas identidades: dirección/extremo inferior, eje delantero, collar/tija, dos ojos y pivote de referencia de bieleta. Eje trasero exacto; medidas comerciales, acabados y todos los manifiestos anteriores intactos. Contrato completo porUUID en `anchor-corrections.json`; SQL exige antes/después y claves permitidas.
- Caras de carbono con bisel perimetral y profundidad afín variable; plano central sin pliegues de triangulación. Normales de bisel calculadas temporalmente en milímetros: Three cuantiza posiciones en `toCreasedNormals`, por lo que metros mezclaban superficies vecinas. Las caras principales conservan su normal plana y el perímetro se suaviza.
- Brazos completos, punteras y ajustesILA, base no motriz de freno, puentes moldeados, orejetas superiores y protección inferior acotada. Flip Link macizo separado transversalmente del muelle; su centro48mm/semiespesor9mm deja una cara interior a39mm y usa espaciadores. Esto corrige las estrías negras por intersección encontradas en el montaje de prueba; no garantiza otras combinaciones o colisiones exhaustivas.

La auditoría corrigió una hipótesis errónea: el ojo inferior no puede pertenecer al cuerpo fijo junto con el superior. Perfil propio de inspección reducido en `motion-profile.json`, copia runtime `tues-v28.json`, seleccionado solo por dos IDs nuevos. Registro por similitud, ojo superior fijo/inferior en basculante de entrada y pivote oculto887/790 inferido del despiece; guía conservadora0,09rad. No es reconstrucción de palancas de fábrica ni200mm completos. Históricos usan sus perfiles anteriores.

## Validación del parecido

`contour-checks.json` contiene54 puntos independientes observados en fotografía (dentro/fuera), sin derivarlos del constructor. `inspect-frame-v28-contours.mjs` compara GLB actual y anterior bajo los dos registros. V27 falla14–21 muestras según talla/registro; v28 pasa54/54 por talla. Es aceptación de esas muestras en seis regiones, **no un porcentaje de fidelidad global ni CAD**. Se conservan las oclusiones y las inferencias explícitas.

Los agentes rechazaron borradores de trasera demasiado ancha, caras con pliegues, collar desplazado y muelle atravesando la bieleta. Se corrigieron sin cambiar los criterios para hacerlos pasar. Revisión final de caras, multivista y tres poses registrada en `adversarial-review.json`. Pipa/espesores y detalles ocultos siguen aproximados; los agentes no certifican100%.

## Reproducción

```sh
node scripts/prepare-frame-v28.mjs
node scripts/inspect-frame-v28-exports.mjs
node scripts/inspect-frame-v28-preservation.mjs
node scripts/inspect-frame-v28-contours.mjs
node scripts/inspect-frame-v28.mjs
node scripts/inspect-frame-v28-passages.mjs
node scripts/review-all-frames.mjs --v28 --all
node scripts/review-frame-v28-details.mjs
node scripts/review-frame-v28-overlay.mjs
node scripts/validate-frame-v28.mjs --before
```

Montaje antes de carga: `ATLAS_LOCAL_MODEL_VERSIONS=v28 node scripts/review-suspension-motion.mjs --v28 --model=yt-tues-mk4-carbon`. `prepare-frame-v28.mjs --apply` carga/relee SHA; `validate-frame-v28-transition.mjs --publish` prueba dos montajes anteriores, publica individualmente y prueba dos nuevos; elimina su cuenta temporal. Auditoría posterior de lectura `validate-frame-v28.mjs`; reposición después de v27 con `publish-frame-v28.mjs --apply`. Fuente SQL en `supabase/operations/publish-frame-v28.sql`.

Visor interno `/tests/fixtures/frame-v28-review.html?version=v28&view=lateral`, fuera del build. Sin generador ni CSG runtime. Evidencia en [12v](../../docs/planning/12v-evidencia-tues-v28.md). No certificar CAD/100%, cinemática, resistencia/ajuste, contactos exhaustivos o Android físico/FPS. Sin commits salvo petición explícita.

La revisión de dirección ampliada detectó puntas de bisel no capturadas por los54 puntos. Se limpiaron concavidades mediante closing7px/simplificación0,8px y biseles adaptados (frente4px, trasera6px, detalles menores). Nuevos acercamientos M/L confirman eliminación de las puntas; una mínima esquina de blend inferior sigue aproximada. La revisión cercana y multivista no se sustituye por los puntos.
