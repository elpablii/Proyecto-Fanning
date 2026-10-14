"""Trae de TMDB la duración (en minutos) de cada película y de cada episodio, y la guarda en su ficha.

- Película: "duracion" en la ficha.
- Serie: "duracion" en cada episodio de "episodios" (y nada en la ficha: el total se suma solo).
- Solo completa lo que falta, salvo con --rehacer. Un valor puesto a mano se respeta.
- Si TMDB no tiene la duración, el cálculo usa la de los subtítulos (último subtítulo), marcada
  como estimada.

Uso:  python scripts/metricas/duracion_tmdb.py [--titulo "Título"] [--rehacer]
"""
import argparse
import difflib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from conteo import normalizar  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402


def _parecido(a, b):
    return difflib.SequenceMatcher(None, normalizar(a or ''), normalizar(b or '')).ratio()


def duracion_pelicula(tipo, tmdb_id):
    d = tmdb(f'{tipo}/{tmdb_id}', language='en-US') or {}
    if tipo == 'movie':
        return d.get('runtime') or None
    tiempos = d.get('episode_run_time') or []
    return tiempos[0] if tiempos else None


def completar_serie(ficha, rehacer):
    serie_id = ficha['tmdb']['id']
    temporadas = {}

    def temporada(n):
        if n not in temporadas:
            datos = tmdb(f'tv/{serie_id}/season/{n}', language='en-US') or {}
            temporadas[n] = datos.get('episodes', [])
        return temporadas[n]

    hechos = 0
    usados = {}  # (temporada TMDB, número TMDB) -> clave de nuestro episodio
    for clave, ep in ficha.get('episodios', {}).items():
        if ep.get('duracion') and not rehacer:
            continue
        if ep.get('tmdb', {}).get('tipo') == 'movie':
            minutos = duracion_pelicula('movie', ep['tmdb']['id'])
        else:
            lista = temporada(0) if clave.startswith('SP') else temporada(int(clave[1:3]))
            numero = int(clave[2:]) if clave.startswith('SP') else int(clave[4:])
            # mismo criterio que las fotos: primero por título (la numeración de TMDB puede no coincidir)
            candidato = None
            if ep.get('titulo'):
                mejor = max(lista, key=lambda e: _parecido(ep['titulo'], e.get('name')), default=None)
                if mejor and _parecido(ep['titulo'], mejor.get('name')) >= 0.8:
                    candidato = mejor
            if not candidato and not clave.startswith('SP'):
                candidato = next((e for e in lista if e.get('episode_number') == numero), None)
            minutos = (candidato or {}).get('runtime')
            if candidato:
                t = 0 if clave.startswith('SP') else int(clave[1:3])
                usados[(t, candidato.get('episode_number'))] = clave
                ep['_tmdb'] = (t, candidato.get('episode_number'))
        if minutos:
            ep['duracion'] = int(minutos)
            hechos += 1

    # Episodios en dos mitades (A/B): TMDB los guarda como dos episodios cortos. Si un episodio dura
    # mucho menos que lo normal de su temporada y el siguiente de TMDB no es ninguno de los nuestros,
    # es su otra mitad: se suman.
    for clave, ep in ficha.get('episodios', {}).items():
        pos = ep.pop('_tmdb', None)
        if not pos or not ep.get('duracion') or pos[0] == 0:
            continue
        lista = temporada(pos[0])
        normales = sorted(e['runtime'] for e in lista if e.get('runtime'))
        mediana = normales[len(normales) // 2] if normales else 0
        siguiente = next((e for e in lista if e.get('episode_number') == pos[1] + 1), None)
        if (mediana and ep['duracion'] < 0.6 * mediana and siguiente and siguiente.get('runtime')
                and (pos[0], pos[1] + 1) not in usados):
            ep['duracion'] += int(siguiente['runtime'])
    return hechos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--titulo', help='solo esta ficha')
    ap.add_argument('--rehacer', action='store_true', help='vuelve a pedir las duraciones aunque ya estén')
    args = ap.parse_args()
    lista, _, _ = F.cargar()
    if args.titulo:
        lista = [f for f in lista if f['titulo'] == args.titulo]
        if not lista:
            sys.exit(f'No hay una ficha con el título "{args.titulo}".')
    sin_dato = []
    for ficha in lista:
        if not ficha.get('tmdb'):
            sin_dato.append(f"{ficha['titulo']} (sin id de TMDB)")
            continue
        if ficha['tipo'] == 'serie':
            completar_serie(ficha, args.rehacer)
            faltan = [k for k, e in ficha.get('episodios', {}).items() if not e.get('duracion')]
            if faltan:
                sin_dato.append(f"{ficha['titulo']}: {len(faltan)} episodios sin duración ({', '.join(faltan[:6])}…)")
        elif not ficha.get('duracion') or args.rehacer:
            minutos = duracion_pelicula(ficha['tmdb']['tipo'], ficha['tmdb']['id'])
            if minutos:
                ficha['duracion'] = int(minutos)
            else:
                sin_dato.append(f"{ficha['titulo']} (TMDB no tiene su duración)")
        F.guardar(ficha)
    print(f'{len(lista)} fichas revisadas.')
    if sin_dato:
        print('Sin duración en TMDB (se estimará con los subtítulos):')
        for s in sin_dato:
            print('  -', s)
    if not args.titulo:
        print('\nAhora corre: python fanning.py actualizar')


if __name__ == '__main__':
    main()
