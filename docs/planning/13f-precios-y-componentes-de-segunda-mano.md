# 13f · Precios visibles y componentes de segunda mano

Dirección del usuario: dar más presencia al precio, retirar «DEMO» de su presentación y orientar cuadros/horquillas/shocks a segunda mano. No convertir esta decisión de la tienda en la afirmación de que en Perú no existen productos nuevos.

## Presentación

- Cards: importe de alto contraste y tipografía de30–37px aproximadamente según ancho; «Desde» solo si hay precios distintos.
- Ficha: importe principal de48px, precio anterior tachado cuando existe promoción y unidad de venta secundaria. Estado «Segunda mano» separado.
- Carrito: precios y total con mayor contraste. Administración usa «Precio (S/)», «Stock disponible» y «Estado del producto».
- Se retiró DEMO/demostración de precios y presentación comercial. El pago conserva «Sin cobros reales» y acciones de simulación: no se habilitaron cobros.
- No se afirma que una pieza esté revisada, reacondicionada o certificada por cambiar su estado comercial.
- En móvil, el carrito conserva icono/cantidad y nombre accesible completo; el logo se ajusta al espacio disponible para que la cabecera no ensanche la página.

## Datos y conservación

Migración [038](../../supabase/migrations/20261028003800_used_component_pricing.sql), aditiva después de037:

    store_offers.item_condition: new | used
               │ RPC / snapshot de cotización / resumen
               ▼
    order_items.item_condition_snapshot

El estado pertenece a la oferta física, independientemente de la revisión GLB. Los cuadros, horquillas y amortiguadores existentes pasan a used; las demás categorías conservan new. Administración permite declarar el estado de una oferta. RPC valida los dos valores y conserva revisión/permisos/propiedad. Los pedidos nuevos capturan el estado aceptado; históricos sin ese dato mantienen NULL. Los precios y snapshots ya aceptados no se reescriben.

Importes por modelo en [used-component-prices.json](../../supabase/catalog/used-component-prices.json). Son una estimación inicial editable de ATLAS para segunda mano, no cotizaciones verificadas ni evidencia de stock físico. Ejemplos: CAPRA S/3800, META S/3500, Furious S/2300, FOX40 S/3500, BoXXer Select S/2400, Bomber CR S/650. Una generación reciente de carbono no se iguala artificialmente a un cuadro antiguo de aluminio.

La corrección de precios afecta únicamente ofertas iniciales DEMO- con updated_by NULL y el importe de categoría original. Conserva cambios del administrador, promociones activas, stock, GLB, fotografías y montajes. DEMO- permanece como identificador técnico histórico estable; no es una etiqueta de precio.

## Referencias y límites

La búsqueda encontró productos nuevos en tiendas peruanas, por ejemplo [FOX38 en Kuranko](https://kuranko.pe/categoria-producto/ciclismo/?kk_cat=amortiguador&orderby=discount). Los [anuncios usados internacionales en soles](https://pe.ebay.com/b/Fox-Black-Bicycle-Forks-for-Mountain-Bike/177815/bn_113884946) no equivalen a transacciones locales ni incluyen necesariamente importación. No se encontró una muestra peruana verificable suficiente por modelo/estado para afirmar un precio exacto de mercado. La orientación a segunda mano proviene del usuario; los importes numéricos son una decisión inicial de catálogo, no una deducción estadística de esos enlaces.

## Validación

SQL transaccional verifica estado válido, rechazo de valores no admitidos y conservación del estado en resumen/pedido. Migración comprobada con rollback antes de aplicarla a Cloud. Capturas y comprobaciones responsive en models/local/validation/commerce-prices, ignorado por Git. Evidencia de la base comercial anterior en [13e](13e-evidencia-de-implementacion-comercial.md). Comiteado posteriormente por solicitud explícita; registro en [06h](06h-identidad-cumbre-y-paleta.md). Sin push.


Resultado verificado: build y524 pruebas correctas (dos prototipos omitidos); cinco recorridos comerciales de escritorio y cinco de móvil emulado, con limpieza confirmada. Comprobación posterior de tipos y nueve pruebas del módulo tras el último ajuste de etiquetas. Seis anchos320/360/393/420/768/1440 sin desbordamiento horizontal del catálogo.

Cloud:38 migraciones/23 tablas;140 ofertas/689 vínculos,70 modelos/782 variantes/780 recursos/4 prearmadas, cero fixtures. Las89 ofertas de cuadros/suspensión tienen estado used:30 cuadros entre S/2200–7500,21 horquillas S/1500–3800 y38 shocks S/650–1800. Las140 filas de stock conservaron sus12 unidades de ejemplo; no se inventó una inspección o disponibilidad física por unidad.
