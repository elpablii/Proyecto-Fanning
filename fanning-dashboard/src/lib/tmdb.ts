// TMDB guarda cada imagen en varios anchos (https://image.tmdb.org/t/p/<tamaño>/<archivo>).
// Se pide el más chico que se vea nítido donde se muestra, también en pantallas de alta densidad:
// el fondo de las fichas venía en "original" (hasta 4K) para mostrarse difuminado.
export type TamanoTmdb = 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

export function tmdb(url: string, tamano: TamanoTmdb): string {
  return url.replace(/\/t\/p\/[a-z0-9]+\//, `/t/p/${tamano}/`);
}
