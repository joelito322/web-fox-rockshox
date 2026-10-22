# 12j · CAPRA completo v15: rectas y desvíos locales

El usuario confirmó que v14 conservaba curvas innecesarias en todo el trayecto. La corrección anterior era insuficiente: solo cambiaba la zona delantera y dejaba el cuerpo suavizado v10. Se reconstruyen ahora los miembros completos del CAPRA MK3 Carbon MX, en M/L, según la referencia de su generación; no se modifica ningún otro cuadro.

## Revisión adversarial y método

Tres agentes revisaron referencias, código y capturas; la revisión cruzada confirmó Catmull global, controles desplazados y anchura sinusoidal como causas. El primer prototipo completo se comparó en ambas caras y con la foto lateral registrada. Esa revisión corrigió soporte del amortiguador, radios locales y posición del superior/diagonal antes de cargar. Fuentes, decisiones y límites en [catalog-v15](../../models/catalog-v15/README.md) y [revisión cruzada](../../models/catalog-v15/adversarial-review.md).

`path.ts` genera segmentos lineales con secciones lineales por distancia. Solo los desvíos declarados tienen radios cortos; sus tangentes se calculan analíticamente. Se conservan superficies transversales redondeadas/facetadas, sin aplicar curvas longitudinales en tramos rectos. La semialtura del superior y la diagonal se contrasta con zonas limpias de la fotografía; los espesores/volúmenes ocultos siguen estimados. El soporte frontal se proyecta sobre el segmento real de la diagonal. Los dos ojos del amortiguador y demás anclajes, acabados, generación y medidas comerciales no cambian.

Las bieletas/herrajes no pintables se conservan del GLB v14. El refuerzo de ventana mantiene su lado específico; la rotulación se coloca sobre la nueva diagonal. Todo el cálculo es offline, sin nuevo generador runtime ni CSG en el configurador.

## Evidencia local

- Dos capturas GLB: 1.731.776 bytes; posiciones/normales finitas, cinco mallas por talla y contratos de pintura/anclajes conservados.
- Catorce vistas generales, diez primeros planos y dos superposiciones ortográficas registradas con la foto por tres landmarks. Ambas tallas/caras y diagonales; estas superposiciones no son una validación dimensional de fabricante.
- Veintidós rayos de pasos de dirección/sillín/pedalier, cero obstrucciones antes/después. No equivalen a ajuste mecánico ni comprobación exhaustiva de cavidades/colisiones.
- Veintiocho recursos de los otros catorce cuadros conservan SHA; los dos grupos de herrajes de cada talla mantienen sus posiciones. La pintura se reconstruye íntegramente: no se afirma conservación de sus vértices anteriores. Diferencia máxima entre envolventes: 6,23 mm por los nuevos perfiles, sin interpretación de tolerancia física.
- Pruebas de rectitud de ejes, tangentes y bordes en intervalos declarados; controles negativos reintroducen seno/Catmull. TypeScript estricto de herramientas y build correctos; 192 pruebas en 47 archivos pasan.

Fuentes/evidencia en `models/catalog-v15/`: `profile.json`, `path.ts`, `path.test.ts`, `publication.test.ts`, `uploads.json`, `preservation.json`, `inspection.json`, `bore-review.json`, `general-review.json`, `detail-review.json`, `overlay-review.json` y `adversarial-review.md`.

## Integración

Dos GLB cargados y releídos por SHA; CAPRA articulado en reposo/50/100 %, tres capturas y posturas diferentes sin errores de página. Publicación acotada aplicada mediante `supabase/operations/publish-frame-v15.sql`: dos sucesoras del CAPRA, sin reescribir otros cuadros, prearmadas ni montajes privados.

Transición con cuenta normal temporal: dos montajes v14 guardados antes de publicar conservan sus identidades y se vuelven a guardar después; dos montajes v15 nuevos guardados. Cuenta y montajes temporales eliminados. Evidencias `transition.json`, `motion-review.json` y `validation.json`. Auditoría final de solo lectura: las doce comprobaciones pasan; `cloud-before.json` y `cloud-after.json` registran historial, contratos y elecciones ajenas conservados.

Estado: **70 modelos, 146 elecciones, 752 variantes/750 recursos históricos, cuatro prearmadas y 92 posiciones**; mismas 22 migraciones y doce tablas propias, sin cambios de Auth/IAM/Edge Functions. Reposición después de v14 mediante preparación/carga y publicación v15; no usar el publicador visual general. Los montajes guardados mantienen su versión; seleccionar otra vez el CAPRA aplica la corrección nueva.

No se certifican CAD, parecido del 100 %, superficies ocultas exactas, colisiones exhaustivas, Android físico ni FPS. La revisión cruzada no encuentra bloqueantes de rectitud, pero mantiene diferencias estimadas de grosor/volumen junto a pipa y pedalier. Aceptación visual del usuario pendiente. Sin commits.
