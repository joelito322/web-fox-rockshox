# 13d · Revisión cruzada del plan comercial

Fecha: 27/10/2026. Auditoría documental solicitada por el usuario con tres agentes independientes y segunda lectura de las correcciones. Alcance: [13](13-tienda-y-venta-asistida.md), [13a](13a-contratos-y-validacion-comercial.md), [13b](13b-precios-y-ofertas-comerciales.md), [13c](13c-esquema-comercial-y-operaciones.md), contratos base e inspección del SQL actual. No se ejecutaron migraciones, operaciones Cloud, pagos ni pruebas de un comercio implementado.

## Revisores y resultado

| Revisión | Responsabilidad | Segunda lectura |
| --- | --- | --- |
| Datos | SKU/GLB/acabados, relaciones, snapshots, cotizaciones y simplicidad del esquema | Hallazgos corregidos; sin brecha documental bloqueante adicional |
| Transacciones y seguridad | Stock/reserva, caducidad, promociones, pagos demo, idempotencia e IAM | Hallazgos corregidos; contratos técnicos pendientes expresos dentro de fases |
| Producto y experiencia | Recorridos de cliente/administración, carrito, armado, entrega y alcance | Hallazgos corregidos; sin nueva decisión de negocio indispensable |

Los agentes realizaron revisión de solo lectura. El agente principal integró las correcciones y los tres volvieron a comprobar los documentos. No se suman hallazgos repetidos de varios revisores como problemas diferentes.

## Inconsistencias encontradas y corregidas

| Riesgo encontrado | Corrección en los contratos | Comprobación exigida al implementar |
| --- | --- | --- |
| Dos políticas contradictorias ante edición concurrente del carrito | Checkout exige revisión vigente bajo bloqueo; si cambió no crea pedido. Con revisión válida, creación/limpieza son atómicas | Edición anterior provoca conflicto sin efectos; posterior conserva unidades; rollback integral |
| Reemplazo de una selección3D sin guardar procedencias | Reemplazar carrito completo con confirmación y vista previa, o sumar cantidades | Carrito con componentes sueltos + montaje: no borrar ni duplicar silenciosamente |
| Cotizaciones sin recorrido recuperable y armado desde cantidades sin posiciones | Mis pedidos con Cotizaciones/Pedidos; armado parte de montaje/selección con posiciones; envío solo necesita líneas/destino | Recuperación entre dispositivos; selección incompleta; costes pendientes; extras identificados |
| Boceto que podía simular pago antes de crear pedido | Crear pedido primero; luego identificador/reserva y simulación en el mismo recorrido | Recarga/rechazo continúa el pedido existente, sin otro checkout |
| Precio cotizado frente a campaña actual ambiguos | Compra directa usa precio actual; cotización vigente usa su acuerdo; después manda reserva del pedido | Campaña termina y cotización sigue vigente; cotización vence después de crear pedido |
| Descuento fijo sin moneda y posible mezcla de importes | Moneda explícita para fijo; una moneda comercial configurada; rechazar mezclas | Moneda manipulada, fijo incompatible y carrito heterogéneo rechazados |
| SKU y línea histórica sin medidas comerciales inequívocas | Identidad mínima tipada en oferta y snapshot de pedido; vínculo valida producto/generación/talla/acabado/unidad | Revisiones GLB comparten SKU correcto; distintas tallas no comparten identidad por accidente |
| Relaciones válidas al crearlas pero rotas al editar catálogo | Validación bidireccional al cambiar acabado/identidad; revisiones de agregados protegen tablas puente | Cambio de catálogo no deja vínculo huérfano; reintento/null/revisión antigua no sobrescriben |
| Cotización sin contacto persistido y dos versiones aceptables a la vez | contact_snapshot y serie serializada; sustitución/consumo atómicos; creación idempotente por id/contenido | Publicar nueva versión mientras se acepta anterior: una única versión válida y efectos coherentes |
| Aprobación iniciada antes de vencer pero ejecutada después de esperar | Reloj fresco y lecturas actualizadas después de adquirir bloqueos | Espera real cruza vencimiento: aprobación no consume disponibilidad de otro comprador |
| Propiedad sin verificar cuenta habilitada | Guardia IAM de cuenta confirmada/no bloqueada/rol activo; origen3D propio con permiso de lectura | JWT vigente tras bloqueo/rol desactivado no autoriza operación propia ni lectura ajena |
| Reintento vuelve a evaluar estado mutable o vuelve a limpiar carrito | Replay por identidad/contenido antes de esos efectos; revisión obligatoria no null | Respuesta perdida recupera pedido original aunque carrito/precio/vigencia hayan cambiado |

La solución conserva once tablas comerciales propuestas sobre doce existentes. No añadió motor de precios, nuevas identidades, reservas duplicadas, servicios bancarios ni infraestructura propia.

## Concreción técnica y validación incluidas en las fases

No son tareas externas ni certificaciones ya obtenidas:

- Revisar firmas RPC, restricciones y diccionarios contra migraciones vigentes; fijar límites numéricos exactos y estrategia de borrado/tratamiento de datos personales de cuentas con historia comercial.
- Ratificar moneda comercial y fijar plazos configurables de reserva/cotización antes de datos/formularios; no existe un valor definitivo inventado por esta revisión.
- Concretar orden global de bloqueos, aislamiento y reintentos sin ciclos, con pruebas SQL concurrentes reales. Las lecturas públicas no exponen revisiones privadas/históricas por su relación comercial.
- Dibujar/revisar las composiciones comerciales y responsive; conservar tablas, Drawer, Fields, guardias de borrador y QueryClient existentes.
- Implementar nuevas migraciones/RLS/RPC en el repositorio y luego probar en Supabase Cloud de desarrollo cuando se autorice. Probar llamadas directas además del navegador, no solo mocks.
- Cubrir al menos la matriz anterior, usuario ajeno, gestor sin permiso, retirada de permiso durante edición y cuenta A→B→A; medir consultas por lote y regresiones del catálogo/IAM/3D/montajes históricos.

## Dictamen

**Plan coherente para avanzar por sus fases cuando se autorice la implementación comercial.** Las contradicciones encontradas tienen resolución escrita y no quedan preguntas nuevas de negocio indispensables derivadas de esta revisión. La fase de contratos conserva sus decisiones operativas pendientes y debe completarlas antes del SQL que dependa de ellas.

Esto no garantiza ausencia de fallos ni rendimiento de un sistema aún no construido. Aceptación funcional requiere restricciones, operaciones, UI y pruebas reales completas. La autorización actual continúa siendo documental; no se inició implementación ni se crearon commits.


Actualización de autorización ·27/10/2026: el usuario solicita comitear los planes por partes y después ejecutar esta ampliación. Queda autorizada la implementación por fases, incluidas migraciones Cloud, datos comerciales demo y UI; las declaraciones anteriores de «solo documentación» describen la etapa de redacción. No se habilitan cobros reales. El estado de avance se registra en08 y no se declara terminado por esta autorización.
