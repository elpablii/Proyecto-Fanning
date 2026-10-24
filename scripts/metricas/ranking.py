"""Palabras más repetidas (global y por año).

Una "palabra" del ranking agrupa las entradas del vocabulario que son la misma
palabra o frase en inglés con un significado relacionado:
  - se compara la forma de la palabra: sin la nota entre paréntesis, sin la
    puntuación, sin "a"/"an"/"the"/"to" al comienzo y sin las terminaciones
    regulares ("Settle down!", "Settle down"; "Tenant", "Tenants", "A tenant";
    "Clutter", "Cluttered" tienen la misma forma);
  - entre esas, se juntan las que tienen traducciones relacionadas (comparten
    al menos una palabra de contenido, aunque cambie la terminación:
    "inquilino" / "inquilinos", "desesperación" / "desesperarse"), aunque una
    sea verbo y la otra sustantivo: van en el mismo sentido. Si el significado
    cambia ("Play (verbo): jugar" / "Play (sustantivo): obra"), quedan separadas;
  - contenido/agrupaciones.json corrige a mano lo que esto no ve: junta
    sinónimos que no comparten palabras ("Kick in: hacer efecto" / "Kick in:
    entrar en acción") y separa lo que se juntó por parecido ("separar").
Cada entrada del vocabulario suma 1 (una por película, o una por episodio en
las series).
"""
import re
from collections import Counter, defaultdict

from conteo import normalizar

VACIAS = {
    'algo', 'alguien', 'como', 'con', 'contra', 'del', 'desde', 'donde', 'entre', 'esta', 'este', 'esto',
    'hacia', 'hasta', 'para', 'pero', 'por', 'que', 'sin', 'sobre', 'una', 'uno', 'unos', 'unas', 'los',
    'las', 'les', 'muy', 'mas', 'ser', 'estar', 'hacer', 'tener', 'cosa', 'cosas', 'manera', 'forma',
    'sentido', 'tipo', 'alguna', 'alguno', 'cuando', 'todo', 'toda', 'todos', 'todas',
}


# Palabras de tres letras que no dicen nada del significado (las de contenido, como "ron" o "mal", sí cuentan).
CORTAS = {'son', 'era', 'fue', 'hay', 'tan', 'sus', 'mis', 'tus', 'nos', 'ese', 'esa', 'eso', 'van', 'voy',
          'dar', 'ver', 'sea', 'soy', 'est', 'mio', 'tuy', 'han', 'has', 'him', 'her'}
ARTICULOS = {'a', 'an', 'the', 'to'}


def base(palabra):
    """La palabra en inglés sin nota ni puntuación."""
    return normalizar(re.sub(r'\s*\([^)]*\)', '', palabra))


def lema(t):
    """Sin la terminación regular: tenants -> tenant, relied -> rely, splitting -> split, cluttered -> clutter."""
    for fin, cambio in (('ies', 'y'), ('ied', 'y'), ('ying', 'y'), ('ing', ''), ('ed', ''), ('es', ''), ('s', '')):
        if t.endswith(fin) and len(t) - len(fin) >= 3:
            t = t[:-len(fin)] + cambio
            break
    if len(t) >= 4 and t[-1] == t[-2] and t[-1] not in 'ls':
        t = t[:-1]
    if len(t) >= 4 and t.endswith('e'):
        t = t[:-1]
    return t


def forma(palabra):
    """La forma con que se comparan dos entradas: "The cracks (sustantivo)" -> "crack"."""
    tokens = base(palabra).split()
    while len(tokens) > 1 and tokens[0] in ARTICULOS:
        tokens = tokens[1:]
    return ' '.join(lema(t) for t in tokens)


def raices(traduccion):
    """Palabras de contenido de la traducción (sin sus notas), sin diferencias de plural ni de género."""
    salida = set()
    for w in normalizar(re.sub(r'\([^)]*\)', ' ', traduccion)).split():
        if len(w) < 3 or w in VACIAS or w in CORTAS:
            continue
        if w.endswith('es') and len(w) > 5:
            w = w[:-2]
        elif w.endswith('s'):
            w = w[:-1]
        if w[-1:] in ('a', 'o'):
            w = w[:-1]
        salida.add(w)
    return salida


def _prefijo(x, y):
    k = 0
    while k < min(len(x), len(y)) and x[k] == y[k]:
        k += 1
    return k


def relacionadas(a, b):
    """Si dos conjuntos de raíces comparten una palabra, aunque una sea la otra con más letras
    ("desorden" / "desordenad") o las dos vengan de la misma ("desesperacion" / "desesperars")."""
    if a & b:
        return True
    return any((len(x) >= 4 and len(y) >= 4 and (x.startswith(y) or y.startswith(x))) or _prefijo(x, y) >= 6
               for x in a for y in b)


def _agrupaciones():
    """De contenido/agrupaciones.json: {forma: [{traducciones}]} para juntar y para separar
    (las traducciones normalizadas)."""
    import json
    import os
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'contenido', 'agrupaciones.json')
    juntar, separar = defaultdict(list), defaultdict(list)
    if os.path.exists(ruta):
        datos = json.load(open(ruta, encoding='utf-8'))
        for destino, clave in ((juntar, 'juntar'), (separar, 'separar')):
            for g in datos.get(clave, []):
                destino[forma(g['palabra'])].append({normalizar(t) for t in g['traducciones']})
    return juntar, separar


def agrupaciones_sin_uso(items):
    """Las traducciones de contenido/agrupaciones.json que no están en ningún vocabulario (erratas)."""
    hay = defaultdict(set)
    for it in items:
        hay[forma(it['word'])].add(normalizar(it['translation']))
    juntar, separar = _agrupaciones()
    return sorted(f'{f}: {t}' for d in (juntar, separar) for f, grupos in d.items()
                  for g in grupos for t in g if t not in hay[f])


def agrupar(items):
    """Asigna a cada item un 'grupo' (misma forma + significado relacionado).

    Dos entradas de la misma forma se juntan si sus traducciones están relacionadas o si
    contenido/agrupaciones.json dice que van juntas; no se juntan si ese archivo las separa
    (una traducción de "separar" solo se junta con las de su mismo grupo de "separar")."""
    juntar, separar = _agrupaciones()
    por_base = defaultdict(list)
    for i, it in enumerate(items):
        por_base[forma(it['word'])].append(i)
    grupo = [None] * len(items)
    for b, idx in por_base.items():
        padre = {i: i for i in idx}

        def raiz(i):
            while padre[i] != i:
                padre[i] = padre[padre[i]]
                i = padre[i]
            return i

        r = {i: raices(items[i]['translation']) for i in idx}
        t = {i: normalizar(items[i]['translation']) for i in idx}
        # A qué grupo de "separar" pertenece cada entrada (None: a ninguno).
        aparte = {i: next((k for k, g in enumerate(separar.get(b, [])) if t[i] in g), None) for i in idx}
        for a_pos, a in enumerate(idx):
            for c in idx[a_pos + 1:]:
                if raiz(a) == raiz(c):
                    continue
                a_mano = any(t[a] in g and t[c] in g for g in juntar.get(b, []))
                if not a_mano and aparte[a] != aparte[c]:
                    continue
                if a_mano or t[a] == t[c] or relacionadas(r[a], r[c]):
                    padre[raiz(a)] = raiz(c)
        for i in idx:
            grupo[i] = (b, raiz(i))
    return grupo


def representante(pares):
    """Cómo se muestra un grupo: la forma más usada (si hay empate, la más corta) y, de las
    traducciones de esa forma, la más usada (si hay empate, la más completa; no depende del orden
    de los archivos). Así "Scratch (verbo)" no queda con la traducción de "Scratches".
    Recibe un Counter {(palabra, traducción): veces}."""
    variantes = Counter()
    for (w, _), n in pares.items():
        variantes[w] += n
    palabra = min(variantes.items(), key=lambda x: (-x[1], len(x[0]), x[0]))[0]
    traducciones = {t: n for (w, t), n in pares.items() if w == palabra}
    traduccion = min(traducciones.items(), key=lambda x: (-x[1], -len(x[0]), x[0]))[0]
    return palabra, traduccion


def top(items, grupos, cantidad=10):
    """Las `cantidad` palabras más repetidas entre `items` (con su grupo)."""
    cuenta = Counter(grupos)
    pares = defaultdict(Counter)
    for it, g in zip(items, grupos):
        pares[g][(it['word'], it['translation'])] += 1
    lista = []
    for g, n in cuenta.most_common():
        palabra, traduccion = representante(pares[g])
        lista.append({'word': palabra, 'count': n, 'translation': traduccion})
    lista.sort(key=lambda x: (-x['count'], x['word'].lower()))
    return lista[:cantidad]
