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
export type TituloResumen = Pick<MovieStats, 'title' | 'count' | 'type' | 'dialogues' | 'posterUrl' | 'level' | 'rating' | 'aliases' | 'years'>;

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
