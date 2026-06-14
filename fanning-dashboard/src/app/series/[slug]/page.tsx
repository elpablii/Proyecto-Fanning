"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Film, PlayCircle, BookOpen } from 'lucide-react';

export default function SeriesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const decodedTitle = decodeURIComponent(slug);

  const [movieData, setMovieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState({ backdrop: '', poster: '' });

  // 1. Cargar manifest.json
  useEffect(() => {
    fetch('/data/manifest.json')
      .then(res => res.json())
      .then(json => {
        const allMovies = json["all"].movieList;
        const found = allMovies.find((m: any) => m.title === decodedTitle);
        if (found) {
          setMovieData(found);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading manifest:", err);
        setLoading(false);
      });
  }, [decodedTitle]);

  // 2. Cargar imágenes de TMDB
  useEffect(() => {
    if (!decodedTitle) return;
    
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'd1765b8dccaf994068c4055e49e80566';
    
    // Hardcoded overrides just in case
    let searchTitle = decodedTitle;
    if (decodedTitle.toLowerCase() === 'gambito de dama') {
      searchTitle = "The Queen's Gambit";
    }

    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchTitle)}&language=es-MX`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const result = data.results.find((r: any) => r.backdrop_path && r.poster_path) || data.results[0];
          
          if (result) {
            setImages({
              backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : '',
              poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : ''
            });
          }
        }
      })
      .catch(console.error);
  }, [decodedTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xl">Cargando base de datos...</p>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white">
        <h1 className="text-4xl font-bold mb-4">Serie no encontrada</h1>
        <button onClick={() => router.push('/')} className="bg-purple-600 px-6 py-2 rounded-full hover:bg-purple-700 transition">
          Volver al Inicio
        </button>
      </div>
    );
  }

  const totalDialogues = movieData.dialogues || 0;
  
  const seasonDialogues: Record<string, number> = {};
  if (movieData.episodes) {
    movieData.episodes.forEach((ep: any) => {
      const match = ep.name.match(/^S(\d+)EP/i);
      let seasonKey = "Especiales";
      if (match) {
        seasonKey = `Temporada ${parseInt(match[1], 10)}`;
      }
      if (ep.dialogues) {
        seasonDialogues[seasonKey] = (seasonDialogues[seasonKey] || 0) + ep.dialogues;
      }
    });
  }
  const multiSeason = Object.keys(seasonDialogues).filter(k => k !== "Especiales").length > 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden font-sans">
      
      {/* Background Dinámico (Glassmorphism Base) */}
      <div className="fixed inset-0 z-0">
        {images.backdrop ? (
          <img src={images.backdrop} alt="Backdrop" className="w-full h-full object-cover opacity-40 scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black"></div>
        )}
        {/* Overlay oscuro y blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-gray-950"></div>
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        
        {/* Header / Navegación */}
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-all mb-8"
        >
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 items-end mb-16">
          {images.poster ? (
            <img src={images.poster} alt={decodedTitle} className="w-48 md:w-64 rounded-2xl shadow-2xl border border-white/20 transform hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-48 md:w-64 aspect-[2/3] bg-white/10 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Film size={48} className="text-white/50" />
            </div>
          )}
          
          <div className="flex-1 pb-4">
            <h1 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              {decodedTitle}
            </h1>
            <div className="flex flex-wrap gap-4 items-center text-lg">
              <span className="flex items-center gap-2 bg-purple-600/30 border border-purple-400/30 text-purple-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                <BookOpen size={20} /> {movieData.count.toLocaleString()} Palabras Globales
              </span>
              <span className="flex items-center gap-2 bg-pink-600/30 border border-pink-400/30 text-pink-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                <PlayCircle size={20} /> {movieData.episodes.length} Episodios Analizados
              </span>
              {totalDialogues > 0 && (
                <span className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                  <Film size={20} /> {totalDialogues.toLocaleString()} Líneas Totales de la Serie
                </span>
              )}
            </div>
            
            {multiSeason && totalDialogues > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(seasonDialogues).map(([s, val], i) => (
                  <span key={i} className="text-sm bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full border border-gray-600/50 backdrop-blur-md">
                    {s}: {val.toLocaleString()} líneas
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Episodios con Glassmorphism */}
        <div>
          <h2 className="text-3xl font-bold mb-8 border-b border-white/10 pb-4 inline-block drop-shadow-md">
            Desglose de Episodios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movieData.episodes.map((ep: any, idx: number) => (
              <div 
                key={idx} 
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-100 group-hover:text-purple-300 transition-colors pr-4 line-clamp-2" title={ep.name}>
                      {ep.name}
                    </h3>
                    <div className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Ep #{idx + 1}
                    </div>
                  </div>
                  
                  <div className="flex flex-col mt-auto gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">No entendidas:</span>
                      <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        {ep.count} <span className="text-sm font-medium text-gray-500">palabras</span>
                      </span>
                    </div>
                    {ep.dialogues !== undefined && ep.dialogues > 0 && (
                      <>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                          <span className="text-gray-400 text-sm">Líneas de diálogo:</span>
                          <span className="text-emerald-400 font-bold">{ep.dialogues}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-400 text-sm">Comprensión:</span>
                          <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-sm">
                            {(() => {
                              const d = ep.dialogues;
                              const w = ep.count;
                              let pct = ((d - w) / d) * 100;
                              if (pct >= 99.445) pct = 100;
                              return Math.max(0, pct).toFixed(2);
                            })()}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
