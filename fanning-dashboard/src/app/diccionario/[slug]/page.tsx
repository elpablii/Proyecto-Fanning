import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Crown, Film, NotebookPen, Quote, Repeat, Shapes } from 'lucide-react';
import FondoAnimado from '@/components/ui/FondoAnimado';
import { getDiccionario, getFrasesDiccionario, getRealeza, getTodos, type Diccionario, type FraseDiccionario } from '@/lib/data';
import { hrefPalabra, slugBase, slugsDiccionario } from '@/lib/diccionario';
import { COLOR_GRUPO, etiqueta } from '@/lib/etiquetas';
import { miles, minuto } from '@/lib/formato';
import { hrefArtista, hrefTitulo, ordenGrupo } from '@/lib/realeza';
import { tmdb } from '@/lib/tmdb';

// Son ~28.000 palabras: ninguna página se arma en el build. Cada una se genera la primera vez que
// alguien la abre y queda guardada (los datos solo cambian con un nuevo deploy).
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

// Lo que se lee una sola vez por servidor: el diccionario, las frases y la dirección de cada palabra.
let cache: (Diccionario & { frases: FraseDiccionario[][]; slugs: string[]; indice: Map<string, number> }) | null = null;
function diccionario() {
  if (!cache) {
    const datos = getDiccionario();
    const slugs = slugsDiccionario(datos.palabras);
    cache = { ...datos, frases: getFrasesDiccionario(), slugs, indice: new Map(slugs.map((s, i) => [s, i])) };
  }
  return cache;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { palabras, indice } = diccionario();
  const p = palabras[indice.get(slug) ?? -1];
  return p
    ? { title: `${p[0]} - Diccionario Fanning`, description: `${p[0]}: ${p[1]}. Dónde apareció en el Proyecto Fanning y en qué tanda se aprendió.` }
    : { title: 'Diccionario Fanning - Proyecto Fanning' };
}

const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const palabrasDe = (t: string) => plano(t).split(/[^a-z0-9]+/).filter(Boolean);
const VACIAS = new Set(['someone', 'something', 'somebody', 'the', 'and', 'you', 'your', 'that', 'this', 'with', 'for', 'have', 'are', 'was', 'his', 'her', 'its', 'not', 'but', 'they', 'them', 'what', 'from', 'out', 'all', 'just', 'get', 'got']);

// La entrada resaltada dentro de la línea del subtítulo. Cada palabra puede venir conjugada
// ("rely" -> "relied") y entre ellas puede haber signos o saltos de línea.
function resaltar(texto: string, palabra: string): ReactNode {
  const partes = palabrasDe(palabra).map(w => {
    const raiz = w.length >= 4 && /[ey]$/.test(w) ? w.slice(0, -1) : w;
    return w.length >= 4 ? `${raiz}[a-z]{0,4}` : raiz;
  });
  if (!partes.length) return texto;
  const m = new RegExp(`(?<![a-z])${partes.join('[^a-z0-9]+(?:[a-z0-9]+[^a-z0-9]+){0,3}?')}(?![a-z])`).exec(plano(texto));
  // plano() no cambia el largo del texto (las tildes se quitan de a una letra), así que las posiciones coinciden.
  if (!m || plano(texto).length !== texto.length) return texto;
  return <>{texto.slice(0, m.index)}<mark className="bg-emerald-400/25 text-emerald-100 rounded px-0.5">{texto.slice(m.index, m.index + m[0].length)}</mark>{texto.slice(m.index + m[0].length)}</>;
}

function Seccion({ titulo, icono: Icono, children }: { titulo: string; icono: typeof Quote; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] font-semibold text-emerald-300">
        <Icono size={16} aria-hidden /> {titulo}
      </h2>
      {children}
    </section>
  );
}

export default async function PalabraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { palabras, slugs, indice, titulos, tandas, frases: todasLasFrases } = diccionario();
  const i = indice.get(slug);
  if (i === undefined) notFound();

  const frases = todasLasFrases[i] ?? [];
  const [palabra, traduccion, veces, enTitulos, tanda, otras, etiquetas, contexto] = palabras[i];
  const porTitulo = new Map(getTodos().map(m => [`${m.type ?? 'movie'}:${m.title}`, m]));
  const ficha = (n: number) => porTitulo.get(`${titulos[n].type}:${titulos[n].title}`);
  const cuando = tanda !== null ? tandas[tanda] : null;

  // Los mismos títulos, con su línea si se encontró; los que no tienen ninguna van al final.
  const conFrase = new Set(frases.map(f => f[0]));
  const sinFrase = enTitulos.filter(n => !conFrase.has(n));

  const enUso = new Set(enTitulos.flatMap(n => Object.keys(ficha(n)?.realeza ?? {})));
  const realeza = getRealeza().filter(a => enUso.has(a.nombre) && a.foto)
    .sort((a, b) => ordenGrupo(a) - ordenGrupo(b) || a.nombre.localeCompare(b.nombre));

  // La misma palabra con otro significado (otra entrada del diccionario).
  const base = slugBase(palabra);
  const significados = palabras.map((p, k) => k).filter(k => k !== i && slugBase(palabras[k][0]) === base);

  // Relacionadas: si es una palabra suelta, las frases que la usan; si es una frase, las palabras
  // sueltas del diccionario que aparecen en ella.
  const propias = palabrasDe(palabra);
  const suelta = propias.length === 1;
  const clave = new Set(propias.filter(w => w.length >= 3 && !VACIAS.has(w)));
  const relacionadas = clave.size ? palabras.map((p, k) => k).filter(k => {
    if (k === i || slugBase(palabras[k][0]) === base) return false;
    const otrasPalabras = palabrasDe(palabras[k][0]);
    return suelta
      ? otrasPalabras.length > 1 && otrasPalabras.some(w => clave.has(w))
      : otrasPalabras.length === 1 && clave.has(otrasPalabras[0]);
  }).sort((a, b) => palabras[b][2] - palabras[a][2]).slice(0, 12) : [];

  const anterior = i > 0 ? i - 1 : null;
  const siguiente = i < palabras.length - 1 ? i + 1 : null;

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="diccionario" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-10">
        <Link href="/diccionario" className="inline-flex items-center text-gray-400 hover:text-white transition text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al diccionario
        </Link>

        <header className="animate-fade-in">
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-emerald-300 flex items-center gap-2 mb-3">
            <BookOpen size={14} aria-hidden /> Diccionario Fanning
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white break-words">{palabra}</h1>
          <p className="text-xl md:text-2xl text-gray-300 mt-3 break-words">{traduccion}</p>
          {(etiquetas?.length || contexto) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {etiquetas?.map(e => {
                const et = etiqueta(e);
                return (
                  <Link key={e} href={`/diccionario?etiqueta=${e.startsWith('idioma-') ? 'idioma' : e}`} title={et.definicion}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold hover:brightness-125 transition ${COLOR_GRUPO[et.grupo]}`}>
                    {et.nombre}
                  </Link>
                );
              })}
              {contexto && <span className="text-sm text-gray-400 italic">({contexto})</span>}
            </div>
          )}
          <dl className="mt-6 flex flex-wrap gap-3">
            {[
              [Repeat, 'Veces anotada', miles(veces)],
              [Film, enTitulos.length === 1 ? 'Título' : 'Títulos', miles(enTitulos.length)],
              [CalendarDays, 'Aprendida en', cuando ? `${tanda}° Tanda · ${cuando[0].split('-').reverse().join('/')}` : 'Todavía sin tanda'],
            ].map(([Icono, etiquetaDato, valor]) => {
              const I = Icono as typeof Repeat;
              return (
                <div key={etiquetaDato as string} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                  <dt className="text-xs text-gray-400 flex items-center gap-1.5"><I size={13} className="text-emerald-400" aria-hidden /> {etiquetaDato as string}</dt>
                  <dd className="text-lg font-extrabold text-white">{valor as string}</dd>
                </div>
              );
            })}
          </dl>
        </header>

        <Seccion titulo="Dónde la escuché" icono={Quote}>
          <ol className="space-y-3">
            {frases.map(([n, episodio, segundo, texto]) => {
              const t = titulos[n];
              const poster = ficha(n)?.posterUrl;
              return (
                <li key={`${n}-${episodio}`} className="flex gap-4 rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                  <Link href={hrefTitulo(t)} className="shrink-0">
                    {poster
                      ? <img src={tmdb(poster, 'w92')} alt={t.title} loading="lazy" className="w-12 h-[4.5rem] rounded-md object-cover" />
                      : <span className="block w-12 h-[4.5rem] rounded-md bg-gray-700" />}
                  </Link>
                  <div className="min-w-0">
                    <blockquote className="text-lg text-gray-100 leading-snug">“{resaltar(texto, palabra)}”</blockquote>
                    <p className="text-xs text-gray-400 mt-2">
                      <Link href={hrefTitulo(t)} className="text-gray-200 font-semibold hover:underline">{t.title}</Link>
                      {[episodio, segundo !== null ? minuto(segundo) : null].filter(Boolean).map(x => ` · ${x}`).join('')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {sinFrase.length > 0 && (
            <div className="text-sm text-gray-400">
              <p>{frases.length ? 'También en' : 'Apareció en'} (sin la línea exacta en los subtítulos):</p>
              <ul className="flex flex-wrap gap-1.5 mt-2">
                {sinFrase.map(n => (
                  <li key={n}>
                    <Link href={hrefTitulo(titulos[n])} className="inline-block rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-xs text-gray-200 transition">
                      {titulos[n].title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Seccion>

        {significados.length > 0 && (
          <Seccion titulo="Otros significados" icono={Shapes}>
            <ul className="grid sm:grid-cols-2 gap-3">
              {significados.map(k => (
                <li key={k}>
                  <Link href={hrefPalabra(slugs[k])} className="block rounded-xl border border-white/10 bg-gray-900/60 hover:border-white/25 px-4 py-3 transition">
                    <span className="font-bold text-white">{palabras[k][0]}</span>
                    <span className="block text-sm text-gray-400">{palabras[k][1]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {otras && otras.length > 0 && (
          <Seccion titulo="Cómo quedó anotada" icono={NotebookPen}>
            <ul className="space-y-1.5 text-sm text-gray-300">
              {otras.map(o => <li key={o} className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">{o}</li>)}
            </ul>
          </Seccion>
        )}

        {realeza.length > 0 && (
          <Seccion titulo="La Realeza en esos títulos" icono={Crown}>
            <p className="text-sm text-gray-400 -mt-1">No se sabe quién la dijo: solo que estaban ahí.</p>
            <ul className="flex flex-wrap gap-3">
              {realeza.map(a => (
                <li key={a.nombre}>
                  <Link href={hrefArtista(a.nombre)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 pl-1 pr-3 py-1 transition">
                    <img src={tmdb(a.foto!, 'w92')} alt="" loading="lazy"
                      className={`w-8 h-8 rounded-full object-cover object-top ring-1 ${a.tipo === 'rey' ? 'ring-amber-300/70' : 'ring-pink-300/70'}`} />
                    <span className="text-sm text-gray-200">{a.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {relacionadas.length > 0 && (
          <Seccion titulo={suelta ? 'En otras frases' : 'Palabras de esta frase'} icono={BookOpen}>
            <ul className="flex flex-wrap gap-2">
              {relacionadas.map(k => (
                <li key={k}>
                  <Link href={hrefPalabra(slugs[k])} title={palabras[k][1]}
                    className="inline-block rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-gray-200 transition">
                    {palabras[k][0]}
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        <nav className="flex justify-between gap-3 pt-4 border-t border-white/10 text-sm">
          {anterior !== null ? (
            <Link href={hrefPalabra(slugs[anterior])} className="inline-flex items-center gap-2 text-gray-400 hover:text-white min-w-0">
              <ArrowLeft size={16} className="shrink-0" /> <span className="truncate">{palabras[anterior][0]}</span>
            </Link>
          ) : <span />}
          {siguiente !== null && (
            <Link href={hrefPalabra(slugs[siguiente])} className="inline-flex items-center gap-2 text-gray-400 hover:text-white min-w-0 text-right">
              <span className="truncate">{palabras[siguiente][0]}</span> <ArrowRight size={16} className="shrink-0" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
