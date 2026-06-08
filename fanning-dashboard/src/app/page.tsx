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

const MovieCard = ({ title, count, dialogues, onClick }: { title: string, count: number, dialogues?: number, onClick: (posterUrl: string | null) => void }) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    // Ya el título viene limpio desde cleanMovieTitle, pero aseguramos la URL
    let searchTitle = title;
    // Usamos la API de TMDB
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'd1765b8dccaf994068c4055e49e80566';

    let endpoint = 'search/multi';
    let extraParams = '';

    // Correcciones específicas para carátulas equivocadas
    // Correcciones específicas para carátulas equivocadas
    const overrides: Record<string, { q: string, y?: string }> = {
      "taylor swift the eras tour film": { q: "Taylor Swift: The Eras Tour" },
      "aves de presa": { q: "Birds of Prey", y: "2020" },
      "el escuadrón suicida": { q: "The Suicide Squad", y: "2021" },
      "el escuadron suicida": { q: "The Suicide Squad", y: "2021" },
      "escuadrón suicida": { q: "Suicide Squad", y: "2016" },
      "escuadron suicida": { q: "Suicide Squad", y: "2016" },
      "terminal": { q: "Terminal", y: "2018" },
      "amsterdam": { q: "Amsterdam", y: "2022" },
      "ámsterdam": { q: "Amsterdam", y: "2022" },
      "babylon": { q: "Babylon", y: "2022" },
      "five night's at freddy": { q: "Five Nights at Freddy's", y: "2023" },
      "five nights at freddy": { q: "Five Nights at Freddy's", y: "2023" },
      "the legend of tarzan": { q: "The Legend of Tarzan", y: "2016" },
      "intensamente 2": { q: "Inside Out 2", y: "2024" },
      "intensamente 1": { q: "Inside Out", y: "2015" },
      "intensamente": { q: "Inside Out", y: "2015" },
      "harold and the purple crayon": { q: "Harold and the Purple Crayon", y: "2024" },
      "wall-e": { q: "WALL·E", y: "2008" },
      "los increíbles": { q: "The Incredibles", y: "2004" },
      "los increibles": { q: "The Incredibles", y: "2004" },
      "rambo first blood": { q: "First Blood", y: "1982" },
      "venganza implacable": { q: "Honest Thief", y: "2020" },
      "contrarreloj": { q: "Retribution", y: "2023" },
      "emma": { q: "Emma.", y: "2020" },
      "riesgo bajo cero": { q: "The Ice Road", y: "2021" },
      "buscando a nemo": { q: "Finding Nemo", y: "2003" },
      "alvin y las ardillas": { q: "Alvin and the Chipmunks", y: "2007" },
      "el padrino 1": { q: "The Godfather", y: "1972" },
      "el padrino": { q: "The Godfather", y: "1972" },
      "teen spirit": { q: "Teen Spirit", y: "2019" }, // TMDB lo tiene registrado en 2019
      "cuckoo": { q: "Cuckoo", y: "2024" },
      "kim possible (película 2019)": { q: "Kim Possible", y: "2019" },
      "the runaways": { q: "The Runaways", y: "2010" },
      "lilo and stitch i": { q: "Lilo & Stitch", y: "2002" },
      "lilo y stitch i": { q: "Lilo & Stitch", y: "2002" },
      "lilo y stitch 1": { q: "Lilo & Stitch", y: "2002" },
      "lilo y stitch": { q: "Lilo & Stitch", y: "2002" },
      "3 generations": { q: "3 Generations", y: "2016" },
      "about ray": { q: "3 Generations", y: "2016" },
      "the roads not taken": { q: "The Roads Not Taken", y: "2020" },
      "taken iii": { q: "Taken 3", y: "2014" },
      "taken 3": { q: "Taken 3", y: "2014" },
      "taken ii": { q: "Taken 2", y: "2012" },
      "taken 2": { q: "Taken 2", y: "2012" },
      "taken i": { q: "Taken", y: "2008" },
      "taken 1": { q: "Taken", y: "2008" },
      "taken": { q: "Taken", y: "2008" },
      "vicious": { q: "Vicious", y: "2025" }
    };

    const lowerTitle = title.toLowerCase().trim();
    // Ordenamos las llaves por longitud descendente para evitar que "escuadron suicida" pise a "el escuadron suicida"
    const sortedKeys = Object.keys(overrides).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      if (lowerTitle.includes(key)) {
        searchTitle = overrides[key].q;
        if (overrides[key].y) {
          endpoint = 'search/movie';
          extraParams = `&primary_release_year=${overrides[key].y}`;
        }
        break;
      }
    }

    fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(searchTitle)}&language=en-US${extraParams}`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          // Busca el primer resultado válido con un póster
          const result = data.results.find((r: any) => r.poster_path);
          if (result && result.poster_path) {
            setPosterUrl(`https://image.tmdb.org/t/p/w500${result.poster_path}`);
          }
        }
      })
      .catch(console.error);
  }, [title]);

  return (
    <div onClick={() => onClick(posterUrl)} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:border-purple-500 hover:scale-105 transition-all duration-300 cursor-pointer">
      {posterUrl ? (
        <img src={posterUrl} alt={title} className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="aspect-[2/3] bg-gray-800 flex flex-col items-center justify-center p-4 text-center">
          <Film size={32} className="text-gray-600 mb-2" />
          <span className="absolute text-gray-500 text-xs opacity-50 uppercase font-bold tracking-widest rotate-[-45deg]">POSTER</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300"></div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md mb-1">{title}</h4>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [manifestData, setManifestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMovie, setSelectedMovie] = useState<{title: string, count: number, dialogues?: number, posterUrl: string | null, episodes: {name: string, count: number}[]} | null>(null);

  const [stats, setStats] = useState({
    totalWords: 0,
    uniqueMovies: 0,
    topWord: { word: "N/A", count: 0, translation: "" },
    yearlyData: [] as { year: string, words: number }[],
    topList: [] as { word: string, count: number, translation: string }[],
    movieList: [] as { title: string, count: number, dialogues?: number, episodes: {name: string, count: number}[] }[]
  });

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(res => res.json())
      .then(json => {
        setManifestData(json);
        setLoading(false);
      })
      .catch(err => console.error("Error cargando manifest:", err));
  }, []);

  useEffect(() => {
    if (manifestData) {
      const yearData = manifestData[selectedYear] || manifestData["all"];
      setStats({
        totalWords: yearData.totalWords || 0,
        uniqueMovies: yearData.uniqueMovies || 0,
        topWord: yearData.topWord || { word: "N/A", count: 0, translation: "" },
        yearlyData: manifestData.yearlyData || [],
        topList: yearData.topList || [],
        movieList: yearData.movieList || []
      });
    }
  }, [manifestData, selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xl">Procesando 21,000 vocabularios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Fanning Analytics
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Métricas de inmersión y adquisición de vocabulario</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/reglas')} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium border border-purple-500/30">
            <BookOpen size={16} /> Reglas del Proyecto
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
            <Search size={16} /> Buscar
          </button>
        </div>
      </header>

      {/* Selector de Años */}
      <div className="mb-10 flex border-b border-gray-800 pb-4 gap-4">
        {["all", "2023", "2024", "2025"].map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Realeza Top</h3>
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><Crown size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-600">N/A</p>
          <p className="text-sm text-gray-500 mt-2">Próxima función...</p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* Chart Section */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
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
                />
                <Bar dataKey="words" fill="url(#colorWords)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8} />
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
          {stats.movieList.map((movie, idx) => (
            <MovieCard 
              key={idx} 
              title={movie.title} 
              count={movie.count} 
              dialogues={movie.dialogues}
              onClick={(posterUrl) => {
                const specialSeries = ['kim possible', 'the big bang theory', 'euphoria', 'gambito de dama'];
                if (specialSeries.includes(movie.title.toLowerCase())) {
                  router.push(`/series/${encodeURIComponent(movie.title)}`);
                } else {
                  setSelectedMovie({ ...movie, posterUrl });
                }
              }} 
            />
          ))}
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
              <div className="absolute bottom-4 left-6 flex items-end gap-6">
                {selectedMovie.posterUrl ? (
                  <img src={selectedMovie.posterUrl} alt="Poster" className="w-24 h-36 rounded-lg shadow-xl object-cover border border-gray-700" />
                ) : (
                  <div className="w-24 h-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex items-center justify-center">
                    <Film className="text-gray-600" size={32} />
                  </div>
                )}
                <div className="pb-2">
                  <h2 className="text-3xl font-extrabold text-white">{selectedMovie.title}</h2>
                  <div className="flex flex-wrap gap-4 mt-2">
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
