# 13a · Contratos y revisión del plan comercial

Estado posterior a la autorización: la implementación técnica y sus comprobaciones se registran en [13e](13e-evidencia-de-implementacion-comercial.md). Las frases de esta revisión sobre «sin implementación» corresponden a la etapa documental anterior; no sustituyen el estado vigente.

Fecha: 27/10/2026. Revisión documental de [13](13-tienda-y-venta-asistida.md), sin implementación, ejecución Cloud ni commits. No es una auditoría de un comercio ya construido. Las correcciones siguientes cierran ambigüedades técnicas; el usuario confirmó armado opcional con revisión/cotización, retiro y envío con coste cotizado, y carrito persistente por cuenta entre dispositivos.

## 1. Alcance funcional frente a pago demostrativo

La futura ampliación comercial debe tener persistencia y autorización reales en Supabase para ofertas, promociones, pedidos, líneas, estados y pagos **simulados**. Se simula el resultado del proveedor financiero, no el cálculo, los permisos, las transacciones de stock ni la existencia del pedido. Un frontend con estados locales que desaparezcan al recargar no completa el plan.

La configuración de comercio/demo se controla en servidor. Un cliente no decide libremente el modo del pedido ni puede usar un pago simulado para entregar mercancía de una operación real. En esta fase solo hay datos comerciales de demostración identificados; no se publica un modo de cobro real a partir de lo definido aquí. Si se habilita operación real posteriormente, necesita configuración/contratos separados y revisión de esa migración; no una casilla del cliente.

El pedido de demo puede recorrer todo el ciclo para la exposición, con stock de demo que sigue las mismas reglas transaccionales. No altera stock o ventas reales de otra modalidad. Un QR de ejemplo se identifica como demostración y no contiene un destino real de pago.

## 2. Identidad comercial y conversión desde3D

Una oferta/SKU representa una combinación física concreta **incluido su acabado vendible**. La clave de línea del carrito es oferta_id; no se permite escribir otro acabado como texto libre sobre el mismo SKU. Acabados que son productos diferentes tienen ofertas diferentes, aunque el fabricante use otra forma de codificarlos.

La relación `(variante técnica, finish_id) → oferta` es explícita y unívoca para el canal vigente. Varias revisiones de malla pueden compartir oferta si representan el mismo producto físico. No reutilizar un SKU para cambiar año, medida o producto de líneas ya pedidas. Retirar una revisión3D por mejora geométrica no retira automáticamente el producto comercial.

La conversión enumera posiciones y unidades **antes** de agregar por oferta. Dos neumáticos unitarios iguales se convierten en cantidad2; un conjunto de pedales por pareja representa cantidad1. No inferir que dos slots equivalen a una pareja comercial. Paquetes de frenos/ruedas u otros kits con varias posiciones necesitan unidad/ocupación documentada antes de publicarse; no entra un motor genérico de paquetes en esta fase. Si falta correspondencia o unidad verificable, la línea queda pendiente y no se cobra.

Agregar un montaje con carrito no vacío pide sumar cantidades o reemplazar el carrito completo por la selección convertida, con vista previa/confirmación; nunca duplicarlo o borrar otros artículos silenciosamente. No se promete reemplazar solo una contribución de origen que el carrito agregado no conserva. La revisión técnica usa snapshot del montaje/propuesta que se está vendiendo: si el cliente cambia piezas, acabado o cantidad después, no hereda una aprobación anterior. Avisos globales en la simulación continúan sin bloquear construcción o guardado.

## 3. Instante de precio y propuesta

```text
Carrito: valores orientativos actuales del comercio, sin reserva
    ↓ resumen validado en servidor + aceptación explícita
Crear pedido: fijar snapshot y reserva en una misma transacción
    ↓ hasta su vencimiento
Pago simulado / atención: usar el total de ese pedido
```

Regla propuesta para los contratos: precio/promoción se fijan al **crear** el pedido aceptado, no al recibir la confirmación de pago. Durante la reserva vigente no se recalcula silenciosamente aunque cambie precio o termine la promoción. Vencido/cancelado, una nueva compra vuelve a comprobar precio, promoción y stock; no se revive un precio antiguo cambiando una fecha desde el cliente.

Una lectura de resumen directo no garantiza stock ni congela precios. Si cambió cualquier dato relevante entre resumen y creación, servidor devuelve un resumen actualizado que debe aceptarse; no cobra ni reserva con un total distinto. Para cotización publicada y vigente, el acuerdo de esa versión conserva sus precios/descuentos aunque cambie base o termine la campaña; no recalcularlos ni duplicar promoción. Desactivar la oferta o sustituir la cotización sí impide crear un pedido nuevo. Una cotización debe estar vigente al crear pedido; después rige el vencimiento de la reserva del pedido, no una segunda caducidad de precio por la cotización original. Idempotencia de creación se liga a usuario, contenido y versión aceptada: misma clave/mismo contenido recupera resultado, misma clave/otro contenido produce conflicto.

Si se incluye armado, existe una **propuesta versionada** con piezas, precios, coste del servicio, condiciones y vigencia, anterior al pedido. El cliente acepta una versión concreta. La transición a pedido verifica esa versión, vigencia, ofertas y disponibilidad; no aplica una promoción dos veces ni mezcla precio ya cotizado con un descuento nuevo. Si algo dejó de ser válido, necesita propuesta/aceptación nuevas. Las propuestas no reservan indefinidamente ni garantizan stock antes del contrato acordado de reserva.

## 4. Promociones: valores y redondeo

El importe fijo se expresa en la moneda de la oferta, no se aplica entre monedas distintas. Cada SKU/fecha produce una única promoción elegible y el cálculo de la línea conserva precio base, descuento unitario, cantidad y subtotal.

El contrato técnico propone porcentaje de hasta dos decimales y redondeo mitad hacia arriba al centavo por unidad; no depender de floats binarios de JavaScript. Al estar excluidos los gratuitos, validar precio efectivo mínimo de un centavo también después del redondeo: con un precio base muy pequeño, un porcentaje menor que100 puede redondear al descuento completo; esa promoción no se publica para ese SKU sin corregirla. Al bajar el precio base de una oferta, una promoción fija mayor que el nuevo precio impide guardar ese cambio mientras no se ajuste/desactive la promoción afectada; no se mantiene un descuento inválido o negativo.

Decisión ya confirmada: porcentaje e importe fijo, sin acumulación ni líneas/pedidos gratuitos. Aplicar porcentaje inferior a100 e importe fijo inferior al precio base; la validación tras redondear también exige precio positivo. Arquitectura de oferta y promociones en [13b](13b-precios-y-ofertas-comerciales.md).

## 5. Stock sin doble descuento

Propuesta concreta de semántica para cerrar el diccionario:

- `stock_total` significa unidades comerciales aún no vendidas, incluidas las reservadas. No confundirlo con inventario físico de almacén que todavía espera entrega.
- `reservado_activo` suma cantidades de pedidos pendientes con reserva vigente, que todavía no han consumido venta.
- `disponible = stock_total − reservado_activo`. Carrito y propuesta sin reserva no se restan.
- Crear pedido verifica disponible y crea todas las reservas atómicamente, con bloqueo de ofertas en orden estable. No cambia stock_total.
- Confirmar pago de demo descuenta stock_total y convierte el pedido de reservado a confirmado **en la misma transacción**. Deja de contarse como reserva pendiente; no se resta dos veces. Repetir la confirmación devuelve el resultado previo.
- Cancelar/vencer un pedido pendiente lo excluye de reservas sin restar/retornar stock_total que nunca se había consumido. Reloj del servidor; las lecturas no dependen de un proceso de limpieza para liberar disponibilidad vencida.
- Un ajuste de stock no puede dejar stock_total por debajo de reservas activas sin resolverlas expresamente. No ocultar el error forzando disponible a0.
- Desactivar una oferta impide pedidos nuevos; no borra ni altera un pedido aceptado. Su cancelación, si procede, es explícita y queda registrada.

Cancelación confirmada: cliente solo antes de pago aprobado; administrador solo antes de comenzar preparación. Si se cancela Pendiente se libera reserva sin incrementar stock_total. Si administración cancela Confirmado antes de preparar, restaurar una sola vez el stock_total consumido al aprobar pago y registrar el motivo. Orden Cancelado no se restaura otra vez por reintento. Ya preparado/listo/entregado no permite esta cancelación automática. La carrera cancelar/aprobar usa el mismo bloqueo y revisión: si gana cancelación, el pago de demo tardío no confirma; si gana pago, cliente ya no puede cancelar.

El intento de pago simulado aprobado se conserva como hecho histórico al cancelar; el estado del pedido cambia, no se falsifica un reembolso bancario. Devoluciones y reembolsos reales siguen fuera del alcance financiero demo.

## 6. Pedido y pago: transiciones mínimas

Crear pedido antes del pago para tener identidad, total y vigencia contra los que registrar el intento. Cliente no puede saltar a «En preparación» o «Entregado».

| Operación | Resultado permitido |
| --- | --- |
| Crear con resumen vigente | Pedido Pendiente, con snapshot y reserva |
| Simular rechazo/cancelación | Intento terminado; pedido pendiente mientras la reserva siga vigente, con reintento explícito |
| Simular aprobación válida | Pago Simulado aprobado + pedido Confirmado + consumo de reserva, atómicos |
| Repetir la misma aprobación | Mismo resultado, sin otro descuento de stock/evento de cobro |
| Aprobar después de vencimiento | Rechazar la transición de demo; no consumir otra reserva ni aprobar con stock ya vendido |
| Confirmar → preparar → listo → entregar | Solo administración autorizada, en orden y con revisión vigente |

Un intento tiene ID propio; uno nuevo tras rechazo no reutiliza el ID terminal. Solo un éxito por pedido; resultados de intentos anteriores o respuestas tardías no revierten un éxito ni habilitan otro consumo de stock. El modo, moneda, importe y pedido se verifican en servidor.

Si algún día se acepta Yape manual real, «Declarar pago» no extiende una reserva a voluntad del cliente. Un ingreso real recibido tarde debe quedar registrado como tal y pasar a resolución si no hay stock; no llamarlo pago inexistente/rechazado ni preparar automáticamente. Ese caso, sus plazos y la devolución se definen antes de activar el modo manual, fuera de la interfaz demo actual.

## 7. Carrito, identidad y continuidad

El usuario eligió carrito registrado persistente en cuenta y disponible entre dispositivos. La propuesta anterior de borrarlo al cerrar sesión queda sustituida. Su almacenamiento remoto y líneas, revisión y permisos forman parte necesaria del contrato comercial:

- Anónimo conserva solo producto/cantidad, sin información de pago o contacto.
- Confirmar pedido exige sesión. La intención de finalizar usa una ruta interna permitida y se conserva al volver de Google; no abrir redirecciones arbitrarias ni tocar el callback existente de forma que se consuma dos veces.
- Pasar del carrito anónimo al registrado requiere una política visible si ya existe contenido: conservar uno o combinar explícitamente por oferta/cantidad, sin doble suma automática.
- Cerrar sesión limpia caché privada del dispositivo y solicitudes pendientes; no entrega la selección de una cuenta a otra. Limpiar la caché no elimina su carrito remoto.
- Checkout desde carrito valida revisión bajo bloqueo antes de crear pedido. Si cambió antes, rechaza con conflicto sin crear/reservar/borrar y pide aceptar nuevo resumen; si coincide, pedido y retirada de cantidades compradas son atómicos. Las ediciones posteriores usan la nueva revisión y se conservan. Cotización independiente no limpia el carrito sin intención y revisión explícitas. Una respuesta incierta se reconcilia primero por idempotencia: recuperar pedido existente no vuelve a limpiar ni falla por el carrito ya modificado.

## 8. Pendientes de concreción incluidos en implementación

Además de entidades ya descritas en13, falta representar la propuesta de armado y sus versiones/aceptación porque el servicio fue confirmado; también carrito remoto y líneas por cuenta porque la persistencia fue elegida. Estas entidades responden a decisiones ya tomadas; la organización física propuesta está en [13c](13c-esquema-comercial-y-operaciones.md), sin tablas anticipadas para funciones no pedidas.

Antes de migrar: diccionario exacto, FK/uniqueness para ofertas y vínculos, snapshot inmutable, cantidades/importes válidos, modo demo decidido por servidor, transiciones, TTL de reserva, cancelación, permisos concretos y pruebas RLS/RPC. El límite de tablas del alcance anterior no prohíbe las nuevas entidades que justifique la ampliación; tampoco autoriza duplicar productos o añadir módulos sin necesidad.

Precios, promociones y confirmación deben tener una única autoridad de servidor. La UI puede anticipar resultados, pero no otra fuente de precios; cualquier cálculo duplicado entre runtime/SQL necesita pruebas de contrato. No hay una consulta por línea al cambiar cantidades: agrupar consultas y reutilizar QueryClient.

### Pruebas que faltaban en13

1. Promoción termina después de crear pedido: snapshot vigente conservado; pedido nuevo usa condiciones nuevas.
2. Oferta cambia entre resumen y pedido: nueva aceptación, sin reservar con importe distinto.
3. Confirmación de pago duplicada/antigua: una sola venta y ningún salto de estado.
4. Stock ajustado mientras hay reservas: rechazo de ajuste incompatible.
5. Pedido vence y otro cliente compra: intento de demo tardío no toma stock ajeno.
6. Cambio del montaje después de revisión: no hereda aceptación técnica.
7. Mismo montaje añadido dos veces y SKU compartido por GLB: cantidades intencionales y stock único.
8. Carrito anónimo más carrito de cuenta existente: resolución explícita y aislamiento A→B→A.
9. Carrito editado antes de checkout: conflicto sin crear pedido; edición posterior a compra atómica conservada y replay sin segunda limpieza.
10. Modo demo manipulado en DevTools: no confirma una operación de otro modo.

## 9. Dictamen documental

**Las decisiones de negocio consultadas quedaron cerradas; dirección coherente, arquitectura de precios acordada en13b y esquema propuesto en13c.** Antes de ejecutar falta concretar y revisar los contratos completos de datos/UI, condiciones configurables y aceptación; no confundir esto con un comercio implementado. Las autorizaciones anteriores del configurador no bastan para empezar este alcance.

El usuario cerró las tres decisiones prioritarias: componentes con armado opcional/cotización, retiro y envío con coste cotizado, y carrito persistente en cuenta/entre dispositivos. También confirmó promociones porcentuales/fijas sin acumulación ni gratuitos, cliente cancela antes del pago/admin antes de preparar y precios/stock de ejemplo identificados como demo, editables en Administración. Estas respuestas están incorporadas en13/13a; plazo de reserva/vigencia y contratos de datos/UI se concretan antes de ejecutar. Los detalles técnicos se resuelven dentro de ese trabajo, sin pedir al usuario elegir nombres de tablas, índices o códigos de permisos.


### Entrega y contacto confirmados

Retiro y envío están incluidos. El presupuesto de entrega debe incluir modalidad, destino cuando aplique, coste y vigencia, con aceptación antes de crear el pedido/pago. Cambiar destino o modalidad invalida el coste anterior, sin conservar un envío cotizado para otra dirección. No hace falta integrar un transportista: registrar coste/condiciones aceptadas y estado de atención es suficiente para el alcance. Recogida no solicita dirección de envío; los campos mínimos se concretan antes de sus formularios y no se añade una libreta de direcciones por obligación.


Revisión cruzada posterior con tres agentes y segunda lectura: [13d](13d-revision-cruzada-del-plan-comercial.md). Las correcciones de carrito, cotización/precio, identidad, moneda, IAM y caducidad están incorporadas en13–13c. El dictamen es documental y las pruebas quedan dentro de las fases.


Actualización de autorización ·27/10/2026: el usuario solicita comitear los planes por partes y después ejecutar esta ampliación. Queda autorizada la implementación por fases, incluidas migraciones Cloud, datos comerciales demo y UI; las declaraciones anteriores de «solo documentación» describen la etapa de redacción. No se habilitan cobros reales. El estado de avance se registra en08 y no se declara terminado por esta autorización.
