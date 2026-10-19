# Repository Guidelines

## Planificación y documentación
- Fase actual: exclusivamente planificación. Actualizar los planes antes de implementar; no modificar código, recursos gráficos, configuración, dependencias ni servicios hasta que el usuario indique iniciar implementación. La autorización de reconstrucción futura no autoriza ejecutarla durante esta fase.
- La dirección objetivo del producto está en `docs/planning/README.md`; el código descrito abajo es el prototipo de referencia y puede reconstruirse según esos planes.
- Antes de crear o mover documentación, seguir `docs/README.md`: `planning/` para propuesta o trabajo parcial, `validation/` para implementación por comprobar y `finished/` para implementación validada. Actualizar enlaces al mover un conjunto de documentos.
- Los archivos `.env` y sus variantes locales no se versionan. `.env.example` solo contiene una plantilla vacía; nunca poner secretos en variables `VITE_*`.
- Todo trabajo ejecutable o validable del alcance —investigar/completar inventario, cerrar diccionarios/manifiestos, diseñar bocetos pendientes, preparar recursos e implementar/probar/corregir— debe figurar dentro de las fases del plan de implementación, con resultado y aceptación. No tratarlo como requisito externo que el usuario deba resolver antes de iniciar. Respetar dependencias internas y consultar solo decisiones reales de negocio/diseño sobre propuestas concretas, continuando trabajo independiente.
- Implementar el alcance acordado completo, sin reducirlo a MVP ni añadir funciones o campos no solicitados. Las fases intermedias y los datos de prueba no sustituyen la aceptación funcional integral.
- Arquitectura aprobada en `docs/planning/02-arquitectura-y-frontend.md`: módulos por funcionalidad y reglas de montaje independientes de React, Three.js y Supabase. Aplicar SOLID con criterio y reutilizar componentes/reglas sin crear capas ni abstracciones innecesarias.
- Seguir `docs/planning/06-ui-y-ux.md` para lenguaje de interfaz: títulos sin redundancias, vocabulario coherente de usuario y mapeo de códigos técnicos a etiquetas y mensajes comprensibles. No mostrar claves internas, errores brutos del SDK ni términos de implementación en los recorridos normales. Usar voz propia del producto MTB: sin «Aquí puedes…», comentarios de asistente ni instrucciones genéricas de relleno; conservar etiquetas, errores y contexto necesarios.
- Referencia de estilo UI/UX aprobada: COMMENCAL; limpieza, contraste, bicicleta protagonista y carácter deportivo con movimiento puntual. Mantener contenido propio de ATLAS MTB y seguir los criterios de accesibilidad y rendimiento del documento 06.

- Consultar `docs/planning/03a-esquema-y-campos.md` para tablas y campos; `03-datos-y-operaciones.md` para operaciones. Los bocetos aprobados viven en `06a-portada-y-acceso.md` y `06b-espacio-de-trabajo.md`; `06-ui-y-ux.md` conserva principios compartidos. Separar documentos por responsabilidad cuando crezcan, actualizando índices y enlaces sin duplicar contratos.
- Autenticación/IAM: Auth nativo, un login común y registro público siempre user. Esquema iam con cuatro tablas y roles configurables; user/admin iniciales protegidos. Consultar `04a-iam-roles-y-permisos.md` y `04b-administracion-y-operaciones.md`. Administrar cuentas con Edge Functions en Supabase; nunca secretos privilegiados en React ni ascensos por metadata. Total: doce tablas propias, ocho de negocio y cuatro IAM.
- UI administrativa aprobada en `docs/planning/06c-administracion-usuarios-roles-y-permisos.md`: pestañas Usuarios/Roles/Permisos, tablas sencillas, crear y detalle en panel derecho y matriz por rol (horizontal) y permiso (vertical). Guardado explícito; user/admin protegidos en lectura.
- Navegación aprobada: espacio de trabajo con pestañas Bicicletas, Componentes y Mis bicicletas; conservar contexto. Detalles completos en un panel lateral (inferior en móvil), sin páginas o modales encadenados; el configurador reutiliza su panel. Inicio desde cuadro o composición prearmada, con inventario pendiente de concretar en los planes.

## Contexto operativo para nuevas sesiones de Codex
- Al iniciar una sesión/terminal en este repositorio, leer este AGENTS.md, `docs/planning/README.md` y el estado de accesos en `docs/planning/07-entornos-y-despliegue.md`. Conservar las decisiones aprobadas; no reiniciar el proyecto o pedir credenciales que ya están configuradas.
- Supabase Cloud ya está creado. Frontend local; base, Auth, Storage y Edge Functions remotos. No levantar Supabase/PostgreSQL locales, Docker ni un segundo entorno de base por obligación. La CLI local, cuando se prepare, es una herramienta de acceso/despliegue remoto.
- Las credenciales están en `.env` de la raíz: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_DB_URL y SUPABASE_ACCESS_TOKEN. Nunca imprimir sus valores, copiarlos a documentación o exponerlos como VITE. Los nombres VITE públicos del frontend siguen pendientes de integración, según la última comprobación.
- Accesos verificados el 18 de octubre de 2026: Auth/API y Auth Admin responden; PostgreSQL conecta y declara permisos CREATE; token de gestión lista Edge Functions (HTTP 200). Snapshot: 0 tablas public, iam inexistente y 0 Edge Functions. Solo se hicieron lecturas: no afirmar migraciones o despliegues de escritura probados. Consultar 07 para límites y estado actualizado.
- El usuario declara un proyecto de desarrollo sin usuarios reales ni producción. Cuando autorice implementar, se permiten cambios/reconstrucciones necesarios de tablas propias, datos de prueba y funciones del alcance en ese proyecto, sin confirmaciones repetidas por rutina. La fase actual sigue siendo planificación; actualizar contexto no autoriza ejecutar cambios remotos ahora. No eliminar el proyecto, secretos o esquemas gestionados por Supabase como parte de una reconstrucción de aplicación.
- Toda migración/RPC/índice/política y toda Edge Function debe tener su fuente versionada aquí antes de aplicarla a Cloud: `supabase/migrations/<timestamp>_<descripcion>.sql`, `supabase/functions/<nombre>/index.ts`, dependencias/configuración necesarias y comprobaciones pertinentes. Seguir `supabase/README.md`; conservar historial de migraciones y evidencia, sin cambios remotos como única copia.

## Comunicación visual predeterminada con Codex
- Para explicar arquitectura, relaciones, flujos y decisiones de lógica, recomendar y utilizar diagramas ASCII o Mermaid cuando ayuden a entender; no depender solo de párrafos técnicos.
- Para una propuesta nueva o cambio de UI, presentar por defecto un boceto/prompt ASCII de distribución, campos y acciones antes de implementarlo. Incluir estados/interacción y móvil cuando correspondan; conservar después los bocetos aprobados en el plan de su área.
- Mantener el lenguaje claro, dirigido al usuario y propio de MTB; diagramas útiles sin procesos adicionales ni repetir explicaciones vacías. Una consulta breve de estado no necesita un diagrama de relleno.

## Resumen actual del proyecto
Este repositorio ya tiene un arranque con Vite + React + TypeScript. La pagina principal muestra el catalogo de suspension MTB por marca y modelos, con secciones de contenido, filtros visuales y tarjetas con imagenes. Existe una pagina de detalle por modelo con especificaciones completas, y un logo propio de Atlas MTB en SVG.

## Estructura del proyecto
- `src/pages/`: paginas principales.
  - `Home.tsx`: landing + catalogo, ventanas funcionales, galeria de modelos.
  - `ModelDetail.tsx`: ficha completa por modelo.
- `src/data/`: datos del catalogo y mapeo de imagenes.
  - `suspension.ts`: marcas, modelos, y especificaciones.
  - `images.ts`: asociacion `Marca|Modelo` -> imagen.
- `src/assets/images/`: imagenes reales de modelos.
- `src/assets/atlas-mtb.svg`: logo principal.
- `src/utils/routing.ts`: helpers de slug y hash routing.

## Navegacion y rutas
Se usa hash routing simple: `#/modelo/<slug>` para ver la ficha de un modelo. El estado se actualiza en tiempo real con el evento `hashchange` (no requiere F5). Cada modelo genera su slug desde `Marca + Modelo`.

## Contenido y idioma
Todo el texto descriptivo esta en espanol. Nombres de marcas y modelos permanecen en ingles. Las imagenes se conectan por la clave `Marca|Modelo`.

Marca aprobada: **ATLAS MTB**. Eslogan: **Cada pieza define tu camino**. La firma debe ser profesional, elegante y legible; el eslogan no se repite en cada sección.

## Estilos y branding
El estilo visual actual se concentra en `src/index.css`. El prototipo conserva el logo SVG rojo industrial y su efecto hover. La nueva marca y los requisitos de su futuro logotipo están planificados en `docs/planning/06-ui-y-ux.md`; todavía no se implementan recursos nuevos.

## Comandos
- `npm install`: instala dependencias.
- `npm run dev`: levanta el entorno local.
- `npm run build`: genera build de produccion.
- `npm run preview`: previsualiza el build.

## Flujo recomendado
Para agregar modelos nuevos, actualiza `src/data/suspension.ts` y asigna su imagen en `src/data/images.ts` con un archivo en `src/assets/images/`. Para crear nuevas paginas, agrega un archivo en `src/pages/` y luego integra la navegacion correspondiente.

## Cierre documental de cobertura
- Todas las piezas del catálogo publicado deben poder montarse en 3D; se permiten recursos genéricos identificados y versionados, sin fallback implícito que altere montajes anteriores.
- Cambio trasero seleccionable con mando asociado en una sola elección, sin selector separado; agrupación visual no equivale a kit o precio comercial.
- Auditoría integral en `docs/planning/10-auditoria-integral-de-planes.md`; cobertura ampliada e ingesta documental en `docs/planning/11-propuesta-de-inventario.md` y 11a–11m, por categoría. No afirmar variantes completas o ingesta real a partir de familias localizadas. Dependencias IAM y autorización de cambios publicados se rigen por 04a/04b.

- Inventario vigente: suspensión FOX/RockShox/Öhlins/Marzocchi; cuadros enduro/DH de marcas documentadas con M/L como tallas principales; frenos Shimano/Magura/SRAM, transmisión Shimano/SRAM y neumáticos por medida/terreno. Pedalier seleccionable en `bottom_bracket`; plato incluido con bielas y mando con cambio. Manillar/potencia/sillín sencillos genéricos ATLAS identificados. Mantenimiento documental específico por variante/generación, sin agenda ni contadores. Conservar doce tablas, reutilizando catálogo y JSONB tipado.

- Delimitación temporal confirmada de inventario: solo gama actual documentada. Un manual/archivo histórico no prueba vigencia; excluir descatalogados del inventario inicial y marcar pendientes de vigencia, sin inventar modelos/SKU.

## Commits
- Crear commits únicamente cuando el usuario lo solicite explícitamente. La autorización para implementar, corregir, validar o actualizar planes no autoriza comitear. Una solicitud de commits cubre solo los cambios indicados y no se extiende a cambios futuros; nunca comitear automáticamente al terminar una fase.
- Cuando el usuario solicite comitear, separar los cambios por propósito en commits coherentes y revisables; no agrupar trabajo independiente en un único commit.
- Usar Conventional Commits en inglés: `type(scope): imperative description`, con scope cuando ayude. Ejemplos: `docs(catalog): define suspension inventory` y `chore(git): ignore local environment files`. Si se añade cuerpo, escribirlo también en inglés.
- Elegir el tipo según el cambio real: `docs` para documentación, `fix` para correcciones funcionales, `feat` para funciones implementadas y `chore` para mantenimiento. Documentar una función futura no es implementarla ni justifica `feat`.
- Revisar estado, diff e índice antes de comitear; usar rutas explícitas para preparar cada grupo. Respetar cambios ajenos y conservar los archivos de trabajo al reorganizar el staging. No incluir `.env`, credenciales ni archivos generados innecesarios.
- Ejecutar las comprobaciones apropiadas al grupo y describir honestamente su alcance; verificar después los commits y el estado restante. No hacer push salvo que el usuario lo solicite.
