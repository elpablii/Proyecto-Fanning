"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Film } from 'lucide-react';
import { minuto } from '@/lib/formato';
import { numeroDeDia } from '@/lib/realeza';
import { tmdb } from '@/lib/tmdb';
import { useHoy } from '@/components/realeza/Cumpleanos';

// Una candidata a palabra o frase del día (las arma /diccionario/del-dia en el build).
export interface PalabraDelDia {
  palabra: string;
  traduccion: string;
  slug: string;
  titulo: string;
  href: string;               // la ficha del título
  poster: string | null;
  episodio: string | null;
  segundo: number | null;
  texto: string;              // la línea de los subtítulos donde apareció
  inicio: number;             // dónde está la entrada dentro de la línea
  fin: number;
  veces: number;              // cuántas veces se dice en el título (o el episodio)
  tanda: number;
  fecha: string | null;       // de la tanda: "2024-07-15"
}

// Las candidatas no vienen con la portada: se piden al abrirla (pesan unos 30 KB con gzip).
export default function PalabraDelDia({ hoy }: { hoy: string }) {
  const hoyNavegador = useHoy(hoy);
  const [candidatas, setCandidatas] = useState<PalabraDelDia[] | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    fetch('/diccionario/del-dia')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<PalabraDelDia[]>; })
      .then(lista => { if (vigente) setCandidatas(lista); })
      .catch(() => { if (vigente) setFallo(true); });
    return () => { vigente = false; };
  }, []);

  if (fallo || candidatas?.length === 0) return null;
  // Mientras llega, un hueco del mismo alto para que la portada no salte.
  if (!candidatas) return <div aria-hidden className="mb-10 h-44 sm:h-40 rounded-3xl border border-white/5 bg-gray-900/40 animate-pulse" />;

  const p = candidatas[numeroDeDia(hoyNavegador) % candidatas.length];
  const esFrase = p.palabra.trim().includes(' ');
  const lugar = [p.episodio, p.segundo !== null ? minuto(p.segundo) : null].filter(Boolean).join(' · ');

  return (
    <section aria-label={`${esFrase ? 'Frase' : 'Palabra'} del día: ${p.palabra}`}
      className="relative mb-10 overflow-hidden rounded-3xl border border-emerald-400/20 bg-gray-900/70 shadow-xl animate-fade-in">
      <div aria-hidden className="absolute inset-0 respirar" style={{ background: 'radial-gradient(ellipse at right, rgba(52,211,153,0.14), transparent 60%)' }} />
      <div className="relative flex gap-5 sm:gap-7 p-4 sm:p-6">
        <Link href={p.href} className="hidden sm:block shrink-0" title={p.titulo}>
          {p.poster
            ? <img src={tmdb(p.poster, 'w185')} alt={p.titulo} loading="lazy" className="w-20 md:w-24 aspect-2/3 rounded-xl object-cover border border-white/10 shadow-lg hover:scale-[1.03] transition-transform" />
            : <span className="flex w-20 md:w-24 aspect-2/3 rounded-xl bg-gray-800 items-center justify-center text-gray-600"><Film size={24} /></span>}
        </Link>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-emerald-300">
            <BookOpen size={14} aria-hidden /> {esFrase ? 'Frase del día' : 'Palabra del día'}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 lang="en" className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white break-words">{p.palabra}</h2>
            <p className="text-base sm:text-lg text-gray-300 break-words">{p.traduccion}</p>
          </div>

          <blockquote lang="en" className="mt-3 max-w-2xl text-sm sm:text-base text-gray-200 italic leading-snug">
            “{p.texto.slice(0, p.inicio)}
            <mark className="not-italic bg-emerald-400/25 text-emerald-100 rounded px-0.5">{p.texto.slice(p.inicio, p.fin)}</mark>
            {p.texto.slice(p.fin)}”
          </blockquote>
          <p className="mt-1.5 text-xs text-gray-400">
            <Link href={p.href} className="font-semibold text-gray-200 hover:underline">{p.titulo}</Link>
            {lugar && ` · ${lugar}`}
            {p.veces > 1 && ` · se dice ${p.veces} veces`}
            {` · aprendida en la ${p.tanda}° Tanda`}
          </p>

          <Link href={`/diccionario/${p.slug}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-300 hover:gap-2 transition-all">
            Ver en el diccionario <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
