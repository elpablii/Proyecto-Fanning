# Métricas de la página

Los PDFs de `Vocabularios/` y `Diálogos/` son la fuente de verdad. Todas las cifras de la página salen de ellos con los criterios de `Metodología/`:

- `Criterio de conteo de líneas de diálogo.txt`
- `Criterio de conteo de palabras y frases.txt`

## Cada vez que agregues o corrijas un PDF

```
python scripts/metricas/construir_catalogo.py
python scripts/metricas/actualizar.py              # muestra qué cambiaría, no escribe
python scripts/metricas/actualizar.py --escribir   # actualiza la página
```

Eso actualiza **todas** las métricas de la página:

- totales de palabras, de diálogos y de títulos;
- cifras por año y el gráfico anual;
- cifras por título;
- cifras por episodio y por temporada;
- % de comprensión;
- palabras más repetidas.

Al final queda `reporte_ultima_actualizacion.md`, con el antes y el después y los avisos para revisar.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `conteo.py` | Las reglas de conteo. Si cambia un criterio, se cambia aquí y en el txt. |
| `catalogo.json` | Qué PDFs corresponden a cada título. Se puede editar a mano. |
| `construir_catalogo.py` | Agrega los PDFs nuevos al catálogo. Si un PDF de diálogos no tiene nombre parecido a su vocabulario (por ejemplo, un título en inglés y el otro en español), agrégalo a `TRADUCCIONES` en este archivo. |
| `actualizar.py` | Cuenta y reescribe `pelis/*.json`, `<año>/vocabulario_*.json` y `manifest.json`. Conserva el nivel, el análisis, TMDB, los pósters y la clasificación. |
| `test_conteo.py` | Pruebas con los ejemplos de los txt: `python scripts/metricas/test_conteo.py`. |

No edites a mano el vocabulario ni las cifras de los JSON de la página: la próxima actualización los vuelve a calcular desde los PDFs. Los errores de tipeo se corrigen en el PDF.
