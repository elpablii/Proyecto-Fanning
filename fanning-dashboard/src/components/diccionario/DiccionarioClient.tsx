"use client";

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CalendarDays, Crown, Layers, Repeat, Search, Shuffle, Sparkles, X } from 'lucide-react';
import { miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { hrefArtista, hrefTitulo, type Artista } from '@/lib/realeza';
import type { Diccionario, PalabraDiccionario } from '@/lib/data';
import FlashcardViewer from '@/components/ui/FlashcardViewer';
import FondoAnimado from '@/components/ui/FondoAnimado';

export interface TituloDiccionario {
  title: string;
  type: 'movie' | 'series';
  poster: string | null;
  realeza: string[];
}

type ArtistaDiccionario = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'>;
type Orden = 'az' | 'repetidas' | 'recientes' | 'antiguas';

const ORDENES: Record<Orden, string> = {
  az: 'A–Z', repetidas: 'Más repetidas', recientes: 'Aprendidas hace poco', antiguas: 'Las primeras que aprendí',
};

const POR_PAGINA = 60;
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Sin mayúsculas ni tildes: "Café" y "cafe" se encuentran igual.
const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// La letra con que se ordena: sin signos al comienzo ("'Cause" va en la C). "#" si empieza con un número.
function letraDe(palabra: string): string {
  const c = plano(palabra).replace(/^[^a-z0-9]+/, '')[0]?.toUpperCase() ?? '#';
  return /[A-Z]/.test(c) ? c : '#';
}

// "2024-07-15" -> "15/07/2024"
const fechaCorta = (iso: string) => iso.split('-').reverse().join('/');

interface Entrada {
  i: number;       // posición en el diccionario (clave única)
  p: PalabraDiccionario;
  texto: string;   // palabra, traducción y otras formas, en plano, para buscar
  letra: string;
}

function Tarjeta({ p, titulos, artistas, tandas, destacada = false }: {
  p: PalabraDiccionario;
  titulos: TituloDiccionario[];
  artistas: Map<string, ArtistaDiccionario>;
  tandas: Diccionario['tandas'];
  destacada?: boolean;
}) {
  const [palabra, traduccion, veces, indices, tanda, otras] = p;
  const [abierta, setAbierta] = useState(false);
  const enTitulos = indices.map(i => titulos[i]);
  const visibles = abierta ? enTitulos : enTitulos.slice(0, 3);
  // Quiénes de la Realeza están en esos títulos (no se sabe quién dijo la palabra: solo que estaban ahí).
  const realeza = [...new Set(enTitulos.flatMap(t => t.realeza))].map(n => artistas.get(n)).filter(a => a?.foto) as ArtistaDiccionario[];
  const cuando = tanda !== null ? tandas[tanda] : null;
  return (
    <article className={`rounded-2xl border p-4 flex flex-col gap-3 transition ${destacada
      ? 'border-emerald-400/40 bg-emerald-500/10 shadow-lg shadow-emerald-900/30'
      : 'border-white/10 bg-gray-900/60 hover:border-white/25'}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`font-extrabold text-white leading-tight break-words ${destacada ? 'text-2xl' : 'text-lg'}`}>{palabra}</h3>
          <p className="text-gray-300 mt-0.5 break-words">{traduccion}</p>
        </div>
        {veces > 1 && (
          <span title={`Anotada ${veces} veces`} className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-xs font-bold px-2 py-0.5">
            <Repeat size={12} aria-hidden /> ×{veces}
          </span>
        )}
      </header>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <CalendarDays size={13} className="text-emerald-400 shrink-0" aria-hidden />
        {cuando
          ? <>Aprendida en la <span className="text-gray-200 font-semibold">{tanda}° Tanda</span> · {fechaCorta(cuando[0])}</>
          : 'Todavía sin tanda'}
      </p>

      <ul className="flex flex-wrap gap-1.5">
        {visibles.map(t => (
          <li key={`${t.type}:${t.title}`}>
            <Link href={hrefTitulo(t)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 pl-0.5 pr-2 py-0.5 text-xs text-gray-200 transition max-w-[14rem]">
              {t.poster
                ? <img src={tmdb(t.poster, 'w92')} alt="" loading="lazy" className="w-4 h-6 rounded-sm object-cover shrink-0" />
                : <span className="w-4 h-6 rounded-sm bg-gray-700 shrink-0" />}
              <span className="truncate">{t.title}</span>
            </Link>
          </li>
        ))}
        {enTitulos.length > 3 && (
          <li>
            <button onClick={() => setAbierta(a => !a)} className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-white/5 transition">
              {abierta ? 'Ver menos' : `+${enTitulos.length - 3} más`}
            </button>
          </li>
        )}
      </ul>

      {(realeza.length > 0 || otras) && (
        <footer className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-1">
          {realeza.length > 0 && (
            <div className="flex items-center -space-x-2" aria-label={`Con ${realeza.map(a => a.nombre).join(', ')}`}>
              {realeza.slice(0, 5).map(a => (
                <Link key={a.nombre} href={hrefArtista(a.nombre)} title={a.nombre}
                  className={`relative rounded-full ring-2 ring-gray-900 hover:z-10 hover:scale-110 transition ${a.tipo === 'rey' ? 'outline outline-1 outline-amber-300/70' : 'outline outline-1 outline-pink-300/70'}`}>
                  <img src={tmdb(a.foto!, 'w92')} alt={a.nombre} loading="lazy" className="w-7 h-7 rounded-full object-cover object-top" />
                </Link>
              ))}
              {realeza.length > 5 && <span className="pl-3 text-[11px] text-gray-400">+{realeza.length - 5}</span>}
            </div>
          )}
          {otras && (
            <details className="text-xs text-gray-400 group/otras ml-auto">
              <summary className="cursor-pointer select-none hover:text-gray-200 list-none">
                Otras formas ({otras.length})
              </summary>
              <ul className="mt-2 space-y-1 text-gray-300">
                {otras.map(o => <li key={o}>{o}</li>)}
              </ul>
            </details>
          )}
        </footer>
      )}
    </article>
  );
}

export default function DiccionarioClient({ titulos, artistas, distintas, anotaciones, repetidas }: {
  titulos: TituloDiccionario[];
  artistas: ArtistaDiccionario[];
  distintas: number;
  anotaciones: number;
  repetidas: number;
}) {
  const [datos, setDatos] = useState<Pick<Diccionario, 'tandas' | 'palabras'> | null>(null);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [letra, setLetra] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>('az');
  const [ciclo, setCiclo] = useState('');
  const [artista, setArtista] = useState('');
  // Cuántas se muestran, ligado a los filtros con que se pidió: al cambiar un filtro se vuelve a la primera página.
  const [pagina, setPagina] = useState({ firma: '', cantidad: POR_PAGINA });
  const [sorpresa, setSorpresa] = useState<PalabraDiccionario | null>(null);
  const [tarjetas, setTarjetas] = useState<{ word: string; translation: string }[] | null>(null);
  const termino = useDeferredValue(busqueda);

  // Las palabras no vienen con la página (pesan casi 2 MB): se piden al abrirla.
  useEffect(() => {
    let vigente = true;
    fetch('/diccionario/datos')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (vigente) setDatos(d); })
      .catch(() => { if (vigente) setFallo(true); });
    return () => { vigente = false; };
  }, [intento]);

  const porNombre = useMemo(() => new Map(artistas.map(a => [a.nombre, a])), [artistas]);
  const entradas: Entrada[] = useMemo(() => (datos?.palabras ?? []).map((p, i) => ({
    i, p, texto: plano([p[0], p[1], ...(p[5] ?? [])].join(' ')), letra: letraDe(p[0]),
  })), [datos]);
  const ciclos = useMemo(() => [...new Set(Object.values(datos?.tandas ?? {}).map(([, c]) => c))].sort(), [datos]);

  const filtradas = useMemo(() => {
    const q = plano(termino.trim());
    const deArtista = artista ? new Set(titulos.flatMap((t, i) => (t.realeza.includes(artista) ? [i] : []))) : null;
    const tandas = datos?.tandas ?? {};
    const lista = entradas.filter(e =>
      (!q || e.texto.includes(q))
      && (!letra || e.letra === letra)
      && (!ciclo || (e.p[4] !== null && tandas[e.p[4]]?.[1] === ciclo))
      && (!deArtista || e.p[3].some(i => deArtista.has(i))));
    // Sin tanda va al final en los dos órdenes por tanda.
    const t = (e: Entrada, sin: number) => e.p[4] ?? sin;
    if (orden === 'repetidas') lista.sort((a, b) => b.p[2] - a.p[2]);
    else if (orden === 'recientes') lista.sort((a, b) => t(b, -1) - t(a, -1));
    else if (orden === 'antiguas') lista.sort((a, b) => t(a, Infinity) - t(b, Infinity));
    // Al buscar, primero las palabras que empiezan con lo buscado.
    if (q && orden === 'az') lista.sort((a, b) => Number(!plano(a.p[0]).startsWith(q)) - Number(!plano(b.p[0]).startsWith(q)));
    return lista;
  }, [entradas, termino, letra, ciclo, artista, orden, titulos, datos]);

  const firma = [termino, letra, ciclo, artista, orden].join('|');
  const mostradas = pagina.firma === firma ? pagina.cantidad : POR_PAGINA;

  const hayFiltros = !!(busqueda || letra || ciclo || artista || orden !== 'az');
  const limpiar = () => { setBusqueda(''); setLetra(null); setCiclo(''); setArtista(''); setOrden('az'); };
  const alAzar = () => {
    const lista = filtradas.length ? filtradas : entradas;
    if (lista.length) setSorpresa(lista[Math.floor(Math.random() * lista.length)].p);
  };
  const repasar = () => setTarjetas(filtradas.map(e => ({ word: e.p[0], translation: e.p[1] })));

  const CONTROL = 'rounded-xl bg-gray-900/80 border border-white/10 px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-400/60';

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="diccionario" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        <header className="text-center mb-10 animate-fade-in">
          <BookOpen size={38} className="mx-auto text-emerald-300 mb-3" aria-hidden />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-linear-to-r from-emerald-200 via-teal-300 to-purple-300 bg-clip-text text-transparent brillo-titulo pb-1">
            Diccionario Fanning
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto md:text-lg">
            Todas las palabras y frases que no se entendieron y quedaron anotadas, en un solo lugar: su traducción,
            en qué títulos aparecieron y en qué tanda se aprendieron por primera vez.
          </p>
          <dl className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              ['Palabras distintas', miles(distintas), 'text-emerald-300'],
              ['Veces anotadas', miles(anotaciones), 'text-purple-300'],
              ['Anotadas más de una vez', miles(repetidas), 'text-pink-300'],
            ].map(([etiqueta, valor, color]) => (
              <div key={etiqueta} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 min-w-36">
                <dd className={`text-2xl font-extrabold ${color}`}>{valor}</dd>
                <dt className="text-xs text-gray-400">{etiqueta}</dt>
              </div>
            ))}
          </dl>
          <p className="text-xs text-gray-500 mt-3 max-w-xl mx-auto">
            Una misma palabra con un significado parecido cuenta una sola vez, como en «Palabras más repetidas» del inicio.
          </p>
        </header>

        {/* Controles */}
        <div className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-[color-mix(in_oklab,var(--background)_85%,transparent)] backdrop-blur-md">
          <div className="flex flex-col lg:flex-row gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Buscar una palabra o su traducción</span>
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden />
              <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar en inglés o en español…" className={`${CONTROL} w-full pl-10`} />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-3">
              <select value={orden} onChange={e => setOrden(e.target.value as Orden)} className={CONTROL} aria-label="Ordenar">
                {Object.entries(ORDENES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
              <select value={ciclo} onChange={e => setCiclo(e.target.value)} className={CONTROL} aria-label="Ciclo">
                <option value="">Todos los ciclos</option>
                {ciclos.map(c => <option key={c} value={c}>Ciclo {c}</option>)}
              </select>
              <select value={artista} onChange={e => setArtista(e.target.value)} className={`${CONTROL} col-span-2 sm:col-span-1`} aria-label="Realeza">
                <option value="">Toda la Realeza</option>
                {artistas.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
              </select>
            </div>
          </div>
          <nav aria-label="Por letra" className="mt-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {[...LETRAS, '#'].map(l => (
              <button key={l} onClick={() => setLetra(letra === l ? null : l)} aria-pressed={letra === l}
                className={`shrink-0 w-8 h-8 rounded-lg text-sm font-bold transition ${letra === l
                  ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                {l}
              </button>
            ))}
          </nav>
        </div>

        {!datos ? (
          <div className="py-24 text-center text-gray-400" aria-live="polite">
            {fallo ? (
              <button onClick={() => { setFallo(false); setIntento(i => i + 1); }} className="text-emerald-300 hover:underline">
                No se pudo cargar el diccionario · Reintentar
              </button>
            ) : (
              <span className="inline-flex items-center gap-2"><Sparkles size={18} className="animate-pulse text-emerald-300" /> Abriendo el diccionario…</span>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 my-5">
              <p className="text-sm text-gray-400" aria-live="polite">
                {miles(filtradas.length)} {filtradas.length === 1 ? 'palabra' : 'palabras'}
                {hayFiltros && (
                  <button onClick={limpiar} className="ml-3 inline-flex items-center gap-1 text-emerald-300 hover:underline">
                    <X size={14} /> Quitar filtros
                  </button>
                )}
              </p>
              <div className="flex gap-2">
                <button onClick={alAzar}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition">
                  <Shuffle size={16} /> Palabra al azar
                </button>
                <button onClick={repasar} disabled={!filtradas.length}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-4 py-2 text-sm font-bold transition disabled:opacity-50">
                  <Layers size={16} /> Repasar {filtradas.length < entradas.length ? 'estas' : 'todas'}
                </button>
              </div>
            </div>

            {sorpresa && (
              <div className="mb-6 relative animate-fade-in">
                <p className="text-xs uppercase tracking-[0.25em] font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                  <Crown size={14} aria-hidden /> Palabra sorpresa
                </p>
                <button onClick={() => setSorpresa(null)} aria-label="Cerrar la palabra sorpresa"
                  className="absolute top-0 right-0 p-1 text-gray-500 hover:text-white"><X size={16} /></button>
                <div className="max-w-xl">
                  <Tarjeta key={sorpresa[0] + sorpresa[1]} p={sorpresa} titulos={titulos} artistas={porNombre} tandas={datos.tandas} destacada />
                </div>
              </div>
            )}

            {filtradas.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtradas.slice(0, mostradas).map(e => (
                  <Tarjeta key={e.i} p={e.p} titulos={titulos} artistas={porNombre} tandas={datos.tandas} />
                ))}
              </div>
            ) : (
              <p className="py-20 text-center text-gray-400">Ninguna palabra coincide. Prueba con otra búsqueda o quita algún filtro.</p>
            )}

            {mostradas < filtradas.length && (
              <div className="text-center mt-8">
                <button onClick={() => setPagina({ firma, cantidad: mostradas + POR_PAGINA * 2 })}
                  className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold transition">
                  Ver más ({miles(filtradas.length - mostradas)} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {tarjetas && <FlashcardViewer key={tarjetas.length + (tarjetas[0]?.word ?? '')} cards={tarjetas} onClose={() => setTarjetas(null)} />}
    </div>
  );
}
