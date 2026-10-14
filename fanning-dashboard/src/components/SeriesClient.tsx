'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, Film, PlayCircle, Quote } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';
import { MovieStats } from '@/types/manifest';
import { ExtraData, VocabItem } from '@/types/media';
import MediaShell from '@/components/media/MediaShell';
import MediaHero from '@/components/media/MediaHero';
import ImageLightbox from '@/components/media/ImageLightbox';
import NivelMcer from '@/components/media/NivelMcer';
import FlashcardViewer from '@/components/ui/FlashcardViewer';

// "S02E05" -> temporada 2, episodio 5; "SP01" -> especial 1 (temporada 0).
function partesDelCodigo(code?: string): { temporada: number; numero: number } | null {
  const m = code?.match(/^S(\d+)E(\d+)$/);
  if (m) return { temporada: Number(m[1]), numero: Number(m[2]) };
  const sp = code?.match(/^SP(\d+)$/);
  return sp ? { temporada: 0, numero: Number(sp[1]) } : null;
}

function claseNivel(nivel: string): string {
  if (nivel.includes('C')) return 'bg-red-500/20 text-red-300 border border-red-500/30';
  if (nivel.includes('B')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
  return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
}

export default function SeriesClient({ movieData, extraData }: { movieData: MovieStats; extraData: ExtraData | null }) {
  const [tarjetas, setTarjetas] = useState<VocabItem[] | null>(null);
  const [mazo, setMazo] = useState(0);  // cambia la `key` del visor para empezar de cero
  const [abierto, setAbierto] = useState<string | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);

  const tmdbEpisodios = extraData?.tmdb?.episodes ?? {};
  const episodiosExtra = useMemo(
    () => new Map((extraData?.episodes ?? []).map(e => [e.code, e])),
    [extraData],
  );
  const totalDialogos = movieData.dialogues ?? 0;

  const porTemporada = useMemo(() => {
    const suma: Record<string, number> = {};
    for (const ep of movieData.episodes) {
      const p = partesDelCodigo(ep.code);
      const clave = p && p.temporada > 0 ? `Temporada ${p.temporada}` : 'Especiales';
      if (ep.dialogues) suma[clave] = (suma[clave] ?? 0) + ep.dialogues;
    }
    return suma;
  }, [movieData.episodes]);
  const variasTemporadas = Object.keys(porTemporada).filter(k => k !== 'Especiales').length > 1;

  const estudiar = (cartas: VocabItem[]) => {
    setTarjetas(cartas);
    setMazo(n => n + 1);
  };
  const todoElVocabulario = (extraData?.episodes ?? []).flatMap(e => e.vocabulary);

  return (
    <MediaShell backdropUrl={movieData.backdropUrl} rating={movieData.rating} tipo="serie">
      <MediaHero title={movieData.title} posterUrl={movieData.posterUrl} onPosterClick={setImagen}>
        <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 items-center text-sm sm:text-base md:text-lg">
          <span className="flex items-center gap-2 bg-purple-600/30 border border-purple-400/30 text-purple-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
            <BookOpen size={16} className="sm:w-5 sm:h-5" /> {miles(movieData.count)} Palabras Globales
          </span>
          <span className="flex items-center gap-2 bg-pink-600/30 border border-pink-400/30 text-pink-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
            <PlayCircle size={16} className="sm:w-5 sm:h-5" /> {miles(movieData.episodes.length)} Episodios Analizados
          </span>
          {totalDialogos > 0 && (
            <span className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
              <Film size={20} /> {miles(totalDialogos)} Líneas Totales de la Serie
            </span>
          )}
          {movieData.duration && (
            <span className="flex items-center gap-2 bg-sky-600/30 border border-sky-400/30 text-sky-200 px-4 py-2 rounded-full backdrop-blur-md font-medium">
              <Clock size={16} className="sm:w-5 sm:h-5" /> {extraData?.durationEstimated ? '≈ ' : ''}{duracion(movieData.duration)} de visionado
            </span>
          )}
        </div>
        {variasTemporadas && totalDialogos > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
            {Object.entries(porTemporada).map(([temporada, lineas]) => (
              <span key={temporada} className="text-xs sm:text-sm bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full border border-gray-600/50 backdrop-blur-md">
                {temporada}: {miles(lineas)} líneas
              </span>
            ))}
          </div>
        )}
      </MediaHero>

      {extraData?.levelDetail && <NivelMcer detalle={extraData.levelDetail} tipo="serie" />}

      <section className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Film className="text-pink-500" /> De qué va la serie
        </h2>
        <p className="text-gray-300 leading-relaxed text-lg">{extraData?.tmdb?.overview || 'Sinopsis no disponible.'}</p>
      </section>

      {extraData?.englishAnalysis && (
        <section className="bg-linear-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-300">
            <Quote className="text-purple-400" /> Análisis del Inglés
          </h2>
          <p className="text-gray-300 leading-relaxed text-lg">{extraData.englishAnalysis}</p>
        </section>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold border-b border-white/10 pb-4 inline-block drop-shadow-md">Desglose de Episodios</h2>
          {todoElVocabulario.length > 0 && (
            <button
              onClick={() => estudiar(todoElVocabulario)}
              className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <BookOpen size={20} /> Estudiar Temporada Completa
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movieData.episodes.map((ep, idx) => {
            const global = idx + 1;
            const partes = partesDelCodigo(ep.code) ?? { temporada: 1, numero: global };
            const tmdbEp = ep.code ? tmdbEpisodios[ep.code] : undefined;
            const extraEp = ep.code ? episodiosExtra.get(ep.code) : undefined;
            const etiqueta = partes.temporada === 0 ? 'Especial' : `Temp ${partes.temporada}`;
            const nombre = tmdbEp?.name && !tmdbEp.name.startsWith('Episodio')
              ? tmdbEp.name
              : ep.name.replace(movieData.title, '').replace(/[()]/g, '').trim() || ep.name;
            const pct = comprension(ep.dialogues, ep.count);
            const clave = ep.code ?? String(global);

            return (
              <div
                key={clave}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col"
              >
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {tmdbEp?.still_path ? (
                  <div className="w-full h-40 relative overflow-hidden">
                    <img src={tmdbEp.still_path} alt={nombre} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex gap-1 flex-col text-right leading-tight">
                      <span>{etiqueta}</span>
                      <span className="text-purple-300">Ep {partes.numero} (Global {global})</span>
                    </div>
                  </div>
                ) : null}

                <div className="relative z-10 p-6 flex-1 flex flex-col">
                  {!tmdbEp?.still_path && (
                    <div className="flex justify-end mb-2">
                      <div className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex gap-1 items-center border border-white/5">
                        <span>{etiqueta}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-purple-300">Ep {partes.numero} (Global {global})</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4 min-h-[56px]">
                    <h3 className="font-bold text-xl text-gray-100 group-hover:text-purple-300 transition-colors pr-4 line-clamp-2 leading-tight" title={nombre}>
                      {nombre}
                    </h3>
                    {ep.level && (
                      <div className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${claseNivel(ep.level)}`}>{ep.level}</div>
                    )}
                  </div>

                  <div className="flex flex-col mt-auto gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">No entendidas:</span>
                      <span className="text-xl font-black bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
                        {miles(ep.count)} <span className="text-sm font-medium text-gray-500">palabras</span>
                      </span>
                    </div>
                    {ep.duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Duración:</span>
                        <span className="text-sky-300 font-semibold text-sm">{extraEp?.durationEstimated ? '≈ ' : ''}{duracion(ep.duration)}</span>
                      </div>
                    )}
                    {pct !== null && (
                      <>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                          <span className="text-gray-400 text-sm">Líneas de diálogo:</span>
                          <span className="text-emerald-400 font-bold">{miles(ep.dialogues)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-400 text-sm">Comprensión:</span>
                          <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-sm">
                            {porcentaje(pct)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {(tmdbEp?.overview || extraEp?.englishAnalysis) && (
                    <button
                      onClick={() => setAbierto(abierto === clave ? null : clave)}
                      className="mt-4 text-sm text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      {abierto === clave ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                  )}

                  {abierto === clave && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in text-sm text-gray-300 space-y-3">
                      {tmdbEp?.overview && (
                        <div>
                          <strong className="text-white block mb-1">Sinopsis:</strong>
                          <p className="leading-relaxed">{tmdbEp.overview}</p>
                        </div>
                      )}
                      {extraEp?.englishAnalysis && (
                        <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-xl mt-2">
                          <strong className="text-purple-300 block mb-1">Análisis del Inglés:</strong>
                          <p className="leading-relaxed text-purple-100">{extraEp.englishAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => extraEp && estudiar(extraEp.vocabulary)}
                      disabled={!extraEp?.vocabulary.length}
                      title={extraEp?.vocabulary.length ? undefined : 'No hay vocabulario disponible para este episodio aún.'}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
                    >
                      <BookOpen size={18} /> Estudiar Vocabulario
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tarjetas && <FlashcardViewer key={mazo} cards={tarjetas} onClose={() => setTarjetas(null)} />}
      <ImageLightbox src={imagen} onClose={() => setImagen(null)} />
    </MediaShell>
  );
}
