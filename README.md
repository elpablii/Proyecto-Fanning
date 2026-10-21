# Proyecto Fanning

Registro de inmersión en inglés: películas y series vistas, sus líneas de diálogo y las palabras y frases que no se entendieron. La página (`fanning-dashboard/`) muestra las métricas, el vocabulario de cada título con flashcards y la línea de tiempo de tandas.

## Cómo está organizado

| Carpeta | Qué hay | ¿Se edita a mano? |
|---|---|---|
| `Vocabularios/<año>/` | PDFs con las palabras y frases desconocidas de cada título | Sí |
| `Diálogos/` | PDFs con los subtítulos de cada título | Sí |
| `contenido/titulos/` | Una **ficha** por película o serie: clasificación, id de TMDB, análisis, imágenes y qué PDFs le corresponden. El nivel de inglés **no** se escribe: se calcula (ver `Metodología/Criterio de nivel de inglés (MCER).txt`) | Sí |
| `contenido/tandas.json` | La línea de tiempo | Sí |
| `Metodología/` | Cómo se cuentan las líneas de diálogo y las palabras | Sí |
| `fanning-dashboard/data/` | Todo lo que lee la página | **No**: lo genera `fanning.py` |
| `scripts/metricas/` | El código que cuenta y genera los datos | Solo para cambiar reglas |

## Requisitos

- Python 3 con `pip install -r scripts/requirements.txt`.
- Node.js para la página (ver `fanning-dashboard/README.md`).
- Una clave de TMDB en `fanning-dashboard/.env.local` (`TMDB_API_KEY=...`), solo para traer imágenes.

## Agregar una película o serie (4 pasos)

Ejemplo: agregar *Intensamente*, vista en 2024.

1. **Copiar los PDFs**
   - `Vocabularios/2024/Palabras desconocidas de Intensamente (lista definitiva).pdf`
   - `Diálogos/Diálogos pelis 2024/Dialogues from Inside Out to improve the vocabulary in English.pdf`

2. **Crear la ficha**
   ```
   python fanning.py nuevo
   ```
   Crea `contenido/titulos/intensamente.json` con los PDFs. Si el PDF de diálogos tiene otro nombre (como acá, que está en inglés), avisa que no lo pudo asignar: abre la ficha y agrega su ruta en `"pdfs"` → `"dialogos"`.

   En una serie, los PDFs de episodios nuevos se agregan solos a la ficha que ya existe.

3. **Completar la ficha y traer las imágenes**

   Abre la ficha y completa `"clasificacion"` (`TE`, `TE+7`, `+14` o `+18`) y `"analisis"`. Busca el id en [themoviedb.org](https://www.themoviedb.org) (es el número de la dirección de la película) y trae las imágenes:
   ```
   python fanning.py imagenes "Intensamente" --id 150540
   ```
   También guarda la duración (en minutos). En las series trae además el título, la foto, la sinopsis y la duración de cada episodio. Si TMDB no tiene la duración, la página la estima con el último subtítulo y la muestra con «≈». Para completar las que falten en todas las fichas: `python scripts/metricas/duracion_tmdb.py`.

4. **Actualizar la página**
   ```
   python fanning.py actualizar
   ```
   Cuenta las palabras y las líneas y calcula el nivel de inglés (MCER) de cada película, serie y episodio. Si algo de una ficha está mal (un PDF que no existe, un JSON mal escrito), se detiene y explica qué corregir. Con `--probar` muestra qué cambiaría sin escribir nada.

Para ver qué datos les faltan a las fichas: `python fanning.py pendientes`. Si no sabes el id de TMDB, `python fanning.py ids` lo busca y `python fanning.py ids --guardar` guarda los que confirma (cuando el póster de TMDB es el mismo de la ficha).

## Quitar una película o serie

```
python fanning.py quitar "Intensamente"
```

Borra la ficha y actualiza la página. Con `--retirar-pdfs`, además mueve sus PDFs a `Retirados/` para que `nuevo` no vuelva a ofrecerlos (no se borran).

## Agregar una tanda

Agrega un bloque al final de `contenido/tandas.json`, igual a los anteriores, y corre `python fanning.py tandas` (regenera la línea de tiempo y el diccionario, en segundos). Ejemplo:

```json
{
  "id": 80,
  "title": "74° Tanda",
  "date": "Sábado, 16/01/2027",
  "items": [
    "Barbie",
    { "texto": "The Big Bang Theory (T6 EP 1-3)", "titulo": "The Big Bang Theory", "episodios": ["S06E01", "S06E02", "S06E03"] }
  ]
}
```

- Cada ítem es el **título exacto de su ficha**, o `{"texto": "…", "titulo": "…"}` si quieres mostrarlo con otro nombre.
- Una tanda dividida en partes se escribe con letra (`"14a° Tanda"`, `"14b° Tanda"`): las partes son **una sola tanda** y la página las cuenta y las grafica juntas.
- Las **horas de inglés** de cada tanda son: primera vista + repaso diario del vocabulario (leído en voz alta a 140 palabras por minuto, una vez al día hasta la siguiente tanda) + segunda vista. Las calcula `scripts/metricas/linea_tiempo.py`.
- En las series, `"episodios"` dice qué episodios entraron en la tanda (sin eso se entiende la serie completa). Las palabras, líneas, comprensión y duración de la tanda se calculan solas; si la duración supera las 6 horas (5 hasta la 68° Tanda), la tanda se marca como «Dos sesiones» (ver Reglas).
- Las tandas de Gala llevan `(Gala)`, `(Navidad)` o `(Fin de Año)` en el título.
- Si una tanda de comienzos de enero cierra el ciclo anterior, agrega `"ciclo": "2026"`.

## Empezar un ciclo nuevo (año)

1. Crea las carpetas `Vocabularios/2027/` y `Diálogos/Diálogos pelis 2027/` (la página toma el año nuevo sola).
2. Agrega el ciclo a `contenido/ciclos.json` con su nombre y descripción, por ejemplo `{"anio": "2027", "nombre": "Fase …", "descripcion": "…"}`.

## Corregir un error

- **Una palabra o traducción mal escrita:** se corrige en el PDF de vocabulario y se corre `actualizar`. Para encontrar errores: `python fanning.py revisar ortografia`.
- **Un conteo de diálogos que no cuadra:** `python fanning.py revisar dialogos "Diálogos/…/archivo.pdf"` muestra el conteo página por página.
- **Un póster equivocado:** se corre `python fanning.py imagenes "Título" --id <id correcto>` y después `actualizar`.
- **Nivel, clasificación o análisis:** se editan en la ficha y se corre `actualizar`.

## Todos los comandos

```
python fanning.py nuevo
python fanning.py actualizar [--probar]
python fanning.py tandas
python fanning.py quitar "Título" [--retirar-pdfs]
python fanning.py imagenes "Título" [--id N] [--rehacer]
python fanning.py pendientes
python fanning.py ids [--guardar]
python fanning.py origen [--rehacer]
python fanning.py validar
python fanning.py revisar ortografia
python fanning.py revisar dialogos "ruta.pdf" [--serie]
python fanning.py probar
```

Los detalles técnicos (formato de las fichas, qué hace cada script) están en `scripts/metricas/LEEME.md`.
