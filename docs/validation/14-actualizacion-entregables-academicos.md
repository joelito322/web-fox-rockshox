# 14 · Actualización de entregables académicos

Fecha: 28/10/2026. Estado: actualización implementada, comprobación técnica realizada y revisión del usuario pendiente. La autorización cubre documentación y capturas; no commits, push ni despliegue.

## Alcance conservado y actualizado

| Entregable | Fuentes y salida | Formato conservado |
| --- | --- | --- |
| Informe | `entregables/02_Informe_Tecnico/informe.tex` y `.pdf` | Carta, Liberation Serif 12, doble espacio, estructura académica, Gantt horizontal y referencias |
| Manual | `entregables/03_Manual_Usuario/manual.tex` y `.pdf` | Mismas fuentes y formato; instrucciones por tareas, tablas y capturas reales |
| Presentación | `entregables/04_Presentacion/presentacion.tex` y `.pdf` | Doce láminas 16:9, DM Sans/Barlow, notas, transiciones, foto acreditada e iconos Lucide |
| Acceso al aula | `entregables/Acceso_Aula_Virtual.tex` y `.pdf` | Una página A4 con enlaces |

La fecha de portada solicitada, 21/10/2026, se mantiene. La revisión funcional del 28/10 se declara aparte. La presentación aplica la identidad Cumbre aprobada y paleta cálida, sin alterar su estructura ni inventar un nuevo logo.

Se actualizan problema, objetivos, alcance, requisitos, arquitectura, datos, implementación, validación, conclusiones y procedimientos para reflejar la tienda propia de componentes enduro/DH: ofertas por SKU en PEN, condición nueva/usada, promociones, carrito persistente, revisión comercial, armado opcional, cotizaciones versionadas, pedidos y seguimiento. Se conserva la separación entre representación visual y producto vendible. Precio y stock iniciales no equivalen a cotizaciones verificadas o existencias físicas.

El armado aplica una tarifa inicial de S/150, editable para nuevas solicitudes. Requiere montaje guardado coincidente y revisión; el administrador puede exonerarlo al publicar la cotización. El cliente recibe un aviso persistente y revisa el total antes del pedido. Yape, Plin, bancos y tarjeta son métodos simulados, sin QR/cuentas receptoras reales ni cobros.

Las alternativas desde conflictos documentados reutilizan reglas puras: datos presentes, aviso resuelto, sin nuevos conflictos o desconocidos. Sustituyen una posición, conservan confirmación del cuadro, deshacer y guardado; abrir la lista no descarga GLB. No equivalen a certificación mecánica.

## Evidencia y reproducción

```text
Código local + Supabase Cloud
          |
          v
Cuentas y solicitudes efímeras -> capturas reales -> limpieza comprobada
          |                           |
          |                           v
          |                  recursos usados por LaTeX (Git)
          v                           |
models/local/validation/              v
 resultados/logs (ignorado)       PDF recompilados
```

- `pnpm check`: build correcto y 564 pruebas correctas, dos omitidas en 83 archivos (82 correctos, uno omitido). Los conteos de ejecuciones distintas no se suman como casos únicos.
- `capture-report-evidence.mjs`: trece comprobaciones, incluidas persistencia, aislamiento entre dos cuentas y rechazo de revisión obsoleta.
- `capture-manual-evidence.mjs`: trece comprobaciones; formularios, comparación, grupos, pares, guardado/gestión y móvil emulado.
- `capture-commercial-evidence.mjs`: siete capturas de alternativas, añadido, carrito, método de pago, resumen, cotización exonerada y aviso. Solo utiliza registros propios de práctica; no crea pedidos ni consume stock o modifica catálogo/precios.
- `capture-slide-views.mjs`: dos vistas reales del visor, sin guardar ni alterar catálogo.
- `validate-commerce-state.mjs`: 24 tablas propias, 41 migraciones, 70 modelos, 782 variantes, 780 recursos, cuatro prearmadas, 140 ofertas/689 vínculos; cero fixtures y cero pedidos fuera de modo simulado. Doce tablas comerciales protegidas con RLS.

Los cuatro scripts admiten `ATLAS_EVIDENCE_ORIGIN`; por defecto usan `http://127.0.0.1:5174`. Las credenciales permanecen en `.env`, nunca en los entregables. Compilar con `tectonic --keep-logs <archivo>.tex` dentro de cada carpeta; no requiere credenciales de aplicación. Fuentes tipográficas locales conservadas.

Validación documental: informe de 57 páginas, manual de 61 con 21 capturas/cinco ejercicios, presentación de doce y acceso de una. Compilación de los cuatro documentos, referencias e imágenes resueltas, revisión visual de páginas y todas las láminas, texto visible dentro del área de página (incluida la rotación del Gantt). Los avisos de composición `Underfull` no se presentan como errores funcionales. Evidencia detallada en `models/local/validation/entregables/`; resúmenes legibles y procedencia junto a los documentos.

Las instantáneas `catalogo-resumen.json` y `validacion-publica.json` del informe se conservan como evidencia histórica del 21/10. El inventario GLB versionado registra 318 archivos finales (89 actuales y 229 históricos); no se afirma una auditoría nueva de todos los objetos de Storage.

## Límites de esta actualización

La publicación previa en Netlify no se declara actualizada: la demostración de esta revisión es local con backend Cloud. Actualizar PDF no publica el código ni archivos remotos. No se certifican entrega SMTP, Android físico/FPS, precisión CAD, ventas/cobros reales, satisfacción o rentabilidad. Los flujos de Google conservan su confirmación manual histórica; crear cuentas temporales por API no la sustituye.

Los ZIP y el guion de ensayo siguen locales según `.gitignore`; se actualiza el guion para las doce láminas. No se incluyen resultados/capturas de investigación ajenos a los recursos usados en documentos. Se conservó una copia local del PDF del manual que ya tenía cambios antes de esta tarea; su texto extraído coincidía con el anterior, y el PDF actualizado se recompila desde la fuente vigente.

## Comiteo solicitado posteriormente

El usuario autorizó explícitamente comitear por partes después de la actualización. Grupos: `bb96aea` herramientas de captura, `a9e9eac` informe, `4bfca83` manual, `e78227b` presentación e índice de aula en commit independiente. La documentación de seguimiento se agrupa aparte. Se conservaron fuentes LaTeX, PDF y recursos usados; resultados locales y secretos excluidos. Comprobaciones documentales y sintaxis de los cuatro scripts correctas antes del comiteo. Sin push ni despliegue; los siguientes cambios requieren una nueva petición para comitear.

## Revisiones posteriores solicitadas por el usuario

Comiteo posterior expresamente solicitado: `ff3d9a7` auxiliares vendibles, `e482666` herramienta de capturas, `02d7d75` manual orientado al usuario, `e9b45b0` informe APA/cronograma, `246aa1c` presentación y `1b8836c` título académico del docente. Documentación de seguimiento en un séptimo commit. Sintaxis de dos scripts, dos JSON y diferencias sin errores de espacios comprobadas; fuente/PDF agrupados, evidencias brutas ignoradas. Sin push ni despliegue remoto, ni nuevas operaciones sobre Cloud para esta petición.

Revisión de formato APA 7 del informe: fuente/PDF de 56 páginas con Times New Roman de 12 puntos incrustada (alternativa local Liberation Serif al recompilar sin esa fuente), márgenes de 2,54 cm, cuerpo/notas/referencias a doble espacio, sangría inicial/francesa de 1,27 cm según corresponda y jerarquía de encabezados sin numeración. Índices separados; apéndices en página nueva con tablas A1–A3/B1/C1. Celdas e interior de diagramas conservan las excepciones de espaciado permitidas. Compilación sin Overfull, caracteres ausentes o referencias indefinidas; 14 claves citadas y 14 referencias. Revisión de coordenadas y páginas renderizadas, con rotación del Gantt considerada. Fuentes oficiales/criterios en `entregables/02_Informe_Tecnico/recursos/formato-apa7.txt`; evidencia bruta local ignorada. La portada conserva 21/10 y Mg. Fidel Huanco Ramos; no se certifica una rúbrica institucional no proporcionada. No modifica los resultados históricos de pruebas funcionales ni autoriza commits.

El manual se orientó exclusivamente al usuario: portada sin universidad o curso, retirada de comentarios técnicos de validación/procedencia del PDF y ejercicios repetidos;34 figuras, incluidas13 vistas amplias con tablas de campos. Fuente/PDF actuales:63 páginas. Procedencia y reproducción quedan en sus recursos externos, no en instrucciones de uso.

El cronograma del informe y de la lámina5 se amplió a cuatro semanas,30/09–27/10. Tabla y Gantt incluyen28 actividades técnicas/comerciales y tres hitos: catálogo,3D/suspensión, montajes, administración, compatibilidad, ofertas/carrito, armado/cotizaciones, pedidos/reservas, pagos simulados/avisos y pruebas. Es reconstrucción del alcance completo, no evidencia de que se planificara así desde el inicio; las revisiones del28 conservan su fecha real. Informe57 páginas, presentación12láminas16:9; compilación y límites de texto comprobados.

Precios pendientes resueltos por petición posterior: cinco genéricos ATLAS vendibles, seis SKU y stock de ejemplo editable. Migración042 aplicada;146 ofertas/695 vínculos. Evidencia en13i. Se actualizan los conteos vigentes en el informe y las diapositivas; los snapshots anteriores conservan su fecha. Sin commits ni push.

Precedencias revisadas por petición del usuario:28 actividades/54 relaciones fin–inicio, duraciones inclusivas y fechas de las28 barras comprobadas desde el TEX; los11 grupos de la diapositiva coinciden con sus actividades. Plan/diseño cerrado04/10, migraciones05/10, integración completa24/10, pruebas integrales/comerciales25/10, corrección/preparación26/10 y revalidación27/10. C1 solo prueba incrementos disponibles; los solapamientos no equivalen a trabajadores adicionales. Docente identificado como Mg. Fidel Huanco Ramos en informe, presentación y hoja de acceso; el manual conserva su portada de producto. Fuentes/PDF actualizados sin commits ni push.
