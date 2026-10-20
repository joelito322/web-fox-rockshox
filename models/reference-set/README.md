# Conjunto de referencia aprobado

SUPREME DH V5, FOX 40 Factory MY27 y Bomber CR de 250 × 75 mm. El usuario aprobó este conjunto el 20/10/2026. La ampliación integrada en el catálogo está en [catalog-v5](../catalog-v5/README.md). Los tres archivos originales de esta comparación se conservan localmente como referencia; las capturas v1–v4 permanecen disponibles para sus montajes. No representa una composición de fábrica.

Abrir con el servidor Vite del repositorio: `/tests/fixtures/reference-review.html`. Hay referencia, modelo, superposición con opacidad y vista 3D por pieza/conjunto. La referencia de conjunto corresponde **solo al cuadro**; la horquilla se compara de frente y el amortiguador por separado de lado. No confundir el dibujo de geometría con una foto ortográfica calibrada ni el render con CAD.

## Fuentes y trabajo editable

| Recurso | Fuente y uso |
| --- | --- |
| Dibujo lateral del cuadro | [COMMENCAL Tech SUPREME DH V5](https://www.commencal.com/us/en/tech-supreme-dh-v5.html), sección Geometry. Imagen original en `references/supreme-lateral.jpg`, procedencia directa: `https://www.commencal.com/on/demandware.static/-/Library-Sites-commencal-shared-library/default/dw32b85da4/images/geometry/supreme-dh-v5-geometry.jpg`. Consultada 20/10/2026. No trasladar a V5.2 o XS. |
| Foto oblicua del cuadro | `src/assets/images/catalog/supreme-dh-v5.jpg`, usada para distinguir volumen de tubos, bifurcación, carcasa y bieletas. No se utiliza como regla de escala. |
| Vídeo de montaje V5 | [Unboxing and assembly](https://www.youtube.com/watch?v=b1QRFCJ6IRI). Inspección de contacto de 0 a 440 s a intervalos de 40 s y fotograma detallado **05:20**: unión superior, placa negra de suspensión, posición del amortiguador y dirección. **04:40** está parcialmente tapado y muestra otro cuadro en el fondo: descartado como referencia geométrica. El vídeo lleva suspensión Öhlins, por lo que no valida FOX/Bomber ni disponibilidad actual. Fotogramas de trabajo temporales, vídeo sin copiar al repositorio. |
| FOX 40 MY27 | [Producto FOX](https://ridefox.com/products/my27-fox-40-factory), foto frontal local `fox-40-my27-black.png`; fuente ampliada y procedencia en `src/assets/images/catalog/photos.json`. La separación de barras y el puente se contrastan con esa foto; no con otra generación. |
| Vídeo FOX 40 | [FOX 40](https://www.youtube.com/watch?v=ZrFBbpLDbM0), enlazado desde [FOX 40](https://ridefox.com/pages/fox-40). Contacto inspeccionado 0,12,…132 s: 01:00 muestra ajuste superior; 02:12 muestra la horquilla sostenida en oblicuo. Cortes internos de 00:36/01:36 no se usan para el contorno exterior. |
| Bomber CR | [Marzocchi](https://bike.marzocchi.com/products/bomber-cr-rear-shock), foto lateral local `marzocchi-bomber-cr.webp`; depósito paralelo, unión superior asimétrica, muelle, casquillos y mando inferior. Procedencia en `photos.json`. |

`supreme-v5-trace.json` guarda contornos y puntos en píxeles, escala, espesores estimados y limitaciones. `build.py` construye piezas distintas, perforaciones y superficies editables; `reference-set.blend` conserva objetos/modificadores independientes. Los GLB evaluados de `exports/` agrupan por material para reducir llamadas de dibujo y contienen puntos `mount_*` en metros. Estos nombres sirven para revisar los montajes; todavía no constituyen un contrato publicado en la base.

```sh
/path/to/blender --background --python models/reference-set/build.py
pnpm run test
pnpm exec playwright test tests/browser/reference-review.spec.ts --workers=1
```

Blender 4.5.9 LTS descargado a un directorio temporal, archivo comprobado contra su SHA256 del mirror de Berkeley; no es dependencia del runtime ni se incluye el ejecutable en Git. Los tests usan el mismo GLTFLoader de Three que el visor. La reconstrucción conserva el contrato de unidades/orígenes; no se promete identidad binaria del archivo `.blend` entre plataformas.

## Calibración y límites

- Cuadro: origen pedalier, +X hacia delante, +Y hacia arriba y Z transversal. Escala uniforme 1006.578947 píxeles/metro inferida del dibujo y las cotas de la talla M; la fuente no identifica explícitamente la talla dibujada. El punto superior da aproximadamente 456 mm de alcance y 644 mm de altura frente a 456/649 mm de la ficha M: **residuo de altura cercano a 5 mm**, pendiente de una referencia de talla inequívoca. La superposición conserva este límite, sin deformar el dibujo para forzar coincidencia de cotas.
- La foto lateral determina contornos; los anchos y superficies ocultas siguen estimados. Faltan soldaduras, gráficos, cableado y detalle de los ajustes. La placa de suspensión se representa por fuera; no se simula su cinemática.
- Horquilla: origen eje de dirección en pletina inferior; +Y hacia el tubo de dirección, +X hacia el offset. Barras de 40 mm y separación de centros estimada de 156 mm para dejar espacio al buje de 110 mm. Offset 52 mm y distancia axial provisional 602 mm: no se ha documentado una cota de instalación específica MY27, **no certificada como medida comercial**. La referencia frontal se calibra de forma aproximada a 650 px/m; el puente tiene contorno propio trazado.
- Amortiguador: ojo superior en origen; ojo inferior en Y = −250 mm. El entreojos es el de la variante elegida; foto de familia sin escala física certificada para ese entreojos. Muelles, depósito y espesores exteriores aproximados. El ojo inferior del conjunto se sitúa a 250 mm siguiendo la línea de los puntos del cuadro; no se fuerza longitud distinta para alcanzar un punto estimado.
- En el modo 3D se muestran los volúmenes reales de las mallas, con rotación. El parecido de lateral no prueba fidelidad desde todos los ángulos ni un 90 % global. El usuario aprobó el conjunto para extender el método; esa aprobación no acredita un porcentaje de parecido del resto del inventario.

## Aceptación técnica

`exports/report.json` registra pesos, triángulos y mallas evaluadas. `exports.test.ts` comprueba exportación con GLTFLoader, unidades, orígenes, distancias, volumen, valores finitos y presupuesto. La prueba de navegador comprueba controles, encuadre y ausencia de desbordamiento en escritorio/móvil emulado; no certifica Android físico, precisión de fabricación o parecido visual.

La integración posterior de espacios de montaje, manifiestos y recursos nuevos, pinturas, selección y conservación de montajes se encuentra en [catalog-v5](../catalog-v5/README.md). Estos tres archivos de comparación no se presentan por sí solos como cobertura de los 53 modelos.
