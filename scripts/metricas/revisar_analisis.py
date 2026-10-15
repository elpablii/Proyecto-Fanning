"""Revisa que el análisis del inglés de cada película coincida con sus métricas.

El análisis (campo "analisis" de contenido/titulos/*.json) es texto libre escrito a
mano; el nivel MCER lo calcula nivel.py. Esta revisión busca afirmaciones del texto
que las métricas contradicen: un nivel distinto, "diálogos rápidos" con poca
velocidad, un tema especializado que no aparece, expresiones citadas que no están
en los diálogos, etc.

No corrige nada: deja una lista para revisar a mano.

Uso:  python scripts/metricas/revisar_analisis.py
Salida: scripts/metricas/verificaciones/revision_analisis.md
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import DATA, RAIZ, absoluta  # noqa: E402
from conteo import leer_lineas, normalizar  # noqa: E402

SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verificaciones', 'revision_analisis.md')
NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

# Palabras del texto que afirman algo medible.
RAPIDO = re.compile(r'r[áa]pid|veloz|velocidad|vertiginos|fren[ée]tic|ametralladora|acelerad|atropellad', re.I)
LENTO = re.compile(r'pausad|\blent[oa]s?\b|tranquil|calmad|sin prisa', re.I)
FACIL = re.compile(r'accesible|sencill|f[áa]cil|principiante|b[áa]sic|ligero', re.I)
DIFICIL = re.compile(r'desafiant|dif[íi]cil|exigente|complej|reto\b|avanzad|denso', re.I)
TEMAS = {
    'legal y judicial': r'legal|jur[íi]dic|judicial|tribunal|abogad|juicio',
    'médica y de salud': r'm[ée]dic|hospital|cl[íi]nic|salud|enfermedad',
    'militar y policial': r'militar|policial|polic[íi]a|b[ée]lic|ej[ée]rcito|detective|\bFBI\b|\bCIA\b',
    'financiera y empresarial': r'financ|empresarial|negocios|econ[óo]mic|corporativ|bursátil',
    'inglés de época o antiguo': r'[ée]poca|antiguo|arcaic|victorian|shakespear|isabelin|medieval|regencia',
    'drogas y calle': r'drogas|narco|pandill|callejer',
    'científica y técnica': r'cient[íi]fic|t[ée]cnic|tecnol[óo]g|astron|f[íi]sica',
}
# Palabras que el texto usa para describir el inglés, no para citar el diálogo.
DESCRIPTIVAS = {'slang', 'aave', 'spanglish', 'cockney', 'small talk', 'catchphrase', 'catchphrases', 'one liners'}
CITA = re.compile(r"""(?<![A-Za-z])['‘"“]([A-Za-z][A-Za-z' \-]{1,40}?)['’"”](?![A-Za-z])""")


def percentil(valores, q):
    v = sorted(valores)
    return v[min(len(v) - 1, int(len(v) * q))]


def niveles_de(nivel):
    """'B1-B2' -> {'B1', 'B2'}."""
    return set(nivel.split('-')) if nivel else set()


def flexiones(n):
    """Patrón que acepta la cita con plural o conjugación en su última palabra (casualty -> casualties)."""
    *inicio, ultima = n.split(' ')
    base = re.escape(ultima[:-1]) + '(?:y|ies)' if ultima.endswith('y') else re.escape(ultima) + '(?:s|es|d|ed|ing)?'
    if ultima.endswith('e'):
        base = f'(?:{base}|{re.escape(ultima[:-1])}ing)'
    return ' '.join([re.escape(p) for p in inicio] + [base])


def texto_dialogos(pdfs):
    partes = []
    for ruta in pdfs:
        try:
            partes.append(' '.join(leer_lineas(absoluta(ruta))))
        except Exception:
            pass
    return f' {normalizar(" ".join(partes))} ' if partes else None


def revisar(t, d, ppm_rapido, ppm_lento):
    a = t.get('analisis') or ''
    nivel = d.get('level') or ''
    det = d.get('levelDetail') or {}
    ppm = (det.get('dialogos') or {}).get('ppm')
    puntaje = det.get('puntaje')
    temas = set(det.get('temas') or [])
    graves, revisar = [], []

    if not a.strip():
        return ['Sin análisis.'], []
    if len(a) < 120:
        revisar.append(f'Muy corto ({len(a)} caracteres).')
    if re.search(r'Ã|�', a):
        graves.append('Caracteres mal codificados.')

    # Nivel escrito a mano
    escritos = set(re.findall(r'\b([ABC][12])\b', a))
    if escritos and not escritos & niveles_de(nivel):
        graves.append(f'Dice nivel {", ".join(sorted(escritos))}; el calculado es {nivel}.')
    elif escritos:
        revisar.append(f'Nombra el nivel ({", ".join(sorted(escritos))}); el calculado ({nivel}) ya se muestra al lado.')

    # Velocidad
    if ppm:
        if RAPIDO.search(a) and ppm < ppm_lento:
            graves.append(f'Habla de rapidez, pero va a {ppm:.0f} palabras/min (de las más lentas).')
        elif RAPIDO.search(a) and ppm < ppm_rapido:
            revisar.append(f'Habla de rapidez; va a {ppm:.0f} palabras/min (velocidad normal).')
        if LENTO.search(a) and ppm > ppm_rapido:
            graves.append(f'Habla de ritmo pausado, pero va a {ppm:.0f} palabras/min (de las más rápidas).')

    # Dificultad
    if puntaje is not None:
        if FACIL.search(a) and puntaje >= 3.9:
            revisar.append(f'Lo presenta como fácil o accesible; puntaje {puntaje} ({nivel}).')
        if DIFICIL.search(a) and puntaje < 3.35:
            revisar.append(f'Lo presenta como difícil; puntaje {puntaje} ({nivel}).')

    # Temas especializados
    for tema, patron in TEMAS.items():
        menciona = re.search(patron, a, re.I)
        if menciona and tema not in temas:
            revisar.append(f'Menciona vocabulario "{tema}" ("{menciona.group(0)}"), pero no sale como tema destacado.')
        if tema in temas and not menciona:
            revisar.append(f'Tema destacado "{tema}" que el texto no menciona.')

    # Expresiones citadas
    citas = [c.strip() for c in CITA.findall(a)]
    if citas:
        dialogos = texto_dialogos((t.get('pdfs') or {}).get('dialogos') or [])
        vocab = ' '.join(normalizar(v.get('word', '')) for v in d.get('vocabulary') or [])
        for c in citas:
            n = normalizar(c)
            if not n or n in DESCRIPTIVAS:
                continue
            forma = re.compile(rf' {flexiones(n)} ')
            en_dialogos = dialogos is not None and forma.search(dialogos)
            if not en_dialogos and not forma.search(f' {vocab} '):
                if dialogos is None:
                    revisar.append(f"Cita '{c}': no hay diálogos para comprobarla y no está en el vocabulario.")
                else:
                    graves.append(f"Cita '{c}': no aparece en los diálogos ni en el vocabulario.")
    return graves, revisar


def main():
    titulos = {}
    for f in glob.glob(os.path.join(RAIZ, 'contenido', 'titulos', '*.json')):
        with open(f, encoding='utf-8') as fh:
            t = json.load(fh)
        if t.get('tipo') == 'pelicula':
            titulos[t['titulo']] = t
    datos = {}
    for f in glob.glob(os.path.join(DATA, 'pelis', '*.json')):
        with open(f, encoding='utf-8') as fh:
            d = json.load(fh)
        datos[d['title']] = d

    velocidades = [(d.get('levelDetail') or {}).get('dialogos', {}).get('ppm') for d in datos.values()]
    velocidades = [v for v in velocidades if v]
    ppm_lento, ppm_rapido = percentil(velocidades, 0.25), percentil(velocidades, 0.75)

    filas = []
    for nombre in sorted(titulos, key=str.lower):
        d = datos.get(nombre)
        if d is None:
            filas.append((nombre, '', ['No está en data/pelis (¿falta actualizar?).'], []))
            continue
        g, r = revisar(titulos[nombre], d, ppm_rapido, ppm_lento)
        filas.append((nombre, d.get('level') or '', g, r))

    graves = [f for f in filas if f[2]]
    solo_revisar = [f for f in filas if not f[2] and f[3]]
    bien = [f for f in filas if not f[2] and not f[3]]

    out = ['# Revisión del análisis del inglés (películas)', '',
           f'{len(filas)} películas · {len(graves)} con contradicciones · {len(solo_revisar)} para revisar · '
           f'{len(bien)} sin observaciones.', '',
           f'Velocidad: lenta < {ppm_lento:.0f} palabras/min (percentil 25), rápida > {ppm_rapido:.0f} (percentil 75).', '']
    for titulo, lista in (('Contradicciones', graves), ('Para revisar', solo_revisar)):
        out += [f'## {titulo} ({len(lista)})', '']
        for nombre, nivel, g, r in lista:
            out.append(f'### {nombre} — {nivel}')
            out += [f'- **{x}**' for x in g] + [f'- {x}' for x in r]
            out.append(f'> {titulos[nombre].get("analisis") or "(vacío)"}')
            out.append('')
    out += [f'## Sin observaciones ({len(bien)})', '', ', '.join(f[0] for f in bien), '']

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(out))
    print(f'{len(graves)} con contradicciones, {len(solo_revisar)} para revisar, {len(bien)} sin observaciones.')
    print(f'Informe: {SALIDA}')


if __name__ == '__main__':
    main()
