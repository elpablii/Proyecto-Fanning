import { ViewTransition } from 'react';
import Link from 'next/link';
import { transicionArtista } from '@/lib/transiciones';
import { Crown, Heart } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';
import { grupoDe, hrefArtista, NOMBRE_RANGO, PAPELES, type ArtistaEnTitulo } from '@/lib/realeza';

export type { ArtistaEnTitulo };

// El póster de la ficha brilla rosa si hay un Amor Platónico y dorado si hay un Rey Supremo.
export function brilloRealeza(realeza: ArtistaEnTitulo[]): 'rosa' | 'oro' | undefined {
  if (realeza.some(a => a.rango === 'platonico')) return 'rosa';
  if (realeza.some(a => a.rango === 'supremo')) return 'oro';
}

// Quiénes de la Realeza están en una película o serie, y cómo participan. Cada uno lleva a su página.
export default function RealezaEnTitulo({ realeza, tipo }: { realeza: ArtistaEnTitulo[]; tipo: 'película' | 'serie' }) {
  if (!realeza.length) return null;
  const platonico = realeza.some(a => a.rango === 'platonico');
  const supremo = realeza.some(a => a.rango === 'supremo');
  const Icono = platonico ? Heart : Crown;
  // El marco toma el color del rango más alto que haya: rosa si hay un Amor Platónico, oro si hay un Rey Supremo.
  const marco = platonico
    ? 'border-pink-400/40 bg-linear-to-r from-pink-500/15 via-fuchsia-500/5 to-transparent shadow-[0_0_40px_rgba(236,72,153,0.15)]'
    : supremo
      ? 'border-amber-300/40 bg-linear-to-r from-amber-400/15 via-yellow-500/5 to-transparent shadow-[0_0_40px_rgba(251,191,36,0.15)]'
      : 'border-white/10 bg-white/5';

  return (
    <section aria-labelledby="realeza-titulo" className={`mb-10 rounded-3xl border backdrop-blur-xl p-5 sm:p-6 ${marco}`}>
      <h2 id="realeza-titulo" className={`font-real text-lg font-bold mb-4 flex items-center gap-2 ${platonico ? 'text-pink-300' : 'text-amber-300'}`}>
        <Icono size={20} className="latido-real" fill={platonico ? 'currentColor' : 'none'} aria-hidden />
        La Realeza en esta {tipo}
      </h2>
      <ul className="flex flex-wrap gap-3 sm:gap-4">
        {realeza.map(a => {
          const grupo = grupoDe(a);
          const rosa = grupo === 'platonicos' || grupo === 'reinas';
          const anillo = grupo === 'platonicos' ? 'border-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.5)]'
            : grupo === 'supremos' ? 'border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)]'
            : 'border-white/30';
          return (
            <li key={a.nombre}>
              <Link href={hrefArtista(a.nombre)}
                className="group flex items-center gap-3 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/30 pl-1.5 pr-5 py-1.5 transition">
                {a.foto
                  ? <ViewTransition name={transicionArtista(a.nombre)} share="morph" default="none"><img src={tmdb(a.foto, 'w185')} alt="" loading="lazy" className={`w-14 h-14 rounded-full object-cover object-top border-2 bg-gray-800 group-hover:scale-105 transition-transform ${anillo}`} /></ViewTransition>
                  : <span className={`w-14 h-14 rounded-full border-2 bg-gray-800 flex items-center justify-center ${anillo}`}><Crown size={18} className="text-gray-500" /></span>}
                <span>
                  <span className={`block text-[10px] uppercase tracking-[0.2em] font-semibold ${rosa ? 'text-pink-300' : 'text-amber-300'}`}>{NOMBRE_RANGO[grupo]}</span>
                  <span className="block font-real font-bold text-white leading-tight">{a.nombre}</span>
                  <span className="block text-xs text-gray-400">{a.papeles.map(p => PAPELES[p]).join(' · ')}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
