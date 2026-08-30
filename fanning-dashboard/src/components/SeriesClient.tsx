"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Film, PlayCircle, BookOpen, Quote } from 'lucide-react';
import FlashcardViewer from '@/components/ui/FlashcardViewer';

export default function SeriesClient({ slug, initialMovieData, initialExtraData }: { slug: string, initialMovieData: any, initialExtraData: any }) {
  const router = useRouter();
  const decodedTitle = decodeURIComponent(slug);

  const [movieData] = useState<any>(initialMovieData);
  const [extraData] = useState<any>(initialExtraData);
  
  // Flashcards State
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'carousel' | 'practice'>('carousel');
  const [expandedEp, setExpandedEp] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const posterUrl = movieData?.posterUrl || null;
  const backdropUrl = movieData?.backdropUrl || null;
  const overview = extraData?.tmdb?.overview || 'Sinopsis no disponible.';
  const episodes = extraData?.tmdb?.episodes || {};

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

  let totalDialogues = movieData.dialogues || 0;
  if (totalDialogues === 0 && extraData?.episodes) {
    totalDialogues = extraData.episodes.reduce((sum: number, ep: any) => sum + (ep.dialogues || 0), 0);
  }
  
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
        {backdropUrl ? (
          <img src={backdropUrl} alt="Backdrop" className="w-full h-full object-cover opacity-40 scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black"></div>
        )}
        {/* Overlay oscuro y blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-gray-950"></div>
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        
        {/* Header / Navegación */}
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-all mb-6 md:mb-8 text-sm sm:text-base w-fit"
        >
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-16">
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt={decodedTitle} 
              onClick={() => setSelectedImage(posterUrl.replace('w500', 'original'))}
              className="w-48 md:w-64 lg:w-72 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transform hover:scale-105 transition-transform duration-500 cursor-pointer" 
            />
          ) : (
            <div className="w-40 sm:w-48 md:w-64 aspect-[2/3] bg-white/10 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Film size={48} className="text-white/50" />
            </div>
          )}
          
          <div className="flex-1 pb-4 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              {decodedTitle}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 items-center text-sm sm:text-base md:text-lg">
              <span className="flex items-center gap-2 bg-purple-600/30 border border-purple-400/30 text-purple-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                <BookOpen size={16} className="sm:w-5 sm:h-5" /> {movieData.count.toLocaleString()} Palabras Globales
              </span>
              <span className="flex items-center gap-2 bg-pink-600/30 border border-pink-400/30 text-pink-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                <PlayCircle size={16} className="sm:w-5 sm:h-5" /> {movieData.episodes.length} Episodios Analizados
              </span>
              {totalDialogues > 0 && (
                <span className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
                  <Film size={20} /> {totalDialogues.toLocaleString()} Líneas Totales de la Serie
                </span>
              )}
            </div>
            
            {multiSeason && totalDialogues > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                {Object.entries(seasonDialogues).map(([s, val], i) => (
                  <span key={i} className="text-xs sm:text-sm bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full border border-gray-600/50 backdrop-blur-md">
                    {s}: {val.toLocaleString()} líneas
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sinopsis de TMDB */}
        {overview && (
            <section className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Film className="text-pink-500" /> De qué va la serie
                </h2>
                <p className="text-gray-300 leading-relaxed text-lg">
                    {overview}
                </p>
            </section>
        )}

        {/* Análisis del Inglés (Si existe) */}
        {extraData && extraData.englishAnalysis && (
            <section className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl mb-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-300">
                    <Quote className="text-purple-400" /> Análisis del Inglés
                </h2>
                <p className="text-gray-300 leading-relaxed text-lg">
                    {extraData.englishAnalysis}
                </p>
            </section>
        )}

        {/* Lista de Episodios con Glassmorphism */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold border-b border-white/10 pb-4 inline-block drop-shadow-md">
              Desglose de Episodios
            </h2>
            
            {extraData && extraData.episodes && extraData.episodes.length > 0 && (
              <button
                onClick={() => {
                  let allVocab: any[] = [];
                  extraData.episodes.forEach((e: any) => {
                    if (e.vocabulary) {
                      allVocab = allVocab.concat(e.vocabulary);
                    }
                  });
                  if (allVocab.length > 0) {
                    setFlashcards(allVocab);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setShowFlashcards(true);
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <BookOpen size={20} /> Estudiar Temporada Completa
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movieData.episodes.map((ep: any, idx: number) => {
              const globalEpNum = idx + 1;
              
              let seasonNum = 1;
              let epNum = globalEpNum;
              
              const sMatch = ep.name.match(/S(\d+)E(\d+)/i);
              if (sMatch) {
                  seasonNum = parseInt(sMatch[1]);
                  epNum = parseInt(sMatch[2]);
              } else {
                  const specialMatch = ep.name.match(/Special\s+(\d+)/i);
                  if (specialMatch) {
                      seasonNum = 0;
                      epNum = parseInt(specialMatch[1]);
                  } else {
                      const epMatch = ep.name.match(/(?:EP|Episode)\s*#?(\d+)/i);
                      if (epMatch) epNum = parseInt(epMatch[1]);
                  }
              }
              
              // Map to TMDB (TMDB specials might use the special number directly)
              const tmdbEp = episodes[globalEpNum];
              
              let displayName = ep.name.replace(decodedTitle, "").replace(/[()]/g, "").trim() || ep.name;
              if (tmdbEp && tmdbEp.name && !tmdbEp.name.startsWith("Episodio")) {
                  displayName = tmdbEp.name;
              }

              return (
              <div 
                key={idx} 
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Episode Image Cover */}
                {tmdbEp && tmdbEp.still_path && (
                  <div className="w-full h-40 relative overflow-hidden">
                    <img src={tmdbEp.still_path} alt={displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex gap-1 flex-col text-right leading-tight">
                      <span>{seasonNum === 0 ? "Especial" : `Temp ${seasonNum}`}</span>
                      <span className="text-purple-300">Ep {epNum} (Global {globalEpNum})</span>
                    </div>
                  </div>
                )}

                <div className="relative z-10 p-6 flex-1 flex flex-col">
                  {!tmdbEp?.still_path && (
                    <div className="flex justify-end mb-2">
                      <div className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex gap-1 items-center border border-white/5">
                        <span>{seasonNum === 0 ? "Especial" : `Temp ${seasonNum}`}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-purple-300">Ep {epNum} (Global {globalEpNum})</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4 min-h-[56px]">
                    <h3 className="font-bold text-xl text-gray-100 group-hover:text-purple-300 transition-colors pr-4 line-clamp-2 leading-tight" title={displayName}>
                      {displayName}
                    </h3>
                    
                    {/* Difficulty Badge */}
                    {ep.level && (
                      <div className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${ep.level.includes('C') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : ep.level.includes('B') ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                        {ep.level}
                      </div>
                    )}
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

                  {/* Expand / Collapse Button */}
                  {(tmdbEp?.overview || (extraData?.episodes && extraData.episodes.find((e: any) => e.name === ep.name)?.englishAnalysis)) && (
                    <button 
                      onClick={() => setExpandedEp(expandedEp === idx ? null : idx)}
                      className="mt-4 text-sm text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      {expandedEp === idx ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                  )}

                  {/* Expanded Content */}
                  {expandedEp === idx && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in text-sm text-gray-300 space-y-3">
                      {tmdbEp?.overview && (
                        <div>
                          <strong className="text-white block mb-1">Sinopsis:</strong>
                          <p className="leading-relaxed">{tmdbEp.overview}</p>
                        </div>
                      )}
                      
                      {(() => {
                        const match = extraData?.episodes?.find((e: any) => e.name === ep.name || ep.name.includes(e.name) || displayName.includes(e.name));
                        return match?.englishAnalysis ? (
                          <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-xl mt-2">
                            <strong className="text-purple-300 block mb-1">Análisis del Inglés:</strong>
                            <p className="leading-relaxed text-purple-100">{match.englishAnalysis}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  
                  {/* Botón de Estudiar */}
                  {extraData && extraData.episodes && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                          <button
                              onClick={() => {
                                  const match = extraData.episodes.find((e: any) => e.name === ep.name || ep.name.includes(e.name) || displayName.includes(e.name));
                                  if (match && match.vocabulary && match.vocabulary.length > 0) {
                                      setFlashcards(match.vocabulary);
                                      setCurrentCardIndex(0);
                                      setIsFlipped(false);
                                      setShowFlashcards(true);
                                  } else {
                                      alert("No hay vocabulario disponible para este episodio aún.");
                                  }
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
                          >
                              <BookOpen size={18} /> Estudiar Vocabulario
                          </button>
                      </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>


      </div>

      {/* FLASHCARDS MODAL */}
      {showFlashcards && flashcards.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-6" onClick={() => setShowFlashcards(false)}>
              <div 
                  className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/50">
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                          <BookOpen className="text-emerald-400" /> Repaso de Vocabulario
                      </h2>
                      <div className="flex items-center gap-4">
                          <div className="bg-gray-800 rounded-lg p-1 flex">
                              <button 
                                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${studyMode === 'carousel' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                  onClick={() => setStudyMode('carousel')}
                              >
                                  Carrusel
                              </button>
                              <button 
                                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${studyMode === 'practice' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                  onClick={() => setStudyMode('practice')}
                              >
                                  Práctica
                              </button>
                          </div>
                          <button onClick={() => setShowFlashcards(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                      </div>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto custom-scrollbar">
                      
                      {/* Shuffle Button & Progress */}
                      <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-4 sm:mb-6">
                          <span className="text-gray-400 font-bold bg-gray-800 px-4 py-1 rounded-full shadow-inner border border-gray-700">
                              {currentCardIndex + 1} / {flashcards.length}
                          </span>
                          <button 
                              onClick={() => {
                                  const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
                                  setFlashcards(shuffled);
                                  setCurrentCardIndex(0);
                                  setIsFlipped(false);
                              }}
                              className="text-purple-300 hover:text-purple-100 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 px-4 py-1 rounded-full transition text-sm font-bold flex items-center gap-2"
                          >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                              Barajar
                          </button>
                      </div>

                      {/* Flashcard 3D Container */}
                      <div 
                          className="relative w-full max-w-2xl flex-1 min-h-[250px] sm:min-h-[300px] perspective-1000 cursor-pointer group"
                          onClick={() => setIsFlipped(!isFlipped)}
                      >
                          <div className={`w-full h-full duration-700 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                              
                              {/* Front (English) */}
                              <div className="absolute w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center transition group-hover:border-purple-500/50">
                                  <span className="absolute top-4 text-gray-500 uppercase tracking-widest text-xs font-bold">Inglés</span>
                                  <div className="w-full h-full pt-8 pb-8 flex items-center justify-center overflow-y-auto custom-scrollbar">
                                      <h3 className={`font-black text-white leading-tight break-words max-w-full ${flashcards[currentCardIndex]?.word?.length > 40 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
                                          {flashcards[currentCardIndex]?.word}
                                      </h3>
                                  </div>
                                  <p className="absolute bottom-4 text-purple-400/80 text-sm animate-pulse">Haz clic para voltear</p>
                              </div>

                              {/* Back (Spanish) */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-gray-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                                  <span className="absolute top-4 text-emerald-500/50 uppercase tracking-widest text-xs font-bold">Español</span>
                                  <div className="w-full h-full pt-8 pb-8 flex items-center justify-center overflow-y-auto custom-scrollbar">
                                      <h3 className={`font-bold text-emerald-100 leading-tight break-words max-w-full ${flashcards[currentCardIndex]?.translation?.length > 50 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>
                                          {flashcards[currentCardIndex]?.translation}
                                      </h3>
                                  </div>
                              </div>

                          </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-6 sm:mt-8 flex gap-4 w-full max-w-xl justify-center">
                          {studyMode === 'carousel' ? (
                              <>
                                  <button 
                                      onClick={() => {
                                          setIsFlipped(false);
                                          setTimeout(() => setCurrentCardIndex(prev => prev === 0 ? flashcards.length - 1 : prev - 1), 150);
                                      }}
                                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-lg border border-gray-600"
                                  >
                                      Anterior
                                  </button>
                                  <button 
                                      onClick={() => {
                                          setIsFlipped(false);
                                          setTimeout(() => setCurrentCardIndex(prev => prev === flashcards.length - 1 ? 0 : prev + 1), 150);
                                      }}
                                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                                  >
                                      Siguiente
                                  </button>
                              </>
                          ) : (
                              <div className="flex flex-col w-full gap-4">
                                  <div className="flex gap-4 w-full">
                                      <button 
                                          onClick={() => {
                                              setIsFlipped(false);
                                              setTimeout(() => setCurrentCardIndex(prev => prev === flashcards.length - 1 ? 0 : prev + 1), 150);
                                          }}
                                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2"
                                      >
                                          No la sé ❌
                                      </button>
                                      <button 
                                          onClick={() => {
                                              setIsFlipped(false);
                                              setTimeout(() => {
                                                  const newDeck = flashcards.filter((_, i) => i !== currentCardIndex);
                                                  if (newDeck.length === 0) {
                                                      alert("¡Felicidades! Has repasado todo el vocabulario activo.");
                                                      setShowFlashcards(false);
                                                  } else {
                                                      setFlashcards(newDeck);
                                                      setCurrentCardIndex(prev => prev >= newDeck.length ? 0 : prev);
                                                  }
                                              }, 150);
                                          }}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2"
                                      >
                                          Ya me la sé ✅
                                      </button>
                                  </div>
                                  <button 
                                      onClick={() => {
                                          setIsFlipped(false);
                                          setTimeout(() => setCurrentCardIndex(prev => prev === 0 ? flashcards.length - 1 : prev - 1), 150);
                                      }}
                                      className="w-full text-gray-400 hover:text-white transition text-sm font-medium py-2"
                                  >
                                      Volver a la palabra anterior
                                  </button>
                              </div>
                          )}
                      </div>

                  </div>
              </div>
          </div>
      )}

      {/* FLASHCARDS MODAL FOR POSTER */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedImage(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={selectedImage} alt="Expanded gallery" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()} />
        </div>
      )}


      {/* Required CSS for 3D flip added inline for convenience */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />

    </div>
  );
}
