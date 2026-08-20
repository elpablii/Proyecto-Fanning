import os

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\series\[slug]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Loader2, ArrowLeft, Film, PlayCircle, BookOpen } from 'lucide-react';",
    "import { Loader2, ArrowLeft, Film, PlayCircle, BookOpen, Quote } from 'lucide-react';"
)

# 2. Add State
state_hook = """  const [images, setImages] = useState({ backdrop: '', poster: '' });

  const [extraData, setExtraData] = useState<any>(null);
  
  // Flashcards State
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'carousel' | 'practice'>('carousel');"""

content = content.replace("  const [images, setImages] = useState({ backdrop: '', poster: '' });", state_hook)

# 3. Add fetch for extraData
fetch_extra = """        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading manifest:", err);
        setLoading(false);
      });

    // Cargar extraData (vocabulario, analysis)
    fetch(`/data/pelis/${decodedTitle}.json`)
      .then(res => {
          if (res.ok) return res.json();
          throw new Error("No extra json");
      })
      .then(json => setExtraData(json))
      .catch(e => console.log("Sin JSON extra para esta serie"));"""

content = content.replace("""        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading manifest:", err);
        setLoading(false);
      });""", fetch_extra)

# 4. Add English Analysis
english_analysis = """        </div>

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

        {/* Lista de Episodios con Glassmorphism */}"""

content = content.replace("""        </div>

        {/* Lista de Episodios con Glassmorphism */}""", english_analysis)

# 5. Add Study Button
study_btn = """                    )}
                  </div>
                  
                  {/* Botón de Estudiar */}
                  {extraData && extraData.episodes && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                          <button
                              onClick={() => {
                                  const match = extraData.episodes.find((e: any) => e.name === ep.name);
                                  if (match && match.vocabulary && match.vocabulary.length > 0) {
                                      setFlashcards(match.vocabulary);
                                      setCurrentCardIndex(0);
                                      setIsFlipped(false);
                                      setShowFlashcards(true);
                                  } else {
                                      alert("No hay vocabulario extraído para este episodio aún.");
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
            ))}"""

content = content.replace("""                    )}
                  </div>
                </div>
              </div>
            ))}""", study_btn)

# 6. Add Flashcards modal
flashcards_modal = """
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
                          className="relative w-full max-w-2xl flex-1 min-h-[250px] perspective-1000 cursor-pointer group"
                          onClick={() => setIsFlipped(!isFlipped)}
                      >
                          <div className={`w-full h-full duration-700 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                              
                              {/* Front (English) */}
                              <div className="absolute w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center p-6 text-center transition group-hover:border-purple-500/50">
                                  <span className="absolute top-4 text-gray-500 uppercase tracking-widest text-xs font-bold">Inglés</span>
                                  <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                                      {flashcards[currentCardIndex]?.word}
                                  </h3>
                                  <p className="absolute bottom-4 text-purple-400/80 text-sm animate-pulse">Haz clic para voltear</p>
                              </div>

                              {/* Back (Spanish) */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-gray-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                                  <span className="absolute top-4 text-emerald-500/50 uppercase tracking-widest text-xs font-bold">Español</span>
                                  <h3 className="text-2xl sm:text-4xl font-bold text-emerald-100 leading-tight">
                                      {flashcards[currentCardIndex]?.translation}
                                  </h3>
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

      {/* Required CSS for 3D flip added inline for convenience */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />

    </div>
  );
}"""

content = content.replace("""      </div>
    </div>
  );
}""", flashcards_modal)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated series page.tsx")
