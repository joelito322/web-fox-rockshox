# 06c · UI administrativa de usuarios, roles y permisos

Relacionado: [principios UI/UX](06-ui-y-ux.md), [espacio de trabajo](06b-espacio-de-trabajo.md), [IAM y permisos](04a-iam-roles-y-permisos.md), [operaciones administrativas](04b-administracion-y-operaciones.md) y [validación](08-fases-y-validacion.md).

Estado: planificación. El usuario aprobó estas composiciones: una sección integrada con pestañas Usuarios, Roles y Permisos; tablas sencillas; creación y detalle en panel lateral derecho; matriz con roles horizontales y permisos verticales. Sustituye el boceto anterior de navegación administrativa lateral. No se crean pantallas ni recursos en esta etapa.

## Estructura común

Entrar desde «Administración» en el menú de cuenta con permiso. Cabecera estable con «Volver al trabajo»; las tres pestañas cambian contenido sin recargar ni encadenar páginas. Conservar búsqueda, posición y selección al volver. Mostrar solo pestañas autorizadas y verificar también sus rutas directas. Para Usuarios se requiere users.read; para Roles y Permisos, roles.manage. No conceder escritura solo por poder ver una tabla.

Catálogo y bicicletas de referencia conservan las operaciones acordadas en 04b, con accesos separados del grupo Usuarios/Roles/Permisos; no añadirlos como columnas de la matriz ni mezclar montajes privados ajenos en administración. Esta composición no rediseña sus formularios de negocio.

## Usuarios: tabla principal

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ ATLAS MTB       Administración                            Volver al trabajo   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ [ Usuarios ]       Roles       Permisos                                        │
│                                                                                │
│ Buscar usuario [________________________]                 [ + Crear usuario ]  │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ Correo                     Rol                Estado          Creado      │ │
│ ├────────────────────────────────────────────────────────────────────────────┤ │
│ │ joel@correo.com            Administrador      Confirmado      Fecha       │ │
│ │ persona@correo.com         Usuario            Confirmado      Fecha       │ │
│ │ invitado@correo.com        Usuario            Invitado        Fecha       │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                   [ Anterior ] [ Siguiente ]   │
└────────────────────────────────────────────────────────────────────────────────┘
```

Los correos y fechas son ilustrativos. «Crear usuario» es una acción de cabecera de la tabla, no otra página o pestaña. Mostrarla con permiso de invitación; asignar un rol distinto del predeterminado exige además autorización de asignación. Buscar realmente en servidor sobre el conjunto autorizado de cuentas, con paginación estable; no presentar un filtro de la página actual como búsqueda global.

Pulsar una fila —o su acción semántica mediante teclado— abre detalle; no llenar cada fila con botones Ver/Editar/Detalles. La fila queda marcada y el panel cambia al seleccionar otra. Las cuentas que entran por registro o invitación aparecen al actualizar la consulta; no se añade Realtime o polling por esta necesidad.

## Crear usuario: panel lateral derecho

```text
┌──────────────────────────────────────────────┬─────────────────────────────────┐
│ [ Usuarios ]   Roles   Permisos              │ Crear usuario                ✕ │
│                                              │                                 │
│ Buscar [____________]   [+ Crear usuario]    │ Correo electrónico              │
│                                              │ [___________________________]   │
│ Correo                 Rol                   │                                 │
│ joel@correo.com        Administrador         │ Rol                             │
│ persona@correo.com     Usuario               │ [ Usuario                 ▾ ]   │
│ invitado@correo.com    Usuario               │                                 │
│                                              │ Recibirá una invitación para     │
│                                              │ establecer su contraseña.        │
│                                              │                                 │
│                                              │                                 │
│                                              ├─────────────────────────────────┤
│                                              │ Cancelar   [ Enviar invitación ]│
└──────────────────────────────────────────────┴─────────────────────────────────┘
```

Solo correo y rol, sin nombre, teléfono, clave interna o contraseña temporal. El rol inicial del selector es Usuario; opciones activas y otorgables por el actor. Sin permiso de asignación solo se permite el predeterminado, sin fingir otras opciones. El destinatario verifica su invitación y establece su contraseña mediante Auth.

El panel mantiene los datos y el error si falla el envío. Deshabilitar duplicados mientras se procesa. Una invitación enviada con asignación fallida muestra resultado parcial y acción de completar asignación sobre la identidad devuelta, sin repetir automáticamente el correo ni anunciar un administrador creado.

## Detalle y edición del usuario

```text
┌──────────────────────────────────────────────┬─────────────────────────────────┐
│ [ Usuarios ]   Roles   Permisos              │ Usuario                      ✕ │
│                                              │                                 │
│ Buscar [____________]   [+ Crear usuario]    │ persona@correo.com              │
│                                              │                                 │
│ Correo                 Rol                   │ Rol                             │
│ joel@correo.com        Administrador         │ [ Usuario                 ▾ ]   │
│ persona@correo.com  ◀  Usuario               │                                 │
│ invitado@correo.com    Usuario               │ Estado                          │
│                                              │ Confirmado                      │
│                                              │                                 │
│                                              │ Creado                          │
│                                              │ Fecha y hora                    │
│                                              │                                 │
│                                              │ Último acceso                   │
│                                              │ Fecha y hora, si está disponible │
│                                              │                                 │
│                                              ├─────────────────────────────────┤
│                                              │ Cancelar       [ Guardar ]      │
└──────────────────────────────────────────────┴─────────────────────────────────┘
```

Correo, estado, creación y último acceso son informativos; editar el rol requiere permiso y revisión vigente. Sin permiso, detalle en lectura, sin Guardar. No editar manualmente fechas, estado de verificación, IDs o contraseñas. La edición de correo no se incorpora por este boceto: si se solicita, requerirá una operación específica de Auth y su validación; no UPDATE libre ni un campo que aparente guardar sin efecto.

Guardar muestra resultado persistente e invalida la página/detalle afectados. La promoción o retirada de acceso identifica cuenta y rol en la confirmación. Proteger rol propio y último administrador según IAM. Si el servidor detecta conflicto, conservar el borrador y ofrecer recargar/revisar, sin sobrescribir silenciosamente la asignación vigente.

## Roles: tabla y panel

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ Usuarios       [ Roles ]       Permisos                                        │
│                                                                                │
│ Buscar rol [________________________]                       [ + Crear rol ]    │
│                                                                                │
│ Nombre                  Descripción                         Estado              │
│ ────────────────────────────────────────────────────────────────────────────── │
│ Usuario                 Acceso habitual                     Activo · Sistema   │
│ Administrador           Administración de ATLAS MTB          Activo · Sistema   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────┐
│ Crear rol                    ✕ │
│                                 │
│ Nombre                          │
│ [___________________________]   │
│                                 │
│ Descripción                     │
│ [___________________________]   │
│ [___________________________]   │
│                                 │
│ Permisos                        │
│ Selección agrupada por área     │
│                                 │
│ Cancelar       [ Crear rol ]    │
└─────────────────────────────────┘
```

Seleccionar un rol actualiza el mismo panel. Los de sistema están en lectura. Un personalizado permite nombre, descripción y permisos otorgables; la clave técnica se genera en servidor. Secciones de permisos con casillas y etiquetas del catálogo IAM, no texto genérico de relleno. Desactivar/eliminar desde el detalle exige confirmación y que no tenga usuarios asignados; mostrar el motivo si está en uso.

La selección del panel y la matriz utilizan el mismo contrato y catálogo de permisos. Crear/editar un rol guarda nombre/descripción y conjunto de permisos como una operación coherente; no una escritura por casilla. Un rol nuevo aparece en la tabla y como columna de la matriz tras confirmación real. No precargar ejemplos como roles adicionales.

## Permisos: matriz por rol

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ Usuarios       Roles       [ Permisos ]                                        │
│                                                                                │
│ Permiso                              Usuario    Administrador   Rol creado*    │
│ ────────────────────────────────────────────────────────────────────────────── │
│ MONTAJES                                                                       │
│ Crear y editar                          ✓             ✓             ☑          │
│ Ver propios                             ✓             ✓             ☑          │
│ Guardar propios                         ✓             ✓             ☑          │
│ Eliminar propios                        ✓             ✓             ☐          │
│                                                                                │
│ CATÁLOGO                                                                       │
│ Editar                                  —             ✓             ☑          │
│ Publicar                                —             ✓             ☐          │
│                                                                                │
│ BICICLETAS DE REFERENCIA                                                        │
│ Editar                                  —             ✓             ☐          │
│ Publicar                                —             ✓             ☐          │
│                                                                                │
│ USUARIOS                                                                       │
│ Ver                                     —             ✓             ☐          │
│ Invitar                                 —             ✓             ☐          │
│ Asignar roles                           —             ✓             ☐          │
│                                                                                │
│ ROLES                                                                          │
│ Crear y configurar                      —             ✓             ☐          │
│                                                                                │
│ Cambios sin guardar                         [ Descartar ] [ Guardar cambios ]  │
└────────────────────────────────────────────────────────────────────────────────┘
```

`Rol creado*` es una columna ilustrativa; al inicio existen solo Usuario y Administrador. Eje horizontal: roles; vertical: permisos agrupados por área; intersección: concesión al rol, nunca una excepción por usuario. La matriz refleja los doce códigos iniciales del catálogo IAM, usando etiquetas de negocio.

- ✓ / —: valores de sistema en lectura, sin casillas que aparenten ser editables. Ofrecer nombre/estado accesible, sin depender solo del símbolo.
- ☑ / ☐: casillas de un rol personalizado cuando se permite editarlo y otorgar ese permiso. Nombre accesible combina rol, área y permiso.
- Roles propios/protegidos y permisos superiores al actor mantienen sus restricciones; el servidor las verifica nuevamente.
- Cambios locales hasta «Guardar cambios». No guardar por clic ni actualizar permisos reales al pasar el ratón. Aviso contextual antes de confirmar que los cambios afectan a todas las cuentas con los roles modificados.
- Guardar varios roles usa una operación transaccional por lote con revisión esperada de cada rol afectado; un conflicto/invalidez revierte el lote completo, identifica la causa y conserva el borrador. No informar éxito parcial como guardado completo.
- «Descartar» restaura el snapshot confirmado. Una recarga de datos no borra cambios pendientes. Navegar a otra pestaña, abrir otro editor o salir con cambios ofrece guardar, descartar o cancelar; nunca aplica cambios implícitamente.
- Invalidar consultas de roles, matriz y acceso propio después de confirmar. La autorización de otras sesiones se comprueba en servidor aunque su matriz o menú estén desactualizados.

## Adaptación, navegación y accesibilidad

En escritorio, encabezados de roles y columna de permisos permanecen identificables durante el desplazamiento vertical/horizontal. Si crece el catálogo de roles, paginar el eje de roles y conservar únicamente cambios explícitos por ID, sin eliminar permisos de columnas no cargadas. No se introduce virtualización o una biblioteca de tablas por obligación.

En móvil, selector de rol y permisos agrupados en una columna con casillas; mantiene exactamente las mismas asignaciones y botón de guardado. Usuarios/Roles se adaptan con columnas prioritarias legibles y detalle ampliable, sin reducir la tipografía de toda la tabla. El panel derecho se transforma en panel inferior ampliable/una columna, con cierre accesible; no exige gestos.

El panel de escritorio es complementario: tabla operativa, sin máscara ni foco atrapado como modal. Si el panel móvil bloquea el fondo, manejarlo como diálogo accesible. Foco inicial y retorno a fila/botón, Escape para cierre y protección de borradores. Solo un panel abierto; no apilar formularios.

Pestaña/selección y parámetros de consulta deben poder representarse en URL para recarga y Atrás/Adelante. Correos y borradores de formularios no se colocan en URL; buscar cuentas conserva el texto en estado acotado, sin exponer un correo en enlaces compartidos. Cerrar un detalle abierto por enlace directo devuelve al listado correcto aunque no haya historial previo.

Estados separados: carga, lista vacía, sin resultados, error de consulta, guardando, guardado, conflicto, acceso revocado y resultado parcial de invitación. No guardar datos administrativos en caché pública o persistencia local de formularios. Limpiar al cerrar sesión/cambiar cuenta o perder autorización. No fingir que el rol cambió si solo se actualizó un estado React.

La matriz y el formulario de roles aplican las [dependencias de permisos de 04a](04a-iam-roles-y-permisos.md#dependencias-de-permisos): mostrar requisitos junto al permiso y rechazar conjuntos incompletos sin marcar casillas ni conceder capacidades silenciosamente. El selector de asignación usa solo roles activos otorgables y no exige acceso a la pestaña Roles.
