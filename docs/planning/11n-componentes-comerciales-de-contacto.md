# Componentes comerciales de contacto

## Alcance aprobado y fuente

El usuario autorizó añadir modelos comerciales con fotografía y representación 3D, conservando los auxiliares ATLAS y los montajes anteriores. Esta ampliación contiene seis modelos y una variante documentada por modelo: dos manillares, dos potencias, una tija y un sillín. No sustituye el catálogo v7 ni las cuatro composiciones existentes.

Fuente de ingesta: [`cockpit-reviewed.json`](../../supabase/catalog/cockpit-reviewed.json). Las fichas oficiales se consultaron el **21 de octubre de 2026**. Se conserva una selección acotada, sin atribuir un año comercial que las fuentes no declaran y sin precios inventados: todos los `price_reference` permanecen `null`.

```text
Ficha y foto oficiales → variante concreta → recurso nuevo v8
                                           ↓
                         catálogo + selección + montaje guardado

Auxiliares ATLAS y recursos v1–v7 → se conservan con su identidad
```

## Variantes y medidas verificadas

| Modelo | Única variante de esta ampliación | Medidas declaradas | Fuente oficial |
| --- | --- | --- | --- |
| Renthal Fatbar 35 | AluGold, elevación de 30 mm; M158-02-007-01 | Ancho 800 mm; abrazadera 35 mm; retroceso 7°; ángulo vertical 5°; 305 g | [Ficha Fatbar35 30 mm](https://renthal.com/products/fatbar35-30mm) |
| DEITY Racepoint 35 | Negro con gráficos blancos, elevación de 38 mm | Ancho 810 mm; abrazadera 35 mm; retroceso 9°; ángulo vertical 5°; 330 g | [Ficha Racepoint 38 mm](https://www.deitycomponents.com/racepoint_handlebar_38mm.html) |
| Renthal Apex 35 V2 | Negro/negro, 40 mm; STM127-01-005-01 | Abrazadera de manillar 35 mm; dirección 28,6 mm; ángulo 5°; 140 g con tornillos | [Ficha Apex35 40 mm V2](https://renthal.com/products/apex35-33mm-v2-stem-copy) |
| Renthal Integra 35 | Negro/AluGold, 45 mm y elevación +10 mm; STM114-BKAG | Abrazadera 35 mm; interfaz Boxxer/Fox IS; 159 g con tornillos | [Ficha Integra35 45 mm +10](https://renthal.com/products/integra35-45mm-10-rise) |
| OneUp V3 Dropper Post | Negro, diámetro 31,6 mm y recorrido 180 mm; 1C0980 | Longitud total 489 mm; inserción mínima 115 mm; 498 g | [Ficha V3](https://www.oneupcomponents.com/products/dropper-post-v3) y [tabla dimensional actual](https://cdn.shopify.com/s/files/1/0284/9430/files/OneUp-Components_V3Dropper_Dimensions_7cb2ae5d-7c9d-4126-84f5-1dca09837b58.jpg?v=1788561380) |
| WTB Volt Fusion Form | Medium Titanium negro; W065-0671 | Ancho 142 mm; longitud 265 mm; raíles de titanio; 225 g | [Tabla de variantes Volt](https://www.wtb.com/products/volt) |

La disponibilidad observada en la tienda no se convierte en inventario comercial propio. No se infiere que todos los colores, diámetros o recorridos de cada familia hayan sido ingeridos.

## Discrepancias y límites de interpretación

- **Apex V2:** la URL oficial conserva `33mm-v2-stem-copy`, pero el título, la longitud y la ficha seleccionada corresponden a **40 mm V2**. El SKU negro/negro se comprueba en el documento de producto de esa misma ficha; no se utiliza el SKU de AluGold/negro. Se representa con +5°; poder invertir la potencia no crea una segunda variante comercial.
- **Integra:** +10 mm es una elevación, no un ángulo. Por ello no se inventa `angle_deg`. La ficha identifica Boxxer/Fox IS, sin garantizar cualquier pletina de cualquier generación. La anchura de abrazadera de 64 mm y la distribución de seis tornillos orientan la reconstrucción exterior.
- **OneUp:** la galería actual publica **489 mm** de longitud total para 180 mm. El enlace antiguo del apartado FAQ todavía muestra **480 mm**. Se prioriza la tabla actual, conservando ambas referencias para explicar la diferencia, sin mezclar sus cotas. `insertion_mm=115` representa **inserción mínima**, nunca profundidad máxima del cuadro ni altura de montaje sugerida. La altura extendida entre collar y raíles es 210 mm. El mando se vende por separado; no se incorpora un selector adicional ni se afirma que esté incluido.
- **WTB:** la variante elegida es Fusion Form Titanium **W065-0671**. No hereda el SKU W065-0585 del Volt Titanium anterior ni la masa de Stainless o Steel. La sección del raíl queda sin completar cuando no está explícita para este SKU. La fotografía corresponde al acabado y material elegidos.
- Los manillares conservan sus curvas observadas y cotas externas; se infieren las transiciones del tubo donde las fotos no las documentan. No se certifican espesores internos, esfuerzos, tolerancias o instalación física.

## Identidades y contrato visual

UUID deterministas mediante `scripts/lib/uuid.mjs`, namespace `df29e6ee-1845-5df4-80e7-c9f5ac4169c0`: `brand:<slug>`, `component:<slug>`, `variant-v8:cockpit:<slug>` y `asset-v8:cockpit:<slug>`. Los modelos y recursos nuevos no alteran las identidades ATLAS ni las versiones publicadas.

| Slug del modelo | Categoría | `manifest.parameters.profile_key` |
| --- | --- | --- |
| `renthal-fatbar-35` | `handlebar` | `renthal-fatbar-35` |
| `deity-racepoint-35` | `handlebar` | `deity-racepoint-35` |
| `renthal-apex-35-v2` | `stem` | `renthal-apex-35` |
| `renthal-integra-35` | `stem` | `renthal-integra-35` |
| `oneup-v3-dropper` | `seatpost` | `oneup-v3-dropper` |
| `wtb-volt` | `saddle` | `wtb-volt` |

Todos usan un recurso procedimental nuevo `atlas-bike-v8` y `representation=approximate`. Las fotos reales no convierten la geometría en CAD. Cada variante conserva solo el acabado comercial elegido, sin recoloreado libre. Las imágenes usan la clave explícita del slug; los archivos y su procedencia se gestionan junto al catálogo de fotografías.

Las potencias declaran `origin=stem_mount` y un anclaje local `bar_clamp`, en metros. Apex: `[0.04, 0.0235, 0]`, estimado a partir de longitud/altura/ángulo; Integra: `[0.045, 0.01, 0]`, posición nominal declarada por longitud y elevación. El ensamblaje v8 debe interpretarlos respecto al apoyo de dirección o pletina correspondiente, sin alterar el ensamblaje de las potencias antiguas. La cota Apex es una aproximación de posición del apoyo, no una medición CAD.

## Mantenimiento

OneUp V3 declara limpieza y engrase cada **120 horas** y servicio completo cada **350 horas** en su [ficha oficial](https://www.oneupcomponents.com/products/dropper-post-v3). Se documentan como referencias de la variante V3, sin agenda ni contadores. No se inventan intervalos para los otros cinco modelos.

## Trabajo y aceptación dentro de la fase de inventario

1. Validar el documento con el diccionario vigente y el reconocimiento de generador/perfiles v8; no aplicar la fuente antes de esa integración.
2. Preparar las seis fotografías locales de las variantes correctas y registrar sus URL, dimensiones y procedencia. Revisar que foto y ficha no mezclen generaciones o materiales.
3. Implementar los seis perfiles, continuidad del montaje y anclajes de manillar/potencia. Verificar que los auxiliares anteriores siguen reproduciendo los montajes guardados.
4. Ejecutar ingesta transaccional en Cloud después de conservar fuente y migración de soporte v8 en el repositorio. No archivar automáticamente variantes antiguas ni modificar prearmadas existentes.
5. Comprobar lectura pública, categoría, acabado, fotografía, selección 3D, guardado y reapertura de cada variante; contrastar siluetas con las referencias oficiales. Registrar evidencia y limitaciones en el estado de implementación.

La fuente preparada no demuestra por sí sola publicación, fotografía integrada o aceptación visual. La aceptación requiere esas comprobaciones y no permite declarar un parecido del 90 % ni compatibilidad mecánica certificada.

## Registro de fotografías de referencia

Los siguientes hashes corresponden a los archivos originales descargados de los fabricantes, antes de recorte, separación del fondo o conversión a WebP. Permiten identificar la referencia investigada; no son los hashes de los recursos finales. Cada fotografía tiene también una entrada de procedencia en `sources` de la fuente de ingesta.

| Variante | Imagen oficial | SHA-256 del original |
| --- | --- | --- |
| Renthal Fatbar35 | [Original](https://cdn.shopify.com/s/files/1/0999/9496/0221/files/M158-02-007_01.jpg?v=1779429503) | `1e72ec97e98fe6f3f8cc6aadf7eb1973c8738ead9a5e1d00dd7c26c296640a3f` |
| DEITY Racepoint35 | [Original](https://www.deitycomponents.com/uploads/1/6/0/8/16089364/7-deity-racepoint-handlebar-38r-white_orig.jpg) | `9b7a3b3676505fec318d04993f5faa8cfa94a99ab074db9675bf90b28a2243a5` |
| Renthal APEX35 V2 | [Original](https://cdn.shopify.com/s/files/1/0999/9496/0221/files/STM127-01.jpg?v=1784796860) | `48bf3008efdee47418f557594795032f513c796136aef6345835f6147750d571` |
| Renthal INTEGRA35 | [Original](https://cdn.shopify.com/s/files/1/0999/9496/0221/files/STM114.jpg?v=1786358732) | `5f338e5b5ca91392519508904823f1105abd0c9a7c00738ad047d148901f0c2f` |
| OneUp V3 Dropper Post | [Original](https://cdn.shopify.com/s/files/1/0284/9430/products/OneUp-Components_V3Dropper_180Extended.jpg?v=1763513155) | `f4e6e0f4cbbf6a6ade3d65c6d94e5289a5c8f7c21c3f9a5326050fae5e4f4716` |
| WTB Volt Medium Fusion Form Titanium | [Original](https://cdn.shopify.com/s/files/1/0202/9884/files/Volt_Medium_Titanium_ISO_Web.png?v=1785927657) | `85322d1d6bb9f21ea98fae606aecd29436f3405787a64531b021860601cd6730` |

La foto Apex se registra en la investigación como `renthal-apex-35`, mientras que el modelo y su clave de imagen en la fuente son `renthal-apex-35-v2`; el resolver debe vincular esa clave a la fotografía V2, sin recurrir al modelo V1. En Fatbar, Apex e Integra se retiran el fondo de estudio y el reflejo inferior; la repetición reflejada no se interpreta como una segunda pieza del producto.

## Publicación y evidencia · 21/10/2026

Migración 021 aplicada e ingesta de `cockpit-reviewed.json` completada en el Supabase Cloud existente. Total verificado: **59 modelos, 120 elecciones seleccionables, 612 variantes y 610 recursos históricos**; cuatro prearmadas con 92 posiciones. `scripts/validate-cockpit-publication.mjs` pasó sus doce comprobaciones de lectura: seis nuevas variantes accesibles públicamente y datos/manifiestos coincidentes con la fuente; los 606 IDs anteriores y los 604 recursos originales conservan enlaces, generador, rutas y manifiestos; las 128 capturas v7 mantienen su estado de publicación.

Geometrías v8 congeladas tras publicar. Once pruebas específicas cubren los seis modelos, proporciones, contacto bilateral entre manillares de 35 mm y abrazaderas y los soportes/tornillos APEX con controles negativos. El diagnóstico del APEX sobre triángulos comprobó ocho puntos de pertenencia/contacto; una captura anterior al soporte definitivo se descartó como evidencia del estado publicado. No se alteraron recursos publicados ni hizo falta otra versión correctiva.

Build y **89 pruebas unitarias de 26 archivos** correctos. Revisión visual interna: seis modelos en cuatro cámaras, sin errores; fixture `/tests/fixtures/cockpit-review.html`, excluida del build de producto. Fotografías comerciales recortadas, WTB y SCOTT con fuentes verificadas y renders propios para genéricos; auditoría de las tres páginas públicas: **59 tarjetas con imagen decodificada y ninguna sin imagen**. La prueba de fotografías completa también pasó. Procedencia y prompts en `src/assets/images/catalog/README.md`.

Validación funcional remota con cuentas temporales: dos pruebas en escritorio y dos Pixel 7 emulado, ambas plataformas correctas. Se eligen las seis familias desde los controles reales, se guardan/reabren montajes enduro/DH de 23 posiciones y se confirma contra el servidor la identidad exacta de las variantes; miniaturas de 640 px, visor activo y sin errores. El runner elimina las imágenes y cuentas generadas. Comando: `node scripts/validate-configurator-performance.mjs desktop commercial` (o `mobile`).

Regresión adicional de catálogo y navegación: once pruebas de escritorio correctas. El primer intento del test comercial no se ejecutó por un import JSON sin atributo en Node 24; se corrigió leyendo la fixture desde archivo y se repitió la prueba real, sin contarlo como éxito previo. La emulación no certifica Android físico, 30 fps ni semejanza CAD/90 %. No se crearon commits ni se hizo push.
