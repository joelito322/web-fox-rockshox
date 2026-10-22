# 12t · SUPREME DH V5 completo v25

Solicitud individual para M/L desde sus dos capturas v11, conservando los otros catorce cuadros/28 capturas actuales. No modificación de fotos de cards, prearmadas, especificaciones, acabados o montajes históricos. Sin generador runtime, cambios de tablas ni campos comerciales nuevos.

## Fuentes contrastadas

Catorce ilustraciones descargadas de [COMMENCAL TECH V5](https://www.commencal.com/us/en/tech-supreme-dh-v5.html), tres fotografías oficiales (frameset lateral, diagonal y cuadro en taller) y cinco vídeos técnicos de la [presentación oficial V5](https://www.commencal.com/us/en/landing-supreme-dh-v5.html). [Archivo/URL/SHA](../../models/catalog-v25/references/sources.json). Se examinan las vistas de triángulo delantero, upper/lower link, pieza 6-bar, tirantes y vainas; los vídeos complementan la parte oculta y los puentes. No se usa XS ni V5.2 como geometría de M/L.

Vídeos descargados y realmente muestreados: cinemática1, cinemática2/despiece, bridge, stays y flipchip. Seis instantes por vídeo (30 imágenes en cinco hojas), con duraciones y tiempos en [video-review](../../models/catalog-v25/references/video-review.json). El muestreo permite contrastar apoyos y contrapartes; no demuestra la cinemática completa ni todas las posiciones posibles.

La superposición usa la ilustración lateral oficial de geometría 1452×928 conservada desde el conjunto aprobado, no una fotografía ortográfica ni un CAD calibrado. Registro heredado de BB/dirección/eje trasero, contrastado con foto diagonal. Las secciones en profundidad, radios, detalles ocultos y adaptación entre tallas siguen inferidos.

## Reconstrucción y correcciones

Superior y diagonal de trayectos propios, rectas largas y curvas locales; cuello corto, arco delantero de dos ramas convergentes y abertura triangular. Cuna con mejillas y pequeña ventana inferior inspirada en las vistas oblicuas, sin barras cilíndricas sueltas que sustituyan sus superficies. Tirantes/vainas emparejados, puentes localizados, punteras articuladas y cuerpos de apoyo. Soporte de freno y patilla en sus lados correctos.

HVCS exterior reconstruido: enlaces superior/inferior, elemento largo con ventana y apoyos de las contrapartes. Polea dentada unilateral, portapolea y guía propios; guardabarros sujeto por puente, protección inferior y de cadena. Las máscaras declaradas sustituyen el mecanismo/protecciones anteriores; las caras fuera de ellas se conservan. No confundir esta reconstrucción del exterior con seis cuerpos internos de fábrica ni cálculo exacto de palancas.

La comprobación extendida de BB detectó una pequeña invasión de la mejilla inferior en L, fuera de la primera comprobación de pintura: se corrigió la holgura del enlace antes de subir archivos. Se eliminaron fragmentos negros de la construcción anterior que quedaban separados de su cuerpo al cambiar la silueta. Pipa y pasos abiertos, sin superficies que sellen los ojos móviles con pintura fija.

Solo cambia `saddle` visual en las identidades nuevas, alineado al tramo final observado y con igual longitud desde `seat_tube`. Todos los demás anclajes, incluida la suspensión y sus 250 mm entre ojos (precisión numérica heredada), permanecen. [Correcciones exactas por ID](../../models/catalog-v25/anchor-corrections.json); SQL y publicador restringen expresamente la excepción. Los recursos v11 y sus marcadores no se alteran.

Fuentes y reproducción offline en [README v25](../../models/catalog-v25/README.md). El recorte de ventana es exclusivamente offline; el producto carga archivos GLB estáticos.

## Validación

- Tipos estrictos y build correctos; **313 pruebas en 61 archivos**, incluyendo diez propias de alcance/hash, conservación de contratos, rectas/contornos, aberturas de arco/cuna/barra y apoyos de ojos móviles. Se mantienen advertencias previas del bundle/dependencias.
- Dos GLB finitos con anclajes y pintura presentes; **cinco mallas por talla, 6.086.508 bytes totales**. [Inspección](../../models/catalog-v25/inspection.json).
- **28 SHA ajenos intactos**, triángulos mecánicos conservados fuera de las dos máscaras de sustitución; una malla antigua íntegramente dentro de las máscaras se reconstruye, no se declara preservada. [Conservación](../../models/catalog-v25/preservation.json).
- **14 vistas generales**, diez primeros planos de dirección y dos superposiciones de referencia de geometría; ambas caras, superior e inferior, con revisión del montaje completo.
- **22 rayos axiales despejados**, más **50 rayos completos de BB** entre z=±0,15 m sobre todas las mallas, centro/anillos de 6/12/18 mm. Eje de tija alineado en M/L. [Pasos](../../models/catalog-v25/bore-review.json), [envolvente completa](../../models/catalog-v25/passage-review.json).
- Tres poses integradas (reposo/50/100), sin errores del navegador, con GLB local congelado servido por interceptación explícita del runner antes de subir. Conserva la guía reducida histórica HVCS; no certifica recorrido comercial completo, contactos exhaustivos o cinemática exacta. [Articulación](../../models/catalog-v25/motion-review.json).

## Publicación

Dos GLB cargados y releídos por SHA; SQL individual aplicado tras v24, transición de dos montajes anteriores y dos nuevos comprobada, cuenta temporal eliminada. Evidencia en [transition](../../models/catalog-v25/transition.json) y [cloud-after](../../models/catalog-v25/cloud-after.json). Estado tras publicar: **70 modelos, 146 elecciones, 772 variantes/770 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias.

Reposición después de v24: `prepare-frame-v25.mjs --apply` → `publish-frame-v25.mjs --apply`; fuente SQL `supabase/operations/publish-frame-v25.sql`. Auditoría de lectura vigente `validate-frame-v25.mjs`; anteriores describen snapshots históricos. Guardados y prearmadas no se convierten: seleccionar de nuevo SUPREME usa v25. Fotografías reales conservadas.

No certificar identidad CAD del 100 %, soldaduras/ajuste mecánico exactos, ausencia exhaustiva de colisiones, cinemática de seis barras completa ni FPS/Android físico. Nuevas correcciones físicas requieren otra identidad; no mutar bytes publicados. Sin commits salvo solicitud explícita.
