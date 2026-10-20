# 06a · Portada, inicio de sesión y registro

Relacionado: [principios UI/UX](06-ui-y-ux.md), [espacio de trabajo](06b-espacio-de-trabajo.md), [Auth](04-autenticacion-y-acceso.md) y [fases](08-fases-y-validacion.md).

Estado: referencia de composición durante implementación parcial. La revisión de portada solicitada el 19/10/2026 se describe abajo; la aceptación y sus límites se registran en 12. Se conservan las composiciones aprobadas de acceso.

## Estructura de navegación y portada pública

Decisión confirmada: portada, catálogo, fichas y comparación públicos; configurador, avisos de montaje, guardado y «Mis bicicletas» requieren sesión. Una cuenta no implica un servicio de pago. El contenido y la distribución siguientes son una propuesta de UI para revisar; no constituyen un diseño visual aprobado ni pantallas implementadas.

La portada funciona como gancho visual para entrar. Una cabecera sencilla, una imagen protagonista, una frase breve y una acción principal bastan. El catálogo sigue accesible mediante un enlace secundario; las herramientas completas y la navegación de trabajo se presentan en sus vistas. No incluir tarjetas de funcionalidades, categorías, tutoriales, tablas técnicas o secciones comerciales en la portada.

```text
+----------------------------------------------------------------------------------+
| ATLAS MTB                                           Catalogo       [Entrar]      |
+----------------------------------------------------------------------------------+
|                                                                                  |
| Cada pieza define tu camino                                                      |
|                                                                                  |
| Tu próximo montaje empieza aquí.                  [Bicicleta protagonista]       |
| Enduro y descenso. Piezas y colores                                              |
| para un montaje con tu estilo.                                                   |
|                                                                                  |
| [Comenzar]                                                                       |
| Inicia sesion o crea tu cuenta.                                                  |
|                                                                                  |
|                                             Representacion aproximada            |
+----------------------------------------------------------------------------------+
```

Texto propuesto, sujeto a revisión visual. «Comenzar» conserva la intención de crear una bicicleta y abre el acceso si no hay sesión; con sesión y permiso abre el configurador. «Entrar» aplica el [destino por permisos de 04](04-autenticacion-y-acceso.md#destino-después-del-acceso). El eslogan aparece una vez. El enlace «Catálogo» permite explorar sin cuenta y no compite visualmente con la acción principal.

La imagen o secuencia dinámica es ilustrativa, no un editor público. En móvil se conserva frase, acción e imagen sin añadir bloques explicativos. El detalle de cómo funciona cada herramienta se muestra donde se usa. No generar recursos gráficos ni implementar pantallas en esta etapa.

Comportamiento de las acciones:

- «Catálogo» abre el catálogo público. Sus categorías y filtros se muestran allí, no en la portada.
- «Comenzar» en portada o «Crear mi bicicleta» en las vistas de trabajo abre el configurador si hay sesión y permiso y solicita acceso si no hay sesión, conservando esa intención. Tras entrar se elige una base; no se guarda automáticamente. Una denegación de permiso no vuelve a solicitar login.
- «Probar», desde una ficha o comparación, mantiene la variante elegida durante el acceso. Tras entrar se revisa su disponibilidad y se incorpora a un montaje cuando haya base, conservando el montaje abierto de esa cuenta cuando corresponda.
- «Entrar» continúa una intención válida autorizada; sin ella lleva a «Mis bicicletas» si existe `builds.read_own`, o a «Componentes» en caso contrario, conforme a 04. Cancelar una solicitud de acceso devuelve al origen público.
- Con sesión activa, la cabecera ofrece «Mis bicicletas» cuando existe permiso de lectura propia y el menú de cuenta. El acceso público al catálogo permanece igual.

Sin estadísticas inventadas, testimonios ficticios, sellos de compatibilidad, contadores de usuarios o promesas de actualización automática. No incluir precios en portada, planes de membresía ni un formulario comercial para talleres. Los precios de referencia sí pueden aparecer en las vistas de componentes. La portada presenta el producto acordado; no promete funciones profesionales futuras. El taller puede usar la misma experiencia de catálogo y montaje que un ciclista.

## Acceso y registro: composición aprobada

El usuario aprobó las siguientes vistas tal como se presentaron: composición dividida en escritorio, imagen de bicicleta a la izquierda y formulario a la derecha; en móvil, formulario sin panel fotográfico. Estos esquemas sustituyen la propuesta anterior de formulario centrado. No reinterpretar esta aprobación como autorización de implementación. El recurso fotográfico, la tipografía concreta y los valores finales de estilo se preparan después, respetando esta distribución y la dirección COMMENCAL.

### Inicio de sesión en escritorio

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ ATLAS MTB                                               Volver al inicio│
├──────────────────────────────────────┬───────────────────────────────────┤
│                                      │                                   │
│                                      │   Iniciar sesión                  │
│                                      │                                   │
│    DETALLE DE BICICLETA               │   Correo electrónico              │
│    Cuadro, horquilla y rueda          │   [___________________________]   │
│                                      │                                   │
│    Encuadre amplio                    │   Contraseña                      │
│    Fondo oscuro                       │   [____________________] [Mostrar]│
│    Imagen estática                    │                                   │
│                                      │   ¿Olvidaste tu contraseña?        │
│                                      │                                   │
│                                      │   [          Entrar           ]   │
│                                      │                                   │
│                                      │   ¿No tienes cuenta? Crear cuenta  │
│                                      │                                   │
│ Cada pieza define tu camino          │                                   │
└──────────────────────────────────────┴───────────────────────────────────┘
```

Los rótulos dentro del panel de imagen son anotaciones del esquema, no textos que se imprimen sobre la fotografía. El eslogan sí se presenta una vez en ese panel. No añadir párrafos introductorios debajo de «Iniciar sesión».

### Registro en escritorio

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ ATLAS MTB                                               Volver al inicio│
├──────────────────────────────────────┬───────────────────────────────────┤
│                                      │                                   │
│                                      │   Crear cuenta                    │
│                                      │                                   │
│                                      │   Correo electrónico              │
│                                      │   [___________________________]   │
│    MISMA DIRECCIÓN VISUAL             │                                   │
│    DE BICICLETA                       │   Contraseña                      │
│                                      │   [____________________] [Mostrar]│
│                                      │   Requisitos de contraseña        │
│                                      │                                   │
│                                      │   Confirmar contraseña            │
│                                      │   [____________________] [Mostrar]│
│                                      │                                   │
│                                      │   [       Crear cuenta        ]   │
│                                      │                                   │
│                                      │   ¿Ya tienes cuenta? Iniciar sesión│
│ Cada pieza define tu camino          │                                   │
└──────────────────────────────────────┴───────────────────────────────────┘
```

Solo correo, contraseña y confirmación. No añadir nombre, teléfono, disciplina favorita, membresía ni datos de perfil. «Requisitos de contraseña» es una anotación: en la pantalla se muestran los requisitos reales configurados en Supabase, no esa frase genérica. No inventar una política distinta. La confirmación comprueba coincidencia en el formulario y no se almacena ni se envía como un dato adicional de cuenta.

### Confirmación de correo

Después de procesar el registro se sustituye el formulario por este estado, conservando la estructura visual del acceso:

```text
Revisa tu correo

Enviamos un enlace de confirmación a
nombre@correo.com.

[ Reenviar enlace ]

Volver a iniciar sesión
```

La dirección es la utilizada en el registro, no el ejemplo literal. No se declara una sesión activa hasta confirmarla mediante Auth. «Reenviar enlace» muestra progreso y el tiempo de espera aplicable, respeta los límites del servicio y evita envíos duplicados. Los fallos de red o envío no se presentan como éxito. El callback muestra progreso y después continúa o presenta un error recuperable, según el [contrato de acceso](04-autenticacion-y-acceso.md).

### Acceso en móvil

```text
┌────────────────────────────────┐
│ ATLAS MTB              Volver  │
│                                │
│ Iniciar sesión                 │
│                                │
│ Correo electrónico             │
│ [__________________________]   │
│                                │
│ Contraseña                     │
│ [_________________] [Mostrar]  │
│                                │
│ ¿Olvidaste tu contraseña?       │
│                                │
│ [          Entrar          ]   │
│                                │
│ ¿No tienes cuenta?             │
│ Crear cuenta                   │
└────────────────────────────────┘
```

Para invitaciones administrativas se usa la misma composición visual con «Define tu contraseña», contraseña y confirmación, sin selector de rol ni petición de datos de perfil. Solo se abre tras verificar invite; la asignación real se obtiene del servidor. El registro público conserva correo/contraseña/confirmación y nunca incorpora un campo de rol.

Registro móvil conserva esta estructura y añade confirmación de contraseña, requisitos reales, botón «Crear cuenta» y enlace «Iniciar sesión». El estado de confirmación de correo ocupa la misma columna. No mostrar panel fotográfico, eslogan decorativo o una escena 3D antes de los campos. Asegurar que el teclado permita alcanzar campos y acciones, con desplazamiento cuando haga falta; no forzar una altura fija de pantalla que recorte el registro.

### Estilo, controles y comportamiento

- Formulario sobre fondo claro, texto oscuro y botón de alto contraste. Panel de imagen oscuro, encuadre amplio de cuadro, horquilla y rueda; imagen estática y sin visor 3D decorativo.
- Cabecera con la marca y retorno. «Volver al inicio» si el origen fue portada; «Volver al catálogo» o «Volver a la ficha» cuando corresponda. En móvil puede abreviarse visualmente a «Volver», manteniendo un nombre accesible que identifique el destino.
- Etiquetas persistentes sobre los campos. Correo con autocompletado de email; contraseña de acceso como contraseña actual y las de registro como contraseña nueva. Permitir pegar y utilizar gestores de contraseñas.
- «Mostrar»/«Ocultar» cambia solo la visibilidad del campo correspondiente, no envía el formulario ni borra el valor; nombre accesible específico para contraseña o confirmación.
- Error junto al campo afectado o al formulario para errores de acceso/red. Conservar el correo y evitar que el mensaje desplace bruscamente los controles. Una contraseña incorrecta no se confunde con un fallo de conexión.
- Durante el envío, progreso en la acción y protección contra envíos duplicados. No borrar valores por un fallo recuperable; nunca persistir contraseñas en almacenamiento local ni conservarlas después de completar el flujo.
- Recuperación pide solo correo. «Nueva contraseña» se habilita tras verificar la recuperación. Reutilizar estructura, controles y estilos sin convertir todas las pantallas en un formulario genérico con campos innecesarios.

Los títulos normales permanecen «Iniciar sesión» y «Crear cuenta», incluso al llegar desde «Probar». La intención se conserva internamente sin añadir otra explicación de la pantalla. Tras completar el acceso se consulta el permiso vigente y se aplica la regla única de destino de 04; user/admin mantienen el recorrido aprobado y los roles personalizados continúan solo acciones autorizadas. Un rol sin permiso no abre el editor ni recibe un guardado aparente, y una sesión válida no entra en bucle de login por autorización denegada. Si se cancela, se vuelve al origen público. La sesión caducada admite el título contextual «Vuelve a entrar para continuar» y recuperación local solo de esa cuenta cuando conserve los permisos necesarios.


## Revisión de portada solicitada · 19/10/2026

Sustituir la ilustración principal por tres fotografías reales de MTB, conservando el eslogan y los destinos de acceso. Se implementa como campaña visual con texto y acción fijos, no como catálogo, tienda o tutorial.

```text
ESCRITORIO
+------------------------------------------------------------------+
| [ATLAS MTB · firma angular]                  Catálogo    [Entrar] |
+------------------------------------------------------------------+
|                                                                  |
| ENDURO / DESCENSO                                                |
| CADA PIEZA                   FOTOGRAFÍA REAL                      |
| DEFINE TU                    de sendero / bicicleta / acción       |
| CAMINO.                      con recorte cuidado                   |
| Tu bici. Tus reglas.                                             |
| [Crear mi bicicleta ↗]                                           |
| Explorar componentes                01 / 03   [←] [Ⅱ] [→]         |
|                           Crédito fotográfico                     |
+------------------------------------------------------------------+

MÓVIL
+--------------------------------+
| [ATLAS MTB]  Catálogo  [Entrar] |
+--------------------------------+
|       FOTOGRAFÍA DE FONDO       |
| ENDURO / DESCENSO              |
| CADA PIEZA                     |
| DEFINE TU                      |
| CAMINO.                        |
| Tu bici. Tus reglas.           |
| [Crear mi bicicleta ↗]         |
| Explorar componentes           |
| 01 / 03    [←] [Ⅱ] [→]         |
| Crédito fotográfico            |
+--------------------------------+
```

- Fondo carbón y fotografías a sangre; gradiente para sostener contraste. Tipo pesado e inclinado, lima puntual y cortes diagonales; sin destellos ni animación de títulos/acciones.
- Rotación cada seis segundos; carga prioritaria de la primera foto y preparación progresiva de la siguiente. Si una foto falla, conservar una disponible y mantener entrada/catálogo operativos.
- Pausa explícita y navegación manual con botones accesibles, estado de foto y foco visible. Pausar al ocultarse la pestaña, salir el bloque de pantalla o interactuar con ratón/teclado.
- Con movimiento reducido: imagen fija, sin avance automático ni zoom; botones para cambiar manualmente sin fundido.
- Nombre ATLAS MTB accesible una sola vez; símbolo decorativo junto a firma. El nuevo logotipo se comparte con la cabecera general, con contraste para claro/oscuro; sin rediseñar los formularios de acceso.
- Fuentes/autores de las imágenes en `src/assets/images/landing/README.md`; no se presentan como un modelo del catálogo o una composición generada por ATLAS.

Aceptación de este cambio: foto real visible en escritorio/móvil, titular y acciones estables, cambio manual/automático, pausa/movimiento reducido y error de imagen; logo legible en claro/oscuro. Registrar capturas y comprobaciones en 12. No crear commits de este cambio sin nueva solicitud explícita.

Revisión posterior del usuario: conserva logo, tipografía y composición, y solicita fotografías más potentes, expansivas y explorables. Sustituir la selección inicial por salto alpino de Leysin, salto lateral de Sun Peaks y vista aérea del trazado de Haldon Forest; encuadres con profundidad y terreno, sin modificar los destinos o el eslogan. Fuentes/autores actualizados en el README de imágenes.

Aceptación visual: el usuario aprobó el resultado final de esta portada, incluida la selección revisada de fotografías, antes de solicitar los commits por partes. Esta aceptación corresponde a portada e identidad; no cierra los pendientes del resto del proyecto.
