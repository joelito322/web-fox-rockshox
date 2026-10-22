# 12w · Paredes exteriores TUES · v29

El usuario aprueba la forma v28 y detecta paredes aparentemente transparentes al girar. Conservar la silueta aprobada: corrección exclusiva de orientación de caras y normales, sin cambiar puntos/anclajes/medidas/material a transparencia/doble cara global.

Diagnóstico de lectura GLB: en cuatro regiones, rayos FrontSide atraviesan la pared próxima y golpean la opuesta; DoubleSide encuentra la próxima. El cambio de imagenY descendente a mundoY ascendente refleja coordenadas; la extrusión mantuvo orden de triángulos anterior. Es inversión de caras, no falta deliberada de opacidad.

Plan: nueva identidadv29, invertir el orden de triángulos derivados de extrusión antes de normales/recortes. Mantener exactos anclajes de v28 y las otras28 capturas. Validar FrontSide de ambas caras, distancias de superficie DoubleSide antes/después,54 puntos fotográficos, giros/vistas, pasos de montaje y postura; pruebas/tipos/build, cargar/releerSHA, transición anterior/nueva y auditoría remota. Recursosv28 inmutables. Sin commits.

## Corrección y evidencia local

Nueva identidadv29 conserva el conjunto de contornosv28 aprobado, todos los anclajes exactos y las especificaciones/acabados. `solid()` invierte el orden de triángulos después de reflejar coordenadas y antes de calcular normales/cortar pasos. No se invierten camisas/cilindros correctos ni se activa DoubleSide global para disimular el fallo. Materiales de las paredes siguen opacos con depthWrite.

- **96 rayos de seis regiones y ocho direcciones por talla**: antes96 paredes próximas descartadas; después0. FrontSide y DoubleSide encuentran la misma pared externa en v29. Máximo cambio de distancia de superficie muestreada≈3,31×10⁻¹⁰m y límites iguales dentro de1µm numérico. [Comparación](../../models/catalog-v29/sides-review.json).
- **54 muestras fotográficas por talla** conservadas y pruebas nuevas FrontSide desde ambas caras. La validación únicamente DoubleSide anterior no detectaba orientación invertida; la nueva regresión comprueba la pared próxima, sin confundir esto con certificado de mallaCAD.
- **14 vistas generales** y tres poses de montaje sin errores, ambos lados opacos. **22 rayos axiales/50 completos BB libres**, eje de tija alineado, mallas/anclajes/pintura presentes y finitos; **28 SHA ajenos intactos**. JSON de general/movimiento/pasos/conservación en models/catalog-v29.
- Dos GLB/cinco mallas por talla, **4.252.892bytes**. Tipos estrictos/build y **355 pruebas en67 archivos** correctos. Advertencias anteriores de tamaño/dependencias permanecen. El primer chequeo estricto offline detectó tipado unknown en el bucle de marcadores; se añadió tipo explícito sin cambiar geometría y pasó.
- Manifiesto completo idéntico al anterior exigido por SQL/publicador; contrato antes/después sin claves cambiadas. Dos nuevos IDs reutilizan la curva de inspección v28 mediante asociación de recursos, conservando todos los históricos.

## Publicación

GLB cargados y releídos porSHA. SQL individual aplicado después de v28, dos montajes anteriores/dos nuevos comprobados y cuenta temporal eliminada. [Transición](../../models/catalog-v29/transition.json), [auditoría posterior](../../models/catalog-v29/cloud-after.json). Estado: **70 modelos,146 elecciones,780 variantes/778 recursos históricos**, cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias.

Reposición tras v28: `prepare-frame-v29.mjs --apply` → `publish-frame-v29.mjs --apply`, SQL fuente `supabase/operations/publish-frame-v29.sql`; auditoría vigente de lectura `validate-frame-v29.mjs`. Guardados históricos conservan su versión: volver a seleccionar el cuadro usa v29. Sin commits. Fuentes/reproducción en [README v29](../../models/catalog-v29/README.md). El diseño aprobado se conserva; esta corrección no modifica fotografías ni prearmadas y no certifica CAD/cinemática/colisiones exhaustivas/Android físico.
