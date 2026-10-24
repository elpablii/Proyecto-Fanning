"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, Drama, Film, Heart, Mic, RotateCw, Search, X } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';
import { grupoDe, hrefArtista, hrefTitulo, NOMBRE_RANGO, type Artista } from '@/lib/realeza';
import { MARCO } from '@/components/realeza/CartaReal';
import FondoAnimado from '@/components/ui/FondoAnimado';
import Particulas from '@/components/realeza/Particulas';

export interface TituloPersonaje {
  title: string;
  type: 'movie' | 'series';
  posterUrl: string | null;
  fecha: string | null;       // primera tanda en que entró; null si aún no tiene tanda
  tanda: number | null;
}

// Una carta: un personaje de un artista, con todos los títulos donde lo interpreta.
export interface CartaPersonaje {
  artista: Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'>;
  personaje: string | null;   // null: aparece como sí mismo
  voz: boolean;               // le pone la voz (animación)
  titulos: TituloPersonaje[];
}

const nombrePersonaje = (c: CartaPersonaje) => c.personaje ?? (c.artista.tipo === 'reina' ? 'Ella misma' : 'Él mismo');

const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Carta({ carta }: { carta: CartaPersonaje }) {
  const [volteada, setVolteada] = useState(false);
  const grupo = grupoDe(carta.artista);
  const superior = grupo === 'supremos' || grupo === 'platonicos';
  const color = grupo === 'platonicos' || grupo === 'reinas' ? 'text-pink-300' : 'text-amber-300';
  const [primero, ...resto] = carta.titulos;
  const proximamente = carta.titulos.every(t => !t.fecha);
  const voltear = () => setVolteada(v => !v);
  const cara = `absolute inset-0 backface-hidden rounded-2xl ${MARCO[grupo]}`;
  const interior = 'relative h-full rounded-[13px] overflow-hidden bg-gray-900';

  return (
    <li className="perspective-1000">
      <div role="button" tabIndex={0} aria-pressed={volteada}
        aria-label={`${nombrePersonaje(carta)}, de ${carta.artista.nombre}. ${volteada ? 'Ver el frente' : 'Ver sus títulos'}`}
        onClick={voltear}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } }}
        style={{ '--giro': volteada ? '180deg' : '0deg' } as React.CSSProperties}
        className="carta-real preserve-3d group relative aspect-2/3 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950">

        {/* ---------- Frente: el póster y el personaje ---------- */}
        <div className={cara} inert={volteada}>
          <div className={interior}>
            {/* Si el personaje está en varios títulos, los otros pósters asoman detrás */}
            {resto.slice(0, 2).map((t, i) => t.posterUrl && (
              <img key={t.title} src={tmdb(t.posterUrl, 'w185')} alt="" aria-hidden loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                style={{ transform: `rotate(${(i + 1) * 4}deg) scale(0.92) translate(${(i + 1) * 6}%, -${(i + 1) * 3}%)` }} />
            ))}
            {primero.posterUrl
              ? <img src={tmdb(primero.posterUrl, 'w342')} alt="" loading="lazy" decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${proximamente ? 'grayscale-[60%]' : ''}`} />
              : <div className="absolute inset-0 flex items-center justify-center text-gray-600"><Film size={40} /></div>}
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
            <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${superior ? 'holo-real' : 'reflejo-real'}`} />

            <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              {carta.titulos.length > 1 && (
                <span className="rounded-full bg-black/60 backdrop-blur-sm border border-white/15 text-[10px] font-bold text-white px-2 py-0.5">
                  ×{carta.titulos.length}
                </span>
              )}
              {carta.voz && (
                <span title="Pone la voz" className="rounded-full bg-black/60 backdrop-blur-sm border border-white/15 p-1 text-sky-300">
                  <Mic size={11} aria-hidden />
                </span>
              )}
            </span>
            <RotateCw size={13} className="absolute top-2.5 right-2.5 text-white/40 group-hover:text-white/80 transition" aria-hidden />
            {proximamente && (
              <span className="absolute top-9 right-2 rounded-full bg-purple-600/80 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-0.5">Próximamente</span>
            )}

            <div className="absolute bottom-0 inset-x-0 p-3">
              <h3 className={`font-real font-bold text-white leading-tight drop-shadow-lg text-base sm:text-lg ${carta.personaje ? '' : 'italic'}`}>
                {nombrePersonaje(carta)}
              </h3>
              <p className="flex items-center gap-1.5 mt-1.5">
                {carta.artista.foto && (
                  <img src={tmdb(carta.artista.foto, 'w92')} alt="" loading="lazy"
                    className={`w-6 h-6 rounded-full object-cover object-top border ${grupo === 'platonicos' ? 'border-pink-400' : grupo === 'supremos' ? 'border-amber-300' : 'border-white/20'}`} />
                )}
                <span className={`text-[11px] font-semibold leading-tight ${color}`}>{carta.artista.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Reverso: en qué títulos ---------- */}
        <div className={`${cara} rotate-y-180`} inert={!volteada}>
          <div className={interior}>
            {primero.posterUrl && (
              <img src={tmdb(primero.posterUrl, 'w92')} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125" />
            )}
            <div className="relative h-full flex flex-col gap-2 overflow-y-auto p-3 text-[11px]">
              <div>
                <p className={`uppercase tracking-[0.2em] font-semibold text-[9px] ${color}`}>{NOMBRE_RANGO[grupo]}</p>
                <Link href={hrefArtista(carta.artista.nombre)} onClick={e => e.stopPropagation()}
                  className="font-real font-bold text-white text-sm hover:underline leading-tight">{carta.artista.nombre}</Link>
                <p className="text-gray-400 mt-0.5">
                  {carta.personaje
                    ? <>como <span className="text-gray-200 font-semibold">{carta.personaje}</span>{carta.voz && ' (voz)'}</>
                    : `Aparece como ${carta.artista.tipo === 'reina' ? 'ella misma' : 'él mismo'}`}
                </p>
              </div>
              <ul className="mt-auto space-y-1.5">
                {carta.titulos.map(t => (
                  <li key={t.title}>
                    <Link href={hrefTitulo(t)} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 p-1 pr-2 transition">
                      {t.posterUrl
                        ? <img src={tmdb(t.posterUrl, 'w92')} alt="" loading="lazy" className="w-7 h-[42px] rounded object-cover shrink-0" />
                        : <span className="w-7 h-[42px] rounded bg-gray-800 flex items-center justify-center shrink-0"><Film size={12} /></span>}
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-100 leading-tight line-clamp-2">{t.title}</span>
                        <span className="block text-[10px] text-gray-500">{t.tanda ? `${t.tanda}° Tanda` : 'Próximamente'}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function PersonajesClient({ cartas }: { cartas: CartaPersonaje[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [artista, setArtista] = useState<string | null>(null);
  const [orden, setOrden] = useState<'artista' | 'aparicion'>('artista');

  // Quienes tienen personajes, en el orden del Salón (la página ya los manda así).
  const artistas = useMemo(() => {
    const vistos = new Map<string, CartaPersonaje['artista'] & { cartas: number }>();
    for (const c of cartas) {
      const previo = vistos.get(c.artista.nombre);
      vistos.set(c.artista.nombre, { ...c.artista, cartas: (previo?.cartas ?? 0) + 1 });
    }
    return [...vistos.values()];
  }, [cartas]);

  const visibles = useMemo(() => {
    const q = plano(busqueda.trim());
    const lista = cartas.filter(c => (!artista || c.artista.nombre === artista) && (!q ||
      plano(`${nombrePersonaje(c)} ${c.artista.nombre} ${c.titulos.map(t => t.title).join(' ')}`).includes(q)));
    if (orden === 'aparicion') {
      return [...lista].sort((a, b) => (a.titulos[0].fecha ?? '9999').localeCompare(b.titulos[0].fecha ?? '9999'));
    }
    return lista;
  }, [cartas, busqueda, artista, orden]);

  const titulos = new Set(cartas.flatMap(c => c.titulos.map(t => t.title))).size;
  const BOTON = 'px-4 py-1.5 rounded-full text-sm font-medium transition';

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="salon" />
      <Particulas />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link transitionTypes={['atras']} href="/realeza" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al Salón del Trono
        </Link>

        <header className="text-center mb-10 animate-fade-in">
          <Drama size={40} className="mx-auto text-pink-300 drop-shadow-[0_0_18px_rgba(244,114,182,0.6)] mb-3" />
          <h1 className="font-real text-4xl md:text-6xl font-bold bg-linear-to-r from-pink-200 via-amber-200 to-pink-300 bg-clip-text text-transparent brillo-titulo">
            Galería de Personajes
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto md:text-lg">
            Cada papel que la Realeza interpretó en el proyecto, como una carta coleccionable. Tócala para darla
            vuelta y ver en qué títulos aparece ese personaje.
          </p>
          <dl className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              ['Personajes', cartas.filter(c => c.personaje).length, 'text-pink-300'],
              ['Artistas', artistas.length, 'text-amber-300'],
              ['Títulos', titulos, 'text-purple-300'],
            ].map(([etiqueta, valor, clase]) => (
              <div key={etiqueta} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 min-w-32">
                <dd className={`text-2xl font-extrabold ${clase}`}>{valor}</dd>
                <dt className="text-xs text-gray-400">{etiqueta}</dt>
              </div>
            ))}
          </dl>
        </header>

        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden />
              <span className="sr-only">Buscar</span>
              <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar un personaje, artista o título…"
                className="w-full rounded-xl bg-gray-900/80 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-pink-400/60" />
            </label>
            <div className="flex rounded-full bg-gray-900 border border-white/10 p-1 self-start" role="group" aria-label="Ordenar">
              {([['artista', 'Por artista'], ['aparicion', 'Por aparición']] as const).map(([valor, texto]) => (
                <button key={valor} onClick={() => setOrden(valor)} aria-pressed={orden === valor}
                  className={`${BOTON} py-1 ${orden === valor ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}>{texto}</button>
              ))}
            </div>
          </div>

          {/* Las caras de la Realeza: tocar una deja solo sus personajes */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="group" aria-label="Artista">
            {artistas.map(a => {
              const activo = artista === a.nombre;
              const g = grupoDe(a);
              return (
                <button key={a.nombre} onClick={() => setArtista(activo ? null : a.nombre)} aria-pressed={activo}
                  title={`${a.nombre} (${a.cartas})`}
                  className={`relative shrink-0 rounded-full transition ${activo ? 'ring-2 ring-offset-2 ring-offset-gray-950 scale-110 ' + (g === 'platonicos' || g === 'reinas' ? 'ring-pink-400' : 'ring-amber-300') : 'opacity-70 hover:opacity-100'}`}>
                  {a.foto
                    ? <img src={tmdb(a.foto, 'w92')} alt={a.nombre} loading="lazy" className="w-11 h-11 rounded-full object-cover object-top" />
                    : <span className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center">{g === 'platonicos' ? <Heart size={16} /> : <Crown size={16} />}</span>}
                </button>
              );
            })}
          </div>
          {artista && (
            <button onClick={() => setArtista(null)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1 text-xs text-gray-200 transition">
              {artista} <X size={12} aria-hidden /><span className="sr-only">Quitar filtro</span>
            </button>
          )}
        </div>

        {visibles.length ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {visibles.map(c => <Carta key={`${c.artista.nombre}|${c.personaje ?? ''}`} carta={c} />)}
          </ul>
        ) : (
          <p className="text-center text-gray-400 py-16">Ningún personaje coincide con la búsqueda.</p>
        )}
      </div>
    </div>
  );
}
