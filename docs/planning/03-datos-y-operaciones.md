# 03 · Datos y operaciones

Relacionado: [esquema y campos](03a-esquema-y-campos.md), [acceso y RLS](04-autenticacion-y-acceso.md), [ensamblaje 3D](05-configurador-3d.md) y [fases](08-fases-y-validacion.md).

## Distribución del plan de datos

La base objetivo tiene doce tablas propias: ocho de negocio y cuatro de IAM, además de la identidad administrada por Supabase Auth. El árbol IAM y sus restricciones se centralizan en [04a](04a-iam-roles-y-permisos.md). Todo sigue en planificación, sin migraciones ejecutadas.

- [03a · Esquema y campos](03a-esquema-y-campos.md): árbol completo, tipos, relaciones, JSONB, fotos, fuentes, acabados y precios. Es la referencia principal para columnas y propiedades.
- Este documento: ingesta, composiciones prearmadas, slots, borradores, guardado, archivo, consultas e índices.
- [04 · Acceso](04-autenticacion-y-acceso.md): permisos, Auth y RLS.
- [09 · Revisión adversarial](09-revision-adversarial-de-datos.md): evidencia documental, contraejemplos y límites de cobertura.

No duplicar el árbol de columnas en los otros documentos. Las reglas de operación utilizan este esquema y deben mantenerse alineadas al cambiar una relación.

## Migración del catálogo de referencia

| Origen actual | Destino y tratamiento |
| --- | --- |
| Marca y región | `brands`, revisando nombre y slug |
| Nombre, descripción y disciplina | `components`; `Fork` pasa a categoría `fork` y `Shock` a `shock` |
| Recorrido expresado como rango | Texto de referencia; no inventar una variante con una medida concreta |
| Damping, ajustes, usos y notas | Campos de especificación o contenido técnico con la incertidumbre correspondiente |
| Rueda, eje y montaje en texto | Normalizar solo los valores inequívocos; el resto permanece «Sin confirmar» |
| Clave Marca/Modelo de imagen | `image_key` estable del mapeo local; conservar los archivos y comprobar que la foto corresponde a la variante |
| Año, precio y peso ausentes | null, hasta disponer de una fuente |

Para ofrecer una pieza antigua en el configurador se necesita al menos una variante seleccionable con medidas suficientes para su representación. Una ficha incompleta permanece como borrador administrativo; no se publica como entrada exclusivamente documental. Toda variante publicada para nuevas selecciones debe tener representación 3D funcional, incluso genérica identificada y versionada.

## Bicicletas prearmadas de referencia

La galería usa `bike_presets` y `bike_preset_items` en Supabase como fuente de verdad; sustituye la propuesta anterior de manifiesto local. Una fila de preset representa una composición concreta de talla/versión. `family_key` agrupa las composiciones del mismo modelo en UI sin una tabla adicional. `slug` identifica la referencia concreta; `label` describe su versión. No generar todas las tallas combinando piezas de una sola composición por suposición.

La marca de la bicicleta se mantiene separada de las marcas de sus componentes. `kind` distingue `factory` y `example`: fábrica exige fuente de composición exacta, versión/año cuando corresponda; ejemplo identifica una selección de ATLAS. La talla se obtiene de la variante de cuadro contenida, evitando dos tallas editables contradictorias. La galería recupera datos breves; la composición completa solo al abrir o aplicar esa referencia.

Para publicar se valida en una operación controlada: un cuadro, posiciones válidas y únicas, variantes concretas publicadas, acabados/colores admitidos y todas las piezas requeridas por esa composición. Revisar medidas y cobertura visual. FK resuelve existencia de referencias; no sustituye esta validación ni las reglas de categoría. Las prearmadas se editan/publican mediante funciones autorizadas, sin escritura directa del cliente. Un SQL de seed o actualización se valida transaccionalmente; no publicar cabeceras incompletas entre escrituras.

Aplicar exige sesión y comprueba disponibilidad actual; crea un borrador local sin guardar en remoto automáticamente. Si una referencia o pieza necesaria está retirada/no disponible, mostrar la causa y permitir otra base; no sustituir piezas silenciosamente ni fingir una composición completa. Los conflictos mecánicos conservan su tratamiento de aviso. Un montaje con trabajo pendiente ofrece guardar, descartar o cancelar antes de reemplazarlo.

El guardado posterior usa `save_build`, sin RPC especial de clonación. Se copian IDs, acabados y colores; el montaje propio no depende de un enlace vivo al preset. Cambiar una referencia no altera montajes guardados. Para retirar una composición se usa `selectable=false`; no se convierte un montaje privado en referencia pública.

## Contratos por categoría y crecimiento

`specs_schema_version` identifica el contrato de especificaciones, distinto de la revisión del montaje o de la versión del recurso visual. Los contratos son discriminados por categoría, con tipos, claves y unidades controlados. Se valida JSON al ingresar/publicar y en los límites de servicio; null significa desconocido y no cero. No aceptar un JSON arbitrario solo porque el frontend pueda mostrarlo.

La matriz completa de variaciones estudiadas está en [revisión adversarial](09-revision-adversarial-de-datos.md#matriz-de-variaciones-estudiadas). El diccionario final debe concretarse para cada categoría del inventario antes de su migración/seed. No todos sus atributos se convierten en filtros de UI.

- Cuadros: talla, generación y geometría concreta; formato delantero/trasero, interfaces principales y configuración estática de referencia. No asumir doble suspensión solo por la disciplina; anclajes y slots aplicables se declaran según la base.
- Horquillas: distinguir pletina, eje-corona, recorrido, offset, interfaces, resorte e hidráulico. Amortiguadores: entreojos, carrera y anclaje/herrajes por extremo; no deducir espacio real del depósito solo por medidas nominales.
- Ruedas: ETRTO, carcasa/compuesto y códigos completos de eje/núcleo/interfaz. Frenos: conjuntos documentados y disco con diámetro/espesor/anclaje; no equiparar todos los fluidos o piezas con igual nombre comercial.
- Transmisión y puntos de contacto: conservar ecosistema, interfaces y medidas pertinentes; una edición técnica distinta no es únicamente otro acabado.

La postura de geometría ajustable se registra en datos/manifiesto, sin crear ahora un selector de todos sus ajustes. Se pueden mantener excepciones conocidas, versionadas con fuente e IDs, junto a las reglas puras del dominio; no se añade una tabla universal de compatibilidades. Ausencia de conflicto no certifica encaje físico.

La unidad de selección se mantiene explícita: bielas incluyen el plato y frenos el conjunto pinza/maneta acordados. Un cockpit integrado, rueda completa u otro conjunto que ocupe varias posiciones no queda automáticamente soportado por existir JSONB. Si entra al inventario, se define ocupación, exclusión y sustitución atómica antes de publicarlo, sin motor genérico de kits.

**Decisión confirmada:** se selecciona el cambio trasero y se incluye su mando asociado en la representación, sin selector independiente. El slot `rear_derailleur` conserva una sola variante con dos elementos visuales anclados al cuadro y al manillar. El mando asociado debe estar identificado y documentado; esta agrupación visual no afirma que se vendan juntos ni suma su precio automáticamente. La cadena se representa con recorrido simplificado en la postura estática, incluyendo las roldanas cuando esté instalado el cambio; sin las piezas necesarias se identifica el montaje incompleto, sin simular funcionamiento.

## Slots del montaje

Slots iniciales: `frame`, `fork`, `shock`, `front_rim`, `rear_rim`, `front_tire`, `rear_tire`, `front_hub`, `rear_hub`, `front_brake`, `rear_brake`, `front_rotor`, `rear_rotor`, `cassette`, `chain`, `rear_derailleur`, `bottom_bracket`, `crankset`, `pedals`, `handlebar`, `stem`, `seatpost` y `saddle`.

Los radios y cables los genera la escena según las piezas seleccionadas; no son filas individuales. Un conjunto de bielas incluye el plato de la representación inicial. Cada slot tiene una categoría esperada y, si aplica, una posición delantera/trasera. Esa relación se declara explícitamente, sin comparar textos de nombres comerciales.

| Categoría | Slots | Unidad de selección |
| --- | --- | --- |
| `frame` | `frame` | Cuadro de una talla/variante concreta |
| `fork`, `shock` | `fork`, `shock` | Horquilla o amortiguador |
| `rim`, `tire`, `hub` | Slots front/rear correspondientes | Aro, neumático o buje por posición |
| `brake` | `front_brake`, `rear_brake` | Conjunto visual de pinza y maneta; latiguillo generado |
| `rotor` | `front_rotor`, `rear_rotor` | Disco por posición |
| `cassette`, `chain` | `cassette`, `chain` | Cassette y cadena; eslabones simplificados |
| `rear_derailleur` | `rear_derailleur` | Cambio trasero y mando asociado; una elección, dos posiciones visuales |
| `bottom_bracket` | `bottom_bracket` | Pedalier independiente, interfaces de caja y eje |
| `crankset` | `crankset` | Bielas y plato del conjunto |
| `pedals` | `pedals` | Pareja de pedales |
| `handlebar`, `stem`, `seatpost`, `saddle` | Slot de igual nombre | Componente individual |

Decisión ampliada: el pedalier es seleccionable y se guarda en `bottom_bracket`; el eje integrado de las bielas no se duplica. Validar cuadro↔pedalier y pedalier↔bielas por separado. El plato permanece incluido con bielas. Contratos por categoría e inventario documental en [11](11-propuesta-de-inventario.md); los genéricos sencillos de manillar/potencia/sillín son excepciones identificadas, sin atribución comercial inventada.

La posición delantera/trasera pertenece al slot. Una variante puede servir en varias posiciones si tiene sentido como representación; las diferencias mecánicas generan avisos. Las piezas incluidas en un conjunto no tienen selectores independientes no solicitados.

Las medidas documentadas de `specs` y los parámetros aproximados del render cumplen funciones distintas. Una medida desconocida queda null en la ficha; un valor visual estimado vive en el manifiesto/generador con su procedencia aproximada. No rellenar una ficha con valores inventados para conseguir que la escena se dibuje.

Un borrador puede estar incompleto. Sin cuadro seleccionado se muestra la selección de bicicleta base. Cambiar cuadro o una pieza que afecta a otras produce una revisión de dependencias antes de aplicar el cambio; no se borran piezas silenciosamente.

## Contrato del borrador

Ejemplo conceptual; los IDs entre corchetes se sustituyen por UUID reales:

```json
{
  "schemaVersion": 1,
  "name": "Mi montaje enduro",
  "items": [
    { "slot": "frame", "variantId": "[uuid-cuadro]", "finishId": "graphite", "customColor": "#335C43" },
    { "slot": "fork", "variantId": "[uuid-horquilla]", "finishId": "factory-black", "customColor": null }
  ]
}
```

Se guardan elecciones, no geometrías ni posiciones arbitrarias del usuario. La escena reconstruye el montaje usando los manifiestos. `schemaVersion` permite detectar un borrador antiguo y migrarlo o informar de que no puede abrirse; no confundir esta versión del formato con `revision`, que cambia en cada guardado remoto.

`allowed_finishes` contiene el acabado por defecto, las opciones y la bandera de color libre. `finish_id` identifica un acabado válido; `custom_color` admite null o un color sRGB `#RRGGBB`, normalizado al guardar. Si hay color personalizado, solo modifica los nodos pintables del recurso. Se rechaza un color personalizado en una variante no habilitada. No aceptar CSS arbitrario, degradados o scripts en este campo. Al restaurar, el mismo acabado y color deben aplicarse a la pieza correcta.

## Lecturas y escrituras

| Operación | Mecanismo |
| --- | --- |
| Listar catálogo y fichas | Consultas Data API con filtros, paginación y RLS |
| Obtener variantes para comparar | Consulta por IDs publicados; misma categoría |
| Abrir mis montajes | Consulta `builds` y `build_items` bajo RLS del propietario |
| Guardar o renombrar | Una RPC `save_build` que escribe cabecera y piezas en una transacción |
| Eliminar montaje | `DELETE` de cabecera bajo RLS; piezas con borrado en cascada |
| Editar/publicar catálogo y prearmadas | RPC administrativas autorizadas y SQL/seed revisado; sin DML indiscriminado del cliente |
| Cargar archivos 3D | Herramientas del equipo en Supabase; no formulario web de subida |

No se crea una RPC para cada lectura simple. `save_build` existe porque un fallo al sustituir piezas no debe dejar medio montaje guardado.

### RPC `save_build`

Entradas: `p_build_id` UUID conocido antes de enviar, `p_expected_revision` y `p_configuration` con el contrato anterior. Para crear, el cliente genera el UUID una sola vez y usa revisión esperada 0; para actualizar, usa el ID y revisión leídos. Salida: `id`, `revision` y `updated_at`. El UUID del cliente no otorga acceso; no se acepta `user_id` suministrado por el cliente.

1. Exigir sesión y permiso vigente `builds.write_own`; derivar propietario de `auth.uid()`, sin bypass por rol admin. Crear un montaje, incluida una copia, exige además `configurator.use`.
2. Validar formato, tamaño, slots únicos, nombre, versión y referencias permitidas.
3. Para crear, exigir que el ID no exista, establecer propietario y revisión 1. Para actualizar, bloquear la cabecera, comprobar propiedad y revisión esperada antes de escribir. Comparar los items enviados con los persistidos en formato canónico: cualquier cambio de slot, variante, acabado o color exige además `configurator.use`. Con escritura propia sin ese permiso solo se permite renombrar conservando las mismas piezas; no confiar en una bandera «solo renombrar» del cliente.
4. Validar categoría por slot, acabado y color por variante; sustituir las filas del montaje de forma atómica. Los conflictos mecánicos se notifican en el producto, pero no rechazan este guardado visual.
5. Para una actualización, incrementar la revisión exactamente una vez en esta función, devolver confirmación y revertir todo si hay un error. Ningún trigger adicional incrementa esa misma revisión.

Dos pestañas con la misma revisión no deben pisarse silenciosamente: la segunda recibe conflicto y ofrece recargar o guardar como copia. La copia tiene un ID nuevo: antes deben reemplazarse o quitarse las piezas retiradas, identificándolas sin perder el borrador; la excepción de conservación no se transmite a la copia. Tras un timeout, se consulta el ID conocido bajo la sesión del propietario y se compara la configuración almacenada con la instantánea enviada en formato canónico: posiciones ordenadas y colores normalizados, sin depender del orden de propiedades JSON. Solo se confirma éxito si corresponde. Si no existe, se reintenta con el mismo ID; si existe con otro contenido, se informa conflicto. No generar un segundo ID por un resultado incierto ni sobreescribir una revisión desconocida. Actualizar un montaje eliminado devuelve conflicto/no encontrado, nunca lo recrea. Cabecera y piezas se leen coherentemente en una sola consulta relacional cuando sea posible. No se permiten dos guardados simultáneos del mismo montaje desde una pestaña.

Crear y actualizar montajes y piezas tiene una sola entrada de aplicación: `save_build`. Se revocan INSERT/UPDATE/DELETE directos sobre `build_items` e INSERT/UPDATE sobre `builds` a `anon` y `authenticated`. El propietario conserva SELECT y DELETE de su cabecera bajo RLS; el borrado elimina piezas por la clave foránea en cascada.

Para ejecutar esa escritura restringida, `save_build` será `security definer`, con `search_path=''`, referencias de esquema explícitas, sin SQL dinámico, ejecución solo para `authenticated` y revocada de `public` y `anon`. Al poder ejecutar con privilegios elevados, debe verificar expresamente `auth.uid()`, propiedad, publicación y cada referencia; no se presupone que RLS filtre sus consultas internas. También mantiene claves foráneas, checks y unicidad de las tablas. Las pruebas incluyen llamar a RPC con el ID de otro usuario, crear/cambiar piezas sin `configurator.use`, renombrar con escritura propia y piezas idénticas, y ejecutar escrituras directas para demostrar que no existe una ruta que eluda la validación.

## Archivo y cambios de catálogo

Una variante usada en montajes no se elimina: se marca `selectable=false`, conservando la lectura de su información publicada y su representación. El buscador de piezas ofrece solo variantes seleccionables. Un guardado permite conservar una variante retirada únicamente si el servidor confirma que el mismo montaje persistido ya tenía ese ID en ese mismo slot. No vale que estuviera en otra posición, otro montaje o un snapshot anterior enviado por el cliente. Se compara después de bloquear la cabecera; una variante retirada no se incorpora mediante una referencia prearmada nueva.

Los recursos se publican con rutas de versión inmutables; actualizar un GLB no debe alterar sin aviso todos los montajes. Los cambios de referencia, simplificación o geometría crean una nueva versión del recurso. Si una retirada exige eliminarlo, la ficha textual y un aviso sustituyen su representación.

La categoría del componente y el parentesco `component_variants.component_id` también quedan protegidos una vez publicados o referenciados: un cambio de identidad comercial o categoría exige una nueva identidad, sin reinterpretar montajes anteriores. Una corrección editorial de marca/nombre exige fuente y no puede encubrir ese cambio semántico.

También son inmutables los datos de una variante publicada que afectan al montaje: especificaciones de interfaz/ensamblaje, medidas visuales, recurso asociado y definición completa de acabados (IDs, materiales, color base, nodos afectados, acabado por defecto y permiso de personalización). Cambiarlos requiere una nueva variante/ID; la anterior permanece legible para sus montajes y puede dejar de ser seleccionable. Los generadores usan claves versionadas y conservan el comportamiento de las versiones referenciadas. No basta con cambiar la ruta de un GLB si se modifica la referencia desde el mismo ID de variante. Corregir texto editorial, fuente o `price_reference` no obliga a crear otra variante si no cambia el ensamblaje. Separar estos datos editables de los contratos publicados inmutables; la operación de publicación y las restricciones/funciones de la base deben impedir mutaciones que rompan montajes previos.

No despublicar la marca, el componente o el recurso de un montaje vigente como forma rutinaria de archivarlo: se retiraría su lectura por RLS. Se archiva con `selectable=false` y se conservan las referencias publicadas. Las eliminaciones de catálogo referenciado quedan restringidas; una retirada excepcional de recurso muestra el aviso de indisponibilidad previsto.

## Consultas, campos e índices

Primero fijar consultas y filtros reales; después concretar columnas e índices. Mantener relaciones y campos comunes en columnas tipadas. Los atributos específicos permanecen en JSONB tipado; un campo consultado con frecuencia puede pasar a columna o tener índice de expresión. No conservar dos fuentes editables del mismo dato ni crear EAV, una tabla por categoría o un GIN por costumbre.

| Lectura | Contrato |
| --- | --- |
| Galería de modelos | Proyección breve, paginada por modelos únicos, marca y resumen fiel de las variantes coincidentes; sin manifiestos 3D ni todas las fuentes |
| Filtro técnico | Todos los predicados deben coincidir en una misma variante elegible; no unir el recorrido de una versión con la rueda de otra |
| Detalle lateral | Modelo y variantes correspondientes, proyección suficiente para ficha; descartar respuestas de tarjetas anteriores |
| Comparación | Lote de hasta tres IDs de una categoría; no consultar cada celda |
| Prearmadas | Cabeceras paginadas; composición concreta al abrir/aplicar |
| Mis bicicletas | Cabeceras del propietario paginadas; piezas al continuar, con snapshot coherente |

No `SELECT *` general ni una consulta por tarjeta. Orden estable con desempate por ID y paginación sobre entidades de galería, no sobre filas duplicadas por joins. Empezar con páginas acotadas para el inventario previsto; adoptar cursor si las mediciones y recorridos lo justifican. Si se muestran facetas, deben corresponder a las mismas variantes elegibles que los resultados; no añadir contadores no solicitados.

Filtrar una relación embebida no implica filtrar el padre: comprobar semántica de `!inner` o EXISTS. Si los filtros relacionados requieren SQL, una función de lectura enfocada con privilegios de invocador es aceptable; no una RPC por cada campo. Vistas expuestas, si se usan, con `security_invoker` y comprobación de RLS; no se añade una vista materializada por anticipación.

| Índice inicial/candidato | Motivo |
| --- | --- |
| PK/UNIQUE de IDs y slugs | Identidad y acceso directo; no duplicar los índices ya creados por restricciones |
| `component_variants(component_id)` | Variantes de una familia y relaciones |
| `components(brand_id)` y compuesto de categoría/marca/orden cuando se justifique | Consultas de catálogo; elegir orden según filtros reales |
| `builds(user_id, updated_at, id)` | Propietario y listado estable por actualización; dirección según orden de consulta |
| UNIQUE `build_items(build_id, slot)` | Una pieza por posición y lectura del montaje |
| UNIQUE `bike_preset_items(preset_id, slot)` | Composición única por posición |
| FK inversas o filtros JSONB concretos, según consulta | Validación/archivo y filtros medidos; tipos y operador deben corresponder |

Las FK no crean automáticamente índices en sus columnas del lado hijo. No todo candidato se instala sin evaluar selectividad y coste. GIN sirve para operadores adecuados de JSON/arrays; no sustituye un B-tree de expresión numérica para intervalos. Los índices de consulta se verifican con planes de ejecución y roles/RLS reales. No prometer tiempos o concurrencia a partir del número de tablas.

## Orden de migraciones

1. IAM: esquema privado, cuatro tablas, roles/permisos base, funciones y provisionamiento seguro de registro. Catálogo, variantes y recursos: tipos, tablas, índices y restricciones.
2. Referencias prearmadas y piezas; montajes y piezas privados: relaciones, revisiones y validación por slot.
3. RLS, grants y RPC: ninguna tabla expuesta queda abierta por omisión.
4. Si hay modelos importados, bucket y políticas de Storage; carga independiente de los binarios 3D. Las fotos locales se incluyen en el build, no en ese bucket.
5. Seed del inventario acotado acordado, con modelos comerciales verificados, variantes útiles, referencias de precio disponibles y marcación de representaciones aproximadas; completo para la entrega, sin replicar todo el mercado.

Las migraciones futuras serán SQL ejecutable dentro de `supabase/migrations/`, aplicado al proyecto Supabase Cloud existente mediante un mecanismo que conserve historial. Funciones SQL/RPC, índices, RLS/grants y cambios de datos estructurales también se versionan allí. Roles/permisos base obligatorios pertenecen a la migración IAM; seed solo para contenido/datos de prueba deliberados. Seguir [supabase/README.md](../../supabase/README.md). No se levanta base local ni se ejecutan cambios por actualizar este contrato.

## Referencias

- [Funciones PostgreSQL y seguridad de ejecución](https://supabase.com/docs/guides/database/functions).
- [RLS en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Actualización de consultas tras edición administrativa

Al guardar datos de catálogo, invalidar las listas y fichas afectadas, sus filtros y las referencias que muestran sus piezas. Publicar una marca debe renovar también los selectores públicos de marcas. Al guardar una composición, renovar su lista y detalle. Conservar la caché entre lecturas normales; no exigir recargar la página para ver un cambio confirmado desde la administración. Las invalidaciones independientes pueden ejecutarse juntas con TanStack Query, sin añadir un sistema de eventos o sincronización en tiempo real.

Mediciones de consultas reales con RLS, sus scripts y límites por cardinalidad en [12a](12a-evidencia-del-visor.md#consultas-con-rls). Los tiempos actuales no sustituyen una prueba de carga ni justifican índices por anticipación.
