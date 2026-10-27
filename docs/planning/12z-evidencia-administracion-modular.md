# 12z · Administración modular: implementación y comprobaciones

Fecha: 26/10/2026. Alcance: [06f](06f-administracion-modular-y-componentes.md), dentro de fase 2b de [08](08-fases-y-validacion.md). Las pruebas de este documento no cierran las validaciones pendientes del resto del producto.

## Resultado implementado

- Navegación Catálogo → Componentes/Marcas/Recursos 3D; Bicicletas → Prearmadas; Accesos → Usuarios/Roles/Permisos. Se conservan las rutas anteriores y los accesos directos a detalles; permisos comprobados por sección y servidor.
- Un único contexto administrativo en memoria por identidad/conjunto de permisos. Conserva filtros, búsqueda, página, selección y posición entre secciones; última sección del grupo y regreso al entrar desde el espacio de trabajo. No persistencia local de búsquedas de cuentas ni borradores privados. Cambio de identidad/revocación elimina ese contexto.
- Drawer reutilizado con pie opcional: cabecera y acciones fuera del área desplazable. Formularios nativos asociados a sus botones externos; móvil a pantalla completa y áreas seguras. Cierre bloqueado durante escrituras, cancelación/descartes protegidos y devolución de foco después de desmontar las capas de confirmación. Movimiento reducido conserva el mismo comportamiento sin animación.
- Roles edita únicamente nombre/descripción/estado y conserva permisos/revisión confirmados. Crear comienza sin permisos. Configurar permisos abre/enfoca la matriz, con cabecera/primera columna y acciones superiores fijas, búsqueda y filtro por módulo. Filtrar no elimina asignaciones; las revisiones se conservan desde la edición inicial para que una consulta posterior no oculte conflictos.
- Usuarios conserva correo/fechas en lectura, filtro por rol y búsqueda paginada en servidor; asignación autorizada deja abierto el detalle actualizado. Invitación preexistente conserva su operación y restricciones, sin nuevas acciones de identidad o permisos. El rol predeterminado de una invitación vacía no cuenta como edición pendiente.
- Variantes publicadas y prearmadas tienen acciones separadas Retirar/Volver a ofrecer; conservar sus piezas e identidades permite mantener montajes anteriores. Edición y publicación siguen separadas por permiso.
- Componentes con filtros de categoría/marca/publicación y detalle bajo demanda; General/Variantes/Fuentes dentro del mismo panel. Variante con características/acabados/modelo/precio, regreso al componente y representación existente buscable/paginada. Campos físicos publicados siguen protegidos y conservan su mecanismo de nueva versión.
- Marcas dispone de listado y editor; Ver componentes aplica el filtro de marca. Recursos 3D es consulta de recursos existentes y relaciones navegables, sin subida, editor JSON o mutación de GLB. Etiquetas breves y notas ampliables.
- Prearmadas usa listado paginado y composición bajo demanda; guarda borrador/publica y retira/vuelve a ofrecer mediante acciones separadas, con los contratos anteriores y comparación de snapshot. Los guardados permanecen abiertos con valores confirmados. Se evita duplicar el mismo mensaje en tabla y panel.
- Campos estructurados reutilizan Fields: errores traducidos por campo, asociación accesible del mensaje y propagación al registro/fuente correspondiente. Validaciones nativas de nombre, URL, medidas y formularios se mantienen.

## Backend y conservación

Fuentes aplicadas antes de usar las operaciones desde el frontend:

| Migración | Función |
| --- | --- |
| 023 · modular_admin_queries | Listados paginados de componentes/marcas/recursos/usuarios y detalles bajo demanda |
| 024 · admin_edit_conflicts | Navegación de recursos a variantes y guardado administrativo con comparación de datos |
| 025 · admin_preset_pages | Página/detalle de prearmadas, guardado con conflicto y detalle de cuenta |
| 026 · admin_catalog_snapshot_contract | Exige snapshot completo al editar catálogo; rechaza comparaciones parciales |
| 027 · iam_required_revisions | Rechaza revisión ausente/nula en edición, eliminación y asignación IAM |

Ocho RPC nuevas; conservan operaciones previas, permisos IAM y separación editar/publicar. Catálogo y prearmadas comparan el registro leído dentro de una transacción antes de delegar al guardado existente; un dato antiguo produce PT409 y no sobrescribe. Nuevas identidades usan snapshot null y rechazan colisiones. Roles sigue usando el lote transaccional con revisión por rol existente. No se añaden tablas, campos comerciales, índices, dependencias de estilos ni Edge Functions.

Snapshot remoto después de limpiar los temporales: **12 tablas propias, 27 migraciones, 70 modelos, 782 variantes/780 recursos, 146 elecciones y 4 prearmadas**. No se cambiaron GLB, referencias fotográficas, montajes privados ni prearmadas publicadas por esta refactorización.

## Comprobaciones reproducibles

```bash
pnpm run build
pnpm exec vitest run --maxWorkers=2
node scripts/test-authenticated.mjs desktop '' admin-modular
node scripts/test-authenticated.mjs mobile '' admin-modular
node scripts/test-authenticated.mjs desktop 'administrator manages|denied administrative write'
node scripts/validate-responsive.mjs desktop
node scripts/validate-responsive.mjs mobile
node scripts/validate-admin-performance.mjs desktop
```

El runner autenticado conserva su suite anterior por defecto y añade admin-modular como suite explícita; cada ejecución utiliza cuentas/fixtures únicos y limpia sus datos. Los puertos de navegador se aíslan: suite nueva 4187, responsive 4186, rendimiento 4184 y regresión habitual 4180; se puede sobrescribir con ATLAS_PLAYWRIGHT_PORT cuando el runner lo admite. Sin contraseñas o claves privilegiadas en el frontend o documentación.

La suite nueva cubre recorrido de rol → matriz → edición de metadatos conservando permisos, matriz filtrada, variante y retorno al componente, borradores, contexto de búsqueda, consulta de cuentas y recursos; rechazo de anónimo/user, snapshots antiguos/incompletos, conflictos de prearmadas y publicación inválida. También comprueba editor sin permiso de publicación: ve lo publicado en lectura y crea una versión nueva en borrador sin alterar el original. El lote de dos roles verifica que una revisión inválida revierte todo y una revisión correcta actualiza ambos. Teclado/Escape/descartar/devuelve foco, texto raíz al 200 %, pie de panel inmóvil y matriz desplazable con acciones/columna visibles.

Las pruebas responsive recorren 448 combinaciones de vista/ancho entre escritorio y móvil emulado, más 24 límites de panel. Las capturas locales de matriz y recurso se inspeccionan como apoyo visual; no se versionan. Resultados/trazas/capturas en `models/local/validation/admin-modular/` y `models/local/validation/responsive/`.

Rendimiento: una búsqueda agrupada produce una consulta, la matriz caliente reutiliza datos al cambiar de pestaña y obtener marcas para prearmadas no descarga inventario. Las listas entregan como máximo 25 filas y no incluyen manifiestos o composiciones completas; los detalles se consultan por ID. En una muestra SQL con rol authenticated: Componentes 3,651 ms, Marcas 0,989 ms, Recursos 5,439 ms, Usuarios 1,814 ms, Prearmadas 0,771 ms. Son tiempos de ejecución PostgreSQL, no latencia de red ni promesa de respuesta instantánea.

## Límites y estado de aceptación

El perfil Pixel7/Chromium/SwiftShader es emulación; no certifica Android/Brave físico, teclado virtual real o FPS. El texto raíz ampliado es una prueba de legibilidad, no una medición de todos los modos de zoom del navegador. La entrega SMTP y nuevos consentimientos Google no se validan por estas pruebas; los flujos existentes se conservan. No se ha publicado este frontend en Netlify ni creado commits como parte de esta implementación.

Build correcto; 489 pruebas unitarias correctas y 2 prototipos omitidos, 73 archivos. Ocho casos de navegador de la suite nueva correctos (cuatro por perfil), dos regresiones existentes correctas, 448 mediciones responsive/24 límites de panel y prueba de consultas correctos. Todos los temporales eliminados. Resultados y límites se registran también en [12](12-estado-implementacion.md). La aceptación visual final del usuario puede originar ajustes puntuales, sin convertir esta evidencia en aceptación integral de todo ATLAS MTB.


## Auditoría adversarial posterior · 26/10/2026

Tres agentes contrastaron alcance, seguridad y regresiones, con revisión cruzada de las correcciones. Se encontraron defectos reales después de la primera entrega; las pruebas anteriores no cubrían estos recorridos:

- Detalles de catálogo, prearmadas, roles y usuarios desincronizados al cambiar únicamente los parámetros de URL. Ahora siguen Atrás/Adelante/cierre, conservando la protección de cambios pendientes. El acceso a una marca desde Componentes utiliza su ruta correcta y se puede recargar.
- Respuestas iniciales tardías de marcas y usuarios podían sustituir otra selección o borrador. Se invalidan por generación; Usuarios también cancela la solicitud. Ningún efecto de navegación guarda datos.
- Invitación parcial sin recuperación por identidad y asignación sin confirmación identificada. La recuperación conserva la identidad y el rol solicitado, consulta su revisión y requiere guardar explícitamente; no vuelve a enviar el correo. Cancelar mantiene el borrador.
- La comparación SQL con `<>` admitía revisión NULL en tres operaciones IAM anteriores. La migración027 utiliza `IS DISTINCT FROM`, preservando firmas, autorizaciones y protección del último administrador. La regresión `supabase/tests/iam-required-revisions.sql` comprueba NULL/ausencia/revisión antigua, rollback de lote, guardado/asignación/eliminación válidos y rol en uso, dentro de BEGIN/ROLLBACK sin identidades persistidas.
- Matriz con más de ocho roles: paginación de columnas con borradores por ID independientes de la página, enlace que abre/enfoca su columna y confirmación al desactivar un rol. Prearmadas comparte la selección de fila.

La suite autenticada amplia detectó además que la clave del contexto envolvía todo el Outlet: al cambiar identidad/permisos remontaba también acceso/callback y podía consumir dos veces el destino de inicio de sesión o interrumpir la recuperación. El proveedor ahora limpia únicamente su estado con una generación monotónica; solo el contenido administrativo se remonta. Callbacks de un contexto anterior se rechazan incluso al volver a la misma cuenta (A→B→A).

Pruebas nuevas: `Users.test.tsx` (cuatro recorridos), `navigation.test.tsx` (nueve recorridos) y `workspace.test.tsx` (aislamiento sin remontar la ruta y rechazo de callbacks antiguos). Usan Router/guardia reales y servicios simulados para controlar respuestas tardías, historial y resultados parciales sin enviar invitaciones reales. La revisión cruzada de seguridad no detectó nuevos defectos en estas correcciones. Las ocho RPC administrativas mantienen ejecución anónima bloqueada, autorización interna y search_path vacío; las doce tablas propias conservan RLS.

El runner autenticado guarda ahora sus artefactos en una carpeta única por suite/perfil/ejecución, dentro de models/local ignorado. Una ejecución paralela anterior colisionó en el directorio predeterminado de Playwright; ese fallo de infraestructura no se contabiliza como comprobación correcta.


Repetición unitaria aislada tras corregir el contexto: **503 pruebas correctas, dos prototipos omitidos, 76 archivos**. Una ejecución simultánea con navegadores había excedido el límite de cinco segundos de una prueba geométrica SUPREME; se repitió la suite completa sin esa carga y pasó, sin cambiar geometría ni elevar tiempos para ocultar el fallo. Compilación correcta y escaneo de credenciales privilegiadas del bundle correcto.

Regresión pública ampliada: **45 casos correctos y uno omitido** (el caso exclusivo de anchura de escritorio en el perfil móvil), en portada, catálogo, navegación, cuenta y movimiento reducido. La suite autenticada comprobó correctamente el retorno al configurador después del login, recuperación nativa, guardado/reapertura completos e incompletos, conflictos entre pestañas, recuperación del borrador, caché pública y revocación. Se actualizaron tres selectores ambiguos de pruebas anteriores para identificar cuadro, disco y recurso por modelo/medida/identidad, esperando la búsqueda agrupada; no se eligió arbitrariamente el primer resultado.


Cierre de integración de las correcciones: ocho casos administrativos correctos (cuatro escritorio, cuatro móvil emulado). Los quince recorridos de la suite autenticada quedaron comprobados: doce correctos en la ejecución amplia y los tres restantes correctos al repetirlos con selectores precisos. Incluyen acceso, recuperación, referencia completa/parcial, recurso importado fallido, frenos, caché, guardado, reapertura y concurrencia. No se cuentan como aprobadas las ejecuciones anteriores con colisión de artefactos o selectores ambiguos.

Snapshot remoto de cierre: doce tablas, **27 migraciones**, 70 modelos, 782 variantes, 780 recursos, 146 elecciones y cuatro prearmadas; cero marcas, roles y cuentas temporales del runner. No se modificaron GLB, fotos de producto ni montajes privados. La aceptación visual del usuario y las comprobaciones en Android/Brave físico, SMTP y consentimientos Google reales conservan los límites de este documento; no son una certificación derivada de las pruebas simuladas.
