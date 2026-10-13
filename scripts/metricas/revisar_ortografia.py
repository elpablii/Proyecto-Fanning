"""Busca posibles faltas de ortografía y problemas de puntuación en los vocabularios.

No corrige nada: deja una lista para arreglar a mano en los PDFs.
Revisa las entradas tal como salen de los PDFs (lo mismo que muestran las
flashcards).

Uso:  python scripts/metricas/revisar_ortografia.py
Salida: scripts/metricas/verificaciones/revision_ortografia.md
"""
import json
import unicodedata
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import absoluta  # noqa: E402
import fichas as F  # noqa: E402
from conteo import leer_lineas, leer_vocabulario  # noqa: E402

from spellchecker import SpellChecker  # pip install pyspellchecker

EN = SpellChecker(language='en', distance=1)
ES = SpellChecker(language='es', distance=1)
PALABRA = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:'[A-Za-z]+)?")
# Pares que existen con y sin tilde: no se marcan porque las dos formas son correctas.
AMBIGUAS = {'que', 'esta', 'este', 'estas', 'como', 'el', 'tu', 'mi', 'si', 'se', 'mas', 'solo', 'aun', 'de',
            'te', 'donde', 'cuando', 'quien', 'cual', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'porque',
            'esto', 'eso', 'aquel', 'ese', 'esa', 'esos', 'esas', 'sabana', 'papa', 'publico', 'practico',
            'ultimo', 'termino', 'calculo', 'animo', 'transito', 'continuo', 'esta', 'hacia', 'sera', 'estas'}
FRECUENCIA = {'en': {}, 'es': {}}  # se llena con todo el corpus antes de revisar


def sin_tildes(w):
    """Quita las tildes, pero no la ñ (no es una n con tilde)."""
    return ''.join(c if c in 'ñÑ' else ''.join(x for x in unicodedata.normalize('NFKD', c)
                                                  if not unicodedata.combining(x)) for c in w)


def britanica(w):
    """Ortografía británica correcta (behaviour, offence, aluminium, travelled...)."""
    for a, b in (('our', 'or'), ('ence', 'ense'), ('ise', 'ize'), ('tre', 'ter'), ('ll', 'l'), ('ium', 'um'),
                 ('ogue', 'og'), ('yse', 'yze'), ('ae', 'e'), ('oe', 'e')):
        if a in w and w.replace(a, b, 1) in EN:
            return True
    return False


def nota_y_texto(palabra):
    """Separa 'Rely (verbo)' en ('Rely', ['verbo'])."""
    notas = re.findall(r'\(([^)]*)\)', palabra)
    return re.sub(r'\s*\([^)]*\)', '', palabra).strip(), notas


def puntuacion(texto, lado):
    p = []
    if texto.count('(') != texto.count(')'):
        p.append('paréntesis sin cerrar o sin abrir')
    if texto.count('[') != texto.count(']'):
        p.append('corchete sin cerrar o sin abrir')
    if texto.count('"') % 2:
        p.append('comillas " sin cerrar')
    if texto.count('“') != texto.count('”'):
        p.append('comillas “ ” sin cerrar')
    if re.search(r'\s[,.;:?!)]', texto):
        p.append('espacio antes de un signo de puntuación')
    if re.search(r'[,;](?=[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡])', texto):
        p.append('falta espacio después de coma o punto y coma')
    if re.search(r',,|;;|(?<!\.)\.\.(?!\.)|\?\?|!!', texto):
        p.append('signo repetido')
    if re.search(r'\(\s|\s\)', texto):
        p.append('espacio dentro del paréntesis')
    if lado == 'es':
        if texto.count('¿') != texto.count('?'):
            p.append('falta ¿ o ? (en español van los dos)')
        if texto.count('¡') != texto.count('!'):
            p.append('falta ¡ o ! (en español van los dos)')
        if ':' in texto:
            p.append('la traducción tiene ":" (¿dos entradas en un mismo renglón?)')
    if lado == 'es' and not texto:
        p.append('traducción vacía')
    if re.search(r'\b[A-Z] [a-z]{1,4}\b', texto) and re.search(r'\b(Y ou|T o|W e|T his|T hat|T he|W hat|Y es)\b', texto):
        p.append('letra separada del resto de la palabra (ej. "Y ou"): revisar el PDF')
    return p


def tokens(texto):
    return PALABRA.findall(texto.replace('’', "'").replace('‘', "'"))


def ortografia(texto, lado, ignorar_mayusculas):
    """Posibles faltas: palabras raras en el corpus que están a una letra (o a una
    tilde) de una palabra conocida y frecuente."""
    dic, otro = (EN, ES) if lado == 'en' else (ES, EN)
    frec = FRECUENCIA[lado]
    dudas = []
    for w in tokens(texto):
        if len(w) < 3 or (ignorar_mayusculas and w[0].isupper() and w.lower() not in dic) or w.isupper():
            continue
        lw = w.lower()
        if frec.get(lw, 0) > 2:
            continue  # se repite en varios vocabularios: lo damos por bueno
        if lado == 'es':
            # 1) falta o sobra una tilde respecto de una palabra frecuente del corpus
            base = sin_tildes(lw)
            alternativas = [x for x, n in FRECUENCIA_SIN_TILDE.get(base, []) if x != lw and n >= 5]
            if alternativas and lw not in AMBIGUAS and not conocida_es(lw):
                dudas.append(f'"{w}" → ¿"{alternativas[0]}"? (tilde)')
                continue
        if lw in dic or lw in otro or "'" in lw:
            continue
        if lado == 'es' and conocida_es(lw):
            continue
        if lado == 'en' and (lw.rstrip('s') in EN or lw[:-2] in EN or lw[:-3] in EN or conocida_es(lw)
                             or britanica(lw)):
            continue
        # 2) a una letra de una palabra conocida y frecuente
        candidatos = [c for c in (dic.candidates(lw) or []) if c != lw and c in dic]
        candidatos = [c for c in candidatos if frec.get(c, 0) >= 3 or dic.word_usage_frequency(c) > 1e-6]
        if candidatos:
            mejor = max(candidatos, key=lambda c: (frec.get(c, 0), dic.word_usage_frequency(c)))
            dudas.append(f'"{w}" → ¿"{mejor}"?')
    return dudas


FRECUENCIA_SIN_TILDE = {}

ENCLITICOS = ('melo', 'mela', 'selo', 'sela', 'selos', 'selas', 'noslo', 'me', 'te', 'se', 'lo', 'la', 'los',
              'las', 'le', 'les', 'nos', 'os')
TERMINACIONES = sorted({
    'ando', 'iendo', 'yendo', 'ado', 'ada', 'ados', 'adas', 'ido', 'ida', 'idos', 'idas',
    'o', 'as', 'a', 'amos', 'áis', 'an', 'es', 'e', 'emos', 'éis', 'en', 'imos', 'ís',
    'aba', 'abas', 'ábamos', 'aban', 'ía', 'ías', 'íamos', 'ían', 'é', 'aste', 'ó', 'asteis', 'aron',
    'í', 'iste', 'ió', 'isteis', 'ieron', 'aré', 'arás', 'ará', 'aremos', 'arán', 'eré', 'erás', 'erá',
    'eremos', 'erán', 'iré', 'irás', 'irá', 'iremos', 'irán', 'aría', 'arías', 'aríamos', 'arían',
    'ería', 'erías', 'eríamos', 'erían', 'iría', 'irías', 'iríamos', 'irían', 'ara', 'aras', 'áramos',
    'aran', 'iera', 'ieras', 'iéramos', 'ieran', 'ase', 'iese', 'emos', 'ad', 'ed', 'id', 'ar', 'er', 'ir',
}, key=len, reverse=True)


def conocida_es(w):
    """True si w es una forma (plural, femenino, verbo conjugado, con pronombre) de una palabra conocida."""
    if w in ES:
        return True
    formas = {w, sin_tildes(w)}
    for f in list(formas):
        for enc in ENCLITICOS:
            if f.endswith(enc) and len(f) - len(enc) >= 3:
                formas.add(sin_tildes(f[:-len(enc)]))
    for f in formas:
        if f in ES or f[:-1] in ES or f[:-2] in ES or (f.endswith('ces') and f[:-3] + 'z' in ES):
            return True
        if f.endswith(('a', 'as', 'os')) and (f.rstrip('s')[:-1] + 'o') in ES:
            return True
        for t in TERMINACIONES:
            t0 = sin_tildes(t)
            if f.endswith(t0) and len(f) - len(t0) >= 2:
                raiz = f[:-len(t0)]
                if any(raiz + inf in ES for inf in ('ar', 'er', 'ir')):
                    return True
                # cambios de raíz frecuentes (e->ie, o->ue, c->qu, g->gu, z->c)
                for a, b in (('ie', 'e'), ('ue', 'o'), ('qu', 'c'), ('gu', 'g'), ('c', 'z'), ('i', 'e'), ('u', 'o')):
                    if a in raiz and any(raiz[::-1].replace(a[::-1], b[::-1], 1)[::-1] + inf in ES for inf in ('ar', 'er', 'ir')):
                        return True
    return False


def main():
    catalogo, _, _ = F.cargar()
    todas = []
    for t in catalogo:
        for ruta in t['pdfs']['vocabulario']:
            nombre = os.path.basename(ruta)
            entradas, _ = leer_vocabulario(leer_lineas(absoluta(ruta)), nombre if t['tipo'] == 'serie' else '')
            todas += [(t, ruta, e) for e in entradas]
    for _, _, e in todas:
        ingles, notas = nota_y_texto(e['word'])
        for w in tokens(ingles):
            FRECUENCIA['en'][w.lower()] = FRECUENCIA['en'].get(w.lower(), 0) + 1
        for w in tokens(' '.join(notas) + ' ' + e['translation']):
            FRECUENCIA['es'][w.lower()] = FRECUENCIA['es'].get(w.lower(), 0) + 1
    agrupadas = defaultdict(dict)
    for w, n in FRECUENCIA['es'].items():
        agrupadas[sin_tildes(w)][w] = n
    for base, formas in agrupadas.items():
        FRECUENCIA_SIN_TILDE[base] = sorted(formas.items(), key=lambda x: -x[1])

    hallazgos = defaultdict(list)  # (titulo, pdf) -> [(entrada, [problemas])]
    total_p = total_o = 0
    if True:
        for t, ruta, e in todas:
            if True:
                ingles, notas = nota_y_texto(e['word'])
                prob = [f'inglés: {x}' for x in puntuacion(e['word'], 'en')]
                prob += [f'español: {x}' for x in puntuacion(e['translation'], 'es')]
                n_p = len(prob)
                orto = [f'inglés: {x}' for x in ortografia(ingles, 'en', True)]
                orto += [f'nota: {x}' for x in ortografia(' '.join(notas), 'es', False)]
                orto += [f'español: {x}' for x in ortografia(e['translation'], 'es', True)]
                if prob or orto:
                    hallazgos[(t['titulo'], ruta)].append((e, prob, orto))
                    total_p += n_p
                    total_o += len(orto)

    salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verificaciones', 'revision_ortografia.md')
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, 'w', encoding='utf-8') as f:
        f.write('# Revisión de ortografía y puntuación de los vocabularios\n\n')
        f.write('Generado por `scripts/metricas/revisar_ortografia.py`. Las entradas están tal como salen '
                'del PDF (lo mismo que muestran las flashcards).\n\n')
        f.write(f'- Problemas de puntuación: **{total_p}**\n')
        f.write(f'- Posibles faltas de ortografía: **{total_o}**. Se marca una palabra cuando aparece 1 o 2 '
                'veces en todos los vocabularios y está a una letra (o a una tilde) de una palabra conocida y '
                'frecuente. Las sugerencias son automáticas: algunas serán jerga o nombres correctos.\n\n')
        for (titulo, ruta), lista in sorted(hallazgos.items(), key=lambda x: (x[0][0].lower(), x[0][1])):
            f.write(f'## {titulo}\n\n`{ruta}`\n\n')
            for e, prob, orto in lista:
                f.write(f'- **{e["word"]}**: {e["translation"]}\n')
                for x in prob:
                    f.write(f'  - Puntuación — {x}\n')
                for x in orto:
                    f.write(f'  - Ortografía — {x}\n')
            f.write('\n')
    print(f'Puntuación: {total_p}  Ortografía (posibles): {total_o}  ->  {os.path.relpath(salida)}')


if __name__ == '__main__':
    main()
