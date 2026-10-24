import type { PalabraDiccionario } from '@/lib/data';

// La dirección de cada palabra del diccionario: /diccionario/break-down.
// Sin mayúsculas, tildes ni signos; la misma palabra con otro significado ("Creepy": espeluznante /
// pervertido) lleva -2, -3... y el número más bajo es para la que se anotó más veces.
// Se calcula igual en el servidor y en el navegador, a partir de la lista completa.

const RESERVADAS = new Set(['datos', 'del-dia']);

export function slugBase(palabra: string): string {
  const s = palabra.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/^-+|-+$/g, '');
  // "datos" y "del-dia" ya son direcciones: la lista completa y las candidatas a palabra del día.
  return !s ? 'palabra' : RESERVADAS.has(s) ? `${s}-palabra` : s;
}

export function slugsDiccionario(palabras: PalabraDiccionario[]): string[] {
  const porBase = new Map<string, number[]>();
  palabras.forEach((p, i) => {
    const b = slugBase(p[0]);
    porBase.set(b, [...(porBase.get(b) ?? []), i]);
  });
  const slugs = new Array<string>(palabras.length);
  for (const [b, indices] of porBase) {
    [...indices].sort((x, y) => palabras[y][2] - palabras[x][2] || x - y)
      .forEach((i, n) => { slugs[i] = n === 0 ? b : `${b}-${n + 1}`; });
  }
  return slugs;
}

export function hrefPalabra(slug: string): string {
  return `/diccionario/${slug}`;
}
