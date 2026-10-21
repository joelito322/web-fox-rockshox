# 12 · Estado de implementación

## Actualización vigente: continuidad v6 y carcasas v7

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
