"""Verifica la clasificación de edad de cada ficha con la de EE.UU. convertida a la escala chilena.

Por cada ficha de contenido/titulos/ pide a TMDB las clasificaciones por país, usando
el id de la ficha (movie/<id>/release_dates o tv/<id>/content_ratings). La propuesta es
la clasificación de EE.UU. (MPA para películas, TV Parental Guidelines para series)
convertida con EQUIVALENCIAS; si tiene varias (reestrenos, temporadas), se usa la más
alta. Chile, México, Argentina y Brasil se muestran solo como referencia.

Escribe dos archivos en scripts/metricas/verificaciones/:
  - clasificacion.md: el informe para leer (actual, EE.UU., propuesta, otros países, estado);
  - clasificacion_decisiones.json: lo que se aplicará. "decision" viene con la propuesta;
    para los títulos sin clasificación de EE.UU. queda vacía y se completa a mano (TE, TE+7,
    +14 o +18). Si el archivo ya existe, las decisiones que difieren de la propuesta (las
    escritas a mano) se conservan al volver a correr el script.

Con --aplicar no consulta TMDB: copia cada "decision" a la "clasificacion" de su ficha.
Después hay que correr actualizar.py --escribir para que la página la tome.

Uso:  python scripts/metricas/clasificacion_tmdb.py [--aplicar]
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import rel  # noqa: E402
import fichas as F  # noqa: E402
from episodios_tmdb import tmdb  # noqa: E402

ESCALA = ['TE', 'TE+7', '+14', '+18']
CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verificaciones')
INFORME = os.path.join(CARPETA, 'clasificacion.md')
DECISIONES = os.path.join(CARPETA, 'clasificacion_decisiones.json')

# EE.UU. -> Chile. "NR" (sin clasificar) no tiene equivalente y queda para decidir a mano.
EQUIVALENCIAS = {
    'G': 'TE', 'TV-Y': 'TE', 'TV-G': 'TE',
    'PG': 'TE+7', 'TV-Y7': 'TE+7', 'TV-Y7-FV': 'TE+7', 'TV-PG': 'TE+7',
    'PG-13': '+14', 'TV-14': '+14',
    'R': '+18', 'NC-17': '+18', 'TV-MA': '+18',
}
REFERENCIA = ['CL', 'MX', 'AR', 'BR']


def clasificaciones(ficha):
    """{país: [clasificaciones tal como las da TMDB]} para EE.UU. y los países de referencia."""
    ref = ficha['tmdb']
    por_pais = {}
    if ref['tipo'] == 'movie':
        for r in (tmdb(f'movie/{ref["id"]}/release_dates') or {}).get('results', []):
            valores = [f['certification'].strip() for f in r.get('release_dates', []) if f.get('certification', '').strip()]
            if valores:
                por_pais[r['iso_3166_1']] = valores
    else:
        for r in (tmdb(f'tv/{ref["id"]}/content_ratings') or {}).get('results', []):
            if r.get('rating', '').strip():
                por_pais.setdefault(r['iso_3166_1'], []).append(r['rating'].strip())
    return {p: por_pais[p] for p in ['US'] + REFERENCIA if p in por_pais}


def a_chile(valores):
    """La más alta de las clasificaciones de EE.UU., convertida a la escala chilena."""
    convertidas = [EQUIVALENCIAS[v.upper()] for v in valores if v.upper() in EQUIVALENCIAS]
    return max(convertidas, key=ESCALA.index) if convertidas else None


def verificar():
    fichas = F.cargar()[0]
    previas = json.load(open(DECISIONES, encoding='utf-8')) if os.path.exists(DECISIONES) else {}
    filas, decisiones = [], {}
    for i, ficha in enumerate(fichas, 1):
        t = ficha['titulo']
        print(f'[{i}/{len(fichas)}] {t}', flush=True)
        actual = ficha.get('clasificacion') or ''
        por_pais = clasificaciones(ficha) if ficha.get('tmdb') else {}
        propuesta = a_chile(por_pais.get('US', []))
        if not propuesta:
            estado = '🔧 sin clasificación de EE.UU.'
        else:
            estado = '✅ coincide' if propuesta == actual else '⚠️ difiere'
        filas.append((t, ficha['tipo'], actual, por_pais, propuesta, estado))
        previa = previas.get(F.slug(t), {})
        a_mano = previa.get('decision') and previa.get('decision') != previa.get('propuesta')
        decisiones[F.slug(t)] = {
            'titulo': t, 'actual': actual, 'eeuu': '/'.join(por_pais.get('US', [])),
            'propuesta': propuesta, 'estado': estado,
            'decision': previa['decision'] if a_mano else (propuesta or ''),
        }
    os.makedirs(CARPETA, exist_ok=True)
    with open(DECISIONES, 'w', encoding='utf-8') as f:
        json.dump(decisiones, f, ensure_ascii=False, indent=2)
        f.write('\n')
    escribir_informe(filas)
    print(f'\nInforme: {rel(INFORME)}\nDecisiones: {rel(DECISIONES)}')


def escribir_informe(filas):
    orden = ['⚠️', '🔧', '✅']
    filas = sorted(filas, key=lambda f: (orden.index(f[5].split()[0]), f[0]))
    conteo = {}
    for f in filas:
        conteo[f[5]] = conteo.get(f[5], 0) + 1
    lineas = ['# Verificación de clasificación de edad', '',
              'Generado por `scripts/metricas/clasificacion_tmdb.py`. La propuesta es la clasificación de '
              'EE.UU. que trae TMDB, convertida a la escala chilena: G/TV-Y/TV-G → TE, PG/TV-Y7/TV-PG → TE+7, '
              'PG-13/TV-14 → +14, R/NC-17/TV-MA → +18. Chile, México, Argentina y Brasil son solo referencia.',
              '', 'Las decisiones están en `clasificacion_decisiones.json` y se aplican con '
              '`python scripts/metricas/clasificacion_tmdb.py --aplicar`.', '', '## Resumen', '']
    lineas += [f'- {k}: {v}' for k, v in sorted(conteo.items(), key=lambda kv: -kv[1])]
    lineas += ['', '## Detalle', '', '| Título | Tipo | Actual | EE.UU. | Propuesta | Referencia | Estado |',
               '|---|---|---|---|---|---|---|']
    for t, tipo, actual, por_pais, propuesta, estado in filas:
        eeuu = '/'.join(dict.fromkeys(por_pais.get('US', []))) or '—'
        otros = ', '.join(f'{p} {"/".join(dict.fromkeys(v))}' for p, v in por_pais.items() if p != 'US') or '—'
        lineas.append(f'| {t} | {tipo} | {actual or "—"} | {eeuu} | {propuesta or "—"} | {otros} | {estado} |')
    with open(INFORME, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lineas) + '\n')


def aplicar():
    if not os.path.exists(DECISIONES):
        sys.exit(f'No existe {rel(DECISIONES)}: corre primero el script sin --aplicar.')
    decisiones = json.load(open(DECISIONES, encoding='utf-8'))
    cambios = 0
    for ficha in F.cargar()[0]:
        d = decisiones.get(F.slug(ficha['titulo']), {})
        nueva = (d.get('decision') or '').strip()
        if not nueva or nueva == ficha.get('clasificacion'):
            continue
        if nueva not in ESCALA:
            print(f'  {ficha["titulo"]}: "{nueva}" no es válida (usa TE, TE+7, +14 o +18); se omite.')
            continue
        print(f'  {ficha["titulo"]}: {ficha.get("clasificacion") or "—"} -> {nueva}')
        ficha['clasificacion'] = nueva
        F.guardar(ficha)
        cambios += 1
    print(f'\n{cambios} ficha(s) actualizadas. Ahora corre: python scripts/metricas/actualizar.py --escribir')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--aplicar', action='store_true', help='escribe en las fichas las decisiones del JSON')
    aplicar() if p.parse_args().aplicar else verificar()
