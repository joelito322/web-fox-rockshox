# 06h · Identidad Cumbre y paleta naranja rojiza

Decisión explícita: el usuario eligió la propuesta18 Cumbre oscura y autorizó aplicarla, añadir transición al pasar el cursor, eliminar las propuestas temporales y trasladar la paleta verde de interfaz a variantes naranja rojizas.

## Recursos definitivos

- [atlas-mtb.svg](../../src/assets/atlas-mtb.svg): maestro vectorial de Cumbre. Composición vertical aprobada en atlas-signature; símbolo y letras reutilizables en defs; disposición horizontal atlas-header para mantener una cabecera legible.
- [BrandLogo](../../src/components/BrandLogo.tsx): consume el fragmento horizontal con ?no-inline, evitando el bloqueo de fragmentos externos en data URI de Chromium.
- [BrandLogo.css](../../src/components/BrandLogo.css): contraste claro/oscuro, tamaños y desenfoque de520ms al hover/foco. Termina nítido, sin bucle. Hover solo con puntero fino; prefers-reduced-motion elimina la animación.
- [favicon.svg](../../public/favicon.svg): símbolo de Cumbre independiente y autónomo.

Los once contornos de la propuesta seleccionada se conservaron exactamente; se adaptó su composición para cabecera. Tintas/papel pasan a neutros cálidos. No afirmar igualdad binaria de capturas: reutilizar fragmentos puede producir diferencias mínimas de rasterizado.

logo-lab fue eliminado por petición explícita después de trasladar la propuesta a producto. Se retiró también su regla temporal de Git Ignore. No existe dependencia de esa carpeta. Evidencia en models/local/validation/brand, ignorado por Git.

## Paleta compartida

[theme.css](../../src/app/theme.css) define los tokens CSS, importados desde index.css. Se conservan jerarquía, composición y funciones.

| Uso | Color |
| --- | --- |
| Marca / acento | #ef633f |
| Variante clara / hover | #ff896b |
| Selección suave | #fbe9e2 |
| Página | #f8f5f2 |
| Tinta principal | #28211e |
| Texto secundario | #77675f |
| Bordes | #e7ddd6 |
| Superficie oscura | #171412 |
| Fondo de visor y nueva miniatura | #ece6e1 |

Se sustituyeron267 colores CSS de predominio verde, conservando luminosidad/alpha y usando terracotas, coral, carbón cálido y marfil según su función. Incluye portada, acceso, catálogo, bicicletas, montajes, carrito/pedidos, administración, formularios, selección, foco, sombras, divisores y controles. discovery-lime se renombró discovery-accent. No se convirtieron todas las superficies al naranja principal.

    Cumbre #ef633f
        └─ theme.css → portada / catálogo / administración / comercio / armado
                             └─ tonos cálidos, claros y oscuros según función

    Visor: fondo neutro cálido + resaltado temporal naranja claro
    Montaje: acabados y colores elegidos se conservan

Las escenas usan el mismo fondo neutro y la selección transitoria usa #ff896b. Material clonado/restauración/pulso conservan su lógica: no se alteran pinturas, acabados, GLB, perfiles de suspensión, anclajes, fotos o miniaturas guardadas. Marcas externas como Google conservan su identidad. Avisos de conflicto/error mantienen iconos, textos y colores semánticos; se modifica la paleta propia de ATLAS.

## Validación y límites

- Build y524 pruebas correctas, dos prototipos omitidos,81 archivos. Tres pruebas de materiales repetidas tras ajustar el matiz.
- Tres recorridos autenticados: administración de borradores/roles, montaje enduro y montaje DH con guardado/reapertura. Fixtures eliminados por el runner.
- Dieciséis combinaciones públicas: portada/componentes/bicicletas/login en320/393/768/1440px, sin desbordamientos.
- Contraste del botón principal medido4,92:1; no equivale a una certificación exhaustiva de cada estado.
- Sin literales CSS de predominio verde al cierre; se conservan verdes legítimos de piezas/fotos/paletas de pintura.
- Hover con desenfoque y retorno nítido; movimiento reducido devuelve animation:none y filter:none.

Mapeo/capturas/resultados en models/local/validation/theme y models/local/validation/brand, ignorado. Al introducir el CSS se invalidó la transformación antigua de Vite para que el entorno local cargara los tokens. Sin dependencias, consultas, migraciones, permisos o cobros nuevos. Los cambios se comitearon después por petición explícita, según el registro siguiente. Sin push o despliegue.


## Commits autorizados por el usuario

| Commit | Responsabilidad |
| --- | --- |
| 9c86881 | Condición comercial y precios por modelo, migraciones038/039, fuentes y auditoría |
| 5506e0f | Estado de segunda mano, precios visibles, carrito/checkout y pruebas adaptadas |
| ad1de76 | Identidad Cumbre, SVG/favIcon y transición accesible |
| d36be0f | Paleta cálida global y resaltado/fondo del visor |

La documentación se registra en un quinto commit independiente. El PDF del manual del usuario permanece fuera; no se versionaron capturas, resultados locales o propuestas eliminadas. Las comprobaciones descritas se ejecutaron sobre el conjunto final, no sobre cada estado intermedio del historial. Siguientes commits solo por nueva petición explícita.
