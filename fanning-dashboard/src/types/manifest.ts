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

export interface ManifestData {
  yearlyData?: YearlyData[];
  all?: ManifestYear;
  [year: string]: ManifestYear | YearlyData[] | undefined;
}
