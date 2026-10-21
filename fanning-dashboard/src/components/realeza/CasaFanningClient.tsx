"use client";

import { Fragment, ViewTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarClock, Film, Heart, Sparkles, Tv } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import {
  cuandoLlega, hrefArtista, hrefTitulo, nombreProximo, PAPELES,
  type Artista, type EstadisticasArtista, type Proximo, type TituloArtista,
} from '@/lib/realeza';
import { MARCO } from '@/components/realeza/CartaReal';
import CitaReal from '@/components/realeza/CitaReal';
import Cumpleanos, { edad, useHoy } from '@/components/realeza/Cumpleanos';
import Particulas from '@/components/realeza/Particulas';
import FondoAnimado from '@/components/ui/FondoAnimado';
import { transicionArtista } from '@/lib/transiciones';

type TituloHermana = TituloArtista & { tandas: number[]; fecha: string | null; anio: string | null };

export interface Hermana {
  artista: Artista;
  stats: Omit<EstadisticasArtista, 'titulos'> & { titulos: TituloHermana[] };
  proximos: number;
}

export type ProximoJuntas = Proximo;

// Cada hermana con su color: rosa para Dakota (la mayor, a la izquierda) y violeta para Elle.
// Su nombre va siempre al lado, así el color nunca es lo único que las distingue.
const TONO = [
  { texto: 'text-pink-300', fondo: 'bg-pink-400', borde: 'border-pink-400/40', degradado: 'from-pink-200 to-rose-400' },
  { texto: 'text-violet-300', fondo: 'bg-violet-400', borde: 'border-violet-400/40', degradado: 'from-violet-200 to-fuchsia-400' },
] as const;

const fechaCorta = (iso: string) => iso.split('-').reverse().join('/');
const nombreCorto = (a: Artista) => a.nombre.split(' ')[0];

function Retrato({ h, lado }: { h: Hermana; lado: 0 | 1 }) {
  const a = h.artista;
  return (
    <div className="flex flex-col items-center text-center">
      <Link href={hrefArtista(a.nombre)}
        className={`group block w-32 sm:w-48 md:w-56 aspect-2/3 rounded-2xl ${MARCO.platonicos} transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] ${lado ? 'rotate-3' : '-rotate-3'}`}>
        <span className="relative block h-full rounded-[13px] overflow-hidden bg-gray-900">
          {a.foto && (
            <ViewTransition name={transicionArtista(a.nombre)} share="morph" default="none">
              <img src={tmdb(a.foto, 'w500')} alt={a.nombre} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-top" />
            </ViewTransition>
          )}
          <span className="absolute inset-0 holo-real opacity-30 group-hover:opacity-70 transition-opacity duration-500" />
        </span>
      </Link>
      <Link href={hrefArtista(a.nombre)} className={`mt-5 font-real text-2xl sm:text-3xl font-bold bg-linear-to-r ${TONO[lado].degradado} bg-clip-text text-transparent hover:opacity-80`}>
        {a.nombre}
      </Link>
    </div>
  );
}

// Una cifra cara a cara: el valor de cada una en su lado y una barra repartida entre las dos.
function Duelo({ etiqueta, valores, texto }: { etiqueta: string; valores: [number, number]; texto: [string, string] }) {
  const total = valores[0] + valores[1];
  const parte = total ? (valores[0] / total) * 100 : 50;
  const gana = valores[0] === valores[1] ? -1 : valores[0] > valores[1] ? 0 : 1;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={`font-extrabold tabular-nums ${gana === 0 ? 'text-white' : 'text-gray-400'}`}>{texto[0]}</span>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">{etiqueta}</span>
        <span className={`font-extrabold tabular-nums ${gana === 1 ? 'text-white' : 'text-gray-400'}`}>{texto[1]}</span>
      </div>
      <div className="mt-1.5 flex h-2.5 gap-0.5" aria-hidden>
        <span className={`rounded-l-full ${TONO[0].fondo}`} style={{ width: `${parte}%` }} />
        <span className={`rounded-r-full ${TONO[1].fondo}`} style={{ width: `${100 - parte}%` }} />
      </div>
    </li>
  );
}

function Rama({ t, lado, quien }: { t: TituloHermana; lado: 0 | 1; quien: Artista }) {
  return (
    <Link href={hrefTitulo(t)}
      className={`group flex gap-3 items-center rounded-2xl border ${TONO[lado].borde} bg-gray-900/70 hover:bg-gray-900 p-2.5 pr-4 transition w-full md:max-w-sm ${lado === 0 ? 'md:flex-row-reverse md:text-right md:pr-2.5 md:pl-4' : ''}`}>
      {t.posterUrl
        ? <img src={tmdb(t.posterUrl, 'w185')} alt="" loading="lazy" className="w-12 h-18 rounded-lg object-cover shrink-0 transition-transform duration-500 group-hover:scale-105" />
        : <span className="w-12 h-18 rounded-lg bg-gray-800 shrink-0 flex items-center justify-center text-gray-600">{t.type === 'series' ? <Tv size={18} /> : <Film size={18} />}</span>}
      <span className="min-w-0">
        <span className={`md:hidden block text-[10px] uppercase tracking-wider font-bold ${TONO[lado].texto}`}>{nombreCorto(quien)}</span>
        <span className="block font-bold text-gray-100 group-hover:text-white leading-tight">{t.title}</span>
        <span className="block text-xs text-gray-400 mt-0.5">
          {t.tandas.length ? `${t.tandas.length > 1 ? `Tandas ${t.tandas[0]}–${t.tandas[t.tandas.length - 1]}` : `${t.tandas[0]}° Tanda`} · ${fechaCorta(t.fecha!)}` : 'Aún sin tanda'}
        </span>
        <span className={`block text-[11px] font-semibold mt-0.5 ${TONO[lado].texto}`}>
          {t.papeles.map(p => PAPELES[p]).join(' · ')} · {miles(t.count)} palabras
        </span>
      </span>
    </Link>
  );
}

export default function CasaFanningClient({ hermanas, juntas, yaJuntas, hoy }: {
  hermanas: [Hermana, Hermana];
  juntas: ProximoJuntas[];
  yaJuntas: { title: string; type?: 'movie' | 'series'; posterUrl?: string | null }[];
  hoy: string;
}) {
  const hoyNavegador = useHoy(hoy);
  const [dakota, elle] = hermanas;
  const diferencia = dakota.artista.nacimiento && elle.artista.nacimiento
    ? edad(dakota.artista.nacimiento, elle.artista.nacimiento) : null;

  // El árbol: los títulos de las dos en el orden en que entraron al proyecto, con el año en el tronco.
  const ramas = hermanas
    .flatMap((h, lado) => h.stats.titulos.map(t => ({ t, lado: lado as 0 | 1, quien: h.artista })))
    .sort((a, b) => (a.t.fecha ?? '9999').localeCompare(b.t.fecha ?? '9999') || a.lado - b.lado);

  const s = hermanas.map(h => h.stats);
  const primera = hermanas.map(h => h.stats.titulos.find(t => t.tandas.length)?.tandas[0] ?? null);

  return (
    <div className="min-h-screen text-gray-100 font-sans overflow-x-hidden">
      <FondoAnimado paleta="fanning" fuerza={20} />
      <Particulas />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <nav className="flex flex-wrap items-center justify-between gap-3 mb-8 text-sm font-medium">
          <Link href="/realeza" className="inline-flex items-center text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} className="mr-2" /> Volver al Salón del Trono
          </Link>
          <Link href="/" className="text-gray-500 hover:text-white transition">Inicio</Link>
        </nav>

        {/* ---------- Portada ---------- */}
        <header className="text-center mb-14 animate-fade-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.25em] font-semibold text-pink-300">
            <Heart size={14} fill="currentColor" aria-hidden /> Amores Platónicos
          </p>
          <h1 className="mt-4 font-real text-5xl md:text-7xl font-bold bg-linear-to-r from-pink-200 via-rose-300 to-violet-300 bg-clip-text text-transparent brillo-titulo pb-1">
            La Casa Fanning
          </h1>
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto md:text-lg">
            El proyecto lleva su apellido. Dakota y Elle, hermanas, actrices y dos de los cinco Amores Platónicos:
            aquí está su paso por el Proyecto Fanning, rama por rama.
          </p>

          <div className="mt-12 flex items-start justify-center gap-4 sm:gap-10">
            <div className="flex flex-col items-center">
              <Retrato h={dakota} lado={0} />
              <Cumpleanos artista={dakota.artista} hoy={hoyNavegador} className="justify-center mt-2 text-sm" />
            </div>
            <Heart aria-hidden size={32} fill="currentColor" className="text-pink-400 mt-20 sm:mt-32 sm:w-10 sm:h-10 shrink-0 animate-pulse drop-shadow-[0_0_18px_rgba(244,114,182,0.7)]" />
            <div className="flex flex-col items-center">
              <Retrato h={elle} lado={1} />
              <Cumpleanos artista={elle.artista} hoy={hoyNavegador} className="justify-center mt-2 text-sm" />
            </div>
          </div>
          {diferencia !== null && diferencia > 0 && (
            <p className="text-sm text-gray-400 mt-6">Dakota es la mayor: le lleva {diferencia} años a Elle.</p>
          )}
        </header>

        {/* ---------- Sus citas ---------- */}
        {(dakota.artista.cita || elle.artista.cita) && (
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {hermanas.map((h, lado) => h.artista.cita && (
              <div key={h.artista.nombre} className={`rounded-2xl border ${TONO[lado].borde} bg-gray-950/50 p-5`}>
                <CitaReal cita={h.artista.cita} color={TONO[lado].texto}
                  href={(() => { const t = h.stats.titulos.find(x => x.title === h.artista.cita!.titulo); return t ? hrefTitulo(t) : undefined; })()} />
              </div>
            ))}
          </div>
        )}

        {/* ---------- Cara a cara ---------- */}
        <section aria-labelledby="cara-a-cara" className="mb-16 rounded-3xl border border-white/10 bg-gray-950/50 p-5 sm:p-8">
          <h2 id="cara-a-cara" className="text-2xl md:text-3xl font-extrabold text-center mb-2">Hermana a hermana</h2>
          <div className="flex justify-between text-sm font-bold mb-6">
            <span className={`flex items-center gap-2 ${TONO[0].texto}`}><span className={`w-3 h-3 rounded-full ${TONO[0].fondo}`} /> Dakota</span>
            <span className={`flex items-center gap-2 ${TONO[1].texto}`}>Elle <span className={`w-3 h-3 rounded-full ${TONO[1].fondo}`} /></span>
          </div>
          <ul className="space-y-5">
            <Duelo etiqueta="Títulos" valores={[s[0].titulos.length, s[1].titulos.length]} texto={[miles(s[0].titulos.length), miles(s[1].titulos.length)]} />
            <Duelo etiqueta="Palabras aprendidas" valores={[s[0].palabras, s[1].palabras]} texto={[miles(s[0].palabras), miles(s[1].palabras)]} />
            <Duelo etiqueta="Líneas de diálogo" valores={[s[0].lineas, s[1].lineas]} texto={[miles(s[0].lineas), miles(s[1].lineas)]} />
            <Duelo etiqueta="En pantalla" valores={[s[0].minutos, s[1].minutos]} texto={[duracion(s[0].minutos), duracion(s[1].minutos)]} />
            <Duelo etiqueta="Próximamente" valores={[dakota.proximos, elle.proximos]} texto={[miles(dakota.proximos), miles(elle.proximos)]} />
          </ul>
          <dl className="grid grid-cols-3 gap-3 mt-8 text-center">
            {[
              ['Nivel MCER', s[0].nivel ?? '—', s[1].nivel ?? '—'],
              ['Comprensión', porcentaje(s[0].comprension, 1), porcentaje(s[1].comprension, 1)],
              ['Desde la', primera[0] ? `${primera[0]}° Tanda` : '—', primera[1] ? `${primera[1]}° Tanda` : '—'],
            ].map(([etiqueta, a, b]) => (
              <div key={etiqueta} className="rounded-2xl bg-white/[0.03] border border-white/10 p-2 sm:p-3">
                <dt className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">{etiqueta}</dt>
                <dd className="mt-1 flex flex-col sm:flex-row justify-center sm:gap-3 text-sm sm:text-base font-extrabold">
                  <span className={TONO[0].texto}>{a}</span><span className="hidden sm:inline text-gray-600">·</span><span className={TONO[1].texto}>{b}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- El árbol ---------- */}
        <section aria-labelledby="arbol" className="mb-16">
          <h2 id="arbol" className="text-2xl md:text-3xl font-extrabold text-center mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-pink-300" aria-hidden /> El árbol Fanning
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8 max-w-xl mx-auto">
            El tronco es el tiempo del proyecto: cada rama es un título, en el orden en que entró.
            <span className="hidden md:inline"> Dakota a la izquierda, Elle a la derecha.</span>
            <span className="md:hidden"> Cada rama dice de cuál de las dos es.</span>
          </p>
          <div className="hidden md:grid grid-cols-[1fr_3rem_1fr] mb-4 text-center font-real text-xl font-bold">
            <span className={TONO[0].texto}>Dakota</span><span /><span className={TONO[1].texto}>Elle</span>
          </div>
          <ol className="relative space-y-3">
            <span aria-hidden className="absolute top-0 bottom-0 left-4 md:left-1/2 w-1 -translate-x-1/2 rounded-full bg-linear-to-b from-pink-400/60 via-rose-300/40 to-violet-400/60" />
            {ramas.map((r, i) => {
              const anio = r.t.anio ?? 'Sin tanda';
              const nuevoAnio = i === 0 || (ramas[i - 1].t.anio ?? 'Sin tanda') !== anio;
              // En pantallas anchas, si la rama anterior era de la otra hermana, esta sube a media
              // altura: quedan escalonadas a los dos lados del tronco en vez de una por fila.
              const escalonada = !nuevoAnio && ramas[i - 1].lado !== r.lado;
              return (
                <Fragment key={`${r.lado}:${r.t.type}:${r.t.title}`}>
                  {nuevoAnio && (
                    <li className="relative flex md:justify-center py-3">
                      <span className="relative z-10 ml-0 md:ml-0 rounded-full border border-white/15 bg-gray-950 px-3 py-1 text-sm font-extrabold text-white shadow-lg">
                        {anio}
                      </span>
                    </li>
                  )}
                  <li className={`relative grid grid-cols-[2rem_1fr] md:grid-cols-[1fr_3rem_1fr] items-center ${escalonada ? 'md:-mt-10' : ''}`}>
                    <span aria-hidden className="col-start-1 md:col-start-2 row-start-1 flex justify-center">
                      <span className={`relative z-10 w-3.5 h-3.5 rounded-full ring-4 ring-gray-950 ${TONO[r.lado].fondo}`} />
                    </span>
                    <div className={`col-start-2 row-start-1 flex ${r.lado === 0 ? 'md:col-start-1 md:justify-end' : 'md:col-start-3'}`}>
                      <Rama t={r.t} lado={r.lado} quien={r.quien} />
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </section>

        {/* ---------- Juntas ---------- */}
        <section aria-labelledby="juntas" className="mb-14 rounded-3xl border border-pink-400/20 bg-linear-to-br from-pink-500/10 via-transparent to-violet-500/10 p-5 sm:p-8 text-center">
          <h2 id="juntas" className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center justify-center gap-2">
            <CalendarClock className="text-pink-300" aria-hidden /> Juntas en pantalla
          </h2>
          {yaJuntas.length > 0 ? (
            <p className="text-gray-300 mb-6">Ya comparten {yaJuntas.length === 1 ? 'un título' : `${yaJuntas.length} títulos`} en el proyecto:</p>
          ) : (
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              En el proyecto todavía no comparten ningún título.
              {juntas.length > 0 ? ' Pero eso va a cambiar: según la planificación, estas son las que vienen con las dos.' : ''}
            </p>
          )}
          <ul className="flex flex-wrap justify-center gap-5">
            {yaJuntas.map(t => (
              <li key={t.title} className="w-32">
                <Link href={hrefTitulo(t)} className="group block">
                  {t.posterUrl
                    ? <img src={tmdb(t.posterUrl, 'w185')} alt="" loading="lazy" className="w-full aspect-2/3 rounded-xl object-cover border border-white/10 group-hover:border-white/40 transition" />
                    : <span className="block w-full aspect-2/3 rounded-xl bg-gray-800" />}
                  <p className="mt-2 text-sm font-semibold text-gray-200 group-hover:text-white">{t.title}</p>
                </Link>
              </li>
            ))}
            {juntas.map(p => (
              <li key={nombreProximo(p)} className="w-32">
                <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden border border-dashed border-pink-300/40 bg-gray-900">
                  {p.poster
                    ? <img src={tmdb(p.poster, 'w185')} alt="" loading="lazy" className="w-full h-full object-cover" />
                    : <span className="absolute inset-0 flex items-center justify-center text-gray-600">{p.tipo === 'serie' ? <Tv size={24} /> : <Film size={24} />}</span>}
                  <span className="absolute bottom-1.5 inset-x-0 flex justify-center -space-x-2">
                    {hermanas.map(h => h.artista.foto && (
                      <img key={h.artista.nombre} src={tmdb(h.artista.foto, 'w92')} alt={h.artista.nombre} title={h.artista.nombre}
                        className="w-7 h-7 rounded-full object-cover object-top ring-2 ring-gray-950" />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-200 leading-tight">{nombreProximo(p)}</p>
                <p className="text-xs text-pink-300">{cuandoLlega(p)}</p>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Las páginas de cada hermana" className="flex flex-col sm:flex-row justify-between gap-3 pt-8 border-t border-white/10">
          {hermanas.map((h, lado) => (
            <Link key={h.artista.nombre} href={hrefArtista(h.artista.nombre)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition ${lado === 1 ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
              {lado === 0 ? <ArrowLeft size={18} className="text-gray-500 shrink-0" /> : <ArrowRight size={18} className="text-gray-500 shrink-0" />}
              {h.artista.foto && <img src={tmdb(h.artista.foto, 'w92')} alt="" className={`w-11 h-11 rounded-full object-cover object-top border-2 ${TONO[lado].borde}`} />}
              <span>
                <span className="block text-[11px] uppercase tracking-wider text-gray-500">Su página</span>
                <span className="block font-bold text-white">{h.artista.nombre}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
