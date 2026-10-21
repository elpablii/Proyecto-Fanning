import type { Papel } from '@/lib/realeza';

export interface TopWord {
  word: string;
  count: number;
  translation: string;
}

export interface Episode {
  code?: string;   // código del episodio en las series: "S01E01", "SP01"
  name: string;
  count: number;
  dialogues?: number;
  level?: string;
  duration?: number | null;  // minutos
}

export interface MovieStats {
  title: string;
  count: number;
  type?: 'series' | 'movie';
  dialogues?: number;
  episodes: Episode[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
  level?: string;
  levelRange?: [string, string] | null;  // series: episodio más fácil y más difícil
  rating?: string;
  duration?: number | null;  // minutos (series: suma de los episodios)
  aliases?: string[];
  years?: string[];
  realeza?: Record<string, Papel[]>;  // artistas de la Realeza y cómo participan (ver lib/realeza.ts)
  // De TMDB (scripts/metricas/origen_tmdb.py)
  genres?: string[];
  releaseDate?: string;      // "2019-04-12"; series: la del primer episodio
}

export interface YearlyData {
  year: string;
  words: number;
  dialogues?: number;
}

export interface ManifestYear {
  totalWords: number;
  totalDialogues: number;
  uniqueMovies: number;
  topWord: TopWord;
  topList: TopWord[];
  movieList: MovieStats[];
}

// Lo que la portada necesita de cada título: sin episodios ni fondos, para no mandar el
// manifest entero al navegador. `aliases` y `years` solo van en el histórico (los usa el buscador).
export type TituloResumen = Pick<MovieStats, 'title' | 'count' | 'type' | 'dialogues' | 'posterUrl' | 'level' | 'rating' | 'aliases' | 'years' | 'realeza'> & {
  color?: string | null;   // sacado del póster (ver getColores)
};

export interface PortadaAnio extends Omit<ManifestYear, 'movieList'> {
  movieList: TituloResumen[];
}

// "all" y cada ciclo ("2025"…), ver getPortada() en lib/data.ts.
export type PortadaData = Record<string, PortadaAnio>;

export interface ManifestData {
  yearlyData?: YearlyData[];
  all?: ManifestYear;
  [year: string]: ManifestYear | YearlyData[] | undefined;
}
