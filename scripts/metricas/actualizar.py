"""Actualiza TODA la página a partir de las fichas (contenido/) y los PDFs.

Fuentes (lo único que se edita a mano):
  - contenido/titulos/<título>.json   una ficha por película o serie (ver fichas.py)
  - contenido/tandas.json             la línea de tiempo
  - contenido/realeza.json            la Realeza (ver realeza_tmdb.py)
  - los PDFs de Vocabularios/ y Diálogos/

Este comando:
  1. Valida las fichas; si alguna tiene un error, se detiene y explica qué corregir.
  2. Cuenta palabras/frases y líneas de diálogo con los criterios de Metodología/.
  3. Genera fanning-dashboard/data/: pelis/<título>.json, <año>/vocabulario_*.json,
     manifest.json, realeza.json, timeline.json, contextos.json y diccionario.json. Todo eso es generado: no se edita a mano.
  4. Borra los datos generados de títulos que ya no tienen ficha.
  5. Deja un reporte de qué cambió en scripts/metricas/reporte_ultima_actualizacion.md

Uso:
  python scripts/metricas/actualizar.py             # muestra qué cambiaría (no escribe)
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
from rutas import ANIOS, DATA, REPORTE, absoluta  # noqa: E402
import fichas as F  # noqa: E402
import ranking  # noqa: E402
import nivel as N  # noqa: E402
import linea_tiempo  # noqa: E402
import diccionario  # noqa: E402
import contexto  # noqa: E402
from conteo import (clave_episodio, contar_dialogos, leer_lineas, leer_vocabulario,  # noqa: E402
                    sin_repetidas)

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


def base_dialogo(ruta):
    """Nombre del título según el PDF de diálogos (suele ser el nombre en inglés)."""
    n = os.path.splitext(os.path.basename(ruta))[0]
    n = re.sub(r'^(Dialogues? (from|of) |Gui[oó]n de la pel[ií]cula )', '', n, flags=re.I)
    n = re.sub(r'\s*(to improve (the )?vocabulary.*|in English.*|para aumentar.*)$', '', n, flags=re.I)
    return n.strip(' “”"')


def clave_de_nombre(nombre):
    """Clave de episodio (S01E01 / SP01) a partir de un nombre como "Maid (Episode 3)"."""
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
    """Nombre para un episodio que todavía no está en la ficha, con el mismo estilo que los demás."""
    estilo_sxe = any(re.match(r'^S\d+E\d+', n) for n in existentes)
    if clave.startswith('SP'):
        n = int(clave[2:])
        return f'Special {n}' if estilo_sxe else f'{titulo} (Special Episode {n})'
    s, e = int(clave[1:3]), int(clave[4:])
    return f'S{s:02d}E{e:02d}' if estilo_sxe else f'{titulo} (Episode {e})'


def slug_anual(titulo):
    return 'vocabulario_' + re.sub(r'\s+', '_', re.sub(r'[<>:"/\\|?*]', '', titulo.lower())) + '.json'


def id_entrada(origen, palabra, traduccion):
    return 'v_' + hashlib.md5(f'{origen}_{palabra}_{traduccion}'.encode()).hexdigest()[:8]


# ------------------------------------------------------------------ conteo por título

def procesar_titulo(ficha, avisos):
    titulo = ficha['titulo']
    es_serie = ficha['tipo'] == 'serie'
    pdfs = ficha['pdfs']
    entradas = []  # dicts con episodio, word, translation, anio
    for ruta in pdfs['vocabulario']:
        ents, av = leer_vocabulario(leer_lineas(absoluta(ruta)), os.path.basename(ruta) if es_serie else '')
        avisos += [f'{titulo}: {os.path.basename(ruta)}: {a}' for a in av]
        for e in ents:
            e['anio'] = anio_de(ruta)
            if not es_serie:
                e['episodio'] = None
        entradas += ents

    dialogos_ep = Counter()
    creditos = 0
    subtitulos = []  # (episodio, inicio, fin, texto), para el nivel de inglés
    for d in pdfs.get('dialogos', []):
        ruta = F.ruta_dialogo(d)
        m = re.search(r'Season\s*(\d+)', ruta, re.I)
        r = contar_dialogos(leer_lineas(absoluta(ruta)), es_serie=es_serie, temporada=int(m.group(1)) if m else 1,
                            episodio_fijo=F.episodio_fijo(d), con_textos=True)
        subtitulos += r['subtitulos']
        if r['sin_tiempos']:
            avisos.append(f'{titulo}: {os.path.basename(ruta)}: no tiene líneas de tiempos (formato no SRT)')
        creditos += r['creditos']
        for k, v in r['episodios'].items():
            if es_serie and k is None:
                avisos.append(f'{titulo}: {os.path.basename(ruta)}: {v} líneas antes del primer marcador de episodio '
                              '(no se asignan)')
                continue
            dialogos_ep[k] += v

    if es_serie:
        por_ep = defaultdict(list)
        for e in entradas:
            if e['episodio'] is None:
                avisos.append(f'{titulo}: entrada sin episodio: "{e["word"][:50]}"')
                continue
            por_ep[e['episodio']].append(e)
        episodios, repetidas = {}, []
        for k, ents in por_ep.items():
            unicas, rep = sin_repetidas(ents)
            repetidas += rep
            episodios[k] = {'vocabulario': unicas, 'dialogos': dialogos_ep.get(k, 0),
                            'anio': Counter(e['anio'] for e in unicas).most_common(1)[0][0]}
        for k, e in episodios.items():
            if not e['dialogos']:
                avisos.append(f'{titulo}: el episodio {k} tiene vocabulario pero 0 líneas de diálogo '
                              '(¿falta su marcador en el PDF de diálogos?)')
        for k in dialogos_ep:
            if k not in episodios:
                avisos.append(f'{titulo}: el episodio {k} tiene diálogos ({dialogos_ep[k]}) pero no vocabulario; '
                              'sus líneas no se suman')
        # Nivel de inglés de cada episodio y de la serie (promedio de los episodios ponderado por sus líneas)
        por_ep_subs = defaultdict(list)
        for sub in subtitulos:
            por_ep_subs[sub[0]].append(sub)
        for k, e in episodios.items():
            e['nivel'] = N.calcular_nivel([x['word'] for x in e['vocabulario']], e['dialogos'], por_ep_subs.get(k, []))
        con_nivel = [e for e in episodios.values() if e['nivel']]
        general = N.calcular_nivel([x['word'] for e in episodios.values() for x in e['vocabulario']],
                                   sum(e['dialogos'] for e in episodios.values()), subtitulos)
        if general and con_nivel:
            pesos = [max(e['dialogos'], 1) for e in con_nivel]
            puntaje = sum(e['nivel']['puntaje'] * w for e, w in zip(con_nivel, pesos)) / sum(pesos)
            general['puntaje'] = round(puntaje, 2)
            general['nivel'] = N.nivel_texto(puntaje)
            general['rango'] = [N.nivel_texto(min(e['nivel']['puntaje'] for e in con_nivel)),
                                N.nivel_texto(max(e['nivel']['puntaje'] for e in con_nivel))]
        for k, e in episodios.items():
            e['fin_subtitulos'] = fin_subtitulos(por_ep_subs.get(k, []))
        frases = contexto.contextos(subtitulos, [(k, x['word']) for k, e in episodios.items() for x in e['vocabulario']])
        return {'serie': True, 'episodios': episodios, 'repetidas': repetidas, 'creditos': creditos,
                'nivel': general, 'contextos': frases}

    unicas, repetidas = sin_repetidas(entradas)
    anios = Counter(e['anio'] for e in unicas)
    if len(anios) > 1:
        avisos.append(f'{titulo}: el vocabulario está repartido en varios años {dict(anios)}')
    total_dialogos = sum(dialogos_ep.values())
    return {'serie': False, 'vocabulario': unicas, 'dialogos': total_dialogos,
            'anio': anios.most_common(1)[0][0] if anios else None, 'repetidas': repetidas, 'creditos': creditos,
            'nivel': N.calcular_nivel([x['word'] for x in unicas], total_dialogos, subtitulos),
            'fin_subtitulos': fin_subtitulos(subtitulos),
            'contextos': contexto.contextos(subtitulos, [(None, x['word']) for x in unicas])}


def fin_subtitulos(subtitulos):
    """Minuto en que termina el último subtítulo: estimación de la duración si TMDB no la tiene."""
    fin = max((s[2] for s in subtitulos if s[2] is not None), default=None)
    return round(fin / 60) if fin else None


def duracion(minutos, fin_subs):
    """(minutos, estimada): la de la ficha (TMDB o a mano) o, si falta, la de los subtítulos."""
    if minutos:
        return int(minutos), False
    return (fin_subs, True) if fin_subs else (None, False)


def completar_episodios(ficha, res):
    """Agrega a la ficha los episodios nuevos (con vocabulario) que todavía no tiene. Devuelve True si cambió."""
    eps = ficha.setdefault('episodios', {})
    nombres = [e.get('nombre', '') for e in eps.values()]
    nuevos = [k for k in res['episodios'] if k not in eps]
    for k in nuevos:
        eps[k] = {'nombre': nombre_nuevo(ficha['titulo'], k, nombres)}
    return bool(nuevos)


# ------------------------------------------------------------------ datos de la página

def nivel_mostrado(fijo, calculado):
    """El nivel calculado; uno puesto a mano en la ficha ("nivel_fijo") tiene prioridad."""
    return fijo or (calculado['nivel'] if calculado else 'B2')


def datos_pagina(ficha, res):
    """Contenido de data/pelis/<título>.json, generado solo desde la ficha y el conteo."""
    limpiar = lambda e: {'word': e['word'], 'translation': e['translation']}  # noqa: E731
    datos = {
        'title': ficha['titulo'],
        'level': nivel_mostrado(ficha.get('nivel_fijo'), res['nivel']),
        'levelDetail': res['nivel'],
        'englishAnalysis': ficha.get('analisis', ''),
        'tmdb': {'overview': ficha.get('sinopsis', ''), 'photos': ficha.get('fotos', [])},
    }
    if ficha.get('poster'):
        datos['posterUrl'] = ficha['poster']
    if ficha.get('fondo'):
        datos['backdropUrl'] = ficha['fondo']
    if not res['serie']:
        datos['vocabulary'] = [limpiar(e) for e in res['vocabulario']]
        datos['count'] = len(res['vocabulario'])
        datos['dialogues'] = res['dialogos']
        datos['duration'], estimada = duracion(ficha.get('duracion'), res['fin_subtitulos'])
        if estimada:
            datos['durationEstimated'] = True
        return datos

    episodios, tmdb_eps = [], {}
    for k in sorted(res['episodios'], key=F.orden_episodio):
        r = res['episodios'][k]
        e = ficha['episodios'][k]
        ep = {'code': k, 'name': e['nombre'], 'level': nivel_mostrado(e.get('nivel_fijo'), r['nivel']),
              'levelDetail': r['nivel'],
              'vocabulary': [limpiar(x) for x in r['vocabulario']],
              'count': len(r['vocabulario']), 'dialogues': r['dialogos']}
        ep['duration'], estimada = duracion(e.get('duracion'), r['fin_subtitulos'])
        if estimada:
            ep['durationEstimated'] = True
        if e.get('analisis'):
            ep['englishAnalysis'] = e['analisis']
        episodios.append(ep)
        # datos de TMDB del episodio, guardados por código (no por posición)
        tmdb_eps[k] = {x: e[y] for x, y in (('name', 'titulo'), ('still_path', 'foto'), ('overview', 'sinopsis'))
                       if e.get(y)}
    datos['episodes'] = episodios
    datos['tmdb']['episodes'] = tmdb_eps
    datos['count'] = sum(e['count'] for e in episodios)
    datos['dialogues'] = sum(e['dialogues'] for e in episodios)
    datos['duration'] = sum(e['duration'] or 0 for e in episodios) or None
    if any(e.get('durationEstimated') or not e['duration'] for e in episodios):
        datos['durationEstimated'] = True
    return datos


def construir_manifest(lista_fichas, resultados, pelis):
    # palabras planas (una por entrada) con su año y origen
    items = []
    for f in lista_fichas:
        titulo, res, datos = f['titulo'], resultados[f['titulo']], pelis[f['titulo']]
        if res['serie']:
            for ep in datos['episodes']:
                anio = res['episodios'][ep['code']]['anio']
                items += [{'titulo': titulo, 'origen': ep['name'], 'anio': anio, **e} for e in ep['vocabulary']]
        else:
            items += [{'titulo': titulo, 'origen': titulo, 'anio': res['anio'], **e} for e in datos['vocabulary']]
    # Palabras más repetidas: misma palabra con significado relacionado (ver ranking.py).
    grupos = ranking.agrupar(items)
    frecuencia = Counter(grupos)
    for i, g in zip(items, grupos):
        i['global_frequency'] = frecuencia[g]

    def entrada(f, anio=None):
        titulo, res, datos = f['titulo'], resultados[f['titulo']], pelis[f['titulo']]
        if res['serie']:
            eps = [ep for ep in datos['episodes'] if anio is None or res['episodios'][ep['code']]['anio'] == anio]
            if not eps:
                return None
            episodios = [{'code': ep['code'], 'name': ep['name'], 'count': ep['count'], 'dialogues': ep['dialogues'],
                          'level': ep['level'], 'duration': ep['duration']} for ep in eps]
            anios = sorted({res['episodios'][ep['code']]['anio'] for ep in datos['episodes']})
        else:
            if anio is not None and res['anio'] != anio:
                return None
            episodios = [{'name': titulo, 'count': datos['count'], 'dialogues': datos['dialogues'],
                          'level': datos['level'], 'duration': datos['duration']}]
            anios = [res['anio']]
        m = {
            'title': titulo,
            'count': sum(e['count'] for e in episodios),
            'type': 'series' if res['serie'] else 'movie',
            'episodes': episodios,
            'level': datos['level'],
            # en las series, el nivel del episodio más fácil y el del más difícil
            'levelRange': (res['nivel'] or {}).get('rango') if res['serie'] else None,
            'rating': f.get('clasificacion') or 'TE',
            'dialogues': sum(e['dialogues'] for e in episodios),
            'duration': sum(e['duration'] or 0 for e in episodios) or None,  # minutos
            # otros nombres (p. ej. el título en inglés del PDF de diálogos) para el buscador
            'aliases': sorted({base_dialogo(F.ruta_dialogo(d)) for d in f['pdfs'].get('dialogos', [])} - {titulo}),
            'years': anios,
        }
        if f.get('poster'):
            m['posterUrl'] = f['poster']
        if f.get('fondo'):
            m['backdropUrl'] = f['fondo']
        if F.papeles_realeza(f):
            m['realeza'] = F.papeles_realeza(f)  # {artista: [cómo participa]}
        # de TMDB (origen_tmdb.py): géneros y fecha de estreno
        for clave, campo in (('genres', 'generos'), ('releaseDate', 'estreno')):
            if f.get(campo):
                m[clave] = f[campo]
        return m

    def estadisticas(anio=None):
        lista = [m for m in (entrada(f, anio) for f in lista_fichas) if m]
        lista.sort(key=lambda m: m['count'], reverse=True)
        # por año se cuenta solo lo de ese año
        elegidos = [(i, g) for i, g in zip(items, grupos) if anio is None or i['anio'] == anio]
        top_list = ranking.top([i for i, _ in elegidos], [g for _, g in elegidos])
        return {
            'totalWords': sum(m['count'] for m in lista),
            'uniqueMovies': len(lista),
            'totalDialogues': sum(m['dialogues'] for m in lista),
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
        escribir_json(os.path.join(DATA, anio, slug_anual(titulo)), lista)


def escribir_pelis(pelis):
    """Escribe pelis/<título>.json y borra los de títulos que ya no tienen ficha."""
    carpeta = os.path.join(DATA, 'pelis')
    borrados = []
    for archivo in glob.glob(os.path.join(carpeta, '*.json')):
        if os.path.basename(archivo)[:-5] not in pelis:
            os.remove(archivo)
            borrados.append(os.path.basename(archivo))
    for titulo, datos in pelis.items():
        escribir_json(os.path.join(carpeta, f'{titulo}.json'), datos)
    return borrados


# ------------------------------------------------------------------ reporte

def reporte(manifest, viejo, avisos, resultados, borrados):
    va, na = viejo.get('all', {}), manifest['all']
    viejos = {m['title']: m for m in va.get('movieList', [])}
    L = ['# Reporte de la última actualización de métricas', '',
         'Generado por `scripts/metricas/actualizar.py` a partir de las fichas y los PDFs.', '',
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
    for m in sorted(na['movieList'], key=lambda m: m['title'].lower()):
        v = viejos.get(m['title'], {})
        r = resultados[m['title']]
        if v.get('count') != m['count'] or v.get('dialogues') != m['dialogues'] or r['repetidas']:
            antes_d = v.get('dialogues', '— (nuevo)') if v else '— (nuevo)'
            L.append(f'| {m["title"]} | {v.get("count", "—")} | {m["count"]} | {antes_d} | {m["dialogues"]} '
                     f'| {len(r["repetidas"])} | {r["creditos"]} |')
    cambios_nivel = [(m['title'], viejos.get(m['title'], {}).get('level'), m['level'])
                     for m in na['movieList'] if viejos.get(m['title'], {}).get('level') != m['level']]
    if cambios_nivel:
        L += ['', '## Nivel de inglés (MCER) que cambió', '',
              'Calculado por `nivel.py` (criterio en Metodología/Criterio de nivel de inglés (MCER).txt).', '',
              '| Título | Antes | Ahora | Vocabulario · Diálogos · Temas |', '|---|---|---|---|']
        for titulo, antes, ahora in sorted(cambios_nivel, key=lambda x: x[0].lower()):
            sen = (resultados[titulo]['nivel'] or {}).get('senales', {})
            L.append(f'| {titulo} | {antes or "—"} | {ahora} | {sen.get("vocabulario")} · {sen.get("dialogos")} · {sen.get("temas")} |')
    if borrados:
        L += ['', '## Títulos quitados (ya no tienen ficha)', ''] + [f'- {b[:-5]}' for b in borrados]
    L += ['', '## Avisos para revisar', '']
    L += [f'- {a}' for a in avisos] or ['- Ninguno']
    with open(REPORTE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')


# ------------------------------------------------------------------ main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--escribir', action='store_true', help='escribe los archivos de la página')
    args = ap.parse_args()

    lista, _, avisos_fichas = F.cargar()  # se detiene si alguna ficha tiene errores
    viejo = leer_json(os.path.join(DATA, 'manifest.json'), {})  # solo para comparar en el reporte

    avisos, resultados = [], {}
    for f in lista:
        print('  contando', f['titulo'])
        resultados[f['titulo']] = procesar_titulo(f, avisos)
    fichas_completadas = [f for f in lista if resultados[f['titulo']]['serie'] and completar_episodios(f, resultados[f['titulo']])]

    if not args.escribir:
        total_w = sum(len(r['vocabulario']) if not r['serie'] else sum(len(e['vocabulario']) for e in r['episodios'].values())
                      for r in resultados.values())
        total_d = sum(r['dialogos'] if not r['serie'] else sum(e['dialogos'] for e in r['episodios'].values())
                      for r in resultados.values())
        print(f'\nPalabras y frases: {viejo.get("all", {}).get("totalWords")} -> {total_w}')
        print(f'Líneas de diálogo: {viejo.get("all", {}).get("totalDialogues")} -> {total_d}')
        print(f'Títulos: {viejo.get("all", {}).get("uniqueMovies")} -> {len(lista)}')
        print(f'{len(avisos)} avisos del conteo y {len(avisos_fichas)} datos pendientes en las fichas.')
        for a in avisos:
            print('  -', a)
        print('\n(No se escribió nada. Usa --escribir para actualizar la página.)')
        return

    for f in fichas_completadas:
        F.guardar(f)
    pelis = {f['titulo']: datos_pagina(f, resultados[f['titulo']]) for f in lista}
    manifest, items = construir_manifest(lista, resultados, pelis)
    borrados = escribir_pelis(pelis)
    escribir_anuales(items)
    escribir_json(os.path.join(DATA, 'manifest.json'), manifest)
    escribir_json(os.path.join(DATA, 'realeza.json'), F.cargar_realeza())
    linea_tiempo.generar()
    contexto.escribir({t: r['contextos'] for t, r in resultados.items()})  # antes del diccionario, que lo usa
    diccionario.generar()
    reporte(manifest, viejo, avisos + avisos_fichas, resultados, borrados)
    a = manifest['all']
    print(f'\nListo: {a["totalWords"]:,} palabras y frases, {a["totalDialogues"]:,} líneas de diálogo, '
          f'{a["uniqueMovies"]} títulos. Reporte: {os.path.relpath(REPORTE)}')
    if fichas_completadas:
        print('Se agregaron episodios nuevos a:', ', '.join(f['titulo'] for f in fichas_completadas))
    if borrados:
        print('Se quitaron los datos de títulos sin ficha:', ', '.join(b[:-5] for b in borrados))
    if avisos_fichas:
        print(f'{len(avisos_fichas)} datos pendientes en las fichas (ver el reporte).')


if __name__ == '__main__':
    main()
