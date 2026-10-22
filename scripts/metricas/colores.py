"""El color de cada título, sacado de su póster: la página tiñe la ficha con él.

Por cada ficha baja el póster en tamaño chico (w92) y busca el tono más vivo: agrupa los píxeles
por tono, sin contar los grises ni los casi negros, y se queda con el grupo de más peso (cada píxel
pesa según su saturación y su brillo). Después ajusta ese color a un brillo y una saturación que se
lean bien sobre el fondo de la página. Si el póster es casi todo gris, el título queda sin color y
la página usa el de siempre.

A veces el tono que más pesa no es el que identifica al título (en Barbie gana el cielo celeste del
póster, no el rosa). Para eso la ficha puede traer su propio color, que manda sobre el calculado:
  "color": "#e0479e"

Queda en fanning-dashboard/data/colores.json: {"Barbie": {"poster": "https://…", "color": "#e0479e"}}.
Solo se recalcula un título si cambió su póster (si reemplazas una imagen propia por otra con el
mismo nombre, usa --rehacer).

  python fanning.py colores [--rehacer]
"""
import argparse
import colorsys
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from rutas import DATA  # noqa: E402

COLORES = os.path.join(DATA, 'colores.json')
TONOS = 24


def color_del_poster(datos):
    import fitz  # PyMuPDF (ya se usa para los PDFs)
    pix = fitz.Pixmap(datos)
    while pix.width > 200:  # una imagen propia puede venir en tamaño grande; basta con una chica
        pix.shrink(1)
    if pix.n < 3:
        return None
    paso = pix.n
    muestras = pix.samples
    grupos = [[0.0, 0.0, 0.0, 0.0] for _ in range(TONOS)]   # peso, r, g, b
    for i in range(0, len(muestras) - paso + 1, paso):
        r, g, b = muestras[i] / 255, muestras[i + 1] / 255, muestras[i + 2] / 255
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        if v < 0.18 or s < 0.25:
            continue
        peso = s * v
        gr = grupos[int(h * TONOS) % TONOS]
        gr[0] += peso
        gr[1] += r * peso
        gr[2] += g * peso
        gr[3] += b * peso
    total = len(muestras) / paso
    mejor = max(grupos, key=lambda x: x[0])
    # Si lo vivo es muy poco (pósters en blanco y negro), mejor no teñir.
    if mejor[0] < total * 0.01:
        return None
    r, g, b = (mejor[k] / mejor[0] for k in (1, 2, 3))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = min(0.66, max(0.56, l))
    s = min(0.85, max(0.5, s))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return '#{:02x}{:02x}{:02x}'.format(round(r * 255), round(g * 255), round(b * 255))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--rehacer', action='store_true', help='vuelve a calcular todos los colores')
    args = ap.parse_args()

    viejos = {} if args.rehacer or not os.path.exists(COLORES) else json.load(open(COLORES, encoding='utf-8'))
    fichas = F.cargar(estricto=False)[0]
    salida, nuevos, sin_color, fallas = {}, 0, [], []
    for ficha in sorted(fichas, key=lambda f: f['titulo']):
        poster = ficha.get('poster')
        if ficha.get('color'):
            salida[ficha['titulo']] = {'poster': poster, 'color': ficha['color'], 'manual': True}
            continue
        if not poster:
            continue
        previo = viejos.get(ficha['titulo'])
        if previo and previo.get('poster') == poster and not previo.get('manual'):
            salida[ficha['titulo']] = previo
            continue
        local = F.imagen_local(poster)
        if local and not os.path.isfile(local):
            continue
        chico = poster.replace('/w500/', '/w92/').replace('/original/', '/w92/')
        try:
            if local:
                with open(local, 'rb') as a:
                    color = color_del_poster(a.read())
            else:
                with urllib.request.urlopen(chico, timeout=30) as r:
                    color = color_del_poster(r.read())
        except Exception as e:
            fallas.append(f'{ficha["titulo"]}: {e}')
            if previo:
                salida[ficha['titulo']] = previo
            continue
        salida[ficha['titulo']] = {'poster': poster, 'color': color}
        nuevos += 1
        if not color:
            sin_color.append(ficha['titulo'])

    with open(COLORES, 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)
    print(f'Colores: {len(salida)} títulos ({nuevos} calculados ahora).')
    if sin_color:
        print(f'Sin color (póster casi gris): {", ".join(sin_color)}')
    if fallas:
        print('No se pudieron bajar:')
        for x in fallas:
            print('  -', x)


if __name__ == '__main__':
    main()
