# Reconstrucción exterior del inventario · v5

El usuario aprobó el conjunto SUPREME/FOX 40/Bomber CR y autorizó extender el método. Esta entrega conserva todos los recursos publicados anteriores y está publicada en Supabase Cloud para los 53 modelos/128 variantes, con 114 elecciones públicas seleccionables. La aprobación del conjunto no implica precisión CAD ni aceptación automática del parecido de cada modelo.

## Fuentes y reconstrucción

- `traces/`: ocho trazados independientes de cuadros. Cada archivo guarda fuente, puntos de anclaje visibles, contornos por pieza, profundidad estimada y límites. Se distinguen triángulos, yokes, bieletas, guardas y carcasa integrada. No se asigna el perfil de SUPREME a otro cuadro.
- `references/`: fotografías de los seis cuadros con referencia de catálogo, más página de geometría SCOTT. El SUPREME conserva el dibujo del conjunto aprobado. Fotos y procedencia original en `src/assets/images/catalog/photos.json`; manual SCOTT `https://static.scott-sports.com/image/upload/v1778094871/2118622.pdf`, página 3. El manual es evidencia de plataforma, no una afirmación de año de comercialización para el artículo actual 427727.
- `suspension-profiles.json` y `suspension.py`: cinco horquillas y cuatro amortiguadores con puentes, pletinas, diámetros, depósito, aire/muelle y anclajes distintos. Referencias de producto en `photos.json` y las cinco ingestas comerciales. El conjunto aprobado conserva sus fuentes audiovisuales en `../reference-set/README.md`; no se declara haber inspeccionado vídeos de los otros modelos.
- `build.py`: reconstruye 76 capturas GLB por talla/medida (74 binarios distintos) y archivos Blender editables. Las operaciones de malla compartidas están en `../blender_geometry.py`; ningún ejecutable Blender se incluye en el frontend.
- `exports/manifest.json`: archivo, perfil, nodos pintables, anclajes, peso y geometría de cada captura. Hay fuente Blender por talla de cuadro y un ejemplo editable por modelo de suspensión; todas las medidas restantes se regeneran desde especificaciones/perfiles, sin copiar decenas de fuentes idénticas.
- `uploads.json`: binarios con SHA256 y rutas inmutables en Storage. `scripts/prepare-visual-v5.mjs` produce las capturas, composiciones y correspondencia con v4. `scripts/upload-visual-v5.mjs --apply` carga y comprueba los binarios; no publica el catálogo.

```sh
/path/to/blender --background --python-exit-code 1 --python models/catalog-v5/build.py
node scripts/prepare-visual-v5.mjs
node scripts/upload-visual-v5.mjs --apply
node scripts/publish-visuals.mjs --version=v5
```

La última orden solo valida las fuentes sin `--apply`. Publicar requiere migración 016 aplicada, binarios cargados, comprobaciones locales y transición de montajes guardados. `node scripts/validate-visual-upgrade.mjs --version=v5 --publish` aplica realmente la publicación y comprueba persistencia anterior/nueva con una cuenta temporal que elimina al terminar. No usarlo como lectura.

## Ensamblaje

Los cuadros se registran con su alcance/altura y eje trasero documentados. Las fotos oblicuas requieren un registro afín: esto permite trabajar sus contornos, pero **no elimina la perspectiva ni determina las superficies ocultas**. Las tallas comparten el diseño de su propio modelo, ajustado por medidas comerciales; no se declaran planos específicos del fabricante para cada talla.

El cuadro aporta anclajes de montaje propios. La horquilla usa origen en la pletina inferior, eje local +Y y offset +X; el amortiguador usa ojo superior y longitud hacia −Y. El eje delantero se obtiene transformando la horquilla, sin estirarla para alcanzar un punto antiguo. Ambas ruedas se asientan mediante inclinación global. El Nomad invierte el depósito mediante la rotación de su anclaje; el META utiliza su conexión de yugo superior y SCOTT conserva el amortiguador en la envolvente integrada. No se simula cinemática ni se certifican holguras mecánicas.

El tubo de dirección exportado representa un corte visual de 160 mm para el montaje; no se presenta como longitud de entrega de la horquilla. Altura eje-corona/offset son los de la variante cuando están documentados y estimados cuando no lo están. Los espesores, pivotes, marcas de fundición, reservas de cable y acabados secundarios siguen siendo aproximados.

## Piezas paramétricas

`src/features/configurator/scene/generators/v5/` mantiene paramétricas las piezas que dependen del montaje y de dimensiones: frenos con canal abierto y pinzas por modelo; discos ventilados y brazos por familia; cambio/cage/clutch; bielas; pedales con huecos y pines; aros con radios cruzados y válvula; neumáticos con tacos separados y ranuras. Se conservan dientes, medidas y elecciones comerciales. Los patrones secundarios de dibujo son aproximaciones de las fotografías, sin digitalización industrial de cada taco.

Cassettes, cadenas, bujes y pedalieres reutilizan las operaciones dimensionales anteriores donde ya representaban las medidas y su función; no se anuncian como rediseños completos de sus superficies. Los auxiliares ATLAS siguen siendo genéricos declarados. El cambio de identidad de recurso permite mantener el montaje/renderer nuevo separado del historial, aunque una operación geométrica se reutilice.

## Revisión y límites

`/tests/fixtures/catalog-mesh-review.html` permite girar los 17 modelos principales desde archivos locales. En los ocho cuadros ofrece Referencia, Modelo, Superposición y 3D mediante registro afín de puntos observados; no es una rectificación ortográfica ni una comprobación CAD. Las suspensiones conservan la comparación fotográfica separada cuando no existe una referencia calibrada. `/tests/fixtures/scene-preview.html?generation=v5&discipline=enduro` y `discipline=downhill` prueban el ensamblaje real y recursos de Storage. Son entradas internas de desarrollo, fuera del build y de la navegación pública; el configurador de producto consume los recursos publicados por Supabase.

`node scripts/review-visuals.mjs --version=v5` revisa todas las variantes y cuatro cámaras por modelo; `--mobile --models-only` revisa un representante por modelo en emulación. Exportación/parseo no equivale a parecido validado, fluidez de Android físico o exactitud de fabricación. Evidencia y estado de publicación en `docs/planning/12b-evidencia-geometria.md`.
