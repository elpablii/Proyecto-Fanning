# Informe de Buenas Prácticas de Ingeniería de Software — Proyecto Fanning

**Fecha:** 2026-10-02
**Alcance:** `fanning-dashboard/` (Next.js 16 + React 19 + TypeScript), scripts de Python (`scripts/`, `fanning-dashboard/scripts/`, `fanning-dashboard/scratch/` y la raíz) y la organización del repositorio.
**Contexto:** es una aplicación personal, compartida con amigos, sin usuarios anónimos ni datos sensibles. Por eso la severidad se calibra con ese contexto. No se exige lo mismo que a un producto comercial, pero sí lo que ahorra trabajo y evita romper la app.

**Verificaciones ejecutadas:**
- `npx tsc --noEmit`: ✅ sin errores de tipos.
- `npx eslint src`: ❌ **59 problemas (38 errores, 21 advertencias)**:

| Regla | Cantidad |
|---|---|
| `@typescript-eslint/no-explicit-any` | 35 |
| `@typescript-eslint/no-unused-vars` | 13 |
| `@next/next/no-img-element` | 7 |
| `react-hooks/set-state-in-effect` | 3 |
| `react-hooks/exhaustive-deps` | 1 |

---

## Resumen por severidad

| # | Hallazgo | Severidad |
|---|---|---|
| 1 | API key de TMDB escrita en el código (≈12 archivos) y publicada en Git | 🔴 Alta |
| 2 | La refactorización quedó a medias: `FlashcardViewer` y `useTMDB` existen pero nadie los usa | 🔴 Alta |
| 3 | Duplicación masiva entre `PeliculaClient` y `SeriesClient` (~500 líneas cada uno) | 🔴 Alta |
| 4 | Diccionario `tmdbOverrides` duplicado y con valores que ya no coinciden | 🟠 Media |
| 5 | Lista `special_series` todavía escrita a mano en `generate_manifest.py` | 🟠 Media |
| 6 | Varias fuentes de verdad para los datos (`manifest.json` editado por scripts distintos) | 🟠 Media |
| 7 | Scripts de Python de un solo uso, copiados y pegados, con rutas absolutas | 🟠 Media |
| 8 | Tipado débil: `any` en props, datos del manifest y respuestas de TMDB | 🟠 Media |
| 9 | Código muerto: `mediaStats.ts` (2.012 líneas), imports y botones sin uso | 🟡 Baja |
| 10 | Antipatrones de React (estado derivado en `useEffect`, `useState` innecesario, `setTimeout` sin limpiar) | 🟡 Baja |
| 11 | Coincidencia de títulos por subcadena (`includes`), frágil | 🟡 Baja |
| 12 | Archivos temporales y binarios versionados en Git (repo de 214 MB) | 🟡 Baja |
| 13 | No hay pruebas, CI ni validación de datos | 🟡 Baja |
| 14 | Detalles menores: `lang="en"`, README genérico, mensajes de commit, CSS inline, etc. | ⚪ Menor |

---

## 1. 🔴 API key de TMDB escrita en el código

La misma clave (`d1765b8d…`) aparece literal en:

- `fanning-dashboard/src/hooks/useTMDB.ts:4`, como *fallback* de `process.env.NEXT_PUBLIC_TMDB_API_KEY`
- `fanning-dashboard/scripts/fetch_tmdb.ts:120`
- `fanning-dashboard/scripts/enrich_kim_tmdb.py`, `generate_tbbt_json.py` y `scratch/fetch_tmdb.py`
- `scripts/fetch_ratings.py`, `fix_tmdb_data.py`, `fix_euphoria_tmdb.py`, `update_episodes_overview.py` y `update_episodes_overview_pc.py`
- `scripts/archive/test_tmdb.py`

**Por qué importa:** quedó en el historial de Git de `github.com/elpablii/Proyecto-Fanning`. Si el repo es público, cualquiera puede usarla y agotar tu cuota o hacer que TMDB la revoque. Además, el prefijo `NEXT_PUBLIC_` la incluye en el JavaScript que descarga el navegador. En el caso de TMDB v3 eso es casi inevitable si se consulta desde el cliente, pero ahora mismo la app ya no consulta TMDB desde el cliente (ver punto 2).

**Recomendación:**
1. Regenerar la clave en TMDB, porque la actual ya es pública en el historial.
2. Guardarla en `.env.local` (ya está ignorado por `.gitignore`) como `TMDB_API_KEY`, sin el prefijo `NEXT_PUBLIC_`.
3. En Python, leerla con `os.environ["TMDB_API_KEY"]` (o con `python-dotenv`) y fallar con un mensaje claro si falta, nunca con un valor por defecto.

## 2. 🔴 La refactorización quedó a medias

`PLAN_REFACTORIZACION.md` marca como ✅ los puntos 1 y 4, pero el código dice otra cosa:

- **`components/ui/FlashcardViewer.tsx`** se importa en `PeliculaClient.tsx:8` y `SeriesClient.tsx:6`, pero **nunca se renderiza**. Los dos componentes siguen teniendo su propio modal de flashcards copiado (~150 líneas cada uno).
- **`hooks/useTMDB.ts`** (216 líneas) **no lo importa ningún archivo**. Hoy los pósters y sinopsis vienen precalculados en `manifest.json` y en `pelis/*.json`.

**Por qué importa:** un plan que dice "completado" cuando no lo está genera falsa confianza. Si corriges un bug en `FlashcardViewer`, no se arregla en la app.

**Recomendación:** reemplazar los modales copiados por `<FlashcardViewer initialFlashcards={...} onClose={...} />`. Después, borrar `useTMDB.ts` o moverlo a la lógica de scripts si se quiere conservar. Por último, actualizar el plan.

## 3. 🔴 Duplicación entre `PeliculaClient.tsx` (471 líneas) y `SeriesClient.tsx` (562 líneas)

Se repite casi literalmente en ambos:
- Modal de advertencia +18
- Fondo con *backdrop* y *glassmorphism*
- Hero con póster
- Lightbox de imágenes
- Modal de flashcards (que además existe en un tercer lugar)
- Cálculo del porcentaje de comprensión (también en `MovieCard.tsx`, con el número mágico `99.445`)
- El estado completo de flashcards (`showFlashcards`, `currentCardIndex`, `isFlipped`, `studyMode`…)

Lo mismo pasa en `app/peliculas/[slug]/page.tsx` y `app/series/[slug]/page.tsx`: la lectura del manifest y la aplicación de `vocabularyOverrides` están duplicadas.

**Recomendación:** extraer componentes y utilidades:
- `AdultContentGate`, `BackdropLayout`, `MediaHero` e `ImageLightbox`
- `lib/stats.ts` → `calcComprehension(dialogues, unknownWords)`
- `lib/data.ts` → `getManifest()`, `getMediaByTitle(title)`, `getExtraData(title)` (con los overrides ya aplicados)

## 4. 🟠 `tmdbOverrides` duplicado y divergente

Hay dos copias del diccionario: `src/lib/tmdb.ts` (~190 entradas) y `fanning-dashboard/scripts/fetch_tmdb.ts` (~110 entradas, con el comentario "Reusing tmdbOverrides logic"). Además, ya **no coinciden**. Por ejemplo, `"riesgo bajo cero"` usa `y: "2021"` en una copia e `id: "646207"` en la otra, y `"los fantasmas de scrooge"` solo existe en el script.

**Recomendación:** dejar una sola fuente, idealmente un `tmdb-overrides.json` que lean tanto TypeScript como Python, e importarla desde el script.

## 5. 🟠 Lógica de "serie o película" todavía escrita a mano

El plan dice que se eliminó el arreglo `specialSeries`. En realidad **se movió** a `scripts/generate_manifest.py:235`:
```python
special_series = ['kim possible', 'the big bang theory', 'euphoria', ...]
```
Cada serie nueva obliga a editar el script. Si se te olvida, se clasifica mal.

Los años también están escritos a mano en `generate_manifest.py:117, 149-153, 163, 331`: `["2023", "2024", "2025", "2026", "2027"]`. En 2028 habrá que tocar cuatro lugares.

**Recomendación:** derivar el tipo de los datos, por ejemplo con un campo `"type"` en cada `pelis/<título>.json` o por la carpeta `Diálogos Series/`. Los años se pueden derivar de las carpetas: `sorted(d for d in os.listdir(data_dir) if d.isdigit())`.

## 6. 🟠 Varias fuentes de verdad para los datos

`public/data/manifest.json` lo modifican al menos:
- `scripts/generate_manifest.py`, que lo regenera desde PDFs y JSON
- `fanning-dashboard/add2027.js`, que le agrega títulos a mano
- los scripts `fix_*`, `reparse_*` y `update_*`

`generate_manifest.py` lee el manifest anterior para "rescatar" pósters, niveles y clasificaciones (`old_movie_posters`, etc.). Es decir, el archivo generado también funciona como entrada. Eso hace que el resultado dependa del historial y no sea reproducible. Que existan `old_manifest.json` y `old_manifest2.json` en la raíz es un síntoma de esto.

Además, los vocabularios están dos veces: en `public/data/<año>/*.json` y en `public/data/pelis/*.json`.

**Recomendación:** separar los **datos fuente** (editados por ti: metadatos por obra, overrides, IDs de TMDB) de los **datos generados** (`manifest.json`). El generador solo debería leer fuentes y nunca editarse a mano. Esto encaja directamente con el punto 3 del plan (panel de administrador).

## 7. 🟠 Scripts de Python de un solo uso y copiados

- Hay 35 scripts en `scripts/` con un patrón por serie: `count_<serie>.py`, `reparse_<serie>.py` y `fix_<serie>_flat.py`. Por ejemplo, `fix_maid_flat.py` y `fix_pan_am_flat.py` **solo difieren en el nombre del archivo**. La lógica de contar diálogos SRT (`re.split(r'\d{2}:\d{2}:\d{2},\d{3} --> ...')`) se repite en al menos 9 archivos, incluido `generate_manifest.py`.
- Los scripts están repartidos en cinco lugares: la raíz (`check_missing.py`, `count_words.py`, `dump_names.py`, `read_pdf.py`, `scratch_report.py`), `scripts/`, `scripts/archive/`, `fanning-dashboard/scripts/` y `fanning-dashboard/scratch/`. Además hay un `generate_json.py` duplicado en `scripts/` y en `fanning-dashboard/`.
- Las rutas son absolutas de tu PC (`generate_manifest.py:7-8`: `r'c:\Users\Pablo\Documents\...'`). Fallan en otra máquina o en otra carpeta.
- Hay `except:` vacíos en `generate_manifest.py:109, 229, 267`, que esconden errores reales, como un JSON corrupto.
- El código vive en el nivel del módulo, sin `main()` ni argumentos de línea de comandos.
- `requirements.txt` no fija versiones e incluye `pytest`, pero no hay pruebas.

**Recomendación:** crear un paquete pequeño (`scripts/fanning/`) con funciones reutilizables, como `count_dialogues(text)`, `load_json` / `save_json` y `tmdb_client`. Encima, un único CLI parametrizado:
```bash
python -m fanning reparse --serie "Maid"
```
Para las rutas, usar `pathlib.Path(__file__).resolve().parents[n]`.

## 8. 🟠 Tipado débil

`tsc` pasa, pero solo porque hay 35 `any` y `PeliculaClient.tsx` desactiva la regla con `/* eslint-disable @typescript-eslint/no-explicit-any */`. Las props principales son `initialMovieData: any, initialExtraData: any`. Los tipos de `types/manifest.ts` existen, pero no se usan en las páginas de detalle. `DashboardClient.tsx` vuelve a declarar en línea el mismo tipo que `MovieStats`, y además declara una interfaz `VocabItem` que no se usa.

**Recomendación:** definir `ExtraData`, `VocabularyItem` y `EpisodeExtra` en `types/` y usarlos en todas partes. Para validar los JSON en tiempo de build, `zod` es una buena opción: un JSON mal editado daría un error claro en lugar de una pantalla rota.

## 9. 🟡 Código muerto

- `src/data/mediaStats.ts`: **2.012 líneas** que no importa nadie.
- `src/hooks/useTMDB.ts`: no se usa (punto 2).
- 13 variables o imports sin uso, según ESLint: `Loader2`, `tmdbOverrides` y `Link` en `DashboardClient`, `FlashcardViewer`, entre otros.
- `DashboardClient`: el botón **"Buscar"** no tiene `onClick`, así que no hace nada.
- `englishAnalysisOverrides` y `vocabularyOverrides` están vacíos. Está bien si se piensan usar, pero el panel de administrador los reemplazaría.

## 10. 🟡 Antipatrones de React

- **Estado derivado en `useEffect`** (`DashboardClient.tsx:44-80`): `stats` se calcula con `setStats` dentro de un efecto, lo que provoca un render extra y un parpadeo. Debería ser `useMemo`. El mismo efecto lee `window.location.search` y llama a `setSelectedYear`. Lo idiomático en Next es `useSearchParams()` o leer `searchParams` en el Server Component, y cambiar de año con `<Link href="/?year=2025">` en vez de `history.pushState`.
- **`useState` para props que nunca cambian:** `const [movieData] = useState(initialMovieData)`. Basta con usar la prop directamente.
- **`setManifestData`** se declara y nunca se usa.
- **`setTimeout(..., 150)`** sin limpieza en los cambios de tarjeta: si cierras el modal durante esos 150 ms, se actualiza estado de un componente desmontado.
- **Barajado sesgado:** `[...flashcards].sort(() => Math.random() - 0.5)` no produce una distribución uniforme. Lo correcto es usar Fisher–Yates.
- **`alert()` y `window.prompt()`** para mensajes y entrada de datos. "Corregir TMDB" guarda en `localStorage`, pero **ese valor ya no se lee en ningún lado** porque `useTMDB` no se usa, así que el botón no tiene efecto.
- **ESLint `react-hooks/set-state-in-effect`** marca 3 casos, entre ellos `FlashcardViewer.tsx:21`. Lo habitual es reiniciar el estado con `key={...}` en el componente padre.
- **`TimelineClient`** obtiene `manifest.json` y `timeline.json` con `fetch` desde el cliente, mientras el resto de páginas los lee en el servidor. Se descargan ~250 KB extra y aparece un spinner innecesario.
- Se usa **`<img>` en lugar de `next/image`** en 7 lugares, sin lazy-loading ni redimensionado automático. Para pósters de TMDB conviene `next/image` con `remotePatterns`.

## 11. 🟡 Coincidencia de títulos frágil

En `useTMDB.ts` y `fetch_tmdb.ts`, `lowerTitle.includes(key)` hace que claves cortas como `"io"`, `"home"`, `"emma"`, `"glass"` o `"taken"` coincidan con cualquier título que las contenga. Por ejemplo, "Dil**emma**" o "**Home** Alone". Ordenar por longitud lo mitiga, pero no lo resuelve.

En `TimelineClient.tsx:40-46` hay reglas especiales escritas a mano (`"inside out"`, `"star wars"`, `"ts:"`) para emparejar pósters.

En `SeriesClient.tsx:342` los episodios se emparejan con `e.name === ep.name || ep.name.includes(e.name) || displayName.includes(...)`, lo que da el mismo riesgo de coincidencias falsas.

**Recomendación:** usar identificadores estables, como un `slug` o el `tmdbId` en los datos, y comparar por igualdad exacta.

## 12. 🟡 Higiene del repositorio

- **Archivos temporales versionados:** `old_manifest.json` (200 KB), `old_manifest2.json`, `out.txt`, `kim_explore*.txt`, `dialogo_names.txt`, `vocab_names.txt`, `scratch_report.py`, `temp_report.md`, `tmdb_backup.json`, `fanning-dashboard/scratch/` y `maid_markers.txt`.
- **Binarios grandes en Git:** 464 PDFs (~330 MB entre `Diálogos/` y `Vocabularios/`), con `.git` en 214 MB. Cada nueva versión de un PDF hace crecer el historial para siempre. Para esto existe **Git LFS**, o se puede guardar el material fuente fuera del repo de código.
- **Un `.gitignore` en la raíz casi vacío:** solo ignora `.obsidian/workspace*.json`. No cubre `__pycache__/`, `*.pyc`, `.venv/`, `scratch/` ni `.env`.
- **Monorepo sin estructura clara:** las notas de Obsidian, los PDFs, los scripts y la web conviven al mismo nivel. Una estructura `content/` (notas + PDFs), `tools/` (Python) y `web/` (Next.js) haría obvio qué es qué.

## 13. 🟡 Sin pruebas, CI ni validación

- No hay pruebas ni en Python ni en TypeScript, aunque `pytest` figura en `requirements.txt`. Las funciones con más riesgo son puras y muy fáciles de probar: `clean_movie_title`, `extract_movie_name_from_pdf_filename`, el conteo de diálogos SRT y el cálculo de comprensión.
- No hay `.github/workflows`. Next 16 ya no ejecuta ESLint durante `next build`, así que los 38 errores de lint llegan a Vercel sin aviso. Un workflow mínimo con `npm ci && npm run lint && npx tsc --noEmit && npm run build` lo evitaría.
- Nada valida la forma de `manifest.json` ni de `pelis/*.json` antes del despliegue. Justamente el plan identifica "romper los JSON y tumbar la app" como un problema real.

## 14. ⚪ Detalles menores

- `layout.tsx:27` usa `lang="en"`, pero la interfaz está en español. Eso afecta a lectores de pantalla, al traductor del navegador y al SEO. Debería ser `lang="es"`.
- `fanning-dashboard/README.md` es el texto genérico de `create-next-app`. No explica cómo regenerar los datos, qué variables de entorno hacen falta ni cómo desplegar.
- Hay mensajes de commit poco descriptivos (`:>`, `xdd`, `avances`), que hacen difícil volver atrás o encontrar cuándo se introdujo un bug.
- `PeliculaClient.tsx` define CSS 3D con `<style dangerouslySetInnerHTML>`. Iría mejor en `globals.css`.
- Hay sintaxis mezclada de Tailwind v3 y v4: `bg-gradient-to-r` / `aspect-[2/3]` en `SeriesClient` y `bg-linear-to-r` / `aspect-2/3` en `PeliculaClient`.
- `app/peliculas/[slug]/page.tsx:67-68` deja `console.log` de depuración y usa un `!` innecesario (`manifestPath!`).
- El título de la URL se usa directamente como nombre de archivo (`pelis/${decodedTitle}.json`). El riesgo es bajo porque luego se valida contra el manifest, pero conviene validar **antes** de tocar el disco y declarar `export const dynamicParams = false` para servir solo los slugs generados.
- El aviso +18 es solo visual, porque los JSON siguen siendo públicos en `/data/pelis/*.json`. Para el uso personal está bien; solo hay que saber que no es un control de acceso.

---

## Plan de acción sugerido (orden por impacto/esfuerzo)

1. **Rotar la API key** y moverla a `.env.local` / variables de entorno (1 h).
2. **Borrar código muerto:** `mediaStats.ts`, `useTMDB.ts`, imports sin uso, `old_manifest*.json` y archivos `*_explore.txt` (30 min).
3. **Usar `FlashcardViewer`** en Película y Serie, y extraer los demás componentes compartidos (punto 3) (medio día).
4. **Arreglar el lint** hasta llegar a 0 errores y añadir un workflow de CI con lint + tsc + build (2-3 h).
5. **Unificar `tmdbOverrides`** y quitar `special_series` y los años escritos a mano en el generador (2 h).
6. **Consolidar los scripts de Python** en un paquete con CLI, rutas relativas y pruebas de las funciones puras (1-2 días, se puede hacer gradualmente).
7. **Separar datos fuente de datos generados** y validarlos con un esquema. Esto prepara el terreno para el panel de administrador del plan (1-2 días).
8. Evaluar **Git LFS** para los PDFs.
