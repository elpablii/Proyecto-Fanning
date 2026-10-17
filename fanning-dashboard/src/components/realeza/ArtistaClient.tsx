"use client";

import { useRef, useState, ViewTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Crown, Film, GraduationCap, Heart, Layers, MessageSquare, Sparkles, Users } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import {
  grupoDe, hrefArtista, hrefTitulo, NOMBRE_RANGO, PAPELES, slugArtista,
  type Artista, type EstadisticasArtista, type IdGrupo, type TituloArtista,
} from '@/lib/realeza';
import type { VocabItem } from '@/types/media';
import Cumpleanos, { useHoy } from '@/components/realeza/Cumpleanos';
import { MARCO, resumenPapeles } from '@/components/realeza/CartaReal';
import FlashcardViewer from '@/components/ui/FlashcardViewer';
import CitaReal from '@/components/realeza/CitaReal';
import { transicionArtista, transicionPoster } from '@/lib/transiciones';

export type TituloEnPagina = TituloArtista & { tandas: number[]; fecha: string | null };
export type Vecino = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'>;
type ConexionEnPagina = Vecino & { titulos: string[] };

// Colores de cada grupo: oro para los Reyes Supremos, rosa para los Amores Platónicos.
const ACENTO: Record<IdGrupo, { texto: string; titulo: string; boton: string; resplandor: string; anillo: string }> = {
  supremos: {
    texto: 'text-amber-300', titulo: 'from-amber-100 via-amber-300 to-yellow-600',
    boton: 'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-amber-900/50',
    resplandor: 'rgba(251,191,36,0.20)', anillo: 'border-amber-300',
  },
  platonicos: {
    texto: 'text-pink-300', titulo: 'from-pink-200 via-rose-400 to-fuchsia-500',
    boton: 'bg-pink-500 hover:bg-pink-400 text-white shadow-pink-900/50',
    resplandor: 'rgba(236,72,153,0.20)', anillo: 'border-pink-400',
  },
  reinas: {
    texto: 'text-pink-300', titulo: 'from-pink-200 to-purple-400',
    boton: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50',
    resplandor: 'rgba(192,132,252,0.16)', anillo: 'border-pink-300/60',
  },
  reyes: {
    texto: 'text-amber-300', titulo: 'from-amber-200 to-sky-400',
    boton: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/50',
    resplandor: 'rgba(56,189,248,0.14)', anillo: 'border-amber-300/60',
  },
};

// [1] -> "Tanda 1"; [5, 6, 7] -> "Tandas 5–7"; [5, 9] -> "Tandas 5 y 9".
function textoTandas(numeros: number[]): string {
  if (!numeros.length) return 'Aún sin tanda';
  const s = [...numeros].sort((a, b) => a - b);
  const ultima = s[s.length - 1];
  if (s.length === 1) return `Tanda ${s[0]}`;
  if (ultima - s[0] === s.length - 1) return `Tandas ${s[0]}–${ultima}`;
  if (s.length <= 3) return `Tandas ${s.slice(0, -1).join(', ')} y ${ultima}`;
  return `${s.length} tandas, desde la ${s[0]}`;
}

function Cifra({ icono: Icono, etiqueta, valor, nota, color }: {
  icono: typeof BookOpen; etiqueta: string; valor: string; nota?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4">
      <Icono size={18} className={`${color} mb-2`} aria-hidden />
      <p className="text-2xl font-extrabold text-white leading-none">{valor}</p>
      <p className={`text-[11px] uppercase tracking-wider font-semibold mt-1.5 ${color}`}>{etiqueta}</p>
      {nota && <p className="text-[11px] text-gray-500 mt-0.5">{nota}</p>}
    </div>
  );
}

function Retrato({ a, tamano = 'w-14 h-14' }: { a: Vecino; tamano?: string }) {
  const grupo = grupoDe(a);
  return a.foto
    ? <img src={tmdb(a.foto, 'w185')} alt="" loading="lazy" className={`${tamano} rounded-full object-cover object-top border-2 bg-gray-800 ${ACENTO[grupo].anillo}`} />
    : <span className={`${tamano} rounded-full border-2 bg-gray-800 flex items-center justify-center ${ACENTO[grupo].anillo}`}><Crown size={18} className="text-gray-500" /></span>;
}

export default function ArtistaClient({
  artista, stats, tandas, primeraTanda, conexiones, totalVocabulario, comprensionProyecto, anterior, siguiente, hoy,
}: {
  artista: Artista;
  stats: Omit<EstadisticasArtista, 'titulos'> & { titulos: TituloEnPagina[] };
  tandas: number;
  primeraTanda: number | null;
  conexiones: ConexionEnPagina[];
  totalVocabulario: number;
  comprensionProyecto: number | null;
  anterior: Vecino | null;
  siguiente: Vecino | null;
  hoy: string;
}) {
  const hoyNavegador = useHoy(hoy);
  const grupo = grupoDe(artista);
  const acento = ACENTO[grupo];
  const superior = grupo === 'supremos' || grupo === 'platonicos';
  const Icono = grupo === 'platonicos' ? Heart : Crown;
  const slug = slugArtista(artista.nombre);

  // El vocabulario no viene con la página: se pide la primera vez que se estudia y queda guardado.
  const vocabulario = useRef<VocabItem[] | null>(null);
  const [tarjetas, setTarjetas] = useState<VocabItem[] | null>(null);
  const [estado, setEstado] = useState<'listo' | 'cargando' | 'fallo'>('listo');
  const estudiar = async () => {
    setEstado('cargando');
    try {
      if (!vocabulario.current) {
        const respuesta = await fetch(`/realeza/${slug}/vocabulario`);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        vocabulario.current = await respuesta.json() as VocabItem[];
      }
      setTarjetas(vocabulario.current);
      setEstado('listo');
    } catch {
      setEstado('fallo');
    }
  };

  const hayTitulos = stats.titulos.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans relative overflow-x-hidden pb-20">
      {/* Fondo: su foto difuminada y el resplandor de su grupo */}
      <div aria-hidden className="fixed inset-0 pointer-events-none">
        {artista.foto && (
          <img src={tmdb(artista.foto, 'w500')} alt="" className="w-full h-full object-cover object-top opacity-25 blur-3xl scale-110" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-gray-950/40 via-gray-950/80 to-gray-950" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${acento.resplandor}, transparent 60%)` }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <nav className="flex flex-wrap items-center justify-between gap-3 mb-8 text-sm font-medium">
          <Link href={`/realeza#${slug}`} className="inline-flex items-center text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} className="mr-2" /> Volver al Salón del Trono
          </Link>
          <Link href="/" className="text-gray-500 hover:text-white transition">Inicio</Link>
        </nav>

        {/* ---------- Portada ---------- */}
        <header className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-end mb-12 animate-fade-in">
          <div className={`group relative w-56 md:w-72 aspect-2/3 shrink-0 rounded-2xl ${MARCO[grupo]}`}>
            <div className="relative h-full rounded-[13px] overflow-hidden bg-gray-900">
              {artista.foto
                ? <ViewTransition name={transicionArtista(artista.nombre)} share="morph" default="none"><img src={tmdb(artista.foto, 'w500')} alt={artista.nombre} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-top" /></ViewTransition>
                : <div className="absolute inset-0 flex items-center justify-center text-gray-600"><Icono size={64} /></div>}
              {superior && <div className="absolute inset-0 holo-real opacity-40 group-hover:opacity-80 transition-opacity duration-500" />}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left pb-2">
            <p className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-1 text-xs uppercase tracking-[0.25em] font-semibold ${acento.texto}`}>
              <Icono size={14} fill={grupo === 'platonicos' ? 'currentColor' : 'none'} aria-hidden /> {NOMBRE_RANGO[grupo]}
            </p>
            <h1 className={`mt-4 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] bg-linear-to-r ${acento.titulo} bg-clip-text text-transparent drop-shadow-lg`}>
              {artista.nombre}
            </h1>
            <Cumpleanos artista={artista} hoy={hoyNavegador} className="justify-center md:justify-start mt-4 text-sm" />
            {hayTitulos ? (
              <>
                <p className="text-gray-300 mt-3 md:text-lg">{resumenPapeles(stats)}</p>
                {primeraTanda !== null && (
                  <p className="text-gray-400 mt-1 text-sm">
                    En el proyecto desde la <span className="text-white font-semibold">Tanda {primeraTanda}</span>
                    {tandas > 1 && <> · presente en <span className="text-white font-semibold">{tandas} tandas</span></>}
                  </p>
                )}
                {totalVocabulario > 0 && (
                  <button onClick={estudiar} disabled={estado === 'cargando'}
                    className={`mt-6 inline-flex items-center gap-2 font-bold py-3 px-5 rounded-xl transition shadow-lg disabled:opacity-60 ${acento.boton}`}>
                    <Layers size={20} />
                    {estado === 'cargando' ? 'Cargando…'
                      : estado === 'fallo' ? 'No se pudo cargar · Reintentar'
                      : `Estudiar su vocabulario (${miles(totalVocabulario)} palabras)`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic mt-4">Todavía no aparece en ningún título del proyecto. ¡Su momento llegará!</p>
            )}
          </div>
        </header>

        {artista.cita && (
          <div className="mb-14 animate-fade-in">
            <CitaReal cita={artista.cita} grande color={acento.texto}
              href={(() => { const t = stats.titulos.find(x => x.title === artista.cita!.titulo); return t ? hrefTitulo(t) : undefined; })()} />
          </div>
        )}

        {hayTitulos && (
          <>
            {/* ---------- Cifras ---------- */}
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-14">
              <Cifra icono={Film} etiqueta={stats.titulos.length === 1 ? 'Título' : 'Títulos'} valor={miles(stats.titulos.length)} color="text-sky-300" />
              <Cifra icono={BookOpen} etiqueta="Palabras" valor={miles(stats.palabras)} color="text-pink-400" />
              <Cifra icono={MessageSquare} etiqueta="Líneas" valor={miles(stats.lineas)} color="text-emerald-400" />
              <Cifra icono={Sparkles} etiqueta="Comprensión" valor={porcentaje(stats.comprension, 1)} color="text-cyan-400"
                nota={comprensionProyecto !== null ? `Proyecto: ${porcentaje(comprensionProyecto, 1)}` : undefined} />
              <Cifra icono={GraduationCap} etiqueta="Nivel MCER" valor={stats.nivel ?? '—'} color="text-purple-400" />
              <Cifra icono={Clock} etiqueta="En pantalla" valor={duracion(stats.minutos)} color="text-amber-300" />
            </dl>

            {/* ---------- Filmografía ---------- */}
            <section aria-labelledby="filmografia" className="mb-14">
              <h2 id="filmografia" className="text-2xl md:text-3xl font-extrabold mb-6 flex items-center gap-2">
                <Film className={acento.texto} /> Su paso por el proyecto
              </h2>
              <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {stats.titulos.map(t => (
                  <li key={`${t.type}:${t.title}`}>
                    <Link href={hrefTitulo(t)} className="group block">
                      <div className="relative aspect-2/3 rounded-xl overflow-hidden border border-white/10 bg-gray-800 shadow-lg group-hover:border-white/40 transition">
                        {t.posterUrl
                          ? <ViewTransition name={transicionPoster(t.type, t.title)} share="morph" default="none"><img src={tmdb(t.posterUrl, 'w342')} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /></ViewTransition>
                          : <span className="absolute inset-0 flex items-center justify-center text-gray-600"><Film size={32} /></span>}
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
                        <span className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-200">
                          {textoTandas(t.tandas)}
                        </span>
                        <div className="absolute bottom-0 inset-x-0 p-2.5">
                          <p className={`text-[10px] font-semibold ${acento.texto}`}>{t.papeles.map(p => PAPELES[p]).join(' · ')}</p>
                          <p className="text-[11px] text-gray-300">{miles(t.count)} palabras</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-200 leading-tight group-hover:text-white">{t.title}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {/* ---------- Conexiones ---------- */}
        {conexiones.length > 0 && (
          <section aria-labelledby="conexiones" className="mb-14">
            <h2 id="conexiones" className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-2">
              <Users className={acento.texto} /> Comparte pantalla con
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Otros miembros de la Realeza que aparecen en sus mismos títulos.{' '}
              <Link href="/realeza/constelacion" className="text-indigo-300 hover:underline">Ver toda la Constelación Real</Link>
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conexiones.map(c => (
                <li key={c.nombre}>
                  <Link href={hrefArtista(c.nombre)}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 backdrop-blur-md p-3 transition">
                    <Retrato a={c} />
                    <span className="min-w-0">
                      <span className="block font-bold text-white truncate">{c.nombre}</span>
                      <span className="block text-xs text-gray-400 line-clamp-2" title={c.titulos.join(', ')}>
                        {c.titulos.length === 1 ? c.titulos[0] : `${c.titulos.length} títulos: ${c.titulos.join(', ')}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Anterior y siguiente, en el orden del Salón ---------- */}
        {anterior && siguiente && (
          <nav aria-label="Otros miembros de la Realeza" className="flex flex-col sm:flex-row justify-between gap-3 pt-8 border-t border-white/10">
            {[anterior, siguiente].map((v, i) => (
              <Link key={i} href={hrefArtista(v.nombre)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition ${i === 1 ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
                {i === 0 ? <ArrowLeft size={18} className="text-gray-500 shrink-0" /> : <ArrowRight size={18} className="text-gray-500 shrink-0" />}
                <Retrato a={v} tamano="w-11 h-11" />
                <span>
                  <span className="block text-[11px] uppercase tracking-wider text-gray-500">{i === 0 ? 'Anterior' : 'Siguiente'}</span>
                  <span className="block font-bold text-white">{v.nombre}</span>
                </span>
              </Link>
            ))}
          </nav>
        )}
      </div>

      {tarjetas && <FlashcardViewer cards={tarjetas} onClose={() => setTarjetas(null)} />}
    </div>
  );
}
