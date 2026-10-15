import os

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
# Fuera de public/: la página lo lee en el build, no hace falta publicarlo tal cual.
DATA = os.path.join(RAIZ, 'fanning-dashboard', 'data')
REPORTE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reporte_ultima_actualizacion.md')
# Los años salen de las carpetas de Vocabularios/ (2023, 2024, ...): un año nuevo no requiere tocar código.
ANIOS = sorted(d for d in os.listdir(os.path.join(RAIZ, 'Vocabularios'))
               if d.isdigit() and os.path.isdir(os.path.join(RAIZ, 'Vocabularios', d)))


def rel(ruta):
    return os.path.relpath(ruta, RAIZ).replace('\\', '/')


def absoluta(ruta_rel):
    return os.path.join(RAIZ, *ruta_rel.split('/'))
