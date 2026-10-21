"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarRange, Clapperboard, Hourglass, Sparkles, X } from 'lucide-react';
import { duracion, miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { hrefTitulo } from '@/lib/realeza';
import FondoAnimado from '@/components/ui/FondoAnimado';

export interface TituloGenero {
  title: string;
  type: 'movie' | 'series';
  poster: string | null;
  genres: string[];
  year: number | null;        // año de estreno (series: el del primer episodio)
}

// Un título dentro de un universo (el histórico o un ciclo): [posición en la lista de títulos,
// palabras, líneas, minutos]. En un ciclo, las series cuentan solo sus episodios de ese año.
export type FilaUniverso = [number, number, number, number];

type Metrica = 'titulos' | 'palabras' | 'minutos';
type Eleccion = { tipo: 'genero' | 'decada'; valor: string } | null;

const METRICAS: Record<Metrica, string> = { titulos: 'Títulos', palabras: 'Palabras', minutos: 'Horas' };

interface Grupo {
  clave: string;
  titulos: number;
  palabras: number;
  minutos: number;
  filas: FilaUniverso[];
}

function agrupar(filas: FilaUniverso[], claves: (f: FilaUniverso) => string[]): Map<string, Grupo> {
  const mapa = new Map<string, Grupo>();
  for (const f of filas) {
    for (const clave of claves(f)) {
      const g = mapa.get(clave) ?? { clave, titulos: 0, palabras: 0, minutos: 0, filas: [] };
      g.titulos += 1;
      g.palabras += f[1];
      g.minutos += f[3];
      g.filas.push(f);
      mapa.set(clave, g);
    }
  }
  return mapa;
}

const valor = (g: Pick<Grupo, Metrica>, m: Metrica) => g[m];
const texto = (n: number, m: Metrica) => (m === 'minutos' ? duracion(n) : miles(n));

// ---------- Géneros: barras horizontales ----------

// `max` va aparte porque la lista se parte en dos columnas: todas las barras usan la misma escala.
function Barras({ grupos, metrica, max, elegido, onElegir }: {
  grupos: Grupo[]; metrica: Metrica; max: number; elegido: string | null; onElegir: (clave: string) => void;
}) {
  return (
    <ol className="space-y-1">
      {grupos.map(g => {
        const activo = elegido === g.clave;
        return (
          <li key={g.clave}>
            <button onClick={() => onElegir(g.clave)} aria-pressed={activo}
              className={`w-full grid grid-cols-[minmax(6rem,11rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition ${activo ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <span className={`text-sm truncate ${activo ? 'text-white font-bold' : 'text-gray-300'}`}>{g.clave}</span>
              {/* La barra parte en cero */}
              <span className="h-2.5 rounded-full bg-white/5">
                <span className="block h-full rounded-full bg-violet-400" style={{ width: `${(valor(g, metrica) / max) * 100}%` }} />
              </span>
              <span className="text-sm font-bold text-white tabular-nums text-right min-w-12">{texto(valor(g, metrica), metrica)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Décadas: columnas ----------

function Decadas({ grupos, metrica, elegido, onElegir }: {
  grupos: Grupo[]; metrica: Metrica; elegido: string | null; onElegir: (clave: string) => void;
}) {
  const max = Math.max(...grupos.map(g => valor(g, metrica)), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-64 pt-8" role="group" aria-label="Décadas">
      {grupos.map(g => {
        const activo = elegido === g.clave;
        const v = valor(g, metrica);
        return (
          <button key={g.clave} onClick={() => onElegir(g.clave)} aria-pressed={activo} disabled={v === 0}
            aria-label={`Década de ${g.clave}: ${texto(v, metrica)}`}
            className="group flex-1 h-full flex flex-col justify-end items-center gap-1.5 min-w-0">
            {/* Columna desde cero, con el extremo de arriba redondeado. Va en su propia caja (sin las
                etiquetas), así su alto es proporcional de verdad; el valor va encima de la columna. */}
            <span className="relative flex-1 w-full flex items-end justify-center">
              <span className={`relative w-full max-w-12 rounded-t-md transition ${v > 0 ? (activo ? 'bg-amber-300' : 'bg-amber-400/80 group-hover:bg-amber-300') : ''}`}
                style={{ height: `${v > 0 ? Math.max((v / max) * 100, 1.5) : 0}%` }}>
                <span className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[11px] sm:text-xs font-bold tabular-nums whitespace-nowrap ${activo ? 'text-white' : 'text-gray-300'}`}>
                  {texto(v, metrica)}
                </span>
              </span>
            </span>
            <span className={`text-[11px] sm:text-xs ${activo ? 'text-white font-bold' : 'text-gray-400'}`}>{g.clave}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Vitrina: los títulos de lo elegido ----------

function Vitrina({ titulo, filas, titulos, metrica, onCerrar }: {
  titulo: string; filas: FilaUniverso[]; titulos: TituloGenero[]; metrica: Metrica; onCerrar: () => void;
}) {
  const orden = [...filas].sort((a, b) => (metrica === 'palabras' ? b[1] - a[1] : metrica === 'minutos' ? b[3] - a[3] : (titulos[a[0]].year ?? 0) - (titulos[b[0]].year ?? 0)));
  return (
    <section aria-live="polite" className="mt-6 rounded-2xl border border-white/10 bg-gray-950/60 p-4 sm:p-5 animate-fade-in">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-extrabold text-lg">{titulo} <span className="text-gray-500 font-medium text-sm">({miles(filas.length)})</span></h3>
        <button onClick={onCerrar} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10" aria-label="Cerrar"><X size={18} /></button>
      </header>
      <ol className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
        {orden.map(f => {
          const t = titulos[f[0]];
          return (
            <li key={f[0]}>
              <Link href={hrefTitulo(t)} className="group block">
                <span className="block aspect-2/3 rounded-lg overflow-hidden border border-white/10 bg-gray-800 group-hover:border-white/40 transition">
                  {t.poster && <img src={tmdb(t.poster, 'w185')} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-gray-200 leading-tight line-clamp-2 group-hover:text-white">{t.title}</span>
                <span className="block text-[10px] text-gray-500">{t.year ?? '—'} · {metrica === 'minutos' ? duracion(f[3]) : `${miles(f[1])} palabras`}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function GenerosClient({ titulos, universos }: {
  titulos: TituloGenero[];
  universos: Record<string, FilaUniverso[]>;
}) {
  const anios = ['all', ...Object.keys(universos).filter(a => a !== 'all').sort()];
  const [anio, setAnio] = useState('all');
  const [metrica, setMetrica] = useState<Metrica>('titulos');
  const [eleccion, setEleccion] = useState<Eleccion>(null);
  const filas = useMemo(() => universos[anio] ?? [], [universos, anio]);

  const porGenero = useMemo(() => agrupar(filas, f => titulos[f[0]].genres), [filas, titulos]);
  const porDecada = useMemo(() => agrupar(filas, f => {
    const y = titulos[f[0]].year;
    return y ? [`${Math.floor(y / 10) * 10}`] : [];
  }), [filas, titulos]);

  const generosOrden = [...porGenero.values()].sort((a, b) => valor(b, metrica) - valor(a, metrica) || a.clave.localeCompare(b.clave));
  const mitad = Math.ceil(generosOrden.length / 2);
  // Todas las décadas entre la primera y la última, también las que no tienen nada (una columna en cero).
  const decadasOrden = useMemo(() => {
    const claves = [...porDecada.keys()].map(Number).sort((a, b) => a - b);
    if (!claves.length) return [];
    const lista: Grupo[] = [];
    for (let d = claves[0]; d <= claves[claves.length - 1]; d += 10) {
      lista.push(porDecada.get(String(d)) ?? { clave: String(d), titulos: 0, palabras: 0, minutos: 0, filas: [] });
    }
    return lista;
  }, [porDecada]);

  const aniosEstreno = filas.map(f => titulos[f[0]].year).filter((y): y is number => y !== null).sort((a, b) => a - b);
  const mediana = aniosEstreno.length ? aniosEstreno[Math.floor((aniosEstreno.length - 1) / 2)] : null;
  const conAnio = filas.map(f => titulos[f[0]]).filter(t => t.year);
  const antiguo = conAnio.reduce<TituloGenero | null>((a, t) => (!a || t.year! < a.year! ? t : a), null);
  const nuevo = conAnio.reduce<TituloGenero | null>((a, t) => (!a || t.year! > a.year! ? t : a), null);

  const elegir = (tipo: NonNullable<Eleccion>['tipo']) => (valor: string) =>
    setEleccion(e => (e?.tipo === tipo && e.valor === valor ? null : { tipo, valor }));
  const grupoElegido = eleccion && (eleccion.tipo === 'genero' ? porGenero : porDecada).get(eleccion.valor);
  const vitrina = (tipo: NonNullable<Eleccion>['tipo']) => eleccion?.tipo === tipo && grupoElegido && (
    <Vitrina titulo={tipo === 'genero' ? eleccion.valor : `Estrenados en los años ${eleccion.valor.slice(2)}`}
      filas={grupoElegido.filas} titulos={titulos} metrica={metrica} onCerrar={() => setEleccion(null)} />
  );

  const BOTON = 'px-4 py-1.5 rounded-full text-sm font-medium transition';

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="generos" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        <header className="text-center mb-10 animate-fade-in">
          <Clapperboard size={40} className="mx-auto text-violet-300 mb-3" aria-hidden />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-linear-to-r from-violet-200 via-fuchsia-200 to-amber-200 bg-clip-text text-transparent brillo-titulo pb-1">
            Géneros y Épocas
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto md:text-lg">
            De qué géneros es lo que se ve en el proyecto y de qué época. Toca un género o una década para ver sus títulos.
          </p>
        </header>

        {/* Año y métrica */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ciclo">
            {anios.map(a => (
              <button key={a} onClick={() => { setAnio(a); setEleccion(null); }} aria-pressed={anio === a}
                className={`${BOTON} ${anio === a ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                {a === 'all' ? 'Histórico Global' : `Ciclo ${a}`}
              </button>
            ))}
          </div>
          <div className="flex rounded-full bg-gray-900 border border-white/10 p-1 self-start" role="group" aria-label="Medir por">
            {(Object.keys(METRICAS) as Metrica[]).map(m => (
              <button key={m} onClick={() => setMetrica(m)} aria-pressed={metrica === m}
                className={`${BOTON} py-1 ${metrica === m ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}>{METRICAS[m]}</button>
            ))}
          </div>
        </div>

        {/* Cifras */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[
            { icono: Clapperboard, etiqueta: 'Géneros', valor: miles(porGenero.size), nota: generosOrden[0] ? `El que más: ${generosOrden[0].clave}` : '', color: 'text-violet-300' },
            { icono: CalendarRange, etiqueta: 'Estreno típico', valor: mediana ? String(mediana) : '—', nota: 'La mitad es de antes y la mitad de después', color: 'text-fuchsia-300' },
            { icono: Hourglass, etiqueta: 'El más antiguo', valor: antiguo ? String(antiguo.year) : '—', nota: antiguo?.title ?? '', color: 'text-amber-300', titulo: antiguo },
            { icono: Sparkles, etiqueta: 'El más nuevo', valor: nuevo ? String(nuevo.year) : '—', nota: nuevo?.title ?? '', color: 'text-teal-300', titulo: nuevo },
          ].map(c => {
            const contenido = (
              <>
                <c.icono size={18} className={`${c.color} mb-2`} aria-hidden />
                <dd className="text-2xl font-extrabold text-white leading-none">{c.valor}</dd>
                <dt className={`text-[11px] uppercase tracking-wider font-semibold mt-1.5 ${c.color}`}>{c.etiqueta}</dt>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{c.nota}</p>
              </>
            );
            return c.titulo
              ? <Link key={c.etiqueta} href={hrefTitulo(c.titulo)} className="rounded-2xl border border-white/10 bg-gray-900/60 hover:border-white/25 p-4 transition">{contenido}</Link>
              : <div key={c.etiqueta} className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">{contenido}</div>;
          })}
        </dl>

        {/* ---------- Géneros ---------- */}
        <section aria-labelledby="generos" className="mb-12 rounded-3xl border border-white/10 bg-gray-900/60 p-4 sm:p-6">
          <h2 id="generos" className="text-2xl font-extrabold flex items-center gap-2 mb-1"><Clapperboard className="text-violet-300" aria-hidden /> Géneros</h2>
          <p className="text-gray-400 text-sm mb-5">
            Los géneros de TMDB. Casi todos los títulos tienen más de uno (una comedia romántica cuenta en Comedia y en Romance).
          </p>
          <div className="grid md:grid-cols-2 gap-x-8">
            {[generosOrden.slice(0, mitad), generosOrden.slice(mitad)].map((parte, i) => (
              <Barras key={i} grupos={parte} metrica={metrica} max={generosOrden[0] ? valor(generosOrden[0], metrica) || 1 : 1}
                elegido={eleccion?.tipo === 'genero' ? eleccion.valor : null} onElegir={elegir('genero')} />
            ))}
          </div>
          {vitrina('genero')}
        </section>

        {/* ---------- Décadas ---------- */}
        <section aria-labelledby="decadas" className="mb-6 rounded-3xl border border-white/10 bg-gray-900/60 p-4 sm:p-6">
          <h2 id="decadas" className="text-2xl font-extrabold flex items-center gap-2 mb-1"><CalendarRange className="text-amber-300" aria-hidden /> Décadas</h2>
          <p className="text-gray-400 text-sm">
            Cuándo se estrenó cada título (las series, cuando salió su primer episodio).
          </p>
          <Decadas grupos={decadasOrden} metrica={metrica} elegido={eleccion?.tipo === 'decada' ? eleccion.valor : null} onElegir={elegir('decada')} />
          {vitrina('decada')}
        </section>
      </div>
    </div>
  );
}
