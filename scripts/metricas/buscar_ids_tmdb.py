"""Busca el id de TMDB de las fichas que no lo tienen.

Para cada ficha sin "tmdb" busca en TMDB por su nombre en inglés (el de sus PDFs de
diálogos) y por su título. Un id se da por seguro solo si el resultado tiene
exactamente el mismo póster que ya está en la ficha (los pósters vienen de TMDB).

- Con --guardar escribe en las fichas los ids seguros. Nunca cambia el póster.
- Los que no se pueden confirmar se listan con el mejor candidato, para revisarlos
  y, si es correcto, guardarlo con:  python fanning.py imagenes "Título" --id N

Uso:  python scripts/metricas/buscar_ids_tmdb.py [--guardar]
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from actualizar import base_dialogo  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402


def archivo_poster(url):
    return (url or '').rsplit('/', 1)[-1]


def consultas(ficha):
    nombres = [base_dialogo(F.ruta_dialogo(d)) for d in ficha['pdfs'].get('dialogos', [])] + [ficha['titulo']]
    romanos = {'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6'}
    salida = []
    for n in nombres:
        n = re.sub(r'\s*\((with|con|de) [^)]*\)|\s+movie$', '', n, flags=re.I)
        variantes = [n, re.sub(r'\s+(I|1)$', '', n)]
        # "Taken II" -> "Taken 2"; "Maleficent II Mistress of Evil" -> "Maleficent Mistress of Evil"
        variantes.append(re.sub(r'\b(II|III|IV|V|VI)\b', lambda m: romanos[m.group(1)], n))
        variantes.append(re.sub(r'\s+(II|III|IV|V|VI)\b', '', n))
        variantes.append(n.replace('-', ' ').replace('Interestellar', 'Interstellar'))
        variantes.append(' '.join(n.split()[:3]))  # primeras palabras, por si el resto no coincide
        for v in variantes:
            v = re.sub(r'\s+', ' ', v).strip(' -')
            if v and v not in salida:
                salida.append(v)
    return salida


def buscar(ficha):
    """Devuelve (seguro, candidato): seguro = (tipo, id, nombre, año) si el póster coincide."""
    poster = archivo_poster(ficha.get('poster'))
    tipos = ['tv', 'movie'] if ficha['tipo'] == 'serie' else ['movie', 'tv']
    candidato = None
    for q in consultas(ficha):
        for tipo in tipos:
            r = tmdb(f'search/{tipo}', query=q) or {}
            for res in r.get('results', [])[:10]:
                nombre = res.get('title') or res.get('name')
                anio = (res.get('release_date') or res.get('first_air_date') or '')[:4]
                dato = (tipo, res['id'], nombre, anio)
                if poster and archivo_poster(res.get('poster_path')) == poster:
                    return dato, dato
                candidato = candidato or dato
    return None, candidato


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--guardar', action='store_true', help='escribe en las fichas los ids confirmados')
    args = ap.parse_args()
    lista, _, _ = F.cargar()
    sin_id = [f for f in lista if not f.get('tmdb')]
    seguros, dudosos = [], []
    for f in sin_id:
        seguro, candidato = buscar(f)
        if seguro:
            seguros.append((f, seguro))
            if args.guardar:
                f['tmdb'] = {'tipo': seguro[0], 'id': seguro[1]}
                F.guardar(f)
        else:
            dudosos.append((f, candidato))
    print(f'{len(sin_id)} fichas sin id de TMDB.')
    print(f'{len(seguros)} confirmados por el póster' + (' (guardados en las fichas).' if args.guardar else ' (usa --guardar para escribirlos).'))
    if dudosos:
        print(f'\n{len(dudosos)} sin confirmar. Revisa el candidato y, si es correcto: python fanning.py imagenes "Título" --id N')
        for f, c in dudosos:
            print(f'  {f["titulo"]}:  ' + (f'{c[2]} ({c[3]}), {c[0]} {c[1]}' if c else 'sin resultados en TMDB'))


if __name__ == '__main__':
    main()
