# 13b · Arquitectura simple de precios, ofertas y promociones

Estado posterior a la autorización: la implementación técnica y sus comprobaciones se registran en [13e](13e-evidencia-de-implementacion-comercial.md). Las frases de esta revisión sobre «sin implementación» corresponden a la etapa documental anterior; no sustituyen el estado vigente.

Fecha: 27/10/2026. Diseño documental para [13](13-tienda-y-venta-asistida.md) y sus [contratos](13a-contratos-y-validacion-comercial.md); sin SQL/migraciones ni implementación autorizados todavía. Inspección del esquema existente: components agrupa modelos; component_variants incluye características, acabados y una representación3D concreta; price_reference es solo referencia de mercado. El catálogo conserva numerosas revisiones visuales/históricas.

## Decisión acordada

**Precio base y stock en una oferta comercial estable por SKU.** No añadir el precio de venta a components ni replicarlo en cada revisión de component_variants. Tampoco crear ahora una tabla independiente de precios por producto/lista/moneda/canal.

| Alternativa | Consecuencia | Elección |
| --- | --- | --- |
| Precio en components | Un solo precio para tallas/medidas/acabados diferentes | No encaja |
| Precio en cada component_variants | Revisiones3D del mismo producto pueden duplicar precio y stock | No encaja con el versionado actual |
| Oferta comercial/SKU con precio y stock | Separa el artículo físico vendible de su representación e historial3D | Recomendada |
| Ofertas más listas/versiones/canales de precios | Útil si existieran varias listas comerciales reales; hoy añade gestión no pedida | No introducir ahora |

Un SKU identifica producto/generación/medida/acabado comerciales concretos. Una nueva malla del mismo producto no crea un SKU nuevo. Cambiar el producto físico sí exige otra identidad; no reutilizar la oferta de pedidos anteriores.

## Árbol acotado de tablas propuestas para esta parte

Nombres propuestos para el contrato futuro; las cuatro tablas no existen por escribir este documento. Pedidos/carritos/propuestas se concretan en [13c](13c-esquema-comercial-y-operaciones.md) y no se confunden con tablas de precios.

```text
components / component_variants / allowed_finishes     EXISTENTES
       │
       └─ store_offer_variants                         NUEVA: relación visual ↔ venta
            ├─ variant_id       FK component_variants
            ├─ finish_id        acabado existente de esa variante
            └─ offer_id         FK store_offers
                         │
                         └─ store_offers               NUEVA: artículo vendible
                              ├─ id / sku único
                              ├─ component_id FK
                              ├─ etiqueta comercial     medida/versión/acabado vendible
                              ├─ unidad de venta        unidad/pareja/conjunto documentado
                              ├─ base_price_cents       precio propio ATLAS
                              ├─ currency               PEN en propuesta inicial
                              ├─ stock_total            semántica definida en13a
                              ├─ active / revision
                              └─ fechas de servidor

promotions                                             NUEVA: regla de descuento
 ├─ id / nombre
 ├─ tipo: percentage o fixed
 ├─ percentage_bps ?     porcentaje en centésimas de punto porcentual
 ├─ fixed_discount_cents ?
 ├─ currency ?           obligatoria para descuento fijo; null para porcentaje
 ├─ starts_at / ends_at / active / revision
 └─ promotion_offers                                    NUEVA: SKUs afectados
      ├─ promotion_id FK
      └─ offer_id FK
```

La relación por variante/acabado es única para que una elección visual no termine en dos precios contradictorios. Una oferta admite varias revisiones visuales, pero todas deben representar el mismo artículo físico. Validar además que finish_id exista en el JSON tipado de acabados y que component_id corresponda al modelo: no es una FK a texto libre ni se añade una tabla global de colores por comodidad.

commercial_identity conserva generación/año, talla/medidas y acabado físico que identifican el SKU, según13c; cada vínculo debe coincidir, también cuando se edita el catálogo técnico. La etiqueta comercial identifica el SKU para administración/pedido; no duplica toda la ficha técnica ni se utiliza para deducir compatibilidad por comparación de nombres. Los atributos técnicos siguen en su catálogo.

`promotion_offers` permite aplicar la misma campaña a varios SKUs y recibir distintas campañas en un SKU sin duplicar el descuento en los productos. Su PK compuesta evita repetir asignaciones. No se necesita una tabla por tipo de descuento, categoría o método de pago.

## Un único precio base y un precio efectivo calculado

```text
Oferta/SKU → precio base
                    + promociones vigentes asociadas
                    ↓
          precio efectivo calculado por servidor
                    ↓
      catálogo / ficha / carrito / resumen de pedido
```

No guardar precio efectivo, porcentaje aplicado y precio base como tres valores editables independientes. Base y promociones son datos administrables; el efectivo es resultado. No actualizar el precio base cada vez que inicia o termina una campaña. Horario y cálculo usan reloj del servidor, no fecha/manipulaciones del navegador.

Decisiones confirmadas: porcentaje e importe fijo, sin acumulación, sin pedidos gratuitos. Solo un campo de valor de la promoción corresponde a su tipo. Porcentaje entre0 y100 excluidos, de hasta dos decimales; para persistencia propuesta,1% equivale a100 basis points y99,99% a9999. Importe fijo en centavos positivo y menor que el precio base de los SKUs afectados.

Para porcentaje, descuento unitario = redondeo mitad hacia arriba de `(precio_base_cents × percentage_bps) / 10000`, con aritmética entera/decimal exacta. Después, precio efectivo unitario = base − descuento, y subtotal de línea = efectivo × cantidad. Comprobar límites de enteros y conversión segura de importes entre PostgreSQL/JSON/frontend en el diccionario de implementación.

Incluso con porcentaje menor que100, el redondeo de una pieza de precio muy pequeño puede producir precio efectivo0. Esa promoción se rechaza para el SKU; no se publica ni se corrige silenciosamente a otro porcentaje. Cambios posteriores del precio base deben validar promociones activas con vigencia actual o futura, sin dejar descuentos inválidos.

Si coinciden campañas, se elige la válida que produzca el menor precio efectivo; empate por ID estable. Una promoción inválida no se publica y no provoca un carrito roto. Compra directa comprueba elegibilidad de oferta, vigencia y descuento al crear pedido. En cotización publicada se valida su versión/vigencia y ofertas vendibles, conservando el precio/descuento ya cotizado aunque la campaña termine; no aplicar nuevamente promociones. Después de crear pedido rige su snapshot y reserva según13a/13c.

## Qué guardan carrito, propuesta y pedido

| Entidad | Uso del precio |
| --- | --- |
| Carrito persistente | Oferta/cantidad y revisión. Consulta precio actual; una caché no fija el total |
| Propuesta de armado versionada | Snapshot comercial y servicio/entrega cotizados; aceptación concreta y vigencia según13a |
| Pedido creado y aceptado | Snapshot inmutable de precios/descuentos/cantidades/moneda, coste aceptado de armado/entrega y total |
| Pedido consultado después | Presenta su snapshot; no revaloriza compras antiguas con la oferta actual |
| price_reference existente | Referencia técnica/mercado, nunca origen automático del total de venta |

La línea de pedido conserva oferta_id y commercial_identity_snapshot tipado (generación/año/talla/medidas), además de nombres/acabado/unidad, cantidad, precio base unitario, descuento unitario y campaña aplicada cuando exista. Precio efectivo y subtotal se derivan de ese snapshot, no de tablas mutables. El pedido agrupa moneda y costes aceptados; no añade cargos ocultos.

No hace falta una tabla histórica de precios para conservar lo cobrado: el snapshot de pedido conserva su acuerdo. Una trazabilidad exhaustiva de cada cambio de precio sería otra necesidad, no algo implícito en esta propuesta. Mantener revisión/fechas/actor autorizados al editar la oferta.

## Administración y autorización

Ventas → Ofertas edita SKU, unidad, precio base, stock, activación y relaciones con variantes/acabados mediante selectores. Ventas → Promociones edita regla, vigencia y ofertas afectadas. Reutilizar tablas, Drawer, Fields y guardia de borrador. No editar el mismo precio desde Catálogo y Ventas mediante dos formularios diferentes.

Servidor valida coherencia y revisión esperada. El frontend no escribe libremente precio/stock, ni un usuario confirma un total enviado por sí mismo. Permisos comerciales concretos se incorporan a la matriz IAM antes de implementación, sin añadir roles nuevos por obligación y sin convertir catalog.manage en autorización financiera.

Público consulta solo ofertas activas y precio/promoción publicables. La selección puede mostrar «Disponible/Agotado» sin descargar toda la información administrativa o registros de pedidos. La relación con variantes debe respetar las fuentes técnicas y no exponer montajes privados.

## Consultas e índices con propósito

- Único sku en store_offers; única relación variante/acabado en store_offer_variants.
- Índice de relaciones por offer_id, y PK(promotion_id, offer_id) más índice por offer_id para buscar campañas del SKU.
- Listado de ofertas por componente/activación con paginación, orden estable y filtros reales. Diseñar los índices restantes según esas consultas y sus mediciones; no indexar indiscriminadamente todos los campos.
- Consultar precios efectivos para un lote de IDs y devolver una proyección pequeña. Una llamada por listado/carrito, no una consulta por tarjeta ni una por cada pulsación sobre cantidad.
- Reutilizar QueryClient e invalidación dirigida cuando cambie oferta/promoción. Revisar precio autoritativo al crear pedido aunque la caché siga vigente.

Las operaciones transaccionales de pedido/reserva/pago de demo siguen13a. Ningún modelo de precios justifica workers propios, microservicios, ERP, otra base local o una biblioteca de tablas nueva.

## Validación y conclusión

Comprobar: dos variantes de talla con distinto SKU/precio; dos revisiones GLB que comparten precio/stock; acabados distintos; campaña fija/porcentaje y empate; borde de horario; redondeo que produciría0; cambio de base que invalida promoción; cambio entre resumen/pedido; precio antiguo conservado; intento de alterar el total desde el cliente; RLS y edición con revisión obsoleta.

**Arquitectura propuesta: catálogo técnico existente + oferta/SKU con campos de precio/stock + promociones relacionadas + snapshots de pedidos.** Escala con nuevas variantes/ofertas sin convertir cada atributo en una tabla ni agregar un motor de precios no solicitado. El diccionario conjunto de carrito, cotizaciones y pedidos queda propuesto en [13c](13c-esquema-comercial-y-operaciones.md); sus límites operativos y revisión contra SQL vigente forman parte de la futura implementación antes de migrar. No hay tablas nuevas aplicadas por esta validación documental.


Actualización de autorización ·27/10/2026: el usuario solicita comitear los planes por partes y después ejecutar esta ampliación. Queda autorizada la implementación por fases, incluidas migraciones Cloud, datos comerciales demo y UI; las declaraciones anteriores de «solo documentación» describen la etapa de redacción. No se habilitan cobros reales. El estado de avance se registra en08 y no se declara terminado por esta autorización.
