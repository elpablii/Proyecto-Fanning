"""Etiquetas del Diccionario Fanning: la nota entre paréntesis del final de cada entrada, ordenada.

En los vocabularios, la nota del final ("Rely (verbo)", "Can I crash here? (pregunta no literal)")
mezcla varias cosas: la clase de palabra, qué tan literal es la traducción, el registro, el idioma
y a veces el contexto ("en música", "en algunos contextos"). Aquí se separa en:

  - etiquetas: claves fijas ("verbo", "frase-no-literal"...). Sus nombres y definiciones están en
    fanning-dashboard/src/lib/etiquetas.ts (el filtro del diccionario y el glosario de la
    Constitución); si se agrega una aquí, se agrega allá.
  - contexto: lo que sobra y no es una etiqueta ("en música", "alusivo a una persona").

Si la nota no se reconoce en absoluto ("Hold on (someone)"), no se toca: es parte de la frase.

  python scripts/metricas/etiquetas.py   -> las notas que no se reconocen, para revisar
"""
import re

from conteo import normalizar

# Frases de la nota -> etiquetas, de la más larga a la más corta (se sacan de la nota al encontrarlas).
FRASES = [
    ('frase parcialmente no literal', ['parcialmente-no-literal']),
    ('parcialmente no literal', ['parcialmente-no-literal']),
    ('frase no literal', ['frase-no-literal']),
    ('pregunta no literal', ['pregunta', 'no-literal']),
    ('traduccion no literal', ['no-literal']),
    ('forma no literal', ['no-literal']),
    ('no literal', ['no-literal']),
    ('traduccion aproximada', ['traduccion-aproximada']),
    ('traduccion cercana', ['traduccion-aproximada']),
    ('semi literal', ['parcialmente-no-literal']),
    ('literal', ['literal']),
    ('verbo frasal', ['verbo-frasal']),
    ('phrasal verb', ['verbo-frasal']),
    ('sustantivo comun', ['sustantivo']),
    ('sustantivo propio', ['sustantivo']),
    ('adjetivo comparativo', ['adjetivo']),
    ('adjetivo superlativo', ['adjetivo']),
    ('verbo', ['verbo']),
    ('vebro', ['verbo']),
    ('sustantivo', ['sustantivo']),
    ('suatantivo', ['sustantivo']),
    ('adjetivo', ['adjetivo']),
    ('adverbio', ['adverbio']),
    ('interjeccion', ['interjeccion']),
    ('preposicion', ['preposicion']),
    ('pregunta', ['pregunta']),
    ('expresion', ['expresion']),
    ('modismo', ['expresion']),
    ('refran', ['expresion']),
    ('acotacion', ['acotacion']),
    ('frase', []),
    ('sigla', ['sigla']),
    ('informal', ['informal']),
    ('jerga', ['informal']),
    ('coloquial', ['informal']),
    ('despectivo', ['despectivo']),
    ('despectiva', ['despectivo']),
    ('vulgar', ['despectivo']),
    ('en ingles antiguo', ['ingles-antiguo']),
    ('ingles antiguo', ['ingles-antiguo']),
    ('en ingles britanico', ['ingles-britanico']),
    ('ingles britanico', ['ingles-britanico']),
]

# Otros idiomas: "en francés", "frase en alemán", "expresión en latín"...
IDIOMAS = {
    'frances': 'frances', 'aleman': 'aleman', 'latin': 'latin', 'italiano': 'italiano', 'espanol': 'espanol',
    'japones': 'japones', 'ruso': 'ruso', 'chino': 'chino', 'portugues': 'portugues', 'hebreo': 'hebreo',
    'yiddish': 'yiddish', 'griego': 'griego', 'coreano': 'coreano', 'arabe': 'arabe', 'hawaiano': 'hawaiano',
}

# Lo que queda y empieza así es contexto ("en música", "alusivo a una persona", "para esta película").
CONTEXTO = re.compile(r'^(en|no|alusivo|alusiva|aparte|usado|usada|abreviatura|significado|para|como|referido|'
                      r'referida|referente|de|sobre|al|a|denotativo|connotativo|si|parecido|plural|pasado|'
                      r'abreviacion|contra|donde|palabra|apodo)\b')

# Una sigla entre paréntesis ("Emergency room (ER)", "IRA") es parte de la entrada, no una nota.
SIGLA = re.compile(r'^[A-Z][A-Z0-9&./ ]{0,7}[A-Z0-9.]$')

ORDEN = [
    'verbo', 'verbo-frasal', 'sustantivo', 'adjetivo', 'adverbio', 'interjeccion', 'preposicion',
    'pregunta', 'expresion', 'acotacion',
    'frase-no-literal', 'parcialmente-no-literal', 'no-literal', 'literal', 'traduccion-aproximada',
    'sigla', 'informal', 'despectivo', 'ingles-antiguo', 'ingles-britanico',
] + [f'idioma-{v}' for v in IDIOMAS.values()]

NOTA_FINAL = re.compile(r'\s*\(([^()]*)\)\s*$')


def leer_nota(nota):
    """("en sentido informal" | "verbo en música" ...) -> (etiquetas, contexto | None), o None si
    no se reconoce nada (entonces la nota es parte de la frase)."""
    resto = ' ' + normalizar(nota) + ' '
    original = nota.strip()
    etiquetas, alguna = [], False
    for idioma, clave in IDIOMAS.items():
        if re.search(rf' (en )?{idioma} ', resto) or re.search(rf'^ (frase|expresion|palabra) en {idioma} ', resto):
            etiquetas.append(f'idioma-{clave}')
            resto = re.sub(rf' (en )?{idioma} ', ' ', resto)
    if re.search(r' ingles y ', resto):  # "inglés y francés": el inglés no suma nada
        resto = resto.replace(' ingles y ', ' ')
    for frase, claves in FRASES:
        patron = f' {frase} '
        if patron in resto:
            etiquetas += claves
            alguna = True
            resto = resto.replace(patron, ' ')
    # Lo que sobra: conectores sueltos o contexto.
    resto = re.sub(r'^\s*(y|con|e)\s+|\s+(y|con|e)\s*$', ' ', resto).strip()
    resto = re.sub(r'\b(y|con)\b\s*$', '', resto).strip()
    if resto in ('en', 'a', 'de'):
        resto = ''
    if not etiquetas and not alguna and not (resto and CONTEXTO.match(resto)):
        return None
    contexto = None
    if resto:
        # El contexto se muestra como se escribió, sin las palabras que ya son etiquetas.
        contexto = _recortar(original, resto)
    unicas = sorted(set(etiquetas), key=lambda e: ORDEN.index(e) if e in ORDEN else len(ORDEN))
    # "No literal" sobra si ya dice cuánto ("frase no literal", "parcialmente no literal").
    if 'no-literal' in unicas and ({'frase-no-literal', 'parcialmente-no-literal'} & set(unicas)):
        unicas.remove('no-literal')
    return unicas, contexto


def _recortar(original, resto):
    """El pedazo de la nota original que corresponde a `resto` (normalizado), con sus tildes."""
    palabras = original.split()
    buscadas = resto.split()
    for i in range(len(palabras)):
        trozo = palabras[i:i + len(buscadas)]
        if normalizar(' '.join(trozo)).split() == buscadas:
            return ' '.join(trozo)
    return resto


def separar(palabra):
    """"Rely (verbo)" -> ("Rely", ["verbo"], None). Solo mira la nota del final."""
    m = NOTA_FINAL.search(palabra)
    if not m:
        return palabra.strip(), [], None
    if SIGLA.match(m.group(1).strip()):
        return palabra.strip(), ['sigla'], None
    leida = leer_nota(m.group(1))
    if leida is None:
        return palabra.strip(), [], None
    etiquetas, contexto = leida
    return palabra[:m.start()].strip(), etiquetas, contexto


def main():
    import json
    import os
    from collections import Counter
    from rutas import DATA
    d = json.load(open(os.path.join(DATA, 'diccionario.json'), encoding='utf-8'))
    sin, contextos, etiquetas = Counter(), Counter(), Counter()
    for p in [p[0] for p in d['palabras']] + [o.split(':')[0] for p in d['palabras'] for o in (p[5] if len(p) > 5 and p[5] else [])]:
        m = NOTA_FINAL.search(p)
        if not m or SIGLA.match(m.group(1).strip()):
            continue
        leida = leer_nota(m.group(1))
        if leida is None:
            sin[m.group(1)] += 1
        else:
            etiquetas.update(leida[0])
            if leida[1]:
                contextos[leida[1]] += 1
    print('Etiquetas:', etiquetas.most_common())
    print(f'\nContextos ({len(contextos)}):', contextos.most_common(60))
    print(f'\nNo reconocidas ({len(sin)}):', sin.most_common(80))


if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    main()
