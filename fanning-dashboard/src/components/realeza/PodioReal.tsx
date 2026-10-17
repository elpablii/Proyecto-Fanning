"use client";

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Crown, Gauge, Trophy, Zap } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { grupoDe, hrefArtista, NOMBRE_RANGO, type Artista } from '@/lib/realeza';

// Lo que el podio necesita de cada miembro con títulos (se calcula en app/realeza/page.tsx).
export type FilaPodio = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'> & {
  titulos: number;
  palabras: number;
  lineas: number;
  minutos: number;
  comprension: number | null;
  ritmo: number | null;       // palabras por minuto de sus títulos, pesado por la duración
};

// Para "el inglés más difícil" solo cuenta quien tiene suficiente diálogo: con pocas líneas,
// un par de palabras desconocidas mueven mucho el porcentaje.
const MIN_LINEAS = 1000;

const CATEGORIAS = [
  {
    id: 'palabras', titulo: 'Más palabras enseñadas', icono: BookOpen,
    explicacion: 'Las palabras y frases nuevas que dejaron sus títulos.',
    valor: (f: FilaPodio) => f.palabras, texto: (f: FilaPodio) => `${miles(f.palabras)} palabras`, orden: 'desc',
  },
  {
    id: 'horas', titulo: 'Más horas juntos', icono: Clock,
    explicacion: 'El tiempo en pantalla de todos sus títulos en el proyecto.',
    valor: (f: FilaPodio) => f.minutos, texto: (f: FilaPodio) => duracion(f.minutos), orden: 'desc',
  },
  {
    id: 'dificil', titulo: 'El inglés más difícil', icono: Gauge,
    explicacion: `La comprensión más baja en sus títulos (con al menos ${miles(MIN_LINEAS)} líneas de diálogo).`,
    valor: (f: FilaPodio) => (f.lineas >= MIN_LINEAS ? f.comprension : null), texto: (f: FilaPodio) => `${porcentaje(f.comprension, 1)} de comprensión`, orden: 'asc',
  },
  {
    id: 'ritmo', titulo: 'El ritmo más rápido', icono: Zap,
    explicacion: 'Las palabras por minuto que se hablan en sus títulos.',
    valor: (f: FilaPodio) => f.ritmo, texto: (f: FilaPodio) => `${miles(f.ritmo)} palabras por minuto`, orden: 'desc',
  },
] as const;

type IdCategoria = typeof CATEGORIAS[number]['id'];

// Oro, plata y bronce en colores fijos (hexadecimales): se ven igual en el modo claro, que da vuelta
// la paleta de Tailwind. El texto del valor sí usa la paleta, para leerse en los dos modos.
const MEDALLA = [
  { nombre: 'Oro', anillo: 'border-[#fcd34d] shadow-[0_0_25px_rgba(251,191,36,0.55)]', base: 'from-[#fde68a] via-[#fbbf24] to-[#a16207]', texto: 'text-amber-200', alto: 'h-28 sm:h-32' },
  { nombre: 'Plata', anillo: 'border-[#e2e8f0] shadow-[0_0_20px_rgba(148,163,184,0.5)]', base: 'from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]', texto: 'text-slate-200', alto: 'h-20 sm:h-24' },
  { nombre: 'Bronce', anillo: 'border-[#fb923c] shadow-[0_0_20px_rgba(251,146,60,0.4)]', base: 'from-[#fed7aa] via-[#fb923c] to-[#92400e]', texto: 'text-orange-200', alto: 'h-14 sm:h-16' },
];

function Foto({ f, clase }: { f: FilaPodio; clase: string }) {
  return f.foto
    ? <img src={tmdb(f.foto, 'w185')} alt="" loading="lazy" className={`${clase} rounded-full object-cover object-top bg-gray-800`} />
    : <span className={`${clase} rounded-full bg-gray-800 flex items-center justify-center`}><Crown size={16} className="text-gray-500" /></span>;
}

export default function PodioReal({ filas }: { filas: FilaPodio[] }) {
  const [id, setId] = useState<IdCategoria>('palabras');
  const cat = CATEGORIAS.find(c => c.id === id)!;
  const orden = filas
    .map(f => ({ f, v: cat.valor(f) }))
    .filter((x): x is { f: FilaPodio; v: number } => x.v !== null)
    .sort((a, b) => (cat.orden === 'asc' ? a.v - b.v : b.v - a.v) || a.f.nombre.localeCompare(b.f.nombre));
  const podio = orden.slice(0, 3);
  const resto = orden.slice(3, 10);
  const tope = cat.orden === 'asc' ? null : orden[0]?.v ?? 1;
  // En el podio, el 1° va al centro: 2° · 1° · 3°.
  const lugares = [1, 0, 2].filter(i => podio[i]);

  return (
    <section aria-labelledby="podio" className="mb-16 rounded-3xl border border-amber-300/20 bg-linear-to-b from-amber-500/[0.07] to-transparent p-5 sm:p-8">
      <header className="text-center mb-6">
        <h2 id="podio" className="font-real text-2xl md:text-3xl font-bold inline-flex items-center gap-2 bg-linear-to-r from-amber-100 via-amber-300 to-yellow-600 bg-clip-text text-transparent">
          <Trophy size={24} className="text-amber-300" aria-hidden /> El Podio Real
        </h2>
        <p className="text-gray-400 text-sm mt-1">Quién dejó más huella en el proyecto.</p>
      </header>

      <div role="tablist" aria-label="Categoría del podio" className="flex flex-wrap justify-center gap-2 mb-2">
        {CATEGORIAS.map(c => (
          <button key={c.id} role="tab" aria-selected={c.id === id} onClick={() => setId(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${c.id === id
              ? 'bg-amber-400 text-gray-950 shadow-lg shadow-amber-900/40'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
            <c.icono size={14} aria-hidden /> {c.titulo}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mb-8">{cat.explicacion}</p>

      {/* El podio */}
      <ol className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto">
        {lugares.map(i => {
          const { f } = podio[i];
          const m = MEDALLA[i];
          return (
            <li key={f.nombre} className="flex-1 max-w-48 flex flex-col items-center text-center animate-fade-in">
              <Link href={hrefArtista(f.nombre)} className="group flex flex-col items-center">
                <span className="relative">
                  <Foto f={f} clase={`${i === 0 ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20'} border-4 ${m.anillo} group-hover:scale-105 transition-transform`} />
                  {i === 0 && <Crown size={26} className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" fill="currentColor" aria-hidden />}
                </span>
                <span className="mt-2 font-real font-bold text-white leading-tight text-sm sm:text-base group-hover:text-amber-200">{f.nombre}</span>
              </Link>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{NOMBRE_RANGO[grupoDe(f)]}</span>
              <span className={`text-xs sm:text-sm font-semibold mt-1 ${m.texto}`}>{cat.texto(f)}</span>
              <div className={`mt-3 w-full ${m.alto} rounded-t-xl bg-linear-to-b ${m.base} flex items-start justify-center pt-2 shadow-inner`}>
                <span className="text-2xl sm:text-3xl font-black text-[#030712]/70">{i + 1}</span>
                <span className="sr-only">{m.nombre}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Del 4° al 10° */}
      {resto.length > 0 && (
        <ol start={4} className="mt-8 max-w-2xl mx-auto space-y-1.5">
          {resto.map(({ f, v }, j) => (
            <li key={f.nombre}>
              <Link href={hrefArtista(f.nombre)} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition">
                <span className="w-5 text-right text-sm font-bold text-gray-500">{j + 4}</span>
                <Foto f={f} clase="w-9 h-9 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-gray-100 truncate">{f.nombre}</span>
                    <span className="text-gray-400 shrink-0">{cat.texto(f)}</span>
                  </span>
                  {tope !== null && (
                    <span className="block mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <span className="block h-full rounded-full bg-amber-300/70" style={{ width: `${(v / tope) * 100}%` }} />
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
