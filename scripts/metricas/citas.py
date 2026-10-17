"""Citas de la Realeza: una línea de diálogo de cada artista, verificada contra los subtítulos.

Cada cita se escribe a mano en contenido/realeza.json:

  "cita": {"texto": "You guys ever think about dying?", "titulo": "Barbie", "personaje": "Barbie"}

"titulo" es el título de la ficha. Los PDFs de diálogos no dicen quién habla, así que la cita
se elige a mano; este script solo confirma que la frase está en los subtítulos de ese título
(sin importar mayúsculas, puntuación ni saltos de línea) y anota dónde: "episodio" (series) y
"segundo" (desde el comienzo). Si no la encuentra, lo avisa y no toca esa cita.

  python fanning.py citas
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fichas as F  # noqa: E402
from conteo import contar_dialogos, leer_lineas  # noqa: E402
from rutas import DATA, absoluta  # noqa: E402


def plano(texto):
    """Minúsculas, sin puntuación ni espacios repetidos: "I'm... I'm tall," -> "i m i m tall"."""
    return ' '.join(re.sub(r"[^\w]+", ' ', (texto or '').lower()).split())


def subtitulos(ficha):
    """[(episodio, segundo, texto)] de todos los PDFs de diálogos de una ficha."""
    salida = []
    for d in ficha['pdfs'].get('dialogos', []):
        ruta = F.ruta_dialogo(d)
        m = re.search(r'Season\s*(\d+)', ruta, re.I)
        r = contar_dialogos(leer_lineas(absoluta(ruta)), es_serie=ficha['tipo'] == 'serie',
                            temporada=int(m.group(1)) if m else 1, episodio_fijo=F.episodio_fijo(d), con_textos=True)
        salida += [(s[0], s[1], s[3]) for s in r['subtitulos']]
    return salida


def ubicar(cita, subs):
    """Dónde empieza la cita en los subtítulos (puede ocupar varios seguidos), o None."""
    buscada = plano(cita)
    for i, (episodio, segundo, _) in enumerate(subs):
        junto = ''
        for _, _, texto in subs[i:i + 6]:
            junto = (junto + ' ' + plano(texto)).strip()
            if buscada in junto:
                # que empiece en este subtítulo y no en uno anterior
                if i + 1 < len(subs) and buscada in plano(' '.join(t for _, _, t in subs[i + 1:i + 6])):
                    break
                return episodio, segundo
            if len(junto) > len(buscada) + 200:
                break
    return None


def main():
    realeza = F.cargar_realeza()
    fichas = {f['titulo']: f for f in F.cargar(estricto=False)[0]}
    cache, problemas, listas = {}, [], 0
    for a in realeza:
        cita = a.get('cita')
        if not cita:
            continue
        ficha = fichas.get(cita.get('titulo'))
        if not ficha:
            problemas.append(f'{a["nombre"]}: "{cita.get("titulo")}" no es el título de ninguna ficha.')
            continue
        if a['nombre'] not in F.papeles_realeza(ficha):
            problemas.append(f'{a["nombre"]}: no figura en la ficha de {ficha["titulo"]} (ver "realeza" y "realeza_manual").')
        if ficha['titulo'] not in cache:
            cache[ficha['titulo']] = subtitulos(ficha)
        lugar = ubicar(cita['texto'], cache[ficha['titulo']])
        if not lugar:
            problemas.append(f'{a["nombre"]}: la cita no está en los subtítulos de {ficha["titulo"]}: "{cita["texto"]}"')
            continue
        episodio, segundo = lugar
        cita.pop('episodio', None)
        cita.pop('segundo', None)
        if episodio:
            cita['episodio'] = episodio
        if segundo is not None:
            cita['segundo'] = int(segundo)
        listas += 1

    with open(F.REALEZA, 'w', encoding='utf-8') as f:
        json.dump(realeza, f, ensure_ascii=False, indent=2)
        f.write('\n')
    # La página lee la copia de data/ (la misma que deja "actualizar").
    with open(os.path.join(DATA, 'realeza.json'), 'w', encoding='utf-8') as f:
        json.dump(realeza, f, ensure_ascii=False, indent=2)

    sin_cita = [a['nombre'] for a in realeza if not a.get('cita')]
    print(f'Citas verificadas: {listas}.')
    if sin_cita:
        print(f'Sin cita ({len(sin_cita)}): {", ".join(sin_cita)}.')
    if problemas:
        print('\nRevisar:')
        for p in problemas:
            print('  -', p)
        sys.exit(1)


if __name__ == '__main__':
    main()
