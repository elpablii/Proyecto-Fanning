"""Nivel de inglés (Marco Común Europeo, A1–C2) de películas, series y episodios.

Criterio completo en Metodología/Criterio de nivel de inglés (MCER).txt.

Fuentes de niveles (datos_nivel/, ver su README.md):
  - CEFR-J Vocabulary Profile 1.5 (A1–B2), Tono Laboratory, TUFS.
  - Octanove Vocabulary Profile C1/C2 1.0 (CC BY-SA 4.0), Octanove Labs.
  - Para palabras que no están en esas listas: su frecuencia (wordfreq, que incluye
    subtítulos de películas). Los cortes salen de la frecuencia típica de cada nivel
    en las propias listas. Una palabra casi inexistente (jerga difícil de identificar)
    va a C2.

Escala numérica: A1 = 1, A2 = 2, B1 = 3, B2 = 4, C1 = 5, C2 = 6.
"""
import csv
import os
import re
from collections import Counter
from functools import lru_cache

import simplemma
from wordfreq import zipf_frequency

NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datos_nivel')

# Frecuencia (escala Zipf, 0–7) mínima de cada nivel: punto medio entre las medianas
# de las palabras de ese nivel en las listas (A1 5,02 · A2 4,57 · B1 4,19 · B2 3,75 · C1 3,31 · C2 2,88).
CORTES_FRECUENCIA = [(4.80, 1), (4.38, 2), (3.97, 3), (3.53, 4), (3.10, 5)]
FRECUENCIA_JERGA = 1.5  # por debajo de esto la palabra casi no existe en ningún corpus: C2

POS_NOTA = {'verbo': 'verb', 'sustantivo': 'noun', 'adjetivo': 'adjective', 'adverbio': 'adverb'}
POS_FUNCION = {'determiner', 'pronoun', 'preposition', 'conjunction', 'modal auxiliary', 'be-verb',
               'do-verb', 'have-verb', 'number', 'interjection', 'infinitive-to'}
PARTICULAS = {'up', 'down', 'out', 'off', 'in', 'on', 'over', 'away', 'back', 'through', 'around',
              'along', 'by', 'into', 'about', 'after', 'apart', 'across', 'ahead', 'aside', 'forward'}
CONTRACCIONES = re.compile(r"(?i)['’](s|re|ll|ve|d|m|t)$|n['’]t$")
TOKEN = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)*")

# Notas de los vocabularios que indican dificultad extra
NOTA_IDIOMA = re.compile(r'no literal|expresi|modismo|frase hecha|idiom|figurad|sentido figurado', re.I)
NOTA_JERGA = re.compile(r'jerga|slang|coloquial|vulgar|despectiv|argot|malsonante', re.I)
NOTA_VARIANTE = re.compile(r'brit[aá]nic|antiguo|arcaic|escoc|irland|australian|de [eé]poca', re.I)
NOTA_ACOTACION = re.compile(r'acotaci', re.I)


# ------------------------------------------------------------------ listas

def _cargar_listas():
    por_pos, cualquiera, frases = {}, {}, {}
    for archivo in ('cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv'):
        with open(os.path.join(CARPETA, archivo), encoding='utf-8') as f:
            for fila in csv.DictReader(f):
                n = NIVELES.index(fila['CEFR'].strip()) + 1
                for palabra in fila['headword'].split('/'):
                    p = palabra.strip().lower()
                    if not p:
                        continue
                    if ' ' in p:
                        frases[p] = min(n, frases.get(p, 9))
                        continue
                    clave = (p, fila['pos'].strip())
                    por_pos[clave] = min(n, por_pos.get(clave, 9))
                    cualquiera[p] = min(n, cualquiera.get(p, 9))
    funcion = {p for (p, pos) in por_pos if pos in POS_FUNCION}
    return por_pos, cualquiera, frases, funcion


POR_POS, CUALQUIERA, FRASES, FUNCION = _cargar_listas()


def nivel_texto(n):
    """4.0 -> 'B2'; 4.5 -> 'B2-C1' (entre dos niveles)."""
    if n is None:
        return None
    n = max(1.0, min(6.0, n))
    base = int(n + 1e-9)
    resto = n - base
    if base >= 6 or resto < 0.35:
        return NIVELES[min(base, 6) - 1]
    if resto > 0.65:
        return NIVELES[base]
    return f'{NIVELES[base - 1]}-{NIVELES[base]}'


# ------------------------------------------------------------------ palabras

def _base(token):
    t = token.lower().replace('’', "'")
    return CONTRACCIONES.sub('', t) if "'" in t else t


@lru_cache(maxsize=None)
def nivel_palabra(palabra, pos=None):
    """(nivel 1–6, fuente) de una palabra suelta. Fuente: 'lista', 'frecuencia' o 'jerga'."""
    t = _base(palabra)
    if not t:
        return None, None
    lema = simplemma.lemmatize(t, lang='en')
    for c in (t, lema):
        if pos and (c, pos) in POR_POS:
            return POR_POS[(c, pos)], 'lista'
    for c in (t, lema):
        if c in CUALQUIERA:
            return CUALQUIERA[c], 'lista'
    z = max(zipf_frequency(t, 'en'), zipf_frequency(lema, 'en'))
    if z < CORTES_FRECUENCIA[-1][0] and len(lema) >= 7:
        # palabra compuesta poco común hecha de dos conocidas (stepsisters, buttonholes):
        # el nivel de su parte más difícil, un escalón más, como máximo C1
        for i in range(3, len(lema) - 2):
            a, b = lema[:i], lema[i:]
            if a in CUALQUIERA and (b in CUALQUIERA or simplemma.lemmatize(b, lang='en') in CUALQUIERA):
                nb = CUALQUIERA.get(b) or CUALQUIERA[simplemma.lemmatize(b, lang='en')]
                return min(max(CUALQUIERA[a], nb) + 1, 5), 'compuesta'
    if z < FRECUENCIA_JERGA:
        return 6, 'jerga'
    for corte, n in CORTES_FRECUENCIA:
        if z >= corte:
            return n, 'frecuencia'
    return 6, 'frecuencia'


def es_funcion(token):
    return _base(token) in FUNCION


@lru_cache(maxsize=None)
def es_extranjera(token):
    """Palabra que no existe en inglés pero sí en francés o español (frases en otro idioma)."""
    t = _base(token)
    if t in CUALQUIERA:
        return False
    en = zipf_frequency(t, 'en')
    # al menos 100 veces más común en francés o español que en inglés (2 puntos en la escala Zipf)
    return en < 3.5 and max(zipf_frequency(t, 'fr'), zipf_frequency(t, 'es')) - en >= 2.0


def es_nombre_propio(token, posicion):
    """Palabra con mayúscula a mitad de frase que no está en las listas (Sheldon, Hogwarts…)."""
    t = _base(token)
    return (posicion > 0 and token[:1].isupper() and t not in CUALQUIERA
            and simplemma.lemmatize(t, lang='en') not in CUALQUIERA)


# ------------------------------------------------------------------ entradas del vocabulario

def nivel_entrada(palabra):
    """Nivel de una entrada del vocabulario ("Rely (verbo)", "Break down", "I was really into you (no literal)").

    Devuelve {'nivel': 1–6, 'peso': 1.0 (0.3 si es acotación), 'motivos': [...]} o None si no hay palabras.
    """
    notas = ' '.join(re.findall(r'\(([^)]*)\)', palabra))
    termino = re.sub(r'\s*\([^)]*\)', ' ', palabra)
    pos = next((POS_NOTA[k] for k in POS_NOTA if k in notas.lower()), None)
    tokens = TOKEN.findall(termino)
    if not tokens:
        return None
    motivos = []

    frase = ' '.join(simplemma.lemmatize(_base(t), lang='en') for t in tokens)
    if frase in FRASES or ' '.join(_base(t) for t in tokens) in FRASES:
        n = FRASES.get(frase) or FRASES[' '.join(_base(t) for t in tokens)]
        motivos.append('expresión de la lista')
    else:
        tokens_ingles = [(t, i) for i, t in enumerate(tokens) if not es_extranjera(t)]
        if len(tokens_ingles) <= len(tokens) / 2:
            return None  # entrada (casi toda) en otro idioma: no cuenta para el nivel de inglés
        utiles = [(t, i) for t, i in tokens_ingles if not es_funcion(t) and not es_nombre_propio(t, i)]
        candidatos = utiles or tokens_ingles
        niveles = [(nivel_palabra(t, pos if len(tokens) == 1 else None), t) for t, _ in candidatos]
        niveles = [((n, f), t) for (n, f), t in niveles if n]
        if not niveles:
            return None
        (n, fuente), dificil = max(niveles, key=lambda x: x[0][0])
        motivos.append(f'"{dificil}" {NIVELES[n - 1]} ({fuente})')
        # phrasal verb que no está en la lista: el significado no se deduce de las partes
        # (los diccionarios MCER ubican los phrasal verbs en B1–B2 aunque el verbo sea A1)
        if 2 <= len(tokens) <= 4 and _base(tokens[1]) in PARTICULAS and (_base(tokens[0]), 'verb') in POR_POS:
            n = max(n + 1, 4)
            motivos.append('phrasal verb')
    # Las notas suben el nivel: un escalón, y como mínimo el nivel indicado,
    # porque lo difícil es el sentido y no las palabras (que pueden ser A1).
    if NOTA_IDIOMA.search(notas):
        n = max(n + 1, 4)
        motivos.append('no literal')
    if NOTA_JERGA.search(notas):
        n = max(n + 1, 5)
        motivos.append('jerga')
    if NOTA_VARIANTE.search(notas):
        n = max(n + 1, 4)
        motivos.append('variante (británico/antiguo)')
    return {'nivel': min(n, 6), 'peso': 0.3 if NOTA_ACOTACION.search(notas) else 1.0, 'motivos': motivos}


# ------------------------------------------------------------------ diálogos

def perfil_dialogos(subtitulos):
    """Perfil de un conjunto de subtítulos [(episodio, inicio, fin, texto)].

    - cobertura95: nivel que hay que alcanzar para conocer el 95 % de las palabras.
    - ppm: palabras por minuto mientras se habla.
    """
    cuenta = Counter()
    palabras, segundos = 0, 0.0
    for _, inicio, fin, texto in subtitulos:
        tokens = TOKEN.findall(texto)
        palabras += len(tokens)
        if inicio is not None and fin is not None and 0 < fin - inicio < 30:
            segundos += fin - inicio
        for i, t in enumerate(tokens):
            if es_nombre_propio(t, i) or es_extranjera(t):
                continue
            n, _ = nivel_palabra(t)
            if n:
                cuenta[n] += 1
    total = sum(cuenta.values())
    if not total:
        return None
    acumulado, anterior = 0.0, 0.0
    cobertura = 6.0
    for n in range(1, 7):
        acumulado += cuenta[n] / total
        if acumulado >= 0.95:
            # interpolación dentro del nivel que cruza el 95 %
            # (n − 1 niveles completos + la parte del nivel n que hace falta); como mínimo A1 = 1
            cobertura = max(1.0, (n - 1) + (0.95 - anterior) / max(acumulado - anterior, 1e-9))
            break
        anterior = acumulado
    return {
        'cobertura95': round(cobertura, 2),
        'ppm': round(palabras / (segundos / 60), 1) if segundos else None,
        'distribucion': {NIVELES[n - 1]: round(cuenta[n] / total * 100, 1) for n in range(1, 7)},
        'palabras': palabras,
    }


# ------------------------------------------------------------------ temas

def _cargar_temas():
    import json
    with open(os.path.join(CARPETA, 'temas.json'), encoding='utf-8') as f:
        datos = json.load(f)
    temas = {}
    for k, v in datos.items():
        if not isinstance(v, dict):
            continue
        palabras = {p.lower() for p in v['palabras']}
        temas[k] = {'nombre': v['nombre'], 'sube_nivel': v.get('sube_nivel', True),
                    'palabras': {p for p in palabras if ' ' not in p},
                    # frases ("flight attendant"), como lemas separados por espacios
                    'frases': {' '.join(_lema(t) for t in TOKEN.findall(p)) for p in palabras if ' ' in p},
                    'notas': [n.lower() for n in v['notas']]}
    return temas


@lru_cache(maxsize=None)
def _lema(token):
    return simplemma.lemmatize(_base(token), lang='en')


TEMAS = _cargar_temas()
# Palabras distintas del área que hacen falta para que cuente entera: con menos, una sola palabra
# repetida ("sire" en Super Mario, "stash" en Minecraft) bastaba para dar un tema que el título no tiene.
MIN_DISTINTAS = 4


def _coincidencias(tokens, tema):
    """Palabras y frases del área presentes en una lista de tokens (sin las que van con mayúscula)."""
    lemas = [None if t[:1].isupper() else _lema(t) for t in tokens]
    bases = [None if t[:1].isupper() else _base(t) for t in tokens]
    hallado = [l if l in tema['palabras'] else b for l, b in zip(lemas, bases)
               if l and (l in tema['palabras'] or b in tema['palabras'])]
    if tema['frases']:
        texto = ' ' + ' '.join(l or '_' for l in lemas) + ' '
        hallado += [f for f in tema['frases'] for _ in range(texto.count(' ' + f + ' '))]
    return hallado


def perfil_temas(palabras_vocabulario, subtitulos):
    """Presencia de cada área (temas.json) en el vocabulario y en los diálogos.

    - dialogos_por_mil: palabras del área por cada 1.000 palabras de diálogo.
    - vocabulario_pct: % de entradas del vocabulario que son del área (por sus palabras o por la nota).
    - distintas: palabras distintas del área encontradas (en diálogos y vocabulario).
    """
    total_dialogo = 0
    en_dialogo = Counter()
    distintas = {k: set() for k in TEMAS}
    for _, _, _, texto in subtitulos:
        # con mayúscula suele ser un nombre ("Sue" no es el verbo "sue")
        tokens = TOKEN.findall(texto)
        total_dialogo += len(tokens)
        for k, tema in TEMAS.items():
            hallado = _coincidencias(tokens, tema)
            en_dialogo[k] += len(hallado)
            distintas[k].update(hallado)
    en_vocabulario = Counter()
    for palabra in palabras_vocabulario:
        notas = ' '.join(re.findall(r'\(([^)]*)\)', palabra)).lower()
        tokens = [t.lower() for t in TOKEN.findall(re.sub(r'\([^)]*\)', ' ', palabra))]
        for k, tema in TEMAS.items():
            hallado = _coincidencias(tokens, tema)
            if not hallado and any(re.search(r'\b' + re.escape(n), notas) for n in tema['notas']):
                hallado = [palabra.lower()]  # la nota la cuenta para el área
            if hallado:
                en_vocabulario[k] += 1
                distintas[k].update(hallado)
    n_vocab = max(len(palabras_vocabulario), 1)
    return {k: {'dialogos_por_mil': round(en_dialogo[k] / total_dialogo * 1000, 2) if total_dialogo else 0.0,
                'vocabulario_pct': round(en_vocabulario[k] / n_vocab * 100, 1),
                'distintas': len(distintas[k])}
            for k in TEMAS}


def intensidad_tema(x):
    """Peso de un área en el título; se reduce si aparecen pocas palabras distintas del área."""
    return (x['dialogos_por_mil'] / 2 + x['vocabulario_pct'] / 5) * min(1.0, x['distintas'] / MIN_DISTINTAS)


# ------------------------------------------------------------------ nivel final

PESOS = {'vocabulario': 0.60, 'dialogos': 0.25, 'temas': 0.15}
DENSIDAD_TIPICA = 7.6   # entradas del vocabulario por cada 100 líneas (mediana de todos los títulos)
PPM_TIPICA = 155.0      # palabras por minuto (mediana de todos los títulos)


def _limitar(x, minimo, maximo):
    return max(minimo, min(maximo, x))


def calcular_nivel(palabras_vocabulario, lineas_dialogo, subtitulos):
    """Nivel MCER de un título o episodio.

    palabras_vocabulario: entradas ("Rely (verbo)", …); lineas_dialogo: total de líneas;
    subtitulos: [(episodio, inicio, fin, texto)].
    Devuelve el nivel (texto y número) y el detalle de cada señal.
    """
    entradas = [e for e in (nivel_entrada(p) for p in palabras_vocabulario) if e]
    if not entradas:
        return None
    peso = sum(e['peso'] for e in entradas)
    media = sum(e['nivel'] * e['peso'] for e in entradas) / peso
    distribucion = Counter()
    for e in entradas:
        distribucion[NIVELES[e['nivel'] - 1]] += e['peso']
    densidad = len(palabras_vocabulario) / lineas_dialogo * 100 if lineas_dialogo else None
    # 1) Vocabulario: nivel medio de lo que no se entendió, más (o menos) según cuánto hay por línea
    ajuste_densidad = _limitar((densidad - DENSIDAD_TIPICA) / 8, -0.5, 0.5) if densidad is not None else 0.0
    v = media + ajuste_densidad

    # 2) Diálogos: nivel que cubre el 95 % de las palabras, más (o menos) según la velocidad del habla
    pd = perfil_dialogos(subtitulos) if subtitulos else None
    if pd:
        ajuste_ppm = _limitar((pd['ppm'] - PPM_TIPICA) / 80, -0.5, 0.5) if pd['ppm'] else 0.0
        d = pd['cobertura95'] + ajuste_ppm
    else:
        d = v  # sin diálogos, esta señal no cambia el resultado

    # 3) Temas: solo suben el nivel si hay un área especializada (un tema cotidiano no lo baja).
    #    Las áreas con sube_nivel false (música, cocina…) describen el título pero no cambian el nivel.
    pt = perfil_temas(palabras_vocabulario, subtitulos or [])
    intensidad = {k: intensidad_tema(x) for k, x in pt.items()}
    principal = max((k for k in intensidad if TEMAS[k]['sube_nivel']), key=intensidad.get)
    t = max(media, 3 + _limitar(intensidad[principal], 0, 3))

    total = PESOS['vocabulario'] * v + PESOS['dialogos'] * d + PESOS['temas'] * t
    total = _limitar(total, 1, 6)
    # Destacados: hasta dos áreas; la segunda solo si no es un tema menor al lado de la primera
    orden = sorted(intensidad, key=intensidad.get, reverse=True)
    minimo = max(0.5, 0.15 * intensidad[orden[0]])
    destacados = [TEMAS[k]['nombre'] for k in orden[:2] if intensidad[k] >= minimo]
    return {
        'nivel': nivel_texto(total),
        'puntaje': round(total, 2),
        'senales': {'vocabulario': round(v, 2), 'dialogos': round(d, 2), 'temas': round(t, 2)},
        'vocabulario': {'distribucion': {k: round(distribucion[k] / peso * 100, 1) for k in NIVELES},
                        'densidad': round(densidad, 1) if densidad is not None else None},
        'dialogos': {'cobertura95': pd['cobertura95'], 'ppm': pd['ppm']} if pd else None,
        'temas': destacados,
    }
