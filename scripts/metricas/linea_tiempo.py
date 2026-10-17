"""Genera fanning-dashboard/data/timeline.json (la línea de tiempo de la página).

Fuentes: contenido/tandas.json y contenido/ciclos.json (se editan a mano) y los datos ya
generados de cada título (data/pelis/*.json). No vuelve a contar los PDFs, así que es
rápido: se puede correr solo después de agregar una tanda (python fanning.py tandas).

Por cada tanda calcula sus palabras, líneas de diálogo, % de comprensión y duración (minutos),
sumando los títulos (o, en las series, solo los episodios que entraron en esa tanda). Por cada
ciclo (año), los totales.

Una tanda puede estar dividida en partes ("14a° Tanda", "14b° Tanda"): son UNA sola tanda.
Cada parte sale por separado, con su "numero" (14) y su "parte" ("a"), y los conteos de tandas
cuentan números, no partes.

Horas de inglés de cada parte (minutos), ver Reglas:
  - vista: ver el contenido por primera vez (su duración).
  - repaso: leer el vocabulario en voz alta una vez al día, desde la fecha de la parte hasta la
    siguiente tanda (con otro número). Cada lectura dura lo que toma decir cada entrada
    (palabra o frase + traducción) a VELOCIDAD_LECTURA palabras por minuto.
  - revision: volver a ver el contenido después de estudiar el vocabulario (su duración).
"""
import json
import os
import re
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import DATA, RAIZ  # noqa: E402
import fichas as F  # noqa: E402
import nivel as N  # noqa: E402
import tandas as T  # noqa: E402

CICLOS = os.path.join(RAIZ, 'contenido', 'ciclos.json')
# Regla 11: si los contenidos de una tanda suman más de 6 horas, se divide en dos sesiones (Día n-1 y Día n).
# Hasta la 68° Tanda (17/10/2026) el límite era de 5 horas: las tandas anteriores se hicieron así.
LIMITE_SESION = 6 * 60
LIMITE_SESION_ANTERIOR = 5 * 60
VIGENCIA_LIMITE = date(2026, 10, 18)


def limite_sesion(fecha):
    """Minutos que puede durar una tanda antes de dividirse en dos sesiones, según su fecha."""
    return LIMITE_SESION if fecha >= VIGENCIA_LIMITE else LIMITE_SESION_ANTERIOR
# Lectura en voz alta a velocidad normal y con buena dicción (palabras por minuto)
VELOCIDAD_LECTURA = 140
PALABRA = re.compile(r"[^\W\d_]+(?:'[^\W\d_]+)?|\d+")


def numero_y_parte(titulo_tanda):
    """'14a° Tanda' -> (14, 'a'); '25b° Tanda (Fin de Año)' -> (25, 'b'); '50° Tanda' -> (50, None)."""
    m = re.match(r'\s*(\d+)\s*([a-z])?', titulo_tanda)
    if not m:
        raise ValueError(f'La tanda "{titulo_tanda}" no empieza con su número.')
    return int(m.group(1)), m.group(2)


def palabras_texto(entradas):
    """Palabras que se dicen al leer las entradas en voz alta (término + traducción)."""
    return sum(len(PALABRA.findall(f"{e.get('word', '')} {e.get('translation', '')}")) for e in entradas)


def _comprension(lineas, palabras):
    if not lineas:
        return None
    pct = (lineas - palabras) / lineas * 100
    return 100.0 if pct >= 99.445 else round(max(pct, 0), 2)


def _leer(ruta, defecto):
    if not os.path.exists(ruta):
        return defecto
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def etiqueta(titulo_tanda):
    """'73b° Tanda (Navidad)' -> 'navidad'; '25a° Tanda (Gala)' -> 'gala'; '73c° Tanda (Fin de Año)' -> 'fin'."""
    t = titulo_tanda.lower()
    if 'navidad' in t:
        return 'navidad'
    if 'fin de año' in t:
        return 'fin'
    if 'gala' in t:
        return 'gala'
    return None


def generar():
    tandas = F.cargar_tandas()
    ciclos = {c['anio']: c for c in _leer(CICLOS, [])}
    manifest = _leer(os.path.join(DATA, 'manifest.json'), {})
    tipos = {m['title']: m for m in (manifest.get('all') or {}).get('movieList', [])}
    pelis = {}

    def datos(titulo):
        if titulo not in pelis:
            pelis[titulo] = _leer(os.path.join(DATA, 'pelis', f'{titulo}.json'), None)
        return pelis[titulo]

    salida_tandas = []
    for t in tandas:
        items = []
        for i in t['items']:
            texto, titulo = (i, i) if isinstance(i, str) else (i['texto'], i['titulo'])
            codigos = None if isinstance(i, str) else i.get('episodios')
            d = datos(titulo) or {}
            m = tipos.get(titulo, {})
            if d.get('episodes'):
                eps = [e for e in d['episodes'] if not codigos or e['code'] in codigos]
                palabras = sum(e['count'] for e in eps)
                lineas = sum(e['dialogues'] for e in eps)
                # nivel de lo que entró en la tanda: promedio de sus episodios ponderado por líneas
                con_nivel = [e for e in eps if e.get('levelDetail')]
                peso = sum(max(e['dialogues'], 1) for e in con_nivel)
                nivel = N.nivel_texto(sum(e['levelDetail']['puntaje'] * max(e['dialogues'], 1) for e in con_nivel) / peso) if peso else None
                duracion = sum(e.get('duration') or 0 for e in eps) or None
                estimada = any(e.get('durationEstimated') or not e.get('duration') for e in eps)
                texto_vocab = palabras_texto([v for e in eps for v in e.get('vocabulary') or []])
            else:
                palabras, lineas, nivel = d.get('count', 0), d.get('dialogues', 0), d.get('level')
                duracion, estimada = d.get('duration'), bool(d.get('durationEstimated') or not d.get('duration'))
                texto_vocab = palabras_texto(d.get('vocabulary') or [])
            items.append({
                'texto': texto, 'titulo': titulo, 'tipo': m.get('type', 'movie'),
                'poster': m.get('posterUrl'), 'nivel': nivel, 'clasificacion': m.get('rating'),
                'episodios': len(codigos) if codigos else None,
                'palabras': palabras, 'lineas': lineas, 'comprension': _comprension(lineas, palabras),
                'duracion': duracion, 'duracionEstimada': estimada,
                '_texto': texto_vocab,
            })
        palabras = sum(x['palabras'] for x in items)
        lineas = sum(x['lineas'] for x in items)
        duracion = sum(x['duracion'] or 0 for x in items)
        fecha = T.fecha_de(t['date'])
        numero, parte = numero_y_parte(t['title'])
        texto = sum(x.pop('_texto') for x in items)
        salida_tandas.append({
            'id': t['id'], 'title': t['title'], 'numero': numero, 'parte': parte,
            'date': t['date'], 'fecha': fecha.isoformat(),
            # el ciclo es el año de la fecha, salvo que la tanda diga otro ("ciclo": "2023" para una
            # tanda de comienzos de enero que cierra el ciclo anterior)
            'anio': str(t.get('ciclo') or fecha.year), 'etiqueta': etiqueta(t['title']),
            'palabras': palabras, 'lineas': lineas, 'comprension': _comprension(lineas, palabras),
            'duracion': duracion, 'duracionEstimada': any(x['duracionEstimada'] for x in items),
            'dosSesiones': duracion > limite_sesion(fecha),
            'limiteSesion': limite_sesion(fecha),
            '_texto': texto,
            'items': items,
        })

    # Días de repaso: hasta la siguiente tanda con otro número. La última tanda aún no tiene
    # siguiente: se supone que llega a la separación típica (mediana) después de su última parte.
    inicios, finales = {}, {}
    for t in salida_tandas:
        inicios.setdefault(t['numero'], date.fromisoformat(t['fecha']))
        finales[t['numero']] = date.fromisoformat(t['fecha'])
    orden = sorted(inicios)
    brechas = sorted((inicios[b] - inicios[a]).days for a, b in zip(orden, orden[1:]))
    tipica = brechas[len(brechas) // 2] if brechas else 15
    siguiente = {a: inicios[b] for a, b in zip(orden, orden[1:])}
    if orden:
        siguiente[orden[-1]] = finales[orden[-1]] + timedelta(days=tipica)
    for t in salida_tandas:
        dias = (siguiente[t['numero']] - date.fromisoformat(t['fecha'])).days
        lectura = t.pop('_texto') / VELOCIDAD_LECTURA
        t['ingles'] = {
            'vista': t['duracion'],
            'repaso': round(lectura * max(dias, 1)),
            'revision': t['duracion'],
            'diasRepaso': max(dias, 1),
        }

    anios = sorted({t['anio'] for t in salida_tandas})
    salida_ciclos = []
    for a in anios:
        del_anio = [t for t in salida_tandas if t['anio'] == a]
        palabras = sum(t['palabras'] for t in del_anio)
        lineas = sum(t['lineas'] for t in del_anio)
        c = ciclos.get(a, {})
        salida_ciclos.append({
            'anio': a, 'nombre': c.get('nombre', ''), 'descripcion': c.get('descripcion', ''),
            'tandas': len({t['numero'] for t in del_anio}), 'titulos': sum(len(t['items']) for t in del_anio),
            'palabras': palabras, 'lineas': lineas, 'comprension': _comprension(lineas, palabras),
            'duracion': sum(t['duracion'] for t in del_anio),
            'minutosIngles': sum(t['ingles']['vista'] + t['ingles']['repaso'] + t['ingles']['revision'] for t in del_anio),
        })

    with open(os.path.join(DATA, 'timeline.json'), 'w', encoding='utf-8') as f:
        json.dump({'ciclos': salida_ciclos, 'tandas': salida_tandas}, f, ensure_ascii=False, indent=2)
    return salida_ciclos, salida_tandas


def main():
    F.cargar()  # valida fichas y tandas antes de escribir
    ciclos, tandas = generar()
    print(f"Línea de tiempo: {len({t['numero'] for t in tandas})} tandas ({len(tandas)} con sus partes) en {len(ciclos)} ciclos.")
    for c in ciclos:
        miles = lambda n: f'{n:,}'.replace(',', '.')  # noqa: E731
        print(f"  {c['anio']} {c['nombre']}: {c['tandas']} tandas, {miles(c['palabras'])} palabras, "
              f"{miles(c['lineas'])} líneas, comprensión {c['comprension']} %, "
              f"{c['duracion'] // 60} h {c['duracion'] % 60} min de contenido, "
              f"{c['minutosIngles'] // 60} h de inglés en total")
    estimadas = sorted({x['titulo'] for t in tandas for x in t['items'] if x['duracionEstimada']})
    if estimadas:
        print('Duración estimada con los subtítulos (falta en la ficha):', ', '.join(estimadas))


if __name__ == '__main__':
    main()
