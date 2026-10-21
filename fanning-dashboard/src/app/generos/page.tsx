import GenerosClient, { type FilaUniverso, type TituloGenero } from '@/components/generos/GenerosClient';
import { getManifest, getTodos } from '@/lib/data';
import type { ManifestYear } from '@/types/manifest';

export const metadata = {
  title: 'Géneros y Épocas - Proyecto Fanning',
  description: 'De qué géneros son las películas y series del Proyecto Fanning y de qué décadas.',
};

export default function GenerosPage() {
  // Lo fijo de cada título (de TMDB), una sola vez; cada universo apunta a ellos por posición.
  const titulos: TituloGenero[] = getTodos().map(m => ({
    title: m.title, type: m.type ?? 'movie', poster: m.posterUrl ?? null,
    genres: m.genres ?? [], year: m.releaseDate ? Number(m.releaseDate.slice(0, 4)) : null,
  }));
  const indice = new Map(titulos.map((t, i) => [`${t.type}:${t.title}`, i]));

  // Las cifras de cada universo son las del inicio: el histórico ("all") y cada ciclo, donde las
  // series cuentan solo sus episodios de ese año (ver getManifest()).
  const universos: Record<string, FilaUniverso[]> = {};
  for (const [anio, datos] of Object.entries(getManifest() ?? {})) {
    if (anio === 'yearlyData' || !datos || Array.isArray(datos)) continue;
    const lista = (datos as ManifestYear).movieList;
    if (!lista.length) continue;
    universos[anio] = lista.map(m => [indice.get(`${m.type ?? 'movie'}:${m.title}`)!, m.count, m.dialogues ?? 0, m.duration ?? 0]);
  }

  return <GenerosClient titulos={titulos} universos={universos} />;
}
