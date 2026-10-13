// Tipos de public/data/pelis/<título>.json (lo genera `python fanning.py actualizar`).

export interface VocabItem {
  word: string;
  translation: string;
}

// Datos de TMDB de un episodio, guardados por código ("S02E01").
export interface TmdbEpisode {
  name?: string;
  still_path?: string;
  overview?: string;
}

export interface ExtraEpisode {
  code: string;
  name: string;
  level?: string;
  englishAnalysis?: string;
  vocabulary: VocabItem[];
  count: number;
  dialogues: number;
}

export interface ExtraData {
  title: string;
  level?: string;
  englishAnalysis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  tmdb?: {
    overview?: string;
    photos?: string[];
    episodes?: Record<string, TmdbEpisode>;
  };
  vocabulary?: VocabItem[];   // películas
  episodes?: ExtraEpisode[];  // series
  count: number;
  dialogues: number;
}
