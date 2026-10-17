# Datos de la página

Hay dos zonas que no se mezclan:

| Zona | Qué hay | ¿Se edita a mano? |
|---|---|---|
| `contenido/titulos/*.json` | Una **ficha** por película o serie: clasificación, id de TMDB, análisis, imágenes, PDFs y datos de cada episodio (el nivel de inglés se calcula, no se escribe) | **Sí** |
| `contenido/tandas.json` | La línea de tiempo (tandas y fechas) | **Sí** |
| `Vocabularios/` y `Diálogos/` | Los PDFs, la fuente de verdad de las palabras y las líneas | Sí (se corrigen los PDFs) |
| `fanning-dashboard/data/` | Todo lo que lee la página | **No**: se genera |

Las palabras y las líneas se cuentan con los criterios de `Metodología/`:

- `Criterio de conteo de líneas de diálogo.txt`
- `Criterio de conteo de palabras y frases.txt`

## Agregar una película o serie

1. Copia los PDFs a `Vocabularios/<año>/` y `Diálogos/...`.
2. Corre:
   ```
   python scripts/metricas/nuevos_titulos.py
   ```
   Crea la ficha en `contenido/titulos/` (o agrega los PDFs a la ficha que ya existe, por ejemplo episodios nuevos de una serie). Si avisa que un PDF de diálogos no coincide con ninguna ficha, agrega su ruta a mano en `"pdfs"` → `"dialogos"` de la ficha que corresponde.
3. Abre la ficha y completa `clasificacion` (`TE`, `TE+7`, `+14` o `+18`) y `analisis`. Pon el id de TMDB y trae las imágenes:
   ```
   python scripts/metricas/posters_tmdb.py "Título" --id 12345            # película
   python scripts/metricas/posters_tmdb.py "Título" --id 12345 --serie    # serie
   python scripts/metricas/episodios_tmdb.py --serie "Título"             # fotos de episodios (solo series)
   ```
4. Actualiza la página:
   ```
   python scripts/metricas/actualizar.py              # muestra qué cambiaría, no escribe
   python scripts/metricas/actualizar.py --escribir
   ```

## Quitar una película o serie

Borra su ficha de `contenido/titulos/` y corre `actualizar.py --escribir`. Sus datos generados se borran solos. Los PDFs se pueden dejar o borrar; si se dejan, `nuevos_titulos.py` volverá a ofrecer una ficha para ellos.

## La Realeza

La lista está en `contenido/realeza.json` (nombre, `reina` o `rey`, `rango` `supremo` o `platonico` y el id de TMDB). Para sumar a alguien, agrega un bloque y corre:
```
python fanning.py realeza       # foto, nacimiento y en qué títulos participa (créditos de TMDB)
python fanning.py actualizar
```
Cada ficha queda con `"realeza": {"Margot Robbie": ["actua", "produce"]}`: quién participa y cómo, según todos sus créditos en TMDB (actuación, voz, apariciones como sí mismo, producción, música, guion, dirección). Ese campo se reescribe en cada corrida.

TMDB casi nunca registra las canciones que suenan en una película. Esas, y cualquier otra cosa que TMDB no sepa, van a mano en `"realeza_manual"` de la ficha, con el mismo formato:
```json
"realeza_manual": {"Eminem": ["musica"]}
```

### Citas

Cada artista puede tener una cita (una línea de diálogo de su personaje), que la página muestra en su portada y en la Reina o Rey del día. Se escribe a mano en `contenido/realeza.json`, con el título exacto de la ficha:
```json
"cita": {"texto": "You guys ever think about dying?", "titulo": "Barbie", "personaje": "Barbie"}
```
Los subtítulos no dicen quién habla, así que la frase se elige a mano. Después se corre `python fanning.py citas`, que confirma que la frase está en los subtítulos de ese título (sin importar mayúsculas ni puntuación) y anota `episodio` y `segundo`. Si no la encuentra, lo avisa y termina con error.
Los papeles posibles son `actua`, `voz`, `aparece`, `musica` (canta, compone o es coautor de una canción que suena), `produce`, `escribe`, `dirige` y `equipo`.

## Agregar una tanda

Agrega un bloque al final de `contenido/tandas.json` (igual a los anteriores) y corre `actualizar.py --escribir`.

## Si algo está mal

`actualizar.py` revisa las fichas antes de publicar. Si una tiene un error (un PDF que no existe, una clasificación o un `nivel_fijo` que no es válido, un JSON mal escrito), se detiene y explica en español qué corregir y en qué archivo. Los datos que faltan (por ejemplo, el id de TMDB) no detienen nada: aparecen al final del reporte.

Cada actualización deja `reporte_ultima_actualizacion.md` con el antes y el después.

## Formato de una ficha

```json
{
  "titulo": "Intensamente",
  "tipo": "pelicula",
  "nivel_fijo": "",
  "clasificacion": "TE",
  "tmdb": { "tipo": "movie", "id": 150540 },
  "analisis": "…",
  "sinopsis": "…",
  "poster": "https://…",
  "fondo": "https://…",
  "fotos": ["https://…"],
  "pdfs": {
    "vocabulario": ["Vocabularios/2024/Palabras desconocidas de Intensamente (lista definitiva).pdf"],
    "dialogos": ["Diálogos/Diálogos pelis 2024/Dialogues from Inside Out to improve the vocabulary in English.pdf"]
  }
}
```

Las series tienen además `"episodios"`, con un bloque por código de episodio (`S01E01`, o `SP01` para especiales):

```json
"episodios": {
  "S01E01": { "nombre": "S01E01 - Pilot", "titulo": "Pilot", "foto": "https://…", "sinopsis": "…" }
}
```

Un PDF de diálogos que es un episodio completo sin marcadores adentro se indica así: `{ "ruta": "Diálogos/…pdf", "episodio": "SP01" }`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `fichas.py` | Lee, valida y guarda las fichas. |
| `nuevos_titulos.py` | Agrega los PDFs nuevos a las fichas. |
| `actualizar.py` | Cuenta y genera todo lo que lee la página. |
| `buscar_ids_tmdb.py` | Busca el id de TMDB de las fichas que no lo tienen (`python fanning.py ids`). |
| `posters_tmdb.py` / `episodios_tmdb.py` | Traen imágenes y sinopsis de TMDB a las fichas. La clave va en `fanning-dashboard/.env.local`. |
| `conteo.py` / `ranking.py` | Reglas de conteo y de "palabras más repetidas". |
| `nivel.py` + `datos_nivel/` | Nivel de inglés (MCER) de cada título y episodio. `datos_nivel/` tiene las listas CEFR-J y Octanove (con su licencia) y `temas.json`, las áreas especializadas, que se puede editar. Criterio en `Metodología/Criterio de nivel de inglés (MCER).txt`. `nivel_fijo` en una ficha fuerza un nivel a mano. |
| `verificar_dialogos.py` / `revisar_ortografia.py` | Revisiones: diálogos página por página, ortografía de los vocabularios. Escriben en `verificaciones/` (no se guarda en Git). |
| `test_conteo.py` / `test_nivel.py` | Pruebas: `python fanning.py probar`. |

## Proyección de tandas futuras

`python scripts/metricas/proyeccion.py` lee `información para proyección 2027.txt` (la planificación de 2027 en adelante) y deja en `reporte_proyeccion.md`:
- la proyección de cada tanda: palabras, líneas, duración y reglas incumplidas;
- una propuesta de reacomodo hecha por `planificador.py`;
- la capacidad de los años siguientes.

Las correcciones al txt van en `datos_proyeccion/ajustes.json`. El plan completo está en `PLAN_PROYECCIONES_2027.md`.
