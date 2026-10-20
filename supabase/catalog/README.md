# Inventario revisado

`initial-reviewed.json` conserva 29 modelos y 74 variantes, de las cuales 62 están publicadas. Se completó la publicación de RXF38 m.3 y las 24 medidas Vivid Coil D1 tras comprobar sus representaciones genéricas. Permanecen doce variantes en borrador; no se cambian sus medidas para forzar publicación.

`braking-reviewed.json` aporta diez modelos y doce variantes publicados de frenos/discos. `suspension-reviewed.json` añade cuatro modelos y dieciséis variantes publicados: ZEB Ultimate B1 29/170, Bomber Z1 RAIL 29/150 y 29/160 con acabados documentados, once FLOAT X2 Factory MY26 y TTX22m.2 MTBM 2208. `frames-reviewed.json` añade seis modelos, doce variantes seleccionables por talla y dos capturas anteriores conservadas de Santa Cruz, Canyon, Specialized, DA BOMB, SCOTT y Trek. `tyres-reviewed.json` aporta cuatro modelos y doce variantes de CST, Kenda, Michelin y Schwalbe. El total es **53 modelos/128 variantes**, con **53 modelos/116 variantes publicados, de las que 114 son seleccionables** y doce variantes en borrador. Aplicar las cinco fuentes antes de las composiciones; ninguna fuente aislada sustituye al catálogo completo.

Los recursos nuevos reutilizan el generador v1 con identidad propia, también al montarlos en cuadros v2; no modifican geometrías publicadas. Los pesos conservan su medida de referencia y los intervalos requieren fuente de la generación concreta. Las revisiones de recurso no certifican instalación física.

Las MAGURA conservan Royal Blood, manual de MT y mantenimiento condicionado por síntomas, sin inventar una purga anual. El peso de conjunto, lado o SKU sin correspondencia exacta permanece ausente. Maven B1 no hereda datos de A1. Los precios MAGURA son PVP de referencia con IVA alemán del 19 %, fechados y enlazados; no se suman como presupuesto del montaje.

`enduro-examples.json` contiene dos versiones M/L de un mismo ejemplo ATLAS con 23 posiciones. Parte del cuadro COMMENCAL META SX V5 y combina FOX 38 Factory MY27, Marzocchi Bomber CR, Shimano SLX, DT Swiss, Maxxis, ROCKBROS y los cuatro [auxiliares propios](atlas-auxiliaries.md). No se etiqueta como montaje de fábrica ni se atribuye un año comercial a la composición.

Las medidas desconocidas permanecen ausentes o null. La fuente OEM de las bielas identifica SLX, 165 mm y plato de 32 dientes, pero no el sufijo de biela, SKU, diámetro de eje o línea de cadena: no se completan por deducción. Los herrajes del amortiguador y la selección de muelle no quedan certificados por coincidir entreojos/carrera. No se suman precios de conjuntos agrupados visualmente. Al reponer un proyecto completo, aplicar las cinco fuentes de catálogo antes de sus composiciones; una fuente no elimina las referencias de la otra.

`downhill-examples.json` añade dos versiones M/L del ejemplo SUPREME DH V5, con FOX 40 Factory MY27, Bomber CR 250×75, transmisión SRAM DH de siete velocidades, núcleo XD, pedalier DUB PF107, bujes 20×110 BOOST/12×157 y auxiliares propios. Conserva 23 posiciones por versión; las ruedas/neumáticos reutilizados son referencias del catálogo, sin declarar certificación de competición del conjunto.

## Aplicación y validación

Con Node de `.node-version`:

```sh
node scripts/ingest-catalog.mjs supabase/catalog/initial-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/braking-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/suspension-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/frames-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/tyres-reviewed.json
node scripts/ingest-presets.mjs supabase/catalog/enduro-examples.json
node scripts/ingest-presets.mjs supabase/catalog/downhill-examples.json
```

Estas órdenes validan sin escribir. `--apply` aplica cada documento transaccionalmente al proyecto Cloud existente. Aplicar catálogo antes de composiciones. La ingesta de prearmadas comparte `iam.validate_preset_document` con el RPC administrativo; no usa una copia menos estricta de sus reglas. No sustituye las migraciones ni crea tablas adicionales.

Para revisar recursos antes de publicarlos, abrir `/tests/fixtures/scene-preview.html` en Vite local; `?size=L` muestra la otra talla; `?discipline=downhill&size=L` selecciona descenso. Esta entrada interna materializa los recursos en memoria para revisión sin cambiar los indicadores de publicación en Cloud. No forma parte del build de producción ni se ofrece como ruta comercial.

## Recursos publicados

El generador `atlas-bike-v1` está separado en `src/features/configurator/scene/generators/BikeV1.tsx`, junto con su ensamblaje v1 en `model/assembly.ts`. Tras su primera publicación, cambios de geometría o anclajes efectivos requieren una nueva clave de generador y otra variante/recurso. Conservar el generador anterior para reproducir montajes guardados. La cámara o la gestión de errores pueden mejorar manteniendo la geometría y la identidad del recurso.

El recurso de cuadro `atlas-bike-v2` conserva su ensamblaje de descenso en `model/assemblyV2.ts`; la escena integra las piezas comunes del generador anterior y representa doble pletina, potencia directa, bieletas y polea con recorrido de cadena. Sus anclajes de detalle siguen marcados como estimados. La elección del ensamblaje se conserva mediante el recurso del cuadro guardado, no mediante un nombre o disciplina mutable. La migración 013 impide publicar generadores que el cliente no soporta.

Las representaciones procedimentales son genéricas o aproximadas, según cada variante. No equivalen a CAD del fabricante. El primer conjunto ya está publicado en Supabase Cloud de desarrollo y dispone de pruebas públicas y de guardado/reapertura con cuentas temporales. La revisión de siluetas y proporciones de este conjunto no acredita rendimiento de un dispositivo real ni toda la fidelidad exigida a la entrega final.

## Fotos de referencia locales

Las fotos se sirven desde `src/assets/images/catalog/` y se resuelven por `src/data/images.ts`; no se usa hotlink desde el frontend. Procedencia consultada el 19 de octubre de 2026:

| Archivo | Fuente oficial | Tamaño preparado |
| --- | --- | --- |
| `assegai.jpg` | [Maxxis Assegai](https://shop.maxxis.com/products/assegai), imagen del dibujo Assegai | 640 px, unos 40 kB |
| `minion-dhr-ii.jpg` | [Maxxis Minion DHR II](https://shop.maxxis.com/products/minion-dhr-ii), imagen del dibujo DHR II | 640 px, unos 38 kB |
| `rockbros-nylon.jpg` | [ROCKBROS 2017-12](https://rockbrosusa.com/products/rockbros-mtb-pedals-mountain-bike-pedals-lightweight-nylon-fiber-bicycle-platform-pedals-for-bmx-mtb-9-16), imagen del acabado negro | 640 px, unos 60 kB |

Una foto de familia no acredita por sí sola un SKU, dimensión, acabado o compuesto; esos datos conservan su fuente de variante.

Las fotos locales adicionales `supreme-dh-v5.jpg` y `fox-40-my27-black.png` proceden, respectivamente, de la ficha oficial del [cuadro](https://www.commencal.com/fr/bikes/cadres%20%2F%20a%20la%20carte/downhill/supreme%20dh%20v5/FT3SUPV54M.html?lang=fr_FR) y de la variante negra 910-21-410 en [FOX](https://ridefox.com/products/my27-fox-40-factory), consultadas el 19 de octubre de 2026. La foto del cuadro ilustra la familia, sin certificar su acabado ni sustituir el modelo 3D.

La foto `magura-mt5.png` conserva el PNG original de [MAGURA MT5](https://magura.com/product/mt5/), consultado el 19 de octubre de 2026 (800×640, unos 304 kB, con transparencia). Ilustra la pinza y maneta de referencia; no se reutiliza para MT5 PRO u otras versiones con manetas distintas. Para revisión interna: `?brake=magura-mt5&rotor=magura-mdr-p` en la entrada de escena.

Las fotos `marzocchi-z1-rail-black.jpg` y `marzocchi-z1-rail-red.jpg` se obtuvieron del CDN enlazado por las variantes oficiales [Bomber Z1 RAIL](https://bike.marzocchi.com/products/bomber-z1), a 800 px (unos 23/35 kB). La variante roja conserva su foto roja; no se toma el nombre MY25 del archivo como prueba del año comercial. El generador v1 sigue representando una horquilla genérica, sin atribuir esa foto a una malla CAD.

Comprobaciones reproducibles del visor: `node scripts/review-scene.mjs` con Vite en 5174 revisa las 41 variantes de suspensión del lote/publicación de borradores; `node scripts/measure-scene.mjs` prepara una compilación aislada bajo `node_modules/.cache/` y mide las dos disciplinas en Chromium con red limitada. Este compilado interno contiene fuentes de revisión y **no es el frontend que se despliega**. Evidencia y límites en [12a](../../docs/planning/12a-evidencia-del-visor.md).

Las ampliaciones de cuadros conservan S3/S4 y 17″/19″, geometrías por talla y anclajes estimados; no certifican mecanismos o carenados de marca. Las de neumáticos conservan carcasa/compuesto por SKU y no suman capas TPI ni trasladan pesos de otra referencia. Fuentes y límites en [11c](../../docs/planning/11c-cuadros.md) y [11l](../../docs/planning/11l-neumaticos.md). `node scripts/review-scene.mjs --frames` prepara doce cuadros y cuatro cámaras por talla; `--tyres` prepara las doce variantes de neumáticos sobre la posición delantera. La revisión usa recursos genéricos identificados; queda pendiente el parecido final de detalle.

Specialized conserva sus dos capturas iniciales como publicadas no seleccionables; dos nuevas capturas incorporan BSA 73 mm del manual oficial sin cambiar sus recursos ni geometría. Los enlaces y montajes anteriores conservan su referencia. El selector normal muestra las dos tallas vigentes, no las capturas retiradas.

Ampliación fotográfica posterior: 40 WebP nuevos, registro de procedencia y alcance en [README de imágenes](../../src/assets/images/catalog/README.md) y `photos.json`. `src/data/images.ts` admite `catalog:<slug>` y resuelve por slug cuando `image_key` es null. La foto de variante tiene prioridad; no se modificaron datos técnicos ni se reingirieron modelos para conectar estas imágenes. Cobertura local: 46 modelos con foto; cinco genéricos ATLAS y dos referencias comerciales pendientes documentadas.
