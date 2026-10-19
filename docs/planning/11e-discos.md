# 11e · Ingesta documental de discos de freno

Categoría `rotor`, slots `front_rotor`/`rear_rotor`. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [frenos](11d-frenos.md).

## Registro de familias

| Marca | Registros de partida | Fuente |
| --- | --- | --- |
| SRAM | HS2 y otras referencias documentadas del catálogo | [Discos SRAM](https://www.sram.com/en/sram/mountain/products/brakes/rotors?page=1) |
| Shimano | Familias de discos de las series seleccionadas, código exacto por confirmar | [Especificaciones oficiales](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf) |
| Magura | Referencias admitidas por cada conjunto MT seleccionado | [Catálogo de fabricante](https://api.magura.com/medias/sys_master/maguracom-medias/h34/hf5/9604087545886/2023_magura_katal_en_eur/2023-magura-katal-en-eur.pdf); confirmar gama actual y códigos antes de registrar variantes |

No atribuir un mismo disco a todos los frenos de una marca. Registro sin código preciso o prueba de vigencia permanece pendiente; un catálogo histórico no habilita la ingesta actual.

## Campos y validaciones

| Dato | Tipo / regla |
| --- | --- |
| Código y construcción | Identidad, una/dos piezas, material según ficha |
| `rotor_diameter_mm` | Número positivo mm; 180/200/203/220 son medidas distintas, no valores intercambiables |
| Espesor y desgaste | Medidas nominal/mínima en mm o null con fuente; no aplicar un límite universal |
| `rotor_mount` | Código de interfaz: seis tornillos/Center Lock u otra documentada |
| Restricciones | Freno/pastilla/adaptador admitidos y límite del cuadro/horquilla |
| Apariencia | Perfil/patrón reconocible, color y superficie de frenado; no pintar metal de fricción por habilitar color libre |

Anclaje al buje y plano de pinza determinan ubicación. Adaptadores se representan como auxiliares documentados sin selector nuevo; una aproximación no inventa un adaptador que garantice encaje.

Aceptar cada variante exige diámetro proporcional, interfaz correcta en ficha, avisos, persistencia y recuperación. Null en espesor o límite no se interpreta como compatibilidad universal.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
rotor_diameter_mm: número positivo
rotor_thickness_mm / minimum_thickness_mm: número positivo | null
rotor_mount: código | null
construction / material: código documentado | null
restrictions: lista de notas con fuente
weight_g: número positivo | null
maintenance: objeto común | null
```
