'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, Film, Info, Layers, Quote } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';
import { tmdb } from '@/lib/tmdb';
import { MovieStats } from '@/types/manifest';
import { ExtraData } from '@/types/media';
import MediaShell from '@/components/media/MediaShell';
import MediaHero from '@/components/media/MediaHero';
import { transicionPoster } from '@/lib/transiciones';
import RealezaEnTitulo, { brilloRealeza, type ArtistaEnTitulo } from '@/components/media/RealezaEnTitulo';
import ImageLightbox from '@/components/media/ImageLightbox';
import NivelMcer from '@/components/media/NivelMcer';
import FlashcardViewer from '@/components/ui/FlashcardViewer';

export default function PeliculaClient({ movieData, extraData, realeza }: { movieData: MovieStats; extraData: ExtraData | null; realeza: ArtistaEnTitulo[] }) {
  const [estudiando, setEstudiando] = useState(false);
  const [imagen, setImagen] = useState<string | null>(null);

  const vocabulario = extraData?.vocabulary ?? [];
  const fotos = extraData?.tmdb?.photos ?? [];
  const dialogos = movieData.dialogues ?? 0;
  const pct = comprension(dialogos, movieData.count);

  return (
    <MediaShell backdropUrl={movieData.backdropUrl} rating={movieData.rating} tipo="película">
      <MediaHero title={movieData.title} posterUrl={movieData.posterUrl} onPosterClick={setImagen} brillo={brilloRealeza(realeza)} transicion={transicionPoster('movie', movieData.title)}>
        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
          <div className="bg-purple-900/40 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
            <BookOpen size={24} className="mx-auto text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{miles(movieData.count)}</p>
            <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Palabras</p>
          </div>
          {dialogos > 0 && (
            <>
              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
                <Film size={24} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-white">{miles(dialogos)}</p>
                <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Líneas Diálogo</p>
              </div>
              <div className="bg-cyan-900/40 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50">
                <Info size={24} className="mx-auto text-cyan-400 mb-2" />
                <p className="text-2xl font-bold text-white">{porcentaje(pct)}</p>
                <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">Comprensión</p>
              </div>
            </>
          )}
          {movieData.duration && (
            <div className="bg-sky-900/40 border border-sky-500/30 rounded-2xl p-4 backdrop-blur-md text-center flex-1 min-w-35 max-w-50"
              title={extraData?.durationEstimated ? 'Estimada con los subtítulos' : undefined}>
              <Clock size={24} className="mx-auto text-sky-400 mb-2" />
              <p className="text-2xl font-bold text-white">{extraData?.durationEstimated ? '≈ ' : ''}{duracion(movieData.duration)}</p>
              <p className="text-xs text-sky-300 uppercase tracking-wider font-semibold">Duración</p>
            </div>
          )}
        </div>
      </MediaHero>

      <RealezaEnTitulo realeza={realeza} tipo="película" />

      {extraData?.levelDetail && <NivelMcer detalle={extraData.levelDetail} tipo="película" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Film className="text-pink-500" /> De qué va la película
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">{extraData?.tmdb?.overview || 'Sinopsis no disponible.'}</p>
          </section>

          {extraData?.englishAnalysis && (
            <section className="bg-linear-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-300">
                <Quote className="text-purple-400" /> Análisis del Inglés
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg">{extraData.englishAnalysis}</p>
            </section>
          )}

          {fotos.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Film className="text-blue-500" /> Galería
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fotos.map((url, i) => (
                  <div
                    key={url}
                    className="aspect-video rounded-xl overflow-hidden shadow-lg border border-white/10 group cursor-pointer"
                    onClick={() => setImagen(tmdb(url, 'original'))}
                  >
                    <img src={url} alt={`Foto ${i + 1} de ${movieData.title}`} width={780} height={439} loading="lazy" decoding="async" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <section className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl h-full max-h-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="text-emerald-400" /> Vocabulario Extraído
                </h2>
                <p className="text-sm text-gray-400 mt-2">Palabras y expresiones de la obra</p>
              </div>
              {vocabulario.length > 0 && (
                <button
                  onClick={() => setEstudiando(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-2 justify-center shadow-lg shadow-emerald-900/50"
                >
                  <Layers size={20} /> Estudiar
                </button>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {vocabulario.length > 0 ? (
                <div className="space-y-4">
                  {vocabulario.map((v, i) => (
                    <div key={i} className="group p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                      <p className="text-white font-medium text-base mb-1">{v.word}</p>
                      <p className="text-gray-400 text-sm italic">{v.translation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
                  <BookOpen size={48} className="mb-4 opacity-20" />
                  <p>Vocabulario no disponible aún<br />para esta película.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {estudiando && <FlashcardViewer cards={vocabulario} onClose={() => setEstudiando(false)} />}
      <ImageLightbox src={imagen} onClose={() => setImagen(null)} />
    </MediaShell>
  );
}
