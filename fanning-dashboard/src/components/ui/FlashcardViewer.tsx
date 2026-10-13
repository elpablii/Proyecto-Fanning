'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Shuffle, X } from 'lucide-react';
import { miles } from '@/lib/formato';
import { VocabItem } from '@/types/media';

// Barajado uniforme (Fisher–Yates): todas las órdenes son igual de probables.
function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Para empezar de nuevo con otras tarjetas, el padre le cambia la `key`.
export default function FlashcardViewer({ cards, onClose }: { cards: VocabItem[]; onClose: () => void }) {
  const [mazo, setMazo] = useState<VocabItem[]>(cards);
  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [modo, setModo] = useState<'carousel' | 'practice'>('carousel');
  const [terminado, setTerminado] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si se cierra el modal durante la animación, se cancela el cambio de tarjeta pendiente.
  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);

  // Voltea la tarjeta a su frente y, tras la animación, aplica el cambio.
  const despues = (cambio: () => void) => {
    setVolteada(false);
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(cambio, 150);
  };
  const siguiente = () => despues(() => setIndice(i => (i + 1) % mazo.length));
  const anterior = () => despues(() => setIndice(i => (i - 1 + mazo.length) % mazo.length));
  const yaLaSe = () => despues(() => {
    const resto = mazo.filter((_, i) => i !== indice);
    if (resto.length === 0) {
      setTerminado(true);
    } else {
      setMazo(resto);
      setIndice(i => (i >= resto.length ? 0 : i));
    }
  });

  const tarjeta = mazo[indice];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Repaso de vocabulario"
      >
        <div className="p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/50">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="text-emerald-400" /> Repaso de Vocabulario
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg p-1 flex">
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${modo === 'carousel' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setModo('carousel')}
              >
                Carrusel
              </button>
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${modo === 'practice' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setModo('practice')}
              >
                Práctica
              </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        {terminado ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
            <p className="text-5xl">🎉</p>
            <p className="text-2xl font-bold text-white">¡Felicidades! Repasaste todo el vocabulario.</p>
            <div className="flex gap-4">
              <button
                onClick={() => { setMazo(cards); setIndice(0); setTerminado(false); }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-2xl transition"
              >
                Repasar de nuevo
              </button>
              <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-2xl transition border border-gray-600">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
            <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-4 sm:mb-6">
              <span className="text-gray-400 font-bold bg-gray-800 px-4 py-1 rounded-full shadow-inner border border-gray-700">
                {miles(indice + 1)} / {miles(mazo.length)}
              </span>
              <button
                onClick={() => { setMazo(m => barajar(m)); setIndice(0); setVolteada(false); }}
                className="text-purple-300 hover:text-purple-100 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 px-4 py-1 rounded-full transition text-sm font-bold flex items-center gap-2"
              >
                <Shuffle size={16} /> Barajar
              </button>
            </div>

            <div
              className="relative w-full max-w-2xl flex-1 min-h-[250px] sm:min-h-[300px] perspective-1000 cursor-pointer group"
              onClick={() => setVolteada(v => !v)}
            >
              <div className={`w-full h-full duration-700 preserve-3d relative ${volteada ? 'rotate-y-180' : ''}`}>
                <div className="absolute w-full h-full backface-hidden rounded-3xl bg-linear-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center transition group-hover:border-purple-500/50">
                  <span className="absolute top-4 text-gray-500 uppercase tracking-widest text-xs font-bold">Inglés</span>
                  <div className="w-full h-full pt-8 pb-8 flex items-center justify-center overflow-y-auto">
                    <h3 className={`font-black text-white leading-tight break-words max-w-full ${tarjeta.word.length > 40 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
                      {tarjeta.word}
                    </h3>
                  </div>
                  <p className="absolute bottom-4 text-purple-400/80 text-sm animate-pulse">Haz clic para voltear</p>
                </div>
                <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-linear-to-br from-emerald-900/40 to-gray-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                  <span className="absolute top-4 text-emerald-500/50 uppercase tracking-widest text-xs font-bold">Español</span>
                  <div className="w-full h-full pt-8 pb-8 flex items-center justify-center overflow-y-auto">
                    <h3 className={`font-bold text-emerald-100 leading-tight break-words max-w-full ${tarjeta.translation.length > 50 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>
                      {tarjeta.translation}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex gap-4 w-full max-w-xl justify-center">
              {modo === 'carousel' ? (
                <>
                  <button onClick={anterior} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-lg border border-gray-600">
                    Anterior
                  </button>
                  <button onClick={siguiente} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                    Siguiente
                  </button>
                </>
              ) : (
                <div className="flex flex-col w-full gap-4">
                  <div className="flex gap-4 w-full">
                    <button onClick={siguiente} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2">
                      No la sé ❌
                    </button>
                    <button onClick={yaLaSe} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition shadow-[0_0_20px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2">
                      Ya me la sé ✅
                    </button>
                  </div>
                  <button onClick={anterior} className="w-full text-gray-400 hover:text-white transition text-sm font-medium py-2">
                    Volver a la palabra anterior
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
