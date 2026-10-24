"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Album, ArrowLeft, ArrowRight, Copy, Crown, Film, Gift, Heart, PartyPopper, RotateCw, Sparkles, Star } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { hrefArtista, type Artista } from '@/lib/realeza';
import { fechaLarga, useHoy } from '@/components/realeza/Cumpleanos';
import FondoAnimado from '@/components/ui/FondoAnimado';

export interface Lamina {
  numero: number;             // #001, #002… en el orden del proyecto
  clave: string;              // "series:Euphoria": las repetidas comparten clave
  texto: string;              // como se escribió en la tanda
  titulo: string;
  poster: string | null;
  href: string | null;
  rareza: 'rosa' | 'oro' | 'plata' | 'comun';
  vez: number;                // cuántas veces va pegado este título (0: aún sin vocabulario)
  datos: {
    nivel: string | null;
    palabras: number;
    lineas: number;
    comprension: number | null;
    duracion: number | null;
    episodios: number | null;
  } | null;
  realeza: Pick<Artista, 'nombre' | 'foto' | 'rango'>[];
}

// Una tanda es una página del álbum.
export interface PaginaAlbum {
  id: string;                 // "14a", "74"
  numero: number;
  fecha: string;
  anio: string;
  etiqueta: 'gala' | 'navidad' | 'fin' | null;
  planificada: boolean;       // del txt de planificación: láminas por pegar
  porConfirmar: boolean;
  laminas: Lamina[];
}

const RAREZA = {
  rosa: { nombre: 'Brillante rosa', marco: 'bg-linear-to-br from-pink-200 via-rose-400 to-fuchsia-600', holo: true, icono: Heart, color: 'text-pink-300' },
  oro: { nombre: 'Brillante dorada', marco: 'bg-linear-to-br from-amber-100 via-amber-400 to-yellow-700', holo: true, icono: Crown, color: 'text-amber-300' },
  plata: { nombre: 'Brillante', marco: 'bg-linear-to-br from-slate-100 via-slate-400 to-slate-200', holo: true, icono: Sparkles, color: 'text-slate-200' },
  comun: { nombre: 'Común', marco: 'bg-white/90', holo: false, icono: Star, color: 'text-gray-400' },
} as const;

const ESPECIAL = {
  gala: { texto: 'Gala', icono: Sparkles, clase: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
  navidad: { texto: 'Navidad', icono: Gift, clase: 'bg-red-500/15 text-red-300 border-red-400/30' },
  fin: { texto: 'Fin de Año', icono: PartyPopper, clase: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30' },
};

const tres = (n: number) => `#${String(n).padStart(3, '0')}`;
const pegada = (p: PaginaAlbum, hoy: string) => !p.planificada && p.fecha <= hoy;

function LaminaAlbum({ lamina, pagina, hoy }: { lamina: Lamina; pagina: PaginaAlbum; hoy: string }) {
  const [volteada, setVolteada] = useState(false);
  const r = RAREZA[lamina.rareza];
  const estaPegada = pegada(pagina, hoy);

  // Lo que aún no se pega: un espacio con el número y el nombre, como en los álbumes de verdad.
  if (!estaPegada) {
    return (
      <li className="aspect-2/3 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] relative overflow-hidden flex flex-col items-center justify-center text-center p-2">
        {lamina.poster && (
          <img src={tmdb(lamina.poster, 'w185')} alt="" aria-hidden loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover grayscale ${pagina.planificada ? 'opacity-[0.07]' : 'opacity-20'}`} />
        )}
        <span className="relative font-black text-2xl sm:text-3xl text-white/25 tabular-nums">{tres(lamina.numero)}</span>
        <span className="relative mt-1 text-[10px] sm:text-[11px] leading-tight text-gray-400 line-clamp-3">{lamina.texto}</span>
        <span className="relative mt-2 text-[9px] uppercase tracking-wider text-gray-500">{pagina.planificada ? 'Por pegar' : 'Programada'}</span>
      </li>
    );
  }

  const voltear = () => setVolteada(v => !v);
  const cara = `absolute inset-0 backface-hidden rounded-xl p-[3px] shadow-lg shadow-black/40 ${r.marco}`;

  return (
    <li className="perspective-1000 pegar-lamina">
      <div role="button" tabIndex={0} aria-pressed={volteada}
        aria-label={`Lámina ${tres(lamina.numero)}: ${lamina.texto}. ${volteada ? 'Ver el frente' : 'Ver el reverso'}`}
        onClick={voltear}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } }}
        style={{ '--giro': volteada ? '180deg' : '0deg' } as React.CSSProperties}
        className="carta-real preserve-3d group relative aspect-2/3 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950">

        {/* ---------- Frente ---------- */}
        <div className={cara} inert={volteada}>
          <div className="relative h-full rounded-[9px] overflow-hidden bg-gray-900 flex flex-col">
            <div className="relative flex-1 min-h-0">
              {lamina.poster
                ? <img src={tmdb(lamina.poster, 'w342')} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-gray-600"><Film size={32} /></div>}
              {r.holo && <div className="absolute inset-0 pointer-events-none lamina-holo" />}
              <span className="absolute top-1.5 left-1.5 rounded-md bg-black/65 backdrop-blur-sm text-[10px] font-black text-white px-1.5 py-0.5 tabular-nums">{tres(lamina.numero)}</span>
              {lamina.rareza !== 'comun' && (
                <span className={`absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 ${r.color}`} title={r.nombre}>
                  <r.icono size={11} fill={lamina.rareza === 'rosa' ? 'currentColor' : 'none'} aria-hidden />
                </span>
              )}
              {lamina.vez > 1 && (
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-emerald-500/90 text-[9px] font-bold text-gray-950 px-1.5 py-0.5" title="Repetida">
                  ×{lamina.vez}
                </span>
              )}
            </div>
            <p className="px-1.5 py-1 text-[10px] sm:text-[11px] font-semibold leading-tight text-white bg-gray-950 line-clamp-2 min-h-[2.4em]">{lamina.texto}</p>
          </div>
        </div>

        {/* ---------- Reverso ---------- */}
        <div className={`${cara} rotate-y-180`} inert={!volteada}>
          <div className="relative h-full rounded-[9px] overflow-hidden bg-gray-900 p-2 flex flex-col gap-1.5 text-[10px] sm:text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-black text-white tabular-nums">{tres(lamina.numero)}</span>
              <RotateCw size={11} className="text-white/40" aria-hidden />
            </div>
            <p className="font-bold text-white leading-tight line-clamp-2">{lamina.texto}</p>
            <p className="text-gray-400">{pagina.id}° Tanda · {fechaLarga(pagina.fecha, true)}</p>
            {lamina.datos && (
              <dl className="grid grid-cols-2 gap-1">
                {[
                  ['Palabras', miles(lamina.datos.palabras), 'text-pink-300'],
                  ['Nivel', lamina.datos.nivel ?? '—', 'text-purple-300'],
                  ['Líneas', miles(lamina.datos.lineas), 'text-emerald-300'],
                  ['Duración', duracion(lamina.datos.duracion), 'text-amber-300'],
                ].map(([dt, dd, c]) => (
                  <div key={dt} className="rounded bg-white/5 px-1.5 py-1">
                    <dt className={`text-[8px] uppercase tracking-wider ${c}`}>{dt}</dt>
                    <dd className="font-bold text-white leading-tight">{dd}</dd>
                  </div>
                ))}
                {lamina.datos.comprension !== null && (
                  <div className="col-span-2 rounded bg-white/5 px-1.5 py-1">
                    <dt className="text-[8px] uppercase tracking-wider text-cyan-300">Comprensión</dt>
                    <dd className="font-bold text-white leading-tight">{porcentaje(lamina.datos.comprension, 1)}</dd>
                  </div>
                )}
              </dl>
            )}
            {lamina.realeza.length > 0 && (
              <ul className="flex flex-wrap gap-1">
                {lamina.realeza.slice(0, 6).map(a => (
                  <li key={a.nombre}>
                    <Link href={hrefArtista(a.nombre)} onClick={e => e.stopPropagation()} title={a.nombre}>
                      {a.foto && <img src={tmdb(a.foto, 'w92')} alt={a.nombre} loading="lazy"
                        className={`w-6 h-6 rounded-full object-cover object-top border ${a.rango === 'platonico' ? 'border-pink-400' : a.rango === 'supremo' ? 'border-amber-300' : 'border-white/20'}`} />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {lamina.href && (
              <Link href={lamina.href} onClick={e => e.stopPropagation()}
                className="mt-auto inline-flex items-center gap-1 font-semibold text-emerald-300 hover:underline">
                Ver la ficha <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Pagina({ pagina, hoy }: { pagina: PaginaAlbum; hoy: string }) {
  const especial = pagina.etiqueta ? ESPECIAL[pagina.etiqueta] : null;
  const pegadas = pegada(pagina, hoy) ? pagina.laminas.length : 0;
  return (
    <section aria-label={`${pagina.id}° Tanda`}
      className={`rounded-3xl border p-4 sm:p-6 bg-gray-900/70 shadow-xl ${pagina.planificada ? 'border-dashed border-white/15' : 'border-white/10'} ${pagina.numero === 100 ? 'ring-1 ring-amber-300/40' : ''}`}>
      <header className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="font-real text-xl font-bold text-white">{pagina.id}° Tanda</h3>
        <span className="text-sm text-gray-400">{fechaLarga(pagina.fecha, true)}</span>
        {pagina.numero === 100 && <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border bg-amber-500/15 text-amber-300 border-amber-400/30">Centenario</span>}
        {especial && (
          <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border flex items-center gap-1 ${especial.clase}`}>
            <especial.icono size={11} aria-hidden /> {especial.texto}
          </span>
        )}
        {pagina.porConfirmar && <span className="text-[10px] uppercase tracking-wider text-gray-500">por confirmar</span>}
        <span className="ml-auto text-xs text-gray-500 tabular-nums">{pegadas}/{pagina.laminas.length}</span>
      </header>
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {pagina.laminas.map(l => <LaminaAlbum key={l.numero} lamina={l} pagina={pagina} hoy={hoy} />)}
      </ul>
    </section>
  );
}

// Los títulos que se pegaron más de una vez (las series, temporada a temporada).
function Repetidas({ paginas, hoy }: { paginas: PaginaAlbum[]; hoy: string }) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, { lamina: Lamina; tandas: string[] }>();
    for (const p of paginas) {
      if (!pegada(p, hoy)) continue;
      for (const l of p.laminas) {
        const g = mapa.get(l.clave) ?? { lamina: l, tandas: [] };
        g.tandas.push(p.id);
        mapa.set(l.clave, g);
      }
    }
    return [...mapa.values()].filter(g => g.tandas.length > 1).sort((a, b) => b.tandas.length - a.tandas.length);
  }, [paginas, hoy]);

  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {grupos.map(({ lamina, tandas }) => (
        <li key={lamina.clave} className="flex gap-4 rounded-2xl border border-white/10 bg-gray-900/70 p-4">
          <div className="relative shrink-0">
            {/* El montoncito: la misma lámina tres veces, un poco corrida */}
            {[2, 1].map(i => lamina.poster && (
              <img key={i} src={tmdb(lamina.poster, 'w92')} alt="" aria-hidden
                className="absolute w-16 h-24 rounded-lg object-cover border-2 border-white/80 opacity-60"
                style={{ transform: `translate(${i * 5}px, ${i * -4}px) rotate(${i * 4}deg)` }} />
            ))}
            {lamina.poster
              ? <img src={tmdb(lamina.poster, 'w185')} alt="" className="relative w-16 h-24 rounded-lg object-cover border-2 border-white" />
              : <span className="relative w-16 h-24 rounded-lg bg-gray-800 border-2 border-white flex items-center justify-center"><Film size={16} /></span>}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white leading-tight">
              {lamina.href ? <Link href={lamina.href} className="hover:underline">{lamina.titulo}</Link> : lamina.titulo}
            </p>
            <p className="text-3xl font-black text-emerald-300 tabular-nums">×{tandas.length}</p>
            <ul className="flex flex-wrap gap-1 mt-1">
              {tandas.map((t, i) => <li key={i} className="text-[10px] rounded bg-white/5 px-1.5 py-0.5 text-gray-400">{t}°</li>)}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AlbumClient({ paginas, hoy: hoyBuild }: { paginas: PaginaAlbum[]; hoy: string }) {
  const hoy = useHoy(hoyBuild);
  const ciclos = useMemo(() => [...new Set(paginas.map(p => p.anio))].sort(), [paginas]);
  const [vista, setVista] = useState<string>(() => ciclos.includes(hoyBuild.slice(0, 4)) ? hoyBuild.slice(0, 4) : ciclos[0]);

  const resumen = useMemo(() => ciclos.map(c => {
    const del = paginas.filter(p => p.anio === c);
    return {
      ciclo: c,
      total: del.reduce((s, p) => s + p.laminas.length, 0),
      pegadas: del.filter(p => pegada(p, hoy)).reduce((s, p) => s + p.laminas.length, 0),
    };
  }), [paginas, ciclos, hoy]);
  const total = resumen.reduce((s, r) => s + r.total, 0);
  const pegadas = resumen.reduce((s, r) => s + r.pegadas, 0);
  const brillantes = paginas.filter(p => pegada(p, hoy)).flatMap(p => p.laminas).filter(l => l.rareza !== 'comun').length;
  const BOTON = 'px-4 py-1.5 rounded-full text-sm font-medium transition';

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="album" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link transitionTypes={['atras']} href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        {/* ---------- Portada ---------- */}
        <header className="relative overflow-hidden rounded-3xl border-4 border-white/80 bg-linear-to-br from-emerald-700 via-teal-800 to-gray-900 p-6 sm:p-10 mb-8 shadow-2xl animate-fade-in">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(244,114,182,0.2),transparent_50%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] font-semibold text-emerald-200/90">Edición oficial · 2023–2031</p>
            <h1 className="mt-2 font-real text-5xl md:text-7xl font-bold text-white drop-shadow-lg flex items-center gap-3">
              <Album size={52} className="text-amber-300 shrink-0" aria-hidden /> Álbum Fanning
            </h1>
            <p className="mt-3 text-emerald-50/80 max-w-2xl md:text-lg">
              Cada tanda es una página y cada título, una lámina. Las que tienen a alguien de la Realeza brillan. Toca
              una lámina para darla vuelta.
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-5xl font-black text-white tabular-nums">{miles(pegadas)}<span className="text-2xl text-white/50"> / {miles(total)}</span></p>
                <p className="text-sm text-emerald-100/70">láminas pegadas (las demás están planificadas)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-amber-300 tabular-nums">{miles(brillantes)}</p>
                <p className="text-sm text-emerald-100/70">brillantes</p>
              </div>
            </div>
          </div>
        </header>

        {/* ---------- Ciclos ---------- */}
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Secciones del álbum">
          {resumen.map(r => (
            <button key={r.ciclo} onClick={() => setVista(r.ciclo)} aria-pressed={vista === r.ciclo}
              className={`${BOTON} flex flex-col items-start gap-1 rounded-2xl py-2 ${vista === r.ciclo ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <span>Ciclo {r.ciclo}</span>
              <span className="w-full h-1 rounded-full bg-black/30 overflow-hidden">
                <span className="block h-full bg-amber-300" style={{ width: `${(r.pegadas / r.total) * 100}%` }} />
              </span>
              <span className="text-[10px] opacity-80 tabular-nums">{r.pegadas}/{r.total}</span>
            </button>
          ))}
          <button onClick={() => setVista('repetidas')} aria-pressed={vista === 'repetidas'}
            className={`${BOTON} rounded-2xl flex items-center gap-2 ${vista === 'repetidas' ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Copy size={14} aria-hidden /> Mis repetidas
          </button>
        </nav>

        {/* Al cambiar de sección, la página se da vuelta */}
        <div key={vista} className="pasar-pagina space-y-8">
          {vista === 'repetidas' ? (
            <>
              <p className="text-gray-400 max-w-3xl">
                Los títulos que se pegaron en más de una tanda: las series, que entran de a unos episodios, y lo que volvió.
              </p>
              <Repetidas paginas={paginas} hoy={hoy} />
            </>
          ) : (
            paginas.filter(p => p.anio === vista).map(p => <Pagina key={p.id} pagina={p} hoy={hoy} />)
          )}
        </div>
      </div>
    </div>
  );
}
