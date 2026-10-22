# 12v · TUES MK4 Carbon · auditoría adversarial y reconstrucción v28

Solicitud: revalidar con múltiples agentes tras el rechazo de parecido de v27. Tres revisiones independientes encuentran trayectoria superior incorrecta, referencia de pipa sobre la barra FOX40, registro afín deformante y tubos redondeados estrechos frente a caras moldeadas. Las pruebas anteriores no demostraban semejanza. V26/v27 quedan snapshots históricos, sin alterar sus bytes.

## Plan de corrección y aceptación

1. Tres agentes contrastan silueta, estructura y registro; propuestas/fuentes por archivo en models/catalog-v28. Base2300×1400 normalizada porancho2048, alto1246,6087, sin confundir pixeles nativos. No reutilizar headtop falso.
2. Contornos de caras exteriores/interiores, cuerpos frontales integrados y cuatro cuerpos articulados diferenciados. Registro por similitud, sin cizalla; corregir estimaciones de anclaje en nueva identidad con contrato porUUID. Mantener250mm entreojos, campos comerciales e histórico. Los anclajes fotográficos/ocultos siguen estimados, no CAD.
3. Comparar contra54 puntos independientes de fotografía en seis regiones, con puntos dentro y fuera. Registrar fallos de v27 bajo ambos registros para distinguir geometría y ubicación; no cambiar el criterio para hacer pasar el modelo. Revisar máscaras de oclusión explícitas.
4. Revisar lateral, opuesta, superior/inferior, diagonales, dirección y montajes; revisión cruzada de agentes antes de publicar. Corregir todas las discrepancias concretas observadas. Pruebas geométricas/pasos/hash y contratos no sustituyen revisión del parecido.
5. Tipos/build/pruebas, carga/relectura SHA, SQLindividual, transición de dos anteriores/dos nuevas y auditoría de catálogo. Preservar28capturas ajenas, fotografías reales, prearmadas y privados. No commits.

## Evidencia local y revisión adversarial

Fuentes y reproducción en [README v28](../../models/catalog-v28/README.md). Propuestas de tres agentes, correcciones y resultados finales en [adversarial-review](../../models/catalog-v28/adversarial-review.json). Los agentes rechazaron borradores demasiado anchos, caras plegadas y muelle atravesando la bieleta, además de corregir una hipótesis errónea sobre el cuerpo del ojo inferior. Se modificaron geometrías/registro, sin relajar los criterios para aprobarlas.

- **54/54 puntos independientes por talla**, incluyendo dentro/fuera del superior, diagonal, Y, tirante, vaina y ventana; v27 falla20/21 bajo registro correcto o15/14 bajo registro antiguo M/L. [Resultados](../../models/catalog-v28/contour-review.json). No son un porcentaje de parecido global.
- **14 vistas**, diez acercamientos y dos superposiciones por la referencia registrada; ambas caras y superior/inferior. Tres poses integradas sin errores del navegador. Tras ampliar la separación transversal de Flip Link, los agentes confirmaron cara maciza y muelle detrás en reposo/mitad/final.
- **22 rayos axiales y50 completos de BB** libres en todas las mallas, eje de tija alineado; anclajes/mallas/pintura finitos. El valor anterior de obstrucciones se mide en los ejes nuevos y es diagnóstico, no comparación mecánica ortográfica.
- **28 SHA ajenos intactos**; los detalles del TUES se reconstruyen expresamente, no se declara conservación de sus triángulos. Dos GLB/cinco mallas por talla, **4.252.748 bytes totales**.
- Tipos estrictos y build correctos; **341 pruebas en65 archivos**. Tras la última limpieza de contorno se repitieron las12 pruebas específicas, los puntos fotográficos y las comprobaciones GLB/pasos. El primer build detectó una variable sin uso en la nueva prueba; se corrigió y pasó. Persisten advertencias previas de dependencias/tamaño de bundle.

### Correcciones de superficies y límites

Las normales de biseles se calculan en milímetros para evitar la cuantización de1cm de la utilidadThree sobre un modelo en metros. Caras principales con normal plana y profundidad afín sin límite no lineal: elimina los abanicos diagonales. Closing de concavidades7px/simplificación0,8px y bisel adaptativo eliminan puntas geométricas observadas al ampliar la dirección. La revisión final confirma su desaparición; queda una pequeña esquina en la transición estimada de pipa, no un blend CAD de fábrica.

Registro nuevo sin cizalla; ocho anclajes visuales estimados corregidos con contratos completos antes/después porUUID. El eje trasero, los250mm entre ojos y110mm de pipa heredados se conservan; no cambian las especificaciones comerciales. Collar centrado en el corte blanco real; referencia anterior era un borde. Pipa parcialmente oculta, profundidades, radios y talla de la fotografía siguen estimados. No certificar100%dimensional.

Perfil de movimiento nuevo solo para dos recursosv28, sin alterar históricos: similitud y pivote oculto887/790 inferido, lower-eye en entrada y límite0,09rad. La guía eleva la rueda y comprime el amortiguador de forma conservadora; no representa200mm completos ni palancas exactas. No se certifican colisiones exhaustivas niAndroid físico/FPS.

## Publicación

Dos GLB cargados y releídos por SHA; SQL individual aplicado después de v27. Dos montajes anteriores y dos nuevos guardados/reabiertos, cuenta temporal eliminada. [Transición](../../models/catalog-v28/transition.json), [auditoría posterior](../../models/catalog-v28/cloud-after.json). Estado tras publicar: **70 modelos,146 elecciones,778 variantes/776 recursos históricos**, cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias. No cambian fotografías, privados anteriores ni prearmadas.

Reposición después de v27: `prepare-frame-v28.mjs --apply` → `publish-frame-v28.mjs --apply`; SQL en `supabase/operations/publish-frame-v28.sql`, contratos porUUID en `anchor-corrections.json`. Auditoría vigente de lectura `validate-frame-v28.mjs`; las anteriores describen snapshots históricos. Perfil de movimiento seleccionado por recursos nuevos, anteriores preservados. Guardados no se convierten; volver a seleccionar TUES aplica v28. Recursos inmutables, sin commits.
