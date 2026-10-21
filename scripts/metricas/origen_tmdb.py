"""Completa en cada ficha sus géneros y su fecha de estreno, desde TMDB.

Con el id de TMDB de la ficha pide movie/<id> o tv/<id> (en español latino) y guarda:
  "generos": ["Drama", "Música"]      los de TMDB; los dobles de las series ("Action & Adventure")
                                      se separan en los de las películas ("Acción", "Aventura")
  "estreno": "2018-09-07"             películas: fecha de estreno; series: la del primer episodio

Solo completa lo que falta, salvo con --rehacer. Se pueden corregir a mano en la ficha: el script
no pisa lo que ya está. Después hay que correr `python fanning.py actualizar`.

  python fanning.py origen [--rehacer]
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402

# Géneros de las series que TMDB junta en uno: se separan en los de las películas.
GENEROS_SERIES = {
    10759: ['Acción', 'Aventura'],
    10765: ['Ciencia ficción', 'Fantasía'],
    10768: ['Bélica'],
    10762: ['Infantil'],
    10763: ['Noticias'],
    10764: ['Reality'],
    10766: ['Telenovela'],
    10767: ['Entrevistas'],
}
# Como se dice en Chile.
RENOMBRAR = {'Suspense': 'Suspenso'}


def origen(ref):
    """(géneros, estreno) de un título de TMDB, o None si no responde."""
    datos = tmdb(f'{ref["tipo"]}/{ref["id"]}', language='es-MX')
    if not datos:
        return None
    generos = []
    for g in datos.get('genres', []):
        for nombre in GENEROS_SERIES.get(g['id'], [RENOMBRAR.get(g['name'], g['name'])]):
            if nombre not in generos:
                generos.append(nombre)
    estreno = datos.get('release_date' if ref['tipo'] == 'movie' else 'first_air_date') or None
    return generos, estreno


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--rehacer', action='store_true', help='vuelve a pedir todo, aunque ya esté en la ficha')
    args = ap.parse_args()

    fichas = F.cargar()[0]
    cambiadas, sin_datos = 0, []
    for i, ficha in enumerate(fichas, 1):
        t = ficha['titulo']
        faltan = args.rehacer or not all(ficha.get(c) for c in ('generos', 'estreno'))
        if not faltan:
            continue
        if not ficha.get('tmdb'):
            sin_datos.append(f'{t} (sin id de TMDB)')
            continue
        print(f'[{i}/{len(fichas)}] {t}', flush=True)
        res = origen(ficha['tmdb'])
        if not res:
            sin_datos.append(f'{t} (TMDB no respondió)')
            continue
        antes = {c: ficha.get(c) for c in ('generos', 'estreno')}
        for campo, valor in zip(('generos', 'estreno'), res):
            if valor and (args.rehacer or not ficha.get(campo)):
                ficha[campo] = valor
        if any(ficha.get(c) != antes[c] for c in antes):
            F.guardar(ficha)
            cambiadas += 1
        faltantes = [c for c in ('generos', 'estreno') if not ficha.get(c)]
        if faltantes:
            sin_datos.append(f'{t} (TMDB no tiene: {", ".join(faltantes)})')

    print(f'\nFichas actualizadas: {cambiadas}.')
    if sin_datos:
        print('Para completar a mano:')
        for s in sin_datos:
            print('  -', s)
    print('Para verlo en la página: python fanning.py actualizar')


if __name__ == '__main__':
    main()
