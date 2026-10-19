# 11k · Ingesta documental de aros y bujes

Categorías `rim` y `hub`, slots delanteros/traseros. Aro no significa rueda completa; radios generados como auxiliares. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [neumáticos](11l-neumaticos.md).

## Marcas y familias de partida

| Pieza | Marca/familia | Fuente y límite |
| --- | --- | --- |
| Aros | DT Swiss EX 511, FR 541 | [EX 511](https://www.dtswiss.com/en/components/rims-mtb/enduro/ex-511), [freeride](https://www.dtswiss.com/en/components/rims-mtb/free-ride); no confundir con ruedas FR completas |
| Aros | SPANK 350, 359 | [Familias](https://spank-ind.com/collections/all/all-mountain), [359](https://spank-ind.com/collections/rims/products/spank-359-rim?variant=32860676358230) |
| Bujes | DT Swiss 350 | [Familia y modelos](https://www.dtswiss.com/en/components/hubs-and-rws/hubs-mtb/350) |
| Bujes/aros investigados | Hope Pro 5 / Fortus | [Ruedas DH oficiales](https://www.hopetech.com/products/wheels/downhill/); verificar ficha del componente por separado antes de registrarlo como aro o buje, sin crear selector de rueda completa |

## Campos del aro

| Grupo | Datos y validaciones |
| --- | --- |
| Tamaño | BSD/ETRTO en mm, denominación comercial, anchura interna/externa y altura de perfil |
| Construcción | Material, perfil simétrico/asimétrico, offset y tipo de talón admitido |
| Radios | Número de agujeros, ERD si consta, restricciones; no calcular longitud real certificada de radios |
| Neumático | Tubeless y rango de anchuras/presión cuando estén documentados |
| Uso | Disciplina declarada y límites publicados, sin ranking inventado por material |

27.5/584 y 29/622 como referencias principales; 26/559 se considera solo si existe una referencia actual documentada pertinente; un modelo histórico no se ingesta y no se genera una variante 26 de toda familia. Un diámetro diferente exige geometría diferente; no escalar la rueda completa con disco y buje.

## Campos del buje

Posición; diámetro/ancho de eje; estándar completo y tapas admitidas; número de agujeros; interfaz del disco; núcleo y restricciones; geometría de bridas cuando conste; material, peso/contexto, acabado y mantenimiento. Núcleo HG/XD/Micro Spline u otro se verifica por código/variante y no se asigna por marca del cassette.

Delantero y trasero se seleccionan por posición. No inferir que un buje compatible con una horquilla enduro sirve para una doble pletina DH. Igual número de agujeros es una comprobación, no garantía de rueda construible. Las dimensiones desconocidas permanecen null; parámetros de radio/render estimados viven en el manifiesto.

Aceptar exige proporciones aro/buje, interfaces de eje/disco/núcleo visibles en ficha, aviso o incertidumbre y restauración por posición. No añadir al alcance una calculadora de radiado, un catálogo de radios o una rueda completa integrada.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
rim:
  wheel_bsd_mm: entero positivo | null
  commercial_size: texto documentado | null
  inner_width_mm / outer_width_mm / profile_height_mm / erd_mm: número positivo | null
  spoke_hole_count: entero positivo | null
  profile_offset_mm: número con signo | null
  material / bead_type: código | null
  tubeless: booleano | null
  tire_restrictions: texto de fuente | null
  weight_g: número positivo | null
  maintenance: objeto común | null
hub:
  position: front | rear | both
  axle_standard: código completo | null
  axle_diameter_mm / axle_width_mm: número positivo | null
  spoke_hole_count: entero positivo | null
  rotor_mount / freehub_standard: código | null
  flange_dimensions: objeto de dimensiones documentadas | null
  bearing_notes: texto documentado | null
  weight_g: número positivo | null
  maintenance: objeto común | null
```
