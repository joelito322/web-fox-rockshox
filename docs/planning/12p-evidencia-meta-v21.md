# 12p · META SX V5 completo v21

Revisión individual M/L desde v11, conservando los otros catorce cuadros/28 capturas actuales. Especificaciones, anclajes, acabados, prearmadas y montajes guardados permanecen; no añadir tablas, campos de catálogo ni construcción runtime.

## Fuentes y reconstrucción

La [página técnica oficial META SX V5](https://www.commencal.com/us/en/tech-meta-sx-v5.html) aporta despieces del conjunto, triángulos, enlaces VCS, protecciones y dos encaminamientos que muestran ambas caras en diagonal. Se contrastan con la foto oficial del frameset Team Cloud. Se conserva otra fotografía de contexto deportivo; no se cuenta como vista calibrada del cuadro ni se afirma haber muestreado un vídeo. Nueve archivos en total: dos fotografías y siete ilustraciones técnicas. [URL y SHA](../../models/catalog-v21/references/sources.json).

El trazado propio usa 1200×800 y el registro heredado BB/dirección/eje trasero; no redefine medidas desde píxeles. Superior y diagonal rectos en tramos largos, redondeos localizados en la transición inferior y cambio de dirección cercano a pipa, tubo de sillín con sus desvíos y refuerzo superior. Triángulo trasero con dos montantes delanteros, vainas/tirantes y puentes; casquillos visuales y punteras. Enlaces VCS/clevis y herrajes negros/metálicos anteriores se conservan por triángulos; no sustituirlos por una bieleta de otro modelo.

Orejetas superiores fijas conectadas al tubo superior y taladradas; ojo inferior móvil libre de puente pintado. Pipa hueca con miembros dentro de su envolvente y orificios de sillín/pedalier. Patilla unilateral y soporte de freno solo en su cara, protección inferior que sigue la diagonal y entradas laterales de cables. Gráfica COMMENCAL aproximada; profundidades, soldaduras, radios, caras ocultas y uniones por solape continúan inferidas. La tarjeta conserva su fotografía.

Se corrigieron una primera raíz de orejeta separada del superior y un puerto de cable situado fuera de su superficie antes de congelar la captura. Seis mallas por talla, agrupación/materiales e indexado offline; no CSG ni trabajo nuevo de reconstrucción en producto. [Método](../../models/catalog-v21/README.md).

## Validación y publicación

- Build y tipado estricto correctos; **263 pruebas en 56 archivos**, incluyendo ocho propias de conservación, rectas/contornos, apoyos de amortiguador, continuidad de orejeta y contrapartes del montante trasero. Un primer ensayo coincidió con regeneración local de hashes; se repitió sobre capturas congeladas y pasó. Se mantienen advertencias previas de bundle/dependencias.
- Dos GLB finitos, anclajes/pintura presentes y envolvente acotada; seis mallas por talla, **5.905.896 bytes** en total. [Inspección](../../models/catalog-v21/inspection.json). La distancia desde un centro hueco a superficie no mide error del anclaje.
- **28 SHA ajenos intactos** y tres mallas mecánicas por talla conservadas fuera de pintura/gráfica. [Preservación](../../models/catalog-v21/preservation.json).
- **14 vistas generales**, diez primeros planos de pipa y dos superposiciones fotográficas registradas. Revisión de ambas caras y montaje completo; no es comparación dimensional exhaustiva.
- **22 rayos despejados** de dirección, sillín y pedalier; pruebas adicionales de soporte superior y ojo inferior libre. [Pasos](../../models/catalog-v21/bore-review.json).
- Tres poses de inspección de suspensión (reposo/50/100), sin errores de navegador y movimiento observado con perfil existente. No representa reconstrucción exacta del sistema VCS ni certificación de colisiones/FPS. [Articulación](../../models/catalog-v21/motion-review.json).
- Dos archivos cargados/releídos por SHA, publicación SQL individual aplicada y transición de dos montajes antiguos/dos nuevos con cuenta temporal eliminada. [Transición](../../models/catalog-v21/transition.json).

Reposición tras v20: `prepare-frame-v21.mjs --apply` → `publish-frame-v21.mjs --apply`; SQL en `supabase/operations/publish-frame-v21.sql`. Auditoría de lectura `validate-frame-v21.mjs`, snapshot `cloud-after.json`. Resultado: **70 modelos, 146 elecciones, 764 variantes/762 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias. Auditorías anteriores son snapshots.

Los montajes anteriores conservan su recurso; seleccionar otra vez META usa v21. No mutar bytes publicados ni convertir prearmadas. No afirmar identidad CAD del 100 %, ajuste mecánico/soldadura, colisiones o continuidad cinemática exhaustivas, ni FPS/Android físico. Sin commits salvo solicitud explícita.
