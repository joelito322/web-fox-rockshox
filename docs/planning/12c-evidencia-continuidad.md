# Evidencia de continuidad multivista · v6/v7

Actualización del 20/10/2026. El usuario pide completar caras ocultas, brazos y conexiones con lógica propia del modelo después de ampliar referencias. [Contrato](05a-fidelidad-modelos.md), [fuentes y límites por modelo](../../models/catalog-v6/references.md), [reconstrucción](../../models/catalog-v6/README.md).

## Resultado integrado

Ocho cuadros, cinco horquillas y cuatro amortiguadores tienen 76 capturas GLB nuevas (74 binarios únicos). Los cuadros incorporan contrapartes de enlaces, pivotes transversales, raíces de yugos, punteras separadas, ojos de amortiguador apoyados, portapoleas y apoyos de freno en el lado correspondiente. El META ya no deja su conjunto trasero desconectado; el Ransom mantiene oculta su suspensión y representa sus enlaces laterales exteriores. Las suspensiones corrigen continuidad de coronas/asiento de dirección y vástago/ojo inferior.

La revisión del montaje detectó también la pinza trasera detrás del eje y una supresión indebida de la carcasa nueva. V6 corrigió su posición y creó 85 sucesoras, conservando 43 capturas sin cambio. La comprobación posterior del cuerpo de pinza encontró el filtrado: como v6 ya estaba publicado, la corrección se entrega en nueve sucesoras **v7**, conservando las otras 119 capturas. V5 y v6 mantienen su resultado geométrico por defecto; solo v7 finaliza las superficies nuevas después de filtrar el cuerpo antiguo. El catálogo no añade campos ni elecciones comerciales.

Snapshot final Cloud: **53 modelos, 114 variantes públicas seleccionables y cuatro prearmadas**. De esas elecciones, 63 usan GLB v6, nueve renderer de frenos v7 y 42 geometría v5 sin cambios. Las 606 variantes y 604 recursos totales incluyen historial; doce borradores continúan sin publicarse. Migraciones 017/018 aplicadas; sin tablas nuevas ni modificación de Auth/IAM/Edge Functions. Frontend local en 5174, sin despliegue Netlify. El usuario solicitó comitear la ampliación por propósito: fuentes de modelos, renderizado, publicación de catálogo, herramientas de validación y documentación; sin push ni autorización de commits futuros.

## Comprobaciones

| Área | Evidencia y alcance |
| --- | --- |
| Fuente editable | 76 exportaciones GLB y escenas Blender por cuadro/talla y representante de suspensión; cada captura conserva cotas, pintura y anclajes. Máximo individual: 2 842 172 bytes. |
| Contactos reales | Se evalúan triángulos antes de agrupar por material: intersecciones, contención y proximidad de hasta 2 mm. Los 17 representantes quedan en un grupo conectado. Ocho controles negativos separan deliberadamente un brazo y el comprobador detecta la desconexión. No equivale a soldadura, resistencia, tolerancias o cinemática. |
| Revisión aislada | 17 modelos × siete direcciones: lateral derecho/izquierdo, frente, arriba, abajo y dos perspectivas opuestas. Repetidos los ocho cuadros después de incorporar los apoyos de pinza. Cero errores de ejecución; la comparación visual conserva diferencias e inferencias declaradas. |
| Contratos y geometría | Build correcto; 61 pruebas en 20 archivos: parseo de los 76 GLB, anclajes, profundidad, valores finitos, medidas/acabados preservados, capturas reutilizadas y nueve cuerpos de freno con posición trasera corregida. La prueba de maneta/latiguillo superior comprueba que se conservan al completar las pinzas delanteras. |
| Catálogo montado | Un representante de cada uno de los 53 modelos, en cuatro cámaras, usando la composición y Storage reales. Cero errores; máximo observado 333 114 triángulos enviados y 137 llamadas, incluyendo sombras iniciales. Esto no es el número de triángulos únicos de las mallas. No se afirma haber repetido las 128 variantes en este recorrido; sus contratos y los GLB sí se comprueban por captura. |
| Selección real | Cuatro pruebas correctas en Chromium: enduro/DH en escritorio y Pixel 7 emulado; carga de GLB publicados y selección de superficies pintadas. |
| Montajes autenticados | Cinco recorridos correctos: enduro y DH guardados/reabiertos, sustitución de frenos de dos/cuatro pistones, talla Nomad preservando piezas y Sender incompleta. Ejecutados mediante el runner que prepara cuentas/fixtures; eliminados al terminar. Una invocación directa inicial se omitió por falta de usuario temporal y no se contabiliza como aceptación. |
| Historial y publicación | Transiciones reales v5 → v6 y v6 → v7: dos montajes anteriores conservan IDs y se reabren/guardan; cuatro prearmadas nuevas se guardan con color de cuadro personalizado; SQL de perfiles, tipos de montaje, historia e inventario correcto. Cuentas temporales eliminadas. |
| Storage | 74 objetos verificados, lecturas públicas disponibles y escritura anónima rechazada con HTTP 403. Sin binarios provisionales no referenciados en los espacios revisados. GLB v5 y anteriores conservados. |

[Resultado de renderizado](assets/atlas-continuity-rendering.json), [validación estructural](assets/atlas-continuity-structure.json). Los informes no sustituyen la revisión visual ni certifican parecido.

## Referencias e inferencias

Se revisaron nuevos despieces oficiales del META, Nomad, Slash, Ransom y Enduro UDH, el despiece completo V5 de COMMENCAL y la presentación técnica/press kit del Sender. Los documentos históricos se usan para la arquitectura de la plataforma; no cambian la vigencia comercial ni el tallaje del catálogo. Cherry Bomb conserva una inferencia más amplia: no se encontró un despiece superior calibrado completo verificado. Las suspensiones conservan sus perfiles/fotos específicos y fuentes previas; sus cambios actuales son de continuidad, sin afirmar una nueva digitalización multivista integral de cada superficie.

No se afirma haber agotado Internet ni haber revisado nuevos vídeos completos. Las nuevas vistas de render no se confunden con nuevas fotografías del producto. Anchuras, espesores, cierres ocultos, gussets y algunas transiciones de montaje son aproximaciones propias documentadas. Mantener huecos funcionales y asimetrías; no se certifican resistencia, ausencia de colisión para cualquier combinación, compatibilidad mecánica, parecido del 90 % o CAD de fabricación.

## Capturas conservadas

[Enduro montada](assets/atlas-continuity-enduro.png), [descenso](assets/atlas-continuity-downhill.png), [Nomad](assets/atlas-continuity-nomad.png).

| Cuadro | Perspectiva opuesta | Inferior |
| --- | --- | --- |
| META SX V5 | [Reverso](assets/atlas-continuity-meta-opposite.png) | [Base](assets/atlas-continuity-meta-bottom.png) |
| Ransom | [Reverso](assets/atlas-continuity-ransom-opposite.png) | [Base](assets/atlas-continuity-ransom-bottom.png) |
| Slash | [Reverso](assets/atlas-continuity-slash-opposite.png) | [Base](assets/atlas-continuity-slash-bottom.png) |

La aceptación visual final por modelo y el rendimiento sostenido en Chrome/Brave Android físico siguen pendientes. Las pruebas Pixel 7 usan emulación y renderizado por software. La medición aislada siguiente incluye los GLB nuevos; no representa la carga completa de Auth/catálogo/Netlify.


## Rendimiento aislado de la versión final

Compilado de producción de la entrada de revisión, caché vacía, red simulada de 10 Mbps y 80 ms, Chromium 156 con ANGLE/SwiftShader, viewport Pixel 7 412×839. No hubo otra revisión de navegador concurrente durante la medición. Transferencia medida mediante CDP, incluyendo Storage entre orígenes. No mide la carga completa de Auth, catálogo ni Netlify.

| Disciplina | Primera imagen completa | Bytes transferidos | Triángulos enviados con sombras | Llamadas con sombras | Interacción observada |
| --- | ---: | ---: | ---: | ---: | ---: |
| Enduro | 4615 ms | 4 299 666 | 317 056 | 131 | 13,4 fps |
| Descenso | 5454 ms | 5 038 001 | 323 542 | 129 | 14,8 fps |

Ambas descargas permanecen por debajo de 10 MB. **Descenso supera el objetivo de primera imagen inferior a cinco segundos y la prueba por software no alcanza 30 fps**. No marcar aceptado el rendimiento. La descarga mayor corresponde al detalle añadido; las diferencias de fps con mediciones v5 de otra sesión no demuestran una mejora de velocidad. Falta optimizar/validar el coste y comprobar Chrome/Brave en Android físico antes de cerrar esa aceptación. No se eliminó geometría documentada ni se cambiaron medidas para ajustar el resultado.

[Medición original](assets/atlas-continuity-performance.json), [móvil enduro](assets/atlas-continuity-mobile-enduro.png) y [móvil descenso](assets/atlas-continuity-mobile-downhill.png). Reproducción: `node scripts/measure-scene.mjs --version=v7 --mobile`. La revisión interna no se incluye en el build público.
