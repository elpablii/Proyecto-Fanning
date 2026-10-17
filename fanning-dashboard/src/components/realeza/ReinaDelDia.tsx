"use client";

import { ViewTransition } from 'react';
import Link from 'next/link';
import { transicionArtista } from '@/lib/transiciones';
import { ArrowRight, Cake, Crown, Heart } from 'lucide-react';
import { miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { cumpleHoy, delDia, grupoDe, hrefArtista, NOMBRE_RANGO, type Artista, type IdGrupo } from '@/lib/realeza';
import Cumpleanos, { useHoy } from '@/components/realeza/Cumpleanos';
import { MARCO } from '@/components/realeza/CartaReal';
import { lugarCita } from '@/components/realeza/CitaReal';
import type { MovieStats } from '@/types/manifest';

// Lo que la portada necesita de cada miembro para elegir y mostrar a la Reina o Rey del día.
export type CandidatoDelDia = Artista & {
  titulos: number;
  palabras: number;
  posters: Pick<MovieStats, 'title' | 'posterUrl'>[];
};

const ESTILO: Record<IdGrupo, { texto: string; nombre: string; resplandor: string; borde: string }> = {
  supremos: { texto: 'text-amber-300', nombre: 'from-amber-100 via-amber-300 to-yellow-600', resplandor: 'rgba(251,191,36,0.22)', borde: 'border-amber-300/30' },
  platonicos: { texto: 'text-pink-300', nombre: 'from-pink-200 via-rose-400 to-fuchsia-500', resplandor: 'rgba(236,72,153,0.22)', borde: 'border-pink-400/30' },
  reinas: { texto: 'text-pink-300', nombre: 'from-pink-200 to-purple-400', resplandor: 'rgba(192,132,252,0.18)', borde: 'border-purple-400/25' },
  reyes: { texto: 'text-amber-300', nombre: 'from-amber-200 to-sky-400', resplandor: 'rgba(56,189,248,0.16)', borde: 'border-sky-400/25' },
};

// Confeti para los cumpleaños: posiciones y colores fijos (no al azar), así el build y el navegador coinciden.
const COLORES_CONFETI = ['#f9a8d4', '#fcd34d', '#c4b5fd', '#67e8f9', '#fda4af'];
function Confeti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className="confeti" style={{
          left: `${(i * 37) % 100}%`,
          background: COLORES_CONFETI[i % COLORES_CONFETI.length],
          animationDelay: `${((i * 0.53) % 4).toFixed(2)}s`,
          animationDuration: `${3.5 + ((i * 0.7) % 2.5)}s`,
          transform: `rotate(${(i * 47) % 360}deg)`,
        }} />
      ))}
    </div>
  );
}

export default function ReinaDelDia({ candidatos, hoy }: { candidatos: CandidatoDelDia[]; hoy: string }) {
  const hoyNavegador = useHoy(hoy);
  const elegido = delDia(candidatos, hoyNavegador, a => a.titulos > 0);
  if (!elegido) return null;

  const grupo = grupoDe(elegido);
  const estilo = ESTILO[grupo];
  const cumple = cumpleHoy(elegido, hoyNavegador);
  const Icono = grupo === 'platonicos' ? Heart : Crown;
  const titular = `${elegido.tipo === 'reina' ? 'Reina' : 'Rey'} del día`;

  return (
    <Link href={hrefArtista(elegido.nombre)} aria-label={`${titular}: ${elegido.nombre}. Ver su página`}
      className={`group relative block overflow-hidden rounded-3xl border ${estilo.borde} bg-gray-900 mb-10 shadow-xl hover:shadow-2xl transition-shadow animate-fade-in`}>
      {/* Fondo: su foto difuminada y el resplandor de su grupo */}
      <div aria-hidden className="absolute inset-0">
        {elegido.foto && <img src={tmdb(elegido.foto, 'w185')} alt="" className="w-full h-full object-cover object-top opacity-30 blur-2xl scale-125" />}
        <div className="absolute inset-0 bg-linear-to-r from-gray-950/95 via-gray-950/75 to-gray-950/40" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at left, ${estilo.resplandor}, transparent 60%)` }} />
      </div>
      {cumple && <Confeti />}

      <div className="relative flex items-center gap-5 sm:gap-7 p-4 sm:p-6">
        <div className={`w-24 sm:w-32 aspect-2/3 shrink-0 rounded-2xl ${MARCO[grupo]} group-hover:scale-[1.03] transition-transform duration-500`}>
          <div className="relative h-full rounded-[13px] overflow-hidden bg-gray-900">
            {elegido.foto
              ? <ViewTransition name={transicionArtista(elegido.nombre)} share="morph" default="none"><img src={tmdb(elegido.foto, 'w342')} alt="" className="absolute inset-0 w-full h-full object-cover object-top" /></ViewTransition>
              : <span className="absolute inset-0 flex items-center justify-center text-gray-600"><Icono size={32} /></span>}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold ${estilo.texto}`}>
            {cumple ? <Cake size={14} aria-hidden /> : <Icono size={14} fill={grupo === 'platonicos' ? 'currentColor' : 'none'} aria-hidden />}
            {cumple ? `${titular} · ¡De cumpleaños!` : titular}
          </p>
          <h2 className={`mt-1 font-real text-3xl sm:text-4xl md:text-5xl font-bold leading-tight bg-linear-to-r ${estilo.nombre} bg-clip-text text-transparent truncate pb-1`}>
            {elegido.nombre}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{NOMBRE_RANGO[grupo]} del Proyecto Fanning</p>
          <Cumpleanos artista={elegido} hoy={hoyNavegador} className="mt-2 text-xs sm:text-sm" />
          {elegido.cita && (
            <p className="mt-3 max-w-xl text-sm text-gray-200 italic line-clamp-2" lang="en"
              title={`${elegido.cita.personaje}, en ${lugarCita(elegido.cita)}`}>
              “{elegido.cita.texto}”
              <span className="not-italic text-xs text-gray-500"> — {elegido.cita.personaje}</span>
            </p>
          )}
          <p className="mt-3 text-sm text-gray-300">
            {elegido.titulos
              ? <><span className="font-bold text-white">{miles(elegido.titulos)}</span> {elegido.titulos === 1 ? 'título' : 'títulos'} · <span className="font-bold text-white">{miles(elegido.palabras)}</span> palabras aprendidas</>
              : 'Aún sin títulos en el proyecto. ¡Su momento llegará!'}
          </p>
          <span className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${estilo.texto} group-hover:gap-2 transition-all`}>
            Ver su página <ArrowRight size={16} />
          </span>
        </div>

        {/* Sus pósters, en abanico (solo en pantallas anchas) */}
        {elegido.posters.length > 0 && (
          <div aria-hidden className="hidden lg:flex items-center pr-4 shrink-0">
            {elegido.posters.map((p, i) => (
              <img key={p.title} src={p.posterUrl ? tmdb(p.posterUrl, 'w185') : undefined} alt="" loading="lazy"
                style={{ zIndex: elegido.posters.length - i, transform: `rotate(${(i - (elegido.posters.length - 1) / 2) * 5}deg)` }}
                className="w-20 xl:w-24 aspect-2/3 object-cover rounded-lg border border-white/15 shadow-xl -ml-8 first:ml-0 bg-gray-800 transition-transform duration-500 group-hover:-translate-y-1" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
