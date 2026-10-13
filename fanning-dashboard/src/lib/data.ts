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

export interface Tanda {
  id: number;
  title: string;
  date: string;
  items: string[];
}

export function getTandas(): Tanda[] {
  return leer<Tanda[]>('timeline.json') ?? [];
}
