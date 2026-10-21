"""Comando único del Proyecto Fanning para manejar el contenido de la página.

  python fanning.py nuevo                          detecta PDFs nuevos y crea o completa fichas
  python fanning.py actualizar [--probar]          cuenta todo y actualiza la página
  python fanning.py tandas                         regenera la línea de tiempo y el diccionario (rápido)
  python fanning.py quitar "Título" [--retirar-pdfs]
  python fanning.py imagenes "Título" [--id N]     póster, fondo, fotos y duración desde TMDB (y episodios en series)
  python fanning.py pendientes                     qué datos faltan completar en las fichas
  python fanning.py ids [--guardar]                busca en TMDB el id de las fichas que no lo tienen
  python fanning.py realeza [--rehacer]            fotos de la Realeza y en qué títulos participa cada artista (TMDB)
  python fanning.py citas                          verifica las citas de la Realeza contra los subtítulos
  python fanning.py contextos                      la frase original de cada palabra del diccionario (relee los diálogos)
  python fanning.py colores [--rehacer]            el color de cada título, sacado de su póster
  python fanning.py origen [--rehacer]             géneros y fecha de estreno de cada título (TMDB)
  python fanning.py revisar ortografia             faltas de ortografía y puntuación de los vocabularios
  python fanning.py revisar dialogos "ruta.pdf"    conteo de un PDF de diálogos, página por página
  python fanning.py probar                         corre las pruebas del conteo
  python fanning.py validar                        revisa las fichas (sin contar nada); falla si hay errores

Los detalles de cada paso están en README.md.
"""
import argparse
import os
import shutil
import sys
from collections import defaultdict

RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(RAIZ, 'scripts', 'metricas'))

import fichas as F  # noqa: E402
from conteo import normalizar  # noqa: E402
from rutas import absoluta  # noqa: E402


def correr(modulo, *argumentos):
    """Ejecuta el main() de un script de scripts/metricas con esos argumentos."""
    viejo = sys.argv
    sys.argv = [modulo.__name__ + '.py', *argumentos]
    try:
        modulo.main()
    finally:
        sys.argv = viejo


def buscar_ficha(titulo, lista):
    """Ficha por título exacto, sin importar mayúsculas ni tildes, o por nombre de archivo."""
    for f in lista:
        if titulo in (f['titulo'], F.slug(f['titulo'])) or normalizar(titulo) == normalizar(f['titulo']):
            return f
    parecidas = [f['titulo'] for f in lista if normalizar(titulo) in normalizar(f['titulo'])]
    mensaje = f'No hay ninguna ficha con el título "{titulo}".'
    if parecidas:
        mensaje += ' ¿Quisiste decir: ' + ', '.join(f'"{p}"' for p in parecidas[:5]) + '?'
    sys.exit(mensaje)


# ------------------------------------------------------------------ comandos

def cmd_nuevo(args):
    import nuevos_titulos
    correr(nuevos_titulos)
    cmd_pendientes(args, solo_nuevas=True)


def cmd_actualizar(args):
    import actualizar
    correr(actualizar, *([] if args.probar else ['--escribir']))


def cmd_tandas(args):
    import linea_tiempo
    import diccionario
    correr(linea_tiempo)
    correr(diccionario)  # la tanda en que se aprendió cada palabra sale de las tandas


def cmd_quitar(args):
    lista, _, _ = F.cargar(estricto=False)
    ficha = buscar_ficha(args.titulo, lista)
    pdfs = ficha['pdfs']['vocabulario'] + [F.ruta_dialogo(d) for d in ficha['pdfs'].get('dialogos', [])]
    print(f'Se va a quitar "{ficha["titulo"]}" ({ficha["tipo"]}) de la página.')
    if args.retirar_pdfs:
        print(f'Sus {len(pdfs)} PDFs se moverán a Retirados/ (no se borran).')
    else:
        print('Sus PDFs se quedan donde están. Si corres "nuevo", volverá a ofrecer una ficha para ellos;'
              ' usa --retirar-pdfs para que no pase.')
    if not args.si and input('¿Continuar? (s/n) ').strip().lower() not in ('s', 'si', 'sí'):
        print('No se quitó nada.')
        return
    if args.retirar_pdfs:
        for r in pdfs:
            origen = absoluta(r)
            if os.path.exists(origen):
                destino = os.path.join(RAIZ, 'Retirados', *r.split('/'))
                os.makedirs(os.path.dirname(destino), exist_ok=True)
                shutil.move(origen, destino)
    os.remove(F.ruta_ficha(ficha['titulo']))
    print(f'Ficha borrada: contenido/titulos/{F.slug(ficha["titulo"])}.json')
    import actualizar
    correr(actualizar, '--escribir')


def cmd_imagenes(args):
    import posters_tmdb
    lista, _, _ = F.cargar()
    ficha = buscar_ficha(args.titulo, lista)
    argumentos = [ficha['titulo']]
    if args.id:
        argumentos += ['--id', str(args.id)]
        if ficha['tipo'] == 'serie':
            argumentos.append('--serie')
    if args.rehacer:
        argumentos.append('--rehacer')
    correr(posters_tmdb, *argumentos)
    if ficha['tipo'] == 'serie':
        import episodios_tmdb
        correr(episodios_tmdb, '--serie', ficha['titulo'], *(['--rehacer'] if args.rehacer else []))
    import duracion_tmdb
    correr(duracion_tmdb, '--titulo', ficha['titulo'], *(['--rehacer'] if args.rehacer else []))
    print('\nPara verlo en la página: python fanning.py actualizar')


def cmd_ids(args):
    import buscar_ids_tmdb
    correr(buscar_ids_tmdb, *(['--guardar'] if args.guardar else []))


def cmd_realeza(args):
    import realeza_tmdb
    correr(realeza_tmdb, *(['--rehacer'] if args.rehacer else []))


def cmd_citas(args):
    import citas
    correr(citas)


def cmd_contextos(args):
    import contexto
    import diccionario
    correr(contexto)
    correr(diccionario)  # el diccionario toma de ahí la frase de cada palabra


def cmd_origen(args):
    import origen_tmdb
    correr(origen_tmdb, *(['--rehacer'] if args.rehacer else []))


def cmd_colores(args):
    import colores
    correr(colores, *(['--rehacer'] if args.rehacer else []))


def cmd_pendientes(args, solo_nuevas=False):
    lista, errores, avisos = F.cargar(estricto=False)
    if errores:
        print('\nErrores (impiden actualizar la página):')
        for e in errores:
            print('  -', e)
    por_titulo = defaultdict(list)
    for a in avisos:
        titulo, _, detalle = a.partition(': ')
        por_titulo[titulo].append(detalle)
    if solo_nuevas:
        # tras "nuevo", mostrar solo las fichas a las que les falta lo básico
        por_titulo = {t: d for t, d in por_titulo.items() if any('nivel' in x or 'clasificacion' in x for x in d)}
    if not por_titulo:
        if not errores:
            print('\nNo hay datos pendientes.' if not solo_nuevas else '')
        return
    print(f'\nDatos pendientes en {len(por_titulo)} fichas (contenido/titulos/):')
    for t in sorted(por_titulo, key=normalizar):
        print(f'  {t} ({F.slug(t)}.json)')
        for d in por_titulo[t]:
            print(f'     - {d}')


def cmd_revisar(args):
    if args.que == 'ortografia':
        import revisar_ortografia
        correr(revisar_ortografia)
    else:
        if not args.pdf:
            sys.exit('Indica el PDF: python fanning.py revisar dialogos "Diálogos/…/archivo.pdf" [--serie]')
        import verificar_dialogos
        correr(verificar_dialogos, args.pdf, *(['--serie'] if args.serie else []))


def cmd_validar(args):
    lista, _, avisos = F.cargar()  # se detiene con exit 1 y explica qué corregir si hay errores
    print(f'{len(lista)} fichas sin errores ({len(avisos)} datos pendientes: python fanning.py pendientes).')


def cmd_probar(args):
    import test_conteo
    import test_nivel
    pruebas = [f for modulo in (test_conteo, test_nivel) for n, f in vars(modulo).items() if n.startswith('test_')]
    fallidas = 0
    for prueba in pruebas:
        try:
            prueba()
        except AssertionError:
            fallidas += 1
            print('FALLA', prueba.__name__)
    print(f'{len(pruebas) - fallidas} de {len(pruebas)} pruebas pasan.')
    sys.exit(1 if fallidas else 0)


def main():
    ap = argparse.ArgumentParser(prog='python fanning.py', description='Manejo del contenido del Proyecto Fanning.')
    sub = ap.add_subparsers(dest='comando', required=True, metavar='comando')

    p = sub.add_parser('nuevo', help='detecta PDFs nuevos y crea o completa fichas')
    p.set_defaults(fn=cmd_nuevo)

    p = sub.add_parser('actualizar', help='cuenta todo y actualiza la página')
    p.add_argument('--probar', action='store_true', help='solo muestra qué cambiaría, sin escribir')
    p.set_defaults(fn=cmd_actualizar)

    p = sub.add_parser('tandas', help='regenera solo la línea de tiempo (después de editar contenido/tandas.json)')
    p.set_defaults(fn=cmd_tandas)

    p = sub.add_parser('quitar', help='quita una película o serie de la página')
    p.add_argument('titulo')
    p.add_argument('--retirar-pdfs', action='store_true', help='mueve sus PDFs a Retirados/')
    p.add_argument('--si', action='store_true', help='no pide confirmación')
    p.set_defaults(fn=cmd_quitar)

    p = sub.add_parser('imagenes', help='póster, fondo y fotos desde TMDB')
    p.add_argument('titulo')
    p.add_argument('--id', type=int, help='id en TMDB (se guarda en la ficha)')
    p.add_argument('--rehacer', action='store_true', help='reemplaza también sinopsis y fotos')
    p.set_defaults(fn=cmd_imagenes)

    p = sub.add_parser('pendientes', help='qué datos faltan completar en las fichas')
    p.set_defaults(fn=cmd_pendientes)

    p = sub.add_parser('ids', help='busca en TMDB el id de las fichas que no lo tienen')
    p.add_argument('--guardar', action='store_true', help='guarda los ids confirmados por el póster')
    p.set_defaults(fn=cmd_ids)

    p = sub.add_parser('realeza', help='fotos de la Realeza y en qué títulos participa cada artista (TMDB)')
    p.add_argument('--rehacer', action='store_true', help='vuelve a pedir las fotos y las fechas de nacimiento')
    p.set_defaults(fn=cmd_realeza)

    p = sub.add_parser('citas', help='verifica las citas de la Realeza contra los subtítulos y anota dónde están')
    p.set_defaults(fn=cmd_citas)

    p = sub.add_parser('contextos', help='busca en los subtítulos la línea donde apareció cada palabra del diccionario')
    p.set_defaults(fn=cmd_contextos)

    p = sub.add_parser('origen', help='géneros y fecha de estreno de cada título (TMDB)')
    p.add_argument('--rehacer', action='store_true', help='vuelve a pedirlos aunque ya estén en la ficha')
    p.set_defaults(fn=cmd_origen)

    p = sub.add_parser('colores', help='el color de cada título, sacado de su póster (para teñir su ficha)')
    p.add_argument('--rehacer', action='store_true', help='vuelve a calcular todos los colores')
    p.set_defaults(fn=cmd_colores)

    p = sub.add_parser('revisar', help='revisiones de ortografía o de un PDF de diálogos')
    p.add_argument('que', choices=['ortografia', 'dialogos'])
    p.add_argument('pdf', nargs='?')
    p.add_argument('--serie', action='store_true')
    p.set_defaults(fn=cmd_revisar)

    p = sub.add_parser('probar', help='corre las pruebas del conteo')
    p.set_defaults(fn=cmd_probar)

    p = sub.add_parser('validar', help='revisa las fichas sin contar nada (lo usa la revisión automática)')
    p.set_defaults(fn=cmd_validar)

    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
