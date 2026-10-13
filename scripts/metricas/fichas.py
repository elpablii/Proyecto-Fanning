"""Fichas de títulos: contenido/titulos/<slug>.json.

Una ficha por película o serie, con todo lo que se edita a mano:

{
  "titulo": "Intensamente",
  "tipo": "pelicula",                      # "pelicula" o "serie"
  "nivel": "B1",
  "clasificacion": "TE",                   # TE, TE+7, +14, +18
  "tmdb": {"tipo": "movie", "id": 150540}, # o null si todavía no se sabe
  "analisis": "…",
  "sinopsis": "…", "poster": "https://…", "fondo": "https://…", "fotos": ["https://…"],
  "pdfs": {
    "vocabulario": ["Vocabularios/2024/…pdf"],
    "dialogos": ["Diálogos/…pdf", {"ruta": "Diálogos/…pdf", "episodio": "SP01"}]
  },
  "episodios": {                           # solo series; la clave es el código del episodio
    "S01E01": {"nombre": "S01E01 - Pilot", "nivel": "B2", "analisis": "",
               "titulo": "Pilot", "foto": "https://…", "sinopsis": "…",
               "tmdb": {"tipo": "movie", "id": 784047}}   # solo si TMDB lo tiene como película aparte
  }
}

Todo lo demás (vocabulario, cantidades, manifest) se genera desde los PDFs y
nunca se edita a mano.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rutas import RAIZ, absoluta  # noqa: E402
from conteo import normalizar  # noqa: E402

CARPETA = os.path.join(RAIZ, 'contenido', 'titulos')
TANDAS = os.path.join(RAIZ, 'contenido', 'tandas.json')
NIVELES = {'A1', 'A2', 'B1', 'B2', 'C1', 'C2'}
CLASIFICACIONES = {'TE', 'TE+7', '+14', '+18'}
ORDEN = ['titulo', 'tipo', 'nivel', 'clasificacion', 'tmdb', 'analisis', 'sinopsis', 'poster', 'fondo',
         'fotos', 'pdfs', 'episodios']


def slug(titulo):
    """Nombre de archivo de la ficha: 'The Big Bang Theory' -> 'the-big-bang-theory'."""
    return normalizar(titulo).replace(' ', '-') or 'sin-titulo'


def ruta_ficha(titulo):
    return os.path.join(CARPETA, slug(titulo) + '.json')


def ruta_dialogo(d):
    return d if isinstance(d, str) else d['ruta']


def episodio_fijo(d):
    return None if isinstance(d, str) else d.get('episodio')


def ordenar(ficha):
    salida = {k: ficha[k] for k in ORDEN if k in ficha}
    salida.update({k: v for k, v in ficha.items() if k not in salida})
    if 'episodios' in salida:
        salida['episodios'] = dict(sorted(salida['episodios'].items(), key=lambda kv: orden_episodio(kv[0])))
    return salida


def orden_episodio(clave):
    if clave.startswith('SP'):
        return (1.5, int(clave[2:]))  # los especiales van después de la temporada 1
    return (int(clave[1:3]), int(clave[4:]))


def guardar(ficha):
    os.makedirs(CARPETA, exist_ok=True)
    with open(ruta_ficha(ficha['titulo']), 'w', encoding='utf-8') as f:
        json.dump(ordenar(ficha), f, ensure_ascii=False, indent=2)
        f.write('\n')


def validar(ficha, archivo):
    """Errores (impiden publicar) y avisos (datos pendientes) de una ficha, en español."""
    errores, avisos = [], []
    nombre = os.path.basename(archivo)
    if not ficha.get('titulo'):
        errores.append(f'{nombre}: falta "titulo".')
        return errores, avisos
    t = ficha['titulo']
    if slug(t) + '.json' != nombre:
        errores.append(f'{nombre}: el archivo debería llamarse "{slug(t)}.json" (según su título "{t}").')
    if ficha.get('tipo') not in ('pelicula', 'serie'):
        errores.append(f'{t}: "tipo" debe ser "pelicula" o "serie".')
    pdfs = ficha.get('pdfs') or {}
    if not pdfs.get('vocabulario'):
        errores.append(f'{t}: no tiene ningún PDF de vocabulario en "pdfs.vocabulario".')
    for r in pdfs.get('vocabulario', []) + [ruta_dialogo(d) for d in pdfs.get('dialogos', [])]:
        if not os.path.exists(absoluta(r)):
            errores.append(f'{t}: no existe el PDF "{r}". Corrige la ruta o quítalo de la ficha.')
    for k in ficha.get('episodios') or {}:
        if not re.fullmatch(r'S\d{2}E\d{2}|SP\d{2}', k):
            errores.append(f'{t}: el episodio "{k}" debe tener el formato S01E01 (o SP01 para especiales).')
    if not pdfs.get('dialogos'):
        avisos.append(f'{t}: sin PDF de diálogos (se mostrará con 0 líneas).')
    nivel = ficha.get('nivel')
    if not nivel:
        avisos.append(f'{t}: falta "nivel" (se mostrará B2).')
    elif not set(re.split(r'[/-]', nivel)) <= NIVELES:
        errores.append(f'{t}: el nivel "{nivel}" no es válido (usa A1, A2, B1, B2, C1, C2 o rangos como B1-B2).')
    if not ficha.get('clasificacion'):
        avisos.append(f'{t}: falta "clasificacion" (se mostrará TE).')
    elif ficha['clasificacion'] not in CLASIFICACIONES:
        errores.append(f'{t}: la clasificación "{ficha["clasificacion"]}" no es válida (usa TE, TE+7, +14 o +18).')
    if not ficha.get('tmdb'):
        avisos.append(f'{t}: falta el id de TMDB ("tmdb"); sin él no se pueden actualizar póster ni fotos.')
    if not ficha.get('poster'):
        avisos.append(f'{t}: no tiene póster.')
    return errores, avisos


def cargar(estricto=True):
    """Lee todas las fichas. Con estricto=True corta con un mensaje claro si alguna tiene errores."""
    fichas, errores, avisos = [], [], []
    vistos = {}
    for nombre in sorted(os.listdir(CARPETA)) if os.path.isdir(CARPETA) else []:
        if not nombre.endswith('.json'):
            continue
        archivo = os.path.join(CARPETA, nombre)
        try:
            ficha = json.load(open(archivo, encoding='utf-8'))
        except json.JSONDecodeError as e:
            errores.append(f'{nombre}: el JSON está mal escrito (línea {e.lineno}, columna {e.colno}): {e.msg}.')
            continue
        e, a = validar(ficha, archivo)
        errores += e
        avisos += a
        t = ficha.get('titulo')
        if t in vistos:
            errores.append(f'{nombre} y {vistos[t]} tienen el mismo título "{t}".')
        vistos[t] = nombre
        fichas.append(ficha)
    usados = {}
    for f in fichas:
        pdfs = f.get('pdfs') or {}
        for r in pdfs.get('vocabulario', []) + [ruta_dialogo(d) for d in pdfs.get('dialogos', [])]:
            if r in usados and usados[r] != f['titulo']:
                errores.append(f'El PDF "{r}" está en dos fichas: "{usados[r]}" y "{f["titulo"]}".')
            usados[r] = f['titulo']
    # Cada ítem de la línea de tiempo apunta a una ficha: "Título" o {"texto": "…", "titulo": "Título"}
    for tanda in cargar_tandas():
        for item in tanda.get('items', []):
            titulo = item if isinstance(item, str) else item.get('titulo')
            if titulo not in vistos:
                texto = item if isinstance(item, str) else item.get('texto', titulo)
                errores.append(f'contenido/tandas.json, "{tanda.get("title")}": "{texto}" no corresponde a ninguna ficha. '
                               'Escribe el título exacto de la ficha, o usa {"texto": "…", "titulo": "<título de la ficha>"}.')
    if errores and estricto:
        print('No se puede continuar. Corrige esto en contenido/titulos/:')
        for e in errores:
            print('  -', e)
        sys.exit(1)
    return fichas, errores, avisos


def cargar_tandas():
    if not os.path.exists(TANDAS):
        return []
    return json.load(open(TANDAS, encoding='utf-8'))
