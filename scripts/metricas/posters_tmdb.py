"""Completa póster, fondo, sinopsis y fotos de una película desde TMDB.

Escribe en pelis/<título>.json los campos posterUrl y backdropUrl (los usa la
página) y, si faltan, tmdb.overview y tmdb.photos. No toca lo que ya existe,
salvo con --rehacer. Después hay que correr actualizar.py --escribir para que
el manifest tome el póster.

Uso:
  python scripts/metricas/posters_tmdb.py "Kim Possible Todo un Drama" --id 20771
  python scripts/metricas/posters_tmdb.py "Buscando a Nemo" --buscar "Finding Nemo"
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import DATA  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('titulo', help='título tal como está en la página')
    ap.add_argument('--id', type=int, help='id de la película en TMDB')
    ap.add_argument('--buscar', help='texto para buscar en TMDB (si no se da --id)')
    ap.add_argument('--rehacer', action='store_true')
    args = ap.parse_args()

    ruta = os.path.join(DATA, 'pelis', f'{args.titulo}.json')
    datos = json.load(open(ruta, encoding='utf-8'))
    peli_id = args.id
    if not peli_id:
        r = tmdb('search/movie', query=args.buscar or args.titulo) or {}
        if not r.get('results'):
            sys.exit('No se encontró en TMDB')
        peli_id = r['results'][0]['id']
    en = tmdb(f'movie/{peli_id}', language='en-US') or {}
    es = tmdb(f'movie/{peli_id}', language='es-MX') or {}
    imagenes = tmdb(f'movie/{peli_id}/images', include_image_language='en,null') or {}
    print(f'TMDB: "{en.get("title")}" ({str(en.get("release_date", ""))[:4]}), id {peli_id}')

    def poner(clave, valor, destino=datos):
        if valor and (args.rehacer or not destino.get(clave)):
            destino[clave] = valor
            print(f'  {clave}: listo')

    if en.get('poster_path'):
        poner('posterUrl', 'https://image.tmdb.org/t/p/w500' + en['poster_path'])
    if en.get('backdrop_path'):
        poner('backdropUrl', 'https://image.tmdb.org/t/p/original' + en['backdrop_path'])
    tm = datos.setdefault('tmdb', {})
    poner('overview', es.get('overview') or en.get('overview'), tm)
    fotos = ['https://image.tmdb.org/t/p/w780' + b['file_path'] for b in imagenes.get('backdrops', [])[:6]]
    poner('photos', fotos, tm)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
