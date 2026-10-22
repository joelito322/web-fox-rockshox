# Inspección de suspensión · motion v2

Auditoría y corrección de los quince modelos de cuadro actuales, sus30 tallas y las38 variantes publicadas de cuatro familias de amortiguador. También cubre cuatro recursos v11 de antiguas prearmadas:34 cuadros/72 GLB comprobados. Los doce borradores de catálogo no se presentan como piezas publicadas ni se incluyen en esta cifra.

## Fallos encontrados y corrección

- Seis modelos acababan alargando el shock al seleccionar máxima compresión: Ransom, Slash, CAPRA, CHERRY BOMB, META y Enduro. `audit-before.json` conserva el diagnóstico inicial, no una prueba con todas las combinaciones posibles.
- El recorrido podía rebasar el punto de máxima compresión del mecanismo. V2 exige compresión y elevación de rueda monótonas; retrocede un intervalo antes de una inversión entre muestras, además de respetar cierre, carrera y desplazamiento máximos. No se invierte la animación del muelle para simular una compresión que los ojos no hacen.
- Slash y CHERRY BOMB usan ojo superior articulado y apoyo inferior fijo; META mueve el clevis con el enlace superior/entrada y corrige los ejes invertidos del enlace inferior. CAPRA registra pivote fijo del balancín y unión del tirante; Ransom conserva una guía interior reducida con ojo inferior en entrada. Nomad y Enduro usan sus registros/regiones actuales v22/v23, no la foto de una generación previa.
- En Vivid, el criterio anterior confundía el cuerpo cilíndrico y el depósito con el muelle. El resorte se identifica por la geometría helicoidal alrededor de su propio eje, con numerosos niveles axiales; un cilindro rígido o depósito desplazado no cumple ese criterio. En los38 GLB actuales se separa una hélice por coil y ninguna en aire.
- Clasificación axial por longitud real del shock seleccionado, no por distancia entre ojos del cuadro si se elige una combinación incompatible. Vástago, ojo y apoyo inferior deslizan; carcasa, precarga y depósito mantienen forma. La hélice acorta su intervalo geométrico manteniendo apoyo superior y diámetro. El giro completo entre ambos ojos se conserva desde `BikeScene`.

Perfiles por identidad en `src/features/configurator/model/suspension/current-v2.json`; fuente reproducible `prepare-profiles.py`. Solo se aplican a los30 recursos vigentes y cuatro IDs v11 identificados; los demás históricos conservan su perfil anterior. Corrección de animación sobre instancias derivadas: no se regeneran ni mutan GLB publicados ni datos de montajes privados. Los cuatro IDs v11 reciben la corrección de inspección, conservando sus formas/identidades guardadas.

La revisión cercana del META detectó una separación que el cierre matemático no detectaba: no basta con hacer que el shock acorte. El clevis debe seguir el enlace que lo sostiene. Se corrigió antes de aceptar la revisión; [comparación META/CAPRA](evidence/meta-capra.jpg).

## Cobertura y límites

`audit-after.json`:72 GLB,41 posturas por recurso, sin fallos de compresión/rigidez axial registrados; cierre de pivotes matemáticos con error máximo menor de1e-8m. `suspension.test.ts` comprueba además1292 combinaciones de34 cuadros×38 shocks en100 pasos (incluye elecciones visuales incompatibles), los72 GLB, un único muelle por coil, diámetro/apoyo superior/restauración y SHA de archivos intactos. Que una combinación pueda animarse no confirma compatibilidad de medidas/anclajes.

Quince conjuntos completos en reposo/media/máxima postura,45 capturas de navegador; el META se volvió a capturar tras corregir su clevis. `browser-review.json` y [conjuntos comprimidos](evidence/frames-compressed.jpg). Pruebas de reproducción, pausa, reposo al editar, movimiento reducido, nueve familias de horquilla/cuatro de shock, compresión del resorte y guardado/reapertura en escritorio y Pixel7 emulado. La emulación usa Chromium/SwiftShader y no certifica Android físico, Brave real o FPS.

Son guías exteriores estimadas, no cinemática de fábrica: seis barras/ocultaciones siguen reducidas y las profundidades/contactos no son CAD. Varios intervalos son pequeños y conservadores (especialmente CAPRA, TUES, Sender y META); no afirmar recorrido comercial completo, cargas/sag, curvas de palanca exactas ni ausencia exhaustiva de interferencias. Las muestras verifican la trayectoria y piezas dibujadas, no cada contacto mecánico interno.

## Prearmadas y guardado

La comprobación en Cloud encontró cuatro cuadros v11 retirados dentro de las prearmadas públicas. El configurador los rechazaba por no seleccionables. `sync-motion-presets.mjs --apply` reemplazó solo esos cuatro IDs por META v21/SUPREME v25, manteniendo componente/talla/especificaciones/acabados y las otras88 posiciones; snapshots de montajes privados antes/después iguales. Fuente aditiva `supabase/catalog/motion-v2-examples.json`, mapeo `preset-frame-updates.json`, SQL `supabase/operations/sync-motion-presets.sql` y evidencia `preset-publication.json`. El guardado/reapertura real pasó después, en ambos perfiles de navegador. No convertir montajes privados ni sobrescribir fuentes históricas de prearmadas.

Al reponer datos históricos, aplicar esta operación después de publicar v30 y actualizarla explícitamente si las elecciones vigentes cambian. No desactivar el control de retirados ni ampliar permisos para ocultar una composición inválida. Estado de catálogo igual:70 modelos/146 elecciones/782 variantes/780 recursos históricos,4 prearmadas/92 posiciones,22 migraciones/12 tablas propias; no migración/Auth/IAM/Edge nueva.

## Reproducción

```sh
python models/motion-v2/prepare-profiles.py
node scripts/audit-suspension.mjs --out=models/motion-v2/audit-after.json
pnpm exec vitest run models/motion-v2/suspension.test.ts
node scripts/review-suspension-motion.mjs --all
node scripts/validate-configurator-performance.mjs desktop motion
node scripts/validate-configurator-performance.mjs mobile motion
node scripts/sync-motion-presets.mjs          # validar fuente sin escritura
node scripts/sync-motion-presets.mjs --apply  # operación acotada de reposición
```

El auditor es offline con Vite SSR, GLTFLoader y exportaciones locales; no consulta Cloud. El validador de navegador usa cuentas temporales y las elimina junto a sus montajes/miniaturas. Fuente de perfiles basada en registros y despieces locales: v5/v9 para legado, META v21, Nomad v22, Enduro v23, Sender v24, TUES v28/v29 y V10 v30. Referencias inspeccionadas incluyen `catalog-v21/references/META-V5-links.jpg`, `META-V5-front-triangle.jpg` y fotografías propias de CAPRA/Slash/CHERRY BOMB. Documentos oficiales complementarios: [YT CAPRA MK3](https://www.yt-industries.com/media/1c/a7/6f/1729759076/CAPRA-MK3-CF-29-MX-TECHNICAL_INFORMATION_CUSTOMER_210518.pdf), [Trek Slash Gen6](https://media.trekbikes.com/image/upload/v1701373164/Slash_AlloyCarbon_ServiceManual_MY24_Rev1_EN-US_2023-11-29.pdf). No se atribuye inspección de vídeos completos a esta auditoría.

Sin commits salvo petición explícita. Evidencia de integración en [12y](../../docs/planning/12y-evidencia-suspension-v2.md).
