export interface TopWord {
  word: string;
  count: number;
  translation: string;
}

export interface Episode {
  name: string;
  count: number;
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
  rating?: string;
}

export interface YearlyData {
  year: string;
  words: number;
  dialogues?: number;
}

export interface ManifestYear {
  totalWords: number;
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
