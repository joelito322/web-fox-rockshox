# 06g · Compatibilidad visible durante el armado

Ampliación autorizada el27/10/2026. Complementa06e y las reglas de03/05, manteniendo la selección visual libre. Ningún aviso bloquea selección, guardado o reapertura; no certifica seguridad ni ajuste mecánico.

## Composición aprobada

```text
Mis bicicletas        Nombre del montaje              Guardar
⚠ 2 incompatibilidades · 1 dato por confirmar      Ver detalles
Piezas del montaje │ Visor 3D │ Selección de componentes
```

Barra global bajo acciones, ámbar tenue ante conflictos, neutra ante información incompleta y sin animaciones continuas. Contador accesible sin mover foco ni abrir automáticamente. En móvil ajusta líneas sin desbordamiento. Índice muestra indicador discreto por pieza afectada. Un único Drawer derecho de compatibilidad, con secciones Incompatibilidades/Datos por confirmar, medidas disponibles, referencia documental y acciones Cambiar pieza que cierran el panel y seleccionan la posición correspondiente. Estado vacío distingue montaje vacío de ausencia de incompatibilidades detectadas; no mostrar un certificado verde de compatibilidad.

## Reglas y fuentes

Reutilizar warnings puro existente. Añadir posiciones afectadas, valores comparados y referencias cuando estén disponibles, sin duplicar validadores ni consultar por cada interacción. Identificar aro/neumático por BSD y mostrar nombre comercial/medida comprensible. Una pieza no seleccionada es montaje incompleto, no incompatibilidad automática. Si ambas están elegidas pero falta una medida necesaria, indicar dato por confirmar.

Recorrido de horquilla y altura eje-corona se comprueban por separado. Solo evaluar extremos explícitos documentados; límites inclusivos y comprobación unilateral si únicamente existe máximo/mínimo. No deducir un límite desde la geometría, recorrido trasero, carrera del amortiguador, foto o longitud recomendada. Reglas documentales acotadas a identidad comercial, generación/año y tallas revisadas; fuente/fecha versionadas. No reescribir variantes, GLB ni montajes publicados. Datos existentes de restricciones permanecen como respaldo informativo cuando no hay límite numérico confirmado.

El registro documental frontend complementa las especificaciones ya publicadas sin mutarlas. No se presenta como un editor administrativo de límites: ampliar esa gestión requerirá su propio contrato de datos. El aviso global excluye la nota genérica de aproximación3D del contador, porque ya aparece en el visor.

## Validación de implementación

Pruebas de reglas: extremos, un solo límite, dato ausente, referencia distinta de máximo, modelo/generación ajenos, aro/neumático discordantes y conservación del montaje libre. UI: conteos separados, panel, selección por acción, cierre/foco, actualización al resolver/deshacer, teclado y móvil. Comprobar guardado/reapertura con conflicto en Cloud mediante fixture aislada y limpiar temporales. Compilación y regresiones pertinentes. Evidencia al final de este documento; sin commits salvo petición explícita.


## Registro de ejecución · 27/10/2026

Implementados Compatibility (barra persistente/panel con Drawer existente), marcas accesibles del índice y metadatos de posiciones/medidas en warnings. Se mantiene el esquema de guardado, las variantes, GLB y27 migraciones. Cálculo local sobre las piezas seleccionadas, sin lecturas adicionales por aviso. La medida de rueda del cuadro/horquilla se compara primero con el aro: un neumático discordante no se presenta como si fuera la medida del aro instalado.

Cobertura numérica documental de horquillas en `src/features/configurator/model/frame-fork-limits.json`, acotada por UUID comercial/slug/generación/año/talla M/L. Consultas oficiales del27/10/2026:

| Cuadro | Dato utilizado | Dato que no se convierte en límite |
| --- | --- | --- |
| Nomad7 MY27 | Recorrido admitido170–180mm | Altura588mm de referencia |
| META SX V5 | Altura máxima eje-corona598mm | Altura586mm recomendada |
| FRS V3 MY25 | Altura máxima eje-corona595mm | Altura581mm recomendada |
| SUPREME DH V5 | Altura máxima eje-corona620mm | Altura612mm recomendada |

Fuentes originales en el JSON y accesibles desde avisos concretos. Se verificó el contenido HTML de las fichas COMMENCAL aunque el lector web no expone todas sus pestañas. [Nomad](https://web.santacruzbicycles.com/pages/product-support/nomad-7-my27) publica explícitamente Fork Compatibility. No extender estos límites a otros modelos/tallas/generaciones. En los cuadros restantes se conserva su restricción textual como información por confirmar: esta entrega no afirma haber completado límites numéricos de los quince cuadros. No se convierte150–160mm recomendado del CHERRY en prohibición ni se inventan extremos de CAPRA/TUES/otros a partir de fotos o montajes de fábrica.

Validación: cuatro recorridos nuevos correctos en navegador (dos escritorio, dos Pixel7 emulado). Aro27,5/neumático29, medidas visibles, acción de selección y foco, corrección/deshacer, guardar con conflicto/reabrir, montaje vacío y Nomad con horquilla203mm. Tres regresiones existentes correctas: montaje enduro, frenos/discos y cambio de talla Nomad. Fotografías de comprobación inspeccionadas en `models/local/validation/compatibility/`, ignoradas. Cuentas y montajes temporales eliminados por runner. Un primer escenario cambió de selección antes de terminar la carga del cuadro; la prueba ahora espera su aplicación. Las regresiones adaptadas esperan el cierre real del diálogo antes de escribir en el fondo.

El observador de Vite excluye artefactos locales de validación/trazas para no recargar un editor abierto por escritura de HTML de pruebas. No afecta archivos publicados ni incorpora Docker. Frontend mediante pnpm/Vite local en5174. Sin commits ni push por esta ampliación.

Reproducción:

```bash
pnpm run build
pnpm exec vitest run --maxWorkers=2
node scripts/test-authenticated.mjs desktop '' compatibility
node scripts/test-authenticated.mjs mobile '' compatibility
node scripts/test-authenticated.mjs desktop 'reviewed enduro reference can|two- and four-piston|changing to a documented Nomad'
```

Emulación no certifica navegador Android físico; el panel y la fidelidad visual siguen abiertos a aceptación del usuario. Ningún resultado certifica seguridad o encaje mecánico.

Cierre: **514 pruebas unitarias correctas y dos prototipos omitidos, 78 archivos**; compilación correcta y bundle sin credenciales privilegiadas configuradas. `git diff --check` correcto. No se crearon commits.


## Diagnóstico inicial de scroll · retirado tras aclaración del usuario

El usuario señala el desplazamiento general de la página, no solo la cámara/visor. Reproducción en900px: el documento alcanzaba4049px (4273 con controles de suspensión) porque la fila automática del layout tomaba la altura de toda la lista de alternativas. La medición del visor era3626/3850px; la página completa crecía junto con él. No corregir ocultando el overflow del body: se perderían campos/acciones.

Corrección: fila central de altura acotada en distribución intermedia, min-height0 en paneles para permitir su scroll propio y contención de propagación del desplazamiento. En móvil el índice desplegado y el selector tienen máximos según viewport: las alternativas se desplazan dentro del panel, conservando la composición vertical aprobada y acceso a todas las piezas. En escritorio se mantiene una fila limitada por el área de trabajo. Sin cambios de cámara, modelos, datos ni guardado.

Regresión real `tests/browser/configurator-scroll.spec.ts`, ejecutable con `node scripts/test-authenticated.mjs desktop '' configurator-scroll`: doce combinaciones de seis anchos (1366/980/900/721/720/390) con suspensión abierta/cerrada. Muestrea altura de documento/visor en el tiempo, comprueba límites de la página general y verifica que el selector llega a su final mediante scroll interno. Evidencia local ignorada en models/local/validation/configurator-scroll, incluida medición previa. No confundir con FPS o dispositivo físico.

Resultado de límites del documento: doce combinaciones correctas; a900px pasa de4049/4273px a1073px con controles cerrados/abiertos. En móvil390px pasa de4434/4644px a1606/1816px. Alturas estables durante el muestreo, último elemento del selector accesible mediante scroll interno.

Tras la corrección de scroll, las dos regresiones móviles de compatibilidad/selección/guardado/reapertura pasan y la compilación final es correcta. Frontend local respondeHTTP200. Sin commits.


### Vacío después del footer · aclaración y reproducción exacta

El usuario aclaró que el defecto observado era un espacio vacío **después** de «ATLAS MTB / Enduro & Descenso / Diseña tu próximo montaje». La corrección de filas/paneles anterior no resolvía esa causa y su prueba de alturas estables no la detectaba: una página puede permanecer estable y aun contener espacio residual.

Nueva reproducción con discrepancia manillar/potencia (DEITY35 frente a potencia31,8), que activa indicadores en filas inferiores del índice. A1366px, footer termina en1021px pero documento mide1965px: **944px vacíos posteriores**. Las dos etiquetas accesibles `.assembly-warning-label` tenían offsetParent BODY y quedaban en1885/1964px, fuera de la zona desplazable del índice. Su posición absoluta escapaba porque el icono no establecía un bloque contenedor.

Corrección concreta: `.assembly-warning` tiene position:relative y su etiqueta invisible se ancla en inset0 dentro del icono. Se conservan textos para lectores de pantalla; no ocultar contenido del body, no eliminar footer ni fijar arbitrariamente su posición. La prueba configurator-scroll ahora fuerza esta incompatibilidad inferior y compara scrollHeight con el extremo real del footer en doce combinaciones. También registra los elementos absolutos que sobrepasen ese extremo. Evidencia previa en footer-before.json dentro del archivo local ignorado.


### Resolución vigente: final automático según contenido

Por instrucción explícita del usuario se retiraron las restricciones adicionales de altura de filas/paneles del primer intento. La corrección vigente solo ancla las etiquetas invisibles a sus iconos; el footer sigue el flujo normal y el documento termina según el contenido visible. No hay un tope de altura de página, recorte de944px, posición fija del footer o JS que fuerce scrollHeight. Las dimensiones preexistentes del visor y sus breakpoints se conservan.

La prueba final elimina los topes absolutos de altura como criterio y exige que no haya área posterior al footer ni etiquetas absolutas escapadas. Además alarga los textos del footer y cambia ancho, verificando que la página crece con esas palabras sin dejar huecos. Los resultados de alturas limitadas de los apartados anteriores describen un intento retirado, no la solución final.

Verificación final automática correcta: doce combinaciones de ancho/suspensión sin espacio posterior al footer (diferencia0–0,43px por redondeo). Texto del footer ampliado dinámicamente en escritorio/intermedio/móvil conserva el final natural de la página. Tres pruebas UI de accesibilidad/avisos correctas y build comprobado. No se mantienen límites nuevos de altura para corregir el vacío.
