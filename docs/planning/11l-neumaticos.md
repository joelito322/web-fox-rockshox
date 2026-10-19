# 11l · Ingesta documental de neumáticos

Categoría `tire`, slots delantero/trasero. Marcas solicitadas: Maxxis, CST, Kenda, Michelin y Schwalbe; otras solo al localizar registros pertinentes. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta).

## Familias y fuentes

| Marca | Familias localizadas | Datos a extraer de la referencia concreta |
| --- | --- | --- |
| Maxxis | Assegai, Minion DHR II, Minion DHF, Shorty y High Roller según generación actual | [Assegai](https://www.maxxis.com/us/tire/assegai/), [DHR II](https://www.maxxis.com/us/tire/minion-dhr-ii/), [DHF](https://www.maxxis.com/us/tire/minion-dhf/), [Shorty](https://www.maxxis.com/us/tire/shorty/), [catálogo 2026](https://www.maxxis.com/us/wp-content/uploads/sites/13/2026/04/2026-Maxxis-Bicycle-Catalog-web.pdf): tamaño, carcasa, compuesto y uso por versión |
| CST | BFT, Patrol | [Catálogo MTB](https://shop.csttires.com/pages/mountain), [BFT y terreno](https://www.csttires.com/us/terrains/bike_mud/); no atribuir categoría DH a cualquier Patrol |
| Kenda | Hellkat, Pinner | [Hellkat](https://shop.kendatire.com/collections/mountain/products/hellkat), [Pinner](https://bicycle.kendatire.com/en-us/news/bicycle-news/pinner/); vigencia actual por combinación |
| Michelin | Gama DH Racing Line, DH22, Wild Enduro MH/Front/Rear Racing Line según referencia vigente | [Catálogo DH](https://www.michelinman.com/bicycle/browse-tires/by-cycle-type-and-usage/mtb/downhill), [actualización de gama](https://www.michelin.com/publications/produits-et-services/la-gamme-de-pneus-michelin-dh-racing-line-evolue-en-profondeur-et-devient-un-vrai-plus-en-competition), [Wild Enduro MH](https://www.michelinman.com/bicycle/tires/michelin-wild-enduro-mh-racing-line), [gama enduro](https://www.michelinman.com/bicycle/browse-tires/by-usage/mtb/enduro); no mezclar revisiones |
| Schwalbe | Magic Mary, Tacky Chan, Albert; Big Betty excluido por discontinuación | [Catálogo MTB](https://www.schwalbetires.com/bike-tires/mtb/), [Big Betty](https://www.schwalbe.com/en/Big-Betty), cuya página anuncia discontinuación desde abril de 2026 |

Solo gama actual documentada: Big Betty queda como contraejemplo de exclusión, no como pieza prevista para ingerir. La presencia de Hellkat en outlet o un artículo antiguo sobre Pinner no demuestra vigencia por sí sola: contrastar catálogo actual y medida/carcasa concretas.

Las filas son un registro inicial documentado, ampliable por catálogo oficial; no una lista exhaustiva de toda versión histórica de estas marcas. Cada modelo adicional debe registrarse con evidencia antes de declararlo parte de la entrega.

## Campos por variante

| Grupo | Tipo y validación |
| --- | --- |
| Medida | ETRTO anchura-BSD; talla comercial original; anchura nominal en mm/pulgadas documentada |
| Forma | Perfil y altura/diámetro exterior reales si constan; estimación de volumen del render separada |
| Construcción | Carcasa comercial, TPI cuando exista, refuerzos, talón, tubeless y material documentado |
| Compuesto | Código/nombre original; no equiparar automáticamente compuestos entre marcas |
| Aplicación | Delantero/trasero/ambos, enduro/DH u otro uso declarado; dirección de giro |
| Terreno | Lista controlada con fuente: compacto, suelto, mixto, roca, raíces, barro; condiciones seco/húmedo cuando estén documentadas |
| Límites | Presión/carga y rango de aro admitido cuando consten, con unidades y contexto |
| Aspecto | Patrón de tacos, flanco, acabados y peso con referencia de versión |

27.5 y 29 son prioridades ligadas a las bases seleccionadas, incluyendo mullet. Otras medidas documentadas se registran para evaluar el inventario, sin producir combinaciones teóricas. Misma familia, medida distinta o carcasa/compuesto técnico distinto implica variante física; flanco/color puramente cosmético puede ser acabado.

Terreno es una orientación respaldada por fuente y útil como filtro. No calcular agarre, frenada o un «mejor neumático» universal; ausencia de datos no significa «todo terreno». El usuario puede mezclar modelos delante/detrás con los avisos pertinentes.

Aceptar cada variante exige volumen y dibujo reconocibles, giro por posición, ETRTO coherente con aro, medida, carcasa/compuesto, fuentes y guardado. Una textura puede compartir patrón entre variantes cuando sea correcto; no cambiar solo la etiqueta al variar anchura/diámetro.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
etrto: código anchura-BSD documentado | null
commercial_size: texto de fuente
wheel_bsd_mm: entero positivo | null
tire_width_mm / outer_diameter_mm: número positivo | null
casing / compound / bead_type: código comercial | null
tpi: entero positivo | null
tubeless: booleano | null
recommended_position: front | rear | both | null
rotation_notes: texto de fuente | null
terrain_tags: lista de códigos respaldados por fuente
condition_tags: lista seco/húmedo/otras condiciones documentadas
pressure_limits: null | {min_value, max_value, unit, conditions}
rim_width_limits_mm: null | {min, max, conditions}
weight_g: número positivo | null
maintenance: objeto común | null
```
