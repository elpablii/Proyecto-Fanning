# Plan de Refactorización y Buenas Prácticas (Proyecto Fanning)

El repositorio actual funciona, pero ha crecido de forma orgánica y está sufriendo de deuda técnica. Las lógicas de las interfaces están repetidas, hay decenas de scripts de un solo uso en Python, y modificar la información manualmente es tedioso y propenso a errores (romper los JSON).

Este plan busca establecer buenas prácticas, escalabilidad y una gestión de contenido visual.

## Problemas Actuales Detectados

1. Frontend Monolítico: No hay una carpeta de componentes (`src/components`). Todo (Flashcards, cabeceras, botones, fetchs a TMDB) está copiado y pegado gigantescamente dentro de `page.tsx` de películas y series.
2. Scripts Desechables: La carpeta `scripts/` tiene casi 50 archivos de python (`fix_2025.py`, `explore_kim.py`, etc.). Esto no escala.
3. Lógica "Hardcodeada": En `src/app/page.tsx` existe un arreglo escrito a mano (`const specialSeries = ['kim possible', ...]`) para saber si algo es serie o película.
4. Manejo de Datos Manual: Modificar el vocabulario o la cantidad de líneas de diálogo requiere entrar a archivos `.json` inmensos y editar texto a mano, lo que puede romper el formato y tumbar la app.

## Cambios a ir Aplicando de a Poco

### ~~1. Refactorización del Frontend (Next.js)~~ ✅ COMPLETADO

*Extraer la interfaz a componentes reutilizables.*

Archivos creados:
- `src/components/ui/FlashcardViewer.tsx`
- `src/components/ui/MovieCard.tsx`

Archivos limpiados (Se redujo el tamaño de los archivos consumiendo los componentes compartidos):
- `src/app/page.tsx`
- `src/app/peliculas/[slug]/page.tsx`
- `src/app/series/[slug]/page.tsx`

### ~~2. Eliminación de Lógicas "Hardcodeadas"~~ ✅ COMPLETADO

Archivo a modificar: `scripts/generate_manifest.py`
- Actualizado para inyectar automáticamente una propiedad `"type": "movie" | "series"` en `manifest.json`.

Archivo a modificar: `src/app/page.tsx`
- Eliminado el arreglo `specialSeries`, ahora usa la propiedad `"type"` del `manifest.json` para hacer el ruteo automático.

### 3. Panel de Administrador (Edición Visual de Vocabularios)

Aprovechando que corres el dashboard localmente, usaremos *Next.js Server Actions* para leer y escribir los JSON de forma gráfica y segura, sin tocar código.

Nuevo archivo a crear: `src/app/admin/page.tsx`
- Una interfaz gráfica protegida donde verás la lista de todas tus series/películas.

Nuevo archivo a crear: `src/app/admin/[slug]/page.tsx`
- Un editor visual tipo tabla. Podrás:
  - Cambiar el número total de líneas de diálogo (`dialogues`).
  - Agregar/editar/eliminar palabras del vocabulario.
  - Editar la traducción de cada palabra.
  - Botón "Guardar Cambios" que escribirá de forma segura y automática en `public/data/pelis/[slug].json` e invocará la regeneración del `manifest.json`.

### ~~4. Centralización de Peticiones a TMDB (Custom Hook / Utils)~~ ✅ COMPLETADO

Actualmente, las llamadas a la API de TMDB (`fetch('https://api.themoviedb.org/...')`) están repetidas en `MovieCard.tsx`, en `peliculas/[slug]/page.tsx` y en `series/[slug]/page.tsx`. Además, en todas hay un *fallback* del API Key quemado (hardcoded).

Nuevo archivo a crear: `src/hooks/useTMDB.ts` o `src/lib/tmdbFetcher.ts`.
- Esto centralizará la obtención de posters, backdrops, y overviews. Hará que el código de los componentes sea mucho más limpio y evitará repetir la lógica de `tmdbOverrides` en cada archivo.

### ~~5. Limpieza de Carpeta de Scripts (Archivar Scripts Desechables)~~ ✅ COMPLETADO

La carpeta `scripts/` tiene actualmente 48 archivos de Python (`fix_2025.py`, `regen_plainville.py`, etc.). Esto es deuda técnica pura de scripts de un solo uso.

Acción a tomar:
- Crear una carpeta `scripts/archive/` y mover allí todos los scripts temporales o de un solo uso.
- Dejar en la raíz de `scripts/` únicamente los scripts vitales para el funcionamiento del dashboard (ej. `generate_manifest.py` o un futuro `import_media.py` general).
