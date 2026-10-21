"""Palabras más repetidas (global y por año).

Una "palabra" del ranking agrupa las entradas del vocabulario que son la misma
palabra o frase en inglés con un significado relacionado:
  - se compara la palabra sin la nota entre paréntesis y sin la puntuación
    ("Settle down!", "Settle down?" y "Settle down" son la misma);
  - entre esas, se juntan las que tienen traducciones relacionadas (comparten
    al menos una palabra de contenido, p. ej. "espeluznante"). Si el
    significado cambia ("Play (verbo): jugar" / "Play (sustantivo): obra"),
    quedan separadas.
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


def base(palabra):
    """La palabra en inglés sin nota ni puntuación."""
    return normalizar(re.sub(r'\s*\([^)]*\)', '', palabra))


def raices(traduccion):
    """Palabras de contenido de la traducción, sin diferencias de plural ni de género."""
    salida = set()
    for w in normalizar(traduccion).split():
        if len(w) < 4 or w in VACIAS:
            continue
        if w.endswith('es') and len(w) > 5:
            w = w[:-2]
        elif w.endswith('s'):
            w = w[:-1]
        if w[-1:] in ('a', 'o'):
            w = w[:-1]
        salida.add(w)
    return salida


CATEGORIAS = ('verbo', 'sustantivo', 'adjetivo', 'adverbio')


def categoria(palabra):
    """Categoría gramatical que indica la nota, si la indica (verbo, sustantivo...)."""
    notas = ' '.join(re.findall(r'\(([^)]*)\)', palabra)).lower()
    return next((c for c in CATEGORIAS if c in notas), None)


def agrupar(items):
    """Asigna a cada item un 'grupo' (misma palabra + significado relacionado).

    Dos entradas de la misma palabra se juntan si sus traducciones comparten una
    palabra de contenido y su nota no indica categorías distintas (verbo vs
    sustantivo, como "play (verbo)" y "play (sustantivo)")."""
    por_base = defaultdict(list)
    for i, it in enumerate(items):
        por_base[base(it['word'])].append(i)
    grupo = [None] * len(items)
    for b, idx in por_base.items():
        padre = {i: i for i in idx}
        cats = {i: {categoria(items[i]['word'])} - {None} for i in idx}

        def raiz(i):
            while padre[i] != i:
                padre[i] = padre[padre[i]]
                i = padre[i]
            return i

        r = {i: raices(items[i]['translation']) for i in idx}
        for a_pos, a in enumerate(idx):
            for c in idx[a_pos + 1:]:
                ra, rc = raiz(a), raiz(c)
                if ra == rc or len(cats[ra] | cats[rc]) > 1:
                    continue
                if normalizar(items[a]['translation']) == normalizar(items[c]['translation']) or r[a] & r[c]:
                    padre[ra] = rc
                    cats[rc] |= cats[ra]
        for i in idx:
            grupo[i] = (b, raiz(i))
    return grupo


def representante(variantes, traducciones):
    """Cómo se muestra un grupo: la forma más usada (si hay empate, la más corta) y la traducción
    más usada (si hay empate, la más completa; no depende del orden de los archivos).
    Recibe dos Counter: {palabra: veces} y {traducción: veces}."""
    palabra = min(variantes.items(), key=lambda x: (-x[1], len(x[0]), x[0]))[0]
    traduccion = min(traducciones.items(), key=lambda x: (-x[1], -len(x[0]), x[0]))[0]
    return palabra, traduccion


def top(items, grupos, cantidad=10):
    """Las `cantidad` palabras más repetidas entre `items` (con su grupo)."""
    cuenta = Counter(grupos)
    variantes = defaultdict(Counter)
    traducciones = defaultdict(Counter)
    for it, g in zip(items, grupos):
        variantes[g][it['word']] += 1
        traducciones[g][it['translation']] += 1
    lista = []
    for g, n in cuenta.most_common():
        palabra, traduccion = representante(variantes[g], traducciones[g])
        lista.append({'word': palabra, 'count': n, 'translation': traduccion})
    lista.sort(key=lambda x: (-x['count'], x['word'].lower()))
    return lista[:cantidad]
