"""Migración única (2026-10-13): crea contenido/titulos/*.json y contenido/tandas.json
a partir de los datos que existían antes de las fichas:
  - scripts/metricas/catalogo.json      -> tipo y PDFs
  - public/data/manifest.json           -> nivel, clasificación, póster, fondo
  - public/data/pelis/<título>.json     -> análisis, sinopsis, fotos y datos de episodios
  - ids de TMDB que había en el código  -> "tmdb"
  - public/data/timeline.json           -> contenido/tandas.json

Uso:  python scripts/metricas/migrar_a_fichas.py
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import RAIZ, DATA  # noqa: E402
from conteo import normalizar  # noqa: E402
from actualizar import clave_de_nombre  # noqa: E402
import fichas  # noqa: E402

# Ids de TMDB confirmados durante octubre de 2026 (pósters, fondos y series).
IDS_CONFIRMADOS = {
    'Taylor Swift The Eras Tour Film': ('movie', 1160164), 'Aves de Presa': ('movie', 495764),
    'Gambito de Dama': ('tv', 87739), 'Escuadrón Suicida': ('movie', 297761),
    'El Escuadrón Suicida': ('movie', 436969), 'Ámsterdam': ('movie', 664469), 'Los Increibles': ('movie', 9806),
    'Goodbye Christopher Robin': ('movie', 418680),
    'Taylor Swift - The Eras Tour Film The Final Show': ('movie', 1562010), 'Riesgo Bajo Cero': ('movie', 646207),
    'El Expreso Polar': ('movie', 5255), 'Taylor Swift The 1989 World Tour': ('movie', 373558),
    'Cars III': ('movie', 260514), 'Los Fantasmas de Scrooge': ('movie', 17979), 'Buscando a Nemo': ('movie', 12),
    'Venganza Implacable': ('movie', 553604), 'Bichos Una Aventura en Miniatura': ('movie', 9487),
    'Intensamente 2': ('movie', 1022789), 'Intensamente': ('movie', 150540), 'La Sustancia': ('movie', 933260),
    'Alvin y las Ardillas': ('movie', 6477), 'An American Girl - Grace Stirs Up Success': ('movie', 338100),
    'La Bella Durmiente': ('movie', 10882), 'Escape de Sobibor': ('movie', 25318), 'El Padrino I': ('movie', 238),
    'Taylor Swift City of Lover Concert': ('movie', 701684), 'Cenicienta': ('movie', 11224),
    'Contrarreloj': ('movie', 762430), 'Dreamland': ('movie', 480434), 'The Muppet Show': ('movie', 1548113),
    'Kim Possible Todo un Drama': ('movie', 20771), 'Kim Possible (2019)': ('movie', 520720),
    'The Big Bang Theory': ('tv', 1418), 'Kim Possible': ('tv', 2345), 'Euphoria': ('tv', 85552),
}
ESPECIALES_PELICULA = {('Gambito de Dama', 'SP01'): ('movie', 784047)}


def ids_del_codigo():
    """Ids que estaban escritos en tmdbOverrides (fetch_tmdb.ts y el lib/tmdb.ts borrado)."""
    textos = []
    ts = os.path.join(RAIZ, 'fanning-dashboard', 'scripts', 'fetch_tmdb.ts')
    if os.path.exists(ts):
        textos.append(open(ts, encoding='utf-8').read())
    try:
        textos.append(subprocess.run(['git', 'show', 'HEAD:fanning-dashboard/src/lib/tmdb.ts'], cwd=RAIZ,
                                     capture_output=True, text=True, encoding='utf-8').stdout)
    except OSError:
        pass
    ids = {}
    for texto in textos:
        for m in re.finditer(r'"([^"]+)"\s*:\s*\{([^}]*)\}', texto):
            cuerpo = m.group(2)
            i = re.search(r'id:\s*"?(\d+)', cuerpo)
            if i:
                ids[normalizar(m.group(1))] = ('tv' if re.search(r'tv:\s*true', cuerpo) else 'movie', int(i.group(1)))
    return ids


def main():
    catalogo = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'catalogo.json'),
                             encoding='utf-8'))
    manifest = json.load(open(os.path.join(DATA, 'manifest.json'), encoding='utf-8'))
    en_manifest = {m['title']: m for m in manifest['all']['movieList']}
    del_codigo = ids_del_codigo()

    sin_tmdb = []
    for t in catalogo:
        titulo = t['titulo']
        pelis = json.load(open(os.path.join(DATA, 'pelis', f'{titulo}.json'), encoding='utf-8'))
        m = en_manifest.get(titulo, {})
        tm = pelis.get('tmdb') or {}
        tmdb = IDS_CONFIRMADOS.get(titulo)
        if not tmdb:
            for nombre in [titulo] + m.get('aliases', []):
                tmdb = del_codigo.get(normalizar(nombre))
                if tmdb:
                    break
        if not tmdb:
            sin_tmdb.append(titulo)

        ficha = {
            'titulo': titulo,
            'tipo': t['tipo'],
            'nivel': pelis.get('level') or m.get('level') or '',
            'clasificacion': tm.get('rating') or pelis.get('rating') or m.get('rating') or '',
            'tmdb': {'tipo': tmdb[0], 'id': tmdb[1]} if tmdb else None,
            'analisis': pelis.get('englishAnalysis', ''),
            'sinopsis': tm.get('overview') or pelis.get('overview') or '',
            'poster': pelis.get('posterUrl') or m.get('posterUrl') or '',
            'fondo': pelis.get('backdropUrl') or m.get('backdropUrl') or '',
            'fotos': tm.get('photos') or [],
            'pdfs': {
                'vocabulario': t['vocabulario'],
                'dialogos': [d['ruta'] if 'episodio' not in d else d for d in t['dialogos']],
            },
        }
        if t['tipo'] == 'serie':
            niveles_manifest = {e['name']: e.get('level') for e in m.get('episodes', [])}
            datos_tmdb = tm.get('episodes') or {}
            episodios = {}
            for i, ep in enumerate(pelis.get('episodes') or [], 1):
                clave = clave_de_nombre(ep['name'])
                d = datos_tmdb.get(str(i)) or {}
                e = {'nombre': ep['name'], 'nivel': ep.get('level') or niveles_manifest.get(ep['name']) or ''}
                if ep.get('englishAnalysis'):
                    e['analisis'] = ep['englishAnalysis']
                if d.get('name'):
                    e['titulo'] = d['name']
                if d.get('still_path'):
                    e['foto'] = d['still_path']
                if d.get('overview'):
                    e['sinopsis'] = d['overview']
                if (titulo, clave) in ESPECIALES_PELICULA:
                    tipo, pid = ESPECIALES_PELICULA[(titulo, clave)]
                    e['tmdb'] = {'tipo': tipo, 'id': pid}
                episodios[clave] = e
            ficha['episodios'] = episodios
        fichas.guardar(ficha)

    tandas = json.load(open(os.path.join(DATA, 'timeline.json'), encoding='utf-8'))
    with open(fichas.TANDAS, 'w', encoding='utf-8') as f:
        json.dump(tandas, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f'{len(catalogo)} fichas en {os.path.relpath(fichas.CARPETA, RAIZ)}')
    print(f'{len(tandas)} tandas en {os.path.relpath(fichas.TANDAS, RAIZ)}')
    print(f'{len(sin_tmdb)} títulos sin id de TMDB todavía')


if __name__ == '__main__':
    main()
