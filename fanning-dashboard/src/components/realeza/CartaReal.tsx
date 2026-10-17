"use client";

import React, { useRef, useState, ViewTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Clapperboard, Crown, Film, Heart, Mic, Music, PenLine, RotateCw, User, Wrench, type LucideIcon } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { cuandoLlega, grupoDe, hrefArtista, hrefTitulo, NOMBRE_RANGO, nombreProximo, PAPELES, slugArtista, type Artista, type EstadisticasArtista, type IdGrupo, type Papel, type Proximo } from '@/lib/realeza';
import Cumpleanos from '@/components/realeza/Cumpleanos';
import { transicionArtista } from '@/lib/transiciones';

export interface ArtistaSalon extends Artista {
  stats: EstadisticasArtista;
  proximo?: Proximo | null;   // lo primero que viene según la planificación
}

const RANGO = NOMBRE_RANGO;

// Marco de cada grupo: oro para los Reyes Supremos, rosa para los Amores Platónicos.
export const MARCO: Record<IdGrupo, string> = {
  supremos: 'bg-linear-to-br from-amber-100 via-amber-400 to-yellow-700 p-[3px] shadow-[0_0_35px_rgba(251,191,36,0.3)]',
  platonicos: 'bg-linear-to-br from-pink-200 via-rose-400 to-fuchsia-700 p-[3px] shadow-[0_0_35px_rgba(244,114,182,0.3)]',
  reinas: 'bg-linear-to-br from-pink-400/50 via-white/10 to-purple-500/40 p-px',
  reyes: 'bg-linear-to-br from-amber-300/50 via-white/10 to-sky-500/40 p-px',
};

// Íconos de lo que no es actuar, sobre cada póster del reverso.
const ICONO_PAPEL: Partial<Record<Papel, LucideIcon>> = {
  voz: Mic, aparece: User, musica: Music, produce: Briefcase, escribe: PenLine, dirige: Clapperboard, equipo: Wrench,
};

// "Actúa en 15 · Su música en 2": cuántos títulos por cada forma de participar.
export function resumenPapeles(stats: EstadisticasArtista): string {
  const cuenta = new Map<Papel, number>();
  for (const t of stats.titulos) for (const p of t.papeles) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
  return (Object.keys(PAPELES) as Papel[]).filter(p => cuenta.has(p)).map(p => `${PAPELES[p]} en ${cuenta.get(p)}`).join(' · ');
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5">
      <dt className={`text-[9px] uppercase tracking-wider ${color}`}>{etiqueta}</dt>
      <dd className="font-bold text-white leading-tight">{valor}</dd>
    </div>
  );
}

export default function CartaReal({ artista, hoy, grande = false }: { artista: ArtistaSalon; hoy: string; grande?: boolean }) {
  const carta = useRef<HTMLDivElement>(null);
  const [volteada, setVolteada] = useState(false);
  const grupo = grupoDe(artista);
  const superior = grupo === 'supremos' || grupo === 'platonicos';
  const Icono = grupo === 'platonicos' ? Heart : Crown;
  const colorIcono = grupo === 'platonicos' || grupo === 'reinas' ? 'text-pink-300' : 'text-amber-300';
  const { stats } = artista;

  // La carta se inclina hacia el mouse y el brillo lo sigue (no en pantallas táctiles
  // ni con "reducir movimiento").
  const mover = (e: React.PointerEvent) => {
    const el = carta.current;
    if (!el || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.dataset.inclinando = 'true';
    el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
    el.style.setProperty('--mx', `${(volteada ? 1 - x : x) * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const soltar = () => {
    const el = carta.current;
    if (!el) return;
    el.dataset.inclinando = 'false';
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  const voltear = () => setVolteada(v => !v);

  const cara = `absolute inset-0 backface-hidden rounded-2xl ${MARCO[grupo]}`;
  const interior = 'relative h-full rounded-[13px] overflow-hidden bg-gray-900';

  return (
    <div id={slugArtista(artista.nombre)} className="perspective-1000 scroll-mt-24">
      <div
        ref={carta}
        role="button"
        tabIndex={0}
        aria-pressed={volteada}
        aria-label={`${artista.nombre}, ${RANGO[grupo]}. ${volteada ? 'Ver la foto' : 'Ver sus datos en el proyecto'}`}
        onClick={voltear}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } }}
        onPointerMove={mover}
        onPointerLeave={soltar}
        style={{ '--giro': volteada ? '180deg' : '0deg' } as React.CSSProperties}
        className="carta-real preserve-3d group relative aspect-2/3 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950"
      >
        {/* ---------- Frente: la foto ---------- */}
        <div className={cara} inert={volteada}>
          <div className={interior}>
            {artista.foto ? (
              <ViewTransition name={volteada ? undefined : transicionArtista(artista.nombre)} share="morph" default="none">
                <img src={tmdb(artista.foto, grande ? 'w500' : 'w342')} alt={artista.nombre} loading="lazy" decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
              </ViewTransition>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600"><Icono size={48} /></div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
            <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${superior ? 'holo-real' : 'reflejo-real'}`} />

            <span className={`absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur-sm p-1.5 border border-white/10 ${colorIcono}`}>
              <Icono size={grande ? 18 : 14} fill={grupo === 'platonicos' ? 'currentColor' : 'none'} aria-hidden />
            </span>
            <RotateCw size={14} className="absolute top-3 right-3 text-white/40 group-hover:text-white/80 transition" aria-hidden />

            <div className={`absolute bottom-0 inset-x-0 ${grande ? 'p-4' : 'p-3'}`}>
              <p className={`uppercase tracking-[0.2em] font-semibold ${grande ? 'text-[11px]' : 'text-[9px]'} ${colorIcono}`}>{RANGO[grupo]}</p>
              <h3 className={`font-real font-bold text-white leading-tight drop-shadow-lg ${grande ? 'text-xl sm:text-2xl' : 'text-base'}`}>{artista.nombre}</h3>
              <p className={`text-gray-300 mt-0.5 ${grande ? 'text-xs' : 'text-[11px]'}`}>
                {stats.titulos.length
                  ? `${stats.titulos.length} ${stats.titulos.length === 1 ? 'título' : 'títulos'} · ${miles(stats.palabras)} palabras`
                  : artista.proximo?.tandas.length
                    ? `Llega en la Tanda ${artista.proximo.tandas[0]}`
                    : 'Aún sin títulos en el proyecto'}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Reverso: sus datos en el proyecto ---------- */}
        <div className={`${cara} rotate-y-180`} inert={!volteada}>
          {/* Volteada, es el reverso el que vuela a la página del artista (el frente se vería al revés). */}
          <ViewTransition name={volteada ? transicionArtista(artista.nombre) : undefined} share="morph" default="none">
          <div className={interior}>
            {artista.foto && (
              <img src={tmdb(artista.foto, 'w185')} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125" />
            )}
            <div className={`relative h-full flex flex-col gap-2 overflow-y-auto ${grande ? 'p-4 text-xs' : 'p-3 text-[11px]'}`}>
              <div>
                <p className={`uppercase tracking-[0.2em] font-semibold text-[9px] ${colorIcono}`}>{RANGO[grupo]}</p>
                <h3 className={`font-real font-bold text-white leading-tight ${grande ? 'text-lg' : 'text-sm'}`}>{artista.nombre}</h3>
                <Link href={hrefArtista(artista.nombre)} onClick={e => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 mt-1 font-semibold hover:underline ${colorIcono} ${grande ? 'text-xs' : 'text-[10px]'}`}>
                  Ver su página <ArrowRight size={grande ? 12 : 10} />
                </Link>
              </div>
              <Cumpleanos artista={artista} hoy={hoy} />

              {stats.titulos.length ? (
                <>
                  <dl className="grid grid-cols-2 gap-1.5">
                    <Dato etiqueta="Palabras" valor={miles(stats.palabras)} color="text-pink-400" />
                    <Dato etiqueta="Líneas" valor={miles(stats.lineas)} color="text-emerald-400" />
                    <Dato etiqueta="Comprensión" valor={porcentaje(stats.comprension, 1)} color="text-cyan-400" />
                    <Dato etiqueta="Nivel" valor={stats.nivel ?? '—'} color="text-purple-400" />
                    <div className="col-span-2">
                      <Dato etiqueta="En pantalla" valor={duracion(stats.minutos)} color="text-amber-300" />
                    </div>
                  </dl>
                  <div className="mt-auto">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">
                      {stats.titulos.length} {stats.titulos.length === 1 ? 'título' : 'títulos'}
                    </p>
                    <p className="text-[10px] text-gray-500 mb-1 leading-snug">{resumenPapeles(stats)}</p>
                    <ul className="flex flex-wrap gap-1">
                      {stats.titulos.map(t => {
                        const indirectos = t.papeles.filter(p => p !== 'actua' && ICONO_PAPEL[p]);
                        return (
                        <li key={t.title} className="relative">
                          <Link href={hrefTitulo(t)} title={`${t.title} · ${t.papeles.map(p => PAPELES[p]).join(', ')}`} onClick={e => e.stopPropagation()}
                            className="block rounded overflow-hidden border border-white/10 hover:border-amber-300 hover:scale-110 transition">
                            {t.posterUrl
                              ? <img src={tmdb(t.posterUrl, 'w92')} alt={t.title} loading="lazy" className={`${grande ? 'w-9 h-[54px]' : 'w-7 h-[42px]'} object-cover`} />
                              : <span className={`${grande ? 'w-9 h-[54px]' : 'w-7 h-[42px]'} flex items-center justify-center bg-gray-800`}><Film size={12} /></span>}
                          </Link>
                          {indirectos.length > 0 && (
                            <span className="absolute -bottom-1 -right-1 flex gap-px pointer-events-none" aria-hidden>
                              {indirectos.map(p => {
                                const I = ICONO_PAPEL[p]!;
                                return <span key={p} className="rounded-full bg-amber-400 text-gray-950 p-0.5"><I size={8} strokeWidth={3} /></span>;
                              })}
                            </span>
                          )}
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="mt-auto text-gray-400 italic">
                  {artista.proximo
                    ? <>Llega con <span className="not-italic font-semibold text-gray-200">{nombreProximo(artista.proximo)}</span>: {cuandoLlega(artista.proximo)}.</>
                    : 'Todavía no aparece en ningún título del proyecto. ¡Su momento llegará!'}
                </p>
              )}
            </div>
          </div>
          </ViewTransition>
        </div>
      </div>
    </div>
  );
}
