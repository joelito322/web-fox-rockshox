# atlas-motion-v1 · inspección exterior por recorrido

Perfiles locales y reglas puras de movimiento; no sustituyen los GLB publicados v1–v9. El visor normal y las miniaturas siguen consumiendo su postura de referencia. Al abrir Suspensión se crean instancias derivadas con superficies rígidas agrupadas por cuerpo; cerrarla restaura las transformaciones y libera la geometría propia. No se modifica ni se publica otro binario bajo una identidad existente.

`prepare-profiles.py` registra las referencias de cada uno de los quince cuadros en el espacio de su recurso/talla, y genera `src/features/configurator/model/suspension/profiles.json`. Sus regiones conservan los trazados por modelo; los pares A/C y B/D definen un mecanismo exterior cerrado C/D. Los ejes giran en el plano lateral, transversalmente al cuadro; no se escala el triángulo rígido.

**Todos los perfiles son estimados.** El mecanismo de cuatro cuerpos es una guía reducida del exterior, incluidas SUPREME HVCS y Ransom de seis barras: no reconstruye los elementos internos ni sus curvas de fabricante. El registro afín de fotografías y las uniones exteriores previas no proporcionan todos los pivotes reales. Las asignaciones de ojos del amortiguador y las coordenadas auxiliares inferidas están en la fuente. No llamar a esta capa un solver exacto de VPP, HVCS o seis barras.

El recorrido máximo se calcula por talla y combinación: cierre de los enlaces, giro máximo del perfil, carrera seleccionada de amortiguador y desplazamiento de rueda. Algunos perfiles tienen un intervalo pequeño por la información/representación disponible. El porcentaje controla ese **intervalo visual**, no prueba agotar los milímetros comerciales de recorrido. Se toleran hasta 4 mm de diferencia visual de longitud en el límite al registrar recursos aproximados; no representa extensión física permitida de un amortiguador. No se calcula sag, peso, presión, progresividad, cargas, resistencia o ausencia de interferencias.

La separación de superficies conectadas es de instancia y conserva los buffers originales; la asignación se compara con los contornos registrados y enlaces del modelo. Geometría compartida y materiales de otros montajes no se disponen ni se repintan. Horquillas separan coronas/barras de botellas/puente; amortiguadores separan cuerpo, vástago/ojo y resorte cuando corresponde. El resorte puede acortarse axialmente; tubos rígidos, ruedas y depósitos mantienen sus dimensiones. La cadena/latiguillos se adaptan visualmente, sin simulación de tensión; el mando asociado al cambio permanece en el manillar.

Fuentes del mecanismo real se enlazan en [05c](../../docs/planning/05c-movimiento-suspension.md); los contornos de referencia en v5/v6/v9 permanecen intactos. Las decisiones de ingeniería que esas fuentes no permiten demostrar siguen siendo aproximaciones explícitas.

Revisión interna, excluida del build de producto:

```sh
python models/motion-v1/prepare-profiles.py
node scripts/review-suspension-motion.mjs --all
node scripts/validate-configurator-performance.mjs desktop motion
node scripts/validate-configurator-performance.mjs mobile motion
```

`/tests/fixtures/suspension-review.html` permite cuadro, horquilla, amortiguador y cámara. Los informes/capturas se generan en `/tmp/atlas-motion-review`, no se ingieren como medidas comerciales. Una prueba de cierre de articulaciones matemáticas no certifica continuidad de todas las superficies del recurso ni exactitud con respecto a fabricación.

Los porcentajes de la UI preparan la siguiente reproducción y mantienen reposo hasta pulsar Reproducir. El muelle se comprime según su geometría real entre apoyos (sin tomar la distancia entre ojos como longitud del resorte); depósito y carcasa permanecen rígidos. La herramienta interna conserva la captura explícita de posturas para revisión.
