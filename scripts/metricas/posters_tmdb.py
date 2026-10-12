"""Pone póster y fondo (y, si faltan, sinopsis y fotos) de películas o series desde TMDB.

Escribe en pelis/<título>.json los campos posterUrl y backdropUrl (los usa la
página) y, si faltan, tmdb.overview y tmdb.photos. Con un id dado, el póster y el
fondo se reemplazan; la sinopsis y las fotos solo se completan si faltan (o con
--rehacer). Después hay que correr actualizar.py --escribir para que el manifest
tome el póster.

Uso:
  python scripts/metricas/posters_tmdb.py "Kim Possible Todo un Drama" --id 20771
  python scripts/metricas/posters_tmdb.py "Gambito de Dama" --id 87739 --serie
  python scripts/metricas/posters_tmdb.py --lista ids.json   # {"Título": id} o {"Título": [id, "tv"]}
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import DATA  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402


def aplicar(titulo, tmdb_id, tipo='movie', rehacer=False):
    ruta = os.path.join(DATA, 'pelis', f'{titulo}.json')
    if not os.path.exists(ruta):
        print(f'!! {titulo}: no existe {os.path.relpath(ruta)}')
        return False
    datos = json.load(open(ruta, encoding='utf-8'))
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
        datos['posterUrl'] = 'https://image.tmdb.org/t/p/w500' + en['poster_path']
    if en.get('backdrop_path'):
        datos['backdropUrl'] = 'https://image.tmdb.org/t/p/original' + en['backdrop_path']
    if not en.get('poster_path') or not en.get('backdrop_path'):
        print('   aviso: TMDB no tiene póster o fondo para este id')
    tm = datos.setdefault('tmdb', {})
    sinopsis = es.get('overview') or en.get('overview')
    if sinopsis and (rehacer or not tm.get('overview')):
        tm['overview'] = sinopsis
    fotos = ['https://image.tmdb.org/t/p/w780' + b['file_path'] for b in imagenes.get('backdrops', [])[:6]]
    if fotos and (rehacer or not tm.get('photos')):
        tm['photos'] = fotos
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('titulo', nargs='?', help='título tal como está en la página')
    ap.add_argument('--id', type=int, help='id en TMDB')
    ap.add_argument('--serie', action='store_true', help='el id es de una serie (tv)')
    ap.add_argument('--lista', help='JSON {"Título": id} o {"Título": [id, "tv"]}')
    ap.add_argument('--rehacer', action='store_true')
    args = ap.parse_args()

    if args.lista:
        pedidos = json.load(open(args.lista, encoding='utf-8'))
        for titulo, v in pedidos.items():
            tmdb_id, tipo = (v, 'movie') if isinstance(v, int) else (v[0], v[1])
            aplicar(titulo, tmdb_id, tipo, args.rehacer)
        return
    if not (args.titulo and args.id):
        sys.exit('Indica el título y --id, o --lista')
    aplicar(args.titulo, args.id, 'tv' if args.serie else 'movie', args.rehacer)


if __name__ == '__main__':
    main()
