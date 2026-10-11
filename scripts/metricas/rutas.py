import os

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DATA = os.path.join(RAIZ, 'fanning-dashboard', 'public', 'data')
CATALOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'catalogo.json')
REPORTE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reporte_ultima_actualizacion.md')
ANIOS = ['2023', '2024', '2025', '2026', '2027']


def rel(ruta):
    return os.path.relpath(ruta, RAIZ).replace('\\', '/')


def absoluta(ruta_rel):
    return os.path.join(RAIZ, *ruta_rel.split('/'))
