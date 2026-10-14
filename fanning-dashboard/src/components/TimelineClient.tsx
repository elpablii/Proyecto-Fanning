"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, CalendarClock, Clock, Film, Gift, Image as ImageIcon, PartyPopper, Sparkles, SplitSquareHorizontal, Tv } from 'lucide-react';
import { duracion, miles, porcentaje } from '@/lib/formato';
import type { Ciclo, ItemTanda, Tanda } from '@/lib/data';

// Color según el % de comprensión
function colorComprension(pct: number | null): string {
  if (pct === null) return 'text-gray-400';
  if (pct >= 95) return 'text-emerald-400';
  if (pct >= 90) return 'text-cyan-400';
  if (pct >= 85) return 'text-yellow-400';
  return 'text-orange-400';
}

function fondoComprension(pct: number | null): string {
  if (pct === null) return 'bg-gray-600';
  if (pct >= 95) return 'bg-emerald-500';
  if (pct >= 90) return 'bg-cyan-500';
  if (pct >= 85) return 'bg-yellow-500';
  return 'bg-orange-500';
}

function colorNivel(nivel: string | null): string {
  if (!nivel) return 'bg-gray-700 text-gray-300';
  if (nivel.includes('C')) return 'bg-red-500/20 text-red-300 border border-red-500/30';
  if (nivel.includes('B2')) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
  if (nivel.includes('B')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
  return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
}

const ETIQUETAS = {
  gala: { texto: 'Tanda de Gala', icono: Sparkles, clase: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  navidad: { texto: 'Navidad', icono: Gift, clase: 'bg-red-500/15 text-red-300 border-red-500/30' },
  fin: { texto: 'Fin de Año', icono: PartyPopper, clase: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
};

function Cifra({ valor, texto, clase = 'text-white' }: { valor: string; texto: string; clase?: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg sm:text-xl font-bold ${clase}`}>{valor}</p>
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{texto}</p>
    </div>
  );
}

function TarjetaTitulo({ item }: { item: ItemTanda }) {
  const href = item.tipo === 'series' ? `/series/${encodeURIComponent(item.titulo)}` : `/peliculas/${encodeURIComponent(item.titulo)}`;
  return (
    <Link
      href={href}
      className="group/item flex gap-3 bg-gray-950/60 rounded-xl p-2.5 border border-gray-800/70 hover:border-purple-500/50 hover:bg-gray-900/80 transition-all"
    >
      {item.poster ? (
        <img src={item.poster.replace('/w500/', '/w185/')} alt={item.texto} loading="lazy"
          className="w-14 h-20 object-cover rounded-lg shadow-md shrink-0 group-hover/item:scale-105 transition-transform" />
      ) : (
        <div className="w-14 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 shrink-0">
          <ImageIcon size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1 flex flex-col">
        <p className="text-sm font-semibold text-gray-100 leading-tight line-clamp-2 group-hover/item:text-purple-300 transition-colors" title={item.titulo}>
          {item.texto}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {item.nivel && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorNivel(item.nivel)}`}>{item.nivel}</span>}
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            {item.tipo === 'series' ? <Tv size={11} /> : <Film size={11} />}
            {item.tipo === 'series' ? (item.episodios ? `${item.episodios} ep.` : 'Serie') : 'Película'}
          </span>
          {item.duracion && (
            <span className="text-[11px] text-gray-500 flex items-center gap-1" title={item.duracionEstimada ? 'Estimada con los subtítulos' : undefined}>
              <Clock size={11} /> {item.duracionEstimada ? '≈ ' : ''}{duracion(item.duracion)}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-auto">
          {miles(item.palabras)} palabras · {miles(item.lineas)} líneas ·{' '}
          <span className={`font-semibold ${colorComprension(item.comprension)}`}>{porcentaje(item.comprension, 1)}</span>
        </p>
      </div>
    </Link>
  );
}

function TarjetaTanda({ tanda, programada }: { tanda: Tanda; programada: boolean }) {
  const etiqueta = tanda.etiqueta ? ETIQUETAS[tanda.etiqueta] : null;
  const Icono = etiqueta?.icono;
  return (
    <div className="relative group animate-fade-in">
      <div className={`absolute -left-[31px] md:-left-[47px] top-6 w-4 h-4 rounded-full border-4 border-gray-950 z-10 transition-all duration-300 group-hover:scale-125 ${programada ? 'bg-gray-600' : 'bg-blue-500 group-hover:bg-purple-400 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.8)]'}`}></div>

      <div className={`bg-gray-900/50 backdrop-blur-md border rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/40 transition-all duration-300 hover:border-purple-500/40 ${programada ? 'border-dashed border-gray-700/70 opacity-80' : 'border-gray-700/50'}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-extrabold text-white">{tanda.title.replace(/\s*\((Gala|Navidad|Fin de Año)\)/, '')}</h3>
              {etiqueta && Icono && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${etiqueta.clase}`}>
                  <Icono size={12} /> {etiqueta.texto}
                </span>
              )}
              {tanda.dosSesiones && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-sky-500/30 text-sky-300 bg-sky-500/10 flex items-center gap-1"
                  title="Supera las 5 horas: se divide en dos sesiones (Día n-1 y Día n)">
                  <SplitSquareHorizontal size={12} /> Dos sesiones
                </span>
              )}
              {programada && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-600 text-gray-300 bg-gray-800/60 flex items-center gap-1">
                  <CalendarClock size={12} /> Programada
                </span>
              )}
            </div>
            <p className="text-sm text-blue-300 mt-1">{tanda.date}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 bg-gray-950/50 rounded-xl px-4 py-2 border border-gray-800/60 self-start">
            <Cifra valor={`${tanda.duracionEstimada ? '≈ ' : ''}${duracion(tanda.duracion)}`} texto="duración" />
            <Cifra valor={miles(tanda.palabras)} texto="palabras" />
            <Cifra valor={miles(tanda.lineas)} texto="líneas" />
            <Cifra valor={porcentaje(tanda.comprension, 1)} texto="comprensión" clase={colorComprension(tanda.comprension)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {tanda.items.map((item, i) => <TarjetaTitulo key={`${item.titulo}-${i}`} item={item} />)}
        </div>
      </div>
    </div>
  );
}

function EncabezadoCiclo({ ciclo, tandas }: { ciclo: Ciclo; tandas: Tanda[] }) {
  return (
    <div className="relative -ml-[45px] md:-ml-[61px] mb-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-900 border-4 border-blue-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 shrink-0">
          <span className="text-sm font-bold text-blue-400">{ciclo.anio}</span>
        </div>
        <div className="h-px bg-linear-to-r from-blue-500/50 to-transparent flex-1"></div>
      </div>
      <div className="ml-[45px] md:ml-[61px] bg-linear-to-br from-blue-950/60 via-gray-900/60 to-purple-950/50 border border-blue-500/20 rounded-2xl p-5 sm:p-6">
        <p className="text-xs uppercase tracking-widest text-blue-300/80 font-semibold">Ciclo {ciclo.anio}</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{ciclo.nombre || `Ciclo ${ciclo.anio}`}</h2>
        {ciclo.descripcion && <p className="text-gray-300 mt-2 text-sm sm:text-base max-w-3xl">{ciclo.descripcion}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">
          <Cifra valor={miles(ciclo.tandas)} texto="tandas" />
          <Cifra valor={miles(ciclo.titulos)} texto="títulos" />
          <Cifra valor={duracion(ciclo.duracion)} texto="de contenido" />
          <Cifra valor={miles(ciclo.palabras)} texto="palabras" />
          <Cifra valor={miles(ciclo.lineas)} texto="líneas" />
          <Cifra valor={porcentaje(ciclo.comprension, 1)} texto="comprensión" clase={colorComprension(ciclo.comprension)} />
        </div>
        {/* comprensión de cada tanda del ciclo, de izquierda a derecha */}
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Comprensión por tanda</p>
          <div className="flex items-end gap-1 h-14">
            {tandas.map(t => {
              const alto = Math.max(8, (((t.comprension ?? 75) - 75) / 25) * 100);
              return (
                <div key={t.id} className="flex-1 h-full flex items-end" title={`${t.title}: ${porcentaje(t.comprension, 1)}`}>
                  <div className={`w-full rounded-t ${fondoComprension(t.comprension)} opacity-80 hover:opacity-100 transition-opacity`} style={{ height: `${Math.min(alto, 100)}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// `hoy` llega del servidor (fecha del build): las tandas con fecha posterior se muestran como "Programada".
export default function TimelineClient({ ciclos, tandas, hoy }: { ciclos: Ciclo[]; tandas: Tanda[]; hoy: string }) {
  const [anio, setAnio] = useState<string>('all');

  const visibles = useMemo(() => ciclos.filter(c => anio === 'all' || c.anio === anio), [ciclos, anio]);
  const total = useMemo(() => {
    const palabras = tandas.reduce((s, t) => s + t.palabras, 0);
    const lineas = tandas.reduce((s, t) => s + t.lineas, 0);
    const titulos = tandas.reduce((s, t) => s + t.items.length, 0);
    const minutos = tandas.reduce((s, t) => s + t.duracion, 0);
    // las partes de una tanda (14a°, 14b°) son una sola tanda
    const cantidad = new Set(tandas.map(t => t.numero)).size;
    return { palabras, lineas, titulos, minutos, cantidad, comprension: lineas ? ((lineas - palabras) / lineas) * 100 : null };
  }, [tandas]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      <header className="mb-10 max-w-5xl mx-auto border-b border-gray-800 pb-8">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-4 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al Dashboard
        </Link>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
          <Calendar className="text-blue-500" size={36} /> Línea de Tiempo
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Cada tanda del proyecto, con lo que se vio y cuánto se entendió.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {[
            { v: miles(total.cantidad), t: 'tandas', icono: Calendar },
            { v: miles(total.titulos), t: 'títulos', icono: Film },
            { v: `${miles(Math.round(total.minutos / 60))} h`, t: 'de contenido', icono: Clock },
            { v: miles(total.palabras), t: 'palabras', icono: BookOpen },
            { v: miles(total.lineas), t: 'líneas', icono: Film },
            { v: porcentaje(total.comprension, 1), t: 'comprensión', icono: Sparkles },
          ].map(({ v, t, icono: Icono }) => (
            <div key={t} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
              <Icono size={18} className="text-blue-400 shrink-0" />
              <div>
                <p className={`text-lg font-bold ${t === 'comprensión' ? colorComprension(total.comprension) : 'text-white'}`}>{v}</p>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">{t}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {[{ anio: 'all', tandas: total.cantidad }, ...ciclos].map(c => (
            <button
              key={c.anio}
              onClick={() => setAnio(c.anio)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${anio === c.anio
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
              {c.anio === 'all' ? 'Todos los ciclos' : `Ciclo ${c.anio}`}
              <span className="ml-2 text-xs opacity-70">{c.tandas}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {visibles.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No hay tandas.</div>
        ) : (
          <div className="relative border-l-2 border-gray-800/80 ml-4 md:ml-6 pl-6 md:pl-10 space-y-10 pb-20">
            {visibles.map(ciclo => {
              const delCiclo = tandas.filter(t => t.anio === ciclo.anio);
              return (
                <section key={ciclo.anio} className="space-y-8">
                  <EncabezadoCiclo ciclo={ciclo} tandas={delCiclo} />
                  {delCiclo.map(t => <TarjetaTanda key={t.id} tanda={t} programada={t.fecha > hoy} />)}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
