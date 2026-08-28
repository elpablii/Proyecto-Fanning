/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Film, BookOpen, Quote, Info, Edit2 } from 'lucide-react';
import FlashcardViewer from '@/components/ui/FlashcardViewer';

export default function PeliculaClient({ slug, initialMovieData, initialExtraData }: { slug: string, initialMovieData: any, initialExtraData: any }) {
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const posterUrl = movieData?.posterUrl || null;
  const backdropUrl = movieData?.backdropUrl || null;
  const overview = extraData?.tmdb?.overview || 'Sinopsis no disponible.';
  const photos = extraData?.tmdb?.photos || [];

  if (!movieData) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white">
        <h1 className="text-4xl font-bold mb-4">Película no encontrada</h1>
        <button onClick={() => router.push('/')} className="bg-purple-600 px-6 py-2 rounded-full hover:bg-purple-700 transition">
          Volver al Inicio
        </button>
      </div>
    );
  }

  const totalDialogues = movieData.dialogues || 0;
  const unknownWords = movieData.count || 0;
  let comprehensionPct = 0;
  if (totalDialogues > 0) {
      comprehensionPct = ((totalDialogues - unknownWords) / totalDialogues) * 100;
      if (comprehensionPct >= 99.445) comprehensionPct = 100;
  }

  const currentVocabulary = extraData?.vocabulary || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden font-sans pb-20">
      
      {/* Background Dinámico (Glassmorphism Base) */}
      <div className="fixed inset-0 z-0">
        {backdropUrl ? (
          <img src={backdropUrl} alt="Backdrop" className="w-full h-full object-cover opacity-40 scale-105" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-purple-900 to-black"></div>
        )}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/60 to-gray-950"></div>
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        
        {/* Navegación y Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <button 
                onClick={() => {
                    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                        router.back();
                    } else {
                        router.push('/');
                    }
                }} 
                className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-all text-sm sm:text-base w-fit"
            >
                <ArrowLeft size={18} /> Volver al Dashboard
            </button>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        const tmdbId = window.prompt(`[SISTEMA MANUAL]\nIntroduce el ID de TMDB para la película "${decodedTitle}":`);
                        if (tmdbId && tmdbId.trim() !== '') {
                            let saved: Record<string, string> = {};
                            try {
                                const str = localStorage.getItem('tmdb_manual_overrides');
                                if (str) saved = JSON.parse(str);
                            } catch(_) {}
                            saved[decodedTitle] = tmdbId.trim();
                            localStorage.setItem('tmdb_manual_overrides', JSON.stringify(saved));
                            window.location.reload();
                        }
                    }} 
                    className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5 hover:border-white/20 transition-all text-xs"
                >
                    <Edit2 size={14} /> Corregir TMDB
                </button>
            </div>
        </div>

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
            <div className="w-48 md:w-64 lg:w-72 aspect-2/3 bg-white/10 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Film size={48} className="text-white/50" />
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 drop-shadow-lg text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
              {decodedTitle}
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="bg-purple-900/40 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
                <BookOpen size={24} className="mx-auto text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{unknownWords.toLocaleString()}</p>
                <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Palabras</p>
              </div>

              {totalDialogues > 0 && (
                <>
                  <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
                    <Film size={24} className="mx-auto text-emerald-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{totalDialogues.toLocaleString()}</p>
                    <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Líneas Diálogo</p>
                  </div>
                  <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
                    <Info size={24} className="mx-auto text-cyan-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{comprehensionPct.toFixed(2)}%</p>
                    <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">Comprensión</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-10">
                {/* Sinopsis */}
                <section className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Film className="text-pink-500" /> De qué va la película
                    </h2>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        {overview}
                    </p>
                </section>

                {/* Inglés */}
                {extraData && extraData.englishAnalysis && (
                    <section className="bg-linear-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-300">
                            <Quote className="text-purple-400" /> Análisis del Inglés
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            {extraData.englishAnalysis}
                        </p>
                    </section>
                )}

                {/* Galería */}
                {photos && photos.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Film className="text-blue-500" /> Galería
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {photos.map((url: string, i: number) => (
                                <div 
                                    key={i} 
                                    className="aspect-video rounded-xl overflow-hidden shadow-lg border border-white/10 group cursor-pointer"
                                    onClick={() => setSelectedImage(url.replace('w780', 'original'))}
                                >
                                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Sidebar Column: Vocabulario */}
            <div className="lg:col-span-1">
                <section className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl h-full max-h-200 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BookOpen className="text-emerald-400" /> Vocabulario Extraído
                                </h2>
                                <p className="text-sm text-gray-400 mt-2">Palabras y expresiones de la obra</p>
                            </div>
                            {currentVocabulary.length > 0 && (
                                <button 
                                    onClick={() => {
                                        setFlashcards(currentVocabulary);
                                        setCurrentCardIndex(0);
                                        setIsFlipped(false);
                                        setShowFlashcards(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-2 justify-center shadow-lg shadow-emerald-900/50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    Estudiar
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {currentVocabulary.length > 0 ? (
                            <div className="space-y-4">
                                {currentVocabulary.map((v: any, i: number) => (
                                    <div key={i} className="group p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                        <p className="text-white font-medium text-base mb-1">{v.word}</p>
                                        <p className="text-gray-400 text-sm italic">{v.translation}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
                                <BookOpen size={48} className="mb-4 opacity-20" />
                                <p>Vocabulario no disponible aún<br/>para esta película.</p>
                            </div>
                        )}
                    </div>
                </section>
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
                          className="relative w-full max-w-2xl flex-1 min-h-[300px] perspective-1000 cursor-pointer group"
                          onClick={() => setIsFlipped(!isFlipped)}
                      >
                          <div className={`w-full h-full duration-700 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                              
                              {/* Front (English) */}
                              <div className="absolute w-full h-full backface-hidden rounded-3xl bg-linear-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center transition group-hover:border-purple-500/50">
                                  <span className="absolute top-4 text-gray-500 uppercase tracking-widest text-xs font-bold">Inglés</span>
                                  <div className="w-full h-full pt-8 pb-8 flex items-center justify-center overflow-y-auto custom-scrollbar">
                                      <h3 className={`font-black text-white leading-tight break-words max-w-full ${flashcards[currentCardIndex]?.word?.length > 40 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
                                          {flashcards[currentCardIndex]?.word}
                                      </h3>
                                  </div>
                                  <p className="absolute bottom-4 text-purple-400/80 text-sm animate-pulse">Haz clic para voltear</p>
                              </div>

                              {/* Back (Spanish) */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-linear-to-br from-emerald-900/40 to-gray-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center">
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
                                              // Remove current card from deck
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

      {/* LIGHTBOX MODAL PARA IMÁGENES */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] flex items-center justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 transition-colors bg-white/10 hover:bg-white/20 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
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
