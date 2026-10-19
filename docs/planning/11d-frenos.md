# 11d · Ingesta documental de frenos

Categoría `brake`, slots delantero/trasero. Cada elección conserva conjunto documentado de pinza y maneta; latiguillo simplificado. [Contrato común](11-propuesta-de-inventario.md#contrato-común-de-ingesta) y [discos](11e-discos.md).

## Familias y gamas a registrar

| Marca | Familias/gamas | Variaciones que hay que preservar | Fuentes |
| --- | --- | --- | --- |
| Shimano | DEORE, SLX, DEORE XT, XTR; SAINT/ZEE solo si se confirma gama actual | 2/4 pistones donde existan, código de pinza y maneta, generación; no todos son frenos DH por compartir gama | [Opciones oficiales 2/4 pistones](https://bike.shimano.com/stories/article/which-is-the-right-brake-for-you.html), [DEORE XT](https://bike.shimano.com/products/series/deorext.html), [especificaciones](https://productinfo.shimano.com/pdfs/product/thisyear/2025-2026_Specifications_v033_en.pdf) |
| Magura | MT5, MT7; MT4/MT8 para referencias de 2 pistones | Gama, versión y aplicación declarada; no presentar MT8 como DH por el número de modelo | [MT5](https://magura.com/product/mt5/), [2 pistones](https://magura.com/light-duty-brakes/), [guía con familias](https://api.magura.com/medias/sys_master/root/h3c/h29/9875262504990/MAGURA_BuyersGuide-EN/MAGURA-BuyersGuide-EN.pdf) |
| SRAM | Maven, Code, Level y niveles reales de cada serie; Avid solo como antecedente, fuera del inventario actual | No asumir igual número de pistones o fluido dentro de una marca; distinguir versiones | [Maven](https://www.sram.com/en/sram/mountain/series/maven), [mapa SRAM/Avid](https://sram.com/globalassets/document-hierarchy/compatibility-map/sram-avid-disc-brake-pad-identification-guide.pdf) |

Los índices antiguos de Magura y SRAM/Avid sirven para identificar familias, no demuestran oferta actual. Comprobar vigencia de cada código antes de incluirlo; no publicar un descatalogado.

«Derivadas» significa series, gamas y referencias documentadas; no se generan sub-marcas por similitud del nombre. Un freno de 2 pistones puede catalogarse con uso y avisos reales, sin certificarlo para descenso. No mezclar pinza/maneta de series distintas sin conjunto respaldado.

## Campos por conjunto

| Campo | Tipo / regla |
| --- | --- |
| Código pinza y maneta | Textos de identidad real, lado/orientación y fuente |
| `piston_count` | Entero documentado de pinza: 2/4 u otro confirmado; nunca deducido de la gama |
| Accionamiento y fluido | Códigos controlados; hidráulico/mecánico y fluido concreto sin asumir compatibilidad cruzada |
| Montaje y disco | Estándar, rango de diámetros/espesor admitidos y restricciones |
| Latiguillo/conexión | Referencia, conexión, longitud comercial si consta; estimación de ruta separada |
| Ajustes | Alcance, contacto y herramientas cuando estén documentados |
| Pastillas | Referencias/materiales admitidos como información, sin nuevo selector |
| Peso y acabado | Contexto de conjunto, material/acabados y zonas personalizables |
| `maintenance` | Manual de purga/servicio por referencia, tareas y condiciones; intervalos solo con fuente |

Validar delantero/trasero, maneta/anclaje, fluido y disco; los conflictos mecánicos son avisos del montaje visual, no autorización para usar líquidos o piezas incompatibles físicamente. Recurso compuesto con pinza y maneta en sus posiciones; retirar un slot retira ambos sin borrar el otro freno. Guardar conserva una variante por posición.

Aceptación: aplicar al menos una variante de 2 y otra de 4 pistones de los modelos elegidos, distinguir su forma, fuente y datos; comprobar ambos lados y reapertura. El conteo no se representa con un simple cambio de etiqueta sobre la misma pinza.

## Diccionario de captura

Nombres previstos dentro de `specs`, salvo campos comunes ubicados en las columnas de 03a. La notación siguiente es documental: no añade tablas ni código ejecutable. Los objetos por categoría representan contratos separados, no un JSON con todas las categorías mezcladas. Una propiedad aplicable y desconocida usa null; listas desconocidas no se interpretan como compatibilidad universal.

```text
caliper_model / lever_model: referencia comercial
piston_count: entero positivo documentado | null
actuation: hydraulic | mechanical | null
fluid: código de fluido concreto | null
lever_side: left | right | reversible | null
brake_mount: código | null
rotor_min_mm / rotor_max_mm / rotor_thickness_mm: número positivo | null
hose: null | {reference, connection, length_mm}
adjustments: lista documentada
pad_references: lista de referencias documentadas
weight_g: número positivo | null
maintenance: objeto común | null
```

## Datos observados de referencias

- [Shimano BR-M8200](https://bike.shimano.com/en-SG/products/components/pdp.P-BR-M8200.html): referencia DEORE XT de pinza de 2 pistones. No confundir código de pinza con un conjunto completo de maneta/latiguillo.
- [Magura MT5](https://magura.com/product/mt5/): producto identificado de 4 pistones. Completar versión de conjunto y su manual aplicable antes de publicar.
- [Manual de Maven](https://docs.sram.com/en-US/publications/78X6ST0qHwC0SwGn8u0uzN/SM%20-%20Maven%20Brakes?models=db-mvn-ult-a1): documentación propia de la familia; el fluido no se hereda de otra gama SRAM.

Consulta: 18 de octubre de 2026. No convertir estos hechos en una declaración de compatibilidad con todos los cuadros o discos.
