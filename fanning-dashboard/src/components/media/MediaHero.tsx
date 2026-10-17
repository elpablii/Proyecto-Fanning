import React, { ViewTransition } from 'react';
import { Film } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';

// Póster + título de una película o serie. Debajo del título va lo que se pase como hijos (cifras).
// Con la Realeza, el póster brilla: rosa por un Amor Platónico, oro por un Rey Supremo.
const BRILLO = {
  rosa: 'shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_45px_rgba(236,72,153,0.45)] border-pink-400/50',
  oro: 'shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_45px_rgba(251,191,36,0.45)] border-amber-300/50',
};

export default function MediaHero({ title, posterUrl, onPosterClick, brillo, transicion, children }: {
  title: string;
  transicion?: string;   // mismo nombre que el póster del catálogo (ver lib/transiciones.ts)
  posterUrl?: string | null;
  onPosterClick?: (url: string) => void;
  brillo?: keyof typeof BRILLO;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-16">
      {posterUrl ? (
        <ViewTransition name={transicion} share="morph" default="none">
        <img
          src={tmdb(posterUrl, 'w500')}
          alt={title}
          width={500}
          height={750}
          fetchPriority="high"
          onClick={() => onPosterClick?.(tmdb(posterUrl, 'original'))}
          className={`w-48 md:w-64 lg:w-72 rounded-2xl border transform hover:scale-105 transition-transform duration-500 cursor-pointer ${brillo ? BRILLO[brillo] : 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10'}`}
        />
        </ViewTransition>
      ) : (
        <div className="w-48 md:w-64 lg:w-72 aspect-2/3 bg-white/10 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
          <Film size={48} className="text-white/50" />
        </div>
      )}
      <div className="flex-1 pb-4 text-center md:text-left">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 drop-shadow-lg text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
