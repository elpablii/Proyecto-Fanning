"""Tandas (línea de tiempo): contenido/tandas.json.

Cada tanda es:
  {"id": 54, "title": "50° Tanda", "date": "Sábado, 17/01/2026",
   "items": ["Interestellar",
             {"texto": "The Big Bang Theory (T3 EP 1-2)", "titulo": "The Big Bang Theory", "episodios": ["S03E01", "S03E02"]}]}

- Un ítem es el título exacto de una ficha, o {"texto", "titulo"} si se muestra con otro nombre.
- En las series, "episodios" dice qué episodios entraron en esa tanda. Sin "episodios" se
  entiende la serie completa.
- "ciclo" (opcional): año del ciclo al que pertenece la tanda, si no es el de su fecha (por
  ejemplo, una tanda del 2 de enero que cierra el ciclo anterior).

Este módulo traduce textos como "Kim Possible (T2 EP 27-30 + T3 EP 1)" o
"Euphoria (T1 EP 5-8 + Esp. Rue/Jules)" a la ficha y los códigos de episodio.
"""
import datetime
import re

from conteo import normalizar

DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

# Nombres cortos o en otro idioma que se usan en las tandas -> título de la ficha
ABREVIATURAS = [
    (r'^TBBT\b', 'The Big Bang Theory'),
    (r'^TS:\s*City of Lover', 'Taylor Swift City of Lover Concert'),
    (r'^TS:\s*Reputation', 'Taylor Swift Reputation Stadium Tour'),
    (r'^TS:\s*The Eras Tour \(Final Show\)', 'Taylor Swift - The Eras Tour Film The Final Show'),
    (r"^Taylor Swift: The Eras Tour \(Taylor's Version\)", 'Taylor Swift The Eras Tour Film'),
    (r'^Grace Stirs Up Success', 'An American Girl - Grace Stirs Up Success'),
    (r'^The Muppet Show', 'The Muppet Show'),
    (r'^Lilo y Stitch II', 'Lilo and Stitch II'),
    (r'^Home \(Documental\)', 'Home'),
    (r'^Interstellar$', 'Interestellar'),
    (r'^Cinderella$', 'Cenicienta'),
    (r'^Sleeping Beauty$', 'La Bella Durmiente'),
    (r'^Pride and Prejudice$', 'Orgullo y Prejuicio'),
    (r"^Five Nights at Freddy's I$", "Five Nights at Freddy's"),
    (r'^Toy Story I$', 'Toy Story'),
    (r'^Toy Story II$', 'Toy Story 2'),
    (r'^Cars I$', 'Cars'),
    (r'^Cars II$', 'Cars 2'),
    (r'^Star Wars IV', 'Star Wars Episodio IV A New Hope'),
    (r'^Star Wars V:', 'Star Wars Episodio V The Empire Strikes Back'),
    (r'^Star Wars VI', 'Star Wars Episodio VI Return of the Jedi'),
    (r'^Inside Out I$', 'Intensamente'),
    (r'^La Leyenda de Tarzán', 'The Legend of Tarzan'),
    (r'^Rambo: First Blood \(Part II\)', 'Rambo II'),
    (r'^Harold y su Crayón Mágico', 'Harold and The Purple Crayon'),
    (r"^Queen's Gambit", 'Gambito de Dama'),
    (r"^I Think We're Alone Now", 'I Think Were Alone Now'),
    (r'^Sabrina Carpenter: A Nonsense Christmas', 'A Nonsense Christmas with Sabrina Carpenter'),
]


def fecha_con_dia(dd_mm_aaaa):
    """'17/01/2026' -> 'Sábado, 17/01/2026'."""
    d, m, a = (int(x) for x in dd_mm_aaaa.split('/'))
    return f'{DIAS[datetime.date(a, m, d).weekday()]}, {dd_mm_aaaa}'


def fecha_de(texto_fecha):
    """'Sábado, 17/01/2026' -> date(2026, 1, 17)."""
    d, m, a = (int(x) for x in re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', texto_fecha).groups())
    return datetime.date(a, m, d)


def resolver_titulo(texto, nombres):
    """Título de la ficha de un ítem. `nombres`: {nombre normalizado: título} (títulos y alias)."""
    for patron, titulo in ABREVIATURAS:
        if re.search(patron, texto):
            return titulo
    sin_parentesis = re.sub(r'\s*\([^)]*\)\s*$', '', texto)
    for candidato in (texto, sin_parentesis):
        if normalizar(candidato) in nombres:
            return nombres[normalizar(candidato)]
    return None


def episodios_de_texto(texto, ficha):
    """Códigos de episodio que nombra el texto de un ítem de serie, o None si es la serie completa."""
    disponibles = list((ficha.get('episodios') or {}).keys())
    m = re.search(r'\(([^)]*)\)\s*$', texto)
    detalle = m.group(1) if m else ''
    if not detalle or re.search(r'completa|\d+\s*partes', detalle, re.I):
        return None
    codigos = []
    temporada = 1
    for parte in re.split(r'\s*\+\s*', detalle):
        # especiales: "Especial", "Esp. Rue/Jules"
        if re.match(r'(Esp\.?|Especial)', parte, re.I):
            especiales = [c for c in disponibles if c.startswith('SP')]
            cuantos = len(re.split(r'/', parte)) if '/' in parte else 1
            codigos += especiales[:cuantos] if cuantos > 1 else especiales[:1]
            continue
        # "S01E03-04", "S01E01", "S01 EP10-13", "T2 EP 4-7", "EP 1-2", "EP1-2", "T3 EP 1"
        s = re.search(r'(?:S|T)\s*0*(\d+)', parte)
        if s:
            temporada = int(s.group(1))
        e = re.search(r'(?:E|EP)\s*0*(\d+)(?:\s*-\s*0*(\d+))?\s*$', parte)
        if not e:
            continue
        a, b = int(e.group(1)), int(e.group(2) or e.group(1))
        codigos += [f'S{temporada:02d}E{n:02d}' for n in range(a, b + 1)]
    return codigos or None
