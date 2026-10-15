"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, BookOpen, Crown, TrendingUp, Search, Calendar } from 'lucide-react';

import { miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';
import MovieCard from '@/components/ui/MovieCard';
import SearchModal from '@/components/ui/SearchModal';
import EvolucionComprension, { type TandaResumen } from '@/components/charts/EvolucionComprension';
import { PortadaAnio, PortadaData } from '@/types/manifest';

const VACIO: PortadaAnio = {
  totalWords: 0, totalDialogues: 0, uniqueMovies: 0,
  topWord: { word: 'N/A', count: 0, translation: '' }, topList: [], movieList: [],
};

function aniosDisponibles(portada: PortadaData): string[] {
  return ['all', ...Object.keys(portada).filter(k => k !== 'all').sort()];
}

// Lee el año elegido de la URL (?year=2025), así se puede compartir o recargar.
// Necesita estar dentro de <Suspense> (ver app/page.tsx).
export default function DashboardClient({ portada, tandas }: { portada: PortadaData; tandas: TandaResumen[] }) {
  const pedido = useSearchParams().get('year') ?? 'all';
  const anio = aniosDisponibles(portada).includes(pedido) ? pedido : 'all';
  return <DashboardVista portada={portada} tandas={tandas} selectedYear={anio} />;
}

// La portada para un año dado. También es lo que se genera en el build (con el histórico).
export function DashboardVista({ portada, tandas, selectedYear }: { portada: PortadaData; tandas: TandaResumen[]; selectedYear: string }) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const availableYears = useMemo(() => aniosDisponibles(portada), [portada]);

  const stats = portada[selectedYear] ?? VACIO;
  const pctAnual = comprension(stats.totalDialogues, stats.totalWords);

  const elegirAnio = (year: string) => {
    router.replace(year === 'all' ? '/' : `/?year=${year}`, { scroll: false });
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
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 md:pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Dashboard del Proyecto Fanning
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg">Métricas de inmersión y adquisición de vocabulario</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={() => router.push('/timeline')} className="flex-1 sm:flex-none justify-center bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium border border-blue-500/30">
            <Calendar size={16} /> Línea de Tiempo
          </button>
          <button onClick={() => router.push('/reglas')} className="flex-1 sm:flex-none justify-center bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium border border-purple-500/30">
            <BookOpen size={16} /> Constitución del Proyecto Fanning
          </button>
          <button onClick={() => setShowSearch(true)} title="Buscar (Ctrl + K)" className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
            <Search size={16} /> Buscar
          </button>
        </div>
      </header>

      {showSearch && (
        <SearchModal items={portada.all?.movieList ?? []} onClose={() => setShowSearch(false)} />
      )}

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

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedYear === 'all' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-6 mb-10`}>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Total Extraído</h3>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><BookOpen size={20} /></div>
          </div>
          <p className="text-3xl font-bold">{miles(stats.totalWords)}</p>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1">Palabras en {selectedYear === 'all' ? 'total' : selectedYear}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Líneas de Diálogo</h3>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Film size={20} /></div>
          </div>
          <p className="text-3xl font-bold">{miles(stats.totalDialogues)}</p>
          <p className="text-sm text-emerald-500 mt-2">Líneas totales en {selectedYear === 'all' ? 'histórico' : selectedYear}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Películas / Series</h3>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Film size={20} /></div>
          </div>
          <p className="text-3xl font-bold">{miles(stats.uniqueMovies)}</p>
          <p className="text-sm text-gray-500 mt-2">Obras únicas visualizadas</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Más Frecuente</h3>
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-bold capitalize truncate">{stats.topWord.word}</p>
          <p className="text-sm text-gray-500 mt-2">{miles(stats.topWord.count)} apariciones</p>
        </div>

        {selectedYear !== 'all' && (
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-gray-400 font-medium">Comprensión Global</h3>
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Crown size={20} /></div>
            </div>
            <p className="text-3xl font-bold">{porcentaje(pctAnual)}</p>
            <p className="text-sm text-cyan-500 mt-2">Porcentaje en {selectedYear}</p>
          </div>
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
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 border-b border-gray-800 pb-4">
          <Film className="text-pink-500" size={28} /> Catálogo de Visualización {selectedYear !== 'all' ? `(${selectedYear})` : ''}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {stats.movieList.map((item) => (
            <MovieCard
              key={item.title}
              title={item.title}
              count={item.count}
              dialogues={item.dialogues}
              posterUrl={item.posterUrl}
              level={item.level}
              rating={item.rating}
              href={item.type === 'series' ? `/series/${encodeURIComponent(item.title)}` : `/peliculas/${encodeURIComponent(item.title)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
