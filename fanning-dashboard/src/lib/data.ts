// Lectura de data/ en el servidor (en el build). Todo lo de esa carpeta lo genera
// `python fanning.py actualizar`; acá solo se lee.
import fs from 'fs';
import path from 'path';
import { ManifestData, ManifestYear, MovieStats, PortadaData } from '@/types/manifest';
import { ExtraData, VocabItem } from '@/types/media';
import { ordenGrupo, slugArtista, type Artista, type ArtistaEnTitulo, type Proximo } from '@/lib/realeza';

// No está en public/: solo se lee en el build y no se publica tal cual (la página manda lo que usa).
const DATA = path.join(process.cwd(), 'data');

function leer<T>(archivo: string): T | null {
  const ruta = path.join(DATA, archivo);
  if (!fs.existsSync(ruta)) return null;
  return JSON.parse(fs.readFileSync(ruta, 'utf8')) as T;
}

export function getManifest(): ManifestData | null {
  return leer<ManifestData>('manifest.json');
}

// El manifest recortado a lo que muestra la portada (ver TituloResumen).
export function getPortada(): PortadaData {
  const manifest = getManifest() ?? {};
  const colores = getColores();
  const portada: PortadaData = {};
  for (const [anio, datos] of Object.entries(manifest)) {
    if (anio === 'yearlyData' || !datos || Array.isArray(datos)) continue;
    portada[anio] = {
      ...datos,
      movieList: datos.movieList.map(m => ({
        title: m.title, count: m.count, type: m.type, dialogues: m.dialogues,
        posterUrl: m.posterUrl, level: m.level, rating: m.rating, realeza: m.realeza, color: colores[m.title] ?? null,
        ...(anio === 'all' && { aliases: m.aliases, years: m.years }),
      })),
    };
  }
  return portada;
}

// El color de cada título, sacado de su póster (python fanning.py colores). null si el póster es casi gris.
export function getColores(): Record<string, string | null> {
  const datos = leer<Record<string, { color: string | null }>>('colores.json') ?? {};
  return Object.fromEntries(Object.entries(datos).map(([t, d]) => [t, d.color]));
}

// La Realeza (copia de contenido/realeza.json, con la foto y el nacimiento que trae TMDB).
export function getRealeza(): Artista[] {
  return leer<Artista[]>('realeza.json') ?? [];
}

// Lo que viene para cada artista (ver Proximo en lib/realeza.ts). Las películas que ya están
// en el proyecto no se repiten aquí.
export function getProximamente(): Record<string, Proximo[]> {
  const datos = leer<Record<string, Proximo[]>>('proximamente.json') ?? {};
  const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const vistos = new Set(getTodos().flatMap(m => [m.title, ...(m.aliases ?? [])]).map(plano));
  return Object.fromEntries(Object.entries(datos).map(([n, lista]) =>
    [n, lista.filter(p => p.tipo === 'serie' || !vistos.has(plano(p.titulo)))]));
}

export function getArtista(slug: string): Artista | null {
  return getRealeza().find(a => slugArtista(a.nombre) === slug) ?? null;
}

// Todo el vocabulario de los títulos de un artista, sin repetir palabras (la primera traducción gana).
// Quiénes de la Realeza están en un título, con los rangos superiores primero.
export function getRealezaDeTitulo(movie: MovieStats): ArtistaEnTitulo[] {
  const papeles = movie.realeza ?? {};
  return getRealeza()
    .filter(a => papeles[a.nombre])
    .sort((a, b) => ordenGrupo(a) - ordenGrupo(b))
    .map(({ nombre, foto, tipo, rango }) => ({ nombre, foto, tipo, rango, papeles: papeles[nombre] }));
}

export function getVocabularioArtista(nombre: string): VocabItem[] {
  const vistas = new Set<string>();
  const vocabulario: VocabItem[] = [];
  for (const m of getTodos()) {
    if (!m.realeza?.[nombre]) continue;
    const extra = getTitulo(m.title, m.type ?? 'movie')?.extraData;
    const items = extra?.vocabulary ?? extra?.episodes?.flatMap(e => e.vocabulary) ?? [];
    for (const v of items) {
      const clave = v.word.trim().toLowerCase();
      if (vistas.has(clave)) continue;
      vistas.add(clave);
      vocabulario.push(v);
    }
  }
  return vocabulario;
}

export function getTodos(): MovieStats[] {
  return (getManifest()?.all as ManifestYear | undefined)?.movieList ?? [];
}

export function getTitulosPorTipo(tipo: 'movie' | 'series'): string[] {
  return getTodos().filter(m => (m.type ?? 'movie') === tipo).map(m => m.title);
}

// Datos de un título. El título se busca primero en el manifest: solo se abre el
// archivo de un título que existe (nunca una ruta armada con texto de la URL).
export function getTitulo(titulo: string, tipo: 'movie' | 'series'): { movieData: MovieStats; extraData: ExtraData | null } | null {
  const movieData = getTodos().find(m => m.title === titulo && (m.type ?? 'movie') === tipo);
  if (!movieData) return null;
  return { movieData, extraData: leer<ExtraData>(path.join('pelis', `${movieData.title}.json`)) };
}

// Diccionario Fanning: lo genera scripts/metricas/diccionario.py con la misma agrupación que el
// ranking de palabras más repetidas, así la suma de las veces da el total de palabras del inicio.
// Cada palabra es una lista (pesa bastante menos que un objeto en ~28.000 palabras):
// [palabra, traducción, veces, índices de títulos, tanda en que se aprendió o null, otras formas?].
export type PalabraDiccionario = [string, string, number, number[], number | null, string[]?];

export interface Diccionario {
  titulos: { title: string; type: 'movie' | 'series' }[];
  tandas: Record<string, [string, string]>;  // número: [fecha "2024-07-15", ciclo]
  palabras: PalabraDiccionario[];
}

export function getDiccionario(): Diccionario {
  return leer<Diccionario>('diccionario.json') ?? { titulos: [], tandas: {}, palabras: [] };
}

// Línea de tiempo: la genera scripts/metricas/linea_tiempo.py a partir de contenido/tandas.json
// y contenido/ciclos.json, con las métricas de cada tanda y de cada ciclo ya calculadas.
export interface ItemTanda {
  texto: string;              // como se escribió en la tanda
  titulo: string;             // título de la ficha
  tipo: 'movie' | 'series';
  poster: string | null;
  nivel: string | null;       // nivel MCER de lo que entró en la tanda
  clasificacion: string | null;
  episodios: number | null;   // series: cuántos episodios entraron
  palabras: number;
  lineas: number;
  comprension: number | null;
  duracion: number | null;    // minutos (series: solo los episodios de la tanda)
  duracionEstimada: boolean;  // sin dato de TMDB: se usó el último subtítulo
}

// Horas de inglés de una tanda, en minutos (ver scripts/metricas/linea_tiempo.py y Reglas).
export interface MinutosIngles {
  vista: number;              // ver el contenido por primera vez
  repaso: number;             // leer el vocabulario en voz alta una vez al día hasta la siguiente tanda
  revision: number;           // volver a verlo después de estudiar el vocabulario
  diasRepaso: number;
}

export interface Tanda {
  id: number;
  title: string;
  numero: number;             // "14a° Tanda" -> 14: las partes a, b, c son UNA sola tanda
  parte: string | null;       // "a", "b"… o null si la tanda no está dividida
  date: string;               // "Sábado, 17/01/2026"
  fecha: string;              // "2026-01-17"
  anio: string;               // ciclo al que pertenece
  etiqueta: 'gala' | 'navidad' | 'fin' | null;
  palabras: number;
  lineas: number;
  comprension: number | null;
  duracion: number;           // minutos
  duracionEstimada: boolean;
  dosSesiones: boolean;       // supera el límite: se divide en Día n-1 y Día n (Regla 11)
  limiteSesion: number;       // minutos: 6 h desde la 69° Tanda, 5 h antes
  ingles: MinutosIngles;
  items: ItemTanda[];
}

export interface Ciclo {
  anio: string;
  nombre: string;
  descripcion: string;
  tandas: number;
  titulos: number;
  palabras: number;
  lineas: number;
  comprension: number | null;
  duracion: number;           // minutos
  minutosIngles: number;      // vista + repaso + revisión de todas sus tandas
}

export function getLineaDeTiempo(): { ciclos: Ciclo[]; tandas: Tanda[] } {
  return leer<{ ciclos: Ciclo[]; tandas: Tanda[] }>('timeline.json') ?? { ciclos: [], tandas: [] };
}

// Una tanda completa: junta sus partes ("14a°" y "14b°" son la 14° Tanda).
export interface TandaCompleta {
  numero: number;
  title: string;              // "14° Tanda"
  date: string;               // fecha de la primera parte
  fecha: string;
  anio: string;
  partes: Tanda[];
  palabras: number;
  lineas: number;
  duracion: number;
  ingles: MinutosIngles;
}

export function agruparTandas(tandas: Tanda[]): TandaCompleta[] {
  const grupos = new Map<number, Tanda[]>();
  for (const t of tandas) grupos.set(t.numero, [...(grupos.get(t.numero) ?? []), t]);
  return [...grupos.entries()].map(([numero, partes]) => {
    const suma = (f: (t: Tanda) => number) => partes.reduce((s, t) => s + f(t), 0);
    return {
      numero,
      title: `${numero}° Tanda`,
      date: partes[0].date,
      fecha: partes[0].fecha,
      anio: partes[0].anio,
      partes,
      palabras: suma(t => t.palabras),
      lineas: suma(t => t.lineas),
      duracion: suma(t => t.duracion),
      ingles: {
        vista: suma(t => t.ingles.vista),
        repaso: suma(t => t.ingles.repaso),
        revision: suma(t => t.ingles.revision),
        diasRepaso: Math.max(...partes.map(t => t.ingles.diasRepaso)),
      },
    };
  });
}

// En qué tandas entró cada título (por número, sin repetir), con la fecha de la primera.
// La clave es "movie:Barbie" o "series:Euphoria".
export interface TandasDeTitulo {
  numeros: number[];
  fecha: string;
  anio: string;
}

export function getTandasPorTitulo(): Map<string, TandasDeTitulo> {
  const mapa = new Map<string, TandasDeTitulo>();
  for (const t of getLineaDeTiempo().tandas) {
    for (const item of t.items) {
      const clave = `${item.tipo}:${item.titulo}`;
      const previa = mapa.get(clave);
      if (!previa) mapa.set(clave, { numeros: [t.numero], fecha: t.fecha, anio: t.anio });
      else if (!previa.numeros.includes(t.numero)) previa.numeros.push(t.numero);
    }
  }
  return mapa;
}
