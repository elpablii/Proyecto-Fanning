"""Completa título, foto y sinopsis de cada episodio de las series desde TMDB.

La página busca esos datos en pelis/<serie>.json -> tmdb.episodes["<n>"], donde
<n> es la posición del episodio en la lista (1, 2, 3...). Este script:
  - recorre los episodios en el orden de la página;
  - pide a TMDB la temporada/episodio correspondiente (los especiales, a la
    temporada 0);
  - solo completa lo que falta, salvo con --rehacer (vuelve a escribir todo);
  - compara el título de TMDB con el del marcador del PDF de diálogos
    ("S02EP1: The Bad Fish Paradigm") y avisa si no se parecen.

Uso:  python scripts/metricas/episodios_tmdb.py [--serie "The Big Bang Theory"] [--rehacer]
"""
import argparse
import difflib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import CATALOGO, DATA, absoluta  # noqa: E402
from conteo import MARCADOR, _marcador, leer_lineas, normalizar  # noqa: E402
from actualizar import clave_de_nombre  # noqa: E402

API_KEY = os.environ.get('NEXT_PUBLIC_TMDB_API_KEY', 'd1765b8dccaf994068c4055e49e80566')
IMG = 'https://image.tmdb.org/t/p/w500'
# Nombre con el que se busca la serie en TMDB, cuando difiere del de la página.
BUSQUEDA = {'Gambito de Dama': "The Queen's Gambit"}
# Id fijo de la serie en TMDB (evita que la búsqueda elija otra serie).
TMDB_ID = {'Gambito de Dama': 87739}
# Especiales que en TMDB son una película aparte: (serie, clave) -> id de la película.
ESPECIAL_PELICULA = {('Gambito de Dama', 'SP01'): 784047}


def tmdb(ruta, **params):
    params['api_key'] = API_KEY
    url = f'https://api.themoviedb.org/3/{ruta}?{urllib.parse.urlencode(params)}'
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    except Exception:
        return None


def nombres_de_marcadores(titulo):
    """{clave: nombre del episodio} según los marcadores de los PDFs de diálogos."""
    catalogo = json.load(open(CATALOGO, encoding='utf-8'))
    t = next((x for x in catalogo if x['titulo'] == titulo), None)
    nombres = {}
    for d in (t or {}).get('dialogos', []):
        m = re.search(r'Season\s*(\d+)', d['ruta'], re.I)
        temporada = int(m.group(1)) if m else 1
        for linea in leer_lineas(absoluta(d['ruta'])):
            s = linea.strip()
            clave = _marcador(s, temporada) if any(p.match(s) for p, _ in MARCADOR) else None
            if clave and clave not in nombres:
                nombre = re.split(r'[:\-–]\s*', s, maxsplit=1)
                nombres[clave] = nombre[1].strip(' :') if len(nombre) > 1 else ''
    return nombres


def parecido(a, b):
    return difflib.SequenceMatcher(None, normalizar(a), normalizar(b)).ratio()


def procesar(titulo, rehacer):
    ruta = os.path.join(DATA, 'pelis', f'{titulo}.json')
    datos = json.load(open(ruta, encoding='utf-8'))
    if titulo in TMDB_ID:
        serie = tmdb(f'tv/{TMDB_ID[titulo]}', language='en-US')
    else:
        busq = tmdb('search/tv', query=BUSQUEDA.get(titulo, titulo)) or {}
        serie = (busq.get('results') or [None])[0]
    if not serie:
        print(f'{titulo}: no encontrada en TMDB')
        return
    print(f'{titulo}: TMDB "{serie["name"]}" ({serie.get("first_air_date", "")[:4]}), id {serie["id"]}')

    temporadas = {}

    def episodio_tmdb(temporada, numero):
        if temporada not in temporadas:
            en = tmdb(f'tv/{serie["id"]}/season/{temporada}', language='en-US') or {}
            es = tmdb(f'tv/{serie["id"]}/season/{temporada}', language='es-MX') or {}
            es_por_num = {e['episode_number']: e for e in es.get('episodes', [])}
            temporadas[temporada] = {e['episode_number']: (e, es_por_num.get(e['episode_number'], {}))
                                     for e in en.get('episodes', [])}
        return temporadas[temporada].get(numero)

    marcadores = nombres_de_marcadores(titulo)
    tm = datos.setdefault('tmdb', {}).setdefault('episodes', {})
    completados, avisos = 0, []
    for i, ep in enumerate(datos.get('episodes', []), 1):
        clave = clave_de_nombre(ep['name'])
        actual = tm.get(str(i)) or {}
        if not rehacer and actual.get('name') and actual.get('still_path') and not str(actual['name']).startswith('Episodio'):
            continue
        esperado = marcadores.get(clave)
        if (titulo, clave) in ESPECIAL_PELICULA:
            pid = ESPECIAL_PELICULA[(titulo, clave)]
            en = tmdb(f'movie/{pid}', language='en-US') or {}
            es = tmdb(f'movie/{pid}', language='es-MX') or {}
            par = ({'name': en.get('title'), 'still_path': en.get('backdrop_path') or en.get('poster_path'),
                    'overview': en.get('overview')}, {'overview': es.get('overview')}) if en else None
        elif clave.startswith('SP'):
            par = episodio_tmdb(0, int(clave[2:]))
            if esperado:
                # En la temporada 0 de TMDB hay de todo (extras, avances): se elige por título.
                episodio_tmdb(0, 1)
                mejor = max(temporadas[0].values(), key=lambda c: parecido(esperado, c[0].get('name', '')), default=None)
                if mejor and parecido(esperado, mejor[0].get('name', '')) >= 0.6:
                    par = mejor
        else:
            temporada = int(clave[1:3])
            par = episodio_tmdb(temporada, int(clave[4:]))
            if esperado and (not par or parecido(esperado, par[0].get('name', '')) < 0.95):
                # La numeración de TMDB no coincide (p. ej. episodios en dos mitades A/B):
                # se busca en la temporada el episodio con el título más parecido al del PDF.
                episodio_tmdb(temporada, 1)
                candidatos = list(temporadas[temporada].values())
                mejor = max(candidatos, key=lambda c: (parecido(esperado, c[0].get('name', '')),
                                                       c is par), default=None)
                if mejor and parecido(esperado, mejor[0].get('name', '')) >= 0.6:
                    par = mejor
                else:
                    # Un episodio en varias partes que TMDB guarda como un solo especial
                    # (temporada 0), p. ej. "A Sitch in Time (Part 1: Present)".
                    base = re.sub(r'\s*\(.*?\)\s*$', '', esperado)
                    episodio_tmdb(0, 1)
                    especial = max(temporadas[0].values(), key=lambda c: parecido(base, c[0].get('name', '')), default=None)
                    if especial and parecido(base, especial[0].get('name', '')) >= 0.8:
                        en, es = especial
                        par = (dict(en, name=esperado), es)
        if not par:
            avisos.append(f'  {clave} ({ep["name"]}): no está en TMDB')
            continue
        en, es = par
        nuevo = dict(actual)
        nuevo['name'] = en.get('name') or es.get('name') or actual.get('name')
        if en.get('still_path'):
            nuevo['still_path'] = IMG + en['still_path']
        nuevo['overview'] = es.get('overview') or en.get('overview') or actual.get('overview', '')
        if esperado and parecido(esperado, nuevo['name']) < 0.6:
            avisos.append(f'  {clave}: TMDB dice "{nuevo["name"]}" pero el PDF dice "{esperado}"')
        tm[str(i)] = nuevo
        completados += 1
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    print(f'  completados: {completados}')
    for a in avisos:
        print(a)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--serie')
    ap.add_argument('--rehacer', action='store_true')
    args = ap.parse_args()
    catalogo = json.load(open(CATALOGO, encoding='utf-8'))
    series = [t['titulo'] for t in catalogo if t['tipo'] == 'serie']
    for titulo in ([args.serie] if args.serie else series):
        procesar(titulo, args.rehacer)


if __name__ == '__main__':
    main()
