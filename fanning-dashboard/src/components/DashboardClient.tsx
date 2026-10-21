"use client";

import React, { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Film, BookOpen, Sparkles, TrendingUp, MessageSquare, Crown, Shapes, X } from 'lucide-react';

import { miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';
import MovieCard, { type ArtistaEnCarta } from '@/components/ui/MovieCard';
import SearchModal from '@/components/ui/SearchModal';
import EvolucionComprension, { type TandaResumen } from '@/components/charts/EvolucionComprension';
import ReinaDelDia, { type CandidatoDelDia } from '@/components/realeza/ReinaDelDia';
import HeroPortada from '@/components/portada/HeroPortada';
import TarjetaMetrica, { TONOS, type PuntoSerie } from '@/components/portada/TarjetaMetrica';
import { PortadaAnio, PortadaData } from '@/types/manifest';
import { agrupar, hrefArtista, ordenGrupo } from '@/lib/realeza';
import { transicionPoster } from '@/lib/transiciones';
import FondoAnimado from '@/components/ui/FondoAnimado';

const VACIO: PortadaAnio = {
  totalWords: 0, totalDialogues: 0, uniqueMovies: 0,
  topWord: { word: 'N/A', count: 0, translation: '' }, topList: [], movieList: [],
};

function aniosDisponibles(portada: PortadaData): string[] {
  return ['all', ...Object.keys(portada).filter(k => k !== 'all').sort()];
}

// La Realeza por nombre, para las insignias de los pósters.
export type ArtistasPorNombre = Record<string, ArtistaEnCarta>;

// En el filtro del catálogo: los títulos sin nadie de la Realeza.
const MISCELANEA = '__miscelanea__';

// El año elegido va en la URL (?year=2025), así se puede compartir o recargar. Se lee directo de
// la barra de direcciones y no con useSearchParams: ese obligaba a envolver la portada en <Suspense>
// y el navegador tiraba el HTML del build para volver a dibujar la página entera (las 177 tarjetas).
// Así el HTML se hidrata tal cual (histórico) y solo cambia si la URL pide otro año.
const CAMBIO_ANIO = 'fanning:anio';
function suscribirAnio(avisar: () => void) {
  window.addEventListener('popstate', avisar);
  window.addEventListener(CAMBIO_ANIO, avisar);
  return () => {
    window.removeEventListener('popstate', avisar);
    window.removeEventListener(CAMBIO_ANIO, avisar);
  };
}
const anioEnUrl = () => new URLSearchParams(window.location.search).get('year') ?? 'all';
const anioDelBuild = () => 'all';

interface PropsPortada {
  portada: PortadaData;
  tandas: TandaResumen[];
  artistas: ArtistasPorNombre;
  delDia: CandidatoDelDia[];
  hoy: string;               // fecha del build; en el navegador se usa la de ese día
}

export default function DashboardClient({ portada, tandas, artistas, delDia, hoy }: PropsPortada) {
  const pedido = useSyncExternalStore(suscribirAnio, anioEnUrl, anioDelBuild);
  const [showSearch, setShowSearch] = useState(false);
  const [artista, setArtista] = useState<string | null>(null);
  const availableYears = useMemo(() => aniosDisponibles(portada), [portada]);
  const selectedYear = availableYears.includes(pedido) ? pedido : 'all';

  const stats = portada[selectedYear] ?? VACIO;
  const pctAnual = comprension(stats.totalDialogues, stats.totalWords);
  const elegido = selectedYear === 'all' ? null : selectedYear;

  // Cada cifra en cada ciclo, para los mini gráficos de las tarjetas (las mismas del manifest).
  const series = useMemo(() => {
    const ciclos = availableYears.filter(a => a !== 'all');
    const de = (f: (d: PortadaAnio) => number | null, texto: (n: number | null) => string): PuntoSerie[] =>
      ciclos.map(c => {
        const valor = f(portada[c]);
        return { etiqueta: c, valor, texto: texto(valor) };
      });
    return {
      palabras: de(d => d.totalWords, n => `${miles(n)} palabras`),
      lineas: de(d => d.totalDialogues, n => `${miles(n)} líneas`),
      titulos: de(d => d.uniqueMovies, n => `${miles(n)} títulos`),
      comprension: de(d => comprension(d.totalDialogues, d.totalWords), n => porcentaje(n)),
    };
  }, [availableYears, portada]);

  // Filtro del catálogo: por artista, en sus grupos como en el Salón del Trono (Reyes Supremos,
  // Amores Platónicos, Reinas, Reyes) y con más títulos primero; al final la Miscelánea, lo que no
  // tiene a nadie de la Realeza. Si lo elegido no está en este ciclo, el filtro queda sin efecto.
  const { gruposFiltro, miscelanea } = useMemo(() => {
    const cuenta = new Map<string, number>();
    let sinRealeza = 0;
    for (const m of stats.movieList) {
      const nombres = Object.keys(m.realeza ?? {}).filter(n => artistas[n]);
      if (!nombres.length) sinRealeza++;
      for (const n of nombres) cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
    }
    return {
      gruposFiltro: agrupar([...cuenta.keys()].map(n => artistas[n])).filter(g => g.miembros.length).map(g => ({
        nombre: g.nombre,
        miembros: g.miembros.map(a => [a.nombre, cuenta.get(a.nombre) ?? 0] as const)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      })),
      miscelanea: sinRealeza,
    };
  }, [stats.movieList, artistas]);
  const filtro = artista === MISCELANEA
    ? (miscelanea ? MISCELANEA : null)
    : gruposFiltro.some(g => g.miembros.some(([n]) => n === artista)) ? artista : null;
  const esMiscelanea = filtro === MISCELANEA;
  // El selector responde al tiro y la grilla de pósters se rehace después, sin trabar el clic.
  // Memorizada para que abrir el buscador u otros cambios no vuelvan a dibujar todos los pósters.
  const filtroCatalogo = useDeferredValue(filtro);
  const catalogo = useMemo(() => {
    const lista = filtroCatalogo === MISCELANEA
      ? stats.movieList.filter(m => !Object.keys(m.realeza ?? {}).some(n => artistas[n]))
      : filtroCatalogo ? stats.movieList.filter(m => m.realeza?.[filtroCatalogo]) : stats.movieList;
    return lista.map((item) => (
      <MovieCard
        key={item.title}
        title={item.title}
        count={item.count}
        dialogues={item.dialogues}
        posterUrl={item.posterUrl}
        level={item.level}
        rating={item.rating}
        transicion={transicionPoster(item.type, item.title)}
        color={item.color}
        realeza={Object.keys(item.realeza ?? {}).map(n => artistas[n]).filter(Boolean).sort((a, b) => ordenGrupo(a) - ordenGrupo(b))}
        href={item.type === 'series' ? `/series/${encodeURIComponent(item.title)}` : `/peliculas/${encodeURIComponent(item.title)}`}
      />
    ));
  }, [filtroCatalogo, stats.movieList, artistas]);

  // Pósters para el mosaico del encabezado.
  const posters = useMemo(
    () => (portada.all?.movieList ?? []).map(m => m.posterUrl).filter((u): u is string => !!u).slice(0, 42),
    [portada],
  );

  // replaceState se integra con el router de Next y no vuelve a pedir la página.
  const elegirAnio = (year: string) => {
    window.history.replaceState(null, '', year === 'all' ? '/' : `/?year=${year}`);
    window.dispatchEvent(new Event(CAMBIO_ANIO));
  };

  // Ctrl+K (o Cmd+K) y "/" abren el buscador
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      const escribiendo = e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !escribiendo)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  return (
    <div className="min-h-screen text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      <FondoAnimado paleta="inicio" />
      <HeroPortada posters={posters} onBuscar={() => setShowSearch(true)} />

      {showSearch && (
        <SearchModal items={portada.all?.movieList ?? []} artistas={Object.values(artistas)} onClose={() => setShowSearch(false)} />
      )}

      <ReinaDelDia candidatos={delDia} hoy={hoy} />

      <div className="mb-10 flex flex-wrap border-b border-gray-800 pb-4 gap-4">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => elegirAnio(year)}
            className={`px-5 py-2 rounded-full font-medium transition ${selectedYear === year
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
              : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
          >
            {year === "all" ? "Histórico Global" : `Ciclo ${year}`}
          </button>
        ))}
      </div>

      {/* Tarjetas de métricas: el número sube al cargar y abajo va cada ciclo */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedYear === 'all' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-6 mb-10`}>
        <TarjetaMetrica titulo="Total Extraído" icono={BookOpen} tono="azul" valor={stats.totalWords} formato={miles}
          nota={`Palabras en ${selectedYear === 'all' ? 'total' : selectedYear}`} serie={series.palabras} elegido={elegido} />
        <TarjetaMetrica titulo="Líneas de Diálogo" icono={MessageSquare} tono="verde" valor={stats.totalDialogues} formato={miles}
          nota={`Líneas totales en ${selectedYear === 'all' ? 'histórico' : selectedYear}`} serie={series.lineas} elegido={elegido} />
        <TarjetaMetrica titulo="Películas / Series" icono={Film} tono="morado" valor={stats.uniqueMovies} formato={miles}
          nota="Obras únicas visualizadas" serie={series.titulos} elegido={elegido} />

        <div className={`borde-giratorio bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${TONOS.rosa.hover}`}
          style={{ '--tono-borde': TONOS.rosa.trazo } as React.CSSProperties}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Más Frecuente</h3>
            <div className={`p-2 rounded-lg ${TONOS.rosa.icono}`}><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-bold capitalize truncate">{stats.topWord.word}</p>
          {stats.topWord.translation && <p className="text-sm text-gray-400 italic truncate">{stats.topWord.translation}</p>}
          <p className={`text-sm mt-2 ${TONOS.rosa.nota}`}>{miles(stats.topWord.count)} apariciones</p>
          {stats.topList.length > 1 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {stats.topList.slice(1, 5).map(w => (
                <li key={w.word} title={`${w.translation} · ${miles(w.count)}`}
                  className="text-xs rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-200 px-2 py-0.5">{w.word}</li>
              ))}
            </ul>
          )}
        </div>

        {selectedYear !== 'all' && (
          <TarjetaMetrica titulo="Comprensión Global" icono={Sparkles} tono="cian" valor={pctAnual} formato={n => porcentaje(n)}
            nota={`Porcentaje en ${selectedYear}`} serie={series.comprension} elegido={elegido} forma="linea" />
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* Evolución de la comprensión */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500" size={24} /> ¿Entiendes cada vez más?
          </h3>
          <EvolucionComprension tandas={tandas} anio={selectedYear} />
        </div>

        {/* Top Words Table */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">🏆 Top 10 {selectedYear !== 'all' && `(${selectedYear})`}</h3>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="pb-3 font-medium">Palabra</th>
                  <th className="pb-3 font-medium text-right">Rep.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.topList.map((item, index) => (
                  <tr key={item.word} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 font-medium flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
                      <div className="flex flex-col">
                        <span className="text-gray-100 truncate w-32">{item.word}</span>
                        <span className="text-gray-500 text-xs italic line-clamp-1">{item.translation}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-purple-400 font-bold">{miles(item.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Catálogo Visual */}
      <div className="mt-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="text-pink-500" size={28} /> Catálogo de Visualización {selectedYear !== 'all' ? `(${selectedYear})` : ''}
          </h2>
          {(gruposFiltro.length > 0 || miscelanea > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className={`flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-sm font-medium border transition ${esMiscelanea
                ? 'bg-violet-400 text-gray-950 border-violet-300'
                : filtro
                  ? 'bg-amber-400 text-gray-950 border-amber-300'
                  : 'bg-amber-500/10 text-amber-300 border-amber-400/30'}`}>
                {esMiscelanea ? <Shapes size={14} aria-hidden /> : <Crown size={14} aria-hidden />}
                <span className="sr-only">Ver solo los títulos de un miembro de la Realeza, o los que no tienen a nadie</span>
                <select value={filtro ?? ''} onChange={e => setArtista(e.target.value || null)}
                  className="bg-transparent outline-none cursor-pointer pr-2 max-w-60">
                  <option value="" className="bg-gray-900 text-gray-100">Con alguien de la Realeza…</option>
                  {gruposFiltro.map(g => (
                    <optgroup key={g.nombre} label={g.nombre} className="bg-gray-900 text-gray-400">
                      {g.miembros.map(([n, c]) => (
                        <option key={n} value={n} className="bg-gray-900 text-gray-100">{n} ({c})</option>
                      ))}
                    </optgroup>
                  ))}
                  {miscelanea > 0 && (
                    <optgroup label="El resto" className="bg-gray-900 text-gray-400">
                      <option value={MISCELANEA} className="bg-gray-900 text-gray-100">Miscelánea ({miscelanea})</option>
                    </optgroup>
                  )}
                </select>
              </label>
              {filtro && (
                <>
                  {!esMiscelanea && <Link href={hrefArtista(filtro)} className="text-sm text-amber-300 hover:underline">Ver su página</Link>}
                  <button onClick={() => setArtista(null)} className="text-gray-400 hover:text-white p-1" aria-label="Quitar el filtro">
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {catalogo}
        </div>
      </div>
    </div>
  );
}
