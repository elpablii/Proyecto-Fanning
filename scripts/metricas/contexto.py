"""La frase original: la línea de los subtítulos donde apareció cada entrada del vocabulario.

Por cada palabra o frase anotada de un título se busca la línea de sus subtítulos que la contiene
(en las series, solo en su episodio), sin importar mayúsculas, puntuación ni saltos de línea. Si no
está tal cual, se prueba con la palabra conjugada o en plural, solo con las terminaciones regulares
("Rely" encuentra "relied", pero no "relax"). La nota del final ("(verbo)", ver etiquetas.py) no se
busca, y "someone"/"(something)" valen por cualquier palabra (salvo "Something's up").

El vocabulario se anota en el orden en que aparece, así que si una palabra se dice varias veces se
toma la vez que cae entre sus vecinas del vocabulario (ver _alinear). Y si una frase no está tal
cual porque se anotó con otras palabras ("Maddy was with her friends" por "She was with her
friends"), se busca ahí una línea parecida. Lo que no aparece (erratas, resúmenes) queda sin frase.

Lo usa actualizar.py (que ya lee los diálogos) y deja data/contextos.json:
  {título: [[episodio | null, palabra, segundo | null, texto, inicio | null, fin | null, veces, (1)], ...]}
inicio y fin: dónde está la entrada dentro del texto (para resaltarla en la página).
veces: cuántas veces aparece en el título (o en el episodio). El 1 del final: es una línea parecida.
diccionario.py lo junta con cada palabra del diccionario (data/diccionario_frases.json).

Solo, relee todos los diálogos (tarda unos minutos):  python fanning.py contextos
"""
import bisect
import json
import os
import re
import sys
import unicodedata
from difflib import SequenceMatcher

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteo import normalizar  # noqa: E402
from ranking import lema  # noqa: E402
import etiquetas as E  # noqa: E402

COMODINES = {'someone', 'somebody', 'something', 'sb', 'sth', 'one'}
HUECO = r'(?:\w+ ){0,3}?'  # hasta tres palabras cualesquiera


def _flexible(t):
    """La palabra con sus terminaciones regulares: rely -> relies, relied, relying; split -> splitting."""
    if t[-1] == 'e':
        return re.escape(t[:-1]) + '(?:e|es|ed|ing|er|ers|est|en)'
    if t[-1] == 'y':
        return re.escape(t[:-1]) + '(?:y|ys|yed|ying|ies|ied|ier|iest|ily)'
    return re.escape(t) + f'(?:{re.escape(t[-1])}?(?:ed|ing|er|ers|est|en)|s|es)?'


def _patron(palabra, flexible):
    """Regex de la entrada sobre el texto normalizado (" palabra palabra "), o None si no hay qué buscar."""
    limpia, _, _ = E.separar(palabra)
    partes = []
    for trozo in re.split(r'(\([^)]*\))', limpia):
        if trozo.startswith('('):
            partes.append(HUECO)
            continue
        tokens = normalizar(trozo).split()
        for k, t in enumerate(tokens):
            # En "Something's up" la palabra es "something", no un comodín.
            if t in COMODINES and tokens[k + 1:k + 2] != ['s']:
                partes.append(HUECO)
            elif flexible and len(t) >= 4:
                partes.append(_flexible(t) + ' ')
            else:
                partes.append(re.escape(t) + ' ')
    if all(p == HUECO for p in partes):
        return None
    return re.compile(' ' + ''.join(partes))


def _con_mapa(texto):
    """normalizar(texto), con la posición en texto de cada letra (para saber dónde quedó la entrada)."""
    letras, mapa = [], []
    for i, c in enumerate(texto):
        for d in unicodedata.normalize('NFKD', c.lower()):
            if unicodedata.combining(d):
                continue
            if 'a' <= d <= 'z' or '0' <= d <= '9':
                letras.append(d)
                mapa.append(i)
            elif letras and letras[-1] != ' ':
                letras.append(' ')
                mapa.append(i)
    while letras and letras[-1] == ' ':
        letras.pop()
        mapa.pop()
    return ''.join(letras), mapa


def _tramo(texto, patron):
    """[inicio, fin] de la entrada dentro del texto original, o [None, None]."""
    norm, mapa = _con_mapa(texto)
    m = patron.search(' ' + norm + ' ')
    # El patrón empieza y termina con un espacio que no es parte de la entrada.
    return [mapa[m.start()], mapa[m.end() - 3] + 1] if m else [None, None]


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

    def subtitulo(self, pos):
        """El índice del subtítulo donde cae una posición del texto."""
        return bisect.bisect_right(self.inicios, pos) - 1

    def linea(self, desde, hasta):
        """El segundo y el texto original de los subtítulos desde..hasta (inclusive)."""
        segundo = self.subs[desde][1]
        texto = ' '.join(' '.join(s[2] for s in self.subs[desde:hasta + 1]).split())
        return round(segundo) if segundo is not None else None, texto

    def resultado(self, m, patron, veces):
        segundo, texto = self.linea(self.subtitulo(m.start()), self.subtitulo(max(m.end() - 2, m.start())))
        return [segundo, texto, *_tramo(texto, patron), veces]

    def parecida(self, palabra, lo, hi):
        """Una línea casi igual a la frase anotada entre las posiciones lo y hi ("Maddy was with her
        friends" -> "She was with her friends"), o None. Ver _PARECIDA."""
        buscada = _tokens_frase(palabra)
        if len(buscada) < 3:
            return None
        lemas = [lema(t) for t in buscada]
        claves = {x for x in lemas if len(x) >= 4} or set(lemas)
        desde, hasta = max(self.subtitulo(lo) - 1, 0), min(self.subtitulo(hi) + 2, len(self.subs))
        mejor = None
        for i in range(desde, hasta):
            # Solo donde aparece alguna palabra de la frase; la línea puede seguir en los dos siguientes.
            if not claves & {lema(t) for t in normalizar(self.subs[i][2]).split()}:
                continue
            for j in range(max(i - 1, desde), min(i + 1, hasta - 1) + 1):
                for k in range(j, min(j + 3, hasta)):
                    segundo, texto = self.linea(j, k)
                    norm, mapa = _con_mapa(texto)
                    tokens, cortes, pos = [], [], 0
                    for t in norm.split(' '):
                        tokens.append(lema(t))
                        cortes.append((pos, pos + len(t)))
                        pos += len(t) + 1
                    bloques = [b for b in SequenceMatcher(None, lemas, tokens, autojunk=False).get_matching_blocks() if b.size]
                    iguales = sum(b.size for b in bloques)
                    if not bloques or iguales < 3 or iguales < _PARECIDA * len(lemas):
                        continue
                    primero, ultimo = bloques[0].b, bloques[-1].b + bloques[-1].size - 1
                    # Las frases cortas se parecen a muchas: tienen que estar enteras y casi seguidas.
                    corta = len(lemas) < 5
                    if corta and iguales < len(lemas):
                        continue
                    if ultimo - primero + 1 > len(lemas) + (1 if corta else 3):
                        continue  # las palabras están desparramadas: no es la misma frase
                    puntaje = (iguales / len(lemas), -(k - j))
                    if mejor is None or puntaje > mejor[0]:
                        mejor = (puntaje, [segundo, texto, mapa[cortes[primero][0]], mapa[cortes[ultimo][1] - 1] + 1, 1, 1])
        return mejor and mejor[1]


# Cuánto de la frase anotada tiene que estar, en orden, para tomar una línea como la misma frase.
_PARECIDA = 0.7


def _tokens_frase(palabra):
    """Las palabras de una entrada, sin la nota, sin lo que va entre paréntesis y sin comodines."""
    limpia, _, _ = E.separar(palabra)
    limpia = re.sub(r'\([^)]*\)', ' ', limpia)
    return [t for t in normalizar(limpia).split() if t not in COMODINES]


def _creciente(pares):
    """De [(clave, posición)] en el orden del vocabulario, la subsecuencia más larga con las
    posiciones en aumento (las anclas que respetan el orden de la película)."""
    colas, previo, finales = [], {}, []
    for n, (_, pos) in enumerate(pares):
        k = bisect.bisect_left(colas, pos)
        previo[n] = finales[k - 1] if k else None
        if k == len(colas):
            colas.append(pos)
            finales.append(n)
        else:
            colas[k] = pos
            finales[k] = n
    salida, n = [], finales[-1] if finales else None
    while n is not None:
        salida.append(pares[n])
        n = previo[n]
    return salida[::-1]


def _alinear(donde, palabras):
    """Las líneas de un grupo de entradas (un título o un episodio), en el orden del vocabulario.

    El vocabulario se anota en el orden en que aparece (lo primero que se dice, al comienzo), así
    que las entradas que se dicen una sola vez sirven de anclas: si una palabra se dice varias
    veces, se toma la vez que cae entre el ancla anterior y la siguiente, y si no aparece tal cual
    se busca ahí una línea parecida."""
    apariciones = {}
    for n, palabra in enumerate(palabras):
        for flexible in (False, True):
            patron = _patron(palabra, flexible)
            encontradas = list(patron.finditer(donde.texto)) if patron else []
            if encontradas:
                apariciones[n] = (patron, encontradas)
                break
    anclas = _creciente([(n, a[1][0].start()) for n, a in sorted(apariciones.items()) if len(a[1]) == 1])
    orden = [n for n, _ in anclas]
    salida = []
    for n, palabra in enumerate(palabras):
        k = bisect.bisect_left(orden, n)
        lo = anclas[k - 1][1] if k else 0
        hi = anclas[k][1] if k < len(anclas) else len(donde.texto)
        if anclas and k < len(anclas) and orden[k] == n:
            lo = hi  # es un ancla
        if n in apariciones:
            patron, encontradas = apariciones[n]
            m = min(encontradas, key=lambda m: max(lo - m.start(), m.start() - hi, 0))
            salida.append(donde.resultado(m, patron, len(encontradas)))
        else:
            salida.append(donde.parecida(palabra, lo, hi))
    return salida


def contextos(subtitulos, entradas):
    """subtitulos: [(episodio, inicio, fin, texto)]; entradas: [(episodio | None, palabra)] en el
    orden del vocabulario. Devuelve [[episodio, palabra, segundo, texto, inicio, fin, veces]] de las
    que se encontraron; las halladas por parecido llevan un 1 más al final."""
    subs = [(s[0], s[1], s[3]) for s in subtitulos]
    por_ep = {}
    for s in subs:
        por_ep.setdefault(s[0], []).append(s)
    grupos = {}
    for n, (episodio, palabra) in enumerate(entradas):
        grupos.setdefault(episodio, []).append(n)
    hallado = [None] * len(entradas)
    for episodio, indices in grupos.items():
        # En las series, solo en su episodio: la misma frase en otro sería otra escena.
        lista = subs if episodio is None else por_ep.get(episodio)
        if not lista:
            continue
        for n, h in zip(indices, _alinear(_Texto(lista), [entradas[n][1] for n in indices])):
            hallado[n] = h
    return [[e, p] + h for (e, p), h in zip(entradas, hallado) if h]


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
