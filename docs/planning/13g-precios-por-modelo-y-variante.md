# 13g · Corrección de precios por producto

Petición: evitar que marcas/modelos distintos tengan el mismo importe por el solo hecho de pertenecer a una familia. Se detectaron51 ofertas fuera de cuadros/suspensión que conservaban precios iniciales por categoría. Se revisaron los65 modelos vendibles y sus140 ofertas; los cinco modelos genéricos ATLAS siguen sin oferta.

## Fuente de verdad y método

[retail-price-review.json](../../supabase/catalog/retail-price-review.json) registra importe en centavos por oferta estable, modelo, unidad de venta, estado y precio anterior esperado. Incluye perfiles por modelo y excepciones por medidas cuando corresponden. El precio en ejecución sigue perteneciendo a store_offers; este documento/JSON no añade una segunda consulta ni calcula precios en el navegador.

Cada referencia identifica URL, fecha de consulta, observación y, cuando se capturó, importe/moneda. Clasificación explícita:

- local_listing:8 ofertas con precio de un anuncio local comparable en modelo/configuración/unidad.
- adapted_listing:17 ofertas estimadas desde anuncios locales con diferencias de configuración o reparto de un kit.
- international_reference_estimate:2 ofertas con referencia internacional y precio PEN estimado; no equivalen a una conversión cambiaria actual verificada.
- model_estimate:24 ofertas sin cotización local exacta; estimación identificada por producto.
- used_estimate:89 ofertas de cuadros/horquillas/shocks que conservan la estimación de segunda mano de13f. No se inventó una inspección, año de uso o historial de mantenimiento.

Son precios propios iniciales de ATLAS; los anuncios no prueban disponibilidad física de ATLAS ni una transacción efectuada. No presentar todas las140 ofertas como «precio real verificado en Perú». Los importes sin evidencia exacta siguen pendientes de la validación comercial del propietario.

## Diferencias corregidas

| Producto | Anterior | Revisado PEN | Criterio |
| --- | --- | --- | --- |
| Shimano SLX M7100 completo individual | 900 | 580 | Anuncio individual de BikePeruShop |
| Shimano SLX M7120 individual | 900 | 675 | Estimación de kit1350 / dos frenos, no anuncio individual |
| Magura MT5 / MT7 PRO individual | 900 / 900 | 425 / 800 | Reparto estimado de kits850/1600 |
| SRAM Maven Bronze / Silver / Ultimate B1 | 900 cada uno | 990 /1150 /1320 | Gamas distintas, estimación; referencias de fabricante |
| DT Swiss350 delantero15x110 / trasero148 Micro Spline | 650 cada uno | 447 /980 | Anuncios locales separados |
| DT Swiss350 delantero20x110 / trasero157 XD | 650 cada uno | 495 /1050 | Estimaciones de configuraciones diferentes |
| Cadena Shimano SLX / SRAM PC1110 | 100 cada una | 200 /85 | Anuncio SLX / estimación PC1110 |
| Cassette SLX / XG795 DH | 550 cada uno | 485 /1250 | Anuncio SLX / estimación DH; no confundir GX Eagle |
| Renthal Fatbar35 / DEITY Racepoint35 | 300 cada uno | 449 /395 | Referencia comparable Fatbar / estimación Racepoint |
| ROCKBROS Nylon2017-12, pareja | 200 | 129.90 | Anuncio local |
| DT Swiss E59327.5 /29 | 400 cada uno | 220 /325 | Local27.5 / comparable29 con distinta perforación |
| CST BFT / Maxxis Assegai EXO+ / Michelin MS Racing Line | 220 cada uno | 125 /275 /345 | Versiones específicas; estimaciones con límites documentados |
| OneUp V3, solo tija | 500 | 1190 | Estimación del modelo; mando separado |

No se fuerzan importes únicos: colores, tallas, carreras o ruedas de un mismo producto pueden compartir precio si no existe una diferencia comercial justificada. Tampoco se usa el precio de una pinza sola para vender pinza+maneta+latiguillo, el de un juego para una unidad o el de un producto usado para su variante nueva.

## Aplicación y conservación

[039](../../supabase/migrations/20261028003900_model_specific_retail_prices.sql) modifica únicamente51 ofertas iniciales por ID/importe anterior/estado esperado y con updated_by NULL. Omite campañas activas y cambios manuales, conserva SKU, acabados, stock, vínculos GLB y todos los snapshots/pedidos/cotizaciones existentes. Incrementa revisión para invalidar resúmenes nuevos desactualizados; el precio aceptado anteriormente se conserva según el contrato comercial.

No se reescribió038 aplicada, ni se añadió tabla, API, capa de precios o librería. Estado esperado posterior:39 migraciones/23 tablas,140 ofertas/689 vínculos.

## Comprobaciones

SQL comercial probado con rollback incluyendo039 antes de aplicar a Cloud. [validate-catalog-prices.mjs](../../scripts/validate-catalog-prices.mjs) comprueba el contrato completo contra las ofertas reales y guarda evidencia local ignorada. Detecta faltantes/diferencias sin alterar la base; informa precios manuales/campañas preservados. validate-commerce-state comprueba limpieza, permisos y conservación del catálogo.

Fuentes principales: [SLX individual](https://bikeperushop.pe/product/freno-hidraulico-shimano-slx-m7100-derecho/), [SLX kit](https://bixci.com/producto/kit-de-frenos-hidraulicos-shimano-slx-br-m7120-4-pistones/), [Magura kits](https://bikestoreperu.com/), [maza delantera](https://www.labicicleteria.pe/collections/dt-swiss-lima-peru/products/masa-delantera-dt-swiss-350-classic-dbis-boost-asram), [maza trasera](https://kuranko.pe/producto/dtswiss-350-classic-posterior-6-agujeros-boost-12x148mm-micro-spline-32h/), [ROCKBROS](https://rockbros.pe/producto/pedal-de-nylon-rockbros-2017-12c/). Referencias restantes y diferencias en el JSON. Comiteado posteriormente por solicitud explícita; registro en [06h](06h-identidad-cumbre-y-paleta.md). Sin push.

Resultado:039 aplicada; auditoría140 ofertas/65 modelos sin diferencias ni filas omitidas, estado39 migraciones/23 tablas y cero fixtures. SQL comercial con rollback correcto. Navegador comprobó precios nuevos en frenos, mazas y neumáticos; capturas en models/local/validation/pricing. No hubo cambios de código de interfaz en esta revisión ni se repitieron suites geométricas ajenas a la modificación.
