# 09 · Revisión adversarial del modelo de datos

Relacionado: [datos](03-datos-y-operaciones.md), [arquitectura](02-arquitectura-y-frontend.md), [3D](05-configurador-3d.md) y [aceptación](08-fases-y-validacion.md).

Fecha: 18 de octubre de 2026. Estado: revisión documental y de fuentes; no implementación ni prueba de rendimiento. Permanece en `planning/`, no en `validation/`.

La revisión original siguiente evaluó ocho tablas de negocio. La ampliación posterior a doce incorpora cuatro tablas IAM en [04a](04a-iam-roles-y-permisos.md), por solicitud de roles configurables; este informe no se presenta como una revisión multiagente de ese alcance nuevo. Sus pruebas correspondientes se planifican en 08. La auditoría integral posterior de [10](10-auditoria-integral-de-planes.md) sí incluye IAM y cierra las decisiones de cambio/mando y cobertura 3D; los pendientes de este informe se leen como registro histórico.

## Método y dictamen

Por solicitud expresa del usuario participaron tres agentes independientes y una revisión de integración:

1. Suspensiones y cuadros: buscar variantes reales que invaliden un esquema demasiado uniforme.
2. Frenos y demás componentes: interfaces, unidades de selección, conjuntos y diferencias que no son cosméticas.
3. Datos y consultas: integridad, publicación/RLS, paginación, guardado y aislamiento de caché.
4. Integración: contrastar resultados, limitar ampliaciones y reconciliar los planes.

**Dictamen: mantener ocho tablas y TanStack Query para datos remotos, con correcciones de contrato antes de implementar.** Las revisiones no encontraron una necesidad actual de tablas por categoría, atributo o ajuste. Sí encontraron huecos que impiden declarar la propuesta lista únicamente por su diagrama.

«Escalable» significa añadir una variante comercial real o un atributo pertinente sin romper montajes existentes. No significa admitir automáticamente cualquier producto futuro, certificar mecánica ni garantizar rendimiento sin medirlo. Se revisaron familias de variaciones de todas las categorías previstas, no todos los SKU del mercado. Cada variante del inventario final requiere su propia verificación.

## Hallazgos que condicionan la implementación

P1 indica un contrato que debe cerrarse o corregirse antes de completar la migración/función correspondiente. P2 indica una decisión de preparación y comprobación. No se detectó un incidente P0 ejecutable: la nueva base todavía no existe.

| Prioridad | Hallazgo | Corrección mínima |
| --- | --- | --- |
| P1 | Seis tablas/manifiesto local contradicen la alternativa de ocho tablas aceptada | Consolidar `bike_presets` y `bike_preset_items` como fuente de composiciones en Supabase |
| P1 | Un formato de rueda por modelo no representa todas las tallas | Formato delantero/trasero y geometría en la variante concreta de cuadro |
| P1 | Modelo + año no identifica siempre una generación | UUID estable y denominación inequívoca; generación/código de fabricante cuando se conozcan |
| P1 | Resorte, hidráulico y ajustes se pueden confundir | Propiedades distintas y contrato por categoría; no crear versiones ficticias |
| P1 | Misma medida nominal no prueba encaje | Interfaces completas, incertidumbre y excepciones conocidas con fuente; nunca aprobación mecánica universal |
| P1 | Carcasa y compuesto de neumático pueden tratarse erróneamente como color | Son variantes técnicas reales; acabado solo cosmético cuando conserve sus atributos relevantes |
| P1 | Foto familiar puede atribuirse a una variante/acabado distinto | Override de imagen local y fallback identificado como foto de referencia |
| P1 | Precio mutable dentro de especificaciones de montaje complica la inmutabilidad | Referencia de precio separada; geometría, interfaces y comportamiento de acabados publicados inmutables |
| P1 | Un conjunto integrado puede duplicarse al ocupar dos posiciones | No incluir integrados sin contrato explícito de ocupación/exclusión; no construir un motor genérico de kits |
| P1 | Cambio trasero y mando no están definidos en los slots actuales | Cerrar su unidad visual/seleccionable antes de aprobar la cobertura de transmisión completa; no añadir silenciosamente un catálogo de accesorios |
| P1 | Filtros técnicos pueden satisfacerse en variantes distintas del mismo modelo | Todos los predicados técnicos sobre la misma variante; modelos únicos y paginación estable |
| P1 | Las FK no transmiten políticas de publicación ni de propiedad | RLS por relación, publicación transitiva y comprobación explícita en RPC privilegiada |
| P1 | Variante retirada conservada sin comprobar posición | Solo conservar mismo montaje, mismo slot y mismo ID ya persistidos, comparados en servidor |
| P1 | Respuesta tardía tras cambiar de cuenta puede contaminar el estado | Claves privadas por usuario, cancelación, limpieza y descarte de callbacks de otra sesión |
| P2 | «JSONB validado» o «poner índices» es insuficiente como contrato | Diccionario por categoría, tipos/unidades, consultas definidas e índices medidos |
| P2 | Lecturas separadas pueden mezclar revisiones de cabecera/piezas | Lectura coherente del montaje y configuración canónica al recuperar un timeout |

## Matriz de variaciones estudiadas

Estos atributos son datos candidatos de una variante real, no nuevos filtros obligatorios ni campos requeridos para todas las categorías. Lo desconocido permanece desconocido. Las dimensiones aproximadas para dibujar viven en parámetros visuales identificados como estimación.

| Categoría | Diferencias que el contrato debe poder describir | Simplificación del alcance |
| --- | --- | --- |
| Cuadro | Talla, generación, material, doble/rígido, ruedas delantera/trasera, eje trasero, dirección, pedalier, tija, anclajes de amortiguador y freno, geometría | Una posición estática documentada; sin selector de flip-chips ni cálculo de ajuste corporal |
| Horquilla | Pletina simple/doble, rueda, recorrido, eje-corona, offset, dirección, eje, barras, resorte, hidráulico, ajustes y anclaje/límites de freno | Sin presión, SAG, tokens o clics como variantes comerciales |
| Amortiguador | Entreojos, carrera, aire/muelle, hidráulico, anclaje y herrajes por extremo, depósito/orientación, revisión OEM cuando proceda | Sin deducir encaje por dos medidas; sin simulación de compresión |
| Freno | Pinza/maneta, pistones, accionamiento, fluido específico, lado/orientación, montaje y discos admitidos | Conjunto documentado y latiguillo generado; sin despiece hidráulico |
| Disco | Diámetro, espesor nominal, seis tornillos/Center Lock, construcción y restricciones de pastilla/adaptador | Adaptador como requisito documentado/por confirmar si no es seleccionable |
| Aro | Diámetro ETRTO, anchura interna/externa, perfil, agujeros, material y tubeless | Radios generados; sin una fila por radio |
| Neumático | ETRTO/talla comercial, carcasa, compuesto, talón, tubeless y acabado | No inventar diámetro exterior real a partir del nombre comercial |
| Buje | Posición, diámetro/ancho de eje y familia de interfaz, disco, núcleo de cassette y agujeros | Variante ensamblada; no catálogo independiente de tapas y núcleos |
| Cassette | Velocidades, dentado, núcleo e identidad de ecosistema | Igual número de velocidades no certifica compatibilidad |
| Cadena | Ecosistema, velocidades, construcción y acabado | Sin cálculo de corte o longitud mecánica |
| Bielas y plato | Longitud, eje/pedalier, línea de cadena, dentado e interfaz del plato incluido | Conjunto aprobado, sin selectores por tornillo o plato no solicitado |
| Cambio y mando | Interfaz con cuadro, ecosistema, velocidades, accionamiento y componentes incluidos | Hueco de cobertura pendiente de decisión; sin emparejamiento electrónico o catálogo de baterías |
| Manillar/potencia | Abrazadera, anchura, elevación/ángulos, longitud, dirección y montaje directo DH | Integrados requieren decisión de inventario y regla de ocupación; no duplicar piezas |
| Tija/sillín | Diámetro, longitud/inserción, fija/telescópica, recorrido, accionamiento, raíles y dimensiones | Postura estática; no simular accionamiento real |
| Pedales | Plataforma/automáticos, dimensiones, interfaz y material/acabado | Una pareja por selección; sin zapatillas ni calas |

## Contraejemplos oficiales

### Cuadros y suspensiones

- [Santa Cruz V10 MY25](https://www.santacruzbicycles.com/pages/product-support/v-10-8-my25): las tallas no comparten necesariamente formato de rueda. La documentación también contiene ajustes de geometría y excepciones de espacio para amortiguadores. Una talla no se obtiene escalando todo el conjunto ni una medida de amortiguador garantiza encaje.
- [SRAM: ajuste de amortiguadores](https://www.sram.com/en/service/articles/RockShox-fitment-article): importan cámara/depósito, herrajes, talla y particularidades OEM además de longitud y carrera.
- [RockShox BoXXer Ultimate D2](https://www.sram.com/en/rockshox/models/fs-bxr-ult-d2): rueda, recorrido, offset, dirección y eje identifican versiones relevantes. Las opciones globales de una página de familia no prueban todas sus combinaciones.
- [FOX 40 Factory GRIP X2](https://ridefox.com/products/fox-40-factory-grip-x2): referencias comerciales y atributos técnicos permiten verificar versiones y sus interfaces.
- [COMMENCAL META SX V5, cuadro](https://www.commencal.com/en/bikes/frames%20%2F%20a%20la%20carte/enduro/meta%20sx%20v5/FT3MSXV5TMEXL.html?lang=en_FR): ejemplo de interfaces y medidas específicas de talla, ruedas distintas y particularidades del anclaje del amortiguador.
- [COMMENCAL META HT](https://www.commencal.com/us/en/landing-meta-ht-v3.html): existe enduro rígido; la disciplina no implica siempre amortiguador trasero. Esto demuestra capacidad necesaria del contrato, no incorporación automática al inventario.

### Frenos, ruedas y demás componentes

- [Maxxis Minion DHF](https://www.maxxis.com/us/tire/minion-dhf/): carcasa y compuesto distinguen combinaciones comerciales aunque compartan dibujo y tamaño.
- [DT Swiss 350](https://www.dtswiss.com/en/components/hubs-and-rws/hubs-mtb/350): ancho, diámetro de eje, familia de interfaz, disco, núcleo y agujeros no se reducen a una sola cifra.
- [Shimano: frenos MTB](https://productinfo.shimano.com/index.html/spec/mtb-brake-hydraulic-disc-brake) y [compatibilidad 2026–2027](https://productinfo.shimano.com/pdfs/product/thisyear/2026-2027_Compatibility_v022_en.pdf): las restricciones de sistemas y espesores no permiten deducir compatibilidad por «aceite mineral» o por diámetro de disco solamente.
- [SRAM: discos](https://www.sram.com/en/learn/brake-welcome-guide/rotor-overview): diámetro y espesor forman parte de la elección documentada.
- [SRAM: UDH y Full Mount](https://www.sram.com/en/learn/understanding-udh-and-full-mount): la interfaz y la familia de transmisión importan, además del número de velocidades.
- [Syncros: manillares](https://www.syncros.com/us/en/products/syn-mountain-cockpit-bars): coexisten manillares individuales y cockpit integrado, contraejemplo a asumir siempre una pieza comercial por una sola posición.
- [Reverb AXS A2](https://www.sram.com/en/service/models/sp-rvb-axs-a2) y [B1](https://www.sram.com/en/rockshox/models/sp-rvb-axs-b1): mantener el nombre de familia no implica mantener todos los atributos entre generaciones.

### Integridad y consultas

- [PostgreSQL: restricciones](https://www.postgresql.org/docs/current/ddl-constraints.html): las FK y las restricciones de fila tienen responsabilidades diferentes; una FK no crea automáticamente todos los índices del lado que referencia ni un CHECK valida otras filas.
- [PostgreSQL: JSONB e índices](https://www.postgresql.org/docs/current/datatype-json.html): el operador consultado y el tipo de índice deben corresponder; un GIN genérico no resuelve todos los rangos numéricos.
- [Supabase: relaciones y filtros](https://supabase.com/docs/guides/database/joins-and-nesting): filtrar hijos embebidos no siempre filtra padres; comprobar semántica de relación interna o EXISTS.
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [vistas](https://supabase.com/docs/guides/database/views): las vistas expuestas deben respetar permisos/RLS con `security_invoker` cuando se utilicen.
- [TanStack Query: claves](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [cancelación](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) y [valores por defecto](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults): diseñar identidad de consultas y vigencia; consumir la señal de cancelación del transporte.

## Decisiones que no se introducen automáticamente

1. Cambio trasero/mando: cerrar si son piezas seleccionables o parte de una representación documentada de conjunto; el plan anterior no lo definía.
2. Integrados: elegir si alguna referencia concreta los necesita. Si se incluyen, definir ocupación/exclusión antes de declararlos soportados; si no, el catálogo montable usa piezas separadas y lo comunica.
3. Fijar inventario de generaciones, tallas y versiones, distinguiendo entradas documentales y piezas montables. No basta con una lista de marcas.

La capacidad del esquema para describir un dato futuro no obliga a crear su selector ni a ofrecerlo ahora. No se incorporan por esta revisión físicas, mantenimiento, electrónica, certificación, todas las geometrías ajustables o todos los productos del mercado.

## Evidencia pendiente durante implementación

- Diccionario final de atributos, unidades y restricciones correspondiente al inventario elegido; aceptación de todos los ejemplos de frontera pertinentes.
- Migraciones y RLS/RPC con usuarios distintos, visitante, referencias no publicadas, variantes retiradas y payloads manipulados.
- Consulta de filtros sobre una misma variante; familias únicas paginadas, orden estable y ausencia de N+1.
- EXPLAIN (ANALYZE, BUFFERS) de lecturas representativas en entorno de prueba, incluyendo roles/RLS reales; medir latencia, filas, tamaño transferido y llamadas, sin inventar garantías de concurrencia o tiempos.
- Catálogo con variantes representativas adicionales para observar crecimiento; no confundir un ensayo pequeño con capacidad de producción demostrada.
- Guardado atómico, timeout, revisión concurrente, eliminación y cambio de cuenta con peticiones pendientes.
- Reabrir montajes antiguos tras actualizar precios, fuentes o nuevas variantes sin alterar sus piezas y acabados.

El dictamen es favorable a la arquitectura con estas condiciones. La funcionalidad completa y el rendimiento siguen pendientes de implementación y evidencia real.
