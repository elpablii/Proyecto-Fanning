"""Pruebas del nivel de inglés (Metodología/Criterio de nivel de inglés (MCER).txt).

Uso:  python fanning.py probar
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nivel as N  # noqa: E402


def nv(entrada):
    r = N.nivel_entrada(entrada)
    return N.NIVELES[r['nivel'] - 1] if r else None


def test_palabra_de_la_lista():
    assert nv('Creepy') == 'B2'
    assert nv('Rely (verbo)') == 'B1'


def test_palabra_por_frecuencia():
    assert nv('Gist') == 'C1'


def test_jerga_que_no_existe_es_c2():
    assert nv('Shizzle') == 'C2'


def test_phrasal_verb_minimo_b2():
    assert nv('Break down') == 'B2'
    assert nv('Get through') == 'B2'


def test_no_literal_minimo_b2():
    assert nv('I was really into you (frase no literal)') == 'B2'


def test_nota_jerga_minimo_c1():
    assert N.NIVELES.index(nv('Hang out (jerga)')) >= N.NIVELES.index('C1')


def test_acotacion_pesa_menos():
    assert N.nivel_entrada('Rain pattering (acotación)')['peso'] == 0.3


def test_compuesta_no_es_c2():
    assert nv('Stepsisters') != 'C2'


def test_otro_idioma_no_cuenta():
    assert N.es_extranjera('bonjour') and N.es_extranjera('gracias')
    assert not N.es_extranjera('court') and not N.es_extranjera('fiancé')
    assert nv('Je ne sais quoi?') is None


def test_nivel_texto():
    assert N.nivel_texto(4.2) == 'B2'
    assert N.nivel_texto(4.5) == 'B2-C1'
    assert N.nivel_texto(4.7) == 'C1'
    assert N.nivel_texto(6.0) == 'C2'


def test_cobertura_y_velocidad():
    subs = [('', 0.0, 2.0, 'I want to go home now.'), ('', 3.0, 5.0, 'Where is my car?')]
    p = N.perfil_dialogos(subs)
    # 10 palabras en 4 segundos de subtítulos = 150 por minuto; todo es A1
    assert p['cobertura95'] == 1.0 and p['ppm'] == 150.0


def test_tema_especializado_sube_y_nombre_no_cuenta():
    legal = N.perfil_temas(['Subpoena', 'Plaintiff'], [('', 0, 1, 'The jury reached a verdict in court.')])['legal']
    assert legal['dialogos_por_mil'] > 0 and legal['vocabulario_pct'] == 100.0
    nombre = N.perfil_temas([], [('', 0, 1, 'Sue is here.')])['legal']
    assert nombre['dialogos_por_mil'] == 0


if __name__ == '__main__':
    for nombre, f in list(globals().items()):
        if nombre.startswith('test_'):
            f()
            print('ok', nombre)
