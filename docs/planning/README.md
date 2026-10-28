# Atlas MTB: plan de construcción

Estado: implementación autorizada por el usuario el 19 de octubre de 2026, después de los commits documentales solicitados. Comenzar por fase 0 de 08 y avanzar con comprobaciones. Los cambios se comitean únicamente por petición explícita; el registro de la ampliación comercial está en13e.

Contexto operativo vigente: proyecto Supabase Cloud creado, credenciales disponibles en `.env` de la raíz y conexiones de lectura validadas. Frontend local y backend/base directamente en Cloud; no stack local de Supabase. El usuario declara que no hay producción ni usuarios reales. Estado y límites de las comprobaciones en [07](07-entornos-y-despliegue.md); fuentes futuras del backend y procedimiento en [supabase/README.md](../../supabase/README.md). La autorización posterior del usuario inicia ahora la implementación.

Esta carpeta define en conjunto el producto, su arquitectura y el orden de implementación. La aplicación actual es una referencia de contenido y comportamiento; sus pantallas, estilos y estructura pueden sustituirse. Crear estos planes no significa que Supabase, el inicio de sesión o el visor 3D ya estén implementados. El ciclo de documentación se rige por [docs/README.md](../README.md).

## Leer por capas

| Documento | Pregunta que resuelve |
| --- | --- |
| [13 · Tienda y venta asistida](13-tienda-y-venta-asistida.md) | Nueva orientación comercial, ofertas/precios/promociones, pedidos y pagos solo de interfaz en primera fase; implementación autorizada y evidencia en13e |
| [13a · Contratos comerciales](13a-contratos-y-validacion-comercial.md) | Revisión de huecos: precio fijado al crear pedido, stock sin doble consumo, pagos de demo y carrito persistente por cuenta |
| [13b · Precios y ofertas](13b-precios-y-ofertas-comerciales.md) | Precio/stock por SKU estable, relación con revisiones3D, promociones y snapshot de pedidos; sin motor de precios extra |
| [13c · Esquema comercial](13c-esquema-comercial-y-operaciones.md) | Once tablas comerciales, campos/relaciones, cambios IAM, reservas sin duplicación, RPC, índices y aceptación por fases |
| [13d · Revisión cruzada comercial](13d-revision-cruzada-del-plan-comercial.md) | Tres agentes y segunda revisión; brechas corregidas, pruebas obligatorias y límites del dictamen documental |
| [13e · Implementación comercial](13e-evidencia-de-implementacion-comercial.md) | Migraciones028–037, precios/stock demo, carrito, cotizaciones/pedidos y pruebas Cloud/navegador; aceptación visual pendiente |
| [01 · Producto y alcance](01-producto-y-alcance.md) | Qué construimos, para quién y con qué nivel de fidelidad |
| [02 · Arquitectura y frontend](02-arquitectura-y-frontend.md) | Cómo se relacionan React, el visor, Supabase y Netlify |
| [03 · Datos y operaciones](03-datos-y-operaciones.md) | Ingesta, composiciones, guardado, archivo, consultas e índices |
| [03a · Esquema y campos](03a-esquema-y-campos.md) | Árbol de ocho tablas de negocio, tipos, relaciones y estructuras JSONB |
| [04 · Autenticación y acceso](04-autenticacion-y-acceso.md) | Registro, acceso común, confirmación, invitación y recuperación |
| [04a · IAM](04a-iam-roles-y-permisos.md) | Cuatro tablas de autorización, roles configurables, permisos y restricciones |
| [04b · Administración](04b-administracion-y-operaciones.md) | Primer administrador, usuarios, roles y edición/publicación del negocio |
| [05 · Configurador 3D](05-configurador-3d.md) | Modelos, geometría por código, ensamblaje y rendimiento |
| [05a · Fidelidad por modelo](05a-fidelidad-modelos.md) | Mejora exterior de los 53 modelos, referencias y conservación de versiones |
| [05b · Miniaturas](05b-miniaturas-montajes.md) | Portadas del estado guardado, captura y persistencia protegida |
| [05c · Movimiento de suspensión](05c-movimiento-suspension.md) | Inspección temporal de compresión por recorrido y cinemática por modelo |
| [05d · Revisión integral de cuadros](05d-revision-integral-cuadros.md) | Rúbrica multivista y mejora versionada de los quince cuadros |
| [06 · UI y UX](06-ui-y-ux.md) | Principios de contenido, dirección visual, marca, movimiento y accesibilidad |
| [06a · Portada y acceso](06a-portada-y-acceso.md) | Composición de portada, entrada, registro y confirmación de correo |
| [06b · Espacio de trabajo](06b-espacio-de-trabajo.md) | Pestañas, galerías, tarjetas, paneles, configurador y Mis bicicletas |
| [06c · UI administrativa](06c-administracion-usuarios-roles-y-permisos.md) | Tablas de usuarios/roles, paneles derechos y matriz de permisos por rol |
| [06d · Administración de negocio](06d-administracion-catalogo-y-prearmadas.md) | Tablas y paneles de catálogo/prearmadas aprobados durante implementación |
| [06e · Armado guiado](06e-armado-guiado.md) | Índice de piezas, grupos, medidas, pares y paletas del configurador |
| [06f · Administración modular](06f-administracion-modular-y-componentes.md) | Grupos y secciones, reutilización React, paneles y acciones siempre visibles |
| [07 · Entornos y despliegue](07-entornos-y-despliegue.md) | Variables, Git, Supabase y publicación del frontend |
| [08 · Fases y validación](08-fases-y-validacion.md) | Qué construir primero y cómo comprobar cada entrega |
| [09 · Revisión adversarial de datos](09-revision-adversarial-de-datos.md) | Revisión histórica de ocho tablas de negocio |
| [10 · Auditoría integral](10-auditoria-integral-de-planes.md) | Revisión adversarial de todo el plan, incluyendo IAM; correcciones y pendientes |
| [12 · Estado de implementación](12-estado-implementacion.md) | Evidencia real, integración Cloud y pendientes de ejecución |
| [12z · Administración modular](12z-evidencia-administracion-modular.md) | Paneles reutilizados, matriz única, listados acotados y comprobaciones Cloud/navegador |
| [12f · Pasos v11](12f-evidencia-pasos-v11.md) | Continuidad de aberturas, pared interior de dirección y conservación de v10 |
| [12k · CHERRY BOMB completo v16](12k-evidencia-cherry-bomb-v16.md) | Perfiles hidroformados propios, pipa cónica y balancín perforado, con revisión cruzada |
| [12n · Furious V3 2021 v19](12n-evidencia-furious-v19.md) | Silueta 2021, soporte acampanado, bieleta y revisión de articulación |
| [12o · Fury Carbon High Pivot v20](12o-evidencia-fury-v20.md) | Perfil 2023+, ventana inferior, yugo sólido y revisión de montaje |
| [12p · META SX V5 v21](12p-evidencia-meta-v21.md) | Perfil propio, doble enlace VCS, apoyos y conservación |
| [12q · Nomad 7 CC v22](12q-evidencia-nomad-v22.md) | VPP propio, cuna abierta y tija alineada |
| [12r · S-Works Enduro v23](12r-evidencia-enduro-v23.md) | Cuna baja, tres enlaces y tija versionada |
| [12s · Sender CFR MY25 v24](12s-evidencia-sender-v24.md) | Generación correcta, anclajes y movimiento propios |
| [12t · SUPREME DH V5 v25](12t-evidencia-supreme-v25.md) | Perfil propio, HVCS exterior, vídeos y pasos completos |
| [12u · TUES MK4 Carbon v26/v27](12u-evidencia-tues-v26.md) | Perfil propio, Flip Link, punteras y transición individual M/L |
| [12v · TUES MK4 adversarial v28](12v-evidencia-tues-v28.md) | Tres agentes, contornos fotográficos, registro sin cizalla y publicación individual |
| [12w · Paredes TUES v29](12w-evidencia-caras-tues-v29.md) | Corrección de caras invertidas, forma aprobada intacta y regresión FrontSide |
| [12m · FRS V3 Pure White v18](12m-evidencia-frs-v18.md) | Perfil propio, bieleta, protecciones y fotografía original del cuadro |
| [12l · Force Carbon High Pivot v17](12l-evidencia-force-v17.md) | Reconstrucción individual publicada, triángulo GT y bieleta calada; evidencia y límites |
| [12j · CAPRA completo v15](12j-evidencia-capra-trayectos-v15.md) | Rectas longitudinales, radios locales y revisión cruzada contra fotografías |
| [12i · CAPRA v14](12i-evidencia-capra-v14.md) | Corrección individual de llegadas y diagonal inmediata del CAPRA MK3 MX |
| [12h · Continuidad localizada v13](12h-evidencia-uniones-v13.md) | Cinco cuadros protegidos y empalmes corregidos en los otros diez |
| [12g · Dirección exterior v12](12g-evidencia-direccion-v12.md) | Revisión retirada por el usuario; restaurado v11, recursos y evidencia histórica |
| [12e · Cuadros v10](12e-evidencia-cuadros-v10.md) | Revisión de quince cuadros, fuentes multivista, publicación y conservación del historial |
| [12d · Rendimiento de consultas](12d-rendimiento-consultas.md) | Auditoría SQL/red, caché, transferencia y selección 3D |
| [12c · Continuidad multivista](12c-evidencia-continuidad.md) | Conexiones exteriores v6, frenos v7, referencias e inferencias |
| [12b · Evidencia de geometría](12b-evidencia-geometria.md) | Cobertura de modelos, conservación de versiones y límites de parecido |
| [11 · Inventario e ingesta documental](11-propuesta-de-inventario.md) | Índice de 11a–11n: gama actual por categoría, modelos, campos y validaciones; datos concretos por completar |

```mermaid
flowchart TD
  A[01 Producto] --> B[02 Arquitectura]
  B --> C[03 Datos]
  C --> C1[03a Esquema y campos]
  C --> D[04 Autenticación y acceso]
  D --> D1[04a IAM]
  D1 --> D2[04b Administración]
  B --> E[05 Configurador 3D]
  A --> F[06 UI y UX]
  F --> F1[06a Portada y acceso]
  F --> F2[06b Espacio de trabajo]
  F --> F3[06c UI administrativa]
  D2 --> F3
  C --> E
  D --> F
  E --> F
  B --> G[07 Entornos y despliegue]
  C --> H[08 Fases y validación]
  D --> H
  E --> H
  F --> H
  G --> H
```

## Decisiones compartidas

- Marca aprobada: **ATLAS MTB**. Eslogan: **Cada pieza define tu camino**. Logotipo vectorial profesional, elegante y legible; la propuesta gráfica está sujeta a revisión visual.
- Producto web que une catálogo técnico, comparación y montaje visual de bicicletas MTB, con foco inicial en enduro y descenso.
- Público confirmado: ciclistas y talleres/tiendas, con prioridad inicial en los ciclistas. Las vías comerciales futuras son hipótesis del documento 01; no incorporan membresías, pagos ni un sistema de empresa al alcance actual.
- Administración aprobada: pestañas Usuarios, Roles y Permisos; tablas sencillas y panel derecho para crear/ver/editar. Matriz de roles en horizontal y permisos agrupados por área en vertical, con guardado explícito y roles de sistema en lectura.
- Espacio de trabajo aprobado con pestañas Bicicletas, Componentes y Mis bicicletas, sin recarga y con contexto conservado. Fichas completas en panel derecho —inferior ampliable en móvil— y detalle del configurador dentro de su panel existente.
- Inicio desde cuadro o desde bicicleta prearmada de referencia aprobado; montajes de fábrica documentados y ejemplos ATLAS distinguidos. Su inventario exacto y variantes se completan según la cobertura ampliada de 11.
- Portada breve como gancho visual para iniciar sesión; detalle y herramientas en sus vistas. Catálogo acotado de modelos comerciales reales, con variantes útiles y acabados sin duplicar tarjetas; precios orientativos con moneda, mercado, fuente y fecha, sin sincronización en tiempo real.
- Entrega full scope del alcance acordado: todas sus funciones y campos operativos; las fases no reducen la entrega a un MVP.
- Frontend con React, TypeScript y Vite; 3D con Three.js, React Three Fiber y Drei.
- Arquitectura aprobada: módulos por funcionalidad con independencia de las reglas de montaje tomada de Clean Architecture, sin capas adicionales por obligación.
- Código tipado, responsabilidades separadas, SOLID aplicado con criterio y reutilización de controles y reglas que compartan comportamiento real.
- Lenguaje de interfaz directo y coherente, sin títulos redundantes ni identificadores técnicos del software expuestos al usuario; resultados internos traducidos a mensajes útiles. Voz de producto MTB, sin comentarios de asistente, narración de la pantalla o instrucciones de relleno.
- Referencia visual UI/UX aprobada: COMMENCAL, con limpieza, contraste, bicicleta protagonista y carácter deportivo; contenido propio. Movimiento puntual y funcional, con alternativa estática y movimiento reducido; composición y recursos finales pendientes de revisión.
- Base objetivo de doce tablas propias: ocho de negocio y cuatro de IAM (roles, permisos, permisos por rol y asignación de usuarios); JSONB con contratos por categoría, índices según consultas y TanStack Query para datos remotos. La revisión adversarial del documento 09 condiciona los contratos antes de implementar; no certifica rendimiento ni cobertura de todos los SKU.
- Frontend local durante desarrollo y publicado mediante GitHub/Netlify en https://atlasmtb.netlify.app; estado del retorno Auth en 07/12. Supabase Cloud ya creado gestiona PostgreSQL, Auth, Storage, RPC y Edge Functions. No se levanta una base/stack local ni un segundo proyecto por obligación. Credenciales en `.env`, sin valores en documentos o Git.
- SQL/migraciones y Edge Functions deben quedar versionados en `supabase/` antes de aplicarse al proyecto Cloud; la estructura y el historial siguen su README. Cuando se autorice implementar se permiten reconstrucciones necesarias de aplicación en ese entorno de desarrollo, sin repetir aprobaciones rutinarias.
- Fotos de componentes en `src/assets/images/`, publicadas con el frontend. Storage se reserva para GLB importados y sus recursos asociados; la geometría generada por código no necesita archivos 3D almacenados.
- Cobertura confirmada: todas las piezas del catálogo podrán montarse en 3D, con recurso genérico identificado y versionado cuando proceda. Cambio trasero seleccionable con mando asociado, sin selector independiente; cobertura ampliada e ingesta documental por categoría en 11 y 11a–11n. Pedalier seleccionable; plato incluido con bielas.
- Sin workers propios, servidor dedicado, microservicios ni motor de física dentro del alcance acordado.
- Representación exterior reconocible y proporcionada. Se aceptan modelos aproximados; no se promete precisión de fabricación ni compatibilidad mecánica completa.
- Enduro y descenso con cuadros reales aproximados, cobertura de marcas y tallas principales M/L según 11. Horquillas/amortiguadores FOX, RockShox, Öhlins y Marzocchi; frenos Shimano/Magura/SRAM; transmisión Shimano/SRAM y neumáticos de las marcas indicadas. Manillar, potencia y sillín sencillos genéricos identificados. Variantes concretas pendientes de completar con fuente.
- Las combinaciones con incompatibilidades mecánicas se permiten como montaje visual, con avisos; no se ocultan ni bloquean por ese motivo.
- Colores libres en cuadro y piezas habilitadas; el resto mantiene los acabados del catálogo. El color elegido forma parte del montaje guardado.
- Portada, catálogo, fichas y comparación públicos. Crear o editar montajes, consultar sus avisos y guardar exige iniciar sesión; «Mis bicicletas» contiene solo montajes propios. Tener cuenta no implica una membresía de pago.
- Auth nativo con correo y contraseña y, por ampliación del usuario del 21/10/2026, «Continuar con Google» mediante OAuth de Supabase. Registro público siempre user; user/admin iniciales protegidos y capacidad completa de crear/configurar roles personalizados y asignarlos según permisos. Primer admin por operación controlada del proyecto; administración posterior mediante la web y funciones protegidas de Supabase. Composición de acceso y registro aprobada en el documento 06: imagen estática y formulario en escritorio, formulario sin panel fotográfico en móvil; registro con confirmación de contraseña y estado de confirmación de correo.
- La reconstrucción del prototipo está autorizada. Se sustituye por fases verificables, sin conservar código o diseño por obligación.

## Comunicación y lectura en nuevas sesiones

Seguir AGENTS.md como contexto persistente al abrir Codex. Recomendar diagramas ASCII/Mermaid para lógica y relaciones cuando aporten claridad; para propuestas de UI usar por defecto bocetos ASCII con campos, acciones y adaptación pertinente antes de implementar. Las composiciones aprobadas se conservan en su documento de UI, no como recursos o pantallas ya entregados.

La evidencia reproducible de recursos, renderizado y planes de consultas está en [12a](12a-evidencia-del-visor.md), con distinción entre automatización, emulación y aceptación física pendiente.

## Cómo mantener estos planes

Los documentos con sufijo `a`, `b` o `c` desglosan una responsabilidad existente, sin nuevas carpetas o procesos. El árbol de tablas vive en 03a, las reglas de datos en 03, identidad en 04, autorización en 04a y administración en 04b, las composiciones de portada/acceso en 06a y las vistas de trabajo en 06b y la UI de usuarios/roles/permisos en 06c. No copiar estos contratos en otros archivos.

El documento 01 define el alcance. Cada decisión técnica vive en su capa; los demás documentos la enlazan. El documento 08 registra avance y criterios de aceptación, sin sustituir los contratos de datos o las reglas de acceso.

El documento 02 registra la arquitectura modular aprobada con independencia de reglas, sus límites y principios de código; conserva la comparación de alternativas como fundamento. El documento 06 define la comunicación de la interfaz: jerarquía sin repeticiones, vocabulario de usuario y conversión de resultados técnicos a mensajes comprensibles.

Una ampliación debe indicar qué necesidad resuelve y qué fase afecta. No añadir infraestructura por anticipación. Los nombres propuestos de tablas, rutas y módulos son contratos de implementación; los identificadores ficticios de los ejemplos no son datos de producción.

El trabajo de concreción e implementación se distribuye en el documento 08: completar inventario, contratos por categoría, referencias de ensamblaje, bocetos administrativos y validación visual/rendimiento forma parte de las fases, con resultados y criterios de aceptación. No se exige resolverlo fuera del plan antes de comenzar. La cobertura ya está cerrada: todas las piezas del catálogo se montan en 3D. La conexión Supabase, el dominio de Netlify y el correo son requisitos de integración. Los datos de prueba pueden ayudar a desarrollar; no cumplen la aceptación final de una función que exige datos o integración reales.

- [11o · Ampliación gravity](11o-ampliacion-gravity.md): cuadros y horquillas adicionales; generaciones históricas identificadas autorizadas.


## V10.8 CC MY27 · revisión individual v30

Reconstrucción propia M/L desde foto oficial del cuadro desnudo y despieces V10.8: ventanas, arco delantero, basculante cerrado y enlaces VPP. Cinco anclajes visuales estimados con contrato antes/después; geometría oficial de dirección/ruedas, medidas y acabados conservados. Perfil de movimiento nuevo solo para recursos v30; conservar históricos y fotografías. Preparación, controles de silueta/paredes/pasos, multivista, pruebas y publicación forman parte de la fase 3, con evidencia y límites en [12x](12x-evidencia-v10-v30.md). No afirmar CAD/100 % de parecido ni aceptación integral del producto.


Revisión integral de suspensión v2 implementada en fase3: quince modelos/30 tallas y38 shocks, cuatro recursos anteriores de prearmadas, compresión monótona y resorte separado de cuerpos rígidos. Se corrigieron cuatro referencias de prearmadas retiradas manteniendo88 posiciones y privados. Evidencia, reproducción y límites en [12y](12y-evidencia-suspension-v2.md).


Política de archivos finales y archivo local aprobada: [models/README.md](../../models/README.md). Fotos visibles y GLB publicados se versionan; investigación/resultados/prototipos permanecen locales. No convertir un informe generado en requisito para ejecutar los tests de producto.

- [06g · Avisos globales de compatibilidad](06g-avisos-globales-de-compatibilidad.md): barra global, panel reutilizado, posiciones afectadas y límites documentados sin bloquear el armado.

## Ampliación comercial · planificación e implementación

[13](13-tienda-y-venta-asistida.md) registra la evolución a tienda propia de componentes con guía técnica y3D, precios, promociones, carrito y pedidos. La implementación posterior autorizada y sus comprobaciones están en [13e](13e-evidencia-de-implementacion-comercial.md); ajustes de precios/segunda mano en13f/13g. Persistencia comercial real y resultados financieros simulados; no se habilitaron cobros reales. Yape manual y pasarela automática siguen como alternativas posteriores. Las exclusiones antiguas de comercio describen el alcance base.

- [13f · Precios visibles y componentes de segunda mano](13f-precios-y-componentes-de-segunda-mano.md).

- [13g · Precios por modelo y variante](13g-precios-por-modelo-y-variante.md).

- [06h · Identidad Cumbre y paleta naranja rojiza](06h-identidad-cumbre-y-paleta.md).
