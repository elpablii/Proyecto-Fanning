"""Detecta PDFs nuevos y los agrega a las fichas (contenido/titulos/).

- Un PDF de vocabulario nuevo de un título que ya tiene ficha (otra parte, o
  episodios nuevos de una serie) se agrega a esa ficha.
- Si no hay ficha, se crea una con lo que se puede deducir (título, tipo, PDFs).
  Lo que no se puede deducir (clasificación, id de TMDB, análisis) queda
  vacío para completarlo a mano.
- Un PDF de diálogos se asigna a la ficha cuyo título coincide con su nombre. Si
  el nombre no coincide (por ejemplo, está en inglés y la ficha en español), se
  avisa para agregarlo a mano en "pdfs.dialogos" de la ficha que corresponda.

No borra nada. Para quitar un título, se borra su ficha.

Uso:  python scripts/metricas/nuevos_titulos.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import RAIZ, rel  # noqa: E402
from conteo import normalizar  # noqa: E402
from actualizar import base_dialogo  # noqa: E402
import fichas as F  # noqa: E402


def base_vocab(ruta):
    """Título según el nombre del PDF de vocabulario, sin partes ni episodios."""
    b = os.path.splitext(os.path.basename(ruta))[0]
    b = re.sub(r'^Palabras desconocidas de\s*', '', b)
    b = re.sub(r'\s*\((Parte \d+ - )?lista def\w*\)', '', b)
    b = re.sub(r'\s*&?\s*\((S\d+)?\s*EP[^)]*\)|\s*\(vocabulario[^)]*\)', '', b)
    return b.strip()


def es_serie(ruta):
    return bool(re.search(r'\((S\d+)?\s*EP', os.path.basename(ruta))) or 'Series' in ruta


def pdfs(carpeta):
    return sorted(rel(os.path.join(r, f)) for r, _, fs in os.walk(os.path.join(RAIZ, carpeta))
                  for f in fs if f.lower().endswith('.pdf'))


def main():
    lista, _, _ = F.cargar()
    usados = set()
    por_nombre = {}
    for f in lista:
        usados |= set(f['pdfs']['vocabulario']) | {F.ruta_dialogo(d) for d in f['pdfs'].get('dialogos', [])}
        nombres = {f['titulo'], re.sub(r'\s*\([^)]*\)', '', f['titulo'])}
        nombres |= {base_vocab(r) for r in f['pdfs']['vocabulario']}
        nombres |= {base_dialogo(F.ruta_dialogo(d)) for d in f['pdfs'].get('dialogos', [])}
        for n in nombres:
            por_nombre[normalizar(n)] = f

    cambiadas, creadas = {}, []
    for ruta in pdfs('Vocabularios'):
        if ruta in usados:
            continue
        base = base_vocab(ruta)
        ficha = por_nombre.get(normalizar(base)) or por_nombre.get(normalizar(re.sub(r'\s*\([^)]*\)', '', base)))
        if ficha is None:
            ficha = {'titulo': re.sub(r'\s*\((de|con) [^)]*\)', '', base).strip(),
                     'tipo': 'serie' if es_serie(ruta) else 'pelicula',
                     'clasificacion': '', 'tmdb': None, 'analisis': '',
                     'sinopsis': '', 'poster': '', 'fondo': '', 'fotos': [],
                     'pdfs': {'vocabulario': [], 'dialogos': []}}
            if ficha['tipo'] == 'serie':
                ficha['episodios'] = {}
            creadas.append(ficha['titulo'])
            por_nombre[normalizar(ficha['titulo'])] = ficha
            por_nombre[normalizar(base)] = ficha
        ficha['pdfs']['vocabulario'] = sorted(ficha['pdfs']['vocabulario'] + [ruta])
        if es_serie(ruta) and ficha['tipo'] != 'serie':
            ficha['tipo'] = 'serie'
            ficha.setdefault('episodios', {})
        cambiadas[ficha['titulo']] = ficha
        usados.add(ruta)

    sin_ficha = []
    for ruta in pdfs('Diálogos'):
        if ruta in usados:
            continue
        ficha = por_nombre.get(normalizar(base_dialogo(ruta)))
        if ficha is None:
            sin_ficha.append(ruta)
            continue
        ficha['pdfs']['dialogos'] = sorted(ficha['pdfs'].get('dialogos', []) + [ruta], key=F.ruta_dialogo)
        cambiadas[ficha['titulo']] = ficha

    for ficha in cambiadas.values():
        F.guardar(ficha)

    if not cambiadas and not sin_ficha:
        print('No hay PDFs nuevos.')
        return
    for t in creadas:
        print(f'Ficha nueva: contenido/titulos/{F.slug(t)}.json  (completa clasificación, tmdb y análisis; el nivel se calcula solo)')
    for t in sorted(set(cambiadas) - set(creadas)):
        print(f'Ficha actualizada con PDFs nuevos: {t}')
    if sin_ficha:
        print('\nPDFs de diálogos que no coinciden con ninguna ficha. Agrégalos a mano en "pdfs.dialogos"'
              ' de la ficha que corresponda (por ejemplo, si el PDF tiene el nombre en inglés):')
        for r in sin_ficha:
            print('   ', r)
    print('\nDespués corre: python fanning.py actualizar')


if __name__ == '__main__':
    main()
