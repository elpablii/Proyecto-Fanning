"""Pone póster, fondo, sinopsis y fotos de una película o serie desde TMDB, en su ficha.

Escribe en contenido/titulos/<título>.json: "tmdb" (el id), "poster", "fondo" y,
si faltan (o con --rehacer), "sinopsis" y "fotos". Después hay que correr
actualizar.py --escribir para que la página tome los cambios.

Uso:
  python scripts/metricas/posters_tmdb.py "Intensamente"               # usa el id que ya está en la ficha
  python scripts/metricas/posters_tmdb.py "Intensamente" --id 150540   # guarda ese id y lo usa
  python scripts/metricas/posters_tmdb.py "Gambito de Dama" --id 87739 --serie
  python scripts/metricas/posters_tmdb.py --todos                      # todas las fichas que tienen id
  python scripts/metricas/posters_tmdb.py --lista ids.json             # {"Título": id} o {"Título": [id, "tv"]}
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402


def aplicar(ficha, tmdb_id=None, tipo=None, rehacer=False):
    titulo = ficha['titulo']
    if tmdb_id:
        ficha['tmdb'] = {'tipo': tipo or ('tv' if ficha['tipo'] == 'serie' else 'movie'), 'id': int(tmdb_id)}
    if not ficha.get('tmdb'):
        print(f'!! {titulo}: la ficha no tiene id de TMDB. Pásalo con --id.')
        return False
    tipo, tmdb_id = ficha['tmdb']['tipo'], ficha['tmdb']['id']
    en = tmdb(f'{tipo}/{tmdb_id}', language='en-US') or {}
    if not en:
        print(f'!! {titulo}: TMDB no tiene {tipo}/{tmdb_id}')
        return False
    es = tmdb(f'{tipo}/{tmdb_id}', language='es-MX') or {}
    imagenes = tmdb(f'{tipo}/{tmdb_id}/images', include_image_language='en,null') or {}
    nombre = en.get('title') or en.get('name')
    fecha = en.get('release_date') or en.get('first_air_date') or ''
    print(f'{titulo}  <-  TMDB {tipo} {tmdb_id}: "{nombre}" ({fecha[:4]})')

    if en.get('poster_path'):
        ficha['poster'] = 'https://image.tmdb.org/t/p/w500' + en['poster_path']
    if en.get('backdrop_path'):
        ficha['fondo'] = 'https://image.tmdb.org/t/p/original' + en['backdrop_path']
    if not en.get('poster_path') or not en.get('backdrop_path'):
        print('   aviso: TMDB no tiene póster o fondo para este id')
    sinopsis = es.get('overview') or en.get('overview')
    if sinopsis and (rehacer or not ficha.get('sinopsis')):
        ficha['sinopsis'] = sinopsis
    fotos = ['https://image.tmdb.org/t/p/w780' + b['file_path'] for b in imagenes.get('backdrops', [])[:6]]
    if fotos and (rehacer or not ficha.get('fotos')):
        ficha['fotos'] = fotos
    F.guardar(ficha)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('titulo', nargs='?', help='título tal como está en su ficha')
    ap.add_argument('--id', type=int, help='id en TMDB')
    ap.add_argument('--serie', action='store_true', help='el id es de una serie (tv)')
    ap.add_argument('--lista', help='JSON {"Título": id} o {"Título": [id, "tv"]}')
    ap.add_argument('--todos', action='store_true', help='todas las fichas que tienen id de TMDB')
    ap.add_argument('--rehacer', action='store_true', help='reemplaza también la sinopsis y las fotos')
    args = ap.parse_args()

    lista, _, _ = F.cargar()
    por_titulo = {f['titulo']: f for f in lista}

    def ficha_de(titulo):
        if titulo not in por_titulo:
            sys.exit(f'No hay una ficha con el título "{titulo}" en contenido/titulos/.')
        return por_titulo[titulo]

    if args.lista:
        for titulo, v in json.load(open(args.lista, encoding='utf-8')).items():
            tmdb_id, tipo = (v, None) if isinstance(v, int) else (v[0], v[1])
            aplicar(ficha_de(titulo), tmdb_id, tipo, args.rehacer)
    elif args.todos:
        for f in lista:
            if f.get('tmdb'):
                aplicar(f, rehacer=args.rehacer)
    elif args.titulo:
        aplicar(ficha_de(args.titulo), args.id, 'tv' if args.serie else None, args.rehacer)
    else:
        sys.exit('Indica un título, --lista o --todos.')
    print('\nAhora corre: python fanning.py actualizar')


if __name__ == '__main__':
    main()
