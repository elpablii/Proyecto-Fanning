"""Construye (o actualiza) scripts/metricas/catalogo.json.

El catálogo dice explícitamente qué PDFs de vocabulario y de diálogos pertenecen
a cada título de la página. Reemplaza la búsqueda por "nombre parecido" que
asignaba PDFs equivocados (IO / Star Wars, Rocky I / Rocky III, etc.).

- Los títulos ya presentes en el catálogo se conservan tal cual (se puede
  editar a mano).
- Los PDFs nuevos se asignan solos si el nombre coincide; si no, se usa la
  tabla TRADUCCIONES. Lo que no se pueda asignar se informa y el script
  termina con error, para que nada quede fuera de la página sin avisar.

Uso:  python scripts/metricas/construir_catalogo.py
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import RAIZ, CATALOGO, DATA, rel  # noqa: E402
from conteo import normalizar  # noqa: E402

# Vocabulario (nombre en español del PDF) -> nombre del PDF de diálogos.
TRADUCCIONES = {
    'Alvin y las Ardillas': 'Alvin and the Chipmunks',
    'An American Girl - Grace Stirs Up Success': 'An American Success - Girl Stirs Up Success',
    'Aves de Presa': 'Birds of Prey',
    'Barbie La Princesa y Estrella de Pop': 'Barbie The Princess And The Popstar',
    'Bichos Una Aventura en Miniatura': "A Bug's Life",
    'Buscando a Nemo': 'Finding Nemo',
    'Cars I': 'Cars movie',
    'Cars II': 'Cars 2',
    'Cars III': 'Cars 3',
    'Cenicienta': 'Cinderella',
    'Contrarreloj': 'Retribution',
    'Dream Productions (de Intensamente)': 'Dream Productions',
    'El Escuadrón Suicida': 'The Suicide Squad',
    'Escuadrón Suicida': 'Suicide Squad',
    'El Expreso Polar': 'The Polar Express',
    'El Padrino I': 'The Godfather I',
    'Escape de Sobibor': 'Escape from Sobibor',
    'Gambito de Dama': "Queen's Gambit",
    'Intensamente': 'Inside Out',
    'Intensamente 2': 'Inside Out II',
    'Kim Possible Todo un Drama': 'Kim Possible - So The Drama',
    'La Bella Durmiente': 'Sleeping Beauty',
    'La Sustancia': 'The Substance',
    'Lilo and Stitch II - Stitch has a Glitch': 'Lilo and Stitch II',
    'Los Fantasmas de Scrooge': 'A Christmas Carol',
    'Los Increibles': 'The Incredibles',
    'Olivia Rodrigo Guts World Tour': 'Olivia Rodrigo Guts World Tour Film',
    'Olivia Rodrigo driving home 2 u': 'Olivia Rodrigo driving home to you',
    'Orgullo y Prejuicio': 'Pride and Prejudice',
    'Rambo First Blood': 'Rambo',
    'Riesgo Bajo Cero': 'The Ice Road',
    'Rocky I': 'Rocky',
    'Star Wars Episodio I The Phantom Menace': 'Star Wars Episode I The Phantom Menace',
    'Star Wars Episodio II Attack of The Clones': 'Star Wars Episode II Attack of the Clones',
    'Star Wars Episodio III Revenge of the Sith': 'Star Wars Episode III Revenge of the Sith',
    'Star Wars Episodio IV A New Hope': 'Star Wars Episode IV A New Hope',
    'Star Wars Episodio V The Empire Strikes Back': 'Star Wars Episode V The Empire Strikes Back',
    'Star Wars Episodio VI Return of the Jedi': 'Star Wars Episode VI Return of the Jedi',
    'Super Mario Galaxy': 'Super Mario Galaxy The Movie',
    'Taylor Swift Folklore The Long Pond Studio Sessions': 'Taylor Swift - Folklore The Long Pond Sessions',
    'Taylor Swift The 1989 World Tour': 'Taylor Swift 1989 The World Tour',
    'The Muppet Show (con Sabrina Carpenter)': 'The Muppet Show (with Sabrina Carpenter)',
    'Toy Story III': 'Toy Story 3',
    'Toy Story IV': 'Toy Story 4',
    'Venganza Implacable': 'Honest Thief',
    'Ámsterdam': 'Amsterdam movie',
}

# PDFs de diálogo que son un episodio completo sin marcadores adentro.
EPISODIO_FIJO = {
    "Creating Queen's Gambit": ('Gambito de Dama', 'SP01'),
}


def base_vocab(ruta):
    b = os.path.splitext(os.path.basename(ruta))[0]
    b = re.sub(r'^Palabras desconocidas de\s*', '', b)
    b = re.sub(r'\s*\((Parte \d+ - )?lista def\w*\)', '', b)
    b = re.sub(r'\s*&?\s*\((S\d+)?\s*EP[^)]*\)|\s*\(vocabulario[^)]*\)', '', b)
    return b.strip()


def base_dialogo(ruta):
    n = os.path.splitext(os.path.basename(ruta))[0]
    n = re.sub(r'^(Dialogues? (from|of) |Gui[oó]n de la pel[ií]cula )', '', n, flags=re.I)
    n = re.sub(r'\s*(to improve (the )?vocabulary.*|in English.*|para aumentar.*)$', '', n, flags=re.I)
    return n.strip(' “”"')


def titulo_pagina(base, existentes):
    """Usa el nombre que ya tiene la página (pelis/*.json) si existe."""
    limpio = re.sub(r'\s*\((de|con) [^)]*\)', '', base)
    limpio = re.sub(r'\s*-\s*Stitch has a Glitch', '', limpio)
    sin_parentesis = re.sub(r'\s*\([^)]*\)', '', base)
    for cand in (base, limpio, sin_parentesis):
        if normalizar(cand) in existentes:
            return existentes[normalizar(cand)]
    if re.fullmatch(r'Cars I', base):
        return existentes.get('cars', base)
    if re.fullmatch(r'Cars II', base):
        return existentes.get('cars 2', base)
    return limpio


def main():
    catalogo = []
    if os.path.exists(CATALOGO):
        catalogo = json.load(open(CATALOGO, encoding='utf-8'))
    asignados = {r for t in catalogo for r in t['vocabulario']}
    asignados |= {d['ruta'] for t in catalogo for d in t['dialogos']}
    por_titulo = {t['titulo']: t for t in catalogo}

    existentes = {}
    for f in os.listdir(os.path.join(DATA, 'pelis')):
        if f.endswith('.json'):
            existentes[normalizar(f[:-5])] = f[:-5]

    vocab = sorted(rel(os.path.join(r, f)) for r, _, fs in os.walk(os.path.join(RAIZ, 'Vocabularios'))
                   for f in fs if f.lower().endswith('.pdf'))
    dial = sorted(rel(os.path.join(r, f)) for r, _, fs in os.walk(os.path.join(RAIZ, 'Diálogos'))
                  for f in fs if f.lower().endswith('.pdf'))
    dial_por_base = {}
    for d in dial:
        dial_por_base.setdefault(normalizar(base_dialogo(d)), []).append(d)

    base_a_titulo = {}
    for v in vocab:
        if v in asignados:
            continue
        base = base_vocab(v)
        titulo = base_a_titulo.setdefault(base, titulo_pagina(base, existentes))
        t = por_titulo.get(titulo)
        if t is None:
            t = {'titulo': titulo, 'tipo': 'pelicula', 'vocabulario': [], 'dialogos': []}
            por_titulo[titulo] = t
            catalogo.append(t)
        t['vocabulario'].append(v)
        if re.search(r'\((S\d+)?\s*EP', os.path.basename(v)):
            t['tipo'] = 'serie'
        # diálogos del mismo título
        clave = normalizar(TRADUCCIONES.get(base, base))
        for d in dial_por_base.get(clave, []):
            if d not in asignados:
                t['dialogos'].append({'ruta': d})
                asignados.add(d)
                if 'Series' in d:
                    t['tipo'] = 'serie'

    for d in dial:
        if d in asignados:
            continue
        b = base_dialogo(d)
        if b in EPISODIO_FIJO:
            titulo, ep = EPISODIO_FIJO[b]
            por_titulo[titulo]['dialogos'].append({'ruta': d, 'episodio': ep})
            asignados.add(d)

    sin_dialogo = [t['titulo'] for t in catalogo if not t['dialogos']]
    sin_vocab = [d for d in dial if d not in asignados]
    for t in catalogo:
        t['vocabulario'].sort()
        t['dialogos'].sort(key=lambda d: d['ruta'])
    catalogo.sort(key=lambda t: normalizar(t['titulo']))
    json.dump(catalogo, open(CATALOGO, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'Catálogo: {len(catalogo)} títulos -> {rel(CATALOGO)}')
    if sin_dialogo:
        print('Títulos sin PDF de diálogos (se muestran con 0 líneas):', sin_dialogo)
    if sin_vocab:
        print('PDFs de diálogos sin vocabulario asignado:')
        for d in sin_vocab:
            print('   ', d)
        sys.exit(1)


if __name__ == '__main__':
    main()
