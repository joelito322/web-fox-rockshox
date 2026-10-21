# 06 · UI y UX

Relacionado: [producto](01-producto-y-alcance.md), [rutas y estado](02-arquitectura-y-frontend.md), [acceso](04-autenticacion-y-acceso.md) y [visor](05-configurador-3d.md).

## Principios de contenido y lenguaje aprobados

La interfaz debe ser simple, directa e intuitiva. Cada texto ayuda a identificar contenido, comprender una decisión o ejecutar una acción. No trasladar a la pantalla la estructura de tablas, módulos, validaciones o recursos del código. Estos principios y la referencia de estilo COMMENCAL están aprobados; la composición, tipografía y recursos concretos siguen pendientes de revisión.

### Jerarquía sin repetición

- Un título principal por vista, con el nombre del contenido o la tarea actual.
- No repetir el mismo título del módulo como título de página, subtítulo, encabezado de tarjeta y título de sección si todos expresan lo mismo.
- Crear un encabezado secundario solo si identifica un bloque distinto. No añadir «Características» o «Información» encima de cada grupo por costumbre.
- Los textos de apoyo aportan información que falta; no reformulan el título para llenar espacio.
- No anteponer «Módulo de», «Gestión de» o «Sistema de» a las acciones habituales. Usar «Componentes», «Comparar» o «Mis bicicletas» según corresponda.
- Las acciones describen el resultado: «Guardar», «Cambiar horquilla», «Recuperar contraseña». Evitar botones ambiguos cuando haya varias acciones posibles.
- La concisión conserva las etiquetas de formularios, los nombres accesibles y el contexto que se necesita para decidir. No sustituir una etiqueta necesaria por un placeholder que desaparece.

Ejemplo de jerarquía redundante que se debe evitar:

```text
Características de suspensiones
  Características de suspensiones
    Características
      Características de la horquilla
```

Una jerarquía útil identifica contenidos distintos:

```text
Suspensión / Horquillas
  Fox 36 Factory
    Especificaciones
      Recorrido       160 mm
      Tamaño de rueda 29 pulgadas
    Ajustes
      Compresión y rebote
```

Los valores del ejemplo son ilustrativos. La implementación muestra únicamente los datos que correspondan a la variante documentada.

### Vocabulario de usuario, separado del código

Los identificadores del backend pueden ser técnicos. Las etiquetas y mensajes visibles se eligen por su significado para la persona, no mediante una conversión automática de guiones bajos o mayúsculas.

| Identificador o expresión interna | Presentación según contexto |
| --- | --- |
| `build_items` | «Componentes» dentro de la bicicleta |
| `slot: front_tire` | «Neumático delantero» |
| `variant_id` | Nombre y medida de la variante, sin mostrar su UUID |
| `default_finish` | «Acabado original» cuando ese sea su significado |
| `observation_default` / «Observation Default» | «Observación» o «Nota» según el contenido; no crear ese campo solo por el ejemplo |
| `representation: generic` | «Vista simplificada» |
| `SAVE_CONFLICT` / diferencia de revisiones | «Este montaje cambió en otra pestaña. Recárgalo o guarda una copia» |
| `INCOMPATIBLE_AXLE` | «El eje de esta rueda no coincide con el de la horquilla. Puedes verla igualmente en el montaje» |
| `image_key`, GLB, RPC, RLS, manifest, shader | No se muestran como etiquetas de la experiencia normal |

La tabla establece ejemplos de redacción, no nuevas funciones, campos o valores del servidor. El vocabulario definitivo se mantiene junto a los contratos reales de cada módulo. Un concepto conserva el mismo nombre en catálogo, ficha, configurador y guardado; no alternar «build», «ensamble» y «montaje» para la misma configuración. En navegación se mantiene el nombre acordado «Mis bicicletas».

El catálogo sí puede explicar términos propios de ciclismo que ayudan a elegir: recorrido, rebote, compresión, estándares de eje o denominaciones comerciales. Se conserva la precisión y se aporta una explicación breve cuando sea necesaria. Marcas, modelos y nombres de tecnologías no se traducen de forma que cambie su significado. El lenguaje de implementación del software no aporta esa información y no se expone al usuario.

### Mensajes y formatos

- Convertir estados, enums y códigos a un vocabulario español coherente; las excepciones son nombres propios y términos de producto necesarios.
- Cada error explica lo que ocurrió y la acción disponible. No mostrar SQL, trazas, nombres de tablas ni texto bruto de un SDK.
- Un error desconocido tiene un mensaje seguro; uno conocido conserva su causa útil. No reducir todos los errores a «Algo salió mal» ni añadir números de diagnóstico sin utilidad para la persona.
- Mantener unidades, decimales y fechas comprensibles y consistentes; no presentar valores técnicos sin unidad ni null/undefined como texto.
- No usar «predeterminado», «final», «base» o «activo» como sufijos automáticos de todos los campos. Se utilizan solo cuando distinguen una opción real y necesaria.
- Un aviso importante se ubica junto a la decisión afectada. No repetir el mismo párrafo en cabecera, tarjeta y pie de página.
- La redacción respeta el comportamiento acordado: un montaje incompatible puede aplicarse; una representación aproximada no se presenta como un modelo certificado.

Esta revisión editorial se hace por recorrido y contexto, además de comprobar los mapeos de mensajes. Buscar palabras repetidas de forma automática no demuestra por sí solo que la jerarquía sea correcta.

### Voz del producto: directa y propia de MTB

Regla aprobada para toda la interfaz: escribir desde el producto y la tarea del ciclista. No incluir comentarios que narren la pantalla, expliquen obviedades o suenen a un asistente dando orientación genérica. Evitar «Aquí puedes ver…», «En esta sección encontrarás…», «Mejora tu experiencia validando…», «Te ayudamos a gestionar…» y párrafos de relleno sobre beneficios sin contenido concreto. La regla incluye portada, formularios, fichas, estados vacíos, diálogos y textos accesibles.

| Texto a evitar | Alternativa contextual |
| --- | --- |
| «Aquí puedes ver todas tus bicicletas guardadas» | Título «Mis bicicletas» y la lista, sin subtítulo |
| «Personaliza tu experiencia según tus gustos y necesidades» | «Tu próximo montaje empieza aquí» en portada |
| «En este apartado puedes seleccionar una suspensión» | Etiqueta «Horquilla» y el selector |
| «Mejora tu experiencia validando la compatibilidad» | Aviso concreto: «El eje no coincide con el de la horquilla» |
| «Aquí podrás guardar y administrar tus configuraciones» | Estado vacío «Aún no tienes bicicletas guardadas» y acción «Crear mi bicicleta» |
| «Utiliza el botón para guardar tus cambios» | Botón «Guardar» y estado «Cambios sin guardar» |

No eliminar información útil por parecer explicativa: errores, requisitos de acceso, unidades, fuentes, precios orientativos y límites de una representación deben seguir claros. «Elige un cuadro para empezar» resuelve un paso pendiente; «Aquí puedes mejorar tu experiencia» no aporta una decisión. No añadir referencias a IA, desarrollo, arquitectura o características internas como argumento comercial de la interfaz.

## Dirección visual

Referencia de estilo elegida por el usuario: [portada de COMMENCAL](https://www.commencal.com/es/homepage.html?lang=es_FR), consultada el 18 de octubre de 2026. La página consultada combina entradas editoriales de producto, imágenes, títulos breves y acciones de descubrimiento. La extracción disponible no permite verificar visualmente sus animaciones o sus tiempos; el movimiento descrito abajo es una propuesta propia para ATLAS MTB basada en la dirección solicitada.

Interpretación aprobada de la referencia: limpieza, protagonismo de la bicicleta, jerarquía marcada y carácter deportivo que puede ser agresivo en momentos concretos. Aplicación a ATLAS MTB:

- Grandes superficies visuales, encuadres de bicicleta completa y detalles de componentes; espacio suficiente entre elementos.
- Base de blanco, negro y grises; contraste fuerte donde aporte carácter. Acento puntual, todavía por definir con la identidad. La anterior sugerencia de verde/terracota deja de ser la dirección preferente.
- Titulares cortos con presencia; mayúsculas opcionales en portada y etiquetas breves. Texto de lectura y formularios mantienen una tipografía cómoda.
- Composición editorial en portada y fichas; controles discretos y precisos en el configurador. No trasladar un titular gigante a una pantalla de trabajo donde reste espacio a la bicicleta.
- Botones de forma sencilla, bordes nítidos y pocas sombras. El carácter viene del encuadre, contraste y tipografía, no de sumar adornos.
- Intensidad visual concentrada en la portada y momentos de selección; navegación, acceso y guardado conservan calma y previsibilidad.

La referencia se aplica al estilo UI/UX. Contenido, orden de vistas, acciones y marca pertenecen a ATLAS MTB. No trasladar tienda, carrito, promociones, categorías comerciales o extensión de la portada de COMMENCAL al alcance. Los recursos de presentación se preparan para nuestro producto; no se reutilizan su logotipo ni textos como contenido propio. Las fotografías externas de la nueva portada se seleccionan con fuente y licencia registradas, sin atribuirlas a ATLAS ni a un montaje generado por la aplicación.

La marca aprobada es **ATLAS MTB** y el eslogan es **Cada pieza define tu camino**. El diseño anterior de pantallas puede sustituirse por completo. Los wireframes describen jerarquía y posiciones; no son el diseño final ni obligan a reproducir cada caja como una tarjeta.

### Logotipo y uso de marca

El futuro logotipo debe ser la representación principal de ATLAS MTB: profesional, elegante, visualmente cuidado y reconocible. La palabra MTB es parte permanente del nombre completo, legible con una jerarquía secundaria. El nombre y el eslogan están aprobados; símbolo, tipografía y colores definitivos todavía deben diseñarse y revisarse.

Entregables previstos para la etapa de implementación:

- Símbolo compacto para cabeceras reducidas, favicon y espacios donde no cabe la firma completa.
- Firma principal con el nombre completo y eslogan para fondo claro.
- Firma para fondo oscuro con la misma identidad y contraste adaptado.
- Archivos maestros vectoriales, proporciones y márgenes de uso documentados.

Como dirección a explorar se puede considerar un monograma A y un recorrido, con una firma tipográfica limpia y acentos sobrios de terreno. Esa idea y cualquier paleta son alternativas de diseño, no elementos aprobados ni recursos ya creados. No utilizar una captura rasterizada como archivo maestro. Crear y revisar los recursos gráficos solo cuando se inicie su implementación; esta planificación no sustituye el logo actual del prototipo.

Usar la firma principal a partir de unos 360 px de anchura cuando incluya el eslogan. En espacios pequeños usar el símbolo junto al nombre en texto de interfaz y presentar el eslogan solo si sigue legible. Conservar la proporción, un margen libre de al menos un cuarto del símbolo y suficiente contraste. No estirar, añadir efectos de volumen o repetir el nombre/eslogan al lado de una firma que ya los contiene.

El eslogan acompaña presentaciones de marca; no se repite como subtítulo de cada sección. La navegación normal prioriza la tarea de cada pantalla. Validar el símbolo a 24 y 32 px y la firma en claro, oscuro, escritorio y móvil. El texto alternativo nombra ATLAS MTB una sola vez; si la marca está escrita junto al símbolo, este puede ser decorativo para evitar lectura duplicada.

| Elemento | Dirección prevista |
| --- | --- |
| Fondo | Blanco o gris muy claro en vistas de trabajo; portada puede usar un plano oscuro |
| Superficies | Separación por espacio y contraste; bordes discretos |
| Texto | Negro/grafito sobre claro, blanco sobre oscuro; contraste comprobado |
| Acento | Uno puntual a definir con la marca, sin teñir todo el producto |
| Tipografía | Sans con carácter en titulares y lectura clara en controles; máximo dos familias |
| Forma | Botones nítidos, esquinas rectas o discretas; evitar píldoras y tarjetas por costumbre |
| Imagen | Bicicleta protagonista y acercamientos selectivos; iluminación y encuadre cuidados |
| Movimiento | Breve y con propósito; reglas en el apartado siguiente |

Los valores finales se concretan al diseñar. Verificar contraste AA para texto y controles. No depender del color para comunicar estado. El visor usa iluminación neutra para que el tratamiento editorial de la portada no altere los colores elegidos en el montaje.

### Movimiento y bicicleta dinámica

El movimiento forma parte de la dirección solicitada. La implementación debe incluir respuesta visual en las interacciones relevantes, sin añadir una librería de animación o un visor público por anticipación.

| Contexto | Comportamiento previsto | Límite |
| --- | --- | --- |
| Portada | Dirección actual solicitada: fotografías reales de MTB que alternan mediante fundido y acercamiento sutil | Una sola zona animada, sin sonido; mantener una foto disponible si falla otra y conservar las acciones si fallan todas |
| Botones y navegación | Cambios de contraste y respuesta de pulsación/foco | 120–180 ms como referencia; no desplazar el objetivo bajo el cursor |
| Selectores y paneles | Apertura/cierre breve que conserve orientación y espacio de trabajo | 180–240 ms como referencia; sin bloquear teclado o nuevas acciones |
| Configurador | Transición de cámara al elegir una vista y cambio de acabado visible | 250–450 ms como referencia; interrumpible; no animar un cambio de tamaño como si fuera una simulación física |
| Cambio de componente | Mantener contexto, mostrar carga local si hace falta y presentar la pieza elegida | No hacer desaparecer toda la bicicleta ni añadir explosiones de piezas decorativas |

La petición del usuario del 19/10/2026 sustituye la preferencia anterior de una secuencia prerenderizada y la exclusión de carrusel: la portada usa una campaña breve de fotografías reales que cambian automáticamente, con titulares y acciones fijos. No incorpora promociones comerciales ni un editor público. Intervalo inicial de seis segundos; controles manuales y pausa. Las imágenes se descargan y optimizan como assets locales, con autor/fuente registrados; no se cargan desde webs de terceros en cada visita. La primera imagen se prioriza y las siguientes se preparan progresivamente.

Si el movimiento de portada se reproduce en bucle, ofrecer un control discreto y accesible «Pausar animación»/«Reproducir animación». Respetar `prefers-reduced-motion`: imagen fija y cambios de interfaz sin desplazamientos animados. No bloquear el acceso por una reproducción automática denegada. Pausar el recurso cuando la pestaña esté oculta o salga de pantalla. Evitar destellos, paralaje intenso, scroll secuestrado, rotación automática del montaje durante edición y animaciones constantes de controles.

La acción principal y el texto se muestran sin esperar vídeo o animación de entrada. Verificar móvil real, teclado, foco, movimiento reducido y fallo de recursos. Si el recurso dinámico no cumple el rendimiento previsto, ajustar su peso o tratamiento visual; el acceso y el catálogo deben seguir operativos con la imagen estática.

## Composiciones y recorridos

Las pantallas se separan por recorrido para mantener este documento centrado en los principios compartidos, sin duplicar esquemas:

| Documento | Contenido principal |
| --- | --- |
| [06a · Portada y acceso](06a-portada-y-acceso.md) | Gancho de entrada, inicio de sesión, registro, confirmación de correo y adaptación móvil |
| [06b · Espacio de trabajo](06b-espacio-de-trabajo.md) | Pestañas, bicicletas, componentes, fichas laterales, configurador, comparación, Mis bicicletas y conservación del trabajo |
| [06c · UI administrativa](06c-administracion-usuarios-roles-y-permisos.md) | Usuarios, roles, paneles de creación/detalle y matriz de permisos |

Los bocetos aprobados se conservan en esos documentos. La separación no cambia el alcance, las decisiones ni su estado de planificación.

## Accesibilidad y estados transversales

- Controles con nombre visible, foco perceptible y objetivo táctil de al menos 44 px como meta de diseño.
- Diálogos con foco contenido, cierre con Escape y retorno al control que los abrió.
- La lista de piezas permite operar todo sin seleccionar mallas en el canvas.
- Estado «Datos insuficientes» acompañado de texto e icono; nunca solo color.
- Estados de carga no mueven los controles de manera brusca; operaciones largas tienen descripción.
- Error gráfico mantiene catálogo, lista y guardado. Error de red mantiene el borrador editable.
- Toda acción visible funciona en la fase entregada; las pendientes se omiten o se identifican sin fingir interacción.

El acabado final se revisa junto con los recorridos, las proporciones y la referencia visual elegida. La elegancia proviene de jerarquía, alineación, espacio y consistencia, no de aumentar efectos visuales.


### Revisión de identidad y portada · 19/10/2026

Cambio de dirección solicitado: una firma ATLAS MTB propia, más llamativa y profesional; escaparate fresco, informal y agresivo ligado a downhill/enduro. Monograma geométrico inclinado, firma de letras vectoriales y corte de velocidad; versión clara/oscura y símbolo de favicon. Conservar nombre/eslogan. Titular de portada Barlow Condensed 800 italic con escala grande y acento lima; textos y formularios conservan legibilidad. La intensidad no se traslada a las tablas o al configurador. La composición y los estados están en 06a; el usuario aprobó el resultado visual final, incluidas las fotografías revisadas. Evidencia técnica en 12.

### Transiciones compartidas solicitadas · 19/10/2026

Extender el movimiento al espacio de trabajo, acceso y administración sin cambiar los bocetos aprobados. Implementación del movimiento de fase 1 de 08, aplicada a las superficies de las fases siguientes: CSS compartido para respuesta de controles/selecciones y entrada de paneles, tarjetas, avisos y desplegables; una región reutilizable para fundir contenido al cambiar de sección o selección sin remontar formularios, reiniciar filtros o recrear la escena 3D. Sin dependencias nuevas.

```text
Pestañas   [Bicicletas] [Componentes] [Mis bicicletas]
                         └─ marca activa breve + contenido aparece
Tarjeta    [ imagen / nombre / acción ] → énfasis al foco y al puntero
Detalle    escritorio: derecha → centro | móvil: abajo → arriba
Formulario [campo enfocado] → borde visible | [guardar] → pulsación breve
Avisos     aparecen suavemente; acciones disponibles desde el inicio
```

Duración orientativa: controles 120–160 ms, contenido 180 ms y paneles 220 ms. Desplazamiento pequeño solo en superficies nuevas; nunca en campos mientras se escribe ni en la geometría del montaje. Los diálogos conservan modalidad nativa, Escape, retorno de foco y confirmaciones de cambios sin guardar. Su entrada se anima; el cierre mantiene ejecución inmediata para no retrasar navegación, guardado o confirmaciones. No escalonar listas largas ni añadir esperas de interacción. Hover solo para dispositivos con puntero preciso; teclado y pulsación reciben respuesta equivalente.

Con movimiento reducido se eliminan animaciones/desplazamientos y transiciones; la cancelación se aplica también si la preferencia cambia durante una animación. La portada mantiene su campaña ya aprobada. Aceptación: recorridos de pestañas/catálogo/acceso sin pérdida de estado, apertura/cierre y foco de paneles en escritorio/móvil, selección en configurador/administración y preferencia reducida; ejecutar build y pruebas pertinentes, registrar alcance y límites en 12.

### Ancho adaptable de vistas · ajuste solicitado 19/10/2026

Las vistas de trabajo deben utilizar el ancho disponible: retirar el tope central de 1440 px en `.content`, con separación lateral compartida `clamp(20px, 3vw, 56px)`. Alinear cabecera de trabajo, pestañas, contenido y pie. Aplicar a catálogo, bicicletas, montajes, comparación y administración; las tablas usan su desplazamiento interno cuando lo requieren. El configurador mantiene su escena flexible y panel de selección. La composición de portada aprobada conserva su tratamiento.

```text
Pantalla normal: | margen | categorías | 3–4 tarjetas | margen |
Pantalla amplia: | margen | categorías | más columnas             | margen |
Móvil:           | margen | controles y 2 tarjetas | margen |
```

Rejillas de componentes/cuadros calculadas por ancho mínimo legible y ancho real; sin ampliar siempre las mismas tres tarjetas. Bicicletas/montajes adaptan sus columnas; las imágenes conservan proporción y un alto razonable en pantallas grandes. Mantener límites de lectura en formularios cortos y estados de texto, con estructura exterior flexible; no convertir campos de acceso en una línea del ancho del monitor. Validar 360/393, 1440, 1920 y 2560 px, conservación de contexto y ausencia de desplazamiento horizontal accidental. Este ajuste se implementa y valida en fases 1/3/6 de 08, con evidencia en 12.

### Selección visual del configurador

Ampliación solicitada en [06e](06e-armado-guiado.md): clic vacío limpia únicamente el resaltado 3D, conservando el panel. La pieza seleccionada usa un pulso lento de emisión; solo esta selección activa y la inspección de suspensión autorizada en 05c pueden mantener animación durante el trabajo. Parar el pulso al deseleccionar u ocultar pestaña; con movimiento reducido, resaltado fijo. No modificar pintura, geometría, miniaturas ni datos por el pulso.
