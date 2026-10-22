# 12f · Continuación: pasos de montaje v11

Segunda revisión de los quince cuadros, posterior a [v10](12e-evidencia-cuadros-v10.md). El problema detectado es concreto: las envolventes exteriores atraviesan en algunos puntos las aberturas de dirección, collar de sillín y pedalier. No se sustituyen cotas comerciales ni se reconstruyen mecanismos interiores completos.

## Corrección

Se parte de los treinta GLB v10 congelados. Un recorte geométrico offline abre cilindros finitos y conserva normales/UV por interpolación. La dirección recibe una cara interior continua orientada hacia el hueco y agrupada con la pintura existente. No se modifica el constructor v10, no se cambian anclajes, colores, especificaciones o materiales ni se añade CSG al configurador. Fuentes y alcance en [models/catalog-v11](../../models/catalog-v11/README.md).

Los radios y profundidades son holguras de representación, no especificaciones del fabricante. El paso del collar cubre 27 mm hacia dentro; no certifica la inserción completa de una tija. Las fuentes multivista y la separación entre observación/inferencia siguen siendo las de [v10](../../models/catalog-v10/references.md); no se atribuye nueva investigación audiovisual a este ajuste.

## Verificaciones locales ejecutadas

- Tres rayos por paso, tres pasos y treinta tallas: 270 pruebas de paso axial sobre triángulos, a dos caras. Comparar antes/después y registrar límites de envolvente. No equivale a una prueba volumétrica exhaustiva ni de mecanizado.
- Exportaciones finitas, pintura, anclajes y hashes inmutables de v10; treinta GLB nuevos y coordenadas conservadas.
- Siete vistas por talla y tres primeros planos por modelo. Se revisan las aberturas desde su eje para detectar tapas o bordes internos; no basta con la vista lateral.
- Quince bicicletas montadas con inspección de suspensión y guardado/reapertura. Transición con cuenta temporal normal y limpieza.
- Publicación acotada de cuadros mediante fuente SQL versionada; conservar todos los modelos y elecciones de otras categorías.

Resultados locales: 30 GLB, 210 vistas generales y 45 primeros planos. Los 270 rayos de prueba pasan sin intersección dentro de los corredores previstos; antes de corregirlos, 196 encontraban superficies. Diferencia máxima entre límites de envolvente: 0,00000001964 m, atribuible a representación numérica. No se interpreta como tolerancia física. Coordenadas y normales finitas; pintura y anclajes válidos; cuatro o cinco mallas por archivo.

Total de los treinta GLB: 50.794.832 bytes, frente a 49.503.140 en v10 (2,6 % más). El código de recorte es offline y queda fuera del build de producto. Build correcto y 149 pruebas/42 archivos correctos; TypeScript estricto adicional del constructor y las herramientas internas. Las fuentes de v10 y sus hashes permanecen intactos.

## Publicación y conservación

Treinta recursos v11 subidos y releídos por SHA-256; cuatro prearmadas actualizadas en la misma transacción que retira las treinta elecciones v10. Recursos, especificaciones y manifiestos anteriores intactos. Auditoría de lectura `validate-frame-v11.mjs`: todas las comprobaciones correctas. Estado vigente: **70 modelos, 146 elecciones, 698 variantes/696 recursos históricos, cuatro prearmadas y 92 posiciones**; sin migraciones ni tablas nuevas.

Transición con cuenta normal temporal: quince montajes v10 guardados antes de publicar conservan IDs y se vuelven a guardar después; treinta montajes v11 y cuatro ejemplos completos guardados. Cuenta y montajes temporales eliminados. Evidencias `uploads.json`, `cloud-before.json`, `cloud-after.json` y `transition.json`.

Las bicicletas guardadas conservan su versión anterior; elegir de nuevo el cuadro utiliza la versión nueva. No se reemplazan sus referencias en segundo plano. Sin commits salvo nueva solicitud explícita; sin certificación CAD, 90 %, contactos exhaustivos, Android físico o 30 fps.

## Integración final

Quince bicicletas montadas revisadas en reposo/50/100 %, 45 capturas y posturas diferentes, sin errores de página. Cuatro pruebas de navegador correctas: reproducción/restauración de recursos y guardado autenticado con reapertura, en escritorio y Pixel 7 emulado. Las cuentas e imágenes temporales se eliminaron con el runner existente. No se afirma una prueba física de Chrome/Brave Android ni una medición de FPS.

La revisión geométrica detectó bordes de intersección visibles dentro de la dirección en una captura intermedia. Se corrigieron con la cara interior continua y se repitieron rayos, primeros planos y vistas antes de cargar/publicar; no se modificaron recursos v11 después de publicarlos. La primera ejecución del inspector también detectó una referencia del fixture a los metadatos v10: se corrigió a la fuente v11 y se repitió la inspección de las treinta exportaciones.

Implementación y publicación de este ajuste completas; la aceptación estética final del usuario y la fidelidad mecánica exacta siguen abiertas. No se ha certificado una cavidad interna completa del sillín ni contactos/colisiones exhaustivos. Sin commits.
