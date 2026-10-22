# 08 · Fases y validación

Relacionado: [índice del plan](README.md) y [ciclo documental](../README.md).

Estado global: implementación autorizada por el usuario el 19 de octubre de 2026. Se inicia fase 0 y se continúa según dependencias y aceptación de este archivo; ninguna funcionalidad se declara terminada por su documentación. No crear commits de implementación sin una nueva petición explícita.

La entrega es full scope del alcance acordado, no un MVP. Una prueba de concepto dentro de una fase ayuda a comprobar una decisión; no reemplaza la implementación completa de esa función ni reduce el inventario que se acuerde. Se mantienen fuera las funciones no solicitadas.

Avance y límites de las comprobaciones reales en [12](12-estado-implementacion.md); este archivo conserva la aceptación completa de cada fase.

## Alcance y trabajo incluido en la implementación

La referencia de estilo UI/UX aprobada es COMMENCAL; la composición de acceso/registro de 06a y las de 06b/06c están aprobadas. La portada de 06a se conserva como propuesta; identidad gráfica y recursos definitivos siguen pendientes de revisión. La composición administrativa de catálogo/prearmadas quedó aprobada en 06d. En este cierre se incorporan los principios de lenguaje y claridad de interfaz solicitados por el usuario, junto a decisiones de producto y contratos técnicos, sin añadir una fase de aprobación para cada tarea.

### Decisiones confirmadas por el usuario

| Tema | Decisión |
| --- | --- |
| Identidad | ATLAS MTB; eslogan «Cada pieza define tu camino». Logotipo profesional y elegante como representación principal |
| Público | Ciclistas y talleres/tiendas, con prioridad inicial en los ciclistas; sin añadir funciones comerciales a esta etapa |
| Acceso | Portada, catálogo, fichas y comparación públicos; configurador, avisos de montaje, guardado y montajes privados requieren cuenta |
| Portada | Presentación breve como gancho visual de entrada; sin recorrido explicativo extenso ni categorías en portada |
| Catálogo y precios | Modelos reales verificados y selección acotada de variantes útiles; precios orientativos con fuente, mercado, moneda y fecha |
| Cobertura 3D | Todas las piezas del catálogo montables, con genérico identificado y versionado cuando proceda |
| Transmisión | Cambio trasero seleccionable con mando asociado, sin selector separado |
| Cobertura por disciplina | Enduro y descenso, con cuadros reales representados aproximadamente |
| Compatibilidad mecánica | Permitir combinaciones visuales incluso con conflictos conocidos, mostrando avisos |
| Personalización | Colores libres en cuadro y piezas habilitadas; el resto conserva acabados |
| Profundidad | Cada función y campo acordados se implementa y comprueba de principio a fin |
| Infraestructura | Frontend en Netlify, Supabase para servicios y sin workers propios |
| IAM | Auth nativo, login común y esquema propio iam; registro siempre user, user/admin iniciales protegidos; roles personalizados creables y asignables |
| Administración | Usuarios/roles, catálogo y referencias desde web según permiso; Auth Admin solo en Edge Functions de Supabase; sin acceso automático a montajes ajenos |
| Arquitectura | Módulos por funcionalidad con reglas de montaje independientes de React, Three.js y Supabase; principios de Clean Architecture aplicados sin capas obligatorias |
| Código | SOLID con criterio, responsabilidad separada, tipado y reutilización de componentes y reglas sin clonación innecesaria |
| Lenguaje de interfaz | Títulos sin repeticiones vacías y terminología dirigida al usuario; mapeo explícito desde códigos técnicos; voz de producto sin comentarios de asistente ni narración de la pantalla |
| Navegación y fichas | Espacio con pestañas Bicicletas, Componentes y Mis bicicletas; contexto conservado, ficha completa lateral/inferior y detalle dentro del panel del configurador |
| Bicicletas prearmadas | Inicio desde cuadro o composición de referencia, distinguiendo fábrica y ejemplo; aplicar requiere sesión y no guarda automáticamente |
| UI administrativa | Pestañas Usuarios/Roles/Permisos; tablas integradas, panel lateral derecho y matriz horizontal de roles por permisos verticales; [06c](06c-administracion-usuarios-roles-y-permisos.md) |
| Vistas de acceso | Composición aprobada de [06a](06a-portada-y-acceso.md): imagen estática a la izquierda y formulario a la derecha; móvil sin panel fotográfico; registro con confirmación y estado «Revisa tu correo» |
| Estilo y movimiento | Referencia UI/UX COMMENCAL; limpieza, bicicleta protagonista, contraste y carácter deportivo. Movimiento puntual, contenido propio y alternativa estática |
| Fotos y archivos 3D | Fotos de componentes locales en `src/assets/images/`; GLB importados en Supabase Storage. La geometría generada por código no necesita archivos almacenados |

### Trabajo de concreción incluido en el plan

| Pendiente | Qué hay que cerrar | Qué afecta |
| --- | --- | --- |
| Referencias prearmadas concretas | Bicicletas, versiones y tallas a incluir; composición documentada de fábrica o ejemplo ATLAS para cada una | La función está aprobada; falta su inventario y contenido verificable |
| Componentes integrados | Mantener aros/bujes y manillar/potencia separados según 11; otros integrados no están incluidos automáticamente | Su incorporación sería cambio de alcance, no una tarea pendiente obligatoria |
| Inventario concreto | Selección acotada de modelos comerciales reales, tallas y versiones útiles para enduro/descenso; sin cubrir toda la oferta ni combinaciones teóricas; cobertura ampliada por el usuario en [11 y 11a–11m](11-propuesta-de-inventario.md), con M/L y pedalier seleccionable; variantes físicas por completar | Cantidad de recursos, contenido y combinaciones que se deben entregar completas |

No interpretar «inventario concreto» como soporte de todas las marcas o todas las tallas del mercado. Una vez fijado, ninguna entrada acordada para 3D puede quedar como una tarjeta sin representación funcional. Los selectores entre piezas existentes no se limitan por incompatibilidades mecánicas: la restricción pendiente es de cobertura, no de permiso para combinarlas.

### Ejecución y validación dentro de las fases

Por aclaración del usuario, completar datos, diseñar propuestas pendientes, preparar recursos, implementar y validar son trabajos del plan de implementación. No se exige que esos trabajos estén resueltos fuera del plan antes de comenzar. Sus dependencias indican el orden interno: por ejemplo, definir un contrato antes de aplicar su migración o revisar un boceto antes de construir esa pantalla.

| Trabajo incluido | Fases de ejecución | Resultado y aceptación |
| --- | --- | --- |
| Completar inventario, medidas, vigencia y prearmadas | Investigación en 1–2; ingesta y comprobación en 2–3; cobertura en 4–6 | Registros concretos en 11a–11m con fuentes/fecha, gama actual, tallas originales y composición por slot; cada variante incluida funciona y se recupera. Una familia localizada no completa la tarea |
| Cerrar diccionarios y manifiestos 3D | Primeros contratos/recursos en 1; diccionarios definitivos y validadores en 2; manifiestos y versiones completos en 4 | Tipos, códigos, obligatoriedad, unidades, límites y casos inválidos comprobados; anclajes y versiones por variante/talla coherentes con 03a/05. No copiar estimaciones visuales a especificaciones comerciales |
| Diseñar e implementar administración de catálogo/prearmadas | Preparar bocetos en 1–2b; revisión visual, implementación y pruebas en 2b | ASCII de tablas/paneles, campos por categoría y acciones de borrador/publicación; formularios completos, permisos efectivos y errores/recuperación probados. Conservar UI IAM aprobada |
| Preparar y validar recursos visuales/rendimiento | Recursos y dispositivo de referencia en 1; cobertura/optimización en 4; validación integral en 6 | Modelos/manifiestos, revisión de vistas y proporciones, tamaño transferido y métricas con dispositivo/navegador/red identificados; corregir hasta cumplir criterios de 05 sin reducir el alcance aprobado |

La revisión estética se realiza sobre propuestas concretas dentro de la ejecución; no obliga al usuario a resolver SQL, índices, coordenadas o todas las medidas del catálogo. Preguntar cuando falte una decisión real de negocio o una preferencia visual necesaria, continuar las tareas independientes y registrar solo el bloqueo específico. No crear una aprobación general nueva por cada fase.

Las pruebas y correcciones son parte del trabajo necesario para terminar cada función. Una tarea solo se marca completa con su evidencia; una prueba fallida sigue dentro de la fase hasta resolverse. La implementación está autorizada por la solicitud posterior del usuario. Registrar comprobaciones y pendientes en [12](12-estado-implementacion.md).

### Contratos técnicos que debe cerrar el desarrollo

No requieren al usuario decidir detalles de SQL o de Three.js. Deben especificarse y probarse antes de dar por completa su fase:

- Tipos, códigos, campos obligatorios/opcionales y unidades por categoría, distinguiendo datos documentados y parámetros visuales estimados. El [esquema y grupos de campos de 03a](03a-esquema-y-campos.md) y los [contratos de operación de 03](03-datos-y-operaciones.md) son la base; el diccionario final debe corresponder al inventario elegido.
- Manifiesto y anclajes por cuadro/variante soportados, posición estática, tamaños de piezas y piezas pintables. Las referencias reales se necesitan para preparar recursos coherentes; no se prometen automáticamente por elegir una librería.
- Guardado con una única ruta de escritura, transacción, revisión controlada y recuperación de timeout usando un ID conocido. Contrato corregido en el documento 03.
- Referencias visuales y variantes inmutables, conservando versiones usadas por montajes guardados. Una ruta de archivo versionada no basta si después cambia su variante.
- Colores libres persistidos y validados por pieza; un `finish_id` predefinido por sí solo no los representa.
- Continuidad de la intención pública tras entrar; borradores locales separados por cuenta, reautenticación, cierre de sesión y guardado de una instantánea sin borrar cambios posteriores.

### Servicios y accesos disponibles

Proyecto Supabase Cloud creado y credenciales presentes en `.env`. Ya se comprobaron conexión PostgreSQL/permisos CREATE, Auth/API, Auth Admin y listado de Edge Functions. [El documento 07](07-entornos-y-despliegue.md#estado-real-del-entorno-y-accesos) conserva resultados y límites: solo lectura, sin migraciones o despliegues probados. No volver a enumerar URL/clave como datos faltantes ni pedirlos por chat.

Frontend local y backend/base en Cloud; no se prepara un stack/base local de Supabase. Faltan herramientas de implementación cuando se inicie, configuración funcional de Auth/correo, permisos efectivos tras migraciones y origen futuro Netlify. El dispositivo/navegador de referencia se concreta antes de medir 3D. Credenciales administrativas nunca en el frontend.

### Inconsistencias documentales resueltas en esta revisión

Se eliminó la ambigüedad entre una demostración pequeña y la entrega final. Se cambió la política anterior que bloqueaba conflictos mecánicos por el montaje visual libre solicitado. Se añadió la persistencia de color libre, que no cabía en el contrato anterior de acabados. También se unificaron las escrituras de montajes por RPC para evitar eludir validaciones o duplicar incrementos de revisión, se definió recuperación de guardados inciertos y se conservaron las referencias visuales de montajes antiguos.

Son correcciones del plan; la aplicación aún no las implementa. La compilación, Auth, RLS, RPC y renderizado deberán comprobarse durante la ejecución. Esta revisión de documentos no demuestra que esos servicios funcionen.

## Revisión adversarial de datos

Se ejecutó una revisión documental con tres agentes por solicitud del usuario: suspensiones/cuadros, demás componentes y datos/consultas. [El documento 09](09-revision-adversarial-de-datos.md) registra fuentes y contraejemplos. La alternativa de ocho tablas de negocio y TanStack Query se mantiene, corrigiendo contratos; IAM añade las cuatro tablas de 04a. El cambio/mando ya quedó confirmado en la revisión integral posterior. Quedan decisiones de inventario e integrados; el rendimiento, SQL y aislamiento siguen pendientes de comprobación real. Esta revisión no marca fases como implementadas ni mueve documentos a `validation/`.

## Orden y dependencias

```mermaid
flowchart TD
  P0[0 Base reproducible y limpieza] --> P1[1 Estructura visual y prueba 3D]
  P1 --> P2[2 Supabase, datos y acceso]
  P2 --> P2B[2b IAM y administración]
  P2B --> P3[3 Catálogo, fichas y comparación]
  P3 --> P4[4 Configurador completo de referencia]
  P4 --> P5[5 Guardado y Mis bicicletas]
  P5 --> P6[6 Validación integral y Netlify]
```

La prueba 3D temprana sirve para detectar límites de fidelidad y rendimiento antes de ampliar el catálogo. La integración real de Supabase llega antes del guardado. No se crean workers propios ni servicios fuera del conjunto Supabase/Netlify aprobado; Edge Functions forma parte de Supabase.

## Fase 0 · Base reproducible y limpieza

**Objetivo:** disponer de un punto de partida que compile y permita comprobar cambios.

- [x] Revisar archivos modificados/no versionados y conservar trabajo ajeno a la reconstrucción.
- [x] Fijar pnpm y Node compatibles; revisar el permiso de build de esbuild en el workspace actual.
- [x] Resolver la incompatibilidad instalada entre Vitest y Vite, con una elección coherente de versiones.
- [x] Corregir o sustituir el comparador que consume campos inexistentes; retirar la importación sin uso del test de rutas.
- [x] Confirmar instalación reproducible con el lockfile elegido, build y ejecución de pruebas pertinentes.
- [ ] Clasificar contenido reutilizable, revisar fuentes y retirar botones, cifras y promesas ficticias del nuevo recorrido.

Se pueden sustituir páginas y CSS actuales. No borrar imágenes o datos hasta comprobar si una parte del nuevo catálogo los utiliza. Conservar pnpm-lock.yaml y pnpm-workspace.yaml, ya versionados; revisar su coherencia durante la fase 0.

**Aceptación:** build correcto, pruebas arrancan y pasan para lo conservado, un único gestor documentado y contenido de prueba identificado. No se declara arreglado un fallo solo por ocultarlo en configuración.

## Fase 1 · Estructura visual y prueba de viabilidad 3D

**Objetivo:** validar la dirección de interfaz y una bicicleta proporcionada antes de desarrollar todos los detalles.

- [ ] Crear navegación y rutas objetivo, componentes básicos, tokens y distribución responsive.
- [ ] Aplicar la referencia COMMENCAL a jerarquía, contraste, espacio e imagen con contenido propio; revisar portada breve en escritorio y móvil.
- [ ] Preparar y revisar el recurso dinámico propuesto para portada, su imagen alternativa y controles de pausa; comprobar movimiento reducido, reproducción denegada y recurso fallido sin bloquear acceso.
- [ ] Añadir transiciones de controles, paneles y cámara según el documento 06; sin motor 3D decorativo en portada ni librería nueva por obligación.
- [ ] Aplicar los límites de módulos elegidos: reglas de montaje sin SDK/canvas, accesos a datos acotados y ninguna dependencia circular entre configurador y montajes guardados.
- [ ] Crear controles compartidos cuando exista comportamiento común, con etiquetas y errores propios por uso; sin clonar componentes por cada campo ni crear un formulario universal innecesario.
- [ ] Aplicar el vocabulario visible y los mapeos de resultados internos; revisar la jerarquía de títulos de los recorridos implementados.
- [ ] Implementar una primera pantalla de catálogo y la estructura del configurador con datos de prueba explícitos.
- [ ] Preparar los bocetos pendientes de portada y administración de catálogo/prearmadas; revisar propuestas concretas dentro de las fases 1–2b, conservando las composiciones ya aprobadas.
- [ ] Iniciar la investigación del inventario y las referencias físicas de 11a–11m; registrar vigencia, medidas y vacíos sin inventar variantes.
- [ ] Elegir una bicicleta base de referencia y registrar las vistas/medidas disponibles y sus incertidumbres.
- [ ] Mostrar cuadro, horquilla, ruedas, neumáticos, cockpit y transmisión representativos.
- [ ] Probar cambio de una pieza, un acabado y controles de cámara.
- [ ] Registrar tamaños de archivo, primera vista y fluidez en escritorio y un móvil de referencia.
- [ ] Revisar el conjunto desde lateral, frente, superior y tres cuartos con el nivel de aproximación aceptado.

**Aceptación:** bicicleta reconocible y proporcionada, interfaz utilizable en móvil, prueba de cambio visible y ausencia de dependencia de CAD oficial para todas las piezas. Si no se alcanza la calidad visual, ajustar estrategia gráfica, recursos y complejidad de geometría antes de multiplicar variantes. No reducir funciones ni inventario aprobado para cerrar la fase; cualquier reducción de alcance requiere decisión del usuario.

## Fase 2 · Supabase, datos y autenticación

Ampliación 21/10/2026: integrar Google OAuth con PKCE en acceso/registro y callback; verificar errores, canje único, conservación del acceso por correo e intención autorizada. Proveedor Cloud configurado por el usuario y comprobado por lectura. Consentimiento real con su cuenta pendiente hasta prueba manual.

**Objetivo:** conectar catálogo y cuentas reales con aislamiento de montajes.

- [ ] Reproducir las composiciones de acceso y registro aprobadas de [06a](06a-portada-y-acceso.md) en escritorio y móvil; incluir confirmación de contraseña, visibilidad por campo, requisitos reales y estado de confirmación de correo/reenvío.
- [ ] Comprobar teclado móvil, autocompletado, errores asociados, conservación del correo y retorno al origen; no añadir campos de perfil, textos de relleno o panel fotográfico en móvil.

- [x] Preparar en supabase/migrations y aplicar al proyecto Cloud, conservando historial según [supabase/README.md](../../supabase/README.md), las migraciones de doce tablas propias —ocho de negocio y cuatro IAM—, restricciones, índices y RLS de [03](03-datos-y-operaciones.md), [03a](03a-esquema-y-campos.md) y [04](04-autenticacion-y-acceso.md); publicación/transacciones y composiciones prearmadas verificadas.
- [x] Crear en esta fase el núcleo IAM requerido por Auth/RLS: roles/permisos base protegidos, provisionamiento de registro siempre user ignorando metadata, consulta de acceso propio y helpers de autorización vigentes. Ordenar las migraciones para que las políticas/registro no dependan de funciones o datos que recién se crearían en 2b.
- [ ] Cerrar diccionarios por categoría y casos de frontera del documento 09 antes de publicar variantes; no declarar datos aproximados como especificaciones reales.
- [ ] Medir consultas representativas con EXPLAIN (ANALYZE, BUFFERS) y roles/RLS reales en entorno de prueba; índices según operadores, paginación estable y todos los filtros técnicos sobre la misma variante.
- [ ] Integrar TanStack Query sin duplicar el borrador; probar caché por usuario, cancelación y respuestas tardías tras cambio de cuenta, sin reintento automático inseguro de guardados.
- [ ] Completar fichas de variantes, medidas, vigencia y composiciones prearmadas de 11a–11m como trabajo de esta fase; revisar tallajes originales y excepciones.
- [ ] Preparar un seed inicial pequeño y verificable para integración y completar después la ingesta de todo el inventario acordado antes de aceptar el catálogo; no copiar automáticamente todas las afirmaciones del prototipo.
- [ ] Resolver fotos locales por `image_key` y comprobarlas en el build publicado; configurar Storage y rutas versionadas si se usan modelos GLB importados.
- [x] Integrar el cliente Supabase con los equivalentes públicos VITE de las variables actuales; no renombrar/eliminar las credenciales existentes de herramientas ni exponer secretos.
- [ ] Implementar registro, entrada, confirmación, callback, recuperación y cierre según el documento 04.
- [ ] Configurar URLs y plantillas de Auth en el proyecto Cloud de desarrollo; verificar envío de correos con el frontend local.
- [x] Comprobar por API que dos usuarios no pueden acceder a los datos del otro y que las escrituras directas no eluden la RPC.
- [ ] Confirmar que visitantes y user no pueden modificar catálogo; solo operaciones con permiso modifican datos. La subida web de archivos sigue fuera de alcance.
- [ ] Probar portada, catálogo, ficha y comparación sin cuenta; exigir sesión para el configurador y continuar «Probar» tras el acceso, incluidos cancelación, variante retirada y confirmación en otro dispositivo.

**Aceptación:** se puede entrar con una cuenta real de prueba, recuperar su acceso y cerrar sesión; permisos funcionan fuera de la interfaz, no solo mediante botones ocultos. La falta de credenciales o de correo funcional queda como pendiente, no como validación aprobada.

## Fase 2b · IAM y administración funcional

**Objetivo:** ejecutar permisos y administración completos según [04a](04a-iam-roles-y-permisos.md) y [04b](04b-administracion-y-operaciones.md), conservando el acceso común.

- [ ] Reutilizar y verificar el núcleo IAM, roles base, provisionamiento user, consulta de acceso y helpers ya implantados en fase 2; iam sigue sin exposición de tablas ni escritura directa. Esta fase desarrolla las operaciones y UI administrativas, no retrasa prerrequisitos de autenticación/RLS.
- [x] Ejecutar bootstrap del primer admin por el responsable del proyecto, sin credenciales predeterminadas ni ascenso automático del primer registro.
- [ ] Reproducir [06c](06c-administracion-usuarios-roles-y-permisos.md): tres pestañas integradas, tablas, búsqueda/paginación reales, crear usuario desde cabecera y detalle en panel derecho; adaptación móvil accesible.
- [ ] Implementar matriz de permisos: agrupación por área, roles horizontales, sistema en lectura, personalizado editable, borrador local, descarte y guardado transaccional por lote con revisiones; sin concesiones por usuario.
- [ ] Probar matriz con más de un rol modificado: todo se confirma o revierte, se conservan cambios ante conflicto y no se borran permisos de columnas no cargadas.
- [ ] Implementar lista y formularios de roles personalizados: crear, editar nombre/descripción/permisos, asignar, desactivar y eliminar no asignados; validaciones, revisión y límites del actor en servidor.
- [ ] Proteger user/admin, impedir cambios propios que bloqueen acceso y serializar asignaciones/ediciones para conservar al último administrador incluso con solicitudes simultáneas.
- [x] Versionar cada Edge Function bajo supabase/functions/<nombre>/index.ts con su configuración/dependencias necesarias antes del despliegue Cloud.
- [ ] Implementar listado paginado de cuentas, invitación desde Edge Function y asignación segura por identidad; no exponer Auth Admin o correos de otras cuentas a usuarios sin permiso.
- [ ] Completar callback invite y establecimiento de contraseña; comprobar cuenta existente, enlace vencido/repetido, timeout y resultado parcial entre invitación y rol sin promoción indebida.
- [ ] Completar y revisar los bocetos ASCII de administración de catálogo/prearmadas: tablas, panel lateral, campos condicionales por categoría y acciones de borrador/publicación. Esta tarea pertenece a la fase; no se exige resuelta antes de iniciar el plan.
- [ ] Implementar edición/publicación de catálogo y prearmadas con permisos separados, diccionarios de categoría y protección de variantes/recursos usados; sin editar SQL o subir GLB desde UI.
- [x] Revalidar permisos y limpiar caché/formularios administrativos ante revocación, cambio de cuenta o denegación; sin confiar en JWT/metadata o interfaz como única autoridad.

**Aceptación:** user no alcanza funciones administrativas mediante UI, API, RPC o payload manipulado; admin puede crear un rol distinto, elegir permisos válidos, asignarlo y comprobar sus restricciones reales. La creación del rol no inventa una capacidad del software. Invitaciones no anuncian éxito total ante asignación fallida. Usuarios con roles administrativos siguen sin acceder a montajes ajenos. Se comprueban privilegios retirados y ediciones concurrentes, sin sustituir pruebas de servidor por ocultar botones.

## Fase 3 · Catálogo, fichas y comparación

**Objetivo:** conectar información técnica con decisiones sobre variantes.

- [ ] Implementar las composiciones de [06b](06b-espacio-de-trabajo.md): layout persistente y las tres pestañas; conservar filtros, desplazamiento y selección, con URL e historial coherentes y limpieza de datos privados al salir.
- [ ] Completar galería de Bicicletas con completos/cuadros y detalle lateral; preparar y verificar en Supabase todas las composiciones de referencia acordadas, incluyendo ambas disciplinas y tipos fábrica/ejemplo.
- [ ] Listar catálogo publicado con búsqueda, filtros reales, paginación y estados de consulta.
- [ ] Abrir ficha completa en panel lateral/inferior, cambiar entre tarjetas sin cerrar y elegir variantes sin diálogos encadenados; probar entrada directa y cierre con/sin historial previo.
- [ ] Conservar filtros en URL y resolver fichas por slug e identificadores estables.
- [ ] Verificar existencia comercial, fuentes y fecha del inventario seleccionado; agrupar versiones por familia/modelo sin duplicar tarjetas por color ni generar combinaciones inexistentes.
- [ ] Separar modelo comercial y variante; presentar unidades y datos sin confirmar.
- [ ] Mostrar precios orientativos disponibles con moneda, mercado, fuente y fecha; probar datos ausentes y referencias de mercados/monedas diferentes sin conversiones o comparaciones engañosas.
- [ ] Mantener portada breve, con imagen, frase y acción de acceso; catálogo público accesible mediante enlace secundario.
- [ ] Implementar comparación de hasta tres variantes de una categoría, sin duplicados ni rankings engañosos.
- [ ] Conectar «Probar en mi bicicleta» con el slot correspondiente.
- [ ] Revisar redirección de enlaces hash antiguos y enlaces inexistentes.

**Aceptación:** búsqueda y filtros cambian resultados; una ficha identifica su variante; comparación muestra diferencias correctas; los datos ausentes no se convierten en cero, precios inventados o textos `undefined`.

## Fase 4 · Configurador completo del inventario

**Objetivo:** completar el configurador para todas las categorías y variantes acordadas de enduro y descenso, usando la bicicleta de referencia como caso de comprobación, sin limitar a ella la entrega.

- [x] Definir y validar unidades, ejes, origen y manifiestos de recursos.
- [ ] Iniciar desde cuadro o desde cada referencia prearmada/talla acordada; validar referencias retiradas, conservación de intención durante acceso y guardado explícito sin cambios silenciosos.
- [ ] Implementar todos los slots acordados del documento 03 y los inventarios de enduro y descenso; distinguir posiciones delanteras y traseras.
- [x] Resolver modelos GLB y generadores; sincronizar selección de pieza y panel.
- [ ] Implementar acabados, color libre en piezas habilitadas, borrador local versionado y deshacer última sustitución.
- [ ] Implementar avisos de conflictos conocidos y datos insuficientes sin impedir aplicar o guardar combinaciones visuales; revisar dependencias al cambiar cuadro.
- [ ] Manejar selecciones rápidas, recurso fallido, falta de WebGL y pérdida de contexto sin perder el montaje.
- [ ] Adaptar calidad al dispositivo; comprobar presupuestos y liberar recursos.
- [ ] Etiquetar representaciones aproximadas y evitar atribuir precisión no verificada.

**Aceptación:** todos los cuadros, variantes y componentes acordados para el configurador están operativos en ambas disciplinas; la misma configuración reconstruye la misma bicicleta y colores; las sustituciones no producen piezas duplicadas, escalas arbitrarias o estados fuera de orden. Una interferencia derivada de una combinación incompatible permitida se avisa y no se disimula como encaje real. La lista de componentes funciona aunque el visor no pueda dibujarse.

## Fase 5 · Guardado y Mis bicicletas

**Objetivo:** persistir y recuperar el montaje completo con su propietario.

- [x] Implementar `save_build`, transacción, validación estructural y control de revisión.
- [ ] Crear, abrir, renombrar y eliminar montajes con sus estados visibles.
- [ ] Conservar borrador al solicitar acceso y pedir guardado explícito al regresar.
- [ ] Probar sesión caducada, error de red, respuesta incierta, conflicto entre pestañas y cambios realizados durante un guardado.
- [ ] Verificar referencias retiradas del selector y montajes incompletos.
- [ ] Limpiar caché privada y recuperación local al cerrar sesión o cambiar de usuario.

**Aceptación:** tras guardar, cerrar y recargar, se recuperan variantes y acabados correctos. Un fallo de la RPC no deja media configuración. Otro usuario no puede obtenerla ni editarla mediante IDs manipulados. Un conflicto no sobrescribe trabajo silenciosamente.

## Fase 6 · Validación integral y publicación

**Objetivo:** entregar un frontend funcional en Netlify conectado a Supabase.

- [ ] Revisar jerarquía, contraste, teclado, foco, formularios y movimiento reducido.
- [ ] Revisar la propuesta de logotipo: versiones clara/oscura, símbolo pequeño, legibilidad de MTB y eslogan, márgenes y ausencia de marca duplicada.
- [ ] Revisar textos por recorrido: sin encabezados redundantes, códigos internos, errores brutos del SDK o términos técnicos del software sin conversión a lenguaje de usuario.
- [ ] Completar recorridos en 360, 768 y 1440 px; probar al menos un navegador de escritorio y uno móvil reales.
- [ ] Medir la bicicleta de referencia con red y dispositivo identificados; ajustar calidad si es necesario.
- [ ] Añadir configuración de Netlify y reescritura de rutas limpias.
- [ ] Configurar variables públicas y verificar exclusión Git de entornos.
- [ ] Probar desde la URL publicada rutas profundas, Auth, recuperación, consulta y guardado.
- [ ] Configurar correo apropiado para registro público y revisar cuotas vigentes.
- [ ] Registrar evidencia y pendientes; mover el conjunto a validation cuando el alcance esté implementado.
- [ ] Tras superar los criterios, actualizar resultados y mover el conjunto a finished según docs/README.md.

**Aceptación:** recorrido completo de catálogo a montaje guardado en el dominio publicado, sin fallos bloqueantes ni acciones que aparenten funcionar. El rollback del frontend y la compatibilidad con la migración aplicada están entendidos.

## Matriz de aceptación funcional

| Caso | Resultado esperado | Método |
| --- | --- | --- |
| Instalación y build | Resultado reproducible sin errores | Lockfile fijado, instalación y build |
| Límites de arquitectura | Reglas del montaje comprobables sin red/canvas; catálogo no carga el motor 3D; sin importaciones circulares | Revisión de imports, prueba del modelo y análisis del build |
| Reutilización de controles | Comportamiento compartido consistente y etiquetas/errores adecuados a cada campo | Revisión de composición y pruebas de los controles reutilizados |
| Traducción de resultados | Códigos conocidos con texto específico; desconocidos con fallback seguro; sin datos internos expuestos | Probar respuestas conocidas, desconocidas y errores de servicio |
| Inventario y precios | Modelos reales, variantes comerciales documentadas, sin duplicaciones por color; precio fechado y contextualizado o ausencia explícita | Revisión de fuentes de todo el inventario, UI de ficha/comparación y actualización de referencia sin alterar montajes |
| Acceso y continuidad | Páginas públicas accesibles; editor exige sesión y retoma una intención válida sin guardar automáticamente | Navegación directa, recarga, cancelación y acceso con o sin intención local |
| Pestañas y paneles | Contexto conservado, URL compartible, Atrás/Adelante y un solo panel de detalle | Navegación, entrada directa, variante múltiple, cambios rápidos, cierre con foco y móvil sin gestos obligatorios |
| Registro y roles base | Registro público asigna solo user; claves/roles base protegidos | Alta con metadata/payload manipulado, primer registro, fallo de provisionamiento y asignación desde el proyecto |
| UI de usuarios y roles | Tablas sencillas, crear/detalle en panel, campos editables autorizados y búsqueda global real | Teclado, selección, recarga, error, cuenta existente, resultados en otras páginas y móvil |
| Matriz de permisos | Roles horizontales, permisos por área, sistema protegido y guardado explícito por lote | Dos roles modificados, conflicto/rollback, columnas no cargadas, navegación con borrador y equivalencia móvil |
| Roles configurables | Crear y asignar rol personalizado funciona; permisos no otorgables rechazados; roles en uso protegidos | UI y RPC directa, revisión concurrente, sistema/inactivos y reasignación explícita |
| Autorización vigente | Una sesión no conserva administración tras perder permiso; último admin protegido | Token anterior, formulario viejo, peticiones simultáneas y cambio de cuenta |
| Invitación administrativa | Identidad/permiso verificados, contraseña del destinatario y resultados parciales correctos | Edge Function sin sesión, user, rol autorizado, cuenta existente y fallo Auth/IAM |
| Administración de negocio | Escrituras/publicación autorizadas, sin destruir referencias usadas | Funciones directas, campos protegidos, borradores, nuevas versiones y montajes previos |
| Consultas y aislamiento | Filtros en una misma variante, modelos únicos paginados, payload acotado y caché privada aislada | Planes de lectura bajo RLS, ausencia de N+1, cambios rápidos de filtros y cuenta durante consultas/guardados |
| Referencias prearmadas | Fábrica/ejemplo identificados, composiciones reales verificadas; aplicar copia un borrador propio sin guardar automáticamente | Todas las referencias/tallas acordadas, datos retirados, sesión ausente y actualización de referencia sin cambiar montajes previos |
| Acceso y registro visual | Distribución aprobada, campos y textos correctos; confirmación de correo y reenvío; móvil sin imagen | Revisión en escritorio y móvil con teclado abierto; foco, autocompletado, visibilidad de cada contraseña y errores recuperables |
| Movimiento | Respuesta visual breve, portada operativa con imagen fija, pausa accesible y respeto al movimiento reducido | Móvil real, teclado, reproducción denegada, recurso fallido y pestaña oculta |
| Jerarquía y vocabulario | Títulos informativos, sin repeticiones vacías; mismos conceptos nombrados de forma consistente; sin comentarios de asistente o narración de la pantalla | Revisión contextual de catálogo, ficha, configurador, cuenta y guardado |
| Visitante filtra y abre ficha | Consulta real y URL consistente | Prueba de interfaz |
| Comparar variante duplicada o cuarta | Selección coherente, máximo tres | Prueba de lógica/interfaz |
| Registro y recuperación | Correo, callback y sesión reales | Integración con cuenta de prueba |
| Usuario B manipula ID de A | Lectura y escritura denegadas | Data API y RPC con sesiones separadas |
| RPC falla al guardar piezas | No quedan escrituras parciales | Integración de base en entorno de prueba |
| Dos pestañas guardan misma revisión | Segunda recibe conflicto | Integración y recorrido manual |
| Cambia medida o cuadro | Se conserva o revisa lo afectado | Prueba de reglas y revisión visual |
| Mezcla piezas mecánicamente incompatibles | Se permite aplicar, guardar y recuperar, con avisos | Integración de montaje y guardado |
| Color libre en pieza habilitada | Se aplica a sus nodos y reaparece al abrir el montaje | Interfaz y persistencia real |
| Color libre en pieza no habilitada | Se rechaza el dato inválido; se mantiene el acabado válido | RPC con entrada manipulada |
| Timeout tras crear montaje | Se localiza por el mismo ID y no se duplica | Interrumpir respuesta tras confirmar transacción |
| Cambia recurso publicado | El montaje anterior conserva su versión | Integración con variantes versionadas |
| Cambios rápidos de piezas | Prevalece la última selección preparada sobre sus dependencias vigentes | Demorar la carga de una horquilla, cambiar cuadro y comprobar que no se aplican anclajes calculados para la base anterior |
| Falla GLB o WebGL | Lista y borrador siguen disponibles | Simular fallo de recursos/contexto |
| Foto local del componente | Se resuelve después del build; clave ausente usa placeholder | Comprobar catálogo en preview de producción |
| Pieza procedimental | Se dibuja con parámetros disponibles sin solicitar un GLB ni subir geometría a Storage | Inspeccionar peticiones durante su construcción e interacción |
| Sesión expira o se cierra | Sin datos privados de otra cuenta | Recorrido con dos cuentas |
| Recarga de ruta en Netlify | Pantalla correcta sin 404 de servidor | URL directa publicada |
| Git y entorno | Archivos reales ignorados, plantilla vacía permitida | check-ignore y ls-files |

Escribir pruebas donde aporten valor a lógica de ensamblaje, persistencia, permisos y recorridos. No exigir un test que copie cada línea de CSS ni tests decorativos para esta entrega documental. Las pruebas SQL/RLS se realizan con cuentas y datos de prueba controlados en el proyecto Supabase Cloud de desarrollo; un mock del SDK no demuestra aislamiento.

Esta matriz organiza la validación; no limita las pruebas a un recorrido feliz por pantalla. Para cada campo funcional acordado se comprueban entrada, ausencia permitida, valores inválidos, aplicación al dominio, persistencia y recuperación cuando correspondan. Para cada operación se comprueban permisos y errores relevantes. La cobertura debe incluir todo el inventario definido para el configurador, no solo la bicicleta usada en la primera prueba técnica.

## Evidencia de la revisión inicial

Fecha: 18 de octubre de 2026. Entorno: repositorio local antes de reconstruir la aplicación.

| Comprobación | Resultado observado |
| --- | --- |
| Lectura del código | Prototipo React 18/Vite; catálogo local, detalle y comparador; sin Supabase ni 3D |
| `npm run build` | Falló: campos inexistentes en Compare y una importación no usada en routing.test |
| `npm run test -- --run` | Falló al iniciar: Vitest instalado requiere una exportación `vite/module-runner` ausente en Vite instalado |
| `git ls-files` sobre entornos | No había archivos de entorno rastreados al iniciar la documentación |

Las fallas anteriores permanecen sin corregir en esta entrega de planificación; se resolverán en fase 0. La revisión documental, enlaces y exclusiones Git de esta entrega se registran aparte al finalizarla y no equivalen a validar la aplicación futura.

### Revisión de esta entrega documental

En una revisión anterior del 18 de octubre de 2026 se comprobaron los 10 documentos Markdown y sus 41 enlaces internos, cifras de esa revisión y no del conjunto ampliado actual: sin destinos inexistentes, bloques de código sin cerrar o ejemplos JSON inválidos. Hay 14 diagramas Mermaid; se revisaron sus relaciones y bloques, sin ejecutar un renderizador de Mermaid.

En una revisión histórica se comprobaron exclusiones Git y una plantilla vacía; esos cambios se retiraron entonces para mantener la fase documental. Después, al preparar la conexión real, se aplicaron las exclusiones de `.env` y sus variantes. El estado vigente —proyecto Cloud creado, variables disponibles y lecturas verificadas— está centralizado en [07](07-entornos-y-despliegue.md); no interpretar la retirada histórica como falta actual de protección o credenciales. Esta comprobación no valida todavía la nueva aplicación.

También se retiraron los cambios anticipados de logo, cabecera y HTML, junto con los recursos gráficos generados. El código fuente del prototipo conserva su estado anterior; `.gitignore` incorpora la exclusión de variables locales descrita en 07; las decisiones de ATLAS MTB y su eslogan permanecen documentadas como requisitos futuros.

### Comprobación de la reorganización documental

El 18 de octubre de 2026 se revisó el conjunto ampliado: 14 documentos en `docs/` y `AGENTS.md`, 89 enlaces locales y 4 anclas internas, sin destinos rotos. Se comprobaron cierres de bloques y ejemplos JSON; los 16 bloques Mermaid se comprobaron estructuralmente, sin renderizador. `git diff --check` no detectó errores de espacios. Las composiciones aprobadas se trasladaron completas a 06a/06b, y el esquema quedó centralizado en 03a. No se ejecutaron build, pruebas de aplicación o SQL por tratarse exclusivamente de documentación.

### Comprobación documental de la ampliación IAM

El 18 de octubre de 2026 se comprobaron 16 documentos en docs y AGENTS.md: 118 enlaces locales y 4 anclas, sin destinos rotos, bloques abiertos o JSON inválido. Los 19 bloques Mermaid se revisaron estructuralmente sin renderizador. `git diff --check` sin errores. Se actualizaron exclusiones anteriores de panel/roles y el total de tablas. La revisión multiagente histórica de 09 no se atribuye retroactivamente al nuevo IAM. No se ejecutaron SQL, Auth, Edge Functions o pruebas de aplicación; los criterios de 2b siguen pendientes.

## Estado vigente de ejecución

La implementación está autorizada y en curso desde el 19 de octubre de 2026. El estado comprobado y los pendientes se mantienen en [12](12-estado-implementacion.md), con el contexto de acceso en [07](07-entornos-y-despliegue.md). Las comprobaciones históricas anteriores no describen el estado actual del código.

El frontend ya integra las variables públicas, las herramientas están fijadas y hay trece migraciones y una Edge Function aplicadas en Cloud, con fuentes locales. Pasan build, treinta y cinco pruebas unitarias y los contratos API/SQL; hay pruebas reales de navegador con cuentas y recursos temporales. Ninguna de esas comprobaciones declara completo el alcance de esta matriz. Quedan dentro de las fases la cobertura comercial del inventario, sus recursos y medidas, la aceptación administrativa y de recuperación ante fallos, las mediciones y la integración final de correo/dominio. El usuario confirmó que callbacks y plantillas de Dashboard siguen pendientes; el callback de recuperación se probó por separado mediante un enlace temporal sin envío de correo.

No mover el conjunto a `finished/` ni declarar terminado el catálogo por tener publicados los primeros conjuntos enduro/DH o por una composición sintética de aceptación. No hace falta una nueva autorización rutinaria para seguir con los trabajos de implementación ya acordados; no crear commits ni publicar el frontend sin la solicitud correspondiente.

## Revisión integral adversarial posterior

[10 · Auditoría integral](10-auditoria-integral-de-planes.md) registra la revisión de tres agentes de producto/UX, datos/IAM y arquitectura/operación, incluyendo el IAM ampliado. [11 · Inventario e ingesta documental](11-propuesta-de-inventario.md) responde a la solicitud del usuario y requiere revisión antes de fijar variantes. Nada se considera implementado por esta auditoría.

Añadir a la aceptación: dependencias de permisos y selectores autorizados; edición pública sin bypass de publicación; login de roles limitados sin bucles; categoría/parentesco y fallback visual inmutables; copia con retiradas; sustituciones fuera de orden y retirada conjunta de cambio/mando; cobertura 3D de cada variante del inventario finalmente aprobado.

### Ampliación documental posterior de inventario

La propuesta de cuatro cuadros/una talla se sustituye por la cobertura de marcas y categorías de 11a–11m. M y L son prioridades donde existan; conservar tallajes originales distintos, sin equivalencias inventadas. Pedalier ahora seleccionable (`bottom_bracket`), plato incluido con bielas; el modelo de doce tablas se conserva. Mantenimiento por modelo/generación como información documental, sin agenda. Manillar/potencia/sillín sencillos genéricos identificados.

Antes de cerrar fase 2: verificar diccionarios, códigos y fuentes por categoría, incluida estructura de mantenimiento y nuevas interfaces de pedalier; antes de cerrar fases 3–5: filtros aplicables, cada variante y talla acordadas, recursos inmutables, avisos, guardado y recuperación. Las familias localizadas no se contabilizan como variantes ingeridas ni como cobertura final validada.

Delimitación de ingesta confirmada después: solo gama actual documentada. Exigir evidencia de vigencia por referencia y no incluir históricos por tener manual; conservarlos únicamente como contraejemplos. Comprobación documental de esta ampliación: 34 Markdown, 222 enlaces locales, 30 anclas y 71 bloques cerrados sin errores; JSON de ejemplo válido y `git diff --check` limpio. No se ejecutaron pruebas de aplicación o servicios.

### Dictamen documental del 19 de octubre de 2026

La [reevaluación multiagente de 10](10-auditoria-integral-de-planes.md#reevaluación-de-procedencia--19-de-octubre-de-2026) considera procedente iniciar las bases cuando el usuario autorice implementación. Los contratos corregidos mantienen el alcance completo. Completar variantes/vigencia, diccionarios finales, recursos y UI administrativa de negocio son tareas dentro de las fases, con dependencias internas y criterios de aceptación; no requisitos externos que el usuario deba resolver antes de iniciar el plan. El dictamen no inicia la implementación ni certifica el producto.

Ampliación posterior de fases 3/4: cinco fuentes comerciales, 53 modelos y 116 variantes publicados de 128, con 114 variantes seleccionables y dos capturas anteriores conservadas, incluyendo seis cuadros con dos geometrías y cuatro modelos de neumático. Se comprobó recuperación local tras reautenticación y limpieza al salir expresamente. La revisión interna de doce borradores no autoriza publicarlos ni sustituye fidelidad final; pendientes y evidencia en 12/12a.

### Ampliación de movimiento compartido · 19/10/2026

Como parte del movimiento de fase 1 y su aplicación transversal a las fases siguientes, ejecutar la revisión solicitada en [06](06-ui-y-ux.md): transiciones de secciones sin remontar estado, interacciones de controles y selección, entrada de paneles y avisos, adaptación móvil y movimiento reducido. Resultado esperado: tratamiento consistente en acceso, catálogo, comparación, montajes y administración, sin librerías nuevas ni cambios de reglas/escena. Validar navegación/foco, errores y preferencia reducida con pruebas de navegador y las comprobaciones de build existentes; conservar evidencia en 12 sin dar por cerrada la aceptación integral del producto.

### Cobertura fotográfica del catálogo · 19/10/2026

Solicitud del usuario: completar la cantidad de fotografías de componentes. Dentro de las fases 1/3, auditar modelos publicados y sus claves, localizar fotos del producto en fuentes comerciales, descargar/optimizar assets locales y registrar procedencia y alcance visual. Reutilizar fotografía de familia solo cuando corresponda al modelo, sin prometer acabado o medida exactos; nunca asignar a un cuadro una bicicleta completa sin identificarlo. Mantener los genéricos ATLAS diferenciados de productos comerciales. Conectar tarjetas/fichas al mismo resolver, comprobar imágenes cargadas y cobertura real y documentar pendientes concretos en 12. No modificar reglas 3D ni publicar variantes pendientes para completar fotografías.

Revisión de galerías solicitada posteriormente: ejecutar la nueva dirección de Componentes/Bicicletas de 06b dentro de fases 1/3. Resultado: cabecera compartida, tarjetas e imágenes con mayor jerarquía, filtros integrados y respuesta de interacción; aceptación por navegación, filtrado, versiones/paneles, teclado, móvil sin desbordamiento y movimiento reducido, además de revisión de capturas. No modifica operaciones Cloud o alcance del inventario.

Ampliación solicitada de ancho adaptable: retirar el límite de contenedores de trabajo y adaptar rejillas/márgenes conforme a 06. Incluir comprobación en pantallas de 1920/2560 px además de móvil, y regresión de tablas, paneles y navegación. Conservar límites legibles de formularios cortos, sin confundirlos con el ancho exterior de la vista.

### Ampliación autorizada: geometría exterior de los 53 modelos

Dentro de las fases de recursos/visor y validación: ejecutar investigación fotográfica y audiovisual, perfiles v3, actualización de contrato/publicación, revisión multivista y regresión de montaje según [05a](05a-fidelidad-modelos.md). Resultado exigido: todos los modelos con recurso nuevo explícito, sin sustituir versiones guardadas ni publicar borradores; evidencia de cobertura y límites de parecido/rendimiento. No considerar un porcentaje de parecido validado por la mera existencia de perfiles.


Resultado de ejecución 20/10/2026: perfiles v3/v4 implementados para los 53 modelos y 128 capturas; publicación remota, conservación de generaciones, contratos, selección y persistencia comprobados. Se mantiene abierta la aceptación de parecido por modelo y de fluidez física Android. La medición SwiftShader no llega a 30 fps; sus valores y límites están en [12b](12b-evidencia-geometria.md). No declarar la fase de calidad visual/rendimiento completamente aceptada por la sola cobertura de recursos.

Corrección de método aprobada después del rechazo visual de v3/v4: dentro de esta misma fase, ejecutar primero el conjunto de referencia de [05a](05a-fidelidad-modelos.md#replanteamiento-aprobado-siluetas-verificables). Resultado: trazado lateral, fuentes audiovisuales revisadas, archivo Blender editable, GLB por pieza y herramienta interna de referencia/render/superposición. La revisión del conjunto precede a la extensión al inventario y a nuevas publicaciones. Después: transformaciones de montaje por componente, nuevos manifiestos/capturas sin alterar versiones guardadas, pinturas/selección/persistencia y regresión de rendimiento. Cada una continúa dentro del plan de implementación; el conjunto de referencia no cierra los 53 modelos.


Ejecución posterior del método aprobado: la generación v5 está integrada y publicada, con 76 capturas GLB de cuadros/suspensión, mejoras paramétricas por categoría y conservación de recursos anteriores. Transición Cloud, guardado/reapertura, color, selección y descargas reales comprobados; las pruebas ya no se limitan al GLB sintético histórico. El inventario mantiene 53 modelos y 114 elecciones públicas. La revisión física de Android y el objetivo de 30 fps siguen abiertos; en software no se alcanzó. Detalle de alcance, reutilización de geometría dimensional, medidas estimadas y evidencia en [12b](12b-evidencia-geometria.md) y [fuentes v5](../../models/catalog-v5/README.md).


## Revisión de continuidad exterior v6/v7

Dentro de las fases de recursos, visor y aceptación: investigación de despieces adicionales, contrapartes de bieletas, conexión de soportes/poleas, continuidad de coronas/ojos y montaje de pinzas; fuentes editables y recursos nuevos conservando historial. Migraciones 017/018 y publicación Cloud aplicadas; sin ampliación de campos de negocio. Validación de contactos con controles negativos, parseo GLB, pruebas de montaje/pintura/selección/persistencia y revisión desde ambos lados, arriba, abajo y perspectivas. Evidencia, cobertura real y límites en [12c](12c-evidencia-continuidad.md); parecido por modelo y aceptación física móvil siguen abiertos.

Aceptación de rendimiento v6/v7 abierta: escena DH aislada de 5,454 s supera el objetivo de 5 s con 10 Mbps/80 ms; SwiftShader móvil observa 13,4/14,8 fps. La fase de optimización debe reducir carga/coste conservando geometría y versiones antes de cerrar rendimiento; Android físico sigue pendiente. Ver medición reproducible y límites en 12c.


## Miniaturas del montaje guardado

Cambio autorizado dentro de las fases de recursos, persistencia y UI: [05b](05b-miniaturas-montajes.md). Reutilizar escena, captura estática única, políticas Storage por revisión/propietario y prearmadas publicadas, integración de tarjetas, precálculo público y recuperación de miniaturas existentes. Aceptar con montaje vacío/incompleto, colores, guardado exitoso/conflicto, aislamiento entre cuentas y visitante, cambio de revisión, fallos de captura y ausencia de WebGL por tarjeta. Conservar pendientes/evidencia de ejecución en 05b.

## Auditoría transversal de carga de datos · 21/10/2026

Dentro de las fases de catálogo, persistencia y visor: revisión multiagente de consultas SQL con RLS, solicitudes del navegador y preparación 3D; corregir búsquedas por tecla, repetición/serialización y transferencia innecesaria. Reutilizar datos con límites de vigencia e invalidación, claves privadas por cuenta, fuentes agrupadas de miniaturas y precarga por intención. Aceptar con conteo de solicitudes, payload antes/después, cambios de cuenta, publicaciones, borrado paginado y selección/guardado/reapertura de montajes reales. Resultado y límites en [12d](12d-rendimiento-consultas.md); no añadir índices sin evidencia ni cerrar objetivos físicos de fluidez con estas pruebas.

## Imágenes completas y complementos comerciales · 21/10/2026

Solicitud adicional: eliminar fondos visibles de fotografías, completar imágenes pendientes y añadir modelos comerciales reales de manillar/potencia/tija/sillín con recurso 3D propio. Dentro de fases de inventario/recursos/montaje: verificar fuentes actuales y variantes concretas, preparar fotos transparentes, perfiles y recursos nuevos inmutables, validar contratos/avisos de interfaces, publicar fuente versionada y probar selección, pintura, guardado/reapertura y montajes antiguos. Mantener categorías/tablas y genéricos históricos; no modificar modelos publicados. Selección acotada y evidencia en 11n/12d y procedencia de assets en `src/assets/images/catalog/README.md`.

## Ampliación gravity · 21/10/2026

El usuario amplía inventario y permite generaciones anteriores identificadas. [11o](11o-ampliacion-gravity.md) integra investigación de fichas/medidas, fuentes fotográficas y limpieza, recursos GLB propios, importación aditiva y pruebas de catálogo/montaje/guardado/reapertura. La delimitación histórica anterior de solo gama actual queda sustituida por esta decisión, sin convertir los archivos históricos en vigentes. Conservar recursos y montajes anteriores; ninguna tabla nueva ni cambio de Auth/IAM. Estado y aceptación se completan en 11o/12.

Resultado gravity: once modelos/26 variantes publicados, recursos GLB y fuentes conservados, 70 modelos/146 elecciones totales. Build/101 pruebas correctos; selección, guardado, miniaturas y reapertura de los siete cuadros con suspensión nueva comprobados en escritorio y móvil emulado, con límites/incidencia inicial en 12. El trabajo de inventario y recursos de esta ampliación está integrado; la aceptación visual del usuario, Android físico, 30 fps, red fría y Auth/correo siguen sus criterios generales, sin declararlos cumplidos por ampliar el catálogo.

### Segunda optimización integral de consultas y vistas · 21/10/2026

Trabajo integrado en las fases de datos, administración, catálogo y montaje: revisión cruzada de tres agentes, proyecciones actuales/históricas, lotes compartidos, comparación, búsquedas administrativas, permisos y render/miniaturas. Resultados medidos y aceptación por recorrido en [12d](12d-rendimiento-consultas.md). Incluye pruebas reales Cloud y navegador; no sustituye la aceptación pendiente de hardware Android ni la escena fría con red limitada.

### Movimiento de suspensión por recorrido · 21/10/2026

Ampliación implementada: quince perfiles exteriores estimados, articulación de cuerpos rígidos/telescópicos y controles temporales de compresión, reproducción, pausa y reposo. Contrato y límites en [05c](05c-movimiento-suspension.md); evidencia de pruebas y revisión en [12](12-estado-implementacion.md). Algunas guías tienen intervalos pequeños por referencias incompletas: no equivalen al recorrido comercial. No cálculo de peso ni motor físico; la aceptación visual del usuario y las limitaciones generales de hardware siguen abiertas.

### Armado por grupos, medidas y pares

Integrar [06e](06e-armado-guiado.md) en las fases de UI, reglas y aceptación: índice actual, agrupación, filtros de medida sin mutar selección, pares atómicos (incluido Mixto), paletas accesibles y revisión escritorio/móvil; conservar guardado, deshacer y rendimiento.

### Revisión integral de los quince cuadros

Solicitud incluida en las fases de recursos, configurador y validación: [05d](05d-revision-integral-cuadros.md). Investigar referencias multivista/vídeo, revisar por generación, reconstruir perfiles, corregir conexiones por inferencia explícita y publicar nuevas identidades tras comprobarlas, conservando versiones y montajes anteriores.

Estado: revisión implementada y publicada; evidencia y límites de aceptación en [12e](12e-evidencia-cuadros-v10.md). La revisión visual final del usuario sigue abierta.

Continuación de la misma rúbrica: pasos de montaje y pared interior de dirección v11, sobre copias inmutables de v10. Contrato actualizado en 05d y evidencia en [12f](12f-evidencia-pasos-v11.md); incluye investigación previa heredada, recorte offline, rayos de paso, primeros planos, montaje y transición de guardados.

Estado de la continuación v11: implementada y publicada; rayos, vistas, articulación y transición de guardados verificadas en 12f. Se mantienen sus límites documentados y la aceptación visual pendiente.

## Corrección de dirección exterior v12

Dentro de la fase de fidelidad: revisar los quince cuadros y treinta tallas según 05d; corregir extremos fuera de la pipa y uniones exteriores sin modificar versiones publicadas. Resultado: perfiles de dirección, capturas nuevas, fuentes y publicación SQL acotada. Aceptación: vistas lateral/frontal/posterior/inferior/axial, paso despejado también fuera de los bordes, anclajes y especificaciones conservados, inspección con horquilla, transición de montajes y auditoría remota. Avance y límites en [12g](12g-evidencia-direccion-v12.md).

## Reversión solicitada de la pipa v12 · 21/10/2026

El usuario pide deshacer la última corrección global: algunos modelos anteriores estaban bien. Se restaura v11 en las treinta elecciones de cuadro y en las prearmadas, conservando todo el historial y sin cambiar montajes privados. V12 queda retirado y no debe republicarse. Fuente de reversión: `supabase/operations/rollback-frame-v12.sql`; aplicar/verificar con `node scripts/rollback-frame-v12.mjs --apply` (sin `--apply` solo comprueba). Las cifras históricas siguen en 728 variantes/726 recursos y 146 elecciones. Las comprobaciones de publicación v12 describen su snapshot anterior, no la elección actual. Cualquier nueva corrección debe aislar modelos defectuosos y comprobar simetría real sin duplicar detalles legítimamente asimétricos.

## Continuidad localizada v13

Alcance de 05d: proteger los cinco cuadros aprobados y corregir solo las veinte variantes de los otros diez. Reconstrucción offline, conservación de cuerpo/anclajes, secciones simétricas, rayos de paso, vistas multivista y primeros planos, carga por SHA, revisión articulada de los quince montajes, transición de guardados y auditoría remota forman parte de esta fase. Evidencia y estado en [12h](12h-evidencia-uniones-v13.md). No reactivar v12 ni actualizar automáticamente los montajes privados.

Estado v13: implementado y publicado con las comprobaciones de 12h correctas. Los cinco modelos aprobados permanecen intactos y la aceptación estética final del usuario sigue abierta.

## Ajuste individual CAPRA v14

Aplicar la solicitud localizada de 05d a las dos tallas del CAPRA: referencias, reconstrucción de raíces, conservación del resto del cuadro y de los catorce modelos ajenos, vistas, simetría/pasos, montaje articulado, carga por SHA y transición de guardados/publicación. Evidencia y estado en [12i](12i-evidencia-capra-v14.md). No reconstruir ni actualizar otros cuadros por esta solicitud.

Estado del ajuste CAPRA v14: implementado y publicado; comprobaciones de 12i correctas. Pendiente de aceptación visual del usuario, sin ampliar la corrección a otros modelos.

## Reconstrucción CAPRA completa v15

La solicitud posterior exige revisar los trayectos completos: referencias multivista y tres agentes adversariales, retrazado de ejes/contornos, rectas explícitas con radios locales, verificación negativa de curvas distribuidas, foto registrada y revisión cruzada antes de carga, anclajes/pasos/montaje, publicación acotada y transición de guardados. Evidencia en [12j](12j-evidencia-capra-trayectos-v15.md). No tratar v14 como aceptación de la silueta completa ni certificar 100 % sin fuente dimensional.

Estado v15: reconstrucción específica implementada y publicada, revisión cruzada y comprobaciones de 12j correctas. La fidelidad física absoluta y la aceptación visual del usuario no se deducen de estas pruebas.

## Evidencia fase 2 · Google OAuth · 21/10/2026

Integrados «Continuar con Google» en entrada/registro y callback PKCE separado de confirmación/invitación/recuperación. Proveedor Cloud habilitado por el usuario y comprobado mediante lectura; sin cambios de IAM, tablas o políticas. Node 24.22.0: build correcto, 49 archivos/210 pruebas correctas, incluidas 20 de Auth. Navegador: diez escenarios entre escritorio y Pixel 7 emulado, incluida salida real hacia Google, cancelación limpia y recorridos públicos. La primera aserción de salida esperaba una página interceptada que Chromium no sustituyó tras la redirección; se corrigió para comprobar la pantalla real de Google y ambas ejecuciones pasan. El origen aislado de pruebas 4180 verifica salida y errores; el retorno autorizado para el recorrido real es localhost:5174. Pendiente consentimiento y regreso real con cuenta del usuario; no declarar aceptado ese recorrido completo ni el correo SMTP.

### Fase 2 · Revisión visual de acceso solicitada

Sustituir ilustración lateral por fotografía real local de acción, según boceto de 06a, conservando formularios y acceso Google. Comprobar carga/recorte en acceso y registro de escritorio, y móvil sin panel/descarga fotográfica. Sin cambios de Auth o datos.

Resultado de la revisión visual de acceso: implementada fotografía estática de Sun Peaks y titular blanco/lima. Build correcto; capturas de acceso/registro, tablet y móvil sin desbordamientos. Móvil no descarga la fotografía; Google/formulario siguen visibles. Evidencia en 12; aceptación estética pendiente.

### Fase 2 · Menú de cuenta

Implementar el desplegable solicitado según 06b con identidad actual, rol y acciones autorizadas. Verificar teclado/cierre, cambio de identidad y permisos, cierre de sesión conservando el evento de cambios sin guardar y disposición móvil/escritorio. Reutilizar AuthProvider sin consultas adicionales.

Resultado del menú de cuenta: implementado según 06b, build correcto y seis pruebas de componente más cuatro escenarios de navegador con sesión sintética correctos. Comprobados foco/Escape, acciones por permiso y delegación al cierre cancelable existente. No hubo escrituras Cloud; evidencia/limitaciones en 12.

### Fase 3 · Selector de categorías

Aplicar revisión solicitada de jerarquía/tamaño/iconos monocromáticos según 06b. Verificar siete grupos/dieciocho opciones, estado activo, categorías al navegar, filtrado y vuelta a todas; móvil con foco/restablecimiento tras elegir. Mantener consultas/filtros existentes.

Resultado del selector: implementado; build y cinco recorridos discovery correctos (una omisión prevista de escritorio en móvil). Comprobación adicional en tres anchos de selección, búsqueda conservada, último grupo alcanzable y foco móvil. Evidencia y límites en 12.

## CHERRY BOMB completo v16

La solicitud posterior aplica el rigor aprobado del CAPRA a CHERRY 17″/19″, conservando sus curvaturas y geometría propias. Investigación multivista nueva, tres agentes/revisión cruzada, perfil/reconstrucción, hueco de balancín, foto registrada, pasos/rectas/curva de sillín, conservación de otros modelos, carga SHA, articulación, transición y publicación acotada forman parte de la fase. Evidencia en [12k](12k-evidencia-cherry-bomb-v16.md). No editar bytes anteriores ni declarar CAD/100 % a partir de fotografías.

### Fase 3 · Continuidad de fichas

Corregir scroll al abrir/cerrar detalle y añadir salida de Drawer según 06b. Reproducir abajo en catálogo y verificar X/exterior/Escape repetidos, cambio de pieza, pestañas, filtros y navegación atrás/adelante; salida lateral/móvil y movimiento reducido.

Estado v16: reconstrucción CHERRY implementada y publicada, revisión cruzada y comprobaciones de 12k correctas. CAPRA aprobado y otros cuadros intactos; aceptación estética final del usuario abierta.

Resultado de continuidad de fichas: corregidos scroll y foco; salida de Drawer lateral/vertical con movimiento reducido. Build correcto y nueve escenarios de navegador correctos (una omisión prevista), incluida apertura/cierre repetida, historial y regresión de galerías. Evidencia en 12.


## GT Force Carbon High Pivot completo v17 · publicado

Dos elecciones Force M/L publicadas desde v13; las otras 28 capturas actuales mantienen sus SHA, incluidos CAPRA v15 y CHERRY v16. Perfil propio, triángulo GT, bieleta calada y conservación selectiva de polea. Build/tipos y 230 pruebas correctos; 14 vistas generales, diez detalles, dos overlays, 22 rayos despejados y tres poses articuladas. Carga/relectura SHA, auditoría remota y transición de dos montajes anteriores/dos nuevos con limpieza de cuenta temporal comprobadas. Estado: 70 modelos, 146 elecciones, 756 variantes/754 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. No se convierten guardados ni prearmadas. Reposición tras v16: `prepare-frame-v17.mjs --apply` → `publish-frame-v17.mjs --apply`; fuente SQL `supabase/operations/publish-frame-v17.sql`. Auditoría vigente `validate-frame-v17.mjs`; validadores anteriores describen sus snapshots. Evidencia y límites en [12l](12l-evidencia-force-v17.md). No certificar CAD/100 %, colisiones exhaustivas o Android físico/FPS. Sin commits.

## FRS V3 Pure White completo v18 · publicado

Solo FRS M/L desde v13; conservar otros catorce cuadros/28 capturas. Investigación oficial (dos fotos generales y nueve detalles técnicos), reconstrucción de perfil propio, protecciones, bieleta, uniones y soportes de amortiguador. Reemplazar render de tarjeta por fotografía original del cuadro Pure White. La fase incluye tipado/build/pruebas, revisión M/L multivista y registrada, rayos de pasos/ventana, conservación SHA y articulación; cargar/releer dos GLB y publicar SQL acotado con prueba de transición y limpieza de cuenta temporal. No modificar recursos publicados ni convertir guardados anteriores. No certificar 100 % CAD.

Cierre v18: build/tipos y 239 pruebas correctos; 28 SHA ajenos intactos, 14 vistas generales/diez detalles/dos overlays, 22 rayos despejados y tres poses articuladas. Dos GLB cargados/releídos y publicados con transición de dos guardados previos/dos nuevos y cuenta temporal eliminada. Fotografía original de la tarjeta comprobada desde catálogo público. Estado y límites en [12m](12m-evidencia-frs-v18.md).

## Furious V3 2021 v19 · publicado

La fase individual incluye investigación de la generación, reconstrucción completa de dos capturas M/L, anatomía propia y solo accesorios comunes confirmados, revisión multivista y registrada, pruebas de pasos/ventana/apoyos/rectas, preservación de 28 recursos ajenos, articulación, tipos/build/pruebas, carga/relectura SHA y publicación acotada con transición y limpieza de cuenta temporal. Conservar anclajes/especificaciones/acabados, guardados y cuatro prearmadas. No modificar recursos publicados, no añadir generador runtime ni certificar CAD/100 %. Sin commits.

Cierre v19: build/tipos y 247 pruebas correctos; 28 SHA ajenos intactos, 14 vistas generales/diez detalles/dos overlays, 22 rayos despejados y tres poses. Carga/relectura SHA y publicación acotada aplicadas con transición de dos montajes anteriores/dos nuevos y limpieza de cuenta temporal. Evidencia y límites en [12n](12n-evidencia-furious-v19.md).

## Fury Carbon High Pivot v20 · publicado

La revisión autorizada comprende investigación de la generación, reconstrucción propia de dos capturas M/L, ventana inferior y apoyos, revisión multivista y registrada, pruebas de aberturas/rectas/soportes, preservación de 28 recursos ajenos, articulación, tipos/build/pruebas, carga/relectura SHA y publicación SQL acotada con transición y limpieza de cuenta temporal. Mantener especificaciones, anclajes, acabados, montajes históricos y prearmadas; no modificar recursos publicados ni prometer identidad CAD del 100 %. Sin commits.

Cierre v20: build/tipos y 255 pruebas correctos; 28 SHA ajenos intactos, 14 vistas generales/diez detalles/dos overlays, 22 rayos despejados y tres poses. Carga/relectura SHA y publicación acotada aplicadas, dos montajes anteriores/dos nuevos y cuenta temporal eliminada. Evidencia y límites en [12o](12o-evidencia-fury-v20.md).

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


Revisión integral de suspensión v2 implementada en fase3: quince modelos/30 tallas y38 shocks, cuatro recursos anteriores de prearmadas, compresión monótona y resorte separado de cuerpos rígidos. Se corrigieron cuatro referencias de prearmadas retiradas manteniendo88 posiciones y privados. Evidencia, reproducción y límites en [12y](12y-evidencia-suspension-v2.md).
