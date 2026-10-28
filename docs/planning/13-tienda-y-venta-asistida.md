# 13 · ATLAS MTB como tienda y venta asistida

Estado posterior a la autorización: la implementación técnica y sus comprobaciones se registran en [13e](13e-evidencia-de-implementacion-comercial.md). Las frases de esta revisión sobre «sin implementación» corresponden a la etapa documental anterior; no sustituyen el estado vigente.

Fecha: 27/10/2026. **Estado: planificación comercial solicitada; sin implementación ni migraciones autorizadas por este documento.** La primera entrega de pagos llega a interfaz demostrativa, sin conexión bancaria ni cobros reales. La autorización anterior de implementación del configurador no activa por sí sola esta nueva ampliación.

Contratos y revisión: [13a](13a-contratos-y-validacion-comercial.md). Arquitectura de ofertas/precios: [13b](13b-precios-y-ofertas-comerciales.md). Decisiones confirmadas durante revisión: componentes y armado opcional con cotización previa; retiro y envío con coste aceptado; carrito registrado persistente en cuenta y recuperable entre dispositivos.

Relacionado: [producto](01-producto-y-alcance.md), [arquitectura](02-arquitectura-y-frontend.md), [datos](03-datos-y-operaciones.md), [IAM](04a-iam-roles-y-permisos.md), [administración](06f-administracion-modular-y-componentes.md), [compatibilidad](06g-avisos-globales-de-compatibilidad.md) y [fases](08-fases-y-validacion.md).

## 1. Dirección comercial

**ATLAS MTB será una tienda especializada en enduro y descenso que acompaña al ciclista a elegir, comprender y visualizar su bicicleta antes de comprar componentes o solicitar su armado.** Catálogo propio de venta significa inventario comercial gestionado por ATLAS, con productos de distintas marcas; no significa fabricar componentes ni ser un marketplace de vendedores.

Se conservan catálogo técnico, comparación, configurador multimarca, avisos, montajes privados y administración. La venta y el servicio de armado propuestos aportan ingresos; no se requiere suscripción para justificar esta orientación. El conocimiento del responsable del negocio se expresa en información técnica mantenida y revisión de propuestas, sin prometer compatibilidad certificada por el render.

Los anteriores documentos excluían tienda, stock y pagos. Esa exclusión describe el alcance anterior; este documento amplía la **planificación futura**, sin presentar esas capacidades como existentes. Siguen excluidos ERP, múltiples tiendas/vendedores, compras a proveedores, contabilidad integral, crédito/cuotas, monedero, suscripciones y simulación mecánica certificada.

```text
CATÁLOGO ──→ Elegir piezas ──────────────────────────────┐
    └──────→ Montaje 3D ──→ Revisar propuesta de armado ─┤
                                                       ↓
                 Carrito → Resumen → Crear pedido → Medio de pago
                                                       ↓
                              Mis pedidos ← Estado de atención
```

## 2. Qué se conserva y qué cambia

| Base existente | Ampliación propuesta |
| --- | --- |
| Variante técnica y representación 3D versionada | Oferta comercial/SKU, acabado vendible, precio propio y disponibilidad |
| Precio de referencia con mercado/fuente/fecha | Precio de venta ATLAS independiente, sin sobrescribir la referencia |
| Montaje guardado, incluso incompleto/incompatible | Conversión explícita de piezas vendibles a carrito o solicitud de revisión |
| Avisos que permiten experimentar | Revisión de una solicitud de armado antes de ofrecer un montaje definitivo |
| Administración modular y matriz de roles | Gestión comercial autorizada, usando tablas y Drawer existentes |
| UI de catálogo y fichas | Precio, promoción y acción de compra junto a la acción 3D |

No duplicar catálogo ni usar otra identidad de producto por cada GLB. Los recursos históricos de montajes privados siguen válidos; una revisión de malla no crea existencias físicas nuevas.

## 3. Producto vendible y unidades

- Una oferta identifica un SKU real, variante comercial y acabado efectivamente ofrecido, con estado activo/inactivo, moneda, precio y stock simple. Sin oferta activa no hay compra; puede mantenerse la consulta o simulación.
- Relacionar representación técnica con SKU explícitamente. Varias revisiones visuales del mismo producto físico pueden apuntar al mismo SKU; no vincular automáticamente modelos/años/medidas diferentes ni multiplicar su stock. Seleccionar otra representación no garantiza disponibilidad comercial.
- Color libre del configurador no equivale a acabado disponible. Al convertir, pedir un acabado vendible; pintura personalizada no entra como servicio implícito. Genéricos ATLAS de representación sin producto físico identificado no se venden como si existieran.
- Definir unidad de venta: aro/neumático/buje/disco por unidad cuando corresponda; pedales por pareja; bielas y plato como conjunto si así se vende. Dos slots delantero/trasero que usan el mismo SKU suman cantidad2; dos pedales representados por un conjunto vendido en pareja suman cantidad1. No contar mallas como artículos.
- La prearmada de referencia no es automáticamente una bicicleta disponible para compra. Precio comercial se obtiene de sus ofertas asociadas; cualquier precio de paquete necesitará decisión expresa y no se inventa desde el ejemplo visual.
- Desactivar una oferta impide nuevas compras pero conserva líneas de pedidos anteriores, sus precios y representaciones.

## 4. Precios y promociones

Propuesta base para revisar: tienda en Perú, precios en **PEN**, precisión de centavos y sin conversión de monedas automática. Los importes comerciales iniciales los define el negocio; no copiar precios referenciales extranjeros como ventas vigentes.

| Concepto | Regla |
| --- | --- |
| Precio base | Propio de la oferta; positivo y con revisión/fecha de actualización |
| Promoción | Porcentaje o importe fijo por unidad, aplicado a SKUs seleccionados |
| Vigencia | Inicio incluido, final excluido; instante UTC, presentación America/Lima |
| Concurrencia | No acumular promociones: aplicar la elegible que deje menor precio; empate por ID estable |
| Límites | Confirmado: porcentaje e importe fijo sin acumulación ni gratuitos; precio efectivo mínimo de un centavo también después de redondear. Contratos13a/13b |
| Redondeo | Centavos enteros; porcentaje de hasta dos decimales; redondeo mitad hacia arriba por unidad antes de multiplicar. No usar floats como autoridad |
| Transparencia | Precio anterior real, descuento y precio final; sin tachar precios inventados |
| Cambio posterior | Carrito se recalcula; resumen cambiado necesita aceptación; al crear pedido se fija snapshot durante su reserva. No esperar a confirmar el pago para fijarlo |

No se añaden cupones, programas de puntos, reglas por cliente o promociones combinatorias. El usuario confirmó excluir pedidos/líneas gratuitos: porcentaje menor que100 e importe fijo inferior al precio base; el redondeo tampoco puede dejar precio0. No se presenta un pedido de importe0 como pagado.

```text
Subtotal bruto = suma(precio base unitario × cantidad)
Descuento      = suma(descuento unitario aplicable × cantidad)
Total          = subtotal bruto − descuento + armado aprobado + entrega aprobada
```

Armado y entrega solo se cobran cuando estén definidos, aceptados y mostrados. Si falta determinar un coste, mostrar «Por cotizar» y no permitir un total final engañoso. Política de impuestos, comprobantes y presentación de precios finales pendiente de definir para una operación real; no calcular tributos ni anunciar facturación electrónica sin ese contrato.

En la futura implementación, servidor recalcula precios, promociones y cantidades; React presenta la misma regla pura para anticipar el resumen. Nunca confiar en importes/descuentos enviados por el navegador como total autorizado.

## 5. Carrito, revisión técnica y pedido

1. Añadir producto con variante/acabado/cantidad explícitos; cambiar cantidad o quitarlo actualiza el resumen. Conservar intención de carrito al acceder, sin exponer datos privados de otra cuenta.
2. Un montaje no se compra ni se guarda en carrito automáticamente. «Comprar componentes» muestra su correspondencia de SKUs y cantidades, separando no vendibles, no disponibles y acabados pendientes. El cliente decide qué incluir.
3. Compra de componentes sueltos no certifica que formen una bicicleta compatible. Solicitar **armado** sí incorpora revisión: conflictos conocidos o datos relevantes sin confirmar pasan a evaluación del negocio antes de cerrar propuesta y cobro.
4. La revisión no modifica el montaje privado. Sustituir piezas o modificar la cotización requiere nueva versión que el cliente debe aceptar; un cambio de precio de catálogo o fin de campaña no modifica automáticamente una cotización publicada vigente. Conservar versión/fecha de los datos usados; no reemplazar referencias silenciosamente.
5. Resumen antes de confirmar: productos, cantidades, precios base/descuentos, servicio si procede, modalidad de entrega, costes, moneda y total. El usuario confirmó retiro y envío con coste cotizado y aceptado antes de confirmar. Elegir envío sin coste/datos confirmados mantiene la propuesta pendiente; no se interpreta como entrega gratuita ni activa pago.
6. Crear pedido bajo cuenta autenticada e identidad conocida, con clave de idempotencia: doble clic/reintento no crea dos pedidos. Guardar snapshot de líneas, acabados, medidas comerciales, precio, promoción y vínculo opcional al montaje/revisión de origen.
7. La futura implementación comercial persiste en Supabase un pedido identificado como demo; nunca representa una venta real ni afecta existencias destinadas a ventas reales. Una maqueta que solo modifica estado local se identifica como tal y no acredita persistencia o seguridad backend.

### Carrito de compras · solicitado expresamente

Acceso permanente «Carrito» en la cabecera con icono y contador de **unidades de venta**: una pareja de pedales cuenta como una unidad comercial; dos neumáticos iguales suman dos. El contador refleja cantidades y no mallas3D ni número de líneas. La oferta/SKU ya incluye el acabado vendible; la clave de línea es oferta_id, no un nombre o color libre. Diferentes acabados comerciales tienen ofertas distintas. Contrato en13a.

```text
┌ Cabecera ATLAS ─────────────────────── [Carrito · 3] ┐
│ Vista actual                 ┌──────────────────────┤
│                              │ Tu carrito        ✕ │
│                              │ Foto · Producto     │
│                              │ Variante / acabado  │
│                              │ Precio / descuento  │
│                              │ [−] 2 [+]  Subtotal │
│                              │             Quitar  │
│                              ├──────────────────────┤
│                              │ Subtotal / descuento│
│                              │ Total en PEN        │
│                              │ [Continuar pedido]  │
│                              └──────────────────────┘
└─────────────────────────────────────────────────────┘
```

Reutilizar Drawer derecho con cabecera/pie visibles, contenido desplazable y tamaño móvil adaptado al contenido/viewport. No acumular paneles de carrito y ficha. «Añadir» confirma la acción sin enviar automáticamente al pago; el cliente puede continuar explorando. Abrir o cerrar carrito conserva filtros, variante y montaje; no guardar el montaje implícitamente. Cambiar un formulario con borrador pendiente conserva su guardia existente.

Cada línea muestra foto del producto, nombre, variante, acabado, unidad de venta, precio base, descuento aplicable, precio efectivo, cantidad, subtotal y acción Quitar. Aumentar/disminuir o introducir cantidad permite enteros válidos y muestra disponibilidad; cantidad cero se resuelve mediante Quitar, sin mantener líneas invisibles. Si se añade el mismo SKU/acabado se incrementa su cantidad; otro acabado constituye otra línea. No agregar piezas fuera de stock silenciosamente ni sustituirlas.

Decisión confirmada: carrito del usuario registrado persistente en Supabase y recuperable después de cerrar sesión o desde otro dispositivo. La copia local solo es caché; cerrar sesión/cambiar cuenta la limpia sin borrar el carrito remoto. Antes de acceder puede prepararse un carrito anónimo con IDs/cantidades en el navegador, sin datos de contacto o pago; si la cuenta ya tiene carrito, combinar o reemplazar requiere elección explícita y no duplica cantidades silenciosamente. Mutaciones remotas con revisión para no perder cambios entre dispositivos; detalles en13a.

Estado vacío con «Explorar componentes»; carga/error recuperable al consultar precios; «Precio actualizado», «Promoción finalizada» o «Disponibilidad insuficiente» cuando corresponda. No borrar el carrito por un error de red. Respuestas antiguas no reemplazan cantidades más recientes. El total cambia por operaciones explícitas y por una revisión comercial informada; al confirmar se recalcula en servidor. La persistencia remota está solicitada expresamente; debe incluirse su contrato y aislamiento por cuenta, sin un motor de sincronización ajeno a esa necesidad.

«Continuar pedido» conduce a resumen/datos mínimos, crea el pedido y después abre el medio de pago demo con el mismo contenido. Solicitar armado desde carrito exige escoger un montaje/selección con posiciones; envío sin armado se cotiza con sus líneas y destino, sin exigir3D. El cliente recupera solicitudes y compras en «Mis pedidos», pestañas «Cotizaciones» y «Pedidos», conforme a13c. No se ofrece con carrito vacío o líneas sin oferta válida; resolver cantidades/acabados/disponibilidad primero. La revisión de un servicio de armado se mantiene separada de comprar piezas sueltas. Armado o entrega por cotizar no se presentan como coste cero ni como total definitivo.

### Disponibilidad sin sistema de almacén completo

Stock por SKU, cantidades enteras no negativas y ajuste autorizado. Carrito no reserva. En la implementación inicial se prueba el ciclo real de disponibilidad/reserva con stock de demo. Crear pedido con precio aceptado reserva por un plazo configurado y visible; no inventar ese plazo en este documento. Comprobar y reservar todas las líneas en una transacción, bloqueando ofertas en orden estable. Última unidad solicitada por dos clientes: solo una reserva válida.

La semántica exacta de stock, reserva, consumo y repetición de operaciones se fija en13a. Reserva/cantidad pendiente se deriva de pedidos y líneas con estado/vigencia; no exige un ERP ni un motor de almacenes. Expirar/cancelar libera una sola vez; confirmar pago convierte la reserva una sola vez. Caducidad de inventario se comprueba por reloj del servidor en cada operación; la limpieza posterior no debe ser requisito para que otra persona pueda comprar. En demo, aprobación tardía de reserva vencida se rechaza, incluso si la petición comenzó antes y esperó un bloqueo. Si en el futuro se habilita pago manual real, el ingreso recibido tarde se registra y pasa a resolución manual si no hay stock, sin marcar pedido atendido. No prometer reposición, devolución automática ni venta sin existencias.

## 6. Estados comprensibles e independientes

| Ámbito | Estados propuestos |
| --- | --- |
| Cotización de armado o envío | Pendiente de revisión/cotización → Pendiente de aceptación → Aceptada / Rechazada / Sustituida; vencimiento visible |
| Pedido | Pendiente tras crearlo → Confirmado al aprobar el pago de demo → En preparación → Listo para recoger/despacho según modalidad → Entregado; Cancelado / Vencido donde corresponda |
| Pago demo | Sin simular → Simulado aprobado / Simulado rechazado / Simulación cancelada |
| Pago manual futuro | Pendiente → En revisión → Confirmado / Rechazado |

No confundir aprobar una propuesta, crear pedido, declarar pago y recibir dinero. «Ya pagué» no significa «Pago confirmado». En demo puede recorrerse preparación/entrega como estados de un **pedido de demostración**, nunca de una venta real. En modo real, no preparar/entregar por una mera declaración del cliente.

Cancelación confirmada por el usuario: el cliente puede cancelar antes de aprobar pago; el administrador puede cancelar antes de comenzar preparación. Después no se habilita esa transición automática. El pago aprobado y la cancelación concurrentes se serializan; cancelar no significa reembolsar. Stock se libera/restaura una sola vez según13a.

Cambio de estado exige permiso, revisión y transición válida; actor, fecha y motivo cuando proceda. Tras aprobación no editar una línea sin nueva aceptación. Cancelación y eventual devolución son operaciones distintas: no mostrar «Dinero devuelto» por cambiar un estado. Reembolsos automáticos/parciales y financiación quedan fuera del primer alcance.

## 7. Pagos: interfaz acordada y alternativas reales

### A. Alcance inicial: demostración de interfaz

Métodos ilustrativos propuestos: **Yape, transferencia bancaria y tarjeta**. Su visibilidad definitiva se revisa con el usuario; nombrar BCP no configura una conexión bancaria. Selección, instrucciones, resumen, resultado aprobado/rechazado/cancelado y retorno al pedido deben funcionar de forma coherente.

- Mostrar «Demostración: no se realizarán cobros» y acciones «Simular pago», sin presentar una autorización bancaria.
- No usar un QR/número real en demo ni copiar la pantalla de confirmación de Yape como si fuera emitida por su aplicación. Usar diseño ATLAS y constancia propia de simulación.
- No pedir PAN, CVV, clave de Yape, código de aprobación o credenciales bancarias para representar la opción de tarjeta/Yape. No hay motivo para recopilar datos reales en esta demostración.
- El resultado simulado no sirve como confirmación financiera. El registro persistente debe distinguirse de pagos reales desde la fuente de datos; un cliente no puede convertir un pedido real a «simulado aprobado» para obtener entrega.
- No se crean API de Yape/BCP, webhooks, suscripciones, cobros reales ni movimientos de dinero por esta fase. La falta de esos elementos es una delimitación expresa, no una integración incompleta que deba anunciarse como activa.

### B. Alternativa futura: Yape a un número/QR con revisión manual

Es posible mostrar en la web el **QR oficial compartido por el titular**, número receptor y nombre para que el comprador pague desde su aplicación. Esto no exige integrar un API de cobro a ATLAS para mostrar instrucciones; **tampoco permite detectar ni confirmar automáticamente el abono**.

```text
Pedido con total aceptado
       ↓
Mostrar QR oficial + receptor + importe + referencia del pedido
       ↓
Cliente paga fuera de ATLAS y declara «Ya pagué»
       ↓
En revisión → Responsable comprueba movimiento en su cuenta → Confirmado
```

El QR se obtiene/descarga desde la aplicación Yape: no generar un QR genérico que contenga solo el teléfono y asumir que es un QR de pago válido. En un mismo móvil ofrecer copiar número/importe y descargar el QR; no inventar un enlace para abrir/pagar en Yape sin documentación oficial.

La declaración o eventual captura adjunta es evidencia enviada por el cliente, no prueba de ingreso. El responsable comprueba el movimiento receptor y correspondencia de importe/fecha/origen; una referencia repetida no confirma dos pedidos. No se basa aprobación en OCR, SMS leídos por ATLAS, scraping de la app, temporizador o botón del cliente. Si se admiten adjuntos, Storage privado y acceso por propietario/revisor, límites/tipos definidos y enlaces temporales; nunca bucket público ni capturas en Git.

Activar este modo exigiría decisión expresa posterior, datos del receptor confirmados por el titular y política de revisión/stock. No se solicita todavía tu número, QR, cuentas ni claves. Transferencia manual tendría el mismo principio: instrucciones y verificación fuera de ATLAS, sin integración BCP supuesta.

### C. Alternativa futura: cobro automático con proveedor

Una pasarela puede ofrecer Yape y otros métodos, con cuenta de comercio, configuración y credenciales del proveedor. El flujo depende del producto contratado: no equivale a conectar cualquier número personal de Yape directamente con Supabase. Culqi documenta órdenes por QR de billeteras y notificación de cambios mediante webhook; es una referencia, no un proveedor elegido o contratado.

Si se autoriza posteriormente: operaciones privilegiadas en Edge Functions, credenciales solo servidor, creación de órdenes desde total autoritativo, validación de eventos y conciliación contra el proveedor, identificación única de transacciones, reintentos idempotentes y tratamiento de eventos duplicados/fuera de orden. Una redirección de navegador a «éxito» no confirma dinero. Antes de activar, verificar límites de importe/moneda, comisiones y elegibilidad del medio para el precio de bicicletas/componentes; no asumir que todo total puede pagarse con cualquier método ni inventar fraccionamientos.

Este alcance queda documentado como evolución, **no comprometido en la primera implementación**. Elegir integración real requerirá revisar la documentación vigente del proveedor.

## 8. UI/UX comercial: reutilizar la experiencia existente

Catálogo/ficha conserva información técnica y lateral; añade precio de venta, promoción real y estado comercial. «Probar en 3D» no desaparece cuando no hay stock; «Añadir» solo opera sobre ofertas vendibles. Las referencias de mercado se etiquetan y no se mezclan con el total de compra.

```text
┌────────────────────────────────────────────────────────────┐
│ ATLAS MTB             Catálogo     Mis bicicletas   Carrito │
├────────────────────────────────────────────────────────────┤
│ Producto · variante y acabado                              │
│ Precio habitual    Descuento vigente    Precio final       │
│ Disponibilidad                                            │
│ [Probar en 3D]                        [Añadir al carrito]   │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬──────────────────────────┐
│ Revisar pedido                  │ Resumen                  │
│ Contacto / retiro o envío        │ Productos y cantidades   │
│ Cotización aceptada, si aplica   │ Descuento                │
│ Costes definidos y aceptados     │ Armado y entrega         │
│                                 │ Total en PEN             │
│ Demostración: sin cobro real     │ [Crear pedido]           │
└─────────────────────────────────┴──────────────────────────┘
```

El estado siguiente de la misma vista muestra el pedido ya creado, su número y reserva vigente antes de permitir simular pago:

```text
┌ Pedido ATLAS · Pendiente ────────────────────────────┐
│ Total aceptado · Reserva hasta [hora del servidor]   │
│ (●) Yape demo ( ) Transferencia demo ( ) Tarjeta demo│
│ Demostración: sin cobro real      [Simular pago]     │
│ Resultado o reintento: continúa este mismo pedido   │
└─────────────────────────────────────────────────────┘
```

Recargar o volver tras un rechazo recupera ese pedido, sin otro checkout. Mis pedidos incorpora pestañas «Cotizaciones» y «Pedidos» y muestra lista, importe, fecha y estado; detalle en Drawer reutilizado con líneas, información de pago demo y progreso de atención. En móvil, orden natural de resumen/acciones con ajuste al contenido; no alturas fijas para recortar textos, duplicación de títulos o instrucciones con voz de asistente. No abrir una pila de modales para producto → carrito → pago.

Administración amplía la navegación con **Ventas → Ofertas / Promociones / Pedidos**. Stock simple vive con la oferta. Tablas con filtros/paginación y Drawer con acciones visibles, reutilizando Fields, Drawer, guardia de borradores y QueryClient. No un segundo editor del mismo precio en distintos módulos ni un panel de base de datos genérico.

## 9. Arquitectura y datos: propuesta para revisar

React por módulos + reglas puras, Supabase Cloud y Netlify siguen vigentes. Incorporar un módulo comercial propietario de carrito, cálculo y contratos de pedidos; catálogo conserva características/3D y administración sus pantallas. No crear repositorios genéricos, microservicios, workers propios o un servidor local por esta ampliación.

Entidades necesarias del alcance, con diccionario definitivo por concretar y sin migraciones aprobadas:

```text
Carrito persistente por cuenta → líneas de ofertas/cantidades
Propuesta de armado y versiones aceptadas → pedido
Catálogo técnico existente
  └─ Relación variante/acabado ↔ oferta comercial (SKU)
       ├─ Precio, stock simple y revisión
       ├─ Promociones ↔ ofertas
       └─ Pedido del usuario
            ├─ Líneas: cantidades + snapshot comercial
            ├─ Pago: método, modo demo/manual/proveedor y resultado
            └─ Eventos: estado, actor, fecha y motivo
```

Ofertas y relación con variantes se separan solo para compartir un SKU entre revisiones visuales del mismo producto; no modificar el esquema de guardados/GLB. Promociones y sus ofertas tienen relación explícita. Pedido, líneas, intentos de pago y eventos preservan su historia; no almacenar todo el comercio como un JSON sin restricciones. La arquitectura de precios se concreta en13b: oferta estable con precio/stock, vínculos con variantes y promociones relacionadas; sin tabla de listas/histórico de precios. [13c](13c-esquema-comercial-y-operaciones.md) concreta el esquema propuesto de once tablas, campos/FK/índices, reserva sin tabla duplicada, RPC y permisos. La revisión del contrato contra SQL vigente y los valores operativos se completan en las fases antes de sus migraciones, conservando el esquema actual hasta autorizar implementación.

RLS: usuario consulta únicamente sus pedidos/pagos; público solo ofertas/promociones publicadas; gestión comercial por permisos, nunca por texto «admin». Mantener un solo rol por usuario y matriz como fuente de verdad. Los nuevos permisos comerciales se acuerdan antes de implementación; no reutilizar `catalog.manage` para confirmar dinero. Precio/promoción/stock/pago y estados no admiten escritura libre desde el cliente. Indexar por recorridos reales y medir; no descargar todos los pedidos ni producir una consulta por tarjeta.

## 10. Ejecución full scope, sin ampliar por conveniencia

| Paso | Resultado completo requerido |
| --- | --- |
| 1. Cerrar contratos | Decisiones de la sección11, SKU/unidades/acabados, diccionarios/estados y bocetos aceptados |
| 2. Oferta comercial | Precio/stock/revisión, relación con catálogo, permisos y administración; datos de demo identificados |
| 3. Promociones | Tipos/vigencia/prioridad/redondeo, edición y cálculo único comprobado |
| 4. Carrito y pedido | Cantidades, conversión del montaje, revisión técnica de armado, resumen, idempotencia y snapshot |
| 5. Pago de interfaz | Tres alternativas visuales revisadas, simulación explícita y resultados coherentes; sin APIs bancarias |
| 6. Seguimiento | Mis pedidos y gestión autorizada, estados y concurrencia, separación de pago/atención |
| 7. Validación integral | Persistencia, errores, permisos directos, móvil, red lenta, recarga, precios alterados e intentos duplicados |

Toda validación y concreción técnica necesaria forma parte de la implementación futura, no se deriva al usuario como trabajo externo. Esto no exige implementar integración bancaria real si el alcance acordado es interfaz demo.

Criterios verificables: carrito vacío, sumar/restar/quitar, fusionar solo mismo SKU/acabado, recuperar tras recarga/acceso y limpiar al cambiar cuenta, contador por unidad comercial, respuestas de precio fuera de orden; límite exacto de promoción/horario/redondeo; no descuentos negativos/acumulados; dos compradores de última unidad; pago duplicado/rechazado/cancelado; revisión antigua sin sobrescritura; alteración de importe en DevTools rechazada en servidor; promoción vencida informada antes de confirmar; pedido antiguo mantiene precio; dos slots no duplican/malcuentan conjuntos; genérico/color no vendible no se ofrece como producto; reconstrucción3D conserva modelos históricos; usuario ajeno no lee pedido/adjunto ni confirma pago; demo no afecta ventas reales. Pruebas servidor/Cloud cuando exista esa implementación, sin sustituirlas por mocks de navegador.

## 11. Decisiones pendientes antes de ejecutar

Ya acordado: orientación a tienda propia especializada, mantener configurador/guía y añadir lógica de venta, descuentos y medios de pago; primera entrega de pago a nivel interfaz. No falta decidir si hay que contratar una API para construir esa interfaz: no la necesita.

Confirmado por el usuario durante revisión:

- Venta de componentes y armado opcional con revisión/cotización previa.
- Retiro y envío con coste cotizado antes de confirmar.
- Carrito guardado en la cuenta, recuperable desde otro dispositivo; limpiar caché no borra su contenido remoto.
- Promociones porcentuales e importe fijo, sin acumulación ni pedidos gratuitos.
- Cliente cancela antes del pago; administración antes de preparar.
- Precios y existencias de ejemplo, identificados como demo y editables desde Administración; no se inventan como inventario real de una tienda.

Por confirmar sobre propuesta concreta:

- Moneda PEN propuesta y reglas de presentación de precios finales; los datos iniciales ya se acordaron de demo/editables. Las decisiones de promociones/cancelación quedaron cerradas arriba.
- Plazo de reserva y vigencia de propuestas; campos de contacto y dirección para envío; coste de armado y entrega aprobado en cada cotización.
- Impuestos/comprobantes y tratamiento de pagos tardíos si posteriormente se activa comercio real.

Primera fase de pago sigue acordada como interfaz demo. QR real/manual y pasarela automática son evoluciones que no bloquean la demo y no están autorizadas ahora. Los permisos/diccionarios/RPC/índices se concretan técnicamente dentro de la planificación e implementación futura; no requieren que el usuario diseñe tablas.
Las decisiones anteriores no bloquean escribir este plan y sus bocetos; sí deben quedar cerradas antes de implementar su comportamiento comercial definitivo. La creación de código, incluido un prototipo de interfaz, espera una instrucción posterior. No escribir migraciones, poblar precios, activar cobros ni modificar fichas existentes por haber creado este documento.

## 12. Fuentes y límites de la investigación

Consulta de fuentes oficiales el27/10/2026:

- [Yape: obtener/compartir el QR del negocio](https://www.yape.com.pe/preguntas-frecuentes/yape-negocios/como-obtengo-el-qr-de-yape-para-mi-negocio): permite obtener la imagen desde su aplicación; no demuestra una API para confirmar abonos en ATLAS.
- [Yape: identificar un yapeo falso](https://www.yape.com.pe/preguntas-frecuentes/enviar-y-recibir-yapeos/como-identifico-un-yapeo-falso): verificar movimientos/saldo del receptor, sin confiar en la pantalla mostrada por el comprador.
- [Culqi: órdenes por billeteras móviles](https://docs.culqi.com/es/documentacion/pagos-online/ordenes-de-pago/billetera-moviles/): integración de QR y eventos de estado; una ruta posible para automatización posterior, no contratada ni implementada.

Las condiciones del proveedor pueden cambiar. No se fijan aquí comisiones, límites de importes o afiliación comercial como garantías. Tampoco se confirma viabilidad de un número/cuenta concreta: no se han recibido ni usado datos de pago personales.


Revisión documental del27/10/2026: las ambigüedades de persistencia, SKU/acabado, instante de precio, reserva/consumo, pago duplicado y carrito se corrigen con los contratos de [13a](13a-contratos-y-validacion-comercial.md). No equivale a pruebas de un sistema comercial implementado.


Actualización de autorización ·27/10/2026: el usuario solicita comitear los planes por partes y después ejecutar esta ampliación. Queda autorizada la implementación por fases, incluidas migraciones Cloud, datos comerciales demo y UI; las declaraciones anteriores de «solo documentación» describen la etapa de redacción. No se habilitan cobros reales. El estado de avance se registra en08 y no se declara terminado por esta autorización.

Actualización28/10/2026: [13h](13h-armado-automatico-y-metodos-de-pago.md) concreta tarifa automática inicial de armado S/150 editable, exoneración durante revisión técnica, aviso en cuenta y selector de métodos peruanos dentro de Revisar pedido. Sustituye la espera de valoración manual del importe inicial; conserva revisión técnica, aceptación del cliente y pagos simulados.
