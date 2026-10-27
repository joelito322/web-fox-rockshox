# 06f · Administración modular y componentes compartidos

Estado: refactorización implementada según el alcance aprobado, con comprobaciones de integración, seguridad y responsive. Evidencia y límites en [12z](12z-evidencia-administracion-modular.md). Se integra en fase 2b de [08](08-fases-y-validacion.md); no acredita aceptación integral del resto del producto.

Relacionado: [UI compartida](06-ui-y-ux.md), [Accesos](06c-administracion-usuarios-roles-y-permisos.md), [catálogo y prearmadas](06d-administracion-catalogo-y-prearmadas.md), [operaciones](04b-administracion-y-operaciones.md), [arquitectura](02-arquitectura-y-frontend.md).

## Simplificación vigente · 26/10/2026

Correo informativo, sin edición ni recuperación administrativa. Google es el acceso habitual; no pedir contraseña en ese recorrido. No añadir permisos nuevos ni ampliar gestión de identidad. Roles define nombre/descripción/estado y la matriz es el único lugar para asignar permisos; cada usuario conserva un rol, con autorización real en IAM, sin excepciones individuales. Contratos en 04a/04b.

## Alcance y navegación aprobada

Administrar datos del negocio por módulos, con tablas y un único panel derecho. No construir un editor SQL ni una cuadrícula universal de todas las tablas de Supabase. Identidad, almacenamiento e interfaces físicas publicadas conservan sus operaciones y protecciones específicas. La administración no permite inspeccionar montajes privados ajenos.

```text
Administración
├── Catálogo
│   ├── Componentes → variantes, características, acabados y fuentes
│   ├── Marcas
│   └── Recursos 3D → consulta y selección de recursos existentes
├── Bicicletas
│   └── Prearmadas → datos y composición por posiciones
└── Accesos
    ├── Usuarios
    ├── Roles
    └── Permisos
```

Los grupos filtran su contenido según permisos. No conceder acceso por el nombre de rol, ni solo por mostrar una pestaña. Conservar acceso directo/URL y navegación Atrás/Adelante; entrada a la última sección autorizada visitada, inicialmente Componentes si corresponde. Si no está autorizada, elegir la primera disponible. Sin panel de bienvenida administrativo que añada un clic.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ATLAS MTB                              Administración       Cuenta  │
├──────────────────────────────────────────────────────────────────────┤
│ Catálogo                  Bicicletas                  Accesos        │
│ ━━━━━━━━                                                             │
│ Componentes               Marcas                      Recursos 3D    │
├──────────────────────────────────────────────────────────────────────┤
│ Buscar…                 Categoría ▾   Marca ▾   Estado ▾    + Crear  │
├──────────────────────────────────────────────────────────────────────┤
│ Nombre                   Marca                Categoría    Estado    │
│ FOX 40                   FOX                  Horquilla    Publicado │
│ BoXXer Ultimate          RockShox             Horquilla    Publicado │
│ V10 8 CC                 Santa Cruz           Cuadro       Publicado │
├──────────────────────────────────────────────────────────────────────┤
│                                      Anterior    1 / 4    Siguiente  │
└──────────────────────────────────────────────────────────────────────┘
```

## Patrón de consulta y edición

Búsqueda, filtros y paginación reales de servidor; conservar contexto al abrir/cerrar el detalle y al cambiar de pestaña. Seleccionar una fila abre el detalle y habilita sus campos autorizados sin otro botón «Editar». Ofrecer acción equivalente de teclado. Un único panel: cambiar de registro o navegar dentro de él sustituye contenido, sin apilar paneles o modales.

```text
┌──────────────────────────────────────┬───────────────────────────────┐
│ Buscar…                    Filtros   │ FOX 40                     ✕ │
├──────────────────────────────────────┤ FOX · Horquilla               │
│ FOX 40             Publicado         ├───────────────────────────────┤
│ BoXXer Ultimate    Publicado         │ General   Variantes   Fuentes │
│ V10 8 CC           Publicado         │                               │
│                                      │ Nombre                        │
│ Tabla conserva búsqueda,             │ [FOX 40                    ]  │
│ página y posición                    │                               │
│                                      │ Formulario con desplazamiento │
│                                      │                               │
│                                      ├───────────────────────────────┤
│                                      │ Cancelar     Guardar cambios  │
└──────────────────────────────────────┴───────────────────────────────┘
```

La cabecera y el pie del panel permanecen visibles; solo el cuerpo se desplaza. No duplicar las acciones arriba y abajo. Guardar mantiene el panel abierto, confirma persistencia y actualiza las consultas afectadas. Publicar/Retirar son acciones distintas del guardado y solo aparecen cuando el estado y el permiso lo permiten. Los formularios largos no deben requerir desplazarse hasta el final para guardar.

Dentro de Componentes, abrir una variante reutiliza el panel, con «← FOX 40» y sus secciones Características/Acabados/Modelo 3D. Mantener los cambios al cambiar de sección. Volver al padre, seleccionar otro registro o cerrar con cambios pendientes ofrece Guardar, Descartar o Seguir editando, según las acciones disponibles; nunca descarta o guarda implícitamente. Si se cancela la salida, conservar valores, foco y contexto.

En Marcas, abrir sus componentes aplica el filtro de marca en el catálogo; proteger primero un borrador pendiente. Recursos 3D permite inspeccionar tipo, representación y relación con variantes, usando etiquetas comprensibles y recursos existentes. No añadir subida GLB, edición libre de manifiestos o modificación de binarios publicados. Cambios físicos necesitan una identidad/versionado nuevos según el contrato 3D.

## Acciones siempre visibles

La matriz utiliza una barra superior fija dentro del área de trabajo, bajo las pestañas, con búsqueda/filtro, número de cambios, Descartar y Guardar cambios. No colocar su única acción de guardado al final del documento.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Usuarios                Roles                Permisos                │
├──────────────────────────────────────────────────────────────────────┤
│ Buscar permisos…    Módulo ▾                                         │
│ 3 cambios pendientes                  Descartar    Guardar cambios   │ ← fija
├─────────────────────────────┬───────────────┬───────────┬────────────┤
│ Permiso                     │ Administrador │ Usuario   │ Editor     │ ← fijo
├─────────────────────────────┼───────────────┼───────────┼────────────┤
│ CATÁLOGO                    │               │           │            │
│ Consultar catálogo          │ ✓ protegido   │ ✓ protegido│ ☑         │
│ Editar catálogo             │ ✓ protegido   │ — protegido│ ☐         │
│                 Filas con desplazamiento vertical/horizontal        │
└─────────────────────────────┴───────────────┴───────────┴────────────┘
```

Guardar solo se habilita con cambios válidos y permiso vigente; estado Guardando evita duplicados. No aplicar un check inmediatamente al servidor. Cabecera de roles y primera columna permanecen identificables al desplazar; no superponer las barras al foco o a las filas. Mantener el lote transaccional con revisión por rol de 06c. Las etiquetas del dibujo son ilustrativas; usar únicamente los permisos implementados.

## Móvil, accesibilidad y estados

El panel ocupa la pantalla disponible en móvil, con cabecera y pie visibles, formulario desplazable y retorno al listado conservado. Considerar teclado virtual, áreas seguras y altura dinámica; el último campo no queda tapado por el pie. La matriz conserva los mismos ejes con desplazamiento horizontal, primera columna fija y barra de acciones accesible; no reducir toda la tipografía para encajar columnas.

Reutilizar el comportamiento accesible de Drawer: si bloquea el fondo, diálogo con foco gestionado, Escape y retorno al origen; no combinar tabla operativa con foco atrapado. Evitar confirmaciones encadenadas salvo protección de cambios o acciones que realmente lo requieran. Transiciones breves compartidas y movimiento reducido.

Estados verificables: carga, vacío, sin resultados, error recuperable, cambios pendientes, guardando, guardado, conflicto de revisión, resultado parcial y acceso revocado. Errores junto al campo y resumen cuando proceda; sin códigos internos, JSON o errores brutos del SDK. Cambiar de cuenta o perder permiso limpia los datos administrativos según el contrato de acceso.

## Reutilización React

Partir de `src/features/admin/Page.tsx`, `Users.tsx`, `Roles.tsx`, `Catalog.tsx`, `Presets.tsx`, `Fields.tsx` y los controles existentes en `src/components/ui/`: Drawer, Feedback y UnsavedChanges. Reutilizar estilos de tablas, botones, campos y movimiento ya presentes. El núcleo de arquitectura sigue siendo modular con reglas independientes de React/Three/Supabase.

Extraer componentes únicamente ante una repetición real: marco de panel con cabecera/cuerpo/pie, barra de acciones pendientes o cabecera de tabla. Elegir un único responsable para protección de borradores; no duplicar listeners de navegación, cachés privadas, confirmaciones ni formularios por pestaña. No crear un motor de formularios universal, nueva biblioteca de tablas o capa de repositorios por este rediseño. Las reglas particulares de usuarios, roles y catálogo permanecen en su módulo.

## Ejecución y aceptación

1. Auditar las vistas y operaciones existentes; registrar qué se reutiliza y qué falta. No confundir estas composiciones con el estado actual implementado.
2. Reorganizar navegación y estado de secciones sin perder permisos, enlaces directos, filtros o selección.
3. Completar tablas/paneles por módulo, navegación interna y acciones visibles; contratos de Accesos en 06c y negocio en 06d.
4. Completar las operaciones aprobadas que falten, con fuentes backend versionadas antes de aplicar cambios remotos y sin ampliar acceso a datos privados.
5. Comprobar persistencia/recarga, borradores, errores, publicación, concurrencia, revocación y llamadas directas manipuladas. Probar permisos efectivos, no solo ocultación de botones.
6. Revisar escritorio y móvil: matriz larga, panel largo, teclado, foco, zoom, movimiento reducido y botones alcanzables sin ir al final. Registrar build/pruebas/evidencia y pendientes en 12.

La aceptación exige todos los recorridos acordados funcionales y comprobados; redactar este documento no completa la refactorización. La primera solicitud fue documental. La revisión posterior del 26/10/2026 autoriza comprobar responsive y corregir defectos de adaptación encontrados; no equivale a implementar todo el rediseño ni autoriza commits.


## Responsive: base real y estrategia

El proyecto usa CSS propio con media queries, Grid/Flex, `minmax`, `clamp` y alturas dinámicas; no tiene Tailwind instalado. No migrar el proyecto para obtener adaptación por tamaños. Reutilizar las reglas actuales y centralizar criterios en vez de clonar componentes para cada dispositivo.

Trabajar desde el espacio disponible: formulario a una columna en anchos pequeños; tabla/matriz con desplazamiento dentro de su contenedor; panel móvil con cabecera/pie visibles; distribución de escritorio cuando realmente caben columnas. Como referencias de auditoría usar 320, 360, 390, 768, 1024, 1366, 1820 y 1920 px, sin fijar estas anchuras como únicas pantallas admitidas. Revisar además los límites alrededor de los puntos existentes 720/760/1050/1450 px antes de consolidarlos; los puntos de corte siguen necesidades del contenido, no modelos de teléfono. No inventar una capa de breakpoints en JavaScript que duplique CSS.

Comprobar portada, acceso, catálogo, bicicletas, montajes propios, configurador y administración existente, además de paneles/matriz. Registrar ausencia de desbordamiento global y distinguirlo del scroll horizontal intencional de tablas. La auditoría de las vistas existentes no acredita la implementación de los nuevos paneles/acciones fijas de este plan. Emulación de tamaños no certifica navegadores Android físicos, teclado real o FPS 3D.

Resultado de revisión inicial: comprobación de vistas actuales completada el26/10/2026 en escritorio y móvil emulado,384 mediciones y24 límites de panel correctos después de corregir paginación de320 px. Evidencia y límites en [12](12-estado-implementacion.md#simplificación-administrativa-y-responsive--26102026). Ese resultado corresponde a la línea base anterior; la implementación posterior y sus comprobaciones están en 12z.

## Revisión de preparación para ejecución · 26/10/2026

El alcance administrativo está suficientemente definido para iniciar implementación: grupos/secciones, formularios, fuente IAM, componentes reutilizables, acciones visibles y aceptación están acordados. No quedan decisiones de negocio bloqueantes. Las elecciones técnicas siguientes se resuelven dentro de fase 2b y se validan junto a su implementación:

- Orden: marco compartido de panel y navegación → Accesos → Catálogo/Prearmadas → integración y aceptación. Mantener las rutas administrativas existentes como entradas compatibles o redirecciones que conserven contexto y vuelvan a comprobar autorización.
- Roles: al guardar nombre/descripción/estado con la RPC existente, conservar los permisos confirmados de ese rol y su revisión. Retirar las casillas del panel no significa enviar una lista vacía al editar ni borrar asignaciones. Solo crear un rol nuevo comienza sin permisos; la matriz sigue siendo el único editor de asignaciones.
- Matriz: filtrar filas/columnas cambia visibilidad, no el conjunto de permisos guardado. Guardar únicamente cambios explícitos por ID con revisión, preservando asignaciones fuera del filtro; conflictos revierten el lote y conservan el borrador.
- Consultas: Marcas y Recursos 3D necesitan listados administrativos autorizados, acotados/paginados y detalles bajo demanda. Reutilizar RPC/QueryClient existentes donde corresponda; si faltan proyecciones o filtros, preparar sus fuentes SQL y pruebas antes de aplicarlos. No descargar todos los manifiestos o usuarios para filtrar en React ni agregar índices sin evidencia.
- Dependencias y contrato: introducir solo los ajustes backend que necesiten estas vistas, conservando IAM, históricos y separación de editar/publicar. No hay nuevas funciones de identidad ni migración de estilos en este alcance.
- Aceptación final: repetir responsive sobre las vistas refactorizadas y probar escritura/recarga, filtros/contexto, borradores, conflictos, revocación, protección de roles, fuentes privadas y conservación de montajes. Las384 comprobaciones anteriores son la línea base de las vistas existentes, no aceptación anticipada de la refactorización.

Esta revisión aprueba la preparación del plan, no afirma código completado ni inicia implementación por sí sola. Sin commits por la validación documental.


Implementación posterior autorizada: consultas paginadas y guardados con snapshots, navegación modular, panel compartido y matriz única operativos. Resultado detallado, reproducción y limitaciones en [12z](12z-evidencia-administracion-modular.md). Sin commits automáticos.
