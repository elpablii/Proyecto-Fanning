"""Conteo de líneas de diálogo y de palabras/frases.

Implementa al pie de la letra:
  - Metodología/Criterio de conteo de líneas de diálogo.txt
  - Metodología/Criterio de conteo de palabras y frases.txt
Si cambia un criterio, se cambia aquí y en el txt correspondiente.
"""
import re
import unicodedata
from collections import defaultdict


def normalizar(texto):
    t = unicodedata.normalize('NFKD', texto.lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


def leer_lineas(ruta_pdf):
    import fitz  # PyMuPDF
    with fitz.open(ruta_pdf) as doc:
        return ''.join(p.get_text() for p in doc).split('\n')


def clave_episodio(temporada, episodio, especial=False):
    return f'SP{episodio:02d}' if especial else f'S{temporada:02d}E{episodio:02d}'


ROMANOS = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10}


def _saltar_titulo(lineas, patron_titulo):
    """Índice de la primera línea después del título (punto 4 / punto 3)."""
    i = 0
    while i < len(lineas) and not lineas[i].strip():
        i += 1
    if i < len(lineas) and re.match(patron_titulo, lineas[i].strip(), re.I):
        while i < len(lineas) and lineas[i].strip():
            i += 1
    return i


# ---------------------------------------------------------------- DIÁLOGOS

TIEMPO = re.compile(r'^\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}')
INDICE = re.compile(r'^\d+$')
ETIQUETA = re.compile(r'<[^>]*>|\{\\[^}]*\}')
TITULO_DIALOGO = r'(Dialogues?|Gui[oó]n|Script)\b'

# Punto 3.c: créditos y avisos de quien generó/sincronizó los subtítulos.
# Se evalúan sobre la línea sin etiquetas de formato.
CREDITO = re.compile(
    r'font:\s*0{2,}'
    r'|subtitles?\s+(generated|by|ripped|downloaded)'
    r'|^\W*subtitles?\s*:'
    r'|^\W*(re)?sync(ed)?\b\s*(,|by|and|&|corrected|to\b)'
    r'|corrected\s+by'
    r'|opensubtitles|open-subtitles|addic7ed|addic0ed|subscene|playships\.eu|sub-way\.fr'
    r'|subbercafe|sfile\.ydy|kaboomskull'
    r'|do you want subtitles for any video'
    r'|^\W*the big bang theory\s+\d+x\d+',
    re.I)

MARCADOR = [
    # Un episodio puede venir en dos mitades: S02EP06A / S02EP06B -> mismo episodio.
    (re.compile(r'^S(\d+)\s*EP\s*0*(\d+)[AB]?\b', re.I), 'se'),
    (re.compile(r'^EP\s*0*(\d+)[AB]?\b', re.I), 'e'),
    (re.compile(r'^Special\s+Episodes?\s*0*(\d+)?', re.I), 'sp'),
    (re.compile(r'^Episode\s+0*(\d+)\s*:', re.I), 'e'),
]


def _marcador(texto, temporada):
    for patron, tipo in MARCADOR:
        m = patron.match(texto)
        if not m:
            continue
        if tipo == 'se':
            return clave_episodio(int(m.group(1)), int(m.group(2)))
        if tipo == 'e':
            return clave_episodio(temporada, int(m.group(1)))
        return clave_episodio(0, int(m.group(1) or 1), especial=True)
    return None


def _cuenta(texto):
    """Punto 2: cuenta si tiene al menos una letra o un número (sin etiquetas)."""
    t = ETIQUETA.sub('', texto)
    return any(c.isalpha() or c.isdigit() for c in t)


def _sigue_subtitulo(lineas, k):
    """True si después de la línea k viene un subtítulo nuevo (índice + tiempos)."""
    siguientes = [l for l in lineas[k + 1:k + 8] if l][:2]
    if siguientes and TIEMPO.match(siguientes[0]):
        return True
    return len(siguientes) == 2 and INDICE.match(siguientes[0]) and TIEMPO.match(siguientes[1])


def contar_dialogos(lineas, es_serie=False, temporada=1, episodio_fijo=None, detalle=False):
    """Devuelve {'total', 'episodios': {clave: n}, 'creditos', 'sin_tiempos', 'registro'}.

    - Cuenta SUBTÍTULOS (punto 1): lo que va bajo cada número de orden + línea de
      tiempos vale 1, aunque ocupe varios renglones o lo corte un salto de página.
    - Un subtítulo cuenta si algún renglón tiene una letra o un número (punto 2);
      no cuentan los créditos de subtítulos ni los que solo tienen símbolos (punto 3).
    - En series separa por marcador S0XEPX / EPX (punto 7); el marcador no cuenta.
      Un marcador solo se reconoce fuera del texto de un subtítulo: antes del
      primero, o al final de uno cuando lo que sigue es un subtítulo nuevo.
      Nunca justo después de una línea de tiempos.
    - registro (si detalle=True): (línea original, texto, motivo, episodio, número
      de subtítulo) por cada renglón de texto.
    """
    i = _saltar_titulo(lineas, TITULO_DIALOGO)
    lineas = [l.strip() for l in lineas[i:]]
    n = len(lineas)
    registro = []

    episodios = defaultdict(int)
    actual = episodio_fijo if (es_serie and episodio_fijo) else ('' if not es_serie else None)
    creditos = 0
    vio_tiempo = False
    numero = None       # número de orden del subtítulo en curso
    bloque = None       # renglones (k, texto) del subtítulo en curso; None = fuera de un subtítulo
    sueltas = []        # renglones de texto fuera de cualquier subtítulo

    def cerrar_bloque():
        nonlocal bloque, creditos
        if bloque is None:
            return
        if not any(_cuenta(l) for _, l in bloque):
            motivo = 'no cuenta: sin letras ni números'
        elif any(CREDITO.search(ETIQUETA.sub('', l)) for _, l in bloque):
            motivo = 'no cuenta: crédito de subtítulos'
            creditos += 1
        else:
            motivo = 'cuenta'
            episodios[actual] += 1
        if detalle:
            registro.extend((i + k, l, motivo, actual, numero) for k, l in bloque)
        bloque = None

    numero_siguiente = None
    for k, s in enumerate(lineas):
        if not s:
            continue
        if TIEMPO.match(s):
            cerrar_bloque()
            vio_tiempo = True
            numero, numero_siguiente = numero_siguiente, None
            bloque = []
            continue
        if INDICE.match(s):
            j = k + 1
            while j < n and not lineas[j]:
                j += 1
            if j < n and TIEMPO.match(lineas[j]):
                numero_siguiente = int(s)
                continue
        if es_serie and not episodio_fijo:
            anterior = next((l for l in reversed(lineas[:k]) if l), '')
            if not TIEMPO.match(anterior) and (bloque is None or _sigue_subtitulo(lineas, k)):
                clave = _marcador(s, temporada)
                if clave:
                    cerrar_bloque()
                    actual = clave
                    continue
        if bloque is None:
            sueltas.append(s)
            if detalle:
                registro.append((i + k, s, 'no cuenta: fuera de un subtítulo', actual, None))
            continue
        bloque.append((k, s))
    cerrar_bloque()

    episodios = {k: v for k, v in episodios.items() if v}
    return {
        'registro': registro,
        'total': sum(episodios.values()),
        'episodios': episodios,
        'creditos': creditos,
        'sin_tiempos': not vio_tiempo,
        'sueltas': sueltas,
    }


# ---------------------------------------------------------------- VOCABULARIO

TITULO_VOCAB = r'(Unknown words|Palabras desconocidas|Mots et phrases|Vocabulary)\b'
CABECERA_EPISODIO = re.compile(
    r'^(?P<sp>Special\s+)?Episodes?(\s+0*(?P<n>\d+))?\s*(:|\(|$)'
    r'|^Part\s+(?P<rom>[IVX]+)\s*\(\s*\d+\s*words',
    re.I)
CUENTA_CABECERA = re.compile(r'words?\s*/\s*phrases?|words\)', re.I)


def episodios_de_nombre(nombre_archivo):
    """Lista ordenada de claves que anuncia el nombre del PDF.

    Ej: 'Kim Possible (S02EP30 & S03EP1)' -> [S02E30, S03E01]
        'Euphoria (S01EP8 & Special Episodes 1-2)' -> [S01E08, SP01, SP02]
        'Gambito de Dama (EP 4-7 + Special Episode)' -> [S01E04..S01E07, SP01]
    """
    claves = []
    temporada = 1
    patron = re.compile(
        r'(?P<sp>Special\s+Episodes?)(\s*(?P<a1>\d+)(\s*-\s*(?P<b1>\d+))?)?'
        r'|(S(?P<s>\d+)\s*)?EP\s*(?P<a>\d+)(\s*-\s*(?P<b>\d+))?',
        re.I)
    for m in patron.finditer(nombre_archivo):
        if m.group('sp'):
            a = int(m.group('a1') or 1)
            b = int(m.group('b1') or a)
            claves += [clave_episodio(0, e, especial=True) for e in range(a, b + 1)]
        else:
            if m.group('s'):
                temporada = int(m.group('s'))
            a = int(m.group('a'))
            b = int(m.group('b') or a)
            claves += [clave_episodio(temporada, e) for e in range(a, b + 1)]
    return claves


def _numero(clave):
    return int(clave[-2:])


def leer_vocabulario(lineas, nombre_archivo=''):
    """Devuelve (entradas, avisos).

    entradas: lista de dicts {'episodio', 'word', 'translation'} en el orden del PDF.
    - El título y los subtítulos de episodio no cuentan (puntos 3 y 5.2).
    - Una entrada puede ocupar varios renglones (punto 2), incluido el caso de
      la frase partida antes de los ':' (renglón siguiente en minúscula con ':').
    """
    i = _saltar_titulo(lineas, TITULO_VOCAB)
    esperados = episodios_de_nombre(nombre_archivo)
    puntero = 0
    avisos = []

    entradas = []  # [episodio, [renglones]]
    episodio = esperados[0] if len(esperados) == 1 else None
    cabecera = None
    ultimo_sin_dos_puntos = None

    def asignar(m, texto):
        nonlocal puntero
        if m.group('rom'):
            return clave_episodio(1, ROMANOS[m.group('rom').upper()])
        especial = bool(m.group('sp'))
        n = int(m.group('n')) if m.group('n') else 1
        if not esperados:
            return clave_episodio(1, n, especial=especial)
        for j in range(puntero, len(esperados)):
            c = esperados[j]
            if (especial and c.startswith('SP')) or (not especial and _numero(c) == n):
                puntero = j + 1
                return c
        avisos.append(f'cabecera sin episodio esperado: "{texto[:60]}"')
        return clave_episodio(1, n, especial=especial)

    lineas = [l.strip() for l in lineas[i:]]
    for k, s in enumerate(lineas):
        if not s:
            cabecera = None
            continue
        if cabecera is not None and ':' not in s and not CUENTA_CABECERA.search(cabecera):
            cabecera += ' ' + s  # subtítulo de episodio partido en dos renglones
            continue
        cabecera = None
        m = CABECERA_EPISODIO.match(s)
        if m:
            episodio = asignar(m, s)
            cabecera = s
            ultimo_sin_dos_puntos = None
            continue
        if ':' in s and s[0].islower() and ultimo_sin_dos_puntos is not None:
            # Punto 2, caso especial: el renglón anterior era el comienzo de esta entrada.
            comienzo = entradas[ultimo_sin_dos_puntos][1].pop()
            entradas.append([episodio, [comienzo, s]])
            ultimo_sin_dos_puntos = None
            continue
        if ':' in s and not s[0].islower():
            entradas.append([episodio, [s]])
            ultimo_sin_dos_puntos = None
        else:
            if not entradas:
                avisos.append(f'renglón antes de la primera entrada: "{s[:60]}"')
                continue
            entradas[-1][1].append(s)
            ultimo_sin_dos_puntos = len(entradas) - 1 if ':' not in s else None

    salida = []
    for ep, renglones in entradas:
        texto = ' '.join(renglones)
        texto = re.sub(r'\s+', ' ', texto)
        palabra, _, traduccion = texto.partition(':')
        salida.append({'episodio': ep, 'word': palabra.strip(), 'translation': traduccion.strip()})
    if len(esperados) > 1 and any(e['episodio'] is None for e in salida):
        avisos.append('entradas sin episodio (el PDF anuncia varios episodios pero no tiene cabeceras)')
    return salida, avisos


def clave_repetida(entrada):
    """Punto 4.1: mismo sentido = misma palabra/frase (con su nota) y misma traducción."""
    return (normalizar(entrada['word']), normalizar(entrada['translation']))


def sin_repetidas(entradas):
    vistas = set()
    unicas, repetidas = [], []
    for e in entradas:
        k = clave_repetida(e)
        if k in vistas:
            repetidas.append(e)
        else:
            vistas.add(k)
            unicas.append(e)
    return unicas, repetidas


def cifras_de_cabecera(lineas):
    """Números '(N words/phrases)' escritos a mano en el PDF (solo referencia)."""
    texto = ' '.join(l.strip() for l in lineas)
    return [int(x) for x in re.findall(r'(\d+)\s*words?\s*/\s*phrases', texto, re.I)]
