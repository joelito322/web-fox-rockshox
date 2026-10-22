# 12k · CHERRY BOMB 29 completo v16

El usuario aprobó la dirección del CAPRA y solicita el mismo rigor para CHERRY BOMB 29. Esta autorización levanta únicamente la protección anterior de las dos variantes CHERRY v11; CAPRA y los otros trece cuadros permanecen intactos. Se conservan tallas reales 17″/19″, anclajes, acabados y especificaciones.

## Referencias y reconstrucción

Tres agentes revisaron foto lateral, fotografía negra de cara opuesta y página del catálogo oficial con perspectivas frontal/trasera diagonales. Descargas, hashes y perspectivas realmente inspeccionadas en [references/sources.json](../../models/catalog-v16/references/sources.json); revisión cruzada en [adversarial-review.md](../../models/catalog-v16/adversarial-review.md).

Se reconstruyen miembros completos de pintura, con superior y diagonal centrales rectos, asiento curvado genuino, codos hidroformados específicos y yugo inferior abierto. El helper inmutable v15 controla secciones lineales y redondeos locales, sin imponer la silueta CAPRA. Las dos placas negras reciben su pequeño hueco triangular observado; protecciones y tornillería conservan sus geometrías. La pipa tiene conicidad exterior estimada con radio de 35 mm abajo y 30 mm arriba, manteniendo el eje e interior visual previo. No se atribuyen esas inferencias a cotas de fabricación.

La comparación por foto registrada detectó el superior alto por un override de extremo; se retiró y se afinó el centro de sus contornos. La llegada al sillín se revisó conectada en ambas tallas. Las geometrías intermedias no se publicaron. Todo el trabajo es offline, sin CSG ni generador nuevo en runtime. Constructor/perfil en [catalog-v16](../../models/catalog-v16/README.md).

## Evidencia local

- Dos GLB, 4.236.504 bytes, frente a 5.171.564 bytes v11. Posiciones/normales finitas; cuatro mallas por talla, pintura/anclajes correctos.
- Catorce vistas generales, diez primeros planos y dos superposiciones ortográficas por tres landmarks. Revisión de ambas caras, frente, superior/inferior y diagonales. Foto en perspectiva y cambio de talla impiden interpretar la superposición como validación dimensional.
- Veintidós rayos en dirección/sillín/pedalier: cero obstrucciones antes/después. El balancín recibe prueba de abertura y apoyos, con el anterior macizo como control negativo; se conserva la curva del sillín mediante regresión específica.
- Veintiocho recursos de cuadros ajenos conservan SHA, incluyendo CAPRA v15. Dos mallas de guardas/tornillería por talla mantienen sus posiciones. Pintura y balancín se reconstruyen, no se afirma conservar sus vértices. Diferencia máxima entre envolventes: 5,06 mm, sin significado de tolerancia física.
- Build y TypeScript estricto de herramientas correctos. 224 pruebas en 51 archivos correctas con dos workers. Un ensayo inicial detectó un ArrayBuffer de otra realm al cargar el control negativo en jsdom; el test se corrigió creando el buffer en su propia realm. La ejecución se limita a dos workers para evitar contención de CPU de las pruebas geométricas históricas.

Fuentes/evidencias en `models/catalog-v16/`: `profile.json`, `frames.ts`, `publication.test.ts`, `uploads.json`, `protected-captures.json`, `preservation.json`, `inspection.json`, `bore-review.json`, `general-review.json`, `detail-review.json`, `overlay-review.json`, `adversarial-review.md` y `references/`.

## Integración

Dos recursos cargados y releídos por SHA; CHERRY articulado en reposo/50/100 %, tres capturas y posturas diferentes sin errores de página. Publicación SQL aplicada exclusivamente a dos sucesoras CHERRY; no se reescriben prearmadas ni montajes privados.

Transición con cuenta normal temporal: dos montajes CHERRY v11 guardados antes de publicar conservan sus identidades y se vuelven a guardar; dos montajes v16 nuevos guardados. Cuenta y montajes temporales eliminados. Evidencias `transition.json`, `motion-review.json` y `validation.json`. Auditoría final de solo lectura: las doce comprobaciones pasan; `cloud-before.json` y `cloud-after.json` registran historial, contratos y elecciones ajenas conservadas.

Estado: **70 modelos, 146 elecciones, 754 variantes/752 recursos históricos, cuatro prearmadas y 92 posiciones**; mismas 22 migraciones y doce tablas propias, sin cambio de Auth/IAM/Edge Functions. Reposición tras v15 mediante preparación/carga y publicación v16; no usar el publicador visual general. Los guardados anteriores mantienen su versión: seleccionar de nuevo el cuadro incorpora la corrección.

No se certifica CAD, parecido del 100 %, profundidades/cavidades mecánicas exactas, colisiones exhaustivas, Android físico ni FPS. Aceptación visual del usuario abierta; sin commits.
