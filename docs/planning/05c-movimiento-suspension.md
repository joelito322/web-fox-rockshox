# 05c · Movimiento de suspensión por recorrido

Ampliación autorizada el 21/10/2026. Sustituye la exclusión anterior de movimiento de suspensión en 05 únicamente para inspección cinemática visual; no añade dinámica de peso, cálculo de resorte, esfuerzos, motor de física o workers. Pertenece a las fases de recursos, montaje, UX y validación de 08.

## Contrato

- Controles del visor: compresión delantera y trasera independientes, reproducción/pausa de un ciclo y restablecer. Móvil conserva controles accesibles y sin cubrir acciones del editor. Apertura explícita, sin movimiento automático inicial; los porcentajes preparan la reproducción y no comprimen la bicicleta al editarlos. Movimiento reducido deshabilita reproducción y conserva el reposo.
- Estado temporal de inspección: no modificar variantes, acabados, configuración persistida ni miniaturas del montaje. Guardar/reabrir conserva postura de referencia; cambiar piezas restablece la inspección para no mantener valores incompatibles.
- Perfiles versionados por modelo/generación y registro espacial de cada talla. Separar cuerpos rígidos, pivotes y elementos telescópicos. No estirar tubos de cuadros, ruedas o depósitos como si fueran goma. Mantener conexiones de piezas dependientes.
- Dimensiones de catálogo y parámetros de cinemática visual no son intercambiables. Conservar observación/inferencia por perfil y limitar el movimiento si no puede cerrarse un mecanismo. No certificar sag, curvas de fabricante, holguras físicas ni exactitud CAD.
- Conservar binarios y generadores publicados: la capa de inspección versionada articula instancias derivadas, sin mutar el recurso compartido ni el estado de referencia utilizado por montajes/miniaturas anteriores.
- La reproducción solo invalida cuadros de render mientras está activa; al pausar vuelve al render por demanda, salvo el pulso de una selección visual activa solicitado posteriormente en 06e. No consultas de red o React setState por cada cuadro animado.

```text
Visor 3D
┌──────────────────────────────────────┐
│             bicicleta                │
│                                      │
│ [Perspectiva] [Lateral] [Suspensión]  │
├──────────────────────────────────────┤
│ Delantera  ───●────────   30 %        │
│ Trasera    ─────●──────   50 %        │
│ [Reproducir / Pausar] [Restablecer]   │
│ Movimiento aproximado                │
└──────────────────────────────────────┘
```

## Ejecución y aceptación

1. Revisar fuentes y semántica de cuerpos de los quince cuadros, nueve horquillas y cuatro amortiguadores actuales. Registrar perfiles y límites, sin atribuir articulación real completa a geometrías estáticas anteriores.
2. Reglas geométricas puras para cierre de enlaces, acortamiento de horquilla y anclajes del amortiguador; separación de geometría y adaptación de piezas dependientes en el renderer.
3. Integrar controles, límites, pausa, restablecimiento, cambios de modelo y alternativa de movimiento reducido.
4. Probar reposo idéntico, límites/valores inválidos, longitudes rígidas, conexiones, conservación de materiales, aislamiento de instancias, guardado, miniaturas y ausencia de trabajo continuo en reposo. Revisar visualmente modelos representativos y documentar evidencia/pendientes en 12. No afirmar cobertura o exactitud antes de verificar.

## Fuentes iniciales

- [SUPREME DH V5 · HVCS](https://www.commencal.com/ca/fr/landing-supreme-dh-v5.html).
- [V10.8 MY27 · soporte VPP](https://www.santacruzbicycles.com/pages/product-support/v-10-8-my27).
- [TUES MK4 · manual](https://www.yt-industries.com/media/3d/79/02/1726468232/RTFM-TUES-MK4-MY2024.pdf).
- [Ransom · arquitectura de seis barras](https://www.scott-sports.com/gb/en/ransom).
- Trazados, despieces y distinción de observación/inferencia previos en `models/catalog-v5/traces`, `models/catalog-v6/structure-profiles.json`, `models/catalog-v6/references.md` y `models/catalog-v9/references.md`. Una fotografía lateral o el pivote único del manifiesto no bastan para afirmar reconstrucción exacta del mecanismo.

## Dirección implementada y límites

`atlas-motion-v1` es una capa de inspección local y versionada: no cambia los binarios/variantes de catálogo ni los montajes guardados. Perfiles de quince cuadros registrados por talla contra sus propios anclajes; guías exteriores cerradas, con límites por combinación. Las geometrías rígidas se separan en instancias propias por superficies conectadas y regiones del modelo, sin cambiar buffers compartidos.

Los perfiles son **aproximaciones del mecanismo exterior**. En particular, las guías reducidas de SUPREME y Ransom no representan todo el mecanismo interno de seis barras ni curvas de fabricante. Los porcentajes son del intervalo visual resuelto, no del recorrido comercial completo: algunos intervalos son conservadores y pequeños. El registro admite una tolerancia visual de 4 mm de longitud antes de limitar el movimiento; no atribuir esa tolerancia a un amortiguador real. No declarar ausencia de colisiones ni continuidad superficial exhaustiva a partir del cierre matemático de los enlaces.

Horquillas separan cuerpo fijo y botellas; los amortiguadores articulan entre anclajes, deslizan su extremo móvil y acortan el resorte cuando corresponde. La compresión axial usa el intervalo real de la geometría del muelle y conserva su extremo superior, sin escalar su diámetro ni el depósito/cuerpo rígido. Cadena/latiguillos se adaptan visualmente. La rueda y piezas del extremo se desplazan con el portador trasero; el mando asociado al cambio permanece en el manillar. Presión, kilos, amortiguación, elasticidad real y tensión de cadena quedan fuera del alcance aprobado.

Los controles ocupan un espacio reservado bajo la escena al abrirse. Reproducir recorre suavemente hasta los porcentajes elegidos; Pausar conserva la postura dibujada. Cerrar/restablecer o cambiar piezas devuelve la inspección a reposo. Cambiar un porcentaje prepara la siguiente reproducción y devuelve la bicicleta a reposo, sin compresión inmediata. Los porcentajes elegidos se conservan al pausar; se usan exactamente, incluido cero, al volver a reproducir. Movimiento reducido deshabilita reproducción y conserva el reposo. La animación usa refs y el ciclo de render del visor, sin React setState ni consultas por cada cuadro; se detiene en pausa y con la pestaña oculta.

Fuentes y reproducción detalladas en [models/motion-v1](../../models/motion-v1/README.md). Revisión interna en `/tests/fixtures/suspension-review.html`; no se publica como ruta del producto. Evidencia y límites de aceptación en [12](12-estado-implementacion.md).

## Resultado de comprobación · 21/10/2026

Build y 131 pruebas unitarias correctos (37 archivos). Diez casos nuevos de navegador comprobados entre escritorio y móvil emulado: ajuste/restauración, reproducción/pausa sin render continuo en reposo, movimiento reducido, familias de horquilla/amortiguador y guardado/reapertura sin persistir postura. Seis casos existentes de selección, sombras y reutilización de datos también pasaron. La revisión interna produjo 45 capturas de quince cuadros en reposo y dos porcentajes, sin errores de página. Estas comprobaciones verifican comportamiento y las guías aproximadas; no certifican mecanismos reales ni superficies sin colisiones. Detalle y pendientes en 12.

Actualización de interacción y muelle: porcentajes sin compresión inmediata, valores exactos al reproducir y resorte con longitud geométrica propia. Comprobación posterior: build/134 pruebas correctos y seis casos de navegador por plataforma (escritorio y móvil emulado), incluidos compresión real del muelle en el renderer y guardado/reapertura. Evidencia y límites en 12.

## Revisión integral de cuadros y amortiguadores · motion v2

Solicitud del usuario: comprobar todas las elecciones actuales de cuadro y amortiguador; corregir piezas que se empujan rígidas, ejes desalineados y resortes sin compresión. La auditoría debe usar los recursos actuales (incluidas las revisiones individuales hasta v30), no solo los perfiles de los GLB v7/v9. Se detectó extensión durante compresión en seis modelos y clasificación geométrica demasiado general de piezas del amortiguador.

Trabajo dentro de fase3: auditoría offline de30 cuadros y todas las variantes seleccionables de shock; contraste con trazados/despieces propios, perfiles por recurso y asignación explícita de ojos; separación de resorte/vástago/apoyos/cuerpo/depósito sin deformar elementos rígidos; verificación de cierre de pivotes, compresión axial y postura restaurada. Instancias derivadas y GLB publicados intactos, sin cambiar guardados/miniaturas ni añadir física de peso. Validar mecanismo visible y conexión durante varias posturas, además de las ecuaciones; registrar límites en `models/motion-v2` y documento de evidencia. No certificar curvas de fábrica/seis barras completos por una guía reducida.

La comprobación de guardado detectó que las cuatro prearmadas públicas conservaban cuadros v11 retirados del selector y `preset_unavailable` impedía iniciar el montaje. Como parte de la integración de suspensión, preparar una operación acotada que cambie solo esas cuatro referencias de cuadro por sus sucesoras actuales (META v21/SUPREME v25), con misma talla/especificaciones/acabados, sin cambiar las otras88 posiciones ni convertir montajes privados. Fuente aditiva `supabase/catalog/motion-v2-examples.json`, operación y evidencia antes de aplicar. Cubrir también las cuatro identidades anteriores en la inspección por recurso para guardados que ya las utilicen.


Revisión integral de suspensión v2 implementada en fase3: quince modelos/30 tallas y38 shocks, cuatro recursos anteriores de prearmadas, compresión monótona y resorte separado de cuerpos rígidos. Se corrigieron cuatro referencias de prearmadas retiradas manteniendo88 posiciones y privados. Evidencia, reproducción y límites en [12y](12y-evidencia-suspension-v2.md).
