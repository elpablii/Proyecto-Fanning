"use client";

import Link from 'next/link';
import { ArrowLeft, Crown, Heart, Sparkles, Stars } from 'lucide-react';
import { miles } from '@/lib/formato';
import { agrupar, type IdGrupo } from '@/lib/realeza';
import CartaReal, { type ArtistaSalon } from '@/components/realeza/CartaReal';
import { useHoy } from '@/components/realeza/Cumpleanos';
import PodioReal, { type FilaPodio } from '@/components/realeza/PodioReal';
import Particulas from '@/components/realeza/Particulas';

export type { ArtistaSalon };

// Cómo se ve cada grupo en el salón: los rangos superiores van arriba, en cartas grandes.
const ESTILO: Record<IdGrupo, { texto: string; titulo: string; grilla: string; grande: boolean }> = {
  supremos: {
    texto: 'Los tres pilares del trono. Donde aparecen ellos, el proyecto se detiene a mirar.',
    titulo: 'from-amber-100 via-amber-300 to-yellow-600',
    grilla: 'grid-cols-2 md:grid-cols-3 max-w-3xl',
    grande: true,
  },
  platonicos: {
    texto: 'Las reinas del corazón. Dakota y Elle Fanning, además, le dan su nombre al proyecto.',
    titulo: 'from-pink-200 via-rose-400 to-fuchsia-500',
    grilla: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    grande: true,
  },
  reinas: { texto: '', titulo: 'from-pink-300 to-purple-400', grilla: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', grande: false },
  reyes: { texto: '', titulo: 'from-amber-200 to-sky-400', grilla: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', grande: false },
};

export default function SalonClient({ artistas, podio, titulosConRealeza, palabrasConRealeza, hoy }: {
  artistas: ArtistaSalon[];
  podio: FilaPodio[];
  titulosConRealeza: number;
  palabrasConRealeza: number;
  hoy: string;
}) {
  const grupos = agrupar(artistas);
  const hoyNavegador = useHoy(hoy);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Resplandor de fondo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.10),transparent_50%)]" />
      <Particulas />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <Crown size={40} className="mx-auto text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.6)] mb-3" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-linear-to-r from-amber-200 via-pink-300 to-amber-200 bg-clip-text text-transparent">
            El Salón del Trono
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto md:text-lg">
            Ellas y ellos son la razón por la que este proyecto se disfruta tanto. Pasa el mouse sobre una carta
            para verla brillar y tócala para darla vuelta: atrás está todo lo que te enseñó.
          </p>
          <dl className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              ['Miembros', miles(artistas.length), 'text-amber-300'],
              ['Títulos con la Realeza', miles(titulosConRealeza), 'text-pink-300'],
              ['Palabras en esos títulos', miles(palabrasConRealeza), 'text-purple-300'],
            ].map(([etiqueta, valor, color]) => (
              <div key={etiqueta} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 min-w-36">
                <dd className={`text-2xl font-extrabold ${color}`}>{valor}</dd>
                <dt className="text-xs text-gray-400">{etiqueta}</dt>
              </div>
            ))}
          </dl>
          <Link href="/realeza/constelacion"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 px-4 py-2 text-sm font-medium transition">
            <Stars size={16} aria-hidden /> Ver la Constelación Real
          </Link>
        </header>

        <PodioReal filas={podio} />

        <div className="space-y-16">
          {grupos.map(g => {
            const estilo = ESTILO[g.id];
            const Icono = g.id === 'platonicos' ? Heart : g.id === 'supremos' ? Crown : Sparkles;
            return (
              <section key={g.id} aria-labelledby={`grupo-${g.id}`}>
                <header className={`mb-6 ${estilo.grande ? 'text-center' : ''}`}>
                  <h2 id={`grupo-${g.id}`} className={`text-2xl md:text-3xl font-extrabold inline-flex items-center gap-2 bg-linear-to-r ${estilo.titulo} bg-clip-text text-transparent`}>
                    <Icono size={24} className={g.id === 'platonicos' || g.id === 'reinas' ? 'text-pink-300' : 'text-amber-300'}
                      fill={g.id === 'platonicos' ? 'currentColor' : 'none'} aria-hidden />
                    {g.nombre}
                    <span className="text-base font-medium text-gray-500">({g.miembros.length})</span>
                  </h2>
                  {(estilo.texto || g.descripcion) && (
                    <p className="text-gray-400 text-sm mt-1">{estilo.texto || g.descripcion}</p>
                  )}
                </header>
                <div className={`grid gap-4 sm:gap-6 ${estilo.grilla} ${estilo.grande ? 'mx-auto' : ''}`}>
                  {g.miembros.map(a => <CartaReal key={a.nombre} artista={a} hoy={hoyNavegador} grande={estilo.grande} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
