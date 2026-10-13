"""Completa título, foto y sinopsis de cada episodio de las series desde TMDB.

Lee y escribe las fichas (contenido/titulos/<serie>.json), en "episodios" -> "<código>":
  - el id de la serie sale de "tmdb" en la ficha; si falta, se busca por nombre y se
    guarda en la ficha;
  - cada episodio se pide a TMDB por su temporada y número (los especiales, a la
    temporada 0). Si el título no coincide con el del PDF de diálogos (p. ej. por
    episodios en dos mitades A/B), se busca en la temporada el de título más parecido;
  - un especial que TMDB tiene como película aparte se indica en la ficha del episodio:
    "tmdb": {"tipo": "movie", "id": 784047};
  - solo completa lo que falta, salvo con --rehacer;
  - avisa si el título de TMDB no se parece al del marcador del PDF de diálogos.

Después hay que correr actualizar.py --escribir para que la página tome los datos.

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
from rutas import RAIZ, absoluta  # noqa: E402
from conteo import MARCADOR, _marcador, leer_lineas, normalizar  # noqa: E402
import fichas as F  # noqa: E402

IMG = 'https://image.tmdb.org/t/p/w500'
API_KEY = None


def _clave_tmdb():
    """La clave de TMDB sale del entorno o de fanning-dashboard/.env.local, nunca del código."""
    for nombre in ('TMDB_API_KEY', 'NEXT_PUBLIC_TMDB_API_KEY'):
        if os.environ.get(nombre):
            return os.environ[nombre]
    env = os.path.join(RAIZ, 'fanning-dashboard', '.env.local')
    if os.path.exists(env):
        for linea in open(env, encoding='utf-8'):
            nombre, _, valor = linea.strip().partition('=')
            if nombre in ('TMDB_API_KEY', 'NEXT_PUBLIC_TMDB_API_KEY') and valor:
                return valor.strip().strip('"')
    sys.exit('Falta la clave de TMDB: defínela en TMDB_API_KEY o en fanning-dashboard/.env.local')


def tmdb(ruta, **params):
    global API_KEY
    API_KEY = API_KEY or _clave_tmdb()
    params['api_key'] = API_KEY
    url = f'https://api.themoviedb.org/3/{ruta}?{urllib.parse.urlencode(params)}'
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    except Exception:
        return None


def nombres_de_marcadores(ficha):
    """{código: nombre del episodio} según los marcadores de los PDFs de diálogos."""
    nombres = {}
    for d in ficha['pdfs'].get('dialogos', []):
        ruta = F.ruta_dialogo(d)
        m = re.search(r'Season\s*(\d+)', ruta, re.I)
        temporada = int(m.group(1)) if m else 1
        for linea in leer_lineas(absoluta(ruta)):
            s = linea.strip()
            clave = _marcador(s, temporada) if any(p.match(s) for p, _ in MARCADOR) else None
            if clave and clave not in nombres:
                nombre = re.split(r'[:\-–]\s*', s, maxsplit=1)
                nombres[clave] = nombre[1].strip(' :') if len(nombre) > 1 else ''
    return nombres


def parecido(a, b):
    return difflib.SequenceMatcher(None, normalizar(a), normalizar(b)).ratio()


def buscar_serie(ficha):
    """Id de la serie en TMDB: el de la ficha o, si falta, el primero que aparece al buscarla."""
    if ficha.get('tmdb'):
        return tmdb(f'tv/{ficha["tmdb"]["id"]}', language='en-US')
    for d in [ficha['titulo']] + [F.ruta_dialogo(x) for x in ficha['pdfs'].get('dialogos', [])]:
        nombre = ficha['titulo'] if d == ficha['titulo'] else re.sub(
            r'^(Dialogues? (from|of) )|(\s*(to improve.*|in English.*))$', '', os.path.splitext(os.path.basename(d))[0])
        r = tmdb('search/tv', query=nombre) or {}
        if r.get('results'):
            ficha['tmdb'] = {'tipo': 'tv', 'id': r['results'][0]['id']}
            return r['results'][0]
    return None


def procesar(ficha, rehacer):
    titulo = ficha['titulo']
    serie = buscar_serie(ficha)
    if not serie:
        print(f'{titulo}: no encontrada en TMDB. Pon su id en la ficha: "tmdb": {{"tipo": "tv", "id": …}}')
        return
    print(f'{titulo}: TMDB "{serie["name"]}" ({serie.get("first_air_date", "")[:4]}), id {serie["id"]}')

    temporadas = {}

    def temporada(n):
        if n not in temporadas:
            en = tmdb(f'tv/{serie["id"]}/season/{n}', language='en-US') or {}
            es = tmdb(f'tv/{serie["id"]}/season/{n}', language='es-MX') or {}
            es_por_num = {e['episode_number']: e for e in es.get('episodes', [])}
            temporadas[n] = {e['episode_number']: (e, es_por_num.get(e['episode_number'], {}))
                             for e in en.get('episodes', [])}
        return temporadas[n]

    def mas_parecido(candidatos, nombre, minimo):
        mejor = max(candidatos, key=lambda c: parecido(nombre, c[0].get('name', '')), default=None)
        return mejor if mejor and parecido(nombre, mejor[0].get('name', '')) >= minimo else None

    marcadores = nombres_de_marcadores(ficha)
    completados, avisos = 0, []
    for clave, ep in ficha.get('episodios', {}).items():
        if not rehacer and ep.get('titulo') and ep.get('foto'):
            continue
        esperado = marcadores.get(clave)
        if ep.get('tmdb', {}).get('tipo') == 'movie':
            pid = ep['tmdb']['id']
            en = tmdb(f'movie/{pid}', language='en-US') or {}
            es = tmdb(f'movie/{pid}', language='es-MX') or {}
            par = ({'name': en.get('title'), 'still_path': en.get('backdrop_path') or en.get('poster_path'),
                    'overview': en.get('overview')}, {'overview': es.get('overview')}) if en else None
        elif clave.startswith('SP'):
            par = temporada(0).get(int(clave[2:]))
            if esperado:
                # En la temporada 0 de TMDB hay de todo (extras, avances): se elige por título.
                par = mas_parecido(temporada(0).values(), esperado, 0.6) or par
        else:
            t = int(clave[1:3])
            par = temporada(t).get(int(clave[4:]))
            if esperado and (not par or parecido(esperado, par[0].get('name', '')) < 0.95):
                par = mas_parecido(temporada(t).values(), esperado, 0.6) or par
                if not par or parecido(esperado, par[0].get('name', '')) < 0.6:
                    # Un episodio en varias partes que TMDB guarda como un solo especial,
                    # p. ej. "A Sitch in Time (Part 1: Present)".
                    base = re.sub(r'\s*\(.*?\)\s*$', '', esperado)
                    especial = mas_parecido(temporada(0).values(), base, 0.8)
                    if especial:
                        par = (dict(especial[0], name=esperado), especial[1])
        if not par:
            avisos.append(f'  {clave} ({ep.get("nombre")}): no está en TMDB')
            continue
        en, es = par
        ep['titulo'] = en.get('name') or es.get('name') or ep.get('titulo', '')
        if en.get('still_path'):
            ep['foto'] = en['still_path'] if en['still_path'].startswith('http') else IMG + en['still_path']
        ep['sinopsis'] = es.get('overview') or en.get('overview') or ep.get('sinopsis', '')
        if esperado and parecido(esperado, ep['titulo']) < 0.6:
            avisos.append(f'  {clave}: TMDB dice "{ep["titulo"]}" pero el PDF dice "{esperado}"')
        completados += 1
    F.guardar(ficha)
    print(f'  completados: {completados}')
    for a in avisos:
        print(a)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--serie', help='título de la serie (si no se indica, todas)')
    ap.add_argument('--rehacer', action='store_true', help='vuelve a pedir los datos aunque ya estén')
    args = ap.parse_args()
    lista, _, _ = F.cargar()
    series = [f for f in lista if f['tipo'] == 'serie' and (not args.serie or f['titulo'] == args.serie)]
    if args.serie and not series:
        sys.exit(f'No hay una serie llamada "{args.serie}" en contenido/titulos/.')
    for ficha in series:
        procesar(ficha, args.rehacer)
    print('\nAhora corre: python fanning.py actualizar')


if __name__ == '__main__':
    main()
