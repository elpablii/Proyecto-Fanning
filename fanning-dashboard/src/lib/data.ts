// Lectura de public/data/ en el servidor (en el build). Todo lo de esa carpeta lo genera
// `python fanning.py actualizar`; acá solo se lee.
import fs from 'fs';
import path from 'path';
import { ManifestData, ManifestYear, MovieStats } from '@/types/manifest';
import { ExtraData } from '@/types/media';

const DATA = path.join(process.cwd(), 'public', 'data');

function leer<T>(archivo: string): T | null {
  const ruta = path.join(DATA, archivo);
  if (!fs.existsSync(ruta)) return null;
  return JSON.parse(fs.readFileSync(ruta, 'utf8')) as T;
}

export function getManifest(): ManifestData | null {
  return leer<ManifestData>('manifest.json');
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

export interface Tanda {
  id: number;
  title: string;
  date: string;               // "Sábado, 17/01/2026"
  fecha: string;              // "2026-01-17"
  anio: string;               // ciclo al que pertenece
  etiqueta: 'gala' | 'navidad' | 'fin' | null;
  palabras: number;
  lineas: number;
  comprension: number | null;
  duracion: number;           // minutos
  duracionEstimada: boolean;
  dosSesiones: boolean;       // más de 5 horas: se divide en Día n-1 y Día n (ver Reglas)
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
}

export function getLineaDeTiempo(): { ciclos: Ciclo[]; tandas: Tanda[] } {
  return leer<{ ciclos: Ciclo[]; tandas: Tanda[] }>('timeline.json') ?? { ciclos: [], tandas: [] };
}
