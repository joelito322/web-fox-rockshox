# 07 · Entornos y despliegue

Relacionado: [arquitectura](02-arquitectura-y-frontend.md), [Auth](04-autenticacion-y-acceso.md) y [fases](08-fases-y-validacion.md).

## Estado real del entorno y accesos

El proyecto Supabase Cloud ya está creado y en ejecución. El frontend se trabaja localmente; backend, Auth, Storage, Edge Functions y base se trabajan directamente en ese proyecto cloud. Por decisión del usuario no se levantará Supabase local, PostgreSQL local, Docker o una réplica local. Netlify sigue siendo el destino futuro del frontend, todavía sin producción desplegada ni usuarios reales según el usuario.

Las credenciales están en `.env` en la raíz, ignorado por Git. No volver a solicitar valores ya disponibles; leerlos solo en procesos que los necesiten y no imprimirlos, copiarlos a planes o incluirlos en comandos/logs. Al abrir una sesión nueva revisar este estado y las variables por nombre, sin asumir que un archivo de entorno significa que una función de producto está implementada.

Validación histórica previa al inicio: 18 de octubre de 2026, únicamente lecturas. Estado actual en la actualización siguiente.

| Comprobación | Resultado observado | Límite de la evidencia |
| --- | --- | --- |
| URL + clave publicable | Auth health/settings HTTP 200; API de datos responde | No se ejecutó registro ni flujo de aplicación |
| Clave secreta | Auth Admin y descripción de API HTTP 200 | No se crearon cuentas ni se cambiaron datos |
| PostgreSQL | Conexión correcta y consulta explícita READ ONLY; permisos CREATE de base/esquema public disponibles | Capacidad declarada para migraciones; no se ejecutó DDL |
| Coherencia de destino | URL de API y conexión PostgreSQL corresponden al mismo proyecto | Confirmar destino al aplicar cambios futuros |
| Estado de negocio | 0 tablas en public; esquema iam inexistente | Snapshot de la última consulta, no estado garantizado para siempre |
| Token de gestión | Listado de Edge Functions HTTP 200, 0 funciones | Lectura validada; no se probó despliegue/escritura |

El 401 inicial de `/rest/v1/` con clave publicable correspondía a una descripción de API que exigía clave secreta; no se interpretó como fallo de conexión. No se usó una escritura para probar permisos. La CLI no estaba instalada en la revisión; preparar herramientas al comenzar implementación no requiere un stack local.

## Actualización de implementación · 19 de octubre de 2026

El snapshot anterior conserva la comprobación histórica previa al inicio. Actualmente hay doce tablas propias, trece migraciones aplicadas con historial remoto y la función `admin-users` desplegada desde la fuente del repositorio. Las pruebas API y SQL de aislamiento, roles y guardado pasaron; evidencia y pendientes completos en [12](12-estado-implementacion.md).

Los nombres públicos VITE ya están integrados mediante `.env.local` ignorado. Node 24.22.0 y pnpm 12.6.0 fijados; build correcto y pruebas ejecutables. Existen `netlify.toml` y `public/_redirects`; no hay despliegue Netlify todavía. Las secciones prospectivas inferiores describen el contrato de despliegue y no sustituyen este estado.

Auth permite lectura de configuración (HTTP 200), pero la escritura con el token actual devuelve HTTP 403. Site URL observado: localhost:3000, sin callbacks; no hay SMTP propio configurado. Las plantillas y callbacks preparados en `supabase/` siguen pendientes de aplicación. La primera cuenta administradora `admin@atlas.mtb` ya está confirmada y vinculada a admin con doce permisos mediante la operación controlada del repositorio.

## Distribución

```mermaid
flowchart LR
  A[Repositorio GitHub] --> B[Netlify: instalar y compilar frontend]
  B --> C[dist: aplicación estática]
  C --> D[Navegador: incluye las fotos locales]
  D --> E[Supabase Auth]
  D --> F[Data API y RPC con RLS]
  D --> G[Storage de modelos 3D importados]
  D --> J[Edge Functions: identidad y autorización]
  J --> K[Auth Admin solo en servidor]
  J --> F
  H[Migraciones SQL revisadas] --> I[Aplicación separada en Supabase]
  I --> F
```

Netlify publica solo el frontend. No se despliegan SQL como rutas web ni se incluyen credenciales administrativas en el build. Supabase existe como servicio gestionado independiente.

## Variables de entorno y Git

Variables presentes y comprobadas por nombre en `.env`, sin registrar sus valores:

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto Cloud |
| `SUPABASE_PUBLISHABLE_KEY` | API pública/Auth de la aplicación |
| `SUPABASE_SECRET_KEY` | Operaciones administrativas en procesos de servidor |
| `SUPABASE_DB_URL` | Conexión PostgreSQL para herramientas y migraciones remotas |
| `SUPABASE_ACCESS_TOKEN` | API de gestión/Edge Functions según alcance del token |

El token se usa para Edge Functions: lectura y despliegue de `admin-users` ya comprobados. También permite leer configuración de Auth, pero su escritura devolvió HTTP 403. La conexión SQL independiente permitió aplicar las trece migraciones; el alcance del token no limita ese acceso PostgreSQL.

El frontend Vite usa estos nombres públicos mediante `.env.local` ignorado, conservando los nombres originales de herramientas en `.env`:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Se completaron con los equivalentes públicos, sin copiar secretos al prefijo VITE. No renombrar o eliminar las variables existentes de herramientas por ese cambio. El `.env.example` contiene únicamente nombres y valores vacíos; las credenciales reales se mantienen en `.env`. No crear plantillas con cuentas o contraseñas predeterminadas.

Todo valor VITE usado por el frontend se publica en el build. URL y clave publicable pueden ir al cliente; clave secreta, conexión SQL, token de gestión y SMTP no. Las funciones remotas reciben su configuración segura en Supabase, no por incluir el `.env` de la raíz en el paquete del frontend o de la función.

La protección `.env`, `.env.*` y excepción de plantilla vacía ya se aplicó en [`.gitignore`](../../.gitignore). Se verificó exclusión de `.env`, `.env.local` y entornos de subcarpetas, sin archivos reales de entorno rastreados. La carpeta temporal de la CLI y los resultados de navegador están ignorados; no confundirlos con fuentes de migraciones o funciones.

Antes de un push comprobar exclusión y archivos rastreados, sin imprimir valores:

```bash
git check-ignore -v .env .env.local supabase/.env.local
git ls-files '.env' '.env.*' '**/.env' '**/.env.*'
```

La segunda orden solo puede mostrar plantillas vacías permitidas; ignorar un archivo no lo retira si ya estaba rastreado. No versionar volcados con datos privados, credenciales, backups o copias renombradas del entorno.

## Backend versionado en el repositorio

La estructura y procedimiento principal viven en [supabase/README.md](../../supabase/README.md): SQL ordenado en `supabase/migrations/`, cada Edge Function en `supabase/functions/<nombre>/index.ts`, configuración necesaria y pruebas pertinentes. Las fuentes ya existen: trece migraciones aplicadas, Edge Function desplegada, operaciones controladas, plantillas, datos de catálogo en borrador y pruebas. El detalle de estado y sus límites está en 12.

Primero preparar la fuente local y después aplicarla al proyecto Cloud autorizado, conservando historial de migraciones y fuente del despliegue. No dejar cambios remotos como única copia. Roles/permisos base necesarios para funcionar pertenecen a migraciones; el seed se reserva a contenido/datos de prueba deliberados. La validación funcional y sus resultados quedan en el documento 08, enlazados con la fuente aplicada.

## Compilación objetivo en Netlify

La fase 0 fijó pnpm 12.6.0 y Node 24.22.0, con `.node-version`, packageManager, un único lockfile y permiso de build de esbuild. La instalación con `--frozen-lockfile`, el build y las pruebas pasan. Se eliminó el lockfile npm redundante.

Configuración fuente actual: [`netlify.toml`](../../netlify.toml), con build `pnpm run build` y publicación de `dist`; todavía no se publicó el frontend. Mantener las variables públicas en el contexto de Netlify al desplegar, sin secretos privilegiados.

La SPA ya incluye `public/_redirects`:

```text
/*    /index.html    200
```

Probar acceso directo y recarga de fichas, montajes y `/auth/callback`. La reescritura no sustituye la pantalla 404 de React. Los archivos estáticos existentes se sirven normalmente. No hace falta añadir funciones de Netlify ni el plugin de emulación de sus servicios para publicar este frontend estático.

Los fallos previos del comparador y de compatibilidad Vite/Vitest se resolvieron. Quedan la aceptación funcional integral, las mediciones y el dominio/correo para declarar listo el despliegue.

## Configuración de Supabase

1. Utilizar el proyecto Cloud ya creado y las variables existentes; las lecturas de conexión están verificadas. Confirmar su identidad antes de aplicar archivos, sin crear otro proyecto o stack local.
2. Aplicar migraciones en orden y revisar restricciones, grants y RLS.
3. Si el inventario usa GLB importados, crear su bucket público con límites de archivo razonables y sin escrituras de visitantes o usuarios registrados. Una escena completamente procedimental no requiere ese bucket.
4. Cargar los recursos 3D importados y el seed publicado, comprobando referencias y tamaños. Las fotos de componentes se resuelven desde los imports de `src/assets/images/` y se publican con Netlify.
5. Configurar Auth, confirmación de correo y plantillas del [contrato de callback](04-autenticacion-y-acceso.md).
6. Registrar Site URL de producción y callbacks permitidos para producción y desarrollo.
7. Verificar envío de correo; preparar SMTP apropiado antes del registro público e invitaciones.
8. Preparar esquema iam sin exposición directa en Data API, roles/permisos base, provisionamiento user y funciones autorizadas; verificar grants y bootstrap controlado del primer administrador.
9. Desplegar Edge Functions administrativas por separado del frontend, con secretos solo en Supabase y autenticación del solicitante; probar visitante, user y revocación de permisos.
10. Configurar plantilla/callback de invitación y establecimiento de contraseña; comprobar resultados parciales entre Auth Admin y asignación IAM.

El servidor de este trabajo se ejecuta en `http://localhost:5174`: el puerto 5173 estaba ocupado por otro proceso y se conservó. La configuración de Auth preparada contempla callbacks concretos de 5173, 5174 y del navegador de pruebas en 127.0.0.1:4180; el usuario los aplicará desde Dashboard. Las previews de Netlify solo tendrán acceso de prueba si su origen está permitido de forma deliberada. Preferir una preview estable; no abrir redirecciones a cualquier dominio.

## Desarrollo actual y despliegues futuros

| Contexto | Frontend | Backend/base |
| --- | --- | --- |
| Actual | Vite en el equipo | Supabase Cloud del proyecto ya creado; datos de desarrollo |
| Preview futura | Netlify si se prepara | El destino Cloud configurado explícitamente; callback permitido |
| Producción futura | Netlify al publicar | Destino acordado antes de admitir usuarios reales; no existe producción actualmente |

No se exige una base local ni un segundo proyecto para ejecutar este plan. El usuario autoriza reconstrucciones necesarias de tablas propias, datos de prueba y Edge Functions del alcance en el proyecto de desarrollo cuando se inicie implementación; no repetir aprobaciones para tareas rutinarias ya autorizadas. La solicitud posterior del usuario autorizó implementar y aplicar los cambios del alcance. Preservar las fuentes versionadas, comprobar el destino y mantener coherente el historial; no extender esa autorización a borrar el proyecto o esquemas internos gestionados por Supabase.

SQL, Edge Functions y frontend tienen despliegues separados. Aplicar sus cambios con contratos compatibles; revertir Netlify no revierte automáticamente base o funciones. La aparición de usuarios reales o producción cambiará el contexto declarado y deberá reflejarse en estos planes antes de aplicar allí procedimientos de reconstrucción de desarrollo.

## Archivos y límites del plan gratuito

Los recursos aprobados usan rutas versionadas, por ejemplo `models/frame-reference/v1/frame.glb`. Aprovechar caché para rutas inmutables. No subir originales de trabajo pesados como si fueran recursos de descarga. Medir descarga inicial y consumo real de Storage antes de ampliar el catálogo.

Las fotos de componentes se mantienen en `src/assets/images/`, optimizadas y referenciadas por el mapeo local. Forman parte de los archivos estáticos publicados en Netlify; modificarlas requiere un nuevo build. Su transferencia corresponde al alojamiento del frontend. La geometría procedimental no consume Storage de Supabase: se genera en memoria, aunque sus metadatos de catálogo puedan estar en PostgreSQL.

El plan gratuito sirve como punto de partida, no como capacidad ilimitada. Revisar cuotas vigentes de base, Storage, transferencia, Auth y disponibilidad en el panel al preparar el lanzamiento. Si el límite afecta principalmente a modelos, primero optimizar archivos y carga; después evaluar alojamiento de assets o un cambio de plan según uso real.

## Verificación antes del primer deploy funcional

- Build y pruebas relevantes pasan con instalación reproducible.
- Las variables públicas están presentes en el contexto correcto y no hay secretos incluidos.
- Rutas profundas, callback y enlace antiguo de modelo funcionan al recargar.
- Registro, entrada, recuperación, cierre y guardado se prueban desde el dominio publicado.
- Se comprueba por API el aislamiento de dos cuentas y la denegación de escrituras de catálogo sin permiso, además de las operaciones autorizadas.
- Un fallo de Storage o WebGL deja disponible la lista y las fichas.

## Referencias

- [Netlify: Vite, carpeta de publicación y rutas SPA](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).
- [Vite: exposición de variables de entorno](https://vite.dev/guide/env-and-mode).
- [Supabase: claves publicables y secretas](https://supabase.com/docs/guides/getting-started/api-keys).
- [Supabase: redirecciones de Auth](https://supabase.com/docs/guides/auth/redirect-urls).
- [Supabase: migraciones remotas](https://supabase.com/docs/guides/deployment/database-migrations).
- [Supabase: despliegue de funciones](https://supabase.com/docs/guides/functions/deploy).
- [Supabase: uso y cuotas del plan](https://supabase.com/docs/guides/platform/billing-on-supabase).
