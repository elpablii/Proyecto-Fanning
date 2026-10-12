# Informe de Buenas Prácticas de Ingeniería de Software — Proyecto Fanning

**Primera versión:** 2026-10-02
**Actualizado:** 2026-10-12, después de rehacer el conteo de métricas, el catálogo de títulos, los datos de TMDB y el buscador.
**Alcance:** `fanning-dashboard/` (Next.js 16 + React 19 + TypeScript), scripts de Python (`scripts/`, `fanning-dashboard/scripts/`, `fanning-dashboard/scratch/` y la raíz) y la organización del repositorio.
**Contexto:** es una aplicación personal, compartida con amigos, sin usuarios anónimos ni datos sensibles. Por eso la severidad se calibra con ese contexto. No se exige lo mismo que a un producto comercial, pero sí lo que ahorra trabajo y evita romper la app.

**Verificaciones ejecutadas (2026-10-12):**
- `npx tsc --noEmit`: ✅ sin errores de tipos.
- `npx eslint src`: ❌ **59 problemas (38 errores, 21 advertencias)**. Son los mismos que el 2 de octubre: los archivos nuevos (`SearchModal.tsx`, `lib/formato.ts`) no agregan ninguno.

| Regla | Cantidad |
|---|---|
| `@typescript-eslint/no-explicit-any` | 35 |
| `@typescript-eslint/no-unused-vars` | 13 |
| `@next/next/no-img-element` | 7 |
| `react-hooks/set-state-in-effect` | 3 |
| `react-hooks/exhaustive-deps` | 1 |

- `python scripts/metricas/test_conteo.py`: ✅ 15 pruebas, todas pasan.
- `npm run build`: ✅ genera las 183 páginas (177 títulos).

---

## Qué cambió desde la primera versión

Entre el 11 y el 12 de octubre se reemplazó el sistema de datos:

- **Un solo flujo de métricas** en `scripts/metricas/`. `catalogo.json` dice qué PDFs son de cada título. `conteo.py` aplica los criterios escritos en `Metodología/`. `actualizar.py` genera `pelis/*.json`, los vocabularios por año y `manifest.json`.
- **Se archivaron los scripts que reescribían los datos:** `generate_manifest.py`, `count_*`, `fix_*_flat`, `reparse_*`, `generate_json.py` y `find_typos.py`. Este último había dañado el vocabulario con un corrector ortográfico.
- **El tipo (serie o película) y el cruce de títulos salen del catálogo**, no de listas a mano ni de coincidencias por subcadena.
- **Se agregaron pruebas** de las reglas de conteo.
- **El botón "Buscar" ya funciona**: busca por título o por el nombre en inglés, filtra por tipo y se abre con Ctrl + K.
- **Los números usan punto de miles** mediante una función común, `lib/formato.ts`.

---

## Resumen por severidad y estado

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | API key de TMDB escrita en el código y publicada en Git | 🔴 Alta | ❌ Pendiente (11 archivos) |
| 2 | La refactorización quedó a medias: `FlashcardViewer` y `useTMDB` existen pero nadie los usa | 🔴 Alta | ❌ Pendiente |
| 3 | Duplicación masiva entre `PeliculaClient` y `SeriesClient` | 🔴 Alta | ❌ Pendiente |
| 4 | Diccionario `tmdbOverrides` duplicado y con valores que ya no coinciden | 🟠 Media | ❌ Pendiente |
| 5 | Lista `special_series` y años escritos a mano | 🟠 Media | ✅ Resuelto (queda una lista de años) |
| 6 | Varias fuentes de verdad para los datos | 🟠 Media | 🟡 Parcial |
| 7 | Scripts de Python de un solo uso, copiados y pegados, con rutas absolutas | 🟠 Media | 🟡 Parcial |
| 8 | Tipado débil: `any` en props, datos del manifest y respuestas de TMDB | 🟠 Media | ❌ Pendiente |
| 9 | Código muerto: `mediaStats.ts`, imports y el botón "Buscar" sin uso | 🟡 Baja | 🟡 Parcial (el botón ya funciona) |
| 10 | Antipatrones de React | 🟡 Baja | ❌ Pendiente |
| 11 | Coincidencia de títulos por subcadena (`includes`), frágil | 🟡 Baja | 🟡 Parcial |
| 12 | Archivos temporales y binarios versionados en Git | 🟡 Baja | 🟡 Parcial |
| 13 | No hay pruebas, CI ni validación de datos | 🟡 Baja | 🟡 Parcial |
| 14 | Detalles menores: `lang="en"`, README genérico, etc. | ⚪ Menor | ❌ Pendiente |
| 15 | 🆕 Fotos de episodios guardadas por posición, no por código de episodio | 🟠 Media | ❌ Pendiente |
| 16 | 🆕 Archivos generados guardados en Git (`verificaciones/`, reportes) | 🟡 Baja | ❌ Pendiente |

---

## 1. 🔴 API key de TMDB escrita en el código — ❌ Pendiente

La misma clave (`d1765b8d…`) sigue literal en 11 archivos:

- `fanning-dashboard/src/hooks/useTMDB.ts`, como *fallback* de `process.env.NEXT_PUBLIC_TMDB_API_KEY`
- `fanning-dashboard/scripts/fetch_tmdb.ts`, `enrich_kim_tmdb.py` y `generate_tbbt_json.py`
- `fanning-dashboard/scratch/fetch_tmdb.py`
- `scripts/fetch_ratings.py`, `fix_tmdb_data.py`, `fix_euphoria_tmdb.py`, `update_episodes_overview.py` y `update_episodes_overview_pc.py`
- `scripts/archive/test_tmdb.py`

Los scripts nuevos (`scripts/metricas/episodios_tmdb.py` y `posters_tmdb.py`) ya hacen lo correcto: leen la clave de `TMDB_API_KEY` o de `fanning-dashboard/.env.local` y se detienen con un mensaje claro si falta. Conviene copiar ese patrón al resto.

**Por qué importa:** la clave quedó en el historial de Git de `github.com/elpablii/Proyecto-Fanning`. Si el repo es público, cualquiera puede usarla y agotar tu cuota, o TMDB puede revocarla.

**Recomendación:**
1. Regenerar la clave en TMDB, porque la actual ya es pública en el historial.
2. Guardarla solo en `.env.local` (ya ignorado por Git) como `TMDB_API_KEY`. La app ya no consulta TMDB desde el navegador, así que no necesita el prefijo `NEXT_PUBLIC_`.
3. Borrar el valor por defecto de los 11 archivos.

## 2. 🔴 La refactorización quedó a medias — ❌ Pendiente

Sin cambios:
- **`FlashcardViewer.tsx`** se importa en `PeliculaClient.tsx` y `SeriesClient.tsx`, pero no se renderiza en ninguno. Los dos siguen con su propio modal de flashcards copiado.
- **`hooks/useTMDB.ts`** no lo importa ningún archivo. Los pósters, fondos y fotos de episodios ahora los ponen los scripts `posters_tmdb.py` y `episodios_tmdb.py`, así que este hook sobra del todo.

**Recomendación:** usar `<FlashcardViewer>` en las dos páginas, borrar `useTMDB.ts` y corregir `PLAN_REFACTORIZACION.md`, que marca estos puntos como hechos.

## 3. 🔴 Duplicación entre `PeliculaClient.tsx` y `SeriesClient.tsx` — ❌ Pendiente

Se siguen repitiendo en ambos: el aviso +18, el fondo, el póster, el visor de imágenes, el modal de flashcards y el cálculo de comprensión (también en `MovieCard.tsx` y `DashboardClient.tsx`, con el número mágico `99.445`).

Un avance: el formato de números ya está centralizado en `lib/formato.ts` (`miles()`). Es el mismo camino que conviene seguir con el cálculo de comprensión.

**Recomendación:** extraer `AdultContentGate`, `BackdropLayout`, `MediaHero` e `ImageLightbox`, y llevar el cálculo a `lib/stats.ts` → `calcComprehension(dialogues, unknownWords)`.

## 4. 🟠 `tmdbOverrides` duplicado y divergente — ❌ Pendiente

Siguen las dos copias (`src/lib/tmdb.ts` y `fanning-dashboard/scripts/fetch_tmdb.ts`), y ya no coinciden. Además, hay una tercera fuente: los ids que se le pasan a `posters_tmdb.py` y los fijos de `episodios_tmdb.py` (`TMDB_ID`, `ESPECIAL_PELICULA`).

**Recomendación:** guardar el id de TMDB de cada título en `scripts/metricas/catalogo.json`, por ejemplo como `"tmdb": {"tipo": "movie", "id": 12}`. Así habría una sola fuente que leen todos los scripts, y `tmdbOverrides` se podría borrar.

## 5. 🟠 Serie o película y años escritos a mano — ✅ Resuelto

`generate_manifest.py` (con `special_series`) está archivado. Ahora el tipo sale del catálogo: un título es serie si su vocabulario anuncia episodios o si sus diálogos están en `Diálogos Series/`. Tampoco hace falta editar nada para agregar una serie nueva.

Queda un solo detalle: los años están en una lista, `ANIOS` en `scripts/metricas/rutas.py`. Antes eran cuatro lugares; ahora es uno. Se podría derivar de las carpetas de `Vocabularios/`.

## 6. 🟠 Varias fuentes de verdad para los datos — 🟡 Parcial

**Resuelto:**
- `manifest.json`, `pelis/*.json` y los vocabularios por año salen de un único comando (`actualizar.py`) a partir de los PDFs.
- Los scripts que editaban el manifest por su cuenta (`fix_*`, `reparse_*`, `generate_manifest.py`) están archivados.
- Ya no se pierden datos sin aviso: el comando deja un reporte de antes y después.

**Pendiente:**
- `actualizar.py` todavía lee el `manifest.json` anterior para rescatar el nivel, la clasificación y el póster de los títulos que no los tienen en su `pelis/*.json`. El archivo generado sigue funcionando como entrada.
- `pelis/*.json` mezcla datos que tú editas (nivel, análisis, TMDB) con datos generados (vocabulario, cantidades).
- `fanning-dashboard/add2027.js`, `old_manifest.json` y `old_manifest2.json` siguen en el repo.

**Recomendación:** mover el nivel, la clasificación y los ids de TMDB al catálogo (o a un `metadatos.json`) y dejar de leer el manifest anterior. Después, borrar `add2027.js` y los `old_manifest*.json`.

## 7. 🟠 Scripts de Python — 🟡 Parcial

**Resuelto:**
- El conteo y la generación viven en `scripts/metricas/`, un paquete pequeño con funciones reutilizables (`conteo.py`, `ranking.py`), un comando principal (`actualizar.py`), rutas relativas al repo (`rutas.py`) y `main()` con argumentos.
- La lógica de contar diálogos SRT ya no está copiada: hay una sola versión.
- Hay un `LEEME.md` que explica cómo usarlo.

**Pendiente:**
- 6 scripts sueltos en `scripts/` (`fetch_ratings.py`, `fix_tmdb_data.py`, `rename_episodes.py`, etc.) y 5 en la raíz (`check_missing.py`, `count_words.py`, `dump_names.py`, `read_pdf.py`, `scratch_report.py`), además de `fanning-dashboard/scripts/` y `fanning-dashboard/scratch/`.
- `scripts/archive/` tiene 76 archivos. Si ya no se usan, el historial de Git los conserva y se pueden borrar.
- `requirements.txt` no fija versiones y no incluye `PyMuPDF` ni `pyspellchecker`, que ahora sí se usan.

## 8. 🟠 Tipado débil — ❌ Pendiente

Siguen los 35 `any`. Un avance: `types/manifest.ts` ahora describe `aliases` y `years`, y el buscador nuevo usa esos tipos sin `any`.

**Recomendación:** definir `ExtraData`, `VocabularyItem` y `EpisodeExtra` en `types/` y usarlos en las páginas de detalle. Validar los JSON con `zod` en tiempo de build.

## 9. 🟡 Código muerto — 🟡 Parcial

- ✅ El botón **"Buscar"** ya tiene función.
- ❌ `src/data/mediaStats.ts` (2.012 líneas) sigue sin uso.
- ❌ `useTMDB.ts` sigue sin uso (punto 2).
- ❌ Siguen las 13 variables o imports sin uso que marca ESLint.
- `vocabularyOverrides` sigue vacío, y ahora tiene menos sentido: los errores se corrigen en el PDF y `actualizar.py` regenera todo. Conviene borrarlo para que nadie lo use creyendo que dura.

## 10. 🟡 Antipatrones de React — ❌ Pendiente

Sin cambios: estado derivado en `useEffect` en `DashboardClient`, `useState` para props fijas, `setTimeout` sin limpiar en las flashcards, barajado sesgado con `sort(() => Math.random() - 0.5)`, `alert()`/`prompt()` y `TimelineClient` cargando datos desde el navegador. Ver la primera versión del informe para el detalle de cada uno.

## 11. 🟡 Coincidencia de títulos frágil — 🟡 Parcial

- ✅ **Datos:** el cruce de PDFs con títulos ya no usa subcadenas. `catalogo.json` lo dice explícitamente. Antes asignaba diálogos equivocados (IO y Star Wars I compartían 759 líneas; Rocky I y Rocky III, 1.177).
- ✅ **Fotos de episodios:** `episodios_tmdb.py` compara el título de TMDB con el del PDF y avisa si no coinciden.
- ❌ **Página:** `TimelineClient.tsx` sigue con reglas a mano (`"inside out"`, `"star wars"`, `"ts:"`), y `SeriesClient.tsx` todavía empareja episodios con `ep.name.includes(e.name)`.

## 12. 🟡 Higiene del repositorio — 🟡 Parcial

- ✅ `.gitignore` ahora ignora `__pycache__/`, que se había colado en un commit.
- ❌ Siguen versionados: `old_manifest.json`, `old_manifest2.json`, `out.txt`, `kim_explore*.txt`, `dialogo_names.txt`, `vocab_names.txt`, `temp_report.md`, `tmdb_backup.json`, `prompt_revisión_codigo_proyecto-final.txt` y `fanning-dashboard/scratch/`.
- ❌ El historial de Git ocupa 219 MB por los PDFs. **Git LFS** sigue siendo la opción.

## 13. 🟡 Pruebas, CI y validación — 🟡 Parcial

- ✅ `scripts/metricas/test_conteo.py` prueba las reglas de conteo con los ejemplos de los criterios de `Metodología/`: subtítulos, créditos, marcadores de episodio, frases partidas, repetidas y horas.
- ✅ `verificar_dialogos.py` permite revisar un PDF página por página, y `revisar_ortografia.py` lista faltas de ortografía y puntuación de los vocabularios.
- ❌ No hay CI. Los 38 errores de ESLint siguen llegando a Vercel sin aviso.
- ❌ Nada valida la forma de los JSON antes del despliegue.

**Recomendación:** un workflow mínimo de GitHub Actions con `npm ci && npm run lint && npx tsc --noEmit && npm run build` y `python scripts/metricas/test_conteo.py`.

## 14. ⚪ Detalles menores — ❌ Pendiente

Sin cambios: `layout.tsx` usa `lang="en"` (debería ser `"es"`), el README del dashboard es el genérico de Next, hay CSS en línea con `dangerouslySetInnerHTML`, mezcla de sintaxis de Tailwind v3 y v4, y un `console.log` de depuración en `app/peliculas/[slug]/page.tsx`.

Un detalle nuevo: los porcentajes usan punto decimal ("93.65%") y los miles ahora usan punto ("1.000"). Conviene pasar los decimales a coma ("93,65%") para que no se confundan.

## 15. 🆕 🟠 Fotos de episodios guardadas por posición

`SeriesClient.tsx` busca el título y la foto de cada episodio en `tmdb.episodes["<n>"]`, donde `<n>` es la posición del episodio en la lista (1, 2, 3…), no su código. Si se agrega un episodio en medio (por ejemplo, uno de la temporada 1 cuando ya están la 2 y la 3), todas las fotos siguientes quedan corridas una posición.

**Recomendación:** guardar los datos de TMDB por código de episodio (`"S02E01"`, `"SP01"`) y buscarlos así en `SeriesClient`. `episodios_tmdb.py` ya calcula ese código, así que el cambio es pequeño.

## 16. 🆕 🟡 Archivos generados guardados en Git

`scripts/metricas/verificaciones/` (informes de `verificar_dialogos.py` y `revisar_ortografia.py`) y `reporte_ultima_actualizacion.md` se regeneran en cada ejecución. El informe de Barbie, por ejemplo, copia todos los subtítulos de la película. Versionarlos agrega ruido a cada commit.

**Recomendación:** agregar `scripts/metricas/verificaciones/` al `.gitignore`. El reporte de la última actualización se puede conservar si sirve como registro de cambios.

---

## Plan de acción sugerido (orden por impacto/esfuerzo)

1. **Rotar la API key** y quitarla de los 11 archivos (1 h).
2. **Borrar código y archivos muertos:** `mediaStats.ts`, `useTMDB.ts`, `vocabularyOverrides`, imports sin uso, `old_manifest*.json`, `add2027.js`, archivos temporales de la raíz y `fanning-dashboard/scratch/` (30 min).
3. **Guardar los datos de TMDB por código de episodio** (punto 15) antes de agregar episodios nuevos a las series (1-2 h).
4. **Usar `FlashcardViewer`** en Película y Serie y extraer los componentes compartidos (punto 3) (medio día).
5. **Arreglar el lint** hasta 0 errores y agregar CI con lint, tsc, build y las pruebas de Python (2-3 h).
6. **Mover nivel, clasificación e ids de TMDB al catálogo** y dejar de leer el manifest anterior (puntos 4 y 6) (2-3 h).
7. **Ordenar los scripts restantes**: llevar a `scripts/metricas/` los que se usan, borrar el resto y fijar `requirements.txt` (medio día).
8. Evaluar **Git LFS** para los PDFs.
