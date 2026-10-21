# Recursos gravity v9

Ampliación aditiva: siete cuadros y cuatro horquillas, 26 capturas GLB/24 binarios distintos. No reconstruye ni sustituye v1–v8. Fuente de negocio: `supabase/catalog/gravity-reviewed.json`. Los recursos de esta publicación son GLB importados; **no existe un generador runtime `atlas-bike-v9`** ni se pasa v9 al publicador general.

`frame-profiles.json` conserva trazados independientes sobre fotografías del modelo indicado, con su resolución original. `geometry.ts` registra las proporciones a cotas documentadas cuando existen; `estimated_geometry` es una ayuda visual explícita y nunca se ingiere como medida comercial. `decals.ts` genera rotulación aproximada de presentación, sin afirmar reproducir gráficos de fábrica. Coronas, espesores, profundidades y caras ocultas son aproximaciones. Las referencias observadas y las inferencias se distinguen en [references.md](references.md).

```text
Ficha / generación / fotografías
           |
           v
perfil propio + cotas documentadas
           |
           v
GLB + anclajes + hash -> Storage inmutable
           |
           v
variante de catálogo -> montaje guardado
```

## Reconstrucción y publicación

Con el frontend local activo en 5174:

```sh
node scripts/prepare-gravity-models.mjs
node scripts/review-gravity-models.mjs
node scripts/prepare-gravity-models.mjs --apply
node scripts/ingest-catalog.mjs supabase/catalog/gravity-reviewed.json --apply
node scripts/validate-gravity-publication.mjs
```

La primera orden genera archivos locales y actualiza manifiestos; no escribe Cloud. `--apply` carga en Storage y verifica la descarga pública por SHA256; la ingesta posterior sí publica datos. Primero aplicar la migración 022. Si una captura ya tiene `published_at`, reconstruirla con bytes diferentes se rechaza: para un cambio físico crear otra identidad/versión. No borrar ese marcador para eludir la inmutabilidad. `exports/` conserva la fuente binaria exacta y `uploads.json` tamaños/rutas/hashes.

El visor interno `/tests/fixtures/gravity-review.html` permite lateral, opuesta, frontal, superior y diagonal. No se incluye en el build del producto. `atlasInspectAllGravity` comprueba los 26 GLB descargados del Cloud con el cargador real, incluidos materiales, rotulación, anclajes y nodos pintables. `atlasCaptureGravityImage` prepara una imagen transparente del GLB publicado del FRS; reproducción mediante `scripts/generate-gravity-reference-images.mjs --apply` (escritura local).

Las pruebas no certifican CAD, dinámica de suspensión, resistencia, ausencia total de colisiones, parecido del 90 %, rendimiento de 30 fps ni Android físico.
