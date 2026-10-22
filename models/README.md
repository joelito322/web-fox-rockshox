# Modelos finales y material de trabajo

Las imágenes que ve el usuario —fotografías reales de cards, catálogo y portada— pertenecen a `src/assets/images/` y **se versionan**. No moverlas a un archivo de investigación aunque se hayan utilizado también como referencia.

```text
src/assets/images/              Producto: fotos visibles en la web
models/
  catalog-vN/
    exports/*.glb               Producto: binarios finales publicados
    exports/manifest.json       Manifiesto de construcción cuando corresponde
    uploads.json                IDs, Storage, tamaños y SHA publicados
    *.ts, *.py, *.json          Fuentes, perfiles y contratos reproducibles
    references/*.json           Procedencia de referencias: URL y SHA
  product-index.json            Índice de GLB actuales e históricos publicados
  local-archive.json            Inventario de archivos archivados localmente
  local/                        Ignorado: no se pushea
    references/                 Fotografías, vídeos, PDF y planos de investigación
    validation/                 Resultados generados de validaciones
    captures/                   Capturas de revisión
    experiments/                Prototipos no publicados y archivos Blender
```

`product-index.json` clasifica **318 GLB publicados**:89 archivos del catálogo seleccionable actual y229 históricos. Los históricos también son producto: los montajes guardados mantienen sus identidades y pueden necesitarlos. No considerarlos pruebas sobrantes solo porque no aparecen en el selector. Tres GLB del conjunto experimental `reference-set` no están publicados y se archivan localmente, junto con sus archivos de Blender. Los archivos Python/TypeScript que construyen los modelos permanecen versionados.

## Qué se conserva en Git

- GLB publicados, incluso las versiones retiradas que siguen siendo históricas.
- Fotos reales e imágenes del producto dentro de `src/assets/images/`, incluidos los cards.
- Fuentes del frontend y de construcción, pruebas automatizadas y fixtures de navegador.
- Contratos, perfiles, coordenadas, manifiestos de publicación, tamaños/SHA, procedencia URL/SHA, SQL y fuentes de catálogo. No confundir un manifiesto con un resultado de test.

Los antiguos `catalog-v5/exports/report.json` y `catalog-v6/exports/report.json` contienen contratos de construcción utilizados por la publicación y las pruebas: se renombran a `manifest.json` y permanecen en Git. Los resultados de las pruebas, en cambio, se archivan.

## Qué permanece solo en local

Fotografías/planos/vídeos descargados para investigar, resultados JSON de validación, capturas y prototipos no publicados. Archivar significa **conservar el archivo en disco**, no borrar el recurso. `.gitignore` evita incorporarlo a nuevos commits; los archivos ya versionados quedan como bajas sin preparar, sin reescribir commits anteriores. La herramienta no modifica el staging ni crea commits.

```sh
node scripts/archive-model-artifacts.mjs          # revisar clasificación y tamaño
node scripts/archive-model-artifacts.mjs --apply  # archivar sin modificar el staging
node scripts/index-product-models.mjs            # comprobar SHA e indexar GLB publicados
```

El archivo local es la ubicación canónica para trabajo nuevo. El inventario `local-archive.json` indica ubicación anterior, actual, categoría y SHA. Solo las rutas antiguas no versionadas pueden conservar enlaces simbólicos ignorados; las rutas antes versionadas quedan como bajas sin preparar. Las herramientas de investigación deben consultar la ubicación canónica del inventario. Esos enlaces **no se versionan** ni forman parte del frontend. Si una herramienta antigua genera un resultado en su ruta histórica, ejecutar el archivador para llevarlo al archivo local.

Un clon nuevo no incluye referencias ni resultados locales: puede compilar la aplicación y ejecutar las pruebas de producto con los GLB finales y las fotos de producto versionados. Las pruebas de perforaciones recalculan intersecciones sobre los binarios, sin importar un informe de validación anterior. Los dos tests del conjunto experimental se ejecutan únicamente cuando sus GLB locales están disponibles; la cobertura de los modelos publicados sigue siendo obligatoria. Para retomar investigación, recuperar los originales mediante las URL/SHA versionadas o desde una copia del archivo local; el archivo local no es una copia de seguridad remota.

## Nuevos modelos

1. Poner las descargas y los primeros prototipos en `models/local/` según su categoría; conservar URL/SHA y decisiones de diseño en las fuentes versionadas.
2. Construir una versión nueva sin modificar bytes de recursos ya publicados.
3. Guardar solamente el GLB final publicado en `models/catalog-vN/exports/`, con su manifiesto/ID/SHA y fuentes de publicación.
4. Mantener las fotos de card y demás imágenes que sí muestra la web en `src/assets/images/`.
5. Regenerar `product-index.json`, ejecutar validaciones y archivar sus salidas antes de preparar commits.

`.gitignore` no impide exponer archivos mediante un servidor si una herramienta los solicita: las vistas internas siguen fuera del build del producto. El frontend desplegado usa los recursos de Storage y sus imágenes importadas, sin empaquetar todo `models/`.
