// Nombres de las transiciones entre páginas (React <ViewTransition>, ver next.config.ts):
// un elemento con el mismo nombre en dos páginas "vuela" de una a otra al navegar.
// En una misma página cada nombre puede estar una sola vez.
import { slugArtista } from '@/lib/realeza';

// El póster de un título: del catálogo o de la filmografía de un artista a su ficha.
export function transicionPoster(tipo: 'movie' | 'series' | undefined, titulo: string): string {
  return `poster-${tipo ?? 'movie'}-${slugArtista(titulo)}`;
}

// La foto de un miembro de la Realeza: de su carta, de la Reina o Rey del día o de una ficha a su página.
export function transicionArtista(nombre: string): string {
  return `artista-${slugArtista(nombre)}`;
}
