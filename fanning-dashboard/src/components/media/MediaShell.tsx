'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';

// Estructura común de las páginas de película y serie: fondo difuminado,
// aviso +18 (si corresponde) y botón para volver a la portada.
export default function MediaShell({ backdropUrl, rating, tipo, children }: {
  backdropUrl?: string | null;
  rating?: string;
  tipo: 'película' | 'serie';
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [aceptado, setAceptado] = useState(false);
  const bloqueado = rating === '+18' && !aceptado;

  const volver = () => {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) router.back();
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden font-sans pb-20">
      <div className="fixed inset-0 z-0">
        {backdropUrl ? (
          <img src={tmdb(backdropUrl, 'w780')} alt="" decoding="async" className="w-full h-full object-cover opacity-40 scale-105" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-purple-900 to-black"></div>
        )}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/60 to-gray-950"></div>
      </div>

      {bloqueado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
          <div className="text-center max-w-md bg-gray-900 p-8 rounded-3xl border border-red-500/50 shadow-2xl shadow-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto mb-6 border border-red-500/20">
              <span className="text-3xl font-black">+18</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Contenido Explícito</h3>
            <p className="text-gray-400 text-base mb-8">
              Esta {tipo} ha sido clasificada para mayores de 18 años. El vocabulario y los diálogos pueden contener lenguaje soez, referencias sexuales o violencia extrema.
            </p>
            <button
              onClick={() => setAceptado(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-2xl w-full transition-all shadow-lg hover:shadow-red-500/50 mb-4"
            >
              Soy mayor de edad, continuar
            </button>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 font-medium transition-colors">
              Volver atrás
            </button>
          </div>
        </div>
      )}

      <div className={`relative z-10 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto transition-all duration-500 ${bloqueado ? 'blur-xl pointer-events-none opacity-40 select-none' : ''}`}>
        <button
          onClick={volver}
          className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-all mb-6 md:mb-8 text-sm sm:text-base w-fit"
        >
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>
        {children}
      </div>
    </div>
  );
}
