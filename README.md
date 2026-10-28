# ATLAS MTB

Tienda web de componentes enduro y descenso con guía técnica, comparación y configuración 3D. Conecta montajes personales y alternativas de compatibilidad con carrito, cotizaciones, armado opcional y seguimiento de pedidos. Los pagos de esta versión son simulados.

**Publicación previa:** [atlasmtb.netlify.app](https://atlasmtb.netlify.app/)

## Entrega académica

**Desarrollo de una plataforma web para la venta asistida de componentes y configuración tridimensional de bicicletas de montaña**

Joel Ito Luque · Universidad Nacional de Juliaca · Facultad de Ciencias de la Ingeniería · Ingeniería de Software y Sistemas. Curso: Gestión de Proyectos · Docente: Mg. Fidel Huanco Ramos · Octavo semestre · Juliaca, Perú · 21 de octubre de 2026.

Revisión funcional de los entregables: **28 de octubre de 2026**. Se conservan formato y fecha académica de portada; fuentes LaTeX y PDF recompilados. Las capturas actuales usan frontend local y Supabase Cloud; esta actualización no despliega la web.

| Entregable | Documento | Fuente editable y recursos |
| --- | --- | --- |
| **1. Software** | Código en este repositorio; [ejecución local](#ejecución-local) | [Frontend](src/), [backend y base de datos](supabase/), [modelos y fuentes](models/) |
| **2. Informe técnico** | [Leer PDF](entregables/02_Informe_Tecnico/informe.pdf) | [LaTeX](entregables/02_Informe_Tecnico/informe.tex) · [Carpeta completa](entregables/02_Informe_Tecnico/) |
| **3. Manual de usuario** | [Leer PDF](entregables/03_Manual_Usuario/manual.pdf) | [LaTeX](entregables/03_Manual_Usuario/manual.tex) · [Carpeta completa](entregables/03_Manual_Usuario/) |
| **4. Presentación** | [Leer PDF](entregables/04_Presentacion/presentacion.pdf) | [LaTeX](entregables/04_Presentacion/presentacion.tex) · [Carpeta completa](entregables/04_Presentacion/) |

**Para subir al aula virtual:** [Acceso a los entregables — PDF de una página](entregables/Acceso_Aula_Virtual.pdf), con enlaces al repositorio, a los documentos y a la aplicación. Si el repositorio se mantiene privado, el docente necesita acceso autorizado.

Cada entregable documental contiene un único `.tex`, un único PDF principal y su carpeta `recursos/`. El PDF se puede consultar por sí solo; para recompilar hay que conservar las imágenes, las tipografías y sus rutas relativas. Los ZIP de entrega y el guion de ensayo se mantienen localmente fuera de Git.

## Ejecución local

Requisitos: **Node.js 24.22.0** y **pnpm 12.6.0**, fijados en `.node-version` y `package.json`.

```bash
git clone git@github.com:joelito322/web-fox-rockshox.git
cd web-fox-rockshox
pnpm install --frozen-lockfile
```

Crear `.env.local` en la raíz con los datos públicos del proyecto Supabase autorizado:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Completar ambos valores y ejecutar:

```bash
pnpm run dev
```

Abrir la dirección indicada por Vite. El frontend local usa Supabase Cloud para base de datos, autenticación, almacenamiento y operaciones de servidor. La aplicación publicada permite revisar el producto sin instalar el entorno local. Las claves privilegiadas se reservan a herramientas de servidor y nunca se colocan en variables `VITE_*`.

```bash
pnpm run build    # Generar dist/
pnpm run preview  # Revisar la compilación local
pnpm run test     # Ejecutar las pruebas
```

La reproducción del backend y del catálogo se describe en [Supabase](supabase/README.md), [fuentes del catálogo](supabase/catalog/README.md) y [modelos](models/README.md). Los recursos publicados de modelos conservan sus versiones; una copia del código no sustituye la configuración del backend remoto.

## Compilar los documentos

Con Tectonic instalado, ejecutar dentro de la carpeta de cada entregable:

```bash
tectonic informe.tex
tectonic manual.tex
tectonic presentacion.tex
```

Cada comando corresponde a su propia carpeta. También pueden abrirse en TeXstudio configurado con Tectonic. Cada carpeta incluye instrucciones en `LEEME.txt`.

## Estructura

```text
entregables/       Informe, manual, presentación y acceso para el aula virtual
src/              Aplicación web
supabase/         Migraciones, funciones y fuentes del catálogo
models/           Fuentes y recursos de modelado
scripts/          Preparación y validación
tests/            Pruebas y escenas de revisión
docs/             Documentación técnica del proyecto
```

La visualización 3D y la inspección de suspensión son aproximaciones para planificar un montaje; no constituyen certificación de compatibilidad mecánica. Las pruebas realizadas y sus límites se documentan en el informe técnico.
