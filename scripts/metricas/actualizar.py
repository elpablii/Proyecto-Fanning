"""Actualiza TODAS las métricas de la página a partir de los PDFs.

Los PDFs son la fuente de verdad. Este comando:
  1. Cuenta palabras/frases y líneas de diálogo de cada título del catálogo
     (scripts/metricas/catalogo.json) con los criterios de Metodología/.
  2. Reescribe fanning-dashboard/public/data/pelis/<título>.json
     (vocabulario, cantidades y diálogos), conservando lo puesto a mano:
     nivel, análisis, TMDB, póster, clasificación y datos por episodio.
  3. Regenera los vocabularios por año (public/data/<año>/vocabulario_*.json).
  4. Regenera public/data/manifest.json: totales, por año, por título, por
     episodio, palabras más repetidas y datos del gráfico anual.
  5. Deja un reporte de qué cambió en scripts/metricas/reporte_ultima_actualizacion.md

Uso:
  python scripts/metricas/construir_catalogo.py   # si agregaste PDFs nuevos
  python scripts/metricas/actualizar.py           # muestra qué cambiaría (no escribe)
  python scripts/metricas/actualizar.py --escribir
"""
import argparse
import glob
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import ANIOS, CATALOGO, DATA, REPORTE, absoluta  # noqa: E402
from conteo import (clave_episodio, contar_dialogos, leer_lineas, leer_vocabulario,  # noqa: E402
                    normalizar, sin_repetidas)

ROMANOS = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10}


# ------------------------------------------------------------------ utilidades

def leer_json(ruta, defecto=None):
    if not os.path.exists(ruta):
        return defecto
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def escribir_json(ruta, datos):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)


def anio_de(ruta_rel):
    m = re.search(r'(20\d\d)', ruta_rel)
    return m.group(1) if m else None


def clave_de_nombre(nombre):
    """Clave de episodio a partir de un nombre ya usado en la página."""
    m = re.search(r'S(\d+)\s*EP?\s*(\d+)', nombre, re.I)
    if m:
        return clave_episodio(int(m.group(1)), int(m.group(2)))
    if re.search(r'special', nombre, re.I):
        m = re.search(r'special\D*(\d+)', nombre, re.I)
        return clave_episodio(0, int(m.group(1)) if m else 1, especial=True)
    m = re.search(r'(?:Episode|EP)\s*#?(\d+)', nombre, re.I)
    if m:
        return clave_episodio(1, int(m.group(1)))
    m = re.search(r'Part\s+([IVX]+)\b', nombre)
    if m:
        return clave_episodio(1, ROMANOS[m.group(1)])
    return None


def nombre_nuevo(titulo, clave, existentes):
    """Nombre para un episodio que todavía no existe en la página, con el mismo estilo."""
    estilo_sxe = any(re.match(r'^S\d+E\d+', n) for n in existentes)
    if clave.startswith('SP'):
        n = int(clave[2:])
        return f'Special {n}' if estilo_sxe else f'{titulo} (Special Episode {n})'
    s, e = int(clave[1:3]), int(clave[4:])
    return f'S{s:02d}E{e:02d}' if estilo_sxe else f'{titulo} (Episode {e})'


def orden_episodio(clave):
    if clave.startswith('SP'):
        return (1.5, int(clave[2:]))  # los especiales van después de la temporada 1
    return (int(clave[1:3]), int(clave[4:]))


def slug(titulo):
    return 'vocabulario_' + re.sub(r'\s+', '_', re.sub(r'[<>:"/\\|?*]', '', titulo.lower())) + '.json'


def id_entrada(origen, palabra, traduccion):
    return 'v_' + hashlib.md5(f'{origen}_{palabra}_{traduccion}'.encode()).hexdigest()[:8]


# ------------------------------------------------------------------ conteo por título

def procesar_titulo(t, avisos):
    es_serie = t['tipo'] == 'serie'
    entradas = []  # dicts con episodio, word, translation, anio
    for ruta in t['vocabulario']:
        lineas = leer_lineas(absoluta(ruta))
        ents, av = leer_vocabulario(lineas, os.path.basename(ruta) if es_serie else '')
        for a in av:
            avisos.append(f'{t["titulo"]}: {os.path.basename(ruta)}: {a}')
        for e in ents:
            e['anio'] = anio_de(ruta)
            if not es_serie:
                e['episodio'] = None
        entradas += ents

    dialogos_ep = Counter()
    creditos = 0
    for d in t['dialogos']:
        lineas = leer_lineas(absoluta(d['ruta']))
        m = re.search(r'Season\s*(\d+)', d['ruta'], re.I)
        r = contar_dialogos(lineas, es_serie=es_serie, temporada=int(m.group(1)) if m else 1,
                            episodio_fijo=d.get('episodio'))
        if r['sin_tiempos']:
            avisos.append(f'{t["titulo"]}: {os.path.basename(d["ruta"])}: no tiene líneas de tiempos (formato no SRT)')
        creditos += r['creditos']
        for k, v in r['episodios'].items():
            if es_serie and k is None:
                avisos.append(f'{t["titulo"]}: {os.path.basename(d["ruta"])}: {v} líneas antes del primer marcador de episodio (no se asignan)')
                continue
            dialogos_ep[k] += v

    repetidas = []
    if es_serie:
        por_ep = defaultdict(list)
        for e in entradas:
            if e['episodio'] is None:
                avisos.append(f'{t["titulo"]}: entrada sin episodio: "{e["word"][:50]}"')
                continue
            por_ep[e['episodio']].append(e)
        episodios = {}
        for k, ents in por_ep.items():
            unicas, rep = sin_repetidas(ents)
            repetidas += rep
            episodios[k] = {'vocabulario': unicas, 'dialogos': dialogos_ep.get(k, 0),
                            'anio': Counter(e['anio'] for e in unicas).most_common(1)[0][0]}
        for k, e in episodios.items():
            if not e['dialogos']:
                avisos.append(f'{t["titulo"]}: el episodio {k} tiene vocabulario pero 0 líneas de diálogo '
                              '(¿falta su marcador en el PDF de diálogos?)')
        for k in dialogos_ep:
            if k not in episodios:
                avisos.append(f'{t["titulo"]}: el episodio {k} tiene diálogos ({dialogos_ep[k]}) pero no vocabulario; '
                              'sus líneas no se suman')
        return {'serie': True, 'episodios': episodios, 'repetidas': repetidas, 'creditos': creditos}

    unicas, repetidas = sin_repetidas(entradas)
    anios = Counter(e['anio'] for e in unicas)
    if len(anios) > 1:
        avisos.append(f'{t["titulo"]}: el vocabulario está repartido en varios años {dict(anios)}')
    return {'serie': False, 'vocabulario': unicas, 'dialogos': sum(dialogos_ep.values()),
            'anio': anios.most_common(1)[0][0] if anios else None, 'repetidas': repetidas, 'creditos': creditos}


# ------------------------------------------------------------------ escritura

def actualizar_peli_json(titulo, res):
    ruta = os.path.join(DATA, 'pelis', f'{titulo}.json')
    datos = leer_json(ruta, {}) or {}
    datos['title'] = datos.get('title') or titulo
    datos.setdefault('englishAnalysis', '')
    limpiar = lambda e: {'word': e['word'], 'translation': e['translation']}  # noqa: E731
    if not res['serie']:
        datos['vocabulary'] = [limpiar(e) for e in res['vocabulario']]
        datos['count'] = len(res['vocabulario'])
        datos['dialogues'] = res['dialogos']
        datos.pop('episodes', None)
        escribir_json(ruta, datos)
        return datos

    viejos = {}
    for ep in datos.get('episodes') or []:
        k = clave_de_nombre(ep.get('name', ''))
        if k:
            viejos[k] = ep
    nombres = [ep.get('name', '') for ep in datos.get('episodes') or []]
    nuevos = []
    for k in sorted(res['episodios'], key=orden_episodio):
        r = res['episodios'][k]
        ep = dict(viejos.get(k) or {'name': nombre_nuevo(titulo, k, nombres)})
        ep['vocabulary'] = [limpiar(e) for e in r['vocabulario']]
        ep['count'] = len(r['vocabulario'])
        ep['dialogues'] = r['dialogos']
        nuevos.append(ep)
    datos['episodes'] = nuevos
    datos['count'] = sum(e['count'] for e in nuevos)
    datos['dialogues'] = sum(e['dialogues'] for e in nuevos)
    datos.pop('vocabulary', None)
    escribir_json(ruta, datos)
    return datos


def construir_manifest(catalogo, resultados, pelis, viejo):
    viejos_por_titulo = {m['title']: m for m in (viejo.get('all') or {}).get('movieList', [])}

    # palabras planas (una por entrada) con su año y origen
    items = []
    for t in catalogo:
        titulo, res, datos = t['titulo'], resultados[t['titulo']], pelis[t['titulo']]
        if res['serie']:
            for ep in datos['episodes']:
                k = clave_de_nombre(ep['name'])
                anio = res['episodios'][k]['anio']
                for e in ep['vocabulary']:
                    items.append({'titulo': titulo, 'origen': ep['name'], 'anio': anio, **e})
        else:
            for e in datos['vocabulary']:
                items.append({'titulo': titulo, 'origen': titulo, 'anio': res['anio'], **e})
    frecuencia = Counter(normalizar(i['word']) for i in items)
    for i in items:
        i['global_frequency'] = frecuencia[normalizar(i['word'])]

    def ficha(t, anio=None):
        titulo, res, datos = t['titulo'], resultados[t['titulo']], pelis[t['titulo']]
        v = viejos_por_titulo.get(titulo, {})
        tmdb = datos.get('tmdb') or {}
        if res['serie']:
            eps = [ep for ep in datos['episodes']
                   if anio is None or res['episodios'][clave_de_nombre(ep['name'])]['anio'] == anio]
            if not eps:
                return None
            viejos_eps = {e['name']: e for e in v.get('episodes', [])}
            episodios = [{'name': ep['name'], 'count': ep['count'], 'dialogues': ep['dialogues'],
                          'level': ep.get('level') or viejos_eps.get(ep['name'], {}).get('level') or 'B2'}
                         for ep in eps]
            count = sum(e['count'] for e in episodios)
            dialogos = sum(e['dialogues'] for e in episodios)
        else:
            if anio is not None and res['anio'] != anio:
                return None
            count, dialogos = datos['count'], datos['dialogues']
            episodios = [{'name': titulo, 'count': count, 'dialogues': dialogos,
                          'level': datos.get('level') or v.get('level') or 'B2'}]
        f = {
            'title': titulo,
            'count': count,
            'type': 'series' if res['serie'] else 'movie',
            'episodes': episodios,
            'level': datos.get('level') or v.get('level') or 'B2',
            'rating': tmdb.get('rating') or datos.get('rating') or v.get('rating') or 'TE',
            'dialogues': dialogos,
        }
        poster = datos.get('posterUrl') or v.get('posterUrl')
        fondo = datos.get('backdropUrl') or v.get('backdropUrl')
        if poster:
            f['posterUrl'] = poster
        if fondo:
            f['backdropUrl'] = fondo
        return f

    def estadisticas(anio=None):
        lista = [f for f in (ficha(t, anio) for t in catalogo) if f]
        lista.sort(key=lambda f: f['count'], reverse=True)
        sus = [i for i in items if anio is None or i['anio'] == anio]
        top = {}
        for i in sus:
            k = i['word'].lower()
            if k not in top or i['global_frequency'] > top[k]['count']:
                top[k] = {'word': i['word'], 'count': i['global_frequency'], 'translation': i['translation']}
        top_list = sorted(top.values(), key=lambda x: x['count'], reverse=True)[:10]
        return {
            'totalWords': sum(f['count'] for f in lista),
            'uniqueMovies': len(lista),
            'totalDialogues': sum(f['dialogues'] for f in lista),
            'topWord': top_list[0] if top_list else {'word': 'N/A', 'count': 0, 'translation': ''},
            'topList': top_list,
            'movieList': lista,
        }

    manifest = {'all': estadisticas()}
    for a in ANIOS:
        manifest[a] = estadisticas(a)
    manifest['yearlyData'] = [{'year': a, 'words': manifest[a]['totalWords'], 'dialogues': manifest[a]['totalDialogues']}
                              for a in ANIOS if manifest[a]['totalWords']]
    return manifest, items


def escribir_anuales(items):
    for f in glob.glob(os.path.join(DATA, '20*', 'vocabulario_*.json')):
        os.remove(f)
    grupos = defaultdict(list)
    for i in items:
        grupos[(i['anio'], i['titulo'])].append({
            'id': id_entrada(i['origen'], i['word'], i['translation']),
            'word': i['word'],
            'translation': i['translation'],
            'source_movie': i['origen'],
            'year_processed': i['anio'],
            'global_frequency': i['global_frequency'],
        })
    for (anio, titulo), lista in grupos.items():
        escribir_json(os.path.join(DATA, anio, slug(titulo)), lista)


# ------------------------------------------------------------------ reporte

def reporte(catalogo, pelis, manifest, viejo, avisos, resultados):
    va, na = viejo.get('all', {}), manifest['all']
    viejos = {m['title']: m for m in va.get('movieList', [])}
    L = ['# Reporte de la última actualización de métricas', '',
         'Generado por `scripts/metricas/actualizar.py` a partir de los PDFs.', '',
         '## Totales', '', '| Métrica | Antes | Ahora |', '|---|---:|---:|']
    for k, n in [('totalWords', 'Palabras y frases'), ('totalDialogues', 'Líneas de diálogo'), ('uniqueMovies', 'Títulos visibles')]:
        L.append(f'| {n} | {va.get(k, 0):,} | {na[k]:,} |')
    for a in ANIOS:
        vy, ny = viejo.get(a, {}), manifest[a]
        if ny['totalWords'] or vy.get('totalWords'):
            L.append(f'| {a}: palabras / diálogos | {vy.get("totalWords", 0):,} / {vy.get("totalDialogues", 0):,} '
                     f'| {ny["totalWords"]:,} / {ny["totalDialogues"]:,} |')
    L += ['', '## Por título (solo los que cambiaron)', '',
          '| Título | Palabras antes | Palabras ahora | Diálogos antes | Diálogos ahora | Repetidas quitadas | Créditos excluidos |',
          '|---|---:|---:|---:|---:|---:|---:|']
    for f in sorted(na['movieList'], key=lambda f: f['title'].lower()):
        v = viejos.get(f['title'], {})
        r = resultados[f['title']]
        if v.get('count') != f['count'] or v.get('dialogues') != f['dialogues'] or r['repetidas']:
            antes_c = v.get('count', '—')
            antes_d = v.get('dialogues', '— (no visible)') if v else '— (no visible)'
            L.append(f'| {f["title"]} | {antes_c} | {f["count"]} | {antes_d} | {f["dialogues"]} '
                     f'| {len(r["repetidas"])} | {r["creditos"]} |')
    L += ['', '## Avisos para revisar', '']
    L += [f'- {a}' for a in avisos] or ['- Ninguno']
    with open(REPORTE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')


# ------------------------------------------------------------------ main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--escribir', action='store_true', help='escribe los archivos de la página')
    args = ap.parse_args()

    catalogo = leer_json(CATALOGO)
    if not catalogo:
        sys.exit('Falta el catálogo: corre primero scripts/metricas/construir_catalogo.py')
    viejo = leer_json(os.path.join(DATA, 'manifest.json'), {})

    avisos, resultados = [], {}
    for t in catalogo:
        print('  contando', t['titulo'])
        resultados[t['titulo']] = procesar_titulo(t, avisos)

    if not args.escribir:
        total_w = sum(len(r['vocabulario']) if not r['serie'] else sum(len(e['vocabulario']) for e in r['episodios'].values())
                      for r in resultados.values())
        total_d = sum(r['dialogos'] if not r['serie'] else sum(e['dialogos'] for e in r['episodios'].values())
                      for r in resultados.values())
        print(f'\nPalabras y frases: {viejo.get("all", {}).get("totalWords")} -> {total_w}')
        print(f'Líneas de diálogo: {viejo.get("all", {}).get("totalDialogues")} -> {total_d}')
        print(f'Títulos: {viejo.get("all", {}).get("uniqueMovies")} -> {len(catalogo)}')
        print(f'{len(avisos)} avisos:')
        for a in avisos:
            print('  -', a)
        print('\n(No se escribió nada. Usa --escribir para actualizar la página.)')
        return

    pelis = {t['titulo']: actualizar_peli_json(t['titulo'], resultados[t['titulo']]) for t in catalogo}
    manifest, items = construir_manifest(catalogo, resultados, pelis, viejo)
    escribir_anuales(items)
    escribir_json(os.path.join(DATA, 'manifest.json'), manifest)
    reporte(catalogo, pelis, manifest, viejo, avisos, resultados)
    a = manifest['all']
    print(f'\nListo: {a["totalWords"]:,} palabras y frases, {a["totalDialogues"]:,} líneas de diálogo, '
          f'{a["uniqueMovies"]} títulos. Reporte: {os.path.relpath(REPORTE)}')


if __name__ == '__main__':
    main()
