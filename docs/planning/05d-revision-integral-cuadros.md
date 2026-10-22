# 05d · Revisión integral de los quince cuadros

Ampliación solicitada el 21/10/2026: revisar y mejorar todos los cuadros publicados, incluidos los siete gravity adicionales. No limitarse a añadir polígonos o cambiar pintura. Conservar v1–v9, sus hashes, variantes y montajes; cambios físicos en nuevos GLB/identidades v10. Sin commits hasta nueva solicitud explícita.

## Rúbrica de trabajo y revisión

1. **Identidad:** marca, modelo, generación, material, talla y configuración de rueda. No trasladar formas de otra generación ni confundir montajes de componentes con el cuadro desnudo.
2. **Silueta lateral:** curvas/quiebres de tubos, ventanas, continuidad del tubo de sillín, posición del amortiguador y relación de los triángulos. Comparación con la referencia registrada, sin prometer CAD o porcentaje de parecido.
3. **Volumen multivista:** anchos variables, transiciones de dirección/pedalier, secciones redondeadas o angulares específicas, separación de vainas y tirantes, hueco de rueda y profundidad de bieletas. Revisar ambos lados, frente, superior, inferior y diagonales.
4. **Estructura:** cuerpos de enlaces y soportes reales, yugos, contrapartes de brazos, ejes/pivotes y orejas. Polea, patilla, soporte de freno y protecciones permanecen en su lado; no duplicar todo por simetría.
5. **Fuentes:** fotos de distintas perspectivas, despieces y vídeos cuando puedan inspeccionarse. Registrar URL, generación, perspectiva y lo realmente observado; localizar un enlace o miniatura no equivale a revisar un vídeo. No afirmar haber agotado Internet.
6. **Inferencia final:** completar conexiones/espesores no documentados de forma coherente con ese modelo, distinguiendo estimación de observación. No dejar apoyos flotantes por falta de una vista; tampoco inventar mecanismos interiores o física.
7. **Integración:** anclajes, pintura, selección/pulso, suspensión visual, miniaturas y montajes antiguos. Una mejora exterior no autoriza alterar silenciosamente la trayectoria guardada en otra versión.
8. **Validación:** cobertura de los quince modelos y tallas publicadas; coordenadas finitas, exportación reproducible, identidades/hashes inmutables, registro de contactos y límites, render multivista, guardado/reapertura y coste de carga. No certificar ausencia de colisiones, 30 fps o Android físico.

```text
Referencia de generación → auditoría por modelo → perfil exterior propio
                                  ↑                    ↓
                        revisión e inferencia ← siete vistas
                                                       ↓
                                     GLB nuevo → publicación aditiva
                                                       ↓
                          montaje anterior intacto / nueva elección v10
```

## Cobertura obligatoria

META SX V5; SUPREME DH V5; Nomad 7 MY27; Sender CFR High Pivot; S-Works Enduro UDH; CHERRY BOMB 29; Ransom RC HMX 427727; Slash AL Gen 6; V10.8 MY27; TUES MK4 Carbon; CAPRA MK3 Carbon MX; GT Fury Carbon High Pivot; GT Force Carbon High Pivot; FRS V3; Furious V3 2021.

El trabajo de investigación, reconstrucción, revisión y publicación pertenece a las fases de recursos/configurador/validación de 08. Fuentes, observación/inferencia y decisiones concretas en `models/catalog-v10/`; resultados en 12. La publicación solo se realiza después de corregir las discrepancias observadas en revisión local y conservar evidencia de versiones anteriores. Las cotas comerciales no se sustituyen por medidas deducidas de una fotografía.

Resultado implementado y publicado: [12e · Evidencia de cuadros v10](12e-evidencia-cuadros-v10.md). La aceptación visual final no se sustituye por la comprobación de exportación o de anclajes.

## Continuación: pasos de montaje v11

La segunda pasada comprueba aberturas de dirección, collar de sillín y pedalier: algunas envolventes exteriores v10 invaden su interior. Corregir mediante nuevas capturas v11, conservando los binarios v10, superficies exteriores y anclajes. Los radios son holguras visuales basadas en las camisas ya representadas, no nuevas cotas comerciales. Verificar con rayos axiales desplazados, comparar las siete vistas y comprobar reapertura de montajes. Mantener referencias de observación/inferencia de v10; esta corrección no atribuye nuevas perspectivas de fabricante no inspeccionadas.

## Corrección exterior de dirección v12 (retirada)

Revisar los quince cuadros en ambas tallas: la apertura axial v11 no valida la unión exterior. Reconstruir la pipa y recortar extremos de tubos que sobresalen, conservando eje, anclajes y medidas comerciales. Comprobar bordes superior/inferior, uniones lateral/frontal/diagonal, paso despejado y montaje con horquilla. Publicar con nuevas identidades únicamente tras revisar esos resultados; conservar v1–v11. Los perfiles exteriores inferidos no son cotas de fabricación.

## Reversión solicitada de la pipa v12 · 21/10/2026

El usuario pide deshacer la última corrección global: algunos modelos anteriores estaban bien. Se restaura v11 en las treinta elecciones de cuadro y en las prearmadas, conservando todo el historial y sin cambiar montajes privados. V12 queda retirado y no debe republicarse. Fuente de reversión: `supabase/operations/rollback-frame-v12.sql`; aplicar/verificar con `node scripts/rollback-frame-v12.mjs --apply` (sin `--apply` solo comprueba). Las cifras históricas siguen en 728 variantes/726 recursos y 146 elecciones. Las comprobaciones de publicación v12 describen su snapshot anterior, no la elección actual. Cualquier nueva corrección debe aislar modelos defectuosos y comprobar simetría real sin duplicar detalles legítimamente asimétricos.

## Continuidad localizada v13: cinco cuadros protegidos

El usuario declara correctos META SX V5, SUPREME DH V5, Cherry Bomb 29, Nomad 7 y Ransom RC: no modificar sus recursos, variantes o geometría. Usarlos como referencia de unión continua y volumen sin huecos. Nueva versión acotada a las veinte variantes de los otros diez cuadros, sin reutilizar v12 retirada.

Conservar el eje y extremos de la pipa y reconstruir únicamente las raíces superior/diagonal con secciones completas que terminan dentro de ella. El recorte local alcanza 110 mm del eje; el perfil de empalme se toma desde 160 mm y sigue el trazado anterior hasta unos 65 mm. No comprimir el cuadro ni intercambiar siluetas entre marcas. Los siete gravity conservan la pipa original. Sender/Enduro/Slash reconstruyen su camisa anular al mismo radio exterior para eliminar superposiciones, y usan sus propios trazados y anchos; retirar sus restos planos v6 solo mediante coincidencia de triángulos y proximidad documentada, sin borrar indiscriminadamente superficies exteriores. Método y límites en `models/catalog-v13/README.md`.

Antes de publicar: comprobar conservación del cuerpo y de las diez capturas protegidas, simetría de las raíces nuevas, pasos despejados, vistas de ambas caras/frente/superior/diagonales, montaje con suspensión y persistencia de identidades históricas. Mantener anclajes, acabados, medidas comerciales, prearmadas y montajes privados. No atribuir nuevas cotas de fábrica a los rellenos inferidos.

## Corrección individual CAPRA MK3 Carbon MX · v14

Solicitud posterior a v13: acercar únicamente las llegadas de ambos tubos a la pipa; la diagonal inmediata debe tener una trayectoria más recta y menos curvatura genérica. Corregir las dos tallas del CAPRA sin tocar los otros catorce cuadros, referencias comerciales, anclajes ni montajes guardados. Método y referencia visual en `models/catalog-v14/README.md`. Preparación, vistas, pasos de montaje, conservación del cuerpo, pruebas de guardado/publicación y evidencia forman parte de las fases de recursos/configurador/validación de 08. Otra corrección necesita identidad nueva; nunca modificar v13 publicada.

## CAPRA completo v15: rectas y desvíos

El usuario rechaza las curvas que v14 conservó fuera de la llegada a pipa. Revisión con tres agentes: reconstruir los trayectos completos y las secciones del CAPRA según su lateral/oblicuas, con rectas explícitas y redondeos solo en desvíos. No otro parche delantero. Método, referencias e inferencias en `models/catalog-v15/README.md`. Probar contornos longitudinales, no solo ejes, para detectar abombamientos de sección. Incluir revisión cruzada de capturas, anclajes/pasos, montaje, carga verificada y transición de guardados dentro de las fases de recursos/configurador/validación; conservar los otros catorce cuadros y versiones anteriores. No afirmar identidad física del 100 % sin datos que la acrediten.

## CHERRY BOMB completo v16

El usuario aprueba la dirección del CAPRA v15 y solicita el mismo método para CHERRY BOMB 29. Aislar sus dos tallas 17″/19″, antes protegidas en v11; no tocar CAPRA ni los otros trece cuadros. Tres agentes contrastan referencias y resultado: rectas y curvas específicas del CHERRY, sillín hidroformado arqueado, diagonal con desvíos propios, balancín/yugo/huecos y ambos brazos. Reconstrucción offline por perfil propio; nunca trasladar automáticamente la silueta CAPRA. Incluir trazado, vistas y foto registrada, comprobaciones geométricas/mecánicas visuales, revisión cruzada, carga/publicación y persistencia dentro de las fases de 08. Fuentes/método en `models/catalog-v16/README.md`; el 100 % dimensional no se deduce de fotografías.

## Force Carbon High Pivot completo v17

El usuario solicita aplicar al GT Force el rigor aprobado en CAPRA y CHERRY. Aislar sus dos tallas M/L, sin trasladar formas del Fury ni modificar cuadros ya aprobados. Tres agentes contrastan fuentes y capturas: reconstruir perfiles completos, pequeño triángulo GT, bieleta calada y apoyos, cuna inferior, polea/transmisión unilateral y partes traseras. Método y referencias en `models/catalog-v17/README.md`. Investigación, reconstrucción, revisión cruzada, fotos registradas, comprobaciones geométricas y de conservación, carga SHA, articulación, transición y publicación acotada forman parte de las fases de recursos/configurador/validación. No afirmar 100 % dimensional a partir de fotografías.

## Revisión individual FRS V3 Pure White v18

Solicitud autorizada: revisar el diseño completo FRS M/L y sustituir la imagen renderizada de catálogo por fotografía original del frameset Pure White. Fuentes oficiales en `models/catalog-v18/references/`: dos perspectivas del acabado correcto y nueve detalles técnicos FRS V3. Trazar rectas/radios locales propios, pipa, sillín, punteras articuladas y bieleta calada, distinguiendo inferencia de observación. Preservar 28 capturas ajenas, anclajes/especificaciones/acabados y montajes históricos. Validación multivista, pasos/ventanas, articulación, tipos/pruebas/build, carga/relectura SHA y transición remota son parte de esta implementación; no certificar 100 % CAD a partir de fotos. Recurso nuevo v18, sin modificar v1–v17 ni reconstruir en runtime.

## Furious V3 2021 completo v19

Solicitud individual autorizada para Furious M/L desde v13, conservando otras 28 capturas. Investigar y trazar la generación 2021 con fotos lateral/diagonal/articulación/superior, corroborar zonas ocultas mediante cuadros de la misma plataforma e ilustraciones de las piezas FUV3 que confirma la lista oficial 2021. No heredar automáticamente la forma ni la gráfica FRS. Reconstruir perfil propio, bieleta calada, punteras/yugos y protecciones; verificar anclajes/aberturas, tipos/build/pruebas, multivista/articulación y preservación SHA. Carga, relectura y publicación/transición Cloud son parte del alcance con SQL/fuentes aquí antes de aplicarlas. No cambiar guardados ni prearmadas. No prometer identidad CAD del 100 % o ajuste mecánico a partir de fotos. Fuentes offline `models/catalog-v19/`.

## Fury Carbon High Pivot completo v20

Solicitud individual para Fury M/L desde v13, conservando otros catorce cuadros/28 capturas. Investigar la generación 2023+ mediante cinco fotos oficiales y dos manuales, sin mezclar Fury 2019–2022 ni Force. Reconstruir perfiles propios, ventana triangular inferior, bieleta sólida, guías y apoyos; conservar anclajes, acabados, especificaciones y guardados. Revisión multivista/registrada/articulada, pasos/ventanas/rectas, preservación SHA, tipos/build/pruebas, carga/relectura y publicación/transición Cloud forman parte de las fases de 08. Fuentes offline `models/catalog-v20/`; sin reconstrucción runtime ni certificación del 100 % CAD.

## META SX V5 completo v21 · publicado

Solicitud individual para META M/L desde v11; conservar otros catorce cuadros/28 capturas, anclajes, acabados y especificaciones. Investigar foto y despieces oficiales propios, reconstruir trayectos y secciones, conservar doble enlace VCS y revisar las conexiones de amortiguador y ambas caras. La fase incluye vistas/overlay/articulación, pruebas de rectas/pasos/apoyos, conservación SHA, tipos/build/pruebas, carga/relectura y publicación/transición Cloud acotadas. No convertir guardados ni prearmadas; nueva identidad sin mutar versiones publicadas. Fuentes offline `models/catalog-v21/`; sin certificación CAD del 100 % ni commits.

## Revisión paralela Nomad v22, S-Works Enduro v23 y Sender v24 · publicada

El usuario autoriza explícitamente tres agentes en paralelo, además del META v21. Cada uno investiga referencias propias, reconstruye dos tallas con controles de silueta/partes ocultas y conserva las versiones anteriores. Nomad 7 CC usa M/L; S-Works Enduro conserva S3/S4 (no renombrarlas M/L); Sender CFR High Pivot usa M/L. No trasladar formas genéricas entre plataformas.

Las fases incluyen fuentes y observación/inferencia, perfiles/GLB offline, vistas y comparación registrada, pasos/soportes, pruebas/tipos/build, conservación de recursos ajenos, ensamblaje y movimiento, carga/relectura SHA y publicación/transición Cloud. El coordinador revisa cada resultado y publica en secuencia v21 → v22 → v23 → v24 para evitar snapshots incompatibles. Ningún agente publica o modifica los runners compartidos por su cuenta. No commits ni certificación dimensional del 100 %.

Excepción justificada Sender v24: la ficha vigente declara High Pivot MY25 y el trazado anterior usaba otra generación. Corregir exclusivamente los anclajes visuales estimados necesarios mediante manifiesto nuevo, con antes/después explícito por ID y perfil de inspección de suspensión específico para esos recursos. Mantener medidas comerciales, BB, centros de rueda y dirección cuando ya correspondan, así como manifiestos/GLB/movimiento históricos. No deformar la generación actual para sostener una referencia equivocada ni reutilizar sin validar la animación anterior. El resultado y sus límites deben quedar registrados en `models/catalog-v24/` y evidencia documental propia.

Cierre META v21: tipos/build y 263 pruebas correctos; 28 capturas ajenas conservadas, dos GLB con seis mallas por talla, 14 vistas/diez detalles/dos overlays, 22 rayos despejados y tres poses. Publicación y transición anteriores/nuevos aplicadas. Evidencia y límites en [12p](12p-evidencia-meta-v21.md).

Comprobación Nomad v22: se descartó una hipótesis de desplazamiento del ojo trasero al comprobar en el despiece que el punto visible era el comienzo del cuerpo del amortiguador. El ojo está oculto detrás de las mejillas y el entreojos heredado ronda 230 mm; no mover el anclaje por confundir cuerpo y ojo. Completar el clevis según despiece, distinguiendo inferencia de observación.

Corrección de orientación Enduro v23: la revisión cruzada encuentra aproximadamente 14,5° entre la tija estimada heredada y el último tramo del tubo propio. Ajustar exclusivamente el anclaje visual `saddle` de las nuevas identidades, conservando su longitud de referencia y todos los otros anclajes/campos comerciales. Contrato antes/después por ID, prueba de colinealidad y SQL limitado; manifiestos históricos intactos. Sender v24 incluye la misma comprobación y respeta el entreojos comercial 250 mm al registrar los ojos fotográficos con perspectiva. Ampliar los rayos de pedalier hasta fuera de toda la envolvente del cuadro para no pasar pruebas que acaben antes de las mejillas laterales.

Corrección acotada de orientación Nomad v22: tras descartar el supuesto error de ojo, se verifica una desviación de tija de 8,8°/10,3° según talla. Conservar el perfil observado del tubo y corregir únicamente `saddle` visual en las nuevas identidades manteniendo longitud; todos los anclajes de suspensión y comerciales previos permanecen. Contrato y prueba de colinealidad exactos por ID, como Enduro, sin cambiar el perfil de suspensión histórico. Rayos completos ±0,15 m descartan que la cuna esté tapando el centro de pedalier.

Cierre conjunto v22–v24: tres agentes por modelo más revisión cruzada/coordinada; tipos/build y 303 pruebas correctos. Seis GLB nuevos cargados/releídos por SHA y publicados secuencialmente; seis montajes antiguos y seis nuevos comprobados con cuentas temporales eliminadas. Cada revisión conserva 28 capturas ajenas. Nueve poses integradas sin errores; Nomad y Enduro conservan perfil de suspensión anterior y corrigen solo saddle estimado; Sender selecciona perfil nuevo por ID de recurso para su generación MY25 y corrige los anclajes exactos documentados. Tarjeta Sender sustituida por render MY25 identificado, anterior foto2021 archivada. Evidencia y límites en [12q](12q-evidencia-nomad-v22.md), [12r](12r-evidencia-enduro-v23.md) y [12s](12s-evidencia-sender-v24.md). No certificación CAD/100 % ni commits.

## SUPREME DH V5 completo v25 · publicado

Revisión individual autorizada para M/L desde v11, sin modificar los otros catorce cuadros/28 capturas ni las imágenes reales de cards. Investigar fuentes oficiales específicas V5 de talla completa, no XS ni V5.2; reconstruir perfil propio, triángulo delantero con huecos, HVCS exterior con dos enlaces/barras/polea, tirantes/vainas y uniones ocultas estimadas. La fase incluye multivista/overlay/articulación, comprobación de pasos extendidos y orientación tija, pruebas/tipos/build, preservación SHA, carga/relectura y publicación/transición Cloud. Conservar especificaciones, versiones y montajes históricos; correcciones de anclajes visuales solo justificadas y versionadas con contrato exacto. Sin CAD/100 % certificado ni commits. Fuentes offline `models/catalog-v25/`.

V25: cinco vídeos técnicos oficiales descargados y muestreados (seis fotogramas por vídeo) corroboran enlaces/6-bar, refuerzos, punteras y flip chip; no se deduce de ellos una cinemática exacta. Se alinea SOLO saddle visual en la nueva identidad con el último tramo observado, preservando longitud y los demás anclajes. SQL exige corrección exacta por UUID. La revisión extendida detectó una pequeña intrusión de la mejilla inferior en el paso BB de L: corregir la holgura de esa pieza antes de subir. No basta con revisar solo la malla pintada ni rayos cortos.

Cierre SUPREME v25: build/tipos y 313 pruebas correctos; cinco vídeos oficiales muestreados, 14 vistas/diez detalles/dos overlays y tres poses. Dos GLB cargados/releídos por SHA y publicación/transición acotadas; 28 recursos ajenos conservados, 22 rayos axiales y 50 rayos completos de BB despejados. Cuna/ventana, HVCS exterior y anclaje saddle versionado; sin convertir guardados/prearmadas ni alterar fotos de cards. Evidencia y límites en [12t](12t-evidencia-supreme-v25.md). No equivalencia CAD del 100 % ni commits.

## TUES MK4 Carbon individual v26 · publicado

Fase completa: contrastar MK4 oficial/multivista/despiece y muestreo de vídeo; reconstruir perfil, V4L/Flip Link y contrapartes; corregir apoyos/protecciones, revisar ventanas/pasos completos y montaje; probar/tipar/build, cargar/releer SHA, publicar/transicionar y auditar. Resultado y límites en [12u](12u-evidencia-tues-v26.md). Dos nuevas tallas M/L desde v13,28 capturas ajenas intactas; solo referencia saddle alineada con contrato exacto y misma longitud.321 pruebas correctas,14 vistas/diez detalles/dos overlays/tres poses,22 rayos axiales y50 completos BB libres. Fotos reales, guardados y prearmadas conservados. Sin CAD/100% certificado ni commits.

Cierre final TUES v27: la revisión cercana de v26 detectó la raíz inferior discontinua; no se considera aceptada esa unión en v26. Nueva identidad v27, misma investigación específica, sección final dentro de pipa y placas/pequeño YT apoyados. Ambas caras revisadas antes de cargar; build/tipos y329 pruebas,14 vistas/diez detalles/dos overlays/tres poses,22 rayos axiales/50 completos libres. Publicación y transición individual comprobadas; fotos y28 capturas ajenas intactas. Estado/evidencia final en12u; sin modificar bytes anteriores.

## Revalidación adversarial TUES MK4 Carbon v28

Rechazo explícito del parecido v27: tres agentes independientes y revisión cruzada corrigen referencia de pipa falsa, cizalla, trayectoria del superior y geometrías tubulares. Reconstrucción por contornos propios, caras/biseles, collar y cuerpos articulados; contratos exactos de ocho anclajes estimados, sin cambios comerciales. Revisiones incluidas en la fase:54 puntos fotográficos independientes por talla, multivista/zoom/movimiento y corrección de defectos no capturados por los puntos (normales mezcladas, puntas de bisel y muelle atravesando placa).

Publicación/transición individual aplicadas tras v27; 28 recursos ajenos, fotografías y guardados históricos conservados. Tipos/build y341 pruebas correctos;12 específicas repetidas tras limpieza final. Resultado y limitaciones en [12v](12v-evidencia-tues-v28.md). No porcentaje global/100%CAD certificado ni commits.

## TUES · caras exteriores v29

Forma v28 aprobada por el usuario: conservar todos los contornos/anclajes/medidas. Corregir exclusivamente winding y normales tras reflexión de imagen a mundo; no ocultar con DoubleSide global. Fase ejecutada con96 rayos FrontSide/DoubleSide (96 descartes anteriores/0 nuevos), conservación de superficie muestreada/límites,54 muestras por talla,14 vistas/tres poses,22+50rayos de pasos,355 pruebas/tipos/build, carga/relectura SHA y transición/auditoría individual. Evidencia [12w](12w-evidencia-caras-tues-v29.md). Fotografías, otras28 capturas y guardados anteriores conservados; reelección usa v29. Sin commits.


## V10.8 CC MY27 · revisión individual v30

Reconstrucción propia M/L desde foto oficial del cuadro desnudo y despieces V10.8: ventanas, arco delantero, basculante cerrado y enlaces VPP. Cinco anclajes visuales estimados con contrato antes/después; geometría oficial de dirección/ruedas, medidas y acabados conservados. Perfil de movimiento nuevo solo para recursos v30; conservar históricos y fotografías. Preparación, controles de silueta/paredes/pasos, multivista, pruebas y publicación forman parte de la fase 3, con evidencia y límites en [12x](12x-evidencia-v10-v30.md). No afirmar CAD/100 % de parecido ni aceptación integral del producto.
