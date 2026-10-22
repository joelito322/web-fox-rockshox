# 12i · CAPRA MK3 Carbon MX: unión delantera v14

Corrección individual solicitada después de v13. Solo las dos tallas del CAPRA cambian; las otras veintiocho elecciones de cuadro se conservan. El usuario pidió acercar ambos tubos únicamente al llegar a la pipa y quitar la curvatura genérica de la diagonal inmediata.

## Cambio y referencia

Método y fuentes en [catalog-v14](../../models/catalog-v14/README.md). La lateral oficial MK3 MX muestra la diagonal principal recta y el cierre de la ventana hacia la dirección. Se reutilizan los trazados de esa generación; no se intercambian formas de otros cuadros. No se afirma haber inspeccionado nuevos vídeos ni cotas de fábrica.

Las raíces nuevas se recortan offline a 160 mm del eje de dirección, con 70 mm de extensión axial y 0,2 mm de solape. El polígono de corte alcanza 160,9 mm. El perfil previo se sigue desde 200 hasta 140 mm; después el tubo inferior usa un tramo recto y el superior un empalme suave. Las llegadas pasan de 74/26 % a 67/43 % de la longitud de pipa, sin cambiar su eje, camisa ni anclajes. Proporciones estimadas, no ingeniería de fabricación. No se estrecha el resto del cuadro ni se reconstruye la diagonal completa.

## Evidencia local

- Dos GLB nuevos, 2.055.592 bytes; coordenadas/normales finitas, cinco mallas por talla, pintura y anclajes conservados.
- Catorce vistas generales y diez primeros planos: ambas tallas, caras, frente, superior/inferior y diagonales. La primera prueba local producía un codo demasiado corto; se corrigió el empalme antes de cargar recursos. Ninguna captura intermedia fue publicada.
- Veintidós rayos de dirección/sillín/pedalier: cero obstrucciones antes/después. No prueba ajuste de rodamientos ni una cavidad mecánica completa.
- Conservación del cuerpo fuera de la zona declarada: cero vértices faltantes a la tolerancia numérica de 1 µm, mismos límites de envolvente. Veintiocho recursos de los otros catorce cuadros conservan sus hashes. Simetría de ambas raíces en ambas tallas.
- Build y TypeScript estricto de herramientas correctos; 179 pruebas en 45 archivos. Dos pruebas antiguas de geometría agotaron sus cinco segundos durante una ejecución concurrente con compilaciones; la ejecución final completa y sin esa concurrencia pasa.

Fuentes/evidencia: `predecessors.json`, `uploads.json`, `protected-captures.json`, `preservation.json`, `inspection.json`, `bore-review.json`, `general-review.json`, `detail-review.json` y `publication.test.ts`, en `models/catalog-v14/`.

## Integración y publicación

Dos GLB cargados y releídos por SHA-256; montaje CAPRA revisado en reposo/50/100 %, tres capturas y posturas distintas sin errores de página. Publicación acotada aplicada mediante `supabase/operations/publish-frame-v14.sql`: solo se retiran las dos elecciones predecesoras del CAPRA. Los catorce cuadros ajenos, prearmadas y montajes privados permanecen intactos.

Transición con cuenta normal temporal: dos montajes CAPRA v13 guardados antes de publicar conservan sus identidades y se vuelven a guardar después; dos montajes nuevos v14 guardados correctamente. Cuenta y montajes temporales eliminados. Evidencia en `transition.json`, `motion-review.json` y `validation.json`. Auditoría final de solo lectura: las doce comprobaciones pasan; `cloud-before.json` y `cloud-after.json` registran la conservación del historial y de las elecciones ajenas.

Estado: **70 modelos, 146 elecciones, 750 variantes/748 recursos históricos, cuatro prearmadas y 92 posiciones**; sin migraciones, tablas o cambios de Auth/IAM/Edge Functions. Los montajes antiguos conservan su versión: seleccionar de nuevo el CAPRA para usar la corrección. Las geometrías publicadas son inmutables.

No se certifica CAD, porcentaje de parecido, colisiones exhaustivas, Android físico ni FPS. Aceptación visual del usuario pendiente; sin commits.
