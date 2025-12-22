# Repository Guidelines

## Resumen actual del proyecto
Este repositorio ya tiene un arranque con Vite + React + TypeScript. La pagina principal muestra el catalogo de suspension MTB por marca y modelos, con secciones de contenido, filtros visuales y tarjetas con imagenes. Existe una pagina de detalle por modelo con especificaciones completas, y un logo propio de Atlas MTB en SVG.

## Estructura del proyecto
- `src/pages/`: paginas principales.
  - `Home.tsx`: landing + catalogo, ventanas funcionales, galeria de modelos.
  - `ModelDetail.tsx`: ficha completa por modelo.
- `src/data/`: datos del catalogo y mapeo de imagenes.
  - `suspension.ts`: marcas, modelos, y especificaciones.
  - `images.ts`: asociacion `Marca|Modelo` -> imagen.
- `src/assets/images/`: imagenes reales de modelos.
- `src/assets/atlas-mtb.svg`: logo principal.
- `src/utils/routing.ts`: helpers de slug y hash routing.

## Navegacion y rutas
Se usa hash routing simple: `#/modelo/<slug>` para ver la ficha de un modelo. El estado se actualiza en tiempo real con el evento `hashchange` (no requiere F5). Cada modelo genera su slug desde `Marca + Modelo`.

## Contenido y idioma
Todo el texto descriptivo esta en espanol. Nombres de marcas y modelos permanecen en ingles. Las imagenes se conectan por la clave `Marca|Modelo`.

## Estilos y branding
El estilo visual se concentra en `src/index.css`. Hay un logo SVG con paleta roja industrial y efecto hover en el header.

## Comandos
- `npm install`: instala dependencias.
- `npm run dev`: levanta el entorno local.
- `npm run build`: genera build de produccion.
- `npm run preview`: previsualiza el build.

## Flujo recomendado
Para agregar modelos nuevos, actualiza `src/data/suspension.ts` y asigna su imagen en `src/data/images.ts` con un archivo en `src/assets/images/`. Para crear nuevas paginas, agrega un archivo en `src/pages/` y luego integra la navegacion correspondiente.
