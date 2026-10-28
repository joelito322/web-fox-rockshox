# Supabase Cloud: fuentes y cambios versionados

Relacionado: [planes](../docs/planning/README.md), [entornos y accesos](../docs/planning/07-entornos-y-despliegue.md), [datos](../docs/planning/03-datos-y-operaciones.md) e [IAM](../docs/planning/04a-iam-roles-y-permisos.md).

Estado: implementación autorizada en curso. Migraciones 001–021 aplicadas en Cloud y `admin-users` desplegada. Evidencia y límites en [12](../docs/planning/12-estado-implementacion.md); no declarar completos registro/correos ni catálogo por esta infraestructura.

Herramientas: `node scripts/supabase.mjs push|status|deploy [función]`, con Node de `.node-version` y variables ya configuradas en `.env`. El despliegue usa `--use-api`; no levantar Docker ni Supabase local. Toda corrección posterior a una migración aplicada se escribe en una nueva migración.

`operations/bootstrap-admin.sql` es una operación controlada sobre una identidad confirmada, sin función pública de ascenso. `auth-config.json` y `templates/` contienen configuración de Auth preparada, todavía pendiente por HTTP 403 del token en escritura. `tests/` contiene contratos SQL y preparación/limpieza de pruebas de navegador; no usar sus identidades temporales como administradores reales.

## Actualización administrativa · 26/10/2026

Estado vigente:27 migraciones aplicadas y12 tablas propias. Las migraciones023–026 incorporan consultas paginadas/detalles y guardados administrativos con snapshot de catálogo/prearmadas, sin permisos o tablas nuevos. La027 exige revisión no nula en guardados de roles, eliminación y asignación de usuarios; regresión transaccional en `tests/iam-required-revisions.sql`. Se conservan Auth, IAM y la Edge Function existente. Las pruebas `admin-modular` verifican aislamiento, permisos mínimos, conflictos y limpieza. Evidencia y límites en [12z](../docs/planning/12z-evidencia-administracion-modular.md); los números del encabezado anterior son un snapshot histórico.

## Entorno acordado

El frontend se ejecuta localmente. PostgreSQL, Auth, Storage y Edge Functions se desarrollan y validan directamente en el proyecto Supabase Cloud ya creado, identificado por las variables locales de la raíz del repositorio.

No se configura un stack local de Supabase, base local, Docker, réplica local o segundo proyecto por obligación. Usar CLI o herramientas de despliegue desde este equipo no significa levantar una base local. El frontend local utiliza el backend cloud.

El usuario confirmó que el proyecto es de desarrollo, sin usuarios reales ni producción desplegada. Cuando se autorice implementar, las reconstrucciones de tablas propias, datos de prueba y funciones del alcance en este proyecto de desarrollo están permitidas. No solicitar confirmación repetida por cambios rutinarios necesarios ya autorizados. La solicitud posterior del usuario autorizó iniciar la implementación del alcance. No confundir esa autorización con eliminar el proyecto, credenciales, esquemas gestionados por Supabase o recursos ajenos al trabajo.

## Estructura objetivo

```text
supabase/
├── README.md
├── config.toml                          Configuración versionada de funciones/herramientas
├── migrations/
│   ├── <timestamp>_create_iam.sql
│   ├── <timestamp>_create_catalog.sql
│   ├── <timestamp>_create_builds.sql
│   └── <timestamp>_policies_and_functions.sql
├── functions/
│   ├── admin-users/
│   │   ├── index.ts                     Punto de entrada de esta función
│   │   └── deno.json                    Dependencias/configuración si las necesita
│   └── _shared/                         Solo lógica realmente compartida
│       └── authorization.ts             Si existe responsabilidad reutilizable
├── seed.sql                             Catálogo/datos de prueba deliberados
└── tests/                               Comprobaciones necesarias sin secretos
    └── <archivo-de-prueba>
```

Los nombres de funciones y migraciones ilustran el orden/responsabilidad; no obligan a crear archivos vacíos o una función por operación. Cada Edge Function real tiene carpeta propia y `index.ts`. Sus módulos auxiliares permanecen dentro de su carpeta salvo reutilización real; no crear `_shared` por anticipación. El nombre de migración usa timestamp único, por ejemplo `YYYYMMDDHHMMSS_descripcion.sql`.

El historial de cambios es Git junto con el historial de migraciones del proyecto, no otra carpeta con copias del mismo SQL. Los originales editables de modelado 3D y sus binarios no son migraciones. Archivos de trabajo de herramientas como `.temp/` no se consideran fuentes versionadas.

## Qué debe quedar en el repositorio

- Tablas, tipos, índices, restricciones, RLS/grants, triggers y funciones SQL/RPC: migraciones ordenadas.
- Roles y permisos base obligatorios de IAM: migración correspondiente, no depender de que alguien ejecute un seed opcional.
- Código completo de cada Edge Function, dependencias necesarias y configuración de autenticación/despliegue sin secretos.
- Seed deliberado de catálogo/datos de prueba, sin cuentas administrativas con contraseñas conocidas.
- Comprobaciones pertinentes y evidencia resumida de aplicación/validación en [fases](../docs/planning/08-fases-y-validacion.md).

No modificar la estructura del proyecto remoto como única copia del trabajo. Primero escribir el archivo local, revisar su efecto y después aplicarlo al proyecto correcto cuando la implementación esté autorizada. Si se hace una corrección excepcional desde el Dashboard, reflejarla inmediatamente en el repositorio y reconciliar el historial, sin dejar divergencias.

## Migraciones remotas

Usar un mecanismo que registre versiones aplicadas —por ejemplo `supabase db push` con conexión remota o la API de migraciones con alcance autorizado— y comprobarlo contra los archivos locales. No ejecutar archivos sueltos por psql y declarar que quedaron registrados en el historial de la CLI. psql sigue siendo válido para consultas de validación y diagnóstico.

Aplicar en orden, una ejecución a la vez. Si falla una migración, distinguir lo aplicado y lo pendiente, reparar con una migración coherente y revalidar; no cambiar retroactivamente un archivo ya aplicado sin reconciliar su versión. Los resets/reconstrucciones de desarrollo deben dejar el historial y el estado remoto consistentes. No usar `supabase db reset` como si trabajara sobre una base local inexistente.

## Edge Functions remotas

Editar el código local y desplegar esa fuente en la función correspondiente del proyecto. Mantener configuración y código juntos; un cambio en Dashboard no puede ser la única versión. Credenciales administrativas y secretos viven en el entorno servidor de Supabase, nunca en `index.ts`, frontend o `config.toml` versionado.

El token de gestión local permite consultar/desplegar según su alcance; el token para Edge Functions no controla los privilegios de la conexión PostgreSQL. Una lectura correcta no demuestra que ya se haya hecho un despliegue de escritura. Registrar nombre de función, fuente/versión, resultado del despliegue y comprobación funcional cuando se ejecute; no publicar tokens o cuerpos de datos privados como evidencia.

## Secuencia de trabajo

```mermaid
flowchart LR
  A[Plan y alcance autorizados] --> B[SQL o código dentro de supabase]
  B --> C[Revisar contrato y proyecto destino]
  C --> D[Aplicar migración o desplegar a Supabase Cloud]
  D --> E[Validar en Cloud con frontend local]
  E --> F[Registrar evidencia en docs]
```

La evidencia identifica qué se hizo y qué sigue pendiente. Validar permisos de conexión no valida RLS, el registro, IAM o una Edge Function todavía inexistente.

## Referencias

- [Migraciones Supabase](https://supabase.com/docs/guides/deployment/database-migrations).
- [Despliegue de Edge Functions](https://supabase.com/docs/guides/functions/deploy).
- [Configuración de funciones](https://supabase.com/docs/guides/functions/function-configuration).


La mejora de recursos exteriores v3/v4 conserva generaciones previas y publica sucesoras sin cambiar especificaciones comerciales. Fuentes y orden de reposición en [catalog/README.md](catalog/README.md); evidencia de cobertura, transición y límites en [12b](../docs/planning/12b-evidencia-geometria.md).

## Recursos de referencia v5 · 20/10/2026

La migración 016 aplica el contrato de montaje de mallas y el bucket público `models`, con límite de 8 MB por archivo y sin políticas de escritura de visitantes. Hay 76 capturas GLB (74 binarios únicos), 52 recursos paramétricos v5 y 114 variantes públicas seleccionables. `models/catalog-v5/` conserva fuentes Blender, trazados y huellas; `scripts/upload-visual-v5.mjs` verifica binarios antes de publicar. `validate-visual-v5-storage.mjs` comprobó descargas públicas y rechazo anónimo HTTP 403; `--cleanup` solo elimina borradores sin referencia en base ni fuente actual dentro de `catalog/v5/`. No elimina recursos históricos referenciados. La transición v4→v5 pasó con montajes guardados antes de publicar y reapertura posterior. Sin despliegue Netlify nuevo.


## Actualización de continuidad exterior

Migraciones 017/018 aplicadas y fuentes v6/v7 publicadas; dieciocho migraciones en el Cloud existente. Se conserva todo el historial y el contrato de montaje GLB v5. Nuevos binarios en `models/catalog-v6/` y `catalog/v6/` del bucket; escritura anónima sigue denegada. No hay tablas nuevas ni modificación de Auth gestionado. Reposición y orden de publicaciones en `catalog/README.md`; pruebas SQL `tests/visual-v6.sql` y `tests/visual-v7.sql`, controles Blender y evidencia en el documento 12c.

Actualización gravity 21/10/2026: 22 migraciones aplicadas, doce tablas propias; 70 modelos y 146 elecciones. Migración 022 añade perfiles y contrato GLB; fuentes/orden de reposición en catalog/README.md. Sin cambios de Auth, IAM ni funciones Edge.


## Comercio demo ·27/10/2026

Migraciones028–037 aplicadas: once tablas comerciales adicionales (23 propias/37 migraciones),140 ofertas actuales y cuatro permisos en la matriz IAM. Precios/stock demo; identidad comercial separada de GLB. Ninguna credencial nueva para el frontend, ni Edge Function/worker nuevos. RLS y grants impiden acceso directo a tablas; RPC pública acotada y privada por cuenta/permiso/revisión. Pruebas y contratos operativos en [13e](../docs/planning/13e-evidencia-de-implementacion-comercial.md). `node scripts/test-commerce.mjs` revierte datos de prueba; `--pending` prueba también migraciones locales pendientes sin registrarlas/aplicarlas. Concurrencia real en `test-commerce-concurrency.mjs`; no ejecutar pruebas destructivas sobre clientes reales al habilitar una futura tienda real. El entorno actual es de desarrollo y demo.
