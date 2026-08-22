import React, { useState, useEffect } from 'react';

interface Flashcard {
    word: string;
    translation: string;
    [key: string]: any;
}

interface FlashcardViewerProps {
    initialFlashcards: Flashcard[];
    onClose: () => void;
}

export default function FlashcardViewer({ initialFlashcards, onClose }: FlashcardViewerProps) {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyMode, setStudyMode] = useState<'carousel' | 'practice'>('carousel');

    useEffect(() => {
        setFlashcards(initialFlashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    }, [initialFlashcards]);

    if (!flashcards || flashcards.length === 0) return null;

    return (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex flex-col">
            <div className="p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/50">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setStudyMode('carousel')}
                        className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition ${studyMode === 'carousel' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        Modo Carrusel
                    </button>
                    <button 
                        onClick={() => setStudyMode('practice')}
                        className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition ${studyMode === 'practice' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        Modo Práctica
                    </button>
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 rounded-full p-2 sm:p-3 transition"
                >
                    ✕ Cerrar
                </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
                <div className="absolute top-8 text-gray-400 text-sm font-medium bg-gray-900/50 px-4 py-1 rounded-full border border-gray-800">
                    {currentCardIndex + 1} / {flashcards.length} palabras restantes
                </div>

                <div className="w-full max-w-2xl flex flex-col items-center justify-center h-full">
                    {/* Flashcard 3D Container */}
                    <div 
                        className="relative w-full max-w-2xl flex-1 min-h-[250px] perspective-[1000px] cursor-pointer group"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`w-full h-full duration-700 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                            
                            {/* Front (English) */}
                            <div className="absolute w-full h-full backface-hidden rounded-3xl bg-linear-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center p-6 text-center transition group-hover:border-purple-500/50">
                                <span className="absolute top-4 text-gray-500 uppercase tracking-widest text-xs font-bold">Inglés</span>
                                <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                                    {flashcards[currentCardIndex]?.word}
                                </h3>
                                <p className="absolute bottom-4 text-purple-400/80 text-sm animate-pulse">Haz clic para voltear</p>
                            </div>

                            {/* Back (Spanish) */}
                            <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-linear-to-br from-emerald-900/40 to-gray-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
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
                                                    onClose();
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
    );
}
