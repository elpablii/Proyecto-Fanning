// Tipos de public/data/pelis/<título>.json (lo genera `python fanning.py actualizar`).

// Nivel de inglés (MCER) calculado por scripts/metricas/nivel.py.
export interface NivelDetalle {
  nivel: string;                 // "B2", "B1-B2"…
  puntaje: number;               // 1 (A1) a 6 (C2)
  senales: { vocabulario: number; dialogos: number; temas: number };
  vocabulario: { distribucion: Record<string, number>; densidad: number | null };
  dialogos: { cobertura95: number; ppm: number | null } | null;
  temas: string[];               // áreas especializadas destacadas
  rango?: [string, string];      // series: nivel del episodio más fácil y del más difícil
}

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
  levelDetail?: NivelDetalle | null;
  englishAnalysis?: string;
  vocabulary: VocabItem[];
  count: number;
  dialogues: number;
  duration?: number | null;       // minutos
  durationEstimated?: boolean;    // sin dato de TMDB: se usó el último subtítulo
}

export interface ExtraData {
  title: string;
  level?: string;
  levelDetail?: NivelDetalle | null;
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
  duration?: number | null;
  durationEstimated?: boolean;
}
