# Alternativas que resuelven incompatibilidades

Estado: ampliación implementada y comprobada, conservada junto al plan general del configurador. Implementación solicitada expresamente por el usuario. Alcance único: ofrecer soluciones desde los avisos existentes; no añadir asesor por presupuesto, inventario individual usado, piezas aportadas, taller o posventa. Complementa06g y13, sin nuevas tablas, RPC, índices o privilegios.

## Recorrido

```text
Aviso conocido → Ver alternativas → elegir posición afectada
   → modelos/variantes publicados → comprobar sustitución individual
   → foto, medida/acabado, precio y diferencia cuando sean comparables
   → Usar esta pieza → visor actualizado → deshacer / guardar habituales
```

```text
Compatibilidad · panel existente
El aro y el neumático no coinciden
[Ver alternativas]
[Aro delantero] [Neumático delantero]

[Foto] Modelo · variante · acabado
       Resuelve este aviso · sin nuevos conflictos detectados
       S/ importe · diferencia respecto a la pieza actual
       [Usar esta pieza]
```

No crear otro modal o ruta. Mantener acciones de cambio manual y libertad de seleccionar/guardar montajes inconsistentes. Solo ofrecer soluciones para conflictos conocidos; los datos por confirmar no se convierten en compatibilidad garantizada.

## Reglas

Regla pura de sustitución en configurator/model, independiente de React/Three/Supabase. Reutilizar warnings y choose; comprobar datos presentes en la relación concreta, desaparición del aviso, ausencia de nuevos conflictos, ningún conflicto remanente que afecte a la pieza sustituida y ausencia de nuevos datos desconocidos. Desaparecer un aviso porque faltan medidas no constituye una solución. Los otros datos pendientes del montaje se muestran y no equivalen a un encaje certificado.

Cubrir las reglas de conflicto existentes: diámetros de rueda/cuadro/horquilla, ejes y posiciones de bujes, anclaje/diámetro/espesor de discos, límites oficiales de horquilla, dimensiones/anclajes de shock, pedalier/bielas, núcleo/velocidades, abrazadera, tija y potencia. No inventar adaptadores ni límites. Solo los cuadros/generaciones/años/tallas del registro oficial reciben sus intervalos. Nuevos códigos sin evidencia explícita no generan recomendaciones automáticas.

Aplicar solo la posición elegida, sin heredar «Aplicar a ambos lados», sin borrar otras piezas ni escribir al carrito. El cuadro mantiene su confirmación habitual. Revalidar la alternativa antes de iniciar y al terminar la carga3D; rechazar si cambia el montaje durante esa carga. Conservar deshacer, borrador y guardado. Solo cargar GLB al elegir una alternativa.

## Datos y precio

Catálogo bajo demanda, paginado24 modelos, reutilizando useCatalog y su caché; opciones locales paginadas de6. No recorrer todos los catálogos ni consultar por advertencia/fotograma. Una consulta de ofertas por lote para las seis opciones visibles y la posición actual; sin precio histórico inventado o fallback por marca/modelo.

Relacionar oferta mediante variante y acabado exactos. Comparar solo unidades comerciales y moneda iguales; importe y diferencia por una posición, no por toda la bicicleta. Indicar condición y falta de stock; sigue siendo posible probar visualmente una opción sin stock o sin oferta. Precio y stock se confirman al comprar. Precio ausente o fallo de ofertas no impide resolver la selección técnica.

## Implementación y aceptación

1. Regla pura y pruebas: resolución real, datos ausentes, variantes retiradas/no publicadas, límites por generación/talla, nuevos conflictos, lados independientes y revisión del conflicto vigente.
2. Panel reutilizado, selección de posición, estados de carga/error/sin resultado, paginación, imágenes/precios/condición y comparación honesta.
3. Sustitución individual integrada con carga y caché3D habituales; confirmación del cuadro, deshacer y guardado. No alterar pinturas o recursos publicados.
4. Pruebas de interfaz/navegador desktop y móvil emulado: crear conflicto, consultar alternativas, sustituir solo un lado, corregir, deshacer y guardar/reabrir. Verificar consultas acotadas y archivos3D no descargados por abrir la lista.
5. Build/regresiones pertinentes y evidencia local ignorada. Sin commits ni push salvo solicitud explícita nueva.

## Evidencia

Validación28/10/2026:

- Build final correcto y50 pruebas dirigidas correctas en cuatro archivos: reglas por familia, datos ausentes, retiro/publicación, incertidumbre de ejes, límites oficiales, precios por acabado/unidad, ausencia de oferta, lotes/paginación y avisos existentes. La suite general durante el cambio pasó562 pruebas,2 omitidas/83 archivos; después se añadieron dos pruebas de paginación, incluidas en las50 finales.
- Dos recorridos de compatibilidad desktop y dos móvil emulado correctos: rueda inconsistente y límites Nomad; la prueba de rueda incorpora alternativas, foto/precio, sustitución individual con rueda opuesta intacta, deshacer, guardado/reapertura de montaje inconsistente y posterior corrección guardada/reabierta. Repetición final de sustitución desktop correcta tras los guardas de instantánea/variantes y posiciones existentes.
- Abrir alternativas: cero descargas GLB y una llamada sales_offers para el lote visible. Las pruebas de interfaz limitan cada lote a seis variantes más la posición actual, sin consulta anticipada solo del precio actual mientras carga el catálogo. Imágenes y metadata sí se consultan/usan normalmente.
- Cambio manual de talla Nomad conserva piezas y guardado. Dos recorridos generales Enduro/DH no abrieron el panel de Mis bicicletas en la primera ejecución paralela; ambos pasaron al repetirse de forma aislada. No se atribuye una causa definitiva a ese comportamiento ni se presenta ese primer lote como correcto; no hubo cambios en Garage para esta ampliación.
- Estado remoto final sin fixtures:24 tablas/41 migraciones,70 modelos/782 variantes/780 recursos,4 prearmadas,140 ofertas/689 vínculos. Sin migraciones nuevas de esta ampliación. Credenciales privilegiadas ausentes del build comprobado y diff sin errores de espacios. Ningún GLB, pintura, oferta o guardado previo se convirtió automáticamente.

Evidencia local ignorada en `models/local/validation/compatibility/`: desktop/mobile-alternatives.png y alternatives-*.log. Scripts reproducibles: pnpm check, Vitest dirigido y `node scripts/test-authenticated.mjs desktop|mobile '' compatibility`; regresiones Enduro/DH aisladas y Nomad en suite authenticated. Sin commits ni push.

Límites: resolución del aviso con medidas declaradas y reglas existentes, no certificación de encaje, colisiones físicas ni catálogo universal. El precio puede faltar y la oferta/stock se confirman al comprar; no bloquear la prueba visual. Android físico y aceptación visual del usuario no certificados por emulación.

Actualización posterior: comiteado por petición explícita en a9cd0f6 (reglas) y ae41fc4 (interfaz), junto con el resto de cambios pendientes separados. Registro de los grupos y verificaciones en [13h](13h-armado-automatico-y-metodos-de-pago.md#commits-solicitados-por-el-usuario). Sin push ni despliegue.
