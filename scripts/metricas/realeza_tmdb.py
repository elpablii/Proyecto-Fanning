"""La Realeza en TMDB: foto y cumpleaños de cada artista, y en qué títulos aparece.

1. Completa contenido/realeza.json: a cada artista sin "tmdb" le busca el id por nombre
   (el más popular de la búsqueda; si sale el equivocado, pon el id a mano y corre de nuevo),
   y con el id pide la foto y las fechas de nacimiento y de fallecimiento (solo lo que
   falta, salvo con --rehacer).
2. Pide a TMDB todos los créditos de cada artista (actuación, voz, apariciones como sí
   mismo, producción, música, guion, dirección; también los episodios sueltos de una serie)
   y deja en cada ficha "realeza": {"Nombre": ["actua", "produce", ...]} con quiénes
   participan y cómo. Ese campo se reescribe en cada corrida. Lo que TMDB no sabe (una
   canción que suena en la película, un cameo sin crédito) va a mano en
   "realeza_manual", con el mismo formato, y nunca se toca.

Después hay que correr actualizar.py --escribir para que la página tome los cambios.

Uso:  python scripts/metricas/realeza_tmdb.py [--rehacer]
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from episodios_tmdb import tmdb  # noqa: E402
import fichas as F  # noqa: E402

FOTO = 'https://image.tmdb.org/t/p/w500'


def guardar(realeza):
    with open(F.REALEZA, 'w', encoding='utf-8') as f:
        json.dump(realeza, f, ensure_ascii=False, indent=2)
        f.write('\n')


def completar_artistas(realeza, rehacer=False):
    for a in realeza:
        if not a.get('tmdb'):
            resultados = (tmdb('search/person', query=a['nombre']) or {}).get('results', [])
            if not resultados:
                print(f'!! {a["nombre"]}: TMDB no lo encuentra. Pon su id a mano en "tmdb".')
                continue
            elegido = max(resultados, key=lambda p: p.get('popularity', 0))
            a['tmdb'] = elegido['id']
            print(f'   {a["nombre"]}  ->  TMDB {elegido["id"]} "{elegido["name"]}" '
                  f'(https://www.themoviedb.org/person/{elegido["id"]})')
        if a.get('foto') and a.get('nacimiento') and not rehacer:
            continue
        p = tmdb(f'person/{a["tmdb"]}', language='en-US') or {}
        if p.get('profile_path') and (rehacer or not a.get('foto')):
            a['foto'] = FOTO + p['profile_path']
        if p.get('birthday') and (rehacer or not a.get('nacimiento')):
            a['nacimiento'] = p['birthday']
        if p.get('deathday'):
            a['fallecimiento'] = p['deathday']
    guardar(realeza)


# Créditos que son un homenaje o un agradecimiento, no un trabajo en el título.
HOMENAJES = {'In Memory Of', 'Thanks', 'Special Thanks', 'Dedicated To', 'Dedicatee'}


def papel(credito, en_reparto):
    """Cómo participa en un título, según su crédito en TMDB (ver fichas.PAPELES); None si no es un trabajo."""
    if en_reparto:
        personaje = (credito.get('character') or '').lower()
        if 'voice' in personaje:
            return 'voz'
        if any(x in personaje for x in ('self', 'himself', 'herself', 'archive')):
            return 'aparece'
        return 'actua'
    if credito.get('job') in HOMENAJES:
        return None
    return {'Production': 'produce', 'Sound': 'musica', 'Writing': 'escribe', 'Directing': 'dirige'}.get(
        credito.get('department'), 'equipo')


def marcar_titulos(realeza):
    lista, _, _ = F.cargar()
    por_id = {}  # (tipo, id de TMDB) -> título; los episodios con id propio cuentan para su serie
    for f in lista:
        if f.get('tmdb'):
            por_id[(f['tmdb']['tipo'], f['tmdb']['id'])] = f['titulo']
        for e in (f.get('episodios') or {}).values():
            if e.get('tmdb'):
                por_id[(e['tmdb']['tipo'], e['tmdb']['id'])] = f['titulo']

    hallado = {f['titulo']: {} for f in lista}
    for a in realeza:
        if not a.get('tmdb'):
            continue
        creditos = tmdb(f'person/{a["tmdb"]}/combined_credits') or {}
        for clave, en_reparto in (('cast', True), ('crew', False)):
            for c in creditos.get(clave, []):
                titulo = por_id.get((c.get('media_type'), c.get('id')))
                p = papel(c, en_reparto)
                if titulo and p:
                    hallado[titulo].setdefault(a['nombre'], set()).add(p)

    for ficha in lista:
        nuevo = {n: sorted(p, key=F.PAPELES.index) for n, p in sorted(hallado[ficha['titulo']].items())}
        if nuevo != ficha.get('realeza', {}):
            if nuevo:
                ficha['realeza'] = nuevo
            else:
                ficha.pop('realeza', None)
            F.guardar(ficha)
        papeles = F.papeles_realeza(ficha)
        if papeles:
            print(f'{ficha["titulo"]}: ' + '; '.join(f'{n} ({", ".join(p)})' for n, p in papeles.items()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--rehacer', action='store_true', help='vuelve a pedir la foto y la fecha de nacimiento')
    args = ap.parse_args()
    realeza = F.cargar_realeza()
    print('Artistas:')
    completar_artistas(realeza, args.rehacer)
    print('\nTítulos con alguien de la Realeza:')
    marcar_titulos(realeza)
    print('\nAhora corre: python fanning.py actualizar')


if __name__ == '__main__':
    main()
