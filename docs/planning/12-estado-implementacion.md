# 12 · Estado de implementación

## Suspensión trasera integral · motion v2 · 21/10/2026

Auditoría de los quince cuadros/30 tallas actuales y38 shocks publicados, más cuatro IDs v11 de antiguas prearmadas. Perfil por recurso `current-v2.json`; fuentes/reproducción/evidencia en `models/motion-v2/` y [12y](12y-evidencia-suspension-v2.md). No confundir las pruebas antiguas sobre v7/v9 con cobertura del catálogo actual. Seis modelos acababan extendiendo el shock: asignaciones de ojos/ejes/registros corregidas; detener trayectoria antes del punto de retorno, con compresión/elevación monótonas y carrera/cierre limitados. META: clevis sigue enlace superior/entrada, corregidos ejes inferiores; no aceptar solo acortamiento matemático si el soporte se separa. CAPRA utiliza pivote fijo y unión del tirante de su propio balancín; Nomad/Enduro registros v22/v23. Guías reducidas/ocultaciones siguen estimadas y algunos intervalos son muy pequeños; no certificar recorrido completo/cinemática exacta/CAD/colisiones exhaustivas.

Muelle identificado por hélice, no solo caja envolvente: Vivid deformaba cuerpo y depósito. Coil acorta axialmente con diámetro/apoyo superior conservados; carcasa/depósito rígidos y vástago/apoyo inferior deslizantes; aire sin muelle. Longitud de clasificación propia del shock seleccionado.72 GLB auditados,107 pruebas específicas y45 capturas de quince conjuntos;474 pruebas/70 archivos y build correctos, doce comprobaciones de navegador entre escritorio y móvil emulado. No modificar buffers compartidos/GLB publicados, persistir postura o comitear sin petición. V2 se aplica a30 recursos actuales y cuatro IDs v11 explícitos; otros históricos conservan perfiles previos. Los cuatro v11 reciben corrección de inspección sin cambiar su geometría/identidad.

Prearmadas públicas contenían cuatro cuadros v11 retirados y no podían abrirse: fuente aditiva `supabase/catalog/motion-v2-examples.json`, SQL `supabase/operations/sync-motion-presets.sql`, ejecutor `scripts/sync-motion-presets.mjs --apply` actualizó solo cuatro cuadros a META v21/SUPREME v25 con mismos campos comerciales/acabados,88 posiciones y privados preservados por snapshot. Aplicar esta operación después de v30 al reponer datos; no relajar el control de retirados ni convertir privados. Estado70 modelos/146 elecciones/782 variantes/780 recursos históricos,4 prearmadas/92 posiciones,22 migraciones/12 tablas. Pruebas de navegador incluyen guardado/reapertura y limpieza de temporales; Pixel7/SwiftShader es emulación, sin certificación Android/Brave físico/FPS.


## V10.8 CC MY27 · reconstrucción individual v30 · 21/10/2026

M/L del V10 pasan de v13 a v30 con trazado propio de foto oficial MY27 del cuadro desnudo y cuatro despieces inspeccionados. Fuentes/registro/contornos/builders offline en `models/catalog-v30/`; evidencia [12x](12x-evidencia-v10-v30.md). Ventana secundaria, arco del amortiguador, basculante cerrado y enlaces VPP; profundidades/conexiones tapadas inferidas. Registro afín de foto oblicua a BB/dirección/eje trasero oficiales: no afirmar similitud sin cizalla, CAD o100 %.

Cinco anclajes visuales estimados con contrato exacto antes/después: tija/sillín, ojos shock y pivote inferior. Dirección/ruedas/especificaciones/acabados conservados, shock250mm. Perfil `v10-v30.json` únicamente por dos recursos nuevos, VPP exterior estimado0,12rad; históricos conservan movimiento.52 puntos por talla,96 rayos de paredes sin descarte próximo,22 axiales/50 completos BB libres,14 vistas/diez acercamientos/dos overlays/tres poses,28 capturas ajenas y dos v13 intactos.367 pruebas, tipos/build correctos; no afirmar colisiones/contactos exhaustivos, recorrido completo o Android/FPS.

Dos GLB/cinco mallas por talla,3.545.684bytes, cargados/releídosSHA. Transición de dos guardados anteriores/dos nuevos y limpieza confirmadas. Fotos/prearmadas intactas. Estado vigente:70 modelos,146 elecciones,782 variantes/780 recursos históricos, cuatro prearmadas/92 posiciones,22 migraciones/doce tablas. Reposición tras v29: prepare-frame-v30.mjs --apply → publish-frame-v30.mjs --apply; SQL propio en supabase/operations. Auditoría de lectura actual validate-frame-v30.mjs. No modificar bytes publicados, convertir privados automáticamente ni comitear sin petición.


## TUES · paredes exteriores v29 · 21/10/2026

El usuario **aprueba la forma v28** y pide corregir el aspecto transparente/hueco al girar. V29 corrige solamente winding/normales de superficies extruidas: imagenY descendente→mundoY ascendente reflejaba coordenadas sin invertir caras. No cambiar la silueta aprobada sin otra petición, no invertir camisas correctas ni activar DoubleSide global. Fuente `models/catalog-v29/`, evidencia [12w](12w-evidencia-caras-tues-v29.md). Contornosv28 y todos los anclajes/medidas/acabados exactos; contrato/publicador/SQL exigen manifiesto completo igual.

Regresión nueva: FrontSide debe encontrar la misma pared próxima que DoubleSide.96 rayos antes descartaban pared cercana/0 después; superficies muestreadas coinciden≈3,31×10⁻¹⁰m y límites dentro1µm numérico. Verificar orientación con render normal: pruebas solo DoubleSide pueden ocultar este bug.14 vistas/tres poses,54 muestras por talla,22 rayos axiales/50 completos BB libres;28 capturas ajenas intactas.355 pruebas/tipos/build correctos. Dos GLB/cinco mallas por talla,4.252.892bytes, cargados/releídosSHA; dos guardados previos/dos nuevos y limpieza comprobados. Fotos/prearmadas intactas.

V29 M/L vigente:70 modelos,146 elecciones,780 variantes/778 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas. Reposición tras v28 mediante prepare/publish-frame-v29 y SQL individual; auditoría actual validate-frame-v29. Nuevos recursos reutilizan movimiento v28 por asociación explícita `tues-v29-assets.json`; no modificar posturas anteriores. Privados anteriores conservan versión: reelección del cuadro aplica corrección. No CAD/colisiones exhaustivas/Android físico/FPS certificados ni commits sin petición.


## TUES MK4 Carbon · revisión adversarial v28 · 21/10/2026

El usuario rechazó el parecido v27. Tres agentes auditaron silueta, trasera y registro, con correcciones/revisión cruzada antes de publicar. V28 vigente para M/L; v26/v27 quedan históricos y no son aceptación de parecido. No volver a usar headtop1277/274 como eje real: caía sobre barraFOX40. Raster2300×1400, normalizado porancho2048/alto1246,6087. Contornos de carbono anchos y perfil propio, registro por similitud sin cizalla. Fuentes/propuestas/constructores en `models/catalog-v28/`, evidencia [12v](12v-evidencia-tues-v28.md).

Ocho anclajes visuales estimados corregidos con contrato completo antes/después porUUID y SQL acotado; rear exacto, shock250mm/pipa110mm, especificaciones y acabados conservados. Collar centrado en corte real, no borde. Perfil propio de movimiento solo para dos assetsv28: similitud, ojo inferior móvil/entrada y pivote oculto887/790 inferido, intervalo0,09rad. Históricos intactos; no afirmar palancas exactas o recorrido completo. Flip Link separado transversalmente del muelle con espaciadores: tres poses confirmaron eliminación de las estrías de intersección.

54 puntos independientes de fotografía pasan en M/L; v27 fallaba14–21 según registro/talla. No confundir muestra con porcentaje de parecido global. 14 vistas/diez acercamientos/dos overlays y tres poses, 22 rayos axiales/50 completos BB libres, 28 SHA ajenos intactos. Normales de bisel se calculan en mm para evitar cuantización1cm de Three; caps mantienen normal plana y profundidad afín sin clamp. Se limpiaron puntas de bisel de dirección tras revisión cercana: las muestras no las detectaban. Resta pequeña transición estimada de pipa; no certificar100%/CAD, profundidades/cinemática/colisiones exhaustivas niAndroid físico/FPS.

Tipos/build y341 pruebas correctos; tras última limpieza se repitieron12 específicas y comprobaciones visuales/GLB. Dos GLB/cinco mallas por talla,4.252.748bytes, cargados/releídosSHA. Dos guardados anteriores/dos nuevos y cuenta temporal eliminada comprobados. Fotos reales y prearmadas intactas. Estado vigente:70 modelos,146 elecciones,778 variantes/776 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas. Reposición tras v27: prepare/publish-frame-v28, SQL local y contratos exactos; auditoría actual de lectura validate-frame-v28. Guardados previos conservan versión; volver a seleccionar TUES aplica v28. Sin commits.


## TUES MK4 Carbon · cierre v27 · 21/10/2026

V27 es la elección vigente M/L tras la reconstrucción individual v26. La inspección final encontró una discontinuidad exterior de la raíz inferior en v26: se conserva ese snapshot inmutable y se corrige únicamente TUES con secciones completas dentro de la pipa. Ninguna corrección global. Fotografías, especificaciones, otros anclajes y las 28 capturas ajenas permanecen; las placas y YT se apoyan sobre la superficie revisada. Fuentes/investigación propias en v26, construcción/capturas/SQL en `models/catalog-v27/` y `supabase/operations/publish-frame-v27.sql`.

Tipos/build y **329 pruebas en 63 archivos** correctos; cinco mallas por talla, 4.899.392 bytes totales; 14 vistas, diez detalles de ambas caras, dos overlays y tres poses. 22 rayos axiales/50 completos BB libres. Dos GLB cargados/releídos por SHA; dos guardados anteriores/dos nuevos comprobados y cuenta temporal eliminada. Estado vigente: **70 modelos, 146 elecciones, 776 variantes/774 recursos históricos**, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas. Auditoría actual de lectura `validate-frame-v27.mjs`; reposición después de v26 mediante prepare/publish-frame-v27. Guardados previos no se convierten. Evidencia y límites en [12u](12u-evidencia-tues-v26.md); sin CAD/100 % certificado, cinemática/colisiones exhaustivas, Android físico/FPS ni commits.


## TUES MK4 Carbon v26 · 21/10/2026

Revisión individual M/L publicada desde v13; fuentes offline `models/catalog-v26/`, evidencia [12u](12u-evidencia-tues-v26.md). Fotos propias MK4, manual2024 p31 y vídeo YT Workshop descargado/seis instantes muestreados. Superior/diagonal/sillín propios, Flip Link macizo y triángulo trasero bilateral con punteras ajustables. Detalles anteriores reconstruidos expresamente; solo saddle visual alineado, conservando longitud y todos los otros anclajes/especificaciones/acabados. Fotos reales de cards intactas.

Dos GLB/cinco mallas por talla,4.901.868bytes; tipos/build y321 pruebas correctos.28 SHA ajenos intactos,14 vistas/diez detalles/dos overlays/tres poses;22 rayos axiales y50 completos BB libres. Carga/relectura SHA y transición de dos guardados anteriores/dos nuevos con cuenta temporal eliminada. Estado vigente:70 modelos,146 elecciones,774 variantes/772 recursos históricos,cuatro prearmadas/92 posiciones,22 migraciones/doce tablas propias. Reposición tras v25 mediante prepare/publish-frame-v26; SQL individual y correcciones por UUID en repo, auditoría vigente de lectura validate-frame-v26. Guardados/prearmadas no se convierten. Sin certificación CAD/100%, cinemática exacta, colisiones exhaustivas ni Android físico/FPS; sin commits. Snapshots anteriores se conservan debajo como historial.


## Snapshot más reciente: cuadros individuales v21–v25

META SX V5, Nomad 7 CC, S-Works Enduro, Sender CFR MY25 y SUPREME DH V5 revisados/publicados. Estado: 70 modelos, 146 elecciones, 772 variantes/770 recursos históricos; guardados y prearmadas conservados. Build/tipos y 313 pruebas correctos; evidencia de esta revisión en 12p–12t. Los apartados previos conservan snapshots históricos. Esta revisión visual no cierra por sí sola los pendientes generales de correo, rendimiento/Android físico o aceptación integral del proyecto.

## Snapshot histórico: continuidad v6 y carcasas v7

Aplicadas las migraciones 017 y 018 y las dos publicaciones de sucesoras en el mismo Cloud de desarrollo. Los 53 modelos mantienen 114 elecciones públicas y cuatro prearmadas; 63 elecciones usan GLB v6, nueve frenos el renderer v7 y 42 mantienen geometría v5. El historial alcanza 606 variantes y 604 recursos. Las transiciones reales conservaron los montajes antiguos y guardaron las cuatro prearmadas nuevas; cuentas temporales eliminadas.

Fuentes y revisión de superficies ocultas en `models/catalog-v6/`; evidencia y límites en [12c](12c-evidencia-continuidad.md). La escena DH aislada tarda 5,454 s con red de 10 Mbps/80 ms, por encima del objetivo de 5 s; enduro tarda 4,615 s. Continúan pendientes optimización de carga, el parecido final por modelo, Android físico, 30 fps y la configuración de correo previamente descrita. Sin despliegue Netlify. El usuario solicitó después comitear esta ampliación por propósito; esa solicitud no autoriza commits de cambios futuros.


Actualizado: 20 de octubre de 2026. Ejecución parcial del alcance de [08](08-fases-y-validacion.md), sin declarar la entrega completa. Los commits documentales previos se conservan; este lote de implementación parcial se versiona por responsabilidad ante la nueva solicitud explícita del usuario. Los cambios futuros requieren otra solicitud de commits. No hay despliegue de frontend en Netlify.

## Implementado y comprobado

- Base reproducible con Node 24.22.0, pnpm 12.6.0, Vite 7 y Vitest 4; un lockfile. El comparador anterior dejó de consumir campos inexistentes. Instalación con `pnpm install --frozen-lockfile`, build y treinta y cinco pruebas unitarias pasaron; existe advertencia de tamaño del bundle, pendiente de optimización/medición.
- Migraciones `20261019000100`–`20261019001300` aplicadas con historial de CLI en Supabase Cloud: cuatro tablas IAM, ocho tablas de negocio, índices, políticas y RPC. No se levantó una base local. Ninguna migración aplicada se corrige retroactivamente: los cambios posteriores son nuevas migraciones.
- Pruebas reales de API con dos cuentas temporales: Auth nativo, registro siempre user aun con metadata admin, aislamiento entre cuentas, denegación de escritura directa, guardado atómico e incremento de revisión, conflicto terminal y denegación de administración a user. Las cuentas se eliminan al terminar.
- Pruebas SQL transaccionales con rollback: slot/categoría/acabado, normalización de color, referencias retiradas y copias nuevas, permiso de renombrar sin configurar, dependencias IAM e identidad publicada inmutable. Las pruebas ampliadas de contratos comprueban números, enteros, booleanos, claves anidadas, dentado ordenado y enlaces seguros. Se comprobaron además Edge Function 401 para visitante y 403 para usuario normal.
- Los diccionarios de categorías viven en `src/features/catalog/model/specifications.ts`: controles etiquetados y contratos Zod; una migración generada conserva el contrato remoto mediante `pg_jsonschema`. No añaden tablas EAV ni estimaciones del visor a la ficha comercial. [Extensión oficial](https://supabase.com/docs/guides/database/extensions/pg_jsonschema).
- Historial local/remoto de las trece migraciones comprobado coincidente mediante CLI. El build se revisó sin encontrar las credenciales privilegiadas configuradas.
- Edge Function `admin-users` desplegada desde su fuente local. Verifica el usuario con Auth y aplica permisos mediante RPC; no confía en metadata ni en la visibilidad de botones. Despliegue mediante `--use-api`, sin empaquetado Docker. La configuración `verify_jwt=false` requiere y conserva esa verificación explícita antes de cualquier operación.
- Portada, rutas públicas, formularios de acceso y estructura del configurador conectados al cliente público. Seis comprobaciones públicas de navegador pasaron en escritorio y móvil: portada sin cargar Three.js, retorno al acceso desde configurador y validación de contraseñas. Esto no prueba envío de correo ni la entrega 3D completa.

## Integrado; aceptación todavía en curso

Tablas y paneles de usuarios, roles, matriz de permisos, catálogo y bicicletas de referencia. UI de catálogo/prearmadas aprobada en [06d](06d-administracion-catalogo-y-prearmadas.md). Guardado de borrador y publicación separados; selección de recursos existentes, campos por categoría, acabados, fuentes y precio contextual. La prueba de navegador administrativo pasó: crear un rol, revisar la matriz protegida, crear marca/componente/variante en borrador, descartar cambios y consultar usuarios por Edge Function. También pasó la conservación de cambios tras recuperar foco, el recorrido guardar/cerrar sesión y volver a entrar para recuperar el montaje persistido con su recuento y panel de detalle. Usa cuentas y registros temporales y los elimina al terminar. No sustituyen la ingesta comercial.

El configurador dispone de lista de posiciones, búsqueda/paginación de alternativas, ficha compartida de la pieza, acabados, color habilitado, deshacer, guardado RPC, revisión/recuperación de guardado incierto y modo sin WebGL. Mis bicicletas tiene paginación, recuentos reales y panel de lectura/renombrado según permisos. Una prueba interna de escena con datos auxiliares sintéticos renderizó un canvas e intercambio de cámara sin errores en Chromium/SwiftShader. No acredita rendimiento de un teléfono real ni fidelidad final. El generador paramétrico y los avisos mecánicos son implementación parcial: faltan la cobertura real, la revisión de siluetas/medidas y la aceptación visual y de rendimiento de 05. En aquel primer conjunto de dos fuentes había 39 modelos y 86 variantes, con 37 modelos/49 variantes publicados y 37 variantes en borrador. El estado posterior está en la sección de ampliación inferior. `enduro-examples.json` y `downhill-examples.json` conservan cuatro composiciones M/L en dos familias, cada una con 23 posiciones. Esto no sustituye el resto del inventario acordado ni acredita fidelidad final.

## Avance posterior: familias, recuperación y montaje completo

- Migraciones 009 y 010: consulta pública de familias de prearmadas, con versiones agrupadas antes de paginar; una prearmada publicada exige las 23 posiciones. Las pruebas transaccionales pasaron con M/L, exclusión de borradores, búsqueda, disciplina y paginación. Los datos temporales se revierten.
- Migración 011: contrato tipado de manifiestos visuales compartido con el cliente; unidades, coordenadas, rotaciones, marca de estimación y parámetros permitidos se validan también en la base. Los generadores de contratos rechazan sobrescribir archivos de migración existentes.
- Bicicletas integra búsqueda, marca, disciplina, versión y detalle lateral con todas las piezas. El cuadro mantiene su ficha dentro de la pestaña Bicicletas. El comparador incorpora ficha, acceso al montaje y retirada explícita de referencias que dejaron de estar disponibles.
- El configurador distingue borradores por identidad de montaje/prearmada/pieza de origen, conserva la recuperación de una prearmada antes de volver a entrar y protege cambios de parámetros de navegación. Una intención de probar una pieza espera a elegir cuadro. Cambiar un cuadro abre la decisión de conservar el guardado o continuar sin guardarlo; conserva las piezas y vuelve a calcular avisos.
- Las dimensiones conocidas de aro, neumático, radios, biela, plato, cassette, pedal y manillar se usan en su geometría; las aproximaciones visuales no se escriben como especificaciones comerciales.
- La escena usa los anclajes del cuadro para tirantes, cadena y cambio; el suelo respeta los diámetros de ambas ruedas. Si falta el recurso o su generador no es reconocido, se informa del fallo del visor; no se sustituye silenciosamente por geometría genérica.
- Prueba de navegador en escritorio y móvil emulado con cuenta y catálogo temporales: una familia M/L se muestra en una tarjeta, su panel expone 23 posiciones, el configurador carga canvas, cambia de cámara, guarda y recupera el recuento de 23 piezas. Otra entrada prueba una horquilla después de elegir cuadro y conserva ambas piezas. Los registros se eliminan al terminar. Se trata de recursos sintéticos para aceptación del recorrido, no del inventario comercial.
- El callback de recuperación consumió un token de Supabase, retiró el token de la URL, permitió cambiar contraseña y entrar de nuevo. La identidad temporal conservó el rol user. El enlace se obtuvo con Auth Admin sin enviar correo: **esta prueba no acredita la configuración de plantillas, redirecciones de Dashboard ni entrega de correo**.
- Se cargan catálogo, comparación, garaje y formularios de acceso por ruta. El JavaScript principal bajó de unos 672 kB/200 kB gzip a 510 kB/152 kB gzip en la compilación comprobada; el visor sigue en un chunk independiente de unos 950 kB/257 kB gzip. Persisten advertencias de tamaño y falta medir en dispositivo real.

## Primer conjunto enduro y preparación administrativa de borradores

- Migración 012 aplicada: una prearmada administrativa en borrador puede usar piezas aún inéditas; publicar exige dependencias públicas y las 23 posiciones. El guardado de bicicletas del ciclista sigue rechazando referencias inéditas. `preset_options` consulta opciones administrativas paginadas con `presets.manage`, sin ampliar RLS pública. La marca de un modelo publicado conserva su visibilidad por restricción de base.
- La ingesta de prearmadas es transaccional y comparte `iam.validate_preset_document` con el RPC; fuente en `supabase/operations/ingest-presets.sql`, cliente en `scripts/ingest-presets.mjs`. No se añade una tabla por categoría ni se atribuye una cuenta humana al proceso de ingesta.
- Inventario concreto y estado de publicación en [supabase/catalog/README.md](../../supabase/catalog/README.md), con fuentes por variante. Cubre inicialmente las 18 categorías: no equivale a cerrar todas las marcas/gamas/tallas de 11. Las bielas OEM SLX tienen medidas documentadas, pero no se inventa su sufijo/código, eje ni línea de cadena.
- Dos composiciones M/L con cuadro META SX V5, FOX 38 Factory MY27, Bomber CR, componentes Shimano, ruedas DT Swiss, neumáticos Maxxis, pedales ROCKBROS y auxiliares ATLAS. Se muestran como **ejemplo ATLAS**, sin precio total ni atribución a fábrica. La revisión interna usó sus recursos reales del lote y no piezas sintéticas; sigue siendo una aproximación 3D.
- `atlas-bike-v1` quedó separado como generador explícito; su geometría y ensamblaje publicados se conservan. Nuevos cambios físicos requieren otra clave/recurso para no alterar silenciosamente montajes anteriores. Las pinzas distinguen visualmente dos/cuatro pistones cuando el dato existe, y el sillín usa las dimensiones del diseño.
- Fotos locales de referencia de Assegai, Minion DHR II y ROCKBROS negro, obtenidas de las páginas oficiales. Son fotos del modelo, sin sustituir medidas, compuesto ni recurso 3D. Faltan fotos de las demás referencias; conservan placeholder.
- Pasaron pruebas SQL de borradores administrativos, denegación a user, rechazo de piezas inéditas en montajes propios y rechazo de publicación incompleta. La prueba de navegador administrativo prepara, guarda y reabre una prearmada con una horquilla en borrador y comprueba el rechazo al intentar publicarla sin dependencias. Se corrigió además el botón de creación para esperar a cargar marcas/opciones.
- Pasaron diez comprobaciones públicas en escritorio/móvil (portada/acceso más catálogo real, fotos, comparación, precio contextual y familia M/L) y cuatro recorridos autenticados por dispositivo. La composición publicada real se guarda y se reabre con 23 piezas. Se comprobó además aro delantero 27,5 con neumático 29: aparece el aviso y el montaje visual se guarda y recupera sin bloquearlo.
- El catálogo y sus fichas comparten la ruta opcional `/componentes/:slug?`, manteniendo el contexto de la galería. El panel restaura foco en su ciclo de layout. Las pruebas esperan a que termine de cerrarse antes de escribir en el fondo: un diálogo nativo abierto mantiene el resto de la página inerte.
- El envío real de correo y la configuración elegida de Dashboard siguen pendientes. La ampliación del catálogo no modifica esa decisión.

## Conjunto de descenso y recursos v2

- Se incorporaron dos tallas M/L de SUPREME DH V5, tres SKU FOX 40 Factory MY27, GX DH A3 con mando A2, XG-795, PC-1110, DUB PF107, DESCENDANT DH 165/34 y bujes DT Swiss 350 20×110 BOOST y 12×157 XD. Se publica además el Bomber CR 250×75 ya documentado y se completan potencia directa/tija de 31,6 ATLAS. Fuentes y límites por categoría en 11a–11m y en el JSON de ingesta; sin inventar peso, offset, SKU o precio.
- `downhill-examples.json` se aplicó transaccionalmente con dos composiciones de 23 posiciones. Tras aquel lote, antes de la ampliación de frenado, había 29 modelos, 74 variantes, 27 modelos/37 variantes publicados y 37 variantes en borrador; cuatro composiciones publicadas agrupadas en dos familias. El conjunto no completa todavía todas las marcas/gamas previstas.
- `atlas-bike-v2` conserva el ensamblaje por recurso de cuadro, representando polea, cadena guiada, bieletas, doble pletina y potencia directa. Las piezas comunes reutilizan sólidos existentes; los montajes enduro v1 conservan sus coordenadas. Los bujes y el pedalier v2 usan sus anchuras conocidas. Los anclajes siguen siendo estimados y no simulan cinemática.
- Pruebas puras de M/L: distancia entre ejes propia, apoyo de ambas ruedas, entreojos visual de 250 mm y aviso al sustituir por uno de 230 mm. No aparecen conflictos mecánicos conocidos en las medidas comprobables del ejemplo, sin certificar el conjunto real.
- Migración 013 aplicada: se impide publicar una clave procedimental que el cliente no soporte; la ingesta usa el mismo inventario explícito de claves. No se añade otra tabla ni servicio. Los contratos SQL comprueban rechazo de clave desconocida publicada y aceptación de recurso v2.
- Se añadieron fotos oficiales locales del cuadro y de la FOX 40 negra. La foto del cuadro ilustra la familia, sin sustituir el acabado ni el recurso 3D.
- El recorrido de descenso guarda y reabre talla L con 23 posiciones. En Chromium se provoca pérdida de contexto mediante `WEBGL_lose_context`: la lista permanece accesible, permite cambiar color y guardar, y al volver se recuperan color y visor. Es una prueba controlada en escritorio y móvil emulado, no una medición en teléfono real.
- La cámara adapta su distancia al ancho del visor para evitar recortar las ruedas en pantallas estrechas; no altera la geometría de los recursos.
- Las pruebas usan ahora búsqueda para localizar un modelo recién creado cuando el catálogo supera una página. No ejecutar cambios de módulos del frontend durante las suites: HMR reinicia módulos/cachés y altera recorridos que están en curso.

## Ampliación de frenado y consultas administrativas

- Fuente nueva `supabase/catalog/braking-reviewed.json`: diez modelos y doce variantes con marca/modelo, acabados, fuentes, recurso y estado de publicación propios. Se aplicó transaccionalmente a Cloud después de validar el contrato y revisar ocho montajes de frenos en el visor interno. No se modificó un recurso ya publicado ni se añadió otra tabla o generador.
- Se incorporan BL-M7100/BR-M7100 de dos pistones, MAGURA MT4/MT5/MT5 PRO/MT7 PRO y Maven Bronze/Silver/Ultimate B1, además de MDR-P 180/203/220 y HS2 220 de seis tornillos. Se mantienen las diferencias de maneta y fluido documentadas; los datos no demostrados de peso, longitud comercial, orientación o SKU no se deducen de otras generaciones.
- MAGURA tiene foto local de MT5, precios de referencia con mercado/fecha y mantenimiento enlazado al manual MT: comprobación antes de cada salida y purga por condición. El enlace del manual no implica descargarlo al abrir la ficha.
- La lógica distingue espesor desconocido de espesor incompatible: muestra aviso cuando el disco no aporta la medida requerida por el freno, permite el montaje y elimina la incertidumbre al elegir el disco documentado. Un conflicto sigue sin bloquear la persistencia visual.
- La administración renueva filtros, fichas y referencias dependientes al guardar catálogo, y el detalle al guardar una prearmada. Una prueba de navegador calienta la caché, publica marca/modelo/variante temporales, navega dentro de la aplicación y encuentra la nueva marca sin recargar el documento. Los registros se eliminan al terminar.
- La prueba autenticada sustituye delantero por SLX de dos pistones y trasero por MT5 de cuatro, monta MDR-P 203, guarda y reabre las tres elecciones manteniendo 23 posiciones. No equipara la representación genérica con una pieza CAD.
- Se limita Playwright a dos contextos de trabajo simultáneos y se dan 15 segundos a comprobaciones funcionales que incluyen Auth y consultas remotas. Las trazas mostraron respuestas remotas y cadenas de carga que superaban el límite anterior de cinco segundos; no se confunde este margen con aprobar el objetivo de rendimiento del visor.

## Verificación del lote de frenado (anterior al lote de suspensión)

| Comprobación | Resultado |
| --- | --- |
| Build y pruebas puras | Build correcto; 22 pruebas en siete archivos |
| Navegador público | 14 comprobaciones en escritorio/móvil emulado: acceso, catálogo, comparación, fotos, familias M/L y datos/mantenimiento de frenos |
| Navegador autenticado | Siete recorridos por dispositivo, catorce en total: administración, composición, recuperación sin envío de correo, enduro, descenso, publicación con caché previa y sustitución independiente de frenos; incluye pérdida de contexto y persistencia de color |
| Supabase API/SQL | 15 comprobaciones API y contratos SQL aprobados; identidades temporales eliminadas |
| Historial de base | 13 migraciones locales/remotas coincidentes |
| Inspección posterior a limpieza | 8 tablas de negocio y 4 IAM; 39 modelos, 86 variantes, 49 publicadas, 37 en borrador; 4 composiciones públicas |
| Primera cuenta administrativa | Confirmada, rol admin, 12 permisos; no se modificó la contraseña |
| Compilado y documentación | Sin credenciales privilegiadas configuradas en el build; enlaces locales y diff sin errores |

Persisten advertencias de tamaño de chunks. En aquel build el visor ocupaba unos 956 kB de JavaScript/258 kB gzip y el chunk principal unos 510 kB/152 kB gzip. El build posterior de recuperación y revalidación ocupa unos 958 kB/259 kB gzip en el visor y 511 kB/153 kB gzip en el principal. Esto no acredita todavía los objetivos de red, temperatura o 30 fps en teléfono real. Auth continúa con Site URL en localhost:3000, sin callbacks/plantillas preparados aplicados ni SMTP propio: la entrega efectiva de correos sigue pendiente de Dashboard.

## Suspensión, recuperación y permisos vigentes

- Tres fuentes de catálogo aplicadas a Cloud: `initial-reviewed.json`, `braking-reviewed.json` y `suspension-reviewed.json`. Total: 43 modelos/102 variantes; 43 modelos y 90 variantes publicados, doce variantes en borrador y cuatro composiciones públicas. Se mantuvieron las doce tablas y trece migraciones; no fue necesaria otra migración para el lote.
- Se incorporaron dieciséis variantes de ZEB Ultimate B1, Bomber Z1 RAIL, FLOAT X2 Factory MY26 y TTX22m.2; se completó la publicación de RXF38 m.3 y 24 medidas Vivid Coil D1 antes en borrador. Se verificaron 41 recursos en composiciones de 23 posiciones antes de aplicar las fuentes. Fotografías locales de Z1 negro/rojo por acabado; no se copia el peso de una medida a toda la familia.
- Las restricciones documentadas de amortiguador del cuadro aparecen en avisos aunque coincidan entreojos/carrera, conservando el montaje libre. No se convierte una nota textual en una certificación automática de compatibilidad.
- La pieza seleccionada se destaca en el visor y su botón indica selección accesible. El resaltado no modifica geometría, pintura guardada ni materiales compartidos. Materiales temporales exclusivos evitan que la caché de uniformes del renderer arrastre el resaltado a otra malla; dos pruebas puras comprueban aislamiento, conservación de pintura y liberación. Después de ese ajuste pasaron de nuevo los recorridos Android de descenso/color guardado y de entrega GLB.
- Se corrigió la primera carga de GLB: el panel queda accesible mientras se prepara el binario. Descargas concurrentes del mismo recurso se comparten, hay espera máxima de 20 segundos y la expulsión de caché libera también texturas. Una prueba usa un archivo sintético interceptado para verificar reapertura con caché vacía y 404 conservando 23 piezas y guardado; no acredita un bucket comercial remoto.
- Pruebas de guardado en navegador: transacción confirmada con respuesta 504 se reconcilia sin duplicar; editar durante un guardado conserva el borrador posterior; un fallo de petición permite reintentar; dos pestañas detectan revisión incompatible y pueden conservar ambas elecciones como copias.
- Una denegación 403 en Data API/Edge Functions provoca revalidación de acceso; si se retiraron permisos se cancelan consultas y se limpia la caché. Las rutas autorizadas desmontan formularios que ya no correspondan. No se recurre a metadata ni a refrescar un JWT para recuperar permisos retirados.
- API remota: asignación autorizada, conflicto 409 al reutilizar revisión y revocación inmediata con la misma sesión tanto en Edge Function como en RPC. Una cuenta bloqueada no puede guardar con su JWT previo. Solo se modificaron identidades temporales, eliminadas al terminar.
- Build y 31 pruebas puras en diez archivos aprobados. Dieciséis comprobaciones públicas aprobadas en escritorio y Android emulado; doce recorridos autenticados aprobados en cada dispositivo, incluido Pixel 7/Chromium. La prueba de revocación de interfaz inyecta las respuestas 403/acceso reducido sin alterar la identidad compartida de la suite; el servidor se probó por separado con una revocación real de una cuenta temporal. La recuperación de correo continúa probada solo con token generado sin envío.
- La calidad móvil usa DPR 1/sombra 512, preservando v1/v2. Primera imagen aislada en unos 1,0–1,1 s y 33,8/32,2 fps en perfil Android emulado con software; escritorio por software 18,8/18,1 fps. Descarga medida 427 271 bytes y hasta 58 334 triángulos con sombras. **No acredita teléfono físico, Brave ni carga completa desde Netlify.** [Método, resultados y límites de 12a](12a-evidencia-del-visor.md).
- Se midieron consultas reales con roles/RLS mediante EXPLAIN: catálogo filtrado, filtros y familias en aproximadamente 1/4/6 ms de servidor sobre el volumen actual. Garaje vacío de identidad temporal: 0,053 ms. No se declara validada una carga grande ni se crean índices especulativos. Fuentes y límites en 12a.

## Ampliación de cuadros, neumáticos y recuperación local

- Cinco fuentes de catálogo aplicadas en Cloud, incluidas `frames-reviewed.json` y `tyres-reviewed.json`: 53 modelos/128 variantes, 53 modelos/116 variantes publicados (114 seleccionables y dos capturas anteriores) y doce variantes en borrador; cuatro composiciones públicas. Se conservan doce tablas y trece migraciones. Los lotes no eliminan ni sustituyen variantes/recursos anteriores.
- Seis cuadros nuevos, cada uno con dos geometrías: Nomad 7 CC MY27, Sender CFR high-pivot, S-Works Enduro UDH, Cherry Bomb 29, Ransom RC 427727 y Slash AL Gen 6. Tallajes originales S3/S4 y 17″/19″ conservados; otros M/L. No se inventan interfaces, pesos o SKU ausentes. Las fichas públicas de los seis modelos y sus cambios de talla pasaron en escritorio y Android emulado. Se completó BSA 73 mm de Specialized mediante dos nuevas capturas con el mismo recurso visual: las dos referencias iniciales siguen legibles y no seleccionables, sin alterar montajes anteriores. La ficha normal prioriza tallas seleccionables y admite enlaces a referencias anteriores.
- Doce neumáticos de cuatro modelos CST/Kenda/Michelin/Schwalbe, con medida, carcasa/compuesto, terreno cuando consta y fuentes por referencia. No se suman capas TPI ni se copia el peso CST de una referencia distinta. Las tolerancias Kenda permanecen en la fuente sin fingir un peso exacto.
- Se revisaron doce cuadros en cuatro cámaras y doce neumáticos sobre composiciones completas antes de publicarlos. Se corrigió el encuadre superior que recortaba ruedas en cuadros largos. Los recursos son genéricos identificados; no se declara aceptado el parecido final de marca. Evidencia, método y revisión de los doce borradores no publicados en [12a](12a-evidencia-del-visor.md).
- Corrección de recuperación: una sesión ausente/no verificable conserva el borrador local de su cuenta, sin mostrarlo a visitantes. Reautenticar la misma cuenta recupera sus 23 piezas y cambios; cerrar sesión expresamente elimina esa recuperación tras éxito de Auth. No se guardan tokens en el borrador.
- Tres recorridos nuevos aprobados en Android emulado: cambiar a Nomad L conserva piezas/color y guardado con avisos; iniciar desde Sender M permite guardar una bicicleta incompleta; reautenticar conserva cambios y cerrar sesión expresamente limpia recuperación. Las cuentas/fixtures temporales se eliminaron después. Los quince recorridos autenticados completos pasaron también en escritorio Chromium.
- Build y 35 pruebas puras en once archivos aprobados; veinte comprobaciones públicas aprobadas en escritorio y Android emulado tras las ampliaciones. Las ampliaciones no cierran el inventario ni la aceptación visual integral. Brave/Chrome Android son los navegadores objetivo confirmados; no se ha validado un teléfono físico, entrega real de correo ni despliegue Netlify. El enlace a una captura anterior de cuadro se comprobó además en ambos perfiles Chromium tras la revisión. Brave 154.1.96.59 instalado en Linux pasó once comprobaciones públicas y cinco recorridos autenticados con perfil Pixel 7; no se presenta como Brave Android físico.

## Integración de Auth y primera cuenta administradora

El usuario eligió `admin@atlas.mtb` y creó la cuenta desde Supabase Dashboard. Tras su aviso se verificó la identidad confirmada y se ejecutó el bootstrap controlado. La comprobación posterior de solo lectura confirmó rol admin, correo confirmado y los doce permisos. Nunca crear ni comunicar una contraseña predeterminada, ni ascender automáticamente el primer registro. `supabase/operations/bootstrap-admin.sql` y `scripts/bootstrap-admin.mjs` solo vinculan una cuenta existente, confirmada y habilitada; rechazan un segundo bootstrap si ya hay otro administrador. Esta operación se ejecutó correctamente para la cuenta elegida, sin modificar su contraseña ni crear otra identidad.

La lectura de configuración de Auth devolvió Site URL `http://localhost:3000`, sin callbacks permitidos, confirmación de correo activada y sin SMTP propio. El token permite leer esa configuración, pero el PATCH devolvió HTTP 403. **No se aplicaron ni se declararon probados los cambios de Auth.**

Fuentes preparadas: `supabase/auth-config.json`, `supabase/templates/{confirmation,recovery,invite}.html` y `scripts/configure-auth.mjs`. Configuran el frontend de desarrollo en 5174, callbacks concretos y enlaces `token_hash` compatibles con el contrato de 04. El usuario eligió aplicar los valores y plantillas desde Dashboard y confirmó después que todavía están pendientes. No ampliar permisos del token por cuenta propia; verificar por lectura cuando indique haber terminado. [Referencia de plantillas](https://supabase.com/docs/guides/auth/auth-email-templates).

El envío real de confirmación, recuperación e invitación sigue pendiente. No desactivar la confirmación para aparentar que el flujo está terminado. Comprobar servicio de correo y sus límites al integrar; el bootstrap no depende de enviar una invitación a una dirección sin buzón.

## Continuación del plan

1. Completar aceptación administrativa: publicación con fuentes/recursos, operaciones de invitación cuando esté listo el correo y casos de concurrencia/revocación. Las pruebas de borradores, roles protegidos, usuarios y cierre de sesión ya pasan.
2. Aplicar y verificar callbacks/plantillas cuando esté disponible la escritura de configuración de Auth; la primera cuenta administradora ya está vinculada.
3. Completar investigación e ingesta concreta de gama actual por 11a–11m, sus fuentes y recursos/manifiestos. No confundir familias registradas con variantes verificadas.
4. Completar filtros, comparación, navegación conservada, fichas y prearmadas sobre esos datos.
5. Validar geometría y montaje por categoría/talla, recuperación de borradores, avisos y persistencia; medir móvil/escritorio y corregir rendimiento.
6. Ejecutar aceptación integral y preparar Netlify según 07–08. No mover el conjunto a `finished/` por tener tablas o botones implementados.

## Comandos de comprobación

Usar la versión de `.node-version`; por ejemplo `mise exec node@24.22.0 -- <comando>`.

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
pnpm exec playwright test tests/browser/public.spec.ts tests/browser/catalog.spec.ts
node scripts/validate-supabase.mjs
node scripts/test-authenticated.mjs
node scripts/test-authenticated.mjs mobile
node scripts/supabase.mjs status
node scripts/check-client-secrets.mjs
node scripts/inspect-project.mjs
node scripts/ingest-catalog.mjs supabase/catalog/initial-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/braking-reviewed.json
node scripts/ingest-catalog.mjs supabase/catalog/suspension-reviewed.json
node scripts/review-scene.mjs
node scripts/measure-scene.mjs --mobile
node scripts/measure-queries.mjs
node scripts/ingest-presets.mjs supabase/catalog/enduro-examples.json
node scripts/ingest-presets.mjs supabase/catalog/downhill-examples.json
```

Las pruebas cloud crean cuentas temporales y/o realizan operaciones transaccionales dentro del proyecto de desarrollo autorizado. No imprimir credenciales, sesiones ni contraseñas. Los resultados de navegador no se versionan.

El conflicto de revisión usa `PT409` en vez de `40001`: este último provocó reintentos de PostgREST durante una comprobación real. La corrección se aplicó en la migración 004 y se comprobó de nuevo. [Incidencia documentada por Supabase](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

Ejecutar las suites de Playwright de forma secuencial entre procesos: comparten puerto 4180 y carpeta de resultados. La concurrencia interna de una misma suite sí está configurada. El runner autenticado oculta contraseñas y tokens de su salida, y limpia las cuentas, composiciones y recursos auxiliares.


## Identidad y portada fotográfica aprobadas · 19/10/2026

El usuario aprobó el resultado visual final de la portada y solicitó versionar estos cambios por partes. Se reemplazó la ilustración de entrada por tres fotografías reales: salto alpino en Leysin, salto lateral en Sun Peaks y sendero visto desde el aire en Haldon Forest. Los seis WebP locales incluyen versiones móvil/escritorio; autores, fuentes y licencia en [README de fotografías](../../src/assets/images/landing/README.md). La primera imagen tiene prioridad y las siguientes se preparan progresivamente, sin hotlink durante la visita.

Identidad compartida: firma vectorial original `BrandLogo`, monograma y favicon; titular pesado e inclinado, fondo carbón y acento lima en portada. Nombre, eslogan, rutas y acceso autenticado al configurador conservan sus contratos. Dirección y bocetos en [06](06-ui-y-ux.md) y [06a](06a-portada-y-acceso.md).

Comprobaciones ejecutadas sobre la selección final:

- `pnpm run check`: build TypeScript/Vite y 35 pruebas de 11 archivos correctos. Vite conserva avisos de tamaño de bundles y anotaciones de una dependencia; el build finalizó correctamente.
- `pnpm exec playwright test tests/browser/landing.spec.ts tests/browser/public.spec.ts`: 14 pruebas correctas, escritorio y Pixel 7 emulado en Chromium. Incluyen rotación, pausa, controles manuales, movimiento reducido, imagen retrasada conservando la anterior, fallo de imágenes sin bloquear acceso y recorridos públicos.
- `node scripts/check-client-secrets.mjs`: sin credenciales privilegiadas configuradas en el build del cliente.

La aprobación visual corresponde a esta portada e identidad. Las pruebas móviles son emuladas; no sustituyen Android físico ni cierran los pendientes generales de Auth, inventario, 3D o despliegue. Este trabajo no modifica Supabase Cloud.

## Movimiento transversal · 19/10/2026

Implementada la revisión solicitada de transiciones en acceso, catálogo, bicicletas, comparación, montajes y administración. `src/app/motion.css` concentra las duraciones y respuestas de botones, campos, categorías, pestañas, tarjetas, tablas, avisos, registros de formulario, desplegables y paneles. Los detalles entran desde la derecha en escritorio y desde abajo en móvil. El cierre conserva su ejecución inmediata y las confirmaciones existentes.

`MotionRegion` aplica un fundido de 180 ms al cambiar de sección y de pieza seleccionada, sin remontar formularios ni escena. Abrir una ficha de componente conserva el catálogo de fondo. No se incorporaron dependencias ni animaciones continuas al trabajo; se mantiene la campaña de portada aprobada. Movimiento reducido elimina las animaciones CSS y cancela la animación de contenido activa al cambiar la preferencia.

Validación:

- `pnpm run check`: build y 35 pruebas unitarias correctos; build repetido después de la corrección CSS. Permanecen los avisos conocidos de anotaciones de Zod y tamaño de bundles.
- Suite pública `motion.spec.ts`, `public.spec.ts`, `landing.spec.ts` y `catalog.spec.ts`: primera ejecución con 35 correctas y un fallo nuevo que detectó zoom heredado de la imagen en móvil con movimiento reducido. Corregido el selector de los descendientes de la tarjeta. Reejecución de `motion.spec.ts`: seis correctas, escritorio y Pixel 7 emulado; incluyen Escape/retorno de foco, filtros conservados, ausencia de desbordamiento, movimiento reducido y cancelación en vivo sin borrar campos.
- Runner autenticado, filtro `administrator manages|reference families mount`: dos pruebas correctas en escritorio y dos en móvil emulado. Comprueban administración real de borradores/roles/paneles, confirmación al salir, montajes y selección de piezas. Cuentas y datos auxiliares limpiados por el runner.
- Inspección de capturas del detalle de Assegai en escritorio y móvil, cargando su contenido; sin desbordamiento horizontal. Capturas de trabajo en `/tmp/atlas-motion-{desktop,mobile}-ready.png`, no versionadas.
- Build del cliente comprobado sin credenciales privilegiadas configuradas; `git diff --check` correcto.

Los recorridos autenticados utilizan exclusivamente datos auxiliares del proyecto de desarrollo autorizado, sin cambios de esquemas, migraciones o Edge Functions. Estas comprobaciones no sustituyen aceptación manual de la sensación de movimiento ni pruebas físicas en Android. Permanecen los pendientes generales del producto descritos anteriormente. Cambios sin commit hasta nueva solicitud explícita.

## Ampliación de fotografías de componentes · 19/10/2026

Añadidas **40 fotografías locales WebP** para suspensiones, cuadros, frenos/discos, transmisión, pedalier, aros/bujes y neumáticos. Total nuevo: **1 065 416 bytes** (aproximadamente 1,07 MB), sin ampliar imágenes pequeñas por encima de su resolución de origen. Registro por archivo, modelo, fuente y alcance en [fotografías](../../src/assets/images/catalog/README.md) y `photos.json`. Cobertura del inventario actual: **46 de 53 modelos** con foto; faltan los cinco auxiliares genéricos ATLAS, las bielas SLX OEM sin modelo exacto y SCOTT Ransom RC 427727 sin foto verificada de esa referencia. No se sustituyen por otros modelos/generaciones.

Tarjetas y detalles comparten `componentImage`: prioridad a la foto de variante, después clave del modelo y referencia por slug. Las nuevas fotos también admiten `catalog:<slug>` como clave explícita. El frontend recibe únicamente URLs locales del registro de archivos; el manifiesto de procedencia no se importa al bundle. La ficha identifica «Foto de referencia». No se modificaron geometrías, publicaciones, medidas, migraciones ni datos remotos para conectar fotografías.

Comprobaciones:

- `pnpm run check`: build y 38 pruebas de 12 archivos correctos. Tres pruebas del resolver verifican variante roja frente a foto negra del modelo, referencias con clave ausente o explícita y ausencia de sustitución para un modelo desconocido.
- `pnpm exec playwright test tests/browser/component-images.spec.ts tests/browser/catalog.spec.ts`: 18 correctas en escritorio y Pixel 7 emulado. Se recorren las páginas completas del catálogo y se descargan/decodifican las 40 nuevas fotografías; también pasan fichas, comparación y cambio de versión/acabado. Tras ampliar las claves explícitas del registro, `component-images.spec.ts` se repitió: dos correctas.
- El primer intento de cargar la nueva suite no ejecutó casos por la importación JSON sin atributo en el runner Node; se corrigió usando lectura de archivo en la prueba. No afecta la importación de assets de Vite.
- Verificados manifiesto sin slugs repetidos, existencia, bytes y cabecera WebP de los 40 archivos. Se inspeccionaron hojas de contacto y capturas de la categoría Frenos: nueve tarjetas con nueve fotos en escritorio/móvil, sin desbordamiento. Capturas temporales `/tmp/atlas-component-images-{desktop,mobile}.png`, no versionadas.
- `git diff --check` y comprobación de secretos privilegiados del build correctos. Persisten los avisos conocidos de bundles/anotaciones de dependencia.

Las fotos de familia no prueban cada medida o acabado. Las fuentes y los pendientes fotográficos quedan documentados; no se declara cobertura total ni precisión CAD. No se hicieron escrituras en Supabase durante esta ampliación. Cambios sin commit hasta petición explícita.

## Galerías deportivas y ancho adaptable · 19/10/2026

Implementada la revisión visual de Componentes/Bicicletas y el ajuste posterior de ancho general solicitado por el usuario. `CatalogHeading` y `discovery.css` comparten cabecera carbón, título inclinado, acento lima e imágenes locales. Las tarjetas de componente tienen cuerpo blanco, fotografía en fondo de estudio, disciplinas documentadas, atributos resumidos y pie de versiones. Las bicicletas conservan su ilustración identificada; imagen pulsable por ratón/teclado, nombre sin repetir «Montaje ATLAS», selector de versión y acciones existentes. Categorías/selección exponen su estado accesible, con foco visible y movimiento reducido. No se añaden operaciones de negocio ni nuevas dependencias.

`src/app/layout.css` retira el tope central de 1440 px de los contenedores de trabajo. Margen lateral compartido `clamp(20px,3vw,56px)` para cabecera, pestañas, contenido y pie; rejillas de componentes/cuadros por ancho disponible y de montajes por tamaño mínimo legible. Tabla/comparación/administración utilizan todo el ancho exterior, con desplazamiento interno cuando hace falta. La estructura de acceso es flexible con formulario de lectura acotada. La portada conserva su diseño aprobado. Galería en [06b](06b-espacio-de-trabajo.md), criterio compartido de ancho en [06](06-ui-y-ux.md).

Comprobaciones sobre el resultado:

- `pnpm run check`: build y 38 pruebas de 12 archivos correctos. Se mantienen los avisos conocidos de tamaño de bundles y anotaciones de dependencia.
- Suite `discovery.spec.ts`, `catalog.spec.ts`, `component-images.spec.ts`, `motion.spec.ts` y `public.spec.ts`: **35 correctas y una omitida deliberadamente**. La prueba de monitor ancho se ejecuta en escritorio y se omite en el perfil móvil; las pruebas móviles de navegación/paneles sí se ejecutan. Incluye imagen de bicicleta activada con Enter, versión M conservada al abrir/cerrar, retorno de foco, filtros conservados entre pestañas, categorías móviles, fotos, comparación y movimiento reducido.
- La prueba de ancho comprueba en 1920/2560 px que el contenedor ocupa el viewport, márgenes no superan 56 px y hay más de tres columnas. Revisión adicional de Componentes, Bicicletas, Cuadros, Comparar y Acceso en **360, 393, 1440, 1920 y 2560 px**, sin desbordamiento. Capturas de trabajo `/tmp/atlas-fluid-<ancho>-{components,bikes}.png`; inspeccionadas las de 2560/1920/393. La captura exploratoria inicial se interrumpió por buscar `.content` en Acceso; se corrigió el recorrido a `.auth-layout` y se completó la matriz de 25 casos.
- Runner autenticado de escritorio, filtro `administrator manages`: **una correcta**, cubriendo administración de borradores/roles/paneles, confirmaciones, guardado y Mis bicicletas. Cuenta y datos auxiliares limpiados por el runner.
- Comprobación del build sin credenciales privilegiadas configuradas y `git diff --check` correctos.

La emulación y las capturas no sustituyen revisión física Android ni aceptación visual del usuario sobre esta última ampliación. No hay cambios de migraciones, funciones o inventario comercial; solo el runner autenticado realizó y limpió operaciones de prueba en Cloud. Se conservaron los cambios previamente preparados en el índice de Git; no se crearon commits.

## Versionado solicitado por partes · 19/10/2026

El usuario solicitó explícitamente comitear los cambios acumulados de estas revisiones. Se separan por propósito: transiciones compartidas y pruebas; fotografías/resolver/procedencia y comprobación de cobertura; galerías deportivas/ancho adaptable y recorridos; documentación y contexto de AGENTS. Al reorganizar los fragmentos se conservó una copia temporal del índice anterior y todos los archivos de trabajo. Comprobación previa del resultado completo: build, 38 pruebas unitarias, exclusión de entornos, revisión del diff y ausencia de secretos privilegiados en el cliente. Los resultados de navegador de cada entrega permanecen documentados arriba. Sin push; esta petición no autoriza commits de cambios futuros.


## Mejora del inventario 3D completo · 20/10/2026

Aplicados perfiles exteriores para los 53 modelos y 128 capturas actuales, con generadores v3/v4 y migraciones 014/015. V4 conserva volumen transversal en puentes/manillares y sitúa el amortiguador SCOTT dentro de su envolvente estimada. Se preservan recursos y variantes v1/v2/v3 para montajes guardados; las nuevas elecciones y cuatro composiciones usan v4. No se publicaron borradores ni cambiaron especificaciones comerciales.

Build y 46 pruebas unitarias correctos; cobertura de renderizado de 128 capturas y cuatro cámaras por modelo; 53 representantes en móvil emulado; 16 pruebas de catálogo, seis de selección/sombras y cinco recorridos autenticados correctos. Transición Cloud con montajes previos, contratos SQL/IAM y limpieza de cuentas auxiliares comprobados. La cámara móvil mantiene su encuadre; las sombras se reutilizan durante órbita y se actualizan al cambiar piezas. Evidencia, resultados de rendimiento y límites en [12b](12b-evidencia-geometria.md).

La cobertura funcional no certifica parecido del 90 % ni 30 fps en Android físico. La medición por software permanece por debajo del objetivo de 30 fps; no ocultar ese resultado ni cerrar la aceptación de fidelidad/rendimiento. Frontend local en 127.0.0.1:5174; sin despliegue nuevo a Netlify y sin commits de esta ampliación.

## Revisión de siluetas · 20/10/2026

El usuario rechazó la fidelidad de v3/v4 y aprobó construir primero un conjunto contrastable. Se preparó SUPREME DH V5 + FOX 40 MY27 + Bomber CR 250 × 75 como candidato local: [fuentes, reconstrucción y límites](../../models/reference-set/README.md), trazado por puntos, fuente Blender y tres GLB con volumen. Revisión interactiva en `/tests/fixtures/reference-review.html` del servidor Vite, separada del configurador publicado. La talla del dibujo no está identificada explícitamente y su calibración presenta unos 5 mm de diferencia de altura frente a la ficha M; los anchos, pivotes ocultos y la instalación de horquilla siguen estimados. No se declara precisión CAD ni un porcentaje de parecido.

No se aplicaron nuevas migraciones, subidas a Storage o publicaciones Cloud para este candidato. La aceptación del conjunto, integración del montaje intercambiable y extensión al resto de modelos siguen dentro de las fases de 08/05a. Evidencia técnica y capturas en [12b](12b-evidencia-geometria.md).

## Integración del método aprobado en el catálogo · v5

V5 está aplicado en Cloud y en el configurador principal: ocho cuadros con trazado propio, cinco horquillas y cuatro amortiguadores exportados por talla/medida; detalles paramétricos de frenos, discos, transmisión, pedales, radios y neumáticos. Se conservan las operaciones dimensionales ya adecuadas y los auxiliares genéricos ATLAS. Cobertura de 53 modelos/128 capturas nuevas, 114 elecciones públicas y cuatro prearmadas, sin publicar los doce borradores. Fuente editable y límites en [models/catalog-v5](../../models/catalog-v5/README.md).

Migración 016 aplicada; 76 capturas GLB referencian 74 archivos únicos de Storage. La transición probó dos montajes v4 guardados antes de publicar, su lectura/guardado posterior y cuatro montajes nuevos con color. Estado total: 512 capturas históricas y 510 recursos. Los modelos nuevos se usan al iniciar desde catálogo/prearmada; los montajes anteriores conservan su generación.

Build y 56 pruebas correctos; 128 variantes renderizadas y 53 modelos revisados en cuatro cámaras, además de emulación móvil. Cinco recorridos autenticados pasaron, incluidos Nomad L/color, frenos y Sender incompleto; cuatro pruebas de selección de GLB en Chromium y dos en Brave Linux con perfil móvil correctas. API/SQL/IAM y permisos de Storage comprobados. Evidencia detallada y coste de rendimiento en [12b](12b-evidencia-geometria.md). No se certifica parecido global al 90 % ni 30 fps en Android: SwiftShader móvil observó 10,0/10,4 fps, y la aceptación física sigue pendiente. Sin despliegue Netlify y sin commits nuevos.

## Auditoría de consultas y carga · 21/10/2026

Revisión multiagente y correcciones implementadas en catálogo, Bicicletas, Mis bicicletas y configurador: listados ligeros, búsquedas agrupadas, reutilización de variantes/montajes/fuentes, consultas independientes en paralelo y precarga 3D por intención. SQL con RLS observado en 0,23–7 ms; no se añadieron índices ni migraciones para rendimiento. Listados descargan 60–70 % menos datos y recorridos calientes medidos no repiten lecturas. Revisión adversarial corrigió además miniaturas obsoletas al cambiar una prearmada y caché/paginación al eliminar un montaje. Detalle, comandos, aceptación y límites en [12d](12d-rendimiento-consultas.md). Las pruebas no certifican carga fría instantánea, 30 fps ni Android físico.

## Imágenes y seis complementos comerciales · 21/10/2026

Petición posterior del usuario: ampliar las categorías antes genéricas con productos reales y completar imágenes. Implementados y publicados Renthal Fatbar35, DEITY Racepoint35, APEX35 V2, INTEGRA35, OneUp V3 y WTB Volt Fusion Form Titanium, con datos/fotos propios y seis recursos procedimentales v8 independientes. Migración 021 e ingesta fuente aplicadas. Los montajes antiguos y genéricos permanecen intactos. Ver [11n](11n-componentes-comerciales-de-contacto.md) y procedimiento en `supabase/catalog/README.md`.

El catálogo actual tiene **59 modelos/120 elecciones seleccionables**, cuatro prearmadas y doce tablas propias. Las 59 tarjetas disponen de imagen local decodificada: referencias fotográficas y renders propios identificados. Se completaron SCOTT 427727 y SLX OEM desde fuentes correspondientes, se recortaron Sender/Marzocchi/ROCKBROS y las nuevas piezas. No se declara que todas las fotografías blancas históricas tengan alfa; fuentes, retoques, prompts y límites en el README de imágenes.

Resultado final de esta ronda: build correcto, 89 pruebas unitarias, cuatro pruebas comerciales autenticadas entre escritorio/móvil emulado, prueba de imágenes y once regresiones de catálogo/navegación. Verificación remota de conservación histórica y seis publicaciones nuevas correcta. No hubo cambios en Auth/IAM ni en Edge Functions. Siguen pendientes las limitaciones físicas y de correo documentadas anteriormente. Sin commits.

## Ampliación gravity e históricos · 21/10/2026

Solicitud del usuario: más suspensión DH y cuadros de distintas marcas, con autorización expresa para generaciones anteriores identificadas. Alcance y fuentes en [11o](11o-ampliacion-gravity.md), [gravity-reviewed.json](../../supabase/catalog/gravity-reviewed.json) y [recursos v9](../../models/catalog-v9/README.md). La decisión sustituye la restricción global anterior de solo gama actual, sin presentar archivos antiguos como productos nuevos.

**Publicado en el Cloud de desarrollo:** once modelos, 26 variantes y 26 capturas GLB/24 binarios nuevos. Migración 022 aplicada, doce tablas propias sin ampliación, mismo Auth/IAM/Edge Function. Totales actuales: **70 modelos, 146 elecciones, 638 variantes/636 recursos históricos y cuatro prearmadas/92 posiciones**. Ninguna variante anterior fue archivada ni sustituida en esta ampliación. Las capturas nuevas usan espacios de montaje existentes y cuadros con ensamblaje v5; no se implementa generador runtime v9.

Cuadros: Santa Cruz V10.8 MY27, YT TUES MK4/CAPRA MK3 Carbon MX, GT Fury/Force Carbon High Pivot, COMMENCAL FRS V3/Furious V3 2021. Horquillas: BoXXer Ultimate/Select D2, Bomber 58 y Öhlins DH38 m.2, con variantes acotadas de aro/color/resorte. M/L según referencias documentadas. Cotas inciertas no se publican como medidas: TUES/Furious conservan anclajes visuales estimados; no se hereda geometría de bloques web de otra generación. La ficha compartida expone generación y evita repetir el año; «Referencia visual» distingue el alcance de las imágenes sin atribuir fotografía a un render.

**Imágenes:** 70/70 modelos cubiertos, 64 referencias fotográficas y seis renders. Nuevas fotografías y dos alternativas de color registradas con origen/hash; FRS usa render transparente de su GLB publicado, después de descartar tres recortes con halo. Las fotos completas de referencia de TUES/CAPRA/Furious no alteran las miniaturas de montajes guardados. Fuentes/prompts/limitaciones en el README de imágenes y registros JSON.

**Validación:**

- `pnpm run build` correcto; `pnpm run test`: **101 pruebas/29 archivos correctos**. Las pruebas nuevas verifican identidad/generación, contratos GLB, dimensiones/anclajes documentados, hashes/posiciones finitas y distinción de ejes Boost/no Boost. El chequeo de posiciones se agregó por recurso para evitar el coste de una aserción por vértice; no se retiró la validación geométrica.
- `prepare-gravity-models.mjs --apply`: carga y lectura pública por SHA256 correctas. Su reconstrucción posterior **sin --apply** reprodujo exactamente los bytes publicados; el guard de inmutabilidad quedó activo. `uploads.json` conserva rutas, tamaños y publicación.
- `validate-gravity-publication.mjs`: **13 PASS**, incluidas todas las identidades/recursos anteriores y 26 elecciones visibles como visitante. `validate-cockpit-publication.mjs`: **12 PASS** de regresión v8; los totales mínimos permiten ampliaciones aditivas, conservando verificaciones exactas de los recursos históricos.
- Escritorio: ocho pruebas nuevas pasaron inicialmente (26 GLB reales descargados/decodificados, y siete montajes completos de 23 posiciones con selección de suspensión, guardado, miniatura de 640 px, reapertura y recarga con IDs exactos). La prueba pública señaló generación no visible: se corrigió la ficha y su repetición recorrió correctamente las once referencias. Total: nueve casos nuevos de escritorio aceptados en esas ejecuciones.
- Móvil **emulado Pixel 7/Chromium/SwiftShader**: repetición completa, **9/9 correctos** con los mismos recorridos. En la primera ejecución hubo un fallo aislado al pulsar «Continuar» desde la tarjeta de TUES: la captura seguía en Mis bicicletas. No se reprodujo en la segunda ejecución completa ni se cambió el producto para atribuirle una causa no demostrada; se conserva como incidencia observada, sin certificar tacto de Android físico.
- Regresión catálogo/descubrimiento: diez casos iniciales pasaron y uno esperaba que Öhlins tuviera solo una horquilla. Se cambió la prueba para seleccionar explícitamente RXF38 sin prohibir DH38; la repetición específica pasó. Once casos diferentes comprobados, sin retirar las comprobaciones de medidas/servicio de RXF38, Z1, X2 y Vivid.
- Visor interno: 55 capturas de once representantes en cinco cámaras; revisión de siluetas/uniones y correcciones V10/GT anteriores a la publicación. No equivale a contactos exhaustivos entre todos los triángulos ni análisis de resistencia/cinemática.
- Auditoría final de imágenes con el resolver real y decodificación en navegador: **70 modelos, cero imágenes faltantes**.
- `git diff --check` correcto, fuentes locales de migración/ingesta/recursos conservadas. Frontend local 5174 responde; sin deploy Netlify, commits ni push.

Logs locales de esta ejecución: `/tmp/atlas-gravity-publication.log`, `atlas-gravity-v8-regression.log`, `atlas-gravity-build-final.log`, `atlas-gravity-tests-complete.log`, `atlas-gravity-desktop.log` + `atlas-gravity-desktop-public.log`, `atlas-gravity-mobile-final.log`, `atlas-gravity-catalog-regression.log` + `atlas-gravity-suspension-final.log`, `atlas-gravity-reproducibility.log` y `/tmp/atlas-gravity-review/`. No se incluyen secretos ni se consideran los temporales la única fuente de implementación.

**Límites conservados:** representación aproximada, sin certificación CAD/90 %, ensayo físico de Android ni aceptación de 30 fps. No se repitió el benchmark de red fría de enduro/DH y no se declara corregido el incumplimiento anterior de 5 s de DH. Continúan la aceptación visual, el rendimiento integral y los pendientes de Auth/correo de las fases generales; esta ampliación funcional no los da por cerrados.

### Imágenes de cuadros separadas · 21/10/2026

Revisión visual de los 15 cuadros: TUES MK4, CAPRA MK3 MX y Furious 2021 mostraban bicicletas completas. Sustituidas por ediciones con imagegen integrado que aíslan el cuadro, conservando fuente original y registrando prompts en `src/assets/images/catalog/photos.json`. WebP de 800 px con alfa, sin ruedas, horquilla, transmisión ni sillín. Se descarta un primer resultado de Furious por alterar marca y se repite desde la fuente original. Superficies ocultas reconstruidas visualmente; no documentación dimensional. Las otras doce referencias ya mostraban cuadros separados.

Actualizadas las notas de TUES/CAPRA en la fuente de ingesta y aplicadas atómicamente a Cloud. Validación de publicación: 13 comprobaciones correctas, incluidos recursos e identidades anteriores. Playwright escritorio: las once fichas gravity cargan imagen y generación (1 prueba correcta, 20,1 s). Inspección visual de los tres resultados y canales alfa comprobados; `git diff --check` correcto. Sin cambios de geometría ni commits.

### Segunda auditoría integral de rendimiento · 21/10/2026

Tres agentes con revisión cruzada y posterior integración. Se reducen variantes históricas transferidas en fichas, lecturas repetidas en comparación/lotes solapados, búsquedas administrativas por tecla, inventario innecesario para marcas y recorrido Edge del listado autorizado de usuarios. La escena evita recálculos ajenos al montaje y repinta materiales propios sin reclonar GLB; renombrar reutiliza miniatura cuando está en caché. Contratos, métricas y límites en [12d](12d-rendimiento-consultas.md), lectura administrativa actualizada en 04b y trabajo incluido en 08.

Resultado: build y 117 pruebas unitarias correctos, 37 casos de navegador escritorio/móvil emulado correctos y 37 comprobaciones Cloud correctas. Casos cubren datos, historial, comparación, selección/sombras, guardado/reapertura, administración funcional, búsquedas y denegaciones de permisos. Cuentas y fixtures temporales limpiados. Sin índices, migraciones, cambios de geometría ni commits. Continúan pendientes las limitaciones de red fría DH, FPS/hardware Android y Auth correo ya documentadas; no se consideran aceptadas mediante estos resultados.

### Inspección de suspensión por recorrido · 21/10/2026

Implementada la ampliación aprobada en [05c](05c-movimiento-suspension.md): abrir «Suspensión» dentro del configurador, ajustar compresión delantera/trasera, reproducir hasta los porcentajes elegidos, pausar y restablecer. Al cerrar o cambiar piezas se recupera reposo. Movimiento reducido conserva ajuste manual y deshabilita reproducción; ocultar la pestaña suspende el trabajo animado. Se usan refs y render por demanda, sin consultas ni actualizaciones de React por cada cuadro.

`atlas-motion-v1` registra quince perfiles exteriores por modelo/talla y articula instancias derivadas propias. Fuentes reproducibles en `models/motion-v1/`, reglas puras en `model/suspension/` y adaptación de escena en `scene/motion-rig.ts`/`SuspensionMotion.tsx`. No se alteran recursos GLB publicados v1–v9, variantes históricas ni esquemas de guardado. Guardado y miniaturas conservan postura estática; mando de cambio permanece en el manillar mientras se mueve el cambio trasero. Sin migraciones, índices, cambios de Auth/IAM o despliegues Edge.

**Comprobaciones observadas:**

- Repetición final de `pnpm run test`: **131 pruebas/37 archivos correctos**. Incluye cierre de enlaces, longitudes rígidas, continuidad de trayectorias muestreadas, límites/entradas inválidas, reposo exacto, aislamiento de geometrías/materiales y controles. `pnpm run build` correcto; permanecen avisos de tamaño de chunks y anotaciones de dependencias.
- `validate-configurator-performance.mjs desktop motion`: **5/5 correctos** después de los ajustes finales de perfiles. Comprueba restauración del visor, ausencia de consultas/descargas al comprimir, pausa sin render continuo, movimiento reducido, nueve horquillas/cuatro amortiguadores y montaje autenticado de 23 posiciones: guardado comprimido, miniatura y reapertura sin postura persistida.
- El mismo recorrido en **Pixel 7 emulado/Chromium/SwiftShader**: **5/5 correctos**. No es una prueba física de Chrome/Brave Android ni una medición de 30 fps.
- Regresión: tres casos de reutilización de datos/selección/reapertura del runner habitual y tres casos de selección directa/sombras en `visual-selection.spec.ts` correctos. Los tiempos con render por software y cargas concurrentes no se usan como benchmark de velocidad.
- `review-suspension-motion.mjs --all`: quince cuadros, **45 capturas** en reposo/50/100 %, cero errores de página. Revisión interna excluida del build; el script reproduce capturas temporales, no publica una página nueva. Las capturas temporales no sustituyen fuentes, reglas y pruebas conservadas en el repositorio.

Durante las comprobaciones se corrigieron el registro de cierre del visor tras el commit de R3F, limpieza del listener de pérdida de contexto, adaptación de extremos de latiguillos y posición del mando asociado. Un timeout móvil procedía de controles desbordados en la herramienta interna: se corrigió su distribución y se repitió el conjunto. No se retiraron los casos autenticados. Los runners limpian cuentas/imágenes temporales al terminar.

**Límites:** son guías exteriores estimadas, no cinemática de fabricante. SUPREME/Ransom usan mecanismos reducidos y no reconstrucciones completas de seis barras. Enduro, DA BOMB, Trek y Ransom conservan intervalos pequeños/conservadores; se descartaron ampliaciones inferidas que dejaban superficies separadas. La UI avisa cuando el intervalo trasero resuelto es reducido. El porcentaje representa ese intervalo, no todo el recorrido comercial. La tolerancia de registro de 4 mm no es una especificación de amortiguador real. No se certifican continuidad superficial exhaustiva, ausencia de colisiones, cargas, sag, resistencia, CAD, 90 % de fidelidad ni rendimiento físico Android. La aceptación visual y los pendientes generales de red fría, FPS y correo Auth continúan abiertos. Sin commits ni push de esta ampliación.

#### Ajuste de interacción solicitado · 21/10/2026

Los porcentajes ahora preparan amplitudes sin comprimir el visor. Solo «Reproducir» aplica los valores elegidos (incluido cero); «Pausar» conserva la postura dibujada sin sustituir los porcentajes seleccionados. Editar un porcentaje devuelve reposo antes de otra reproducción. Movimiento reducido mantiene reposo y reproducción deshabilitada. Esta decisión sustituye el ajuste manual inmediato descrito en la primera comprobación. Se actualizan contrato 05c, contexto de AGENTS y pruebas de controles/navegador; la herramienta interna de capturas conserva su función explícita de postura estática, independiente de la UI del producto.

#### Compresión visible del muelle trasero · 21/10/2026

Corregido el cálculo de compresión del resorte: usa sus límites geométricos reales en la instancia, conserva el apoyo superior y acorta el eje longitudinal según la variación entre anclajes. Se elimina la longitud genérica deducida de la distancia entre ojos; el diámetro del resorte y las carcasas/depósito no se escalan. Prueba sobre tres GLB publicados (Bomber CR, Vivid Coil y TTX22m.2): reducción longitudinal de 25 mm, diámetro constante y reposo restaurado. No se modifican binarios publicados ni se amplían artificialmente los intervalos de los cuadros.

Resultado final de ambos ajustes: build correcto, **134 pruebas/38 archivos correctos** y **6/6 casos de navegador en escritorio + 6/6 en móvil emulado**. Se verifica explícitamente que editar porcentajes deja reposo, el muelle cambia su escala longitudinal durante reproducción y restablecer devuelve su forma original; guardado/reapertura siguen sin persistir postura. La primera repetición tuvo una aserción prematura al comienzo del ciclo y un timeout mientras se actualizaba la herramienta interna; se corrigió la espera hasta desplazamiento observable y se repitió todo el conjunto sin cambios durante las ejecuciones. Cuentas/imágenes temporales limpiadas por los runners. `git diff --check` correcto; sin commits. Mantener límites generales de perfiles y hardware ya documentados.

### Armado por grupos, índice y pestañas · 21/10/2026

Implementado [06e](06e-armado-guiado.md): índice izquierdo con las 23 posiciones, modelo/variante y pendientes, seis grupos de selección y subcategorías en el panel derecho. Selección desde índice/escena sincronizada; índice plegable bajo el visor en móvil. La navegación de grupos permanece visible al desplazar el panel de escritorio. Sustituye la antigua nube de 23 botones dentro de «Tu montaje».

Pestañas Todas/29/27,5/Mixto y Todas/M/L para tallas de cuadro. Filtran alternativas y reinician página junto al filtro sin reemplazar piezas. Los pares de aros/neumáticos/frenos/discos están activados inicialmente por categoría; bujes siguen separados. Elegir, retirar, pintar y deshacer respetan la selección vinculada y los acabados permitidos. Mixto resuelve variantes equivalentes del mismo producto/generación, sin sustituir silenciosamente otro modelo: falta o ambigüedad conserva ambas posiciones y muestra aviso junto al selector. Colores/acabados mediante muestras directas; código hexadecimal conserva color libre en piezas habilitadas.

Reglas puras en `model/guided.ts`; navegación y paletas en componentes propios. Se reutiliza la lectura/cache existente de ficha únicamente cuando se necesita resolver la otra medida. Sin filtros usa la misma clave de catálogo anterior; no carga inventario completo ni hace consultas al colorear. Se conservan esquema de guardado, IDs de variantes/recursos, render por demanda, miniaturas estáticas y deshacer de una operación. No migraciones ni cambios de geometría publicados.

Comprobaciones de escritorio iniciales correctas; primera repetición con tallas detectó una selección de prueba antes de terminar el debounce, corregida eligiendo explícitamente el producto. La primera prueba móvil intentaba leer por rol un botón del índice plegado: se corrigió la lectura del estado oculto, manteniendo apertura explícita para pulsar. Esa ejecución se interrumpió a través de Playwright para permitir la limpieza del runner; repetición móvil completa **3/3 correcta**, incluidas tallas, pares/independientes, deshacer, medidas mixtas, fallo sin contraparte, paletas, frenos/discos, guardado/reapertura y ausencia de desbordamiento horizontal. No se aumentaron los timeouts ni se eliminaron recorridos. Revisión de captura móvil realizada; no equivale a Android físico. Resultado final y regresiones se añaden al cerrar la ejecución.

**Cierre de comprobación del armado y selección:** build correcto y **139 pruebas/39 archivos correctos**. Un primer test completo se ejecutó a la vez que WebGL y superó el límite de 5 s de la prueba histórica de 128 geometrías v4; repetición completa sin esa concurrencia correcta, sin cambiar su timeout ni retirar aserciones. Ocho recorridos de UI correctos (4 escritorio + 4 móvil emulado), incluidos índice, filtros de talla, parejas, independencia, deshacer, mixto, aviso sin contraparte, colores, guardado/reapertura y limpieza del resaltado sin perder panel. Seis regresiones de consultas/reapertura correctas (3 por plataforma): cero consultas/descargas adicionales al aplicar una pieza ya precargada y cero lecturas/descargas al reabrir composiciones calientes. Se corrigió el log del contador de descargas para congelarlo en el instante de aplicación: las precargas por intenciones posteriores no pertenecen a esa medida. No se usa como benchmark de escena fría o FPS.

**Selección visual solicitada:** clic en fondo del Canvas limpia únicamente la selección 3D; índice y opciones mantienen su posición activa. Cada selección usa materiales propios y un pulso de emisión de 2,4 s, sin geometrías nuevas ni cambios de pintura. A solicitud posterior se aumenta su contraste a 0,12…0,60. Con movimiento reducido queda fijo; ocultar pestaña cancela el intervalo y quitar selección libera copias/materiales y termina el render periódico. Tres pruebas de escena en escritorio correctas: selección directa enduro/DH, cambio visual durante el pulso, imagen estable con movimiento reducido, clic vacío, reposo y regresión de sombras. La integración real de Page también comprueba fin del pulso, contexto conservado y cero consultas al limpiar en ambas plataformas. El incremento final de intensidad fue comprobado con las tres pruebas visuales de escritorio y el recorrido móvil completo. Prueba unitaria adicional de intensidad, aislamiento de materiales y liberación idempotente correcta.

Fuentes y boceto conservados en 06e; revisión de capturas de escritorio y móvil en `/tmp/atlas-guided-desktop.png` y `/tmp/atlas-guided-mobile.png`, reproducibles con `validate-configurator-performance.mjs <desktop|mobile> guided`. Las capturas temporales no son la única evidencia: reglas, pruebas, UI y contratos permanecen en el repositorio. Credenciales ignoradas, `git diff --check` correcto, frontend 5174 activo. Cuentas y miniaturas temporales limpiadas por los runners. Sin migraciones, modificación de recursos publicados, commits ni push. Se conservan los pendientes generales de hardware Android, rendimiento frío y correo Auth; esta validación de UI no los certifica.

#### Registro de commits solicitado · 21/10/2026

Por solicitud explícita del usuario, el trabajo se registra por propósito: `d023a0b` (suspensión por modelo), `8d645ad` (armado guiado, medidas, pares y paletas) y `0825baf` (selección visual y pulso). Contratos, contexto de AGENTS y evidencia se registran en un commit documental separado. Las menciones anteriores «sin commits» describen el estado de esas comprobaciones antes de esta autorización; no autorizan commits de cambios futuros. Tipado de las versiones intermedias comprobado y versión final consistente con las 139 pruebas/build ya registrados. No se hizo push ni se incluyeron variables de entorno.

## Revisión integral de los quince cuadros · v10

Treinta nuevas capturas publicadas sin alterar recursos anteriores, anclajes, medidas ni acabados. Estado vigente: 70 modelos, 146 elecciones, 668 variantes/666 recursos históricos y cuatro prearmadas. La revisión comprende fuentes multivista, tres vídeos muestreados, 210 vistas y la transición de montajes guardados. Detalle, verificaciones y límites en [12e](12e-evidencia-cuadros-v10.md); contrato en [05d](05d-revision-integral-cuadros.md). No se cierra aceptación visual final ni CAD/90 %/Android físico.

## Continuación de cuadros · Pasos v11

Corregidas aberturas de dirección/sillín/pedalier en treinta nuevas capturas, manteniendo v10 y sus anclajes. Estado vigente: 70 modelos, 146 elecciones, 698 variantes/696 recursos históricos; sin cambios de tablas, migraciones, Auth o Edge Functions. Build y 149 pruebas correctos; 270 rayos, vistas y transición de guardados documentados en [12f](12f-evidencia-pasos-v11.md). Se mantiene el límite de representación exterior estimada y la aceptación visual pendiente del usuario.

## Dirección exterior v12 · 21/10/2026

Corregidas las uniones exteriores de dirección en los quince cuadros/treinta tallas. Nuevos recursos publicados, conservando anclajes, especificaciones, acabados y todo el historial; cuatro prearmadas actualizadas. Estado: 70 modelos, 146 elecciones, 728 variantes/726 recursos históricos, 22 migraciones y doce tablas propias.

210 vistas generales, 150 primeros planos y quince montajes articulados. Rayos extendidos fuera de los bordes de dirección: 60 obstrucciones antes/cero después en un total de 330 comprobaciones de pasos. Transición real: quince montajes v11 guardados/reabiertos, treinta v12 y cuatro composiciones completas; cuenta temporal eliminada. Auditoría remota de lectura correcta. Build, 152 pruebas/43 archivos y cuatro recorridos de navegador (escritorio/móvil emulado) correctos; detalle y límites en [12g](12g-evidencia-direccion-v12.md). No atribuir CAD, tolerancias físicas o Android real a estas pruebas. Sin commits.

## Reversión solicitada de la pipa v12 · 21/10/2026

El usuario pide deshacer la última corrección global: algunos modelos anteriores estaban bien. Se restaura v11 en las treinta elecciones de cuadro y en las prearmadas, conservando todo el historial y sin cambiar montajes privados. V12 queda retirado y no debe republicarse. Fuente de reversión: `supabase/operations/rollback-frame-v12.sql`; aplicar/verificar con `node scripts/rollback-frame-v12.mjs --apply` (sin `--apply` solo comprueba). Las cifras históricas siguen en 728 variantes/726 recursos y 146 elecciones. Las comprobaciones de publicación v12 describen su snapshot anterior, no la elección actual. Cualquier nueva corrección debe aislar modelos defectuosos y comprobar simetría real sin duplicar detalles legítimamente asimétricos.

## Continuidad localizada v13 · 21/10/2026

Protegidos los cinco cuadros aprobados en sus diez variantes v11; corregidos únicamente los empalmes de dirección de los otros diez cuadros/veinte tallas. Publicación aplicada con veinte GLB inmutables nuevos, sin reescribir prearmadas ni montajes privados. Estado vigente: 70 modelos, 146 elecciones, 748 variantes/746 recursos históricos, cuatro prearmadas/92 posiciones; 22 migraciones y doce tablas propias. V12 sigue retirada.

Build y 175 pruebas correctos; 140 vistas generales, 100 primeros planos, 220 rayos despejados, quince montajes articulados y cuatro recorridos de navegador. Transición real: diez montajes anteriores conservados, veinte nuevos y cuatro completos, cuenta temporal eliminada. Método, evidencia y límites en [12h](12h-evidencia-uniones-v13.md); auditoría vigente `validate-frame-v13.mjs`. La aceptación visual del usuario sigue abierta; no se certifican CAD, porcentaje de parecido, colisiones exhaustivas ni Android físico/FPS. Sin commits.

## CAPRA MK3 Carbon MX v14 · 21/10/2026

Corrección individual aplicada y publicada en ambas tallas: llegadas más próximas a la pipa y tramo diagonal inmediato recto. Los otros catorce cuadros y las cuatro prearmadas no cambian. Estado: 70 modelos, 146 elecciones, 750 variantes/748 recursos históricos; 22 migraciones y doce tablas propias. Build, TypeScript de herramientas y 179 pruebas correctos; 14 vistas generales, diez primeros planos, 22 rayos y 28 recursos ajenos conservados por hash. CAPRA articulado y dos guardados anteriores/dos nuevos comprobados con limpieza de cuenta temporal. Auditoría vigente `validate-frame-v14.mjs`; evidencia y límites en [12i](12i-evidencia-capra-v14.md). Sin commits.

## CAPRA completo v15 · 21/10/2026

V14 era insuficiente para la rectitud del cuerpo completo. Tres agentes contrastaron referencias, código y foto registrada; v15 reconstruye solo CAPRA M/L con rectas y radios locales. Secciones lineales sin abombamiento sinusoidal, tangentes exactas y soporte delantero corregido. Los otros catorce cuadros y las cuatro prearmadas no cambian. Dos recursos publicados: 70 modelos, 146 elecciones, 752 variantes/750 recursos históricos; 22 migraciones y doce tablas propias.

Build/tipos y 192 pruebas correctos; 14 vistas generales, diez primeros planos, dos superposiciones, 22 rayos despejados, 28 recursos ajenos conservados por hash y herrajes no pintables intactos. CAPRA articulado y transición de dos guardados anteriores/dos nuevos con cuenta temporal eliminada. Evidencia, revisión cruzada y límites en [12j](12j-evidencia-capra-trayectos-v15.md); auditoría vigente `validate-frame-v15.mjs`. No se certifica 100 % ni CAD/Android físico/FPS; aceptación visual abierta. Sin commits.

## Acceso Google · 21/10/2026

Ampliación solicitada durante la revisión de registro: proveedor Google configurado por el usuario en el Cloud existente, verificado por lectura sin exponer credenciales. Entrada y registro ofrecen «Continuar con Google»; PKCE con callback de código, URL limpiada y verificación compartida durante remontajes, liberada al terminar. Enlaces de correo conservan su contrato de token_hash. Mismo provisionamiento user y consulta de permisos; ningún cambio de IAM/RLS ni base.

Validación con Node 24.22.0: build y 210 pruebas correctos (20 de Auth); diez escenarios de navegador escritorio/móvil emulado, con redirección real hasta acceso Google y cancelación. La prueba inicial de una página Google interceptada falló; se sustituyó por comprobación de su pantalla real y pasó en ambos perfiles. No se introdujeron credenciales Google ni se aceptó consentimiento. Pendiente prueba manual completa desde `http://localhost:5174/entrar`; secretos permanecen únicamente en configuración del proveedor. No se valida envío de correo ni se despliega frontend. Sin commits.

## Portada lateral de acceso · 21/10/2026

Sustituida la ilustración de bicicleta de Auth por fotografía real local de salto en Sun Peaks, de Julien Kettmann (procedencia/licencia conservadas en assets/images/landing/README.md). Encuadre sobre ciclista, fondo a sangre, gradiente inferior y titular blanco/lima «Tu próxima línea empieza aquí». Composición compartida de entrada/registro y demás pantallas Auth; formulario y operaciones conservados. Fotografía estática, sin animación continua.

Build correcto con Node 24.22.0. Revisión visual mediante capturas de acceso 1440×1000, registro 1280×1000, tablet 768×1024 y móvil 393×851; sin desbordamiento horizontal y Google visible. En móvil panel oculto y cero peticiones de imagen airtime; escritorio descarga una imagen. Aceptación estética del usuario pendiente. Sin commits.

## Menú de cuenta · 21/10/2026

La cabecera autenticada incorpora un desplegable discreto con nombre/correo de la sesión, rol IAM vigente, correo confirmado y Google vinculado cuando corresponde. Incluye Mis bicicletas y Administración según permisos, y Cerrar sesión mediante la acción existente de Layout y el evento cancelable de cambios pendientes. No hay nuevas consultas, tablas, perfil editable ni avatares remotos. Botón compacto en móvil; Escape restaura foco, clic/foco exterior y navegación cierran el panel, y cambiar identidad descarta el panel anterior.

Validación Node 24.22.0: build correcto, seis pruebas de componente y cuatro recorridos Playwright (escritorio/Pixel 7 emulado) correctos, con sesión sintética/API interceptada sin crear usuarios Cloud. Verifican datos/acciones autorizadas, límites de pantalla, Tab/Escape y conservación del evento cancelable de cierre. Adaptados los recorridos autenticados existentes para abrir primero el menú; no se ejecutó de nuevo la suite Cloud completa. Revisión visual de panel escritorio/móvil con identidad ficticia. Sin commits.

## Selector de categorías · 21/10/2026

Revisión solicitada en Componentes: panel de 254 px (242 px en escritorio estrecho), opciones de 15 px y alto mínimo 44 px, títulos de grupo de 12 px con separadores y guía de pertenencia. Dieciocho iconos SVG propios de piezas con trazo único gris verdoso; acción global con icono de rejilla. Activa con fondo tenue, marca lateral, check y aria-pressed. Conserva siete grupos/dieciocho categorías y todas las reglas de consulta/filtros. Cabecera y Todas las piezas fuera del área de desplazamiento de grupos; móvil mantiene botón Categorías, cierra al elegir y devuelve foco. Sin consultas adicionales ni cambios Cloud.

Validación Node 24.22.0: build correcto; suite discovery existente con cinco escenarios correctos y una omisión prevista del escenario exclusivo de escritorio en móvil. Revisión adicional en 1440×1000, 1024×900 y 393×851: siete grupos y diecinueve botones (Todas + dieciocho piezas), texto/áreas ampliados, cambio a horquillas, búsqueda conservada, última opción Sillines alcanzable, regreso a Todas y sin desbordamiento horizontal. En móvil se comprobó foco al botón tras elegir. Capturas locales revisadas; aceptación estética del usuario pendiente. Sin commits.

## CHERRY BOMB completo v16 · 21/10/2026

Reconstrucción específica publicada de las dos tallas 17″/19″, tras aprobación del método CAPRA. Tres agentes contrastaron lateral/opuesta/diagonales oficiales; superior/diagonal centrales rectos, asiento curvado propio, yugo abierto, balancín perforado y pipa cónica. CAPRA y otros trece cuadros no cambian. Estado: 70 modelos, 146 elecciones, 754 variantes/752 recursos históricos; 22 migraciones y doce tablas propias.

Build/tipos y 224 pruebas/51 archivos correctos con dos workers; 14 vistas generales, diez primeros planos, dos superposiciones, 22 rayos y 28 recursos ajenos por SHA, guardas/tornillería conservadas. CHERRY articulado y transición de dos montajes anteriores/dos nuevos con cuenta temporal eliminada. Auditoría actual `validate-frame-v16.mjs`; evidencia/límites en [12k](12k-evidencia-cherry-bomb-v16.md). No se certifica CAD/100%/Android físico/FPS; aceptación visual abierta y sin commits.

## Continuidad al cerrar fichas y transición de salida · 21/10/2026

Corregido salto al inicio: useWorkspaceLinks identifica el listado por pestaña/filtros, separándolo de slug, detail y variant. Abrir/cerrar o recorrer historial de fichas en el mismo listado no ejecuta scrollTo; cambiar de selección sigue su regla de inicio y las pestañas conservan memoria. Drawer restaura foco con preventScroll. Cierre solicitado por X/exterior/Escape mantiene modal/backdrop durante salida de 220 ms, con salida lateral en escritorio y vertical en móvil; evento animationend más espera de respaldo, bloqueo de duplicados y limpieza al desmontar. Movimiento reducido cierra inmediatamente. Navegación/guardado externos y eventos de cambios pendientes conservan sus acciones.

Validación Node 24.22.0: build correcto; nueve escenarios Playwright correctos, una omisión prevista del caso exclusivo de escritorio en móvil. Nuevas pruebas catalog-scroll recorren tres fichas por X/exterior/Escape desde scroll mayor a 300 px y verifican igualdad de posición, foco a la tarjeta, inicio de animación de salida y atrás/adelante; con movimiento reducido no hay animación ni salto. También pasan los recorridos discovery existentes de navegación/filtros/teclado/anchos. Escritorio y Pixel 7 emulado; no prueba Android físico. Sin escrituras Cloud ni commits.


## GT Force Carbon High Pivot completo v17 · publicado

Dos elecciones Force M/L publicadas desde v13; las otras 28 capturas actuales mantienen sus SHA, incluidos CAPRA v15 y CHERRY v16. Perfil propio, triángulo GT, bieleta calada y conservación selectiva de polea. Build/tipos y 230 pruebas correctos; 14 vistas generales, diez detalles, dos overlays, 22 rayos despejados y tres poses articuladas. Carga/relectura SHA, auditoría remota y transición de dos montajes anteriores/dos nuevos con limpieza de cuenta temporal comprobadas. Estado: 70 modelos, 146 elecciones, 756 variantes/754 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. No se convierten guardados ni prearmadas. Reposición tras v16: `prepare-frame-v17.mjs --apply` → `publish-frame-v17.mjs --apply`; fuente SQL `supabase/operations/publish-frame-v17.sql`. Auditoría vigente `validate-frame-v17.mjs`; validadores anteriores describen sus snapshots. Evidencia y límites en [12l](12l-evidencia-force-v17.md). No certificar CAD/100 %, colisiones exhaustivas o Android físico/FPS. Sin commits.

## FRS V3 Pure White v18 · publicado

Dos elecciones FRS M/L actualizadas desde v13, sin cambiar las otras 28 capturas, prearmadas ni montajes privados. Perfil propio, bieleta calada, soportes superior fijo/inferior móvil, protecciones y fotografía oficial original del cuadro en la tarjeta (65 fotos/cinco renders actuales). Seis mallas por talla; dos GLB cargados/releídos por SHA, build/tipos y 239 pruebas correctos, revisión multivista/pasos/articulación y transición de guardados con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 758 variantes/756 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Reposición tras v17: `prepare-frame-v18.mjs --apply` → `publish-frame-v18.mjs --apply`; SQL `supabase/operations/publish-frame-v18.sql`. Auditoría vigente `validate-frame-v18.mjs`; anteriores describen snapshots. Evidencia y límites en [12m](12m-evidencia-frs-v18.md). Sin certificación CAD/100 %, colisiones exhaustivas o Android/FPS físicos. Sin commits.

## Furious V3 2021 v19 · publicado

Dos elecciones M/L actualizadas desde v13, con perfil propio de la generación 2021, soporte superior ensanchado, bieleta calada, basculante y protecciones; otras 28 capturas intactas. Seis mallas por talla, dos GLB cargados/releídos por SHA y publicados, tipos/build y 247 pruebas correctos; revisión multivista/pasos/articulación y transición con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 760 variantes/758 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Guardados y prearmadas sin conversión. Reposición tras v18: `prepare-frame-v19.mjs --apply` → `publish-frame-v19.mjs --apply`; SQL `supabase/operations/publish-frame-v19.sql`. Auditoría vigente `validate-frame-v19.mjs`; anteriores son snapshots. Evidencia y límites en [12n](12n-evidencia-furious-v19.md). No certificar CAD/100 %, colisiones exhaustivas o Android físico/FPS. Sin commits.

## Fury Carbon High Pivot v20 · publicado

Dos elecciones M/L actualizadas desde v13 para Fury 2023+, con perfil propio, ventana triangular inferior, yugo sólido, guía y protecciones; otras 28 capturas intactas. Cinco mallas por talla, dos GLB cargados/releídos por SHA y publicados; tipos/build y 255 pruebas correctos. Revisión multivista/pasos/articulación y transición con cuenta temporal eliminada. Estado: 70 modelos, 146 elecciones, 762 variantes/760 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Guardados y prearmadas sin conversión. Reposición tras v19: `prepare-frame-v20.mjs --apply` → `publish-frame-v20.mjs --apply`; SQL `supabase/operations/publish-frame-v20.sql`. Auditoría vigente `validate-frame-v20.mjs`; anteriores son snapshots. Evidencia y límites en [12o](12o-evidencia-fury-v20.md). No certificar CAD/100 %, colisiones/cinemática exhaustivas o Android físico/FPS. Sin commits.

## META SX V5 v21 · publicado

Dos elecciones M/L desde v11, perfil propio y VCS conservado; otros 28 recursos intactos. Tipos/build y 263 pruebas correctos, vistas/pasos/articulación, carga/relectura SHA y transición comprobadas. Estado: 70 modelos, 146 elecciones, 764 variantes/762 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. Reposición tras v20: `prepare-frame-v21.mjs --apply` → `publish-frame-v21.mjs --apply`; SQL `supabase/operations/publish-frame-v21.sql`, auditoría vigente `validate-frame-v21.mjs`. Guardados y prearmadas sin conversión. [12p](12p-evidencia-meta-v21.md). Sin certificación CAD/100 % ni commits.

## Nomad v22, S-Works Enduro v23 y Sender v24 · publicados

Revisión por tres agentes con contraste cruzado y coordinación principal. Seis elecciones nuevas, seis GLB cargados/releídos por SHA, guardados anteriores/nuevos comprobados y cuentas temporales eliminadas. Tipos/build y 303 pruebas correctos. Nomad M/L y Enduro S3/S4 conservan anclajes de suspensión y corrigen únicamente saddle visual con contrato exacto; Sender M/L corrige la generación MY25, anclajes visuales y perfil propio de movimiento seleccionado por ID de recurso. No se convierten montajes históricos ni prearmadas.

Estado final del snapshot: **70 modelos, 146 elecciones, 770 variantes/768 recursos históricos, cuatro prearmadas/92 posiciones**, 22 migraciones/doce tablas propias. Reposición secuencial tras v21: prepare/publish v22 → v23 → v24 con contratos SQL propios antes de publicación. Auditoría vigente `validate-frame-v24.mjs`; las anteriores describen sus snapshots. Tarjeta Sender usa render del recurso MY25 identificado; fotografía2021 archivada. Evidencia: [12q](12q-evidencia-nomad-v22.md), [12r](12r-evidencia-enduro-v23.md) y [12s](12s-evidencia-sender-v24.md). No certificar CAD/100 %, colisiones o cinemática exhaustivas ni Android físico/FPS. Sin commits.

## Portada Sender restaurada por el usuario · 21/10/2026

El usuario solicita conservar la fotografía real anterior en el card del Sender. Restaurada exactamente desde `models/catalog-v24/references/prior-card-generation-2021.webp`; es una referencia fotográfica de la plataforma 2021, sin atribuirla al 3D MY25. El modelo 3D v24, sus anclajes y movimiento permanecen. Render retirado archivado, registro vigente en `photos.json`, eliminado de renders actuales. Cobertura: 65 referencias fotográficas y cinco renders. El generador v24 bloquea `--apply` para impedir reemplazarla otra vez. Sin commits.

## SUPREME DH V5 v25 · publicado

Dos elecciones M/L desde v11, silueta propia y HVCS exterior contrastados con fotos/despieces y cinco vídeos oficiales realmente muestreados. Cinco mallas/talla, dos GLB cargados/releídos por SHA y publicados; build/tipos y 313 pruebas correctos. 28 recursos ajenos conservados, multivista/overlay/articulación, pasos completos y transición anteriores/nuevos con cuenta temporal eliminada. Solo saddle visual alineado mediante contrato por ID; suspensión/especificaciones/acabados conservados. Fotos reales y prearmadas sin cambios.

Estado del snapshot: **70 modelos, 146 elecciones, 772 variantes/770 recursos históricos, cuatro prearmadas/92 posiciones**, mismas 22 migraciones/doce tablas propias. Reposición tras v24: `prepare-frame-v25.mjs --apply` → `publish-frame-v25.mjs --apply`; SQL `supabase/operations/publish-frame-v25.sql`, auditoría vigente `validate-frame-v25.mjs`. Anteriores son snapshots; no convertir guardados ni alterar bytes publicados. Evidencia [12t](12t-evidencia-supreme-v25.md). Sin certificación CAD/100 %, cinemática/colisiones exhaustivas o Android físico/FPS. Sin commits.

## Primer despliegue público · https://atlasmtb.netlify.app

El usuario conectó GitHub con Netlify y confirmó publicación. Verificación real: HTTPS/HTTP 200 para portada, componentes, bicicletas, entrada y callback; rutas profundas sirven SPA. Navegador escritorio sin errores JavaScript en cuatro recorridos; foto de portada, foto de catálogo, icono Google y panel de entrada decodifican correctamente. GET público parcial de GLB actual HTTP 206 con cabecera glTF válida. Móvil emulado 393×851: catálogo sin desbordamiento, filtro Horquillas actualiza selección y acceso Google llega al dominio accounts.google.com. No se introdujeron credenciales ni se completó consentimiento/guardado desde producción.

Pendiente de configuración: Auth remoto todavía declara Site URL localhost:5174 y únicamente retorno local; PATCH acotado devuelve HTTP 403. Fuente supabase/auth-config.json preparada para https://atlasmtb.netlify.app y su /auth/callback, manteniendo el local. Requiere guardar esos campos desde Dashboard y volver a verificar; no afirmar válido el regreso OAuth público hasta entonces. Añadir origen público al cliente Google cuando se revise su configuración. Correo/SMTP no validados por esta publicación.

Corregido bloqueo CORS de admin-users para nuevo dominio: fuente modificada antes de despliegue por API, manteniendo locales. Verificación Cloud: preflight público/local 204 con origen exacto, origen ajeno 403, POST de visitante 401. No hay nuevas migraciones, cambios IAM ni Storage. Sin commits.

### Despliegue y Google: confirmación posterior

El usuario confirma que todo funciona después de actualizar las URLs en Dashboard, incluido el acceso Google desde https://atlasmtb.netlify.app. Lectura remota HTTP 200 confirma Site URL público, callback público autorizado, callback local conservado y Google habilitado. Se cierra el pendiente de configuración y retorno Google del primer despliegue. La evidencia de consentimiento/regreso es confirmación manual del usuario; las comprobaciones automáticas previas cubren rutas, recursos, salida Google y CORS. No atribuir a esta confirmación pruebas de correo SMTP ni pruebas automatizadas adicionales. Sin commits.

## Simplificación administrativa y responsive · 26/10/2026

Dirección aprobada en 04a/04b/06c/06f: correo informativo, sin ampliación administrativa de cambio de correo/recuperación ni permisos nuevos; Google como acceso habitual. Roles define nombre/descripción/estado y la matriz será el único editor de asignaciones por rol. Se mantienen IAM y las protecciones existentes. Esta actualización de planes no implementa aún la navegación modular, la retirada del editor duplicado de permisos del panel de rol ni las nuevas barras fijas de los formularios.

Auditoría real del código: no hay dependencia Tailwind; responsive actual en CSS propio. Se añade comprobación reproducible `scripts/validate-responsive.mjs [desktop|mobile]` / `tests/browser/responsive.spec.ts`: cuenta administrativa temporal y limpieza confirmada, sin guardar catálogo, roles, invitaciones o montajes. Los accesos de prueba usan cuentas de correo aisladas para automatizar; no cambian el acceso Google del usuario.

Se comprueban doce recorridos (entrada, portada, componentes, bicicletas, montajes propios, configurador vacío y con prearmada, y cinco pestañas administrativas) en dieciséis anchos: 320,360,390,719,721,759,761,768,1024,1049,1051,1366,1449,1451,1820,1920 px. 192 mediciones por perfil, 384 en total, más doce comprobaciones de panel por perfil. Chromium escritorio y Pixel7 emulado/SwiftShader: ambas pruebas correctas, sin desbordamiento global ni errores JavaScript. Tablas y pestañas conservan scroll interno intencional.

La primera auditoría encontró 5 px de desbordamiento de la paginación de Componentes a320 px. Corrección compartida en `src/app/layout.css`: separación fluida, ajuste de línea y botones móviles con ancho interior menor y altura mínima44 px. La repetición pasa en ambos perfiles. La prueba también se ajustó a la semántica real del configurador vacío (sin Canvas hasta elegir cuadro) y espera el final de la entrada del panel antes de medir sus límites; esos dos fallos iniciales eran de la comprobación, no defectos de la aplicación.

Build y25 pruebas unitarias de Auth/administración correctos. Fuentes de tests versionables, resultados/trazas locales ignorados en `models/local/validation/responsive/results-desktop.json` y `results-mobile.json`. No certifica aceptación visual manual de cada elemento, teclado virtual físico, Android/Brave reales, FPS, entrega de correo ni la implementación del rediseño pendiente. Sin migraciones, cambios de permisos o commits por esta revisión.

## Administración modular implementada · 26/10/2026

Refactorización autorizada de06f completada: navegación agrupada y contexto por identidad, paneles con acciones visibles, roles sin editor duplicado de permisos, matriz filtrable/fija, correo de usuario informativo, consultas paginadas/detalles bajo demanda y conflictos de catálogo/prearmadas. Migraciones023–027 aplicadas, ocho RPC nuevas y ninguna tabla/índice/permiso nuevo. Snapshot tras limpiar temporales:12 tablas/27 migraciones,70 modelos/146 elecciones/782 variantes/780 recursos,4 prearmadas. Los recursos3D, privados y catálogo publicado conservan sus datos.

Build correcto, **503 pruebas unitarias correctas y2 prototipos omitidos** (76 archivos). Ocho comprobaciones de la suite nueva entre escritorio/móvil emulado: recorridos, seguridad/concurrencia/lote de roles y teclado/texto ampliado/acciones fijas. Regresiones administrativas existentes y revocación correctas; auditoría de consultas correcta. Responsive repetido sobre las vistas refactorizadas:448 mediciones y24 límites de panel, sin desbordamiento global ni errores JavaScript. Cuentas y fixtures temporales eliminados. Detalle de comandos, capturas inspeccionadas, fallos iniciales corregidos y límites en [12z](12z-evidencia-administracion-modular.md). Sin certificación de móvil físico/SMTP/FPS, sin publicar frontend ni crear commits por esta implementación.

Auditoría adversarial posterior con tres agentes y revisión cruzada: corregidos sincronización de detalles con historial, respuestas tardías, recuperación de invitación parcial, confirmaciones, paginación/foco de matriz, revisión NULL IAM y reinicio del contexto que interrumpía login/callback. Nueva regresión de aislamiento incluye A→B→A. Migración027 y prueba SQL transaccional aplicadas sin fixtures persistentes; evidencia de recorridos y límites en12z.
