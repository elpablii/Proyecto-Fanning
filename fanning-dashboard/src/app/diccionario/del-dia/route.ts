import { getDiccionario, getFrasesDiccionario, getTodos } from '@/lib/data';
import { slugsDiccionario } from '@/lib/diccionario';
import { hrefTitulo } from '@/lib/realeza';
import type { PalabraDelDia } from '@/components/portada/PalabraDelDia';

// Las candidatas a palabra o frase del día, como un JSON aparte que se genera en el build.
// La portada lo pide al abrirse y elige la de hoy con la fecha del navegador (una por día, en orden).
export const dynamic = 'force-static';

const CANDIDATAS = 366;
// Las acotaciones ("[menacing music playing]"), siglas, insultos y palabras de otro idioma no van.
const FUERA = new Set(['acotacion', 'sigla', 'despectivo']);

// Un número fijo por palabra (FNV-1a), para mezclarlas igual en cada build: si se agregan
// palabras nuevas, las que ya estaban conservan su orden entre sí.
function huella(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function GET() {
  const { titulos, tandas, palabras } = getDiccionario();
  const frases = getFrasesDiccionario();
  const slugs = slugsDiccionario(palabras);
  const posters = new Map(getTodos().map(m => [`${m.type ?? 'movie'}:${m.title}`, m.posterUrl]));

  const candidatas: PalabraDelDia[] = [];
  palabras.forEach(([palabra, traduccion, , , tanda, , etiquetas], i) => {
    // La primera línea donde se resalta la entrada tal cual (en el orden en que se aprendió).
    const frase = (frases[i] ?? []).find(f => f[4] != null && !f[7] && f[3].length <= 140);
    if (!frase || tanda == null || palabra.length > 60) return;
    if (etiquetas?.some(e => FUERA.has(e) || e.startsWith('idioma-'))) return;
    const [n, episodio, segundo, texto, inicio, fin, veces] = frase;
    const t = titulos[n];
    candidatas.push({
      palabra, traduccion, slug: slugs[i], titulo: t.title, href: hrefTitulo(t),
      poster: posters.get(`${t.type}:${t.title}`) ?? null, episodio, segundo, texto,
      inicio: inicio!, fin: fin!, veces, tanda, fecha: tandas[tanda]?.[0] ?? null,
    });
  });
  candidatas.sort((a, b) => huella(a.palabra) - huella(b.palabra) || a.slug.localeCompare(b.slug));
  return Response.json(candidatas.slice(0, CANDIDATAS));
}
