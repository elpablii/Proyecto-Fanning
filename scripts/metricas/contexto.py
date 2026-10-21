"""La frase original: la línea de los subtítulos donde apareció cada entrada del vocabulario.

Por cada palabra o frase anotada de un título se busca la primera línea de sus subtítulos que la
contiene (en las series, solo en su episodio), sin importar mayúsculas, puntuación ni saltos de
línea. Si no está tal cual, se prueba con la palabra
conjugada ("Rely" encuentra "relied"). Lo que no aparece (erratas, frases resumidas) queda sin
frase. La nota del final ("(verbo)", ver etiquetas.py) no se busca, y "someone"/"(something)"
valen por cualquier palabra.

Lo usa actualizar.py (que ya lee los diálogos) y deja data/contextos.json:
  {título: [[episodio | null, palabra, segundo | null, texto], ...]}
diccionario.py lo junta con cada palabra del diccionario (data/diccionario_frases.json).

Solo, relee todos los diálogos (tarda unos minutos):  python fanning.py contextos
"""
import bisect
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteo import normalizar  # noqa: E402
import etiquetas as E  # noqa: E402

COMODINES = {'someone', 'somebody', 'something', 'sb', 'sth', 'one'}
HUECO = r'(?:\w+ ){0,3}?'  # hasta tres palabras cualesquiera


def _patron(palabra, flexible):
    """Regex de la entrada sobre el texto normalizado (" palabra palabra "), o None si no hay qué buscar."""
    limpia, _, _ = E.separar(palabra)
    partes = []
    for trozo in re.split(r'(\([^)]*\))', limpia):
        if trozo.startswith('('):
            partes.append(HUECO)
            continue
        for t in normalizar(trozo).split():
            if t in COMODINES:
                partes.append(HUECO)
            elif flexible and len(t) >= 4:
                raiz = t[:-1] if t[-1] in 'ey' else t
                partes.append(re.escape(raiz) + r'[a-z]{0,4} ')
            else:
                partes.append(re.escape(t) + ' ')
    if all(p == HUECO for p in partes):
        return None
    return re.compile(' ' + ''.join(partes))


class _Texto:
    """Los subtítulos de un título (o de un episodio) en un solo texto normalizado, para buscar rápido."""

    def __init__(self, subs):
        self.subs, self.inicios, trozos, pos = subs, [], [], 0
        for _, _, texto in subs:
            t = ' ' + normalizar(texto)
            self.inicios.append(pos)
            trozos.append(t)
            pos += len(t)
        self.texto = ''.join(trozos) + ' '

    def buscar(self, patron):
        m = patron.search(self.texto)
        if not m:
            return None
        desde = bisect.bisect_right(self.inicios, m.start()) - 1
        hasta = bisect.bisect_right(self.inicios, max(m.end() - 2, m.start())) - 1
        segundo = self.subs[desde][1]
        texto = ' '.join(s[2] for s in self.subs[desde:hasta + 1])
        return [round(segundo) if segundo is not None else None, ' '.join(texto.split())]


def contextos(subtitulos, entradas):
    """subtitulos: [(episodio, inicio, fin, texto)]; entradas: [(episodio | None, palabra)].
    Devuelve [[episodio, palabra, segundo, texto]] de las que se encontraron."""
    subs = [(s[0], s[1], s[3]) for s in subtitulos]
    todo = _Texto(subs)
    por_ep = {}
    for s in subs:
        por_ep.setdefault(s[0], []).append(s)
    textos = {k: _Texto(v) for k, v in por_ep.items()}
    salida = []
    for episodio, palabra in entradas:
        # En las series, solo en su episodio: la misma frase en otro sería otra escena.
        donde = todo if episodio is None else textos.get(episodio)
        if donde is None:
            continue
        for flexible in (False, True):
            patron = _patron(palabra, flexible)
            hallado = patron and donde.buscar(patron)
            if hallado:
                salida.append([episodio, palabra] + hallado)
                break
    return salida


def main():
    """Relee los diálogos de todas las fichas y rehace data/contextos.json con el vocabulario de data/pelis/."""
    import fichas as F
    from conteo import contar_dialogos, leer_lineas
    from rutas import DATA, absoluta
    salida, encontradas, total = {}, 0, 0
    for ficha in F.cargar(estricto=False)[0]:
        ruta = os.path.join(DATA, 'pelis', f"{ficha['titulo']}.json")
        if not os.path.exists(ruta):
            continue
        print('  leyendo', ficha['titulo'])
        subtitulos = []
        for d in ficha['pdfs'].get('dialogos', []):
            r_pdf = F.ruta_dialogo(d)
            m = re.search(r'Season\s*(\d+)', r_pdf, re.I)
            subtitulos += contar_dialogos(leer_lineas(absoluta(r_pdf)), es_serie=ficha['tipo'] == 'serie',
                                          temporada=int(m.group(1)) if m else 1, episodio_fijo=F.episodio_fijo(d),
                                          con_textos=True)['subtitulos']
        datos = json.load(open(ruta, encoding='utf-8'))
        if datos.get('episodes'):
            entradas = [(e['code'], v['word']) for e in datos['episodes'] for v in e['vocabulary']]
        else:
            entradas = [(None, v['word']) for v in datos.get('vocabulary') or []]
        salida[ficha['titulo']] = contextos(subtitulos, entradas)
        encontradas += len(salida[ficha['titulo']])
        total += len(entradas)
    escribir(salida)
    print(f'\nFrase original encontrada para {encontradas:,} de {total:,} entradas '
          f'({encontradas / max(total, 1):.1%}).'.replace(',', '.'))


def escribir(salida):
    from rutas import DATA
    with open(os.path.join(DATA, 'contextos.json'), 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
