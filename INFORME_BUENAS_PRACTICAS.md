# Informe de Buenas Prácticas de Ingeniería de Software — Proyecto Fanning

**Primera versión:** 2026-10-02
**Actualizado:** 2026-10-13. Etapas 1 a 4 del plan hechas. Queda pendiente renovar la clave de TMDB (lo hace el dueño de la cuenta) y algunos puntos menores.
**Alcance:** `fanning-dashboard/` (Next.js 16 + React 19 + TypeScript), scripts de Python (`scripts/`, `fanning-dashboard/scripts/`, `fanning-dashboard/scratch/` y la raíz) y la organización del repositorio.
**Contexto:** es una aplicación personal, compartida con amigos, sin usuarios anónimos ni datos sensibles. Por eso la severidad se calibra con ese contexto. No se exige lo mismo que a un producto comercial, pero sí lo que ahorra trabajo y evita romper la app.

**Verificaciones ejecutadas (2026-10-13, después de la etapa 4):**
- `npx tsc --noEmit`: ✅ sin errores de tipos.
- `npm run lint`: ✅ **0 errores y 0 advertencias**. Eran 59 problemas el 2 de octubre.

| Regla | 2 de octubre | 13 de octubre |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 35 | 0 |
| `@typescript-eslint/no-unused-vars` | 13 | 0 |
| `@next/next/no-img-element` | 7 | desactivada a propósito (ver punto 10) |
| `react-hooks/set-state-in-effect` | 3 | 0 |
| `react-hooks/exhaustive-deps` | 1 | 0 |

- `python fanning.py probar`: ✅ 15 pruebas, todas pasan.
- `python fanning.py validar`: ✅ 177 fichas sin errores.
- `npm run build`: ✅ genera las 183 páginas (177 títulos).
- Las mismas comprobaciones corren solas en GitHub (`.github/workflows/ci.yml`).

---

## Qué cambió desde la primera versión

Entre el 11 y el 12 de octubre se reemplazó el sistema de datos:

- **Un solo flujo de métricas** en `scripts/metricas/`. `catalogo.json` dice qué PDFs son de cada título. `conteo.py` aplica los criterios escritos en `Metodología/`. `actualizar.py` genera `pelis/*.json`, los vocabularios por año y `manifest.json`.
- **Se archivaron los scripts que reescribían los datos:** `generate_manifest.py`, `count_*`, `fix_*_flat`, `reparse_*`, `generate_json.py` y `find_typos.py`. Este último había dañado el vocabulario con un corrector ortográfico.
- **El tipo (serie o película) y el cruce de títulos salen del catálogo**, no de listas a mano ni de coincidencias por subcadena.
- **Se agregaron pruebas** de las reglas de conteo.
- **El botón "Buscar" ya funciona**: busca por título o por el nombre en inglés, filtra por tipo y se abre con Ctrl + K.
- **Los números usan punto de miles** mediante una función común, `lib/formato.ts`.

El 13 de octubre (etapas 1 a 4):

- **Datos:** una ficha por título en `contenido/`, un solo comando (`fanning.py`) para agregar, quitar y actualizar, y guía en el `README.md`.
- **Página:** las páginas de película y serie comparten componentes (`components/media/`, `FlashcardViewer`), la lectura de datos está en `lib/data.ts`, la comprensión en `lib/stats.ts` y los tipos en `types/`. Sin `any` y ESLint en 0.
- **Clave de TMDB:** ya no está escrita en ningún archivo del proyecto; solo en `.env.local`. Falta renovarla (punto 1).
- **Revisión automática** en GitHub en cada push a `main`.

---

## Resumen por severidad y estado

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | API key de TMDB escrita en el código y publicada en Git | 🔴 Alta | ✅ Resuelto (2026-10-13) |
| 2 | La refactorización quedó a medias: `FlashcardViewer` y `useTMDB` existen pero nadie los usa | 🔴 Alta | ✅ Resuelto (2026-10-13) |
| 3 | Duplicación masiva entre `PeliculaClient` y `SeriesClient` | 🔴 Alta | ✅ Resuelto (2026-10-13) |
| 4 | Diccionario `tmdbOverrides` duplicado y con valores que ya no coinciden | 🟠 Media | ✅ Resuelto (2026-10-13) |
| 5 | Lista `special_series` y años escritos a mano | 🟠 Media | ✅ Resuelto |
| 6 | Varias fuentes de verdad para los datos | 🟠 Media | ✅ Resuelto (2026-10-13) |
| 7 | Scripts de Python de un solo uso, copiados y pegados, con rutas absolutas | 🟠 Media | 🟡 Parcial (quedan scripts sueltos en la raíz) |
| 8 | Tipado débil: `any` en props, datos del manifest y respuestas de TMDB | 🟠 Media | ✅ Resuelto (2026-10-13) |
| 9 | Código muerto: `mediaStats.ts`, imports y el botón "Buscar" sin uso | 🟡 Baja | ✅ Resuelto (2026-10-13) |
| 10 | Antipatrones de React | 🟡 Baja | ✅ Resuelto (2026-10-13) |
| 11 | Coincidencia de títulos por subcadena (`includes`), frágil | 🟡 Baja | 🟡 Parcial (queda `TimelineClient`) |
| 12 | Archivos temporales y binarios versionados en Git | 🟡 Baja | 🟡 Parcial (temporales borrados; falta Git LFS) |
| 13 | No hay pruebas, CI ni validación de datos | 🟡 Baja | ✅ Resuelto (2026-10-13) |
| 14 | Detalles menores: `lang="en"`, README genérico, etc. | ⚪ Menor | ✅ Resuelto (2026-10-13) |
| 15 | 🆕 Fotos de episodios guardadas por posición, no por código de episodio | 🟠 Media | ✅ Resuelto (2026-10-13) |
| 16 | 🆕 Archivos generados guardados en Git (`verificaciones/`, reportes) | 🟡 Baja | ✅ Resuelto (2026-10-13) |
| 17 | 🎯 Escalabilidad: agregar o quitar contenido sin depender de una IA | 🔴 Alta | ✅ Resuelto (2026-10-13) |
| 18 | 🎯 Estructura de datos: una ficha por título con todo lo que se edita a mano | 🔴 Alta | ✅ Resuelto (2026-10-13) |
| 19 | 🎯 Eliminar el botón "Corregir TMDB" | 🟠 Media | ✅ Resuelto (2026-10-13) |

---

## 1. 🔴 API key de TMDB escrita en el código — ✅ Resuelto (2026-10-13)

La clave se renovó en TMDB el 2026-10-13 y la nueva está solo en `fanning-dashboard/.env.local`. La vieja, que sigue en el historial de Git, ya no sirve.

**Avance (2026-10-13):** la clave ya no está escrita en ningún archivo del proyecto. Los scripts que la tenían eran viejos y escribían en `pelis/*.json`, que ahora se genera; se archivaron en `scripts/archive/` y leen la clave de `TMDB_API_KEY`. La única copia está en `fanning-dashboard/.env.local`, que Git ignora.

**Falta:** renovar la clave en TMDB (la actual sigue en el historial de Git) y poner la nueva en `.env.local` como `TMDB_API_KEY`. Si en Vercel está definida `NEXT_PUBLIC_TMDB_API_KEY`, se puede borrar: la página ya no la usa.

**Diagnóstico original:**

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
- ✅ **`hooks/useTMDB.ts`** se borró el 2026-10-13 junto con `lib/tmdb.ts`. Los pósters, fondos y fotos de episodios los ponen los scripts `posters_tmdb.py` y `episodios_tmdb.py`.

**Recomendación:** usar `<FlashcardViewer>` en las dos páginas, borrar `useTMDB.ts` y corregir `PLAN_REFACTORIZACION.md`, que marca estos puntos como hechos.

## 3. 🔴 Duplicación entre `PeliculaClient.tsx` y `SeriesClient.tsx` — ❌ Pendiente

Se siguen repitiendo en ambos: el aviso +18, el fondo, el póster, el visor de imágenes, el modal de flashcards y el cálculo de comprensión (también en `MovieCard.tsx` y `DashboardClient.tsx`, con el número mágico `99.445`).

Un avance: el formato de números ya está centralizado en `lib/formato.ts` (`miles()`). Es el mismo camino que conviene seguir con el cálculo de comprensión.

**Recomendación:** extraer `AdultContentGate`, `BackdropLayout`, `MediaHero` e `ImageLightbox`, y llevar el cálculo a `lib/stats.ts` → `calcComprehension(dialogues, unknownWords)`.

## 4. 🟠 `tmdbOverrides` duplicado y divergente — ❌ Pendiente

La copia de la página (`src/lib/tmdb.ts`) se borró el 2026-10-13. Queda la de `fanning-dashboard/scripts/fetch_tmdb.ts`. Además, hay una tercera fuente: los ids que se le pasan a `posters_tmdb.py` y los fijos de `episodios_tmdb.py` (`TMDB_ID`, `ESPECIAL_PELICULA`).

**Recomendación:** guardar el id de TMDB de cada título en `scripts/metricas/catalogo.json`, por ejemplo como `"tmdb": {"tipo": "movie", "id": 12}`. Así habría una sola fuente que leen todos los scripts, y `tmdbOverrides` se podría borrar.

## 5. 🟠 Serie o película y años escritos a mano — ✅ Resuelto

`generate_manifest.py` (con `special_series`) está archivado. Ahora el tipo sale del catálogo: un título es serie si su vocabulario anuncia episodios o si sus diálogos están en `Diálogos Series/`. Tampoco hace falta editar nada para agregar una serie nueva.

Los años ya no están escritos en ningún lado: salen de las carpetas de `Vocabularios/` (2026-10-13). Un año nuevo es crear `Vocabularios/2028/`.

## 6. 🟠 Varias fuentes de verdad para los datos — ✅ Resuelto (2026-10-13)

Con las fichas (punto 18), la única fuente de lo que se edita a mano es `contenido/`. `actualizar.py` ya no lee el manifest anterior ni los `pelis/*.json` viejos: genera todo desde las fichas y los PDFs. `add2027.js` y `old_manifest*.json` se borraron en la etapa 1.

**Diagnóstico de la versión anterior:**

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
- ✅ `requirements.txt` fija las versiones de `pymupdf` y `pyspellchecker` (2026-10-13). `pytest` se quitó: las pruebas se corren con `python fanning.py probar`.

## 8. 🟠 Tipado débil — ❌ Pendiente

Siguen los 35 `any`. Un avance: `types/manifest.ts` ahora describe `aliases` y `years`, y el buscador nuevo usa esos tipos sin `any`.

**Recomendación:** definir `ExtraData`, `VocabularyItem` y `EpisodeExtra` en `types/` y usarlos en las páginas de detalle. Validar los JSON con `zod` en tiempo de build.

## 9. 🟡 Código muerto — ✅ Resuelto (2026-10-13)

- ✅ El botón **"Buscar"** ya tiene función.
- ✅ `src/data/mediaStats.ts` (2.012 líneas) se borró.
- ✅ `useTMDB.ts` y `lib/tmdb.ts` se borraron (2026-10-13).
- ✅ Se quitaron las variables e imports sin uso. ESLint ya no marca ninguno.
- ✅ `vocabularyOverrides` y `englishAnalysisOverrides` se borraron. Estaban vacíos, y los errores ahora se corrigen en el PDF.

## 10. 🟡 Antipatrones de React — ❌ Pendiente

Sin cambios: estado derivado en `useEffect` en `DashboardClient`, `useState` para props fijas, `setTimeout` sin limpiar en las flashcards, barajado sesgado con `sort(() => Math.random() - 0.5)`, `alert()`/`prompt()` y `TimelineClient` cargando datos desde el navegador. Ver la primera versión del informe para el detalle de cada uno.

## 11. 🟡 Coincidencia de títulos frágil — 🟡 Parcial

- ✅ **Datos:** el cruce de PDFs con títulos ya no usa subcadenas. `catalogo.json` lo dice explícitamente. Antes asignaba diálogos equivocados (IO y Star Wars I compartían 759 líneas; Rocky I y Rocky III, 1.177).
- ✅ **Fotos de episodios:** `episodios_tmdb.py` compara el título de TMDB con el del PDF y avisa si no coinciden.
- ✅ **Episodios:** `SeriesClient.tsx` ya empareja cada episodio por su código (`S02E01`), sin `includes` (2026-10-13).
- ❌ **Línea de tiempo:** `TimelineClient.tsx` sigue con reglas a mano (`"inside out"`, `"star wars"`, `"ts:"`) porque las tandas guardan los títulos como texto libre ("Star Wars VI: Return of the Jedi"). Se resolvería guardando en `contenido/tandas.json` el título exacto de la ficha.

## 12. 🟡 Higiene del repositorio — 🟡 Parcial (temporales resueltos)

- ✅ `.gitignore` ahora ignora `__pycache__/`, que se había colado en un commit.
- ✅ Se borraron (2026-10-13) `old_manifest.json`, `old_manifest2.json`, `out.txt`, `kim_explore*.txt`, `dialogo_names.txt`, `vocab_names.txt`, `temp_report.md`, `tmdb_backup.json`, `prompt_revisión_codigo_proyecto-final.txt`, `fanning-dashboard/add2027.js` y `fanning-dashboard/scratch/`. Siguen en el historial de Git.
- ⚠️ Dos scripts sueltos de la raíz, `check_missing.py` y `dump_names.py`, leían algunos de esos archivos y ya no funcionan. Entran en el punto 7.
- ❌ El historial de Git ocupa 219 MB por los PDFs. **Git LFS** sigue siendo la opción.

## 13. 🟡 Pruebas, CI y validación — 🟡 Parcial

- ✅ `scripts/metricas/test_conteo.py` prueba las reglas de conteo con los ejemplos de los criterios de `Metodología/`: subtítulos, créditos, marcadores de episodio, frases partidas, repetidas y horas.
- ✅ `verificar_dialogos.py` permite revisar un PDF página por página, y `revisar_ortografia.py` lista faltas de ortografía y puntuación de los vocabularios.
- ❌ No hay CI. Los 38 errores de ESLint siguen llegando a Vercel sin aviso.
- ❌ Nada valida la forma de los JSON antes del despliegue.

**Recomendación:** un workflow mínimo de GitHub Actions con `npm ci && npm run lint && npx tsc --noEmit && npm run build` y `python scripts/metricas/test_conteo.py`.

## 14. ⚪ Detalles menores — ❌ Pendiente

✅ Hay un `README.md` en la raíz y el de `fanning-dashboard/` ya no es el genérico (2026-10-13). Pendientes: `layout.tsx` usa `lang="en"` (debería ser `"es"`), hay CSS en línea con `dangerouslySetInnerHTML` y mezcla de sintaxis de Tailwind v3 y v4. ✅ Se quitó el `console.log` de depuración de `app/peliculas/[slug]/page.tsx`.

Un detalle nuevo: los porcentajes usan punto decimal ("93.65%") y los miles ahora usan punto ("1.000"). Conviene pasar los decimales a coma ("93,65%") para que no se confundan.

## 15. 🆕 🟠 Fotos de episodios guardadas por posición — ✅ Resuelto (2026-10-13)

Los datos de TMDB de cada episodio se guardan en la ficha por código (`"S02E01"`), y la página los busca por ese código. Agregar un episodio en medio ya no corre las fotos.

**Diagnóstico original:**

`SeriesClient.tsx` busca el título y la foto de cada episodio en `tmdb.episodes["<n>"]`, donde `<n>` es la posición del episodio en la lista (1, 2, 3…), no su código. Si se agrega un episodio en medio (por ejemplo, uno de la temporada 1 cuando ya están la 2 y la 3), todas las fotos siguientes quedan corridas una posición.

**Recomendación:** guardar los datos de TMDB por código de episodio (`"S02E01"`, `"SP01"`) y buscarlos así en `SeriesClient`. `episodios_tmdb.py` ya calcula ese código, así que el cambio es pequeño.

## 16. 🆕 🟡 Archivos generados guardados en Git — ✅ Resuelto (2026-10-13)

`scripts/metricas/verificaciones/` está en el `.gitignore` y se sacó del repositorio. Los informes se siguen generando en tu disco.

**Diagnóstico original:**

`scripts/metricas/verificaciones/` (informes de `verificar_dialogos.py` y `revisar_ortografia.py`) y `reporte_ultima_actualizacion.md` se regeneran en cada ejecución. El informe de Barbie, por ejemplo, copia todos los subtítulos de la película. Versionarlos agrega ruido a cada commit.

**Recomendación:** agregar `scripts/metricas/verificaciones/` al `.gitignore`. El reporte de la última actualización se puede conservar si sirve como registro de cambios.

---

## 17. 🎯 🔴 Escalabilidad: agregar o quitar contenido sin depender de una IA — ✅ Resuelto (2026-10-13)

**Etapa 3 (2026-10-13):** un solo comando en la raíz, `fanning.py`, con todo en español:

```
python fanning.py nuevo                       # PDFs nuevos -> fichas, y qué falta completar
python fanning.py actualizar [--probar]       # valida, cuenta y genera la página
python fanning.py quitar "Título" [--retirar-pdfs]
python fanning.py imagenes "Título" [--id N]  # póster, fondo, fotos y episodios desde TMDB
python fanning.py pendientes                  # datos que faltan en las fichas
python fanning.py revisar ortografia | dialogos "ruta.pdf"
python fanning.py probar                      # pruebas del conteo
```

- `quitar` pide confirmación, sugiere títulos parecidos si el nombre no coincide y, con `--retirar-pdfs`, mueve los PDFs a `Retirados/` (no los borra).
- El `README.md` de la raíz explica cómo agregar una película en 4 pasos, cómo quitarla, cómo agregar una tanda y cómo corregir errores.
- Se probó el ciclo completo con una película de prueba: `nuevo` creó la ficha y listó lo pendiente; `quitar --retirar-pdfs` borró la ficha, movió el PDF y regeneró la página sin ella.

**Avance de la etapa 2:**

**Avance (2026-10-13), con la etapa 2:**
- Agregar: `nuevos_titulos.py` detecta los PDFs nuevos y crea la ficha (o agrega los PDFs a la ficha existente). Ya no hay que editar código: el nombre en inglés de un PDF de diálogos se pone en la ficha.
- Quitar: se borra la ficha y `actualizar.py --escribir` borra sus datos generados.
- Validación: `actualizar.py` revisa las fichas antes de publicar y explica en español qué falta y en qué archivo.
- Guía paso a paso en `scripts/metricas/LEEME.md`.

**Diagnóstico original:**

**Objetivo:** que agregar o quitar una película o serie sea una tarea de minutos, que se pueda hacer sin ayuda de una IA y sin riesgo de romper la página.

**Cómo es hoy agregar una película:**
1. Copiar los PDFs de vocabulario y de diálogos a sus carpetas.
2. Correr `construir_catalogo.py`. Si el nombre en inglés del PDF de diálogos no se parece al del vocabulario, editar el diccionario `TRADUCCIONES` dentro del código Python.
3. Correr `posters_tmdb.py` con el id de TMDB, que no queda guardado en ningún lado.
4. Si es una serie, correr `episodios_tmdb.py`, que puede necesitar ids fijos escritos en el código (`TMDB_ID`, `ESPECIAL_PELICULA`).
5. Poner a mano el nivel, la clasificación y el análisis en `pelis/<título>.json`, un archivo que también se regenera.
6. Correr `actualizar.py --escribir`.
7. Agregar la tanda a mano en `timeline.json` y en `Tandas/*.md`.

**Cómo es hoy quitar una:** no hay un camino. Si se borra el PDF, el catálogo sigue apuntando a él y `actualizar.py` falla. Hay que editar `catalogo.json` y borrar a mano `pelis/<título>.json` y los vocabularios por año.

**Problemas para escalar:**
- Hay que **editar código** (`TRADUCCIONES`, `TMDB_ID`) para agregar contenido.
- Los datos de un mismo título están en **cinco lugares** (ver el punto 18).
- Son **varios comandos** en un orden que hay que recordar.
- **Nada revisa** que lo cargado esté completo. Un título sin id de TMDB o sin nivel se publica igual, con valores por defecto ("B2", "TE").
- Los mensajes de error son de Python y no explican qué hay que corregir.

**Recomendación:**
- **Un solo punto de entrada**, con pocos comandos en español:
  ```
  python fanning.py nuevo           # detecta PDFs nuevos y crea la ficha del título
  python fanning.py actualizar      # TMDB + conteo + manifest + validación
  python fanning.py quitar "Título"
  python fanning.py revisar         # ortografía y verificación de diálogos
  ```
- `nuevo` crea la ficha del título (punto 18) con todo lo que se puede deducir: tipo, PDFs, años y nombre en inglés. Lo que no puede deducir (id de TMDB, nivel, clasificación) queda marcado como pendiente.
- `actualizar` **valida antes de publicar**. Si una ficha está incompleta o un PDF no existe, se detiene y explica en español qué falta y en qué archivo.
- `quitar` borra la ficha y los datos generados de ese título (o lo marca como oculto) y regenera todo.
- Una guía corta en el README: **"Cómo agregar una película en 4 pasos"**, con un ejemplo real.

## 18. 🎯 🔴 Estructura de datos — ✅ Resuelto (2026-10-13)

Se creó `contenido/` con 177 fichas (`contenido/titulos/*.json`) y `contenido/tandas.json`, migrados automáticamente de los datos que ya existían. La página quedó igual: se comparó título por título (palabras, líneas, niveles, análisis, sinopsis, fotos y datos de cada episodio). La única diferencia es la traducción que se muestra en el ranking cuando dos empatan, que ahora es siempre la más completa.

- `catalogo.json`, `construir_catalogo.py` (con `TRADUCCIONES`) y el script de migración se archivaron en `scripts/archive/`.
- `episodios_tmdb.py` y `posters_tmdb.py` leen el id de TMDB de la ficha y escriben en ella. Ya no tienen ids escritos en el código.
- Se quitaron los datos generados de tres títulos sin ficha (duplicados viejos de Kim Possible 2019 y The Polar Express).
- Pendiente: 120 fichas no tienen id de TMDB. No afecta a la página (ya tienen póster e imágenes), pero sin id no se pueden volver a pedir.

**Propuesta original:**

**Cómo es hoy:** los datos de un título están repartidos así:

| Dónde | Qué guarda | Quién lo edita |
|---|---|---|
| `scripts/metricas/catalogo.json` | qué PDFs son de cada título y su tipo | script y a mano |
| `construir_catalogo.py` (`TRADUCCIONES`) | nombre en inglés de los PDFs de diálogos | a mano, dentro del código |
| `pelis/<título>.json` | nivel, análisis y TMDB (a mano) **mezclados** con vocabulario y cantidades (generados) | ambos |
| `manifest.json` anterior | nivel, clasificación y póster de respaldo | generado, pero se lee como fuente |
| `lib/tmdb.ts`, `fetch_tmdb.ts`, `episodios_tmdb.py` | ids de TMDB | a mano, dentro del código |
| `timeline.json` y `Tandas/*.md` | tandas y fechas | a mano, por separado |

**Recomendación:** separar en dos zonas que nunca se mezclen.

```
contenido/                      ← lo ÚNICO que se edita a mano
  titulos/
    intensamente.json           ← una ficha por título
    the-big-bang-theory.json
  tandas.json                   ← la línea de tiempo
Vocabularios/<año>/*.pdf        ← igual que hoy
Diálogos/.../*.pdf              ← igual que hoy

fanning-dashboard/public/data/  ← todo generado; nunca se edita a mano
```

Ejemplo de ficha:

```json
{
  "titulo": "Intensamente",
  "tipo": "pelicula",
  "nivel": "B1",
  "clasificacion": "TE",
  "tmdb": { "tipo": "movie", "id": 150540 },
  "analisis": "…",
  "pdfs": {
    "vocabulario": ["Vocabularios/2024/Palabras desconocidas de Intensamente (lista definitiva).pdf"],
    "dialogos": ["Diálogos/Diálogos pelis 2024/Dialogues from Inside Out to improve the vocabulary in English.pdf"]
  }
}
```

En una serie, la ficha agrega los datos de cada episodio guardados por **código de episodio**, lo que resuelve el punto 15:

```json
"episodios": { "S01E03": { "nivel": "C1", "analisis": "…" } }
```

**Qué se gana:**
- **Agregar** un título es crear una ficha, o dejar que `nuevo` la cree. **Quitarlo** es borrarla.
- El id de TMDB vive en la ficha. Desaparecen `tmdbOverrides`, `TRADUCCIONES`, `TMDB_ID` y `ESPECIAL_PELICULA` (resuelve los puntos 4 y 6).
- `actualizar` ya no lee el manifest anterior: lo que no está en una ficha, no existe.
- Las fichas son pequeñas y legibles. Se pueden editar a mano o desde un futuro panel de administración.
- Las fichas se pueden validar antes de publicar.

**Migración:** se puede generar una sola vez, de forma automática, a partir de lo que ya existe: `catalogo.json`, los campos editados de `pelis/*.json`, los ids de TMDB ya usados y `timeline.json`. Después se borran las fuentes viejas.

## 19. 🎯 🟠 Eliminar el botón "Corregir TMDB" — ✅ Resuelto (2026-10-13)

Se borraron el botón de `PeliculaClient.tsx`, `hooks/useTMDB.ts` y `lib/tmdb.ts`. Con eso ESLint bajó de 59 a 49 problemas.

**Diagnóstico original:**

El botón de la página de cada película (`PeliculaClient.tsx`) pide un id con `window.prompt()` y lo guarda en el `localStorage` del navegador. Ese valor solo lo leía `useTMDB.ts`, que ya no se usa, así que el botón **no tiene ningún efecto**. Además, lo guardado queda solo en ese navegador.

**Recomendación:** borrar el botón, `useTMDB.ts` y `lib/tmdb.ts`. Para corregir un póster o una sinopsis, se pone el id de TMDB en la ficha del título (punto 18) y se corre `actualizar`.

---

## Plan de acción sugerido (por etapas)

**Etapa 1: limpieza rápida — ✅ hecha el 2026-10-13, salvo la clave de TMDB.**
1. ✅ Eliminar "Corregir TMDB", `useTMDB.ts`, `lib/tmdb.ts`, `mediaStats.ts`, `vocabularyOverrides`, `englishAnalysisOverrides` y los imports sin uso (puntos 2, 9 y 19).
2. ✅ Borrar los archivos muertos: `old_manifest*.json`, `add2027.js`, temporales de la raíz y `fanning-dashboard/scratch/` (punto 12).
3. ✅ Ignorar `scripts/metricas/verificaciones/` en Git (punto 16).
4. ❌ Rotar la API key y quitarla de los archivos que quedan (punto 1). Requiere generar una clave nueva en la cuenta de TMDB.

**Etapa 2: estructura de datos — ✅ hecha el 2026-10-13.**
5. ✅ Crear `contenido/titulos/*.json` migrando lo que ya existe, con los ids de TMDB y los datos por episodio guardados por código (puntos 4, 6, 15 y 18).
6. ✅ Hacer que los scripts lean solo las fichas y dejen de leer el manifest anterior.
7. ✅ Pasar `timeline.json` a `contenido/tandas.json`.

**Etapa 3: flujo para agregar y quitar — ✅ hecha el 2026-10-13.**
8. ✅ `fanning.py` con `nuevo`, `actualizar`, `quitar`, `imagenes`, `pendientes`, `revisar` y `probar` (punto 17).
9. ✅ Guía "Cómo agregar una película" en el README.

**Etapa 4: calidad del código — ✅ hecha el 2026-10-13.**
10. ✅ `FlashcardViewer` en las dos páginas y componentes compartidos: `MediaShell` (fondo, aviso +18, volver), `MediaHero` (póster y título), `ImageLightbox`; datos en `lib/data.ts`, comprensión en `lib/stats.ts` (puntos 2 y 3).
11. ✅ Tipos (`types/media.ts`, `types/manifest.ts`) en lugar de `any` y ESLint en 0 (puntos 8 y 10). Flashcards con barajado parejo (Fisher–Yates), sin `alert()` y sin `setTimeout` sueltos. La portada calcula sus cifras sin `useEffect` y lee el año de la URL con `useSearchParams`. La línea de tiempo recibe los datos del servidor (sin descargas ni spinner). Se quitó un modal de la portada que nunca se abría.
12. ✅ Revisión automática en GitHub con pruebas, validación de fichas, lint, tipos y build (punto 13).
13. ✅ `lang="es"`, coma decimal en los porcentajes ("93,65%"), CSS de las flashcards en `globals.css`, sintaxis de Tailwind v4 en todos los componentes y páginas que solo existen para títulos del manifest (`dynamicParams = false`) (punto 14).

**Pendientes que quedan:**
- Línea de tiempo: guardar en `contenido/tandas.json` el título exacto de cada ficha para no emparejar por texto (punto 11).
- Scripts sueltos de la raíz (`check_missing.py`, `count_words.py`, `dump_names.py`, `read_pdf.py`, `scratch_report.py`) y en `scripts/` (punto 7).
- 120 fichas sin id de TMDB (no afecta a la página).

**Más adelante:** evaluar Git LFS para los PDFs.
