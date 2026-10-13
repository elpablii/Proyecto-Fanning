# Proyecto Fanning

Registro de inmersión en inglés: películas y series vistas, sus líneas de diálogo y las palabras y frases que no se entendieron. La página (`fanning-dashboard/`) muestra las métricas, el vocabulario de cada título con flashcards y la línea de tiempo de tandas.

## Cómo está organizado

| Carpeta | Qué hay | ¿Se edita a mano? |
|---|---|---|
| `Vocabularios/<año>/` | PDFs con las palabras y frases desconocidas de cada título | Sí |
| `Diálogos/` | PDFs con los subtítulos de cada título | Sí |
| `contenido/titulos/` | Una **ficha** por película o serie: nivel, clasificación, id de TMDB, análisis, imágenes y qué PDFs le corresponden | Sí |
| `contenido/tandas.json` | La línea de tiempo | Sí |
| `Metodología/` | Cómo se cuentan las líneas de diálogo y las palabras | Sí |
| `fanning-dashboard/public/data/` | Todo lo que lee la página | **No**: lo genera `fanning.py` |
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

   Abre la ficha y completa `"nivel"` (A1 a C2, o un rango como `"B1-B2"`), `"clasificacion"` (`TE`, `TE+7`, `+14` o `+18`) y `"analisis"`. Busca el id en [themoviedb.org](https://www.themoviedb.org) (es el número de la dirección de la película) y trae las imágenes:
   ```
   python fanning.py imagenes "Intensamente" --id 150540
   ```
   En las series también trae el título, la foto y la sinopsis de cada episodio.

4. **Actualizar la página**
   ```
   python fanning.py actualizar
   ```
   Si algo de una ficha está mal (un PDF que no existe, un nivel no válido, un JSON mal escrito), se detiene y explica qué corregir. Con `--probar` muestra qué cambiaría sin escribir nada.

Para ver qué datos les faltan a las fichas: `python fanning.py pendientes`.

## Quitar una película o serie

```
python fanning.py quitar "Intensamente"
```

Borra la ficha y actualiza la página. Con `--retirar-pdfs`, además mueve sus PDFs a `Retirados/` para que `nuevo` no vuelva a ofrecerlos (no se borran).

## Agregar una tanda

Agrega un bloque al final de `contenido/tandas.json`, igual a los anteriores, y corre `python fanning.py actualizar`.

## Corregir un error

- **Una palabra o traducción mal escrita:** se corrige en el PDF de vocabulario y se corre `actualizar`. Para encontrar errores: `python fanning.py revisar ortografia`.
- **Un conteo de diálogos que no cuadra:** `python fanning.py revisar dialogos "Diálogos/…/archivo.pdf"` muestra el conteo página por página.
- **Un póster equivocado:** se corre `python fanning.py imagenes "Título" --id <id correcto>` y después `actualizar`.
- **Nivel, clasificación o análisis:** se editan en la ficha y se corre `actualizar`.

## Todos los comandos

```
python fanning.py nuevo
python fanning.py actualizar [--probar]
python fanning.py quitar "Título" [--retirar-pdfs]
python fanning.py imagenes "Título" [--id N] [--rehacer]
python fanning.py pendientes
python fanning.py revisar ortografia
python fanning.py revisar dialogos "ruta.pdf" [--serie]
python fanning.py probar
```

Los detalles técnicos (formato de las fichas, qué hace cada script) están en `scripts/metricas/LEEME.md`.
