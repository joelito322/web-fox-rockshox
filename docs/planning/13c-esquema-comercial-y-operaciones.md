# 13c · Esquema comercial y operaciones

Fecha: 27/10/2026. Ampliación documental solicitada por el usuario. Complementa [13](13-tienda-y-venta-asistida.md), [contratos](13a-contratos-y-validacion-comercial.md) y [precios](13b-precios-y-ofertas-comerciales.md). Nombres y campos propuestos para futuras migraciones; no describe tablas creadas ni autoriza implementación.

## Separación y tamaño del esquema

Conservar las doce tablas propias actuales y Supabase Auth. Proponer once tablas comerciales nuevas, cada una con una responsabilidad concreta: cuatro para ofertas/promociones, dos para carrito, una para cotizaciones versionadas y cuatro para pedidos/líneas/intentos/eventos. El objetivo documental sería veintitrés tablas propias; no es el estado Cloud actual ni un número obligatorio si la revisión técnica encuentra una simplificación equivalente.

No añadir tablas de precios históricos, listas de precios, colores globales, almacenes, reservas duplicadas o usuarios comerciales. La reserva se representa mediante el pedido pendiente y sus líneas. El carrito no reserva. Las cotizaciones no consumen stock.

```text
Catálogo técnico existente
components ── component_variants ── visual_assets (GLB históricos conservados)
    │                  │ variante + acabado permitido
    │                  └─ store_offer_variants ─── store_offers (SKU/precio/stock)
    │                                                   │
    │                          promotions ── promotion_offers
    │                                                   │
auth.users ── carts ── cart_items ────────────────────────┤
    │                                                   │
    ├─ sales_quotes (versiones de cotización)            │
    │      └─ selección y revisión técnica congeladas    │
    │                                                   │
    └─ orders ── order_items ────────────────────────────┘
          ├─ payment_attempts (solo simulados)
          └─ order_events (seguimiento de cambios)

builds / build_items ── referencia opcional de origen
                       copia validada al cotizar; nunca dependencia mutable
```

Las nuevas tablas se proponen en public con RLS y contratos de acceso acotados. IAM permanece en iam. No convertir la base en una tabla genérica con todos los campos en JSON ni crear un esquema adicional solo para cada módulo.

## Diccionario de las once tablas

UUID para identificadores; fechas timestamptz de servidor. Importes en centavos enteros, nunca float; propuesta de moneda inicial PEN, aún por ratificar antes de datos comerciales. Una sola moneda comercial configurada en servidor para esta fase: todas las ofertas, descuentos fijos, cotizaciones y pedidos deben coincidir. Rechazar mezcla de monedas en carrito/checkout; no convertir ni sumar importes heterogéneos. En implementación se fijará un máximo operativo explícito para importes, cantidades y productos que garantice conversión exacta PostgreSQL/JSON/JavaScript; rechazar desbordes en operaciones y pruebas. El campo revision es entero positivo para actualización optimista, no una revisión de GLB. Toda RPC que modifica una entidad existente exige expected_revision presente y no null; falta/null devuelve error y no omite protección por comparación SQL desconocida. Operaciones de creación usan identidad idempotente, no una revisión ficticia de una fila inexistente. Las tablas puente no necesitan revision propia: editar store_offer_variants valida e incrementa revisión de la oferta; editar promotion_offers valida e incrementa la promoción. Si se reasigna un vínculo, validar/bloquear ambas ofertas y proteger su revisión; una revisión omitida/null nunca permite sobrescribir cambios concurrentes.

### 1–4. Ofertas y promociones

Contrato de cálculo, redondeo y vínculos detallado en [13b](13b-precios-y-ofertas-comerciales.md); este diccionario organiza sus columnas, sin otra autoridad de precios.

| Tabla | Columnas propuestas | Integridad |
| --- | --- | --- |
| store_offers | id PK, sku, component_id FK components, label, commercial_identity JSONB tipado, unit_of_sale, base_price_cents, currency, stock_total, active, revision, created_at, updated_at, updated_by FK auth.users nullable | sku único/no reutilizable; precio positivo; stock entero no negativo; unidad controlada; actualizaciones mediante RPC autorizada |
| store_offer_variants | variant_id FK component_variants, finish_id, offer_id FK store_offers | PK(variant_id, finish_id); acabado existente y componente coherente; varios GLB pueden compartir SKU |
| promotions | id PK, name, discount_type, percentage_bps nullable, fixed_discount_cents nullable, currency nullable, starts_at, ends_at, active, revision, created_at, updated_at, updated_by FK auth.users nullable | Un solo valor según tipo; 1–9999 bps o importe positivo; currency obligatoria para fijo y null para porcentaje; inicio anterior a fin; campañas y cambio de base deben mantener precio efectivo positivo |
| promotion_offers | promotion_id FK promotions, offer_id FK store_offers | PK(promotion_id, offer_id); moneda coherente para descuento fijo |

Acabado libre3D y genérico no vendible no generan una oferta automáticamente. Evitar borrado físico de ofertas/promociones referenciadas; usar desactivación. Identidad física de una oferta vinculada es inmutable: nuevo producto requiere otro SKU. commercial_identity conserva únicamente generación/año, talla/medidas comerciales y acabado físico que distinguen ese SKU, con contrato por categoría; no duplica toda specs ni anclajes3D. Cada relación debe coincidir en esos atributos y unidad de venta, además de component_id. Revisar esto también al editar catálogo mediante sus RPC existentes: eliminar/cambiar un acabado o medida vinculados no debe dejar relaciones semánticamente huérfanas. Retirar una revisión visual no retira por sí solo la oferta. Relaciones entre tablas y restricciones sobre JSON necesitan validación de servidor también ante SQL/RPC directos, no solo formularios.

### 5–6. Carrito persistente

| Tabla | Columnas propuestas | Integridad |
| --- | --- | --- |
| carts | id PK, user_id FK auth.users, revision, created_at, updated_at | user_id único: un carrito por cuenta, incluso vacío |
| cart_items | cart_id FK carts, offer_id FK store_offers, quantity, updated_at | PK(cart_id, offer_id); cantidad entera positiva |

El carrito guarda identidades y cantidades, no un precio editable ni un descuento congelado. Cada escritura compara la revisión del carrito padre, modifica líneas e incrementa esa revisión en una transacción. La eliminación de una línea no depende de su posición visual.

Origen3D sirve para proponer una conversión y sus cantidades; no obliga a relacionar cada línea con un montaje privado ni a vender la malla. Al añadir un montaje a un carrito con contenido, mostrar sumar cantidades o reemplazar el carrito completo por la selección convertida, con vista previa y confirmación del alcance. No prometer reemplazar solo las contribuciones de ese montaje: el carrito agregado no guarda procedencias. Enviar a servidor el cambio explícito con revisión esperada. Cotizar armado captura la composición concreta en sales_quotes, no intenta reconstruirla después a partir de un carrito agregado.

Logout limpia caché local y consultas, conserva carrito remoto. Checkout originado en carrito bloquea su fila y compara la revisión aceptada antes de crear el pedido. Si ya cambió, no crea pedido/reserva ni modifica líneas: devuelve conflicto y exige resumen actualizado aceptado. Si coincide, crea pedido y retira las cantidades compradas e incrementa revisión en la misma transacción; las ediciones posteriores operan sobre esa nueva revisión. Una cotización independiente no limpia un carrito por coincidencia de SKUs: necesita intención explícita y revisión del carrito si se quiere retirar su contenido. El replay idempotente se reconoce antes de revisar el carrito mutable y nunca vuelve a descontarlo. Borrar el carrito es una acción separada del usuario, no efecto del cierre de sesión.

### 7. Cotizaciones con revisión técnica y entrega

sales_quotes cubre tanto armado opcional como envío con coste cotizado. No crear una tabla distinta por cada servicio. Compra de componentes con retiro sin coste adicional puede ir al resumen sin cotización manual; retiro gratuito debe estar configurado expresamente, no deducirse de un coste desconocido.

| Grupo | Columnas propuestas |
| --- | --- |
| Identidad y control | id PK, user_id FK auth.users, series_id UUID, version entero positivo, request_hash, status, revision, created_at, updated_at |
| Selección | source_build_id FK builds nullable con SET NULL, selection_snapshot JSONB tipado, selection_hash calculado en servidor |
| Revisión | assembly_requested boolean, technical_review (not_required/pending/approved/rejected), review_notes nullable, reviewed_by FK auth.users nullable, reviewed_at nullable |
| Cotización | currency, merchandise_snapshot JSONB tipado, assembly_fee_cents nullable, delivery_method (pickup/shipping), delivery_snapshot JSONB tipado, contact_snapshot JSONB tipado, delivery_fee_cents nullable, expires_at nullable, quoted_by FK auth.users nullable, quoted_at nullable |

UNIQUE(series_id, version), propietario común a toda la serie y versiones crecientes asignadas en servidor. Estados propuestos: requested, quoted, rejected, superseded, consumed. Caducidad efectiva por expires_at y reloj del servidor, sin depender de un job. Solamente quoted, vigente y no sustituida puede convertirse en pedido; las versiones anteriores se conservan. Crear/sustituir/consumir una versión se serializa por series_id y verifica propietario y revisión: como máximo una versión de la serie queda quoted y consumible. Una nueva versión invalida atómicamente la anterior; nunca quedan dos aceptaciones vigentes por solicitudes concurrentes. Crear versión utiliza id estable de solicitud y request_hash de su contenido, con propietario verificado: mismo id/contenido devuelve versión creada; otro contenido da conflicto. Publicar/rechazar/sustituir compara revisión y reconoce un resultado ya aplicado idéntico, sin crear dos versiones por reintento.

Una solicitud admite importes pendientes null; null nunca equivale a cero. Publicar cotización exige líneas resueltas y precios positivos, costes no negativos, contacto/destino válidos y revisión aprobada si incluye armado. Los snapshots son contratos tipados con versión, límites de tamaño y validación servidor; contienen posiciones, variantes/acabados, SKUs, cantidades, importes y condiciones necesarias, no una copia ilimitada del catálogo. El hash no sustituye esas comprobaciones.

Modificar composición, cantidades, acabado, modalidad de entrega o destino crea una nueva versión e invalida la revisión/aceptación previa. Cambiar contacto de destinatario requiere nueva versión si afecta entrega/condiciones; incluso una corrección solo de contacto debe quedar explícita y aceptada, no sobrescribir snapshots de un pedido creado. Cambios económicos posteriores a publicar también requieren versión nueva. No editar una cotización aceptada en el sitio. La aceptación se registra al crear el pedido que referencia esa versión exacta; máximo un pedido por quote_id. Si vence o se cancela ese pedido, una nueva compra solicita otra versión/resumen, sin reutilizar la aceptación vieja.

El precio cotizado se conserva durante su vigencia; al crear pedido se verifica que la propuesta siga autorizada y no haya sido sustituida, que las ofertas sean vendibles y que exista stock. No recalcular ni aplicar promociones otra vez encima del precio cotizado. Si las condiciones ya no pueden respetarse, se publica otra versión para nueva aceptación, como exige13a.

### 8–9. Pedidos y líneas

| Tabla | Columnas propuestas |
| --- | --- |
| orders | id PK, user_id FK auth.users, quote_id FK sales_quotes nullable UNIQUE, status, mode (demo únicamente en esta fase), currency, assembly_fee_cents, delivery_fee_cents, total_cents, delivery_method, delivery_snapshot JSONB tipado, contact_snapshot JSONB tipado, accepted_summary_hash, reservation_expires_at, idempotency_key, request_hash, revision, created_at, updated_at, confirmed_at nullable, cancelled_at nullable, cancellation_reason nullable |
| order_items | id PK, order_id FK orders, offer_id FK store_offers, quantity, sku_snapshot, label_snapshot, finish_snapshot, unit_of_sale_snapshot, commercial_identity_snapshot JSONB tipado, base_unit_price_cents, unit_discount_cents, promotion_id FK promotions nullable, promotion_snapshot JSONB tipado nullable |

UNIQUE(user_id, idempotency_key), UNIQUE(order_id, offer_id). Mismo idempotency_key y request_hash devuelve el mismo pedido; contenido diferente devuelve conflicto. Claves/hashes calculados o verificados en servidor, nunca confianza en totales del navegador. Orders.quote_id debe pertenecer a la misma cuenta y versión aceptada. Los estados son pending, confirmed, preparing, ready, delivered, cancelled, expired; para envío ready significa listo para despacho, con condiciones/seguimiento de esta fase sin integrar transportista.

Snapshot comercial y líneas inmutables tras crear pedido. Cantidades positivas, base positiva, descuento entre cero y base excluida. Subtotal derivado = (base − descuento) × cantidad. total_cents del pedido se fija por servidor como suma de líneas más armado/entrega aceptados; la transacción valida su igualdad y moneda. Se guarda para lectura eficiente y aceptación histórica, no como campo libre. Los cambios posteriores permitidos son estados y seguimiento, con revisión y autorización.

Cada pedido contiene al menos una línea vendible; no se crean pedidos de solo envío/servicio a partir de un carrito vacío. La reserva es la suma de order_items de órdenes pending con reservation_expires_at futura. Pago aprobado cambia a confirmed y descuenta stock_total una sola vez en la misma transacción. Pedido pendiente vencido deja de reservar aunque su status aún no haya sido materializado como expired. Cancelación/confirmación bloquean el mismo pedido; ofertas se bloquean siempre por ID ordenado. Ajustes de stock consultan las reservas con esos mismos bloqueos. La comprobación decisiva de vigencia/precio/reserva usa un instante fresco del servidor después de adquirir los bloqueos y releer datos; no reutilizar la hora de llegada de una petición que esperó. Si la reserva venció esperando, no aprobarla aunque existiera al inicio.

Antes del SQL, fijar y probar un orden global de bloqueos para autorización, carrito, serie de cotización, pedido/intento y ofertas ordenadas. No basta ordenar ofertas si dos RPC bloquean pedido y cotización al revés. Las lecturas de reservas tras una espera deben ver el resultado comprometido del competidor; especificar aislamiento y política de reintentos ante conflicto/deadlock, siempre con la misma clave idempotente. Detalle y pruebas en13a.

FK de oferta en líneas impide borrarla al conservar historia; source_build_id puede desaparecer sin alterar snapshots. Contacto mínimo propuesto: nombre del destinatario y un medio de contacto; para envío, dirección, localidad y región necesarias para cotizar. Contacto/destino son datos privados del acuerdo y se validan antes del formulario definitivo; retiro no requiere domicilio. No crear libreta de direcciones, DNI/RUC ni facturación fiscal no solicitados.

La política de eliminación de cuentas con pedidos/cotizaciones se define antes de migrar: no heredar cascade de montajes que borre historia comercial ni crear cuentas imposibles de eliminar sin un tratamiento explícito de datos personales. No copiar credenciales ni tokens a snapshots.

### 10–11. Intentos de pago y seguimiento

| Tabla | Columnas propuestas | Integridad |
| --- | --- | --- |
| payment_attempts | id PK, order_id FK orders, method (yape_demo/transfer_demo/card_demo), status (pending/approved/rejected/cancelled), amount_cents, currency, idempotency_key, created_at, resolved_at nullable | Importe/moneda del pedido; UNIQUE(order_id, idempotency_key); máximo un intento approved por pedido mediante índice único parcial |
| order_events | id PK, order_id FK orders, event_type, actor_id FK auth.users nullable, actor_kind (customer/staff/system), from_status nullable, to_status nullable, reason nullable, created_at | Solo inserción por operación autorizada; no edición/borrado cliente; actor decidido por servidor |

Un intento terminado no cambia su resultado por una respuesta tardía. Resolver aprobación verifica modo demo, propiedad, estado pendiente, reserva vigente y ausencia de éxito previo; actualiza intento/pedido/stock/evento atómicamente. Reintentar usa otro intento. No guardar números de tarjeta, QR reales, comprobantes bancarios o payloads de proveedor en esta fase.

order_events registra creación y transiciones reales, no sustituye payment_attempts ni concede permisos por su contenido. Cliente recibe eventos pertinentes de su pedido; notas internas no se publican por devolver la tabla completa. Reintentar una transición no duplica evento ni reposición de stock.

## Tablas existentes que deben preservarse o ampliarse

| Existente | Cambio previsto |
| --- | --- |
| components / component_variants | Sin columnas de precio/stock de venta; price_reference sigue siendo referencia de mercado |
| visual_assets y Storage | Sin duplicación de SKU por GLB ni alteración de bytes/versiones publicados |
| builds / build_items | Montajes visuales libres; cotización copia estado seleccionado sin escribir sobre el montaje |
| brands / bike_presets / bike_preset_items | Sin convertir prearmada de referencia en paquete vendible implícito |
| iam.permissions / iam.role_permissions | Nuevos permisos comerciales y asignaciones explícitas a roles existentes; matriz continúa como único editor |
| auth.users / iam.roles / iam.user_roles | Misma identidad, roles y registro público user; ninguna autenticación paralela |

Administración mantiene Ventas → Ofertas / Promociones / Pedidos. Dentro de Pedidos, pestañas «Cotizaciones» y «Pedidos» reúnen la revisión previa y atención posterior; misma tabla y Drawer reutilizados, acciones visibles y estados traducidos a español. La composición detallada y su adaptación móvil se dibujan/revisan en la fase de UI antes de construirla, sin añadir otro módulo de base de datos genérico.

Propuesta de permisos: sales.offers.manage, sales.promotions.manage, sales.quotes.manage, sales.orders.manage. Administrador recibe asignaciones iniciales mediante migración revisada; roles personalizados reciben solo las acordadas. Propiedad y cuenta habilitada autorizan las acciones del cliente sobre sus datos mediante RPC/RLS, sin darle permisos administrativos. Reutilizar los criterios actuales de IAM: cuenta confirmada, no bloqueada y rol activo; un JWT todavía válido no basta tras bloquear cuenta/desactivar rol. Comprobar también source_build_id propio y permiso vigente builds.read_own antes de leerlo, y no aceptar una cotización/serie de otra cuenta. Ningún permiso comercial concede cambiar IAM ni configura pagos reales.

## Operaciones, seguridad y rendimiento

Plan de RPC transaccionales, con nombres definitivos al implementar:

- Lectura pública en lote de ofertas activas/precio efectivo y disponibilidad; proyección sin notas, pedidos, reservas individuales ni identidades de compradores. Los vínculos con revisiones históricas/no publicadas no abren su catálogo ni GLB al público; la proyección respeta las reglas de lectura actuales. Resolver un montaje privado exige su autorización propia.
- Carrito: leer, actualizar cantidades con revisión, fusionar selección anónima aceptada y convertir montaje validado. Ninguna llamada por tarjeta.
- Cotización: solicitar versión, revisar/publicar o rechazar por permiso; listado/detalle de la cuenta y administración paginados.
- Resumen validado y creación idempotente del pedido, con snapshot/reserva/consumo de versión de cotización en una transacción. Resumen directo calcula precios actuales; cotización usa su acuerdo vigente.
- Crear/resolver intento demo, cancelar según rol/estado y avanzar atención con revisión; no PATCH libre de status, stock o dinero.
- Gestión de ofertas/promociones con revisión esperada y validación cruzada. Cambio de permiso invalida borradores/contexto conforme a administración actual.

Solicitud de armado parte de una selección con posiciones identificadas: usar el montaje3D existente o pedir escoger uno al partir del carrito. Un carrito agregado por SKU no prueba cómo se montan sus piezas. Antes de enviar, presentar la composición/snapshot, faltantes y productos no vendibles; no aprobar automáticamente montajes incompletos/incompatibles. Para envío sin armado, la cotización solo necesita líneas comerciales, contacto y destino, sin obligar a crear bicicleta3D.

Cliente dispone de «Mis pedidos» con pestañas «Cotizaciones» y «Pedidos», detalle reutilizado en Drawer. Puede recuperar una solicitud tras recargar/otro dispositivo, ver rechazo/caducidad/sustituciones, aceptar solo la versión vigente y volver al pedido creado sin duplicarlo. Cotización pendiente muestra costes por determinar y no habilita pago. Estados guardados se traducen a etiquetas de usuario; ready será «Listo para recoger» o «Listo para despacho» según modalidad.

RLS para aislamiento de propietarios y permisos administrativos; bloquear DML comercial directo que eluda los contratos. Funciones con privilegios elevados deben validar identidad y permiso internamente, fijar search_path, cualificar objetos y restringir EXECUTE. No entregar service_role al navegador ni confiar en un user_id/actor/mode enviado por él.

Índices propuestos por recorrido: uniques anteriores; store_offer_variants(offer_id); promotion_offers(offer_id); store_offers(component_id, active, id); orders(user_id, created_at, id), orders(status, reservation_expires_at) para pending, order_items(offer_id, order_id) además del unique por pedido/oferta; sales_quotes(user_id, created_at, id); payment_attempts(order_id, created_at, id); order_events(order_id, created_at, id). PK/unique ya indexan sus prefijos: no duplicarlos. Medir índices para listados administrativos según filtros reales, y ajustar con EXPLAIN en datos representativos antes de afirmar rendimiento.

TanStack Query existente para lotes, paginación y detalles bajo demanda. Invalidación dirigida por oferta/carrito/pedido y limpieza por cuenta; no invalidar catálogo/GLB completos por cada cantidad. Caché no garantiza stock/precio: resumen y transacción mandan. Reserva expira por consulta de servidor; tarea posterior de limpieza es opcional y no requiere workers propios.

## Secuencia de implementación y aceptación

Este documento es parte del plan, no trabajo previo que se delega al usuario. Cuando se autorice implementar:

1. Revisar diccionario contra SQL actual; cerrar límites numéricos, moneda, plazos configurables de reserva/cotización, política de cuenta y bocetos comerciales. Configurar valores de demo explícitos, sin suponer minutos/horas definitivos aquí.
2. Escribir migraciones nuevas, permisos/RLS/RPC y datos comerciales de demo versionados en supabase/. Aplicar luego al proyecto Cloud de desarrollo y validar; no modificar migraciones aplicadas ni levantar Supabase local.
3. Conectar Ofertas/Promociones, catálogo y carrito reutilizando tablas/Drawer/Fields/QueryClient. Después cotización/armado/entrega y resumen, pedidos, pago demo y seguimiento; las acciones de cada fase deben persistir y funcionar completas.
4. Validar SQL/RPC directos y UI: dos compradores de última unidad, reserva vencida sin limpieza, doble aprobación/cancelación concurrente, espera de bloqueo que cruza caducidad, dos versiones de cotización concurrentes, precio obsoleto, promoción/redondeo/horario, edición de carrito simultánea, cotización sustituida y A→B→A. Verificar aislamiento anónimo/propietario/gestor sin permisos y pérdida de permisos durante edición. Cotización→pedido sin intención de limpiar conserva carrito; con intención y revisión obsoleta revierte todo, incluida aceptación/consumo de versión y reserva. Probar que editar tablas puente con revisión antigua/null no sobrescribe vínculos.
5. Regresión de catálogo público, IAM, guardado/reapertura privada, avisos no bloqueantes, GLB históricos, responsive y consultas en lote. Registrar evidencia real en validation; mover a finished solo al completar criterios, sin presentar demo como cobro real ni emulación como móvil físico.

No hay migraciones, precios, stock, UI ni cobros creados por esta actualización. Pendientes concretos permanecen dentro de las fases y sus criterios; no se promete ausencia de errores por aprobar un diagrama.


Actualización de autorización ·27/10/2026: el usuario solicita comitear los planes por partes y después ejecutar esta ampliación. Queda autorizada la implementación por fases, incluidas migraciones Cloud, datos comerciales demo y UI; las declaraciones anteriores de «solo documentación» describen la etapa de redacción. No se habilitan cobros reales. El estado de avance se registra en08 y no se declara terminado por esta autorización.
