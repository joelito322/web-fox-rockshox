# Nomad 7 CC · revisión individual v22

Reconstrucción exterior **solo de Nomad 7 MY27 M/L**, sobre sus recursos v11. No es una adaptación de Force/Fury ni de Nomad 6. Los catorce cuadros restantes, incluido META v21, tienen sus 28 SHA protegidos en `protected-captures.json`.

## Anatomía y referencias

- Dos fotos oficiales de cuadro MY27 (mismo ángulo, dos acabados), doce archivos oficiales de detalle y cinco fotografías de piezas reales: enlaces superior/inferior, guía y protecciones. No son diecinueve perspectivas independientes.
- Siete despieces oficiales Nomad 7 (`Nomad_7C_Exp_View_1…7.png`), realmente abiertos: ambas caras del triángulo delantero, VPP superior/inferior, basculante, guía y Glovebox. Son dibujos técnicos, no fotografías ni CAD accesible.
- URLs y hashes en `references/sources.json`; ficha [Nomad Frame 2027](https://www.santacruzbicycles.com/products/nomad-frame-2027), [soporte Nomad 7](https://web.santacruzbicycles.com/pages/product-support/nomad-7-my27) y [colección Nomad](https://www.santacruzbicycles.com/collections/nomad). No se afirma inspección de un vídeo no descargado.

Perfil propio en `profile.json`: superior recto con transición local, diagonal recta con codo inferior amplio, sillín bifurcado para dejar paso central al amortiguador, arco trasero por pares, ventana inferior triangular abierta, dos enlaces VPP con puentes y taladros, puerta Glovebox y protectores unilaterales. Se usa registro fotográfico 1824×1368 (original 3200×2400) por pedalier/dirección/eje trasero; la perspectiva impide medir profundidades exactas.

**El inicio visible del muelle no es el ojo trasero.** El ojo se oculta detrás de las mejillas. Moverlo a la parte visible del cuerpo reduciría incorrectamente el entreojos a unos 153 mm; se conserva el anclaje histórico de 230 mm, completando el clevis oculto. El apoyo delantero es fijo y el trasero pertenece al enlace inferior. Las comprobaciones de paso central consideran la abertura entre mejillas, no un rayo que también atraviese sus caras externas.

La pintura se reconstruye completa. Los triángulos de enlaces y tornillería genéricos se sustituyen **solo dentro de la máscara local declarada**, preservando metal, protecciones y demás detalles fuera de ella. Secciones, profundidad, radios, elementos ocultos y tipografía son aproximaciones exteriores inferidas. No certificar 100 %, CAD, fabricación, cinemática completa, colisiones exhaustivas ni rendimiento Android físico.

## Excepción visual de tija

La comprobación adicional detectó diferencias de 8,83°/10,33° entre el eje heredado `seat_tube → saddle` y el último tramo fotografiado de M/L. Se corrige **solo `saddle` en las identidades nuevas v22**, manteniendo longitud de referencia y todos los demás anclajes. El GLB y el manifiesto coinciden; `anchor-corrections.json` registra ID anterior/nuevo y ambos valores. SQL permite exactamente ese cambio. Guardados y manifiestos v11 permanecen intactos. No se gira el tubo para acomodar la estimación antigua.

La abertura del pedalier también se comprobó contra **todas las mallas** desde z=+0,15 hasta z=−0,15, con centro y anillos de 6/12/18mm: 50 rayos, sin impactos. El aro gris visto en diagonal no constituye un tapón. Evidencia `passage-review.json`; eje de tija corregido a 0° en ambas tallas. La inspección corta original por sí sola no justificaba esta conclusión.

## Operación

1. `ATLAS_BASE_URL=http://127.0.0.1:5197 node scripts/prepare-frame-v22.mjs`: captura local sin Cloud.
2. Revisar `review-frame-v22-general.mjs --v22 --all`, `review-frame-v22-details.mjs`, `review-frame-v22-overlay.mjs`, `inspect-frame-v22.mjs`, `inspect-frame-v22-exports.mjs`, `inspect-frame-v22-preservation.mjs` y pruebas propias.
3. Tras congelar capturas: `prepare-frame-v22.mjs --apply` carga y relee GLB por SHA sin cambiar elecciones.
4. Tras publicar META v21: `validate-frame-v22.mjs --before`; `validate-frame-v22-transition.mjs --publish` publica solo las dos elecciones Nomad y comprueba guardados anteriores/nuevos con cuenta temporal y limpieza; `validate-frame-v22.mjs` comprueba el catálogo posterior.

Fuentes SQL en `supabase/operations/publish-frame-v22.sql`. Sin nueva migración, cambio comercial, Auth, IAM ni conversión de montajes privados/prearmadas. Una captura publicada es inmutable. Nueva corrección física exige identidad/versionado nuevo.

La fixture `/tests/fixtures/frame-v22-review.html?version=v22&view=lateral` es revisión interna de desarrollo y queda fuera del producto.

## Cierre coordinado

Publicado tras v21: carga/relectura SHA, transición de dos guardados anteriores/dos nuevos y limpieza de cuenta temporal correctas; auditoría `cloud-after.json`. Tres poses integradas sin errores de navegador. Tipos/build y suite conjunta de 303 pruebas correctos. Estado propio del snapshot: 70 modelos, 146 elecciones, 766 variantes/764 recursos históricos, cuatro prearmadas/92 posiciones, 22 migraciones/doce tablas propias. El snapshot más reciente es v24; validadores anteriores son históricos. No mutar capturas publicadas ni convertir montajes.
