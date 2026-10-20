# 12a · Evidencia del visor y consultas

Comprobaciones del 19 de octubre de 2026, relacionadas con [05](05-configurador-3d.md) y la ejecución parcial de [08](08-fases-y-validacion.md). El estado general y los pendientes se mantienen en [12](12-estado-implementacion.md). No equivalen a aceptación en teléfono físico ni a un despliegue Netlify.

## Recursos y recuperación

`node scripts/review-scene.mjs`, con Vite en 5174, comprobó 41 variantes: dieciséis del nuevo lote de suspensión, RXF38 m.3 y las 24 medidas Vivid Coil D1 antes de publicarlas. Cada una se preparó y dibujó dentro del ejemplo de 23 posiciones. Hubo cero errores de ejecución. En enduro se observaron hasta 52 926 triángulos enviados y 118 llamadas de dibujo por fotograma, **incluyendo sombras**; es una cota conservadora, no un recuento único de mallas.

Las capturas internas revisan ZEB, Z1, FLOAT X2 y TTX22m.2. Los recursos son genéricos identificados, con anclajes estimados; esta comprobación no acredita parecido CAD, tune ni herrajes de fábrica. El script conserva resultados y capturas en `/tmp/atlas-scene-review/`, sin versionar binarios de resultados.

La prueba autenticada de entrega usa un GLB sintético de tres vértices, generado por `tests/fixtures/visual-triangle.ts`; intercepta exclusivamente la descarga binaria. Comprueba preparar antes de dibujar, guardar/reabrir con caché vacía y recuperar la lista/guardado si la descarga devuelve 404. **No demuestra un bucket Storage real desplegado**: el inventario comercial actual es procedimental. Las pruebas puras comprueban binario válido, archivo inválido/ausente, aborto al agotar espera y liberación única de geometría/material/texturas compartidos.

```text
Datos disponibles → panel accesible → preparar recurso
                                     ├─ correcto → visor + selección
                                     └─ fallo    → lista + edición + guardado
```

## Medición de una compilación aislada

`node scripts/measure-scene.mjs` compila la entrada de revisión bajo `node_modules/.cache/atlas-scene-review`, sirve solo en localhost y cierra servidor/navegador al terminar. **No publicar ese directorio**: la entrada interna incluye datos de revisión. `dist/` sigue siendo la aplicación desplegable. `--mobile` limita la ejecución al perfil Android. Resultados y capturas en `/tmp/atlas-scene-performance/`.

Condiciones: Chromium 156.0.8078.4 headless, Linux x86_64, ANGLE/Vulkan SwiftShader; caché vacía, red CDP a 10 Mbps y 80 ms de latencia. Composiciones reales del inventario, 23 posiciones; interacción de cámara mediante arrastre continuo automatizado. Se cuentan fotogramas con geometría enviada, no solamente callbacks RAF. La entrada aislada no incluye latencia de Auth o consultas de catálogo.

| Perfil | Primera imagen completa | Transferencia de recursos | Triángulos con sombras | Llamadas con sombras | Interacción observada |
| --- | --- | --- | --- | --- | --- |
| Escritorio 1280×800, enduro | 1061 ms | 427 271 bytes | 52 926 | 118 | 18,8 fps |
| Escritorio 1280×800, descenso | 1058 ms | 427 271 bytes | 58 334 | 150 | 18,1 fps |
| Android Pixel 7 emulado, 412×839, enduro | 1094 ms | 427 271 bytes | 52 926 | 118 | 33,8 fps durante 10,0 s |
| Android Pixel 7 emulado, 412×839, descenso | 1008 ms | 427 271 bytes | 58 334 | 150 | 32,2 fps durante 10,2 s |

El usuario confirmó Android con **Brave y Chrome**. Pixel 7 es únicamente el perfil automatizado: no se había ejecutado un teléfono físico ni el binario Brave en aquella medición. La compatibilidad posterior con Brave instalado se registra abajo; no equivale a Android físico. La primera muestra anterior, con viewport iPhone emulado, dio 27,4/26,0 fps móviles; reduciendo DPR a 1 y sombra a 512 px subió a 37,3/35,1 fps en ese mismo viewport. La muestra Android posterior usa la calidad ajustada. No cambiar medidas ni versiones geométricas para obtener esos resultados.

La escena cumple los presupuestos iniciales de descarga, primera imagen y geometría en esta prueba aislada. **La aceptación de 30 fps sostenidos en equipo real, temperatura y Brave/Chrome Android sigue pendiente.** El escritorio por software queda por debajo de 30 fps; no ocultar ese resultado ni atribuirlo al rendimiento de una GPU física. Tampoco esta prueba mide la carga inicial completa de la aplicación desde Netlify.

## Consultas con RLS

`node scripts/measure-queries.mjs` prepara una identidad temporal, ejecuta `supabase/tests/query-plans.sql` en transacción de solo lectura bajo los roles `anon` y `authenticated`, guarda planes `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` y elimina la identidad. No consulta montajes de una cuenta ajena ni añade índices sin evidencia.

| Consulta | Ejecución en servidor | Resultado |
| --- | --- | --- |
| Catálogo de horquillas con aro/resorte sobre la misma variante | 0,948 ms | 8 filas |
| Filtros públicos de horquillas | 3,699 ms | Documento de filtros |
| Familias de descenso agrupadas | 6,195 ms | Documento de familias |
| Montajes propios con orden/paginación | 0,053 ms | Lista vacía de la identidad temporal |

Resultados completos en `/tmp/atlas-query-plans/results.json`. Son muestras del catálogo pequeño actual, con lecturas compartidas ya en caché; no incluyen red, no prueban cardinalidad alta, escrituras concurrentes ni una colección grande de montajes. No declarar escalabilidad de grandes volúmenes a partir de estos tiempos. Las pruebas de concurrencia de escritura se describen por separado en 12.

## Ampliación de cuadros y neumáticos

`node scripts/review-scene.mjs --frames` preparó doce variantes sobre composiciones de 23 posiciones, con capturas lateral/perspectiva/frontal/superior por talla en `/tmp/atlas-frame-review/`. Se detectó recorte de ruedas en la vista superior de cuadros largos: se aumentó la distancia de esa cámara y se repitió el lote completo sin errores. No se cambió la geometría publicada. Máximo observado: 68 190 triángulos y 150 llamadas con sombras. Las tres pruebas puras de cuadros comprueban dimensiones reales por talla, suelo común, tallajes originales, ausencia de peso inventado y distinción de polea high-pivot.

`--tyres` preparó las doce variantes del lote de neumáticos en la posición delantera, conservando las demás piezas. La entrada interna resuelve ahora las posiciones mediante `slotCategories`; no confunde la categoría tire con un slot inexistente. Cero errores de ejecución; máximo 52 926 triángulos y 118 llamadas con sombras, capturas en `/tmp/atlas-tyre-review/`.

`--drafts` revisó los doce borradores restantes del lote inicial, sin publicarlos. El modo conserva los indicadores originales en la fuente y solo prepara recursos localmente. Su renderizado no equivale a aceptación física: v1 ajusta amortiguadores a anclajes del cuadro y no representa todas sus diferencias de longitud; faltan revisiones de fidelidad/proporciones para aceptar esos borradores. No cambiar v1 ni sus recursos publicados silenciosamente para corregirlo. Se requieren recursos/versiones nuevos cuando cambie la geometría.

Las mediciones de descarga/fps de la tabla anterior corresponden a la entrada aislada antes de incorporar estos dos lotes al archivo interno de revisión. No usar 427 271 bytes como tamaño actualizado de esa entrada ampliada ni como transferencia inicial completa de la aplicación. Las imágenes/siluetas son genéricas identificadas y no acreditan carenado integrado SCOTT, CAD, recorrido de suspensión, diseño de tacos o pintura exacta de fabricante.

## Compatibilidad adicional con Brave instalado

`playwright.config.ts` admite `ATLAS_BROWSER_EXECUTABLE` para ejecutar un navegador instalado sin sustituir la descarga o configuración del SDK. Con `ATLAS_BROWSER_EXECUTABLE=/usr/bin/brave`, Brave 154.1.96.59 en Linux headless pasó las once comprobaciones públicas usando el perfil Pixel 7: portada, registro local, acceso, fichas, comparación, fotos, variantes, neumáticos y referencia anterior de cuadro. También pasaron cinco recorridos autenticados: descenso con pérdida de contexto/color, entrega GLB con fallo, cambio a Nomad L, inicio desde Sender y recuperación tras reautenticación/cierre explícito. Las cuentas y fixtures se eliminaron al terminar. Es el binario Brave real en Linux con emulación de viewport/entrada; **no es Brave para Android ni una medición física de fluidez**.

```sh
ATLAS_BROWSER_EXECUTABLE=/usr/bin/brave node scripts/test-authenticated.mjs mobile 'documented Nomad|Sender frame|reauthentication retains|reviewed DH|saved imported'
ATLAS_BROWSER_EXECUTABLE=/usr/bin/brave pnpm exec playwright test tests/browser/public.spec.ts tests/browser/catalog.spec.ts --project mobile
```

La revisión de BSA 73 en Specialized conserva las referencias iniciales no seleccionables y crea dos capturas con el recurso visual anterior. La prueba pública comprueba acceso al enlace anterior, ausencia de acción de montaje para esa captura y dos tallas actuales sin duplicación. La prueba pura verifica que los IDs nuevos no sobrescriben los anteriores y reutilizan la misma geometría/recurso.
