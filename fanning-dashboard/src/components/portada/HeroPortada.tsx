import Link from 'next/link';
import { BookA, BookOpen, Calendar, Clapperboard, Crown, Gauge, Heart, Search } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';
import { hrefArtista } from '@/lib/realeza';
import RelojActual from '@/components/portada/RelojActual';

// Tres filas de pósters que desfilan despacio detrás del título (quietas con "reducir movimiento").
function Mosaico({ posters }: { posters: string[] }) {
  const porFila = Math.ceil(posters.length / 3);
  const filas = [0, 1, 2].map(i => posters.slice(i * porFila, (i + 1) * porFila)).filter(f => f.length);
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col justify-center gap-3 -rotate-6 scale-125 opacity-30">
      {filas.map((fila, i) => (
        // La fila va dos veces seguida: al llegar a la mitad vuelve al inicio sin que se note el salto.
        <div key={i} className={`flex gap-3 w-max desfile ${i % 2 ? 'desfile-inverso' : ''}`} style={{ animationDuration: `${140 + i * 30}s` }}>
          {[...fila, ...fila].map((url, j) => (
            // Prioridad baja: son decorado y no deben quitarle ancho de banda al resto de la portada
            <img key={j} src={tmdb(url, 'w185')} alt="" decoding="async" fetchPriority="low" className="w-24 sm:w-28 aspect-2/3 object-cover rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Sin backdrop-blur: con el mosaico moviéndose detrás, el desenfoque se recalculaba en cada cuadro.
const BOTON = 'flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium border';

export default function HeroPortada({ posters, onBuscar }: { posters: string[]; onBuscar: () => void }) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900 mb-8 md:mb-10 shadow-2xl">
      <Mosaico posters={posters} />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-gray-950 via-gray-950/85 to-gray-950/40" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.18),transparent_50%)]" />

      <div className="relative px-5 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16">
        <RelojActual className="mb-6 lg:mb-0 lg:absolute lg:top-8 lg:right-8" />
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold text-purple-300/90">
          Inglés real, con películas y series · desde 2023
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] bg-linear-to-r from-purple-300 via-pink-400 to-rose-400 bg-clip-text text-transparent pb-1 brillo-titulo">
          Proyecto Fanning
        </h1>
        <p className="mt-4 text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl">
          Cada película y serie se ve en inglés, y cada palabra que no se entiende queda anotada. Aquí está todo
          lo aprendido: cuánto vocabulario, cuánto se entiende y cómo se va mejorando tanda a tanda.
        </p>
        <p className="mt-3 text-sm text-gray-400 flex items-start gap-2 max-w-2xl">
          <Heart size={14} className="text-pink-400 mt-0.5 shrink-0" fill="currentColor" aria-hidden />
          <span>
            Se llama así por las hermanas{' '}
            <Link href={hrefArtista('Dakota Fanning')} className="text-pink-300 hover:text-pink-200 underline underline-offset-2 decoration-pink-400/40">Dakota</Link> y{' '}
            <Link href={hrefArtista('Elle Fanning')} className="text-pink-300 hover:text-pink-200 underline underline-offset-2 decoration-pink-400/40">Elle Fanning</Link>,
            dos de las actrices favoritas del proyecto.{' '}
            <Link href="/realeza/casa-fanning" className="text-pink-300 hover:text-pink-200 underline underline-offset-2 decoration-pink-400/40 whitespace-nowrap">Conoce la Casa Fanning</Link>
          </span>
        </p>

        <nav className="flex flex-wrap gap-3 mt-8">
          <Link href="/timeline" className={`${BOTON} bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border-blue-500/30`}>
            <Calendar size={16} /> Línea de Tiempo
          </Link>
          <Link href="/realeza" className={`${BOTON} bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border-amber-400/30`}>
            <Crown size={16} /> La Realeza
          </Link>
          <Link href="/reglas" className={`${BOTON} bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border-purple-500/30`}>
            <BookOpen size={16} /> Constitución del Proyecto Fanning
          </Link>
          <Link href="/diccionario" className={`${BOTON} bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/30`}>
            <BookA size={16} /> Diccionario
          </Link>
          <Link href="/ritmo" className={`${BOTON} bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border-cyan-500/30`}>
            <Gauge size={16} /> Ritmo del Inglés
          </Link>
          <Link href="/generos" className={`${BOTON} bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border-violet-500/30`}>
            <Clapperboard size={16} /> Géneros y Épocas
          </Link>
          <button onClick={onBuscar} title="Buscar (Ctrl + K)" className={`${BOTON} bg-white/5 hover:bg-white/10 text-gray-200 border-white/10`}>
            <Search size={16} /> Buscar
            <kbd className="hidden md:inline text-[10px] text-gray-400 border border-white/15 rounded px-1.5 py-0.5 font-mono">Ctrl K</kbd>
          </button>
        </nav>
      </div>
    </header>
  );
}
