"""Genera fanning-dashboard/data/diccionario.json (el Diccionario Fanning de la página).

Junta el vocabulario de todos los títulos (data/pelis/*.json, ya generados) en una sola lista
de palabras. Agrupa igual que el ranking de palabras más repetidas del inicio (ver ranking.py),
así las cifras coinciden: la suma de las veces de todas las palabras es el total de palabras y
frases del inicio. Por cada palabra guarda en qué títulos apareció y en qué tanda se aprendió
por primera vez (contenido/tandas.json; en las series, la tanda de ese episodio).

Formato: {"titulos": [{title, type}], "tandas": {número: [fecha, ciclo]},
          "palabras": [[palabra, traducción, veces, [índices de títulos], tanda | null, [otras formas]?]]}

Lo corre `python fanning.py actualizar`; solo, es rápido: python scripts/metricas/diccionario.py
"""
import json
import os
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import DATA  # noqa: E402
import fichas as F  # noqa: E402
import ranking  # noqa: E402
import tandas as T  # noqa: E402
from linea_tiempo import numero_y_parte  # noqa: E402


def _leer(ruta, defecto):
    if not os.path.exists(ruta):
        return defecto
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def primeras_tandas():
    """{(título, código de episodio o None): (número de tanda, fecha, ciclo)} de la primera vez.
    La clave con None es la del título entero (películas, o series sin episodios anotados)."""
    primera = {}
    for t in F.cargar_tandas():
        fecha = T.fecha_de(t['date'])
        numero, _ = numero_y_parte(t['title'])
        dato = (numero, fecha.isoformat(), str(t.get('ciclo') or fecha.year))
        for i in t['items']:
            titulo = i if isinstance(i, str) else i['titulo']
            codigos = None if isinstance(i, str) else i.get('episodios')
            for c in codigos or [None]:
                primera.setdefault((titulo, c), dato)
    return primera


def generar():
    manifest = _leer(os.path.join(DATA, 'manifest.json'), {})
    lista = (manifest.get('all') or {}).get('movieList', [])
    primera = primeras_tandas()

    titulos, items, cuando = [], [], []
    for n, m in enumerate(lista):
        titulos.append({'title': m['title'], 'type': m.get('type', 'movie')})
        datos = _leer(os.path.join(DATA, 'pelis', f"{m['title']}.json"), {})
        if datos.get('episodes'):
            entradas = [(v, e['code']) for e in datos['episodes'] for v in e['vocabulary']]
        else:
            entradas = [(v, None) for v in datos.get('vocabulary') or []]
        for v, codigo in entradas:
            items.append({**v, 'n': n})
            # Sin tanda (un título que aún no tiene fecha): solo se sabe su año.
            cuando.append(primera.get((m['title'], codigo)) or primera.get((m['title'], None))
                          or (None, None, (m.get('years') or [None])[0]))

    grupos = ranking.agrupar(items)
    por_grupo = defaultdict(list)
    for k, g in enumerate(grupos):
        por_grupo[g].append(k)

    palabras, tandas = [], {}
    for idx in por_grupo.values():
        palabra, traduccion = ranking.representante(Counter(items[k]['word'] for k in idx),
                                                    Counter(items[k]['translation'] for k in idx))
        # La primera vez: la tanda más antigua; las palabras sin tanda van al final.
        orden = sorted(idx, key=lambda k: (cuando[k][0] is None, cuando[k][0] or 0, items[k]['n']))
        tanda, fecha, anio = cuando[orden[0]]  # anio sin tanda: no se guarda (no hay fecha que mostrar)
        vistos = []
        for k in orden:
            if items[k]['n'] not in vistos:
                vistos.append(items[k]['n'])
        # Otras formas y traducciones con que quedó anotada (sin repetir la que se muestra).
        otras = sorted({f"{items[k]['word']}: {items[k]['translation']}" for k in idx} - {f'{palabra}: {traduccion}'})
        if tanda is not None:
            tandas[tanda] = [fecha, anio]
        # En listas y no en objetos: son ~28.000 palabras y así el archivo pesa bastante menos.
        palabras.append([palabra, traduccion, len(idx), vistos, tanda] + ([otras] if otras else []))
    palabras.sort(key=lambda p: ranking.base(p[0]))

    salida = {'titulos': titulos, 'tandas': tandas, 'palabras': palabras}
    with open(os.path.join(DATA, 'diccionario.json'), 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))
    return salida


def main():
    F.cargar()  # valida fichas y tandas antes de escribir
    d = generar()
    total = sum(p[2] for p in d['palabras'])
    miles = lambda n: f'{n:,}'.replace(',', '.')  # noqa: E731
    print(f"Diccionario: {miles(len(d['palabras']))} palabras distintas ({miles(total)} anotaciones) "
          f"en {len(d['titulos'])} títulos.")


if __name__ == '__main__':
    main()
