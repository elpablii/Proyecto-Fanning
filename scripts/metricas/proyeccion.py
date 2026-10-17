"""Proyección y planificación de las tandas futuras, a partir del txt de planificación.

El txt (por defecto "información para proyección 2027.txt", en la raíz) tiene:
  - Una sección por año: "Vocabulario en inglés de películas/series a aprender en 2028:", con
      Cantidad líneas <Serie>: 8.373 (3ra), ...      líneas por temporada
      Película: CantidadDialogos (palabras)
      Serie (Temporada:PrimerEp-UltimoEp) (palabras ep1-ep2-...)   (las cifras son opcionales)
    Prefijo: ☑️ = visto; 1️⃣..9️⃣ = con vocabulario hecho (las primeras N cifras son reales).
  - "Remanentes para alguna aplicación especial": títulos sin año asignado.
  - Las tandas planificadas ("74° tanda de vocabularios de las siguientes películas: A, B y C",
    con la fecha en la línea siguiente).
  Se ignoran los asteriscos, las respuestas a preguntas y la lista de "Contenido a descargar".

Correcciones y datos que no están en el txt: datos_proyeccion/ajustes.json (se edita a mano).
Datos de TMDB (duración, elenco, temática): datos_proyeccion/tmdb.json (se genera; los ids que
se buscaron solos quedan marcados para revisar). Realeza y cumpleaños: datos_proyeccion/realeza.json.

Palabras de cada ítem:
  - real: ya tiene vocabulario.
  - estimada: líneas × (1 − comprensión oficial del año anterior, según la página).
  - corregida: la estimada × lo que rindió de verdad lo que ya tiene vocabulario (real ÷ estimado):
    por serie si tiene al menos 3 episodios reales, si no por grupo (películas, series, videojuegos).

Uso:  python scripts/metricas/proyeccion.py [--txt ruta] [--rehacer-tmdb] [--sin-plan]
Deja el detalle en scripts/metricas/reporte_proyeccion.md.
"""
import argparse
import datetime
import difflib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteo import normalizar  # noqa: E402
from planificador import Planificador  # noqa: E402
from rutas import DATA, RAIZ, rel  # noqa: E402

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datos_proyeccion')
AJUSTES = os.path.join(CARPETA, 'ajustes.json')
CACHE = os.path.join(CARPETA, 'tmdb.json')
REALEZA = os.path.join(CARPETA, 'realeza.json')
REPORTE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reporte_proyeccion.md')
TXT = os.path.join(RAIZ, 'información para proyección 2027.txt')

CUOTA, CUOTA_FIN, TOLERANCIA = 450, 550, 5   # Regla 9 (2027–2031): máximos, con 5 de margen
MAX_MIN = 8 * 60                             # duración máxima por tanda (salvo excepciones)
MIN_POR_DIA = 6 * 60                         # Regla 11: cada 6 h, un día más de aplicación
FACTOR_TXT = 0.0736                          # palabras por línea con que se calcularon las cifras del txt
LINEAS_POR_MIN = {'pelicula': 14.35, 'serie': 18.11, 'videojuego': 5.8}  # para lo que no tiene duración
TANDAS_POR_ANIO = 27
GENERO_TERROR = 27                           # id de TMDB
MIN_REALES_SERIE = 3                         # episodios reales para corregir una serie por separado

MESES = {'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'ago': 8,
         'sept': 9, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12}


def cargar(ruta, defecto):
    return json.load(open(ruta, encoding='utf-8')) if os.path.exists(ruta) else defecto


def guardar(ruta, datos):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)


def miles(n):
    return f'{n:,.0f}'.replace(',', '.')


def horas(minutos):
    return f'{int(minutos // 60)}:{int(round(minutos % 60)):02d} h'


# ================================================================ lectura del txt

def _prefijo(linea):
    """('visto'|'vocab'|'pendiente', cifras reales, resto de la línea)."""
    m = re.match(r'^(\d)️?⃣\s*', linea)
    if m:
        return 'vocab', int(m.group(1)), linea[m.end():]
    m = re.match(r'^☑️?\s*', linea)
    if m:
        return 'visto', 0, linea[m.end():]
    return 'pendiente', 0, linea


def partir_items(texto):
    """'A, B (EP 1-2, x) y C' -> ['A', 'B (EP 1-2, x)', 'C'], sin cortar dentro de paréntesis."""
    items, actual, nivel, i = [], '', 0, 0
    while i < len(texto):
        c = texto[i]
        nivel += (c == '(') - (c == ')')
        if nivel == 0 and (texto.startswith(', ', i) or texto.startswith(' y ', i)):
            items.append(actual.strip())
            actual = ''
            i += 2 if texto.startswith(', ', i) else 3
            continue
        actual += c
        i += 1
    if actual.strip():
        items.append(actual.strip())
    return items


def _tanda(s, lineas, i):
    m = re.match(r'^\*?(\d+)([a-z]?)°\s*tanda.*?:\s*(.+)$', s, re.I) or \
        re.match(r'^Tanda (\d+)([a-z]?)°.*?:\s*(.+)$', s, re.I)
    if not m:
        return None
    fecha = None
    for sig in lineas[i + 1:i + 3]:
        f = re.match(r'^\w+,\s*(\d+)\s+(\w+)\s+(\d{4})', sig.strip())
        if f:
            fecha = datetime.date(int(f.group(3)), MESES[f.group(2).lower()], int(f.group(1)))
            break
    texto = m.group(3)
    confirmar = bool(re.search(r'\(por confirmar\)\s*$', texto))
    texto = re.sub(r'\s*\(por confirmar\)\s*$', '', texto)
    return {'numero': int(m.group(1)), 'parte': m.group(2), 'id': f'{m.group(1)}{m.group(2)}',
            'fecha': fecha, 'por_confirmar': confirmar, 'items': partir_items(texto)}


def leer_txt(ruta):
    crudas = [l.rstrip() for l in open(ruta, encoding='utf-8')]
    lineas = []
    for l in crudas:  # una serie cuyas cifras quedaron en la línea siguiente
        if lineas and re.match(r'^\s*\([\d\-\s]+\)\**\s*$', l) and re.search(r'\(\d+:\d+-\d+\)\s*$', lineas[-1]):
            lineas[-1] += ' ' + l.strip()
        else:
            lineas.append(l)

    cat = {'lineas_serie': {}, 'series': {}, 'peliculas': {}, 'episodios': {}, 'metas': {},
           'tandas': [], 'avisos': []}
    seccion, modo = None, 'ignorar'
    for i, l in enumerate(lineas):
        s = l.strip()
        if not s:
            continue
        m = re.match(r'^Vocabulario en ingl[eé]s .*?(\d{4})', s)
        if m:
            seccion, modo = int(m.group(1)), 'catalogo'
            continue
        if re.match(r'^Remanentes', s, re.I):
            seccion, modo = 'remanente', 'catalogo'
            continue
        if re.match(r'^Contenido a descargar', s, re.I):
            break
        if re.match(r'^(Respuestas a preguntas|la estructura es|otras observaciones|aqu[ií] le dejo)', s, re.I):
            modo = 'ignorar'
        tanda = _tanda(s, lineas, i)
        if tanda:
            cat['tandas'].append(tanda)
            continue
        if modo != 'catalogo':
            continue

        estado, reales, resto = _prefijo(s)
        resto = resto.lstrip('*').strip()
        m = re.match(r'^Cantidad l[ií]neas (.+):\s*(\d[\d.]*.*)$', resto)
        if m:
            serie = re.sub(r'\s+aprox\.?$', '', m.group(1).strip())
            for cant, temp in re.findall(r'([\d.]+)\s*(?:\((\d+)\D*\))?', m.group(2)):
                if cant.strip('.'):
                    cat['lineas_serie'][(normalizar(serie), int(temp or 1))] = int(cant.replace('.', ''))
            cat['series'].setdefault(normalizar(serie), {'nombre': serie, 'anio': seccion})
            continue
        m = re.match(r'^(Miscel[aá]nea|Reinas y reyes):\s*([\d.]+)\s*/\s*([\d.]+)', resto, re.I)
        if m:
            cat['metas'][(seccion, m.group(1))] = (int(m.group(2).replace('.', '')), int(m.group(3).replace('.', '')))
            continue
        m = re.match(r'^(.+?)\s*\((\d+):(\d+)-(\d+)\)\s*(?:\(([\d\-\s]+)\))?\**\s*$', resto)
        if m:
            serie, temp, a, b = m.group(1).strip(), int(m.group(2)), int(m.group(3)), int(m.group(4))
            cifras = [int(x) for x in re.findall(r'\d+', m.group(5) or '')]
            n = normalizar(serie)
            cat['series'][n] = {'nombre': serie, 'anio': cat['series'].get(n, {}).get('anio', seccion)}
            for k, ep in enumerate(range(a, b + 1)):
                cat['episodios'][(n, temp, ep)] = {
                    'cifra': cifras[k] if k < len(cifras) else None,
                    'real': estado == 'vocab' and k < reales, 'estado': estado, 'anio': seccion}
            continue
        if re.search(r'\(\s*\d+\s*,\s*\d+', resto):
            cat['avisos'].append(f'"{resto[:60]}…": lista de episodios sueltos; no se tuvo en cuenta')
            continue
        m = re.match(r'^(.+):\s*([\d.]+)\*?\s*(?:\((\d+)\))?\**\s*$', resto)
        if m:
            cat['peliculas'][m.group(1).strip()] = {
                'lineas': int(m.group(2).replace('.', '')), 'cifra': int(m.group(3)) if m.group(3) else None,
                'real': estado == 'vocab', 'estado': estado, 'anio': seccion}
        elif len(resto) < 90 and not resto.endswith(':'):
            cat['peliculas'][resto] = {'lineas': None, 'cifra': None, 'real': False, 'estado': estado,
                                       'anio': seccion}
    return cat


def aplicar_ajustes(cat, ajustes):
    c = ajustes.get('catalogo', {})
    for nombre in c.get('quitar', []):
        cat['peliculas'].pop(nombre, None)
    for nombre, datos in c.get('agregar', {}).items():
        cat['peliculas'][nombre] = {'lineas': datos.get('lineas'), 'cifra': datos.get('palabras'),
                                    'real': bool(datos.get('real')), 'estado': datos.get('estado', 'pendiente'),
                                    'anio': datos.get('anio')}
    for clave, n in ajustes.get('reales', {}).items():
        serie, temp = clave.rsplit(' T', 1)
        for (s, t, e), ep in cat['episodios'].items():
            if s == normalizar(serie) and t == int(temp) and e <= n and ep['cifra'] is not None:
                ep['real'] = True


# ================================================================ TMDB

def _parecido(a, b):
    return difflib.SequenceMatcher(None, normalizar(a or ''), normalizar(b or '')).ratio()


def _variantes(nombre):
    v = [nombre, re.sub(r'\s*\([^)]*\)', '', nombre).strip()]
    v.append(re.sub(r'\s+(?:I|II|III|IV|V|VI)\b(?=:|$)', '', v[-1]).strip())
    if ': ' in v[1]:
        v.append(v[1].split(': ', 1)[1])
    return list(dict.fromkeys(x for x in v if x))


def _ficha(tmdb, tipo, ident):
    if tipo == 'movie':
        d = tmdb(f'movie/{ident}', language='en-US', append_to_response='credits,keywords') or {}
        return {'tipo': 'movie', 'id': ident, 'titulo_tmdb': d.get('title'),
                'anio': (d.get('release_date') or '')[:4], 'duracion': d.get('runtime') or None,
                'cast': [p['id'] for p in (d.get('credits') or {}).get('cast', [])],
                'keywords': [k['name'] for k in (d.get('keywords') or {}).get('keywords', [])],
                'generos': [g['id'] for g in d.get('genres', [])]}
    d = tmdb(f'tv/{ident}', language='en-US', append_to_response='keywords') or {}
    temporadas, cast = {}, {}
    for s in d.get('seasons', []):
        n = s.get('season_number')
        if not n:
            continue
        datos = tmdb(f'tv/{ident}/season/{n}', language='en-US', append_to_response='aggregate_credits') or {}
        temporadas[str(n)] = [e.get('runtime') for e in datos.get('episodes', [])]
        cast[str(n)] = [p['id'] for p in (datos.get('aggregate_credits') or {}).get('cast', [])]
    return {'tipo': 'tv', 'id': ident, 'titulo_tmdb': d.get('name'), 'anio': (d.get('first_air_date') or '')[:4],
            'temporadas': temporadas, 'cast_temporada': cast,
            'keywords': [k['name'] for k in (d.get('keywords') or {}).get('results', [])],
            'generos': [g['id'] for g in d.get('genres', [])]}


def _buscar(tmdb, nombre, tipo_preferido, ids_realeza):
    """(tipo, id, puntaje) del mejor candidato; prefiere el que tiene Realeza en el elenco."""
    mejor = (None, None, 0.0)
    for tipo in (tipo_preferido, 'tv' if tipo_preferido == 'movie' else 'movie'):
        for q in _variantes(nombre):
            resultados = ((tmdb(f'search/{tipo}', query=q) or {}).get('results') or [])[:4]
            for r in resultados:
                titulo = r.get('title') or r.get('name')
                p = max(_parecido(q, titulo), _parecido(nombre, titulo))
                if p < 0.55:
                    continue
                creditos = tmdb(f'{tipo}/{r["id"]}/{"credits" if tipo == "movie" else "aggregate_credits"}') or {}
                if ids_realeza & {c['id'] for c in creditos.get('cast', [])}:
                    p += 0.3
                p -= 0.05 * resultados.index(r)
                if p > mejor[2]:
                    mejor = (tipo, r['id'], p)
            if mejor[2] >= 1.0:
                return mejor
        if mejor[2] >= 0.8:
            return mejor
    return mejor if mejor[2] >= 0.6 else (None, None, mejor[2])


def datos_tmdb(cat, ajustes, realeza, rehacer):
    cache = {} if rehacer else cargar(CACHE, {})
    sin_tmdb = set(ajustes.get('sin_tmdb', []))
    pedidos = [(n, 'movie') for n in cat['peliculas'] if not n.startswith('GTA') and n not in sin_tmdb] + \
              [(s['nombre'], 'tv') for s in cat['series'].values()]
    faltan = [(n, t) for n, t in pedidos if n not in cache]
    if faltan:
        from episodios_tmdb import tmdb
        ids_realeza = {r['tmdb_id'] for r in realeza if r.get('tmdb_id')}
        for nombre, tipo in faltan:
            manual = ajustes.get('tmdb', {}).get(nombre)
            if manual:
                tipo, ident, auto = manual[0], manual[1], False
            else:
                tipo, ident, _ = _buscar(tmdb, nombre, tipo, ids_realeza)
                auto = True
            cache[nombre] = (_ficha(tmdb, tipo, ident) | {'auto': auto}) if ident else {'encontrado': False}
            print(f'  TMDB: {nombre} -> {cache[nombre].get("titulo_tmdb", "no encontrado")}', flush=True)
        guardar(CACHE, cache)
    return cache


def completar_realeza(realeza):
    faltan = [r for r in realeza if 'tmdb_id' not in r]
    if not faltan:
        return realeza
    from episodios_tmdb import tmdb
    for r in faltan:
        res = ((tmdb('search/person', query=r['nombre']) or {}).get('results') or [])
        if res and _parecido(res[0]['name'], r['nombre']) >= 0.85:
            d = tmdb(f'person/{res[0]["id"]}') or {}
            r['tmdb_id'], r['cumple'], r['auto'] = res[0]['id'], d.get('birthday'), True
        else:
            r['tmdb_id'], r['cumple'] = None, r.get('cumple')
    guardar(REALEZA, realeza)
    return realeza


# ================================================================ ítems

def factor_comprension(anio):
    """Palabras por línea: 1 − comprensión oficial del ciclo anterior (o del último que haya)."""
    ciclos = {c['anio']: c['comprension'] for c in cargar(os.path.join(DATA, 'timeline.json'), {}).get('ciclos', [])}
    previos = [a for a in ciclos if int(a) < int(anio)] if str(anio).isdigit() else list(ciclos)
    base = max(previos) if previos else max(ciclos)
    return 1 - ciclos[base] / 100, base


def construir_items(cat, tm, ajustes, realeza):
    avisos = []
    manuales = ajustes.get('duraciones', {})
    dobles = {normalizar(k): v for k, v in ajustes.get('episodios_dobles', {}).items()}
    tematicas = {k: set(v) for k, v in ajustes.get('tematicas', {}).items()}
    realeza_manual = ajustes.get('realeza_manual', {})
    por_id = {r['tmdb_id']: r['nombre'] for r in realeza if r.get('tmdb_id')}
    items = []

    def marcas(nombre, ficha, cast):
        m = set()
        kw = {k.lower() for k in ficha.get('keywords', [])}
        if 'christmas' in kw or nombre in tematicas.get('navidad', ()):
            m.add('navidad')
        if 'halloween' in kw or GENERO_TERROR in ficha.get('generos', []) or nombre in tematicas.get('halloween', ()):
            m.add('halloween')
        m |= {f'realeza:{por_id[c]}' for c in cast if c in por_id}
        m |= {f'realeza:{r}' for r in realeza_manual.get(nombre, [])}
        return m

    # películas (y videojuegos, entrevistas)
    for nombre, p in cat['peliculas'].items():
        grupo = 'videojuego' if nombre.startswith('GTA') else 'pelicula'
        ficha = tm.get(nombre, {})
        dur = manuales.get(nombre)
        if not dur and ficha.get('tipo') == 'movie':
            dur = ficha.get('duracion')
        elif not dur and ficha.get('tipo') == 'tv':
            parte = re.search(r'Part (I+)\b', nombre)
            eps = (ficha.get('temporadas') or {}).get('1') or []
            if parte and len(parte.group(1)) <= len(eps):
                dur = eps[len(parte.group(1)) - 1]
            else:
                dur = sum(e or 0 for e in eps) or None
        F, _ = factor_comprension(p['anio'])
        lineas = p['lineas']
        estimada_dur = not dur
        if not dur:
            dur = lineas / LINEAS_POR_MIN[grupo] if lineas else None
        if lineas is None and dur:
            lineas = dur * LINEAS_POR_MIN[grupo]
            avisos.append(f'{nombre}: sin líneas en el txt; se estimaron con la duración de TMDB')
        if lineas is None:
            avisos.append(f'{nombre}: sin líneas ni duración; no se puede estimar')
            continue
        cast = ficha.get('cast', [])
        items.append({'clave': ('p', nombre), 'nombre': nombre, 'grupo': grupo, 'serie': None,
                      'anio': p['anio'], 'lineas': lineas, 'base': lineas * F,
                      'palabras_real': p['cifra'] if p['real'] else None,
                      'minutos': dur, 'dur_estimada': estimada_dur, 'estado': p['estado'],
                      'marcas': marcas(nombre, ficha, cast)})

    # episodios: los del catálogo y, para series con líneas pero sin episodios listados, todos los de TMDB
    eps = dict(cat['episodios'])
    for (n, t), _ in cat['lineas_serie'].items():
        if any(k[0] == n and k[1] == t for k in eps):
            continue
        info = cat['series'].get(n, {})
        ficha = tm.get(info.get('nombre'), {})
        cuantos = len((ficha.get('temporadas') or {}).get(str(t)) or [])
        cuantos //= dobles.get(n, 1)
        for e in range(1, cuantos + 1):
            eps[(n, t, e)] = {'cifra': None, 'real': False, 'estado': 'pendiente', 'anio': info.get('anio')}
        if not cuantos:
            avisos.append(f'{info.get("nombre")} T{t}: hay líneas pero no episodios (ni en TMDB)')
    ultimo = {}
    for (n, t, e) in eps:
        ultimo[(n, t)] = max(ultimo.get((n, t), 0), e)
    for (n, t, e), ep in sorted(eps.items()):
        info = cat['series'].get(n, {'nombre': n})
        ficha = tm.get(info['nombre'], {})
        F, _ = factor_comprension(ep['anio'])
        total = cat['lineas_serie'].get((n, t))
        lineas = total / ultimo[(n, t)] if total else None
        runtimes = (ficha.get('temporadas') or {}).get(str(t)) or []
        d = dobles.get(n, 1)
        tramo = runtimes[(e - 1) * d:e * d]
        dur = sum(x or 0 for x in tramo) if len(tramo) == d and all(tramo) else None
        estimada_dur = dur is None
        if dur is None and lineas:
            dur = lineas / LINEAS_POR_MIN['serie']
        if lineas is None and dur:
            lineas = dur * LINEAS_POR_MIN['serie']
        if lineas is None:
            avisos.append(f'{info["nombre"]} T{t}: sin líneas ni duración')
            continue
        if ep['cifra'] is not None and not ep['real']:
            base = ep['cifra'] * F / FACTOR_TXT   # la cifra del txt, con la comprensión al día
        else:
            base = lineas * F
        items.append({'clave': ('e', n, t, e), 'nombre': f'{info["nombre"]} S{t:02d}E{e:02d}',
                      'serie_nombre': info['nombre'], 'grupo': 'serie', 'serie': (n, t * 1000 + e),
                      'anio': ep['anio'], 'lineas': lineas, 'base': base, 'base_formula': lineas * F,
                      'palabras_real': ep['cifra'] if ep['real'] else None,
                      'minutos': dur or 0, 'dur_estimada': estimada_dur, 'estado': ep['estado'],
                      'marcas': marcas(info['nombre'], ficha, (ficha.get('cast_temporada') or {}).get(str(t), []))})
    return items, avisos


def corregir(items):
    """Factor real ÷ estimado por grupo y por serie; deja 'palabras' (corregida) en cada ítem."""
    sumas = {}
    for it in items:
        if it['palabras_real'] is None:
            continue
        est = it.get('base_formula', it['base'])
        for clave in (it['grupo'], ('serie', it['serie'][0]) if it['serie'] else None):
            if clave:
                s = sumas.setdefault(clave, [0, 0, 0])
                s[0] += it['palabras_real']
                s[1] += est
                s[2] += 1
    factor = {k: v[0] / v[1] for k, v in sumas.items() if v[1]}
    for it in items:
        if it['palabras_real'] is not None:
            it['palabras'] = it['estimada'] = it['palabras_real']
            continue
        it['estimada'] = it['base']
        clave = ('serie', it['serie'][0]) if it['serie'] else None
        if clave in sumas and sumas[clave][2] >= MIN_REALES_SERIE:
            f = factor[clave]
        else:
            f = factor.get(it['grupo'], factor.get('pelicula', 1.0))
        it['palabras'] = it['base'] * f
    return factor, sumas


# ================================================================ tandas de un año

def resolver_item(texto, por_nombre, series):
    """Claves del catálogo que nombra un ítem de tanda; (claves, aviso)."""
    m = re.match(r'^(.+?)\s*\((.*(?:EP|Temp).*)\)\s*$', texto, re.I)
    if m and normalizar(m.group(1)) in series:
        n = normalizar(m.group(1))
        claves, temporada = [], 1
        for parte in re.split(r'\s*(?:&|,|\+)\s*', m.group(2)):
            t = re.search(r'Temp\s*(\d+)', parte, re.I)
            if t:
                temporada = int(t.group(1))
            e = re.search(r'EP\s*(\d+)(?:\s*-\s*(\d+))?', parte, re.I)
            if e:
                a, b = int(e.group(1)), int(e.group(2) or e.group(1))
                claves += [('e', n, temporada, x) for x in range(a, b + 1)]
        return claves, None
    n = normalizar(texto)
    exactos = [c for k, c in por_nombre.items() if k == n]
    if exactos:
        return exactos, None
    prefijo = [c for k, c in por_nombre.items() if k.startswith(n + ' ')]
    if prefijo:
        return prefijo, None
    parecido = difflib.get_close_matches(n, list(por_nombre), n=1, cutoff=0.8)
    if parecido:
        return [por_nombre[parecido[0]]], f'"{texto}" se tomó como "{por_nombre[parecido[0]][1]}"'
    return [], f'"{texto}" no está en el catálogo'


def armar_anio(cat, items, ajustes, realeza, anio):
    """Tandas del año (bins), requisitos temáticos y asignación inicial según el txt."""
    alias = {normalizar(k): v for k, v in ajustes.get('alias', {}).items()}
    por_clave = {it['clave']: k for k, it in enumerate(items)}
    por_nombre = {normalizar(it['nombre']): it['clave'] for it in items if not it['serie']}
    for a, destino in alias.items():
        if normalizar(destino) in por_nombre:
            por_nombre[a] = por_nombre[normalizar(destino)]
    series = {it['serie'][0] for it in items if it['serie']}
    tandas = sorted((t for t in cat['tandas'] if t['fecha'] and t['fecha'].year == anio),
                    key=lambda t: (t['fecha'], t['parte']))
    avisos = []
    if not tandas:
        return None
    ultimo = max(t['numero'] for t in tandas)
    inicial = {}
    for t in tandas:
        for texto in t['items']:
            claves, aviso = resolver_item(texto, por_nombre, series)
            if aviso:
                avisos.append(f"{t['id']}° Tanda: {aviso}")
            for c in claves:
                if c not in por_clave:
                    avisos.append(f"{t['id']}° Tanda: {texto} → {c[1]} T{c[2]} EP {c[3]} no está en el catálogo; se deja fuera")
                    continue
                inicial[por_clave[c]] = t['id']

    bins = []
    for t in tandas:
        fin = t['numero'] == ultimo
        bins.append({'id': t['id'], 'numero': t['numero'], 'fecha': t['fecha'], 'grupo': t['numero'],
                     'cuota': CUOTA_FIN if fin else CUOTA, 'meta': CUOTA_FIN if fin else CUOTA,
                     'max_min': MAX_MIN, 'requisitos': [], 'fin': fin, 'por_confirmar': t['por_confirmar']})

    def mas_cercana(fecha):
        return min(bins, key=lambda b: (abs((b['fecha'] - fecha).days), b['fecha']))

    del_anio = [k for k, it in enumerate(items) if it['anio'] == anio or k in inicial]
    # Navidad: la parte de Fin de Año más cercana al 25/12; Halloween: la tanda más cercana al 31/10
    navidad = [b for b in bins if b['fin']]
    if navidad:
        min(navidad, key=lambda b: abs((b['fecha'] - datetime.date(anio, 12, 25)).days))['requisitos'].append(
            ('Navidad', {'navidad'}, True))
    mas_cercana(datetime.date(anio, 10, 31))['requisitos'].append(('Halloween', {'halloween'}, True))
    sin_contenido = []
    for r in realeza:
        if not r.get('cumple'):
            continue
        marca = f'realeza:{r["nombre"]}'
        mes, dia = int(r['cumple'][5:7]), int(r['cumple'][8:10])
        try:
            fecha = datetime.date(anio, mes, dia)
        except ValueError:  # 29 de febrero
            fecha = datetime.date(anio, 2, 28)
        if any(marca in items[k]['marcas'] for k in del_anio):
            b = mas_cercana(fecha)
            b['requisitos'].append((f'Cumpleaños de {r["nombre"]} ({fecha:%d/%m})', {marca}, False))
        else:
            sin_contenido.append(r['nombre'])
    return {'bins': bins, 'inicial': inicial, 'del_anio': del_anio, 'avisos': avisos,
            'sin_contenido': sin_contenido, 'fijos': ajustes.get('fijos', {}), 'sagas': ajustes.get('sagas', {})}


def evaluar(bins, items, asignacion):
    """Métricas y reglas incumplidas por tanda para una asignación {item: id de tanda}."""
    filas = []
    por_bin = {b['id']: [] for b in bins}
    for k, b in asignacion.items():
        if b is not None:
            por_bin[b].append(k)
    grupos = {}
    for b in bins:
        ks = por_bin[b['id']]
        pal = sum(items[k]['palabras'] for k in ks)
        grupos.setdefault(b['grupo'], 0)
        grupos[b['grupo']] += pal
    for b in bins:
        ks = por_bin[b['id']]
        pal = sum(items[k]['palabras'] for k in ks)
        est = sum(items[k]['estimada'] for k in ks)
        real = sum(items[k]['palabras'] for k in ks if items[k]['palabras_real'] is not None)
        minutos = sum(items[k]['minutos'] for k in ks)
        problemas = []
        total_grupo = grupos[b['grupo']]
        ultima_parte = b is [x for x in bins if x['grupo'] == b['grupo']][-1]
        if ultima_parte and total_grupo > b['cuota'] + TOLERANCIA:
            problemas.append(f'pasa la cuota por {total_grupo - b["cuota"]:.0f}')
        if minutos > MAX_MIN:
            problemas.append(f'dura {horas(minutos - MAX_MIN)} de más')
        for etiqueta, marcas, obligatorio in b['requisitos']:
            if not any(marcas & items[k]['marcas'] for k in ks):
                problemas.append(f'falta: {etiqueta}' if obligatorio else f'(sin {etiqueta[0].lower()}{etiqueta[1:]})')
        if any(items[k]['dur_estimada'] for k in ks):
            problemas.append('duración estimada')
        filas.append({'bin': b, 'items': ks, 'palabras': pal, 'estimada': est, 'real': real,
                      'lineas': sum(items[k]['lineas'] for k in ks), 'minutos': minutos,
                      'dias': 1 + int(minutos // MIN_POR_DIA), 'problemas': problemas})
    # orden canónico
    orden = []
    pos = {b['id']: i for i, b in enumerate(bins)}
    cadenas = {}
    for k, b in asignacion.items():
        if b is not None and items[k]['serie']:
            cadenas.setdefault(items[k]['serie'][0], []).append((items[k]['serie'][1], pos[b], k))
    for s, lista in cadenas.items():
        lista.sort()
        for (o1, p1, k1), (o2, p2, k2) in zip(lista, lista[1:]):
            if p2 < p1:
                orden.append(f'{items[k2]["nombre"]} va antes que {items[k1]["nombre"]}')
    return filas, orden


def texto_tanda(ks, items):
    """Lista de títulos al estilo del txt: películas y rangos de episodios."""
    partes, series = [], {}
    for k in ks:
        it = items[k]
        if it['serie']:
            series.setdefault(it['serie_nombre'], []).append(it['clave'])
        else:
            partes.append(it['nombre'])
    for nombre, claves in series.items():
        claves.sort(key=lambda c: (c[2], c[3]))
        temporadas_serie = {c[2] for it in items if it['serie'] and it['serie_nombre'] == nombre for c in [it['clave']]}
        rangos, actual = [], None
        for _, _, t, e in claves:
            if actual and actual[0] == t and actual[2] == e - 1:
                actual[2] = e
            else:
                actual = [t, e, e]
                rangos.append(actual)
        def fmt(r):
            ep = f'EP {r[1]}' if r[1] == r[2] else f'EP {r[1]}-{r[2]}'
            return ep if temporadas_serie == {1} else f'Temp {r[0]} {ep}'
        partes.append(f'{nombre} ({" & ".join(fmt(r) for r in rangos)})')
    if len(partes) > 1:
        return ', '.join(partes[:-1]) + ' y ' + partes[-1]
    return partes[0] if partes else '(vacía)'


def planificar(plan, items, pesos=None):
    bins = plan['bins']
    idx = {b['id']: i for i, b in enumerate(bins)}
    ks = plan['del_anio']
    saga_de = {nombre: (f'saga:{saga}', orden) for saga, lista in plan['sagas'].items()
               for orden, nombre in enumerate(lista)}
    sub = []
    for k in ks:
        it = items[k]
        fijo = plan['fijos'].get(it['nombre'])
        marcas = set(it['marcas'])
        if it['serie']:
            marcas.add(f"serie:{it['serie'][0]}")
        sub.append({'clave': k, 'palabras': it['palabras'], 'minutos': it['minutos'], 'marcas': marcas,
                    'serie': it['serie'] or saga_de.get(it['nombre']), 'pelicula': not it['serie'],
                    'inicial': fijo or plan['inicial'].get(k), 'fijo': bool(fijo)})
    tandas = [{'id': b['id'], 'grupo': b['grupo'], 'cuota': b['cuota'], 'meta': b['meta'],
               'max_min': b['max_min'], 'requisitos': b['requisitos']} for b in bins]
    mejor = None
    for semilla in (2027, 7, 13, 25):
        p = Planificador(tandas, sub, TOLERANCIA, semilla)
        p.pesos.update(pesos or {})
        inicial = [idx[s['inicial']] if s['inicial'] is not None else None for s in sub]
        asign, costo = p.resolver(inicial)
        if mejor is None or costo < mejor[1]:
            mejor = (asign, costo)
    return {sub[i]['clave']: (bins[b]['id'] if b is not None else None) for i, b in enumerate(mejor[0])}


# ================================================================ reporte

def espacio(f, filas):
    """Palabras y tiempo que todavía entran en la tanda (en Fin de Año, las palabras de todo el grupo)."""
    b = f['bin']
    grupo = [x for x in filas if x['bin']['grupo'] == b['grupo']]
    pal = max(0, b['cuota'] - sum(x['palabras'] for x in grupo)) if f is grupo[-1] else None
    tiempo = horas(max(0, MAX_MIN - f['minutos']))
    return f'{pal:.0f} pal. · {tiempo}' if pal is not None else f'(con la parte siguiente) · {tiempo}'


def libre_total(filas):
    vistos, pal = set(), 0
    for f in filas:
        g = f['bin']['grupo']
        if g not in vistos:
            vistos.add(g)
            pal += max(0, f['bin']['cuota'] - sum(x['palabras'] for x in filas if x['bin']['grupo'] == g))
    return f'**{pal:.0f} pal.**'


def tabla(filas, md, titulo_total='Total'):
    md.append('| Tanda | Fecha | Palabras (corregidas) | Estimadas | Ya reales | Líneas | Duración | Días | Espacio libre | Revisar |')
    md.append('|---|---|---|---|---|---|---|---|---|---|')
    for f in filas:
        b = f['bin']
        nombre = f"{b['id']}°" + (' (Fin de Año)' if b['fin'] else '')
        md.append(f"| {nombre} | {b['fecha']:%d/%m} | {f['palabras']:.0f} | {f['estimada']:.0f} | {f['real']:.0f} | "
                  f"{miles(f['lineas'])} | {horas(f['minutos'])} | {f['dias']} | {espacio(f, filas)} | {'; '.join(f['problemas'])} |")
    t = lambda k: sum(f[k] for f in filas)  # noqa: E731
    md.append(f"| **{titulo_total}** | {len(filas)} | **{t('palabras'):.0f}** | {t('estimada'):.0f} | {t('real'):.0f} | "
              f"**{miles(t('lineas'))}** | **{horas(t('minutos'))}** | | {libre_total(filas)} | |")


def capacidad(items, anio, md, cat):
    ks = [it for it in items if it['anio'] == anio]
    if not ks:
        return
    pal = sum(it['palabras'] for it in ks)
    lin = sum(it['lineas'] for it in ks)
    minutos = sum(it['minutos'] for it in ks)
    cap = (TANDAS_POR_ANIO - 1) * CUOTA + CUOTA_FIN
    realeza_lin = sum(it['lineas'] for it in ks if any(m.startswith('realeza:') for m in it['marcas']))
    md.append(f'### {anio}\n')
    md.append(f'- Títulos: {sum(1 for it in ks if not it["serie"])} películas y {sum(1 for it in ks if it["serie"])} episodios.')
    md.append(f'- Palabras estimadas (corregidas): **{pal:.0f}** de una capacidad de {miles(cap)} '
              f'({TANDAS_POR_ANIO} tandas): **{pal / cap * 100:.0f} %**.')
    md.append(f'- Líneas: {miles(lin)} ({miles(realeza_lin)} con Realeza en el elenco según TMDB).')
    md.append(f'- Contenido: **{horas(minutos)}**; repartido en {TANDAS_POR_ANIO} tandas, '
              f'**{horas(minutos / TANDAS_POR_ANIO)} por tanda** (máximo {horas(MAX_MIN)}).')
    if pal < cap:
        falta = cap - pal
        md.append(f'- Para llenar todas las tandas faltan ~{falta:.0f} palabras (~{miles(falta / factor_comprension(anio)[0])} líneas).')
    for (sec, nombre), (a, b) in cat['metas'].items():
        if sec == anio:
            md.append(f'- Meta del txt «{nombre}»: {miles(a)} / {miles(b)}.')
    md.append('')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--txt', default=TXT)
    ap.add_argument('--rehacer-tmdb', action='store_true')
    ap.add_argument('--sin-plan', action='store_true', help='no busca un reacomodo')
    ap.add_argument('--anio', type=int, default=2027)
    args = ap.parse_args()

    ajustes = cargar(AJUSTES, {})
    realeza = completar_realeza(cargar(REALEZA, []))
    cat = leer_txt(args.txt)
    aplicar_ajustes(cat, ajustes)
    tm = datos_tmdb(cat, ajustes, realeza, args.rehacer_tmdb)
    items, avisos = construir_items(cat, tm, ajustes, realeza)
    factor, sumas = corregir(items)
    avisos = cat['avisos'] + avisos
    F, base = factor_comprension(args.anio)

    md = [f'# Proyección de tandas ({datetime.date.today():%d/%m/%Y})\n',
          f'Fuente: `{rel(args.txt)}`. Cuota máxima {CUOTA} (Fin de Año {CUOTA_FIN}, sumando sus partes), '
          f'con {TOLERANCIA} de margen. Duración máxima {horas(MAX_MIN)}. Un día de aplicación más cada {horas(MIN_POR_DIA)}.\n',
          '## Cómo se estima\n',
          f'- Palabras por línea: **{F * 100:.2f} %** (comprensión oficial de {base}: {100 - F * 100:.2f} %).',
          '- Corrección (real ÷ estimado en lo que ya tiene vocabulario):']
    for clave, (r, e, n) in sorted(sumas.items(), key=lambda kv: str(kv[0])):
        nombre = clave if isinstance(clave, str) else cat['series'].get(clave[1], {}).get('nombre', clave[1])
        uso = '' if isinstance(clave, str) or n >= MIN_REALES_SERIE else ' (pocos datos: se usa el de series)'
        md.append(f'  - {nombre}: ×{r / e:.2f} ({r} reales de {e:.0f} estimadas, {n} ítems){uso}')
    reales_pel = sorted((it['palabras_real'] / it['base'], it['nombre']) for it in items
                        if it['palabras_real'] is not None and not it['serie'] and it['grupo'] == 'pelicula')
    if reales_pel:
        md.append(f'- Películas, una por una: de ×{reales_pel[0][0]:.2f} ({reales_pel[0][1]}) a '
                  f'×{reales_pel[-1][0]:.2f} ({reales_pel[-1][1]}); la mitad entre '
                  f'×{reales_pel[len(reales_pel) // 4][0]:.2f} y ×{reales_pel[3 * len(reales_pel) // 4][0]:.2f}.')
    md.append('')

    plan = armar_anio(cat, items, ajustes, realeza, args.anio)
    if plan:
        avisos += plan['avisos']
        filas, orden = evaluar(plan['bins'], items, plan['inicial'])
        md.append(f'## {args.anio}: las tandas como están en el txt\n')
        tabla(filas, md)
        if orden:
            md.append('\nOrden canónico roto: ' + '; '.join(orden))
        sin = [items[k]['nombre'] for k in plan['del_anio'] if k not in plan['inicial']]
        if sin:
            md.append(f'\n**Contenido de {args.anio} sin tanda ({len(sin)}):** ' + ', '.join(_resumir(sin)))
        md.append('\n**Reglas temáticas del año:**')
        for b in plan['bins']:
            for etiqueta, _, _ in b['requisitos']:
                md.append(f"- {etiqueta} → {b['id']}° Tanda ({b['fecha']:%d/%m})")
        if plan['sin_contenido']:
            md.append(f"- Sin contenido este año (no se exige): {', '.join(plan['sin_contenido'])}")
        md.append('')

        if not args.sin_plan:
            print('Buscando reacomodo…', flush=True)
            nuevo = planificar(plan, items)
            filas2, orden2 = evaluar(plan['bins'], items, nuevo)
            md.append(f'## {args.anio}: propuesta de reacomodo\n')
            md.append('Prioridades: no pasarse de la cuota, cumplir Navidad y Halloween, no pasar de 8 h y mover lo '
                      'menos posible. Los cumpleaños se cumplen cuando se puede, y emparejar las tandas pesa poco porque '
                      'el año todavía va a sumar contenido. Lo de 2026 para atrás no se toca.\n')
            tabla(filas2, md)
            if orden2:
                md.append('\nOrden canónico roto: ' + '; '.join(orden2))
            movidos = []
            for k in plan['del_anio']:
                a, b = plan['inicial'].get(k), nuevo.get(k)
                if a != b:
                    movidos.append((items[k], a, b))
            md.append(f'\n**Cambios ({len(movidos)}):**\n')
            agrupados = {}
            for it, a, b in movidos:
                clave = (it.get('serie_nombre') or it['nombre'], a, b)
                agrupados.setdefault(clave, []).append(it)
            for (nombre, a, b), its in agrupados.items():
                detalle = texto_tanda([items.index(i) for i in its], items) if its[0]['serie'] else nombre
                md.append(f"- {detalle}: {a + '°' if a else 'sin tanda'} → {b + '°' if b else 'sin tanda'}")
            sin2 = [items[k]['nombre'] for k in plan['del_anio'] if nuevo.get(k) is None]
            if sin2:
                md.append(f'\n**Queda sin tanda:** ' + ', '.join(_resumir(sin2)))
            md.append('\n**La propuesta escrita como en el txt:**\n')
            md.append('```')
            for f in filas2:
                b = f['bin']
                md.append(f"{b['id']}° tanda de vocabularios de las siguientes películas: {texto_tanda(f['items'], items)}")
                md.append(f"{b['fecha']:%d/%m/%Y}")
            md.append('```\n')

    md.append('## Capacidad de los años siguientes (tentativo)\n')
    md.append('Con las listas actuales del txt, que todavía pueden cambiar. Estimado con la comprensión oficial más '
              'reciente: cuando avance el proyecto, cada palabra va a costar más líneas, así que es un piso de duración.\n')
    for anio in sorted({it['anio'] for it in items if it['anio'] not in (None, args.anio)}, key=str):
        capacidad(items, anio, md, cat)

    revisar = [(n, f) for n, f in tm.items() if f.get('auto') or f.get('encontrado') is False]
    if revisar:
        md.append('## TMDB: revisar que sea el título correcto\n')
        md.append('Se buscaron solos. Si alguno está mal, poner el id correcto en `ajustes.json` → `"tmdb"`.\n')
        for n, f in sorted(revisar):
            md.append(f"- {n} → " + (f"{f['titulo_tmdb']} ({f['anio']}) [{f['tipo']} {f['id']}]"
                                     if f.get('id') else '**no encontrado**'))
        md.append('')
    sin_cumple = [r['nombre'] for r in realeza if not r.get('cumple')]
    if sin_cumple:
        md.append(f'## Realeza sin cumpleaños\n\n{", ".join(sin_cumple)}. Se puede poner a mano en `realeza.json`.\n')
    if avisos:
        md.append('## Avisos\n')
        md += [f'- {a}' for a in dict.fromkeys(avisos)]
    with open(REPORTE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md) + '\n')
    print(f'Listo: {rel(REPORTE)}')


def _resumir(nombres):
    """Junta los episodios de una misma serie: 'ADC S01E06', 'ADC S01E07' -> 'ADC S01E06–E07'."""
    salida, actual = [], None
    for n in nombres:
        m = re.match(r'^(.*) S(\d+)E(\d+)$', n)
        if m and actual and actual[0] == (m.group(1), m.group(2)):
            actual[2] = m.group(3)
            continue
        if actual:
            salida.append(f'{actual[0][0]} S{actual[0][1]}E{actual[1]}' + (f'–E{actual[2]}' if actual[2] != actual[1] else ''))
            actual = None
        if m:
            actual = [(m.group(1), m.group(2)), m.group(3), m.group(3)]
        else:
            salida.append(n)
    if actual:
        salida.append(f'{actual[0][0]} S{actual[0][1]}E{actual[1]}' + (f'–E{actual[2]}' if actual[2] != actual[1] else ''))
    return salida


if __name__ == '__main__':
    main()
