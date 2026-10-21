# 06e · Armado por grupos e índice de piezas

Ampliación solicitada el 21/10/2026. Sustituye la navegación plana de 23 posiciones dentro de «Tu montaje» por un índice visible y selección agrupada, sin un asistente obligatorio. Conserva esquema de guardado, escena, avisos, versiones de recursos y montaje visual libre.

```text
┌ Índice del montaje ┬──────── Visor 3D ────────┬ Elegir piezas ─────────┐
│ Cuadro          ✓ │                         │ [Todas][29][27,5][Mixto]│
│ Suspensión      ✓ │                         │ Talla [Todas][M][L]     │
│                   │                         │ Cuadro · Suspensión    │
│ Ruedas          ½ │                         │ Ruedas · Frenos · …    │
│ Frenos          ✓ │                         │ [Aros] [Neumáticos]    │
│ Transmisión     … │                         │ ☑ Aplicar a ambos lados│
│ Contacto        … │                         │ [Delante] [Detrás]     │
│ Piezas instaladas │                         │ Alternativas           │
│ y pendientes     │                         │ Acabados / colores ●●● │
└───────────────────┴─────────────────────────┴────────────────────────┘
```

- Índice izquierdo agrupado: cuadro; suspensión (horquilla/amortiguador); ruedas (aros/neumáticos/bujes); frenos (frenos/discos); transmisión; contacto. Cada posición indica modelo instalado o pendiente; pulsar abre su selección. Es inventario actual, no historial ilimitado de versiones. Deshacer conserva el último cambio atómico.
- Panel derecho: seis grupos y subcategorías compactas; solo se presenta la categoría activa. Se muestran posición activa y ambas cuando hay selección vinculada. No duplicar títulos ni esconder las posiciones guardadas por un filtro.
- Tallas del cuadro: pestañas Todas/M/L, conservadas al cambiar de grupo. Filtran variantes y reinician la página junto con el filtro, sin sustituir el cuadro instalado. Todas conserva el acceso a otras tallas documentadas.
- Medidas: Todas, 29 pulgadas, 27,5 pulgadas y Mixto (29 delante/27,5 detrás). Filtran cuadros, horquillas, aros y neumáticos mediante datos documentados. No convierten medidas ni certifican compatibilidad. Cambiar filtro no modifica piezas. Otras categorías permanecen disponibles. Mantener Todas para históricos/otras medidas.
- Aplicar a ambos lados: activado inicialmente para aros, neumáticos, frenos y discos. No para bujes, que tienen interfaces específicas por posición. Desactivar permite cambios independientes. Activar no sobrescribe nada hasta elegir. Aplicación y retirada conjunta son atómicas y deshacibles.
- En Mixto, aros/neumáticos se resuelven como dos variantes del mismo producto y generación, con sus acabados permitidos, conservando características relevantes. Si no existe una contraparte inequívoca, conservar ambas piezas anteriores y mostrar aviso para elegir por separado. Nunca montar silenciosamente la misma medida en ambos lados ni otro producto por similitud.
- Acabados y colores: muestras directas con nombre accesible y selección visible. Color libre mediante código hexadecimal además de paleta rápida, conservando las restricciones de piezas habilitadas. Las acciones vinculadas deben respetar acabados permitidos en las dos variantes.
- Móvil: visor primero; índice plegable «Piezas del montaje» y panel debajo, sin tres columnas comprimidas ni un lateral superpuesto. Selección desde escena/índice sincronizada. Objetivos táctiles legibles, foco visible y movimiento reducido.

## Ejecución y aceptación

Trabajo de las fases de UI, reglas de montaje y validación de 08: reglas puras de agrupación/medidas/parejas, reutilización de QueryClient y carga de recursos por intención, integración del índice/panel/paletas, pruebas de medidas mixtas y fallo atómico, acabados, guardar/reabrir, deshacer y móvil. No descargar todo el catálogo ni añadir consultas al mover cámara/colorear. Contratos previos: [06b](06b-espacio-de-trabajo.md), [05](05-configurador-3d.md) y [12d](12d-rendimiento-consultas.md). Evidencia de implementación y comprobación en [12](12-estado-implementacion.md).

## Selección visual · ampliación solicitada

```text
Clic en pieza / índice / elección → resaltado con pulso suave
Clic en espacio vacío del visor   → sin resaltado; panel conserva contexto
Movimiento reducido              → resaltado fijo
Sin selección / pestaña oculta   → sin ciclo de pulso
```

La selección visual se separa del grupo/posición que edita el panel. Un clic vacío no quita piezas ni cambia filtros. Pulso lento, de baja amplitud y sin destellos; solo modifica la emisión de materiales propios de la selección, sin clonar geometrías, consultar datos ni actualizar React por cuadro. Excepción solicitada a la ausencia de animación continua: únicamente mientras haya pieza seleccionada y pestaña visible; vuelve al render por demanda al limpiar selección. Mantener materiales originales, pintura, sombras reutilizadas y miniaturas estáticas. Probar selección/limpieza, variación del pulso, movimiento reducido, pausa al ocultar pestaña y fin de render periódico al deseleccionar.

Ajuste posterior solicitado: aumentar la visibilidad del pulso, conservando el ciclo lento de 2,4 s. La emisión oscila entre 0,12 y 0,60; no se hace aparecer/desaparecer la pieza ni se modifica el color guardado. Movimiento reducido mantiene el resaltado fijo.

Resultado: UI y selección comprobadas con cuatro recorridos por plataforma (escritorio/móvil emulado), tres pruebas visuales de selección/sombras y seis regresiones de consultas/reapertura; build y 139 pruebas unitarias correctos. Evidencia y límites en [12](12-estado-implementacion.md). No es aceptación de Android físico ni certificación mecánica.
