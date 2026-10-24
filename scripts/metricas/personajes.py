"""Los personajes de la Realeza: a quién interpreta cada artista en cada título del proyecto.

Pide a TMDB el reparto de cada artista (combined_credits, el mismo que usa realeza_tmdb.py) y,
por cada título del proyecto donde actúa, pone la voz o aparece, guarda el nombre del personaje.
TMDB escribe "Barbie (voice)" o "Herself": se limpia la nota y "Herself" queda como aparición.

Queda en fanning-dashboard/data/personajes.json (la Galería de Personajes, /realeza/personajes):
  {"Margot Robbie": [{"titulo": "Barbie", "personajes": ["Barbie"], "papel": "actua"}, ...]}

  python fanning.py personajes
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from episodios_tmdb import tmdb  # noqa: E402
import fichas as F  # noqa: E402
from realeza_tmdb import papel, titulos_por_id  # noqa: E402
from rutas import DATA  # noqa: E402

PERSONAJES = os.path.join(DATA, 'personajes.json')
NOTAS = re.compile(r'\s*\((?:voice|uncredited|archive footage|credit only)[^)]*\)', re.I)
SI_MISMO = re.compile(r'^(?:self|himself|herself|themselves)\b', re.I)


def limpiar(personaje):
    """'Barbie (voice) / Narrator' -> ['Barbie', 'Narrator']; 'Herself' -> []."""
    nombres = []
    for parte in (personaje or '').split(' / '):
        parte = NOTAS.sub('', parte).strip()
        if parte and not SI_MISMO.match(parte) and parte not in nombres:
            nombres.append(parte)
    return nombres


def main():
    lista, _, _ = F.cargar()
    por_id = titulos_por_id(lista)
    # Orden del proyecto: el de las tandas lo pone la página; acá basta con un orden estable.
    salida = {}
    for a in F.cargar_realeza():
        if not a.get('tmdb'):
            continue
        creditos = tmdb(f'person/{a["tmdb"]}/combined_credits') or {}
        papeles = {}  # título -> {"personajes": [...], "papel": ...}
        for c in creditos.get('cast', []):
            titulo = por_id.get((c.get('media_type'), c.get('id')))
            p = papel(c, True)
            if not titulo or not p:
                continue
            item = papeles.setdefault(titulo, {'titulo': titulo, 'personajes': [], 'papel': p})
            for n in limpiar(c.get('character')):
                if n not in item['personajes']:
                    item['personajes'].append(n)
            # Si en un crédito actúa y en otro solo aparece (un episodio de archivo), manda actuar.
            if F.PAPELES.index(p) < F.PAPELES.index(item['papel']):
                item['papel'] = p
        if papeles:
            salida[a['nombre']] = sorted(papeles.values(), key=lambda x: x['titulo'])
            print(f'{a["nombre"]}: ' + '; '.join(
                f'{x["titulo"]} ({", ".join(x["personajes"]) or x["papel"]})' for x in salida[a['nombre']]))

    with open(PERSONAJES, 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'\n{sum(len(v) for v in salida.values())} papeles de {len(salida)} artistas en {os.path.relpath(PERSONAJES)}')


if __name__ == '__main__':
    main()
