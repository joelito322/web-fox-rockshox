# 11o · Ampliación de cuadros y suspensión gravity

El 21/10/2026 el usuario solicita ampliar cuadros enduro/DH y horquillas DH; confirma incluir generaciones anteriores identificadas. Esta decisión amplía la anterior restricción de gama actual: los modelos históricos conservan año/generación y no se presentan como novedades vigentes. No se eliminan elecciones existentes.

## Implementación y aceptación

Dentro de las fases de inventario, recursos e integración de [08](08-fases-y-validacion.md): verificar referencias de BoXXer Ultimate/Select, Bomber 58 y DH38; incorporar V10, TUES, CAPRA, Fury, Force, FRS y Furious histórico con tallas M/L documentadas. Si una ficha no confirma una medida se omite, sin heredar especificaciones de otro cuadro. No crear modelos separados por equipamientos CORE que compartan cuadro.

Cada modelo requiere fotografía de referencia con procedencia, variantes seleccionables, especificaciones verificadas y representación 3D propia. Los recursos nuevos tienen identidad/versionado independiente; conservar v1–v8 y todos sus montajes. Distinguir cotas documentadas de anclajes, espesores y cierres estimados. No certificar CAD, 90 % ni compatibilidad mecánica mediante una aproximación visual.

Revisar vistas lateral, frontal, superior y diagonal; comprobar apoyos y contrapartes sin duplicar asimetrías mecánicas. Probar selección, renderizado, guardado y reapertura, sin cambios de Auth/IAM ni tablas. Fuentes, modelos finalmente publicados y evidencia se completan aquí durante la ejecución.

## Estado

Ampliación implementada y publicada en Cloud; evidencia funcional y límites al final de este documento y en 12. La aceptación visual integral permanece dentro de las fases generales.

## Selección concretada

Fuente ejecutable: [gravity-reviewed.json](../../supabase/catalog/gravity-reviewed.json). No se promete una cobertura mundial de modelos ni se multiplican referencias por cada equipamiento de una misma bicicleta.

| Categoría | Modelo y generación | Variantes incorporadas |
| --- | --- | --- |
| Cuadro DH | Santa Cruz V10.8 Carbon CC · MY27 | M/L, MX, Liquid Blue; geometría alta/ajustes centrales |
| Cuadro DH | YT TUES MK4 Carbon | M MX y L 29, Shell White; no se ingieren cotas sin tabla confirmada |
| Cuadro enduro | YT CAPRA MK3 Carbon MX · MY25 | M/L, Deep Green, geometría MX Low |
| Cuadro DH | GT Fury Carbon High Pivot · MY24 | M/L, MX; referencia de generación del Tech Book 2024 |
| Cuadro enduro | GT Force Carbon High Pivot · MY22–24 | M/L, 29; generación anterior identificada |
| Cuadro DH/freeride | COMMENCAL FRS V3 Pure White · MY25 | M/L, 27.5/27.5 |
| Cuadro DH/freeride | COMMENCAL Furious V3 · 2021 | M/L, Gun Metal; archivo explícito, sin heredar geometría FRS actual |
| Horquilla DH | RockShox BoXXer Ultimate D2 | 27.5/29, 200 mm, rojo/negro, offset 48 mm |
| Horquilla DH | RockShox BoXXer Select D2 | 27.5/29, 200 mm, negro, offset 48 mm |
| Horquilla DH | Marzocchi Bomber 58 GRIP | 27.5, negro/rojo, offset 51 mm; selector 203 mm y discrepancia de tabla 200 documentados |
| Horquilla DH | Öhlins DH38 m.2 | 27.5/29, aire/muelle, 200 mm, offset 50 mm |

Total añadido: once modelos, 26 variantes, 26 recursos GLB/24 binarios distintos. Los doce borradores anteriores siguen sin publicarse. Mismo esquema de doce tablas propias; sin cambios de Auth/IAM, cuentas administradoras ni Edge Functions.

Fuentes por referencia en el JSON, fotografías/hashes y observación frente a inferencia en [models/catalog-v9](../../models/catalog-v9/README.md). No se inventan precios ni códigos de fabricante. La variación de muelle/aire no se simula como hidráulico interno; las diferencias exteriores no visibles de DH38 comparten malla identificada, sin afirmar mayor precisión de la observada.

## Medidas, referencias y presentación

- BoXXer D2: tabla dimensional oficial 2027. 27.5 a 200 mm: eje-corona 586 mm y DebonAir+; 29 a 200 mm: 605 mm y Linear XL. No mezclar Charger 3 D1 con 3.2 D2.
- Bomber 58: eje **20×110 DH no Boost**, no equivalente automático al Boost de BoXXer/DH38. La ficha comercial contradice el recorrido entre selector y tabla: se conserva 203 mm con nota explícita. Eje-corona visual estimado, sin publicarlo como cota de fabricante.
- DH38 m.2: 608/590 mm para 29/27.5; las coronas se venden aparte y su representación se infiere como conjunto para montar. La foto del chasis no implica incluir coronas ni representa cada mecanismo interno.
- FRS: se toma la tabla visible de su ficha (M 465/613/1248 y L 490/613/1273 para reach/stack/ejes). Los datos JSON embebidos del sitio contienen otras cifras; no se mezclan. Furious conserva únicamente medidas de montaje de su manual 2021, evitando el bloque FRS reutilizado en la página antigua.
- Los ejes 20×110 sin calificación conservan compatibilidad por confirmar. Solo dimensiones diferentes o Boost/no Boost explícitamente opuestos producen conflicto; sin impedir el montaje visual.
- La ficha y el panel reutilizado del configurador muestran **Generación** dentro de Características, y Año solo cuando no está ya expresado en la generación. No añadir una cabecera repetida. Boceto: `Generación | Furious V3 · 2021 · Archivo`.
- Imágenes: diez modelos nuevos tienen fotografía comercial, con TUES/CAPRA/Furious editados para mostrar solo el cuadro, sin las piezas del montaje original. Las fotos completas permanecen como evidencia; las superficies ocultas reconstruidas no certifican geometría. La FRS usa una imagen estática transparente de su propio GLB: los recortes fotográficos ensayados dejaban halo y se descartaron. La foto original permanece como evidencia. La etiqueta común es «Referencia visual», válida también para renders. Las miniaturas de montajes guardados siguen mostrando únicamente las piezas guardadas.

## Implementación

Migración aditiva [022](../../supabase/migrations/20261021002200_gravity_model_profiles.sql): once perfiles y restricción GLB/categoría; sin tablas ni índices nuevos. Los GLB usan los espacios/anclajes importados ya existentes y el ensamblaje v5 de cuadros. **No se añade un generador runtime v9**. v1–v8 conservan geometrías, variantes, rutas y estados de publicación.

Preparación/exportación, hashes, carga verificada y publicación atómica tienen fuentes en el repositorio. Reposición: fuentes históricas y publicaciones v3…v7 → `cockpit-reviewed.json` → `gravity-reviewed.json`, después de cargar los GLB de v9 y aplicar 022. No pasar v8/v9 al publicador visual general.

## Evidencia y límites

Aplicados en el Cloud de desarrollo: migración 022, 24 binarios verificados por descarga/hash y 26 variantes nuevas publicadas atómicamente. Snapshot: **70 modelos, 146 elecciones, 638 variantes/636 recursos con historial**, cuatro prearmadas/92 posiciones; 22 migraciones aplicadas. La validación de publicación en lectura pasó trece comprobaciones, incluida visibilidad anónima y conservación de todas las identidades/recursos anteriores. La regresión de v8 pasó doce comprobaciones.

Primer recorrido escritorio: carga de los 26 GLB y siete montajes completos de 23 posiciones con cuadros/horquillas nuevos, guardado, miniatura WebP de 640 px y reapertura con IDs exactos correctos. La prueba pública detectó la generación no visible; se corrigió la ficha compartida y su repetición pasó las once referencias. El estado final de build/pruebas y móvil se registra en [12](12-estado-implementacion.md).

El visor interno generó 55 capturas (once representantes por cinco cámaras); se inspeccionaron siluetas y uniones, corrigiendo el V10 y el tubo de sillín GT antes de publicar. No es prueba de contactos exhaustivos entre todos los triángulos, malla soldada, resistencia ni cinemática. Las vistas, las medidas estimadas y las pruebas funcionales no certifican 90 %, CAD, Android físico o 30 fps. Queda la aceptación visual del usuario dentro de las fases generales.

Cierre de esta ejecución: build y 101 pruebas correctos; nueve casos diferentes de escritorio y repetición móvil emulada 9/9 correctos, más once regresiones de catálogo/descubrimiento comprobadas. La incidencia móvil aislada de la primera ejecución y la prueba antigua que suponía una única horquilla Öhlins se documentan sin ocultarlas en 12. Sin commits ni push; aceptación visual y mediciones físicas generales pendientes.
