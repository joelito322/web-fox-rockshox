# 13i · Auxiliares ATLAS con oferta de venta

El usuario confirmó convertir los cinco genéricos ATLAS actuales en artículos vendibles con precio y stock editable. Esta decisión sustituye su exclusión comercial anterior; no cambia los modelos ni añade certificación física.

| Artículo | Precio inicial PEN | Unidad |
| --- | ---: | --- |
| Manillar 31,8 × 780 mm | 80 | Unidad |
| Sillín 145 mm | 65 | Unidad |
| Tija fija 31,6 × 250 mm | 60 | Unidad |
| Tija fija 34,9 × 350 mm | 70 | Unidad |
| Potencia convencional 40 mm | 90 | Unidad |
| Potencia directa 40 mm | 160 | Unidad |

Seis SKU para cinco modelos, condición nueva, stock inicial de ejemplo de12 por oferta. Importes iniciales estimados y editables, no cotizaciones verificadas de un fabricante ATLAS ni evidencia de existencias físicas. Las referencias de productos comparables, sus diferencias y fecha están en `supabase/catalog/retail-price-review.json`; fuente específica en `atlas-commercial-offers.json`.

Migración042 amplía `_sales_identity` y `sales_admin_choices` solo para cinco slugs explícitos; no habilita todo producto visual futuro. Reutiliza ofertas, vínculos, políticas RLS, revisiones, editor de precio/stock, carrito y pedidos existentes. Sin tablas nuevas ni consultas adicionales. Se conservan modelos/medidas/GLB, promociones, pedidos y las140 ofertas previas.

Estado Cloud posterior:24 tablas/42 migraciones,70 modelos,146 ofertas y695 vínculos. Los nuevos artículos permiten completar comercialmente un montaje que utilizaba esos auxiliares. Las cotizaciones previas conservan sus importes; si cambia la selección o no coincide el conjunto, el flujo exige revisar de nuevo antes de crear pedido.

Validación: auditoría de precios actualizada para70 modelos/146 ofertas; regresión comercial transaccional general y prueba SQL específica de seis ofertas, lectura pública, edición administrativa de importe/stock y acabado inválido, todo con rollback. Snapshot de preservación confirma las140 ofertas previas byte a byte, variantes y recursos intactos. Prueba de navegador con cuenta efímera: seis precios, adición al carrito, resumen total S/525 y consulta del editor administrativo. Resultados/capturas en `models/local/validation/pricing/` y `models/local/validation/entregables/`, fuera de Git. No pedidos/pagos reales ni consumo de stock. Sin commits, push o despliegue del frontend.
