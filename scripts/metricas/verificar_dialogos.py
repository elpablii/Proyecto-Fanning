"""Muestra, página por página, qué subtítulos de un PDF de diálogos cuentan y cuáles no.

Sirve para comparar el conteo automático con un conteo a mano.

Uso:
  python scripts/metricas/verificar_dialogos.py "Diálogos/.../archivo.pdf" [--serie] [--temporada N]

Escribe scripts/metricas/verificaciones/<archivo>.txt con:
  - el total y el total por página (un subtítulo se cuenta en la página donde empieza);
  - cada subtítulo con su número y su marca:  [+] cuenta   [-] no cuenta (y el motivo).
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteo import contar_dialogos  # noqa: E402
from rutas import absoluta  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('--serie', action='store_true')
    ap.add_argument('--temporada', type=int, default=1)
    args = ap.parse_args()

    import fitz
    ruta = args.pdf if os.path.isabs(args.pdf) else absoluta(args.pdf.replace('\\', '/'))
    with fitz.open(ruta) as doc:
        textos = [p.get_text() for p in doc]
    lineas = ''.join(textos).split('\n')
    pagina_de = []  # número de página de cada línea
    for n, t in enumerate(textos, 1):
        pagina_de += [n] * t.count('\n')
    pagina_de += [len(textos)] * (len(lineas) - len(pagina_de))

    r = contar_dialogos(lineas, es_serie=args.serie, temporada=args.temporada, detalle=True)

    # agrupar los renglones por subtítulo, en orden
    subtitulos = []
    for k, texto, motivo, ep, numero in r['registro']:
        ultimo = subtitulos[-1] if subtitulos else None
        if ultimo and numero is not None and ultimo['numero'] == numero and ultimo['motivo'] == motivo:
            ultimo['renglones'].append(texto)
        else:
            subtitulos.append({'numero': numero, 'motivo': motivo, 'episodio': ep,
                               'pagina': pagina_de[k], 'renglones': [texto]})

    por_pagina = {}
    for sub in subtitulos:
        if sub['motivo'] == 'cuenta':
            por_pagina[sub['pagina']] = por_pagina.get(sub['pagina'], 0) + 1

    salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verificaciones',
                          os.path.splitext(os.path.basename(ruta))[0] + '.txt')
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, 'w', encoding='utf-8') as f:
        f.write(f'Archivo: {os.path.basename(ruta)}\n')
        f.write(f'TOTAL DE LÍNEAS DE DIÁLOGO (subtítulos): {r["total"]}\n')
        if args.serie:
            for ep, v in sorted(r['episodios'].items()):
                f.write(f'  {ep}: {v}\n')
        no_cuentan = [s for s in subtitulos if s['motivo'] != 'cuenta']
        f.write(f'Subtítulos o renglones que NO cuentan: {len(no_cuentan)}\n')
        for s in no_cuentan:
            f.write(f'  pág. {s["pagina"]}, subtítulo {s["numero"]}: "{" / ".join(s["renglones"])}"  ({s["motivo"]})\n')

        f.write('\nTOTAL POR PÁGINA (acumulado entre paréntesis)\n')
        acum = 0
        for p in range(1, len(textos) + 1):
            acum += por_pagina.get(p, 0)
            f.write(f'  pág. {p}: {por_pagina.get(p, 0)} ({acum})\n')

        f.write('\nDETALLE  [+] cuenta  [-] no cuenta   (número de subtítulo: renglones)\n')
        pag = None
        for s in subtitulos:
            if s['pagina'] != pag:
                pag = s['pagina']
                f.write(f'\n--- página {pag} ---\n')
            marca = '+' if s['motivo'] == 'cuenta' else '-'
            extra = '' if s['motivo'] == 'cuenta' else f'   <- {s["motivo"]}'
            f.write(f'[{marca}] {s["numero"]}: {" / ".join(s["renglones"])}{extra}\n')
    print(f'Total: {r["total"]} líneas de diálogo (subtítulos). Detalle en {os.path.relpath(salida)}')


if __name__ == '__main__':
    main()
