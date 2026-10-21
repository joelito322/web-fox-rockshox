# Continuidad exterior multivista

Revisión autorizada el 20/10/2026. El usuario pide completar zonas ocultas con criterio de construcción después de consultar fuentes adicionales; mantener modelos específicos por marca/generación. No se afirma haber agotado Internet ni alcanzar un porcentaje certificado.

## Qué cambia

- Ocho cuadros: contrapartes de bieletas, ejes que atraviesan apoyos, soportes de ambos ojos del amortiguador, raíces de yugos, punteras separadas, portapoleas y apoyos de freno solo en el lado correspondiente. El META recibe enlaces cortos al cuadro fijo; no queda el conjunto trasero flotando. El Ransom incorpora sus enlaces laterales exteriores y conserva oculta la suspensión integrada.
- Cinco horquillas: asiento de dirección y continuidad posterior de las coronas, conservando los puentes particulares de v5.
- Cuatro amortiguadores: transición continua entre vástago y ojo inferior, manteniendo los perfiles, depósitos y tipos de montaje de v5.
- Nueve frenos: v6 adelantó la pinza trasera; una comprobación posterior de sus superficies detectó que el filtro de geometría antigua también suprimía la nueva carcasa. La corrección se publica como **v7** y conserva v6. El argumento opcional de la operación compartida mantiene el resultado histórico por defecto; solo v7 termina la carcasa nueva después del filtrado. Pruebas geométricas comprueban las nueve familias y conservan la maneta/latiguillo superior.

Se conservan las medidas comerciales y los espacios de montaje v5. El catálogo final reúne GLB v6, nueve frenos v7 y las otras 43 capturas paramétricas v5, sin duplicar geometrías que no cambiaron. Los generadores y recursos v1–v6 siguen disponibles para montajes antiguos. Las actualizaciones posteriores requieren otra identidad.

## Fuentes y decisiones

[Referencias nuevas](references.md), contornos observados originales en `../catalog-v5/traces/`, y decisiones por modelo en `structure-profiles.json`. Las anchuras, espesores, cierres de caras ocultas y transiciones de montaje siguen siendo estimaciones. Los despieces muestran topología y pares de piezas; no proporcionan un escaneo o las superficies de fabricación. No duplicar por simetría patillas, poleas, protectores ni anclajes de freno.

`structure.py` construye los cierres específicos y evalúa contactos entre superficies trianguladas antes de agrupar materiales. Considera intersecciones, proximidad de hasta 2 mm y contención; **no es una prueba de resistencia, malla soldada, ausencia total de colisiones o cinemática**. Se mantienen cuerpos separados en pivotes y huecos funcionales. Las coronas nuevas y el cuello inferior no reemplazan la investigación de superficies de cada suspensión.

## Reconstrucción y comprobación

Blender 4.5.9 LTS, obtenido del sitio oficial y verificado mediante SHA256. No es una dependencia del frontend.

```sh
blender --background --python-exit-code 1 --python models/catalog-v6/build.py
blender --background --python-exit-code 1 --python models/catalog-v6/validate_structure.py
node scripts/prepare-visual-v6.mjs
node scripts/prepare-visual-v7.mjs
node scripts/upload-visual-v5.mjs --version=v6
node scripts/review-multiview-meshes.mjs --version=v6
```

Los nombres históricos de los scripts de Storage no fijan la versión cuando se pasa `--version=v6`. Sin `--apply` solo verifican fuentes locales. La publicación necesita las migraciones 017/018 y carga previa de binarios. Reposición: cinco fuentes históricas → v3 → v4 → v5 → v6 → v7; ejecutar publicaciones con versión explícita. No republicar generaciones anteriores después de la última.

Las transiciones `node scripts/validate-visual-upgrade.mjs --version=v6 --publish` y `--version=v7 --publish` hacen escrituras reales, comprueban persistencia de montajes anteriores/nuevos y eliminan sus cuentas temporales. No son validaciones de solo lectura.

Los GLB publicados son inmutables. No volver a regenerarlos y reemplazarlos con la misma identidad. Las escenas Blender y el informe conservan el método editable; `uploads.json` fija tamaño, SHA256 y ruta remota de cada captura.

## Revisión interna

`/tests/fixtures/catalog-mesh-review.html?generation=v6` usa archivos locales. `camera=right|left|front|top|bottom|diagonal|opposite` permite revisar siete direcciones. Las superposiciones conservan el registro afín de la fotografía original, sin convertirla en plano ortográfico. La herramienta queda fuera del build de producto.

`/tests/fixtures/scene-preview.html?generation=v7&discipline=enduro` usa las capturas finales y GLB reales de Storage. La aplicación normal consume ese mismo catálogo publicado. Exportación, conectividad y renderizado no equivalen a aceptación de parecido, CAD ni Android físico. Evidencia y límites en `docs/planning/12c-evidencia-continuidad.md`.
