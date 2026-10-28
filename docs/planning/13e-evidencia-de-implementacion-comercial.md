# 13e · Implementación comercial y evidencia

Fecha: 27/10/2026. Alcance autorizado por el usuario después de comitear los planes por partes. Estado: código comercial y validación automatizada entregados en desarrollo; aceptación visual del usuario pendiente. Se conserva el conjunto en planning para revisar su aceptación, sin confundir pago demo con integración financiera real.

## Autorización y commits previos

Los planes quedaron separados en `b5ef57f` (alcance/datos), `265da1b` (revisión/validación) y `27dd253` (flujo/autorización), con Conventional Commits en inglés. El cambio previo del usuario en el PDF de su manual quedó fuera. Por petición explícita posterior, la implementación quedó separada en `0fc0d0c` (backend comercial), `991ca47` (acciones compartidas y retorno de autenticación), `f068ea1` (tienda/checkout/gestión) y `ed21c31` (pruebas de navegador y limpieza), más un commit documental con esta evidencia. No hubo push ni despliegue Netlify. El PDF del usuario permanece sin comitear.

## Resultado funcional

```text
Catálogo público / ficha          Montaje3D autenticado
  │ precio demo y acabado          │ convertir selección explícita
  └─────────────┬──────────────────┘
                ↓
       Carrito por cuenta / anónimo local
                ↓
       Retiro                   Armado o envío
         │                          ↓
         │                  Cotización versionada
         │                  revisión y costes por personal autorizado
         └─────────┬────────────────┘
                   ↓
          Resumen aceptado en servidor
                   ↓
          Pedido + líneas + reserva
                   ↓
     Pago demo → Confirmado → Preparación → Listo → Entregado
```

- Catálogo/ficha muestran precio ATLAS separado de price_reference. Ofertas por variante/acabado; genérico visual de un producto comercial real no impide venderlo. Los cinco modelos genéricos ATLAS sin producto físico definido no generan ofertas.
- «Comprar componentes» en la barra del configurador convierte posiciones a unidades comerciales, permite seleccionar, sumar o reemplazar todo el carrito expresamente y señala piezas/colores sin oferta. Conserva la guardia de salida y el guardado explícito: no guarda la bicicleta por comprar piezas.
- Carrito remoto por cuenta, recuperable entre dispositivos; anónimo guarda solamente IDs/cantidades. Login ofrece combinar, usar selección anónima o conservar cuenta; logout no elimina el remoto. Cache y respuestas tardías se aíslan por identidad/generación y permiso.
- Compra directa con retiro, o solicitud de cotización para envío/armado. Armado exige montaje seleccionado y correspondencia de piezas; los extras se compran por separado en este alcance, sin inventar posiciones desde cantidades agregadas.
- Mis pedidos tiene Cotizaciones/Pedidos, detalles en Drawer, vigencia, aceptación, revisión y nuevas versiones. Cotizaciones sustituidas remiten a la versión vigente; una ya consumida conserva su estado de pedido creado aunque pase la fecha original.
- Administración añade Ventas → Ofertas / Promociones / Pedidos. Cotizaciones dentro de Pedidos; campos, tablas, búsqueda diferida, guardia de borradores de ofertas/promociones y Drawer reutilizados. Acciones comerciales del panel usan el pie fijo compartido mediante DrawerActions; campos y detalle conservan su propio desplazamiento.
- Personal autorizado revisa composición por posición y ficha técnica capturada por servidor antes de publicar cotización. Puede aprobar/rechazar y fijar costes, sin modificar el montaje privado ni afirmar compatibilidad mecánica certificada.
- Pago demo con Yape/transferencia/tarjeta, aprobación/rechazo/cancelación simulados. No recopila datos bancarios ni muestra destino real de cobro. Cliente cancela antes de aprobar; gestor antes de preparar. Reposición/liberación de stock una sola vez; cancelar no inventa un reembolso.

## Contratos operativos concretados

| Campo o política | Implementación de demostración |
| --- | --- |
| Moneda | PEN, sin mezclar monedas ni conversión automática |
| Precios iniciales | Ilustrativos por categoría, identificados como demo y editables; no precios vigentes obtenidos del mercado |
| Stock inicial | 12 unidades comerciales por SKU, sin almacenes adicionales |
| Precio base | 1–100000000 centavos; operaciones y total acotados para representar enteros exactos en PostgreSQL/JSON/JavaScript |
| Cantidad / líneas | 1–99 por SKU y hasta100 líneas de carrito/pedido |
| Stock administrable | Entero0–1000000; no puede quedar por debajo de reservas vigentes |
| Reserva | 30 minutos por defecto, reloj fresco tras bloqueos; configurable en servidor mediante app.sales.reservation_minutes, rango operativo1–1440 |
| Cotización | 48 horas por defecto al publicarla; app.sales.quote_hours en servidor, rango operativo1–720 |
| Retiro directo | Coste0 definido expresamente por sales_policy; envío nunca se deduce gratuito por faltar cotización |
| Descuento | Porcentaje1–9999 bps o fijo positivo, sin acumular; redondeo por unidad y precio final positivo |
| Unidades | Piezas individuales; pedales por pareja; bielas/plato y cambio/mando como conjunto demo. No paquetes de varias posiciones sin contrato |
| Fechas | Instantes UTC, presentación y edición comercial en America/Lima |
| Cuenta con historia | FK RESTRICT conserva pedidos/cotizaciones frente a borrado físico de Auth; no se añade borrado de cuenta a la web. No publicar ese borrado como disponible sin definir tratamiento de datos e historia |

Los valores de tiempo son configuración del entorno demo, no condiciones contractuales de una tienda real. Los cambios operativos deben tener fuente local/versionada antes de aplicarse a Cloud. Persistencia y permisos son reales; únicamente el resultado financiero se simula.

Pedido, precio y revisión aceptados se fijan en servidor. Carrito cambió antes de crear: conflicto sin efectos; coincidió: creación/limpieza atómicas. Replay recupera primero el pedido original, sin volver a cobrar/consumir/limpiar. Cotización vigente conserva su precio aunque termine la promoción; crear pedido desde ella no limpia otro carrito sin intención/revisión expresas.

## Fuentes y estado Cloud

[028](../../supabase/migrations/20261027002800_commerce_schema.sql) crea once tablas, índices, RLS, permisos y política demo; [029](../../supabase/migrations/20261027002900_commerce_operations.sql) implementa precio/carrito/pedido/pago/atención; [030](../../supabase/migrations/20261027003000_commerce_management.sql) gestión y cotizaciones; [031](../../supabase/migrations/20261027003100_commerce_demo_offers.sql) datos iniciales. [032](../../supabase/migrations/20261027003200_commercial_representations_and_quote_snapshots.sql) completa productos comerciales con representación genérica y snapshots técnicos; [033](../../supabase/migrations/20261027003300_commerce_account_binding.sql) vincula intención asíncrona a cuenta; [034](../../supabase/migrations/20261027003400_commerce_units_and_pickup_contract.sql) unidades/identidad y coste de retiro. [035](../../supabase/migrations/20261027003500_commerce_historical_visual_aliases.sql) incorpora alias históricos y acceso autorizado a sus selecciones; [036](../../supabase/migrations/20261027003600_commerce_offer_revision_and_link_writes.sql) protege la revisión del agregado y evita reescribir relaciones al editar solo precio/stock. [037](../../supabase/migrations/20261027003700_commerce_contact_contract.sql) valida tipos/campos y formato de contacto/destino antes de persistir; los DTO conservan exactamente el contenido aceptado para no alterar hashes/cotizaciones por espacios del nombre o correo.

Todo se aplicó con historial de migraciones en el proyecto Cloud configurado en .env ignorado. No se modificaron migraciones ya aplicadas; las correcciones son aditivas. No se necesitó Edge Function nueva, backend local, Docker, workers ni otro proyecto.

Estado después de limpiar fixtures: **23 tablas propias,37 migraciones,70 modelos,782 variantes,780 recursos y4 prearmadas;140 ofertas y689 vínculos actuales**. Todas las140 ofertas demo conservaron stock12 tras las pruebas. Cero cuentas/ofertas temporales; cuatro permisos comerciales y cero tablas comerciales sin RLS. No se alteraron GLB, fotografías o montajes privados existentes. Se asociaron549 revisiones históricas publicadas al mismo SKU por igualdad de identidad comercial:689 vínculos en total, con hasta10 por oferta. La auditoría no encontró códigos de fabricante discrepantes entre esos alias y su versión actual. No se convirtió ningún montaje privado; los datos insuficientes conservan su falta de oferta. Editar precio/stock no reescribe vínculos sin cambios; una prueba observa las escrituras de la tabla para comprobarlo.

Ninguna tabla comercial admite lectura/escritura directa de anon/authenticated. RPC públicas dan proyecciones acotadas; las privadas validan cuenta habilitada, propiedad o permiso, revisión y estado. No se usa service_role en navegador. Matriz IAM sigue como única asignación por rol; registro público conserva user.

Los GUID deterministas de ofertas aceptan el formato UUID de PostgreSQL, sin exigirles un número de versión RFC que el identificador no contiene. Esto se corrigió en los validadores comerciales; no cambió las identidades de catálogo/modelos.

## Comprobaciones reproducibles

Usar Node/pnpm del proyecto, por ejemplo `mise exec node@24.22.0 -- <comando>`:

| Comando | Resultado verificado |
| --- | --- |
| pnpm run build | TypeScript y compilación de producción correctos |
| pnpm check (build + test, runner de dos procesos) | 524 pruebas correctas y2 prototipos omitidos en81 archivos |
| node scripts/test-commerce.mjs | SQL transaccional con rollback: precios/promociones/revisiones, carrito, tampering, snapshot/reserva/pago/cancelación, cotización, fuentes técnicas autoritativas, sustitución y aislamiento |
| node scripts/test-commerce-concurrency.mjs | Sesiones PostgreSQL independientes: última unidad, aprobación esperando tras caducidad y aprobación concurrente repetida sin doble consumo/evento |
| node scripts/test-authenticated.mjs desktop '' commerce | Cinco casos completos de navegador, sin mocks de comercio |
| node scripts/test-authenticated.mjs mobile '' commerce | Los mismos cinco casos en Pixel7/Chromium emulado |
| node scripts/test-authenticated.mjs desktop '' admin-modular | Cuatro regresiones administrativas correctas, incluidos conflictos y acciones accesibles |
| node scripts/test-authenticated.mjs desktop '' configurator-scroll | Fin real del footer correcto en doce combinaciones de ancho/suspensión y variación de textos |
| node scripts/check-client-secrets.mjs | Ninguna credencial privilegiada configurada presente en dist |
| node scripts/validate-commerce-state.mjs | Conteos, RLS, permisos, modo demo y limpieza de fixtures correctos |

Los cinco casos comerciales cubren compra→pago demo→entrega, cotización de envío→aceptación→cancelación, restricciones REST/rol, creación/edición de oferta/promoción y montaje3D real→carrito→guardado explícito→revisión técnica de armado. El último usa un cuadro Nomad real como montaje parcial de demostración; no certifica una bicicleta completa mecánicamente.

Los tests de React añaden importes exactos/moneda/fechas, límites de cantidades, fusión explícita, logout y callbacks A→B→A. El carrito consulta precios unitarios por lote de SKUs; aumentar cantidades reutiliza ese lote y calcula la presentación sin consultar precios por cada pulsación. Servidor vuelve a validar al crear pedido.

La primera ejecución masiva sin límite de procesos agotó los5 segundos de tres tests geométricos existentes. Se acotó el runner a dos procesos también para pnpm check; pasaron sin cambiar geometrías ni relajar aserciones; los fallos originales eran timeout, no resultados geométricos distintos.

Una tanda paralela posterior tuvo timeouts de conexión/transporte a Cloud, también al leer el historial de migraciones; no se observaron bloqueos activos en la inspección posterior. Se recuperó la limpieza pendiente y se repitieron las suites comerciales de escritorio/móvil de forma secuencial: cinco casos correctos en cada una. Los ejecutores acotan las operaciones SQL de soporte a60 segundos; los de migraciones y concurrencia distinguen timeout de error SQL; el navegador conserva su límite de red existente. Un fallo de limpieza ahora se informa como tal, sin imprimir una confirmación falsa. La validación final también busca modelos y recursos de fixtures, además de cuentas/ofertas. La prueba de caducidad coordina sesiones mediante marcadores: inicia el plazo en la sesión pagadora ya abierta y libera el bloqueo después de ese plazo, evitando que la latencia de conexión falsee la condición de entrada previa a caducidad.

Capturas, traces y resultados JSON en models/local/validation/commerce y models/local/validation/browser, ignorados por Git. Los ejecutores limpian cuentas, miniaturas Storage del usuario temporal, promociones/ofertas de fixtures y pedidos de prueba; restituyen exactamente las unidades demo consumidas por sus pedidos aprobados antes de borrar la evidencia temporal de DB. El test SQL revierte sus filas completas.

## Revisión pendiente y límites

Queda la aceptación visual del usuario en su navegador y, si se necesita, Android físico. La emulación no es prueba de dispositivo real/FPS. El nuevo retorno comercial de Google tiene allowlist y conservación de intención; el intercambio OAuth real conserva el flujo existente y no se volvió a certificar consentimiento externo por estos tests de contraseña.

No se añadieron cobros/reembolsos reales, QR/números reales, APIs bancarias, tributación electrónica ni integración de transportista. No se anuncia unicidad en el mercado, rentabilidad probada o compatibilidad mecánica certificada.

Frontend local: http://localhost:5174/ (origen conservado para el callback de Google). Catálogo /componentes, checkout /comprar, historial /mis-pedidos, gestión /administracion/ofertas, /administracion/promociones y /administracion/pedidos. Netlify no recibió estos cambios por no haberse solicitado push/despliegue.

Referencia técnica usada al concretar el reloj de caducidad y funciones privilegiadas: [PostgreSQL · fecha y hora](https://www.postgresql.org/docs/current/functions-datetime.html) y [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html). La evidencia de ejecución de este proyecto está en los comandos/archivos anteriores.
