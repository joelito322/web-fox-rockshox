# 10 · Auditoría integral de planes

Fecha: 18 de octubre de 2026. Estado: revisión documental, sin implementación. Relacionado: [índice](README.md), [fases y aceptación](08-fases-y-validacion.md) y [propuesta de inventario](11-propuesta-de-inventario.md).

Nota posterior: el usuario amplió el inventario y confirmó pedalier seleccionable. [11](11-propuesta-de-inventario.md) y 11a–11m sustituyen el límite de cuatro cuadros/una talla. Esta auditoría refleja su fecha y alcance original; los diccionarios ampliados y su futura implementación requieren sus comprobaciones de aceptación, sin atribuirles una nueva auditoría multiagente.

## Método y resultado

Por solicitud del usuario participaron tres agentes con revisión adversarial independiente: producto/UX, datos/IAM y arquitectura/operación. Se contrastaron sus hallazgos entre sí y con los contratos escritos; una observación no se aceptó automáticamente por proceder de un agente. Por ejemplo, la vista 3D opcional de detalle ya estaba prevista en 06b: se conserva con carga diferida, sin añadir el motor al listado inicial.

La arquitectura modular con reglas independientes y las doce tablas propias siguen siendo adecuadas para el alcance escrito. Los hallazgos requieren precisar contratos existentes, sin más tablas, infraestructura o capas. Esto es una conclusión documental: no certifica SQL, rendimiento, calidad del arte 3D o ausencia de errores de una implementación que todavía no existe.

## Hallazgos y correcciones incorporadas

| Prioridad | Contraejemplo | Resolución en el contrato principal |
| --- | --- | --- |
| Alta | Editar el precio o texto de una pieza publicada elude `publish` | [04a](04a-iam-roles-y-permisos.md#dependencias-de-permisos) y [04b](04b-administracion-y-operaciones.md): toda modificación visible exige publicación del área; gestionar solo permite borradores |
| Alta | Cambiar categoría o padre de una variante reinterpreta montajes antiguos | [03](03-datos-y-operaciones.md#archivo-y-cambios-de-catálogo): proteger identidad semántica publicada/referenciada; crear nueva identidad cuando cambie |
| Alta | Un fallback genérico implícito cambia de forma al actualizar el generador | [03a](03a-esquema-y-campos.md#recursos-fotos-e-identidad): recurso explícito versionado también para geometría procedural |
| Alta | Invitar entrega primero `user` aunque el actor no pueda conceder sus capacidades | [04a](04a-iam-roles-y-permisos.md#dependencias-de-permisos): comprobar permisos base antes de Auth, además del rol final |
| Media | Guardar sin leer impide recuperar un timeout; asignar sin acceso a usuarios deja una operación inaccesible | [04a](04a-iam-roles-y-permisos.md#dependencias-de-permisos): dependencias explícitas, sin concesión silenciosa |
| Media | Asignar un rol obliga a recibir administración completa de roles | [04b](04b-administracion-y-operaciones.md): consulta mínima de roles activos otorgables para el selector |
| Media | El acceso envía a Mis bicicletas aunque el rol no pueda leer montajes | [04](04-autenticacion-y-acceso.md): destino según intención válida y permisos, con alternativa pública y sin bucles |
| Media | Guardar como copia incorpora piezas retiradas prohibidas en un montaje nuevo | [03](03-datos-y-operaciones.md) y [06b](06b-espacio-de-trabajo.md): reemplazar/quitar retiradas antes de copiar; conservar borrador |
| Media | Estado de selección nuevo y escena anterior se guardan como si fueran lo mismo | [02](02-arquitectura-y-frontend.md) y [06b](06b-espacio-de-trabajo.md): candidato separado de pieza aplicada; confirmar solo solicitud vigente y guardar aplicadas |
| Media | No existe acción para quitar una pieza aunque se permitan borradores incompletos | [06b](06b-espacio-de-trabajo.md): quitar pieza distinta del cuadro y deshacer; conjuntos incluidos se retiran juntos |
| Media | Ejes declarados como mano derecha orientan Z al lado incorrecto | [05](05-configurador-3d.md#contrato-espacial): X delante, Y arriba, Z derecha y conversión única de importación |
| Baja | Una instrucción de prueba permite base local y una nota histórica afirma que gitignore no cambió | [08](08-fases-y-validacion.md): pruebas en Cloud de desarrollo y exclusión local de entorno reflejadas correctamente |

Las composiciones de administración del catálogo/prearmadas no están detalladas como Usuarios/Roles/Permisos. Sus operaciones sí forman parte del alcance; falta proponer y revisar esos bocetos antes de implementar las pantallas. No se considera cerrada esa parte visual por tener definidas las funciones de datos.

## Decisiones del usuario recibidas durante la auditoría

1. Todas las piezas del catálogo deben poder montarse en 3D, con representación genérica identificada cuando no exista una específica. No habrá entradas publicadas exclusivamente documentales; las variantes incompletas permanecen en preparación administrativa.
2. Se selecciona el cambio trasero con mando asociado incluido en su representación, sin selector separado. Un slot y una variante controlan ambos elementos; no se afirma que constituyan un kit comercial ni un precio conjunto.
3. Preparar una propuesta acotada de inventario real de cuadros, prearmadas y componentes para revisión. [11](11-propuesta-de-inventario.md) es propuesta, no aprobación automática de modelos, cantidades o medidas.

## Cierres que todavía hacen falta

| Pendiente | Cómo se cierra |
| --- | --- |
| Inventario y variantes concretas | Revisar la propuesta 11 y fijar talla, versión física y composición por referencia; no inventar SKU o combinaciones |
| Integrados adicionales | La propuesta puede usar componentes separados; si se quiere cockpit integrado o rueda completa como una sola selección, definir sus slots/exclusión antes de incluirlos |
| Diccionarios de datos y manifiestos | Desarrollo concreta claves, unidades, anclajes y versionado para las variantes elegidas; estimaciones visuales separadas de medidas documentadas |
| UI administrativa de negocio | Proponer bocetos ASCII coherentes con el patrón tabla/panel aprobado y revisarlos, sin alterar las composiciones existentes |
| Identidad y aceptación visual | Revisar logo/recursos finales y bicicleta completa; acordar dispositivo/navegador de referencia para rendimiento |
| Integración efectiva | Auth/correos/callbacks, migraciones, RLS, operaciones, Storage cuando corresponda y despliegue se prueban al implementar; las credenciales Cloud ya están disponibles |

No se solicita al usuario escoger tipos SQL, índices o coordenadas técnicas. Esas decisiones corresponden al desarrollo y a sus pruebas. Tampoco se vuelve a pedir acceso a Supabase ni se crea un entorno de base local.

## Evidencia y límites

Comprobación final: 21 Markdown entre docs, AGENTS.md y supabase/README.md; 186 enlaces locales y 17 anclas sin destinos rotos; 58 bloques cerrados y un ejemplo JSON válido. `git diff --check` sin errores. Se revisaron documentos y referencias cruzadas, incluyendo una segunda lectura adversarial de datos/IAM tras las correcciones. Mermaid requiere renderizado posterior para validar su presentación. No se ejecutaron build, pruebas de aplicación, migraciones, funciones ni escrituras remotas. Todos los planes permanecen en `planning/`.
