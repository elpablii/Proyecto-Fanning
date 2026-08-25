"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Film, BookOpen, Crown, TrendingUp, Search, Loader2, Calendar } from 'lucide-react';

interface VocabItem {
  id: string;
  word: string;
  translation: string;
  source_movie: string;
  year_processed: string;
  global_frequency: number;
}

import { tmdbOverrides } from '@/lib/tmdb';
import Link from 'next/link';
import MovieCard from '@/components/ui/MovieCard';


export default function DashboardClient({ initialManifestData }: { initialManifestData: any }) {
  const router = useRouter();
  const [manifestData, setManifestData] = useState<any>(initialManifestData);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMovie, setSelectedMovie] = useState<{ title: string, count: number, dialogues?: number, posterUrl: string | null, episodes: { name: string, count: number }[] } | null>(null);

  const [stats, setStats] = useState({
    totalWords: 0,
    uniqueMovies: 0,
    topWord: { word: "N/A", count: 0, translation: "" },
    yearlyData: [] as { year: string, words: number, dialogues?: number }[],
    topList: [] as { word: string, count: number, translation: string }[],
    movieList: [] as { title: string, count: number, type?: 'series' | 'movie', dialogues?: number, episodes: { name: string, count: number }[], posterUrl?: string | null, backdropUrl?: string | null, level?: string }[],
    totalDialogues: 0
  });

  useEffect(() => {
    if (manifestData) {
      const yearData = manifestData[selectedYear] || manifestData["all"];

      let totalDialogues = 0;
      if (selectedYear === 'all') {
        totalDialogues = (manifestData.yearlyData || []).reduce((acc: number, y: any) => acc + (y.dialogues || 0), 0);
      } else {
        const found = (manifestData.yearlyData || []).find((y: any) => y.year === selectedYear);
        totalDialogues = found ? (found.dialogues || 0) : 0;
      }

      setStats({
        totalWords: yearData.totalWords || 0,
        uniqueMovies: yearData.uniqueMovies || 0,
        topWord: yearData.topWord || { word: "N/A", count: 0, translation: "" },
        yearlyData: manifestData.yearlyData || [],
        topList: yearData.topList || [],
        movieList: yearData.movieList || [],
        totalDialogues: totalDialogues
      });
    }

    // Recuperar el ciclo desde la URL al cargar
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const y = params.get('year');
      if (y) setSelectedYear(y);
    }
  }, [manifestData, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 md:pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Dashboard del Proyecto Fanning
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg">Métricas de inmersión y adquisición de vocabulario</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={() => router.push('/reglas')} className="flex-1 sm:flex-none justify-center bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium border border-purple-500/30">
            <BookOpen size={16} /> Reglas del Proyecto
          </button>
          <button className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
            <Search size={16} /> Buscar
          </button>
        </div>
      </header>

      <div className="mb-10 flex flex-wrap border-b border-gray-800 pb-4 gap-4">
        {["all", "2023", "2024", "2025", "2026", "2027"].map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              window.history.pushState(null, '', `/?year=${year}`);
            }}
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
          <p className="text-3xl font-bold">{stats.totalWords.toLocaleString()}</p>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1">Palabras en {selectedYear === 'all' ? 'total' : selectedYear}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Líneas de Diálogo</h3>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Film size={20} /></div>
          </div>
          <p className="text-3xl font-bold">{stats.totalDialogues.toLocaleString()}</p>
          <p className="text-sm text-emerald-500 mt-2">Líneas totales en {selectedYear === 'all' ? 'histórico' : selectedYear}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Películas / Series</h3>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Film size={20} /></div>
          </div>
          <p className="text-3xl font-bold">{stats.uniqueMovies}</p>
          <p className="text-sm text-gray-500 mt-2">Obras únicas visualizadas</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Más Frecuente</h3>
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-bold capitalize truncate">{stats.topWord.word}</p>
          <p className="text-sm text-gray-500 mt-2">{stats.topWord.count} apariciones</p>
        </div>

        {selectedYear !== 'all' && (
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-gray-400 font-medium">Comprensión Global</h3>
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Crown size={20} /></div>
            </div>
            <p className="text-3xl font-bold">
              {stats.totalDialogues > 0
                ? `${(() => {
                  let pct = ((stats.totalDialogues - stats.totalWords) / stats.totalDialogues) * 100;
                  if (pct >= 99.445) pct = 100;
                  return Math.max(0, pct).toFixed(2);
                })()}%`
                : 'N/A'}
            </p>
            <p className="text-sm text-cyan-500 mt-2">Porcentaje en {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* Chart Section */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-purple-500" size={24} /> Evolución del Vocabulario
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="year" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                />
                <Bar name="Líneas de Diálogo" dataKey="dialogues" fill="url(#colorDialogues)" radius={[6, 6, 0, 0]} />
                <Bar name="Palabras Aprendidas" dataKey="words" fill="url(#colorWords)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorDialogues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                  <tr key={index} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 font-medium flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
                      <div className="flex flex-col">
                        <span className="text-gray-100 truncate w-32">{item.word}</span>
                        <span className="text-gray-500 text-xs italic line-clamp-1">{item.translation}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-purple-400 font-bold">{item.count}</td>
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
          {stats.movieList.map((item, idx) => {
            return (
                <MovieCard 
                  key={item.title} 
                  title={item.title} 
                  count={item.count} 
                  dialogues={item.dialogues}
                  posterUrl={item.posterUrl}
                  level={item.level}
                  href={item.type === 'series' ? `/series/${encodeURIComponent(item.title)}` : `/peliculas/${encodeURIComponent(item.title)}`} 
                />);
          })}
        </div>
      </div>

      {/* Modal Interactivo de Episodios */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMovie(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header con poster */}
            <div className="relative h-48 bg-gray-800 flex-shrink-0">
              {selectedMovie.posterUrl && (
                <img src={selectedMovie.posterUrl} alt="Backdrop" className="w-full h-full object-cover opacity-30 blur-md" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 sm:left-6 flex items-end gap-4 sm:gap-6 w-[calc(100%-2rem)]">
                {selectedMovie.posterUrl ? (
                  <img src={selectedMovie.posterUrl} alt="Poster" className="w-20 h-32 sm:w-24 sm:h-36 rounded-lg shadow-xl object-cover border border-gray-700 flex-shrink-0" />
                ) : (
                  <div className="w-20 h-32 sm:w-24 sm:h-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex items-center justify-center flex-shrink-0">
                    <Film className="text-gray-600" size={32} />
                  </div>
                )}
                <div className="pb-1 sm:pb-2 overflow-hidden">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">{selectedMovie.title}</h2>
                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                    <p className="text-purple-400 font-medium">{selectedMovie.count} palabras no entendidas</p>
                    {selectedMovie.dialogues !== undefined && selectedMovie.dialogues > 0 && (
                      <>
                        <p className="text-emerald-400 font-medium">| {selectedMovie.dialogues} líneas totales</p>
                        <p className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {(() => {
                            const d = selectedMovie.dialogues;
                            const w = selectedMovie.count;
                            let pct = ((d - w) / d) * 100;
                            if (pct >= 99.445) pct = 100;
                            return Math.max(0, pct).toFixed(2);
                          })()}% Comprensión
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedMovie(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white rounded-full p-2 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Lista de episodios */}
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-300 mb-4">Desglose por Archivo / Episodio</h3>
              {selectedMovie.episodes.length === 1 ? (
                <div className="text-center py-10 text-gray-500">
                  <Film size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Obra única. No hay episodios adicionales divididos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMovie.episodes.map((ep: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-gray-800/40 p-4 rounded-xl border border-gray-800/80 hover:border-purple-900/50 hover:bg-gray-800 transition">
                      <span className="text-gray-200 font-medium truncate pr-4" title={ep.name}>
                        {ep.name}
                      </span>
                      <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full text-sm font-bold flex-shrink-0">
                        {ep.count} palabras
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
