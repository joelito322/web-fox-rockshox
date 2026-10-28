# Armado automático y métodos de pago en Perú

Estado: ampliación solicitada y ejecución autorizada por el usuario. El usuario delegó la tarifa al criterio técnico/comercial y confirmó expresamente pagos simulados con Yape, Plin y transferencias a BCP, Interbank, BBVA y Scotiabank. También solicitó esos campos dentro de «Revisar pedido».

## Dirección acordada

El coste del armado debe aparecer automáticamente al solicitar el servicio. El administrador puede exonerarlo al revisar la compra y comunicar el total actualizado al cliente antes del pago. La cantidad de componentes orienta la decisión humana; no se ha solicitado una regla automática de gratuidad por cantidad ni un umbral.

Tarifa inicial fija: **S/150**, editable en Administración → Ventas → Ofertas → Tarifa de armado. El armado sigue siendo opcional, como en la propuesta aceptada. [Toolbikes](https://toolbikesperu.pe/taller/) publica instalación completa de componentes en nuevo cuadro por S/150; [Trek Perú](https://trekperu.pe/servicio-tecnico/) publica armado especial por S/160. La elección de S/150 es una tarifa propia inicial, no un promedio certificado ni una cotización de todos los talleres.

La solicitud de armado continúa pasando por cotización/revisión técnica antes de crear el pedido pagable. El importe deja de esperar una cotización manual, pero el cálculo no certifica compatibilidad. El administrador recibe esa solicitud, conserva la tarifa o marca «Armado sin coste» y publica el resultado; el cliente revisa el total antes de crear el pedido. No se modifican pedidos ya creados ni pagados al cambiar una tarifa global.

```text
Solicitar armado → coste automático visible → revisión administrativa
                                              ├─ mantener coste
                                              └─ exonerar armado
                            → aviso en cuenta → revisar total → confirmar
```

## Interfaz de pago

Mostrar el selector en **Revisar pedido** y en la aceptación de cotización, antes de crear el pedido; reutilizarlo en el panel lateral del pedido pendiente y conservar su pie de acciones. Mantener selección accesible mediante botones con estado, instrucciones del método elegido, importe en soles y seguimiento del canal utilizado. Ninguna selección por sí sola prueba un abono.

```text
Método de pago
[Yape] [Plin] [Transferencia] [Tarjeta]

Transferencia
[BCP] [Interbank] [BBVA] [Scotiabank]

Importe: S/ …
Titular · Cuenta en soles · CCI
Simulación: sin cuenta receptora ni cobro real
```

No inventar números de cuenta, teléfonos o QR. No recopilar credenciales bancarias ni datos de tarjeta. Los métodos bancarios seleccionados se conservan como identidades diferenciadas en payment_attempts; transfer_demo histórico permanece válido. No añadir tablas de bancos, pasarelas o cuentas comerciales para un selector simulado.

## Contratos y persistencia

- 040 amplía los métodos admitidos sin cambiar los resultados simulados, stock, caducidad o idempotencia. Intentos antiguos conservan su identidad.
- 041 añade una única tabla pequeña, `sales_service_settings`: fila singleton, `assembly_fee_cents`, `revision`, `updated_by` y `updated_at`. RLS y sin acceso directo; lectura de tarifa por `sales_policy`, escritura por RPC con permiso `sales.offers.manage` y revisión obligatoria. Evita guardar una tarifa global repetida en todos los componentes.
- Cada nueva solicitud fija `sales_quotes.assembly_base_fee_cents` y `assembly_fee_cents`; cambiar la tarifa no reinterpreta solicitudes anteriores. La revisión puede fijar0 sin volver gratuitos los componentes. Las filas históricas no reciben una base inventada.
- `orders.preferred_payment_method` conserva la selección mediante `sales_create_order_with_payment`, que usa el checkout atómico existente en la misma transacción. Reintentar con otro método bajo la misma clave rechaza el conflicto. Los intentos posteriores registran su canal efectivo; la preferencia no demuestra un pago.
- Las notificaciones se derivan de cotizaciones revisadas y no leídas, sin otra tabla/cola. `sales_quote_notices` devuelve solo avisos propios vigentes (20 detalles por lote y contador) y permite marcar la revisión exacta como leída mediante `notification_seen_revision`. Una revisión nueva no se oculta por un acuse antiguo. Excluye solicitudes sustituidas, consumidas y cotizaciones caducadas.
- Campana en cabecera con panel compartido, enlace al detalle y marcado explícito. Persistencia entre dispositivos; consulta compartida cada45s solo con cuenta habilitada y pestaña activa, más actualización al volver al navegador. No usar una consulta por componente ni suscripción por fila. No hay correo, SMS ni push externo.
- Carrito y checkout comparten `useCartPrices` y la misma clave de caché por conjunto estable de SKU; el importe se recalcula localmente al cambiar cantidades. La tarifa usa una consulta compartida con caché; el total definitivo sigue siendo de servidor.

Referencias: [Plin](https://plin.pe/), [cuenta y CCI en BCP](https://www.viabcp.com/ayuda-bcp/cuenta-de-ahorros/como-saber-numero-cuenta-ahorros-bcp-y-codigo-interbancario-cci). Son referencias de los canales, no convenios ni integraciones de ATLAS con esas entidades.

## Fases y aceptación

1. Tarifa y carácter opcional definidos: S/150 inicial, servicio solicitado por el cliente. Versionar contrato del importe automático, vigencia y exoneración antes de modificar los RPC. No reinterpretar pedidos pagados ni cotizaciones aceptadas.
2. Cálculo en servidor y exposición en checkout. La revisión técnica continúa necesaria cuando se ofrece armado; los avisos visuales no equivalen a una aprobación del taller. Exoneración durante revisión de la solicitud, antes de publicar/aceptar cotización y crear el pedido. Guardado con revisión y bloqueo de la serie; se conserva el checkout existente que serializa aceptación/consumo con otras versiones. El total aceptado y la reserva deben seguir coherentes.
3. Aviso persistente de actualización visible al propietario y enlace al detalle; comprobar lectura, reintentos y aislamiento. No afirmar envío de correo o push si solo existe aviso en cuenta.
4. Selector de pagos en el panel existente; migración aditiva040 amplía métodos simulados. Mantener idempotencia, caducidad y descuento de stock una sola vez. Históricos continúan legibles.
5. Validar SQL transaccional con rollback, contratos cliente, recorridos de pago y responsive. Registrar evidencia real y límites; no comitear sin petición explícita.

## Evidencia

Implementado y comprobado el28/10/2026, sin commits ni push:

- Migraciones040–041 aplicadas a Supabase Cloud después de pasar regresiones transaccionales con rollback; repetidas sobre el esquema aplicado. Cobertura de tarifa automática, conservación del snapshot al cambiar tarifa global, exoneración, avisos/acuse persistente, aislamiento y permiso, canales nuevos, rechazo de canal desconocido y replay con método distinto.
- Suite general durante el cambio:524 pruebas correctas,2 omitidas/81 archivos. Tras los últimos ajustes,9 pruebas comerciales dirigidas y build de producción correctos.
- Navegador autenticado:5 recorridos de escritorio y5 móviles emulados correctos. Dos regresiones finales de compra/armado y una captura final de compra correctas. Incluyen preferencia Interbank desde Revisar pedido, recorrido por los cuatro bancos y Plin, historial efectivo Scotiabank, tarifa150, exoneración0, campana y marcado conservado tras recarga, aceptación y pedido pendiente de pago. Cabecera/checkout sin desbordamiento también a320px en la regresión final.
- Cuentas, ofertas y recursos temporales eliminados; estado final24 tablas/41 migraciones,70 modelos,782 variantes,780 recursos,4 prearmadas,140 ofertas/689 vínculos. RLS comercial activo, ningún pedido fuera de modo demo. No se modificaron GLB ni pinturas.
- Build sin credenciales privilegiadas configuradas; `git diff --check` correcto. Frontend local responde HTTP200 en5174, una sola instancia persistente del proyecto; servidores efímeros de pruebas terminados.

Capturas y logs en `models/local/validation/commerce/` ignorado: `desktop-checkout-methods.png`, `desktop-payment-methods.png`, `mobile-payment-methods.png`, `assembly-payment-*.log` y `state.json`. Los intentos iniciales con selectores de prueba ambiguos se corrigieron; no se contaron como recorridos satisfactorios. Comprobaciones en Chromium/Pixel7 emulado, sin certificación en Android físico. No se habilitaron cuentas receptoras, cobros, correos ni push externos.

## Refinamiento visual de pagos ·28/10/2026

Usuario solicita mayor elegancia y logotipos. Sustituir el selector plano por tarjetas con marca, indicador circular de selección, borde cálido, elevación breve al hover y foco visible. Cuatro métodos en fila cuando el contenedor permite520px; dos columnas en paneles y móvil. Bancos con logotipos en tarjetas, cuatro/dos columnas; variantes de marca originales, sin teñirlas de naranja. Encabezado de instrucciones con logo seleccionado e importe, datos bancarios compactos y una sola nota de simulación. Entrada breve del detalle al cambiar método, sin animación con movimiento reducido.

```text
[ logo Yape ✓ ] [ logo Plin ] [ Transferencia ] [ Tarjeta ]
[ logo BCP    ] [ Interbank ] [ logo BBVA     ] [ Scotiabank ]
+---------------------------------------------------------+
| logo elegido · método                     S/ importe    |
| Titular                  Cuenta                  CCI    |
| Simulación · sin cobros reales                          |
+---------------------------------------------------------+
```

Recursos locales y procedencia en `src/assets/images/payments/README.md` y `sources.json`. Mismo componente en checkout y pedido pendiente; etiquetas accesibles y métodos/contratos comerciales intactos. No requiere SQL, nuevas dependencias o servicios de logos. Validación visual y recorrido de compra completo correctos en escritorio/móvil emulado; seis imágenes cargadas, sin nuevas peticiones de precio por selector. Evidencia local ignorada.

## Carrito y confirmación de añadido ·28/10/2026

Petición posterior: retirar precios repetidos del panel y hacer evidente el añadido. Cada fila muestra un importe de línea; el precio unitario aparece únicamente con cantidad mayor que1, usando la unidad comercial (unidad/par/juego). La promoción se indica sin repetir otro importe tachado. Un total de componentes al final, sin copiarlo por fila. Foto pequeña, nombre/acabado sin repetir el acabado incluido en el nombre, condición y cantidad; reutilizar la misma lista en checkout.

```text
[Foto] Componente                         S/ 275
       [−] 1 [+]  Quitar
------------------------------------------------
Total de componentes                     S/ 275
[ Continuar pedido ]
```

El botón indica Añadiendo… durante la operación y Añadido al carrito con check/acento de marca durante2,6s después del éxito. Icono de carrito con movimiento/anillo puntual y contador con pulso breve. No confirmar por anticipado ni abrir otro modal automáticamente. Señal común en CommerceProvider después de add exitoso; sin nuevas consultas, temporizadores de servidor o persistencia extra. Cada variante/cuenta reinicia su feedback; errores no producen revisión de añadido. La región viva conserva su nodo entre fases, el botón mantiene nombre accesible y todo movimiento se desactiva con movimiento reducido.

Validación del refinamiento: build correcto,10 pruebas comerciales dirigidas (incluye escritura fallida sin señal de éxito), recorrido de compra completo en escritorio/móvil emulado con selector de logos, cambio de cantidades y una única cifra por línea con cantidad1. Los seis recursos de marca cargan correctamente; prueba adicional a320px sin desbordamiento. Inspección visual del carrito y de la confirmación; color de éxito comprobado también mientras el cursor permanece sobre el botón, evitando que el hover oscuro lo oculte. Confirmación reducida sin animación verificada. Evidencia ignorada: desktop/mobile-cart-clean.png, purchase-added-feedback.png y cart-feedback-visual.json, además de cart-feedback-*.log. Sin SQL nuevo, cobros reales o commits.

## Commits solicitados por el usuario

Después de la validación, el usuario pidió expresamente comitear por partes. Código separado por responsabilidad:

| Commit | Contenido |
| --- | --- |
| ff68acb | Contratos SQL de tarifa, avisos y canales de pago; regresiones y estado remoto |
| 9c8c2a4 | Armado/cotizaciones, aviso en cuenta y métodos de pago con logotipos locales |
| 1ca95bc | Carrito sin precios repetidos y confirmación animada tras éxito |
| a9cd0f6 | Reglas puras y pruebas de alternativas de compatibilidad |
| ae41fc4 | Panel de alternativas, aplicación individual, precios y recorridos |

Documentación/AGENTS en un sexto commit independiente. Las pruebas corresponden al conjunto final:60 dirigidas correctas en7 archivos antes del comiteo, además de builds y recorridos previamente registrados; no se afirma haber ejecutado cada suite en cada commit intermedio. Al separar archivos compartidos se usaron versiones parciales únicamente en el índice, conservando los archivos completos de trabajo. El SVG original de BCP conserva sus finales CRLF y SHA de procedencia; su comprobación de espacios preparada aceptó CR al final de línea (`core.whitespace=trailing-space,space-before-tab,cr-at-eol`). Capturas/logs permanecen ignorados. El PDF del manual, ajeno al alcance, no se incluye. Sin push/despliegue; nuevos commits requieren otra petición explícita.
